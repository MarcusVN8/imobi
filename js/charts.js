/* =====================================================================
   GRÁFICOS em SVG PURO (substituto do Recharts, sem biblioteca).
   Conhecimento humano: calculamos pontos num viewBox e montamos paths.
   Tooltips via <title> nativo do SVG (acessível, sem JS extra).
   Todos usam viewBox responsivo (width:100%, height fixa via CSS).
   ===================================================================== */
window.Charts = (function () {
  const W = 720, H = 256, PAD_L = 44, PAD_R = 12, PAD_T = 16, PAD_B = 28;
  const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  function niceMax(v) {
    const steps = [10, 20, 30, 50, 80, 100, 150, 200, 300, 500, 800, 1000, 2000, 10000];
    for (const s of steps) if (v <= s) return s;
    return Math.ceil(v / 1000) * 1000;
  }
  function x(i, n) { return PAD_L + (W - PAD_L - PAD_R) * (n === 1 ? .5 : i / (n - 1)); }
  function y(v, max) { return PAD_T + (H - PAD_T - PAD_B) * (1 - v / max); }

  function gridY(max) {
    let g = '';
    for (let k = 0; k <= 4; k++) {
      const val = max * (k / 4);
      const yy = y(val, max);
      g += '<line x1="' + PAD_L + '" y1="' + yy + '" x2="' + (W - PAD_R) + '" y2="' + yy +
           '" stroke="var(--border)" stroke-width="1" stroke-dasharray="3 4"/>';
      g += '<text x="' + (PAD_L - 8) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="11" fill="var(--muted-foreground)">' +
           (val >= 1000 ? (val / 1000) + 'k' : val) + '</text>';
    }
    return g;
  }

  // AreaChart com gradiente vertical primário 35%→0% (seção 7)
  function area(series) {
    const max = niceMax(Math.max.apply(null, series.map(function (d) { return d.v; })) * 1.1);
    const n = series.length;
    let line = '', area = '', labels = '';
    series.forEach(function (d, i) {
      const px = x(i, n), py = y(d.v, max);
      line += (i === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1) + ' ';
      area += (i === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1) + ' ';
      labels += '<text x="' + px + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="var(--muted-foreground)">' + d.m + '</text>';
      labels += '<circle cx="' + px + '" cy="' + py + '" r="3.5" fill="var(--primary)"><title>' + d.m + ': ' + BRL.format(d.v * 1000) + '</title></circle>';
    });
    const baseY = H - PAD_B;
    area += 'L' + x(n - 1, n).toFixed(1) + ' ' + baseY + ' L' + x(0, n).toFixed(1) + ' ' + baseY + ' Z';

    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="width:100%;height:256px;" role="img" aria-label="Gráfico de receita">' +
      '<defs><linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="var(--primary)" stop-opacity="0.35"/>' +
        '<stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      gridY(max) +
      '<path d="' + area + '" fill="url(#gradArea)"/>' +
      '<path d="' + line + '" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      labels +
    '</svg>';
  }

  // BarChart empilhado simples: receita vs despesa (seção 3 Financeiro / Relatórios)
  function bars(series) {
    const max = niceMax(Math.max.apply(null, series.map(function (d) { return d.r + d.d; })) * 1.1);
    const n = series.length;
    const band = (W - PAD_L - PAD_R) / n;
    const bw = Math.min(26, band * 0.5);
    let body = '', labels = '';
    series.forEach(function (d, i) {
      const cx = PAD_L + band * (i + 0.5);
      const hR = (H - PAD_T - PAD_B) * (d.r / max);
      const hD = (H - PAD_T - PAD_B) * (d.d / max);
      const yR = baseY() - hR;
      const yD = yR - hD;
      body += '<rect x="' + (cx - bw / 2) + '" y="' + yR + '" width="' + bw + '" height="' + hR + '" rx="3" fill="var(--success)"><title>' + d.m + ' receita: ' + BRL.format(d.r * 1000) + '</title></rect>';
      body += '<rect x="' + (cx - bw / 2) + '" y="' + yD + '" width="' + bw + '" height="' + hD + '" rx="3" fill="var(--danger)"><title>' + d.m + ' despesa: ' + BRL.format(d.d * 1000) + '</title></rect>';
      labels += '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="var(--muted-foreground)">' + d.m + '</text>';
    });
    function baseY() { return H - PAD_B; }
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="width:100%;height:256px;" role="img" aria-label="Gráfico de fluxo de caixa">' +
      gridY(max) + body + labels + '</svg>';
  }

  // LineChart (ocupação %)
  function line(series) {
    const max = 100; const n = series.length;
    let line = '', labels = '';
    series.forEach(function (d, i) {
      const px = x(i, n), py = y(d.v, max);
      line += (i === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1) + ' ';
      labels += '<text x="' + px + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="var(--muted-foreground)">' + d.m + '</text>';
      labels += '<circle cx="' + px + '" cy="' + py + '" r="3.5" fill="var(--purple)"><title>' + d.m + ': ' + d.v + '%</title></circle>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="width:100%;height:256px;" role="img" aria-label="Gráfico de ocupação">' +
      gridY(max) +
      '<path d="' + line + '" fill="none" stroke="var(--purple)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      labels + '</svg>';
  }

  // PieChart (donut) com legenda lateral
  function pie(data) {
    const total = data.reduce(function (s, d) { return s + d.valor; }, 0);
    const cx = 110, cy = 110, r = 80, sw = 26;
    let acc = 0, arcs = '';
    data.forEach(function (d) {
      const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2;
      acc += d.valor;
      const a1 = (acc / total) * Math.PI * 2 - Math.PI / 2;
      const large = (a1 - a0) > Math.PI ? 1 : 0;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      arcs += '<path d="M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) +
              '" fill="none" stroke="' + d.cor + '" stroke-width="' + sw + '" stroke-linecap="butt"><title>' + d.label + ': ' + d.valor + '%</title></path>';
    });
    let legend = '';
    data.forEach(function (d) {
      legend += '<div class="flex items-center gap-8" style="font-size:13px;margin-bottom:8px;">' +
        '<span style="width:10px;height:10px;border-radius:3px;background:' + d.cor + ';flex:none;"></span>' +
        '<span class="flex justify-between full"><span>' + d.label + '</span><span class="muted">' + d.valor + '%</span></span></div>';
    });
    return '<div class="flex items-center gap-24" style="flex-wrap:wrap;">' +
      '<svg viewBox="0 0 220 220" style="width:200px;height:200px;flex:none;" role="img" aria-label="Distribuição por tipo">' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="var(--border)" stroke-width="' + sw + '"/>' +
        arcs + '</svg>' +
      '<div style="min-width:160px;">' + legend + '</div></div>';
  }

  return { area, bars, line, pie };
})();
