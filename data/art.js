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

// ── CLASS SPRITE FRAME 3 (return/overshoot pose) ─────────────────────
// Frame 3 is slightly past neutral in the opposite direction of frame 2.
// This gives the cycle a natural arc — the limb overshoots before settling.
const CLASS_SPRITE_FRAMES3 = {

// PALADIN frame 3: cape half-settled, holy light mid-intensity — between frame 1 and 2
paladin:[
  [C._,C._,C._,C._,C._,GD,  GD2, GD,  GD,  GD2, GD,  C._,C._,C._,C._,C._],  //  0 helm crest
  [C._,C._,C._,C._,GD2, GD,  SL,  SL,  SL,  SL,  GD,  GD2, C._,C._,C._,C._],  //  1 helm top
  [C._,C._,C._,GD,  SL,  SL,  SK,  SK,  SK,  SK,  SL,  SL,  GD,  C._,C._,C._],  //  2 face
  [C._,C._,C._,GD,  SL,  SK,  SK2, GD,  GD,  SK2, SK,  SL,  GD,  C._,C._,C._],  //  3 eyes
  [C._,C._,C._,GD,  SL,  SK,  SK,  SK,  SK,  SK,  SK,  SL,  GD,  C._,C._,C._],  //  4 chin
  [C._,C._,C._,C._,GD,  GD2, GD,  GD,  GD,  GD,  GD2, GD,  C._,C._,C._,C._],  //  5 gorget
  [RD, GD,  SL,  GD,  GD2, GD,  GD,  GD,  GD,  GD,  GD,  GD2, GD,  SL,  GD,  RD],  //  6 cape mid-settle
  [RD, GD2, SL,  SL,  GD,  GD2, WH,  GD,  GD,  WH,  GD2, GD,  SL,  SL,  GD2, RD],  //  7 cross mid glow
  [RD, GD,  SL,  SL,  GD2, WH,  GD2, GD2, GD2, GD2, WH,  GD2, SL,  SL,  GD,  RD],  //  8 cross lower slightly dimmer
  [RD, GD2, SL,  GD,  GD2, GD,  GD,  GD,  GD,  GD,  GD,  GD2, GD,  SL,  GD2, RD],  //  9 cape settling
  [C._,C._,GD,  GD2, GD,  GD2, GD,  GD2, GD2, GD,  GD2, GD,  GD2, GD,  C._,C._],  // 10 belt
  [C._,C._,GD2, GD,  SL,  GD2, GD,  C._,C._,GD,  GD2, SL,  GD,  GD2, C._,C._],  // 11 fists
  [C._,C._,C._,GD,  SL,  GD,  GD2, GD,  GD,  GD2, GD,  SL,  GD,  C._,C._,C._],  // 12 hip plates
  [C._,C._,C._,C._,SL,  GD,  SL,  C._,C._,SL,  GD,  SL,  C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,GD,  SL,  GD,  C._,C._,GD,  SL,  GD,  C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,GD2, SL,  GD2, C._,C._,GD2, SL,  GD2, C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,SL,  GD,  SL,  C._,C._,SL,  GD,  SL,  C._,C._,C._,C._],  // 16 shin upper
  [C._,C._,C._,C._,GD,  SL,  GD,  C._,C._,GD,  SL,  GD,  C._,C._,C._,C._],  // 17 shin lower
  [C._,C._,C._,C._,GD2, GD,  C._,C._,C._,C._,GD,  GD2, C._,C._,C._,C._],  // 18 ankle
  [C._,C._,C._,GD2, GD,  SL,  GD,  GD2, GD2, GD,  SL,  GD,  GD2, C._,C._,C._],  // 19 sabatons
],

// RANGER frame 3: bow arm follow-through — slightly forward past neutral after release
ranger:[
  [C._,C._,C._,C._,C._,GR,  GR2, GR2, GR2, GR,  C._,C._,C._,C._,C._,C._],  //  0 hood tip
  [C._,C._,C._,C._,GR,  GR2, GR,  GR,  GR,  GR2, GR,  C._,C._,C._,C._,C._],  //  1 hood upper
  [C._,C._,C._,GR,  GR2, SK,  SK,  SK,  SK,  SK,  GR2, GR,  C._,C._,C._,C._],  //  2 face
  [C._,C._,C._,GR,  GR2, SK,  SK2, SK,  SK2, SK,  GR2, GR,  C._,C._,C._,C._],  //  3 eyes alert
  [C._,C._,C._,GR,  GR2, SK,  SK,  SK,  SK,  SK,  GR2, GR,  C._,C._,C._,C._],  //  4 chin
  [C._,C._,C._,C._,GR,  GR2, GR,  GR,  GR,  GR2, GR,  C._,C._,C._,C._,C._],  //  5 neck
  [SM,  SM,  GR2, GR,  GR2, GR,  GR2, GR,  GR,  GR2, GR,  GR2, GR,  GR2, C._,C._],  //  6 bow arm forward
  [SM,  SM,  GR,  BR2, GR2, BR,  GR2, GR2, GR2, GR2, BR,  GR2, BR2, GR,  C._,C._],  //  7 follow-through arm extended
  [SM,  SM,  GR2, BR,  BR,  GR2, GR2, GR,  GR,  GR2, GR2, BR,  BR,  GR2, C._,C._],  //  8 slightly past neutral
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

// BARBARIAN frame 3: arms slamming back down past neutral — fists below belt, full weight
barbarian:[
  [C._,C._,C._,OR,  C._,C._,C._,C._,C._,C._,C._,C._,OR,  C._,C._,C._],  //  0 horn tips
  [C._,C._,OR2, OR2, C._,OR2, OR2, OR2, OR2, OR2, OR2, C._,OR2, OR2, C._,C._],  //  1 horns+helm
  [C._,C._,C._,OR,  OR2, SK,  SK,  SK,  SK,  SK,  SK,  OR2, OR,  C._,C._,C._],  //  2 face
  [C._,C._,C._,OR,  SK,  RD,  SK,  SK,  SK,  SK,  RD,  SK,  OR,  C._,C._,C._],  //  3 warpaint still hot
  [C._,C._,C._,OR,  SK,  SK,  SK2, SK,  SK,  SK2, SK,  SK,  OR,  C._,C._,C._],  //  4 jaw set
  [C._,C._,C._,C._,OR,  SK3, SK2, SK3, SK3, SK2, SK3, OR,  C._,C._,C._,C._],  //  5 neck tensed
  [SK3,SK2, SK3,SK2, SK3, OR2, SK3, OR,  OR,  SK3, OR2, SK3, SK2, SK3, SK2, SK3],  //  6 arms swinging down
  [SK2,SK3, SK2,SK3, SK2, SK3, OR,  OR2, OR2, OR,  SK3, SK2, SK3, SK2, SK3, SK2],  //  7 arms — downswing below frame 1
  [SK3,SK2, OR,  SK2, OR2, SK3, SK2, OR,  OR,  SK2, SK3, OR2, SK2, OR,  SK2, SK3],  //  8 fists wide and low
  [C._,SK2, SK3, OR,  SK3, SK2, SK3, OR,  OR,  SK3, SK2, SK3, OR,  SK3, SK2, C._],  //  9 forearms+fists very low
  [C._,C._,SK3, OR,  BR2, BR,  BR2, BR,  BR,  BR2, BR,  BR2, OR,  SK3, C._,C._],  // 10 fur belt
  [C._,C._,SK2, OR2, BR,  BR3, BR,  OR2, OR2, BR,  BR3, BR,  OR2, SK2, C._,C._],  // 11 fur hip
  [C._,C._,C._,OR,  BR2, BR,  OR2, OR,  OR,  OR2, BR,  BR2, OR,  C._,C._,C._],  // 12 hip
  [C._,C._,C._,C._,OR2, OR,  OR2, C._,C._,OR2, OR,  OR2, C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,OR,  OR2, OR,  C._,C._,OR,  OR2, OR,  C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,OR2, OR,  OR2, C._,C._,OR2, OR,  OR2, C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,BR2, BR,  BR2, C._,C._,BR2, BR,  BR2, C._,C._,C._,C._],  // 16 shin
  [C._,C._,C._,C._,BR,  BR3, BR,  C._,C._,BR,  BR3, BR,  C._,C._,C._,C._],  // 17 shin lower
  [C._,C._,C._,C._,BR3, BR2, BR3, C._,C._,BR3, BR2, BR3, C._,C._,C._,C._],  // 18 boot top
  [C._,C._,C._,BR3, BR2, BR3, BR2, BR3, BR3, BR2, BR3, BR2, BR3, C._,C._,C._],  // 19 boot sole
],

// CLERIC frame 3: mace settled back at side, glow dimmed — peaceful exhale after prayer
cleric:[
  [C._,C._,C._,C._,C._,WH,  GD,  GD,  GD,  GD,  WH,  C._,C._,C._,C._,C._],  //  0 mitre top
  [C._,C._,C._,C._,WH,  GD,  WH,  GD,  GD,  WH,  GD,  WH,  C._,C._,C._,C._],  //  1 mitre cross
  [C._,C._,C._,WH,  GD,  WH,  SK,  SK,  SK,  SK,  WH,  GD,  WH,  C._,C._,C._],  //  2 face
  [C._,C._,C._,WH,  GD,  SK,  SK2, SK,  SK,  SK2, SK,  GD,  WH,  C._,C._,C._],  //  3 calm eyes
  [C._,C._,C._,WH,  GD,  SK,  SK,  SK2, SK2, SK,  SK,  GD,  WH,  C._,C._,C._],  //  4 chin
  [C._,C._,C._,C._,WH,  GD,  WH,  WH,  WH,  WH,  GD,  WH,  C._,C._,C._,C._],  //  5 collar
  [C._,WH,  GD,  WH,  GD,  WH,  GD,  WH,  WH,  GD,  WH,  GD,  WH,  GD,  WH,  C._],  //  6 shoulders
  [SM,  WH,  GD,  WH,  GD2, WH,  GD,  GD2, GD2, GD,  WH,  GD2, WH,  GD,  WH,  SM],  //  7 arms — mace arm lowering
  [SM,  GD,  WH,  GD,  WH,  GD2, WH,  GD,  GD,  WH,  GD2, WH,  GD,  WH,  GD,  SM],  //  8 torso
  [C._,SM,  WH,  GD,  WH,  GD,  WH,  GD,  GD,  WH,  GD,  WH,  GD,  WH,  SM,  C._],  //  9 lower arms+robe
  [C._,C._,SM,  WH,  GD2, GD,  GD2, GD,  GD,  GD2, GD,  GD2, WH,  SM,  C._,C._],  // 10 belt
  [C._,C._,C._,WH,  GD,  WH,  GD,  WH,  WH,  GD,  WH,  GD,  WH,  C._,C._,C._],  // 11 hips — mace at side
  [C._,C._,C._,GD,  WH,  GD,  WH,  GD,  GD,  WH,  GD,  WH,  GD,  C._,C._,C._],  // 12 hip split
  [C._,C._,C._,C._,WH,  GD,  WH,  C._,C._,WH,  GD,  WH,  C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,GD,  WH,  GD,  C._,C._,GD,  WH,  GD,  C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,WH,  GD,  WH,  C._,C._,WH,  GD,  WH,  C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,GD,  WH,  GD,  C._,C._,GD,  WH,  GD,  C._,C._,C._,C._],  // 16 shin
  [C._,C._,C._,C._,WH,  GD,  C._,C._,C._,C._,GD,  WH,  C._,C._,C._,C._],  // 17 lower shin
  [C._,C._,C._,C._,GD,  WH,  GD,  C._,C._,GD,  WH,  GD,  C._,C._,C._,C._],  // 18 sandal strap
  [C._,C._,C._,C._,GD2, GD,  GD2, GD,  GD,  GD2, GD,  GD2, C._,C._,C._,C._],  // 19 sandal sole
],

// DRUID frame 3: antlers swayed opposite from frame 2, vine glow mid-fade — organic cycle
druid:[
  [C._,BR,  C._,C._,C._,C._,C._,C._,C._,C._,C._,C._,C._,C._,BR,  C._],  //  0 antler tips — swayed left
  [C._,BR2, BR,  C._,LM2, LM,  LM2, LM2, LM,  LM2, C._,BR,  BR2, C._,C._,C._],  //  1 antlers shifted left
  [C._,C._,C._,LM,  LM2, SK,  SK,  SK,  SK,  SK,  SK,  LM2, LM,  C._,C._,C._],  //  2 face
  [C._,C._,C._,LM,  LM2, SK,  TL2, SK,  SK,  TL2, SK,  LM2, LM,  C._,C._,C._],  //  3 eyes mid glow (TL2)
  [C._,C._,C._,LM,  LM2, SK,  SK,  SK2, SK2, SK,  SK,  LM2, LM,  C._,C._,C._],  //  4 chin
  [C._,C._,C._,C._,LM,  GR2, GR2, GR2, GR2, GR2, GR2, LM,  C._,C._,C._,C._],  //  5 neck mid glow
  [LM2, LM, GR2, GR2, GR2, GR2, BR,  GR2, GR2, BR,  GR2, GR2, GR2, GR2, LM,  LM2],  //  6 bark mid
  [LM, GR2, GR2, BR2, GR2, BR2, GR2, BR2, BR2, GR2, BR2, GR2, BR2, GR2, GR2, LM],  //  7 arms mid
  [LM2, GR2, BR2, GR2, BR2, GR2, BR2, GR2, GR2, BR2, GR2, BR2, GR2, BR2, GR2, LM2],  //  8 bark mid
  [C._,LM, GR2, BR2, GR2, BR2, GR2, BR2, BR2, GR2, BR2, GR2, BR2, GR2, LM,  C._],  //  9 forearms mid
  [C._,C._,LM2, GR2, LM,  LM2, LM,  GR2, GR2, LM,  LM2, LM,  GR2, LM2, C._,C._],  // 10 vine belt mid
  [C._,C._,C._,LM,  GR2, LM2, GR2, LM,  LM,  GR2, LM2, GR2, LM,  C._,C._,C._],  // 11 vine hips mid
  [C._,C._,C._,GR2, GR2, GR2, LM,  GR2, GR2, LM,  GR2, GR2, GR2, C._,C._,C._],  // 12 hip
  [C._,C._,C._,C._,GR2, BR2, GR2, C._,C._,GR2, BR2, GR2, C._,C._,C._,C._],  // 13 thigh upper
  [C._,C._,C._,C._,BR2, GR2, BR2, C._,C._,BR2, GR2, BR2, C._,C._,C._,C._],  // 14 thigh lower
  [C._,C._,C._,C._,GR2, BR2, GR2, C._,C._,GR2, BR2, GR2, C._,C._,C._,C._],  // 15 knee
  [C._,C._,C._,C._,BR2, GR2, BR2, C._,C._,BR2, GR2, BR2, C._,C._,C._,C._],  // 16 shin upper
  [C._,C._,C._,C._,GR2, BR2, GR2, C._,C._,GR2, BR2, GR2, C._,C._,C._,C._],  // 17 shin lower
  [C._,C._,C._,C._,GR2, GR2, BR2, C._,C._,BR2, GR2, GR2, C._,C._,C._,C._],  // 18 root boot top
  [C._,C._,C._,GR2, GR2, BR2, GR2, GR2, GR2, GR2, BR2, GR2, GR2, C._,C._,C._],  // 19 root boot sole
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
  // Skeleton guard — bony white, shield and sword, small
  skeleton:[
    [C._,C.W,C.W,C.W,C._],
    [C.W,C.K,C.W,C.K,C.W],
    [C._,C.W,C.K,C.W,C._],
    [C._,C.D,C.W,C.D,C._],
    [C.S,C.D,C.W,C.D,C.S],
    [C._,C.W,C.D,C.W,C._],
    [C._,C.W,C._,C.W,C._],
  ],
  // Frozen soldier — icy blue warrior with spear
  frozenSoldier:[
    [C._,C._,C.S,C.S,C._,C._],
    [C._,C.S,C.B,C.B,C.S,C._],
    [C._,C.B,C.W,C.W,C.B,C._],
    [C._,C.B,C.K,C.K,C.B,C._],
    [C.S,C.B,C.S,C.S,C.B,C.S],
    [C._,C.B,C.B,C.B,C.B,C._],
    [C._,C.S,C.B,C.B,C.S,C._],
    [C._,C.B,C._,C._,C.B,C._],
    [C._,C.S,C._,C._,C.S,C._],
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

