
function calcPlayerDmg(){
  // G.atk already includes weapon ATK/magATK from applyItemStats — don't add again
  let base=G.atk+G.profBonus;
  G.upgrades.filter(u=>u.bought&&u.eff==='atk').forEach(u=>base+=u.val);
  if(G.raging)base+=2+Math.floor(G.level/4)+(G.talents.includes('Brutal')&&G.classId==='barbarian'?4:0);
  // Rage STR mod: barbarians add their STR modifier to rage attacks
  if(G.raging&&G.classId==='barbarian')base+=Math.max(0,md(G.stats&&G.stats.str?G.stats.str:10));
  // Blood Offering (campfire ritual): +20% dmg while HP < 50%
  if(G._bloodOffering&&G.hp<G.maxHp*0.5)base=Math.ceil(base*1.2);
  // Thunder Clap: once per player turn (not per-hit), deal 1d6+LVL/4 bonus damage while raging
  if(G.raging&&G.talents.includes('Thunder Clap')&&G.currentEnemy&&!G._thunderClapUsed){
    G._thunderClapUsed=true;
    const tc=roll(6)+Math.floor(G.level/4);
    dealToEnemy(tc,false,'Thunder Clap ⚡');
  }
  // Feral Charge: first attack each fight deals +2d6 bonus damage
  if(G.classId==='barbarian'&&G._feralCharge&&!G._feralChargeUsed){G._feralChargeUsed=true;base+=roll(6)+roll(6);log('🐗 Feral Charge: +2d6 bonus damage!','s');}
  // Rupture: double damage vs Stunned enemies
  if(G.classId==='barbarian'&&G._rupture&&G.currentEnemy&&G.currentEnemy.conditions){
    const isStunned=G.currentEnemy.conditions.find(c=>c.name==='Stunned'&&c.turns>0);
    if(isStunned){base=Math.ceil(base*2);log('💥 Rupture: double damage vs Stunned!','s');}
  }
  if(G.currentEnemy&&G.currentEnemy._vulnerable){base=Math.ceil(base*1.10);delete G.currentEnemy._vulnerable;log('Vulnerable! +10% dmg applied.','s');}
  if(G.hunterMarked)base+=roll(6);
  // NOTE: Beast Companion bonus is applied in basic_attack case only, not here
  // Seasoned Hunter: ATK bonus from kills this fight
  if(G.classId==='ranger'&&G._seasonedHunterBonus)base+=G._seasonedHunterBonus;
  // Favored Terrain: +15% damage this fight
  if(G.classId==='ranger'&&G._favoredTerrainActive)base=Math.ceil(base*1.15);
  // Ranger capstone — One With the Hunt: +DEX bonus to all attacks
  if(G.classId==='ranger'&&G.capstoneUnlocked)base+=Math.max(0,md(G.stats.dex));
  // Deadeye: guaranteed crit when enemy is Marked (ATK already applied from apply())
  // Deadeye: first attack this turn is a crit while Hunter's Mark is active
  if(G.classId==='ranger'&&G._deadeye&&G.hunterMarked&&!G._deadeyeUsed){/* crit forced below, consume below */}
  if(G.classId==='paladin'&&G.subclassId==='devotion')base+=md(G.stats.cha); // Sacred Weapon: +CHA to attacks (Devotion only)
  if(G.classId==='barbarian'&&G.talents.includes('Blood Fury')&&G.hp<G.maxHp*0.4)base=Math.ceil(base*1.15);
  if(G.classId==='fighter'&&G.talents.includes('Weapon Master'))base=Math.ceil(base*1.1);
  if(G.classId==='fighter'&&G.talents.includes('War Gods Blessing'))base=Math.ceil(base*1.10);
  // Spell Power removed from here — applied per-spell in individual spell cases
  if(G.talents.includes('Execute')&&G.currentEnemy&&G.currentEnemy.hp<G.currentEnemy.maxHp*0.25)base=Math.ceil(base*1.5);
  // Righteous Fury: +20% damage at max Holy Power
  if(G.classId==='paladin'&&G._righteousFury&&G.res>=G.resMax)base=Math.ceil(base*1.2);
  // Unbreakable Vow: below 30% HP deal +10% damage
  if(G.classId==='paladin'&&G._unbreakableVow&&G.hp<G.maxHp*0.3)base=Math.ceil(base*1.1);
  // Blade Dancer: each consecutive attack deals +5 bonus damage (stacks up to 3)
  if(G.classId==='fighter'&&G._bladeDancer){
    G._bladeDancerStacks=Math.min(3,(G._bladeDancerStacks||0)+1);
    base+=G._bladeDancerStacks*5;
  }
  // Deathblow: +15% damage vs enemies below 50% HP
  if(G.classId==='fighter'&&G._deathblow&&G.currentEnemy&&G.currentEnemy.hp<G.currentEnemy.maxHp*0.5)base=Math.ceil(base*1.15);
  // Battle Master: Know Your Enemy — +2 ATK this fight
  if(G._knowEnemyBonus)base+=2;
  // Avenging Angel (Vengeance Paladin): below 30% HP, +3 ATK
  if(G.classId==='paladin'&&G.subclassId==='vengeance'&&G.hp<G.maxHp*0.3)base+=3;
  // Guided Strike (War Domain): +10 ATK on next attack
  if(G._guidedStrikeBonus){G._guidedStrikeBonus=false;base+=10;log('✨ Guided Strike: +10 ATK!','s');}
  // Bless: +3 to next 2 attack rolls
  if(G._blessAttacks>0){G._blessAttacks--;base+=3;log('🙏 Bless: +3 attack!','s');}
  // Camouflage (Gloom Stalker): +1d8 bonus on first attack this fight
  if(G._camouflageActive){G._camouflageActive=false;base+=roll(8);log('🌿 Camouflage: +1d8 bonus strike!','s');}
  // Cosmic Omen (Stars Druid): +1d6 to next attack roll
  if(G._cosmicOmenActive){G._cosmicOmenActive=false;const co=roll(6);base+=co;log('🌟 Cosmic Omen: +'+co+' bonus!','s');}
  // Dreadful Strike (Gloom Stalker): +2d6 psychic on first WIS-mod attacks this fight
  if(G.subclassId==='gloom_stalker'&&(G._dreadfulStrikesLeft||0)>0){
    G._dreadfulStrikesLeft--;
    const ds=roll(6)+roll(6);
    base+=ds;
    log('🌑 Dreadful Strike: +'+ds+' psychic!','s');
  }
  // Marked for Death (Assassin): +25% damage vs marked target
  if(G._markedForDeath){base=Math.ceil(base*1.25);log('🎯 Marked for Death: +25%!','s');}
  // Starry Form — Archer (Stars Druid): +1d8+WIS radiant per attack
  if(G._starryFormActive){const sf=roll(8)+Math.max(0,md(G.stats&&G.stats.wis?G.stats.wis:10));base+=sf;log('⭐ Starry Form: +'+sf+' radiant!','s');}
  // Rampage keystone: +3 bonus damage per kill stack (max 5)
  if(G._keystoneRampage&&G._rampageStacks>0){const r=G._rampageStacks*3;base+=r;log('🔥 Rampage: +'+r+' damage!','s');}
  const def=G.currentEnemy?(G.currentEnemy.ignoresArmor?0:(G.currentEnemy.def||0)+(G.currentEnemy._defBoost||0)-(G.currentEnemy._defDebuff||0)):0;
  let dmg=Math.max(1,base-Math.floor(def/2)+roll(4)-2);
  let crit=false;
  // Ghost Step: first attack of each fight is a guaranteed crit
  const ghostStep=G.classId==='rogue'&&G.talents.includes('Ghost Step')&&!G.firstAttackUsed;
  // Shadow Step: once per fight, next attack is an automatic critical hit
  const shadowStep=G.classId==='rogue'&&G._shadowStep&&!G._shadowStepUsed;
  if(shadowStep){G._shadowStepUsed=true;log('🌑 Shadow Step: guaranteed crit!','s');}
  const vanishCrit=G.sx&&G.sx.vanishCrit;
  if(vanishCrit)delete G.sx.vanishCrit;
  // Fighter capstone Unbreakable: auto-crit when below 25% (once per fight)
  const unbreakableCrit=G._unbreakableAutoCrit||false;
  if(unbreakableCrit)G._unbreakableAutoCrit=false;
  const critBonus=(G.critBonus||0)+(G.classId==='ranger'&&G.talents.includes('Eagle Eye')?2:0)+(G._surgeCritBonus||0);
  // Phase B: Volatile — crit range +1 for player
  const modCritBonus=(G._activeModifier && G._activeModifier.effects.critRangeBonus)||0;
  const critThresh=G.critRange-critBonus-modCritBonus;
  // Fighter capstone: advantage (roll twice take higher)
  let roll20=roll(20);
  if(G._capstone&&G.classId==='fighter'){const r2=roll(20);if(r2>roll20)roll20=r2;}
  if(ghostStep||vanishCrit||shadowStep||unbreakableCrit||roll20>=critThresh||(G.subclassId==='champion'&&G.classId==='fighter'&&G.level>=3&&roll20>=19)||(G.classId==='ranger'&&G._deadeye&&G.hunterMarked&&!G._deadeyeUsed)||(G.subclassId==='assassin'&&G.classId==='rogue'&&G.roundNum===1)){
    if(G.classId==='ranger'&&G._deadeye&&G.hunterMarked&&!G._deadeyeUsed){G._deadeyeUsed=true;log('🎯 Deadeye: first strike crits while Marked!','s');}
    // Explosive Arrow: double base dmg BEFORE crit multiplier so ×2 doesn't compound with ×2 crit
    if(G.classId==='ranger'&&G._explosiveArrow&&!G._explosiveArrowUsed){
      G._explosiveArrowUsed=true;dmg=dmg*2;
      log('💥 Explosive Arrow: base damage doubled!','s');
    }
    dmg=Math.ceil(dmg*(G.critMult||2));crit=true;
    // Infiltration Expertise (Assassin): +WIS mod flat damage on each Assassinate crit
    if(G.subclassId==='assassin'&&G.classId==='rogue'&&G.roundNum===1){
      const ie=Math.max(0,md(G.stats&&G.stats.wis?G.stats.wis:10));
      if(ie>0){dmg+=ie;log('🕵️ Infiltration Expertise: +'+ie+' psychic!','s');}
    }
  }
  if((ghostStep||vanishCrit)&&!G.firstAttackUsed){G.firstAttackUsed=true;}
  // ── Phase B: Zone modifier damage multipliers ──
  // NOTE: playerDmgMult, critDmgMult, and Predator buff are applied in dealToEnemy()
  // so they affect both physical attacks AND spell damage equally.
  if(G._activeModifier){
    const fx=G._activeModifier.effects;
    // Ancestral Fury: +2 ATK per kill stack (physical path — spells get this via getSpellPower)
    if(fx.killAtkStack && G._ancestralStacks > 0)
      dmg += G._ancestralStacks * fx.killAtkStack;
  }
  return{dmg:Math.ceil(dmg),crit};
}

function dealToEnemy(dmg,crit,source){
  if(!G.currentEnemy)return;
  // Phase B: Thick Fog — 12% miss chance (player misses enemy)
  if(G._activeModifier && G._activeModifier.effects.missChance && Math.random() < G._activeModifier.effects.missChance){
    AUDIO.sfx.miss();
    log('🌫️ Your '+source+' vanishes into the fog — MISS!','c');
    return;
  }
  // Phase B: Echoing Halls — single-target -10% (skip for AOE)
  if(!G._isAoeDamage && G._activeModifier && G._activeModifier.effects.singleDmgMult)
    dmg=Math.ceil(dmg*G._activeModifier.effects.singleDmgMult);
  // Phase B: Zone modifier damage multipliers (applies to both physical and spell damage)
  if(G._activeModifier){
    const _fx=G._activeModifier.effects;
    if(_fx.playerDmgMult) dmg=Math.ceil(dmg*_fx.playerDmgMult); // Glass Cannon
    if(crit && _fx.critDmgMult) dmg=Math.ceil(dmg*_fx.critDmgMult); // Volatile
    // Predator and Prey buff
    if(G._predatorBuff && G._predatorBuff.side==='player' && G._predatorBuff.turns>0)
      dmg=Math.ceil(dmg*G._predatorBuff.mult);
  }
  // Predator: +15% damage vs enemies below 50% HP
  if(G._branchPredator&&G.currentEnemy.hp<=G.currentEnemy.maxHp*0.5) dmg=Math.ceil(dmg*1.15);
  // Legendary Grace — God-Slayer's Core: +20% damage vs bosses
  if(G._graceGodslayer&&G.currentEnemy.isBoss) dmg=Math.ceil(dmg*1.12);
  // Rare Event: Empress's Lullaby — +25% damage vs Malvaris
  if(G._rareEventFlags.empressBossBonus&&G.currentEnemy.isBoss&&G.currentEnemy.name==='Malvaris, The Hollow Empress') dmg=Math.ceil(dmg*1.25);
  // Legendary Grace — The First Blade: first attack each fight deals double damage
  if(G._graceFirstBlade&&!G._graceFirstBladeUsed){G._graceFirstBladeUsed=true;dmg=Math.ceil(dmg*1.5);log('🗡️ The First Blade: +50% DAMAGE!','s');}
  // Tutorial: cap per-hit damage so the Training Dummy survives long enough to practice on
  if(G.currentEnemy.isTutorial) dmg=Math.min(dmg,10);
  // ── Valdris — Frozen Bulwark: 50% dmg reduction while Frozen Soldiers are alive ──
  if(G.currentEnemy&&G.currentEnemy.id==='valdris'){
    const hasSoldiers=(G.currentEnemies||[]).some(en=>!en.dead&&en.hp>0&&en._isFrozenSoldier);
    if(hasSoldiers){dmg=Math.ceil(dmg*0.5);log('❄ Frozen Bulwark shields Valdris! (-50% dmg)','c');}
  }
  G.currentEnemy.hp-=dmg;
  // Shadow Dive (Gloom Stalker): next attack applies Frightened(2)
  if(G._shadowDiveActive&&G.currentEnemy&&!G.currentEnemy.dead&&G.currentEnemy.hp>0){
    G._shadowDiveActive=false;
    if(typeof addConditionEnemy==='function') addConditionEnemy('Frightened',2);
    log('🌑 Shadow Dive: Frightened(2)!','s');
  }
  // Envenom stacks (Assassin): on hit, apply Poisoned
  if(G._envenomStacks>0&&G.currentEnemy&&!G.currentEnemy.dead&&G.currentEnemy.hp>0){
    G._envenomStacks--;
    if(typeof addConditionEnemy==='function') addConditionEnemy('Poisoned',3);
    log('☠ Envenom: target poisoned!','s');
  }
  // Assassin's Tools: apply Poisoned(2) to next target after a kill
  if(G._assassinToolsPoison&&G.currentEnemy&&!G.currentEnemy.dead&&G.currentEnemy.hp>0){
    G._assassinToolsPoison=false;
    if(typeof addConditionEnemy==='function') addConditionEnemy('Poisoned',2);
    log("☠ Assassin's Tools: poison applied!",'s');
  }
  // Run summary tracking
  G.totalDmgDealt=(G.totalDmgDealt||0)+dmg;
  G._dmgThisFight=(G._dmgThisFight||0)+dmg;
  if(dmg>(G.biggestHit||0)){G.biggestHit=dmg;G.biggestHitSource=source||'Attack';}
  spawnFloater(dmg,crit?'crit':'dmg',true);
  log(`${source}${crit?' [CRIT!]':''}: ${dmg} dmg → ${G.currentEnemy.name}`,'p');
  animEl('enemySprite','hit-anim',300);
  if(window.Anim) Anim.enemyHit();
  // Legendary Grace — Eternal Warflame: 5% chance for bonus fire damage
  if(G._graceWarflame&&Math.random()<0.05&&G.currentEnemy.hp>0){
    const fireDmg=Math.ceil(dmg*0.15);
    G.currentEnemy.hp-=fireDmg;spawnFloater(fireDmg,'crit',true);
    log('🔥 Eternal Warflame: +'+fireDmg+' fire damage!','s');updateEnemyBar();
  }
  if(crit){
    AUDIO.sfx.crit();G.totalCrits=(G.totalCrits||0)+1;checkAchievements();
    if(typeof triggerScreenShake==='function') triggerScreenShake('crit');
    // Legendary Grace — Prime Arcanum: crits restore 1 resource point
    if(G._graceArcanum){G.res=Math.min(G.resMax,G.res+1);log('💎 Prime Arcanum: +1 '+((typeof CLASSES!=='undefined'&&CLASSES[G.classId])?CLASSES[G.classId].res:'resource')+'!','s');}
    // Archmage's Ascension set bonus: spell crits restore 1 spell slot
    if(G._classSetBonus==='wizard_set'){
      const rl=restoreSpellSlot();
      if(rl){log('✦ Archmage\'s Ascension: Crit restored 1 LVL'+rl+' spell slot!','l');renderSpellSlots();}
    }
  }
  checkObjectiveProgress('damage_dealt',dmg);
  updateEnemyBar();
}

// ── AOE helpers — deal damage / conditions to ALL living enemies ──

function dealToAllEnemies(dmg,crit,source){
  const enemies=(G.currentEnemies||[]).filter(e=>!e.dead&&e.hp>0);
  if(enemies.length<=1){dealToEnemy(dmg,crit,source);return;}
  // Phase B: Echoing Halls — AOE +30%
  if(G._activeModifier && G._activeModifier.effects.aoeDmgMult)
    dmg=Math.ceil(dmg*G._activeModifier.effects.aoeDmgMult);
  G._isAoeDamage=true; // Flag so dealToEnemy skips single-target penalty
  const saved=G.currentEnemy;
  enemies.forEach(e=>{
    G.currentEnemy=e;
    G.targetIdx=(G.currentEnemies||[]).indexOf(e);
    dealToEnemy(dmg,crit,source);
  });
  G._isAoeDamage=false;
  const alive=(G.currentEnemies||[]).find(e=>!e.dead&&e.hp>0);
  G.currentEnemy=alive||saved;
  G.targetIdx=(G.currentEnemies||[]).indexOf(G.currentEnemy);
}

function addConditionAllEnemies(name,turns){
  const enemies=(G.currentEnemies||[]).filter(e=>!e.dead&&e.hp>0);
  if(enemies.length<=1){addConditionEnemy(name,turns);return;}
  const saved=G.currentEnemy;
  enemies.forEach(e=>{G.currentEnemy=e;addConditionEnemy(name,turns);});
  G.currentEnemy=saved;
}

function processAoeDeaths(){
  if(!G||!G.currentEnemies||G.currentEnemies.length<=1)return;
  const dead=G.currentEnemies.filter(e=>!e.dead&&e.hp<=0);
  if(!dead.length)return;
  // Save original target so we can restore after the loop
  const savedEnemy=G.currentEnemy;
  const savedIdx=G.targetIdx;
  for(const e of dead){
    if(!G||G._dyingFlag)return;
    G.currentEnemy=e;
    G.targetIdx=G.currentEnemies.indexOf(e);
    onEnemyDied();
  }
  // Restore to a living enemy (prefer original target if still alive)
  if(savedEnemy&&!savedEnemy.dead&&savedEnemy.hp>0){
    G.currentEnemy=savedEnemy;
    G.targetIdx=savedIdx;
  } else {
    const alive=G.currentEnemies.find(e=>!e.dead&&e.hp>0);
    if(alive){G.currentEnemy=alive;G.targetIdx=G.currentEnemies.indexOf(alive);}
    else{G.currentEnemy=null;}
  }
}

function heal(amount,source){
  // Cosmic Omen (Stars Druid): +1d6 to next heal roll
  if(G._cosmicOmenActive){G._cosmicOmenActive=false;const co=roll(6);amount+=co;log('🌟 Cosmic Omen: +'+co+' healing!','s');}
  // Sacred Aura — Lay on Hands heals 50% more
  if(G._sacredAuraLoH&&source&&source.includes('Lay on Hands'))amount=Math.ceil(amount*1.5);
  // Cleric capstone — Vessel of the Divine: all healing doubled
  if(G.classId==='cleric'&&G.capstoneUnlocked)amount=amount*2;
  // Legendary Grace — The Infinite Word: +10% to all healing
  if(G._graceInfWord)amount=Math.ceil(amount*1.1);
  G.hp=Math.min(G.maxHp,G.hp+amount);
  G.totalHealingDone=(G.totalHealingDone||0)+amount;
  spawnFloater(amount,'heal',false);
  AUDIO.sfx.heal();
  log(`${source}: +${amount} HP`,'s');
}

function updateEnemyBar(){
  if(!G.currentEnemy)return;
  const pct=Math.max(0,G.currentEnemy.hp/G.currentEnemy.maxHp*100);
  const fill=document.getElementById('enemyHpFill');
  fill.style.width=pct+'%';
  fill.style.background=pct<25?'var(--red2)':pct<50?'var(--orange2)':'var(--green2)';
  const txt=document.getElementById('enemyHpText');
  if(txt)txt.textContent=Math.max(0,Math.ceil(G.currentEnemy.hp))+' / '+G.currentEnemy.maxHp+' HP';
  // Render active conditions as tags under the enemy name
  const ctEl=document.getElementById('enemyConditionTags');
  if(ctEl){
    const condColors={Burning:'#e74c3c',Poisoned:'#27ae60',Bleeding:'#c0392b',Stunned:'#f39c12',Restrained:'#8e44ad',Frightened:'#2980b9',Weakened:'#7f8c8d',Vulnerable:'#e67e22'};
    const conds=G.currentEnemy.conditions?G.currentEnemy.conditions.filter(c=>c.turns>0):[];
    // Also show non-condition flags
    const extras=[];
    if((G.currentEnemy._consecrateTurns||0)>0) extras.push({name:'Consecrated',color:'#f1c40f'});
    if((G.currentEnemy._blindedAtk||0)>0) extras.push({name:'Blinded',color:'#95a5a6'});
    if((G.currentEnemy._defDebuff||0)>0) extras.push({name:'Exposed',color:'#e67e22'});
    ctEl.innerHTML=conds.map(c=>`<span style="font-family:'Press Start 2P',monospace;font-size:5px;color:#fff;background:${condColors[c.name]||'#555'};padding:1px 4px;border-radius:2px;">${c.name} ${c.turns}t</span>`).join('')
      +extras.map(e=>`<span style="font-family:'Press Start 2P',monospace;font-size:5px;color:#fff;background:${e.color};padding:1px 4px;border-radius:2px;">${e.name}</span>`).join('');
  }
}
