/* Compartilhar cenário (Sprint 3, 4.4.2): monta e valida o link. Só parâmetros, nenhum dado pessoal. */
(function (root) {
  "use strict";
  const IDEAL = { maquina: "6205-2RS", rpm: 1200, carga: 50, oleo: 70, sev: 0, idade: "novo", daltonico: 0, falha: "normal", oleotipo: "adequado", degr: "desligada" };
  const IDADES = ["novo", "usado", "envelhecido"], DEGR = ["desligada", "lenta", "rapida"], CHAVES = Object.keys(IDEAL);
  const num = v => (v !== null && v !== "" && Number.isFinite(+v)) ? +v : NaN;
  const faltas = (B, m) => { const p = B.PROFILES[m]; return (p && p.faults ? p.faults.map(f => f[0]) : ["pista_externa", "pista_interna", "esfera", "gaiola"]); };
  function construir(S, degr, dalt) {
    const q = new URLSearchParams(); q.set("maquina", S.profile); q.set("rpm", Math.round(S.rpm)); q.set("carga", Math.round(S.load)); q.set("oleo", Math.round(S.oil)); q.set("sev", (+S.sev).toFixed(2)); q.set("idade", S.idade || "novo");
    q.set("falha", S.fault === "normal" ? "sem" : S.fault); q.set("oleotipo", S.lub); q.set("degr", DEGR[+degr] || "desligada"); q.set("daltonico", dalt ? 1 : 0); return q.toString();
  }
  /* devolve {modo:"nenhum"|"ok"|"invalido", cfg, motivo}. Ausente = padrão; presente e inválido = cenário ideal inteiro + aviso. */
  function ler(busca, B) {
    const q = new URLSearchParams(busca), tem = CHAVES.filter(k => q.has(k)); if (!tem.length) return { modo: "nenhum", cfg: null, motivo: null };
    const cfg = Object.assign({}, IDEAL), erro = m => ({ modo: "invalido", cfg: Object.assign({}, IDEAL), motivo: m });
    if (q.has("maquina")) { if (!B.PROFILES[q.get("maquina")]) return erro("máquina desconhecida"); cfg.maquina = q.get("maquina"); }
    const P = B.PROFILES[cfg.maquina], faixa = (k, a, b, int) => { if (!q.has(k)) return null; const v = num(q.get(k)); if (!(v >= a && v <= b)) return k; cfg[k] = v; return null; };
    for (const [k, a, b] of [["rpm", 0, P.rpmMax], ["carga", 0, 100], ["oleo", 0, 100], ["sev", 0, 1]]) { const r = faixa(k, a, b); if (r) return erro(r + " fora da faixa"); }
    const lista = (k, ok) => { if (!q.has(k)) return null; if (!ok.includes(q.get(k))) return k; cfg[k] = q.get(k); return null; };
    for (const [k, ok] of [["idade", IDADES], ["oleotipo", ["adequado", "inadequado"]], ["degr", DEGR], ["daltonico", ["0", "1"]]]) { const r = lista(k, ok); if (r) return erro(r + " inválido"); }
    cfg.daltonico = +cfg.daltonico;
    if (q.has("falha")) { const f = q.get("falha"); if (f === "sem") cfg.falha = "normal"; else if (faltas(B, cfg.maquina).includes(f)) cfg.falha = f; else return erro("falha inválida para a máquina"); }
    if (cfg.falha === "normal") cfg.sev = 0;
    return { modo: "ok", cfg, motivo: null };
  }
  const API = { IDEAL, IDADES, DEGR, construir, ler };
  if (typeof module !== "undefined") module.exports = API; else root.BearingCenario = API;
})(typeof self !== "undefined" ? self : globalThis);
