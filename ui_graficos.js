/* ui_graficos.js: graficos de canvas: setup, eixos, onda/espectro (draw) e espectrograma (drawSg).
   Parte do antigo index.html (separado na v24). Script classico: compartilha o escopo global com os demais ui_*.js;
   a ORDEM de carga em index.html importa (veja a lista de <script>). */
function setup(c){const r=devicePixelRatio||1;c.width=c.clientWidth*r;c.height=c.clientHeight*r;const g=c.getContext("2d");g.scale(r,r);g.clearRect(0,0,c.clientWidth,c.clientHeight);return[g,c.clientWidth,c.clientHeight]}
function axis(g,w,h,pad,max,step,unit){g.font="11px sans-serif";g.fillStyle=css("--mut");g.strokeStyle=css("--ln");g.textAlign="center";
  for(let v=0;v<=max+1e-9;v+=step){const X=pad+v/max*(w-pad-4);g.beginPath();g.moveTo(X,0);g.lineTo(X,h-16);g.stroke();g.fillText(v>=max-1e-9?v+" "+unit:v,Math.min(Math.max(X,12),w-22),h-3)}
  g.textAlign="left"}
function draw(){
  let[g,w,h]=setup($("c1")),n=Math.floor(B.FS*0.08),m=1e-6,pad=4;for(let i=0;i<n;i++)m=Math.max(m,Math.abs(x[i]));
  axis(g,w,h,pad,80,20,"ms");const H=h-20;g.strokeStyle=css("--ln");g.beginPath();g.moveTo(0,H/2);g.lineTo(w,H/2);g.stroke();
  g.strokeStyle=css("--ac");g.lineWidth=1.2;g.beginPath();for(let i=0;i<n;i++){const X=pad+i/n*(w-pad-4),Y=H/2-x[i]/m*(H/2-6);i?g.lineTo(X,Y):g.moveTo(X,Y)}g.stroke();g.lineWidth=1;
  g.fillStyle=css("--mut");g.font="11px sans-serif";g.fillText("pico "+m.toFixed(2)+" u.a.",6,12);
  [g,w,h]=setup($("c2"));const R=+$("rng").value,K=Math.min(env.f.length,Math.floor(R/(B.FS/B.N))),step=nice(R);let M=1e-9;for(let k=1;k<K;k++)M=Math.max(M,env.a[k]);
  axis(g,w,h,pad,R,step,"Hz");const H2=h-20;
  const fr=B.freqs(S.rpm,B.PROFILES[S.profile]),act=actLine();g.font="11px sans-serif";let ly=12;
  for(const[k,v]of Object.entries(fr)){if(v<=0||v>R)continue;const X=pad+v/R*(w-pad-4),on=k===act;g.strokeStyle=on?css("--bad"):css("--mut");g.lineWidth=on?2:1;g.setLineDash(on?[]:[3,3]);g.beginPath();g.moveTo(X,0);g.lineTo(X,H2);g.stroke();g.setLineDash([]);g.lineWidth=1;g.fillStyle=on?css("--bad"):css("--mut");g.fillText(k,Math.min(X+3,w-44),ly);ly+=12}
  g.strokeStyle=css("--ac");g.lineWidth=1.2;g.beginPath();for(let k=1;k<K;k++){const X=pad+env.f[k]/R*(w-pad-4),Y=H2-env.a[k]/M*(H2-8);k>1?g.lineTo(X,Y):g.moveTo(X,Y)}g.stroke();g.lineWidth=1;drawSg()}
let SG=null;
function drawSg(){const c=$("c4");if(!c)return;if(!SG){const y=BearingAudio.render(S,{seed:1});SG=BearingAudio.spectrogram(y,BearingAudio.FSA,256,64)}
  const[g,w,h]=setup(c),F=SG.frames,K=Math.floor(6000/SG.df),pad=34,W=w-pad-4,H=h-18;if(!F.length)return;let M=1e-9;for(const f of F)for(let k=1;k<K;k++)M=Math.max(M,f[k]);
  const lo=css("--card"),hi=css("--ac");const cv=document.createElement("canvas");cv.width=F.length;cv.height=K;const cg=cv.getContext("2d"),im=cg.createImageData(F.length,K);
  const rgb=s=>{const e=document.createElement("canvas").getContext("2d");e.fillStyle=s;e.fillRect(0,0,1,1);return e.getImageData?[...e.getImageData(0,0,1,1).data]:[0,0,0,255]};const A=rgb(lo),Bc=rgb(hi);
  for(let x=0;x<F.length;x++)for(let k=0;k<K;k++){const v=Math.pow(Math.min(1,F[x][k]/(M*0.6)),0.5),o=((K-1-k)*F.length+x)*4;im.data[o]=A[0]+(Bc[0]-A[0])*v;im.data[o+1]=A[1]+(Bc[1]-A[1])*v;im.data[o+2]=A[2]+(Bc[2]-A[2])*v;im.data[o+3]=255}
  cg.putImageData(im,0,0);g.imageSmoothingEnabled=false;g.drawImage(cv,pad,0,W,H);g.fillStyle=css("--mut");g.font="11px sans-serif";
  for(const f of [0,2000,4000,6000]){const Y=H-f/6000*H;g.fillText(f?f/1000+"k":"0",4,Math.min(H-2,Math.max(10,Y+4)))}g.fillText("0 s",pad,h-4);g.fillText("2 s",w-26,h-4)}
