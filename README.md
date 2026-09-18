# Duel Field — Shadow Realm Duel

A browser-based Yu-Gi-Oh! card battle game with an Egyptian Shadow Realm theme.

## 📁 Project Structure
duel-field/
├── index.html Main HTML shell (contains inline SVG sprite sheet)
├── README.md
├── assets/
│ └── background.svg Egyptian ruins background scene
├── css/
│ ├── base.css Reset + CSS variables
│ ├── background.css Background layers + floating particles
│ ├── screens.css Screen containers + loading
│ ├── menu.css Main menu panel
│ ├── topbar.css Top bar + button styles
│ ├── deck-builder.css Deck builder + floating card preview
│ ├── pack.css Pack opening screen
│ ├── duel-layout.css Duel layout: side panels + field
│ ├── duel-cards.css Card appearance + states
│ ├── duel-hand.css Hand + control buttons
│ ├── overlays.css Game over + graveyard viewer
│ ├── effects.css Particles, shake, floating damage
│ └── responsive.css Media queries (desktop → phone)
└── js/
├── 01-config.js Constants (deck sizes, LP, etc.)
├── 02-state.js Shared mutable state (S, pool, save)
├── 03-dom.js Cached DOM references
├── 04-audio.js Web Audio ambient + SFX
├── 05-utils.js Helpers (wait, shuffle, particles)
├── 06-storage.js localStorage persistence
├── 07-cards.js Card pool, fetch, starter deck
├── 08-menu.js Main menu UI + handlers
├── 09-deck-builder.js Deck builder + preview
├── 10-packs.js Pack opening
├── 11-graveyard.js Graveyard viewer
├── 12-render.js Field/hand/LP/controls rendering
├── 13-flow.js Turn flow, summon, attack
├── 14-battle.js Battle resolution
├── 15-gameover.js Victory/defeat
└── 16-boot.js Boot sequence + global listeners

text

## 🚀 Running

Just open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge).

**Note:** The game fetches card data from the public YGOPRODeck API. It caches
the downloaded pool in `localStorage`, so the first load requires internet but
subsequent loads are instant.

## 🎮 How to Play

1. **Play Duel** — Enter a match against Anubis
2. **Deck Builder** — Customize your deck from your collection
3. **Open Packs** — Win duels to earn packs, get new cards

### Combat Rules
- Summon up to **2 monsters per turn**
- **Round 1**: No attacks allowed
- **Round 2+**: Attack position monsters can attack
- ATK vs ATK → higher wins, difference is damage
- ATK vs DEF → higher wins, no damage if attacker loses
- Direct attacks when opponent has no monsters

## 🔧 Adding Content

### Adding a new card pool source
Edit `js/07-cards.js` → `ensurePool()`.

### Adding a new SFX
1. Add a `case` in `sfx()` in `js/04-audio.js`
2. Call `sfx('your-sound')` from anywhere

### Adding a new SVG icon
1. Add a `<symbol id="your-icon" viewBox="...">…</symbol>` to the sprite
   sheet inside `index.html`
2. Reference with `<svg viewBox="..."><use href="#your-icon"/></svg>`

## 📝 License

Fan project. Card data © YGOPRODeck. Yu-Gi-Oh! is a trademark of Konami.
🎯 Summary of the split


