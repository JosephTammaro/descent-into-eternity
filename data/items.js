const ITEMS = [
  // ── WEAPONS (common) ─────────────────────────────────────
  {id:'sword',name:'Iron Sword',icon:'⚔️',type:'weapon',slot:'weapon',rarity:'common',stats:{atk:5},value:20},
  {id:'dagger',name:'Keen Dagger',icon:'🗡️',type:'weapon',slot:'weapon',rarity:'common',stats:{atk:3,crit:1},value:15},
  {id:'staff',name:'Arcane Staff',icon:'🪄',type:'weapon',slot:'weapon',rarity:'common',stats:{atk:2,magAtk:6},value:22},
  {id:'bow',name:'Hunting Bow',icon:'🏹',type:'weapon',slot:'weapon',rarity:'common',stats:{atk:6},value:22},
  {id:'club',name:'Spiked Club',icon:'🪵',type:'weapon',slot:'weapon',rarity:'common',stats:{atk:4},value:12},
  // ── WEAPONS (uncommon) ───────────────────────────────────
  {id:'silverSword',name:'Silver Sword',icon:'🗡',type:'weapon',slot:'weapon',rarity:'uncommon',stats:{atk:9},value:100},
  {id:'wand',name:'Wand of Force',icon:'🪄',type:'weapon',slot:'weapon',rarity:'uncommon',stats:{atk:3,magAtk:10},value:105},
  {id:'longbow',name:'Longbow',icon:'🏹',type:'weapon',slot:'weapon',rarity:'uncommon',stats:{atk:10},value:110},
  {id:'handaxe',name:'Twin Handaxes',icon:'🪓',type:'weapon',slot:'weapon',rarity:'uncommon',stats:{atk:8,crit:1},value:58},
  // ── WEAPONS (rare) ───────────────────────────────────────
  {id:'greatsword',name:'Greatsword',icon:'⚔',type:'weapon',slot:'weapon',rarity:'rare',stats:{atk:14},value:220},
  {id:'voidDagger',name:'Void Dagger',icon:'🗡️',type:'weapon',slot:'weapon',rarity:'rare',stats:{atk:10,crit:10},value:160},
  {id:'arcaneOrb',name:'Arcane Orb',icon:'🔮',type:'weapon',slot:'weapon',rarity:'rare',stats:{atk:4,magAtk:16},value:260},
  {id:'druidStaff',name:"Nature's Staff",icon:'🌿',type:'weapon',slot:'weapon',rarity:'rare',stats:{atk:6,magAtk:10,def:3},value:155},
  // ── ARMOR (common) ───────────────────────────────────────
  {id:'leather',name:'Leather Armor',icon:'🥋',type:'armor',slot:'armor',rarity:'common',stats:{def:3},value:18},
  {id:'paddedArmor',name:'Padded Armor',icon:'🧥',type:'armor',slot:'armor',rarity:'common',stats:{def:2,hp:5},value:14},
  // ── ARMOR (uncommon) ─────────────────────────────────────
  {id:'chainmail',name:'Chain Mail',icon:'🦺',type:'armor',slot:'armor',rarity:'uncommon',stats:{def:8,hp:15},value:110},
  {id:'scaleMail',name:'Scale Mail',icon:'🛡',type:'armor',slot:'armor',rarity:'uncommon',stats:{def:7,hp:10},value:60},
  {id:'robes',name:'Enchanted Robes',icon:'👘',type:'armor',slot:'armor',rarity:'uncommon',stats:{def:3,magAtk:5,hp:8},value:70},
  // ── ARMOR (rare) ─────────────────────────────────────────
  {id:'plateArmor',name:'Plate Armor',icon:'🛡',type:'armor',slot:'armor',rarity:'rare',stats:{def:14,hp:30},value:280},
  {id:'shadowLeather',name:'Shadow Leather',icon:'🥋',type:'armor',slot:'armor',rarity:'rare',stats:{def:9,crit:2,hp:12},value:175},
  // ── OFFHAND ──────────────────────────────────────────────
  {id:'shield',name:'Wooden Shield',icon:'🛡',type:'offhand',slot:'offhand',rarity:'common',stats:{def:4},value:15},
  {id:'ironShield',name:'Iron Shield',icon:'🛡',type:'offhand',slot:'offhand',rarity:'uncommon',stats:{def:8,hp:8},value:55},
  {id:'spellbook',name:'Grimoire',icon:'📖',type:'offhand',slot:'offhand',rarity:'uncommon',stats:{magAtk:6,def:2},value:60},
  // ── RINGS / ACCESSORIES ──────────────────────────────────
  {id:'ring',name:'Ring of Fortitude',icon:'💍',type:'accessory',slot:'ring',rarity:'uncommon',stats:{hp:20,def:2},value:55},
  {id:'ringAtk',name:'Ring of Striking',icon:'💍',type:'accessory',slot:'ring',rarity:'uncommon',stats:{atk:6},value:50},
  {id:'ringMag',name:'Ring of Arcana',icon:'💍',type:'accessory',slot:'ring',rarity:'rare',stats:{magAtk:10,hp:10},value:130},
  {id:'amulet',name:'Amulet of Warding',icon:'📿',type:'accessory',slot:'amulet',rarity:'rare',stats:{def:8,hp:20},value:145},
  // ── HELMETS ──────────────────────────────────────────────
  {id:'leatherCap',        name:'Leather Cap',          icon:'🎩',type:'helmet',   slot:'helmet', rarity:'common',   stats:{def:2,hp:4},            value:14, townOnly:true},
  {id:'ironCoif',          name:'Iron Coif',             icon:'⛑️',type:'helmet',   slot:'helmet', rarity:'common',   stats:{def:3},                  value:16},
  {id:'knightHelm',        name:"Knight's Helm",         icon:'⛑️',type:'helmet',   slot:'helmet', rarity:'uncommon', stats:{def:6,hp:10},            value:52},
  {id:'magesHood',         name:"Mage's Hood",           icon:'🎓',type:'helmet',   slot:'helmet', rarity:'uncommon', stats:{def:2,magAtk:5,hp:6},    value:50},
  {id:'greatHelm',         name:'Great Helm',            icon:'⛑️',type:'helmet',   slot:'helmet', rarity:'rare',     stats:{def:11,hp:22},           value:160},
  {id:'shadowCowl',        name:'Shadow Cowl',           icon:'🎭',type:'helmet',   slot:'helmet', rarity:'rare',     stats:{def:5,crit:3,hp:10},     value:155},
  // ── GLOVES ───────────────────────────────────────────────
  {id:'roughGloves',       name:'Rough Gloves',          icon:'🧤',type:'gloves',   slot:'gloves', rarity:'common',   stats:{atk:2},                  value:10, townOnly:true},
  {id:'ironGauntlets',     name:'Iron Gauntlets',        icon:'🧤',type:'gloves',   slot:'gloves', rarity:'uncommon', stats:{atk:5,def:2},            value:50},
  {id:'spellbinderGloves', name:'Spellbinder Gloves',    icon:'🧤',type:'gloves',   slot:'gloves', rarity:'uncommon', stats:{magAtk:6,def:1},         value:48},
  {id:'deathgripGauntlets',name:'Deathgrip Gauntlets',   icon:'🧤',type:'gloves',   slot:'gloves', rarity:'rare',     stats:{atk:8,crit:2},           value:155},
  {id:'runeweaveGloves',   name:'Runeweave Gloves',      icon:'🧤',type:'gloves',   slot:'gloves', rarity:'rare',     stats:{magAtk:9,def:3},         value:150},
  // ── BOOTS ────────────────────────────────────────────────
  {id:'travelerBoots',     name:"Traveler's Boots",      icon:'👢',type:'boots',    slot:'boots',  rarity:'common',   stats:{def:1,hp:5},             value:12, townOnly:true},
  {id:'ironBoots',         name:'Iron-Shod Boots',       icon:'👢',type:'boots',    slot:'boots',  rarity:'common',   stats:{def:3},                  value:15},
  {id:'rangerTreads',      name:"Ranger's Treads",       icon:'👢',type:'boots',    slot:'boots',  rarity:'uncommon', stats:{atk:3,def:3,hp:5},       value:52},
  {id:'wardensGreaves',    name:"Warden's Greaves",      icon:'👢',type:'boots',    slot:'boots',  rarity:'rare',     stats:{def:10,hp:18},           value:160},
  {id:'shadowstepBoots',   name:'Shadowstep Boots',      icon:'👢',type:'boots',    slot:'boots',  rarity:'rare',     stats:{def:6,crit:2,hp:12},     value:148},
  // ── AMULETS (new slot) ────────────────────────────────────
  {id:'copperAmulet',      name:'Copper Amulet',         icon:'📿',type:'accessory',slot:'amulet', rarity:'common',   stats:{hp:10},                  value:15, townOnly:true},
  {id:'amuletOfMight',     name:'Amulet of Might',       icon:'📿',type:'accessory',slot:'amulet', rarity:'uncommon', stats:{atk:5,hp:10},            value:58},
  {id:'amuletOfFocus',     name:'Amulet of Focus',       icon:'📿',type:'accessory',slot:'amulet', rarity:'uncommon', stats:{magAtk:6,hp:8},          value:55},
  {id:'amuletOfResolve',   name:'Amulet of Resolve',     icon:'📿',type:'accessory',slot:'amulet', rarity:'rare',     stats:{def:8,hp:25,atk:4},      value:160},
  {id:'voidAmulet',        name:'Void Amulet',           icon:'📿',type:'accessory',slot:'amulet', rarity:'rare',     stats:{magAtk:12,crit:2,hp:15}, value:170},
  // ── CONSUMABLES ──────────────────────────────────────────
  {id:'hpPotion',name:'Healing Potion',icon:'🧪',type:'consumable',slot:null,rarity:'common',stats:{heal:12},value:15},
  {id:'strongPotion',name:'Strong Potion',icon:'⚗️',type:'consumable',slot:null,rarity:'uncommon',stats:{heal:25},value:40},
  {id:'elixir',name:'Elixir of Life',icon:'✨',type:'consumable',slot:null,rarity:'rare',stats:{heal:45},value:100},
  {id:'antidote',name:'Antidote',icon:'💊',type:'consumable',slot:null,rarity:'common',stats:{heal:5},value:12},
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
  {id:'shadowBlade',name:"Shadowwalker's Edge",icon:'🗡️',type:'weapon',slot:'weapon',rarity:'epic',set:'shadowwalker',stats:{atk:14,crit:6},value:220},
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
    bonuses:{3:{label:'SET: Sneak Attack cooldown reduced by 1 turn',stats:{crit:3},skillBonus:'rogue_set'}}
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
    bonuses:{2:{label:'2 pcs: +12 Spell Power',stats:{magAtk:12}},3:{label:'3 pcs: +20 Spell Power, +10 HP',stats:{magAtk:20,hp:10}}}
  },
  nature:{
    name:"Nature's Covenant",
    pieces:['natureBow','natureArmor','natureTalisman'],
    bonuses:{2:{label:'2 pcs: +20 HP, +6 DEF',stats:{hp:20,def:6}},3:{label:'3 pcs: +10 ATK, +8 DEF',stats:{atk:10,def:8}}}
  },
};

// ── ULTIMATES — level 10 (I) and level 20 (capstone) ────────
