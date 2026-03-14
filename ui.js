// ================================================================
// ui.js — All UI Systems
// Level up, campfire, shop, map, character sheet, 
// audio controls, utilities, bug log
// Descent into Eternity
// ================================================================
// Progression (level up, subclass, ultimate, talent) → ui/ui-progression.js
// Inventory / items / equipment / loot          → ui/ui-inventory.js
// Campfire scene + rest + class actions          → ui/ui-campfire-core.js
// Achievements + objectives + codex             → ui/ui-achievements.js
// Campfire shop/craft/events/quick-buttons      → ui/ui-campfire-services.js
// World map                                     → ui/ui-map.js
// Character sheet + chroma gallery              → ui/ui-charsheet.js
// ================================================================

// ══════════════════════════════════════════════════════════
//  ICON HELPER
// ══════════════════════════════════════════════════════════
// Converts RPG-Awesome class names to <i> HTML. Falls through
// to emoji for zone/modifier/buff icons that aren't ra- names.
function iconHTML(icon){
  if(!icon) return '';
  if(/^[a-z][a-z0-9-]*$/.test(icon))
    return '<i class="ra ra-'+icon+'" aria-hidden="true"></i>';
  return icon;
}

// ══════════════════════════════════════════════════════════
//  CONDITIONS
// ══════════════════════════════════════════════════════════
function addCondition(cond,turns=2){
  // Elemental Wild Shape: immune to Poisoned and Frightened
  if(G._elementalImmune&&(cond==='Poisoned'||cond==='Frightened')){
    log('🔥 Elemental immunity blocks '+cond+'!','s');
    return;
  }
  // Berserker Mindless Rage: immune to Charmed and Frightened while raging
  if((cond==='Charmed'||cond==='Frightened')&&G.classId==='barbarian'&&G.subclassId==='berserker'&&G.raging){log('💢 Mindless Rage: '+cond+' has no effect while raging!','s');return;}
  // Aura of Protection (Devotion): immune to Frightened and Restrained for 3 turns
  if(cond==='Frightened'&&G.sx&&G.sx.immuneFrightened>0){log('😇 Aura of Protection blocks Frightened!','s');return;}
  if(cond==='Restrained'&&G.sx&&G.sx.immuneRestrained>0){log('😇 Aura of Protection blocks Restrained!','s');return;}
  // Aura of Devotion (Devotion Paladin): permanent immunity to Charmed
  if(cond==='Charmed'&&G.classId==='paladin'&&G.subclassId==='devotion'){log('😇 Aura of Devotion: Charmed immunity!','s');return;}
  // sporecloak: immune to Poisoned
  if(cond==='Poisoned'&&typeof hasEquippedItem==='function'&&hasEquippedItem('sporecloak')){log('🍄 Sporecloak: immune to Poison!','s');return;}
  // ashprinceMantle: immune to Burning
  if(cond==='Burning'&&typeof hasEquippedItem==='function'&&hasEquippedItem('ashprinceMantle')){log('🔥 Ash Prince\'s Mantle: immune to Burning!','s');return;}
  // ironCrown: immune to Frightened
  if(cond==='Frightened'&&typeof hasEquippedPassive==='function'&&hasEquippedPassive('fearImmune')){log('👑 Iron Crown: immune to Frightened!','s');return;}
  if(!G.conditions.includes(cond)){
    G.conditions.push(cond);
    if(!G.conditionTurns)G.conditionTurns={};
    G.conditionTurns[cond]=turns;
  }
}
function removeCondition(cond){
  G.conditions=G.conditions.filter(c=>c!==cond);
  if(G.conditionTurns)delete G.conditionTurns[cond];
  if(typeof AUDIO!=='undefined'&&AUDIO.sfx.conditionExpire) AUDIO.sfx.conditionExpire();
}
function addConditionEnemy(name,turns){if(!G.currentEnemy)return;if(!G.currentEnemy.conditions)G.currentEnemy.conditions=[];if(G.currentEnemy.conditions.find(c=>c.name===name))return;G.currentEnemy.conditions.push({name,turns});}
// AoE variant — applies condition to a specific enemy object
function addConditionToEnemy(e,name,turns){if(!e)return;if(!e.conditions)e.conditions=[];if(e.conditions.find(c=>c.name===name))return;e.conditions.push({name,turns});}

//  PAUSE & HELP
// ══════════════════════════════════════════════════════════
// ── AUDIO PANEL CONTROLS ─────────────────────────────────
let _musicMuted=false;
let _sfxMuted=false;
let _audioPanelOpen=false;

function toggleAudioPanel(){
  _audioPanelOpen=!_audioPanelOpen;
  const panel=document.getElementById('audioPanel');
  const btn=document.getElementById('audioToggleBtn');
  if(panel)panel.classList.toggle('open',_audioPanelOpen);
  if(btn)btn.style.borderColor=_audioPanelOpen?'var(--gold)':'';
}

let _townAudioPanelOpen=false;
function toggleTownAudioPanel(){
  _townAudioPanelOpen=!_townAudioPanelOpen;
  const panel=document.getElementById('townAudioPanel');
  const btn=document.getElementById('townAudioToggleBtn');
  if(panel)panel.classList.toggle('open',_townAudioPanelOpen);
  if(btn)btn.style.borderColor=_townAudioPanelOpen?'var(--gold)':'';
  if(_townAudioPanelOpen){
    const ms=document.getElementById('musicSlider');
    const ss=document.getElementById('sfxSlider');
    const tms=document.getElementById('townMusicSlider');
    const tss=document.getElementById('townSfxSlider');
    if(ms&&tms)tms.value=ms.value;
    if(ss&&tss)tss.value=ss.value;
  }
}

// Close panels when clicking outside
document.addEventListener('click',function(e){
  if(_audioPanelOpen){
    const wrap=document.getElementById('audioPanelWrap');
    if(wrap&&!wrap.contains(e.target)){
      _audioPanelOpen=false;
      const panel=document.getElementById('audioPanel');
      if(panel)panel.classList.remove('open');
      const btn=document.getElementById('audioToggleBtn');
      if(btn)btn.style.borderColor='';
    }
  }
  if(_townAudioPanelOpen){
    const wrap=document.getElementById('townAudioPanelWrap');
    if(wrap&&!wrap.contains(e.target)){
      _townAudioPanelOpen=false;
      const panel=document.getElementById('townAudioPanel');
      if(panel)panel.classList.remove('open');
      const btn=document.getElementById('townAudioToggleBtn');
      if(btn)btn.style.borderColor='';
    }
  }
});

function onMusicVol(v){
  const vol=Number(v)/100;
  AUDIO.setMusicVol(_musicMuted?0:vol);
  // Sync all music vol elements
  ['musicVolNum','titleMusicVolNum','townMusicVolNum'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=v;});
  ['musicSlider','titleMusicSlider','townMusicSlider'].forEach(id=>{const el=document.getElementById(id);if(el&&el.value!=v)el.value=v;});
  _updateAudioIcon();
}

function onSfxVol(v){
  const vol=Number(v)/100;
  AUDIO.setSfxVol(_sfxMuted?0:vol);
  // Sync all sfx vol elements
  ['sfxVolNum','titleSfxVolNum','townSfxVolNum'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=v;});
  ['sfxSlider','titleSfxSlider','townSfxSlider'].forEach(id=>{const el=document.getElementById(id);if(el&&el.value!=v)el.value=v;});
  _updateAudioIcon();
}

function updateTitleAudioBtns(){
  const mm=document.getElementById('titleMuteMusicBtn');
  const ms=document.getElementById('titleMuteSfxBtn');
  if(mm)mm.className='audio-mute-btn'+(_musicMuted?' active':'');
  if(ms)ms.className='audio-mute-btn'+(_sfxMuted?' active':'');
  // Also keep in-game mute buttons in sync
  const mm2=document.getElementById('muteMusicBtn');
  const ms2=document.getElementById('muteSfxBtn');
  if(mm2)mm2.classList.toggle('active',_musicMuted);
  if(ms2)ms2.classList.toggle('active',_sfxMuted);
  // And town mute buttons
  const mm3=document.getElementById('townMuteMusicBtn');
  const ms3=document.getElementById('townMuteSfxBtn');
  if(mm3)mm3.classList.toggle('active',_musicMuted);
  if(ms3)ms3.classList.toggle('active',_sfxMuted);
}
function toggleMuteMusic(){
  _musicMuted=!_musicMuted;
  const btn=document.getElementById('muteMusicBtn');
  if(btn)btn.classList.toggle('active',_musicMuted);
  const sliderVal=Number(document.getElementById('musicSlider')?.value||35);
  AUDIO.setMusicVol(_musicMuted?0:sliderVal/100);
  if(!_musicMuted){
    const bgmMap=['woods','outpost','castle','underdark','abyss'];
    if(G&&G.currentEnemy&&G.currentEnemy.isBoss)AUDIO.playBGM('boss');
    else if(G)AUDIO.playBGM(bgmMap[G.zoneIdx]||'woods');
  } else {
    AUDIO.stopBGM();
  }
  _updateAudioIcon();
  updateTitleAudioBtns();
}

function toggleMuteSfx(){
  _sfxMuted=!_sfxMuted;
  const btn=document.getElementById('muteSfxBtn');
  if(btn)btn.classList.toggle('active',_sfxMuted);
  const sliderVal=Number(document.getElementById('sfxSlider')?.value||55);
  AUDIO.setSfxVol(_sfxMuted?0:sliderVal/100);
  _updateAudioIcon();
  updateTitleAudioBtns();
}

function _updateAudioIcon(){
  const icon=_musicMuted&&_sfxMuted?'🔇':_musicMuted?'🎵':_sfxMuted?'💥':'🔊';
  ['audioToggleBtn','townAudioToggleBtn'].forEach(id=>{const b=document.getElementById(id);if(b)b.textContent=icon;});
}

// Keep old toggleAudio as no-op for any lingering refs
function toggleAudio(){}

function togglePause(){
  paused=!paused;
  const btn=document.getElementById('pauseBtn');
  const townBtn=document.getElementById('townPauseBtn');
  if(paused){
    document.getElementById('pause-overlay').classList.add('open');
    if(btn)btn.className='topbar-btn paused';
    if(townBtn){townBtn.style.borderColor='var(--gold)';townBtn.style.color='var(--gold)';}
    if(enemyTurnTimeout){clearTimeout(enemyTurnTimeout);enemyTurnTimeout=null;}
    if(typeof pauseReactionTimer==='function') pauseReactionTimer();
  } else {
    document.getElementById('pause-overlay').classList.remove('open');
    if(btn)btn.className='topbar-btn';
    if(townBtn){townBtn.style.borderColor='var(--border)';townBtn.style.color='var(--dim)';}
    // Resume reaction timer if one was active; otherwise resume enemy turn
    const reactPrompt=document.getElementById('reactPrompt');
    if(reactPrompt&&reactPrompt.style.display!=='none'&&typeof resumeReactionTimer==='function'){
      resumeReactionTimer();
    } else if(G&&!G.isPlayerTurn&&G.currentEnemy){
      enemyTurnTimeout=setTimeout(doEnemyTurn,800);
    }
  }
  renderSkillButtons();
}

function quitToTitle(){
  // confirm() is blocked in iframes — use the pause overlay with a confirm step
  const pauseBox=document.querySelector('.pause-box');
  pauseBox.innerHTML=`
    <div class="pause-title" style="font-size:13px;color:var(--red2);">QUIT TO TITLE?</div>
    <div style="font-size:16px;color:var(--dim);margin-bottom:20px;">All progress will be lost.</div>
    <div class="pause-btns">
      <button class="btn btn-red" style="font-size:9px;" onclick="doQuitToTitle()">YES — QUIT</button>
      <button class="btn" style="font-size:9px;" onclick="restorePauseMenu()">NO — GO BACK</button>
    </div>`;
}

function doQuitToTitle(){
  if(typeof stopPlayTimer==='function') stopPlayTimer();
  if(typeof _enemyTurnQueue!=='undefined'){_enemyTurnQueue=[];_enemyTurnQueueIdx=0;}
  if(G && typeof autoSave==='function') autoSave();
  if(G)G._dyingFlag=false;
  G=null;
  paused=false;
  pendingLevelUps=[];
  levelUpShowing=false;
  cfCurrentEvent=null;
  if(enemyTurnTimeout){clearTimeout(enemyTurnTimeout);enemyTurnTimeout=null;}
  if(reactionTimer){clearTimeout(reactionTimer);reactionTimer=null;}
  // Close all overlays consistently using classList only
  document.querySelectorAll('[id$="-overlay"]').forEach(el=>{
    el.classList.remove('open');
  });
  restorePauseMenu();
  showScreen('title');
}

function restorePauseMenu(){
  const pauseBox=document.querySelector('.pause-box');
  pauseBox.innerHTML=`
    <div class="pause-title">⏸ PAUSED</div>
    <div class="pause-btns">
      <button class="btn btn-gold" onclick="togglePause()">▶ RESUME</button>
      <button class="btn" onclick="openHelp()">? HOW TO PLAY</button>
      <button class="btn" style="border-color:#4a3a18;color:#c8a84b;" onclick="returnToTown()">🏘 RETURN TO TOWN</button>
      <button class="btn btn-red" onclick="quitToTitle()">✗ QUIT TO TITLE</button>
    </div>`;
}

function openHelp(){document.getElementById('help-overlay').classList.add('open');}
function closeHelp(){document.getElementById('help-overlay').classList.remove('open');}

function returnToTown(){
  // Close pause overlay and clean up combat state
  paused=false;
  document.getElementById('pause-overlay').classList.remove('open');
  const btn=document.getElementById('pauseBtn');
  if(btn) btn.className='topbar-btn';
  restorePauseMenu();
  // Clean up any active timers
  if(typeof enemyTurnTimeout!=='undefined'&&enemyTurnTimeout){clearTimeout(enemyTurnTimeout);enemyTurnTimeout=null;}
  if(typeof reactionTimer!=='undefined'&&reactionTimer){clearTimeout(reactionTimer);reactionTimer=null;}
  // Reset combat state so re-entering zone works cleanly
  if(G){
    G.currentEnemy=null;
    G.isPlayerTurn=true;
    G.actionUsed=false;
    G.bonusUsed=false;
    G.reactionUsed=false;
    G.conditions=[];
    G.conditionTurns={};
  }
  if(typeof autoSave==='function') autoSave();
  showTownHub();
}

// ══════════════════════════════════════════════════════════
//  FLOATERS & ANIMATIONS
// ══════════════════════════════════════════════════════════
function spawnFloater(val,type,onRight){
  const stage=document.getElementById('battleStage');if(!stage)return;
  // Bug 16: Clamp to prevent negative values on overkill
  if(type==='dmg'||type==='crit') val=Math.max(0,val);

  // Splat shape colors per type (RS-style)
  // dmg=red, crit=orange/yellow, heal=green, miss=blue-gray, cond=purple
  const cfg={
    dmg:  {fill:'#c0392b',stroke:'#7b241c',rim:'#e74c3c'},
    crit: {fill:'#e67e22',stroke:'#935116',rim:'#f39c12'},
    heal: {fill:'#1e8449',stroke:'#145a32',rim:'#27ae60'},
    miss: {fill:'#566573',stroke:'#2c3e50',rim:'#7f8c8d'},
    cond: {fill:'#6c3483',stroke:'#4a235a',rim:'#8e44ad'},
  };
  const c=cfg[type]||cfg.dmg;
  const txt=type==='heal'?'+'+val:type==='miss'?'MISS':type==='crit'?val+'!':String(val);

  // RS splat is a 4-pointed star / diamond blob shape
  const svg=`<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2 Q28 12 42 22 Q28 32 22 42 Q16 32 2 22 Q16 12 22 2Z"
      fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>
    <path d="M22 6 Q27 14 38 22 Q27 30 22 38 Q17 30 6 22 Q17 14 22 6Z"
      fill="${c.rim}" opacity="0.3"/>
  </svg>`;

  // ── Scale size with damage magnitude ──
  const _scale=type==='crit'?Math.min(2.2,1.0+val/35):Math.min(1.7,0.75+val/50);
  const _sz=Math.round(44*_scale);

  // ── Crit flash on #battleStage ──
  if(type==='crit'){
    const _bs=document.getElementById('battleStage');
    if(_bs){_bs.classList.add('crit-flash');setTimeout(()=>_bs.classList.remove('crit-flash'),420);}
  }

  const wrap=document.createElement('div');
  wrap.className=`splat splat-${type}`;
  wrap.style.width=_sz+'px';
  wrap.style.height=_sz+'px';

  // Random drift direction for visual variety
  const driftX = (Math.random()-0.5)*24;
  wrap.style.setProperty('--drift-x', driftX+'px');

  // Randomize position on the sprite
  const baseLeft=onRight?52:8;
  const jitterX=(Math.random()-0.5)*18;
  const jitterY=(Math.random()-0.5)*12;
  wrap.style.left=(baseLeft+jitterX)+'%';
  wrap.style.top=(30+jitterY)+'px';

  const svgWrap=document.createElement('div');
  svgWrap.innerHTML=svg;

  const numEl=document.createElement('div');
  numEl.className='splat-num';
  numEl.textContent=txt;
  // Scale font with splat size
  numEl.style.fontSize=Math.round(10*_scale)+'px';

  wrap.appendChild(svgWrap);
  wrap.appendChild(numEl);
  stage.appendChild(wrap);
  setTimeout(()=>wrap.remove(),1450);
}

function animEl(id,cls,duration){
  const el=document.getElementById(id);if(!el)return;
  el.classList.add(cls);
  setTimeout(()=>el.classList.remove(cls),duration);
}

// ══════════════════════════════════════════════════════════
//  LOGGER
// ══════════════════════════════════════════════════════════
function log(msg,type='s'){
  const el=document.getElementById('battleLog');if(!el)return;
  const p=document.createElement('div');
  p.className={'p':'bl-p','e':'bl-e','s':'bl-s','l':'bl-l','c':'bl-c','up':'bl-up','telegraph':'log-telegraph'}[type]||'bl-s';
  p.textContent=msg;
  el.appendChild(p);el.scrollTop=el.scrollHeight;
  while(el.children.length>100)el.removeChild(el.firstChild);
}

// ══════════════════════════════════════════════════════════
//  OVERLAY HELPERS
// ══════════════════════════════════════════════════════════
function openOverlay(id){document.getElementById(id).classList.add('open');}
function closeOverlay(id){document.getElementById(id).classList.remove('open');}

let _genericConfirmCallback = null;
function showGenericConfirm(title, msg, yesLabel, onYes){
  _genericConfirmCallback = onYes;
  document.getElementById('genericConfirmTitle').textContent = title;
  document.getElementById('genericConfirmMsg').textContent = msg;
  document.getElementById('genericConfirmYesBtn').textContent = yesLabel;
  openOverlay('genericConfirmOverlay');
}
function genericConfirmYes(){
  closeOverlay('genericConfirmOverlay');
  if(_genericConfirmCallback){ const fn=_genericConfirmCallback; _genericConfirmCallback=null; fn(); }
}

// ══════════════════════════════════════════════════════════
//  SCREEN SWITCH
// ══════════════════════════════════════════════════════════
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el = document.getElementById('screen-'+id);
  if(!el){ console.warn('[showScreen] no screen-'+id); return; }
  el.classList.add('active');
  if(id==='game'){
    if(G&&(CLASS_SPRITES[G.classId]||(window.hasImageSprite&&window.hasImageSprite(G.classId))))startPlayerAnim();
  } else if(id==='saveSlots'){
    if(typeof renderTitleSaveSlots==='function') renderTitleSaveSlots();
  } else if(id==='town'){
    const goldEl = document.getElementById('town-gold-display');
    if(goldEl && G) goldEl.textContent = G.gold + 'g';
    if(typeof _startTown==='function') _startTown();
  }
  if(id !== 'town' && typeof stopTownEngine === 'function') stopTownEngine();
}

// Fade to black → switch screen → fade back in
function fadeToScreen(id, onMidpoint){
  const overlay = document.getElementById('fadeOverlay');
  if(!overlay){ showScreen(id); if(onMidpoint) onMidpoint(); return; }
  // Fade BGM out gently
  if(typeof AUDIO!=='undefined'&&AUDIO.bgm) try{ AUDIO.bgm.volume=0.0; } catch(e){}
  overlay.style.opacity='0';
  overlay.style.display='block';
  // Force reflow
  overlay.getBoundingClientRect();
  overlay.style.transition='opacity 0.8s ease';
  overlay.style.opacity='1';
  setTimeout(()=>{
    showScreen(id);
    if(onMidpoint) onMidpoint();
    overlay.style.transition='opacity 0.6s ease';
    overlay.style.opacity='0';
    setTimeout(()=>{ overlay.style.display='none'; }, 650);
  }, 850);
}

// ── Bootstrap audio on first ANY interaction ─────────────
(function(){
  let audioStarted = false;
  function startAudio(){
    if(audioStarted) return;
    audioStarted = true;
    AUDIO.init();
    AUDIO.resume();
    document.removeEventListener('click', startAudio);
    document.removeEventListener('keydown', startAudio);
  }
  document.addEventListener('click', startAudio);
  document.addEventListener('keydown', startAudio);
})();

// ── Global ESC key → pause (works in game and town) ──────────────
document.addEventListener('keydown', function(e){
  if(e.key !== 'Escape') return;
  const gameActive = document.getElementById('screen-game')?.classList.contains('active');
  const townActive = document.getElementById('screen-town')?.classList.contains('active');
  if(!gameActive && !townActive) return;
  // Don't trigger if typing in an input or textarea
  if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  e.preventDefault();
  togglePause();
});

// ══════════════════════════════════════════════════════════
//  BUG LOG SYSTEM
// ══════════════════════════════════════════════════════════
const _bugEntries = [];
let _bugFilter = 'all';

// Seed with the 3 known fixed bugs from the last debug session
(function seedFixedBugs(){
  const fixes = [
    {
      level:'fixed',
      title:'setCooldown() — ReferenceError (FIXED)',
      detail:'Function was called in 4 places (sneak_attack, surge_strike, pickpocket, preserve_life) but never defined. Caused a JS ReferenceError crash every time those skills resolved. <code>setCooldown(skillId, seconds)</code> now defined as a helper that writes to <code>G.skillCooldowns</code>.',
    },
    {
      level:'fixed',
      title:'G._ultimateUsed not reset on long rest (FIXED)',
      detail:'All ultimates say "once per rest" but <code>cfDoRest()</code> only reset <code>_divineInterventionUsed</code> and <code>_undyingFuryUsed</code> — completely missing <code>_ultimateUsed</code>. After first use, ultimates were permanently locked for the entire run. Added <code>G._ultimateUsed=false</code> to rest logic.',
    },
    {
      level:'fixed',
      title:'Pickpocket material branch is a no-op (FIXED)',
      detail:'The 20% "steal material" outcome built a <code>mats</code> array (broken — filtered by <code>e.drop</code> which doesn\'t exist) then never added anything to inventory. Log message fired but player got nothing. Replaced with a zone-scaled material picker that calls <code>addItem()</code>.',
    },
  ];
  fixes.forEach(f => {
    _bugEntries.push({
      level: f.level,
      title: f.title,
      detail: f.detail,
      time: new Date().toLocaleTimeString(),
      ts: Date.now() - Math.floor(Math.random() * 120000),
    });
  });
})();

// Global error capture
window.addEventListener('error', function(e){
  bugLog('error',
    'Runtime Error: ' + (e.message||'Unknown error'),
    'File: <code>' + (e.filename||'unknown').split('/').pop() + '</code> · Line: <code>' + (e.lineno||'?') + '</code>' + (e.colno?' Col: <code>'+e.colno+'</code>':'')
  );
});
window.addEventListener('unhandledrejection', function(e){
  bugLog('error', 'Unhandled Promise Rejection', '<code>'+(e.reason||'unknown')+'</code>');
});

function bugLog(level, title, detail, silent){
  // silent = true means don't flash indicator (e.g. routine calls)
  if(level==='info' && silent) return; // suppress routine info noise
  _bugEntries.unshift({level, title, detail: detail||'', time: new Date().toLocaleTimeString(), ts: Date.now()});
  if(_bugEntries.length > 200) _bugEntries.length = 200;
  _refreshBugLog();
  if(!silent && (level==='error'||level==='warn')){
    _flashBugIndicator(level);
  }
}

function _flashBugIndicator(level){
  // Add a subtle flash to the pause button as a hint
  const btn = document.getElementById('pauseBtn');
  if(!btn) return;
  const orig = btn.style.borderColor;
  btn.style.borderColor = level==='error' ? '#c0392b' : '#c8a84b';
  setTimeout(() => { if(btn) btn.style.borderColor = orig; }, 1200);
}

function _refreshBugLog(){
  const body = document.getElementById('buglog-body');
  const empty = document.getElementById('buglog-empty');
  const counter = document.getElementById('buglog-count');
  if(!body || !counter) return;

  const filtered = _bugFilter === 'all' ? _bugEntries : _bugEntries.filter(e => e.level === _bugFilter);

  counter.textContent = _bugEntries.length + ' entr' + (_bugEntries.length===1?'y':'ies');

  if(!filtered.length){
    empty.style.display = 'block';
    empty.textContent = _bugFilter==='all' ? 'No entries yet.' : 'No '+_bugFilter+' entries.';
    body.innerHTML = '';
    body.appendChild(empty);
    return;
  }

  empty.style.display = 'none';

  const badgeMap = {
    fixed: '<span class="buglog-badge badge-fixed">FIXED</span>',
    error: '<span class="buglog-badge badge-error">ERROR</span>',
    warn:  '<span class="buglog-badge badge-warn">WARN</span>',
    info:  '<span class="buglog-badge badge-info">INFO</span>',
    note:  '<span class="buglog-badge badge-info">NOTE</span>',
  };

  body.innerHTML = filtered.map(e => `
    <div class="buglog-entry lvl-${e.level}">
      <span class="buglog-time">${e.time}</span>
      ${badgeMap[e.level]||badgeMap.info}
      <div class="buglog-msg">
        <span class="msg-title">${escHtml(e.title)}</span>
        ${e.detail ? `<span class="msg-detail">${e.detail}</span>` : ''}
      </div>
    </div>
  `).join('');
}

function escHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function setBugFilter(f){
  _bugFilter = f;
  document.querySelectorAll('.buglog-filter').forEach(b => {
    b.classList.remove('active','active-warn','active-error');
  });
  const btn = document.getElementById('filter-'+f);
  if(btn){
    if(f==='error') btn.classList.add('active-error');
    else if(f==='warn') btn.classList.add('active-warn');
    else btn.classList.add('active');
  }
  _refreshBugLog();
}

function submitBugNote(){
  const input = document.getElementById('buglog-input');
  if(!input) return;
  const txt = input.value.trim();
  if(!txt) return;
  bugLog('note', txt, G ? 'Class: '+G.classId+' · Zone: '+(G.zoneIdx+1)+' · Level: '+G.level : 'Outside game session');
  input.value = '';
}

function openBugLog(){
  _refreshBugLog();
  document.getElementById('buglog-overlay').classList.add('open');
  setTimeout(() => {
    const input = document.getElementById('buglog-input');
    if(input) input.focus();
  }, 100);
}

function closeBugLog(){
  document.getElementById('buglog-overlay').classList.remove('open');
}
function deathReturnToTown(){
  // Called from death screen — always return to Elderfen with character preserved
  if(!G){showScreen('saveSlots');return;}
  // Reset combat state — keep all character progress (level, items, gold, bosses)
  G.currentEnemy=null;
  G.currentEnemies=[];
  G.conditions=[];G.conditionTurns={};G.sx={};
  G.raging=false;G.hunterMarked=false;G.concentrating=null;
  G.wildShapeActive=false;G.spiritualWeaponActive=false;
  G.isPlayerTurn=true;G.actionUsed=false;G.bonusUsed=false;G.reactionUsed=false;
  G.bossReady=false;G.zoneKills=0;G.dungeonFights=0;
  G.roundNum=0;G._dyingFlag=false;
  G.hp=G.maxHp; // full HP restore — they're heading back to town
  if(typeof autoSave==='function') autoSave();
  if(typeof showTownHub==='function') showTownHub();
}

function deathGoToMenu(){
  // Clean up state and go to main menu
  if(G && G.lives<=0){
    if(typeof updateSlotData==='function'&&activeSaveSlot){
      updateSlotData(activeSaveSlot,d=>{
        d.state=null;
      });
    }
  }
  G=null;
  if(typeof renderTitleSaveSlots==='function') renderTitleSaveSlots();
  showScreen('saveSlots');
}

// ══════════════════════════════════════════════════════════
//  GRAVEYARD SCREEN
// ══════════════════════════════════════════════════════════
function showGraveyard(){
  const list=document.getElementById('graveyardList');
  const empty=document.getElementById('graveyardEmpty');
  if(!list)return;
  const gy=typeof loadGraveyard==='function'?loadGraveyard():[];
  list.innerHTML='';
  if(gy.length===0){
    if(empty)empty.style.display='block';
  } else {
    if(empty)empty.style.display='none';
    gy.forEach((e,i)=>{
      const date=new Date(e.ts);
      const dateStr=date.toLocaleDateString('en-US',{month:'short',day:'numeric'});
      const timeStr=_fmtTime(e.playTime);
      const rCol=_rarityColor(e.bestItem?e.bestItem.rarity:'common');
      const card=document.createElement('div');
      card.className='gy-card';
      card.innerHTML=`
        <div class="gy-card-rank">#${i+1}</div>
        <div class="gy-card-main">
          <div class="gy-card-top">
            <span class="gy-card-class">${e.className}${e.subclass?' / '+e.subclass:''}</span>
            <span class="gy-card-level">LVL ${e.level}</span>
          </div>
          <div class="gy-card-zone">Fell in ${e.zoneName} (Zone ${e.zoneNum})</div>
          <div class="gy-card-cause">Slain by <span class="gy-card-killer">${e.causeOfDeath}</span></div>
          <div class="gy-card-stats">
            <span>⚔ ${e.kills} kills</span>
            <span>🪙 ${e.gold}g</span>
            <span>🏆 ${e.bossesKilled} bosses</span>
            <span>⏱ ${timeStr}</span>
          </div>
          ${e.bestItem?'<div class="gy-card-item" style="color:'+rCol+'">'+iconHTML(e.bestItem.icon)+' '+e.bestItem.name+'</div>':''}
        </div>
        <div class="gy-card-date">${dateStr}</div>
      `;
      list.appendChild(card);
    });
  }
  showScreen('graveyard');
}

function _fmtTime(s){
  if(!s)return '0m';
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);
  if(h>0)return h+'h '+m+'m';
  return m+'m';
}
function _rarityColor(r){
  const m={common:'#b8b8b8',uncommon:'#2ecc71',rare:'#3498db',epic:'#9b59b6',legendary:'#f39c12'};
  return m[r]||m.common;
}

// ══════════════════════════════════════════════════════════
//  RUN TRACKER — Mini-map in right panel
// ══════════════════════════════════════════════════════════
function renderRunTracker(){
  const el=document.getElementById('runTracker');
  if(!el||!G)return;
  const zones=ZONES;
  let html='<div class="rt-path">';
  for(let i=0;i<zones.length;i++){
    const z=zones[i];
    const isCurrent=(i===G.zoneIdx);
    const isCleared=(i<G.zoneIdx)||(G.bossDefeated&&G.bossDefeated[i]);
    const isFuture=(i>G.zoneIdx);
    let cls='rt-node';
    if(isCurrent) cls+=' rt-current';
    else if(isCleared) cls+=' rt-cleared';
    else if(isFuture) cls+=' rt-future';

    html+=`<div class="${cls}">`;
    html+=`<div class="rt-marker">${isCleared?'✦':isCurrent?'◆':'○'}</div>`;
    html+=`<div class="rt-label">${z.num}</div>`;
    if(isCurrent) html+=`<div class="rt-name">${z.name}</div>`;
    html+=`</div>`;
    if(i<zones.length-1) html+=`<div class="rt-line${isCleared?' rt-line-done':''}"></div>`;
  }
  html+='</div>';
  el.innerHTML=html;
}

// ══════════════════════════════════════════════════════════
//  RELIC ENGINE
// ══════════════════════════════════════════════════════════

// hasRelic(id) — check if the player currently holds a relic by id
function hasRelic(id){ return !!(G && G.relics && G.relics.some(r=>r.id===id)); }

// triggerRelic(type, context) — fire all relics whose trigger matches type
function triggerRelic(type, context){
  if(!G || !G.relics || !G.relics.length) return;
  let changed = false;
  for(const r of G.relics){
    if(r.trigger !== type) continue;
    switch(r.effect){

      case 'heal_on_crit':
        if(typeof heal==='function'){ heal(r.val||3, r.name); changed=true; }
        break;

      case 'kill_atk_bonus':
        G._relicKillAtkBonus = (G._relicKillAtkBonus||0) + (r.val||1);
        spawnFloater('+'+(r.val||1)+' ATK','s',false);
        log(r.name+': ATK +'+(r.val||1)+' this fight!','s');
        changed=true;
        break;

      case 'counter_dmg':
        // Defer counter damage — dealDamageToPlayer is still in progress;
        // calling dealToEnemy here could kill the enemy mid-attack (state corruption)
        if(G.currentEnemy && G.currentEnemy.hp>0 && typeof dealToEnemy==='function'){
          const _counterAmt=r.val||4;
          const _counterName=r.name;
          setTimeout(()=>{
            if(G&&G.currentEnemy&&G.currentEnemy.hp>0&&typeof dealToEnemy==='function')
              dealToEnemy(_counterAmt, false, _counterName);
          },0);
          changed=true;
        }
        break;

      case 'stormcaller_charge':
        G._relicStormcallerBonus = (G._relicStormcallerBonus||0) + (r.val||5);
        log(r.name+': next attack +'+(r.val||5)+' damage!','s');
        changed=true;
        break;

      case 'regen_hp':
        if(typeof heal==='function'){ heal(r.val||2, r.name); changed=true; }
        break;

      case 'gain_resource':
        if(G.resMax && G.res<G.resMax){ G.res=Math.min(G.resMax,G.res+(r.val||1)); spawnFloater('+'+(r.val||1)+' res','s',false); changed=true; }
        break;

      case 'gold_on_kill':
        G.gold=(G.gold||0)+(r.val||5); G.totalGold=(G.totalGold||0)+(r.val||5);
        spawnFloater('+'+(r.val||5)+' gp','l',false);
        changed=true;
        break;

      case 'crit_burn':
        if(typeof addConditionEnemy==='function'){ addConditionEnemy('Burning', r.turns||2); changed=true; }
        break;

      case 'splash_dmg': {
        // Echo Blade — direct HP subtract to avoid death-chain recursion
        const _deadEnemy = context && context.enemy;
        const _splashTarget = (G.currentEnemies||[]).find(e=>!e.dead&&e.hp>0&&e!==_deadEnemy);
        if(_splashTarget){
          const _splashAmt = Math.max(1, Math.ceil((G.atk||1)*(r.pct||0.5)));
          _splashTarget.hp = Math.max(1, _splashTarget.hp - _splashAmt); // cannot kill
          spawnFloater(_splashAmt,'dmg',false);
          log(r.name+': '+_splashAmt+' splash to '+_splashTarget.name+'!','s');
          changed=true;
        }
        break;
      }

      case 'paincrest_stack':
        if((G._relicPaincrestStacks||0) < 3){
          G._relicPaincrestStacks = (G._relicPaincrestStacks||0) + 1;
          spawnFloater('+3 ATK','s',false);
          log(r.name+': ATK +3 stack (x'+(G._relicPaincrestStacks)+')','s');
          changed=true;
        }
        break;

      case 'refund_action_chance':
        if(G.actionUsed && Math.random()<(r.pct||0.25)){
          G.actionUsed=false;
          spawnFloater('ACTION','s',false);
          log(r.name+': momentum! Action restored.','s');
          changed=true;
        }
        break;

      case 'evasion_chance':
        if(!G._relicEvasionActive && Math.random()<(r.pct||0.15)){
          G._relicEvasionActive=true;
          spawnFloater('DODGE','s',false);
          log(r.name+': ready to dodge next hit!','s');
          changed=true;
        }
        break;

      case 'resource_on_crit':
        if(G.resMax && G.res<G.resMax){ G.res=Math.min(G.resMax,G.res+(r.val||2)); spawnFloater('+'+(r.val||2)+' res','s',false); changed=true; }
        break;

      case 'pct_heal_on_kill':
        if(typeof heal==='function'){
          const _gh=Math.max(1,Math.ceil(G.maxHp*(r.pct||0.04)));
          heal(_gh, r.name); changed=true;
        }
        break;

      case 'crit_double_next':
        if(!G._relicThirstingReady && !G._relicThirstingUsed){
          G._relicThirstingReady=true;
          spawnFloater('x2 NEXT','crit',false);
          log(r.name+': next attack deals double damage!','s');
          changed=true;
        }
        break;

      case 'voidpiercer_count':
        G._relicVoidpiercerCount=(G._relicVoidpiercerCount||0)+1;
        if(G._relicVoidpiercerCount>=3){
          G._relicVoidpiercerCount=0;
          G.actionUsed=false;
          spawnFloater('FREE ACTION','s',false);
          log(r.name+': 3rd skill — action refunded!','s');
          changed=true;
        }
        break;

      case 'soulbrand_dmg_boost':
        G._relicSoulbrandActive=true;
        G._relicDmgMult=1+(r.pct||0.10);
        G._relicSoulbrandTurns=2; // persists through next player turn (decremented in setPlayerTurn)
        spawnFloater('+10% DMG','s',false);
        log(r.name+': +10% damage until end of next turn!','s');
        changed=true;
        break;

      case 'bone_flute_stun':
        G._relicBoneFluteReady=true;
        log(r.name+': next enemy will stumble in!','s');
        changed=true;
        break;

      case 'raging_hp_drain_dmg':
        if(G.raging && G.currentEnemy && G.currentEnemy.hp>0){
          if(typeof _dev_godMode==='undefined'||!_dev_godMode) G.hp=Math.max(1,G.hp-2);
          spawnFloater(2,'dmg',false);
          if(typeof dealToEnemy==='function') dealToEnemy(6,false,r.name);
          changed=true;
        }
        break;

      case 'flat_dmg_reduction':
        // Ironward is handled inline in dealDamageToPlayer — no triggerRelic call
        break;

      case 'refund_action_on_kill':
        if(!G.actionUsed){
          // Action already free (e.g. another relic refunded it) — skip silently
        } else if(Math.random()<(r.pct||0.40)){
          G.actionUsed=false;
          spawnFloater('ACTION','s',false);
          log(r.name+': action refunded!','s');
          changed=true;
        }
        break;

      case 'crit_echo_hit':
        if(!G._relicVoidMirrorUsedThisTurn && G.currentEnemy && G.currentEnemy.hp>0 && typeof dealToEnemy==='function'){
          G._relicVoidMirrorUsedThisTurn=true;
          const _echoDmg = context&&context.dmg ? Math.ceil(context.dmg) : 1;
          dealToEnemy(_echoDmg, false, r.name+' (echo)');
          changed=true;
        }
        break;

      case 'ashen_crown_refund':
        if(!G._relicAshenCrownReady&&!G._relicAshenCrownUsed){
          G._relicAshenCrownReady=true;
          log(r.name+': first bonus action resource cost will be refunded!','s');
          changed=true;
        }
        break;

      case 'abyss_drain':
        if(G.currentEnemy && G.currentEnemy.hp>0 && typeof dealToEnemy==='function'){
          dealToEnemy(r.val||5, false, r.name);
          if(typeof heal==='function') heal(r.val||5, r.name);
          changed=true;
        }
        break;

      // ── New class-specific effects ──

      case 'arcane_lens_spellpower':
        G._relicArcaneLensBonus = (G._relicArcaneLensBonus||0) + (r.val||2);
        spawnFloater('+'+(r.val||2)+' SP','s',false);
        log(r.name+': spell power +'+(r.val||2)+' this fight!','s');
        changed=true;
        break;

      case 'restore_spell_slot':
        if(G.spellSlots && G.spellSlotsMax && Math.random()<0.30){
          if(G.spellSlots['1']<G.spellSlotsMax['1']){ G.spellSlots['1']++; spawnFloater('SLOT','s',false); log(r.name+': Level 1 spell slot restored!','s'); changed=true; }
        }
        break;

      case 'devotion_heal':
        if(typeof heal==='function'){ heal(r.val||4, r.name); changed=true; }
        break;

      case 'crit_poison_caster':
        if(typeof addConditionEnemy==='function'){ addConditionEnemy('Poisoned', r.turns||2); changed=true; }
        break;

      case 'battle_scarab_def':
        G._relicBattleScarabDef = (r.val||2);
        G._relicBattleScarabTurns = 2;
        spawnFloater('+2 DEF','s',false);
        log(r.name+': +2 DEF until end of next turn!','s');
        changed=true;
        break;

      case 'warlord_atk_surge':
        G._relicWarlordAtkNext = (r.val||3);
        log(r.name+': +3 ATK for the next fight!','s');
        changed=true;
        break;

      case 'retaliation_stun':
        if(G.currentEnemy && G.currentEnemy.hp>0 && Math.random()<(r.pct||0.20)){
          if(!G.currentEnemy.conditions) G.currentEnemy.conditions=[];
          if(!G.currentEnemy.conditions.find(c=>c.name==='Stunned'))
            G.currentEnemy.conditions.push({name:'Stunned',turns:1});
          spawnFloater('STUN','s',false);
          log(r.name+': enemy stunned!','s');
          changed=true;
        }
        break;

      case 'shadow_fang_crit':
        G._relicShadowFangCrit = 3;
        log(r.name+': next attack has +3 crit range!','s');
        changed=true;
        break;

      case 'quicksilver_bonus_refund':
        if(G.bonusUsed && Math.random()<(r.pct||0.35)){
          G.bonusUsed=false;
          spawnFloater('BONUS','s',false);
          log(r.name+': bonus action restored!','s');
          changed=true;
        }
        break;

      case 'nightrunner_evasion':
        G._relicEvasionActive=true;
        spawnFloater('DODGE','s',false);
        log(r.name+': ready to dodge the next attack!','s');
        changed=true;
        break;

      case 'radiant_heal_on_action':
        if(typeof heal==='function'){ heal(r.val||3, r.name); changed=true; }
        break;

      case 'oath_brand_smite':
        if(G.currentEnemy && G.currentEnemy.hp>0 && typeof dealToEnemy==='function'){
          dealToEnemy(r.val||8, false, r.name);
          changed=true;
        }
        break;

      case 'verdant_regen':
        if(typeof heal==='function'){ heal(r.val||3, r.name); changed=true; }
        break;

      case 'beastcaller_bleed':
        if(G.currentEnemy && G.currentEnemy.hp>0 && Math.random()<0.25){
          if(typeof addConditionEnemy==='function'){ addConditionEnemy('Bleeding', r.turns||2); changed=true; }
        }
        break;

      case 'moonwell_resource':
        if(G.resMax && G.res<G.resMax){
          G.res=Math.min(G.resMax,G.res+(r.val||2));
          spawnFloater('+'+(r.val||2)+' res','s',false);
          log(r.name+': Nature\'s Charge restored!','s');
          changed=true;
        }
        break;

      case 'bloodrage_atk':
        if(G.raging){
          const _brStacks = (G._relicBloodrageStacks||0);
          if(_brStacks < 5){
            G._relicBloodrageStacks = _brStacks + 1;
            spawnFloater('+2 ATK','s',false);
            log(r.name+': rage fuels power! +'+(G._relicBloodrageStacks*2)+' ATK total.','s');
            changed=true;
          }
        }
        break;

      case 'commanders_momentum':
        if(G.classId==='fighter' && G.resMax && G.res<G.resMax){
          G.res=Math.min(G.resMax,G.res+(r.val||1));
          spawnFloater('+1 MOM','s',false);
          log(r.name+': +1 Momentum!','s');
          changed=true;
        }
        break;

      case 'spell_eater_resource':
        if(G.resMax && G.res<G.resMax){
          G.res=Math.min(G.resMax,G.res+(r.val||3));
          spawnFloater('+'+(r.val||3)+' res','s',false);
          log(r.name+': pain fuels magic!','s');
          changed=true;
        } else if(G.spellSlots && G.spellSlotsMax){
          // Wizard: try to restore a spell slot instead
          if(G.spellSlots['1']<G.spellSlotsMax['1']){ G.spellSlots['1']++; spawnFloater('SLOT','s',false); changed=true; }
        }
        break;

      case 'warmonger_heal_atk':
        if(typeof heal==='function') heal(r.val||5, r.name);
        G._relicWarlordAtkNext = Math.max(G._relicWarlordAtkNext||0, 2);
        log(r.name+': healed and empowered for the next fight!','s');
        changed=true;
        break;

      // ── Pool Equalizer relics ──

      case 'prism_evasion':
        if(!G._relicEvasionActive && Math.random()<(r.pct||0.15)){
          G._relicEvasionActive=true;
          spawnFloater('DODGE','s',false);
          log(r.name+': ready to dodge next hit!','s');
          changed=true;
        }
        break;

      case 'crit_shadow_dmg':
        if(G.currentEnemy && G.currentEnemy.hp>0 && typeof dealToEnemy==='function'){
          dealToEnemy(r.val||4, false, r.name);
          changed=true;
        }
        break;

      case 'bonus_ignore_def':
        G._relicIgnoreDefNext=true;
        log(r.name+': next attack ignores DEF!','s');
        changed=true;
        break;

      case 'ether_conduit_sp':
        G._relicArcaneLensBonus = (G._relicArcaneLensBonus||0) + (r.val||3);
        spawnFloater('+'+(r.val||3)+' SP','s',false);
        log(r.name+': spell power +'+(r.val||3)+' this fight!','s');
        changed=true;
        break;

      case 'per_turn_resource_chance':
        if(G.resMax && G.res<G.resMax && Math.random()<(r.pct||0.20)){
          G.res=Math.min(G.resMax,G.res+1);
          spawnFloater('+1 res','s',false);
          log(r.name+': resource restored!','s');
          changed=true;
        } else if(G.spellSlots && G.spellSlotsMax && Math.random()<(r.pct||0.20)){
          if(G.spellSlots['1']<G.spellSlotsMax['1']){ G.spellSlots['1']++; spawnFloater('SLOT','s',false); changed=true; }
        }
        break;

      case 'hit_weaken_enemy':
        if(G.currentEnemy && G.currentEnemy.hp>0 && Math.random()<(r.pct||0.25)){
          if(typeof addConditionEnemy==='function'){ addConditionEnemy('Weakened', r.turns||2); changed=true; }
        }
        break;

      case 'low_hp_heal_on_action':
        if(G.hp < G.maxHp*0.5 && typeof heal==='function'){
          heal(r.val||2, r.name);
          changed=true;
        }
        break;

      case 'kill_hp_resource':
        if(typeof heal==='function') heal(r.val||3, r.name);
        if(G.resMax && G.res<G.resMax){ G.res=Math.min(G.resMax,G.res+1); spawnFloater('+1 res','s',false); }
        changed=true;
        break;

      case 'astral_root_sp':
        G._relicAstralRootBonus = (r.val||2);
        log(r.name+': +2 spell power for the next fight!','s');
        changed=true;
        break;

      case 'crit_poison_dex':
        if(typeof addConditionEnemy==='function'){ addConditionEnemy('Poisoned', r.turns||2); changed=true; }
        break;

      case 'bonus_def_boost':
        G._relicBattleScarabDef = (G._relicBattleScarabDef||0) + (r.val||3);
        G._relicBattleScarabTurns = 2;
        spawnFloater('+'+(r.val||3)+' DEF','s',false);
        log(r.name+': +'+(r.val||3)+' DEF until end of next turn!','s');
        changed=true;
        break;

      // passive effects handled inline (hasRelic checks) — no dispatch here
      case 'passive_crit_range':
      case 'passive_crit_range_caster':
      case 'passive_expose':
      case 'passive_execute':
        break;
    }
  }
  if(changed && typeof renderAll==='function') renderAll();
}

// ══════════════════════════════════════════════════════════
//  BOSS REWARD SCREEN
// ══════════════════════════════════════════════════════════

let _bossRewardCallback = null;
let _bossRewardRelicChoices = null;
let _bossRewardGrace = null;

function showBossReward(onDone){
  if(!G || typeof RELICS==='undefined' || typeof CLASSES==='undefined') { if(onDone) onDone(); return; }
  _bossRewardCallback = onDone;

  // -- RELIC PANEL: 3 choices from relics player doesn't own, filtered by class
  const owned = new Set((G.relics||[]).map(r=>r.id));
  const classPool = RELICS.filter(r=>!owned.has(r.id) && (!r.classes || r.classes.includes(G.classId)));
  const pool = classPool.length >= 3 ? classPool : RELICS.filter(r=>!owned.has(r.id));
  const source = pool.length >= 3 ? pool : RELICS;
  const shuffled = [...source].sort(()=>Math.random()-0.5);
  _bossRewardRelicChoices = [shuffled[0], shuffled[1], shuffled[2]];

  // -- GRACE PANEL: 60% chance — generate but do NOT add to inventory yet
  _bossRewardGrace = (Math.random()<0.60 && typeof generateGrace==='function') ? generateGrace() : null;

  // -- SKILL UPGRADE PANEL: upgradeable skills visible to player
  const upgradeable = (CLASSES[G.classId]&&CLASSES[G.classId].skills||[]).filter(sk=>
    sk.upgrade &&
    !(G.upgradedSkills && G.upgradedSkills[sk.id]) &&
    (!sk.subclassOnly||(G.level>=3&&G.subclassId&&sk.subclassId===G.subclassId)) &&
    (!sk.ultimateOnly||G.ultimateUnlocked)
  );

  const rc = {common:'#888',uncommon:'var(--green2)',rare:'#4a9eda',epic:'#8b44ad',legendary:'var(--gold)'};

  const relicCardsHtml = _bossRewardRelicChoices.map((r,i)=>`
    <div class="boss-reward-card relic-card" onclick="bossRewardPickRelic(${i})" style="border-color:${rc[r.rarity]||'#333'}40;">
      <div class="brc-icon" style="color:${rc[r.rarity]||'#888'}">${iconHTML(r.icon)}</div>
      <div class="brc-name" style="color:${rc[r.rarity]||'#888'}">${r.name}</div>
      <div class="brc-rarity" style="color:${rc[r.rarity]||'#888'}">${r.rarity.toUpperCase()}</div>
      <div class="brc-desc">${r.desc}</div>
    </div>`).join('');

  const skillCardsHtml = upgradeable.length ? upgradeable.map(sk=>`
    <div class="boss-reward-card skill-card" onclick="bossRewardPickUpgrade('${sk.id}')">
      <div class="brc-icon" style="color:var(--gold)">${iconHTML(sk.icon)}</div>
      <div class="brc-name" style="color:var(--gold)">${sk.name}</div>
      <div class="brc-current">${sk.desc}</div>
      <div class="brc-upgrade-label">UPGRADED:</div>
      <div class="brc-upgrade-desc" style="color:var(--green2)">${sk.upgrade.desc}</div>
    </div>`).join('')
  : '<div class="brc-empty">All skills upgraded.</div>';

  const graceColumnHtml = _bossRewardGrace ? (()=>{
    const g = _bossRewardGrace;
    const gc = rc[g.rarity]||'#888';
    return `
      <div class="boss-reward-divider">OR</div>
      <div class="boss-reward-panel">
        <div class="brp-label">TAKE A GRACE</div>
        <div class="brp-cards">
          <div class="boss-reward-card grace-card" onclick="bossRewardPickGrace()" style="border-color:${gc}40;">
            <div class="brc-icon" style="color:${gc}">${iconHTML(g.icon||'crown-coin')}</div>
            <div class="brc-name" style="color:${gc}">${g.name}</div>
            <div class="brc-rarity" style="color:${gc}">${(g.rarity||'').toUpperCase()}</div>
            <div class="brc-desc">${g.desc||''}</div>
          </div>
        </div>
      </div>`;
  })() : '';

  document.getElementById('bossRewardContent').innerHTML = `
    <div class="boss-reward-header">BOSS DEFEATED — CHOOSE YOUR REWARD</div>
    <div class="boss-reward-panels">
      <div class="boss-reward-panel">
        <div class="brp-label">TAKE A RELIC</div>
        <div class="brp-cards">${relicCardsHtml}</div>
      </div>
      <div class="boss-reward-divider">OR</div>
      <div class="boss-reward-panel">
        <div class="brp-label">UPGRADE A SKILL</div>
        <div class="brp-cards">${skillCardsHtml}</div>
      </div>
      ${graceColumnHtml}
    </div>`;

  document.getElementById('bossRewardOverlay').style.display = 'flex';
  if(typeof AUDIO!=='undefined'&&AUDIO.sfx&&AUDIO.sfx.loot) AUDIO.sfx.loot();
}

function bossRewardPickRelic(idx){
  const chosen = _bossRewardRelicChoices && _bossRewardRelicChoices[idx];
  if(!chosen || !G) return;
  if(!G.relics) G.relics = [];
  if(G.relics.length < 6){ G.relics.push({...chosen}); log(chosen.name+' acquired!','l'); }
  _bossRewardDone();
}

function bossRewardPickUpgrade(skillId){
  if(!G) return;
  if(!G.upgradedSkills) G.upgradedSkills = {};
  G.upgradedSkills[skillId] = true;
  const sk = (CLASSES[G.classId]&&CLASSES[G.classId].skills||[]).find(s=>s.id===skillId);
  log((sk?sk.name:'Skill')+' upgraded!','l');
  _bossRewardDone();
}

function bossRewardPickGrace(){
  if(!_bossRewardGrace) return;
  if(typeof addGraceToInventory==='function') addGraceToInventory(_bossRewardGrace);
  log(_bossRewardGrace.name+' grace acquired!','l');
  _bossRewardDone();
}

function _bossRewardDone(){
  document.getElementById('bossRewardOverlay').style.display = 'none';
  _bossRewardRelicChoices = null;
  _bossRewardGrace = null;
  if(typeof renderRelicHud==='function') renderRelicHud();
  if(typeof renderAll==='function') renderAll();
  const cb = _bossRewardCallback;
  _bossRewardCallback = null;
  if(cb) setTimeout(cb, 300);
}

// ══════════════════════════════════════════════════════════
//  ROOM CHOICE OVERLAY
// ══════════════════════════════════════════════════════════

function showRoomChoice(){
  // Weighted room choice: 40% rest, 35% elite, 25% event
  const rng = Math.random();
  const altType = rng < 0.40 ? 'rest' : rng < 0.75 ? 'elite' : 'event';
  const altData = {
    rest: {
      icon:'health-increase', label:'Take a Rest',
      desc:'Catch your breath in a sheltered alcove. Restore 15% of your max HP before pressing deeper.',
      flavor:'A faint breeze carries the scent of moss and still water. The silence here feels safe — for now.'
    },
    elite: {
      icon:'skull-crossed-bones', label:'Elite Enemy',
      desc:'Face a powerful foe with 1.5\u00D7 stats. Defeating it guarantees a rare item drop and a relic.',
      flavor:'The ground trembles beneath heavy footsteps. Something far stronger than the usual rabble blocks the way ahead.'
    },
    event: {
      icon:'scroll-unfurled', label:'Strange Encounter',
      desc:'Something unusual stirs in the dungeon. The outcome is uncertain.',
      flavor:'A strange light flickers at the edge of your vision. You hear whispers that don\'t belong to the wind.'
    },
  };
  const alt = altData[altType];

  // Zone-aware header flavor
  const zoneName = (typeof ZONES!=='undefined'&&ZONES[G.zoneIdx]) ? ZONES[G.zoneIdx].name : 'the dungeon';
  const killNum = (G.zoneKills||0);
  const headerFlavor = 'The path splits ahead in ' + zoneName + '.';

  document.getElementById('roomChoiceContent').innerHTML = `
    <div class="room-choice-header">WHAT LIES AHEAD?</div>
    <div class="room-choice-subheader">${headerFlavor}</div>
    <div class="room-choice-progress">${iconHTML('sword')} ${killNum} enemies defeated this zone</div>
    <div class="room-choice-cards">
      <div class="room-choice-card" onclick="resolveRoomChoice('fight')">
        <div class="rcc-icon">${iconHTML('crossed-swords')}</div>
        <div class="rcc-label">Press On</div>
        <div class="rcc-flavor">The corridor ahead echoes with the scrape of claws on stone. More enemies lie in wait.</div>
        <div class="rcc-divider"></div>
        <div class="rcc-desc">Fight the next enemy.</div>
      </div>
      <div class="room-choice-card room-choice-alt" onclick="resolveRoomChoice('${altType}')">
        <div class="rcc-icon">${iconHTML(alt.icon)}</div>
        <div class="rcc-label">${alt.label}</div>
        <div class="rcc-flavor">${alt.flavor}</div>
        <div class="rcc-divider"></div>
        <div class="rcc-desc">${alt.desc}</div>
      </div>
    </div>`;
  document.getElementById('roomChoiceOverlay').style.display = 'flex';
}

function resolveRoomChoice(type){
  document.getElementById('roomChoiceOverlay').style.display = 'none';
  if(type==='fight'){
    spawnEnemy();
  } else if(type==='rest'){
    const hpGain = Math.max(1, Math.ceil(G.maxHp*0.15));
    if(typeof heal==='function') heal(hpGain,'Rest');
    log('You rest briefly. +'+hpGain+' HP.','s');
    setTimeout(()=>spawnEnemy(), 600);
  } else if(type==='elite'){
    G._nextEnemyIsElite = true;
    log('An elite enemy steps from the shadows...','w');
    spawnEnemy();
  } else if(type==='event'){
    const zoneId = (typeof ZONES!=='undefined'&&ZONES[G.zoneIdx]) ? ZONES[G.zoneIdx].id : null;
    const eligible = (typeof RARE_EVENTS!=='undefined'?RARE_EVENTS:[]).filter(e=>
      (!e.zones||(zoneId&&e.zones.includes(zoneId))) &&
      (!e.locked||(typeof isEventUnlocked==='function'&&isEventUnlocked(RARE_EVENTS.indexOf(e))))
    );
    if(eligible.length>0 && typeof showRareEvent==='function'){
      G._rareEventsThisZone=(G._rareEventsThisZone||0)+1;
      if(typeof updateUnlockStats==='function') updateUnlockStats('rare_event');
      showRareEvent(eligible[Math.floor(Math.random()*eligible.length)]);
    } else {
      log('The path ahead is clear.','s');
      spawnEnemy();
    }
  }
}

// ══════════════════════════════════════════════════════════
//  ELITE RELIC DROP — pick 1 of 2 after killing an elite
// ══════════════════════════════════════════════════════════
let _eliteRelicChoices = null;

function showEliteRelicDrop(){
  if(!G || typeof RELICS==='undefined') return;
  const owned = new Set((G.relics||[]).map(r=>r.id));
  const classPool = RELICS.filter(r=>!owned.has(r.id) && (!r.classes || r.classes.includes(G.classId)));
  const pool = classPool.length > 0 ? classPool : RELICS.filter(r=>!owned.has(r.id));
  if(pool.length===0) return; // player owns all relics

  const shuffled = [...pool].sort(()=>Math.random()-0.5);
  _eliteRelicChoices = [shuffled[0], shuffled[1]||shuffled[0]];

  const rc = {common:'#888',uncommon:'var(--green2)',rare:'#4a9eda',epic:'#8b44ad',legendary:'var(--gold)'};

  const cardsHtml = _eliteRelicChoices.map((r,i)=>`
    <div class="elite-relic-card" onclick="eliteRelicPick(${i})" style="border-color:${rc[r.rarity]||'#333'}40;">
      <div class="erc-icon" style="color:${rc[r.rarity]||'#888'}">${iconHTML(r.icon)}</div>
      <div class="erc-name" style="color:${rc[r.rarity]||'#888'}">${r.name}</div>
      <div class="erc-rarity" style="color:${rc[r.rarity]||'#888'}">${r.rarity.toUpperCase()}</div>
      <div class="erc-desc">${r.desc}</div>
    </div>`).join('');

  document.getElementById('eliteRelicContent').innerHTML = `
    <div class="elite-relic-header">ELITE VANQUISHED</div>
    <div class="elite-relic-subheader">A powerful artifact remains. Choose one.</div>
    <div class="elite-relic-cards">${cardsHtml}</div>`;

  document.getElementById('eliteRelicOverlay').style.display = 'flex';
  if(AUDIO&&AUDIO.sfx&&AUDIO.sfx.loot) AUDIO.sfx.loot();
}

function eliteRelicPick(idx){
  const chosen = _eliteRelicChoices && _eliteRelicChoices[idx];
  if(!chosen || !G) return;
  if(!G.relics) G.relics = [];
  if(G.relics.length < 6){
    G.relics.push({...chosen});
    log(chosen.name + ' acquired!', 'l');
  } else {
    log('Relic inventory full (6/6) — ' + chosen.name + ' left behind.', 'w');
  }
  _eliteRelicChoices = null;
  document.getElementById('eliteRelicOverlay').style.display = 'none';
  if(typeof renderRelicHud==='function') renderRelicHud();
  renderAll();
}

