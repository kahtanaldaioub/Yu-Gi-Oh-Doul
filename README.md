# Game Logic — Full Reference

A single-file explanation of every system in the Shadow Realm duel game. Use this as the source of truth for how the app behaves.

---

## 1. High-Level Architecture

The game is a **static, multi-page browser app** with no build step and no backend. Everything runs client-side.

- **Card data** comes from the public [YGOPRODeck API v7](https://db.ygoprodeck.com/api-guide/).
- **Persistence** is `localStorage` only.
- **Rendering** is plain DOM manipulation — no framework.
- **Audio** is fully synthesized with the Web Audio API — no audio files.
- **Styling/animation** is CSS, driven by class toggles and CSS custom properties.

Each page loads the same numbered script bundle in order (`00-sprite.js` … `18-nav.js`). The page-specific behaviour is chosen at boot time by inspecting the current filename.

---

## 2. Module Map

| File | Responsibility |
|---|---|
| `00-sprite.js` | Injects an inline SVG `<defs>` sprite (eye of wdjat, ankh, sword, shield, tomb, deck, cards, skull, star, priest, anubis, summon-circle) so `<use href="#id">` works everywhere. |
| `01-config.js` | Global constants. |
| `02-state.js` | Mutable runtime state: card pool, `cardMap`, `save`, and the duel state object `S`. |
| `03-dom.js` | Cached DOM references (`dom.*`) and the `$` helper. |
| `04-audio.js` | Web Audio graph: ambient bed + synthesized SFX. |
| `05-utils.js` | Generic helpers: `wait`, `shuffle`, `setStatus`, damage floats, particles, screen shake, screen switching. |
| `06-storage.js` | `loadSave()` / `saveGame()` against `localStorage`, including a reset-generation guard. |
| `07-cards.js` | Card normalization, playability filter, pool fetching, starter-deck creation. |
| `08-menu.js` | Main menu stats/badges and menu link gating. |
| `09-deck-builder.js` | Deck builder UI + floating card preview + hover-preview toggle. |
| `10-packs.js` | Pack opening screen and pack draw algorithm. |
| `11-graveyard.js` | Graveyard viewer overlay. |
| `12-render.js` | Renders field, hand, LP bars, GY counters, side info, control buttons. |
| `13-flow.js` | Duel flow: turn start/end, summoning, replacement, opponent AI. |
| `14-battle.js` | Battle resolution between attacker and target. |
| `15-gameover.js` | Win/loss detection and the game-over overlay. |
| `16-boot.js` | Boot router: decides which page it is and runs the shared + page-specific init. |
| `17-settings.js` | Settings model, persistence, live apply, and settings UI wiring. |
| `18-nav.js` | Builds the shared bottom/top page navigation bar. |

---

## 3. Key Constants (`01-config.js`)

| Constant | Value | Meaning |
|---|---|---|
| `API` | `https://db.ygoprodeck.com/api/v7` | Card API base. |
| `POOL_KEY` | `ygo_duel_pool_v2` | localStorage key for the cached card pool. |
| `SAVE_KEY` | `ygo_duel_save_v2` | localStorage key for player save. |
| `RESET_KEY` | `ygo_duel_reset_generation_v1` | Reset-generation marker for invalidating old saves. |
| `START_LP` | `8000` | Starting life points for both players. |
| `MIN_DECK` | `15` | Minimum deck size to play. |
| `MAX_DECK` | `30` | Maximum deck size. |
| `STARTER_DECK_SIZE` | `20` | Cards in the auto-generated starter deck. |
| `CARDS_PER_PACK` | `5` | Cards per opened pack. |
| `OPP_DECK_SIZE` | `20` | Cards in the AI's deck. |
| `POOL_TARGET` | `1200` | Max cards kept in the cached pool. |
| `FIELD_SLOTS` | `3` | Monster zones per side. |
| `MAX_SUMMONS_PER_TURN` | `2` | Summons/replacements per side per turn. |

---

## 4. Boot Sequence (`16-boot.js`)

On every page, `boot()` runs immediately at script load:

1. Determine the page key from `location.pathname` (`index`, `game`, `deck-builder`, `packs`).
2. If `index`, show the loading screen.
3. Run **`bootShared()`** on every page:
   - **Load the card pool** via `ensurePool()`. If it fails, show an error and stop.
   - Build `cardMap` (id → card object) from the pool.
   - Load the save file with `loadSave()`.
   - Apply saved settings (`applyAllSettings`).
   - Wire settings controls (`wireSettingsControls`, `wireMenuSettingsButton`).
   - **Prune orphaned card ids**: any collection/deck entry whose card is no longer in the pool is removed and the save is rewritten.
   - **Starter deck**: If the collection is empty, *or* the profile still looks like a fresh one (`packs === 0 && wins === 0 && losses === 0 && (deck < 20 || totalCopies < 20)`), call `createStarterDeck()`. This repairs legacy partial saves without clobbering a real deck-builder edit.
4. Run the page-specific boot:
   - `index` → `bootMenuPage()` → `updateMenuUI()` + show main menu.
   - `game` → `bootGamePage()` → hide overlay, `startDuel()`.
   - `deck-builder` → `bootDeckBuilderPage()` → show deck builder, `renderDeckBuilder()`.
   - `packs` → `bootPacksPage()` → show pack screen, `openPackScreen()`.
5. A one-shot `click`/`touchstart` listener initializes and starts audio (browsers require a user gesture to unlock the AudioContext).

---

## 5. Card Pool (`07-cards.js`)

### 5.1 Fetching

`ensurePool(onProgress)`:

1. Try `localStorage[POOL_KEY]`. If it parses to an array with **>300 unique** cards, reuse it.
2. Otherwise fetch **7 batches of 220 cards** from `cardinfo.php?num=220&offset=...`, with random offsets to diversify.
3. Normalize each card: `{ id, name, atk, def, img }` (from `card_images[0].image_url_small`).
4. Keep only cards that pass `isPlayableMonster()`:
   - `name` is a string
   - `type` contains `"Monster"`
   - `atk`/`def` are numbers
   - `300 ≤ atk ≤ 4500`
   - has at least one image URL
5. Deduplicate by id, cap at `POOL_TARGET` (1200), cache in localStorage, and return.

### 5.2 Helpers

- `getCard(id)` → `cardMap.get(id)`.
- `makeMonster(card, position)` → `{ id: ++monsterIdCounter, card, position, hasAttacked: false }`. Each field monster gets a **unique runtime id** separate from the card id, so the same card can appear multiple times on the field and still be addressed individually.
- `renderedMonsterIds` is a `Set` used by the renderer to decide whether to play the "summon" animation. A monster is added on first render and removed when it leaves the field.

### 5.3 Starter Deck

`createStarterDeck()` → `pickStarterCards(pool, 20)`:

- **Preferred**: cards with `900 ≤ atk ≤ 2600`.
- **Fallback**: cards with `2600 < atk ≤ 3500`.
- **Last resort**: the entire pool.
- These lists are shuffled and concatenated, then deduplicated while filling to exactly 20.
- If still short, cycle through the picked list to pad to 20.
- Then wipe `save.collection` and `save.deck`, add 1 of each card to the collection, and set the deck to those 20 ids.
- Flags: `starterInitialized = true`, `starterDeckSize = 20`, `starterDeckComplete = deck.length === 20`.

---

## 6. Persistence (`06-storage.js` and `17-settings.js`)

### 6.1 Save shape

```js
save = {
  collection: { [cardId]: count },
  deck: [cardId, ...],           // not deduplicated; duplicates allowed
  packs: number,
  wins: number,
  losses: number,
  starterInitialized: boolean,
  starterDeckSize: number,
  starterDeckComplete: boolean,
  resetGeneration: string,
  settings: { ...DEFAULT_SETTINGS }
}
```

### 6.2 Reset generation

`RESET_KEY` holds a token written at reset time. `loadSave()` compares the stored save's `resetGeneration` with the current token; if they differ, the save is treated as empty. This guarantees that after "Reset Progress", old saves can't leak back in.

### 6.3 Save writes

- `saveGame()` early-exits if the current `RESET_KEY` doesn't match the one loaded at boot (protects against a race with a reset in another tab).
- Settings use a **debounced writer** (`saveSettings()`), with an immediate flush path used by sliders' `change` events and by `pagehide` / `visibilitychange`.

### 6.4 Settings defaults

```
masterVolume:   0.5
sfxVolume:      0.85
ambientVolume:  0.75
muted:          false
hoverPreview:   true
animationSpeed: 'normal'   // 'fast' | 'normal' | 'relaxed'
screenShake:    true
particles:      true
bgParticles:    true
holoShine:      true
```

Settings live in **two places**: inside `save.settings` (so a single save file carries everything) and in their own `SETTINGS_KEY` localStorage entry. Both are kept in sync.

---

## 7. Main Menu (`08-menu.js`)

`updateMenuUI()` refreshes:

- `#statWins`, `#statCards` (total collection copies), `#statDeck` (deck size).
- `#packCount` badge, `#deckCountBadge` (`deck.length / 30`).
- Play link shows either `"N cards"` or `"Need X+"` where `X = 15 - deck.length`.
- The `a.menu-btn[href="game.html"]` link gets `.disabled` and `aria-disabled` when `deck.length < 15`. Its `onclick` is replaced with a "deny" SFX handler.
- The `a.menu-btn[href="packs.html"]` link is disabled when `packs ≤ 0`.
- Legacy buttons (`#btnPlay`, `#btnPacks`) are disabled to match.

A delegated `click` listener plays a click SFX on any non-disabled `a.menu-btn` / `a.link-btn` and initializes audio.

`#btnReset` confirms, then writes a fresh `RESET_KEY` token, removes `SAVE_KEY` and `POOL_KEY`, and reloads.

`#btnSettings` opens the settings overlay.

---

## 8. Deck Builder (`09-deck-builder.js`)

### 8.1 State

- `dbSortMode` — one of `atk-desc` (default), `atk-asc`, `def-desc`, `name-asc`, `owned-desc`.
- `dbSearchQuery` — lowercased substring of the card name.

### 8.2 Rendering

`renderDeckBuilder()`:

1. Updates `#dbDeckCount` with `.warn` (< 15) or `.ok` (≥ 20) classes.
2. Updates `#dbCollCount` with total copies / unique cards.
3. **Deck list** — sorted by ATK descending. Each tile:
   - shows the art and `⚔ ATK` badge;
   - shows a floating preview on hover;
   - clicking removes one copy from the deck (removes the first matching id).
4. **Collection grid** — filtered by `dbSearchQuery`, sorted by `dbSortMode`. Each card shows:
   - `in-deck/owned` count badge;
   - an `+ Add` label unless the deck is full or the copy limit is reached;
   - `.in-deck` class when at least one copy is already in the deck;
   - `.disabled` class when it can't be added.
   - Clicking adds one copy and re-renders.

### 8.3 Preview

`showCardPreview` / `positionCardPreview` / `hideCardPreview` implement a floating preview anchored to the cursor, flipped to the left when it would overflow the right edge, and clamped inside the viewport vertically.

### 8.4 Hover-preview toggle

- `#hoverToggle` (duel screen) flips `settings.hoverPreview`.
- `H` key toggles it while the duel screen is active.
- `applyHoverPreviewSetting()` (in `17-settings.js`) applies the current value to `hoverPreviewEnabled`, updates the toggle label, and hides any visible preview when turning it off.

### 8.5 Done

`#dbDone` saves and navigates to `index.html`.

---

## 9. Pack Opening (`10-packs.js`)

### 9.1 Pack draw (`drawPackFromPool`)

Cards are bucketed by ATK:

- **Commons**: `atk < 1500`
- **Rares**: `1500 ≤ atk < 2500`
- **Supers**: `atk ≥ 2500`

For each card in a pack of 5:

- `r < 0.60` → common
- `r < 0.90` → rare
- otherwise → super (falling back to whatever bucket is non-empty, then the whole pool).

So the expected distribution is roughly **3 commons / 1.5 rares / 0.5 supers** per pack.

### 9.2 Pack screen

`openPackScreen()`:

- If `save.packs === 0`, shows a "no packs" message and hides the Done button.
- Otherwise, draws a pack, decrements `save.packs`, saves, and builds one `.pack-card-slot` per card.
- Each slot is a 3D-flip element (back shows the eye of wdjat).
- **First click** on a slot:
  - flips it (adds `.revealed`),
  - plays the `flip` SFX,
  - if the card is new to the collection, shows a `NEW!` badge and delays a `reveal` SFX,
  - increments the collection count and saves.
- Once all are revealed, the Done button appears and the intro text is rewritten.

Hover previews use the same floating preview as the deck builder, gated by `hoverPreviewEnabled`.

### 9.3 Buttons

`#pkDone` and `#pkBack` both save, `updateMenuUI()`, and navigate to `index.html`.

---

## 10. Graveyard Viewer (`11-graveyard.js`)

`openGraveyardViewer(side)` builds two side-by-side panels inside `#gyBody`:

- **Your Graveyard** — `S.playerGraveyard`, reversed (most recent first).
- **Anubis's Graveyard** — `S.oppGraveyard`, reversed.

Each panel has a title with a card count and a grid of card images. Empty sides show "No cards yet."

Closing: `#gyClose`, `#gyCloseBtn2`, or clicking the backdrop. `Escape` is not wired here, but the settings overlay uses Escape for itself.

Badges (`#playerGYBadge`, `#oppGYBadge`) open the viewer.

---

## 11. Duel State (`02-state.js`)

```js
const S = {
  playerLP, oppLP,
  playerField: [null, null, null],   // length FIELD_SLOTS
  oppField:    [null, null, null],
  playerDeck, playerHand, playerGraveyard,   // arrays of card objects
  oppDeck,    oppHand,    oppGraveyard,
  selectedHandIdx:   -1,   // index into playerHand, or -1
  selectedAttackerId: null, // runtime monster id, or null
  awaitingTarget:    false, // true while player is picking an attack target
  pendingReplaceSlot: -1,
  turn:  'player' | 'opponent',
  phase: 'idle' | 'main',
  busy:  true,   // true while an animation / AI turn is running
  over:  false,  // game ended
  currentRound: 1,
  summonsThisTurn: 0
};
```

`monsterIdCounter` supplies the unique runtime monster id. `renderedMonsterIds` tracks which monsters have already been animated on screen.

---

## 12. Duel Flow (`13-flow.js`)

### 12.1 Setup — `startDuel()`

1. Reset LP to `START_LP` on both sides.
2. Reset fields to `[null, null, null]` on both sides.
3. Empty all decks, hands, and graveyards.
4. Reset all selection/turn/phase flags; `currentRound = 1`; `summonsThisTurn = 0`; `monsterIdCounter = 0`; clear `renderedMonsterIds`.
5. Build the player deck from `save.deck`, mapped to card objects, shuffled.
6. Build the opponent deck via `buildMatchedOpponentDeck()` (see §15.1).
7. Hide overlays, close the GY viewer, show the duel screen, render.
8. After a short delay, **draw 5 cards each**, alternating, with a small delay per draw.
9. Clear `busy` and call `startPlayerTurn()`.

### 12.2 Turn structure

The duel alternates player turn → opponent turn. **One "round"** is one player turn plus one opponent turn; `currentRound` increments at the end of the opponent's turn.

```
Round 1:  player (no attacks)  →  opponent (no attacks)  →  round = 2
Round 2:  player (attacks OK)  →  opponent (attacks OK)  →  round = 3
...
```

#### Player turn — `startPlayerTurn()`

- Set `turn = 'player'`, `phase = 'main'`, `busy = false`.
- Reset selections and `summonsThisTurn`.
- Clear `hasAttacked` on every player monster.
- Draw a card **unless it's round 1**.
- Show a round-appropriate status message.

#### Ending the player turn — `endPlayerTurn()`

- Clear all selections/targeting.
- Call `startOpponentTurn()`.

#### Opponent turn — `startOpponentTurn()`

1. Set `turn = 'opponent'`, `phase = 'idle'`, `busy = true`.
2. Clear selections, reset `hasAttacked` on opponent monsters.
3. Draw a card.
4. **Summon loop** (up to `MAX_SUMMONS_PER_TURN`):
   - If an empty field slot exists, summon there.
   - Otherwise, pick the AI's best card and the weakest AI monster; **replace** only if `newPower > weakPower + 200` (where `power = (atk + def) / 2`). Replacement sends the old monster to the GY.
   - Position is chosen by `chooseOpponentPosition()`.
5. **Position switch** (round ≥ 2): any defense-position monster with `atk ≥ 1400` that `shouldMonsterSwitchToAttack()` flips to attack position.
6. **Attack loop** (round ≥ 2): each attack-position opponent monster that hasn't attacked picks a target via `chooseOpponentTarget()` and calls `resolveBattle`. If no target is chosen, it skips.
7. Round 1: prints "Anubis cannot attack."
8. `checkGameOver()`. If the game isn't over, increment `currentRound`, clear `busy`, and start the player's turn.

### 12.3 Drawing and graveyard recycling — `drawFromDeck(side)`

- Pop the top card from the side's deck.
- If the deck is empty but the graveyard isn't:
  - Move the entire graveyard into the deck, shuffle it, clear the graveyard, play `recycle`, and update the GY counter.
  - Show a "graveyard shuffled back" status.
  - Then pop and return a card.
- If both are empty, return `null` (no draw possible).

### 12.4 Selecting a hand card — `selectHandCard(idx)`

- Guarded by `phase === 'main'`, `!busy`, `!over`, `!awaitingTarget`.
- Toggles the selection (clicking the same card deselects).
- Selecting a hand card clears the selected attacker.
- Status message explains what to do based on:
  - summon limit reached,
  - no empty slots but monsters exist (→ "click a monster to replace it"),
  - no empty slots and no monsters (rare edge case),
  - otherwise normal "choose ATK/DEF or replace" message.

### 12.5 Summoning — `summon(position)`

- Requires `phase === 'main'`, a selected hand card, `!busy`, `!over`, and `summonsThisTurn < 2`.
- Requires an empty field slot.
- Removes the card from hand, creates a monster in the first empty slot, increments `summonsThisTurn`.
- Plays summon SFX, renders, spawns a summon ring + gold particles over the new slot, and updates the status.

### 12.6 Replacing — `onReplaceMonster(slotIdx)`

- Same guards, plus the summon limit.
- Adds `.to-grave` to the old monster's element, plays `grave`.
- After 480 ms: pushes the old card to the GY, removes its runtime id from `renderedMonsterIds`, removes the new card from hand, creates the new monster in the same slot and same position, increments `summonsThisTurn`, plays summon SFX + ring + particles, and updates the status.

### 12.7 Discarding — `discardSelectedMonster()`

- Requires a selected attacker.
- Animates `.to-grave`, then moves the card to the GY and clears the slot.
- Does **not** cost a summon and does **not** require an empty slot.

### 12.8 Selecting a field monster — `onPlayerMonsterClick(id)`

- Toggles attacker selection.
- Shows a different status depending on whether the monster can attack:
  - round 1 → "no attacks allowed",
  - already attacked,
  - in defense position,
  - can attack (with or without opponent monsters on the field).

### 12.9 Position change — `changePosition()`

- Requires a selected attacker that hasn't attacked.
- Flips `position` between `'atk'` and `'def'`, renders, and updates status.

### 12.10 Starting an attack — `playerStartAttack()`

- Requires round ≥ 2, a selected attack-position monster that hasn't attacked.
- If the opponent has no monsters, resolves a direct attack immediately.
- Otherwise sets `awaitingTarget = true` and asks the player to click a highlighted target.

### 12.11 Target selection — `onTargetSelected(targetId)`

- Confirms the attacker and target exist, clears `awaitingTarget`, and calls `performAttack`.

### 12.12 Performing an attack — `performAttack(attacker, target)`

- Marks `busy = true` and `attacker.hasAttacked = true`.
- Adds `.attacking` to the attacker's element, waits 600 ms, removes it.
- Calls `resolveBattle(attacker, target, 'player')`.
- After the battle, clears `busy` and the selected attacker, re-renders, and prints a follow-up status ("you may attack again" or "attacker was destroyed").

---

## 13. Battle Resolution (`14-battle.js`)

### 13.1 Direct attack (`target === null`)

- Damage = `attacker.card.atk`, subtracted from the defender's LP.
- Renders LP with a hit flash, floats the damage number, plays `damage`, screen-shakes, flashes red, and spawns particles over the target zone.

### 13.2 Monster battle

Let `aAtk = attacker.card.atk`, and let `dVal` be the target's ATK if it's in attack position, or its DEF if it's in defense position.

| Condition | Result |
|---|---|
| `aAtk > dVal` | Target destroyed. If target was in **attack** position, defender takes `aAtk - dVal` damage. If target was in **defense** position, no damage. |
| `aAtk < dVal` | Attacker destroyed. Attacker's side takes `dVal - aAtk` damage. |
| `aAtk === dVal` and target in **attack** position | Both destroyed, no damage. |
| `aAtk === dVal` and target in **defense** position | Attack repelled, no destruction, no damage. |

LP is clamped at 0. Damage floats and hit-flash rendering are applied on the correct side. Destroyed monsters get `.dying`, spawn orange particles, and are pushed to the corresponding graveyard after a 500 ms delay. `checkGameOver()` runs at the end.

Note: the code uses `destroyAttacker`/`destroyTarget` booleans and a text string describing the outcome, which is shown via `setStatus`.

---

## 14. Rendering (`12-render.js`)

### 14.1 `makeCardEl(cardData, position, opts)`

Builds a `.card` (plus `.hand`, `.attack`/`.defense`, `.no-anim` as appropriate) containing:

- the card image,
- the card name (`.cname`),
- ATK/DEF (`.cstats`),
- a `D` badge for defense-position field monsters.

Hover events show the floating preview **only if `hoverPreviewEnabled`** and the user isn't dragging (`e.buttons` check).

### 14.2 `makeSlot(monster, idx, side)`

Builds a `.monster-slot`:

- **Empty slot**: shows `◇`; on the player's side, gets `.empty-slot-target` while a hand card is selected in the main phase.
- **Occupied slot**: contains a card element. For the player's side:
  - if a hand card is selected and `phase === 'main'` and `!busy`, the card gets `.replace-hint` and clicking it calls `onReplaceMonster(idx)`;
  - otherwise it gets the attacker-selected class if applicable and clicking calls `onPlayerMonsterClick`.
  For the opponent's side: while `awaitingTarget`, the card gets `.targetable` and clicking calls `onTargetSelected`.

New monsters (not in `renderedMonsterIds`) get the summon animation; existing ones get `.no-anim`.

### 14.3 `renderField()`

Clears and rebuilds both grids, then updates the opponent's field label with the alive count.

### 14.4 `renderHand()`

Rebuilds hand cards; the selected card gets `.selected`. Empty hand shows "No cards in hand".

### 14.5 `renderLP(flashSide)`

Updates LP bar widths as a percentage of `START_LP`, toggles `.low` at ≤ 30 %, and plays the hit-flash animation on the correct side.

### 14.6 `renderGY()` / `renderSideInfo()`

- GY counters.
- Side info text: deck counts, hand counts, and totals.

### 14.7 `renderControls()`

Builds the button row contextually:

- **Not player's turn / busy** → disabled "Anubis is scheming…" button.
- **Awaiting target** → "Cancel Attack" (danger).
- **Hand card selected**:
  - if summon limit reached → disabled "Summon limit reached (2/turn)";
  - otherwise "Summon ATK" (primary) and "Summon DEF", plus a disabled "Replace (click a monster)" hint if the player has monsters.
- **Attacker selected**:
  - "Switch to X" (disabled if already attacked),
  - "Discard to GY",
  - if attacker is in attack position: "Attack!" or "Direct Attack!", with reason suffixes `(Round 1)` or `(used)` when disabled.
- **Always** (in the main phase): "End Turn →".

### 14.8 `render()`

Calls all of the above in order.

---

## 15. Opponent AI (`13-flow.js`)

### 15.1 Deck building — `buildMatchedOpponentDeck(playerCards)`

1. If the player has no cards, return 20 random pool cards.
2. Compute the player's average ATK and DEF, then `targetPower = (avgAtk + avgDef) / 2`.
3. First pass: keep pool cards whose `power = (atk + def) / 2` falls in `[0.75 × targetPower, 1.25 × targetPower]`.
4. If fewer than 20 remain, widen to `[0.6 × targetPower, 1.4 × targetPower]`.
5. If still fewer than 20, use the whole pool.
6. Shuffle, deduplicate by card id, and take the first 20.

This gives a **power-matched** opponent rather than a random one.

### 15.2 Card choice — `chooseOpponentCardIndex()`

Returns the index of the hand card maximizing `atk + 0.4 × def`.

### 15.3 Weakest slot — `findWeakestOppMonsterSlot()`

Returns the index of the field monster with the lowest `(atk + def) / 2`.

### 15.4 Position choice — `chooseOpponentPosition(c)`

- `atk ≥ 1600` → attack.
- else if `def > atk` → defense.
- else `atk ≥ 1200` → attack, otherwise defense.

### 15.5 Attacking decision — `shouldMonsterSwitchToAttack(m)`

Returns true if the player has no monsters, or if any player monster's current effective value (ATK if in attack position, DEF if in defense position) is lower than `m.card.atk`.

### 15.6 Target choice — `chooseOpponentTarget(attacker)`

- For each player monster it can beat (attacker's ATK > effective value), compute a score:
  `score = damage + (attack-position bonus 500 if applicable) − defVal × 0.1`
- Return the highest-scoring target.
- If no target can be beaten, return `undefined` (the loop skips that attacker — the AI will not trade into a stronger monster).
- If the player has no monsters, return `null` (direct attack).

---

## 16. Game Over (`15-gameover.js`)

`checkGameOver()`:

- Fires when either LP ≤ 0.
- Sets `over = true`, `busy = true`, disables controls.
- Determines `playerWon` (`oppLP ≤ 0 && playerLP > 0`) and `draw` (both ≤ 0).
- Winner gets `wins += 1` and `packs += 1`. Non-draw loser gets `losses += 1`. Saves.
- After 550 ms plays `win`/`lose`, and on a win fires 60 staggered particle bursts across the top half of the screen.
- `showGameOver()` fills `#overlayPanel` with:
  - a title (VICTORY / DEFEAT / DRAW) and flavor text,
  - rows for rounds, both LPs, both GYs, and total packs,
  - a "+1 📦" row on a win,
  - "⚔ Duel Again" (restarts the duel after 200 ms) and "Return to Menu" (navigates to `index.html`).

---

## 17. Audio (`04-audio.js`)

### 17.1 Graph

```
oscillators/noise → sfxGain      → masterGain → destination
ambient sources   → ambientBusGain → masterGain → destination
```

- `masterGain` default 0.5, `sfxGain` 0.85, `ambientBusGain` 0.75. These are overridden by saved settings on `initAudio` via `applyVolumeSettings()`.

### 17.2 Ambient bed (`startAmbient`)

- Two detuned sine drones at 55 Hz / 55.35 Hz.
- A triangle-wave pad on `[110, 130.81, 164.81]` Hz, gently modulated by a 0.07 Hz LFO.
- Pink-ish filtered noise (lowpass ~260 Hz, LFO-swept) for wind.
- A drum pattern (two sine thumps per ~5.2 s).
- Random chimes from a pentatonic-ish set every ~3.5 s.
- A feedback delay (0.44 s, 0.48 feedback) is used as a send.

`stopAmbient()` fades out over 1 s, clears the drum/chime intervals, and stops all sources after 1.3 s.

### 17.3 SFX

`playTone(freq, dur, type, vol, delay)` and `playNoise(dur, vol, filterFreq, delay)` are the primitives.

The `sfx(kind)` dispatcher covers: `draw`, `summon`, `attack`, `damage`, `destroy`, `grave`, `recycle`, `flip`, `reveal`, `win`, `lose`, `click`, `hover`. `deny` is referenced in the menu gating but is not currently handled in the switch — it falls through to silence.

---

## 18. Settings (`17-settings.js`)

### 18.1 Public API

- `getSetting(key)`, `setSetting(key, value, { silent })`.
- `applyAllSettings()` re-reads `save.settings` and re-applies volume, animation speed, visual toggles, and hover preview.
- `applyVolumeSettings()` uses `setTargetAtTime` for smooth ramping and also caches values in `pendingVolumes` so `initAudio()` can pick them up **before** the AudioContext exists.
- `applyAnimationSpeed()` sets the `--anim-speed` CSS variable (`fast: 0.55`, `normal: 1`, `relaxed: 1.6`).
- `applyVisualToggles()` toggles body classes: `no-shake`, `no-particles`, `no-bg-particles`, `no-holo`.
- `applyHoverPreviewSetting()` writes to the global `hoverPreviewEnabled`, updates the toggle button, and hides any open preview when disabling.

### 18.2 UI

`syncSettingsUI()` reflects the settings into the overlay's sliders, switches, and segmented buttons. Sliders use a `--fill` CSS variable for the track fill. The `change` event on the master/SFX sliders plays a preview tone.

### 18.3 Wiring

`wireSettingsControls()`:

- Tabs, sliders, switches (click + space/enter), segmented buttons.
- `#settingsReset` → confirms and resets to defaults.
- `#settingsDone` and `.settings-close` close the overlay.
- Clicking the backdrop closes.
- `Escape` closes the overlay when it's open.
- `S` opens the overlay when not typing and the duel screen isn't active.

`wireMenuSettingsButton()` wires `#btnSettings` with `{ once: true }`-like behaviour via `dataset.wired`.

---

## 19. Navigation (`18-nav.js`)

A self-contained IIFE that builds a `.page-nav` `<nav>` with four links: Home, Duel, Deck, Packs. The current page gets `.active` and `aria-current="page"`. Icons come from the injected SVG sprite. It runs on `DOMContentLoaded` (or immediately if already past it).

---

## 20. FX & Utility (`05-utils.js`)

- `wait(ms)` — promise-based delay.
- `shuffle(a)` — Fisher–Yates, in place.
- `setStatus(text, kind)` — updates `#status`; supports `warn` and `grave` classes; re-triggers the `pop` animation.
- `floatDamage(text, color, anchorEl)` — creates a `.floatDmg` element centered on the anchor and removes it after 1.35 s.
- `spawnParticles(x, y, count, color, spread)` — respects `settings.particles`.
- `screenShake()` — respects `settings.screenShake`.
- `flashRed()` — respects `settings.particles`.
- `spawnSummonRing(x, y)` — respects `settings.particles`.
- `showScreen(name)` — removes `.active` from the five known screens and adds it to the requested one. (Note: `16-boot.js` also has its own `activateScreen` helper that operates on `.screen` elements generally.)

---

## 21. Sprite Symbols (`00-sprite.js`)

The sprite is injected **synchronously** with `insertAdjacentHTML('afterend', ...)` on `document.currentScript` so that any `<use href="#id">` in the rest of the page resolves immediately. Symbols defined:

`eye-wdjat`, `ankh`, `sword`, `shield`, `tomb`, `deck`, `cards`, `skull`, `star`, `priest`, `anubis`, `summon-circle`.

The first ten are simple monochrome icons that inherit `currentColor`; `priest` and `anubis` are detailed multi-color character portraits; `summon-circle` is a 200×200 ritual circle used by the summon animation.

---

## 22. End-to-End Flow Summary

```
Boot
 └─ ensurePool → cardMap → loadSave → applySettings → prune → starter deck (if fresh)
     ├─ index        → updateMenuUI → main menu
     ├─ deck-builder → renderDeckBuilder
     ├─ packs        → openPackScreen
     └─ game         → startDuel
                        ├─ build decks (player from save, opp power-matched)
                        ├─ draw 5 each
                        └─ startPlayerTurn
                             ├─ (round ≥ 2) draw
                             ├─ select hand card → summon / replace
                             ├─ select field monster → switch / discard / attack
                             ├─ resolveBattle (direct or vs target)
                             └─ endPlayerTurn → startOpponentTurn
                                  ├─ draw
                                  ├─ summon loop (up to 2, replaces if better)
                                  ├─ flip defenders to attack (round ≥ 2)
                                  ├─ attack loop (round ≥ 2)
                                  └─ currentRound++ → startPlayerTurn
                                       └─ checkGameOver → win/lose → +1 pack on win
```

---

## 23. Rules at a Glance

- Both duelists start at **8000 LP**.
- Each side has **3 monster zones** and may summon/replace **2 monsters per turn**.
- A monster may be summoned in **ATK** or **DEF** position.
- **Round 1** is a setup round: no attacks from either side.
- A monster that has attacked cannot attack again that turn, nor change position.
- A monster may change position once per turn, only if it hasn't attacked.
- A monster may be **discarded** to the graveyard from the field at any time during the main phase (doesn't cost a summon).
- Battles resolve as described in §13.
- When a deck runs out, the owner's graveyard is shuffled back in as the new deck.
- Winning awards **+1 pack**.
- A pack contains **5 cards**, drawn from weighted rarity buckets.

---

## 24. Notable Implementation Details & Edge Cases

- **Save guards**: `saveGame()` refuses to write if the reset generation changed since boot — this prevents a stale tab from resurrecting a deleted save.
- **Starter-deck repair**: the boot code distinguishes a genuinely fresh profile from a partial one using `packs === 0 && wins === 0 && losses === 0`. This means a player who has *never* opened a pack or finished a duel but *has* edited their deck might still be reset to a starter — an intentional trade-off documented in the boot comments.
- **Unique monster ids**: `monsterIdCounter` gives every field monster a runtime id independent of the card id. This is what makes `data-monster-id` lookups safe even when the same card is present multiple times.
- **Rendered-monster set**: `renderedMonsterIds` is added to when a monster is first drawn and removed when it leaves the field (destroyed, replaced, discarded). This is how the renderer knows to play the summon animation exactly once per monster.
- **Hover preview**: gated by `hoverPreviewEnabled` everywhere; even pack cards and deck tiles respect it.
- **Audio unlock**: browsers block AudioContext until a user gesture, so `initAudio()` + `startAmbient()` are attached to the first click/touchstart with `{ once: true }`.
- **Volume before audio**: `pendingVolumes` caches the desired gains so `applyVolumeSettings()` can be called safely before `initAudio()` and will be respected the moment the audio graph exists.
- **`deny` SFX**: referenced by menu gating but not implemented in the `sfx()` switch — a silent fall-through.