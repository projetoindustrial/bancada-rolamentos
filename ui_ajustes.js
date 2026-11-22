/* ui_ajustes.js: modo daltonico, ajustes, tutorial e link de cenario.
   Parte do antigo index.html (separado na v24). Script classico: compartilha o escopo global com os demais ui_*.js;
   a ORDEM de carga em index.html importa (veja a lista de <script>). */
(function(){const e=i=>document.getElementById(i),CE=BearingCenario;let dalt=0,TS=null;
const lsG=k=>{try{return localStorage.getItem(k)}catch(x){return null}},lsS=(k,v)=>{try{localStorage.setItem(k,v)}catch(x){}};
/* ---- modo daltônico ---- */
function setDalt(v,salvar){dalt=v?1:0;document.body.classList.toggle("dalt",!!dalt);e("aj_d").textContent="Modo daltônico: "+(dalt?"ligado":"desligado");if(salvar)lsS("bal_dalt",dalt);try{render()}catch(x){}}
e("aj_d").onclick=()=>setDalt(!dalt,true);
/* ---- idade do óleo ---- */
const LIM={novo:0,usado:600,envelhecido:1800};S.idade=S.idade||"novo";S.oleoT=S.oleoT||0;let lastT=S.t;
const sincId=()=>{e("id_s").value=S.idade||"novo"};
e("id_s").onchange=ev=>{S.idade=ev.target.value;S.oleoT=LIM[S.idade];sync(true)};
e("id_t").onclick=()=>{S.idade="novo";S.oleoT=0;sincId();sync(true)};
setInterval(()=>{const d=S.t-lastT;lastT=S.t;if(e("id_a").checked&&d>0&&d<=600){S.oleoT=(S.oleoT||0)+d;const n=S.oleoT>=LIM.envelhecido?"envelhecido":S.oleoT>=LIM.usado?"usado":"novo";if(n!==S.idade&&LIM[n]>LIM[S.idade||"novo"]){S.idade=n;sincId()}}},1000);
/* rótulos/texturas da película + sincronia da idade a cada render */
const _r=render,ROT={baixo:["Película insuficiente","tx-baixo"],ideal:["Cobertura ideal","tx-ideal"],espesso:["Excesso / acúmulo","tx-espesso"]};
render=function(){_r();try{sincId();const f=BearingFilme.filme(S.oil,S.rpm,S.sev),r=ROT[f.estado];e("fi_e").textContent=r[0]+" ("+f.rotulo+")";e("fi_c").className=r[1];e("fi_b").className=r[1]}catch(x){}};
/* ---- link do cenário ---- */
function aplicar(cfg){B.command(S,"reset");B.command(S,"set_profile",cfg.maquina);B.command(S,"set_rpm",cfg.rpm);B.command(S,"set_load",cfg.carga);S.oil=cfg.oleo;B.command(S,"set_lubricant",cfg.oleotipo);if(cfg.falha!=="normal"){B.command(S,"set_fault",cfg.falha);B.command(S,"set_severity",cfg.sev)}
S.idade=cfg.idade;S.oleoT=LIM[cfg.idade];S.temp=B.steadyTemp(S);e("deg").value=String(CE.DEGR.indexOf(cfg.degr));ctl.pending={};setDalt(cfg.daltonico,false);sync(true)}
const L=CE.ler(location.search,B);
if(L.modo!=="nenhum"){aplicar(L.cfg);if(L.modo==="invalido"){const a=e("lk_av");a.style.display="block";a.textContent="Link inválido ("+L.motivo+"): abri o cenário ideal."}}
else if(lsG("bal_dalt")==="1")setDalt(1,false);
const urlAtual=()=>location.origin+location.pathname+"?"+CE.construir(S,+e("deg").value,dalt);
e("aj_l").onclick=async()=>{const u=urlAtual();e("aj_u").value=u;let ok=false;try{await navigator.clipboard.writeText(u);ok=true}catch(x){e("aj_u").select();try{ok=document.execCommand("copy")}catch(y){}}
const b=e("aj_l");b.textContent=ok?"Link copiado":"Selecione e copie o link abaixo";setTimeout(()=>{b.textContent="Copiar link do cenário"},2000)};
/* ---- tutorial (primeira visita, 3 passos) ---- */
const PASSOS=[{alvo:()=>e("oil").closest(".card")||e("oil"),txt:"Passo 1 de 3: mova o controle de Nível de óleo. Veja o que muda."},{alvo:()=>e("kc"),txt:"Passo 2 de 3: veja a película e o óleo na bancada. Com pouco óleo a película fica falhada."},{alvo:()=>e("dx").closest(".card"),txt:"Passo 3 de 3: veja o diagnóstico. Ele explica o que o simulador concluiu e de onde vem a regra."}];
let ti=-1;function mostra(i){document.querySelectorAll(".tut-hl").forEach(x=>x.classList.remove("tut-hl"));if(i>=PASSOS.length){ti=-1;e("tut").style.display="none";lsS("bal_tut","1");return}ti=i;const P=PASSOS[i],al=P.alvo();if(al){al.classList.add("tut-hl");al.scrollIntoView({block:"center",behavior:"smooth"})}e("tut_x").textContent=P.txt;document.querySelectorAll("#tut .dots span").forEach((d,k)=>d.classList.toggle("on",k===i));e("tut_n").textContent=i===PASSOS.length-1?"Concluir":"Próximo";e("tut").style.display="block"}
e("tut_n").onclick=()=>mostra(ti+1);e("tut_p").onclick=()=>mostra(PASSOS.length);e("aj_t").onclick=()=>{try{document.getElementById("view").value="sim";document.getElementById("view").dispatchEvent(new Event("change"))}catch(x){}mostra(0)};
e("oil").addEventListener("input",()=>{if(ti===0)setTimeout(()=>mostra(1),400)});
if(!lsG("bal_tut")&&L.modo==="nenhum"&&!document.body.classList.contains("apres"))setTimeout(()=>mostra(0),600);
sincId();render();
})();
