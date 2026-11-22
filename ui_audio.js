/* ui_audio.js: som estilizado: carregar e parar o audio.
   Parte do antigo index.html (separado na v24). Script classico: compartilha o escopo global com os demais ui_*.js;
   a ORDEM de carga em index.html importa (veja a lista de <script>). */
/* --- áudio (sonificação didática: o sinal sintético a 25,6 kHz tocado em loop) --- */
function audioLoad(){if(SRC){try{SRC.stop()}catch(e){}}const y=BearingAudio.render(S,{seed:1}),b=AC.createBuffer(1,y.length,BearingAudio.FSA);b.getChannelData(0).set(y);SRC=AC.createBufferSource();SRC.buffer=b;SRC.loop=true;const g=AC.createGain();g.gain.value=0.7;SRC.connect(g);g.connect(AC.destination);SRC.start()}
function audioStop(){if(SRC){try{SRC.stop()}catch(e){}SRC=null}$("aud").textContent="🔊 Ouvir (som estilizado)"}
