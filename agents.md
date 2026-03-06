# Agents Guide — Descent into Eternity

Vanilla-JS browser RPG. No build step, no framework, no modules — all files loaded via `<script>` tags. Global state is the global scope.

## File Architecture

| File | Purpose |
|---|---|
| `data.js` | All static game data: sprites, classes, items, enemies, zones, upgrades, talents |
| `main.js` | Global state (`G`), game flow, screen management, HUD, XP/level, enemy spawning |
| `combat.js` | Skill use, enemy AI, damage calc, conditions, reactions, death, rewards |
| `ui.js` | All DOM rendering — screens, combat UI, inventory, town |
| `town.js` | Camp/town logic: shop, rest, crafting, campfire events |
| `save.js` | Save/load via localStorage |
| `audio.js` | Sound effects and music |
| `animations.js` | Visual effect helpers |
| `sprites.js` | Pixel sprite renderer |
| `bugreport.js` | Bug report modal |

## Core Global State

All live game state lives in `G` (declared in `main.js`). Never create new top-level state variables — add properties to `G` instead. Key fields:

```js
G.classId          // active class string ('warrior', 'wizard', etc.)
G.level, G.xp      // player progression
G.hp, G.maxHp      // player health
G.atk, G.def       // physical combat stats
G.magBonus         // magic attack bonus
G.spellPower       // base spell power (set from class stats at init)
G.conditions[]     // active status conditions
G.inventory[]      // Array(20), null-padded
G.equipped{}       // {weapon, armor, ring, offhand, helmet, boots, amulet, gloves}
G.currentEnemies[] // active combat enemies
G.isPlayerTurn     // turn flow control
G.skillCooldowns{} // {skillId: turnsRemaining}
G.skillCharges{}   // {skillId: chargesRemaining}
```

## Key Utility Functions

```js
roll(d)          // random 1..d
md(stat)         // D&D ability modifier: floor((stat-10)/2)
profFor(lvl)     // proficiency bonus by level
xpFor(lvl)       // XP required for next level
getSpellPower()  // centralized spell power calc — always use this, never compute manually
addOffensiveStat(g, value)  // adds to atk OR magBonus depending on class type
addLog(msg, cls) // appends a message to the combat log
renderAll()      // full UI re-render — call after any state change
```

## Data Conventions

### Items (`ITEMS` array in `data.js`)
```js
{
  id: 'camelCaseId',       // unique, used for lookups
  name: 'Display Name',
  icon: '🗡️',
  type: 'weapon'|'armor'|'helmet'|'boots'|'gloves'|'offhand'|'accessory'|'consumable'|'material',
  slot: 'weapon'|'armor'|'ring'|'offhand'|'helmet'|'boots'|'amulet'|null,
  rarity: 'common'|'uncommon'|'rare'|'epic'|'legendary',
  stats: { atk, def, hp, magAtk, crit, heal },  // only include relevant keys
  value: 50,               // gold sell value
  townOnly: true,          // optional: only available in shop, not dungeon drops
  desc: 'Flavour text.',   // optional: shown for items with special effects
}
```

**Rarity balance guidelines:**
- common: 1-3 stats, low values
- uncommon: 2-4 stats, moderate values, value ~40-60
- rare: 2-4 stats, higher values, value ~140-170
- epic: 3-5 stats, strong values, value ~180-220
- legendary: 3-5 stats, very high values, value ~500-800 (boss drops only)

### Enemies (`ZONES` array in `data.js`)
Each zone has a `enemies[]` array. Enemy schema:
```js
{
  name: 'Enemy Name',
  icon: '👹',
  hp: 40,
  atk: 8,
  def: 3,
  xp: 20,
  gold: 10,
  drop: 'itemId',          // optional loot drop id
  dropChance: 0.3,         // 0.0–1.0
  special: 'poison'|'stun'|'lifesteal'|'shield'|'regen'|...,  // optional ability
  isBoss: true,            // optional, marks as zone boss
}
```

### Classes (`CLASSES` object in `data.js`)
Keys are class IDs. Each class has:
- `baseStats`: `{str, dex, con, int, wis, cha}` — all should be between 8–18
- `baseHp`: base HP before CON modifier
- `resMax` / `spellSlots`: resource pool
- `skills[]`: array of skill definitions
- `talents[]`: talent pool offered on level-up

### Skills
```js
{
  id: 'skillId',
  name: 'Skill Name',
  icon: '⚔️',
  desc: 'What it does.',
  cost: 1,                 // resource cost (or spellSlot level for wizards)
  cooldown: 2,             // optional, turns before reuse
  charges: 3,              // optional, limited uses per combat
  action: 'action'|'bonus'|'reaction',
  fn: (targets) => { /* combat logic */ },
}
```

**Skill function conventions:**
- Read from `G` directly; mutate `G` for state changes
- Call `addLog(msg)` for combat messages
- Call `dealDamage(enemy, amount)` — never reduce `enemy.hp` directly
- Call `applyCondition(target, conditionName, turns)` for status effects
- Call `renderAll()` at the end if the skill doesn't return early

## Caster vs Martial Classes

Always use `CASTER_CLASSES` / `DEX_CLASSES` constants and the helper functions rather than hardcoding class IDs:

```js
const CASTER_CLASSES = ['wizard','cleric','druid'];
const DEX_CLASSES    = ['rogue','ranger'];

// Route a stat bonus correctly:
addOffensiveStat(G, value);   // adds to magBonus for casters, atk for martials
```

For spell damage, always call `getSpellPower()` — never compute spell power inline.

## Adding New Content

### New enemy
1. Find the appropriate zone in `ZONES` in `data.js`
2. Add to `enemies[]` following the schema above
3. Balance: `hp` should scale with zone depth; `xp` ≈ `hp * 0.5`

### New item
1. Add to the correct section of `ITEMS` in `data.js`
2. Assign a unique `id` — search for it first to avoid collisions
3. Add to shop pool or drop table as appropriate

### New class skill / talent
1. Add the skill object to the class's `skills[]` or `talents[]` in `data.js`
2. Implement the `fn` in `combat.js` if it references combat helpers
3. Update `skillCooldowns` / `skillCharges` init in `newState()` in `main.js` if needed

### New condition/status effect
1. Define handler in `combat.js` (search for existing condition handling)
2. Add to `applyCondition` switch and the per-turn tick logic
3. Add display label in `ui.js`

## Pitfalls to Avoid

- **Never bypass `dealDamage()`** — it handles DEF, conditions, death, and logging
- **Never recompute spell power inline** — always call `getSpellPower()`
- **Never add new global variables** for state — use `G.*` properties
- **`G.inventory` is fixed-size (20 slots)** — don't push/pop, use index assignment
- **`renderAll()` must be called after any state mutation** that should be visible
- **`roll(d)` is 1-indexed** — `roll(20)` returns 1–20, not 0–19
- **Cooldowns decrement at start of player turn** — account for this in balance
- **`equipped` slot names differ from `type`** — `ring` slot holds both rings and amulets (check `slot` field, not `type`)

## Coding Style

- Vanilla JS only — no imports, no classes (`class` keyword), no TypeScript
- Short variable names are acceptable (`g`, `e`, `sk`, `idx`)
- Ternary chains are common in the codebase — match existing style
- Keep data in `data.js`, logic in `combat.js`/`main.js`/`town.js`, rendering in `ui.js`
- Comment section headers with `// ══ SECTION ══` style to match existing file structure
