// ================================================================
// ui/ui-map.js — World Map
// Descent into Eternity
// ================================================================

// ══════════════════════════════════════════════════════════
//  WORLD MAP
// ══════════════════════════════════════════════════════════
const MAP_NODES=[
  {id:'woods',     label:'Whispering\nWoods',    x:80,  y:220, zone:0},
  {id:'fungal',    label:'Fungal\nWarren',        x:80,  y:330, zone:null, branch:'fungalwarren', dotted:true},
  {id:'outpost',   label:'Ruined\nOutpost',       x:210, y:160, zone:1},
  {id:'vault',     label:'Sunken\nVault',         x:160, y:290, zone:null, branch:'sunkenvault',  dotted:true},
  {id:'castle',    label:'Thornwall\nCastle',     x:340, y:230, zone:2},
  {id:'catacombs', label:'The\nCatacombs',        x:290, y:340, zone:null, branch:'catacombs',    dotted:true},
  {id:'underdark', label:'The\nUnderdark',        x:460, y:150, zone:3},
  {id:'ashen',     label:'Ashen\nWastes',         x:420, y:290, zone:null, branch:'ashenwastes',  dotted:true},
  {id:'abyss',     label:'Abyssal\nGate',         x:560, y:250, zone:4},
  {id:'frostpeak', label:'Frostveil\nPeaks',      x:650, y:140, zone:5},
  {id:'celestial', label:'Celestial\nPlane',      x:710, y:280, zone:6},
  {id:'shadowrealm',label:'Shadow\nRealm',        x:740, y:170, zone:7},
];

const MAP_EDGES=[
  ['woods','outpost',false],
  ['woods','fungal',true],
  ['outpost','vault',true],
  ['outpost','castle',false],
  ['castle','catacombs',true],
  ['castle','underdark',false],
  ['underdark','ashen',true],
  ['underdark','abyss',false],
  ['abyss','frostpeak',false],
  ['frostpeak','celestial',false],
  ['celestial','shadowrealm',false],
];

function showMap(postBoss){
  G._postBossMap = !!postBoss;
  renderWorldMap();
  showScreen('map');
  const closeBtn = document.getElementById('mapCloseBtn');
  if(closeBtn) closeBtn.style.display = postBoss ? 'none' : 'block';
}

function renderWorldMap(){
  const svg=document.getElementById('mapSvg');
  const area=document.getElementById('worldMapArea');
  svg.innerHTML='';
  area.querySelectorAll('.map-node').forEach(n=>n.remove());

  MAP_EDGES.forEach(([a,b,dotted])=>{
    const na=MAP_NODES.find(n=>n.id===a);const nb=MAP_NODES.find(n=>n.id===b);
    if(!na||!nb)return;
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    const W=780,H=380;
    line.setAttribute('x1',na.x/W*100+'%');line.setAttribute('y1',na.y/H*100+'%');
    line.setAttribute('x2',nb.x/W*100+'%');line.setAttribute('y2',nb.y/H*100+'%');
    line.setAttribute('stroke',dotted?'#2a2a20':'#3a3028');
    line.setAttribute('stroke-width','2');
    if(dotted)line.setAttribute('stroke-dasharray','6,4');
    svg.appendChild(line);
  });

  MAP_NODES.forEach(node=>{
    const isBranchNode = node.branch != null;
    const isMainNode   = node.zone  != null;

    // Main node unlock/clear state — use runBossDefeated for navigation (this run only)
    const runDefeated = G.runBossDefeated || [];
    const cleared   = isMainNode && runDefeated[node.zone];
    const isCur     = isMainNode && node.zone === G.zoneIdx;
    const unlocked  = isMainNode && (node.zone===0 || runDefeated[node.zone-1] || cleared);

    // Branch node state — must beat linked boss THIS run
    let branchCleared=false, branchUnlocked=false;
    if(isBranchNode){
      const bDef = BRANCH_ZONES.find(b=>b.id===node.branch);
      branchCleared  = G.branchDefeated && G.branchDefeated[node.branch];
      branchUnlocked = bDef && runDefeated[bDef.unlocksAfter] && !branchCleared;
    }

    const el=document.createElement('div');
    let cls='map-node ';
    if(isBranchNode){
      cls += branchCleared?'cleared branch-node':branchUnlocked?'branch-node unlocked':'branch-node locked';
    } else {
      cls += cleared?'cleared':isCur?'current':unlocked?'unlocked':'locked';
    }
    el.className=cls;
    el.style.left=(node.x/780*100)+'%';
    el.style.top=(node.y/380*100)+'%';

    const dotChar = isBranchNode
      ? (branchCleared?'✓':branchUnlocked?'★':'?')
      : (cleared?'✓':isCur?'★':'◆');

    // Action label shown on clickable nodes
    let actionLabel = '';
    if(isBranchNode && branchUnlocked) actionLabel = '<div class="mn-action">▶ ENTER</div>';
    else if(!isBranchNode && unlocked && !isCur && !cleared) actionLabel = '<div class="mn-action">▶ TRAVEL</div>';
    else if(!isBranchNode && isCur && !cleared) actionLabel = '<div class="mn-action" style="color:var(--gold)">★ HERE</div>';
    else if(cleared) actionLabel = '<div class="mn-action" style="color:var(--green2)">✓ CLEARED</div>';

    const labelSuffix = isBranchNode && !branchCleared ? '<br><span style="font-size:6px;color:#aa8830;">★ SIDE QUEST</span>' : '';
    el.innerHTML=`<div class="mn-dot">${dotChar}</div><div class="mn-label">${node.label}${labelSuffix}</div>${actionLabel}`;

    if(isBranchNode && branchUnlocked){
      el.onclick=()=>travelToBranch(node.branch);
    } else if(!isBranchNode && unlocked && !isCur && !cleared){
      el.onclick=()=>travelToZone(node.zone);
    }
    area.appendChild(el);
  });
}

function travelToZone(zoneIdx){
  G.zoneIdx=zoneIdx;G.zoneKills=0;G.bossReady=false;G._zoneEchoDone=false;
  G.dungeonFights=0;G.campUnlocked=false;G.dungeonGoal=zoneIdx>=5?6:5;
  G.restsThisZone=0;
  G._ironmanFlag=true; // Track if player stays above 50% HP all zone
  G._noRestStreak=0; // Reset no-rest streak on zone travel
  // ── Phase A: Reset zone-scoped rare event state ──
  G._rareEventsThisZone=0;
  G._roomChoicesThisZone=0; // Reset room choice counter for new zone
  G._shopStock=null;        // Fresh shop for new zone
  G._salvageBuffs=[];       // Clear temp salvage buffs
  // Clean up zone-scoped rare event flags
  const ref=G._rareEventFlags||{};
  // Remove expired zone-scoped flags
  delete ref.vexaraCrown;
  delete ref.finalHorn;
  delete ref.frozenSoldier;
  delete ref.divineEvasion;
  delete ref.alliedSkeletons;
  // NOTE: _cursedDebuff and _chilledDebuff are NOT deleted here —
  // they are checked and deleted below after stat restoration (lines 2519-2520)
  delete ref.lastCampfireWeaken;
  delete ref.enemyFirstStrike;
  delete G._rareFightSkips; // Clear any pending fight skips on zone transition
  // Remove temp ATK bonus from previous zone
  if(ref.tempAtkBonus && ref.tempAtkBonus.zoneIdx!==zoneIdx){
    removeOffensiveStat(G,ref.tempAtkBonus.value);
    delete ref.tempAtkBonus;
  }
  // Remove unstable buff (Stranger's Satchel opened early)
  if(ref.unstableBuff){
    removeOffensiveStat(G,ref.unstableBuff.atk);
    G.def=Math.max(0,G.def-ref.unstableBuff.def);
    G.maxHp=Math.max(1,G.maxHp-ref.unstableBuff.hp);
    G.hp=Math.min(G.hp,G.maxHp);
    delete ref.unstableBuff;
  }
  G._rareEventsThisZone=0; // Reset rare event cap (redundant but safe)
  G._roomChoicesThisZone=0;
  // Clean up salvage temp buffs (reverse stat bonuses)
  if(G._salvageBuffs&&G._salvageBuffs.length){
    for(const b of G._salvageBuffs){
      if(b.stat==='atk')removeOffensiveStat(G,b.value);
      if(b.stat==='def')G.def=Math.max(0,G.def-b.value);
    }
  }
  G._salvageBuffs=[];
  // Also clean up empressBossBonus and debuffs
  delete ref.empressBossBonus;
  if(ref._cursedDebuff){addOffensiveStat(G,3);G.def+=3;delete ref._cursedDebuff;}
  if(ref._chilledDebuff){G.def+=3;delete ref._chilledDebuff;}
  // ── Phase B: Clean up zone modifier effects ──
  if(G._activeModifier){
    const fx=G._activeModifier.effects;
    // Remove Ironhide DEF bonus
    if(fx.bonusDef) G.def = Math.max(0, G.def - fx.bonusDef);
    // Remove Ancestral Fury ATK stacks (consumed in damage formula, just reset counter)
    if(G._ancestralStacks > 0 && fx.killAtkStack){
      // No stat subtraction needed — stacks feed into calcPlayerDmg/getSpellPower directly
    }
    // Track zone clear for unlocks
    if(typeof updateUnlockStats === 'function') updateUnlockStats('zone_clear');
  }
  G._activeModifier = null;
  G._ancestralStacks = 0;
  G._witchChoice = null;
  G._predatorBuff = null;
  // Phase B: Track zone progress for unlocks
  if(zoneIdx >= 4 && typeof updateUnlockStats === 'function') updateUnlockStats('zone5_reached');
  if(zoneIdx >= 7 && typeof updateUnlockStats === 'function') updateUnlockStats('zone8_reached');
  // Phase B: Check unlocks after zone transition
  if(typeof checkUnlocks === 'function') checkUnlocks();
  G.hp=G.maxHp;
  G.conditions=[];G.conditionTurns={};G.sx={};G.raging=false;G.hunterMarked=false;G.concentrating=null;
  G.wildShapeHp=0;G.wildShapeActive=false;G.spiritualWeaponActive=false;G.spiritualWeaponTurns=0;
  G.skillCooldowns={};
  // Restore all skill charges on zone travel (full rest between zones)
  G.skillCharges={};
  CLASSES[G.classId].skills.forEach(sk=>{ if(sk.charges) G.skillCharges[sk.id]=sk.charges; });
  // Restore druid sprite on zone travel
  if(G.classId==='druid'){const p=document.getElementById('playerSprite');if(p){if(window.hasImageSprite&&window.hasImageSprite('druid')){window.renderImageSprite('druid','idle',0,p,260);}else if(CLASS_SPRITES.druid)renderSprite(CLASS_SPRITES.druid,14,p);}if(p)p.style.filter='';startPlayerAnim();}
  const exitBtnZ=document.getElementById('exitWildShapeBtn');if(exitBtnZ)exitBtnZ.style.display='none';
  if(G.classId!=='wizard'){G.res=G.resMax;}
  else if(G.spellSlots&&G.spellSlotsMax){
    for(const lvl of Object.keys(G.spellSlotsMax))G.spellSlots[lvl]=G.spellSlotsMax[lvl];
  }
  // Restore paladin Lay on Hands pool on zone travel
  if(G.classId==='paladin')G.layOnHandsPool=Math.floor(G.level*5*(G.talents.includes('Lay on Hands+')?1.5:1));
  G.currentEnemy=null;
  document.getElementById('bossAlert').style.display='none';
  // Show cinematic first, then story screen after it fades
  showZoneCinematic(zoneIdx, ()=>{
    showStoryIntro(zoneIdx);
  });
}

function closeMap(){
  G._postBossMap = false;
  showScreen('game');
  setupGameUI();
  const neb=document.getElementById('nextEnemyBtn');
  if(!G.currentEnemy&&neb&&neb.style.display==='block'){
    neb.style.display='block';
  } else if(!G.currentEnemy){
    spawnEnemy();
  }
}

