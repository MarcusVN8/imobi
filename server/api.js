/* =====================================================================
   api.js — montagem das rotas /api/*
   Cada entidade usa o CRUD genérico; leituras com JOIN recebem readSelect.
   ===================================================================== */
const express = require('express');
const { makeCrud, T } = require('./crud');
const { query } = require('./db');
const router = express.Router();

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmt = (n) => (n == null ? 'R$ 0' : BRL.format(Number(n)));

// ---------- CRUDs ----------
router.use('/imoveis', makeCrud('imoveis', {
  codigo: T.text, endereco: T.text, cidade: T.text, tipo: T.text,
  valor: T.num, status: T.text, proprietario: T.text,
}, { orderBy: 'codigo' }));

router.use('/proprietarios', makeCrud('proprietarios', {
  nome: T.text, doc: T.text, email: T.text, tel: T.text,
  imoveis_count: T.int, banco: T.text,
}, { orderBy: 'nome' }));

router.use('/contratos', makeCrud('contratos', {
  codigo: T.text, imovel_id: T.int, proprietario: T.text, inquilino: T.text,
  aluguel: T.num, iptu: T.num, condominio: T.num, inicio: T.date, fim: T.date, status: T.text,
}, {
  orderBy: 'codigo',
  readSelect: `SELECT c.*, i.codigo AS imovel_codigo FROM contratos c LEFT JOIN imoveis i ON i.id=c.imovel_id`,
}));

router.use('/inquilinos', makeCrud('inquilinos', {
  nome: T.text, cpf: T.text, tel: T.text, email: T.text, profissao: T.text,
  renda: T.num, contrato_id: T.int, status: T.text,
}, { orderBy: 'nome' }));

router.use('/cobrancas', makeCrud('cobrancas', {
  codigo: T.text, cliente: T.text, contrato_id: T.int, vencimento: T.date,
  valor: T.num, tipo: T.text, status: T.text,
}, {
  orderBy: 'vencimento',
  readSelect: `SELECT cb.*, ct.codigo AS contrato_codigo FROM cobrancas cb LEFT JOIN contratos ct ON ct.id=cb.contrato_id`,
}));

router.use('/lancamentos', makeCrud('lancamentos', {
  data: T.date, descricao: T.text, categoria: T.text, valor: T.num, status: T.text,
}, { orderBy: 'data' }));

router.use('/manutencoes', makeCrud('manutencoes', {
  codigo: T.text, titulo: T.text, imovel_id: T.int, fornecedor: T.text,
  prioridade: T.text, status: T.text, valor: T.num,
}, {
  orderBy: 'codigo',
  readSelect: `SELECT m.*, i.codigo AS imovel_codigo FROM manutencoes m LEFT JOIN imoveis i ON i.id=m.imovel_id`,
}));

router.use('/documentos', makeCrud('documentos', {
  nome: T.text, tipo: T.text, imovel_id: T.int, tamanho: T.text, icone: T.text, tom: T.text, caminho_arquivo: T.text,
}, {
  orderBy: 'nome',
  fileUpload: true,
  readSelect: `SELECT d.*, i.codigo AS imovel_codigo FROM documentos d LEFT JOIN imoveis i ON i.id=d.imovel_id`,
}));

router.use('/eventos', makeCrud('eventos', {
  dia: T.int, titulo: T.text, tipo: T.text, hora: T.text,
}, { orderBy: 'dia' }));

router.use('/usuario', makeCrud('usuario', {
  nome: T.text, cargo: T.text, email: T.text,
}, { orderBy: 'id' }));

// ---------- Séries de gráficos (editáveis) ----------
router.get('/series/receita', async (_, r) => { const x = await query('SELECT mes, valor FROM serie_receita ORDER BY id'); r.json(x.rows); });
router.get('/series/fluxo', async (_, r) => { const x = await query('SELECT mes, receita, despesa FROM serie_fluxo ORDER BY id'); r.json(x.rows); });
router.get('/series/ocupacao', async (_, r) => { const x = await query('SELECT mes, valor FROM serie_ocupacao ORDER BY id'); r.json(x.rows); });
router.get('/series/pizza', async (_, r) => { const x = await query('SELECT label, valor, cor FROM pizza_portfolio ORDER BY id'); r.json(x.rows); });
router.put('/series/fluxo', async (req, r) => {
  try {
    const { mes, receita, despesa } = req.body;
    const x = await query('UPDATE serie_fluxo SET receita=$2, despesa=$3 WHERE mes=$1 RETURNING *', [mes, Number(receita), Number(despesa)]);
    r.json(x.rows[0]);
  } catch (e) { r.status(400).json({ error: e.message }); }
});

// ---------- Dashboard KPIs (agregados) ----------
router.get('/dashboard/kpis', async (_, r) => {
  try {
    const [tot, disp, alug, atraso, contrAtivos, aReceber, receitaMes] = await Promise.all([
      query('SELECT COUNT(*) n FROM imoveis'),
      query("SELECT COUNT(*) n FROM imoveis WHERE status='Disponível'"),
      query("SELECT COUNT(*) n FROM imoveis WHERE status='Alugado'"),
      query("SELECT COUNT(*) n, COALESCE(SUM(valor),0) v FROM cobrancas WHERE status='Atrasado'"),
      query("SELECT COUNT(*) n FROM contratos WHERE status='Ativo'"),
      query("SELECT COALESCE(SUM(valor),0) v FROM cobrancas WHERE status='Pendente'"),
      query('SELECT COALESCE(SUM(receita),0) v FROM serie_fluxo WHERE mes=(SELECT mes FROM serie_fluxo ORDER BY id DESC LIMIT 1)'),
    ]);
    const ocupacao = await query('SELECT valor FROM serie_ocupacao ORDER BY id DESC LIMIT 1');
    const kpis = [
      { label: 'Total de imóveis', value: String(tot.rows[0].n), hint: 'no portfólio', icon: 'Building2', tone: 'primary' },
      { label: 'Disponíveis', value: String(disp.rows[0].n), hint: 'prontos p/ locar', icon: 'Home', tone: 'success' },
      { label: 'Alugados', value: String(alug.rows[0].n), hint: 'com contrato ativo', icon: 'Key', tone: 'primary' },
      { label: 'Receita do mês', value: fmt(receitaMes.rows[0].v), hint: '+18% vs ano ant.', icon: 'DollarSign', tone: 'success' },
      { label: 'A receber', value: fmt(aReceber.rows[0].v), hint: 'próx. 15 dias', icon: 'Clock', tone: 'warning' },
      { label: 'Em atraso', value: fmt(atraso.rows[0].v), hint: atraso.rows[0].n + ' cliente(s)', icon: 'AlertCircle', tone: 'danger' },
      { label: 'Contratos ativos', value: String(contrAtivos.rows[0].n), hint: 'vigentes', icon: 'FileText', tone: 'primary' },
      { label: 'Taxa de ocupação', value: (ocupacao.rows[0] ? ocupacao.rows[0].valor + '%' : '—'), hint: '+2% no mês', icon: 'TrendingUp', tone: 'success' },
    ];
    r.json(kpis);
  } catch (e) { r.status(500).json({ error: e.message }); }
});

// ---------- Relatórios: dados + export PDF (Python) ----------
router.get('/relatorios/dados', async (_, r) => {
  try {
    const [fluxo, pizza, ocup] = await Promise.all([
      query('SELECT mes, receita, despesa FROM serie_fluxo ORDER BY id'),
      query('SELECT label, valor, cor FROM pizza_portfolio ORDER BY id'),
      query('SELECT mes, valor FROM serie_ocupacao ORDER BY id'),
    ]);
    r.json({ fluxo: fluxo.rows, pizza: pizza.rows, ocupacao: ocup.rows });
  } catch (e) { r.status(500).json({ error: e.message }); }
});

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

router.post('/relatorios/export', async (req, r) => {
  try {
    const payload = JSON.stringify(req.body || {});
    const tmp = path.join(os.tmpdir(), 'imobi_rel_' + Date.now() + '.json');
    fs.writeFileSync(tmp, payload);
    // Chama o serviço Python (pandoc/xelatex) — caso específico de uso de Python
    const py = spawn('python3', [path.join(__dirname, 'export_relatorio.py'), tmp], { cwd: __dirname });
    let out = '', err = '';
    py.stdout.on('data', (d) => out += d);
    py.stderr.on('data', (d) => err += d);
    py.on('close', (code) => {
      fs.unlink(tmp, () => {});
      if (code !== 0) return r.status(500).json({ error: 'Falha na exportação', detail: err.toString() });
      const pdfPath = out.toString().trim();
      if (!fs.existsSync(pdfPath)) return r.status(500).json({ error: 'PDF não gerado', detail: err.toString() });
      r.download(pdfPath, 'relatorio-imobi.pdf', () => fs.unlink(pdfPath, () => {}));
    });
  } catch (e) { r.status(500).json({ error: e.message }); }
});

// ---------- Notificações (calculadas a partir dos dados reais) ----------
router.get('/notificacoes', async (_, r) => {
  try {
    const [atraso, pend, manut, venc] = await Promise.all([
      query("SELECT cliente, valor, vencimento FROM cobrancas WHERE cobrancas.status='Atrasado' ORDER BY vencimento LIMIT 6"),
      query("SELECT cliente, valor, vencimento FROM cobrancas WHERE cobrancas.status='Pendente' ORDER BY vencimento LIMIT 6"),
      query("SELECT titulo, prioridade FROM manutencoes WHERE manutencoes.status IN ('Aberto','Em andamento') ORDER BY (prioridade='Alta') DESC, id LIMIT 6"),
      query("SELECT c.codigo, i.codigo AS imovel FROM contratos c LEFT JOIN imoveis i ON i.id=c.imovel_id WHERE c.status='Vencendo' LIMIT 6"),
    ]);
    const notifs = [];
    atraso.rows.forEach((x) => notifs.push({ titulo: 'Cobrança em atraso', texto: x.cliente + ' • ' + fmt(x.valor), tom: 'danger', icone: 'AlertCircle' }));
    pend.rows.forEach((x) => notifs.push({ titulo: 'Cobrança pendente', texto: x.cliente + ' • venc. ' + x.vencimento, tom: 'warning', icone: 'Clock' }));
    venc.rows.forEach((x) => notifs.push({ titulo: 'Contrato vencendo', texto: (x.imovel || x.codigo) + ' • ' + x.codigo, tom: 'warning', icone: 'CalendarClock' }));
    manut.rows.forEach((x) => notifs.push({ titulo: 'Manutenção ' + x.prioridade.toLowerCase(), texto: x.titulo, tom: x.prioridade === 'Alta' ? 'danger' : 'primary', icone: 'Wrench' }));
    if (!notifs.length) notifs.push({ titulo: 'Tudo certo', texto: 'Nenhuma pendência no momento.', tom: 'success', icone: 'CheckCircle2' });
    r.json(notifs.slice(0, 10));
  } catch (e) { r.status(500).json({ error: e.message }); }
});

module.exports = router;
