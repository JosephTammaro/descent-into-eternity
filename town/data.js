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
  if(typeof loadGraveyard==='function'){
    return loadGraveyard().length;
  }
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
        const last = (typeof loadGraveyard==='function') ? loadGraveyard()[0] : null;
        const lastDesc = last
          ? `A ${(last.className||'hero').toLowerCase()} lost to ${last.causeOfDeath||'the dark'} in ${last.zoneName||'the dungeon'}.`
          : '';
        const deathLine = deaths===1
          ? `I wrote an ending for page one. Then you came back. I crossed it out.${lastDesc?' '+lastDesc:''}`
          : deaths<=3 ? `Page ${deaths+1} now. The first ${deaths} had endings. This one doesn't yet.${lastDesc?' '+lastDesc:''}`
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

    // ── Ghost of last fallen hero — appears inside graveyard when deaths exist ──
    ...((()=>{
      if(typeof loadGraveyard!=='function') return [];
      const gy=loadGraveyard();
      if(!gy.length) return [];
      const last=gy[0];
      const causeShort=last.causeOfDeath||'the dark';
      const clsLower=(last.className||'hero').toLowerCase();
      return [{
        id:'ghost_hero', label:'Fallen Hero', color:'#9090bb', icon:'👻',
        wx:39, wy:31, stationary:true,
        getLines: ()=>[
          `A ${clsLower}. Level ${last.level}. Lost to ${causeShort} in ${last.zoneName}.`,
          `I remember ${last.zoneName}. I remember ${causeShort}. I don't remember anything else.`,
          `I keep thinking I can go back in. I can't. But you can. That's the part that matters.`,
          `${last.kills} enemies. ${last.bossesKilled} bosses. It wasn't enough that time. Maybe it will be now.`,
        ],
      }];
    })()),
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
