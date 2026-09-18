/* ============================================================
   BOOT — initialize the game on whatever page we're on
   ============================================================ */

/**
 * Detect which page we're on from the filename.
 * Returns one of: 'index' | 'game' | 'deck-builder' | 'packs'
 */
function currentPageKey(){
  const file = (location.pathname.split('/').pop() || 'index.html')
                 .replace(/\.html?$/i, '');
  return file || 'index';
}

/**
 * Show a specific screen (adds .active, removes from siblings).
 * Falls back gracefully if the screen isn't on this page.
 */
function activateScreen(id){
  const el = document.getElementById(id);
  if (!el) return null;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  return el;
}

/* ------------------------------------------------------------
   Shared boot — runs on every page
   ------------------------------------------------------------ */
async function bootShared(){
  // Loading screen only exists on the menu page; hide it as soon as
  // we're ready, but don't touch it if it isn't here.
  if (dom.loadingText) {
    dom.loadingText.textContent = 'Awakening the Shadow Realm…';
  }

  // 1. Load the card database
  try {
    pool = await ensurePool(msg => {
      if (dom.loadingText) dom.loadingText.textContent = msg;
    });
  } catch (e) {
    console.error(e);
    if (dom.loadingText) dom.loadingText.textContent = 'Could not load card database.';
    if (dom.loadingSub)  dom.loadingSub.textContent  =
      'Please check your connection and refresh the page.';
    return false;
  }

  // 2. Build the id → card map
  cardMap.clear();
  pool.forEach(c => cardMap.set(c.id, c));

  // 3. Load save file
  save = loadSave();

  // 4. Apply saved settings to the DOM/audio layer
  if (typeof applyAllSettings === 'function') applyAllSettings();

  // 5. Settings UI is shared across all pages
  if (typeof wireSettingsControls    === 'function') wireSettingsControls();
  if (typeof wireMenuSettingsButton  === 'function') wireMenuSettingsButton();

  // 6. Prune orphaned card ids (cards removed from the DB)
  let cleaned = false;
  Object.keys(save.collection).forEach(idStr => {
    const id = Number(idStr);
    if (!cardMap.has(id)) { delete save.collection[idStr]; cleaned = true; }
  });
  const beforeDeckLen = save.deck.length;
  save.deck = save.deck.filter(id => cardMap.has(id));
  if (save.deck.length !== beforeDeckLen) cleaned = true;
  if (cleaned) saveGame();

  // 7. First-run starter deck. Legacy partial saves are repaired only when
  // they still look like a fresh profile, so real deck-builder edits remain safe.
  const collectionIds = Object.keys(save.collection);
  const totalCopies = Object.values(save.collection).reduce((sum, count) => sum + count, 0);
  const looksLikePartialStarter = save.packs === 0 && save.wins === 0 && save.losses === 0
    && (save.deck.length < STARTER_DECK_SIZE || totalCopies < STARTER_DECK_SIZE);
  if (collectionIds.length === 0 || looksLikePartialStarter) {
    if (dom.loadingText) dom.loadingText.textContent = 'Inscribing your first deck…';
    await wait(600);
    createStarterDeck();
    saveGame();
    if (dom.loadingSub) dom.loadingSub.textContent = 'Your starter deck is ready!';
    await wait(900);
  }

  return true;
}

/* ------------------------------------------------------------
   Page-specific boot
   ------------------------------------------------------------ */

async function bootMenuPage(){
  const ok = await bootShared();
  if (!ok) return;

  updateMenuUI();
  activateScreen('mainMenu');
}

async function bootDeckBuilderPage(){
  const ok = await bootShared();
  if (!ok) return;

  activateScreen('deckBuilder');

  // Let the deck builder initialise its own UI
  if (typeof renderDeckBuilder === 'function') renderDeckBuilder();
  else if (typeof openDeckBuilder === 'function') openDeckBuilder();
}

async function bootPacksPage(){
  const ok = await bootShared();
  if (!ok) return;

  activateScreen('packScreen');

  if (typeof openPackScreen === 'function') openPackScreen();
}

async function bootGamePage(){
  const ok = await bootShared();
  if (!ok) return;

  // The duel screen isn't a .screen — it's always visible.
  // We just need to kick off the duel flow.
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.add('hidden');

  if (typeof startDuel === 'function') {
    startDuel();
  } else {
    console.warn('[boot] startDuel() not found — duel will not begin.');
  }
}

/* ------------------------------------------------------------
   Kick off
   ------------------------------------------------------------ */
async function boot(){
  const page = currentPageKey();

  // Show loading spinner while we work (menu page only for now)
  if (page === 'index') activateScreen('loadingScreen');

  switch (page) {
    case 'index':        return bootMenuPage();
    case 'game':         return bootGamePage();
    case 'deck-builder': return bootDeckBuilderPage();
    case 'packs':        return bootPacksPage();
    default:
      console.warn('[boot] Unknown page:', page, '— running shared boot only.');
      return bootShared();
  }
}

/* First user interaction unlocks the audio context. */
document.addEventListener('click',      () => { initAudio(); startAmbient(); }, { once: true });
document.addEventListener('touchstart', () => { initAudio(); startAmbient(); }, { once: true });

/* Fire it up. */
boot();