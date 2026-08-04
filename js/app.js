/* =====================================================================
   APP: AppShell + roteador client-side por hash (substituto do
   TanStack Router). Funciona abrindo o index.html direto (file://),
   útil para a VM CyberOps sem servidor web.
   ===================================================================== */
window.Nav = [
  { href: "#/", label: "Dashboard", icon: "LayoutDashboard", title: "Imobi — Dashboard" },
  { href: "#/imoveis", label: "Imóveis", icon: "Building2", title: "Imóveis — Imobi" },
  { href: "#/proprietarios", label: "Proprietários", icon: "Users", title: "Proprietários — Imobi" },
  { href: "#/inquilinos", label: "Inquilinos", icon: "Users", title: "Inquilinos — Imobi" },
  { href: "#/contratos", label: "Contratos", icon: "FileText", title: "Contratos — Imobi" },
  { href: "#/financeiro", label: "Financeiro", icon: "Wallet", title: "Financeiro — Imobi" },
  { href: "#/cobrancas", label: "Cobranças", icon: "CreditCard", title: "Cobranças — Imobi" },
  { href: "#/agenda", label: "Agenda", icon: "Calendar", title: "Agenda — Imobi" },
  { href: "#/manutencoes", label: "Manutenções", icon: "Wrench", title: "Manutenções — Imobi" },
  { href: "#/documentos", label: "Documentos", icon: "FolderOpen", title: "Documentos — Imobi" },
  { href: "#/relatorios", label: "Relatórios", icon: "BarChart3", title: "Relatórios — Imobi" },
  { href: "#/configuracoes", label: "Configurações", icon: "Settings", title: "Configurações — Imobi" },
];

window.Routes = {}; // preenchido por pages/*.js: Routes["/"] = function(){ return html }

function renderShell() {
  const navItems = window.Nav.map(function (n) {
    return '<a class="nav-item" data-href="' + n.href + '" href="' + n.href + '">' +
      window.Icon(n.icon, 18) + '<span>' + n.label + '</span></a>';
  }).join('');

  document.getElementById('root').innerHTML =
    '<div class="app">' +
      '<aside class="sidebar" id="sidebar">' +
        '<div class="sidebar__brand">' +
          '<div class="sidebar__logo">I</div><div class="sidebar__name">Imobi</div>' +
        '</div>' +
        '<nav class="sidebar__nav">' + navItems + '</nav>' +
        '<div class="sidebar__footer">' +
          '<div class="plan-card" style="background:var(--sidebar-accent);cursor:default;">' +
            '<div class="row"><span class="name">Imobi</span><span class="badge badge--muted">' + window.Icon("ShieldCheck", 14) + ' Local</span></div>' +
            '<div class="hint mt-8" style="margin-top:8px;">Seus dados, seu servidor.</div>' +
          '</div>' +
        '</div>' +
      '</aside>' +
      '<div class="scrim" id="scrim"></div>' +
      '<div class="content">' +
        '<header class="topbar">' +
          '<button class="icon-btn menu-btn" id="menu-btn" aria-label="Abrir menu">' + window.Icon("Menu", 20) + '</button>' +
          '<div class="topbar__search">' + window.Icon("Search", 18) +
            '<input placeholder="Buscar imóveis, contratos..." aria-label="Busca global">' +
          '</div>' +
          '<div class="topbar__spacer"></div>' +
          '<button class="icon-btn" id="theme-toggle" data-mode="light" aria-label="Alternar tema">' + window.Icon("Moon", 20) + '</button>' +
          '<button class="icon-btn" id="bell-btn" aria-label="Notificações">' + window.Icon("Bell", 20) + '<span class="badge-dot" id="bell-dot" style="display:none;"></span></button>' +
          '<a class="icon-btn" href="#/configuracoes" aria-label="Configurações">' + window.Icon("Settings", 20) + '</a>' +
          '<div class="flex items-center gap-10">' +
            '<div class="avatar">MC</div>' +
            '<div class="topbar__name"><b>Marcus C.</b><span>Corretor</span></div>' +
          '</div>' +
        '</header>' +
        '<main class="main"><div class="container" id="view"></div></main>' +
      '</div>' +
    '</div>';

  // Tema: ícone reflete modo
  const tbtn = document.getElementById('theme-toggle');
  function syncThemeIcon() {
    const dark = window.Theme.current() === 'dark';
    tbtn.innerHTML = window.Icon(dark ? 'Sun' : 'Moon', 20);
  }
  syncThemeIcon();
  tbtn.addEventListener('click', function () { window.Theme.toggle(); syncThemeIcon(); });

  // Sino de notificações → abre painel (ui-notify.js)
  const bellBtn = document.getElementById('bell-btn');
  if (bellBtn && window.Notificacoes) {
    window.Notificacoes.initBell(bellBtn, document.getElementById('bell-dot'));
    window.Notificacoes.refresh();
  }

  // Sidebar mobile (Sheet)
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('scrim');
  document.getElementById('menu-btn').addEventListener('click', function () {
    sidebar.classList.add('open'); scrim.classList.add('show');
  });
  scrim.addEventListener('click', function () { sidebar.classList.remove('open'); scrim.classList.remove('show'); });
}

function router() {
  let hash = location.hash || '#/';
  if (hash === '#') hash = '#/';
  const path = hash.slice(1); // "/imoveis"
  let route = window.Routes[path];
  // Rota dinâmica /imovel/:id (a função lê o hash internamente)
  if (!route && path.indexOf('/imovel/') === 0) route = window.Routes['/imovel/__dyn'];
  if (!route) route = window.Routes['/'];
  const nav = window.Nav.find(function (n) { return n.href === hash; }) || window.Nav[0];
  document.title = nav.title;

  // navegação ativa
  document.querySelectorAll('.nav-item').forEach(function (a) {
    a.classList.toggle('is-active', a.getAttribute('data-href') === hash);
  });

  const view = document.getElementById('view');
  // Loading skeleton breve (seção 6) — dados vêm do backend, então é rápido
  view.innerHTML = '<div class="card"><div class="skeleton" style="height:200px;"></div></div>';
  // PAGE e afterRender são async (fazem fetch); aguardamos antes de pintar
  Promise.resolve().then(async function () {
    try {
      view.innerHTML = await route();
      if (window.afterRender) await window.afterRender(path, view);
    } catch (e) {
      view.innerHTML = '<div class="empty"><div class="empty__circle">' + window.Icon('AlertCircle', 26) +
        '</div><h3>Erro ao carregar</h3><p>' + (e && e.message ? e.message : e) + '</p></div>';
    }
    // fecha Sheet mobile ao navegar
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('scrim').classList.remove('show');
  });
}

document.addEventListener('DOMContentLoaded', function () {
  renderShell();
  router();
  window.addEventListener('hashchange', router);
});

// hook opcional preenchido pelas páginas (ex.: filtros, tabs)
window.afterRender = function () {};
