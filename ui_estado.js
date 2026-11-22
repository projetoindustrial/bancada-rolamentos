/* ui_estado.js: estado global (B, S, ctl, D, view...), registro do log e auditoria encadeada, comando cmd().
   Parte do antigo index.html (separado na v24). Script classico: compartilha o escopo global com os demais ui_*.js;
   a ORDEM de carga em index.html importa (veja a lista de <script>). */
let CN=null;
const B=Bearing,$=i=>document.getElementById(i);
let S=B.newState(),env=null,x=null,D=null;
const ctl=B.Controller(S);
let lastProf=null,view="sim",AC=null,SRC=null,tk=0;
const nice=R=>{const t=R/6;for(const n of[25,50,100,200,250,500,1000])if(n>=t)return n;return 1000};
for(const k in B.PROFILES)$("prof").add(new Option(k,k));
const css=n=>getComputedStyle(document.body).getPropertyValue(n);
function log(m,ok=true){ctl.log.push({t:S.t,src:"console",ev:m,data:"",ok,reason:ok?"ok":"negado"})}
const AU=BearingAuditoria.Cadeia();
let auKey="",auV=null;
function renderLog(){AU.sincronizar(ctl.log);const key=AU.itens.length+"|"+AU.adulteradas().join(",");if(key!==auKey){auKey=key;auV=AU.verificar()}
  const el=$("chs");el.className="chs "+(auV.ok?"ok":"ruim");el.textContent=auV.ok?"✓ Cadeia íntegra ("+auV.total+" registros)":"✗ Cadeia QUEBRADA a partir do registro "+auV.primeira+" (linha adulterada)";
  const ad=AU.adulteradas();$("log").innerHTML=AU.itens.slice(-40).reverse().map(l=>`<div class="${ad.includes(l.seq-1)?"adu":""}">#${l.seq} · ${(l.t/60).toFixed(1)} min · ${l.ok?"✓":"✗"} ${l.src} · ${l.ev} ${l.data} ${l.ok?"":"("+l.reason+")"} · <code>${l.hash.slice(0,8)}</code></div>`).join("")}
function cmd(c,v,tag){const[r,m]=B.command(S,c,v);if(tag)log(`${c}${v!==undefined?"="+v:""}: ${m}`,r);sync(true)}
