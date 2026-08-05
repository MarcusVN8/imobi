const { Client } = require('pg');
(async () => {
  const c = new Client({
    host: process.env.PGHOST || '127.0.0.1',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'imobi',
    user: process.env.PGUSER || 'imobi',
    password: process.env.PGPASSWORD,
  });
  try {
    await c.connect();
    console.log('[seed-runner] connected');
    await c.query('BEGIN');
    // create proprietor (or get existing)
    let pid;
    const existing = await c.query('SELECT id FROM proprietarios WHERE nome=$1', ['Cliente Grande']);
    if (existing.rows.length) {
      pid = existing.rows[0].id;
    } else {
      const resP = await c.query(
        `INSERT INTO proprietarios (nome, doc, email, tel, imoveis_count, banco) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        ['Cliente Grande', '00011122233', 'grande@example.com', '+5511999999999', 6, 'Banco Teste']
      );
      pid = resP.rows[0].id;
    }
    // insert 6 imoveis
    for (let i = 1; i <= 6; i++) {
      await c.query(
        `INSERT INTO imoveis (codigo,endereco,cidade,tipo,valor,status,proprietario) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (codigo) DO NOTHING`,
        [`IMB-G-${i}`, `Rua Teste ${i}`, 'CidadeX', i % 2 ? 'Apartamento' : 'Casa', 1000 * i, 'Alugado', 'Cliente Grande']
      );
    }
    const imRes = await c.query(`SELECT id FROM imoveis WHERE proprietario=$1 ORDER BY id`, ['Cliente Grande']);
    const imIds = imRes.rows.map((r) => r.id);
    // create contracts for each imovel
    for (let j = 0; j < imIds.length; j++) {
      const ctCode = `CT-G-${j + 1}`;
      await c.query(
        `INSERT INTO contratos (codigo,imovel_id,proprietario,inquilino,aluguel,iptu,condominio,inicio,fim,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (codigo) DO NOTHING`,
        [ctCode, imIds[j], 'Cliente Grande', `Inquilino ${j + 1}`, 1000 * (j + 1), 0, 0, '2024-01-01', '2025-01-01', 'Ativo']
      );
    }
    // create some cobrancas for first 3 contratos
    const contratosRes = await c.query(`SELECT id FROM contratos WHERE proprietario=$1 ORDER BY id`, ['Cliente Grande']);
    const contratoIds = contratosRes.rows.map((r) => r.id);
    for (let k = 0; k < Math.min(3, contratoIds.length); k++) {
      await c.query(
        `INSERT INTO cobrancas (codigo,cliente,contrato_id,vencimento,valor,tipo,status) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (codigo) DO NOTHING`,
        [`CB-G-${k + 1}`, 'Cliente Grande', contratoIds[k], '2026-08-15', 1000 * (k + 1), 'PIX', 'Pendente']
      );
    }
    // update imoveis_count
    await c.query(`UPDATE proprietarios SET imoveis_count=(SELECT COUNT(*) FROM imoveis WHERE proprietario=proprietarios.nome) WHERE id=$1`, [pid]);
    await c.query('COMMIT');
    console.log('[seed-runner] seed committed');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('[seed-runner] error:', e.message);
    process.exit(1);
  } finally {
    await c.end();
  }
})();