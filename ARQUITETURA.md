# IMobi — Arquitetura (Front HTML/CSS/JS + Backend Node + Postgres + Python)

App de gestão imobiliária reconstruído da spec do Lovable, com **CRUD real** em
todas as seções. Dados fictícios (seed), prontos para receber novos dados.

## Stack
- **Front:** HTML + CSS + JavaScript puro (sem framework). Variáveis CSS p/ design system,
  fetch p/ API, modais/forms genéricos p/ Adicionar/Editar/Excluir.
- **Backend:** Node.js (Express) + `pg` (node-postgres), pool de conexões.
- **Banco:** PostgreSQL 16 (relacional). 13 tabelas + 4 séries de gráfico.
- **Python (caso específico):** `server/export_relatorio.py` gera o PDF de relatório
  via `pandoc + xelatex` (pipeline já usado nos labs). Chamado pelo Node via `spawn`.

## Estrutura
```
imobi/
├─ index.html              # front; carrega js na ordem certa
├─ css/design.css          # design system (light/dark, grids, componentes)
├─ js/
│  ├─ icons.js  theme.js  dados.js (helpers UI)  charts.js (SVG puro)
│  ├─ api.js               # cliente REST (fetch)
│  ├─ ui-forms.js          # modais/forms genéricos + toast + confirm
│  ├─ app.js               # AppShell + roteador por hash (async)
│  └─ pages.js             # 13 páginas; botões funcionais (CRUD)
├─ server/
│  ├─ index.js             # servidor: API /api/* + estático
│  ├─ db.js                # pool Postgres
│  ├─ crud.js              # router CRUD genérico por tabela (parametrizado)
│  ├─ api.js               # montagem das rotas + KPIs + séries + relatórios
│  ├─ schema.sql           # 13 tabelas (FKs respeitadas)
│  ├─ seed.sql             # dados fictícios
│  ├─ db-init.js           # cria banco/usuário + roda schema/seed (idempotente)
│  └─ export_relatorio.py  # export PDF (Python/pandoc/xelatex)
├─ package.json
└─ node_modules/           # express, pg, cors (já instalados no servidor)
```

## Como rodar (no gandalf / Linux)
1. Postgres rodando (`sudo pg_ctlcluster 16 main start`).
2. `cd imobi && DB_RESET=1 PGSUPER_DSN="postgres://postgres:postgres@127.0.0.1:5432/postgres" node server/db-init.js`
   (cria banco `imobi`, usuário `imobi`/`imobi123`, schema + seed).
3. `node server/index.js` → abre http://localhost:3000
4. (Opcional) `PGHOST=127.0.0.1 PGUSER=imobi PGPASSWORD=imobi123 PGDATABASE=imobi node server/index.js`

## CRUD — o que funciona
Cada entidade tem botões **Novo / Editar / Excluir** que persistem no Postgres:
- Imóveis, Proprietários, Inquilinos, Contratos, Cobranças, Manutenções, Documentos:
  full CRUD (POST/PUT/DELETE) + filtros (Imóveis).
- Dashboard: KPIs e séries vêm de agregações/consultas ao banco (não hardcoded).
- Configurações: edita o perfil do usuário (tabela `usuario`).
- Relatórios: botão "Exportar" chama o **Python** e baixa um PDF.

## Endpoints (resumo)
- `GET/POST /api/<entidade>` · `GET/PUT/DELETE /api/<entidade>/:id`
- `GET /api/dashboard/kpis` · `GET /api/series/{receita,fluxo,ocupacao,pizza}`
- `GET /api/relatorios/dados` · `POST /api/relatorios/export` → PDF (Python)

## Verificação feita (real, não afirmação)
- `node --check` em todo o JS.
- curl: health, GET/POST/PUT/DELETE em imóveis (criou id 9, alterou, removeu), KPIs agregam.
- curl: `POST /api/relatorios/export` → PDF válido (`%PDF-1.5`, 14KB).
- jsdom headless: navegou pelas 13 rotas contra o backend real → todas OK.

## Ressalvas
- Dados 100% fictícios (seed). Para produção: trocar `PGPASSWORD` e usar `Intl` nos valores.
- Exportação Python depende de `pandoc` + `xelatex` (presentes no gandalf). No Windows 11,
  rode o backend num WSL/Linux ou instale pandoc+xelatex se quiser o PDF lá.
