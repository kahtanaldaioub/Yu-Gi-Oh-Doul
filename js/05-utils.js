/* ============================================================
   UTILS — general helpers
============================================================ */
const wait = ms => new Promise(r => setTimeout(r, ms));

function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function setStatus(text, kind){
  dom.status.textContent = text;
  dom.status.classList.toggle('round-warn', kind === 'warn');
  dom.status.classList.toggle('grave-msg', kind === 'grave');
  dom.status.classList.remove('pop');
  void dom.status.offsetWidth;
  dom.status.classList.add('pop');
}

function floatDamage(text, color, anchorEl){
  const r = anchorEl ? anchorEl.getBoundingClientRect()
    : {left:innerWidth/2, top:innerHeight/2, width:0, height:0};
  const el = document.createElement('div');
  el.className = 'floatDmg';
  el.textContent = text;
  el.style.color = color;
  el.style.left = (r.left + r.width/2) + 'px';
  el.style.top  = (r.top + r.height/2) + 'px';
  el.style.transform = 'translate(-50%,-50%)';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 1350);
}

function spawnParticles(x, y, count, color, spread=120){
  if(!settings.particles) return;   /* NEW */
  for(let i = 0; i < count; i++){
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * spread;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.setProperty('--px', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--py', Math.sin(angle) * dist + 'px');
    p.style.background = `radial-gradient(circle, ${color}, transparent 70%)`;
    p.style.boxShadow = `0 0 12px ${color}`;
    p.style.animationDuration = (0.7 + Math.random() * 0.6) + 's';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1400);
  }
}

function screenShake(){
  if(!settings.screenShake) return; 
  document.body.classList.add('shake');
  setTimeout(() => document.body.classList.remove('shake'), 500);
}

function flashRed(){
  if(!settings.particles) return;  
  const f = document.createElement('div');
  f.className = 'flash-red';
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 700);
}

function spawnSummonRing(x, y){
   if(!settings.particles) return;  
  const ring = document.createElement('div');
  ring.className = 'summon-ring';
  ring.style.left = x + 'px';
  ring.style.top = y + 'px';
  ring.style.transform = 'translate(-50%,-50%)';
  document.body.appendChild(ring);
  setTimeout(() => ring.remove(), 950);
}

function showScreen(name){
  ['loadingScreen','mainMenu','deckBuilder','packScreen','duelScreen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const t = document.getElementById(name);
  if(t) t.classList.add('active');
}