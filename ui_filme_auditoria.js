/* ui_filme_auditoria.js: indicador de pelicula, 'frequencia que mais pesou' e botao de baixar a auditoria.
   Parte do antigo index.html (separado na v24). Script classico: compartilha o escopo global com os demais ui_*.js;
   a ORDEM de carga em index.html importa (veja a lista de <script>). */
(function(){const F=BearingFilme,e=i=>document.getElementById(i),_r=render;
function upd(){try{const f=F.filme(S.oil,S.rpm,S.sev);e("fi_v").textContent=f.um.toFixed(1)+" µm";e("fi_e").textContent=f.rotulo;const b=e("fi_b");b.style.width=Math.min(100,f.um/1.5)+"%";b.style.background=f.estado==="ideal"?css("--ok"):css("--warn");
const k=D&&D.cond&&D.cond!=="normal"?B.FAULT_FREQ[D.cond]:null,fr=k?B.freqs(S.rpm,B.PROFILES[S.profile]):null;
e("why").textContent=fr&&typeof fr[k]==="number"?"Frequência que mais pesou: "+k+" = "+fr[k].toFixed(1)+" Hz (sinal de "+(B.LABELS[D.cond]||D.cond).toLowerCase()+").":""}catch(x){}}
render=function(){_r();upd()};upd()})();
document.getElementById("log").insertAdjacentHTML("afterend",'<button id="au_dl" style="margin-top:8px">Baixar auditoria (JSON)</button>');
document.getElementById("au_dl").onclick=()=>{AU.sincronizar(ctl.log);BearingRegistro.baixar("bancada_rolamentos_auditoria.json",JSON.stringify({origem:"Bearing AI Lab (dados sintéticos)",genese:BearingAuditoria.GENESIS,verificacao:AU.verificar(),entradas:AU.itens},null,2),"application/json")};
