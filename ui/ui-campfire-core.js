// ================================================================
// ui/ui-campfire-core.js — Campfire Scene, Rest Tab, Class Actions
// Descent into Eternity
// ================================================================

// ══════════════════════════════════════════════════════════
//  CAMPFIRE — TABBED IN-GAME UI
// ══════════════════════════════════════════════════════════
function showCampfire(){
  if(typeof stopZoneParticles==='function') stopZoneParticles();
  stopPlayerAnim();
  checkObjectiveProgress('campfire_used',true);
  if(enemyTurnTimeout){clearTimeout(enemyTurnTimeout);enemyTurnTimeout=null;}
  // BGM started in fadeToScreen callback so it isn't muted by the fade
  G.isPlayerTurn=true;
  G.currentEnemy=null;
  const neb=document.getElementById('nextEnemyBtn');
  const etb=document.getElementById('endTurnBtn');
  if(neb)neb.style.display='none';
  if(etb)etb.style.display='block';
  const bossCleared=G.bossDefeated[G.zoneIdx];
  const midZone=!bossCleared;
  document.getElementById('cfSubtitle').textContent=bossCleared
    ?`${ZONES[G.zoneIdx].name} cleared! The path ahead awaits.`
    :'You take a moment to rest and resupply...';
  cfCurrentTab='rest';
  document.querySelectorAll('.cf-tab').forEach((t,i)=>t.className='cf-tab'+(i===0?' active':''));
  // Reset long rest flag for this campfire visit
  G._longRestUsed=false;
  G._shopStock=null; // A1: fresh stock each campfire
  // ── Phase B: Track campfire for unlocks ──
  if(typeof updateUnlockStats === 'function') updateUnlockStats('campfire');
  // Phase B: Reset Ancestral Fury stacks at campfire
  if(G._ancestralStacks > 0 && G._activeModifier && G._activeModifier.effects.killAtkStack){
    // Stacks are consumed in damage formula, not stored in G.atk — just reset counter
    G._ancestralStacks = 0;
  }
  // Update continue button label based on state
  const contBtn=document.querySelector('.cf-continue-wrap button');
  if(contBtn){
    contBtn.textContent=bossCleared?'CONTINUE JOURNEY ▶':'BACK TO BATTLE ▶';
  }
  cfRenderTab('rest');
  // Fade to black → show campfire → fade in (smoother than instant cut)
  fadeToScreen('campfire', ()=>{
    AUDIO.playBGM('campfire');
    if(typeof renderLives==='function') renderLives();
    startCampfireAnim();
  });
}

let _cfAnimTimer=null;
function startCampfireAnim(){
  if(_cfAnimTimer)clearInterval(_cfAnimTimer);
  const el=document.getElementById('cfFireSprite');
  if(!el)return;
  renderSprite(CAMPFIRE_SPRITE,5,el);
  let frame=0;
  const frames=[CAMPFIRE_SPRITE,CAMPFIRE_FRAME2];
  _cfAnimTimer=setInterval(()=>{
    const sp=document.getElementById('cfFireSprite');
    if(!sp){clearInterval(_cfAnimTimer);return;}
    frame=(frame+1)%frames.length;
    renderSprite(frames[frame],5,sp);
  },220);
}

// ── PLAYER SPRITE IDLE ANIMATION ──────────────────────────────────
let _playerAnimTimer = null;

// ── Idle animation system ──────────────────────────────────────────
// Uses CSS keyframe animations on the sprite container.
// Each class has a unique animation profile: bob, float, pulse, sway.
// This reads clearly at any pixel size unlike pixel-data frame swaps.

const CLASS_ANIM_PROFILE = {
  fighter:   'idle-bob',
  wizard:    'idle-float',
  rogue:     'idle-bob-fast',
  paladin:   'idle-pulse',
  ranger:    'idle-sway',
  barbarian: 'idle-shake',
  cleric:    'idle-float-slow',
  druid:     'idle-sway-slow',
};

const _IDLE_CLASSES=['idle-bob','idle-bob-fast','idle-float','idle-float-slow',
                    'idle-pulse','idle-sway','idle-sway-slow','idle-shake'];

let _imgIdleTimer = null;
let _imgIdleFrame = 0;

function startPlayerAnim(){
  const cid = typeof G !== 'undefined' && G && G.classId;
  // Image sprite classes — run our own frame loop
  if(cid && window.hasImageSprite && window.hasImageSprite(cid)){
    stopPlayerAnim();
    const el = document.getElementById('playerSprite');
    if(!el) return;
    const frames = window.IMAGE_SPRITES[cid].idle;
    _imgIdleFrame = 0;

    _imgIdleTimer = setInterval(() => {
      const img = el.querySelector('img.img-sprite');
      if(img){
        img.src = frames[_imgIdleFrame];
        _imgIdleFrame = (_imgIdleFrame + 1) % frames.length;
      }
    }, 350);

    // Add CSS idle class for the bobbing motion
    const idleClasses = {fighter:'anim-idle-fighter', wizard:'anim-idle-wizard'};
    if(idleClasses[cid]) el.classList.add(idleClasses[cid]);
    return;
  }
  // Pixel sprite classes — delegate to Anim system
  if(window.Anim) window.Anim.startPlayerIdle();
}

function stopPlayerAnim(){
  if(_imgIdleTimer){ clearInterval(_imgIdleTimer); _imgIdleTimer = null; }
  if(window.Anim) window.Anim.stopPlayerIdle();
  if(_playerAnimTimer){clearInterval(_playerAnimTimer);_playerAnimTimer=null;}
}

function cfSwitchTab(tab,el){
  document.querySelectorAll('.cf-tab').forEach(t=>t.className='cf-tab');
  el.className='cf-tab active';
  cfCurrentTab=tab;
  cfRenderTab(tab);
}

function cfRenderTab(tab){
  const el=document.getElementById('cfContent');
  if(tab==='rest')el.innerHTML=cfRestHTML();
  else if(tab==='craft')el.innerHTML=cfCraftHTML();
  else if(tab==='codex')el.innerHTML=codexHTML();
  else if(tab==='shop'){el.innerHTML=cfShopHTML();setTimeout(drawShopWizard,0);}
  else if(tab==='event')el.innerHTML=cfEventHTML();
  else if(tab==='inventory'){el.innerHTML=cfInventoryHTML();bindCfInventoryTooltips();}
}

function cfSceneHTML(){
  // Pixel campfire scene — sleeping adventurer next to fire
  const cls = G ? CLASSES[G.classId] : null;
  const clsColor = cls ? cls.resColor : '#c8a46a';
  // Stars — fixed positions
  const stars = [[8,8],[25,15],[45,6],[70,12],[95,5],[120,18],[150,9],[180,14],
    [210,7],[240,16],[270,8],[300,13],[340,5],[370,18],[400,10],[430,6],[455,14]];
  const starsHTML = stars.map((s,i)=>`<div class="cf-star" style="left:${s[0]}px;top:${s[1]}px;width:${i%3===0?3:2}px;height:${i%3===0?3:2}px;animation-delay:${(i*0.37).toFixed(2)}s"></div>`).join('');

  // Build sleeping bag with class color accent
  const bagHTML = `
    <div class="cf-bag">
      <div class="cf-zzz">z z z</div>
      <div style="position:relative;">
        <div class="cf-bag-head">
          <div class="cf-eye l"></div>
          <div class="cf-eye r"></div>
        </div>
        <div class="cf-bag-body" style="background:#1a3060;border-color:${clsColor};box-shadow:0 0 6px ${clsColor}44;">
          <div style="position:absolute;top:4px;left:14px;right:6px;height:4px;background:${clsColor};opacity:0.4;border-radius:2px;"></div>
          <div style="position:absolute;top:12px;left:14px;right:10px;height:3px;background:${clsColor};opacity:0.25;border-radius:2px;"></div>
        </div>
      </div>
    </div>`;

  // Campfire with layered flames
  const fireHTML = `
    <div class="cf-fire-wrap">
      <div class="cf-glow"></div>
      <div style="position:relative;width:36px;height:44px;">
        <div class="cf-log1"></div><div class="cf-log2"></div>
        <div class="cf-ember"></div>
        <div class="cf-flame">
          <div class="cf-flame-c" style="width:8px;height:18px;background:#ff2200;left:2px;bottom:0;animation-delay:0.1s"></div>
          <div class="cf-flame-c" style="width:10px;height:24px;background:#ff5500;left:6px;bottom:0;animation-delay:0s"></div>
          <div class="cf-flame-c" style="width:8px;height:20px;background:#ff8800;left:12px;bottom:0;animation-delay:0.2s"></div>
          <div class="cf-flame-c" style="width:6px;height:14px;background:#ffcc00;left:8px;bottom:2px;animation-delay:0.15s"></div>
          <div class="cf-flame-c" style="width:4px;height:10px;background:#fff0a0;left:10px;bottom:4px;animation-delay:0.05s"></div>
        </div>
      </div>
    </div>`;

  // Rocks around fire
  const rocksHTML = `
    <div style="position:absolute;bottom:32px;left:80px;display:flex;gap:2px;align-items:flex-end;">
      <div style="width:10px;height:7px;background:#2a2218;border:1px solid #3a3228;border-radius:3px 3px 2px 2px;"></div>
      <div style="width:8px;height:5px;background:#252018;border:1px solid #352e20;border-radius:2px;"></div>
    </div>
    <div style="position:absolute;bottom:32px;left:114px;display:flex;gap:2px;align-items:flex-end;">
      <div style="width:8px;height:5px;background:#252018;border:1px solid #352e20;border-radius:2px;"></div>
      <div style="width:10px;height:6px;background:#2a2218;border:1px solid #3a3228;border-radius:3px 3px 2px 2px;"></div>
    </div>`;

  // Ambient glow cast by fire on ground  
  const glowHTML = `<div style="position:absolute;bottom:0;left:60px;width:160px;height:34px;background:radial-gradient(ellipse at 50% 100%,rgba(255,100,0,0.18) 0%,transparent 70%);pointer-events:none;"></div>`;

  return `<div class="cf-rest-scene">
    ${starsHTML}
    <div class="cf-ground"></div>
    ${glowHTML}
    ${fireHTML}
    ${rocksHTML}
    ${bagHTML}
  </div>`;
}

function cfRestHTML(){
  return `<div class="rest-panel">
    ${cfSceneHTML()}
    <p style="font-size:17px;color:var(--parchment);margin-bottom:16px;">Take a Long Rest to restore HP, ${G.classId==='wizard'?'spell slots':'resources'}, and clear conditions.</p>
    <div class="rest-preview">
      <div class="rest-item">❤️ HP<span>Restore to ${Math.floor(G.maxHp * Math.min(1.0, (G._rareEventFlags&&G._rareEventFlags.lastCampfireWeaken ? 0.40 : 0.75) + (G._campfireHealBonus||0)))} / ${G.maxHp}</span></div>
      ${G.classId==='wizard'?`<div class="rest-item">🔮 Spell Slots<span>All restored</span></div>`:`<div class="rest-item">◈ ${CLASSES[G.classId].res}<span>Fully refilled</span></div>`}
      <div class="rest-item">⚠️ Conditions<span>All cleared</span></div>
    </div>
    ${G._longRestUsed
      ? `<div style="font-family:'Press Start 2P',monospace;font-size:8px;color:var(--dim);margin-bottom:12px;line-height:1.8;">✓ ALREADY RESTED<br><span style="color:var(--dim);">You may only rest once per campfire.</span></div>`
      : `<button class="btn btn-green" style="font-size:9px;padding:12px 28px;" onclick="cfDoRest()">😴 TAKE LONG REST</button>`
    }
    <div id="restResult" style="margin-top:12px;font-size:16px;color:var(--green2);display:none;"></div>
    ${G.classId==='ranger'&&G._favoredTerrain?`
    <div style="margin-top:18px;border-top:1px solid var(--border);padding-top:14px;">
      <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:#c8a46a;margin-bottom:10px;">🌿 FAVORED TERRAIN</div>
      ${G._favoredTerrainActive
        ?`<div style="font-size:13px;color:var(--green2);">✓ ${G._favoredTerrainName} chosen — +15% damage in next fight!</div>`
        :`<div style="font-size:13px;color:var(--dim);margin-bottom:8px;">Choose your terrain for +15% damage in the next fight:</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
          ${['🌲 Forest','⛰ Mountains','🌊 Coastline','🌑 Underdark','🔥 Lava Fields'].map(t=>`<button class="btn" style="font-size:10px;padding:8px 12px;" onclick="cfFavoredTerrain('${t}')">${t}</button>`).join('')}
        </div>`
      }
    </div>`:''
    }
    ${cfClassActionHTML()}
  </div>`;
}

function cfDoRest(){
  // Only allow one long rest per campfire visit
  if(G._longRestUsed){
    const el=document.getElementById('restResult');
    if(el){el.textContent='✗ Already rested at this campfire!';el.style.color='var(--red2)';el.style.display='block';}
    return;
  }
  G._longRestUsed=true;
  G._noRestStreak=0; // Reset no-rest achievement streak
  // Rare Event: Last Campfire weakens this rest to 50%
  const baseRestPct=G._rareEventFlags&&G._rareEventFlags.lastCampfireWeaken?0.40:0.75;
  // Permanent upgrade: Restful adds +10% per level to rest heal
  const restPct=Math.min(1.0, baseRestPct + (G._campfireHealBonus || 0));
  if(G._rareEventFlags&&G._rareEventFlags.lastCampfireWeaken) delete G._rareEventFlags.lastCampfireWeaken;
  G.hp=Math.min(G.maxHp, Math.max(G.hp, Math.floor(G.maxHp*restPct))); // Restore to 75% HP (or 40% if weakened by Last Campfire event); won't reduce HP if already above threshold
  G.conditions=[];G.conditionTurns={};
  // Restore all skill charges on long rest
  G.skillCharges={};
  CLASSES[G.classId].skills.forEach(sk=>{ if(sk.charges) G.skillCharges[sk.id]=sk.charges; });G.sx={};G.raging=false;G.hunterMarked=false;G.concentrating=null;
  G.wildShapeHp=0;G.wildShapeActive=false;G.spiritualWeaponActive=false;G.spiritualWeaponTurns=0;
  G._undyingFuryUsed=false;G._divineInterventionUsed=false;G._ultimateUsed=false;
  // Restore Battle Master Relentless once per rest
  if(G.subclassId==='battle_master') G._battleMasterRelentless=true;
  // Class campfire actions reset on rest (so they show as available next campfire)
  G._inscribeScroll=false;G._inscribeScrollId=null;G._inscribeScrollSpell=null;G._inscribeScrollMenu=false;
  G._caseTarget=false;G._warReadiness=false;G._oathRenewal=false;
  G._bloodOffering=false;G._dawnBlessing=false;G._wildAttunement=false;G._wildAttunementActive=false;
  G.skillCooldowns={};
  // Restore druid sprite on zone travel
  if(G.classId==='druid'){const p=document.getElementById('playerSprite');if(p){if(window.hasImageSprite&&window.hasImageSprite('druid')){window.renderImageSprite('druid','idle',0,p,260);}else if(CLASS_SPRITES.druid)renderSprite(CLASS_SPRITES.druid,14,p);}if(p)p.style.filter='';startPlayerAnim();}
  const exitBtnZ=document.getElementById('exitWildShapeBtn');if(exitBtnZ)exitBtnZ.style.display='none';
  if(G.classId!=='wizard'){G.res=G.resMax;}
  else if(G.spellSlots&&G.spellSlotsMax){
  G.mirrorImages=0; // Clear mirror images on rest
    for(const lvl of Object.keys(G.spellSlotsMax))G.spellSlots[lvl]=G.spellSlotsMax[lvl];
    G.res=Object.values(G.spellSlots).reduce((a,b)=>a+b,0);
  }
  G.layOnHandsPool=Math.floor(G.level*5*(G.talents.includes('Lay on Hands+')?1.5:1));
  const el=document.getElementById('restResult');
  G.eventUnlockedByRest=true;
  AUDIO.sfx.restComplete();
  if(el){el.textContent='✓ Rested! HP restored to '+Math.round(restPct*100)+'%. Resources and conditions restored.';el.style.color='var(--green2)';el.style.display='block';}
  // Re-render rest tab to update counter
  setTimeout(()=>cfRenderTab('rest'), 600);
}

function cfFavoredTerrain(terrain){
  G._favoredTerrainActive=true;
  G._favoredTerrainName=terrain;
  cfRenderTab('rest');
  log('🌿 Favored Terrain: '+terrain+' chosen! +15% damage in next fight.','s');
}

// ── CLASS-SPECIFIC CAMPFIRE ACTIONS ───────────────────────────────
function cfClassActionHTML(){
  if(!G)return'';
  const cls=G.classId;
  if(cls==='ranger')return''; // ranger has Favored Terrain above already

  // Class action only available after taking a long rest
  if(!G._longRestUsed){
    return `<div style="margin-top:18px;border-top:1px solid var(--border);padding-top:14px;">
      <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--dim);letter-spacing:1px;">⚠ LONG REST REQUIRED</div>
      <div style="font-size:12px;color:var(--dim);margin-top:8px;">Take a long rest to unlock your class action.</div>
    </div>`;
  }

  const actions={
    wizard:{
      icon:'📚', title:'INSCRIBE SCROLL',
      desc:'Choose one spell — it costs no slots next fight (once).',
      flag:'_inscribeScroll',
      doneText:'✓ Scroll of '+( G._inscribeScrollSpell||'?')+' ready — one free cast next fight!',
      btn:'cfInscribeScrollMenu()',
      btnLabel:'✍ INSCRIBE SCROLL',
    },
    rogue:{
      icon:'🎯', title:'CASE THE TARGET',
      desc:'Study enemy weaknesses — they start with -3 DEF next fight.',
      flag:'_caseTarget',
      doneText:'✓ Target cased — enemy DEF -3 next fight!',
      btn:"cfClassAction('_caseTarget')",
      btnLabel:'🎯 CASE THE TARGET',
    },
    fighter:{
      icon:'🪖', title:'WAR READINESS',
      desc:'Drill through the night — Second Wind has no cooldown next fight.',
      flag:'_warReadiness',
      doneText:'✓ Battle-ready — Second Wind is unlimited next fight!',
      btn:"cfClassAction('_warReadiness')",
      btnLabel:'🪖 PREPARE FOR BATTLE',
    },
    paladin:{
      icon:'🕯', title:'OATH RENEWAL',
      desc:'Renew your sacred vow — next Divine Smite auto-crits, costs no Holy Power.',
      flag:'_oathRenewal',
      doneText:'✓ Oath renewed — next Smite is a free crit!',
      btn:"cfClassAction('_oathRenewal')",
      btnLabel:'🕯 RENEW OATH',
    },
    barbarian:{
      icon:'💀', title:'BLOOD OFFERING',
      desc:'Sacrifice 15% max HP — Rage is free next fight, +20% dmg below 50% HP.',
      flag:'_bloodOffering',
      doneText:'✓ Offering made — rage and fury await!',
      btn:"cfClassAction('_bloodOffering')",
      btnLabel:'💀 MAKE OFFERING',
    },
    cleric:{
      icon:'🌅', title:'DAWN BLESSING',
      desc:'Sanctify yourself — gain a 30 HP divine barrier before HP next fight.',
      flag:'_dawnBlessing',
      doneText:'✓ Blessed — 30 HP divine barrier ready!',
      btn:"cfClassAction('_dawnBlessing')",
      btnLabel:'🌅 INVOKE DAWN',
    },
    druid:{
      icon:'🌿', title:'WILD ATTUNEMENT',
      desc:'Attune to nature — next Wild Shape gains +50% temp HP and never expires.',
      flag:'_wildAttunement',
      doneText:'✓ Attuned — Wild Shape empowered next fight!',
      btn:"cfClassAction('_wildAttunement')",
      btnLabel:'🌿 ATTUNE TO NATURE',
    },
  };

  const a=actions[cls];
  if(!a)return'';

  // Wizard spell picker
  if(cls==='wizard'&&G._inscribeScrollMenu){
    return cfInscribeScrollMenuHTML();
  }

  const done=!!(cls==='wizard'?G._inscribeScroll:G[a.flag]);
  return`
  <div style="margin-top:18px;border-top:1px solid var(--border);padding-top:14px;">
    <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:#c8a46a;margin-bottom:8px;">${a.icon} ${a.title}</div>
    <div style="font-size:13px;color:var(--dim);margin-bottom:10px;">${a.desc}</div>
    ${done
      ?`<div style="font-size:13px;color:var(--green2);">${a.doneText}</div>`
      :`<button class="btn" style="font-size:9px;padding:9px 20px;" onclick="${a.btn}">${a.btnLabel}</button>`
    }
  </div>`;
}

function cfInscribeScrollMenuHTML(){
  const spells=(CLASSES['wizard'].skills||[]).filter(sk=>sk.slotCost);
  const chosen=G._inscribeScrollSpell;
  return`
  <div style="margin-top:18px;border-top:1px solid var(--border);padding-top:14px;">
    <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:#c8a46a;margin-bottom:8px;">📚 INSCRIBE SCROLL</div>
    ${chosen
      ?`<div style="font-size:13px;color:var(--green2);">✓ Scroll of <strong>${chosen}</strong> ready — casts free next fight!</div>`
      :`<div style="font-size:13px;color:var(--dim);margin-bottom:8px;">Choose a spell to inscribe (costs no slot next fight):</div>
       <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
         ${spells.map(sk=>`<button class="btn" style="font-size:10px;padding:7px 11px;" onclick="cfInscribeScroll('${sk.id}','${sk.name}')">${sk.icon||'📜'} ${sk.name}</button>`).join('')}
       </div>`
    }
  </div>`;
}

function cfInscribeScrollMenu(){
  G._inscribeScrollMenu=true;
  cfRenderTab('rest');
}

function cfInscribeScroll(spellId,spellName){
  G._inscribeScroll=true;
  G._inscribeScrollId=spellId;
  G._inscribeScrollSpell=spellName;
  G._inscribeScrollMenu=false;
  cfRenderTab('rest');
  log('📚 Scroll of '+spellName+' inscribed — one free cast next fight!','s');
}

function cfClassAction(flag){
  if(G[flag])return;
  if(flag==='_bloodOffering'){
    const cost=Math.ceil(G.maxHp*0.15);
    if(G.hp<=cost){
      const el=document.getElementById('restResult');
      if(el){el.textContent='✗ Not enough HP for the offering!';el.style.color='var(--red2)';el.style.display='block';}
      return;
    }
    G.hp-=cost;
    log('💀 Blood Offering: -'+cost+' HP sacrificed. Fury awaits!','c');
  }
  G[flag]=true;
  cfRenderTab('rest');
  const msgs={
    _caseTarget:'🎯 Target cased — enemy DEF reduced next fight!',
    _warReadiness:'🪖 Battle-ready — Second Wind has no cooldown next fight!',
    _oathRenewal:'🕯 Oath renewed — next Divine Smite is a free crit!',
    _bloodOffering:'💀 Blood Offering accepted — rage and power await!',
    _dawnBlessing:'🌅 Dawn Blessing invoked — 30 HP divine barrier next fight!',
    _wildAttunement:'🌿 Wild Attunement — empowered Wild Shape next fight!',
  };
  log(msgs[flag]||'Class action activated.','s');
  renderAll();
}

function cfCraftHTML(){
  const allMats=[
    {id:'herb',icon:'🌿',name:'Dried Herb'},
    {id:'fang',icon:'🦷',name:'Wolf Fang'},
    {id:'bone',icon:'🦴',name:'Bone Fragment'},
    {id:'voidShard',icon:'💎',name:'Void Shard'},
    {id:'ghostEssence',icon:'👻',name:'Ghost Essence'},
    {id:'ironCore',icon:'⚙️',name:'Iron Core'},
    {id:'demonAsh',icon:'🔥',name:'Demon Ash'},
    {id:'frostCrystal',icon:'🧊',name:'Frost Crystal'},
    {id:'celestialDust',icon:'✨',name:'Celestial Dust'},
    {id:'shadowEssence',icon:'🌑',name:'Shadow Essence'},
  ];
  const matCounts={};
  allMats.forEach(m=>matCounts[m.id]=countMaterial(m.id));
  const hasMats=allMats.filter(m=>matCounts[m.id]>0);
  const cats=[
    {k:'basic',l:'🧪 Basic'},
    {k:'advanced',l:'⚗️ Advanced'},
    {k:'legendary',l:'⭐ Legendary'},
  ];
  const _craftCat=window._craftCat||'basic';
  const filtered=CRAFT_RECIPES.filter(r=>r.cat===_craftCat);
  return `<div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:12px;">
      <div>
        <div class="panel-title" style="margin-bottom:8px;">YOUR MATERIALS</div>
        ${hasMats.length?hasMats.map(m=>`
          <div class="mat-item">${m.icon} ${m.name} <span class="mat-qty">×${matCounts[m.id]}</span></div>
        `).join(''):'<div style="font-size:14px;color:var(--dim);padding:4px 0;">No materials yet. Defeat enemies to gather them.</div>'}
      </div>
      <div>
        <div class="panel-title" style="margin-bottom:8px;">RECIPE TIER</div>
        ${cats.map(c=>`<div class="shop-cat ${_craftCat===c.k?'active':''}" style="margin-bottom:4px;display:block;text-align:left;" onclick="window._craftCat='${c.k}';cfRenderTab('craft')">${c.l}</div>`).join('')}
      </div>
    </div>
    <div class="panel-title" style="margin-bottom:8px;">RECIPES</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      ${filtered.map((r,_i)=>{
        const i=CRAFT_RECIPES.indexOf(r);
        const canCraft=Object.entries(r.req).every(([k,v])=>(matCounts[k]||0)>=v);
        const rarColor={common:'#6a5838',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#9b54bd',legendary:'var(--gold)'}[r.result.rarity]||'#888';
        return`<div class="recipe-card ${canCraft?'':'cant'}" onclick="${canCraft?`cfDoCraft(${i})`:''}">
          <div class="recipe-name" style="color:${rarColor}">${r.result.icon} ${r.result.name}</div>
          <div class="recipe-req">${r.desc}</div>
          <div class="recipe-result">${canCraft?'✓ Craft now':'✗ Missing mats'}</div>
        </div>`;
      }).join('')}
    </div>
    <div id="craftResult" style="margin-top:10px;font-size:16px;color:var(--green2);"></div>
  </div>`;
}

