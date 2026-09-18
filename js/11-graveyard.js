/* ============================================================
   GRAVEYARD VIEWER
============================================================ */
function openGraveyardViewer(side){
  const gy = side === 'player' ? S.playerGraveyard : S.oppGraveyard;
  const pGy = S.playerGraveyard, oGy = S.oppGraveyard;
  dom.gyTitle.textContent = side === 'player' ? 'Your Graveyard' : "Anubis's Graveyard";
  dom.gySub.textContent = `${gy.length} card${gy.length === 1 ? '' : 's'}`;
  const body = dom.gyBody; body.innerHTML = '';

  const yourSide = document.createElement('div');
  yourSide.className = 'gy-side';
  yourSide.innerHTML = `<div class="gy-side-title"><span>Your Graveyard</span><span class="gy-num">${pGy.length} card${pGy.length === 1 ? '' : 's'}</span></div>`;
  if(pGy.length === 0){
    const e = document.createElement('div'); e.className = 'gy-empty'; e.textContent = 'No cards yet.';
    yourSide.appendChild(e);
  }else{
    const grid = document.createElement('div'); grid.className = 'gy-grid';
    [...pGy].reverse().forEach(c => {
      const el = document.createElement('div'); el.className = 'gy-card';
      el.title = `${c.name}\nATK ${c.atk} / DEF ${c.def}`;
      el.innerHTML = `<img src="${c.img}" alt="${c.name}" loading="lazy">`;
      grid.appendChild(el);
    });
    yourSide.appendChild(grid);
  }
  body.appendChild(yourSide);

  const oppSide = document.createElement('div'); oppSide.className = 'gy-side';
  oppSide.innerHTML = `<div class="gy-side-title"><span>Anubis's Graveyard</span><span class="gy-num">${oGy.length} card${oGy.length === 1 ? '' : 's'}</span></div>`;
  if(oGy.length === 0){
    const e = document.createElement('div'); e.className = 'gy-empty'; e.textContent = 'No cards yet.';
    oppSide.appendChild(e);
  }else{
    const grid = document.createElement('div'); grid.className = 'grid gy-grid';
    [...oGy].reverse().forEach(c => {
      const el = document.createElement('div'); el.className = 'gy-card';
      el.title = `${c.name}\nATK ${c.atk} / DEF ${c.def}`;
      el.innerHTML = `<img src="${c.img}" alt="${c.name}" loading="lazy">`;
      grid.appendChild(el);
    });
    oppSide.appendChild(grid);
  }
  body.appendChild(oppSide);
  dom.gyOverlay.classList.remove('hidden');
}

function closeGraveyardViewer(){ if(dom.gyOverlay) dom.gyOverlay.classList.add('hidden'); }

if(dom.gyClose) dom.gyClose.addEventListener('click', closeGraveyardViewer);
if(dom.gyCloseBtn2) dom.gyCloseBtn2.addEventListener('click', closeGraveyardViewer);
if(dom.playerGYBadge) dom.playerGYBadge.addEventListener('click', () => { sfx('click'); openGraveyardViewer('player'); });
if(dom.oppGYBadge) dom.oppGYBadge.addEventListener('click', () => { sfx('click'); openGraveyardViewer('opp'); });
if(dom.gyOverlay) dom.gyOverlay.addEventListener('click', (e) => { if(e.target === dom.gyOverlay) closeGraveyardViewer(); });