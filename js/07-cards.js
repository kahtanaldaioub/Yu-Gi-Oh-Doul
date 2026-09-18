/* ============================================================
   CARDS — pool fetching, card helpers, starter deck
============================================================ */
function normalizeCard(c){
  return { id: c.id, name: c.name, atk: c.atk, def: c.def, img: c.card_images[0].image_url_small };
}

function isPlayableMonster(c){
  return c && typeof c.name === 'string' && typeof c.type === 'string'
    && c.type.indexOf('Monster') !== -1
    && typeof c.atk === 'number' && typeof c.def === 'number'
    && c.atk >= 300 && c.atk <= 4500
    && c.card_images && c.card_images.length > 0 && c.card_images[0].image_url_small;
}

function getCard(id){ return cardMap.get(id); }

function makeMonster(card, position){
  return { id: ++monsterIdCounter, card, position, hasAttacked: false };
}

async function ensurePool(onProgress){
  try{
    const cached = localStorage.getItem(POOL_KEY);
    if(cached){
      const parsed = JSON.parse(cached);
      if(Array.isArray(parsed) && parsed.length > 300){
        const unique = [...new Map(parsed.filter(c => c && c.id).map(c => [c.id, c])).values()];
        if(unique.length > 300){
          if(onProgress) onProgress(`Loaded ${unique.length} cards from the tablets`);
          return unique;
        }
      }
    }
  }catch(e){}
  if(onProgress) onProgress('Summoning card database…');
  const batches = 7, perBatch = 220;
  const promises = [];
  for(let i = 0; i < batches; i++){
    const offset = i * 500 + Math.floor(Math.random()*200);
    promises.push(fetch(`${API}/cardinfo.php?num=${perBatch}&offset=${offset}`).then(r => r.json()).catch(() => null));
  }
  const results = await Promise.all(promises);
  const seen = new Set(); const collected = [];
  for(const r of results){
    if(!r || !Array.isArray(r.data)) continue;
    for(const c of r.data){
      if(!isPlayableMonster(c)) continue;
      if(seen.has(c.id)) continue;
      seen.add(c.id); collected.push(normalizeCard(c));
    }
  }
  if(collected.length < 200) throw new Error('Not enough cards');
  const trimmed = collected.slice(0, POOL_TARGET);
  try{ localStorage.setItem(POOL_KEY, JSON.stringify(trimmed)); }catch(e){}
  if(onProgress) onProgress(`Summoned ${trimmed.length} cards`);
  return trimmed;
}

/* ===== Starter deck ===== */
function pickStarterCards(pool, count){
  const preferred = pool.filter(c => c.atk >= 900 && c.atk <= 2600);
  const fallback = pool.filter(c => c.atk > 2600 && c.atk <= 3500);
  const seen = new Set();

  // Favor balanced monsters, then fill from the complete playable pool so
  // randomized API batches can never create a partial starter deck.
  const source = [
    ...shuffle([...preferred]),
    ...shuffle([...fallback]),
    ...shuffle([...pool])
  ];
  const shuffled = source;
  const out = [];
  for(const c of shuffled){
    if(seen.has(c.id)) continue;
    seen.add(c.id); out.push(c);
    if(out.length >= count) break;
  }
  if(out.length > 0){
    for(let i = 0; out.length < count; i++) out.push(out[i % out.length]);
  }
  return out;
}

function createStarterDeck(){
  const cards = pickStarterCards(pool, STARTER_DECK_SIZE);
  if(cards.length < STARTER_DECK_SIZE){
    throw new Error(`Could only create ${cards.length} of ${STARTER_DECK_SIZE} starter cards`);
  }
  save.collection = {}; save.deck = [];
  for(const c of cards){
    save.collection[c.id] = (save.collection[c.id] || 0) + 1;
    save.deck.push(c.id);
  }
  save.starterInitialized = true;
  save.starterDeckSize = STARTER_DECK_SIZE;
  save.starterDeckComplete = save.deck.length === STARTER_DECK_SIZE;
}