/* =====================================================================
   PÁGINAS (backend) — cada função faz fetch na API e os botões
   Adicionar/Editar/Excluir funcionam de verdade (via window.Forms).
   Valores numéricos são formatados no front (Intl pt-BR).
   ===================================================================== */
(function () {
  const D = window.Data, UI = window.UI, C = window.Charts, Ic = window.Icon, A = window.API, F = window.Forms;
  const fmt = A.fmtBRL;

  function table(headers, rowsHtml) {
    return '<div class="table-wrap card" style="padding:0;overflow:hidden;">' +
      '<table class="table"><thead><tr>' + headers.map((h) => '<th>' + h + '</th>').join('') + '</tr></thead>' +
      '<tbody>' + (rowsHtml || '') + '</tbody></table></div>';
  }
  // Botão de ação por linha (editar/excluir)
  function rowActions(onEdit, onDel) {
    return '<div class="flex gap-8">' +
      '<button class="icon-btn btn--sm" data-edit title="Editar" style="width:32px;height:32px;">' + Ic("Settings", 16) + '</button>' +
      '<button class="icon-btn btn--sm" data-del title="Excluir" style="width:32px;height:32px;color:var(--danger);">' + Ic("X", 16) + '</button>' +
      '</div>';
  }
  async function safe(fn, fallbackHtml) {
    try { return await fn(); }
    catch (e) { F.toast('Erro ao carregar: ' + e.message, 'erro'); return fallbackHtml || ''; }
  }

  /* ===================== DASHBOARD ===================== */
  async function dashboard() {
    const saudacao = (function () { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; })();
    const kpis = await safe(() => A.kpis(), []);
    const receita = await safe(() => A.series.receita(), []);
    const fluxo = await safe(() => A.series.fluxo(), []);

    const kpiHtml = kpis.map((k, i) => UI.statCard(k, i)).join('');
    const atencao = [
      { i: "AlertCircle", t: "Contratos vencendo", c: "—", tone: "warning" },
      { i: "Wrench", t: "Manutenções abertas", c: "—", tone: "danger" },
      { i: "CreditCard", t: "Cobranças pendentes", c: "—", tone: "warning" },
      { i: "Users", t: "Inquilinos inadimplentes", c: "—", tone: "danger" },
    ].map((a) => {
      const rgb = 'var(--' + a.tone + '-rgb)';
      return '<div class="flex items-center gap-12" style="padding:10px;border-radius:var(--r-lg);">' +
        '<span style="width:36px;height:36px;border-radius:10px;background:rgb(' + rgb + ' / .12);color:var(--' + a.tone + ');display:grid;place-items:center;flex:none;">' + Ic(a.i, 18) + '</span>' +
        '<span class="flex justify-between full items-center"><span class="truncate" style="font-size:14px;">' + a.t + '</span>' +
        '<span class="badge badge--' + a.tone + '">' + a.c + '</span></span></div>';
    }).join('');

    const venc = await safe(async () => {
      const cb = await A.cobrancas.list();
      return cb.filter((c) => c.status !== 'Pago').slice(0, 5);
    }, []);
    const vencHtml = venc.length ? venc.map((v) => {
      const d = new Date(v.vencimento + 'T00:00:00');
      const mes = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
      const dia = d.getDate();
      return '<div class="flex items-center gap-12" style="padding:9px 0;border-bottom:1px solid var(--border);">' +
        '<div style="width:48px;height:48px;border-radius:12px;background:rgb(var(--primary-rgb) / .06);display:grid;place-items:center;flex:none;text-align:center;">' +
          '<div class="micro">' + mes + '</div><div style="font-size:14px;font-weight:700;line-height:1;">' + dia + '</div></div>' +
        '<div style="min-width:0;"><div class="truncate" style="font-size:14px;font-weight:500;">' + v.cliente + '</div>' +
        '<div class="hint truncate">' + v.codigo + ' • ' + fmt(v.valor) + '</div></div></div>';
    }).join('') : '<div class="hint" style="padding:10px 0;">Sem vencimentos pendentes.</div>';

    const passos = [
      { t: "Adicionar primeiro imóvel", done: true },
      { t: "Convidar proprietário", done: true },
      { t: "Criar contrato de locação", done: true },
      { t: "Configurar conta bancária (PIX)", done: false },
      { t: "Conectar gateway de cobrança", done: false },
      { t: "Emitir primeira cobrança", done: false },
    ];
    const feitos = passos.filter((p) => p.done).length;
    const passosHtml = passos.map((p) =>
      '<div class="flex items-center gap-10" style="padding:8px 0;">' +
      (p.done
        ? '<span style="color:var(--success);">' + Ic("CheckCircle2", 18) + '</span><span style="font-size:14px;color:var(--muted-foreground);text-decoration:line-through;">' + p.t + '</span>'
        : '<span style="color:var(--muted-foreground);">' + Ic("Circle", 18) + '</span><span style="font-size:14px;">' + p.t + '</span><span style="margin-left:auto;color:var(--muted-foreground);">' + Ic("ArrowRight", 16) + '</span>') +
      '</div>').join('');

    const actions = '<button class="btn btn--secondary" data-export-rel>' + Ic("Download", 16) + 'Exportar</button>' +
      '<button class="btn btn--primary" data-novo-contrato>' + Ic("Plus", 16) + 'Novo contrato</button>';

    return UI.pageHeader([], saudacao + ', Marcus', 'Aqui está o resumo da sua imobiliária hoje.', actions) +
      '<div class="grid kpi-grid mb-16">' + kpiHtml + '</div>' +
      '<div class="card card--pad-lg mb-16 anim-fade"><div class="flex justify-between items-center" style="margin-bottom:8px;">' +
        '<div><div class="card-title">Receita mensal</div><div class="hint">Evolução dos últimos meses</div></div>' +
        '<span class="badge badge--success">+18% YoY</span></div>' +
        (receita.length ? C.area(receita.map((r) => ({ m: r.mes, v: Number(r.valor) / 1000 }))) : '') + '</div>' +
      '<div class="grid cols-3 gap-24">' +
        '<div class="card card--pad-lg"><div class="flex items-center gap-8" style="margin-bottom:12px;color:var(--warning);">' + Ic("AlertCircle", 18) + '<span class="card-title">Central de atenção</span></div>' + atencao + '</div>' +
        '<div class="card card--pad-lg"><div class="flex items-center gap-8" style="margin-bottom:4px;color:var(--primary);">' + Ic("CalendarClock", 18) + '<span class="card-title">Próximos vencimentos</span></div>' + vencHtml + '</div>' +
        '<div class="card card--pad-lg"><div class="flex justify-between items-center" style="margin-bottom:6px;"><span class="card-title">Primeiros passos</span><span class="badge badge--muted">' + feitos + '/6</span></div>' +
          '<div class="progress-track" style="margin:6px 0 8px;"><div class="progress-fill" style="width:' + (feitos / 6 * 100) + '%"></div></div>' + passosHtml + '</div>' +
      '</div>';
  }

  /* ===================== IMÓVEIS ===================== */
  async function imoveis() {
    const actions = '<button class="btn btn--primary" data-novo>' + Ic("Plus", 16) + 'Novo imóvel</button>';
    const head = UI.pageHeader(["Dashboard"], "Imóveis", "Portfólio de imóveis com filtros e status.", actions);
    const filtros =
      '<div class="card mb-16"><div class="flex items-center gap-12" style="flex-wrap:wrap;">' +
        '<div class="topbar__search" style="flex:1;min-width:220px;"><span>' + Ic("Search", 18) + '</span><input id="f-busca" placeholder="Buscar por endereço ou cidade..."></div>' +
        '<select class="field select" id="f-tipo"><option value="">Tipo: todos</option><option>Apartamento</option><option>Casa</option><option>Sala comercial</option></select>' +
        '<select class="field select" id="f-status"><option value="">Status: todos</option><option>Alugado</option><option>Disponível</option><option>Manutenção</option></select>' +
      '</div></div>';
    return head + filtros + '<div id="imoveis-tabela"><div class="card"><div class="skeleton" style="height:200px;"></div></div></div>';
  }
  async function renderImoveisTabela(view) {
    const lista = await safe(() => A.imoveis.list(), []);
    const busca = (view.querySelector('#f-busca').value || '').toLowerCase();
    const t = view.querySelector('#f-tipo').value, s = view.querySelector('#f-status').value;
    const rows = lista.filter((im) => (!busca || (im.endereco + ' ' + im.cidade).toLowerCase().includes(busca)) && (!t || im.tipo === t) && (!s || im.status === s))
      .map((im) => '<tr class="is-clickable" data-id="' + im.id + '">' +
        '<td><span class="micro">' + im.codigo + '</span></td>' +
        '<td style="font-weight:500;">' + im.endereco + '</td><td class="muted">' + im.cidade + '</td><td>' + im.tipo + '</td>' +
        '<td style="font-weight:600;">' + fmt(im.valor) + '</td><td>' + UI.badge(im.status) + '</td><td class="muted">' + im.proprietario + '</td>' +
        '<td class="text-right">' + rowActions() + '</td></tr>').join('');
    const container = view.querySelector('#imoveis-tabela');
    container.innerHTML = rows.length ? table(["ID", "Endereço", "Cidade", "Tipo", "Valor", "Status", "Proprietário", ""], rows)
      : UI.empty("Search", "Nenhum imóvel", "Ajuste os filtros ou adicione um novo imóvel.");
    // cliques
    container.querySelectorAll('tr.is-clickable').forEach((tr) => tr.addEventListener('click', (e) => {
      if (e.target.closest('[data-edit],[data-del]')) return;
      location.hash = '#/imovel/' + tr.getAttribute('data-id');
    }));
    container.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', async () => {
      const im = await A.imoveis.get(b.closest('tr').getAttribute('data-id'));
      editImovel(im);
    }));
    container.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      const id = b.closest('tr').getAttribute('data-id');
      F.confirmDelete('Excluir o imóvel ' + id + '?', async () => { await A.imoveis.remove(id); F.toast('Imóvel excluído.', 'ok'); renderImoveisTabela(view); });
    }));
  }
  function novoImovel() {
    F.openForm('Novo imóvel', [
      { key: 'codigo', label: 'Código', required: true, placeholder: 'IMB-XXXX' },
      { key: 'endereco', label: 'Endereço', required: true },
      { key: 'cidade', label: 'Cidade', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', required: true, options: [{ value: 'Apartamento' }, { value: 'Casa' }, { value: 'Sala comercial' }] },
      { key: 'valor', label: 'Valor (R$)', type: 'number', required: true },
      { key: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'Alugado' }, { value: 'Disponível' }, { value: 'Manutenção' }] },
      { key: 'proprietario', label: 'Proprietário', required: true },
    ], {}, async (p) => { await A.imoveis.create(p); F.toast('Imóvel adicionado.', 'ok'); router(); });
  }
  function editImovel(im) {
    F.openForm('Editar imóvel', [
      { key: 'codigo', label: 'Código', required: true },
      { key: 'endereco', label: 'Endereço', required: true },
      { key: 'cidade', label: 'Cidade', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', required: true, options: [{ value: 'Apartamento' }, { value: 'Casa' }, { value: 'Sala comercial' }] },
      { key: 'valor', label: 'Valor (R$)', type: 'number', required: true },
      { key: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'Alugado' }, { value: 'Disponível' }, { value: 'Manutenção' }] },
      { key: 'proprietario', label: 'Proprietário', required: true },
    ], im, async (p) => { await A.imoveis.update(im.id, p); F.toast('Imóvel atualizado.', 'ok'); router(); });
  }

  /* ===================== IMÓVEL DETALHE ===================== */
  async function imovelDetalhe(id) {
    const im = await safe(() => A.imoveis.get(id), null);
    if (!im) return UI.empty("Building2", "Imóvel não encontrado", "O código informado não existe.");
    const head = UI.pageHeader(["Dashboard", "Imóveis"], im.codigo, im.endereco + ' — ' + im.cidade, '');
    const chars = [["Tipo", im.tipo], ["Status", im.status], ["Valor", fmt(im.valor)], ["Cidade", im.cidade], ["Proprietário", im.proprietario], ["Código", im.codigo]];
    const charsHtml = chars.map((c) => '<div class="flex justify-between" style="padding:10px 0;border-bottom:1px solid var(--border);font-size:14px;"><span class="muted">' + c[0] + '</span><span style="font-weight:600;">' + c[1] + '</span></div>').join('');
    const tabs =
      '<div class="tabs" data-tabs><button class="tab is-active" data-tab="contratos">Contratos</button><button class="tab" data-tab="financeiro">Financeiro</button><button class="tab" data-tab="documentos">Documentos</button></div>' +
      '<div data-pane="contratos" id="p-contratos"><div class="skeleton" style="height:120px;"></div></div>' +
      '<div data-pane="financeiro" style="display:none;" id="p-fin"><div class="skeleton" style="height:120px;"></div></div>' +
      '<div data-pane="documentos" style="display:none;" id="p-doc"><div class="skeleton" style="height:120px;"></div></div>';
    return head +
      '<div class="grid" style="grid-template-columns:1fr;gap:24px;">' +
        '<div style="grid-column:1/-1;display:grid;grid-template-columns:2fr 1fr;gap:24px;">' +
          '<div class="card card--pad-lg"><div class="card-title mb-12">Características</div>' + charsHtml +
            '<div class="card-title mb-12 mt-24">Descrição</div><p class="muted" style="font-size:14px;">Imóvel em ' + im.endereco + ', ' + im.cidade + '. Tipo ' + im.tipo.toLowerCase() + '.</p></div>' +
          '<div class="card card--pad-lg"><div class="card-title mb-12">Resumo</div>' +
            '<div style="height:140px;border-radius:var(--r-lg);background:linear-gradient(135deg,rgb(var(--primary-rgb)/.15),rgb(var(--purple-rgb)/.15));display:grid;place-items:center;color:var(--muted-foreground);margin-bottom:16px;">' + Ic("Building2", 40) + '</div>' +
            '<div class="flex justify-between" style="font-size:14px;padding:8px 0;"><span class="muted">Status</span>' + UI.badge(im.status) + '</div>' +
            '<div class="flex justify-between" style="font-size:14px;padding:8px 0;"><span class="muted">Proprietário</span><b>' + im.proprietario + '</b></div>' +
            '<div class="flex justify-between" style="font-size:14px;padding:8px 0;"><span class="muted">Valor</span><b>' + fmt(im.valor) + '</b></div>' +
            '<button class="btn btn--primary full mt-16">' + Ic("Eye", 16) + 'Ver no mapa</button></div>' +
        '</div>' +
        '<div class="card card--pad-lg" style="grid-column:1/-1;">' + tabs + '</div>' +
      '</div>';
  }
  async function fillDetalhePanes(view, id) {
    const [ctr, docs] = await Promise.all([safe(() => A.contratos.list(), []), safe(() => A.documentos.list(), [])]);
    const meusC = ctr.filter((c) => String(c.imovel_id) === String(id));
    view.querySelector('#p-contratos').innerHTML = meusC.length ? table(["Contrato", "Inquilino", "Aluguel", "Vigência", "Status"],
      meusC.map((c) => '<tr><td><span class="micro">' + c.codigo + '</span></td><td>' + c.inquilino + '</td><td style="font-weight:600;">' + fmt(c.aluguel) + '</td><td class="muted">' + c.inicio + ' → ' + c.fim + '</td><td>' + UI.badge(c.status) + '</td></tr>').join(''))
      : UI.empty("FileText", "Sem contratos", "Este imóvel não tem contrato vinculado.");
    const meusD = docs.filter((d) => String(d.imovel_id) === String(id));
    view.querySelector('#p-doc').innerHTML = meusD.length ? table(["Documento", "Tipo", "Tamanho"],
      meusD.map((d) => '<tr><td><div class="flex items-center gap-10"><span style="color:var(--' + d.tom + ');">' + Ic(d.icone, 18) + '</span>' + d.nome + '</div></td><td>' + d.tipo + '</td><td class="muted">' + d.tamanho + '</td></tr>').join(''))
      : UI.empty("FolderOpen", "Nenhum documento", "Vincule documentos a este imóvel.");
    view.querySelector('#p-fin').innerHTML = table(["Mês", "Receita", "Status"], [
      ['Mês atual', fmt(0), UI.badge('Pendente')],
    ].map((r) => '<tr><td>' + r[0] + '</td><td style="font-weight:600;">' + r[1] + '</td><td>' + r[2] + '</td></tr>').join(''));
  }

  /* ===================== PROPRIETÁRIOS (cards) ===================== */
  async function proprietarios() {
    const head = UI.pageHeader(["Dashboard"], "Proprietários", "Cadastro de proprietários e chaves PIX.",
      '<button class="btn btn--primary" data-novo>' + Ic("Plus", 16) + 'Novo proprietário</button>');
    const lista = await safe(() => A.proprietarios.list(), []);
    const cards = lista.map((p) =>
      '<div class="card card--hover"><div class="flex items-center gap-12" style="margin-bottom:12px;">' +
        '<div class="avatar" style="width:44px;height:44px;font-size:15px;">' + p.nome.split(' ').map((s) => s[0]).join('').slice(0, 2) + '</div>' +
        '<div><div style="font-weight:600;">' + p.nome + '</div><div class="hint">' + p.doc + '</div></div>' +
        '<div style="margin-left:auto;display:flex;gap:6px;">' +
          '<button class="icon-btn btn--sm" data-edit style="width:32px;height:32px;">' + Ic("Settings", 16) + '</button>' +
          '<button class="icon-btn btn--sm" data-del style="width:32px;height:32px;color:var(--danger);">' + Ic("X", 16) + '</button></div></div>' +
        '<div style="font-size:13px;" class="muted">' +
          '<div class="flex items-center gap-8" style="padding:4px 0;">' + Ic("Mail", 14) + p.email + '</div>' +
          '<div class="flex items-center gap-8" style="padding:4px 0;">' + Ic("Phone", 14) + p.tel + '</div>' +
          '<div class="flex items-center gap-8" style="padding:4px 0;">' + Ic("Building2", 14) + p.imoveis_count + ' imóveis</div>' +
          '<div class="flex items-center gap-8" style="padding:4px 0;">' + Ic("Wallet", 14) + p.banco + '</div></div></div>').join('');
    return head + (lista.length ? '<div class="grid cards-grid">' + cards + '</div>' : UI.empty("Users", "Nenhum proprietário", "Adicione o primeiro proprietário."));
  }

  /* ===================== TABELA GENÉRICA CRUD ===================== */
  // monta uma página de tabela com botão Novo + editar/excluir por linha
  async function crudPage(opts) {
    const head = UI.pageHeader(["Dashboard"], opts.title, opts.desc,
      '<button class="btn btn--primary" data-novo>' + Ic("Plus", 16) + 'Novo</button>');
    const lista = await safe(() => opts.api.list(), []);
    const rows = lista.map((item) => {
      const tds = opts.cols.map((c) => '<td>' + c.render(item) + '</td>').join('');
      return '<tr data-id="' + item.id + '">' + tds +
        '<td class="text-right">' + rowActions() + '</td></tr>';
    }).join('');
    return head + (lista.length ? table(opts.headers.concat(['']), rows) : UI.empty(opts.emptyIcon || "FileText", opts.emptyTitle || "Nada por aqui", opts.emptyText || "Adicione um registro."));
  }

  /* ===================== REGISTRO DE ROTAS ===================== */
  window.Routes['/'] = dashboard;
  window.Routes['/imoveis'] = imoveis;
  window.Routes['/proprietarios'] = proprietarios;

  // Tabelas CRUD simples
  const statusOpts = (vals) => vals.map((v) => ({ value: v }));
  window.Routes['/inquilinos'] = () => crudPage({
    title: "Inquilinos", desc: "Inquilinos, renda, profissão e contrato vinculado.",
    api: A.inquilinos, emptyTitle: "Nenhum inquilino",
    headers: ["Nome", "CPF", "Profissão", "Renda", "Contrato", "Status"],
    cols: [
      { render: (i) => '<span style="font-weight:500;">' + i.nome + '</span>' },
      { render: (i) => '<span class="muted">' + i.cpf + '</span>' },
      { render: (i) => i.profissao },
      { render: (i) => '<span style="font-weight:600;">' + fmt(i.renda) + '</span>' },
      { render: (i) => '<span class="micro">CT-' + (i.contrato_id || '—') + '</span>' },
      { render: (i) => UI.badge(i.status) },
    ],
  });
  window.Routes['/contratos'] = () => crudPage({
    title: "Contratos", desc: "Contratos de locação: valores, vigência e status.",
    api: A.contratos, emptyTitle: "Nenhum contrato",
    headers: ["ID", "Imóvel", "Inquilino", "Aluguel", "Vigência", "Status"],
    cols: [
      { render: (i) => '<span class="micro">' + i.codigo + '</span>' },
      { render: (i) => '<span class="micro">' + (i.imovel_codigo || i.imovel_id) + '</span>' },
      { render: (i) => i.inquilino },
      { render: (i) => '<span style="font-weight:600;">' + fmt(i.aluguel) + '</span>' },
      { render: (i) => '<span class="muted">' + i.inicio + ' → ' + i.fim + '</span>' },
      { render: (i) => UI.badge(i.status) },
    ],
  });
  window.Routes['/cobrancas'] = () => crudPage({
    title: "Cobranças", desc: "Boletos, PIX e cartão com filtros por tipo.",
    api: A.cobrancas, emptyTitle: "Nenhuma cobrança",
    headers: ["ID", "Cliente", "Contrato", "Vencimento", "Valor", "Tipo", "Status"],
    cols: [
      { render: (i) => '<span class="micro">' + i.codigo + '</span>' },
      { render: (i) => i.cliente },
      { render: (i) => '<span class="micro">' + (i.contrato_codigo || i.contrato_id) + '</span>' },
      { render: (i) => i.vencimento },
      { render: (i) => '<span style="font-weight:600;">' + fmt(i.valor) + '</span>' },
      { render: (i) => UI.badge(i.tipo) },
      { render: (i) => UI.badge(i.status) },
    ],
  });
  window.Routes['/manutencoes'] = () => crudPage({
    title: "Manutenções", desc: "Chamados com prioridade, fornecedor e custo.",
    api: A.manutencoes, emptyTitle: "Nenhuma manutenção",
    headers: ["ID", "Título", "Imóvel", "Fornecedor", "Prioridade", "Status", "Valor"],
    cols: [
      { render: (i) => '<span class="micro">' + i.codigo + '</span>' },
      { render: (i) => '<span style="font-weight:500;">' + i.titulo + '</span>' },
      { render: (i) => '<span class="micro">' + (i.imovel_codigo || i.imovel_id) + '</span>' },
      { render: (i) => '<span class="muted">' + i.fornecedor + '</span>' },
      { render: (i) => UI.badge(i.prioridade) },
      { render: (i) => UI.badge(i.status) },
      { render: (i) => '<span style="font-weight:600;">' + fmt(i.valor) + '</span>' },
    ],
  });
  window.Routes['/documentos'] = () => crudPage({
    title: "Documentos", desc: "Repositório de arquivos vinculados a imóveis.",
    api: A.documentos, emptyTitle: "Nenhum documento", emptyIcon: "FolderOpen",
    headers: ["Nome", "Tipo", "Imóvel", "Tamanho", "Arquivo", ""],
    cols: [
      { render: (i) => '<div class="flex items-center gap-10"><span style="color:var(--' + i.tom + ');">' + Ic(i.icone, 18) + '</span><span style="font-weight:500;">' + i.nome + '</span></div>' },
      { render: (i) => i.tipo },
      { render: (i) => '<span class="micro">' + (i.imovel_codigo || i.imovel_id) + '</span>' },
      { render: (i) => '<span class="muted">' + (i.tamanho || '—') + '</span>' },
      { render: (i) => (i.caminho_arquivo ? '<a class="btn btn--ghost btn--sm" href="' + i.caminho_arquivo + '" target="_blank" rel="noopener">' + Ic("Download", 16) + 'Baixar</a>' : '<span class="muted">—</span>') },
    ],
  });

  /* ===================== FINANCEIRO ===================== */
  async function financeiro() {
    const head = UI.pageHeader(["Dashboard"], "Financeiro", "Indicadores financeiros e fluxo de caixa.");
    // lançamentos genéricos
    const lanc = await safe(() => A.lancamentos.list(), []);
    // lista de proprietários para filtro (apenas exibir clientes com >5 imóveis)
    const proprietarios = await safe(() => A.proprietarios.list(), []);
    const clientesGrandes = proprietarios.filter((p) => Number(p.imoveis_count) > 5);

    // agregado inicial (todos os clientes)
    const agg = await safe(() => A.financeiro.aggregate(), { receita: 0, despesas: 0, aReceber: 0, saldo: 0 });
    const kpis = [
      { label: "Receita (mês)", value: fmt(agg.receita), hint: "+18% YoY", icon: "DollarSign", tone: "success" },
      { label: "Despesas (mês)", value: fmt(agg.despesas), hint: "iptu+manut.", icon: "Wallet", tone: "warning" },
      { label: "Saldo", value: fmt(agg.saldo), hint: "líquido", icon: "TrendingUp", tone: "primary" },
      { label: "A receber", value: fmt(agg.aReceber), hint: "15 dias", icon: "Clock", tone: "warning" },
    ];
    const kpiHtml = kpis.map((k, i) => UI.statCard(k, i)).join('');
    const fluxo = await safe(() => A.series.fluxo(), []);
    const rows = lanc.map((l) => '<tr><td class="muted">' + l.data + '</td><td style="font-weight:500;">' + l.descricao + '</td><td>' + UI.badge(l.categoria) + '</td><td style="font-weight:600;">' + fmt(l.valor) + '</td><td>' + UI.badge(l.status) + '</td></tr>').join('');

    // filtro de cliente (aparece só se houver clientes com >5 imóveis)
    const filtroHtml = (clientesGrandes.length ? '<div class="card mb-16"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;"><span class="hint">Filtrar por cliente com muitos imóveis:</span>' +
      '<input list="dl-clientes" id="f-cliente" class="field" placeholder="Digite para filtrar (tecle uma letra)..."><datalist id="dl-clientes">' + clientesGrandes.map((c) => '<option value="' + c.nome + '">' + c.nome + ' (' + c.imoveis_count + ')</option>').join('') + '</datalist>' +
      '<button class="btn btn--ghost btn--sm" id="f-cliente-clear">Limpar</button></div></div>' : '');

    // placeholder para métricas do cliente e detalhes
    const clienteMetrics = '<div id="fin-cliente-metrics" class="grid kpi-grid mb-16">' + kpiHtml + '</div>';
    const clienteDetalhe = '<div id="fin-cliente-det"></div>';

    return head + filtroHtml + clienteMetrics + clienteDetalhe +
      '<div class="card card--pad-lg mb-16 anim-fade"><div class="card-title mb-8">Fluxo de caixa (receita × despesa)</div>' +
      (fluxo.length ? C.bars(fluxo.map((r) => ({ m: r.mes, r: Number(r.receita) / 1000, d: Number(r.despesa) / 1000 }))) : '') + '</div>' +
      (lanc.length ? table(["Data", "Descrição", "Categoria", "Valor", "Status"], rows) : UI.empty("Wallet", "Sem lançamentos", "Adicione lançamentos financeiros."));
  }

  /* ===================== AGENDA ===================== */
  // Estado de navegação de mês (module-level, persiste entre renders)
  if (!agenda._mes) { const hj = new Date(); agenda._mes = { ano: hj.getFullYear(), m: hj.getMonth() }; }
  const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const DIAS = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
  const TIPOS = ["Visita","Vistoria","Renovação","Assinatura"];
  const COR_TIPO = { "Visita": "primary", "Vistoria": "warning", "Renovação": "success", "Assinatura": "purple" };
  const ICO_TIPO = { "Visita": "UserPlus", "Vistoria": "ClipboardCheck", "Renovação": "RefreshCw", "Assinatura": "PenLine" };

  async function agenda() {
    const head = UI.pageHeader(["Dashboard"], "Agenda", "Calendário mensal com visitas, vistorias, renovações e assinaturas.");
    const { ano, m } = agenda._mes;
    const evs = await safe(() => A.eventos.list(), []);
    const primeiro = new Date(ano, m, 1);
    const diasNoMes = new Date(ano, m + 1, 0).getDate();
    const inicioSemana = (primeiro.getDay() + 6) % 7; // segunda = 0
    const hoje = new Date();
    const ehHoje = (d) => hoje.getFullYear() === ano && hoje.getMonth() === m && hoje.getDate() === d;
    const evtPorDia = {};
    evs.forEach((e) => { (evtPorDia[e.dia] = evtPorDia[e.dia] || []).push(e); });
    // ordena por hora dentro do dia
    for (const k in evtPorDia) evtPorDia[k].sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));

    let cells = "";
    for (let i = 0; i < inicioSemana; i++) cells += '<div class="cal-cell cal-cell--empty"></div>';
    for (let d = 1; d <= diasNoMes; d++) {
      const ev = evtPorDia[d] || [];
      const evHtml = ev.map((e) => {
        const c = COR_TIPO[e.tipo] || "primary";
        return '<button class="cal-chip" data-ev="' + e.id + '" title="' + e.titulo + ' • ' + e.hora + '" style="background:rgb(var(--' + c + '-rgb) / .14);color:var(--' + c + ');">' +
          '<span style="font-weight:600;">' + (e.hora || "") + '</span><span class="truncate" style="margin-left:6px;">' + e.titulo + '</span></button>';
      }).join("");
      const isHoje = ehHoje(d);
      cells += '<div class="cal-cell' + (isHoje ? " cal-cell--hoje" : "") + '" data-ddia="' + d + '">' +
        '<div class="cal-num">' + d + (isHoje ? '<span class="cal-hoje-dot"></span>' : "") + '</div>' + evHtml +
        (ev.length < 3 ? '<button class="cal-add" data-add-dia="' + d + '" title="Novo evento neste dia">' + Ic("Plus", 14) + '</button>' : "") +
        '</div>';
    }

    const legenda = TIPOS.map((t) => {
      const c = COR_TIPO[t];
      return '<span class="cal-leg"><span class="cal-leg-dot" style="background:var(--' + c + ');"></span>' + t + '</span>';
    }).join("");

    const grid = '<div class="cal-grid">' +
      DIAS.map((s) => '<div class="cal-dow">' + s + '</div>').join("") + cells + '</div>';

    // Próximos eventos (do mês atual pra frente, ordenado por dia/hora)
    const proximos = evs
      .filter((e) => e.dia >= hoje.getDate() || m !== hoje.getMonth() || ano !== hoje.getFullYear())
      .sort((a, b) => a.dia - b.dia || (a.hora || "").localeCompare(b.hora || ""))
      .slice(0, 6);
    const proxHtml = proximos.length ? proximos.map((e) => {
      const c = COR_TIPO[e.tipo] || "primary";
      return '<div class="ag-item" data-ev="' + e.id + '">' +
        '<span class="ag-ico" style="background:rgb(var(--' + c + '-rgb) / .14);color:var(--' + c + ');">' + Ic(ICO_TIPO[e.tipo] || "Calendar", 18) + '</span>' +
        '<div class="ag-body"><div class="ag-tit">' + e.titulo + '</div><div class="hint">' + e.tipo + ' • ' + e.dia + ' ' + MESES[m].slice(0, 3) + ' • ' + e.hora + '</div></div>' +
        '<span class="badge" style="background:rgb(var(--' + c + '-rgb) / .14);color:var(--' + c + ');border:1px solid rgb(var(--' + c + '-rgb) / .25);">' + e.tipo + '</span></div>';
    }).join("") : '<div class="hint" style="padding:18px 0;text-align:center;">Nenhum evento próximo.</div>';

    const cal = '<div class="card card--pad-lg">' +
      '<div class="cal-toolbar">' +
        '<div class="cal-nav">' +
          '<button class="icon-btn" data-cal-prev aria-label="Mês anterior">' + Ic("ChevronLeft", 18) + '</button>' +
          '<div class="cal-mes">' + MESES[m] + ' ' + ano + '</div>' +
          '<button class="icon-btn" data-cal-next aria-label="Próximo mês">' + Ic("ChevronRight", 18) + '</button>' +
          '<button class="btn btn--ghost btn--sm" data-cal-hoje>Hoje</button>' +
        '</div>' +
        '<div class="cal-actions"><div class="cal-legend">' + legenda + '</div>' +
          '<button class="btn btn--primary btn--sm" data-cal-novo>' + Ic("Plus", 16) + 'Novo evento</button></div>' +
      '</div>' + grid + '</div>';

    const side = '<div class="card card--pad-lg"><div class="card-title mb-8">' + Ic("CalendarClock", 18) + ' Próximos eventos</div>' + proxHtml + '</div>';

    return head + '<div class="ag-layout">' + cal + side + '</div>';
  }

  // abre modal de formulário de evento (reaproveita F.openForm)
  function abrirEvento(ev) {
    F.openForm(ev ? "Editar evento" : "Novo evento", [
      { key: "titulo", label: "Título", required: true },
      { key: "tipo", label: "Tipo", type: "select", required: true, options: TIPOS.map((t) => ({ value: t, label: t })) },
      { key: "dia", label: "Dia do mês", type: "number", required: true },
      { key: "hora", label: "Hora (HH:MM)", required: true },
    ], ev || { dia: agenda._mes === undefined ? 1 : (new Date().getDate()), tipo: "Visita", hora: "09:00" }, async (pl) => {
      if (ev) await A.eventos.update(ev.id, pl); else await A.eventos.create(pl);
      F.toast(ev ? "Evento atualizado." : "Evento criado.", "ok"); router();
    }, { del: !!ev, onDelete: ev ? async () => { await A.eventos.remove(ev.id); F.toast("Evento excluído.", "ok"); router(); } : null });
  }

  /* ===================== RELATÓRIOS ===================== */
  async function relatorios() {
    const head = UI.pageHeader(["Dashboard"], "Relatórios", "Lucro/ocupação e relatórios exportáveis.");
    const dados = await safe(() => A.relatorios.dados(), { fluxo: [], pizza: [], ocupacao: [] });
    const graf =
      '<div class="grid cols-3 gap-24">' +
        '<div class="card card--pad-lg"><div class="card-title mb-8">Receita (R$)</div>' + (dados.fluxo.length ? C.bars(dados.fluxo.map((r) => ({ m: r.mes, r: Number(r.receita) / 1000, d: Number(r.despesa) / 1000 }))) : '') + '</div>' +
        '<div class="card card--pad-lg"><div class="card-title mb-8">Distribuição do portfólio</div>' + (dados.pizza.length ? C.pie(dados.pizza.map((p) => ({ label: p.label, valor: Number(p.valor), cor: p.cor }))) : '') + '</div>' +
      '</div>';
    const lista = [["Ocupação por mês", "PDF", "Ago/2026"], ["Inadimplência", "XLSX", "Ago/2026"], ["Comissões", "PDF", "Jul/2026"], ["Fluxo de caixa", "CSV", "Ago/2026"]];
    const listaHtml = table(["Relatório", "Período", ""], lista.map((r) =>
      '<tr><td style="font-weight:500;">' + r[0] + '</td><td class="muted">' + r[2] + '</td><td class="text-right"><button class="btn btn--ghost btn--sm" data-export-rel>' + Ic("Download", 16) + 'Baixar ' + r[1] + '</button></td></tr>').join(''));
    return head + graf + '<div class="mt-24">' + listaHtml + '</div>';
  }

  /* ===================== CONFIGURAÇÕES ===================== */
  async function configuracoes() {
    const head = UI.pageHeader(["Dashboard"], "Configurações", "Perfil, imobiliária, notificações e integrações.");
    const u = await safe(() => A.usuario.list().then((l) => l[0]), { nome: 'Marcus C.', cargo: 'Corretor', email: 'marcus@imobi.com' });
    const tabs =
      '<div class="tabs" data-tabs><button class="tab is-active" data-tab="perfil">Perfil</button><button class="tab" data-tab="imob">Imobiliária</button><button class="tab" data-tab="notif">Notificações</button><button class="tab" data-tab="int">Integrações</button></div>' +
      '<div data-pane="perfil" class="card card--pad-lg"><div class="card-title mb-12">Seu perfil</div>' +
        '<label style="display:block;margin-bottom:14px;"><span class="hint">Nome</span><input class="field full" id="cfg-nome" value="' + (u.nome || '') + '"></label>' +
        '<label style="display:block;margin-bottom:14px;"><span class="hint">E-mail</span><input class="field full" id="cfg-email" value="' + (u.email || '') + '"></label>' +
        '<label style="display:block;margin-bottom:14px;"><span class="hint">Cargo</span><input class="field full" id="cfg-cargo" value="' + (u.cargo || '') + '"></label>' +
        '<button class="btn btn--primary" data-salvar-perfil>Salvar alterações</button></div>' +
      '<div data-pane="imob" style="display:none;" class="card card--pad-lg"><div class="card-title mb-12">Dados da imobiliária</div>' +
        '<label style="display:block;margin-bottom:14px;"><span class="hint">Razão social</span><input class="field full" value="Imobi Gestão Imobiliária Ltda"></label>' +
        '<label style="display:block;margin-bottom:14px;"><span class="hint">CNPJ</span><input class="field full" value="12.345.678/0001-90"></label>' +
        '<button class="btn btn--primary">Salvar</button></div>' +
      '<div data-pane="notif" style="display:none;" class="card card--pad-lg"><div class="card-title mb-12">Notificações</div>' +
        '<div class="flex justify-between items-center" style="padding:10px 0;"><span>Vencimentos próximos</span>' + UI.badge("Ativo") + '</div>' +
        '<div class="flex justify-between items-center" style="padding:10px 0;"><span>Inadimplência</span>' + UI.badge("Ativo") + '</div>' +
        '<div class="flex justify-between items-center" style="padding:10px 0;"><span>Newsletter mensal</span>' + UI.badge("Inativo") + '</div></div>' +
      '<div data-pane="int" style="display:none;" class="card card--pad-lg"><div class="card-title mb-12">Integrações</div>' +
        '<div class="flex items-center gap-12" style="padding:12px 0;border-bottom:1px solid var(--border);"><span style="color:var(--primary)">' + Ic("Wallet", 20) + '</span><div class="full"><b>Gateway de cobrança</b><div class="hint">PIX / Boleto / Cartão</div></div>' + UI.badge("Conectado") + '</div>' +
        '<div class="flex items-center gap-12" style="padding:12px 0;"><span style="color:var(--success)">' + Ic("Mail", 20) + '</span><div class="full"><b>E-mail transacional</b><div class="hint">Confirmações automáticas</div></div>' + UI.badge("Pendente") + '</div></div>';
    return head + tabs;
  }

  /* ===================== ROTAS DINÂMICAS / EXTRAS ===================== */
  window.Routes['/financeiro'] = financeiro;
  window.Routes['/agenda'] = agenda;
  window.Routes['/relatorios'] = relatorios;
  window.Routes['/configuracoes'] = configuracoes;
  const detalheId = function () {
    const m = location.hash.match(/^#\/imovel\/(.+)$/);
    return m ? imovelDetalhe(decodeURIComponent(m[1])) : imovelDetalhe(null);
  };
  window.Routes['/imovel/__dyn'] = detalheId;

  /* ===================== afterRender (fios de interação) ===================== */
  window.afterRender = async function (path, view) {
    // Tabs genéricos
    view.querySelectorAll('[data-tabs]').forEach((group) => {
      group.querySelectorAll('.tab[data-tab]').forEach((btn) => btn.addEventListener('click', () => {
        group.querySelectorAll('.tab').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const key = btn.getAttribute('data-tab');
        view.querySelectorAll('[data-pane]').forEach((p) => p.style.display = (p.getAttribute('data-pane') === key) ? '' : 'none');
      }));
    });

    // Imóveis: filtros + tabela + novo
    if (path === '/imoveis') {
      await renderImoveisTabela(view);
      const busca = view.querySelector('#f-busca'), tipo = view.querySelector('#f-tipo'), status = view.querySelector('#f-status');
      const filtrar = () => renderImoveisTabela(view);
      busca && busca.addEventListener('input', filtrar);
      tipo && tipo.addEventListener('change', filtrar);
      status && status.addEventListener('change', filtrar);
      const nv = view.querySelector('[data-novo]'); nv && nv.addEventListener('click', novoImovel);
    }

    // Proprietários: editar/excluir
    if (path === '/proprietarios') {
      view.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', async () => {
        const id = b.closest('.card').querySelector('.avatar') ? null : null;
        const cards = [...view.querySelectorAll('.cards-grid .card')];
        const card = b.closest('.card'); const nome = card.querySelector('div div').textContent;
        const p = await A.proprietarios.list(); const found = p.find((x) => x.nome === nome);
        if (!found) return;
        F.openForm('Editar proprietário', [
          { key: 'nome', label: 'Nome', required: true }, { key: 'doc', label: 'CPF/CNPJ', required: true },
          { key: 'email', label: 'E-mail', required: true }, { key: 'tel', label: 'Telefone', required: true },
          { key: 'imoveis_count', label: 'Qtd. imóveis', type: 'number' }, { key: 'banco', label: 'Banco / PIX' },
        ], found, async (pl) => { await A.proprietarios.update(found.id, pl); F.toast('Proprietário atualizado.', 'ok'); router(); });
      }));
      view.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
        const card = b.closest('.card'); const nome = card.querySelector('div div').textContent;
        const p = await A.proprietarios.list(); const found = p.find((x) => x.nome === nome);
        if (!found) return;
        F.confirmDelete('Excluir ' + nome + '?', async () => { await A.proprietarios.remove(found.id); F.toast('Excluído.', 'ok'); router(); });
      }));
      const nv = view.querySelector('[data-novo]'); nv && nv.addEventListener('click', () =>
        F.openForm('Novo proprietário', [
          { key: 'nome', label: 'Nome', required: true }, { key: 'doc', label: 'CPF/CNPJ', required: true },
          { key: 'email', label: 'E-mail', required: true }, { key: 'tel', label: 'Telefone', required: true },
          { key: 'imoveis_count', label: 'Qtd. imóveis', type: 'number' }, { key: 'banco', label: 'Banco / PIX' },
        ], {}, async (pl) => { await A.proprietarios.create(pl); F.toast('Proprietário adicionado.', 'ok'); router(); }));
    }

    // Financeiro: filtro por cliente (input + datalist gerados no financeiro())
    if (path === '/financeiro') {
      const inp = view.querySelector('#f-cliente');
      const clearBtn = view.querySelector('#f-cliente-clear');
      const det = view.querySelector('#fin-cliente-det');
      const metricsDiv = view.querySelector('#fin-cliente-metrics');
      const loadAggregate = async () => {
        try {
          const agg = await A.financeiro.aggregate();
          const kpisLocal = [
            { label: "Receita (mês)", value: fmt(agg.receita), icon: "DollarSign", tone: "success" },
            { label: "Despesas (mês)", value: fmt(agg.despesas), icon: "Wallet", tone: "warning" },
            { label: "Saldo", value: fmt(agg.saldo), icon: "TrendingUp", tone: "primary" },
            { label: "A receber", value: fmt(agg.aReceber), icon: "Clock", tone: "warning" },
          ];
          if (metricsDiv) metricsDiv.innerHTML = kpisLocal.map((k,i) => UI.statCard(k,i)).join('');
        } catch (e) { F.toast('Erro ao carregar métricas agregadas: ' + e.message, 'erro'); }
      };
      if (clearBtn) clearBtn.addEventListener('click', async () => { if (inp) inp.value = ''; if (det) det.innerHTML = ''; await loadAggregate(); });
      if (inp) {
        inp.addEventListener('input', async () => {
          const q = (inp.value || '').trim();
          if (!q) { if (det) det.innerHTML = ''; await loadAggregate(); return; }
          // find matching proprietor by exact name (datalist provides names)
          let found = null;
          try {
            const props = await A.proprietarios.list();
            found = props.find((p) => p.nome === q);
          } catch (e) { F.toast('Erro ao buscar proprietários: ' + e.message, 'erro'); }
          if (!found) return;
          if (metricsDiv) metricsDiv.innerHTML = '<div class="card"><div class="skeleton" style="height:60px;"></div></div>';
          if (det) det.innerHTML = '<div class="card"><div class="skeleton" style="height:120px;"></div></div>';
          try {
            const data = await A.financeiro.proprietario(found.id);
            const receita = data.metrics ? data.metrics.receita : (data.cobrancas || []).filter(c => c.status === 'Pago').reduce((s,c)=>s+Number(c.valor||0),0);
            const aReceber = data.metrics ? data.metrics.aReceber : (data.cobrancas || []).filter(c => c.status === 'Pendente').reduce((s,c)=>s+Number(c.valor||0),0);
            const despesas = data.metrics ? data.metrics.despesas : (data.manutencoes || []).reduce((s,m)=>s+Number(m.valor||0),0);
            const saldo = receita - despesas;
            const kpisClient = [
              { label: "Receita (mês)", value: fmt(receita), icon: "DollarSign", tone: "success" },
              { label: "Despesas (mês)", value: fmt(despesas), icon: "Wallet", tone: "warning" },
              { label: "Saldo", value: fmt(saldo), icon: "TrendingUp", tone: "primary" },
              { label: "A receber", value: fmt(aReceber), icon: "Clock", tone: "warning" },
            ];
            if (metricsDiv) metricsDiv.innerHTML = kpisClient.map((k,i) => UI.statCard(k,i)).join('');

            const nome = (data.proprietario && data.proprietario.nome) || '';
            const html = '<div class="card card--pad-lg"><div class="card-title mb-8">' + nome + ' — Resumo financeiro</div>' +
              '<div style="padding:6px 0;">Imóveis: ' + (data.imoveis.length) + ' • Contratos: ' + (data.contratos.length) + '</div>' +
              '<div style="padding:6px 0;font-weight:600;">Total cobranças: ' + fmt((data.cobrancas || []).reduce((s,c)=>s+Number(c.valor||0),0)) + '</div>' +
              ((data.cobrancas && data.cobrancas.length) ? table(["Venc.","Cliente","Contrato","Valor","Status"],
                data.cobrancas.map((cb) => '<tr><td class="muted">' + cb.vencimento + '</td><td>' + cb.cliente + '</td><td class="micro">' + (cb.contrato_codigo || cb.contrato_id) + '</td><td style="font-weight:600;">' + fmt(cb.valor) + '</td><td>' + UI.badge(cb.status) + '</td></tr>').join('')) : '<div class="hint" style="padding:8px 0;">Nenhuma cobrança para este cliente.</div>') +
              '</div>';
            if (det) det.innerHTML = html;
          } catch (e) { F.toast('Erro ao carregar dados do cliente: ' + e.message, 'erro'); if (det) det.innerHTML = ''; }
        });
      }
      // load initial aggregate metrics
      await loadAggregate();
    }

    // Tabelas CRUD genéricas (inquilinos/contratos/cobrancas/manutencoes/documentos)
    const crudMap = {
      '/inquilinos': { api: A.inquilinos, title: 'inquilino', fields: [
        { key: 'nome', label: 'Nome', required: true }, { key: 'cpf', label: 'CPF', required: true },
        { key: 'tel', label: 'Telefone', required: true }, { key: 'email', label: 'E-mail', required: true },
        { key: 'profissao', label: 'Profissão' }, { key: 'renda', label: 'Renda (R$)', type: 'number' },
        { key: 'contrato_id', label: 'ID do contrato', type: 'number' }, { key: 'status', label: 'Status', type: 'select', options: statusOpts(['Ativo', 'Atrasado']) } ] },
      '/contratos': { api: A.contratos, title: 'contrato', fields: [
        { key: 'codigo', label: 'Código', required: true }, { key: 'imovel_id', label: 'ID do imóvel', type: 'number', required: true },
        { key: 'proprietario', label: 'Proprietário', required: true }, { key: 'inquilino', label: 'Inquilino', required: true },
        { key: 'aluguel', label: 'Aluguel (R$)', type: 'number', required: true }, { key: 'iptu', label: 'IPTU (R$)', type: 'number' },
        { key: 'condominio', label: 'Condomínio (R$)', type: 'number' }, { key: 'inicio', label: 'Início', type: 'date', required: true },
        { key: 'fim', label: 'Fim', type: 'date', required: true }, { key: 'status', label: 'Status', type: 'select', options: statusOpts(['Ativo', 'Vencendo', 'Encerrado']) } ] },
      '/cobrancas': { api: A.cobrancas, title: 'cobrança', fields: [
        { key: 'codigo', label: 'Código', required: true }, { key: 'cliente', label: 'Cliente', required: true },
        { key: 'contrato_id', label: 'ID do contrato', type: 'number' }, { key: 'vencimento', label: 'Vencimento', type: 'date', required: true },
        { key: 'valor', label: 'Valor (R$)', type: 'number', required: true }, { key: 'tipo', label: 'Tipo', type: 'select', options: statusOpts(['Boleto', 'PIX', 'Cartão']) },
        { key: 'status', label: 'Status', type: 'select', options: statusOpts(['Pago', 'Pendente', 'Atrasado']) } ] },
      '/manutencoes': { api: A.manutencoes, title: 'manutenção', fields: [
        { key: 'codigo', label: 'Código', required: true }, { key: 'titulo', label: 'Título', required: true },
        { key: 'imovel_id', label: 'ID do imóvel', type: 'number', required: true }, { key: 'fornecedor', label: 'Fornecedor', required: true },
        { key: 'prioridade', label: 'Prioridade', type: 'select', options: statusOpts(['Alta', 'Média', 'Baixa']) },
        { key: 'status', label: 'Status', type: 'select', options: statusOpts(['Aberto', 'Em andamento', 'Finalizado']) },
        { key: 'valor', label: 'Valor (R$)', type: 'number', required: true } ] },
      '/documentos': { api: A.documentos, title: 'documento', upload: true, fields: [
        { key: 'nome', label: 'Nome', required: true }, { key: 'tipo', label: 'Tipo', type: 'select', options: statusOpts(['Contrato', 'Escritura', 'Comprovante', 'Imagem', 'Vistoria']) },
        { key: 'imovel_id', label: 'ID do imóvel', type: 'number', required: true },
        { key: 'arquivo', label: 'Arquivo (PDF/imagem)', type: 'file', required: true },
        { key: 'icone', label: 'Ícone (lucide)', required: true }, { key: 'tom', label: 'Tom', type: 'select', options: statusOpts(['primary', 'success', 'warning']) } ] },
    };
    if (crudMap[path]) {
      const cfg = crudMap[path];
      // formulário com upload de arquivo (multipart)
      const openDocForm = (initial) => {
        const fields = cfg.fields;
        const body = fields.map((f) => {
          const val = initial && initial[f.key] != null ? initial[f.key] : '';
          if (f.type === 'file') {
            return '<label style="display:block;margin-bottom:14px;"><span class="hint" style="display:block;margin-bottom:6px;">' + f.label + (f.required ? ' <span style="color:var(--danger)">*</span>' : '') + '</span><input class="field full" type="file" name="' + f.key + '"' + (f.required ? ' required' : '') + '></label>';
          }
          if (f.type === 'select') {
            const opts = (f.options || []).map((o) => '<option value="' + o.value + '"' + (String(val) === String(o.value) ? ' selected' : '') + '>' + (o.label || o.value) + '</option>').join('');
            return '<label style="display:block;margin-bottom:14px;"><span class="hint" style="display:block;margin-bottom:6px;">' + f.label + (f.required ? ' <span style="color:var(--danger)">*</span>' : '') + '</span><select class="field full select" name="' + f.key + '">' + opts + '</select></label>';
          }
          const t = f.type === 'number' ? 'number' : 'text';
          return '<label style="display:block;margin-bottom:14px;"><span class="hint" style="display:block;margin-bottom:6px;">' + f.label + (f.required ? ' <span style="color:var(--danger)">*</span>' : '') + '</span><input class="field full" name="' + f.key + '" type="' + t + '" value="' + String(val).replace(/"/g, '&quot;') + '"' + (f.required ? ' required' : '') + '></label>';
        }).join('');
        const scrim = document.createElement('div'); scrim.className = 'scrim show';
        const box = document.createElement('div');
        box.style.cssText = 'position:fixed;inset:0;z-index:91;display:grid;place-items:center;padding:16px;';
        box.innerHTML = '<div class="card card--pad-lg" style="width:min(520px,100%);max-height:90vh;overflow:auto;">' +
          '<div class="flex justify-between items-center" style="margin-bottom:16px;"><h3 class="card-title">' + (initial ? 'Editar ' : 'Novo ') + cfg.title + '</h3><button class="icon-btn" data-close>' + window.Icon('X', 20) + '</button></div>' +
          '<form id="frm-doc" enctype="multipart/form-data">' + body +
          '<div class="flex justify-between gap-12" style="margin-top:8px;"><button type="button" class="btn btn--ghost" data-close>Cancelar</button><button type="submit" class="btn btn--primary">Salvar</button></div></form></div>';
        document.body.appendChild(scrim); document.body.appendChild(box);
        const close = () => { scrim.remove(); box.remove(); };
        box.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
        scrim.addEventListener('click', close);
        box.querySelector('#frm-doc').addEventListener('submit', async (e) => {
          e.preventDefault();
          const fd = new FormData(box.querySelector('#frm-doc'));
          try {
            if (initial) await cfg.api.update(initial.id, fd); else await cfg.api.create(fd);
            F.toast(initial ? 'Documento atualizado.' : 'Documento adicionado.', 'ok'); close(); router();
          } catch (err) { F.toast('Erro: ' + err.message, 'erro'); }
        });
      };
      const makeForm = (initial) => {
        if (cfg.upload) return openDocForm(initial);
        // Special case: inquilinos should pick an existing contrato (select) or create one
        if (cfg.api === A.inquilinos) {
          (async () => {
            let contratos = [];
            try { contratos = await A.contratos.list(); } catch (e) { contratos = []; }
            const contratoOpts = [{ value: '', label: 'Criar novo contrato...' }].concat(contratos.map((c) => ({ value: c.id, label: (c.codigo || c.id) + ' • ' + (c.imovel_codigo || c.imovel_id) })));
            const fields = cfg.fields.map((f) => {
              if (f.key === 'contrato_id') return { key: 'contrato_id', label: 'Contrato', type: 'select', options: contratoOpts };
              return f;
            });

            F.openForm('Novo ' + cfg.title, fields, initial || {}, async (pl) => {
              // if user chose to create a new contract (blank value) open contract form first
              if (pl.contrato_id === '' || pl.contrato_id == null) {
                // contract form fields (same as contratos config)
                const contractFields = [
                  { key: 'codigo', label: 'Código', required: true },
                  { key: 'imovel_id', label: 'ID do imóvel', type: 'number', required: true },
                  { key: 'proprietario', label: 'Proprietário', required: true },
                  { key: 'inquilino', label: 'Inquilino', required: true },
                  { key: 'aluguel', label: 'Aluguel (R$)', type: 'number', required: true },
                  { key: 'iptu', label: 'IPTU (R$)', type: 'number' },
                  { key: 'condominio', label: 'Condomínio (R$)', type: 'number' },
                  { key: 'inicio', label: 'Início', type: 'date', required: true },
                  { key: 'fim', label: 'Fim', type: 'date', required: true },
                  { key: 'status', label: 'Status', type: 'select', options: statusOpts(['Ativo','Vencendo','Encerrado']) },
                ];
                F.openForm('Novo contrato', contractFields, {}, async (cpl) => {
                  // create contract then create tenant using the earlier payload
                  const created = await A.contratos.create(cpl);
                  F.toast('Contrato criado.', 'ok');
                  // try to set the select in the tenant form (if still present)
                  const sel = document.querySelector('select[data-key="contrato_id"]');
                  if (sel) {
                    const opt = document.createElement('option'); opt.value = created.id; opt.textContent = (created.codigo || created.id) + ' • ' + (created.imovel_codigo || created.imovel_id);
                    sel.appendChild(opt); sel.value = created.id;
                  }
                  // set the payload contrato_id and proceed to create tenant
                  pl.contrato_id = created.id;
                  await cfg.api.create(pl);
                  F.toast('Inquilino adicionado.', 'ok');
                  router();
                });
              } else {
                await cfg.api.create(pl);
                F.toast('Adicionado.', 'ok');
                router();
              }
            });
          })();
          return;
        }
        // default behavior
        return F.openForm('Novo ' + cfg.title, cfg.fields, initial || {}, async (pl) => { await cfg.api.create(pl); F.toast('Adicionado.', 'ok'); router(); });
      };
      view.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', async () => {
        const id = b.closest('tr').getAttribute('data-id');
        const item = await cfg.api.get(id);
        makeForm(item);
      }));
      view.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
        const id = b.closest('tr').getAttribute('data-id');
        F.confirmDelete('Excluir este ' + cfg.title + '?', async () => { await cfg.api.remove(id); F.toast('Excluído.', 'ok'); router(); });
      }));
      const nv = view.querySelector('[data-novo]'); nv && nv.addEventListener('click', () => makeForm(null));
    }

    // Detalhe do imóvel: preencher panes (só se o imóvel foi encontrado)
    if (location.hash.indexOf('#/imovel/') === 0) {
      const id = decodeURIComponent(location.hash.match(/^#\/imovel\/(.+)$/)[1]);
      const panes = view.querySelector('#p-contratos');
      if (panes) await fillDetalhePanes(view, id);
    }

    // Dashboard: exportar relatório (Python) + novo contrato
    if (path === '/') {
      view.querySelectorAll('[data-export-rel]').forEach((b) => b.addEventListener('click', async () => {
        try {
          const dados = await A.relatorios.dados();
          F.toast('Gerando PDF...', 'ok');
          const blob = await A.relatorios.exportarBlob(dados);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = 'relatorio-imobi.pdf'; a.click();
          URL.revokeObjectURL(url);
          F.toast('PDF gerado.', 'ok');
        } catch (e) { F.toast('Erro ao exportar: ' + e.message, 'erro'); }
      }));
      const nc = view.querySelector('[data-novo-contrato]');
      if (nc) nc.addEventListener('click', () => {
        F.openForm('Novo contrato', [
          { key: 'codigo', label: 'Código', required: true },
          { key: 'imovel_id', label: 'ID do imóvel', type: 'number', required: true },
          { key: 'proprietario', label: 'Proprietário', required: true },
          { key: 'inquilino', label: 'Inquilino', required: true },
          { key: 'aluguel', label: 'Aluguel (R$)', type: 'number', required: true },
          { key: 'iptu', label: 'IPTU (R$)', type: 'number' },
          { key: 'condominio', label: 'Condomínio (R$)', type: 'number' },
          { key: 'inicio', label: 'Início', type: 'date', required: true },
          { key: 'fim', label: 'Fim', type: 'date', required: true },
          { key: 'status', label: 'Status', type: 'select', options: statusOpts(['Ativo', 'Vencendo', 'Encerrado']) },
        ], {}, async (pl) => { await A.contratos.create(pl); F.toast('Contrato criado.', 'ok'); router(); });
      });
    }

    // Agenda: navegação de mês + criar/editar/excluir eventos
    if (path === '/agenda') {
      const mesAtual = () => agenda._mes;
      view.querySelector('[data-cal-prev]') && view.querySelector('[data-cal-prev]').addEventListener('click', () => {
        const { ano, m } = mesAtual(); const prev = new Date(ano, m - 1, 1); agenda._mes = { ano: prev.getFullYear(), m: prev.getMonth() }; router();
      });
      view.querySelector('[data-cal-next]') && view.querySelector('[data-cal-next]').addEventListener('click', () => {
        const { ano, m } = mesAtual(); const nx = new Date(ano, m + 1, 1); agenda._mes = { ano: nx.getFullYear(), m: nx.getMonth() }; router();
      });
      view.querySelector('[data-cal-hoje]') && view.querySelector('[data-cal-hoje]').addEventListener('click', () => {
        const hj = new Date(); agenda._mes = { ano: hj.getFullYear(), m: hj.getMonth() }; router();
      });
      view.querySelector('[data-cal-novo]') && view.querySelector('[data-cal-novo]').addEventListener('click', () => abrirEvento(null));
      view.querySelectorAll('[data-add-dia]').forEach((b) => b.addEventListener('click', (e) => {
        e.stopPropagation();
        const dia = Number(b.getAttribute('data-add-dia'));
        abrirEvento({ dia, tipo: 'Visita', hora: '09:00', titulo: '' });
      }));
      view.querySelectorAll('[data-ev]').forEach((b) => b.addEventListener('click', async () => {
        const id = b.getAttribute('data-ev'); if (!id) return;
        const item = await A.eventos.get(id);
        abrirEvento(item);
      }));
    }

    // Configurações: salvar perfil
    if (path === '/configuracoes') {
      const sv = view.querySelector('[data-salvar-perfil]');
      sv && sv.addEventListener('click', async () => {
        const u = await A.usuario.list().then((l) => l[0]);
        await A.usuario.update(u.id, {
          nome: view.querySelector('#cfg-nome').value,
          email: view.querySelector('#cfg-email').value,
          cargo: view.querySelector('#cfg-cargo').value,
        });
        F.toast('Perfil salvo.', 'ok');
      });
    }
  };
})();
