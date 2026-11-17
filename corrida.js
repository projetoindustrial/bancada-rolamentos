/* BEARING AI LAB - corrida A/B/C: o MESMO defeito corrigido por (A) operador sozinho SIMULADO por regras, (B) assistente + aprovação e
   (C) automático. Usa o Controller real do engine.js (negação por padrão, passos máximos, validação). Sem DOM, em tempo virtual.
   Premissas de tempo do Python (ajustáveis): ciclo do assistente 10 s, ação 5 s, aprovação roteirizada 30 s; operador: nota o desvio em
   30-150 s, ronda a cada 60 s, ação 20 s, erra 15%, deixa passar 10%. O operador é um MODELO, não representa pessoas reais. */
(function (root) {
  const B = typeof require !== "undefined" ? require("./engine.js") : root.Bearing;
  const CICLO_S = 10, ACAO_S = 5, APROV_S = 30, HORIZ_S = 7200, PASSO_S = 5, T_REF = 43;   // T_REF: temperatura de regime do estado normal de partida (43 °C)
  const OM = { pWrong: 0.15, pMiss: 0.10, reacMin: 30, reacMax: 150, ronda: 60, acaoS: 20, fatigue: 0, shiftH: 0, pDistract: 0, distractS: 120 };
  const PERFIS = { descansado: {}, distraido: { pDistract: 0.30, distractS: 300 }, turno_longo: { fatigue: 0.2, shiftH: 6 } };
  const PERFIL_NOME = { descansado: "Descansado", distraido: "Distraído (30% de rondas, 300 s)", turno_longo: "Turno longo (6 h, fadiga)" };
  const CENARIOS = {
    lubrificacao_insuficiente: { nome: "Óleo baixo (20%)", inj: { oil: 20 } }, excesso_lubrificante: { nome: "Óleo em excesso (100%)", inj: { oil: 100 } },
    lubrificante_inadequado: { nome: "Lubrificante inadequado", inj: { lub: "inadequado" } }, sobrerrotacao: { nome: "Sobrerrotação (4500 rpm)", inj: { rpm: 4500 } },
    sobrecarga: { nome: "Sobrecarga (95%)", inj: { load: 95 } }, falha_combinada: { nome: "Sobrerrotação e óleo baixo", inj: { rpm: 4000, oil: 20 } },
    triplo: { nome: "Rotação, carga e óleo fora", inj: { rpm: 3800, load: 90, oil: 15 } } };
  const prng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const novoEstado = (id) => { const s = B.newState(); s.temp = B.steadyTemp(s); Object.assign(s, CENARIOS[id].inj); return s; };
  const lim = (s) => B.PROFILES[s.profile].lim;
  const ok = (s) => B.lubDev(s) === 0 && s.rpm <= lim(s).rpm && s.load <= lim(s).load;
  const diag = (s) => { const L = lim(s); if (s.rpm > L.rpm) return { cond: "sobrerrotacao", action: "reduce_rpm" }; if (s.load > L.load) return { cond: "sobrecarga", action: "reduce_load" };
    if (s.lub === "inadequado") return { cond: "lubrificante_inadequado", action: "set_lubricant" }; if (s.oil < 50) return { cond: "lubrificacao_insuficiente", action: "add_oil" }; if (s.oil > 90) return { cond: "excesso_lubrificante", action: "drain_oil" }; return { cond: "normal", action: null }; };
  const metrica = (s) => [B.lubDev(s), Math.max(0, s.rpm - lim(s).rpm), Math.max(0, s.load - lim(s).load)];
  const maior = (a, b) => { for (let i = 0; i < a.length; i++) { if (a[i] > b[i]) return true; if (a[i] < b[i]) return false; } return false; };

  function faixa(id, leve) {            // registro de uma faixa (estado, relógio, fotos, eventos)
    const s = novoEstado(id), F = { s, snaps: [], eventos: [], leve: !!leve };
    F.okDesde = null; const foto = () => { const o = ok(s); if (o) { if (F.okDesde === null) F.okDesde = s.t; } else F.okDesde = null; if (!F.leve) F.snaps.push({ t: s.t, temp: s.temp, oil: s.oil, rpm: s.rpm, load: s.load, lub: s.lub, ok: o }); };
    F.foto = foto; foto();
    F.adv = (dt) => { while (dt > 1e-9) { const d = Math.min(PASSO_S, dt); B.stepThermal(s, d); dt -= d; foto(); } };
    F.ev = (tipo, texto) => F.eventos.push({ t: s.t, tipo, texto });
    return F;
  }
  function fechar(F, tConf) {           // métricas a partir das fotos
    const S = F.snaps; let pico = 0, calor = 0; const tCorr = F.okDesde;
    S.forEach((p, i) => { if (p.temp > pico) pico = p.temp; if (i) calor += Math.max(0, (p.temp + S[i - 1].temp) / 2 - T_REF) * (p.t - S[i - 1].t) / 60; });
    return Object.assign(F, { tCorrigido: tCorr, tConfirmado: tConf === undefined ? tCorr : tConf, picoC: pico, calorCmin: calor });
  }
  function opAcao(s) { const L = lim(s); if (s.rpm > L.rpm) return ["set_rpm", L.rpm]; if (s.load > L.load) return ["set_load", L.load]; if (s.oil < 50) return ["add_oil"]; if (s.oil > 90) return ["drain_oil"]; if (s.lub === "inadequado") return ["set_lubricant", "adequado"]; return null; }
  function opErrada(s, u) { const o = [[s.oil >= 50 ? "add_oil" : "drain_oil"], ["set_rpm", Math.min(6000, s.rpm + 500)], ["set_load", Math.min(100, s.load + 20)], ["set_lubricant", "inadequado"]]; return o[Math.floor(u() * o.length)]; }

  // A: operador simulado (porte de operador_simulado.py, cenários corrigíveis)
  function faixaA(id, perfil, seed, leve) {
    const F = faixa(id, leve), s = F.s, om = Object.assign({}, OM, PERFIS[perfil || "descansado"]), u = prng(seed || 1), t0 = s.t;
    let acoes = 0, nocivas = 0, distr = 0, conf = null;
    F.adv(om.reacMin + u() * (om.reacMax - om.reacMin)); F.ev("nota", "operador percebe o desvio");
    while (s.t - t0 < HORIZ_S) {
      const k = 1 + om.fatigue * (om.shiftH + (s.t - t0) / 3600), pW = Math.min(0.9, om.pWrong * k), pM = Math.min(0.9, om.pMiss * k);
      if (om.pDistract > 0 && u() < Math.min(0.9, om.pDistract * k)) { distr++; F.ev("distracao", "operador distraído, pula a ronda"); F.adv(om.distractS); continue; }
      if (ok(s)) { conf = s.t - t0; F.ev("confirma", "ronda confirma: tudo dentro da faixa"); break; }
      if (u() >= pM) { let cmd = opAcao(s); if (cmd && u() < pW) cmd = opErrada(s, u); if (cmd) { const antes = metrica(s); B.command(s, cmd[0], cmd[1]); acoes++; const nociva = maior(metrica(s), antes); if (nociva) nocivas++; F.foto(); F.ev(nociva ? "nociva" : "acao", "operador age: " + cmd[0] + (cmd[1] !== undefined ? " " + cmd[1] : "") + (nociva ? " (piorou)" : "")); F.adv(om.acaoS); } }
      else F.ev("omissao", "operador deixa o desvio passar");
      F.adv(om.ronda);
    }
    return Object.assign(fechar(F, conf), { modo: "A", acoes, nocivas, distracoes: distr, esperaAprovS: 0 });
  }
  // B e C: assistente com o Controller real. atrasos (B): segundos de aprovação de cada ação; sem valor -> usa a roteirizada (30 s) ou fica "aguardando"
  function faixaAssist(id, modo, o) {
    o = o || {}; const F = faixa(id, o.leve), s = F.s, c = B.Controller(s); c.setMode(modo === "C" ? "automatico" : "assistido"); const at = o.atrasos || [];
    let acoes = 0, espera = 0, k = 0; F.aguardando = null;
    for (let ciclo = 0; ciclo < 10; ciclo++) {
      F.adv(CICLO_S); const D = diag(s); if (D.cond === "normal") break; F.ev("diag", "assistente diagnostica: " + D.cond);
      if (modo === "C") { const ch = c.tick(D); if (!ch) { F.ev("parou", "automação interrompida: " + (c.haltReason || "sem ação")); break; } acoes++; F.foto(); F.ev("acao", "executa " + D.action); F.adv(ACAO_S); continue; }
      c.tick(D); const id2 = Object.keys(c.pending)[0]; if (!id2) { F.ev("parou", "ação negada pelo controlador"); break; }
      F.ev("proposta", "propõe " + D.action + ", aguardando aprovação");
      const d = at[k] !== undefined ? at[k] : (o.manual ? null : APROV_S);
      if (d === null) { F.aguardando = { t: s.t, acao: D.action, id: id2, estado: { rpm: s.rpm, load: s.load, oil: s.oil, lub: s.lub, temp: s.temp, t: s.t, profile: s.profile, fault: s.fault, sev: s.sev, emergency: false } }; break; }
      k++; F.adv(d); espera += d; const r = c.approve(id2); F.foto(); F.ev("aprovada", "aprovada após " + Math.round(d) + " s"); if (!r.ok) { F.ev("parou", "aprovação falhou"); break; } acoes++; F.adv(ACAO_S);
    }
    return Object.assign(fechar(F), { modo, acoes, nocivas: 0, distracoes: 0, esperaAprovS: espera, controlador: c });
  }
  // espera da plateia: estado da faixa B parada na proposta, deixando só a temperatura evoluir
  function esperar(F, dt) { const e = Object.assign({}, F.aguardando.estado); let d = dt; while (d > 1e-9) { const p = Math.min(PASSO_S, d); B.stepThermal(e, p); d -= p; } return { t: F.aguardando.t + dt, temp: e.temp, oil: e.oil, rpm: e.rpm, load: e.load, lub: e.lub }; }
  function estender(F, T) { const e = F.s; while (e.t < T - 1e-9) F.adv(Math.min(PASSO_S, T - e.t)); return fechar(F, F.tConfirmado); }
  function rodar(id, perfil, seed, o) {
    o = o || {}; const A = faixaA(id, perfil, seed, o.leve), Bm = faixaAssist(id, "B", o), C = faixaAssist(id, "C", o);
    if (!o.leve) { const fim = Math.max(...[A, Bm, C].map((f) => f.tCorrigido === null ? f.s.t : f.tCorrigido)) + 120; [A, C].forEach((f) => { const m = { tConf: f.tConfirmado, ac: f.acoes, no: f.nocivas, di: f.distracoes, ea: f.esperaAprovS, mo: f.modo, co: f.controlador }; estender(f, fim); Object.assign(f, { tConfirmado: m.tConf }); }); if (!Bm.aguardando) { estender(Bm, fim); } }
    return { A, B: Bm, C };
  }
  function estatistica(id, perfil, n) {
    n = n || 200; const T = [], N = [], Cn = []; let nociv = 0, falhou = 0;
    for (let i = 1; i <= n; i++) { const a = faixaA(id, perfil, i, true); if (a.tConfirmado !== null && a.tConfirmado !== undefined) { T.push(a.tConfirmado); } else falhou++; Cn.push(a.tCorrigido); nociv += a.nocivas; }
    T.sort((x, y) => x - y); const q = (p) => T.length ? T[Math.min(T.length - 1, Math.floor(p * T.length))] : null;
    return { n, mediaConf: T.reduce((x, y) => x + y, 0) / (T.length || 1), mediana: q(0.5), p10: q(0.1), p90: q(0.9), nocivasPorExecucao: nociv / n, naoResolveu: falhou,
      B: faixaAssist(id, "B", { leve: true }).tCorrigido, C: faixaAssist(id, "C", { leve: true }).tCorrigido };
  }
  const API = { CENARIOS, PERFIS, PERFIL_NOME, CICLO_S, ACAO_S, APROV_S, faixaA, faixaAssist, esperar, estender, rodar, estatistica, ok, novoEstado };
  if (typeof module !== "undefined") module.exports = API; else root.BearingCorrida = API;
})(typeof self !== "undefined" ? self : globalThis);
