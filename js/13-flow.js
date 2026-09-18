/* ============================================================
   DUEL FLOW — turn logic, summoning, attacking
============================================================ */
function pushToGraveyard(side, card){
  if(!card) return;
  if(side === 'player') S.playerGraveyard.push(card);
  else S.oppGraveyard.push(card);
}

function drawFromDeck(side){
  const deck = side === 'player' ? S.playerDeck : S.oppDeck;
  const gy = side === 'player' ? S.playerGraveyard : S.oppGraveyard;
  if(deck.length === 0){
    if(gy.length === 0) return null;
    deck.push(...gy); shuffle(deck); gy.length = 0;
    sfx('recycle'); renderGY();
    const who = side === 'player' ? 'Your' : "Anubis's";
    setStatus(`${who} graveyard is shuffled back into the deck!`, 'grave');
    return deck.pop();
  }
  return deck.pop();
}

function startDuel(){
  S.playerLP = START_LP; S.oppLP = START_LP;
  S.playerField = new Array(FIELD_SLOTS).fill(null);
  S.oppField = new Array(FIELD_SLOTS).fill(null);
  S.playerDeck = []; S.playerHand = []; S.playerGraveyard = [];
  S.oppDeck = []; S.oppHand = []; S.oppGraveyard = [];
  S.selectedHandIdx = -1; S.selectedAttackerId = null;
  S.awaitingTarget = false; S.pendingReplaceSlot = -1;
  S.turn = 'player'; S.phase = 'idle'; S.busy = true; S.over = false;
  S.currentRound = 1; S.summonsThisTurn = 0;
  monsterIdCounter = 0;
  renderedMonsterIds.clear();

  const playerDeckCards = save.deck.map(id => getCard(id)).filter(Boolean);
  shuffle(playerDeckCards);
  S.playerDeck = [...playerDeckCards];
  S.oppDeck = buildMatchedOpponentDeck(playerDeckCards);

  dom.overlay.classList.add('hidden');
  closeGraveyardViewer();
  showScreen('duelScreen');
  render();
  setStatus('Shuffling decks…');

  setTimeout(async () => {
    for(let i = 0; i < 5; i++){
      const pc = drawFromDeck('player'); if(pc) S.playerHand.push(pc);
      const oc = drawFromDeck('opp'); if(oc) S.oppHand.push(oc);
      render(); sfx('draw'); await wait(120);
    }
    S.busy = false; await wait(300); startPlayerTurn();
  }, 500);
}

function buildMatchedOpponentDeck(playerCards){
  if(!playerCards || playerCards.length === 0) return shuffle([...pool]).slice(0, OPP_DECK_SIZE);
  const avgAtk = playerCards.reduce((a,c)=>a+c.atk, 0) / playerCards.length;
  const avgDef = playerCards.reduce((a,c)=>a+c.def, 0) / playerCards.length;
  const targetPower = (avgAtk + avgDef) / 2;
  const lowBound = Math.max(300, targetPower * 0.75);
  const highBound = targetPower * 1.25;
  let candidates = pool.filter(c => {
    const power = (c.atk + c.def) / 2;
    return power >= lowBound && power <= highBound;
  });
  if(candidates.length < OPP_DECK_SIZE){
    candidates = pool.filter(c => {
      const power = (c.atk + c.def) / 2;
      return power >= targetPower * 0.6 && power <= targetPower * 1.4;
    });
  }
  if(candidates.length < OPP_DECK_SIZE) candidates = pool;
  const shuffled = shuffle([...candidates]);
  const seen = new Set(); const picked = [];
  for(const c of shuffled){
    if(seen.has(c.id)) continue;
    seen.add(c.id); picked.push(c);
    if(picked.length >= OPP_DECK_SIZE) break;
  }
  return picked;
}

async function startPlayerTurn(){
  if(S.over) return;
  S.turn = 'player'; S.busy = false; S.phase = 'main';
  S.selectedHandIdx = -1; S.selectedAttackerId = null;
  S.awaitingTarget = false; S.pendingReplaceSlot = -1;
  S.summonsThisTurn = 0;
  S.playerField.forEach(m => { if(m) m.hasAttacked = false; });
  const drawn = S.currentRound === 1 ? null : drawFromDeck('player');
  if(drawn){ S.playerHand.push(drawn); sfx('draw'); }
  render();
  if(S.currentRound === 1){
    setStatus('Round 1 — Summon your monsters, but no attacks this round!', 'warn');
  }else{
    setStatus(drawn
      ? `Round ${S.currentRound} — summon, replace, or attack. (Deck: ${S.playerDeck.length})`
      : `Round ${S.currentRound} — (Deck: 0) — Graveyard will recycle on next draw.`);
  }
}

function selectHandCard(idx){
  if(S.phase !== 'main' || S.busy || S.over || S.awaitingTarget) return;
  S.selectedHandIdx = (S.selectedHandIdx === idx) ? -1 : idx;
  if(S.selectedHandIdx >= 0) S.selectedAttackerId = null;
  const cards = dom.handCards.querySelectorAll('.card.hand');
  cards.forEach((el, i) => el.classList.toggle('selected', i === S.selectedHandIdx));
  if(S.selectedHandIdx >= 0){
    sfx('hover');
    const c = S.playerHand[S.selectedHandIdx];
    const firstEmpty = S.playerField.findIndex(m => m === null);
    const hasMonsters = S.playerField.some(m => m);
    if(S.summonsThisTurn >= MAX_SUMMONS_PER_TURN){
      setStatus(`Selected ${c.name}. Summon limit reached (${MAX_SUMMONS_PER_TURN}/turn).`);
    }else if(firstEmpty < 0 && hasMonsters){
      setStatus(`Selected ${c.name}. Field is full — click a monster to replace it.`, 'grave');
    }else if(firstEmpty < 0){
      setStatus(`Selected ${c.name}, but no space on field.`);
    }else{
      setStatus(`Selected ${c.name}. Choose ATK/DEF, or click a field monster to replace.`);
    }
  }else{
    setStatus('Select a monster from your hand, or select a field monster to attack.');
  }
  render();
}

function summon(position){
  if(S.phase !== 'main' || S.selectedHandIdx < 0 || S.busy || S.over) return;
  if(S.summonsThisTurn >= MAX_SUMMONS_PER_TURN) return;
  const firstEmpty = S.playerField.findIndex(m => m === null);
  if(firstEmpty < 0) return;
  const card = S.playerHand[S.selectedHandIdx];
  if(!card) return;
  S.playerHand.splice(S.selectedHandIdx, 1);
  S.selectedHandIdx = -1;
  S.playerField[firstEmpty] = makeMonster(card, position);
  S.summonsThisTurn++;
  sfx('summon'); render();
  const slot = dom.playerGrid.children[firstEmpty];
  if(slot){
    const r = slot.getBoundingClientRect();
    spawnSummonRing(r.left + r.width/2, r.top + r.height/2);
    spawnParticles(r.left + r.width/2, r.top + r.height/2, 24, '#ffd766', 100);
  }
  const posName = position === 'atk' ? 'Attack' : 'Defense';
  setStatus(`Summoned ${card.name} (${posName}). Summons this turn: ${S.summonsThisTurn}/${MAX_SUMMONS_PER_TURN}.`);
}

function onReplaceMonster(slotIdx){
  if(S.phase !== 'main' || S.selectedHandIdx < 0 || S.busy || S.over) return;
  if(S.summonsThisTurn >= MAX_SUMMONS_PER_TURN){
    setStatus(`Summon limit reached (${MAX_SUMMONS_PER_TURN}/turn).`, 'warn'); return;
  }
  const oldMonster = S.playerField[slotIdx]; if(!oldMonster) return;
  const newCard = S.playerHand[S.selectedHandIdx]; if(!newCard) return;

  const oldEl = dom.playerGrid.querySelector(`.card[data-monster-id="${oldMonster.id}"]`);
  if(oldEl) oldEl.classList.add('to-grave');
  sfx('grave');

  setTimeout(() => {
    pushToGraveyard('player', oldMonster.card);
    renderedMonsterIds.delete(oldMonster.id);
    S.playerHand.splice(S.selectedHandIdx, 1);
    S.selectedHandIdx = -1;
    const newMonster = makeMonster(newCard, oldMonster.position);
    S.playerField[slotIdx] = newMonster;
    S.summonsThisTurn++;
    sfx('summon'); render();
    const slot = dom.playerGrid.children[slotIdx];
    if(slot){
      const r = slot.getBoundingClientRect();
      spawnSummonRing(r.left + r.width/2, r.top + r.height/2);
      spawnParticles(r.left + r.width/2, r.top + r.height/2, 24, '#ffd766', 100);
    }
    setStatus(`Replaced ${oldMonster.card.name} with ${newCard.name}.`, 'grave');
  }, 480);
}

function discardSelectedMonster(){
  const m = S.playerField.find(x => x && x.id === S.selectedAttackerId);
  if(!m || S.busy || S.over) return;
  const slotIdx = S.playerField.findIndex(x => x && x.id === m.id);
  const el = dom.playerGrid.querySelector(`.card[data-monster-id="${m.id}"]`);
  if(el) el.classList.add('to-grave');
  sfx('grave');
  setTimeout(() => {
    pushToGraveyard('player', m.card);
    renderedMonsterIds.delete(m.id);
    S.playerField[slotIdx] = null;
    S.selectedAttackerId = null;
    render();
    setStatus(`${m.card.name} was discarded to the graveyard.`, 'grave');
  }, 500);
}

function onPlayerMonsterClick(id){
  if(S.phase !== 'main' || S.busy || S.over || S.awaitingTarget) return;
  const m = S.playerField.find(x => x && x.id === id); if(!m) return;
  if(S.selectedAttackerId === id){
    S.selectedAttackerId = null; setStatus('Deselected.');
  }else{
    sfx('hover');
    S.selectedAttackerId = id; S.selectedHandIdx = -1;
    const canAttack = S.currentRound >= 2 && m.position === 'atk' && !m.hasAttacked;
    if(!canAttack){
      if(S.currentRound < 2) setStatus(`${m.card.name} selected. No attacks allowed in Round 1.`, 'warn');
      else if(m.hasAttacked) setStatus(`${m.card.name} already attacked. You can still Discard or Switch position.`);
      else if(m.position === 'def') setStatus(`${m.card.name} is in Defense. Switch to ATK to attack, or Discard.`);
    }else{
      const oppHasMonsters = S.oppField.some(x => x);
      setStatus(`${m.card.name} selected. ${oppHasMonsters ? 'Click Attack, then pick a target.' : 'Click Attack for a direct hit!'}`);
    }
  }
  render();
}

function changePosition(){
  const m = S.playerField.find(x => x && x.id === S.selectedAttackerId);
  if(!m || S.busy || S.over) return;
  if(m.hasAttacked) return;
  m.position = m.position === 'atk' ? 'def' : 'atk';
  sfx('click'); render();
  setStatus(`Switched ${m.card.name} to ${m.position === 'atk' ? 'Attack' : 'Defense'} position.`);
}

async function playerStartAttack(){
  if(S.busy || S.over) return;
  if(S.currentRound < 2) return;
  const attacker = S.playerField.find(x => x && x.id === S.selectedAttackerId);
  if(!attacker || attacker.position !== 'atk' || attacker.hasAttacked) return;
  const oppHasMonsters = S.oppField.some(m => m);
  if(!oppHasMonsters){ await performAttack(attacker, null); }
  else{
    S.awaitingTarget = true; render();
    setStatus('Choose an opponent monster to attack. Click a highlighted card.');
  }
}

async function onTargetSelected(targetId){
  if(!S.awaitingTarget || S.busy || S.over) return;
  const attacker = S.playerField.find(x => x && x.id === S.selectedAttackerId);
  const target = S.oppField.find(x => x && x.id === targetId);
  if(!attacker || !target) return;
  S.awaitingTarget = false;
  await performAttack(attacker, target);
}

async function performAttack(attacker, target){
  S.busy = true; attacker.hasAttacked = true; renderControls();
  const attackerEl = dom.playerGrid.querySelector(`.card[data-monster-id="${attacker.id}"]`);
  if(attackerEl){
    attackerEl.classList.add('attacking');
    sfx('attack');
    await wait(600);
    attackerEl.classList.remove('attacking');
  }
  await resolveBattle(attacker, target, 'player');
  if(S.over) return;
  S.busy = false; S.selectedAttackerId = null; render();
  const remainingAttacker = S.playerField.find(m => m && m.id === attacker.id);
  if(!remainingAttacker) setStatus('Your attacker was destroyed. Select another monster or end turn.');
  else if(remainingAttacker.position === 'atk' && !remainingAttacker.hasAttacked) setStatus('You may attack again with another monster, or end turn.');
  else setStatus('You may summon, replace, or end turn.');
}

function endPlayerTurn(){
  if(S.busy || S.over) return;
  if(S.turn !== 'player') return;
  S.selectedHandIdx = -1; S.selectedAttackerId = null;
  S.awaitingTarget = false; S.pendingReplaceSlot = -1;
  render();
  startOpponentTurn();
}

async function startOpponentTurn(){
  if(S.over) return;
  S.turn = 'opponent'; S.busy = true; S.phase = 'idle';
  S.selectedHandIdx = -1; S.selectedAttackerId = null; S.awaitingTarget = false;
  S.oppField.forEach(m => { if(m) m.hasAttacked = false; });
  render();
  setStatus("Anubis's turn…");
  await wait(650);
  const drawn = drawFromDeck('opp');
  if(drawn){ S.oppHand.push(drawn); sfx('draw'); render(); }
  await wait(300);

  let summons = 0;
  while(summons < MAX_SUMMONS_PER_TURN){
    if(S.oppHand.length === 0) break;
    const emptyIdx = S.oppField.findIndex(m => m === null);
    let targetSlot = -1, replacement = false;
    if(emptyIdx >= 0){ targetSlot = emptyIdx; }
    else{
      const cardIdx = chooseOpponentCardIndex(); if(cardIdx < 0) break;
      const candidateCard = S.oppHand[cardIdx];
      const weakest = findWeakestOppMonsterSlot(); if(weakest < 0) break;
      const weakMonster = S.oppField[weakest]; if(!weakMonster) break;
      const weakPower = (weakMonster.card.atk + weakMonster.card.def) / 2;
      const newPower = (candidateCard.atk + candidateCard.def) / 2;
      if(newPower > weakPower + 200){ targetSlot = weakest; replacement = true; }
      else break;
    }
    const cardIdx = chooseOpponentCardIndex(); if(cardIdx < 0) break;
    const card = S.oppHand.splice(cardIdx, 1)[0];
    if(replacement){
      const oldMonster = S.oppField[targetSlot];
      const oldEl = dom.oppGrid.querySelector(`.card[data-monster-id="${oldMonster.id}"]`);
      if(oldEl) oldEl.classList.add('to-grave');
      sfx('grave'); await wait(400);
      pushToGraveyard('opp', oldMonster.card);
      renderedMonsterIds.delete(oldMonster.id);
      S.oppField[targetSlot] = makeMonster(card, oldMonster.position);
      sfx('summon'); render();
      const slot = dom.oppGrid.children[targetSlot];
      if(slot){
        const r = slot.getBoundingClientRect();
        spawnSummonRing(r.left + r.width/2, r.top + r.height/2);
        spawnParticles(r.left + r.width/2, r.top + r.height/2, 20, '#b89aff', 90);
      }
      setStatus(`Anubis replaces ${oldMonster.card.name} with ${card.name}.`);
    }else{
      const position = chooseOpponentPosition(card);
      S.oppField[targetSlot] = makeMonster(card, position);
      sfx('summon'); render();
      const slot = dom.oppGrid.children[targetSlot];
      if(slot){
        const r = slot.getBoundingClientRect();
        spawnSummonRing(r.left + r.width/2, r.top + r.height/2);
        spawnParticles(r.left + r.width/2, r.top + r.height/2, 20, '#b89aff', 90);
      }
      setStatus(`Anubis summons ${card.name} in ${position === 'atk' ? 'Attack' : 'Defense'} position.`);
    }
    summons++;
    await wait(800);
  }

  if(S.over) return;

  if(S.currentRound >= 2){
    for(const m of S.oppField){
      if(!m || m.position !== 'def' || m.hasAttacked) continue;
      if(m.card.atk >= 1400 && shouldMonsterSwitchToAttack(m)){
        m.position = 'atk'; render();
        setStatus(`Anubis switches ${m.card.name} to Attack position.`);
        await wait(750);
      }
    }
  }

  if(S.currentRound >= 2){
    for(const attacker of [...S.oppField]){
      if(S.over) break;
      if(!attacker || attacker.position !== 'atk' || attacker.hasAttacked) continue;
      const target = chooseOpponentTarget(attacker);
      if(target === undefined) continue;
      const el = dom.oppGrid.querySelector(`.card[data-monster-id="${attacker.id}"]`);
      if(el){
        el.classList.add('attacking');
        sfx('attack');
        await wait(600);
        el.classList.remove('attacking');
      }
      await resolveBattle(attacker, target, 'opponent');
      await wait(450);
      if(S.over) break;
    }
  }else{
    setStatus("Round 1 — Anubis cannot attack.");
    await wait(700);
  }

  if(S.over) return;
  checkGameOver();
  if(S.over) return;
  S.currentRound++; S.busy = false;
  await wait(300);
  startPlayerTurn();
}

function chooseOpponentCardIndex(){
  if(S.oppHand.length === 0) return -1;
  let bestIdx = 0, bestScore = -Infinity;
  S.oppHand.forEach((c, i) => {
    const score = c.atk + c.def * 0.4;
    if(score > bestScore){ bestScore = score; bestIdx = i; }
  });
  return bestIdx;
}
function findWeakestOppMonsterSlot(){
  let weakestIdx = -1, weakestPower = Infinity;
  S.oppField.forEach((m, i) => {
    if(!m) return;
    const power = (m.card.atk + m.card.def) / 2;
    if(power < weakestPower){ weakestPower = power; weakestIdx = i; }
  });
  return weakestIdx;
}
function chooseOpponentPosition(c){
  if(c.atk >= 1600) return 'atk';
  if(c.def > c.atk) return 'def';
  return c.atk >= 1200 ? 'atk' : 'def';
}
function shouldMonsterSwitchToAttack(m){
  const playerMonsters = S.playerField.filter(x => x);
  if(playerMonsters.length === 0) return true;
  return playerMonsters.some(pm => {
    const defVal = pm.position === 'atk' ? pm.card.atk : pm.card.def;
    return m.card.atk > defVal;
  });
}
function chooseOpponentTarget(attacker){
  const playerMonsters = S.playerField.filter(m => m);
  if(playerMonsters.length === 0) return null;
  let best = null, bestScore = -Infinity;
  for(const pm of playerMonsters){
    const defVal = pm.position === 'atk' ? pm.card.atk : pm.card.def;
    if(attacker.card.atk > defVal){
      const dmg = pm.position === 'atk' ? (attacker.card.atk - defVal) : 0;
      const score = dmg + (pm.position === 'atk' ? 500 : 0) - defVal * 0.1;
      if(score > bestScore){ bestScore = score; best = pm; }
    }
  }
  if(best) return best;
  return undefined;
}