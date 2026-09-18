/* ============================================================
   AUDIO — synthesized ambient + SFX
============================================================ */
let audioCtx = null;
let ambientNodes = null;
let masterGain = null;
let sfxGain = null;
let ambientBusGain = null;

function initAudio(){
  if(audioCtx){
    if(audioCtx.state === 'suspended'){
      audioCtx.resume().catch(()=>{});
    }
    return;
  }
  try{
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);

    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 0.85;
    sfxGain.connect(masterGain);

    ambientBusGain = audioCtx.createGain();
    ambientBusGain.gain.value = 0.75;
    ambientBusGain.connect(masterGain);

    /* Pick up whatever the user has already saved */
    if(typeof applyVolumeSettings === 'function') applyVolumeSettings();
  }catch(e){
    console.warn('[audio] init failed:', e);
  }
}
function startAmbient(){
  if(!audioCtx || ambientNodes) return;
  const now = audioCtx.currentTime;

  const ambientGain = audioCtx.createGain();
  ambientGain.gain.value = 0;
  ambientGain.connect(ambientBusGain); 
  ambientGain.gain.linearRampToValueAtTime(0.14, now + 5);

  const delay = audioCtx.createDelay(1.0);
  delay.delayTime.value = 0.44;
  const fb = audioCtx.createGain(); fb.gain.value = 0.48;
  const damp = audioCtx.createBiquadFilter();
  damp.type = 'lowpass'; damp.frequency.value = 2200; damp.Q.value = 0.7;
  const wet = audioCtx.createGain(); wet.gain.value = 0.4;
  delay.connect(damp); damp.connect(fb); fb.connect(delay);
  damp.connect(wet); wet.connect(ambientGain);

  const droneOsc1 = audioCtx.createOscillator();
  droneOsc1.type = 'sine'; droneOsc1.frequency.value = 55;
  const droneOsc2 = audioCtx.createOscillator();
  droneOsc2.type = 'sine'; droneOsc2.frequency.value = 55.35;
  const droneGain = audioCtx.createGain(); droneGain.gain.value = 0.55;
  droneOsc1.connect(droneGain); droneOsc2.connect(droneGain);
  droneGain.connect(ambientGain);
  droneGain.connect(delay);

  const padFreqs = [110, 130.81, 164.81];
  const padGain = audioCtx.createGain(); padGain.gain.value = 0.055;
  padGain.connect(ambientGain);
  padGain.connect(delay);
  const padOscs = [];
  padFreqs.forEach((f, i) => {
    const o = audioCtx.createOscillator();
    o.type = 'triangle'; o.frequency.value = f;
    o.detune.value = (i - 1) * 4;
    const g = audioCtx.createGain(); g.gain.value = 0.33;
    o.connect(g); g.connect(padGain);
    o.start(); padOscs.push(o);
  });
  const breathLfo = audioCtx.createOscillator();
  breathLfo.type = 'sine'; breathLfo.frequency.value = 0.07;
  const breathGain = audioCtx.createGain(); breathGain.gain.value = 0.035;
  breathLfo.connect(breathGain); breathGain.connect(padGain.gain);
  breathLfo.start();

  const bufSize = audioCtx.sampleRate * 6;
  const noiseBuf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  let b0=0, b1=0, b2=0;
  for(let i = 0; i < bufSize; i++){
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.0990460;
    b1 = 0.96300 * b1 + w * 0.2965164;
    b2 = 0.57000 * b2 + w * 1.0526913;
    nd[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12;
  }
  const noiseSrc = audioCtx.createBufferSource();
  noiseSrc.buffer = noiseBuf; noiseSrc.loop = true;
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'lowpass'; noiseFilter.frequency.value = 260; noiseFilter.Q.value = 1.4;
  const noiseGain = audioCtx.createGain(); noiseGain.gain.value = 0.5;
  noiseSrc.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(ambientGain);
  const windLfo = audioCtx.createOscillator();
  windLfo.type = 'sine'; windLfo.frequency.value = 0.05;
  const windLfoGain = audioCtx.createGain(); windLfoGain.gain.value = 140;
  windLfo.connect(windLfoGain); windLfoGain.connect(noiseFilter.frequency);
  windLfo.start();

  const drumInterval = setInterval(() => {
    if(!audioCtx || !ambientNodes) return;
    const t = audioCtx.currentTime;
    [0, 0.42].forEach((offset, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(72, t + offset);
      o.frequency.exponentialRampToValueAtTime(36, t + offset + 0.4);
      g.gain.setValueAtTime(0, t + offset);
      g.gain.linearRampToValueAtTime(i === 0 ? 0.22 : 0.13, t + offset + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.65);
      o.connect(g); g.connect(ambientGain);
      try{ g.connect(delay); }catch(e){}
      o.start(t + offset); o.stop(t + offset + 0.75);
    });
  }, 5200);

  const chimeNotes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];
  const chimeInterval = setInterval(() => {
    if(!audioCtx || !ambientNodes) return;
    if(Math.random() > 0.6) return;
    const t = audioCtx.currentTime + Math.random() * 0.6;
    const freq = chimeNotes[Math.floor(Math.random() * chimeNotes.length)];
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    o.detune.value = (Math.random() - 0.5) * 12;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.045, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
    o.connect(g); g.connect(ambientGain);
    try{ g.connect(delay); }catch(e){}
    o.start(t); o.stop(t + 3.7);
  }, 3500);

  droneOsc1.start(); droneOsc2.start(); noiseSrc.start();

  ambientNodes = {
    oscillators: [droneOsc1, droneOsc2, ...padOscs, breathLfo, windLfo],
    sources: [noiseSrc],
    ambientGain, drumInterval, chimeInterval
  };
}

function stopAmbient(){
  if(!ambientNodes) return;
  const now = audioCtx.currentTime;
  ambientNodes.ambientGain.gain.linearRampToValueAtTime(0, now + 1);
  clearInterval(ambientNodes.drumInterval);
  clearInterval(ambientNodes.chimeInterval);
  const snap = ambientNodes;
  setTimeout(() => {
    try{
      snap.oscillators.forEach(o => { try{ o.stop(); }catch(e){} });
      snap.sources.forEach(s => { try{ s.stop(); }catch(e){} });
    }catch(e){}
    ambientNodes = null;
  }, 1300);
}

function playTone(freq, dur, type='sine', vol=0.08, delay=0){
  if(!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(sfxGain);             
  const t = audioCtx.currentTime + delay;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.05);
}

function playNoise(dur, vol, filterFreq, delay=0){
  if(!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * dur;
  const buf = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for(let i = 0; i < bufferSize; i++){
    const env = 1 - (i / bufferSize);
    data[i] = (Math.random()*2-1) * env;
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = filterFreq;
  const g = audioCtx.createGain(); g.gain.value = vol;
  src.connect(filter); filter.connect(g); g.connect(sfxGain);  
  const t = audioCtx.currentTime + delay;
  src.start(t);
}
function sfx(kind){
  if(!audioCtx) return;
  switch(kind){
    case 'draw': playNoise(0.25,0.18,3000); playTone(880,0.15,'sine',0.06); playTone(1320,0.12,'sine',0.04,0.05); break;
    case 'summon': playTone(330,0.15,'triangle',0.08); playTone(440,0.18,'triangle',0.08,0.08); playTone(660,0.3,'triangle',0.10,0.16); playTone(880,0.4,'sine',0.07,0.24); playNoise(0.5,0.15,2000); break;
    case 'attack': playNoise(0.15,0.25,6000); playTone(220,0.2,'sawtooth',0.10); playTone(110,0.3,'square',0.08,0.05); break;
    case 'damage': playTone(80,0.5,'sawtooth',0.15); playTone(60,0.7,'square',0.1,0.05); playNoise(0.4,0.3,800); break;
    case 'destroy': playNoise(0.4,0.3,3000); playTone(200,0.3,'sawtooth',0.12); playTone(100,0.5,'sawtooth',0.10,0.1); break;
    case 'grave': playTone(180,0.3,'triangle',0.08); playTone(120,0.5,'triangle',0.06,0.12); break;
    case 'recycle': playTone(400,0.1); playTone(600,0.1,'sine',0.08,0.08); playTone(800,0.14,'sine',0.08,0.16); playTone(1100,0.2,'sine',0.06,0.24); break;
    case 'flip': playTone(1200,0.08,'sine',0.06); playTone(1600,0.1,'sine',0.05,0.05); break;
    case 'reveal': playTone(660,0.1); playTone(990,0.12,'sine',0.07,0.08); playTone(1320,0.2,'sine',0.06,0.16); break;
    case 'win': [523,659,784,1047].forEach((f,i)=>playTone(f,0.25,'triangle',0.10,i*0.14)); playTone(1319,0.6,'sine',0.08,0.6); break;
    case 'lose': playTone(300,0.3,'sawtooth',0.10); playTone(240,0.4,'sawtooth',0.09,0.18); playTone(180,0.7,'sawtooth',0.08,0.4); break;
    case 'click': playTone(880,0.05,'sine',0.05); break;
    case 'hover': playTone(1200,0.03,'sine',0.02); break;
  }
}