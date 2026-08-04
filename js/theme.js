/* Tema claro/escuro (seção 6 da doc).
   - Aplica classe .dark no <html> com base em localStorage("theme").
   - Feito o quanto antes no <head> (ver index.html) para evitar flash.
   - Aqui só ficam o toggle e o estado inicial de leitura. */
window.Theme = (function () {
  function current() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
  function set(mode) {
    if (mode === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    try { localStorage.setItem('theme', mode); } catch (e) {}
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.dataset.mode = mode;
  }
  function toggle() {
    set(current() === 'dark' ? 'light' : 'dark');
  }
  return { current: current, set: set, toggle: toggle };
})();
