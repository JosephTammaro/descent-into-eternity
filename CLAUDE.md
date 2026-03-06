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

sprites/              — PNG frames for fighter, wizard, rogue (idle/attack/defend)
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

## Adding Content

- **New enemy/item/zone data** → appropriate file in `data/`
- **New skill effect** → add a `case` in `doSkillEffect()` in `combat/skills.js`
- **New condition** → handler in `combat/` (see existing condition tick logic), display label in `ui.js`
- **New class skill** → define in `data/classes.js`, implement effect in `combat/skills.js`
- **New permanent upgrade** → add to `UPGRADES_DATA` in `data/ultimates.js`, apply in `applyPermanentUpgrades()` in `main/state.js`

## Style

- Vanilla JS only — no `import`/`export`, no `class` keyword, no TypeScript
- Short variable names are fine (`g`, `e`, `sk`, `idx`)
- Section headers use `// ══ SECTION NAME ══` style
- Keep data in `data/`, combat logic in `combat/`, rendering in `ui.js` and `main/hud.js`
