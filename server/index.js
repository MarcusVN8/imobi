/* =====================================================================
   index.js — servidor único: API em /api/* + front estático.
   ===================================================================== */
const express = require('express');
const path = require('path');
const cors = require('cors');
const api = require('./api');
const { pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API
app.use('/api', api);

// Front estático (index.html, css/, js/)
const PUBLIC = path.join(__dirname, '..');
app.use(express.static(PUBLIC, { extensions: ['html'] }));

// Uploads de documentos (acessíveis via /uploads/<arquivo>)
const uploadsDir = path.join(PUBLIC, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Healthcheck
app.get('/health', async (_, r) => {
  try { await pool.query('SELECT 1'); r.json({ ok: true }); }
  catch (e) { r.status(500).json({ ok: false, error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`[imobi] ouvindo em http://localhost:${PORT}`);
});
