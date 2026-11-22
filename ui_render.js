/* ui_render.js: sync() e render(): recalcula o diagnostico e atualiza a tela.
   Parte do antigo index.html (separado na v24). Script classico: compartilha o escopo global com os demais ui_*.js;
   a ORDEM de carga em index.html importa (veja a lista de <script>). */
function sync(recompute,noaudio){
  const p=B.PROFILES[S.profile];if(lastProf!==S.profile){lastProf=S.profile;buildFaults();buildScn();buildRange()}$("prof").value=S.profile;$("pst").textContent="Perfil "+p.status;
  $("rpm").max=p.rpmMax;$("rpm").value=S.rpm;$("load").value=S.load;$("oil").value=S.oil;$("lub").value=S.lub;$("fault").value=S.fault;$("sev").value=S.sev;
  $("vr").textContent=Math.round(S.rpm);$("vl").textContent=S.load;$("vo").textContent=S.oil;$("vs").textContent=(+S.sev).toFixed(2);
  if(recompute){x=B.synth(S,1);env=B.spectrum(x,!p.kind,p.kind?6000:600);D=B.diagnose(S,env);if(SRC&&!noaudio)audioLoad();SG=null}
  render()}
function render(){
  if(CN)CN.atualizar(S);
  try{const E=BearingCena.estadoCena(S),g=CN&&CN.lub==="graxa";$("cap5").textContent="Nível do reservatório: "+Math.round(S.oil)+"%"+(g?" (graxa: preenchimento do espaço entre as pistas)":" · esfera inferior imersa: "+E.imersaoPct+"% · película "+E.filme.rotulo.toLowerCase()+" (ilustrativa)")}catch(x){}
  const bad=D.cond&&D.cond!=="normal";
  $("dx").textContent=D.abstain?"Abstenção":(B.LABELS[D.cond]||D.cond||"—");$("dx").style.color=D.abstain?css("--warn"):bad?css("--bad"):css("--ok");
  $("ev").textContent=D.abstain?D.abstain:D.evidence.join("; ");$("src").textContent=D.source?"Fonte: "+D.source:"";
  const a=$("act");a.disabled=!D.action||S.emergency;a.textContent=D.action?"Solicitar ação: "+D.action:(bad?"Sem ação automática: parar e inspecionar":"Sem ação necessária");
  $("mode").value=ctl.mode;$("cst").innerHTML=S.emergency?"<b style='color:var(--bad)'>EMERGÊNCIA ativa: comandos bloqueados até o Reset.</b>":ctl.halted?"<b style='color:var(--warn)'>Automação interrompida: "+ctl.haltReason+". Troque de modo para reiniciar.</b>":ctl.mode==="diagnostico"?"Nenhuma ação é executada neste modo.":ctl.mode==="assistido"?"Ações propostas ficam na fila até você aprovar.":"O piloto executa 1 ação por ciclo, só do catálogo de 5 ações.";
  $("pend").innerHTML=Object.entries(ctl.pending).map(([id,a])=>`<div class="g" style="margin-top:8px;align-items:center"><span><b>${id}</b> ${a.name}${a.target_rpm?" → "+a.target_rpm+" rpm":a.target_load?" → "+a.target_load+"%":a.value?" = "+a.value:""}</span><span class="g"><button class="p" data-ap="${id}">Aprovar</button><button data-rj="${id}">Rejeitar</button></span></div>`).join("");renderLog();
  const p=B.PROFILES[S.profile],f=B.freqs(S.rpm,p),st=B.steadyTemp(S);
  $("tp").innerHTML=`Atual <b>${S.temp.toFixed(1)} °C</b> → estacionária ${st.toFixed(1)} °C <span class="mut">(tempo simulado ${(S.t/60).toFixed(0)} min)</span>`;
  $("fq").innerHTML=Object.entries(f).map(([k,v])=>`<tr><td>${k}</td><td>${v.toFixed(1)} Hz</td></tr>`).join("");
  draw()}
