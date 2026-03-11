
// ══════════════════════════════════════════════════════════
//  PREPARE FOR DESCENT SCREEN
// ══════════════════════════════════════════════════════════

// Temporary loadout: items player has moved from stash to bring into the run
let _prepareLoadout = [];

function openPrepareScreen(){
  _prepareLoadout = [];
  const ov = document.getElementById('prepareOverlay');
  if(!ov) return;

  // Zone label
  const zoneName = (typeof ZONES!=='undefined'&&G) ? ZONES[Math.min(G.zoneIdx,ZONES.length-1)].name : 'the dungeon';
  const zl = document.getElementById('prepareZoneLabel');
  if(zl) zl.textContent = 'Descending into: '+zoneName;

  _renderPrepareScreen();
  ov.classList.add('open');
}

function closePrepareScreen(){
  // Return all loadout items to stash
  if(_prepareLoadout.length > 0){
    const stash = typeof getStash==='function' ? getStash() : [];
    const merged = [...stash, ..._prepareLoadout];
    if(typeof setStash==='function') setStash(merged);
    _prepareLoadout = [];
  }
  document.getElementById('prepareOverlay')?.classList.remove('open');
}

function changeClassFromPrepare(){
  // Return loadout items to stash, close overlay, go to class screen
  closePrepareScreen();
  window._classFromTown = true;
  window._returnToPrepareAfterClass = true;
  if(typeof renderClassSelect==='function') renderClassSelect();
  if(typeof showScreen==='function') showScreen('class');
}

function _renderSkillKit(){
  const kitEl = document.getElementById('prepareSkillKit');
  const rowsEl = document.getElementById('prepareSkillKitRows');
  if(!kitEl||!rowsEl||!G||typeof CLASSES==='undefined') return;
  const cls = CLASSES[G.classId];
  if(!cls) return;

  // Helper: build a full info card for one skill
  function _kitCard(sk, state){
    // state: 'selected' | 'unselected' | 'locked'
    const costStr = sk.cost>0 ? sk.cost+cls.res.charAt(0) : sk.comboReq ? sk.comboReq+'CP' : sk.slotCost ? 'L'+sk.slotCost : '—';
    const cdStr = sk.cd>0 ? 'CD '+sk.cd : sk.charges ? '×'+sk.charges : '—';
    const typeColor = sk.type==='action'?'var(--gold)':sk.type==='bonus'?'#4a9e5c':'#5577cc';
    const clickAttr = state==='locked' ? '' :
      state==='selected' ? `onclick="prepSelectSkill('${sk.id}','')"` :
      `onclick="prepSelectSkill('${sk.id}','')"`;
    return `<div class="prep-kit-card prep-kit-${state}" ${clickAttr}>
      <span class="prep-kit-icon">${iconHTML(sk.icon)}</span>
      <span class="prep-kit-name">${sk.name}</span>
      <span class="prep-kit-desc">${sk.desc}</span>
      <div class="prep-kit-tags">
        <span class="prep-kit-tag" style="color:${typeColor};border-color:${typeColor}33;">${sk.type.toUpperCase()}</span>
        ${costStr!=='—'?`<span class="prep-kit-tag">${costStr}</span>`:''}
        ${cdStr!=='—'?`<span class="prep-kit-tag">${cdStr}</span>`:''}
      </div>
      ${state==='locked'?'<span class="prep-kit-lock-label">ALWAYS IN KIT</span>':''}
    </div>`;
  }

  const types = ['action','bonus','reaction'];
  let rows = [];

  for(const type of types){
    const allOfType = cls.skills.filter(s=>s.type===type&&!s.ultimateOnly&&!s.subclassOnly);
    const nonAlt = allOfType.filter(s=>!s.alt&&s.id!=='attack');
    const altPool = allOfType.filter(s=>s.alt).slice();
    // Only show pairs where both a base and an alt exist
    for(const sk of nonAlt){
      const alt = altPool.shift();
      if(!alt) continue;
      const isAltSelected = G.skillLoadout && G.skillLoadout.includes(alt.id) && !G.skillLoadout.includes(sk.id);
      const baseState = isAltSelected ? 'unselected' : 'selected';
      const altState  = isAltSelected ? 'selected'   : 'unselected';
      const typeColor = type==='action'?'var(--gold)':type==='bonus'?'#4a9e5c':'#5577cc';
      const typeBorder = type==='action'?'rgba(200,168,75,0.3)':type==='bonus'?'rgba(74,158,92,0.3)':'rgba(85,119,204,0.3)';
      function tagRow(s){ return `<div class="prep-kit-tags"><span class="prep-kit-tag" style="color:${typeColor};border-color:${typeBorder};">${type.toUpperCase()}</span>${s.cost>0?`<span class="prep-kit-tag">${s.cost}${cls.res.charAt(0)}</span>`:''}${s.cd>0?`<span class="prep-kit-tag">CD ${s.cd}</span>`:s.charges?`<span class="prep-kit-tag">×${s.charges}</span>`:''}</div>`; }
      rows.push(`<div class="prep-kit-row">
        <div class="prep-kit-card prep-kit-${baseState}" onclick="prepSelectSkill('${sk.id}','${alt.id}')">
          <span class="prep-kit-icon">${iconHTML(sk.icon)}</span>
          <span class="prep-kit-name">${sk.name}</span>
          <span class="prep-kit-desc">${sk.desc}</span>
          ${tagRow(sk)}
        </div>
        <div class="prep-kit-vs">VS</div>
        <div class="prep-kit-card prep-kit-${altState}" onclick="prepSelectSkill('${alt.id}','${sk.id}')">
          <span class="prep-kit-icon">${iconHTML(alt.icon)}</span>
          <span class="prep-kit-name">${alt.name}</span>
          <span class="prep-kit-desc">${alt.desc}</span>
          ${tagRow(alt)}
        </div>
      </div>`);
    }
  }

  if(!rows.length){kitEl.style.display='none';return;}
  kitEl.style.display='block';
  rowsEl.innerHTML = rows.join('');
}

function prepSelectSkill(selectId, deselectId){
  if(!G) return;
  // Initialize loadout to default (non-alt, non-subclass) kit if null
  if(!G.skillLoadout){
    const cls = CLASSES[G.classId];
    G.skillLoadout = cls.skills
      .filter(s=>!s.ultimateOnly && !s.alt &&
        (!s.subclassOnly || (G.level>=3 && G.subclassId && s.subclassId===G.subclassId)))
      .map(s=>s.id);
  }
  // Remove deselected, add selected
  if(deselectId) G.skillLoadout = G.skillLoadout.filter(id=>id!==deselectId);
  if(selectId && !G.skillLoadout.includes(selectId)) G.skillLoadout.push(selectId);
  _renderSkillKit();
}

function _renderPrepareScreen(){
  const rc = {common:'#9a8868',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#9b54bd',legendary:'var(--gold)'};
  const stash = typeof getStash==='function' ? getStash() : [];

  // Stash count
  const stashCount = document.getElementById('prepareStashCount');
  if(stashCount) stashCount.textContent = '('+stash.length+')';

  // Skill Kit section — initialize loadout to default (non-alt, non-subclass) kit if not yet set
  if(!G.skillLoadout && typeof CLASSES!=='undefined' && CLASSES[G.classId]){
    const cls = CLASSES[G.classId];
    G.skillLoadout = cls.skills
      .filter(s=>!s.ultimateOnly && !s.alt &&
        (!s.subclassOnly || (G.level>=3 && G.subclassId && s.subclassId===G.subclassId)))
      .map(s=>s.id);
  }
  _renderSkillKit();

  // Loadout count (excluding the locked starter weapon)
  const loadoutCount = document.getElementById('prepareLoadoutCount');
  const nonStarter = _prepareLoadout.filter(i=>!i._starterLocked);
  if(loadoutCount) loadoutCount.textContent = '('+nonStarter.length+'/18)';

  // Stash grid
  const stashGrid = document.getElementById('prepareStashGrid');
  if(stashGrid){
    if(stash.length === 0){
      stashGrid.innerHTML = '<div class="prepare-empty">Stash is empty.<br>Buy items from Mirela first.</div>';
    } else {
      stashGrid.innerHTML = stash.map((item,i)=>{
        if(!item) return '';
        const col = rc[item.rarity]||'#888';
        const statsStr = Object.entries(item.stats||{}).filter(([k,v])=>v&&k!=='heal').map(([k,v])=>`+${v} ${k}`).join(' ');
        const healStr = item.stats&&item.stats.heal ? `heals ${item.stats.heal}HP` : '';
        return `<div class="prepare-item" onclick="prepMoveToLoadout(${i})" title="${item.name}${statsStr||healStr?' · '+(statsStr||healStr):''}">
          <span class="prepare-item-icon">${iconHTML(item.icon)}</span>
          <span class="prepare-item-name" style="color:${col}">${item.name}</span>
          <span class="prepare-item-stat">${statsStr||healStr}</span>
        </div>`;
      }).join('');
    }
  }

  // Loadout grid
  const loadoutGrid = document.getElementById('prepareLoadoutGrid');
  if(loadoutGrid){
    // Starter weapon always shown first, locked
    const starterSlot = G && G.equipped && G.equipped.weapon
      ? `<div class="prepare-item prepare-item-locked" title="Starter weapon — locked in">
          <span class="prepare-item-icon">${iconHTML(G.equipped.weapon.icon)}</span>
          <span class="prepare-item-name" style="color:#9a8868">${G.equipped.weapon.name}</span>
          <span class="prepare-item-stat" style="color:var(--dim)">STARTER</span>
        </div>`
      : '';
    const loadoutItems = _prepareLoadout.map((item,i)=>{
      const col = rc[item.rarity]||'#888';
      const statsStr = Object.entries(item.stats||{}).filter(([k,v])=>v&&k!=='heal').map(([k,v])=>`+${v} ${k}`).join(' ');
      const healStr = item.stats&&item.stats.heal ? `heals ${item.stats.heal}HP` : '';
      return `<div class="prepare-item prepare-item-loaded" onclick="prepMoveToStash(${i})" title="Click to return to stash">
        <span class="prepare-item-icon">${iconHTML(item.icon)}</span>
        <span class="prepare-item-name" style="color:${col}">${item.name}</span>
        <span class="prepare-item-stat">${statsStr||healStr}</span>
      </div>`;
    }).join('');
    loadoutGrid.innerHTML = starterSlot + loadoutItems;
  }
}

function prepMoveToLoadout(stashIdx){
  // Max 18 non-starter items in loadout
  if(_prepareLoadout.length >= 18){ townFlash('Loadout is full! (18 items max)'); return; }
  const stash = typeof getStash==='function' ? getStash() : [];
  const item = stash[stashIdx];
  if(!item) return;
  // Remove from stash
  if(typeof removeFromStash==='function') removeFromStash(stashIdx);
  _prepareLoadout.push({...item});
  _renderPrepareScreen();
}

function prepMoveToStash(loadoutIdx){
  const item = _prepareLoadout[loadoutIdx];
  if(!item) return;
  _prepareLoadout.splice(loadoutIdx, 1);
  if(typeof addToStash==='function') addToStash({...item});
  _renderPrepareScreen();
}

function doDescend(){
  const loadoutSnapshot = [..._prepareLoadout];
  _prepareLoadout = [];
  document.getElementById('prepareOverlay')?.classList.remove('open');
  stopTownEngine();
  townEnterDungeon(); // resets G to fresh state first
  // Now inject stash items — auto-equip by slot, bump displaced item to inventory
  if(typeof G!=='undefined'&&G&&loadoutSnapshot.length>0){
    for(const item of loadoutSnapshot){
      const slot = item.slot;
      if(slot && G.equipped && slot in G.equipped){
        const displaced = G.equipped[slot];
        if(displaced){
          if(typeof removeItemStats==='function') removeItemStats(displaced);
          const emptyIdx = G.inventory.findIndex(s=>s===null);
          if(emptyIdx !== -1) G.inventory[emptyIdx] = {...displaced};
        }
        G.equipped[slot] = {...item};
        if(typeof applyItemStats==='function') applyItemStats(item);
      } else {
        const emptyIdx = G.inventory.findIndex(s=>s===null);
        if(emptyIdx !== -1) G.inventory[emptyIdx] = {...item};
      }
    }
  }
}

// ── Utility ───────────────────────────────────────────────
function _rrect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

// ══════════════════════════════════════════════════════════
//  BUILDING DIALOGS (Rook, Seraphine, Aldric, Malachar)
// ══════════════════════════════════════════════════════════
let _activeDlg=null;
// ── Persistent Loadout HUD ─────────────────────────────────
function updateTownLoadout(){
  const el = document.getElementById('townLoadoutHUD');
  if(!el) return;
  if(!G || !G.classId){
    el.innerHTML = `<div style="text-align:center;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(200,168,75,0.15);">
      <div style="font-size:14px;color:rgba(200,168,75,0.4);letter-spacing:3px;">⚔ LOADOUT</div>
    </div>
    <div style="font-size:11px;color:#444;text-align:center;padding:12px 0;line-height:2.2;">Prepare for your descent.<br>Buffs &amp; gear will appear here.</div>`;
    return;
  }
  const cid = G.classId;
  const ci = {fighter:'⚔',wizard:'📖',rogue:'🗡',paladin:'✝',ranger:'🏹',barbarian:'🩸',cleric:'☀',druid:'🌿'}[cid]||'?';
  const cn = cid.charAt(0).toUpperCase()+cid.slice(1);

  const row = (icon,label,val,col) => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
    <span style="font-size:18px;width:22px;text-align:center;flex-shrink:0;">${icon}</span>
    <span style="font-size:10px;color:#999;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${label}</span>
    ${val?`<span style="font-size:10px;color:${col||'#c8a84b'};flex-shrink:0;">${val}</span>`:''}
  </div>`;
  const emptyRow = (text) => `<div style="font-size:10px;color:#3a3a3a;padding:4px 0 4px 30px;font-style:italic;">${text}</div>`;
  const secHead = (label,col) => `<div style="font-size:10px;color:${col||'#555'};letter-spacing:2px;margin-top:10px;margin-bottom:4px;">${label}</div>`;

  let html = '';

  // ── Header ──
  html += `<div style="text-align:center;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid rgba(200,168,75,0.15);">
    <div style="font-size:14px;color:#c8a84b;letter-spacing:3px;">⚔ LOADOUT</div>
  </div>`;

  // ═══════════════════════════════════════
  // 1. PROVING GROUNDS
  // ═══════════════════════════════════════
  html += secHead('🏛 UPGRADES','#c08040');
  const slot = typeof activeSaveSlot!=='undefined' ? activeSaveSlot : null;
  const pu = slot && typeof getPermanentUpgrades==='function' ? getPermanentUpgrades(slot) : {};
  let hasUpgrades = false;
  PERMANENT_UPGRADES.forEach(u => {
    const lvl = pu[u.id]||0;
    if(lvl <= 0) return;
    if(u.forClass && u.forClass !== cid) return;
    hasUpgrades = true;
    const pips = Array.from({length:u.maxLvl}, (_,i) => i<lvl ? '<span style="color:#c08040">●</span>' : '<span style="color:#332a1a">○</span>').join('');
    html += row(u.icon, u.name, pips, '#c08040');
  });
  if(!hasUpgrades) html += emptyRow('Visit the Proving Grounds');

  // ═══════════════════════════════════════
  // 2. GRACES
  // ═══════════════════════════════════════
  html += secHead('✨ GRACES','#b06ad4');
  const graces = typeof getEquippedGraces==='function' ? getEquippedGraces(cid) : [];
  let hasGraces = false;
  graces.forEach(g => {
    if(!g) return;
    hasGraces = true;
    const rc = GRACE_RARITY_COLORS[g.rarity]||'#888';
    const short = Object.entries(g.stats).map(([k,v])=>'+'+v+' '+k.substring(0,3)).join(' ');
    html += row(g.icon, g.name, short, rc);
    if(g.passive && g.passive.desc){
      html += `<div style="padding:3px 0 3px 30px;font-size:10px;color:var(--gold);line-height:1.6;">★ ${g.passive.desc}</div>`;
    }
  });
  if(!hasGraces) html += emptyRow('Equip graces at the Vault');

  // ═══════════════════════════════════════
  // 3. TOWN BUFFS
  // ═══════════════════════════════════════
  html += secHead('🏘 TOWN','#60a0d0');
  let hasTown = false;
  if(TOWN._sharpenApplied){
    hasTown = true;
    html += row('⚒', 'Sharpened', '+2 '+(typeof getOffensiveStatLabel==='function'&&G?getOffensiveStatLabel(G):'ATK'), '#ff7030');
  }
  if(TOWN.blessingUsed && SHRINE_BLESSINGS[cid]){
    hasTown = true;
    const bl = SHRINE_BLESSINGS[cid];
    html += row('⛪', bl.name, '', '#a0c4ff');
  }
  if(!hasTown){
    if(!TOWN._sharpenApplied) html += emptyRow('⚒ Forge — sharpen weapon');
    if(!TOWN.blessingUsed)    html += emptyRow('⛪ Shrine — receive blessing');
  }

  // ═══════════════════════════════════════
  // 4. SET BONUSES
  // ═══════════════════════════════════════
  if(typeof SET_BONUSES!=='undefined' && G.activeSets){
    const activeSets = Object.entries(G.activeSets).filter(([sid,count])=>count>=2 && SET_BONUSES[sid]);
    if(activeSets.length > 0){
      html += secHead('✦ SETS','#d0a040');
      activeSets.forEach(([sid,count])=>{
        const sd = SET_BONUSES[sid];
        for(let t=2;t<=3;t++){
          if(count>=t && sd.bonuses[t]){
            html += row('✦', sd.name+' ('+t+'pc)', '', '#d0a040');
          }
        }
      });
    }
  }

  el.innerHTML = html;
}

function townOpenDialog(id){
  _activeDlg=id;
  const ov=document.getElementById('townDialogOverlay');
  const ti=document.getElementById('townDialogTitle');
  const co=document.getElementById('townDialogContent');
  if(!ov) return;
  const titles={tavern:'🍺 The Rusted Flagon',temple:'⛪ Shrine of Seraphine',forge:"⚒ Aldric's Forge",malachar:"📚 Malachar's Study",notice:'📋 Notice Board','mirela_shop':"🛍 Mirela's Goods",stash:'📦 Your Stash',upgrades:'🏛 The Proving Grounds'};
  ti.textContent=titles[id]||id;
  if(id==='tavern')        co.innerHTML=_dlgTavern();
  if(id==='temple')        co.innerHTML=_dlgTemple();
  if(id==='forge')         co.innerHTML=_dlgForge();
  if(id==='malachar')      co.innerHTML=_dlgMalachar();
  if(id==='notice')        co.innerHTML=_dlgNotice();
  if(id==='mirela_shop')   co.innerHTML=_dlgMirelaShop();
  if(id==='stash')         co.innerHTML=_dlgStash();
  if(id==='upgrades')      co.innerHTML=_dlgUpgrades();
  ov.classList.toggle('mirela-open', id==='mirela_shop');
  ov.classList.toggle('vareth-open', id==='upgrades');
  ov.classList.add('open');
  // Auto-hide loadout HUD so it doesn't overlap the dialog
  const lhud=document.getElementById('townLoadoutHUD');
  if(lhud) lhud.classList.add('loadout-hidden');
  // Hide pause button when Mirela's or Vareth's fullscreen is open
  const pb=document.getElementById('townPauseBtn');
  if(pb) pb.style.display = (id==='mirela_shop'||id==='upgrades') ? 'none' : '';
}
function townCloseDialog(){ _activeDlg=null; const _ov=document.getElementById('townDialogOverlay'); if(_ov){_ov.classList.remove('open');_ov.classList.remove('mirela-open');_ov.classList.remove('vareth-open');}
  const lhud=document.getElementById('townLoadoutHUD');
  if(lhud) lhud.classList.remove('loadout-hidden');
  const pb=document.getElementById('townPauseBtn');
  if(pb) pb.style.display='';
}

// ── NPC Service Data ──────────────────────────────────────
const SHRINE_BLESSINGS={
  fighter:{icon:'⚔',name:'Battle Fury',     desc:'Crit range expanded by 2.',        apply:()=>{G.critRange=Math.max(16,(G.critRange||20)-2);}},
  wizard: {icon:'📖',name:'Arcane Surge',    desc:'+1 to each spell slot level.',     apply:()=>{if(G.spellSlots)Object.keys(G.spellSlots).forEach(k=>G.spellSlots[k]++);}},
  rogue:  {icon:'🗡',name:"Shadow's Edge",   desc:'First strike is a guaranteed crit.',apply:()=>{G._townBlessingFirstCrit=true;}},
  paladin:{icon:'✝', name:'Divine Favor',   desc:'Lay on Hands pool doubled.',       apply:()=>{G.layOnHandsPool=(G.layOnHandsPool||5)*2;}},
  ranger: {icon:'🏹',name:"Predator's Mark", desc:"Hunter's Mark costs no concentration.",apply:()=>{G._townBlessingFreeHM=true;}},
  barbarian:{icon:'🩸',name:'Blood Rite',    desc:'Rage lasts 2 extra rounds.',       apply:()=>{G._townBlessingRageBonus=2;}},
  cleric: {icon:'☀', name:'Holy Renewal',   desc:'Channel Divinity recharges on short rest.',apply:()=>{G._townBlessingCDRecharge=true;}},
  druid:  {icon:'🌿',name:"Nature's Grace",  desc:'Wild Shape can be entered as a bonus action.',apply:()=>{G._townBlessingWildFree=true;}},
};
const ROOK_ZONES=[
  // State 0 — Zone I area
  ["I scouted those woods once. Once.","The Thornwarden's roots move underground. Watch your footing.","It slammed Kareth into a tree so hard we buried him and the tree. ...Pour me another?"],
  // State 1 — Zones II-III area
  ["Grakthar. Yeah. I knew men who served under him — before.","His Bellow broke three men's nerves. WIS save, they said. In practice you just ran.","He still thinks the war's going. Don't try to reason. Just fight."],
  // State 2 — Zones IV-V area
  ["Half the market packed up last night. Can't blame them.","Something's pulling the darkness up from below. I can feel it in the floorboards.","That horn's been sounding for three days. You hear it too, right?"],
  // State 3a — Zone V surfacing (after Zareth, zoneIdx ~5)
  ["The horn stopped. Three days and then silence. I don't know which is worse.","You come back different every time. This time it's something in the eyes. Like you heard something you weren't meant to.","Something settled tonight. Through the floorboards — not the shaking kind. The other kind."],
  // State 3b — Zone VI surfacing (after Valdris, zoneIdx ~6)
  ["I dreamed of soldiers last night. Hundreds of them, standing down. Woke up feeling lighter than I have in years.","The stool. Thirty years. Tonight it finally feels like mine again — not kept, not waiting. Just mine.","It's just the few of us now. Somehow that's not sad. It's the right number."],
  // State 4 — Zone VII+
  ["I dreamed about you last night. You were standing at the Gate. You looked... old.","I don't know what's at the bottom. But I know you're meant to find it.","Come back, yeah? I'll keep the stool."]
];
// One line per boss — shown when that boss is the highest one defeated this save
const ROOK_BOSS_KILL_LINES=[
  "Thornwarden's down, then. Good. Those roots were getting philosophical.",
  "Grakthar. Didn't think anyone could still reach him. Apparently I was wrong.",
  "Vexara's brand — I can still see the shape of it on you. You wore it. You didn't break.",
  "Nethrix. The Devourer. Don't know what that means exactly. I know it sounds bad and you're still walking.",
  "Zareth. You read the charge coming, held your nerve, hit back. That's the whole fight, isn't it.",
  "Valdris the Unbroken. Broken now. I'll drink to that.",
  "Auranthos the Blind God. I don't know what a blind god sees at the end. You do now.",
  "The Hollow Empress. Whatever she was holding down there — whatever she'd swallowed — it's done."
];
const ROOK_CLASS={fighter:"Fighter, yeah? Good. Someone who can take a hit.",wizard:"Wizard. Try not to blow up the tavern. Last one did.",rogue:"Rogue, eh. I'm counting my coinpurse when you leave.",paladin:"Paladin. You people never buy the cheap rounds.",ranger:"Ranger! Those wolves aren't pets, by the way.",barbarian:"Sit anywhere — just not that stool. It's still not quite right.",cleric:"Cleric. Heal me while you're at it? My knee's been a nightmare.",druid:"Don't turn into anything in here. Bear in the beer cellar. Long story."};
const SERA_ZONES=[
  "The woods remember old blood. Let the Shrine cleanse what clings to you.",
  "The Outpost is a place of unfinished things. Carry the light in.",
  "The Shrine fire has been burning without oil for three days. I do not understand it. But I trust it.",
  // State 3a — Zone V surfacing
  "The fire shifted tonight — warmer than it has been. Something between what it was and what it is becoming. I do not have words for it yet.",
  // State 3b — Zone VI surfacing
  "The others have gone. The fire burns gold now. I think it is waiting for something.",
  "Whatever you find at the bottom — know that the Shrine burned for you. It always did."
];
const SERA_CLASS={fighter:"Your strength is your shield. The Shrine blesses the body that never breaks.",wizard:"The Shrine welcomes minds as well as swords.",rogue:"You move like someone who has had to. The Shrine does not judge.",paladin:"The light in you is genuine. The Shrine recognises its own.",ranger:"You carry the wild in you — the blessing will anchor you.",barbarian:"Fury is a kind of prayer too, if directed rightly.",cleric:"A fellow servant. I'll simply add my voice to yours.",druid:"The old ways and the Shrine's ways are older than their argument."};
const ALDRIC_ZONES=[
  "These woods'll dull a blade faster than any whetstone.",
  "Undead rust iron from the inside out. Enchanted gear holds better.",
  "I've been forging something for weeks. Don't know who it's for yet. Feels like I'm waiting for the right hands.",
  // State 3a — Zone V surfacing
  "Something I've been making is almost done. Every time I work on it, it gets more certain. Like it knows who it's for before I do.",
  // State 3b — Zone VI surfacing
  "It's done. I'm not showing it yet — I'll know when the time's right. Whatever you need before the next run, I'm here.",
  "Take this. I think... I think it was always meant for you."
];
const ALDRIC_CLASS={fighter:"Good build. Keep the sword oiled — blood dries fast.",wizard:"Staff reinforcements. Mages keep breaking them.",rogue:"Short blade with a hollow handle — you'll know what it's for.",paladin:"Divine-blessed steel holds an edge longer.",ranger:"Broadhead tips that punch through chitin.",barbarian:"You're going to destroy whatever I give you. Take the cheap stuff.",cleric:"Holy-water tempered chainmail if you need it.",druid:"Most druids just grow thorns. But welcome."};
const MALACHAR_ZONES=[
  "The Whispering Woods are older than this town. Something grew there before trees knew how.",
  "The garrison watched the east. The incursion came from below.",
  "I found your name in a document three hundred years old. Redacted from every official record. I am afraid of what it means.",
  // State 3a — Zone V surfacing
  "The document, the inscription, the accounts that contradict the official histories — I have been cross-referencing all week. They point to the same redacted name. I am beginning to understand what they buried.",
  // State 3b — Zone VI surfacing
  "The Gate inscription keeps changing. The latest addition is a name I can almost read. I am writing everything down.",
  "One line left to translate. When you come back — I will read it to you."
];
const MALACHAR_CLASS={fighter:"Ah, a warrior. Direct. Good.",wizard:"A fellow practitioner! Your posture suggests Evocation.",rogue:"The most interesting documents were stolen by rogues. I'm simply noting.",paladin:"Complicated feelings about holy orders. You personally seem fine.",ranger:"Rangers are underestimated. The natural world has more tactical info than any library.",barbarian:"I once argued berserkers were the original philosophers. I stand by it.",cleric:"Which deity? Don't tell me — let me guess from your sigil.",druid:"Druids always make me feel I've wronged a plant."};
// Per-legendary-item reactions — keyed by item ID
const MALACHAR_LEGENDARY_LINES={
  glacialCrown:     "The Glacial Crown of Valdris. Three manuscripts said it was lost to the ice. Evidently the ice disagreed.",
  godslayerBlade:   "That blade... the Godslayer. I've read every account of it. They all end badly for everyone except the blade.",
  voidcrownOfMalvaris:"Malvaris's Voidcrown. She wore it for two hundred years. The fact that you have it means she doesn't. I have many questions.",
  shardOfEternity:  "The Shard of Eternity. I wrote my thesis on why it couldn't exist. I'm prepared to revise my conclusions.",
  wraithbane:       "Wraithbane. It was forged to kill something specific. I'd very much like to know if it succeeded.",
  tombwardenSeal:   "The Tombwarden's Seal. Ancient. Pre-dates the dungeon, if my dating is right. It shouldn't be in circulation.",
  seraphimWings:    "Seraphim's Mantle. The manuscripts say it was worn by the last of the Celestials. It was supposedly unmakeable.",
};
const MALACHAR_LEGENDARY_DEFAULT="That item — I don't recognise it from any catalogue I own. That's either very bad or very interesting.";

function _dlgTavern(){
  const cid=G?G.classId:'fighter';let zi=_townState(_townBossCount());if(zi===3&&G&&G.zoneIdx>=6)zi=4;else if(zi>=4)zi=5;zi=Math.min(zi,ROOK_ZONES.length-1);
  const baseLines=ROOK_ZONES[zi]||[];
  // Inject a boss-specific line for the highest boss killed this save
  const lastBoss=G&&G.bossDefeated?G.bossDefeated.reduce((hi,v,i)=>v?i:hi,-1):-1;
  const bossLine=lastBoss>=0?ROOK_BOSS_KILL_LINES[lastBoss]:null;
  const lines=bossLine?[bossLine,...baseLines]:baseLines;
  const rHtml=lines.map((l,i)=>`<div class="td-line${i===0?' active':''}" onclick="this.closest('.td-lines').querySelectorAll('.td-line').forEach(x=>x.classList.remove('active'));this.classList.add('active')">${i===0?'🗣':'💬'} ${l}</div>`).join('');
  const drink=TOWN.tavernDrinkUsed?`<div class="td-used">🍺 You've had your drink.</div>`:`<button class="td-btn" onclick="townBuyDrink()">🍺 Buy Rook a drink (5g) — hear a rumor</button>`;
  return `<div class="td-portrait">🍺</div><div class="td-name">Rook <span class="td-sub">Ex-soldier. Permanently at the bar.</span></div><div class="td-greeting">"${ROOK_CLASS[cid]||'Welcome.'}"</div><div class="td-lines">${rHtml}</div><div style="margin-top:10px">${drink}</div>`;
}
function _dlgTemple(){
  const cid=G?G.classId:'fighter';let zi=_townState(_townBossCount());if(zi===3&&G&&G.zoneIdx>=6)zi=4;else if(zi>=4)zi=5;zi=Math.min(zi,SERA_ZONES.length-1);
  const bl=SHRINE_BLESSINGS[cid];
  const bHtml=TOWN.blessingUsed?`<div class="td-used">✝ Blessing granted.</div>`:bl?`<div class="td-blessing-card"><div class="td-blessing-icon">${bl.icon}</div><div><div class="td-blessing-name">${bl.name}</div><div class="td-blessing-desc">${bl.desc}</div></div></div><button class="td-btn td-btn-holy" onclick="townReceiveBlessing()">✝ Receive Blessing</button>`:'';
  const healHtml=G&&G.hp<G.maxHp?`<button class="td-btn" style="margin-top:8px" onclick="townFullHeal()">💖 Pray for healing (full HP)</button>`:`<div class="td-used" style="margin-top:8px">💖 You are at full health.</div>`;
  // Shrine fire glow shifts as zones deepen: cool white → amber → gold → deep red → radiant gold
  const shrineGlow=['rgba(200,215,255,0.7)','rgba(255,210,120,0.7)','rgba(255,150,50,0.75)','rgba(255,120,20,0.8)','rgba(210,165,25,0.95)','rgba(200,168,75,1)'][zi];
  return `<div class="td-portrait" style="filter:drop-shadow(0 0 10px ${shrineGlow}) drop-shadow(0 0 4px ${shrineGlow})">⛪</div><div class="td-name">Seraphine <span class="td-sub">Shrine Keeper</span></div><div class="td-greeting">"${SERA_CLASS[cid]||'Welcome.'}"</div><div class="td-zoneline">"${SERA_ZONES[zi]}"</div>${bHtml}${healHtml}`;
}
function _dlgForge(){const cid=G?G.classId:'fighter';let zi=_townState(_townBossCount());if(zi===3&&G&&G.zoneIdx>=6)zi=4;else if(zi>=4)zi=5;zi=Math.min(zi,ALDRIC_ZONES.length-1);const hasMats=G&&G.inventory&&G.inventory.some(i=>i&&i.type==='material');const sell=hasMats?`<button class="td-btn" onclick="townSellMaterials()">💰 Sell all materials</button>`:`<div class="td-used">No materials to sell.</div>`;const offLabel=typeof getOffensiveStatLabel==='function'&&G?getOffensiveStatLabel(G):'ATK';const sharpen=TOWN.forgeVisited?`<div class="td-used">⚒ Already sharpened.</div>`:`<button class="td-btn" onclick="townSharpenWeapon()">⚒ Sharpen weapon — +2 ${offLabel} (15g)</button>`;return `<div class="td-portrait">⚒</div><div class="td-name">Aldric <span class="td-sub">Blacksmith</span></div><div class="td-greeting">"${ALDRIC_CLASS[cid]||'Need something forged?'}"</div><div class="td-zoneline">"${ALDRIC_ZONES[zi]}"</div><div style="margin-top:12px">${sharpen}<div style="margin-top:8px">${sell}</div></div>`;}
function _dlgMalachar(){
  const cid=G?G.classId:'fighter';let zi=_townState(_townBossCount());if(zi===3&&G&&G.zoneIdx>=6)zi=4;else if(zi>=4)zi=5;zi=Math.min(zi,MALACHAR_ZONES.length-1);
  const donations=(typeof getWizardDonations==='function')?getWizardDonations():0;
  const tier=(typeof getShopTier==='function')?getShopTier():1;
  const tiers=['Standard','Rare','Legendary'];
  const donate=tier<3?`<button class="td-btn" onclick="townDonateMalachar(100)">📚 Donate 100g for research access</button>`:`<div class="td-used">📚 Full catalogue unlocked.</div>`;
  // Legendary item acknowledgment
  const legItem=G&&G.equipped?Object.values(G.equipped).find(it=>it&&it.rarity==='legendary'):null;
  const legHtml=legItem?`<div class="td-zoneline" style="color:#b07830;margin-top:6px">"${MALACHAR_LEGENDARY_LINES[legItem.id]||MALACHAR_LEGENDARY_DEFAULT}"</div>`:'';
  return `<div class="td-portrait">📚</div><div class="td-name">Malachar the Grey <span class="td-sub">Scholar</span></div><div class="td-greeting">"${MALACHAR_CLASS[cid]||'Ah.'}"</div><div class="td-zoneline">"${MALACHAR_ZONES[zi]}"</div>${legHtml}<div class="td-donate-info">Donated: <span style="color:var(--gold)">${donations}g</span> · Tier: <span style="color:var(--gold)">${tiers[tier-1]||'Standard'}</span></div><div style="margin-top:10px">${donate}</div>`;
}
function _dlgNotice(){const zi=G?G.zoneIdx:0;const tips={fighter:"Don't burn Relentless early.",wizard:"Spell slot economy is everything.",rogue:"Exploit every Advantage. Sneak Attack ends fights early.",paladin:"Smite on crits — always.",ranger:"Hunter's Mark is your engine.",barbarian:"Rage before the first hit.",cleric:"Channel Divinity often beats spells.",druid:"Wild Shape is a second life bar."};const tease=["🍄 Strange fungi near the old forest path. Collectors or idiots only.","🏛 A vault beneath the Outpost road. Loot unclaimed."];const zone=typeof ZONES!=='undefined'?ZONES[Math.min(zi,ZONES.length-1)]:null;let html='';if(zone)html+=`<div class="nb-notice nb-warning"><div class="nb-tag">⚠ DUNGEON REPORT</div><div class="nb-title">Threat: ${zone.name}</div><div class="nb-desc">Scouts report ${zone.kills} contacts before the zone commander.</div></div>`;if(zi<tease.length)html+=`<div class="nb-notice nb-rumor"><div class="nb-tag">📌 RUMOR</div><div class="nb-desc">${tease[zi]}</div></div>`;const cid=G?G.classId:null;if(cid&&tips[cid])html+=`<div class="nb-notice nb-tip"><div class="nb-tag">💡 TIP</div><div class="nb-desc">${tips[cid]}</div></div>`;
  if(typeof ZONES!=='undefined'){const loreZones=ZONES.filter((_,i)=>i<=(G?G.zoneIdx:0));if(loreZones.length){html+='<div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px;">';html+='<div class="nb-tag" style="margin-bottom:10px;">📖 ZONE LORE</div>';html+=loreZones.map(z=>`<div class="nb-notice" style="margin-bottom:10px;"><div class="nb-title">${z.num?'Zone '+z.num+' — ':''}${z.name}</div><div class="nb-desc" style="font-style:italic;line-height:1.6;">${z.story&&z.story.text?z.story.text:''}</div></div>`).join('');html+='</div>';}}
  return html||'<div class="td-used">No current notices.</div>';}

function townBuyDrink(){if(!G||G.gold<5){townFlash('Not enough gold!');return;}G.gold-=5;TOWN.tavernDrinkUsed=true;if(typeof log==='function')log("🍺 Rook: 'Generous soul.'",'l');if(typeof renderAll==='function')renderAll();document.getElementById('townDialogContent').innerHTML=_dlgTavern();setTimeout(()=>{const ls=document.querySelectorAll('.td-line');ls.forEach(l=>l.classList.remove('active'));if(ls[ls.length-1])ls[ls.length-1].classList.add('active');},80);}
function townReceiveBlessing(){if(TOWN.blessingUsed||!G)return;const bl=SHRINE_BLESSINGS[G.classId];if(!bl)return;TOWN.blessingUsed=true;bl.apply();if(typeof log==='function')log(`✝ Seraphine: "${bl.name} — ${bl.desc}"`,'l');document.getElementById('townDialogContent').innerHTML=_dlgTemple();updateTownLoadout();}
function townFullHeal(){if(!G)return;const h=G.maxHp-G.hp;G.hp=G.maxHp;if(typeof log==='function')log('💖 Shrine restores your wounds. (+'+h+' HP)','l');if(typeof renderAll==='function')renderAll();document.getElementById('townDialogContent').innerHTML=_dlgTemple();}
function townSharpenWeapon(){if(!G||G.gold<15){townFlash('Need 15g!');return;}if(TOWN.forgeVisited)return;G.gold-=15;addOffensiveStat(G,2);TOWN._sharpenApplied=true;TOWN.forgeVisited=true;const lbl=typeof getOffensiveStatLabel==='function'?getOffensiveStatLabel(G):'ATK';if(typeof log==='function')log('⚒ Aldric sharpens your weapon. (+2 '+lbl+')','l');if(typeof renderAll==='function')renderAll();document.getElementById('townDialogContent').innerHTML=_dlgForge();updateTownLoadout();}
function townSellMaterials(){if(!G)return;let g=0,c=0;G.inventory=G.inventory.map(item=>{if(item&&item.type==='material'){g+=(item.value||5);c++;return null;}return item;});G.gold+=g;G.totalGold+=g;if(typeof log==='function')log(`⚒ Aldric bought ${c} material${c!==1?'s':''} for ${g}g.`,'l');if(typeof renderAll==='function')renderAll();document.getElementById('townDialogContent').innerHTML=_dlgForge();}
function townDonateMalachar(amount){if(!G||G.gold<amount){townFlash(`Need ${amount}g!`);return;}if(typeof cfDonateWizard==='function')cfDonateWizard(amount);else G.gold-=amount;if(typeof renderAll==='function')renderAll();document.getElementById('townDialogContent').innerHTML=_dlgMalachar();}
function townFlash(msg){const el=document.getElementById('townFlash');if(!el)return;el.textContent=msg;el.classList.add('visible');setTimeout(()=>el.classList.remove('visible'),2200);}

// ══════════════════════════════════════════════════════════
//  VARETH'S PROVING GROUNDS — Permanent Upgrade Shop
// ══════════════════════════════════════════════════════════
const VARETH_CLASS={
  fighter:"A soldier's stance. Good. Discipline wins more fights than strength.",
  wizard:"A mind is the sharpest weapon — but a prepared mind is sharper still.",
  rogue:"Speed without preparation is just running. Let me show you focus.",
  paladin:"Your oath gives you purpose. Let me give you the edge to fulfill it.",
  ranger:"The wild teaches patience. I teach everything else.",
  barbarian:"Raw power brought you here. Refined power will bring you back.",
  cleric:"Faith heals, but steel protects. Let me help with the steel part.",
  druid:"Nature's strength is vast. Let me help you carry more of it with you."
};
const VARETH_ZONES=["These woods test newcomers. Let me make sure you're not one.","The Outpost claimed better warriors than you. Preparation is the difference.","The deeper you go, the more every small advantage matters.","At this depth, there are no second chances. Only readiness."];

function _dlgUpgrades(){
  const cid=G?G.classId:'fighter';
  const zi=Math.min(G?G.zoneIdx:0,VARETH_ZONES.length-1);
  const midRun = typeof G !== 'undefined' && G && G.classId;
  const gold = midRun ? G.gold : (typeof getPersistentGold==='function' ? getPersistentGold() : 0);
  const goldLabel = midRun ? 'Run Gold' : 'Town Gold';
  const ups = typeof getPermanentUpgrades==='function' ? getPermanentUpgrades() : {};

  function upgradeCard(u, isClass){
    const curLvl = ups[u.id]||0;
    const maxed = curLvl >= u.maxLvl;
    const cost = maxed ? 0 : (typeof getUpgradeCost==='function' ? getUpgradeCost(u.id, curLvl) : Infinity);
    const canBuy = !maxed && gold >= cost;
    const isMyClass = isClass && u.forClass === cid;

    // Progress bar
    const pips = Array.from({length:u.maxLvl},(_,i)=>`<span class="pg-pip ${i<curLvl?'pg-pip-on':''}">${i<curLvl?'●':'○'}</span>`).join('');

    return `<div class="pg-card ${maxed?'pg-card-maxed':canBuy?'pg-card-buy':'pg-card-dim'} ${isMyClass?'pg-card-mine':''}" 
      onclick="${canBuy?`townBuyUpgrade('${u.id}')`:''}" 
      title="${maxed?'Maxed out':canBuy?'Click to purchase':'Not enough gold'}">
      <div class="pg-card-top">
        <div class="pg-card-icon">${u.icon}</div>
        ${isMyClass?'<div class="pg-card-badge">YOUR CLASS</div>':''}
        ${maxed?'<div class="pg-card-maxed-badge">MAXED</div>':''}
      </div>
      <div class="pg-card-name">${u.name}</div>
      <div class="pg-card-desc">${u.desc}</div>
      <div class="pg-card-pips">${pips} <span class="pg-card-lvl">${curLvl}/${u.maxLvl}</span></div>
      ${maxed
        ?'<div class="pg-card-cost-maxed">✓ Complete</div>'
        :`<div class="pg-card-cost ${canBuy?'':'pg-card-cost-dim'}">🪙 ${cost}</div>`
      }
    </div>`;
  }

  const universals = typeof PERMANENT_UPGRADES!=='undefined' ? PERMANENT_UPGRADES.filter(u=>u.category==='universal') : [];
  const masteries = typeof PERMANENT_UPGRADES!=='undefined' ? PERMANENT_UPGRADES.filter(u=>u.category==='class') : [];

  // Sort masteries: your class first
  const sortedMasteries = [...masteries].sort((a,b)=>{
    if(a.forClass===cid && b.forClass!==cid) return -1;
    if(b.forClass===cid && a.forClass!==cid) return 1;
    return 0;
  });

  return `
    <div class="pg-layout">
      <div class="pg-sidebar">
        <div class="td-portrait">🏛</div>
        <div class="td-name">Vareth <span class="td-sub">Retired Delver · Upgrade Master</span></div>
        <div class="td-greeting">"${VARETH_CLASS[cid]||'Welcome.'}"</div>
        <div class="td-zoneline">"${VARETH_ZONES[zi]}"</div>
        <div class="pg-sidebar-gold">${goldLabel}: <span class="pg-gold-val">🪙 ${gold}</span></div>
        <div class="pg-footer">Upgrades persist across all runs on this save slot.</div>
      </div>
      <div class="pg-main">
        <div class="pg-tabs">
          <button class="pg-tab pg-tab-active" data-tab="universal" onclick="pgSetTab('universal')">⚔ UNIVERSAL</button>
          <button class="pg-tab" data-tab="class" onclick="pgSetTab('class')">★ CLASS MASTERY</button>
        </div>
        <div id="pg-panel-universal" class="pg-panel pg-panel-active">
          <div class="pg-card-grid">${universals.map(u=>upgradeCard(u,false)).join('')}</div>
        </div>
        <div id="pg-panel-class" class="pg-panel">
          <div class="pg-card-grid">${sortedMasteries.map(u=>upgradeCard(u,true)).join('')}</div>
        </div>
      </div>
    </div>`;
}

function townBuyUpgrade(upgradeId){
  if(typeof purchaseUpgrade!=='function') return;
  const ok = purchaseUpgrade(upgradeId);
  if(!ok){ townFlash('Not enough gold!'); return; }
  if(typeof AUDIO!=='undefined'&&AUDIO.sfx&&AUDIO.sfx.gold) AUDIO.sfx.gold();
  townFlash('Upgrade purchased!');
  if(typeof renderAll==='function' && typeof G!=='undefined' && G) renderAll();
  const activeTab = document.querySelector('.pg-tab-active')?.dataset.tab || 'universal';
  document.getElementById('townDialogContent').innerHTML = _dlgUpgrades();
  pgSetTab(activeTab);
  updateTownLoadout();
}

function pgSetTab(tab){
  document.querySelectorAll('.pg-tab').forEach(b=>b.classList.toggle('pg-tab-active', b.dataset.tab===tab));
  document.querySelectorAll('.pg-panel').forEach(p=>p.classList.toggle('pg-panel-active', p.id==='pg-panel-'+tab));
}

// ══════════════════════════════════════════════════════════
//  MIRELA'S SHOP
// ══════════════════════════════════════════════════════════

function _dlgMirelaShop(){
  const midRun = typeof G !== 'undefined' && G && G.classId;
  const gold = midRun ? G.gold : (typeof getPersistentGold==='function' ? getPersistentGold() : 0);
  const goldLabel = midRun ? 'Run Gold' : 'Town Gold';
  const _disc = midRun && G._shopDiscount ? G._shopDiscount : (typeof getPermanentUpgrades==='function' ? (getPermanentUpgrades().shop_discount||0)*0.05 : 0);
  function _mirelaPrice(val){ return Math.floor(val * (1 - _disc)); }

  const SHOP_ITEMS = (typeof ITEMS!=='undefined' ? ITEMS : []).filter(i=>{
    if(i.type==='material') return false;
    if(i.rarity==='epic'||i.rarity==='legendary') return false;
    if(i.set) return false;
    if(i.townOnly) return true;
    if(i.type==='consumable' && (i.rarity==='common'||i.rarity==='uncommon')) return true;
    if((i.rarity==='common'||i.rarity==='uncommon') && i.slot) return true;
    return false;
  });

  const rc={common:'#9a8868',uncommon:'#6ab04c',rare:'#4a90d9'};
  const stash = typeof getStash==='function' ? getStash() : [];
  const stashFull = stash.length >= 40;

  // Group items by category
  const cats = [
    {key:'weapon',label:'Weapons',icon:'⚔️'},
    {key:'armor',label:'Armor',icon:'🛡'},
    {key:'offhand',label:'Offhands',icon:'🛡'},
    {key:'accessory',label:'Accessories',icon:'💍'},
    {key:'consumable',label:'Consumables',icon:'🧪'},
  ];
  const grouped = {};
  SHOP_ITEMS.forEach(item=>{
    const cat = item.type==='consumable'?'consumable':(item.slot||item.type||'other');
    if(!grouped[cat]) grouped[cat]=[];
    grouped[cat].push(item);
  });

  function cardHTML(item){
    const price = _mirelaPrice(item.value);
    const canAfford = gold >= price;
    const col = rc[item.rarity]||'#888';
    const statsArr = Object.entries(item.stats||{}).filter(([k,v])=>v&&k!=='heal').map(([k,v])=>`+${v} ${k}`);
    const healStr = item.stats&&item.stats.heal ? `heals ${item.stats.heal} HP` : '';
    const desc = statsArr.join(' · ') || healStr || '';
    const buyable = canAfford && !stashFull;
    const discStr = _disc>0 ? `<span class="ms-card-orig">${item.value}</span>` : '';
    return `<div class="ms-card ${buyable?'ms-card-buy':'ms-card-dim'}" onclick="${buyable?`townBuyFromMirela('${item.id}')`:''}" title="${!canAfford?'Not enough gold':stashFull?'Stash full':'Click to buy'}">
      <div class="ms-card-icon">${iconHTML(item.icon)}</div>
      <div class="ms-card-body">
        <div class="ms-card-name" style="color:${col}">${item.name}</div>
        <div class="ms-card-stats">${desc}</div>
      </div>
      <div class="ms-card-price ${canAfford?'':'ms-card-poor'}">${discStr}🪙${price}</div>
    </div>`;
  }

  let sectionsHTML = '';
  cats.forEach(cat=>{
    const items = grouped[cat.key];
    if(!items || !items.length) return;
    sectionsHTML += `<div class="ms-section">
      <div class="ms-section-label">${cat.icon} ${cat.label}</div>
      <div class="ms-card-grid">${items.map(cardHTML).join('')}</div>
    </div>`;
  });
  // Catch anything not in a known category
  Object.keys(grouped).forEach(k=>{
    if(cats.find(c=>c.key===k)) return;
    const items = grouped[k];
    if(!items||!items.length) return;
    sectionsHTML += `<div class="ms-section">
      <div class="ms-section-label">📦 Other</div>
      <div class="ms-card-grid">${items.map(cardHTML).join('')}</div>
    </div>`;
  });

  const greetingZi = typeof G!=='undefined'&&G ? Math.min(G.zoneIdx||0,2) : 0;
  const greetings = [
    "Rope, torches, rations. Everything a sensible person takes in. The sensible ones still don't come back.",
    "Sold out of bandages three times this week. I keep ordering more.",
    "Whatever you need going in — I'll find it."
  ];

  const stashPips = stash.length > 0
    ? stash.map(s=>`<span class="ms-stash-pip" title="${s.name}" style="color:${rc[s.rarity]||'#888'}">${iconHTML(s.icon)}</span>`).join('')
    : '<span class="ms-stash-empty">Empty</span>';

  return `
    <div class="td-portrait">🛍</div>
    <div class="td-name">Mirela <span class="td-sub">Merchant</span></div>
    <div class="td-greeting">"${greetings[greetingZi]}"</div>
    <div class="ms-topbar">
      <div class="ms-gold">${goldLabel}: <span class="ms-gold-val">🪙 ${gold}</span></div>
      <div class="ms-stash-bar">📦 ${stash.length}/40 ${stashPips}</div>
    </div>
    ${sectionsHTML}`;
}

function townBuyFromMirela(itemId){
  if(typeof ITEMS==='undefined') return;
  const item = ITEMS.find(i=>i.id===itemId);
  if(!item) return;

  const midRun = typeof G !== 'undefined' && G && G.classId;
  const _disc = midRun && G._shopDiscount ? G._shopDiscount : (typeof getPermanentUpgrades==='function' ? (getPermanentUpgrades().shop_discount||0)*0.05 : 0);
  const price = Math.floor(item.value * (1 - _disc));
  const gold = midRun ? G.gold : (typeof getPersistentGold==='function' ? getPersistentGold() : 0);

  if(gold < price){ townFlash('Not enough gold!'); return; }

  const stash = typeof getStash==='function' ? getStash() : [];
  if(stash.length >= 40){ townFlash('Stash is full!'); return; }

  // Deduct gold
  if(midRun){
    G.gold -= price;
    G.totalGold = (G.totalGold||0); // don't credit totalGold for purchases
    if(typeof renderAll==='function') renderAll();
  } else {
    if(typeof spendPersistentGold==='function') spendPersistentGold(price);
  }

  // Add to stash
  if(typeof addToStash==='function') addToStash({...item, qty:1});

  if(typeof log==='function' && midRun) log(`🛍 Bought ${item.name} — sent to stash.`,'l');

  // Refresh dialog
  document.getElementById('townDialogContent').innerHTML = _dlgMirelaShop();
  townFlash(`Bought ${item.name}!`);
}

// ── Stash Dialog ──────────────────────────────────────────
function _dlgStash(){
  const stash = typeof getStash==='function' ? getStash() : [];
  const rc = {common:'#9a8868',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#9b54bd',legendary:'var(--gold)'};
  const gold = typeof getPersistentGold==='function' ? getPersistentGold() : 0;

  if(stash.length === 0){
    return `<div class="td-portrait">📦</div>
      <div class="td-name">Stash <span class="td-sub">Your personal storage</span></div>
      <div class="td-greeting" style="font-style:italic;color:var(--dim)">Empty. Buy items from Mirela or salvage gear from a run.</div>
      <div class="td-donate-info" style="margin-top:10px">Town Gold: <span style="color:var(--gold)">🪙 ${gold}g</span></div>`;
  }

  const itemsHTML = stash.filter(item=>item!=null).map((item,i)=>{
    const col = rc[item.rarity]||'#888';
    const statsStr = Object.entries(item.stats||{}).filter(([k,v])=>v&&k!=='heal').map(([k,v])=>`+${v} ${k}`).join(' · ');
    const healStr = item.stats&&item.stats.heal ? `heals ${item.stats.heal} HP` : '';
    return `<div class="stash-dlg-item">
      <span class="stash-dlg-icon">${iconHTML(item.icon)}</span>
      <div class="stash-dlg-info">
        <span class="stash-dlg-name" style="color:${col}">${item.name}</span>
        <span class="stash-dlg-rar" style="color:${col}">${item.rarity.toUpperCase()}</span>
        <span class="stash-dlg-stats">${statsStr||healStr}</span>
      </div>
      <button class="stash-dlg-discard" onclick="stashDiscardItem(${i})" title="Discard item">✕</button>
    </div>`;
  }).join('');

  return `<div class="td-portrait">📦</div>
    <div class="td-name">Stash <span class="td-sub">${stash.length}/40 items</span></div>
    <div class="td-donate-info" style="margin-bottom:10px">Town Gold: <span style="color:var(--gold)">🪙 ${gold}g</span></div>
    <div class="stash-dlg-list">${itemsHTML}</div>
    <div class="td-used" style="margin-top:12px;border-left:none;padding-left:0">Items carry over between runs. Load them at the gate before descending.</div>`;
}

function stashDiscardItem(idx){
  if(typeof removeFromStash==='function') removeFromStash(idx);
  document.getElementById('townDialogContent').innerHTML = _dlgStash();
}

// ══════════════════════════════════════════════════════════
//  VICTORY MODE — Hero emerges from gate into gathered crowd.
//  NPCs speak one by one. Hero walks south off map. Credits.
// ══════════════════════════════════════════════════════════
var _victoryActive = false;
var _victoryTimers = [];
var _victoryPhase = 'walk_in'; // 'walk_in' | 'bubbles' | 'walk_out'
var _victoryBubbleIdx = 0;

// Very slow walk speed (pixels per frame)
const _VICTORY_WALK_SPEED = 0.18;

// Hero stops at this tile row (center of the crowd)
const _VICTORY_STOP_ROW = 10;

// All NPCs clustered below the gate in a crowd.
// Gate door at col 29, row 4. Clear zone: rows 5-13, cols 23-35.
// Arranged in a loose semicircle / gathering shape.
const VICTORY_CROWD = [
  // ── Row 7: flanking near gate entrance ──
  { id:'v_seraphine', label:'Seraphine',         color:'#a0c4ff', icon:'⛪', tx:26, ty:7,  facing:2,
    text:"The Shrine fire turned gold this morning. It has never done that." },
  { id:'v_edwyn',     label:'Brother Edwyn',     color:'#9090c0', icon:'📖', tx:33, ty:7,  facing:2,
    text:"The inscription is clear now. For the first time in three years. It says your name." },

  // ── Row 8: wider arc ──
  { id:'v_oswin',     label:'Father Oswin',      color:'#d0d0e0', icon:'✝',  tx:24, ty:8,  facing:1,
    text:"Every prayer. Every single one. Answered." },
  { id:'v_malachar',  label:'Malachar',          color:'#504878', icon:'📚', tx:35, ty:8,  facing:3,
    text:"I spent three years translating that inscription. It was your name the whole time." },

  // ── Row 9: closing in ──
  { id:'v_apprentice',label:"Aldric's Apprentice",color:'#c06830', icon:'⚒', tx:25, ty:9,  facing:1,
    text:"Aldric told me to sharpen it one last time. I did. This morning. Before dawn." },
  { id:'v_rook',      label:'Rook',              color:'#c8a020', icon:'🍺', tx:34, ty:9,  facing:3,
    text:"Kept your stool warm." },

  // ── Row 10: level with hero's stop point ──
  { id:'v_dael',      label:'Sergeant Dael',     color:'#a0a060', icon:'🛡', tx:24, ty:10, facing:1,
    text:"Thirty years, four postings, two wars. This is the only one that mattered." },
  { id:'v_ferris',    label:'Old Ferris',        color:'#806040', icon:'👴', tx:35, ty:10, facing:3,
    text:"I've been drunk for thirty years. Today I'm sober. Felt like the right day for it." },

  // ── Row 11: behind hero ──
  { id:'v_mira',      label:'Mira',              color:'#e090a0', icon:'💊', tx:26, ty:11, facing:0,
    text:"I patched you up every time. You never needed it less than today." },
  { id:'v_cord',      label:'Cord',              color:'#6090a0', icon:'🎣', tx:33, ty:11, facing:0,
    text:"Fish are biting again. First time in months. The water knows." },
  { id:'v_townsman',  label:'Townsman',          color:'#908060', icon:'🏠', tx:28, ty:11, facing:0,
    text:"We came back. All of us. Don't ask me why. Something told us to be here today." },
  { id:'v_mother',    label:'Townswoman',        color:'#b08870', icon:'👩', tx:31, ty:11, facing:0,
    text:"My children are safe because of you. I don't know how to say that properly. So I'm just here." },

  // ── Row 12: further back ──
  { id:'v_cray',      label:'Old Cray',          color:'#706050', icon:'🪙', tx:25, ty:12, facing:0,
    text:"I told you so. Didn't I tell you so? I told everyone." },
  { id:'v_child',     label:'Pip',               color:'#d0c080', icon:'🧒', tx:34, ty:12, facing:0,
    text:"Are you really the one? From the stories? You look tired. But like... the good kind." },

  // ── Row 13: the last two ──
  { id:'v_elspeth',   label:'Elspeth',           color:'#c0a080', icon:'👵', tx:28, ty:13, facing:0,
    text:"Sixty years. I told you. You always come back." },
  { id:'v_kit',       label:'Kit',               color:'#c0d090', icon:'🧒', tx:31, ty:13, facing:0,
    text:"I kept the last page blank. Like I said I would.", isFinal:true },
];

function _buildVictoryWanderers(){
  return VICTORY_CROWD.map(npc => ({
    id: npc.id,
    label: npc.label,
    color: npc.color,
    icon: npc.icon,
    wx: npc.tx * TILE + TILE/2,
    wy: npc.ty * TILE + TILE/2,
    wanderTarget: { x: npc.tx * TILE + TILE/2, y: npc.ty * TILE + TILE/2 },
    wanderTimer: 9999,
    talking: false,
    talkTimer: 0,
    activeLine: 0,
    facing: npc.facing,
    stationary: true,
    lines: [npc.text],
  }));
}

function _startVictoryInTown(){
  _victoryActive = true;
  _victoryPhase = 'walk_in';
  _victoryBubbleIdx = 0;
  _victoryTimers.forEach(t => clearTimeout(t));
  _victoryTimers = [];

  // Hide speech close button during victory
  const closeBtn = document.querySelector('.npc-speech-close');
  if(closeBtn) closeBtn.style.display = 'none';

  // Player at gate door, facing south
  _pl.wx = 30 * TILE;
  _pl.wy = 5 * TILE;
  _pl.facing = 2;

  // Override wanderers to victory crowd
  _wanderers = _buildVictoryWanderers();
}

// Called every frame from _townTick when _victoryActive
function _victoryStep(){
  if(!_victoryActive) return;

  if(_victoryPhase === 'walk_in'){
    // Slowly walk south toward center of crowd
    _pl.wy += _VICTORY_WALK_SPEED;
    _pl.facing = 2;
    if(_pl.wy >= _VICTORY_STOP_ROW * TILE){
      _pl.wy = _VICTORY_STOP_ROW * TILE;
      _victoryPhase = 'bubbles';
      // Start bubble sequence after a beat
      _victoryTimers.push(setTimeout(() => _playVictoryBubble(), 1200));
    }
  }
  else if(_victoryPhase === 'walk_out'){
    // Walk south off the map
    _pl.wy += _VICTORY_WALK_SPEED;
    _pl.facing = 2;
    if(_pl.wy > (EXT_ROWS + 3) * TILE){
      _victoryActive = false;
      _endVictoryWalk();
    }
  }
  // 'bubbles' phase: hero stands still, timers handle progression
}

function _playVictoryBubble(){
  if(_victoryBubbleIdx >= VICTORY_CROWD.length){
    // All done — pause, then start walking out
    _victoryTimers.push(setTimeout(() => {
      closeNpcDialog();
      _victoryPhase = 'walk_out';
    }, 1500));
    return;
  }

  const npc = VICTORY_CROWD[_victoryBubbleIdx];
  const w = _wanderers.find(w => w.id === npc.id);
  const srcX = w ? w.wx : _pl.wx;
  const srcY = w ? w.wy : _pl.wy;

  _showDialog(npc.label, npc.text, srcX, srcY);
  if(_npcDialogTimer){ clearTimeout(_npcDialogTimer); _npcDialogTimer = null; }

  _victoryBubbleIdx++;

  // Hold time based on text length — final line lingers longer
  const holdTime = npc.isFinal ? 4000 : Math.max(2800, npc.text.length * 42 + 1200);

  _victoryTimers.push(setTimeout(() => {
    closeNpcDialog();
    // Small gap between speakers
    _victoryTimers.push(setTimeout(() => _playVictoryBubble(), 500));
  }, holdTime));
}

function _endVictoryWalk(){
  _victoryTimers.forEach(t => clearTimeout(t));
  _victoryTimers = [];

  // Restore speech close button
  const closeBtn = document.querySelector('.npc-speech-close');
  if(closeBtn) closeBtn.style.display = '';

  // Fade to black, then credits
  const fade = document.getElementById('victoryFade');
  if(fade){
    fade.style.display = 'block';
    fade.style.opacity = '0';
    requestAnimationFrame(() => {
      fade.style.transition = 'opacity 2.5s ease';
      fade.style.opacity = '1';
    });
    _victoryTimers.push(setTimeout(() => {
      _tRunning = false;
      if(_tRAF) cancelAnimationFrame(_tRAF);
      fade.style.display = 'none';
      if(G) G._victoryMode = false;
      if(typeof showKitJournal === 'function') showKitJournal(showCreditsScreen);
      else showCreditsScreen();
    }, 3000));
  } else {
    _tRunning = false;
    if(G) G._victoryMode = false;
    if(typeof showKitJournal === 'function') showKitJournal(showCreditsScreen);
    else showCreditsScreen();
  }
}

function finishVictoryMode(){
  _victoryActive = false;
  _victoryTimers.forEach(t => clearTimeout(t));
  _victoryTimers = [];
  closeNpcDialog();
  const closeBtn = document.querySelector('.npc-speech-close');
  if(closeBtn) closeBtn.style.display = '';
  if(G) G._victoryMode = false;
  if(typeof showKitJournal === 'function') showKitJournal(showCreditsScreen);
  else showCreditsScreen();
}
