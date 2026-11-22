/* ui_linha_quiz.js: linha do tempo de 10 min simulados e nivel do Quiz.
   Parte do antigo index.html (separado na v24). Script classico: compartilha o escopo global com os demais ui_*.js;
   a ORDEM de carga em index.html importa (veja a lista de <script>). */
(function(){const LN=BearingLinha,F=BearingFilme,e=i=>document.getElementById(i),Ls=LN.Linha();let pausado=false,sel=-1;
const bS=B.stepThermal,bD=B.degrade;B.stepThermal=function(s,dt){if(pausado)return;return bS.call(B,s,dt)};B.degrade=function(s,dt,r){if(pausado)return false;return bD.call(B,s,dt,r)};
const mm=t=>{t=Math.max(0,Math.round(t));return String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0")};
function rend(){const a=Ls.a,n=a.length;if(!n)return;const r=e("tl_r");r.max=n-1;r.value=sel<0?n-1:sel;const c=e("tl"),k=devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;if(!w)return;if(c.width!==Math.round(w*k)){c.width=Math.round(w*k);c.height=Math.round(h*k)}
const g=c.getContext("2d");g.setTransform(k,0,0,k,0,0);g.clearRect(0,0,w,h);const t0=a[0].t,sp=Math.max(60,a[n-1].t-t0),P=24,X=t=>P+(t-t0)/sp*(w-P-6),Y=v=>h-16-v*(h-26);
g.strokeStyle=css("--ln");g.fillStyle=css("--mut");g.font="10px sans-serif";g.beginPath();[0,.5,1].forEach(v=>{g.moveTo(P,Y(v));g.lineTo(w-6,Y(v))});g.stroke();g.fillText("1",8,Y(1)+4);g.fillText("0",8,Y(0)+4);g.fillText("0",P,h-3);g.fillText(mm(sp)+" (relativo)",w-92,h-3);
const ln=(f,col)=>{g.strokeStyle=col;g.lineWidth=2;g.beginPath();a.forEach((x,i)=>{i?g.lineTo(X(x.t),Y(f(x))):g.moveTo(X(x.t),Y(f(x)))});g.stroke();g.lineWidth=1};
ln(x=>x.sev,"#f79009");ln(x=>Math.min(1,Math.max(0,(x.temp-20)/100)),"#f04438");
const ru=Ls.ruptura();if(ru){g.strokeStyle=css("--tx");g.setLineDash([4,3]);g.beginPath();g.moveTo(X(ru.t),4);g.lineTo(X(ru.t),h-16);g.stroke();g.setLineDash([]);g.fillStyle=css("--tx");g.fillText("ruptura",Math.min(X(ru.t)+3,w-44),12)}
const i=sel<0?n-1:sel,x=a[i];g.strokeStyle=css("--ac");g.beginPath();g.moveTo(X(x.t),4);g.lineTo(X(x.t),h-16);g.stroke();
e("tl_t").textContent=mm(x.t-t0)+" / "+mm(sp)+" min · severidade "+x.sev.toFixed(2)+" · índice de saúde "+LN.saude(x).toFixed(2)+" · "+x.temp.toFixed(1)+" °C · película "+x.um.toFixed(1)+" µm"+(pausado?" · PAUSADO":"")+(ru?" · ruptura em "+mm(ru.t-t0):"")}
function aplicar(i){const a=Ls.a[i];if(!a)return;Object.assign(S,{t:a.t,sev:a.sev,temp:a.temp,oil:a.oil,rpm:a.rpm,load:a.load,fault:a.fault});sync(true);rend()}
setInterval(()=>{if(pausado||(S.emergency&&S.temp<=26))return;if(Ls.push(S,F))rend()},1000);
e("tl_p").onclick=()=>{pausado=true;rend()};
e("tl_pl").onclick=()=>{if(sel>=0){Ls.cortar(sel);sel=-1}pausado=false;rend()};
e("tl_v").onclick=()=>{if(!Ls.a.length)return;pausado=true;sel=Math.max(0,(sel<0?Ls.a.length-1:sel)-1);aplicar(sel)};
e("tl_r").oninput=ev=>{if(!Ls.a.length)return;pausado=true;sel=+ev.target.value;aplicar(sel)};
Ls.push(S,F);rend();addEventListener("resize",rend);
/* --- relatório PDF --- */
function img(id){const c=e(id);if(!c||!c.width||!c.clientWidth)return null;const o=document.createElement("canvas");o.width=c.width;o.height=c.height;const g=o.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,o.width,o.height);g.drawImage(c,0,0);const h=c.closest(".card")&&c.closest(".card").querySelector("h2");return{w:o.width,h:o.height,d:o.toDataURL("image/png"),titulo:h?h.textContent.replace(/\s+/g," ").trim():id}}
e("rp_go").onclick=()=>{try{const C=BearingComparar,a=C.lado(C.instantaneo(S),B,F),i=C.lado(C.ideal(S),B,F),f=F.filme(S.oil,S.rpm,S.sev);AU.sincronizar(ctl.log);const ru=Ls.ruptura();
const cmp=[["","Atual","Ideal (70%)"],["Nivel de oleo",a.nivel+"%",i.nivel+"%"],["rpm",a.rpm,i.rpm],["Pelicula (ilustr.)",a.um.toFixed(1)+" um",i.um.toFixed(1)+" um"],["Estado",a.estado,i.estado],["Diagnostico",a.cond,i.cond],["Temp. estacionaria",a.temp.toFixed(1)+" C",i.temp.toFixed(1)+" C"]];
const d={geradoEm:new Date().toLocaleString("pt-BR"),params:[["Perfil",S.profile],["rpm",Math.round(S.rpm)],["Carga",S.load+"%"],["Nivel de oleo",S.oil+"%"],["Lubrificacao",S.lub],["Idade do oleo",S.idade||"novo"],["Falha",S.fault],["Severidade",(+S.sev).toFixed(2)],["Temperatura",S.temp.toFixed(1)+" C"],["Tempo simulado",(S.t/60).toFixed(1)+" min"]],
diag:$("dx").textContent,freq:$("why").textContent,fonte:$("src").textContent.replace("Fonte: ",""),evid:$("ev").textContent,filme:f.um.toFixed(1)+" um - "+f.rotulo+" (valor didatico, nao medido)",cmp,linha:Ls.a,rupt:ru,
imgs:["c1","c2","c4"].map(img).filter(Boolean),audit:AU.itens.slice(-8).map(l=>"#"+l.seq+" "+(l.t/60).toFixed(1)+" min "+(l.ok?"ok":"negado")+" "+l.src+" "+l.ev+" "+l.data+" "+l.hash.slice(0,8))};
const doc=BearingRelatorio.gerar(window.jspdf.jsPDF,d);doc.save("bancada_rolamentos_relatorio.pdf");e("rp_st").textContent="Relatório gerado."}catch(x){e("rp_st").textContent="Não foi possível gerar o PDF: "+x.message}};
/* --- Quiz: sequência de acertos --- */
let QX={st:0,best:0};try{Object.assign(QX,JSON.parse(localStorage.getItem("bal_quiz2")||"{}"))}catch(x){}
e("qopts").addEventListener("click",()=>{if(Q.ans&&!Q._c){Q._c=1;if(Q.ans===Q.sol){QX.st++;QX.best=Math.max(QX.best,QX.st)}else QX.st=0;try{localStorage.setItem("bal_quiz2",JSON.stringify(QX))}catch(x){}qrender()}});
window.nivelQuiz=()=>Math.min(3,1+Math.floor(QX.st/3));const _q=qrender;qrender=function(){_q();const s=e("qsc");if(s)s.textContent+=(QS.n?" · "+Math.round(100*QS.ok/QS.n)+"% de acertos · sequência "+QX.st+" (melhor "+QX.best+")":"")+" · Nível "+window.nivelQuiz()+" de 3 (sobe a cada 3 acertos seguidos; erro volta ao 1)"};
})();
