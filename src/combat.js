// ================================================================
// combat.js — Combat System
// Skill use, enemy AI, reactions, damage, death, rewards
// Descent into Eternity
// ================================================================

// ══════════════════════════════════════════════════════════
//  SKILL USE
// ══════════════════════════════════════════════════════════
function useSkill(skillId){
  if(!G||!G.isPlayerTurn||paused)return;
  const cls=CLASSES[G.classId];
  const sk=cls.skills.find(s=>s.id===skillId);
  if(!sk)return;

  // Wild Shape locks spells for druid — only claw_strike and wild_shape allowed
  const BEAR_LOCKED_SKILLS=['thorn_whip','moonbeam','entangle'];
  if(G.classId==='druid'&&G.wildShapeHp>0&&BEAR_LOCKED_SKILLS.includes(sk.id)){
    log('🐻 You are in Wild Shape — shapeshift back to cast spells!','s');return;
  }
  // Claw Strike only usable IN Wild Shape
  if(sk.id==='claw_strike'&&(!G.wildShapeHp||G.wildShapeHp<=0)){
    log('🐾 Claw Strike only available in Wild Shape!','s');return;
  }
  // Check locks
  if(sk.type==='action'&&G.actionUsed){log('Action already used this turn!','s');return;}
  if(sk.type==='bonus'&&G.bonusUsed){log('Bonus action already used!','s');return;}
  if(sk.type==='reaction'&&G.reactionUsed){log('Reaction already used!','s');return;}
  // Charge check for bonus/reaction skills
  if(sk.charges&&(G.skillCharges[sk.id]||0)<=0){log(sk.name+' has no charges left — rest at campfire to restore!','s');return;}
  const now=Date.now();
  const cdRaw=G.skillCooldowns[sk.id];
  if(cdRaw==='active'||(typeof cdRaw==='number'&&cdRaw>now)){log('That skill is on cooldown!','s');return;}
  // Holy Fervor: reduces Divine Smite effective cost by 1
  const effectiveCost=sk.id==='divine_smite'&&G.talents.includes('Holy Fervor')?Math.max(1,sk.cost-1):sk.cost;
  if(effectiveCost>0&&G.res<effectiveCost){log('Not enough '+CLASSES[G.classId].res+'!','s');return;}
  if(sk.slotCost&&(!G.spellSlots||(G.spellSlots[sk.slotCost]||0)===0)&&!G._timeStopActive&&!G._arcaneTranscendence){log('No LVL'+sk.slotCost+' spell slots remaining!','s');return;}
  if(sk.comboReq&&G.res<sk.comboReq){log('Need '+sk.comboReq+' Combo Points!','s');return;}

  // Consume
  if(effectiveCost>0) G.res-=effectiveCost;
  // Veteran's Grit: restore 5 HP whenever Momentum is consumed
  if(G.classId==='fighter'&&G._veteranGrit&&effectiveCost>0){heal(5,'Veteran\'s Grit 🩹');}
  if(sk.comboReq) G.res=Math.max(0,G.res-sk.comboReq);
  if(sk.slotCost&&!G._timeStopActive&&!G._arcaneTranscendence){
    // Arcane Surge: every 3rd spell cast costs no slot
    if(G.classId==='wizard'&&G._arcaneSurgeCount!==undefined){
      G._arcaneSurgeCount++;
      if(G._arcaneSurgeCount>=3){G._arcaneSurgeCount=0;log('🌀 Arcane Surge: spell cast for free!','s');}
      else G.spellSlots[sk.slotCost]--;
    } else {
      G.spellSlots[sk.slotCost]--;
    }
    // Spell Weaver: 25% chance to restore 1 LVL1 slot after any spell
    if(G.classId==='wizard'&&G._spellWeaver&&Math.random()<0.25&&G.spellSlots&&G.spellSlotsMax&&(G.spellSlots[1]||0)<(G.spellSlotsMax[1]||0)){
      G.spellSlots[1]++;
      log('🔮 Spell Weaver: LVL1 slot restored!','s');
    }
  }
  if(sk.cd>0) G.skillCooldowns[sk.id]=now+sk.cd*1000;
  // Battle Rhythm: Power Strike cooldown reduced by 1 turn (1000ms)
  if(G.classId==='fighter'&&G._battleRhythm&&sk.effect==='power_strike'&&G.skillCooldowns['power_strike']){
    G.skillCooldowns['power_strike']-=1000;
  }
  if(sk.charges&&G.skillCharges[sk.id]>0) G.skillCharges[sk.id]--;
  if(sk.type==='action') G.actionUsed=true;
  if(sk.type==='bonus') G.bonusUsed=true;
  if(sk.type==='reaction') G.reactionUsed=true;
  // Time Stop: count down free actions and restore turn on each use
  if(G._timeStopActive&&sk.type==='action'){
    G._timeStopTurns--;
    if(G._timeStopTurns>0){
      G.actionUsed=false;G.bonusUsed=false;
      log('⏳ Time Stop: '+G._timeStopTurns+' actions remaining!','s');
    } else {
      G._timeStopActive=false;
      log('⏳ Time Stop expires.','s');
    }
  }

  // Animate player
  animEl('playerSprite','attack-anim',400);

  // Execute effect
  doSkillEffect(sk.effect, sk);

  // Guard: if player died during skill (e.g. reckless_attack recoil), stop here
  if(!G||G.hp<=0)return;

  // Arcane Recovery: regain a slot every 3 kills (not per spell cast)

  if(G.classId==='rogue'&&(sk.effect==='basic_attack')){
    const comboGain=G._loadedDice?2:1;
    G.res=Math.min(G.resMax,G.res+comboGain);
  }
  // Paladin builds holy power on attacks
  if(G.classId==='paladin'&&sk.effect==='basic_attack'){
    G.res=Math.min(G.resMax,G.res+1);
    // Blessed Arms: every 2 basic attacks generates bonus Holy Power
    if(G._blessedArms){
      G._blessedArmsCount=(G._blessedArmsCount||0)+1;
      if(G._blessedArmsCount>=2){G._blessedArmsCount=0;G.res=Math.min(G.resMax,G.res+1);log('🌠 Blessed Arms: bonus Holy Power!','s');}
    }
  }
  // Fighter builds momentum on attacks (on top of passive regen)
  if(G.classId==='fighter'&&sk.effect==='basic_attack') G.res=Math.min(G.resMax,G.res+15);
  // Cleric devotion
  if(G.classId==='cleric'&&sk.effect==='healing_word') G.res=Math.min(G.resMax,G.res+0.5);

  if(G.currentEnemy&&G.currentEnemy.hp<=0){onEnemyDied();return;}
  // Berserker Frenzy: resolve second attack after action confirms
  if(G._frenzyPending){
    G._frenzyPending=false;
    if(G.currentEnemy&&G.currentEnemy.hp>0){
      doSkillEffect('basic_attack_frenzy',sk);
      if(G.currentEnemy&&G.currentEnemy.hp<=0){onEnemyDied();return;}
    }
  }
  renderAll();
}

function doSkillEffect(effect, sk){
  switch(effect){
    case 'basic_attack':{
      AUDIO.sfx.attack();const r=calcPlayerDmg();
      // Beast Companion (Ranger subclass): companion strikes alongside basic attack
      if(G.classId==='ranger'&&G.subclassUnlocked){
        r.dmg+=roll(6)+(G._apexCompanion?roll(6):0);
      }
      dealToEnemy(r.dmg,r.crit,'Attack');
      // Sacred Weapon: +1d6 radiant and +3 HP per hit
      if(G.sx&&G.sx.sacredWeapon&&G.sx.sacredWeapon.turns>0){
        const swRad=roll(6);dealToEnemy(swRad,false,'Sacred Weapon 🌟 radiant');
        heal(3,'Sacred Weapon');
        G.sx.sacredWeapon.turns--;
        if(G.sx.sacredWeapon.turns<=0){delete G.sx.sacredWeapon;log('Sacred Weapon fades.','s');}
      }
      // Burning Blade: 20% chance to apply Burning on basic attack
      if(G.classId==='fighter'&&G._burningBlade&&G.currentEnemy&&G.currentEnemy.hp>0&&Math.random()<0.2){
        addConditionEnemy('Burning',3);
        log('🔥 Burning Blade ignites the enemy!','c');
      }
      // Venomous: 25% chance to apply Poisoned on basic attack
      if(G.classId==='rogue'&&G._venomous&&G.currentEnemy&&G.currentEnemy.hp>0&&Math.random()<0.25){
        addConditionEnemy('Poisoned',3);
        log('🐍 Venomous: Poisoned applied!','c');
      }
      // Viper Arrows: 20% chance to apply Poisoned on attack
      if(G.classId==='ranger'&&G._viperArrows&&G.currentEnemy&&G.currentEnemy.hp>0&&Math.random()<0.2){
        addConditionEnemy('Poisoned',3);
        log('🐍 Viper Arrows: Poisoned applied!','c');
      }
      // Flurry: once per fight, basic attack fires a second hit for free
      if(G.classId==='fighter'&&G._flurry&&!G._flurryUsed&&G.currentEnemy&&G.currentEnemy.hp>0){
        G._flurryUsed=true;
        const r2=calcPlayerDmg();dealToEnemy(r2.dmg,r2.crit,'Flurry 🌪 second strike');
        log('🌪 Flurry: second strike!','s');
      }
      // Berserker Frenzy: auto second attack while raging (fired after attack animation)
      if(G.classId==='barbarian'&&G.subclassUnlocked&&G.raging&&G.currentEnemy&&G.currentEnemy.hp>0){
        G._frenzyPending=true;
      }
      // Fix 5: Spiritual Weapon fires alongside attack on same turn
      if(G.spiritualWeaponActive&&G.currentEnemy&&G.currentEnemy.hp>0){
        fireSpiritalWeapon();
      }
      break;}
    case 'power_strike':{
      // Temporarily remove _vulnerable so Power Strike itself doesn't consume it
      const hadVuln=G.currentEnemy&&G.currentEnemy._vulnerable;
      if(hadVuln)delete G.currentEnemy._vulnerable;
      const r=calcPlayerDmg();r.dmg=Math.ceil(r.dmg*2.2);
      // Restore if it was there, then set new one for NEXT hit
      if(hadVuln&&G.currentEnemy)G.currentEnemy._vulnerable=true;
      dealToEnemy(r.dmg,r.crit,'Power Strike 💪');
      if(G.currentEnemy&&G.currentEnemy.hp>0){
        G.currentEnemy._vulnerable=true;
        log('Vulnerable! Enemy takes +10% dmg on next hit.','s');
      }
      // Iron Legion set bonus: second hit at 60% damage
      if(G._classSetBonus==='fighter_set'&&G.currentEnemy&&G.currentEnemy.hp>0){
        setTimeout(()=>{
          if(!G.currentEnemy||G.currentEnemy.hp<=0)return;
          AUDIO.sfx.attack();
          const r2=calcPlayerDmg();const d2=Math.ceil(r2.dmg*0.6);
          dealToEnemy(d2,false,'⚔ Iron Legion: Second Strike');
          log('⚔ Iron Legion: second strike fires!','l');
        },380);
      }
      break;}
    case 'second_wind':{AUDIO.sfx.secondWind();const h=roll(10)+G.level;heal(h,'Second Wind');
      // Relentless Advance: Second Wind also removes one negative condition
      if(G.classId==='fighter'&&G._relentlessAdvance&&G.conditions.length>0){
        const removed=G.conditions[0];
        G.conditions=G.conditions.slice(1);
        if(G.conditionTurns)delete G.conditionTurns[removed];
        log('⚔ Relentless Advance: '+removed+' cleansed!','s');
      }
      break;}
    case 'parry':AUDIO.sfx.block();G.sx.parry=true;log('⛊ Parry set — next hit halved!','s');break;
    case 'fire_bolt':{AUDIO.sfx.burn();
      let fbd=roll(10)+md(G.stats.int)+(G.magBonus||0)+(G.subclassUnlocked&&G.classId==='wizard'?roll(6):0);
      // Brilliant Focus: +INT mod to spell damage
      if(G.classId==='wizard'&&G._brilliantFocus)fbd+=Math.max(0,md(G.stats.int));
      // Overload: spells penetrate 30% of enemy DEF
      if(G.classId==='wizard'&&G._overload&&G.currentEnemy)fbd+=Math.floor((G.currentEnemy.def||0)*0.3);
      // Elemental Shift: cast using current type, then cycle to next
      if(G.classId==='wizard'&&G._elementalShift){
        const shiftType=G._elementalShiftType||'fire';
        const typeOrder=['fire','ice','lightning'];
        G._elementalShiftType=typeOrder[(typeOrder.indexOf(shiftType)+1)%3]; // cycle for next cast
        if(shiftType==='fire'){
          dealToEnemy(fbd,false,'Fire Bolt 🔥 [Elemental]');
          if(G.currentEnemy&&G.currentEnemy.hp>0){addConditionEnemy('Burning',2);log('🔥 Elemental Shift [Fire]: enemy Burning!','c');}
        } else if(shiftType==='ice'){
          dealToEnemy(fbd,false,'Frost Bolt ❄️ [Elemental]');
          if(G.currentEnemy&&G.currentEnemy.hp>0){G.currentEnemy.def=Math.max(0,(G.currentEnemy.def||0)-4);log('❄️ Elemental Shift [Ice]: enemy DEF -4!','c');}
        } else {
          dealToEnemy(fbd,false,'Lightning Bolt ⚡ [Elemental]');
          if(G.currentEnemy&&G.currentEnemy.hp>0){
            if(Math.random()<0.5){addConditionEnemy('Stunned',1);log('⚡ Elemental Shift [Lightning]: Stun triggered!','c');}
            else log('⚡ Elemental Shift [Lightning]: Stun missed (50%).','s');
          }
        }
        log('🌀 Next cast: '+G._elementalShiftType.charAt(0).toUpperCase()+G._elementalShiftType.slice(1),'s');
      } else {
        dealToEnemy(fbd,false,'Fire Bolt 🔥');
      }
      // Metamagic: Twin — once per rest, fire bolt twice
      if(G.classId==='wizard'&&G._metamagicTwin&&!G._metamagicTwinUsed&&G.currentEnemy&&G.currentEnemy.hp>0){
        G._metamagicTwinUsed=true;
        let fbd2=roll(10)+md(G.stats.int)+(G.magBonus||0);
        if(G._brilliantFocus)fbd2+=Math.max(0,md(G.stats.int));
        if(G._overload&&G.currentEnemy)fbd2+=Math.floor((G.currentEnemy.def||0)*0.3);
        dealToEnemy(fbd2,false,'Metamagic Twin 🌀 second bolt');
        log('🌀 Metamagic Twin: second Fire Bolt fires!','s');
      }
      break;}
    case 'magic_missile':{
      AUDIO.sfx.magicMissile();const darts=G.level>=9?5:G.level>=5?4:3;
      let t=0;for(let i=0;i<darts;i++)t+=roll(4)+1;
      // Brilliant Focus: +INT mod to spell damage
      if(G.classId==='wizard'&&G._brilliantFocus)t+=Math.max(0,md(G.stats.int));
      // Overload: penetrate 30% of enemy DEF
      if(G.classId==='wizard'&&G._overload&&G.currentEnemy)t+=Math.floor((G.currentEnemy.def||0)*0.3);
      dealToEnemy(t,false,'Magic Missile ✨ ('+darts+' darts)');
      // Chain Lightning: 30% chance to arc for half damage again
      if(G.classId==='wizard'&&G._chainLightning&&G.currentEnemy&&G.currentEnemy.hp>0&&Math.random()<0.3){
        const arcDmg=Math.ceil(t/2);
        dealToEnemy(arcDmg,false,'Chain Lightning ⚡ arc');
        log('⚡ Chain Lightning arcs! '+arcDmg+' bonus damage!','s');
      }
      break;}
    case 'fireball':{
      AUDIO.sfx.fireball();
      // Tidal Surge: upgrade Fireball dice from d6 to d8
      const fbDie=G.classId==='wizard'&&G._tidalSurge?8:6;
      let d=0;for(let i=0;i<6;i++)d+=roll(fbDie);
      d+=md(G.stats.int)+(G.magBonus||0);
      // Brilliant Focus: +INT mod to spell damage
      if(G.classId==='wizard'&&G._brilliantFocus)d+=Math.max(0,md(G.stats.int));
      // Overload: penetrate 30% of enemy DEF
      if(G.classId==='wizard'&&G._overload&&G.currentEnemy)d+=Math.floor((G.currentEnemy.def||0)*0.3);
      if(G.classId==='wizard'&&G.talents.includes('Spell Power'))d=Math.ceil(d*1.15);
      dealToEnemy(d,false,'Fireball 💥');
      if(G.currentEnemy&&G.currentEnemy.hp>0){
        addConditionEnemy('Burning',3);
        log('🔥 Enemy is Burning! (3 turns)','c');
      }
      break;}
    case 'counterspell':AUDIO.sfx.counterspell();G.sx.counterspell=true;log('Counterspell ready!','s');break;
    case 'mirror_image':
      AUDIO.sfx.mirrorImage();
      G.mirrorImages=3;
      log('🪞 Mirror Image: 3 illusory copies surround you! Each attack has a 33% chance to hit a copy instead.','s');
      break;
    case 'blink':
      AUDIO.sfx.blink();
      G.sx.blink=true;
      log('💫 Blink: You partially phase out — 60% chance to negate next hit!','s');
      break;
    case 'sneak_attack':{
      AUDIO.sfx.sneak();const r=calcPlayerDmg();
      const sneakDice=3+Math.floor(G.level/4)+(G.talents.includes('Death Mark')?1:0);
      for(let i=0;i<sneakDice;i++)r.dmg+=roll(6);
      // Exploit Weakness: +50% damage vs Poisoned or Bleeding enemies
      if(G.classId==='rogue'&&G._exploitWeakness&&G.currentEnemy){
        const hasPoisoned=G.currentEnemy.conditions&&G.currentEnemy.conditions.find(c=>c.name==='Poisoned'&&c.turns>0);
        const hasBleeding=G.currentEnemy.conditions&&G.currentEnemy.conditions.find(c=>c.name==='Bleeding'&&c.turns>0);
        if(hasPoisoned||hasBleeding){r.dmg=Math.ceil(r.dmg*1.5);log('🎯 Exploit Weakness: +50% damage!','s');}
      }
      dealToEnemy(r.dmg,r.crit,'Sneak Attack 🎯 ('+sneakDice+'d6)');
      // Hemorrhage: apply Bleeding (5 dmg/turn, 3 turns)
      if(G.classId==='rogue'&&G._hemorrhage&&G.currentEnemy&&G.currentEnemy.hp>0){
        addConditionEnemy('Bleeding',3);
        log('🩸 Hemorrhage: Bleeding applied!','c');
      }
      // Throat Cut: 15% chance to Silence enemy (blocks special 1 turn)
      if(G.classId==='rogue'&&G._throatCut&&G.currentEnemy&&G.currentEnemy.hp>0&&Math.random()<0.15){
        G.currentEnemy._silenced=1;
        log('💀 Throat Cut: enemy Silenced for 1 turn!','c');
      }
      // Anatomy: 10% chance to Stun enemy
      if(G.classId==='rogue'&&G._anatomy&&G.currentEnemy&&G.currentEnemy.hp>0&&Math.random()<0.1){
        addConditionEnemy('Stunned',1);
        log('🩻 Anatomy: precise strike — enemy Stunned!','c');
      }
      // Veil of Shadows set bonus: no cooldown — handled in setCooldown skip below
      if(G._classSetBonus!=='rogue_set')setCooldown('sneak_attack',2);
      break;}
    case 'cunning_action':AUDIO.sfx.block();G.sx.evasion=true;log('Cunning Action: evading next hit!','s');
      // Blur: also grant 20% dodge chance for 2 turns
      if(G.classId==='rogue'&&G._blur){G.sx.blur={turns:2};log('🌀 Blur: +20% dodge for 2 turns!','s');}
      break;
    case 'uncanny_dodge':AUDIO.sfx.block();G.sx.parry=true;log('Uncanny Dodge: ready!','s');
      // Phantasm: uncanny dodge reduces damage by 75% instead of 50% (set flag for parry handler)
      if(G.classId==='rogue'&&G._phantasm)G.sx.phantasm=true;
      break;
    case 'divine_smite':{
      AUDIO.sfx.divineSmite();
      const d=roll(8)+roll(8)+roll(8)+md(G.stats.cha);
      const smiteCrit=Math.random()<0.1;
      dealToEnemy(d,smiteCrit,'Divine Smite ✨');
      if(G.talents.includes('Avenging Angel')){const ah=Math.floor(d/2);G.hp=Math.min(G.maxHp,G.hp+ah);log('⚡ Avenging Angel: healed '+ah+' HP!','s');}
      if(G._classSetBonus==='paladin_set'){const sh=Math.ceil(d*0.25);G.hp=Math.min(G.maxHp,G.hp+sh);spawnFloater(sh,'heal',false);log('✦ Oath of the Undying: healed '+sh+' HP from Smite!','l');}
      // Holy Momentum: on crit, restore 2 Holy Power
      if(G._holyMomentum&&smiteCrit){G.res=Math.min(G.resMax,G.res+2);log('💫 Holy Momentum: +2 Holy Power!','s');}
      // Smite Chain: smite twice in one turn for +1 Holy Power
      if(G._smiteChain&&!G._smiteChainUsed&&G.currentEnemy&&G.currentEnemy.hp>0&&G.res>=1){
        G._smiteChainUsed=true;G.res-=1;
        const d2=roll(8)+roll(8)+roll(8)+md(G.stats.cha);
        dealToEnemy(d2,false,'Smite Chain 🗡 second smite');
        if(G.talents.includes('Avenging Angel')){const ah2=Math.floor(d2/2);G.hp=Math.min(G.maxHp,G.hp+ah2);}
        log('🗡 Smite Chain: second smite fires!','s');
      }
      break;}
    case 'lay_on_hands':{
      AUDIO.sfx.heal();
      if(G.layOnHandsPool<=0){log('Lay on Hands pool exhausted!','s');return;}
      const healAmt=Math.min(G.layOnHandsPool, roll(8)+roll(8)+G.level+(G.talents.includes('Lay on Hands+')?G.level:0));
      G.layOnHandsPool=Math.max(0,G.layOnHandsPool-healAmt);
      heal(Math.floor(healAmt),'Lay on Hands 🙏 ('+G.layOnHandsPool+' pool left)');
      // Restorative Aura: remove one condition on use
      if(G._restorativeAura&&G.conditions.length>0){
        const removed=G.conditions[0];G.conditions=G.conditions.slice(1);
        if(G.conditionTurns)delete G.conditionTurns[removed];
        log('💛 Restorative Aura: '+removed+' cleansed!','s');
      }
      break;}
    case 'divine_shield':{
      AUDIO.sfx.block();
      if(G._dawnShield){G.sx.divineShieldCharges=2;log("🌅 Dawn's Shield: 2 blocks ready!",'s');}
      else{G.sx.divineShield=true;log('⚜️ Divine Shield: next attack blocked!','s');}
      if(G._bulwarkFaith&&G.currentEnemy){const ws=roll(20);if(ws<13){addConditionEnemy('Frightened',2);log('🛡 Bulwark of Faith: attacker Frightened!','c');}}
      break;}
    case 'hunters_mark':{
      AUDIO.sfx.huntMark();if(G.hunterMarked){log("Already marked! (Concentration active)",'s');return;}
      G.hunterMarked=true;
      G.concentrating='hunters_mark';
      // Lock until enemy dies (very long cooldown cleared on kill)
      G.skillCooldowns['hunters_mark']=Date.now()+(999*1000);
      log("Hunter's Mark applied! [Concentration] +1d6 per hit — breaks on damage.",'s');
      // Binding Mark: reduce enemy ATK by 4 while marked
      if(G._bindingMark&&G.currentEnemy){G.currentEnemy.atk=Math.max(1,(G.currentEnemy.atk||0)-4);log("🔗 Binding Mark: enemy ATK -4!",'c');}
      break;}
    case 'volley':{
      AUDIO.sfx.volley();let t=0;let arrowsHit=0;
      for(let i=0;i<3;i++){
        if(!G.currentEnemy||G.currentEnemy.hp<=0)break;
        const r=calcPlayerDmg();
        let d=Math.ceil(r.dmg*.8);
        // Long Shot: damage die increases to d8 (base +2 per arrow)
        if(G._longShot)d+=roll(8)-roll(6);
        // Volley Mastery: Hunter's Mark bonus applies to each arrow
        if(G._volleyMastery&&G.hunterMarked)d+=roll(G._hawkEye?8:6);
        G.currentEnemy.hp-=d;t+=d;arrowsHit++;
        spawnFloater(d,r.crit?'crit':'dmg',true);
        if(G.currentEnemy.hp<=0)break;
      }
      log('Volley: '+arrowsHit+' arrows for '+t+' total damage','p');
      // Pinning Shot: 30% chance to Restrain enemy
      if(G._pinningShot&&G.currentEnemy&&G.currentEnemy.hp>0&&Math.random()<0.3){
        addConditionEnemy('Restrained',1);
        log('🏹 Pinning Shot: enemy Restrained!','c');
      }
      updateEnemyBar();
      break;}
    case 'beasts_aid':AUDIO.sfx.block();G.sx.beastBlock=true;G.sx.beastRetaliate=true;log("Beast's Aid: companion will block next hit and retaliate!",'s');break;
    case 'rage':{
      AUDIO.sfx.rage();if(G.raging){log('Already raging!','s');return;}
      G.raging=true;
      // Fury Incarnate set bonus: rage lasts entire fight (999 turns)
      G.rageTurns=G._classSetBonus==='barbarian_set'?999:6+(G.talents.includes('Endless Rage')?2:0);
      const rageMsg=G._classSetBonus==='barbarian_set'?'FURY INCARNATE! Rage lasts the entire fight!':'RAGE! +2 dmg, physical resistance for '+G.rageTurns+' more rounds!';
      log(rageMsg,'s');
      if(G._classSetBonus==='barbarian_set')log('✦ Fury Incarnate: Endless Rage!','l');
      G.skillCooldowns['rage']='active';
      break;}
    case 'basic_attack_frenzy':{
      // Berserker Frenzy: second attack (called automatically after basic attack)
      AUDIO.sfx.attack();const fr=calcPlayerDmg();dealToEnemy(fr.dmg,fr.crit,'Frenzy Strike ⚡');break;}
    case 'reckless_attack':{
      AUDIO.sfx.attack();const r=calcPlayerDmg();
      // Tidal Force: damage die increases to d12 (adds extra d12 bonus)
      if(G._tidalForce)r.dmg+=roll(12);
      r.dmg=Math.ceil(r.dmg*1.75);
      dealToEnemy(r.dmg,r.crit,'Reckless Attack 💥');
      // Consumes 20 rage resource — but never drops you out of rage entirely
      if(G.raging){
        const rageCost=20;
        G.res=Math.max(1,G.res-rageCost);
        log('🔥 Reckless: -'+rageCost+' Rage ('+Math.floor(G.res)+' left)','s');
        renderHUD();
      }
      // Recoil — Juggernaut negates it; Volcanic Rage redirects to enemy
      if(!G._juggernaut){
        const recoil=Math.min(12,5+Math.floor(G.level/2));
        if(G._volcanicRage&&G.raging&&G.currentEnemy&&G.currentEnemy.hp>0){
          const burnBonus=roll(6);
          dealToEnemy(burnBonus,false,'Volcanic Rage 🌋 burn');
          addConditionEnemy('Burning',2);
          log('🌋 Volcanic Rage: recoil redirected as burn!','s');
        } else {
          G.hp-=recoil;
          spawnFloater(recoil,'dmg',false);
          animEl('playerSprite','hit-anim',300);
          log('💢 Reckless Recoil: '+recoil+' self-damage','e');
          renderHUD();
          if(G.hp<=0){onPlayerDied();return;}
        }
      } else {
        log('⚔️ Juggernaut: recoil negated!','s');
      }
      break;}
    case 'retaliation':{
      if(G._mountainWeight){const md_=Math.floor((G.stats.str-10)/2);const d=roll(8)+Math.max(0,md_);dealToEnemy(d,false,"Mountain's Weight 🏔 retaliation");}
      else{const r=calcPlayerDmg();dealToEnemy(r.dmg,r.crit,'Retaliation ⚡');}
      break;}
    case 'sacred_flame':{
      AUDIO.sfx.sacredFlame();const scalingBonus=Math.floor(G.level/4);
      const d=roll(8)+scalingBonus+(G.magBonus||0)+(G.subclassUnlocked&&G.classId==='cleric'?roll(4):0)+(G.talents.includes('Radiant Soul')?roll(4):0)+md(G.stats.wis);
      dealToEnemy(d,false,'Sacred Flame ☀️');
      // Wrath of the Righteous: applies Vulnerable (+15% dmg taken) for 1 turn
      if(G.classId==='cleric'&&G._wrathRighteous&&G.currentEnemy&&G.currentEnemy.hp>0){G.currentEnemy._vulnerable=true;log('⚡ Wrath of the Righteous: Vulnerable!','c');}
      // Wrath of God: sacred flame hits twice (once per turn)
      if(G.classId==='cleric'&&G._wrathOfGod&&!G._wrathOfGodUsed&&G.currentEnemy&&G.currentEnemy.hp>0){
        G._wrathOfGodUsed=true;
        const d2=roll(8)+scalingBonus+(G.subclassUnlocked?roll(4):0)+(G.talents.includes('Radiant Soul')?roll(4):0)+md(G.stats.wis);
        dealToEnemy(d2,false,'Wrath of God ⚡ second flame');
        log('⚡ Wrath of God: second Sacred Flame!','s');
      }
      // Eternal Flame: no cooldown
      if(G.classId==='cleric'&&G._eternalFlame){if(G.skillCooldowns['sacred_flame'])delete G.skillCooldowns['sacred_flame'];}
      break;}
    case 'healing_word':{
      AUDIO.sfx.heal();
      let hwHeal=roll(4)+md(G.stats.wis)+(G.subclassUnlocked&&G.classId==='cleric'?4:0)+(G.talents.includes('Blessed Healing')?5:0);
      // Tidal Grace: +1d6 to Healing Word
      if(G.classId==='cleric'&&G._tidalGrace)hwHeal+=roll(6);
      heal(hwHeal,'Healing Word 💚');
      // Overflowing Font: once per fight, Healing Word fires twice
      if(G.classId==='cleric'&&G._overflowingFont&&!G._overflowingFontUsed){
        G._overflowingFontUsed=true;
        let hw2=roll(4)+md(G.stats.wis)+(G.subclassUnlocked?4:0)+(G.talents.includes('Blessed Healing')?5:0);
        if(G._tidalGrace)hw2+=roll(6);
        heal(hw2,'Overflowing Font 💫 second word');
        log('💫 Overflowing Font: second Healing Word!','s');
      }
      break;}
    case 'divine_intervention':{
      if(G._divineInterventionUsed){log('Divine Intervention already used this rest!','s');break;}
      G.hp=G.maxHp;G._divineInterventionUsed=true;
      log('☀️ Divine Intervention! Fully healed!','s');
      spawnFloater('DIVINE!','s',false);
      break;}
    case 'channel_divinity':{
      // vs Undead: auto Turn Undead (smite)
      if(G.currentEnemy&&G.currentEnemy.isUndead){
        AUDIO.sfx.sacredFlame();
        const d=roll(8)*3+(G.talents.includes('Divine Armor')?10:0);
        dealToEnemy(d,false,'Turn Undead ✝️');
        log('✝️ Turn Undead — radiant energy burns the undead!','s');
      } else if(G.currentEnemy){
        // vs living: show a choice — smite or heal
        showChannelDivinityChoice();
        if(G.classId==='cleric'&&G._devotionEngine){G.skillCooldowns['channel_divinity']=Date.now()+3000;}
        return; // don't end action yet — handled by choice buttons
      } else {
        // No enemy (between fights): just heal
        const h=roll(8)+roll(8)+roll(8)+md(G.stats.wis)+(G.talents.includes('Blessed Healing')?8:0);
        heal(h,'Preserve Life ✝️');
      }
      if(G.classId==='cleric'&&G._devotionEngine){G.skillCooldowns['channel_divinity']=Date.now()+3000;}
      break;}
    case 'spiritual_weapon':{
      AUDIO.sfx.spiritualWeapon();if(G.spiritualWeaponActive){log('Spiritual Weapon already active!','s');return;}
      G.spiritualWeaponActive=true;
      G.spiritualWeaponTurns=3;
      G.skillCooldowns['spiritual_weapon']='active';
      log('Spiritual Weapon summoned! Attacks with you for 3 turns.','s');
      break;}
    case 'claw_strike':{
      if((G.wildShapeHp<=0)&&G.classId==='druid'){log('Claw Strike only available in Wild Shape!','s');return;}
      AUDIO.sfx.attack();
      const clawDmg=roll(6)+roll(6)+md(G.stats.str);
      const clawCrit=roll(20)>=G.critRange;
      let finalClaw=clawCrit?Math.ceil(clawDmg*(G.critMult||2)):clawDmg;
      if(G._elementalForm){const fireDmg=roll(6);finalClaw+=fireDmg;log('🔥 Elemental: +'+fireDmg+' fire damage!','s');}
      dealToEnemy(finalClaw,clawCrit,G._elementalForm?'Flame Strike 🔥':'Claw Strike 🐾');
      // Apex Predator: 20% chance to Restrain enemy
      if(G._apexPredator&&G.currentEnemy&&G.currentEnemy.hp>0&&Math.random()<0.2){
        addConditionEnemy('Restrained',1);log('🐾 Apex Predator: enemy Restrained!','c');
      }
      break;}
    case 'thorn_whip':{
      AUDIO.sfx.thornWhip();const twRoll=roll(20);
      const d=roll(8)+md(G.stats.wis);
      const isTwCrit=twRoll>=G.critRange;
      dealToEnemy(isTwCrit?Math.ceil(d*2):d,isTwCrit,'Thorn Whip 🌱');
      if(isTwCrit&&G.currentEnemy&&G.currentEnemy.hp>0){
        addConditionEnemy('Poisoned',2);
        log('🌱 Critical! Thorns inject poison — Poisoned (2 turns).','c');
      }
      // Dark Moon: 25% chance to Poison on thorn whip
      if(G._darkMoon&&G.currentEnemy&&G.currentEnemy.hp>0&&Math.random()<0.25){
        addConditionEnemy('Poisoned',3);log('🌑 Dark Moon: Poisoned!','c');
      }
      break;}
    case 'wild_shape':{
      AUDIO.sfx.wildShape();if(G.wildShapeHp>0){log('Already in Wild Shape! ('+G.wildShapeHp+' HP buffer remaining)','s');return;}
      const wsBase=20+G.level*3+(G.talents.includes('Beast Mastery')?20:0);
      let hp=G._classSetBonus==='druid_set'?Math.ceil(wsBase*1.5):wsBase;
      // Bear's Endurance: wild shape HP +25% of max HP
      if(G._bearsEndurance)hp+=Math.floor(G.maxHp*0.25);
      G.wildShapeHp=hp;
      G._wildShapeMaxHp=hp;
      G.wildShapeActive=true;
      G._elementalForm=false;
      G.skillCooldowns['wild_shape']=Date.now()+(999*1000);
      // Save original stats and apply bear stat block
      G._humanStats={str:G.stats.str,dex:G.stats.dex,con:G.stats.con,atk:G.atk,def:G.def};
      const bearStr=Math.max(G.stats.str,20);
      const bearCon=Math.max(G.stats.con,16);
      const strGain=bearStr-G.stats.str;
      const conGain=bearCon-G.stats.con;
      G.stats.str=bearStr;
      G.stats.con=bearCon;
      G.atk+=Math.floor(strGain/2);
      G.def+=Math.floor(conGain/2);
      const strMod=Math.floor((G.stats.str-10)/2);
      log('🐻 Wild Shape! Bear form: STR '+bearStr+' (+'+strMod+' ATK), +'+hp+' HP buffer. Spells locked!'+(G._classSetBonus==='druid_set'?' (✦ +50% Heart of the Wild!)':''),'s');
      // Regrowth: heal 10 HP when entering Wild Shape
      if(G._regrowth){G.hp=Math.min(G.maxHp,G.hp+10);log('🌾 Regrowth: +10 HP on transformation!','s');}
      // Wild Surge: deal 1d6 nature damage on enter
      if(G._wildSurge&&G.currentEnemy&&G.currentEnemy.hp>0){const wsd=roll(6);dealToEnemy(wsd,false,'Wild Surge 🌿 nature burst');log('🌿 Wild Surge: +'+wsd+' nature damage!','c');}
      const pSpr=document.getElementById('playerSprite');
      if(pSpr&&COMPANION_SPRITES.bear)renderSprite(COMPANION_SPRITES.bear,14,pSpr);
      if(pSpr)pSpr.style.filter='drop-shadow(0 0 6px #8b6914)';
      const exitBtn=document.getElementById('exitWildShapeBtn');
      if(exitBtn)exitBtn.style.display='block';
      swapBearBars(true, hp, hp);
      break;}
    case 'elemental_wild_shape':{
      AUDIO.sfx.wildShape();if(G.wildShapeHp>0){log('Already in a Wild Shape form! Exit first.','s');return;}
      const ewsBase=30+G.level*4+(G.talents.includes('Beast Mastery')?20:0);
      const ewsHp=G._classSetBonus==='druid_set'?Math.ceil(ewsBase*1.5):ewsBase;
      G.wildShapeHp=ewsHp;
      G._wildShapeMaxHp=ewsHp;
      G.wildShapeActive=true;
      G._elementalForm=true;
      G.skillCooldowns['wild_shape']=Date.now()+(999*1000); // also lock regular wild_shape
      // Save human stats and apply elemental stat block
      G._humanStats={str:G.stats.str,dex:G.stats.dex,con:G.stats.con,atk:G.atk,def:G.def};
      const elemStr=Math.max(G.stats.str,18);
      const elemWis=Math.max(G.stats.wis,20);
      const elemStrGain=elemStr-G.stats.str;
      G.stats.str=elemStr;
      G.stats.wis=elemWis;
      G.atk+=Math.floor(elemStrGain/2)+2; // fire empowered
      G.def+=2; // elemental hide
      // Immune to poison and frightened while elemental
      G._elementalImmune=true;
      if(G.conditions.includes('Poisoned'))G.conditions=G.conditions.filter(c=>c!=='Poisoned');
      if(G.conditions.includes('Frightened'))G.conditions=G.conditions.filter(c=>c!=='Frightened');
      log('🔥 Elemental Wild Shape! Fire Elemental form: +'+ewsHp+' HP, immune Poison/Frightened, +2 DEF, bonus fire dmg!','s');
      const pSpr=document.getElementById('playerSprite');
      // Draw a fire elemental sprite using the player sprite canvas
      if(pSpr){
        pSpr.style.filter='drop-shadow(0 0 10px #e74c3c) drop-shadow(0 0 6px #f39c12)';
        pSpr.style.animation='none';
        // Use bear sprite as base but with fire tint
        if(COMPANION_SPRITES.bear)renderSprite(COMPANION_SPRITES.bear,14,pSpr);
      }
      const exitBtn=document.getElementById('exitWildShapeBtn');
      if(exitBtn)exitBtn.style.display='block';
      swapBearBars(true, ewsHp, ewsHp);
      break;}
    case 'moonbeam':{
      AUDIO.sfx.moonbeam();
      // Waxing Moon: damage increases by 1d6 per consecutive cast
      G._waxingMoonStacks=G._waxingMoon?(G._waxingMoonStacks||0)+1:0;
      const mbBonus=G._waxingMoon?(G._waxingMoonStacks*roll(6)):0;
      const d=roll(10)+roll(10)+(G.magBonus||0)+(G.talents.includes('Lunar Magic')?roll(6):0)+mbBonus;
      dealToEnemy(d,false,'Moonbeam 🌙');
      if(G._waxingMoon&&G._waxingMoonStacks>0)log('🌙 Waxing Moon: +'+G._waxingMoonStacks+'d6 stacked!','s');
      // Living Lightning: 30% chance to Stun enemy
      if(G._livingLightning&&G.currentEnemy&&G.currentEnemy.hp>0&&Math.random()<0.3){
        addConditionEnemy('Stunned',1);log('⚡ Living Lightning: enemy Stunned!','c');
      }
      break;}
    case 'entangle':{
      AUDIO.sfx.entangle();if(!G.currentEnemy)break;
      const eEnt=G.currentEnemy;
      const saveBonus=md(G.stats.wis)+G.profBonus;
      let spellDC=8+saveBonus;
      if(G._tidalRoots)spellDC+=3; // Tidal Roots: +3 DC
      const enemySaveBonus=Math.floor((eEnt.saveDC||12)-10);
      const enemySave=roll(20)+enemySaveBonus;
      const entTurns=G._tidalRoots?3:2; // Tidal Roots: +1 turn
      if(enemySave<spellDC){
        const entDmg=roll(4);addConditionEnemy('Restrained',entTurns);dealToEnemy(entDmg,false,'Entangle 🌿');
        if(G.currentEnemy&&G.currentEnemy.hp>0)log('Enemy is Restrained for '+entTurns+' rounds!','c');
        // Overgrowth: mark for persistent re-restraint
        if(G._overgrowth){eEnt._overgrowthDC=spellDC;log('🌿 Overgrowth: roots hold!','s');}
        // Cyclone: deals 1d6 per turn while restrained (tracked via enemy flag)
        if(G._cyclone){eEnt._cycloneDmg=true;log('🌀 Cyclone: roots deal 1d6 per turn!','s');}
      } else {
        log('Entangle: Enemy resisted ('+enemySave+' vs DC'+spellDC+')','s');
      }
      break;}

    // ── SUBCLASS ACTIVE SKILLS ────────────────────────────
    case 'surge_strike':{
      AUDIO.sfx.powerStrike();
      const {dmg:sd,crit:sc}=calcPlayerDmg();
      const surgeBase=roll(10)+roll(10)+Math.max(0,md(G.stats.str));
      const surgeDmg=Math.ceil(surgeBase*(sc?2:1));
      dealToEnemy(surgeDmg,sc,'Surge Strike ⚡');
      if(sc){
        G.bonusUsed=false;
        log('⚡ CRITICAL! Bonus action restored!','s');
      }
      setCooldown('surge_strike',3);
      break;}

    case 'empowered_blast':{
      AUDIO.sfx.burn();
      // Overcharged: once per rest, Empowered Blast costs 0 slots
      if(G.classId==='wizard'&&G._overcharged&&!G._overchargedUsed){
        G._overchargedUsed=true;
        // Refund the slot that was already deducted
        if(G.spellSlots&&G.spellSlotsMax){
          for(const[lvl]of Object.entries(G.spellSlotsMax)){
            if((G.spellSlots[lvl]||0)<G.spellSlotsMax[lvl]){G.spellSlots[lvl]++;break;}
          }
        }
        log('⚡ Overcharged: Empowered Blast is free this rest!','s');
      }
      // Maximized: 4×8 + INT bonus
      const ebDmg=32+Math.max(0,md(G.stats.int))+(G.magBonus||0);
      dealToEnemy(ebDmg,false,'Empowered Blast 💎');
      log('💎 Empowered Blast — maximized dice!','s');
      break;}

    case 'pickpocket':{
      AUDIO.sfx.secondWind();
      const r=Math.random();
      if(r<0.5){
        const potIdx=G.inventory.findIndex(s=>s===null);
        if(potIdx>-1){G.inventory[potIdx]={...ITEMS.find(i=>i.id==='hpPotion')};log('🎭 Pickpocket: Swiped a Healing Potion!','s');}
        else log('🎭 Pickpocket: Got a potion, but no inventory space!','s');
      } else if(r<0.8){
        const goldAmt=Math.floor(30*(G.goldMult||1));G.gold+=goldAmt;G.totalGold+=goldAmt;
        log('🎭 Pickpocket: Lifted '+goldAmt+' gold!','s');
      } else {
        // Pick a random material appropriate for the current zone
        const zoneMaterialIds = ['herb','fang','bone','voidShard','ghostEssence','ironCore','demonAsh','frostCrystal','celestialDust','shadowEssence'];
        const maxMatIdx = Math.min(zoneMaterialIds.length - 1, G.zoneIdx * 2 + 1);
        const matId = zoneMaterialIds[Math.floor(Math.random() * (maxMatIdx + 1))];
        const mat = ITEMS.find(i => i.id === matId);
        if(mat){addItem({...mat, qty:1});log('🎭 Pickpocket: Swiped '+mat.icon+' '+mat.name+'!','s');}
        else log('🎭 Pickpocket: Nothing to steal here.','s');
      }
      setCooldown('pickpocket',5);
      renderAll();
      break;}

    case 'sacred_weapon':{
      AUDIO.sfx.levelUp();
      G.sx.sacredWeapon={turns:3};
      log('🌟 Sacred Weapon — consecrated for 3 turns! (+1d6 radiant, +3 HP on hit)','s');
      if(G._consecratedGround&&G.currentEnemy){G.currentEnemy.def=Math.max(0,(G.currentEnemy.def||0)-4);log('✝️ Consecrated Ground: enemy DEF -4!','c');}
      break;}

    case 'pack_hunt':{
      AUDIO.sfx.powerStrike();
      const {dmg:phd,crit:phc}=calcPlayerDmg();
      dealToEnemy(phd,phc,'Pack Hunt 🐺 (Your Strike)');
      // Beast strike: 1d8+WIS
      const beastDmg=Math.max(1,roll(8)+Math.max(0,md(G.stats.wis))+(G.hunterMarked?roll(G.talents.includes('Hawk Eye')?8:6):0));
      dealToEnemy(beastDmg,false,'Pack Hunt 🐺 (Beast Strike)');
      log('🐺 You and your companion strike together!','s');
      break;}

    case 'frenzy_attack':{
      if(!G.raging){log('Frenzy Attack requires Rage!','e');break;}
      AUDIO.sfx.powerStrike();
      const {dmg:fad,crit:fac}=calcPlayerDmg();
      const frenzBonus=roll(6);
      dealToEnemy(fad+frenzBonus,fac,'Frenzy Attack 🩸');
      // Burns 5 from the rage bar
      G.rageTurns=Math.max(0,(G.rageTurns||0)-1);
      log('🩸 Frenzy! Extra attack while raging!','s');
      break;}

    case 'preserve_life':{
      AUDIO.sfx.secondWind();
      let plHeal=roll(8)+roll(8)+roll(8)+Math.max(0,md(G.stats.wis));
      // Life Surge: +2d8 HP
      if(G.classId==='cleric'&&G._lifeSurge)plHeal+=roll(8)+roll(8);
      heal(plHeal,'Preserve Life 💛');
      log('💛 Preserve Life — divine healing that cannot be denied!','s');
      setCooldown('preserve_life',4);
      break;}

    case 'elemental_strike':{
      if(!G.wildShapeActive&&(!G.wildShapeHp||G.wildShapeHp<=0)){log('Elemental Strike requires Bear Form!','e');break;}
      AUDIO.sfx.powerStrike();
      const {dmg:esd,crit:esc}=calcPlayerDmg();
      const elements=['fire','cold','lightning'];
      const elem=elements[Math.floor(Math.random()*3)];
      const elemDmg=roll(6)+(G.talents.includes('Wildfire')?roll(6):0);
      const totalElem=esd+elemDmg;
      dealToEnemy(totalElem,esc,'Elemental Strike 🌊 ('+elem+')');
      if(elem==='fire'&&Math.random()<0.25)addConditionEnemy('Burning',3);
      else if(elem==='cold'&&Math.random()<0.25){if(G.currentEnemy){G.currentEnemy._vulnerable=true;log('Chilled! Enemy DEF reduced.','c');}}
      else if(elem==='lightning'&&Math.random()<0.25)addConditionEnemy('Stunned',1);
      log('🌊 Elemental Strike — '+elem+' surge!','s');
      break;}

    // ── ULTIMATE I SKILLS ─────────────────────────────────
    case 'action_surge':{
      if(G._ultimateUsed){log('Action Surge — already used this rest!','e');break;}
      G._ultimateUsed=true;
      G.actionUsed=false; G.bonusUsed=false;
      G._surgeTurns=1;
      G._surgeCritBonus=3; // crit on 17+
      log('🌪️ ACTION SURGE! Extra turn — reduced costs, crit on 17-20!','s');
      renderAll();
      break;}

    case 'time_stop':{
      if(G._ultimateUsed){log('Time Stop — already used this rest!','e');break;}
      G._ultimateUsed=true;
      G._timeStopTurns=(G.capstoneUnlocked?4:3);
      G._timeStopActive=true;
      G.actionUsed=false; G.bonusUsed=false;
      log('⏳ TIME STOP! '+G._timeStopTurns+' free actions — enemy frozen, slots cost 0!','s');
      renderAll();
      break;}

    case 'vanishing_act':{
      if(G._ultimateUsed){log('Vanishing Act — already used this rest!','e');break;}
      G._ultimateUsed=true;
      G.sx.vanishing=2; // 2 rounds untargetable
      G.sx.vanishCrit=true; // next attack auto-crits
      log('🌑 VANISHING ACT! Untargetable for 2 rounds. Next strike will be a crit!','s');
      renderAll();
      break;}

    case 'divine_intervention_ult':{
      if(G._ultimateUsed&&!(G.capstoneUnlocked)){log('Divine Intervention — already used this rest!','e');break;}
      G._ultimateUsed=true;
      const diHeal=G.maxHp-G.hp;
      heal(diHeal,'Divine Intervention 😇');
      const isHolyTarget=G.currentEnemy&&(G.currentEnemy.isUndead||G.currentEnemy.isFiend);
      let diDmg=0;for(let i=0;i<6;i++)diDmg+=roll(10);
      if(isHolyTarget)diDmg*=2;
      dealToEnemy(diDmg,false,'Divine Intervention 😇'+(isHolyTarget?' [SMITE×2]':''));
      G.conditions=[];G.conditionTurns={};
      G.res=Math.min(G.resMax,G.res+5);
      log('😇 DIVINE INTERVENTION! Fully healed, conditions cleared, Holy Power restored!','s');
      break;}

    case 'hail_of_arrows':{
      if(G._ultimateUsed){log('Hail of Arrows — already used this rest!','e');break;}
      G._ultimateUsed=true;
      let hailDmg=0;for(let i=0;i<10;i++)hailDmg+=roll(6);
      hailDmg+=Math.max(0,md(G.stats.dex));
      dealToEnemy(hailDmg,false,'Hail of Arrows 🌧️');
      G.hunterMarked=true;
      addConditionEnemy('Restrained',2);
      log("🌧️ HAIL OF ARROWS! Hunter's Mark applied, enemy Restrained 2 turns!","s");
      break;}

    case 'world_breaker':{
      if(G._ultimateUsed){log('World Breaker — already used this rest!','e');break;}
      G._ultimateUsed=true;
      let wbDmg=0;for(let i=0;i<5;i++)wbDmg+=roll(12);
      wbDmg+=Math.max(0,md(G.stats.str));
      const hasConditions=G.currentEnemy&&G.currentEnemy.conditions&&G.currentEnemy.conditions.length>0;
      if(hasConditions)wbDmg*=2;
      G.hp=Math.max(1,G.hp-10); // recoil
      dealToEnemy(wbDmg,false,'World Breaker 🌍'+(hasConditions?' [DOUBLED]':''));
      log('🌍 WORLD BREAKER!'+(hasConditions?' Double damage vs conditioned enemy!':' Recoil: 10 damage to self.'),'s');
      break;}

    case 'miracle':{
      if(G._ultimateUsed&&!G.capstoneUnlocked){log('Miracle — already used this rest!','e');break;}
      G._ultimateUsed=true;
      heal(G.maxHp-G.hp,'Miracle ✨');
      let mirDmg=0;for(let i=0;i<4;i++)mirDmg+=roll(10);
      dealToEnemy(mirDmg,false,'Miracle ✨ radiant');
      G.conditions=[];G.conditionTurns={};
      G.res=G.resMax;
      const isUnholy=G.currentEnemy&&(G.currentEnemy.isUndead||G.currentEnemy.isFiend);
      if(isUnholy)addConditionEnemy('Frightened',3);
      log('✨ MIRACLE! Fully healed, conditions cleared, Devotion restored'+(isUnholy?', enemy Frightened!':'!'),'s');
      break;}

    case 'primal_avatar':{
      if(G._ultimateUsed){log('Primal Avatar — already used this rest!','e');break;}
      G._ultimateUsed=true;
      const paTurns=G.capstoneUnlocked?8:4;
      G.sx.primalAvatar=paTurns;
      // Give temp HP via wildShapeHp buffer
      const paHp=80;
      G.wildShapeHp=(G.wildShapeHp||0)+paHp;
      swapBearBars(true,G.wildShapeHp,G.wildShapeHp);
      G.sx.immuneConditions=true;
      let paDmg=0;for(let i=0;i<3;i++)paDmg+=roll(6);
      if(G.currentEnemy&&G.currentEnemy.hp>0)dealToEnemy(paDmg,false,'Primal Avatar 🌿 surge');
      log('🌿 PRIMAL AVATAR! +80 temp HP, immune to conditions for '+paTurns+' turns!','s');
      break;}
  }
}

function calcPlayerDmg(){
  // G.atk already includes weapon ATK/magATK from applyItemStats — don't add again
  let base=G.atk+G.profBonus;
  G.upgrades.filter(u=>u.bought&&u.eff==='atk').forEach(u=>base+=u.val);
  if(G.raging)base+=2+Math.floor(G.level/4)+(G.talents.includes('Brutal')&&G.classId==='barbarian'?4:0);
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
  // Deadeye: guaranteed crit when enemy is Marked (ATK already applied from apply())
  // Deadeye: first attack this turn is a crit while Hunter's Mark is active
  if(G.classId==='ranger'&&G._deadeye&&G.hunterMarked&&!G._deadeyeUsed){/* crit forced below, consume below */}
  if(G.classId==='paladin'&&G.subclassUnlocked)base+=md(G.stats.cha); // Sacred Weapon: +CHA to attacks
  if(G.classId==='barbarian'&&G.talents.includes('Blood Fury')&&G.hp<G.maxHp/2)base=Math.ceil(base*1.2);
  if(G.classId==='fighter'&&G.talents.includes('Weapon Master'))base=Math.ceil(base*1.1);
  if(G.classId==='fighter'&&G.talents.includes('War Gods Blessing'))base=Math.ceil(base*1.15);
  if(G.classId==='wizard'&&G.talents.includes('Spell Power'))base=Math.ceil(base*1.15);
  if(G.talents.includes('Execute')&&G.currentEnemy&&G.currentEnemy.hp<G.currentEnemy.maxHp*0.25)base=Math.ceil(base*2);
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
  const def=G.currentEnemy?(G.currentEnemy.ignoresArmor?0:G.currentEnemy.def):0;
  let dmg=Math.max(1,base-Math.floor(def/3)+roll(4)-2);
  let crit=false;
  // Ghost Step: first attack of each fight is a guaranteed crit
  const ghostStep=G.classId==='rogue'&&G.talents.includes('Ghost Step')&&!G.firstAttackUsed;
  // Shadow Step: once per fight, next attack is an automatic critical hit
  const shadowStep=G.classId==='rogue'&&G._shadowStep&&!G._shadowStepUsed;
  if(shadowStep){G._shadowStepUsed=true;log('🌑 Shadow Step: guaranteed crit!','s');}
  const vanishCrit=G.sx&&G.sx.vanishCrit;
  if(vanishCrit)delete G.sx.vanishCrit;
  const critBonus=(G.critBonus||0)+(G.classId==='ranger'&&G.talents.includes('Eagle Eye')?2:0)+(G._surgeCritBonus||0);
  const critThresh=G.critRange-critBonus;
  // Fighter capstone: advantage (roll twice take higher)
  let roll20=roll(20);
  if(G._capstone&&G.classId==='fighter'){const r2=roll(20);if(r2>roll20)roll20=r2;}
  if(ghostStep||vanishCrit||shadowStep||roll20>=critThresh||(G.subclassUnlocked&&G.classId==='fighter'&&G.level>=3&&roll20>=19)||(G.classId==='ranger'&&G._deadeye&&G.hunterMarked&&!G._deadeyeUsed)){
    if(G.classId==='ranger'&&G._deadeye&&G.hunterMarked&&!G._deadeyeUsed){G._deadeyeUsed=true;log('🎯 Deadeye: first strike crits while Marked!','s');}
    dmg=Math.ceil(dmg*(G.critMult||2));crit=true;
    // Explosive Arrow: once per fight, first crit deals double damage
    if(G.classId==='ranger'&&G._explosiveArrow&&!G._explosiveArrowUsed){
      G._explosiveArrowUsed=true;dmg=dmg*2;
      log('💥 Explosive Arrow: crit doubled!','s');
    }
  }
  if((ghostStep||vanishCrit)&&!G.firstAttackUsed){G.firstAttackUsed=true;}
  return{dmg:Math.ceil(dmg),crit};
}

function dealToEnemy(dmg,crit,source){
  if(!G.currentEnemy)return;
  // Predator: +15% damage vs enemies below 50% HP
  if(G._branchPredator&&G.currentEnemy.hp<=G.currentEnemy.maxHp*0.5) dmg=Math.ceil(dmg*1.15);
  G.currentEnemy.hp-=dmg;
  spawnFloater(dmg,crit?'crit':'dmg',true);
  log(`${source}${crit?' [CRIT!]':''}: ${dmg} dmg → ${G.currentEnemy.name}`,'p');
  animEl('enemySprite','hit-anim',300);
  if(crit){
    AUDIO.sfx.crit();G.totalCrits=(G.totalCrits||0)+1;checkAchievements();
    // Archmage's Ascension set bonus: spell crits restore 1 spell slot
    if(G._classSetBonus==='wizard_set'&&G.spellSlots&&G.spellSlotsMax){
      for(const[lvl]of Object.entries(G.spellSlotsMax)){
        if((G.spellSlots[lvl]||0)<G.spellSlotsMax[lvl]){
          G.spellSlots[lvl]++;
          log('✦ Archmage\'s Ascension: Crit restored 1 LVL'+lvl+' spell slot!','l');
          renderSpellSlots();break;
        }
      }
    }
  }
  checkObjectiveProgress('damage_dealt',dmg);
  updateEnemyBar();
}

function heal(amount,source){
  // Sacred Aura / heal multiplier — applied to ALL heals
  if(G._healMult&&G._healMult>1)amount=Math.ceil(amount*G._healMult);
  G.hp=Math.min(G.maxHp,G.hp+amount);
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
}

// ══════════════════════════════════════════════════════════
//  PLAYER END TURN
// ══════════════════════════════════════════════════════════
// Sets a skill cooldown by seconds (used from within doSkillEffect for dynamic CDs)
function setCooldown(skillId, seconds){
  G.skillCooldowns[skillId] = Date.now() + seconds * 1000;
}

function playerEndTurn(){
  if(!G.isPlayerTurn||paused)return;
  if(G.talents.includes('Storm Call')&&G.currentEnemy&&G.currentEnemy.hp>0){
    const sd=8+G.level;dealToEnemy(sd,false,'Storm Call ⚡');
  }
  setPlayerTurn(false);
}

// ══════════════════════════════════════════════════════════
//  ENEMY TURN
// ══════════════════════════════════════════════════════════
let reactionTimer=null;
let pendingAttackCallback=null;

function doEnemyTurn(){
  if(!G||!G.currentEnemy||paused||G.hp<=0||G._dyingFlag)return;
  const e=G.currentEnemy;
  // Blade Dancer: reset consecutive attack stacks on enemy turn
  if(G._bladeDancer&&G._bladeDancerStacks){G._bladeDancerStacks=0;}

  // Tick player conditions — with damage effects
  if(G.conditions.length){
    if(!G.conditionTurns)G.conditionTurns={};
    // Apply tick damage before ticking down
    if(G.conditions.includes('Poisoned')){
      const poisonDmg=3+G.zoneIdx;
      G.hp-=poisonDmg;
      spawnFloater(poisonDmg,'dmg',false);
      AUDIO.sfx.poison();
      log('☠ Poison: '+poisonDmg+' damage!','c');
    }
    if(G.conditions.includes('Burning')){
      const burnDmg=5+G.zoneIdx*2;
      G.hp-=burnDmg;
      spawnFloater(burnDmg,'dmg',false);
      AUDIO.sfx.burn();
      log('🔥 Burning: '+burnDmg+' fire damage!','c');
    }
    if(G.hp<=0){onPlayerDied();return;}
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
  }

  // Tick enemy conditions — check effects BEFORE ticking so 1-turn conditions work correctly
  if(e.conditions){
    // Apply damage-over-time to enemy
    const enemyBurning=e.conditions.find(c=>c.name==='Burning'&&c.turns>0);
    const enemyPoisoned=e.conditions.find(c=>c.name==='Poisoned'&&c.turns>0);
    const enemyBleeding=e.conditions.find(c=>c.name==='Bleeding'&&c.turns>0);
    if(enemyBurning){const bd=3+G.zoneIdx;e.hp-=bd;updateEnemyBar();log('🔥 '+e.name+' burns: '+bd+' fire damage!','c');if(e.hp<=0){onEnemyDied();return;}}
    if(enemyPoisoned){const pd=2+G.zoneIdx;e.hp-=pd;updateEnemyBar();log('☠ '+e.name+' is poisoned: '+pd+' damage!','c');if(e.hp<=0){onEnemyDied();return;}}
    if(enemyBleeding){e.hp-=5;updateEnemyBar();log('🩸 '+e.name+' bleeds: 5 damage!','c');if(e.hp<=0){onEnemyDied();return;}}
    // Cyclone: 1d6 per turn while Restrained
    const enemyRestrained=e.conditions.find(c=>c.name==='Restrained'&&c.turns>0);
    if(enemyRestrained&&e._cycloneDmg){const cd=roll(6);e.hp-=cd;updateEnemyBar();log('🌀 Cyclone: '+cd+' nature damage while Restrained!','c');if(e.hp<=0){onEnemyDied();return;}}
    const restrained=e.conditions.find(c=>c.name==='Restrained'&&c.turns>0);
    e.conditions=e.conditions.filter(c=>{c.turns--;if(c.turns<=0){log(c.name+' on '+e.name+' expires.','c');}return c.turns>0;});
    // Overgrowth: after Restrained expires, enemy must save or get re-rooted (DC escalates each re-application)
    if(!restrained&&e._overgrowthDC&&(!e.conditions||!e.conditions.find(c=>c.name==='Restrained'&&c.turns>0))){
      const escapeSave=roll(20)+Math.floor((e.saveDC||12)-10);
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
    delete G.skillCooldowns['wild_shape'];
    if(G.wildShapeActive){
      G.wildShapeActive=false;
      const pSpr=document.getElementById('playerSprite');
      if(pSpr&&CLASS_SPRITES[G.classId])renderSprite(CLASS_SPRITES[G.classId],10,pSpr);
      if(pSpr)pSpr.style.filter='';
      const exitBtn=document.getElementById('exitWildShapeBtn');
      if(exitBtn)exitBtn.style.display='none';
      log('🌿 Wild Shape fades — druid form restored.','s');
    }
  }
  // Unlock Spiritual Weapon when done (cleric only)
  if(G.classId==='cleric'&&!G.spiritualWeaponActive&&G.skillCooldowns['spiritual_weapon']){
    delete G.skillCooldowns['spiritual_weapon'];
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
  }

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
  document.getElementById('reactPrompt').style.display='none';
}

function afterEnemyActs(){
  if(!G)return;
  // Player dead — onPlayerDied handles everything, don't touch turn state
  if(G.hp<=0||G._dyingFlag)return;
  // Enemy died during attack (e.g. Paladin reflect) — onEnemyDied handled it
  if(!G.currentEnemy||G.currentEnemy.hp<=0)return;
  updateEnemyBar();
  setPlayerTurn(true);
}

function doEnemyAttack(e){
  if(!e||!G)return;
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
    afterEnemyActs();
    return;
  }
  // Blur: 20% dodge chance for turns after Cunning Action
  if(G.classId==='rogue'&&G.sx&&G.sx.blur&&G.sx.blur.turns>0&&Math.random()<0.2){
    G.sx.blur.turns--;
    if(G.sx.blur.turns<=0)delete G.sx.blur;
    AUDIO.sfx.miss();
    log('🌀 Blur: attack missed! ('+(G.sx.blur?G.sx.blur.turns:0)+' turns left)','s');
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
  // Blink — 60% chance to negate
  if(G.sx.blink){
    delete G.sx.blink;
    if(Math.random()<0.6){
      AUDIO.sfx.blink();
      log('💫 Blink! You phase out — attack misses entirely!','s');
      afterEnemyActs();
      return;
    } else {
      log('💫 Blink failed — caught mid-phase!','s');
    }
  }

  let dmg=e.atk+roll(4)-2;
  // G.def already includes armor/offhand from applyItemStats — don't add again
  G.upgrades.filter(u=>u.bought&&u.eff==='def').forEach(u=>dmg-=u.val);
  const effectiveDef=G.def+(G.raging&&G.classId==='barbarian'&&G._stoneSkin?10:0)+(G.classId==='cleric'&&G._spiritualArmor&&G.spiritualWeaponActive?4:0);
  dmg=Math.max(1,dmg-Math.floor(effectiveDef/3));
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
    if(G.wildShapeHp<=0){
      G.wildShapeHp=0;
      G.wildShapeActive=false;
      // Restore human stats
      if(G._humanStats){
        G.stats.str=G._humanStats.str;
        G.stats.con=G._humanStats.con;
        G.atk=G._humanStats.atk;
        G.def=G._humanStats.def;
        G._humanStats=null;
      }
      const wasElemental=G._elementalForm;
      G._elementalForm=false;
      G._elementalImmune=false;
      const pSpr=document.getElementById('playerSprite');
      if(pSpr&&CLASS_SPRITES.druid)renderSprite(CLASS_SPRITES.druid,10,pSpr);
      if(pSpr)pSpr.style.filter='';
      const exitBtn=document.getElementById('exitWildShapeBtn');
      if(exitBtn)exitBtn.style.display='none';
      swapBearBars(false);
      startPlayerAnim();
      log(wasElemental?'🔥 Elemental form dispersed! Druid restored.':'🌿 Bear form broken! Stats restored.','c');
    } else {
      log((G._elementalForm?'🔥 Elemental form absorbed ':'🐻 Bear form absorbed ')+absorbed+'! ('+Math.ceil(G.wildShapeHp)+' bear HP left)','s');
    }
    renderHUD();
  }

  if(dmg>0){
    G.hp-=dmg;
    spawnFloater(dmg,'dmg',false);
    AUDIO.sfx.playerHit();
    log(e.name+' attacks: '+dmg+' damage','e');
    animEl('enemySprite','enemy-attack-anim',400);
    animEl('playerSprite','hit-anim',300);
    if(G.hp<=0){onPlayerDied();return;}
    // Concentration check — ranger's Hunter's Mark breaks on hit
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
    // On-hit status effects from enemy flags
    if(e.canPoison&&!G.conditions.includes('Poisoned')&&Math.random()<0.25){
    checkObjectiveProgress('condition_gained','Poisoned');
      addCondition('Poisoned',3);
      AUDIO.sfx.poison();
      log('☠ Poisoned! Take damage each turn (3 turns).','c');
    }
    if(e.canBurn&&!G.conditions.includes('Burning')&&Math.random()<0.3){
    checkObjectiveProgress('condition_gained','Burning');
      addCondition('Burning',3);
      AUDIO.sfx.burn();
      log('🔥 Burning! Take fire damage each turn (3 turns).','c');
    }
    if(e.canStun&&!G.conditions.includes('Stunned')&&Math.random()<0.2){
      if(G.classId==='barbarian'&&G._unstoppable&&G.raging){log('💢 Unstoppable: Stun blocked by Rage!','s');}
      else{addCondition('Stunned',1);AUDIO.sfx.stun();log('💫 Stunned! You will lose your next turn.','c');}
    }
  }
  // Always hand turn back after attack resolves
  afterEnemyActs();
}

// Routes damage through Wild Shape bear HP buffer before hitting player HP
function dealDamageToPlayer(dmg, sourceName){
  // Iron Skin branch passive: reduce all incoming damage by 3
  if(G._branchIronSkin) dmg=Math.max(0,dmg-3);
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
    if(G.wildShapeHp<=0){
      G.wildShapeHp=0;
      G.wildShapeActive=false;
      if(G._humanStats){
        G.stats.str=G._humanStats.str;
        G.stats.con=G._humanStats.con;
        G.atk=G._humanStats.atk;
        G.def=G._humanStats.def;
        G._humanStats=null;
      }
      const wasElemental=G._elementalForm;
      G._elementalForm=false;
      G._elementalImmune=false;
      const pSpr=document.getElementById('playerSprite');
      if(pSpr&&CLASS_SPRITES.druid)renderSprite(CLASS_SPRITES.druid,10,pSpr);
      if(pSpr)pSpr.style.filter='';
      const exitBtn=document.getElementById('exitWildShapeBtn');
      if(exitBtn)exitBtn.style.display='none';
      swapBearBars(false);
      startPlayerAnim();
      log(wasElemental?'🔥 Elemental form dispersed by '+sourceName+'! Druid restored.':'🌿 Bear form broken by '+sourceName+'! Stats restored.','c');
    } else {
      log('🐻 Bear form absorbed '+absorbed+' from '+sourceName+'! ('+Math.ceil(G.wildShapeHp)+' bear HP left)','s');
    }
    renderHUD();
  }
  if(dmg>0){
    G.hp-=dmg;
    spawnFloater(dmg,'dmg',false);
    AUDIO.sfx.playerHit();
    log(sourceName+': '+dmg+' damage','e');
  }
}

function doBossSpecial(e, usePhase2=false){
  const sp=usePhase2&&e.phase2 ? e.phase2 : e.special;
  if(!sp)return;
  // Throat Cut: Silenced boss cannot use special for 1 turn
  if(e._silenced&&e._silenced>0){
    e._silenced--;
    log('💀 '+e.name+' is Silenced! Special ability blocked!','s');
    afterEnemyActs();return;
  }
  if(G.sx.counterspell){
    delete G.sx.counterspell;
    log('COUNTERSPELL negates '+sp.name+'!','s');
    // Recycled Magic: refund the LVL3 slot on success
    if(G.classId==='wizard'&&G._recycledMagic&&G.spellSlots&&G.spellSlotsMax&&(G.spellSlots[3]||0)<(G.spellSlotsMax[3]||0)){
      G.spellSlots[3]++;
      log('🔁 Recycled Magic: LVL3 slot refunded!','s');
    }
    afterEnemyActs();return;
  }
  AUDIO.sfx.bossSpecial();
  if(usePhase2) log('💀 '+e.name+' uses '+sp.name+'! [PHASE 2]','e');
  else log('⚠ '+e.name+' uses '+sp.name+'!','e');
  const saveBonus=G.talents.includes('Divine Armor')?5:0;
  const saveScore=G.stats[sp.saveType]||10;
  const saveRoll=roll(20)+md(saveScore)+G.profBonus+saveBonus;
  if(saveRoll>=sp.saveDC){
    log('✓ '+sp.saveType.toUpperCase()+' save PASSED! ('+saveRoll+' vs DC'+sp.saveDC+')','s');
    if(sp.damage){const halfDmg=Math.floor(sp.damage*.5);dealDamageToPlayer(halfDmg,sp.name);}
  } else {
    // Indomitable: once per rest, auto-succeed a failed saving throw
    if(G.classId==='barbarian'&&G._indomitable&&!G._indomitableUsed){
      G._indomitableUsed=true;
      log('🔱 Indomitable: auto-succeeded on failed '+sp.saveType.toUpperCase()+' save!','s');
      if(sp.damage){const halfDmg=Math.floor(sp.damage*.5);dealDamageToPlayer(halfDmg,sp.name);}
    } else {
    log('✗ '+sp.saveType.toUpperCase()+' save FAILED! ('+saveRoll+' vs DC'+sp.saveDC+')','e');
    log(sp.desc,'e');
    if(sp.damage)dealDamageToPlayer(sp.damage,sp.name);
    // Unstoppable: immune to Restrained and Stunned while raging
    const unstoppableBlocks=(c)=>G.classId==='barbarian'&&G._unstoppable&&G.raging&&(c==='Restrained'||c==='Stunned');
    if(sp.condition&&!unstoppableBlocks(sp.condition)){addCondition(sp.condition);}
    else if(sp.condition&&unstoppableBlocks(sp.condition)){log('💢 Unstoppable: '+sp.condition+' blocked by Rage!','s');}
    if(sp.condition2&&!unstoppableBlocks(sp.condition2)){addCondition(sp.condition2);}
    else if(sp.condition2&&unstoppableBlocks(sp.condition2)){log('💢 Unstoppable: '+sp.condition2+' blocked!','s');}
    }
  }
  // Check for player death after boss special damage
  if(G.hp<=0){onPlayerDied();return;}
  // Hand turn back after boss special resolves
  afterEnemyActs();
}

// ══════════════════════════════════════════════════════════
//  ENEMY DIED / PLAYER DIED
// ══════════════════════════════════════════════════════════
function onEnemyDied(){
  if(enemyTurnTimeout){clearTimeout(enemyTurnTimeout);enemyTurnTimeout=null;}
  hideReactionPrompt();
  const e=G.currentEnemy;
  G.isPlayerTurn=true;
  // If we're in a branch, hand off to branch system
  if(G._inBranch){
    AUDIO.sfx.enemyDeath();
    animEl('enemySprite','die-anim',700);
    const _eSprite=document.getElementById('enemySprite');
    if(_eSprite)_eSprite.classList.remove('phase2-glow');
    const _nameTag=document.getElementById('enemyNameTag');
    if(_nameTag){_nameTag.classList.remove('phase2-name-tag');_nameTag.style.animation='';}
    log(e.name+' is defeated!','s');
    const xp=Math.floor((e.xp||0)*G.xpMult);
    const gold=Math.floor(e.gold*(G.classId==='rogue'&&G.talents.includes('Luck')?G.goldMult*1.15:G.goldMult));
    G.xp+=xp; G.gold+=gold; G.totalGold+=gold; G.totalKills++;
    AUDIO.sfx.gold();
    log('+'+xp+' XP, +'+gold+'🪙','l');
    if(Math.random()<(G._branchScavenger?0.45:0.3))dropLoot(e);
    if(!e.isBoss&&G.xp>=G.xpNeeded&&!levelUpShowing){G.xp-=G.xpNeeded;doLevelUp();}
    setTimeout(()=>onBranchEnemyDefeated(), 800);
    return;
  }
  // Clear stale reaction flags on enemy death
  if(G.sx){delete G.sx.counterspell; delete G.sx.parry; delete G.sx.evasion;}
  AUDIO.sfx.enemyDeath();
  animEl('enemySprite','die-anim',700);
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
  // Wild Shape unlocks when buffer is depleted
  if(G.wildShapeHp<=0&&G.skillCooldowns['wild_shape']){
    delete G.skillCooldowns['wild_shape'];
    if(G.wildShapeActive){
      G.wildShapeActive=false;
      const pSpr=document.getElementById('playerSprite');
      if(pSpr&&CLASS_SPRITES[G.classId])renderSprite(CLASS_SPRITES[G.classId],10,pSpr);
      if(pSpr)pSpr.style.filter='';
      const exitBtn=document.getElementById('exitWildShapeBtn');
      if(exitBtn)exitBtn.style.display='none';
      log('🌿 Wild Shape fades — druid form restored.','s');
    }
  }
  // Spiritual weapon unlocks when done (cleric only)
  if(G.classId==='cleric'&&!G.spiritualWeaponActive){delete G.skillCooldowns['spiritual_weapon'];}

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
  // Seasoned Hunter: each kill in a fight increases ATK by 2
  if(G.classId==='ranger'&&G._seasonedHunter){
    G._seasonedHunterBonus=(G._seasonedHunterBonus||0)+2;
    G.atk+=2;
    log('🎖 Seasoned Hunter: +2 ATK! (total bonus: '+G._seasonedHunterBonus+')','s');
  }
  // Bloodlust: each kill extends Rage duration by 1 round
  if(G.classId==='barbarian'&&G._bloodlust&&G.raging&&G.rageTurns<999){
    G.rageTurns++;
    log('🔴 Bloodlust: Rage extended by 1 round! ('+G.rageTurns+' left)','s');
  }
  const xp=Math.floor((e.xp||0)*G.xpMult);
  const gold=Math.floor(e.gold*(G.classId==='rogue'&&G.talents.includes('Luck')?G.goldMult*1.15:G.goldMult));
  G.xp+=xp; G.gold+=gold; G.totalGold+=gold; G.totalKills++;
  AUDIO.sfx.gold();
  log('+'+xp+' XP, +'+gold+'🪙','l');
  // Relentless branch passive: heal 5 HP on kill
  if(G._branchRelentlessHeal){heal(5,'Relentless 🩸');}
  checkAchievements();
  checkObjectiveProgress('enemy_killed',e);

  // Loot
  if(Math.random()<.3)dropLoot(e);
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
      for(const[lvl]of Object.entries(G.spellSlotsMax||{})){
        if((G.spellSlots[lvl]||0)<G.spellSlotsMax[lvl]){G.spellSlots[lvl]++;log('Arcane Recovery: LVL'+lvl+' slot regained','s');break;}
      }
    }
    // Void Tap: on kill, restore 1 spell slot of any tier
    if(G._voidTap&&G.spellSlots&&G.spellSlotsMax){
      for(const[lvl]of Object.entries(G.spellSlotsMax)){
        if((G.spellSlots[lvl]||0)<G.spellSlotsMax[lvl]){G.spellSlots[lvl]++;log('🌑 Void Tap: LVL'+lvl+' slot restored!','s');break;}
      }
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
    G.bossDefeated[G.zoneIdx]=true;
    G.bossReady=false;
    document.getElementById('bossAlert').style.display='none';
    log('🏆 BOSS CLEARED: '+e.name+'!','l');
    checkObjectiveProgress('boss_killed',e);
    checkAchievements();
    // Legendary item drop
    if(e.legendaryDrop){
      const legendary=ITEMS.find(i=>i.id===e.legendaryDrop);
      if(legendary){
        addItem({...legendary,qty:1});
        log('✨ LEGENDARY DROP: '+legendary.icon+' '+legendary.name+'!','l');
      }
    }
    const defeatedEnemy = G.currentEnemy;
    G.currentEnemy=null;
    // Victory overlay → level up (if pending) → lore reveal → campfire
    const loreIdx=G.zoneIdx;
    const afterLevelUps = () => {
      const loreExists = loreIdx < LORE_REVEALS.length;
      if(loreExists){
        showLoreReveal(loreIdx, ()=>showMap(true));
      } else {
        showMap(true);
      }
    };
    const afterBossVictory = () => {
      // Now process any pending level-ups before lore/campfire
      if(G.xp>=G.xpNeeded){
        G.xp-=G.xpNeeded;
        // After all level-up screens close, continue to lore/campfire
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
        afterBossVictory
      );
    }, 900);
    return;
  }

  G.zoneKills++;
  if(G.zoneKills>=ZONES[G.zoneIdx].kills&&!G.bossReady&&!G.bossDefeated[G.zoneIdx]){
    G.bossReady=true;
    document.getElementById('bossAlert').style.display='block';
    log('Zone cleared! The boss stirs...','s');
  }

  G.currentEnemy=null;
  renderAll();
  // Track dungeon run progress
  G.dungeonFights=(G.dungeonFights||0)+1;
  if(!G.campUnlocked&&G.dungeonFights>=G.dungeonGoal){
    G.campUnlocked=true;
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
  "No resurrection. No second chance. The darkness claimed another soul.",
  "They fought with courage, but courage was not enough.",
  "The dungeon does not mourn. It merely waits for the next fool.",
  "Eternity is patient. You were not.",
  "Even the bravest flame gutters in the endless dark.",
  "Their name shall echo once, then fade like all the rest.",
  "The descent is easy. It is the return that kills.",
  "Death was not the end of the journey — it was the destination.",
];

function showDeathScreen(){
  if(!G)return;
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
    <div class="death-stat-row"><span class="death-stat-label">Class</span><span class="death-stat-val highlight">${cls.name}${G.subclassUnlocked?' / '+cls.subclass.name:''}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Level Reached</span><span class="death-stat-val highlight">${G.level}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Zone</span><span class="death-stat-val">${zone.name}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Enemies Slain</span><span class="death-stat-val">${G.totalKills}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Bosses Defeated</span><span class="death-stat-val">${bossesKilled}/5</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Gold Earned</span><span class="death-stat-val gold">🪙 ${G.totalGold}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Best Item</span><span class="death-stat-val">${bestItem?bestItem.icon+' '+bestItem.name:'None'}</span></div>
    <div class="death-stat-row"><span class="death-stat-label">Talents</span><span class="death-stat-val">${G.talents.length>0?G.talents.join(', '):'None'}</span></div>
  `;

  // Blood drop particles
  const screen=document.getElementById('screen-death');
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

function fireSpiritalWeapon(){
  if(!G.spiritualWeaponActive||!G.currentEnemy||G.currentEnemy.hp<=0)return;
  AUDIO.sfx.spiritualWeapon();
  const swDie=G.level>=5?10:8;
  const swHits=G._classSetBonus==='cleric_set'?2:1;
  for(let si=0;si<swHits;si++){
    if(!G.currentEnemy||G.currentEnemy.hp<=0)break;
    let swDmg=roll(swDie)+(G.level>=9?roll(swDie):0)+md(G.stats.wis);
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
    const d = roll(8)+roll(8)+roll(8);
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
  G._dyingFlag=true;
  if(enemyTurnTimeout){clearTimeout(enemyTurnTimeout);enemyTurnTimeout=null;}
  if(reactionTimer){clearTimeout(reactionTimer);reactionTimer=null;}
  hideReactionPrompt();
  G.hp=0; G.isPlayerTurn=false;
  G.currentEnemy=null;
  AUDIO.sfx.death();
  log('💔 You have fallen...','e');
  if(G.hardcore){
    log('☠ HARDCORE MODE: run over.','e');
    setTimeout(()=>showDeathScreen(),1200);
    return;
  }
  // Non-hardcore: show YOU DIED overlay then go to campfire
  G.restsThisZone=0;
  G.campUnlocked=true;
  G.dungeonFights=0;
  showDeathOverlay(()=>{
    if(!G)return;
    G._dyingFlag=false;
    G.hp=1;
    showCampfire();
  });
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

