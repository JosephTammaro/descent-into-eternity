// ================================================================
// ui/ui-progression.js — Level Up, Subclass, Ultimate, Talent
// Descent into Eternity
// ================================================================

// ══════════════════════════════════════════════════════════
//  LEVEL UP
// ══════════════════════════════════════════════════════════
let pendingLevelUps = [];
let levelUpShowing = false;

function doLevelUp(){
  if(G.level >= 20) return; // Hard cap at 20
  setTimeout(checkAchievements,200);
  G.level++;
  G.xpNeeded=xpFor(G.level);
  G.profBonus=profFor(G.level);
  // Phase B: Track level for unlocks
  if(typeof updateUnlockStats==='function') updateUnlockStats('level_up');
  if(typeof checkUnlocks==='function') checkUnlocks();
  const cls=CLASSES[G.classId];
  const hpGain=cls.hpPerLvl+md(G.stats.con);
  // ATK gain: DEX classes use DEX, everyone else uses STR
  const atkMod = (['rogue','ranger'].includes(G.classId)) ? md(G.stats.dex) : md(G.stats.str);
  const atkGain=Math.max(1,Math.floor(atkMod/2));
  const hpBefore=G.hp;
  G.maxHp+=hpGain; G.hp=Math.min(G.maxHp,G.hp+hpGain);
  const actualHpGain=G.hp-hpBefore;
  G.atk+=atkGain;
  // Spell power growth for casters
  const isCaster = ['wizard','cleric','druid'].includes(G.classId);
  const isHybrid = G.classId==='paladin';
  if(isCaster){
    const castMod = G.classId==='wizard' ? md(G.stats.int) : md(G.stats.wis);
    const spGain = Math.max(1, Math.floor(castMod/2));
    G.spellPower = (G.spellPower||0) + spGain;
  } else if(isHybrid){
    const spGain = Math.max(1, Math.floor(md(G.stats.cha)/2));
    G.spellPower = (G.spellPower||0) + spGain;
  }
  // Increase max pool but don't refill mid-fight — that's rests only
  if(G.classId==='paladin'){
    const poolMax=Math.floor(G.level*5*(G.talents.includes('Lay on Hands+')?1.5:1));
    G.layOnHandsPool=Math.min(poolMax,G.layOnHandsPool+Math.floor(5*(G.talents.includes('Lay on Hands+')?1.5:1)));
  }

  // Spell slot expansion
  if(G.classId==='wizard'){
    if(G.level>=3&&!G.spellSlotsMax[2]){G.spellSlotsMax[2]=2;G.spellSlots[2]=2;}
    if(G.level>=5&&!G.spellSlotsMax[3]){
      G.spellSlotsMax[3]=1;G.spellSlots[3]=1;
      if(G.arcaneMemoryPending){G.spellSlotsMax[3]++;G.spellSlots[3]++;G.arcaneMemoryPending=false;log('Arcane Memory: +1 LVL3 slot applied','s');}
    }
  }
  // Improved crit (Champion)
  if(G.classId==='fighter'&&G.subclassId==='champion'&&G.level>=7)G.critRange=19;

  const flavors=[
    "The darkness trembles at your growing power.",
    "You feel the weight of your destiny lift slightly.",
    "Battle scars become wisdom. Wisdom becomes strength.",
    "Something ancient stirs as you grow stronger.",
    "The road ahead is long — but you are ready.",
    "Your enemies will soon have reason to fear you.",
  ];

  const luData = {
    level: G.level,
    hpGain: actualHpGain, atkGain,
    spGain: isCaster ? Math.max(1, Math.floor((G.classId==='wizard' ? md(G.stats.int) : md(G.stats.wis))/2)) : isHybrid ? Math.max(1, Math.floor(md(G.stats.cha)/2)) : 0,
    profBonus: G.profBonus,
    newMaxHp: G.maxHp,
    flavor: flavors[Math.floor(Math.random()*flavors.length)],
    talentUnlock: G.level%3===0 && G.level < 20,
    subclassUnlock: G.level===3&&!G.subclassUnlocked,
    ultimateUnlock: G.level===10,
    capstoneUnlock: G.level===20,
  };

  AUDIO.sfx.levelUp();

  // First-clear boss sequence: defer ALL screens to next dungeon run
  if(G._bossSequenceActive){
    if(!G._pendingLevelUpScreens) G._pendingLevelUpScreens=[];
    G._pendingLevelUpScreens.push(luData);
    // Fire callback immediately so grace→lore→salvage→town continues uninterrupted
    if(!levelUpShowing && G._afterLevelUpCallback){
      const cb=G._afterLevelUpCallback; G._afterLevelUpCallback=null; cb();
    }
    return;
  }

  // Normal flow
  pendingLevelUps.push(luData);
  if(!levelUpShowing) showNextLevelUp();
}

function showNextLevelUp(){
  // Check for any leftover XP that can trigger another level now that screens are done
  if(!pendingLevelUps.length&&G&&G.xp>=G.xpNeeded){G.xp-=G.xpNeeded;doLevelUp();return;}
  if(!pendingLevelUps.length){
    levelUpShowing=false;
    // Refresh skill bar so subclass/ultimate skills appear immediately
    if(typeof renderSkillButtons==='function') renderSkillButtons();
    if(G&&G._afterLevelUpCallback){const cb=G._afterLevelUpCallback;G._afterLevelUpCallback=null;cb();}
    return;
  }
  levelUpShowing=true;
  const data=pendingLevelUps.shift();

  if(enemyTurnTimeout){clearTimeout(enemyTurnTimeout);enemyTurnTimeout=null;}

  document.getElementById('lu-number').textContent=data.level;
  document.getElementById('lu-flavor').textContent=data.flavor;

  const isCasterClass = ['wizard','cleric','druid'].includes(G.classId);
  const isHybridClass = G.classId==='paladin';
  const gains=[
    {label:'Max HP',val:'+'+data.hpGain+' (→'+data.newMaxHp+')'},
  ];
  if(isCasterClass){
    gains.push({label:'Spell Power',val:'+'+data.spGain});
  } else if(isHybridClass){
    gains.push({label:'Attack',val:'+'+data.atkGain});
    if(data.spGain) gains.push({label:'Spell Power',val:'+'+data.spGain});
  } else {
    gains.push({label:'Attack',val:'+'+data.atkGain});
  }
  gains.push({label:'Prof. Bonus',val:'+'+data.profBonus});
  if(data.talentUnlock)gains.push({label:'Talent Point',val:'NEW!'});
  if(data.subclassUnlock)gains.push({label:'Subclass',val:'UNLOCKED!'});
  if(data.ultimateUnlock)gains.push({label:'ULTIMATE I',val:'UNLOCKED! ⚡'});
  if(data.capstoneUnlock)gains.push({label:'CAPSTONE',val:'UNLEASHED! 🔱'});

  document.getElementById('lu-gains').innerHTML=gains.map(g=>`
    <div class="lu-gain-row">
      <span class="lu-gain-label">${g.label}</span>
      <span class="lu-gain-val">${g.val}</span>
    </div>
  `).join('');

  // Show class skills panel
  const cls=CLASSES[G.classId];
  const luSkillsEl=document.getElementById('lu-skills');
  if(luSkillsEl&&cls){
    const typeLabel={action:'ACTION',bonus:'BONUS',reaction:'REACTION'};
    const typeColor={action:'var(--red2)',bonus:'#e67e22',reaction:'var(--blue2)'};
    luSkillsEl.innerHTML=`
      <div style="font-family:'Press Start 2P',monospace;font-size:6px;color:var(--dim);letter-spacing:2px;margin-bottom:8px;">YOUR ABILITIES</div>
      <div style="display:flex;flex-direction:column;gap:5px;text-align:left;max-height:160px;overflow-y:auto;">
        ${cls.skills.filter(sk=>(!sk.subclassOnly||(G.level>=3&&G.subclassId&&sk.subclassId===G.subclassId))&&(!sk.ultimateOnly||G.ultimateUnlocked)&&(!G.skillLoadout||G.skillLoadout.includes(sk.id)||sk.ultimateOnly)).map(sk=>`
          <div style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.3);border:1px solid var(--border);padding:5px 8px;border-radius:2px;">
            <span style="font-size:16px;flex-shrink:0;">${sk.icon}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-family:'Press Start 2P',monospace;font-size:6px;color:var(--parchment);">${sk.name}
                <span style="color:${typeColor[sk.type]||'var(--dim)'};margin-left:4px;">[${typeLabel[sk.type]||sk.type.toUpperCase()}]</span>
                ${sk.cost>0?`<span style="color:var(--dim);"> · ${sk.cost} ${cls.res.split(' ')[0].substring(0,4)}</span>`:''}
                ${sk.cd>0?`<span style="color:var(--dim);"> · CD:${sk.cd}</span>`:''}
              </div>
              <div style="font-size:10px;color:var(--dim);margin-top:2px;">${sk.desc}</div>
            </div>
          </div>`).join('')}
        ${G.subclassId&&typeof SUBCLASSES!=='undefined'&&SUBCLASSES[G.subclassId]?`
          <div style="font-family:'Press Start 2P',monospace;font-size:6px;color:var(--gold);margin-top:4px;padding:4px 8px;background:rgba(200,168,75,.08);border:1px solid var(--gold-dim);">
            ⭐ ${SUBCLASSES[G.subclassId].name} PERKS
          </div>
          ${(SUBCLASSES[G.subclassId].perks||[]).map(p=>`<div style="font-size:10px;color:#c8a84b;padding:3px 8px;background:rgba(200,168,75,.05);border-left:2px solid var(--gold-dim);">• ${p}</div>`).join('')}
        `:''}
      </div>`;
  }

  const numEl=document.getElementById('lu-number');
  numEl.style.animation='none';numEl.offsetHeight;
  numEl.style.animation='lu-pop .5s ease-out';

  const box=document.querySelector('#levelup-box');
  box.style.animation='none';box.offsetHeight;
  box.style.animation='levelup-in .4s ease-out, lu-shine 2s infinite .4s';

  // Use classList so cleanup in quitToTitle works reliably
  const ov=document.getElementById('levelup-overlay');
  ov.classList.add('open');
  ov._pendingData=data;
}

function closeLevelUp(){
  const ov=document.getElementById('levelup-overlay');
  const data=ov._pendingData;
  ov.classList.remove('open');
  ov._pendingData=null;
  levelUpShowing=false;

  if(data&&data.subclassUnlock){
    // After subclass, still show talent if also due (level 3 is %3===0)
    // But if in boss sequence, defer the talent — subclass itself still shows
    if(data.talentUnlock){
      if(G&&G._bossSequenceActive){
        G._pendingTalentCount=(G._pendingTalentCount||0)+1;
      } else {
        G._pendingTalentAfterSubclass=true;
      }
    }
    showSubclassScreen();
    return;
  }
  if(data&&data.ultimateUnlock){
    showUltimateScreen('ultimate1');
    return;
  }
  if(data&&data.capstoneUnlock){
    showUltimateScreen('capstone');
    return;
  }
  if(data&&data.talentUnlock){
    // If we're in the boss-clear sequence, defer until next dungeon entry
    if(G&&G._bossSequenceActive){
      G._pendingTalentCount=(G._pendingTalentCount||0)+1;
    } else {
      showTalentPick();
      return;
    }
  }

  showNextLevelUp();
}


// ══════════════════════════════════════════════════════════
//  SUBCLASS
// ══════════════════════════════════════════════════════════
function showSubclassScreen(){
  const cls=CLASSES[G.classId];
  const ids=cls.subclassIds||[];
  const singleBox=document.getElementById('scSingleBox');
  const choiceBox=document.getElementById('scChoiceBox');
  if(ids.length>=2 && typeof SUBCLASSES!=='undefined'){
    // Two-card choice layout
    if(singleBox) singleBox.style.display='none';
    if(choiceBox) choiceBox.style.display='block';
    const scA=SUBCLASSES[ids[0]];
    const scB=SUBCLASSES[ids[1]];
    if(scA){
      document.getElementById('scNameA').textContent=scA.name;
      document.getElementById('scDescA').textContent=scA.desc;
      document.getElementById('scPerksA').innerHTML=(scA.perks||[]).map(p=>`<div class="sc-perk">${p}</div>`).join('');
      document.getElementById('scBtnA').setAttribute('onclick',`confirmSubclass('${ids[0]}')`);
    }
    if(scB){
      document.getElementById('scNameB').textContent=scB.name;
      document.getElementById('scDescB').textContent=scB.desc;
      document.getElementById('scPerksB').innerHTML=(scB.perks||[]).map(p=>`<div class="sc-perk">${p}</div>`).join('');
      document.getElementById('scBtnB').setAttribute('onclick',`confirmSubclass('${ids[1]}')`);
    }
  } else {
    // Fallback: single-card (legacy path)
    if(singleBox) singleBox.style.display='';
    if(choiceBox) choiceBox.style.display='none';
    const scId=ids[0]||(typeof SUBCLASSES!=='undefined'&&Object.keys(SUBCLASSES).find(k=>SUBCLASSES[k].classId===G.classId));
    const sc=(scId&&typeof SUBCLASSES!=='undefined')?SUBCLASSES[scId]:{name:'',desc:'',perks:[]};
    document.getElementById('scEyebrow').textContent='LEVEL 3 — YOUR PATH IS CHOSEN';
    document.getElementById('scHeadline').innerHTML='A NEW POWER<br>AWAKENS';
    document.getElementById('scSubname').textContent=sc.name;
    document.getElementById('scDesc').textContent=sc.desc;
    document.getElementById('scPerks').innerHTML=(sc.perks||[]).map(p=>`<div class="sc-perk">${p}</div>`).join('');
    document.getElementById('scConfirmBtn').textContent='EMBRACE YOUR DESTINY';
    document.getElementById('scConfirmBtn').setAttribute('onclick',scId?`confirmSubclass('${scId}')`:'confirmSubclass()');
  }
  showScreen('subclass');
}
function confirmSubclass(subclassId){
  // If no subclassId (legacy or fallback), use first subclass for the class
  if(!subclassId){
    const ids=CLASSES[G.classId].subclassIds||[];
    subclassId=ids[0]||(Object.keys(SUBCLASSES||{}).find(k=>SUBCLASSES[k].classId===G.classId));
  }
  G.subclassId=subclassId;
  G.subclassUnlocked=true;
  const sc=typeof SUBCLASSES!=='undefined'?SUBCLASSES[subclassId]:null;
  if(sc){
    if(typeof sc.apply==='function') sc.apply(G);
    log('⭐ Subclass: '+sc.name+' unlocked!','s');
  } else {
    log('⭐ Subclass unlocked!','s');
  }
  // Tag new subclass skills so the skill bar can highlight them
  const newIds=CLASSES[G.classId].skills.filter(s=>s.subclassOnly&&(!s.subclassId||s.subclassId===subclassId)).map(s=>s.id);
  // Add subclass skills to the loadout so the loadout filter doesn't hide them
  if(G.skillLoadout && newIds.length){
    newIds.forEach(id=>{ if(!G.skillLoadout.includes(id)) G.skillLoadout.push(id); });
  }
  G._newSkills=(G._newSkills||[]).concat(newIds);
  showScreen('game');
  if(G._pendingTalentAfterSubclass){
    G._pendingTalentAfterSubclass=false;
    showTalentPick();
    return;
  }
  showNextLevelUp();
}

// ══════════════════════════════════════════════════════════
//  ULTIMATE SCREEN
// ══════════════════════════════════════════════════════════
function showUltimateScreen(type){
  const cls=CLASSES[G.classId];
  const ult=ULTIMATES[G.classId];
  const isCapstone = type==='capstone';
  const data = isCapstone ? ult.capstone : ult.ultimate1;

  // Show single-card box, hide two-card choice box
  const _sb=document.getElementById('scSingleBox');
  const _cb=document.getElementById('scChoiceBox');
  if(_sb) _sb.style.display='';
  if(_cb) _cb.style.display='none';
  document.getElementById('scEyebrow').textContent = isCapstone ? 'LEVEL 20 — THE PINNACLE' : 'LEVEL 10 — POWER AWAKENED';
  document.getElementById('scHeadline').innerHTML = isCapstone ? 'CAPSTONE<br>UNLEASHED' : 'ULTIMATE<br>POWER';
  document.getElementById('scSubname').textContent = data.name + ' ' + data.icon;
  document.getElementById('scDesc').textContent = data.desc;
  document.getElementById('scPerks').innerHTML = `<div class="sc-perk">${isCapstone?'⬆ PERMANENT PASSIVE — your power transcends mortal limits':'⚡ ONCE PER REST — unleash when the moment demands it'}</div>`;
  document.getElementById('scConfirmBtn').textContent = isCapstone ? 'ASCEND ▶' : 'CLAIM YOUR POWER ▶';
  document.getElementById('scConfirmBtn').setAttribute('onclick', `confirmUltimate('${type}')`);
  showScreen('subclass');
}

function confirmUltimate(type){
  const isCapstone = type==='capstone';
  const cls=CLASSES[G.classId];
  const ult=ULTIMATES[G.classId];
  const data = isCapstone ? ult.capstone : ult.ultimate1;

  if(isCapstone){
    G.capstoneUnlocked=true;
    applyCapstone();
    log('🔱 CAPSTONE: '+data.name+' — '+data.desc,'s');
    const newIds=cls.skills.filter(s=>s.capstoneOnly).map(s=>s.id);
    G._newSkills=(G._newSkills||[]).concat(newIds);
  } else {
    G.ultimateUnlocked=true;
    G._ultimateUsed=false;
    log('⚡ ULTIMATE: '+data.name+' unlocked!','s');
    const newIds=cls.skills.filter(s=>s.ultimateOnly).map(s=>s.id);
    G._newSkills=(G._newSkills||[]).concat(newIds);
  }
  showScreen('game');
  renderAll();
  showNextLevelUp();
}

function applyCapstone(){
  const c=G.classId;
  if(c==='fighter'){G._capstone=true;} // Advantage on attacks handled in calcPlayerDmg
  if(c==='wizard'){G._arcaneTranscendence=true;} // Free spells, handled in slot cost checks
  if(c==='rogue'){G._deathsShadow=true;G._hairTrigger=true;}
  if(c==='paladin'){G._avatarOfLight=true;}
  if(c==='ranger'){G._oneWithHunt=true;G.hunterMarked=true;}
  if(c==='barbarian'){G._eternalRage=true;G.rageTurns=999;}
  if(c==='cleric'){G._vesselDivine=true;}
  if(c==='druid'){G._theGreen=true;}
  log('🔱 Capstone passive applied permanently!','s');
}

// ══════════════════════════════════════════════════════════
//  TALENT PICK — FULL POOL SHUFFLE
// ══════════════════════════════════════════════════════════
function showTalentPick(){
  // Rare Event: Skip talent pick (Doppelganger merge / Soul Merchant)
  if(G._rareEventFlags.skipNextTalent&&G._rareEventFlags.skipNextTalent>0){
    G._rareEventFlags.skipNextTalent--;
    if(G._rareEventFlags.skipNextTalent<=0) delete G._rareEventFlags.skipNextTalent;
    log('⚠ Talent pick forfeited...','c');
    showNextLevelUp();
    return;
  }
  const pool = TALENT_POOLS[G.classId] || [];
  // Filter out talents already picked (but NOT ones merely offered before)
  const available = pool.filter(t => !G.talents.includes(t.name));
  if(!available.length){
    log('All class talents mastered!','s');
    showNextLevelUp();
    return;
  }
  // Shuffle full available pool and pick 3 random choices each time
  const shuffled = available.slice().sort(() => Math.random() - 0.5);
  const choices = shuffled.slice(0, 3);

  document.getElementById('tbSub').innerHTML='Level '+G.level+' — choose your path:';
  document.getElementById('talentCards').innerHTML = choices.map(t => `
    <div class="talent-card" onclick="pickTalent('${t.name}')">
      <span class="tc-icon">${t.icon}</span>
      <span class="tc-name">${t.name}</span>
      <span class="tc-desc">${t.desc}</span>
    </div>
  `).join('');
  document.getElementById('talent-overlay').classList.add('open');
}

function pickTalent(name){
  const pool = TALENT_POOLS[G.classId] || [];
  const entry = pool.find(t => t.name === name);
  G.talents.push(name);
  log('🌟 Talent: ' + name, 's');
  // Apply the talent's effect
  if(entry && entry.apply) entry.apply(G);
  // Check for keystone synergy unlocks
  checkKeystoneUnlocks(G);
  document.getElementById('talent-overlay').classList.remove('open');
  renderAll();
  showNextLevelUp();
}

function checkKeystoneUnlocks(G){
  if(typeof TALENT_ARCHETYPES==='undefined') return;
  const archetypes=TALENT_ARCHETYPES[G.classId];
  if(!archetypes) return;
  for(const [archName,arch] of Object.entries(archetypes)){
    const picked=arch.talents.filter(t=>G.talents.includes(t)).length;
    const keystoneId='_keystone_'+G.classId+'_'+archName.replace(/\s/g,'_');
    if(picked>=3&&!G[keystoneId]){
      G[keystoneId]=true;
      if(typeof arch.keystone.apply==='function') arch.keystone.apply(G);
      log('🔮 Synergy: '+arch.keystone.icon+' '+arch.keystone.name+' — '+arch.keystone.desc,'s');
    }
  }
}
