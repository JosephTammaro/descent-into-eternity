// ══════════════════════════════════════════════════════════
function onEnemyDied(){
  if(enemyTurnTimeout){clearTimeout(enemyTurnTimeout);enemyTurnTimeout=null;}
  hideReactionPrompt();
  if(typeof triggerKillFreeze==='function') triggerKillFreeze();
  const e=G.currentEnemy;
  G.isPlayerTurn=true;

  // ── Garrison Soldier death — remove Grakthar's rally DEF bonus ──
  if(e&&e._isGarrisonSoldier){
    const boss=(G.currentEnemies||[]).find(en=>en.id==='grakthar'&&!en.dead&&en.hp>0);
    if(boss&&boss._rallyDefBonus){
      boss.def=Math.max(0,boss.def-boss._rallyDefBonus);
      delete boss._rallyDefBonus;
      log('⚔ The Garrison Soldier falls — Grakthar\'s defense wavers!','s');
    }
  }
  // ── Frozen Soldier death — log bulwark status ──
  if(e&&e._isFrozenSoldier){
    const remaining=(G.currentEnemies||[]).filter(en=>!en.dead&&en.hp>0&&en._isFrozenSoldier).length;
    if(remaining===0)log('❄ Both Frozen Soldiers fall — Valdris\'s bulwark shatters!','s');
    else log('❄ A Frozen Soldier falls! '+remaining+' remaining — Valdris still shielded!','s');
  }
  // ── Shadow copy death — heal the real Empress ──
  if(e&&e._isShadowCopy){
    const real=(G.currentEnemies||[]).find(en=>en._isRealEmpress&&!en.dead&&en.hp>0);
    if(real){
      const healAmt=Math.ceil(real.maxHp*0.20);
      real.hp=Math.min(real.maxHp,real.hp+healAmt);
      updateEnemyBar();
      log('🌑 The Shadow\'s death feeds the Empress — she heals '+healAmt+' HP!','e');
      if(typeof triggerScreenShake==='function')triggerScreenShake('hit');
    }
  }
  // ── Real Empress death — despawn shadow ──
  if(e&&e._isRealEmpress){
    const shadow=(G.currentEnemies||[]).find(en=>en._isShadowCopy&&!en.dead&&en.hp>0);
    if(shadow){shadow.hp=0;shadow.dead=true;log('🌑 The Shadow dissolves as the Empress falls...','s');}
  }

  // If we're in a branch, hand off to branch system
  if(G._inBranch){
    AUDIO.sfx.enemyDeath();
    animEl('enemySprite','die-anim',1300);
    if(window.Anim) Anim.enemyDeath();
    const _eSprite=document.getElementById('enemySprite');
    if(_eSprite)_eSprite.classList.remove('phase2-glow');
    const _nameTag=document.getElementById('enemyNameTag');
    if(_nameTag){_nameTag.classList.remove('phase2-name-tag');_nameTag.style.animation='';}
    log(e.name+' is defeated!','s');
    const xp=Math.floor((e.xp||0)*G.xpMult);
    const gold=Math.floor(e.gold*(G.classId==='rogue'&&G.talents.includes('Luck')?G.goldMult*1.10:G.goldMult));
    G.xp+=xp; G.gold+=gold; G.totalGold+=gold; G.totalKills++;
    if(G.classId==='rogue') G._lifetimeGoldRogue=(G._lifetimeGoldRogue||0)+gold;
    AUDIO.sfx.gold();
    log('+'+xp+' XP, +'+gold+'🪙','l');
    if(Math.random()<(G._branchScavenger?0.42:0.3))dropLoot(e);
    if(!e.isBoss&&G.xp>=G.xpNeeded&&!levelUpShowing){G.xp-=G.xpNeeded;doLevelUp();}
    setTimeout(()=>onBranchEnemyDefeated(), 1400);
    return;
  }
  // Clear stale reaction flags on enemy death
  if(G.sx){delete G.sx.counterspell; delete G.sx.parry; delete G.sx.evasion;}
  AUDIO.sfx.enemyDeath();
  // Gold burst — coins spray from enemy position
  if(typeof spawnGoldBurst==='function'){
    if(G.currentEnemies&&G.currentEnemies.length>1){
      const _gIdx=G.currentEnemies.indexOf(e);
      const _gCard=document.querySelector('.enemy-card[data-idx="'+_gIdx+'"]');
      if(_gCard)spawnGoldBurst(_gCard);
    } else {
      spawnGoldBurst(document.getElementById('enemyWrap'));
    }
  }
  G._singleEnemyDying=true;
  animEl('enemySprite','die-anim',1300);
  setTimeout(()=>{G._singleEnemyDying=false;const s=document.getElementById('enemySprite');if(s){s.classList.remove('die-anim');s.style.opacity='0';}},1310);
  if(window.Anim) Anim.enemyDeath();
  // Clean up phase 2 glow/nametag if it was active
  const _eSprite=document.getElementById('enemySprite');
  if(_eSprite)_eSprite.classList.remove('phase2-glow');
  const _nameTag=document.getElementById('enemyNameTag');
  if(_nameTag){_nameTag.classList.remove('phase2-name-tag');_nameTag.style.animation='';}
  log(e.name+' is defeated!','s');

  // Clear Hunter's Mark on kill — unless Marked Prey talent (persists to next target)
  if(G.hunterMarked&&!G.talents.includes('Marked Prey')){
    G.hunterMarked=false;
    G.concentrating=null;
    delete G.skillCooldowns['hunters_mark'];
    log("Hunter's Mark lifts — target slain.",'s');
  } else if(G.hunterMarked&&G.talents.includes('Marked Prey')){
    log("Marked Prey: mark persists to next target.",'s');
  }
  // ── Chroma tracking: ranger marked kills ──
  if(G.classId==='ranger'&&G.hunterMarked) G._markedKillsThisZone=(G._markedKillsThisZone||0)+1;
  // Wild Shape unlocks when buffer is depleted
  if(G.wildShapeHp<=0&&G.skillCooldowns['wild_shape']){
    if(G.wildShapeActive) exitWildShape('faded');
    else delete G.skillCooldowns['wild_shape'];
  }
  // Spiritual weapon unlocks when done (cleric only)
  if(G.classId==='cleric'&&!G.spiritualWeaponActive){delete G.skillCooldowns['spiritual_weapon'];}

  // Assassin's Tools: kills have 40% chance to prep poison for next attack
  if(G.classId==='rogue'&&G.subclassId==='assassin'&&!e.isBoss&&Math.random()<0.40){
    G._assassinToolsPoison=true;
    log("☠ Assassin's Tools: venom readied!",'s');
  }
  // Vengeance: on kill, transfer mark to next living enemy
  if(G.classId==='paladin'&&G.subclassId==='vengeance'){
    const nextMark=(G.currentEnemies||[]).find(en=>!en.dead&&en.hp>0);
    if(nextMark){G._vengeanceMarked=G.currentEnemies.indexOf(nextMark);log('⚔️ Vengeance: mark transfers to '+nextMark.name+'!','s');}
    else G._vengeanceMarked=-1;
  }
  // Rampage keystone: +1 kill stack per enemy slain (max 5)
  if(G._keystoneRampage){G._rampageStacks=Math.min(5,(G._rampageStacks||0)+1);log('🔥 Rampage: +1 stack! ('+G._rampageStacks+'×3 bonus dmg)','s');}
  // One-Shot keystone (Rogue): kill refunds action + 2 Combo Points
  if(G._keystoneOneShot&&G.classId==='rogue'){
    if(G.actionUsed)G.actionUsed=false;
    G.res=Math.min(G.resMax,(G.res||0)+2);
    log('💀 One-Shot: kill refunds action + 2 Combo!','s');
  }
  // Bloody Momentum: killing blow restores 30 Momentum
  if(G.classId==='fighter'&&G._bloodyMomentum){
    G.res=Math.min(G.resMax,G.res+30);
    log('🩸 Bloody Momentum: +30 Momentum!','s');
  }
  // Relentless: on kill, regain action (once per turn)
  if(G.classId==='fighter'&&G._relentless&&!G._relentlessUsed){
    G._relentlessUsed=true;
    G.isPlayerTurn=true;
    log('⚔ Relentless: kill grants a free action!','s');
  }
  // Seasoned Hunter: each kill in a fight increases ATK by 2 (capped at +10)
  if(G.classId==='ranger'&&G._seasonedHunter&&(G._seasonedHunterBonus||0)<10){
    G._seasonedHunterBonus=(G._seasonedHunterBonus||0)+2;
    G.atk+=2;
    log('🎖 Seasoned Hunter: +2 ATK! (total bonus: '+G._seasonedHunterBonus+')','s');
  }
  // Bloodlust: each kill extends Rage duration by 1 round
  if(G.classId==='barbarian'&&G._bloodlust&&G.raging&&G.rageTurns<999){
    G.rageTurns++;
    log('🔴 Bloodlust: Rage extended by 1 round! ('+G.rageTurns+' left)','s');
  }
  // ── Phase B: Zone modifier on-kill effects ──
  if(G._activeModifier){
    const fx=G._activeModifier.effects;
    // Bloodlust modifier: heal 8% HP on kill
    if(fx.killHealPct){
      const h=Math.max(1,Math.floor(G.maxHp*fx.killHealPct));
      G.hp=Math.min(G.maxHp,G.hp+h);
      log('🩸 Bloodlust: healed '+h+' HP from the kill!','s');
    }
    // Ancestral Fury: +2 ATK per stack
    if(fx.killAtkStack){
      G._ancestralStacks=(G._ancestralStacks||0)+1;
      log('👻 Ancestral Fury: +'+fx.killAtkStack+' '+getOffensiveStatLabel(G)+'! (stack '+G._ancestralStacks+', enemies +'+G._ancestralStacks+'% dmg)','s');
    }
    // Restless Dead: 20% revive at 30% HP (not already revived, not boss)
    if(fx.reviveChance && !e.isBoss && !e._revived && Math.random() < fx.reviveChance){
      e.dead=false;
      e.hp=Math.floor(e.maxHp * (fx.reviveHpPct||0.30));
      e.gold=Math.floor(e.gold * (fx.reviveGoldMult||2));
      e._revived=true;
      log('💀 '+e.name+' refuses to stay dead! It rises at '+e.hp+' HP — but will drop '+fx.reviveGoldMult+'× gold!','c');
      updateEnemyBar();
      return; // Don't proceed with death rewards
    }
  }
  // Predator buff: tick down
  if(G._predatorBuff && G._predatorBuff.turns > 0) G._predatorBuff.turns--;
  const xp=Math.floor((e.xp||0)*G.xpMult);
  const packSize=G.currentEnemies?G.currentEnemies.length:1;
  const packGoldMult=packSize<=1?1:packSize===2?0.6:packSize===3?0.4:0.3;
  // keepersMantle: all gold drops +50%
  const _keepersMult=(typeof hasEquippedItem==='function'&&hasEquippedItem('keepersMantle'))?1.5:1;
  const gold=Math.floor(e.gold*(G.classId==='rogue'&&G.talents.includes('Luck')?G.goldMult*1.10:G.goldMult)*packGoldMult*_keepersMult);
  G.xp+=xp; G.gold+=gold; G.totalGold+=gold; G.totalKills++;
  G._fightGoldEarned=(G._fightGoldEarned||0)+gold;
  if(G.classId==='rogue') G._lifetimeGoldRogue=(G._lifetimeGoldRogue||0)+gold;
  AUDIO.sfx.gold();
  log('+'+xp+' XP, +'+gold+'🪙','l');
  // Achievement tracking: close call
  if(G.hp>0 && G.hp<=Math.floor(G.maxHp*0.1)) G._closeCallFlag=true;
  // Achievement tracking: no-rest streak
  G._noRestStreak=(G._noRestStreak||0)+1;
  // Relentless branch passive: heal 5 HP on kill
  if(G._branchRelentlessHeal){heal(5,'Relentless 🩸');}
  checkAchievements();
  checkObjectiveProgress('enemy_killed',e);

  // ── Relic: on_kill triggers ──
  if(typeof triggerRelic==='function') triggerRelic('on_kill',{enemy:e});

  // Loot
  const lootChance = (G._activeModifier && G._activeModifier.effects.lootChanceMult)
    ? 0.3 * G._activeModifier.effects.lootChanceMult : 0.3;
  if(Math.random()<lootChance)dropLoot(e);
  // ── Relic: Elite room guaranteed rare drop + relic pick ──
  if(e._eliteDrop&&typeof dropLoot==='function') dropLoot(e,'rare');
  if(e._eliteDrop&&typeof showEliteRelicDrop==='function') setTimeout(()=>showEliteRelicDrop(),600);
  // Per-enemy custom material drop
  if(e.dropMat&&Math.random()<.5){const m=ITEMS.find(i=>i.id===e.dropMat);if(m)addItem({...m,qty:1});}
  // Universal drops based on enemy properties
  if(e.canPoison&&Math.random()<.35)addItem({...ITEMS.find(i=>i.id==='fang'),qty:1});
  if(ZONES[G.zoneIdx].id==='woods'&&Math.random()<.35)addItem({...ITEMS.find(i=>i.id==='herb'),qty:1});
  if(e.isUndead&&Math.random()<.4)addItem({...ITEMS.find(i=>i.id==='bone'),qty:1});
  if(e.id==='ghost'&&Math.random()<.35)addItem({...ITEMS.find(i=>i.id==='ghostEssence'),qty:1});
  if(e.id==='skeleton'&&Math.random()<.25)addItem({...ITEMS.find(i=>i.id==='voidShard'),qty:1});
  // Zone-specific rare drops
  const zId=ZONES[G.zoneIdx].id;
  if(zId==='celestial'&&Math.random()<.3){const m=ITEMS.find(i=>i.id==='celestialDust');if(m)addItem({...m,qty:1});}
  if(zId==='shadowrealm'&&Math.random()<.3){const m=ITEMS.find(i=>i.id==='shadowEssence');if(m)addItem({...m,qty:1});}

  // Wizard slot recovery
  if(G.classId==='wizard'){
    G.wizKillCount=(G.wizKillCount||0)+1;
    if(G.wizKillCount>=3){
      G.wizKillCount=0;
      const rl=restoreSpellSlot();
      if(rl)log('Arcane Recovery: LVL'+rl+' slot regained','s');
    }
    // Void Tap: on kill, restore 1 spell slot of any tier
    if(G._voidTap){
      const rl=restoreSpellSlot();
      if(rl)log('🌑 Void Tap: LVL'+rl+' slot restored!','s');
    }
  }

  // XP/Level — if boss was killed, defer level-up until AFTER boss victory screen
  const _isBoss = e.isBoss;
  // Favored Terrain: consume after this fight
  if(G._favoredTerrainActive){G._favoredTerrainActive=false;}
  if(!_isBoss){
    if(G.xp>=G.xpNeeded&&!levelUpShowing){G.xp-=G.xpNeeded;doLevelUp();}
  }

  if(e.isBoss){
    const _firstClear = !G.bossDefeated[G.zoneIdx]; // capture BEFORE marking defeated
    G.bossDefeated[G.zoneIdx]=true;
    G.runBossDefeated[G.zoneIdx]=true;
    G.bossReady=false;
    document.getElementById('bossAlert').style.display='none';
    log('🏆 BOSS CLEARED: '+e.name+'!','l');
    // ── Chroma tracking: boss kill achievements ──
    if(G.classId==='wizard'&&G._timeStopActive) G._timeStopBossKill=true;
    if(G.classId==='wizard'&&!G._usedSpellSlotThisFight) G._cantripOnlyBossKill=true;
    if(G.classId==='rogue') G._fastBossKill=Math.min(G._fastBossKill||999, G.roundNum||999);
    if(G.classId==='ranger'&&G.hunterMarked) G._markedBossKills=(G._markedBossKills||0)+1;
    checkObjectiveProgress('boss_killed',e);
    checkAchievements();
    // ── Phase B: Track boss kill for unlocks ──
    if(typeof updateUnlockStats==='function'){
      updateUnlockStats('boss_kill', {rounds: G.roundNum || 0});
      updateUnlockStats('zone_clear');
      if(G.zoneIdx >= 4) updateUnlockStats('zone5_reached');
      if(G.zoneIdx >= 7){
        updateUnlockStats('zone8_reached');
        updateUnlockStats('boss8_beaten');
      }
    }
    if(typeof checkUnlocks==='function') checkUnlocks();
    // Legendary item drop
    if(e.legendaryDrop){
      const legendary=ITEMS.find(i=>i.id===e.legendaryDrop);
      if(legendary){
        addItem({...legendary,qty:1});
        log('✨ LEGENDARY DROP: '+legendary.icon+' '+legendary.name+'!','l');
      }
    }
    // Phase B: Mythic — boss guarantees a legendary even if boss doesn't have one
    if(G._activeModifier && G._activeModifier.effects.bossLegendary && !e.legendaryDrop){
      const legPool=ITEMS.filter(i=>i.rarity==='legendary'&&i.slot);
      if(legPool.length){
        const drop={...legPool[Math.floor(Math.random()*legPool.length)],qty:1};
        addItem(drop);
        log('🌟 Mythic: '+drop.icon+' '+drop.name+' (legendary guaranteed)!','l');
      }
    }
    // Rare Event: Blood Pact — double boss gold + guaranteed rare+ item
    if(G._rareEventFlags.bloodPact){
      delete G._rareEventFlags.bloodPact;
      const bonusGold=Math.floor(e.gold*(G.goldMult||1));
      G.gold+=bonusGold; G.totalGold+=bonusGold;
      log('💉 Blood Pact: +'+bonusGold+' bonus gold!','l');
      const bpPool=ITEMS.filter(i=>i.slot&&(i.rarity==='rare'||i.rarity==='epic'));
      if(bpPool.length){const bpItem={...bpPool[Math.floor(Math.random()*bpPool.length)],qty:1};addItem(bpItem);log('💉 Blood Pact: '+bpItem.icon+' '+bpItem.name+'!','l');}
    }
    // Rare Event: Blood Pact (gold version) — extra item drop
    if(G._rareEventFlags.bloodPactGold){
      delete G._rareEventFlags.bloodPactGold;
      const bpgPool=ITEMS.filter(i=>i.slot&&i.rarity!=='common');
      if(bpgPool.length){const bpgItem={...bpgPool[Math.floor(Math.random()*bpgPool.length)],qty:1};addItem(bpgItem);log('🪙 Blood Pact: bonus drop — '+bpgItem.icon+' '+bpgItem.name+'!','l');}
    }
    // Rare Event: Unstable Buff — remove after boss
    if(G._rareEventFlags.unstableBuff){
      const ub=G._rareEventFlags.unstableBuff;
      removeOffensiveStat(G,ub.atk); G.def-=ub.def; G.maxHp-=ub.hp; G.hp=Math.min(G.hp,G.maxHp);
      delete G._rareEventFlags.unstableBuff;
      log('📦 The Stranger\'s gift fades...','c');
    }
    // Rare Event: Temp ATK Bonus (Vexara's Mirror) — remove after boss (zone-scoped)
    if(G._rareEventFlags.tempAtkBonus&&G._rareEventFlags.tempAtkBonus.zoneIdx===G.zoneIdx){
      removeOffensiveStat(G,G._rareEventFlags.tempAtkBonus.value);
      delete G._rareEventFlags.tempAtkBonus;
      log('The crimson weapon shatters.','c');
    }
    const defeatedEnemy = G.currentEnemy;
    G.currentEnemy=null;
    G._bossSequenceActive = _firstClear; // only suppress level-up screens on first clear
    const loreIdx=G.zoneIdx;

    // ── Grace drop helper (always fires for main bosses) ──────
    const doGraceDrop = (onDone) => {
      if(Math.random()<0.60 && typeof generateGrace==='function' && typeof showGraceDrop==='function'){
        showGraceDrop(generateGrace(), onDone);
      } else {
        onDone();
      }
    };

    // ── First clear: level-up → grace → lore → town ──────────
    const firstClearFlow = () => {
      const afterLevelUps = () => {
        const _showReward = typeof showBossReward==='function' ? showBossReward : (cb=>cb());
        _showReward(() => {
          if(G) G._bossSequenceActive = false;
          const slot = (typeof activeSaveSlot!=='undefined') ? activeSaveSlot : null;
          if(typeof updateSlotData==='function'&&slot){
            updateSlotData(slot, d=>{
              // Persist bossDefeated so next run knows which zones are unlocked
              if(G) d.bossDefeated = [...(G.bossDefeated||d.bossDefeated||[])];
              // Accumulate lifetime stats
              if(G){
                d.lifetimeKills  = (d.lifetimeKills||0)  + (G.totalKills||0);
                d.lifetimeGold   = (d.lifetimeGold||0)   + (G.totalGold||0);
                d.lifetimeCrits  = (d.lifetimeCrits||0)  + (G.totalCrits||0);
                d.lifetimeCrafts = (d.lifetimeCrafts||0) + (G.totalCrafts||0);
                d.lifetimeTime   = (d.lifetimeTime||0)   + (G.playTime||0);
              }
              d.lifetimeRuns = (d.lifetimeRuns||0) + 1;
              // Persist lifetime chroma trackers
              if(G){
                d.lifetimeSmitesPaladin=G._lifetimeSmites||0;
                d.lifetimeChannelsCleric=G._lifetimeChannels||0;
                d.lifetimePoisonsDruid=G._lifetimePoisonsApplied||0;
                d.lifetimeWildShapeTurnsDruid=G._lifetimeWildShapeTurns||0;
                d.lifetimeFlawlessRogue=G._lifetimeFlawlessRogue||0;
                d.lifetimeGoldRogue=G._lifetimeGoldRogue||0;
                d.lifetimeObjectivesRanger=G._lifetimeObjectivesRanger||0;
                d.lifetimeMarkedBossKillsRanger=G._markedBossKills||0;
              }
              // Keep d.state alive — player continues run through town visit
            });
          }
          const nextZoneName = (typeof ZONES!=='undefined'&&ZONES[loreIdx+1]) ? ZONES[loreIdx+1].name : 'the unknown';
          const isFinalZoneClear = (loreIdx >= ZONES.length - 1);
          log(isFinalZoneClear ? '✨ The descent is complete.' : '✨ '+nextZoneName+' awaits. Return to Elderfen.','l');
          // Show lore beat then send to town (or victory for final zone)
          const loreExists = loreIdx < LORE_REVEALS.length;
          const doTown = () => {
            showSalvagePrompt(()=>{
              if(typeof fadeToScreen==='function'){
                fadeToScreen('town', ()=>{ if(typeof showTownHub==='function') showTownHub(); });
              } else if(typeof showTownHub==='function'){
                showTownHub();
              }
            });
          };
          const doVictory = () => {
            showSalvagePrompt(()=>{
              if(typeof showVictorySequence==='function') showVictorySequence();
              else doTown();
            });
          };
          const afterLore = isFinalZoneClear ? doVictory : doTown;
          if(loreExists){
            showLoreReveal(loreIdx, afterLore);
          } else {
            afterLore();
          }
        });
      };
      if(G.xp>=G.xpNeeded){
        G.xp-=G.xpNeeded;
        G._afterLevelUpCallback=afterLevelUps;
        doLevelUp();
      } else {
        afterLevelUps();
      }
    };

    // ── Repeat clear: level-up → grace → lore → map (next zone + any side quest) ──
    const repeatClearFlow = () => {
      const afterLevelUps = () => {
        const _showReward = typeof showBossReward==='function' ? showBossReward : (cb=>cb());
        _showReward(() => {
          if(G) G._bossSequenceActive = false;
          const nextZone = loreIdx + 1;
          const loreExists = loreIdx < LORE_REVEALS.length;
          const isFinalZone = nextZone >= ZONES.length;
          const doNext = () => {
            if(isFinalZone){
              // Completed the full dungeon — salvage then send to town
              log('✨ The dungeon is conquered. Return to Elderfen.','l');
              showSalvagePrompt(()=>{
                if(typeof fadeToScreen==='function'){
                  fadeToScreen('town',()=>{ if(typeof showTownHub==='function') showTownHub(); });
                } else if(typeof showTownHub==='function'){
                  showTownHub();
                }
              });
            } else {
              // Show map so player can choose: next zone or available side quest
              if(typeof showMap==='function') showMap(true);
            }
          };
          if(loreExists){
            showLoreReveal(loreIdx, doNext);
          } else {
            doNext();
          }
        });
      };
      if(G.xp>=G.xpNeeded){
        G.xp-=G.xpNeeded;
        G._afterLevelUpCallback=afterLevelUps;
        doLevelUp();
      } else {
        afterLevelUps();
      }
    };

    setTimeout(()=>{
      showBossVictory(
        defeatedEnemy.name,
        defeatedEnemy.title || '',
        _firstClear ? firstClearFlow : repeatClearFlow
      );
    }, 900);
    return;
  }

  // In multi-enemy rooms, only advance when ALL enemies are dead
  if(G.currentEnemies&&G.currentEnemies.length>1){
    // Mark this enemy as dead in the group
    const _dying=G.currentEnemies.find(e=>e===G.currentEnemy);
    if(_dying) _dying.dead=true;
    if(!allEnemiesDead()){
      // Room not clear yet — let player target remaining enemies
      const _dyingIdx=G.currentEnemies.indexOf(_dying);
      G._dyingCards=G._dyingCards||{};
      G._dyingCards[_dyingIdx]=Date.now();
      // Gold burst for multi-enemy individual kill
      if(typeof spawnGoldBurst==='function'){
        const _gc=document.querySelector('.enemy-card[data-idx="'+_dyingIdx+'"]');
        if(_gc)spawnGoldBurst(_gc);
      }
      G.currentEnemy=null;
      syncTarget();
      setTimeout(()=>{ autoSave(); }, 800);
      return;
    }
  }

  // ── Tutorial fight completion ─────────────────────────────
  if(G._isTutorialFight){
    G._isTutorialFight = false;

    // ── Full restore: HP, resource, spell slots, charges, cooldowns ──
    G.hp = G.maxHp;

    // Restore class resource and spell slots
    if(G.spellSlots && G.spellSlotsMax){
      // Wizard: restore all spell slots, then recalculate G.res from them
      G.spellSlots = Object.assign({}, G.spellSlotsMax);
      G.res = Object.values(G.spellSlots).reduce(function(a,b){return a+b;}, 0);
    } else {
      G.res = G.resMax != null ? G.resMax : G.res;
    }

    // Clear skill cooldowns and reset all charges to class defaults
    G.skillCooldowns = {};
    G.skillCharges   = {};
    var _cls = CLASSES && CLASSES[G.classId];
    if(_cls && _cls.skills){
      _cls.skills.forEach(function(sk){
        if(sk.charges) G.skillCharges[sk.id] = sk.charges;
      });
    }

    log('✅ Tutorial complete! Your HP and resources have been fully restored. The real descent begins now.','s');
    G.currentEnemy  = null;
    G.currentEnemies = [];
    renderAll();
    const neb = document.getElementById('nextEnemyBtn');
    const etb = document.getElementById('endTurnBtn');
    if(neb){ neb.textContent = '⚔ BEGIN DESCENT ▶'; neb.style.display = 'block'; }
    if(etb) etb.style.display = 'none';
    return;
  }

  // Room fully cleared — now count it as one kill toward zone progress
  G.zoneKills++;
  if(G.zoneKills>=ZONES[G.zoneIdx].kills&&!G.bossReady&&!G.runBossDefeated[G.zoneIdx]){
    G.bossReady=true;
    document.getElementById('bossAlert').style.display='block';
    log('Zone cleared! The boss stirs...','s');
    // Phase B: Fortified — guaranteed rare+ drop on last enemy before boss
    if(G._activeModifier && G._activeModifier.effects.guaranteedRareDrop){
      const rarePool=ITEMS.filter(i=>i.slot&&(i.rarity==='rare'||i.rarity==='epic')&&!i.isMaterial);
      if(rarePool.length){
        const drop={...rarePool[Math.floor(Math.random()*rarePool.length)],qty:1};
        addItem(drop);
        log('🏰 Fortified: '+drop.icon+' '+drop.name+' (guaranteed rare drop)!','l');
      }
    }
  }

  G.currentEnemy=null;
  renderAll();

  // ── Multi-kill gold bonus (C18) ─────────────────────────────
  const _fightEnemyCount = (G.currentEnemies||[]).length;
  const _fightGold = G._fightGoldEarned||0;
  if(_fightEnemyCount>=2 && _fightGold>0){
    const multiPct = _fightEnemyCount===2 ? 0.15 : _fightEnemyCount===3 ? 0.25 : 0.40;
    const multiBonus = Math.floor(_fightGold * multiPct);
    if(multiBonus>0){
      G.gold+=multiBonus; G.totalGold+=multiBonus;
      log('⚔ Multi-kill bonus: +'+multiBonus+'🪙','l');
    }
  }

  // ── Flawless fight gold bonus (C19) ─────────────────────────
  if(!G._fightDamageTaken && _fightGold>0){
    const flawlessBonus = Math.floor(_fightGold * 0.25);
    if(flawlessBonus>0){
      G.gold+=flawlessBonus; G.totalGold+=flawlessBonus;
      log('⭐ Flawless Victory: +'+flawlessBonus+'🪙 bonus!','l');
    }
    // Phase B: Track flawless for unlocks
    if(typeof updateUnlockStats==='function') updateUnlockStats('flawless');
    G.flawlessWins=(G.flawlessWins||0)+1;
    if(G.classId==='rogue') G._lifetimeFlawlessRogue=(G._lifetimeFlawlessRogue||0)+1;
  }
  // ── Chroma tracking: post-fight checks ──
  if(G.classId==='wizard'&&G.hp>0&&G.hp<=5) G._lowHpWins=(G._lowHpWins||0)+1;
  if(G.classId==='barbarian'&&G.hp===1) G._wonAt1HP=true;
  G._fightGoldEarned=0;
  G._fightDamageTaken=false;
  G._dmgThisFight=0;
  G._usedSpellSlotThisFight=false;

  // Track dungeon run progress
  G.dungeonFights=(G.dungeonFights||0)+1;
  if(!G.campUnlocked&&G.dungeonFights>=G.dungeonGoal){
    G.campUnlocked=true;
    G._campReached=true;
    // Phase B: Track campfire for unlocks
    if(typeof updateUnlockStats==='function') updateUnlockStats('campfire');
    // ── Campfire survival bonus (C20) ───────────────────────
    if(G.hp>G.maxHp*0.5){
      const survivalBonus=Math.floor(8+(G.zoneIdx||0)*1);
      G.gold+=survivalBonus; G.totalGold+=survivalBonus;
      log('💪 Survival Bonus: +'+survivalBonus+'🪙 for reaching camp strong!','l');
    }
    log('🔥 Campfire unlocked! You can rest after '+(G.dungeonGoal)+' fights.','l');
    flashCampBtn();
  } else {
    updateCampBtn();
  }
  // Show "Next Enemy" button — player can also camp before proceeding
  const neb=document.getElementById('nextEnemyBtn');
  const etb=document.getElementById('endTurnBtn');
  if(neb){
    const remaining=Math.max(0,G.dungeonGoal-G.dungeonFights);
    neb.textContent=G.campUnlocked||remaining===0
      ?'⚔ NEXT ENEMY ▶'
      :'⚔ NEXT ENEMY ('+(G.dungeonGoal-G.dungeonFights)+' to camp)';
    neb.style.display='block';
  }
  if(etb){etb.style.display='none';}
}


// ══════════════════════════════════════════════════════════
//  HARDCORE DEATH SCREEN
// ══════════════════════════════════════════════════════════
const DEATH_EPITAPHS = [
  "The Gate releases you. It has done this before. It will do it again.",
  "The seal holds. For now. Rest, remember, and descend again.",
  "Elderfen received you as it always has — without question, without judgment.",
  "Three hundred years of patience. A little more will not break it.",
  "You forgot again. You will remember again. This is how it works.",
  "The town was still there when you surfaced. It always is. It always will be.",
  "The darkness did not win. It only postponed.",
  "The people of Elderfen lit a candle for you. They do not know why. They do it anyway.",
  "The seal is not broken. You are not broken. Try again.",
  "Somewhere below, the Unnamed waits. It is used to waiting. So are you.",
];

function showDeathScreen(){
  if(!G)return;
  // Record this run in the graveyard
  if(typeof recordGraveyardEntry==='function') recordGraveyardEntry(G);
  // Persist lifetime chroma trackers on death so progress isn't lost
  const _deathSlot=(typeof activeSaveSlot!=='undefined')?activeSaveSlot:null;
  if(typeof updateSlotData==='function'&&_deathSlot&&G){
    updateSlotData(_deathSlot, d=>{
      d.lifetimeSmitesPaladin=G._lifetimeSmites||0;
      d.lifetimeChannelsCleric=G._lifetimeChannels||0;
      d.lifetimePoisonsDruid=G._lifetimePoisonsApplied||0;
      d.lifetimeWildShapeTurnsDruid=G._lifetimeWildShapeTurns||0;
      d.lifetimeFlawlessRogue=G._lifetimeFlawlessRogue||0;
      d.lifetimeGoldRogue=G._lifetimeGoldRogue||0;
      d.lifetimeObjectivesRanger=G._lifetimeObjectivesRanger||0;
      d.lifetimeMarkedBossKillsRanger=G._markedBossKills||0;
    });
  }
  const cls=CLASSES[G.classId];
  const zone=ZONES[G.zoneIdx];
  const bossesKilled=G.bossDefeated?Object.values(G.bossDefeated).filter(Boolean).length:0;

  // Epitaph
  const epitaph=DEATH_EPITAPHS[Math.floor(Math.random()*DEATH_EPITAPHS.length)];
  document.getElementById('deathEpitaph').textContent='"'+epitaph+'"';
  document.getElementById('deathSub').textContent=cls.name.toUpperCase()+' — ZONE '+zone.num+' — LEVEL '+G.level;

  // Stats
  const rarityLabel={common:'Common',uncommon:'Uncommon',rare:'Rare',epic:'Epic',legendary:'Legendary'};
  const bestItem=G.equipped?Object.values(G.equipped).filter(Boolean).sort((a,b)=>{
    const r=['common','uncommon','rare','epic','legendary'];
    return r.indexOf(b.rarity)-r.indexOf(a.rarity);
  })[0]:null;

  document.getElementById('deathStats').innerHTML=`
    <div class="death-stat-row"><span class="death-stat-label">Class</span><span class="death-stat-val highlight">${cls.name}${G.subclassId&&typeof SUBCLASSES!=='undefined'&&SUBCLASSES[G.subclassId]?' / '+SUBCLASSES[G.subclassId].name:''}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Level Reached</span><span class="death-stat-val highlight">${G.level}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Zone</span><span class="death-stat-val">${zone.name}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Enemies Slain</span><span class="death-stat-val">${G.totalKills}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Bosses Defeated</span><span class="death-stat-val">${bossesKilled}/8</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Gold Earned</span><span class="death-stat-val gold">🪙 ${G.totalGold}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Damage Dealt</span><span class="death-stat-val">${(G.totalDmgDealt||0).toLocaleString()}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Damage Taken</span><span class="death-stat-val">${(G.totalDmgTaken||0).toLocaleString()}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Critical Hits</span><span class="death-stat-val">${G.totalCrits||0}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Flawless Wins</span><span class="death-stat-val">${G.flawlessWins||0}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Time Played</span><span class="death-stat-val">${typeof formatPlayTime==='function'?formatPlayTime(G.playTime||0):'—'}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Cause of Death</span><span class="death-stat-val death-cause">${G.causeOfDeath||'Unknown'}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Best Item</span><span class="death-stat-val">${bestItem?iconHTML(bestItem.icon)+' '+bestItem.name:'None'}</span></div>
  `;

  // ── Run highlight — best moment ──
  const hlBox=document.getElementById('deathHighlight');
  const hlContent=document.getElementById('deathHighlightContent');
  if(hlBox&&hlContent){
    let hlText='';
    if((G.biggestHit||0)>=20){
      hlText='💥 Biggest Hit: '+(G.biggestHit)+' damage — '+(G.biggestHitSource||'Attack');
    } else if((G.flawlessWins||0)>=3){
      hlText='⭐ '+G.flawlessWins+' Flawless Victories — untouchable.';
    } else if(bossesKilled>=3){
      hlText='🏆 '+bossesKilled+' Bosses Defeated — a worthy challenger.';
    } else if((G.totalKills||0)>=30){
      hlText='⚔ '+G.totalKills+' enemies slain — none forgotten.';
    }
    if(hlText){
      hlContent.textContent=hlText;
      hlBox.style.display='block';
    } else {
      hlBox.style.display='none';
    }
  }

  // Blood drop particles
  const screen=document.getElementById('screen-death');

  // Always offer return to Elderfen — run continues from town
  const retryBtn=document.getElementById('deathRetryBtn');
  if(retryBtn) retryBtn.textContent='⚔ RETURN TO ELDERFEN';

  for(let i=0;i<18;i++){
    setTimeout(()=>{
      const drop=document.createElement('div');
      drop.className='blood-drop';
      drop.style.left=Math.random()*100+'%';
      drop.style.top='-20px';
      drop.style.height=(20+Math.random()*60)+'px';
      drop.style.animationDuration=(1.5+Math.random()*2.5)+'s';
      drop.style.animationDelay=(Math.random()*3)+'s';
      screen.appendChild(drop);
      setTimeout(()=>drop.remove(),6000);
    },i*200);
  }

  showScreen('death');
  AUDIO.stopBGM();
}

function fireSpiritualWeapon(){
  if(!G.spiritualWeaponActive||!G.currentEnemy||G.currentEnemy.hp<=0)return;
  AUDIO.sfx.spiritualWeapon();
  const swDie=G.level>=5?10:8;
  const swHits=G._classSetBonus==='cleric_set'?2:1;
  for(let si=0;si<swHits;si++){
    if(!G.currentEnemy||G.currentEnemy.hp<=0)break;
    let swDmg=roll(swDie)+(G.level>=9?roll(swDie):0)+getSpellPower();
    const swCrit=G._allSeeing&&roll(20)>=18;
    if(swCrit){swDmg=Math.ceil(swDmg*2);log('👁 All-Seeing: Spiritual Weapon CRIT!','s');}
    dealToEnemy(swDmg,swCrit,si===0?'⚔ Spiritual Weapon':'⚔ Spiritual Weapon (2nd)');
  }
  if(G._classSetBonus==='cleric_set')log('✦ Divine Covenant: Spiritual Weapon strikes twice!','l');
  if(G.currentEnemy&&G.currentEnemy.hp<=0){G.spiritualWeaponActive=false;onEnemyDied();return;}
  G.spiritualWeaponTurns--;
  log('⚔ Spiritual Weapon ('+G.spiritualWeaponTurns+' turns left)','s');
  if(G.spiritualWeaponTurns<=0){G.spiritualWeaponActive=false;log('Spiritual Weapon fades.','s');}
}

function showChannelDivinityChoice(){
  // Show a small inline choice panel
  let panel = document.getElementById('channelDivinityChoice');
  if(panel){ panel.remove(); }
  panel = document.createElement('div');
  panel.id = 'channelDivinityChoice';
  panel.style.cssText = 'position:fixed;bottom:120px;left:50%;transform:translateX(-50%);z-index:800;background:linear-gradient(135deg,#0a0a1a,#1a1030);border:2px solid #8866cc;box-shadow:0 0 20px rgba(120,80,200,0.4),4px 4px 0 #000;padding:14px 18px;font-family:"Press Start 2P",monospace;text-align:center;border-radius:3px;';
  panel.innerHTML = `
    <div style="font-size:7px;color:#aa88ff;letter-spacing:2px;margin-bottom:10px;">✝ CHANNEL DIVINITY</div>
    <div style="display:flex;gap:10px;justify-content:center;">
      <button onclick="resolveChannelDivinity('smite')" style="background:linear-gradient(135deg,#2a0a3a,#4a1a5a);border:1px solid #8844cc;color:#ddaaff;font-family:'Press Start 2P',monospace;font-size:7px;padding:8px 12px;cursor:pointer;border-radius:2px;">⚡ DIVINE SMITE<br><span style="font-size:5px;color:#aa88ff;">3d8 radiant dmg</span></button>
      <button onclick="resolveChannelDivinity('heal')" style="background:linear-gradient(135deg,#0a2a1a,#1a4a2a);border:1px solid #44aa66;color:#aaffcc;font-family:'Press Start 2P',monospace;font-size:7px;padding:8px 12px;cursor:pointer;border-radius:2px;">💚 PRESERVE LIFE<br><span style="font-size:5px;color:#88cc99;">3d8+WIS heal</span></button>
    </div>`;
  document.body.appendChild(panel);
}

function resolveChannelDivinity(choice){
  const panel = document.getElementById('channelDivinityChoice');
  if(panel) panel.remove();
  if(choice === 'smite'){
    AUDIO.sfx.sacredFlame();
    const d = roll(8)+roll(8)+getSpellPower();
    dealToEnemy(d, false, 'Divine Smite ✝️');
    log('✝️ Divine Smite — radiant light erupts!','s');
  } else {
    AUDIO.sfx.heal();
    const h = roll(8)+roll(8)+roll(8)+md(G.stats.wis)+(G.talents.includes('Blessed Healing')?8:0);
    heal(h, 'Preserve Life ✝️');
  }
  if(G.classId==='cleric'&&G._devotionEngine){G.skillCooldowns['channel_divinity']=Date.now()+3000;}
  G.actionUsed=true;
  renderAll();
}

function showPhase2Overlay(bossName, phaseName){
  const overlay=document.getElementById('phase2Overlay');
  const inner=document.getElementById('phase2Inner');
  const nameEl=document.getElementById('phase2BossName');
  const phaseEl=document.getElementById('phase2PhaseName');
  if(!overlay||!inner)return;
  if(nameEl)nameEl.textContent=bossName.toUpperCase();
  if(phaseEl)phaseEl.textContent=phaseName.toUpperCase();
  overlay.style.display='flex';
  overlay.style.animation='phase2-overlay-in 0.3s ease-out forwards';
  setTimeout(()=>{
    inner.style.transition='opacity 0.3s ease-out, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)';
    inner.style.opacity='1';
    inner.style.transform='scale(1)';
  },50);
  setTimeout(()=>{
    inner.style.transition='opacity 0.4s ease-in';
    inner.style.opacity='0';
    inner.style.transform='scale(0.8)';
    overlay.style.animation='phase2-overlay-out 0.4s ease-in forwards';
    setTimeout(()=>{
      overlay.style.display='none';
      overlay.style.animation='';
      inner.style.opacity='0';
      inner.style.transform='scale(0.7)';
      inner.style.transition='';
    },400);
  },2500);
}

function onPlayerDied(){
  if(!G||G._dyingFlag)return;
  // God mode: block death entirely — restore HP and continue
  if(typeof _dev_godMode!=='undefined'&&_dev_godMode){G.hp=G.maxHp;if(typeof renderHUD==='function')renderHUD();return;}
  // Undying Fury (Barbarian): survive at 1 HP once per rest
  if(G.classId==='barbarian'&&G._undyingFury&&!G._undyingFuryUsed){
    G._undyingFuryUsed=true;G.hp=1;G._dyingFlag=false;
    log('🔥 Undying Fury: survived at 1 HP! (once per rest)','s');return;
  }
  // Undying Light (Cleric): stabilize at 1 HP once per rest
  if(G.classId==='cleric'&&G._undyingLight&&!G._undyingLightUsed){
    G._undyingLightUsed=true;G.hp=1;G._dyingFlag=false;
    log('✝️ Undying Light: stabilized at 1 HP! (once per rest)','s');return;
  }
  // Branch: Death Defiant — survive one killing blow at 1 HP (once per branch run, flag consumed)
  if(G._branchDeathDefiant){
    G._branchDeathDefiant=false;
    G.hp=1;
    log('💀 Death Defiant: survived a killing blow at 1 HP!','s');
    if(typeof renderAll==='function') renderAll();
    return;
  }
  // Phoenix Feather: revive once at 30% HP (item consumed on use)
  if(typeof hasEquippedPassive==='function'&&hasEquippedPassive('phoenixRevive')){
    // Find and remove the feather from equipped slots
    for(const slot of Object.keys(G.equipped)){
      if(G.equipped[slot]&&G.equipped[slot].passive&&G.equipped[slot].passive.id==='phoenixRevive'){
        if(typeof removeItemStats==='function') removeItemStats(G.equipped[slot]);
        G.equipped[slot]=null;
        break;
      }
    }
    G.hp=Math.max(1,Math.floor(G.maxHp*0.3));
    G._fightDamageTaken=true;
    if(typeof updateUnlockStats==='function') updateUnlockStats('phoenix_revive');
    if(typeof checkUnlocks==='function') checkUnlocks();
    AUDIO.sfx.secondWind();
    log('🪶 Phoenix Feather: risen from the ashes at 30% HP! (consumed)','s');
    if(typeof renderAll==='function') renderAll();
    return; // death cancelled
  }
  G._dyingFlag=true;
  if(enemyTurnTimeout){clearTimeout(enemyTurnTimeout);enemyTurnTimeout=null;}
  if(reactionTimer){clearTimeout(reactionTimer);reactionTimer=null;}
  hideReactionPrompt();
  G.hp=0; G.isPlayerTurn=false;
  G.currentEnemy=null;
  // Freeze player sprite on last defend frame — looks hurt/beaten
  if(typeof stopImageAnim==='function') stopImageAnim();
  const _pSpr=document.getElementById('playerSprite');
  if(_pSpr&&window.hasImageSprite&&window.hasImageSprite(G.classId)){
    window.renderImageSprite(G.classId,'defend',2,_pSpr,260);
  }
  AUDIO.sfx.death();
  log('💔 You have fallen...','e');

  // Track death for unlocks
  if(typeof updateUnlockStats==='function') updateUnlockStats('death');
  if(typeof checkUnlocks==='function') checkUnlocks();
  autoSave();

  // If lives remain: decrement and retreat to campfire instead of full death screen
  if(G.lives>0){
    G.lives--;
    G.hp=Math.max(1,Math.floor(G.maxHp*0.25)); // survive at 25% HP
    G.currentEnemies=[];
    const subEl=document.getElementById('deathOverlaySub');
    if(subEl) subEl.textContent='RETREATING TO CAMPFIRE... ('+G.lives+' '+(G.lives===1?'LIFE':'LIVES')+' LEFT)';
    autoSave();
    setTimeout(()=>{
      showDeathOverlay(()=>{
        if(typeof showCampfire==='function') showCampfire();
      });
    },800);
    return;
  }

  // No lives left: salvage prompt → death screen → "Return to Elderfen"
  setTimeout(()=>{
    showDeathOverlay(()=>{
      showSalvagePrompt(()=>{
        showDeathScreen();
      });
    });
  },800);
}

function showDeathOverlay(onDone){
  const overlay=document.getElementById('deathOverlay');
  const inner=document.getElementById('deathOverlayInner');
  if(!overlay||!inner){setTimeout(onDone,1800);return;}
  overlay.style.display='flex';
  overlay.style.animation='death-overlay-bg-in 0.4s ease-out forwards';
  // Animate inner content in
  setTimeout(()=>{
    inner.style.transition='opacity 0.35s ease-out, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)';
    inner.style.opacity='1';
    inner.style.transform='scale(1)';
  },50);
  // Hold for a moment then fade out and proceed to camp
  setTimeout(()=>{
    inner.style.transition='opacity 0.4s ease-in';
    inner.style.opacity='0';
    overlay.style.animation='death-overlay-out 0.5s ease-in forwards';
    setTimeout(()=>{
      overlay.style.display='none';
      overlay.style.animation='';
      inner.style.opacity='0';
      inner.style.transform='scale(0.7)';
      inner.style.transition='';
      onDone();
    },500);
  },2200);
}

// ══════════════════════════════════════════════════════════
//  SALVAGE PROMPT — pick 1 item when run ends
// ══════════════════════════════════════════════════════════

let _salvageDone = null;
let _salvageSelected = null;
const SALVAGE_ALLOWED_RARITIES = ['common','uncommon','rare'];

function showSalvagePrompt(onDone){
  if(!G){ onDone(); return; }

  // Collect all salvageable items from inventory + equipped
  const candidates = [];
  // Inventory
  (G.inventory||[]).forEach((item,i)=>{
    if(item && SALVAGE_ALLOWED_RARITIES.includes(item.rarity)){
      candidates.push({item, source:'inventory', idx:i});
    }
  });
  // Equipped slots (skip starter weapon — it's always common and class-specific)
  const starterIds = ['sword','dagger','staff','bow','club'];
  Object.entries(G.equipped||{}).forEach(([slot,item])=>{
    if(item && SALVAGE_ALLOWED_RARITIES.includes(item.rarity) && !starterIds.includes(item.id)){
      candidates.push({item, source:'equipped', idx:slot});
    }
  });

  if(candidates.length === 0){ onDone(); return; }

  _salvageDone = onDone;
  _salvageSelected = null;

  const rc = {common:'#9a8868',uncommon:'var(--green2)',rare:'var(--blue2)'};
  const grid = document.getElementById('salvageGrid');
  const confirmBtn = document.getElementById('salvageConfirmBtn');
  const selectedName = document.getElementById('salvageSelectedName');
  if(!grid){ onDone(); return; }

  confirmBtn.disabled = true;
  selectedName.textContent = '';

  grid.innerHTML = candidates.map((c,i)=>{
    const col = rc[c.item.rarity]||'#888';
    const statsStr = Object.entries(c.item.stats||{}).filter(([k,v])=>v&&k!=='heal').map(([k,v])=>`+${v} ${k}`).join(' · ');
    const healStr = c.item.stats&&c.item.stats.heal ? `Heals ${c.item.stats.heal} HP` : '';
    const src = c.source==='equipped' ? `<span class="salvage-badge">EQUIPPED</span>` : '';
    return `<div class="salvage-item" id="salvItem${i}" onclick="selectSalvage(${i})">
      <span class="salvage-item-icon">${iconHTML(c.item.icon)}</span>
      <div class="salvage-item-info">
        <span class="salvage-item-name" style="color:${col}">${c.item.name} ${src}</span>
        <span class="salvage-item-rarity" style="color:${col}">${c.item.rarity.toUpperCase()}</span>
        <span class="salvage-item-stats">${statsStr||healStr}</span>
      </div>
    </div>`;
  }).join('');

  // Store candidates on window for selectSalvage/confirm
  window._salvageCandidates = candidates;

  document.getElementById('salvageOverlay').classList.add('open');
}

function selectSalvage(i){
  _salvageSelected = i;
  document.querySelectorAll('.salvage-item').forEach((el,j)=>{
    el.classList.toggle('selected', j===i);
  });
  const confirmBtn = document.getElementById('salvageConfirmBtn');
  const selectedName = document.getElementById('salvageSelectedName');
  confirmBtn.disabled = false;
  const c = window._salvageCandidates && window._salvageCandidates[i];
  if(c) selectedName.textContent = c.item.icon+' '+c.item.name+' will be added to your stash.';
}

function confirmSalvage(){
  const c = window._salvageCandidates && window._salvageCandidates[_salvageSelected];
  if(c && typeof addToStash==='function'){
    addToStash({...c.item, qty:1});
  }
  _closeSalvageOverlay();
}

function skipSalvage(){
  _closeSalvageOverlay();
}

function _closeSalvageOverlay(){
  document.getElementById('salvageOverlay')?.classList.remove('open');
  window._salvageCandidates = null;
  _salvageSelected = null;
  const done = _salvageDone;
  _salvageDone = null;
  if(done) done();
}
