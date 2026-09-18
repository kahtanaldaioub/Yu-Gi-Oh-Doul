/* ============================================================
   DOM — cached element references
============================================================ */
const $ = s => document.querySelector(s);

const dom = {
  loadingScreen:$('#loadingScreen'),loadingText:$('#loadingText'),loadingSub:$('#loadingSub'),
  mainMenu:$('#mainMenu'),deckBuilder:$('#deckBuilder'),packScreen:$('#packScreen'),duelScreen:$('#duelScreen'),
  overlay:$('#overlay'),overlayPanel:$('#overlayPanel'),
  statWins:$('#statWins'),statCards:$('#statCards'),statDeck:$('#statDeck'),
  playDeckCount:$('#playDeckCount'),deckCountBadge:$('#deckCountBadge'),packCount:$('#packCount'),
  btnPlay:$('#btnPlay'),btnDeck:$('#btnDeck'),btnPacks:$('#btnPacks'),btnReset:$('#btnReset'),
  deckList:$('#deckList'),collectionGrid:$('#collectionGrid'),
  dbDeckCount:$('#dbDeckCount'),dbCollCount:$('#dbCollCount'),
  dbClear:$('#dbClear'),dbDone:$('#dbDone'),
  dbSearch:$('#dbSearch'),dbSort:$('#dbSort'),cardPreview:$('#cardPreview'),
  packCards:$('#packCards'),packIntro:$('#packIntro'),pkDone:$('#pkDone'),pkBack:$('#pkBack'),
  oppLPText:$('#oppLPText'),oppLPFill:$('#oppLPFill'),oppLPBar:$('#oppLPBar'),
  playerLPText:$('#playerLPText'),playerLPFill:$('#playerLPFill'),playerLPBar:$('#playerLPBar'),
  oppZone:$('#oppZone'),playerZone:$('#playerZone'),
  oppGrid:$('#oppGrid'),playerGrid:$('#playerGrid'),oppLabel:$('#oppLabel'),
  status:$('#status'),handCards:$('#handCards'),controls:$('#controls'),
  oppGYBadge:$('#oppGYBadge'),oppGYCount:$('#oppGYCount'),
  playerGYBadge:$('#playerGYBadge'),playerGYCount:$('#playerGYCount'),
  gyOverlay:$('#gyOverlay'),gyTitle:$('#gyTitle'),gySub:$('#gySub'),gyBody:$('#gyBody'),
  gyClose:$('#gyClose'),gyCloseBtn2:$('#gyCloseBtn2'),
  oppDeckInfo:$('#oppDeckInfo'),oppHandInfo:$('#oppHandInfo'),
  playerDeckInfo:$('#playerDeckInfo'),playerHandInfo:$('#playerHandInfo'),
    hoverToggle:$('#hoverToggle'),
    settingsOverlay:$('#settingsOverlay'),
};