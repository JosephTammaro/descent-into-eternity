// ================================================================
// main.js — Game State, Core Logic, Game Flow
// Initializes G, handles screens, class select, zone flow,
// HUD rendering, companions, enemy spawning
// Descent into Eternity
// ================================================================

// ══════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════
let G = null;
let paused = false;
let enemyTurnTimeout = null;
let selectedItemIdx = null;
let pendingClass = null;
let pendingHardcore = false;
let pendingDifficulty = 'normal';
let cfCurrentTab = 'rest';
let cfCurrentEvent = null;

function md(s){return Math.floor((s-10)/2);}
function profFor(lvl){return lvl<5?2:lvl<9?3:lvl<13?4:lvl<17?5:6;}
function xpFor(lvl){return Math.floor(60*Math.pow(1.55,lvl-1));}
function roll(d){return Math.floor(Math.random()*d)+1;}

function newState(classId, hardcore, difficulty){
  difficulty = difficulty || "normal";
  hardcore = hardcore || difficulty === "hardcore";
  const cls = CLASSES[classId];
  const st = cls.baseStats;
  const conMod = md(st.con);
  const maxHp = cls.baseHp + conMod;
  return {
    classId, hardcore, difficulty,
    dungeonGoal: difficulty === "normal" ? 3 : 5,
    level:1, xp:0, xpNeeded:xpFor(1),
    hp:maxHp, maxHp,
    res: classId==='wizard'?Object.values(cls.spellSlots||{}).reduce((a,b)=>a+b,0):cls.resMax,
    resMax: cls.resMax,
    spellSlots: cls.spellSlots?{...cls.spellSlots}:null,
    spellSlotsMax: cls.spellSlots?{...cls.spellSlots}:null,
    wizKillCount:0,
    stats:{...st},
    profBonus:2, atk:3+md(st.str), def:md(st.con)+md(st.dex),
    critRange:20, critMult:2, magBonus:0,
    xpMult:1, goldMult:1, critBonus:0,
    inventory:Array(20).fill(null),
    equipped:{weapon:null,armor:null,ring:null,offhand:null},
    gold:0, totalGold:0, totalKills:0, totalItems:0, totalCrafts:0, totalCrits:0, totalObjectives:0, mirrorImages:0,
    upgrades:UPGRADES_DATA.map(u=>({...u,bought:false})),
    talents:[],
    talentsOffered:[],
    subclassUnlocked:false,
    ultimateUnlocked:false,
    capstoneUnlocked:false,
    layOnHandsPool:5,
    zoneIdx:0, zoneKills:0, bossReady:false, bossDefeated:[false,false,false,false,false,false,false,false],
    branchDefeated:{catacombs:false,fungalwarren:false,sunkenvault:false,ashenwastes:false},
    branchPassives:[],
    dungeonFights:0, campUnlocked:false, restsThisZone:0,
    // Turn state
    isPlayerTurn:true, actionUsed:false, bonusUsed:false, reactionUsed:false,
    skillCooldowns:{},
    // Status
    conditions:[],
    conditionTurns:{},
    sx:{},      // status effects
    raging:false, rageTurns:0, hunterMarked:false, concentrating:null, wildShapeHp:0, wildShapeActive:false,
    spiritualWeaponActive:false, spiritualWeaponTurns:0,
    firstAttackUsed:false,
    currentEnemy:null,
    roundNum:0,
    skillCharges: Object.fromEntries(CLASSES[classId].skills.filter(sk=>sk.charges).map(sk=>[sk.id,sk.charges])),
  };
}

// ══════════════════════════════════════════════════════════
//  TITLE
// ══════════════════════════════════════════════════════════
(function buildStars(){
  const c=document.getElementById('titleStars');
  for(let i=0;i<100;i++){
    const s=document.createElement('div');s.className='star';
    s.style.left=Math.random()*100+'%';s.style.top=Math.random()*100+'%';
    const sz=Math.random()<.15?3:1;s.style.width=sz+'px';s.style.height=sz+'px';
    s.style.setProperty('--d',(2+Math.random()*5)+'s');
    s.style.setProperty('--delay',Math.random()*5+'s');
    c.appendChild(s);
  }
})();

function selectDiff(d){
  pendingDifficulty=d;
  pendingHardcore=(d==='hardcore');
  document.querySelectorAll('.diff-card').forEach(c=>c.classList.remove('active'));
  const map={normal:'diff-normal',hard:'diff-hard',hardcore:'diff-hc'};
  const el=document.getElementById(map[d]);
  if(el)el.classList.add('active');
  const btn=document.getElementById('beginBtn');
  if(btn){
    if(d==='hardcore') btn.className='title-btn hc';
    else if(d==='hard') btn.style.borderColor='#e67e22';
    else { btn.className='title-btn'; btn.style.borderColor=''; }
  }
}
function beginDescent(){ AUDIO.init(); AUDIO.playBGM('title'); showScreen('class'); renderClassSelect(); }
function newGame(hardcore){ pendingHardcore=!!hardcore; showScreen('class'); renderClassSelect(); }

// ══════════════════════════════════════════════════════════
//  CLASS SELECT
// ══════════════════════════════════════════════════════════
function renderClassSelect(){
  const grid=document.getElementById('classGrid');
  grid.innerHTML=Object.entries(CLASSES).map(([id,cls])=>`
    <div class="class-card px-border" onclick="selectClass('${id}')">
      <div class="class-sprite-wrap" id="cs-sprite-${id}"></div>
      <div class="class-name">${cls.name}</div>
      <div class="class-res" style="color:${cls.resColor}">◈ ${cls.res}</div>
      <div class="class-desc">${cls.desc}</div>
      <div class="class-stat-row">
        ${Object.entries(cls.baseStats).map(([k,v])=>`<div class="cs-pip">${k.toUpperCase()} <span>${v}</span></div>`).join('')}
      </div>
    </div>
  `).join('');
  // Render small sprites
  Object.keys(CLASSES).forEach(id=>{
    const el=document.getElementById('cs-sprite-'+id);
    if(el&&CLASS_SPRITES[id]) renderSprite(CLASS_SPRITES[id],5,el);
  });
}

function selectClass(id){
  pendingClass=id;
  const cls=CLASSES[id];
  document.getElementById('confirmMsg').innerHTML=`You have chosen the <strong style="color:var(--gold)">${cls.name}</strong>.<br>This path cannot be changed.<br>Are you ready to begin your descent?`;
  openOverlay('confirmOverlay');
}

function doConfirmClass(){
  closeOverlay('confirmOverlay');
  G=newState(pendingClass,pendingHardcore,pendingDifficulty);
  // Give and immediately equip starting weapon
  const starters={fighter:'sword',wizard:'staff',rogue:'dagger',paladin:'sword',ranger:'bow',barbarian:'sword',cleric:'staff',druid:'staff'};
  const starterItem={...ITEMS.find(i=>i.id===starters[pendingClass])};
  // Equip directly — don't put in inventory first
  G.equipped.weapon=starterItem;
  applyItemStats(starterItem);
  // Give starting potions in inventory
  addItem({...ITEMS.find(i=>i.id==='hpPotion'),qty:2});
  showGameIntro(()=>showStoryIntro(0));
}

// ══════════════════════════════════════════════════════════
//  NARRATIVE SYSTEM
// ══════════════════════════════════════════════════════════

let _introTimer = null;
let _introSkipped = false;

function showGameIntro(onDone){
  _introDoneCallback = onDone;
  const el = document.getElementById('screen-intro');
  if(!el){ onDone(); return; }
  el.style.display = 'flex';

  const titleEl = document.getElementById('introTitle');
  titleEl.textContent = GAME_INTRO.title;

  // Build line divs
  const linesEl = document.getElementById('introLines');
  linesEl.innerHTML = '';
  GAME_INTRO.lines.forEach((line, i) => {
    const d = document.createElement('div');
    d.className = 'intro-line';
    d.textContent = line;
    d.id = 'intro-line-' + i;
    linesEl.appendChild(d);
  });

  _introSkipped = false;
  let step = -1; // -1 = title, 0..n = lines
  const total = GAME_INTRO.lines.length;
  const delays = [0, 800, 1800, 2900, 4100, 5400, 6500, 7400, 8200];

  function showStep(){
    if(_introSkipped) return;
    if(step === -1){
      titleEl.classList.add('show');
    } else if(step < total){
      document.getElementById('intro-line-' + step).classList.add('show');
    }
    step++;
    if(step <= total){
      const wait = step < delays.length ? (delays[step] - (delays[step-1]||0)) : 900;
      _introTimer = setTimeout(showStep, Math.max(600, wait));
    } else {
      // All lines shown — wait a beat then proceed
      _introTimer = setTimeout(() => { el.style.display='none'; _introDoneCallback=null; onDone(); }, 2200);
    }
  }
  showStep();
}

let _introDoneCallback = null;
function skipIntro(){
  _introSkipped = true;
  if(_introTimer) clearTimeout(_introTimer);
  document.getElementById('screen-intro').style.display = 'none';
  if(_introDoneCallback){ const fn=_introDoneCallback; _introDoneCallback=null; fn(); }
}

// ── Lore Reveal after boss death ──
let _loreTimer = null;
let _loreOnDone = null;

// ══════════════════════════════════════════════════════════
//  BOSS VICTORY OVERLAY
// ══════════════════════════════════════════════════════════
let _bossVictoryCallback = null;

function showBossVictory(bossName, bossTitle, onDone) {
  _bossVictoryCallback = onDone;

  // Populate text
  document.getElementById('bvoName').textContent = bossName;
  document.getElementById('bvoTitle').textContent = bossTitle || '';

  // Stop battle BGM, play fanfare
  AUDIO.stopBGM();
  setTimeout(() => AUDIO.playBGM('victory'), 200);

  // Activate overlay (triggers all CSS transitions)
  const overlay = document.getElementById('bossVictoryOverlay');
  overlay.classList.add('active');

  // Auto-dismiss fallback after 9s in case player doesn't click
  setTimeout(() => {
    if (overlay.classList.contains('active')) closeBossVictory();
  }, 9000);
}

function closeBossVictory() {
  const overlay = document.getElementById('bossVictoryOverlay');
  overlay.classList.remove('active');
  AUDIO.stopBGM();
  const cb = _bossVictoryCallback;
  _bossVictoryCallback = null;
  if (cb) setTimeout(cb, 400);
}

function showLoreReveal(zoneIdx, onDone){
  const reveal = LORE_REVEALS[zoneIdx];
  if(!reveal){ if(onDone)onDone(); return; }
  _loreOnDone = onDone;

  document.getElementById('loreIcon').textContent = reveal.icon;
  document.getElementById('loreTitle').textContent = reveal.title;

  const linesEl = document.getElementById('loreLines');
  linesEl.innerHTML = '';
  reveal.lines.forEach((line, i) => {
    const d = document.createElement('div');
    d.className = 'lore-line';
    d.textContent = line;
    d.id = 'lore-line-' + i;
    linesEl.appendChild(d);
  });

  const continueBtn = document.getElementById('loreContinue');
  continueBtn.classList.remove('show');

  document.getElementById('loreReveal').classList.add('open');

  // Reveal lines one by one
  let step = 0;
  function nextLine(){
    if(step < reveal.lines.length){
      const lineEl = document.getElementById('lore-line-' + step);
      if(lineEl) lineEl.classList.add('show');
      step++;
      _loreTimer = setTimeout(nextLine, step === reveal.lines.length ? 800 : 1100);
    } else {
      continueBtn.classList.add('show');
    }
  }
  _loreTimer = setTimeout(nextLine, 400);
}

function closeLoreReveal(){
  document.getElementById('loreReveal').classList.remove('open');
  if(_loreTimer) clearTimeout(_loreTimer);
  if(_loreOnDone){ const fn=_loreOnDone; _loreOnDone=null; fn(); }
}

// ══════════════════════════════════════════════════════════
//  STORY INTRO
// ══════════════════════════════════════════════════════════
function showStoryIntro(zoneIdx){
  // Zone-specific BGM
  const bgmMap=['woods','outpost','castle','underdark','abyss'];
  AUDIO.playBGM(bgmMap[zoneIdx]||'woods');
  AUDIO.sfx.zoneEnter();
  const z=ZONES[zoneIdx];
  document.getElementById('storyZoneTag').textContent=`ZONE ${z.num} — ${z.name.toUpperCase()}`;
  document.getElementById('storyTitle').textContent=z.story.title;
  // Show restore badge only when travelling (not zone 0 on new game)
  const healBadge=document.getElementById('storyHealBadge');
  healBadge.style.display=(zoneIdx>0)?'block':'none';
  const bodyEl=document.getElementById('storyBody');
  bodyEl.textContent='';
  let i=0;
  const t=setInterval(()=>{bodyEl.textContent+=z.story.text[i++];if(i>=z.story.text.length)clearInterval(t);},28);
  showScreen('story');
}

function enterZone(){
  // If we're entering a branch, use branch flow instead
  if(G._inBranch && _currentBranch){
    enterBranch();
    return;
  }
  showScreen('game');
  setupGameUI();
  initObjective(G.zoneIdx);
  renderObjectiveStatus();
  spawnEnemy();
  // Auto-render char sheet (starts expanded)
  renderInlineCharSheet();
  // Initial companion render
  renderCompanions();
}

// ══════════════════════════════════════════════════════════
//  GAME UI SETUP
// ══════════════════════════════════════════════════════════
function setupGameUI(){
  const cls=CLASSES[G.classId];
  const z=ZONES[G.zoneIdx];

  // Hero mini sprite
  const mini=document.getElementById('heroMiniSprite');
  if(CLASS_SPRITES[G.classId]) renderSprite(CLASS_SPRITES[G.classId],3,mini);

  document.getElementById('heroName').textContent=cls.name.toUpperCase();
  document.getElementById('resLbl').textContent=cls.res.substring(0,3).toUpperCase();

  // BG
  document.getElementById('bgSky').className='bg-layer '+z.bgSky;
  document.getElementById('bgGround').className='bg-layer '+z.bgGround;
  document.getElementById('bgTrees').style.display=z.showTrees?'block':'none';

  // Zone bar
  document.getElementById('zoneNameLabel').textContent=z.name;
  document.getElementById('bossAlert').style.display=G.bossReady&&!G.bossDefeated[G.zoneIdx]?'block':'none';

  // Player sprite
  // Show HC badge
  const hcb=document.getElementById('hcSkullBadge');
  if(hcb)hcb.style.display=G.hardcore?'flex':'none';
  const pSpr=document.getElementById('playerSprite');
  if(CLASS_SPRITES[G.classId]) renderSprite(CLASS_SPRITES[G.classId],10,pSpr);
  document.getElementById('playerNameTag').textContent=cls.name;
  startPlayerAnim();

  // Spell slots panel
  document.getElementById('spellSlotSection').style.display=G.classId==='wizard'?'block':'none';

  renderAll();
  // Only update button states — spawnEnemy() handles setPlayerTurn
  renderSkillButtons();
  // Update inline char sheet if open
  const csiBody=document.getElementById('csiBody');
  if(csiBody&&csiBody.classList.contains('open'))renderInlineCharSheet();
  updateCampBtn();
  // Update difficulty badge
  const db=document.getElementById('diffBadgeHud');
  if(db){
    const d=G.difficulty||'normal';
    db.className='diff-badge '+d;
    db.textContent=d.toUpperCase();
  }
}


function renderCompanions(){
  if(!G)return;
  const cwrap=document.getElementById('companionWrap');
  const swrap=document.getElementById('spiritWeaponWrap');
  const csprite=document.getElementById('companionSprite');
  const ssprite=document.getElementById('spiritWeaponSprite');

  // Ranger wolf companion — visible when class is ranger
  const showWolf=G.classId==='ranger';
  if(cwrap){
    if(showWolf){
      cwrap.classList.add('active');
      if(csprite&&!csprite.children.length){
        renderSprite(COMPANION_SPRITES.wolf,9,csprite);
      }
      // Tint green when Beast's Aid is ready (freshly cast)
      cwrap.style.filter=G.sx&&G.sx.beastBlock
        ?'drop-shadow(0 0 6px #27ae60)'
        :'drop-shadow(0 0 4px #8b6914)';
    } else {
      cwrap.classList.remove('active');
    }
  }

  // Cleric spiritual weapon — visible when active
  const showSword=G.classId==='cleric'&&G.spiritualWeaponActive;
  if(swrap){
    if(showSword){
      swrap.classList.add('active');
      if(ssprite&&!ssprite.children.length){
        renderSprite(COMPANION_SPRITES.sword,11,ssprite);
      }
      // Show turns left as glow intensity
      const turnsLeft=G.spiritualWeaponTurns||0;
      const glow=turnsLeft>3?'0 0 10px #3498db, 0 0 5px #7ecfff':'0 0 5px #3498db';
      swrap.style.filter=`drop-shadow(${glow})`;
    } else {
      swrap.classList.remove('active');
      if(ssprite)ssprite.innerHTML=''; // clear so it re-renders fresh next time
    }
  }
}

function renderAll(){
  renderHUD();
  renderSkillButtons();
  renderCompanions();
  renderInventory();
  renderEquipSlots();
  renderUpgrades();
  renderConditions();
  renderTalentList();
  renderZoneBar();
  renderSpellSlots();
  updateQuickButtons();
  renderObjectiveStatus();
  // Keep inline char sheet stats live
  const _csiB=document.getElementById('csiBody');
  if(_csiB&&_csiB.classList.contains('open'))renderInlineCharSheet();
}

// ══════════════════════════════════════════════════════════
//  HUD
// ══════════════════════════════════════════════════════════
function swapBearBars(active, currentHp, maxHp){
  const hw=document.getElementById('humanHpBarWrap');
  const bw=document.getElementById('bearHpBarWrap');
  const bf=document.getElementById('bearHpFill');
  const bt=document.getElementById('bearHpText');
  const btrack=document.getElementById('bearHpTrack');
  if(active){
    if(hw)hw.style.display='none';
    if(bw)bw.style.display='block';
    const pct=maxHp>0?Math.max(0,Math.min(100,(currentHp/maxHp)*100)):100;
    if(bf)bf.style.width=pct+'%';
    if(pct<25){
      if(bf)bf.style.background='linear-gradient(90deg,#3a0d00,#c0392b)';
      if(btrack){btrack.style.borderColor='#c0392b';btrack.style.boxShadow='0 0 12px #c0392b';}
    } else if(pct<50){
      if(bf)bf.style.background='linear-gradient(90deg,#5a2000,#e67e22)';
      if(btrack){btrack.style.borderColor='#e67e22';btrack.style.boxShadow='0 0 12px #e67e22';}
    } else {
      if(bf)bf.style.background='linear-gradient(90deg,#5a2e00,#cd853f)';
      if(btrack){btrack.style.borderColor='#cd853f';btrack.style.boxShadow='0 0 12px #cd853f';}
    }
    if(bt)bt.textContent='\u{1F43B} '+Math.ceil(currentHp)+' / '+maxHp;
  } else {
    if(hw)hw.style.display='';
    if(bw)bw.style.display='none';
  }
}

function renderHUD(){
  if(!G)return;
  const hpPct=Math.max(0,G.hp/G.maxHp*100);
  document.getElementById('barHp').style.width=hpPct+'%';
  document.getElementById('barHp').style.background=hpPct<25?'linear-gradient(90deg,#5a0505,#c0392b)':hpPct<50?'linear-gradient(90deg,#8b3a10,#d35400)':'linear-gradient(90deg,#6b1a1a,#c0392b)';
  document.getElementById('txtHp').textContent=Math.ceil(G.hp)+'/'+G.maxHp;

  let resPct=0,resTxt='';
  if(G.classId==='wizard'){
    const tot=Object.values(G.spellSlots||{}).reduce((a,b)=>a+b,0);
    const mx=Object.values(G.spellSlotsMax||{}).reduce((a,b)=>a+b,0);
    resPct=mx?tot/mx*100:0; resTxt=tot+'/'+mx+' slots';
  } else {
    resPct=G.resMax?G.res/G.resMax*100:0;
    resTxt=Math.floor(G.res)+'/'+G.resMax;
  }
  document.getElementById('barRes').style.width=resPct+'%';
  document.getElementById('txtRes').textContent=resTxt;

  const xpPct=G.xp/G.xpNeeded*100;
  document.getElementById('barXp').style.width=xpPct+'%';
  document.getElementById('txtXp').textContent=Math.floor(G.xp)+'/'+G.xpNeeded;

  document.getElementById('heroLvl').textContent='LVL '+G.level;
  document.getElementById('heroSub').textContent=G.subclassUnlocked?CLASSES[G.classId].subclass.name:'';
  document.getElementById('goldVal').textContent=G.gold;
  document.getElementById('profVal').textContent='+'+G.profBonus;

  // Player battle HP bar
  const _phf=document.getElementById('playerHpFill');
  if(_phf){_phf.style.width=hpPct+'%';_phf.style.background=hpPct<25?'var(--red2)':hpPct<50?'var(--orange2)':'var(--green2)';}

  // Shield/barrier overlay on HP bar
  renderShieldBar();

  // Wild Shape — swap bars
  if(G.classId==='druid')swapBearBars(G.wildShapeActive&&G.wildShapeHp>0, G.wildShapeHp, G._wildShapeMaxHp||G.wildShapeHp);

  // Barbarian rage visual — red glow on sprite
  const pSprHud=document.getElementById('playerSprite');
  if(pSprHud&&G.classId==='barbarian'&&!G.wildShapeActive){
    if(G.raging){
      pSprHud.style.animation='idle-bob 2.2s ease-in-out infinite, rage-glow 0.8s ease-in-out infinite';
    } else {
      // Only clear if it was rage-style, not something else (druid etc handled separately)
      if(pSprHud.style.animation&&pSprHud.style.animation.includes('rage-glow')){
        pSprHud.style.animation='idle-bob 2.2s ease-in-out infinite';
        pSprHud.style.filter='';
      }
    }
  }
}

function renderShieldBar(){
  if(!G) return;
  const wrap = document.getElementById('humanHpBarWrap');
  if(!wrap) return;
  // Total shield = Holy Ward + Dawn Blessing
  const holyWard = G.holyWardHp || 0;
  const dawn = G.dawnBlessingShield || 0;
  const totalShield = holyWard + dawn;
  let shieldEl = document.getElementById('playerShieldFill');
  if(totalShield > 0){
    // Shield bar shows as gold overlay on top of the HP bar
    const shieldPct = Math.min(100, (totalShield / G.maxHp) * 100);
    if(!shieldEl){
      shieldEl = document.createElement('div');
      shieldEl.id = 'playerShieldFill';
      shieldEl.style.cssText = 'position:absolute;right:0;top:0;height:100%;background:linear-gradient(90deg,rgba(200,168,50,0.5),rgba(255,220,80,0.85));pointer-events:none;transition:width 0.25s;border-left:1px solid #ffdd44;';
      wrap.style.position = 'relative';
      wrap.appendChild(shieldEl);
    }
    shieldEl.style.width = shieldPct + '%';
    shieldEl.title = totalShield + ' shield HP remaining';
    // Label
    let shieldLbl = document.getElementById('playerShieldLabel');
    if(!shieldLbl){
      shieldLbl = document.createElement('div');
      shieldLbl.id = 'playerShieldLabel';
      shieldLbl.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:flex-end;padding-right:4px;font-family:"Press Start 2P",monospace;font-size:5px;color:#ffdd44;text-shadow:1px 1px 0 #000;pointer-events:none;z-index:2;';
      wrap.appendChild(shieldLbl);
    }
    shieldLbl.textContent = '🛡' + totalShield;
  } else {
    // Remove shield elements if shield is gone
    if(shieldEl) shieldEl.style.width = '0';
    const lbl = document.getElementById('playerShieldLabel');
    if(lbl) lbl.textContent = '';
  }
}

function renderSkillButtons(){
  if(!G)return;
  const cls=CLASSES[G.classId];
  const now=Date.now();
  ['action','bonus','reaction'].forEach(type=>{
    const container=document.getElementById(type+'Skills');
    const skills=cls.skills.filter(s=>s.type===type && (!s.subclassOnly || G.subclassUnlocked) && (!s.ultimateOnly || G.ultimateUnlocked));
    container.innerHTML=skills.map(sk=>{
      const cdRaw=G.skillCooldowns[sk.id];
      // cdRaw can be a timestamp OR the string 'active' (for rage)
      const cdEnd=(cdRaw==='active')?Infinity:(cdRaw||0);
      const cdLeft=cdEnd===Infinity?-1:Math.max(0,Math.ceil((cdEnd-now)/1000));
      const typeUsed=(type==='action'&&G.actionUsed)||(type==='bonus'&&G.bonusUsed)||(type==='reaction'&&G.reactionUsed);
      const skillEffCost=sk.id==='divine_smite'&&G.talents.includes('Holy Fervor')?Math.max(1,sk.cost-1):sk.cost;
      const noRes=skillEffCost>0&&G.res<skillEffCost;
      const noSlot=sk.slotCost&&(!G.spellSlots||(G.spellSlots[sk.slotCost]||0)===0)&&!G._timeStopActive&&!G._arcaneTranscendence;
      const noCombo=sk.comboReq&&G.res<sk.comboReq;
      const chargesLeft=sk.charges?(G.skillCharges[sk.id]||0):null;
      const noCharges=sk.charges&&chargesLeft<=0;
      // Reactions are ONLY usable via the prompt on enemy turn, never on your turn
      const reactionOnYourTurn = type==='reaction' && G.isPlayerTurn;
      // Wild Shape skill locks (visual)
      const bearLocked = G.classId==='druid' && G.wildShapeHp>0 && ['thorn_whip','moonbeam','entangle'].includes(sk.id);
      const clawLocked  = sk.id==='claw_strike' && (!G.wildShapeHp || G.wildShapeHp<=0);
      const rageRequired = sk.rageReq && !G.raging;
      const bearRequired = sk.bearReq && (!G.wildShapeHp || G.wildShapeHp <= 0);
      // Elemental Wild Shape locked when already in any wild shape form, or wild_shape locked when elemental form active
      const formLocked = (sk.id==='elemental_wild_shape' && G.wildShapeHp>0) || (sk.id==='wild_shape' && G._elementalForm && G.wildShapeHp>0);
      const disabled=typeUsed||noRes||noSlot||noCombo||noCharges||cdLeft>0||(!G.isPlayerTurn&&type!=='reaction')||paused||reactionOnYourTurn||bearLocked||clawLocked||rageRequired||bearRequired||formLocked;
      const pipHtml=sk.charges?`<span class="sk-charges">${Array.from({length:sk.charges},(_,i)=>i<chargesLeft?'●':'○').join('')}</span>`:'';
      return `<button class="skill-btn" ${disabled?'disabled':''} onclick="useSkill('${sk.id}')">
        <span class="sk-icon">${sk.icon}</span>
        <div class="sk-info">
          <span class="sk-name">${sk.name}</span>
          <span class="sk-type ${type}">${type.toUpperCase()}${sk.cost>0?' · '+sk.cost+' '+cls.res.split(' ')[0].substring(0,3):sk.comboReq?' · '+sk.comboReq+' Combo':''}</span>
          ${sk.slotCost?`<span class="sk-type" style="color:var(--blue2)"> · LVL${sk.slotCost} slot</span>`:''}
          <br><span class="sk-type" style="font-size:11px;color:var(--dim)">${sk.desc}</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">
          ${cdLeft>0?`<span class="sk-cd">${cdLeft}s</span>`:cdLeft===-1?`<span class="sk-cd" style="color:var(--orange2)">ACTIVE</span>`:''}
          ${pipHtml}
        </div>
      </button>`;
    }).join('');
  });

  // AE pips
  document.getElementById('pip-action').className='ae-pip '+(G.actionUsed||!G.isPlayerTurn?'spent':'avail');
  document.getElementById('pip-bonus').className='ae-pip '+(G.bonusUsed||!G.isPlayerTurn?'spent':'avail');
  document.getElementById('pip-reaction').className='ae-pip '+(G.reactionUsed?'spent':'avail');

  // End turn button
  document.getElementById('endTurnBtn').disabled=!G.isPlayerTurn||paused;
}

function renderConditions(){
  const el=document.getElementById('condList');
  const condColors={Poisoned:'#27ae60',Burning:'#e67e22',Stunned:'#f1c40f',Frightened:'#9b59b6',Restrained:'#3498db'};
  const condIcons={Poisoned:'☠',Burning:'🔥',Stunned:'💫',Frightened:'😨',Restrained:'🔒'};
  let html='';
  // Show concentration indicator for ranger
  if(G&&G.concentrating==='hunters_mark'&&G.hunterMarked){
    html+=`<div class="cond-item" style="color:#16a085;">🎯 Concentrating (Mark)</div>`;
  }
  if(!G||G.conditions.length===0){el.innerHTML=html||'<span style="color:var(--dim);font-size:14px;">None</span>';return;}
  html+=G.conditions.map(c=>{
    const col=condColors[c]||'#9b59b6';
    const icon=condIcons[c]||'⚠';
    const turns=G.conditionTurns&&G.conditionTurns[c]?` (${G.conditionTurns[c]})`:'';
    return `<div class="cond-item" style="color:${col};">${icon} ${c}${turns}</div>`;
  }).join('');
  el.innerHTML=html;
}

function renderTalentList(){
  const el=document.getElementById('talentListMain');
  if(!el||!G)return;
  if(!G.talents||!G.talents.length){
    el.innerHTML='<span style="color:var(--dim);font-size:12px;padding:4px;display:block;">None yet</span>';
    return;
  }
  el.innerHTML=G.talents.map(t=>{
    const td=(TALENT_POOLS[G.classId]||[]).find(p=>p.name===t);
    return `<div style="padding:4px 6px;margin-bottom:4px;background:rgba(0,0,0,.3);border-left:2px solid var(--orange2);">
      <div style="font-family:'Press Start 2P',monospace;font-size:6px;color:var(--orange2);margin-bottom:2px;">${td?td.icon:''} ${t}</div>
      <div style="font-size:11px;color:var(--dim);line-height:1.4;">${td?td.desc:''}</div>
    </div>`;
  }).join('');
}

function renderZoneBar(){
  if(!G)return;
  const z=ZONES[G.zoneIdx];
  const pct=Math.min(100,G.zoneKills/z.kills*100);
  document.getElementById('zoneFill').style.width=pct+'%';
  document.getElementById('zoneKillsTxt').textContent=Math.min(G.zoneKills,z.kills)+'/'+z.kills;
}

function renderSpellSlots(){
  if(!G||G.classId!=='wizard')return;
  const el=document.getElementById('spellSlotDisplay');
  el.innerHTML=Object.entries(G.spellSlotsMax||{}).map(([lvl,mx])=>{
    const cur=G.spellSlots[lvl]||0;
    const pips=Array(mx).fill(0).map((_,i)=>`<span style="display:inline-block;width:10px;height:10px;border:2px solid var(--border);background:${i<cur?'var(--blue2)':'#000'};margin-right:2px;"></span>`).join('');
    return `<div style="margin-bottom:4px;">LVL${lvl}: ${pips} ${cur}/${mx}</div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════
//  TURN SYSTEM
// ══════════════════════════════════════════════════════════
function setPlayerTurn(isPlayer){
  G.isPlayerTurn=isPlayer;
  if(isPlayer){G.actionUsed=false; G.bonusUsed=false; G.reactionUsed=false;
    // Relentless: reset once-per-turn kill flag
    if(G._relentless)G._relentlessUsed=false;
    // Thunder Clap: reset once-per-turn flag
    if(G.talents&&G.talents.includes('Thunder Clap'))G._thunderClapUsed=false;
    // Wrath of God: reset once-per-turn flag
    if(G._wrathOfGod)G._wrathOfGodUsed=false;
    // Deadeye: reset once-per-turn crit flag
    if(G._deadeye)G._deadeyeUsed=false;
    // Electric Reflexes: gain 1 Combo Point at start of each turn
    if(G.classId==='rogue'&&G._electricReflexes)G.res=Math.min(G.resMax,G.res+1);
    // Smite Chain: reset once per turn
    if(G.classId==='paladin'&&G._smiteChain)G._smiteChainUsed=false;
    // Pack Tactics: beast companion attacks automatically each turn
    if(G.classId==='ranger'&&G._packTactics&&G.subclassUnlocked&&G.currentEnemy&&G.currentEnemy.hp>0){
      const ptDmg=roll(6)+Math.floor(G.level/2);
      if(typeof dealToEnemy==='function'){dealToEnemy(ptDmg,false,'Pack Tactics 🐺 auto-attack');}
    }
    // Battle Trance: raging restores 5 HP at start of each player turn
    if(G.classId==='barbarian'&&G._battleTrance&&G.raging){
      G.hp=Math.min(G.maxHp,G.hp+5);
      if(typeof spawnFloater==='function')spawnFloater(5,'heal',false);
      if(typeof log==='function')log('🩺 Battle Trance: +5 HP from rage!','s');
    }
  }
  const ts=document.getElementById('turnState');
  if(isPlayer){
    ts.textContent='⚔ YOUR TURN';
    ts.className='turn-state your-turn';
    // Regen resources passively each turn
    if(G.classId!=='wizard'){
      let tick=CLASSES[G.classId].resPerTick||0.5;
      if(G.classId==='druid'&&G.talents.includes('Nature Bond'))tick*=1.5;
      G.res=Math.min(G.resMax,G.res+tick);
      // Devoted Soul: each Devotion regenerated also heals 2 HP
      if(G.classId==='cleric'&&G._devotedSoul&&tick>0){G.hp=Math.min(G.maxHp,G.hp+2);}
    }
    // Rogue gets extra combo regen on top (builds faster)
    if(G.classId==='rogue') G.res=Math.min(G.resMax,G.res+0.5);
    // Champion Survivor
    if(G.classId==='fighter'&&G.subclassUnlocked&&G.hp<G.maxHp/2){
      const srv=5+md(G.stats.con);G.hp=Math.min(G.maxHp,G.hp+srv);
      if(srv>0)log(`Survivor: +${srv} HP`,'s');
    }
    G.roundNum++;
    // Capstone per-turn passives
    if(G.capstoneUnlocked){
      if(G.classId==='paladin'){G.res=Math.min(G.resMax,(G.res||0)+1);log('Avatar of Light: +1 Holy Power','s');}
      if(G.classId==='cleric'){G.res=Math.min(G.resMax,(G.res||0)+1);}
      if(G.classId==='druid'){G.res=Math.min(G.resMax,(G.res||0)+1);}
      if(G.classId==='barbarian'&&G.raging){G.hp=Math.min(G.maxHp,G.hp+3);}
    }
    // Primal Avatar per-turn damage
    if(G.sx&&G.sx.primalAvatar>0&&G.currentEnemy&&G.currentEnemy.hp>0){
      G.sx.primalAvatar--;
      const paDot=roll(6)+roll(6)+roll(6);
      if(G.sx.primalAvatar===0){dealToEnemy(paDot+8,false,'Primal Avatar 🌿 expiry burst');delete G.sx.primalAvatar;log('Primal Avatar fades — nature reclaims its power!','s');}
    }
    renderAll();
  } else {
    ts.textContent='🔴 ENEMY TURN';
    ts.className='turn-state enemy-turn';
    renderSkillButtons();
    // Enemy acts after short delay
    if(enemyTurnTimeout)clearTimeout(enemyTurnTimeout);
    enemyTurnTimeout=setTimeout(doEnemyTurn,1400);
  }
}

function exitWildShape(){
  if(!G||G.classId!=='druid'||!G.wildShapeActive)return;
  const wasElemental=G._elementalForm;
  G.wildShapeHp=0;
  G.wildShapeActive=false;
  G._elementalForm=false;
  G._elementalImmune=false;
  delete G.skillCooldowns['wild_shape'];
  // Restore human stats
  if(G._humanStats){
    G.stats.str=G._humanStats.str;
    G.stats.con=G._humanStats.con;
    G.atk=G._humanStats.atk;
    G.def=G._humanStats.def;
    G._humanStats=null;
  }
  swapBearBars(false);
  // Restore druid sprite
  const pSpr=document.getElementById('playerSprite');
  if(pSpr&&CLASS_SPRITES[G.classId])renderSprite(CLASS_SPRITES[G.classId],10,pSpr);
  startPlayerAnim();
  if(pSpr)pSpr.style.filter='';
  const exitBtn=document.getElementById('exitWildShapeBtn');
  if(exitBtn)exitBtn.style.display='none';
  log(wasElemental?'🔥 You release Elemental Form — druid restored.':'🌿 You drop Wild Shape — stats restored.','s');
  // Wild Surge: deal 1d6 nature damage on exit too
  if(G._wildSurge&&G.currentEnemy&&G.currentEnemy.hp>0){
    const wsd=roll(6);
    if(typeof dealToEnemy==='function'){dealToEnemy(wsd,false,'Wild Surge 🌿 exit burst');}
    if(typeof log==='function')log('🌿 Wild Surge: +'+wsd+' nature damage on exit!','c');
  }
  renderAll();
}

// ══════════════════════════════════════════════════════════
//  BRANCH ZONES
// ══════════════════════════════════════════════════════════
let _currentBranch = null;

function travelToBranch(branchId){
  const branch = BRANCH_ZONES.find(b=>b.id===branchId);
  if(!branch) return;
  _currentBranch = branch;
  // Save entire zone state so we can restore it after the branch
  G._savedZoneState = {
    zoneIdx: G.zoneIdx,
    dungeonFights: G.dungeonFights,
    campUnlocked: G.campUnlocked,
    dungeonGoal: G.dungeonGoal,
    zoneKills: G.zoneKills,
    bossReady: G.bossReady,
    restsThisZone: G.restsThisZone,
  };
  // Branch runs in isolated state — doesn't touch main zone progress
  G.dungeonGoal = 999; // disable campfire unlock during branch
  G._inBranch = true;
  G._branchFights = 0;
  G._branchFightsRequired = 5;
  G.conditions = []; G.conditionTurns = {}; G.sx = {};
  G.raging = false; G.hunterMarked = false; G.concentrating = null;
  G.wildShapeHp = 0; G.wildShapeActive = false;
  G.skillCooldowns = {};
  G.skillCharges = {};
  CLASSES[G.classId].skills.forEach(sk=>{ if(sk.charges) G.skillCharges[sk.id]=sk.charges; });
  G.currentEnemy = null;
  // Show story intro screen for the branch
  showBranchIntro(branch);
}

function showBranchIntro(branch){
  document.getElementById('storyZoneTag').textContent = `SIDE BRANCH — ${branch.name.toUpperCase()}`;
  document.getElementById('storyTitle').textContent = branch.story.title;
  const healBadge = document.getElementById('storyHealBadge');
  if(healBadge) healBadge.style.display = 'none';
  const bodyEl = document.getElementById('storyBody');
  bodyEl.textContent = '';
  let i = 0;
  const t = setInterval(()=>{ bodyEl.textContent += branch.story.text[i++]; if(i>=branch.story.text.length) clearInterval(t); }, 28);
  // Branch warning
  const mechLabel = {gauntlet:'⚠ No campfire — 5 fights straight!', double_loot:'💰 Double loot — but enemies hit harder!', poison_spreading:'☠ Spores infect — watch your conditions!', event_combat:'🎲 Random events before each fight!'};
  setTimeout(()=>{
    const extra = document.createElement('div');
    extra.style.cssText = 'font-family:"Press Start 2P",monospace;font-size:7px;color:#cc9944;margin-top:16px;letter-spacing:1px;';
    extra.textContent = mechLabel[branch.mechanic] || '';
    bodyEl.appendChild(extra);
  }, 200);
  AUDIO.playBGM('boss');
  showScreen('story');
}

function enterBranch(){
  showScreen('game');
  const branch = _currentBranch;
  if(!branch) return;
  // Setup UI
  document.getElementById('zoneNameLabel').textContent = branch.name + ' ★';
  document.getElementById('bgSky').className = 'bg-layer ' + branch.bgSky;
  document.getElementById('bgGround').className = 'bg-layer ' + branch.bgGround;
  document.getElementById('bgTrees').style.display = 'none';
  document.getElementById('bossAlert').style.display = 'none';
  renderAll();
  spawnBranchEnemy();
}

function spawnBranchEnemy(){
  const branch = _currentBranch;
  if(!branch) return;
  G._branchFights = G._branchFights || 0;
  // After 5 regular fights, spawn boss
  const isBoss = G._branchFights >= 5;
  const eData = isBoss ? branch.boss : branch.enemies[Math.floor(Math.random()*branch.enemies.length)];
  // Scale to player level — harder than main path (+15%)
  const lvlScale = (1 + (G.level-1)*0.06) * 1.15;
  const diffAtkMult = G.difficulty==='hard'?1.15:G.difficulty==='hardcore'?1.25:1;
  const effectiveLvl = Math.max(1, Math.round((lvlScale-1)/0.06)+1);
  G.currentEnemy = {
    ...eData, isBoss,
    effectiveLvl,
    maxHp: Math.floor(eData.hp*lvlScale),
    hp:    Math.floor(eData.hp*lvlScale),
    atk:   Math.floor(eData.atk*lvlScale*0.9*diffAtkMult*(branch.mechanic==='double_loot'?1.25:1)),
    def:   Math.floor((eData.def||0)*lvlScale*0.8),
    xp:    Math.floor(eData.xp*lvlScale),
    gold:  Math.floor((eData.gold||5)*(branch.mechanic==='double_loot'?2:1)*(0.8+Math.random()*0.5)),
    conditions: [],
    isBranchEnemy: true,
  };
  // Apply mechanic: fungal warren — enemies start poisoned (can spread)
  if(branch.mechanic==='poison_spreading'&&!isBoss){
    G.currentEnemy.conditions = [{name:'Poisoned',turns:3}];
    log('🍄 The enemy reeks of spores — already Poisoned!','c');
  }
  // Render sprite
  const eEl = document.getElementById('enemySprite');
  const spriteData = isBoss ? BOSS_SPRITES[eData.sprite] : ENEMY_SPRITES[eData.sprite];
  if(spriteData) renderSprite(spriteData, isBoss?13:11, eEl);
  eEl.className = isBoss ? 'boss-anim' : 'idle-anim';
  eEl.style.filter = `drop-shadow(0 0 4px ${eData.color})`;
  const lvlBadge = `<span style="font-size:11px;color:var(--dim);margin-left:6px;">Lv.${effectiveLvl}</span>`;
  document.getElementById('enemyNameTag').innerHTML = (isBoss?`⚠ ${G.currentEnemy.name}`:G.currentEnemy.name)+lvlBadge;
  document.getElementById('enemyNameTag').className = 'fighter-name-tag '+(isBoss?'boss-name-tag':'');
  document.getElementById('enemyHpFill').style.width='100%';
  const txt=document.getElementById('enemyHpText');
  if(txt) txt.textContent=G.currentEnemy.maxHp+' / '+G.currentEnemy.maxHp+' HP';
  // Restore battle UI
  const neb=document.getElementById('nextEnemyBtn');
  const etb=document.getElementById('endTurnBtn');
  if(neb) neb.style.display='none';
  if(etb) etb.style.display='block';
  G.roundNum=0; G.firstAttackUsed=false;
  if(isBoss){ AUDIO.sfx.bossAppear(); log(`⚠ BRANCH BOSS: ${eData.name}!`,'e'); log(eData.title,'e'); }
  else { log(`A ${G.currentEnemy.name} emerges from the dark!`,'s'); }
  setPlayerTurn(true);
}

function onBranchEnemyDefeated(){
  const branch = _currentBranch;
  if(!branch) return;
  G._branchFights = (G._branchFights||0) + 1;
  const isBossKill = G.currentEnemy && G.currentEnemy.isBoss;
  if(isBossKill){
    // Branch complete!
    G.branchDefeated[branch.id] = true;
    G._inBranch = false;
    const bossName = G.currentEnemy.name;
    const bossTitle = G.currentEnemy.title || '';
    G.currentEnemy = null;
    setTimeout(()=>{
      showBossVictory(bossName, bossTitle, ()=>{
        // Restore full zone state from before the branch
        const saved = G._savedZoneState || {};
        G.zoneIdx = saved.zoneIdx ?? (G._returnZoneIdx || 0);
        G.dungeonFights = saved.dungeonFights ?? 0;
        G.campUnlocked = saved.campUnlocked ?? false;
        G.dungeonGoal = saved.dungeonGoal ?? (G.difficulty==='normal'?3:5);
        G.zoneKills = saved.zoneKills ?? 0;
        G.bossReady = saved.bossReady ?? false;
        G.restsThisZone = saved.restsThisZone ?? 0;
        G._savedZoneState = null;
        _currentBranch = null;
        showBranchReward(branch);
      });
    }, 900);
  } else {
    // Next branch fight
    G.currentEnemy = null;
    renderAll();
    G.dungeonFights++;
    const neb=document.getElementById('nextEnemyBtn');
    const etb=document.getElementById('endTurnBtn');
    const remaining = 5 - G._branchFights;
    if(neb){
      neb.textContent = remaining > 0 ? `⚔ NEXT ENEMY (${remaining} left)` : '⚔ FACE THE BOSS ▶';
      neb.style.display='block';
    }
    if(etb) etb.style.display='none';
    log(`Fight ${G._branchFights}/5 complete.${remaining>0?' Press on — no rest here.':' The boss awaits...'}`, 's');
  }
}

function showBranchReward(branch){
  // Roll random reward type
  const roll_r = Math.random();
  let rewardType;
  if(roll_r < 0.25) rewardType = 'legendary';
  else if(roll_r < 0.50) rewardType = 'stat';
  else if(roll_r < 0.75) rewardType = 'choice';
  else rewardType = 'epic_gold';

  const overlay = document.getElementById('branchRewardOverlay');
  const titleEl = document.getElementById('branchRewardTitle');
  const bodyEl  = document.getElementById('branchRewardBody');
  if(!overlay) { enterReturnZone(); return; }

  titleEl.textContent = `${branch.icon} ${branch.name.toUpperCase()} COMPLETE!`;

  if(rewardType === 'legendary'){
    const item = ITEMS.find(i=>i.id===branch.boss.legendaryDrop);
    bodyEl.innerHTML = `<div class="br-sub">LEGENDARY REWARD</div>
      <div class="br-item-box">
        <span class="br-item-icon">${item?item.icon:'✨'}</span>
        <div class="br-item-name">${item?item.name:'Ancient Relic'}</div>
        <div class="br-item-desc">${item&&item.desc?item.desc:''}</div>
      </div>
      <button class="br-claim-btn" onclick="claimBranchReward('legendary','${branch.boss.legendaryDrop}')">✦ CLAIM ✦</button>`;
  } else if(rewardType === 'stat'){
    const stat = BRANCH_STAT_BONUSES[Math.floor(Math.random()*BRANCH_STAT_BONUSES.length)];
    bodyEl.innerHTML = `<div class="br-sub">PERMANENT BONUS</div>
      <div class="br-stat-box">⚔ ${stat.label}</div>
      <div class="br-note">This bonus applies permanently for this run.</div>
      <button class="br-claim-btn" onclick="claimBranchReward('stat',${JSON.stringify(stat.label).replace(/"/g,"'")})">✦ CLAIM ✦</button>`;
    window._pendingBranchStat = stat;
  } else if(rewardType === 'choice'){
    const pool = BRANCH_PASSIVE_CHOICES[Math.floor(Math.random()*BRANCH_PASSIVE_CHOICES.length)];
    bodyEl.innerHTML = `<div class="br-sub">CHOOSE A PASSIVE</div>
      ${pool.map((p,i)=>`<div class="br-choice-card" onclick="claimBranchReward('passive',${i})">
        <div class="br-choice-name">${p.name}</div>
        <div class="br-choice-desc">${p.desc}</div>
      </div>`).join('')}`;
    window._pendingBranchChoices = pool;
  } else {
    // epic_gold: guaranteed epic item + big gold
    const epicItems = ITEMS.filter(i=>i.rarity==='epic');
    const picked = epicItems[Math.floor(Math.random()*epicItems.length)];
    const goldAmt = 80 + G.level * 12;
    bodyEl.innerHTML = `<div class="br-sub">TREASURE TROVE</div>
      <div class="br-item-box">
        <span class="br-item-icon">${picked?picked.icon:'💎'}</span>
        <div class="br-item-name">${picked?picked.name:'Epic Relic'}</div>
      </div>
      <div class="br-stat-box">🪙 +${goldAmt} Gold</div>
      <button class="br-claim-btn" onclick="claimBranchReward('epic_gold','${picked?picked.id:''}',${goldAmt})">✦ CLAIM ✦</button>`;
    window._pendingBranchEpic = {item:picked, gold:goldAmt};
  }

  overlay.style.display = 'flex';
  AUDIO.playBGM('victory');
}

function claimBranchReward(type, arg, arg2){
  if(type==='legendary'){
    const item = ITEMS.find(i=>i.id===arg);
    if(item) addItem({...item,qty:1});
    log(`✨ BRANCH LEGENDARY: ${item?item.name:'Ancient Relic'} added to inventory!`,'l');
  } else if(type==='stat'){
    const stat = window._pendingBranchStat;
    if(stat){ stat.apply(G); log(`⚔ BRANCH BONUS: ${stat.label} applied permanently!`,'l'); }
    window._pendingBranchStat = null;
  } else if(type==='passive'){
    const idx = parseInt(arg);
    const choices = window._pendingBranchChoices;
    if(choices&&choices[idx]){
      G.branchPassives = G.branchPassives || [];
      G.branchPassives.push(choices[idx].name);
      applyBranchPassive(choices[idx].name);
      log(`✦ PASSIVE GAINED: ${choices[idx].name} — ${choices[idx].desc}`,'l');
    }
    window._pendingBranchChoices = null;
  } else if(type==='epic_gold'){
    const data = window._pendingBranchEpic;
    if(data){
      if(data.item) addItem({...data.item,qty:1});
      G.gold += data.gold; G.totalGold += data.gold;
      log(`💰 BRANCH TREASURE: ${data.item?data.item.name:''} + ${data.gold} gold!`,'l');
    }
    window._pendingBranchEpic = null;
  }
  document.getElementById('branchRewardOverlay').style.display = 'none';
  enterReturnZone();
}

function applyBranchPassive(name){
  if(!G) return;
  switch(name){
    case 'Iron Skin':      G._branchIronSkin=true; break;
    case 'Battle Hardened':G._branchBattleHardened=true; break;
    case 'Scavenger':      G._branchScavenger=true; break;
    case 'Predator':       G._branchPredator=true; break;
    case 'Swift Hands':    G._branchSwiftHands=true; break;
    case 'Veteran':        G.atk+=5; G.def+=3; break;
    case 'Death Defiant':  G._branchDeathDefiant=true; break;
    case 'Arcane Infusion':G.magBonus=(G.magBonus||0)+10; break;
    case 'Relentless':     G._branchRelentlessHeal=true; break;
    case 'Sixth Sense':    G._branchSixthSense=true; break;
    case 'Treasure Hunter':G.goldMult=(G.goldMult||1)*1.4; break;
    case 'Combat Mastery': G.atk+=3; G.def+=3; G.maxHp+=15; G.hp=Math.min(G.maxHp,G.hp+15); break;
  }
}

function enterReturnZone(){
  AUDIO.stopBGM();
  // Return to current zone — if camp was unlocked before the branch, offer it
  if(G.campUnlocked){
    showCampfire();
  } else {
    showScreen('game');
    setupGameUI();
    initObjective(G.zoneIdx);
    renderObjectiveStatus();
    renderAll();
    // Show next enemy button so player chooses when to fight
    const neb=document.getElementById('nextEnemyBtn');
    const etb=document.getElementById('endTurnBtn');
    if(neb){neb.textContent='⚔ NEXT ENEMY ▶';neb.style.display='block';}
    if(etb)etb.style.display='none';
  }
}

// ══════════════════════════════════════════════════════════
//  SPAWN ENEMY
// ══════════════════════════════════════════════════════════
function spawnEnemy(){
  const z=ZONES[G.zoneIdx];
  let eData;
  let isBoss=false;
  if(G.bossReady&&!G.bossDefeated[G.zoneIdx]){
    eData=z.boss; isBoss=true;
    AUDIO.playBGM('boss');
    AUDIO.sfx.bossAppear();
    log(`⚠ THE BOSS EMERGES: ${z.boss.name}!`,'s');
    log(`${z.boss.title}`,'e');
  } else {
    eData=z.enemies[Math.floor(Math.random()*z.enemies.length)];
  }
  // === ENEMY SCALING ===
  // 1) Base: player level drives a gentle power curve
  const lvlScale = 1 + (G.level - 1) * 0.06;
  // 2) Within-zone progression: small bump as zone progresses, capped at +10%
  const zoneProgress = 1 + Math.min(0.10, Math.floor((G.zoneKills || 0) / 3) * 0.03);
  // 3) Over-level bonus: only kicks in well above the zone's recommended level
  const zoneLvl = [1,5,8,12,16][G.zoneIdx] || 1;
  const overLvl = Math.max(0, G.level - (zoneLvl + 6)); // wider grace window of 6 levels
  const catchUp = Math.min(1.4, 1 + overLvl * 0.05); // gentler catch-up, lower cap
  // 4) Bosses get a small bump — their base stats already make them tough
  const bossBonus = isBoss ? 1.05 : 1;
  const diffAtkMult = G.difficulty==='hard' ? 1.15 : G.difficulty==='hardcore' ? 1.25 : 1;
  const scale = lvlScale * zoneProgress * catchUp * bossBonus;
  // Effective enemy level shown in log (for feedback)
  const effectiveLvl = Math.max(1, Math.round((scale - 1) / 0.06) + 1);

  G.currentEnemy={
    ...eData,
    isBoss,
    effectiveLvl,
    maxHp:Math.floor(eData.hp*scale),
    hp:Math.floor(eData.hp*scale),
    atk:Math.floor(eData.atk*scale*.9*diffAtkMult),
    def:Math.floor((eData.def||0)*scale*.8),
    xp:Math.floor(eData.xp*scale),
    gold:Math.floor((eData.gold||5)*(0.8+Math.random()*.5)),
  };

  // Render enemy sprite
  const eEl=document.getElementById('enemySprite');
  const spriteData=isBoss?BOSS_SPRITES[eData.sprite]:ENEMY_SPRITES[eData.sprite];
  if(spriteData) renderSprite(spriteData,isBoss?13:11,eEl);
  eEl.className=isBoss?'boss-anim':'idle-anim';
  eEl.style.filter=`drop-shadow(0 0 4px ${eData.color})`;

  document.getElementById('enemyHpFill').style.width='100%';
  const _eHpTxt=document.getElementById('enemyHpText');
  if(_eHpTxt)_eHpTxt.textContent=G.currentEnemy.maxHp+' / '+G.currentEnemy.maxHp+' HP';
  const lvlBadge = `<span style="font-size:11px;color:var(--dim);margin-left:6px;">Lv.${effectiveLvl}</span>`;
  document.getElementById('enemyNameTag').innerHTML=(isBoss?`⚠ ${G.currentEnemy.name}`:G.currentEnemy.name)+lvlBadge;
  document.getElementById('enemyNameTag').className='fighter-name-tag '+(isBoss?'boss-name-tag':'');

  // Beast Bond: grant a free block at start of fight (not after being hit)
  if(G.classId==='ranger'&&G.talents.includes('Beast Bond')){
    G.sx.beastBlock=true;
    log("Beast Bond: companion stands guard ready to block one hit!",'s');
  }
  G.roundNum=0;
  G.firstAttackUsed=false;
  G._surgeCritBonus=0;
  // Flurry: reset once-per-fight flag
  if(G._flurry)G._flurryUsed=false;
  // Shadow Form/Shadow Step: reset once-per-fight flags
  if(G._shadowForm)G._shadowFormUsed=false;
  if(G._shadowStep)G._shadowStepUsed=false;
  // Explosive Arrow: reset once-per-fight flag
  if(G._explosiveArrow)G._explosiveArrowUsed=false;
  // Seasoned Hunter: reset kill ATK bonus
  if(G._seasonedHunter){
    G.atk-=(G._seasonedHunterBonus||0); // remove last fight's bonus
    G._seasonedHunterBonus=0;
  }
  // Favored Terrain: active for exactly one fight, then consumed
  if(G._favoredTerrainActive){
    log('🌿 Favored Terrain: '+G._favoredTerrainName+' — +15% damage this fight!','s');
    // Flag stays true during this fight; cleared after fight ends
  }
  // Swift Tracker: auto-apply Hunter's Mark at fight start for free
  if(G.classId==='ranger'&&G._swiftTracker&&!G.hunterMarked){
    G.hunterMarked=true;G.concentrating='hunters_mark';
    G.skillCooldowns['hunters_mark']=Date.now()+(999*1000);
    log("🏃 Swift Tracker: Hunter's Mark pre-applied!",'s');
    if(G._bindingMark&&G.currentEnemy){G.currentEnemy.atk=Math.max(1,(G.currentEnemy.atk||0)-4);}
  }
  // War Cry: frighten enemy at fight start once per fight
  if(G.classId==='barbarian'&&G._warCry&&!G._warCryUsed){
    G._warCryUsed=true;
    if(typeof addConditionEnemy==='function'){addConditionEnemy('Frightened',2);}
    if(typeof log==='function')log('⚔️ War Cry: enemy Frightened!','c');
  }
  // Feral Charge: reset first-hit bonus
  if(G._feralCharge)G._feralChargeUsed=false;
  // Arcane Surge: reset spell count at fight start so carry-over doesn't give a free spell
  if(G.classId==='wizard'&&G._arcaneSurgeCount!==undefined)G._arcaneSurgeCount=0;
  // Deadeye: reset per-turn crit flag
  if(G._deadeye)G._deadeyeUsed=false;
  // Undying Fury/Undying Light: resets on new fight (treat as per-rest = per-fight for simplicity)
  if(G._undyingFury)G._undyingFuryUsed=false;
  if(G._undyingLight)G._undyingLightUsed=false;
  // Holy Ward: start each fight with a 15-damage barrier
  if(G.classId==='cleric'&&G._holyWard){G.holyWardHp=15;log('📿 Holy Ward: barrier of 15 HP activated!','s');}
  // Sunrise: heal 10 HP at fight start
  if(G.classId==='cleric'&&G._sunrise){G.hp=Math.min(G.maxHp,G.hp+10);log('🌅 Sunrise: +10 HP!','s');}
  // Overflowing Font: reset per fight
  if(G._overflowingFont)G._overflowingFontUsed=false;
  // Divine Intervention: reset per fight (not per-rest, per-fight for playability)
  if(G._divineIntervention)G._divineInterventionUsed=false;
  // Indomitable: reset per fight
  if(G._indomitable)G._indomitableUsed=false;
  // Prepared Caster: start each fight with +1 LVL1 spell slot (up to max)
  if(G.classId==='wizard'&&G._preparedCaster&&G.spellSlots&&G.spellSlotsMax&&(G.spellSlots[1]||0)<(G.spellSlotsMax[1]||0)){
    G.spellSlots[1]++;
    log('📜 Prepared Caster: bonus LVL1 slot ready!','s');
  }
  // Overcharged: reset once-per-rest flag each fight (campfire = rest)
  if(G._overcharged)G._overchargedUsed=false;
  // Metamagic Twin: reset once-per-rest flag each fight
  if(G._metamagicTwin)G._metamagicTwinUsed=false;
  // Capstone passives at fight start
  if(G.capstoneUnlocked&&G.classId==='ranger')G.hunterMarked=true;
  if(G.capstoneUnlocked&&G.classId==='cleric')G.res=Math.min(G.resMax,(G.res||0)+1);
  if(G.capstoneUnlocked&&G.classId==='barbarian'){G.raging=true;G.rageTurns=999;log('🔥 Eternal Rage: you begin the fight already raging!','s');}
  if(G.capstoneUnlocked&&G.classId==='druid'){G.skillCharges.wild_shape=Math.max(G.skillCharges.wild_shape||0,99);}
  if(G.capstoneUnlocked&&G.classId==='paladin'){G.sx=G.sx||{};}
  // Restore normal battle UI
  const neb=document.getElementById('nextEnemyBtn');
  const etb=document.getElementById('endTurnBtn');
  if(neb)neb.style.display='none';
  if(etb)etb.style.display='block';
  // Battle Hardened branch passive: +10 temp HP at start of every fight
  if(G._branchBattleHardened){G.hp=Math.min(G.maxHp,G.hp+10);log('🛡 Battle Hardened: +10 HP!','s');}
  // Dawn Blessing: apply 30 HP divine barrier (stored as dawnBlessingShield)
  if(G._dawnBlessing){
    G.dawnBlessingShield=30;
    G._dawnBlessing=false;
    log('🌅 Dawn Blessing: 30 HP divine barrier active!','s');
    renderShieldBar();
  }
  log(`A ${G.currentEnemy.name} appears! [Lv.${effectiveLvl}]`,'s');
  setPlayerTurn(true);
}

