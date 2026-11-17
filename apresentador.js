/* BEARING AI LAB - F7: modo apresentador. Roteiro de 15 minutos para a banca, cronômetro e regras de avanço. Sem DOM (a tela usa estas funções).
   O roteiro é uma SUGESTÃO de ritmo: o apresentador pode avançar ou voltar quando quiser. */
(function (root) {
  const URL_SITE = "https://projetoindustrial.github.io/bancada-rolamentos/";
  const ROTEIRO = [
    { id: "normal", titulo: "Rolamento normal", min: 2, alvo: "kc", fala: "Aqui está o rolamento de aço em um recipiente de vidro, com o nível de óleo visível. Ouça o som normal (toque em Ouvir) e veja a vibração e o espectro limpos.", acao: "normal" },
    { id: "falhas", titulo: "Falhas: som, espectro e nível de óleo", min: 4, alvo: "kc", fala: "Provoque óleo baixo e depois um defeito de pista. Observe o nível de óleo, o tremor, o som e os picos nas frequências do defeito. O aço não muda de cor: quem denuncia a falha são os instrumentos.", acao: "falhas" },
    { id: "corrida", titulo: "Corrida A/B/C com a plateia aprovando", min: 5, alvo: "kr", fala: "O mesmo defeito corrigido pelo operador sozinho (A), pelo assistente com aprovação (B) e pelo automático (C). Marque 'A plateia aprova', largue a corrida e peça a alguém para tocar em Aprovar: a falha continua enquanto esperamos.", acao: "corrida" },
    { id: "auditoria", titulo: "Auditoria e barreiras de segurança", min: 2, alvo: "kau", fala: "Toda ação fica numa cadeia de hash: adultere uma linha e a verificação aponta onde quebrou. Depois, os testes de barreira: comando fora do catálogo, passo grande demais e parada de emergência são negados e registrados.", acao: "auditoria" },
    { id: "fecho", titulo: "Números, limites e perguntas", min: 2, alvo: "kqr", fala: "Tudo é simulado, com operador e aprovador modelados e parâmetros didáticos: não é evidência de desempenho em máquina real. Os números vêm dos experimentos do pacote. Mostre o QR para a plateia abrir no celular.", acao: "fecho" }
  ];
  const TOTAL_S = ROTEIRO.reduce((a, e) => a + e.min * 60, 0);
  const inicios = () => { let t = 0; return ROTEIRO.map((e) => { const i = t; t += e.min * 60; return i; }); };
  const mmss = (s) => { const n = Math.abs(Math.round(s)), m = Math.floor(n / 60); return (s < 0 ? "-" : "") + String(m).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0"); };
  /* estado do relógio: t = segundos desde que o apresentador começou; i = etapa em que ele está agora (escolhida por ele) */
  function situacao(t, i) {
    const ini = inicios(), fim = ini[i] + ROTEIRO[i].min * 60, prevista = ROTEIRO.findIndex((e, k) => t < ini[k] + e.min * 60);
    return { etapa: i, restanteEtapa: fim - t, restanteTotal: TOTAL_S - t, atrasoS: t - ini[i] > ROTEIRO[i].min * 60 ? t - fim : 0, etapaPrevista: prevista < 0 ? ROTEIRO.length - 1 : prevista, estourou: t > TOTAL_S };
  }
  const proxima = (i) => Math.min(ROTEIRO.length - 1, i + 1), anterior = (i) => Math.max(0, i - 1);
  const API = { URL_SITE, ROTEIRO, TOTAL_S, mmss, situacao, proxima, anterior, inicios };
  if (typeof module !== "undefined") module.exports = API; else root.BearingApresentador = API;
})(typeof self !== "undefined" ? self : globalThis);
