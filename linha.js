/* Linha do tempo da falha (Sprint 2, #10 #11): buffer de estado (janela de 10 min simulados), ruptura e índice de saúde visual. */
(function (root) {
  "use strict";
  const JANELA = 600;
  const amostra = (S, F) => { const f = F.filme(S.oil, S.rpm, S.sev); return { t: S.t, perfil: S.profile, sev: +S.sev, temp: S.temp, oil: S.oil, rpm: S.rpm, load: S.load, fault: S.fault, um: f.um, estado: f.estado }; };
  /* premissa didática: ruptura da película = nível < 50% (película falhada) ou severidade >= 0,8 */
  const rompeu = a => a.estado === "baixo" || a.sev >= 0.8;
  const saude = a => Math.max(0, Math.min(1, 1 - a.sev)); /* índice de saúde (só visual, não altera o diagnóstico) */
  function Linha() {
    const L = { a: [] };
    L.push = (S, F) => { const x = amostra(S, F); let u = L.a[L.a.length - 1];
      if (u && (x.t < u.t || x.perfil !== u.perfil)) { L.a = []; u = null; }
      if (u && x.t === u.t) return false;
      L.a.push(x); while (L.a.length > 1 && x.t - L.a[0].t > JANELA) L.a.shift(); return true; };
    L.ruptura = () => L.a.find(rompeu) || null;
    L.cortar = i => { if (i >= 0 && i < L.a.length) L.a.length = i + 1; };
    return L;
  }
  const API = { JANELA, amostra, rompeu, saude, Linha };
  if (typeof module !== "undefined") module.exports = API; else root.BearingLinha = API;
})(typeof self !== "undefined" ? self : globalThis);
