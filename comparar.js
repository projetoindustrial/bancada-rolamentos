/* Comparação lado a lado (Sprint 2, #4): Atual × Ideal (mesmo rpm, nível 70%) e Cenário A × B. Só leitura do motor. */
(function (root) {
  "use strict";
  function lado(S, B, Fm) {
    const P = B.PROFILES[S.profile], x = B.synth(S, 1), env = B.spectrum(x, !P.kind, P.kind ? 6000 : 600), D = B.diagnose(S, env), f = Fm.filme(S.oil, S.rpm, S.sev);
    return { nivel: S.oil, rpm: Math.round(S.rpm), sev: +(+S.sev).toFixed(2), falha: S.fault, um: f.um, estado: f.rotulo, cond: D.abstain ? "Abstenção" : (B.LABELS[D.cond] || D.cond || "—"), fonte: D.source || "", temp: B.steadyTemp(S) };
  }
  const ideal = S => Object.assign({}, S, { oil: 70 });
  const instantaneo = S => Object.assign({}, S);
  const API = { lado, ideal, instantaneo };
  if (typeof module !== "undefined") module.exports = API; else root.BearingComparar = API;
})(typeof self !== "undefined" ? self : globalThis);
