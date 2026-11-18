/* Indicador de película (didático, NÃO medido). Fórmula do Plano Mestre v2, seção 4.2.1. */
(function (root) {
  "use strict";
  const lim = (v, a, b) => Math.min(b, Math.max(a, v));
  function filme(oil, rpm, sev) {
    const N = +oil, base = N < 50 ? N : N <= 90 ? 50 + 1.25 * (N - 50) : Math.min(150, 100 + 5 * (N - 90));
    const f = 1 - 0.10 * lim((rpm - 600) / 3000, 0, 1) - 0.10 * lim(+sev || 0, 0, 1), v = base * f;
    if (N < 50) return { um: Math.min(v, 49.9), estado: "baixo", rotulo: "Falhada / óleo baixo" };
    if (N <= 90) return { um: lim(v, 50, 100), estado: "ideal", rotulo: "Contínua / ideal" };
    return { um: lim(v, 100, 150), estado: "espesso", rotulo: "Espessa / excesso" };
  }
  const API = { filme };
  if (typeof module !== "undefined") module.exports = API; else root.BearingFilme = API;
})(typeof self !== "undefined" ? self : globalThis);
