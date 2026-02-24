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

  // Default to first class if none selected
  if(!_graceManageClass) _graceManageClass=classes[0];

  let html='<div style="max-width:800px;margin:0 auto;">';

  // ── Class selector tabs ──────────────────────────────────
  html+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 18px;">';
  classes.forEach(cid=>{
    const active=_graceManageClass===cid;
    const slots=CLASS_GRACE_SLOTS[cid];
    const eqCount=slots.filter((_,i)=>graces.equipped[cid+'_'+i]).length;
    html+=`<div onclick="graceSelectClass('${cid}')" style="cursor:pointer;background:var(--panel2);border:2px solid ${active?'var(--gold)':'var(--border)'};padding:7px 12px;transition:border-color 0.1s;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:80px;">
      <div style="font-family:'Press Start 2P',monospace;font-size:6px;color:${active?'var(--gold)':'var(--parchment)'};">${cid.toUpperCase()}</div>
      <div style="font-size:10px;color:var(--dim);">${eqCount}/${slots.length}</div>
    </div>`;
  });
  html+='</div>';

  // ── Selected class equip slots (drop targets) ────────────
  const activeSlots=CLASS_GRACE_SLOTS[_graceManageClass];
  html+='<div style="font-family:\'Press Start 2P\',monospace;font-size:8px;color:var(--gold);margin-bottom:10px;">'+_graceManageClass.toUpperCase()+' GRACE SLOTS</div>';
  html+='<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">';
  activeSlots.forEach((s,i)=>{
    const key=_graceManageClass+'_'+i;
    const eq=graces.equipped[key];
    const tc=GRACE_RARITY_COLORS[eq&&eq.rarity]||'var(--border2)';
    const tIcon=GRACE_ICONS[s.type];
    html+=`<div class="grace-drop-slot" data-slot-key="${key}" data-slot-type="${s.type}"
      ondragover="graceDragOver(event)"
      ondragleave="graceDragLeave(event)"
      ondrop="graceDrop(event,'${key}','${s.type}')"
      style="border:2px dashed ${eq?tc:'var(--border2)'};padding:12px;min-width:150px;max-width:175px;text-align:center;background:var(--panel);position:relative;transition:border-color 0.15s,background 0.15s;">
      <div style="font-family:'Press Start 2P',monospace;font-size:6px;color:var(--dim);margin-bottom:8px;">${tIcon} ${GRACE_TYPE_LABELS[s.type].toUpperCase()}</div>`;
    if(eq){
      const statsStr=Object.entries(eq.stats).map(([k,v])=>'+'+v+' '+k).join(' · ');
      html+=`<div style="font-size:28px;margin-bottom:4px;">${eq.icon}</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:${tc};margin-bottom:4px;line-height:1.6;">${eq.name}</div>
        <div style="font-size:10px;color:var(--parchment);margin-bottom:10px;">${statsStr}</div>
        <div style="display:flex;gap:4px;justify-content:center;">
          <button class="btn" style="font-size:6px;padding:4px 8px;border-color:var(--red);color:var(--red2);" onclick="graceUnequip('${key}')">UNEQUIP</button>
          <button class="btn" style="font-size:6px;padding:4px 8px;border-color:#3a5a3a;color:#5daa5d;" onclick="graceSellEquipped('${key}')">SELL 🪙${GRACE_SELL_VALUES[eq.rarity]}</button>
        </div>`;
    } else {
      html+=`<div style="font-size:32px;opacity:0.2;margin-bottom:6px;">${tIcon}</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--dim);">— DRAG HERE —</div>`;
    }
    html+='</div>';
  });
  html+='</div>';

  // ── Grace inventory (draggable) ───────────────────────────
  html+='<div style="border-top:1px solid var(--border);padding-top:16px;">';
  html+='<div style="font-family:\'Press Start 2P\',monospace;font-size:8px;color:var(--gold);margin-bottom:12px;">GRACE INVENTORY ('+graces.inventory.length+')</div>';
  if(graces.inventory.length>0){
    html+='<div style="font-size:11px;color:var(--dim);margin-bottom:12px;">Drag a grace onto a matching slot above to equip it.</div>';
    html+='<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    graces.inventory.forEach(g=>{
      const rc=GRACE_RARITY_COLORS[g.rarity]||'#888';
      const statsStr=Object.entries(g.stats).map(([k,v])=>'+'+v+' '+k).join(' · ');
      html+=`<div class="grace-drag-card" draggable="true" data-grace-id="${g.id}" data-grace-type="${g.type}"
        ondragstart="graceDragStart(event,'${g.id}','${g.type}')"
        ondragend="graceDragEnd(event)"
        style="cursor:grab;background:var(--panel);border:2px solid ${rc};padding:12px;min-width:140px;text-align:center;user-select:none;transition:opacity 0.15s;">
        <div style="font-size:28px;margin-bottom:6px;">${g.icon}</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:${rc};margin-bottom:4px;line-height:1.6;">${g.name}</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:6px;color:var(--dim);margin-bottom:6px;">${g.rarity.toUpperCase()} ${GRACE_TYPE_LABELS[g.type].toUpperCase()}</div>
        <div style="font-size:12px;color:var(--parchment);margin-bottom:8px;">${statsStr}</div>
        <button class="btn" style="font-size:6px;padding:4px 8px;border-color:#3a5a3a;color:#5daa5d;" onclick="event.stopPropagation();graceSellInventory('${g.id}')">SELL 🪙${GRACE_SELL_VALUES[g.rarity]}</button>
      </div>`;
    });
    html+='</div>';
  } else {
    html+='<div style="font-family:\'Press Start 2P\',monospace;font-size:8px;color:var(--dim);padding:20px 0;">No graces yet.<br><br>Defeat bosses to earn graces.</div>';
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
