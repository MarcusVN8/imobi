# IMobi — SaaS de Gestão Imobiliária

Front-end em **HTML/CSS/JavaScript puro** (sem React/Tailwind) + backend **Node.js + PostgreSQL**, com exportação de relatórios em PDF via Python (pandoc + XeLaTeX). Reconstrução fiel de um protótipo Lovable, feita "pensando como pessoa" — design system explícito, componentes simples e mecanismos de conhecimento humano (SVG inline, roteador por hash, CSS @keyframes, listeners diretos no DOM).

## Funcionalidades
- Dashboard com KPIs e gráfico de receita (SVG)
- Imóveis, Proprietários, Inquilinos, Contratos, Financeiro, Cobranças
- Manutenções, Documentos (com upload de arquivo), Relatórios (PDF)
- **Agenda** mensal navegável com eventos (Visita/Vistoria/Renovação/Assinatura), criar/editar/excluir
- Tema claro/escuro persistente, responsivo, notificações em tempo real

## Stack
- Front: HTML + CSS (design system em `css/design.css`) + JS vanilla (`js/`)
- Back: Node.js (Express) + `node-postgres`, CRUD genérico por metadados (`server/crud.js`)
- Banco: PostgreSQL (`server/schema.sql`)
- PDF: script Python (`server/export_relatorio.py`) chamado via endpoint

## Como rodar (local)
1. Instale o Node 18+, PostgreSQL e pandoc+XeLaTeX (opcional, só para exportar PDF).
2. Crie o banco e o usuário (ou use o `db-init.js` como superusuário):
   ```bash
   cp .env.example .env   # ajuste PGPASSWORD, PGSUPER_DSN, etc.
   npm install
   node server/db-init.js # cria o banco + schema (vazio, adicione seus dados pelo app)
   ```
3. Suba o servidor:
   ```bash
   npm start   # ou: node server/index.js
   ```
4. Abra `http://localhost:3000`.

## Estrutura
```
index.html
css/design.css      # design system (cores, tipografia, raios, sombras)
js/                 # icons, theme, api, ui-forms, ui-notify, charts, app, pages
server/             # index, db, crud, api, schema.sql, db-init.js, export_relatorio.py
```

Sem dados fictícios: o app começa vazio para você cadastrar seus próprios imóveis, contratos e eventos.
