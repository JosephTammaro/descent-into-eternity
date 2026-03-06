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
  autoSave();
}

const _HERO_TRUE_NAME = 'Auren';
function _getHeroName(){
  if(G) G.heroName = _HERO_TRUE_NAME;
  return _HERO_TRUE_NAME;
}

function showKitJournal(onDone){
  const name = (G && G.heroName) || _getHeroName();
  document.getElementById('kitJournalText').textContent =
    'They came back today.\n\nWe were all at the Gate. All six of us who stayed.\n' +
    'The darkness stopped. Just stopped. I don\'t know how else to say it.\n\n' +
    'They stood there for a while, looking at us like they had just remembered something important.\n\n' +
    'The inscription on the Gate is clear now.\nBrother Edwyn read it aloud.\n\n' +
    'Their name is ' + name + '.\n\n' +
    'I wrote their number in the front of this journal.\n' +
    '1 person went in. 1 person came back.\n\n' +
    'This is the last entry.\n\n— Kit';
  const el = document.getElementById('kitJournal');
  el.classList.add('open');
  function _advance(){
    el.classList.remove('open');
    el.removeEventListener('click', _advance);
    document.removeEventListener('keydown', _kd);
    setTimeout(onDone, 400);
  }
  function _kd(e){
    if(['Space','Enter','ArrowRight','ArrowDown'].includes(e.code)) _advance();
  }
  el.addEventListener('click', _advance);
  document.addEventListener('keydown', _kd);
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
    const isName = line === '{{HERO_NAME}}';
    const d = document.createElement('div');
    d.className = 'lore-line' + (isName ? ' lore-line-name' : '');
    d.textContent = isName ? _getHeroName() : line;
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
//  VICTORY SEQUENCE — Plays after final boss (first clear)
// ══════════════════════════════════════════════════════════

let _vcTimers = [];
function _vcClear(){ _vcTimers.forEach(t=>clearTimeout(t)); _vcTimers=[]; }
function _vcDelay(fn,ms){ _vcTimers.push(setTimeout(fn,ms)); }

function showVictorySequence(){
  _vcClear();
  AUDIO.stopBGM();

  // ── Phase 1: Black screen with "The descent is finally over." ──
  const overlay = document.getElementById('victoryScene');
  const trans = document.getElementById('vsTrans');
  const tText = document.getElementById('vsTransText');

  overlay.style.display = 'flex';
  trans.className = 'vs-trans';
  trans.style.opacity = '';
  tText.className = 'vs-trans-text';
  tText.style.opacity = '';
  tText.style.transition = '';
  tText.textContent = 'The descent is finally over.';

  // Fade in text
  _vcDelay(()=>{ tText.classList.add('show'); }, 800);
  // Fade out text
  _vcDelay(()=>{
    tText.style.transition = 'opacity 1.5s ease';
    tText.style.opacity = '0';
  }, 4200);

  // ── Phase 2: Transition to the actual town in victory mode ──
  _vcDelay(()=>{
    overlay.style.display = 'none';
    if(G) G._victoryMode = true;
    if(typeof showTownHub === 'function') showTownHub();
  }, 6000);
}

function closeVictoryScene(){
  _vcClear();
  document.getElementById('victoryScene').style.display = 'none';
}

// ── Credits ──────────────────────────────────────────────
function showCreditsScreen(){
  const overlay = document.getElementById('creditsScreen');
  overlay.style.display = 'flex';
  const btn = document.getElementById('creditsBtn');
  btn.classList.remove('show');

  // Reset all blocks for replay
  const blocks = overlay.querySelectorAll('.credits-block');
  blocks.forEach(el=>{
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = '';
  });

  // Animate blocks in one by one
  blocks.forEach((el,i)=>{
    setTimeout(()=>{
      el.style.transition = 'opacity 1s ease, transform 1s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 800 + i*1200);
  });

  // Show return button after all blocks
  setTimeout(()=>{ btn.classList.add('show'); }, 800 + blocks.length*1200 + 800);

  AUDIO.stopBGM();
  AUDIO.playBGM('title');
}

function closeCredits(){
  document.getElementById('creditsScreen').style.display = 'none';
  AUDIO.stopBGM();

  // Clear the game state — run is over
  G = null;
  if(typeof showScreen === 'function') showScreen('title');
  AUDIO.playBGM('title');
}

// ══════════════════════════════════════════════════════════
//  STORY INTRO
// ══════════════════════════════════════════════════════════
function showStoryIntro(zoneIdx){
  // BGM already started in cinematic
  AUDIO.sfx.zoneEnter();
  const z=ZONES[zoneIdx];
  // Cinematic already showed zone name — keep a subtle eyebrow only
  document.getElementById('storyZoneTag').textContent=`— ZONE ${z.num} —`;
  document.getElementById('storyTitle').textContent='';
  document.getElementById('storyTitle').style.display='none';
  // Show restore badge only when travelling (not zone 0 on new game)
  const healBadge=document.getElementById('storyHealBadge');
  healBadge.style.display=(zoneIdx>0)?'block':'none';
  const bodyEl=document.getElementById('storyBody');
  bodyEl.textContent='';
  let i=0;
  const t=setInterval(()=>{bodyEl.textContent+=z.story.text[i++];if(i>=z.story.text.length)clearInterval(t);},28);

  // ── Phase B: Set active modifier (banner hidden — shows on game screen only) ──
  const modBanner=document.getElementById('modifierBanner');
  if(modBanner) modBanner.style.display='none';
  if(G._zoneModifiers && G._zoneModifiers[zoneIdx] && typeof ZONE_MOD_BY_ID !== 'undefined'){
    const mod=ZONE_MOD_BY_ID[G._zoneModifiers[zoneIdx]];
    if(mod){
      G._activeModifier=mod;
      G._ancestralStacks=0;
      G._witchChoice=null;
      G._predatorBuff=null;
      // Taxed: lose gold on entry
      if(mod.effects.entryGoldTax && G.gold > 0){
        const tax=Math.floor(G.gold * mod.effects.entryGoldTax);
        G.gold=Math.max(0,G.gold-tax);
        if(typeof log==='function') log('💸 Taxed: -'+tax+'g toll to enter this zone.','c');
      }
      // Ironhide: apply +5 DEF to player
      if(mod.effects.bonusDef) G.def += mod.effects.bonusDef;
    } else {
      G._activeModifier=null;
    }
  } else {
    G._activeModifier=null;
  }

  showScreen('story');
}

// ── Playtime tracker ──────────────────────────────────────
let _playTimerInterval = null;

function startPlayTimer(){
  if(_playTimerInterval) return;
  _playTimerInterval = setInterval(()=>{
    if(G && !paused) G.playTime = (G.playTime||0) + 1;
  }, 1000);
}

function stopPlayTimer(){
  if(_playTimerInterval){ clearInterval(_playTimerInterval); _playTimerInterval=null; }
}

function formatPlayTime(seconds){
  if(!seconds) return '0m';
  const h = Math.floor(seconds/3600);
  const m = Math.floor((seconds%3600)/60);
  const s = seconds%60;
  if(h>0) return h+'h '+m+'m';
  if(m>0) return m+'m '+s+'s';
  return s+'s';
}

