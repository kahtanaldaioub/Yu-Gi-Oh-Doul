/* ============================================================
   BATTLE — resolve attacker vs target
============================================================ */
async function resolveBattle(attacker, target, attackerSide){
  const who = attackerSide === 'player' ? 'Your' : "Anubis's";
  if(!target){
    setStatus(`${who} ${attacker.card.name} attacks directly!`);
    await wait(400);
    const dmg = attacker.card.atk;
    if(attackerSide === 'player'){
      S.oppLP = Math.max(0, S.oppLP - dmg);
      renderLP('opp');
      floatDamage('-' + dmg, '#ff6b52', dom.oppZone);
    }else{
      S.playerLP = Math.max(0, S.playerLP - dmg);
      renderLP('player');
      floatDamage('-' + dmg, '#ff6b52', dom.playerZone);
    }
    sfx('damage'); screenShake(); flashRed();
    const targetZone = attackerSide === 'player' ? dom.oppZone : dom.playerZone;
    const r = targetZone.getBoundingClientRect();
    spawnParticles(r.left + r.width/2, r.top + r.height/2, 30, '#ff8a6a', 140);
    setStatus(`Direct attack! ${dmg} damage dealt.`);
    await wait(800);
    checkGameOver();
    return;
  }

  setStatus(`${who} ${attacker.card.name} attacks ${target.card.name}!`);
  await wait(550);

  const aAtk = attacker.card.atk;
  const defPos = target.position;
  const dVal = defPos === 'atk' ? target.card.atk : target.card.def;

  let dmgToAttackerSide = 0, dmgToDefenderSide = 0;
  let destroyAttacker = false, destroyTarget = false, text = '';

  if(aAtk > dVal){
    destroyTarget = true;
    if(defPos === 'atk'){ dmgToDefenderSide = aAtk - dVal; text = `${who} monster destroys ${target.card.name} and deals ${dmgToDefenderSide} damage!`; }
    else text = `${who} monster destroys ${target.card.name} in Defense!`;
  }else if(aAtk < dVal){
    destroyAttacker = true; dmgToAttackerSide = dVal - aAtk;
    text = `${who} monster is destroyed! ${dmgToAttackerSide} damage taken.`;
  }else{
    if(defPos === 'atk'){ destroyAttacker = true; destroyTarget = true; text = 'Both monsters clash and are destroyed!'; }
    else text = 'The attack is repelled with no damage.';
  }

  if(attackerSide === 'player'){
    S.oppLP = Math.max(0, S.oppLP - dmgToDefenderSide);
    S.playerLP = Math.max(0, S.playerLP - dmgToAttackerSide);
    renderLP(dmgToDefenderSide > 0 ? 'opp' : (dmgToAttackerSide > 0 ? 'player' : null));
    if(dmgToDefenderSide > 0) floatDamage('-' + dmgToDefenderSide, '#ff6b52', dom.oppZone);
    if(dmgToAttackerSide > 0) floatDamage('-' + dmgToAttackerSide, '#ff6b52', dom.playerZone);
  }else{
    S.playerLP = Math.max(0, S.playerLP - dmgToDefenderSide);
    S.oppLP = Math.max(0, S.oppLP - dmgToAttackerSide);
    renderLP(dmgToDefenderSide > 0 ? 'player' : (dmgToAttackerSide > 0 ? 'opp' : null));
    if(dmgToDefenderSide > 0) floatDamage('-' + dmgToDefenderSide, '#ff6b52', dom.playerZone);
    if(dmgToAttackerSide > 0) floatDamage('-' + dmgToAttackerSide, '#ff6b52', dom.oppZone);
  }

  if(dmgToAttackerSide > 0 || dmgToDefenderSide > 0){ sfx('damage'); screenShake(); flashRed(); }
  if(destroyAttacker || destroyTarget){ sfx('destroy'); screenShake(); }

  setStatus(text);

  const attackerEl = (attackerSide === 'player' ? dom.playerGrid : dom.oppGrid)
    .querySelector(`.card[data-monster-id="${attacker.id}"]`);
  const targetEl = (attackerSide === 'player' ? dom.oppGrid : dom.playerGrid)
    .querySelector(`.card[data-monster-id="${target.id}"]`);

  if(destroyAttacker && attackerEl) attackerEl.classList.add('dying');
  if(destroyTarget && targetEl) targetEl.classList.add('dying');

  if(destroyAttacker && attackerEl){
    const r = attackerEl.getBoundingClientRect();
    spawnParticles(r.left + r.width/2, r.top + r.height/2, 26, '#ff5a3a', 120);
  }
  if(destroyTarget && targetEl){
    const r = targetEl.getBoundingClientRect();
    spawnParticles(r.left + r.width/2, r.top + r.height/2, 26, '#ff5a3a', 120);
  }

  await wait(500);

  if(destroyAttacker){
    if(attackerSide === 'player'){
      const i = S.playerField.findIndex(m => m && m.id === attacker.id);
      if(i >= 0){ pushToGraveyard('player', S.playerField[i].card); renderedMonsterIds.delete(attacker.id); S.playerField[i] = null; }
    }else{
      const i = S.oppField.findIndex(m => m && m.id === attacker.id);
      if(i >= 0){ pushToGraveyard('opp', S.oppField[i].card); renderedMonsterIds.delete(attacker.id); S.oppField[i] = null; }
    }
  }
  if(destroyTarget){
    if(attackerSide === 'player'){
      const i = S.oppField.findIndex(m => m && m.id === target.id);
      if(i >= 0){ pushToGraveyard('opp', S.oppField[i].card); renderedMonsterIds.delete(target.id); S.oppField[i] = null; }
    }else{
      const i = S.playerField.findIndex(m => m && m.id === target.id);
      if(i >= 0){ pushToGraveyard('player', S.playerField[i].card); renderedMonsterIds.delete(target.id); S.playerField[i] = null; }
    }
  }

  render();
  await wait(400);
  checkGameOver();
}