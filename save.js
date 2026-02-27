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

function autoSave(){
  if(!activeSaveSlot) return;
  saveGame(activeSaveSlot);
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
  const OMIT = new Set(['currentEnemy','reactionPending','_metamagicTwinUsed',
    '_overflowingFontUsed','_longRestUsed','_dyingFlag']);
  const copy = {};
  for(const [k,v] of Object.entries(g)){
    if(OMIT.has(k)) continue;
    try{ copy[k] = JSON.parse(JSON.stringify(v)); } catch{ copy[k]=v; }
  }
  copy.currentEnemy          = null;
  copy.isPlayerTurn          = true;
  copy.actionUsed            = false;
  copy.bonusUsed             = false;
  copy.reactionUsed          = false;
  copy.raging                = false;
  copy.rageTurns             = 0;
  copy.concentrating         = null;
  copy.mirrorImages          = 0;
  copy.spiritualWeaponActive = false;
  copy.spiritualWeaponTurns  = 0;
  copy.firstAttackUsed       = false;
  copy.roundNum              = 0;
  copy.conditions            = [];
  copy.conditionTurns        = {};
  copy.sx                    = {};
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
      ? `<div class="tsc-grace-icons">${uniqueIcons.map(ic=>`<span class="tsc-grace-pip">${ic}</span>`).join('')}</div>`
      : '';

    card.innerHTML =
      `<button class="tsc-del-corner" onclick="event.stopPropagation();slotDelete(${slot})" title="Delete slot">🗑</button>`+
      `<div class="tsc-card-top">`+
        `<div class="tsc-adventurer-name">${adventurerName}</div>`+
        `<div class="tsc-card-meta">`+
          graceIconsHtml+
          `<span class="tsc-meta-pill">✨ ${allGraces.length}</span>`+
          `<span class="tsc-meta-pill">🏆 ${achCount}</span>`+
        `</div>`+
      `</div>`+
      `<div class="tsc-card-bottom">`+
        `<span class="tsc-zone-badge">📍 ${zoneLine}</span>`+
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
  actEl.innerHTML =
    (s ? `<button class="btn btn-gold" style="font-size:8px;" onclick="slotContinue(${slot})">▶ CONTINUE RUN</button>` : '')+
    `<button class="btn" style="border-color:var(--gold-dim);color:var(--gold);font-size:8px;" onclick="slotNewRun(${slot})">↺ NEW RUN</button>`;

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
    ? Array.from({length:3},(_,i)=>`<span style="font-size:14px;${i>=lives?'filter:grayscale(1) brightness(0.4)':'filter:drop-shadow(0 0 3px rgba(255,60,60,.6))'}">❤️</span>`).join('')
    : '';

  return `
    <div class="sdo-stat-grid">
      <div class="sdo-stat"><span class="sdo-stat-icon">⚔️</span><span class="sdo-stat-val">${kills}</span><span class="sdo-stat-lbl">kills</span></div>
      <div class="sdo-stat"><span class="sdo-stat-icon">👑</span><span class="sdo-stat-val">${zonesCleared}</span><span class="sdo-stat-lbl">bosses</span></div>
      <div class="sdo-stat"><span class="sdo-stat-icon">💥</span><span class="sdo-stat-val">${crits}</span><span class="sdo-stat-lbl">crits</span></div>
      <div class="sdo-stat"><span class="sdo-stat-icon">🪙</span><span class="sdo-stat-val">${gold}</span><span class="sdo-stat-lbl">gold</span></div>
      <div class="sdo-stat"><span class="sdo-stat-icon">✨</span><span class="sdo-stat-val">${graceCount}</span><span class="sdo-stat-lbl">graces</span></div>
      <div class="sdo-stat"><span class="sdo-stat-icon">🏆</span><span class="sdo-stat-val">${achCount}</span><span class="sdo-stat-lbl">achievements</span></div>
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
      if(typeof renderAll==='function')     renderAll();
      if(typeof renderHud==='function')     renderHud();
      if(typeof updateCampBtn==='function') updateCampBtn();
      if(typeof setupGameUI==='function')   setupGameUI();
      if(typeof spawnEnemy==='function')    spawnEnemy();
      if(typeof startPlayTimer==='function') startPlayTimer();
      AUDIO.playBGM('dungeon');
      if(typeof log==='function') log('&#x2736; Welcome back, adventurer.','l');
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
  if(d>=2000) return 3;
  if(d>=500)  return 2;
  return 1;
}

function getShopTierRarities(){
  const t = getShopTier();
  if(t>=3) return ['common','uncommon','rare','epic','legendary'];
  if(t>=2) return ['common','uncommon','rare'];
  return ['common','uncommon'];
}

// ══════════════════════════════════════════════════════════
//  GRACE DATA
// ══════════════════════════════════════════════════════════

const CLASS_GRACE_SLOTS = {
  fighter:   [{type:'attack'},{type:'attack'},{type:'defense'}],
  wizard:    [{type:'magic'},{type:'magic'},{type:'defense'}],
  rogue:     [{type:'attack'},{type:'attack'},{type:'magic'}],
  paladin:   [{type:'attack'},{type:'magic'},{type:'defense'}],
  ranger:    [{type:'attack'},{type:'attack'},{type:'defense'}],
  barbarian: [{type:'attack'},{type:'attack'},{type:'attack'}],
  cleric:    [{type:'magic'},{type:'magic'},{type:'defense'}],
  druid:     [{type:'magic'},{type:'defense'},{type:'attack'}],
};

const GRACE_STATS = {
  uncommon: { attack:{atk:4},         defense:{def:4,hp:8},   magic:{magAtk:5} },
  rare:     { attack:{atk:8},         defense:{def:8,hp:16},  magic:{magAtk:10} },
  epic:     { attack:{atk:14,crit:3}, defense:{def:14,hp:28}, magic:{magAtk:16,crit:2} },
  legendary:{ attack:{atk:20,crit:5}, defense:{def:20,hp:40}, magic:{magAtk:24,crit:4} },
};

const GRACE_SELL_VALUES   = { uncommon:10, rare:30, epic:60, legendary:100 };
const GRACE_ICONS         = { attack:'⚔️', defense:'🛡️', magic:'✨' };
const GRACE_TYPE_LABELS   = { attack:'Attack', defense:'Defense', magic:'Magic' };
const GRACE_RARITY_COLORS = {
  uncommon:'var(--green2)', rare:'var(--blue2)', epic:'#9b54bd', legendary:'var(--gold)'
};

const GRACE_NAMES = {
  attack:{
    uncommon:['Shard of Fury','Bloodstone Fragment',"Warrior's Ember"],
    rare:    ['Fang of War','Crimson Battlestone','Edge of Ruin'],
    epic:    ["Warbringer's Heart",'Soul of the Berserker',"Conqueror's Brand"],
    legendary:['Eternal Warflame',"God-Slayer's Core",'The First Blade'],
  },
  defense:{
    uncommon:['Iron Fragment','Shard of Warding','Bastion Sliver'],
    rare:    ["Guardian's Stone",'Bulwark Shard','Aegis Fragment'],
    epic:    ['Fortress Soul',"Titan's Marrow",'Undying Bulwark'],
    legendary:['Immortal Aegis','The Unbroken','Eternal Bastion'],
  },
  magic:{
    uncommon:['Arcane Sliver','Mote of Power','Spell-Shard'],
    rare:    ['Ether Gem','Void Crystal',"Mind's Eye Stone"],
    epic:    ["Arcanist's Core",'Soul of the Weave','Nexus Shard'],
    legendary:['Eternal Spellflame','The Infinite Word','Prime Arcanum'],
  },
};

function generateGrace(forcedRarity){
  const rarities = ['uncommon','uncommon','rare','rare','epic','legendary'];
  const rarity   = forcedRarity || rarities[Math.floor(Math.random()*rarities.length)];
  const types    = ['attack','defense','magic'];
  const type     = types[Math.floor(Math.random()*types.length)];
  const names    = GRACE_NAMES[type][rarity];
  const name     = names[Math.floor(Math.random()*names.length)];
  return {
    id:    'grace_'+Date.now()+'_'+Math.floor(Math.random()*9999),
    name, type, rarity,
    stats: {...GRACE_STATS[rarity][type]},
    icon:  GRACE_ICONS[type],
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
  let ok=false;
  updateSlotData(slot, d=>{
    if(!d.graces) return;
    const idx=d.graces.inventory.findIndex(g=>g.id===graceId);
    if(idx===-1) return;
    const grace=d.graces.inventory[idx];
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

function applyGraceBuffs(classId){
  if(!G) return;
  getEquippedGraces(classId).forEach(grace=>{
    if(!grace) return;
    Object.entries(grace.stats).forEach(([stat,val])=>{
      if(stat==='atk')     G.atk      =(G.atk||0)+val;
      if(stat==='def')     G.def      =(G.def||0)+val;
      if(stat==='hp')    { G.maxHp    =(G.maxHp||0)+val; G.hp=G.maxHp; }
      if(stat==='magAtk')  G.magBonus =(G.magBonus||0)+val;
      if(stat==='crit')    G.critBonus=(G.critBonus||0)+val;
    });
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
  document.getElementById('graceDropContent').innerHTML=
    '<div style="font-family:\'Press Start 2P\',monospace;font-size:8px;color:var(--dim);letter-spacing:3px;margin-bottom:14px;">— GRACE ACQUIRED —</div>'+
    '<div style="font-size:48px;margin-bottom:10px;filter:drop-shadow(0 0 16px '+rc+')">'+grace.icon+'</div>'+
    '<div style="font-family:\'Press Start 2P\',monospace;font-size:13px;color:'+rc+';text-shadow:0 0 20px '+rc+',2px 2px 0 #000;margin-bottom:8px;">'+grace.name+'</div>'+
    '<div style="font-family:\'Press Start 2P\',monospace;font-size:7px;color:'+rc+';letter-spacing:2px;margin-bottom:14px;">'+grace.rarity.toUpperCase()+' · '+GRACE_TYPE_LABELS[grace.type]+' Grace</div>'+
    '<div style="font-size:16px;color:var(--parchment);margin-bottom:20px;">'+statsStr+'</div>'+
    '<div style="font-size:13px;color:var(--dim);margin-bottom:20px;">Saved to Slot '+activeSaveSlot+'.<br>Equip it from the save slot screen.</div>'+
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

  const CLASS_ICONS={fighter:'⚔',wizard:'📖',rogue:'🗡',paladin:'✝',ranger:'🏹',barbarian:'🩸',cleric:'☀',druid:'🌿'};
  const TYPE_COLOR={attack:'#d06060',defense:'#5a8ade',magic:'#b06ad4'};
  const TYPE_GLOW={attack:'rgba(208,96,96,0.3)',defense:'rgba(90,138,222,0.3)',magic:'rgba(176,106,212,0.3)'};

  // ── Outer wrapper: fills exactly the content area, no overflow ──
  let html=`<div style="
    display:flex;flex-direction:column;
    min-height:100%;
    max-width:1200px;margin:0 auto;
    padding:0 24px 32px;
    box-sizing:border-box;
  ">`;

  // ── CLASS SELECTOR ──────────────────────────────────────
  html+=`<div style="display:flex;justify-content:center;gap:clamp(6px,1vw,14px);padding:18px 0 14px;flex-shrink:0;">`;
  classes.forEach(cid=>{
    const active=_graceManageClass===cid;
    const eqCount=CLASS_GRACE_SLOTS[cid].filter((_,i)=>graces.equipped[cid+'_'+i]).length;
    const total=CLASS_GRACE_SLOTS[cid].length;
    const icon=CLASS_ICONS[cid]||'?';
    html+=`<div onclick="graceSelectClass('${cid}')" style="
      cursor:pointer;
      flex:1;max-width:120px;
      background:${active?'rgba(200,168,75,0.1)':'rgba(255,255,255,0.03)'};
      border:2px solid ${active?'#c8a84b':'rgba(255,255,255,0.08)'};
      padding:12px 6px 8px;text-align:center;
      transition:all 0.12s;
      ${active?'box-shadow:0 0 12px rgba(200,168,75,0.2);':''}
    ">
      <div style="font-size:clamp(20px,2.8vw,32px);line-height:1;margin-bottom:6px;">${icon}</div>
      <div style="font-family:'Press Start 2P',monospace;font-size:clamp(5px,0.65vw,8px);color:${active?'#c8a84b':'#666'};letter-spacing:1px;">${cid.toUpperCase()}</div>
      <div style="font-family:'Press Start 2P',monospace;font-size:clamp(5px,0.6vw,7px);color:${active?'#a07030':'#444'};margin-top:4px;">${eqCount}/${total}</div>
    </div>`;
  });
  html+='</div>';

  // ── DIVIDER ─────────────────────────────────────────────
  html+=`<div style="display:flex;align-items:center;gap:10px;margin:4px 0 10px;flex-shrink:0;">
    <div style="flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(200,168,75,0.3));"></div>
    <div style="font-family:'Press Start 2P',monospace;font-size:clamp(7px,0.9vw,10px);color:#c8a84b;letter-spacing:3px;">${(CLASS_ICONS[_graceManageClass]||'')} ${_graceManageClass.toUpperCase()}</div>
    <div style="flex:1;height:1px;background:linear-gradient(90deg,rgba(200,168,75,0.3),transparent);"></div>
  </div>`;

  // ── EQUIP SLOTS — fixed row, never wrap ─────────────────
  const activeSlots=CLASS_GRACE_SLOTS[_graceManageClass];
  html+=`<div style="display:flex;justify-content:center;gap:clamp(12px,2vw,28px);flex-shrink:0;margin-bottom:14px;">`;
  activeSlots.forEach((s,i)=>{
    const key=_graceManageClass+'_'+i;
    const eq=graces.equipped[key];
    const rc=GRACE_RARITY_COLORS[eq&&eq.rarity]||'rgba(255,255,255,0.1)';
    const tc=TYPE_COLOR[s.type];
    const tg=TYPE_GLOW[s.type];
    html+=`<div class="grace-drop-slot" data-slot-key="${key}" data-slot-type="${s.type}"
      ondragover="graceDragOver(event)" ondragleave="graceDragLeave(event)" ondrop="graceDrop(event,'${key}','${s.type}')"
      style="
        flex:1;max-width:280px;min-width:0;
        border:2px solid ${eq?rc:'rgba(255,255,255,0.1)'};
        background:${eq?'rgba(0,0,0,0.5)':'rgba(255,255,255,0.02)'};
        padding:clamp(14px,2vh,22px) clamp(12px,1.6vw,20px);
        text-align:center;
        ${eq?`box-shadow:inset 0 0 20px ${tg};`:''}
        transition:all 0.15s;
        display:flex;flex-direction:column;align-items:center;
      ">
      <div style="font-family:'Press Start 2P',monospace;font-size:clamp(4px,0.55vw,7px);color:${tc};letter-spacing:1px;margin-bottom:8px;text-transform:uppercase;">${s.type}</div>`;
    if(eq){
      const statsStr=Object.entries(eq.stats).map(([k,v])=>`+${v} <span style="color:#555">${k}</span>`).join(' &nbsp; ');
      html+=`<div style="font-size:clamp(28px,3.8vw,46px);margin-bottom:8px;filter:drop-shadow(0 0 10px ${rc});">${eq.icon}</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:clamp(6px,0.8vw,10px);color:${rc};line-height:1.7;margin-bottom:5px;">${eq.name}</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:clamp(5px,0.6vw,7px);color:#555;margin-bottom:10px;">${eq.rarity.toUpperCase()}</div>
        <div style="font-size:clamp(10px,1.1vw,14px);color:#999;margin-bottom:12px;line-height:1.8;">${statsStr}</div>
        <div style="display:flex;gap:6px;margin-top:auto;">
          <button onclick="graceUnequip('${key}')" style="font-family:'Press Start 2P',monospace;font-size:clamp(4px,0.5vw,6px);padding:5px 7px;background:transparent;border:1px solid #7a2020;color:#c05050;cursor:pointer;">UNEQUIP</button>
          <button onclick="graceSellEquipped('${key}')" style="font-family:'Press Start 2P',monospace;font-size:clamp(4px,0.5vw,6px);padding:5px 7px;background:transparent;border:1px solid #2a5a2a;color:#5daa5d;cursor:pointer;">SELL ${GRACE_SELL_VALUES[eq.rarity]}g</button>
        </div>`;
    } else {
      const emptyIcon=s.type==='attack'?'⚔':s.type==='defense'?'🛡':'✨';
      html+=`<div style="font-size:clamp(18px,2.5vw,30px);opacity:0.1;margin:8px 0 6px;">${emptyIcon}</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:clamp(4px,0.5vw,6px);color:rgba(255,255,255,0.12);line-height:2;">EMPTY</div>
        <div style="font-size:clamp(8px,0.9vw,11px);color:rgba(255,255,255,0.08);margin-top:6px;">drag or click below</div>`;
    }
    html+='</div>';
  });
  html+='</div>';

  // ── INVENTORY ────────────────────────────────────────────
  html+=`<div style="
    flex:1;min-height:0;
    border-top:1px solid rgba(255,255,255,0.07);
    padding-top:10px;
    display:flex;flex-direction:column;
  ">
    <div style="font-family:'Press Start 2P',monospace;font-size:clamp(6px,0.7vw,8px);color:#666;letter-spacing:2px;text-align:center;margin-bottom:10px;flex-shrink:0;">
      INVENTORY &nbsp;<span style="color:#c8a84b;">${graces.inventory.length}</span>
    </div>`;

  if(graces.inventory.length>0){
    html+=`<div style="display:flex;gap:clamp(8px,1.2vw,14px);flex-wrap:wrap;justify-content:center;align-content:flex-start;overflow:hidden;">`;
    graces.inventory.forEach(g=>{
      const rc=GRACE_RARITY_COLORS[g.rarity]||'#888';
      const tc=TYPE_COLOR[g.type]||'#888';
      const statsStr=Object.entries(g.stats).map(([k,v])=>`+${v} ${k}`).join('  ');
      const validSlots=CLASS_GRACE_SLOTS[_graceManageClass].map((s,i)=>({s,i})).filter(({s})=>s.type===g.type).map(({i})=>_graceManageClass+'_'+i);
      const firstEmpty=validSlots.find(k=>!graces.equipped[k])||validSlots[0];
      const canEquip=validSlots.length>0;
      html+=`<div class="grace-drag-card" draggable="true" data-grace-id="${g.id}" data-grace-type="${g.type}"
        ondragstart="graceDragStart(event,'${g.id}','${g.type}')"
        ondragend="graceDragEnd(event)"
        style="
          width:clamp(120px,13vw,155px);
          background:rgba(0,0,0,0.6);
          border:2px solid ${rc};
          padding:clamp(8px,1.2vh,12px) clamp(6px,0.9vw,10px);
          text-align:center;cursor:${canEquip?'grab':'default'};
          user-select:none;transition:opacity 0.15s,transform 0.1s;
          display:flex;flex-direction:column;align-items:center;
          box-shadow:0 0 10px rgba(0,0,0,0.5);
        ">
        <div style="font-size:clamp(18px,2.2vw,26px);margin-bottom:6px;filter:drop-shadow(0 0 6px ${rc});">${g.icon}</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:clamp(4px,0.55vw,7px);color:${rc};line-height:1.7;margin-bottom:3px;">${g.name}</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:clamp(4px,0.5vw,6px);color:${tc};margin-bottom:6px;">${g.rarity.toUpperCase()}</div>
        <div style="font-size:clamp(8px,0.9vw,11px);color:#888;margin-bottom:8px;line-height:1.6;">${statsStr}</div>`;
      if(canEquip){
        html+=`<button onclick="event.stopPropagation();equipGrace('${g.id}','${firstEmpty}');renderGraceScreen();"
          style="font-family:'Press Start 2P',monospace;font-size:clamp(4px,0.5vw,6px);padding:5px 6px;background:rgba(200,168,75,0.1);border:1px solid #c8a84b;color:#c8a84b;cursor:pointer;width:100%;margin-bottom:4px;">EQUIP</button>`;
      }
      html+=`<button onclick="event.stopPropagation();graceSellInventory('${g.id}')"
        style="font-family:'Press Start 2P',monospace;font-size:clamp(4px,0.5vw,6px);padding:5px 6px;background:transparent;border:1px solid #2a5a2a;color:#5daa5d;cursor:pointer;width:100%;">SELL ${GRACE_SELL_VALUES[g.rarity]}g</button>
      </div>`;
    });
    html+='</div>';
  } else {
    html+=`<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0.4;">
      <div style="font-size:32px;margin-bottom:14px;">✨</div>
      <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#666;line-height:2.2;text-align:center;">No graces yet.<br>Defeat bosses to earn them.</div>
    </div>`;
  }
  html+='</div></div>';
  container.innerHTML=html;
}

// ── Drag-and-drop handlers ────────────────────────────────
let _graceDragId=null;
let _graceDragType=null;

function graceDragStart(e, graceId, graceType){
  _graceDragId=graceId;
  _graceDragType=graceType;
  e.dataTransfer.effectAllowed='move';
  setTimeout(()=>{ if(e.target) e.target.style.opacity='0.4'; }, 0);
}

function graceDragEnd(e){
  _graceDragId=null;
  _graceDragType=null;
  if(e.target) e.target.style.opacity='';
  document.querySelectorAll('.grace-drop-slot').forEach(el=>{
    el.style.background='var(--panel)';
    el.style.borderStyle='dashed';
  });
}

function graceDragOver(e){
  e.preventDefault();
  const slot=e.currentTarget;
  const slotType=slot.dataset.slotType;
  if(_graceDragType===slotType){
    e.dataTransfer.dropEffect='move';
    slot.style.background='rgba(200,168,75,0.1)';
    slot.style.borderStyle='solid';
  } else {
    e.dataTransfer.dropEffect='none';
    slot.style.background='rgba(200,0,0,0.05)';
  }
}

function graceDragLeave(e){
  const slot=e.currentTarget;
  slot.style.background='var(--panel)';
  slot.style.borderStyle='dashed';
}

function graceDrop(e, slotKey, slotType){
  e.preventDefault();
  const slot=e.currentTarget;
  slot.style.background='var(--panel)';
  slot.style.borderStyle='dashed';
  if(!_graceDragId||_graceDragType!==slotType) return;
  equipGrace(_graceDragId, slotKey);
  _graceDragId=null;
  _graceDragType=null;
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
    'Sell '+g.name+' for 🪙'+GRACE_SELL_VALUES[g.rarity]+'? This cannot be undone.',
    '💰 SELL',
    ()=>{ sellGraceFromInventory(graceId); if(_graceSelectedId===graceId) _graceSelectedId=null; renderGraceScreen(); }
  );
}
function graceSellEquipped(slotKey){
  const g=getSlotGraces().equipped[slotKey];
  if(!g) return;
  showGenericConfirm(
    'SELL GRACE?',
    'Sell '+g.name+' for 🪙'+GRACE_SELL_VALUES[g.rarity]+'? This cannot be undone.',
    '💰 SELL',
    ()=>{ sellGraceEquipped(slotKey); renderGraceScreen(); }
  );
}
