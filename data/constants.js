// ================================================================
// data.js — All Static Game Data
// Sprite pixel art, class definitions, zones, items
// Descent into Eternity
// ================================================================

// ══════════════════════════════════════════════════════════
//  STAT DISPLAY NAMES
//  Maps internal stat keys to human-readable labels
// ══════════════════════════════════════════════════════════
const STAT_DISPLAY_NAMES = {
  atk:'ATK', def:'DEF', hp:'HP', magAtk:'SPL', crit:'CRIT',
  heal:'HEAL', tempAtk:'Temp ATK', tempDef:'Temp DEF',
  critRange:'CRIT', critBonus:'CRIT'
};
function statLabel(key){ return STAT_DISPLAY_NAMES[key] || key.toUpperCase(); }

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
