
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
          const stats = Object.entries(g.stats).map(([k,v])=>'+'+v+' '+(typeof statLabel==='function'?statLabel(k):k.toUpperCase())).join(' · ');
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

  // Render small sprites (with chroma filter if selected)
  Object.keys(CLASSES).forEach(id=>{
    const el=document.getElementById('cs-sprite-'+id);
    if(el){
      if(window.hasImageSprite && window.hasImageSprite(id)){
        window.renderImageSpriteStatic(id, el, 100);
      } else if(CLASS_SPRITES[id]){
        renderSprite(CLASS_SPRITES[id],5,el);
      }
      // Apply saved chroma filter to preview
      if(typeof activeSaveSlot!=='undefined'&&activeSaveSlot&&typeof loadSlotData==='function'){
        const sd=loadSlotData(activeSaveSlot);
        if(sd&&sd.chromaSelections&&sd.chromaSelections[id]&&typeof CHROMAS!=='undefined'){
          const chromas=CHROMAS[id];
          if(chromas){
            const ch=chromas.find(c=>c.id===sd.chromaSelections[id]);
            if(ch){
              const img=el.querySelector('img.img-sprite');
              if(img) img.style.filter=ch.filter;
              else el.style.filter=ch.filter; // pixel sprite fallback
            }
          }
        }
      }
    }
  });

  // Inject chromas button below the class grid
  let chromaBtn = document.getElementById('csChromaBtn');
  if(!chromaBtn){
    chromaBtn = document.createElement('div');
    chromaBtn.id = 'csChromaBtn';
    chromaBtn.style.cssText = 'text-align:center;margin-top:16px;';
    grid.parentNode.insertBefore(chromaBtn, grid.nextSibling);
  }
  chromaBtn.innerHTML = `<button onclick="if(typeof openChromaGallery==='function')openChromaGallery()" style="
    font-family:'Press Start 2P',monospace;font-size:clamp(7px,0.8vw,9px);
    padding:8px 18px;background:transparent;border:1px solid rgba(200,168,75,0.3);
    color:var(--gold-dim);cursor:pointer;letter-spacing:2px;transition:all 0.2s;
  " onmouseover="this.style.borderColor='var(--gold)';this.style.color='var(--gold)';"
     onmouseout="this.style.borderColor='rgba(200,168,75,0.3)';this.style.color='var(--gold-dim)';">
    ✦ CHROMAS
  </button>`;
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
    // Load active chroma for this class from save slot
    if(slotData&&slotData.chromaSelections&&slotData.chromaSelections[pendingClass]){
      G._activeChroma=slotData.chromaSelections[pendingClass];
    }
    // Load lifetime chroma trackers from save slot
    if(slotData){
      G._lifetimeSmites=slotData.lifetimeSmitesPaladin||0;
      G._lifetimeChannels=slotData.lifetimeChannelsCleric||0;
      G._lifetimePoisonsApplied=slotData.lifetimePoisonsDruid||0;
      G._lifetimeWildShapeTurns=slotData.lifetimeWildShapeTurnsDruid||0;
      G._lifetimeFlawlessRogue=slotData.lifetimeFlawlessRogue||0;
      G._lifetimeGoldRogue=slotData.lifetimeGoldRogue||0;
      G._lifetimeObjectivesRanger=slotData.lifetimeObjectivesRanger||0;
      G._markedBossKills=slotData.lifetimeMarkedBossKillsRanger||0;
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
  // ── Phase B: Roll zone modifiers for this run ──
  if(typeof rollZoneModifiers==='function') rollZoneModifiers();
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
//  ZONE MODIFIER ROLLING
// ══════════════════════════════════════════════════════════

function rollZoneModifiers(){
  if(!G) return;
  G._zoneModifiers = {};
  if(typeof ZONE_MODIFIERS === 'undefined') return;

  // Build pool: base (unlocked:false) + any locked modifiers the player has earned
  const unlocked = G.unlockedAchievements || [];
  const pool = ZONE_MODIFIERS.filter(m => {
    if(!m.locked) return true;
    // Check if the player has the unlock achievement for this modifier
    if(typeof UNLOCKS !== 'undefined'){
      const ul = UNLOCKS.find(u => u.type === 'modifier' && u.targetId === m.id);
      return ul && unlocked.includes(ul.id);
    }
    return false;
  });

  if(!pool.length) return;

  // 75% chance per zone, no repeats within a run
  const used = [];
  for(let z = 0; z < 8; z++){
    if(Math.random() > 0.75) continue;
    const available = pool.filter(m => !used.includes(m.id));
    if(!available.length) continue;
    const pick = available[Math.floor(Math.random() * available.length)];
    G._zoneModifiers[z] = pick.id;
    used.push(pick.id);
  }
}

// ══════════════════════════════════════════════════════════
//  PERMANENT UPGRADES APPLICATION
// ══════════════════════════════════════════════════════════

