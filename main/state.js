// ================================================================
// main.js — Game State, Core Logic, Game Flow
// Initializes G, handles screens, class select, zone flow,
// HUD rendering, companions, enemy spawning
// Descent into Eternity
// ================================================================

// ══════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════
var G = null;
let paused = false;
let enemyTurnTimeout = null;
let selectedItemIdx = null;
let pendingClass = null;
let cfCurrentTab = 'rest';
let cfCurrentEvent = null;

function md(s){return Math.floor((s-10)/2);}
function profFor(lvl){return lvl<5?2:lvl<9?3:lvl<13?4:lvl<17?5:6;}
function xpFor(lvl){return Math.floor(60*Math.pow(1.55,lvl-1));}
function roll(d){return Math.floor(Math.random()*d)+1;}

function newState(classId){
  const cls = CLASSES[classId];
  const st = cls.baseStats;
  const conMod = md(st.con);
  const maxHp = cls.baseHp + conMod;
  return {
    classId,
    dungeonGoal: 5,
    level:1, xp:0, xpNeeded:xpFor(1),
    hp:maxHp, maxHp,
    res: classId==='wizard'?Object.values(cls.spellSlots||{}).reduce((a,b)=>a+b,0):cls.resMax,
    resMax: cls.resMax,
    spellSlots: cls.spellSlots?{...cls.spellSlots}:null,
    spellSlotsMax: cls.spellSlots?{...cls.spellSlots}:null,
    wizKillCount:0,
    stats:{...st},
    profBonus:2,
    atk:3+((['rogue','ranger'].includes(classId))?md(st.dex):md(st.str)),
    def:md(st.con)+md(st.dex),
    critRange:20, critMult:2, magBonus:0,
    spellPower: (['wizard','cleric','druid'].includes(classId)) ? md(st[classId==='wizard'?'int':'wis']) :
                (classId==='paladin' ? md(st.cha) : 0),
    xpMult:1, goldMult:1, critBonus:0,
    inventory:Array(20).fill(null),
    equipped:{weapon:null,armor:null,ring:null,offhand:null,helmet:null,boots:null,amulet:null,gloves:null},
    gold:0, totalGold:0, totalKills:0, totalItems:0, totalCrafts:0, totalCrits:0, totalObjectives:0, mirrorImages:0, playTime:0,
    totalDmgDealt:0, totalDmgTaken:0, biggestHit:0, biggestHitSource:'', causeOfDeath:'', flawlessWins:0,
    _closeCallFlag:false, _ironmanFlag:true, _noRestStreak:0,
    upgrades:UPGRADES_DATA.map(u=>({...u,bought:false})),
    talents:[],
    talentsOffered:[],
    subclassUnlocked:false,
    ultimateUnlocked:false,
    capstoneUnlocked:false,
    layOnHandsPool:5,
    zoneIdx:0, zoneKills:0, bossReady:false,
    bossDefeated:[false,false,false,false,false,false,false,false],
    runBossDefeated:[false,false,false,false,false,false,false,false],
    branchDefeated:{catacombs:false,fungalwarren:false,sunkenvault:false,ashenwastes:false},
    branchPassives:[],
    dungeonFights:0, campUnlocked:false,
    _isTutorialFight:false, _pauseForTutorial:false,
    lives: 3,
    // Turn state
    isPlayerTurn:true, actionUsed:false, bonusUsed:false, reactionUsed:false,
    skillCooldowns:{},
    // Status
    conditions:[],
    conditionTurns:{},
    sx:{},
    raging:false, rageTurns:0, hunterMarked:false, concentrating:null, wildShapeHp:0, wildShapeActive:false,
    spiritualWeaponActive:false, spiritualWeaponTurns:0,
    firstAttackUsed:false,
    currentEnemy:null,
    currentEnemies:[],
    targetIdx:0,
    roundNum:0,
    skillCharges: Object.fromEntries(CLASSES[classId].skills.filter(sk=>sk.charges).map(sk=>[sk.id,sk.charges])),
    // ── Phase A: Rare Events / Shop / Salvage ──
    _rareEventFlags: {},       // Active rare event flags
    _rareEventsThisZone: 0,    // Cap 1 rare event per zone
    _shopStock: null,          // Randomized shop inventory (array of ITEMS indices)
    _salvageBuffs: [],         // Temp buffs from salvage [{stat,value}]
    // ── Phase B: Zone Modifiers ──
    _zoneModifiers: {},        // Map of zoneIdx → modifier ID for this run
    _activeModifier: null,     // Current zone's modifier object (set on zone entry)
    _ancestralStacks: 0,       // Ancestral Fury kill stacks (reset at campfire)
    _witchChoice: null,        // Witch's Bargain choice for current fight
    _predatorBuff: null,       // Predator and Prey buff state
    // ── Chroma tracking (per-run) ──
    _activeChroma: null,       // Active chroma ID for this run (set from save slot)
    totalSpellsCast: 0,        // Wizard: increment on any spell slot use
    totalSneakAttacks: 0,      // Rogue: increment on Sneak Attack
    totalReckless: 0,          // Barbarian: increment on Reckless Attack
    totalHealingDone: 0,       // Paladin/Cleric: increment on any heal
    _lowHpWins: 0,             // Wizard: fights won with <=5 HP
    _cantripOnlyBossKill: false,// Wizard: set true if boss killed without slot spells
    _timeStopBossKill: false,  // Wizard: set true if boss dies during Time Stop
    _fastBossKill: 999,        // Rogue: lowest round count for a boss kill this run
    _markedKillsThisZone: 0,   // Ranger: kills with Mark active this zone (reset per zone)
    _beastFell: false,         // Ranger: set true if beast companion ever falls
    _wonAt1HP: false,          // Barbarian: set true if fight won at exactly 1 HP
    _dmgThisFight: 0,          // Barbarian: damage dealt in current fight (reset per fight)
    _droppedBelow25: false,    // Cleric: set true if HP ever < 25% maxHP
    _primalAvatarTripleKill: false, // Druid: set true if 3 kills during one avatar
    _usedSpellSlotThisFight: false, // Wizard: track if slot spells used (for cantrip-only check)

    // ── System 1: Multiple Subclasses ──
    subclassId: null,              // chosen subclass id string (e.g. 'champion')

    // ── System 2: Talent Keystones (persistent run flags) ──
    _keystoneWarMachine:false, _keystoneRampage:false, _keystoneFortress:false,
    _keystoneArcaneOverload:false, _keystoneFontOfMagic:false, _keystoneArcaneVirtuoso:false,
    _keystoneOneShot:false, _keystonePhantom:false, _keystoneFortuneFavor:false,
    _keystoneAvatarJustice:false, _keystoneHolyBastion:false, _keystoneBeaconLight:false,
    _keystoneTrueShot:false, _keystoneAlpha:false, _keystoneFieldControl:false,
    _keystoneBerserkerEcstasy:false, _keystoneUnkillable:false, _keystoneLivingSiegeEngine:false,
    _keystoneVoiceDivine:false, _keystoneMiracleHealer:false, _keystoneHolyAegis:false,
    _keystonePrimalAscendant:false, _keystoneStormcaller:false, _keystoneHeartForest:false,

    // ── System 3: Skill Kit Loadout ──
    skillLoadout: null,            // array of skill IDs, or null (show all)

    // ── Subclass run flags (set once in apply()) ──
    _championInit: false,          // Champion: WIS to initiative
    _useMagicDevice: false,        // Thief: equip wizard offhands
    _vengeancePaladin: false,      // Vengeance Paladin
    _gloomStalker: false,          // Gloom Stalker ranger
    _warDomain: false,             // War Domain cleric
    _starsDruid: false,            // Stars Druid
    _totemSpirit: 'bear',          // Wild Heart totem: 'bear'|'eagle'|'wolf'

    // ── Per-fight state (reset in spawnEnemy()) ──
    _vengeanceMarked: -1,          // Vengeance: index of marked enemy
    _dreadAmbushUsed: false,       // Gloom Stalker: Dread Ambush one-use
    _dreadfulStrikesLeft: 0,       // Gloom Stalker: remaining psychic strikes
    _changeTotemUsed: false,       // Wild Heart: Change Totem one-use (also tracked via charges)
    _illusoryUsed: false,          // Illusionist: Illusory Self one-use
    _unkillableUsed: false,        // Unkillable keystone: one-use per fight
    _rampageStacks: 0,             // Rampage keystone: 0-5 kill stacks
    _virtuosoElement: 0,           // Arcane Virtuoso: 0=fire, 1=ice, 2=lightning
    _phantomFirstHit: true,        // Phantom keystone: true until first hit auto-dodged
    _familiarActive: false,        // Wizard: Arcane Familiar active
    _familiarTurns: 0,             // Wizard: familiar turns remaining
    _knowEnemyBonus: false,        // Battle Master: +2 ATK rounds 1-2
    _relentlessRogueUsed: false,   // Battle Master: free Superiority Die once/rest
    _thiefUnseen: true,            // Thief: Supreme Sneak - crit if not yet hit
    _starryFormActive: false,      // Stars Druid: Starry Form stance active
    _starryFormTurns: 0,           // Stars Druid: turns remaining
    _shadowDiveActive: false,      // Gloom Stalker: untargetable + next attack frightens
    _envenomStacks: 0,             // Assassin: remaining envenomed attacks
    _markedForDeath: false,        // Assassin: next sneak attack maximized
    _blessAttacks: 0,              // War Cleric: remaining blessed attacks
    _guidedStrikeBonus: false,     // War Cleric: next attack +10 ATK + 2d8 divine
    _cosmicOmenActive: false,      // Stars: next roll gets +1d6
    _camouflageActive: false,      // Ranger: hidden — enemy misses + next attack +1d8
    _phantasmalTarget: -1,         // Illusionist: enemy index under phantasmal force

    // ── Per-turn state (reset in setPlayerTurn() or enemy turn) ──
    _fortressUsedThisTurn: false,  // Fortress keystone: one Parry per enemy turn
    _phantomTargetedBy: -1,        // Phantom keystone: enemy index that targeted you
    _warPriestUsed: false,         // War Domain: per-turn War Priest free attack
    _beastReactionUsed: false,     // Beast Master: independent beast reaction
  };
}

// ══════════════════════════════════════════════════════════
//  TITLE
// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════
//  TITLE — Cinematic canvas background + press-any-key ritual
// ══════════════════════════════════════════════════════════

function applyPermanentUpgrades(classId){
  if(!G || typeof getPermanentUpgrades!=='function') return;
  const ups = getPermanentUpgrades();
  if(!ups || Object.keys(ups).length===0) return;

  const applied = [];

  // Universal upgrades
  if(ups.hp_bonus){
    const v = ups.hp_bonus * 3;
    G.maxHp += v; G.hp += v;
    applied.push('+'+v+' HP');
  }
  if(ups.gold_bonus){
    const v = ups.gold_bonus * 10;
    G.gold += v;
    applied.push('+'+v+' gold');
  }
  if(ups.atk_bonus){
    const v = ups.atk_bonus * 1;
    addOffensiveStat(G,v);
    applied.push('+'+v+' '+getOffensiveStatLabel(G));
  }
  if(ups.def_bonus){
    const v = ups.def_bonus * 1;
    G.def += v;
    applied.push('+'+v+' DEF');
  }
  if(ups.potion_bonus){
    for(let i=0;i<ups.potion_bonus;i++){
      if(typeof ITEMS!=='undefined' && typeof addItem==='function'){
        addItem({...ITEMS.find(it=>it.id==='hpPotion'),qty:1});
      }
    }
    applied.push('+'+ups.potion_bonus+' potions');
  }
  if(ups.campfire_heal){
    G._campfireHealBonus = ups.campfire_heal * 0.05;
    applied.push('+'+(ups.campfire_heal*5)+'% campfire heal');
  }
  if(ups.shop_discount){
    G._shopDiscount = ups.shop_discount * 0.05;
    applied.push((ups.shop_discount*5)+'% shop discount');
  }
  if(ups.xp_bonus){
    G.xpMult = (G.xpMult||1) + ups.xp_bonus * 0.05;
    applied.push('+'+(ups.xp_bonus*5)+'% XP');
  }
  if(ups.crit_bonus){
    G.critBonus = (G.critBonus||0) + ups.crit_bonus;
    applied.push('+'+ups.crit_bonus+' crit');
  }
  // grace_luck is checked at generation time in generateGrace()

  // Class mastery upgrades — only apply if matching class
  const masteryId = classId + '_mastery';
  if(ups[masteryId]){
    if(classId==='fighter')  { G.atk+=3; G.maxHp+=10; G.hp+=10; applied.push('Fighter Mastery'); }
    if(classId==='wizard')   { G.magBonus=(G.magBonus||0)+5; if(G.spellSlots&&G.spellSlots[1]!==undefined) G.spellSlots[1]++; applied.push('Wizard Mastery'); }
    if(classId==='rogue')    { G.atk+=3; G.critBonus=(G.critBonus||0)+2; applied.push('Rogue Mastery'); }
    if(classId==='paladin')  { G.atk+=2; G.def+=2; G.maxHp+=10; G.hp+=10; applied.push('Paladin Mastery'); }
    if(classId==='ranger')   { G.atk+=3; G.critBonus=(G.critBonus||0)+1; G.maxHp+=5; G.hp+=5; applied.push('Ranger Mastery'); }
    if(classId==='barbarian'){ G.atk+=4; G.maxHp+=15; G.hp+=15; applied.push('Barbarian Mastery'); }
    if(classId==='cleric')   { G.magBonus=(G.magBonus||0)+4; G.maxHp+=15; G.hp+=15; applied.push('Cleric Mastery'); }
    if(classId==='druid')    { G.magBonus=(G.magBonus||0)+3; G.def+=2; G.maxHp+=10; G.hp+=10; applied.push('Druid Mastery'); }
  }

  if(applied.length > 0 && typeof log==='function'){
    log('🏛 Proving Grounds: '+applied.join(', '),'l');
  }
}

// ══════════════════════════════════════════════════════════
//  NARRATIVE SYSTEM
// ══════════════════════════════════════════════════════════

