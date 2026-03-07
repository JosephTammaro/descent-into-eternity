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
    // ── Roll intent for all living enemies this round ──
    (G.currentEnemies||[]).forEach(en=>{if(!en.dead&&en.hp>0)_rollIntentForEnemy(en);});

    // ── BOSS TELEGRAPH — warn player before special fires ──
    if(G.currentEnemy&&G.currentEnemy.isBoss&&G.currentEnemy.hp>0){
      const e=G.currentEnemy;
      const interval=e.phaseTriggered?2:3;
      if(G.roundNum>0&&G.roundNum%interval===0){
        const sp=e.phaseTriggered&&e.phase2?e.phase2:e.special;
        const msg=getBossTelegraph(e.name,sp);
        log('','s');
        log('⚠ '+msg,'telegraph');
        log('','s');
        showTelegraphBanner(msg);
      }
    }

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
    updateEnemyIntent();
  } else {
    ts.textContent='🔴 ENEMY TURN';
    ts.className='turn-state enemy-turn';
    // Clear intent while enemy is acting
    const _intentEl=document.getElementById('enemyIntent');
    if(_intentEl){_intentEl.innerHTML='';_intentEl.className='enemy-intent';}
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


// ══════════════════════════════════════════════════════════
//  BRANCH ZONES
// ══════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════
//  SPAWN ENEMY
// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════
//  RARE EVENT TRIGGER (A3) — intercepts Next Enemy click
// ══════════════════════════════════════════════════════════

function handleNextEnemy(){
  if(!G) return;
  // Branch zones use their own spawner
  if(G._inBranch){ spawnBranchEnemy(); return; }
  // Don't trigger rare events if boss is ready, or already had one this zone
  if(G.bossReady || (G._rareEventsThisZone||0) >= 1){
    spawnEnemy(); return;
  }
  // ~20% chance per fight
  if(Math.random() < 0.20){
    const zoneId = ZONES[G.zoneIdx] ? ZONES[G.zoneIdx].id : null;
    const eligible = RARE_EVENTS.filter((e,idx) => {
      if(e.zones && !(zoneId && e.zones.includes(zoneId))) return false;
      // Phase B: locked events require unlock
      if(e.locked && typeof isEventUnlocked === 'function' && !isEventUnlocked(idx)) return false;
      return true;
    });
    if(eligible.length > 0){
      const ev = eligible[Math.floor(Math.random() * eligible.length)];
      G._rareEventsThisZone = (G._rareEventsThisZone || 0) + 1;
      // Phase B: Track rare event for unlock stats
      if(typeof updateUnlockStats === 'function') updateUnlockStats('rare_event');
      showRareEvent(ev);
      return;
    }
  }
  spawnEnemy();
}

function showRareEvent(ev){
  const overlay=document.getElementById('rareEventOverlay');
  if(!overlay) { spawnEnemy(); return; }
  overlay.style.display='flex';
  document.getElementById('rareEventTitle').textContent=ev.title;
  document.getElementById('rareEventText').innerHTML=ev.text;
  const choicesDiv=document.getElementById('rareEventChoices');
  const resultDiv=document.getElementById('rareEventResult');
  const continueBtn=document.getElementById('rareEventContinue');
  choicesDiv.innerHTML='';
  resultDiv.style.display='none';
  continueBtn.style.display='none';

  ev.choices.forEach((ch,i)=>{
    const btn=document.createElement('button');
    btn.style.cssText='padding:10px 16px;font-size:12px;background:linear-gradient(135deg,#1a1520,#221828);border:1px solid var(--border2);color:var(--parchment);cursor:pointer;text-align:left;line-height:1.5;transition:border-color 0.2s;';
    btn.textContent=ch.text;
    btn.onmouseenter=()=>btn.style.borderColor='var(--gold)';
    btn.onmouseleave=()=>btn.style.borderColor='var(--border2)';
    btn.onclick=()=>{
      // Disable all choice buttons
      choicesDiv.querySelectorAll('button').forEach(b=>{b.disabled=true;b.style.opacity='0.4';b.style.cursor='default';});
      btn.style.opacity='1';btn.style.borderColor='var(--gold)';
      // Execute outcome
      const result=ch.outcome(G);
      resultDiv.textContent=result;
      resultDiv.style.display='block';
      // Color result based on outcome
      if(result.startsWith('✗')){resultDiv.style.color='#ff6666';}
      else if(result.startsWith('✓')){resultDiv.style.color='#6aff6a';}
      else if(result.startsWith('⚠')){resultDiv.style.color='var(--gold)';}
      else{resultDiv.style.color='var(--dim)';}
      continueBtn.style.display='inline-block';
      // Play sound
      if(typeof AUDIO!=='undefined'&&AUDIO.sfx){
        if(result.startsWith('✗'))AUDIO.sfx.miss();
        else AUDIO.sfx.levelUp();
      }
      // Update HUD
      if(typeof renderHUD==='function') renderHUD();
    };
    choicesDiv.appendChild(btn);
  });
}

function closeRareEvent(){
  const overlay=document.getElementById('rareEventOverlay');
  if(overlay) overlay.style.display='none';
  // Continue to spawn the enemy
  if(G&&G._inBranch) spawnBranchEnemy();
  else spawnEnemy();
}

// ── Tutorial enemy (used during first-ever dungeon fight) ─
const TUTORIAL_ENEMY = {
  name: 'Training Dummy', icon: '🪆', sprite: 'skeleton',
  hp: 40, atk: 1, def: 0, xp: 5, gold: 0, isTutorial: true,
};

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

  // ── Zone echo — ghostly reminder of a past death in this zone ─────────
  if(G.zoneKills===0 && !G._zoneEchoDone && typeof loadGraveyard==='function'){
    const pastDeaths=loadGraveyard().filter(e=>e.zoneIdx===G.zoneIdx);
    if(pastDeaths.length){
      const d=pastDeaths[0];
      log(`👻 A familiar stillness. A ${(d.className||'hero').toLowerCase()} fell here once — slain by ${d.causeOfDeath||'the dark'}.`,'c');
    }
    G._zoneEchoDone=true;
  }

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
    if(G.dungeonFights===0){   // First fight of the run — always solo
      enemyCount=1;
    } else if(G.zoneIdx<=1){   // Zones I-II: 80/17/3
      enemyCount=roll100<80?1:roll100<97?2:3;
    } else if(G.zoneIdx<=4){ // Zones III-V: 40/35/20/5
      enemyCount=roll100<40?1:roll100<75?2:roll100<95?3:4;
    } else {                 // Zones VI-VIII: 30/35/25/10
      enemyCount=roll100<30?1:roll100<65?2:roll100<90?3:4;
    }
  }

  // ── Scaling ───────────────────────────────────────────────
  const lvlScale    =1+(G.level-1)*0.09;
  const zoneProgress=1+Math.min(0.10,Math.floor((G.zoneKills||0)/3)*0.03);
  const zoneLvl     =[1,5,8,12,16][G.zoneIdx]||1;
  const overLvl     =Math.max(0,G.level-(zoneLvl+6));
  const catchUp     =Math.min(1.6,1+overLvl*0.08);
  const bossBonus   =isBoss?1.5:1;
  const scale       =lvlScale*zoneProgress*catchUp*bossBonus;
  const effectiveLvl=Math.max(1,Math.round((scale-1)/0.06)+1);

  // ── Build one enemy object ────────────────────────────────
  function buildEnemy(eData){
    let hpMult=1, atkMult=1, goldMult=1;
    // Phase B: Zone modifier effects on enemies
    if(G._activeModifier){
      const fx=G._activeModifier.effects;
      if(fx.enemyHpMult)  hpMult *= fx.enemyHpMult;
      if(fx.enemyAtkMult) atkMult *= fx.enemyAtkMult;
      if(fx.goldMult)     goldMult *= fx.goldMult;
      if(fx.noGold)       goldMult = 0;
      // Mirrored: enemies get 20% of player's highest stat
      if(fx.mirrorPct){
        const playerOffense = (typeof CASTER_CLASSES!=='undefined'&&CASTER_CLASSES.includes(G.classId)&&typeof getSpellPower==='function') ? getSpellPower() : G.atk;
        const bonus = Math.floor(Math.max(playerOffense, G.def) * fx.mirrorPct);
        if(playerOffense >= G.def) atkMult += bonus / Math.max(1, eData.atk * scale);
        // DEF mirror handled via bonus in the return
      }
    }
    const playerOffenseForMirror = (typeof CASTER_CLASSES!=='undefined'&&CASTER_CLASSES.includes(G.classId)&&typeof getSpellPower==='function') ? getSpellPower() : G.atk;
    const mirrorDefBonus = (G._activeModifier && G._activeModifier.effects.mirrorPct && G.def > playerOffenseForMirror)
      ? Math.floor(G.def * G._activeModifier.effects.mirrorPct) : 0;

    return {
      ...eData,
      isBoss,
      effectiveLvl,
      maxHp:Math.floor(eData.hp*scale*hpMult),
      hp:   Math.floor(eData.hp*scale*hpMult),
      atk:  Math.floor(eData.atk*scale*atkMult),
      def:  Math.floor((eData.def||0)*scale*.9) + mirrorDefBonus,
      xp:   Math.floor(eData.xp*scale*(G._activeModifier&&G._activeModifier.effects.xpMult||1)),
      gold: goldMult === 0 ? 0 : Math.floor((eData.gold||5)*(0.7+Math.random()*.7)*goldMult),
      dead: false,
      _revived: false, // for Restless Dead
    };
  }

  // ── Populate G.currentEnemies ─────────────────────────────
  if(isBoss){
    G.currentEnemies=[buildEnemy(z.boss)];
    // Rare Event: Doppelganger Boss — add extra enemy alongside boss
    if(G._rareEventFlags.doppelgangerBoss){
      const doppel=buildEnemy(z.enemies[Math.floor(Math.random()*z.enemies.length)]);
      doppel.name='Doppelganger';
      G.currentEnemies.push(doppel);
      delete G._rareEventFlags.doppelgangerBoss;
      log('⚠ The Doppelganger emerges from the shadows — it fights alongside the boss!','c');
    }
    // Rare Event: Gate Fragment — boss starts at 90% HP
    if(G._rareEventFlags.gateFragmentBoss){
      const b=G.currentEnemies[0];
      b.hp=Math.floor(b.maxHp*0.90);
      delete G._rareEventFlags.gateFragmentBoss;
      log('🔑 The Gate Fragment pulses — the boss staggers, weakened!','l');
    }
  } else {
    G.currentEnemies=[];
    // Rare Event: Final Horn — +1 extra enemy per fight in this zone
    let finalHornActive=G._rareEventFlags.finalHorn&&G._rareEventFlags.finalHorn.zoneIdx===G.zoneIdx;
    const adjustedCount=finalHornActive?Math.min(4,enemyCount+1):enemyCount;
    for(let i=0;i<adjustedCount;i++){
      const eData=z.enemies[Math.floor(Math.random()*z.enemies.length)];
      const built=buildEnemy(eData);
      // Final Horn: enemies start at -15% HP
      if(finalHornActive){built.hp=Math.floor(built.hp*0.85);built.maxHp=built.hp;}
      G.currentEnemies.push(built);
    }
    if(finalHornActive&&adjustedCount>enemyCount) log('📯 The horn\'s echo draws reinforcements!','c');
  }
  // ── Tutorial fight override ───────────────────────────────
  if(G._isTutorialFight && !isBoss){
    const tutorialBuilt = {
      ...TUTORIAL_ENEMY,
      isBoss: false,
      effectiveLvl: 1,
      maxHp: TUTORIAL_ENEMY.hp,
      dead: false, _revived: false,
    };
    G.currentEnemies = [tutorialBuilt];
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

  // ── Phase B: Zone modifier per-fight effects ────────────
  if(G._activeModifier){
    const fx=G._activeModifier.effects;
    // Frenzied: start at round 3 (boss specials fire immediately)
    if(fx.startRound) G.roundNum = fx.startRound;
    // Cursed Ground: take damage at fight start
    if(fx.startDmgPct){
      const cdmg=Math.max(1,Math.floor(G.maxHp*fx.startDmgPct));
      if(typeof _dev_godMode==='undefined'||!_dev_godMode) G.hp=Math.max(1,G.hp-cdmg);
      log('☠️ Cursed Ground: -'+cdmg+' HP from the corrupted earth.','c');
      if(typeof renderHUD==='function') renderHUD();
    }
    // Cursed Ground: enemies start Weakened
    if(fx.enemyWeakenTurns){
      G.currentEnemies.forEach(e=>{e._weakened=fx.enemyWeakenTurns;});
      log('☠️ The curse weakens all enemies for '+fx.enemyWeakenTurns+' turns.','s');
    }
    // Predator and Prey: first attacker gets buff (player goes first normally)
    if(fx.initiativeBuff){
      G._predatorBuff={side:'player',mult:1+fx.initiativeBuff,turns:fx.initiativeDur||3};
      log('🐺 Predator and Prey: you strike first — +'+Math.round(fx.initiativeBuff*100)+'% damage for '+G._predatorBuff.turns+' turns!','s');
    }
    // Witch's Bargain: reset choice for this fight
    G._witchChoice=null;
  }
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
  // Bug 18: Reset Waxing Moon stacks at fight start (not per-cast)
  G._waxingMoonStacks=0;
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

  // ── Rare Event per-fight flags ──────────────────────────────
  const ref=G._rareEventFlags;
  // Vexara's Crown: 5 damage per fight
  if(ref.vexaraCrown&&ref.vexaraCrown.zoneIdx===G.zoneIdx){
    if(typeof _dev_godMode==='undefined'||!_dev_godMode){G.hp=Math.max(1,G.hp-5); G._fightDamageTaken=true;}
    log('👑 Crimson Authority burns: −5 HP','c');
    // Weaken enemies -10% HP
    for(const en of G.currentEnemies){en.hp=Math.floor(en.hp*0.90);en.maxHp=en.hp;}
  }
  // Frozen Soldier companion
  if(ref.frozenSoldier&&ref.frozenSoldier.zoneIdx===G.zoneIdx&&ref.frozenSoldier.hp>0){
    log('💀 Frozen Soldier stands ready! ('+ref.frozenSoldier.hp+' HP)','s');
  }
  // Allied Skeletons
  if(ref.alliedSkeletons&&ref.alliedSkeletons>0){
    log('💀 '+ref.alliedSkeletons+' skeleton guard(s) ready to absorb hits.','s');
  }
  // Cursed debuff tick-down
  if(ref._cursedDebuff&&ref._cursedDebuff>0){
    ref._cursedDebuff--;
    if(ref._cursedDebuff<=0){addOffensiveStat(G,3);G.def+=3;delete ref._cursedDebuff;log('The curse lifts.','s');}
    else log('☠ Cursed: −3 '+getOffensiveStatLabel(G)+'/DEF ('+ref._cursedDebuff+' fights left)','c');
  }
  // Chilled debuff tick-down
  if(ref._chilledDebuff&&ref._chilledDebuff>0){
    ref._chilledDebuff--;
    if(ref._chilledDebuff<=0){G.def+=3;delete ref._chilledDebuff;log('The chill fades.','s');}
    else log('🧊 Chilled: −3 DEF ('+ref._chilledDebuff+' fights left)','c');
  }
  // Divine Evasion: mark this fight for first-attack dodge
  if(ref.divineEvasion&&ref.divineEvasion.zoneIdx===G.zoneIdx){
    G._divineEvasionReady=true;
  }
  // Enemy First Strike flag (from Whispering Root)
  if(ref.enemyFirstStrike){
    delete ref.enemyFirstStrike;
    log('⚠ You\'re disoriented — the enemy strikes first!','c');
    // Delay to let UI render, then trigger enemy turn
    setTimeout(()=>{if(G&&G.currentEnemy&&G.currentEnemy.hp>0) doEnemyTurn();},400);
  }

  const cntMsg=enemyCount>1?` + ${enemyCount-1} more!`:'';
  // Update enemy count badge for rare event modifications
  const actualCount=G.currentEnemies.length;
  const cntMsgActual=actualCount>1?` + ${actualCount-1} more!`:'';
  log(`A ${G.currentEnemy.name} appears! [Lv.${effectiveLvl}]${cntMsgActual}`,'s');
  // Tutorial: don't start the player's turn yet — the choice/tour overlay controls this
  if(!G._pauseForTutorial) setPlayerTurn(true);
  renderEnemyArea();
  if(typeof autoSave==='function'&&!G._pauseForTutorial) autoSave();
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
    if(e._isRealEmpress){card.style.outline='2px solid rgba(200,168,75,0.9)';card.style.boxShadow='0 0 10px rgba(200,168,75,0.4)';}
    card.onclick = isDead ? null : ()=>{ selectTarget(i); };

    // Build sprite canvas
    const spriteCanvas = document.createElement('div');
    spriteCanvas.className='enemy-card-sprite';
    const spriteEl = document.createElement('div');
    const spriteData = (e.isBoss||e._usesBossSprite) ? BOSS_SPRITES[e.sprite] : ENEMY_SPRITES[e.sprite];
    if(spriteData) renderSprite(spriteData, 7, spriteEl);
    spriteEl.style.filter=`drop-shadow(0 0 3px ${e.color||'#888'})`;
    spriteCanvas.appendChild(spriteEl);

    const hpBar = `<div class="enemy-card-hp-bar"><div class="enemy-card-hp-fill" style="width:${hpPct}%;background:${hpColor};"></div></div>`;
    const hpTxt = `<div class="enemy-card-hp-txt">${isDead?'DEAD':Math.ceil(e.hp)+'/'+e.maxHp}</div>`;
    const name  = `<div class="enemy-card-name">${e.name}<br><span style="color:var(--dim);font-size:4px;">Lv.${e.effectiveLvl}</span></div>`;
    const arrow = isTarget ? `<div class="enemy-target-arrow">▼</div>` : '';
    const deadX = isDead   ? `<div class="enemy-card-dead-x">💀</div>` : '';
    // Intent badge on each card
    let intentHtml='';
    if(!isDead){
      const d=_getIntentDisplay(e);
      if(d)intentHtml=`<div class="enemy-card-intent${d.cls==='intent-special'||d.cls==='intent-blocked'?' '+d.cls:''}">${d.icon}</div>`;
    }

    card.appendChild(spriteCanvas);
    card.insertAdjacentHTML('beforeend', hpBar+hpTxt+name+arrow+deadX+intentHtml);
    multiRow.appendChild(card);
  });
}

// ══════════════════════════════════════════════════════════
//  ENEMY INTENT DISPLAY
// ══════════════════════════════════════════════════════════
const _INTENT_DISPLAY={
  striking: {icon:'⚔', label:'STRIKING',  cls:'intent-attack'},
  defending:{icon:'🛡', label:'DEFENDING', cls:'intent-defend'},
  poisoning:{icon:'☠', label:'POISONING', cls:'intent-status'},
  burning:  {icon:'🔥',label:'BURNING',   cls:'intent-status'},
  stunning: {icon:'💫',label:'STUNNING',  cls:'intent-status'},
  casting:  {icon:'✨', label:'CASTING',   cls:'intent-cast'},
};

function _rollIntentForEnemy(e){
  if(!e||e.hp<=0||e.dead||e.isBoss){e._intent=null;return;}
  // Only re-roll once per round
  if(e._intentRolledRound===G.roundNum)return;
  e._intentRolledRound=G.roundNum;
  const pool=['striking','striking','striking','striking'];
  if(e.canPoison)  pool.push('poisoning','poisoning');
  if(e.canBurn)    pool.push('burning','burning');
  if(e.canStun)    pool.push('stunning');
  if(e.ignoresArmor) pool.push('casting','casting','casting');
  if(e.def>=8)     pool.push('defending');
  e._intent=pool[Math.floor(Math.random()*pool.length)];
}

function _getIntentDisplay(e){
  if(!e)return null;
  const isRestrained=e.conditions&&e.conditions.find(c=>c.name==='Restrained'&&c.turns>0);
  if(isRestrained)return{icon:'🔗',label:'RESTRAINED',cls:'intent-blocked'};
  // Zareth charging override — show charging intent during wind-up
  if(e._chargingBlast>0)return{icon:'⚡',label:'CHARGING...',cls:'intent-special'};
  if(e.isBoss&&G.roundNum>0){
    // ── Per-boss mechanic overrides (highest priority) ──
    // Vexara — Crimson Brand fires on brandRound
    if(e.id==='vexara'&&e.brandRound&&G.roundNum===e.brandRound&&!e._brandApplied)
      return{icon:'🔥',label:'CRIMSON BRAND',cls:'intent-special'};
    // Grakthar — Rally fires next enemy turn if HP already below threshold
    if(e.id==='grakthar'&&!e._rallyUsed&&e.hp<=e.maxHp*0.6)
      return{icon:'⚔',label:'RALLYING GARRISON',cls:'intent-special'};
    // Valdris — Last Stand (check 30% first, then 65% bulwark)
    if(e.id==='valdris'&&!e._lastStand&&e.hp<=e.maxHp*0.3)
      return{icon:'💢',label:'LAST STAND',cls:'intent-special'};
    if(e.id==='valdris'&&!e._bulwarkUsed&&e.hp<=e.maxHp*0.65)
      return{icon:'❄',label:'SUMMON SOLDIERS',cls:'intent-special'};
    // Auranthos — Divine Blindness on its interval
    if(e.id==='auranthos'){
      const bInterval=e.phaseTriggered?2:3;
      if(G.roundNum%bInterval===0) return{icon:'👁',label:'DIVINE BLINDNESS',cls:'intent-special'};
    }
    // Malvaris — specific trigger overrides, then always show Grief Aura
    if(e.id==='malvaris'){
      if(!e._soulDrainUsed&&e.hp<=e.maxHp*0.25)return{icon:'🌑',label:'SOUL DRAIN',cls:'intent-special'};
      if(!e._splitUsed&&e.hp<=e.maxHp*0.5)return{icon:'🌑',label:'SHADOW SPLIT',cls:'intent-special'};
      return{icon:'🌑',label:'GRIEF AURA + STRIKE',cls:'intent-special'};
    }
    // ── Generic boss special interval ──
    const interval=e.phaseTriggered?2:3;
    if(G.roundNum%interval===0){
      const sp=e.phaseTriggered&&e.phase2?e.phase2:e.special;
      const spName=sp&&sp.name?sp.name.toUpperCase():'SPECIAL ATTACK';
      return{icon:'💥',label:spName,cls:'intent-special'};
    }
    return _INTENT_DISPLAY.striking;
  }
  return _INTENT_DISPLAY[e._intent]||_INTENT_DISPLAY.striking;
}

function updateEnemyIntent(){
  const el=document.getElementById('enemyIntent');
  if(!el)return;
  if(!G||!G.currentEnemy||G.currentEnemy.hp<=0){
    el.innerHTML='';el.className='enemy-intent';return;
  }
  const d=_getIntentDisplay(G.currentEnemy);
  if(!d){el.innerHTML='';el.className='enemy-intent';return;}
  el.innerHTML=d.icon+' '+d.label;
  el.className='enemy-intent '+d.cls;
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

const ZONE_TAGLINES = {
  0: 'The roots remember what you have forgotten.',
  1: 'Three centuries of dust. One order that never died.',
  2: 'She has been waiting. The blood remembers.',
  3: 'Below the roots, the dark is full of you.',
  4: 'The horn that sounds is your own voice, echoing backward.',
  5: 'The ice holds what you left behind.',
  6: 'The gods erased the truth. The truth survived.',
  7: 'Not an ending. A reunion.'
};

function showZoneCinematic(zoneIdx, onDone){
  const z = ZONES[zoneIdx];
  if(!z){ onDone(); return; }

  // Start zone BGM with the cinematic
  const bgmMap=['woods','outpost','castle','underdark','abyss'];
  AUDIO.playBGM(bgmMap[zoneIdx]||'woods');

  const overlay = document.getElementById('zoneCinematicOverlay');
  if(!overlay){ onDone(); return; }

  document.getElementById('zoneCineNum').textContent = 'ZONE ' + z.num;
  document.getElementById('zoneCineName').textContent = z.story.title;
  document.getElementById('zoneCineTagline').textContent = ZONE_TAGLINES[zoneIdx] || '';

  // Hide all screens before showing cinematic — overlay is fully opaque so nothing
  // is visible, and this prevents click-through to class select or other screens
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));

  overlay.classList.remove('active');
  void overlay.offsetWidth;
  overlay.classList.add('active');

  // Auto-dismiss — set up story screen BEHIND overlay before fading out
  setTimeout(()=>{
    onDone(); // story screen appears behind the still-opaque overlay
    // Fade out overlay to reveal story screen underneath
    overlay.style.transition='opacity 0.5s ease-in';
    overlay.style.opacity='0';
    setTimeout(()=>{
      overlay.classList.remove('active');
      overlay.style.transition='';
      overlay.style.opacity='';
    }, 550);
  }, 2800);
}
