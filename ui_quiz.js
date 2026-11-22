/* ui_quiz.js: Quiz: estado, sorteio e exibicao.
   Parte do antigo index.html (separado na v24). Script classico: compartilha o escopo global com os demais ui_*.js;
   a ORDEM de carga em index.html importa (veja a lista de <script>). */
/* --- quiz --- */
const QS={ok:0,n:0};
try{Object.assign(QS,JSON.parse(localStorage.getItem("bal_quiz")||"{}"))}catch(e){}
let Q={sol:null,ans:null,ev:""};
const qpool=()=>["normal",...B.faultsOf(S),"lubrificacao_insuficiente","excesso_lubrificante","sobrerrotacao","sobrecarga"];
function qnew(){const p=B.PROFILES[S.profile],pool=qpool(),r=(a,b)=>a+Math.random()*(b-a),NV=window.nivelQuiz?window.nivelQuiz():1;
  for(let t=0;t<40;t++){const sol=pool[Math.floor(Math.random()*pool.length)];ctl.reset();
    B.command(S,"set_rpm",Math.round(r(1200,2800)/50)*50);B.command(S,"set_load",Math.round(r(20,65)));S.oil=Math.round(r(60,85));
    if(sol==="lubrificacao_insuficiente")S.oil=Math.round(r(10,35));else if(sol==="excesso_lubrificante")S.oil=Math.round(r(95,100));
    else if(sol==="sobrerrotacao")B.command(S,"set_rpm",p.lim.rpm+Math.round(r(NV>=3?100:NV===2?200:300,1200)/50)*50);else if(sol==="sobrecarga")B.command(S,"set_load",Math.min(100,p.lim.load+Math.round(r(NV>=3?3:NV===2?5:8,18))));
    else if(sol!=="normal"){B.command(S,"set_fault",sol);const SR=NV>=3?[0.2,0.4]:NV===2?[0.35,0.65]:[0.6,1];S.sev=Math.round(r(SR[0],SR[1])*20)/20}
    S.temp=B.steadyTemp(S);const xx=B.synth(S,1),d=B.diagnose(S,B.spectrum(xx,!p.kind,p.kind?6000:600));if(d.cond===sol){Q={sol,ans:null,ev:d.evidence.join("; ")};break}}
  $("deg").value="0";sync(true)}
function qrender(){const on=view==="quiz";$("qz").style.display=on?"":"none";document.querySelectorAll(".sim").forEach(e=>e.style.display=on?"none":"");if(!on)return;
  $("qinfo").innerHTML=Q.sol?`Leituras do painel: <b>${Math.round(S.rpm)} rpm</b> · carga <b>${S.load}%</b> · nível de óleo <b>${S.oil}%</b> · temperatura <b>${S.temp.toFixed(1)} °C</b>. Analise os gráficos e escolha a condição.`:"Toque em Novo desafio.";
  $("qopts").innerHTML=Q.sol?qpool().map(c=>`<button data-q="${c}" ${Q.ans?"disabled":""}>${B.LABELS[c]}</button>`).join(""):"";
  $("qres").innerHTML=Q.ans?(Q.ans===Q.sol?`<b style="color:var(--ok)">Correto!</b>`:`<b style="color:var(--bad)">Errado.</b> Era <b>${B.LABELS[Q.sol]}</b>.`)+` <span class="mut">${Q.ev||""}</span>`:"";
  $("qrev").disabled=!Q.ans;$("qsc").textContent=`Placar: ${QS.ok} acertos em ${QS.n} desafios`}
