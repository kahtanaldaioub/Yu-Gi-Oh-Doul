/* ============================================================
   PACK OPENING
============================================================ */
function positionPackPreview(e){
  const preview = document.getElementById('cardPreview');
  if(!preview) return;
  const W = preview.offsetWidth || 232;
  const H = preview.offsetHeight || 360;
  const gap = 22;
  let x = e.clientX + gap;
  let y = e.clientY - H / 2;
  if(x + W > innerWidth - 12) x = e.clientX - W - gap;
  if(y < 12) y = 12;
  if(y + H > innerHeight - 12) y = innerHeight - H - 12;
  preview.style.left = x + 'px';
  preview.style.top = y + 'px';
}

function showPackCardPreview(card, e){
  if(!hoverPreviewEnabled) return;
  const preview = document.getElementById('cardPreview');
  if(!preview) return;
  const img = preview.querySelector('img');
  const name = preview.querySelector('.cp-name');
  const atk = preview.querySelector('.cp-stats .atk');
  const def = preview.querySelector('.cp-stats .def');
  const ownedEl = preview.querySelector('.cp-owned');
  if(img){ img.src = card.img; img.alt = card.name; }
  if(name) name.textContent = card.name;
  if(atk) atk.textContent = '⚔ ATK ' + card.atk;
  if(def) def.textContent = '🛡 DEF ' + card.def;
  if(ownedEl){
    const owned = save.collection[card.id] || 0;
    ownedEl.textContent = `Owned ${owned}`;
    ownedEl.style.display = '';
  }
  preview.classList.add('show', 'visible');
  positionPackPreview(e);
}

function hidePackCardPreview(){
  const preview = document.getElementById('cardPreview');
  if(preview) preview.classList.remove('show', 'visible');
}

function openPackScreen(){
  if(save.packs <= 0){
    dom.packIntro.textContent = 'You have no packs. Win duels to earn packs!';
    dom.packCards.innerHTML = '';
    dom.pkDone.style.display = 'none';
    showScreen('packScreen');
    return;
  }
  const pack = drawPackFromPool(CARDS_PER_PACK);
  packState.cards = pack; packState.revealed = 0;
  save.packs -= 1; saveGame(); updateMenuUI();
  dom.packCards.innerHTML = ''; dom.pkDone.style.display = 'none';
  dom.packIntro.innerHTML = `Tap each card to reveal it. <b>${save.packs} pack${save.packs===1?'':'s'} remaining</b>.`;
  pack.forEach((c) => {
    const slot = document.createElement('div');
    slot.className = 'pack-card-slot';
    slot.innerHTML = `
      <div class="pack-card-inner">
        <div class="pack-card-face pack-card-back">
          <svg viewBox="0 0 100 60" style="color:var(--gold-light)"><use href="#eye-wdjat"/></svg>
        </div>
        <div class="pack-card-face pack-card-front">
          <img src="${c.img}" alt="${c.name}" loading="lazy">
          <div class="pname">${c.name}</div>
          <div class="pstats"><span class="atk">ATK ${c.atk}</span><span class="def">DEF ${c.def}</span></div>
        </div>
      </div>
    `;
    slot.addEventListener('mouseenter', (e) => {
      if(!hoverPreviewEnabled) return;
      showPackCardPreview(c, e);
    });
    slot.addEventListener('mousemove', (e) => {
      if(!hoverPreviewEnabled) return;
      positionPackPreview(e);
    });
    slot.addEventListener('mouseleave', hidePackCardPreview);
    slot.addEventListener('click', () => {
      if(slot.classList.contains('revealed')) return;
      slot.classList.add('revealed');
      hidePackCardPreview();
      sfx('flip');
      packState.revealed++;
      const isNew = !save.collection[c.id];
      if(isNew){
        const badge = document.createElement('div');
        badge.className = 'new-badge';
        badge.textContent = 'NEW!';
        slot.appendChild(badge);
        setTimeout(()=>sfx('reveal'), 250);
      }
      save.collection[c.id] = (save.collection[c.id] || 0) + 1;
      saveGame();
      if(packState.revealed >= pack.length){
        setTimeout(() => {
          dom.pkDone.style.display = '';
          dom.packIntro.innerHTML = `All revealed! Cards added to your collection. <b>${save.packs} pack${save.packs===1?'':'s'} remaining</b>.`;
        }, 400);
      }
    });
    dom.packCards.appendChild(slot);
  });
  showScreen('packScreen');
}

function drawPackFromPool(count){
  const commons = pool.filter(c => c.atk < 1500);
  const rares = pool.filter(c => c.atk >= 1500 && c.atk < 2500);
  const supers = pool.filter(c => c.atk >= 2500);
  const picks = [];
  for(let i = 0; i < count; i++){
    const r = Math.random();
    let source;
    if(r < 0.60 && commons.length) source = commons;
    else if(r < 0.90 && rares.length) source = rares;
    else if(supers.length) source = supers;
    else source = pool;
    picks.push(source[Math.floor(Math.random()*source.length)]);
  }
  return picks;
}

dom.pkDone.addEventListener('click', () => { sfx('click'); updateMenuUI(); location.href = 'index.html'; });
dom.pkBack.addEventListener('click', () => { sfx('click'); updateMenuUI(); location.href = 'index.html'; });