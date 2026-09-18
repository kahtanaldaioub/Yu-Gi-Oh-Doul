const SETTINGS_KEY = 'ygo_duel_settings_v1';
const SETTINGS_VERSION = 1;

const DEFAULT_SETTINGS = Object.freeze({
  _version: SETTINGS_VERSION,
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
});

let settings = { ...DEFAULT_SETTINGS };

(function loadSettingsAtStartup(){
  try {
    const source = (save && save.settings) ? save.settings : {};
    settings = { ...DEFAULT_SETTINGS, ...source };
    if (save) save.settings = { ...settings };
  } catch (e) {
    settings = { ...DEFAULT_SETTINGS };
  }
})();

/* ---------- SAVE (debounced, with immediate flush) ---------- */
let _saveTimer = null;
function saveSettings(immediate){
  if (save) save.settings = { ...settings };
  if(immediate){
    if(_saveTimer){ clearTimeout(_saveTimer); _saveTimer = null; }
    _writeSettingsNow();
    return;
  }
  if(_saveTimer) return;
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    _writeSettingsNow();
  }, 150);
}
function _writeSettingsNow(){
  try{
    if (save) save.settings = { ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    saveGame();
  }catch(e){
    console.warn('[settings] Save failed (localStorage full or blocked):', e);
  }
}
/* Flush pending writes when the page is hidden or closed */
window.addEventListener('pagehide', () => saveSettings(true));
document.addEventListener('visibilitychange', () => {
  if(document.visibilityState === 'hidden') saveSettings(true);
});

/* ---------- PUBLIC API ---------- */
function getSetting(key){ return settings[key]; }

function setSetting(key, value, opts = {}){
  if(!(key in DEFAULT_SETTINGS)) return;
  if(settings[key] === value) return;
  settings[key] = value;
  if (save) save.settings = { ...settings };
  saveSettings();
  applyAllSettings();
  if(!opts.silent) syncSettingsUI();
}

/* ---------- APPLY TO WORLD ---------- */
/* Volumes are cached here so initAudio can pick them up even if the
   audio context doesn't exist yet (before the first user gesture). */
const pendingVolumes = { master: 0.5, sfx: 0.85, ambient: 0.75 };

function applyAllSettings(){
  if (save && save.settings) settings = { ...DEFAULT_SETTINGS, ...save.settings };
  applyVolumeSettings();
  applyAnimationSpeed();
  applyVisualToggles();
  applyHoverPreviewSetting();
  if (save) save.settings = { ...settings };
}

function applyVolumeSettings(){
  pendingVolumes.master  = settings.muted ? 0 : settings.masterVolume;
  pendingVolumes.sfx     = settings.sfxVolume;
  pendingVolumes.ambient = settings.ambientVolume;

  if(!audioCtx || !masterGain || !sfxGain || !ambientBusGain) return;

  const now = audioCtx.currentTime;
  const t = 0.05;
  masterGain.gain.setTargetAtTime(pendingVolumes.master,  now, t);
  sfxGain.gain.setTargetAtTime(pendingVolumes.sfx,         now, t);
  ambientBusGain.gain.setTargetAtTime(pendingVolumes.ambient, now, t);
}

function applyAnimationSpeed(){
  const speedMap = { fast: '0.55', normal: '1', relaxed: '1.6' };
  const v = speedMap[settings.animationSpeed] || '1';
  document.documentElement.style.setProperty('--anim-speed', v);
}

function applyVisualToggles(){
  document.body.classList.toggle('no-shake', !settings.screenShake);
  document.body.classList.toggle('no-particles', !settings.particles);
  document.body.classList.toggle('no-bg-particles', !settings.bgParticles);
  document.body.classList.toggle('no-holo', !settings.holoShine);
}

function applyHoverPreviewSetting(){
  hoverPreviewEnabled = settings.hoverPreview;
  if(dom.hoverToggle){
    dom.hoverToggle.classList.toggle('off', !hoverPreviewEnabled);
    dom.hoverToggle.setAttribute('aria-pressed', hoverPreviewEnabled ? 'true' : 'false');
    const label = dom.hoverToggle.querySelector('.ht-label');
    if(label) label.textContent = hoverPreviewEnabled ? 'Preview ON' : 'Preview OFF';
    if(!hoverPreviewEnabled && typeof hideCardPreview === 'function') hideCardPreview();
  }
}

/* ---------- UI SYNC ---------- */
function syncSettingsUI(){
  if(!dom.settingsOverlay) return;

  setSlider('masterVolume',  settings.masterVolume);
  setSlider('sfxVolume',     settings.sfxVolume);
  setSlider('ambientVolume', settings.ambientVolume);

  setSwitch('muted',        settings.muted);
  setSwitch('hoverPreview', settings.hoverPreview);
  setSwitch('screenShake',  settings.screenShake);
  setSwitch('particles',    settings.particles);
  setSwitch('bgParticles',  settings.bgParticles);
  setSwitch('holoShine',    settings.holoShine);

  dom.settingsOverlay.querySelectorAll('.segmented button').forEach(b => {
    b.classList.toggle('active', b.dataset.speed === settings.animationSpeed);
  });
}

function setSlider(name, value){
  const input = dom.settingsOverlay.querySelector(`input[data-setting="${name}"]`);
  if(!input) return;
  const pct = Math.round(value * 100);
  input.value = pct;
  input.style.setProperty('--fill', pct + '%');
  const val = input.parentElement.querySelector('.slider-value');
  if(val) val.textContent = pct + '%';
}

function setSwitch(name, on){
  const el = dom.settingsOverlay.querySelector(`.switch[data-setting="${name}"]`);
  if(!el) return;
  el.classList.toggle('on', on);
  el.setAttribute('aria-checked', on ? 'true' : 'false');
}

/* ---------- OPEN / CLOSE ---------- */
function openSettings(){
  if(!dom.settingsOverlay) return;
  syncSettingsUI();
  dom.settingsOverlay.classList.add('active');
  sfx('click');
}
function closeSettings(){
  if(!dom.settingsOverlay) return;
  dom.settingsOverlay.classList.remove('active');
  saveSettings(true);
  sfx('click');
}

/* ---------- WIRE CONTROLS (called once from boot) ---------- */
function wireHoverToggle(){
  const btn = document.getElementById('hoverToggle');
  if(!btn || btn.dataset.wired === '1') return;
  btn.dataset.wired = '1';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setSetting('hoverPreview', !settings.hoverPreview);
    sfx('click');
  });
}

function wireSettingsControls(){
  if(!dom.settingsOverlay) return;
  if(dom.settingsOverlay.dataset.wired === '1') return;
  dom.settingsOverlay.dataset.wired = '1';

  wireHoverToggle();

  /* Tabs */
  dom.settingsOverlay.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      dom.settingsOverlay.querySelectorAll('.settings-tab').forEach(t => {
        t.classList.toggle('active', t === tab);
      });
      dom.settingsOverlay.querySelectorAll('.settings-tab-content').forEach(c => {
        c.classList.toggle('active', c.dataset.tab === target);
      });
      sfx('click');
    });
  });

  /* Sliders */
  dom.settingsOverlay.querySelectorAll('input[data-setting]').forEach(input => {
    input.addEventListener('input', () => {
      const name = input.dataset.setting;
      const value = parseInt(input.value, 10) / 100;
      settings[name] = value;
      input.style.setProperty('--fill', input.value + '%');
      const val = input.parentElement.querySelector('.slider-value');
      if(val) val.textContent = input.value + '%';
      applyVolumeSettings();      /* live preview */
      saveSettings();             /* debounced write */
    });
    /* Preview sound when releasing the SFX or Master slider */
    input.addEventListener('change', () => {
      saveSettings(true);
      if(input.dataset.setting === 'masterVolume' || input.dataset.setting === 'sfxVolume'){
        if(settings.masterVolume > 0 && settings.sfxVolume > 0 && !settings.muted){
          playTone(660, 0.08, 'sine', 0.05);
        }
      }
    });
  });

  /* Switches */
  dom.settingsOverlay.querySelectorAll('.switch[data-setting]').forEach(sw => {
    sw.setAttribute('role', 'switch');
    sw.setAttribute('tabindex', '0');
    const fire = () => {
      const name = sw.dataset.setting;
      setSetting(name, !settings[name]);
      sfx('click');
    };
    sw.addEventListener('click', fire);
    sw.addEventListener('keydown', (e) => {
      if(e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); fire(); }
    });
  });

  /* Segmented (animation speed) */
  dom.settingsOverlay.querySelectorAll('.segmented button').forEach(b => {
    b.addEventListener('click', () => {
      setSetting('animationSpeed', b.dataset.speed);
      sfx('click');
    });
  });

  /* Footer */
  const resetBtn = dom.settingsOverlay.querySelector('#settingsReset');
  if(resetBtn){
    resetBtn.addEventListener('click', () => {
      if(!confirm('Reset all settings to their defaults?')) return;
      settings = { ...DEFAULT_SETTINGS };
      saveSettings(true);
      applyAllSettings();
      syncSettingsUI();
      sfx('reveal');
    });
  }
  const doneBtn = dom.settingsOverlay.querySelector('#settingsDone');
  if(doneBtn) doneBtn.addEventListener('click', closeSettings);

  const closeBtn = dom.settingsOverlay.querySelector('.settings-close');
  if(closeBtn) closeBtn.addEventListener('click', closeSettings);

  dom.settingsOverlay.addEventListener('click', (e) => {
    if(e.target === dom.settingsOverlay) closeSettings();
  });

  /* Keyboard shortcuts */
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName || '';
    const typing = /INPUT|TEXTAREA|SELECT/.test(tag);
    const duelScreen = document.getElementById('duelScreen');
    if(e.key === 'Escape' && dom.settingsOverlay.classList.contains('active')){
      closeSettings();
    }
    if((e.key === 's' || e.key === 'S') && !typing &&
       !dom.settingsOverlay.classList.contains('active') &&
       (!duelScreen || !duelScreen.classList.contains('active'))){
      openSettings();
    }
  });
}

function wireMenuSettingsButton(){
  const btn = document.getElementById('btnSettings');
  if(!btn || btn.dataset.wired === '1') return;
  btn.dataset.wired = '1';
  btn.addEventListener('click', () => { initAudio(); openSettings(); });
}