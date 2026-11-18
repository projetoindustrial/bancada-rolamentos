/* BEARING AI LAB - Base V1 do Plano Mestre v2 (seção 4.1): anel dentado em volta do rolamento, correia dentada que sobe na diagonal
   até a polia menor e volta em loop, e película de óleo colada na correia. ILUSTRATIVO: só desenha; não muda diagnóstico, nível,
   temperatura nem ruído. Funções puras (sem DOM nem three.js), testáveis em Node. A cena (cena.js) usa estas contas no 3D e no 2D. */
(function (root) {
  "use strict";
  const TWO = 2 * Math.PI, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const frac = (x) => x - Math.floor(x), hash = (k, m) => frac(Math.sin(k * 12.9898 + (m || 0) * 78.233) * 43758.5453);
  // medidas do desenho (unidades da cena; o anel do rolamento tem raio 1,0)
  const MED = { r1: 1.16, r2: 0.28, px: 1.75, dpy: 1.35, esp: 0.07, larg: 0.30, rAnelBase: 1.05, rAnelTopo: 1.12, nDentesAnel: 48, rPolBase: 0.2, rPolTopo: 0.235, nDentesPolia: 14, nMarcas: 64, nFilme: 120, compSeg: 0.11 };

  // percurso FECHADO da correia (contorno convexo de dois círculos), parametrizado por s (comprimento de arco) a partir do ponto mais baixo do anel,
  // no sentido horário: sobe pelo lado esquerdo do anel, segue pela tangente superior até a polia, contorna a polia e volta pela tangente inferior.
  function geometria(cy) {
    const r1 = MED.r1, r2 = MED.r2, px = MED.px, py = cy + MED.dpy, esp = MED.esp;
    const d = Math.hypot(px, py - cy), th = Math.atan2(py - cy, px), ph = Math.acos((r1 - r2) / d), aSup = th + ph, aInf = th - ph;
    const L = Math.sqrt(d * d - (r1 - r2) * (r1 - r2));
    let arco1 = (-Math.PI / 2 - aSup) % TWO; if (arco1 < 0) arco1 += TWO;                 // fundo -> tangente superior (horário)
    let arco5 = (aInf + Math.PI / 2) % TWO; if (arco5 < 0) arco5 += TWO;                  // tangente inferior -> fundo (horário)
    const l1 = r1 * arco1, l2 = L, l3 = r2 * (aSup - aInf), l4 = L, l5 = r1 * arco5, total = l1 + l2 + l3 + l4 + l5;
    const c1 = [0, cy], c2 = [px, py], cS = [Math.cos(aSup), Math.sin(aSup)], cI = [Math.cos(aInf), Math.sin(aInf)];
    const P1 = [c1[0] + r1 * cS[0], c1[1] + r1 * cS[1]], P2 = [c2[0] + r2 * cS[0], c2[1] + r2 * cS[1]];
    const Q2 = [c2[0] + r2 * cI[0], c2[1] + r2 * cI[1]], Q1 = [c1[0] + r1 * cI[0], c1[1] + r1 * cI[1]];
    const dirS = [(P2[0] - P1[0]) / L, (P2[1] - P1[1]) / L], dirI = [(Q1[0] - Q2[0]) / L, (Q1[1] - Q2[1]) / L];
    const G = { cy, r1, r2, c1, c2, esp, L, aSup, aInf, total, l1, l2, l3, l4, l5, yBase: cy - r1, yTopo: py + r2 };
    // ponto da correia em s, com deslocamento `off` ao longo da normal para fora (negativo = face de dentro). Devolve posição, tangente e normal.
    G.ponto = function (s, off) {
      off = off || 0; s = ((s % total) + total) % total; let a, x, y, tx, ty, nx, ny;
      if (s < l1) { a = -Math.PI / 2 - s / r1; nx = Math.cos(a); ny = Math.sin(a); tx = Math.sin(a); ty = -Math.cos(a); x = c1[0] + (r1 + off) * nx; y = c1[1] + (r1 + off) * ny; }
      else if (s < l1 + l2) { const u = s - l1; nx = cS[0]; ny = cS[1]; tx = dirS[0]; ty = dirS[1]; x = P1[0] + tx * u + off * nx; y = P1[1] + ty * u + off * ny; }
      else if (s < l1 + l2 + l3) { a = aSup - (s - l1 - l2) / r2; nx = Math.cos(a); ny = Math.sin(a); tx = Math.sin(a); ty = -Math.cos(a); x = c2[0] + (r2 + off) * nx; y = c2[1] + (r2 + off) * ny; }
      else if (s < l1 + l2 + l3 + l4) { const u = s - l1 - l2 - l3; nx = cI[0]; ny = cI[1]; tx = dirI[0]; ty = dirI[1]; x = Q2[0] + tx * u + off * nx; y = Q2[1] + ty * u + off * ny; }
      else { a = aInf - (s - l1 - l2 - l3 - l4) / r1; nx = Math.cos(a); ny = Math.sin(a); tx = Math.sin(a); ty = -Math.cos(a); x = c1[0] + (r1 + off) * nx; y = c1[1] + (r1 + off) * ny; }
      return { x, y, tx, ty, nx, ny, ang: Math.atan2(ty, tx) };
    };
    G.amostras = function (n, off) { const v = []; for (let i = 0; i < n; i++) v.push(G.ponto(i / n * total, off)); return v; };
    // onde a correia sai do óleo (subindo, lado esquerdo) e onde volta a entrar (descendo, lado direito), para o nível desenhado `nivel`.
    // O ponto mais baixo da correia fica em yBase: abaixo disso a correia não encosta no óleo (ver `visual`).
    G.cruzamentos = function (yRef) {
      const N = 1200; let sA = null, sB = null, yp = G.ponto(0).y;
      for (let i = 1; i <= N; i++) { const s = i / N * total, y = G.ponto(s).y;
        if (sA === null && y > yRef && yp <= yRef) sA = s - (y - yRef) / (y - yp) * (total / N);
        else if (sA !== null && sB === null && y < yRef && yp >= yRef) { sB = s - (yRef - y) / (yp - y) * (total / N); break; }
        yp = y; }
      return { sA: sA === null ? 0 : sA, sB: sB === null ? total : sB };
    };
    return G;
  }

  const ROTULO = { ideal: "Película contínua / ideal", baixo: "Película falhada / óleo baixo", espesso: "Película espessa / excesso" };
  // o que a película faz em cada estado (V1 do plano): ideal = fina e contínua, no máximo duas gotas e sem respingos; baixo = falhada e interrompida,
  // correia seca no topo, gotículas esparsas; excesso = grossa, com espuma, bolhas e respingos. O estado e o valor em µm vêm de filme.js (`f`).
  function visual(G, nivel, f, oil) {
    const chave = nivel.toFixed(4) + "|" + f.estado + "|" + f.um.toFixed(2) + "|" + (+oil).toFixed(2); if (G._memo && G._memo.chave === chave) return G._memo.V;
    const V = visual0(G, nivel, f, oil); G._memo = { chave, V }; return V;
  }
  function visual0(G, nivel, f, oil) {
    const yRef = Math.max(nivel, G.yBase + 0.04), cr = G.cruzamentos(yRef), reg = Math.max(0.01, cr.sB - cr.sA), estado = f.estado, exc = clamp((oil - 90) / 10, 0, 1);
    const tocaOleo = nivel > G.yBase + 0.02;   // abaixo disso a correia nem encosta no óleo: a película desenhada é só ilustração da falha
    let V;
    if (estado === "baixo") { const k = clamp(oil / 50, 0, 1); V = { cob: 0.30 + 0.35 * k, duty: 0.20 + 0.35 * k, esp: 0.008 + 0.010 * k, nGotas: 3, rGota: 0.022, respingos: 0, bolhas: 0, espuma: 0 }; }
    else if (estado === "ideal") V = { cob: 1, duty: 1, esp: 0.014 + 0.020 * clamp((f.um - 50) / 50, 0, 1), nGotas: 2, rGota: 0.04, respingos: 0, bolhas: 0, espuma: 0 };
    else V = { cob: 1, duty: 1, esp: 0.055 + 0.040 * clamp((f.um - 100) / 50, 0, 1), nGotas: 3, rGota: 0.055, respingos: Math.ceil(8 * exc), bolhas: Math.ceil(18 * exc), espuma: 0.04 + 0.06 * exc };
    return Object.assign(V, { estado, rotulo: ROTULO[estado], sA: cr.sA, sB: cr.sB, regiao: reg, tocaOleo, nivel, irregular: estado === "espesso" });
  }
  // segmentos da película: ficam presos à correia (andam com ela). Cada um é {s, len, esp}; só entram os que estão no trecho coberto.
  function segmentos(G, V, fase) {
    const NF = MED.nFilme, out = [], passo = G.total / NF;
    for (let k = 0; k < NF; k++) {
      const s = (k * passo + fase) % G.total, d = s - V.sA;
      if (d < 0 || s > V.sB || d > V.cob * V.regiao) continue;
      if (hash(k, 1) > V.duty) continue;
      const af = clamp(d / 0.25, 0, 1), irr = V.irregular ? 0.75 + 0.5 * hash(k, 2) : 1;
      out.push({ s, len: MED.compSeg, esp: V.esp * af * irr });
    }
    return out;
  }
  // marcas dos dentes da correia (andam com a correia)
  function marcas(G, fase) { const n = MED.nMarcas, v = []; for (let k = 0; k < n; k++) v.push((k * G.total / n + fase) % G.total); return v; }
  // gotas: soltam-se da tangente superior e caem um pouco; ideal tem no máximo 2, baixo tem gotículas esparsas, excesso tem mais e maiores
  function gotas(G, V, t) {
    const out = [];
    for (let j = 0; j < V.nGotas; j++) {
      const u = V.nGotas === 2 ? 0.30 + 0.38 * j : 0.22 + 0.27 * j, per = 2.2 + 0.7 * j, ph = frac(t / per + j * 0.37), p = G.ponto(G.l1 + u * G.l2, -MED.esp / 2 - 0.02);
      out.push({ x: p.x, y: p.y - 0.75 * ph * ph, r: V.rGota * (1 - 0.3 * ph), a: ph < 0.1 ? ph / 0.1 : clamp(1 - ph * ph, 0, 1) });
    }
    return out;
  }
  // excesso de óleo: bolhas sobre a superfície e respingos que sobem e caem (posições em x/y da cena; z fica por conta do 3D)
  function bolhas(V, larg, nivel, t) {
    const out = []; for (let k = 0; k < V.bolhas; k++) out.push({ x: (hash(k, 3) - 0.5) * (larg - 0.5), y: nivel + 0.025 + 0.012 * Math.sin(t * 3 + k), r: 0.03 + 0.045 * hash(k, 4), z: (hash(k, 5) - 0.5) * 1.1 });
    return out;
  }
  function respingos(V, larg, nivel, t) {
    const out = []; for (let k = 0; k < V.respingos; k++) { const ph = frac(t / 1.1 + hash(k, 6)), x0 = (hash(k, 7) - 0.5) * (larg - 0.6); out.push({ x: x0 + (hash(k, 8) - 0.5) * 0.3 * ph, y: nivel + 4 * ph * (1 - ph) * (0.25 + 0.4 * hash(k, 9)), r: 0.03, z: (hash(k, 10) - 0.5) * 1.1 }); }
    return out;
  }
  // contorno de uma roda dentada (anel ou polia): lista de pontos [x, y] relativos ao centro, com n dentes trapezoidais entre rBase e rTopo
  function contornoDentado(rBase, rTopo, n) {
    const p = TWO / n, v = [];
    for (let i = 0; i < n; i++) { const a = i * p; v.push([rBase, a], [rTopo, a + 0.14 * p], [rTopo, a + 0.46 * p], [rBase, a + 0.60 * p]); }
    return v.map(([r, a]) => [r * Math.cos(a), r * Math.sin(a)]);
  }
  const API = { MED, geometria, visual, segmentos, marcas, gotas, bolhas, respingos, contornoDentado, ROTULO, hash };
  if (typeof module !== "undefined") module.exports = API; else root.BearingCorreia = API;
})(typeof self !== "undefined" ? self : globalThis);
