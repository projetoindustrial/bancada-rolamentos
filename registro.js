/* Registro de corridas: histórico (últimas 50, localStorage) e exportação CSV/JSON. Sprint 1 (#1, #2). */
(function (root) {
  "use strict";
  const CHAVE = "bal_historico", MAX = 50;
  const CAMPOS = ["id", "instante", "perfil", "rpm", "carga", "nivel_oleo", "lubrificacao", "idade_oleo", "falha", "severidade", "temperatura_c", "diagnostico", "fonte", "hash"];
  function registro(S, D, B, A, agora) {
    const r = { instante: (agora || new Date()).toISOString(), perfil: S.profile, rpm: Math.round(S.rpm), carga: S.load, nivel_oleo: S.oil, lubrificacao: S.lub, idade_oleo: S.idade || "novo", falha: S.fault,
      severidade: +(+S.sev).toFixed(2), temperatura_c: +(+S.temp).toFixed(1), diagnostico: D.abstain ? "Abstenção" : (B.LABELS[D.cond] || D.cond || ""), fonte: D.source || "" };
    r.hash = A.sha256(A.canon(r)); r.id = r.hash.slice(0, 8); return r;
  }
  function carregar(st) { try { const v = JSON.parse(st.getItem(CHAVE) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function adicionar(st, r) { const h = carregar(st); if (h.length && h[h.length - 1].hash === r.hash) return h; h.push(r); while (h.length > MAX) h.shift(); try { st.setItem(CHAVE, JSON.stringify(h)); } catch (e) {} return h; }
  const cel = v => { const s = String(v == null ? "" : v); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  function csv(h) { return "\ufeff" + [CAMPOS.join(",")].concat(h.map(r => CAMPOS.map(c => cel(r[c])).join(","))).join("\r\n") + "\r\n"; }
  function json(h) { return JSON.stringify({ origem: "Bearing AI Lab (dados sintéticos)", campos: CAMPOS, corridas: h }, null, 2); }
  function baixar(nome, texto, tipo) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([texto], { type: tipo })); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  const API = { CHAVE, MAX, CAMPOS, registro, carregar, adicionar, csv, json, baixar };
  if (typeof module !== "undefined") module.exports = API; else root.BearingRegistro = API;
})(typeof self !== "undefined" ? self : globalThis);
