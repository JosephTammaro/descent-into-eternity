
// ══════════════════════════════════════════════════════════
//  PLAYER END TURN
// ══════════════════════════════════════════════════════════
// Sets a skill cooldown by seconds (used from within doSkillEffect for dynamic CDs)
function setCooldown(skillId, seconds){
  G.skillCooldowns[skillId] = Date.now() + seconds * 1000;
}

function playerEndTurn(){
  if(!G.isPlayerTurn||paused)return;
  // Clear Nethrix shuffle and Auranthos blindness — they last exactly 1 player turn
  if(G._nethrixShuffleOrder)delete G._nethrixShuffleOrder;
  if(G._auranthosBlindedBtns)delete G._auranthosBlindedBtns;
  // ── Chroma tracking: wild shape turns ──
  if(G.classId==='druid'&&G.wildShapeActive) G._lifetimeWildShapeTurns=(G._lifetimeWildShapeTurns||0)+1;
  if(G.talents.includes('Storm Call')&&G.currentEnemy&&G.currentEnemy.hp>0){
    const sd=8+G.level;dealToEnemy(sd,false,'Storm Call ⚡');
  }
  setPlayerTurn(false);
}

// ══════════════════════════════════════════════════════════
//  ENEMY TURN
// ══════════════════════════════════════════════════════════
let reactionTimer=null;
let reactionTimerStart=0;   // timestamp when timer started
let reactionTimerRemaining=4000; // ms remaining when paused
let pendingAttackCallback=null;

function doEnemyTurn(){
  if(!G||!G.currentEnemy||paused||G.hp<=0||G._dyingFlag)return;
  const e=G.currentEnemy;

  // Build attack queue: current target first, then all other living enemies
  if(G.currentEnemies&&G.currentEnemies.length>1){
    _enemyAttackQueue = G.currentEnemies.filter(en=>!en.dead&&en.hp>0&&en!==e);
  } else {
    _enemyAttackQueue = [];
  }

  // Blade Dancer: reset consecutive attack stacks on enemy turn
  if(G._bladeDancer&&G._bladeDancerStacks){G._bladeDancerStacks=0;}

  // Tick player conditions — with damage effects
  if(G.conditions.length){
    if(!G.conditionTurns)G.conditionTurns={};
    // Apply tick damage before ticking down
    if(G.conditions.includes('Poisoned')){
      const poisonDmg=3+G.zoneIdx;
      if(typeof _dev_godMode==='undefined'||!_dev_godMode){G.hp-=poisonDmg;spawnFloater(poisonDmg,'dmg',false);}
      AUDIO.sfx.poison();
      log('☠ Poison: '+poisonDmg+' damage!','c');
    }
    if(G.conditions.includes('Burning')){
      const burnDmg=G._crimsonBrand?12:5+G.zoneIdx*2;
      if(typeof _dev_godMode==='undefined'||!_dev_godMode){G.hp-=burnDmg;spawnFloater(burnDmg,'dmg',false);}
      AUDIO.sfx.burn();
      log('🔥 Burning: '+burnDmg+' fire damage!','c');
    }
    if(G.hp<=0){onPlayerDied();return;}
    if(G.hp>0 && G.hp<Math.floor(G.maxHp*0.5)) G._ironmanFlag=false;
    // ── Chroma tracking: cleric below 25% HP (from conditions) ──
    if(G.classId==='cleric'&&G.hp>0&&G.hp<Math.floor(G.maxHp*0.25)) G._droppedBelow25=true;
    // Stunned — skip player turn BEFORE ticking, so a 1-turn stun actually fires
    const wasStunned=G.conditions.includes('Stunned');
    if(wasStunned){
      // Skip player turn — tick stun down NOW so it won't block next turn
      if(!G.conditionTurns)G.conditionTurns={};
      G.conditionTurns['Stunned']=(G.conditionTurns['Stunned']||1)-1;
      if(G.conditionTurns['Stunned']<=0){
        G.conditions=G.conditions.filter(c=>c!=='Stunned');
        delete G.conditionTurns['Stunned'];
        AUDIO.sfx.stun();
        log('💫 Stunned! Turn lost. Stun fades.','c');
      } else {
        log('💫 Stunned! You lose your turn! ('+G.conditionTurns['Stunned']+' turns left)','c');
      }
      // Tick other conditions too (skip 'Stunned' — already handled above)
      G.conditions=G.conditions.filter(c=>{
        if(c==='Stunned')return G.conditionTurns['Stunned']>0; // keep only if turns remain
        if(G.conditionTurns[c]===undefined)G.conditionTurns[c]=2;
        G.conditionTurns[c]--;
        if(G.conditionTurns[c]<=0){log('⚠ '+c+' wears off.','c');delete G.conditionTurns[c];return false;}
        return true;
      });
      renderConditions();
      updateEnemyBar();
      renderAll();
      if(enemyTurnTimeout)clearTimeout(enemyTurnTimeout);
      enemyTurnTimeout=setTimeout(doEnemyTurn,1400);
      return;
    }
    G.conditions=G.conditions.filter(c=>{
      if(G.conditionTurns[c]===undefined)G.conditionTurns[c]=2; // default 2 turns
      G.conditionTurns[c]--;
      if(G.conditionTurns[c]<=0){log('⚠ '+c+' wears off.','c');delete G.conditionTurns[c];return false;}
      return true;
    });
    renderConditions();
    // Vexara Crimson Brand cleanup: clear brand flag when Burning wears off
    if(G._crimsonBrand&&!G.conditions.includes('Burning'))delete G._crimsonBrand;
  }

  // Tick enemy conditions — check effects BEFORE ticking so 1-turn conditions work correctly
  if(e.conditions){
    // Apply damage-over-time to enemy
    const enemyBurning=e.conditions.find(c=>c.name==='Burning'&&c.turns>0);
    const enemyPoisoned=e.conditions.find(c=>c.name==='Poisoned'&&c.turns>0);
    const enemyBleeding=e.conditions.find(c=>c.name==='Bleeding'&&c.turns>0);
    if(enemyBurning){const bd=5+G.zoneIdx*2;e.hp-=bd;updateEnemyBar();log('🔥 '+e.name+' burns: '+bd+' fire damage!','c');if(e.hp<=0){onEnemyDied();return;}}
    if(enemyPoisoned){const pd=3+G.zoneIdx*2;e.hp-=pd;updateEnemyBar();log('☠ '+e.name+' is poisoned: '+pd+' damage!','c');if(e.hp<=0){onEnemyDied();return;}}
    if(enemyBleeding){e.hp-=5;updateEnemyBar();log('🩸 '+e.name+' bleeds: 5 damage!','c');if(e.hp<=0){onEnemyDied();return;}}
    // Cyclone: 1d6 per turn while Restrained
    const enemyRestrained=e.conditions.find(c=>c.name==='Restrained'&&c.turns>0);
    if(enemyRestrained&&e._cycloneDmg){const cd=roll(6);e.hp-=cd;updateEnemyBar();log('🌀 Cyclone: '+cd+' nature damage while Restrained!','c');if(e.hp<=0){onEnemyDied();return;}}
    const restrained=e.conditions.find(c=>c.name==='Restrained'&&c.turns>0);
    e.conditions=e.conditions.filter(c=>{c.turns--;if(c.turns<=0){log(c.name+' on '+e.name+' expires.','c');}return c.turns>0;});
    // Overgrowth: after Restrained expires, enemy must save or get re-rooted (DC escalates each re-application)
    if(!restrained&&e._overgrowthDC&&(!e.conditions||!e.conditions.find(c=>c.name==='Restrained'&&c.turns>0))){
      const escapeSave=roll(20)+Math.floor((e.saveDC||12)-10)+Math.floor((G.zoneIdx||0)*0.75);
      e._overgrowthDC+=1; // DC rises each round
      const dcAttempted=e._overgrowthDC;
      if(escapeSave<dcAttempted){
        addConditionEnemy('Restrained',2);
        log('🌿 Overgrowth: roots reclaim '+e.name+'! (DC'+dcAttempted+', rolled '+escapeSave+')','c');
      } else {
        delete e._overgrowthDC;delete e._cycloneDmg;
        log('🌿 Overgrowth: '+e.name+' breaks free! (DC'+dcAttempted+', rolled '+escapeSave+')','s');
      }
    }
    if(restrained){log(e.name+' is Restrained and loses their action!','c');setPlayerTurn(true);return;}
  }

  // Tick persistent buffs
  if(G.raging){
    G.rageTurns--;
    if(G.rageTurns<=0){
      G.raging=false;
      delete G.skillCooldowns['rage'];
      log('Rage fades — you can rage again.','s');
    }
  }
  // Unlock Wild Shape when buffer depleted
  if(G.wildShapeHp<=0&&G.skillCooldowns['wild_shape']){
    if(G.wildShapeActive) exitWildShape('faded');
    else delete G.skillCooldowns['wild_shape'];
  }
  // Unlock Spiritual Weapon when done (cleric only)
  if(G.classId==='cleric'&&!G.spiritualWeaponActive&&G.skillCooldowns['spiritual_weapon']){
    delete G.skillCooldowns['spiritual_weapon'];
  }

  // ── CAPSTONE PER-TURN EFFECTS ──
  if(G.capstoneUnlocked){
    // Paladin — Avatar of Light: Holy Power regenerates 1 per turn
    if(G.classId==='paladin'&&G.res<G.resMax){G.res=Math.min(G.resMax,G.res+1);log('👼 Avatar of Light: +1 Holy Power','s');}
    // Barbarian — Eternal Rage: Regen 3 HP/turn while raging
    if(G.classId==='barbarian'&&G.raging&&G.hp<G.maxHp){const rh=Math.min(3,G.maxHp-G.hp);G.hp+=rh;spawnFloater(rh,'heal',false);log('🔥 Eternal Rage: regen +'+rh+' HP','s');}
    // Cleric — Vessel of the Divine: Devotion regens 1/turn
    if(G.classId==='cleric'&&G.res<G.resMax){G.res=Math.min(G.resMax,G.res+1);log('🕊️ Vessel of the Divine: +1 Devotion','s');}
    // Druid — The Green: Nature's Charge regens 1/turn
    if(G.classId==='druid'&&G.res<G.resMax){G.res=Math.min(G.resMax,G.res+1);log('🌍 The Green: +1 Nature\'s Charge','s');}
    // Fighter — Unbreakable: below 25% HP auto +50 Momentum and next attack crits (once per fight)
    if(G.classId==='fighter'&&G.hp<G.maxHp*0.25&&!G._unbreakableEmergencyUsed){
      G._unbreakableEmergencyUsed=true;G.res=Math.min(G.resMax,G.res+50);G._unbreakableAutoCrit=true;
      log('🔱 Unbreakable! +50 Momentum and next attack will crit!','s');
    }
  }
  renderHUD();

  // ── LEGENDARY GRACE PER-TURN EFFECTS ──
  // Eternal Bastion: regen 2 HP/turn
  if(G._graceBastion&&G.hp<G.maxHp){const rh=Math.min(2,G.maxHp-G.hp);G.hp+=rh;spawnFloater(rh,'heal',false);log('❤️ Eternal Bastion: +'+rh+' HP','s');renderHUD();}

  // ── MALVARIS — Grief Aura: -1 resource per turn (passive) ──
  if(e.id==='malvaris'&&G.res>0){
    G.res=Math.max(0,G.res-1);
    log('🌑 Grief Aura: −1 '+(typeof CLASSES!=='undefined'&&CLASSES[G.classId]?CLASSES[G.classId].res||'resource':'resource'),'c');
  }

  // ── BOSS PHASE 2 TRIGGER ──
  if(e.isBoss&&e.phase2&&!e.phaseTriggered&&e.hp<=Math.floor(e.maxHp*0.5)){
    e.phaseTriggered=true;
    e.atk+=e.phase2.atkBonus||0;
    // Rename boss with Phase II suffix
    e.displayName = e.name + ' — Phase II';
    AUDIO.sfx.bossEnrage();
    log('','s');
    log('💀 '+e.name.toUpperCase()+' — PHASE II!','e');
    log('⚡ '+e.phase2.name+' — specials every 2 rounds, +'+e.phase2.atkBonus+' ATK!','e');
    log('','s');
    // Permanent rage glow on enemy sprite
    const eEl=document.getElementById('enemySprite');
    if(eEl){
      eEl.classList.add('phase2-glow');
    }
    // Update name tag to show Phase II
    const nameTag=document.getElementById('enemyNameTag');
    if(nameTag){
      const lvlBadge=`<span style="font-size:11px;color:var(--dim);margin-left:6px;">Lv.${e.effectiveLvl}</span>`;
      nameTag.innerHTML=`⚠ ${e.displayName}${lvlBadge}`;
      nameTag.classList.add('phase2-name-tag');
      nameTag.style.animation='phase2-name-pulse 1.5s infinite';
    }
    // Show dramatic Phase II overlay
    showPhase2Overlay(e.name, e.phase2.name);
    if(typeof triggerPhase2Zoom==='function') triggerPhase2Zoom();
    if(typeof triggerScreenShake==='function') triggerScreenShake('boss');
  }

  // ── THORNWARDEN REGEN — stops when phase 2 triggers ──
  if(e.regen&&!e.phaseTriggered&&e.hp<e.maxHp){
    const rh=Math.min(e.regen,e.maxHp-e.hp);
    e.hp+=rh;
    updateEnemyBar();
    spawnFloater(rh,'heal',true);
    log('🌿 '+e.name+' regenerates '+rh+' HP!','c');
  }

  // ── GRAKTHAR — Rally the Garrison at 60% HP ──
  if(e.id==='grakthar'&&!e._rallyUsed&&e.hp<=e.maxHp*0.6){
    e._rallyUsed=true;
    const soldier={id:'garrison_soldier',name:'Garrison Soldier',sprite:'skeleton',color:'#8a6a5a',
      hp:50,maxHp:50,atk:16,def:4,xp:0,gold:0,isUndead:true,_isGarrisonSoldier:true};
    spawnBossAdd(soldier);
    e._rallyDefBonus=4;e.def+=4;
    AUDIO.sfx.bossSpecial();
    if(typeof triggerScreenShake==='function')triggerScreenShake('boss');
    log('⚔ Grakthar rallies the garrison! A Garrison Soldier joins the fight!','e');
    log('🛡 Grakthar +4 DEF while the soldier stands!','e');
  }

  // ── VEXARA — Crimson Brand on brandRound ──
  if(e.brandRound&&G.roundNum===e.brandRound&&!e._brandApplied){
    e._brandApplied=true;
    G._crimsonBrand=true;
    addCondition('Burning',4);
    AUDIO.sfx.burn();
    if(typeof triggerScreenShake==='function')triggerScreenShake('boss');
    log('🔥 CRIMSON BRAND! Vexara\'s mark sears into your flesh!','e');
    log('🔥 Burning for 4 turns — 12 damage per turn! No save!','e');
    afterEnemyActs();return;
  }

  // ── NETHRIX — Memory Flood every 4 rounds ──
  if(e.id==='nethrix'&&G.roundNum>0&&G.roundNum%4===0){
    const panels=['actionSkills','bonusSkills','reactionSkills'];
    G._nethrixShuffleOrder={};
    panels.forEach(panelId=>{
      const el=document.getElementById(panelId);
      if(!el)return;
      const count=el.children.length;
      if(count<=1)return;
      const indices=Array.from({length:count},(_,i)=>i);
      for(let i=indices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[indices[i],indices[j]]=[indices[j],indices[i]];}
      G._nethrixShuffleOrder[panelId]=indices;
    });
    if(typeof triggerScreenShake==='function')triggerScreenShake('hit');
    log('🧠 Memory Flood! Your skills scramble — trust your instincts!','e');
  }

  // ── ZARETH — Abyssal Charge trigger at 40% HP ──
  if(e.id==='zareth'&&!e._chargeUsed&&!e._chargingBlast&&e.hp<=e.maxHp*0.4){
    e._chargeUsed=true;e._chargingBlast=2;
    AUDIO.sfx.bossSpecial();
    if(typeof triggerScreenShake==='function')triggerScreenShake('boss');
    log('💀 Zareth draws all abyssal energy inward — something terrible is building...','e');
  }
  // Zareth — Abyssal Charge countdown / fire
  if(e.id==='zareth'&&e._chargingBlast>0){
    e._chargingBlast--;
    if(e._chargingBlast===0){
      const blastDmg=Math.ceil(G.maxHp*0.6);
      log('💀 ABYSSAL BLAST — Zareth unleashes everything! ('+blastDmg+' dmg)','e');
      if(typeof triggerScreenShake==='function')triggerScreenShake('boss');
      AUDIO.sfx.bossSpecial();
      showReactionPrompt('💀 ABYSSAL BLAST — REACT?',
        ()=>{dealDamageToPlayer(blastDmg,'Abyssal Blast');afterEnemyActs();},
        ()=>{dealDamageToPlayer(blastDmg,'Abyssal Blast');afterEnemyActs();}
      );
      return;
    }
    log('⚡ Zareth is charging the blast... ('+e._chargingBlast+' turn'+(e._chargingBlast===1?'':'s')+' remaining)','e');
    afterEnemyActs();return;
  }

  // ── VALDRIS — Frozen Bulwark at 65% HP ──
  if(e.id==='valdris'&&!e._bulwarkUsed&&e.hp<=e.maxHp*0.65){
    e._bulwarkUsed=true;
    const mkSoldier=()=>({id:'frozen_soldier',name:'Frozen Soldier',sprite:'zombie',color:'#aabbcc',
      hp:70,maxHp:70,atk:30,def:10,xp:0,gold:0,_isFrozenSoldier:true});
    spawnBossAdd(mkSoldier());spawnBossAdd(mkSoldier());
    AUDIO.sfx.bossSpecial();
    if(typeof triggerScreenShake==='function')triggerScreenShake('boss');
    log('❄ Valdris summons 2 Frozen Soldiers! While they stand, Valdris takes 50% reduced damage!','e');
  }
  // Valdris — Last Stand at 30% HP
  if(e.id==='valdris'&&!e._lastStand&&e.hp<=e.maxHp*0.3){
    e._lastStand=true;
    e.atk=Math.ceil(e.atk*1.25);
    if(typeof triggerScreenShake==='function')triggerScreenShake('boss');
    log('💢 VALDRIS LAST STAND! Fury incarnate — +25% ATK for the rest of the fight!','e');
  }

  // ── AURANTHOS — Divine Blindness ──
  if(e.id==='auranthos'&&G.roundNum>0){
    const blindInterval=e.phaseTriggered?2:3;
    if(G.roundNum%blindInterval===0){
      const allBtns=Array.from(document.querySelectorAll('.skill-btn'));
      if(allBtns.length>=2){
        const indices=[];
        while(indices.length<2){const i=Math.floor(Math.random()*allBtns.length);if(!indices.includes(i))indices.push(i);}
        G._auranthosBlindedBtns=indices;
        log('👁 Divine Blindness! Two of your skills are hidden from memory...','e');
      }
    }
  }

  // ── MALVARIS — Shadow Split at 50% HP ──
  if(e.id==='malvaris'&&!e._splitUsed&&e.hp<=e.maxHp*0.5){
    e._splitUsed=true;
    e._isRealEmpress=true;
    // Shadow inherits Malvaris's current HP + sprite so they look identical
    // Only the faint gold border on the real Empress tells them apart
    const shadow={id:'malvaris_shadow',name:'Shadow of the Empress',
      sprite:e.sprite||'nethrix',color:e.color||'#220033',
      hp:e.hp,maxHp:e.maxHp,atk:Math.ceil(e.atk*0.7),def:0,xp:0,gold:0,
      _usesBossSprite:true,ignoresArmor:true,_isShadowCopy:true};
    spawnBossAdd(shadow);
    AUDIO.sfx.bossSpecial();
    if(typeof triggerScreenShake==='function')triggerScreenShake('boss');
    log('🌑 Malvaris SPLITS! A Shadow copy emerges from the dark!','e');
    log('⚠ Kill the Shadow and the Empress heals 20% HP. Find the real one — she glows gold.','e');
  }
  // Malvaris — Soul Drain at 25% HP
  if(e.id==='malvaris'&&!e._soulDrainUsed&&e.hp<=e.maxHp*0.25){
    e._soulDrainUsed=true;
    const drained=Math.ceil(G.res/2);
    G.res=Math.max(0,G.res-drained);
    log('🌑 SOUL DRAIN! The Empress tears '+drained+' resource'+(drained===1?'':'s')+' from your very soul!','e');
    if(typeof triggerScreenShake==='function')triggerScreenShake('boss');
    AUDIO.sfx.bossSpecial();
    if(typeof renderHUD==='function')renderHUD();
  }

  // Zareth: during charge countdown, skip all attack/special logic
  if(e.id==='zareth'&&e._chargingBlast>0){afterEnemyActs();return;}

  // Boss special — every 2 rounds in phase 2, every 3 in phase 1
  const specialInterval=e.isBoss&&e.phaseTriggered?2:3;
  const justTriggeredPhase2 = e.isBoss&&e.phase2&&e.phaseTriggered&&!e._phase2ReactionDelay;
  if(e.isBoss&&G.roundNum>0&&G.roundNum%specialInterval===0&&(e.special||e.phase2)){
    const usePhase2=e.phaseTriggered&&e.phase2;
    if(justTriggeredPhase2){
      // Phase 2 JUST triggered this turn — delay the reaction until overlay clears (2.7s)
      e._phase2ReactionDelay=true;
      setTimeout(()=>{
        if(!G.currentEnemy||G.currentEnemy.hp<=0)return;
        showReactionPrompt('⚡ BOSS SPECIAL INCOMING — REACT?', ()=>doBossSpecial(e,usePhase2), ()=>doBossSpecial(e,usePhase2));
      }, 2700);
    } else {
      showReactionPrompt('⚡ BOSS SPECIAL INCOMING — REACT?', ()=>doBossSpecial(e,usePhase2), ()=>doBossSpecial(e,usePhase2));
    }
  } else {
    showReactionPrompt('⚡ INCOMING ATTACK — REACT?', ()=>doEnemyAttack(e), ()=>doEnemyAttack(e));
  }
}

function showReactionPrompt(title, onReact, onSkip){
  const cls=CLASSES[G.classId];
  const reactions=cls.skills.filter(s=>s.type==='reaction');
  const now=Date.now();

  // Determine if this is a boss special prompt (title contains BOSS SPECIAL)
  const isBossSpecialPrompt=title.includes('BOSS SPECIAL');
  // Filter to usable reactions
  const available=reactions.filter(sk=>{
    if(G.reactionUsed)return false;
    if(sk.charges&&(G.skillCharges[sk.id]||0)<=0)return false;
    const cdRaw=G.skillCooldowns[sk.id];
    if(cdRaw==='active'||(typeof cdRaw==='number'&&cdRaw>now))return false;
    if(sk.cost>0&&G.res<sk.cost)return false;
    if(sk.slotCost&&(!G.spellSlots||(G.spellSlots[sk.slotCost]||0)===0))return false;
    // Counterspell only valid against boss specials
    if(sk.effect==='counterspell'&&!isBossSpecialPrompt)return false;
    return true;
  });

  // If no reactions available, skip prompt
  if(!available.length){onSkip();return;} // onSkip leads to afterEnemyActs already

  const prompt=document.getElementById('reactPrompt');
  const btnsEl=document.getElementById('reactPromptBtns');
  document.getElementById('reactPromptTitle').textContent=title;

  btnsEl.innerHTML=available.map(sk=>
    `<button class="react-btn" onclick="useReaction('${sk.id}')">${sk.icon} ${sk.name}<br><span style="color:var(--dim);font-size:9px;">${sk.desc}</span></button>`
  ).join('')+`<button class="react-btn skip" onclick="skipReaction()">Skip</button>`;

  prompt.style.display='block';

  // Store what happens after reaction window
  pendingAttackCallback=onReact; // will be called after reaction fires or skip
  window._skipCallback=onSkip;

  // Timer: 4 seconds
  const fill=document.getElementById('reactTimerFill');
  fill.style.transition='none';
  fill.style.width='100%';
  fill.offsetHeight; // reflow
  fill.style.transition='width 4s linear';
  fill.style.width='0%';

  if(reactionTimer)clearTimeout(reactionTimer);
  reactionTimerStart=Date.now();
  reactionTimerRemaining=4000;
  reactionTimer=setTimeout(()=>{skipReaction();},4000);
}

function useReaction(skillId){
  checkObjectiveProgress('reaction_used',skillId);
  hideReactionPrompt();
  const cls=CLASSES[G.classId];
  const sk=cls.skills.find(s=>s.id===skillId);
  if(!sk)return;
  const now=Date.now();
  if(sk.cost>0)G.res-=sk.cost;
  if(sk.slotCost&&G.spellSlots)G.spellSlots[sk.slotCost]=Math.max(0,(G.spellSlots[sk.slotCost]||0)-1);
  if(sk.cd>0)G.skillCooldowns[sk.id]=now+sk.cd*1000;
  if(sk.charges&&G.skillCharges[sk.id]>0)G.skillCharges[sk.id]--;
  G.reactionUsed=true;
  // Apply reaction effect (sets sx flags that doEnemyAttack reads)
  doSkillEffect(sk.effect, sk);
  // If reaction killed the enemy (e.g. retaliation/beast counter), cancel the pending attack
  // and restore the UI — onEnemyDied already ran and showed nextEnemyBtn
  if(!G||!G.currentEnemy||G.currentEnemy.hp<=0){
    pendingAttackCallback=null;
    window._skipCallback=null;
    // Make sure nextEnemyBtn is visible and endTurnBtn is hidden
    const neb=document.getElementById('nextEnemyBtn');
    const etb=document.getElementById('endTurnBtn');
    if(neb&&neb.style.display==='none'){neb.style.display='block';}
    if(etb&&etb.style.display!=='none'){etb.style.display='none';}
    return;
  }
  // Enemy still alive — fire the incoming attack (it calls afterEnemyActs internally)
  if(pendingAttackCallback){pendingAttackCallback();pendingAttackCallback=null;}
}

function skipReaction(){
  hideReactionPrompt();
  if(window._skipCallback){window._skipCallback();window._skipCallback=null;}
  pendingAttackCallback=null;
  // NOTE: do NOT call afterEnemyActs() here — doEnemyAttack/doBossSpecial already do it
}

function hideReactionPrompt(){
  if(reactionTimer){clearTimeout(reactionTimer);reactionTimer=null;}
  reactionTimerStart=0;reactionTimerRemaining=4000;
  document.getElementById('reactPrompt').style.display='none';
}

// Pause-aware reaction timer: freeze remaining time without hiding the prompt
function pauseReactionTimer(){
  if(!reactionTimer)return;
  const elapsed=Date.now()-reactionTimerStart;
  reactionTimerRemaining=Math.max(0,reactionTimerRemaining-elapsed);
  clearTimeout(reactionTimer);reactionTimer=null;
  // Freeze the CSS timer bar
  const fill=document.getElementById('reactTimerFill');
  if(fill){
    const pct=(reactionTimerRemaining/4000)*100;
    fill.style.transition='none';
    fill.style.width=pct+'%';
  }
}

function resumeReactionTimer(){
  const prompt=document.getElementById('reactPrompt');
  if(!prompt||prompt.style.display==='none')return;
  if(reactionTimerRemaining<=0){skipReaction();return;}
  // Resume CSS timer bar animation
  const fill=document.getElementById('reactTimerFill');
  if(fill){
    fill.offsetHeight; // reflow
    fill.style.transition='width '+(reactionTimerRemaining/1000)+'s linear';
    fill.style.width='0%';
  }
  reactionTimerStart=Date.now();
  reactionTimer=setTimeout(()=>{skipReaction();},reactionTimerRemaining);
}

// Tracks which enemies have attacked this turn
let _enemyAttackQueue = [];

function afterEnemyActs(){
  if(!G)return;
  // Player dead — onPlayerDied handles everything
  if(G.hp<=0||G._dyingFlag)return;
  // Enemy died during attack (e.g. Paladin reflect) — check if others remain
  if(G.currentEnemy&&G.currentEnemy.hp<=0){
    // Mark dead and let the queue continue
    G.currentEnemy.dead=true;
    G.currentEnemy=null;
  }

  // Multi-enemy: process next enemy in attack queue
  if(_enemyAttackQueue.length>0){
    const next=_enemyAttackQueue.shift();
    if(!next||next.dead||next.hp<=0){
      afterEnemyActs(); // skip dead/killed, recurse to next
      return;
    }
    G.currentEnemy=next;
    G.targetIdx=G.currentEnemies.indexOf(next);
    updateEnemyBar();
    // Short delay between each enemy's attack for readability
    setTimeout(()=>{
      if(!G||G.hp<=0||G._dyingFlag)return;
      showReactionPrompt('⚡ '+next.name.toUpperCase()+' ATTACKS — REACT?', ()=>doEnemyAttack(next), ()=>doEnemyAttack(next));
    }, 600);
    return;
  }

  // All enemies have attacked — restore target to first living enemy, give player turn
  if(G.currentEnemies&&G.currentEnemies.length>0){
    const firstAlive=G.currentEnemies.find(e=>!e.dead&&e.hp>0);
    if(firstAlive){
      G.targetIdx=G.currentEnemies.indexOf(firstAlive);
      G.currentEnemy=firstAlive;
      updateEnemyBar();
    }
  }

  setPlayerTurn(true);
}

// ── Wild Shape exit helper (consolidated from 4 duplicate blocks) ──
function exitWildShape(reason){
  G.wildShapeHp=0;
  G.wildShapeActive=false;
  delete G.skillCooldowns['wild_shape'];
  // Restore human stats if saved
  if(G._humanStats){
    G.stats.str=G._humanStats.str;
    G.stats.con=G._humanStats.con;
    G.atk=G._humanStats.atk;
    G.def=G._humanStats.def;
    G._humanStats=null;
  }
  // Clamp HP to maxHp in case bear form buffs changed HP beyond human limits
  G.hp=Math.min(G.hp,G.maxHp);
  const wasElemental=G._elementalForm;
  G._elementalForm=false;
  G._elementalImmune=false;
  // Restore druid sprite
  const pSpr=document.getElementById('playerSprite');
  const _cid=G.classId||'druid';
  if(pSpr){
    if(window.hasImageSprite && window.hasImageSprite(_cid)){
      window.renderImageSprite(_cid, 'idle', 0, pSpr, 260);
    } else if(CLASS_SPRITES[_cid]){
      renderSprite(CLASS_SPRITES[_cid],13,pSpr);
    }
  }
  if(pSpr)pSpr.style.filter='';
  const exitBtn=document.getElementById('exitWildShapeBtn');
  if(exitBtn)exitBtn.style.display='none';
  if(typeof swapBearBars==='function')swapBearBars(false);
  if(typeof startPlayerAnim==='function')startPlayerAnim();
  // Log appropriate message
  if(reason==='broken'){
    log(wasElemental?'🔥 Elemental form dispersed! Druid restored.':'🌿 Bear form broken! Stats restored.','c');
  } else if(reason==='broken_by'){
    // caller will log with source name
  } else {
    log('🌿 Wild Shape fades — druid form restored.','s');
  }
  // Wild Surge: deal 1d6 nature damage on exit
  if(G._wildSurge&&G.currentEnemy&&G.currentEnemy.hp>0){
    const wsd=roll(6);
    dealToEnemy(wsd,false,'Wild Surge 🌿 exit burst');
    log('🌿 Wild Surge: +'+wsd+' nature damage on exit!','c');
  }
}

function doEnemyAttack(e){
  if(!e||!G)return;
  // ── Rare Event: Allied Skeletons absorb one hit each ──
  if(G._rareEventFlags.alliedSkeletons&&G._rareEventFlags.alliedSkeletons>0){
    G._rareEventFlags.alliedSkeletons--;
    AUDIO.sfx.block();
    log('💀 Skeleton guard absorbs the attack! ('+G._rareEventFlags.alliedSkeletons+' left)','s');
    if(G._rareEventFlags.alliedSkeletons<=0) delete G._rareEventFlags.alliedSkeletons;
    if(typeof renderCompanions==='function') renderCompanions();
    afterEnemyActs();return;
  }
  // ── Rare Event: Frozen Soldier absorbs hits ──
  if(G._rareEventFlags.frozenSoldier&&G._rareEventFlags.frozenSoldier.zoneIdx===G.zoneIdx&&G._rareEventFlags.frozenSoldier.hp>0){
    const soldierDmg=Math.max(1,e.atk+roll(4)-2-5); // soldier has some armor
    G._rareEventFlags.frozenSoldier.hp-=soldierDmg;
    AUDIO.sfx.block();
    if(G._rareEventFlags.frozenSoldier.hp<=0){
      G._rareEventFlags.frozenSoldier.hp=0;
      log('💀 Frozen Soldier takes '+soldierDmg+' damage and falls! They salute one last time.','c');
    } else {
      log('💀 Frozen Soldier takes '+soldierDmg+' damage! ('+G._rareEventFlags.frozenSoldier.hp+' HP left)','s');
    }
    if(typeof renderCompanions==='function') renderCompanions();
    afterEnemyActs();return;
  }
  // ── Rare Event: Divine Evasion (first attack auto-dodge) ──
  if(G._divineEvasionReady){
    delete G._divineEvasionReady;
    AUDIO.sfx.miss();
    log('👁 Divine Sight: you foresaw this attack — dodged!','s');
    if(typeof renderCompanions==='function') renderCompanions();
    afterEnemyActs();return;
  }
  if(G.sx.divineShield||G.sx.divineShieldCharges>0){
    AUDIO.sfx.block();
    if(G.sx.divineShieldCharges>0){
      G.sx.divineShieldCharges--;
      if(G.sx.divineShieldCharges<=0)delete G.sx.divineShieldCharges;
      log(e.name+' attacks — DAWN\'S SHIELD blocks it! ('+(G.sx.divineShieldCharges||0)+' charges left)','s');
    } else {
      delete G.sx.divineShield;
      log(e.name+' attacks — DIVINE SHIELD blocks it!','s');
    }
    afterEnemyActs();return;
  }
  if(G.sx.beastBlock){
    delete G.sx.beastBlock;
    AUDIO.sfx.block();
    log("Beast's Aid: companion takes the hit for you!",'s');
    // Evasion Focus: gain 1 Focus when beast blocks
    if(G.classId==='ranger'&&G._evasionFocus){G.res=Math.min(G.resMax,G.res+1);log('🌀 Evasion: +1 Focus from beast block!','s');}
    if(G.sx.beastRetaliate){
      delete G.sx.beastRetaliate;
      const retDmg=roll(6)+Math.floor(G.level/2);
      if(G.currentEnemy){G.currentEnemy.hp-=retDmg;updateEnemyBar();log('🐺 Companion retaliates: '+retDmg+' damage!','p');}
      if(G.currentEnemy&&G.currentEnemy.hp<=0){onEnemyDied();return;}
    }
    afterEnemyActs();
    return;
  }

  // Vanishing Act — untargetable
  if(G.sx&&G.sx.vanishing>0){
    G.sx.vanishing--;
    log('🌑 Vanishing Act: attack passes through you! ('+G.sx.vanishing+' rounds left)','s');
    if(G.sx.vanishing<=0)delete G.sx.vanishing;
    afterEnemyActs();
    return;
  }
  // Shadow Form: auto-dodge once per fight
  if(G.classId==='rogue'&&G._shadowForm&&!G._shadowFormUsed){
    G._shadowFormUsed=true;
    AUDIO.sfx.miss();
    log('🌑 Shadow Form: attack passes through you! (once per fight)','s');
    if(G._opportunist){G.res=Math.min(G.resMax,G.res+1);log('🕵️ Opportunist: +1 Combo!','s');}
    afterEnemyActs();
    return;
  }
  // Blur: 20% dodge chance for turns after Cunning Action
  if(G.classId==='rogue'&&G.sx&&G.sx.blur&&G.sx.blur.turns>0&&Math.random()<0.2){
    G.sx.blur.turns--;
    if(G.sx.blur.turns<=0)delete G.sx.blur;
    AUDIO.sfx.miss();
    log('🌀 Blur: attack missed! ('+(G.sx.blur?G.sx.blur.turns:0)+' turns left)','s');
    if(G.classId==='rogue'&&G._opportunist){G.res=Math.min(G.resMax,G.res+1);log('🕵️ Opportunist: +1 Combo!','s');}
    afterEnemyActs();
    return;
  }
  if(G.sx&&G.sx.blur){G.sx.blur.turns--;if(G.sx.blur.turns<=0)delete G.sx.blur;}
  // Mirror Image — 33% chance per image to intercept hit
  if(G.mirrorImages>0){
    if(Math.random()<0.33){
      G.mirrorImages--;
      AUDIO.sfx.mirrorImage();
      log('🪞 Mirror Image intercepts the attack! ('+G.mirrorImages+' copies left)','s');
      // Flash Freeze: copy destruction Slows enemy (-4 DEF)
      if(G.classId==='wizard'&&G._flashFreeze&&G.currentEnemy){
        G.currentEnemy.def=Math.max(0,(G.currentEnemy.def||0)-4);
        log('🧊 Flash Freeze: enemy Slowed! -4 DEF','c');
      }
      renderAll();
      afterEnemyActs();
      return;
    }
    if(G.mirrorImages===0)log('All mirror images are gone.','s');
  }
  // Blink — 75% chance to negate
  if(G.sx.blink){
    delete G.sx.blink;
    if(Math.random()<0.75){
      AUDIO.sfx.blink();
      log('💫 Blink! You phase out — attack misses entirely!','s');
      afterEnemyActs();
      return;
    } else {
      log('💫 Blink failed — caught mid-phase!','s');
    }
  }

  // ── Phase B: Thick Fog — 12% miss chance (enemy misses player) ──
  if(G._activeModifier && G._activeModifier.effects.missChance && Math.random() < G._activeModifier.effects.missChance){
    AUDIO.sfx.miss();
    log('🌫️ '+e.name+'\'s attack vanishes into the fog!','s');
    afterEnemyActs();return;
  }

  // ── Intent: DEFENDING — halve damage, grant temp DEF boost ──
  if(e._intent==='defending'){
    e._defBoost=Math.ceil((e.def||0)*0.5);
    log('🛡 '+e.name+' braces for impact! (-50% dmg, +DEF this round)','c');
  } else {
    delete e._defBoost;
  }

  let dmg=e.atk+roll(4)-2;
  if(e._intent==='defending') dmg=Math.ceil(dmg*0.5);
  if(e._intent==='poisoning'||e._intent==='burning'||e._intent==='stunning') dmg=Math.ceil(dmg*0.75);
  // Rare Event: Cursed Forge — all enemies deal +10% damage
  if(G._rareEventFlags.cursedForge) dmg=Math.ceil(dmg*1.10);
  // ── Phase B: Zone modifier enemy damage multipliers ──
  if(G._activeModifier){
    const fx=G._activeModifier.effects;
    if(fx.enemyDmgMult) dmg=Math.ceil(dmg*fx.enemyDmgMult); // Bloodmoon, Bounty, Bloodlust
    if(fx.playerTakenMult) dmg=Math.ceil(dmg*fx.playerTakenMult); // Glass Cannon
    // Ancestral Fury: enemies +1% dmg per player kill stack
    if(fx.enemyDmgPerStack && G._ancestralStacks > 0)
      dmg=Math.ceil(dmg*(1+G._ancestralStacks*fx.enemyDmgPerStack));
    // Cursed Ground: enemy Weakened status
    if(e._weakened && e._weakened > 0){ dmg=Math.ceil(dmg*0.85); e._weakened--; }
    // Volatile: enemies get occasional crits (10% chance, +50% dmg)
    if(fx.critDmgMult && Math.random() < 0.10){
      dmg=Math.ceil(dmg*fx.critDmgMult);
      log('💥 '+e.name+' lands a critical strike!','c');
    }
  }
  // Legendary Grace — Immortal Aegis: 10% chance to fully block attack
  if(G._graceAegis&&Math.random()<0.10){AUDIO.sfx.block();log('🛡️ Immortal Aegis: attack fully blocked!','s');afterEnemyActs();return;}
  // G.def already includes armor/offhand from applyItemStats — don't add again
  G.upgrades.filter(u=>u.bought&&u.eff==='def').forEach(u=>dmg-=u.val);
  // Legendary Grace — The Unbroken: +50% DEF below 25% HP
  const unbrokenDef=G._graceUnbroken&&G.hp<G.maxHp*0.25?Math.floor(G.def*0.5):0;
  const effectiveDef=G.def+unbrokenDef+(G.raging&&G.classId==='barbarian'&&G._stoneSkin?10:0)+(G.classId==='cleric'&&G._spiritualArmor&&G.spiritualWeaponActive?4:0);
  dmg=Math.max(1,dmg-Math.floor(effectiveDef/4));
  // Sanctuary: reduce all incoming damage by flat amount
  if(G._sanctuary)dmg=Math.max(1,dmg-G._sanctuary);
  if(G.raging&&G.classId==='barbarian')dmg=Math.ceil(dmg*.5);
  // Death's Door: below 20% HP, auto-activate Rage for free each turn
  if(G.classId==='barbarian'&&G._deathsDoor&&!G.raging&&G.hp<G.maxHp*0.2){
    G.raging=true;
    G.rageTurns=G._classSetBonus==='barbarian_set'?999:6+(G.talents.includes('Endless Rage')?2:0);
    log("💀 Death's Door: Rage ignites automatically!",'s');
  }
  if(G.sx.parry){
    // Phantasm: uncanny dodge reduces by 75% instead of 50%
    const parryMult=(G.sx.phantasm)?0.25:0.5;
    delete G.sx.phantasm;
    dmg=Math.ceil(dmg*parryMult);delete G.sx.parry;log('Parry/Dodge reduced damage!','s');
    // Bulwark: parry counter-damages for 5+STR
    if(G.classId==='fighter'&&G._bulwark&&G.currentEnemy&&G.currentEnemy.hp>0){
      const bulwarkDmg=5+Math.max(0,md(G.stats.str||10));
      dealToEnemy(bulwarkDmg,false,'Bulwark 🏰 counter');
      log('🏰 Bulwark: '+bulwarkDmg+' counter-damage!','s');
    }
  }
  if(G.sx.evasion){dmg=0;delete G.sx.evasion;AUDIO.sfx.miss();log('Evaded the attack!','s');
    // Opportunist: gain 1 Combo Point when enemy misses
    if(G.classId==='rogue'&&G._opportunist){G.res=Math.min(G.resMax,G.res+1);log('🕵️ Opportunist: +1 Combo!','s');}
    // Evasion Focus: gain 1 Focus when dodging
    if(G.classId==='ranger'&&G._evasionFocus){G.res=Math.min(G.resMax,G.res+1);log('🌀 Evasion: +1 Focus!','s');}
  }
  // Frightened amplifies incoming damage — apply before Wild Shape absorbs it
  if(G.conditions.includes('Frightened'))dmg=Math.ceil(dmg*1.15);
  // Berserker subclass: Mindless Rage — immune to Frightened while raging
  if(G.classId==='barbarian'&&G.subclassUnlocked&&G.raging&&G.conditions.includes('Frightened')){
    dmg=Math.ceil(dmg/1.15); // undo the penalty
    log('Mindless Rage: Frightened has no effect while raging!','s');
  }
  if(G.wildShapeHp>0){
    // Ancient Bark: reduce damage by 6 while in Wild Shape
    if(G._ancientBark)dmg=Math.max(0,dmg-6);
    const absorbed=Math.min(G.wildShapeHp,dmg);
    G.wildShapeHp-=absorbed;dmg-=absorbed;
    // Always show floater + hit animation for bear damage
    spawnFloater(absorbed,'dmg',false);
    AUDIO.sfx.playerHit();
    animEl('enemySprite','enemy-attack-anim',400);
    animEl('playerSprite','hit-anim',300);
    if(window.Anim){Anim.enemyAttack();Anim.playerHit();}
    if(G.wildShapeHp<=0){
      exitWildShape('broken');
    } else {
      log((G._elementalForm?'🔥 Elemental form absorbed ':'🐻 Bear form absorbed ')+absorbed+'! ('+Math.ceil(G.wildShapeHp)+' bear HP left)','s');
    }
    renderHUD();
  }

  if(dmg>0){
    if(typeof _dev_godMode==='undefined'||!_dev_godMode){
    G.hp-=dmg;
    G._fightDamageTaken=true;
    if(G.hp>0 && G.hp<Math.floor(G.maxHp*0.5)) G._ironmanFlag=false;
    // ── Chroma tracking: cleric below 25% HP ──
    if(G.classId==='cleric'&&G.hp>0&&G.hp<Math.floor(G.maxHp*0.25)) G._droppedBelow25=true;
    }
    spawnFloater(dmg,'dmg',false);
    AUDIO.sfx.playerHit();
    log(e.name+' attacks: '+dmg+' damage','e');
    animEl('enemySprite','enemy-attack-anim',400);
    animEl('playerSprite','hit-anim',300);
    if(window.Anim){Anim.enemyAttack();Anim.playerHit();}
    // Rare Event: Stranger's Satchel auto-trigger at <25% HP
    if(G._rareEventFlags.satchelSaved&&G.hp>0&&G.hp<Math.floor(G.maxHp*0.25)){
      delete G._rareEventFlags.satchelSaved;
      G.hp=G.maxHp;
      // +5 to lowest offensive/defensive stat (class-aware)
      const isSatchelCaster = typeof CASTER_CLASSES!=='undefined' && CASTER_CLASSES.includes(G.classId);
      const offensiveStat = isSatchelCaster ? (getSpellPower()) : G.atk;
      if(offensiveStat <= G.def){
        addOffensiveStat(G, 5);
        log('📦 The Stranger\'s Satchel bursts open! Full heal + '+getOffensiveStatLabel(G)+' +5!','l');
      } else {
        G.def += 5;
        log('📦 The Stranger\'s Satchel bursts open! Full heal + DEF +5!','l');
      }
      if(typeof renderHUD==='function') renderHUD();
      if(typeof renderCompanions==='function') renderCompanions();
    }
    if(G.hp<=0){onPlayerDied();return;}
    if(G.concentrating==='hunters_mark'&&G.hunterMarked){
      // Warden's Call set bonus: Hunter's Mark is unbreakable
      if(G._classSetBonus==='ranger_set'){
        log("✦ Warden's Call: Hunter's Mark cannot be broken!",'l');
      } else {
        const concSave=roll(20)+md(G.stats.con);
        const concDC=Math.max(10,Math.floor(dmg/2));
        const bonusSave=G.talents.includes('Marked Prey')?3:0;
        if((concSave+bonusSave)<concDC){
          G.hunterMarked=false;
          G.concentrating=null;
          delete G.skillCooldowns['hunters_mark'];
          log("💔 Concentration broken! Hunter's Mark drops — reapply with bonus action.",'c');
        } else {
          log("⚡ Concentration holds! ("+(concSave+bonusSave)+" vs DC"+concDC+")",'s');
        }
      }
    }
    // Paladin: Holy Nimbus (subclass) = 2 reflect; Radiance (talent) = +2 reflect standalone
    const nimbusDmg=G.classId==='paladin'&&G.subclassUnlocked?2:0;
    const radianceDmg=G.classId==='paladin'&&G.talents.includes('Radiance')?2:0;
    const reflectDmg=nimbusDmg+radianceDmg;
    if(reflectDmg>0&&G.currentEnemy){
      G.currentEnemy.hp-=reflectDmg;
      log('Radiant Aura: '+reflectDmg+' radiant reflected','s');
      if(G.currentEnemy.hp<=0){onEnemyDied();return;}
    }
    // On-hit status effects — guaranteed when intent matches, random otherwise
    if(e.canPoison&&!G.conditions.includes('Poisoned')&&(e._intent==='poisoning'||Math.random()<0.25)){
    checkObjectiveProgress('condition_gained','Poisoned');
      addCondition('Poisoned',3);
      AUDIO.sfx.poison();
      log('☠ Poisoned! Take damage each turn (3 turns).','c');
    }
    if(e.canBurn&&!G.conditions.includes('Burning')&&(e._intent==='burning'||Math.random()<0.3)){
    checkObjectiveProgress('condition_gained','Burning');
      addCondition('Burning',3);
      AUDIO.sfx.burn();
      log('🔥 Burning! Take fire damage each turn (3 turns).','c');
    }
    if(e.canStun&&!G.conditions.includes('Stunned')&&(e._intent==='stunning'||Math.random()<0.2)){
      if(G.classId==='barbarian'&&G._unstoppable&&G.raging){log('💢 Unstoppable: Stun blocked by Rage!','s');}
      else{addCondition('Stunned',1);AUDIO.sfx.stun();log('💫 Stunned! You will lose your next turn.','c');}
    }
  }
  // Always hand turn back after attack resolves
  afterEnemyActs();
}

// Routes damage through Wild Shape bear HP buffer before hitting player HP
function dealDamageToPlayer(dmg, sourceName){
  // Iron Skin branch passive: reduce all incoming damage by 2
  if(G._branchIronSkin) dmg=Math.max(0,dmg-2);
  // Sixth Sense: reduce boss special damage by 20%
  if(G._branchSixthSense&&G.currentEnemy&&G.currentEnemy.isBoss) dmg=Math.ceil(dmg*0.8);
  // Dawn Blessing shield (30 HP divine barrier from campfire action)
  if(G.dawnBlessingShield>0){
    const absorbed=Math.min(G.dawnBlessingShield,dmg);
    G.dawnBlessingShield-=absorbed; dmg-=absorbed;
    if(absorbed>0)log('🌅 Dawn Blessing absorbs '+absorbed+' damage! ('+(G.dawnBlessingShield)+' left)','s');
    if(G.dawnBlessingShield<=0){G.dawnBlessingShield=0;log('🌅 Dawn Blessing barrier broken!','c');}
    renderShieldBar();
  }
  // Holy Ward barrier
  if(G.classId==='cleric'&&G.holyWardHp>0){
    const absorbed=Math.min(G.holyWardHp,dmg);
    G.holyWardHp-=absorbed;dmg-=absorbed;
    if(absorbed>0)log('📿 Holy Ward absorbs '+absorbed+' damage! ('+(G.holyWardHp)+' left)','s');
    if(G.holyWardHp<=0)G.holyWardHp=0;
    if(typeof renderShieldBar==='function')renderShieldBar();
  }
  // Unbreakable Vow: below 30% HP take -30% damage
  if(G.classId==='paladin'&&G._unbreakableVow&&G.hp<G.maxHp*0.3)dmg=Math.ceil(dmg*0.7);
  // Impenetrable Aegis damage mitigation
  if(G._damageMitigation)dmg=Math.ceil(dmg*(1-G._damageMitigation));
  if(G.wildShapeHp>0){
    const absorbed=Math.min(G.wildShapeHp,dmg);
    G.wildShapeHp-=absorbed;
    dmg-=absorbed;
    spawnFloater(absorbed,'dmg',false);
    AUDIO.sfx.playerHit();
    animEl('playerSprite','hit-anim',300);
    if(window.Anim) Anim.playerHit();
    if(G.wildShapeHp<=0){
      const wasElem=G._elementalForm;
      exitWildShape('broken_by');
      log(wasElem?'🔥 Elemental form dispersed by '+sourceName+'! Druid restored.':'🌿 Bear form broken by '+sourceName+'! Stats restored.','c');
    } else {
      log('🐻 Bear form absorbed '+absorbed+' from '+sourceName+'! ('+Math.ceil(G.wildShapeHp)+' bear HP left)','s');
    }
    renderHUD();
  }
  if(dmg>0){
    if(typeof _dev_godMode==='undefined'||!_dev_godMode){
    G.hp-=dmg;
    G.totalDmgTaken=(G.totalDmgTaken||0)+dmg;
    G.causeOfDeath=sourceName||'Unknown';
    G._fightDamageTaken=true;
    if(G.hp>0 && G.hp<Math.floor(G.maxHp*0.5)) G._ironmanFlag=false;
    // ── Chroma tracking: cleric below 25% HP (from special) ──
    if(G.classId==='cleric'&&G.hp>0&&G.hp<Math.floor(G.maxHp*0.25)) G._droppedBelow25=true;
    }
    spawnFloater(dmg,'dmg',false);
    AUDIO.sfx.playerHit();
    log(sourceName+': '+dmg+' damage','e');
    // Rogue capstone — Death's Shadow: survive one killing blow per fight
    if(G.hp<=0&&G.classId==='rogue'&&G._deathsShadow&&!G._deathsShadowUsed){
      G._deathsShadowUsed=true;G.hp=1;
      G.res=Math.min(G.resMax,G.res+6);
      G.actionUsed=false;G.bonusUsed=false;
      log('☠️ Death\'s Shadow: you refuse to die! 1 HP, +6 Combo, next action free!','s');
    }
  }
}

