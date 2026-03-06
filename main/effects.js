function triggerScreenShake(intensity){
  const pc = document.querySelector('.panel-center');
  if(!pc) return;
  // Remove all shake classes
  pc.classList.remove('screen-shake','screen-shake-crit','screen-shake-boss');
  void pc.offsetWidth; // force reflow
  const cls = intensity==='crit'?'screen-shake-crit':intensity==='boss'?'screen-shake-boss':'screen-shake';
  pc.classList.add(cls);
  const dur = intensity==='crit'?450:intensity==='boss'?600:350;
  setTimeout(()=> pc.classList.remove(cls), dur);
}

function triggerDamageFlash(side){
  const stage = document.getElementById('battleStage');
  if(!stage) return;
  const cls = side==='player' ? 'flash-red' : 'flash-green';
  stage.classList.remove(cls);
  void stage.offsetWidth;
  stage.classList.add(cls);
  setTimeout(()=> stage.classList.remove(cls), 250);
}

function triggerBossSpecialFlash(){
  const stage = document.getElementById('battleStage');
  if(!stage) return;
  stage.classList.remove('flash-boss-special');
  void stage.offsetWidth;
  stage.classList.add('flash-boss-special');
  setTimeout(()=> stage.classList.remove('flash-boss-special'), 400);
}

function triggerKillFreeze(){
  const stage = document.getElementById('battleStage');
  if(!stage) return;
  stage.classList.add('kill-freeze');
  setTimeout(()=> stage.classList.remove('kill-freeze'), 100);
}

function triggerPhase2Zoom(){
  const stage = document.getElementById('battleStage');
  if(!stage) return;
  stage.classList.remove('phase2-zoom');
  void stage.offsetWidth;
  stage.classList.add('phase2-zoom');
  setTimeout(()=> stage.classList.remove('phase2-zoom'), 1200);
}

function triggerBossEntrance(name, title){
  const el = document.getElementById('bossEntranceOverlay');
  if(!el) return;
  document.getElementById('bossEntranceName').textContent = name || '';
  document.getElementById('bossEntranceTitle').textContent = title || '';
  el.classList.remove('active');
  void el.offsetWidth;
  el.classList.add('active');
  setTimeout(()=> el.classList.remove('active'), 2800);
}

// ══════════════════════════════════════════════════════════
//  KEYBOARD CONTROLS
// ══════════════════════════════════════════════════════════
(function initKeyboardControls(){
  document.addEventListener('keydown', function(e){
    // Don't fire if typing in input fields
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;

    // Check if game screen is active
    const gameScreen=document.getElementById('screen-game');
    const gameActive=gameScreen&&gameScreen.classList.contains('active');

    // Check if any overlay is blocking (pause, help, map, death, levelup, campfire, etc.)
    const pauseOpen=document.getElementById('pause-overlay')?.classList.contains('open');
    const helpOpen=document.getElementById('help-overlay')?.classList.contains('open');
    const mapOpen=document.getElementById('screen-map')?.classList.contains('active');
    const deathUp=document.getElementById('deathOverlay')?.style.display==='flex';
    const charSheetUp=document.getElementById('screen-charsheet')?.classList.contains('active');
    const levelUpUp=document.getElementById('levelup-overlay')?.classList.contains('open');
    const bossVicUp=document.getElementById('bossVictoryOverlay')?.classList.contains('active');
    const graceUp=document.getElementById('graceDropOverlay')?.style.display==='flex';
    const loreUp=document.getElementById('loreReveal')?.classList.contains('open');
    const talentUp=document.getElementById('talent-overlay')?.classList.contains('open');
    const branchUp=document.getElementById('branchRewardOverlay')?.style.display==='flex';
    const overlayBlocking=pauseOpen||helpOpen||mapOpen||deathUp||levelUpUp||bossVicUp||graceUp||loreUp||talentUp||branchUp;

    // --- GLOBAL KEYS (work on game or town screen) ---
    const townActive=document.getElementById('screen-town')?.classList.contains('active');

    // Esc is already handled in ui.js

    // M — map (toggle)
    if(e.key==='m'||e.key==='M'){
      if(mapOpen){
        e.preventDefault();
        closeMap();
        return;
      }
      if(gameActive&&!overlayBlocking&&!charSheetUp){
        e.preventDefault();
        showMap();
        return;
      }
    }

    // H — help (toggle)
    if(e.key==='h'||e.key==='H'){
      if(helpOpen){
        e.preventDefault();
        closeHelp();
        return;
      }
      if((gameActive||townActive)&&!overlayBlocking&&!charSheetUp){
        e.preventDefault();
        openHelp();
        return;
      }
    }

    // C — character sheet (toggle)
    if(e.key==='c'||e.key==='C'){
      if(charSheetUp){
        e.preventDefault();
        closeCharSheet();
        return;
      }
      if(gameActive&&!overlayBlocking){
        e.preventDefault();
        showCharSheet();
        return;
      }
    }

    // --- COMBAT KEYS (game screen, no overlays, in combat) ---
    if(!gameActive||overlayBlocking||charSheetUp) return;

    const key=e.key;

    // Space — end turn
    if(key===' '){
      e.preventDefault();
      const etb=document.getElementById('endTurnBtn');
      if(etb&&!etb.disabled){
        playerEndTurn();
      }
      return;
    }

    // P — use potion
    if(key==='p'||key==='P'){
      e.preventDefault();
      const pb=document.getElementById('quickPotionBtn');
      if(pb&&!pb.disabled) quickUsePotion();
      return;
    }

    // 1-9 — skill buttons
    const num=parseInt(key);
    if(num>=1&&num<=9){
      e.preventDefault();
      const btn=document.querySelector(`.skill-btn[data-skill-key="${num}"]`);
      if(btn&&!btn.disabled){
        btn.click();
      }
      return;
    }
  });
})();

// ══════════════════════════════════════════════════════════
//  BOSS TELEGRAPH SYSTEM
// ══════════════════════════════════════════════════════════
const BOSS_TELEGRAPHS = {
  'Thornwarden':       'The Thornwarden\'s roots begin to writhe beneath the earth...',
  'Commander Grakthar':'Grakthar raises his blade and barks a rallying command...',
  'Vexara the Crimson':'Vexara draws blood from the air — dark energy coils around her hands...',
  'Nethrix, Devourer of Worlds':'Nethrix\'s void eye pulses — reality warps around you...',
  'Zareth the Sundered':'The air cracks as Zareth channels abyssal power...',
  'Valdris the Unbroken':'Valdris plants his feet — the mountain itself trembles...',
  'Auranthos, the Blind God':'Auranthos lifts its hands — divine light gathers overhead...',
  'Malvaris, The Hollow Empress':'Silence swallows the room — the Empress draws the shadows inward...',
  // Branch bosses
  'Ossarius, the Bone Sovereign':'Ossarius raises skeletal arms — the crypt hums with death energy...',
  'Mycelith, the Rot Mother':'Mycelith\'s cap flares — spores fill the air...',
  'The Gilded Sentinel':'The Sentinel\'s eyes blaze — ancient mechanisms grind to life...',
  'Cindrak, the Ashen Tyrant':'Cindrak inhales — the ground beneath you begins to glow...'
};

function getBossTelegraph(bossName, special){
  if(BOSS_TELEGRAPHS[bossName]) return BOSS_TELEGRAPHS[bossName];
  // Fallback: generic telegraph using special name
  if(special&&special.name) return bossName+' is preparing '+special.name+'...';
  return bossName+' is gathering power...';
}

function showTelegraphBanner(msg){
  // Create or reuse telegraph banner element
  let banner=document.getElementById('telegraphBanner');
  if(!banner){
    banner=document.createElement('div');
    banner.id='telegraphBanner';
    banner.className='telegraph-banner';
    const stage=document.querySelector('.battle-stage')||document.getElementById('battleStage');
    if(stage) stage.appendChild(banner);
    else document.body.appendChild(banner);
  }
  banner.textContent='⚠ '+msg;
  banner.classList.remove('active');
  void banner.offsetWidth; // force reflow
  banner.classList.add('active');
  setTimeout(()=>banner.classList.remove('active'), 3500);
}

// ══════════════════════════════════════════════════════════
//  ZONE CINEMATIC — Title card on zone entry
// ══════════════════════════════════════════════════════════
