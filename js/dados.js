/* =====================================================================
   DADOS MOCK (fiel à seção 5 da doc) + HELPERS de componentes
   Em produção: number + Intl.NumberFormat("pt-BR"). Aqui os mocks são
   strings pt-BR conforme a doc avisa.
   ===================================================================== */
window.Data = (function () {
  const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  // ---- Interfaces da doc (seção 5) ----
  const imoveis = [
    { id: "IMB-1042", end: "Rua das Acácias, 120", cidade: "São Paulo", tipo: "Apartamento", valor: "R$ 3.200", status: "Alugado", prop: "Helena Costa" },
    { id: "IMB-1043", end: "Av. Brasil, 980", cidade: "Campinas", tipo: "Casa", valor: "R$ 5.400", status: "Disponível", prop: "Marcos Lima" },
    { id: "IMB-1044", end: "Rua Sete, 45", cidade: "São Paulo", tipo: "Sala comercial", valor: "R$ 2.800", status: "Alugado", prop: "Helena Costa" },
    { id: "IMB-1045", end: "Travessa do Sol, 12", cidade: "Osasco", tipo: "Casa", valor: "R$ 4.100", status: "Manutenção", prop: "Paula Reis" },
    { id: "IMB-1046", end: "Rua das Flores, 300", cidade: "Santos", tipo: "Apartamento", valor: "R$ 3.900", status: "Disponível", prop: "Marcos Lima" },
    { id: "IMB-1047", end: "Av. Central, 55", cidade: "São Paulo", tipo: "Apartamento", valor: "R$ 6.200", status: "Alugado", prop: "Paula Reis" },
    { id: "IMB-1048", end: "Rua B, 88", cidade: "Campinas", tipo: "Sala comercial", valor: "R$ 2.200", status: "Disponível", prop: "Helena Costa" },
    { id: "IMB-1049", end: "Rua Verde, 7", cidade: "Osasco", tipo: "Casa", valor: "R$ 3.500", status: "Alugado", prop: "Marcos Lima" },
  ];

  const proprietarios = [
    { nome: "Helena Costa", doc: "123.456.789-00", email: "helena@email.com", tel: "(11) 98888-1234", imoveis: 3, banco: "Nubank • 119944...88" },
    { nome: "Marcos Lima", doc: "987.654.321-00", email: "marcos@email.com", tel: "(19) 99666-2233", imoveis: 3, banco: "Itaú • 00677...21" },
    { nome: "Paula Reis", doc: "111.222.333-44", email: "paula@email.com", tel: "(11) 97777-3344", imoveis: 2, banco: "Bradesco • 00233...09" },
  ];

  const inquilinos = [
    { nome: "João Pedro", cpf: "222.333.444-55", tel: "(11) 97000-1111", email: "jp@email.com", prof: "Engenheiro", renda: "R$ 9.500", contrato: "CT-2201", status: "Ativo" },
    { nome: "Ana Souza", cpf: "333.444.555-66", tel: "(11) 97111-2222", email: "ana@email.com", prof: "Médica", renda: "R$ 14.000", contrato: "CT-2202", status: "Ativo" },
    { nome: "Carlos Mendes", cpf: "444.555.666-77", tel: "(19) 97222-3333", email: "carlos@email.com", prof: "Professor", renda: "R$ 5.200", contrato: "CT-2203", status: "Atrasado" },
    { nome: "Beatriz Lima", cpf: "555.666.777-88", tel: "(11) 97333-4444", email: "bia@email.com", prof: "Designer", renda: "R$ 7.800", contrato: "CT-2204", status: "Ativo" },
  ];

  const contratos = [
    { id: "CT-2201", imovel: "IMB-1042", prop: "Helena Costa", inq: "João Pedro", aluguel: "R$ 3.200", iptu: "R$ 90", cond: "R$ 410", ini: "2025-01-10", fim: "2026-01-10", status: "Ativo" },
    { id: "CT-2202", imovel: "IMB-1044", prop: "Helena Costa", inq: "Ana Souza", aluguel: "R$ 2.800", iptu: "R$ 70", cond: "R$ 300", ini: "2025-02-01", fim: "2025-08-01", status: "Vencendo" },
    { id: "CT-2203", imovel: "IMB-1043", prop: "Marcos Lima", inq: "Carlos Mendes", aluguel: "R$ 5.400", iptu: "R$ 140", cond: "R$ 0", ini: "2024-09-15", fim: "2025-09-15", status: "Ativo" },
    { id: "CT-2204", imovel: "IMB-1047", prop: "Paula Reis", inq: "Beatriz Lima", aluguel: "R$ 6.200", iptu: "R$ 160", cond: "R$ 520", ini: "2025-03-05", fim: "2024-03-05", status: "Encerrado" },
  ];

  const cobrancas = [
    { id: "CB-001", cliente: "João Pedro", contrato: "CT-2201", venc: "2026-08-10", valor: "R$ 3.200", tipo: "Boleto", status: "Pago" },
    { id: "CB-002", cliente: "Ana Souza", contrato: "CT-2202", venc: "2026-08-05", valor: "R$ 2.800", tipo: "PIX", status: "Pendente" },
    { id: "CB-003", cliente: "Carlos Mendes", contrato: "CT-2203", venc: "2026-07-20", valor: "R$ 5.400", tipo: "Boleto", status: "Atrasado" },
    { id: "CB-004", cliente: "Beatriz Lima", contrato: "CT-2204", venc: "2026-08-12", valor: "R$ 6.200", tipo: "Cartão", status: "Pendente" },
  ];

  const lancamentos = [
    { data: "2026-08-01", desc: "Aluguel IMB-1042", cat: "Receita", valor: "R$ 3.200", status: "Pago" },
    { data: "2026-08-01", desc: "Aluguel IMB-1044", cat: "Receita", valor: "R$ 2.800", status: "Pago" },
    { data: "2026-08-02", desc: "IPTU IMB-1043", cat: "Despesa", valor: "R$ 140", status: "Pendente" },
    { data: "2026-08-03", desc: "Manutenção IMB-1045", cat: "Despesa", valor: "R$ 620", status: "Pendente" },
    { data: "2026-08-04", desc: "Aluguel IMB-1047", cat: "Receita", valor: "R$ 6.200", status: "Pendente" },
  ];

  const manutencoes = [
    { id: "MT-01", titulo: "Vazamento de torneira", imovel: "IMB-1045", forn: "Encanador Jr", prio: "Alta", status: "Aberto", valor: "R$ 320" },
    { id: "MT-02", titulo: "Pintura da sala", imovel: "IMB-1044", forn: "Pinturas Top", prio: "Média", status: "Em andamento", valor: "R$ 850" },
    { id: "MT-03", titulo: "Troca de fechadura", imovel: "IMB-1043", forn: "Serralheria Forte", prio: "Baixa", status: "Finalizado", valor: "R$ 210" },
    { id: "MT-04", titulo: "Ar condicionado", imovel: "IMB-1047", forn: "ClimaPro", prio: "Alta", status: "Em andamento", valor: "R$ 1.400" },
  ];

  const documentos = [
    { nome: "Contrato CT-2201", tipo: "Contrato", imovel: "IMB-1042", tam: "284 KB", icon: "FileText", tone: "primary" },
    { nome: "Escritura IMB-1043", tipo: "Escritura", imovel: "IMB-1043", tam: "1.2 MB", icon: "File", tone: "success" },
    { nome: "Comprovante PIX", tipo: "Comprovante", imovel: "IMB-1042", tam: "64 KB", icon: "Receipt", tone: "warning" },
    { nome: "Vistoria IMB-1045", tipo: "Vistoria", imovel: "IMB-1045", tam: "2.1 MB", icon: "ClipboardList", tone: "primary" },
    { nome: "Foto fachada", tipo: "Imagem", imovel: "IMB-1046", tam: "3.4 MB", icon: "Eye", tone: "success" },
    { nome: "Contrato CT-2203", tipo: "Contrato", imovel: "IMB-1043", tam: "290 KB", icon: "FileText", tone: "primary" },
  ];

  // Eventos de agosto/2026
  const eventos = [
    { dia: 5, titulo: "Visita IMB-1046", tipo: "Visita", hora: "14:00" },
    { dia: 8, titulo: "Vistoria IMB-1045", tipo: "Vistoria", hora: "10:30" },
    { dia: 12, titulo: "Renovação CT-2204", tipo: "Renovação", hora: "09:00" },
    { dia: 18, titulo: "Assinatura CT-2209", tipo: "Assinatura", hora: "16:00" },
    { dia: 22, titulo: "Visita IMB-1043", tipo: "Visita", hora: "11:00" },
  ];

  // Séries para gráficos (receita mensal / fluxo de caixa)
  const receita = [
    { m: "Jan", v: 42 }, { m: "Fev", v: 38 }, { m: "Mar", v: 51 }, { m: "Abr", v: 47 },
    { m: "Mai", v: 58 }, { m: "Jun", v: 62 }, { m: "Jul", v: 69 }, { m: "Ago", v: 74 },
  ];
  const fluxo = [
    { m: "Jan", r: 42, d: 18 }, { m: "Fev", r: 38, d: 20 }, { m: "Mar", r: 51, d: 22 }, { m: "Abr", r: 47, d: 19 },
    { m: "Mai", r: 58, d: 24 }, { m: "Jun", r: 62, d: 26 }, { m: "Jul", r: 69, d: 28 }, { m: "Ago", r: 74, d: 30 },
  ];
  const ocupacao = [
    { m: "Jan", v: 78 }, { m: "Fev", v: 80 }, { m: "Mar", v: 83 }, { m: "Abr", v: 81 },
    { m: "Mai", v: 86 }, { m: "Jun", v: 88 }, { m: "Jul", v: 90 }, { m: "Ago", v: 92 },
  ];
  const pizza = [
    { label: "Residencial", valor: 58, cor: "#2563EB" },
    { label: "Comercial", valor: 24, cor: "#22C55E" },
    { label: "Vago", valor: 11, cor: "#F59E0B" },
    { label: "Manut.", valor: 7, cor: "#EF4444" },
  ];

  return {
    BRL, imoveis, proprietarios, inquilinos, contratos, cobrancas, lancamentos,
    manutencoes, documentos, eventos, receita, fluxo, ocupacao, pizza,
  };
})();

/* =====================================================================
   HELPERS de componente (reutilizados por todas as páginas)
   ===================================================================== */
window.UI = (function () {
  // Mapeia status/estado textual em classe de badge (convenção da doc)
  function badgeClass(texto) {
    const t = (texto || "").toLowerCase();
    if (["alugado", "ativo", "pago", "disponível", "finalizado", "sucesso"].includes(t)) return "badge--success";
    if (["pendente", "vencendo", "em andamento", "média"].includes(t)) return "badge--warning";
    if (["atrasado", "aberto", "manutenção", "alta", "perigo", "danger"].includes(t)) return "badge--danger";
    if (["inativo", "encerrado", "baixa"].includes(t)) return "badge--muted";
    return "badge--primary";
  }
  function badge(texto) {
    return '<span class="badge ' + badgeClass(texto) + '"><span class="dot"></span>' + texto + '</span>';
  }

  // KPI card (seção 3 StatCard): ícone 40x40 canto sup. dir, label + valor + hint, entrada animada
  function statCard(o, i) {
    const tone = o.tone || "primary";
    const rgb = "var(--" + tone + "-rgb)";
    return '<div class="card card--hover anim-in" style="animation-delay:' + (i * 50) + 'ms; padding:20px;">' +
      '<div class="flex justify-between items-center" style="align-items:flex-start;">' +
        '<div style="min-width:0">' +
          '<div class="hint">' + o.label + '</div>' +
          '<div class="kpi-value mt-8" style="margin-top:6px;">' + o.value + '</div>' +
          (o.hint ? '<div class="hint mt-8" style="margin-top:6px;">' + o.hint + '</div>' : '') +
        '</div>' +
        '<div style="width:40px;height:40px;border-radius:var(--r-xl);background:rgb(' + rgb + ' / .10);color:var(--' + tone + ');display:grid;place-items:center;flex:none;">' +
          window.Icon(o.icon, 20) +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // Empty state (seção 6)
  function empty(icon, titulo, texto, cta) {
    return '<div class="empty">' +
      '<div class="empty__circle">' + window.Icon(icon, 26) + '</div>' +
      '<h3>' + titulo + '</h3><p>' + texto + '</p>' +
      (cta ? cta : '') +
    '</div>';
  }

  // PageHeader (seção 3): breadcrumb + H1 + descrição + ações
  function pageHeader(crumb, h1, desc, actionsHtml) {
    const crumbs = crumb.map(function (c, i) {
      if (i === crumb.length - 1) return '<span>' + c + '</span>';
      return '<a href="#/">' + c + '</a><span class="sep">' + window.Icon("ChevronRight", 12) + '</span>';
    }).join(' ');
    return '<header class="page-header">' +
      '<div class="breadcrumb">' + crumbs + '</div>' +
      '<div class="page-header__top">' +
        '<div><h1 class="h1">' + h1 + '</h1>' + (desc ? '<p class="muted mt-8" style="margin-top:6px;">' + desc + '</p>' : '') + '</div>' +
        (actionsHtml ? '<div class="page-header__actions">' + actionsHtml + '</div>' : '') +
      '</div></header>';
  }

  return { badge, badgeClass, statCard, empty, pageHeader };
})();
