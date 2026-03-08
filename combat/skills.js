
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
  // Cleric capstone — Vessel of the Divine: Sacred Flame and Channel Divinity have no cooldowns
  const vesselBypass=G.classId==='cleric'&&G.capstoneUnlocked&&(sk.id==='sacred_flame'||sk.id==='channel_divinity');
  if(!vesselBypass&&(cdRaw==='active'||(typeof cdRaw==='number'&&cdRaw>now))){log('That skill is on cooldown!','s');return;}
  // Oath Renewal: free Divine Smite | Holy Fervor: reduces Divine Smite effective cost by 1
  const effectiveCost=G._oathRenewal&&sk.id==='divine_smite'?0:sk.id==='divine_smite'&&G.talents.includes('Holy Fervor')?Math.max(1,sk.cost-1):sk.cost;
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
    if(G.classId==='wizard'&&G._spellWeaver&&Math.random()<0.25){
      if(restoreSpellSlot(1))log('🔮 Spell Weaver: LVL1 slot restored!','s');
    }
    // Legendary Grace — Eternal Spellflame: 15% chance to refund the spell slot
    if(G._graceSpellflame&&Math.random()<0.10){
      if(restoreSpellSlot(sk.slotCost))log('✨ Eternal Spellflame: spell slot preserved!','s');
    }
    // ── Chroma tracking: spell casts ──
    G.totalSpellsCast=(G.totalSpellsCast||0)+1;
    G._usedSpellSlotThisFight=true;
  }
  if(sk.cd>0) G.skillCooldowns[sk.id]=now+sk.cd*1000;
  // Wizard capstone — Arcane Transcendence: spells are free but have 2-turn cooldowns
  if(G._arcaneTranscendence&&sk.slotCost&&!G.skillCooldowns[sk.id]){
    G.skillCooldowns[sk.id]=now+2000; // 2-turn cooldown
  }
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

  // Animate player attack
  if(window.Anim) Anim.playerAttack();

  // Execute effect
  doSkillEffect(sk.effect, sk);

  // Guard: if player died during skill (e.g. reckless_attack recoil), stop here
  if(!G||G.hp<=0)return;

  // Arcane Recovery: regain a slot every 3 kills (not per spell cast)

  if(G.classId==='rogue'&&(sk.effect==='basic_attack')){
    const comboGain=G._loadedDice?2:1;
    G.res=Math.min(G.resMax,G.res+comboGain);
  }
  // Rogue capstone — Death's Shadow: every attack (not just basic) generates 2 Combo
  if(G.classId==='rogue'&&G._deathsShadow&&sk.effect!=='basic_attack'&&sk.type!=='reaction'&&sk.type!=='bonus'){
    G.res=Math.min(G.resMax,G.res+2);
    log('☠️ +2 Combo (Death\'s Shadow)','s');
  }
  // Upgrade basic attack combo to 2 for capstone (if not already 2 from Loaded Dice)
  if(G.classId==='rogue'&&G._deathsShadow&&sk.effect==='basic_attack'&&!G._loadedDice){
    G.res=Math.min(G.resMax,G.res+1); // already got 1 above, add 1 more = 2
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
      // Beast Companion (Beast Master subclass): companion strikes alongside basic attack
      if(G.classId==='ranger'&&G.subclassId==='beast_master'){
        r.dmg+=roll(6)+(G._apexCompanion?roll(6):0);
      }
      dealToEnemy(r.dmg,r.crit,'Attack');
      // ── Dual Attack (Level 10+ martials) ──
      if(G.level>=10&&['fighter','barbarian','paladin','ranger'].includes(G.classId)&&G.currentEnemy&&G.currentEnemy.hp>0){
        log('⚔⚔ Dual Strike!','s');
        const r2=calcPlayerDmg();
        dealToEnemy(r2.dmg,r2.crit,'Second Strike ⚔');
      }
      // Sacred Weapon: +1d6 radiant and +3 HP per hit
      if(G.sx&&G.sx.sacredWeapon&&G.sx.sacredWeapon.turns>0){
        const swRad=roll(6)+Math.max(0,md(G.stats.cha));dealToEnemy(swRad,false,'Sacred Weapon 🌟 (1d6+CHA)');
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
      if(G.classId==='barbarian'&&G.subclassId==='berserker'&&G.raging&&G.currentEnemy&&G.currentEnemy.hp>0){
        G._frenzyPending=true;
      }
      // Fix 5: Spiritual Weapon fires alongside attack on same turn
      if(G.spiritualWeaponActive&&G.currentEnemy&&G.currentEnemy.hp>0){
        fireSpiritualWeapon();
      }
      // Rare Event: Frozen Soldier auto-attacks
      if(G._rareEventFlags.frozenSoldier&&G._rareEventFlags.frozenSoldier.zoneIdx===G.zoneIdx&&G._rareEventFlags.frozenSoldier.hp>0&&G.currentEnemy&&G.currentEnemy.hp>0){
        const sDmg=G._rareEventFlags.frozenSoldier.atk+roll(6);
        dealToEnemy(sDmg,false,'💀 Frozen Soldier strikes');
      }
      break;}
    case 'power_strike':{
      // Temporarily remove _vulnerable so Power Strike itself doesn't consume it
      const hadVuln=G.currentEnemy&&G.currentEnemy._vulnerable;
      if(hadVuln)delete G.currentEnemy._vulnerable;
      const r=calcPlayerDmg();r.dmg=r.dmg+roll(10)+roll(10);
      // Restore if it was there, then set new one for NEXT hit
      if(hadVuln&&G.currentEnemy)G.currentEnemy._vulnerable=true;
      dealToEnemy(r.dmg,r.crit,'Power Strike 💪 (base+2d10)');
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
    case 'second_wind':{AUDIO.sfx.secondWind();const h=roll(10)+md(G.stats.con);heal(h,'Second Wind (1d10+CON)');
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
      let fbd=roll(10)+roll(10)+getSpellPower()+(G.subclassId==='evoker'?roll(6):0);
      if(G._overchannelActive){fbd=10+10+getSpellPower()+(G.subclassId==='evoker'?6:0);G._overchannelActive=false;log('⚡ Overchannel: Fire Bolt maximized!','s');}
      // Brilliant Focus: +INT mod to spell damage
      if(G.classId==='wizard'&&G._brilliantFocus)fbd+=Math.max(0,md(G.stats.int));
      // Overload: spells penetrate 30% of enemy DEF
      if(G.classId==='wizard'&&G._overload&&G.currentEnemy)fbd+=Math.floor((G.currentEnemy.def||0)*0.3);
      // Spell Power: +15% spell damage
      if(G.classId==='wizard'&&G.talents.includes('Spell Power'))fbd=Math.ceil(fbd*1.10);
      // Arcane Transcendence: +30% spell damage
      if(G._arcaneTranscendence)fbd=Math.ceil(fbd*1.3);
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
        let fbd2=roll(10)+roll(10)+getSpellPower();
        if(G._brilliantFocus)fbd2+=Math.max(0,md(G.stats.int));
        if(G._overload&&G.currentEnemy)fbd2+=Math.floor((G.currentEnemy.def||0)*0.3);
        dealToEnemy(fbd2,false,'Metamagic Twin 🌀 second bolt');
        log('🌀 Metamagic Twin: second Fire Bolt fires!','s');
      }
      break;}
    case 'magic_missile':{
      AUDIO.sfx.magicMissile();const darts=G.level>=9?5:G.level>=5?4:3;
      let t=0;for(let i=0;i<darts;i++)t+=roll(4)+1;
      t+=getSpellPower();
      // Brilliant Focus: +INT mod to spell damage
      if(G.classId==='wizard'&&G._brilliantFocus)t+=Math.max(0,md(G.stats.int));
      // Overload: penetrate 30% of enemy DEF
      if(G.classId==='wizard'&&G._overload&&G.currentEnemy)t+=Math.floor((G.currentEnemy.def||0)*0.3);
      // Spell Power: +15% spell damage
      if(G.classId==='wizard'&&G.talents.includes('Spell Power'))t=Math.ceil(t*1.10);
      // Arcane Transcendence: +30% spell damage
      if(G._arcaneTranscendence)t=Math.ceil(t*1.3);
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
      let d=0;for(let i=0;i<8;i++)d+=roll(fbDie);
      d+=getSpellPower();
      // Brilliant Focus: +INT mod to spell damage
      if(G.classId==='wizard'&&G._brilliantFocus)d+=Math.max(0,md(G.stats.int));
      // Overload: penetrate 30% of enemy DEF
      if(G.classId==='wizard'&&G._overload&&G.currentEnemy)d+=Math.floor((G.currentEnemy.def||0)*0.3);
      if(G.classId==='wizard'&&G.talents.includes('Spell Power'))d=Math.ceil(d*1.10);
      // Arcane Transcendence: +30% spell damage
      if(G._arcaneTranscendence)d=Math.ceil(d*1.3);
      dealToAllEnemies(d,false,'Fireball 💥');
      addConditionAllEnemies('Burning',2);
      log('🔥 Fireball hits all enemies! Burning for 3 turns!','c');
      processAoeDeaths();
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
      const sneakDice=2+Math.floor(G.level/5)+(G.talents.includes('Death Mark')?1:0);
      for(let i=0;i<sneakDice;i++)r.dmg+=roll(6);
      // Exploit Weakness: +50% damage vs Poisoned or Bleeding enemies
      if(G.classId==='rogue'&&G._exploitWeakness&&G.currentEnemy){
        const hasPoisoned=G.currentEnemy.conditions&&G.currentEnemy.conditions.find(c=>c.name==='Poisoned'&&c.turns>0);
        const hasBleeding=G.currentEnemy.conditions&&G.currentEnemy.conditions.find(c=>c.name==='Bleeding'&&c.turns>0);
        if(hasPoisoned||hasBleeding){r.dmg=Math.ceil(r.dmg*1.5);log('🎯 Exploit Weakness: +50% damage!','s');}
      }
      dealToEnemy(r.dmg,r.crit,'Sneak Attack 🎯 ('+sneakDice+'d6)');
      // ── Chroma tracking: sneak attacks ──
      G.totalSneakAttacks=(G.totalSneakAttacks||0)+1;
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
      setCooldown('sneak_attack',G._classSetBonus==='rogue_set'?1:2);
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
      // ── Chroma tracking: lifetime smites ──
      G._lifetimeSmites=(G._lifetimeSmites||0)+1;
      let d=roll(8)+roll(8)+roll(8)+getSpellPower();
      // Avatar of Light capstone: spend ALL Holy Power for +1d6 per point
      if(G.capstoneUnlocked&&G.classId==='paladin'&&G.res>0){
        const spent=G.res;for(let i=0;i<spent;i++)d+=roll(6);
        G.res=0;log('👼 Avatar of Light: '+spent+' Holy Power channeled! (+'+spent+'d6)','s');
      }
      // Oath Renewal: next smite is guaranteed crit
      const smiteCrit=G._oathRenewal||Math.random()<0.1;
      if(G._oathRenewal){G._oathRenewal=false;log('🕯 Oath Renewal: free guaranteed-crit smite!','s');}
      dealToEnemy(d,smiteCrit,'Divine Smite ✨');
      if(G.talents.includes('Avenging Angel')){const ah=Math.floor(d/2);G.hp=Math.min(G.maxHp,G.hp+ah);log('⚡ Avenging Angel: healed '+ah+' HP!','s');}
      if(G._classSetBonus==='paladin_set'){const sh=Math.ceil(d*0.25);G.hp=Math.min(G.maxHp,G.hp+sh);spawnFloater(sh,'heal',false);log('✦ Oath of the Undying: healed '+sh+' HP from Smite!','l');}
      // Holy Momentum: on crit, restore 2 Holy Power
      if(G._holyMomentum&&smiteCrit){G.res=Math.min(G.resMax,G.res+2);log('💫 Holy Momentum: +2 Holy Power!','s');}
      // Smite Chain: smite twice in one turn for +1 Holy Power
      if(G._smiteChain&&!G._smiteChainUsed&&G.currentEnemy&&G.currentEnemy.hp>0&&G.res>=1){
        G._smiteChainUsed=true;G.res-=1;
        const d2=roll(8)+roll(8)+getSpellPower();
        dealToEnemy(d2,false,'Smite Chain 🗡 second smite');
        if(G.talents.includes('Avenging Angel')){const ah2=Math.floor(d2/2);G.hp=Math.min(G.maxHp,G.hp+ah2);}
        log('🗡 Smite Chain: second smite fires!','s');
      }
      break;}
    case 'lay_on_hands':{
      AUDIO.sfx.heal();
      if(G.layOnHandsPool<=0){log('Lay on Hands pool exhausted!','s');return;}
      const healAmt=Math.min(G.layOnHandsPool, roll(8)+roll(8)+Math.max(0,md(G.stats.wis))+(G.talents.includes('Lay on Hands+')?Math.max(0,md(G.stats.wis)):0));
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
      const vTargets=(G.currentEnemies||[]).filter(e=>!e.dead&&e.hp>0);
      if(vTargets.length<=1){
        // Single target — all arrows at it
        for(let i=0;i<3;i++){
          if(!G.currentEnemy||G.currentEnemy.hp<=0)break;
          const r=calcPlayerDmg();
          let d=Math.ceil(r.dmg*.7)+roll(6);
          if(G._longShot)d+=roll(8)-roll(6);
          if(G._volleyMastery&&G.hunterMarked)d+=roll(G._hawkEye?8:6);
          dealToEnemy(d,r.crit,'Volley 🏹 (base×0.7+1d6)');
          t+=d;arrowsHit++;
        }
      } else {
        // Multi-target — spread arrows across living enemies
        for(let i=0;i<3;i++){
          const alive=vTargets.filter(e=>!e.dead&&e.hp>0);
          if(!alive.length)break;
          const target=alive[i%alive.length];
          G.currentEnemy=target;
          G.targetIdx=(G.currentEnemies||[]).indexOf(target);
          const r=calcPlayerDmg();
          let d=Math.ceil(r.dmg*.7)+roll(6);
          if(G._longShot)d+=roll(8)-roll(6);
          if(G._volleyMastery&&G.hunterMarked)d+=roll(G._hawkEye?8:6);
          dealToEnemy(d,r.crit,'Volley 🏹 (base×0.7+1d6)');
          t+=d;arrowsHit++;
        }
        processAoeDeaths();
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
      r.dmg=r.dmg+roll(12)+roll(12);
      dealToEnemy(r.dmg,r.crit,'Reckless Attack 💥 (base+2d12)');
      // ── Chroma tracking: reckless attacks ──
      G.totalReckless=(G.totalReckless||0)+1;
      // Consumes 20 rage resource — but never drops you out of rage entirely
      if(G.raging){
        const rageCost=20;
        G.res=Math.max(1,G.res-rageCost);
        log('🔥 Reckless: -'+rageCost+' Rage ('+Math.floor(G.res)+' left)','s');
        renderHUD();
      }
      // Recoil — Juggernaut halves it; Volcanic Rage redirects to enemy
      {
        let recoil=roll(6); // 1d6 recoil
        if(G._juggernaut) recoil=Math.floor(recoil*0.5); // Juggernaut: 50% reduction
        if(recoil>0&&G._volcanicRage&&G.raging&&G.currentEnemy&&G.currentEnemy.hp>0){
          const burnBonus=roll(6);
          dealToEnemy(burnBonus,false,'Volcanic Rage 🌋 burn');
          addConditionEnemy('Burning',2);
          log('🌋 Volcanic Rage: recoil redirected as burn!','s');
        } else if(recoil>0){
          G.hp-=recoil;
          spawnFloater(recoil,'dmg',false);
          animEl('playerSprite','hit-anim',300);
          if(window.Anim) Anim.playerHit();
          log(G._juggernaut?'⚔️ Juggernaut: recoil reduced to '+recoil+'!':'💢 Reckless Recoil: '+recoil+' self-damage','e');
          renderHUD();
          if(G.hp<=0){onPlayerDied();return;}
        }
      }
      break;}
    case 'retaliation':{
      if(G._mountainWeight){const md_=Math.floor((G.stats.str-10)/2);const d=roll(8)+Math.max(0,md_);dealToEnemy(d,false,"Mountain's Weight 🏔 retaliation");}
      else{const r=calcPlayerDmg();dealToEnemy(r.dmg,r.crit,'Retaliation ⚡');}
      break;}
    case 'sacred_flame':{
      AUDIO.sfx.sacredFlame();
      const d=roll(8)+roll(8)+getSpellPower()+(G.subclassId==='life'?roll(4):0)+(G.talents.includes('Radiant Soul')?roll(4):0);
      dealToEnemy(d,false,'Sacred Flame ☀️');
      // Wrath of the Righteous: applies Vulnerable (+15% dmg taken) for 1 turn
      if(G.classId==='cleric'&&G._wrathRighteous&&G.currentEnemy&&G.currentEnemy.hp>0){G.currentEnemy._vulnerable=true;log('⚡ Wrath of the Righteous: Vulnerable!','c');}
      // Wrath of God: sacred flame hits twice (once per turn)
      if(G.classId==='cleric'&&G._wrathOfGod&&!G._wrathOfGodUsed&&G.currentEnemy&&G.currentEnemy.hp>0){
        G._wrathOfGodUsed=true;
        const d2=roll(8)+roll(8)+getSpellPower()+(G.subclassId==='life'?roll(4):0)+(G.talents.includes('Radiant Soul')?roll(4):0);
        dealToEnemy(d2,false,'Wrath of God ⚡ second flame');
        log('⚡ Wrath of God: second Sacred Flame!','s');
      }
      // Eternal Flame: no cooldown
      if(G.classId==='cleric'&&G._eternalFlame){if(G.skillCooldowns['sacred_flame'])delete G.skillCooldowns['sacred_flame'];}
      break;}
    case 'healing_word':{
      AUDIO.sfx.heal();
      let hwHeal=roll(4)+md(G.stats.wis)+(G.subclassId==='life'?4:0)+(G.talents.includes('Blessed Healing')?5:0);
      // Tidal Grace: +1d6 to Healing Word
      if(G.classId==='cleric'&&G._tidalGrace)hwHeal+=roll(6);
      heal(hwHeal,'Healing Word 💚');
      // Overflowing Font: once per fight, Healing Word fires twice
      if(G.classId==='cleric'&&G._overflowingFont&&!G._overflowingFontUsed){
        G._overflowingFontUsed=true;
        let hw2=roll(4)+md(G.stats.wis)+(G.subclassId==='life'?4:0)+(G.talents.includes('Blessed Healing')?5:0);
        if(G._tidalGrace)hw2+=roll(6);
        heal(hw2,'Overflowing Font 💫 second word');
        log('💫 Overflowing Font: second Healing Word!','s');
      }
      break;}
    case 'channel_divinity':{
      // ── Chroma tracking: lifetime channels ──
      G._lifetimeChannels=(G._lifetimeChannels||0)+1;
      // vs Undead: auto Turn Undead (smite)
      if(G.currentEnemy&&G.currentEnemy.isUndead){
        AUDIO.sfx.sacredFlame();
        const d=roll(8)*3+getSpellPower()+(G.talents.includes('Divine Armor')?10:0);
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
      const clawDmg=roll(6)+roll(6)+Math.max(0,md(G.stats.str))+G.profBonus;
      const clawCrit=roll(20)>=G.critRange;
      let finalClaw=clawCrit?clawDmg+roll(6)+roll(6):clawDmg; // D&D crit: roll damage dice again
      if(G._elementalForm){const fireDmg=roll(6);finalClaw+=fireDmg;log('🔥 Elemental: +'+fireDmg+' fire damage!','s');}
      dealToEnemy(finalClaw,clawCrit,G._elementalForm?'Flame Strike 🔥':'Claw Strike 🐾');
      // Apex Predator: 20% chance to Restrain enemy
      if(G._apexPredator&&G.currentEnemy&&G.currentEnemy.hp>0&&Math.random()<0.2){
        addConditionEnemy('Restrained',1);log('🐾 Apex Predator: enemy Restrained!','c');
      }
      break;}
    case 'thorn_whip':{
      AUDIO.sfx.thornWhip();const twRoll=roll(20);
      const d=roll(8)+getSpellPower();
      const isTwCrit=twRoll>=G.critRange;
      dealToEnemy(isTwCrit?Math.ceil(d*2):d,isTwCrit,'Thorn Whip 🌱');
      if(isTwCrit&&G.currentEnemy&&G.currentEnemy.hp>0){
        addConditionEnemy('Poisoned',2);
        if(G.classId==='druid') G._lifetimePoisonsApplied=(G._lifetimePoisonsApplied||0)+1;
        log('🌱 Critical! Thorns inject poison — Poisoned (2 turns).','c');
      }
      // Dark Moon: 25% chance to Poison on thorn whip
      if(G._darkMoon&&G.currentEnemy&&G.currentEnemy.hp>0&&Math.random()<0.25){
        addConditionEnemy('Poisoned',3);log('🌑 Dark Moon: Poisoned!','c');
        if(G.classId==='druid') G._lifetimePoisonsApplied=(G._lifetimePoisonsApplied||0)+1;
      }
      break;}
    case 'wild_shape':{
      AUDIO.sfx.wildShape();if(G.wildShapeHp>0){log('Already in Wild Shape! ('+G.wildShapeHp+' HP buffer remaining)','s');return;}
      const wsBase=20+G.level*3+(G.talents.includes('Beast Mastery')?20:0);
      let hp=G._classSetBonus==='druid_set'?Math.ceil(wsBase*1.5):wsBase;
      // Bear's Endurance: wild shape HP +25% of max HP
      if(G._bearsEndurance)hp+=Math.floor(G.maxHp*0.25);
      // Wild Attunement (campfire ritual): +50% Wild Shape HP
      if(G._wildAttunement){hp=Math.floor(hp*1.5);log('🌿 Wild Attunement: +50% Wild Shape HP!','s');}
      // Cap wild shape temp HP: 100 base, 120 with set bonus (raised to 150/180 with Wild Attunement)
      const wsCap=G._classSetBonus==='druid_set'?(G._wildAttunement?180:120):(G._wildAttunement?150:100);
      hp=Math.min(hp,wsCap);
      G.wildShapeHp=hp;
      G._wildShapeMaxHp=hp;
      G.wildShapeActive=true;
      G._elementalForm=false;
      G.skillCooldowns['wild_shape']=Date.now()+(999*1000);
      // Save original stats and apply bear stat block
      G._humanStats={str:G.stats.str,dex:G.stats.dex,con:G.stats.con,atk:G.atk,def:G.def};
      const bearStr=Math.max(G.stats.str,20);
      const bearCon=Math.max(G.stats.con,16);
      const conGain=bearCon-G.stats.con;
      G.stats.str=bearStr;
      G.stats.con=bearCon;
      G.atk=3+G.level*2; // Bear ATK scales with level like physical classes
      G.def+=Math.floor(conGain/2);
      const strMod=Math.floor((G.stats.str-10)/2);
      log('🐻 Wild Shape! Bear form: STR '+bearStr+' (+'+strMod+' ATK), +'+hp+' HP buffer. Spells locked!'+(G._classSetBonus==='druid_set'?' (✦ +50% Heart of the Wild!)':''),'s');
      // Regrowth: heal 10 HP when entering Wild Shape
      if(G._regrowth){G.hp=Math.min(G.maxHp,G.hp+10);log('🌾 Regrowth: +10 HP on transformation!','s');}
      // Druid capstone — The Green: heal 20 HP on Wild Shape entry
      if(G.capstoneUnlocked&&G.classId==='druid'){G.hp=Math.min(G.maxHp,G.hp+20);log('🌍 The Green: +20 HP on transformation!','s');}
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
      let ewsHp=G._classSetBonus==='druid_set'?Math.ceil(ewsBase*1.5):ewsBase;
      const ewsCap=G._classSetBonus==='druid_set'?120:100;
      ewsHp=Math.min(ewsHp,ewsCap);
      G.wildShapeHp=ewsHp;
      G._wildShapeMaxHp=ewsHp;
      G.wildShapeActive=true;
      G._elementalForm=true;
      G.skillCooldowns['wild_shape']=Date.now()+(999*1000); // also lock regular wild_shape
      // Save human stats and apply elemental stat block
      G._humanStats={str:G.stats.str,dex:G.stats.dex,con:G.stats.con,atk:G.atk,def:G.def};
      const elemStr=Math.max(G.stats.str,18);
      const elemWis=Math.max(G.stats.wis,20);
      G.stats.str=elemStr;
      G.stats.wis=elemWis;
      G.atk=3+G.level*2+2; // Elemental ATK scales with level, +2 fire empowered
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
        if(window.Anim) Anim.stopPlayerIdle();
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
      if(G._waxingMoon) G._waxingMoonStacks = (G._waxingMoonStacks||0)+1;
      const mbBonus=G._waxingMoon?(G._waxingMoonStacks*roll(6)):0;
      const d=roll(10)+roll(10)+getSpellPower()+(G.talents.includes('Lunar Magic')?roll(6):0)+mbBonus;
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
      const enemySaveBonus=Math.floor((G.zoneIdx||0)*1.5);
      const enemySave=roll(20)+enemySaveBonus;
      const entTurns=G._tidalRoots?3:2; // Tidal Roots: +1 turn
      if(enemySave<spellDC){
        const entDmg=roll(4)+Math.max(0,md(G.stats.wis));addConditionEnemy('Restrained',entTurns);dealToEnemy(entDmg,false,'Entangle 🌿 (1d4+WIS)');
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
      if(!G.currentEnemy){log('No target!','e');break;}
      AUDIO.sfx.powerStrike();
      const {dmg:sd,crit:sc}=calcPlayerDmg();
      const surgeBonus=roll(10)+roll(10);
      const surgeDmg=Math.ceil((sd+surgeBonus)*(sc?2:1));
      dealToEnemy(surgeDmg,sc,'Surge Strike ⚡ (base+2d10)');
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
        restoreSpellSlot();
        log('⚡ Overcharged: Empowered Blast is free this rest!','s');
      }
      // 4d8 + spell power
      const ebDmg0=roll(8)+roll(8)+roll(8)+roll(8)+getSpellPower();
      // Spell Power: +15% spell damage
      let ebDmg1=G.talents.includes('Spell Power')?Math.ceil(ebDmg0*1.10):ebDmg0;
      // Arcane Transcendence: +30% spell damage
      if(G._arcaneTranscendence)ebDmg1=Math.ceil(ebDmg1*1.3);
      const ebDmg=ebDmg1;
      dealToAllEnemies(ebDmg,false,'Empowered Blast 💎');
      log('💎 Empowered Blast — maximized dice hits all enemies!','s');
      processAoeDeaths();
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
      // Beast strike: 1d8+DEX
      const beastDmg=Math.max(1,roll(8)+Math.max(0,md(G.stats.dex))+(G.hunterMarked?roll(G.talents.includes('Hawk Eye')?8:6):0));
      dealToEnemy(beastDmg,false,'Pack Hunt 🐺 (Beast Strike)');
      log('🐺 You and your companion strike together!','s');
      break;}

    case 'frenzy_attack':{
      if(!G.raging){log('Frenzy Attack requires Rage!','e');break;}
      AUDIO.sfx.powerStrike();
      const {dmg:fad,crit:fac}=calcPlayerDmg();
      const frenzBonus=roll(8);
      dealToEnemy(fad+frenzBonus,fac,'Frenzy Attack 🩸 (base+1d8)');
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
      const elemDmg=roll(6)+roll(6)+(G.talents.includes('Wildfire')?roll(6):0);
      const totalElem=esd+elemDmg;
      dealToEnemy(totalElem,esc,'Elemental Strike 🌊 (base+2d6 '+elem+')');
      if(elem==='fire'&&Math.random()<0.25)addConditionEnemy('Burning',3);
      else if(elem==='cold'&&Math.random()<0.25){if(G.currentEnemy){G.currentEnemy._vulnerable=true;log('Chilled! Enemy DEF reduced.','c');}}
      else if(elem==='lightning'&&Math.random()<0.25)addConditionEnemy('Stunned',1);
      log('🌊 Elemental Strike — '+elem+' surge!','s');
      break;}

    // ── ULTIMATE I SKILLS ─────────────────────────────────
    case 'action_surge':{
      if(G._ultimateUsed){log('Action Surge — already used this rest!','e');break;}
      G._ultimateUsed=true;
      G.actionUsed=false; // bonus was spent to activate — action is reset so fighter can act again
      G._surgeTurns=1;
      G._surgeCritBonus=3; // crit on 17+
      // Fighter capstone — Unbreakable: Action Surge resets Second Wind and Parry
      if(G.capstoneUnlocked&&G.classId==='fighter'){
        delete G.skillCooldowns['second_wind'];delete G.skillCooldowns['parry'];
        if(G.skillCharges.second_wind!==undefined)G.skillCharges.second_wind=Math.max(G.skillCharges.second_wind||0,1);
        log('🔱 Unbreakable: Second Wind and Parry reset!','s');
      }
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
      dealToAllEnemies(diDmg,false,'Divine Intervention 😇'+(isHolyTarget?' [SMITE×2]':''));
      G.conditions=[];G.conditionTurns={};
      G.res=Math.min(G.resMax,G.res+5);
      log('😇 DIVINE INTERVENTION! Fully healed, conditions cleared, Holy Power restored!','s');
      processAoeDeaths();
      break;}

    case 'hail_of_arrows':{
      if(G._ultimateUsed){log('Hail of Arrows — already used this rest!','e');break;}
      G._ultimateUsed=true;
      let hailDmg=0;for(let i=0;i<10;i++)hailDmg+=roll(6);
      hailDmg+=Math.max(0,md(G.stats.dex));
      dealToAllEnemies(hailDmg,false,'Hail of Arrows 🌧️');
      G.hunterMarked=true;
      addConditionAllEnemies('Restrained',2);
      log("🌧️ HAIL OF ARROWS! All enemies hit, Marked and Restrained 2 turns!","s");
      processAoeDeaths();
      break;}

    case 'world_breaker':{
      if(G._ultimateUsed){log('World Breaker — already used this rest!','e');break;}
      G._ultimateUsed=true;
      let wbDmg=0;for(let i=0;i<5;i++)wbDmg+=roll(12);
      wbDmg+=Math.max(0,md(G.stats.str));
      const hasConditions=G.currentEnemy&&G.currentEnemy.conditions&&G.currentEnemy.conditions.length>0;
      if(hasConditions)wbDmg*=2;
      const wbRecoil=Math.floor(5+G.zoneIdx*3);
      G.hp=Math.max(1,G.hp-wbRecoil); // recoil scales with zone
      dealToAllEnemies(wbDmg,false,'World Breaker 🌍'+(hasConditions?' [DOUBLED]':''));
      log('🌍 WORLD BREAKER!'+(hasConditions?' Double damage vs conditioned enemy!':' Recoil: '+wbRecoil+' damage to self.'),'s');
      processAoeDeaths();
      break;}

    case 'miracle':{
      if(G._ultimateUsed&&!G.capstoneUnlocked){log('Miracle — already used this rest!','e');break;}
      G._ultimateUsed=true;
      heal(G.maxHp-G.hp,'Miracle ✨');
      let mirDmg=0;for(let i=0;i<4;i++)mirDmg+=roll(10);
      dealToAllEnemies(mirDmg,false,'Miracle ✨ radiant');
      G.conditions=[];G.conditionTurns={};
      G.res=G.resMax;
      const isUnholy=G.currentEnemy&&(G.currentEnemy.isUndead||G.currentEnemy.isFiend);
      if(isUnholy)addConditionAllEnemies('Frightened',3);
      log('✨ MIRACLE! Fully healed, conditions cleared, Devotion restored'+(isUnholy?', enemies Frightened!':'!'),'s');
      processAoeDeaths();
      break;}

    case 'primal_avatar':{
      if(G._ultimateUsed){log('Primal Avatar — already used this rest!','e');break;}
      G._ultimateUsed=true;
      const paTurns=G.capstoneUnlocked?8:4;
      G.sx.primalAvatar=paTurns;
      // Give temp HP via wildShapeHp buffer
      const paHp=80;
      G.wildShapeHp=Math.min((G.wildShapeHp||0)+paHp, G._classSetBonus==='druid_set'?120:100);
      swapBearBars(true,G.wildShapeHp,G.wildShapeHp);
      G.sx.immuneConditions=true;
      let paDmg=0;for(let i=0;i<3;i++)paDmg+=roll(6);paDmg+=Math.max(0,md(G.stats.wis));
      const paAlive=(G.currentEnemies||[]).filter(e=>!e.dead&&e.hp>0);
      const _paAliveCount=paAlive.length;
      if(paAlive.length>0)dealToAllEnemies(paDmg,false,'Primal Avatar 🌿 (3d6+WIS)');
      log('🌿 PRIMAL AVATAR! +80 temp HP, immune to conditions for '+paTurns+' turns!','s');
      processAoeDeaths();
      // ── Chroma tracking: primal avatar triple kill ──
      const _paKills=_paAliveCount-(G.currentEnemies||[]).filter(e=>!e.dead&&e.hp>0).length;
      if(_paKills>=3) G._primalAvatarTripleKill=true;
      break;}

    // ══════════════════════════════════════════════════════════
    //  NEW SUBCLASS SKILLS
    // ══════════════════════════════════════════════════════════

    // Champion — Survivor's Strike (reaction: on first drop below 50% HP)
    case 'survivor_strike':{
      const {dmg:sdmg,crit:scrit}=calcPlayerDmg();
      const finalDmg=sdmg+roll(8);
      dealToEnemy(finalDmg,scrit,"Survivor's Strike 💀 (base+1d8)");
      G.skillCharges.parry=Math.min((G.skillCharges.parry||0)+1,3);
      log("💀 Survivor's Strike: 1.5× counter + 1 Parry charge restored!",'s');
      if(G.currentEnemy&&G.currentEnemy.hp<=0){onEnemyDied();return;}
      break;}

    // Battle Master — Maneuver Strike
    case 'maneuver_strike':{
      const {dmg:mdmg,crit:mcrit}=calcPlayerDmg();
      const bonusDice=roll(10);
      const totalMdmg=mdmg+bonusDice;
      dealToEnemy(totalMdmg,mcrit,'Maneuver Strike 🎯 (base+1d10)');
      addConditionEnemy('Restrained',1);
      if(G.currentEnemy){G.currentEnemy._defDebuff=(G.currentEnemy._defDebuff||0)+3;G.currentEnemy._defDebuffTurns=Math.max(G.currentEnemy._defDebuffTurns||0,2);log('🎯 Maneuver Strike: Restrained(1) + DEF -3!','s');}
      if(G.currentEnemy&&G.currentEnemy.hp<=0){onEnemyDied();return;}
      break;}

    // Battle Master — Rally
    case 'rally':{
      const rallyHeal=roll(8)+md(G.stats.con);
      heal(rallyHeal,'Rally 🛡 (1d8+CON)');
      if(G.skillCharges.second_wind!==undefined) G.skillCharges.second_wind=Math.min((G.skillCharges.second_wind||0)+1,3);
      log('🛡 Rally: +'+rallyHeal+' HP + 1 Second Wind charge!','s');
      break;}

    // Evoker — Overchannel
    case 'overchannel':{
      G._overchannelActive=true;
      log('⚡ Overchannel: next spell maximized!','s');
      break;}

    // Illusionist — Phantasmal Force
    case 'phantasmal_force':{
      addConditionEnemy('Frightened',2);
      G._phantasmalTarget=G.targetIdx;
      log('😱 Phantasmal Force: enemy Frightened(2)! Takes 2d6 psychic/turn while Frightened.','s');
      break;}

    // Illusionist — Mirage
    case 'mirage':{
      const aliveEn=(G.currentEnemies||[]).filter(e=>!e.dead&&e.hp>0);
      aliveEn.forEach(e=>{e._blindedAtk=(e._blindedAtk||0)+3; e._blindedTurns=2;});
      log('🌫️ Mirage: all enemies Blinded! -3 ATK for 2 turns.','s');
      break;}

    // Thief — Fast Hands (use consumable as bonus action)
    case 'fast_hands':{
      // Find first usable consumable in inventory
      const consumableIdx=G.inventory.findIndex(it=>it&&it.type==='consumable');
      if(consumableIdx===-1){log('No consumables in inventory!','e');break;}
      const consumable=G.inventory[consumableIdx];
      G.inventory[consumableIdx]=null;
      // Apply consumable effect
      if(consumable.stats&&consumable.stats.heal){
        const hAmt=consumable.stats.heal+(consumable.stats.heal2?roll(consumable.stats.heal2):0);
        heal(hAmt,'Fast Hands 🤲 '+consumable.name);
      } else {
        log('🤲 Fast Hands: used '+consumable.name,'s');
      }
      break;}

    // Assassin — Envenom
    case 'envenom':{
      G._envenomStacks=2;
      log('🐍 Envenom: next 2 attacks apply Poisoned(3) + 1d6 poison!','s');
      break;}

    // Assassin — Marked for Death
    case 'marked_for_death':{
      G._markedForDeath=true;
      log('☠️ Marked for Death: next Sneak Attack uses maximized dice!','s');
      break;}

    // Devotion — Aura of Protection
    case 'aura_of_protection':{
      G.sx.immuneFrightened=3;G.sx.immuneRestrained=3;
      const aliveEnemies=(G.currentEnemies||[]).filter(e=>!e.dead&&e.hp>0);
      aliveEnemies.forEach(e=>{e._defDebuff=(e._defDebuff||0)+2;e._defDebuffTurns=Math.max(e._defDebuffTurns||0,3);});
      log('😇 Aura of Protection: immune Frightened+Restrained 3 turns, enemies -2 DEF!','s');
      break;}

    // Vengeance — Vow Strike
    case 'vow_strike':{
      const {dmg:vsd,crit:vsc}=calcPlayerDmg();
      const isMarked=G._vengeanceMarked>=0&&G.targetIdx===G._vengeanceMarked;
      const vsDmg=vsd+roll(8)+(isMarked?roll(8):0);
      dealToEnemy(vsDmg,vsc,'Vow Strike ⚔️ (base+1d8'+(isMarked?'+1d8':'')+')');
      addConditionEnemy('Frightened',2);
      if(isMarked){G.res=Math.min(G.resMax,G.res+1);log('⚔️ Vow Strike: base+2d8 vs marked + Frightened(2) + 1 Holy Power!','s');}
      else{log('⚔️ Vow Strike: base+1d8 + Frightened(2)!','s');}
      if(G.currentEnemy&&G.currentEnemy.hp<=0){onEnemyDied();return;}
      break;}

    // Vengeance — Relentless Pursuit (reaction)
    case 'relentless_pursuit':{
      const {dmg:rpBase,crit:rpc}=calcPlayerDmg();
      const rpDmg=rpBase+roll(8);
      dealToEnemy(rpDmg,rpc,'Relentless Pursuit 🔒 (base+1d8)');
      log('🔒 Relentless Pursuit: counter for '+rpDmg+'!','s');
      if(G.currentEnemy&&G.currentEnemy.hp<=0){onEnemyDied();return;}
      break;}

    // Gloom Stalker — Shadow Dive
    case 'shadow_dive':{
      G.sx.evasion=true; // untargetable until end of turn
      G._shadowDiveActive=true; // next attack applies Frightened(2)
      log('🌑 Shadow Dive: untargetable! Next attack applies Frightened(2).','s');
      break;}

    // Gloom Stalker — Dread Ambush (round 1 only)
    case 'dread_ambush':{
      if(G.roundNum!==1||G._dreadAmbushUsed){log('Dread Ambush only usable in round 1!','e');break;}
      G._dreadAmbushUsed=true;
      const {dmg:dadmg,crit:dacrit}=calcPlayerDmg();
      dealToEnemy(dadmg+roll(8),dacrit,'Dread Ambush 💀 (base+1d8)');
      addConditionEnemy('Frightened',2);
      addConditionEnemy('Restrained',1);
      log('💀 DREAD AMBUSH! Frightened(2) + Restrained(1)!','s');
      if(G.currentEnemy&&G.currentEnemy.hp<=0){onEnemyDied();return;}
      break;}

    // Wild Heart — Spirit Surge
    case 'spirit_surge':{
      const totem=G._totemSpirit||'bear';
      const doubling=G.raging&&G.subclassId==='wild_heart';
      if(totem==='bear'){
        const ssHeal=(roll(10)+md(G.stats.con))*(doubling?2:1);
        heal(ssHeal,'Spirit Surge 🐻 (1d10+CON)');
      } else if(totem==='eagle'){
        const ssDodge=doubling?4:2;
        G.sx.evasion=true; G.sx.evasionStacks=(G.sx.evasionStacks||0)+ssDodge;
        log('🦅 Spirit Surge (Eagle): dodge next '+ssDodge+' hits!','s');
      } else if(totem==='wolf'){
        const ssAtk=(4+(doubling?4:0));
        G.atk+=ssAtk; G._spiritSurgeAtkBonus=(G._spiritSurgeAtkBonus||0)+ssAtk;
        G.sx.spiritSurgeTurns=3;
        log('🐺 Spirit Surge (Wolf): +'+ssAtk+' ATK for 3 turns!','s');
      }
      break;}

    // Wild Heart — Change Totem
    case 'change_totem':{
      const totems=['bear','eagle','wolf'];
      const curIdx=totems.indexOf(G._totemSpirit||'bear');
      G._totemSpirit=totems[(curIdx+1)%3];
      G._changeTotemUsed=true;
      log('🔄 Change Totem: '+G._totemSpirit.toUpperCase()+' spirit active!','s');
      break;}

    // Berserker — Intimidating Presence
    case 'intimidating_presence':{
      addConditionEnemy('Frightened',3);
      const aliveI=(G.currentEnemies||[]).filter(e=>!e.dead&&e.hp>0);
      aliveI.forEach(e=>{e._defDebuff=(e._defDebuff||0)+3;e._defDebuffTurns=Math.max(e._defDebuffTurns||0,3);});
      log('😤 Intimidating Presence: Frightened(3) + DEF -3!','s');
      break;}

    // Life Domain — Supreme Healing
    case 'supreme_healing':{
      const shHeal=roll(8)+roll(8)+roll(8)+md(G.stats.wis);
      heal(shHeal,'Supreme Healing 💖');
      log('💖 Supreme Healing: 3d8+WIS = '+shHeal+' HP!','s');
      break;}

    // War Domain — Guided Strike
    case 'guided_strike':{
      G._guidedStrikeBonus=true;
      log('🎯 Guided Strike: +10 ATK + 2d8 divine on next attack!','s');
      break;}

    // War Domain — War Priest Strike
    case 'war_priest_strike':{
      const {dmg:wpdmg,crit:wpcrit}=calcPlayerDmg();
      const wpDivine=roll(8)+Math.max(0,md(G.stats.str));
      dealToEnemy(wpdmg+wpDivine,wpcrit,'War Priest Strike ⚔️ (base+1d8+STR)');
      log('⚔️ War Priest Strike: '+wpdmg+'+'+wpDivine+' divine!','s');
      if(G.currentEnemy&&G.currentEnemy.hp<=0){onEnemyDied();return;}
      break;}

    // Stars Druid — Starry Form
    case 'starry_form':{
      G._starryFormActive=true; G._starryFormTurns=3;
      log('⭐ Starry Form: Archer stance! +1d8+WIS radiant each turn for 3 turns.','s');
      break;}

    // Stars Druid — Cosmic Omen
    case 'cosmic_omen':{
      G._cosmicOmenActive=true;
      log('🌟 Cosmic Omen: +1d6 to your next attack or heal roll!','s');
      break;}

    // ══════════════════════════════════════════════════════════
    //  NEW ALT BASE SKILLS
    // ══════════════════════════════════════════════════════════

    // Fighter — Rend
    case 'rend':{
      const {dmg:rdmg,crit:rcrit}=calcPlayerDmg();
      const rendDmg=rdmg+roll(8);
      dealToEnemy(rendDmg,rcrit,'Rend 🗡 (base+1d8)');
      addConditionEnemy('Bleeding',3);
      if(G.currentEnemy){G.currentEnemy._defDebuff=(G.currentEnemy._defDebuff||0)+3;G.currentEnemy._defDebuffTurns=2;}
      log('🗡 Rend: Bleeding(3) + enemy DEF -3 for 2 turns!','s');
      if(G.currentEnemy&&G.currentEnemy.hp<=0){onEnemyDied();return;}
      break;}

    // Fighter — Counter Stance (reaction)
    case 'counter_stance':{
      // Absorbs the incoming hit and reflects 50% back — must be triggered as reaction
      // The actual reflection is handled in doEnemyAttack; this sets the sx flag
      G.sx.counterStance=true;
      log('⚡ Counter Stance: absorbing and reflecting 50% back!','s');
      break;}

    // Wizard — Frost Nova
    case 'frost_nova':{
      let fnDmg=roll(6)+roll(6)+roll(6)+getSpellPower();
      if(G._overchannelActive){fnDmg=6+6+6+getSpellPower();G._overchannelActive=false;log('⚡ Overchannel: Frost Nova maximized!','s');}
      dealToAllEnemies(fnDmg,false,'Frost Nova ❄️');
      addConditionAllEnemies('Restrained',1);
      log('❄️ Frost Nova: '+fnDmg+' ice to all + Restrained(1)!','s');
      processAoeDeaths();
      break;}

    // Wizard — Arcane Familiar
    case 'arcane_familiar':{
      G._familiarActive=true; G._familiarTurns=3;
      log('🦉 Arcane Familiar summoned! Fires 1d6+half INT each turn for 3 turns.','s');
      break;}

    // Rogue — Cheap Shot
    case 'cheap_shot':{
      const {dmg:csdmg,crit:cscrit}=calcPlayerDmg();
      dealToEnemy(csdmg+roll(4),cscrit,'Cheap Shot 👊 (base+1d4)');
      if(Math.random()<0.5){addConditionEnemy('Stunned',1);log('👊 Cheap Shot: STUNNED!','s');}
      else{log('👊 Cheap Shot: hit!','s');}
      if(G.currentEnemy&&G.currentEnemy.hp<=0){onEnemyDied();return;}
      break;}

    // Rogue — Smoke Bomb
    case 'smoke_bomb':{
      if(G.currentEnemy){G.currentEnemy._blindedAtk=(G.currentEnemy._blindedAtk||0)+4;G.currentEnemy._blindedTurns=2;}
      G.sx.evasion=true;
      log('💨 Smoke Bomb: enemy Blinded -4 ATK for 2 turns + dodge next hit!','s');
      break;}

    // Paladin — Aura Strike
    case 'aura_strike':{
      const {dmg:asdmg,crit:ascrit}=calcPlayerDmg();
      const asDmgFinal=asdmg+roll(4);
      const asHeal=roll(4)+Math.max(0,md(G.stats.wis));
      dealToEnemy(asDmgFinal,ascrit,'Aura Strike 💛 (base+1d4)');
      heal(asHeal,'Aura Strike 💛 (1d4+WIS)');
      log('💛 Aura Strike: '+asDmgFinal+' radiant + healed '+asHeal+' HP!','s');
      if(G.currentEnemy&&G.currentEnemy.hp<=0){onEnemyDied();return;}
      break;}

    // Paladin — Consecrate
    case 'consecrate':{
      const _consHit=roll(4)+Math.max(0,md(G.stats.wis));
      const aliveC=(G.currentEnemies||[]).filter(e=>!e.dead&&e.hp>0);
      aliveC.forEach(e=>{e._consecrateTurns=3;e._consecrateHit=_consHit;});
      log('✝️ Consecrate: all enemies take '+_consHit+' radiant/turn (1d4+WIS) for 3 turns!','s');
      break;}

    // Ranger — Crippling Shot
    case 'crippling_shot':{
      const {dmg:crdmg,crit:crcrit}=calcPlayerDmg();
      dealToEnemy(crdmg+roll(6),crcrit,'Crippling Shot 🎯 (base+1d6)');
      addConditionEnemy('Restrained',2);
      if(G.currentEnemy&&G.currentEnemy.hp>0){G.currentEnemy._defDebuff=(G.currentEnemy._defDebuff||0)+4;G.currentEnemy._defDebuffTurns=Math.max(G.currentEnemy._defDebuffTurns||0,2);}
      log('🎯 Crippling Shot: Restrained(2) + DEF -4 for 2 turns!','s');
      if(G.currentEnemy&&G.currentEnemy.hp<=0){onEnemyDied();return;}
      break;}

    // Ranger — Camouflage
    case 'camouflage':{
      G.sx.evasion=true;
      G._camouflageActive=true;
      log('🌿 Camouflage: hidden — enemy misses next attack + your next attack +1d8!','s');
      break;}

    // Barbarian — Ground Slam
    case 'ground_slam':{
      let gsDmg=roll(8)+roll(8)+md(G.stats.str);
      if(G.raging)gsDmg+=2+Math.floor(G.level/4);
      dealToAllEnemies(gsDmg,false,'Ground Slam 💢 (2d8+STR)');
      const aliveGS=(G.currentEnemies||[]).filter(e=>!e.dead&&e.hp>0);
      aliveGS.forEach(e=>{if(Math.random()<0.5)addConditionEnemy('Restrained',1);G.currentEnemy=e;});
      log('💢 Ground Slam: '+gsDmg+' AoE + 50% Restrain each!','s');
      processAoeDeaths();
      break;}

    // Barbarian — Adrenaline Rush
    case 'adrenaline_rush':{
      if(G.skillCharges.rage!==undefined)G.skillCharges.rage=Math.min((G.skillCharges.rage||0)+2,3);
      log('💉 Adrenaline Rush: +2 Rage charges!','s');
      break;}

    // Cleric — Smite Evil
    case 'smite_evil':{
      let seDmg=roll(6)+roll(6)+roll(6)+getSpellPower();
      const isEvil=G.currentEnemy&&(G.currentEnemy.isUndead||G.currentEnemy.isFiend);
      if(isEvil)seDmg*=2;
      dealToEnemy(seDmg,false,'Smite Evil ⚡'+(isEvil?' [DOUBLED]':''));
      log('⚡ Smite Evil: '+seDmg+(isEvil?' (double vs undead/fiend!)':''),'s');
      if(G.currentEnemy&&G.currentEnemy.hp<=0){onEnemyDied();return;}
      break;}

    // Cleric — Bless
    case 'bless':{
      G._blessAttacks=2;
      log('✨ Bless: +3 ATK on next 2 attack rolls!','s');
      break;}

    // Druid — Thorns (reaction)
    case 'thorns':{
      // Applied when player is hit — sets the sx flag; damage reflected in doEnemyAttack
      G.sx.thornsReady=true;
      log('🌵 Thorns: ready to retaliate on next hit!','s');
      break;}

    // Druid — Nature's Grasp
    case 'natures_grasp':{
      // Target highest-ATK living enemy
      const living=(G.currentEnemies||[]).filter(e=>!e.dead&&e.hp>0);
      const target=living.reduce((best,e)=>(e.atk>best.atk?e:best),living[0]||G.currentEnemy);
      if(target){
        const saved=G.currentEnemy;
        G.currentEnemy=target;
        addConditionEnemy('Restrained',3);
        target._defDebuff=(target._defDebuff||0)+2;target._defDebuffTurns=Math.max(target._defDebuffTurns||0,3);
        G.currentEnemy=saved;
        log("🌿 Nature's Grasp: "+target.name+' Restrained(3) + DEF -2!','s');
      }
      break;}
  }
}
