/* BEARING AI LAB - F5: auditoria com hash encadeado (SHA-256) e teste visível das barreiras de segurança.
   Sem DOM. SHA-256 em JavaScript puro (síncrono, funciona no navegador e no Node; conferido contra o crypto do Node nos testes).
   A cadeia é uma CÓPIA do registro do controlador: adulterar uma linha aqui não altera o simulador, só mostra que a cadeia detecta.
   Didático: no pacote Python a auditoria também é encadeada (audit_log.py); este módulo reproduz a ideia, não o arquivo em disco. */
(function (root) {
  const K = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  function utf8(s) { const o = []; for (let i = 0; i < s.length; i++) { let c = s.charCodeAt(i); if (c >= 0xd800 && c < 0xdc00 && i + 1 < s.length) { c = 0x10000 + ((c - 0xd800) << 10) + (s.charCodeAt(++i) - 0xdc00); } if (c < 0x80) o.push(c); else if (c < 0x800) o.push(0xc0 | c >> 6, 0x80 | c & 63); else if (c < 0x10000) o.push(0xe0 | c >> 12, 0x80 | c >> 6 & 63, 0x80 | c & 63); else o.push(0xf0 | c >> 18, 0x80 | c >> 12 & 63, 0x80 | c >> 6 & 63, 0x80 | c & 63); } return o; }
  function sha256(str) {
    const b = utf8(str), L = b.length, n = (((L + 9 + 63) >> 6) << 6), m = new Uint8Array(n); m.set(b); m[L] = 0x80;
    const hi = Math.floor(L / 0x20000000), lo = (L << 3) >>> 0; m[n - 8] = hi >>> 24; m[n - 7] = hi >>> 16 & 255; m[n - 6] = hi >>> 8 & 255; m[n - 5] = hi & 255; m[n - 4] = lo >>> 24; m[n - 3] = lo >>> 16 & 255; m[n - 2] = lo >>> 8 & 255; m[n - 1] = lo & 255;
    const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]), w = new Uint32Array(64), r = (x, k) => (x >>> k) | (x << (32 - k));
    for (let o = 0; o < n; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = (m[o + 4 * i] << 24 | m[o + 4 * i + 1] << 16 | m[o + 4 * i + 2] << 8 | m[o + 4 * i + 3]) >>> 0;
      for (let i = 16; i < 64; i++) { const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0; }
      let [a, bb, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) { const S1 = r(e, 6) ^ r(e, 11) ^ r(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[i] + w[i]) >>> 0, S0 = r(a, 2) ^ r(a, 13) ^ r(a, 22), mj = (a & bb) ^ (a & c) ^ (bb & c), t2 = (S0 + mj) >>> 0; h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = bb; bb = a; a = (t1 + t2) >>> 0; }
      H[0] += a; H[1] += bb; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
    }
    return Array.from(H, (x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
  }
  const GENESIS = "0".repeat(64);
  const canon = (o) => JSON.stringify(Object.keys(o).sort().reduce((a, k) => { a[k] = o[k]; return a; }, {}));
  const corpo = (e) => { const { hash, ...c } = e; return c; };
  const hashDe = (e) => sha256(canon(corpo(e)));
  function Cadeia() {
    const c = { itens: [], _orig: {}, _ref: null, _n: 0 };
    c.append = (ev) => { const prev = c.itens.length ? c.itens[c.itens.length - 1].hash : GENESIS; const e = { seq: c.itens.length + 1, t: ev.t, src: ev.src, ev: ev.ev, data: ev.data, ok: ev.ok, reason: ev.reason, prev }; e.hash = hashDe(e); c.itens.push(e); return e; };
    /* copia para a cadeia o que o controlador registrou desde a última chamada; se o registro foi trocado ou encurtou (reset, novo controlador), recomeça */
    c.sincronizar = (log) => { if (log !== c._ref || log.length < c._n) { c.itens = []; c._orig = {}; c._ref = log; c._n = 0; } for (; c._n < log.length; c._n++) c.append(log[c._n]); return c; };
    c.verificar = () => { let prev = GENESIS; for (let i = 0; i < c.itens.length; i++) { const e = c.itens[i]; if (e.seq !== i + 1 || e.prev !== prev || hashDe(e) !== e.hash) return { ok: false, primeira: i + 1, total: c.itens.length }; prev = e.hash; } return { ok: true, primeira: null, total: c.itens.length }; };
    c.adulterar = (i) => { const e = c.itens[i]; if (!e) return false; if (!(i in c._orig)) c._orig[i] = { ok: e.ok, reason: e.reason }; e.ok = !e.ok; e.reason = e.ok ? "ok" : "negado"; return true; };
    c.restaurar = () => { for (const i in c._orig) Object.assign(c.itens[i], c._orig[i]); c._orig = {}; };
    c.adulteradas = () => Object.keys(c._orig).map(Number);
    return c;
  }
  const BARREIRAS = {
    trocar_maquina: { nome: "Assistente tenta trocar de máquina", esperado: "ação não autorizada (negada por padrão)" },
    passo_maximo: { nome: "Assistente tenta reduzir o rpm de 1800 para 600 de uma vez", esperado: "redução maior que a taxa permitida" },
    emergencia: { nome: "Parada de emergência e, em seguida, um comando", esperado: "bloqueado: emergência ativa" }
  };
  /* roda a tentativa em uma CÓPIA do estado e de um controlador novo (a máquina em tela não é afetada) e devolve as entradas para o registro */
  function testarBarreira(tipo, S, B) {
    const s2 = Object.assign({}, S), c2 = B.Controller(s2); s2.emergency = false; c2.setMode("assistido");
    const n0 = c2.log.length; let r;
    if (tipo === "trocar_maquina") r = c2.request({ name: "set_profile", value: "bomba-centrifuga" }, "assistente");
    else if (tipo === "passo_maximo") { s2.rpm = 1800; r = c2.request({ name: "reduce_rpm", target_rpm: 600 }, "assistente"); }
    else if (tipo === "emergencia") { c2.estop(); r = c2.request({ name: "add_oil" }, "assistente"); }
    else return null;
    const entradas = c2.log.slice(n0).map((e) => ({ t: S.t, src: e.src, ev: e.ev, data: (e.data ? e.data + " " : "") + "[teste de barreira]", ok: e.ok, reason: e.reason }));
    return { tipo, negada: !r.ok, motivo: r.reason || null, esperado: BARREIRAS[tipo].esperado, entradas };
  }
  const API = { sha256, canon, Cadeia, GENESIS, BARREIRAS, testarBarreira };
  if (typeof module !== "undefined") module.exports = API; else root.BearingAuditoria = API;
})(typeof self !== "undefined" ? self : globalThis);
