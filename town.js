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
let _tScene = 'exterior'; // 'exterior' | interior id
let _tZone  = 0;

const TILE = 16;
const DRAW_SCALE = 3; // exterior scale
// Interior: pick largest integer scale fitting the room in 90% of the viewport
function _intScale(){
  return Math.max(2,
    Math.min(
      Math.floor((window.innerWidth  * 0.90) / (INT_W * TILE)),
      Math.floor((window.innerHeight * 0.90) / (INT_H * TILE))
    )
  );
}
function _curScale(){ return _tScene === 'exterior' ? DRAW_SCALE : _intScale(); }

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
  // Gravestones
  ...[0,1,2,3,4,5].map(i=>({type:'grave',tx:35+i,ty:29})),
  ...[0,1,2,3,4,5].map(i=>({type:'grave',tx:35+i,ty:32})),
  // Barrels
  {type:'barrel',tx:12,ty:14},{type:'barrel',tx:13,ty:14},
  {type:'barrel',tx:45,ty:14},{type:'barrel',tx:46,ty:14},
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
    // 0=floor 1=wall 2=bar/counter 3=rug 4=fireplace 9=table
    map: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,1],
      [1,0,0,0,9,9,0,0,0,0,0,0,9,9,0,0,0,0,0,1],
      [1,0,0,0,9,9,0,0,0,0,0,0,9,9,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,9,9,0,0,0,3,3,3,3,3,0,0,0,9,9,0,0,1],
      [1,0,9,9,0,0,0,3,3,3,3,3,0,0,0,9,9,0,0,1],
      [1,0,0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,1],
      [1,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,1],
      [1,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1],
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
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,7,7,7,7,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,7,7,7,7,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,3,3,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0,1],
      [1,0,3,3,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,3,3,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0,1],
      [1,0,3,3,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1],
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
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,8,8,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,1],
      [1,0,8,8,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0,0,1],
      [1,0,0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,9,9,0,0,0,0,0,0,0,0,9,9,0,0,0,0,1],
      [1,0,0,9,9,0,0,0,0,0,0,0,0,9,9,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1],
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
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,5,5,5,5,5,0,0,0,0,0,0,0,5,5,5,5,5,5,1],
      [1,5,5,5,5,5,0,0,0,0,0,0,0,5,5,5,5,5,5,1],
      [1,0,0,0,0,0,0,0,9,9,9,9,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,9,9,9,9,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5,5,1],
      [1,5,5,0,0,0,9,9,9,9,9,9,9,9,0,0,5,5,5,1],
      [1,0,0,0,0,0,9,9,9,9,9,9,9,9,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1],
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
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,6,6,0,6,6,0,0,0,0,0,0,0,0,0,6,6,0,6,1],
      [1,6,6,0,6,6,0,0,0,0,0,0,0,0,0,6,6,0,6,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,1],
      [1,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,9,9,9,9,9,9,9,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,9,9,9,9,9,9,9,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,6,6,0,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,6,6,0,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1],
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
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,9,9,0,0,9,9,0,0,9,9,0,0,9,9,0,0,0,1],
      [1,0,9,9,0,0,9,9,0,0,9,9,0,0,9,9,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1],
    ],
    npcs: [
      { id:'mirela', label:'Mirela', tx:10, ty:2, color:'#70a030', icon:'🛍', stationary:true, lines:['z_mirela'] },
      { id:'customer', label:'Customer', tx:5, ty:6, color:'#a07050', icon:'👤', stationary:false, lines:['z_customer'] },
    ],
  },
  market: {
    label: 'Market District',
    exitTx: 9, exitTy: 13,
    spawnTx: 9, spawnTy: 11,
    bgm: 'campfire',
    map: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,2,2,2,0,0,2,2,2,0,0,2,2,2,0,0,2,2,2,1],
      [1,2,2,2,0,0,2,2,2,0,0,2,2,2,0,0,2,2,2,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,2,2,2,0,0,2,2,2,0,0,2,2,2,0,0,2,2,2,1],
      [1,2,2,2,0,0,2,2,2,0,0,2,2,2,0,0,2,2,2,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1],
    ],
    npcs: [
      { id:'vendor1', label:'Cassia', tx:2,  ty:2, color:'#c08040', icon:'🏪', stationary:true, lines:['z_vendor1'] },
      { id:'vendor2', label:'Dunk',   tx:7,  ty:6, color:'#806080', icon:'🏪', stationary:true, lines:['z_vendor2'] },
      { id:'shopper', label:'Shopper',tx:12, ty:8, color:'#a08060', icon:'👤', stationary:false, lines:['z_shopper'] },
    ],
  },
  // Generic houses
  house1:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(),npcs:[{id:'resident',label:'Aldren',tx:9,ty:9,color:'#c09060',icon:'👤',stationary:true,lines:['z_house1']}] },
  house2:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(),npcs:[{id:'resident',label:'Gira',  tx:9,ty:9,color:'#d090a0',icon:'👤',stationary:true,lines:['z_house2']}] },
  house3:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(),npcs:[{id:'resident',label:'Orin',  tx:9,ty:9,color:'#90a0c0',icon:'👤',stationary:true,lines:['z_house3']}] },
  house4:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(),npcs:[{id:'resident',label:'Brynn', tx:9,ty:9,color:'#b0c090',icon:'👤',stationary:true,lines:['z_house4']}] },
  house5:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(),npcs:[{id:'resident',label:'Cael',  tx:9,ty:9,color:'#c0a070',icon:'👤',stationary:true,lines:['z_house5']}] },
  house6:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(),npcs:[{id:'resident',label:'Wren',  tx:9,ty:9,color:'#a0b0d0',icon:'👤',stationary:true,lines:['z_house6']}] },
  house7:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(),npcs:[{id:'resident',label:'Moss',  tx:9,ty:9,color:'#80a080',icon:'👤',stationary:true,lines:['z_house7']}] },
  house8:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(),npcs:[{id:'resident',label:'Dalla', tx:9,ty:9,color:'#d0b080',icon:'👤',stationary:true,lines:['z_house8']}] },
  house9:{ label:'Residence',exitTx:9,exitTy:13,spawnTx:9,spawnTy:11,bgm:'campfire',map:_makeHouseMap(),npcs:[{id:'resident',label:'Varn',  tx:9,ty:9,color:'#c0a0b0',icon:'👤',stationary:true,lines:['z_house9']}] },
};

function _makeHouseMap() {
  // Cozy two-room cottage:
  // Top half: bedroom with two beds and a fireplace
  // Bottom half: living room with table, rug, counter shelves
  // Dividing wall row 6 with a gap at col 9 (centre doorway)
  // Exterior door at bottom centre (col 9, row 14)
  // 0=floor 1=wall 2=counter/shelf 3=rug 4=fireplace 6=bed 9=table
  return [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // row 0 — top wall
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 1 — bedroom open
    [1,0,6,6,0,0,0,0,0,0,0,0,0,0,0,0,6,6,0,1], // row 2 — beds left+right
    [1,0,6,6,0,0,0,0,4,0,0,4,0,0,0,0,6,6,0,1], // row 3 — beds + fireplace nooks
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 4 — bedroom open
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 5 — bedroom open
    [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1], // row 6 — dividing wall, gap cols 9-10
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 7 — living room open
    [1,0,0,0,0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,1], // row 8 — rug
    [1,0,9,9,0,0,0,3,3,3,3,3,0,0,0,9,9,0,0,1], // row 9 — tables + rug
    [1,0,9,9,0,0,0,3,3,3,3,3,0,0,0,9,9,0,0,1], // row 10 — tables + rug
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 11 — open
    [1,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,1], // row 12 — side shelves
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // row 13 — exit row (door gap at col 10)
    [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1], // row 14 — bottom wall, door at col 10
  ];
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
  },
};

// ── Wandering NPC definitions (exterior only) ─────────────
function _buildWanderers(zoneIdx) {
  const z = zoneIdx;
  const alive = z === 0;
  // Each: { id, label, color, icon, wx, wy, wanderArea, lines, stationary? }
  // wanderArea: {x1,y1,x2,y2} in tiles to wander within
  const baseWanderers = [
    { id:'guard1',   label:'Town Guard',     color:'#8080a0', icon:'⚔', wx:30,wy:5,  wanderArea:{x1:26,y1:2,x2:35,y2:10},  lines: z===0 ? ["Another one heading for the Gate. I used to try to stop them. Now I just nod.","The woods have been loud lately. Wrong kind of loud.","Stay on the roads. The roads are mostly safe."] : ["Half my unit didn't come back from the Outpost rotation. Command says 'reassigned'. We know better.","I stop counting the ones who go in. Started counting the ones who come out. Then stopped that too.","If you're going in... take care of yourself."] },
    { id:'guard2',   label:'Town Guard',     color:'#8080a0', icon:'⚔', wx:30,wy:42, wanderArea:{x1:26,y1:38,x2:35,y2:46}, lines: z===0 ? ["South gate's been reinforced. Precaution, they said. Three times now.","Quiet night. I hate quiet nights."] : ["South gate's locked at sundown now. Orders from somewhere above my rank.","I've requested transfer three times. No response. I think that office is empty."] },
    { id:'oldwoman', label:'Elspeth',        color:'#c0a080', icon:'👵', wx:14,wy:14, wanderArea:{x1:10,y1:10,x2:18,y2:18}, lines: z===0 ? ["I've lived here sixty years. The trees never used to whisper back.","My mother used to say the Gate was a door to somewhere. Not somewhere bad necessarily. Just somewhere.","You have kind eyes. Careful eyes. You'll need both."] : ["I'm not leaving. I outlasted the last darkness. I'll outlast this one.","Three of my neighbors are gone. Packed up in the night. I understand. I just can't do it.","Come back. That's all I ask of anyone now. Just come back."] },
    { id:'merchant', label:'Traveling Merchant', color:'#c08030', icon:'🛒', wx:20,wy:23, wanderArea:{x1:16,y1:20,x2:27,y2:27}, lines: z===0 ? ["Business is good when times are uncertain. Uncertain times make certain purchases.","I've been trading this road for fifteen years. Never stayed in Elderfen more than a night. Now I can't seem to leave."] : ["I was going to leave. Packed the cart, got the horse ready. Then I looked at the road east and... left the horse in the stable.","I'm selling at half price. What am I saving it for?"] },
    { id:'farmer1',  label:'Harlan',          color:'#806040', icon:'🌾', wx:5, wy:38, wanderArea:{x1:2, y1:35,x2:12,y2:44}, lines: z===0 ? ["Good harvest this year. Better than expected. People are saying that's lucky. I think luck runs out.","My fields are just past the north wall. I can hear the forest from there. Different sounds this year."] : ["Crops are thin this year. Soil feels wrong. Like it knows something.","I don't go to the north field anymore. My dog won't go there. That's enough for me."] },
    { id:'farmer2',  label:'Bess',            color:'#a07060', icon:'🌾', wx:52,wy:38, wanderArea:{x1:46,y1:35,x2:57,y2:44}, lines: z===0 ? ["Lovely evening. I say that every evening. It keeps being true.","I sell my vegetables at the market. Aldric says a blacksmith doesn't need vegetables. He buys them anyway."] : ["I sold the goats. Didn't want to. Had to. If you see them on the road somewhere — they were good goats.","I'm staying for the harvest. After that... I don't know."] },
    { id:'child1',   label:'Kit',             color:'#c0d090', icon:'🧒', wx:22,wy:8,  wanderArea:{x1:16,y1:4, x2:28,y2:12}, lines: z===0 ? ["I dared Rue to touch the Gate. She did it! I didn't. Don't tell anyone.","My mum says adventurers are brave. My dad says they're stupid. I think both.","Can you beat the whole dungeon? Nobody's ever beaten the whole dungeon."] : ["Rue moved away. Her whole family left in the middle of the night.","I'm not scared. I'm not. ...Is it quiet here or is it just me?"] },
    { id:'child2',   label:'Rue',             color:'#90c0d0', icon:'🧒', wx:36,wy:8,  wanderArea:{x1:32,y1:4, x2:42,y2:12}, lines: z===0 ? ["I touched the Gate. It felt cold. Not stone-cold. Different.","If you go in the dungeon can you bring me back a monster tooth? For a collection."] : alive ? ["My mum says we're leaving soon. I don't want to go. This is home.","I'm keeping a journal of everyone who goes in. I give them a number. Just in case."] : ["..."] },
    { id:'scholar',  label:'Brother Edwyn',   color:'#9090c0', icon:'📖', wx:44,wy:14, wanderArea:{x1:40,y1:10,x2:50,y2:18}, lines: z===0 ? ["I've been studying the inscription above the Gate for three years. I understand about a third of it.","Magic and faith aren't opposites. They're different languages for the same thing.","The dungeon predates the town. The town predates the road. The road predates memory. That should tell you something."] : ["I'm writing everything down. Every account I can find. Someone should.","The inscription changed. Slightly. Three words I've been translating for three years just... changed.","I'm scared and I'm fascinated and I know those two feelings shouldn't coexist but here we are."] },
    { id:'healer',   label:'Mira',            color:'#e090a0', icon:'💊', wx:44,wy:36, wanderArea:{x1:40,y1:32,x2:50,y2:42}, lines: z===0 ? ["I patch up adventurers mostly. And farmers. Sometimes both, when an adventurer becomes a farmer by accident.","Rest when you can. Eat when you can. That's the whole secret to survival."] : ["I've been working around the clock. It's not battles — it's fear. Fear makes people sick in very specific ways.","I'm running low on everything. If you find herbs in there... bring them back."] },
    { id:'beggar',   label:'Old Cray',        color:'#706050', icon:'🪙', wx:8, wy:23, wanderArea:{x1:4, y1:20,x2:13,y2:27}, lines: z===0 ? ["Coin for an old man? I was a soldier once. A good one.","I've seen six people try to close the Gate. Last one lasted longest. Almost three minutes.","The Gate doesn't lock from outside. Everyone forgets that part."] : ["I used to think the Gate was something we could manage. Live with. Work around. Not anymore.","If you're going in... I knew a fighter, once. Best I ever saw. Just... don't forget to come back."] },
    { id:'fisher',   label:'Cord',            color:'#6090a0', icon:'🎣', wx:5, wy:20, wanderArea:{x1:2, y1:16,x2:10,y2:22}, lines: z===0 ? ["The fish are biting strange this year. Deeper than usual. Can't explain it.","I fish the east pond mostly. The west pond's been odd lately. Smells like iron."] : ["The west pond's gone wrong. Everything in it died in one night. I'm not going back there.","The east pond's still fine. I think. I'm fishing a lot. It's the only quiet left."] },
    { id:'soldier',  label:'Sergeant Dael',   color:'#a0a060', icon:'🛡', wx:31,wy:37, wanderArea:{x1:27,y1:34,x2:36,y2:42}, lines: z===0 ? ["Twelve years in the garrison. Never lost a night's sleep over the Gate before. Sleep fine now too, mostly.","Standard patrol route: north wall, east road, market, south gate, repeat. Boring. I love boring."] : ["Three of my soldiers requested early discharge last week. I approved all three. I'd go myself if I could.","Command says hold the town. Hold it with what? The numbers don't—... never mind. Not your problem."] },
    { id:'priest',   label:'Father Oswin',    color:'#d0d0e0', icon:'✝', wx:36,wy:26, wanderArea:{x1:32,y1:22,x2:42,y2:30}, lines: z===0 ? ["I hold services at dawn. Fewer attend each week, but those who come — they really come.","The Shrine and the Temple aren't the same faith. Seraphine and I disagree on most things. We agree on this: something must hold."] : ["I've been blessing every adventurer who passes through. Every single one. It takes most of the morning.","I asked the Shrine what's coming. It showed me the Gate. Open. I woke up before I saw what came through."] },
    // Zone 0 only extras
    ...(z===0 ? [
      { id:'child3', label:'Pip',   color:'#d0c080', icon:'🧒', wx:28,wy:38, wanderArea:{x1:24,y1:34,x2:34,y2:42}, lines:["I'm going to be an adventurer when I grow up. Or a baker. Haven't decided.","What class are you? I'm going to be a wizard. Or maybe a fighter. Both?"] },
      { id:'smith2', label:'Beryl', color:'#c06030', icon:'⚒', wx:14,wy:36, wanderArea:{x1:10,y1:32,x2:18,y2:42}, lines:["I work with Aldric sometimes. Mostly I sharpen things. Sharpen enough things, eventually one of them matters."] },
      { id:'weaver', label:'Syl',   color:'#b080c0', icon:'🧶', wx:50,wy:26, wanderArea:{x1:46,y1:22,x2:56,y2:32}, lines:["I weave cloaks mostly. Warm ones. I've been making thicker ones lately. Not sure why."] },
      { id:'tanner', label:'Hugh',  color:'#806030', icon:'🥾', wx:52,wy:14, wanderArea:{x1:48,y1:10,x2:57,y2:18}, lines:["Good boots keep you alive. Better than a sword, sometimes. Don't tell Aldric I said that."] },
    ] : [
      { id:'refugee', label:'Refugee',  color:'#907060', icon:'🧳', wx:20,wy:36, wanderArea:{x1:16,y1:32,x2:26,y2:42}, lines:["We came from the Outpost road. There's nothing left of the waystation.","I don't know where we're going. Just away from there."] },
      { id:'soldier2',label:'Scout',    color:'#a09060', icon:'⚔', wx:42,wy:26, wanderArea:{x1:38,y1:22,x2:48,y2:30}, lines:["I scouted ahead of the garrison. Came back alone. I don't talk about what I saw.","The road east is passable. Barely. Don't go at night."] },
    ]),
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

// ── Collision ─────────────────────────────────────────────
function _extBlocked(wx,wy){
  const tc=Math.floor(wx/TILE), tr=Math.floor(wy/TILE);
  if(tc<0||tr<0||tc>=EXT_COLS||tr>=EXT_ROWS) return true;
  if(EXT_MAP[tr][tc]===3) return true;
  for(const b of EXT_BUILDINGS){
    if(b.id==='gate'||b.id==='noticeboard'||b.id==='graveyard') continue;
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
function _logW(){ const s=_curScale(); return _tc ? _tc.width/s : window.innerWidth/s; }
function _logH(){ const s=_curScale(); return _tc ? _tc.height/s : window.innerHeight/s; }

function _updateCamera(canvasW, canvasH){
  if(_tScene !== 'exterior'){
    _camX = 0; _camY = 0; return;
  }
  const vpW = canvasW, vpH = canvasH;
  const mapW = EXT_COLS * TILE;
  const mapH = EXT_ROWS * TILE;
  _camX = Math.round(_pl.wx - vpW/2 + TILE/2);
  _camY = Math.round(_pl.wy - vpH/2 + TILE/2);
  _camX = Math.max(0, Math.min(mapW - vpW, _camX));
  _camY = Math.max(0, Math.min(mapH - vpH, _camY));
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
  const pal = BPAL[0]; // use floor colour from atmos
  for(let r=0;r<INT_H;r++){
    for(let c=0;c<INT_W;c++){
      const t=map[r][c];
      const sx=c*TILE-cx, sy=r*TILE-cy;
      switch(t){
        case 0: // floor
          ctx.fillStyle=a.floorCol; ctx.fillRect(sx,sy,TILE,TILE);
          ctx.fillStyle='rgba(0,0,0,0.1)'; if((c+r)%2===0) ctx.fillRect(sx,sy,TILE,TILE);
          break;
        case 1: // wall
          ctx.fillStyle=a.wallDark; ctx.fillRect(sx,sy,TILE,TILE);
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(sx,sy,TILE,2);
          break;
        case 2: // counter/bar
          ctx.fillStyle='#3a2810'; ctx.fillRect(sx,sy,TILE,TILE);
          ctx.fillStyle='#6a4820'; ctx.fillRect(sx,sy,TILE,4);
          ctx.fillStyle='rgba(255,200,100,0.1)'; ctx.fillRect(sx+2,sy+2,TILE-4,2);
          break;
        case 3: // rug
          ctx.fillStyle=a.floorCol; ctx.fillRect(sx,sy,TILE,TILE);
          ctx.fillStyle='rgba(150,30,30,0.4)'; ctx.fillRect(sx+1,sy+1,TILE-2,TILE-2);
          ctx.strokeStyle='rgba(200,100,30,0.4)'; ctx.lineWidth=1; ctx.strokeRect(sx+2,sy+2,TILE-4,TILE-4);
          break;
        case 4: // fireplace
          ctx.fillStyle='#2a1408'; ctx.fillRect(sx,sy,TILE,TILE);
          const ff=0.5+0.5*Math.sin(Date.now()*0.008+sx);
          ctx.fillStyle=`rgba(${200+Math.floor(ff*55)},${60+Math.floor(ff*40)},10,0.9)`;
          ctx.fillRect(sx+3,sy+4,TILE-6,TILE-6);
          ctx.fillStyle='rgba(255,200,50,0.4)'; ctx.fillRect(sx+5,sy+6,TILE-10,TILE-10);
          break;
        case 5: // bookshelf
          ctx.fillStyle='#2a1808'; ctx.fillRect(sx,sy,TILE,TILE);
          for(let i=0;i<5;i++){ ctx.fillStyle=['#8a2010','#1a3a8a','#306030','#6a4a10','#3a103a'][i]; ctx.fillRect(sx+2+i*3,sy+2,2,TILE-4); }
          ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(sx,sy,TILE,2);
          break;
        case 6: // bed
          ctx.fillStyle=a.floorCol; ctx.fillRect(sx,sy,TILE,TILE);
          ctx.fillStyle='#3a2010'; ctx.fillRect(sx+1,sy+1,TILE-2,TILE-2);
          ctx.fillStyle='#c0c0d0'; ctx.fillRect(sx+2,sy+2,TILE-4,TILE-4);
          ctx.fillStyle='#e0e0f0'; ctx.fillRect(sx+3,sy+2,6,4);
          break;
        case 7: // altar
          ctx.fillStyle='#10103a'; ctx.fillRect(sx,sy,TILE,TILE);
          ctx.fillStyle='#3030a0'; ctx.fillRect(sx+2,sy+2,TILE-4,TILE-4);
          const ag=0.5+0.5*Math.sin(Date.now()*0.003);
          ctx.fillStyle=`rgba(160,180,255,${0.3+ag*0.3})`; ctx.fillRect(sx+4,sy+4,TILE-8,TILE-8);
          ctx.fillStyle='rgba(200,220,255,0.8)'; ctx.fillRect(sx+7,sy+7,2,2);
          break;
        case 8: // anvil
          ctx.fillStyle=a.floorCol; ctx.fillRect(sx,sy,TILE,TILE);
          ctx.fillStyle='#404040'; ctx.fillRect(sx+2,sy+6,TILE-4,TILE-8);
          ctx.fillStyle='#606060'; ctx.fillRect(sx+3,sy+4,TILE-6,4);
          ctx.fillStyle='#303030'; ctx.fillRect(sx+5,sy+10,TILE-10,4);
          break;
        case 9: // table
          ctx.fillStyle=a.floorCol; ctx.fillRect(sx,sy,TILE,TILE);
          ctx.fillStyle='#3a2010'; ctx.fillRect(sx+1,sy+4,TILE-2,TILE-8);
          ctx.fillStyle='#5a3018'; ctx.fillRect(sx+1,sy+4,TILE-2,3);
          ctx.fillRect(sx+1,sy+2,2,4); ctx.fillRect(sx+TILE-3,sy+2,2,4);
          ctx.fillRect(sx+1,sy+TILE-4,2,4); ctx.fillRect(sx+TILE-3,sy+TILE-4,2,4);
          break;
        default:
          ctx.fillStyle=a.floorCol; ctx.fillRect(sx,sy,TILE,TILE);
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

  // Drop shadow
  ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(x+4,y+h,w,5);

  if(isHouse){
    // ── House style: pitched roof triangle + walls + chimney ──
    const wallY = y + Math.floor(h*0.45);
    const wallH = h - Math.floor(h*0.45);

    // Walls
    ctx.fillStyle=pal[0]; ctx.fillRect(x,wallY,w,wallH);
    // Wall planks
    ctx.fillStyle='rgba(0,0,0,0.1)';
    for(let ly=wallY+6;ly<y+h;ly+=6) ctx.fillRect(x,ly,w,1);

    // Pitched roof (trapezoid: wider at bottom, narrower at top)
    const roofBot = wallY+2;
    const roofTop = y+2;
    const roofOvhg = 3; // overhang on each side
    ctx.fillStyle=pal[1];
    ctx.beginPath();
    ctx.moveTo(x - roofOvhg, roofBot);
    ctx.lineTo(x + w + roofOvhg, roofBot);
    ctx.lineTo(x + w*0.7, roofTop);
    ctx.lineTo(x + w*0.3, roofTop);
    ctx.closePath(); ctx.fill();

    // Roof ridge highlight
    ctx.fillStyle=pal[2];
    ctx.beginPath();
    ctx.moveTo(x+w*0.3, roofTop); ctx.lineTo(x+w*0.7, roofTop);
    ctx.lineWidth=2; ctx.strokeStyle=pal[2]; ctx.stroke();

    // Roof tiles (horizontal lines)
    ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=0.5;
    for(let ry=roofTop+4;ry<roofBot;ry+=4){
      const t=(ry-roofTop)/(roofBot-roofTop);
      const lx=x+w*0.3 + (roofOvhg + w*0.3)*(-1+t*-1)*-1 ; // approximate
      ctx.beginPath();
      ctx.moveTo(x - roofOvhg*t, ry);
      ctx.lineTo(x + w + roofOvhg*t, ry);
      ctx.stroke();
    }

    // Chimney (top left area)
    const chx = x + Math.floor(w*0.25);
    ctx.fillStyle='#4a3828';
    ctx.fillRect(chx, y-6, 6, 14);
    ctx.fillStyle='#2a1810';
    ctx.fillRect(chx-1, y-7, 8, 3);
    // Smoke puff
    const st=Date.now()*0.001;
    ctx.globalAlpha=0.3+0.2*Math.sin(st);
    ctx.fillStyle='#c0b0a0';
    ctx.beginPath(); ctx.arc(chx+3, y-10+Math.sin(st)*2, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(chx+5, y-14+Math.sin(st+1)*2, 2, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;

    // Windows (2 on front wall)
    const wy = wallY + 4;
    [[x+4,wy],[x+w-12,wy]].forEach(([wx,winY])=>{
      if(wx+8>0&&wx<_logW()){
        ctx.fillStyle=pal[3]; ctx.fillRect(wx,winY,8,7);
        ctx.fillStyle=`rgba(${a.tr},${a.tg},${a.tb},0.35)`; ctx.fillRect(wx,winY,8,7);
        // Window cross
        ctx.fillStyle='rgba(0,0,0,0.4)';
        ctx.fillRect(wx+3,winY,2,7);   // vertical bar
        ctx.fillRect(wx,winY+3,8,2);   // horizontal bar
        ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(wx+1,winY+1,3,2);
        ctx.strokeStyle='rgba(80,60,30,0.8)'; ctx.lineWidth=1; ctx.strokeRect(wx,winY,8,7);
      }
    });

  } else {
    // ── Regular building style (tavern, temple, etc.) ──
    const roofH=Math.max(TILE,Math.floor(h*0.3));
    ctx.fillStyle=pal[0]; ctx.fillRect(x,y+roofH,w,h-roofH);
    ctx.fillStyle=pal[1]; ctx.fillRect(x,y,w,roofH+2);
    ctx.fillStyle=pal[2]; ctx.fillRect(x,y,w,2);
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(x,y+roofH,w,3);

    // Wall texture
    ctx.fillStyle='rgba(0,0,0,0.1)';
    for(let lx=x+TILE;lx<x+w;lx+=TILE) ctx.fillRect(lx,y+roofH+3,1,h-roofH-3);
    for(let ly=y+roofH+TILE;ly<y+h;ly+=TILE) ctx.fillRect(x,ly,w,1);

    // Windows
    if(b.th>=4){
      const wy=y+roofH+5;
      [[x+4,wy],[x+w-12,wy]].forEach(([wx,winY])=>{
        if(wx+8>0&&wx<_logW()){
          ctx.fillStyle=pal[3]; ctx.fillRect(wx,winY,8,6);
          ctx.fillStyle=`rgba(${a.tr},${a.tg},${a.tb},0.3)`; ctx.fillRect(wx,winY,8,6);
          ctx.fillStyle='rgba(255,255,255,0.07)'; ctx.fillRect(wx+1,winY+1,3,2);
          ctx.strokeStyle=pal[2]; ctx.lineWidth=1; ctx.strokeRect(wx,winY,8,6);
        }
      });
    }
  }

  // Door (same for all buildings)
  const dx=b.doorTx*TILE-cx, dy=b.doorTy*TILE-cy;
  ctx.fillStyle=pal[3]; ctx.fillRect(dx+3,dy,TILE-6,TILE);
  ctx.fillStyle=pal[2]; ctx.fillRect(dx+3,dy,TILE-6,2);
  ctx.fillStyle=`rgba(${a.tr},${a.tg},${a.tb},0.2)`; ctx.fillRect(dx+4,dy+3,4,TILE-5);
  ctx.fillStyle=pal[2]; ctx.fillRect(dx+TILE-7,dy+6,2,2);

  // Label
  if(b.label){
    const near=_nearInteractable&&(_nearInteractable.ref===b);
    ctx.font='bold 5px "Press Start 2P",monospace';
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillStyle=near?'#ffd84a':pal[2];
    ctx.globalAlpha=0.9; ctx.fillText(b.label,x+w/2,y-2); ctx.globalAlpha=1;
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
  }
}

// ── Draw NPC (wanderer or interior) ──────────────────────
function _drawNPC(ctx, npc, wx, wy, facing, cx, cy, near, label){
  const sx=wx-cx, sy=wy-cy;
  if(sx<-TILE*2||sy<-TILE*2||sx>_logW()+TILE||sy>_logH()+TILE) return;

  const t=Date.now()*0.002;
  const bob=Math.sin(t+sx)*0.6;

  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(sx,sy+13,4,1.5,0,0,Math.PI*2); ctx.fill();

  // Legs
  ctx.fillStyle='rgba(25,15,8,0.9)';
  ctx.fillRect(sx-3,sy+7+bob,3,5); ctx.fillRect(sx+1,sy+7+bob,3,5);
  // Boots
  ctx.fillStyle='#301808';
  ctx.fillRect(sx-4,sy+11+bob,4,2); ctx.fillRect(sx+2,sy+11+bob,4,2);

  // Torso
  ctx.fillStyle=npc.color||'#808080'; ctx.fillRect(sx-4,sy+1+bob,8,7);
  ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(sx-4,sy+7+bob,8,1);
  // Arms
  ctx.fillStyle=npc.color||'#808080';
  ctx.fillRect(sx-6,sy+2+bob,2,5); ctx.fillRect(sx+4,sy+2+bob,2,5);

  // Head
  ctx.fillStyle='#e8c896'; ctx.fillRect(sx-3,sy-4+bob,6,6);
  // Hair
  ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(sx-3,sy-4+bob,6,2);

  // Eyes by facing
  ctx.fillStyle='#1a1008';
  if(facing===2){ ctx.fillRect(sx-2,sy-2+bob,1,1); ctx.fillRect(sx+1,sy-2+bob,1,1); }
  else if(facing===0){ ctx.fillRect(sx-2,sy-3+bob,1,1); ctx.fillRect(sx+1,sy-3+bob,1,1); }
  else if(facing===3){ ctx.fillRect(sx-3,sy-2+bob,1,1); ctx.fillRect(sx-3,sy+bob,1,1); }
  else{ ctx.fillRect(sx+2,sy-2+bob,1,1); ctx.fillRect(sx+2,sy+bob,1,1); }

  // Name tag
  if(label){
    ctx.font='5px "Press Start 2P",monospace';
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillStyle='rgba(200,180,120,0.7)';
    ctx.fillText(label, sx, sy-5+bob);
  }

  // Interact prompt
  if(near){
    const pulse=0.75+0.25*Math.sin(Date.now()*0.006);
    ctx.globalAlpha=pulse;
    const txt='[E] Talk';
    ctx.font='5px "Press Start 2P",monospace';
    const tw=ctx.measureText(txt).width+10;
    const bx=sx-tw/2, by=sy-20+bob;
    ctx.fillStyle='rgba(8,6,2,0.92)';
    _rrect(ctx,bx,by,tw,13,2); ctx.fill();
    ctx.strokeStyle='#ffd84a'; ctx.lineWidth=1;
    _rrect(ctx,bx,by,tw,13,2); ctx.stroke();
    ctx.fillStyle='rgba(8,6,2,0.92)';
    ctx.beginPath(); ctx.moveTo(sx-3,by+13); ctx.lineTo(sx+3,by+13); ctx.lineTo(sx,by+17); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#ffd84a'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(sx-3,by+13); ctx.lineTo(sx,by+17); ctx.lineTo(sx+3,by+13); ctx.stroke();
    ctx.fillStyle='#ffd84a'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(txt,sx,by+6);
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

  ctx.fillStyle='rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(sx+4,sy+15,4,1.5,0,0,Math.PI*2); ctx.fill();

  ctx.fillStyle='#1a1008';
  ctx.fillRect(sx+1,sy+11+bob,3,4+legSwing);
  ctx.fillRect(sx+4,sy+11+bob,3,4-legSwing);
  ctx.fillStyle='#3a2010';
  ctx.fillRect(sx,  sy+14+bob+legSwing,4,2);
  ctx.fillRect(sx+3,sy+14+bob-legSwing,4,2);

  ctx.fillStyle='#2a1a08'; ctx.fillRect(sx,sy+5+bob,8,9);
  ctx.fillStyle='#c8a848'; ctx.fillRect(sx+1,sy+5+bob,6,7);
  ctx.fillStyle='#a07830'; ctx.fillRect(sx+1,sy+5+bob,6,2);
  ctx.fillStyle='rgba(255,255,150,0.12)'; ctx.fillRect(sx+2,sy+6+bob,2,4);
  ctx.fillStyle='#c8a848';
  ctx.fillRect(sx-1,sy+5+bob,2,6); ctx.fillRect(sx+7,sy+5+bob,2,6);

  if(_pl.facing===1){ ctx.fillStyle='#c8c0a0'; ctx.fillRect(sx+9,sy+4+bob,2,8); ctx.fillStyle='rgba(200,180,60,0.5)'; ctx.fillRect(sx+9,sy+4+bob,2,3); }
  if(_pl.facing===3){ ctx.fillStyle='#c8c0a0'; ctx.fillRect(sx-3,sy+4+bob,2,8); ctx.fillStyle='rgba(200,180,60,0.5)'; ctx.fillRect(sx-3,sy+4+bob,2,3); }

  ctx.fillStyle='#e8c896'; ctx.fillRect(sx+1,sy-1+bob,6,6);
  ctx.fillStyle='#c8a848'; ctx.fillRect(sx+1,sy-1+bob,6,2);
  ctx.fillRect(sx,sy,1,3); ctx.fillRect(sx+7,sy,1,3);
  ctx.fillStyle='rgba(255,255,150,0.18)'; ctx.fillRect(sx+2,sy-1+bob,2,2);
  ctx.fillStyle='#1a1008';
  if(_pl.facing===2){ ctx.fillRect(sx+2,sy+2+bob,1,1); ctx.fillRect(sx+5,sy+2+bob,1,1); }
  else if(_pl.facing===0){ ctx.fillRect(sx+2,sy+1+bob,1,1); ctx.fillRect(sx+5,sy+1+bob,1,1); }
  else if(_pl.facing===3){ ctx.fillRect(sx+1,sy+2+bob,1,1); ctx.fillRect(sx+1,sy+4+bob,1,1); }
  else{ ctx.fillRect(sx+6,sy+2+bob,1,1); ctx.fillRect(sx+6,sy+4+bob,1,1); }
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
  ctx.textAlign='right';
  ctx.fillStyle='rgba(160,140,80,0.45)';
  ctx.fillText(a.label, W-4, 5.5);

  // Bottom bar
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,H-11,W,11);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='rgba(180,160,100,0.5)';
  if(near){
    let prompt='';
    if(near.type==='door')    prompt=`[E] Enter ${near.ref.label||'building'}`;
    else if(near.type==='gate')   prompt='[E] Approach the Dungeon Gate';
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
    // Stationary NPCs never move
    if(w.stationary) continue;

    if(w.talking){ w.talkTimer--; if(w.talkTimer<=0){w.talking=false;} continue; }

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
    }
  }
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
  let dx=0,dy=0;
  if(_keys['ArrowLeft'] ||_keys['a']||_keys['A']){dx=-1;_pl.facing=3;}
  if(_keys['ArrowRight']||_keys['d']||_keys['D']){dx= 1;_pl.facing=1;}
  if(_keys['ArrowUp']   ||_keys['w']||_keys['W']){dy=-1;_pl.facing=0;}
  if(_keys['ArrowDown'] ||_keys['s']||_keys['S']){dy= 1;_pl.facing=2;}
  if(dx&&dy){dx*=0.707;dy*=0.707;}

  const spd=_pl.speed;
  const nx=_pl.wx+dx*spd, ny=_pl.wy+dy*spd;
  const m=4; // pixel collision margin

  if(_tScene==='exterior'){
    if(!_extBlocked(nx+m,_pl.wy+m)&&!_extBlocked(nx+m,_pl.wy+TILE-m)&&!_extBlocked(nx+TILE-m,_pl.wy+m)&&!_extBlocked(nx+TILE-m,_pl.wy+TILE-m)) _pl.wx=nx;
    if(!_extBlocked(_pl.wx+m,ny+m)&&!_extBlocked(_pl.wx+m,ny+TILE-m)&&!_extBlocked(_pl.wx+TILE-m,ny+m)&&!_extBlocked(_pl.wx+TILE-m,ny+TILE-m)) _pl.wy=ny;
    _pl.wx=Math.max(TILE,Math.min((EXT_COLS-2)*TILE,_pl.wx));
    _pl.wy=Math.max(TILE,Math.min((EXT_ROWS-2)*TILE,_pl.wy));
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
  if(_tScene==='exterior') _stepWanderers(zi);
  else { const _int=INTERIORS[_tScene]; if(_int) _stepInteriorNPCs(_int); }
  _stepPtcls(a.fx);
  _updateCamera(W,H);

  // ── Draw ──
  const _scale = _curScale();
  let _offX = 0, _offY = 0;
  if(_tScene !== 'exterior'){
    const roomW = INT_W * TILE;
    const roomH = INT_H * TILE;
    _offX = Math.round((_tc.width  / _scale - roomW) / 2);
    _offY = Math.round((_tc.height / _scale - roomH) / 2);
    ctx.setTransform(_scale, 0, 0, _scale, _offX * _scale, _offY * _scale);
  } else {
    ctx.setTransform(_scale, 0, 0, _scale, 0, 0);
  }
  ctx.fillStyle = a.sky;
  ctx.fillRect(-_offX, -_offY, _tc.width / _scale, _tc.height / _scale);

  if(_tScene==='exterior'){
    _drawExtTiles(ctx,a,_camX,_camY,W,H);
    EXT_DECORS.filter(d=>d.type==='tree').forEach(d=>_drawDecor(ctx,d,a,_camX,_camY));
    EXT_BUILDINGS.forEach(b=>_drawExtBuilding(ctx,b,a,_camX,_camY));
    EXT_DECORS.filter(d=>d.type!=='tree').forEach(d=>_drawDecor(ctx,d,a,_camX,_camY));
    // Wanderers
    for(const w of _wanderers){
      const near=_nearInteractable&&_nearInteractable.type==='wanderer'&&_nearInteractable.ref===w;
      _drawNPC(ctx,w,w.wx,w.wy,w.facing,_camX,_camY,near,w.label);
    }
  } else {
    const int=INTERIORS[_tScene];
    if(int){
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

  // Vignette
  ctx.fillStyle=a.ambient; ctx.fillRect(0,0,W,H);
  const vig=ctx.createRadialGradient(W/2,H/2,H*.1,W/2,H/2,W*.65);
  vig.addColorStop(0,'transparent'); vig.addColorStop(1,'rgba(0,0,0,0.5)');
  ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

  _drawPlayer(ctx,_camX,_camY);
  _drawHUD(ctx,a,_nearInteractable);

  _tRAF=requestAnimationFrame(_townTick);
}

// ── Keyboard ──────────────────────────────────────────────
function _kd(e){
  _keys[e.key]=true;
  // e.repeat=true when key held down — only interact on the very first press
  if(!e.repeat && (e.key==='e'||e.key==='E')){
    if(_nearInteractable){
      e.preventDefault();
      const target=_nearInteractable;
      _nearInteractable=null; // clear so the transition frame can't re-fire
      _handleInteract(target);
    }
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
    // Fresh run — show class select
    stopTownEngine();
    if(typeof showScreen==='function') showScreen('class');
    if(typeof renderClassSelect==='function') renderClassSelect();
  } else {
    // Mid-run return — confirm enter
    showGenericConfirm(
      'ENTER THE DUNGEON?',
      'You will descend into '+(typeof ZONES!=='undefined'?ZONES[Math.min(G.zoneIdx,ZONES.length-1)].name:'the dungeon')+'.',
      '⚔ DESCEND',
      ()=>{ stopTownEngine(); townEnterDungeon(); }
    );
  }
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
  const zi=(typeof G!=='undefined'&&G)?Math.min(G.zoneIdx||0,1):0;
  const zLines=NPC_LINES[zi]||NPC_LINES[0];
  let lines=w.lines||[];
  // Resolve string keys to actual lines
  if(typeof lines[0]==='string' && lines[0].startsWith('z_')){
    const key=lines[0]; lines=(zLines[key]||['...']).slice();
  }
  if(!lines.length) lines=['...'];
  const line=lines[w.activeLine||0];
  w.activeLine=((w.activeLine||0)+1)%lines.length;
  _showDialog(w.label||'???', line);
}

function _showNPCLine(n){
  const zi=(typeof G!=='undefined'&&G)?Math.min(G.zoneIdx||0,1):0;
  const zLines=NPC_LINES[zi]||NPC_LINES[0];
  let lines=n.lines||[];
  if(typeof lines[0]==='string' && lines[0].startsWith('z_')){
    const key=lines[0]; lines=(zLines[key]||['...']).slice();
  }
  if(!lines.length) lines=['...'];
  const line=lines[n._lineIdx||0];
  n._lineIdx=((n._lineIdx||0)+1)%lines.length;
  _showDialog(n.label||'???', line);
}

// ── Simple dialog box (NPC speech) ───────────────────────
let _npcDialogTimer = null;
function _showDialog(name, text){
  const ov=document.getElementById('npcSpeechOverlay');
  const nm=document.getElementById('npcSpeechName');
  const tx=document.getElementById('npcSpeechText');
  if(!ov||!nm||!tx) return;
  nm.textContent=name;
  tx.textContent=text;
  ov.classList.add('open');
  if(_npcDialogTimer) clearTimeout(_npcDialogTimer);
  _npcDialogTimer=setTimeout(()=>ov.classList.remove('open'), 5000);
}
function closeNpcDialog(){ document.getElementById('npcSpeechOverlay')?.classList.remove('open'); if(_npcDialogTimer){clearTimeout(_npcDialogTimer);_npcDialogTimer=null;} }

// ══════════════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════════════
function showTownHub(){
  TOWN.blessingUsed=false; TOWN.tavernDrinkUsed=false;
  TOWN.forgeVisited=false; TOWN._sharpenApplied=false;

  const zi=(typeof G!=='undefined'&&G)?Math.min(G.zoneIdx||0,ATMOS.length-1):0;
  _tZone=zi; _tScene='exterior';

  // Spawn player near main road centre
  _pl.wx=30*TILE+TILE/2; _pl.wy=26*TILE;
  _pl.facing=2;

  _wanderers=_buildWanderers(zi);
  _initPtcls(ATMOS[zi].fx);

  if(typeof AUDIO!=='undefined'&&AUDIO.playBGM) AUDIO.playBGM('campfire');
  if(typeof showScreen==='function') showScreen('town');
  setTimeout(_startTown, 80);
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
  // scale applied per-frame

  for(const k in _keys) delete _keys[k];
  if(_tRAF) cancelAnimationFrame(_tRAF);
  _tRunning=true;
  _tRAF=requestAnimationFrame(_townTick);

  document.removeEventListener('keydown',_kd);
  document.removeEventListener('keyup',_ku);
  document.addEventListener('keydown',_kd);
  document.addEventListener('keyup',_ku);

  // Handle window resize
  window.removeEventListener('resize',_onResize);
  window.addEventListener('resize',_onResize);
}

function _onResize(){
  if(!_tc||!_tx) return;
  _tc.width=window.innerWidth;
  _tc.height=window.innerHeight;
  _tx.imageSmoothingEnabled=false;
  // scale applied per-frame
}

function stopTownEngine(){
  _tRunning=false;
  if(_tRAF){cancelAnimationFrame(_tRAF);_tRAF=null;}
  document.removeEventListener('keydown',_kd);
  document.removeEventListener('keyup',_ku);
  window.removeEventListener('resize',_onResize);
}

function townEnterDungeon(){
  stopTownEngine();
  if(typeof AUDIO!=='undefined'&&AUDIO.sfx&&AUDIO.sfx.rage) AUDIO.sfx.rage();
  const zi=(typeof G!=='undefined'&&G)?G.zoneIdx:0;
  const target=(G&&G.bossDefeated&&G.bossDefeated[zi])?zi+1:zi;
  if(typeof travelToZone==='function') travelToZone(target);
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
function townOpenDialog(id){
  _activeDlg=id;
  const ov=document.getElementById('townDialogOverlay');
  const ti=document.getElementById('townDialogTitle');
  const co=document.getElementById('townDialogContent');
  if(!ov) return;
  const titles={tavern:'🍺 The Rusted Flagon',temple:'⛪ Shrine of Seraphine',forge:"⚒ Aldric's Forge",malachar:"📚 Malachar's Study",notice:'📋 Notice Board'};
  ti.textContent=titles[id]||id;
  if(id==='tavern')   co.innerHTML=_dlgTavern();
  if(id==='temple')   co.innerHTML=_dlgTemple();
  if(id==='forge')    co.innerHTML=_dlgForge();
  if(id==='malachar') co.innerHTML=_dlgMalachar();
  if(id==='notice')   co.innerHTML=_dlgNotice();
  ov.classList.add('open');
}
function townCloseDialog(){ _activeDlg=null; document.getElementById('townDialogOverlay')?.classList.remove('open'); }

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
const ROOK_ZONES=[["I scouted those woods once. Once.","The Thornwarden's roots move underground. Watch your footing.","It slammed Kareth into a tree so hard we buried him and the tree. ...Pour me another?"],["Grakthar. Yeah. I knew men who served under him — before.","His Bellow broke three men's nerves. WIS save, they said. In practice you just ran.","He still thinks the war's going. Don't try to reason. Just fight."]];
const ROOK_CLASS={fighter:"Fighter, yeah? Good. Someone who can take a hit.",wizard:"Wizard. Try not to blow up the tavern. Last one did.",rogue:"Rogue, eh. I'm counting my coinpurse when you leave.",paladin:"Paladin. You people never buy the cheap rounds.",ranger:"Ranger! Those wolves aren't pets, by the way.",barbarian:"Sit anywhere — just not that stool. It's still not quite right.",cleric:"Cleric. Heal me while you're at it? My knee's been a nightmare.",druid:"Don't turn into anything in here. Bear in the beer cellar. Long story."};
const SERA_ZONES=["The woods remember old blood. Let the Shrine cleanse what clings to you.","The Outpost is a place of unfinished things. Carry the light in."];
const SERA_CLASS={fighter:"Your strength is your shield. The Shrine blesses the body that never breaks.",wizard:"The Shrine welcomes minds as well as swords.",rogue:"You move like someone who has had to. The Shrine does not judge.",paladin:"The light in you is genuine. The Shrine recognises its own.",ranger:"You carry the wild in you — the blessing will anchor you.",barbarian:"Fury is a kind of prayer too, if directed rightly.",cleric:"A fellow servant. I'll simply add my voice to yours.",druid:"The old ways and the Shrine's ways are older than their argument."};
const ALDRIC_ZONES=["These woods'll dull a blade faster than any whetstone.","Undead rust iron from the inside out. Enchanted gear holds better."];
const ALDRIC_CLASS={fighter:"Good build. Keep the sword oiled — blood dries fast.",wizard:"Staff reinforcements. Mages keep breaking them.",rogue:"Short blade with a hollow handle — you'll know what it's for.",paladin:"Divine-blessed steel holds an edge longer.",ranger:"Broadhead tips that punch through chitin.",barbarian:"You're going to destroy whatever I give you. Take the cheap stuff.",cleric:"Holy-water tempered chainmail if you need it.",druid:"Most druids just grow thorns. But welcome."};
const MALACHAR_ZONES=["The Whispering Woods are older than this town. Something grew there before trees knew how.","The garrison watched the east. The incursion came from below."];
const MALACHAR_CLASS={fighter:"Ah, a warrior. Direct. Good.",wizard:"A fellow practitioner! Your posture suggests Evocation.",rogue:"The most interesting documents were stolen by rogues. I'm simply noting.",paladin:"Complicated feelings about holy orders. You personally seem fine.",ranger:"Rangers are underestimated. The natural world has more tactical info than any library.",barbarian:"I once argued berserkers were the original philosophers. I stand by it.",cleric:"Which deity? Don't tell me — let me guess from your sigil.",druid:"Druids always make me feel I've wronged a plant."};

function _dlgTavern(){const cid=G?G.classId:'fighter',zi=Math.min(G?G.zoneIdx:0,ROOK_ZONES.length-1);const lines=ROOK_ZONES[zi]||[];const rHtml=lines.map((l,i)=>`<div class="td-line${i===0?' active':''}" onclick="this.closest('.td-lines').querySelectorAll('.td-line').forEach(x=>x.classList.remove('active'));this.classList.add('active')">${i===0?'🗣':'💬'} ${l}</div>`).join('');const drink=TOWN.tavernDrinkUsed?`<div class="td-used">🍺 You've had your drink.</div>`:`<button class="td-btn" onclick="townBuyDrink()">🍺 Buy Rook a drink (5g) — hear a rumor</button>`;return `<div class="td-portrait">🍺</div><div class="td-name">Rook <span class="td-sub">Ex-soldier. Permanently at the bar.</span></div><div class="td-greeting">"${ROOK_CLASS[cid]||'Welcome.'}"</div><div class="td-lines">${rHtml}</div><div style="margin-top:10px">${drink}</div>`;}
function _dlgTemple(){const cid=G?G.classId:'fighter',zi=Math.min(G?G.zoneIdx:0,SERA_ZONES.length-1);const bl=SHRINE_BLESSINGS[cid];const bHtml=TOWN.blessingUsed?`<div class="td-used">✝ Blessing granted.</div>`:bl?`<div class="td-blessing-card"><div class="td-blessing-icon">${bl.icon}</div><div><div class="td-blessing-name">${bl.name}</div><div class="td-blessing-desc">${bl.desc}</div></div></div><button class="td-btn td-btn-holy" onclick="townReceiveBlessing()">✝ Receive Blessing</button>`:'';const healHtml=G&&G.hp<G.maxHp?`<button class="td-btn" style="margin-top:8px" onclick="townFullHeal()">💖 Pray for healing (full HP)</button>`:`<div class="td-used" style="margin-top:8px">💖 You are at full health.</div>`;return `<div class="td-portrait">⛪</div><div class="td-name">Seraphine <span class="td-sub">Shrine Keeper</span></div><div class="td-greeting">"${SERA_CLASS[cid]||'Welcome.'}"</div><div class="td-zoneline">"${SERA_ZONES[zi]}"</div>${bHtml}${healHtml}`;}
function _dlgForge(){const cid=G?G.classId:'fighter',zi=Math.min(G?G.zoneIdx:0,ALDRIC_ZONES.length-1);const hasMats=G&&G.inventory&&G.inventory.some(i=>i&&i.type==='material');const sell=hasMats?`<button class="td-btn" onclick="townSellMaterials()">💰 Sell all materials</button>`:`<div class="td-used">No materials to sell.</div>`;const sharpen=TOWN.forgeVisited?`<div class="td-used">⚒ Already sharpened.</div>`:`<button class="td-btn" onclick="townSharpenWeapon()">⚒ Sharpen weapon — +2 ATK (15g)</button>`;return `<div class="td-portrait">⚒</div><div class="td-name">Aldric <span class="td-sub">Blacksmith</span></div><div class="td-greeting">"${ALDRIC_CLASS[cid]||'Need something forged?'}"</div><div class="td-zoneline">"${ALDRIC_ZONES[zi]}"</div><div style="margin-top:12px">${sharpen}<div style="margin-top:8px">${sell}</div></div>`;}
function _dlgMalachar(){const cid=G?G.classId:'fighter',zi=Math.min(G?G.zoneIdx:0,MALACHAR_ZONES.length-1);const donations=(typeof getWizardDonations==='function')?getWizardDonations():0;const tier=(typeof getShopTier==='function')?getShopTier():1;const tiers=['Standard','Rare','Legendary'];const donate=tier<3?`<button class="td-btn" onclick="townDonateMalachar(100)">📚 Donate 100g for research access</button>`:`<div class="td-used">📚 Full catalogue unlocked.</div>`;return `<div class="td-portrait">📚</div><div class="td-name">Malachar the Grey <span class="td-sub">Scholar</span></div><div class="td-greeting">"${MALACHAR_CLASS[cid]||'Ah.'}"</div><div class="td-zoneline">"${MALACHAR_ZONES[zi]}"</div><div class="td-donate-info">Donated: <span style="color:var(--gold)">${donations}g</span> · Tier: <span style="color:var(--gold)">${tiers[tier-1]||'Standard'}</span></div><div style="margin-top:10px">${donate}</div>`;}
function _dlgNotice(){const zi=G?G.zoneIdx:0;const tips={fighter:"Don't burn Relentless early.",wizard:"Spell slot economy is everything.",rogue:"Exploit every Advantage. Sneak Attack ends fights early.",paladin:"Smite on crits — always.",ranger:"Hunter's Mark is your engine.",barbarian:"Rage before the first hit.",cleric:"Channel Divinity often beats spells.",druid:"Wild Shape is a second life bar."};const tease=["🍄 Strange fungi near the old forest path. Collectors or idiots only.","🏛 A vault beneath the Outpost road. Loot unclaimed."];const zone=typeof ZONES!=='undefined'?ZONES[Math.min(zi,ZONES.length-1)]:null;let html='';if(zone)html+=`<div class="nb-notice nb-warning"><div class="nb-tag">⚠ DUNGEON REPORT</div><div class="nb-title">Threat: ${zone.name}</div><div class="nb-desc">Scouts report ${zone.kills} contacts before the zone commander.</div></div>`;if(zi<tease.length)html+=`<div class="nb-notice nb-rumor"><div class="nb-tag">📌 RUMOR</div><div class="nb-desc">${tease[zi]}</div></div>`;const cid=G?G.classId:null;if(cid&&tips[cid])html+=`<div class="nb-notice nb-tip"><div class="nb-tag">💡 TIP</div><div class="nb-desc">${tips[cid]}</div></div>`;return html||'<div class="td-used">No current notices.</div>';}

function townBuyDrink(){if(!G||G.gold<5){townFlash('Not enough gold!');return;}G.gold-=5;TOWN.tavernDrinkUsed=true;if(typeof log==='function')log("🍺 Rook: 'Generous soul.'",'l');if(typeof renderAll==='function')renderAll();document.getElementById('townDialogContent').innerHTML=_dlgTavern();setTimeout(()=>{const ls=document.querySelectorAll('.td-line');ls.forEach(l=>l.classList.remove('active'));if(ls[ls.length-1])ls[ls.length-1].classList.add('active');},80);}
function townReceiveBlessing(){if(TOWN.blessingUsed||!G)return;const bl=SHRINE_BLESSINGS[G.classId];if(!bl)return;TOWN.blessingUsed=true;bl.apply();if(typeof log==='function')log(`✝ Seraphine: "${bl.name} — ${bl.desc}"`,'l');document.getElementById('townDialogContent').innerHTML=_dlgTemple();}
function townFullHeal(){if(!G)return;const h=G.maxHp-G.hp;G.hp=G.maxHp;if(typeof log==='function')log('💖 Shrine restores your wounds. (+'+h+' HP)','l');if(typeof renderAll==='function')renderAll();document.getElementById('townDialogContent').innerHTML=_dlgTemple();}
function townSharpenWeapon(){if(!G||G.gold<15){townFlash('Need 15g!');return;}if(TOWN.forgeVisited)return;G.gold-=15;G.atk+=2;TOWN._sharpenApplied=true;TOWN.forgeVisited=true;if(typeof log==='function')log("⚒ Aldric sharpens your weapon. (+2 ATK)",'l');if(typeof renderAll==='function')renderAll();document.getElementById('townDialogContent').innerHTML=_dlgForge();}
function townSellMaterials(){if(!G)return;let g=0,c=0;G.inventory=G.inventory.map(item=>{if(item&&item.type==='material'){g+=(item.value||5);c++;return null;}return item;});G.gold+=g;G.totalGold+=g;if(typeof log==='function')log(`⚒ Aldric bought ${c} material${c!==1?'s':''} for ${g}g.`,'l');if(typeof renderAll==='function')renderAll();document.getElementById('townDialogContent').innerHTML=_dlgForge();}
function townDonateMalachar(amount){if(!G||G.gold<amount){townFlash(`Need ${amount}g!`);return;}if(typeof cfDonateWizard==='function')cfDonateWizard(amount);else G.gold-=amount;if(typeof renderAll==='function')renderAll();document.getElementById('townDialogContent').innerHTML=_dlgMalachar();}
function townFlash(msg){const el=document.getElementById('townFlash');if(!el)return;el.textContent=msg;el.classList.add('visible');setTimeout(()=>el.classList.remove('visible'),2200);}
