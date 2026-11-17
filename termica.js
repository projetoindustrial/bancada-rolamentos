/* BEARING AI LAB - visão termográfica (cor falsa, ILUSTRATIVA). Só a temperatura da carcaça vem do simulador (s.temp);
   o resto da cena fica na temperatura ambiente. Função pura (sem DOM), testável em Node. */
(function (root) {
  const T_AMB = 25, ESCALA = { min: 20, max: 120, unidade: "°C" };
  // paleta "ferro" (preto, roxo, vermelho, laranja, amarelo, branco), como em câmeras térmicas
  const STOPS = [[0, [0, 0, 20]], [0.2, [60, 0, 110]], [0.4, [170, 20, 80]], [0.6, [235, 90, 20]], [0.8, [255, 200, 40]], [1, [255, 255, 235]]];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function cor(T) {
    const f = clamp((T - ESCALA.min) / (ESCALA.max - ESCALA.min), 0, 1);
    for (let i = 1; i < STOPS.length; i++) if (f <= STOPS[i][0]) { const [f0, c0] = STOPS[i - 1], [f1, c1] = STOPS[i], u = (f - f0) / (f1 - f0); return c0.map((v, k) => Math.round(v + (c1[k] - v) * u)); }
    return STOPS[STOPS.length - 1][1].slice();
  }
  const css = (T) => { const c = cor(T); return `rgb(${c[0]},${c[1]},${c[2]})`; };
  const legenda = (n) => { n = n || 6; const L = []; for (let i = 0; i < n; i++) { const T = ESCALA.min + (ESCALA.max - ESCALA.min) * i / (n - 1); L.push({ T: Math.round(T), cor: cor(T) }); } return L; };
  // temperatura por parte: a carcaça/rolamento é a leitura do simulador; todo o resto é ambiente (declarado na tela)
  const temperaturaDe = (s, parte) => (parte === "rolamento" || parte === "carcaca") ? s.temp : T_AMB;
  const API = { T_AMB, ESCALA, cor, css, legenda, temperaturaDe };
  if (typeof module !== "undefined") module.exports = API; else root.BearingTermica = API;
})(typeof self !== "undefined" ? self : globalThis);
