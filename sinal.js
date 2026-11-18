/* Sinal real (Sprint 4, #7, #13): leitura de .wav, .csv/.txt e .mat (v5) e análise no navegador. Não altera o diagnóstico por regras. */
(function (root) {
  "use strict";
  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= n; len <<= 1) { const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } } }
  }
  const pot2 = n => { let p = 1; while (p * 2 <= n) p *= 2; return p; }, MAXN = 65536;
  /* ---- WAV ---- */
  function lerWav(buf) {
    const v = new DataView(buf); if (buf.byteLength < 44 || v.getUint32(0) !== 0x52494646 || v.getUint32(8) !== 0x57415645) throw new Error("não é um WAV válido");
    let p = 12, fmt = null, dados = null;
    while (p + 8 <= buf.byteLength) { const id = v.getUint32(p), tam = v.getUint32(p + 4, true); if (id === 0x666d7420) fmt = { tag: v.getUint16(p + 8, true), canais: v.getUint16(p + 10, true), fs: v.getUint32(p + 12, true), bits: v.getUint16(p + 22, true) }; else if (id === 0x64617461) { dados = { ini: p + 8, tam: Math.min(tam, buf.byteLength - p - 8) }; break; } p += 8 + tam + (tam & 1); }
    if (!fmt || !dados) throw new Error("WAV sem fmt/data");
    const by = fmt.bits / 8, n = Math.floor(dados.tam / (by * fmt.canais)), x = new Float64Array(n);
    for (let i = 0; i < n; i++) { const o = dados.ini + i * by * fmt.canais; let s;
      if (fmt.tag === 3) s = by === 4 ? v.getFloat32(o, true) : v.getFloat64(o, true);
      else if (fmt.bits === 8) s = (v.getUint8(o) - 128) / 128; else if (fmt.bits === 16) s = v.getInt16(o, true) / 32768;
      else if (fmt.bits === 24) s = ((v.getUint8(o) | v.getUint8(o + 1) << 8 | v.getInt8(o + 2) << 16)) / 8388608; else if (fmt.bits === 32) s = v.getInt32(o, true) / 2147483648; else throw new Error("WAV de " + fmt.bits + " bits não suportado");
      x[i] = s; }
    return { x, fs: fmt.fs, canais: fmt.canais, nota: fmt.canais > 1 ? "usado só o canal 1 de " + fmt.canais : "" };
  }
  /* ---- CSV / TXT ---- */
  function lerCsv(texto) {
    const linhas = texto.split(/\r?\n/), cols = []; let cab = null;
    for (const l0 of linhas) { let l = l0.trim(); if (!l || l[0] === "#") continue; if (l.includes(";") || /^[-+]?\d+,\d+([eE][-+]?\d+)?$/.test(l)) l = l.replace(/,/g, "."); const pc = l.split(l.includes(";") ? ";" : /[,\t ]+/).map(s => s.trim()).filter(s => s !== "");
      const nums = pc.map(Number); if (nums.some(Number.isNaN)) { if (!cols.length && !cab) cab = pc; continue; } nums.forEach((nv, i) => { (cols[i] || (cols[i] = [])).push(nv); }); }
    if (!cols.length) throw new Error("nenhum número encontrado");
    let colunas = cols.map(c => Float64Array.from(c)), nomes = colunas.map((_, i) => (cab && cab[i]) || "coluna " + (i + 1)), fs = null;
    if (colunas.length >= 2) { const t = colunas[0], n = t.length; let ok = n > 8; const dt = (t[n - 1] - t[0]) / (n - 1); for (let i = 1; i < n && ok; i++) if (!(t[i] > t[i - 1]) || Math.abs((t[i] - t[i - 1]) - dt) > Math.abs(dt) * 0.05) ok = false; if (ok && dt > 0) { fs = Math.round(1 / dt); colunas = colunas.slice(1); nomes = nomes.slice(1); } }
    return { colunas, nomes, fs };
  }
  /* ---- MAT v5 (CWRU, MFPT): variáveis numéricas; aceita blocos comprimidos se for passada inflar(Uint8Array)->Promise<Uint8Array> ---- */
  async function lerMat(buf, inflar) {
    const b = new Uint8Array(buf), vars = {}; if (b.length < 128) throw new Error("não é um .mat v5");
    const cab = String.fromCharCode(...b.slice(0, 10)); if (cab.slice(0, 6) !== "MATLAB") throw new Error("não é um .mat v5 (HDF5/v7.3 não suportado)");
    const le = String.fromCharCode(b[126], b[127]) === "IM";
    const TAM = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 4, 6: 4, 7: 4, 9: 8, 12: 8, 13: 8 };
    function elementos(u8, ini, fim, cb) {
      const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); let p = ini;
      while (p + 8 <= fim) { let t = dv.getUint32(p, le), n, dp; if (t >> 16) { n = t >> 16; t &= 0xffff; dp = p + 4; p += 8; } else { n = dv.getUint32(p + 4, le); dp = p + 8; p = dp + ((n + 7) & ~7); } cb(t, dp, n, dv); }
    }
    function lerNum(dv, dp, n, tipo) { const by = TAM[tipo], m = Math.floor(n / by), o = new Float64Array(m); for (let i = 0; i < m; i++) { const q = dp + i * by; o[i] = tipo === 9 ? dv.getFloat64(q, le) : tipo === 7 ? dv.getFloat32(q, le) : tipo === 1 ? dv.getInt8(q) : tipo === 2 ? dv.getUint8(q) : tipo === 3 ? dv.getInt16(q, le) : tipo === 4 ? dv.getUint16(q, le) : tipo === 5 ? dv.getInt32(q, le) : tipo === 6 ? dv.getUint32(q, le) : tipo === 12 ? Number(dv.getBigInt64(q, le)) : Number(dv.getBigUint64(q, le)); } return o; }
    async function matriz(u8, ini, fim) { let sub = 0, nome = "", dados = null, classe = 0; const dv0 = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      elementos(u8, ini, fim, (t, dp, n, dv) => { if (sub === 0) classe = dv.getUint32(dp, le) & 0xff; else if (sub === 2) nome = String.fromCharCode(...u8.slice(dp, dp + n)); else if (sub === 3) dados = lerNum(dv, dp, n, t); sub++; });
      if (nome && dados && classe >= 6 && classe <= 15) vars[nome] = dados; }
    async function varre(u8, ini, fim) { const lista = []; elementos(u8, ini, fim, (t, dp, n) => lista.push([t, dp, n]));
      for (const [t, dp, n] of lista) { if (t === 14) await matriz(u8, dp, dp + n); else if (t === 15) { if (!inflar) throw new Error("arquivo .mat comprimido: função de descompressão indisponível"); const d = await inflar(u8.slice(dp, dp + n)); await varre(d, 0, d.length); } } }
    await varre(b, 128, b.length); if (!Object.keys(vars).length) throw new Error("nenhuma variável numérica no .mat");
    return { vars };
  }
  /* ---- análise ---- */
  function espectro(x, fs, fmax) {
    const N = pot2(Math.min(x.length, MAXN)), re = new Float64Array(N), im = new Float64Array(N); let m = 0; for (let i = 0; i < N; i++) m += x[i]; m /= N; let sw = 0;
    for (let i = 0; i < N; i++) { const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)); re[i] = (x[i] - m) * w; sw += w; }
    fft(re, im); const df = fs / N, K = Math.min(N / 2, Math.floor(fmax / df)), f = new Float64Array(K), a = new Float64Array(K); for (let k = 0; k < K; k++) { f[k] = k * df; a[k] = 2 / sw * Math.hypot(re[k], im[k]); } return { f, a, df };
  }
  function envelope(x, fs, banda) {
    const N = pot2(Math.min(x.length, MAXN)), re = new Float64Array(N), im = new Float64Array(N); for (let i = 0; i < N; i++) re[i] = x[i]; fft(re, im);
    const df = fs / N; for (let k = 0; k < N; k++) { const f = k <= N / 2 ? k * df : (k - N) * df; const dentro = f >= banda[0] && f <= banda[1]; if (!dentro) { re[k] = 0; im[k] = 0; } else { re[k] *= 2; im[k] *= 2; } }
    for (let k = N / 2 + 1; k < N; k++) { re[k] = 0; im[k] = 0; } /* sinal analítico: só frequências positivas */
    for (let k = 0; k < N; k++) im[k] = -im[k]; fft(re, im); const y = new Float64Array(N); for (let i = 0; i < N; i++) y[i] = Math.hypot(re[i], -im[i]) / N; return y;
  }
  const bandaPadrao = fs => fs >= 12000 ? [2500, Math.min(6000, 0.45 * fs)] : [0.25 * fs, 0.45 * fs];
  function analisar(x, fs, modo, fmax) { if (modo === "env") { const y = envelope(x, fs, bandaPadrao(fs)); return espectro(y, fs, fmax); } return espectro(x, fs, fmax); }
  function pico(esp, f0) { const tol = Math.max(0.03 * f0, 2.5 * esp.df); let mx = 0; for (let k = 0; k < esp.f.length; k++) if (Math.abs(esp.f[k] - f0) <= tol && esp.a[k] > mx) mx = esp.a[k]; const s = Array.from(esp.a).sort((p, q) => p - q), piso = s[Math.floor(s.length / 2)] || 1e-12; return { amp: mx, razao: mx / piso }; }
  function resumo(esp, freqs) { return ["1x", "FTF", "BPFO", "BPFI", "2xBSF"].filter(k => freqs[k] > 0).map(k => Object.assign({ nome: k, f: freqs[k] }, pico(esp, freqs[k]))); }
  const API = { fft, lerWav, lerCsv, lerMat, espectro, envelope, bandaPadrao, analisar, pico, resumo, MAXN };
  if (typeof module !== "undefined") module.exports = API; else root.BearingSinal = API;
})(typeof self !== "undefined" ? self : globalThis);
