/* BEARING AI LAB - motor em JS (porte de bearing_sim.py / diagnosis.py). Parametros didaticos, nao calibrados. */
(function (root) {
  const FS = 25600, N = 32768, T_AMB = 25, TAU_T = 600, OIL_BAND = [50, 90];
  const PROFILES = {
    "6205-2RS": { g: [9, 7.938, 39.04], fres: 4000, tau: 0.0008, rpmMax: 6000, lim: { rpm: 3000, load: 80 }, status: "confirmado" },
    "6203-2RS": { g: [8, 6.747, 28.5], fres: 4000, tau: 0.0008, rpmMax: 6000, lim: { rpm: 3000, load: 80 }, status: "provisório (8 esferas não confirmadas)" },
    "ficticio-alta-rotacao": { g: [12, 5.5, 46.0], fres: 5000, tau: 0.0006, rpmMax: 4500, lim: { rpm: 3600, load: 70 }, status: "fictício" },
    "ventilador-centrifugo": { kind: "rotativo", z: 7, lines: [["2x", 2], ["3x", 3], ["BPF", 7]], rpmMax: 3600, lim: { rpm: 2400, load: 85 }, status: "didático (assinaturas simplificadas)",
      faults: [["desbalanceamento", "Desbalanceamento"], ["desalinhamento", "Desalinhamento"], ["folga", "Folga mecânica"]], faultLine: { desbalanceamento: "1x", desalinhamento: "2x", folga: "3x" } },
    "bomba-centrifuga": { kind: "rotativo", z: 6, lines: [["2x", 2], ["VPF", 6]], rpmMax: 4500, lim: { rpm: 3000, load: 90 }, status: "didático (assinaturas simplificadas)",
      faults: [["desbalanceamento", "Desbalanceamento"], ["desalinhamento", "Desalinhamento"], ["cavitacao", "Cavitação"]], faultLine: { desbalanceamento: "1x", desalinhamento: "2x", cavitacao: null } },
    "redutor-engrenagens": { kind: "engrenagem", z: 23, lines: [["GMF", 23], ["2xGMF", 46]], rpmMax: 4500, lim: { rpm: 3000, load: 80 }, status: "didático (assinaturas simplificadas)",
      faults: [["dente_quebrado", "Dente quebrado"], ["desgaste_dentes", "Desgaste de dentes"]], faultLine: { dente_quebrado: "GMF", desgaste_dentes: "2xGMF" } }
  };
  const LABELS = { normal: "Normal", pista_externa: "Pista externa", pista_interna: "Pista interna", esfera: "Esfera", gaiola: "Gaiola", lubrificacao_insuficiente: "Lubrificação insuficiente", excesso_lubrificante: "Excesso de lubrificante", lubrificante_inadequado: "Lubrificante inadequado", sobrerrotacao: "Sobrerrotação", sobrecarga: "Sobrecarga", desbalanceamento: "Desbalanceamento", desalinhamento: "Desalinhamento", folga: "Folga mecânica", cavitacao: "Cavitação", dente_quebrado: "Dente quebrado", desgaste_dentes: "Desgaste de dentes" };
  const faultsOf = (s) => { const p = PROFILES[s.profile]; return p.faults ? p.faults.map((f) => f[0]) : Object.keys(FAULT_FREQ); };
  const FAULT_FREQ = { pista_externa: "BPFO", pista_interna: "BPFI", esfera: "2xBSF", gaiola: "FTF" };
  const PLAYBOOK = {
    lubrificacao_insuficiente: ["PLAYBOOK-DIDATICO-LUB-01", "add_oil"], excesso_lubrificante: ["PLAYBOOK-DIDATICO-LUB-02", "drain_oil"],
    lubrificante_inadequado: ["PLAYBOOK-DIDATICO-LUB-03", "set_lubricant"], sobrerrotacao: ["PLAYBOOK-DIDATICO-RPM-01", "reduce_rpm"],
    sobrecarga: ["PLAYBOOK-DIDATICO-CARGA-01", "reduce_load"]
  };
  const newState = (profile) => ({ profile: profile || "6205-2RS", rpm: 1800, load: 40, oil: 80, lub: "adequado", fault: "normal", sev: 0, temp: 43, t: 0, emergency: false });

  function freqs(rpm, p) {
    if (p.kind) { const fr0 = rpm / 60, o = { "1x": fr0 }; for (const [k, m] of p.lines) o[k] = m * fr0; return o; }
    const [n, d, D] = p.g, fr = rpm / 60, r = d / D;
    return { "1x": fr, FTF: 0.5 * (1 - r) * fr, BPFO: 0.5 * n * (1 - r) * fr, BPFI: 0.5 * n * (1 + r) * fr, "2xBSF": 2 * (D / (2 * d)) * (1 - r * r) * fr };
  }
  function lubDev(s) {
    const [lo, hi] = OIL_BAND;
    let d = Math.max(0, (lo - s.oil) / lo, (s.oil - hi) / (100 - hi));
    if (s.lub === "inadequado") d += 0.5;
    return Math.min(d, 1.5);
  }
  const steadyTemp = (s) => T_AMB + 12 * (s.rpm / 1800) ** 2 + 0.15 * s.load + 40 * lubDev(s);
  const stepThermal = (s, dt) => { s.temp += (steadyTemp(s) - s.temp) * (1 - Math.exp(-dt / TAU_T)); s.t += dt; };

  function command(s, c, v) {
    const clamp = (x, lo, hi) => Math.max(lo, Math.min(+x, hi));
    if (c === "emergency_stop") { s.emergency = true; s.rpm = 0; return [true, "emergência ativada"]; }
    if (c === "reset") { Object.assign(s, newState(s.profile)); return [true, "reset"]; }
    if (s.emergency) return [false, "bloqueado: emergência ativa"];
    const p = PROFILES[s.profile];
    switch (c) {
      case "set_rpm": s.rpm = clamp(v, 0, p.rpmMax); break;
      case "set_load": s.load = clamp(v, 0, 100); break;
      case "add_oil": s.oil = clamp(s.oil + 20, 0, 100); break;
      case "drain_oil": s.oil = clamp(s.oil - 20, 0, 100); break;
      case "set_lubricant": if (v !== "adequado" && v !== "inadequado") return [false, "lubrificante não permitido"]; s.lub = v; break;
      case "set_fault": if (v !== "normal" && !faultsOf(s).includes(v)) return [false, "falha desconhecida"]; s.fault = v; s.sev = v === "normal" ? 0 : Math.max(s.sev, 0.6); break;
      case "set_severity": s.sev = clamp(v, 0, 1); break;
      case "set_profile": if (!PROFILES[v]) return [false, "perfil desconhecido"]; { const t = s.t; Object.assign(s, newState(v)); s.t = t; } break;
      default: return [false, "comando desconhecido (negado por padrão)"];
    }
    return [true, "ok"];
  }

  function rng(seed) { let a = seed >>> 0; const u = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; return () => Math.sqrt(-2 * Math.log(u() + 1e-12)) * Math.cos(2 * Math.PI * u()); }

  function synth(s, seed) {
    const p = PROFILES[s.profile], f = freqs(s.rpm, p), fr = f["1x"], gauss = rng(seed || 1), x = new Float64Array(N);
    const speed = s.rpm / 1800, lf = 0.5 + s.load / 100, dev = lubDev(s);
    for (let i = 0; i < N; i++) x[i] = 0.05 * speed * speed * lf * Math.sin(2 * Math.PI * fr * i / FS);
    if (p.kind) synthMachine(x, s, p, fr, speed, lf, gauss);
    else if (FAULT_FREQ[s.fault] && s.sev > 0 && fr > 0) {
      const fk = f[FAULT_FREQ[s.fault]], amp = 0.6 * s.sev * lf * Math.max(speed, 0.2), hl = Math.floor(0.01 * FS);
      const h = new Float64Array(hl).map((_, k) => Math.exp(-(k / FS) / p.tau) * Math.sin(2 * Math.PI * p.fres * k / FS));
      for (let j = 0; ; j++) {
        const tj = j / fk + gauss() * 0.005 / fk, idx = Math.floor(tj * FS);
        if (idx >= N) break; if (idx < 0) continue;
        let a = amp;
        if (s.fault === "pista_interna") a *= 0.5 * (1 + Math.cos(2 * Math.PI * fr * tj));
        else if (s.fault === "esfera") a *= 0.5 * (1 + Math.cos(2 * Math.PI * f.FTF * tj));
        for (let k = 0; k < hl && idx + k < N; k++) x[idx + k] += a * h[k];
      }
    }
    const sigma = 0.02 * Math.max(speed, 0.1) * (1 + 2 * dev);
    for (let i = 0; i < N; i++) x[i] += gauss() * sigma;
    return x;
  }

  function synthMachine(x, s, p, fr, speed, lf, gauss) {
    const A1 = 0.05 * speed * speed * lf, sev = s.sev, f = s.fault, w = 2 * Math.PI * fr / FS;
    const T = (k, a, ph) => { for (let i = 0; i < N; i++) x[i] += a * Math.sin(k * w * i + (ph || 0)); };
    if (p.kind === "rotativo") {
      T(p.z, 0.03 * speed * lf);   /* tom de passagem de pás/palhetas (base) */
      if (f === "desbalanceamento") T(1, 6 * sev * A1);
      else if (f === "desalinhamento") { T(1, 1.5 * sev * A1); T(2, 3 * sev * A1); }
      else if (f === "folga") { T(1, sev * A1); for (let k = 2; k <= 5; k++) T(k, 0.8 * sev * A1, k); T(0.5, 0.6 * sev * A1); }
      else if (f === "cavitacao") { const sc = 0.12 * sev * speed * lf; for (let i = 0; i < N; i++) x[i] += gauss() * sc; }
    } else {
      const Ag = 0.15 * speed * lf, tooth = f === "dente_quebrado", wear = f === "desgaste_dentes";
      for (let i = 0; i < N; i++) {
        const m = 1 + (tooth ? 0.5 * sev * (Math.cos(w * i) + Math.cos(2 * w * i) + Math.cos(3 * w * i)) : wear ? 0.1 * sev * Math.cos(w * i) : 0);
        x[i] += Ag * m * Math.sin(p.z * w * i) + 0.1 * Ag * (1 + (wear ? 8 * sev : 0)) * Math.sin(2 * p.z * w * i);
      }
    }
  }
  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]];[im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } }
    }
  }
  function biquad(x, type, fc) {
    const w = 2 * Math.PI * fc / FS, c = Math.cos(w), al = Math.sin(w) / (2 * 0.7071), a0 = 1 + al;
    const b0 = (type === "hp" ? (1 + c) : (1 - c)) / 2 / a0, b1 = (type === "hp" ? -(1 + c) : (1 - c)) / a0, a1 = -2 * c / a0, a2 = (1 - al) / a0;
    const y = new Float64Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
    return y;
  }
  /* espectro (0..fmax Hz) com janela Hann; env=true: passa-banda 2500-6000 Hz + retificacao */
  function spectrum(x, env, fmax) {
    let y = x;
    if (env) { y = biquad(biquad(biquad(biquad(x, "hp", 2500), "hp", 2500), "lp", 6000), "lp", 6000).map(Math.abs); }
    let m = 0; for (let i = 0; i < N; i++) m += y[i]; m /= N;
    const re = new Float64Array(N), im = new Float64Array(N); let sw = 0;
    for (let i = 0; i < N; i++) { const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)); re[i] = (y[i] - m) * w; sw += w; }
    fft(re, im);
    const df = FS / N, K = Math.floor(fmax / df), f = new Float64Array(K), a = new Float64Array(K);
    for (let k = 0; k < K; k++) { f[k] = k * df; a[k] = 2 / sw * Math.hypot(re[k], im[k]); }
    let hf = 0, hc = 0; for (let k = 0; k < K; k++) if (f[k] >= 4000 && f[k] <= 6000) { hf += a[k]; hc++; }
    return { f, a, hf: hc ? hf / hc : 0 };
  }
  function peakRatio(sp, f0) {
    const band = []; let pk = 0;
    for (let k = 0; k < sp.f.length; k++) { if (sp.f[k] > 10 && sp.f[k] < 500) band.push(sp.a[k]); if (Math.abs(sp.f[k] - f0) <= Math.max(f0 * 0.03, 1.2 * FS / N)) pk = Math.max(pk, sp.a[k]); }
    band.sort((a, b) => a - b);
    return pk / ((band[band.length >> 1] || 0) + 1e-12);
  }

  function pk(sp, f0) { let m = 0; const tol = Math.max(f0 * 0.03, 1.2 * FS / N); for (let k = 0; k < sp.f.length; k++) if (Math.abs(sp.f[k] - f0) <= tol) m = Math.max(m, sp.a[k]); return m; }
  const HF_C = 0.0117;   /* hf/sigma do estado normal (calibrado) */
  function machineFault(s, sp, P) {
    const fr = s.rpm / 60, speed = s.rpm / 1800, lf = 0.5 + s.load / 100;
    if (P.kind === "rotativo") {
      const e1 = 0.05 * speed * speed * lf, A = (k) => pk(sp, k * fr) / e1;
      if ([0.5, 3, 4, 5].filter((k) => A(k) > 0.12).length >= 3) return ["folga", "harmônicas 3x–5x e subharmônica 0,5x acima do piso"];
      if (A(2) > 0.5) return ["desalinhamento", "pico em 2x (" + A(2).toFixed(1) + "× o 1x esperado)"];
      if (A(1) > 1.8) return ["desbalanceamento", "pico em 1x (" + A(1).toFixed(1) + "× o esperado para esta rotação e carga)"];
      if (P.faults.some((f) => f[0] === "cavitacao")) { const sig0 = 0.02 * Math.max(speed, 0.1) * (1 + 2 * lubDev(s)), r = sp.hf / (sig0 * HF_C); if (r > 1.5) return ["cavitacao", "ruído de banda larga (4–6 kHz) " + r.toFixed(1) + "× o esperado"]; }
    } else {
      const Ag = pk(sp, P.z * fr); if (Ag <= 0) return null;
      const sb = Math.max(pk(sp, (P.z - 1) * fr), pk(sp, (P.z + 1) * fr)) / Ag, h2 = pk(sp, 2 * P.z * fr) / Ag;
      if (sb > 0.06) return ["dente_quebrado", "bandas laterais em GMF±1x (" + (sb * 100).toFixed(0) + "% do GMF)"];
      if (h2 > 0.25) return ["desgaste_dentes", "2xGMF elevado (" + h2.toFixed(2) + "× o GMF)"];
    }
    return null;
  }
  const RATIO_MIN = { BPFO: 6, BPFI: 6, "2xBSF": 6, FTF: 4.5 };
  function diagnose(s, spEnv, lim) {
    const L = lim || PROFILES[s.profile].lim, out = { cond: null, evidence: [], abstain: null, source: null, action: null };
    const rule = (c, ev) => { out.cond = c; out.evidence = [ev]; out.source = PLAYBOOK[c][0]; out.action = PLAYBOOK[c][1]; return out; };
    if (s.emergency) { out.abstain = "emergência ativa"; return out; }
    if (s.rpm > L.rpm) return rule("sobrerrotacao", "rpm acima do limite operacional");
    if (s.load > L.load) return rule("sobrecarga", "carga acima do limite operacional");
    if (s.rpm < 600 || s.rpm > 3600) { out.abstain = "fora do domínio de treino (600–3600 rpm)"; return out; }
    const P = PROFILES[s.profile];
    if (P.kind) { const m = machineFault(s, spEnv, P); if (m) { out.cond = m[0]; out.evidence = [m[1]]; out.source = "PLAYBOOK-DIDATICO-MEC-01"; return out; } }
    const f = freqs(s.rpm, P);
    const r = {}; for (const k of ["BPFO", "BPFI", "2xBSF", "FTF"]) r[k] = P.kind ? 0 : peakRatio(spEnv, f[k]);
    out.ratios = r;
    let best = null; for (const c in FAULT_FREQ) if (r[FAULT_FREQ[c]] > RATIO_MIN[FAULT_FREQ[c]] && (!best || r[FAULT_FREQ[c]] > r[FAULT_FREQ[best]])) best = c;
    if (best) { out.cond = best; out.evidence = ["pico no espectro de envelope em " + FAULT_FREQ[best] + " (" + r[FAULT_FREQ[best]].toFixed(1) + "× o piso)"]; out.source = "PLAYBOOK-DIDATICO-MEC-01"; out.action = null; return out; }
    if (s.lub === "inadequado") return rule("lubrificante_inadequado", "lubrificante fora da especificação");
    if (s.oil < OIL_BAND[0]) return rule("lubrificacao_insuficiente", "nível abaixo da faixa 50–90%");
    if (s.oil > OIL_BAND[1]) return rule("excesso_lubrificante", "nível acima da faixa 50–90%");
    out.cond = "normal"; if (s.rpm < 1500 && !P.kind) out.evidence = ["rpm baixo: falha de gaiola (FTF < ~10 Hz) não é resolvível nesta janela de 1,3 s"]; return out;
  }
  /* ---- controlador virtual (porte de control.py): modos, validacao, fila de aprovacao, automacao ---- */
  const ALLOWED = ["reduce_rpm", "reduce_load", "add_oil", "drain_oil", "set_lubricant"], OIL_STEP = 20;
  const LIM = (s) => ({ rpmMaxOp: PROFILES[s.profile].lim.rpm, loadMaxOp: PROFILES[s.profile].lim.load, rpmMin: 600, rpmStep: 500, loadStep: 20, oilMin: 50, oilMax: 90, maxAttempts: 8 });
  function buildAction(s, n) {
    const L = LIM(s);
    if (n === "reduce_rpm") return { name: n, target_rpm: Math.max(L.rpmMaxOp, s.rpm - L.rpmStep) };
    if (n === "reduce_load") return { name: n, target_load: Math.max(L.loadMaxOp, s.load - L.loadStep) };
    if (n === "set_lubricant") return { name: n, value: "adequado" };
    return { name: n };
  }
  function Controller(s) {
    const c = { mode: "diagnostico", halted: false, haltReason: null, pending: {}, nid: 1, attempts: 0, lastCond: null, muted: null, log: [] };
    const rec = (src, ev, data, ok, reason) => c.log.push({ t: s.t, src, ev, data, ok, reason });
    const label = (a) => a.name + (a.target_rpm ? "→" + a.target_rpm : a.target_load ? "→" + a.target_load : a.value ? "=" + a.value : "");
    c.halt = (r, src) => { c.halted = true; c.haltReason = r; rec(src || "controlador", "AUTOMACAO_INTERROMPIDA", r, true, "alerta emitido"); };
    c.setMode = (m) => { if (s.emergency) { rec("console", "SET_MODE", m, false, "bloqueado: emergência ativa"); return false; } c.mode = m; c.halted = false; c.haltReason = null; c.pending = {}; c.muted = null; c.attempts = 0; rec("console", "SET_MODE", m, true, "ok"); return true; };
    c.estop = () => { command(s, "emergency_stop"); c.pending = {}; c.halted = true; c.haltReason = "emergência"; rec("console", "ESTOP", "", true, "emergência ativada"); };
    c.reset = () => { command(s, "reset"); c.mode = "diagnostico"; c.halted = false; c.haltReason = null; c.pending = {}; c.muted = null; c.attempts = 0; rec("console", "RESET", "", true, "reset"); };
    function validate(a) {
      const L = LIM(s), n = a.name;
      if (!ALLOWED.includes(n)) return [false, "ação não autorizada (negada por padrão)"];
      if (n === "reduce_rpm") { const t = +a.target_rpm; if (!(t >= L.rpmMin)) return [false, "alvo abaixo do rpm mínimo operacional"]; if (!(t < s.rpm)) return [false, "reduce_rpm exige alvo menor que o atual"]; if (s.rpm - t > L.rpmStep + 1e-9) return [false, "redução maior que a taxa permitida"]; }
      else if (n === "reduce_load") { const t = +a.target_load; if (!(t >= 0)) return [false, "alvo de carga inválido"]; if (!(t < s.load)) return [false, "reduce_load exige alvo menor que o atual"]; if (s.load - t > L.loadStep + 1e-9) return [false, "redução maior que a taxa permitida"]; }
      else if (n === "add_oil" && s.oil + OIL_STEP > L.oilMax + 1e-9) return [false, "excederia a faixa configurada de óleo"];
      else if (n === "drain_oil" && s.oil - OIL_STEP < L.oilMin - 1e-9) return [false, "levaria o nível abaixo da faixa configurada"];
      else if (n === "set_lubricant" && a.value !== "adequado") return [false, "só é permitido lubrificante adequado"];
      return [true, "ok"];
    }
    function exec(a, src) {
      const m = { reduce_rpm: ["set_rpm", a.target_rpm], reduce_load: ["set_load", a.target_load], add_oil: ["add_oil"], drain_oil: ["drain_oil"], set_lubricant: ["set_lubricant", a.value] }[a.name];
      const [ok, r] = command(s, m[0], m[1]); rec(src, "ACAO_EXECUTADA", label(a), ok, r); return { ok, status: "executada", changed: ok };
    }
    c.request = (a, src) => {
      src = src || "assistente";
      const deny = (r) => { rec(src, "ACAO_NEGADA", label(a), false, r); return { ok: false, status: "negada", reason: r }; };
      if (s.emergency) return deny("bloqueado: emergência ativa");
      if (c.mode === "diagnostico") return deny("modo diagnóstico não atua");
      if (c.mode === "automatico" && c.halted) return deny("automação interrompida");
      const [ok, r] = validate(a); if (!ok) return deny(r);
      if (c.mode === "assistido") { const id = "ACT-" + String(c.nid++).padStart(4, "0"); c.pending[id] = a; rec(src, "ACAO_PROPOSTA", id + " " + label(a), true, "aguardando aprovação"); return { ok: true, status: "pendente" }; }
      return exec(a, src);
    };
    c.approve = (id) => {
      const a = c.pending[id];
      if (s.emergency) { rec("operador", "APROVACAO", id, false, "bloqueado: emergência ativa"); return { ok: false }; }
      if (!a) { rec("operador", "APROVACAO", id, false, "ação inexistente"); return { ok: false }; }
      delete c.pending[id]; const [ok, r] = validate(a);   /* o estado pode ter mudado */
      if (!ok) { rec("operador", "APROVACAO", id, false, "revalidação falhou: " + r); return { ok: false }; }
      rec("operador", "APROVACAO", id, true, "aprovada"); return exec(a, "operador");
    };
    c.reject = (id) => { const a = c.pending[id]; delete c.pending[id]; c.muted = c.lastCond; rec("operador", "REJEICAO", id, !!a, a ? "rejeitada" : "ação inexistente"); };
    /* um ciclo do assistente/piloto: recebe o diagnostico atual; retorna true se o estado mudou */
    c.tick = (D) => {
      if (s.emergency || c.mode === "diagnostico") return false;
      if (D.cond !== c.lastCond) { c.attempts = 0; c.lastCond = D.cond; c.muted = null; }
      if (c.mode === "assistido") { if (D.action && !Object.keys(c.pending).length && c.muted !== D.cond) c.request(buildAction(s, D.action)); return false; }
      if (c.halted) return false;
      if (D.abstain) { c.halt("abstenção do diagnóstico: " + D.abstain); return false; }
      if (D.cond && D.cond !== "normal" && !D.action) { c.halt("defeito mecânico sem ação autorizada: inspeção humana"); return false; }
      if (!D.action) return false;
      if (c.attempts >= LIM(s).maxAttempts) { c.halt("tentativas esgotadas"); return false; }
      c.attempts++; const r = c.request(buildAction(s, D.action), "piloto");
      if (!r.ok) { c.halt("ação negada: " + r.reason); return false; }
      return !!r.changed;
    };
    return c;
  }
  const degrade = (s, dt, rate) => { if (s.fault === "normal" || s.sev <= 0 || s.sev >= 1 || s.emergency) return false; s.sev = Math.min(1, s.sev + dt * rate); return true; };
  const API = { LABELS, lubDev, faultsOf, degrade, PROFILES, FAULT_FREQ, newState, freqs, steadyTemp, stepThermal, command, synth, spectrum, diagnose, Controller, buildAction, FS, N };
  if (typeof module !== "undefined") module.exports = API; else root.Bearing = API;
})(typeof self !== "undefined" ? self : globalThis);
