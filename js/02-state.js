/* ============================================================
   STATE — shared mutable state
============================================================ */
let pool = [];
const cardMap = new Map();
let save = { collection:{}, deck:[], packs:0, wins:0, losses:0 };
let monsterIdCounter = 0;
const renderedMonsterIds = new Set();

const S = {
  playerLP: START_LP, oppLP: START_LP,
  playerField: [null,null,null], oppField: [null,null,null],
  playerDeck: [], playerHand: [], playerGraveyard: [],
  oppDeck: [], oppHand: [], oppGraveyard: [],
  selectedHandIdx: -1, selectedAttackerId: null,
  awaitingTarget: false, pendingReplaceSlot: -1,
  turn: 'player', phase: 'idle', busy: true, over: false,
  currentRound: 1, summonsThisTurn: 0
};

/* Deck builder UI state */
let dbSortMode = 'atk-desc';
let dbSearchQuery = '';
let packState = { cards: [], revealed: 0 };



let hoverPreviewEnabled = true;