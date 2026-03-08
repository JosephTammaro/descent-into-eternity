// ══════════════════════════════════════════════════════════
//  SUBCLASSES — All 16 subclass definitions
//  Each has: id, classId, name, desc, perks[], apply(G){}
//  apply() is called once when the player confirms their subclass.
//  Note: apply() in a data file is a deliberate deviation from the
//  data/no-logic rule. Justified: trivial flag-setting only.
// ══════════════════════════════════════════════════════════
const SUBCLASSES = {

  // ── FIGHTER ──────────────────────────────────────────────
  champion: {
    id:'champion', classId:'fighter',
    name:'Champion',
    desc:'Your critical hit range expands and you gain the Survivor passive.',
    perks:[
      'Improved Critical: crit on 19-20',
      'Remarkable Athlete: +WIS to initiative rolls',
      'Survivor: regen 5+CON HP at start of turn below half HP',
      "Survivor's Strike: auto-retaliate when first dropping below 50% HP",
    ],
    apply(G){ G._championInit=true; },
  },

  battle_master: {
    id:'battle_master', classId:'fighter',
    name:'Battle Master',
    desc:'Tactical warrior who spends Superiority Dice on powerful maneuvers.',
    perks:[
      'Combat Superiority: 4 Superiority Dice (d8), restored at rest',
      'Know Your Enemy: +2 ATK for rounds 1-2 as you read their style',
      'Relentless: once per rest, one Maneuver Strike or Rally costs 0 charges',
    ],
    apply(G){ G._battleMasterRelentless=true; },
  },

  // ── WIZARD ───────────────────────────────────────────────
  evoker: {
    id:'evoker', classId:'wizard',
    name:'Evoker',
    desc:'Your evocation spells deal maximum damage.',
    perks:[
      'Sculpt Spells: protect allies from AoE',
      'Potent Cantrip: half damage on miss',
      'Empowered Evocation: +INT to spell damage',
      'Overchannel: maximize one spell per rest',
    ],
    apply(G){},
  },

  illusionist: {
    id:'illusionist', classId:'wizard',
    name:'Illusionist',
    desc:'Defensive trickster who weaponizes misdirection.',
    perks:[
      'Improved Minor Illusion: start each fight with 1 free Mirror Image',
      'Illusory Self: once per fight, auto-negate the first hit you take',
      'Phantasmal Mastery: Mirror Image has 30% chance to regenerate on absorb',
    ],
    apply(G){},
  },

  // ── ROGUE ────────────────────────────────────────────────
  thief: {
    id:'thief', classId:'rogue',
    name:'Thief',
    desc:'Fast Hands lets you use objects as a bonus action.',
    perks:[
      'Fast Hands: use consumables as a bonus action',
      'Supreme Sneak: if unhit this fight, next Sneak Attack auto-crits',
      'Use Magic Device: ignore class restrictions on offhand items',
    ],
    apply(G){ G._useMagicDevice=true; },
  },

  assassin: {
    id:'assassin', classId:'rogue',
    name:'Assassin',
    desc:'Burst opener who dominates round 1 with auto-crits.',
    perks:[
      'Assassinate: auto-crit every attack in round 1',
      'Infiltration Expertise: +WIS mod damage on each Assassinate crit',
      "Assassin's Tools: kills have 40% chance to proc Poisoned(2) on next attack",
    ],
    apply(G){},
  },

  // ── PALADIN ──────────────────────────────────────────────
  devotion: {
    id:'devotion', classId:'paladin',
    name:'Oath of Devotion',
    desc:'Sacred Weapon and Holy Nimbus define the devoted champion.',
    perks:[
      'Sacred Weapon: +CHA to attack rolls',
      'Holy Nimbus: enemies reflect 10 radiant per hit dealt to you',
      'Aura of Devotion: immunity to Charmed',
      'Purity of Spirit: always under Protection from Evil',
    ],
    apply(G){},
  },

  vengeance: {
    id:'vengeance', classId:'paladin',
    name:'Oath of Vengeance',
    desc:'Relentless hunter who locks onto prey and gains power through pursuit.',
    perks:[
      'Vow of Enmity: enter combat with highest-HP enemy marked (+4 ATK vs. marked)',
      'Relentless Avenger: hitting marked target restores 1 Holy Power',
      'Avenging Angel: below 30% HP, gain +3 ATK and 5 DR',
    ],
    apply(G){ G._vengeancePaladin=true; },
  },

  // ── RANGER ───────────────────────────────────────────────
  beast_master: {
    id:'beast_master', classId:'ranger',
    name:'Beast Master',
    desc:'Your beast companion becomes a true combat partner.',
    perks:[
      "Beast Companion attacks as bonus action",
      "Beast's Defense: reduce your damage by 2",
      "Coordinated Attack: you and beast both attack",
      "Beastial Fury: companion deals +1d6 damage",
      "Beast Reactions: Beast's Aid triggers independently of your reaction",
    ],
    apply(G){},
  },

  gloom_stalker: {
    id:'gloom_stalker', classId:'ranger',
    name:'Gloom Stalker',
    desc:'Dark ambusher who dominates turn 1 with psychic bursts.',
    perks:[
      'Dreadful Strike: first attacks deal +2d6 psychic (WIS mod uses)',
      'Initiative Advantage: you always act first',
      'Umbral Sight: attackers suffer -2 ATK against you',
    ],
    apply(G){ G._gloomStalker=true; },
  },

  // ── BARBARIAN ────────────────────────────────────────────
  berserker: {
    id:'berserker', classId:'barbarian',
    name:'Berserker',
    desc:'Frenzy lets you attack twice while raging — no exhaustion.',
    perks:[
      'Frenzy: extra attack while raging (no exhaustion)',
      'Mindless Rage: immune to Charmed/Frightened while raging',
      'Intimidating Presence: frighten enemy as bonus action while raging',
      'Retaliation: counter-attack when hit as reaction',
    ],
    apply(G){},
  },

  wild_heart: {
    id:'wild_heart', classId:'barbarian',
    name:'Path of the Wild Heart',
    desc:'Adaptive totem spirit warrior — animal spirit changes based on tactical need.',
    perks:[
      'Rage of the Wilds: Bear (-5 incoming dmg while raging); Eagle (enemies cant counter-attack); Wolf (+3 ATK first attack)',
      'Aspect of the Wilds: Bear totem grants +10 max HP',
      'Spirit Empowerment: Spirit Surge effects doubled while raging',
    ],
    apply(G){ G.maxHp+=10; G.hp=Math.min(G.maxHp,G.hp+10); },
  },

  // ── CLERIC ───────────────────────────────────────────────
  life: {
    id:'life', classId:'cleric',
    name:'Life Domain',
    desc:'Every heal restores extra HP. You are nearly unkillable.',
    perks:[
      'Disciple of Life: +2+slot HP on every heal',
      'Blessed Healer: self-heal 2+slot when healing',
      'Divine Strike: +1d8 radiant to weapon attacks',
      'Supreme Healing: maximize one powerful heal per rest',
    ],
    apply(G){},
  },

  war: {
    id:'war', classId:'cleric',
    name:'War Domain',
    desc:'Martial cleric who mixes weapon attacks into every turn.',
    perks:[
      'War Priest: bonus action weapon attack once per turn',
      'Avatar of Battle: reduce physical incoming damage by 3',
      'Divine Strike: basic attacks deal +1d8 divine damage',
    ],
    apply(G){ G._warDomain=true; },
  },

  // ── DRUID ────────────────────────────────────────────────
  moon: {
    id:'moon', classId:'druid',
    name:'Circle of the Moon',
    desc:'Your Wild Shape forms are stronger and used in combat.',
    perks:[
      'Combat Wild Shape: transform as bonus action',
      'Higher CR beast forms',
      'Elemental Wild Shape: become an elemental',
      'Lunar Form: regen 1d6 temp HP each turn while shapeshifted',
    ],
    apply(G){},
  },

  stars: {
    id:'stars', classId:'druid',
    name:'Circle of Stars',
    desc:'Cosmic caster who stays humanoid — radiant burst and divine luck.',
    perks:[
      "Star Map: start each fight with 1 free Nature's Charge",
      'Cosmic Omen: add 1d6 to any roll, WIS-mod times per rest',
      'Twinkling Constellations: after Starry Form ends, all cooldowns -1',
    ],
    apply(G){ G._starsDruid=true; G.skillCharges.cosmic_omen=Math.max(1,md(G.stats.wis)); },
  },

};
