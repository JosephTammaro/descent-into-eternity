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
    if(G.classId==='wizard'&&G._recycledMagic){
      if(restoreSpellSlot(3))log('🔁 Recycled Magic: LVL3 slot refunded!','s');
    }
    afterEnemyActs();return;
  }
  AUDIO.sfx.bossSpecial();
  if(typeof triggerBossSpecialFlash==='function') triggerBossSpecialFlash();
  if(typeof triggerScreenShake==='function') triggerScreenShake('boss');
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
