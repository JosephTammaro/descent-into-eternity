// ================================================================
// relics.js — Per-Run Relics (behavioral passive items)
// 58 relics across common/uncommon/rare/epic/legendary rarities.
// Each relic has a `classes` array — selection logic filters by player class.
// Loaded after data/ultimates.js, before data/events.js.
// Descent into Eternity
// ================================================================

// Each relic: { id, name, icon, desc, rarity, trigger, effect, classes, val?, pct?, turns? }
// trigger: 'on_crit'|'on_kill'|'on_hit_taken'|'on_bonus_used'|'on_action_used'|'per_turn'|'passive'
// effect: key dispatched by triggerRelic() switch in ui.js
// classes: array of class IDs this relic can appear for

const _ALL_CLASSES = ['fighter','wizard','rogue','paladin','ranger','barbarian','cleric','druid'];
const _MARTIAL    = ['fighter','barbarian','paladin','ranger'];
const _CASTER     = ['wizard','cleric','druid'];
const _DEX        = ['rogue','ranger'];
const _FRONTLINE  = ['fighter','barbarian','paladin','cleric'];

const RELICS = [

  // ══════════════════════════════════════════════════════════
  //  COMMON
  // ══════════════════════════════════════════════════════════

  // ── Universal ──
  {
    id: 'bloodstone', name: 'Bloodstone Fragment', icon: 'health-increase',
    rarity: 'common', trigger: 'on_crit', effect: 'heal_on_crit', val: 3,
    classes: _ALL_CLASSES,
    desc: 'On crit: restore 3 HP.',
  },
  {
    id: 'hunters_token', name: "Hunter's Token", icon: 'crossed-swords',
    rarity: 'common', trigger: 'on_kill', effect: 'kill_atk_bonus', val: 1,
    classes: _ALL_CLASSES,
    desc: 'On kill: +1 ATK this fight (stacks, resets each fight).',
  },
  {
    id: 'stormcaller_band', name: "Stormcaller's Band", icon: 'lightning-bolt',
    rarity: 'common', trigger: 'on_bonus_used', effect: 'stormcaller_charge', val: 5,
    classes: _ALL_CLASSES,
    desc: 'On bonus action: your next attack deals +5 damage.',
  },
  {
    id: 'thornweave', name: 'Thornweave Braid', icon: 'vine-whip',
    rarity: 'common', trigger: 'per_turn', effect: 'regen_hp', val: 2,
    classes: _ALL_CLASSES,
    desc: 'Start of each turn: restore 2 HP.',
  },
  {
    id: 'fool_courage', name: "Fool's Courage", icon: 'aura',
    rarity: 'common', trigger: 'on_hit_taken', effect: 'gain_resource', val: 1,
    classes: _ALL_CLASSES,
    desc: 'On hit taken: gain 1 class resource.',
  },
  {
    id: 'wayward_coin', name: 'Wayward Coin', icon: 'gold-bar',
    rarity: 'common', trigger: 'on_kill', effect: 'gold_on_kill', val: 5,
    classes: _ALL_CLASSES,
    desc: 'On kill: gain 5 gold.',
  },

  // ── Martial / Frontline ──
  {
    id: 'iron_splinter', name: 'Iron Splinter', icon: 'shield',
    rarity: 'common', trigger: 'on_hit_taken', effect: 'counter_dmg', val: 4,
    classes: _FRONTLINE,
    desc: 'On hit taken: deal 4 damage back to the attacker.',
  },
  {
    id: 'dusty_sigil', name: 'Dusty Sigil', icon: 'rune-stone',
    rarity: 'common', trigger: 'passive', effect: 'passive_crit_range', val: 1,
    classes: [..._MARTIAL, 'rogue'],
    desc: 'Passive: +1 crit range (crits on 19\u201320 instead of 20).',
  },

  // ── Caster ──
  {
    id: 'arcane_lens', name: 'Arcane Lens', icon: 'telescope',
    rarity: 'common', trigger: 'on_action_used', effect: 'arcane_lens_spellpower', val: 2,
    classes: _CASTER,
    desc: 'On action skill: +2 spell power for your next spell this fight (stacks).',
  },

  // ── DEX ──
  {
    id: 'shadow_fang', name: 'Shadow Fang', icon: 'knife',
    rarity: 'common', trigger: 'on_bonus_used', effect: 'shadow_fang_crit', val: 3,
    classes: _DEX,
    desc: 'On bonus action: your next attack has +3 crit range.',
  },

  // ── Martial ──
  {
    id: 'battle_scarab', name: 'Battle Scarab', icon: 'beetle',
    rarity: 'common', trigger: 'on_hit_taken', effect: 'battle_scarab_def', val: 2,
    classes: _MARTIAL,
    desc: 'On hit taken: gain +2 DEF until end of your next turn.',
  },

  // ── Nature ──
  {
    id: 'verdant_seed', name: 'Verdant Seed', icon: 'wooden-sign',
    rarity: 'common', trigger: 'per_turn', effect: 'verdant_regen', val: 3,
    classes: ['ranger','druid'],
    desc: 'Start of each turn: restore 3 HP (nature affinity).',
  },

  // ══════════════════════════════════════════════════════════
  //  UNCOMMON
  // ══════════════════════════════════════════════════════════

  // ── Universal ──
  {
    id: 'momentum_rune', name: 'Momentum Rune', icon: 'wind-hole',
    rarity: 'uncommon', trigger: 'on_bonus_used', effect: 'refund_action_chance', pct: 0.25,
    classes: _ALL_CLASSES,
    desc: 'On bonus action: 25% chance to also restore your action for this turn.',
  },
  {
    id: 'cursed_eye', name: 'Cursed Eye', icon: 'eye-monster',
    rarity: 'uncommon', trigger: 'passive', effect: 'passive_expose', pct: 0.20,
    classes: _ALL_CLASSES,
    desc: 'Passive: 20% chance on each attack to Expose the enemy (-2 DEF for 2 turns).',
  },
  {
    id: 'obsidian_heart', name: 'Obsidian Heart', icon: 'heart-inside',
    rarity: 'uncommon', trigger: 'on_crit', effect: 'resource_on_crit', val: 2,
    classes: _ALL_CLASSES,
    desc: 'On crit: gain 2 class resource.',
  },
  {
    id: 'grim_mantle', name: 'Grim Mantle', icon: 'cloak-dagger',
    rarity: 'uncommon', trigger: 'on_kill', effect: 'pct_heal_on_kill', pct: 0.04,
    classes: _ALL_CLASSES,
    desc: 'On kill: restore 4% of your max HP.',
  },

  // ── Martial ──
  {
    id: 'wrathshard', name: 'Wrathshard', icon: 'crystal-wand',
    rarity: 'uncommon', trigger: 'on_crit', effect: 'crit_burn', turns: 2,
    classes: [..._MARTIAL, 'rogue'],
    desc: 'On crit: apply Burning (2 turns) to the enemy.',
  },
  {
    id: 'echo_blade', name: 'Echo Blade', icon: 'sword-wound',
    rarity: 'uncommon', trigger: 'on_kill', effect: 'splash_dmg', pct: 0.5,
    classes: _MARTIAL,
    desc: 'On kill: deal 50% ATK as splash damage to another enemy (cannot kill).',
  },
  {
    id: 'warlords_signet', name: "Warlord's Signet", icon: 'gem-pendant',
    rarity: 'uncommon', trigger: 'on_kill', effect: 'warlord_atk_surge', val: 3,
    classes: _MARTIAL,
    desc: 'On kill: +3 ATK for the next fight (does not stack).',
  },

  // ── Frontline / Tanks ──
  {
    id: 'paincrest', name: 'Paincrest Ring', icon: 'ring',
    rarity: 'uncommon', trigger: 'on_hit_taken', effect: 'paincrest_stack', val: 3,
    classes: _FRONTLINE,
    desc: 'On hit taken: +3 ATK stack (max 3 stacks, resets each fight).',
  },
  {
    id: 'shade_shroud', name: 'Shade Shroud', icon: 'hood',
    rarity: 'uncommon', trigger: 'per_turn', effect: 'evasion_chance', pct: 0.15,
    classes: ['wizard','rogue','ranger','druid'],
    desc: 'Start of each turn: 15% chance to dodge the next incoming hit.',
  },

  // ── Caster ──
  {
    id: 'mana_siphon', name: 'Mana Siphon', icon: 'lightning-trio',
    rarity: 'uncommon', trigger: 'on_kill', effect: 'restore_spell_slot',
    classes: ['wizard'],
    desc: 'On kill: 30% chance to restore a Level 1 spell slot.',
  },
  {
    id: 'devotion_stone', name: 'Devotion Stone', icon: 'ankh',
    rarity: 'uncommon', trigger: 'on_bonus_used', effect: 'devotion_heal', val: 4,
    classes: ['cleric','druid'],
    desc: 'On bonus action: restore 4 HP to yourself.',
  },

  // ── DEX ──
  {
    id: 'quicksilver_vial', name: 'Quicksilver Vial', icon: 'potion',
    rarity: 'uncommon', trigger: 'on_crit', effect: 'quicksilver_bonus_refund', pct: 0.35,
    classes: _DEX,
    desc: 'On crit: 35% chance to restore your bonus action.',
  },

  // ── Paladin / Cleric ──
  {
    id: 'radiant_phylactery', name: 'Radiant Phylactery', icon: 'sun',
    rarity: 'uncommon', trigger: 'on_action_used', effect: 'radiant_heal_on_action', val: 3,
    classes: ['paladin','cleric'],
    desc: 'On action skill: restore 3 HP to yourself.',
  },

  // ── Ranger / Druid ──
  {
    id: 'beastcallers_fang', name: "Beastcaller's Fang", icon: 'bear-trap',
    rarity: 'uncommon', trigger: 'on_action_used', effect: 'beastcaller_bleed', turns: 2,
    classes: ['ranger','druid'],
    desc: 'On action skill: 25% chance to apply Bleeding (2 turns) to the enemy.',
  },

  // ── Barbarian ──
  {
    id: 'bloodrage_torc', name: 'Bloodrage Torc', icon: 'bone-knife',
    rarity: 'uncommon', trigger: 'on_hit_taken', effect: 'bloodrage_atk', val: 2,
    classes: ['barbarian'],
    desc: 'While Raging \u2014 on hit taken: gain +2 ATK this fight (stacks, max 5).',
  },

  // ── Fighter ──
  {
    id: 'commanders_crest', name: "Commander's Crest", icon: 'knight-helmet',
    rarity: 'uncommon', trigger: 'on_action_used', effect: 'commanders_momentum', val: 1,
    classes: ['fighter'],
    desc: 'On action skill: gain 1 bonus Momentum.',
  },

  // ══════════════════════════════════════════════════════════
  //  RARE
  // ══════════════════════════════════════════════════════════

  // ── Universal ──
  {
    id: 'bone_flute', name: 'Flute of the Restless', icon: 'horn',
    rarity: 'rare', trigger: 'on_kill', effect: 'bone_flute_stun',
    classes: _ALL_CLASSES,
    desc: 'On kill: the next enemy that spawns begins combat Stunned (1 turn).',
  },

  // ── Martial / Physical ──
  {
    id: 'thirsting_blade', name: 'Thirsting Blade', icon: 'serrated-slash',
    rarity: 'rare', trigger: 'on_crit', effect: 'crit_double_next',
    classes: [..._MARTIAL, 'rogue'],
    desc: 'On crit: your next attack this fight deals double damage (once per fight).',
  },
  {
    id: 'soulbrand', name: 'Soulbrand Seal', icon: 'brandy-bottle',
    rarity: 'rare', trigger: 'on_hit_taken', effect: 'soulbrand_dmg_boost', pct: 0.10,
    classes: ['fighter','barbarian','cleric'],
    desc: 'On hit taken: +10% damage dealt until end of your next turn.',
  },

  // ── Tanks ──
  {
    id: 'ironward', name: 'Ironward Talisman', icon: 'round-shield',
    rarity: 'rare', trigger: 'passive', effect: 'flat_dmg_reduction', val: 4,
    classes: _FRONTLINE,
    desc: 'Passive: reduce all incoming damage by 4 (applied before HP loss).',
  },

  // ── Action economy ──
  {
    id: 'voidpiercer', name: 'Voidpiercer', icon: 'piercing-sword',
    rarity: 'rare', trigger: 'on_action_used', effect: 'voidpiercer_count',
    classes: ['fighter','wizard','paladin','ranger','barbarian','cleric','druid'],
    desc: 'Every 3rd action skill costs no action this turn.',
  },

  // ── Barbarian only ──
  {
    id: 'rage_amulet', name: "Berserker's Fang", icon: 'wolf-head',
    rarity: 'rare', trigger: 'per_turn', effect: 'raging_hp_drain_dmg',
    classes: ['barbarian'],
    desc: 'While Raging: each turn lose 2 HP and deal 6 damage to the enemy.',
  },

  // ── Caster ──
  {
    id: 'spellburn_focus', name: 'Spellburn Focus', icon: 'fire-ring',
    rarity: 'rare', trigger: 'on_crit', effect: 'crit_poison_caster', turns: 2,
    classes: _CASTER,
    desc: 'On crit: apply Poisoned (2 turns) to the enemy.',
  },

  // ── Fighter / Paladin ──
  {
    id: 'retaliation_plate', name: 'Retaliation Plate', icon: 'heavy-shield',
    rarity: 'rare', trigger: 'on_hit_taken', effect: 'retaliation_stun', pct: 0.20,
    classes: ['fighter','paladin'],
    desc: 'On hit taken: 20% chance to Stun the attacker for 1 turn.',
  },

  // ── Rogue only ──
  {
    id: 'nightrunner_charm', name: "Nightrunner's Charm", icon: 'fox',
    rarity: 'rare', trigger: 'on_kill', effect: 'nightrunner_evasion',
    classes: ['rogue'],
    desc: 'On kill: automatically dodge the next incoming attack.',
  },

  // ── Paladin only ──
  {
    id: 'oath_brand', name: 'Oath Brand', icon: 'burning-book',
    rarity: 'rare', trigger: 'on_crit', effect: 'oath_brand_smite', val: 8,
    classes: ['paladin'],
    desc: 'On crit: deal 8 bonus radiant damage (divine smite echo).',
  },

  // ── Druid only ──
  {
    id: 'moonwell_shard', name: 'Moonwell Shard', icon: 'moon-sun',
    rarity: 'rare', trigger: 'on_kill', effect: 'moonwell_resource', val: 2,
    classes: ['druid'],
    desc: "On kill: restore 2 Nature's Charge.",
  },

  // ══════════════════════════════════════════════════════════
  //  EPIC
  // ══════════════════════════════════════════════════════════

  // ── Universal ──
  {
    id: 'temporal_shard', name: 'Temporal Shard', icon: 'crystal-ball',
    rarity: 'epic', trigger: 'on_kill', effect: 'refund_action_on_kill', pct: 0.40,
    classes: _ALL_CLASSES,
    desc: 'On kill: 40% chance to restore your action for this turn.',
  },
  {
    id: 'ashen_crown', name: 'Ashen Crown', icon: 'crown',
    rarity: 'epic', trigger: 'on_bonus_used', effect: 'ashen_crown_refund',
    classes: _ALL_CLASSES,
    desc: 'First bonus action each fight: refund the resource cost.',
  },

  // ── Martial ──
  {
    id: 'void_mirror', name: 'Void Mirror', icon: 'mirror',
    rarity: 'epic', trigger: 'on_crit', effect: 'crit_echo_hit',
    classes: [..._MARTIAL, 'rogue'],
    desc: 'On crit: echo the crit damage as a second hit (once per turn).',
  },
  {
    id: 'warmonger_seal', name: "Warmonger's Seal", icon: 'axe',
    rarity: 'epic', trigger: 'on_kill', effect: 'warmonger_heal_atk', val: 5,
    classes: _MARTIAL,
    desc: 'On kill: restore 5 HP and gain +2 ATK for the next fight.',
  },

  // ── Caster ──
  {
    id: 'spell_eater', name: 'Spell Eater', icon: 'eye-shield',
    rarity: 'epic', trigger: 'on_hit_taken', effect: 'spell_eater_resource', val: 3,
    classes: _CASTER,
    desc: 'On hit taken: gain 3 class resource (casters feed on pain).',
  },

  // ══════════════════════════════════════════════════════════
  //  LEGENDARY
  // ══════════════════════════════════════════════════════════

  {
    id: 'heart_abyss', name: 'Heart of the Abyss', icon: 'abyss',
    rarity: 'legendary', trigger: 'per_turn', effect: 'abyss_drain', val: 5,
    classes: _ALL_CLASSES,
    desc: 'Start of each turn: steal 5 HP from the current enemy.',
  },
  {
    id: 'crown_oblivion', name: 'Crown of Oblivion', icon: 'crowned-skull',
    rarity: 'legendary', trigger: 'passive', effect: 'passive_execute',
    classes: _ALL_CLASSES,
    desc: 'Passive: any hit against an enemy below 15% HP instantly kills them.',
  },

  // ══════════════════════════════════════════════════════════
  //  POOL EQUALIZER — 12 relics to bring every class to 30
  // ══════════════════════════════════════════════════════════

  // ── Wizard + Rogue ──
  {
    id: 'prism_of_deceit', name: 'Prism of Deceit', icon: 'gem',
    rarity: 'common', trigger: 'on_action_used', effect: 'prism_evasion', pct: 0.15,
    classes: ['wizard','rogue'],
    desc: 'On action skill: 15% chance to dodge the next incoming attack.',
  },
  {
    id: 'gloomweave_thread', name: 'Gloomweave Thread', icon: 'uncertainty',
    rarity: 'uncommon', trigger: 'on_crit', effect: 'crit_shadow_dmg', val: 4,
    classes: ['wizard','rogue'],
    desc: 'On crit: deal 4 bonus shadow damage.',
  },
  {
    id: 'veilstrike_lens', name: 'Veilstrike Lens', icon: 'kaleidoscope',
    rarity: 'rare', trigger: 'on_bonus_used', effect: 'bonus_ignore_def',
    classes: ['wizard','rogue'],
    desc: 'On bonus action: your next attack ignores enemy DEF.',
  },

  // ── Wizard + Cleric + Druid (caster parity) ──
  {
    id: 'ether_conduit', name: 'Ether Conduit', icon: 'reactor',
    rarity: 'common', trigger: 'on_bonus_used', effect: 'ether_conduit_sp', val: 3,
    classes: ['wizard','cleric','druid'],
    desc: 'On bonus action: +3 spell power for your next spell this fight.',
  },
  {
    id: 'sanctum_spark', name: 'Sanctum Spark', icon: 'fairy-wand',
    rarity: 'uncommon', trigger: 'per_turn', effect: 'per_turn_resource_chance', pct: 0.20,
    classes: ['wizard','cleric','druid'],
    desc: 'Start of each turn: 20% chance to restore 1 class resource.',
  },

  // ── Wizard + Rogue + Druid ──
  {
    id: 'mistwalker_veil', name: 'Mistwalker Veil', icon: 'cloud',
    rarity: 'rare', trigger: 'on_hit_taken', effect: 'hit_weaken_enemy', pct: 0.25, turns: 2,
    classes: ['wizard','rogue','druid'],
    desc: 'On hit taken: 25% chance to Weaken the attacker for 2 turns.',
  },

  // ── Cleric + Druid + Ranger ──
  {
    id: 'natures_covenant', name: "Nature's Covenant", icon: 'leaf',
    rarity: 'uncommon', trigger: 'on_action_used', effect: 'low_hp_heal_on_action', val: 2,
    classes: ['cleric','druid','ranger'],
    desc: 'On action skill: restore 2 HP if below 50% max HP.',
  },

  // ── Rogue + Cleric ──
  {
    id: 'penance_chain', name: 'Penance Chain', icon: 'chain',
    rarity: 'uncommon', trigger: 'on_kill', effect: 'kill_hp_resource', val: 3,
    classes: ['rogue','cleric'],
    desc: 'On kill: restore 3 HP and gain 1 class resource.',
  },

  // ── Wizard + Druid ──
  {
    id: 'astral_root', name: 'Astral Root', icon: 'root',
    rarity: 'uncommon', trigger: 'on_kill', effect: 'astral_root_sp', val: 2,
    classes: ['wizard','druid'],
    desc: 'On kill: +2 spell power for the next fight.',
  },
  {
    id: 'spellthread_sash', name: 'Spellthread Sash', icon: 'scroll-unfurled',
    rarity: 'common', trigger: 'passive', effect: 'passive_crit_range_caster', val: 1,
    classes: ['wizard','druid'],
    desc: 'Passive: +1 crit range (crits on 19\u201320 instead of 20).',
  },

  // ── Rogue only ──
  {
    id: 'venomtip_ring', name: 'Venomtip Ring', icon: 'bottle-vapors',
    rarity: 'common', trigger: 'on_crit', effect: 'crit_poison_dex', turns: 2,
    classes: ['rogue'],
    desc: 'On crit: apply Poisoned (2 turns) to the enemy.',
  },

  // ── Wizard + Rogue + Cleric ──
  {
    id: 'twilight_cowl', name: 'Twilight Cowl', icon: 'cowl',
    rarity: 'rare', trigger: 'on_bonus_used', effect: 'bonus_def_boost', val: 3,
    classes: ['wizard','rogue','cleric'],
    desc: 'On bonus action: gain +3 DEF until end of your next turn.',
  },
];
