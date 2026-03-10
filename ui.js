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

// Close panel when clicking outside
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
});

function onMusicVol(v){
  const vol=Number(v)/100;
  AUDIO.setMusicVol(_musicMuted?0:vol);
  // Sync all music vol elements
  ['musicVolNum','titleMusicVolNum'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=v;});
  ['musicSlider','titleMusicSlider'].forEach(id=>{const el=document.getElementById(id);if(el&&el.value!=v)el.value=v;});
  _updateAudioIcon();
}

function onSfxVol(v){
  const vol=Number(v)/100;
  AUDIO.setSfxVol(_sfxMuted?0:vol);
  // Sync all sfx vol elements
  ['sfxVolNum','titleSfxVolNum'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=v;});
  ['sfxSlider','titleSfxSlider'].forEach(id=>{const el=document.getElementById(id);if(el&&el.value!=v)el.value=v;});
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
  const btn=document.getElementById('audioToggleBtn');
  if(!btn)return;
  if(_musicMuted&&_sfxMuted) btn.textContent='🔇';
  else if(_musicMuted) btn.textContent='🎵';
  else if(_sfxMuted) btn.textContent='💥';
  else btn.textContent='🔊';
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

