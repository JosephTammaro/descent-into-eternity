// ================================================================
// main.js — Game State, Core Logic, Game Flow
// Initializes G, handles screens, class select, zone flow,
// HUD rendering, companions, enemy spawning
// Descent into Eternity
// ================================================================

// ══════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════
var G = null;
let paused = false;
let enemyTurnTimeout = null;
let selectedItemIdx = null;
let pendingClass = null;
let cfCurrentTab = 'rest';
let cfCurrentEvent = null;

function md(s){return Math.floor((s-10)/2);}
function profFor(lvl){return lvl<5?2:lvl<9?3:lvl<13?4:lvl<17?5:6;}
function xpFor(lvl){return Math.floor(60*Math.pow(1.55,lvl-1));}
function roll(d){return Math.floor(Math.random()*d)+1;}

function newState(classId){
  const cls = CLASSES[classId];
  const st = cls.baseStats;
  const conMod = md(st.con);
  const maxHp = cls.baseHp + conMod;
  return {
    classId,
    dungeonGoal: 4,
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
    equipped:{weapon:null,armor:null,ring:null,offhand:null,helmet:null,boots:null,amulet:null,gloves:null},
    gold:0, totalGold:0, totalKills:0, totalItems:0, totalCrafts:0, totalCrits:0, totalObjectives:0, mirrorImages:0, playTime:0,
    _closeCallFlag:false, _ironmanFlag:true, _noRestStreak:0,
    upgrades:UPGRADES_DATA.map(u=>({...u,bought:false})),
    talents:[],
    talentsOffered:[],
    subclassUnlocked:false,
    ultimateUnlocked:false,
    capstoneUnlocked:false,
    layOnHandsPool:5,
    zoneIdx:0, zoneKills:0, bossReady:false,
    bossDefeated:[false,false,false,false,false,false,false,false],
    runBossDefeated:[false,false,false,false,false,false,false,false],
    branchDefeated:{catacombs:false,fungalwarren:false,sunkenvault:false,ashenwastes:false},
    branchPassives:[],
    dungeonFights:0, campUnlocked:false,
    lives: 3,
    // Turn state
    isPlayerTurn:true, actionUsed:false, bonusUsed:false, reactionUsed:false,
    skillCooldowns:{},
    // Status
    conditions:[],
    conditionTurns:{},
    sx:{},
    raging:false, rageTurns:0, hunterMarked:false, concentrating:null, wildShapeHp:0, wildShapeActive:false,
    spiritualWeaponActive:false, spiritualWeaponTurns:0,
    firstAttackUsed:false,
    currentEnemy:null,
    currentEnemies:[],
    targetIdx:0,
    roundNum:0,
    skillCharges: Object.fromEntries(CLASSES[classId].skills.filter(sk=>sk.charges).map(sk=>[sk.id,sk.charges])),
  };
}

// ══════════════════════════════════════════════════════════
//  TITLE
// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════
//  TITLE — Cinematic canvas background + press-any-key ritual
// ══════════════════════════════════════════════════════════

const _title = (function(){
  let canvas, ctx, w, h, raf;
  let stars=[], embers=[], whisperLines=[];
  let awakened = false;
  let gateGlow = 0;
  let time = 0;

  // ── Stars ──
  function initStars(){
    stars=[];
    for(let i=0;i<160;i++){
      stars.push({
        x:Math.random()*w, y:Math.random()*h,
        r:Math.random()<0.12 ? 1.5 : (Math.random()<0.3 ? 0.8 : 0.4),
        speed:0.3+Math.random()*0.7,
        phase:Math.random()*Math.PI*2,
        bright:0.15+Math.random()*0.5
      });
    }
  }

  function drawStars(){
    for(const s of stars){
      const flicker = s.bright + Math.sin(time*s.speed + s.phase)*0.35;
      ctx.globalAlpha = Math.max(0.05, Math.min(1, flicker));
      ctx.fillStyle = '#c8a84b';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // ── Embers (float upward) ──
  function initEmbers(){
    embers=[];
    for(let i=0;i<40;i++){
      embers.push(newEmber(true));
    }
  }
  function newEmber(scatter){
    return {
      x: w*0.3 + Math.random()*w*0.4,
      y: scatter ? Math.random()*h : h+10,
      vx: (Math.random()-0.5)*0.15,
      vy: -(0.2+Math.random()*0.5),
      r: 0.4+Math.random()*1.2,
      life: 0.5+Math.random()*0.5,
      maxLife: 0.5+Math.random()*0.5,
      color: Math.random()<0.6 ? '#c8a84b' : '#c06030'
    };
  }
  function drawEmbers(dt){
    for(let i=0;i<embers.length;i++){
      const e=embers[i];
      e.x += e.vx + Math.sin(time*2+i)*0.1;
      e.y += e.vy;
      e.life -= dt*0.3;
      if(e.life<=0 || e.y<-20){
        embers[i]=newEmber(false);
        continue;
      }
      const alpha = (e.life/e.maxLife)*0.7;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = e.color;
      // Soft glow
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.shadowBlur=0;
  }

  // ── Distant mountain silhouette ──
  function drawMountains(){
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#08050e';
    const baseY = h * 0.7;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    // Left range
    ctx.lineTo(w*0.05, baseY - h*0.08);
    ctx.lineTo(w*0.12, baseY - h*0.18);
    ctx.lineTo(w*0.2, baseY - h*0.12);
    ctx.lineTo(w*0.28, baseY - h*0.22);
    ctx.lineTo(w*0.35, baseY - h*0.15);
    // Center peak (behind gate)
    ctx.lineTo(w*0.42, baseY - h*0.2);
    ctx.lineTo(w*0.5, baseY - h*0.28);
    ctx.lineTo(w*0.58, baseY - h*0.2);
    // Right range
    ctx.lineTo(w*0.65, baseY - h*0.15);
    ctx.lineTo(w*0.72, baseY - h*0.22);
    ctx.lineTo(w*0.8, baseY - h*0.12);
    ctx.lineTo(w*0.88, baseY - h*0.18);
    ctx.lineTo(w*0.95, baseY - h*0.08);
    ctx.lineTo(w, baseY);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Lighter ridge in front
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#0c0812';
    ctx.beginPath();
    ctx.moveTo(0, baseY + h*0.05);
    ctx.lineTo(w*0.1, baseY - h*0.04);
    ctx.lineTo(w*0.22, baseY + h*0.02);
    ctx.lineTo(w*0.35, baseY - h*0.06);
    ctx.lineTo(w*0.45, baseY);
    ctx.lineTo(w*0.55, baseY);
    ctx.lineTo(w*0.65, baseY - h*0.06);
    ctx.lineTo(w*0.78, baseY + h*0.02);
    ctx.lineTo(w*0.9, baseY - h*0.04);
    ctx.lineTo(w, baseY + h*0.05);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  }

  // ── Gate silhouette ──
  function drawGate(){
    const gx = w/2;
    const gy = h*0.62;
    const scale = Math.min(w,h) / 800;
    const pw = 18*scale;  // pillar width
    const gap = 50*scale; // gap between pillars
    const ph = 130*scale; // pillar height
    const archH = 30*scale;

    // Glow from within the archway
    const glowPulse = 0.25 + Math.sin(time*1.2)*0.12;
    const glowR = gap*1.8;
    const grad = ctx.createRadialGradient(gx, gy-ph*0.15, 0, gx, gy-ph*0.15, glowR);
    grad.addColorStop(0, `rgba(139,26,26,${glowPulse*0.5})`);
    grad.addColorStop(0.3, `rgba(200,96,30,${glowPulse*0.15})`);
    grad.addColorStop(0.6, `rgba(200,168,75,${glowPulse*0.04})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(gx-glowR, gy-ph-glowR, glowR*2, glowR*2);

    // Draw the solid gate shape as one path
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#06030a';

    // Left pillar
    const lx = gx - gap/2 - pw;
    const rx = gx + gap/2;
    ctx.fillRect(lx, gy-ph, pw, ph);
    ctx.fillRect(rx, gy-ph, pw, ph);

    // Crossbar at top
    ctx.fillRect(lx-pw*0.3, gy-ph-archH*0.4, (rx+pw) - (lx-pw*0.3) + pw*0.3, archH*0.6);
    // Capstone
    ctx.fillRect(lx-pw*0.15, gy-ph-archH*0.4-archH*0.25, (rx+pw)-(lx-pw*0.15)+pw*0.15, archH*0.25);

    // Arch (semicircle) carved into the crossbar — draw with dark fill from inside
    // Actually, just draw the archway opening as a subtle glow shape
    ctx.globalAlpha = 0.08 + Math.sin(time*1.0)*0.04;
    ctx.fillStyle = '#8b1a1a';
    ctx.beginPath();
    ctx.ellipse(gx, gy-ph+archH*0.3, gap/2-2*scale, archH*1.2, 0, Math.PI, 0);
    ctx.lineTo(gx+gap/2-2*scale, gy);
    ctx.lineTo(gx-gap/2+2*scale, gy);
    ctx.closePath();
    ctx.fill();

    // Small highlights on pillar edges
    ctx.globalAlpha = 0.04 + Math.sin(time*0.7)*0.02;
    ctx.fillStyle = '#c8a84b';
    ctx.fillRect(lx+pw-1*scale, gy-ph+10*scale, 1*scale, ph-20*scale);
    ctx.fillRect(rx, gy-ph+10*scale, 1*scale, ph-20*scale);

    // Ground shadow beneath gate
    ctx.globalAlpha = 0.3;
    const groundGrad = ctx.createRadialGradient(gx, gy+5*scale, 0, gx, gy+5*scale, gap*1.5);
    groundGrad.addColorStop(0, 'rgba(4,2,10,0.8)');
    groundGrad.addColorStop(1, 'rgba(4,2,10,0)');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(gx-gap*1.5, gy, gap*3, gap*0.8);
  }

  // ── Lore whispers (faint scrolling text in background) ──
  const WHISPER_TEXTS = [
    'the seal holds', 'remember your name', 'the gate waits',
    'three hundred years', 'the unnamed calls', 'return to the deep',
    'elderfen remembers', 'the descent is a homecoming',
    'the lock is a name', 'the dark is patient',
    'they stayed because you asked', 'the shrine burns without oil',
    'finish it', 'the unnamed loved you'
  ];
  function initWhispers(){
    whisperLines=[];
    for(let i=0;i<8;i++){
      whisperLines.push({
        text: WHISPER_TEXTS[Math.floor(Math.random()*WHISPER_TEXTS.length)],
        x: Math.random()*w,
        y: Math.random()*h,
        vy: -(0.08+Math.random()*0.12),
        alpha: 0.01+Math.random()*0.025,
        size: 8+Math.random()*6
      });
    }
  }
  function drawWhispers(dt){
    ctx.textAlign='center';
    for(const wh of whisperLines){
      wh.y += wh.vy;
      if(wh.y < -30){
        wh.y = h+30;
        wh.x = Math.random()*w;
        wh.text = WHISPER_TEXTS[Math.floor(Math.random()*WHISPER_TEXTS.length)];
      }
      ctx.globalAlpha = wh.alpha;
      ctx.fillStyle = '#c8a84b';
      ctx.font = `${wh.size}px "Press Start 2P", monospace`;
      ctx.fillText(wh.text, wh.x, wh.y);
    }
  }

  // ── Ground fog at bottom ──
  function drawGroundFog(){
    const fogH = h*0.2;
    const grad = ctx.createLinearGradient(0, h-fogH, 0, h);
    grad.addColorStop(0, 'rgba(4,2,10,0)');
    grad.addColorStop(0.5, `rgba(20,14,10,${0.15+Math.sin(time*0.5)*0.05})`);
    grad.addColorStop(1, `rgba(30,20,14,${0.25+Math.sin(time*0.7)*0.08})`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(0, h-fogH, w, fogH);
  }

  // ── Main render loop ──
  let lastTime = 0;
  function render(ts){
    const dt = Math.min((ts-lastTime)/1000, 0.05);
    lastTime = ts;
    time = ts/1000;

    ctx.clearRect(0,0,w,h);

    // Background gradient
    const bg = ctx.createRadialGradient(w/2, h*0.4, 0, w/2, h*0.5, Math.max(w,h)*0.8);
    bg.addColorStop(0, '#1a100a');
    bg.addColorStop(0.5, '#0a0608');
    bg.addColorStop(1, '#04020a');
    ctx.globalAlpha=1;
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,w,h);

    drawStars();
    drawWhispers(dt);
    drawMountains();
    drawGate();
    drawEmbers(dt);
    drawGroundFog();

    ctx.globalAlpha=1;
    raf = requestAnimationFrame(render);
  }

  // ── Resize ──
  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    w = canvas.width;
    h = canvas.height;
    initStars();
    initWhispers();
  }

  // ── Init ──
  function init(){
    canvas = document.getElementById('titleCanvas');
    if(!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    initEmbers();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(render);

    // Press-any-key ritual
    function onFirstKey(e){
      if(awakened) return;
      // Ignore if it's a modifier key alone
      if(['Shift','Control','Alt','Meta','Tab'].includes(e.key)) return;
      awakened = true;
      document.removeEventListener('keydown', onFirstKey);
      document.removeEventListener('click', onFirstClick);
      revealMenu();
    }
    function onFirstClick(e){
      if(awakened) return;
      // Only trigger on the title screen
      if(!document.getElementById('screen-title')?.classList.contains('active')) return;
      awakened = true;
      document.removeEventListener('keydown', onFirstKey);
      document.removeEventListener('click', onFirstClick);
      revealMenu();
    }
    document.addEventListener('keydown', onFirstKey);
    document.addEventListener('click', onFirstClick);
  }

  function revealMenu(){
    // Start audio on first interaction
    if(typeof AUDIO!=='undefined') { AUDIO.init(); AUDIO.playBGM('title'); }

    const screen = document.getElementById('screen-title');
    const prompt = document.getElementById('titlePrompt');
    const menu   = document.getElementById('titleMenu');

    if(screen) screen.classList.add('awakened');
    if(prompt) prompt.classList.add('hidden');
    setTimeout(()=>{
      if(menu) menu.classList.add('revealed');
    }, 300);
  }

  function stop(){
    if(raf) cancelAnimationFrame(raf);
  }

  // Reset when returning to title
  function reset(){
    awakened = false;
    const screen = document.getElementById('screen-title');
    const prompt = document.getElementById('titlePrompt');
    const menu   = document.getElementById('titleMenu');
    if(screen) screen.classList.remove('awakened');
    if(prompt) prompt.classList.remove('hidden');
    if(menu) menu.classList.remove('revealed');
    // Re-listen
    function onKey(e){
      if(awakened) return;
      if(['Shift','Control','Alt','Meta','Tab'].includes(e.key)) return;
      awakened=true;
      document.removeEventListener('keydown',onKey);
      document.removeEventListener('click',onClick);
      revealMenu();
    }
    function onClick(){
      if(awakened) return;
      if(!document.getElementById('screen-title')?.classList.contains('active')) return;
      awakened=true;
      document.removeEventListener('keydown',onKey);
      document.removeEventListener('click',onClick);
      revealMenu();
    }
    document.addEventListener('keydown',onKey);
    document.addEventListener('click',onClick);
    if(!raf) raf=requestAnimationFrame(render);
  }

  return { init, stop, reset, revealMenu };
})();

// Init on load
_title.init();

// Reset title state when returning to title screen (e.g. quit to title)
(function(){
  const el = document.getElementById('screen-title');
  if(!el) return;
  let wasActive = el.classList.contains('active');
  const obs = new MutationObserver(()=>{
    const isActive = el.classList.contains('active');
    // Only reset on transition from inactive → active (returning to title)
    if(isActive && !wasActive){
      _title.reset();
    }
    wasActive = isActive;
  });
  obs.observe(el, {attributes:true, attributeFilter:['class']});
})();

function beginDescent(){ showScreen('saveSlots'); }

// ══════════════════════════════════════════════════════════
//  WORLD MAP — Canvas atmosphere
// ══════════════════════════════════════════════════════════
const _mapBg = (function(){
  let canvas, ctx, w, h, raf;
  let stars=[], embers=[];
  let time=0, active=false;

  // Zone glow colors (positioned to match MAP_NODES x coords roughly)
  const ZONE_GLOWS = [
    {xPct:0.10, yPct:0.58, color:[45,107,58],  r:80},  // woods - green
    {xPct:0.27, yPct:0.42, color:[138,90,42],   r:70},  // outpost - brown
    {xPct:0.44, yPct:0.61, color:[139,26,26],   r:80},  // castle - red
    {xPct:0.59, yPct:0.39, color:[80,40,120],   r:70},  // underdark - purple
    {xPct:0.72, yPct:0.66, color:[130,40,25],   r:80},  // abyss - dark red
    {xPct:0.83, yPct:0.37, color:[80,130,180],  r:70},  // frostpeak - ice blue
    {xPct:0.91, yPct:0.74, color:[200,180,100], r:65},  // celestial - gold
    {xPct:0.95, yPct:0.45, color:[80,20,100],   r:70},  // shadowrealm - dark purple
  ];

  function initStars(){
    stars=[];
    for(let i=0;i<90;i++){
      stars.push({
        x:Math.random()*w, y:Math.random()*h,
        r:Math.random()<0.1?1.2:0.5,
        phase:Math.random()*Math.PI*2,
        speed:0.3+Math.random()*0.6,
        bright:0.1+Math.random()*0.3
      });
    }
  }

  function initEmbers(){
    embers=[];
    for(let i=0;i<20;i++){
      embers.push({
        x:Math.random()*w, y:Math.random()*h,
        vx:(Math.random()-0.5)*0.1,
        vy:-(0.05+Math.random()*0.2),
        r:0.3+Math.random()*0.8,
        life:Math.random(),
        maxLife:0.5+Math.random()*0.5,
        color:Math.random()<0.5?'#c8a84b':'#8b3a1a'
      });
    }
  }

  function render(ts){
    if(!active) return;
    time=ts/1000;
    ctx.clearRect(0,0,w,h);

    // Background gradient — warm left fading to cold void right
    const bg = ctx.createLinearGradient(0,0,w,0);
    bg.addColorStop(0, '#15100a');
    bg.addColorStop(0.3, '#0e0a0c');
    bg.addColorStop(0.6, '#0a0814');
    bg.addColorStop(1, '#06040e');
    ctx.globalAlpha=1;
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,w,h);

    // Vertical gradient — darker at edges
    const vg = ctx.createLinearGradient(0,0,0,h);
    vg.addColorStop(0, 'rgba(0,0,0,0.3)');
    vg.addColorStop(0.4, 'rgba(0,0,0,0)');
    vg.addColorStop(0.6, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle=vg;
    ctx.fillRect(0,0,w,h);

    // Stars
    for(const s of stars){
      const flicker = s.bright + Math.sin(time*s.speed+s.phase)*0.2;
      ctx.globalAlpha = Math.max(0.03, flicker);
      ctx.fillStyle = '#c8a84b';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }

    // Zone ambient glows
    for(const zg of ZONE_GLOWS){
      const pulse = 0.6 + Math.sin(time*0.8 + zg.xPct*10)*0.4;
      const cx = zg.xPct*w, cy = zg.yPct*h;
      const r = zg.r * (Math.min(w,h)/600);
      const grad = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
      const [cr,cg,cb] = zg.color;
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},${0.14*pulse})`);
      grad.addColorStop(0.4, `rgba(${cr},${cg},${cb},${0.06*pulse})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = grad;
      ctx.fillRect(cx-r, cy-r, r*2, r*2);
    }

    // Embers
    for(let i=0;i<embers.length;i++){
      const e=embers[i];
      e.x += e.vx + Math.sin(time*1.5+i)*0.05;
      e.y += e.vy;
      e.life -= 0.002;
      if(e.life<=0 || e.y<-10){
        e.x=Math.random()*w;e.y=h+10;
        e.life=0.5+Math.random()*0.5;e.maxLife=e.life;
      }
      ctx.globalAlpha = (e.life/e.maxLife)*0.4;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x,e.y,e.r,0,Math.PI*2);
      ctx.fill();
    }

    // Bottom fog
    const fogH = h*0.15;
    const fogGrad = ctx.createLinearGradient(0,h-fogH,0,h);
    fogGrad.addColorStop(0, 'rgba(4,2,10,0)');
    fogGrad.addColorStop(1, `rgba(10,6,4,${0.2+Math.sin(time*0.4)*0.05})`);
    ctx.globalAlpha=1;
    ctx.fillStyle=fogGrad;
    ctx.fillRect(0,h-fogH,w,fogH);

    // Top fog
    const topFog = ctx.createLinearGradient(0,0,0,h*0.12);
    topFog.addColorStop(0, `rgba(10,6,4,${0.15+Math.sin(time*0.5)*0.04})`);
    topFog.addColorStop(1, 'rgba(4,2,10,0)');
    ctx.fillStyle=topFog;
    ctx.fillRect(0,0,w,h*0.12);

    ctx.globalAlpha=1;
    raf=requestAnimationFrame(render);
  }

  function resize(){
    if(!canvas) return;
    const parent = document.getElementById('screen-map');
    if(!parent) return;
    const pw = parent.offsetWidth || window.innerWidth;
    const ph = parent.offsetHeight || window.innerHeight;
    canvas.width = pw;
    canvas.height = ph;
    w = pw; h = ph;
    initStars();
  }

  function start(){
    canvas=document.getElementById('mapCanvas');
    if(!canvas) return;
    ctx=canvas.getContext('2d');
    active=true;
    // Wait one frame for display:flex to reflow so offsetWidth/Height are valid
    requestAnimationFrame(()=>{
      resize();
      initEmbers();
      raf=requestAnimationFrame(render);
    });
  }

  function stop(){
    active=false;
    if(raf) cancelAnimationFrame(raf);
  }

  // Auto-start/stop when map screen is shown/hidden
  let _mapObsActive = false;
  const el=document.getElementById('screen-map');
  if(el){
    const obs=new MutationObserver(()=>{
      const isActive=el.classList.contains('active');
      if(isActive && !_mapObsActive){ _mapObsActive=true; start(); }
      else if(!isActive && _mapObsActive){ _mapObsActive=false; stop(); }
    });
    obs.observe(el,{attributes:true,attributeFilter:['class']});
  }
  window.addEventListener('resize',()=>{ if(active) resize(); });

  return {start,stop};
})();


// ══════════════════════════════════════════════════════════
//  CLASS SELECT
// ══════════════════════════════════════════════════════════
function renderClassSelect(){
  const grid=document.getElementById('classGrid');

  // Load graces for the active slot so we can show equipped graces per class
  const slotGraces = (typeof getSlotGraces==='function'&&typeof activeSaveSlot!=='undefined'&&activeSaveSlot)
    ? getSlotGraces(activeSaveSlot) : null;
  const rc = (typeof GRACE_RARITY_COLORS!=='undefined') ? GRACE_RARITY_COLORS : {};

  grid.innerHTML=Object.entries(CLASSES).map(([id,cls])=>{
    // Find equipped graces for this class
    let graceHtml = '';
    if(slotGraces&&typeof CLASS_GRACE_SLOTS!=='undefined'&&CLASS_GRACE_SLOTS[id]){
      const equipped = CLASS_GRACE_SLOTS[id]
        .map((_,i)=>slotGraces.equipped[id+'_'+i]||null)
        .filter(Boolean);
      if(equipped.length){
        const pips = equipped.map(g=>{
          const col = rc[g.rarity]||'#888';
          const stats = Object.entries(g.stats).map(([k,v])=>'+'+v+' '+k.toUpperCase()).join(' · ');
          return `<span title="${g.name} · ${stats}" style="font-size:14px;filter:drop-shadow(0 0 4px ${col});cursor:default;">${g.icon}</span>`;
        }).join('');
        graceHtml = `<div style="display:flex;align-items:center;gap:4px;margin-top:6px;padding:4px 6px;background:rgba(200,168,75,0.06);border:1px solid rgba(200,168,75,0.2);">
          <span style="font-family:'Press Start 2P',monospace;font-size:5px;color:var(--gold-dim);margin-right:2px;">GRACES</span>
          ${pips}
        </div>`;
      }
    }

    return `
    <div class="class-card px-border" onclick="selectClass('${id}')">
      <div class="class-sprite-wrap" id="cs-sprite-${id}"></div>
      <div class="class-name">${cls.name}</div>
      <div class="class-res" style="color:${cls.resColor}">◈ ${cls.res}</div>
      <div class="class-desc">${cls.desc}</div>
      <div class="class-stat-row">
        ${Object.entries(cls.baseStats).map(([k,v])=>`<div class="cs-pip">${k.toUpperCase()} <span>${v}</span></div>`).join('')}
      </div>
      ${graceHtml}
    </div>`;
  }).join('');

  // Render small sprites
  Object.keys(CLASSES).forEach(id=>{
    const el=document.getElementById('cs-sprite-'+id);
    if(el){
      if(window.hasImageSprite && window.hasImageSprite(id)){
        window.renderImageSpriteStatic(id, el, 100);
      } else if(CLASS_SPRITES[id]){
        renderSprite(CLASS_SPRITES[id],5,el);
      }
    }
  });
}

function selectClass(id){
  pendingClass=id;
  const cls=CLASSES[id];
  const fromPrepare = window._returnToPrepareAfterClass;
  document.getElementById('confirmMsg').innerHTML=fromPrepare
    ? `Descend as the <strong style="color:var(--gold)">${cls.name}</strong>?`
    : `You have chosen the <strong style="color:var(--gold)">${cls.name}</strong>.<br>This path cannot be changed.<br>Are you ready to begin your descent?`;
  openOverlay('confirmOverlay');
}

function doConfirmClass(){
  closeOverlay('confirmOverlay');
  G=newState(pendingClass);
  // Seed bossDefeated from slot persistent data so _firstClear detection works
  // runBossDefeated stays all-false — player must earn map progress each run
  if(typeof activeSaveSlot!=='undefined'&&activeSaveSlot&&typeof loadSlotData==='function'){
    const slotData=loadSlotData(activeSaveSlot);
    if(slotData&&slotData.bossDefeated){
      G.bossDefeated=slotData.bossDefeated.map(v=>!!v);
    }
  }
  // Always start at zone 0 — player clears the full map every run
  const starters={fighter:'sword',wizard:'staff',rogue:'dagger',paladin:'sword',ranger:'bow',barbarian:'sword',cleric:'staff',druid:'staff'};
  const starterItem={...ITEMS.find(i=>i.id===starters[pendingClass])};
  G.equipped.weapon=starterItem;
  applyItemStats(starterItem);
  addItem({...ITEMS.find(i=>i.id==='hpPotion'),qty:2});
  // Seed achievement cache from slot so we don't re-toast already-unlocked achievements
  G.unlockedAchievements = typeof getSlotAchievements==='function' ? getSlotAchievements() : [];
  // Apply grace buffs from equipped graces for this class
  if(typeof applyGraceBuffs==='function') applyGraceBuffs(pendingClass);
  // Apply permanent upgrades from Vareth's Proving Grounds
  if(typeof applyPermanentUpgrades==='function') applyPermanentUpgrades(pendingClass);
  G._townBuffs = []; // No town buffs when entering via class gate
  // Add any gold earned from selling graces between runs
  if(typeof consumePendingGraceGold==='function'){
    const graceGold = consumePendingGraceGold();
    if(graceGold > 0){ G.gold += graceGold; log('✨ Grace gold: +'+graceGold+'🪙 carried into this run.','l'); }
  }
  autoSave();
  // If triggered from prepare screen, go back there instead of straight into dungeon
  if(window._returnToPrepareAfterClass){
    window._returnToPrepareAfterClass = false;
    if(typeof openPrepareScreen==='function') openPrepareScreen();
    return;
  }
  // Class picked at gate — enter dungeon immediately
  G.zoneIdx = 0;
  if(typeof townEnterDungeon==='function') townEnterDungeon();
  else if(typeof travelToZone==='function') travelToZone(0);
}

// ══════════════════════════════════════════════════════════
//  PERMANENT UPGRADES APPLICATION
// ══════════════════════════════════════════════════════════

function applyPermanentUpgrades(classId){
  if(!G || typeof getPermanentUpgrades!=='function') return;
  const ups = getPermanentUpgrades();
  if(!ups || Object.keys(ups).length===0) return;

  const applied = [];

  // Universal upgrades
  if(ups.hp_bonus){
    const v = ups.hp_bonus * 5;
    G.maxHp += v; G.hp += v;
    applied.push('+'+v+' HP');
  }
  if(ups.gold_bonus){
    const v = ups.gold_bonus * 10;
    G.gold += v;
    applied.push('+'+v+' gold');
  }
  if(ups.atk_bonus){
    const v = ups.atk_bonus * 2;
    G.atk += v;
    applied.push('+'+v+' ATK');
  }
  if(ups.def_bonus){
    const v = ups.def_bonus * 2;
    G.def += v;
    applied.push('+'+v+' DEF');
  }
  if(ups.potion_bonus){
    for(let i=0;i<ups.potion_bonus;i++){
      if(typeof ITEMS!=='undefined' && typeof addItem==='function'){
        addItem({...ITEMS.find(it=>it.id==='hpPotion'),qty:1});
      }
    }
    applied.push('+'+ups.potion_bonus+' potions');
  }
  if(ups.campfire_heal){
    G._campfireHealBonus = ups.campfire_heal * 0.10;
    applied.push('+'+(ups.campfire_heal*10)+'% campfire heal');
  }
  if(ups.shop_discount){
    G._shopDiscount = ups.shop_discount * 0.05;
    applied.push((ups.shop_discount*5)+'% shop discount');
  }
  if(ups.xp_bonus){
    G.xpMult = (G.xpMult||1) + ups.xp_bonus * 0.05;
    applied.push('+'+(ups.xp_bonus*5)+'% XP');
  }
  if(ups.crit_bonus){
    G.critBonus = (G.critBonus||0) + ups.crit_bonus;
    applied.push('+'+ups.crit_bonus+' crit');
  }
  // grace_luck is checked at generation time in generateGrace()

  // Class mastery upgrades — only apply if matching class
  const masteryId = classId + '_mastery';
  if(ups[masteryId]){
    if(classId==='fighter')  { G.atk+=3; G.maxHp+=10; G.hp+=10; applied.push('Fighter Mastery'); }
    if(classId==='wizard')   { G.magBonus=(G.magBonus||0)+5; if(G.spellSlots&&G.spellSlots[1]!==undefined) G.spellSlots[1]++; applied.push('Wizard Mastery'); }
    if(classId==='rogue')    { G.atk+=3; G.critBonus=(G.critBonus||0)+2; applied.push('Rogue Mastery'); }
    if(classId==='paladin')  { G.atk+=2; G.def+=2; G.maxHp+=10; G.hp+=10; applied.push('Paladin Mastery'); }
    if(classId==='ranger')   { G.atk+=3; G.critBonus=(G.critBonus||0)+1; G.maxHp+=5; G.hp+=5; applied.push('Ranger Mastery'); }
    if(classId==='barbarian'){ G.atk+=4; G.maxHp+=15; G.hp+=15; applied.push('Barbarian Mastery'); }
    if(classId==='cleric')   { G.magBonus=(G.magBonus||0)+4; G.maxHp+=15; G.hp+=15; applied.push('Cleric Mastery'); }
    if(classId==='druid')    { G.magBonus=(G.magBonus||0)+3; G.def+=2; G.maxHp+=10; G.hp+=10; applied.push('Druid Mastery'); }
  }

  if(applied.length > 0 && typeof log==='function'){
    log('🏛 Proving Grounds: '+applied.join(', '),'l');
  }
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
  autoSave();
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

function enterZone(){
  // If we're entering a branch, use branch flow instead
  if(G._inBranch && _currentBranch){
    enterBranch();
    return;
  }
  startPlayTimer();
  showScreen('game');
  setupGameUI();
  initObjective(G.zoneIdx);
  renderObjectiveStatus();
  spawnEnemy();
  renderInlineCharSheet();
  renderCompanions();
  autoSave();
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

  // Spell slots panel
  document.getElementById('spellSlotSection').style.display=G.classId==='wizard'?'block':'none';

  renderAll();
  // Only update button states — spawnEnemy() handles setPlayerTurn
  renderSkillButtons();
  // Update char sheet if drawer is open
  const _drawer=document.getElementById('charDrawer');
  if(_drawer&&_drawer.classList.contains('open'))renderInlineCharSheet();
  updateCampBtn();
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
  // Update char sheet if drawer is open
  const _drawer=document.getElementById('charDrawer');
  if(_drawer&&_drawer.classList.contains('open')) renderInlineCharSheet();
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

  // ── Spell slots (wizard) ──
  if(G.classId==='wizard'&&G.spellSlots){
    const slotStr=Object.entries(G.spellSlots).filter(([,v])=>v>0).map(([k,v])=>`L${k}:${v}`).join(' ');
    if(slotStr) badges.push(badge('📖',slotStr,'sb-blue'));
  }

  // ── Conditions (debuffs) ──
  if(G.conditions&&G.conditions.length){
    G.conditions.forEach(c=>{
      const icons={Poisoned:'☠',Burning:'🔥',Stunned:'💫',Frightened:'😨',Restrained:'🔒'};
      const turns=G.conditionTurns&&G.conditionTurns[c]?G.conditionTurns[c]+'t':'';
      badges.push(badge(icons[c]||'⚠',c+(turns?' '+turns:''),'sb-debuff'));
    });
  }

  // ── Graces equipped ──
  if(typeof getEquippedGraces==='function'){
    const graces=getEquippedGraces(G.classId).filter(Boolean);
    if(graces.length) badges.push(badge('✨',graces.length+' GRACE'+(graces.length>1?'S':''),'sb-gold'));
  }

  // ── Skill charges ──
  const cls=CLASSES[G.classId];
  if(cls) cls.skills.filter(sk=>sk.charges).forEach(sk=>{
    const left=G.skillCharges&&G.skillCharges[sk.id]||0;
    if(left>0) badges.push(badge(sk.icon,sk.name.split(' ')[0]+' '+left+'/'+sk.charges,'sb-neutral'));
  });

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
      return `<button class="skill-btn type-${type}${isNew?' sk-new':''}" ${disabled?'disabled':''} onclick="if(G._newSkills){G._newSkills=G._newSkills.filter(x=>x!=='${sk.id}');this.classList.remove('sk-new');}useSkill('${sk.id}')" title="${sk.name}: ${sk.desc}">
        ${cdBadge}
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
    const statsStr=Object.entries(g.stats).map(([k,v])=>'+'+v+' '+k.toUpperCase()).join(' · ');
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
  if(G._branchBattleHardened)          add('⚔','BATTLE HARDENED','ATK bonus from branch reward.','buff');
  if(G._branchDeathDefiant)            add('💀','DEATH DEFIANT',  'Survive one killing blow at 1 HP.','buff');
  if(G._branchRelentlessHeal)          add('💚','RELENTLESS HEAL','Regenerate HP each turn.','buff');
  if(G._branchSixthSense)              add('👁','SIXTH SENSE',    'Boss damage reduced by 20%.','buff');

  // ── Spell slots (wizard) ─────────────────────────────────
  if(G.classId==='wizard'&&G.spellSlots){
    Object.entries(G.spellSlots).forEach(([lvl,cnt])=>{
      if(cnt>0) add('📖','LVL '+lvl+' SLOTS',cnt+' spell slot'+(cnt>1?'s':'')+' remaining.','blue');
    });
  }

  // ── Skill charges ─────────────────────────────────────────
  const cls=CLASSES[G.classId];
  if(cls) cls.skills.filter(sk=>sk.charges).forEach(sk=>{
    const left=G.skillCharges&&G.skillCharges[sk.id]||0;
    if(left>0) add(sk.icon, sk.name.toUpperCase(), left+'/'+sk.charges+' charges remaining.','neutral');
  });

  // ── Graces ───────────────────────────────────────────────
  if(typeof getEquippedGraces==='function'){
    getEquippedGraces(G.classId).filter(Boolean).forEach(g=>{
      const stats=Object.entries(g.stats).map(([k,v])=>'+'+v+' '+k.toUpperCase()).join(', ');
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
        add(u.icon, u.name.toUpperCase(), u.desc+' ['+pips+']','neutral');
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
    // Re-enable enemy targeting on player turn
    const mr=document.getElementById('multiEnemyRow');
    if(mr) mr.style.pointerEvents='';
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
    // Disable enemy targeting during enemy turn
    const mr=document.getElementById('multiEnemyRow');
    if(mr) mr.style.pointerEvents='none';
    // Block enemy turn during boss victory/level-up/grace sequence
    if(G._bossSequenceActive) return;
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
  if(pSpr){
    if(window.hasImageSprite && window.hasImageSprite(G.classId)){
      window.renderImageSprite(G.classId, 'idle', 0, pSpr, 260);
    } else if(CLASS_SPRITES[G.classId]){
      renderSprite(CLASS_SPRITES[G.classId],10,pSpr);
    }
  }
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
  const effectiveLvl = Math.max(1, Math.round((lvlScale-1)/0.06)+1);
  G.currentEnemy = {
    ...eData, isBoss,
    effectiveLvl,
    maxHp: Math.floor(eData.hp*lvlScale),
    hp:    Math.floor(eData.hp*lvlScale),
    atk:   Math.floor(eData.atk*lvlScale*(branch.mechanic==='double_loot'?1.25:1)),
    def:   Math.floor((eData.def||0)*lvlScale*0.9),
    xp:    Math.floor(eData.xp*lvlScale),
    gold:  Math.floor((eData.gold||5)*(branch.mechanic==='double_loot'?2:1)*(0.7+Math.random()*0.7)),
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
  if(spriteData) renderSprite(spriteData, isBoss?15:13, eEl);
  eEl.className = isBoss ? 'boss-anim' : '';
  if(!isBoss && window.Anim) Anim.startEnemyIdle();
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
    // Check slot-level branchDefeated (persists across runs) for true first-clear
    const _slotData = (typeof loadSlotData==='function' && typeof activeSaveSlot!=='undefined' && activeSaveSlot)
      ? loadSlotData(activeSaveSlot) : null;
    const _slotBranchDefeated = _slotData && _slotData.branchDefeated ? _slotData.branchDefeated : {};
    const _firstBranchClear = !_slotBranchDefeated[branch.id]; // true only if never cleared on this slot
    G.branchDefeated[branch.id] = true;
    G._branchFirstClear = _firstBranchClear; // persist through reward chain
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
        G.dungeonGoal = saved.dungeonGoal ?? 4;
        G.zoneKills = saved.zoneKills ?? 0;
        G.bossReady = saved.bossReady ?? false;
        G._savedZoneState = null;
        _currentBranch = null;
        // 33% chance of grace drop from side quest bosses
        const afterBranchReward = () => showBranchReward(branch);
        if(Math.random() < 0.33 && typeof generateGrace==='function' && typeof showGraceDrop==='function'){
          showGraceDrop(generateGrace(), afterBranchReward);
        } else {
          afterBranchReward();
        }
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
  const firstClear = G._branchFirstClear;
  G._branchFirstClear = false; // consume the flag

  if(firstClear){
    // First time ever clearing this branch boss — go to town, same as main zone first clear
    const slot = (typeof activeSaveSlot!=='undefined') ? activeSaveSlot : null;
    if(typeof updateSlotData==='function' && slot){
      updateSlotData(slot, d=>{
        if(G) d.branchDefeated = {...(d.branchDefeated||{}), ...(G.branchDefeated||{})};
        if(G){
          d.lifetimeKills  = (d.lifetimeKills||0)  + (G.totalKills||0);
          d.lifetimeGold   = (d.lifetimeGold||0)   + (G.totalGold||0);
          d.lifetimeCrits  = (d.lifetimeCrits||0)  + (G.totalCrits||0);
          d.lifetimeCrafts = (d.lifetimeCrafts||0) + (G.totalCrafts||0);
          d.lifetimeTime   = (d.lifetimeTime||0)   + (G.playTime||0);
        }
        d.lifetimeRuns = (d.lifetimeRuns||0) + 1;
      });
    }
    log('✨ Side quest complete. Return to Elderfen.','l');
    if(typeof showSalvagePrompt==='function'){
      showSalvagePrompt(()=>{
        if(typeof fadeToScreen==='function'){
          fadeToScreen('town', ()=>{ if(typeof showTownHub==='function') showTownHub(); });
        } else if(typeof showTownHub==='function'){
          showTownHub();
        }
      });
    } else {
      if(typeof fadeToScreen==='function'){
        fadeToScreen('town', ()=>{ if(typeof showTownHub==='function') showTownHub(); });
      } else if(typeof showTownHub==='function'){
        showTownHub();
      }
    }
  } else {
    // Repeat clear — show map so player can continue their run
    // Use false (not postBoss) so the close button is visible — player's current zone
    // may not have a click handler yet (e.g. still in zone 1), so they need a way back
    if(typeof showMap==='function'){
      showMap(false);
    } else {
      // Fallback: drop back into the dungeon where they left off
      showScreen('game');
      setupGameUI();
      initObjective(G.zoneIdx);
      renderObjectiveStatus();
      renderAll();
      const neb=document.getElementById('nextEnemyBtn');
      const etb=document.getElementById('endTurnBtn');
      if(neb){neb.textContent='⚔ NEXT ENEMY ▶';neb.style.display='block';}
      if(etb)etb.style.display='none';
    }
  }
}

// ══════════════════════════════════════════════════════════
//  SPAWN ENEMY
// ══════════════════════════════════════════════════════════
function spawnEnemy(){
  // Fire any level-up/subclass screens deferred from first-clear boss transition
  if(G&&G._pendingLevelUpScreens&&G._pendingLevelUpScreens.length>0&&!levelUpShowing){
    const deferred=G._pendingLevelUpScreens.splice(0);
    deferred.forEach(d=>pendingLevelUps.push(d));
    G._afterLevelUpCallback=()=>spawnEnemy();
    if(typeof showNextLevelUp==='function') showNextLevelUp();
    return;
  }
  // Fire any talent picks deferred from boss-clear transitions
  if(G&&G._pendingTalentCount>0&&!levelUpShowing){
    G._pendingTalentCount--;
    G._afterLevelUpCallback=()=>spawnEnemy();
    if(typeof showTalentPick==='function') showTalentPick();
    return;
  }
  const z=ZONES[G.zoneIdx];
  let isBoss=false;

  // ── Boss check ────────────────────────────────────────────
  if(G.bossReady&&!G.runBossDefeated[G.zoneIdx]){
    isBoss=true;
    AUDIO.playBGM('boss');
    AUDIO.sfx.bossAppear();
    log(`⚠ THE BOSS EMERGES: ${z.boss.name}!`,'s');
    log(`${z.boss.title}`,'e');
    if(typeof triggerBossEntrance==='function') triggerBossEntrance(z.boss.name, z.boss.title);
    if(typeof triggerScreenShake==='function') triggerScreenShake();
  }

  // ── Roll enemy count (boss always 1) ─────────────────────
  const roll100=Math.random()*100;
  // Encounter count scales by zone tier
  let enemyCount=1;
  if(!isBoss){
    if(G.zoneIdx<=1){        // Zones I-II: 55/35/10
      enemyCount=roll100<55?1:roll100<90?2:3;
    } else if(G.zoneIdx<=4){ // Zones III-V: 40/35/20/5
      enemyCount=roll100<40?1:roll100<75?2:roll100<95?3:4;
    } else {                 // Zones VI-VIII: 30/35/25/10
      enemyCount=roll100<30?1:roll100<65?2:roll100<90?3:4;
    }
  }

  // ── Scaling ───────────────────────────────────────────────
  const lvlScale    =1+(G.level-1)*0.06;
  const zoneProgress=1+Math.min(0.10,Math.floor((G.zoneKills||0)/3)*0.03);
  const zoneLvl     =[1,5,8,12,16][G.zoneIdx]||1;
  const overLvl     =Math.max(0,G.level-(zoneLvl+6));
  const catchUp     =Math.min(1.4,1+overLvl*0.05);
  const bossBonus   =isBoss?1.25:1;
  const scale       =lvlScale*zoneProgress*catchUp*bossBonus;
  const effectiveLvl=Math.max(1,Math.round((scale-1)/0.06)+1);

  // ── Build one enemy object ────────────────────────────────
  function buildEnemy(eData){
    return {
      ...eData,
      isBoss,
      effectiveLvl,
      maxHp:Math.floor(eData.hp*scale),
      hp:   Math.floor(eData.hp*scale),
      atk:  Math.floor(eData.atk*scale),
      def:  Math.floor((eData.def||0)*scale*.9),
      xp:   Math.floor(eData.xp*scale),
      gold: Math.floor((eData.gold||5)*(0.7+Math.random()*.7)),
      dead: false,
    };
  }

  // ── Populate G.currentEnemies ─────────────────────────────
  if(isBoss){
    G.currentEnemies=[buildEnemy(z.boss)];
  } else {
    G.currentEnemies=[];
    for(let i=0;i<enemyCount;i++){
      const eData=z.enemies[Math.floor(Math.random()*z.enemies.length)];
      G.currentEnemies.push(buildEnemy(eData));
    }
  }
  G.targetIdx=0;
  G.currentEnemy=G.currentEnemies[0];

  // ── Render sprite + name/HP for the first target ──────────
  const eEl=document.getElementById('enemySprite');
  const spriteData=isBoss?BOSS_SPRITES[G.currentEnemy.sprite]:ENEMY_SPRITES[G.currentEnemy.sprite];
  if(spriteData) renderSprite(spriteData,isBoss?15:13,eEl);
  eEl.className=isBoss?'boss-anim':'';
  if(!isBoss && window.Anim) Anim.startEnemyIdle();
  eEl.style.filter=`drop-shadow(0 0 4px ${G.currentEnemy.color})`;

  document.getElementById('enemyHpFill').style.width='100%';
  const _eHpTxt=document.getElementById('enemyHpText');
  if(_eHpTxt)_eHpTxt.textContent=G.currentEnemy.maxHp+' / '+G.currentEnemy.maxHp+' HP';
  const lvlBadge=`<span style="font-size:11px;color:var(--dim);margin-left:6px;">Lv.${effectiveLvl}</span>`;
  const cntBadge=enemyCount>1?`<span style="font-size:11px;color:var(--gold);margin-left:8px;">[${enemyCount} enemies]</span>`:'';
  document.getElementById('enemyNameTag').innerHTML=(isBoss?`⚠ ${G.currentEnemy.name}`:G.currentEnemy.name)+lvlBadge+cntBadge;
  document.getElementById('enemyNameTag').className='fighter-name-tag '+(isBoss?'boss-name-tag':'');

  // ── Per-fight passives (unchanged) ───────────────────────
  if(G.classId==='ranger'&&G.talents.includes('Beast Bond')){G.sx.beastBlock=true;log("Beast Bond: companion stands guard ready to block one hit!",'s');}
  G.roundNum=0;G.firstAttackUsed=false;G._surgeCritBonus=0;
  G._fightGoldEarned=0;G._fightDamageTaken=false;
  if(G._flurry)G._flurryUsed=false;
  if(G._shadowForm)G._shadowFormUsed=false;
  if(G._shadowStep)G._shadowStepUsed=false;
  if(G._explosiveArrow)G._explosiveArrowUsed=false;
  if(G._seasonedHunter){G.atk-=(G._seasonedHunterBonus||0);G._seasonedHunterBonus=0;}
  if(G._favoredTerrainActive){log('🌿 Favored Terrain: '+G._favoredTerrainName+' — +15% damage this fight!','s');}
  if(G.classId==='ranger'&&G._swiftTracker&&!G.hunterMarked){
    G.hunterMarked=true;G.concentrating='hunters_mark';
    G.skillCooldowns['hunters_mark']=Date.now()+(999*1000);
    log("🏃 Swift Tracker: Hunter's Mark pre-applied!",'s');
    if(G._bindingMark&&G.currentEnemy)G.currentEnemy.atk=Math.max(1,(G.currentEnemy.atk||0)-4);
  }
  if(G.classId==='barbarian'&&G._warCry&&!G._warCryUsed){
    G._warCryUsed=true;
    if(typeof addConditionEnemy==='function')addConditionEnemy('Frightened',2);
    log('⚔️ War Cry: enemy Frightened!','c');
  }
  if(G._feralCharge)G._feralChargeUsed=false;
  if(G.classId==='wizard'&&G._arcaneSurgeCount!==undefined)G._arcaneSurgeCount=0;
  if(G._deadeye)G._deadeyeUsed=false;
  if(G._undyingFury)G._undyingFuryUsed=false;
  if(G._undyingLight)G._undyingLightUsed=false;
  if(G.classId==='cleric'&&G._holyWard){G.holyWardHp=15;log('📿 Holy Ward: barrier of 15 HP activated!','s');}
  if(G.classId==='cleric'&&G._sunrise){G.hp=Math.min(G.maxHp,G.hp+10);log('🌅 Sunrise: +10 HP!','s');}
  if(G._overflowingFont)G._overflowingFontUsed=false;
  if(G._divineIntervention)G._divineInterventionUsed=false;
  if(G._indomitable)G._indomitableUsed=false;
  if(G.classId==='wizard'&&G._preparedCaster&&G.spellSlots&&G.spellSlotsMax&&(G.spellSlots[1]||0)<(G.spellSlotsMax[1]||0)){G.spellSlots[1]++;log('📜 Prepared Caster: bonus LVL1 slot ready!','s');}
  if(G._overcharged)G._overchargedUsed=false;
  if(G._metamagicTwin)G._metamagicTwinUsed=false;
  // Reset per-combat legendary grace flags
  if(G._graceFirstStrike) G._graceFirstStrikeUsed=false;
  if(G._graceFirstBlade) G._graceFirstBladeUsed=false;
  if(G._graceVengeance){ 
    // Remove previous combat's vengeance ATK bonus before resetting
    const oldStacks = Math.min(G._graceVengeanceStacks||0, 10);
    if(oldStacks>0) G.atk = Math.max(0, G.atk - oldStacks);
    G._graceVengeanceStacks=0; 
  }
  // Clean up Holy Armor DEF buff from previous combat
  if(G._graceHolyArmorDef && G._graceHolyArmorDef>0){
    G.def = Math.max(0, (G.def||0) - G._graceHolyArmorDef);
    G._graceHolyArmorDef=0; G._graceHolyArmorTurns=0;
  }
  if(G.capstoneUnlocked&&G.classId==='ranger')G.hunterMarked=true;
  if(G.capstoneUnlocked&&G.classId==='cleric')G.res=Math.min(G.resMax,(G.res||0)+1);
  if(G.capstoneUnlocked&&G.classId==='barbarian'){G.raging=true;G.rageTurns=999;log('🔥 Eternal Rage: you begin the fight already raging!','s');}
  if(G.capstoneUnlocked&&G.classId==='druid'){G.skillCharges.wild_shape=Math.max(G.skillCharges.wild_shape||0,99);}
  if(G.capstoneUnlocked&&G.classId==='paladin'){G.sx=G.sx||{};}
  // Capstone ultimate resets — recharge every fight
  if(G.capstoneUnlocked&&G.classId==='ranger')G._ultimateUsed=false; // Hail of Arrows recharges
  if(G.capstoneUnlocked&&G.classId==='barbarian')G._ultimateUsed=false; // World Breaker recharges
  // Per-fight capstone flags
  if(G._deathsShadow)G._deathsShadowUsed=false; // Rogue death-save resets
  if(G._capstone&&G.classId==='fighter')G._unbreakableEmergencyUsed=false; // Fighter emergency reset
  const neb=document.getElementById('nextEnemyBtn');
  const etb=document.getElementById('endTurnBtn');
  if(neb)neb.style.display='none';
  if(etb)etb.style.display='block';
  if(G._branchBattleHardened){G.hp=Math.min(G.maxHp,G.hp+10);log('🛡 Battle Hardened: +10 HP!','s');}
  if(G._dawnBlessing){G.dawnBlessingShield=30;G._dawnBlessing=false;log('🌅 Dawn Blessing: 30 HP divine barrier active!','s');renderShieldBar();}

  const cntMsg=enemyCount>1?` + ${enemyCount-1} more!`:'';
  log(`A ${G.currentEnemy.name} appears! [Lv.${effectiveLvl}]${cntMsg}`,'s');
  setPlayerTurn(true);
  renderEnemyArea();
}

// ── Target helpers ────────────────────────────────────────

// Keep G.currentEnemy in sync with the selected target.
function syncTarget(){
  if(!G||!G.currentEnemies||!G.currentEnemies.length) return;
  if(G.currentEnemies[G.targetIdx]&&G.currentEnemies[G.targetIdx].dead){
    const nextAlive=G.currentEnemies.findIndex(e=>!e.dead);
    if(nextAlive!==-1) G.targetIdx=nextAlive;
  }
  G.currentEnemy=G.currentEnemies[G.targetIdx]||null;
  updateEnemyBar();
  renderEnemyArea();
}

// Returns true if all enemies in the room are dead
function allEnemiesDead(){
  return G.currentEnemies&&G.currentEnemies.length>0&&G.currentEnemies.every(e=>e.dead);
}

// Returns array of living enemies
function livingEnemies(){
  return (G.currentEnemies||[]).filter(e=>!e.dead);
}

// ── Enemy area renderer ───────────────────────────────────

function renderEnemyArea(){
  if(!G||!G.currentEnemies) return;
  const single = G.currentEnemies.length <= 1;
  const singleWrap = document.getElementById('enemyWrap');
  const multiRow   = document.getElementById('multiEnemyRow');
  if(!singleWrap||!multiRow) return;

  if(single){
    // Single enemy — use the normal UI elements unchanged
    singleWrap.style.display='';
    multiRow.style.display='none';
    return;
  }

  // Multiple enemies — hide single view, show cards
  singleWrap.style.display='none';
  multiRow.style.display='flex';
  multiRow.innerHTML='';

  G.currentEnemies.forEach((e,i)=>{
    const isTarget = i===G.targetIdx && !e.dead;
    const isDead   = e.dead;
    const hpPct    = isDead ? 0 : Math.max(0,e.hp/e.maxHp*100);
    const hpColor  = hpPct<25?'var(--red2)':hpPct<50?'var(--orange2)':'var(--green2)';

    const card = document.createElement('div');
    card.className='enemy-card'+(isTarget?' targeted':'')+(isDead?' dead':'');
    card.onclick = isDead ? null : ()=>{ selectTarget(i); };

    // Build sprite canvas
    const spriteCanvas = document.createElement('div');
    spriteCanvas.className='enemy-card-sprite';
    const spriteEl = document.createElement('div');
    const spriteData = e.isBoss ? BOSS_SPRITES[e.sprite] : ENEMY_SPRITES[e.sprite];
    if(spriteData) renderSprite(spriteData, 7, spriteEl);
    spriteEl.style.filter=`drop-shadow(0 0 3px ${e.color||'#888'})`;
    spriteCanvas.appendChild(spriteEl);

    const hpBar = `<div class="enemy-card-hp-bar"><div class="enemy-card-hp-fill" style="width:${hpPct}%;background:${hpColor};"></div></div>`;
    const hpTxt = `<div class="enemy-card-hp-txt">${isDead?'DEAD':Math.ceil(e.hp)+'/'+e.maxHp}</div>`;
    const name  = `<div class="enemy-card-name">${e.name}<br><span style="color:var(--dim);font-size:4px;">Lv.${e.effectiveLvl}</span></div>`;
    const arrow = isTarget ? `<div class="enemy-target-arrow">▼</div>` : '';
    const deadX = isDead   ? `<div class="enemy-card-dead-x">💀</div>` : '';

    card.appendChild(spriteCanvas);
    card.insertAdjacentHTML('beforeend', hpBar+hpTxt+name+arrow+deadX);
    multiRow.appendChild(card);
  });
}

function selectTarget(idx){
  if(!G||!G.currentEnemies) return;
  if(idx<0||idx>=G.currentEnemies.length) return;
  if(G.currentEnemies[idx].dead) return;
  G.targetIdx=idx;
  G.currentEnemy=G.currentEnemies[idx];
  updateEnemyBar();
  renderEnemyArea();
  // Update the single-enemy name tag too (used by some log messages)
  const nameTag=document.getElementById('enemyNameTag');
  if(nameTag){
    const e=G.currentEnemy;
    const lvlBadge=`<span style="font-size:11px;color:var(--dim);margin-left:6px;">Lv.${e.effectiveLvl}</span>`;
    const alive=livingEnemies().length;
    const remBadge=alive>1?`<span style="font-size:11px;color:var(--gold);margin-left:8px;">[${alive} remaining]</span>`:'';
    nameTag.innerHTML=e.name+lvlBadge+remBadge;
  }
  log(`Target: ${G.currentEnemy.name}`,'s');
}

// ══════════════════════════════════════════════════════════
//  COMBAT VISUAL EFFECTS — CSS class toggles only
// ══════════════════════════════════════════════════════════

function triggerScreenShake(){
  const pc = document.querySelector('.panel-center');
  if(!pc) return;
  pc.classList.remove('screen-shake');
  void pc.offsetWidth; // force reflow
  pc.classList.add('screen-shake');
  setTimeout(()=> pc.classList.remove('screen-shake'), 350);
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
