// ================================================================
// data.js — All Static Game Data
// Sprite pixel art, class definitions, zones, items
// Descent into Eternity
// ================================================================

// ══════════════════════════════════════════════════════════
//  PIXEL SPRITE DATA
//  Each sprite is a 2D array of color codes
//  '' = transparent, '#xxx' = solid pixel
// ══════════════════════════════════════════════════════════
const C = { // color shortcuts
  _:'',          // transparent
  W:'#e8dfc8',   // white/skin
  T:'#8b6914',   // tan
  S:'#888',      // steel
  D:'#555',      // dark steel
  R:'#c0392b',   // red
  G:'#27ae60',   // green
  B:'#2980b9',   // blue
  P:'#8e44ad',   // purple
  Y:'#f1c40f',   // yellow/gold
  O:'#e67e22',   // orange
  N:'#4a3728',   // brown
  K:'#1a1208',   // black/dark
  L:'#2ecc71',   // lime
  E:'#16a085',   // teal
  X:'#922b21',   // dark red
};

// ── CLASS SPRITES (16×24 NES-style humanoid pixel art) ──────────────────────────
const SK = '#e8c99a'; // skin light
const SK2= '#c8a070'; // skin mid / shadow
const SK3= '#8a5530'; // skin dark
const HBR= '#6b3a1a'; // hair brown
const HBK= '#1a1008'; // hair black
const HRD= '#c04010'; // hair red
const HBL= '#c8c080'; // hair blond
const HGR= '#888070'; // hair grey
const SH = '#3a3a4a'; // shadow dark
const SL = '#d0d8e8'; // steel light
const SM = '#8090a8'; // steel mid
const SD = '#404858'; // steel dark
const GD = '#e8c030'; // gold bright
const GD2= '#a07818'; // gold dark
const RD = '#c03020'; // red bright
const RD2= '#601008'; // red dark
const WH = '#f0f0e8'; // white / cloth light
const CL = '#d0c8b8'; // cloth light
const CM = '#a09080'; // cloth mid
const CD = '#605040'; // cloth dark
const GR = '#304820'; // green dark
const GR2= '#507838'; // green mid
const GR3= '#80b858'; // green light
const BR = '#5a3818'; // brown dark
const BR2= '#8a6030'; // brown mid
const BR3= '#b89060'; // brown light
const PU = '#502870'; // purple dark
const PU2= '#8048b0'; // purple mid
const PU3= '#b878e0'; // purple light
const BL = '#183870'; // blue dark
const BL2= '#2860b0'; // blue mid
const BL3= '#58a0e8'; // blue light
const OR = '#a03010'; // orange dark
const OR2= '#d06020'; // orange mid
const OR3= '#e89040'; // orange light
const TL = '#186858'; // teal dark
const TL2= '#28a888'; // teal mid
const TL3= '#60d8b8'; // teal light
const LM = '#388828'; // lime dark
const LM2= '#58b838'; // lime mid
const LM3= '#90e860'; // lime light

const CLASS_SPRITES = {

// ══════════════════════════════════════════════════════════════════
// LAYOUT KEY (16 cols × 20 rows):
//  Rows  0-1  : hat/helmet top
//  Rows  2-4  : HEAD (wide — cols 4-11)
//  Row   5    : neck
//  Rows  6-11 : TORSO + ARMS (arms at cols 0-3 left, 12-15 right)
//  Rows 12-13 : HIPS
//  Rows 14-16 : THIGHS  (cols 4-7 left leg, 8-11 right leg)
//  Rows 17-18 : SHINS
//  Row  19    : BOOTS
// ══════════════════════════════════════════════════════════════════

// ── FIGHTER ─ plate armor, sword arm right, shield arm left ──────
fighter:[
//   0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
  [C._,C._,C._,C._,C._,SD,  SM,  SM,  SM,  SM,  SD,  C._,C._,C._,C._,C._],  //  0 helm crest
  [C._,C._,C._,C._,SD,  SM,  SL,  SL,  SL,  SL,  SM,  SD,  C._,C._,C._,C._],  //  1 helm top
  [C._,C._,C._,SD,  SM,  SL,  SL,  SL,  SL,  SL,  SL,  SM,  SD,  C._,C._,C._],  //  2 helm mid
  [C._,C._,C._,SD,  SL,  SD,  SD,  SD,  SD,  SD,  SD,  SL,  SD,  C._,C._,C._],  //  3 visor
  [C._,C._,C._,SD,  SM,  SL,  SL,  SL,  SL,  SL,  SL,  SM,  SD,  C._,C._,C._],  //  4 helm lower
  [C._,C._,C._,C._,SD,  SM,  SM,  SM,  SM,  SM,  SM,  SD,  C._,C._,C._,C._],  //  5 neck/gorget
  [SD,  SM,  SL,  SM,  SD,  RD,  SM,  SM,  SM,  SM,  RD,  SD,  SM,  SL,  SM,  SD],  //  6 shoulders+arms
  [SD,  SL,  SM,  SL,  GD2, SM,  SM,  SM,  SM,  SM,  SM,  GD2, SL,  SM,  SL,  SD],  //  7 arms+chest
  [SD,  SL,  SM,  SL,  SM,  SD,  GD,  SM,  SM,  GD,  SD,  SM,  SL,  SM,  SL,  SD],  //  8 arms+chest
  [C._,SL,  SM,  SL,  SM,  SM,  SM,  SM,  SM,  SM,  SM,  SM,  SL,  SM,  SL,  C._],  //  9 lower arms+torso
  [C._,C._,SD,  SM,  GD2, GD,  GD,  GD,  GD,  GD,  GD,  GD2, SM,  SD,  C._,C._],  // 10 belt
  [C._,C._,SD,  SM,  SL,  SM,  SD,  C._,C._,SD,  SM,  SL,  SM,  SD,  C._,C._],  // 11 fists/hips
  [C._,C._,C._,SD,  SM,  SL,  SM,  SD,  SD,  SM,  SL,  SM,  SD,  C._,C._,C._],  // 12 hip plates
  [C._,C._,C._,C._,SM,  SL,  SM,  C._,C._,SM,  SL,  SM,  C._,C._,C._,C._],  // 13 hip/thigh top
  [C._,C._,C._,C._,SM,  SL,  SM,  C._,C._,SM,  SL,  SM,  C._,C._,C._,C._],  // 14 thigh upper
  [C._,C._,C._,C._,SM,  SL,  SM,  C._,C._,SM,  SL,  SM,  C._,C._,C._,C._],  // 15 thigh lower
  [C._,C._,C._,C._,SD,  SM,  SD,  C._,C._,SD,  SM,  SD,  C._,C._,C._,C._],  // 16 knee
  [C._,C._,C._,C._,SM,  SL,  SM,  C._,C._,SM,  SL,  SM,  C._,C._,C._,C._],  // 17 shin
  [C._,C._,C._,C._,SM,  SL,  SM,  C._,C._,SM,  SL,  SM,  C._,C._,C._,C._],  // 18 lower shin
  [C._,C._,C._,SD,  SM,  SL,  SM,  SD,  SD,  SM,  SL,  SM,  SD,  C._,C._,C._],  // 19 boots
],

// ── WIZARD ─ pointed hat, robes, staff in right hand ─────────────
wizard:[
  [C._,C._,C._,C._,C._,C._,PU,  PU2, C._,C._,C._,C._,C._,C._,C._,C._],  //  0 hat tip
  [C._,C._,C._,C._,C._,PU,  PU2, PU,  PU2, C._,C._,C._,C._,C._,C._,C._],  //  1 hat upper
  [C._,C._,C._,C._,PU,  PU2, PU,  PU2, PU,  PU2, C._,C._,C._,C._,C._,C._],  //  2 hat mid
  [C._,C._,C._,PU2, PU,  PU,  PU2, PU,  PU2, PU,  PU2, C._,C._,C._,C._,C._],  //  3 hat brim
  [C._,C._,C._,C._,SK,  SK,  SK,  SK,  SK,  SK,  C._,C._,C._,C._,C._,C._],  //  4 face
  [C._,C._,C._,C._,SK,  SK2, SK,  SK,  SK2, SK,  C._,C._,C._,C._,C._,C._],  //  5 eyes+neck
  [C._,PU2, PU,  PU2, PU,  WH,  PU,  PU,  PU,  WH,  PU,  PU2, PU,  PU2, C._,C._],  //  6 shoulders+arms (staff right)
  [C._,PU,  PU2, PU,  PU2, PU,  PU2, BL3, BL3, PU2, PU,  PU2, PU,  PU2, C._,C._],  //  7 arms+chest gem
  [C._,PU2, PU,  PU2, PU,  PU2, GD,  PU,  PU,  GD,  PU2, PU,  PU2, PU,  SM,  C._],  //  8 staff arm + belt
  [C._,C._,PU,  PU2, PU,  PU2, PU,  PU2, PU2, PU,  PU2, PU,  PU2, PU,  SM,  C._],  //  9 lower arms+robe
  [C._,C._,C._,PU2, PU,  PU2, GD2, GD,  GD,  GD2, PU2, PU,  PU2, C._,SM,  C._],  // 10 belt + staff
  [C._,C._,C._,PU,  PU2, PU,  PU2, PU,  PU,  PU2, PU,  PU2, PU,  C._,SM,  C._],  // 11 hips + staff
  [C._,C._,C._,PU2, PU,  PU2, PU,  C._,C._,PU,  PU2, PU,  PU2, C._,C._,C._],  // 12 hip split
  [C._,C._,C._,C._,PU,  PU2, PU,  C._,C._,PU,  PU2, PU,  C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,PU2, PU,  PU2, C._,C._,PU2, PU,  PU2, C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,PU,  PU2, PU,  C._,C._,PU,  PU2, PU,  C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,PU2, PU,  PU2, C._,C._,PU2, PU,  PU2, C._,C._,C._,C._],  // 16 shin upper
  [C._,C._,C._,C._,PU,  PU2, PU,  C._,C._,PU,  PU2, PU,  C._,C._,C._,C._],  // 17 shin lower
  [C._,C._,C._,C._,PU2, PU,  C._,C._,C._,C._,PU,  PU2, C._,C._,C._,C._],  // 18 ankle
  [C._,C._,C._,C._,PU,  PU2, PU,  C._,C._,PU,  PU2, PU,  C._,C._,C._,C._],  // 19 shoe
],

// ── ROGUE ─ hood+mask, leather, dagger in right hand ─────────────
rogue:[
  [C._,C._,C._,C._,C._,C.K, C.K, C.K, C.K, C.K, C._,C._,C._,C._,C._,C._],  //  0 hood peak
  [C._,C._,C._,C._,C.K, SD,  SD,  SD,  SD,  SD,  C.K,C._,C._,C._,C._,C._],  //  1 hood upper
  [C._,C._,C._,C.K, SD,  SK3, SK2, SK2, SK2, SK3, SD,  C.K,C._,C._,C._,C._],  //  2 face
  [C._,C._,C._,C.K, SD,  SK2, C.K, SK2, SK2, C.K, SK2, SD,  C._,C._,C._,C._],  //  3 masked eyes
  [C._,C._,C._,C.K, GR,  GR2, GR,  SK3, SK3, GR,  GR2, GR,  C.K,C._,C._,C._],  //  4 scarf + chin
  [C._,C._,C._,C._,C.K, GR2, GR,  GR,  GR,  GR,  GR2, C.K, C._,C._,C._,C._],  //  5 neck/scarf
  [C._,C.K, CD,  CM,  CD,  CD,  CM,  CD,  CD,  CM,  CD,  CD,  CM,  CD,  C.K,C._],  //  6 shoulders+arms
  [SL,  SD,  CD,  CM,  CD,  GD2, CM,  CD,  CD,  CM,  GD2, CD,  CM,  CD,  SD,  SL],  //  7 arms+chest
  [SL,  SM,  CM,  CD,  CM,  CD,  CM,  CD,  CD,  CM,  CD,  CM,  CD,  CM,  SM,  SL],  //  8 arms+torso
  [C._,SL,  SD,  CM,  CD,  CM,  CD,  CM,  CM,  CD,  CM,  CD,  CM,  SD,  SL,  C._],  //  9 forearms+lower torso
  [C._,C._,SL,  SD,  GD2, GD,  CD,  CM,  CM,  CD,  GD,  GD2, SD,  SL,  C._,C._],  // 10 belt+fists
  [C._,C._,SL,  SM,  SD,  CM,  CD,  C._,C._,CD,  CM,  SD,  SM,  SL,  C._,C._],  // 11 dagger hand + hips
  [C._,C._,C._,SD,  CM,  CD,  CM,  SD,  SD,  CM,  CD,  CM,  SD,  C._,C._,C._],  // 12 hip
  [C._,C._,C._,C._,CD,  CM,  CD,  C._,C._,CD,  CM,  CD,  C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,CM,  CD,  CM,  C._,C._,CM,  CD,  CM,  C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,CD,  CM,  CD,  C._,C._,CD,  CM,  CD,  C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,CM,  CD,  CM,  C._,C._,CM,  CD,  CM,  C._,C._,C._,C._],  // 16 shin upper
  [C._,C._,C._,C._,CD,  CM,  C._,C._,C._,C._,CM,  CD,  C._,C._,C._,C._],  // 17 shin lower
  [C._,C._,C._,C._,C.K, SD,  CM,  C._,C._,CM,  SD,  C.K, C._,C._,C._,C._],  // 18 boot top
  [C._,C._,C._,C._,C.K, SD,  CM,  SD,  SD,  CM,  SD,  C.K, C._,C._,C._,C._],  // 19 boot sole
],

// ── PALADIN ─ gold plate, holy cross on chest, cape ──────────────
paladin:[
  [C._,C._,C._,C._,C._,GD,  GD2, GD,  GD,  GD2, GD,  C._,C._,C._,C._,C._],  //  0 helm crest
  [C._,C._,C._,C._,GD2, GD,  SL,  SL,  SL,  SL,  GD,  GD2, C._,C._,C._,C._],  //  1 helm top
  [C._,C._,C._,GD,  SL,  SL,  SK,  SK,  SK,  SK,  SL,  SL,  GD,  C._,C._,C._],  //  2 face+helm
  [C._,C._,C._,GD,  SL,  SK,  SK2, GD,  GD,  SK2, SK,  SL,  GD,  C._,C._,C._],  //  3 eyes/cross
  [C._,C._,C._,GD,  SL,  SK,  SK,  SK,  SK,  SK,  SK,  SL,  GD,  C._,C._,C._],  //  4 chin guard
  [C._,C._,C._,C._,GD,  GD2, GD,  GD,  GD,  GD,  GD2, GD,  C._,C._,C._,C._],  //  5 gorget
  [RD, GD,  SL,  GD,  GD2, GD,  GD,  GD,  GD,  GD,  GD,  GD2, GD,  SL,  GD,  RD],  //  6 pauldrons+cape
  [RD, GD2, SL,  SL,  GD,  GD2, WH,  GD,  GD,  WH,  GD2, GD,  SL,  SL,  GD2, RD],  //  7 arms+chest cross
  [RD, GD,  SL,  SL,  GD2, WH,  WH,  GD2, GD2, WH,  WH,  GD2, SL,  SL,  GD,  RD],  //  8 arms+cross lower
  [C._,GD2, SL,  GD,  GD2, GD,  GD,  GD,  GD,  GD,  GD,  GD2, GD,  SL,  GD2, C._],  //  9 lower arms+torso
  [C._,C._,GD,  GD2, GD,  GD2, GD,  GD2, GD2, GD,  GD2, GD,  GD2, GD,  C._,C._],  // 10 belt
  [C._,C._,GD2, GD,  SL,  GD2, GD,  C._,C._,GD,  GD2, SL,  GD,  GD2, C._,C._],  // 11 fists+hips
  [C._,C._,C._,GD,  SL,  GD,  GD2, GD,  GD,  GD2, GD,  SL,  GD,  C._,C._,C._],  // 12 hip plates
  [C._,C._,C._,C._,SL,  GD,  SL,  C._,C._,SL,  GD,  SL,  C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,GD,  SL,  GD,  C._,C._,GD,  SL,  GD,  C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,GD2, SL,  GD2, C._,C._,GD2, SL,  GD2, C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,SL,  GD,  SL,  C._,C._,SL,  GD,  SL,  C._,C._,C._,C._],  // 16 shin upper
  [C._,C._,C._,C._,GD,  SL,  GD,  C._,C._,GD,  SL,  GD,  C._,C._,C._,C._],  // 17 shin lower
  [C._,C._,C._,C._,GD2, GD,  C._,C._,C._,C._,GD,  GD2, C._,C._,C._,C._],  // 18 ankle
  [C._,C._,C._,GD2, GD,  SL,  GD,  GD2, GD2, GD,  SL,  GD,  GD2, C._,C._,C._],  // 19 sabatons
],

// ── RANGER ─ hooded cloak, bow in left hand, quiver on back ──────
ranger:[
  [C._,C._,C._,C._,C._,GR,  GR2, GR2, GR2, GR,  C._,C._,C._,C._,C._,C._],  //  0 hood tip
  [C._,C._,C._,C._,GR,  GR2, GR,  GR,  GR,  GR2, GR,  C._,C._,C._,C._,C._],  //  1 hood upper
  [C._,C._,C._,GR,  GR2, SK,  SK,  SK,  SK,  SK,  GR2, GR,  C._,C._,C._,C._],  //  2 face
  [C._,C._,C._,GR,  GR2, SK,  SK2, SK,  SK2, SK,  GR2, GR,  C._,C._,C._,C._],  //  3 eyes
  [C._,C._,C._,GR,  GR2, SK,  SK,  SK,  SK,  SK,  GR2, GR,  C._,C._,C._,C._],  //  4 chin+mouth
  [C._,C._,C._,C._,GR,  GR2, GR,  GR,  GR,  GR2, GR,  C._,C._,C._,C._,C._],  //  5 neck
  [SM,  SM,  GR2, GR,  GR2, GR,  GR2, GR,  GR,  GR2, GR,  GR2, GR,  GR2, C._,C._],  //  6 bow arm left + shoulders
  [SM,  SM,  GR,  BR2, GR2, BR,  GR,  GR2, GR2, GR,  BR,  GR2, BR2, GR,  C._,C._],  //  7 bow arm + chest
  [SM,  SM,  GR2, BR,  BR2, GR,  GR2, GR,  GR,  GR2, GR,  BR2, BR,  GR2, C._,C._],  //  8 bow arm + torso
  [C._,SM,  GR,  GR2, GR,  GR2, GR,  GR2, GR2, GR,  GR2, GR,  GR2, GR,  C._,C._],  //  9 lower arms+cloak
  [C._,C._,SM,  GR2, GR,  GD2, GR2, GR,  GR,  GR2, GD2, GR,  GR2, C._,C._,C._],  // 10 belt + bow bottom
  [C._,C._,C._,GR,  GR2, GR,  GR2, C._,C._,GR2, GR,  GR2, GR,  C._,C._,C._],  // 11 hips
  [C._,C._,C._,C._,GR2, GR,  GR2, C._,C._,GR2, GR,  GR2, C._,C._,C._,C._],  // 12 hip
  [C._,C._,C._,C._,BR,  BR2, BR,  C._,C._,BR,  BR2, BR,  C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,BR2, BR,  BR2, C._,C._,BR2, BR,  BR2, C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,BR,  BR2, BR,  C._,C._,BR,  BR2, BR,  C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,BR2, BR,  BR2, C._,C._,BR2, BR,  BR2, C._,C._,C._,C._],  // 16 shin upper
  [C._,C._,C._,C._,BR,  BR2, C._,C._,C._,C._,BR2, BR,  C._,C._,C._,C._],  // 17 shin lower
  [C._,C._,C._,C._,GR,  GR2, BR,  C._,C._,BR,  GR2, GR,  C._,C._,C._,C._],  // 18 boot top
  [C._,C._,C._,C._,GR2, GR,  GR2, GR,  GR,  GR2, GR,  GR2, C._,C._,C._,C._],  // 19 boot sole
],

// ── BARBARIAN ─ horned helm, bare arms, fur belt, axe right ──────
barbarian:[
  [C._,C._,C._,OR,  C._,C._,C._,C._,C._,C._,C._,C._,OR,  C._,C._,C._],  //  0 horn tips
  [C._,C._,OR2, OR2, C._,OR2, OR2, OR2, OR2, OR2, OR2, C._,OR2, OR2, C._,C._],  //  1 horns + helm
  [C._,C._,C._,OR,  OR2, SK,  SK,  SK,  SK,  SK,  SK,  OR2, OR,  C._,C._,C._],  //  2 face
  [C._,C._,C._,OR,  SK,  RD,  SK,  SK,  SK,  SK,  RD,  SK,  OR,  C._,C._,C._],  //  3 warpaint eyes
  [C._,C._,C._,OR,  SK,  SK,  SK2, SK,  SK,  SK2, SK,  SK,  OR,  C._,C._,C._],  //  4 jaw
  [C._,C._,C._,C._,OR,  SK3, SK2, SK3, SK3, SK2, SK3, OR,  C._,C._,C._,C._],  //  5 neck
  [SK3,SK2, SK3,SK2, SK3, OR2, SK3, OR,  OR,  SK3, OR2, SK3, SK2, SK3, SK2, SK3],  //  6 bare shoulders+arms
  [SK2,SK3, SK2,SK3, SK2, SK3, OR,  OR2, OR2, OR,  SK3, SK2, SK3, SK2, SK3, SK2],  //  7 arms+chest
  [SK3,SK2, SK3,SK2, OR2, SK3, SK2, OR,  OR,  SK2, SK3, OR2, SK2, SK3, SK2, SK3],  //  8 arms+abs
  [C._,SK2, SK3,SK2, SK3, SK2, SK3, SK2, SK2, SK3, SK2, SK3, SK2, SK3, SK2, C._],  //  9 forearms+lower abs
  [C._,C._,SK3, OR,  BR2, BR,  BR2, BR,  BR,  BR2, BR,  BR2, OR,  SK3, C._,C._],  // 10 fur belt
  [C._,C._,SK2, OR2, BR,  BR3, BR,  OR2, OR2, BR,  BR3, BR,  OR2, SK2, C._,C._],  // 11 fists+fur hip
  [C._,C._,C._,OR,  BR2, BR,  OR2, OR,  OR,  OR2, BR,  BR2, OR,  C._,C._,C._],  // 12 hip
  [C._,C._,C._,C._,OR2, OR,  OR2, C._,C._,OR2, OR,  OR2, C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,OR,  OR2, OR,  C._,C._,OR,  OR2, OR,  C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,OR2, OR,  OR2, C._,C._,OR2, OR,  OR2, C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,BR2, BR,  BR2, C._,C._,BR2, BR,  BR2, C._,C._,C._,C._],  // 16 shin upper (fur)
  [C._,C._,C._,C._,BR,  BR3, BR,  C._,C._,BR,  BR3, BR,  C._,C._,C._,C._],  // 17 shin lower
  [C._,C._,C._,C._,BR3, BR2, BR3, C._,C._,BR3, BR2, BR3, C._,C._,C._,C._],  // 18 boot top
  [C._,C._,C._,BR3, BR2, BR3, BR2, BR3, BR3, BR2, BR3, BR2, BR3, C._,C._,C._],  // 19 boot sole
],

// ── CLERIC ─ mitre hat, robes, mace right hand ───────────────────
cleric:[
  [C._,C._,C._,C._,C._,WH,  GD,  GD,  GD,  GD,  WH,  C._,C._,C._,C._,C._],  //  0 mitre top
  [C._,C._,C._,C._,WH,  GD,  WH,  GD,  GD,  WH,  GD,  WH,  C._,C._,C._,C._],  //  1 mitre cross
  [C._,C._,C._,WH,  GD,  WH,  SK,  SK,  SK,  SK,  WH,  GD,  WH,  C._,C._,C._],  //  2 face
  [C._,C._,C._,WH,  GD,  SK,  SK2, SK,  SK,  SK2, SK,  GD,  WH,  C._,C._,C._],  //  3 calm eyes
  [C._,C._,C._,WH,  GD,  SK,  SK,  SK2, SK2, SK,  SK,  GD,  WH,  C._,C._,C._],  //  4 chin
  [C._,C._,C._,C._,WH,  GD,  WH,  WH,  WH,  WH,  GD,  WH,  C._,C._,C._,C._],  //  5 collar
  [C._,WH,  GD,  WH,  GD,  WH,  GD,  WH,  WH,  GD,  WH,  GD,  WH,  GD,  WH,  C._],  //  6 shoulders+arms
  [SM,  WH,  GD,  WH,  GD2, WH,  GD,  GD2, GD2, GD,  WH,  GD2, WH,  GD,  WH,  SM],  //  7 arms+chest (mace left)
  [SM,  GD,  WH,  GD,  WH,  GD2, WH,  GD,  GD,  WH,  GD2, WH,  GD,  WH,  GD,  SM],  //  8 arms+torso
  [C._,SM,  WH,  GD,  WH,  GD,  WH,  GD,  GD,  WH,  GD,  WH,  GD,  WH,  SM,  C._],  //  9 lower arms+robe
  [C._,C._,SM,  WH,  GD2, GD,  GD2, GD,  GD,  GD2, GD,  GD2, WH,  SM,  C._,C._],  // 10 belt + mace end
  [C._,C._,C._,WH,  GD,  WH,  GD,  WH,  WH,  GD,  WH,  GD,  WH,  C._,C._,C._],  // 11 hips+robe
  [C._,C._,C._,GD,  WH,  GD,  WH,  GD,  GD,  WH,  GD,  WH,  GD,  C._,C._,C._],  // 12 hip split
  [C._,C._,C._,C._,WH,  GD,  WH,  C._,C._,WH,  GD,  WH,  C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,GD,  WH,  GD,  C._,C._,GD,  WH,  GD,  C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,WH,  GD,  WH,  C._,C._,WH,  GD,  WH,  C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,GD,  WH,  GD,  C._,C._,GD,  WH,  GD,  C._,C._,C._,C._],  // 16 shin
  [C._,C._,C._,C._,WH,  GD,  C._,C._,C._,C._,GD,  WH,  C._,C._,C._,C._],  // 17 lower shin
  [C._,C._,C._,C._,GD,  WH,  GD,  C._,C._,GD,  WH,  GD,  C._,C._,C._,C._],  // 18 sandal strap
  [C._,C._,C._,C._,GD2, GD,  GD2, GD,  GD,  GD2, GD,  GD2, C._,C._,C._,C._],  // 19 sandal sole
],

// ── DRUID ─ antler crown, bark armor, vine staff ─────────────────
druid:[
  [C._,C._,BR,  C._,C._,C._,C._,C._,C._,C._,C._,C._,C._,BR,  C._,C._],  //  0 antler tips
  [C._,C._,BR2, BR,  C._,LM2, LM,  LM2, LM2, LM,  LM2, C._,BR,  BR2, C._,C._],  //  1 antlers+leaf crown
  [C._,C._,C._,LM,  LM2, SK,  SK,  SK,  SK,  SK,  SK,  LM2, LM,  C._,C._,C._],  //  2 face
  [C._,C._,C._,LM,  LM2, SK,  TL2, SK,  SK,  TL2, SK,  LM2, LM,  C._,C._,C._],  //  3 glowing eyes
  [C._,C._,C._,LM,  LM2, SK,  SK,  SK2, SK2, SK,  SK,  LM2, LM,  C._,C._,C._],  //  4 chin
  [C._,C._,C._,C._,LM,  GR2, GR,  GR2, GR2, GR,  GR2, LM,  C._,C._,C._,C._],  //  5 neck
  [LM2, LM, GR2, GR, GR2, GR,  BR,  GR2, GR2, BR,  GR,  GR2, GR,  GR2, LM,  LM2],  //  6 bark shoulders+arms
  [LM, GR2, GR,  BR2, GR2, BR,  GR,  BR2, BR2, GR,  BR,  GR2, BR2, GR,  GR2, LM],  //  7 arms+bark chest
  [LM2, GR, BR2, GR,  BR,  GR2, BR2, GR,  GR,  BR2, GR2, BR,  GR,  BR2, GR,  LM2],  //  8 arms+bark mid
  [C._,LM, GR2, BR,  GR,  BR2, GR,  BR2, BR2, GR,  BR2, GR,  BR,  GR2, LM,  C._],  //  9 forearms+lower bark
  [C._,C._,LM2, GR,  LM,  LM2, LM,  GR2, GR2, LM,  LM2, LM,  GR,  LM2, C._,C._],  // 10 vine belt
  [C._,C._,C._,LM,  GR2, LM2, GR,  LM,  LM,  GR,  LM2, GR2, LM,  C._,C._,C._],  // 11 fists+vine hips
  [C._,C._,C._,GR2, GR,  GR2, LM,  GR,  GR,  LM,  GR2, GR,  GR2, C._,C._,C._],  // 12 hip
  [C._,C._,C._,C._,GR,  BR2, GR2, C._,C._,GR2, BR2, GR,  C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,BR2, GR,  BR,  C._,C._,BR,  GR,  BR2, C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,GR2, BR2, GR,  C._,C._,GR,  BR2, GR2, C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,BR,  GR,  BR2, C._,C._,BR2, GR,  BR,  C._,C._,C._,C._],  // 16 shin upper
  [C._,C._,C._,C._,GR2, BR,  GR,  C._,C._,GR,  BR,  GR2, C._,C._,C._,C._],  // 17 shin lower
  [C._,C._,C._,C._,GR,  GR2, BR2, C._,C._,BR2, GR2, GR,  C._,C._,C._,C._],  // 18 root boot top
  [C._,C._,C._,GR2, GR,  BR,  GR2, GR,  GR,  GR2, BR,  GR,  GR2, C._,C._,C._],  // 19 root boot sole
],
};


// ── CLASS SPRITE ALTERNATE FRAMES (for idle animation) ──────────────
// Each class has a second frame showing slight movement/effect variation
const CLASS_SPRITE_FRAMES = {

// FIGHTER frame 2: sword arm raised (right arm rows shifted up, sword tip at row 5)
fighter:[
//   0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15
  [C._,C._,C._,C._,C._,SD,  SM,  SM,  SM,  SM,  SD,  C._,C._,C._,SD,  C._],  //  0 helm+sword tip up
  [C._,C._,C._,C._,SD,  SM,  SL,  SL,  SL,  SL,  SM,  SD,  C._,C._,SM,  C._],  //  1 helm top+sword
  [C._,C._,C._,SD,  SM,  SL,  SL,  SL,  SL,  SL,  SL,  SM,  SD,  C._,SL,  C._],  //  2 helm+sword
  [C._,C._,C._,SD,  SL,  SD,  SD,  SD,  SD,  SD,  SD,  SL,  SD,  C._,SM,  C._],  //  3 visor
  [C._,C._,C._,SD,  SM,  SL,  SL,  SL,  SL,  SL,  SL,  SM,  SD,  C._,SL,  C._],  //  4 helm lower
  [C._,C._,C._,C._,SD,  SM,  SM,  SM,  SM,  SM,  SM,  SD,  C._,SL,  SM,  C._],  //  5 neck+sword grip
  [SD,  SM,  SL,  SM,  SD,  RD,  SM,  SM,  SM,  SM,  RD,  SD,  GD2, GD,  GD2, SD],  //  6 shoulders+raised sword arm
  [SD,  SL,  SM,  SL,  GD2, SM,  SM,  SM,  SM,  SM,  SM,  GD2, SL,  GD,  SL,  SD],  //  7 arms+chest+sword
  [SD,  SL,  SM,  SL,  SM,  SD,  GD,  SM,  SM,  GD,  SD,  SM,  SL,  SM,  SL,  SD],  //  8 arms+chest
  [C._,SL,  SM,  SL,  SM,  SM,  SM,  SM,  SM,  SM,  SM,  SM,  SL,  SM,  SL,  C._],  //  9 lower arms+torso
  [C._,C._,SD,  SM,  GD2, GD,  GD,  GD,  GD,  GD,  GD,  GD2, SM,  SD,  C._,C._],  // 10 belt
  [C._,C._,SD,  SM,  SL,  SM,  SD,  C._,C._,SD,  SM,  SL,  SM,  SD,  C._,C._],  // 11 fists/hips
  [C._,C._,C._,SD,  SM,  SL,  SM,  SD,  SD,  SM,  SL,  SM,  SD,  C._,C._,C._],  // 12 hip plates
  [C._,C._,C._,C._,SM,  SL,  SM,  C._,C._,SM,  SL,  SM,  C._,C._,C._,C._],  // 13 hip/thigh top
  [C._,C._,C._,C._,SM,  SL,  SM,  C._,C._,SM,  SL,  SM,  C._,C._,C._,C._],  // 14 thigh upper
  [C._,C._,C._,C._,SM,  SL,  SM,  C._,C._,SM,  SL,  SM,  C._,C._,C._,C._],  // 15 thigh lower
  [C._,C._,C._,C._,SD,  SM,  SD,  C._,C._,SD,  SM,  SD,  C._,C._,C._,C._],  // 16 knee
  [C._,C._,C._,C._,SM,  SL,  SM,  C._,C._,SM,  SL,  SM,  C._,C._,C._,C._],  // 17 shin
  [C._,C._,C._,C._,SM,  SL,  SM,  C._,C._,SM,  SL,  SM,  C._,C._,C._,C._],  // 18 lower shin
  [C._,C._,C._,SD,  SM,  SL,  SM,  SD,  SD,  SM,  SL,  SM,  SD,  C._,C._,C._],  // 19 boots
],

// WIZARD frame 2: staff glowing at tip, magic shimmer on robe
wizard:[
  [C._,C._,C._,C._,C._,C._,PU,  PU2, C._,C._,C._,C._,C._,C._,C._,C._],  //  0 hat tip
  [C._,C._,C._,C._,C._,PU,  PU2, PU,  PU2, C._,C._,C._,C._,C._,C._,C._],  //  1 hat upper
  [C._,C._,C._,C._,PU,  PU2, PU,  PU2, PU,  PU2, C._,C._,C._,C._,C._,C._],  //  2 hat mid
  [C._,C._,C._,PU2, PU,  PU,  PU2, PU,  PU2, PU,  PU2, C._,C._,C._,C._,C._],  //  3 hat brim
  [C._,C._,C._,C._,SK,  SK,  SK,  SK,  SK,  SK,  C._,C._,C._,C._,C._,C._],  //  4 face
  [C._,C._,C._,C._,SK,  SK2, SK,  SK,  SK2, SK,  C._,C._,C._,C._,C._,C._],  //  5 eyes+neck
  [C._,PU2, PU,  PU2, PU,  WH,  PU,  PU,  PU,  WH,  PU,  PU2, PU,  PU2, BL3,C._],  //  6 shoulders — staff glow tip
  [C._,PU,  PU2, PU,  PU2, PU,  PU2, BL3, BL3, PU2, PU,  PU2, PU,  PU2, BL2,C._],  //  7 arms+chest gem+staff glow
  [C._,PU2, PU,  PU2, PU,  PU2, GD,  PU,  PU,  GD,  PU2, PU,  PU2, PU,  SM,  C._],  //  8 staff arm
  [C._,C._,PU,  PU2, PU,  PU2, PU,  PU2, PU2, PU,  PU2, PU,  PU2, PU,  SM,  C._],  //  9 lower arms+robe
  [C._,C._,C._,PU2, PU,  PU2, GD2, GD,  GD,  GD2, PU2, PU,  PU2, C._,SM,  C._],  // 10 belt + staff
  [C._,C._,C._,PU,  PU2, PU,  PU2, PU,  PU,  PU2, PU,  PU2, PU,  C._,SM,  C._],  // 11 hips+staff
  [C._,C._,C._,PU2, PU,  PU2, PU,  C._,C._,PU,  PU2, PU,  PU2, C._,C._,C._],  // 12 hip split
  [C._,C._,C._,C._,PU,  PU2, PU,  C._,C._,PU,  PU2, PU,  C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,PU2, PU,  PU2, C._,C._,PU2, PU,  PU2, C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,PU,  PU2, PU,  C._,C._,PU,  PU2, PU,  C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,PU3, PU,  PU3, C._,C._,PU3, PU,  PU3, C._,C._,C._,C._],  // 16 shin — magic shimmer
  [C._,C._,C._,C._,PU,  PU2, PU,  C._,C._,PU,  PU2, PU,  C._,C._,C._,C._],  // 17 shin lower
  [C._,C._,C._,C._,PU2, PU,  C._,C._,C._,C._,PU,  PU2, C._,C._,C._,C._],  // 18 ankle
  [C._,C._,C._,C._,PU,  PU2, PU,  C._,C._,PU,  PU2, PU,  C._,C._,C._,C._],  // 19 shoe
],

// ROGUE frame 2: dagger raised high (right arm extended up)
rogue:[
  [C._,C._,C._,C._,C._,C.K, C.K, C.K, C.K, C.K, C._,C._,C._,C._,SL,  C._],  //  0 hood+dagger tip
  [C._,C._,C._,C._,C.K, SD,  SD,  SD,  SD,  SD,  C.K,C._,C._,C._,SM,  C._],  //  1 hood+dagger upper
  [C._,C._,C._,C.K, SD,  SK3, SK2, SK2, SK2, SK3, SD,  C.K,C._,C._,SD,  C._],  //  2 face+dagger
  [C._,C._,C._,C.K, SD,  SK2, C.K, SK2, SK2, C.K, SK2, SD,  C._,C._,C._,C._],  //  3 masked eyes
  [C._,C._,C._,C.K, GR,  GR2, GR,  SK3, SK3, GR,  GR2, GR,  C.K,C._,C._,C._],  //  4 scarf
  [C._,C._,C._,C._,C.K, GR2, GR,  GR,  GR,  GR,  GR2, C.K, C._,C._,C._,C._],  //  5 neck
  [C._,C.K, CD,  CM,  CD,  CD,  CM,  CD,  CD,  CM,  CD,  CD,  CM,  GD2, GD,  SL],  //  6 shoulders+arm raised+dagger
  [SL,  SD,  CD,  CM,  CD,  GD2, CM,  CD,  CD,  CM,  GD2, CD,  CM,  GD,  GD2, SL],  //  7 arms+chest+dagger hand
  [SL,  SM,  CM,  CD,  CM,  CD,  CM,  CD,  CD,  CM,  CD,  CM,  CD,  CM,  SM,  SL],  //  8 arms+torso
  [C._,SL,  SD,  CM,  CD,  CM,  CD,  CM,  CM,  CD,  CM,  CD,  CM,  SD,  SL,  C._],  //  9 forearms
  [C._,C._,SL,  SD,  GD2, GD,  CD,  CM,  CM,  CD,  GD,  GD2, SD,  SL,  C._,C._],  // 10 belt+fists
  [C._,C._,SL,  SM,  SD,  CM,  CD,  C._,C._,CD,  CM,  SD,  SM,  SL,  C._,C._],  // 11 hips
  [C._,C._,C._,SD,  CM,  CD,  CM,  SD,  SD,  CM,  CD,  CM,  SD,  C._,C._,C._],  // 12 hip
  [C._,C._,C._,C._,CD,  CM,  CD,  C._,C._,CD,  CM,  CD,  C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,CM,  CD,  CM,  C._,C._,CM,  CD,  CM,  C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,CD,  CM,  CD,  C._,C._,CD,  CM,  CD,  C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,CM,  CD,  CM,  C._,C._,CM,  CD,  CM,  C._,C._,C._,C._],  // 16 shin upper
  [C._,C._,C._,C._,CD,  CM,  C._,C._,C._,C._,CM,  CD,  C._,C._,C._,C._],  // 17 shin lower
  [C._,C._,C._,C._,C.K, SD,  CM,  C._,C._,CM,  SD,  C.K, C._,C._,C._,C._],  // 18 boot top
  [C._,C._,C._,C._,C.K, SD,  CM,  SD,  SD,  CM,  SD,  C.K, C._,C._,C._,C._],  // 19 boot sole
],

// PALADIN frame 2: cape billowed out (RD extends further, holy light pulses WH brighter)
paladin:[
  [C._,C._,C._,C._,C._,GD,  GD2, GD,  GD,  GD2, GD,  C._,C._,C._,C._,C._],  //  0 helm crest
  [C._,C._,C._,C._,GD2, GD,  SL,  SL,  SL,  SL,  GD,  GD2, C._,C._,C._,C._],  //  1 helm top
  [C._,C._,C._,GD,  SL,  SL,  SK,  SK,  SK,  SK,  SL,  SL,  GD,  C._,C._,C._],  //  2 face+helm
  [C._,C._,C._,GD,  SL,  SK,  SK2, GD,  GD,  SK2, SK,  SL,  GD,  C._,C._,C._],  //  3 eyes
  [C._,C._,C._,GD,  SL,  SK,  SK,  SK,  SK,  SK,  SK,  SL,  GD,  C._,C._,C._],  //  4 chin guard
  [C._,C._,C._,C._,GD,  GD2, GD,  GD,  GD,  GD,  GD2, GD,  C._,C._,C._,C._],  //  5 gorget
  [RD2, GD, SL,  GD,  GD2, GD,  GD,  GD,  GD,  GD,  GD,  GD2, GD,  SL,  GD,  RD2],  //  6 cape darker edge fluttered
  [RD,  GD2, SL, SL,  GD,  GD2, WH,  GD,  GD,  WH,  GD2, GD,  SL,  SL,  GD2, RD],  //  7 arms+cross
  [RD,  GD,  SL, SL,  GD2, WH,  WH,  GD2, GD2, WH,  WH,  GD2, SL,  SL,  GD,  RD],  //  8 cross lower
  [RD2, GD2, SL, GD,  GD2, GD,  GD,  GD,  GD,  GD,  GD,  GD2, GD,  SL,  GD2, RD2],  //  9 lower — cape flutter
  [C._,C._,GD,  GD2, GD,  GD2, GD,  GD2, GD2, GD,  GD2, GD,  GD2, GD,  C._,C._],  // 10 belt
  [C._,C._,GD2, GD,  SL,  GD2, GD,  C._,C._,GD,  GD2, SL,  GD,  GD2, C._,C._],  // 11 fists+hips
  [C._,C._,C._,GD,  SL,  GD,  GD2, GD,  GD,  GD2, GD,  SL,  GD,  C._,C._,C._],  // 12 hip plates
  [C._,C._,C._,C._,SL,  GD,  SL,  C._,C._,SL,  GD,  SL,  C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,GD,  SL,  GD,  C._,C._,GD,  SL,  GD,  C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,GD2, SL,  GD2, C._,C._,GD2, SL,  GD2, C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,SL,  GD,  SL,  C._,C._,SL,  GD,  SL,  C._,C._,C._,C._],  // 16 shin upper
  [C._,C._,C._,C._,GD,  SL,  GD,  C._,C._,GD,  SL,  GD,  C._,C._,C._,C._],  // 17 shin lower
  [C._,C._,C._,C._,GD2, GD,  C._,C._,C._,C._,GD,  GD2, C._,C._,C._,C._],  // 18 ankle
  [C._,C._,C._,GD2, GD,  SL,  GD,  GD2, GD2, GD,  SL,  GD,  GD2, C._,C._,C._],  // 19 sabatons
],

// RANGER frame 2: bow arm drawn back, bowstring taut
ranger:[
  [C._,C._,C._,C._,C._,GR,  GR2, GR2, GR2, GR,  C._,C._,C._,C._,C._,C._],  //  0 hood tip
  [C._,C._,C._,C._,GR,  GR2, GR,  GR,  GR,  GR2, GR,  C._,C._,C._,C._,C._],  //  1 hood upper
  [C._,C._,C._,GR,  GR2, SK,  SK,  SK,  SK,  SK,  GR2, GR,  C._,C._,C._,C._],  //  2 face
  [C._,C._,C._,GR,  GR2, SK,  SK2, SK,  SK2, SK,  GR2, GR,  C._,C._,C._,C._],  //  3 eyes
  [C._,C._,C._,GR,  GR2, SK,  SK,  SK,  SK,  SK,  GR2, GR,  C._,C._,C._,C._],  //  4 chin
  [C._,C._,C._,C._,GR,  GR2, GR,  GR,  GR,  GR2, GR,  C._,C._,C._,C._,C._],  //  5 neck
  [SM,  SM,  GR2, GR,  GR2, GR,  GR2, GR,  GR,  GR2, GR,  GR2, GR,  GR2, C._,C._],  //  6 bow arm
  [SM,  SM,  GR,  BR,  GR2, BR2, GR,  GR2, GR2, GR,  BR2, GR2, BR,  GR,  C._,C._],  //  7 bow arm drawn — arm closer to body
  [SM,  SM,  GR2, BR2, BR,  GR2, GR,  GR,  GR,  GR,  GR2, BR,  BR2, GR2, C._,C._],  //  8 arm+torso draw pose
  [C._,SM,  GR,  GR2, GR,  GR2, GR,  GR2, GR2, GR,  GR2, GR,  GR2, GR,  C._,C._],  //  9 lower arms
  [C._,C._,SM,  GR2, GR,  GD2, GR2, GR,  GR,  GR2, GD2, GR,  GR2, C._,C._,C._],  // 10 belt
  [C._,C._,C._,GR,  GR2, GR,  GR2, C._,C._,GR2, GR,  GR2, GR,  C._,C._,C._],  // 11 hips
  [C._,C._,C._,C._,GR2, GR,  GR2, C._,C._,GR2, GR,  GR2, C._,C._,C._,C._],  // 12 hip
  [C._,C._,C._,C._,BR,  BR2, BR,  C._,C._,BR,  BR2, BR,  C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,BR2, BR,  BR2, C._,C._,BR2, BR,  BR2, C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,BR,  BR2, BR,  C._,C._,BR,  BR2, BR,  C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,BR2, BR,  BR2, C._,C._,BR2, BR,  BR2, C._,C._,C._,C._],  // 16 shin upper
  [C._,C._,C._,C._,BR,  BR2, C._,C._,C._,C._,BR2, BR,  C._,C._,C._,C._],  // 17 shin lower
  [C._,C._,C._,C._,GR,  GR2, BR,  C._,C._,BR,  GR2, GR,  C._,C._,C._,C._],  // 18 boot top
  [C._,C._,C._,C._,GR2, GR,  GR2, GR,  GR,  GR2, GR,  GR2, C._,C._,C._,C._],  // 19 boot sole
],

// BARBARIAN frame 2: arms raised for battle cry, rage aura slightly different
barbarian:[
  [C._,C._,C._,OR,  C._,C._,C._,C._,C._,C._,C._,C._,OR,  C._,C._,C._],  //  0 horn tips
  [C._,C._,OR2, OR2, C._,OR2, OR2, OR2, OR2, OR2, OR2, C._,OR2, OR2, C._,C._],  //  1 horns+helm
  [C._,C._,C._,OR,  OR2, SK,  SK,  SK,  SK,  SK,  SK,  OR2, OR,  C._,C._,C._],  //  2 face
  [C._,C._,C._,OR,  SK,  RD,  SK,  SK,  SK,  SK,  RD,  SK,  OR,  C._,C._,C._],  //  3 warpaint — wider eyes for rage
  [C._,C._,C._,OR,  SK,  SK,  SK2, SK,  SK,  SK2, SK,  SK,  OR,  C._,C._,C._],  //  4 jaw
  [C._,C._,C._,C._,OR,  SK3, SK2, SK3, SK3, SK2, SK3, OR,  C._,C._,C._,C._],  //  5 neck
  [SK2,SK,  SK2,SK,  SK2, OR2, SK2, OR,  OR,  SK2, OR2, SK2, SK,  SK2, SK,  SK2],  //  6 arms raised slightly higher
  [SK,  SK2, SK, SK2, SK,  SK2, OR,  OR2, OR2, OR,  SK2, SK,  SK2, SK,  SK2, SK],  //  7 arms+chest raised
  [SK2, SK,  SK2,SK,  OR,  SK2, SK,  OR,  OR,  SK,  SK2, OR,  SK,  SK2, SK,  SK2],  //  8 arms wide
  [C._,SK,  SK2, SK,  SK2, SK,  SK2, SK,  SK,  SK2, SK,  SK2, SK,  SK2, SK,  C._],  //  9 forearms
  [C._,C._,SK2, OR,  BR,  BR2, BR,  BR,  BR,  BR,  BR2, BR,  OR,  SK2, C._,C._],  // 10 belt
  [C._,C._,SK,  OR2, BR2, BR3, BR2, OR2, OR2, BR2, BR3, BR2, OR2, SK,  C._,C._],  // 11 fur hip
  [C._,C._,C._,OR,  BR2, BR,  OR2, OR,  OR,  OR2, BR,  BR2, OR,  C._,C._,C._],  // 12 hip
  [C._,C._,C._,C._,OR2, OR,  OR2, C._,C._,OR2, OR,  OR2, C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,OR,  OR2, OR,  C._,C._,OR,  OR2, OR,  C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,OR2, OR,  OR2, C._,C._,OR2, OR,  OR2, C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,BR2, BR,  BR2, C._,C._,BR2, BR,  BR2, C._,C._,C._,C._],  // 16 shin
  [C._,C._,C._,C._,BR,  BR3, BR,  C._,C._,BR,  BR3, BR,  C._,C._,C._,C._],  // 17 shin lower
  [C._,C._,C._,C._,BR3, BR2, BR3, C._,C._,BR3, BR2, BR3, C._,C._,C._,C._],  // 18 boot top
  [C._,C._,C._,BR3, BR2, BR3, BR2, BR3, BR3, BR2, BR3, BR2, BR3, C._,C._,C._],  // 19 boot sole
],

// CLERIC frame 2: mace raised, holy glow brightens (WH -> pure white glow)
cleric:[
  [C._,C._,C._,C._,C._,WH,  GD,  GD,  GD,  GD,  WH,  C._,C._,C._,C._,C._],  //  0 mitre top
  [C._,C._,C._,C._,WH,  GD,  WH,  GD,  GD,  WH,  GD,  WH,  C._,C._,C._,C._],  //  1 mitre cross
  [C._,C._,C._,WH,  GD,  WH,  SK,  SK,  SK,  SK,  WH,  GD,  WH,  C._,C._,C._],  //  2 face
  [C._,C._,C._,WH,  GD,  SK,  SK2, SK,  SK,  SK2, SK,  GD,  WH,  C._,C._,C._],  //  3 calm eyes
  [C._,C._,C._,WH,  GD,  SK,  SK,  SK2, SK2, SK,  SK,  GD,  WH,  C._,C._,C._],  //  4 chin
  [C._,C._,C._,C._,WH,  GD,  WH,  WH,  WH,  WH,  GD,  WH,  C._,C._,C._,C._],  //  5 collar
  [C._,WH,  GD,  WH,  GD,  WH,  GD,  WH,  WH,  GD,  WH,  GD,  WH,  GD,  WH,  C._],  //  6 shoulders+arms
  [SM,  WH,  GD,  WH,  GD2, WH,  GD,  GD2, GD2, GD,  WH,  GD2, WH,  GD,  WH,  SM],  //  7 arms+chest (mace raised)
  [SM,  GD,  WH,  GD,  WH,  GD2, WH,  GD,  GD,  WH,  GD2, WH,  GD,  WH,  GD,  SM],  //  8 arms+torso
  [C._,SM,  WH,  GD,  WH,  GD,  WH,  GD,  GD,  WH,  GD,  WH,  GD,  WH,  SM,  C._],  //  9 lower arms+robe
  [C._,C._,SM,  WH,  GD2, GD,  GD2, GD,  GD,  GD2, GD,  GD2, WH,  SM,  C._,C._],  // 10 belt+mace base
  [C._,C._,C._,WH,  GD,  WH,  GD,  WH,  WH,  GD,  WH,  GD,  WH,  C._,SM,  C._],  // 11 hips+mace shaft
  [C._,C._,C._,GD,  WH,  GD,  WH,  GD,  GD,  WH,  GD,  WH,  GD,  C._,SM,  C._],  // 12 hip+mace
  [C._,C._,C._,C._,WH,  GD,  WH,  C._,C._,WH,  GD,  WH,  C._,C._,SM,  C._],  // 13 thigh+mace held
  [C._,C._,C._,C._,GD,  WH,  GD,  C._,C._,GD,  WH,  GD,  C._,C._,GD,  C._],  // 14 thigh+mace head glow
  [C._,C._,C._,C._,WH,  GD,  WH,  C._,C._,WH,  GD,  WH,  C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,GD,  WH,  GD,  C._,C._,GD,  WH,  GD,  C._,C._,C._,C._],  // 16 shin
  [C._,C._,C._,C._,WH,  GD,  C._,C._,C._,C._,GD,  WH,  C._,C._,C._,C._],  // 17 lower shin
  [C._,C._,C._,C._,GD,  WH,  GD,  C._,C._,GD,  WH,  GD,  C._,C._,C._,C._],  // 18 sandal strap
  [C._,C._,C._,C._,GD2, GD,  GD2, GD,  GD,  GD2, GD,  GD2, C._,C._,C._,C._],  // 19 sandal sole
],

// DRUID frame 2: vines glow brighter (LM->LM3), antlers sway (slight offset), nature pulse
druid:[
  [C._,C._,BR2, C._,C._,C._,C._,C._,C._,C._,C._,C._,C._,BR2, C._,C._],  //  0 antler tips (subtle sway)
  [C._,C._,BR,  BR2, C._,LM3, LM2, LM3, LM3, LM2, LM3, C._,BR2, BR,  C._,C._],  //  1 antlers+crown brighter
  [C._,C._,C._,LM2, LM3, SK,  SK,  SK,  SK,  SK,  SK,  LM3, LM2, C._,C._,C._],  //  2 face
  [C._,C._,C._,LM2, LM3, SK,  TL3, SK,  SK,  TL3, SK,  LM3, LM2, C._,C._,C._],  //  3 eyes glow brighter (TL3)
  [C._,C._,C._,LM2, LM3, SK,  SK,  SK2, SK2, SK,  SK,  LM3, LM2, C._,C._,C._],  //  4 chin
  [C._,C._,C._,C._,LM2, GR2, GR3, GR2, GR2, GR3, GR2, LM2, C._,C._,C._,C._],  //  5 neck glowing
  [LM3, LM2, GR3, GR2, GR3, GR2, BR2, GR3, GR3, BR2, GR2, GR3, GR2, GR3, LM2, LM3],  //  6 bark+vine arms glow
  [LM2, GR3, GR2, BR3, GR3, BR2, GR2, BR3, BR3, GR2, BR2, GR3, BR3, GR2, GR3, LM2],  //  7 arms+bark glow
  [LM3, GR2, BR3, GR2, BR2, GR3, BR3, GR2, GR2, BR3, GR3, BR2, GR2, BR3, GR2, LM3],  //  8 arms bark bright
  [C._,LM2, GR3, BR2, GR2, BR3, GR2, BR3, BR3, GR2, BR3, GR2, BR2, GR3, LM2, C._],  //  9 forearms glow
  [C._,C._,LM3, GR2, LM2, LM3, LM2, GR3, GR3, LM2, LM3, LM2, GR2, LM3, C._,C._],  // 10 vine belt bright
  [C._,C._,C._,LM2, GR3, LM3, GR2, LM2, LM2, GR2, LM3, GR3, LM2, C._,C._,C._],  // 11 vine hips glow
  [C._,C._,C._,GR3, GR2, GR3, LM2, GR2, GR2, LM2, GR3, GR2, GR3, C._,C._,C._],  // 12 hip
  [C._,C._,C._,C._,GR2, BR3, GR3, C._,C._,GR3, BR3, GR2, C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,BR3, GR2, BR2, C._,C._,BR2, GR2, BR3, C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,GR3, BR3, GR2, C._,C._,GR2, BR3, GR3, C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,BR2, GR2, BR3, C._,C._,BR3, GR2, BR2, C._,C._,C._,C._],  // 16 shin upper
  [C._,C._,C._,C._,GR3, BR2, GR2, C._,C._,GR2, BR2, GR3, C._,C._,C._,C._],  // 17 shin lower
  [C._,C._,C._,C._,GR2, GR3, BR3, C._,C._,BR3, GR3, GR2, C._,C._,C._,C._],  // 18 root boot top
  [C._,C._,C._,GR3, GR2, BR2, GR3, GR2, GR2, GR3, BR2, GR2, GR3, C._,C._,C._],  // 19 root boot sole
],

};

// ── ENEMY SPRITES ───────────────────────────────────────
const ENEMY_SPRITES = {
goblin:[
  [C._,C.G,C.G,C.G,C.G,C._],
  [C.G,C.L,C.W,C.W,C.L,C.G],
  [C.G,C.W,C.R,C.R,C.W,C.G],
  [C.G,C.G,C.W,C.W,C.G,C.G],
  [C._,C.G,C.G,C.G,C.G,C._],
  [C.G,C.N,C.G,C.G,C.N,C.G],
  [C._,C.N,C.G,C.G,C.N,C._],
  [C._,C._,C.N,C.N,C._,C._],
],
wolf:[
  [C.N,C._,C._,C._,C._,C.N],
  [C.N,C.N,C.N,C.N,C.N,C.N],
  [C.S,C.N,C.W,C.W,C.N,C.S],
  [C._,C.N,C.N,C.N,C.N,C._],
  [C.N,C.N,C.N,C.N,C.N,C.N],
  [C.N,C._,C.N,C.N,C._,C.N],
  [C._,C._,C.N,C.N,C._,C._],
  [C._,C.N,C._,C._,C.N,C._],
],
spider:[
  [C.K,C._,C.K,C.K,C._,C.K],
  [C._,C.K,C.K,C.K,C.K,C._],
  [C.K,C.K,C.R,C.R,C.K,C.K],
  [C.K,C.R,C.K,C.K,C.R,C.K],
  [C._,C.K,C.K,C.K,C.K,C._],
  [C.K,C._,C.K,C.K,C._,C.K],
  [C.K,C._,C._,C._,C._,C.K],
  [C._,C._,C._,C._,C._,C._],
],
skeleton:[
  [C.S,C.S,C.S,C.S,C.S,C.S],
  [C.S,C.W,C.W,C.W,C.W,C.S],
  [C.S,C.W,C.S,C.S,C.W,C.S],
  [C._,C.S,C.W,C.W,C.S,C._],
  [C.S,C.S,C.S,C.S,C.S,C.S],
  [C._,C.S,C._,C._,C.S,C._],
  [C.S,C.S,C._,C._,C.S,C.S],
  [C.S,C._,C._,C._,C._,C.S],
],
zombie:[
  [C.L,C.L,C.L,C.L,C.L,C.L],
  [C.L,C.W,C.W,C.W,C.W,C.L],
  [C.L,C.W,C.L,C.R,C.W,C.L],
  [C._,C.L,C.W,C.W,C.L,C._],
  [C.L,C.L,C.L,C.L,C.L,C.L],
  [C.L,C._,C.L,C.L,C._,C.L],
  [C._,C._,C.L,C.L,C._,C._],
  [C._,C.L,C._,C._,C.L,C._],
],
ghost:[
  [C._,C.B,C.B,C.B,C.B,C._],
  [C.B,C.W,C.W,C.W,C.W,C.B],
  [C.B,C.W,C.B,C.B,C.W,C.B],
  [C.B,C.B,C.W,C.W,C.B,C.B],
  [C.B,C.W,C.B,C.B,C.W,C.B],
  [C.B,C.B,C.B,C.B,C.B,C.B],
  [C._,C.B,C._,C._,C.B,C._],
  [C._,C._,C._,C._,C._,C._],
],
};

// ── BOSS SPRITES (larger 10×14) ─────────────────────────
const BOSS_SPRITES = {
thornwarden:[
  [C._,C.G,C.L,C.G,C.L,C.G,C.L,C.G,C._],
  [C.G,C.L,C.G,C.L,C.G,C.L,C.G,C.L,C.G],
  [C.L,C.G,C.K,C.K,C.K,C.K,C.K,C.G,C.L],
  [C.G,C.K,C.L,C.G,C.Y,C.G,C.L,C.K,C.G],
  [C.L,C.K,C.G,C.Y,C.Y,C.Y,C.G,C.K,C.L],
  [C.G,C.K,C.L,C.G,C.Y,C.G,C.L,C.K,C.G],
  [C.L,C.K,C.K,C.K,C.K,C.K,C.K,C.K,C.L],
  [C._,C.L,C.G,C.K,C.K,C.K,C.G,C.L,C._],
  [C._,C.G,C.K,C.G,C.K,C.G,C.K,C.G,C._],
  [C.L,C.G,C.K,C.L,C.K,C.L,C.K,C.G,C.L],
  [C.G,C.L,C.G,C.K,C.G,C.K,C.G,C.L,C.G],
  [C.L,C.G,C.L,C.G,C.L,C.G,C.L,C.G,C.L],
],
grakthar:[
  [C._,C._,C.S,C.X,C.X,C.S,C._,C._],
  [C._,C.S,C.X,C.W,C.W,C.X,C.S,C._],
  [C._,C.S,C.X,C.W,C.R,C.X,C.S,C._],
  [C._,C._,C.S,C.X,C.X,C.S,C._,C._],
  [C.S,C.X,C.S,C.S,C.S,C.S,C.X,C.S],
  [C.X,C.S,C.X,C.R,C.R,C.X,C.S,C.X],
  [C.S,C.X,C.S,C.S,C.S,C.S,C.X,C.S],
  [C.S,C.X,C.S,C.S,C.S,C.S,C.X,C.S],
  [C._,C.S,C.X,C.S,C.S,C.X,C.S,C._],
  [C._,C.X,C.S,C.X,C.X,C.S,C.X,C._],
  [C.X,C.S,C.X,C._,C._,C.X,C.S,C.X],
  [C.S,C.X,C._,C._,C._,C._,C.X,C.S],
],
// Vexara — crimson robed priestess
vexara:[
  [C._,C._,C.X,C.R,C.R,C.X,C._,C._],
  [C._,C.X,C.R,C.P,C.P,C.R,C.X,C._],
  [C.X,C.R,C.P,C.W,C.W,C.P,C.R,C.X],
  [C.R,C.P,C.W,C.R,C.R,C.W,C.P,C.R],
  [C.X,C.R,C.P,C.W,C.W,C.P,C.R,C.X],
  [C._,C.X,C.R,C.P,C.P,C.R,C.X,C._],
  [C._,C.P,C.R,C.X,C.X,C.R,C.P,C._],
  [C.P,C.R,C.X,C.P,C.P,C.X,C.R,C.P],
  [C.R,C.X,C.P,C.R,C.R,C.P,C.X,C.R],
  [C._,C.R,C.X,C.R,C.R,C.X,C.R,C._],
  [C._,C.X,C.R,C._,C._,C.R,C.X,C._],
  [C.X,C.R,C._,C._,C._,C._,C.R,C.X],
],
// Nethrix — void entity
nethrix:[
  [C._,C.P,C.K,C.K,C.K,C.K,C.P,C._],
  [C.P,C.K,C.B,C.B,C.B,C.B,C.K,C.P],
  [C.K,C.B,C.P,C.W,C.W,C.P,C.B,C.K],
  [C.B,C.P,C.W,C.K,C.K,C.W,C.P,C.B],
  [C.K,C.B,C.P,C.W,C.W,C.P,C.B,C.K],
  [C.P,C.K,C.B,C.P,C.P,C.B,C.K,C.P],
  [C.K,C.P,C.K,C.B,C.B,C.K,C.P,C.K],
  [C.B,C.K,C.P,C.K,C.K,C.P,C.K,C.B],
  [C.P,C.B,C.K,C.P,C.P,C.K,C.B,C.P],
  [C._,C.P,C.B,C.K,C.K,C.B,C.P,C._],
  [C._,C.K,C.P,C.B,C.B,C.P,C.K,C._],
  [C.K,C.P,C._,C._,C._,C._,C.P,C.K],
],
// Zareth — demon lord
zareth:[
  [C.X,C.R,C.X,C.R,C.R,C.X,C.R,C.X],
  [C.R,C.X,C.R,C.Y,C.Y,C.R,C.X,C.R],
  [C.X,C.R,C.Y,C.X,C.X,C.Y,C.R,C.X],
  [C.R,C.Y,C.X,C.R,C.R,C.X,C.Y,C.R],
  [C.X,C.R,C.Y,C.X,C.X,C.Y,C.R,C.X],
  [C.R,C.X,C.R,C.Y,C.Y,C.R,C.X,C.R],
  [C.X,C.R,C.X,C.R,C.R,C.X,C.R,C.X],
  [C.R,C.X,C.R,C.X,C.X,C.R,C.X,C.R],
  [C.X,C.R,C.X,C.R,C.R,C.X,C.R,C.X],
  [C.R,C.X,C.R,C.X,C.X,C.R,C.X,C.R],
  [C.X,C.R,C.X,C._,C._,C.X,C.R,C.X],
  [C.R,C.X,C._,C._,C._,C._,C.X,C.R],
],
};

// ── RENDER PIXEL SPRITE ──────────────────────────────────
function renderSprite(data, cellSize, container) {
  container.innerHTML = '';
  const cols = data[0].length;
  const rows = data.length;
  container.style.display = 'grid';
  container.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
  container.style.gap = '0px';
  container.style.imageRendering = 'pixelated';
  data.forEach(row => {
    row.forEach(color => {
      const cell = document.createElement('div');
      cell.style.width = cellSize + 'px';
      cell.style.height = cellSize + 'px';
      cell.style.background = color || 'transparent';
      container.appendChild(cell);
    });
  });
}

// ══════════════════════════════════════════════════════════
//  GAME DATA
// ══════════════════════════════════════════════════════════
const CLASSES = {
  fighter:{name:'Fighter',res:'Momentum',resColor:'#d35400',resMax:100,resPerTick:10,
    desc:'Master of weapons and armor. Second Wind and Action Surge make you relentless.',
    baseStats:{str:16,dex:12,con:15,int:10,wis:11,cha:10},baseHp:12,hpPerLvl:7,
    saves:['str','con'],critRange:20,
    subclass:{name:'Champion',desc:'Your critical hit range expands and you gain the Survivor passive.',
      perks:['Improved Critical: crit on 19-20','Remarkable Athlete: +2 STR checks','Survivor: regen 5+CON HP at start of turn below half HP']},
    skills:[
      {id:'attack',name:'Attack',type:'action',icon:'⚔️',desc:'Basic weapon strike (d8+STR)',cd:0,cost:0,effect:'basic_attack'},
      {id:'power_strike',name:'Power Strike',type:'action',icon:'💪',desc:'2.2× dmg + Vulnerable debuff',cd:4,cost:50,effect:'power_strike'},
      {id:'second_wind',name:'Second Wind',type:'bonus',icon:'🫀',desc:'Heal 1d10+LVL HP',cd:0,cost:0,charges:3,effect:'second_wind'},
      {id:'parry',name:'Parry',type:'reaction',icon:'🛡',desc:'Halve next hit damage',cd:0,cost:0,charges:3,effect:'parry'},
      {id:'surge_strike',name:'Surge Strike',type:'action',icon:'⚡',desc:'2d10+STR — if it crits, gain a bonus action',cd:3,cost:40,subclassOnly:true,effect:'surge_strike'},
      {id:'action_surge',name:'Action Surge',type:'action',icon:'🌪️',desc:'Extra turn: halved costs, crit 17-20 (once per rest)',cd:0,cost:0,ultimateOnly:true,effect:'action_surge'},
    ]},
  wizard:{name:'Wizard',res:'Spell Slots',resColor:'#2980b9',resMax:7,
    desc:'Arcane scholar who bends reality. Cantrips are free; spell slots power devastating magic.',
    baseStats:{str:8,dex:14,con:12,int:17,wis:13,cha:11},baseHp:6,hpPerLvl:4,
    saves:['int','wis'],critRange:20,
    spellSlots:{1:4,2:2,3:1},
    subclass:{name:'Evoker',desc:'Your evocation spells deal maximum damage.',
      perks:['Sculpt Spells: protect allies from AoE','Potent Cantrip: half damage on miss','Empowered Evocation: +INT to spell damage','Overchannel: maximize one spell per short rest']},
    skills:[
      {id:'fire_bolt',name:'Fire Bolt',type:'action',icon:'🔥',desc:'1d10+INT fire (cantrip, free)',cd:0,cost:0,effect:'fire_bolt'},
      {id:'magic_missile',name:'Magic Missile',type:'action',icon:'✨',desc:'3×(1d4+1) — uses LVL1 slot',cd:0,cost:0,slotCost:1,effect:'magic_missile'},
      {id:'fireball',name:'Fireball',type:'action',icon:'💥',desc:'8d6 fire — may Burn enemy (LVL3)',cd:0,cost:0,slotCost:3,effect:'fireball'},
      {id:'mirror_image',name:'Mirror Image',type:'bonus',icon:'🪞',desc:'3 illusory copies — 33% dodge',cd:0,cost:0,slotCost:2,effect:'mirror_image'},
      {id:'blink',name:'Blink',type:'reaction',icon:'💫',desc:'Teleport — 60% negate incoming hit',cd:0,cost:0,slotCost:2,effect:'blink'},
      {id:'counterspell',name:'Counterspell',type:'reaction',icon:'🔮',desc:'Negate boss special — LVL3',cd:0,cost:0,slotCost:3,effect:'counterspell'},
      {id:'empowered_blast',name:'Empowered Blast',type:'action',icon:'💎',desc:'4d8+INT fire — all dice maximized',cd:0,cost:0,slotCost:2,subclassOnly:true,effect:'empowered_blast'},
      {id:'time_stop',name:'Time Stop',type:'action',icon:'⏳',desc:'3 free actions, enemy frozen, 0 slot cost (once per rest)',cd:0,cost:0,ultimateOnly:true,effect:'time_stop'},
    ]},
  rogue:{name:'Rogue',res:'Combo Points',resColor:'#27ae60',resMax:6,
    desc:'Cunning opportunist. Build Combo Points with attacks, unleash Sneak Attack for massive bursts.',
    baseStats:{str:10,dex:17,con:12,int:13,wis:11,cha:14},baseHp:8,hpPerLvl:5,
    saves:['dex','int'],critRange:20,
    subclass:{name:'Thief',desc:'Fast Hands lets you use objects as a bonus action.',
      perks:['Fast Hands: Use Object as bonus action','Second-Story Work: full speed climbing','Supreme Sneak: advantage in dim light','Use Magic Device: ignore class requirements on magic items']},
    skills:[
      {id:'attack',name:'Attack',type:'action',icon:'🗡',desc:'Quick strike — builds 1 Combo',cd:0,cost:0,effect:'basic_attack'},
      {id:'sneak_attack',name:'Sneak Attack',type:'action',icon:'🎯',desc:'3d6+LVL scaling — costs 2 Combo',cd:0,cost:0,comboReq:2,effect:'sneak_attack'},
      {id:'cunning_action',name:'Cunning Action',type:'bonus',icon:'💨',desc:'Disengage — dodge next hit',cd:0,cost:0,charges:3,effect:'cunning_action'},
      {id:'uncanny_dodge',name:'Uncanny Dodge',type:'reaction',icon:'👁',desc:'Halve damage from one attack',cd:0,cost:0,charges:3,effect:'uncanny_dodge'},
      {id:'pickpocket',name:'Pickpocket',type:'bonus',icon:'🎭',desc:'Steal: Potion (50%), 30g (30%), or material (20%)',cd:5,cost:0,subclassOnly:true,effect:'pickpocket'},
      {id:'vanishing_act',name:'Vanishing Act',type:'bonus',icon:'🌑',desc:'Untargetable 2 rounds, next attack auto-crits (once per rest)',cd:0,cost:0,ultimateOnly:true,effect:'vanishing_act'},
    ]},
  paladin:{name:'Paladin',res:'Holy Power',resColor:'#f39c12',resMax:5,
    desc:'Holy warrior. Build Holy Power through battle and spend it on Divine Smite.',
    baseStats:{str:16,dex:10,con:14,int:10,wis:12,cha:16},baseHp:10,hpPerLvl:6,
    saves:['wis','cha'],critRange:20,
    subclass:{name:'Oath of Devotion',desc:'Sacred Weapon and Holy Nimbus define the devoted champion.',
      perks:['Sacred Weapon: +CHA to attack rolls','Holy Nimbus: enemies take 10 radiant/round','Aura of Devotion: immunity to Charmed','Purity of Spirit: always under Protection from Evil']},
    skills:[
      {id:'attack',name:'Attack',type:'action',icon:'⚔️',desc:'Weapon strike — builds 1 Holy Power',cd:0,cost:0,effect:'basic_attack'},
      {id:'divine_smite',name:'Divine Smite',type:'action',icon:'✨',desc:'3d8 radiant — costs 2 Holy Power',cd:0,cost:2,effect:'divine_smite'},
      {id:'lay_on_hands',name:'Lay on Hands',type:'bonus',icon:'🙏',desc:'Heal 2d8+LVL from pool',cd:0,cost:0,charges:3,effect:'lay_on_hands'},
      {id:'divine_shield',name:'Divine Shield',type:'reaction',icon:'⚜️',desc:'Block next attack entirely',cd:0,cost:3,charges:3,effect:'divine_shield'},
      {id:'sacred_weapon',name:'Sacred Weapon',type:'bonus',icon:'🌟',desc:'+1d6 radiant & heal 3 HP per hit for 3 turns',cd:0,cost:2,subclassOnly:true,effect:'sacred_weapon'},
      {id:'divine_intervention_ult',name:'Divine Intervention',type:'action',icon:'😇',desc:'6d10 radiant, full heal, remove conditions, restore 5 HP (once per rest)',cd:0,cost:0,ultimateOnly:true,effect:'divine_intervention_ult'},
    ]},
  ranger:{name:'Ranger',res:'Focus',resColor:'#16a085',resMax:5,resPerTick:1,
    desc:"Swift hunter. Hunter's Mark boosts all damage; your beast companion fights beside you.",
    baseStats:{str:12,dex:16,con:13,int:12,wis:15,cha:10},baseHp:10,hpPerLvl:6,
    saves:['str','dex'],critRange:20,
    subclass:{name:'Beast Master',desc:"Your beast companion becomes a true combat partner.",
      perks:["Beast Companion attacks as bonus action","Beast's Defense: reduce your damage by 2","Coordinated Attack: both you and beast attack","Beastial Fury: companion deals +1d6 damage"]},
    skills:[
      {id:'attack',name:'Attack',type:'action',icon:'🏹',desc:'Ranged strike',cd:0,cost:0,effect:'basic_attack'},
      {id:'hunters_mark',name:"Hunter's Mark",type:'bonus',icon:'🎯',desc:'Mark target: +1d6 per hit',cd:0,cost:1,charges:3,effect:'hunters_mark'},
      {id:'volley',name:'Volley',type:'action',icon:'🌧',desc:'3 quick arrows at 0.8× each',cd:4,cost:0,effect:'volley'},
      {id:'beasts_aid',name:"Beast's Aid",type:'reaction',icon:'🐺',desc:'Companion takes hit for you',cd:0,cost:0,charges:3,effect:'beasts_aid'},
      {id:'pack_hunt',name:'Pack Hunt',type:'action',icon:'🐺',desc:'You and beast strike together — both hits apply Mark',cd:0,cost:2,subclassOnly:true,effect:'pack_hunt'},
      {id:'hail_of_arrows',name:'Hail of Arrows',type:'action',icon:'🌧️',desc:'10d6+DEX, free Mark, Restrain 2 turns (once per rest)',cd:0,cost:0,ultimateOnly:true,effect:'hail_of_arrows'},
    ]},
  barbarian:{name:'Barbarian',res:'Rage',resColor:'#c0392b',resMax:100,
    desc:'Primal fury made flesh. Enter Rage for massive damage bonuses and physical resistance.',
    baseStats:{str:17,dex:13,con:16,int:8,wis:11,cha:9},baseHp:12,hpPerLvl:7,
    saves:['str','con'],critRange:20,
    subclass:{name:'Berserker',desc:'Frenzy lets you attack twice while raging — no exhaustion.',
      perks:['Frenzy: extra attack while raging (no exhaustion)','Mindless Rage: immune to Charmed/Frightened while raging','Intimidating Presence: frighten enemy as bonus action','Retaliation: counter-attack when hit as reaction']},
    skills:[
      {id:'attack',name:'Attack',type:'action',icon:'🪓',desc:'Mighty melee strike',cd:0,cost:0,effect:'basic_attack'},
      {id:'rage',name:'Rage',type:'bonus',icon:'😡',desc:'Enter Rage: +2+LVL/4 dmg, resist phys',cd:0,cost:0,charges:3,effect:'rage'},
      {id:'reckless',name:'Reckless Attack',type:'action',icon:'💥',desc:'1.75× damage, take 5+LVL/2 recoil',cd:0,cost:0,effect:'reckless_attack'},
      {id:'retaliation',name:'Retaliation',type:'reaction',icon:'⚡',desc:'Counter-attack when hit',cd:0,cost:0,charges:3,effect:'retaliation'},
      {id:'frenzy_attack',name:'Frenzy Attack',type:'passive',icon:'🩸',desc:'Auto extra attack while raging — +1d6 dmg',cd:0,cost:0,rageReq:true,subclassOnly:true,effect:'frenzy_attack'},
      {id:'world_breaker',name:'World Breaker',type:'action',icon:'🌍',desc:'5d12+STR, cannot miss, double if enemy has conditions (once per rest)',cd:0,cost:0,ultimateOnly:true,effect:'world_breaker'},
    ]},
  cleric:{name:'Cleric',res:'Devotion',resColor:'#f1c40f',resMax:5,resPerTick:0.5,
    desc:'Divine spellcaster. Heal yourself to outlast enemies, smite undead with Channel Divinity.',
    baseStats:{str:13,dex:10,con:14,int:12,wis:17,cha:14},baseHp:8,hpPerLvl:5,
    saves:['wis','cha'],critRange:20,
    subclass:{name:'Life Domain',desc:'Every heal restores extra HP. You are nearly unkillable.',
      perks:['Disciple of Life: +2+slot HP on every heal','Blessed Healer: self-heal 2+slot when healing','Divine Strike: +1d8 radiant to weapon attacks','Supreme Healing: use maximum roll for healing']},
    skills:[
      {id:'sacred_flame',name:'Sacred Flame',type:'action',icon:'☀️',desc:'1d8+LVL/4 radiant (cantrip, free)',cd:0,cost:0,effect:'sacred_flame'},
      {id:'healing_word',name:'Healing Word',type:'bonus',icon:'💚',desc:'Heal 1d4+WIS HP',cd:0,cost:1,charges:3,effect:'healing_word'},
      {id:'channel_divinity',name:'Channel Divinity',type:'action',icon:'✝️',desc:'3d8+WIS heal, or smite undead',cd:5,cost:0,effect:'channel_divinity'},
      {id:'spiritual_weapon',name:'Spiritual Weapon',type:'bonus',icon:'⚔️',desc:'Spectral weapon: 1d8+WIS each turn',cd:0,cost:2,charges:3,effect:'spiritual_weapon'},
      {id:'preserve_life',name:'Preserve Life',type:'action',icon:'💛',desc:'Heal 3d8+WIS — cannot be blocked',cd:4,cost:3,subclassOnly:true,effect:'preserve_life'},
      {id:'miracle',name:'Miracle',type:'action',icon:'✨',desc:'Full heal, 4d10 radiant, remove conditions, restore Devotion (once per rest)',cd:0,cost:0,ultimateOnly:true,effect:'miracle'},
    ]},
  druid:{name:'Druid',res:"Nature's Charge",resColor:'#27ae60',resMax:4,
    desc:"Nature's guardian. Wild Shape gives you a second HP pool; spells control the battlefield.",
    baseStats:{str:12,dex:12,con:13,int:13,wis:17,cha:12},baseHp:8,hpPerLvl:5,
    saves:['int','wis'],critRange:20,
    subclass:{name:'Circle of the Moon',desc:'Your Wild Shape forms are stronger and can be used in combat.',
      perks:['Combat Wild Shape: transform as bonus action','Higher CR beast forms','Elemental Wild Shape: become an elemental','Thousand Forms: cast Alter Self at will']},
    skills:[
      {id:'thorn_whip',name:'Thorn Whip',type:'action',icon:'🌱',desc:'1d8+WIS (cantrip, poisons on crit)',cd:0,cost:0,effect:'thorn_whip'},
      {id:'wild_shape',name:'Wild Shape',type:'bonus',icon:'🐻',desc:'Bear form: +20+LVL×3 HP, melee only',cd:0,cost:1,charges:3,effect:'wild_shape'},
      {id:'claw_strike',name:'Claw Strike',type:'action',icon:'🐾',desc:'2d6+STR bear claws (bear form only)',cd:0,cost:0,effect:'claw_strike'},
      {id:'moonbeam',name:'Moonbeam',type:'action',icon:'🌙',desc:'2d10 radiant beam',cd:0,cost:2,effect:'moonbeam'},
      {id:'entangle',name:'Entangle',type:'action',icon:'🌿',desc:'Restrain enemy 2 turns (STR save)',cd:3,cost:1,effect:'entangle'},
      {id:'elemental_strike',name:'Elemental Strike',type:'action',icon:'🌊',desc:'2d8+STR + 1d6 elemental (bear form only)',cd:0,cost:1,bearReq:true,subclassOnly:true,effect:'elemental_strike'},
      {id:'elemental_wild_shape',name:'Elemental Form',type:'bonus',icon:'🔥',desc:'Become an elemental: +30+LVL×4 HP, bonus fire dmg, immune Poison/Frightened',cd:0,cost:2,charges:1,subclassOnly:true,effect:'elemental_wild_shape'},
      {id:'primal_avatar',name:'Primal Avatar',type:'bonus',icon:'🌿',desc:'+80 temp HP, 3d6 nature dmg, immune conditions, 4 turns (once per rest)',cd:0,cost:0,ultimateOnly:true,effect:'primal_avatar'},
    ]},
};

// ── COMPANION & SPIRITUAL WEAPON SPRITES ────────────────
const COMPANION_SPRITES = {
  // Druid bear form — chunky, broad, intimidating
  bear:[
    [C.N,C._,C.N,C.N,C.N,C._,C.N],
    [C.N,C.N,C.N,C.N,C.N,C.N,C.N],
    [C.N,C.T,C.T,C.T,C.T,C.T,C.N],
    [C.N,C.T,C.K,C.W,C.K,C.T,C.N],
    [C.N,C.T,C.W,C.K,C.W,C.T,C.N],
    [C._,C.N,C.N,C.N,C.N,C.N,C._],
    [C.N,C.N,C.T,C.T,C.T,C.N,C.N],
    [C.N,C.T,C.T,C.T,C.T,C.T,C.N],
    [C.N,C.N,C.T,C.T,C.T,C.N,C.N],
    [C.N,C.T,C._,C.T,C._,C.T,C.N],
    [C.T,C.N,C._,C.T,C._,C.N,C.T],
    [C.N,C._,C._,C.T,C._,C._,C.N],
  ],
  // Ranger wolf companion — warm brown, loyal look
  wolf:[
    [C._,C.N,C.N,C.N,C.N,C.N,C._],
    [C.N,C.N,C.T,C.T,C.T,C.N,C.N],
    [C.T,C.N,C.W,C.W,C.N,C.N,C.T],
    [C._,C.T,C.T,C.T,C.T,C.T,C._],
    [C.N,C.T,C.N,C.N,C.T,C.N,C.N],
    [C.T,C.N,C.T,C.T,C.N,C.T,C.N],
    [C._,C._,C.N,C.N,C._,C.N,C._],
    [C._,C.N,C._,C._,C.N,C._,C._],
  ],
  // Spiritual weapon — spectral floating sword shape
  sword:[
    [C._,C._,C.B,C._,C._],
    [C._,C.B,C.E,C.B,C._],
    [C._,C.B,C.E,C.B,C._],
    [C.B,C.E,C.W,C.E,C.B],
    [C.B,C.E,C.W,C.E,C.B],
    [C._,C.B,C.E,C.B,C._],
    [C._,C._,C.B,C.B,C._],
    [C._,C._,C._,C.B,C._],
    [C._,C._,C.B,C.B,C._],
    [C._,C.B,C.B,C._,C._],
  ],
};

// ── CAMPFIRE SPRITE (12×14 pixel art) ──────────────────────
const FY1='#ff6600'; const FY2='#dd2200'; const FY3='#ffdd00';
const FY4='#aa1800'; const FY5='#ff8800';
const LG1='#5a3010'; const LG2='#7a4820'; const LG3='#3a1808';
const EM='#cc4400'; const ASH='#2a1a10';
const CAMPFIRE_SPRITE=[
  [C._,C._,C._,C._,C._,FY3,C._,C._,C._,C._,C._,C._],
  [C._,C._,C._,C._,FY3,FY3,FY3,C._,C._,C._,C._,C._],
  [C._,C._,C._,FY3,FY1,FY3,FY1,FY3,C._,C._,C._,C._],
  [C._,C._,FY1,FY3,FY2,FY3,FY2,FY1,FY3,C._,C._,C._],
  [C._,FY5,FY1,FY2,FY3,FY2,FY3,FY2,FY1,FY5,C._,C._],
  [C._,FY2,FY1,FY3,FY1,FY3,FY1,FY3,FY1,FY2,C._,C._],
  [C._,FY4,FY2,FY1,FY2,FY1,FY2,FY1,FY2,FY4,C._,C._],
  [C._,C._,EM, FY4,FY2,FY4,FY2,FY4,EM, C._,C._,C._],
  [C._,LG3,LG1,LG2,EM, LG2,EM, LG2,LG1,LG3,C._,C._],
  [LG3,LG1,LG2,LG2,LG1,LG2,LG1,LG2,LG2,LG1,LG3,C._],
  [LG3,LG2,LG3,LG1,LG2,LG1,LG2,LG1,LG3,LG2,LG3,C._],
  [C._,LG3,ASH,LG3,ASH,LG3,ASH,LG3,ASH,LG3,C._,C._],
  [C._,C._,ASH,ASH,ASH,ASH,ASH,ASH,ASH,C._,C._,C._],
  [C._,C._,C._,ASH,ASH,ASH,ASH,ASH,C._,C._,C._,C._],
];
const CAMPFIRE_FRAME2=[
  [C._,C._,C._,C._,C._,C._,FY3,C._,C._,C._,C._,C._],
  [C._,C._,C._,C._,FY3,FY1,FY3,FY3,C._,C._,C._,C._],
  [C._,C._,C._,FY1,FY3,FY2,FY1,FY3,FY1,C._,C._,C._],
  [C._,C._,FY3,FY1,FY2,FY3,FY2,FY1,FY3,FY1,C._,C._],
  [C._,FY1,FY3,FY2,FY3,FY1,FY3,FY2,FY3,FY1,FY5,C._],
  [C._,FY2,FY1,FY3,FY2,FY3,FY1,FY3,FY2,FY2,C._,C._],
  [C._,FY4,FY2,FY1,FY3,FY1,FY3,FY1,FY2,FY4,C._,C._],
  [C._,C._,EM, FY4,FY2,FY4,FY2,FY4,EM, C._,C._,C._],
  [C._,LG3,LG1,LG2,EM, LG2,EM, LG2,LG1,LG3,C._,C._],
  [LG3,LG1,LG2,LG2,LG1,LG2,LG1,LG2,LG2,LG1,LG3,C._],
  [LG3,LG2,LG3,LG1,LG2,LG1,LG2,LG1,LG3,LG2,LG3,C._],
  [C._,LG3,ASH,LG3,ASH,LG3,ASH,LG3,ASH,LG3,C._,C._],
  [C._,C._,ASH,ASH,ASH,ASH,ASH,ASH,ASH,C._,C._,C._],
  [C._,C._,C._,ASH,ASH,ASH,ASH,ASH,C._,C._,C._,C._],
];
let _cfFrame=0;


// ══════════════════════════════════════════════════════════
//  NARRATIVE SYSTEM
// ══════════════════════════════════════════════════════════

// The overarching story: The player was once a warrior who sealed an ancient god called
// The Unnamed beneath the world. That seal is crumbling. Each boss holds a memory shard —
// a fragment of the player's forgotten past life. The descent is a return.

const GAME_INTRO = {
  title: "The World is Bleeding",
  lines: [
    "Seven days ago, the sky turned the color of a bruise.",
    "The scholars call it the Unraveling. The priests call it punishment. The soldiers just call it the end.",
    "You call it familiar.",
    "Somewhere deep beneath the roots of the world, something enormous is waking up.",
    "You don't know how you know this. You don't know why your hands remember the weight of a weapon you've never held.",
    "But every night, the same dream: a door of black iron, a name you spoke to seal it, and the terrible feeling of choosing to forget.",
    "The descent is not an adventure.",
    "It is a return.",
  ]
};

// Memory shards revealed after each boss death — fragments of the player's past life
const LORE_REVEALS = [
  // Zone 0 — Thornwarden
  {
    title: "A Memory Stirs",
    icon: "🌿",
    lines: [
      "As the Thornwarden falls, something loosens in your chest.",
      "A flash: these same woods, three hundred years ago. You stood here then too.",
      "You were not alone. There was another — someone you trusted with everything.",
      "The memory dissolves before you see their face.",
      "But the woods remember you. The roots part as you walk."
    ]
  },
  // Zone 1 — Grakthar
  {
    title: "The Warlord's Last Word",
    icon: "💀",
    lines: [
      "Grakthar's armor cracks. Behind the dead eyes, something ancient flickers.",
      "\"You...,\" the warlord rasps. \"I know your face. We fought together once.\"",
      "\"You were the one who opened the door. Before you closed it.\"",
      "He collapses. The garrison falls silent.",
      "Opened it. The words echo in a part of your mind you didn't know existed."
    ]
  },
  // Zone 2 — Vexara
  {
    title: "The Priestess's Confession",
    icon: "🔮",
    lines: [
      "With her last breath, Vexara presses a burning sigil into your palm.",
      "\"The Unnamed told us you would come,\" she whispers. \"It has been waiting.\"",
      "\"You sealed it with a name — your true name. The one you buried.\"",
      "\"It has been whispering that name into every dark thing for three centuries.\"",
      "\"That's why they all fight so hard. They're trying to give you back to it.\""
    ]
  },
  // Zone 3 — Nethrix
  {
    title: "The Devourer's Gift",
    icon: "🧠",
    lines: [
      "Nethrix dissolves, but not before flooding your mind with a vision:",
      "A throne room beneath the world. You, kneeling. A god with no face.",
      "\"You loved someone,\" the memory shows. \"Enough to seal yourself away with me.\"",
      "\"But you were clever. You hid a piece of yourself in the world above.\"",
      "\"A seed. A name. A body that would find its way back down.\"",
      "You are that seed. You have always been descending."
    ]
  },
  // Zone 4 — Zareth
  {
    title: "The Abyss Speaks",
    icon: "🌀",
    lines: [
      "The gate begins to close as Zareth falls. But a voice bleeds through — not the demon's.",
      "It is your voice. From three hundred years ago.",
      "\"When you return, you will remember everything. It will hurt.\"",
      "\"But you have to finish what you started. The seal was never meant to last forever.\"",
      "\"I left you something at the bottom. Something that ends this properly.\"",
      "\"I left you the truth.\""
    ]
  },
  // Zone 5 — Valdris
  {
    title: "The Titan Remembers",
    icon: "❄️",
    lines: [
      "As Valdris crumbles to ice, his final exhale forms words:",
      "\"The old war... the one the gods erased from history...\"",
      "\"You fought on the wrong side. That's why you had to seal it yourself.\"",
      "\"No army would follow you. No god would help.\"",
      "\"You walked down alone. And you put yourself in the lock.\"",
      "The cold is absolute. But you feel, for the first time, completely certain of something.",
      "You are almost home."
    ]
  },
  // Zone 6 — Auranthos
  {
    title: "The God's Confession",
    icon: "✨",
    lines: [
      "Auranthos — the Blind God — weeps as it dies.",
      "\"We voted to seal it with you inside,\" it confesses. \"We were afraid of you both.\"",
      "\"You were more powerful. The Unnamed knew your name because you gave it to them.\"",
      "\"You loved each other. That is what the gods could not allow.\"",
      "\"We told the world you were a hero. We buried the rest.\"",
      "The celestial plane shudders. Somewhere far below, something ancient stirs.",
      "It has felt you approaching for a long time."
    ]
  },
  // Zone 7 — Final boss (to be shown after defeating the Hollow Empress)
  {
    title: "The Truth at the Bottom",
    icon: "🌑",
    lines: [
      "The Hollow Empress is gone. The throne of extinguished suns is empty.",
      "And there, in the silence, you finally remember everything.",
      "The Unnamed was not a monster. It was a god that refused to be controlled.",
      "You were its champion. Its only friend. And when the other gods came to unmake it —",
      "— you chose to become the seal yourself. To be forgotten. To descend, again and again, until the world was ready.",
      "The seal breaks. Not with violence. With recognition.",
      "The Unnamed opens its eyes for the first time in three centuries.",
      "It says your name.",
      "You remember it.",
      "The descent is finally over."
    ]
  },
];

const ZONES = [
  {id:'woods',name:'Whispering Woods',num:'I',reqLvl:1,kills:8,
   bgSky:'bg-woods-sky',bgGround:'bg-ground-woods',showTrees:true,
   story:{title:'The Whispering Woods',
     text:'"The road into the Whispering Woods is overgrown and silent. The trees list toward you as you pass — not with malice, but recognition. As if they have been waiting. You have had this feeling before, in dreams. Your hands know the path before your eyes do."'},
   enemies:[
     {id:'goblin',name:'Goblin Scout',sprite:'goblin',color:'#2d6b3a',hp:14,atk:4,def:0,xp:8,gold:3,saveType:'dex',saveDC:10},
     {id:'wolf',name:'Forest Wolf',sprite:'wolf',color:'#5a5a4a',hp:20,atk:6,def:1,xp:12,gold:4,saveType:'str',saveDC:11},
     {id:'spider',name:'Giant Spider',sprite:'spider',color:'#3a2a4a',hp:16,atk:7,def:1,xp:10,gold:3,saveType:'dex',saveDC:11,canPoison:true},
     {id:'zombie',name:'Treant Sapling',sprite:'zombie',color:'#3a5a2a',hp:24,atk:5,def:3,xp:11,gold:4,saveType:'str',saveDC:11,dropMat:'herb'},
     {id:'skeleton',name:'Bog Witch',sprite:'skeleton',color:'#4a6a3a',hp:12,atk:8,def:0,xp:9,gold:4,saveType:'int',saveDC:11,canPoison:true,dropMat:'herb'},
   ],
   boss:{id:'thornwarden',name:'The Thornwarden',title:'Ancient of the Woods',sprite:'thornwarden',color:'#2d6b3a',
     hp:72,atk:9,def:3,xp:70,gold:30,saveType:'con',saveDC:13,isBoss:true,
     special:{name:'Root Slam',desc:'Roots burst from earth — STR save DC12 or Restrained + 6 dmg',saveType:'str',saveDC:12,damage:6},
     phase2:{name:'Thorn Frenzy',desc:'Ancient rage — thorns erupt everywhere for 10 dmg, CON save DC13 or Poisoned',saveType:'con',saveDC:13,damage:10,condition:'Poisoned',atkBonus:2}}},
  {id:'outpost',name:'Ruined Outpost',num:'II',reqLvl:3,kills:10,
   bgSky:'bg-outpost-sky',bgGround:'bg-ground-outpost',showTrees:false,
   story:{title:'The Ruined Outpost',
     text:'"The garrison fell three hundred years ago — the same night the sky first went dark. The soldiers never left. They could not leave. Something beneath the earth holds them here like pins in a map. Their commander, Grakthar, has not forgotten the old war. He has been waiting for the person who started it."'},
   enemies:[
     {id:'skeleton',name:'Skeleton Warrior',sprite:'skeleton',color:'#8a8a7a',hp:26,atk:8,def:2,xp:15,gold:6,saveType:'str',saveDC:12,isUndead:true},
     {id:'zombie',name:'Rotting Zombie',sprite:'zombie',color:'#5a7a4a',hp:34,atk:10,def:3,xp:18,gold:7,saveType:'con',saveDC:12,isUndead:true},
     {id:'ghost',name:'Wailing Ghost',sprite:'ghost',color:'#7a8aaa',hp:20,atk:11,def:0,xp:20,gold:8,saveType:'wis',saveDC:13,isUndead:true,ignoresArmor:true},
     {id:'wolf',name:'Cursed Archer',sprite:'wolf',color:'#6a5a3a',hp:22,atk:12,def:1,xp:17,gold:7,saveType:'dex',saveDC:12,isUndead:true,dropMat:'bone'},
     {id:'goblin',name:'Death Knight',sprite:'goblin',color:'#3a2a4a',hp:40,atk:9,def:5,xp:19,gold:8,saveType:'str',saveDC:13,isUndead:true,dropMat:'bone'},
   ],
   boss:{id:'grakthar',name:'Commander Grakthar',title:'The Undying Warlord',sprite:'grakthar',color:'#8a3a2a',
     hp:108,atk:11,def:5,xp:130,gold:65,saveType:'str',saveDC:14,isBoss:true,isUndead:true,
     special:{name:"Warlord's Bellow",desc:'Frightening roar — WIS save DC13 or Frightened 2 rounds',saveType:'wis',saveDC:13,damage:5,condition:'Frightened'},
     phase2:{name:'Death March',desc:'Undying fury — 13 dmg, STR save DC14 or Stunned 1 round',saveType:'str',saveDC:14,damage:13,condition:'Stunned',atkBonus:3}}},
  {id:'castle',name:'Thornwall Castle',num:'III',reqLvl:6,kills:12,
   bgSky:'bg-outpost-sky',bgGround:'bg-ground-outpost',showTrees:false,
   story:{title:'Thornwall Castle',
     text:'"The Crimson Cult has known your name for decades. They have been preparing this place — not as a fortress, but as a message. The High Priestess Vexara serves something so far below that its voice takes years to travel upward. It told her you were coming. It told her to let you through — after you proved yourself worthy."'},
   enemies:[
     {id:'goblin',name:'Crimson Cultist',sprite:'goblin',color:'#8b1a1a',hp:38,atk:12,def:4,xp:22,gold:9,saveType:'int',saveDC:14,canBurn:true},
     {id:'zombie',name:'Castle Guard',sprite:'zombie',color:'#5a5a8a',hp:52,atk:15,def:7,xp:26,gold:11,saveType:'str',saveDC:14},
     {id:'spider',name:'Gargoyle',sprite:'spider',color:'#6a6a8a',hp:44,atk:14,def:8,xp:24,gold:10,saveType:'dex',saveDC:13},
     {id:'ghost',name:'Dark Sorcerer',sprite:'ghost',color:'#6a1a6a',hp:30,atk:16,def:2,xp:25,gold:11,saveType:'int',saveDC:14,canBurn:true,ignoresArmor:true,dropMat:'voidShard'},
     {id:'skeleton',name:'Iron Sentinel',sprite:'skeleton',color:'#4a4a6a',hp:60,atk:13,def:10,xp:24,gold:10,saveType:'con',saveDC:14,canStun:true,dropMat:'ironCore'},
   ],
   boss:{id:'vexara',name:'Vexara the Crimson',title:'High Priestess of Ruin',sprite:'vexara',color:'#8b0000',
     hp:242,atk:17,def:10,xp:190,gold:90,saveType:'wis',saveDC:16,isBoss:true,
     special:{name:'Void Eruption',desc:'Dark energy bursts — INT save DC15 or Frightened + 11 dmg',saveType:'int',saveDC:15,damage:11,condition:'Frightened'},
     phase2:{name:'Crimson Ritual',desc:'Blood magic ignites — 22 dmg, CON save DC16 or Burning 3 turns',saveType:'con',saveDC:16,damage:22,condition:'Burning',atkBonus:6}}},
  {id:'underdark',name:'The Underdark',num:'IV',reqLvl:9,kills:14,
   bgSky:'bg-woods-sky',bgGround:'bg-ground-woods',showTrees:false,
   story:{title:'The Underdark',
     text:'"Below the roots, the darkness is not empty — it is full. Full of memories pressed flat by the weight of stone. You can feel them against your skin as you walk. Your own memories. Things you chose to forget. The deeper you go, the more your hands remember a weapon they have carried before."'},
   enemies:[
     {id:'spider',name:'Phase Spider',sprite:'spider',color:'#4a2a8a',hp:58,atk:18,def:6,xp:32,gold:14,saveType:'dex',saveDC:15,canPoison:true},
     {id:'ghost',name:'Shadow Wraith',sprite:'ghost',color:'#2a2a4a',hp:50,atk:22,def:2,xp:36,gold:16,saveType:'wis',saveDC:15,isUndead:true,ignoresArmor:true},
     {id:'zombie',name:'Stone Golem',sprite:'zombie',color:'#6a6a5a',hp:80,atk:20,def:14,xp:34,gold:15,saveType:'con',saveDC:15,canStun:true},
     {id:'goblin',name:'Mind Flayer',sprite:'goblin',color:'#5a2a7a',hp:45,atk:24,def:4,xp:37,gold:17,saveType:'int',saveDC:16,canStun:true,dropMat:'voidShard'},
     {id:'wolf',name:'Deep Lurker',sprite:'wolf',color:'#2a3a5a',hp:70,atk:20,def:8,xp:34,gold:15,saveType:'dex',saveDC:15,canPoison:true,dropMat:'ghostEssence'},
   ],
   boss:{id:'nethrix',name:'Nethrix',title:'Devourer of Worlds',sprite:'nethrix',color:'#4a0a8a',
     hp:343,atk:22,def:14,xp:280,gold:130,saveType:'con',saveDC:17,isBoss:true,
     special:{name:'Mind Shatter',desc:'Psychic assault — WIS save DC16 or Frightened + 14 dmg',saveType:'wis',saveDC:16,damage:14,condition:'Frightened'},
     phase2:{name:'Void Consumption',desc:'Reality unravels — 27 dmg, WIS save DC17 or Stunned + Poisoned',saveType:'wis',saveDC:17,damage:27,condition:'Stunned',condition2:'Poisoned',atkBonus:8}}},
  {id:'abyss',name:'Abyssal Gate',num:'V',reqLvl:12,kills:15,
   bgSky:'bg-outpost-sky',bgGround:'bg-ground-outpost',showTrees:false,
   story:{title:'The Abyssal Gate',
     text:'"The horn that tears the gate open has been sounding for three days. You know this sound. You heard it three centuries ago, when you first descended — when you were the one who chose to open the door in the first place. The demons are not invading. They are responding to a summons. Your summons, echoing backward through time."'},
   enemies:[
     {id:'goblin',name:'Lesser Demon',sprite:'goblin',color:'#6a1a0a',hp:70,atk:24,def:8,xp:44,gold:20,saveType:'dex',saveDC:16,canBurn:true},
     {id:'wolf',name:'Hellhound',sprite:'wolf',color:'#8a2a0a',hp:85,atk:26,def:10,xp:48,gold:22,saveType:'str',saveDC:16,canBurn:true},
     {id:'skeleton',name:'Bone Colossus',sprite:'skeleton',color:'#aaaaaa',hp:110,atk:28,def:16,xp:52,gold:24,saveType:'str',saveDC:17,isUndead:true,canStun:true},
     {id:'ghost',name:'Chaos Imp',sprite:'ghost',color:'#8a1a5a',hp:55,atk:28,def:4,xp:46,gold:21,saveType:'dex',saveDC:16,canBurn:true,ignoresArmor:true,dropMat:'demonAsh'},
     {id:'zombie',name:'Infernal Juggernaut',sprite:'zombie',color:'#5a1a0a',hp:130,atk:24,def:18,xp:54,gold:25,saveType:'con',saveDC:17,canBurn:true,canStun:true,dropMat:'demonAsh'},
   ],
   boss:{id:'zareth',name:'Zareth the Sundered',title:'Lord of the Abyss',sprite:'zareth',color:'#4a0000',
     hp:468,atk:28,def:18,xp:400,gold:200,saveType:'str',saveDC:18,isBoss:true,
     special:{name:'Abyssal Rend',desc:'Reality tears — CON save DC17 or Restrained + 19 dmg',saveType:'con',saveDC:17,damage:19,condition:'Restrained'},
     phase2:{name:'Sundering Howl',desc:'The abyss screams — 35 dmg, CON save DC18 or Burning + Stunned',saveType:'con',saveDC:18,damage:35,condition:'Burning',condition2:'Stunned',atkBonus:11}}},
  {id:'frostpeak',name:'Frostveil Peaks',num:'VI',reqLvl:15,kills:16,
   bgSky:'bg-frostpeak-sky',bgGround:'bg-ground-frost',showTrees:false,
   story:{title:'The Frostveil Peaks',
     text:'"Valdris the Unbroken fought in the old war — the one the gods erased. He has slept through three centuries waiting for one person: the warrior who stood with the enemy. He woke when he felt you ascending. He has things to say to you, once you prove you still deserve to hear them."'},
   enemies:[
     {id:'zombie',name:'Frost Troll',sprite:'zombie',color:'#6a8aaa',hp:120,atk:30,def:12,xp:58,gold:28,saveType:'str',saveDC:17,canStun:true},
     {id:'wolf',name:'Winter Wyvern',sprite:'wolf',color:'#8aaacc',hp:100,atk:34,def:10,xp:62,gold:30,saveType:'dex',saveDC:18,canPoison:true},
     {id:'ghost',name:'Blizzard Wraith',sprite:'ghost',color:'#aaccee',hp:85,atk:36,def:4,xp:60,gold:29,saveType:'wis',saveDC:18,isUndead:true,ignoresArmor:true},
     {id:'skeleton',name:'Glacial Golem',sprite:'skeleton',color:'#aabbcc',hp:145,atk:28,def:20,xp:64,gold:31,saveType:'con',saveDC:18,canStun:true},
     {id:'goblin',name:'Frost Witch',sprite:'goblin',color:'#ccddff',hp:90,atk:38,def:6,xp:63,gold:30,saveType:'int',saveDC:18,canPoison:true,canStun:true,dropMat:'frostCrystal'},
   ],
   boss:{id:'valdris',name:'Valdris the Unbroken',title:'Titan of the Frozen Age',sprite:'zareth',color:'#6aaacc',
     hp:590,atk:34,def:22,xp:520,gold:260,saveType:'str',saveDC:19,isBoss:true,
     legendaryDrop:'glacialCrown',
     special:{name:'Avalanche Slam',desc:'Mountain-shattering blow — STR save DC18 or Restrained + 24 dmg',saveType:'str',saveDC:18,damage:24,condition:'Restrained'},
     phase2:{name:'Permafrost Roar',desc:'Glacial fury erupts — 40 dmg, CON save DC19 or Stunned + Poisoned',saveType:'con',saveDC:19,damage:40,condition:'Stunned',condition2:'Poisoned',atkBonus:12}}},
  {id:'celestial',name:'Celestial Plane',num:'VII',reqLvl:18,kills:18,
   bgSky:'bg-celestial-sky',bgGround:'bg-ground-celestial',showTrees:false,
   story:{title:'The Celestial Plane',
     text:'"The gods know you are here. They have known since the first woods parted for you. The Seraphim Tribunal — the divine court that voted to seal you away three centuries ago — has abandoned its post. The judges hunt you now, because a god is waking below and they would rather destroy the key than face what the lock was holding."'},
   enemies:[
     {id:'ghost',name:'Fallen Seraphim',sprite:'ghost',color:'#ccaaff',hp:130,atk:40,def:8,xp:72,gold:36,saveType:'wis',saveDC:19,ignoresArmor:true},
     {id:'goblin',name:'Astral Assassin',sprite:'goblin',color:'#9966ff',hp:115,atk:44,def:12,xp:70,gold:34,saveType:'dex',saveDC:19},
     {id:'spider',name:'Void Tendril',sprite:'spider',color:'#5533aa',hp:140,atk:38,def:15,xp:74,gold:37,saveType:'con',saveDC:20,canPoison:true},
     {id:'wolf',name:'Divine Hound',sprite:'wolf',color:'#eeccaa',hp:155,atk:36,def:18,xp:76,gold:38,saveType:'str',saveDC:20,canBurn:true},
   ],
   boss:{id:'auranthos',name:'Auranthos',title:'The Blind God',sprite:'nethrix',color:'#ccaaff',
     hp:720,atk:44,def:26,xp:650,gold:320,saveType:'wis',saveDC:20,isBoss:true,
     legendaryDrop:'godslayerBlade',
     special:{name:'Divine Judgement',desc:'Blinding light — WIS save DC19 or Frightened + 30 dmg',saveType:'wis',saveDC:19,damage:30,condition:'Frightened'},
     phase2:{name:'Celestial Collapse',desc:'Reality unmakes itself — 50 dmg, WIS save DC20 or Stunned + Burning',saveType:'wis',saveDC:20,damage:50,condition:'Stunned',condition2:'Burning',atkBonus:14}}},
  {id:'shadowrealm',name:'The Shadow Realm',num:'VIII',reqLvl:20,kills:20,
   bgSky:'bg-shadowrealm-sky',bgGround:'bg-ground-shadow',showTrees:false,
   story:{title:'The Shadow Realm',
     text:'"This is where you sealed it. This is where you sealed yourself. The Hollow Empress — last guardian, last lock, last lie — sits on a throne built from the light that was taken from this place when the door was closed. Beneath her throne is the door. Behind the door is the truth. Behind the truth is the name you buried three hundred years ago."'},
   enemies:[
     {id:'ghost',name:'Shade Revenant',sprite:'ghost',color:'#443366',hp:160,atk:48,def:10,xp:85,gold:44,saveType:'wis',saveDC:20,isUndead:true,ignoresArmor:true},
     {id:'spider',name:'Nightmare Stalker',sprite:'spider',color:'#221133',hp:175,atk:50,def:16,xp:88,gold:46,saveType:'dex',saveDC:21,canPoison:true},
     {id:'zombie',name:'Abyssal Hulk',sprite:'zombie',color:'#332244',hp:210,atk:44,def:24,xp:90,gold:47,saveType:'con',saveDC:21,canStun:true},
     {id:'skeleton',name:'Void Knight',sprite:'skeleton',color:'#554477',hp:190,atk:52,def:20,xp:92,gold:48,saveType:'str',saveDC:21,isUndead:true},
   ],
   boss:{id:'malvaris',name:'Malvaris',title:'The Hollow Empress',sprite:'nethrix',color:'#220033',
     hp:880,atk:56,def:30,xp:800,gold:400,saveType:'wis',saveDC:22,isBoss:true,
     legendaryDrop:'voidcrownOfMalvaris',
     special:{name:"Empress's Silence",desc:'Soul-crushing void — WIS save DC21 or Frightened + Restrained + 38 dmg',saveType:'wis',saveDC:21,damage:38,condition:'Frightened'},
     phase2:{name:'Eternal Darkness',desc:'The realm collapses — 65 dmg, CON save DC22 or Stunned + Burning + Poisoned',saveType:'con',saveDC:22,damage:65,condition:'Stunned',condition2:'Poisoned',atkBonus:18}}},
];

// ══════════════════════════════════════════════════════════
//  SIDE BRANCHES
//  4 optional zones unlocked after specific main-path bosses.
//  Each branch: 5 fights (no campfire), scaling difficulty,
//  unique enemies, unique boss, one-time legendary reward.
// ══════════════════════════════════════════════════════════
const BRANCH_ZONES = [
  // ── BRANCH 0: The Catacombs (unlocks after Zone 2 — Thornwall Castle) ──
  {
    id:'catacombs', name:'The Catacombs', icon:'💀', unlocksAfter:2,
    mapId:'catacombs',
    bgSky:'bg-woods-sky', bgGround:'bg-ground-outpost', showTrees:false,
    mechanic:'gauntlet', // no campfire, 5 fights straight
    story:{
      title:'The Catacombs',
      text:'"Beneath Thornwall Castle lie passages that predate the castle itself. The air here tastes of centuries — of battles sealed underground rather than won. Something has been walking these halls for a very long time. It remembers you."'
    },
    enemies:[
      {id:'skeleton',name:'Crypt Stalker',sprite:'skeleton',color:'#8a8a6a',hp:48,atk:15,def:6,xp:26,gold:12,saveType:'str',saveDC:14,isUndead:true,dropMat:'bone'},
      {id:'ghost',name:'Tomb Wraith',sprite:'ghost',color:'#6a6a9a',hp:36,atk:18,def:2,xp:28,gold:13,saveType:'wis',saveDC:14,isUndead:true,ignoresArmor:true},
      {id:'zombie',name:'Crypt Guardian',sprite:'zombie',color:'#7a6a5a',hp:65,atk:14,def:11,xp:27,gold:12,saveType:'con',saveDC:14,isUndead:true,canStun:true,dropMat:'bone'},
      {id:'wolf',name:'Bone Hound',sprite:'wolf',color:'#9a8a7a',hp:42,atk:16,def:4,xp:25,gold:11,saveType:'dex',saveDC:13,isUndead:true},
      {id:'goblin',name:'Grave Robber',sprite:'goblin',color:'#5a5a4a',hp:38,atk:17,def:3,xp:24,gold:14,saveType:'dex',saveDC:13,canPoison:true,dropMat:'voidShard'},
    ],
    boss:{id:'gravemind',name:'The Gravemind',title:'Ancient Warden of the Dead',sprite:'grakthar',color:'#6a5a8a',
      hp:310,atk:20,def:12,xp:240,gold:110,saveType:'con',saveDC:16,isBoss:true,isUndead:true,
      legendaryDrop:'tombwardenSeal',
      special:{name:'Crypt Surge',desc:'Undead energy erupts — CON save DC15 or Stunned + 16 dmg',saveType:'con',saveDC:15,damage:16,condition:'Stunned'},
      phase2:{name:'Death Unbound',desc:'All restraint gone — 24 dmg, WIS save DC16 or Frightened + Poisoned',saveType:'wis',saveDC:16,damage:24,condition:'Frightened',atkBonus:5}},
  },
  // ── BRANCH 1: The Fungal Warren (unlocks after Zone 0 — Whispering Woods) ──
  {
    id:'fungalwarren', name:'The Fungal Warren', icon:'🍄', unlocksAfter:0,
    mapId:'fungalwarren',
    bgSky:'bg-woods-sky', bgGround:'bg-ground-woods', showTrees:false,
    mechanic:'poison_spreading', // enemies start fight with Poisoned stacks that can spread
    story:{
      title:'The Fungal Warren',
      text:'"The spores reached the surface three months ago. Travelers who entered the Warren came back changed — quieter, slower, smiling at things that weren\'t there. You can feel the haze at the edge of your thoughts already. The fungus is not malicious. It simply wants to grow."'
    },
    enemies:[
      {id:'spider',name:'Spore Crawler',sprite:'spider',color:'#6a8a2a',hp:22,atk:6,def:1,xp:11,gold:4,saveType:'con',saveDC:11,canPoison:true,isFungal:true},
      {id:'zombie',name:'Myconid Shambler',sprite:'zombie',color:'#5a7a3a',hp:28,atk:5,def:4,xp:12,gold:5,saveType:'con',saveDC:11,canPoison:true,isFungal:true,dropMat:'herb'},
      {id:'goblin',name:'Spore Caller',sprite:'goblin',color:'#4a6a2a',hp:18,atk:8,def:0,xp:10,gold:4,saveType:'int',saveDC:11,canPoison:true,isFungal:true},
      {id:'wolf',name:'Infected Beast',sprite:'wolf',color:'#7a8a3a',hp:32,atk:7,def:2,xp:13,gold:5,saveType:'str',saveDC:11,canPoison:true,isFungal:true},
    ],
    boss:{id:'sporelord',name:'The Sporelord',title:'Heart of the Warren',sprite:'thornwarden',color:'#5a8a2a',
      hp:160,atk:11,def:6,xp:100,gold:50,saveType:'con',saveDC:14,isBoss:true,isFungal:true,
      legendaryDrop:'sporecloak',
      special:{name:'Spore Cloud',desc:'Toxic eruption — CON save DC13 or Poisoned 3 turns + 8 dmg',saveType:'con',saveDC:13,damage:8,condition:'Poisoned'},
      phase2:{name:'Mycelium Surge',desc:'The Warren responds — 14 dmg, CON save DC14 or Poisoned + Restrained',saveType:'con',saveDC:14,damage:14,condition:'Poisoned',atkBonus:3}},
  },
  // ── BRANCH 2: The Sunken Vault (unlocks after Zone 1 — Ruined Outpost) ──
  {
    id:'sunkenvault', name:'The Sunken Vault', icon:'💰', unlocksAfter:1,
    mapId:'sunkenvault',
    bgSky:'bg-outpost-sky', bgGround:'bg-ground-outpost', showTrees:false,
    mechanic:'double_loot', // all gold/item drops doubled, but enemies hit 25% harder
    story:{
      title:'The Sunken Vault',
      text:'"The old kingdom\'s treasury went underground when the fortress fell — not looted, just submerged. The guardians who were locked inside to protect it never stopped. Three hundred years of loyalty with nothing left to protect. They attack on sight now. Old habits."'
    },
    enemies:[
      {id:'skeleton',name:'Vault Sentry',sprite:'skeleton',color:'#aa9960',hp:34,atk:11,def:5,xp:18,gold:16,saveType:'str',saveDC:13,isUndead:true,dropMat:'ironCore'},
      {id:'goblin',name:'Flooded Marauder',sprite:'goblin',color:'#6a8a9a',hp:28,atk:13,def:3,xp:17,gold:18,saveType:'dex',saveDC:12,canPoison:true},
      {id:'zombie',name:'Iron Vault Golem',sprite:'zombie',color:'#8a8a6a',hp:50,atk:10,def:9,xp:20,gold:15,saveType:'con',saveDC:13,canStun:true,dropMat:'ironCore'},
      {id:'wolf',name:'Treasure Hound',sprite:'wolf',color:'#aa8840',hp:30,atk:14,def:2,xp:16,gold:20,saveType:'dex',saveDC:12},
    ],
    boss:{id:'vaultkeeper',name:'The Vault Keeper',title:'Eternal Guardian of Lost Coin',sprite:'grakthar',color:'#aa9930',
      hp:220,atk:14,def:9,xp:170,gold:200,saveType:'str',saveDC:15,isBoss:true,isUndead:true,
      legendaryDrop:'keepersMantle',
      special:{name:'Treasury Lock',desc:'Crushing slam — STR save DC14 or Restrained + 12 dmg',saveType:'str',saveDC:14,damage:12,condition:'Restrained'},
      phase2:{name:'Final Lockdown',desc:'Last resort — 18 dmg, CON save DC15 or Stunned 2 rounds',saveType:'con',saveDC:15,damage:18,condition:'Stunned',atkBonus:4}},
  },
  // ── BRANCH 3: The Ashen Wastes (unlocks after Zone 3 — Underdark) ──
  {
    id:'ashenwastes', name:'The Ashen Wastes', icon:'🔥', unlocksAfter:3,
    mapId:'ashenwastes',
    bgSky:'bg-outpost-sky', bgGround:'bg-ground-outpost', showTrees:false,
    mechanic:'event_combat', // random campfire event before each fight instead of normal flow
    story:{
      title:'The Ashen Wastes',
      text:'"The battle here ended three centuries ago but the ground never cooled. Demons and angels died together in numbers large enough to change the soil. The ash that rises with every step used to be something. The things that survived are not quite demons anymore. They are something the war made."'
    },
    enemies:[
      {id:'goblin',name:'Ash Revenant',sprite:'goblin',color:'#8a5a3a',hp:72,atk:21,def:9,xp:36,gold:17,saveType:'dex',saveDC:16,canBurn:true,dropMat:'demonAsh'},
      {id:'wolf',name:'Cinder Hound',sprite:'wolf',color:'#aa4a2a',hp:80,atk:23,def:7,xp:38,gold:18,saveType:'str',saveDC:16,canBurn:true},
      {id:'ghost',name:'Ember Wraith',sprite:'ghost',color:'#cc6a2a',hp:55,atk:26,def:3,xp:39,gold:19,saveType:'wis',saveDC:17,canBurn:true,ignoresArmor:true,dropMat:'demonAsh'},
      {id:'skeleton',name:'Scorched Sentinel',sprite:'skeleton',color:'#7a5a4a',hp:95,atk:19,def:15,xp:37,gold:17,saveType:'con',saveDC:16,canBurn:true,canStun:true,isUndead:true},
    ],
    boss:{id:'ashprince',name:'The Ash Prince',title:'Last Survivor of the Burning War',sprite:'zareth',color:'#cc5522',
      hp:520,atk:26,def:16,xp:360,gold:170,saveType:'con',saveDC:18,isBoss:true,
      legendaryDrop:'ashprinceMantle',
      special:{name:'Inferno Wave',desc:'Rolling fire — CON save DC17 or Burning 3 turns + 22 dmg',saveType:'con',saveDC:17,damage:22,condition:'Burning'},
      phase2:{name:'Ashen Apocalypse',desc:'The wastes ignite — 32 dmg, CON save DC18 or Burning + Stunned',saveType:'con',saveDC:18,damage:32,condition:'Burning',atkBonus:7}},
  },
];

// Branch reward pool — rolled randomly on branch completion
const BRANCH_STAT_BONUSES = [
  {label:'ATK +8',  apply:(g)=>{g.atk+=8;}},
  {label:'DEF +6',  apply:(g)=>{g.def+=6;}},
  {label:'Max HP +30', apply:(g)=>{g.maxHp+=30; g.hp=Math.min(g.maxHp,g.hp+30);}},
  {label:'Crit Range +2', apply:(g)=>{g.critRange=Math.max(18,g.critRange-2);}},
  {label:'XP Gain +20%', apply:(g)=>{g.xpMult=(g.xpMult||1)*1.2;}},
  {label:'Gold +25%', apply:(g)=>{g.goldMult=(g.goldMult||1)*1.25;}},
];

const BRANCH_PASSIVE_CHOICES = [
  [{name:'Iron Skin',desc:'Permanently reduce all incoming damage by 3.'},{name:'Battle Hardened',desc:'Start every fight with +10 temporary HP.'},{name:'Scavenger',desc:'20% chance to find an extra item after every fight.'}],
  [{name:'Predator',desc:'Deal +15% damage to enemies below 50% HP.'},{name:'Swift Hands',desc:'Potions heal 50% more.'},{name:'Veteran',desc:'+5 ATK and +3 DEF permanently.'}],
  [{name:'Death Defiant',desc:'Once per zone, survive a killing blow at 1 HP.'},{name:'Arcane Infusion',desc:'+10 to all magic damage.'},{name:'Relentless',desc:'Recover 5 HP after killing any enemy.'}],
  [{name:'Sixth Sense',desc:'Reduce all boss special damage by 20%.'},{name:'Treasure Hunter',desc:'All gold gains increased by 40%.'},{name:'Combat Mastery',desc:'+3 ATK, +3 DEF, +15 Max HP permanently.'}],
];

const ITEMS = [
  // ── WEAPONS (common) ─────────────────────────────────────
  {id:'sword',name:'Iron Sword',icon:'⚔️',type:'weapon',slot:'weapon',rarity:'common',stats:{atk:5},value:20},
  {id:'dagger',name:'Keen Dagger',icon:'🗡️',type:'weapon',slot:'weapon',rarity:'common',stats:{atk:3,crit:1},value:15},
  {id:'staff',name:'Arcane Staff',icon:'🪄',type:'weapon',slot:'weapon',rarity:'common',stats:{atk:2,magAtk:6},value:22},
  {id:'bow',name:'Hunting Bow',icon:'🏹',type:'weapon',slot:'weapon',rarity:'common',stats:{atk:6},value:22},
  {id:'club',name:'Spiked Club',icon:'🪵',type:'weapon',slot:'weapon',rarity:'common',stats:{atk:4},value:12},
  // ── WEAPONS (uncommon) ───────────────────────────────────
  {id:'silverSword',name:'Silver Sword',icon:'🗡',type:'weapon',slot:'weapon',rarity:'uncommon',stats:{atk:9},value:55},
  {id:'wand',name:'Wand of Force',icon:'🪄',type:'weapon',slot:'weapon',rarity:'uncommon',stats:{atk:3,magAtk:10},value:60},
  {id:'longbow',name:'Longbow',icon:'🏹',type:'weapon',slot:'weapon',rarity:'uncommon',stats:{atk:10},value:65},
  {id:'handaxe',name:'Twin Handaxes',icon:'🪓',type:'weapon',slot:'weapon',rarity:'uncommon',stats:{atk:8,crit:1},value:58},
  // ── WEAPONS (rare) ───────────────────────────────────────
  {id:'greatsword',name:'Greatsword',icon:'⚔',type:'weapon',slot:'weapon',rarity:'rare',stats:{atk:14},value:140},
  {id:'voidDagger',name:'Void Dagger',icon:'🗡️',type:'weapon',slot:'weapon',rarity:'rare',stats:{atk:10,crit:10},value:160},
  {id:'arcaneOrb',name:'Arcane Orb',icon:'🔮',type:'weapon',slot:'weapon',rarity:'rare',stats:{atk:4,magAtk:16},value:170},
  {id:'druidStaff',name:"Nature's Staff",icon:'🌿',type:'weapon',slot:'weapon',rarity:'rare',stats:{atk:6,magAtk:10,def:3},value:155},
  // ── ARMOR (common) ───────────────────────────────────────
  {id:'leather',name:'Leather Armor',icon:'🥋',type:'armor',slot:'armor',rarity:'common',stats:{def:3},value:18},
  {id:'paddedArmor',name:'Padded Armor',icon:'🧥',type:'armor',slot:'armor',rarity:'common',stats:{def:2,hp:5},value:14},
  // ── ARMOR (uncommon) ─────────────────────────────────────
  {id:'chainmail',name:'Chain Mail',icon:'🦺',type:'armor',slot:'armor',rarity:'uncommon',stats:{def:8,hp:15},value:65},
  {id:'scaleMail',name:'Scale Mail',icon:'🛡',type:'armor',slot:'armor',rarity:'uncommon',stats:{def:7,hp:10},value:60},
  {id:'robes',name:'Enchanted Robes',icon:'👘',type:'armor',slot:'armor',rarity:'uncommon',stats:{def:3,magAtk:5,hp:8},value:70},
  // ── ARMOR (rare) ─────────────────────────────────────────
  {id:'plateArmor',name:'Plate Armor',icon:'🛡',type:'armor',slot:'armor',rarity:'rare',stats:{def:14,hp:30},value:180},
  {id:'shadowLeather',name:'Shadow Leather',icon:'🥋',type:'armor',slot:'armor',rarity:'rare',stats:{def:9,crit:2,hp:12},value:175},
  // ── OFFHAND ──────────────────────────────────────────────
  {id:'shield',name:'Wooden Shield',icon:'🛡',type:'offhand',slot:'offhand',rarity:'common',stats:{def:4},value:15},
  {id:'ironShield',name:'Iron Shield',icon:'🛡',type:'offhand',slot:'offhand',rarity:'uncommon',stats:{def:8,hp:8},value:55},
  {id:'spellbook',name:'Grimoire',icon:'📖',type:'offhand',slot:'offhand',rarity:'uncommon',stats:{magAtk:6,def:2},value:60},
  // ── RINGS / ACCESSORIES ──────────────────────────────────
  {id:'ring',name:'Ring of Fortitude',icon:'💍',type:'accessory',slot:'ring',rarity:'uncommon',stats:{hp:20,def:2},value:55},
  {id:'ringAtk',name:'Ring of Striking',icon:'💍',type:'accessory',slot:'ring',rarity:'uncommon',stats:{atk:6},value:50},
  {id:'ringMag',name:'Ring of Arcana',icon:'💍',type:'accessory',slot:'ring',rarity:'rare',stats:{magAtk:10,hp:10},value:130},
  {id:'amulet',name:'Amulet of Warding',icon:'📿',type:'accessory',slot:'ring',rarity:'rare',stats:{def:8,hp:20},value:145},
  // ── CONSUMABLES ──────────────────────────────────────────
  {id:'hpPotion',name:'Healing Potion',icon:'🧪',type:'consumable',slot:null,rarity:'common',stats:{heal:15},value:10},
  {id:'strongPotion',name:'Strong Potion',icon:'⚗️',type:'consumable',slot:null,rarity:'uncommon',stats:{heal:35},value:28},
  {id:'elixir',name:'Elixir of Life',icon:'✨',type:'consumable',slot:null,rarity:'rare',stats:{heal:60},value:75},
  {id:'antidote',name:'Antidote',icon:'💊',type:'consumable',slot:null,rarity:'common',stats:{heal:5},value:8},
  // ── MATERIALS ────────────────────────────────────────────
  {id:'herb',name:'Dried Herb',icon:'🌿',type:'material',slot:null,rarity:'common',stats:{},value:3},
  {id:'fang',name:'Wolf Fang',icon:'🦷',type:'material',slot:null,rarity:'common',stats:{},value:5},
  {id:'bone',name:'Bone Fragment',icon:'🦴',type:'material',slot:null,rarity:'common',stats:{},value:4},
  {id:'voidShard',name:'Void Shard',icon:'💎',type:'material',slot:null,rarity:'uncommon',stats:{},value:15},
  {id:'ghostEssence',name:'Ghost Essence',icon:'👻',type:'material',slot:null,rarity:'uncommon',stats:{},value:12},
  {id:'ironCore',name:'Iron Core',icon:'⚙️',type:'material',slot:null,rarity:'uncommon',stats:{},value:18},
  {id:'demonAsh',name:'Demon Ash',icon:'🔥',type:'material',slot:null,rarity:'rare',stats:{},value:30},
  {id:'frostCrystal',name:'Frost Crystal',icon:'🧊',type:'material',slot:null,rarity:'rare',stats:{},value:28},
  {id:'celestialDust',name:'Celestial Dust',icon:'✨',type:'material',slot:null,rarity:'epic',stats:{},value:50},
  {id:'shadowEssence',name:'Shadow Essence',icon:'🌑',type:'material',slot:null,rarity:'epic',stats:{},value:55},
  // ── LEGENDARY (boss-drop only) ────────────────────────────
  {id:'glacialCrown',name:'Glacial Crown of Valdris',icon:'👑',type:'accessory',slot:'ring',rarity:'legendary',stats:{def:22,hp:60,atk:8},value:500},
  {id:'godslayerBlade',name:'Godslayer',icon:'⚡',type:'weapon',slot:'weapon',rarity:'legendary',stats:{atk:32,crit:3,magAtk:12},value:600},
  {id:'voidcrownOfMalvaris',name:"Malvaris's Voidcrown",icon:'💀',type:'armor',slot:'armor',rarity:'legendary',stats:{def:30,hp:80,magAtk:20},value:800},
  {id:'shardOfEternity',name:'Shard of Eternity',icon:'🌟',type:'offhand',slot:'offhand',rarity:'legendary',stats:{magAtk:28,def:10,hp:40},value:700},
  {id:'wraithbane',name:'Wraithbane',icon:'🗡️',type:'weapon',slot:'weapon',rarity:'legendary',stats:{atk:24,magAtk:18,crit:12},value:580},
  // ── OBJECTIVE REWARD ITEMS ────────────────────────────────
  {id:'frostRing',name:'Ring of the Untainted',icon:'❄️',type:'accessory',slot:'ring',rarity:'rare',stats:{def:6,hp:18},value:80},
  {id:'boneWard',name:"Exorcist's Ward",icon:'🛡️',type:'offhand',slot:'offhand',rarity:'rare',stats:{def:10,hp:15},value:90},
  {id:'cultistsCowl',name:"Cultist's Cowl",icon:'🎭',type:'armor',slot:'armor',rarity:'rare',stats:{def:8,magAtk:6,hp:12},value:110},
  {id:'voidEye',name:'Eye of the Void',icon:'👁️',type:'accessory',slot:'ring',rarity:'epic',stats:{magAtk:14,atk:6,hp:20},value:180},
  {id:'demonscaleGauntlets',name:'Demonscale Gauntlets',icon:'🧤',type:'offhand',slot:'offhand',rarity:'epic',stats:{atk:10,def:10,hp:20},value:200},
  {id:'seraphimWings',name:"Seraphim's Mantle",icon:'🪽',type:'armor',slot:'armor',rarity:'legendary',stats:{def:24,hp:50,magAtk:16},value:550},
  // ── BRANCH LEGENDARIES (branch boss-drop only) ────────────
  {id:'tombwardenSeal',name:'Tombwarden\'s Seal',icon:'💀',type:'accessory',slot:'ring',rarity:'legendary',stats:{def:18,hp:45,atk:10},value:520,
    desc:'The seal of an ancient guardian. Undead enemies deal 15% less damage to you.'},
  {id:'sporecloak',name:'Sporecloak of the Warren',icon:'🍄',type:'armor',slot:'armor',rarity:'legendary',stats:{def:16,hp:40,magAtk:14},value:500,
    desc:'Woven from living mycelium. You are immune to Poison. Poisoned enemies take +20% damage from you.'},
  {id:'keepersMantle',name:"Vault Keeper's Mantle",icon:'💰',type:'armor',slot:'armor',rarity:'legendary',stats:{def:20,hp:35,atk:8},value:510,
    desc:'Armor of the eternal guardian. All gold drops increased by 50%.'},
  {id:'ashprinceMantle',name:"Ash Prince's Mantle",icon:'🔥',type:'armor',slot:'armor',rarity:'legendary',stats:{atk:18,def:12,magAtk:14},value:540,
    desc:'Forged in the burning war. You are immune to Burning. All fire damage you deal is increased by 25%.'},
  // ── CLASS SIGNATURE SETS (drop-only, 3 pieces per class) ──
  // Fighter — Iron Legion
  {id:'warlordsBlade',name:"Warlord's Blade",icon:'⚔',type:'weapon',slot:'weapon',rarity:'epic',set:'ironLegion',forClass:'fighter',stats:{atk:16,crit:2,hp:10},value:0},
  {id:'championsPlate',name:"Champion's Plate",icon:'🛡',type:'armor',slot:'armor',rarity:'epic',set:'ironLegion',forClass:'fighter',stats:{def:18,hp:35,atk:4},value:0},
  {id:'commandersSignet',name:"Commander's Signet",icon:'💍',type:'accessory',slot:'ring',rarity:'epic',set:'ironLegion',forClass:'fighter',stats:{atk:8,def:6,hp:20},value:0},
  // Wizard — Archmage's Ascension
  {id:'archmagesStaff',name:"Archmage's Staff",icon:'🪄',type:'weapon',slot:'weapon',rarity:'epic',set:'archmageAscension',forClass:'wizard',stats:{magAtk:20,atk:4,hp:10},value:0},
  {id:'spellweaveRobes',name:'Spellweave Robes',icon:'👘',type:'armor',slot:'armor',rarity:'epic',set:'archmageAscension',forClass:'wizard',stats:{magAtk:14,def:6,hp:22},value:0},
  {id:'tomeOfArcane',name:'Tome of the Arcane',icon:'📖',type:'offhand',slot:'offhand',rarity:'epic',set:'archmageAscension',forClass:'wizard',stats:{magAtk:16,hp:15,def:4},value:0},
  // Rogue — Veil of Shadows
  {id:'shadowfang',name:'Shadowfang',icon:'🗡️',type:'weapon',slot:'weapon',rarity:'epic',set:'veilOfShadows',forClass:'rogue',stats:{atk:14,crit:10,hp:8},value:0},
  {id:'shroudOfUnseen',name:'Shroud of the Unseen',icon:'🥋',type:'armor',slot:'armor',rarity:'epic',set:'veilOfShadows',forClass:'rogue',stats:{def:10,crit:6,hp:18},value:0},
  {id:'thievesBrand',name:"Thief's Brand",icon:'💍',type:'accessory',slot:'ring',rarity:'epic',set:'veilOfShadows',forClass:'rogue',stats:{atk:8,crit:8,hp:10},value:0},
  // Paladin — Oath of the Undying
  {id:'sanctifiedLongsword',name:'Sanctified Longsword',icon:'⚔️',type:'weapon',slot:'weapon',rarity:'epic',set:'oathUndying',forClass:'paladin',stats:{atk:14,magAtk:8,hp:15},value:0},
  {id:'aegisDevoted',name:'Aegis of the Devoted',icon:'🛡️',type:'offhand',slot:'offhand',rarity:'epic',set:'oathUndying',forClass:'paladin',stats:{def:16,hp:25,magAtk:4},value:0},
  {id:'vestmentsValor',name:'Vestments of Valor',icon:'🦺',type:'armor',slot:'armor',rarity:'epic',set:'oathUndying',forClass:'paladin',stats:{def:14,hp:30,atk:4},value:0},
  // Ranger — Warden's Call
  {id:'thornwoodLongbow',name:'Thornwood Longbow',icon:'🏹',type:'weapon',slot:'weapon',rarity:'epic',set:'wardensCall',forClass:'ranger',stats:{atk:16,crit:4,hp:10},value:0},
  {id:'stalkersLeathers',name:"Stalker's Leathers",icon:'🥋',type:'armor',slot:'armor',rarity:'epic',set:'wardensCall',forClass:'ranger',stats:{def:12,crit:4,hp:20},value:0},
  {id:'beastcallerTotem',name:"Beastcaller's Totem",icon:'📿',type:'accessory',slot:'ring',rarity:'epic',set:'wardensCall',forClass:'ranger',stats:{atk:6,def:6,hp:22},value:0},
  // Barbarian — Fury Incarnate
  {id:'ragecleaver',name:'Ragecleaver',icon:'🪓',type:'weapon',slot:'weapon',rarity:'epic',set:'furyIncarnate',forClass:'barbarian',stats:{atk:18,hp:20,crit:2},value:0},
  {id:'berserkersHide',name:"Berserker's Hide",icon:'🧥',type:'armor',slot:'armor',rarity:'epic',set:'furyIncarnate',forClass:'barbarian',stats:{def:14,hp:40,atk:4},value:0},
  {id:'bloodrageTalisman',name:'Bloodrage Talisman',icon:'🔮',type:'accessory',slot:'ring',rarity:'epic',set:'furyIncarnate',forClass:'barbarian',stats:{atk:10,hp:25,def:4},value:0},
  // Cleric — Divine Covenant
  {id:'divineScepter',name:'Divine Scepter',icon:'✝️',type:'weapon',slot:'weapon',rarity:'epic',set:'divineCovenant',forClass:'cleric',stats:{magAtk:16,atk:6,hp:15},value:0},
  {id:'radiantVestments',name:'Radiant Vestments',icon:'👘',type:'armor',slot:'armor',rarity:'epic',set:'divineCovenant',forClass:'cleric',stats:{def:12,magAtk:10,hp:28},value:0},
  {id:'beaconOfFaith',name:'Beacon of Faith',icon:'⭐',type:'offhand',slot:'offhand',rarity:'epic',set:'divineCovenant',forClass:'cleric',stats:{magAtk:14,def:8,hp:18},value:0},
  // Druid — Heart of the Wild
  {id:'rootstaffWild',name:'Rootstaff of the Wild',icon:'🌿',type:'weapon',slot:'weapon',rarity:'epic',set:'heartWild',forClass:'druid',stats:{magAtk:14,atk:8,hp:12},value:0},
  {id:'barkMantle',name:'Bark Mantle',icon:'🥋',type:'armor',slot:'armor',rarity:'epic',set:'heartWild',forClass:'druid',stats:{def:14,hp:32,magAtk:6},value:0},
  {id:'heartOfGrove',name:'Heart of the Grove',icon:'💚',type:'accessory',slot:'ring',rarity:'epic',set:'heartWild',forClass:'druid',stats:{magAtk:10,hp:25,def:6},value:0},
  {id:'shadowLeatherSet',name:"Shadowwalker's Leather",icon:'🥋',type:'armor',slot:'armor',rarity:'epic',set:'shadowwalker',stats:{def:10,crit:6,hp:14},value:210},
  {id:'shadowRing',name:'Ring of Shadows',icon:'💍',type:'accessory',slot:'ring',rarity:'epic',set:'shadowwalker',stats:{atk:6,crit:8},value:200},
  // Ironclad Set
  {id:'ironcladSword',name:'Ironclad Longsword',icon:'⚔️',type:'weapon',slot:'weapon',rarity:'epic',set:'ironclad',stats:{atk:16,def:4},value:230},
  {id:'ironcladArmor',name:'Ironclad Plate',icon:'🛡',type:'armor',slot:'armor',rarity:'epic',set:'ironclad',stats:{def:18,hp:25},value:240},
  {id:'ironcladShield',name:'Ironclad Bulwark',icon:'🛡',type:'offhand',slot:'offhand',rarity:'epic',set:'ironclad',stats:{def:14,hp:20},value:220},
  // Arcane Trinity Set
  {id:'arcaneStaff',name:'Staff of the Trinity',icon:'🪄',type:'weapon',slot:'weapon',rarity:'epic',set:'arcane',stats:{atk:6,magAtk:18},value:240},
  {id:'arcaneRobes',name:'Arcane Trinity Robes',icon:'👘',type:'armor',slot:'armor',rarity:'epic',set:'arcane',stats:{def:5,magAtk:14,hp:12},value:230},
  {id:'arcaneOrb2',name:'Trinity Orb',icon:'🔮',type:'offhand',slot:'offhand',rarity:'epic',set:'arcane',stats:{magAtk:16,hp:10},value:225},
  // Nature's Covenant Set
  {id:'natureBow',name:"Nature's Longbow",icon:'🏹',type:'weapon',slot:'weapon',rarity:'epic',set:'nature',stats:{atk:14,def:3},value:215},
  {id:'natureArmor',name:'Covenant Bark Armor',icon:'🥋',type:'armor',slot:'armor',rarity:'epic',set:'nature',stats:{def:12,hp:22},value:220},
  {id:'natureTalisman',name:"Nature's Talisman",icon:'📿',type:'accessory',slot:'ring',rarity:'epic',set:'nature',stats:{def:8,hp:20,magAtk:6},value:210},
];

// ── SET BONUSES ───────────────────────────────────────────────
const SET_BONUSES = {
  // ── CLASS SIGNATURE SETS (all 3 pieces = special skill bonus) ──
  ironLegion:{
    name:'Iron Legion',forClass:'fighter',
    pieces:['warlordsBlade','championsPlate','commandersSignet'],
    bonuses:{3:{label:'SET: Power Strike fires a second hit at 60% damage',stats:{atk:4},skillBonus:'fighter_set'}}
  },
  archmageAscension:{
    name:"Archmage's Ascension",forClass:'wizard',
    pieces:['archmagesStaff','spellweaveRobes','tomeOfArcane'],
    bonuses:{3:{label:'SET: Spell crits restore 1 spell slot',stats:{magAtk:6},skillBonus:'wizard_set'}}
  },
  veilOfShadows:{
    name:'Veil of Shadows',forClass:'rogue',
    pieces:['shadowfang','shroudOfUnseen','thievesBrand'],
    bonuses:{3:{label:'SET: Sneak Attack has no cooldown — usable every turn',stats:{crit:3},skillBonus:'rogue_set'}}
  },
  oathUndying:{
    name:'Oath of the Undying',forClass:'paladin',
    pieces:['sanctifiedLongsword','aegisDevoted','vestmentsValor'],
    bonuses:{3:{label:'SET: Divine Smite heals 25% of damage dealt',stats:{hp:15},skillBonus:'paladin_set'}}
  },
  wardensCall:{
    name:"Warden's Call",forClass:'ranger',
    pieces:['thornwoodLongbow','stalkersLeathers','beastcallerTotem'],
    bonuses:{3:{label:"SET: Hunter's Mark can never be broken by damage",stats:{atk:4},skillBonus:'ranger_set'}}
  },
  furyIncarnate:{
    name:'Fury Incarnate',forClass:'barbarian',
    pieces:['ragecleaver','berserkersHide','bloodrageTalisman'],
    bonuses:{3:{label:'SET: Rage lasts the entire fight with no turn limit',stats:{atk:6},skillBonus:'barbarian_set'}}
  },
  divineCovenant:{
    name:'Divine Covenant',forClass:'cleric',
    pieces:['divineScepter','radiantVestments','beaconOfFaith'],
    bonuses:{3:{label:'SET: Spiritual Weapon strikes twice per turn',stats:{magAtk:6},skillBonus:'cleric_set'}}
  },
  heartWild:{
    name:'Heart of the Wild',forClass:'druid',
    pieces:['rootstaffWild','barkMantle','heartOfGrove'],
    bonuses:{3:{label:'SET: All Wild Shape forms get +50% HP buffer',stats:{hp:10},skillBonus:'druid_set'}}
  },
  // ── GENERIC SETS ─────────────────────────────────────────────
  shadowwalker:{
    name:"Shadowwalker's Pact",
    pieces:['shadowBlade','shadowLeatherSet','shadowRing'],
    bonuses:{2:{label:'2 pcs: +2 Crit',stats:{crit:2}},3:{label:'3 pcs: +12 ATK, +1 Crit',stats:{atk:12,crit:1}}}
  },
  ironclad:{
    name:'Ironclad Resolve',
    pieces:['ironcladSword','ironcladArmor','ironcladShield'],
    bonuses:{2:{label:'2 pcs: +10 DEF',stats:{def:10}},3:{label:'3 pcs: +40 HP, +6 DEF',stats:{hp:40,def:6}}}
  },
  arcane:{
    name:'Arcane Trinity',
    pieces:['arcaneStaff','arcaneRobes','arcaneOrb2'],
    bonuses:{2:{label:'2 pcs: +12 Magic ATK',stats:{magAtk:12}},3:{label:'3 pcs: +20 Magic ATK, +10 HP',stats:{magAtk:20,hp:10}}}
  },
  nature:{
    name:"Nature's Covenant",
    pieces:['natureBow','natureArmor','natureTalisman'],
    bonuses:{2:{label:'2 pcs: +20 HP, +6 DEF',stats:{hp:20,def:6}},3:{label:'3 pcs: +10 ATK, +8 DEF',stats:{atk:10,def:8}}}
  },
};

// ── ULTIMATES — level 10 (I) and level 20 (capstone) ────────
const ULTIMATES = {
  fighter:{
    ultimate1:{id:'action_surge',name:'Action Surge',icon:'🌪️',
      desc:'Gain an entire extra turn. Momentum costs halved, crit range 17–20 for that turn.',
      type:'action',effect:'action_surge'},
    capstone:{id:'unbreakable',name:'Unbreakable',icon:'🔱',
      desc:'PASSIVE: All attacks roll twice, take higher (Advantage). Below 25% HP: auto +50 Momentum and next attack crits (once per fight). Action Surge resets Second Wind and Parry.',
      type:'passive',effect:'unbreakable_capstone'},
  },
  wizard:{
    ultimate1:{id:'time_stop',name:'Time Stop',icon:'⏳',
      desc:'Take 3 consecutive actions. Enemy cannot act. All spells cost 0 slots during Time Stop.',
      type:'action',effect:'time_stop'},
    capstone:{id:'arcane_transcendence',name:'Arcane Transcendence',icon:'🌌',
      desc:'PASSIVE: Spell slots abolished — all spells free. Each spell has a 2-turn cooldown. +30% spell damage. Time Stop grants 4 actions.',
      type:'passive',effect:'arcane_transcendence'},
  },
  rogue:{
    ultimate1:{id:'vanishing_act',name:'Vanishing Act',icon:'🌑',
      desc:'Untargetable for 2 rounds. Attacks still deal damage. First attack after reappearing is an auto-crit.',
      type:'bonus',effect:'vanishing_act'},
    capstone:{id:'deaths_shadow',name:"Death's Shadow",icon:'☠️',
      desc:'PASSIVE: Every attack generates 2 Combo Points. Sneak Attack always available. Once per fight: survive a killing blow at 1 HP, gain 6 Combo Points, next action free.',
      type:'passive',effect:'deaths_shadow_capstone'},
  },
  paladin:{
    ultimate1:{id:'divine_intervention_ult',name:'Divine Intervention',icon:'😇',
      desc:'Deal 6d10 radiant, fully heal, remove all conditions, restore 5 Holy Power. Double vs undead/fiends.',
      type:'action',effect:'divine_intervention_ult'},
    capstone:{id:'avatar_of_light',name:'Avatar of Light',icon:'👼',
      desc:'PASSIVE: Holy Power regenerates 1 per turn. Divine Smite uncapped — +1d8 per Holy Power spent. Divine Intervention usable twice per rest.',
      type:'passive',effect:'avatar_of_light'},
  },
  ranger:{
    ultimate1:{id:'hail_of_arrows',name:'Hail of Arrows',icon:'🌧️',
      desc:'Deal 10d6+DEX damage. Apply Hunter\'s Mark free. Restrain enemy 2 turns (no save).',
      type:'action',effect:'hail_of_arrows'},
    capstone:{id:'one_with_the_hunt',name:'One With the Hunt',icon:'🎯',
      desc:"PASSIVE: Hunter's Mark auto-applies to every enemy at fight start. All attacks deal +DEX bonus. Hail of Arrows recharges every fight.",
      type:'passive',effect:'one_with_the_hunt'},
  },
  barbarian:{
    ultimate1:{id:'world_breaker',name:'World Breaker',icon:'🌍',
      desc:'Deal 5d12+STR. Cannot miss. Double damage if enemy has conditions. Recoil: take 10 damage.',
      type:'action',effect:'world_breaker'},
    capstone:{id:'eternal_rage',name:'Eternal Rage',icon:'🔥',
      desc:'PASSIVE: Rage lasts entire fight, never expires. Unlimited Rage charges. Regen 3 HP/turn while raging. World Breaker recharges every fight.',
      type:'passive',effect:'eternal_rage'},
  },
  cleric:{
    ultimate1:{id:'miracle',name:'Miracle',icon:'✨',
      desc:'Fully heal, remove all conditions, deal 4d10 radiant, restore all Devotion. Vs undead/fiends: Frightened 3 turns.',
      type:'action',effect:'miracle'},
    capstone:{id:'vessel_divine',name:'Vessel of the Divine',icon:'🕊️',
      desc:'PASSIVE: Devotion regens 1/turn. All healing doubled. Sacred Flame and Channel Divinity have no cooldowns. Miracle usable every rest.',
      type:'passive',effect:'vessel_divine'},
  },
  druid:{
    ultimate1:{id:'primal_avatar',name:'Primal Avatar',icon:'🌿',
      desc:'+80 temp HP, +3d6 nature dmg, immune to conditions, Wild Shape free — 4 turns. On expiry: 4d8 nature damage.',
      type:'bonus',effect:'primal_avatar'},
    capstone:{id:'the_green',name:'The Green',icon:'🌍',
      desc:"PASSIVE: Wild Shape unlimited charges. Entering Wild Shape heals 20 HP. Nature's Charge regens 1/turn. Primal Avatar lasts 8 turns and recharges every fight.",
      type:'passive',effect:'the_green'},
  },
};

const UPGRADES_DATA = [
  {id:'blade',name:'Sharpen Blade',icon:'⚔️',desc:'+5 ATK',cost:60,eff:'atk',val:5},
  {id:'tough',name:'Toughen Up',icon:'❤️',desc:'+30 Max HP',cost:80,eff:'maxHp',val:30},
  {id:'iron',name:'Reinforce Armor',icon:'🛡️',desc:'+8 DEF',cost:130,eff:'def',val:8},
  {id:'xpbook',name:"Scholar's Tome",icon:'📚',desc:'+20% XP',cost:200,eff:'xpMult',val:.2},
  {id:'crit',name:'Eagle Eye',icon:'🎯',desc:'+1 Crit range',cost:180,eff:'crit',val:1},
];

// ── UNIFIED 18-TALENT SHUFFLE POOLS (replaces T1/T2 split) ──
// Each run draws 3 random unseen talents per pick. No repeats.
const TALENT_POOLS = {
  fighter:[
    {icon:'💪',name:'Weapon Master',desc:'+10% weapon damage',apply:(g)=>{}},
    {icon:'🛡',name:'Iron Hide',desc:'+6 DEF permanently',apply:(g)=>{g.def+=6;}},
    {icon:'🎯',name:'Precision Strikes',desc:'Crit range +1 (crit on 19-20)',apply:(g)=>{g.critBonus=(g.critBonus||0)+1;}},
    {icon:'⚔️',name:'Relentless',desc:'On kill, regain your action instantly (once per turn)',apply:(g)=>{g._relentless=true;}},
    {icon:'🔱',name:'War Gods Blessing',desc:'+15% all damage and +8 DEF permanently',apply:(g)=>{g.def+=8;}},
    {icon:'💀',name:'Execute',desc:'Deal double damage to enemies below 25% HP',apply:(g)=>{g._execute=true;}},
    {icon:'🩸',name:'Bloody Momentum',desc:'Killing blow restores 30 Momentum instantly',apply:(g)=>{g._bloodyMomentum=true;}},
    {icon:'🔄',name:'Relentless Advance',desc:'Second Wind also removes one negative condition',apply:(g)=>{g._relentlessAdvance=true;}},
    {icon:'🏰',name:'Bulwark',desc:'Parry counter-damages for 5+STR when triggered',apply:(g)=>{g._bulwark=true;}},
    {icon:'🗡',name:'Blade Dancer',desc:'Each consecutive attack deals +5 bonus damage (stacks 3×)',apply:(g)=>{g._bladeDancer=true;}},
    {icon:'🦾',name:'Ironclad Will',desc:'+20 Max HP and immunity to Frightened',apply:(g)=>{g.maxHp+=20;g.hp=Math.min(g.maxHp,g.hp+20);g._immuneFrightened=true;}},
    {icon:'⚡',name:'Battle Rhythm',desc:'Power Strike cooldown reduced by 1 turn',apply:(g)=>{g._battleRhythm=true;}},
    {icon:'🩹',name:"Veteran's Grit",desc:'Restore 5 HP whenever you consume Momentum',apply:(g)=>{g._veteranGrit=true;}},
    {icon:'🎖',name:'Hardened',desc:'Reduce all incoming damage by 4 permanently',apply:(g)=>{g._sanctuary=(g._sanctuary||0)+4;}},
    {icon:'🌪',name:'Flurry',desc:'Once per fight, attack twice in one action (free)',apply:(g)=>{g._flurry=true;}},
    {icon:'🔥',name:'Burning Blade',desc:'Basic attacks have 20% chance to apply Burning',apply:(g)=>{g._burningBlade=true;}},
    {icon:'👁',name:'Combat Awareness',desc:'Parry and Second Wind each gain +1 charge',apply:(g)=>{if(g.skillCharges){if(g.skillCharges.parry!==undefined)g.skillCharges.parry++;if(g.skillCharges.second_wind!==undefined)g.skillCharges.second_wind++;}}},
    {icon:'☠️',name:'Deathblow',desc:'Attacks against enemies below 50% HP deal +15% damage',apply:(g)=>{g._deathblow=true;}},
  ],
  wizard:[
    {icon:'🔥',name:'Spell Power',desc:'+15% spell damage',apply:(g)=>{}},
    {icon:'🧠',name:'Arcane Memory',desc:'+1 LVL3 slot per rest',apply:(g)=>{if(g.spellSlotsMax&&g.spellSlotsMax[3]!==undefined){g.spellSlotsMax[3]++;g.spellSlots[3]=(g.spellSlots[3]||0)+1;}else{g.arcaneMemoryPending=true;}}},
    {icon:'📖',name:'Quick Study',desc:'+20% XP gain',apply:(g)=>{g.xpMult+=0.2;}},
    {icon:'🌀',name:'Arcane Surge',desc:'Every 3rd spell cast is free (no slot cost)',apply:(g)=>{g._arcaneSurgeCount=0;}},
    {icon:'💥',name:'Overload',desc:'Spells that miss still deal 30% damage',apply:(g)=>{g._overload=true;}},
    {icon:'🧿',name:'Counterspell Mastery',desc:'+4 MAG ATK and crit on 18-20 for spells',apply:(g)=>{g.magBonus+=4;g.critBonus=(g.critBonus||0)+2;}},
    {icon:'🌀',name:'Metamagic: Twin',desc:'Once per rest, cast any cantrip twice in one action',apply:(g)=>{g._metamagicTwin=true;}},
    {icon:'📜',name:'Prepared Caster',desc:'Start each fight with 1 bonus LVL1 spell slot',apply:(g)=>{g._preparedCaster=true;}},
    {icon:'❄️',name:'Elemental Shift',desc:'Fire Bolt toggles: Fire (Burning), Ice (-4 DEF), Lightning (50% Stun)',apply:(g)=>{g._elementalShift=true;g._elementalShiftType='fire';}},
    {icon:'🔮',name:'Spell Weaver',desc:'Casting a spell has 25% chance to restore 1 LVL1 slot',apply:(g)=>{g._spellWeaver=true;}},
    {icon:'💡',name:'Brilliant Focus',desc:'+INT modifier added to all spell damage rolls',apply:(g)=>{g._brilliantFocus=true;}},
    {icon:'🌊',name:'Tidal Surge',desc:"Fireball's damage die increases to d8",apply:(g)=>{g._tidalSurge=true;}},
    {icon:'🧊',name:'Flash Freeze',desc:'Mirror Image also Slows enemy (-4 DEF) when a copy is destroyed',apply:(g)=>{g._flashFreeze=true;}},
    {icon:'🎇',name:'Chain Lightning',desc:'Magic Missile has 30% chance to arc and deal half damage again',apply:(g)=>{g._chainLightning=true;}},
    {icon:'🛡',name:'Mage Armor',desc:'+8 DEF permanently',apply:(g)=>{g.def+=8;}},
    {icon:'⚡',name:'Overcharged',desc:'Empowered Blast costs 0 slots once per rest',apply:(g)=>{g._overcharged=true;}},
    {icon:'🌑',name:'Void Tap',desc:'On kill, restore 1 spell slot of any tier',apply:(g)=>{g._voidTap=true;}},
    {icon:'🔁',name:'Recycled Magic',desc:'Counterspell refunds its slot cost on success',apply:(g)=>{g._recycledMagic=true;}},
  ],
  rogue:[
    {icon:'🗡',name:'Death Mark',desc:'Sneak Attack +1d6',apply:(g)=>{}},
    {icon:'💨',name:'Ghost Step',desc:'First attack each fight has advantage',apply:(g)=>{}},
    {icon:'🎲',name:'Luck',desc:'+15% gold drops',apply:(g)=>{g.goldMult=(g.goldMult||1)+0.15;}},
    {icon:'🩸',name:'Hemorrhage',desc:'Sneak Attack applies Bleeding: 5 dmg/turn for 3 turns',apply:(g)=>{g._hemorrhage=true;}},
    {icon:'🌑',name:'Shadow Form',desc:'Once per fight, fully dodge one attack (auto reaction)',apply:(g)=>{g._shadowForm=true;}},
    {icon:'💎',name:'Master Thief',desc:'+30% gold from all sources, +10 ATK permanently',apply:(g)=>{g.atk+=10;g.goldMult=(g.goldMult||1)+0.3;}},
    {icon:'💀',name:'Throat Cut',desc:'Sneak Attack 15% chance to Silence enemy (blocks special 1 turn)',apply:(g)=>{g._throatCut=true;}},
    {icon:'🌑',name:'Shadow Step',desc:'Once per fight, next attack is an automatic critical hit',apply:(g)=>{g._shadowStep=true;}},
    {icon:'🎰',name:'Loaded Dice',desc:'Every attack generates 2 Combo Points instead of 1',apply:(g)=>{g._loadedDice=true;}},
    {icon:'🔪',name:'Hair Trigger',desc:'Sneak Attack usable every turn (no setup required)',apply:(g)=>{g._hairTrigger=true;}},
    {icon:'🕵️',name:'Opportunist',desc:'Gain 1 Combo Point whenever the enemy misses you',apply:(g)=>{g._opportunist=true;}},
    {icon:'🐍',name:'Venomous',desc:'Basic attacks have 25% chance to apply Poisoned (3 turns)',apply:(g)=>{g._venomous=true;}},
    {icon:'💸',name:'Fence Network',desc:'Gold gained from all sources increased by 25%',apply:(g)=>{g.goldMult=(g.goldMult||1)+0.25;}},
    {icon:'🌀',name:'Blur',desc:'Cunning Action also grants 20% dodge chance for 2 turns',apply:(g)=>{g._blur=true;}},
    {icon:'🎯',name:'Exploit Weakness',desc:'Sneak Attack deals +50% damage to Poisoned or Bleeding enemies',apply:(g)=>{g._exploitWeakness=true;}},
    {icon:'👻',name:'Phantasm',desc:'Uncanny Dodge reduces damage by 75% instead of 50%',apply:(g)=>{g._phantasm=true;}},
    {icon:'⚡',name:'Electric Reflexes',desc:'Gain 1 Combo Point at the start of every combat turn',apply:(g)=>{g._electricReflexes=true;}},
    {icon:'🩻',name:'Anatomy',desc:'Sneak Attack has 10% chance to Stun enemy for 1 turn',apply:(g)=>{g._anatomy=true;}},
  ],
  paladin:[
    {icon:'✨',name:'Holy Fervor',desc:'Divine Smite costs 1 less Holy Power',apply:(g)=>{}},
    {icon:'❤️',name:'Lay on Hands+',desc:'Lay on Hands heals 50% more',apply:(g)=>{g.layOnHandsPool=Math.floor((g.layOnHandsPool||5)*1.5);}},
    {icon:'😇',name:'Radiance',desc:'2 radiant dmg to all who hit you',apply:(g)=>{}},
    {icon:'⚡',name:'Avenging Angel',desc:'Divine Smite heals you for half the damage dealt',apply:(g)=>{g._avengingAngel=true;}},
    {icon:'🛡',name:'Impenetrable Aegis',desc:'+15 DEF and enemies deal -10% damage to you',apply:(g)=>{g.def+=15;g._damageMitigation=(g._damageMitigation||0)+0.1;}},
    {icon:'🌟',name:'Sacred Aura',desc:'All heals doubled; Lay on Hands pool +50',apply:(g)=>{g.layOnHandsPool+=50;g._healMult=(g._healMult||1)*2;}},
    {icon:'🗡',name:'Smite Chain',desc:'Divine Smite can trigger twice in one turn (+1 Holy Power)',apply:(g)=>{g._smiteChain=true;}},
    {icon:'🛡',name:'Bulwark of Faith',desc:'Divine Shield also Frightens the attacker (WIS save DC 13)',apply:(g)=>{g._bulwarkFaith=true;}},
    {icon:'💛',name:'Restorative Aura',desc:'Lay on Hands removes one condition on use',apply:(g)=>{g._restorativeAura=true;}},
    {icon:'⚜️',name:'Holy Reservoir',desc:'Maximum Holy Power increased by 2',apply:(g)=>{g.resMax+=2;}},
    {icon:'🌠',name:'Blessed Arms',desc:'Basic attacks generate Holy Power every 2 hits',apply:(g)=>{g._blessedArms=true;g._blessedArmsCount=0;}},
    {icon:'🕊️',name:'Grace',desc:'Lay on Hands gains +1 charge permanently',apply:(g)=>{if(g.skillCharges&&g.skillCharges.lay_on_hands!==undefined)g.skillCharges.lay_on_hands++;}},
    {icon:'🌅',name:"Dawn's Shield",desc:'Divine Shield blocks 2 full attacks before breaking',apply:(g)=>{g._dawnShield=true;}},
    {icon:'🔔',name:'Righteous Fury',desc:'At max Holy Power, deal +20% damage',apply:(g)=>{g._righteousFury=true;}},
    {icon:'💫',name:'Holy Momentum',desc:'On Divine Smite crit, restore 2 Holy Power',apply:(g)=>{g._holyMomentum=true;}},
    {icon:'🛡',name:'Unbreakable Vow',desc:'Below 30% HP: take -30% damage and deal +10% damage',apply:(g)=>{g._unbreakableVow=true;}},
    {icon:'✝️',name:'Consecrated Ground',desc:'Sacred Weapon also reduces enemy DEF by 4 while active',apply:(g)=>{g._consecratedGround=true;}},
    {icon:'👑',name:'Sovereign',desc:'+25 Max HP and +4 DEF permanently',apply:(g)=>{g.maxHp+=25;g.hp=Math.min(g.maxHp,g.hp+25);g.def+=4;}},
  ],
  ranger:[
    {icon:'🎯',name:'Marked Prey',desc:"Hunter's Mark lasts until enemy death",apply:(g)=>{}},
    {icon:'🐺',name:'Beast Bond',desc:'Beast blocks 1 extra hit per fight',apply:(g)=>{}},
    {icon:'👁',name:'Eagle Eye',desc:'Crit range +2 (crit on 18-20)',apply:(g)=>{g.critBonus=(g.critBonus||0)+2;}},
    {icon:'🏹',name:'Volley Mastery',desc:'Volley hits all trigger Hunter\'s Mark bonus',apply:(g)=>{g._volleyMastery=true;}},
    {icon:'🐺',name:'Pack Tactics',desc:'Beast companion attacks every turn automatically (free)',apply:(g)=>{g._packTactics=true;}},
    {icon:'🎯',name:'Deadeye',desc:'First attack each turn crits while enemy is Marked; +10 ATK',apply:(g)=>{g._deadeye=true;g.atk+=10;}},
    {icon:'🏹',name:'Pinning Shot',desc:'Volley has 30% chance to Restrain enemy 1 turn',apply:(g)=>{g._pinningShot=true;}},
    {icon:'🌿',name:'Favored Terrain',desc:'At campfire, choose terrain: +15% damage in next fight',apply:(g)=>{g._favoredTerrain=true;}},
    {icon:'🦅',name:'Hawk Eye',desc:"Hunter's Mark bonus increases from 1d6 to 1d8",apply:(g)=>{g._hawkEye=true;}},
    {icon:'🐾',name:'Apex Companion',desc:'Beast companion deals +1d6 bonus damage permanently',apply:(g)=>{g._apexCompanion=true;}},
    {icon:'🏃',name:'Swift Tracker',desc:"Hunter's Mark applies at fight start for free (saves 1 Focus)",apply:(g)=>{g._swiftTracker=true;}},
    {icon:'🌲',name:'Woodland Stride',desc:'+15 Max HP and immune to Restrained condition',apply:(g)=>{g.maxHp+=15;g.hp=Math.min(g.maxHp,g.hp+15);g._immuneRestrained=true;}},
    {icon:'🎖',name:'Seasoned Hunter',desc:'Each kill in a fight increases ATK by 2 until fight ends',apply:(g)=>{g._seasonedHunter=true;}},
    {icon:'🔭',name:'Long Shot',desc:"Volley's damage die increases to d8",apply:(g)=>{g._longShot=true;}},
    {icon:'🐍',name:'Viper Arrows',desc:'Attacks have 20% chance to apply Poisoned (3 turns)',apply:(g)=>{g._viperArrows=true;}},
    {icon:'🌀',name:'Evasion',desc:'When you dodge or Beast blocks a hit, gain 1 Focus',apply:(g)=>{g._evasionFocus=true;}},
    {icon:'💥',name:'Explosive Arrow',desc:'Once per fight, first crit deals double damage',apply:(g)=>{g._explosiveArrow=true;}},
    {icon:'🔗',name:'Binding Mark',desc:"Hunter's Mark also reduces enemy ATK by 4 while active",apply:(g)=>{g._bindingMark=true;}},
  ],
  barbarian:[
    {icon:'😡',name:'Endless Rage',desc:'Rage lasts 2 extra rounds',apply:(g)=>{}},
    {icon:'💪',name:'Brutal',desc:'+4 damage while raging',apply:(g)=>{}},
    {icon:'🩸',name:'Blood Fury',desc:'+20% damage below 50% HP',apply:(g)=>{}},
    {icon:'💣',name:'Juggernaut',desc:'Reckless Attack no longer deals recoil damage',apply:(g)=>{g._juggernaut=true;}},
    {icon:'🔥',name:'Undying Fury',desc:'Survive at 1 HP once per rest when you would drop to 0',apply:(g)=>{g._undyingFury=true;}},
    {icon:'⚡',name:'Thunder Clap',desc:'While raging, deal 1d6+LVL/4 bonus damage once per turn',apply:(g)=>{g._thunderClap=true;}},
    {icon:'🌋',name:'Volcanic Rage',desc:'Reckless Attack deals 1d6 burn to enemy instead of recoil to self',apply:(g)=>{g._volcanicRage=true;}},
    {icon:'💀',name:"Death's Door",desc:'Below 20% HP, Rage activates automatically each turn for free',apply:(g)=>{g._deathsDoor=true;}},
    {icon:'🔱',name:'Indomitable',desc:'Once per rest, automatically succeed on a failed saving throw',apply:(g)=>{g._indomitable=true;}},
    {icon:'🪨',name:'Stone Skin',desc:'+10 DEF while raging',apply:(g)=>{g._stoneSkin=true;}},
    {icon:'🐗',name:'Feral Charge',desc:'First attack each fight deals +2d6 bonus damage',apply:(g)=>{g._feralCharge=true;}},
    {icon:'💢',name:'Unstoppable',desc:'Immune to Restrained and Stunned while raging',apply:(g)=>{g._unstoppable=true;}},
    {icon:'🔴',name:'Bloodlust',desc:'Each kill extends Rage duration by 1 round',apply:(g)=>{g._bloodlust=true;}},
    {icon:'🏔',name:"Mountain's Weight",desc:'Retaliation damage increases to 1d8+STR',apply:(g)=>{g._mountainWeight=true;}},
    {icon:'🩺',name:'Battle Trance',desc:'Raging restores 5 HP at start of each of your turns',apply:(g)=>{g._battleTrance=true;}},
    {icon:'⚔️',name:'War Cry',desc:'Once per fight, Frighten enemy as free action at fight start',apply:(g)=>{g._warCry=true;}},
    {icon:'🌊',name:'Tidal Force',desc:"Reckless Attack damage die increases to d12",apply:(g)=>{g._tidalForce=true;}},
    {icon:'💥',name:'Rupture',desc:'Attacks against Stunned enemies deal double damage',apply:(g)=>{g._rupture=true;}},
  ],
  cleric:[
    {icon:'💚',name:'Blessed Healing',desc:'All heals +5 extra HP',apply:(g)=>{}},
    {icon:'☀️',name:'Radiant Soul',desc:'Sacred Flame +1d4 damage',apply:(g)=>{}},
    {icon:'🛡',name:'Divine Armor',desc:'+5 to all saving throws',apply:(g)=>{}},
    {icon:'☀️',name:'Divine Intervention',desc:'Once per rest, fully heal yourself as a free action',apply:(g)=>{g._divineIntervention=true;}},
    {icon:'⚡',name:'Wrath of God',desc:'Sacred Flame now hits twice each cast',apply:(g)=>{g._wrathOfGod=true;}},
    {icon:'🛡',name:'Sanctuary',desc:'Reduce all incoming damage by 8 permanently',apply:(g)=>{g._sanctuary=(g._sanctuary||0)+8;}},
    {icon:'⚡',name:'Wrath of the Righteous',desc:'Sacred Flame applies Vulnerable (+15% dmg taken) for 1 turn',apply:(g)=>{g._wrathRighteous=true;}},
    {icon:'🌟',name:'Spiritual Armor',desc:'Spiritual Weapon grants +4 DEF while active',apply:(g)=>{g._spiritualArmor=true;}},
    {icon:'🙏',name:'Devoted Soul',desc:'Each Devotion point regenerated also heals 2 HP',apply:(g)=>{g._devotedSoul=true;}},
    {icon:'🕯',name:'Eternal Flame',desc:'Sacred Flame has no cooldown between casts',apply:(g)=>{g._eternalFlame=true;}},
    {icon:'📿',name:'Holy Ward',desc:'Start each fight with a barrier absorbing 15 damage',apply:(g)=>{g._holyWard=true;}},
    {icon:'🌊',name:'Tidal Grace',desc:'Healing Word heals an extra 1d6 HP',apply:(g)=>{g._tidalGrace=true;}},
    {icon:'✝️',name:'Undying Light',desc:'Automatically stabilize at 1 HP once per rest instead of dying',apply:(g)=>{g._undyingLight=true;}},
    {icon:'💫',name:'Overflowing Font',desc:'Healing Word triggers twice in one bonus action (once per fight)',apply:(g)=>{g._overflowingFont=true;}},
    {icon:'🔔',name:'Devotion Engine',desc:'Channel Divinity cooldown reduced to 3 turns',apply:(g)=>{g._devotionEngine=true;}},
    {icon:'🌅',name:'Sunrise',desc:'At fight start, heal 10 HP automatically',apply:(g)=>{g._sunrise=true;}},
    {icon:'👁',name:'All-Seeing',desc:'Spiritual Weapon attacks have crit range 18-20',apply:(g)=>{g._allSeeing=true;}},
    {icon:'🌿',name:'Life Surge',desc:'Preserve Life heals an additional 2d8 HP',apply:(g)=>{g._lifeSurge=true;}},
  ],
  druid:[
    {icon:'🐻',name:'Beast Mastery',desc:'Wild Shape grants +15 more temp HP',apply:(g)=>{}},
    {icon:'🌿',name:'Nature Bond',desc:"Nature's Charge regens 50% faster",apply:(g)=>{}},
    {icon:'🌙',name:'Lunar Magic',desc:'Moonbeam +1d6 damage',apply:(g)=>{}},
    {icon:'🌊',name:'Primal Force',desc:'Wild Shape costs no action — activate as free bonus',apply:(g)=>{g._primalForce=true;}},
    {icon:'⚡',name:'Storm Call',desc:'Each combat round, lightning strikes enemy for 8+LVL damage',apply:(g)=>{g._stormCall=true;}},
    {icon:'🌿',name:'Overgrowth',desc:'Entangle roots enemy permanently until they save (DC rises each round)',apply:(g)=>{g._overgrowth=true;}},
    {icon:'🌿',name:'Wild Surge',desc:'Entering or exiting Wild Shape deals 1d6 nature damage to enemy',apply:(g)=>{g._wildSurge=true;}},
    {icon:'🐾',name:'Apex Predator',desc:'Claw Strike has 20% chance to Restrain enemy (1 turn)',apply:(g)=>{g._apexPredator=true;}},
    {icon:'🌙',name:'Waxing Moon',desc:'Moonbeam damage increases by 1d6 each consecutive cast (resets on rest)',apply:(g)=>{g._waxingMoon=true;g._waxingMoonStacks=0;}},
    {icon:'🍃',name:'Verdant Growth',desc:"+20 Max HP and Nature's Charge max increased by 1",apply:(g)=>{g.maxHp+=20;g.hp=Math.min(g.maxHp,g.hp+20);g.resMax+=1;}},
    {icon:'🌾',name:'Regrowth',desc:'Entering Wild Shape heals 10 HP in addition to granting temp HP',apply:(g)=>{g._regrowth=true;}},
    {icon:'🌲',name:'Ancient Bark',desc:'While in Wild Shape, reduce all incoming damage by 6',apply:(g)=>{g._ancientBark=true;}},
    {icon:'🌑',name:'Dark Moon',desc:'Thorn Whip has 25% chance to apply Poisoned (3 turns)',apply:(g)=>{g._darkMoon=true;}},
    {icon:'🔥',name:'Wildfire',desc:'Elemental Strike deals +1d6 bonus damage of its element',apply:(g)=>{g._wildfire=true;}},
    {icon:'🌀',name:'Cyclone',desc:'Entangle also deals 1d6 damage per turn while active',apply:(g)=>{g._cyclone=true;}},
    {icon:'🐻',name:"Bear's Endurance",desc:"Wild Shape temp HP pool increased by 25% of your max HP",apply:(g)=>{g._bearsEndurance=true;}},
    {icon:'⚡',name:'Living Lightning',desc:'Moonbeam has 30% chance to Stun enemy for 1 turn',apply:(g)=>{g._livingLightning=true;}},
    {icon:'🌊',name:'Tidal Roots',desc:'Entangle DC increases by 3 and lasts 1 extra turn',apply:(g)=>{g._tidalRoots=true;}},
  ],
};

// Helper: pick a random item from the ITEMS array by rarity
function _eventItem(rarity){return {...ITEMS.filter(i=>i.rarity===rarity&&i.type!=='material'),qty:1};}

const RANDOM_EVENTS = [
  // ── UNIVERSAL EVENTS (any zone) ────────────────────────────
  {title:'THE WOUNDED TRAVELER',
   zones:null,
   text:'"A badly wounded traveler collapses at your feet. They whisper of a nearby cache of supplies. Help me... and I will show you the way."',
   choices:[
     {text:'Aid them — gain a healing potion',outcome:(g)=>{addItem({...ITEMS.find(i=>i.id==='hpPotion'),qty:1});return '✓ You healed the traveler. They gave you a potion in gratitude.'}},
     {text:'Take their gold and leave (gain 25g)',outcome:(g)=>{g.gold+=25;return '✓ You took their purse (25g). A cold choice.'}},
     {text:'Pass them by',outcome:(g)=>'You left them to their fate. Some burdens are not yours to carry.'},
   ]},
  {title:'THE MYSTERIOUS MERCHANT',
   zones:null,
   text:'"A cloaked figure materialises from shadow, offering a glowing vial. This could change your life... or end it. Fifty gold, if you dare."',
   choices:[
     {text:'Buy it for 50g — guaranteed full heal',outcome:(g)=>{if(g.gold>=50){g.gold-=50;g.hp=g.maxHp;return '✓ The elixir tastes of starlight. Fully healed!'}return '✗ Not enough gold.'}},
     {text:'Drink the free sample (50/50 risk)',outcome:(g)=>{if(Math.random()<.5){g.hp=g.maxHp;return '✓ It healed you completely!'}else{g.hp=Math.max(1,g.hp-Math.floor(g.maxHp*.3));return '✗ It burned like acid. You lost 30% HP.'}}},
     {text:'Refuse and walk away',outcome:(g)=>'You walk away. The figure dissolves like smoke.'},
   ]},
  {title:'THE OLD SHRINE',
   zones:null,
   text:'"Half-buried in rubble stands an ancient shrine. Offerings left here long ago have rotted to dust — but the idol\'s eyes still glow faintly. Pray, take, or move on?"',
   choices:[
     {text:'Pray at the shrine (restore 30% HP)',outcome:(g)=>{const h=Math.floor(g.maxHp*.3);g.hp=Math.min(g.maxHp,g.hp+h);return `✓ Warmth floods through you. Restored ${h} HP.`}},
     {text:'Take the offering gold (20g, risk a curse)',outcome:(g)=>{g.gold+=20;if(Math.random()<.4){g.hp=Math.max(1,g.hp-15);return '✓ You took 20g — then felt a sudden cold. Lost 15 HP.'}return '✓ You pocketed 20g. No curse. Lucky.'}},
     {text:'Leave an offering (spend 10g, gain XP)',outcome:(g)=>{if(g.gold>=10){g.gold-=10;g.xp+=Math.floor(g.xpNeeded*.08);return '✓ You spent 10g in tribute. A small blessing of insight fills you.'}return '✗ You have no gold to offer.'}},
   ]},
  {title:'THE GAMBLER\'S DICE',
   zones:null,
   text:'"A skeletal hand emerges from a crack in the wall, clutching a pair of dice. A note reads: Roll for fortune, or walk away poorer in spirit."',
   choices:[
     {text:'Roll the dice (win or lose 40g)',outcome:(g)=>{const r=Math.floor(Math.random()*6)+Math.floor(Math.random()*6)+2;if(r>=7){g.gold+=40;return `✓ You rolled ${r}! Fortune smiles — gained 40g.`}else{g.gold=Math.max(0,g.gold-40);return `✗ You rolled ${r}. The hand snatches 40g from you.`}}},
     {text:'Bet big — 80g for double (50/50)',outcome:(g)=>{if(g.gold<80)return '✗ Not enough gold to bet.';if(Math.random()<.5){g.gold+=80;return '✓ Against all odds, you doubled it! +80g.'}g.gold-=80;return '✗ You lost it all. 80g gone.'}},
     {text:'Ignore the dice',outcome:(g)=>'You walk past the dice. They stop themselves with a clatter. Probably rigged anyway.'},
   ]},
  {title:'THE FALLEN WARRIOR',
   zones:null,
   text:'"You find a dying warrior propped against a wall, still clutching their weapon. Their eyes flicker open. "Take it," they rasp. "Don\'t let it rust here.""',
   choices:[
     {text:'Accept their weapon (random uncommon)',outcome:(g)=>{const pool=ITEMS.filter(i=>i.rarity==='uncommon'&&i.type==='weapon');const item={...pool[Math.floor(Math.random()*pool.length)],qty:1};addItem(item);return `✓ You took the ${item.name}. The warrior smiled and closed their eyes.`}},
     {text:'Heal them with a potion instead',outcome:(g)=>{const idx=g.inventory.findIndex(i=>i&&(i.id==='hpPotion'||i.id==='strongPotion'));if(idx===-1)return '✗ You have no potions to spare.';g.inventory[idx].qty--;if(g.inventory[idx].qty<=0)g.inventory[idx]=null;g.xp+=Math.floor(g.xpNeeded*.12);return '✓ You used a potion on them. They gripped your arm in thanks. Gained bonus XP.'}},
     {text:'Leave them in peace',outcome:(g)=>'You close their eyes and move on. Some things cannot be saved.'},
   ]},
  {title:'THE ECHOING VOICE',
   zones:null,
   text:'"A disembodied voice fills the air: "Answer me truly, traveller. What do you fight for?" It feels like a test — or a trap."',
   choices:[
     {text:'Answer: Glory (gain 5% crit chance)',outcome:(g)=>{g.critBonus=(g.critBonus||0)+1;return '✓ The voice laughs — low and approving. Crit range +1.'}},
     {text:'Answer: Survival (gain 25 max HP)',outcome:(g)=>{g.maxHp+=25;g.hp+=25;return '✓ The voice sighs knowingly. Your body feels more resilient.'}},
     {text:'Answer: Nothing (50/50 punish or reward)',outcome:(g)=>{if(Math.random()<.5){g.gold+=60;return '✓ Silence. Then gold rains from nowhere. 60g.'}g.hp=Math.max(1,g.hp-Math.floor(g.maxHp*.25));return '✗ The voice screams. You lose 25% HP.'}},
   ]},

  // ── WOODS / EARLY ZONE EVENTS ──────────────────────────────
  {title:'THE SPIDER\'S WEB',
   zones:['woods','outpost'],
   text:'"Thick webs block the path. Something enormous has been feeding here recently — bones and armour scraps litter the ground. There might be something worth salvaging."',
   choices:[
     {text:'Carefully search the webs (50% find rare item)',outcome:(g)=>{if(Math.random()<.5){const pool=ITEMS.filter(i=>i.rarity==='rare'&&i.slot);const item={...pool[Math.floor(Math.random()*pool.length)],qty:1};addItem(item);return `✓ Wrapped in silk: ${item.icon} ${item.name}! You cut it free.`}return '✗ Nothing but old bones and rusted metal.'}},
     {text:'Burn the webs (take 8 dmg, clear path)',outcome:(g)=>{g.hp=Math.max(1,g.hp-8);return '✓ The webs ignite. You burst through — scorched but moving. Lost 8 HP.'}},
     {text:'Find a way around — lose nothing',outcome:(g)=>'You circle the webs cautiously. Slower, but safer.'},
   ]},
  {title:'THE WOLF PACK',
   zones:['woods'],
   text:'"You hear growling from the shadows. A pair of amber eyes blink at you — then a dozen more. You\'re surrounded. How do you respond?"',
   choices:[
     {text:'Stand firm and stare them down (WIS check)',outcome:(g)=>{if(Math.random()<.55){return '✓ The pack leader blinks first. They slink away — you\'ve earned a predator\'s respect.'}g.hp=Math.max(1,g.hp-12);return '✗ They attack as one. You fight them off — barely. Lost 12 HP.'}},
     {text:'Throw meat from rations (lose 10g value)',outcome:(g)=>{g.gold=Math.max(0,g.gold-10);return '✓ You distract them with scraps. The pack feeds and ignores you.'}},
     {text:'Run (50% escape, 50% get bitten for 15 dmg)',outcome:(g)=>{if(Math.random()<.5)return '✓ You sprint clear. They give up after a hundred yards.';g.hp=Math.max(1,g.hp-15);return '✗ One catches you. Bite wounds — lost 15 HP.'}},
   ]},

  // ── CASTLE / UNDEAD ZONE EVENTS ───────────────────────────
  {title:'THE HAUNTED ARMORY',
   zones:['outpost','castle'],
   text:'"Ghostly light spills from a cracked door. Inside: racks of ancient arms, still gleaming. The armour shifts. Something is still wearing it."',
   choices:[
     {text:'Speak to the spirit (ask for armour)',outcome:(g)=>{if(Math.random()<.6){const pool=ITEMS.filter(i=>i.rarity==='uncommon'&&(i.type==='armor'||i.type==='offhand'));const item={...pool[Math.floor(Math.random()*pool.length)],qty:1};addItem(item);return `✓ The ghost nods slowly and releases ${item.icon} ${item.name}.`}return '✗ The spirit screams and hurls you back. Lost 10 HP.';g.hp=Math.max(1,g.hp-10);}},
     {text:'Grab what you can and run (gain 50g)',outcome:(g)=>{g.gold+=50;g.hp=Math.max(1,g.hp-10);return '✓ You bolt with 50g in gear. The spirit shrieks behind you. Lost 10 HP.'}},
     {text:'Leave the dead to their rest',outcome:(g)=>'You back away slowly. The door swings shut with a hollow click.'},
   ]},
  {title:'THE NECROTIC POOL',
   zones:['underdark','castle'],
   text:'"A pool of faintly glowing liquid fills a stone basin. It smells of death — but also of power. Cultists have been using this. You could too."',
   choices:[
     {text:'Drink from the pool (gain +20 max HP, take 15 dmg)',outcome:(g)=>{g.maxHp+=20;g.hp=Math.max(1,g.hp-15);return '✓ Vile — but invigorating. Max HP +20. Lost 15 HP to the ritual.'}},
     {text:'Splash it on your weapon (+5 ATK for this zone)',outcome:(g)=>{g.atk+=5;return '✓ The necrotic fluid clings to the blade. +5 ATK until next zone.'}},
     {text:'Collapse the basin — deny the cultists',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.1);return '✓ You shatter the basin. Power wasted — but it\'s the right call. Small XP bonus.'}},
   ]},

  // ── ABYSS / HIGH ZONE EVENTS ──────────────────────────────
  {title:'THE DEMON\'S BARGAIN',
   zones:['abyss','shadowrealm','celestial'],
   text:'"A lesser demon kneels before you — unusual enough to stop you cold. It speaks: "I can make you stronger, mortal. All it costs is something small... your future pain.""',
   choices:[
     {text:'Accept the bargain (+40 max HP, -10 DEF)',outcome:(g)=>{g.maxHp+=40;g.hp+=40;g.def=Math.max(0,g.def-10);return '✓ Power floods in — then a cold numbness. Max HP +40, DEF -10.'}},
     {text:'Accept the bargain (+15 ATK, lose 25% current HP)',outcome:(g)=>{g.atk+=15;g.hp=Math.max(1,Math.floor(g.hp*.75));return '✓ Your strikes become devastating. ATK +15. Lost 25% HP as the price.'}},
     {text:'Destroy the demon (gain 80 XP)',outcome:(g)=>{g.xp+=80;return '✓ You drive your weapon through it. Some bargains should never be made. +80 XP.'}},
   ]},
  {title:'THE CELESTIAL FRAGMENT',
   zones:['celestial','frostpeak','shadowrealm'],
   text:'"A shard of divine light hovers in the air before you, pulsing with raw celestial energy. It burns to look at. Touching it could do anything."',
   choices:[
     {text:'Absorb the fragment (50/50 boon or backlash)',outcome:(g)=>{if(Math.random()<.5){g.maxHp+=30;g.hp=g.maxHp;return '✓ Divine fire remakes you. Max HP +30, fully healed!'}g.hp=Math.max(1,g.hp-Math.floor(g.maxHp*.4));return '✗ The energy is too raw. It tears through you — 40% HP lost.'}},
     {text:'Contain it in a vial (gain strong potion)',outcome:(g)=>{addItem({...ITEMS.find(i=>i.id==='strongPotion'),qty:1});return '✓ The fragment condenses into a glowing draught. Gain Strong Potion.'}},
     {text:'Shatter it — deny its power to enemies',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.15);g.gold+=40;return '✓ The shard explodes in a shower of motes. XP bonus + 40g of residue.'}},
   ]},
  {title:'THE MIRROR OF REGRET',
   zones:['shadowrealm','underdark'],
   text:'"A perfect mirror stands alone in the dark, showing a reflection that is not yours. It shows you as you could have been — stronger, rested, whole."',
   choices:[
     {text:'Reach into the mirror (fully restores HP)',outcome:(g)=>{g.hp=g.maxHp;return '✓ Cold hands pull you through and push you back. You are whole again.'}},
     {text:'Smash the mirror (gain 60g from the shards)',outcome:(g)=>{g.gold+=60;if(Math.random()<.3){g.hp=Math.max(1,g.hp-8);return '✓ The shards shimmer gold. 60g — and a small cut. Lost 8 HP.'}return '✓ The shards rain down as coins. 60g.'}},
     {text:'Walk away — some reflections are traps',outcome:(g)=>{if(Math.random()<.4){g.xp+=Math.floor(g.xpNeeded*.1);return '✓ Wise. The mirror cracks on its own. Small XP bonus for resisting temptation.'}return 'You walk away. The mirror watches you go.'}},
   ]},
  {title:'THE FROST GIANT\'S CHALLENGE',
   zones:['frostpeak'],
   text:'"A frost giant blocks the pass, grinning. "I will not let a small thing pass without sport. Fight me, pay me, or amuse me.""',
   choices:[
     {text:'Duel it — arm wrestle (CON check, 65% win)',outcome:(g)=>{if(Math.random()<.65){g.xp+=Math.floor(g.xpNeeded*.2);g.gold+=80;return '✓ You slam its arm down. It roars with laughter and tosses you 80g. +XP.'}g.hp=Math.max(1,g.hp-30);return '✗ Its strength is immense. You walk away with 30 HP less and your dignity in tatters.'}},
     {text:'Pay the toll (50g)',outcome:(g)=>{if(g.gold>=50){g.gold-=50;return '✓ You pay. It steps aside with a grunt.'}return '✗ You don\'t have enough gold.'}},
     {text:'Tell it a joke (random outcome)',outcome:(g)=>{const r=Math.random();if(r<.33){g.hp=g.maxHp;return '✓ The giant howls with laughter. "Go, little funny-thing!" Your spirits lift — full HP.'}if(r<.66)return '... it stares at you blankly, then steps aside without a word.';g.hp=Math.max(1,g.hp-20);return '✗ It doesn\'t get it. You get a flick to the chest for 20 HP.'}},
   ]},
  // ── MORE UNIVERSAL EVENTS ──────────────────────────────────
  {title:'THE CURSED COIN',
   zones:null,
   text:'"A golden coin rests alone on a flat stone, heads-up. No footprints. A small etching reads: ONE WISH."',
   choices:[
     {text:'Pocket it — gain 30g (might be cursed)',outcome:(g)=>{if(Math.random()<.35){g.hp=Math.max(1,g.hp-Math.floor(g.maxHp*.2));return '✗ A chill runs through you as you take it. Cursed. Lost 20% HP.'}g.gold+=30;return '✓ Just a coin after all. 30g richer.'}},
     {text:'Make a wish: more strength (+8 ATK)',outcome:(g)=>{g.atk+=8;return '✓ You whisper your wish. The coin dissolves into light. ATK +8.'}},
     {text:'Toss it back — leave it for another',outcome:(g)=>{if(Math.random()<.3){g.xp+=Math.floor(g.xpNeeded*.1);return '✓ A quiet voice: "Wise." Small XP bonus.'}return 'The coin hits the stone. Heads again. You walk on.'}},
   ]},
  {title:'THE STARVING CHILD',
   zones:null,
   text:'"A small figure in the shadows — hollow eyes, trembling hands. They ask for nothing, which makes it worse."',
   choices:[
     {text:'Give your rations — spend 15g',outcome:(g)=>{if(g.gold<15)return '✗ You have nothing to give.';g.gold-=15;g.maxHp+=10;g.hp+=10;return '✓ A warmth settles in your chest. Max HP +10.'}},
     {text:'Give a healing potion',outcome:(g)=>{const idx=g.inventory.findIndex(i=>i&&i.id==='hpPotion');if(idx===-1)return '✗ You have no potions to spare.';g.inventory[idx].qty--;if(g.inventory[idx].qty<=0)g.inventory[idx]=null;g.xp+=Math.floor(g.xpNeeded*.15);return '✓ The color returns to their cheeks. +XP.'}},
     {text:'Pass by — you cannot save everyone',outcome:(g)=>{if(Math.random()<.4)return 'You keep walking. The guilt is its own weight.';g.hp=Math.max(1,g.hp-5);return 'The guilt manifests physically. Lost 5 HP.'}},
   ]},
  {title:'THE CARTOGRAPHER MAP',
   zones:null,
   text:'"A sealed map shows this very area. It marks danger, treasure — and a red X. You are standing on it."',
   choices:[
     {text:'Dig beneath your feet',outcome:(g)=>{const r=Math.random();if(r<.4){const pool=ITEMS.filter(i=>i.rarity==="rare"&&i.slot);const item={...pool[Math.floor(Math.random()*pool.length)],qty:1};addItem(item);return "✓ You find "+item.icon+" "+item.name+" in a buried satchel."}if(r<.7){g.gold+=90;return "✓ A small lockbox. 90g inside."}g.hp=Math.max(1,g.hp-20);return "✗ A pressure plate. Lost 20 HP."}},
     {text:'Follow the danger markings carefully',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.12);return '✓ You navigate perfectly. +XP for safe passage.'}},
     {text:'Sell the map at the shop (+40g)',outcome:(g)=>{g.gold+=40;return '✓ Maps are worth more to merchants. 40g.'}},
   ]},
  {title:'THE FRIENDLY GHOST',
   zones:null,
   text:'"A translucent figure floats before you — smiling. "I died here three centuries ago," it says cheerfully. "Want some advice?""',
   choices:[
     {text:'Listen to their advice',outcome:(g)=>{const r=Math.random();if(r<.33){g.critBonus=(g.critBonus||0)+4;return '✓ "Always aim for the eyes." Crit +4.'}if(r<.66){g.def+=4;return '✓ "Keep something between you and death." DEF +4.'}g.atk+=4;return '✓ "Strike first. Always." ATK +4.'}},
     {text:'Ask where they hid their treasure',outcome:(g)=>{if(Math.random()<.5){g.gold+=70;return '✓ In a hollow stone. 70g.'}return '✗ "I spent it all before I died." Regrets.'}},
     {text:'Perform a rite — release them',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.18);return '✓ The ghost fades with a sigh of relief. +XP.'}},
   ]},
  {title:'THE CURSED TOME',
   zones:null,
   text:'"A book floats at eye level, pages rewriting themselves. It wants to be opened."',
   choices:[
     {text:'Read it aloud (random effect)',outcome:(g)=>{const r=Math.random();if(r<.25){g.maxHp+=20;g.hp=g.maxHp;return '✓ A healing word. Max HP +20, fully healed.'}if(r<.5){g.atk+=6;g.def-=4;return '✓ A war rite. ATK +6, DEF -4.'}if(r<.75){g.hp=Math.max(1,g.hp-Math.floor(g.maxHp*.3));return '✗ A curse. Lost 30% HP.'}g.xp+=Math.floor(g.xpNeeded*.2);return '✓ An ancient teaching. Large XP bonus.'}},
     {text:'Transcribe a passage (sell to Malachar)',outcome:(g)=>{g.gold+=55;return '✓ Malachar will pay for this. 55g.'}},
     {text:'Burn it before it speaks',outcome:(g)=>{if(Math.random()<.4){g.def+=5;return '✓ As it burns, something protective settles over you. DEF +5.'}return 'It burns cleanly. Some things should stay unread.'}},
   ]},
  {title:'THE BLACKSMITH GHOST',
   zones:null,
   text:'"The clang of hammer on metal rings through an empty forge — tools moving on their own with expert precision."',
   choices:[
     {text:'Offer your weapon for improvement',outcome:(g)=>{
       const bonus=3+Math.floor(Math.random()*5);
       g.atk+=bonus;
       if(g.equipped&&g.equipped.weapon){
         // Clone before modifying to avoid mutating shared ITEMS object
         g.equipped.weapon={...g.equipped.weapon,stats:{...g.equipped.weapon.stats}};
         g.equipped.weapon.stats.atk=(g.equipped.weapon.stats.atk||0)+bonus;
         return "✓ Your weapon emerges sharper. ATK +"+bonus+" (weapon upgraded permanently).";
       }
       return "✓ Your strikes feel sharper even without a weapon. ATK +"+bonus+".";
     }},
     {text:'Offer your armor for improvement',outcome:(g)=>{
       const bonus=3+Math.floor(Math.random()*4);
       g.def+=bonus;
       if(g.equipped&&g.equipped.armor){
         // Clone before modifying to avoid mutating shared ITEMS object
         g.equipped.armor={...g.equipped.armor,stats:{...g.equipped.armor.stats}};
         g.equipped.armor.stats.def=(g.equipped.armor.stats.def||0)+bonus;
         return "✓ Every joint reinforced. DEF +"+bonus+" (armor upgraded permanently).";
       }
       return "✓ Your natural toughness improves. DEF +"+bonus+".";
     }},
     {text:'Watch in silence — learn the technique',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.12);g.critBonus=(g.critBonus||0)+2;return '✓ You absorb their craft. +XP, Crit +2.'}},
   ]},

  // ── WOODS / EARLY EVENTS ────────────────────────────────────
  {title:'THE MUSHROOM CIRCLE',
   zones:['woods','outpost'],
   text:'"A perfect ring of luminescent mushrooms pulses with faint light. The center feels warm and dry."',
   choices:[
     {text:'Eat one mushroom (50/50)',outcome:(g)=>{if(Math.random()<.5){const h=Math.floor(g.maxHp*.4);g.hp=Math.min(g.maxHp,g.hp+h);return "✓ Rich and earthy. Restored "+h+" HP."}g.hp=Math.max(1,g.hp-8);return '✗ The world tilts. Lost 8 HP.'}},
     {text:'Harvest them (50g sell value)',outcome:(g)=>{g.gold+=50;return '✓ Malachar will know their worth. 50g.'}},
     {text:'Sleep in the ring (rest effect)',outcome:(g)=>{const h=Math.floor(g.maxHp*.25);g.hp=Math.min(g.maxHp,g.hp+h);return "✓ Strange, deep sleep. Restored "+h+" HP."}},
   ]},
  {title:'THE TRAP MAKER',
   zones:['woods','outpost'],
   text:'"A crude pit trap sits in the path ahead. Someone set this recently. You spot it just in time."',
   choices:[
     {text:'Reset it facing the enemy direction',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.08);return '✓ Your next enemy walks right into it. +XP.'}},
     {text:'Disarm it — take the parts (+10g)',outcome:(g)=>{g.gold+=10;g.def+=2;return '✓ Salvaged mechanism. 10g + DEF +2.'}},
     {text:'Spring it yourself — clear the path',outcome:(g)=>{g.hp=Math.max(1,g.hp-10);return '✗ You fall through. Lost 10 HP but the path is clear.'}},
   ]},

  // ── CASTLE / OUTPOST EVENTS ─────────────────────────────────
  {title:'THE THRONE ROOM',
   zones:['castle','outpost'],
   text:'"A throne of blackened iron sits in a ruined hall. The arms glow with faint sigils. It has been waiting."',
   choices:[
     {text:'Sit upon the throne (random boon or curse)',outcome:(g)=>{const r=Math.random();if(r<.33){g.maxHp+=30;g.hp=g.maxHp;return '✓ A king\'s will fills you. Max HP +30, fully healed.'}if(r<.66){g.atk+=10;g.def-=6;return "✓ A warlord's strength. ATK +10, DEF -6."}g.hp=Math.max(1,g.hp-Math.floor(g.maxHp*.4));return '✗ It rejects you. 40% HP lost.'}},
     {text:'Pry off the sigil gems (80g)',outcome:(g)=>{g.gold+=80;return '✓ Enchanted stone. 80g.'}},
     {text:'Leave — some power is not yours',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.1);return '✓ Wisdom is its own reward. +XP.'}},
   ]},
  {title:'THE PRISONER',
   zones:['castle','underdark'],
   text:'"A cell door hangs open. Inside: someone in chains, months captive. They say they know a secret worth knowing."',
   choices:[
     {text:'Free them — spend a potion',outcome:(g)=>{const idx=g.inventory.findIndex(i=>i&&i.id==="hpPotion");if(idx===-1)return '✗ No potions to spare.';g.inventory[idx].qty--;if(g.inventory[idx].qty<=0)g.inventory[idx]=null;g.critBonus=(g.critBonus||0)+1;g.xp+=Math.floor(g.xpNeeded*.15);return '✓ They reveal enemy weak points. Crit +1. +XP.'}},
     {text:'Learn their secret first',outcome:(g)=>{g.def+=6;return '✓ They describe the enemies in detail. DEF +6.'}},
     {text:'Leave — you cannot take on more burden',outcome:(g)=>'You walk away. Their eyes follow you.'},
   ]},

  // ── UNDERDARK / ABYSS EVENTS ────────────────────────────────
  {title:'THE ANCIENT GOLEM',
   zones:['underdark','abyss'],
   text:'"A stone golem sits motionless, arms on its knees. Enormous. Very old. Its sapphire eyes track you."',
   choices:[
     {text:'Speak the command word (50/50)',outcome:(g)=>{if(Math.random()<.5){g.atk+=12;g.def+=8;return '✓ It stands. It bows. ATK +12, DEF +8.'}g.hp=Math.max(1,g.hp-35);return '✗ Wrong word. One strike. Lost 35 HP.'}},
     {text:'Harvest its sapphire eyes (100g)',outcome:(g)=>{g.gold+=100;return '✓ Flawless gems. 100g.'}},
     {text:'Leave it in peace',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.15);return '✓ As you pass, it raises one slow hand. +XP.'}},
   ]},
  {title:'THE VOID CRACK',
   zones:['abyss','shadowrealm'],
   text:'"A crack in reality hovers at head height — a line of absolute black, humming. You can hear something breathing inside."',
   choices:[
     {text:'Reach inside (random — reward or catastrophe)',outcome:(g)=>{const r=Math.random();if(r<.2){g.maxHp+=40;g.hp=g.maxHp;g.atk+=8;return '✓ A voidstone. Max HP +40, ATK +8, fully healed.'}if(r<.5){const pool=ITEMS.filter(i=>i.rarity==="rare"&&i.slot);const item={...pool[Math.floor(Math.random()*pool.length)],qty:1};addItem(item);return "✓ You pull out "+item.icon+" "+item.name+". From nothing."}g.hp=Math.max(1,g.hp-Math.floor(g.maxHp*.5));return '✗ Something grabs back. Lost 50% HP.'}},
     {text:'Seal it with a prayer',outcome:(g)=>{g.def+=8;return '✓ The crack seals. DEF +8.'}},
     {text:'Walk away — you know better',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.12);return '✓ Survival instinct has value. +XP.'}},
   ]},
  {title:'THE DYING DEMON',
   zones:['abyss','shadowrealm','underdark'],
   text:'"A lesser demon lies impaled on its own spear. "I have an offer," it rasps. "Better than the alternative.""',
   choices:[
     {text:'Hear its offer',outcome:(g)=>{g.gold+=60;g.critBonus=(g.critBonus||0)+3;return '✓ Gold and a whispered name. 60g, Crit +3.'}},
     {text:'End its suffering cleanly',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.12);return '✓ One clean blow. No deals. +XP.'}},
     {text:'Leave it to die alone',outcome:(g)=>{if(Math.random()<.5){g.def+=5;return '✓ As you walk away, it whispers something useful. DEF +5.'}return 'You leave it to its end.'}},
   ]},

];

