function enterZone(){
  // If we're entering a branch, use branch flow instead
  if(G._inBranch && _currentBranch){
    enterBranch();
    return;
  }
  startPlayTimer();
  // ── Chroma tracking: reset per-zone counters ──
  G._markedKillsThisZone=0;
  // Cinematic already played before story screen — go straight to game
  showScreen('game');
  {const bl=document.getElementById('battleLog');if(bl)bl.innerHTML='';}
  setupGameUI();
  initObjective(G.zoneIdx);
  renderObjectiveStatus();
  renderLeftPanel();
  renderCompanions();
  renderModifierHud();
  autoSave();

  // Phase B: Show modifier announcement, THEN spawn first enemy
  if(G._activeModifier){
    showModifierAnnouncement(()=>{
      if(typeof log==='function') log(G._activeModifier.icon+' '+G._activeModifier.name+': '+G._activeModifier.desc,'s');
      spawnEnemy();
    });
  } else {
    spawnEnemy();
  }
}

// ══════════════════════════════════════════════════════════
//  GAME UI SETUP
// ══════════════════════════════════════════════════════════
function setupGameUI(){
  const cls=CLASSES[G.classId];
  const z=ZONES[G.zoneIdx];

  // Hero mini sprite
  const mini=document.getElementById('heroMiniSprite');
  if(window.hasImageSprite && window.hasImageSprite(G.classId)){
    window.renderImageSpriteStatic(G.classId, mini, 60);
  } else if(CLASS_SPRITES[G.classId]){
    renderSprite(CLASS_SPRITES[G.classId],3,mini);
  }

  document.getElementById('heroName').textContent=cls.name.toUpperCase();
  document.getElementById('resLbl').textContent=cls.res.substring(0,3).toUpperCase();

  // BG
  document.getElementById('bgSky').className='bg-layer '+z.bgSky;
  document.getElementById('bgGround').className='bg-layer '+z.bgGround;
  document.getElementById('bgTrees').style.display=z.showTrees?'block':'none';
  document.getElementById('battleStage').setAttribute('data-zone', z.id);

  // Zone bar
  document.getElementById('zoneNameLabel').textContent=z.name;
  document.getElementById('bossAlert').style.display=G.bossReady&&!G.runBossDefeated[G.zoneIdx]?'block':'none';

  // Player sprite
  const pSpr=document.getElementById('playerSprite');
  if(window.hasImageSprite && window.hasImageSprite(G.classId)){
    window.renderImageSprite(G.classId, 'idle', 0, pSpr, 260);
  } else if(CLASS_SPRITES[G.classId]){
    renderSprite(CLASS_SPRITES[G.classId],13,pSpr);
  }
  document.getElementById('playerNameTag').textContent=cls.name;
  startPlayerAnim();

  // Spell slots panel (inline in action bar for wizard)
  document.getElementById('spellSlotSection').style.display='none'; // legacy hidden section
  const slotInline=document.getElementById('spellSlotInline');
  if(slotInline) slotInline.style.display=G.classId==='wizard'?'flex':'none';

  renderAll();
  // Only update button states — spawnEnemy() handles setPlayerTurn
  renderSkillButtons();
  updateCampBtn();
  if(typeof renderRunTracker==='function') renderRunTracker();
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

  // ── Rare Event: Skeleton Allies ──────────────────────────
  const skelCount=(G._rareEventFlags&&G._rareEventFlags.alliedSkeletons)||0;
  for(let i=0;i<3;i++){
    const slot=document.getElementById('skel'+i);
    if(!slot)continue;
    if(i<skelCount){
      if(!slot.classList.contains('active')){
        slot.classList.remove('dying');
        slot.classList.add('active');
        const sprEl=slot.querySelector('.skel-sprite');
        if(sprEl&&!sprEl.children.length) renderSprite(COMPANION_SPRITES.skeleton,5,sprEl);
      }
    } else {
      if(slot.classList.contains('active')){
        slot.classList.remove('active');
        slot.classList.add('dying');
        setTimeout(()=>{slot.classList.remove('dying');const sp=slot.querySelector('.skel-sprite');if(sp)sp.innerHTML='';},500);
      }
    }
  }

  // ── Rare Event: Frozen Soldier ───────────────────────────
  const fwrap=document.getElementById('frozenSoldierWrap');
  const fsprite=document.getElementById('frozenSoldierSprite');
  const fhpWrap=document.getElementById('frozenSoldierHpWrap');
  const fhpFill=document.getElementById('frozenSoldierHpFill');
  const fhpText=document.getElementById('frozenSoldierHpText');
  const fs=G._rareEventFlags&&G._rareEventFlags.frozenSoldier;
  const showFrozen=fs&&fs.zoneIdx===G.zoneIdx&&fs.hp>0;
  if(fwrap){
    if(showFrozen){
      // Don't show frozen soldier and wolf at same time — move frozen to right side
      if(showWolf){
        fwrap.style.left='auto';
        fwrap.style.right='-72px';
      } else {
        fwrap.style.left='-72px';
        fwrap.style.right='auto';
      }
      fwrap.classList.add('active');
      if(fsprite&&!fsprite.children.length) renderSprite(COMPANION_SPRITES.frozenSoldier,7,fsprite);
      if(fhpWrap)fhpWrap.style.display='block';
      if(fhpFill){
        const maxHp=30; // frozen soldier base HP
        const pct=Math.max(0,Math.min(100,(fs.hp/maxHp)*100));
        fhpFill.style.width=pct+'%';
        if(pct<30) fhpFill.style.background='linear-gradient(90deg,#6a1a1a,#bf4a4a)';
        else fhpFill.style.background='linear-gradient(90deg,#1a4a6a,#4a8abf)';
      }
      if(fhpText)fhpText.textContent='💀 '+fs.hp;
    } else {
      fwrap.classList.remove('active');
      if(fhpWrap)fhpWrap.style.display='none';
      if(fsprite)fsprite.innerHTML='';
    }
  }

  // ── Rare Event: Buff/Curse indicator strip ───────────────
  renderRareBuffStrip();
}

function renderRareBuffStrip(){
  const strip=document.getElementById('rareBuffStrip');
  if(!strip||!G)return;
  const flags=G._rareEventFlags||{};
  const buffs=[];

  // Phase B: Active zone modifier
  if(G._activeModifier){
    buffs.push({icon:G._activeModifier.icon, tip:G._activeModifier.name+': '+G._activeModifier.desc, curse:false, isMod:true});
  }

  if(flags.cursedForge)       buffs.push({icon:'🔨',tip:'Cursed Forge: enemies +10% dmg',curse:true});
  if(flags.bloodPact)         buffs.push({icon:'💉',tip:'Blood Pact: boss drops 2× loot',curse:false});
  if(flags.bloodPactGold)     buffs.push({icon:'🪙',tip:'Blood Pact: bonus boss item',curse:false});
  if(flags.vexaraCrown)       buffs.push({icon:'👑',tip:'Crimson Crown: -5 HP/fight, enemies -10% HP',curse:true});
  if(flags.satchelSaved)      buffs.push({icon:'📦',tip:'Stranger\'s Satchel: auto-heal at <25% HP',curse:false});
  if(G._divineEvasionReady)   buffs.push({icon:'👁',tip:'Divine Evasion: dodge next attack',curse:false});
  if(flags.empressBossBonus)  buffs.push({icon:'🌑',tip:'Lullaby: +25% dmg vs Malvaris',curse:false});
  if(flags.doppelgangerBoss)  buffs.push({icon:'🪞',tip:'Doppelganger: extra boss enemy',curse:true});
  if(flags.gateFragmentBoss)  buffs.push({icon:'🚪',tip:'Gate Fragment: boss starts -10% HP',curse:false});
  if(flags.finalHorn)         buffs.push({icon:'📯',tip:'Final Horn: +1 enemy/fight, enemies -15% HP',curse:true});
  if(flags.enemyFirstStrike)  buffs.push({icon:'⚡',tip:'First Strike: enemy attacks first',curse:true});
  if(flags.tempAtkBonus)      buffs.push({icon:'⚔️',tip:getOffensiveStatLabel(G)+' +'+flags.tempAtkBonus.value+' (this zone)',curse:false});
  if(flags._cursedDebuff)     buffs.push({icon:'☠️',tip:'Cursed: -3 '+getOffensiveStatLabel(G)+', -3 DEF ('+flags._cursedDebuff+' fights)',curse:true});
  if(flags._chilledDebuff)    buffs.push({icon:'❄️',tip:'Chilled: -3 DEF ('+flags._chilledDebuff+' fights)',curse:true});
  // Phase B: Ancestral Fury stacks
  if(G._ancestralStacks > 0)  buffs.push({icon:'👻',tip:'Ancestral Fury: +'+G._ancestralStacks*2+' '+getOffensiveStatLabel(G)+', enemies +'+G._ancestralStacks+'% dmg',curse:false});
  // Salvage buffs
  if(G._salvageBuffs&&G._salvageBuffs.length){
    G._salvageBuffs.forEach(b=>{
      const lbl = b.stat==='atk' ? getOffensiveStatLabel(G) : b.stat.toUpperCase();
      buffs.push({icon:'♻️',tip:'Salvage: '+lbl+' +'+b.value+' (this zone)',curse:false});
    });
  }

  if(!buffs.length){strip.innerHTML='';return;}
  strip.innerHTML=buffs.map(b=>{
    const cls='rare-buff-icon'+(b.curse?' curse':'')+(b.isMod?' modifier':'');
    return `<div class="${cls}" title="${b.tip}"><span class="buff-tooltip">${b.tip}</span>${b.icon}</div>`;
  }).join('');
}

// ── Phase B: Unlock Toast ────────────────────────────────
function showUnlockToast(def){
  const container=document.getElementById('unlockToastContainer');
  if(!container) return;
  const toast=document.createElement('div');
  toast.className='unlock-toast';
  const typeLabel={modifier:'MODIFIER UNLOCKED',event:'EVENT UNLOCKED',item:'ITEM UNLOCKED',grace:'GRACE UNLOCKED',title:'TITLE UNLOCKED'};
  toast.innerHTML=`
    <div class="unlock-toast-icon">${def.icon||'🔓'}</div>
    <div class="unlock-toast-body">
      <div class="unlock-toast-label">${typeLabel[def.type]||'UNLOCKED'}</div>
      <div class="unlock-toast-name">${def.name}</div>
    </div>
  `;
  container.appendChild(toast);
  AUDIO.sfx.gold(); // Reuse gold sound for unlock
  setTimeout(()=>{ if(toast.parentNode) toast.parentNode.removeChild(toast); }, 5500);
}

// ── Phase B: HUD Modifier Indicator ─────────────────────
function renderModifierHud(){
  const el=document.getElementById('zoneModifierHud');
  if(!el) return;
  if(!G || !G._activeModifier){
    el.style.display='none';
    return;
  }
  const mod=G._activeModifier;
  el.style.display='inline-flex';
  el.innerHTML=`${mod.icon} ${mod.name.toUpperCase()} <span class="mod-hud-tip">${mod.desc}</span>`;
}

// ── Phase B: Full-screen modifier announcement ──────────
function showModifierAnnouncement(onDone){
  if(!G || !G._activeModifier){
    if(onDone) onDone();
    return;
  }
  const mod = G._activeModifier;
  const overlay = document.getElementById('modifierAnnounce');
  if(!overlay){ if(onDone) onDone(); return; }

  // Populate
  document.getElementById('modAnnounceIcon').textContent = mod.icon;
  document.getElementById('modAnnounceName').textContent = mod.name.toUpperCase();
  document.getElementById('modAnnounceDesc').textContent = mod.desc;
  document.getElementById('modAnnounceFlavor').textContent = mod.flavor || '';

  // Set category class
  overlay.className = 'mod-announce cat-' + (mod.category || 'risk');
  overlay.style.display = 'flex';

  // SFX
  if(typeof AUDIO !== 'undefined' && AUDIO.sfx && AUDIO.sfx.zoneEnter) AUDIO.sfx.zoneEnter();

  // Auto-dismiss after 3s, or click to dismiss early
  let dismissed = false;
  function dismiss(){
    if(dismissed) return;
    dismissed = true;
    overlay.style.animation = 'mod-announce-bg-in 0.3s ease reverse forwards';
    setTimeout(()=>{
      overlay.style.display = 'none';
      overlay.style.animation = '';
      if(onDone) onDone();
    }, 300);
  }
  overlay.onclick = dismiss;
  overlay.style.pointerEvents = 'auto';
  setTimeout(dismiss, 6000);
}

function renderAll(){
  renderHUD();
  renderLeftPanel();
  renderSkillButtons();
  renderCompanions();
  renderInventory();
  renderEquipSlots();
  renderConditions();
  renderTalentList();
  renderZoneBar();
  renderSpellSlots();
  updateQuickButtons();
  renderObjectiveStatus();
  renderEnemyArea();
  renderLives();
  renderStatusStrip();
  renderGraceStrip();
  renderStatusPanel();
  renderModifierHud();
}

// ══════════════════════════════════════════════════════════
//  LIVES DISPLAY
// ══════════════════════════════════════════════════════════
function renderLives(){
  if(!G) return;
  const lives = G.lives !== undefined ? G.lives : 3;
  const hearts = Array.from({length:3},(_,i)=>
    `<span class="life-heart${i>=lives?' lost':''}">❤️</span>`
  ).join('');
  // Combat zone bar display
  const el = document.getElementById('livesDisplay');
  if(el) el.innerHTML = hearts;
  // Campfire display
  const cfEl = document.getElementById('cfLives');
  if(cfEl){
    const label = lives===3?'FULL LIVES':lives===0?'⚠ LAST CHANCE':lives+' LIVES REMAINING';
    const color = lives===3?'var(--green2)':lives===1?'var(--red2)':'var(--gold)';
    cfEl.innerHTML = `<span class="cf-lives-label" style="color:${color}">${hearts} &nbsp; ${label}</span>`;
  }
}

// ══════════════════════════════════════════════════════════
//  STATUS STRIP — active buffs & debuffs
// ══════════════════════════════════════════════════════════
function renderStatusStrip(){
  const el = document.getElementById('statusStrip');
  if(!el||!G) return;
  const badges = [];

  const badge = (icon,label,cls) => `<span class="status-badge ${cls}">${icon} ${label}</span>`;

  // ── Active combat states ──
  if(G.raging) badges.push(badge('🔥','RAGING','sb-buff'));
  if(G.wildShapeActive&&G.wildShapeHp>0) badges.push(badge('🐻','WILD SHAPE','sb-buff'));
  if(G._elementalForm) badges.push(badge('🔥','ELEMENTAL','sb-buff'));
  if(G.hunterMarked) badges.push(badge('🎯','MARKED','sb-buff'));
  if(G.concentrating==='hunters_mark') badges.push(badge('🎯','CONCENTRATING','sb-buff'));
  if(G.spiritualWeaponActive) badges.push(badge('✝️','SPIRIT WPN '+G.spiritualWeaponTurns+'t','sb-blue'));
  if(G.mirrorImages>0) badges.push(badge('🔮','MIRROR x'+G.mirrorImages,'sb-blue'));
  if(G._timeStopActive) badges.push(badge('⏱','TIME STOP','sb-gold'));
  if(G._arcaneTranscendence) badges.push(badge('✨','TRANSCEND','sb-gold'));
  if(G._bardInspiration) badges.push(badge('🎵','INSPIRED','sb-buff'));
  if(G._shadowStep) badges.push(badge('🌑','SHADOW STEP','sb-buff'));
  if(G._poisonBlade) badges.push(badge('☠','POISON BLADE','sb-buff'));
  if(G._primalAvatar||( G.sx&&G.sx.primalAvatar>0)) badges.push(badge('🌿','PRIMAL AVATAR','sb-buff'));
  if(G._dawnBlessing) badges.push(badge('🌅','DAWN BLESSING','sb-gold'));
  if(G.dawnBlessingShield>0) badges.push(badge('🛡','SHIELD '+G.dawnBlessingShield,'sb-gold'));
  if(G.holyWardHp>0) badges.push(badge('📿','HOLY WARD '+G.holyWardHp,'sb-gold'));
  if(G._feralCharge) badges.push(badge('⚡','FERAL CHARGE','sb-buff'));
  if(G._branchIronSkin) badges.push(badge('🛡','IRON SKIN','sb-buff'));
  if(G._branchBattleHardened) badges.push(badge('⚔','BATTLE HARDEN','sb-buff'));
  if(G._branchDeathDefiant) badges.push(badge('💀','DEATH DEFIANT','sb-buff'));
  if(G._branchRelentlessHeal) badges.push(badge('💚','RELENTLESS','sb-buff'));
  if(G._branchSixthSense) badges.push(badge('👁','SIXTH SENSE','sb-buff'));

  // ── Spell slots moved to action bar inline display ──

  // ── Conditions (debuffs) ──
  if(G.conditions&&G.conditions.length){
    G.conditions.forEach(c=>{
      const icons={Poisoned:'☠',Burning:'🔥',Stunned:'💫',Frightened:'😨',Restrained:'🔒'};
      const turns=G.conditionTurns&&G.conditionTurns[c]?G.conditionTurns[c]+'t':'';
      badges.push(badge(icons[c]||'⚠',c+(turns?' '+turns:''),'sb-debuff'));
    });
  }

  el.innerHTML = badges.join('');
}
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
      if(pSprHud.style.animation&&pSprHud.style.animation.includes('rage-glow')){
        pSprHud.style.animation='idle-bob 2.2s ease-in-out infinite';
        pSprHud.style.filter='';
      }
    }
  }

  // Topbar zone info
  const zoneName=document.getElementById('topbarZoneName');
  const zoneProgress=document.getElementById('topbarZoneProgress');
  if(zoneName){
    const z=ZONES[G.zoneIdx];
    zoneName.textContent=z?z.name:'';
  }
  if(zoneProgress){
    const z=ZONES[G.zoneIdx];
    if(z) zoneProgress.textContent=Math.min(G.zoneKills,z.kills)+'/'+z.kills;
  }

  // Left panel identity
  const plName=document.getElementById('plName');
  const plClass=document.getElementById('plClass');
  if(plName) plName.textContent=G.name||'HERO';
  if(plClass){
    const cls=CLASSES[G.classId];
    const sub=G.subclassUnlocked?(' · '+cls.subclass.name):'';
    plClass.textContent='LVL '+G.level+' '+cls.name.toUpperCase()+sub;
  }
}

function renderLeftPanel(){
  const body=document.getElementById('leftPanelBody');
  if(!body||!G)return;
  const cls=CLASSES[G.classId];
  if(!cls)return;
  const m=s=>Math.floor((s-10)/2);
  const abilities=['str','dex','con','int','wis','cha'];
  const slots=['weapon','armor','offhand','helmet','gloves','boots','ring','amulet'];
  const rc={common:'pl-eq-common',uncommon:'pl-eq-uncommon',rare:'pl-eq-rare',epic:'pl-eq-epic',legendary:'pl-eq-legendary'};

  let html='';

  // Core stats
  html+=`<div class="pl-section">STATS</div>`;
  const _casters=['wizard','cleric','druid'];
  const _isCaster=_casters.includes(G.classId);
  const _isHybrid=G.classId==='paladin';
  if(_isCaster){
    const splTotal=typeof getSpellPower==='function'?getSpellPower():(G.spellPower||0)+(G.magBonus||0)+G.profBonus;
    html+=`<div class="pl-row"><span class="pl-label" style="color:#a070ff;">SPL</span><span class="pl-val" style="color:#c090ff;">${splTotal}</span></div>`;
  } else if(_isHybrid){
    const splTotal=typeof getSpellPower==='function'?getSpellPower():(G.spellPower||0)+(G.magBonus||0)+G.profBonus;
    html+=`<div class="pl-row"><span class="pl-label">ATK</span><span class="pl-val pl-val-atk">${G.atk}</span></div>`;
    html+=`<div class="pl-row"><span class="pl-label" style="color:#a070ff;">SPL</span><span class="pl-val" style="color:#c090ff;">${splTotal}</span></div>`;
  } else {
    html+=`<div class="pl-row"><span class="pl-label">ATK</span><span class="pl-val pl-val-atk">${G.atk}</span></div>`;
  }
  html+=`<div class="pl-row"><span class="pl-label">DEF</span><span class="pl-val pl-val-def">${G.def}</span></div>`;
  html+=`<div class="pl-row"><span class="pl-label">CRIT</span><span class="pl-val pl-val-crit">${G.critRange-(G.critBonus||0)}-20</span></div>`;
  html+=`<div class="pl-row"><span class="pl-label">PROF</span><span class="pl-val">+${G.profBonus}</span></div>`;

  // Ability scores
  html+=`<div class="pl-section">ABILITIES</div>`;
  html+=`<div class="pl-abilities">`;
  abilities.forEach(a=>{
    const score=G.stats[a];
    const mod=m(score);
    const inBear=G.classId==='druid'&&G.wildShapeActive&&G._humanStats;
    const boosted=inBear&&(a==='str'||a==='con')&&score>(G._humanStats[a]||0);
    const style=boosted?'border-color:#cd853f;background:rgba(139,100,0,0.15);':'';
    const scoreColor=boosted?'color:#cd853f;':'';
    html+=`<div class="pl-ab" style="${style}">
      <span class="pl-ab-name">${a.toUpperCase()}</span>
      <span class="pl-ab-score" style="${scoreColor}">${score}</span>
      <span class="pl-ab-mod">${mod>=0?'+':''}${mod}</span>
    </div>`;
  });
  html+=`</div>`;

  // Equipment
  html+=`<div class="pl-section">EQUIPMENT</div>`;
  slots.forEach(slot=>{
    const item=G.equipped[slot];
    if(item){
      html+=`<div class="pl-equip"><span class="pl-eq-icon">${item.icon}</span><span class="pl-eq-name ${rc[item.rarity]||''}">${item.name}</span></div>`;
    } else {
      html+=`<div class="pl-equip"><span class="pl-eq-icon" style="opacity:0.2">·</span><span class="pl-eq-name" style="color:rgba(90,80,64,0.3)">${slot}</span></div>`;
    }
  });

  // Skill charges
  const chargeSkills=cls.skills.filter(sk=>sk.charges);
  if(chargeSkills.length){
    html+=`<div class="pl-section">CHARGES</div>`;
    chargeSkills.forEach(sk=>{
      const left=G.skillCharges&&G.skillCharges[sk.id]||0;
      const pips=Array.from({length:sk.charges},(_,i)=>i<left?'●':'○').join('');
      html+=`<div class="pl-charge"><span class="pl-charge-name">${sk.icon} ${sk.name}</span><span class="pl-charge-pips">${pips}</span></div>`;
    });
  }

  // Talents
  if(G.talents&&G.talents.length){
    html+=`<div class="pl-section">TALENTS</div>`;
    G.talents.forEach(t=>{
      const td=(TALENT_POOLS[G.classId]||[]).find(p=>p.name===t);
      html+=`<div class="pl-talent"><span class="pl-talent-icon">${td?td.icon:'◆'}</span><span class="pl-talent-name">${t}</span></div>`;
    });
  }

  body.innerHTML=html;
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
  let globalSkillIdx=0;
  ['action','bonus','reaction'].forEach(type=>{
    const container=document.getElementById(type+'Skills');
    if(!container) return;
    const skills=cls.skills.filter(s=>s.type===type && (!s.subclassOnly || G.subclassUnlocked) && (!s.ultimateOnly || G.ultimateUnlocked));
    container.innerHTML=skills.map(sk=>{
      const cdRaw=G.skillCooldowns[sk.id];
      const cdEnd=(cdRaw==='active')?Infinity:(cdRaw||0);
      const cdLeft=cdEnd===Infinity?-1:Math.max(0,Math.ceil((cdEnd-now)/1000));
      const typeUsed=(type==='action'&&G.actionUsed)||(type==='bonus'&&G.bonusUsed)||(type==='reaction'&&G.reactionUsed);
      const skillEffCost=sk.id==='divine_smite'&&G.talents.includes('Holy Fervor')?Math.max(1,sk.cost-1):sk.cost;
      const noRes=skillEffCost>0&&G.res<skillEffCost;
      const noSlot=sk.slotCost&&(!G.spellSlots||(G.spellSlots[sk.slotCost]||0)===0)&&!G._timeStopActive&&!G._arcaneTranscendence;
      const noCombo=sk.comboReq&&G.res<sk.comboReq;
      const chargesLeft=sk.charges?(G.skillCharges[sk.id]||0):null;
      const noCharges=sk.charges&&chargesLeft<=0;
      const reactionOnYourTurn = type==='reaction' && G.isPlayerTurn;
      const bearLocked = G.classId==='druid' && G.wildShapeHp>0 && ['thorn_whip','moonbeam','entangle'].includes(sk.id);
      const clawLocked  = sk.id==='claw_strike' && (!G.wildShapeHp || G.wildShapeHp<=0);
      const rageRequired = sk.rageReq && !G.raging;
      const bearRequired = sk.bearReq && (!G.wildShapeHp || G.wildShapeHp <= 0);
      const formLocked = (sk.id==='elemental_wild_shape' && G.wildShapeHp>0) || (sk.id==='wild_shape' && G._elementalForm && G.wildShapeHp>0);
      const disabled=typeUsed||noRes||noSlot||noCombo||noCharges||cdLeft>0||(!G.isPlayerTurn&&type!=='reaction')||paused||reactionOnYourTurn||bearLocked||clawLocked||rageRequired||bearRequired||formLocked;
      const pipHtml=sk.charges?`<span class="sk-charges">${Array.from({length:sk.charges},(_,i)=>i<chargesLeft?'●':'○').join('')}</span>`:'';
      // Cost label (bottom-left badge)
      let costLabel='';
      if(sk.cost>0) costLabel=sk.cost+cls.res.charAt(0);
      else if(sk.comboReq) costLabel=sk.comboReq+'CP';
      else if(sk.slotCost) costLabel='L'+sk.slotCost;
      const cdBadge=cdLeft>0?`<span class="sk-cd">${cdLeft}s</span>`:cdLeft===-1?`<span class="sk-cd" style="color:var(--orange2)">●</span>`:'';
      const isNew=G._newSkills&&G._newSkills.includes(sk.id);
      const keyNum=globalSkillIdx+1;
      const keybindBadge=keyNum<=9?`<span class="sk-keybind">${keyNum}</span>`:'';
      globalSkillIdx++;
      return `<button class="skill-btn type-${type}${isNew?' sk-new':''}" data-skill-key="${keyNum}" ${disabled?'disabled':''} onclick="if(G._newSkills){G._newSkills=G._newSkills.filter(x=>x!=='${sk.id}');this.classList.remove('sk-new');}useSkill('${sk.id}')" title="${sk.name}: ${sk.desc} [${keyNum}]">
        ${cdBadge}
        ${keybindBadge}
        <span class="sk-icon">${sk.icon}</span>
        <span class="sk-name">${sk.name}</span>
        ${pipHtml}
        ${costLabel?`<span class="sk-cost">${costLabel}</span>`:''}
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

function renderGraceStrip(){
  const el=document.getElementById('graceStrip');
  if(!el||!G) return;
  // Get equipped graces for this class/slot
  const graces = (typeof getEquippedGraces==='function') ? getEquippedGraces(G.classId) : [];
  const equipped = graces.filter(Boolean);
  if(!equipped.length){ el.style.display='none'; return; }
  el.style.display='flex';
  const rarityColor={common:'#888',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#8b44ad',legendary:'var(--gold)'};
  el.innerHTML = equipped.map(g=>{
    const rc=rarityColor[g.rarity]||'#888';
    const statsStr=Object.entries(g.stats).map(([k,v])=>'+'+v+' '+(typeof statLabel==='function'?statLabel(k):k.toUpperCase())).join(' · ');
    return `<div class="grace-pip" style="border-color:${rc}40;">
      <span class="gp-icon">${g.icon}</span>
      <span class="gp-name" style="color:${rc};">${g.name}</span>
      <span class="gp-stats">${statsStr}</span>
      <div class="gp-tooltip">${g.rarity.toUpperCase()} ${g.type} Grace<br>${statsStr}</div>
    </div>`;
  }).join('');
}

function renderStatusPanel(){
  const el=document.getElementById('statusPanel');
  if(!el||!G) return;

  const entries=[];
  const add=(icon,name,desc,type)=>entries.push({icon,name,desc,type});

  // ── Active buffs ──────────────────────────────────────────
  if(G.raging)                         add('🔥','RAGING',        'ATK +4, take 50% reduced damage. Cannot cast spells.','buff');
  if(G.wildShapeActive&&G.wildShapeHp>0) add('🐻','WILD SHAPE',  'Bear form active. '+G.wildShapeHp+' HP buffer absorbs damage.','buff');
  if(G._elementalForm)                 add('🔥','ELEMENTAL FORM','Transformed. Bonus fire damage on attacks.','buff');
  if(G.hunterMarked)                   add('🎯','HUNTER\'S MARK','Marked target takes +1d6 bonus damage.','buff');
  if(G.concentrating==='hunters_mark') add('🎯','CONCENTRATING', 'Maintaining Hunter\'s Mark concentration.','buff');
  if(G.spiritualWeaponActive)          add('✝️','SPIRIT WEAPON', 'Spiritual Weapon attacks alongside you. '+G.spiritualWeaponTurns+'t remaining.','gold');
  if(G.mirrorImages>0)                 add('🔮','MIRROR IMAGES',  G.mirrorImages+' images deflect incoming attacks.','blue');
  if(G._timeStopActive)                add('⏱','TIME STOP',      'Extra turns frozen in time.','gold');
  if(G._arcaneTranscendence)           add('✨','TRANSCENDENCE',  'Empowered — all spells deal bonus damage this turn.','gold');
  if(G._bardInspiration)               add('🎵','INSPIRED',       'Bardic Inspiration active — bonus on next roll.','buff');
  if(G._shadowStep)                    add('🌑','SHADOW STEP',    'In shadow — next attack deals bonus damage.','buff');
  if(G._poisonBlade)                   add('☠','POISON BLADE',   'Weapon coated — attacks apply Poisoned.','buff');
  if(G._primalAvatar||(G.sx&&G.sx.primalAvatar>0)) add('🌿','PRIMAL AVATAR','Nature bond — bonus to beast skills.','buff');
  if(G._dawnBlessing)                  add('🌅','DAWN BLESSING',  'Blessed — heals a portion of damage dealt.','gold');
  if(G.dawnBlessingShield>0)           add('🛡','BLESSED SHIELD', G.dawnBlessingShield+' damage blocked by divine light.','gold');
  if(G.holyWardHp>0)                   add('📿','HOLY WARD',      G.holyWardHp+' HP ward absorbs next hit.','gold');
  if(G._feralCharge)                   add('⚡','FERAL CHARGE',   'Charged up — next attack deals bonus damage.','buff');
  if(G._branchIronSkin)                add('🛡','IRON SKIN',      'DEF bonus from branch reward.','buff');
  if(G._branchBattleHardened)          add('⚔','BATTLE HARDENED',getOffensiveStatLabel(G)+' bonus from branch reward.','buff');
  if(G._branchDeathDefiant)            add('💀','DEATH DEFIANT',  'Survive one killing blow at 1 HP.','buff');
  if(G._branchRelentlessHeal)          add('💚','RELENTLESS HEAL','Regenerate HP each turn.','buff');
  if(G._branchSixthSense)              add('👁','SIXTH SENSE',    'Boss damage reduced by 20%.','buff');

  // ── Spell slots moved to action bar inline display ──

  // ── Graces ───────────────────────────────────────────────
  if(typeof getEquippedGraces==='function'){
    getEquippedGraces(G.classId).filter(Boolean).forEach(g=>{
      const stats=Object.entries(g.stats).map(([k,v])=>'+'+v+' '+(typeof statLabel==='function'?statLabel(k):k.toUpperCase())).join(', ');
      add(g.icon, g.name.toUpperCase(), stats+'.','gold');
      if(g.passive&&g.passive.desc){
        add(g.passive.icon||'💎', 'LEGENDARY: '+g.name.toUpperCase(), g.passive.desc,'gold');
      }
    });
  }

  // ── Town buffs carried into dungeon ─────────────────────
  if(G._townBuffs&&G._townBuffs.length){
    G._townBuffs.forEach(b=>{
      add(b.icon, b.name.toUpperCase(), b.desc,'buff');
    });
  }

  // ── Proving Grounds upgrades ────────────────────────────
  if(typeof getPermanentUpgrades==='function'&&typeof PERMANENT_UPGRADES!=='undefined'){
    const ups=getPermanentUpgrades();
    if(ups&&Object.keys(ups).length){
      PERMANENT_UPGRADES.forEach(u=>{
        const lvl=ups[u.id]||0;
        if(lvl<=0) return;
        if(u.forClass&&u.forClass!==G.classId) return;
        const pips='●'.repeat(lvl)+'○'.repeat(u.maxLvl-lvl);
        const descText = u.id==='atk_bonus' ? u.desc.replace('ATK', getOffensiveStatLabel(G)) : u.desc;
        add(u.icon, u.name.toUpperCase(), descText+' ['+pips+']','neutral');
      });
    }
  }

  // ── Conditions (debuffs) ─────────────────────────────────
  const condDesc={
    Poisoned:  'Taking '+( 3+G.zoneIdx)+' poison damage each enemy turn.',
    Burning:   'Taking '+(5+G.zoneIdx*2)+' fire damage each enemy turn.',
    Stunned:   'Cannot act — stunned this turn.',
    Frightened:'ATK reduced while frightened.',
    Restrained:'Losing your action this turn.',
  };
  const condIcons={Poisoned:'☠',Burning:'🔥',Stunned:'💫',Frightened:'😨',Restrained:'🔒'};
  if(G.conditions&&G.conditions.length){
    G.conditions.forEach(c=>{
      const turns=G.conditionTurns&&G.conditionTurns[c]?' ('+G.conditionTurns[c]+'t)':'';
      add(condIcons[c]||'⚠', c.toUpperCase()+turns, condDesc[c]||'Active condition.','debuff');
    });
  }

  // ── Rare event buffs & debuffs ──────────────────────────
  const flags = G._rareEventFlags || {};
  if(flags.cursedForge)        add('🔨','CURSED FORGE',      'Enemies deal +10% damage this run.','debuff');
  if(flags.bloodPact)          add('💉','BLOOD PACT',        'Next boss drops 2× loot.','buff');
  if(flags.bloodPactGold)      add('🪙','BLOOD PACT GOLD',   'Next boss drops a bonus item.','buff');
  if(flags.vexaraCrown)        add('👑','CRIMSON CROWN',      '-5 HP per fight, enemies have −10% HP this zone.','gold');
  if(flags.satchelSaved)       add('📦','STRANGER\'S SATCHEL','Auto-heal when dropping below 25% HP.','buff');
  if(G._divineEvasionReady)    add('👁','DIVINE EVASION',     'Will dodge the next incoming attack.','buff');
  if(flags.empressBossBonus)   add('🌑','LULLABY',           '+25% damage against Malvaris.','buff');
  if(flags.doppelgangerBoss)   add('🪞','DOPPELGANGER',      'An extra enemy appears during the boss fight.','debuff');
  if(flags.gateFragmentBoss)   add('🚪','GATE FRAGMENT',     'Boss starts at 90% HP.','buff');
  if(flags.finalHorn)          add('📯','FINAL HORN',         '+1 enemy per fight, but enemies have −15% HP.','gold');
  if(flags.enemyFirstStrike)   add('⚡','FIRST STRIKE',       'Enemies attack first each fight.','debuff');
  if(flags.tempAtkBonus)       add('⚔️',getOffensiveStatLabel(G)+' BONUS',         '+'+flags.tempAtkBonus.value+' '+getOffensiveStatLabel(G)+' this zone.','buff');
  if(flags._cursedDebuff)      add('☠️','CURSED',            '-3 '+getOffensiveStatLabel(G)+', -3 DEF. '+flags._cursedDebuff+' fight'+(flags._cursedDebuff>1?'s':'')+' remaining.','debuff');
  if(flags._chilledDebuff)     add('❄️','CHILLED',           '-3 DEF. '+flags._chilledDebuff+' fight'+(flags._chilledDebuff>1?'s':'')+' remaining.','debuff');
  if(flags.unstableBuff)       add('⚠️','UNSTABLE',          '+'+flags.unstableBuff.atk+' '+getOffensiveStatLabel(G)+', +'+flags.unstableBuff.def+' DEF, +'+flags.unstableBuff.hp+' HP. Fading.','gold');
  if(flags.alliedSkeletons&&flags.alliedSkeletons>0) add('💀','ALLIED SKELETONS','×'+flags.alliedSkeletons+' skeleton'+(flags.alliedSkeletons>1?'s':'')+' absorbing hits.','buff');
  if(flags.frozenSoldier)      add('🧊','FROZEN SOLDIER',    'A freed soldier fights alongside you.','buff');
  if(flags.lastCampfireWeaken) add('🔥','LAST CAMPFIRE',     'Next campfire rest only heals 50%.','gold');
  // Salvage temp buffs
  if(G._salvageBuffs&&G._salvageBuffs.length){
    G._salvageBuffs.forEach(b=>{
      const lbl = b.stat==='atk' ? getOffensiveStatLabel(G) : b.stat.toUpperCase();
      add('♻️','SALVAGE: '+lbl+' +'+b.value, 'From salvaging '+b.source+'. Lasts this zone.','buff');
    });
  }

  // ── Zone modifier ─────────────────────────────────────────
  if(G._activeModifier){
    const mod=G._activeModifier;
    const modDescs = {
      bloodmoon:    'Enemies deal +20% damage. Gold drops +30%.',
      fortified:    'Enemies have +20% HP. Guaranteed rare drop before boss.',
      volatile:     'Crit range +1, crit damage +50% — for both sides.',
      bounty:       'Enemies have +15% ATK. Gold drops +50%.',
      thick_fog:    '12% miss chance on all attacks for both sides.',
      bloodlust:    'Heal 8% of max HP on each kill.',
      ironhide:     '+5 DEF for the entire zone.',
      frenzied:     'All fights start at round 3 — boss specials fire immediately.',
      famine:       'No gold from enemies. Shop prices halved.',
      scavenger:    'Gold drops -40%. Loot drop rate doubled.',
      cursed_ground:'-3% max HP at fight start. Enemies weakened for 2 attacks.',
      echoing:      'AOE damage +30%. Single-target damage -10%.',
      glass_cannon: 'You deal and take +25% damage.',
      taxed:        '-10% gold on zone entry. +20% XP from kills.',
      restless_dead:'Killed enemies have 20% chance to revive at 30% HP. 2× gold if re-killed.',
      predator:     'First attacker gets +20% damage for 3 turns.',
      witch_bargain:'Choose a sacrifice before each fight — HP for damage or vice versa.',
      ancestral:    '+2 '+getOffensiveStatLabel(G)+' per kill (stacking). Enemies grow +1% stronger per stack.',
      mythic:       'Enemies have +30% HP and +20% ATK. Boss guarantees a legendary.',
      mirrored:     'Enemies copy 20% of your highest stat.',
    };
    const modType = (mod.category==='risk'||mod.id==='mythic'||mod.id==='mirrored'||mod.id==='frenzied') ? 'debuff'
      : (mod.id==='bloodlust'||mod.id==='ironhide') ? 'buff' : 'gold';
    add(mod.icon, 'ZONE: '+mod.name.toUpperCase(), modDescs[mod.id]||mod.desc, modType);
    // Dynamic: Ancestral stacks
    if(mod.id==='ancestral'&&G._ancestralStacks>0){
      add('⚔️','ANCESTRAL FURY', '+'+G._ancestralStacks*2+' '+getOffensiveStatLabel(G)+' from '+G._ancestralStacks+' kill'+(G._ancestralStacks>1?'s':'')+'. Enemies +'+G._ancestralStacks+'% damage.','gold');
    }
    // Dynamic: Predator buff active
    if(G._predatorBuff&&G._predatorBuff.turns>0){
      add('🐺','FIRST STRIKE', '+20% damage. '+G._predatorBuff.turns+' turn'+(G._predatorBuff.turns>1?'s':'')+' remaining.','buff');
    }
  }

  if(!entries.length){
    el.innerHTML='<div class="sp-empty">No active buffs<br>or debuffs</div>';
    return;
  }

  el.innerHTML=entries.map(e=>`
    <div class="sp-entry sp-${e.type}">
      <span class="sp-icon">${e.icon}</span>
      <div class="sp-body">
        <span class="sp-name sp-${e.type}">${e.name}</span>
        <span class="sp-desc">${e.desc}</span>
      </div>
    </div>
  `).join('');
}

function renderZoneBar(){
  if(!G)return;
  // Inside a branch — show branch fight progress (0-5), not main zone kills
  if(G._inBranch && typeof _currentBranch!=='undefined' && _currentBranch){
    const branchFights = G._branchFights || 0;
    const pct = Math.min(100, branchFights / 5 * 100);
    document.getElementById('zoneFill').style.width = pct+'%';
    document.getElementById('zoneKillsTxt').textContent = branchFights+'/5';
    return;
  }
  const z=ZONES[G.zoneIdx];
  const pct=Math.min(100,G.zoneKills/z.kills*100);
  document.getElementById('zoneFill').style.width=pct+'%';
  document.getElementById('zoneKillsTxt').textContent=Math.min(G.zoneKills,z.kills)+'/'+z.kills;
}

function renderSpellSlots(){
  if(!G||G.classId!=='wizard')return;
  // Render into inline action bar element
  const el=document.getElementById('spellSlotInline');
  if(!el)return;
  el.style.display='flex';
  el.innerHTML=Object.entries(G.spellSlotsMax||{}).map(([lvl,mx])=>{
    const cur=G.spellSlots[lvl]||0;
    const pips=Array(mx).fill(0).map((_,i)=>`<span style="display:inline-block;width:8px;height:8px;border:1px solid ${i<cur?'#6ab0ff':'#333'};background:${i<cur?'#4a90d9':'#111'};margin:0 1px;box-shadow:${i<cur?'0 0 4px rgba(74,144,217,0.5)':'none'};"></span>`).join('');
    return `<span style="font-family:'Press Start 2P',monospace;font-size:5px;color:${cur>0?'#6ab0ff':'#555'};margin-right:6px;white-space:nowrap;">L${lvl}${pips}</span>`;
  }).join('');
}

