/* Relatório PDF (Sprint 2, #9). Usa jsPDF local (vendor/jspdf.umd.min.js) para funcionar offline. */
(function (root) {
  "use strict";
  const L1 = s => String(s == null ? "" : s).replace(/→/g, "->").replace(/≥/g, ">=").replace(/τ/g, "tau").replace(/[^\x00-\xff]/g, "?");
  function gerar(J, d) {
    const doc = new J({ unit: "mm", format: "a4" }), M = 15, W = 180; let y = M;
    const novaPag = h => { if (y + h > 282) { doc.addPage(); y = M; } };
    const h1 = t => { novaPag(10); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(L1(t), M, y); y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(10); };
    const lin = t => { doc.splitTextToSize(L1(t), W).forEach(l => { novaPag(5); doc.text(l, M, y); y += 5; }); };
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text("Bearing AI Lab - Relatorio da bancada", M, y); y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); lin("Dados sinteticos, uso didatico. Gerado em " + d.geradoEm + ". Pagina: projetoindustrial.github.io/bancada-rolamentos"); y += 2; doc.setFontSize(10);
    h1("1. Parametros da situacao"); d.params.forEach(p => lin(p[0] + ": " + p[1]));
    y += 2; h1("2. Diagnostico"); lin("Resultado: " + d.diag); if (d.freq) lin(d.freq); if (d.fonte) lin("Fonte: " + d.fonte); if (d.evid) lin("Evidencia: " + d.evid);
    y += 2; h1("3. Pelicula de oleo (espessura ilustrativa, didatica)"); lin(d.filme);
    y += 2; h1("4. Atual x Ideal (mesmo rpm, nivel 70%)");
    d.cmp.forEach(r => { novaPag(5); doc.text(L1(r[0]), M, y); doc.text(L1(r[1]), M + 55, y); doc.text(L1(r[2]), M + 115, y); y += 5; });
    y += 2; h1("5. Linha do tempo da falha");
    if (d.linha.length > 1) {
      novaPag(52); const x0 = M, y0 = y, w = W, h = 44, t0 = d.linha[0].t, t1 = Math.max(d.linha[d.linha.length - 1].t, t0 + 1);
      doc.setDrawColor(150); doc.rect(x0, y0, w, h);
      const X = t => x0 + (t - t0) / (t1 - t0) * w;
      const serie = (f, cor) => { doc.setDrawColor(cor[0], cor[1], cor[2]); doc.setLineWidth(0.5); for (let i = 1; i < d.linha.length; i++) doc.line(X(d.linha[i - 1].t), f(d.linha[i - 1]), X(d.linha[i].t), f(d.linha[i])); };
      serie(a => y0 + h - a.sev * h, [247, 144, 9]); serie(a => y0 + h - Math.min(1, Math.max(0, (a.temp - 20) / 100)) * h, [240, 68, 56]); doc.setLineWidth(0.2);
      if (d.rupt) { doc.setDrawColor(0); doc.line(X(d.rupt.t), y0, X(d.rupt.t), y0 + h); doc.setFontSize(8); doc.text("ruptura", X(d.rupt.t) + 1, y0 + 4); doc.setFontSize(10); }
      y += h + 5; lin("Laranja: severidade (0 a 1; indice de saude = 1 - severidade, so visual). Vermelho: temperatura (20 a 120 C). Janela de " + Math.round((t1 - t0) / 60 * 10) / 10 + " min simulados." + (d.rupt ? " Ruptura (premissa didatica: nivel < 50% ou severidade >= 0,8) em " + Math.round((d.rupt.t - t0) / 6) / 10 + " min da janela." : " Sem ruptura na janela."));
    } else lin("Ainda sem historico suficiente (deixe a simulacao rodar ou ligue a degradacao automatica).");
    d.imgs.forEach(im => { const h = Math.min(70, W * im.h / im.w); y += 3; novaPag(h + 10); doc.setFont("helvetica", "bold"); doc.text(L1(im.titulo), M, y); doc.setFont("helvetica", "normal"); y += 2; doc.addImage(im.d, "PNG", M, y, W, h); y += h + 2; });
    y += 3; h1("6. Auditoria (ultimas entradas)"); if (d.audit.length) d.audit.forEach(a => lin(a)); else lin("Sem entradas.");
    y += 2; lin("Limites: simulador didatico com dados sinteticos; valores sem fonte sao premissas didaticas (ver cartao Fontes e premissas). Os graficos saem com as cores do tema atual da pagina.");
    return doc;
  }
  const API = { L1, gerar };
  if (typeof module !== "undefined") module.exports = API; else root.BearingRelatorio = API;
})(typeof self !== "undefined" ? self : globalThis);
