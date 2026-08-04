/* =====================================================================
   db.js — pool de conexões PostgreSQL (node-postgres).
   Configuração via env (ver .env): PGHOST, PGPORT, PGDATABASE,
   PGUSER, PGPASSWORD. Defaults para o setup local do Imobi.
   ===================================================================== */
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'imobi',
  user: process.env.PGUSER || 'imobi',
  // Sem fallback de senha: ela vem do .env (PGPASSWORD). Nunca hardcoded.
  password: process.env.PGPASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[pg] erro inesperado no pool:', err.message);
});

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (e) {
    console.error('[pg] query falhou:', e.message, '\nSQL:', text, params || '');
    throw e;
  } finally {
    if (process.env.SQL_LOG) console.log('[pg]', (Date.now() - start) + 'ms', text.slice(0, 80));
  }
}

module.exports = { pool, query };
