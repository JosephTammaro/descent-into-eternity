// ══════════════════════════════════════════════════════════
//  ELDERFEN — Full RPG Maker Town Engine
//  Scrolling camera, interiors, wandering NPCs, gate guard
// ══════════════════════════════════════════════════════════

// ── Per-visit state ───────────────────────────────────────
const TOWN = {
  blessingUsed:    false,
  tavernDrinkUsed: false,
  forgeVisited:    false,
  _sharpenApplied: false,
};

// ── Engine state ──────────────────────────────────────────
let _tc = null, _tx = null, _tRAF = null, _tRunning = false;
let _dialogSrcX = null, _dialogSrcY = null;
let _tScene = 'exterior'; // 'exterior' | interior id
let _tZone  = 0;

const TILE = 16;
const DRAW_SCALE = 3; // render at 3x so tiles fill the screen

// ── Player ────────────────────────────────────────────────
const _pl = {
  wx:0, wy:0,       // world pixel position
  facing:2,         // 0=up 1=right 2=down 3=left
  speed:1.8,
};
const _keys = {};

// ── Camera ────────────────────────────────────────────────
// Viewport in tiles — will be set on init based on canvas size
let VP_COLS = 15, VP_ROWS = 11;
let _camX = 0, _camY = 0; // world-pixel offset of camera top-left

// ══════════════════════════════════════════════════════════
//  EXTERIOR MAP  (60 × 48 tiles)
// ══════════════════════════════════════════════════════════
const EXT_COLS = 60, EXT_ROWS = 48;

// Tile ids: 0=grass 1=path 2=water 3=wall/border 4=darkgrass 5=flowers
// prettier-ignore
function _buildExtMap() {
  const M = [];
  for (let r = 0; r < EXT_ROWS; r++) {
    M.push(new Uint8Array(EXT_COLS));
  }
  // Fill with grass
  for (let r = 0; r < EXT_ROWS; r++)
    for (let c = 0; c < EXT_COLS; c++)
      M[r][c] = (r === 0 || r === EXT_ROWS-1 || c === 0 || c === EXT_COLS-1) ? 3 : 0;

  // Main roads
  for (let r = 1; r < EXT_ROWS-1; r++) { M[r][29] = 1; M[r][30] = 1; } // vertical main
  for (let c = 1; c < EXT_COLS-1; c++) { M[23][c] = 1; M[24][c] = 1; } // horizontal main

  // Side paths
  for (let r = 1; r < 23; r++) { M[r][15] = 1; M[r][44] = 1; }
  for (let r = 25; r < EXT_ROWS-1; r++) { M[r][15] = 1; M[r][44] = 1; }
  for (let c = 1; c < 29; c++) { M[12][c] = 1; M[36][c] = 1; }
  for (let c = 31; c < EXT_COLS-1; c++) { M[12][c] = 1; M[36][c] = 1; }

  // Flower patches
  const flowerSpots = [[3,3],[3,55],[44,3],[44,55],[10,7],[10,50],[38,7],[38,50],[20,20],[20,38],[28,20],[28,38]];
  for (const [r,c] of flowerSpots) {
    for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) {
      if (r+dr>0&&r+dr<EXT_ROWS-1&&c+dc>0&&c+dc<EXT_COLS-1&&M[r+dr][c+dc]===0)
        M[r+dr][c+dc] = 5;
    }
  }

  // Water pond (left side)
  for (let r=16;r<=20;r++) for (let c=3;c<=8;c++) M[r][c]=2;
  // Water pond (right side)
  for (let r=16;r<=20;r++) for (let c=50;c<=56;c++) M[r][c]=2;
  // Small pond bottom
  for (let r=28;r<=32;r++) for (let c=3;c<=7;c++) M[r][c]=2;
  for (let r=28;r<=32;r++) for (let c=51;c<=57;c++) M[r][c]=2;

  return M;
}
const EXT_MAP = _buildExtMap();

// ── Exterior buildings ────────────────────────────────────
// Each: { id, label, tx, ty, tw, th, pal, doorTx, doorTy, interior }
const EXT_BUILDINGS = [
  // ── NORTH QUARTER (above main road) ──
  { id:'gate',       label:'⚔ Dungeon Gate',       tx:27, ty:1,  tw:6, th:4,  pal:5, doorTx:29, doorTy:4,  interior:null },
  { id:'inn',        label:'The Broken Compass',    tx:3,  ty:2,  tw:7, th:7,  pal:6, doorTx:6,  doorTy:8,  interior:'inn' },
  { id:'store',      label:'Mirela\'s Goods',        tx:17, ty:2,  tw:6, th:6,  pal:7, doorTx:19, doorTy:7,  interior:'store' },
  { id:'temple',     label:'Shrine of Seraphine',   tx:33, ty:2,  tw:7, th:7,  pal:1, doorTx:36, doorTy:8,  interior:'temple' },
  { id:'house1',     label:'',                      tx:42, ty:3,  tw:5, th:5,  pal:8, doorTx:44, doorTy:7,  interior:'house1' },
  { id:'house2',     label:'',                      tx:50, ty:3,  tw:5, th:5,  pal:8, doorTx:52, doorTy:7,  interior:'house2' },
  // ── MIDDLE QUARTER ──
  { id:'noticeboard',label:'Notice Board',          tx:27, ty:14, tw:6, th:4,  pal:4, doorTx:29, doorTy:17, interior:null },
  { id:'tavern',     label:'The Rusted Flagon',     tx:2,  ty:14, tw:9, th:8,  pal:0, doorTx:6,  doorTy:21, interior:'tavern' },
  { id:'market',     label:'Market District',       tx:17, ty:14, tw:8, th:8,  pal:9, doorTx:20, doorTy:21, interior:'market' },
  { id:'study',      label:"Malachar's Study",      tx:34, ty:14, tw:7, th:8,  pal:3, doorTx:37, doorTy:21, interior:'study' },
  { id:'house3',     label:'',                      tx:43, ty:15, tw:5, th:5,  pal:8, doorTx:45, doorTy:19, interior:'house3' },
  { id:'house4',     label:'',                      tx:50, ty:15, tw:5, th:5,  pal:8, doorTx:52, doorTy:19, interior:'house4' },
  // ── SOUTH QUARTER ──
  { id:'forge',      label:"Aldric's Forge",        tx:2,  ty:27, tw:8, th:8,  pal:2, doorTx:5,  doorTy:34, interior:'forge' },
  { id:'house5',     label:'',                      tx:17, ty:28, tw:5, th:5,  pal:8, doorTx:19, doorTy:32, interior:'house5' },
  { id:'house6',     label:'',                      tx:17, ty:35, tw:5, th:5,  pal:8, doorTx:19, doorTy:39, interior:'house6' },
  { id:'proving',    label:'The Proving Grounds',    tx:35, ty:38, tw:7, th:7,  pal:11, doorTx:38, doorTy:44, interior:'proving' },
  { id:'house7',     label:'',                      tx:24, ty:28, tw:5, th:5,  pal:8, doorTx:26, doorTy:32, interior:'house7' },
  { id:'graveyard',  label:'Graveyard',             tx:34, ty:27, tw:10,th:10, pal:10,doorTx:38, doorTy:36, interior:null },
  { id:'house8',     label:'',                      tx:46, ty:28, tw:5, th:5,  pal:8, doorTx:48, doorTy:32, interior:'house8' },
  { id:'house9',     label:'',                      tx:53, ty:28, tw:5, th:5,  pal:8, doorTx:55, doorTy:32, interior:'house9' },
];

// Building colour palettes [wall, roof, accent, dark, floor]
const BPAL = [
  ['#5a3a18','#8a2010','#c8702a','#2a1808','#3a2810'], // 0 tavern
  ['#2a2a6a','#1a1a8a','#6060c0','#10103a','#181840'], // 1 temple
  ['#5a2a10','#8a1800','#c03010','#281008','#3a1808'], // 2 forge
  ['#2a1a4a','#3a0a6a','#8040c0','#180830','#200a38'], // 3 study
  ['#4a3a18','#6a4a18','#c8a030','#201808','#302010'], // 4 notice
  ['#1a1008','#601010','#c03030','#100808','#200808'], // 5 gate
  ['#3a2a18','#6a4020','#c8902a','#1a1008','#2a1a08'], // 6 inn
  ['#2a3a18','#3a5a18','#70a030','#101808','#182008'], // 7 store (green)
  ['#3a2818','#503818','#906830','#1a1008','#2a1808'], // 8 house
  ['#3a2a08','#5a3a08','#b08020','#181008','#201808'], // 9 market
  ['#1a1a18','#2a2a28','#504848','#080808','#101010'], // 10 graveyard
  ['#4a3828','#6a3418','#c08040','#1a1008','#2a1a10'], // 11 proving grounds (warm stone/bronze)
];

// ── Exterior decorations ──────────────────────────────────
const EXT_DECORS = [
  // Trees around border
  ...[2,5,8,11,14].map(c=>({type:'tree',tx:c,ty:2})),
  ...[2,5,8,11,14].map(c=>({type:'tree',tx:c,ty:45})),
  ...[2,5,8,11,14].map(c=>({type:'tree',tx:EXT_COLS-3-c,ty:2})),
  ...[2,5,8,11,14].map(c=>({type:'tree',tx:EXT_COLS-3-c,ty:45})),
  ...[4,8,12,16,20,28,32,36,40,44].map(r=>({type:'tree',tx:1,ty:r})),
  ...[4,8,12,16,20,28,32,36,40,44].map(r=>({type:'tree',tx:EXT_COLS-2,ty:r})),
  // Lamps along roads
  {type:'lamp',tx:28,ty:5},{type:'lamp',tx:31,ty:5},
  {type:'lamp',tx:28,ty:19},{type:'lamp',tx:31,ty:19},
  {type:'lamp',tx:28,ty:28},{type:'lamp',tx:31,ty:28},
  {type:'lamp',tx:28,ty:43},{type:'lamp',tx:31,ty:43},
  {type:'lamp',tx:14,ty:23},{type:'lamp',tx:43,ty:23},
  {type:'lamp',tx:14,ty:12},{type:'lamp',tx:43,ty:12},
  {type:'lamp',tx:14,ty:36},{type:'lamp',tx:43,ty:36},
  // Wells
  {type:'well',tx:11,ty:23},{type:'well',tx:47,ty:23},
  // Market stalls
  {type:'stall',tx:18,ty:22},{type:'stall',tx:22,ty:22},
  {type:'stall',tx:18,ty:25},{type:'stall',tx:22,ty:25},
  // Gravestones now drawn inside the graveyard building renderer
  // Barrels
  {type:'barrel',tx:12,ty:14},{type:'barrel',tx:13,ty:14},
  {type:'barrel',tx:45,ty:14},{type:'barrel',tx:46,ty:14},
  // Grace Vault — beside the dungeon gate
  {type:'graceVault',tx:25,ty:3},
  // Stash Chest — other side of the dungeon gate
  {type:'stashChest',tx:22,ty:8},
];

// ══════════════════════════════════════════════════════════
//  INTERIOR MAPS  (20 × 15 tiles each)
// ══════════════════════════════════════════════════════════
const INT_W = 20, INT_H = 15;
// Tile ids: 0=floor 1=wall 2=counter 3=rug 4=fireplace 5=bookshelf 6=bed 7=altar 8=anvil 9=table

const INTERIORS = {
  tavern: {
    label: 'The Rusted Flagon',
    exitTx: 9, exitTy: 13, // where player appears when exiting
    spawnTx: 9, spawnTy: 12,
    bgm: 'campfire',
    // 0=floor 1=wall 2=bar/counter 3=rug 4=fireplace 9=table 10=window 11=torch 12=chest 14=plant
    map: [
      [1, 1, 1, 1, 1, 1, 1,10, 1,10, 1,10, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1,11, 0, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 0,11, 1],
      [1, 0, 0, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 9, 9, 0, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 9, 9, 0, 0, 1],
      [1, 0, 9, 9, 0, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 9, 9, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 1],
      [1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0,12, 0, 0, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0,14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,14, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    npcs: [
      { id:'rook',    label:'Rook',       tx:5,  ty:9,  color:'#c8a020', icon:'🍺', stationary:true, onInteract:()=>townOpenDialog('tavern') },
      { id:'patron1', label:'Old Ferris', tx:4,  ty:3,  color:'#806040', icon:'👴', stationary:false, lines:['z_patron1'] },
      { id:'patron2', label:'Marta',      tx:13, ty:3,  color:'#a06080', icon:'👩', stationary:false, lines:['z_patron2'] },
      { id:'bard',    label:'Pell',       tx:16, ty:6,  color:'#408060', icon:'🎵', stationary:true,  lines:['z_bard'] },
    ],
  },
  temple: {
    label: 'Shrine of Seraphine',
    exitTx: 9, exitTy: 13,
    spawnTx: 9, spawnTy: 11,
    bgm: 'campfire',
    map: [
      [1, 1,10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,10, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 1],
      [1,11, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0,11, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 1],
      [1, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 3, 3, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 3, 3, 0, 0, 1],
      [1, 0, 3, 3, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 3, 3, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1,14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,14, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    npcs: [
      { id:'seraphine', label:'Seraphine', tx:9, ty:3, color:'#a0c4ff', icon:'⛪', stationary:true, onInteract:()=>townOpenDialog('temple') },
      { id:'worshipper1', label:'Brother Ewan', tx:2, ty:5, color:'#c0c0c0', icon:'🙏', stationary:true, lines:['z_worshipper1'] },
      { id:'worshipper2', label:'Sister Lena',  tx:16,ty:5, color:'#d0c0e0', icon:'🙏', stationary:true, lines:['z_worshipper2'] },
    ],
  },
  forge: {
    label: "Aldric's Forge",
    exitTx: 9, exitTy: 13,
    spawnTx: 9, spawnTy: 11,
    bgm: 'campfire',
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1,11, 8, 8, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0,15,15, 0,11, 1],
      [1, 0, 8, 8, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0,15,15, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 0, 0, 0, 0, 1],
      [1, 0, 0, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 0,12, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    npcs: [
      { id:'aldric', label:'Aldric', tx:9, ty:5, color:'#ff7030', icon:'⚒', stationary:true, onInteract:()=>townOpenDialog('forge') },
      { id:'apprentice', label:'Tam', tx:3, ty:2, color:'#806040', icon:'🔨', stationary:true, lines:['z_apprentice'] },
    ],
  },
  study: {
    label: "Malachar's Study",
    exitTx: 9, exitTy: 13,
    spawnTx: 9, spawnTy: 11,
    bgm: 'campfire',
    map: [
      [1, 1, 1, 1, 1, 1, 1,10, 1, 1, 1, 1,10, 1, 1, 1, 1, 1, 1, 1],
      [1, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 5, 1],
      [1, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 5, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 9, 9, 9, 9, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 9, 9, 9, 9, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 1],
      [1, 5, 5, 0, 0, 0, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 5, 5, 5, 1],
      [1, 0, 0, 0, 0, 0, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,12, 0, 1],
      [1, 0,14, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0,16, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    npcs: [
      { id:'malachar', label:'Malachar', tx:9, ty:4, color:'#c090ff', icon:'📚', stationary:true, onInteract:()=>townOpenDialog('malachar') },
      { id:'scribe',   label:'Petra',   tx:17, ty:9, color:'#90a0c0', icon:'📜', stationary:true, lines:['z_scribe'] },
    ],
  },
  inn: {
    label: 'The Broken Compass',
    exitTx: 9, exitTy: 13,
    spawnTx: 9, spawnTy: 11,
    bgm: 'campfire',
    map: [
      [1, 1,10, 1, 1,10, 1, 1, 1, 1, 1, 1, 1,10, 1, 1,10, 1, 1, 1],
      [1, 6, 6, 0, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 6, 1],
      [1, 6, 6, 0, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 6, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0,14, 0, 0, 0,11, 0, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 9, 9, 9, 9, 9, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 9, 9, 9, 9, 9, 1],
      [1, 0,11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 6, 6, 0, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0,12, 0, 0, 0, 1],
      [1, 6, 6, 0, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    npcs: [
      { id:'innkeeper', label:'Rosalind', tx:5, ty:5, color:'#c09070', icon:'🏨', stationary:true, lines:['z_innkeeper'] },
      { id:'traveler',  label:'Vagrant',  tx:13,ty:7, color:'#806050', icon:'🧳', stationary:false, lines:['z_traveler'] },
    ],
  },
  store: {
    label: "Mirela's Goods",
    exitTx: 9, exitTy: 13,
    spawnTx: 9, spawnTy: 11,
    bgm: 'campfire',
    map: [
      [1, 1, 1,10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,10, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 9, 9, 0, 0, 9, 9, 0, 0, 9, 9, 0, 0, 9, 9, 0,11, 0, 1],
      [1, 0, 9, 9, 0, 0, 9, 9, 0, 0, 9, 9, 0, 0, 9, 9, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1,14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,14, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0,12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,12, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    npcs: [
      { id:'mirela', label:'Mirela', tx:10, ty:2, color:'#70a030', icon:'🛍', stationary:true, onInteract:()=>townOpenDialog('mirela_shop') },
      { id:'customer', label:'Customer', tx:5, ty:6, color:'#a07050', icon:'👤', stationary:false, lines:['z_customer'] },
    ],
  },
  market: {
    label: 'Market District',
    exitTx: 9, exitTy: 13,
    spawnTx: 9, spawnTy: 11,
    bgm: 'campfire',
    map: [
      [1, 1,10, 1, 1, 1,10, 1, 1, 1, 1, 1,10, 1, 1, 1,10, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 2, 2, 2, 0, 0, 2, 2, 2, 0, 0, 2, 2, 2, 0, 0, 2, 2, 2, 1],
      [1, 2, 2, 2, 0, 0, 2, 2, 2, 0, 0, 2, 2, 2, 0, 0, 2, 2, 2, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1,11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,11, 1],
      [1, 2, 2, 2, 0, 0, 2, 2, 2, 0, 0, 2, 2, 2, 0, 0, 2, 2, 2, 1],
      [1, 2, 2, 2, 0, 0, 2, 2, 2, 0, 0, 2, 2, 2, 0, 0, 2, 2, 2, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1,14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,14, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    npcs: [
      { id:'vendor1', label:'Cassia', tx:2,  ty:2, color:'#c08040', icon:'🏪', stationary:true, lines:['z_vendor1'] },
      { id:'vendor2', label:'Dunk',   tx:7,  ty:6, color:'#806080', icon:'🏪', stationary:true, lines:['z_vendor2'] },
      { id:'shopper', label:'Shopper',tx:12, ty:8, color:'#a08060', icon:'👤', stationary:false, lines:['z_shopper'] },
    ],
  },
  // Generic houses
  house1:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(0),npcs:[{id:'resident',label:'Aldren',tx:15,ty:9, color:'#c09060',icon:'👤',stationary:true,lines:['z_house1']}] },
  house2:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(1),npcs:[{id:'resident',label:'Gira',  tx:15,ty:9, color:'#d090a0',icon:'👤',stationary:true,lines:['z_house2']}] },
  house3:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(2),npcs:[{id:'resident',label:'Orin',  tx:15,ty:9, color:'#90a0c0',icon:'👤',stationary:true,lines:['z_house3']}] },
  house4:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(3),npcs:[{id:'resident',label:'Brynn', tx:15,ty:9, color:'#b0c090',icon:'👤',stationary:true,lines:['z_house4']}] },
  house5:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(0),npcs:[{id:'resident',label:'Cael',  tx:15,ty:9, color:'#c0a070',icon:'👤',stationary:true,lines:['z_house5']}] },
  house6:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(1),npcs:[{id:'resident',label:'Wren',  tx:15,ty:9, color:'#a0b0d0',icon:'👤',stationary:true,lines:['z_house6']}] },
  house7:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(2),npcs:[{id:'resident',label:'Moss',  tx:15,ty:9, color:'#80a080',icon:'👤',stationary:true,lines:['z_house7']}] },
  house8:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(3),npcs:[{id:'resident',label:'Dalla', tx:15,ty:9, color:'#d0b080',icon:'👤',stationary:true,lines:['z_house8']}] },
  house9:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(0),npcs:[{id:'resident',label:'Varn',  tx:15,ty:9, color:'#c0a0b0',icon:'👤',stationary:true,lines:['z_house9']}] },
  proving: {
    label: 'The Proving Grounds',
    exitTx: 9, exitTy: 13,
    spawnTx: 9, spawnTy: 11,
    bgm: 'campfire',
    // 0=floor 1=wall 2=counter 3=rug 9=table 10=window 11=torch 15=weaponRack 8=anvil
    map: [
      [1, 1,10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,10, 1, 1],
      [1,15,15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,15,15, 0, 1],
      [1,15,15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,15,15, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 1],
      [1,11, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0,11, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 0, 0, 0, 1],
      [1, 0, 0, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,12, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0,14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,14, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    npcs: [
      { id:'vareth', label:'Vareth', tx:3, ty:9, color:'#c08040', icon:'🏛', stationary:true, onInteract:()=>townOpenDialog('upgrades') },
      { id:'trainee', label:'Kael', tx:14, ty:7, color:'#908060', icon:'🗡', stationary:false, lines:['z_trainee'] },
    ],
  },
};

function _makeHouseMap(variant) {
  const v = (variant||0) % 4;
  if(v===0){
    // Modest cottage: corner fireplace, bed, kitchen counter, window light
    return [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1,10,10, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 2, 2, 0, 0, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 2, 2, 0, 0, 9, 9, 0, 3, 3, 3, 3, 0, 0, 9, 9, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 9, 9, 0, 3, 3, 3, 3, 0, 0, 9, 9, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0,14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
  } else if(v===1){
    // Family home: two beds, two fireplaces, dining table, windows
    return [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 6, 6, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 6, 6, 0, 1],
      [1, 0, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 1],
      [1,11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,11, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 0, 1, 1, 1,10,10, 1, 1, 1, 0, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 9, 9, 9, 0, 3, 3, 3, 3, 3, 3, 0, 9, 9, 9, 0, 0, 1],
      [1, 0, 0, 9, 9, 9, 0, 3, 3, 3, 3, 3, 3, 0, 9, 9, 9, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 2, 2, 2, 0,14, 0, 0, 0, 0, 0, 0, 0, 0,12, 0, 2, 2, 2, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
  } else if(v===2){
    // Scholar's house: bookshelves, writing desk, single bed, cauldron
    return [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 1],
      [1, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1,10,10, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 1],
      [1, 5, 5, 0, 0, 0, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 5, 5, 5, 1],
      [1, 0, 0, 0, 0, 0, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0,16, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0,12, 0, 0, 2, 2, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
  } else {
    // Cramped quarters: everything packed, torches on walls, interior divider
    return [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 0, 1],
      [1, 0, 0, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 0, 0, 1],
      [1, 0, 9, 9, 0,11, 0, 3, 3, 3, 3, 3, 0,11, 0, 9, 9, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 2, 0,14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,12, 0, 0, 0, 2, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
  }
}

// Fix house interior exit coords (they were set inline badly above)
['house1','house2','house3','house4','house5','house6','house7','house8','house9'].forEach(id=>{
  if(INTERIORS[id]){ INTERIORS[id].exitTx=9; INTERIORS[id].exitTy=13; INTERIORS[id].spawnTx=9; INTERIORS[id].spawnTy=11; }
});

// ══════════════════════════════════════════════════════════
//  NPC DIALOGUE DATA
// ══════════════════════════════════════════════════════════
const NPC_LINES = {
  // Zone 0 (Whispering Woods) — Town alive, hopeful
  0: {
    z_patron1:   ["Been drinkin' here forty years. Rook's father ran this place. His grandfather too. Some things don't change.","I heard a traveler came back from the woods last week. Didn't say a word. Just sat down and ordered the whole barrel."],
    z_patron2:   ["The merchants from the capital haven't come through in three weeks. Road must be bad again.","Don't mind Old Ferris. He drinks to remember. The rest of us drink to forget."],
    z_bard:      ["I've got a new song. About the Gate. Nobody wants to hear it yet. They will.","Wrote something about the Thornwarden once. My lute strings snapped mid-verse. Twice."],
    z_worshipper1:["The Shrine has stood since before the town. Before the road. Before the name.","Light a candle before you go. It won't stop the dark but it reminds the dark you're still here."],
    z_worshipper2:["Seraphine blessed my harvest three years running. This year the field grew sideways. She says it's fine.","I pray every morning. I'm not sure anything hears me. I do it anyway."],
    z_apprentice: ["Aldric says I'm not ready for the enchanted work yet. He's been saying that for two years.","The anvil's older than the forge. Older than the town, Aldric says. I believe him."],
    z_scribe:    ["Malachar dictates, I transcribe. He speaks faster than any human should. I've developed opinions about that.","The Index of Lost Things. That's what I'm copying. It's very long."],
    z_innkeeper: ["Twelve rooms. Ten occupied. I don't ask where they're going. Better for everyone.","Sleep well. It's the one thing you can do for free in this world."],
    z_traveler:  ["Passing through. Heading east. Don't ask why east. Nobody asks why east.","The road to the Outpost is fine. The road back from the Outpost is where it gets complicated."],
    z_mirela:    ["Rope, torches, rations, bandages. Everything a sensible person takes into a dungeon. The sensible ones still don't come back.","I don't ask what people need the rope for anymore."],
    z_customer:  ["She charged me double for the lantern oil. Said demand is up. I said demand is always up when it's dark. She shrugged."],
    z_vendor1:   ["Fresh herbs from the south road. Not the cursed ones. Those look different. Probably.","Market's been slow. People are saving their coin. Smart, I suppose."],
    z_vendor2:   ["I sell maps. Old ones, new ones, ones that are probably wrong. The wrong ones are the most popular.","Nobody buys maps of places they've already been."],
    z_shopper:   ["Just looking. I've been just looking for an hour. I find it calming."],
    z_house1:    ["My grandfather built this house. He was a terrible carpenter. You can tell.","Lock your door at night. Not because of thieves. Just because it's polite."],
    z_house2:    ["I grow herbs on the windowsill. Basil, rosemary, something that might be poisonous. I haven't tested it yet."],
    z_house3:    ["My son went into the dungeon six months ago. He sends letters. The letters smell like stone.","I used to think the Gate was just a door. Now I know better. Now I don't sleep well."],
    z_house4:    ["I repair boots. Adventurer boots, mostly. You can tell a lot about a person from where their boots wear thin."],
    z_house5:    ["The children dare each other to touch the Gate at night. I was one of those children once. I touched it. Nothing happened. I still think about it."],
    z_house6:    ["My wife says to leave. I say leave for where? She hasn't answered yet. It's been six months."],
    z_house7:    ["I count the adventurers who go in. I don't count the ones who come out. The math gets depressing."],
    z_house8:    ["Nice night. Terrible omen. Those two things are related more often than people admit.","The trees were still last night. Not calm-still. Waiting-still."],
    z_house9:    ["I'm a retired guard. I guard my vegetable garden now. It's a better assignment."],
    z_trainee:   ["Vareth lets me practice with the weighted blades. My arms hurt all the time. He says that's progress.","The Proving Grounds used to be a barracks. Now it's... something else. Better, I think."],
  },

  // Zone 1 (Ruined Outpost) — Town quieter, worried
  1: {
    z_patron1:   ["Half the tables empty. Used to be you couldn't get a seat on market day. Now...","I'm not leaving. This is my stool. I've sat on this stool for thirty years. Whatever's coming can find me here."],
    z_patron2:   ["The Caldwell family packed up last week. Whole household. Wagon, dog, everything. Just... gone.","Rook's been quiet lately. When Rook goes quiet, something's wrong. Rook doesn't go quiet."],
    z_bard:      ["The song I wrote about the Thornwarden. People are asking for it now. I wish they weren't.","I'm thinking of leaving. My songs are getting darker and I think the town is making them that way."],
    z_worshipper1:["I've been praying twice a day. Then three times. Then I lost count.","The Shrine is cold at night. It was never cold before. Seraphine says it's the season. We both know it isn't."],
    z_worshipper2:["I asked Seraphine if the Gate could be sealed. She was quiet for a long time before she answered.","I've started keeping a candle burning all night. Just in case."],
    z_apprentice: ["Aldric's been working through the night. I asked him what he's making. He said: enough.","The enchanted orders are up. People want their weapons blessed. I don't ask for who."],
    z_scribe:    ["Malachar's been reading the same passage for three days. When I asked why, he said 'cross-reference'. He looked afraid.","Three scribes left last month. I stayed because... I honestly don't know why I stayed."],
    z_innkeeper: ["Eight rooms now. Two guests checked out without a word. Left their things. I boxed everything up.","I've started serving breakfast earlier. People aren't sleeping well. Might as well eat."],
    z_traveler:  ["I came from the east. I'm not going back. You'll understand if you go.","The Outpost road has soldiers on it now. Not our soldiers. I didn't ask whose."],
    z_mirela:    ["Sold out of bandages three times this week. I keep ordering more.","Someone bought everything I had in torches. Paid double. Didn't blink."],
    z_customer:  ["I'm buying supplies. For leaving. I'm not — I don't know. I'm just buying supplies."],
    z_vendor1:   ["Market's half empty. The herb sellers from the south stopped coming two weeks ago.","I'm selling at cost now. What's the point of profit if there's nowhere to spend it."],
    z_vendor2:   ["Sold three maps of the Outpost road this week. All to different people going the same direction. None of them came back to report.","My maps used to say 'here there be danger'. Now I just leave those parts blank."],
    z_shopper:   ["I don't even need anything. I just... needed to be somewhere with other people."],
    z_house1:    ["Boarded the east window. Not because of anything specific. Just... felt right.","I dreamed about the Gate last night. In the dream it was open. Wide open."],
    z_house2:    ["The herbs on the windowsill died. All of them at once. Overnight.","My neighbor left. The one after that is thinking about it. I am too."],
    z_house3:    ["My son's letters stopped coming. I still check every morning.","I sent a letter to the garrison. No response. That's an answer in itself."],
    z_house4:    ["Fewer boots to repair lately. People aren't traveling. Or they're traveling and not coming back.","I found a pair of boots left outside my door. Good quality. No note."],
    z_house5:    ["The children don't dare each other to touch the Gate anymore. They don't go near that street.","I caught my daughter drawing the Gate in the dirt. I scuffed it out. She drew it again in her sleep. Same shape exactly."],
    z_house6:    ["My wife left. Took the kids. She said she'd send word when she arrived. I haven't heard yet. That was three weeks ago."],
    z_house7:    ["I stopped counting. It was making me sick.","Just... be careful. Whatever you are. Whatever you're doing. Be careful."],
    z_house8:    ["The nights are longer than they should be. I checked the calendar twice.","Something in the dark near the river last night. I didn't go look. That's the smartest decision I've ever made."],
    z_house9:    ["I came out of retirement. You can have my garden. I'm going back to the wall.","Thirty years guarding this town. I thought I'd earned peace. Apparently not."],
    z_trainee:   ["Vareth doubled my training hours. I'm not complaining — I've seen what comes out of that Gate.","He taught me a new stance yesterday. Said it was for fighting things that don't move like people."],
  },

  // State 2 (Zones III-IV) — Second wave leaving. Families with children.
  // The ones who stay have made a decision, not just failed to leave.
  2: {
    z_patron1:   ["I keep Rook's stool empty still. Can't tell you why. He thinks it's for him. Let him.", "The bard left. Said his songs were getting too dark. Took his lute and walked east at dawn. The songs were getting truer, is what I think."],
    z_patron2:   ["The Caldwell boy came back last week. Alone. Wouldn't say where the rest of them went. Rook gave him a room. He sits by the window.", "Don't ask me why I'm still here. I've stopped asking myself."],
    z_bard:      ["I should have left. I know. Every morning I pack. Every evening I'm still here.", "I wrote a new verse last night. About someone coming back from somewhere very far down. I don't know who it's about. I think I do."],
    z_worshipper1:["The Shrine burned all night without oil. Seraphine sat with it until dawn. She looked — not afraid. Certain. Like something had been confirmed.", "I lit a candle every morning for six months. This morning it was already lit when I arrived."],
    z_worshipper2:["My family left last week. I said goodbye at the gate. Came straight back to the Shrine. I don't know what that means about me.", "Something in this town is worth staying for. I haven't been able to name it. I stay anyway."],
    z_apprentice: ["Aldric gave me the forge keys last night. Said I might need them if something happens to him. I asked what he meant. He just went back to work.", "The thing he's been making all these months — it's done. He won't show it to anyone. Says it's not for anyone here."],
    z_scribe:    ["The journal I found with my name on it — I've been reading it at night. The handwriting changes halfway through. Gets steadier. More certain.", "Malachar told me this morning he knows who the Gate is for. He wouldn't say the name. He looked at you when he said it."],
    z_innkeeper: ["Three rooms left with guests. The others I keep made up anyway. Old habit. Someone might need them.", "Kit comes and sits in the lobby sometimes. Doesn't say anything. I don't ask. We just sit."],
    z_mirela:    ["I sent my children east with my sister two weeks ago. Best decision I've made. Second best is staying.", "Supplies are low. I make do. Whatever you need going in — I'll find it."],
    z_house1:    ["The house is mostly packed. I keep unpacking certain things. The table. The good chair. Things you need if you're staying.", "My grandfather said someone important would come through. I thought he meant a king or a general. He didn't say what kind of important."],
    z_house2:    ["The unidentified plant is flowering now. Small white flowers that smell like cold stone. I've stopped trying to understand it.", "My neighbor left and I inherited her garden. I'm keeping it up. Someone should."],
    z_house3:    ["No letters. I still put paper by the window. You make arrangements with hope — that's all you can do.", "If you see anyone down there who used to live up here — tell them we're still holding."],
    z_house4:    ["I repair what comes through the door. Lately it's mostly armor. People preparing for something.", "One pair of boots I fixed came back twice. Same boots, different wear pattern each time. I don't ask."],
    z_house5:    ["Rue's family left in the night. Kit knocked on my door the next morning just to have somewhere to be. We had breakfast. Didn't talk about it.", "My daughter stopped drawing the Gate. Started drawing something else. A door, she says. In the dark, with light behind it."],
    z_house6:    ["Letter finally came. They arrived safe. She said I should come. I wrote back. Told her to give it more time.", "I keep the hearth going. In case anyone needs to come in from the cold."],
    z_house7:    ["I count the ones who come back now. Just those. It's a smaller number but it means more.", "You're in the count. Every time. I want you to know that."],
    z_house8:    ["The nights are a full hour longer than they should be. I've stopped checking the charts. The charts don't explain anything anymore.", "Something in the dark near the river speaks sometimes. I've started speaking back. We don't understand each other. It feels important anyway."],
    z_house9:    ["Held the north wall alone last night. Not against anything specific. Just held it. That felt right.", "If you're going back in — I'll be here when you come out. That's what I can offer."],
    z_trainee:   ["Vareth said I'm ready. I don't feel ready. He said that's how you know.","I'm taking the night watch now. Vareth's been... somewhere else. His mind, I mean. He comes back before dawn."],
  },

  // State 3 (Zones V-VI) — The faithful few. The ones left chose to be here.
  // The town has a quality of decision rather than abandonment.
  3: {
    z_patron1:   ["Empty bar. Just me and the candle. I've been talking to the candle. Don't tell anyone.", "I'm not leaving. I know everyone says that. I mean it in a different way. This stool is load-bearing."],
    z_patron2:   ["The Caldwell boy left last week. Quietly. I understand. I'm glad he had somewhere to go.", "I stay because there's nowhere I need to be more than here right now. That's the whole reason."],
    z_apprentice: ["I run the forge alone now. Aldric went somewhere he won't name. Left me instructions. Very specific instructions, for a very specific person.", "Whatever you need before you go in — I'll make it. That's what I'm here for now."],
    z_scribe:    ["I finished the journal. All three hundred years of it. Every account. Every rumor. Every inscription change.", "I'm leaving one copy here and sending one with the next person heading east. Someone outside should know the whole story. In case."],
    z_innkeeper: ["One room occupied now. I keep the lamp in every window. Some nights I think the lights answer back.", "I made soup this morning. Enough for two. I don't know why. Habit, maybe. Or hope."],
    z_house1:    ["House is mostly empty now. I kept the table and the good chair and one lamp. That's enough to make it a home.", "I find myself listening for footsteps at the gate. Not afraid ones. Coming-back ones."],
    z_house2:    ["The plant is the only thing still growing. Everything else has gone quiet. It blooms every morning. I take it as a sign of something.", "I talk to it. The plant. I've had worse conversations."],
    z_house4:    ["No more boots to repair. I just keep the tools ready. In case.", "The last pair of boots I fixed — I buffed them to a shine even though nobody asked. Felt like the right way to send someone off."],
    z_house7:    ["Just you, coming and going. That's my whole count now. You're the number that matters.", "Come back. That's the only thing left to ask."],
    z_house8:    ["The nights are what they are. I don't track them anymore. I track you — when you go in, when you come out. That's the calendar that matters.", "Something in the dark near the river has gone quiet. I think it found what it was looking for."],
    z_trainee:   ["I run the Grounds now. Vareth told me what every upgrade does and what it costs. I keep the books.","Whatever you need before the next run — I'll have it ready. Vareth taught me that much."],
  },

  // State 4 (Zones VII-VIII) — Skeleton crew. The last ones.
  // Rook, Elspeth, Seraphine, Aldric's apprentice, Father Oswin, Kit.
  // The town feels like a held breath about to finally release.
  4: {
    z_patron1:   ["Still here. Will be here. That's all I've got and it's enough.", "When you come back — and you will — the stool will be here. The candle will be lit. I'll pour without being asked."],
    z_innkeeper: ["One lamp in every window. All night. Every night. I don't know for who anymore. I do it for the doing.", "The soup is hot. It's always hot. Come back and I'll have a bowl waiting."],
    z_apprentice: ["Aldric's instructions said: sharpen it one last time before they go. I did that this morning. It's ready. You're ready.", "I don't know what's down there. I know what's up here. That's enough."],
    z_scribe:    ["The record is complete. Everything that happened, everything I saw, everything I pieced together from three hundred years of hints and silences.", "Whatever happens down there — it's going to be in the book. You're going to be in the book. The real version. Not the one the gods wrote."],
    z_house2:    ["The plant flowered twice this morning. First time it's done that. I think that means something.", "I'll keep it alive. Whatever happens. When you come back, it'll still be here."],
    z_house7:    ["One. That's my count. One person going in. I'm going to count one person coming out.", "Don't make me recount."],
    z_trainee:   ["Vareth went in. Into the Gate. He didn't say goodbye, just left his key on the counter. I think he went looking for answers.","I keep the Grounds open. Every morning. In case you need one more edge before you go."],
  },
};

// ── Wandering NPC definitions (exterior only) ─────────────
// Map raw zoneIdx to town state 0-4
// 0=zones0-1, 1=zones2-3, 2=zones4-5, 3=zones6-7, 4=zone7+
// Returns how many frontier bosses have ever been beaten (persisted across runs)
function _townBossCount(){
  if(typeof G==='undefined'||!G||!G.bossDefeated) return 0;
  return G.bossDefeated.filter(Boolean).length;
}
function _getDeathCount(){
  if(typeof activeSaveSlot==='undefined'||!activeSaveSlot||typeof loadSlotData!=='function') return 0;
  const d=loadSlotData(activeSaveSlot);
  return (d&&d.unlocks&&d.unlocks.stats&&d.unlocks.stats.totalDeaths)||0;
}

function _townState(bossesBeaten) {
  if (bossesBeaten <= 0) return 0;
  if (bossesBeaten <= 2) return 1;
  if (bossesBeaten <= 4) return 2;
  if (bossesBeaten <= 6) return 3;
  return 4;
}

function _buildWanderers(bossesBeaten) {
  const z = _townState(bossesBeaten);
  const alive = z === 0;
  // Each: { id, label, color, icon, wx, wy, wanderArea, lines, stationary? }
  // wanderArea: {x1,y1,x2,y2} in tiles to wander within
  const baseWanderers = [
    // ── Elspeth — present states 0-4, lines evolve across all 5 states ──
    { id:'oldwoman', label:'Elspeth', color:'#c0a080', icon:'👵', wx:14,wy:14, wanderArea:{x1:10,y1:10,x2:18,y2:18},
      lines: z===0 ? ["I've lived here sixty years. The trees never used to whisper back.","My mother used to say the Gate was a door to somewhere important. Not somewhere bad. Just somewhere that mattered.","You have careful eyes. Old eyes, almost. Come back when you're done."]
           : z===1 ? ["I'm not leaving. I outlasted the last darkness. I'll outlast this one.","Three of my neighbors packed up in the night. I understand. I just can't do it.","Come back. That's all I ask of anyone now. Just come back."]
           : z===2 ? ["Half the street is gone now. I'm not. I don't know how to explain that except that I'm not.","Something in this town holds me here the way a name holds a face. I stopped fighting it.","Every time you come back up, I feel like something underground exhales."]
           : z===3 ? (G&&G.zoneIdx>=6
               ? ["Six zones. You've gone six deep. I feel it up here — something in the air is different.","The dream came again. Same door. This time there was light behind it. I woke up before I saw what it opened into.","Come back. The pattern has held every time. I need it to hold once more."]
               : ["There are five of us left who sleep here every night. That's enough. Five is enough.","I've been dreaming about a door. It's the same door every night. Last night I saw light behind it.","Come back. You always come back. I'm counting on the pattern holding."])
           : (G&&G.zoneIdx>=7
               ? ["Seven. You've come back from seven. Whatever is at the bottom — it knows you now too.","Sixty years in this town. I know what it was waiting for. I know who.","Go. Finish it. I'll be at the Gate when you come back. Not if. When."]
               : ["I'll be at the Gate in the morning. However early you leave — I'll be there.","Sixty years in this town. I know what it was waiting for now.","Finish it. Whatever it takes. Finish it."])
    },

    // ── Kit — full arc across all 5 states, death-count-aware ──
    { id:'child1', label:'Kit', color:'#c0d090', icon:'🧒', wx:22,wy:8, wanderArea:{x1:16,y1:4,x2:28,y2:12},
      getLines: ()=>{
        const base = z===0 ? ["I dared Rue to touch the Gate. She did it! I didn't. Don't tell anyone.","My mum says adventurers are brave. My dad says they're stupid. I think both things can be true.","Can you actually beat the whole dungeon? Nobody's ever beaten the whole dungeon."]
             : z===1 ? ["Rue's family left in the middle of the night. She didn't even say goodbye.","I'm not scared. I'm not. ...It's just very quiet now.","I've been watching the Gate. Not on a dare. Just watching. I count everyone who goes in. I give them a number."]
             : z===2 ? ["I'm keeping a journal. Every person who goes in gets a number and a description. So there's a record.","Rue's number was never written down because she left before going in. I left a blank page for her anyway.","You're number one in my journal. I write something new every time you come back."]
             : z===3 ? ["Most people in the journal didn't come back. I keep the book anyway. Someone should know their names.","My mum wanted me to leave with her. I said I'd come when it was done. She cried. I think she understood.","I don't know what you're doing down there. I know you keep coming back. That's the part I'm writing about."]
             : ["I've been at the Gate every morning since you left for the last one. Watching. Waiting.","The journal's almost full. I left the last page blank. For the ending.","When you come back — and you will — I want to write what you say. Whatever you say. That's the last entry."];
        const deaths=_getDeathCount();
        if(deaths===0) return base;
        const deathLine = deaths===1 ? "I wrote an ending for page one. Then you came back. I crossed it out."
          : deaths<=3 ? `Page ${deaths+1} now. The first ${deaths} had endings. This one doesn't yet.`
          : deaths<=7 ? `I stopped writing endings before you come back. Feels presumptuous. You're on page ${deaths+1}.`
          : `I lost count for a while. Then I kept counting anyway. You're at ${deaths}. I stopped being surprised around five.`;
        return [deathLine,...base];
      }
    },

    // ── Rue — present states 0-1 only, gone after that ──
    ...(z<=1 ? [
      { id:'child2', label:'Rue', color:'#90c0d0', icon:'🧒', wx:36,wy:8, wanderArea:{x1:32,y1:4,x2:42,y2:12},
        lines: z===0 ? ["I touched the Gate. It felt cold. Not stone-cold. Memory-cold.","If you go in the dungeon can you bring me back a monster tooth? For a collection.","Kit thinks you're the one. I don't know what that means but I wrote it down."]
             : ["My mum says we're leaving soon. I don't want to go. This is home.","I'm keeping a journal. Everyone who goes in gets a number. You're number one.","I'm going to leave the journal with Kit when we go. She'll keep it better than me."]
      }
    ] : []),

    // ── Guards — present states 0-3, both gone by state 4 ──
    ...(z<=3 ? [
      { id:'guard1', label:'Town Guard', color:'#8080a0', icon:'⚔', wx:31,wy:6, stationary:true,
        lines: z===0 ? ["Another one heading for the Gate. I used to try to stop them. Now I just nod.","The woods have been loud lately. Wrong kind of loud.","Stay on the roads. The roads are mostly safe."]
             : z===1 ? ["Half my unit didn't come back from the Outpost rotation. We know what that means.","I stop counting who goes in. I only count who comes back. That number still has you in it.","If you're going in again — take care of yourself. That's an order."]
             : z===2 ? ["Down to four on the wall. Used to be twenty. We hold anyway.","Every time you surface, the town feels less like it's dissolving. I don't understand the mechanism. I'm grateful for it.","North wall, east road, south gate, repeat. Boring keeps people alive."]
             : ["Last rotation before I'm reassigned. I asked to stay. They said no. I'm staying anyway.","Thirty years on a wall. I know what's worth guarding. This is worth guarding.","Come back. I'm going to be here when you do."]
      },
      { id:'guard2', label:'Town Guard', color:'#8080a0', icon:'⚔', wx:33,wy:36, wanderArea:{x1:31,y1:34,x2:42,y2:37},
        lines: z===0 ? ["South gate's been reinforced three times. Precaution, they keep saying.","Quiet night. I hate quiet nights."]
             : z===1 ? ["South gate's locked at sundown. Orders from somewhere above my pay.","I've requested transfer twice. No answer. I think that office isn't staffed anymore."]
             : z===2 ? ["I stopped requesting transfer. Stopped wanting one.","Whatever you're doing in there — come back out. That's the important part."]
             : ["Last one on this post. I'll hold it until I can't.","You come back, the gate'll be open. That's my job now."]
      },
    ] : []),

    // ── Merchant — present states 0-2 ──
    ...(z<=2 ? [
      { id:'merchant', label:'Traveling Merchant', color:'#c08030', icon:'🛒', wx:20,wy:23, wanderArea:{x1:16,y1:20,x2:27,y2:27},
        lines: z===0 ? ["Business is good when times are uncertain. Uncertain times make certain purchases.","I've been on this road fifteen years. Never stayed in Elderfen more than a night. Something's keeping me here now."]
             : z===1 ? ["I was going to leave. Cart packed, horse ready. Then I looked at the east road and came back inside.","Selling at half price now. Coin feels like the wrong currency for what's coming."]
             : ["I finally left. Then came back. I can't explain it. I've stopped trying.","Take whatever you need. Price is whatever you have. Or nothing. Just come back."]
      },
    ] : []),

    // ── Farmers — present states 0-2 ──
    ...(z<=2 ? [
      { id:'farmer1', label:'Harlan', color:'#806040', icon:'🌾', wx:5, wy:38, wanderArea:{x1:2,y1:35,x2:12,y2:44},
        lines: z===0 ? ["Good harvest this year. People say that's lucky. I think luck runs out.","My fields are just past the north wall. I can hear the forest from there. Different sounds this year."]
             : z===1 ? ["Crops are thin. Soil feels wrong. Like it knows something I don't yet.","My dog won't go to the north field anymore. That's enough for me."]
             : ["I planted anyway. Even if I don't harvest it, someone might.","The field near the Gate grows differently than the others. Leans toward it. Always has."]
      },
      { id:'farmer2', label:'Bess', color:'#a07060', icon:'🌾', wx:52,wy:38, wanderArea:{x1:46,y1:35,x2:57,y2:44},
        lines: z===0 ? ["Lovely evening. I say that every evening. It keeps being true.","I sell vegetables at the market. Aldric says a blacksmith doesn't need vegetables. He buys them anyway."]
             : z===1 ? ["I sold the goats. Didn't want to. Had to. If you see them on the road — they were good goats.","Staying for harvest. After that I don't know."]
             : ["I'm leaving after this season. Before I go — is there anything I can do? Anything that helps?","Take some bread. At least take that."]
      },
    ] : []),

    // ── Brother Edwyn — present states 0-3 ──
    ...(z<=3 ? [
      { id:'scholar', label:'Brother Edwyn', color:'#9090c0', icon:'📖', wx:44,wy:14, wanderArea:{x1:40,y1:10,x2:50,y2:18},
        lines: z===0 ? ["I've been studying the Gate inscription for three years. I understand about a third of it.","The dungeon predates the town. The town predates the road. The road predates memory. That should tell you something.","You look like someone who knows what the inscription says. I'm not going to ask. But if you ever want to tell me —"]
             : z===1 ? ["I'm writing everything down. Every account I can find. Someone should.","The inscription changed. Three words I'd been translating for years just rewrote themselves overnight.","Terrified and fascinated. That's my entire condition. Come back so I can find out how it ends."]
             : z===2 ? ["The inscription changes every time you go in. Longer each time. More certain.","I found a phrase that recurs — same root, different conjugation each instance. It means something like 'returning'. Or 'remembering'. The two overlap in the old tongue.","I've sent copies of my notes east. Two copies. Three different routes. Just in case."]
             : ["One line left to translate. I've been saving it. I think I'll understand it when you come back.","The inscription is almost complete. Whatever it says — the full message — it ends with something that looks like a name.","I'll be here when you surface. I want to read you the last line."]
      },
    ] : []),

    // ── Father Oswin — present all 5 states ──
    { id:'priest', label:'Father Oswin', color:'#d0d0e0', icon:'✝', wx:36,wy:26, wanderArea:{x1:32,y1:22,x2:42,y2:30},
      lines: z===0 ? ["I hold services at dawn. Fewer attend each week. The ones who come — they really come.","The Shrine and the Temple disagree on most things. Seraphine and I agree on this: something must hold."]
           : z===1 ? ["I've been blessing every adventurer who passes through. Every one. It takes all morning.","I asked the Shrine what's coming. It showed me the Gate — open. I woke before I saw what came through."]
           : z===2 ? ["I bless everyone who leaves and everyone who comes back. Both blessings feel necessary.","God is not silent here. God is — attentive. That's the word. Whatever's below has God's full attention."]
           : z===3 ? ["Three of us still hold services. Seraphine comes. Kit comes sometimes. That's enough for a congregation.","I've been writing a prayer for endings. Good ones. The kind where what was lost comes back."]
           : ["I'll be at the Gate with the others in the morning. I have something to say before you go.","Whatever is at the bottom — it has been in the dark long enough. So have you. It's time.","Go with everything you have. Come back with everything you found."]
    },

    // ── Sergeant Dael — present states 0-3 ──
    ...(z<=3 ? [
      { id:'soldier', label:'Sergeant Dael', color:'#a0a060', icon:'🛡', wx:31,wy:35, wanderArea:{x1:27,y1:33,x2:36,y2:37},
        lines: z===0 ? ["Twelve years in the garrison. Never lost sleep over the Gate. Still sleep fine, mostly.","Standard patrol. North wall, east road, market, south gate, repeat. I love boring."]
             : z===1 ? ["Three soldiers requested discharge. I approved all three. I'd go myself if I could leave.","Command says hold the town. Hold it with what? Never mind. Not your problem."]
             : z===2 ? ["Down to a skeleton crew. We hold anyway. That's what soldiers do.","Every time you surface, I add a mark to my post. You're up to — a lot of marks."]
             : ["Last night on the wall before I'm formally reassigned. I'm not going.","Thirty years, four postings, two wars. This is the most important thing I've ever guarded. I know that now."]
      },
    ] : []),

    // ── Old Cray — present states 0-3 ──
    ...(z<=3 ? [
      { id:'beggar', label:'Old Cray', color:'#706050', icon:'🪙', wx:8, wy:23, wanderArea:{x1:4,y1:20,x2:13,y2:27},
        lines: z===0 ? ["Coin for an old soldier? The Gate doesn't lock from outside. Everyone forgets that part.","I've seen six people try to close it. The Gate let them try. It only opens for certain ones."]
             : z===1 ? ["I used to think the Gate was something we could manage. Work around. Not anymore.","Don't forget to come back. The town needs proof it can still happen."]
             : z===2 ? ["I was a soldier for twenty years. Never found anything worth this much guarding. I found it in retirement.","Take my coin. All of it. I don't have much use for it now."]
             : ["Stay alive down there. That's my whole prayer. Simple prayers work better.","You come back out of that Gate and I'll be the first one there to say I told you so."]
      },
    ] : []),

    // ── Mira the healer — present states 0-3 ──
    ...(z<=3 ? [
      { id:'healer', label:'Mira', color:'#e090a0', icon:'💊', wx:44,wy:36, wanderArea:{x1:40,y1:32,x2:50,y2:42},
        lines: z===0 ? ["I patch up adventurers mostly. And farmers. Sometimes both.","Rest when you can. Eat when you can. That's the whole secret."]
             : z===1 ? ["I've been working around the clock. It's not wounds — it's fear. Fear makes people sick in very specific ways.","Running low on everything. If you find herbs in there — bring them back."]
             : z===2 ? ["Sent my children east with my sister. Best thing I've done. Second best is staying.","Whatever you need before you go in — I'll find it."]
             : ["I should have left. I know. I can't explain why I didn't except that it felt wrong to go.","Patch you up when you come back. That's my job. I'll be ready."]
      },
    ] : []),

    // ── Cord the fisher — present states 0-2 ──
    ...(z<=2 ? [
      { id:'fisher', label:'Cord', color:'#6090a0', icon:'🎣', wx:6,wy:24, wanderArea:{x1:3,y1:22,x2:13,y2:26},
        lines: z===0 ? ["Fish are biting strange. Deeper than usual. Can't explain it.","The west pond's been odd. Smells like iron."]
             : z===1 ? ["The west pond's gone wrong. Everything in it died in one night.","The east pond's still fine. I'm fishing a lot. It's the only quiet left."]
             : ["I fish every morning. More for the thinking than the catch.","Something in the water's been different since you started going in. Calmer, almost."]
      },
    ] : []),

    // ── Zone 0 extras — market full, children playing ──
    ...(z===0 ? [
      { id:'child3', label:'Pip', color:'#d0c080', icon:'🧒', wx:26,wy:36, wanderArea:{x1:22,y1:34,x2:33,y2:37}, lines:["I'm going to be an adventurer when I grow up. Or a baker. Haven't decided.","What class are you? I'm going to be a wizard. Or maybe a fighter. Both?"] },
      { id:'smith2', label:'Beryl', color:'#c06030', icon:'⚒', wx:14,wy:36, wanderArea:{x1:10,y1:32,x2:18,y2:42}, lines:["I work with Aldric sometimes. Mostly I sharpen things. Sharpen enough things, eventually one of them matters."] },
      { id:'weaver', label:'Syl', color:'#b080c0', icon:'🧶', wx:50,wy:26, wanderArea:{x1:46,y1:22,x2:56,y2:32}, lines:["I weave cloaks mostly. Warm ones. I've been making thicker ones lately. Not sure why."] },
      { id:'tanner', label:'Hugh', color:'#806030', icon:'🥾', wx:52,wy:14, wanderArea:{x1:48,y1:10,x2:57,y2:18}, lines:["Good boots keep you alive. Better than a sword. Don't tell Aldric I said that."] },
    ] : []),

    // ── Zone 1 extras — refugees arriving ──
    ...(z===1 ? [
      { id:'refugee', label:'Refugee', color:'#907060', icon:'🧳', wx:13,wy:36, wanderArea:{x1:11,y1:34,x2:16,y2:38}, lines:["We came from the Outpost road. There's nothing left of the waystation.","I don't know where we're going. Just away from there."] },
      { id:'soldier2', label:'Scout', color:'#a09060', icon:'⚔', wx:42,wy:26, wanderArea:{x1:38,y1:22,x2:48,y2:30}, lines:["I scouted ahead of the garrison. Came back alone. I don't talk about what I saw.","The road east is passable. Barely. Don't go at night."] },
    ] : []),
  ];
  return baseWanderers.map(w => ({
    ...w,
    wx: w.wx * TILE + TILE/2,
    wy: w.wy * TILE + TILE/2,
    wanderTarget: { x: w.wx * TILE + TILE/2, y: w.wy * TILE + TILE/2 },
    wanderTimer: Math.random() * 120,
    talking: false,
    talkTimer: 0,
    activeLine: 0,
    facing: 2,
    movePhase: Math.random() * Math.PI * 2,
  }));
}

let _wanderers = [];
let _nearWanderer = null;

// ── Zone atmospheres ──────────────────────────────────────
const ATMOS = [
  { sky:'#1e1030', ground:'#1a2e0a', path:'#3a2e18', wallDark:'#1a1408', water:'#1a2a3a', treeTrunk:'#3a2010', treeTop:'#1a4a10', ambient:'rgba(10,5,20,0.12)', tr:255,tg:150,tb:60,  label:'Dusk',        fx:'fireflies', floorCol:'#2a2010' },
  { sky:'#090909', ground:'#14100a', path:'#221c10', wallDark:'#0e0a06', water:'#0a0e14', treeTrunk:'#241408', treeTop:'#222018', ambient:'rgba(8,6,0,0.28)',   tr:200,tg:120,tb:30,  label:'Overcast',    fx:'ash',       floorCol:'#1a1408' },
  { sky:'#050608', ground:'#0c0c12', path:'#14141c', wallDark:'#08080e', water:'#060810', treeTrunk:'#141418', treeTop:'#141420', ambient:'rgba(0,0,15,0.38)',  tr:130,tg:170,tb:220, label:'Cold Mist',   fx:'mist',      floorCol:'#101018' },
  { sky:'#020104', ground:'#04030c', path:'#080616', wallDark:'#030210', water:'#020006', treeTrunk:'#0c0a18', treeTop:'#08061c', ambient:'rgba(0,0,8,0.50)',   tr:100,tg:60, tb:200, label:'Void Dark',   fx:'spores',    floorCol:'#060412' },
  { sky:'#080000', ground:'#0e0303', path:'#160606', wallDark:'#080200', water:'#080200', treeTrunk:'#160606', treeTop:'#120202', ambient:'rgba(25,0,0,0.32)',  tr:255,tg:40, tb:10,  label:'Hellfire',    fx:'embers',    floorCol:'#0e0402' },
];

// ── Particles ─────────────────────────────────────────────
const _ptcls = [];
function _initPtcls(fx){ _ptcls.length=0; const n=fx==='fireflies'?20:fx==='mist'?8:28; for(let i=0;i<n;i++) _ptcls.push(_newPtcl(fx,true)); }
function _newPtcl(fx,rand=false){ const W=EXT_COLS*TILE,H=EXT_ROWS*TILE; const p={fx,x:Math.random()*W,life:Math.random()}; if(fx==='fireflies'){p.y=rand?Math.random()*H:H+2;p.vy=-(0.15+Math.random()*0.3);p.vx=(Math.random()-.5)*.25;p.r=1+Math.random();p.blink=Math.random()*6.28;} else if(fx==='ash'){p.y=rand?Math.random()*H:-2;p.vy=0.2+Math.random()*.35;p.vx=(Math.random()-.5)*.3;p.r=0.8+Math.random()*1.2;} else if(fx==='mist'){p.y=rand?Math.random()*H:H*.6+Math.random()*50;p.vy=-(0.04+Math.random()*.08);p.vx=(Math.random()-.5)*.12;p.r=20+Math.random()*35;p.a=0.03+Math.random()*.05;} else if(fx==='spores'){p.y=rand?Math.random()*H:H+2;p.vy=-(0.12+Math.random()*.2);p.vx=(Math.random()-.5)*.4;p.r=1+Math.random()*1.5;p.hue=180+Math.random()*120;} else if(fx==='embers'){p.y=rand?Math.random()*H:H+2;p.vy=-(0.4+Math.random()*.8);p.vx=(Math.random()-.5)*.7;p.r=0.8+Math.random()*1.5;} return p; }
function _stepPtcls(fx){ for(let i=_ptcls.length-1;i>=0;i--){ const p=_ptcls[i]; p.x+=p.vx; p.y+=p.vy; p.life+=0.005; if(p.life>1) _ptcls[i]=_newPtcl(fx); } }

// ══════════════════════════════════════════════════════════
//  AMBIENT LIFE SYSTEMS
// ══════════════════════════════════════════════════════════

// ── 1. Chimney Smoke ─────────────────────────────────────
const _smoke = [];
const _CHIMNEYS = [
  { bId:'tavern', ox:0.25, oy:0.0 },
  { bId:'tavern', ox:0.75, oy:0.0 },
  { bId:'forge',  ox:0.5,  oy:0.0, heavy:true },
  { bId:'study',  ox:0.35, oy:0.0 },
];
function _newSmokePuff(rand){
  const src=_CHIMNEYS[Math.floor(Math.random()*_CHIMNEYS.length)];
  const b=EXT_BUILDINGS.find(bb=>bb.id===src.bId);
  if(!b) return {x:0,y:0,life:2};
  const bx=b.tx*TILE+b.tw*TILE*src.ox;
  const by=b.ty*TILE;
  return {
    x:bx+(Math.random()-0.5)*3,
    y:rand? by-Math.random()*18 : by,
    vx:(Math.random()-0.5)*0.06,
    vy:-(0.06+Math.random()*0.1),
    r:src.heavy? 2.5+Math.random()*2 : 1.5+Math.random()*1.5,
    life:rand? Math.random() : 0,
    heavy:!!src.heavy,
  };
}
function _initSmoke(){ _smoke.length=0; for(let i=0;i<20;i++) _smoke.push(_newSmokePuff(true)); }
function _stepSmoke(){
  for(let i=_smoke.length-1;i>=0;i--){
    const s=_smoke[i];
    s.x+=s.vx; s.y+=s.vy;
    s.vx+=(Math.random()-0.5)*0.008;
    s.r+=0.012;
    s.life+=0.007;
    if(s.life>1) _smoke[i]=_newSmokePuff(false);
  }
}
function _drawSmoke(ctx,cx,cy){
  for(const s of _smoke){
    const px=s.x-cx, py=s.y-cy;
    if(px<-20||py<-20||px>_logW()+20||py>_logH()+20) continue;
    const fade=1-s.life;
    ctx.globalAlpha=fade*fade*(s.heavy?0.16:0.10);
    ctx.fillStyle=s.heavy?'#504030':'#908880';
    ctx.beginPath(); ctx.arc(px,py,s.r,0,6.28); ctx.fill();
  }
  ctx.globalAlpha=1;
}

// ── 2. Town Cat ──────────────────────────────────────────
const _cat = { wx:0, wy:0, facing:1, state:'sitting', timer:0, tx:0, ty:0, groomFrame:0, stuckCount:0, lastX:0, lastY:0 };
function _initCat(){
  _cat.wx=20*TILE; _cat.wy=24*TILE;
  _cat.state='sitting'; _cat.timer=80+Math.random()*160;
  _cat.facing=Math.floor(Math.random()*4);
  _cat.stuckCount=0; _cat.lastX=_cat.wx; _cat.lastY=_cat.wy;
}
function _catPickTarget(){
  // Pick a random walkable spot — try a few times to avoid buildings
  for(let attempt=0;attempt<8;attempt++){
    const cx=(6+Math.random()*44)*TILE;
    const cy=(10+Math.random()*34)*TILE;
    if(!_extBlocked(cx,cy)&&!_extBlocked(cx+4,cy+4)){ _cat.tx=cx; _cat.ty=cy; return; }
  }
  // Fallback: just go to a road tile
  _cat.tx=29*TILE; _cat.ty=(20+Math.random()*10)*TILE;
}
function _stepCat(){
  // Flee from player if close
  const pdx=_pl.wx-_cat.wx, pdy=_pl.wy-_cat.wy;
  if(Math.hypot(pdx,pdy)<TILE*2.5 && _cat.state!=='darting'){
    _cat.state='darting'; _cat.timer=50+Math.random()*30;
    _cat.stuckCount=0;
    const ang=Math.atan2(-pdy,-pdx)+(Math.random()-0.5)*0.8;
    const d=TILE*5+Math.random()*TILE*3;
    _cat.tx=Math.max(TILE*2,Math.min((EXT_COLS-3)*TILE, _cat.wx+Math.cos(ang)*d));
    _cat.ty=Math.max(TILE*2,Math.min((EXT_ROWS-3)*TILE, _cat.wy+Math.sin(ang)*d));
  }
  _cat.timer--;
  if(_cat.state==='sitting'){
    if(_cat.timer<=0){
      if(Math.random()<0.3){ _cat.state='grooming'; _cat.timer=60+Math.random()*80; _cat.groomFrame=0; }
      else { _cat.state='walking'; _cat.timer=100+Math.random()*120; _cat.stuckCount=0; _catPickTarget(); }
    }
  } else if(_cat.state==='grooming'){
    _cat.groomFrame++;
    if(_cat.timer<=0){ _cat.state='sitting'; _cat.timer=100+Math.random()*200; }
  } else { // walking or darting
    const spd=_cat.state==='darting'?1.2:0.25;
    const dx=_cat.tx-_cat.wx, dy=_cat.ty-_cat.wy;
    const dist=Math.hypot(dx,dy);
    if(dist>2){
      const nx=_cat.wx+dx/dist*spd, ny=_cat.wy+dy/dist*spd;
      if(!_extBlocked(nx,_cat.wy)&&!_extBlocked(nx+4,_cat.wy+4)) _cat.wx=nx;
      if(!_extBlocked(_cat.wx,ny)&&!_extBlocked(_cat.wx+4,ny+4)) _cat.wy=ny;
      if(Math.abs(dx)>Math.abs(dy)) _cat.facing=dx>0?1:3;
      else _cat.facing=dy>0?2:0;
    }
    // Stuck detection — if barely moved in 20 frames, pick new target or sit
    if(_cat.timer%20===0){
      const moved=Math.hypot(_cat.wx-_cat.lastX, _cat.wy-_cat.lastY);
      if(moved<2){ _cat.stuckCount++;
        if(_cat.stuckCount>=2){ _cat.state='sitting'; _cat.timer=40+Math.random()*80; _cat.stuckCount=0; }
        else { _catPickTarget(); }
      } else { _cat.stuckCount=0; }
      _cat.lastX=_cat.wx; _cat.lastY=_cat.wy;
    }
    if(dist<=3||_cat.timer<=0){ _cat.state='sitting'; _cat.timer=80+Math.random()*200; _cat.stuckCount=0; }
  }
}
function _drawCat(ctx,cx,cy){
  const sx=Math.round(_cat.wx-cx), sy=Math.round(_cat.wy-cy);
  if(sx<-TILE||sy<-TILE||sx>_logW()+TILE||sy>_logH()+TILE) return;
  const t=Date.now()*0.005;
  const darting=_cat.state==='darting', walking=_cat.state==='walking', grooming=_cat.state==='grooming';
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(sx,sy+5,3,1.2,0,0,6.28); ctx.fill();
  const body='#c08030', dark='#805020';
  if(darting||walking){
    const leg=Math.sin(t*(darting?6:3));
    ctx.fillStyle=body; ctx.fillRect(sx-4,sy-2,8,4);
    ctx.fillStyle=dark;
    ctx.fillRect(sx-3,sy+1+leg,2,3); ctx.fillRect(sx+2,sy+1-leg,2,3);
    ctx.fillStyle=body;
    const tw=Math.sin(t*4)*2;
    ctx.fillRect(sx+4,sy-3+tw,1,3); ctx.fillRect(sx+5,sy-4+tw,1,2);
  } else {
    ctx.fillStyle=body; ctx.fillRect(sx-3,sy-1,6,4);
    ctx.fillRect(sx-3,sy+2,2,2); ctx.fillRect(sx+2,sy+2,2,2);
    ctx.fillStyle=dark;
    const tw=Math.sin(t*1.5)*0.8;
    ctx.fillRect(sx+3,sy,1,3); ctx.fillRect(sx+4,sy+1+tw,1,2);
    if(grooming && Math.floor(_cat.groomFrame/15)%2===0){
      ctx.fillStyle=body; ctx.fillRect(sx-2,sy+0,4,3); return;
    }
  }
  // Head
  ctx.fillStyle=body; ctx.fillRect(sx-2,sy-4,5,3);
  ctx.fillStyle=dark; ctx.fillRect(sx-2,sy-5,2,2); ctx.fillRect(sx+2,sy-5,2,2);
  ctx.fillStyle='#e0a0a0'; ctx.fillRect(sx-1,sy-5,1,1); ctx.fillRect(sx+2,sy-5,1,1);
  ctx.fillStyle='#40c040'; ctx.fillRect(sx-1,sy-3,1,1); ctx.fillRect(sx+2,sy-3,1,1);
}

// ── 3. Birds Overhead ────────────────────────────────────
const _flocks = [];
let _flockState = 0;
function _newFlock(rand){
  const W=EXT_COLS*TILE;
  const fromLeft=Math.random()<0.5;
  const bx=rand?Math.random()*W:fromLeft?-20:W+20;
  const by=TILE*2+Math.random()*TILE*8;
  const vx=fromLeft?(0.3+Math.random()*0.4):-(0.3+Math.random()*0.4);
  const birds=[];
  for(let i=0,n=3+Math.floor(Math.random()*3);i<n;i++){
    birds.push({ ox:(Math.random()-0.5)*12, oy:(Math.random()-0.5)*6, phase:Math.random()*6.28 });
  }
  return { x:bx, y:by, vx, vy:(Math.random()-0.5)*0.05, birds, life:0 };
}
function _initBirds(ts){
  _flocks.length=0; _flockState=ts;
  const max=ts>=4?0:ts>=3?1:ts>=2?2:3;
  for(let i=0;i<max;i++) _flocks.push(_newFlock(true));
}
function _stepBirds(){
  const W=EXT_COLS*TILE;
  const max=_flockState>=4?0:_flockState>=3?1:_flockState>=2?2:3;
  for(let i=_flocks.length-1;i>=0;i--){
    const f=_flocks[i]; f.x+=f.vx; f.y+=f.vy; f.life+=0.001;
    if((f.vx>0&&f.x>W+40)||(f.vx<0&&f.x<-40)||f.life>1){
      if(_flocks.length<=max) _flocks[i]=_newFlock(false);
      else _flocks.splice(i,1);
    }
  }
}
function _drawBirds(ctx,cx,cy){
  const t=Date.now()*0.004;
  for(const f of _flocks){
    for(const b of f.birds){
      const bx=f.x+b.ox-cx, by=f.y+b.oy-cy;
      if(bx<-10||by<-10||bx>_logW()+10||by>_logH()+10) continue;
      const w=Math.sin(t*2+b.phase)*1.5;
      ctx.globalAlpha=0.55;
      ctx.fillStyle='#1a1008';
      ctx.fillRect(bx-2,by+w*0.5,2,1); ctx.fillRect(bx,by,1,1); ctx.fillRect(bx+1,by+w*0.5,2,1);
    }
  }
  ctx.globalAlpha=1;
}

// ── 4. Water Ripples ─────────────────────────────────────
const _ripples = [];
let _rippleTimer = 0;
let _waterTiles = null;
function _initRipples(){
  _ripples.length=0; _rippleTimer=0;
  if(!_waterTiles){
    _waterTiles=[];
    for(let r=0;r<EXT_ROWS;r++) for(let c=0;c<EXT_COLS;c++){
      if(EXT_MAP[r][c]===2) _waterTiles.push({r,c});
    }
  }
}
function _stepRipples(){
  _rippleTimer++;
  if(_rippleTimer>50+Math.random()*70 && _waterTiles && _waterTiles.length>0){
    _rippleTimer=0;
    const wt=_waterTiles[Math.floor(Math.random()*_waterTiles.length)];
    _ripples.push({
      x:wt.c*TILE+TILE/2+(Math.random()-0.5)*6,
      y:wt.r*TILE+TILE/2+(Math.random()-0.5)*6,
      r:0, maxR:5+Math.random()*4, life:0,
    });
  }
  for(let i=_ripples.length-1;i>=0;i--){
    const rp=_ripples[i];
    rp.life+=0.018; rp.r=rp.maxR*rp.life;
    if(rp.life>=1) _ripples.splice(i,1);
  }
}
function _drawRipples(ctx,cx,cy){
  for(const rp of _ripples){
    const px=rp.x-cx, py=rp.y-cy;
    if(px<-20||py<-20||px>_logW()+20||py>_logH()+20) continue;
    const alpha=0.2*(1-rp.life);
    ctx.strokeStyle=`rgba(150,200,255,${alpha})`;
    ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.arc(px,py,rp.r,0,6.28); ctx.stroke();
  }
}

// ── 5. NPC Proximity Reactions ───────────────────────────
const _PROX_DIST = TILE*2;
const _PROX_TIME = 120;
function _checkProximity(){
  for(let i=0;i<_wanderers.length;i++){
    const a=_wanderers[i];
    if(a.stationary||a.talking||a._proxPause) continue;
    for(let j=i+1;j<_wanderers.length;j++){
      const b=_wanderers[j];
      if(b.stationary||b.talking||b._proxPause) continue;
      const d=Math.hypot(a.wx-b.wx, a.wy-b.wy);
      if(d<_PROX_DIST && d>4){
        const ang=Math.atan2(b.wy-a.wy, b.wx-a.wx);
        a._proxPause=_PROX_TIME+Math.floor(Math.random()*40);
        b._proxPause=a._proxPause;
        if(Math.abs(Math.cos(ang))>Math.abs(Math.sin(ang))){
          a.facing=Math.cos(ang)>0?1:3; b.facing=Math.cos(ang)>0?3:1;
        } else {
          a.facing=Math.sin(ang)>0?2:0; b.facing=Math.sin(ang)>0?0:2;
        }
      }
    }
  }
}

// ── Master init / step ───────────────────────────────────
function _initAmbient(townState){
  _initSmoke(); _initCat(); _initBirds(townState); _initRipples();
}
function _stepAmbient(){
  if(_tScene!=='exterior') return;
  _stepSmoke(); _stepCat(); _stepBirds(); _stepRipples();
}

// ══════════════════════════════════════════════════════════
//  MINIMAP
// ══════════════════════════════════════════════════════════
let _minimapExpanded = false;
const _MM_SMALL = 1;    // 1px per tile → 60×48
const _MM_BIG   = 2.5;  // 2.5px per tile → 150×120
const _MM_PAD   = 3;
const _MM_BLDG_COLS = {
  gate:'#8b1a1a', tavern:'#6a4020', inn:'#6a4020', forge:'#c06020',
  study:'#4a2860', temple:'#b0a060', market:'#4a7040', store:'#4a7040',
  proving:'#907040', graveyard:'#3a3030', noticeboard:'#7a6a40',
  house1:'#504030',house2:'#504030',house3:'#504030',house4:'#504030',
  house5:'#504030',house6:'#504030',house7:'#504030',house8:'#504030',house9:'#504030',
};
const _MM_LABELS = {
  gate:'Gate', tavern:'Tavern', inn:'Inn', forge:'Forge',
  study:'Study', temple:'Shrine', market:'Market', store:'Shop',
  proving:'Proving', graveyard:'Graves',
};

function _drawMinimap(ctx){
  if(_tScene!=='exterior') return;
  const exp=_minimapExpanded;
  const scale=exp?_MM_BIG:_MM_SMALL;
  const mw=EXT_COLS*scale, mh=EXT_ROWS*scale;
  const W=_logW();
  const mx=W-mw-_MM_PAD;
  const my=13;

  // Background + border
  ctx.fillStyle=exp?'rgba(0,0,0,0.7)':'rgba(0,0,0,0.5)';
  ctx.fillRect(mx-2,my-2,mw+4,mh+4);
  ctx.strokeStyle='rgba(200,168,75,0.3)';
  ctx.lineWidth=0.5;
  ctx.strokeRect(mx-2,my-2,mw+4,mh+4);

  // Terrain — batch by tile type for fewer state changes
  const cols=['#5a4a30','#2a5070','#1a1008',null,'#3a4a20'];
  const tileMap=[null,0,1,2,null,4]; // EXT_MAP value → cols index
  for(let r=0;r<EXT_ROWS;r++){
    for(let c=0;c<EXT_COLS;c++){
      const t=EXT_MAP[r][c];
      const ci=tileMap[t];
      if(ci==null) continue;
      const col=cols[ci];
      if(!col) continue;
      ctx.fillStyle=col;
      ctx.fillRect(mx+c*scale, my+r*scale, scale, scale);
    }
  }

  // Buildings
  for(const b of EXT_BUILDINGS){
    ctx.fillStyle=_MM_BLDG_COLS[b.id]||'#504030';
    ctx.fillRect(mx+b.tx*scale, my+b.ty*scale, b.tw*scale, b.th*scale);
    ctx.strokeStyle='rgba(255,255,255,0.08)';
    ctx.lineWidth=0.3;
    ctx.strokeRect(mx+b.tx*scale, my+b.ty*scale, b.tw*scale, b.th*scale);
    // Labels — expanded only
    if(exp){
      const label=_MM_LABELS[b.id];
      if(label){
        ctx.font='3px "Press Start 2P",monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillStyle='rgba(220,200,150,0.65)';
        ctx.fillText(label, mx+(b.tx+b.tw/2)*scale, my+(b.ty+b.th)*scale+1);
      }
    }
  }

  // NPC dots
  const dr=exp?1.5:0.7;
  for(const w of _wanderers){
    ctx.fillStyle=w.color||'#808080';
    const dx2=mx+w.wx/TILE*scale, dy2=my+w.wy/TILE*scale;
    ctx.fillRect(dx2-dr,dy2-dr,dr*2,dr*2);
  }

  // Cat
  if(_cat.wx>0){
    ctx.fillStyle='#c08030';
    const cr=exp?1.2:0.6;
    ctx.fillRect(mx+_cat.wx/TILE*scale-cr, my+_cat.wy/TILE*scale-cr, cr*2, cr*2);
  }

  // Player — pulsing gold blip
  const pulse=0.6+0.4*Math.sin(Date.now()*0.005);
  const pr=exp?2.5:1.5;
  const px2=mx+_pl.wx/TILE*scale, py2=my+_pl.wy/TILE*scale;
  // Glow
  ctx.fillStyle=`rgba(255,216,80,${pulse*0.25})`;
  ctx.fillRect(px2-pr-1,py2-pr-1,pr*2+2,pr*2+2);
  // Core
  ctx.fillStyle=`rgba(255,216,80,${pulse})`;
  ctx.fillRect(px2-pr,py2-pr,pr*2,pr*2);

  // Hint text
  ctx.font='3px "Press Start 2P",monospace';
  ctx.textAlign='right'; ctx.textBaseline='top';
  ctx.fillStyle='rgba(180,160,100,0.35)';
  ctx.fillText(exp?'M to close':'M', mx+mw, my+mh+2);
}

// ── Collision ─────────────────────────────────────────────
function _extBlocked(wx,wy){
  const tc=Math.floor(wx/TILE), tr=Math.floor(wy/TILE);
  if(tc<0||tr<0||tc>=EXT_COLS||tr>=EXT_ROWS) return true;
  if(EXT_MAP[tr][tc]===3) return true;
  for(const b of EXT_BUILDINGS){
    if(b.id==='noticeboard') continue;
    if(b.id==='gate'){
      if(tc>=b.tx&&tc<b.tx+b.tw&&tr>=b.ty&&tr<b.ty+b.th){
        if(tc===b.doorTx||tc===b.doorTx+1) return false;
        return true;
      }
      continue;
    }
    if(b.id==='graveyard'){
      // Stone walls are 1 tile thick on all four sides — block unless in gate gap
      const inX = tc>=b.tx && tc<b.tx+b.tw;
      const inY = tr>=b.ty && tr<b.ty+b.th;
      if(!inX||!inY) continue;
      const onTopWall    = tr===b.ty;
      const onBottomWall = tr===b.ty+b.th-1;
      const onLeftWall   = tc===b.tx;
      const onRightWall  = tc===b.tx+b.tw-1;
      if(onTopWall||onLeftWall||onRightWall) return true;
      if(onBottomWall){
        // gate gap = doorTx and doorTx+1
        if(tc===b.doorTx||tc===b.doorTx+1) return false;
        return true;
      }
      continue; // interior of graveyard is walkable
    }
    if(tc>=b.tx&&tc<b.tx+b.tw&&tr>=b.ty&&tr<b.ty+b.th){
      if(tc===b.doorTx&&tr===b.doorTy) return false;
      return true;
    }
  }
  for(const d of EXT_DECORS){
    if((d.type==='tree'||d.type==='well')&&tc===d.tx&&tr===d.ty) return true;
  }
  return false;
}

function _intBlocked(map,wx,wy){
  const tc=Math.floor(wx/TILE), tr=Math.floor(wy/TILE);
  if(tc<0||tr<0||tc>=INT_W||tr>=INT_H) return true;
  const t=map[tr][tc];
  // Only hard walls (1) and counter/bar (2) and bookshelves (5) and anvil (8) block movement
  return t===1||t===2||t===5||t===8;
}

// ── Camera ────────────────────────────────────────────────
function _logW(){ return _tc ? _tc.width/DRAW_SCALE : window.innerWidth/DRAW_SCALE; }
function _logH(){ return _tc ? _tc.height/DRAW_SCALE : window.innerHeight/DRAW_SCALE; }

function _updateCamera(canvasW, canvasH){
  const vpW = canvasW, vpH = canvasH;
  const mapW = (_tScene==='exterior' ? EXT_COLS : INT_W) * TILE;
  const mapH = (_tScene==='exterior' ? EXT_ROWS : INT_H) * TILE;
  if(_tScene !== 'exterior'){
    // Center interior map on screen — camera is fixed
    _camX = -Math.floor((vpW - mapW) / 2);
    _camY = -Math.floor((vpH - mapH) / 2);
  } else if(_introCamActive) {
    // Smooth lerp toward intro tour target
    const targetCamX = _introCamTarget.x - vpW/2;
    const targetCamY = _introCamTarget.y - vpH/2;
    _camX += (targetCamX - _camX) * 0.045;
    _camY += (targetCamY - _camY) * 0.045;
    _camX = Math.max(0, Math.min(mapW - vpW, _camX));
    _camY = Math.max(0, Math.min(mapH - vpH, _camY));
  } else {
    _camX = Math.round(_pl.wx - vpW/2 + TILE/2);
    _camY = Math.round(_pl.wy - vpH/2 + TILE/2);
    _camX = Math.max(0, Math.min(mapW - vpW, _camX));
    if(!_victoryActive) _camY = Math.max(0, Math.min(mapH - vpH, _camY));
    else _camY = Math.max(0, _camY); // let camera follow past bottom
  }
}

// ── Near NPC detection ────────────────────────────────────
function _findNearInteractable(){
  // Exterior: buildings with interiors / NPCs + wanderers
  if(_tScene==='exterior'){
    // Check door proximity for buildings
    for(const b of EXT_BUILDINGS){
      if(!b.interior) continue;
      const dx=(_pl.wx/TILE)-b.doorTx, dy=(_pl.wy/TILE)-b.doorTy;
      if(Math.hypot(dx,dy)<1.5) return {type:'door',ref:b};
    }
    // Gate
    const gate=EXT_BUILDINGS.find(b=>b.id==='gate');
    if(gate){ const dx=(_pl.wx/TILE)-gate.doorTx,dy=(_pl.wy/TILE)-gate.doorTy; if(Math.hypot(dx,dy)<1.8) return {type:'gate',ref:gate}; }
    // Grace Vault
    const gv=EXT_DECORS.find(d=>d.type==='graceVault');
    if(gv){ const dx=(_pl.wx/TILE)-(gv.tx+0.5),dy=(_pl.wy/TILE)-(gv.ty+1); if(Math.hypot(dx,dy)<2) return {type:'graceVault',ref:gv}; }
    // Stash Chest
    const sc=EXT_DECORS.find(d=>d.type==='stashChest');
    if(sc){ const dx=(_pl.wx/TILE)-(sc.tx+0.5),dy=(_pl.wy/TILE)-(sc.ty+1); if(Math.hypot(dx,dy)<2) return {type:'stashChest',ref:sc}; }
    // Notice board
    const nb=EXT_BUILDINGS.find(b=>b.id==='noticeboard');
    if(nb){ const dx=(_pl.wx/TILE)-nb.doorTx,dy=(_pl.wy/TILE)-nb.doorTy; if(Math.hypot(dx,dy)<1.8) return {type:'notice',ref:nb}; }
    // Wanderers
    for(const w of _wanderers){
      const dx=_pl.wx-w.wx, dy=_pl.wy-w.wy;
      if(Math.hypot(dx,dy)<TILE*1.8) return {type:'wanderer',ref:w};
    }
  } else {
    // Interior: NPCs
    const int=INTERIORS[_tScene]; if(!int) return null;
    for(const n of int.npcs){
      const nwx = n._wx !== undefined ? n._wx : n.tx*TILE+TILE/2;
      const nwy = n._wy !== undefined ? n._wy : n.ty*TILE+TILE/2;
      const dx=_pl.wx-nwx, dy=_pl.wy-nwy;
      if(Math.hypot(dx,dy)<TILE*1.8) return {type:'npc',ref:n};
    }
    // Exit — trigger when player walks into the bottom exit gap (cols 9 or 10, row 13)
    const _pc=Math.floor(_pl.wx/TILE), _pr=Math.floor(_pl.wy/TILE);
    if(_pr>=int.exitTy && (_pc===int.exitTx||_pc===int.exitTx+1))
      return {type:'exit',ref:int};
  }
  return null;
}

// ══════════════════════════════════════════════════════════
//  DRAWING — TILES
// ══════════════════════════════════════════════════════════
function _drawExtTiles(ctx, a, cx, cy, cw, ch){
  const startC=Math.max(0,Math.floor(cx/TILE));
  const endC  =Math.min(EXT_COLS,Math.ceil((cx+cw)/TILE)+1);
  const startR=Math.max(0,Math.floor(cy/TILE));
  const endR  =Math.min(EXT_ROWS,Math.ceil((cy+ch)/TILE)+1);

  for(let r=startR;r<endR;r++){
    for(let c=startC;c<endC;c++){
      const t=EXT_MAP[r][c];
      const sx=c*TILE-cx, sy=r*TILE-cy;
      if(t===0){
        ctx.fillStyle=a.ground; ctx.fillRect(sx,sy,TILE,TILE);
        if((c+r)%2===0){ctx.fillStyle='rgba(255,255,255,0.02)';ctx.fillRect(sx,sy,TILE,TILE);}
      } else if(t===1){
        ctx.fillStyle=a.path; ctx.fillRect(sx,sy,TILE,TILE);
        ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.5; ctx.strokeRect(sx+1,sy+1,TILE-2,TILE-2);
      } else if(t===2){
        ctx.fillStyle=a.water; ctx.fillRect(sx,sy,TILE,TILE);
        const s=Math.sin(Date.now()*0.001+c*0.8+r*0.5)*0.06;
        ctx.fillStyle=`rgba(80,140,200,${0.08+s})`; ctx.fillRect(sx,sy,TILE,TILE/2);
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(sx+1,sy+2,TILE-2,1);
      } else if(t===3){
        ctx.fillStyle=a.wallDark; ctx.fillRect(sx,sy,TILE,TILE);
        ctx.fillStyle='rgba(255,255,255,0.02)'; ctx.fillRect(sx,sy,TILE,1);
      } else if(t===4){
        ctx.fillStyle=a.ground; ctx.fillRect(sx,sy,TILE,TILE);
        ctx.fillStyle='rgba(40,30,0,0.3)'; ctx.fillRect(sx,sy,TILE,TILE);
      } else if(t===5){
        ctx.fillStyle=a.ground; ctx.fillRect(sx,sy,TILE,TILE);
        ctx.fillStyle=`rgba(${a.tr===255?180:100},${a.tg===150?120:80},30,0.5)`;
        ctx.fillRect(sx+3,sy+3,4,4); ctx.fillRect(sx+9,sy+6,4,4); ctx.fillRect(sx+5,sy+10,4,4);
      }
    }
  }
}

function _drawIntTiles(ctx, a, map, cx, cy){
  const T=TILE;
  for(let r=0;r<INT_H;r++){
    for(let c=0;c<INT_W;c++){
      const t=map[r][c];
      const sx=c*T-cx, sy=r*T-cy;
      const tt=Date.now()*0.006;

      switch(t){
        case 0: { // ── WOOD FLOOR ──
          // Base plank colour, alternating rows
          const pc = (r%2===0) ? '#3a2810' : '#352608';
          ctx.fillStyle=pc; ctx.fillRect(sx,sy,T,T);
          // Plank grain lines (horizontal)
          ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(sx,sy+T-1,T,1);
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(sx,sy,T,1);
          // Vertical seam every 2 tiles offset by row
          if((c+(r%2))%2===0){ ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(sx+T-1,sy,1,T); }
          // Occasional knot
          if((c*7+r*3)%17===0){ ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(sx+5,sy+8,3,2,0,0,Math.PI*2); ctx.fill(); }
          break;
        }
        case 1: { // ── STONE WALL ──
          // Base stone
          ctx.fillStyle='#2a2218'; ctx.fillRect(sx,sy,T,T);
          // Brick pattern — offset mortar
          const row=Math.floor(r), col=Math.floor(c);
          const brickOff=(row%2)*8;
          // Horizontal mortar line in middle
          ctx.fillStyle='#1a1610'; ctx.fillRect(sx,sy+T/2-1,T,2);
          // Vertical seams
          for(let bx=sx+(brickOff%T);bx<sx+T;bx+=8){ ctx.fillStyle='#1a1610'; ctx.fillRect(bx,sy,1,T/2); }
          for(let bx=sx+((brickOff+4)%T);bx<sx+T;bx+=8){ ctx.fillStyle='#1a1610'; ctx.fillRect(bx,sy+T/2,1,T/2); }
          // Top highlight on each stone face
          ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(sx,sy,T,1);
          // Occasional moss
          if((c*5+r*11)%13===0){ ctx.fillStyle='rgba(20,50,10,0.4)'; ctx.fillRect(sx+3,sy+3,5,4); }
          break;
        }
        case 2: { // ── BAR / COUNTER ──
          // Counter top (dark polished wood)
          ctx.fillStyle='#2a1808'; ctx.fillRect(sx,sy,T,T);
          // Top surface — lighter
          ctx.fillStyle='#5a3418'; ctx.fillRect(sx,sy,T,5);
          // Polish sheen
          ctx.fillStyle='rgba(255,200,100,0.12)'; ctx.fillRect(sx+2,sy+1,T-4,2);
          // Front edge
          ctx.fillStyle='#3a2010'; ctx.fillRect(sx,sy+5,T,T-5);
          // Grain lines on front
          ctx.fillStyle='rgba(0,0,0,0.15)';
          ctx.fillRect(sx,sy+8,T,1); ctx.fillRect(sx,sy+12,T,1);
          // Items on bar — occasional mug
          if(c%3===1){ ctx.fillStyle='#8a6030'; ctx.fillRect(sx+5,sy+1,4,4); ctx.fillStyle='rgba(200,160,60,0.8)'; ctx.fillRect(sx+6,sy+1,2,3); }
          break;
        }
        case 3: { // ── RUG ──
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Rug base — deep red
          ctx.fillStyle='rgba(140,25,25,0.75)'; ctx.fillRect(sx+1,sy+1,T-2,T-2);
          // Border pattern
          ctx.fillStyle='rgba(200,140,30,0.5)'; ctx.strokeStyle='rgba(200,140,30,0.5)'; ctx.lineWidth=1;
          ctx.strokeRect(sx+1,sy+1,T-2,T-2);
          ctx.strokeRect(sx+3,sy+3,T-6,T-6);
          // Diagonal cross-lines
          ctx.fillStyle='rgba(200,140,30,0.2)';
          ctx.fillRect(sx+T/2-1,sy+1,1,T-2); ctx.fillRect(sx+1,sy+T/2-1,T-2,1);
          break;
        }
        case 4: { // ── FIREPLACE ──
          // Stone surround
          ctx.fillStyle='#2a1c14'; ctx.fillRect(sx,sy,T,T);
          // Brick pattern around surround
          ctx.fillStyle='#1e1610'; ctx.fillRect(sx,sy+T/2,T,1);
          ctx.fillStyle='#1e1610'; for(let bx=sx;bx<sx+T;bx+=6) ctx.fillRect(bx,sy,1,T);
          // Firebox opening
          ctx.fillStyle='#100c08'; ctx.fillRect(sx+3,sy+3,T-6,T-6);
          // Animated fire
          const ff=0.5+0.5*Math.sin(tt+sx*0.3);
          const ff2=0.5+0.5*Math.sin(tt*1.3+sx*0.5);
          // Coals at bottom
          ctx.fillStyle=`rgba(200,80,10,0.9)`; ctx.fillRect(sx+4,sy+T-6,T-8,4);
          ctx.fillStyle=`rgba(255,120,0,0.7)`; ctx.fillRect(sx+5,sy+T-7,T-10,3);
          // Main flame
          ctx.fillStyle=`rgba(${220+Math.floor(ff*35)},${80+Math.floor(ff*60)},10,0.85)`;
          ctx.fillRect(sx+4,sy+5,T-8,T-8);
          // Inner bright flame
          ctx.fillStyle=`rgba(255,${180+Math.floor(ff2*60)},${40+Math.floor(ff2*40)},0.7)`;
          ctx.fillRect(sx+6,sy+6,T-12,T-12);
          // Tip glow
          ctx.fillStyle=`rgba(255,230,100,${0.4+ff*0.3})`; ctx.fillRect(sx+7,sy+5,3,3);
          // Glow cast on floor in front
          const fglo=ctx.createRadialGradient(sx+T/2,sy+T,0,sx+T/2,sy+T,T*1.5);
          fglo.addColorStop(0,`rgba(255,120,20,${0.12*ff})`); fglo.addColorStop(1,'rgba(255,120,20,0)');
          ctx.fillStyle=fglo; ctx.fillRect(sx-T/2,sy,T*2,T*2);
          break;
        }
        case 5: { // ── BOOKSHELF ──
          // Wood backing
          ctx.fillStyle='#2a1808'; ctx.fillRect(sx,sy,T,T);
          // Shelf planks
          ctx.fillStyle='#4a2e14'; ctx.fillRect(sx,sy+5,T,2); ctx.fillRect(sx,sy+11,T,2);
          // Books — varied colours and heights
          const bookCols=['#8a1818','#1a3a8a','#1a6a1a','#8a6010','#5a1a8a','#8a4010','#1a6a6a','#6a6a1a'];
          for(let i=0;i<5;i++){
            const bc=bookCols[(c*5+r*3+i)%bookCols.length];
            const bw=2+(i%2); const bh=4+((c+r+i)%3);
            ctx.fillStyle=bc; ctx.fillRect(sx+1+i*3,sy+7-bh,bw,bh);
            // Spine highlight
            ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(sx+1+i*3,sy+7-bh,1,bh);
          }
          // Lower shelf books
          for(let i=0;i<5;i++){
            const bc=bookCols[(c*5+r*3+i+3)%bookCols.length];
            const bw=2+(i%2); const bh=3+((c+r+i+1)%3);
            ctx.fillStyle=bc; ctx.fillRect(sx+1+i*3,sy+13-bh,bw,bh);
            ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(sx+1+i*3,sy+13-bh,1,bh);
          }
          // Top shelf dust
          ctx.fillStyle='rgba(255,240,200,0.05)'; ctx.fillRect(sx,sy,T,2);
          break;
        }
        case 6: { // ── BED ──
          // Floor beneath
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Bed frame — dark wood
          ctx.fillStyle='#3a2010'; ctx.fillRect(sx+1,sy+1,T-2,T-2);
          // Headboard (top)
          ctx.fillStyle='#2a1408'; ctx.fillRect(sx+1,sy+1,T-2,4);
          ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(sx+2,sy+2,T-4,1);
          // Footboard (bottom)
          ctx.fillStyle='#2a1408'; ctx.fillRect(sx+1,sy+T-3,T-2,2);
          // Mattress / blanket
          ctx.fillStyle='#b0a0c0'; ctx.fillRect(sx+2,sy+5,T-4,T-8);
          // Blanket fold line
          ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(sx+2,sy+8,T-4,1);
          ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+2,sy+9,T-4,1);
          // Pillow
          ctx.fillStyle='#e0d8f0'; ctx.fillRect(sx+3,sy+5,T-6,4);
          ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(sx+4,sy+6,3,2);
          break;
        }
        case 7: { // ── ALTAR ──
          ctx.fillStyle='#10102a'; ctx.fillRect(sx,sy,T,T);
          // Stone base
          ctx.fillStyle='#282870'; ctx.fillRect(sx+2,sy+4,T-4,T-5);
          ctx.fillStyle='#1a1a50'; ctx.fillRect(sx+2,sy+T-3,T-4,3);
          // Top surface glow
          const ag=0.5+0.5*Math.sin(tt*0.8);
          ctx.fillStyle=`rgba(140,160,255,${0.3+ag*0.2})`; ctx.fillRect(sx+3,sy+4,T-6,4);
          // Mystical rune glow
          const rg=ctx.createRadialGradient(sx+T/2,sy+T/2,0,sx+T/2,sy+T/2,T/2);
          rg.addColorStop(0,`rgba(160,180,255,${0.35+ag*0.25})`);
          rg.addColorStop(1,'rgba(80,100,200,0)');
          ctx.fillStyle=rg; ctx.fillRect(sx,sy,T,T);
          // Cross symbol
          ctx.fillStyle=`rgba(200,220,255,${0.6+ag*0.3})`;
          ctx.fillRect(sx+T/2-1,sy+5,2,T-9); ctx.fillRect(sx+4,sy+T/2-1,T-8,2);
          // Candle flames on corners (tiny)
          [[sx+2,sy+3],[sx+T-4,sy+3]].forEach(([cx2,cy2])=>{
            ctx.fillStyle='rgba(255,200,50,0.7)'; ctx.fillRect(cx2,cy2,2,3);
            ctx.fillStyle='rgba(255,120,10,0.5)'; ctx.fillRect(cx2,cy2+2,2,2);
          });
          break;
        }
        case 8: { // ── ANVIL ──
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Anvil body — top face (wide)
          ctx.fillStyle='#484848'; ctx.fillRect(sx+1,sy+4,T-2,4);
          ctx.fillStyle='#585858'; ctx.fillRect(sx+1,sy+4,T-2,2);
          ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+2,sy+4,4,1);
          // Anvil horn (left point)
          ctx.fillStyle='#404040';
          ctx.beginPath(); ctx.moveTo(sx+1,sy+8); ctx.lineTo(sx+1,sy+6); ctx.lineTo(sx-2,sy+7); ctx.closePath(); ctx.fill();
          // Anvil waist
          ctx.fillStyle='#383838'; ctx.fillRect(sx+3,sy+8,T-6,3);
          // Anvil base
          ctx.fillStyle='#404040'; ctx.fillRect(sx+1,sy+11,T-2,3);
          ctx.fillStyle='#303030'; ctx.fillRect(sx+1,sy+13,T-2,1);
          // Heat glow on top from recent use
          ctx.fillStyle=`rgba(255,80,10,${0.05+0.05*Math.sin(tt)})`; ctx.fillRect(sx+1,sy+4,T-2,4);
          break;
        }
        case 9: { // ── TABLE ──
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Table top (top-down view — mostly the surface)
          ctx.fillStyle='#6a4020'; ctx.fillRect(sx+1,sy+2,T-2,T-4);
          ctx.fillStyle='#7a4c26'; ctx.fillRect(sx+1,sy+2,T-2,3);
          // Wood grain
          ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(sx+1,sy+6,T-2,1); ctx.fillRect(sx+1,sy+10,T-2,1);
          ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(sx+2,sy+3,3,1);
          // Legs visible at corners (slightly darker squares)
          ctx.fillStyle='#3a2010';
          ctx.fillRect(sx+1,sy+2,3,3); ctx.fillRect(sx+T-4,sy+2,3,3);
          ctx.fillRect(sx+1,sy+T-5,3,3); ctx.fillRect(sx+T-4,sy+T-5,3,3);
          break;
        }
        case 10: { // ── WINDOW WALL ──
          // Draw as wall with a window in it
          ctx.fillStyle='#2a2218'; ctx.fillRect(sx,sy,T,T);
          ctx.fillStyle='#1a1610'; ctx.fillRect(sx,sy+T/2-1,T,2);
          for(let bx=sx;bx<sx+T;bx+=8){ ctx.fillStyle='#1a1610'; ctx.fillRect(bx,sy,1,T/2); ctx.fillRect(bx+4,sy+T/2,1,T/2); }
          ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(sx,sy,T,1);
          // Window pane — exterior light
          const wlum=0.3+0.1*Math.sin(tt*0.3);
          ctx.fillStyle=`rgba(180,210,255,${wlum})`; ctx.fillRect(sx+3,sy+3,T-6,T-6);
          // Window cross bars
          ctx.fillStyle='#3a2818'; ctx.fillRect(sx+T/2-1,sy+3,2,T-6); ctx.fillRect(sx+3,sy+T/2-1,T-6,2);
          // Light glint
          ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(sx+4,sy+4,3,2);
          // Sill
          ctx.fillStyle='#4a3020'; ctx.fillRect(sx+2,sy+T-4,T-4,3);
          break;
        }
        case 11: { // ── WALL TORCH ──
          // Wall background
          ctx.fillStyle='#2a2218'; ctx.fillRect(sx,sy,T,T);
          ctx.fillStyle='#1a1610'; ctx.fillRect(sx,sy+T/2-1,T,2);
          for(let bx=sx;bx<sx+T;bx+=8){ ctx.fillStyle='#1a1610'; ctx.fillRect(bx,sy,1,T/2); ctx.fillRect(bx+4,sy+T/2,1,T/2); }
          // Torch bracket
          ctx.fillStyle='#504030'; ctx.fillRect(sx+T/2-1,sy+5,2,8);
          ctx.fillStyle='#403020'; ctx.fillRect(sx+T/2-3,sy+10,6,2);
          // Torch body
          ctx.fillStyle='#6a3a18'; ctx.fillRect(sx+T/2-2,sy+4,4,7);
          ctx.fillStyle='#8a5020'; ctx.fillRect(sx+T/2-1,sy+4,2,5);
          // Flame
          const tf=0.5+0.5*Math.sin(tt*1.5+c);
          ctx.fillStyle=`rgba(${220+Math.floor(tf*35)},${80+Math.floor(tf*80)},10,0.9)`;
          ctx.fillRect(sx+T/2-2,sy+1,4,5);
          ctx.fillStyle=`rgba(255,200,50,${0.6+tf*0.3})`; ctx.fillRect(sx+T/2-1,sy+1,2,3);
          // Glow cast
          const tglo=ctx.createRadialGradient(sx+T/2,sy+4,0,sx+T/2,sy+4,T*1.2);
          tglo.addColorStop(0,`rgba(255,140,20,${0.18*tf})`); tglo.addColorStop(1,'rgba(255,140,20,0)');
          ctx.fillStyle=tglo; ctx.fillRect(sx-T,sy-T,T*3,T*3);
          break;
        }
        case 12: { // ── CHEST ──
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Chest body
          ctx.fillStyle='#5a3810'; ctx.fillRect(sx+2,sy+5,T-4,T-7);
          // Lid (top)
          ctx.fillStyle='#7a4a18'; ctx.fillRect(sx+2,sy+3,T-4,4);
          ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+3,sy+3,T-6,1);
          // Metal band
          ctx.fillStyle='#808080'; ctx.fillRect(sx+2,sy+7,T-4,2);
          ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(sx+2,sy+7,T-4,1);
          // Lock
          ctx.fillStyle='#c0a020'; ctx.fillRect(sx+T/2-2,sy+6,4,4);
          ctx.fillStyle='#1a1408'; ctx.fillRect(sx+T/2-1,sy+8,2,2);
          // Corner brackets
          ctx.fillStyle='#707070';
          ctx.fillRect(sx+2,sy+5,2,T-7); ctx.fillRect(sx+T-4,sy+5,2,T-7);
          break;
        }
        case 13: { // ── STAIRS DOWN ──
          ctx.fillStyle='#252018'; ctx.fillRect(sx,sy,T,T);
          // Steps (4 steps going down = smaller each row)
          for(let s=0;s<4;s++){
            const sw=T-s*3;
            ctx.fillStyle=`rgba(${40+s*15},${35+s*12},${25+s*8},1)`;
            ctx.fillRect(sx+(T-sw)/2,sy+s*4,sw,4);
            ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(sx+(T-sw)/2,sy+s*4,sw,1);
            ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(sx+(T-sw)/2,sy+s*4+3,sw,1);
          }
          // Dark void at bottom
          ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(sx+4,sy+12,T-8,4);
          // Down arrow hint
          ctx.fillStyle='rgba(200,170,80,0.4)';
          ctx.fillRect(sx+T/2-1,sy+8,2,5); ctx.fillRect(sx+T/2-3,sy+11,6,2); ctx.fillRect(sx+T/2-2,sy+10,4,1);
          break;
        }
        case 14: { // ── PLANT / VASE ──
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Pot
          ctx.fillStyle='#8a4820'; ctx.fillRect(sx+4,sy+10,8,6);
          ctx.fillStyle='#6a3010'; ctx.fillRect(sx+3,sy+9,10,3);
          ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+4,sy+10,3,2);
          // Leaves
          ctx.fillStyle='#206020'; ctx.fillRect(sx+5,sy+5,6,6);
          ctx.fillStyle='#308030'; ctx.fillRect(sx+3,sy+6,5,5); ctx.fillRect(sx+8,sy+5,5,5);
          ctx.fillStyle='#409040'; ctx.fillRect(sx+6,sy+3,4,4);
          ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+6,sy+4,2,2);
          break;
        }
        case 15: { // ── WEAPON RACK ──
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Rack frame
          ctx.fillStyle='#4a3018'; ctx.fillRect(sx+1,sy+2,T-2,2); ctx.fillRect(sx+1,sy+T-4,T-2,2);
          ctx.fillRect(sx+1,sy+2,2,T-4); ctx.fillRect(sx+T-3,sy+2,2,T-4);
          // Sword
          ctx.fillStyle='#909090'; ctx.fillRect(sx+4,sy+3,2,T-6);
          ctx.fillStyle='#c0c0c0'; ctx.fillRect(sx+4,sy+3,1,T-6);
          ctx.fillStyle='#c09020'; ctx.fillRect(sx+2,sy+7,6,2);
          ctx.fillStyle='#806020'; ctx.fillRect(sx+4,sy+T-6,2,3);
          // Axe
          ctx.fillStyle='#707070'; ctx.fillRect(sx+9,sy+4,2,T-7);
          ctx.fillStyle='#585858'; ctx.fillRect(sx+8,sy+4,3,6);
          ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(sx+8,sy+4,1,5);
          break;
        }
        case 16: { // ── CAULDRON ──
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Cauldron body
          ctx.fillStyle='#282828'; ctx.fillRect(sx+2,sy+5,T-4,T-7);
          ctx.fillStyle='#202020'; ctx.fillRect(sx+3,sy+6,T-6,T-9);
          // Rim
          ctx.fillStyle='#383838'; ctx.fillRect(sx+1,sy+4,T-2,3);
          ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+2,sy+4,T-4,1);
          // Legs
          ctx.fillStyle='#303030'; ctx.fillRect(sx+2,sy+T-3,3,3); ctx.fillRect(sx+T-5,sy+T-3,3,3);
          // Bubbling liquid
          const cv=0.5+0.5*Math.sin(tt*2);
          ctx.fillStyle=`rgba(60,${140+Math.floor(cv*60)},20,0.8)`; ctx.fillRect(sx+3,sy+5,T-6,3);
          ctx.fillStyle=`rgba(100,${180+Math.floor(cv*40)},30,0.5)`;
          ctx.beginPath(); ctx.arc(sx+5,sy+5+cv*2,1.5,0,Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(sx+10,sy+4+cv,1,0,Math.PI*2); ctx.fill();
          break;
        }
        default: {
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
        }
      }
    }
  }
}

// ── Draw exterior building ────────────────────────────────
function _drawExtBuilding(ctx, b, a, cx, cy){
  const pal=BPAL[b.pal];
  const x=b.tx*TILE-cx, y=b.ty*TILE-cy;
  const w=b.tw*TILE, h=b.th*TILE;
  const isHouse = b.pal===8;

  if(x+w<0||y+h<0||x>_logW()||y>_logH()) return; // cull

  // ── Dungeon Gate ──────────────────────────────────────────
  if(b.id==='gate'){
    const near=_nearInteractable&&_nearInteractable.type==='gate';
    const t2=Date.now()*0.001;
    const flicker=0.7+0.3*Math.sin(t2*3.1+Math.sin(t2*1.7));
    ctx.fillStyle='#0e0b08'; ctx.fillRect(x,y,w,h);
    ctx.fillStyle='rgba(255,255,255,0.04)';
    for(let bx=x;bx<x+w;bx+=TILE){ for(let by=y;by<y+h;by+=TILE/2){ const offset=(by/8%2===0)?0:TILE/2; ctx.fillRect(bx+offset,by,TILE-1,TILE/2-1); } }
    ctx.fillStyle='rgba(0,0,0,0.3)';
    for(let bx=x;bx<x+w;bx+=TILE) ctx.fillRect(bx,y,1,h);
    for(let by=y;by<y+h;by+=TILE/2) ctx.fillRect(x,by,w,1);
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.fillRect(x+w*0.15,y+3,1,h*0.4); ctx.fillRect(x+w*0.16,y+h*0.15,1,h*0.2); ctx.fillRect(x+w*0.8,y+5,1,h*0.35);
    const archX=x+w*0.25, archW=w*0.5, archY=y+2, archH=h-4, archMidX=archX+archW/2, archTopY=archY+archH*0.18;
    const voidGrad=ctx.createLinearGradient(archX,archY,archX,archY+archH);
    voidGrad.addColorStop(0,`rgba(60,0,0,${0.4*flicker})`); voidGrad.addColorStop(0.4,'rgba(10,0,0,0.95)'); voidGrad.addColorStop(1,'rgba(0,0,0,1)');
    ctx.fillStyle=voidGrad; ctx.beginPath(); ctx.moveTo(archX,archY+archH); ctx.lineTo(archX,archTopY+archH*0.25); ctx.quadraticCurveTo(archX,archTopY,archMidX,archY); ctx.quadraticCurveTo(archX+archW,archTopY,archX+archW,archTopY+archH*0.25); ctx.lineTo(archX+archW,archY+archH); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#2a1a10'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(archX,archY+archH); ctx.lineTo(archX,archTopY+archH*0.25); ctx.quadraticCurveTo(archX,archTopY,archMidX,archY); ctx.quadraticCurveTo(archX+archW,archTopY,archX+archW,archTopY+archH*0.25); ctx.lineTo(archX+archW,archY+archH); ctx.stroke();
    const glowR=archW*0.55;
    const glow=ctx.createRadialGradient(archMidX,archY+archH*0.6,0,archMidX,archY+archH*0.6,glowR);
    glow.addColorStop(0,`rgba(160,20,0,${0.25*flicker})`); glow.addColorStop(0.5,`rgba(80,5,0,${0.1*flicker})`); glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow; ctx.fillRect(archX,archY,archW,archH);
    const eyeY=archY+archH*0.35;
    [archMidX-archW*0.15, archMidX+archW*0.1].forEach(ex=>{ const eg=ctx.createRadialGradient(ex,eyeY,0,ex,eyeY,5); eg.addColorStop(0,`rgba(255,60,0,${0.9*flicker})`); eg.addColorStop(0.4,`rgba(200,20,0,${0.5*flicker})`); eg.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(ex,eyeY,5,0,Math.PI*2); ctx.fill(); ctx.fillStyle=`rgba(255,200,0,${0.8*flicker})`; ctx.beginPath(); ctx.arc(ex,eyeY,1.5,0,Math.PI*2); ctx.fill(); });
    ctx.strokeStyle='#302820'; ctx.lineWidth=2;
    for(let ci=0;ci<3;ci++){ const cx3=archX+4+ci*5; for(let cy3=archY+4;cy3<archY+archH*0.5;cy3+=6){ ctx.beginPath(); ctx.arc(cx3,cy3,2,0,Math.PI*2); ctx.stroke(); } const cx4=archX+archW-4-ci*5; for(let cy4=archY+4;cy4<archY+archH*0.5;cy4+=6){ ctx.beginPath(); ctx.arc(cx4,cy4,2,0,Math.PI*2); ctx.stroke(); } }
    [[x+TILE*0.5,y+TILE*0.4],[x+w-TILE*1.2,y+TILE*0.4]].forEach(([sx2,sy2])=>{ ctx.fillStyle='#2a1a0a'; ctx.fillRect(sx2,sy2,10,8); ctx.fillRect(sx2+2,sy2-2,6,4); ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(sx2+1,sy2+2,3,3); ctx.fillRect(sx2+6,sy2+2,3,3); ctx.fillRect(sx2+3,sy2+6,4,2); });
    const fogGrad=ctx.createLinearGradient(archX,archY+archH-8,archX,archY+archH+6); fogGrad.addColorStop(0,`rgba(80,10,0,${0.3*flicker})`); fogGrad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=fogGrad; ctx.fillRect(archX,archY+archH-8,archW,14);
    ctx.font='bold 4px "Press Start 2P",monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom';
    const labelW=ctx.measureText('⚔ DUNGEON GATE').width+10; const lx=archMidX-labelW/2, ly2=y-3;
    ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(lx,ly2-8,labelW,9);
    ctx.strokeStyle=near?'#ffd84a':'rgba(180,30,0,0.8)'; ctx.lineWidth=1; ctx.strokeRect(lx,ly2-8,labelW,9);
    ctx.fillStyle=near?'#ffd84a':`rgba(220,80,30,${0.7+0.3*flicker})`; ctx.fillText('⚔ DUNGEON GATE',archMidX,ly2-1);
    return;
  }

  // ── Notice Board ──────────────────────────────────────────
  if(b.id==='noticeboard'){
    const cx2=x+w/2, cy2=y+h/2;
    const near=_nearInteractable&&(_nearInteractable.ref===b);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(x+6,y+h-2,w-12,4);
    ctx.fillStyle='#5a3a18'; ctx.fillRect(cx2-14,cy2,4,h/2+4); ctx.fillRect(cx2+10,cy2,4,h/2+4);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(cx2-11,cy2,1,h/2+4); ctx.fillRect(cx2+13,cy2,1,h/2+4);
    ctx.fillStyle='#4a2e10'; ctx.fillRect(cx2-16,cy2-2,32,4);
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(cx2-16,cy2-2,32,1);
    ctx.fillStyle='#6a4a20'; ctx.fillRect(cx2-18,cy2-20,36,22);
    ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(cx2-18,cy2-20,2,22); ctx.fillRect(cx2+16,cy2-20,2,22);
    ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(cx2-18,cy2-12,36,1); ctx.fillRect(cx2-18,cy2-5,36,1);
    ctx.fillStyle='rgba(240,230,200,0.88)'; ctx.fillRect(cx2-15,cy2-18,14,10);
    ctx.fillStyle='rgba(240,230,200,0.75)'; ctx.fillRect(cx2+1,cy2-17,12,9);
    ctx.fillStyle='rgba(235,225,195,0.65)'; ctx.fillRect(cx2-10,cy2-8,10,7);
    ctx.fillStyle='rgba(50,30,10,0.45)';
    ctx.fillRect(cx2-13,cy2-16,10,1); ctx.fillRect(cx2-13,cy2-14,8,1); ctx.fillRect(cx2-13,cy2-12,9,1);
    ctx.fillRect(cx2+3,cy2-15,8,1); ctx.fillRect(cx2+3,cy2-13,6,1); ctx.fillRect(cx2+3,cy2-11,7,1);
    ctx.fillStyle='rgba(180,50,30,0.9)'; ctx.fillRect(cx2-15,cy2-18,2,2); ctx.fillRect(cx2-3,cy2-18,2,2); ctx.fillRect(cx2+1,cy2-17,2,2); ctx.fillRect(cx2+11,cy2-17,2,2);
    ctx.font='bold 5px "Press Start 2P",monospace';
    const tw=ctx.measureText('Notice Board').width+8; const sx2=cx2-tw/2;
    ctx.fillStyle='rgba(80,60,30,0.8)'; ctx.fillRect(sx2+tw*0.25,cy2-26,1,4); ctx.fillRect(sx2+tw*0.75,cy2-26,1,4);
    ctx.fillStyle=near?'#3a2800':'#2a1c08'; ctx.fillRect(sx2,cy2-22,tw,10);
    ctx.strokeStyle=near?'#ffd84a':pal[2]; ctx.lineWidth=1; ctx.strokeRect(sx2,cy2-22,tw,10);
    ctx.fillStyle=near?'#ffd84a':pal[2]; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('Notice Board',cx2,cy2-17);
    return;
  }

  // ── Graveyard ────────────────────────────────────────────
  if(b.id==='graveyard'){
    const near=_nearInteractable&&(_nearInteractable.ref===b);
    ctx.fillStyle='#141412'; ctx.fillRect(x,y,w,h);
    for(let gr=0;gr<h;gr+=5){ ctx.fillStyle='rgba(255,255,255,0.01)'; ctx.fillRect(x,y+gr,w,1); }
    const T=TILE;
    ctx.fillStyle='#3a3630'; ctx.fillRect(x,y,w,T); ctx.fillRect(x,y+h-T,w,T); ctx.fillRect(x,y,T,h); ctx.fillRect(x+w-T,y,T,h);
    ctx.fillStyle='rgba(0,0,0,0.25)';
    for(let wc=x+T*2;wc<x+w-T;wc+=T){ ctx.fillRect(wc,y,1,T); ctx.fillRect(wc,y+h-T,1,T); }
    for(let wr=y+T*2;wr<y+h-T;wr+=T){ ctx.fillRect(x,wr,T,1); ctx.fillRect(x+w-T,wr,T,1); }
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,y,w,1); ctx.fillRect(x,y,1,h); ctx.fillRect(x+w-1,y,1,h); ctx.fillRect(x,y+h-1,w,1);
    ctx.fillStyle='rgba(20,50,15,0.4)'; ctx.fillRect(x+T*2,y+4,T-2,4); ctx.fillRect(x+T*5,y+3,T-4,5); ctx.fillRect(x+T*2,y+h-T+5,T-2,4); ctx.fillRect(x+T*6,y+h-T+4,T-3,4); ctx.fillRect(x+2,y+T*2,4,T-2); ctx.fillRect(x+3,y+T*5,5,T-3);
    const gx=b.doorTx*TILE-cx;
    ctx.fillStyle='#141412'; ctx.fillRect(gx,y+h-T,T*2,T+2);
    ctx.fillStyle='#4a4440'; ctx.fillRect(gx-2,y+h-T-4,4,T+4); ctx.fillRect(gx+T*2-2,y+h-T-4,4,T+4);
    ctx.fillStyle='#5a5450'; ctx.fillRect(gx-2,y+h-T-4,4,3); ctx.fillRect(gx+T*2-2,y+h-T-4,4,3);
    ctx.fillStyle='#2a2828'; for(let fi=0;fi<5;fi++) ctx.fillRect(gx+3+fi*5,y+h-T,2,T);
    const iX=x+T+4, iY=y+T+4, iW=w-T*2-8, iH=h-T*2-8;
    const stones=[[0.05,0.05],[0.22,0.02],[0.40,0.07],[0.60,0.03],[0.78,0.08],[0.92,0.04],[0.10,0.25],[0.30,0.22],[0.52,0.28],[0.70,0.20],[0.88,0.26],[0.08,0.45],[0.28,0.50],[0.50,0.44],[0.72,0.48],[0.90,0.42],[0.06,0.68],[0.20,0.72],[0.42,0.65],[0.82,0.70],[0.95,0.66]];
    for(const [fx,fy] of stones){
      const gsx=Math.floor(iX+fx*iW), gsy=Math.floor(iY+fy*iH);
      if(gsy>y+h-T*2.5 && gsx>gx-T && gsx<gx+T*3) continue;
      const seed=(gsx*7+gsy*13)%10; const sw=7+(seed%3), sh=6+(seed%2);
      ctx.fillStyle=seed>5?'#383230':'#403a36'; ctx.fillRect(gsx,gsy+4,sw,sh);
      ctx.fillStyle=seed>5?'#302c28':'#383230'; ctx.fillRect(gsx,gsy,sw,5); ctx.fillRect(gsx+1,gsy-2,sw-2,3);
      ctx.fillStyle='rgba(255,255,255,0.07)'; ctx.fillRect(gsx,gsy,1,7);
      if(seed%3===0){ ctx.fillStyle='rgba(25,55,15,0.45)'; ctx.fillRect(gsx+2,gsy+5,sw-3,3); }
      ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(gsx+2,gsy+1,sw-4,1); ctx.fillRect(gsx+2,gsy+3,sw-5,1);
      ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(gsx-1,gsy+sh+3,sw+2,2);
    }
    ctx.fillStyle='#242018'; ctx.fillRect(x+w-T-8,y+T+4,3,18); ctx.fillRect(x+w-T-14,y+T+10,10,2); ctx.fillRect(x+w-T-8,y+T+7,7,2); ctx.fillRect(x+w-T-10,y+T+14,6,2);
    ctx.font='bold 5px "Press Start 2P",monospace';
    const stw=ctx.measureText('Graveyard').width+8, ssx=gx+T-stw/2;
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(ssx+1,y+h-T-16,stw,10);
    ctx.fillStyle=near?'#3a2800':'#1a1410'; ctx.fillRect(ssx,y+h-T-17,stw,10);
    ctx.strokeStyle=near?'#ffd84a':'#504848'; ctx.lineWidth=1; ctx.strokeRect(ssx,y+h-T-17,stw,10);
    ctx.fillStyle=near?'#ffd84a':'#807070'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('Graveyard',gx+T,y+h-T-12);
    return;
  }

  // Drop shadow
  ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(x+4,y+h,w,5);

  // ── HELPERS ──────────────────────────────────────────────
  function _roof(rx,ry,rw,rh,col,overhang=3){
    ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(rx-overhang,ry+rh); ctx.lineTo(rx+rw+overhang,ry+rh); ctx.lineTo(rx+rw/2,ry); ctx.closePath(); ctx.fill();
  }
  function _win(wx,wy,ws,wh,glowCol){
    ctx.fillStyle='#1a1208'; ctx.fillRect(wx,wy,ws,wh);
    ctx.fillStyle=glowCol||'rgba(255,200,100,0.25)'; ctx.fillRect(wx,wy,ws,wh);
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(wx+Math.floor(ws/2)-1,wy,2,wh); ctx.fillRect(wx,wy+Math.floor(wh/2)-1,ws,2);
    ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(wx+1,wy+1,Math.floor(ws/2)-2,Math.floor(wh/2)-2);
    ctx.strokeStyle='#4a3010'; ctx.lineWidth=1; ctx.strokeRect(wx-0.5,wy-0.5,ws+1,wh+1);
  }
  function _bricks(rx,ry,rw,rh,alpha=0.1){
    ctx.fillStyle=`rgba(0,0,0,${alpha})`;
    for(let row=ry+5;row<ry+rh;row+=5){ ctx.fillRect(rx,row,rw,1); }
    for(let row=ry;row<ry+rh;row+=5){ const off=(Math.floor((row-ry)/5)%2)*TILE/2; for(let col=rx+off;col<rx+rw;col+=TILE) ctx.fillRect(col,row,1,5); }
  }
  function _planks(rx,ry,rw,rh,alpha=0.08){
    ctx.fillStyle=`rgba(0,0,0,${alpha})`; for(let row=ry+5;row<ry+rh;row+=5) ctx.fillRect(rx,row,rw,1);
    ctx.fillStyle=`rgba(255,255,255,0.04)`; for(let row=ry+2;row<ry+rh;row+=5) ctx.fillRect(rx,row,rw,1);
  }
  function _door(dx2,dy2,dw,dh,dcol,acol){
    ctx.fillStyle=dcol; ctx.fillRect(dx2,dy2,dw,dh);
    ctx.fillStyle=acol||'rgba(255,200,80,0.1)'; ctx.fillRect(dx2+2,dy2+4,dw-4,dh-5);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(dx2,dy2,dw,2);
    ctx.fillStyle=dcol; ctx.fillRect(dx2+dw-5,dy2+Math.floor(dh/2)-1,3,3);
    ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.lineWidth=1; ctx.strokeRect(dx2,dy2,dw,dh);
  }
  function _sign(sx2,sy2,label,nearSign){
    ctx.font='bold 4px "Press Start 2P",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    const tw=ctx.measureText(label).width, sw=tw+10, sh=10, sgx=sx2-sw/2;
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(sgx+4,sy2-5,1,6); ctx.fillRect(sgx+sw-5,sy2-5,1,6);
    ctx.fillStyle=nearSign?'#c8a020':'#7a5020'; ctx.fillRect(sgx,sy2,sw,sh);
    ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(sgx,sy2+3,sw,1); ctx.fillRect(sgx,sy2+6,sw,1);
    ctx.strokeStyle=nearSign?'#ffd84a':'#5a3810'; ctx.lineWidth=1; ctx.strokeRect(sgx+0.5,sy2+0.5,sw-1,sh-1);
    ctx.fillStyle=nearSign?'#ffd84a':'#b08040'; ctx.fillRect(sgx+1,sy2+1,2,2); ctx.fillRect(sgx+sw-3,sy2+1,2,2); ctx.fillRect(sgx+1,sy2+sh-3,2,2); ctx.fillRect(sgx+sw-3,sy2+sh-3,2,2);
    ctx.fillStyle=nearSign?'#1a0a00':'#f0d890'; ctx.fillText(label,sx2,sy2+sh/2+0.5);
  }

  const near2=_nearInteractable&&(_nearInteractable.ref===b);
  const st2=Date.now()*0.001;
  const dx=b.doorTx*TILE-cx, dy=b.doorTy*TILE-cy;

  if(isHouse){
    const wallY=y+Math.floor(h*0.42);
    const wallH=h-Math.floor(h*0.42);
    const midWallY=wallY+Math.floor(wallH*0.4);

    if(b.id==='house1'){
      ctx.fillStyle='#6a4820'; ctx.fillRect(x,wallY,w,wallH);
      _planks(x,wallY,w,wallH,0.1);
      ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(x,wallY,2,wallH);
      _roof(x,y,w,wallY-y,'#7a2a10');
      ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY;ry+=4){ const t=(ry-y)/(wallY-y); ctx.beginPath(); ctx.moveTo(x-3*t,ry); ctx.lineTo(x+w+3*t,ry); ctx.stroke(); }
      ctx.fillStyle='#4a3020'; ctx.fillRect(x+4,y-8,5,wallY-y+4);
      ctx.fillStyle='#3a2010'; ctx.fillRect(x+3,y-9,7,3);
      ctx.globalAlpha=0.25+0.15*Math.sin(st2); ctx.fillStyle='#b0a090';
      ctx.beginPath(); ctx.arc(x+6,y-12+Math.sin(st2)*2,4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+8,y-17+Math.sin(st2+1)*1.5,3,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      _win(x+w/2-5,midWallY-4,10,9,'rgba(255,200,80,0.3)');
      ctx.fillStyle='#5a2a10'; ctx.fillRect(x+w/2-6,midWallY+5,13,3);
      ctx.fillStyle='#c03030'; ctx.fillRect(x+w/2-5,midWallY+3,3,3);
      ctx.fillStyle='#e04040'; ctx.fillRect(x+w/2-3,midWallY+2,3,3);
      ctx.fillStyle='#c03030'; ctx.fillRect(x+w/2,midWallY+3,3,3);
      ctx.fillStyle='#208020'; ctx.fillRect(x+w/2+3,midWallY+3,3,3);
      _door(dx+2,dy,TILE-4,TILE,'#5a3010');

    } else if(b.id==='house2'){
      ctx.fillStyle='#585048'; ctx.fillRect(x,wallY,w,wallH);
      _bricks(x,wallY,w,wallH,0.15);
      ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(x,wallY,w,1);
      _roof(x,y,w,wallY-y,'#3a3028');
      ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=0.5;
      for(let ry=y+5;ry<wallY;ry+=5){ const t=(ry-y)/(wallY-y); ctx.beginPath(); ctx.moveTo(x-3*t,ry); ctx.lineTo(x+w+3*t,ry); ctx.stroke(); }
      const aw=10,ah=11,awx=x+w/2-5,awy=midWallY-6;
      ctx.fillStyle='#1a1208'; ctx.fillRect(awx,awy+4,aw,ah-4);
      ctx.fillStyle='rgba(120,160,255,0.25)'; ctx.fillRect(awx,awy+4,aw,ah-4);
      ctx.beginPath(); ctx.arc(awx+aw/2,awy+4,aw/2,Math.PI,0); ctx.fillStyle='#1a1208'; ctx.fill();
      ctx.fillStyle='rgba(120,160,255,0.2)'; ctx.beginPath(); ctx.arc(awx+aw/2,awy+4,aw/2,Math.PI,0); ctx.fill();
      ctx.strokeStyle='#484038'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(awx+aw/2,awy+4,aw/2+1,Math.PI,0); ctx.stroke();
      ctx.fillStyle='rgba(20,60,15,0.5)'; for(let iv=0;iv<4;iv++) ctx.fillRect(x+iv%2,wallY+iv*4,3+iv,4);
      _door(dx+2,dy,TILE-4,TILE,'#3a2810');

    } else if(b.id==='house3'){
      ctx.fillStyle='#4a3018'; ctx.fillRect(x,wallY,w,wallH);
      _planks(x,wallY,w,wallH,0.12);
      ctx.fillStyle='#3a2010'; ctx.fillRect(x,wallY,3,wallH); ctx.fillRect(x+w-3,wallY,3,wallH);
      ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(x+1,wallY,1,wallH);
      _roof(x,y,w,wallY-y,'#602010',2);
      ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY;ry+=4){ const t=(ry-y)/(wallY-y); ctx.beginPath(); ctx.moveTo(x-2*t,ry); ctx.lineTo(x+w+2*t,ry); ctx.stroke(); }
      _win(x+3,midWallY-4,8,8,'rgba(255,200,80,0.25)');
      _win(x+w-11,midWallY-4,8,8,'rgba(255,200,80,0.2)');
      ctx.fillStyle='#3a2818'; ctx.fillRect(x+w-8,y-6,5,wallY-y+4);
      ctx.fillStyle='#2a1808'; ctx.fillRect(x+w-9,y-7,7,3);
      ctx.globalAlpha=0.2+0.1*Math.sin(st2+0.5); ctx.fillStyle='#a09080';
      ctx.beginPath(); ctx.arc(x+w-6,y-11+Math.sin(st2)*1.5,3,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      _door(dx+2,dy,TILE-4,TILE,'#3a2010');

    } else if(b.id==='house4'){
      ctx.fillStyle='#7a4028'; ctx.fillRect(x,wallY,w,wallH);
      _bricks(x,wallY,w,wallH,0.08);
      ctx.fillStyle='rgba(255,100,50,0.06)'; ctx.fillRect(x,wallY,w,wallH);
      _roof(x,y,w,wallY-y,'#501808',4);
      ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=0.5;
      for(let ry=y+5;ry<wallY;ry+=5){ const t=(ry-y)/(wallY-y); ctx.beginPath(); ctx.moveTo(x-4*t,ry); ctx.lineTo(x+w+4*t,ry); ctx.stroke(); }
      [[x+4,midWallY-5],[x+w-14,midWallY-5]].forEach(([wx2,wy2])=>{
        _win(wx2,wy2,10,9,'rgba(255,180,60,0.35)');
        ctx.fillStyle='#5a2a10'; ctx.fillRect(wx2-3,wy2,3,9); ctx.fillRect(wx2+10,wy2,3,9);
        ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(wx2-3,wy2+3,3,1); ctx.fillRect(wx2-3,wy2+6,3,1); ctx.fillRect(wx2+10,wy2+3,3,1); ctx.fillRect(wx2+10,wy2+6,3,1);
      });
      ctx.fillStyle='#5a3018'; ctx.fillRect(x+Math.floor(w*0.6),y-5,6,wallY-y+3);
      ctx.fillStyle='#3a1808'; ctx.fillRect(x+Math.floor(w*0.6)-1,y-6,8,3);
      ctx.globalAlpha=0.3+0.2*Math.sin(st2+1); ctx.fillStyle='#b0a898';
      ctx.beginPath(); ctx.arc(x+Math.floor(w*0.6)+3,y-10+Math.sin(st2)*2,4,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      _door(dx+2,dy,TILE-4,TILE,'#5a2810');

    } else if(b.id==='house5'){
      ctx.fillStyle='#3a2c18'; ctx.fillRect(x,wallY,w,wallH);
      _planks(x,wallY,w,wallH,0.15);
      ctx.fillStyle='#5a4020'; ctx.fillRect(x+w-8,wallY+3,6,wallH-5);
      _planks(x+w-8,wallY+3,6,wallH-5,0.1);
      ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(x+w-9,wallY+3,1,wallH-5);
      ctx.fillStyle='#502808'; ctx.beginPath(); ctx.moveTo(x-2,wallY+2); ctx.lineTo(x+w+1,wallY+2); ctx.lineTo(x+w*0.55,y+3); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY;ry+=5){ ctx.beginPath(); ctx.moveTo(x-1,ry); ctx.lineTo(x+w+1,ry); ctx.stroke(); }
      _win(x+w/2-2,midWallY-3,8,7,'rgba(200,160,60,0.15)');
      ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(x+w*0.3,wallY,3,Math.PI,0); ctx.fill();
      _door(dx+1,dy,TILE-3,TILE,'#2a1808');

    } else if(b.id==='house6'){
      ctx.fillStyle='#c8b090'; ctx.fillRect(x,wallY,w,wallH);
      ctx.fillStyle='rgba(0,0,0,0.04)'; for(let py=wallY;py<y+h;py+=3) for(let px=x;px<x+w;px+=4) if((px+py)%7===0) ctx.fillRect(px,py,1,1);
      ctx.fillStyle='#a08060'; for(let qy=wallY;qy<y+h;qy+=6){ ctx.fillRect(x,qy,4,4); ctx.fillRect(x+w-4,qy,4,4); }
      _roof(x,y,w,wallY-y,'#6a3a18',3);
      ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY;ry+=4){ const t=(ry-y)/(wallY-y); ctx.beginPath(); ctx.moveTo(x-3*t,ry); ctx.lineTo(x+w+3*t,ry); ctx.stroke(); }
      [[x+3,midWallY-5],[x+w-13,midWallY-5]].forEach(([wx2,wy2])=>{
        _win(wx2,wy2,10,9,'rgba(255,220,120,0.35)');
        ctx.fillStyle='#a08060'; ctx.fillRect(wx2-1,wy2+9,12,2);
        ctx.fillStyle='#7a4820'; ctx.fillRect(wx2,wy2+11,10,3);
        ctx.fillStyle='#e03060'; ctx.fillRect(wx2+1,wy2+9,3,3);
        ctx.fillStyle='#f05020'; ctx.fillRect(wx2+4,wy2+10,3,3);
        ctx.fillStyle='#d04080'; ctx.fillRect(wx2+7,wy2+9,3,3);
      });
      _door(dx+2,dy,TILE-4,TILE,'#7a4820');

    } else if(b.id==='house7'){
      ctx.fillStyle='#5a4830'; ctx.fillRect(x,wallY,w,wallH);
      _planks(x,wallY,w,wallH,0.09);
      ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(x,wallY+Math.floor(wallH*0.5),w,2);
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,wallY+Math.floor(wallH*0.5)+2,w,1);
      ctx.fillStyle='#4a3820'; ctx.fillRect(x-2,wallY+Math.floor(wallH*0.5)-1,w+4,3);
      _roof(x,y,w,wallY-y,'#5a2808',3);
      ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY;ry+=4){ const t=(ry-y)/(wallY-y); ctx.beginPath(); ctx.moveTo(x-3*t,ry); ctx.lineTo(x+w+3*t,ry); ctx.stroke(); }
      _win(x+2,wallY+4,8,7,'rgba(255,200,80,0.2)');
      _win(x+w-10,wallY+4,8,7,'rgba(255,200,80,0.2)');
      _win(x+w/2-4,wallY+Math.floor(wallH*0.55)+3,8,7,'rgba(255,200,80,0.25)');
      _door(dx+2,dy,TILE-4,TILE,'#4a2810');

    } else if(b.id==='house8'){
      ctx.fillStyle='#4a4438'; ctx.fillRect(x,wallY,w,wallH);
      _bricks(x,wallY,w,wallH,0.2);
      ctx.fillStyle='rgba(20,55,15,0.4)'; ctx.fillRect(x,wallY,w,2); ctx.fillRect(x,wallY+6,4,3); ctx.fillRect(x+w-6,wallY+8,5,4); ctx.fillRect(x+4,y+h-3,8,3);
      _roof(x,y,w,wallY-y,'#302820',2);
      ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=0.5;
      for(let ry=y+5;ry<wallY;ry+=5){ const t=(ry-y)/(wallY-y); ctx.beginPath(); ctx.moveTo(x-2*t,ry); ctx.lineTo(x+w+2*t,ry); ctx.stroke(); }
      _win(x+w/2-5,midWallY-4,10,8,'rgba(150,180,200,0.15)');
      ctx.strokeStyle='rgba(20,60,15,0.5)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(x+w-2,y+h); ctx.bezierCurveTo(x+w,wallY+5,x+w-3,wallY,x+w-1,y+4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+w-2,wallY+8); ctx.lineTo(x+w-8,wallY+4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+w-2,wallY+14); ctx.lineTo(x+w+3,wallY+10); ctx.stroke();
      _door(dx+2,dy,TILE-4,TILE,'#2a2018');

    } else {
      // house9 — abandoned
      ctx.fillStyle='#352a1a'; ctx.fillRect(x,wallY,w,wallH);
      _planks(x,wallY,w,wallH,0.2);
      ctx.fillStyle='#251a0a'; ctx.fillRect(x+5,wallY,3,wallH); ctx.fillRect(x+w-9,wallY,3,wallH);
      _roof(x,y,w,wallY-y,'#3a1808',2);
      ctx.fillStyle='#2a1008'; ctx.fillRect(x+4,y+6,8,4); ctx.fillRect(x+w-10,y+3,6,5);
      ctx.fillStyle='#3a2818'; ctx.fillRect(x+w/2-3,y-4,5,wallY-y+3);
      ctx.fillStyle='#2a1808'; ctx.fillRect(x+w/2-4,y-5,7,3);
      _win(x+w/2-5,midWallY-4,10,8,'rgba(100,100,120,0.1)');
      ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(x+w/2-5,midWallY-4); ctx.lineTo(x+w/2+3,midWallY+2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+w/2+5,midWallY-4); ctx.lineTo(x+w/2-1,midWallY+4); ctx.stroke();
      _door(dx+2,dy,TILE-4,TILE,'#251808');
      ctx.fillStyle='#4a3018'; ctx.fillRect(dx+1,dy+2,TILE-2,3); ctx.fillRect(dx+1,dy+8,TILE-2,3); ctx.fillRect(dx+1,dy+14,TILE-2,3);
    }

  } else {
    // ── NAMED BUILDINGS ──────────────────────────────────────

    if(b.id==='tavern'){
      const wallY2=y+Math.floor(h*0.35), wallH2=h-Math.floor(h*0.35);
      ctx.fillStyle='#6a3a14'; ctx.fillRect(x,wallY2,w,wallH2);
      _planks(x,wallY2,w,wallH2,0.1);
      ctx.fillStyle='#2a1408'; ctx.fillRect(x,wallY2,3,wallH2); ctx.fillRect(x+w-3,wallY2,3,wallH2); ctx.fillRect(x+Math.floor(w*0.5)-1,wallY2,3,wallH2); ctx.fillRect(x,wallY2+Math.floor(wallH2*0.45),w,2);
      ctx.strokeStyle='#2a1408'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(x+3,wallY2); ctx.lineTo(x+Math.floor(w*0.5)-1,wallY2+Math.floor(wallH2*0.45)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+Math.floor(w*0.5)+2,wallY2); ctx.lineTo(x+w-3,wallY2+Math.floor(wallH2*0.45)); ctx.stroke();
      ctx.fillStyle='#7a1a08'; ctx.beginPath(); ctx.moveTo(x-4,wallY2+2); ctx.lineTo(x+w+4,wallY2+2); ctx.lineTo(x+w*0.6,y); ctx.lineTo(x+w*0.4,y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY2;ry+=4){ const t=(ry-y)/(wallY2-y); ctx.beginPath(); ctx.moveTo(x-4*t,ry); ctx.lineTo(x+w+4*t,ry); ctx.stroke(); }
      ctx.fillStyle='#5a1008'; ctx.fillRect(x-4,wallY2-1,w+8,3);
      const tglow=ctx.createRadialGradient(x+w*0.3,wallY2+5,0,x+w*0.3,wallY2+5,20); tglow.addColorStop(0,'rgba(255,140,30,0.2)'); tglow.addColorStop(1,'rgba(255,140,30,0)');
      ctx.fillStyle=tglow; ctx.fillRect(x,wallY2,w,wallH2);
      _win(x+4,wallY2+4,10,8,'rgba(255,180,50,0.4)');
      _win(x+Math.floor(w*0.5)-4,wallY2+4,10,8,'rgba(255,180,50,0.35)');
      _win(x+w-14,wallY2+4,10,8,'rgba(255,180,50,0.3)');
      ctx.fillStyle='#5a3010'; ctx.fillRect(x-2,wallY2+wallH2-12,8,11); ctx.fillStyle='#7a4820'; ctx.fillRect(x-2,wallY2+wallH2-12,8,3); ctx.fillStyle='#c08020'; ctx.fillRect(x-2,wallY2+wallH2-9,8,1); ctx.fillRect(x-2,wallY2+wallH2-5,8,1); ctx.fillStyle='#4a2810'; ctx.fillRect(x-2,wallY2+wallH2-1,8,2); ctx.fillStyle='#5a3010'; ctx.fillRect(x+8,wallY2+wallH2-8,7,8);
      ctx.fillStyle='#5a3820'; ctx.fillRect(x+Math.floor(w*0.75),y-8,6,wallY2-y+4); ctx.fillStyle='#3a2010'; ctx.fillRect(x+Math.floor(w*0.75)-1,y-9,8,3);
      ctx.globalAlpha=0.35+0.2*Math.sin(st2); ctx.fillStyle='#b0a898'; ctx.beginPath(); ctx.arc(x+Math.floor(w*0.75)+3,y-13+Math.sin(st2)*3,5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#c0b8a8'; ctx.beginPath(); ctx.arc(x+Math.floor(w*0.75)+5,y-19+Math.sin(st2+1)*2,4,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      _door(dx+1,dy,TILE-2,TILE,'#5a3010');
      ctx.fillStyle='#3a2008'; ctx.fillRect(dx,dy,2,TILE); ctx.fillRect(dx+TILE-2,dy,2,TILE); ctx.fillRect(dx,dy,TILE,2);
      _sign(x+w/2,wallY2+4,b.label,near2);

    } else if(b.id==='inn'){
      const wallY2=y+Math.floor(h*0.38), wallH2=h-Math.floor(h*0.38);
      ctx.fillStyle='#7a5a30'; ctx.fillRect(x,wallY2,w,wallH2);
      _planks(x,wallY2,w,wallH2,0.08);
      ctx.fillStyle='#3a2010'; ctx.fillRect(x,wallY2,2,wallH2); ctx.fillRect(x+w-2,wallY2,2,wallH2); ctx.fillRect(x,wallY2+Math.floor(wallH2*0.48),w,2);
      ctx.fillStyle='#6a3a18'; ctx.beginPath(); ctx.moveTo(x-3,wallY2+2); ctx.lineTo(x+w+3,wallY2+2); ctx.lineTo(x+w*0.55,y+2); ctx.lineTo(x+w*0.45,y+2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY2;ry+=5){ const t=(ry-y)/(wallY2-y); ctx.beginPath(); ctx.moveTo(x-3*t,ry); ctx.lineTo(x+w+3*t,ry); ctx.stroke(); }
      ctx.fillStyle='#7a3a18'; ctx.fillRect(x+w/2-5,y+4,10,8); _win(x+w/2-4,y+5,8,6,'rgba(255,200,100,0.3)');
      _win(x+3,wallY2+3,8,7,'rgba(255,190,80,0.3)'); _win(x+w-11,wallY2+3,8,7,'rgba(255,190,80,0.3)');
      const loY2=wallY2+Math.floor(wallH2*0.52)+2;
      _win(x+3,loY2,8,7,'rgba(255,190,80,0.25)'); _win(x+w-11,loY2,8,7,'rgba(255,190,80,0.25)');
      ctx.fillStyle='#8a3010'; ctx.beginPath(); ctx.moveTo(dx-3,dy+1); ctx.lineTo(dx+TILE+3,dy+1); ctx.lineTo(dx+TILE,dy-5); ctx.lineTo(dx,dy-5); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(dx-3,dy+1,TILE+6,2);
      _door(dx+2,dy,TILE-4,TILE,'#5a3010');
      _sign(x+w/2,wallY2+3,b.label,near2);

    } else if(b.id==='temple'){
      const wallY2=y+Math.floor(h*0.3), wallH2=h-Math.floor(h*0.3);
      ctx.fillStyle='#5050a0'; ctx.fillRect(x,wallY2,w,wallH2);
      _bricks(x,wallY2,w,wallH2,0.12);
      ctx.fillStyle='rgba(100,120,255,0.08)'; ctx.fillRect(x,wallY2,w,wallH2);
      ctx.fillStyle='#1a1a7a'; ctx.beginPath(); ctx.moveTo(x-2,wallY2+2); ctx.lineTo(x+w+2,wallY2+2); ctx.lineTo(x+w/2,y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=0.5;
      for(let ry=y+5;ry<wallY2;ry+=5){ const t=(ry-y)/(wallY2-y); ctx.beginPath(); ctx.moveTo(x-2*t,ry); ctx.lineTo(x+w+2*t,ry); ctx.stroke(); }
      ctx.fillStyle='#9090e0'; ctx.fillRect(x+w/2-1,y-4,3,8); ctx.fillRect(x+w/2-4,y+1,9,3);
      ctx.fillStyle='rgba(150,180,255,0.6)'; ctx.fillRect(x+w/2,y-4,1,8); ctx.fillRect(x+w/2-4,y+2,9,1);
      [[x,wallY2],[x+w-5,wallY2]].forEach(([cx2,cy2])=>{ ctx.fillStyle='#6060b0'; ctx.fillRect(cx2,cy2,5,wallH2); ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(cx2,cy2,2,wallH2); ctx.fillStyle='#4040a0'; ctx.fillRect(cx2,cy2,5,3); ctx.fillRect(cx2,cy2+wallH2-3,5,3); });
      const aw2=14,ah2=16,awx2=x+w/2-7,awy2=wallY2+6;
      ctx.fillStyle='#0a0a30'; ctx.fillRect(awx2,awy2+5,aw2,ah2-5); ctx.beginPath(); ctx.arc(awx2+aw2/2,awy2+5,aw2/2,Math.PI,0); ctx.fill();
      const bglow=ctx.createRadialGradient(awx2+aw2/2,awy2+10,0,awx2+aw2/2,awy2+10,aw2); bglow.addColorStop(0,'rgba(80,120,255,0.5)'); bglow.addColorStop(1,'rgba(80,120,255,0)');
      ctx.fillStyle=bglow; ctx.fillRect(awx2,awy2,aw2,ah2);
      ctx.fillStyle='rgba(150,180,255,0.6)'; ctx.fillRect(awx2+aw2/2-1,awy2+2,2,ah2+2); ctx.fillRect(awx2+1,awy2+8,aw2-2,2);
      ctx.strokeStyle='#4040a0'; ctx.lineWidth=1; ctx.strokeRect(awx2-1,awy2-1,aw2+2,ah2+2); ctx.beginPath(); ctx.arc(awx2+aw2/2,awy2+5,aw2/2+1,Math.PI,0); ctx.stroke();
      const sglow=ctx.createRadialGradient(x+w/2,wallY2+10,0,x+w/2,wallY2+10,25); sglow.addColorStop(0,'rgba(80,100,255,0.15)'); sglow.addColorStop(1,'rgba(80,100,255,0)');
      ctx.fillStyle=sglow; ctx.fillRect(x,wallY2,w,wallH2);
      ctx.fillStyle='#4848a0'; ctx.fillRect(dx-3,dy+TILE-2,TILE+6,3); ctx.fillStyle='#5858b0'; ctx.fillRect(dx-5,dy+TILE,TILE+10,3);
      _door(dx+2,dy,TILE-4,TILE,'#101040');
      ctx.fillStyle='#3030a0'; ctx.beginPath(); ctx.arc(dx+TILE/2,dy,TILE/2-2,Math.PI,0); ctx.fill();
      _sign(x+w/2,wallY2+3,b.label,near2);

    } else if(b.id==='forge'){
      const wallY2=y+Math.floor(h*0.28), wallH2=h-Math.floor(h*0.28);
      ctx.fillStyle='#3a2818'; ctx.fillRect(x,wallY2,w,wallH2);
      _bricks(x,wallY2,w,wallH2,0.18);
      ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(x,wallY2,w,6); ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(x+Math.floor(w*0.7),wallY2,Math.floor(w*0.3),wallH2);
      ctx.fillStyle='#2a1808'; ctx.beginPath(); ctx.moveTo(x-2,wallY2+2); ctx.lineTo(x+w+2,wallY2+2); ctx.lineTo(x+w*0.6,y+4); ctx.lineTo(x+w*0.4,y+4); ctx.closePath(); ctx.fill();
      const chfx=x+Math.floor(w*0.65);
      ctx.fillStyle='#3a2010'; ctx.fillRect(chfx,y-12,10,wallY2-y+5); ctx.fillStyle='#2a1408'; ctx.fillRect(chfx-2,y-14,14,4);
      const cglow=ctx.createRadialGradient(chfx+5,y-14,0,chfx+5,y-14,18); cglow.addColorStop(0,`rgba(255,80,10,${0.5+0.3*Math.sin(st2*3)})`); cglow.addColorStop(1,'rgba(255,80,10,0)');
      ctx.fillStyle=cglow; ctx.beginPath(); ctx.arc(chfx+5,y-14,18,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=0.4+0.2*Math.sin(st2*2); ctx.fillStyle='#5a4838'; ctx.beginPath(); ctx.arc(chfx+5,y-18+Math.sin(st2)*3,5,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=0.3+0.15*Math.sin(st2*2+1); ctx.fillStyle='#4a3828'; ctx.beginPath(); ctx.arc(chfx+7,y-25+Math.sin(st2+0.5)*2,4,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      const fglow=ctx.createRadialGradient(dx+TILE/2,dy+TILE/2,0,dx+TILE/2,dy+TILE/2,20); fglow.addColorStop(0,`rgba(255,100,0,${0.2+0.1*Math.sin(st2*3)})`); fglow.addColorStop(1,'rgba(255,100,0,0)');
      ctx.fillStyle=fglow; ctx.fillRect(x,wallY2,w,wallH2);
      ctx.fillStyle='#1a0c04'; ctx.fillRect(x+4,wallY2+8,4,3); ctx.fillRect(x+w-8,wallY2+8,4,3);
      ctx.fillStyle=`rgba(255,80,10,${0.15+0.1*Math.sin(st2*3)})`; ctx.fillRect(x+4,wallY2+8,4,3); ctx.fillRect(x+w-8,wallY2+8,4,3);
      ctx.fillStyle='#403028'; ctx.fillRect(dx-8,dy+TILE-8,10,5); ctx.fillRect(dx-6,dy+TILE-11,6,4); ctx.fillRect(dx-5,dy+TILE-3,4,3);
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(dx-8,dy+TILE-8,10,1);
      _door(dx+2,dy,TILE-4,TILE,'#2a1008');
      _sign(x+w/2,wallY2+4,b.label,near2);

    } else if(b.id==='store'){
      const wallY2=y+Math.floor(h*0.35), wallH2=h-Math.floor(h*0.35);
      ctx.fillStyle='#4a6030'; ctx.fillRect(x,wallY2,w,wallH2);
      _planks(x,wallY2,w,wallH2,0.08);
      ctx.fillStyle='rgba(50,100,30,0.15)'; ctx.fillRect(x,wallY2,w,wallH2);
      _roof(x,y,w,wallY2-y,'#3a5020',3);
      ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY2;ry+=4){ const t=(ry-y)/(wallY2-y); ctx.beginPath(); ctx.moveTo(x-3*t,ry); ctx.lineTo(x+w+3*t,ry); ctx.stroke(); }
      ctx.fillStyle='#3a5820'; ctx.beginPath(); ctx.moveTo(x-3,wallY2+4); ctx.lineTo(x+w+3,wallY2+4); ctx.lineTo(x+w,wallY2-1); ctx.lineTo(x,wallY2-1); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.15)'; for(let sx3=x;sx3<x+w;sx3+=6) ctx.fillRect(sx3,wallY2-1,3,5);
      _win(x+3,wallY2+8,10,9,'rgba(150,220,100,0.25)'); _win(x+w-13,wallY2+8,10,9,'rgba(150,220,100,0.25)');
      ctx.fillStyle='#e04020'; ctx.beginPath(); ctx.arc(dx-5,dy+TILE-3,3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#f06020'; ctx.beginPath(); ctx.arc(dx+TILE+4,dy+TILE-4,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#d04010'; ctx.fillRect(dx+TILE+2,dy+TILE-4,4,1);
      ctx.fillStyle='#206010'; ctx.fillRect(dx+TILE+4,dy+TILE-8,1,5);
      _door(dx+2,dy,TILE-4,TILE,'#3a4820');
      _sign(x+w/2,wallY2+4,b.label,near2);

    } else if(b.id==='study'){
      const wallY2=y+Math.floor(h*0.32), wallH2=h-Math.floor(h*0.32);
      ctx.fillStyle='#2a1840'; ctx.fillRect(x,wallY2,w,wallH2);
      _bricks(x,wallY2,w,wallH2,0.15);
      ctx.fillStyle='rgba(100,50,200,0.08)'; ctx.fillRect(x,wallY2,w,wallH2);
      ctx.fillStyle='#200a38'; ctx.beginPath(); ctx.moveTo(x-2,wallY2+2); ctx.lineTo(x+w+2,wallY2+2); ctx.lineTo(x+w/2,y-2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(100,50,200,0.2)'; ctx.lineWidth=0.5;
      for(let ry=y+5;ry<wallY2;ry+=5){ const t=(ry-y)/(wallY2-y); ctx.beginPath(); ctx.moveTo(x-2*t,ry); ctx.lineTo(x+w+2*t,ry); ctx.stroke(); }
      ctx.fillStyle='#8050c0'; ctx.beginPath(); ctx.arc(x+w/2,y+1,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#200a38'; ctx.beginPath(); ctx.arc(x+w/2+2,y,4,0,Math.PI*2); ctx.fill();
      const awcx=x+w/2, awcy=wallY2+12;
      ctx.fillStyle='#0a0520'; ctx.beginPath(); ctx.arc(awcx,awcy,9,0,Math.PI*2); ctx.fill();
      const aglow=ctx.createRadialGradient(awcx,awcy,0,awcx,awcy,9); aglow.addColorStop(0,'rgba(150,80,255,0.6)'); aglow.addColorStop(0.5,'rgba(80,40,200,0.3)'); aglow.addColorStop(1,'rgba(40,10,120,0)');
      ctx.fillStyle=aglow; ctx.beginPath(); ctx.arc(awcx,awcy,9,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(150,100,255,0.5)'; ctx.lineWidth=1;
      for(let ang=0;ang<Math.PI;ang+=Math.PI/3){ ctx.beginPath(); ctx.moveTo(awcx+Math.cos(ang)*9,awcy+Math.sin(ang)*9); ctx.lineTo(awcx-Math.cos(ang)*9,awcy-Math.sin(ang)*9); ctx.stroke(); }
      ctx.strokeStyle='rgba(180,140,255,0.8)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(awcx,awcy,9,0,Math.PI*2); ctx.stroke();
      const smglow=ctx.createRadialGradient(x+w/2,wallY2+8,0,x+w/2,wallY2+8,22); smglow.addColorStop(0,'rgba(100,50,200,0.18)'); smglow.addColorStop(1,'rgba(100,50,200,0)');
      ctx.fillStyle=smglow; ctx.fillRect(x,wallY2,w,wallH2);
      _win(x+3,wallY2+22,7,7,'rgba(150,80,255,0.3)');
      _door(dx+2,dy,TILE-4,TILE,'#180830');
      ctx.strokeStyle='#8040c0'; ctx.lineWidth=1; ctx.strokeRect(dx+2,dy,TILE-4,TILE);
      _sign(x+w/2,wallY2+3,b.label,near2);

    } else if(b.id==='market'){
      const wallY2=y+Math.floor(h*0.3), wallH2=h-Math.floor(h*0.3);
      ctx.fillStyle='#7a6030'; ctx.fillRect(x,wallY2,w,wallH2);
      _planks(x,wallY2,w,wallH2,0.09);
      _roof(x,y,w,wallY2-y,'#8a4018',4);
      ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.5;
      for(let ry=y+5;ry<wallY2;ry+=5){ const t=(ry-y)/(wallY2-y); ctx.beginPath(); ctx.moveTo(x-4*t,ry); ctx.lineTo(x+w+4*t,ry); ctx.stroke(); }
      const bunts=['#c02020','#2040c0','#20a020','#c0a020','#8020c0'];
      for(let bi=0;bi<5;bi++){ const bx=x+4+bi*(w-8)/4; ctx.fillStyle=bunts[bi]; ctx.beginPath(); ctx.moveTo(bx,wallY2+2); ctx.lineTo(bx+6,wallY2+2); ctx.lineTo(bx+3,wallY2+7); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle='rgba(80,60,20,0.6)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x+4,wallY2+2); ctx.lineTo(x+w-4,wallY2+2); ctx.stroke();
      _win(x+4,wallY2+10,12,10,'rgba(255,220,100,0.3)'); _win(x+w-16,wallY2+10,12,10,'rgba(255,220,100,0.3)');
      _door(dx+2,dy,TILE-4,TILE,'#5a3810');
      _sign(x+w/2,wallY2+3,b.label,near2);

    } else if(b.id==='proving'){
      // ── The Proving Grounds — warm stone training hall with bronze accents ──
      const wallY2=y+Math.floor(h*0.3), wallH2=h-Math.floor(h*0.3);
      ctx.fillStyle='#5a4028'; ctx.fillRect(x,wallY2,w,wallH2);
      _bricks(x,wallY2,w,wallH2,0.12);
      ctx.fillStyle='rgba(180,120,40,0.06)'; ctx.fillRect(x,wallY2,w,wallH2);
      // Roof — peaked stone
      ctx.fillStyle='#6a3418'; ctx.beginPath(); ctx.moveTo(x-2,wallY2+2); ctx.lineTo(x+w+2,wallY2+2); ctx.lineTo(x+w*0.55,y+2); ctx.lineTo(x+w*0.45,y+2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=0.5;
      for(let ry=y+5;ry<wallY2;ry+=5){ const t=(ry-y)/(wallY2-y); ctx.beginPath(); ctx.moveTo(x-2*t,ry); ctx.lineTo(x+w+2*t,ry); ctx.stroke(); }
      // Decorative crossed swords on roof peak
      const peakX=x+w/2, peakY=y+6;
      ctx.strokeStyle='#c08040'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(peakX-6,peakY-4); ctx.lineTo(peakX+6,peakY+4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(peakX+6,peakY-4); ctx.lineTo(peakX-6,peakY+4); ctx.stroke();
      ctx.fillStyle='#c08040'; ctx.beginPath(); ctx.arc(peakX,peakY,2,0,Math.PI*2); ctx.fill();
      // Stone pillars at corners
      [[x,wallY2],[x+w-5,wallY2]].forEach(([cx2,cy2])=>{
        ctx.fillStyle='#6a5030'; ctx.fillRect(cx2,cy2,5,wallH2);
        ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(cx2,cy2,2,wallH2);
        ctx.fillStyle='#5a4020'; ctx.fillRect(cx2,cy2,5,3); ctx.fillRect(cx2,cy2+wallH2-3,5,3);
      });
      // Window — warm glow
      const wglow=ctx.createRadialGradient(x+w/2,wallY2+12,0,x+w/2,wallY2+12,18);
      wglow.addColorStop(0,'rgba(200,140,40,0.2)'); wglow.addColorStop(1,'rgba(200,140,40,0)');
      ctx.fillStyle=wglow; ctx.fillRect(x,wallY2,w,wallH2);
      _win(x+4,wallY2+8,10,9,'rgba(220,160,60,0.35)');
      _win(x+w-14,wallY2+8,10,9,'rgba(220,160,60,0.3)');
      // Weapon rack silhouettes beside door
      ctx.fillStyle='#3a2810'; ctx.fillRect(dx-8,dy+2,5,TILE-4); ctx.fillRect(dx+TILE+3,dy+2,5,TILE-4);
      ctx.fillStyle='#554020'; ctx.fillRect(dx-7,dy+3,3,2); ctx.fillRect(dx-7,dy+7,3,2); ctx.fillRect(dx-7,dy+11,3,2);
      ctx.fillRect(dx+TILE+4,dy+3,3,2); ctx.fillRect(dx+TILE+4,dy+7,3,2); ctx.fillRect(dx+TILE+4,dy+11,3,2);
      _door(dx+2,dy,TILE-4,TILE,'#3a2010');
      ctx.strokeStyle='#c08040'; ctx.lineWidth=1; ctx.strokeRect(dx+2,dy,TILE-4,TILE);
      _sign(x+w/2,wallY2+3,b.label,near2);

    } else {
      const roofH2=Math.max(TILE,Math.floor(h*0.3));
      ctx.fillStyle=pal[0]; ctx.fillRect(x,y+roofH2,w,h-roofH2);
      _bricks(x,y+roofH2,w,h-roofH2,0.1);
      _roof(x,y,w,roofH2,pal[1]);
      const mwy=y+roofH2+Math.floor((h-roofH2)/2)-4;
      _win(x+4,mwy,10,9,'rgba(255,200,100,0.25)');
      if(w>TILE*4) _win(x+w-14,mwy,10,9,'rgba(255,200,100,0.2)');
      _door(dx+2,dy,TILE-4,TILE,pal[3]);
      if(b.label) _sign(x+w/2,y+roofH2+4,b.label,near2);
    }
  }
}

// ── Draw decor ────────────────────────────────────────────
function _drawDecor(ctx, d, a, cx, cy){
  const sx=d.tx*TILE-cx, sy=d.ty*TILE-cy;
  if(sx+TILE*2<0||sy+TILE*2<0||sx>_logW()||sy>_logH()) return;
  if(d.type==='tree'){
    ctx.fillStyle=a.treeTrunk; ctx.fillRect(sx+6,sy+9,4,7);
    ctx.fillStyle=a.treeTop;
    ctx.fillRect(sx+3,sy+6,10,5); ctx.fillRect(sx+2,sy+3,12,5); ctx.fillRect(sx+4,sy+0,8,5);
    ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(sx+4,sy+1,3,3);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(sx+2,sy+9,12,2);
  } else if(d.type==='lamp'){
    ctx.fillStyle='rgba(80,60,30,0.9)'; ctx.fillRect(sx+7,sy+5,2,11); ctx.fillRect(sx+7,sy+5,6,2);
    const lx=sx+13,ly=sy+3;
    ctx.fillStyle=`rgb(${a.tr},${a.tg},${a.tb})`; ctx.fillRect(lx-3,ly,6,6);
    ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fillRect(lx-2,ly+1,2,2);
    const gR=18+2*Math.sin(Date.now()*0.003);
    const g=ctx.createRadialGradient(lx,ly+3,0,lx,ly+3,gR);
    g.addColorStop(0,`rgba(${a.tr},${a.tg},${a.tb},0.25)`);
    g.addColorStop(1,`rgba(${a.tr},${a.tg},${a.tb},0)`);
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(lx,ly+3,gR,0,Math.PI*2); ctx.fill();
  } else if(d.type==='well'){
    ctx.fillStyle='#3a2a18'; ctx.fillRect(sx+2,sy+8,12,8);
    ctx.fillStyle='#6a5a38'; ctx.fillRect(sx+1,sy+6,14,4);
    ctx.fillStyle='#5a4a30'; ctx.fillRect(sx+2,sy+2,2,7); ctx.fillRect(sx+12,sy+2,2,7); ctx.fillRect(sx+2,sy+2,12,2);
    ctx.fillStyle=`rgba(60,100,160,0.5)`; ctx.fillRect(sx+3,sy+10,10,4);
  } else if(d.type==='barrel'){
    ctx.fillStyle='#4a3018'; ctx.fillRect(sx+3,sy+3,10,11);
    ctx.fillStyle='#6a4a28'; ctx.fillRect(sx+3,sy+3,10,3); ctx.fillRect(sx+3,sy+11,10,3);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(sx+3,sy+6,10,1); ctx.fillRect(sx+3,sy+9,10,1);
  } else if(d.type==='stall'){
    ctx.fillStyle='#5a3a10'; ctx.fillRect(sx,sy+6,TILE,TILE-6);
    ctx.fillStyle='#c87020'; ctx.fillRect(sx-2,sy+2,TILE+4,6);
    ctx.fillStyle='rgba(200,100,20,0.3)'; ctx.fillRect(sx-2,sy+2,TILE+4,3);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(sx,sy+7,TILE,1);
  } else if(d.type==='grave'){
    ctx.fillStyle='#504848'; ctx.fillRect(sx+4,sy+4,8,12);
    ctx.fillStyle='#302828'; ctx.fillRect(sx+3,sy+2,10,5);
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(sx+4,sy+3,4,1);
  } else if(d.type==='stashChest'){
    const near=_nearInteractable&&_nearInteractable.type==='stashChest';
    const stash = typeof getStash==='function' ? getStash() : [];
    const hasItems = stash.length > 0;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(sx+2,sy+15,12,3);
    // Chest body
    ctx.fillStyle='#5a3a10'; ctx.fillRect(sx+1,sy+8,14,8);
    ctx.fillStyle='#7a5020'; ctx.fillRect(sx+1,sy+8,14,3); // lid highlight
    ctx.fillStyle='#3a2008'; ctx.fillRect(sx+1,sy+10,14,1); // lid seam
    // Lid
    ctx.fillStyle='#6a4818'; ctx.fillRect(sx+1,sy+5,14,5);
    ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+1,sy+5,14,1);
    // Metal bands
    ctx.fillStyle='#c8a020'; ctx.fillRect(sx+1,sy+8,14,1); ctx.fillRect(sx+1,sy+14,14,1);
    ctx.fillRect(sx+6,sy+5,2,10); ctx.fillRect(sx+9,sy+5,2,10);
    // Lock
    ctx.fillStyle='#c8a020'; ctx.fillRect(sx+7,sy+10,2,3);
    ctx.fillStyle='rgba(255,200,50,0.4)'; ctx.fillRect(sx+7,sy+10,1,1);
    // Glow if has items
    if(hasItems){
      const t=Date.now()*0.002;
      const pulse=0.4+0.3*Math.sin(t*2);
      const hg=ctx.createRadialGradient(sx+8,sy+8,0,sx+8,sy+8,12);
      hg.addColorStop(0,`rgba(200,160,40,${pulse*0.4})`);
      hg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(sx+8,sy+8,12,0,Math.PI*2); ctx.fill();
    }
    // Label
    ctx.font='bold 4px "Press Start 2P",monospace';
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillStyle=near?'#ffd84a':'rgba(200,160,60,0.85)';
    ctx.fillText('STASH'+(hasItems?' ('+stash.length+')':''),sx+8,sy-2);
  } else if(d.type==='graceVault'){
    const near=_nearInteractable&&_nearInteractable.type==='graceVault';
    const t3=Date.now()*0.001;
    const pulse=0.5+0.5*Math.sin(t3*2);
    // Check for unequipped graces
    let invCount=0;
    try{ const gr=getSlotGraces(); invCount=gr.inventory.length; }catch(e){}
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(sx+1,sy+15,14,3);
    // Stone plinth base
    ctx.fillStyle='#3a3040'; ctx.fillRect(sx+2,sy+10,12,6);
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(sx+2,sy+10,12,1);
    // Column shaft
    ctx.fillStyle='#483858'; ctx.fillRect(sx+4,sy+1,8,10);
    ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+4,sy+1,2,10);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(sx+10,sy+1,2,10);
    // Capital top
    ctx.fillStyle='#584868'; ctx.fillRect(sx+2,sy,12,3);
    // Glowing gem
    const gemCol=`rgba(180,100,255,${0.7+0.3*pulse})`;
    ctx.fillStyle=gemCol; ctx.fillRect(sx+6,sy-3,5,5);
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fillRect(sx+7,sy-2,2,2);
    // Gem halo
    const hr=9+7*pulse;
    const hg=ctx.createRadialGradient(sx+8,sy-1,0,sx+8,sy-1,hr);
    hg.addColorStop(0,`rgba(180,80,255,${0.3*pulse})`);
    hg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(sx+8,sy-1,hr,0,Math.PI*2); ctx.fill();
    // Label
    ctx.font='bold 4px "Press Start 2P",monospace';
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillStyle=near?'#ffd84a':'rgba(180,120,255,0.85)';
    ctx.fillText('GRACE VAULT',sx+8,sy-6);
    // Unequipped graces indicator badge
    if(invCount>0){
      const bx=sx+14, by=sy-5;
      const badgePulse=0.7+0.3*Math.sin(t3*3);
      ctx.fillStyle=`rgba(200,168,75,${badgePulse})`;
      ctx.beginPath(); ctx.arc(bx,by,3.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#000';
      ctx.font='bold 3px "Press Start 2P",monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(invCount>9?'!':String(invCount),bx,by);
    }
  }
}

// ── Draw NPC (wanderer or interior) ──────────────────────
function _drawNPC(ctx, npc, wx, wy, facing, cx, cy, near, label){
  const sx=Math.round(wx-cx), sy=Math.round(wy-cy);
  if(sx<-TILE*2||sy<-TILE*2||sx>_logW()+TILE||sy>_logH()+TILE) return;

  const t=Date.now()*0.003;
  // Walking bob — only if NPC is moving (non-stationary) 
  const moving = !npc.stationary && npc._moving;
  const legSwing = moving ? Math.sin(t*3.5) : 0;
  const bob = moving ? Math.abs(Math.sin(t*3.5))*0.8 : 0;

  // ── Shadow ──
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(sx,sy+14,5,2,0,0,Math.PI*2); ctx.fill();

  // ── Body colour from npc.color ──
  const col = npc.color||'#808080';

  // ── Legs ──
  const lLeg = Math.round(legSwing*2);
  const rLeg = -lLeg;
  ctx.fillStyle='#2a1c10';
  ctx.fillRect(sx-3, sy+8+lLeg, 3, 6);
  ctx.fillRect(sx+1,  sy+8+rLeg, 3, 6);
  // Boots
  ctx.fillStyle='#1a1008';
  ctx.fillRect(sx-4, sy+13+lLeg, 4, 2);
  ctx.fillRect(sx+1,  sy+13+rLeg, 5, 2);
  // Boot highlight
  ctx.fillStyle='rgba(255,255,255,0.07)';
  ctx.fillRect(sx-4, sy+13+lLeg, 2, 1);
  ctx.fillRect(sx+1,  sy+13+rLeg, 2, 1);

  // ── Torso ──
  ctx.fillStyle=col;
  ctx.fillRect(sx-4, sy+1-bob, 9, 8);
  // Shoulder highlight
  ctx.fillStyle='rgba(255,255,255,0.12)';
  ctx.fillRect(sx-4, sy+1-bob, 9, 2);
  // Waist shadow
  ctx.fillStyle='rgba(0,0,0,0.2)';
  ctx.fillRect(sx-4, sy+7-bob, 9, 2);

  // ── Belt ──
  ctx.fillStyle='#3a2010';
  ctx.fillRect(sx-4, sy+8-bob, 9, 2);
  // Belt buckle
  ctx.fillStyle='#b08020';
  ctx.fillRect(sx-1, sy+8-bob, 3, 2);
  ctx.fillStyle='rgba(255,255,255,0.3)';
  ctx.fillRect(sx-1, sy+8-bob, 1, 1);

  // ── Arms ──
  const lArm = moving ? Math.round(-legSwing*2) : 0;
  const rArm = -lArm;
  ctx.fillStyle=col;
  ctx.fillRect(sx-6, sy+2-bob+lArm, 3, 6);
  ctx.fillRect(sx+4,  sy+2-bob+rArm, 3, 6);
  // Hands (skin)
  ctx.fillStyle='#d4a870';
  ctx.fillRect(sx-6, sy+7-bob+lArm, 3, 3);
  ctx.fillRect(sx+4,  sy+7-bob+rArm, 3, 3);

  // ── Head ──
  ctx.fillStyle='#d4a870';
  ctx.fillRect(sx-3, sy-6-bob, 7, 7);
  // Ear left
  ctx.fillRect(sx-4, sy-5-bob, 2, 3);
  // Ear right
  ctx.fillRect(sx+4, sy-5-bob, 2, 3);
  // Ear shade
  ctx.fillStyle='rgba(0,0,0,0.15)';
  ctx.fillRect(sx-4, sy-5-bob, 1, 3);
  ctx.fillRect(sx+5, sy-5-bob, 1, 3);
  // Chin shadow
  ctx.fillStyle='rgba(0,0,0,0.1)';
  ctx.fillRect(sx-3, sy-bob, 7, 1);

  // ── Hair (colour varies by npc id) ──
  const hairCols = {
    // ── Interior NPCs ──
    rook:'#3a1c08',        // dark brown — grizzled tavern keep
    aldric:'#1a0c04',      // near-black — soot-darkened smith
    seraphine:'#f4f0e8',   // white-blonde — priestess
    malachar:'#180830',    // deep purple-black — wizard
    mirela:'#a03010',      // auburn-red — merchant woman
    innkeeper:'#7a3010',   // warm chestnut — Rosalind bun
    patron1:'#6a5030',     // dirty blond — Old Ferris
    patron2:'#c06080',     // pinkish auburn — Marta
    bard:'#204060',        // dark teal-blue — Pell the bard
    apprentice:'#3a2010',  // brown — Tam
    scribe:'#706050',      // mousy brown — Petra
    worshipper1:'#808080', // grey — Brother Ewan
    worshipper2:'#c0a0c0', // lilac-grey — Sister Lena
    vendor1:'#a07010',     // golden — Cassia
    vendor2:'#504060',     // dark purple-grey — Dunk
    shopper:'#806040',     // tawny — generic shopper
    traveler:'#403020',    // dark brown — vagrant
    customer:'#905030',    // copper — customer
    // ── Wanderers / outdoor NPCs ──
    oldwoman:'#d0ccc0',    // silver-white — Elspeth
    child1:'#c08020',      // sandy-golden — Kit
    child2:'#90c8a0',      // light ash — Rue
    child3:'#e0c060',      // bright yellow — Pip
    guard1:'#1a1818',      // near-black — gate guard (veteran)
    guard2:'#4a4038',      // dark grey-brown — south guard
    merchant:'#b07820',    // rich amber — traveling merchant
    farmer1:'#6a4820',     // dark straw — Harlan
    farmer2:'#c09040',     // warm blonde — Bess
    scholar:'#504878',     // dusty lavender — Brother Edwyn
    priest:'#e8e4e0',      // pale grey-white — Father Oswin
    soldier:'#3a3820',     // dark olive — Sergeant Dael
    beggar:'#5a4838',      // greying brown — Old Cray
    healer:'#d04060',      // deep rose — Mira
    fisher:'#3a6070',      // dark teal — Cord
    smith2:'#802818',      // dark rust-red — Beryl
    weaver:'#6040a0',      // violet — Syl
    tanner:'#3a2c18',      // dark brown — Hugh
    refugee:'#908070',     // dusty grey-brown — refugee
    soldier2:'#283828',    // dark forest green-brown — scout
  };
  const hairCol = hairCols[npc.id] || '#3a2810';
  ctx.fillStyle=hairCol;
  // Hair top + sides
  ctx.fillRect(sx-3, sy-6-bob, 7, 3);
  ctx.fillRect(sx-4, sy-5-bob, 2, 2); // left tuft
  ctx.fillRect(sx+4, sy-5-bob, 2, 1); // right tuft
  // Hair highlight
  ctx.fillStyle='rgba(255,255,255,0.1)';
  ctx.fillRect(sx-2, sy-6-bob, 2, 1);

  // ── Eyes (by facing direction) ──
  ctx.fillStyle='#1a1208';
  if(facing===2){      // south — front facing, eyes middle
    ctx.fillRect(sx-2, sy-3-bob, 1, 1);
    ctx.fillRect(sx+1,  sy-3-bob, 1, 1);
    // Nose dot
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(sx, sy-2-bob, 1, 1);
  } else if(facing===0){ // north — back, no eyes visible, back of head
    ctx.fillStyle=hairCol;
    ctx.fillRect(sx-3, sy-6-bob, 7, 7); // cover whole head with hair
    ctx.fillRect(sx-4, sy-5-bob, 2, 3);
    ctx.fillRect(sx+4, sy-5-bob, 2, 2);
  } else if(facing===3){ // west
    ctx.fillStyle='#1a1208';
    ctx.fillRect(sx-3, sy-4-bob, 1, 1);
    ctx.fillRect(sx-3, sy-2-bob, 1, 1);
  } else {               // east
    ctx.fillRect(sx+3, sy-4-bob, 1, 1);
    ctx.fillRect(sx+3, sy-2-bob, 1, 1);
  }

  // ── NPC-specific accessories ──
  if(npc.id==='rook'){
    // Tavern keeper — apron, holds mug
    ctx.fillStyle='#c8c0a8';
    ctx.fillRect(sx-3, sy+3-bob, 7, 6); // apron front
    ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(sx-3, sy+3-bob, 1, 6);
    // Mug in right hand
    ctx.fillStyle='#7a4a20'; ctx.fillRect(sx+4, sy+5-bob, 5, 4);
    ctx.fillStyle='rgba(200,160,60,0.9)'; ctx.fillRect(sx+5, sy+5-bob, 3, 2); // beer foam
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(sx+4, sy+8-bob, 5, 1);
    // Handle
    ctx.fillStyle='#5a3010'; ctx.fillRect(sx+8, sy+6-bob, 2, 2);
    // Bushy beard
    ctx.fillStyle='#5a3818';
    ctx.fillRect(sx-3, sy-1-bob, 7, 3);
    ctx.fillRect(sx-2, sy+1-bob, 5, 2);
  } else if(npc.id==='seraphine'){
    // Priestess — white hood/robe
    ctx.fillStyle='#e8e8f0';
    // Hood over hair (covers top and sides)
    ctx.fillRect(sx-4, sy-7-bob, 9, 5);
    ctx.fillRect(sx-5, sy-5-bob, 11, 7); // hood drape
    ctx.fillStyle='rgba(0,0,0,0.08)';
    ctx.fillRect(sx-5, sy-5-bob, 1, 7); ctx.fillRect(sx+5, sy-5-bob, 1, 7);
    // Holy symbol on chest
    ctx.fillStyle='rgba(180,200,255,0.8)';
    ctx.fillRect(sx-1, sy+2-bob, 3, 5); ctx.fillRect(sx-3, sy+4-bob, 7, 2);
    // Robe (replaces body colour)
    ctx.fillStyle='#dcdce8';
    ctx.fillRect(sx-4, sy+1-bob, 9, 8);
    ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(sx-4, sy+1-bob, 9, 1);
  } else if(npc.id==='aldric'){
    // Blacksmith — leather apron, soot, big arms
    ctx.fillStyle='#5a3820';
    ctx.fillRect(sx-3, sy+2-bob, 7, 8); // apron
    ctx.fillStyle='rgba(0,0,0,0.2)';
    ctx.fillRect(sx-3, sy+2-bob, 1, 8); ctx.fillRect(sx+3, sy+2-bob, 1, 8);
    // Soot marks on face
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.fillRect(sx-1, sy-4-bob, 2, 1); ctx.fillRect(sx+1, sy-2-bob, 2, 1);
    // Thick forearms (wider arms for a smith)
    ctx.fillStyle=col;
    ctx.fillRect(sx-7, sy+2-bob, 4, 7); ctx.fillRect(sx+4, sy+2-bob, 4, 7);
    // Heavy beard/stubble
    ctx.fillStyle='#2a1808';
    ctx.fillRect(sx-2, sy-1-bob, 5, 2);
  } else if(npc.id==='malachar'){
    // Wizard — pointed hat, robes
    // Dark robe
    ctx.fillStyle='#1a0830';
    ctx.fillRect(sx-5, sy+1-bob, 11, 8);
    ctx.fillStyle='rgba(100,50,200,0.2)';
    ctx.fillRect(sx-5, sy+1-bob, 11, 8);
    // Stars on robe
    ctx.fillStyle='rgba(200,180,255,0.5)';
    ctx.fillRect(sx-3, sy+3-bob, 1, 1); ctx.fillRect(sx+2, sy+5-bob, 1, 1); ctx.fillRect(sx, sy+2-bob, 1, 1);
    // Pointed hat
    ctx.fillStyle='#18062a';
    ctx.fillRect(sx-4, sy-7-bob, 9, 3);  // brim
    ctx.fillRect(sx-2, sy-11-bob, 5, 5); // lower cone
    ctx.fillRect(sx-1, sy-14-bob, 3, 4); // upper cone
    ctx.fillRect(sx,   sy-16-bob, 1, 3); // tip
    ctx.fillStyle='rgba(180,100,255,0.5)';
    ctx.fillRect(sx-1, sy-11-bob, 3, 1); // hat band
    // Long white beard
    ctx.fillStyle='#e0dce8';
    ctx.fillRect(sx-2, sy-1-bob, 5, 4);
    ctx.fillRect(sx-1, sy+2-bob, 3, 5);
  } else if(npc.id==='mirela'){
    // Merchant — green vest, headscarf
    ctx.fillStyle='#3a7a20';
    ctx.fillRect(sx-4, sy+1-bob, 9, 8); // green vest
    ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(sx-4, sy+1-bob, 9, 1);
    // Headscarf (over hair)
    ctx.fillStyle='#c07020';
    ctx.fillRect(sx-4, sy-7-bob, 9, 4);
    ctx.fillRect(sx-5, sy-4-bob, 2, 4); // scarf drape left
    // Earring
    ctx.fillStyle='#d0a020'; ctx.fillRect(sx+4, sy-3-bob, 1, 2);
  } else if(npc.id==='innkeeper'){
    // Innkeeper Rosalind — pink apron, bun hair
    ctx.fillStyle='#d06080';
    ctx.fillRect(sx-3, sy+2-bob, 7, 8); // pink apron
    ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(sx-3, sy+2-bob, 7, 1);
    // Hair bun (override hair)
    ctx.fillStyle='#7a3010';
    ctx.fillRect(sx-3, sy-7-bob, 7, 2);
    ctx.fillRect(sx-1, sy-9-bob, 3, 3); // bun on top
    ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(sx-1, sy-9-bob, 2, 1);
  }

  // ── Name label ──
  if(label){
    ctx.font='4px "Press Start 2P",monospace';
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    const lw=ctx.measureText(label).width+4;
    ctx.fillStyle='rgba(0,0,0,0.55)';
    ctx.fillRect(sx-lw/2, sy-18-bob, lw, 7);
    ctx.fillStyle=near?'#ffd84a':'rgba(220,200,150,0.85)';
    ctx.fillText(label, sx, sy-12-bob);
  }

  // ── Interact prompt ──
  if(near){
    const pulse=0.75+0.25*Math.sin(Date.now()*0.006);
    const txt='[E] Talk';
    ctx.font='4px "Press Start 2P",monospace';
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    const tw2=ctx.measureText(txt).width+6;
    const by=sy-26-bob;
    ctx.globalAlpha=pulse;
    ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(sx-tw2/2, by-1, tw2, 8);
    ctx.strokeStyle='#ffd84a'; ctx.lineWidth=1; ctx.strokeRect(sx-tw2/2, by-1, tw2, 8);
    ctx.fillStyle='#ffd84a'; ctx.fillText(txt, sx, by+6);
    ctx.globalAlpha=1;
  }
}
// ── Draw player ───────────────────────────────────────────
function _drawPlayer(ctx, cx, cy){
  const sx=_pl.wx-cx, sy=_pl.wy-cy;
  const moving=_keys['ArrowLeft']||_keys['a']||_keys['A']||_keys['ArrowRight']||_keys['d']||_keys['D']||_keys['ArrowUp']||_keys['w']||_keys['W']||_keys['ArrowDown']||_keys['s']||_keys['S'];
  const t=Date.now()*0.012;
  const bob=moving?Math.sin(t)*1.5:0;
  const legSwing=moving?Math.sin(t)*2:0;
  const f=_pl.facing; // 0=up,1=right,2=down,3=left

  // Class color schemes
  const cls=(typeof G!=='undefined'&&G)?G.classId:'fighter';
  const P={
    fighter:  {body:'#8090a8',bodyHi:'#a0b0c8',bodyLo:'#404858',belt:'#604808',buckle:'#e8c030',skin:'#e8c99a',hair:'#5a3818',hat:null,     cape:null,      weapon:'#c0c8d8',weaponHi:'#e0e4ec',acc:null,       glow:null},
    wizard:   {body:'#3a2880',bodyHi:'#5040a8',bodyLo:'#1a1040',belt:'#6a5020',buckle:'#c8a848',skin:'#e8c99a',hair:'#2a1a40',hat:'#3a2880', cape:null,      weapon:'#8a6030',weaponHi:'#b89060',acc:'#80c0ff',  glow:'rgba(100,160,255,0.15)'},
    rogue:    {body:'#2a2a2a',bodyHi:'#404040',bodyLo:'#141414',belt:'#3a2010',buckle:'#808080',skin:'#e8c99a',hair:'#1a1a1a',hat:'hood',    cape:null,      weapon:'#a0a0a0',weaponHi:'#d0d0d0',acc:null,       glow:null},
    paladin:  {body:'#e0d8c0',bodyHi:'#f0ece0',bodyLo:'#a09880',belt:'#c8a848',buckle:'#e8c030',skin:'#e8c99a',hair:'#c8a060',hat:null,     cape:'#1a3a8a', weapon:'#e0d8c0',weaponHi:'#f0f0e8',acc:'#ffd84a',  glow:'rgba(255,216,74,0.12)'},
    ranger:   {body:'#2a5020',bodyHi:'#3a6830',bodyLo:'#1a3010',belt:'#5a3818',buckle:'#8a6030',skin:'#e8c99a',hair:'#5a3818',hat:null,     cape:'#1a3a10', weapon:null,     weaponHi:null,     acc:'#5a3818',  glow:null},
    barbarian:{body:'#e8c99a',bodyHi:'#f0d8b0',bodyLo:'#c8a070',belt:'#4a2000',buckle:'#808080',skin:'#e8c99a',hair:'#8a2010',hat:null,     cape:'#4a2000', weapon:'#808080',weaponHi:'#a0a0a0',acc:null,       glow:null},
    cleric:   {body:'#d0c8b8',bodyHi:'#e8e0d0',bodyLo:'#a09880',belt:'#c8a848',buckle:'#e8c030',skin:'#e8c99a',hair:'#6a5040',hat:null,     cape:null,      weapon:null,     weaponHi:null,     acc:'#ffd84a',  glow:'rgba(255,216,74,0.08)'},
    druid:    {body:'#5a4830',bodyHi:'#7a6848',bodyLo:'#3a2818',belt:'#2a4a10',buckle:'#6a8a40',skin:'#e8c99a',hair:'#4a6020',hat:null,     cape:null,      weapon:'#6a5020',weaponHi:'#8a7040',acc:'#4a8a20',  glow:'rgba(80,160,40,0.1)'}
  };
  const p=P[cls]||P.fighter;

  // ── Shadow ──
  ctx.fillStyle='rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(sx+4,sy+15,5,2,0,0,Math.PI*2); ctx.fill();

  // ── Glow (magic classes) ──
  if(p.glow){
    ctx.fillStyle=p.glow;
    ctx.beginPath(); ctx.ellipse(sx+4,sy+8,8,10,0,0,Math.PI*2); ctx.fill();
  }

  // ── Cape (behind body) ──
  if(p.cape && (f===0||f===1||f===3)){
    ctx.fillStyle=p.cape;
    if(f===0){ ctx.fillRect(sx+1,sy+5+bob,6,8); }
    else if(f===1){ ctx.fillRect(sx-1,sy+4+bob,3,9); }
    else{ ctx.fillRect(sx+6,sy+4+bob,3,9); }
  }

  // ── Legs ──
  ctx.fillStyle='#1a1008';
  ctx.fillRect(sx+1,sy+11+bob,3,4+legSwing);
  ctx.fillRect(sx+4,sy+11+bob,3,4-legSwing);
  // Boots
  ctx.fillStyle=cls==='barbarian'?'#5a3818':'#2a1a08';
  ctx.fillRect(sx,  sy+14+bob+legSwing,4,2);
  ctx.fillRect(sx+3,sy+14+bob-legSwing,4,2);

  // ── Torso ──
  ctx.fillStyle=p.body;
  ctx.fillRect(sx,sy+5+bob,8,7);
  // Highlight top
  ctx.fillStyle=p.bodyHi;
  ctx.fillRect(sx,sy+5+bob,8,2);
  // Shadow bottom
  ctx.fillStyle=p.bodyLo;
  ctx.fillRect(sx,sy+10+bob,8,2);
  // Belt
  ctx.fillStyle=p.belt;
  ctx.fillRect(sx,sy+11+bob,8,1);
  ctx.fillStyle=p.buckle;
  ctx.fillRect(sx+3,sy+11+bob,2,1);

  // ── Arms ──
  ctx.fillStyle=p.body;
  ctx.fillRect(sx-1,sy+5+bob,2,6);
  ctx.fillRect(sx+7,sy+5+bob,2,6);
  // Hands
  ctx.fillStyle=cls==='barbarian'?p.skin:'rgba(200,180,140,0.7)';
  ctx.fillRect(sx-1,sy+10+bob,2,2);
  ctx.fillRect(sx+7,sy+10+bob,2,2);

  // ── Weapon (right side) ──
  if(p.weapon){
    if(cls==='fighter'||cls==='paladin'){
      // Sword
      if(f===1||f===2){ ctx.fillStyle=p.weapon; ctx.fillRect(sx+9,sy+3+bob,1,10); ctx.fillStyle=p.weaponHi; ctx.fillRect(sx+9,sy+3+bob,1,3); ctx.fillStyle=p.buckle; ctx.fillRect(sx+8,sy+7+bob,3,1); }
      else if(f===3){ ctx.fillStyle=p.weapon; ctx.fillRect(sx-2,sy+3+bob,1,10); ctx.fillStyle=p.weaponHi; ctx.fillRect(sx-2,sy+3+bob,1,3); ctx.fillStyle=p.buckle; ctx.fillRect(sx-3,sy+7+bob,3,1); }
    } else if(cls==='wizard'||cls==='druid'){
      // Staff
      const staffX=f===3?sx-2:sx+9;
      ctx.fillStyle=p.weapon; ctx.fillRect(staffX,sy-2+bob,1,16);
      ctx.fillStyle=p.acc||p.weaponHi; ctx.fillRect(staffX-1,sy-3+bob,3,2);
      if(cls==='wizard'){ ctx.fillStyle='#80c0ff'; ctx.fillRect(staffX,sy-4+bob,1,2); }
    } else if(cls==='rogue'){
      // Dagger
      if(f===1||f===2){ ctx.fillStyle=p.weapon; ctx.fillRect(sx+9,sy+6+bob,1,6); ctx.fillStyle=p.weaponHi; ctx.fillRect(sx+9,sy+6+bob,1,2); }
      else if(f===3){ ctx.fillStyle=p.weapon; ctx.fillRect(sx-2,sy+6+bob,1,6); ctx.fillStyle=p.weaponHi; ctx.fillRect(sx-2,sy+6+bob,1,2); }
    } else if(cls==='barbarian'){
      // Big axe
      const axX=f===3?sx-3:sx+9;
      ctx.fillStyle='#5a3818'; ctx.fillRect(axX,sy+bob,1,13);
      ctx.fillStyle=p.weapon; ctx.fillRect(axX-(f===3?2:0),sy+bob,3,4);
      ctx.fillStyle=p.weaponHi; ctx.fillRect(axX-(f===3?2:0),sy+bob,3,1);
    }
  }
  // Ranger bow on back
  if(cls==='ranger'){
    ctx.fillStyle=p.acc;
    if(f===0){ ctx.strokeStyle=p.acc; ctx.lineWidth=0.8; ctx.beginPath(); ctx.arc(sx+4,sy+6+bob,4,Math.PI*0.8,Math.PI*2.2,false); ctx.stroke(); }
    else if(f===1){ ctx.fillRect(sx-1,sy+2+bob,1,10); }
    else if(f===3){ ctx.fillRect(sx+8,sy+2+bob,1,10); }
  }

  // ── Head ──
  ctx.fillStyle=p.skin; ctx.fillRect(sx+1,sy-1+bob,6,6);

  // ── Hair / Hat ──
  if(p.hat==='#3a2880'){
    // Wizard pointed hat
    ctx.fillStyle=p.hat;
    ctx.fillRect(sx,sy-2+bob,8,3);
    ctx.fillRect(sx+1,sy-4+bob,6,2);
    ctx.fillRect(sx+2,sy-6+bob,4,2);
    ctx.fillRect(sx+3,sy-7+bob,2,1);
    // Hat brim
    ctx.fillStyle=p.bodyHi; ctx.fillRect(sx-1,sy-1+bob,10,1);
  } else if(p.hat==='hood'){
    // Rogue hood
    ctx.fillStyle='#1a1a1a';
    ctx.fillRect(sx,sy-2+bob,8,4);
    ctx.fillRect(sx-1,sy-1+bob,10,2);
    // Shadow over face
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(sx+1,sy-1+bob,6,2);
  } else {
    // Normal hair
    ctx.fillStyle=p.hair;
    ctx.fillRect(sx+1,sy-2+bob,6,2);
    ctx.fillRect(sx,sy-1+bob,1,3);
    ctx.fillRect(sx+7,sy-1+bob,1,3);
  }
  // Helmet for fighter/paladin
  if(cls==='fighter'||cls==='paladin'){
    ctx.fillStyle=p.bodyHi;
    ctx.fillRect(sx,sy-2+bob,8,3);
    ctx.fillStyle=p.body;
    ctx.fillRect(sx+1,sy-3+bob,6,1);
    // Visor slit
    ctx.fillStyle='#1a1208'; ctx.fillRect(sx+2,sy+bob,4,1);
    if(cls==='paladin'){ ctx.fillStyle='#ffd84a'; ctx.fillRect(sx+3,sy-3+bob,2,1); }
  }

  // ── Eyes (based on facing) ──
  if(cls!=='fighter'&&cls!=='paladin'){
    ctx.fillStyle='#1a1008';
    if(f===2){ ctx.fillRect(sx+2,sy+2+bob,1,1); ctx.fillRect(sx+5,sy+2+bob,1,1); }
    else if(f===0){ ctx.fillRect(sx+2,sy+1+bob,1,1); ctx.fillRect(sx+5,sy+1+bob,1,1); }
    else if(f===3){ ctx.fillRect(sx+1,sy+2+bob,1,1); }
    else{ ctx.fillRect(sx+6,sy+2+bob,1,1); }
  }

  // ── Class accent (holy symbol, leaf, etc.) ──
  if(cls==='cleric'&&p.acc){
    ctx.fillStyle=p.acc;
    ctx.fillRect(sx+3,sy+6+bob,2,3);
    ctx.fillRect(sx+2,sy+7+bob,4,1);
  }
  if(cls==='druid'&&p.acc){
    // Floating leaf particles
    const lt=Date.now()*0.002;
    ctx.fillStyle=p.acc;
    ctx.globalAlpha=0.5+0.3*Math.sin(lt);
    ctx.fillRect(sx+8+Math.sin(lt)*2,sy-2+Math.cos(lt)*3+bob,2,1);
    ctx.globalAlpha=1;
  }
}

// ── Draw particles ────────────────────────────────────────
function _drawParticles(ctx, a, cx, cy){
  for(const p of _ptcls){
    const l=1-p.life, px=p.x-cx, py=p.y-cy;
    if(px<-20||py<-20||px>_logW()+20||py>_logH()+20) continue;
    if(p.fx==='fireflies'){ ctx.globalAlpha=(0.3+0.7*Math.abs(Math.sin(p.blink+Date.now()*0.003)))*l; ctx.fillStyle='#ccff88'; ctx.fillRect(px-p.r,py-p.r,p.r*2,p.r*2); }
    else if(p.fx==='ash'){ ctx.globalAlpha=0.4*l; ctx.fillStyle='#aaa090'; ctx.fillRect(px,py,p.r,p.r); }
    else if(p.fx==='mist'){ ctx.globalAlpha=p.a*(1-Math.abs(p.life-.5)*2); ctx.fillStyle='#a0b0c0'; ctx.beginPath(); ctx.arc(px,py,p.r,0,6.28); ctx.fill(); }
    else if(p.fx==='spores'){ ctx.globalAlpha=0.5*l; ctx.fillStyle=`hsl(${p.hue},80%,60%)`; ctx.fillRect(px,py,p.r,p.r); }
    else if(p.fx==='embers'){ ctx.globalAlpha=0.8*l; ctx.fillStyle=`hsl(${15+Math.random()*25},100%,65%)`; ctx.fillRect(px,py,p.r,p.r); }
  }
  ctx.globalAlpha=1;
}

// ── Draw HUD ──────────────────────────────────────────────
function _drawHUD(ctx, a, near){
  const W=_logW(), H=_logH();
  // Top bar
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,0,W,11);
  ctx.font='5px "Press Start 2P",monospace';
  ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillStyle='#c8a84b';
  ctx.fillText('🪙 '+((typeof G!=='undefined'&&G)?G.gold+'g':'—'), 4, 5.5);
  ctx.textAlign='center';
  ctx.fillStyle='rgba(200,180,120,0.5)';
  ctx.fillText(_tScene==='exterior'?'ELDERFEN':((INTERIORS[_tScene]||{}).label||_tScene), W/2, 5.5);
  // top-right label removed

  // Bottom bar
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,H-11,W,11);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='rgba(180,160,100,0.5)';
  if(_victoryActive){
    // No prompt during victory — clean view
  } else if(near){
    let prompt='';
    if(near.type==='door')    prompt=`[E] Enter ${near.ref.label||'building'}`;
    else if(near.type==='gate')   prompt='[E] Approach the Dungeon Gate';
    else if(near.type==='graceVault') prompt='[E] Open Grace Vault';
    else if(near.type==='stashChest') prompt='[E] Open Stash';
    else if(near.type==='notice') prompt='[E] Read Notices';
    else if(near.type==='exit')   prompt='[E] Leave building';
    else if(near.type==='wanderer'||near.type==='npc') prompt='[E] Talk';
    ctx.fillStyle='#ffd84a';
    ctx.fillText(prompt, W/2, H-5.5);
  } else {
    ctx.fillText('WASD / ARROWS  ·  E to interact', W/2, H-5.5);
  }
}

// ── Wander AI ─────────────────────────────────────────────
function _stepWanderers(zi){
  for(const w of _wanderers){
    if(w.stationary){ w._moving=false; continue; }

    if(w.talking){
      w._moving=false;
      const bubbleOpen=document.getElementById('npcSpeechOverlay')?.classList.contains('open');
      if(!bubbleOpen){ w.talkTimer--; if(w.talkTimer<=0) w.talking=false; }
      continue;
    }

    // Proximity pause — "chatting" with another NPC
    if(w._proxPause && w._proxPause>0){ w._proxPause--; w._moving=false; continue; }

    w.wanderTimer--;
    if(w.wanderTimer<=0){
      const a=w.wanderArea;
      const tx=(a.x1+Math.random()*(a.x2-a.x1))*TILE;
      const ty=(a.y1+Math.random()*(a.y2-a.y1))*TILE;
      w.wanderTarget={x:tx,y:ty};
      w.wanderTimer=80+Math.random()*120;
    }

    const dx=w.wanderTarget.x-w.wx, dy=w.wanderTarget.y-w.wy;
    const dist=Math.hypot(dx,dy);
    if(dist>2){
      const spd=0.2;
      const nx=w.wx+dx/dist*spd, ny=w.wy+dy/dist*spd;
      if(!_extBlocked(nx,w.wy)) w.wx=nx;
      if(!_extBlocked(w.wx,ny)) w.wy=ny;
      if(Math.abs(dx)>Math.abs(dy)) w.facing=dx>0?1:3;
      else w.facing=dy>0?2:0;
      w._moving=true;
    } else { w._moving=false; }
  }
  _checkProximity();
}

// Interior NPC wander — non-stationary NPCs pace around their room
function _stepInteriorNPCs(int){
  for(const n of int.npcs){
    if(n.stationary) continue;

    // Init wander state on first use
    if(!n._wx){ n._wx=n.tx*TILE+TILE/2; n._wy=n.ty*TILE+TILE/2; }
    if(!n._wTarget){ n._wTarget={x:n._wx,y:n._wy}; n._wTimer=60+Math.random()*80; n._wFacing=2; }

    n._wTimer--;
    if(n._wTimer<=0){
      // Wander within 3 tiles of home position
      const hx=n.tx*TILE+TILE/2, hy=n.ty*TILE+TILE/2;
      n._wTarget={x:hx+(Math.random()-0.5)*3*TILE, y:hy+(Math.random()-0.5)*3*TILE};
      n._wTimer=60+Math.random()*80;
    }

    const dx=n._wTarget.x-n._wx, dy=n._wTarget.y-n._wy;
    const dist=Math.hypot(dx,dy);
    if(dist>2){
      const spd=0.15;
      const nx2=n._wx+dx/dist*spd, ny2=n._wy+dy/dist*spd;
      if(!_intBlocked(int.map,nx2,n._wy)) n._wx=nx2;
      if(!_intBlocked(int.map,n._wx,ny2)) n._wy=ny2;
      if(Math.abs(dx)>Math.abs(dy)) n._wFacing=dx>0?1:3;
      else n._wFacing=dy>0?2:0;
    }
  }
}

// ── Near interactable (cached per frame) ─────────────────
let _nearInteractable = null;

// ══════════════════════════════════════════════════════════
//  MAIN LOOP
// ══════════════════════════════════════════════════════════
function _townTick(){
  if(!_tRunning) return;

  const zi=(typeof G!=='undefined'&&G)?Math.min(G.zoneIdx||0,ATMOS.length-1):0;
  const a=ATMOS[zi];
  const ctx=_tx;
  const W=_logW(), H=_logH();

  // ── Input ──
  // Block movement while intro or farewell overlays are active
  const _farewellActive = document.getElementById('farewellScreen')?.style.display === 'flex';
  let dx=0,dy=0;
  if(!_introCamActive && !_farewellActive && !_victoryActive){
    if(_keys['ArrowLeft'] ||_keys['a']||_keys['A']){dx=-1;_pl.facing=3;}
    if(_keys['ArrowRight']||_keys['d']||_keys['D']){dx= 1;_pl.facing=1;}
    if(_keys['ArrowUp']   ||_keys['w']||_keys['W']){dy=-1;_pl.facing=0;}
    if(_keys['ArrowDown'] ||_keys['s']||_keys['S']){dy= 1;_pl.facing=2;}
  }
  if(dx&&dy){dx*=0.707;dy*=0.707;}

  const spd=_pl.speed;
  const nx=_pl.wx+dx*spd, ny=_pl.wy+dy*spd;
  const m=4; // pixel collision margin

  if(_tScene==='exterior'){
    if(!_extBlocked(nx+m,_pl.wy+m)&&!_extBlocked(nx+m,_pl.wy+TILE-m)&&!_extBlocked(nx+TILE-m,_pl.wy+m)&&!_extBlocked(nx+TILE-m,_pl.wy+TILE-m)) _pl.wx=nx;
    if(!_extBlocked(_pl.wx+m,ny+m)&&!_extBlocked(_pl.wx+m,ny+TILE-m)&&!_extBlocked(_pl.wx+TILE-m,ny+m)&&!_extBlocked(_pl.wx+TILE-m,ny+TILE-m)) _pl.wy=ny;
    if(!_victoryActive){
      _pl.wx=Math.max(TILE,Math.min((EXT_COLS-2)*TILE,_pl.wx));
      _pl.wy=Math.max(TILE,Math.min((EXT_ROWS-2)*TILE,_pl.wy));
    }
  } else {
    const int=INTERIORS[_tScene];
    if(int){
      if(!_intBlocked(int.map,nx+m,_pl.wy+m)&&!_intBlocked(int.map,nx+m,_pl.wy+TILE-m)&&!_intBlocked(int.map,nx+TILE-m,_pl.wy+m)&&!_intBlocked(int.map,nx+TILE-m,_pl.wy+TILE-m)) _pl.wx=nx;
      if(!_intBlocked(int.map,_pl.wx+m,ny+m)&&!_intBlocked(int.map,_pl.wx+m,ny+TILE-m)&&!_intBlocked(int.map,_pl.wx+TILE-m,ny+m)&&!_intBlocked(int.map,_pl.wx+TILE-m,ny+TILE-m)) _pl.wy=ny;
      _pl.wx=Math.max(0,Math.min((INT_W-1)*TILE,_pl.wx));
      _pl.wy=Math.max(0,Math.min((INT_H-1)*TILE,_pl.wy));
    }
  }

  _nearInteractable=_findNearInteractable();
  if(!_victoryActive && _dialogSrcX!==null && Math.hypot(_pl.wx-_dialogSrcX, _pl.wy-_dialogSrcY) > TILE*3){
    closeNpcDialog();
  }
  if(_victoryActive) _victoryStep();
  if(_tScene==='exterior') _stepWanderers(zi);
  else { const _int=INTERIORS[_tScene]; if(_int) _stepInteriorNPCs(_int); }
  _stepPtcls(a.fx);
  _stepAmbient();
  _updateCamera(W,H);

  // ── Draw ──
  ctx.fillStyle=a.sky; ctx.fillRect(0,0,W,H); // W/H are logical (pre-scale)

  if(_tScene==='exterior'){
    _drawExtTiles(ctx,a,_camX,_camY,W,H);
    _drawRipples(ctx,_camX,_camY);
    EXT_DECORS.filter(d=>d.type==='tree').forEach(d=>_drawDecor(ctx,d,a,_camX,_camY));
    EXT_BUILDINGS.forEach(b=>{ if(b.id==='noticeboard') return; _drawExtBuilding(ctx,b,a,_camX,_camY); });
    _drawSmoke(ctx,_camX,_camY);
    EXT_DECORS.filter(d=>d.type!=='tree').forEach(d=>_drawDecor(ctx,d,a,_camX,_camY));
    _drawCat(ctx,_camX,_camY);
    // Wanderers
    for(const w of _wanderers){
      const near=_nearInteractable&&_nearInteractable.type==='wanderer'&&_nearInteractable.ref===w;
      _drawNPC(ctx,w,w.wx,w.wy,w.facing,_camX,_camY,near,w.label);
    }
  } else {
    const int=INTERIORS[_tScene];
    if(int){
      // Dark border fill behind centered interior map
      ctx.fillStyle='#0a0806'; ctx.fillRect(0,0,W,H);
      const _mW=INT_W*TILE, _mH=INT_H*TILE;
      const _oX=-_camX, _oY=-_camY;
      ctx.fillStyle='#1a1410'; ctx.fillRect(_oX-4,_oY-4,_mW+8,_mH+8);
      ctx.strokeStyle='#3a2a1a'; ctx.lineWidth=2; ctx.strokeRect(_oX-2,_oY-2,_mW+4,_mH+4);
      _drawIntTiles(ctx,a,int.map,_camX,_camY);
      for(const n of int.npcs){
        const near=_nearInteractable&&_nearInteractable.type==='npc'&&_nearInteractable.ref===n;
        // Use wander position if available (non-stationary NPCs), else fixed tx/ty
        const nwx = n._wx !== undefined ? n._wx : n.tx*TILE+TILE/2;
        const nwy = n._wy !== undefined ? n._wy : n.ty*TILE+TILE/2;
        const nfacing = n._wFacing !== undefined ? n._wFacing : 2;
        _drawNPC(ctx,n,nwx,nwy,nfacing,_camX,_camY,near,n.label);
      }
    }
  }

  _drawParticles(ctx,a,_camX,_camY);
  if(_tScene==='exterior') _drawBirds(ctx,_camX,_camY);

  // Vignette
  ctx.fillStyle=a.ambient; ctx.fillRect(0,0,W,H);
  const vig=ctx.createRadialGradient(W/2,H/2,H*.1,W/2,H/2,W*.65);
  vig.addColorStop(0,'transparent'); vig.addColorStop(1,'rgba(0,0,0,0.5)');
  ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

  // Intro tour marker (pulsing chevron over target building)
  if(_introCamActive && typeof _drawIntroMarker==='function'){
    _drawIntroMarker(ctx,_camX,_camY);
  }

  // Hide player & HUD during intro tour for cleaner presentation
  if(!_introCamActive){
    _drawPlayer(ctx,_camX,_camY);
    // Draw noticeboard AFTER player so player walks under it
    if(_tScene==='exterior'){
      const nb=EXT_BUILDINGS.find(b=>b.id==='noticeboard');
      if(nb) _drawExtBuilding(ctx,nb,a,_camX,_camY);
    }
    _drawHUD(ctx,a,_nearInteractable);
    _drawMinimap(ctx);
  }

  _tRAF=requestAnimationFrame(_townTick);
}

// ── Keyboard ──────────────────────────────────────────────
function _kd(e){
  _keys[e.key]=true;
  // Block interactions while intro, farewell, or victory overlays are active
  const _overlayActive = _introCamActive || _victoryActive ||
                         document.getElementById('farewellScreen')?.style.display === 'flex';
  if(_overlayActive) return;
  // e.repeat=true when key held down — only interact on the very first press
  if(!e.repeat && (e.key==='e'||e.key==='E')){
    if(_nearInteractable){
      e.preventDefault();
      const target=_nearInteractable;
      _nearInteractable=null; // clear so the transition frame can't re-fire
      _handleInteract(target);
    }
  }
  if(!e.repeat && (e.key==='m'||e.key==='M'||e.key==='Tab')){
    e.preventDefault();
    _minimapExpanded=!_minimapExpanded;
  }
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
}
function _ku(e){ _keys[e.key]=false; }

// ── Interact handler ──────────────────────────────────────
function _handleInteract(near){
  if(!near) return;
  if(near.type==='door'){
    _enterInterior(near.ref.interior);
  } else if(near.type==='exit'){
    _exitInterior();
  } else if(near.type==='gate'){
    _handleGate();
  } else if(near.type==='graceVault'){
    townOpenGraces();
  } else if(near.type==='stashChest'){
    townOpenDialog('stash');
  } else if(near.type==='notice'){
    townOpenDialog('notice');
  } else if(near.type==='wanderer'){
    _talkToWanderer(near.ref);
  } else if(near.type==='npc'){
    const n=near.ref;
    if(n.onInteract){ n.onInteract(); }
    else if(n.lines){ _showNPCLine(n); }
  }
}

function _enterInterior(id){
  if(!INTERIORS[id]) return;
  const int=INTERIORS[id];
  _tScene=id;
  _pl.wx=int.spawnTx*TILE+TILE/2;
  _pl.wy=int.spawnTy*TILE+TILE/2;
  _pl.facing=0;
  if(typeof AUDIO!=='undefined'&&AUDIO.playBGM) AUDIO.playBGM(int.bgm||'campfire');
}

function _exitInterior(){
  // Find which building this interior belongs to
  const bldg=EXT_BUILDINGS.find(b=>b.interior===_tScene);
  _tScene='exterior';
  if(bldg){
    _pl.wx=(bldg.doorTx+0.5)*TILE;
    _pl.wy=(bldg.doorTy+1)*TILE; // one tile south of door
  }
  _pl.facing=2;
  const zi=(typeof G!=='undefined'&&G)?Math.min(G.zoneIdx||0,ATMOS.length-1):0;
  if(typeof AUDIO!=='undefined'&&AUDIO.playBGM) AUDIO.playBGM('campfire');
}

// ── Gate logic ────────────────────────────────────────────
function _handleGate(){
  const hasClass = typeof G!=='undefined' && G && G.classId;
  if(!hasClass){
    stopTownEngine();
    window._classFromTown=true;
    if(typeof showScreen==='function') showScreen('class');
    if(typeof renderClassSelect==='function') renderClassSelect();
  } else if(G.zoneIdx >= 7 && !G._farewellShown) {
    G._farewellShown = true;
    // Phase B: Track farewell for unlocks before state gets wiped
    if(typeof updateUnlockStats==='function') updateUnlockStats('farewell');
    showFarewellCutscene(()=>{ stopTownEngine(); townEnterDungeon(); });
  } else {
    openPrepareScreen();
  }
}

// ── Grace Vault logic ─────────────────────────────────────
function townOpenGraces(){
  stopTownEngine();
  const backBtn = document.querySelector('#screen-graces .grace-back-btn, #screen-graces [onclick*="showScreen"]');
  if(backBtn){
    backBtn._origOnclick = backBtn.getAttribute('onclick');
    backBtn._origText = backBtn.textContent;
    backBtn.setAttribute('onclick','townReturnFromGraces()');
    backBtn.textContent = '◀ BACK TO TOWN';
  }
  if(typeof activeSaveSlot!=='undefined'&&typeof slotOpenGraces==='function'){
    slotOpenGraces(activeSaveSlot);
  } else if(typeof showScreen==='function'){
    showScreen('graces');
  }
}

function townReturnFromGraces(){
  const backBtn = document.querySelector('#screen-graces .grace-back-btn, #screen-graces [onclick*="townReturnFromGraces"]');
  if(backBtn&&backBtn._origOnclick){
    backBtn.setAttribute('onclick', backBtn._origOnclick);
    backBtn.textContent = backBtn._origText || '◀ BACK';
  }
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const ts = document.getElementById('screen-town');
  if(ts) ts.classList.add('active');
  if(typeof _startTown==='function') _startTown();
}

// ══════════════════════════════════════════════════════════
//  TOWN INTRODUCTION — Animated guided tour (first visit)
//  Camera pans to each location with marker & slide transitions
// ══════════════════════════════════════════════════════════

const TOWN_INTRO_LINES = [
  { icon:'🏘', heading:'WELCOME TO ELDERFEN',
    camTx:30, camTy:22, marker:null,
    text:`The last town before the dark. People have lived here for three hundred years without fully understanding why they stay — but they stay. Something in the soil holds them.` },
  { icon:'🕹', heading:'HOW TO EXPLORE',
    camTx:30, camTy:22, marker:null,
    text:`Walk with WASD or arrow keys. Press E or Space near doors, people, and objects to interact. The people here have things to say — and what they say will change as you descend deeper.` },
  { icon:'⚔', heading:'THE DUNGEON GATE',
    camTx:29, camTy:3, marker:{tx:29,ty:4},
    text:`The entrance to what lies below. Approach it when you're ready to choose your class and begin your descent. After each boss, you'll return here to resupply.` },
  { icon:'✨', heading:'THE GRACE VAULT',
    camTx:25, camTy:4, marker:{tx:25,ty:3},
    text:`Permanent blessings earned across all your runs. Even death cannot take what the vault remembers. Spend Grace Points here on lasting power.` },
  { icon:'📦', heading:'THE STASH CHEST',
    camTx:22, camTy:8, marker:{tx:22,ty:8},
    text:`Your personal storage. Items here persist between runs — salvage gear from the dungeon and it waits for you next time. Load items before each descent.` },
  { icon:'🍺', heading:'THE RUSTED FLAGON',
    camTx:6, camTy:18, marker:{tx:6,ty:21},
    text:`Rook's tavern. Buy the old soldier a drink and he'll share rumors about what waits below. You'll also receive a combat buff each visit.` },
  { icon:'⛪', heading:'SHRINE OF SERAPHINE',
    camTx:36, camTy:5, marker:{tx:36,ty:8},
    text:`The Shrine's fire has burned without oil for three days. Seraphine offers class-specific blessings and heals your wounds. Don't leave town without one.` },
  { icon:'⚒', heading:"ALDRIC'S FORGE",
    camTx:5, camTy:31, marker:{tx:5,ty:34},
    text:`The blacksmith. Pay him to sharpen your blade before a run, and sell dungeon materials for gold. Every edge matters in the deep.` },
  { icon:'📚', heading:"MALACHAR'S STUDY",
    camTx:37, camTy:18, marker:{tx:37,ty:21},
    text:`The scholar has been circling a truth for years. Donate gold to fund his research and unlock access to rarer knowledge.` },
  { icon:'🛍', heading:"MIRELA'S GOODS",
    camTx:19, camTy:5, marker:{tx:19,ty:7},
    text:`Supplies for the descent. Browse her shop for gear and consumables. Purchases go into your stash for safekeeping.` },
  { icon:'🏟', heading:'THE PROVING GROUNDS',
    camTx:38, camTy:41, marker:{tx:38,ty:44},
    text:`A training arena in the south quarter. Practice combat and learn your abilities before risking the real thing below.` },
  { icon:'📋', heading:'THE NOTICE BOARD',
    camTx:29, camTy:16, marker:{tx:29,ty:17},
    text:`Posted notices from townsfolk and travelers. Check here for bounties that reward extra gold and rare items during your runs.` },
  { icon:'🏘', heading:'THE GATE WAITS',
    camTx:30, camTy:22, marker:null,
    text:`Explore at your own pace. Talk to the children, the guards, the farmers. Elderfen is alive. For now. When you're ready — the Gate waits.` },
];

// ── Intro camera & marker state ──────────────────────────
let _introCamActive = false;
let _introCamTarget = { x:0, y:0 };
let _introMarker = null; // {tx,ty} or null

let _townIntroTimer = null;
let _townIntroDone = null;
let _townIntroStep = 0;
let _townIntroSkipped = false;

function showTownIntro(onDone) {
  _townIntroDone = onDone;
  _townIntroStep = 0;
  _townIntroSkipped = false;

  const el = document.getElementById('townIntroScreen');
  if (!el) { if(onDone) onDone(); return; }
  el.style.display = 'flex';
  el.classList.remove('fading-out');

  // Activate intro camera — snap to first target immediately
  _introCamActive = true;
  const first = TOWN_INTRO_LINES[0];
  _introCamTarget = { x: first.camTx * TILE, y: first.camTy * TILE };
  _introMarker = first.marker;
  const mapW = EXT_COLS * TILE, mapH = EXT_ROWS * TILE;
  const vpW = _logW(), vpH = _logH();
  _camX = Math.max(0, Math.min(mapW - vpW, _introCamTarget.x - vpW/2));
  _camY = Math.max(0, Math.min(mapH - vpH, _introCamTarget.y - vpH/2));

  _renderIntroStep(false);
  document.addEventListener('keydown', _townIntroKeyHandler);
}

function _renderIntroStep(animate) {
  if (_townIntroSkipped) return;
  const line = TOWN_INTRO_LINES[_townIntroStep];
  if (!line) return;

  const inner   = document.getElementById('townIntroCardInner');
  const icon    = document.getElementById('townIntroIcon');
  const heading = document.getElementById('townIntroHeading');
  const text    = document.getElementById('townIntroText');
  const counter = document.getElementById('townIntroCounter');
  const nextBtn = document.getElementById('townIntroNextBtn');
  const bar     = document.getElementById('townIntroProgressBar');
  if (!inner || !text) return;

  // Update camera target & marker
  _introCamTarget = { x: line.camTx * TILE, y: line.camTy * TILE };
  _introMarker = line.marker;

  function applyContent() {
    // Icon with pulse
    if (icon) {
      icon.textContent = line.icon || '';
      icon.classList.remove('pulse');
      void icon.offsetWidth;
      icon.classList.add('pulse');
    }
    // Heading
    if (heading) {
      heading.textContent = line.heading || '';
      heading.style.display = line.heading ? 'block' : 'none';
    }
    // Typewriter text
    text.textContent = '';
    let i = 0;
    const txt = line.text;
    if (_townIntroTimer) clearTimeout(_townIntroTimer);
    function type() {
      if (_townIntroSkipped) return;
      if (i < txt.length) {
        text.textContent += txt[i++];
        _townIntroTimer = setTimeout(type, 12);
      }
    }
    type();
    // Counter & button
    if (counter) counter.textContent = (_townIntroStep + 1) + ' / ' + TOWN_INTRO_LINES.length;
    if (nextBtn) nextBtn.textContent = _townIntroStep >= TOWN_INTRO_LINES.length - 1 ? '⚔ ENTER ELDERFEN' : 'NEXT ▸';
    // Progress bar
    if (bar) bar.style.width = ((_townIntroStep + 1) / TOWN_INTRO_LINES.length * 100) + '%';
  }

  if (animate && inner) {
    inner.classList.add('slide-out');
    setTimeout(() => {
      if (_townIntroSkipped) return;
      applyContent();
      inner.classList.remove('slide-out');
      inner.classList.add('slide-in');
      setTimeout(() => inner.classList.remove('slide-in'), 400);
    }, 200);
  } else {
    applyContent();
    if (bar) bar.style.width = (1 / TOWN_INTRO_LINES.length * 100) + '%';
  }
}

function _townIntroAdvance() {
  if (_townIntroSkipped) return;
  // First press: if typewriter is still running, finish it instantly
  const text = document.getElementById('townIntroText');
  const line = TOWN_INTRO_LINES[_townIntroStep];
  if (text && line && text.textContent.length < line.text.length) {
    if (_townIntroTimer) clearTimeout(_townIntroTimer);
    text.textContent = line.text;
    return;
  }
  // Second press: advance to next step
  _townIntroStep++;
  if (_townIntroStep >= TOWN_INTRO_LINES.length) {
    closeTownIntro();
  } else {
    _renderIntroStep(true);
  }
}

function _townIntroKeyHandler(e) {
  if (e.key === 'Escape') {
    closeTownIntro();
  } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') {
    e.preventDefault();
    _townIntroAdvance();
  }
}

function closeTownIntro() {
  _townIntroSkipped = true;
  if (_townIntroTimer) { clearTimeout(_townIntroTimer); _townIntroTimer = null; }
  document.removeEventListener('keydown', _townIntroKeyHandler);

  // Fade out overlay
  const el = document.getElementById('townIntroScreen');
  if (el) {
    el.classList.add('fading-out');
    setTimeout(() => { el.style.display = 'none'; el.classList.remove('fading-out'); }, 600);
  }

  // Release camera & marker
  _introCamActive = false;
  _introMarker = null;

  // Persist flag
  if (typeof G !== 'undefined' && G) G._townIntroShown = true;
  if (typeof updateSlotData === 'function' && typeof activeSaveSlot !== 'undefined' && activeSaveSlot) {
    updateSlotData(activeSaveSlot, d => { d._townIntroShown = true; });
  }

  setTimeout(() => {
    if (_townIntroDone) { const fn = _townIntroDone; _townIntroDone = null; fn(); }
  }, 300);
}

// ── Draw pulsing location marker on canvas ───────────────
function _drawIntroMarker(ctx, camX, camY) {
  if (!_introMarker) return;
  const px = _introMarker.tx * TILE + TILE/2 - camX;
  const py = _introMarker.ty * TILE - camY;
  const t = performance.now() / 1000;
  const bob = Math.sin(t * 3) * 3;
  const pulse = 0.6 + Math.sin(t * 4) * 0.4;

  ctx.save();

  // Large radial glow on ground
  const glowR = 14 + Math.sin(t * 2.5) * 3;
  const grd = ctx.createRadialGradient(px, py + TILE*0.3, 0, px, py + TILE*0.3, glowR);
  grd.addColorStop(0, `rgba(200,168,75,${0.35 * pulse})`);
  grd.addColorStop(0.5, `rgba(200,168,75,${0.12 * pulse})`);
  grd.addColorStop(1, 'rgba(200,168,75,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(px - glowR, py + TILE*0.3 - glowR, glowR*2, glowR*2);

  // Pulsing ground ring
  ctx.globalAlpha = pulse * 0.5;
  ctx.strokeStyle = '#c8a84b';
  ctx.lineWidth = 1;
  const ringR = 10 + Math.sin(t * 2) * 2;
  ctx.beginPath();
  ctx.ellipse(px, py + TILE * 0.4, ringR, ringR * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Vertical beam of light
  ctx.globalAlpha = pulse * 0.08;
  ctx.fillStyle = '#c8a84b';
  ctx.fillRect(px - 1.5, py - 30 + bob, 3, 35);

  // Main arrow — big solid downward chevron
  const ay = py - 12 + bob;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#c8a84b';
  ctx.shadowColor = '#c8a84b';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(px, ay + 10);      // tip
  ctx.lineTo(px - 8, ay);       // top-left outer
  ctx.lineTo(px - 4, ay);       // top-left inner
  ctx.lineTo(px, ay + 6);       // inner notch
  ctx.lineTo(px + 4, ay);       // top-right inner
  ctx.lineTo(px + 8, ay);       // top-right outer
  ctx.closePath();
  ctx.fill();

  // Second chevron above (slightly smaller, fainter)
  const ay2 = ay - 8;
  ctx.globalAlpha = pulse * 0.55;
  ctx.beginPath();
  ctx.moveTo(px, ay2 + 8);
  ctx.lineTo(px - 6, ay2);
  ctx.lineTo(px - 3, ay2);
  ctx.lineTo(px, ay2 + 5);
  ctx.lineTo(px + 3, ay2);
  ctx.lineTo(px + 6, ay2);
  ctx.closePath();
  ctx.fill();

  // Third chevron (faintest, highest)
  const ay3 = ay2 - 7;
  ctx.globalAlpha = pulse * 0.25;
  ctx.beginPath();
  ctx.moveTo(px, ay3 + 6);
  ctx.lineTo(px - 5, ay3);
  ctx.lineTo(px - 2, ay3);
  ctx.lineTo(px, ay3 + 4);
  ctx.lineTo(px + 2, ay3);
  ctx.lineTo(px + 5, ay3);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;

  // Sparkle particles orbiting
  for (let i = 0; i < 4; i++) {
    const angle = t * 2 + i * Math.PI / 2;
    const orbitR = 8 + Math.sin(t * 3 + i) * 2;
    const sx = px + Math.cos(angle) * orbitR;
    const sy = py - 4 + Math.sin(angle) * orbitR * 0.4 + bob * 0.5;
    const sparkAlpha = 0.3 + Math.sin(t * 5 + i * 1.5) * 0.3;
    ctx.globalAlpha = sparkAlpha;
    ctx.fillStyle = '#ffe090';
    ctx.fillRect(sx - 0.5, sy - 0.5, 1, 1);
  }

  ctx.restore();
}

// ── Elspeth's Gate Farewell — triggered before Zone VIII descent ──
const FAREWELL_LINES = [
  { speaker: 'Narrator',     text: `They came to the Gate at dawn. You did not ask them to. They simply all ended up there — Rook, Elspeth, Seraphine, Aldric's apprentice, Father Oswin. And Kit.` },
  { speaker: 'Narrator',     text: `Nobody spoke at first. The Gate hummed very quietly, the way it always does before the dark takes hold.` },
  { speaker: 'Rook',         text: `"I kept a stool empty for thirty years. Didn't know why. I know now. You've got a seat whenever you come back. It'll be there."` },
  { speaker: 'Father Oswin', text: `"I wrote a prayer for endings. Good ones. I'll say it when you return. Go with everything you have."` },
  { speaker: 'Seraphine',    text: `"The Shrine's fire has been burning without oil since you arrived. This morning it burned gold. I take that as a good sign."` },
  { speaker: 'Kit',          text: `"I left the last page of my journal blank. For the ending. Whatever you say when you come back out — that's what goes in it. Don't make me leave it blank."` },
  { speaker: 'Narrator',     text: `Elspeth took your hand. She held it for a moment — not frail, not trembling. Steady, the way a person is steady when they have decided something completely.` },
  { speaker: 'Elspeth',      text: `"You have come back every time. I do not know what you are doing down there. I do not need to know."` },
  { speaker: 'Elspeth',      text: `"But whatever it is — finish it."` },
  { speaker: 'Narrator',     text: `You turned toward the Gate.` },
  { speaker: 'Narrator',     text: `Behind you, six people who do not know your real name stand in the cold morning light, holding it for you until you return.` },
];

let _farewellTimer = null;
let _farewellDone = null;
let _farewellStep = 0;

function showFarewellCutscene(onDone) {
  _farewellDone = onDone;
  _farewellStep = 0;
  const el = document.getElementById('farewellScreen');
  if (!el) { onDone(); return; }
  el.style.display = 'flex';
  const box = document.getElementById('farewellBox');
  const speaker = document.getElementById('farewellSpeaker');
  const text = document.getElementById('farewellText');
  const btn = document.getElementById('farewellBtn');
  btn.style.opacity = '0';
  box.classList.remove('fade-in');

  function showStep() {
    if (_farewellStep >= FAREWELL_LINES.length) {
      btn.style.opacity = '1';
      return;
    }
    const line = FAREWELL_LINES[_farewellStep];
    speaker.textContent = line.speaker === 'Narrator' ? '' : line.speaker;
    speaker.style.opacity = line.speaker === 'Narrator' ? '0' : '1';
    text.textContent = '';
    box.classList.remove('fade-in');
    void box.offsetWidth; // force reflow
    box.classList.add('fade-in');
    // Typewriter effect
    let i = 0;
    const txt = line.text;
    function type() {
      if (i < txt.length) {
        text.textContent += txt[i++];
        _farewellTimer = setTimeout(type, i === txt.length ? 0 : 22);
      }
    }
    type();
    _farewellStep++;
    if (_farewellStep < FAREWELL_LINES.length) {
      _farewellTimer = setTimeout(showStep, 3400);
    } else {
      _farewellTimer = setTimeout(() => { btn.style.opacity = '1'; }, 1200);
    }
  }
  showStep();
}

function closeFarewellCutscene() {
  if (_farewellTimer) clearTimeout(_farewellTimer);
  const el = document.getElementById('farewellScreen');
  if (el) el.style.display = 'none';
  if (_farewellDone) { const fn = _farewellDone; _farewellDone = null; fn(); }
}

// ── Wanderer talk ─────────────────────────────────────────
function _talkToWanderer(w){
  if(w.talking) return;
  w.talking=true;
  w.talkTimer=180; // pause movement for 3 seconds
  // Face player
  const dx=_pl.wx-w.wx, dy=_pl.wy-w.wy;
  w.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);
  // Show dialog
  const zi=_townState(_townBossCount());
  const zLines=NPC_LINES[zi]||NPC_LINES[0];
  let lines=typeof w.getLines==='function' ? w.getLines() : (w.lines||[]);
  // Resolve string keys to actual lines
  if(lines.length && typeof lines[0]==='string' && lines[0].startsWith('z_')){
    const key=lines[0]; lines=(zLines[key]||['...']).slice();
  }
  if(!lines.length) lines=['...'];
  const line=lines[w.activeLine||0];
  w.activeLine=((w.activeLine||0)+1)%lines.length;
  _showDialog(w.label||'???', line, w.wx, w.wy);
}

function _showNPCLine(n){
  const zi=_townState(_townBossCount());
  const zLines=NPC_LINES[zi]||NPC_LINES[0];
  let lines=n.lines||[];
  if(typeof lines[0]==='string' && lines[0].startsWith('z_')){
    const key=lines[0]; lines=(zLines[key]||['...']).slice();
  }
  if(!lines.length) lines=['...'];
  const line=lines[n._lineIdx||0];
  n._lineIdx=((n._lineIdx||0)+1)%lines.length;
  const _nwx = n._wx !== undefined ? n._wx : n.tx*TILE+TILE/2;
  const _nwy = n._wy !== undefined ? n._wy : n.ty*TILE+TILE/2;
  _showDialog(n.label||'???', line, _nwx, _nwy);
}

// ── Simple dialog box (NPC speech) ───────────────────────
let _npcDialogTimer = null;
function _showDialog(name, text, srcX, srcY){
  const ov=document.getElementById('npcSpeechOverlay');
  const nm=document.getElementById('npcSpeechName');
  const tx=document.getElementById('npcSpeechText');
  if(!ov||!nm||!tx) return;
  nm.textContent=name;
  tx.textContent=text;
  ov.classList.add('open');
  _dialogSrcX = (srcX !== undefined) ? srcX : null;
  _dialogSrcY = (srcY !== undefined) ? srcY : null;
  if(_npcDialogTimer) clearTimeout(_npcDialogTimer);
  _npcDialogTimer=setTimeout(()=>{ ov.classList.remove('open'); _dialogSrcX=null; _dialogSrcY=null; }, 8000);
}
function closeNpcDialog(){
  const ov=document.getElementById('npcSpeechOverlay');
  if(ov) ov.classList.remove('open');
  _dialogSrcX=null; _dialogSrcY=null;
  if(_npcDialogTimer){clearTimeout(_npcDialogTimer);_npcDialogTimer=null;}
}

// ══════════════════════════════════════════════════════════
//  TOWN STATE CHANGE FLASH
// ══════════════════════════════════════════════════════════
const STATE_CHANGE_TEXT = [
  null, // state 0 → no flash on first visit
  { main: "The merchants left in the night.\nThe market stands half-empty.", sub: "The First Wave" },
  { main: "Families with children have gone.\nOnly those who cannot leave remain.", sub: "The Second Wave" },
  { main: "The streets are quiet now.\nFive souls hold vigil in the dark.", sub: "The Faithful Few" },
  { main: "The town holds its breath.\nThe Gate hums louder than the wind.", sub: "The Final Descent" }
];

let _lastSeenTownState = -1;
let _stateFlashTimer = null;

function _triggerStateFlash(newState){
  const data = STATE_CHANGE_TEXT[newState];
  if(!data) return;
  const el = document.getElementById('townStateFlash');
  const txt = document.getElementById('tsfText');
  const sub = document.getElementById('tsfSub');
  if(!el||!txt||!sub) return;

  txt.textContent = data.main;
  sub.textContent = data.sub;

  // Reset animations
  el.classList.remove('fading');
  el.offsetHeight; // force reflow
  el.classList.add('active');

  // Auto-dismiss after 10 seconds
  if(_stateFlashTimer) clearTimeout(_stateFlashTimer);
  _stateFlashTimer = setTimeout(()=>{ _dismissStateFlash(); }, 10000);
}

function _dismissStateFlash(){
  if(_stateFlashTimer){ clearTimeout(_stateFlashTimer); _stateFlashTimer=null; }
  const el = document.getElementById('townStateFlash');
  if(!el) return;
  el.classList.add('fading');
  setTimeout(()=>{
    el.classList.remove('active','fading');
  }, 1300);
}

// ══════════════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════════════
function showTownHub(){
  TOWN.blessingUsed=false; TOWN.tavernDrinkUsed=false;
  TOWN.forgeVisited=false; TOWN._sharpenApplied=false;

  // Mark player as in town for save/continue routing
  if(typeof G!=='undefined'&&G) G._inTown=true;

  const isVictory = (typeof G!=='undefined' && G && G._victoryMode);

  const bossesBeaten=_townBossCount();
  const atmosIdx=Math.min(bossesBeaten<=0?0:bossesBeaten<=2?1:bossesBeaten<=4?2:bossesBeaten<=6?3:4, ATMOS.length-1);
  const currentState = _townState(bossesBeaten);
  _tZone=atmosIdx; _tScene='exterior';

  // Spawn player near main road centre (victory mode overrides position later)
  _pl.wx=30*TILE+TILE/2; _pl.wy=26*TILE;
  _pl.facing=2;

  _wanderers=_buildWanderers(bossesBeaten);
  _initPtcls(ATMOS[atmosIdx].fx);
  _initAmbient(currentState);

  if(typeof AUDIO!=='undefined'&&AUDIO.playBGM) AUDIO.playBGM('campfire');
  if(typeof showScreen==='function') showScreen('town');
  if(!isVictory && typeof autoSave==='function') autoSave();

  // ── Town State Change Flash (skip in victory mode) ──
  if(!isVictory){
    if(_lastSeenTownState >= 0 && currentState > _lastSeenTownState && currentState <= 4){
      _triggerStateFlash(currentState);
    }
    _lastSeenTownState = currentState;
  }

  setTimeout(()=>{
    _startTown();
    if(isVictory){
      // Victory mode — gather NPCs at gate and play sequence
      _startVictoryInTown();
    } else {
      // ── Town Introduction — first visit only ──
      _checkTownIntro();
    }
  }, 80);
}

function _checkTownIntro(){
  // Check if intro has already been shown (from G state or slot data)
  let shown = false;
  if(typeof G!=='undefined' && G && G._townIntroShown) shown = true;
  if(!shown && typeof loadSlotData==='function' && typeof activeSaveSlot!=='undefined' && activeSaveSlot){
    const sd = loadSlotData(activeSaveSlot);
    if(sd && sd._townIntroShown) shown = true;
  }
  if(!shown){
    showTownIntro(()=>{
      // Intro finished — resume normal town activity
    });
  }
}

function _startTown(){
  _tc=document.getElementById('townCanvas');
  if(!_tc){console.warn('[Town] canvas not found');return;}

  // Physical canvas = full screen, logical size = physical / scale
  // This makes every tile 3x bigger on screen without changing game logic
  _tc.width  = window.innerWidth;
  _tc.height = window.innerHeight;
  _tc.style.width='100%';
  _tc.style.height='100%';

  _tx=_tc.getContext('2d');
  _tx.imageSmoothingEnabled=false;
  _tx.scale(DRAW_SCALE, DRAW_SCALE);

  for(const k in _keys) delete _keys[k];
  if(_tRAF) cancelAnimationFrame(_tRAF);
  _tRunning=true;
  _tRAF=requestAnimationFrame(_townTick);

  document.removeEventListener('keydown',_kd);
  document.removeEventListener('keyup',_ku);
  document.addEventListener('keydown',_kd);
  document.addEventListener('keyup',_ku);

  // Initial loadout HUD update
  updateTownLoadout();

  // Handle window resize
  window.removeEventListener('resize',_onResize);
  window.addEventListener('resize',_onResize);
}

function _onResize(){
  if(!_tc||!_tx) return;
  _tc.width=window.innerWidth;
  _tc.height=window.innerHeight;
  _tx.imageSmoothingEnabled=false;
  _tx.scale(DRAW_SCALE, DRAW_SCALE);
}

function stopTownEngine(){
  _tRunning=false;
  if(_tRAF){cancelAnimationFrame(_tRAF);_tRAF=null;}
  document.removeEventListener('keydown',_kd);
  document.removeEventListener('keyup',_ku);
  window.removeEventListener('resize',_onResize);
  // Hide loadout HUD
  const hud=document.getElementById('townLoadoutHUD');
  if(hud) hud.innerHTML='';
}

function townEnterDungeon(){
  stopTownEngine();
  if(typeof AUDIO!=='undefined'&&AUDIO.sfx&&AUDIO.sfx.rage) AUDIO.sfx.rage();

  // Always start fresh — preserve only what persists between runs
  if(typeof G!=='undefined'&&G&&G.classId){
    const classId      = G.classId;
    const savedGold    = G.gold || 0;
    const bossDefeated = G.bossDefeated ? [...G.bossDefeated] : [];

    // ── Capture town buffs before reset ──
    const townBuffs = [];
    if(TOWN._sharpenApplied) townBuffs.push({id:'sharpen', icon:'⚒', name:'Sharpened Weapon', desc:'+2 '+getOffensiveStatLabel(G), apply:()=>{addOffensiveStat(G,2);}});
    if(TOWN.blessingUsed && SHRINE_BLESSINGS[classId]){
      const bl = SHRINE_BLESSINGS[classId];
      townBuffs.push({id:'blessing', icon:bl.icon, name:bl.name, desc:bl.desc, apply:bl.apply});
    }

    G = newState(classId);

    // Restore persistent values
    G.gold         = savedGold;
    G.bossDefeated = bossDefeated;

    // Seed bossDefeated from slot data in case it's more up to date
    if(typeof activeSaveSlot!=='undefined'&&activeSaveSlot&&typeof loadSlotData==='function'){
      const slotData=loadSlotData(activeSaveSlot);
      if(slotData&&slotData.bossDefeated){
        slotData.bossDefeated.forEach((v,i)=>{ if(v) G.bossDefeated[i]=true; });
      }
      // Load active chroma for this class from save slot
      if(slotData&&slotData.chromaSelections&&slotData.chromaSelections[classId]){
        G._activeChroma=slotData.chromaSelections[classId];
      }
      // Load lifetime chroma trackers from save slot
      if(slotData){
        G._lifetimeSmites=slotData.lifetimeSmitesPaladin||0;
        G._lifetimeChannels=slotData.lifetimeChannelsCleric||0;
        G._lifetimePoisonsApplied=slotData.lifetimePoisonsDruid||0;
        G._lifetimeWildShapeTurns=slotData.lifetimeWildShapeTurnsDruid||0;
        G._lifetimeFlawlessRogue=slotData.lifetimeFlawlessRogue||0;
        G._lifetimeGoldRogue=slotData.lifetimeGoldRogue||0;
        G._lifetimeObjectivesRanger=slotData.lifetimeObjectivesRanger||0;
        G._markedBossKills=slotData.lifetimeMarkedBossKillsRanger||0;
      }
    }

    // Starter weapon
    const starters={fighter:'sword',wizard:'staff',rogue:'dagger',paladin:'sword',ranger:'bow',barbarian:'sword',cleric:'staff',druid:'staff'};
    const starterItem={...ITEMS.find(i=>i.id===starters[classId])};
    G.equipped.weapon=starterItem;
    if(typeof applyItemStats==='function') applyItemStats(starterItem);

    // Starting potions
    if(typeof addItem==='function') addItem({...ITEMS.find(i=>i.id==='hpPotion'),qty:2});

    // Grace buffs and grace gold
    G.unlockedAchievements = typeof getSlotAchievements==='function' ? getSlotAchievements() : [];
    if(typeof applyGraceBuffs==='function') applyGraceBuffs(classId);
    if(typeof consumePendingGraceGold==='function'){
      const graceGold=consumePendingGraceGold();
      if(graceGold>0){ G.gold+=graceGold; }
    }

    // ── Apply permanent upgrades from Proving Grounds ──
    if(typeof applyPermanentUpgrades==='function') applyPermanentUpgrades(classId);

    // ── Re-apply and store town buffs ──
    G._townBuffs = [];
    townBuffs.forEach(b=>{
      b.apply();
      G._townBuffs.push({icon:b.icon, name:b.name, desc:b.desc});
    });
  }

  if(typeof G!=='undefined'&&G){
    G.runBossDefeated=[false,false,false,false,false,false,false,false];
    G._inTown=false;
    // ── Phase B: Roll zone modifiers for this run ──
    if(typeof rollZoneModifiers==='function') rollZoneModifiers();
  }
  if(typeof travelToZone==='function') travelToZone(0);
}

// ══════════════════════════════════════════════════════════
//  PREPARE FOR DESCENT SCREEN
// ══════════════════════════════════════════════════════════

// Temporary loadout: items player has moved from stash to bring into the run
let _prepareLoadout = [];

function openPrepareScreen(){
  _prepareLoadout = [];
  const ov = document.getElementById('prepareOverlay');
  if(!ov) return;

  // Zone label
  const zoneName = (typeof ZONES!=='undefined'&&G) ? ZONES[Math.min(G.zoneIdx,ZONES.length-1)].name : 'the dungeon';
  const zl = document.getElementById('prepareZoneLabel');
  if(zl) zl.textContent = 'Descending into: '+zoneName;

  _renderPrepareScreen();
  ov.classList.add('open');
}

function closePrepareScreen(){
  // Return all loadout items to stash
  if(_prepareLoadout.length > 0){
    const stash = typeof getStash==='function' ? getStash() : [];
    const merged = [...stash, ..._prepareLoadout];
    if(typeof setStash==='function') setStash(merged);
    _prepareLoadout = [];
  }
  document.getElementById('prepareOverlay')?.classList.remove('open');
}

function changeClassFromPrepare(){
  // Return loadout items to stash, close overlay, go to class screen
  closePrepareScreen();
  window._classFromTown = true;
  window._returnToPrepareAfterClass = true;
  if(typeof renderClassSelect==='function') renderClassSelect();
  if(typeof showScreen==='function') showScreen('class');
}

function _renderPrepareScreen(){
  const rc = {common:'#9a8868',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#9b54bd',legendary:'var(--gold)'};
  const stash = typeof getStash==='function' ? getStash() : [];

  // Stash count
  const stashCount = document.getElementById('prepareStashCount');
  if(stashCount) stashCount.textContent = '('+stash.length+')';

  // Loadout count (excluding the locked starter weapon)
  const loadoutCount = document.getElementById('prepareLoadoutCount');
  const nonStarter = _prepareLoadout.filter(i=>!i._starterLocked);
  if(loadoutCount) loadoutCount.textContent = '('+nonStarter.length+'/18)';

  // Stash grid
  const stashGrid = document.getElementById('prepareStashGrid');
  if(stashGrid){
    if(stash.length === 0){
      stashGrid.innerHTML = '<div class="prepare-empty">Stash is empty.<br>Buy items from Mirela first.</div>';
    } else {
      stashGrid.innerHTML = stash.map((item,i)=>{
        if(!item) return '';
        const col = rc[item.rarity]||'#888';
        const statsStr = Object.entries(item.stats||{}).filter(([k,v])=>v&&k!=='heal').map(([k,v])=>`+${v} ${k}`).join(' ');
        const healStr = item.stats&&item.stats.heal ? `heals ${item.stats.heal}HP` : '';
        return `<div class="prepare-item" onclick="prepMoveToLoadout(${i})" title="${item.name}${statsStr||healStr?' · '+(statsStr||healStr):''}">
          <span class="prepare-item-icon">${item.icon}</span>
          <span class="prepare-item-name" style="color:${col}">${item.name}</span>
          <span class="prepare-item-stat">${statsStr||healStr}</span>
        </div>`;
      }).join('');
    }
  }

  // Loadout grid
  const loadoutGrid = document.getElementById('prepareLoadoutGrid');
  if(loadoutGrid){
    // Starter weapon always shown first, locked
    const starterSlot = G && G.equipped && G.equipped.weapon
      ? `<div class="prepare-item prepare-item-locked" title="Starter weapon — locked in">
          <span class="prepare-item-icon">${G.equipped.weapon.icon}</span>
          <span class="prepare-item-name" style="color:#9a8868">${G.equipped.weapon.name}</span>
          <span class="prepare-item-stat" style="color:var(--dim)">STARTER</span>
        </div>`
      : '';
    const loadoutItems = _prepareLoadout.map((item,i)=>{
      const col = rc[item.rarity]||'#888';
      const statsStr = Object.entries(item.stats||{}).filter(([k,v])=>v&&k!=='heal').map(([k,v])=>`+${v} ${k}`).join(' ');
      const healStr = item.stats&&item.stats.heal ? `heals ${item.stats.heal}HP` : '';
      return `<div class="prepare-item prepare-item-loaded" onclick="prepMoveToStash(${i})" title="Click to return to stash">
        <span class="prepare-item-icon">${item.icon}</span>
        <span class="prepare-item-name" style="color:${col}">${item.name}</span>
        <span class="prepare-item-stat">${statsStr||healStr}</span>
      </div>`;
    }).join('');
    loadoutGrid.innerHTML = starterSlot + loadoutItems;
  }
}

function prepMoveToLoadout(stashIdx){
  // Max 18 non-starter items in loadout
  if(_prepareLoadout.length >= 18){ townFlash('Loadout is full! (18 items max)'); return; }
  const stash = typeof getStash==='function' ? getStash() : [];
  const item = stash[stashIdx];
  if(!item) return;
  // Remove from stash
  if(typeof removeFromStash==='function') removeFromStash(stashIdx);
  _prepareLoadout.push({...item});
  _renderPrepareScreen();
}

function prepMoveToStash(loadoutIdx){
  const item = _prepareLoadout[loadoutIdx];
  if(!item) return;
  _prepareLoadout.splice(loadoutIdx, 1);
  if(typeof addToStash==='function') addToStash({...item});
  _renderPrepareScreen();
}

function doDescend(){
  const loadoutSnapshot = [..._prepareLoadout];
  _prepareLoadout = [];
  document.getElementById('prepareOverlay')?.classList.remove('open');
  stopTownEngine();
  townEnterDungeon(); // resets G to fresh state first
  // Now inject stash items — auto-equip by slot, bump displaced item to inventory
  if(typeof G!=='undefined'&&G&&loadoutSnapshot.length>0){
    for(const item of loadoutSnapshot){
      const slot = item.slot;
      if(slot && G.equipped && slot in G.equipped){
        const displaced = G.equipped[slot];
        if(displaced){
          if(typeof removeItemStats==='function') removeItemStats(displaced);
          const emptyIdx = G.inventory.findIndex(s=>s===null);
          if(emptyIdx !== -1) G.inventory[emptyIdx] = {...displaced};
        }
        G.equipped[slot] = {...item};
        if(typeof applyItemStats==='function') applyItemStats(item);
      } else {
        const emptyIdx = G.inventory.findIndex(s=>s===null);
        if(emptyIdx !== -1) G.inventory[emptyIdx] = {...item};
      }
    }
  }
}

// ── Utility ───────────────────────────────────────────────
function _rrect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

// ══════════════════════════════════════════════════════════
//  BUILDING DIALOGS (Rook, Seraphine, Aldric, Malachar)
// ══════════════════════════════════════════════════════════
let _activeDlg=null;
// ── Persistent Loadout HUD ─────────────────────────────────
function updateTownLoadout(){
  const el = document.getElementById('townLoadoutHUD');
  if(!el) return;
  if(!G || !G.classId){
    el.innerHTML = `<div style="text-align:center;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(200,168,75,0.15);">
      <div style="font-size:14px;color:rgba(200,168,75,0.4);letter-spacing:3px;">⚔ LOADOUT</div>
    </div>
    <div style="font-size:11px;color:#444;text-align:center;padding:12px 0;line-height:2.2;">Prepare for your descent.<br>Buffs &amp; gear will appear here.</div>`;
    return;
  }
  const cid = G.classId;
  const ci = {fighter:'⚔',wizard:'📖',rogue:'🗡',paladin:'✝',ranger:'🏹',barbarian:'🩸',cleric:'☀',druid:'🌿'}[cid]||'?';
  const cn = cid.charAt(0).toUpperCase()+cid.slice(1);

  const row = (icon,label,val,col) => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
    <span style="font-size:18px;width:22px;text-align:center;flex-shrink:0;">${icon}</span>
    <span style="font-size:10px;color:#999;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${label}</span>
    ${val?`<span style="font-size:10px;color:${col||'#c8a84b'};flex-shrink:0;">${val}</span>`:''}
  </div>`;
  const emptyRow = (text) => `<div style="font-size:10px;color:#3a3a3a;padding:4px 0 4px 30px;font-style:italic;">${text}</div>`;
  const secHead = (label,col) => `<div style="font-size:10px;color:${col||'#555'};letter-spacing:2px;margin-top:10px;margin-bottom:4px;">${label}</div>`;

  let html = '';

  // ── Header ──
  html += `<div style="text-align:center;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(200,168,75,0.15);">
    <div style="font-size:14px;color:#c8a84b;letter-spacing:3px;">⚔ LOADOUT</div>
  </div>`;

  // ═══════════════════════════════════════
  // 1. PROVING GROUNDS
  // ═══════════════════════════════════════
  html += secHead('🏛 UPGRADES','#c08040');
  const slot = typeof activeSaveSlot!=='undefined' ? activeSaveSlot : null;
  const pu = slot && typeof getPermanentUpgrades==='function' ? getPermanentUpgrades(slot) : {};
  let hasUpgrades = false;
  PERMANENT_UPGRADES.forEach(u => {
    const lvl = pu[u.id]||0;
    if(lvl <= 0) return;
    if(u.forClass && u.forClass !== cid) return;
    hasUpgrades = true;
    const pips = Array.from({length:u.maxLvl}, (_,i) => i<lvl ? '<span style="color:#c08040">●</span>' : '<span style="color:#332a1a">○</span>').join('');
    html += row(u.icon, u.name, pips, '#c08040');
  });
  if(!hasUpgrades) html += emptyRow('Visit the Proving Grounds');

  // ═══════════════════════════════════════
  // 2. GRACES
  // ═══════════════════════════════════════
  html += secHead('✨ GRACES','#b06ad4');
  const graces = typeof getEquippedGraces==='function' ? getEquippedGraces(cid) : [];
  let hasGraces = false;
  graces.forEach(g => {
    if(!g) return;
    hasGraces = true;
    const rc = GRACE_RARITY_COLORS[g.rarity]||'#888';
    const short = Object.entries(g.stats).map(([k,v])=>'+'+v+' '+k.substring(0,3)).join(' ');
    html += row(g.icon, g.name, short, rc);
    if(g.passive && g.passive.desc){
      html += `<div style="padding:3px 0 3px 30px;font-size:10px;color:var(--gold);line-height:1.6;">★ ${g.passive.desc}</div>`;
    }
  });
  if(!hasGraces) html += emptyRow('Equip graces at the Vault');

  // ═══════════════════════════════════════
  // 3. TOWN BUFFS
  // ═══════════════════════════════════════
  html += secHead('🏘 TOWN','#60a0d0');
  let hasTown = false;
  if(TOWN._sharpenApplied){
    hasTown = true;
    html += row('⚒', 'Sharpened', '+2 '+(typeof getOffensiveStatLabel==='function'&&G?getOffensiveStatLabel(G):'ATK'), '#ff7030');
  }
  if(TOWN.blessingUsed && SHRINE_BLESSINGS[cid]){
    hasTown = true;
    const bl = SHRINE_BLESSINGS[cid];
    html += row('⛪', bl.name, '', '#a0c4ff');
  }
  if(!hasTown){
    if(!TOWN._sharpenApplied) html += emptyRow('⚒ Forge — sharpen weapon');
    if(!TOWN.blessingUsed)    html += emptyRow('⛪ Shrine — receive blessing');
  }

  // ═══════════════════════════════════════
  // 4. SET BONUSES
  // ═══════════════════════════════════════
  if(typeof SET_BONUSES!=='undefined' && G.activeSets){
    const activeSets = Object.entries(G.activeSets).filter(([sid,count])=>count>=2 && SET_BONUSES[sid]);
    if(activeSets.length > 0){
      html += secHead('✦ SETS','#d0a040');
      activeSets.forEach(([sid,count])=>{
        const sd = SET_BONUSES[sid];
        for(let t=2;t<=3;t++){
          if(count>=t && sd.bonuses[t]){
            html += row('✦', sd.name+' ('+t+'pc)', '', '#d0a040');
          }
        }
      });
    }
  }

  el.innerHTML = html;
}

function townOpenDialog(id){
  _activeDlg=id;
  const ov=document.getElementById('townDialogOverlay');
  const ti=document.getElementById('townDialogTitle');
  const co=document.getElementById('townDialogContent');
  if(!ov) return;
  const titles={tavern:'🍺 The Rusted Flagon',temple:'⛪ Shrine of Seraphine',forge:"⚒ Aldric's Forge",malachar:"📚 Malachar's Study",notice:'📋 Notice Board','mirela_shop':"🛍 Mirela's Goods",stash:'📦 Your Stash',upgrades:'🏛 The Proving Grounds'};
  ti.textContent=titles[id]||id;
  if(id==='tavern')        co.innerHTML=_dlgTavern();
  if(id==='temple')        co.innerHTML=_dlgTemple();
  if(id==='forge')         co.innerHTML=_dlgForge();
  if(id==='malachar')      co.innerHTML=_dlgMalachar();
  if(id==='notice')        co.innerHTML=_dlgNotice();
  if(id==='mirela_shop')   co.innerHTML=_dlgMirelaShop();
  if(id==='stash')         co.innerHTML=_dlgStash();
  if(id==='upgrades')      co.innerHTML=_dlgUpgrades();
  ov.classList.toggle('mirela-open', id==='mirela_shop');
  ov.classList.add('open');
  // Auto-hide loadout HUD so it doesn't overlap the dialog
  const lhud=document.getElementById('townLoadoutHUD');
  if(lhud) lhud.classList.add('loadout-hidden');
  // Hide pause button when Mirela's fullscreen shop is open
  const pb=document.getElementById('townPauseBtn');
  if(pb) pb.style.display = id==='mirela_shop' ? 'none' : '';
}
function townCloseDialog(){ _activeDlg=null; const _ov=document.getElementById('townDialogOverlay'); if(_ov){_ov.classList.remove('open');_ov.classList.remove('mirela-open');}
  const lhud=document.getElementById('townLoadoutHUD');
  if(lhud) lhud.classList.remove('loadout-hidden');
  const pb=document.getElementById('townPauseBtn');
  if(pb) pb.style.display='';
}

// ── NPC Service Data ──────────────────────────────────────
const SHRINE_BLESSINGS={
  fighter:{icon:'⚔',name:'Battle Fury',     desc:'Crit range expanded by 2.',        apply:()=>{G.critRange=Math.max(16,(G.critRange||20)-2);}},
  wizard: {icon:'📖',name:'Arcane Surge',    desc:'+1 to each spell slot level.',     apply:()=>{if(G.spellSlots)Object.keys(G.spellSlots).forEach(k=>G.spellSlots[k]++);}},
  rogue:  {icon:'🗡',name:"Shadow's Edge",   desc:'First strike is a guaranteed crit.',apply:()=>{G._townBlessingFirstCrit=true;}},
  paladin:{icon:'✝', name:'Divine Favor',   desc:'Lay on Hands pool doubled.',       apply:()=>{G.layOnHandsPool=(G.layOnHandsPool||5)*2;}},
  ranger: {icon:'🏹',name:"Predator's Mark", desc:"Hunter's Mark costs no concentration.",apply:()=>{G._townBlessingFreeHM=true;}},
  barbarian:{icon:'🩸',name:'Blood Rite',    desc:'Rage lasts 2 extra rounds.',       apply:()=>{G._townBlessingRageBonus=2;}},
  cleric: {icon:'☀', name:'Holy Renewal',   desc:'Channel Divinity recharges on short rest.',apply:()=>{G._townBlessingCDRecharge=true;}},
  druid:  {icon:'🌿',name:"Nature's Grace",  desc:'Wild Shape can be entered as a bonus action.',apply:()=>{G._townBlessingWildFree=true;}},
};
const ROOK_ZONES=[
  ["I scouted those woods once. Once.","The Thornwarden's roots move underground. Watch your footing.","It slammed Kareth into a tree so hard we buried him and the tree. ...Pour me another?"],
  ["Grakthar. Yeah. I knew men who served under him — before.","His Bellow broke three men's nerves. WIS save, they said. In practice you just ran.","He still thinks the war's going. Don't try to reason. Just fight."],
  ["Half the market packed up last night. Can't blame them.","Something's pulling the darkness up from below. I can feel it in the floorboards.","That horn's been sounding for three days. You hear it too, right?"],
  ["It's just us now. The ones who couldn't leave.","I've kept that stool empty for thirty years. Don't know why. Feels important.","Whatever you're doing down there — it's working. Or it's making things worse. Either way, keep going."],
  ["I dreamed about you last night. You were standing at the Gate. You looked... old.","I don't know what's at the bottom. But I know you're meant to find it.","Come back, yeah? I'll keep the stool."]
];
// One line per boss — shown when that boss is the highest one defeated this save
const ROOK_BOSS_KILL_LINES=[
  "Thornwarden's down, then. Good. Those roots were getting philosophical.",
  "Grakthar. Didn't think anyone could still reach him. Apparently I was wrong.",
  "Vexara's brand — I can still see the shape of it on you. You wore it. You didn't break.",
  "Nethrix. The Devourer. Don't know what that means exactly. I know it sounds bad and you're still walking.",
  "Zareth. You read the charge coming, held your nerve, hit back. That's the whole fight, isn't it.",
  "Valdris the Unbroken. Broken now. I'll drink to that.",
  "Auranthos the Blind God. I don't know what a blind god sees at the end. You do now.",
  "The Hollow Empress. Whatever she was holding down there — whatever she'd swallowed — it's done."
];
const ROOK_CLASS={fighter:"Fighter, yeah? Good. Someone who can take a hit.",wizard:"Wizard. Try not to blow up the tavern. Last one did.",rogue:"Rogue, eh. I'm counting my coinpurse when you leave.",paladin:"Paladin. You people never buy the cheap rounds.",ranger:"Ranger! Those wolves aren't pets, by the way.",barbarian:"Sit anywhere — just not that stool. It's still not quite right.",cleric:"Cleric. Heal me while you're at it? My knee's been a nightmare.",druid:"Don't turn into anything in here. Bear in the beer cellar. Long story."};
const SERA_ZONES=[
  "The woods remember old blood. Let the Shrine cleanse what clings to you.",
  "The Outpost is a place of unfinished things. Carry the light in.",
  "The Shrine fire has been burning without oil for three days. I do not understand it. But I trust it.",
  "The others have gone. The fire burns gold now. I think it is waiting for something.",
  "Whatever you find at the bottom — know that the Shrine burned for you. It always did."
];
const SERA_CLASS={fighter:"Your strength is your shield. The Shrine blesses the body that never breaks.",wizard:"The Shrine welcomes minds as well as swords.",rogue:"You move like someone who has had to. The Shrine does not judge.",paladin:"The light in you is genuine. The Shrine recognises its own.",ranger:"You carry the wild in you — the blessing will anchor you.",barbarian:"Fury is a kind of prayer too, if directed rightly.",cleric:"A fellow servant. I'll simply add my voice to yours.",druid:"The old ways and the Shrine's ways are older than their argument."};
const ALDRIC_ZONES=[
  "These woods'll dull a blade faster than any whetstone.",
  "Undead rust iron from the inside out. Enchanted gear holds better.",
  "I've been forging something for weeks. Don't know who it's for yet. Feels like I'm waiting for the right hands.",
  "My apprentice left with the second wave. I'm still here. The anvil won't let me leave.",
  "Take this. I finished it last night. I think... I think it was always meant for you."
];
const ALDRIC_CLASS={fighter:"Good build. Keep the sword oiled — blood dries fast.",wizard:"Staff reinforcements. Mages keep breaking them.",rogue:"Short blade with a hollow handle — you'll know what it's for.",paladin:"Divine-blessed steel holds an edge longer.",ranger:"Broadhead tips that punch through chitin.",barbarian:"You're going to destroy whatever I give you. Take the cheap stuff.",cleric:"Holy-water tempered chainmail if you need it.",druid:"Most druids just grow thorns. But welcome."};
const MALACHAR_ZONES=[
  "The Whispering Woods are older than this town. Something grew there before trees knew how.",
  "The garrison watched the east. The incursion came from below.",
  "I found your name in a document three hundred years old. Redacted from every official record. I am afraid of what it means.",
  "The Gate inscription keeps changing. The latest addition is a name I can almost read. I am writing everything down.",
  "One line left to translate. When you come back — I will read it to you."
];
const MALACHAR_CLASS={fighter:"Ah, a warrior. Direct. Good.",wizard:"A fellow practitioner! Your posture suggests Evocation.",rogue:"The most interesting documents were stolen by rogues. I'm simply noting.",paladin:"Complicated feelings about holy orders. You personally seem fine.",ranger:"Rangers are underestimated. The natural world has more tactical info than any library.",barbarian:"I once argued berserkers were the original philosophers. I stand by it.",cleric:"Which deity? Don't tell me — let me guess from your sigil.",druid:"Druids always make me feel I've wronged a plant."};
// Per-legendary-item reactions — keyed by item ID
const MALACHAR_LEGENDARY_LINES={
  glacialCrown:     "The Glacial Crown of Valdris. Three manuscripts said it was lost to the ice. Evidently the ice disagreed.",
  godslayerBlade:   "That blade... the Godslayer. I've read every account of it. They all end badly for everyone except the blade.",
  voidcrownOfMalvaris:"Malvaris's Voidcrown. She wore it for two hundred years. The fact that you have it means she doesn't. I have many questions.",
  shardOfEternity:  "The Shard of Eternity. I wrote my thesis on why it couldn't exist. I'm prepared to revise my conclusions.",
  wraithbane:       "Wraithbane. It was forged to kill something specific. I'd very much like to know if it succeeded.",
  tombwardenSeal:   "The Tombwarden's Seal. Ancient. Pre-dates the dungeon, if my dating is right. It shouldn't be in circulation.",
  seraphimWings:    "Seraphim's Mantle. The manuscripts say it was worn by the last of the Celestials. It was supposedly unmakeable.",
};
const MALACHAR_LEGENDARY_DEFAULT="That item — I don't recognise it from any catalogue I own. That's either very bad or very interesting.";

function _dlgTavern(){
  const cid=G?G.classId:'fighter',zi=Math.min(_townState(_townBossCount()),ROOK_ZONES.length-1);
  const baseLines=ROOK_ZONES[zi]||[];
  // Inject a boss-specific line for the highest boss killed this save
  const lastBoss=G&&G.bossDefeated?G.bossDefeated.reduce((hi,v,i)=>v?i:hi,-1):-1;
  const bossLine=lastBoss>=0?ROOK_BOSS_KILL_LINES[lastBoss]:null;
  const lines=bossLine?[bossLine,...baseLines]:baseLines;
  const rHtml=lines.map((l,i)=>`<div class="td-line${i===0?' active':''}" onclick="this.closest('.td-lines').querySelectorAll('.td-line').forEach(x=>x.classList.remove('active'));this.classList.add('active')">${i===0?'🗣':'💬'} ${l}</div>`).join('');
  const drink=TOWN.tavernDrinkUsed?`<div class="td-used">🍺 You've had your drink.</div>`:`<button class="td-btn" onclick="townBuyDrink()">🍺 Buy Rook a drink (5g) — hear a rumor</button>`;
  return `<div class="td-portrait">🍺</div><div class="td-name">Rook <span class="td-sub">Ex-soldier. Permanently at the bar.</span></div><div class="td-greeting">"${ROOK_CLASS[cid]||'Welcome.'}"</div><div class="td-lines">${rHtml}</div><div style="margin-top:10px">${drink}</div>`;
}
function _dlgTemple(){
  const cid=G?G.classId:'fighter',zi=Math.min(_townState(_townBossCount()),SERA_ZONES.length-1);
  const bl=SHRINE_BLESSINGS[cid];
  const bHtml=TOWN.blessingUsed?`<div class="td-used">✝ Blessing granted.</div>`:bl?`<div class="td-blessing-card"><div class="td-blessing-icon">${bl.icon}</div><div><div class="td-blessing-name">${bl.name}</div><div class="td-blessing-desc">${bl.desc}</div></div></div><button class="td-btn td-btn-holy" onclick="townReceiveBlessing()">✝ Receive Blessing</button>`:'';
  const healHtml=G&&G.hp<G.maxHp?`<button class="td-btn" style="margin-top:8px" onclick="townFullHeal()">💖 Pray for healing (full HP)</button>`:`<div class="td-used" style="margin-top:8px">💖 You are at full health.</div>`;
  // Shrine fire glow shifts as zones deepen: cool white → amber → gold → deep red → radiant gold
  const shrineGlow=['rgba(200,215,255,0.7)','rgba(255,210,120,0.7)','rgba(255,150,50,0.75)','rgba(200,60,20,0.8)','rgba(200,168,75,1)'][zi];
  return `<div class="td-portrait" style="filter:drop-shadow(0 0 10px ${shrineGlow}) drop-shadow(0 0 4px ${shrineGlow})">⛪</div><div class="td-name">Seraphine <span class="td-sub">Shrine Keeper</span></div><div class="td-greeting">"${SERA_CLASS[cid]||'Welcome.'}"</div><div class="td-zoneline">"${SERA_ZONES[zi]}"</div>${bHtml}${healHtml}`;
}
function _dlgForge(){const cid=G?G.classId:'fighter',zi=Math.min(_townState(_townBossCount()),ALDRIC_ZONES.length-1);const hasMats=G&&G.inventory&&G.inventory.some(i=>i&&i.type==='material');const sell=hasMats?`<button class="td-btn" onclick="townSellMaterials()">💰 Sell all materials</button>`:`<div class="td-used">No materials to sell.</div>`;const offLabel=typeof getOffensiveStatLabel==='function'&&G?getOffensiveStatLabel(G):'ATK';const sharpen=TOWN.forgeVisited?`<div class="td-used">⚒ Already sharpened.</div>`:`<button class="td-btn" onclick="townSharpenWeapon()">⚒ Sharpen weapon — +2 ${offLabel} (15g)</button>`;return `<div class="td-portrait">⚒</div><div class="td-name">Aldric <span class="td-sub">Blacksmith</span></div><div class="td-greeting">"${ALDRIC_CLASS[cid]||'Need something forged?'}"</div><div class="td-zoneline">"${ALDRIC_ZONES[zi]}"</div><div style="margin-top:12px">${sharpen}<div style="margin-top:8px">${sell}</div></div>`;}
function _dlgMalachar(){
  const cid=G?G.classId:'fighter',zi=Math.min(_townState(_townBossCount()),MALACHAR_ZONES.length-1);
  const donations=(typeof getWizardDonations==='function')?getWizardDonations():0;
  const tier=(typeof getShopTier==='function')?getShopTier():1;
  const tiers=['Standard','Rare','Legendary'];
  const donate=tier<3?`<button class="td-btn" onclick="townDonateMalachar(100)">📚 Donate 100g for research access</button>`:`<div class="td-used">📚 Full catalogue unlocked.</div>`;
  // Legendary item acknowledgment
  const legItem=G&&G.equipped?Object.values(G.equipped).find(it=>it&&it.rarity==='legendary'):null;
  const legHtml=legItem?`<div class="td-zoneline" style="color:#b07830;margin-top:6px">"${MALACHAR_LEGENDARY_LINES[legItem.id]||MALACHAR_LEGENDARY_DEFAULT}"</div>`:'';
  return `<div class="td-portrait">📚</div><div class="td-name">Malachar the Grey <span class="td-sub">Scholar</span></div><div class="td-greeting">"${MALACHAR_CLASS[cid]||'Ah.'}"</div><div class="td-zoneline">"${MALACHAR_ZONES[zi]}"</div>${legHtml}<div class="td-donate-info">Donated: <span style="color:var(--gold)">${donations}g</span> · Tier: <span style="color:var(--gold)">${tiers[tier-1]||'Standard'}</span></div><div style="margin-top:10px">${donate}</div>`;
}
function _dlgNotice(){const zi=G?G.zoneIdx:0;const tips={fighter:"Don't burn Relentless early.",wizard:"Spell slot economy is everything.",rogue:"Exploit every Advantage. Sneak Attack ends fights early.",paladin:"Smite on crits — always.",ranger:"Hunter's Mark is your engine.",barbarian:"Rage before the first hit.",cleric:"Channel Divinity often beats spells.",druid:"Wild Shape is a second life bar."};const tease=["🍄 Strange fungi near the old forest path. Collectors or idiots only.","🏛 A vault beneath the Outpost road. Loot unclaimed."];const zone=typeof ZONES!=='undefined'?ZONES[Math.min(zi,ZONES.length-1)]:null;let html='';if(zone)html+=`<div class="nb-notice nb-warning"><div class="nb-tag">⚠ DUNGEON REPORT</div><div class="nb-title">Threat: ${zone.name}</div><div class="nb-desc">Scouts report ${zone.kills} contacts before the zone commander.</div></div>`;if(zi<tease.length)html+=`<div class="nb-notice nb-rumor"><div class="nb-tag">📌 RUMOR</div><div class="nb-desc">${tease[zi]}</div></div>`;const cid=G?G.classId:null;if(cid&&tips[cid])html+=`<div class="nb-notice nb-tip"><div class="nb-tag">💡 TIP</div><div class="nb-desc">${tips[cid]}</div></div>`;return html||'<div class="td-used">No current notices.</div>';}

function townBuyDrink(){if(!G||G.gold<5){townFlash('Not enough gold!');return;}G.gold-=5;TOWN.tavernDrinkUsed=true;if(typeof log==='function')log("🍺 Rook: 'Generous soul.'",'l');if(typeof renderAll==='function')renderAll();document.getElementById('townDialogContent').innerHTML=_dlgTavern();setTimeout(()=>{const ls=document.querySelectorAll('.td-line');ls.forEach(l=>l.classList.remove('active'));if(ls[ls.length-1])ls[ls.length-1].classList.add('active');},80);}
function townReceiveBlessing(){if(TOWN.blessingUsed||!G)return;const bl=SHRINE_BLESSINGS[G.classId];if(!bl)return;TOWN.blessingUsed=true;bl.apply();if(typeof log==='function')log(`✝ Seraphine: "${bl.name} — ${bl.desc}"`,'l');document.getElementById('townDialogContent').innerHTML=_dlgTemple();updateTownLoadout();}
function townFullHeal(){if(!G)return;const h=G.maxHp-G.hp;G.hp=G.maxHp;if(typeof log==='function')log('💖 Shrine restores your wounds. (+'+h+' HP)','l');if(typeof renderAll==='function')renderAll();document.getElementById('townDialogContent').innerHTML=_dlgTemple();}
function townSharpenWeapon(){if(!G||G.gold<15){townFlash('Need 15g!');return;}if(TOWN.forgeVisited)return;G.gold-=15;addOffensiveStat(G,2);TOWN._sharpenApplied=true;TOWN.forgeVisited=true;const lbl=typeof getOffensiveStatLabel==='function'?getOffensiveStatLabel(G):'ATK';if(typeof log==='function')log('⚒ Aldric sharpens your weapon. (+2 '+lbl+')','l');if(typeof renderAll==='function')renderAll();document.getElementById('townDialogContent').innerHTML=_dlgForge();updateTownLoadout();}
function townSellMaterials(){if(!G)return;let g=0,c=0;G.inventory=G.inventory.map(item=>{if(item&&item.type==='material'){g+=(item.value||5);c++;return null;}return item;});G.gold+=g;G.totalGold+=g;if(typeof log==='function')log(`⚒ Aldric bought ${c} material${c!==1?'s':''} for ${g}g.`,'l');if(typeof renderAll==='function')renderAll();document.getElementById('townDialogContent').innerHTML=_dlgForge();}
function townDonateMalachar(amount){if(!G||G.gold<amount){townFlash(`Need ${amount}g!`);return;}if(typeof cfDonateWizard==='function')cfDonateWizard(amount);else G.gold-=amount;if(typeof renderAll==='function')renderAll();document.getElementById('townDialogContent').innerHTML=_dlgMalachar();}
function townFlash(msg){const el=document.getElementById('townFlash');if(!el)return;el.textContent=msg;el.classList.add('visible');setTimeout(()=>el.classList.remove('visible'),2200);}

// ══════════════════════════════════════════════════════════
//  VARETH'S PROVING GROUNDS — Permanent Upgrade Shop
// ══════════════════════════════════════════════════════════
const VARETH_CLASS={
  fighter:"A soldier's stance. Good. Discipline wins more fights than strength.",
  wizard:"A mind is the sharpest weapon — but a prepared mind is sharper still.",
  rogue:"Speed without preparation is just running. Let me show you focus.",
  paladin:"Your oath gives you purpose. Let me give you the edge to fulfill it.",
  ranger:"The wild teaches patience. I teach everything else.",
  barbarian:"Raw power brought you here. Refined power will bring you back.",
  cleric:"Faith heals, but steel protects. Let me help with the steel part.",
  druid:"Nature's strength is vast. Let me help you carry more of it with you."
};
const VARETH_ZONES=["These woods test newcomers. Let me make sure you're not one.","The Outpost claimed better warriors than you. Preparation is the difference.","The deeper you go, the more every small advantage matters.","At this depth, there are no second chances. Only readiness."];

function _dlgUpgrades(){
  const cid=G?G.classId:'fighter';
  const zi=Math.min(G?G.zoneIdx:0,VARETH_ZONES.length-1);
  const midRun = typeof G !== 'undefined' && G && G.classId;
  const gold = midRun ? G.gold : (typeof getPersistentGold==='function' ? getPersistentGold() : 0);
  const goldLabel = midRun ? 'Run Gold' : 'Town Gold';
  const ups = typeof getPermanentUpgrades==='function' ? getPermanentUpgrades() : {};

  function upgradeCard(u, isClass){
    const curLvl = ups[u.id]||0;
    const maxed = curLvl >= u.maxLvl;
    const cost = maxed ? 0 : (typeof getUpgradeCost==='function' ? getUpgradeCost(u.id, curLvl) : Infinity);
    const canBuy = !maxed && gold >= cost;
    const isMyClass = isClass && u.forClass === cid;

    // Progress bar
    const pips = Array.from({length:u.maxLvl},(_,i)=>`<span class="pg-pip ${i<curLvl?'pg-pip-on':''}">${i<curLvl?'●':'○'}</span>`).join('');

    return `<div class="pg-card ${maxed?'pg-card-maxed':canBuy?'pg-card-buy':'pg-card-dim'} ${isMyClass?'pg-card-mine':''}" 
      onclick="${canBuy?`townBuyUpgrade('${u.id}')`:''}" 
      title="${maxed?'Maxed out':canBuy?'Click to purchase':'Not enough gold'}">
      <div class="pg-card-top">
        <div class="pg-card-icon">${u.icon}</div>
        ${isMyClass?'<div class="pg-card-badge">YOUR CLASS</div>':''}
        ${maxed?'<div class="pg-card-maxed-badge">MAXED</div>':''}
      </div>
      <div class="pg-card-name">${u.name}</div>
      <div class="pg-card-desc">${u.desc}</div>
      <div class="pg-card-pips">${pips} <span class="pg-card-lvl">${curLvl}/${u.maxLvl}</span></div>
      ${maxed
        ?'<div class="pg-card-cost-maxed">✓ Complete</div>'
        :`<div class="pg-card-cost ${canBuy?'':'pg-card-cost-dim'}">🪙 ${cost}</div>`
      }
    </div>`;
  }

  const universals = typeof PERMANENT_UPGRADES!=='undefined' ? PERMANENT_UPGRADES.filter(u=>u.category==='universal') : [];
  const masteries = typeof PERMANENT_UPGRADES!=='undefined' ? PERMANENT_UPGRADES.filter(u=>u.category==='class') : [];

  // Sort masteries: your class first
  const sortedMasteries = [...masteries].sort((a,b)=>{
    if(a.forClass===cid && b.forClass!==cid) return -1;
    if(b.forClass===cid && a.forClass!==cid) return 1;
    return 0;
  });

  return `
    <div class="td-portrait">🏛</div>
    <div class="td-name">Vareth <span class="td-sub">Retired Delver · Upgrade Master</span></div>
    <div class="td-greeting">"${VARETH_CLASS[cid]||'Welcome.'}"</div>
    <div class="td-zoneline">"${VARETH_ZONES[zi]}"</div>
    <div class="pg-topbar">
      <div class="pg-section-label">PERMANENT UPGRADES</div>
      <div class="pg-gold">${goldLabel}: <span class="pg-gold-val">🪙 ${gold}</span></div>
    </div>
    <div class="pg-section">
      <div class="pg-section-sub">UNIVERSAL</div>
      <div class="pg-card-grid">${universals.map(u=>upgradeCard(u,false)).join('')}</div>
    </div>
    <div class="pg-section">
      <div class="pg-section-sub">CLASS MASTERY</div>
      <div class="pg-card-grid">${sortedMasteries.map(u=>upgradeCard(u,true)).join('')}</div>
    </div>
    <div class="pg-footer">Upgrades persist across all runs on this save slot.</div>`;
}

function townBuyUpgrade(upgradeId){
  if(typeof purchaseUpgrade!=='function') return;
  const ok = purchaseUpgrade(upgradeId);
  if(!ok){ townFlash('Not enough gold!'); return; }
  if(typeof AUDIO!=='undefined'&&AUDIO.sfx&&AUDIO.sfx.gold) AUDIO.sfx.gold();
  townFlash('Upgrade purchased!');
  if(typeof renderAll==='function' && typeof G!=='undefined' && G) renderAll();
  document.getElementById('townDialogContent').innerHTML = _dlgUpgrades();
  updateTownLoadout();
}

// ══════════════════════════════════════════════════════════
//  MIRELA'S SHOP
// ══════════════════════════════════════════════════════════

function _dlgMirelaShop(){
  const midRun = typeof G !== 'undefined' && G && G.classId;
  const gold = midRun ? G.gold : (typeof getPersistentGold==='function' ? getPersistentGold() : 0);
  const goldLabel = midRun ? 'Run Gold' : 'Town Gold';
  const _disc = midRun && G._shopDiscount ? G._shopDiscount : (typeof getPermanentUpgrades==='function' ? (getPermanentUpgrades().shop_discount||0)*0.05 : 0);
  function _mirelaPrice(val){ return Math.floor(val * (1 - _disc)); }

  const SHOP_ITEMS = (typeof ITEMS!=='undefined' ? ITEMS : []).filter(i=>{
    if(i.type==='material') return false;
    if(i.rarity==='epic'||i.rarity==='legendary') return false;
    if(i.set) return false;
    if(i.townOnly) return true;
    if(i.type==='consumable' && (i.rarity==='common'||i.rarity==='uncommon')) return true;
    if((i.rarity==='common'||i.rarity==='uncommon') && i.slot) return true;
    return false;
  });

  const rc={common:'#9a8868',uncommon:'#6ab04c',rare:'#4a90d9'};
  const stash = typeof getStash==='function' ? getStash() : [];
  const stashFull = stash.length >= 40;

  // Group items by category
  const cats = [
    {key:'weapon',label:'Weapons',icon:'⚔️'},
    {key:'armor',label:'Armor',icon:'🛡'},
    {key:'offhand',label:'Offhands',icon:'🛡'},
    {key:'accessory',label:'Accessories',icon:'💍'},
    {key:'consumable',label:'Consumables',icon:'🧪'},
  ];
  const grouped = {};
  SHOP_ITEMS.forEach(item=>{
    const cat = item.type==='consumable'?'consumable':(item.slot||item.type||'other');
    if(!grouped[cat]) grouped[cat]=[];
    grouped[cat].push(item);
  });

  function cardHTML(item){
    const price = _mirelaPrice(item.value);
    const canAfford = gold >= price;
    const col = rc[item.rarity]||'#888';
    const statsArr = Object.entries(item.stats||{}).filter(([k,v])=>v&&k!=='heal').map(([k,v])=>`+${v} ${k}`);
    const healStr = item.stats&&item.stats.heal ? `heals ${item.stats.heal} HP` : '';
    const desc = statsArr.join(' · ') || healStr || '';
    const buyable = canAfford && !stashFull;
    const discStr = _disc>0 ? `<span class="ms-card-orig">${item.value}</span>` : '';
    return `<div class="ms-card ${buyable?'ms-card-buy':'ms-card-dim'}" onclick="${buyable?`townBuyFromMirela('${item.id}')`:''}" title="${!canAfford?'Not enough gold':stashFull?'Stash full':'Click to buy'}">
      <div class="ms-card-icon">${item.icon}</div>
      <div class="ms-card-body">
        <div class="ms-card-name" style="color:${col}">${item.name}</div>
        <div class="ms-card-stats">${desc}</div>
      </div>
      <div class="ms-card-price ${canAfford?'':'ms-card-poor'}">${discStr}🪙${price}</div>
    </div>`;
  }

  let sectionsHTML = '';
  cats.forEach(cat=>{
    const items = grouped[cat.key];
    if(!items || !items.length) return;
    sectionsHTML += `<div class="ms-section">
      <div class="ms-section-label">${cat.icon} ${cat.label}</div>
      <div class="ms-card-grid">${items.map(cardHTML).join('')}</div>
    </div>`;
  });
  // Catch anything not in a known category
  Object.keys(grouped).forEach(k=>{
    if(cats.find(c=>c.key===k)) return;
    const items = grouped[k];
    if(!items||!items.length) return;
    sectionsHTML += `<div class="ms-section">
      <div class="ms-section-label">📦 Other</div>
      <div class="ms-card-grid">${items.map(cardHTML).join('')}</div>
    </div>`;
  });

  const greetingZi = typeof G!=='undefined'&&G ? Math.min(G.zoneIdx||0,2) : 0;
  const greetings = [
    "Rope, torches, rations. Everything a sensible person takes in. The sensible ones still don't come back.",
    "Sold out of bandages three times this week. I keep ordering more.",
    "Whatever you need going in — I'll find it."
  ];

  const stashPips = stash.length > 0
    ? stash.map(s=>`<span class="ms-stash-pip" title="${s.name}" style="color:${rc[s.rarity]||'#888'}">${s.icon}</span>`).join('')
    : '<span class="ms-stash-empty">Empty</span>';

  return `
    <div class="td-portrait">🛍</div>
    <div class="td-name">Mirela <span class="td-sub">Merchant</span></div>
    <div class="td-greeting">"${greetings[greetingZi]}"</div>
    <div class="ms-topbar">
      <div class="ms-gold">${goldLabel}: <span class="ms-gold-val">🪙 ${gold}</span></div>
      <div class="ms-stash-bar">📦 ${stash.length}/40 ${stashPips}</div>
    </div>
    ${sectionsHTML}`;
}

function townBuyFromMirela(itemId){
  if(typeof ITEMS==='undefined') return;
  const item = ITEMS.find(i=>i.id===itemId);
  if(!item) return;

  const midRun = typeof G !== 'undefined' && G && G.classId;
  const _disc = midRun && G._shopDiscount ? G._shopDiscount : (typeof getPermanentUpgrades==='function' ? (getPermanentUpgrades().shop_discount||0)*0.05 : 0);
  const price = Math.floor(item.value * (1 - _disc));
  const gold = midRun ? G.gold : (typeof getPersistentGold==='function' ? getPersistentGold() : 0);

  if(gold < price){ townFlash('Not enough gold!'); return; }

  const stash = typeof getStash==='function' ? getStash() : [];
  if(stash.length >= 40){ townFlash('Stash is full!'); return; }

  // Deduct gold
  if(midRun){
    G.gold -= price;
    G.totalGold = (G.totalGold||0); // don't credit totalGold for purchases
    if(typeof renderAll==='function') renderAll();
  } else {
    if(typeof spendPersistentGold==='function') spendPersistentGold(price);
  }

  // Add to stash
  if(typeof addToStash==='function') addToStash({...item, qty:1});

  if(typeof log==='function' && midRun) log(`🛍 Bought ${item.icon} ${item.name} — sent to stash.`,'l');

  // Refresh dialog
  document.getElementById('townDialogContent').innerHTML = _dlgMirelaShop();
  townFlash(`Bought ${item.name}!`);
}

// ── Stash Dialog ──────────────────────────────────────────
function _dlgStash(){
  const stash = typeof getStash==='function' ? getStash() : [];
  const rc = {common:'#9a8868',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#9b54bd',legendary:'var(--gold)'};
  const gold = typeof getPersistentGold==='function' ? getPersistentGold() : 0;

  if(stash.length === 0){
    return `<div class="td-portrait">📦</div>
      <div class="td-name">Stash <span class="td-sub">Your personal storage</span></div>
      <div class="td-greeting" style="font-style:italic;color:var(--dim)">Empty. Buy items from Mirela or salvage gear from a run.</div>
      <div style="margin-top:10px;font-family:'Press Start 2P',monospace;font-size:7px;color:var(--dim)">Town Gold: <span style="color:var(--gold)">🪙 ${gold}</span></div>`;
  }

  const itemsHTML = stash.filter(item=>item!=null).map((item,i)=>{
    const col = rc[item.rarity]||'#888';
    const statsStr = Object.entries(item.stats||{}).filter(([k,v])=>v&&k!=='heal').map(([k,v])=>`+${v} ${k}`).join(' · ');
    const healStr = item.stats&&item.stats.heal ? `heals ${item.stats.heal} HP` : '';
    return `<div class="stash-dlg-item">
      <span class="stash-dlg-icon">${item.icon}</span>
      <div class="stash-dlg-info">
        <span class="stash-dlg-name" style="color:${col}">${item.name}</span>
        <span class="stash-dlg-rar" style="color:${col}">${item.rarity.toUpperCase()}</span>
        <span class="stash-dlg-stats">${statsStr||healStr}</span>
      </div>
      <button class="stash-dlg-discard" onclick="stashDiscardItem(${i})" title="Discard item">✕</button>
    </div>`;
  }).join('');

  return `<div class="td-portrait">📦</div>
    <div class="td-name">Stash <span class="td-sub">${stash.length}/40 items</span></div>
    <div style="margin-bottom:8px;font-family:'Press Start 2P',monospace;font-size:7px;color:var(--dim)">Town Gold: <span style="color:var(--gold)">🪙 ${gold}</span></div>
    <div class="stash-dlg-list">${itemsHTML}</div>
    <div style="margin-top:10px;font-size:10px;color:var(--dim);font-style:italic">Items here carry over between runs. Load them at the gate before descending.</div>`;
}

function stashDiscardItem(idx){
  if(typeof removeFromStash==='function') removeFromStash(idx);
  document.getElementById('townDialogContent').innerHTML = _dlgStash();
}

// ══════════════════════════════════════════════════════════
//  VICTORY MODE — Hero emerges from gate into gathered crowd.
//  NPCs speak one by one. Hero walks south off map. Credits.
// ══════════════════════════════════════════════════════════
var _victoryActive = false;
var _victoryTimers = [];
var _victoryPhase = 'walk_in'; // 'walk_in' | 'bubbles' | 'walk_out'
var _victoryBubbleIdx = 0;

// Very slow walk speed (pixels per frame)
const _VICTORY_WALK_SPEED = 0.18;

// Hero stops at this tile row (center of the crowd)
const _VICTORY_STOP_ROW = 10;

// All NPCs clustered below the gate in a crowd.
// Gate door at col 29, row 4. Clear zone: rows 5-13, cols 23-35.
// Arranged in a loose semicircle / gathering shape.
const VICTORY_CROWD = [
  // ── Row 7: flanking near gate entrance ──
  { id:'v_seraphine', label:'Seraphine',         color:'#a0c4ff', icon:'⛪', tx:26, ty:7,  facing:2,
    text:"The Shrine fire turned gold this morning. It has never done that." },
  { id:'v_edwyn',     label:'Brother Edwyn',     color:'#9090c0', icon:'📖', tx:33, ty:7,  facing:2,
    text:"The inscription is clear now. For the first time in three years. It says your name." },

  // ── Row 8: wider arc ──
  { id:'v_oswin',     label:'Father Oswin',      color:'#d0d0e0', icon:'✝',  tx:24, ty:8,  facing:1,
    text:"Every prayer. Every single one. Answered." },
  { id:'v_malachar',  label:'Malachar',          color:'#504878', icon:'📚', tx:35, ty:8,  facing:3,
    text:"I spent three years translating that inscription. It was your name the whole time." },

  // ── Row 9: closing in ──
  { id:'v_apprentice',label:"Aldric's Apprentice",color:'#c06830', icon:'⚒', tx:25, ty:9,  facing:1,
    text:"Aldric told me to sharpen it one last time. I did. This morning. Before dawn." },
  { id:'v_rook',      label:'Rook',              color:'#c8a020', icon:'🍺', tx:34, ty:9,  facing:3,
    text:"Kept your stool warm." },

  // ── Row 10: level with hero's stop point ──
  { id:'v_dael',      label:'Sergeant Dael',     color:'#a0a060', icon:'🛡', tx:24, ty:10, facing:1,
    text:"Thirty years, four postings, two wars. This is the only one that mattered." },
  { id:'v_ferris',    label:'Old Ferris',        color:'#806040', icon:'👴', tx:35, ty:10, facing:3,
    text:"I've been drunk for thirty years. Today I'm sober. Felt like the right day for it." },

  // ── Row 11: behind hero ──
  { id:'v_mira',      label:'Mira',              color:'#e090a0', icon:'💊', tx:26, ty:11, facing:0,
    text:"I patched you up every time. You never needed it less than today." },
  { id:'v_cord',      label:'Cord',              color:'#6090a0', icon:'🎣', tx:33, ty:11, facing:0,
    text:"Fish are biting again. First time in months. The water knows." },
  { id:'v_townsman',  label:'Townsman',          color:'#908060', icon:'🏠', tx:28, ty:11, facing:0,
    text:"We came back. All of us. Don't ask me why. Something told us to be here today." },
  { id:'v_mother',    label:'Townswoman',        color:'#b08870', icon:'👩', tx:31, ty:11, facing:0,
    text:"My children are safe because of you. I don't know how to say that properly. So I'm just here." },

  // ── Row 12: further back ──
  { id:'v_cray',      label:'Old Cray',          color:'#706050', icon:'🪙', tx:25, ty:12, facing:0,
    text:"I told you so. Didn't I tell you so? I told everyone." },
  { id:'v_child',     label:'Pip',               color:'#d0c080', icon:'🧒', tx:34, ty:12, facing:0,
    text:"Are you really the one? From the stories? You look tired. But like... the good kind." },

  // ── Row 13: the last two ──
  { id:'v_elspeth',   label:'Elspeth',           color:'#c0a080', icon:'👵', tx:28, ty:13, facing:0,
    text:"Sixty years. I told you. You always come back." },
  { id:'v_kit',       label:'Kit',               color:'#c0d090', icon:'🧒', tx:31, ty:13, facing:0,
    text:"I kept the last page blank. Like I said I would.", isFinal:true },
];

function _buildVictoryWanderers(){
  return VICTORY_CROWD.map(npc => ({
    id: npc.id,
    label: npc.label,
    color: npc.color,
    icon: npc.icon,
    wx: npc.tx * TILE + TILE/2,
    wy: npc.ty * TILE + TILE/2,
    wanderTarget: { x: npc.tx * TILE + TILE/2, y: npc.ty * TILE + TILE/2 },
    wanderTimer: 9999,
    talking: false,
    talkTimer: 0,
    activeLine: 0,
    facing: npc.facing,
    stationary: true,
    lines: [npc.text],
  }));
}

function _startVictoryInTown(){
  _victoryActive = true;
  _victoryPhase = 'walk_in';
  _victoryBubbleIdx = 0;
  _victoryTimers.forEach(t => clearTimeout(t));
  _victoryTimers = [];

  // Hide speech close button during victory
  const closeBtn = document.querySelector('.npc-speech-close');
  if(closeBtn) closeBtn.style.display = 'none';

  // Player at gate door, facing south
  _pl.wx = 30 * TILE;
  _pl.wy = 5 * TILE;
  _pl.facing = 2;

  // Override wanderers to victory crowd
  _wanderers = _buildVictoryWanderers();
}

// Called every frame from _townTick when _victoryActive
function _victoryStep(){
  if(!_victoryActive) return;

  if(_victoryPhase === 'walk_in'){
    // Slowly walk south toward center of crowd
    _pl.wy += _VICTORY_WALK_SPEED;
    _pl.facing = 2;
    if(_pl.wy >= _VICTORY_STOP_ROW * TILE){
      _pl.wy = _VICTORY_STOP_ROW * TILE;
      _victoryPhase = 'bubbles';
      // Start bubble sequence after a beat
      _victoryTimers.push(setTimeout(() => _playVictoryBubble(), 1200));
    }
  }
  else if(_victoryPhase === 'walk_out'){
    // Walk south off the map
    _pl.wy += _VICTORY_WALK_SPEED;
    _pl.facing = 2;
    if(_pl.wy > (EXT_ROWS + 3) * TILE){
      _victoryActive = false;
      _endVictoryWalk();
    }
  }
  // 'bubbles' phase: hero stands still, timers handle progression
}

function _playVictoryBubble(){
  if(_victoryBubbleIdx >= VICTORY_CROWD.length){
    // All done — pause, then start walking out
    _victoryTimers.push(setTimeout(() => {
      closeNpcDialog();
      _victoryPhase = 'walk_out';
    }, 1500));
    return;
  }

  const npc = VICTORY_CROWD[_victoryBubbleIdx];
  const w = _wanderers.find(w => w.id === npc.id);
  const srcX = w ? w.wx : _pl.wx;
  const srcY = w ? w.wy : _pl.wy;

  _showDialog(npc.label, npc.text, srcX, srcY);
  if(_npcDialogTimer){ clearTimeout(_npcDialogTimer); _npcDialogTimer = null; }

  _victoryBubbleIdx++;

  // Hold time based on text length — final line lingers longer
  const holdTime = npc.isFinal ? 4000 : Math.max(2800, npc.text.length * 42 + 1200);

  _victoryTimers.push(setTimeout(() => {
    closeNpcDialog();
    // Small gap between speakers
    _victoryTimers.push(setTimeout(() => _playVictoryBubble(), 500));
  }, holdTime));
}

function _endVictoryWalk(){
  _victoryTimers.forEach(t => clearTimeout(t));
  _victoryTimers = [];

  // Restore speech close button
  const closeBtn = document.querySelector('.npc-speech-close');
  if(closeBtn) closeBtn.style.display = '';

  // Fade to black, then credits
  const fade = document.getElementById('victoryFade');
  if(fade){
    fade.style.display = 'block';
    fade.style.opacity = '0';
    requestAnimationFrame(() => {
      fade.style.transition = 'opacity 2.5s ease';
      fade.style.opacity = '1';
    });
    _victoryTimers.push(setTimeout(() => {
      _tRunning = false;
      if(_tRAF) cancelAnimationFrame(_tRAF);
      fade.style.display = 'none';
      if(G) G._victoryMode = false;
      if(typeof showCreditsScreen === 'function') showCreditsScreen();
    }, 3000));
  } else {
    _tRunning = false;
    if(G) G._victoryMode = false;
    if(typeof showCreditsScreen === 'function') showCreditsScreen();
  }
}

function finishVictoryMode(){
  _victoryActive = false;
  _victoryTimers.forEach(t => clearTimeout(t));
  _victoryTimers = [];
  closeNpcDialog();
  const closeBtn = document.querySelector('.npc-speech-close');
  if(closeBtn) closeBtn.style.display = '';
  if(G) G._victoryMode = false;
  if(typeof showCreditsScreen === 'function') showCreditsScreen();
}
