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
    console.log('[seed-full] connected');
    await c.query('BEGIN');

    // Helper to insert if not exists by unique code (for imoveis, contratos, cobrancas, manutencoes)
    async function insertIfNotExists(table, uniqueCol, values, params) {
      const exists = await c.query(`SELECT 1 FROM ${table} WHERE ${uniqueCol}=$1`, [params[0]]);
      if (exists.rows.length) return null;
      const cols = values.map(v => v[0]).join(',');
      const placeholders = values.map((_, i) => `$${i+1}`).join(',');
      const q = `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`;
      const res = await c.query(q, params);
      return res.rows[0];
    }

    // Proprietários (se já existem, não duplicar)
    const owners = [
      { nome: 'Cliente Grande', doc: '00011122233', email: 'grande@example.com', tel: '+5511999999999', banco: 'Banco Teste', desiredImoveis: 6 },
      { nome: 'Maria Silva', doc: '11122233344', email: 'maria@example.com', tel: '+5511988888888', banco: 'Banco A', desiredImoveis: 2 },
      { nome: 'Empresa Alfa', doc: 'AA112233', email: 'contato@alfa.com', tel: '+5511977777777', banco: 'Banco B', desiredImoveis: 8 },
      { nome: 'João Pereira', doc: '22233344455', email: 'joao@example.com', tel: '+5511966666666', banco: 'Banco C', desiredImoveis: 1 },
      { nome: 'Carlos e Filhos', doc: '33344455566', email: 'carlos@filhos.com', tel: '+5511955555555', banco: 'Banco D', desiredImoveis: 4 },
    ];

    const ownerIds = {};
    for (const o of owners) {
      const ex = await c.query('SELECT id FROM proprietarios WHERE nome=$1', [o.nome]);
      if (ex.rows.length) ownerIds[o.nome] = ex.rows[0].id;
      else {
        const res = await c.query('INSERT INTO proprietarios (nome, doc, email, tel, imoveis_count, banco) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id', [o.nome, o.doc, o.email, o.tel, 0, o.banco]);
        ownerIds[o.nome] = res.rows[0].id;
      }
    }

    // Create properties, contracts, tenants, cobrancas
    let tenantCounter = 1;
    for (const o of owners) {
      const count = o.desiredImoveis;
      for (let i = 1; i <= count; i++) {
        const code = `${o.nome.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g,'')}-IMB-${i}`.slice(0,30);
        // ensure unique code
        const exIm = await c.query('SELECT id FROM imoveis WHERE codigo=$1', [code]);
        let imId;
        if (exIm.rows.length) imId = exIm.rows[0].id;
        else {
          const tipo = (i % 3 === 0) ? 'Sala comercial' : (i % 2 === 0 ? 'Casa' : 'Apartamento');
          const status = (i % 5 === 0) ? 'Manutenção' : (i % 4 === 0 ? 'Disponível' : 'Alugado');
          const resIm = await c.query('INSERT INTO imoveis (codigo,endereco,cidade,tipo,valor,status,proprietario) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id', [code, `Rua ${o.nome} ${i}`, 'CidadeX', tipo, 800 + i * 250, status, o.nome]);
          imId = resIm.rows[0].id;
        }

        // create contract when status is Alugado (simulate rented)
        if (true) {
          // create tenant
          const tenantName = `Inquilino ${tenantCounter}`;
          const exT = await c.query('SELECT id FROM inquilinos WHERE nome=$1', [tenantName]);
          let tenantId;
          if (exT.rows.length) tenantId = exT.rows[0].id;
          else {
            const cpf = String(10000000000 + tenantCounter);
            const resT = await c.query('INSERT INTO inquilinos (nome,cpf,tel,email,profissao,renda,contrato_id,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id', [tenantName, cpf, '+551190000000', `${tenantName.toLowerCase().replace(/\s+/g,'')}@example.com`, 'Profissão X', 1500 + tenantCounter * 100, null, 'Ativo']);
            tenantId = resT.rows[0].id;
          }

          // contract code
          const ctCode = `${o.nome.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g,'')}-CT-${i}`.slice(0,30);
          const exCt = await c.query('SELECT id FROM contratos WHERE codigo=$1', [ctCode]);
          let contratoId;
          if (exCt.rows.length) contratoId = exCt.rows[0].id;
          else {
            // set varying status
            const status = (i % 6 === 0) ? 'Vencendo' : ((i % 7 === 0) ? 'Encerrado' : 'Ativo');
            const aluguel = 800 + i * 250;
            const resCt = await c.query('INSERT INTO contratos (codigo,imovel_id,proprietario,inquilino,aluguel,iptu,condominio,inicio,fim,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id', [ctCode, imId, o.nome, tenantName, aluguel, 0, 0, '2024-01-01', '2025-01-01', status]);
            contratoId = resCt.rows[0].id;
            // link tenant to contrato
            await c.query('UPDATE inquilinos SET contrato_id=$1 WHERE id=$2', [contratoId, tenantId]);
          }

          // create charges for some contracts: paid/pending/overdue
          const numCharges = (i % 3) + 1; // 1..3
          for (let ch = 1; ch <= numCharges; ch++) {
            const cbCode = `${ctCode}-CB-${ch}`.slice(0,40);
            const exCb = await c.query('SELECT id FROM cobrancas WHERE codigo=$1', [cbCode]);
            if (exCb.rows.length) continue;
            // set vencimento relative
            let vencimento;
            let statusCb;
            if (ch === 1) { vencimento = '2026-07-01'; statusCb = 'Atrasado'; }
            else if (ch === 2) { vencimento = '2026-08-15'; statusCb = 'Pendente'; }
            else { vencimento = '2026-09-15'; statusCb = 'Pago'; }
            const valor = 1000 + (i * 50) + ch * 10;
            await c.query('INSERT INTO cobrancas (codigo,cliente,contrato_id,vencimento,valor,tipo,status) VALUES ($1,$2,$3,$4,$5,$6,$7)', [cbCode, o.nome, contratoId, vencimento, valor, (ch % 2 === 0 ? 'PIX' : 'Boleto'), statusCb]);
          }

          tenantCounter++;
        }

        // manutencoes for some imoveis
        if (imId % 4 === 0) {
          const mtCode = `MT-${imId}-${Date.now()}`.slice(0,40);
          const exMt = await c.query('SELECT id FROM manutencoes WHERE codigo=$1', [mtCode]);
          if (!exMt.rows.length) {
            await c.query('INSERT INTO manutencoes (codigo,titulo,imovel_id,fornecedor,prioridade,status,valor) VALUES ($1,$2,$3,$4,$5,$6,$7)', [mtCode, `Reparo ${imId}`, imId, 'Fornecedor X', 'Alta', 'Aberto', 250]);
          }
        }

        // documentos for some imoveis
        if (imId % 3 === 0) {
          const docCode = `DOC-${imId}-${Date.now()}`.slice(0,40);
          await c.query('INSERT INTO documentos (nome,tipo,imovel_id,tamanho,caminho_arquivo,icone,tom) VALUES ($1,$2,$3,$4,$5,$6,$7)', [`Contrato ${imId}`, 'Contrato', imId, '12KB', null, 'FileText', 'primary']);
        }
      }

      // update imoveis_count
      await c.query('UPDATE proprietarios SET imoveis_count=(SELECT COUNT(*) FROM imoveis WHERE proprietario=proprietarios.nome) WHERE id=$1', [ownerIds[o.nome]]);
    }

    // Add some lancamentos (receitas/despesas)
    const lanc = [
      ['2026-08-01','Receita aluguel','Receita',5000,'Pago'],
      ['2026-07-15','Compra materiais','Despesa',1200,'Pago'],
      ['2026-08-10','Manutenção elétrica','Despesa',800,'Pendente'],
    ];
    for (const l of lanc) {
      const exL = await c.query('SELECT 1 FROM lancamentos WHERE data=$1 AND descricao=$2', [l[0], l[1]]);
      if (!exL.rows.length) await c.query('INSERT INTO lancamentos (data,descricao,categoria,valor,status) VALUES ($1,$2,$3,$4,$5)', l);
    }

    // series (only insert if empty)
    const sr = await c.query('SELECT COUNT(*) n FROM serie_receita');
    if (Number(sr.rows[0].n) === 0) {
      await c.query("INSERT INTO serie_receita (mes,valor) VALUES ('Mai','4000'),('Jun','4200'),('Jul','4600'),('Ago','4800')");
    }
    const sf = await c.query('SELECT COUNT(*) n FROM serie_fluxo');
    if (Number(sf.rows[0].n) === 0) {
      await c.query("INSERT INTO serie_fluxo (mes,receita,despesa) VALUES ('Mai',4000,2500),('Jun',4200,2600),('Jul',4600,2400),('Ago',4800,2300)");
    }
    const so = await c.query('SELECT COUNT(*) n FROM serie_ocupacao');
    if (Number(so.rows[0].n) === 0) {
      await c.query("INSERT INTO serie_ocupacao (mes,valor) VALUES ('Mai','78'),('Jun','80'),('Jul','82'),('Ago','84')");
    }
    const pp = await c.query('SELECT COUNT(*) n FROM pizza_portfolio');
    if (Number(pp.rows[0].n) === 0) {
      await c.query("INSERT INTO pizza_portfolio (label,valor,cor) VALUES ('Apt',50,'#4CAF50'),('Casa',30,'#03A9F4'),('Comercial',20,'#FF9800')");
    }

    await c.query('COMMIT');
    console.log('[seed-full] committed');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('[seed-full] error', e.message);
    process.exit(1);
  } finally {
    await c.end();
  }
})();