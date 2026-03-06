# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

No build step. Open `index.html` directly in a browser. All JS files are loaded via `<script>` tags in dependency order — if you add a new file, add a `<script>` tag to `index.html` in the right position.

There are no tests, no linter, no package.json.

## Architecture

Vanilla JS browser RPG. No modules, no bundler, no framework. Everything is global scope.

### File Structure

```
index.html            — entry point, loads all scripts in order
audio.js              — sound/music (single IIFE exposing AUDIO object)
sprite-engine.js      — PNG sprite renderer (fighter/wizard/rogue animations)
animations.js         — visual effect helpers
ui.js                 — all DOM rendering (screens, combat UI, inventory, campfire)
save.js               — localStorage save/load
bugreport.js          — bug report modal
devtools.js           — dev/debug utilities (excluded from production)

data/                 — pure static data, no logic
  constants.js        — stat display names, all color palette vars (used by art.js)
  art.js              — pixel art sprite arrays (enemies, companions, campfire; NOT fighter/wizard/rogue — those use PNGs)
  classes.js          — CLASSES object (8 classes with stats, skills, spell slots)
  lore.js             — GAME_INTRO, LORE_REVEALS
  zones.js            — ZONES, BRANCH_ZONES, branch rewards/passives
  items.js            — ITEMS array, SET_BONUSES
  ultimates.js        — ULTIMATES, UPGRADES_DATA, TALENT_POOLS
  events.js           — RANDOM_EVENTS, RARE_EVENTS
  modifiers.js        — ZONE_MODIFIERS, hasMod(), modEffect()
  unlocks.js          — UNLOCKABLE_ITEMS, UNLOCKS

main/                 — game flow and rendering
  state.js            — G (global state), newState(), roll(), md(), profFor(), xpFor(), applyPermanentUpgrades()
  title.js            — canvas title screen animation, beginDescent()
  map.js              — zone map background, renderClassSelect(), selectClass()
  intro.js            — intro/victory/lore/credits sequences, play timer
  hud.js              — renderAll() and all HUD rendering functions
  zones.js            — enterZone(), setPlayerTurn(), spawnEnemy(), enemy area rendering
  branch.js           — optional branch dungeon system
  effects.js          — screen shake, boss cinematics, keyboard controls

combat/               — all combat logic
  helpers.js          — getSpellPower(), addOffensiveStat(), restoreSpellSlot(), CASTER_CLASSES, DEX_CLASSES
  skills.js           — useSkill(), doSkillEffect() (large switch statement per skill)
  damage.js           — calcPlayerDmg(), dealToEnemy(), dealToAllEnemies(), heal()
  enemy.js            — doEnemyTurn(), reactions, doEnemyAttack(), exitWildShape()
  boss.js             — doBossSpecial(), channel divinity, showPhase2Overlay()
  death.js            — onEnemyDied(), showDeathScreen(), salvage prompt

town/                 — town engine (canvas-based 2D world)
  data.js             — map tiles, building defs, INTERIORS, NPC_LINES, ATMOS
  ambient.js          — particles, smoke, cat AI, birds, water ripples, minimap
  render.js           — all _draw* functions, collision, camera
  loop.js             — _townTick() game loop, NPC AI, keyboard input
  cutscenes.js        — intro/farewell cinematics, NPC dialog, showTownHub(), townEnterDungeon()
  services.js         — shop, temple, forge, upgrades, prepare screen, victory mode

sprites/              — PNG frames for fighter, wizard, rogue, paladin (idle/attack/defend)
plans/                — design docs (lore bible, roadmap) — reference only, not loaded
```

### Script Load Order (index.html)

`town/` → `audio.js` → `data/` → `save.js` → `main/` → `sprite-engine.js` → `animations.js` → `combat/` → `ui.js` → `bugreport.js` → `devtools.js`

This order matters — later files depend on globals defined by earlier files.

## Global State

All live game state is in `G` (defined in `main/state.js`, initialized by `newState()`). Never create new top-level globals for state — add properties to `G`.

Key fields:
```js
G.classId           // 'fighter' | 'wizard' | 'rogue' | 'paladin' | 'ranger' | 'barbarian' | 'cleric' | 'druid'
G.hp, G.maxHp
G.atk, G.def
G.magBonus          // magic attack bonus (casters)
G.conditions[]      // active status effects on player
G.inventory[]       // fixed Array(20), null-padded — use index assignment, never push/pop
G.equipped{}        // { weapon, armor, ring, offhand, helmet, boots, amulet, gloves }
G.currentEnemies[]  // active enemies in combat
G.isPlayerTurn
G.skillCooldowns{}  // { skillId: turnsRemaining }
G.zoneIdx           // current zone (0–7)
```

## Critical Conventions

**Damage:** Always call `dealToEnemy(enemy, amount)` — never mutate `enemy.hp` directly. It handles DEF, conditions, death, and logging.

**Spell power:** Always call `getSpellPower()` (in `combat/helpers.js`) — never compute inline.

**Class routing:** Use `CASTER_CLASSES` / `DEX_CLASSES` constants and `addOffensiveStat()` instead of hardcoding class IDs:
```js
// CASTER_CLASSES = ['wizard','cleric','druid']
// DEX_CLASSES    = ['rogue','ranger']
addOffensiveStat(G, value); // adds to magBonus for casters, atk for martials
```

**Rendering:** Call `renderAll()` after any state mutation that should be visible.

**Random:** `roll(d)` returns 1..d (1-indexed). `roll(6)` → 1–6.

## Data Schemas

### Item
```js
{ id, name, icon, type, slot, rarity, stats: {atk,def,hp,magAtk,crit,heal}, value, desc? }
// rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
// slot: 'weapon' | 'armor' | 'ring' | 'offhand' | 'helmet' | 'boots' | 'amulet' | null
```

### Enemy (inside a zone's `enemies[]`)
```js
{ name, icon, hp, atk, def, xp, gold, drop?, dropChance?, special?, isBoss? }
// xp ≈ hp * 0.5 as a rough balance guide
```

### Skill (inside a class's `skills[]`)
```js
{ id, name, icon, desc, cost, cooldown?, charges?, action: 'action'|'bonus'|'reaction' }
// Skill logic lives in combat/skills.js doSkillEffect() — add a case to the switch
// If the skill needs cooldown/charge tracking, init it in newState() in main/state.js
```

## What's Built — Content Inventory

### Classes & Combat
- **8 classes**: fighter, wizard, rogue, paladin, ranger, barbarian, cleric, druid
- **6–8 skills per class** including action/bonus/reaction/ultimate types. Ultimates are once-per-rest (`ultimateOnly` flag).
- **Subclasses** unlock at Level 3 (Champion, Evoker, Thief, Oath of Devotion, Beast Master, Berserker, Life Domain, Circle of the Moon)
- **Talents** defined in `data/ultimates.js` TALENT_POOLS — multiple per class, chosen every 3 levels
- **Conditions**: Burning, Poisoned, Bleeding, Stunned, Restrained, Frightened, Weakened, Vulnerable, Shield/Rage buffs
- **PNG sprites** for all 8 classes (idle/attack/defend) in `sprites/` — pixel fallback in `data/art.js` for enemies/companions only

### Zones & Enemies
- **8 zones** (I–VIII): Whispering Woods → Ruined Outpost → Thornwall Castle → The Underdark → Abyssal Gate → Frostveil Peaks → Celestial Plane → The Shadow Realm
- Each zone has 5 enemy types + boss with Phase 2 special. All 8 bosses have lore reveals in `data/lore.js`.
- **Branch zones** in `data/zones.js` (BRANCH_ZONES) — optional side dungeons with unique rewards

### Items & Equipment
- **113 items** across: weapon, offhand, armor, helmet, gloves, boots, ring, amulet, consumable, material
- **Rarities**: common, uncommon, rare, epic, legendary
- **12 item sets** (8 class-signature + 4 generic), 2–4 piece bonuses defined in `SET_BONUSES`
- **10 unlockable items** gated behind UNLOCKS conditions
- Legendary items have unique passive effects that alter skill behaviour

### Progression Systems
- **47 random events**: 27 standard + 20 rare. Rare events unlock via UNLOCKS conditions.
- **23 run modifiers**: 12 always-available + 11 unlockable. Categories: risk, combat, economy, environment. Selected on the Prepare screen.
- **37 unlock definitions** in `data/unlocks.js`: 8 modifiers, 10 items, 6 graces, 8 titles, 5 events — all gated behind lifetime stat checks (`unlocks.stats` in save)
- **6 graces**: Equippable passive bonuses unlocked via achievements. Managed at the Grace Vault in town. Stored per save-slot in `graces: { inventory, equipped }`.
- **Permanent upgrades** (`PERMANENT_UPGRADES` in `save.js`): 10 universal + 8 class masteries. Persist across all runs on a save slot.
- **Chromas** (sprite colour filters): 4 per class × 8 classes = 32 cosmetic unlocks in `sprite-engine.js`

### Town (Elderfen)
- Canvas-based 2D world with full NPC wander AI, proximity interaction, camera, particles, ambient effects
- **5 town decay states** driven by `_townState(bossesBeaten)` — NPCs disappear as hero descends deeper
- **Building services**: Tavern (Rook/rumors), Temple (Seraphine/blessings), Forge (Aldric/sharpen+sell), Malachar's Study (shop tier upgrades), Proving Grounds (permanent upgrades), Inn, Market, Mirela's shop, Stash, Grace Vault, Notice Board, Graveyard
- **Zone VI–VII building dialog gap**: Rook, Seraphine, Malachar, Aldric only have dialogue up to zone state 2–3. Specific lines for late-game surfacings (zones 6–7) are not yet written.
- **Farewell cutscene** (pre-Zone VIII): `FAREWELL_LINES` in `town/cutscenes.js`, triggers at `G.zoneIdx >= 7 && !G._farewellShown`
- **Victory sequence** (post-final boss): Black screen → town in `_victoryMode` → `VICTORY_CROWD` crowd scene with all 14 NPCs speaking → credits. `VICTORY_CROWD` defined in `town/services.js`.

### Narrative
- **GAME_INTRO** and **LORE_REVEALS[8]** in `data/lore.js` — one lore beat per boss death
- Zone story text in each zone definition (`story.title` / `story.text`)
- Kit/Rue/Elspeth/Brother Edwyn NPC arcs across all 5 town states

## Adding Content

- **New enemy/item/zone data** → appropriate file in `data/`
- **New skill effect** → add a `case` in `doSkillEffect()` in `combat/skills.js`
- **New condition** → handler in `combat/` (see existing condition tick logic), display label in `ui.js`
- **New class skill** → define in `data/classes.js`, implement effect in `combat/skills.js`
- **New permanent upgrade** → add to `PERMANENT_UPGRADES` in `save.js`, apply in `applyPermanentUpgrades()` in `main/state.js`
- **New achievement/unlock** → add to `UNLOCKS` in `data/unlocks.js`, increment relevant stat via `updateUnlockStats()` at the trigger point
- **New grace** → add unlock entry in `data/unlocks.js` (type: 'grace'), define effect in grace equip logic in `town/services.js`
- **New run modifier** → add to `ZONE_MODIFIERS` in `data/modifiers.js`, apply effect where relevant (combat, economy, etc.)

## Style

- Vanilla JS only — no `import`/`export`, no `class` keyword, no TypeScript
- Short variable names are fine (`g`, `e`, `sk`, `idx`)
- Section headers use `// ══ SECTION NAME ══` style
- Keep data in `data/`, combat logic in `combat/`, rendering in `ui.js` and `main/hud.js`
