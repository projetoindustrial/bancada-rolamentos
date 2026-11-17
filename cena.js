/* BEARING AI LAB - cena do rolamento em recipiente de vidro (3D com three.js local; plano B em 2D).
   LÊ SOMENTE o estado do motor (rpm, load, oil, fault, sev, temp, emergency). O aço fica cor de aço: cor falsa só na visão térmica.
   Tudo aqui é ILUSTRATIVO (rotação desenhada em câmera lenta, escala do nível segue a faixa didática 50-90%). */
(function (root) {
  const T = typeof require !== "undefined" ? require("./termica.js") : root.BearingTermica;
  const RO = 1.0, RP = 0.78, RB = 0.16, YB = 0.62, YC = YB + RB + RP, TOPO_VIDRO = 2.0, LARG = 3.2, PROF = 1.6;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
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
      oleoBaixo: s.oil < 50, oleoAlto: s.oil > 90, tempC: s.temp, corPeca: "aco" };
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
  const GEO = { RO, RP, RB, YB, YC, TOPO_VIDRO, LARG, PROF, R_EXT, R_INT };

  // ---------- plano B: 2D ----------
  function desenhar2D(g, w, h, s, modo, t, lub) {
    const E = estadoCena(s), graxa = lub === "graxa", term = modo === "termica", sc = Math.min(w / 4.4, h / 3.1), ox = w / 2, oy = h - 14;
    const X = (x) => ox + x * sc, Y = (y) => oy - y * sc, jx = (Math.sin(t * 61) * E.tremor) , jy = (Math.cos(t * 53) * E.tremor);
    g.clearRect(0, 0, w, h);
    const amb = term ? T.css(T.T_AMB) : null;
    g.fillStyle = term ? amb : "rgba(150,170,180,0.10)"; g.strokeStyle = term ? "rgba(255,255,255,0.35)" : "rgba(120,150,165,0.8)"; g.lineWidth = 2;
    if (!graxa) {
    g.fillRect(X(-LARG / 2), Y(TOPO_VIDRO), LARG * sc, TOPO_VIDRO * sc); g.strokeRect(X(-LARG / 2), Y(TOPO_VIDRO), LARG * sc, TOPO_VIDRO * sc);
    g.fillStyle = term ? amb : "rgba(201,138,26,0.55)"; const ny = E.nivel + (E.batimento ? Math.sin(t * 9) * 0.03 * E.batimento : 0);
    g.fillRect(X(-LARG / 2) + 1, Y(ny), LARG * sc - 2, ny * sc);
    g.strokeStyle = "rgba(120,130,140,0.9)"; g.lineWidth = 1; g.font = "11px sans-serif"; g.fillStyle = term ? "#fff" : "#667";
    for (const [y, txt] of [[E.nivelMin, "MÍN"], [E.nivelMax, "MÁX"]]) { g.beginPath(); g.moveTo(X(LARG / 2) - 22, Y(y)); g.lineTo(X(LARG / 2), Y(y)); g.stroke(); g.fillText(txt, X(LARG / 2) + 4, Y(y) + 4); }
    }
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
    g.fillStyle = term ? "#fff" : "#445"; g.fillText("acelerômetro", cx - 30, cy - RO * sc - 10); g.fillText("termopar " + Math.round(s.temp) + " °C", cx + RO * sc + 6, cy - 6);
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
    const rotulo = (txt, x, y, z, esc) => { const c = document.createElement("canvas"); c.width = 256; c.height = 64; const g = c.getContext("2d"); g.fillStyle = "rgba(20,28,34,0.78)"; g.fillRect(0, 0, 256, 64); g.fillStyle = "#fff"; g.font = "bold 34px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 128, 34); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); sp.scale.set(esc || 0.8, (esc || 0.8) / 4, 1); sp.position.set(x, y, z); scene.add(sp); return sp; };
    const grupoOleo = [tanque, bordas, oleo]; const marcaLinha = (y, txt) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.02), new THREE.MeshBasicMaterial({ color: 0x1b2328 })); l.position.set(LARG / 2 - 0.25, y, PROF / 2 + 0.01); scene.add(l); grupoOleo.push(l, rotulo(txt, LARG / 2 + 0.35, y, PROF / 2, 0.55)); };
    marcaLinha(YB, "MÍN"); marcaLinha(yNivel(90), "MÁX"); rotulo("acelerômetro", 0, YC + RO + 0.55, 0, 1.2);
    const tp = rotulo("termopar", RO + 1.0, YC + 0.22, 0, 1.0);
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
    function tamanho() { const w = canvas.clientWidth, h = canvas.clientHeight; if (w && h && (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio()))) { renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); } }
    function quadro(s, t) {
      const E = estadoCena(s); tamanho();
      const rx = (Math.sin(t * 61) * E.tremor), ry = (Math.cos(t * 53) * E.tremor); grp.position.set(rx, ry, 0);
      const dt = Math.min(0.05, (t - tp0)); tp0 = t; interno.rotation.z -= E.rotVis * dt; gaiola.rotation.z -= E.rotVis * 0.4 * dt;
      const ny = Math.max(0.002, E.nivel + Math.sin(t * 9) * 0.03 * E.batimento); oleo.scale.y = ny; oleo.position.y = ny / 2;
      if (API.lub === "graxa") {
        const G = estadoGraxa(s), ch = G.rIn.toFixed(3) + "|" + G.esp.toFixed(3);
        if (ch !== graxaChave) { graxaChave = ch; if (graxaMesh) { gx.remove(graxaMesh); graxaMesh.geometry.dispose(); meshes.splice(meshes.indexOf(graxaMesh), 1); } if (G.rIn < R_EXT - 0.004) { graxaMesh = mk(anel(R_EXT, G.rIn, G.esp), graxaMat, "oleo"); graxaMesh.position.set(0, YC, RB + G.esp / 2); gx.add(graxaMesh); } else graxaMesh = null; }
        purgas.forEach((b, k) => { b.visible = k < G.purgas; });
      }
      gx.visible = API.lub === "graxa"; grupoOleo.forEach((o) => { o.visible = API.lub !== "graxa"; });
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
    const API = { tipo: "2d", modo: "comum", lub: "oleo" }; let ultimo = null; const t0 = performance.now();
    const quadro = () => { if (!ultimo || document.hidden) return; const r = devicePixelRatio || 1; if (canvas.width !== canvas.clientWidth * r) { canvas.width = canvas.clientWidth * r; canvas.height = canvas.clientHeight * r; } const g = canvas.getContext("2d"); g.setTransform(r, 0, 0, r, 0, 0); desenhar2D(g, canvas.clientWidth, canvas.clientHeight, ultimo, API.modo, (performance.now() - t0) / 1000, API.lub); };
    API.atualizar = (s) => { ultimo = s; }; API.setModo = (m) => { API.modo = m; }; API.setLub = (m) => { API.lub = m === "graxa" ? "graxa" : "oleo"; }; (function loop() { quadro(); requestAnimationFrame(loop); })(); return API;
  }
  const API = { yNivel, estadoCena, estadoGraxa, GEO, desenhar2D, criarCena };
  if (typeof module !== "undefined") module.exports = API; else root.BearingCena = API;
})(typeof self !== "undefined" ? self : globalThis);
