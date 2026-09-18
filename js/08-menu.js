/* ============================================================
   MENU — main menu UI (multi-page version)
   ============================================================ */

/**
 * Refresh every stat / badge on the main menu.
 * Safe to call even if some elements aren't on the current page.
 */
function updateMenuUI(){
  const totalCopies = Object.values(save.collection).reduce((a,b)=>a+b,0);

  // Stats row
  if (dom.statWins)      dom.statWins.textContent      = save.wins;
  if (dom.statCards)     dom.statCards.textContent     = totalCopies;
  if (dom.statDeck)      dom.statDeck.textContent      = save.deck.length;

  // Badges on the menu buttons
  if (dom.packCount)     dom.packCount.textContent     = save.packs;
  if (dom.deckCountBadge) dom.deckCountBadge.textContent = `${save.deck.length} / ${MAX_DECK}`;

  // Play button state
  const canPlay = save.deck.length >= MIN_DECK;
  if (dom.playDeckCount) {
    dom.playDeckCount.textContent = canPlay
      ? `${save.deck.length} cards`
      : `Need ${MIN_DECK - save.deck.length}+`;
  }

  // Disable menu links when they shouldn't be usable.
  // <a> can't be .disabled, so we style + block clicks with a class.
  const playLink  = document.querySelector('a.menu-btn[href="game.html"]');
  const packLink  = document.querySelector('a.menu-btn[href="packs.html"]');

  if (playLink) {
    const blocked = !canPlay;
    playLink.classList.toggle('disabled', blocked);
    playLink.setAttribute('aria-disabled', String(blocked));
    playLink.onclick = blocked ? e => { e.preventDefault(); sfx('deny'); } : null;
  }
  if (packLink) {
    const blocked = save.packs <= 0;
    packLink.classList.toggle('disabled', blocked);
    packLink.setAttribute('aria-disabled', String(blocked));
    packLink.onclick = blocked ? e => { e.preventDefault(); sfx('deny'); } : null;
  }

  // Legacy buttons (if any old page still uses them)
  if (dom.btnPlay)  dom.btnPlay.disabled  = !canPlay;
  if (dom.btnPacks) dom.btnPacks.disabled = save.packs <= 0;
}

/* ------------------------------------------------------------
   Menu button wiring
   The main menu's Enter Duel / Deck Builder / Open Packs
   buttons are now plain <a href> links — no JS handlers needed.
   ------------------------------------------------------------ */

// Play a click sound on any in-page menu link that isn't disabled.
document.addEventListener('click', (e) => {
  const link = e.target.closest('a.menu-btn, a.link-btn');
  if (!link) return;
  if (link.classList.contains('disabled')) return;
  initAudio();
  sfx('click');
}, true);

/* Reset progress — still a button, still asks for confirmation. */
if (dom.btnReset) {
  dom.btnReset.addEventListener('click', () => {
    if (confirm('Erase all progress and start over?')) {
      localStorage.setItem(RESET_KEY, `${Date.now()}-${Math.random()}`);
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(POOL_KEY);
      location.reload();
    }
  });
}

/* Settings button on the menu — opens the shared overlay. */
if (dom.btnSettings) {
  dom.btnSettings.addEventListener('click', () => {
    initAudio();
    sfx('click');
    openSettings();
  });
}