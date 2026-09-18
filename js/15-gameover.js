/* ============================================================
   GAME OVER
============================================================ */
function checkGameOver(){
  if(S.over) return;
  if(S.playerLP <= 0 || S.oppLP <= 0){
    S.over = true; S.busy = true; renderControls();
    const playerWon = S.oppLP <= 0 && S.playerLP > 0;
    const draw = S.oppLP <= 0 && S.playerLP <= 0;
    if(playerWon){ save.wins += 1; save.packs += 1; }
    else if(!draw){ save.losses += 1; }
    saveGame();
    setTimeout(() => {
      sfx(playerWon ? 'win' : 'lose');
      if(playerWon){
        for(let i = 0; i < 60; i++){
          setTimeout(() => spawnParticles(
            Math.random() * innerWidth,
            Math.random() * innerHeight * 0.5,
            8, '#ffd766', 80
          ), i * 30);
        }
      }
      showGameOver(playerWon, draw);
    }, 550);
  }
}

function showGameOver(playerWon, draw){
  let title, sub, cls;
  if(draw){ title = 'DRAW'; sub = 'Both duelists fall at the same moment.'; cls = 'draw'; }
  else if(playerWon){ title = '⚔ VICTORY ⚔'; sub = "You have banished Anubis to the Shadow Realm."; cls = 'win'; }
  else { title = 'DEFEAT'; sub = 'Anubis claims your soul for the afterlife.'; cls = 'lose'; }
  const rewardLine = playerWon
    ? `<div class="row"><span>Pack earned</span><span>+1 📦</span></div>` : '';
  dom.overlayPanel.innerHTML = `
    <h1 class="${cls}">${title}</h1>
    <div class="sub">${sub}</div>
    <div class="row"><span>Rounds Played</span><span>${S.currentRound}</span></div>
    <div class="row"><span>Your LP</span><span>${Math.max(0, S.playerLP)}</span></div>
    <div class="row"><span>Anubis's LP</span><span>${Math.max(0, S.oppLP)}</span></div>
    <div class="row"><span>Your GY</span><span>${S.playerGraveyard.length}</span></div>
    <div class="row"><span>Anubis's GY</span><span>${S.oppGraveyard.length}</span></div>
    ${rewardLine}
    <div class="row"><span>Total Packs</span><span>${save.packs}</span></div>
    <button class="btn primary" id="goAgain">⚔ Duel Again</button>
    <button class="btn" id="goMenu">Return to Menu</button>
  `;
  dom.overlay.classList.remove('hidden');
  document.getElementById('goAgain').addEventListener('click', () => {
    dom.overlay.classList.add('hidden');
    setTimeout(startDuel, 200);
  });
  document.getElementById('goMenu').addEventListener('click', () => {
    dom.overlay.classList.add('hidden');
    updateMenuUI();
    location.href = 'index.html';
  });
}