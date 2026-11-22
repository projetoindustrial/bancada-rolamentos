/* ui_registro.js: historico de situacoes (localStorage) e exportacao CSV/JSON.
   Parte do antigo index.html (separado na v24). Script classico: compartilha o escopo global com os demais ui_*.js;
   a ORDEM de carga em index.html importa (veja a lista de <script>). */
(function(){const R=BearingRegistro,A=BearingAuditoria,e=i=>document.getElementById(i);let st=null;try{st=localStorage}catch(x){}
const mem={g:{},getItem(k){return k in this.g?this.g[k]:null},setItem(k,v){this.g[k]=v}};const arm=st||mem;
function ui(m){const n=R.carregar(arm).length;e("rg_st").textContent=(m?m+" ":"")+n+" de "+R.MAX+" situações no histórico."+(st?"":" (armazenamento do navegador indisponível: vale só até fechar a página)");["rg_csv","rg_json","rg_clr"].forEach(i=>e(i).disabled=!n)}
e("rg_add").onclick=()=>{if(view==="quiz"&&!Q.ans){ui("No Quiz, responda antes de registrar (o diagnóstico revelaria a resposta).");return}R.adicionar(arm,R.registro(S,D,B,A));ui("Registrado.")};
e("rg_csv").onclick=()=>R.baixar("bancada_rolamentos_historico.csv",R.csv(R.carregar(arm)),"text/csv;charset=utf-8");
e("rg_json").onclick=()=>R.baixar("bancada_rolamentos_historico.json",R.json(R.carregar(arm)),"application/json");
e("rg_clr").onclick=()=>{if(confirm("Apagar o histórico deste navegador?")){try{arm.setItem(R.CHAVE,"[]")}catch(x){}ui("Histórico apagado.")}};ui("")})();
