/* =====================================================================
   ui-notify.js — painel de notificações (sino).
   Busca /api/notificacoes (calculado a partir de cobranças atrasadas/
   pendentes, contratos vencendo e manutenções) e mostra num dropdown.
   ===================================================================== */
window.Notificacoes = (function () {
  let panel = null;
  let dot = null;

  function render(list) {
    if (!panel) return;
    const itens = list.map(function (n) {
      const rgb = 'var(--' + n.tom + '-rgb)';
      return '<div class="notif-item">' +
        '<span class="notif-ico" style="background:rgb(' + rgb + ' / .14);color:var(--' + n.tom + ');">' + window.Icon(n.icone, 18) + '</span>' +
        '<div style="min-width:0;"><div style="font-size:14px;font-weight:600;">' + n.titulo + '</div>' +
        '<div class="hint truncate">' + n.texto + '</div></div></div>';
    }).join('');
    panel.querySelector('.notif-list').innerHTML = itens;
    // badge no sino (quantidade de pendências reais)
    const pend = list.filter(function (n) { return n.tom !== 'success'; }).length;
    if (dot) { dot.style.display = pend ? 'block' : 'none'; }
  }

  function open() {
    panel.classList.add('show');
    refresh();
  }
  function close() { panel.classList.remove('show'); }

  function initBell(btn, dotEl) {
    dot = dotEl;
    panel = document.createElement('div');
    panel.className = 'notif-panel';
    panel.innerHTML =
      '<div class="notif-head"><b>Notificações</b><span class="hint">tempo real</span></div>' +
      '<div class="notif-list"></div>';
    document.body.appendChild(panel);

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (panel.classList.contains('show')) close(); else open();
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('show') && !panel.contains(e.target) && e.target !== btn) close();
    });
  }

  async function refresh() {
    try {
      const list = await window.API.req('GET', '/api/notificacoes');
      render(list);
    } catch (e) { /* silencioso */ }
  }

  return { initBell: initBell, refresh: refresh };
})();
