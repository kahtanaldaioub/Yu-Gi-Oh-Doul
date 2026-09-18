/* ============================================================
   DECK BUILDER
============================================================ */
function openDeckBuilder(){
  renderDeckBuilder();
  showScreen('deckBuilder');
}

function deckQty(id){ return save.deck.filter(x => x === id).length; }

function renderDeckBuilder(){
  const ownedIds = Object.keys(save.collection).map(Number);
  const totalCopies = Object.values(save.collection).reduce((a,b)=>a+b,0);
  dom.dbDeckCount.textContent = `${save.deck.length} / ${MAX_DECK}`;
  dom.dbDeckCount.classList.remove('warn','ok');
  if(save.deck.length < MIN_DECK) dom.dbDeckCount.classList.add('warn');
  else if(save.deck.length >= 20) dom.dbDeckCount.classList.add('ok');
  dom.dbCollCount.textContent = `${totalCopies} cards · ${ownedIds.length} unique`;

  /* Deck list */
  dom.deckList.innerHTML = '';
  if(save.deck.length === 0){
    const e = document.createElement('div');
    e.className = 'deck-empty';
    e.textContent = 'Your deck is empty — click cards below to add them.';
    dom.deckList.appendChild(e);
  }else{
    const sortedDeckIds = [...save.deck].sort((a,b) => {
      const ca = getCard(a), cb = getCard(b);
      return (cb?.atk || 0) - (ca?.atk || 0);
    });
    for(const id of sortedDeckIds){
      const c = getCard(id); if(!c) continue;
      const el = document.createElement('div');
      el.className = 'deck-mini';
      el.title = `${c.name} — click to remove`;
      el.innerHTML = `
        <img src="${c.img}" alt="${c.name}" loading="lazy">
        <div class="dm-atk">⚔ ${c.atk}</div>
      `;
      const owned = save.collection[id] || 0;
      const inDeck = deckQty(id);
      el.addEventListener('mouseenter', (e) => showCardPreview(c, e, inDeck, owned));
      el.addEventListener('mousemove', positionCardPreview);
      el.addEventListener('mouseleave', hideCardPreview);
      el.addEventListener('click', () => {
        sfx('click'); hideCardPreview();
        const idx = save.deck.indexOf(id);
        if(idx >= 0){ save.deck.splice(idx, 1); saveGame(); renderDeckBuilder(); }
      });
      dom.deckList.appendChild(el);
    }
  }

  /* Collection */
  dom.collectionGrid.innerHTML = '';
  let filtered = ownedIds.filter(id => {
    const c = getCard(id);
    if(!c) return false;
    if(dbSearchQuery && !c.name.toLowerCase().includes(dbSearchQuery)) return false;
    return true;
  });

  filtered.sort((a,b) => {
    const ca = getCard(a), cb = getCard(b);
    if(!ca || !cb) return 0;
    switch(dbSortMode){
      case 'atk-asc':    return ca.atk - cb.atk;
      case 'atk-desc':   return cb.atk - ca.atk;
      case 'def-desc':   return cb.def - ca.def;
      case 'name-asc':   return ca.name.localeCompare(cb.name);
      case 'owned-desc': return (save.collection[b]||0) - (save.collection[a]||0);
      default:           return cb.atk - ca.atk;
    }
  });

  if(filtered.length === 0){
    const e = document.createElement('div');
    e.className = 'deck-empty';
    e.style.gridColumn = '1 / -1';
    e.textContent = dbSearchQuery
      ? `No cards match "${dbSearchQuery}"`
      : 'No cards in your collection yet. Open a pack to get started!';
    dom.collectionGrid.appendChild(e);
  }

  for(const id of filtered){
    const c = getCard(id); if(!c) continue;
    const owned = save.collection[id] || 0;
    const inDeck = deckQty(id);
    const canAdd = inDeck < owned && save.deck.length < MAX_DECK;
    const el = document.createElement('div');
    el.className = 'coll-card';
    if(inDeck > 0) el.classList.add('in-deck');
    if(!canAdd) el.classList.add('disabled');

    let addLabel;
    if(save.deck.length >= MAX_DECK) addLabel = 'Deck Full';
    else if(inDeck >= owned) addLabel = 'In Deck';
    else addLabel = '+ Add';

    el.innerHTML = `
      <img src="${c.img}" alt="${c.name}" loading="lazy">
      <div class="coll-badge ${inDeck >= owned ? 'full' : ''}">${inDeck}/${owned}</div>
      <div class="coll-add">${addLabel}</div>
    `;

    el.addEventListener('mouseenter', (e) => showCardPreview(c, e, inDeck, owned));
    el.addEventListener('mousemove', positionCardPreview);
    el.addEventListener('mouseleave', hideCardPreview);

    if(canAdd){
      el.addEventListener('click', () => {
        sfx('click'); hideCardPreview();
        save.deck.push(id); saveGame(); renderDeckBuilder();
      });
    }
    dom.collectionGrid.appendChild(el);
  }
}

/* Floating card preview */
function showCardPreview(card, e, inDeck, owned){
  if(!dom.cardPreview) return;
  dom.cardPreview.querySelector('img').src = card.img;
  dom.cardPreview.querySelector('img').alt = card.name;
  dom.cardPreview.querySelector('.cp-name').textContent = card.name;
  dom.cardPreview.querySelector('.cp-stats .atk').textContent = '⚔ ATK ' + card.atk;
  dom.cardPreview.querySelector('.cp-stats .def').textContent = '🛡 DEF ' + card.def;
  const ownedEl = dom.cardPreview.querySelector('.cp-owned');
  if(typeof inDeck === 'number' && typeof owned === 'number'){
    ownedEl.textContent = `Owned ${owned} · In Deck ${inDeck}`;
    ownedEl.style.display = '';
  } else {
    ownedEl.textContent = '';
    ownedEl.style.display = 'none';
  }
  dom.cardPreview.classList.add('show', 'visible');
  positionCardPreview(e);
}
function positionCardPreview(e){
  if(!dom.cardPreview) return;
  const W = dom.cardPreview.offsetWidth || 232;
  const H = dom.cardPreview.offsetHeight || 380;
  const gap = 22;
  let x = e.clientX + gap;
  let y = e.clientY - H / 2;
  if(x + W > innerWidth - 10) x = e.clientX - W - gap;
  if(y < 10) y = 10;
  if(y + H > innerHeight - 10) y = innerHeight - H - 10;
  dom.cardPreview.style.left = x + 'px';
  dom.cardPreview.style.top  = y + 'px';
}
function hideCardPreview(){
  if(dom.cardPreview) dom.cardPreview.classList.remove('show', 'visible');
}

dom.dbSearch.addEventListener('input', (e) => {
  dbSearchQuery = e.target.value.toLowerCase().trim();
  renderDeckBuilder();
});
dom.dbSort.addEventListener('change', (e) => {
  dbSortMode = e.target.value;
  renderDeckBuilder();
});
dom.dbClear.addEventListener('click', () => {
  if(save.deck.length === 0) return;
  if(confirm('Empty your deck?')){ save.deck = []; saveGame(); renderDeckBuilder(); }
});
dom.dbDone.addEventListener('click', () => {
  sfx('click'); hideCardPreview(); updateMenuUI(); location.href = 'index.html';
});

function applyHoverPreviewState(){
  if(typeof applyHoverPreviewSetting === 'function') applyHoverPreviewSetting();
  
}

function toggleHoverPreview(){
  setSetting('hoverPreview', !settings.hoverPreview);
  sfx('click');
}
/* Wire up the toggle button (only exists in the duel screen) */
if(dom.hoverToggle){
  dom.hoverToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleHoverPreview();
  });
}

/* Optional: press "H" to toggle (only when duel is active) */
document.addEventListener('keydown', (e) => {
  if(e.key === 'h' || e.key === 'H'){
    if(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const duelScreen = document.getElementById('duelScreen');
    if(duelScreen && duelScreen.classList.contains('active')){
      toggleHoverPreview();
    }
  }
});