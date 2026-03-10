// ================================================================
// save.js — 3-Slot Save System
// Graces and achievements are per-slot, not global.
// Descent into Eternity
// ================================================================

const SAVE_VERSION = 3;
const SAVE_PREFIX = 'die_save_slot_';
let activeSaveSlot = null;

function getSaveKey(slot){ return SAVE_PREFIX + slot; }

// ══════════════════════════════════════════════════════════
//  SLOT DATA STRUCTURE
//  { version, savedAt, state, graces, achievements, wizardDonations, pendingGraceGold }
// ══════════════════════════════════════════════════════════

function emptySlotData(){
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    state: null,
    graces: { inventory:[], equipped:{} },
    achievements: [],
    wizardDonations: 0,
    pendingGraceGold: 0,
    persistentGold: 0,
    stash: [],
    // Persistent cross-run stats
    bossDefeated: [false,false,false,false,false,false,false,false],
    lifetimeKills: 0,
    lifetimeGold: 0,
    lifetimeCrits: 0,
    lifetimeCrafts: 0,
    lifetimeTime: 0,
    lifetimeRuns: 0,
    // Chroma selections per class
    chromaSelections: {},
    // Lifetime trackers for chroma achievements
    lifetimeFlawlessRogue: 0,
    lifetimeGoldRogue: 0,
    lifetimeSmitesPaladin: 0,
    lifetimeObjectivesRanger: 0,
    lifetimeChannelsCleric: 0,
    lifetimeWildShapeTurnsDruid: 0,
    lifetimePoisonsDruid: 0,
    // Death history — newest first, max 20 entries
    deathHistory: [],
    // Tutorial flags
    _dungeonTutorialShown: false,
    // Unlock system stats (track cross-run milestones for UNLOCKS conditions)
    unlocks: { stats: {} },
  };
}

// ── Core save / load ──────────────────────────────────────

function saveGame(slot){
  slot = slot || activeSaveSlot;
  if(!slot) return false;
  try {
    const existing = loadSlotData(slot) || emptySlotData();
    existing.version = SAVE_VERSION;
    existing.savedAt = Date.now();
    if(G) existing.state = serializeState(G);
    localStorage.setItem(getSaveKey(slot), JSON.stringify(existing));
    activeSaveSlot = slot;
    return true;
  } catch(e){ console.warn('[Save] Failed:', e); return false; }
}

function loadSlotData(slot){
  try {
    const raw = localStorage.getItem(getSaveKey(slot));
    if(!raw) return null;
    const d = JSON.parse(raw);
    if(!d) return null;
    // Migrate older formats
    if(!d.graces)              d.graces = { inventory:[], equipped:{} };
    if(!d.graces.inventory)    d.graces.inventory = [];
    if(!d.graces.equipped)     d.graces.equipped = {};
    if(!d.achievements)        d.achievements = [];
    if(d.wizardDonations===undefined) d.wizardDonations = 0;
    if(d.pendingGraceGold===undefined) d.pendingGraceGold = 0;
    if(d.persistentGold===undefined)   d.persistentGold   = 0;
    if(!d.stash)                        d.stash            = [];
    // Migrate persistent cross-run fields
    if(!d.bossDefeated)        d.bossDefeated = [false,false,false,false,false,false,false,false];
    if(d.lifetimeKills===undefined)  d.lifetimeKills = 0;
    if(d.lifetimeGold===undefined)   d.lifetimeGold = 0;
    if(d.lifetimeCrits===undefined)  d.lifetimeCrits = 0;
    if(d.lifetimeCrafts===undefined) d.lifetimeCrafts = 0;
    if(d.lifetimeTime===undefined)   d.lifetimeTime = 0;
    if(d.lifetimeRuns===undefined)   d.lifetimeRuns = 0;
    // Chroma system migration
    if(!d.chromaSelections)           d.chromaSelections = {};
    if(d.lifetimeFlawlessRogue===undefined)      d.lifetimeFlawlessRogue = 0;
    if(d.lifetimeGoldRogue===undefined)          d.lifetimeGoldRogue = 0;
    if(d.lifetimeSmitesPaladin===undefined)      d.lifetimeSmitesPaladin = 0;
    if(d.lifetimeObjectivesRanger===undefined)   d.lifetimeObjectivesRanger = 0;
    if(d.lifetimeChannelsCleric===undefined)     d.lifetimeChannelsCleric = 0;
    if(d.lifetimeWildShapeTurnsDruid===undefined) d.lifetimeWildShapeTurnsDruid = 0;
    if(d.lifetimePoisonsDruid===undefined)       d.lifetimePoisonsDruid = 0;
    if(!d.deathHistory)                          d.deathHistory = [];
    if(d._dungeonTutorialShown===undefined)      d._dungeonTutorialShown = false;
    // Unlock system migration
    if(!d.unlocks)                               d.unlocks = { stats: {} };
    if(!d.unlocks.stats)                         d.unlocks.stats = {};
    return d;
  } catch(e){ return null; }
}

function loadGameData(slot){
  const d = loadSlotData(slot);
  return (d && d.state) ? d : null;
}

function deleteSave(slot){
  localStorage.removeItem(getSaveKey(slot));
  if(activeSaveSlot === slot) activeSaveSlot = null;
}

// ══════════════════════════════════════════════════════════
//  DEATH HISTORY — tracks fallen heroes per slot
// ══════════════════════════════════════════════════════════

function recordGraveyardEntry(g){
  if(!activeSaveSlot || !g) return;
  const cls  = (typeof CLASSES!=='undefined' && CLASSES[g.classId]) ? CLASSES[g.classId] : null;
  const zone = (typeof ZONES!=='undefined'   && ZONES[g.zoneIdx])   ? ZONES[g.zoneIdx]   : null;
  const bestItem = g.equipped
    ? Object.values(g.equipped).filter(Boolean).sort((a,b)=>{
        const r=['common','uncommon','rare','epic','legendary'];
        return r.indexOf(b.rarity)-r.indexOf(a.rarity);
      })[0]
    : null;
  const entry = {
    ts:           Date.now(),
    className:    cls ? cls.name : (g.classId||'Unknown'),
    subclass:     (g.subclassId && typeof SUBCLASSES!=='undefined' && SUBCLASSES[g.subclassId]) ? SUBCLASSES[g.subclassId].name : null,
    level:        g.level || 1,
    zoneIdx:      g.zoneIdx || 0,
    zoneName:     zone ? zone.name  : 'Unknown',
    zoneNum:      zone ? zone.num   : 1,
    causeOfDeath: g.causeOfDeath || 'Unknown',
    kills:        g.totalKills  || 0,
    gold:         g.totalGold   || 0,
    bossesKilled: g.bossDefeated ? Object.values(g.bossDefeated).filter(Boolean).length : 0,
    playTime:     g.playTime    || 0,
    bestItem:     bestItem ? { icon:bestItem.icon, name:bestItem.name, rarity:bestItem.rarity } : null,
    weapon:       (g.equipped && g.equipped.weapon)
                    ? { icon:g.equipped.weapon.icon, name:g.equipped.weapon.name, id:g.equipped.weapon.id }
                    : null,
  };
  updateSlotData(activeSaveSlot, d=>{
    if(!d.deathHistory) d.deathHistory = [];
    d.deathHistory.unshift(entry);
    if(d.deathHistory.length > 20) d.deathHistory.length = 20;
  });
}

function loadGraveyard(){
  if(!activeSaveSlot) return [];
  const d = loadSlotData(activeSaveSlot);
  return (d && d.deathHistory) ? d.deathHistory : [];
}

function autoSave(){
  if(!activeSaveSlot) return;
  saveGame(activeSaveSlot);
}

// ══════════════════════════════════════════════════════════
//  UNLOCK STAT TRACKING — feeds UNLOCKS conditions in unlocks.js
//  Called from throughout the codebase with typeof guards.
//  Events: boss_kill, zone_clear, zone5_reached, zone8_reached,
//          boss8_beaten, flawless, campfire, death, salvage,
//          level_up, rare_event, farewell, phoenix_revive
// ══════════════════════════════════════════════════════════

function updateUnlockStats(event, data){
  if(!activeSaveSlot) return;
  updateSlotData(activeSaveSlot, d=>{
    if(!d.unlocks) d.unlocks = { stats:{} };
    if(!d.unlocks.stats) d.unlocks.stats = {};
    const s = d.unlocks.stats;
    // Ensure all array stats exist
    if(!s.classesReachedZone5)   s.classesReachedZone5  = [];
    if(!s.classesReachedZone8)   s.classesReachedZone8  = [];
    if(!s.classesBeatenBoss8)    s.classesBeatenBoss8   = [];
    if(!s.uniqueModifiersCleared)s.uniqueModifiersCleared= [];
    // Ensure all counter stats exist
    if(!s.totalRareEvents)       s.totalRareEvents       = 0;
    if(!s.highestLevel)          s.highestLevel          = 0;
    if(!s.zonesWithoutRest)      s.zonesWithoutRest      = 0;
    if(!s.famineZonesCleared)    s.famineZonesCleared    = 0;
    if(!s.totalDeaths)           s.totalDeaths           = 0;
    if(!s.totalSalvages)         s.totalSalvages         = 0;
    if(!s.totalCampfires)        s.totalCampfires        = 0;
    if(s.fastestBossKill===undefined) s.fastestBossKill  = 9999;
    if(!s.mythicZonesCleared)    s.mythicZonesCleared    = 0;
    if(!s.ironmanZones)          s.ironmanZones          = 0;
    if(!s.phoenixRevives)        s.phoenixRevives        = 0;
    if(!s.farewellSeen)          s.farewellSeen          = false;

    switch(event){
      case 'boss_kill':{
        const rounds=(data&&data.rounds)||999;
        if(rounds < s.fastestBossKill) s.fastestBossKill=rounds;
        // Track per-zone modifier info at moment of boss kill (not zone_clear, to avoid double-count)
        if(typeof G!=='undefined'&&G){
          if(G._activeModifier&&G._activeModifier.id){
            if(!s.uniqueModifiersCleared.includes(G._activeModifier.id))
              s.uniqueModifiersCleared.push(G._activeModifier.id);
            // Mythic modifier zone clear
            if(G._activeModifier.id==='mythic') s.mythicZonesCleared++;
            // Famine modifier: any modifier with noGold effect
            if(G._activeModifier.effects&&G._activeModifier.effects.noGold) s.famineZonesCleared++;
          }
          // Zone cleared without resting (G._longRestUsed is reset by showCampfire each visit)
          if(!G._longRestUsed) s.zonesWithoutRest++;
        }
        break;
      }
      case 'zone5_reached':
        if(typeof G!=='undefined'&&G&&G.classId&&!s.classesReachedZone5.includes(G.classId))
          s.classesReachedZone5.push(G.classId);
        break;
      case 'zone8_reached':
        if(typeof G!=='undefined'&&G&&G.classId&&!s.classesReachedZone8.includes(G.classId))
          s.classesReachedZone8.push(G.classId);
        break;
      case 'boss8_beaten':
        if(typeof G!=='undefined'&&G&&G.classId&&!s.classesBeatenBoss8.includes(G.classId))
          s.classesBeatenBoss8.push(G.classId);
        break;
      case 'flawless':
        s.ironmanZones++;
        break;
      case 'campfire':
        s.totalCampfires++;
        break;
      case 'death':
        s.totalDeaths++;
        break;
      case 'salvage':
        s.totalSalvages++;
        break;
      case 'level_up':
        if(typeof G!=='undefined'&&G&&(G.level||0)>s.highestLevel) s.highestLevel=G.level;
        break;
      case 'rare_event':
        s.totalRareEvents++;
        break;
      case 'farewell':
        s.farewellSeen=true;
        break;
      case 'phoenix_revive':
        s.phoenixRevives++;
        break;
    }
  });
}

// ── Check all UNLOCKS conditions; push newly met IDs into slot.achievements ──
function checkUnlocks(){
  if(!activeSaveSlot||typeof UNLOCKS==='undefined') return;
  const d = loadSlotData(activeSaveSlot);
  if(!d) return;
  if(!d.achievements) d.achievements=[];
  let changed=false;
  for(const ul of UNLOCKS){
    if(d.achievements.includes(ul.id)) continue;
    try{
      if(ul.check(d, typeof G!=='undefined'?G:null)){
        d.achievements.push(ul.id);
        changed=true;
        if(typeof log==='function') log('🔓 Unlocked: '+ul.name+'!','s');
      }
    }catch(e){}
  }
  if(changed){
    try{ localStorage.setItem(getSaveKey(activeSaveSlot), JSON.stringify(d)); }catch(e){}
    // Sync into G so map.js modifier gating sees the new unlocks immediately
    if(typeof G!=='undefined'&&G) G.unlockedAchievements=d.achievements.slice();
  }
}

function updateSlotData(slot, fn){
  slot = slot || activeSaveSlot;
  if(!slot) return;
  const data = loadSlotData(slot) || emptySlotData();
  fn(data);
  data.savedAt = Date.now();
  try{ localStorage.setItem(getSaveKey(slot), JSON.stringify(data)); } catch(e){}
}

// ── Serialize: strip mid-combat transient fields ──────────

function serializeState(g){
  // currentEnemy: reference, reconstructed on load
  // _afterLevelUpCallback: function reference — cannot serialize
  // _nethrixShuffleOrder / _auranthosBlindedBtns: render-ephemeral boss flags
  // _dyingFlag: transient death-in-progress sentinel
  const OMIT = new Set([
    'currentEnemy','_dyingFlag',
    '_afterLevelUpCallback',
    '_nethrixShuffleOrder','_auranthosBlindedBtns',
    '_lastParticleZone',
    '_newLootSlots','_lootAnimPending','_singleEnemyDying','_dyingCards',
  ]);
  const copy = {};
  for(const [k,v] of Object.entries(g)){
    if(OMIT.has(k)) continue;
    try{ copy[k] = JSON.parse(JSON.stringify(v)); } catch{ copy[k]=v; }
  }
  copy.currentEnemy = null;   // reference — reconstructed from currentEnemies on load
  copy.isPlayerTurn = true;   // always resume at start of player's turn
  copy.actionUsed   = false;
  copy.bonusUsed    = false;
  copy.reactionUsed = false;
  return copy;
}

// ══════════════════════════════════════════════════════════
//  TITLE SCREEN — 3 slot cards
// ══════════════════════════════════════════════════════════

function renderTitleSaveSlots(){
  const container = document.getElementById('saveSlotsContainer');
  if(!container) return;
  container.innerHTML = '';
  for(let slot = 1; slot <= 3; slot++){
    container.appendChild(buildTitleSlotCard(slot, loadSlotData(slot)));
  }
}

function buildTitleSlotCard(slot, data){
  const card = document.createElement('div');
  card.className = 'title-save-card' + (data ? '' : ' title-save-empty');

  if(data){
    const s        = data.state;
    const achCount = (data.achievements||[]).length;
    const graces   = data.graces || {inventory:[],equipped:{}};
    const allGraces= [...(graces.inventory||[]), ...Object.values(graces.equipped||{}).filter(Boolean)];
    const uniqueIcons = [...new Set(allGraces.map(g=>g.icon))].slice(0,5);
    const adventurerName = data.adventurerName || 'Adventurer';

    // Zone progress — from slot-level bossDefeated (persists across runs)
    const bossDefeated = data.bossDefeated || (s ? s.bossDefeated : []) || [];
    const zonesCleared = bossDefeated.filter(Boolean).length;
    const currentZone  = s ? ((typeof ZONES!=='undefined'&&ZONES[s.zoneIdx]) ? ZONES[s.zoneIdx].name : 'Zone '+(s.zoneIdx+1)) : null;
    const zoneLine     = currentZone ? currentZone : (zonesCleared > 0 ? zonesCleared+' zone'+(zonesCleared>1?'s':'')+' cleared' : 'No runs yet');

    const graceIconsHtml = uniqueIcons.length
      ? `<div class="tsc-grace-icons">${uniqueIcons.map(ic=>`<span class="tsc-grace-pip">${iconHTML(ic)}</span>`).join('')}</div>`
      : '';

    card.innerHTML =
      `<button class="tsc-del-corner" onclick="event.stopPropagation();slotDelete(${slot})" title="Delete slot">✕</button>`+
      `<div class="tsc-card-top">`+
        `<div class="tsc-adventurer-name">${adventurerName}</div>`+
        `<div class="tsc-card-meta">`+
          graceIconsHtml+
          `<span class="tsc-meta-pill">${iconHTML('trophy')} ${allGraces.length}</span>`+
          `<span class="tsc-meta-pill">${iconHTML('trophy')} ${achCount}</span>`+
        `</div>`+
      `</div>`+
      `<div class="tsc-card-bottom">`+
        `<span class="tsc-zone-badge">&#x25BA; ${zoneLine}</span>`+
        `<span class="tsc-open-hint">VIEW ▶</span>`+
      `</div>`;

    card.onclick = () => openSlotDetail(slot);

  } else {
    card.innerHTML =
      `<div class="tsc-empty">— Empty —<br><span style="font-size:9px;">Slot ${slot}</span></div>`+
      `<div class="tsc-start-btn">`+
        `<button class="btn btn-gold tsc-btn" style="width:100%;font-size:7px;" onclick="event.stopPropagation();slotNewRun(${slot})">✦ START RUN</button>`+
      `</div>`;
  }
  return card;
}

// ── Slot detail screen ────────────────────────────────────
let _detailSlot = null;

function openSlotDetail(slot){
  _detailSlot = slot;
  const data = loadSlotData(slot);
  if(!data) return;

  const name = data.adventurerName || 'Adventurer';
  document.getElementById('slotDetailTitle').textContent = name.toUpperCase();

  // Action buttons
  const s = data.state;
  const actEl = document.getElementById('slotDetailActions');
  actEl.innerHTML = s
    ? `<button class="btn btn-gold" style="font-size:8px;" onclick="slotContinue(${slot})">▶ CONTINUE RUN</button>`
    : `<button class="btn" style="border-color:var(--gold-dim);color:var(--gold);font-size:8px;" onclick="slotNewRun(${slot})">↺ NEW RUN</button>`;

  showScreen('slotDetail');
  slotDetailTab('overview', document.querySelector('.sdt-tab'));
}

function slotDetailTab(tab, el){
  document.querySelectorAll('.sdt-tab').forEach(t=>t.classList.remove('active'));
  if(el) el.classList.add('active');
  const data = loadSlotData(_detailSlot);
  const content = document.getElementById('slotDetailContent');
  if(!data){ content.innerHTML=''; return; }

  if(tab==='overview') content.innerHTML = renderSlotOverview(data);
  else if(tab==='graces') content.innerHTML = renderSlotGraces(data);
  else if(tab==='achievements') content.innerHTML = renderSlotAchievements(data);
}

function renderSlotOverview(data){
  const s = data.state;
  // bossDefeated lives on slot level (persists across runs); fall back to run state for old saves
  const bossDefeated = data.bossDefeated || (s ? s.bossDefeated : []) || [];
  const zonesCleared = bossDefeated.filter(Boolean).length;

  // Lifetime stats accumulate on slot; add current run on top if mid-run
  const kills    = (data.lifetimeKills||0)  + (s ? (s.totalKills||0)  : 0);
  const crits    = (data.lifetimeCrits||0)  + (s ? (s.totalCrits||0)  : 0);
  const gold     = (data.lifetimeGold||0)   + (s ? (s.totalGold||0)   : 0);
  const crafts   = (data.lifetimeCrafts||0) + (s ? (s.totalCrafts||0) : 0);
  const time     = (data.lifetimeTime||0)   + (s ? (s.playTime||0)    : 0);
  const timeStr  = (typeof formatPlayTime==='function') ? formatPlayTime(time) : '—';
  const achCount = (data.achievements||[]).length;
  const graces   = data.graces || {inventory:[],equipped:{}};
  const graceCount = (graces.inventory||[]).length + Object.values(graces.equipped||{}).filter(Boolean).length;
  const runs     = data.lifetimeRuns||0;

  const ZONE_NAMES = (typeof ZONES!=='undefined') ? ZONES.map(z=>z.name) : ['Zone 1','Zone 2','Zone 3','Zone 4','Zone 5','Zone 6','Zone 7','Zone 8'];
  const bossHtml = ZONE_NAMES.slice(0,8).map((zn,i)=>{
    const done = !!bossDefeated[i];
    return `<div class="sdo-boss-badge ${done?'cleared':'locked'}">${done?'✓':'·'} ${zn}</div>`;
  }).join('');

  const activeZone = s ? ((typeof ZONES!=='undefined'&&ZONES[s.zoneIdx]) ? ZONES[s.zoneIdx].name : 'Zone '+(s.zoneIdx+1)) : '—';
  const lives = s && s.lives !== undefined ? s.lives : null;
  const livesHtml = lives !== null
    ? Array.from({length:3},(_,i)=>`<span style="font-size:14px;${i>=lives?'filter:grayscale(1) brightness(0.4)':'filter:drop-shadow(0 0 3px rgba(255,60,60,.6))'}">${iconHTML('health')}</span>`).join('')
    : '';

  return `
    <div class="sdo-stat-grid">
      <div class="sdo-stat"><span class="sdo-stat-icon">${iconHTML('crossed-swords')}</span><span class="sdo-stat-val">${kills}</span><span class="sdo-stat-lbl">kills</span></div>
      <div class="sdo-stat"><span class="sdo-stat-icon">${iconHTML('crown')}</span><span class="sdo-stat-val">${zonesCleared}</span><span class="sdo-stat-lbl">bosses</span></div>
      <div class="sdo-stat"><span class="sdo-stat-icon">${iconHTML('explosion')}</span><span class="sdo-stat-val">${crits}</span><span class="sdo-stat-lbl">crits</span></div>
      <div class="sdo-stat"><span class="sdo-stat-icon">${iconHTML('gold-bar')}</span><span class="sdo-stat-val">${gold}</span><span class="sdo-stat-lbl">gold</span></div>
      <div class="sdo-stat"><span class="sdo-stat-icon">${iconHTML('trophy')}</span><span class="sdo-stat-val">${graceCount}</span><span class="sdo-stat-lbl">graces</span></div>
      <div class="sdo-stat"><span class="sdo-stat-icon">${iconHTML('trophy')}</span><span class="sdo-stat-val">${achCount}</span><span class="sdo-stat-lbl">achievements</span></div>
    </div>
    <div style="font-size:11px;color:var(--dim);margin-bottom:12px;">
      ${runs} run${runs!==1?'s':''} completed &nbsp;·&nbsp; ⏱ ${timeStr} played
    </div>
    ${s ? `<div style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--dim);margin-bottom:8px;">
      ACTIVE RUN &nbsp;·&nbsp; 📍 ${activeZone} &nbsp;·&nbsp; LVL ${s.level||1} &nbsp; ${livesHtml}
    </div>` : ''}
    <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--gold-dim);margin-bottom:8px;">ZONES CLEARED</div>
    <div class="sdo-bosses">${bossHtml}</div>
  `;
}

function renderSlotGraces(data){
  // Navigate to the full interactive grace management screen
  slotOpenGraces(_detailSlot);
  return ''; // slotOpenGraces calls showScreen itself
}

function renderSlotAchievements(data){
  const unlocked = new Set(data.achievements||[]);
  const ACHS = (typeof ACHIEVEMENTS!=='undefined') ? ACHIEVEMENTS : [];
  if(!ACHS.length) return `<div class="sdg-empty">No achievement data available</div>`;

  const html = ACHS.map(a=>`
    <div class="sda-card ${unlocked.has(a.id)?'unlocked':'locked'}">
      <span class="sda-icon">${a.icon}</span>
      <div class="sda-info">
        <span class="sda-title">${a.title}</span>
        <span class="sda-desc">${a.desc}</span>
      </div>
    </div>
  `).join('');

  const count = unlocked.size;
  return `
    <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--dim);margin-bottom:14px;">
      ${count} / ${ACHS.length} UNLOCKED
    </div>
    <div class="sda-grid">${html}</div>
  `;
}

// ── Slot actions ──────────────────────────────────────────

function slotContinue(slot){
  const data = loadSlotData(slot);
  if(!data||!data.state) return;
  AUDIO.init();
  activeSaveSlot = slot;
  G = data.state;
  if(G.lives === undefined) G.lives = 3; // migrate old saves
  // Migrate: if subclassUnlocked but no subclassId, default to first subclass
  if(G.subclassUnlocked && !G.subclassId && typeof CLASSES!=='undefined' && CLASSES[G.classId]){
    const ids = CLASSES[G.classId].subclassIds;
    if(ids && ids.length) G.subclassId = ids[0];
  }
  // Migrate old saves missing new equipment slots
  if(!G.equipped) G.equipped = {};
  if(G.equipped.helmet  === undefined) G.equipped.helmet  = null;
  if(G.equipped.gloves  === undefined) G.equipped.gloves  = null;
  if(G.equipped.boots   === undefined) G.equipped.boots   = null;
  if(G.equipped.amulet  === undefined) G.equipped.amulet  = null;
  G.currentEnemy = null;
  G.isPlayerTurn = true;
  G.actionUsed   = false;
  G.bonusUsed    = false;
  G.reactionUsed = false;
  G._dyingFlag   = false;
  // Seed achievement cache so we don't re-toast already-unlocked achievements
  G.unlockedAchievements = data.achievements || [];
  // Restore chroma if missing from serialized state (migration for pre-chroma saves)
  if(!G._activeChroma && data.chromaSelections && data.chromaSelections[G.classId]){
    G._activeChroma = data.chromaSelections[G.classId];
  }
  if(typeof CLASSES!=='undefined'&&CLASSES[G.classId]&&!G.skillCharges){
    G.skillCharges = Object.fromEntries(
      CLASSES[G.classId].skills.filter(sk=>sk.charges).map(sk=>[sk.id,sk.charges])
    );
  }
  if(G._inTown){
    // Player was in Elderfen — restore town
    if(typeof fadeToScreen==='function'){
      fadeToScreen('town',()=>{ if(typeof showTownHub==='function') showTownHub(); });
    } else if(typeof showTownHub==='function'){
      showTownHub();
    }
    if(typeof startPlayTimer==='function') startPlayTimer();
    AUDIO.playBGM('campfire');
    if(typeof log==='function') log('✦ Welcome back to Elderfen.','l');
  } else {
    showScreen('game');
    setTimeout(function(){
      // Reconstruct currentEnemy BEFORE renderAll() so rendering functions
      // have a valid reference — otherwise renderEnemyArea shows null fallback
      const living = G.currentEnemies && G.currentEnemies.filter(e=>!e.dead&&e.hp>0);
      if(living && living.length > 0){
        G.currentEnemy = living.find(e=>e.isBoss) || living[0];
        G.targetIdx    = G.currentEnemies.indexOf(G.currentEnemy);
      }
      if(typeof renderAll==='function')      renderAll();
      if(typeof renderHud==='function')      renderHud();
      if(typeof updateCampBtn==='function')  updateCampBtn();
      if(typeof setupGameUI==='function')    setupGameUI();
      if(typeof startPlayTimer==='function') startPlayTimer();
      if(typeof log==='function') log('&#x2736; Welcome back, adventurer.','l');
      if(living && living.length > 0){
        AUDIO.playBGM(living.some(e=>e.isBoss) ? 'boss' : 'dungeon');
        if(typeof renderEnemyArea==='function') renderEnemyArea();
        if(typeof setPlayerTurn==='function')   setPlayerTurn(true);
      } else {
        // No saved combat — spawn the next encounter normally
        AUDIO.playBGM('dungeon');
        if(typeof spawnEnemy==='function') spawnEnemy();
      }
    }, 100);
  }
}

// _pendingNewRunSlot holds slot number while waiting for name input
let _pendingNewRunSlot = null;

function slotNewRun(slot){
  const data = loadSlotData(slot);
  if(data&&data.state){
    showGenericConfirm(
      'START A NEW RUN?',
      'Slot '+slot+': your current run will be lost. Graces and achievements are kept.',
      '⚔ NEW RUN',
      ()=>{ updateSlotData(slot, d=>{ d.state = null; }); _slotNewRunContinue(slot); }
    );
    return;
  }
  _slotNewRunContinue(slot);
}
function _slotNewRunContinue(slot){
  const data = loadSlotData(slot);
  // First time creating this slot — ask for adventurer name
  const needsName = !data || !data.adventurerName;
  if(needsName){
    _pendingNewRunSlot = slot;
    if(!data) updateSlotData(slot, ()=>{});
    const inp = document.getElementById('adventurerNameInput');
    if(inp) inp.value = '';
    openOverlay('namePromptOverlay');
    setTimeout(()=>{ const i=document.getElementById('adventurerNameInput'); if(i) i.focus(); }, 100);
    return;
  }
  activeSaveSlot = slot;
  // Go straight to town — player picks class at the dungeon gate
  if(typeof showGameIntro==='function'){
    if(typeof G!=='undefined') G = null;
    showGameIntro(()=>{ if(typeof showTownHub==='function') showTownHub(); });
  } else {
    if(typeof showTownHub==='function') showTownHub();
  }
}

function confirmAdventurerName(){
  const inp = document.getElementById('adventurerNameInput');
  const name = (inp ? inp.value.trim() : '') || 'Adventurer';
  const slot = _pendingNewRunSlot;
  if(!slot) return;
  updateSlotData(slot, d=>{ d.adventurerName = name; });
  closeOverlay('namePromptOverlay');
  _pendingNewRunSlot = null;
  activeSaveSlot = slot;
  // Go straight to town — player picks class at the dungeon gate
  if(typeof showGameIntro==='function'){
    if(typeof G!=='undefined') G = null;
    showGameIntro(()=>{ if(typeof showTownHub==='function') showTownHub(); });
  } else {
    if(typeof showTownHub==='function') showTownHub();
  }
}

function slotDelete(slot){
  if(!loadSlotData(slot)) return;
  showGenericConfirm(
    'DELETE SLOT '+slot+'?',
    'This removes ALL data including graces and achievements. This cannot be undone.',
    '🗑 DELETE',
    ()=>{ deleteSave(slot); renderTitleSaveSlots(); }
  );
}

function slotOpenGraces(slot){
  if(!loadSlotData(slot)) updateSlotData(slot, ()=>{});
  activeSaveSlot    = slot;
  _graceSelectedId  = null;
  _graceManageClass = null;
  renderGraceScreen();
  showScreen('graces');
}

// ══════════════════════════════════════════════════════════
//  WIZARD DONATIONS — per slot
// ══════════════════════════════════════════════════════════

function getWizardDonations(){
  if(!activeSaveSlot) return 0;
  const data = loadSlotData(activeSaveSlot);
  return (data&&data.wizardDonations) ? data.wizardDonations : 0;
}

function addWizardDonation(amount){
  if(!activeSaveSlot) return 0;
  let total = 0;
  updateSlotData(activeSaveSlot, d=>{
    d.wizardDonations = (d.wizardDonations||0)+amount;
    total = d.wizardDonations;
  });
  return total;
}

// ── Persistent Gold — survives between runs ───────────────

function getPersistentGold(slot){
  slot = slot || activeSaveSlot;
  if(!slot) return 0;
  const data = loadSlotData(slot);
  return (data && data.persistentGold) ? data.persistentGold : 0;
}

function addPersistentGold(amount, slot){
  slot = slot || activeSaveSlot;
  if(!slot || amount <= 0) return;
  updateSlotData(slot, d=>{ d.persistentGold = (d.persistentGold||0) + amount; });
}

function spendPersistentGold(amount, slot){
  slot = slot || activeSaveSlot;
  if(!slot) return false;
  let ok = false;
  updateSlotData(slot, d=>{
    if((d.persistentGold||0) >= amount){
      d.persistentGold -= amount;
      ok = true;
    }
  });
  return ok;
}

// ── Permanent Upgrades — Proving Grounds ──────────────────

const PERMANENT_UPGRADES = [
  // Universal
  {id:'hp_bonus',     name:'Vitality',        icon:'❤️', desc:'+3 Max HP per level',              category:'universal', maxLvl:5, baseCost:30,  costScale:1.5},
  {id:'atk_bonus',    name:'Might',           icon:'⚔️', desc:'+1 ATK per level',                 category:'universal', maxLvl:5, baseCost:40,  costScale:1.5},
  {id:'def_bonus',    name:'Fortitude',       icon:'🛡️', desc:'+1 DEF per level',                 category:'universal', maxLvl:5, baseCost:40,  costScale:1.5},
  {id:'gold_bonus',   name:'Fortune',         icon:'🪙', desc:'+10 starting gold per level',       category:'universal', maxLvl:3, baseCost:25,  costScale:1.4},
  {id:'potion_bonus', name:'Alchemist',       icon:'🧪', desc:'+1 starting potion per level',      category:'universal', maxLvl:3, baseCost:35,  costScale:1.5},
  {id:'xp_bonus',     name:'Scholar',         icon:'📚', desc:'+5% XP per level',                  category:'universal', maxLvl:3, baseCost:50,  costScale:1.6},
  {id:'crit_bonus',   name:'Precision',       icon:'🎯', desc:'+1 crit range',                     category:'universal', maxLvl:1, baseCost:60,  costScale:1.8},
  {id:'campfire_heal',name:'Restful',         icon:'🔥', desc:'+5% campfire healing per level',    category:'universal', maxLvl:3, baseCost:30,  costScale:1.4},
  {id:'shop_discount',name:'Haggler',         icon:'💬', desc:'5% shop discount per level',        category:'universal', maxLvl:3, baseCost:40,  costScale:1.5},
  {id:'grace_luck',   name:'Grace Affinity',  icon:'✨', desc:'Higher rarity grace drops per level',category:'universal', maxLvl:3, baseCost:80,  costScale:2.0},
  // Class masteries
  {id:'fighter_mastery',  name:'Fighter Mastery',  icon:'⚔️', desc:'+3 ATK, +10 HP',    category:'class', forClass:'fighter',  maxLvl:1, baseCost:100, costScale:1},
  {id:'wizard_mastery',   name:'Wizard Mastery',   icon:'📖', desc:'+5 MAG, +1 slot',   category:'class', forClass:'wizard',   maxLvl:1, baseCost:100, costScale:1},
  {id:'rogue_mastery',    name:'Rogue Mastery',    icon:'🗡️', desc:'+3 ATK, +2 crit',   category:'class', forClass:'rogue',    maxLvl:1, baseCost:100, costScale:1},
  {id:'paladin_mastery',  name:'Paladin Mastery',  icon:'✝',  desc:'+2 ATK, +2 DEF, +10 HP', category:'class', forClass:'paladin',  maxLvl:1, baseCost:100, costScale:1},
  {id:'ranger_mastery',   name:'Ranger Mastery',   icon:'🏹', desc:'+3 ATK, +1 crit, +5 HP', category:'class', forClass:'ranger',   maxLvl:1, baseCost:100, costScale:1},
  {id:'barbarian_mastery',name:'Barbarian Mastery', icon:'🪓', desc:'+4 ATK, +15 HP',        category:'class', forClass:'barbarian',maxLvl:1, baseCost:100, costScale:1},
  {id:'cleric_mastery',   name:'Cleric Mastery',   icon:'☀',  desc:'+4 MAG, +15 HP',         category:'class', forClass:'cleric',   maxLvl:1, baseCost:100, costScale:1},
  {id:'druid_mastery',    name:'Druid Mastery',    icon:'🌿', desc:'+3 MAG, +2 DEF, +10 HP', category:'class', forClass:'druid',    maxLvl:1, baseCost:100, costScale:1},
];

function getPermanentUpgrades(slot){
  slot = slot || activeSaveSlot;
  if(!slot) return {};
  const data = loadSlotData(slot);
  return (data && data.permanentUpgrades) ? data.permanentUpgrades : {};
}

function getUpgradeCost(upgradeId, currentLvl){
  const u = PERMANENT_UPGRADES.find(up=>up.id===upgradeId);
  if(!u) return Infinity;
  return Math.floor(u.baseCost * Math.pow(u.costScale, currentLvl||0));
}

function purchaseUpgrade(upgradeId, slot){
  slot = slot || activeSaveSlot;
  if(!slot) return false;
  const u = PERMANENT_UPGRADES.find(up=>up.id===upgradeId);
  if(!u) return false;
  const ups = getPermanentUpgrades(slot);
  const curLvl = ups[upgradeId]||0;
  if(curLvl >= u.maxLvl) return false;
  const cost = getUpgradeCost(upgradeId, curLvl);

  // Try run gold first (if in town mid-run), else persistent gold
  let paid = false;
  if(typeof G!=='undefined' && G && G.gold >= cost){
    G.gold -= cost;
    paid = true;
  } else {
    paid = spendPersistentGold(cost, slot);
  }
  if(!paid) return false;

  updateSlotData(slot, d=>{
    if(!d.permanentUpgrades) d.permanentUpgrades = {};
    d.permanentUpgrades[upgradeId] = (d.permanentUpgrades[upgradeId]||0) + 1;
  });
  // Live-apply if in a run
  if(typeof G!=='undefined' && G){
    if(upgradeId==='hp_bonus'){G.maxHp+=3;G.hp=Math.min(G.maxHp,G.hp+3);}
    if(upgradeId==='atk_bonus'){if(typeof addOffensiveStat==='function')addOffensiveStat(G,1);else G.atk+=1;}
    if(upgradeId==='def_bonus') G.def+=1;
    if(upgradeId==='crit_bonus') G.critBonus=(G.critBonus||0)+1;
    if(typeof renderAll==='function') renderAll();
  }
  return true;
}

// ── Stash — persistent item storage between runs ──────────

const STASH_MAX = 40;

function getStash(slot){
  slot = slot || activeSaveSlot;
  if(!slot) return [];
  const data = loadSlotData(slot);
  return (data && data.stash) ? data.stash : [];
}

function addToStash(item, slot){
  slot = slot || activeSaveSlot;
  if(!slot || !item) return false;
  let ok = false;
  updateSlotData(slot, d=>{
    if(!d.stash) d.stash = [];
    if(d.stash.length >= STASH_MAX) return;
    d.stash.push({...item, qty: item.qty||1});
    ok = true;
  });
  return ok;
}

function removeFromStash(idx, slot){
  slot = slot || activeSaveSlot;
  if(!slot) return null;
  let removed = null;
  updateSlotData(slot, d=>{
    if(!d.stash || idx < 0 || idx >= d.stash.length) return;
    removed = d.stash.splice(idx, 1)[0];
  });
  return removed;
}

function setStash(items, slot){
  slot = slot || activeSaveSlot;
  if(!slot) return;
  updateSlotData(slot, d=>{ d.stash = items.slice(0, STASH_MAX); });
}

function getShopTier(){
  const d = getWizardDonations();
  if(d>=2500) return 3;
  if(d>=650)  return 2;
  return 1;
}

function getShopTierRarities(){
  const t = getShopTier();
  if(t>=3) return ['common','uncommon','rare','epic','legendary'];
  if(t>=2) return ['common','uncommon','rare'];
  return ['common','uncommon'];
}


// ══════════════════════════════════════════════════════════
//  GRACE CATALOG — Unique class-specific graces
// ══════════════════════════════════════════════════════════

const ALL_CLASSES = ['fighter','wizard','rogue','paladin','ranger','barbarian','cleric','druid'];
const CLASS_ICONS_MAP = {fighter:'⚔',wizard:'📖',rogue:'🗡',paladin:'✝',ranger:'🏹',barbarian:'🩸',cleric:'☀',druid:'🌿'};

// 3 generic equip slots per class (no type restriction)
const CLASS_GRACE_SLOTS = {
  fighter:   [{},{},{}],
  wizard:    [{},{},{}],
  rogue:     [{},{},{}],
  paladin:   [{},{},{}],
  ranger:    [{},{},{}],
  barbarian: [{},{},{}],
  cleric:    [{},{},{}],
  druid:     [{},{},{}],
};

const GRACE_RARITY_COLORS = {
  uncommon:'var(--green2)', rare:'var(--blue2)', epic:'#9b54bd', legendary:'var(--gold)'
};
const GRACE_SELL_VALUES = { uncommon:10, rare:30, epic:60, legendary:100 };

// ── Master grace catalog ────────────────────────────────────
// Each entry is a template. Drops clone it with a unique instance id.
const GRACES = [

  // ═══════════════════════════════════════
  //  FIGHTER — 10 exclusive
  // ═══════════════════════════════════════
  {templateId:'drillmaster_crest',name:"Drillmaster's Crest",icon:'🎖️', rarity:'uncommon',
   desc:'+5 ATK, +5 HP',        classes:['fighter'],
   stats:{atk:3, hp:3}},
  {templateId:'steel_sinew',     name:'Steel Sinew',        icon:'💪', rarity:'uncommon',
   desc:'+3 ATK, +4 DEF, +2 crit', classes:['fighter'],
   stats:{atk:2, def:3, crit:1}},
  {templateId:'vanguard_grit',   name:'Vanguard Grit',      icon:'🪨', rarity:'uncommon',
   desc:'+3 ATK, +5 DEF, +4 HP', classes:['fighter'],
   stats:{atk:2, def:3, hp:3}},
  {templateId:'champion_crest',  name:"Champion's Crest",   icon:'🏅', rarity:'uncommon',
   desc:'+4 ATK, +2 crit, +3 HP', classes:['fighter'],
   stats:{atk:3, crit:1, hp:2}},
  {templateId:'commanders_plate',name:"Commander's Plate",  icon:'🪖', rarity:'rare',
   desc:'+6 ATK, +8 DEF',       classes:['fighter'],
   stats:{atk:4, def:5}},
  {templateId:'battle_tempo',    name:'Battle Tempo',       icon:'🥁', rarity:'rare',
   desc:'+7 ATK, +3 crit, +8 HP', classes:['fighter'],
   stats:{atk:5, crit:2, hp:5}},
  {templateId:'warhorn_shard',   name:'Warhorn Shard',      icon:'📯', rarity:'rare',
   desc:'+9 ATK, +5 HP',        classes:['fighter'],
   stats:{atk:6, hp:3}},
  {templateId:'ironclad_discipline',name:'Ironclad Discipline',icon:'🔩', rarity:'rare',
   desc:'+7 ATK, +6 DEF, +5 HP', classes:['fighter'],
   stats:{atk:5, def:4, hp:3}},
  {templateId:'warlord_heart',   name:"Warlord's Heart",    icon:'👑', rarity:'epic',
   desc:'+14 ATK, +8 DEF, +4 crit', classes:['fighter'],
   stats:{atk:9, def:5, crit:3}},
  {templateId:'immortal_aegis',  name:'Immortal Aegis',     icon:'🛡️', rarity:'legendary',
   desc:'+10 ATK, +15 DEF — 10% chance to fully block attacks',
   classes:['fighter'],
   stats:{atk:7, def:10},
   passive:{id:'aegis', desc:'10% chance to fully block an incoming attack', icon:'🛡️'}},

  // ═══════════════════════════════════════
  //  WIZARD — 10 exclusive
  // ═══════════════════════════════════════
  {templateId:'scholars_focus',  name:"Scholar's Focus",    icon:'📚', rarity:'uncommon',
   desc:'+5 spell power, +1 crit', classes:['wizard'],
   stats:{magAtk:3, crit:1}},
  {templateId:'runic_quill',     name:'Runic Quill',        icon:'🪶', rarity:'uncommon',
   desc:'+4 spell power, +3 DEF', classes:['wizard'],
   stats:{magAtk:3, def:2}},
  {templateId:'void_ink',        name:'Void Ink',           icon:'🖋️', rarity:'uncommon',
   desc:'+5 spell power, +5 HP', classes:['wizard'],
   stats:{magAtk:3, hp:3}},
  {templateId:'spell_weave',     name:'Spell Weave',        icon:'🌀', rarity:'rare',
   desc:'+10 spell power, +2 crit', classes:['wizard'],
   stats:{magAtk:7, crit:1}},
  {templateId:'astral_prism',    name:'Astral Prism',       icon:'🔷', rarity:'rare',
   desc:'+9 spell power, +3 crit', classes:['wizard'],
   stats:{magAtk:6, crit:2}},
  {templateId:'tome_of_echoes',  name:'Tome of Echoes',     icon:'📕', rarity:'rare',
   desc:'+7 spell power, +5 DEF, +6 HP', classes:['wizard'],
   stats:{magAtk:5, def:3, hp:4}},
  {templateId:'sigil_stone',     name:'Sigil Stone',        icon:'🔴', rarity:'rare',
   desc:'+10 spell power, +4 DEF', classes:['wizard'],
   stats:{magAtk:7, def:3}},
  {templateId:'focus_orb',       name:'Focus Orb',          icon:'🔵', rarity:'rare',
   desc:'+9 spell power, +2 crit, +3 DEF', classes:['wizard'],
   stats:{magAtk:6, crit:1, def:2}},
  {templateId:'nexus_power',     name:'Nexus of Power',     icon:'💠', rarity:'epic',
   desc:'+16 spell power, +4 crit', classes:['wizard'],
   stats:{magAtk:10, crit:3}},
  {templateId:'chrono_shard',    name:'Chrono Shard',       icon:'⏳', rarity:'legendary',
   desc:'+20 spell power, +3 crit — 15% chance spells are free',
   classes:['wizard'],
   stats:{magAtk:13, crit:2},
   passive:{id:'spellflame', desc:'15% chance spells don\'t consume a spell slot', icon:'✨'}},

  // ═══════════════════════════════════════
  //  ROGUE — 10 exclusive
  // ═══════════════════════════════════════
  {templateId:'thieves_knuckle', name:"Thief's Knuckle",    icon:'🤜', rarity:'uncommon',
   desc:'+5 ATK, +1 crit',      classes:['rogue'],
   stats:{atk:3, crit:1}},
  {templateId:'loaded_dice',     name:'Loaded Dice',        icon:'🎲', rarity:'uncommon',
   desc:'+3 ATK, +3 crit',      classes:['rogue'],
   stats:{atk:2, crit:2}},
  {templateId:'silent_sole',     name:'Silent Sole',        icon:'👟', rarity:'uncommon',
   desc:'+4 ATK, +4 DEF',       classes:['rogue'],
   stats:{atk:3, def:3}},
  {templateId:'marked_coin',     name:'Marked Coin',        icon:'🪙', rarity:'uncommon',
   desc:'+4 ATK, +2 DEF, +2 crit', classes:['rogue'],
   stats:{atk:3, def:1, crit:1}},
  {templateId:'venom_edge',      name:'Venom Edge',         icon:'☠️', rarity:'rare',
   desc:'+8 ATK, +4 crit',      classes:['rogue'],
   stats:{atk:5, crit:3}},
  {templateId:'lockpick_set',    name:'Masterwork Lockpick', icon:'🔑', rarity:'rare',
   desc:'+7 ATK, +5 crit',      classes:['rogue'],
   stats:{atk:5, crit:3}},
  {templateId:'garrote_wire',    name:'Garrote Wire',       icon:'🪢', rarity:'rare',
   desc:'+9 ATK, +2 crit, +4 HP', classes:['rogue'],
   stats:{atk:6, crit:1, hp:3}},
  {templateId:'widow_fang',      name:'Widow Fang',         icon:'🕷️', rarity:'rare',
   desc:'+8 ATK, +3 crit, +3 DEF', classes:['rogue'],
   stats:{atk:5, crit:2, def:2}},
  {templateId:'phantom_shroud',  name:'Phantom Shroud',     icon:'👤', rarity:'epic',
   desc:'+12 ATK, +6 crit',     classes:['rogue'],
   stats:{atk:8, crit:4}},
  {templateId:'first_blade',     name:'The First Blade',    icon:'🗡️', rarity:'legendary',
   desc:'+15 ATK, +8 crit — first attack each fight deals double',
   classes:['rogue'],
   stats:{atk:10, crit:5},
   passive:{id:'firstblade', desc:'First attack each fight deals double damage', icon:'🗡️'}},

  // ═══════════════════════════════════════
  //  PALADIN — 10 exclusive
  // ═══════════════════════════════════════
  {templateId:'templar_seal',    name:'Templar Seal',       icon:'🔰', rarity:'uncommon',
   desc:'+4 ATK, +3 spell power', classes:['paladin'],
   stats:{atk:3, magAtk:2}},
  {templateId:'oath_ring',       name:'Oath Ring',          icon:'💍', rarity:'uncommon',
   desc:'+3 DEF, +4 spell power, +6 HP', classes:['paladin'],
   stats:{def:2, magAtk:3, hp:4}},
  {templateId:'zealots_flame',   name:"Zealot's Flame",     icon:'🕯️', rarity:'uncommon',
   desc:'+4 ATK, +4 spell power, +3 HP', classes:['paladin'],
   stats:{atk:3, magAtk:3, hp:2}},
  {templateId:'sacred_oath',     name:'Sacred Oath',        icon:'📜', rarity:'rare',
   desc:'+7 ATK, +5 spell power', classes:['paladin'],
   stats:{atk:5, magAtk:3}},
  {templateId:'smite_brand',     name:'Smite Brand',        icon:'⚡', rarity:'rare',
   desc:'+8 ATK, +4 spell power, +2 crit', classes:['paladin'],
   stats:{atk:5, magAtk:3, crit:1}},
  {templateId:'martyrs_shield',  name:"Martyr's Shield",    icon:'🛡️', rarity:'rare',
   desc:'+5 ATK, +7 DEF, +12 HP', classes:['paladin'],
   stats:{atk:3, def:5, hp:8}},
  {templateId:'dawn_signet',     name:'Dawn Signet',        icon:'🌤️', rarity:'rare',
   desc:'+6 ATK, +6 spell power, +2 crit', classes:['paladin'],
   stats:{atk:4, magAtk:4, crit:1}},
  {templateId:'oathkeeper_seal', name:"Oathkeeper's Seal",  icon:'🔱', rarity:'rare',
   desc:'+6 ATK, +5 spell power, +8 HP', classes:['paladin'],
   stats:{atk:4, magAtk:3, hp:5}},
  {templateId:'divine_champion', name:'Divine Champion',    icon:'👼', rarity:'epic',
   desc:'+10 ATK, +10 DEF, +15 HP', classes:['paladin'],
   stats:{atk:7, def:7, hp:10}},
  {templateId:'infinite_word',   name:'The Infinite Word',  icon:'📖', rarity:'legendary',
   desc:'+8 ATK, +8 spell power, +20 HP — +10% all healing',
   classes:['paladin'],
   stats:{atk:5, magAtk:5, hp:13},
   passive:{id:'infword', desc:'+10% to all healing received', icon:'📖'}},

  // ═══════════════════════════════════════
  //  RANGER — 10 exclusive
  // ═══════════════════════════════════════
  {templateId:'eagle_eye',       name:'Eagle Eye',          icon:'🦅', rarity:'uncommon',
   desc:'+4 ATK, +3 crit',      classes:['ranger'],
   stats:{atk:3, crit:2}},
  {templateId:'fletchers_mark',  name:"Fletcher's Mark",    icon:'🏹', rarity:'uncommon',
   desc:'+5 ATK, +2 crit',      classes:['ranger'],
   stats:{atk:3, crit:1}},
  {templateId:'predator_sense',  name:'Predator Sense',     icon:'🐺', rarity:'uncommon',
   desc:'+4 ATK, +3 DEF, +4 HP', classes:['ranger'],
   stats:{atk:3, def:2, hp:3}},
  {templateId:'quiver_charm',    name:'Quiver Charm',       icon:'🧿', rarity:'uncommon',
   desc:'+4 ATK, +2 DEF, +2 crit', classes:['ranger'],
   stats:{atk:3, def:1, crit:1}},
  {templateId:'stalker_mark',    name:"Stalker's Mark",     icon:'🎯', rarity:'rare',
   desc:'+8 ATK, +4 crit',      classes:['ranger'],
   stats:{atk:5, crit:3}},
  {templateId:'windrunner',      name:'Windrunner',         icon:'💨', rarity:'rare',
   desc:'+6 ATK, +4 DEF, +3 crit', classes:['ranger'],
   stats:{atk:4, def:3, crit:2}},
  {templateId:'hawks_talon',     name:"Hawk's Talon",       icon:'🦅', rarity:'rare',
   desc:'+9 ATK, +3 crit, +5 HP', classes:['ranger'],
   stats:{atk:6, crit:2, hp:3}},
  {templateId:'trap_masters_eye',name:"Trap Master's Eye",  icon:'👁️', rarity:'rare',
   desc:'+7 ATK, +5 DEF, +2 crit', classes:['ranger'],
   stats:{atk:5, def:3, crit:1}},
  {templateId:'deadeye',         name:'Deadeye',            icon:'🎯', rarity:'epic',
   desc:'+13 ATK, +7 crit',     classes:['ranger'],
   stats:{atk:8, crit:5}},
  {templateId:'prime_arcanum',   name:'Prime Arcanum',      icon:'💎', rarity:'legendary',
   desc:'+12 ATK, +6 crit — crits restore 1 resource',
   classes:['ranger'],
   stats:{atk:8, crit:4},
   passive:{id:'arcanum', desc:'Critical hits restore 1 resource point', icon:'💎'}},

  // ═══════════════════════════════════════
  //  BARBARIAN — 10 exclusive
  // ═══════════════════════════════════════
  {templateId:'rage_shard',      name:'Rage Shard',         icon:'🔥', rarity:'uncommon',
   desc:'+4 ATK, +8 HP',        classes:['barbarian'],
   stats:{atk:3, hp:5}},
  {templateId:'bone_tusk',       name:'Bone Tusk',          icon:'🦴', rarity:'uncommon',
   desc:'+5 ATK, +1 crit',      classes:['barbarian'],
   stats:{atk:3, crit:1}},
  {templateId:'savage_totem',    name:'Savage Totem',       icon:'🗿', rarity:'uncommon',
   desc:'+3 ATK, +3 DEF, +6 HP', classes:['barbarian'],
   stats:{atk:2, def:2, hp:4}},
  {templateId:'war_paint',       name:'War Paint',          icon:'🎨', rarity:'rare',
   desc:'+8 ATK, +10 HP',       classes:['barbarian'],
   stats:{atk:5, hp:7}},
  {templateId:'berserker_fury',  name:"Berserker's Fury",   icon:'💢', rarity:'rare',
   desc:'+10 ATK, +2 crit',     classes:['barbarian'],
   stats:{atk:7, crit:1}},
  {templateId:'blood_frenzy',    name:'Blood Frenzy',       icon:'🩸', rarity:'rare',
   desc:'+10 ATK, +3 crit',     classes:['barbarian'],
   stats:{atk:7, crit:2}},
  {templateId:'gore_tooth',      name:'Gore Tooth',         icon:'🐗', rarity:'rare',
   desc:'+9 ATK, +3 crit, +5 HP', classes:['barbarian'],
   stats:{atk:6, crit:2, hp:3}},
  {templateId:'primal_howl',     name:'Primal Howl',        icon:'🐺', rarity:'rare',
   desc:'+8 ATK, +4 DEF, +6 HP', classes:['barbarian'],
   stats:{atk:5, def:3, hp:4}},
  {templateId:'skull_trophy',    name:'Skull Trophy',       icon:'💀', rarity:'epic',
   desc:'+16 ATK, +4 crit',     classes:['barbarian'],
   stats:{atk:10, crit:3}},
  {templateId:'the_unbroken',    name:'The Unbroken',       icon:'💪', rarity:'legendary',
   desc:'+12 ATK, +12 DEF — below 25% HP: +50% DEF',
   classes:['barbarian'],
   stats:{atk:8, def:8},
   passive:{id:'unbroken', desc:'Below 25% HP: +50% DEF', icon:'💪'}},

  // ═══════════════════════════════════════
  //  CLERIC — 10 exclusive
  // ═══════════════════════════════════════
  {templateId:'prayer_beads',    name:'Prayer Beads',       icon:'📿', rarity:'uncommon',
   desc:'+5 spell power, +8 HP', classes:['cleric'],
   stats:{magAtk:3, hp:5}},
  {templateId:'censer_ash',      name:'Censer Ash',         icon:'🪔', rarity:'uncommon',
   desc:'+5 spell power, +4 DEF', classes:['cleric'],
   stats:{magAtk:3, def:3}},
  {templateId:'pilgrim_talisman',name:"Pilgrim's Talisman", icon:'🧿', rarity:'uncommon',
   desc:'+3 spell power, +3 DEF, +6 HP', classes:['cleric'],
   stats:{magAtk:2, def:2, hp:4}},
  {templateId:'divine_conduit',  name:'Divine Conduit',     icon:'⚡', rarity:'rare',
   desc:'+10 spell power, +6 DEF', classes:['cleric'],
   stats:{magAtk:7, def:4}},
  {templateId:'sanctified_light',name:'Sanctified Light',   icon:'🌅', rarity:'rare',
   desc:'+8 spell power, +12 HP', classes:['cleric'],
   stats:{magAtk:5, hp:8}},
  {templateId:'hallowed_tome',   name:'Hallowed Tome',      icon:'📖', rarity:'rare',
   desc:'+9 spell power, +2 crit, +8 HP', classes:['cleric'],
   stats:{magAtk:6, crit:1, hp:5}},
  {templateId:'reliquary_bone',  name:'Reliquary Bone',     icon:'🦴', rarity:'rare',
   desc:'+7 spell power, +8 DEF, +5 HP', classes:['cleric'],
   stats:{magAtk:5, def:5, hp:3}},
  {templateId:'sacred_water',    name:'Sacred Water',       icon:'💧', rarity:'rare',
   desc:'+9 spell power, +2 crit, +6 HP', classes:['cleric'],
   stats:{magAtk:6, crit:1, hp:4}},
  {templateId:'miracle_worker',  name:'Miracle Worker',     icon:'✨', rarity:'epic',
   desc:'+14 spell power, +10 DEF, +3 crit', classes:['cleric'],
   stats:{magAtk:9, def:7, crit:2}},
  {templateId:'eternal_bastion', name:'Eternal Bastion',    icon:'❤️', rarity:'legendary',
   desc:'+12 spell power, +10 DEF, +20 HP — regen 2 HP/turn',
   classes:['cleric'],
   stats:{magAtk:8, def:7, hp:13},
   passive:{id:'bastion', desc:'Regenerate 2 HP per turn', icon:'❤️'}},

  // ═══════════════════════════════════════
  //  DRUID — 10 exclusive
  // ═══════════════════════════════════════
  {templateId:'nature_seed',     name:"Nature's Seed",      icon:'🌱', rarity:'uncommon',
   desc:'+4 spell power, +4 DEF', classes:['druid'],
   stats:{magAtk:3, def:3}},
  {templateId:'moonwell_shard',  name:'Moonwell Shard',     icon:'🌙', rarity:'uncommon',
   desc:'+5 spell power, +6 HP', classes:['druid'],
   stats:{magAtk:3, hp:4}},
  {templateId:'bark_talisman',   name:'Bark Talisman',      icon:'🪵', rarity:'uncommon',
   desc:'+3 spell power, +5 DEF', classes:['druid'],
   stats:{magAtk:2, def:3}},
  {templateId:'feral_claw',      name:'Feral Claw',         icon:'🐾', rarity:'uncommon',
   desc:'+4 spell power, +2 crit, +3 HP', classes:['druid'],
   stats:{magAtk:3, crit:1, hp:2}},
  {templateId:'wild_growth',     name:'Wild Growth',        icon:'🌿', rarity:'rare',
   desc:'+8 spell power, +8 DEF', classes:['druid'],
   stats:{magAtk:5, def:5}},
  {templateId:'stormcaller_root',name:'Stormcaller Root',   icon:'⛈️', rarity:'rare',
   desc:'+9 spell power, +3 crit', classes:['druid'],
   stats:{magAtk:6, crit:2}},
  {templateId:'ancient_amber',   name:'Ancient Amber',      icon:'🟠', rarity:'rare',
   desc:'+7 spell power, +6 DEF, +8 HP', classes:['druid'],
   stats:{magAtk:5, def:4, hp:5}},
  {templateId:'fungal_bloom',    name:'Fungal Bloom',       icon:'🍄', rarity:'rare',
   desc:'+9 spell power, +2 crit, +5 HP', classes:['druid'],
   stats:{magAtk:6, crit:1, hp:3}},
  {templateId:'primal_heartstone',name:'Primal Heartstone', icon:'💚', rarity:'epic',
   desc:'+14 spell power, +8 DEF, +15 HP', classes:['druid'],
   stats:{magAtk:9, def:5, hp:10}},
  {templateId:'eternal_warflame',name:'Eternal Warflame',   icon:'🔥', rarity:'legendary',
   desc:'+16 spell power, +4 crit — 5% chance bonus fire on attacks',
   classes:['druid'],
   stats:{magAtk:10, crit:3},
   passive:{id:'warflame', desc:'5% chance per attack: bonus fire damage', icon:'🔥'}},

  // ═══════════════════════════════════════
  //  SHARED — 20 graces, 2-class pairings
  // ═══════════════════════════════════════
  // Fighter / Paladin — martial holy warriors
  {templateId:'iron_resolve',    name:'Iron Resolve',       icon:'🛡️', rarity:'uncommon',
   desc:'+6 DEF, +10 HP',       classes:['fighter','paladin'],
   stats:{def:4, hp:7}},
  {templateId:'radiant_guard',   name:'Radiant Guard',      icon:'🌟', rarity:'uncommon',
   desc:'+6 DEF, +8 HP',        classes:['fighter','paladin'],
   stats:{def:4, hp:5}},
  // Fighter / Barbarian — melee brutes
  {templateId:'shieldwall',      name:'Shieldwall',         icon:'🏰', rarity:'rare',
   desc:'+10 DEF, +15 HP',      classes:['fighter','barbarian'],
   stats:{def:7, hp:10}},
  {templateId:'bloodstone',      name:'Bloodstone',         icon:'🩸', rarity:'uncommon',
   desc:'+5 ATK',               classes:['fighter','barbarian'],
   stats:{atk:3}},
  // Fighter / Ranger — weapon discipline
  {templateId:'blade_mastery',   name:'Blade Mastery',      icon:'🗡️', rarity:'rare',
   desc:'+8 ATK, +3 crit',      classes:['fighter','ranger'],
   stats:{atk:5, crit:2}},
  // Wizard / Druid — arcane-nature casters
  {templateId:'arcane_lens',     name:'Arcane Lens',        icon:'🔮', rarity:'uncommon',
   desc:'+6 spell power',       classes:['wizard','druid'],
   stats:{magAtk:4}},
  {templateId:'ether_conduit',   name:'Ether Conduit',      icon:'⚡', rarity:'rare',
   desc:'+8 spell power, +10 HP', classes:['wizard','druid'],
   stats:{magAtk:5, hp:7}},
  // Wizard / Cleric — scholarly spellcasters
  {templateId:'mana_crystal',    name:'Mana Crystal',       icon:'💎', rarity:'uncommon',
   desc:'+4 spell power, +8 HP', classes:['wizard','cleric'],
   stats:{magAtk:3, hp:5}},
  {templateId:'diviner_thread',  name:"Diviner's Thread",   icon:'🧵', rarity:'rare',
   desc:'+8 spell power, +4 DEF, +8 HP', classes:['wizard','cleric'],
   stats:{magAtk:5, def:3, hp:5}},
  // Wizard / Rogue — intellect meets cunning
  {templateId:'cunning_cipher',  name:'Cunning Cipher',     icon:'🔐', rarity:'uncommon',
   desc:'+4 spell power, +4 ATK, +2 crit', classes:['wizard','rogue'],
   stats:{magAtk:3, atk:3, crit:1}},
  // Rogue / Ranger — dexterity and stealth
  {templateId:'shadow_fang',     name:'Shadow Fang',        icon:'🦷', rarity:'uncommon',
   desc:'+4 ATK, +2 crit',      classes:['rogue','ranger'],
   stats:{atk:3, crit:1}},
  {templateId:'nightwalker',     name:'Nightwalker',        icon:'🌑', rarity:'rare',
   desc:'+6 ATK, +5 DEF, +2 crit', classes:['rogue','ranger'],
   stats:{atk:4, def:3, crit:1}},
  // Rogue / Barbarian — savage street fighters
  {templateId:'pit_fighter_grip',name:"Pit Fighter's Grip", icon:'👊', rarity:'uncommon',
   desc:'+4 ATK, +3 DEF, +4 HP', classes:['rogue','barbarian'],
   stats:{atk:3, def:2, hp:3}},
  {templateId:'savage_cunning',  name:'Savage Cunning',     icon:'🐆', rarity:'rare',
   desc:'+8 ATK, +3 crit, +5 HP', classes:['rogue','barbarian'],
   stats:{atk:5, crit:2, hp:3}},
  // Paladin / Cleric — divine servants
  {templateId:'holy_symbol',     name:'Holy Symbol',        icon:'✝️', rarity:'uncommon',
   desc:'+3 ATK, +4 DEF, +5 HP', classes:['paladin','cleric'],
   stats:{atk:2, def:3, hp:3}},
  {templateId:'crusader_valor',  name:"Crusader's Valor",   icon:'⚜️', rarity:'rare',
   desc:'+8 DEF, +20 HP',       classes:['paladin','cleric'],
   stats:{def:5, hp:13}},
  // Paladin / Barbarian — frontline zealots
  {templateId:'zealous_fury',    name:'Zealous Fury',       icon:'🔥', rarity:'rare',
   desc:'+7 ATK, +5 DEF, +10 HP', classes:['paladin','barbarian'],
   stats:{atk:5, def:3, hp:7}},
  // Ranger / Druid — nature bond
  {templateId:'trailblazer',     name:'Trailblazer',        icon:'🥾', rarity:'uncommon',
   desc:'+5 ATK, +5 DEF',       classes:['ranger','druid'],
   stats:{atk:3, def:3}},
  {templateId:'thornheart',      name:'Thornheart',         icon:'🌹', rarity:'rare',
   desc:'+10 spell power, +10 HP', classes:['ranger','druid'],
   stats:{magAtk:7, hp:7}},
  // Cleric / Druid — wisdom healers
  {templateId:'blessed_vestments',name:'Blessed Vestments', icon:'👘', rarity:'uncommon',
   desc:'+4 DEF, +4 spell power', classes:['cleric','druid'],
   stats:{def:3, magAtk:3}},

  // ═══════════════════════════════════════
  //  MULTI-CLASS — 5 graces, all classes
  // ═══════════════════════════════════════
  {templateId:'adventurer_luck', name:"Adventurer's Luck",  icon:'🍀', rarity:'uncommon',
   desc:'+2 ATK, +2 DEF, +5 HP', classes:[...ALL_CLASSES],
   stats:{atk:1, def:1, hp:3}},
  {templateId:'veteran_instinct',name:"Veteran's Instinct", icon:'🎖️', rarity:'rare',
   desc:'+5 ATK, +5 DEF, +10 HP', classes:[...ALL_CLASSES],
   stats:{atk:3, def:3, hp:7}},
  {templateId:'wanderer_resolve',name:"Wanderer's Resolve", icon:'🧭', rarity:'rare',
   desc:'+4 ATK, +4 DEF, +2 crit, +8 HP', classes:[...ALL_CLASSES],
   stats:{atk:3, def:3, crit:1, hp:5}},
  {templateId:'hero_mantle',     name:"Hero's Mantle",      icon:'🦸', rarity:'epic',
   desc:'+8 ATK, +8 DEF, +8 spell power, +15 HP', classes:[...ALL_CLASSES],
   stats:{atk:5, def:5, magAtk:5, hp:10}},
  {templateId:'godslayer_core',  name:"God-Slayer's Core",  icon:'💀', rarity:'legendary',
   desc:'+10 ATK, +10 spell power, +3 crit — +20% boss damage',
   classes:[...ALL_CLASSES],
   stats:{atk:7, magAtk:7, crit:2},
   passive:{id:'godslayer', desc:'+20% damage vs bosses', icon:'💀'}},
];

// Build lookup by templateId
const GRACE_BY_ID = {};
GRACES.forEach(g => { GRACE_BY_ID[g.templateId] = g; });

// ── Grace generation ────────────────────────────────────────

function generateGrace(forcedRarity, forClassId){
  // Determine rarity
  let rarities = ['uncommon','uncommon','uncommon','uncommon','rare','rare','epic'];
  const ups = typeof getPermanentUpgrades==='function' ? getPermanentUpgrades() : {};
  const luck = ups.grace_luck||0;
  if(luck>=1) rarities = ['uncommon','uncommon','uncommon','rare','rare','epic','epic'];
  if(luck>=2) rarities = ['uncommon','uncommon','rare','rare','epic','epic','legendary'];
  if(luck>=3) rarities = ['uncommon','rare','rare','epic','epic','legendary','legendary'];
  const rarity = forcedRarity || rarities[Math.floor(Math.random()*rarities.length)];

  // Filter catalog by rarity
  let pool = GRACES.filter(g => g.rarity === rarity);
  if(!pool.length) pool = GRACES.filter(g => g.rarity === 'uncommon');

  // 60% chance to bias toward current class if provided
  const classId = forClassId || (G && G.classId);
  if(classId && Math.random() < 0.5){
    const classPool = pool.filter(g => g.classes.includes(classId));
    if(classPool.length) pool = classPool;
  }

  // Try to avoid duplicates already in inventory
  const existing = typeof getSlotGraces==='function' ? getSlotGraces() : {inventory:[],equipped:{}};
  const ownedIds = new Set([
    ...existing.inventory.map(g=>g.templateId),
    ...Object.values(existing.equipped).filter(Boolean).map(g=>g.templateId),
  ]);
  const fresh = pool.filter(g => !ownedIds.has(g.templateId));
  if(fresh.length) pool = fresh;

  // Pick one
  const template = pool[Math.floor(Math.random()*pool.length)];
  return {
    id:         'grace_'+Date.now()+'_'+Math.floor(Math.random()*9999),
    templateId: template.templateId,
    name:       template.name,
    icon:       template.icon,
    desc:       template.desc,
    rarity:     template.rarity,
    classes:    [...template.classes],
    stats:      {...template.stats},
    passive:    template.passive ? {...template.passive} : null,
  };
}

// ── Grace slot accessors ──────────────────────────────────

function getSlotGraces(slot){
  slot = slot||activeSaveSlot;
  if(!slot) return {inventory:[],equipped:{}};
  const data = loadSlotData(slot);
  return (data&&data.graces) ? data.graces : {inventory:[],equipped:{}};
}

function addGraceToInventory(grace, slot){
  slot = slot||activeSaveSlot;
  if(!slot) return;
  updateSlotData(slot, d=>{
    if(!d.graces) d.graces={inventory:[],equipped:{}};
    d.graces.inventory.push(grace);
  });
}

function equipGrace(graceId, slotKey, slot){
  slot = slot||activeSaveSlot;
  if(!slot) return false;
  const slotClass = slotKey.split('_').slice(0,-1).join('_');
  let ok=false;
  updateSlotData(slot, d=>{
    if(!d.graces) return;
    const idx=d.graces.inventory.findIndex(g=>g.id===graceId);
    if(idx===-1) return;
    const grace=d.graces.inventory[idx];
    // Enforce class restriction
    if(!grace.classes || !grace.classes.includes(slotClass)) return;
    if(d.graces.equipped[slotKey]) d.graces.inventory.push(d.graces.equipped[slotKey]);
    d.graces.equipped[slotKey]=grace;
    d.graces.inventory.splice(idx,1);
    ok=true;
  });
  return ok;
}

function unequipGrace(slotKey, slot){
  slot=slot||activeSaveSlot;
  if(!slot) return false;
  let ok=false;
  updateSlotData(slot, d=>{
    if(!d.graces||!d.graces.equipped[slotKey]) return;
    d.graces.inventory.push(d.graces.equipped[slotKey]);
    delete d.graces.equipped[slotKey];
    ok=true;
  });
  return ok;
}

function sellGraceFromInventory(graceId, slot){
  slot=slot||activeSaveSlot;
  if(!slot) return 0;
  let value=0;
  updateSlotData(slot, d=>{
    if(!d.graces) return;
    const idx=d.graces.inventory.findIndex(g=>g.id===graceId);
    if(idx===-1) return;
    value=GRACE_SELL_VALUES[d.graces.inventory[idx].rarity]||10;
    d.graces.inventory.splice(idx,1);
    d.pendingGraceGold=(d.pendingGraceGold||0)+value;
  });
  return value;
}

function sellGraceEquipped(slotKey, slot){
  slot=slot||activeSaveSlot;
  if(!slot) return 0;
  let value=0;
  updateSlotData(slot, d=>{
    if(!d.graces||!d.graces.equipped[slotKey]) return;
    value=GRACE_SELL_VALUES[d.graces.equipped[slotKey].rarity]||10;
    delete d.graces.equipped[slotKey];
    d.pendingGraceGold=(d.pendingGraceGold||0)+value;
  });
  return value;
}

function consumePendingGraceGold(slot){
  slot=slot||activeSaveSlot;
  if(!slot) return 0;
  let val=0;
  updateSlotData(slot, d=>{ val=d.pendingGraceGold||0; d.pendingGraceGold=0; });
  return val;
}

function getEquippedGraces(classId, slot){
  slot=slot||activeSaveSlot;
  const graces=getSlotGraces(slot);
  return (CLASS_GRACE_SLOTS[classId]||[]).map((_,i)=>graces.equipped[classId+'_'+i]||null);
}

// ── Apply grace buffs at run start ──────────────────────────

function applyGraceBuffs(classId){
  if(!G) return;
  // Clear ALL passive flags
  G._graceWarflame=false; G._graceGodslayer=false; G._graceFirstBlade=false;
  G._graceAegis=false;    G._graceUnbroken=false;  G._graceBastion=false;
  G._graceSpellflame=false;G._graceInfWord=false;   G._graceArcanum=false;
  G._graceFirstStrike=false;

  getEquippedGraces(classId).forEach(grace=>{
    if(!grace) return;
    // Apply flat stats
    Object.entries(grace.stats).forEach(([stat,val])=>{
      if(stat==='atk')     G.atk      =(G.atk||0)+val;
      if(stat==='def')     G.def      =(G.def||0)+val;
      if(stat==='hp')    { G.maxHp    =(G.maxHp||0)+val; G.hp=G.maxHp; }
      if(stat==='magAtk')  G.magBonus =(G.magBonus||0)+val;
      if(stat==='crit')    G.critBonus=(G.critBonus||0)+val;
    });
    // Apply passive flags
    if(grace.passive){
      const pid=grace.passive.id;
      if(pid==='warflame')    G._graceWarflame=true;
      if(pid==='godslayer')   G._graceGodslayer=true;
      if(pid==='firstblade'){ G._graceFirstBlade=true; G._graceFirstStrike=true; }
      if(pid==='aegis')       G._graceAegis=true;
      if(pid==='unbroken')    G._graceUnbroken=true;
      if(pid==='bastion')     G._graceBastion=true;
      if(pid==='spellflame')  G._graceSpellflame=true;
      if(pid==='infword')     G._graceInfWord=true;
      if(pid==='arcanum')     G._graceArcanum=true;
    }
  });
}

// ══════════════════════════════════════════════════════════
//  ACHIEVEMENTS — per slot
// ══════════════════════════════════════════════════════════

function getSlotAchievements(slot){
  slot=slot||activeSaveSlot;
  if(!slot) return [];
  const data=loadSlotData(slot);
  return (data&&data.achievements) ? data.achievements : [];
}

function unlockAchievement(id, slot){
  slot=slot||activeSaveSlot;
  if(!slot) return false;
  let isNew=false;
  updateSlotData(slot, d=>{
    if(!d.achievements) d.achievements=[];
    if(!d.achievements.includes(id)){ d.achievements.push(id); isNew=true; }
  });
  return isNew;
}

function isAchievementUnlocked(id, slot){
  return getSlotAchievements(slot).includes(id);
}

// ══════════════════════════════════════════════════════════
//  GRACE DROP OVERLAY
// ══════════════════════════════════════════════════════════

let _graceDropCallback=null;

function showGraceDrop(grace, onDone){
  _graceDropCallback=onDone;
  addGraceToInventory(grace);
  const rc=GRACE_RARITY_COLORS[grace.rarity]||'#888';
  const statsStr=Object.entries(grace.stats).map(([k,v])=>'+'+v+' '+k.toUpperCase()).join('  ·  ');
  const classLine = grace.classes.length >= ALL_CLASSES.length
    ? '<span style="font-family:\'Press Start 2P\',monospace;font-size:7px;color:#888;">ALL CLASSES</span>'
    : grace.classes.map(c=>`<span style="font-family:'Press Start 2P',monospace;font-size:7px;color:#bbb;text-transform:capitalize;">${c}</span>`).join('<span style="color:#555;font-size:7px;">,&nbsp;</span>');
  const passiveLine = grace.passive
    ? '<div style="font-size:13px;color:var(--gold);margin-bottom:10px;line-height:1.6;">★ '+grace.passive.desc+'</div>'
    : '';
  document.getElementById('graceDropContent').innerHTML=
    '<div style="font-family:\'Press Start 2P\',monospace;font-size:8px;color:var(--dim);letter-spacing:3px;margin-bottom:14px;">— GRACE ACQUIRED —</div>'+
    '<div style="font-size:48px;margin-bottom:10px;filter:drop-shadow(0 0 16px '+rc+')">'+grace.icon+'</div>'+
    '<div style="font-family:\'Press Start 2P\',monospace;font-size:13px;color:'+rc+';text-shadow:0 0 20px '+rc+',2px 2px 0 #000;margin-bottom:8px;">'+grace.name+'</div>'+
    '<div style="font-family:\'Press Start 2P\',monospace;font-size:7px;color:'+rc+';letter-spacing:2px;margin-bottom:10px;">'+grace.rarity.toUpperCase()+' GRACE</div>'+
    '<div style="font-size:16px;color:var(--parchment);margin-bottom:10px;">'+statsStr+'</div>'+
    passiveLine+
    '<div style="display:flex;gap:6px;justify-content:center;align-items:center;margin-bottom:16px;"><span style="font-family:\'Press Start 2P\',monospace;font-size:6px;color:#666;letter-spacing:1px;">USABLE BY</span> '+classLine+'</div>'+
    '<div style="font-size:13px;color:var(--dim);margin-bottom:20px;">Saved to Slot '+activeSaveSlot+'.<br>Equip it from the Grace Vault.</div>'+
    '<button class="btn btn-gold" style="font-size:9px;padding:12px 32px;" onclick="closeGraceDrop()">CONTINUE ▶</button>';
  const overlay = document.getElementById('graceDropOverlay');
  overlay.style.display = 'flex';
  AUDIO.sfx&&AUDIO.sfx.loot&&AUDIO.sfx.loot();
}

function closeGraceDrop(){
  document.getElementById('graceDropOverlay').style.display = 'none';
  const cb=_graceDropCallback;
  _graceDropCallback=null;
  if(cb) setTimeout(cb,300);
}

// ══════════════════════════════════════════════════════════
//  GRACE MANAGEMENT SCREEN
// ══════════════════════════════════════════════════════════

let _graceSelectedId=null;
let _graceManageClass=null;

function renderGraceScreen(){
  const container=document.getElementById('graceScreenContent');
  if(!container) return;
  const slot=activeSaveSlot;
  const graces=getSlotGraces(slot);
  const classes=Object.keys(CLASS_GRACE_SLOTS);
  if(!_graceManageClass) _graceManageClass=classes[0];

  let html=`<div style="
    display:flex;flex-direction:column;
    min-height:100%;
    max-width:900px;margin:0 auto;
    padding:24px 32px 32px;
    box-sizing:border-box;
  ">`;

  // ── CLASS SELECTOR ──────────────────────────────────────
  html+=`<div style="display:flex;justify-content:center;gap:clamp(4px,0.8vw,10px);padding:18px 0 18px;flex-shrink:0;flex-wrap:wrap;">`;
  classes.forEach(cid=>{
    const active=_graceManageClass===cid;
    const eqCount=CLASS_GRACE_SLOTS[cid].filter((_,i)=>graces.equipped[cid+'_'+i]).length;
    const total=CLASS_GRACE_SLOTS[cid].length;
    const label=cid.charAt(0).toUpperCase()+cid.slice(1);
    html+=`<button onclick="graceSelectClass('${cid}')"
      style="
        font-family:'Press Start 2P',monospace;font-size:clamp(8px,1vw,12px);
        padding:clamp(10px,1.5vh,16px) clamp(14px,2vw,24px);
        background:${active?'rgba(200,168,75,0.12)':'transparent'};
        border:1px solid ${active?'#c8a84b':'rgba(255,255,255,0.1)'};
        color:${active?'#c8a84b':'#666'};
        cursor:pointer;transition:all 0.15s;
        letter-spacing:1px;
      ">
      ${label}
      <span style="font-size:clamp(6px,0.7vw,8px);color:${active?'rgba(200,168,75,0.5)':'#444'};margin-left:6px;">${eqCount}/${total}</span>
    </button>`;
  });
  html+='</div>';

  // ── EQUIP SLOTS — 3 generic slots ─────────────────────
  html+=`<div style="display:flex;justify-content:center;gap:clamp(14px,2.5vw,32px);flex-shrink:0;margin-bottom:18px;">`;
  CLASS_GRACE_SLOTS[_graceManageClass].forEach((_,i)=>{
    const key=_graceManageClass+'_'+i;
    const eq=graces.equipped[key];
    const rc=eq ? (GRACE_RARITY_COLORS[eq.rarity]||'#888') : 'rgba(255,255,255,0.1)';
    html+=`<div class="grace-drop-slot" data-slot-key="${key}"
      ondragover="graceDragOver(event)" ondragleave="graceDragLeave(event)" ondrop="graceDrop(event,'${key}')"
      style="
        flex:1;max-width:300px;min-width:0;
        border:2px solid ${eq?rc:'rgba(255,255,255,0.1)'};
        background:${eq?'rgba(0,0,0,0.5)':'rgba(255,255,255,0.02)'};
        padding:clamp(18px,2.5vh,28px) clamp(16px,2vw,24px);
        text-align:center;
        ${eq?`box-shadow:inset 0 0 20px ${rc}40;`:''}
        transition:all 0.15s;
        display:flex;flex-direction:column;align-items:center;
      ">
      <div style="font-family:'Press Start 2P',monospace;font-size:clamp(6px,0.7vw,9px);color:#666;letter-spacing:1px;margin-bottom:10px;text-transform:uppercase;">SLOT ${i+1}</div>`;
    if(eq){
      const statsStr=Object.entries(eq.stats).map(([k,v])=>`+${v} <span style="color:#555">${typeof statLabel==='function'?statLabel(k):k}</span>`).join(' &nbsp; ');
      html+=`<div style="font-size:clamp(32px,4.5vw,52px);margin-bottom:10px;filter:drop-shadow(0 0 10px ${rc});">${iconHTML(eq.icon)}</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:clamp(8px,1vw,12px);color:${rc};line-height:1.7;margin-bottom:6px;">${eq.name}</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:clamp(6px,0.7vw,8px);color:#555;margin-bottom:12px;">${eq.rarity.toUpperCase()}</div>
        <div style="font-size:clamp(12px,1.3vw,16px);color:#999;margin-bottom:8px;line-height:1.8;">${statsStr}</div>`;
      if(eq.passive){
        html+=`<div style="font-size:clamp(10px,1.1vw,13px);color:var(--gold);margin-bottom:12px;line-height:1.6;">★ ${eq.passive.desc}</div>`;
      }
      html+=`<div style="display:flex;gap:8px;margin-top:auto;">
          <button onclick="graceUnequip('${key}')" style="font-family:'Press Start 2P',monospace;font-size:clamp(6px,0.7vw,8px);padding:7px 10px;background:transparent;border:1px solid #7a2020;color:#c05050;cursor:pointer;">UNEQUIP</button>
          <button onclick="graceSellEquipped('${key}')" style="font-family:'Press Start 2P',monospace;font-size:clamp(6px,0.7vw,8px);padding:7px 10px;background:transparent;border:1px solid #2a5a2a;color:#5daa5d;cursor:pointer;">SELL ${GRACE_SELL_VALUES[eq.rarity]}g</button>
        </div>`;
    } else {
      html+=`<div style="font-size:clamp(22px,3vw,36px);opacity:0.1;margin:10px 0 8px;">✨</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:clamp(6px,0.7vw,8px);color:rgba(255,255,255,0.12);line-height:2;">EMPTY</div>
        <div style="font-size:clamp(10px,1.1vw,13px);color:rgba(255,255,255,0.08);margin-top:8px;">drag or click below</div>`;
    }
    html+='</div>';
  });
  html+='</div>';

  // ── INVENTORY — filtered to current class ────────────────
  const compatible = graces.inventory.filter(g => g.classes && g.classes.includes(_graceManageClass));
  const incompatible = graces.inventory.filter(g => !g.classes || !g.classes.includes(_graceManageClass));

  html+=`<div style="
    flex:1;min-height:0;
    border-top:1px solid rgba(255,255,255,0.07);
    padding-top:14px;
    display:flex;flex-direction:column;
  ">
    <div style="font-family:'Press Start 2P',monospace;font-size:clamp(8px,0.9vw,10px);color:#666;letter-spacing:2px;text-align:center;margin-bottom:12px;flex-shrink:0;">
      COMPATIBLE &nbsp;<span style="color:#c8a84b;">${compatible.length}</span>
      ${incompatible.length>0?`&nbsp;&nbsp;·&nbsp;&nbsp;<span style="color:#555;">OTHER ${incompatible.length}</span>`:''}
    </div>`;

  if(compatible.length>0){
    html+=`<div style="display:flex;gap:clamp(10px,1.5vw,16px);flex-wrap:wrap;justify-content:center;align-content:flex-start;overflow-y:auto;flex:1;min-height:0;padding-bottom:20px;">`;
    compatible.forEach(g=>{
      const rc=GRACE_RARITY_COLORS[g.rarity]||'#888';
      const statsStr=Object.entries(g.stats).map(([k,v])=>`+${v} ${typeof statLabel==='function'?statLabel(k):k}`).join('  ');
      const classLine = g.classes.length >= ALL_CLASSES.length
        ? '<span style="font-family:\'Press Start 2P\',monospace;font-size:7px;color:#555;">ALL CLASSES</span>'
        : g.classes.map(c=>`<span style="font-family:'Press Start 2P',monospace;font-size:7px;color:${c===_graceManageClass?'#c8a84b':'#555'};text-transform:capitalize;">${c}</span>`).join('<span style="color:#333;font-size:7px;">, </span>');
      // Find first empty slot for equip button
      const emptySlot = CLASS_GRACE_SLOTS[_graceManageClass].map((_,i)=>_graceManageClass+'_'+i).find(k=>!graces.equipped[k])
        || _graceManageClass+'_0';

      html+=`<div class="grace-drag-card" draggable="true" data-grace-id="${g.id}"
        ondragstart="graceDragStart(event,'${g.id}')" ondragend="graceDragEnd(event)"
        style="
          width:clamp(140px,16vw,180px);
          background:rgba(0,0,0,0.6);
          border:2px solid ${rc};
          padding:clamp(12px,1.5vh,16px) clamp(10px,1.2vw,14px);
          text-align:center;cursor:grab;
          user-select:none;transition:opacity 0.15s,transform 0.1s;
          display:flex;flex-direction:column;align-items:center;
          box-shadow:0 0 10px rgba(0,0,0,0.5);
        ">
        <div style="font-size:clamp(22px,2.8vw,32px);margin-bottom:8px;filter:drop-shadow(0 0 6px ${rc});">${g.icon}</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:clamp(6px,0.75vw,9px);color:${rc};line-height:1.7;margin-bottom:4px;">${g.name}</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:clamp(5px,0.6vw,7px);color:${rc};opacity:0.6;margin-bottom:6px;">${g.rarity.toUpperCase()}</div>
        <div style="margin-bottom:6px;display:flex;gap:2px;justify-content:center;flex-wrap:wrap;">${classLine}</div>
        <div style="font-size:clamp(10px,1.1vw,13px);color:#888;margin-bottom:6px;line-height:1.6;">${statsStr}</div>`;
      if(g.passive){
        html+=`<div style="font-size:clamp(9px,1vw,12px);color:var(--gold);margin-bottom:8px;line-height:1.5;">★ ${g.passive.desc}</div>`;
      }
      html+=`<button onclick="event.stopPropagation();equipGrace('${g.id}','${emptySlot}');renderGraceScreen();"
          style="font-family:'Press Start 2P',monospace;font-size:clamp(6px,0.7vw,8px);padding:7px 8px;background:rgba(200,168,75,0.1);border:1px solid #c8a84b;color:#c8a84b;cursor:pointer;width:100%;margin-bottom:5px;">EQUIP</button>
        <button onclick="event.stopPropagation();graceSellInventory('${g.id}')"
          style="font-family:'Press Start 2P',monospace;font-size:clamp(6px,0.7vw,8px);padding:7px 8px;background:transparent;border:1px solid #2a5a2a;color:#5daa5d;cursor:pointer;width:100%;">SELL ${GRACE_SELL_VALUES[g.rarity]}g</button>
      </div>`;
    });
    html+='</div>';
  } else {
    html+=`<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0.4;">
      <div style="font-size:40px;margin-bottom:18px;">✨</div>
      <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:#666;line-height:2.4;text-align:center;">No compatible graces for this class.<br>Defeat bosses to earn them.</div>
    </div>`;
  }
  html+='</div></div>';
  container.innerHTML=html;
}

// ── Drag-and-drop handlers ────────────────────────────────
let _graceDragId=null;

function graceDragStart(e, graceId){
  _graceDragId=graceId;
  e.dataTransfer.effectAllowed='move';
  setTimeout(()=>{ if(e.target) e.target.style.opacity='0.4'; }, 0);
}

function graceDragEnd(e){
  _graceDragId=null;
  if(e.target) e.target.style.opacity='';
  document.querySelectorAll('.grace-drop-slot').forEach(el=>{
    el.style.background='var(--panel)';
    el.style.borderStyle='dashed';
  });
}

function graceDragOver(e){
  e.preventDefault();
  const slot=e.currentTarget;
  if(_graceDragId){
    e.dataTransfer.dropEffect='move';
    slot.style.background='rgba(200,168,75,0.1)';
    slot.style.borderStyle='solid';
  } else {
    e.dataTransfer.dropEffect='none';
  }
}

function graceDragLeave(e){
  const slot=e.currentTarget;
  slot.style.background='var(--panel)';
  slot.style.borderStyle='dashed';
}

function graceDrop(e, slotKey){
  e.preventDefault();
  const slot=e.currentTarget;
  slot.style.background='var(--panel)';
  slot.style.borderStyle='dashed';
  if(!_graceDragId) return;
  equipGrace(_graceDragId, slotKey);
  _graceDragId=null;
  renderGraceScreen();
}

function graceSelectClass(cid){ _graceManageClass=cid; _graceSelectedId=null; renderGraceScreen(); }
function graceSelectItem(id)  { _graceSelectedId=(_graceSelectedId===id)?null:id; renderGraceScreen(); }

function graceEquipSelected(slotKey){
  if(!_graceSelectedId) return;
  equipGrace(_graceSelectedId,slotKey);
  _graceSelectedId=null;
  renderGraceScreen();
}
function graceUnequip(slotKey){ unequipGrace(slotKey); renderGraceScreen(); }

function graceSellInventory(graceId){
  const g=getSlotGraces().inventory.find(x=>x.id===graceId);
  if(!g) return;
  showGenericConfirm(
    'SELL GRACE?',
    'Sell '+g.name+' for '+GRACE_SELL_VALUES[g.rarity]+'g? This cannot be undone.',
    'SELL',
    ()=>{ sellGraceFromInventory(graceId); if(_graceSelectedId===graceId) _graceSelectedId=null; renderGraceScreen(); }
  );
}
function graceSellEquipped(slotKey){
  const g=getSlotGraces().equipped[slotKey];
  if(!g) return;
  showGenericConfirm(
    'SELL GRACE?',
    'Sell '+g.name+' for '+GRACE_SELL_VALUES[g.rarity]+'g? This cannot be undone.',
    'SELL',
    ()=>{ sellGraceEquipped(slotKey); renderGraceScreen(); }
  );
}

// ── Save on page close/refresh so mid-turn state is never lost ──
window.addEventListener('beforeunload', function(){
  if(typeof autoSave==='function') autoSave();
});
