/* =====================================================================
   db-init.js — cria banco/usuário e roda schema + seed (idempotente).
   Conecta como superuser (postgres) via env PGSUPER_DSN.
   Uso: node server/db-init.js
   ===================================================================== */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const SUPER_DSN = process.env.PGSUPER_DSN;
if (!SUPER_DSN) {
  console.error('[db-init] defina PGSUPER_DSN no .env (postgres://user:senha@host:porta/postgres).');
  process.exit(1);
}
const DB = process.env.PGDATABASE || 'imobi';
const USER = process.env.PGUSER || 'imobi';
const PASS = process.env.PGPASSWORD;
if (!PASS) {
  console.error('[db-init] defina PGPASSWORD no .env (mesma senha do usuário do banco).');
  process.exit(1);
}

async function run() {
  const superC = new Client({ connectionString: SUPER_DSN });
  await superC.connect();
  console.log('[db-init] conectado como superuser');

  // role + banco (idempotentes)
  await superC.query(`DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${USER}') THEN
      CREATE ROLE ${USER} LOGIN PASSWORD '${PASS}';
    END IF; END $$;`);
  const dbExiste = await superC.query("SELECT 1 FROM pg_database WHERE datname=$1", [DB]);
  if (process.env.DB_RESET && dbExiste.rows.length) {
    await superC.query(`DROP DATABASE ${DB}`);
    console.log('[db-init] banco', DB, 'dropped (reset)');
  }
  const dbExiste2 = await superC.query("SELECT 1 FROM pg_database WHERE datname=$1", [DB]);
  if (!dbExiste2.rows.length) {
    await superC.query(`CREATE DATABASE ${DB} OWNER ${USER}`);
    console.log('[db-init] banco', DB, 'criado');
  } else {
    console.log('[db-init] banco', DB, 'já existe');
  }
  await superC.end();

  // conecta no banco alvo para schema + seed
  const db = new Client({ host: process.env.PGHOST || '127.0.0.1', port: 5432, database: DB, user: USER, password: PASS });
  await db.connect();

  // schema (idempotente)
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(schema);
  console.log('[db-init] schema aplicado');

  if (process.env.DB_RESET) {
    // recria do zero e deixa VAZIO (sem dados fictícios); mantém usuário padrão
    await db.query("TRUNCATE TABLE documentos, manutencoes, cobrancas, inquilinos, contratos, lancamentos, eventos, proprietarios, imoveis, serie_receita, serie_fluxo, serie_ocupacao, pizza_portfolio RESTART IDENTITY CASCADE;");
    await db.query("INSERT INTO usuario (nome, cargo, email) VALUES ('Marcus C.', 'Corretor', 'marcus@imobi.com') ON CONFLICT DO NOTHING;");
    console.log('[db-init] DB resetado e VAZIO (adicione seus dados pelo app)');
  } else {
    console.log('[db-init] mantendo dados existentes (sem reseed)');
  }
  await db.end();
  console.log('[db-init] PRONTO');
}

run().catch((e) => { console.error('[db-init] ERRO:', e.message); process.exit(1); });
