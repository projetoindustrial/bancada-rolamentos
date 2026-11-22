/* ui_comparar.js: comparacao Atual x Ideal e A x B.
   Parte do antigo index.html (separado na v24). Script classico: compartilha o escopo global com os demais ui_*.js;
   a ORDEM de carga em index.html importa (veja a lista de <script>). */
(function(){const C=BearingComparar,F=BearingFilme,e=i=>document.getElementById(i),_r=render;let modo="i",A=null,Bs=null,key="";
const col=(t,l)=>l?`<td><b>${t}</b></td>`:`<td><b>${t}</b></td>`;
function tab(x,y,nx,ny){const R=(r,f)=>`<tr><td class="mut">${r}</td><td>${f(x)}</td><td>${f(y)}</td></tr>`;
return `<table style="text-align:left"><tr><td></td><td><b>${nx}</b></td><td><b>${ny}</b></td></tr>`+R("Nível de óleo",o=>o.nivel+"%")+R("rpm",o=>o.rpm)+R("Falha / sev.",o=>o.falha+" / "+o.sev)+R("Película (ilustr.)",o=>o.um.toFixed(1)+" µm")+R("Estado",o=>o.estado)+R("Diagnóstico",o=>o.cond)+R("Fonte",o=>o.fonte||"—")+R("Temp. estacionária",o=>o.temp.toFixed(1)+" °C")+"</table>"}
function upd(){try{const k=modo+"|"+[S.profile,S.rpm,S.load,S.oil,S.sev,S.fault,S.lub].join()+"|"+(A?1:0)+(Bs?1:0)+JSON.stringify(A)+JSON.stringify(Bs);if(k===key)return;key=k;let h;
if(modo==="i"){h=tab(C.lado(C.instantaneo(S),B,F),C.lado(C.ideal(S),B,F),"Atual","Ideal (70%)")}
else if(A&&Bs){h=tab(C.lado(A,B,F),C.lado(Bs,B,F),"Cenário A","Cenário B")}else{h='<span class="mut">Guarde a situação atual como A, mude os controles e guarde como B.</span>'}
e("cp_t").innerHTML=h;e("cp_i").className=modo==="i"?"p":"";e("cp_ab").className=modo==="ab"?"p":""}catch(x){}}
e("cp_i").onclick=()=>{modo="i";upd()};e("cp_ab").onclick=()=>{modo="ab";upd()};
e("cp_a").onclick=()=>{A=C.instantaneo(S);modo="ab";upd()};e("cp_b").onclick=()=>{Bs=C.instantaneo(S);modo="ab";upd()};
render=function(){_r();upd()};upd()})();
