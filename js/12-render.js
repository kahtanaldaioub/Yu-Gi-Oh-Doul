/* ============================================================
   RENDER — field, hand, LP, controls
============================================================ */
function showCardPreview(card, e, inDeck, owned){
  const preview = document.getElementById('cardPreview');
  if(!preview) return;
  const img = preview.querySelector('img');
  const name = preview.querySelector('.cp-name');
  const atk = preview.querySelector('.cp-stats .atk');
  const def = preview.querySelector('.cp-stats .def');
  const ownedEl = preview.querySelector('.cp-owned');
  if(img) { img.src = card.img; img.alt = card.name; }
  if(name) name.textContent = card.name;
  if(atk) atk.textContent = '⚔ ATK ' + card.atk;
  if(def) def.textContent = '🛡 DEF ' + card.def;
  if(ownedEl) {
    if(typeof inDeck === 'number' && typeof owned === 'number'){
      ownedEl.textContent = `Owned ${owned} · In Deck ${inDeck}`;
      ownedEl.style.display = '';
    } else {
      ownedEl.textContent = '';
      ownedEl.style.display = 'none';
    }
  }
  preview.classList.add('show', 'visible');
  positionCardPreview(e);
}

function positionCardPreview(e){
  const preview = document.getElementById('cardPreview');
  if(!preview) return;
  const W = preview.offsetWidth || 232;
  const H = preview.offsetHeight || 380;
  const gap = 22;
  let x = e.clientX + gap;
  let y = e.clientY - H / 2;
  if(x + W > innerWidth - 10) x = e.clientX - W - gap;
  if(y < 10) y = 10;
  if(y + H > innerHeight - 10) y = innerHeight - H - 10;
  preview.style.left = x + 'px';
  preview.style.top  = y + 'px';
}

function hideCardPreview(){
  const preview = document.getElementById('cardPreview');
  if(preview){
    preview.classList.remove('show', 'visible');
  }
}

function makeCardEl(cardData, position, opts = {}){
  const el = document.createElement('div');
  let cls = 'card';
  if(opts.hand) cls += ' hand';
  else cls += ' ' + (position === 'def' ? 'defense' : 'attack');
  if(opts.noAnim) cls += ' no-anim';
  el.className = cls;

  const img = document.createElement('img');
  img.src = cardData.img; img.alt = cardData.name;
  img.loading = 'lazy'; img.draggable = false;

  const name = document.createElement('div');
  name.className = 'cname'; name.textContent = cardData.name; name.title = cardData.name;

  const stats = document.createElement('div');
  stats.className = 'cstats';
  stats.innerHTML = `<span class="atk">ATK ${cardData.atk}</span><span class="def">DEF ${cardData.def}</span>`;

  el.append(img, name, stats);
  if(position === 'def' && !opts.hand){
    const badge = document.createElement('div');
    badge.className = 'badge'; badge.textContent = 'D';
    el.appendChild(badge);
  }

  /* ===== Hover preview (only fires when enabled) ===== */
  el.addEventListener('mouseenter', (e) => {
    if(!hoverPreviewEnabled) return;
    if(e.buttons) return;              // skip while dragging
    showCardPreview(cardData, e);
  });
  el.addEventListener('mousemove', (e) => {
    if(!hoverPreviewEnabled) return;
    positionCardPreview(e);
  });
  el.addEventListener('mouseleave', hideCardPreview);

  return el;
}

function makeSlot(monster, idx, side){
  const slot = document.createElement('div');
  slot.className = 'monster-slot';
  slot.dataset.idx = idx; slot.dataset.side = side;

  if(monster){
    const isNew = !renderedMonsterIds.has(monster.id);
    if(isNew) renderedMonsterIds.add(monster.id);
    const cardEl = makeCardEl(monster.card, monster.position, { noAnim: !isNew });
    cardEl.dataset.monsterId = monster.id;

    if(side === 'player'){
      if(S.selectedHandIdx >= 0 && S.phase === 'main' && !S.busy){
        cardEl.classList.add('replace-hint');
        cardEl.addEventListener('click', (e) => { e.stopPropagation(); onReplaceMonster(idx); });
      } else {
        if(S.selectedAttackerId === monster.id) cardEl.classList.add('selected-attacker');
        cardEl.addEventListener('click', (e) => { e.stopPropagation(); onPlayerMonsterClick(monster.id); });
      }
    } else {
      if(S.awaitingTarget){
        cardEl.classList.add('targetable');
        cardEl.addEventListener('click', (e) => { e.stopPropagation(); onTargetSelected(monster.id); });
      }
    }
    slot.appendChild(cardEl);
  } else {
    const empty = document.createElement('div');
    empty.className = 'slot-empty'; empty.textContent = '◇';
    slot.appendChild(empty);
    if(side === 'player' && S.selectedHandIdx >= 0 && S.phase === 'main'){
      slot.classList.add('empty-slot-target');
    }
  }
  return slot;
}

function renderField(){
  dom.oppGrid.innerHTML = '';
  for(let i = 0; i < FIELD_SLOTS; i++) dom.oppGrid.appendChild(makeSlot(S.oppField[i], i, 'opp'));
  dom.playerGrid.innerHTML = '';
  for(let i = 0; i < FIELD_SLOTS; i++) dom.playerGrid.appendChild(makeSlot(S.playerField[i], i, 'player'));
  if(dom.oppLabel){
    const oppAlive = S.oppField.filter(m => m).length;
    dom.oppLabel.textContent = `Anubis's Field · Monsters: ${oppAlive}/3`;
  }
}

function renderHand(){
  dom.handCards.innerHTML = '';
  if(S.playerHand.length === 0){
    const e = document.createElement('div');
    e.className = 'hand-empty'; e.textContent = 'No cards in hand';
    dom.handCards.appendChild(e); return;
  }
  S.playerHand.forEach((c, idx) => {
    const el = makeCardEl(c, 'atk', {hand:true});
    if(idx === S.selectedHandIdx) el.classList.add('selected');
    el.addEventListener('click', () => selectHandCard(idx));
    dom.handCards.appendChild(el);
  });
}

function renderLP(flashSide){
  const pPct = Math.max(0, S.playerLP) / START_LP * 100;
  const oPct = Math.max(0, S.oppLP) / START_LP * 100;
  dom.playerLPFill.style.width = pPct + '%';
  dom.oppLPFill.style.width = oPct + '%';
  dom.playerLPFill.classList.toggle('low', pPct <= 30);
  dom.oppLPFill.classList.toggle('low', oPct <= 30);
  dom.playerLPText.textContent = Math.max(0, S.playerLP);
  dom.oppLPText.textContent = Math.max(0, S.oppLP);
  if(flashSide === 'player'){
    dom.playerLPBar.classList.remove('flash-hit'); void dom.playerLPBar.offsetWidth;
    dom.playerLPBar.classList.add('flash-hit');
    dom.playerLPText.classList.remove('lp-hit'); void dom.playerLPText.offsetWidth;
    dom.playerLPText.classList.add('lp-hit');
  }else if(flashSide === 'opp'){
    dom.oppLPBar.classList.remove('flash-hit'); void dom.oppLPBar.offsetWidth;
    dom.oppLPBar.classList.add('flash-hit');
    dom.oppLPText.classList.remove('lp-hit'); void dom.oppLPText.offsetWidth;
    dom.oppLPText.classList.add('lp-hit');
  }
}

function renderGY(){
  dom.playerGYCount.textContent = S.playerGraveyard.length;
  dom.oppGYCount.textContent = S.oppGraveyard.length;
}

function renderSideInfo(){
  const oppTotal = S.oppDeck.length + S.oppHand.length + S.oppGraveyard.length;
  const playerTotal = S.playerDeck.length + S.playerHand.length + S.playerGraveyard.length;
  dom.oppDeckInfo.querySelector('span').textContent = `Deck: ${S.oppDeck.length} / ${oppTotal}`;
  dom.oppHandInfo.querySelector('span').textContent = `Hand: ${S.oppHand.length}`;
  dom.playerDeckInfo.querySelector('span').textContent = `Deck: ${S.playerDeck.length} / ${playerTotal}`;
  dom.playerHandInfo.querySelector('span').textContent = `Hand: ${S.playerHand.length}`;
}

function mkBtn(label, cls, onClick, disabled){
  const b = document.createElement('button');
  b.className = 'btn' + (cls ? ' ' + cls : '');
  b.textContent = label;
  if(disabled) b.disabled = true;
  if(onClick) b.addEventListener('click', onClick);
  return b;
}

function renderControls(){
  dom.controls.innerHTML = '';
  if(S.over) return;
  if(S.turn !== 'player' || S.busy){
    dom.controls.appendChild(mkBtn('Anubis is scheming…', '', null, true));
    return;
  }
  if(S.awaitingTarget){
    dom.controls.appendChild(mkBtn('✕ Cancel Attack', 'danger', () => {
      S.awaitingTarget = false; render(); setStatus('Attack cancelled.');
    }));
    return;
  }
  if(S.selectedHandIdx >= 0 && S.phase === 'main'){
    const canSummon = S.summonsThisTurn < MAX_SUMMONS_PER_TURN;
    const hasEmptySlot = S.playerField.some(m => m === null);
    if(!canSummon){
      dom.controls.appendChild(mkBtn(`Summon limit reached (${MAX_SUMMONS_PER_TURN}/turn)`, '', null, true));
    }else{
      if(hasEmptySlot){
        dom.controls.appendChild(mkBtn('⚔ Summon ATK', 'primary', () => summon('atk')));
        dom.controls.appendChild(mkBtn('🛡 Summon DEF', '', () => summon('def')));
      }
      const hasMonsters = S.playerField.some(m => m);
      if(hasMonsters){
        const hintBtn = mkBtn('♻ Replace (click a monster)', 'grave', null, true);
        hintBtn.style.fontSize = '.6rem';
        hintBtn.style.opacity = '.8';
        dom.controls.appendChild(hintBtn);
      }
    }
  }
  const attacker = S.playerField.find(m => m && m.id === S.selectedAttackerId);
  if(attacker && S.phase === 'main' && !S.awaitingTarget){
    const newPos = attacker.position === 'atk' ? 'def' : 'atk';
    const canSwitch = !attacker.hasAttacked;
    dom.controls.appendChild(mkBtn(`↻ Switch to ${newPos === 'atk' ? 'ATK' : 'DEF'}`, '', changePosition, !canSwitch));
    dom.controls.appendChild(mkBtn('⚰ Discard to GY', 'grave', () => discardSelectedMonster()));
    if(attacker.position === 'atk'){
      const attacksOn = S.currentRound >= 2;
      const canAttack = !attacker.hasAttacked && attacksOn;
      const oppHasMonsters = S.oppField.some(m => m);
      const label = oppHasMonsters ? '⚔ Attack!' : '⚔ Direct Attack!';
      let reason = '';
      if(!attacksOn) reason = ' (Round 1)';
      else if(attacker.hasAttacked) reason = ' (used)';
      dom.controls.appendChild(mkBtn(label + reason, 'primary', playerStartAttack, !canAttack));
    }
  }
  if(S.phase === 'main'){
    dom.controls.appendChild(mkBtn('End Turn →', 'danger', endPlayerTurn));
  }
}

function render(){
  renderField(); renderHand(); renderLP(); renderGY(); renderSideInfo(); renderControls();
}