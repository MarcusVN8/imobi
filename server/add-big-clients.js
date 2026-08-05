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
    console.log('[add-big-clients] connected');
    await c.query('BEGIN');

    const bigOwners = [
      { nome: 'Grupo Beta', doc: '44455566677', email: 'beta@grupo.com', tel: '+5511944444444', banco: 'Banco Beta', count: 6 },
      { nome: 'Holding Gama', doc: 'GG123456', email: 'gama@holding.com', tel: '+5511933333333', banco: 'Banco Gama', count: 7 },
      { nome: 'Imobiliaria Delta', doc: 'DD998877', email: 'delta@imobiliaria.com', tel: '+5511922222222', banco: 'Banco Delta', count: 10 },
    ];

    let tenantIdx = 1000; // avoid colliding with existing tenants
    for (const o of bigOwners) {
      // create owner if not exists
      const ex = await c.query('SELECT id FROM proprietarios WHERE nome=$1', [o.nome]);
      let ownerId;
      if (ex.rows.length) {
        ownerId = ex.rows[0].id;
        console.log('[add-big-clients] owner exists:', o.nome);
      } else {
        const r = await c.query('INSERT INTO proprietarios (nome,doc,email,tel,imoveis_count,banco) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id', [o.nome, o.doc, o.email, o.tel, 0, o.banco]);
        ownerId = r.rows[0].id;
        console.log('[add-big-clients] created owner:', o.nome);
      }

      // count how many properties already
      const cur = await c.query('SELECT COUNT(*) n FROM imoveis WHERE proprietario=$1', [o.nome]);
      const have = Number(cur.rows[0].n || 0);
      const toCreate = Math.max(0, o.count - have);
      console.log('[add-big-clients] ', o.nome, 'has', have, 'needs', toCreate);

      for (let i = 1; i <= toCreate; i++) {
        const seq = have + i;
        const code = `${o.nome.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g,'')}-IMB-${seq}`.slice(0,30);
        // ensure unique
        const exIm = await c.query('SELECT id FROM imoveis WHERE codigo=$1', [code]);
        let imId;
        if (exIm.rows.length) {
          imId = exIm.rows[0].id;
        } else {
          const tipo = (seq % 3 === 0) ? 'Sala comercial' : (seq % 2 === 0 ? 'Casa' : 'Apartamento');
          const status = (seq % 5 === 0) ? 'Manutenção' : (seq % 4 === 0 ? 'Disponível' : 'Alugado');
          const resIm = await c.query('INSERT INTO imoveis (codigo,endereco,cidade,tipo,valor,status,proprietario) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id', [code, `Rua ${o.nome} ${seq}`, 'CidadeY', tipo, 1200 + seq * 200, status, o.nome]);
          imId = resIm.rows[0].id;
        }
        // create tenant + contract for rented ones
        const tenantName = `Inquilino ${tenantIdx}`;
        const exT = await c.query('SELECT id FROM inquilinos WHERE nome=$1', [tenantName]);
        let tenantId;
        if (exT.rows.length) tenantId = exT.rows[0].id; else {
          const cpf = String(90000000000 + tenantIdx);
          const rt = await c.query('INSERT INTO inquilinos (nome,cpf,tel,email,profissao,renda,contrato_id,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id', [tenantName, cpf, '+551100000000', `${tenantName.toLowerCase().replace(/\s+/g,'')}@example.com`, 'Profissão Y', 1800 + tenantIdx, null, 'Ativo']);
          tenantId = rt.rows[0].id;
        }
        const ctCode = `${o.nome.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g,'')}-CT-${seq}`.slice(0,30);
        const exCt = await c.query('SELECT id FROM contratos WHERE codigo=$1', [ctCode]);
        let contratoId;
        if (exCt.rows.length) contratoId = exCt.rows[0].id; else {
          const aluguel = 1000 + seq * 100;
          const resCt = await c.query('INSERT INTO contratos (codigo,imovel_id,proprietario,inquilino,aluguel,iptu,condominio,inicio,fim,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id', [ctCode, imId, o.nome, tenantName, aluguel, 0, 0, '2025-01-01', '2026-01-01', 'Ativo']);
          contratoId = resCt.rows[0].id;
          await c.query('UPDATE inquilinos SET contrato_id=$1 WHERE id=$2', [contratoId, tenantId]);
        }
        // add a couple of cobrancas: one pending, one paid
        const cb1 = `${ctCode}-CB-1`;
        const exCb1 = await c.query('SELECT id FROM cobrancas WHERE codigo=$1', [cb1]);
        if (!exCb1.rows.length) await c.query('INSERT INTO cobrancas (codigo,cliente,contrato_id,vencimento,valor,tipo,status) VALUES ($1,$2,$3,$4,$5,$6,$7)', [cb1, o.nome, contratoId, '2026-08-10', 1000 + seq * 10, 'PIX', 'Pendente']);
        const cb2 = `${ctCode}-CB-2`;
        const exCb2 = await c.query('SELECT id FROM cobrancas WHERE codigo=$1', [cb2]);
        if (!exCb2.rows.length) await c.query('INSERT INTO cobrancas (codigo,cliente,contrato_id,vencimento,valor,tipo,status) VALUES ($1,$2,$3,$4,$5,$6,$7)', [cb2, o.nome, contratoId, '2026-07-01', 1000 + seq * 10, 'Boleto', 'Pago']);

        tenantIdx++;
      }
      // update imoveis_count
      await c.query('UPDATE proprietarios SET imoveis_count=(SELECT COUNT(*) FROM imoveis WHERE proprietario=proprietarios.nome) WHERE id=$1', [ownerId]);
      console.log('[add-big-clients] done for', o.nome);
    }

    await c.query('COMMIT');
    console.log('[add-big-clients] committed');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('[add-big-clients] error', e.message);
    process.exit(1);
  } finally {
    await c.end();
  }
})();