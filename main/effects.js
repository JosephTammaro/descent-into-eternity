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

// ── Hit Stop System (StS-style context-sensitive freeze frames) ──
const _HIT_STOP_CLASSES=['hit-stop-light','hit-stop-heavy','hit-stop-crit','hit-stop-kill'];
function triggerHitStop(intensity){
  const stage=document.getElementById('battleStage');
  if(!stage) return;
  const cfg={light:{cls:'hit-stop-light',dur:90},heavy:{cls:'hit-stop-heavy',dur:150},crit:{cls:'hit-stop-crit',dur:180},kill:{cls:'hit-stop-kill',dur:220}};
  const c=cfg[intensity]||cfg.light;
  _HIT_STOP_CLASSES.forEach(cl=>stage.classList.remove(cl));
  void stage.offsetWidth;
  stage.classList.add(c.cls);
  setTimeout(()=>stage.classList.remove(c.cls), c.dur);
}
function triggerKillFreeze(){triggerHitStop('kill');}

function triggerPhase2Zoom(){
  const stage = document.getElementById('battleStage');
  if(!stage) return;
  stage.classList.remove('phase2-zoom');
  void stage.offsetWidth;
  stage.classList.add('phase2-zoom');
  setTimeout(()=> stage.classList.remove('phase2-zoom'), 1200);
}

function showTurnBanner(text, color, side){
  const stage=document.getElementById('battleStage');
  if(!stage) return;
  let banner=document.getElementById('turnBanner');
  if(!banner){
    banner=document.createElement('div');
    banner.id='turnBanner';
    stage.appendChild(banner);
  }
  banner.textContent=text;
  banner.style.color=color||'#fff';
  banner.classList.remove('active','active-player','active-enemy');
  void banner.offsetWidth;
  const cls=side==='enemy'?'active-enemy':side==='player'?'active-player':'active';
  banner.classList.add(cls);
}

function spawnGoldBurst(sourceEl){
  if(!sourceEl) return;
  const sr=sourceEl.getBoundingClientRect();
  const cx=Math.round(sr.left+sr.width/2);
  const cy=Math.round(sr.top+sr.height/2);
  const n=10+Math.floor(Math.random()*5);
  for(let i=0;i<n;i++){
    const coin=document.createElement('div');
    coin.textContent='🪙';
    coin.className='gold-sparkle-coin';
    coin.style.cssText='position:fixed;pointer-events:none;font-size:26px;z-index:99998;left:'+cx+'px;top:'+cy+'px;transform:translate(-50%,-50%);opacity:1;transition:none;';
    document.body.appendChild(coin);
    const ang=(Math.PI*2*i/n)+(Math.random()-0.5)*0.9;
    const dist=40+Math.random()*50;
    const dx=Math.round(Math.cos(ang)*dist);
    const dy=Math.round(Math.sin(ang)*dist-38);
    const delay=i*45;
    setTimeout(()=>{
      coin.style.transition='transform 0.6s ease-out, opacity 0.45s ease-out 0.18s';
      coin.style.transform='translate(calc(-50% + '+dx+'px), calc(-50% + '+dy+'px)) scale(0.3)';
      coin.style.opacity='0';
    }, delay+16);
    setTimeout(()=>{if(coin.parentNode)coin.parentNode.removeChild(coin);}, delay+800);
  }
}

// ── Condition Apply VFX ──
function conditionVFX(condName, side){
  const stage=document.getElementById('battleStage');
  if(!stage) return;
  const cfg={
    Burning:  {color:'#e67e22',color2:'#c0392b',char:'*',dy:-1,count:8},
    Poisoned: {color:'#27ae60',color2:'#1e8449',char:'o',dy:-0.8,count:6},
    Bleeding: {color:'#c0392b',color2:'#7b241c',char:'.',dy:0.8,count:6},
    Stunned:  {color:'#f1c40f',color2:'#f39c12',char:'*',dy:-0.5,count:5},
    Frightened:{color:'#2980b9',color2:'#1a5276',char:'~',dy:-0.6,count:5},
    Weakened: {color:'#7f8c8d',color2:'#566573',char:'-',dy:-0.4,count:4},
    Restrained:{color:'#8e44ad',color2:'#6c3483',char:'x',dy:0,count:5},
    Vulnerable:{color:'#e67e22',color2:'#d35400',char:'!',dy:-0.5,count:4},
  };
  const c=cfg[condName];
  if(!c) return;
  // Spawn particles around target (player sprite or enemy sprite)
  const target=side==='enemy'?document.getElementById('enemySprite'):document.getElementById('playerSprite');
  if(!target) return;
  const tr=target.getBoundingClientRect();
  const sr=stage.getBoundingClientRect();
  const cx=tr.left-sr.left+tr.width/2;
  const cy=tr.top-sr.top+tr.height/2;
  for(let i=0;i<c.count;i++){
    const p=document.createElement('div');
    const sz=4+Math.random()*6;
    const ox=(Math.random()-0.5)*tr.width*0.8;
    const oy=(Math.random()-0.5)*tr.height*0.5;
    p.style.cssText=`position:absolute;left:${cx+ox}px;top:${cy+oy}px;width:${sz}px;height:${sz}px;`
      +`background:${Math.random()>0.5?c.color:c.color2};border-radius:50%;pointer-events:none;z-index:15;`
      +`opacity:0.9;box-shadow:0 0 4px ${c.color};`
      +`transition:transform 0.6s ease-out,opacity 0.4s ease-out 0.2s;`;
    stage.appendChild(p);
    const dx=(Math.random()-0.5)*30;
    const dy=c.dy*30-Math.random()*25;
    setTimeout(()=>{
      p.style.transform=`translate(${dx}px,${dy}px) scale(0.3)`;
      p.style.opacity='0';
    },i*40+16);
    setTimeout(()=>{if(p.parentNode)p.parentNode.removeChild(p);},i*40+700);
  }
}

// ── Counter Tick-Up Animation ──
function animateCounter(el,from,to,duration){
  if(!el||from===to){if(el)el.textContent=to;return;}
  const start=performance.now();
  const diff=to-from;
  (function tick(now){
    const t=Math.min(1,(now-start)/duration);
    const ease=t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2; // easeInOutQuad
    el.textContent=Math.round(from+diff*ease);
    if(t<1) requestAnimationFrame(tick);
  })(start);
}

// ── Relic Pickup Fly Animation ──
function flyToRelicHud(sourceEl){
  const dest=document.getElementById('relicHud');
  if(!sourceEl||!dest) return;
  const sr=sourceEl.getBoundingClientRect();
  const dr=dest.getBoundingClientRect();
  const clone=document.createElement('div');
  clone.style.cssText=`position:fixed;z-index:99999;pointer-events:none;`
    +`left:${sr.left+sr.width/2}px;top:${sr.top+sr.height/2}px;`
    +`width:32px;height:32px;border-radius:50%;`
    +`background:var(--gold);box-shadow:0 0 16px var(--gold),0 0 32px rgba(200,168,75,0.5);`
    +`transform:translate(-50%,-50%) scale(1.2);opacity:1;`
    +`transition:all 0.55s cubic-bezier(0.22,1,0.36,1);`;
  document.body.appendChild(clone);
  requestAnimationFrame(()=>{
    clone.style.left=(dr.left+dr.width/2)+'px';
    clone.style.top=(dr.top+dr.height/2)+'px';
    clone.style.transform='translate(-50%,-50%) scale(0.4)';
    clone.style.opacity='0.6';
  });
  setTimeout(()=>{
    if(clone.parentNode)clone.parentNode.removeChild(clone);
    // Bounce the relic HUD
    if(dest){dest.style.transition='transform 0.15s';dest.style.transform='scale(1.15)';
      setTimeout(()=>{dest.style.transform='';setTimeout(()=>dest.style.transition='',150);},150);}
  },580);
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
