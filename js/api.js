/* =====================================================================
   api.js — cliente REST do front (substitui os mocks de window.Data).
   Toda leitura/escrita passa por aqui; valores numéricos são
   formatados no front com Intl.NumberFormat pt-BR.
   ===================================================================== */
window.API = (function () {
  const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const fmtBRL = (n) => (n == null ? "R$ 0" : BRL.format(Number(n)));

  async function req(method, url, body) {
    const opt = { method, headers: {} };
    if (body !== undefined) {
      if (typeof FormData !== 'undefined' && body instanceof FormData) {
        // Não definir Content-Type: o browser/navegador define o boundary do multipart
        opt.body = body;
      } else {
        opt.headers["Content-Type"] = "application/json";
        opt.body = JSON.stringify(body);
      }
    }
    const res = await fetch(url, opt);
    if (!res.ok) {
      let msg = res.status + " " + res.statusText;
      try { const e = await res.json(); if (e.error) msg = e.error; } catch (_) {}
      throw new Error(msg);
    }
    if (res.status === 204) return null;
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res;
  }

  const crud = (res) => ({
    list: () => req("GET", "/api/" + res),
    get: (id) => req("GET", "/api/" + res + "/" + id),
    create: (b) => req("POST", "/api/" + res, b),
    update: (id, b) => req("PUT", "/api/" + res + "/" + id, b),
    remove: (id) => req("DELETE", "/api/" + res + "/" + id),
  });

  return {
    BRL, fmtBRL, req,
    imoveis: crud("imoveis"),
    proprietarios: crud("proprietarios"),
    inquilinos: crud("inquilinos"),
    contratos: crud("contratos"),
    cobrancas: crud("cobrancas"),
    lancamentos: crud("lancamentos"),
    manutencoes: crud("manutencoes"),
    documentos: crud("documentos"),
    eventos: crud("eventos"),
    usuario: crud("usuario"),
    notificacoes: () => req("GET", "/api/notificacoes"),
    kpis: () => req("GET", "/api/dashboard/kpis"),
    series: {
      receita: () => req("GET", "/api/series/receita"),
      fluxo: () => req("GET", "/api/series/fluxo"),
      ocupacao: () => req("GET", "/api/series/ocupacao"),
      pizza: () => req("GET", "/api/series/pizza"),
    },
    relatorios: {
      dados: () => req("GET", "/api/relatorios/dados"),
      exportar: (body) => req("POST", "/api/relatorios/export", body),
      exportarBlob: async (body) => {
        const res = await fetch("/api/relatorios/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) { let m = res.statusText; try { m = (await res.json()).error; } catch (_) {} throw new Error(m); }
        return res.blob();
      },
    },
  };
})();
