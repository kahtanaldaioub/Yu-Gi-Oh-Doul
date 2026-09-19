/* ============================================================
   STORAGE — persist save state to localStorage
============================================================ */
let loadedResetGeneration = null;

function loadSave(){
  try{
    loadedResetGeneration = localStorage.getItem(RESET_KEY);
    const stored = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    const raw = loadedResetGeneration && stored.resetGeneration !== loadedResetGeneration
      ? {}
      : stored;
    const settings = {
      masterVolume: 0.5,
      sfxVolume: 0.85,
      ambientVolume: 0.75,
      muted: false,
      hoverPreview: true,
      animationSpeed: 'normal',
      screenShake: true,
      particles: true,
      bgParticles: true,
      holoShine: true,
      ...(raw.settings || {})
    };
    return {
      collection: raw.collection || {},
      deck: Array.isArray(raw.deck) ? raw.deck : [],
      packs: typeof raw.packs === 'number' ? raw.packs : 0,
      wins: typeof raw.wins === 'number' ? raw.wins : 0,
      losses: typeof raw.losses === 'number' ? raw.losses : 0,
      starterInitialized: raw.starterInitialized === true,
      starterDeckSize: typeof raw.starterDeckSize === 'number' ? raw.starterDeckSize : 0,
      starterDeckComplete: raw.starterDeckComplete === true,
      resetGeneration: loadedResetGeneration,
      settings
    };
  }catch(e){
    return {
      collection:{},
      deck:[],
      packs:0,
      wins:0,
      losses:0,
      starterInitialized:false,
      starterDeckSize:0,
      starterDeckComplete:false,
      resetGeneration: loadedResetGeneration,
      settings: {
        masterVolume: 0.5,
        sfxVolume: 0.85,
        ambientVolume: 0.75,
        muted: false,
        hoverPreview: true,
        animationSpeed: 'normal',
        screenShake: true,
        particles: true,
        bgParticles: true,
        holoShine: true
      }
    };
  }
}

function saveGame(){
  try {
    if (!save) return;
    if (loadedResetGeneration !== localStorage.getItem(RESET_KEY)) return;
    save.settings = { ...(save.settings || {}), ...settings };
    save.resetGeneration = loadedResetGeneration;
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch(e){}
}