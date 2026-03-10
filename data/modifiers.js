const ZONE_MODIFIERS = [
  // ── BASE POOL (available from run 1) ─────────────────────
  {id:'bloodmoon',     name:'Bloodmoon',           icon:'moon-sun', category:'risk',
   desc:'Enemies deal +20% damage. Gold drops +30%.',
   flavor:'The moon hangs red. Everything bleeds more — including you.',
   locked:false, effects:{enemyDmgMult:1.2, goldMult:1.3}},

  {id:'fortified',     name:'Fortified',            icon:'castle-emblem', category:'risk',
   desc:'Enemies have +20% HP. Guaranteed rare+ drop before boss.',
   flavor:'The defenders here are dug in deep. But they guard something worth taking.',
   locked:false, effects:{enemyHpMult:1.2, guaranteedRareDrop:true}},

  {id:'volatile',      name:'Volatile',             icon:'explosion', category:'risk',
   desc:'All crits deal +50% damage. Crit range +1 for both sides.',
   flavor:'The air crackles. Every strike might be the last.',
   locked:false, effects:{critDmgMult:1.5, critRangeBonus:1}},

  {id:'bounty',        name:'Bounty',               icon:'gold-bar', category:'risk',
   desc:'Enemies +15% ATK. Gold drops +50%.',
   flavor:'Mercenaries have claimed this territory. Well-paid ones.',
   locked:false, effects:{enemyAtkMult:1.15, goldMult:1.5}},

  {id:'thick_fog',     name:'Thick Fog',            icon:'fluffy-swirl', category:'combat',
   desc:'All attacks have a 12% miss chance.',
   flavor:'You can barely see your own hands. Neither can they.',
   locked:false, effects:{missChance:0.12}},

  {id:'bloodlust',     name:'Bloodlust',            icon:'dripping-blade', category:'combat',
   desc:'Killing an enemy heals 8% max HP. Enemies +10% ATK.',
   flavor:'The smell of death invigorates you. But the enemies can smell it too.',
   locked:false, effects:{killHealPct:0.08, enemyAtkMult:1.1}},

  {id:'ironhide',      name:'Ironhide',             icon:'round-shield', category:'combat',
   desc:'Both sides get +5 DEF. Fights last longer.',
   flavor:'Everything here has grown a thicker skin. Including you.',
   locked:false, effects:{bonusDef:5}},

  {id:'frenzied',      name:'Frenzied',             icon:'lightning-bolt', category:'combat',
   desc:'Combat starts at round 3. Boss specials fire immediately.',
   flavor:'No time to breathe. The fight is already halfway over.',
   locked:false, effects:{startRound:3}},

  {id:'famine',        name:'Famine',               icon:'scythe', category:'economy',
   desc:'Enemies drop NO gold. Shop prices halved.',
   flavor:'Nothing lives here long enough to carry coin. But the merchants are desperate.',
   locked:false, effects:{noGold:true, shopPriceMult:0.5}},

  {id:'scavenger',     name:'Scavenger\'s Paradise', icon:'wooden-sign', category:'economy',
   desc:'Item drop rate doubled. Enemy gold -40%.',
   flavor:'The dead leave behind more than coin.',
   locked:false, effects:{lootChanceMult:2.0, goldMult:0.6}},

  {id:'cursed_ground', name:'Cursed Ground',        icon:'skull', category:'environment',
   desc:'Take 3% max HP at fight start. Enemies start Weakened 2 turns.',
   flavor:'The land itself is sick. Everything that walks here suffers.',
   locked:false, effects:{startDmgPct:0.03, enemyWeakenTurns:2}},

  {id:'echoing',       name:'Echoing Halls',        icon:'horn-call', category:'environment',
   desc:'AOE abilities +30% damage. Single-target -10%.',
   flavor:'Sound carries here. Destruction carries further.',
   locked:false, effects:{aoeDmgMult:1.3, singleDmgMult:0.9}},

  // ── UNLOCKABLE (earned through B3) ──────────────────────
  {id:'restless_dead', name:'Restless Dead',        icon:'death-skull', category:'combat',
   desc:'20% chance killed enemies revive at 30% HP. Revived drop 2× gold.',
   flavor:'They do not stay down. But neither does their coin.',
   locked:true, effects:{reviveChance:0.20, reviveHpPct:0.30, reviveGoldMult:2}},

  {id:'glass_cannon', name:'Glass Cannon',          icon:'fire', category:'risk',
   desc:'Player deals +25% damage. Player takes +25% damage.',
   flavor:'You feel unstoppable. You also feel fragile.',
   locked:true, effects:{playerDmgMult:1.25, playerTakenMult:1.25}},

  {id:'taxed',        name:'Taxed',                 icon:'gold-bar', category:'economy',
   desc:'Lose 10% gold on entry. Enemies +20% gold, fights +20% XP.',
   flavor:'A toll must be paid. But the rewards run deeper.',
   locked:true, effects:{entryGoldTax:0.10, goldMult:1.2, xpMult:1.2}},

  {id:'predator',     name:'Predator and Prey',     icon:'wolf-head', category:'combat',
   desc:'First attacker in each fight gets +20% damage for 3 turns.',
   flavor:'In this place, initiative is everything.',
   locked:true, effects:{initiativeBuff:0.20, initiativeDur:3}},

  {id:'witch_bargain',name:'Witch\'s Bargain',      icon:'crystal-ball', category:'combat',
   desc:'Each fight: sacrifice 10% HP for +15% damage, or vice versa.',
   flavor:'Power or preservation? The witch always asks.',
   locked:true, effects:{witchChoice:true}},

  {id:'ancestral',    name:'Ancestral Fury',        icon:'crossed-bones', category:'combat',
   desc:'Each kill gives +2 damage (resets at camp). Enemies get +1% damage per stack.',
   flavor:'The spirits of the fallen lend you strength. But wrath attracts wrath.',
   locked:true, effects:{killAtkStack:2, enemyDmgPerStack:0.01}},

  {id:'mythic',       name:'Mythic',                icon:'trophy', category:'risk',
   desc:'Enemies +30% HP, +20% ATK. All drops upgrade one rarity tier. Boss guarantees legendary.',
   flavor:'This is the crucible. Only the worthy survive — and they are rewarded.',
   locked:true, effects:{enemyHpMult:1.3, enemyAtkMult:1.2, upgradeDrops:true, bossLegendary:true}},

  {id:'mirrored',     name:'Mirrored',              icon:'mirror', category:'combat',
   desc:'Enemies copy 20% of your highest offensive or defensive stat.',
   flavor:'They are learning from you. Adapt.',
   locked:true, effects:{mirrorPct:0.20}},
];

const ZONE_MOD_BY_ID = {};
ZONE_MODIFIERS.forEach(m => { ZONE_MOD_BY_ID[m.id] = m; });

// Helper: check if current zone has a specific modifier
function hasMod(modId){
  return G && G._activeModifier && G._activeModifier.id === modId;
}
// Helper: get a numeric effect value from the active modifier
function modEffect(key, fallback){
  if(!G || !G._activeModifier) return fallback !== undefined ? fallback : 0;
  const v = G._activeModifier.effects[key];
  return v !== undefined ? v : (fallback !== undefined ? fallback : 0);
}


// ══════════════════════════════════════════════════════════
//  UNLOCKABLE ITEMS (B3) — Enter shop/drop pool when unlocked
// ══════════════════════════════════════════════════════════

