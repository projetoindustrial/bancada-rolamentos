/* BEARING AI LAB - som ESTILIZADO a partir do estado do motor (engine.js). Não é gravação nem acústica real.
   Camadas: (1) zumbido da rotação, (2) batida na frequência do defeito, (3) chiado por lubrificação fora da faixa.
   Função pura (sem DOM): render(estado) devolve Float32Array em loop; testável em Node. */
(function (root) {
  const B = typeof require !== "undefined" ? require("./engine.js") : root.Bearing;
  const FSA = 22050;
  const prng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const gauss = (u) => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u());

  function render(s, o) {
    o = o || {}; const fs = o.fs || FSA, secs = o.seconds || 2, xf = Math.floor(0.05 * fs), n = Math.floor(secs * fs), L = n + xf, u = prng(o.seed || 1);
    const p = B.PROFILES[s.profile], x = new Float32Array(L), fr = s.rpm / 60;
    if (s.emergency || fr <= 0) return new Float32Array(n);
    const speed = s.rpm / 1800, lf = 0.5 + s.load / 100, dev = B.lubDev(s), w = 2 * Math.PI * fr / fs;
    // 1) zumbido: 1x e harmônicas (6 primeiras, decaindo), cresce com a rotação e a carga
    const hum = 0.10 * Math.min(speed * speed, 4) * lf;
    for (let h = 1; h <= 6; h++) { const a = hum / h; for (let i = 0; i < L; i++) x[i] += a * Math.sin(h * w * i); }
    // 2) defeito
    if (s.fault !== "normal" && s.sev > 0) {
      const sv = s.sev, amp = 0.55 * sv * lf * Math.max(speed, 0.2);
      if (!p.kind && B.FAULT_FREQ[s.fault]) {
        const f = B.freqs(s.rpm, p), fk = f[B.FAULT_FREQ[s.fault]], hl = Math.floor(0.012 * fs), ring = 3000;
        const h = new Float32Array(hl).map((_, k) => Math.exp(-(k / fs) / 0.0015) * Math.sin(2 * Math.PI * ring * k / fs));
        for (let j = 0; ; j++) {
          const tj = j / fk + gauss(u) * 0.005 / fk, idx = Math.floor(tj * fs); if (idx >= L) break; if (idx < 0) continue;
          let a = amp; if (s.fault === "pista_interna") a *= 0.5 * (1 + Math.cos(2 * Math.PI * fr * tj)); else if (s.fault === "esfera") a *= 0.5 * (1 + Math.cos(2 * Math.PI * f.FTF * tj));
          for (let k = 0; k < hl && idx + k < L; k++) x[idx + k] += a * h[k];
        }
      } else if (p.kind) {
        const line = p.faultLine[s.fault];
        if (line === null) { for (let i = 0; i < L; i++) x[i] += gauss(u) * 0.25 * sv * speed * lf * (0.4 + Math.abs(Math.sin(i / fs * 37))); } // cavitação: crepitar de banda larga
        else { const m = line === "1x" ? 1 : line === "2x" ? 2 : line === "GMF" ? p.z : line === "2xGMF" ? 2 * p.z : 1; for (let k = 0; k < 3; k++) for (let i = 0; i < L; i++) x[i] += (0.35 * sv * lf * speed / (k + 1)) * Math.sin((m + k * (line.includes("GMF") ? 0 : 1)) * w * i + k); }
      }
    }
    // 3) chiado (ruído de alta frequência) quando a lubrificação está fora da faixa
    const hiss = 0.05 * Math.min(dev, 1.5) * Math.max(speed, 0.3) + 0.004; let prev = 0;
    for (let i = 0; i < L; i++) { const g = gauss(u); x[i] += hiss * (g - prev); prev = g; }
    // loop sem estalo: funde a cauda com o início (potência igual)
    const y = new Float32Array(n); for (let i = 0; i < n; i++) y[i] = x[i];
    for (let i = 0; i < xf; i++) { const t = i / xf, a = Math.cos(t * Math.PI / 2), b = Math.sin(t * Math.PI / 2); y[i] = x[i] * b + x[n + i] * a; }
    for (let i = 0; i < n; i++) y[i] = Math.tanh(y[i] / 0.8) * 0.8;   // ganho FIXO (sem normalizar por arquivo): falha soa mais forte
    return y;
  }

  // ---- análise (usada na tela e nos testes) ----
  function fft(re, im) { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= n; len <<= 1) { const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } } } }
  function spectrogram(x, fs, nfft, hop) {
    nfft = nfft || 1024; hop = hop || 512; const frames = [], win = new Float64Array(nfft).map((_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (nfft - 1)));
    for (let st = 0; st + nfft <= x.length; st += hop) { const re = new Float64Array(nfft), im = new Float64Array(nfft); for (let i = 0; i < nfft; i++) re[i] = x[st + i] * win[i]; fft(re, im); const m = new Float32Array(nfft / 2); for (let k = 0; k < nfft / 2; k++) m[k] = Math.hypot(re[k], im[k]) / nfft; frames.push(m); }
    return { frames, df: fs / nfft, hop: hop / fs };
  }
  // espectro do envelope do som (banda alta retificada e decimada): mostra a repetição das batidas
  function envelopeSpectrum(x, fs, fmax) {
    fmax = fmax || 300; const d = Math.floor(fs / 1000), m = Math.floor((x.length - 2) / d), e = new Float64Array(m); let mean = 0;
    for (let k = 0; k < m; k++) { let a = 0; for (let i = 0; i < d; i++) { const j = k * d + i + 2; a += Math.abs(x[j] - 2 * x[j - 1] + x[j - 2]); } e[k] = a / d; mean += e[k]; } mean /= m;
    let N = 1; while (N < m * 4) N <<= 1; const re = new Float64Array(N), im = new Float64Array(N); for (let k = 0; k < m; k++) re[k] = (e[k] - mean) * (0.5 - 0.5 * Math.cos(2 * Math.PI * k / (m - 1)));
    fft(re, im); const df = (fs / d) / N, K = Math.floor(fmax / df), f = new Float64Array(K), a = new Float64Array(K); for (let k = 0; k < K; k++) { f[k] = k * df; a[k] = Math.hypot(re[k], im[k]); } return { f, a };
  }
  const API = { render, spectrogram, envelopeSpectrum, FSA };
  if (typeof module !== "undefined") module.exports = API; else root.BearingAudio = API;
})(typeof self !== "undefined" ? self : globalThis);
