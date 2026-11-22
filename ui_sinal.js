/* ui_sinal.js: sinal real (.wav, .csv, .mat): carregar e analisar.
   Parte do antigo index.html (separado na v24). Script classico: compartilha o escopo global com os demais ui_*.js;
   a ORDEM de carga em index.html importa (veja a lista de <script>). */
(function(){const Sg=BearingSinal,e=i=>document.getElementById(i);let D0=null,ult="",key="";
const inflar=async u=>{const ds=new DecompressionStream("deflate"),w=ds.writable.getWriter();w.write(u);w.close();return new Uint8Array(await new Response(ds.readable).arrayBuffer())};
const msg=t=>{e("sr_i").textContent=t};
async function carrega(f){try{D0=null;e("sr_c").style.display="none";const ext=(f.name.split(".").pop()||"").toLowerCase();let vars={},fs=null,rpm=null,nota="";
if(ext==="wav"){const w=Sg.lerWav(await f.arrayBuffer());vars={"canal 1":w.x};fs=w.fs;nota=w.nota}
else if(ext==="mat"){const m=await Sg.lerMat(await f.arrayBuffer(),inflar);for(const k in m.vars){const v=m.vars[k];if(v.length>=2048)vars[k]=v;else if(/rpm/i.test(k)&&v.length)rpm=Math.round(v[0])}}
else if(ext==="csv"||ext==="txt"){const c=Sg.lerCsv(await f.text());c.colunas.forEach((x,i)=>{if(x.length>=2048)vars[c.nomes[i]]=x});fs=c.fs}
else throw new Error("formato não suportado (use .wav, .csv, .txt ou .mat)");
const nomes=Object.keys(vars);if(!nomes.length)throw new Error("nenhum sinal com pelo menos 2048 amostras");
D0={vars,nome:f.name};const sel=e("sr_c");sel.textContent="";nomes.forEach(n=>sel.add(new Option(n,n)));sel.style.display=nomes.length>1?"block":"none";
if(nomes.length>1){const pref=nomes.find(n=>/DE_time/i.test(n));if(pref)sel.value=pref}
e("sr_fs").value=fs||"";e("sr_rpm").value=rpm||Math.round(S.rpm);
msg(f.name+": "+nomes.length+" sinal(is), "+vars[sel.value].length+" amostras"+(fs?", "+fs+" Hz":"")+(rpm?", rpm do arquivo "+rpm:"")+(nota?" ("+nota+")":"")+(fs?"":". Informe a taxa de amostragem.")+(rpm?"":" Rotação preenchida com a da bancada ("+Math.round(S.rpm)+" rpm): corrija se o arquivo for de outra rotação."));
if(fs)analisa()}catch(x){D0=null;msg("Não foi possível ler: "+x.message)}}
e("sr_f").onchange=ev=>{if(ev.target.files[0])carrega(ev.target.files[0])};
function marcas(rpm){return B.freqs(rpm,B.PROFILES[S.profile])}
function analisa(){if(!D0)return msg("Escolha um arquivo primeiro.");const x=D0.vars[e("sr_c").value],fs=+e("sr_fs").value,rpm=+e("sr_rpm").value,modo=e("sr_m").value;
if(!(fs>=1000))return msg("Informe a taxa de amostragem (pelo menos 1000 Hz).");if(!(rpm>0))return msg("Informe a rotação do arquivo (rpm).");
const fmax=modo==="env"?600:Math.min(6000,0.45*fs),real=Sg.analisar(x,fs,modo,fmax),sx=B.synth(S,1),sp=B.spectrum(sx,modo==="env",fmax);sp.df=sp.f[1]-sp.f[0];
const mr=marcas(rpm),ms=marcas(S.rpm),rr=Sg.resumo(real,mr),rs=Sg.resumo(sp,ms);ult={real,sp,mr,modo,fmax};key=chave();
desenha();const dg=Math.min(Sg.MAXN,1<<Math.floor(Math.log2(x.length)));
e("sr_lg").textContent="Azul: sinal real ("+D0.nome+"). Cinza: sintético da bancada ("+Math.round(S.rpm)+" rpm). Marcas no rpm do arquivo. "+(x.length>dg?"Analisadas as primeiras "+dg+" amostras ("+(dg/fs).toFixed(1)+" s). ":"")+(modo==="env"?"Envelope em "+Sg.bandaPadrao(fs).map(Math.round).join("–")+" Hz.":"");
const R=(r)=>r?(r.razao>=5?"<b>"+r.razao.toFixed(1)+"×</b>":r.razao.toFixed(1)+"×"):"—";
e("sr_t").innerHTML="<table style='text-align:left'><tr><td class='mut'>Marca</td><td class='mut'>Hz (arquivo)</td><td class='mut'>Real</td><td class='mut'>Sintético</td></tr>"+rr.map(r=>{const s2=rs.find(q=>q.nome===r.nome);return `<tr><td>${r.nome}</td><td>${r.f.toFixed(1)}</td><td>${R(r)}</td><td>${R(s2)}</td></tr>`}).join("")+"</table>";
const NOME={"1x":"rotação (1×): desbalanceamento ou folga","FTF":"gaiola","BPFO":"pista externa","BPFI":"pista interna","2xBSF":"esfera"},top=rr.filter(r=>r.nome!=="1x").sort((a,b)=>b.razao-a.razao)[0];
e("sr_x").innerHTML=(top&&top.razao>=5?"Maior marca no sinal real: <b>"+top.nome+" ("+top.razao.toFixed(1)+"× o piso)</b>, compatível com "+NOME[top.nome]+".":"Nenhuma marca de falha passou de 5× o piso neste trecho.")+" <span class='mut'>Indicação didática, não é laudo; o diagnóstico por regras do simulador não foi aplicado ao sinal real."+(B.PROFILES[S.profile].g&&S.profile!=="6205-2RS"&&S.profile!=="6203-2RS"?" Geometria desta máquina é fictícia.":"")+"</span>"}
function desenha(){if(!ult)return;const c=e("sr_cv"),k=devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight;if(!w)return;if(c.width!==Math.round(w*k)){c.width=Math.round(w*k);c.height=Math.round(h*k)}
const g=c.getContext("2d");g.setTransform(k,0,0,k,0,0);g.clearRect(0,0,w,h);const P=8,X=f=>P+f/ult.fmax*(w-2*P),Y=v=>h-18-v*(h-30);
const curva=(esp,col)=>{let m=0;for(let i=1;i<esp.a.length;i++)m=Math.max(m,esp.a[i]);g.strokeStyle=col;g.lineWidth=1.5;g.beginPath();for(let i=1;i<esp.f.length;i++){const x=X(esp.f[i]),y=Y(esp.a[i]/(m||1));i>1?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()};
curva(ult.sp,"#98a2b3");curva(ult.real,"#2e90fa");g.setLineDash([3,3]);g.font="10px sans-serif";g.fillStyle=css("--mut");g.lineWidth=1;[["FTF"],["BPFO"],["BPFI"],["2xBSF"],["1x"]].forEach(([n],i)=>{const f=ult.mr[n];if(!(f>0&&f<ult.fmax))return;g.strokeStyle=css("--ln");g.beginPath();g.moveTo(X(f),12);g.lineTo(X(f),h-18);g.stroke();g.fillText(n,Math.min(X(f)+2,w-34),12+(i%3)*10)});g.setLineDash([]);g.fillStyle=css("--mut");g.fillText("0",P,h-4);g.fillText(Math.round(ult.fmax)+" Hz",w-48,h-4)}
const chave=()=>[S.profile,S.rpm,S.load,S.oil,S.sev,S.fault,S.lub].join();
e("sr_ok").onclick=analisa;e("sr_c").onchange=()=>{if(D0)msg(D0.nome+": "+D0.vars[e("sr_c").value].length+" amostras no sinal escolhido")};
e("sr_eq").onclick=()=>{const r=+e("sr_rpm").value;if(r>0){B.command(S,"set_rpm",Math.round(r/50)*50);sync(true);if(D0)analisa()}};
const _r=render;render=function(){_r();if(ult&&D0&&chave()!==key)analisa()};addEventListener("resize",desenha);
})();
