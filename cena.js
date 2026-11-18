/* BEARING AI LAB - cena do rolamento em recipiente de vidro com a Base V1 do Plano Mestre v2 (anel dentado, correia, polia e película; 3D com three.js local; plano B em 2D).
   LÊ SOMENTE o estado do motor (rpm, load, oil, fault, sev, temp, emergency). O aço fica cor de aço: cor falsa só na visão térmica.
   Tudo aqui é ILUSTRATIVO (rotação desenhada em câmera lenta, escala do nível segue a faixa didática 50-90%). */
(function (root) {
  const T = typeof require !== "undefined" ? require("./termica.js") : root.BearingTermica;
  const BC = typeof require !== "undefined" ? require("./correia.js") : root.BearingCorreia, FM = typeof require !== "undefined" ? require("./filme.js") : root.BearingFilme;
  const RO = 1.0, RP = 0.78, RB = 0.16, YB = 0.62, YC = YB + RB + RP, TOPO_VIDRO = 1.6, LARG = 3.2, PROF = 1.6;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const CG = BC.geometria(YC);                                               // percurso da correia (Base V1)
  const COR2D = { novo: "rgba(230,189,90,0.5)", usado: "rgba(201,138,26,0.6)", envelhecido: "rgba(74,44,16,0.8)" }, COR3D = { novo: 0xe8ae2e, usado: 0xb87414, envelhecido: 0x4a2c10 }, NPART = { novo: 0, usado: 30, envelhecido: 160 };
  // nível desenhado (altura no vidro) em função do nível de óleo %: 50% = fundo da esfera inferior (MÍN), 70% = centro dela, 90% = topo dela (MÁX)
  function yNivel(oil) { const o = clamp(+oil, 0, 100); return o <= 50 ? YB * o / 50 : o <= 90 ? YB + (o - 50) / 40 * 2 * RB : YB + 2 * RB + (o - 90) / 10 * 0.4; }
  function estadoCena(s) {
    const speed = s.rpm / 1800, parado = !!s.emergency || !(s.rpm > 0), falha = s.fault && s.fault !== "normal" ? s.sev : 0;
    const nivel = yNivel(s.oil);
    return { nivel, nivelMin: yNivel(50), nivelMax: yNivel(90), parado,
      rotVis: parado ? 0 : (s.rpm / 60) * 2 * Math.PI * 0.06,                // rad/s DESENHADO (6% da real, para não piscar)
      tremor: parado ? 0 : clamp(0.004 * speed + 0.03 * falha * Math.max(speed, 0.3) * (0.5 + s.load / 100), 0, 0.06),
      batimento: s.oil > 90 ? clamp((s.oil - 90) / 10, 0, 1) : 0,           // excesso de óleo: superfície agitada
      expostaPct: clamp((yNivel(90) - nivel) / (2 * RB), 0, 1),             // 0 = esfera inferior toda coberta, 1 = toda fora do óleo
      oleoBaixo: s.oil < 50, oleoAlto: s.oil > 90, tempC: s.temp, corPeca: "aco",
      rotAcion: parado ? 0 : clamp((s.rpm / 60) * 2 * Math.PI * 0.06 * 0.25, 0, 3),   // rad/s DESENHADO do anel dentado e da correia (mais lento que o rolamento, para os dentes não piscarem)
      filme: FM.filme(s.oil, s.rpm, s.sev),                                  // estado da película (só visual; vem do nível, igual ao indicador)
      imersaoPct: Math.round((1 - clamp((yNivel(90) - nivel) / (2 * RB), 0, 1)) * 100) };   // imersão do elemento rolante inferior (separada do nível do reservatório)
  }
  // Variante com GRAXA (visor na carcaça). O simulador tem UMA variável de lubrificação (o nível 0 a 100%, faixa didática 50-90%); com graxa ela é
  // desenhada como o PREENCHIMENTO do espaço entre os anéis visto pelo visor: 90% = espaço todo coberto (MÁX), 50% = pouco mais da metade (MÍN).
  // É uma analogia visual, não um modelo de graxa.
  const R_EXT = 0.86, R_INT = 0.70;                                          // espaço entre as pistas, onde ficam as esferas
  function estadoGraxa(s) {
    const oil = clamp(+s.oil, 0, 100), f = clamp(oil / 90, 0, 1), cheia = oil > 90, exc = cheia ? clamp((oil - 90) / 10, 0, 1) : 0;
    return { f, rIn: R_EXT - f * (R_EXT - R_INT), rMin: R_EXT - (50 / 90) * (R_EXT - R_INT), rMax: R_INT, esp: 0.03 + 0.14 * exc, purgas: Math.ceil(6 * exc),
      expostaPct: 1 - f, seca: oil < 50, cheia, tempC: s.temp, corPeca: "aco" };
  }
  const GEO = { RO, RP, RB, YB, YC, TOPO_VIDRO, LARG, PROF, R_EXT, R_INT, CG };


  // ---------- Base V1 em 2D: correia, anel dentado, polia, película, gotas, espuma, marcador do elemento inferior ----------
  function rot2D(g, txt, x, y, term, centro) {           // rótulo com fundo: legível sobre a correia e fora do vidro, em qualquer tema da página
    const w = txt.length * 5.6 + 6; g.fillStyle = term ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.88)"; g.beginPath(); g.rect(centro ? x - w / 2 : x - 3, y - 11, w, 14); g.fill();
    g.fillStyle = term ? "#fff" : "#334"; g.textAlign = centro ? "center" : "left"; g.fillText(txt, x, y); g.textAlign = "left";
  }
  const corFilme = (idd) => "#" + (COR3D[idd] || COR3D.novo).toString(16).padStart(6, "0");
  function dentado2D(g, X, Y, sc, pts, ang, ox, oy, furo, preench, traco) {
    g.beginPath(); pts.forEach((q, i) => { const x = ox + q[0] * Math.cos(ang) - q[1] * Math.sin(ang), y = oy + q[0] * Math.sin(ang) + q[1] * Math.cos(ang); if (i) g.lineTo(X(x), Y(y)); else g.moveTo(X(x), Y(y)); }); g.closePath();
    if (furo) { g.moveTo(X(ox) + furo * sc, Y(oy)); g.arc(X(ox), Y(oy), furo * sc, 0, 2 * Math.PI); }
    g.fillStyle = preench; g.strokeStyle = traco; g.lineWidth = 1; g.fill("evenodd"); g.stroke();
  }
  function desenharV1(g, X, Y, sc, E, s, term, amb, t, fase, jx, jy) {
    const M = BC.MED, esp = M.esp, fc = fase.correia || 0, aco = term ? amb : "#aab3bb", tr = term ? amb : "#6b747c", V = BC.visual(CG, E.nivel, E.filme, s.oil), idd = s.idade || "novo", cF = corFilme(idd);
    g.lineJoin = "round"; g.beginPath(); CG.amostras(180, 0).forEach((p, i) => { if (i) g.lineTo(X(p.x), Y(p.y)); else g.moveTo(X(p.x), Y(p.y)); }); g.closePath();
    g.strokeStyle = term ? amb : "#39424a"; g.lineWidth = esp * sc; g.stroke();                       // correia (percurso fechado)
    if (!term) {
      g.strokeStyle = "#7d8790"; g.lineWidth = 1.5;                                                  // dentes da correia, na face de dentro (andam com ela)
      for (const sm of BC.marcas(CG, fc)) { const p = CG.ponto(sm, -esp / 2), q = CG.ponto(sm, -esp / 2 - 0.05); g.beginPath(); g.moveTo(X(p.x), Y(p.y)); g.lineTo(X(q.x), Y(q.y)); g.stroke(); }
      g.strokeStyle = cF;                                                                            // película colada na face de fora (anda com a correia)
      for (const sg of BC.segmentos(CG, V, fc)) { const o = esp / 2 + sg.esp / 2, a = CG.ponto(sg.s - sg.len / 2, o), b = CG.ponto(sg.s + sg.len / 2, o); g.lineWidth = Math.max(1, sg.esp * sc); g.beginPath(); g.moveTo(X(a.x), Y(a.y)); g.lineTo(X(b.x), Y(b.y)); g.stroke(); }
      g.fillStyle = cF; for (const d of BC.gotas(CG, V, t)) { g.globalAlpha = d.a; g.beginPath(); g.arc(X(d.x), Y(d.y), Math.max(1, d.r * sc), 0, 7); g.fill(); } g.globalAlpha = 1;
      if (V.espuma) { g.fillStyle = "rgba(255,248,225,0.8)"; g.fillRect(X(-LARG / 2) + 1, Y(E.nivel + V.espuma), LARG * sc - 2, V.espuma * sc);
        g.strokeStyle = "rgba(255,255,255,0.95)"; g.lineWidth = 1; for (const b of BC.bolhas(V, LARG, E.nivel, t)) { g.beginPath(); g.arc(X(b.x), Y(b.y), Math.max(1.5, b.r * sc), 0, 7); g.stroke(); }
        g.fillStyle = cF; for (const r of BC.respingos(V, LARG, E.nivel, t)) { g.beginPath(); g.arc(X(r.x), Y(r.y), Math.max(1.5, r.r * sc), 0, 7); g.fill(); } }
    }
    dentado2D(g, X, Y, sc, BC.contornoDentado(M.rAnelBase, M.rAnelTopo, M.nDentesAnel), -fc / CG.r1, jx, YC + jy, RO, aco, tr);   // anel dentado em volta do rolamento
    dentado2D(g, X, Y, sc, BC.contornoDentado(M.rPolBase, M.rPolTopo, M.nDentesPolia), -fc / CG.r2, CG.c2[0], CG.c2[1], 0, aco, tr);   // polia menor (motora)
    g.fillStyle = term ? amb : "#39424a"; g.beginPath(); g.arc(X(CG.c2[0]), Y(CG.c2[1]), 0.07 * sc, 0, 7); g.fill();
    g.font = "11px sans-serif"; rot2D(g, "anel dentado", X(-1.7), Y(YC + 1.5), term); rot2D(g, "polia motora", X(CG.c2[0] - 0.5), Y(CG.yTopo + 0.2), term);
    g.strokeStyle = term ? "rgba(255,255,255,0.5)" : "rgba(68,68,85,0.6)"; g.lineWidth = 1; g.beginPath(); g.moveTo(X(-1.2), Y(YC + 1.45)); g.lineTo(X(-0.82), Y(YC + 0.88)); g.stroke();
    if (!term) rot2D(g, V.rotulo, X(0.2), Y(CG.yTopo + 0.45), term, true);
  }

  // ---------- plano B: 2D ----------
  function desenhar2D(g, w, h, s, modo, t, lub, fase) {
    const E = estadoCena(s), graxa = lub === "graxa", term = modo === "termica", sc = graxa ? Math.min(w / 4.4, h / 3.1) : Math.min(w / 5.45, (h - 14) / 3.8), ox = graxa ? w / 2 : w / 2 - 0.975 * sc, oy = h - 14;
    const X = (x) => ox + x * sc, Y = (y) => oy - y * sc, jx = (Math.sin(t * 61) * E.tremor) , jy = (Math.cos(t * 53) * E.tremor);
    g.clearRect(0, 0, w, h);
    const amb = term ? T.css(T.T_AMB) : null;
    g.fillStyle = term ? amb : "rgba(150,170,180,0.10)"; g.strokeStyle = term ? "rgba(255,255,255,0.35)" : "rgba(120,150,165,0.8)"; g.lineWidth = 2;
    if (!graxa) {
    g.fillRect(X(-LARG / 2), Y(TOPO_VIDRO), LARG * sc, TOPO_VIDRO * sc); g.strokeRect(X(-LARG / 2), Y(TOPO_VIDRO), LARG * sc, TOPO_VIDRO * sc);
    const idd = s.idade || "novo"; g.fillStyle = term ? amb : COR2D[idd] || COR2D.novo; const ny = E.nivel + (E.batimento ? Math.sin(t * 9) * 0.03 * E.batimento : 0);
    g.fillRect(X(-LARG / 2) + 1, Y(ny), LARG * sc - 2, ny * sc);
    if (!term && idd !== "novo") { const np = idd === "usado" ? 25 : 110; g.fillStyle = "rgba(40,24,8,0.75)"; for (let k = 0; k < np; k++) { const px = (Math.sin(k * 12.9898) * 43758.5453) % 1, py = (Math.sin(k * 78.233) * 12543.331) % 1; g.fillRect(X(-LARG / 2) + 4 + Math.abs(px) * (LARG * sc - 8), Y(ny) + 3 + Math.abs(py) * Math.max(0, ny * sc - 6), 2, 2); } if (idd === "envelhecido") { g.fillStyle = "rgba(40,24,8,0.8)"; g.fillRect(X(-LARG / 2) + 1, Y(0.06), LARG * sc - 2, 0.06 * sc); } }
    g.strokeStyle = "rgba(120,130,140,0.9)"; g.lineWidth = 1; g.font = "11px sans-serif"; g.fillStyle = term ? "#fff" : "#667";
    for (const [y, txt] of [[E.nivelMin, "MÍN"], [E.nivelMax, "MÁX"]]) { g.beginPath(); g.moveTo(X(LARG / 2) - 22, Y(y)); g.lineTo(X(LARG / 2), Y(y)); g.stroke(); g.fillText(txt, X(LARG / 2) + 4, Y(y) + 4); }
    { const ym = YB + RB; g.setLineDash([3, 3]); g.strokeStyle = term ? "rgba(255,255,255,0.55)" : "rgba(27,35,40,0.6)"; g.beginPath(); g.moveTo(X(-LARG / 2), Y(ym)); g.lineTo(X(LARG / 2 + 0.85), Y(ym)); g.stroke(); g.setLineDash([]);
      g.font = "11px sans-serif"; rot2D(g, "centro do", X(LARG / 2 + 0.9), Y(ym) - 1, term); rot2D(g, "elem. inferior", X(LARG / 2 + 0.9), Y(ym) + 13, term); }
    }
    if (!graxa) desenharV1(g, X, Y, sc, E, s, term, amb, t, fase || {}, jx, jy);
    const cx = X(jx), cy = Y(YC + jy), acoCor = term ? T.css(E.tempC) : "#aab3bb";
    g.fillStyle = term ? acoCor : "#c9d0d6"; g.strokeStyle = term ? acoCor : "#6b747c"; g.lineWidth = 2;
    const anel = (r1, r0) => { g.beginPath(); g.moveTo(cx + r1 * sc, cy); g.arc(cx, cy, r1 * sc, 0, 2 * Math.PI); g.moveTo(cx + r0 * sc, cy); g.arc(cx, cy, r0 * sc, 0, 2 * Math.PI); g.fill("evenodd"); g.stroke(); };
    anel(RO, 0.86); anel(0.70, 0.46);
    const a0 = t * E.rotVis * 0.4;
    for (let k = 0; k < 9; k++) { const a = a0 + k * 2 * Math.PI / 9; g.beginPath(); g.arc(cx + Math.cos(a) * RP * sc, cy - Math.sin(a) * RP * sc, RB * sc, 0, 7); g.fillStyle = term ? acoCor : "#e3e8ec"; g.fill(); g.stroke(); }
    if (graxa) {                                                             // graxa vista pelo visor: anel entre as pistas, mais grosso e com sobras quando em excesso
      const G = estadoGraxa(s); g.font = "11px sans-serif";
      g.fillStyle = term ? amb : "rgba(222,182,84,0.93)"; g.beginPath(); g.arc(cx, cy, R_EXT * sc, 0, 2 * Math.PI); g.arc(cx, cy, G.rIn * sc, 0, 2 * Math.PI, true); g.fill("evenodd");
      if (G.purgas) { g.fillStyle = term ? amb : "rgba(222,182,84,0.93)"; for (let k = 0; k < G.purgas; k++) { const a = k * 2 * Math.PI / 6 + 0.4; g.beginPath(); g.arc(cx + Math.cos(a) * (RO + 0.06) * sc, cy - Math.sin(a) * (RO + 0.06) * sc, (0.07 + 0.05 * G.purgas / 6) * sc, 0, 7); g.fill(); } }
      g.strokeStyle = term ? "#fff" : "#1b2328"; g.lineWidth = 1; for (const r of [G.rMin, G.rMax]) { g.beginPath(); g.arc(cx, cy, r * sc, 0, 2 * Math.PI); g.stroke(); }
      g.strokeStyle = term ? "rgba(255,255,255,0.5)" : "rgba(120,150,165,0.9)"; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 1.1 * sc, 0, 2 * Math.PI); g.stroke();
      g.fillStyle = term ? "#fff" : "#445"; g.fillText("visor", cx - 12, cy + 1.1 * sc + 14);
    }
    g.fillStyle = term ? "#fff" : "#445"; g.beginPath(); g.arc(cx + Math.cos(t * E.rotVis) * 0.58 * sc, cy - Math.sin(t * E.rotVis) * 0.58 * sc, 3, 0, 7); g.fill();
    g.font = "11px sans-serif"; rot2D(g, "acelerômetro", cx - 30, cy - RO * sc - 10, term); rot2D(g, "termopar " + Math.round(s.temp) + " °C", cx + RO * sc + 6, cy - 6, term);
  }

  // ---------- 3D (three.js) ----------
  function criar3D(canvas, THREE) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(36, 1, 0.1, 50); cam.position.set(3.4, 2.7, 6.2); cam.lookAt(0, 1.25, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x556070, 0.9)); const dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(3, 5, 4); scene.add(dl); const pl = new THREE.PointLight(0xffffff, 0.6); pl.position.set(-3, 2, 3); scene.add(pl);
    const meshes = [], mk = (geo, mat, kind, matTerm) => { const m = new THREE.Mesh(geo, mat); m.userData = { kind, normal: mat, term: matTerm || new THREE.MeshBasicMaterial({ color: 0x000000 }) }; meshes.push(m); return m; };
    const aco = () => new THREE.MeshStandardMaterial({ color: 0xc3cad1, metalness: 0.55, roughness: 0.38 });
    const cinza = new THREE.MeshStandardMaterial({ color: 0x59636b, metalness: 0.3, roughness: 0.6 });
    const vidroMat = new THREE.MeshPhysicalMaterial({ color: 0xcfe8f0, transparent: true, opacity: 0.13, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false });
    const oleoMat = new THREE.MeshStandardMaterial({ color: 0xc98a1a, transparent: true, opacity: 0.55, roughness: 0.2, depthWrite: false });
    const grp = new THREE.Group(); scene.add(grp);
    const piso = mk(new THREE.PlaneGeometry(12, 10), new THREE.MeshStandardMaterial({ color: 0x8b949b, roughness: 0.9 }), "ambiente"); piso.rotation.x = -Math.PI / 2; piso.position.y = -0.01; scene.add(piso);
    const motor = mk(new THREE.BoxGeometry(1.7, 1.7, 1.5), cinza, "ambiente"); motor.position.set(0, YC, -3.4); scene.add(motor);
    const eixo = mk(new THREE.CylinderGeometry(0.46, 0.46, 3.6, 28), aco(), "rolamento"); eixo.rotation.x = Math.PI / 2; eixo.position.set(0, YC, -1.3); grp.add(eixo);
    const anel = (r1, r0, prof) => { const sh = new THREE.Shape(); sh.absarc(0, 0, r1, 0, Math.PI * 2); const ho = new THREE.Path(); ho.absarc(0, 0, r0, 0, Math.PI * 2, true); sh.holes.push(ho); const geo = new THREE.ExtrudeGeometry(sh, { depth: prof, bevelEnabled: false, curveSegments: 48 }); geo.translate(0, 0, -prof / 2); return geo; };
    const externo = mk(anel(RO, 0.86, 0.5), aco(), "rolamento"); externo.position.y = YC; grp.add(externo);
    const interno = new THREE.Group(); interno.position.y = YC; grp.add(interno);
    const ri = mk(anel(0.70, 0.46, 0.5), aco(), "rolamento"); interno.add(ri);
    const marca = mk(new THREE.BoxGeometry(0.1, 0.22, 0.6), new THREE.MeshStandardMaterial({ color: 0x2c3338 }), "rolamento"); marca.position.set(0.58, 0, 0); interno.add(marca);
    const gaiola = new THREE.Group(); gaiola.position.y = YC; grp.add(gaiola);
    const bolaGeo = new THREE.SphereGeometry(RB, 20, 14); for (let k = 0; k < 9; k++) { const b = mk(bolaGeo, aco(), "rolamento"); const a = k * 2 * Math.PI / 9; b.position.set(Math.cos(a) * RP, Math.sin(a) * RP, 0); gaiola.add(b); }
    for (const z of [-0.14, 0.14]) { const c = mk(new THREE.TorusGeometry(RP, 0.022, 8, 48), aco(), "rolamento"); c.position.z = z; gaiola.add(c); }
    const acel = mk(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0x1f2a33 }), "rolamento"); acel.position.set(0, YC + RO + 0.11, 0); grp.add(acel);
    const fio = mk(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 6), new THREE.MeshStandardMaterial({ color: 0x333 }), "ambiente"); fio.rotation.z = Math.PI / 2; fio.position.set(RO + 0.35, YC, 0.0); grp.add(fio);
    const ponta = mk(new THREE.SphereGeometry(0.045, 10, 8), aco(), "rolamento"); ponta.position.set(RO, YC, 0); grp.add(ponta);
    const tanque = mk(new THREE.BoxGeometry(LARG, TOPO_VIDRO, PROF), vidroMat, "vidro"); tanque.position.y = TOPO_VIDRO / 2; scene.add(tanque);
    const bordas = new THREE.LineSegments(new THREE.EdgesGeometry(tanque.geometry), new THREE.LineBasicMaterial({ color: 0x7fa0b0 })); bordas.position.copy(tanque.position); scene.add(bordas);
    const oleo = mk(new THREE.BoxGeometry(LARG - 0.06, 1, PROF - 0.06), oleoMat, "oleo"); scene.add(oleo);
    const pPos = new Float32Array(160 * 3); for (let k = 0; k < 160; k++) { pPos[k * 3] = (Math.random() - 0.5) * (LARG - 0.3); pPos[k * 3 + 1] = Math.random(); pPos[k * 3 + 2] = (Math.random() - 0.5) * (PROF - 0.3); }
    const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3)); const partic = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x24160a, size: 0.05 })); scene.add(partic);
    const borra = new THREE.Mesh(new THREE.BoxGeometry(LARG - 0.08, 1, PROF - 0.08), new THREE.MeshStandardMaterial({ color: 0x24160a, transparent: true, opacity: 0.85, roughness: 1 })); scene.add(borra);
    const rotulo = (txt, x, y, z, esc) => { const c = document.createElement("canvas"); c.width = 256; c.height = 64; const g = c.getContext("2d"); g.fillStyle = "rgba(20,28,34,0.78)"; g.fillRect(0, 0, 256, 64); g.fillStyle = "#fff"; g.font = "bold 34px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 128, 34); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); sp.scale.set(esc || 0.8, (esc || 0.8) / 4, 1); sp.position.set(x, y, z); scene.add(sp); return sp; };
    const grupoOleo = [tanque, bordas, oleo]; const marcaLinha = (y, txt) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.02), new THREE.MeshBasicMaterial({ color: 0x1b2328 })); l.position.set(LARG / 2 - 0.25, y, PROF / 2 + 0.01); scene.add(l); grupoOleo.push(l, rotulo(txt, LARG / 2 + 0.35, y, PROF / 2, 0.55)); };
    marcaLinha(YB, "MÍN"); marcaLinha(yNivel(90), "MÁX"); rotulo("acelerômetro", 0, YC + RO + 0.55, 0, 1.2);
    const tp = rotulo("termopar", RO + 1.0, YC + 0.22, 0, 1.0);
    // ---- Base V1 (Plano Mestre v2, 4.1): anel dentado em volta do rolamento, correia dentada que sobe até a polia menor e volta em loop,
    //      película de óleo colada na correia, gotas, espuma e respingos. Tudo ILUSTRATIVO e só visual. A correia e a polia ficam na temperatura ambiente na visão térmica.
    const M = BC.MED, espB = M.esp;
    const dentado3D = (rb, rt, n, furo, prof) => { const sh = new THREE.Shape(BC.contornoDentado(rb, rt, n).map((q) => new THREE.Vector2(q[0], q[1]))); if (furo) { const ho = new THREE.Path(); ho.absarc(0, 0, furo, 0, Math.PI * 2, true); sh.holes.push(ho); } const geo = new THREE.ExtrudeGeometry(sh, { depth: prof, bevelEnabled: false }); geo.translate(0, 0, -prof / 2); return geo; };
    const anelD = mk(dentado3D(M.rAnelBase, M.rAnelTopo, M.nDentesAnel, RO, 0.34), aco(), "ambiente"); anelD.position.y = YC; grp.add(anelD); grupoOleo.push(anelD);
    const contorno = (off) => CG.amostras(360, off).map((p) => new THREE.Vector2(p.x, p.y));
    const shB = new THREE.Shape(contorno(espB / 2)); shB.holes.push(new THREE.Path(contorno(-espB / 2)));
    const geoB = new THREE.ExtrudeGeometry(shB, { depth: M.larg, bevelEnabled: false }); geoB.translate(0, 0, -M.larg / 2);
    const correia = mk(geoB, new THREE.MeshStandardMaterial({ color: 0x2b3036, roughness: 0.85, metalness: 0.1 }), "ambiente"); scene.add(correia); grupoOleo.push(correia);
    const linhasT = [], contornoT = (m) => { const l = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 15), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })); l.visible = false; m.add(l); linhasT.push(l); };
    contornoT(anelD); contornoT(correia);
    const marcaGeo = new THREE.BoxGeometry(0.045, 0.05, M.larg * 0.9), marcaMat = new THREE.MeshStandardMaterial({ color: 0x59636b, roughness: 0.7 }), marcasB = [];
    for (let k = 0; k < M.nMarcas; k++) { const m = mk(marcaGeo, marcaMat, "ambiente"); scene.add(m); grupoOleo.push(m); marcasB.push(m); }
    const polia = mk(dentado3D(M.rPolBase, M.rPolTopo, M.nDentesPolia, 0, 0.34), aco(), "ambiente"); polia.position.set(CG.c2[0], CG.c2[1], 0); scene.add(polia); grupoOleo.push(polia); contornoT(polia);
    const cubo = mk(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 16), cinza, "ambiente"); cubo.rotation.x = Math.PI / 2; cubo.position.set(CG.c2[0], CG.c2[1], 0); scene.add(cubo); grupoOleo.push(cubo);
    const filmeMat = new THREE.MeshStandardMaterial({ color: COR3D.novo, roughness: 0.3, metalness: 0.0 }), segGeo = new THREE.BoxGeometry(M.compSeg, 1, M.larg * 0.92), esfGeo = new THREE.SphereGeometry(1, 10, 8);
    const bolhaMat = new THREE.MeshStandardMaterial({ color: 0xfff6dc, transparent: true, opacity: 0.6, roughness: 0.1, depthWrite: false });
    const pool = (n, geo, mat) => { const v = []; for (let k = 0; k < n; k++) { const m = mk(geo, mat, "oleo"); scene.add(m); grupoOleo.push(m); v.push(m); } return v; };
    const segs3 = pool(M.nFilme, segGeo, filmeMat), gotas3 = pool(3, esfGeo, filmeMat), resp3 = pool(8, esfGeo, filmeMat), bol3 = pool(18, esfGeo, bolhaMat);
    const espuma = mk(new THREE.BoxGeometry(LARG - 0.1, 1, PROF - 0.1), new THREE.MeshStandardMaterial({ color: 0xfff1cf, transparent: true, opacity: 0.7, roughness: 1, depthWrite: false }), "oleo"); scene.add(espuma); grupoOleo.push(espuma);
    { const ln = new THREE.Mesh(new THREE.BoxGeometry(LARG + 0.85, 0.012, 0.01), new THREE.MeshBasicMaterial({ color: 0x1b2328, transparent: true, opacity: 0.55 })); ln.position.set(0.425, YB + RB, PROF / 2 + 0.012); scene.add(ln); grupoOleo.push(ln); }   // marcador "centro do elemento inferior"
    const rotuloD = (x, y, z, w, h, cw, ch) => { const c = document.createElement("canvas"); c.width = cw; c.height = ch; const tex = new THREE.CanvasTexture(c), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false })); sp.scale.set(w, h, 1); sp.position.set(x, y, z); scene.add(sp); sp.userData.txt = "";
      sp.userData.set = (linhas) => { const k = linhas.join("|"); if (sp.userData.txt === k) return; sp.userData.txt = k; const g = c.getContext("2d"); g.clearRect(0, 0, cw, ch); g.fillStyle = "rgba(20,28,34,0.78)"; g.fillRect(0, 0, cw, ch); g.fillStyle = "#fff"; g.font = "bold " + Math.floor(ch / (linhas.length + 0.5)) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; linhas.forEach((l, i) => g.fillText(l, cw / 2, ch * (i + 0.5) / linhas.length)); tex.needsUpdate = true; }; return sp; };
    const sAnel = rotuloD(-1.15, YC + 1.55, 0.3, 1.0, 0.25, 256, 64), sPolia = rotuloD(CG.c2[0], CG.yTopo + 0.3, 0.3, 1.0, 0.25, 256, 64), sCentro = rotuloD(3.05, YB + RB, PROF / 2, 1.1, 0.41, 256, 96), sFilme = rotuloD(0.2, CG.yTopo + 0.45, 0.3, 2.5, 0.27, 512, 56);
    sAnel.userData.set(["anel dentado"]); sPolia.userData.set(["polia motora"]); sCentro.userData.set(["centro do", "elem. inferior"]); grupoOleo.push(sAnel, sPolia, sCentro, sFilme);
    let faseC = 0;
    function v1quadro(E, s, t, dt, ny) {
      if (API.lub === "graxa") return;
      linhasT.forEach((l) => { l.visible = API.modo === "termica"; });
      faseC = (faseC + E.rotAcion * CG.r1 * dt) % CG.total; anelD.rotation.z = -faseC / CG.r1; polia.rotation.z = -faseC / CG.r2;
      filmeMat.color.setHex(COR3D[s.idade || "novo"] || COR3D.novo);
      const V = BC.visual(CG, E.nivel, E.filme, s.oil), sg = BC.segmentos(CG, V, faseC);
      segs3.forEach((m, i) => { const q = sg[i]; m.visible = !!q; if (q) { const p = CG.ponto(q.s, espB / 2 + q.esp / 2); m.position.set(p.x, p.y, 0); m.rotation.z = p.ang; m.scale.y = Math.max(q.esp, 0.002); } });
      BC.marcas(CG, faseC).forEach((sm, i) => { const p = CG.ponto(sm, -espB / 2 - 0.025), m = marcasB[i]; m.position.set(p.x, p.y, 0); m.rotation.z = p.ang; });
      const gt = BC.gotas(CG, V, t); gotas3.forEach((m, i) => { const d = gt[i]; m.visible = !!d; if (d) { m.position.set(d.x, d.y, 0); m.scale.setScalar(Math.max(0.001, d.r * d.a)); } });
      const rp = BC.respingos(V, LARG, ny, t); resp3.forEach((m, i) => { const r = rp[i]; m.visible = !!r; if (r) { m.position.set(r.x, r.y, r.z); m.scale.setScalar(r.r); } });
      const bb = BC.bolhas(V, LARG, ny, t); bol3.forEach((m, i) => { const b = bb[i]; m.visible = !!b; if (b) { m.position.set(b.x, b.y, b.z); m.scale.setScalar(b.r); } });
      espuma.visible = V.espuma > 0; if (V.espuma > 0) { espuma.scale.y = V.espuma; espuma.position.y = ny + V.espuma / 2; }
      sFilme.userData.set([V.rotulo]); sFilme.visible = API.modo !== "termica";
    }
    let lubEnq = null, aspEnq = 0;
    function enquadra() {                                                    // enquadra a cena inteira (correia incluída) em qualquer largura, sem cortar
      const tg = Math.tan(cam.fov * Math.PI / 360), asp = cam.aspect || 1, graxa = API.lub === "graxa", cx = graxa ? 0.5 : 0.975, cyy = graxa ? YC : 1.9, hh = graxa ? 3.7 : 3.95, ww = graxa ? 4.8 : 5.5;
      const D = Math.max(hh / (2 * tg), ww / (2 * tg * asp)) * 1.12, dir = new THREE.Vector3(0.20, 0.09, 1).normalize(); cam.position.set(cx, cyy, 0).addScaledVector(dir, D); cam.lookAt(cx, cyy, 0);
    }
    // variante com graxa: carcaça de metal com visor de vidro; a graxa aparece como anel entre as pistas (ver estadoGraxa)
    const gx = new THREE.Group(); gx.visible = false; grp.add(gx);
    const carc = mk(new THREE.CylinderGeometry(1.14, 1.14, 0.7, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0x59636b, metalness: 0.35, roughness: 0.55, side: THREE.DoubleSide }), "rolamento"); carc.rotation.x = Math.PI / 2; carc.position.y = YC; gx.add(carc);
    const moldura = mk(new THREE.TorusGeometry(1.12, 0.045, 10, 64), cinza, "rolamento"); moldura.position.set(0, YC, 0.37); gx.add(moldura);
    const visor = mk(new THREE.CylinderGeometry(1.1, 1.1, 0.02, 48), vidroMat, "vidro"); visor.rotation.x = Math.PI / 2; visor.position.set(0, YC, 0.37); gx.add(visor);
    const graxaMat = new THREE.MeshStandardMaterial({ color: 0xdeb654, roughness: 0.8, metalness: 0.0 });
    let graxaMesh = null, graxaChave = ""; const purgas = []; for (let k = 0; k < 6; k++) { const b = mk(new THREE.SphereGeometry(0.1, 12, 10), graxaMat, "oleo"); const a = k * Math.PI / 3 + 0.4; b.position.set(Math.cos(a) * (RO + 0.06), YC + Math.sin(a) * (RO + 0.06), 0.3); b.visible = false; gx.add(b); purgas.push(b); }
    for (const r of [estadoGraxa({ oil: 50 }).rMin, R_INT]) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 6, 64), new THREE.MeshBasicMaterial({ color: 0x1b2328 })); m.position.set(0, YC, 0.385); gx.add(m); }
    const matTerm = { rolamento: new THREE.MeshBasicMaterial({ color: 0xffffff }), ambiente: new THREE.MeshBasicMaterial({ color: 0x000000 }), vidro: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.0 }), oleo: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.0 }) };
    meshes.forEach((m) => { m.userData.term = matTerm[m.userData.kind]; });
    const API = { tipo: "3d", modo: "comum", lub: "oleo" };
    let ultimo = null, t0 = performance.now(), tp0 = t0;
    function tamanho() { const w = canvas.clientWidth, h = canvas.clientHeight; if (w && h && (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio()))) { renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); } if (lubEnq !== API.lub || aspEnq !== cam.aspect) { lubEnq = API.lub; aspEnq = cam.aspect; enquadra(); } }
    function quadro(s, t) {
      const E = estadoCena(s); tamanho();
      const rx = (Math.sin(t * 61) * E.tremor), ry = (Math.cos(t * 53) * E.tremor); grp.position.set(rx, ry, 0);
      const dt = Math.min(0.05, (t - tp0)); tp0 = t; interno.rotation.z -= E.rotVis * dt; gaiola.rotation.z -= E.rotVis * 0.4 * dt;
      const ny = Math.max(0.002, E.nivel + Math.sin(t * 9) * 0.03 * E.batimento); oleo.scale.y = ny; oleo.position.y = ny / 2;
      { const idd = s.idade || "novo", tm = API.modo === "termica" || API.lub === "graxa"; oleoMat.color.setHex(COR3D[idd] || COR3D.novo); partic.visible = !tm && idd !== "novo"; partic.geometry.setDrawRange(0, NPART[idd] || 0); partic.scale.y = ny; borra.visible = !tm && idd === "envelhecido"; borra.scale.y = Math.min(0.07, ny); borra.position.y = borra.scale.y / 2; }
      if (API.lub === "graxa") {
        const G = estadoGraxa(s), ch = G.rIn.toFixed(3) + "|" + G.esp.toFixed(3);
        if (ch !== graxaChave) { graxaChave = ch; if (graxaMesh) { gx.remove(graxaMesh); graxaMesh.geometry.dispose(); meshes.splice(meshes.indexOf(graxaMesh), 1); } if (G.rIn < R_EXT - 0.004) { graxaMesh = mk(anel(R_EXT, G.rIn, G.esp), graxaMat, "oleo"); graxaMesh.position.set(0, YC, RB + G.esp / 2); gx.add(graxaMesh); } else graxaMesh = null; }
        purgas.forEach((b, k) => { b.visible = k < G.purgas; });
      }
      motor.visible = API.lub === "graxa"; gx.visible = API.lub === "graxa"; grupoOleo.forEach((o) => { o.visible = API.lub !== "graxa"; }); v1quadro(E, s, t, dt, ny);
      const term = API.modo === "termica"; meshes.forEach((m) => { m.material = term ? m.userData.term : m.userData.normal; });
      if (term) { const c = T.cor(E.tempC); matTerm.rolamento.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255); const a = T.cor(T.T_AMB); matTerm.ambiente.color.setRGB(a[0] / 255, a[1] / 255, a[2] / 255); renderer.setClearColor(new THREE.Color(a[0] / 255, a[1] / 255, a[2] / 255), 1); bordas.visible = false; } else { renderer.setClearColor(0x000000, 0); bordas.visible = API.lub !== "graxa"; }
      tp.visible = true; renderer.render(scene, cam);
    }
    API.atualizar = (s) => { ultimo = s; }; API.setModo = (m) => { API.modo = m; }; API.setLub = (m) => { API.lub = m === "graxa" ? "graxa" : "oleo"; };
    const loop = () => { if (ultimo && !document.hidden) quadro(ultimo, (performance.now() - t0) / 1000); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    return API;
  }
  function criarCena(canvas, opt) {
    opt = opt || {}; if (!opt.forcar2d && root.THREE) { try { return criar3D(canvas, root.THREE); } catch (e) { /* sem WebGL: cai no 2D */ } }
    const API = { tipo: "2d", modo: "comum", lub: "oleo" }; let ultimo = null; const t0 = performance.now(), fase = { correia: 0 }; let tPrev = 0;
    const quadro = () => { if (!ultimo || document.hidden) return; const r = devicePixelRatio || 1; if (canvas.width !== canvas.clientWidth * r) { canvas.width = canvas.clientWidth * r; canvas.height = canvas.clientHeight * r; } const g = canvas.getContext("2d"); g.setTransform(r, 0, 0, r, 0, 0); const tt = (performance.now() - t0) / 1000, dt = Math.min(0.05, tt - tPrev); tPrev = tt; fase.correia = (fase.correia + estadoCena(ultimo).rotAcion * CG.r1 * dt) % CG.total; desenhar2D(g, canvas.clientWidth, canvas.clientHeight, ultimo, API.modo, tt, API.lub, fase); };
    API.atualizar = (s) => { ultimo = s; }; API.setModo = (m) => { API.modo = m; }; API.setLub = (m) => { API.lub = m === "graxa" ? "graxa" : "oleo"; }; (function loop() { quadro(); requestAnimationFrame(loop); })(); return API;
  }
  const API = { yNivel, estadoCena, estadoGraxa, GEO, desenhar2D, criarCena };
  if (typeof module !== "undefined") module.exports = API; else root.BearingCena = API;
})(typeof self !== "undefined" ? self : globalThis);
