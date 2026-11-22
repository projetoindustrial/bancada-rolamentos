/* ui_apresentador.js: modo apresentador (roteiro de 15 min) e QR.
   Parte do antigo index.html (separado na v24). Script classico: compartilha o escopo global com os demais ui_*.js;
   a ORDEM de carga em index.html importa (veja a lista de <script>). */
/* F7: modo apresentador e QR */
(function(){const AP=BearingApresentador;let i=0,t0=0,tm=null,wl=null;
 try{const q=qrcode(0,"M");q.addData(AP.URL_SITE);q.make();$("qrbox").innerHTML=q.createSvgTag({cellSize:6,margin:2,scalable:true});const sv=$("qrbox").querySelector("svg");if(sv){sv.style.cssText="width:min(70vw,240px);height:auto;background:#fff;border-radius:8px"}}catch(e){}
 $("qrurl").textContent=AP.URL_SITE;
 const go=id=>{const e=$(id);if(e)e.scrollIntoView({behavior:"smooth",block:"start"})};
 function rend(){const st=AP.ROTEIRO[i],sit=AP.situacao((Date.now()-t0)/1000,i);$("apt").textContent=(i+1)+"/"+AP.ROTEIRO.length+" · "+st.titulo;$("apf").textContent=st.fala;
  const c=$("apc");c.textContent=AP.mmss(sit.restanteEtapa);c.classList.toggle("neg",sit.restanteEtapa<0);c.title="tempo restante da etapa; total restante "+AP.mmss(sit.restanteTotal)}
 function exec(){const a=AP.ROTEIRO[i].acao;
  if(a==="normal"){ctl.reset();sync(true);if(!SRC)$("aud").click()}
  else if(a==="falhas"){const o=[...$("scn").options].find(x=>/lubrifica..o insuficiente/i.test(x.text));if(o){$("scn").value=o.value;$("scgo").click()}}
  else if(a==="corrida"){$("rm").checked=true;const o=[...$("rc").options].find(x=>x.value==="lubrificacao_insuficiente");if(o)$("rc").value=o.value}
  go(AP.ROTEIRO[i].alvo)}
 function ir(k){i=k;rend();go(AP.ROTEIRO[i].alvo)}
 async function ligar(){document.body.classList.add("apres");$("ap").style.display="block";i=0;t0=Date.now();rend();clearInterval(tm);tm=setInterval(rend,1000);try{if(navigator.wakeLock)wl=await navigator.wakeLock.request("screen")}catch(e){}go(AP.ROTEIRO[0].alvo)}
 function sair(){document.body.classList.remove("apres");$("ap").style.display="none";clearInterval(tm);try{if(wl)wl.release()}catch(e){}wl=null;if(document.fullscreenElement)document.exitFullscreen()}
 on("apon","click",ligar);on("apq","click",sair);on("apx","click",exec);on("apn","click",()=>ir(AP.proxima(i)));on("apa","click",()=>ir(AP.anterior(i)));
 on("apr","click",()=>{ctl.reset();sync(true);audioStop();const r=$("rrs");if(r)r.click();i=0;t0=Date.now();rend();window.scrollTo({top:0,behavior:"smooth"})});
 if(!document.documentElement.requestFullscreen)$("apfs").style.display="none";
 on("apfs","click",()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{})});
})();
