/* ui_cenarios.js: cenarios didaticos, textos de ajuda por perfil, montagem de falhas e faixa.
   Parte do antigo index.html (separado na v24). Script classico: compartilha o escopo global com os demais ui_*.js;
   a ORDEM de carga em index.html importa (veja a lista de <script>). */
const SCB=[["Normal (referência)",{},"Sem picos acima do piso no espectro de envelope; diagnóstico normal."],
["Lubrificação insuficiente",{oil:20},"Óleo em 20%: o ruído e a temperatura sobem. No assistido, o controlador propõe add_oil; observe a fila."],
["Excesso de lubrificante",{oil:100},"Óleo em 100%: acima da faixa 50–90%. A ação proposta é drain_oil."],
["Lubrificante inadequado",{lub:"inadequado"},"Desvio de lubrificação sem mudar o nível; a ação é selecionar lubrificante adequado."],
["Sobrerrotação",{rpm:4500},"RPM acima do limite do perfil: regra de limite. O piloto reduz 500 rpm por ciclo."],
["Sobrecarga",{load:95},"Carga acima do limite. O piloto reduz 20 pontos por ciclo."],
["Falha combinada",{rpm:4000,oil:20},"Duas condições juntas: a regra de limite (RPM) vem primeiro; depois que o RPM normaliza, aparece o óleo."],
["Pista externa",{fault:"pista_externa",sev:0.8},"Pico no BPFO. Defeito mecânico: não há ação automática; o piloto interrompe e pede inspeção."],
["Pista interna",{fault:"pista_interna",sev:0.8},"Pico no BPFI, com bandas laterais de 1x (modulação pela rotação)."],
["Esfera",{fault:"esfera",sev:0.8},"Pico em 2xBSF, modulado pela gaiola (FTF). É o pico mais fraco dos quatro."],
["Gaiola",{fault:"gaiola",sev:0.8},"Pico em FTF, baixa frequência. Abaixo de ~1500 rpm não é resolvível de forma confiável nesta janela."],
["Fora do domínio",{rpm:400,fault:"pista_externa",sev:0.8},"RPM fora de 600–3600: o diagnóstico se abstém em vez de arriscar. O piloto interrompe."]];
let SC=SCB;
const MT={desbalanceamento:"Pico em 1x muito acima do esperado para a rotação e a carga, sem pico em 2x. Corrige-se balanceando (sem ação automática).",desalinhamento:"Pico em 2x (e 1x um pouco maior): típico de desalinhamento de acoplamento.",folga:"Harmônicas 3x–5x e subharmônica 0,5x: típico de folga ou fixação solta.",cavitacao:"Ruído de banda larga em 4–6 kHz acima do esperado ('cascalho'). Verifique sucção/NPSH; sem ação automática.",dente_quebrado:"Bandas laterais em GMF±1x: um dente com defeito modula o engrenamento a cada volta.",desgaste_dentes:"2xGMF elevado, quase sem bandas laterais: desgaste distribuído."};
function buildScn(){const p=B.PROFILES[S.profile];SC=p.kind?[...SCB.slice(0,7),...p.faults.map(f=>[f[1],{fault:f[0],sev:.8},MT[f[0]]]),["Fora do domínio",{rpm:400,fault:p.faults[0][0],sev:.8},SCB[11][2]]]:SCB;$("scn").innerHTML="";SC.forEach((c,i)=>$("scn").add(new Option(c[0],i)));showSc()}
function showSc(){$("cen").textContent=SC[$("scn").value][2]}
function buildFaults(){const p=B.PROFILES[S.profile];$("fault").innerHTML='<option value="normal">Sem falha</option>'+(p.faults||[["pista_externa","Pista externa"],["pista_interna","Pista interna"],["esfera","Esfera"],["gaiola","Gaiola"]]).map(f=>`<option value="${f[0]}">${f[1]}</option>`).join("")}
const HLP={rotativo:"Espectro direto da vibração. 1x é a rotação: desbalanceamento eleva o 1x, desalinhamento o 2x, folga cria harmônicas (3x–5x) e subharmônica 0,5x; cavitação eleva o ruído de banda larga em alta frequência. BPF/VPF é a passagem de pás/palhetas. A linha vermelha é a falha ativa.",engrenagem:"Espectro direto da vibração. GMF é a frequência de engrenamento (dentes × rotação). Dente quebrado cria bandas laterais em GMF±1x; desgaste eleva o 2xGMF. A linha vermelha é a falha ativa."};
const HLP0=$("hlp2").textContent;
function buildRange(){const p=B.PROFILES[S.profile],o=p.kind==="engrenagem"?[1000,2000,4000]:p.kind?[250,500,1000]:[150,300,600];$("rng").innerHTML=o.map(v=>`<option value="${v}">0–${v} Hz</option>`).join("");$("rng").value=o[1];$("t2").textContent=p.kind?"Espectro de vibração":"Espectro de envelope";$("hlp2").textContent=p.kind?HLP[p.kind]:HLP0}
function actLine(){const p=B.PROFILES[S.profile];if(S.sev<=0||S.fault==="normal"||(view==="quiz"&&!Q.ans))return null;return p.faultLine?p.faultLine[S.fault]:B.FAULT_FREQ[S.fault]}
