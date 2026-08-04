/* =====================================================================
   crud.js — Router CRUD genérico por tabela (DRY, sem over-engineering).
   Cada entidade declara metadados; o router gera GET/POST/PUT/DELETE.
   Validação leve de tipos + proteção contra SQL injection (sempre
   parametrizado). FKs resolvidas em leitura via "joins" opcionais.
   ===================================================================== */
const express = require('express');
const { query } = require('./db');
const fs = require('fs');
const path = require('path');

// Diretório onde os arquivos de documentos são salvos
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
function ensureUploadDir() { try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (_) {} }

// Tipos aceitos para coerção/validação básica
const T = { text: 'text', num: 'num', date: 'date', int: 'int' };

/**
 * @param {string} table  nome da tabela
 * @param {object} cols   {coluna: tipo} colunas editáveis (exclui PK 'id')
 * @param {object} [opts] { readSelect, readFrom, readWhere, orderBy, fileUpload }
 *   fileUpload: true → espera multipart/form-data; salva o arquivo em uploads/
 *   e grava 'caminho_arquivo' + 'tamanho' automaticamente.
 */
function makeCrud(table, cols, opts = {}) {
  const router = express.Router();
  const readSelect = opts.readSelect || `SELECT * FROM ${table}`;
  const orderBy = opts.orderBy ? ` ORDER BY ${opts.orderBy}` : '';
  const colNames = Object.keys(cols);

  // Upload de arquivo (documentos) — multer salva em uploads/ com nome único
  let uploadMid = null;
  if (opts.fileUpload) {
    ensureUploadDir();
    const multer = require('multer');
    const storage = multer.diskStorage({
      destination: (_, __, cb) => cb(null, UPLOAD_DIR),
      filename: (_, f, cb) => {
        const ext = path.extname(f.originalname).slice(0, 12).replace(/[^.a-zA-Z0-9]/g, '');
        cb(null, Date.now() + '_' + Math.round(Math.random() * 1e6) + ext);
      },
    });
    uploadMid = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } }).single('arquivo');
  }

  // LISTAR
  router.get('/', async (req, res) => {
    try {
      const r = await query(readSelect + orderBy);
      res.json(r.rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // BUSCAR UM
  router.get('/:id', async (req, res) => {
    try {
      const r = await query(`SELECT * FROM ${table} WHERE id=$1`, [req.params.id]);
      if (!r.rows.length) return res.status(404).json({ error: 'Não encontrado' });
      res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // CRIAR
  const postHandler = async (req, res) => {
    try {
      const fields = [], vals = [], ph = [];
      let i = 1;
      const getVal = (c) => {
        // upload: o arquivo vem em req.file; campos de texto em req.body
        if (opts.fileUpload && c === 'caminho_arquivo') {
          if (req.file) { fields.push(c); vals.push('/uploads/' + req.file.filename); ph.push('$' + i++); }
          return;
        }
        if (opts.fileUpload && c === 'tamanho') {
          if (req.file) { fields.push(c); vals.push(req.file.size + ' B'); ph.push('$' + i++); }
          return;
        }
        if (!(c in req.body)) return;
        fields.push(c);
        vals.push(coerce(cols[c], req.body[c]));
        ph.push('$' + i++);
      };
      for (const c of colNames) getVal(c);
      if (!fields.length) return res.status(400).json({ error: 'Nenhum campo válido' });
      const r = await query(
        `INSERT INTO ${table} (${fields.join(',')}) VALUES (${ph.join(',')}) RETURNING *`, vals);
      res.status(201).json(r.rows[0]);
    } catch (e) { res.status(400).json({ error: e.message }); }
  };
  router.post('/', uploadMid || postHandler, uploadMid ? postHandler : (req, res, next) => postHandler(req, res, next));

  // ATUALIZAR
  router.put('/:id', async (req, res) => {
    try {
      const sets = [], vals = []; let i = 1;
      for (const c of colNames) {
        if (!(c in req.body)) continue;
        sets.push(`${c}=$${i}`);
        vals.push(coerce(cols[c], req.body[c]));
        i++;
      }
      if (!sets.length) return res.status(400).json({ error: 'Nenhum campo p/ atualizar' });
      vals.push(req.params.id);
      const r = await query(
        `UPDATE ${table} SET ${sets.join(',')} WHERE id=$${i} RETURNING *`, vals);
      if (!r.rows.length) return res.status(404).json({ error: 'Não encontrado' });
      res.json(r.rows[0]);
    } catch (e) { res.status(400).json({ error: e.message }); }
  });

  // EXCLUIR
  router.delete('/:id', async (req, res) => {
    try {
      const r = await query(`DELETE FROM ${table} WHERE id=$1 RETURNING id`, [req.params.id]);
      if (!r.rows.length) return res.status(404).json({ error: 'Não encontrado' });
      res.json({ ok: true, id: Number(req.params.id) });
    } catch (e) { res.status(400).json({ error: e.message }); }
  });

  return router;
}

function coerce(tipo, v) {
  if (v === null || v === undefined || v === '') {
    // numéricos/date vazios viram null (permitido em alguns campos)
    if (tipo === T.num || tipo === T.int || tipo === T.date) return null;
    return null;
  }
  if (tipo === T.num || tipo === T.int) {
    const n = Number(String(v).replace(/[^\d.-]/g, ''));
    if (isNaN(n)) throw new Error('Valor numérico inválido: ' + v);
    return tipo === T.int ? Math.trunc(n) : n;
  }
  if (tipo === T.date) {
    // aceita YYYY-MM-DD ou objeto Date
    const d = new Date(v);
    if (isNaN(d.getTime())) throw new Error('Data inválida: ' + v);
    return d.toISOString().slice(0, 10);
  }
  return String(v);
}

module.exports = { makeCrud, T };
