const UNLOCKABLE_ITEMS = [
  {id:'bloodhunterFang', name:'Bloodhunter\'s Fang', icon:'🦷', slot:'weapon', rarity:'rare',
   desc:'ATK +18, Lifesteal 8%', stats:{atk:18}, passive:{id:'lifesteal',pct:0.08},
   price:240, unlockId:'ul_bloodhunter'},

  {id:'veilOfShadows', name:'Veil of Shadows', icon:'🌑', slot:'armor', rarity:'rare',
   desc:'DEF +12, 10% dodge on first hit each fight', stats:{def:12}, passive:{id:'firstDodge',pct:0.10},
   price:220, unlockId:'ul_veil'},

  {id:'ringOfEchoes', name:'Ring of Echoes', icon:'🔔', slot:'ring', rarity:'rare',
   desc:'Crit +3, 5% chance to repeat damage', stats:{crit:3}, passive:{id:'echo',pct:0.05},
   price:200, unlockId:'ul_echo'},

  {id:'starvationAmulet', name:'Starvation Amulet', icon:'💀', slot:'amulet', rarity:'uncommon',
   desc:'ATK +8, Max HP -15', stats:{atk:8,hp:-15},
   price:120, unlockId:'ul_starvation'},

  {id:'ironCrown', name:'Iron Crown', icon:'👑', slot:'helmet', rarity:'rare',
   desc:'DEF +10, immune to Frightened', stats:{def:10}, passive:{id:'fearImmune'},
   price:190, unlockId:'ul_crown'},

  {id:'windwalkerBoots', name:'Windwalker Boots', icon:'💨', slot:'boots', rarity:'rare',
   desc:'DEF +5, Dodge +5%', stats:{def:5}, passive:{id:'dodge',pct:0.05},
   price:180, unlockId:'ul_windwalker'},

  {id:'gauntletsOfRuin', name:'Gauntlets of Ruin', icon:'🔥', slot:'gloves', rarity:'rare',
   desc:'ATK +12, take 3 self-damage per attack', stats:{atk:12}, passive:{id:'selfDmg',val:3},
   price:210, unlockId:'ul_ruin'},

  {id:'merchantLedger', name:'Merchant\'s Ledger', icon:'📒', slot:'offhand', rarity:'uncommon',
   desc:'DEF +5, Gold +15%', stats:{def:5,goldMult:0.15},
   price:150, unlockId:'ul_ledger'},

  {id:'phoenixFeather', name:'Phoenix Feather', icon:'🪶', slot:'ring', rarity:'epic',
   desc:'On death, revive once at 30% HP (consumed)', stats:{}, passive:{id:'phoenixRevive'},
   price:350, unlockId:'ul_phoenix'},

  {id:'namelessBlade', name:'The Nameless Blade', icon:'🗡️', slot:'weapon', rarity:'legendary',
   desc:'ATK +28, Crit +5, +1% damage per 1% HP missing', stats:{atk:28,crit:5}, passive:{id:'berserkerBlade'},
   price:500, unlockId:'ul_nameless'},
];


// ══════════════════════════════════════════════════════════
//  UNLOCK DEFINITIONS (B3) — Conditions → rewards
// ══════════════════════════════════════════════════════════

const UNLOCKS = [
  // ── Modifier unlocks ──────────────────────────────────
  {id:'unlock_restless_dead', type:'modifier', targetId:'restless_dead',
   name:'Restless Dead modifier', icon:'💀',
   check:(slot)=> slot.bossDefeated && slot.bossDefeated[2]},

  {id:'unlock_glass_cannon', type:'modifier', targetId:'glass_cannon',
   name:'Glass Cannon modifier', icon:'🔥',
   check:(slot,g)=> (g && g.level >= 10) || slot.lifetimeKills >= 50},

  {id:'unlock_taxed', type:'modifier', targetId:'taxed',
   name:'Taxed modifier', icon:'💸',
   check:(slot)=> slot.lifetimeGold >= 2000},

  {id:'unlock_predator', type:'modifier', targetId:'predator',
   name:'Predator and Prey modifier', icon:'🐺',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.classesReachedZone5 && slot.unlocks.stats.classesReachedZone5.length >= 3)},

  {id:'unlock_witch', type:'modifier', targetId:'witch_bargain',
   name:'Witch\'s Bargain modifier', icon:'🧙',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.totalRareEvents >= 5)},

  {id:'unlock_ancestral', type:'modifier', targetId:'ancestral',
   name:'Ancestral Fury modifier', icon:'👻',
   check:(slot)=> slot.lifetimeKills >= 200},

  {id:'unlock_mythic', type:'modifier', targetId:'mythic',
   name:'Mythic modifier', icon:'🌟',
   check:(slot)=> slot.bossDefeated && slot.bossDefeated.every(b=>b)},

  {id:'unlock_mirrored', type:'modifier', targetId:'mirrored',
   name:'Mirrored modifier', icon:'🪞',
   check:(slot,g)=> (g && g.level >= 20) || (slot.unlocks && slot.unlocks.stats.highestLevel >= 20)},

  // ── Rare event unlocks ────────────────────────────────
  {id:'unlock_ev_soul_merchant', type:'event', targetId:5, // index in RARE_EVENTS
   name:'Soul Merchant event', icon:'👤',
   check:(slot)=> slot.bossDefeated && slot.bossDefeated.filter(b=>b).length >= 3},

  {id:'unlock_ev_frozen_army', type:'event', targetId:15,
   name:'Frozen Army event', icon:'❄️',
   check:(slot)=> slot.bossDefeated && slot.bossDefeated[5]},

  {id:'unlock_ev_blind_tear', type:'event', targetId:16,
   name:'Blind God\'s Tear event', icon:'👁️',
   check:(slot)=> slot.bossDefeated && slot.bossDefeated[6]},

  {id:'unlock_ev_gate_fragment', type:'event', targetId:18,
   name:'Gate Fragment event', icon:'🚪',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.classesReachedZone8 && slot.unlocks.stats.classesReachedZone8.length >= 1)},

  {id:'unlock_ev_doppelganger', type:'event', targetId:3,
   name:'Doppelganger event', icon:'🪞',
   check:(slot)=> slot.lifetimeKills >= 100},

  // ── Item unlocks ──────────────────────────────────────
  {id:'ul_bloodhunter', type:'item', targetId:'bloodhunterFang',
   name:'Bloodhunter\'s Fang', icon:'🦷',
   check:(slot,g)=> g && g.totalKills >= 50},

  {id:'ul_veil', type:'item', targetId:'veilOfShadows',
   name:'Veil of Shadows', icon:'🌑',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.zonesWithoutRest >= 1)},

  {id:'ul_echo', type:'item', targetId:'ringOfEchoes',
   name:'Ring of Echoes', icon:'🔔',
   check:(slot)=> slot.lifetimeCrits >= 50},

  {id:'ul_starvation', type:'item', targetId:'starvationAmulet',
   name:'Starvation Amulet', icon:'💀',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.famineZonesCleared >= 1)},

  {id:'ul_crown', type:'item', targetId:'ironCrown',
   name:'Iron Crown', icon:'👑',
   check:(slot)=> slot.bossDefeated && slot.bossDefeated.filter(b=>b).length >= 3},

  {id:'ul_windwalker', type:'item', targetId:'windwalkerBoots',
   name:'Windwalker Boots', icon:'💨',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.uniqueModifiersCleared && slot.unlocks.stats.uniqueModifiersCleared.length >= 3)},

  {id:'ul_ruin', type:'item', targetId:'gauntletsOfRuin',
   name:'Gauntlets of Ruin', icon:'🔥',
   check:(slot,g)=> (g && g.level >= 15) || (slot.unlocks && slot.unlocks.stats.highestLevel >= 15)},

  {id:'ul_ledger', type:'item', targetId:'merchantLedger',
   name:'Merchant\'s Ledger', icon:'📒',
   check:(slot)=> slot.lifetimeGold >= 5000},

  {id:'ul_phoenix', type:'item', targetId:'phoenixFeather',
   name:'Phoenix Feather', icon:'🪶',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.totalDeaths >= 10)},

  {id:'ul_nameless', type:'item', targetId:'namelessBlade',
   name:'The Nameless Blade', icon:'🗡️',
   check:(slot)=> slot.bossDefeated && slot.bossDefeated[7]},

  // ── Grace unlocks ─────────────────────────────────────
  {id:'ul_grace_modifier', type:'grace', targetId:'modifier_mastery',
   name:'Modifier Mastery grace', icon:'⚙️',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.uniqueModifiersCleared && slot.unlocks.stats.uniqueModifiersCleared.length >= 5)},

  {id:'ul_grace_scavenger', type:'grace', targetId:'scavenger_instinct',
   name:'Scavenger\'s Instinct grace', icon:'🎒',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.totalSalvages >= 10)},

  {id:'ul_grace_warden', type:'grace', targetId:'wardens_memory',
   name:'Warden\'s Memory grace', icon:'🛡️',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.totalCampfires >= 20)},

  {id:'ul_grace_reckless', type:'grace', targetId:'reckless_genius',
   name:'Reckless Genius grace', icon:'⚡',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.fastestBossKill <= 5)},

  {id:'ul_grace_wanderer', type:'grace', targetId:'eternal_wanderer',
   name:'Eternal Wanderer grace', icon:'🗺️',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.classesReachedZone8 && slot.unlocks.stats.classesReachedZone8.length >= 3)},

  {id:'ul_grace_elspeth', type:'grace', targetId:'elspeths_blessing',
   name:'Elspeth\'s Blessing grace', icon:'🕯️',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.farewellSeen)},

  // ── Title unlocks ─────────────────────────────────────
  {id:'ul_title_blooded', type:'title', targetId:'blooded',
   name:'"Blooded" title', icon:'🩸',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.totalDeaths >= 1)},

  {id:'ul_title_veteran', type:'title', targetId:'veteran',
   name:'"Veteran" title', icon:'⚔️',
   check:(slot)=> slot.bossDefeated && slot.bossDefeated[4]},

  {id:'ul_title_mythic', type:'title', targetId:'mythic_slayer',
   name:'"Mythic Slayer" title', icon:'🌟',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.mythicZonesCleared >= 1)},

  {id:'ul_title_ironclad', type:'title', targetId:'ironclad',
   name:'"Ironclad" title', icon:'🛡️',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.ironmanZones >= 3)},

  {id:'ul_title_undying', type:'title', targetId:'undying',
   name:'"The Undying" title', icon:'🪶',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.phoenixRevives >= 1)},

  {id:'ul_title_godslayer', type:'title', targetId:'godslayer',
   name:'"Godslayer" title', icon:'👁️',
   check:(slot)=> slot.bossDefeated && slot.bossDefeated[6]},

  {id:'ul_title_returned', type:'title', targetId:'returned',
   name:'"The Returned" title', icon:'🌑',
   check:(slot)=> slot.bossDefeated && slot.bossDefeated[7]},

  {id:'ul_title_eternal', type:'title', targetId:'eternal',
   name:'"Eternal" title', icon:'👑',
   check:(slot)=> (slot.unlocks && slot.unlocks.stats.classesBeatenBoss8 && slot.unlocks.stats.classesBeatenBoss8.length >= 8)},
];// ══════════════════════════════════════════════════════════
//  RARE EVENTS — High-stakes between-fight events (A3)
//  Max 1 per zone, ~20% trigger chance on Next Enemy click
// ══════════════════════════════════════════════════════════

