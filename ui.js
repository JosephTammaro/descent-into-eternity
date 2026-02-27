// ================================================================
// ui.js — All UI Systems
// Level up, campfire, shop, map, character sheet, 
// audio controls, utilities, bug log
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
  const cls=CLASSES[G.classId];
  const hpGain=cls.hpPerLvl+md(G.stats.con);
  const atkGain=Math.max(1,1+Math.floor(md(G.stats.str)/2));
  const hpBefore=G.hp;
  G.maxHp+=hpGain; G.hp=Math.min(G.maxHp,G.hp+hpGain);
  const actualHpGain=G.hp-hpBefore;
  G.atk+=atkGain;
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
  if(G.classId==='fighter'&&G.subclassUnlocked&&G.level>=7)G.critRange=19;

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

  const gains=[
    {label:'Max HP',val:'+'+data.hpGain+' (→'+data.newMaxHp+')'},
    {label:'Attack',val:'+'+data.atkGain},
    {label:'Prof. Bonus',val:'+'+data.profBonus},
  ];
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
        ${cls.skills.filter(sk=>(!sk.subclassOnly||G.subclassUnlocked)&&(!sk.ultimateOnly||G.ultimateUnlocked)).map(sk=>`
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
        ${G.subclassUnlocked?`
          <div style="font-family:'Press Start 2P',monospace;font-size:6px;color:var(--gold);margin-top:4px;padding:4px 8px;background:rgba(200,168,75,.08);border:1px solid var(--gold-dim);">
            ⭐ ${cls.subclass.name} PERKS
          </div>
          ${cls.subclass.perks.map(p=>`<div style="font-size:10px;color:#c8a84b;padding:3px 8px;background:rgba(200,168,75,.05);border-left:2px solid var(--gold-dim);">• ${p}</div>`).join('')}
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
  const sc=cls.subclass;
  document.getElementById('scEyebrow').textContent='LEVEL 3 — YOUR PATH IS CHOSEN';
  document.getElementById('scHeadline').innerHTML='A NEW POWER<br>AWAKENS';
  document.getElementById('scSubname').textContent=sc.name;
  document.getElementById('scDesc').textContent=sc.desc;
  document.getElementById('scPerks').innerHTML=sc.perks.map(p=>`<div class="sc-perk">${p}</div>`).join('');
  document.getElementById('scConfirmBtn').textContent='EMBRACE YOUR DESTINY';
  document.getElementById('scConfirmBtn').setAttribute('onclick','confirmSubclass()');
  showScreen('subclass');
}
function confirmSubclass(){
  G.subclassUnlocked=true;
  log('⭐ Subclass: '+CLASSES[G.classId].subclass.name+' unlocked!','s');
  // Tag new subclass skills so the skill bar can highlight them
  const newIds=CLASSES[G.classId].skills.filter(s=>s.subclassOnly).map(s=>s.id);
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
  document.getElementById('talent-overlay').classList.remove('open');
  renderAll();
  showNextLevelUp();
}

// ══════════════════════════════════════════════════════════
//  CONDITIONS
// ══════════════════════════════════════════════════════════
function addCondition(cond,turns=2){
  if(!G.conditions.includes(cond)){
    G.conditions.push(cond);
    if(!G.conditionTurns)G.conditionTurns={};
    G.conditionTurns[cond]=turns;
  }
}
function removeCondition(cond){
  G.conditions=G.conditions.filter(c=>c!==cond);
  if(G.conditionTurns)delete G.conditionTurns[cond];
}
function addConditionEnemy(name,turns){if(!G.currentEnemy)return;if(!G.currentEnemy.conditions)G.currentEnemy.conditions=[];if(G.currentEnemy.conditions.find(c=>c.name===name))return;G.currentEnemy.conditions.push({name,turns});}
// AoE variant — applies condition to a specific enemy object
function addConditionToEnemy(e,name,turns){if(!e)return;if(!e.conditions)e.conditions=[];if(e.conditions.find(c=>c.name===name))return;e.conditions.push({name,turns});}

// ══════════════════════════════════════════════════════════
//  INVENTORY / ITEMS
// ══════════════════════════════════════════════════════════
function addItem(item){
  if(item.type==='consumable'||item.type==='material'){
    const ex=G.inventory.find(i=>i&&i.id===item.id);
    if(ex){ex.qty=(ex.qty||1)+(item.qty||1);renderInventory();return true;}
  }
  const idx=G.inventory.findIndex(i=>i===null);
  if(idx===-1)return false;
  if(!item.qty)item.qty=1;
  G.inventory[idx]=item;
  renderInventory();
  return true;
}

function removeItems(id,count){
  for(const item of G.inventory){
    if(item&&item.id===id){item.qty=(item.qty||1)-count;if(item.qty<=0)G.inventory[G.inventory.indexOf(item)]=null;return;}
  }
}

function countMaterial(id){return G.inventory.filter(i=>i&&i.id===id).reduce((a,i)=>a+(i.qty||1),0);}

function renderInventory(){
  if(!G)return;
  const el=document.getElementById('invGrid');
  el.innerHTML=G.inventory.map((item,i)=>{
    if(!item)return`<div class="inv-slot empty" data-idx="${i}"
      ondragover="mainInvDragOver(event,${i})" ondrop="mainInvDrop(event,${i})" ondragleave="mainInvDragLeave(event)"
      onclick="openItemModal(${i})">·</div>`;
    return`<div class="inv-slot r-${item.rarity}" data-idx="${i}" draggable="true"
      onclick="mainInvClick(event,${i})"
      ondragstart="mainInvDragStart(event,${i})"
      ondragend="mainInvDragEnd(event)"
      ondragover="mainInvDragOver(event,${i})"
      ondrop="mainInvDrop(event,${i})"
      ondragleave="mainInvDragLeave(event)"
      onmouseenter="showInvTooltip(event,${i})" onmouseleave="hideInvTooltip()"
    >${item.icon}${(item.qty||1)>1?`<div class="inv-qty">${item.qty}</div>`:''}</div>`;
  }).join('');
}

let _mainDragIdx = null;
let _mainDragging = false;

function mainInvClick(e, idx){
  // Only open modal if this was a click, not the end of a drag
  if(!_mainDragging) openItemModal(idx);
}

function mainInvDragStart(e, idx){
  _mainDragIdx = idx;
  _mainDragging = true;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(()=>{
    const el = document.querySelector(`.inv-slot[data-idx="${idx}"]`);
    if(el) el.style.opacity = '0.3';
  }, 0);
}

function mainInvDragEnd(e){
  document.querySelectorAll('.inv-slot').forEach(el=>{
    el.style.opacity = '';
    el.classList.remove('drag-over');
  });
  setTimeout(()=>{ _mainDragging = false; }, 100);
  _mainDragIdx = null;
}

function mainInvDragOver(e, idx){
  e.preventDefault();
  if(_mainDragIdx === null || _mainDragIdx === idx) return;
  document.querySelectorAll('.inv-slot').forEach(el=>el.classList.remove('drag-over'));
  const el = document.querySelector(`.inv-slot[data-idx="${idx}"]`);
  if(el) el.classList.add('drag-over');
}

function mainInvDragLeave(e){
  e.currentTarget.classList.remove('drag-over');
}

function mainInvDrop(e, toIdx){
  e.preventDefault();
  const fromIdx = _mainDragIdx;
  if(fromIdx === null || fromIdx === toIdx) return;
  const tmp = G.inventory[fromIdx];
  G.inventory[fromIdx] = G.inventory[toIdx];
  G.inventory[toIdx] = tmp;
  renderInventory();
}

function renderEquipSlots(){
  if(!G)return;
  const slots=[{k:'weapon',l:'Weapon'},{k:'armor',l:'Armor'},{k:'offhand',l:'Off-Hand'},{k:'ring',l:'Ring'},{k:'helmet',l:'Helmet'},{k:'gloves',l:'Gloves'},{k:'boots',l:'Boots'},{k:'amulet',l:'Amulet'}];
  const slotsHTML=slots.map(s=>`
    <div class="eq-slot ${G.equipped[s.k]?'filled r-'+G.equipped[s.k].rarity:''} ${G.currentEnemy&&G.roundNum>0?'combat-locked':''}"
      onclick="unequip('${s.k}')"
      ${G.equipped[s.k]?`onmouseenter="showEqTooltip(event,'${s.k}')" onmouseleave="hideInvTooltip()"`:''}
      title="${G.currentEnemy&&G.roundNum>0?'Cannot change gear mid-combat':''}">
      <div class="eq-icon">${G.equipped[s.k]?G.equipped[s.k].icon:'+'}</div>
      <div class="eq-lbl">${G.equipped[s.k]?G.equipped[s.k].name.substring(0,8):s.l}</div>
    </div>
  `).join('');
  // Build active set bonus display
  let setBonusHTML='';
  for(const[setId,setDef]of Object.entries(SET_BONUSES)){
    const count=countSetPieces(setId);
    if(count>=2){
      const active3=count>=3&&setDef.bonuses[3];
      const b=active3?setDef.bonuses[3]:setDef.bonuses[2];
      const isClassSet=!!setDef.forClass;
      const borderColor=isClassSet&&active3?'#cc88ff':isClassSet?'#9b54bd':'#c8a84b';
      const textColor=isClassSet&&active3?'#cc88ff':isClassSet?'#bb77dd':'#c8a84b';
      const prefix=isClassSet&&active3?'✦ CLASS SET':'✦';
      setBonusHTML+=`<div style="font-family:'Press Start 2P',monospace;font-size:5px;padding:4px 6px;margin-top:3px;background:#0a0800;border:1px solid ${borderColor};color:${textColor};">${prefix} ${setDef.name} (${count}/3) — ${b.label}</div>`;
    }
  }
  document.getElementById('equipSlots').innerHTML=slotsHTML+(setBonusHTML?`<div style="grid-column:1/-1;">${setBonusHTML}</div>`:'');
}

function renderUpgrades(){ /* removed — upgrades panel replaced by status panel */ }

function openItemModal(idx){
  selectedItemIdx=idx;
  const item=G.inventory[idx];
  if(!item)return;
  const rc={common:'#4a4038',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#8b44ad',legendary:'var(--gold)'}[item.rarity]||'#888';
  document.getElementById('ibTitle').textContent=item.name;
  document.getElementById('ibTitle').style.color=rc;
  document.getElementById('ibBody').innerHTML=`
    <div class="ib-icon">${item.icon}</div>
    <div class="ib-stats">
      <div class="ib-name" style="color:${rc}">${item.name}</div>
      <div class="ib-rar" style="color:${rc}">${item.rarity.toUpperCase()} ${item.type}</div>
      ${Object.entries(item.stats).filter(([k,v])=>v).map(([k,v])=>`<div class="ib-stat">${v>0?'+':''}${v} ${k.toUpperCase()}</div>`).join('')}
      <div style="font-size:13px;color:var(--dim);margin-top:4px">Sell: 🪙${Math.floor(item.value*.5*(item.qty||1))}</div>
    </div>`;
  const btns=[];
  if(item.slot)btns.push(`<button class="ib-btn ib-equip" ${G.currentEnemy&&G.roundNum>0?'disabled title="Cannot equip mid-combat"':''} onclick="equipItem()">EQUIP</button>`);
  if(item.type==='consumable')btns.push(`<button class="ib-btn ib-use" onclick="useConsumable()">USE</button>`);
  btns.push(`<button class="ib-btn ib-sell" onclick="sellItem()">SELL</button>`);
  btns.push(`<button class="ib-btn ib-close" onclick="closeItemModal()">CLOSE</button>`);
  document.getElementById('ibBtns').innerHTML=btns.join('');
  document.getElementById('item-overlay').classList.add('open');
}

function closeItemModal(){document.getElementById('item-overlay').classList.remove('open');selectedItemIdx=null;}

// ── INVENTORY HOVER TOOLTIP ──
let _ttTimeout=null;
function showInvTooltip(e,idx){
  if(!G)return;
  _showItemTooltip(e, G.inventory[idx]);
}
function hideInvTooltip(){
  const tt=document.getElementById('invTooltip');
  if(tt)tt.classList.remove('show');
}

// Shared helper: build and position tooltip from an item object
function _showItemTooltip(e, item){
  const tt=document.getElementById('invTooltip');
  if(!tt||!item)return;
  const rc={common:'#6a5838',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#9b54bd',legendary:'var(--gold)'}[item.rarity]||'#888';
  const rarLabel={common:'Common',uncommon:'Uncommon',rare:'Rare',epic:'Epic ✦',legendary:'★ Legendary'}[item.rarity]||item.rarity;
  const statsHTML=Object.entries(item.stats).filter(([k,v])=>v).map(([k,v])=>`<div class="inv-tt-stat">${v>0?'+':''}${v} ${k.toUpperCase()}</div>`).join('');
  const slotLabel=item.slot?`<div class="inv-tt-sell" style="color:var(--dim);border:none;padding:0;margin-bottom:3px;">${item.slot.toUpperCase()} slot</div>`:'';
  tt.innerHTML=`
    <span class="inv-tt-name" style="color:${rc}">${item.name}</span>
    <div class="inv-tt-rar" style="color:${rc}">${rarLabel} ${item.type}</div>
    ${slotLabel}
    ${statsHTML||'<div class="inv-tt-stat" style="color:var(--dim)">No stat bonuses</div>'}
    <div class="inv-tt-sell">Sell: 🪙${Math.floor((item.value||0)*.5*(item.qty||1))}</div>
  `;
  const x=Math.min(e.clientX+14, window.innerWidth-240);
  const y=Math.min(e.clientY-10, window.innerHeight-220);
  tt.style.left=x+'px';
  tt.style.top=Math.max(8,y)+'px';
  tt.classList.add('show');
}

// Hover over equipped slot in the main game panel
function showEqTooltip(e, slot){
  if(!G)return;
  _showItemTooltip(e, G.equipped[slot]);
}

// Hover over equipped slot in the campfire shop bar
function showShopEqTooltip(e, slot){
  if(!G)return;
  _showItemTooltip(e, G.equipped[slot]);
}

// ── COMBAT EQUIP TOAST ──
let _toastTimer=null;
function showCombatEquipToast(){
  const t=document.getElementById('combatEquipToast');
  if(!t)return;
  if(_toastTimer)clearTimeout(_toastTimer);
  t.classList.add('show');
  _toastTimer=setTimeout(()=>{t.classList.remove('show');},1800);
}

function equipItem(){
  if(G.currentEnemy&&G.roundNum>0){showCombatEquipToast();closeItemModal();return;}
  const item=G.inventory[selectedItemIdx];
  if(!item||!item.slot)return;
  if(G.equipped[item.slot]){removeItemStats(G.equipped[item.slot]);addItem({...G.equipped[item.slot]});}
  G.equipped[item.slot]=item;
  applyItemStats(item);
  G.inventory[selectedItemIdx]=null;
  AUDIO.sfx.equip();
  closeItemModal(); renderAll();
}

function unequip(slot){
  if(!G.equipped[slot])return;
  if(G.currentEnemy&&G.roundNum>0){showCombatEquipToast();return;}
  const item=G.equipped[slot];
  if(addItem({...item})){removeItemStats(item);G.equipped[slot]=null;renderAll();}
}

function useConsumable(){
  if(!G.isPlayerTurn&&G.currentEnemy){log('Cannot use items during enemy turn!','s');closeItemModal();return;}
  // Using a consumable in combat costs your bonus action (same as quick-use button)
  if(G.currentEnemy&&G.bonusUsed){log('Bonus action already used this turn!','s');closeItemModal();return;}
  const item=G.inventory[selectedItemIdx];
  if(!item)return;
  if(item.stats.heal){heal(item.stats.heal,item.name+' 🧪');}
  if(item.id==='antidote'){removeCondition('Poisoned');log('Poison cleared!','s');}
  item.qty=(item.qty||1)-1;
  if(item.qty<=0)G.inventory[selectedItemIdx]=null;
  if(G.currentEnemy)G.bonusUsed=true; // costs bonus action in combat only
  closeItemModal(); renderAll();
}

function sellItem(){
  const item=G.inventory[selectedItemIdx];
  if(!item)return;
  G.gold+=Math.floor(item.value*.5*(item.qty||1));
  G.inventory[selectedItemIdx]=null;
  log('Sold '+item.name,'l'); closeItemModal(); renderAll();
}

function _applyStats(stats,sign){
  if(stats.atk)G.atk+=stats.atk*sign;
  if(stats.def)G.def+=stats.def*sign;
  if(stats.hp){G.maxHp+=stats.hp*sign;if(sign>0)G.hp=Math.min(G.maxHp,G.hp+stats.hp);else G.hp=Math.min(G.hp,G.maxHp);}
  if(stats.magAtk){G.magBonus=Math.max(0,(G.magBonus||0)+stats.magAtk*sign);}
  if(stats.crit)G.critBonus=Math.max(0,(G.critBonus||0)+stats.crit*sign);
}
function applyItemStats(item){_applyStats(item.stats,1);updateSetBonuses();}
function removeItemStats(item){_applyStats(item.stats,-1);updateSetBonuses();}

// ── SET BONUS ENGINE ─────────────────────────────────────────
function countSetPieces(setId){
  return Object.values(G.equipped).filter(Boolean).filter(i=>i.set===setId).length;
}
function updateSetBonuses(){
  if(!G)return;
  if(!G.activeSets)G.activeSets={};
  // Reset class set bonus flag before recalculating
  G._classSetBonus=null;
  for(const[setId,setDef]of Object.entries(SET_BONUSES)){
    const prev=G.activeSets[setId]||0;
    const now=countSetPieces(setId);
    // Remove old bonuses
    for(let t=2;t<=3;t++){
      if(prev>=t&&now<t&&setDef.bonuses[t]){
        _applyStats(setDef.bonuses[t].stats,-1);
        if(setDef.bonuses[t].skillBonus&&G._classSetBonus===setDef.bonuses[t].skillBonus){
          G._classSetBonus=null;
        }
      }
    }
    // Apply new bonuses
    for(let t=2;t<=3;t++){
      if(now>=t&&prev<t&&setDef.bonuses[t]){
        _applyStats(setDef.bonuses[t].stats,1);
        if(setDef.bonuses[t].skillBonus){
          log('✦ CLASS SET BONUS: '+setDef.bonuses[t].label,'l');
        } else {
          log('✨ SET BONUS: '+setDef.bonuses[t].label,'l');
        }
      }
    }
    // Always keep _classSetBonus in sync with current state
    for(let t=3;t>=2;t--){
      if(now>=t&&setDef.bonuses[t]&&setDef.bonuses[t].skillBonus){
        G._classSetBonus=setDef.bonuses[t].skillBonus;
      }
    }
    G.activeSets[setId]=now;
  }
}

function dropLoot(enemy){
  // ── CLASS SET ITEM DROP (zone 3+, ~8% chance) ────────────
  if(G.zoneIdx>=2&&Math.random()<0.08){
    const classSetItems=ITEMS.filter(i=>i.forClass===G.classId&&i.set);
    // Don't drop duplicates already in inventory or equipped
    const owned=new Set([
      ...Object.values(G.equipped||{}).filter(Boolean).map(i=>i.id),
      ...(G.inventory||[]).filter(Boolean).map(i=>i.id)
    ]);
    const available=classSetItems.filter(i=>!owned.has(i.id));
    if(available.length>0){
      const item={...available[Math.floor(Math.random()*available.length)]};
      if(addItem(item)){
        G.totalItems++;AUDIO.sfx.loot();
        log('✦ CLASS SET ITEM: '+item.icon+' '+item.name+' ['+item.set.toUpperCase()+']','l');
        log('⚠ Equip all 3 '+SET_BONUSES[item.set].name+' pieces for the set bonus!','s');
        return;
      }
    }
  }
  // ── NORMAL LOOT ───────────────────────────────────────────
  const pool=ITEMS.filter(i=>{
    if(i.type==='material'||i.type==='consumable')return false;
    if(i.forClass)return false; // class set items only drop via the block above
    if(G.level<5&&(i.rarity==='rare'||i.rarity==='epic'))return false;
    return true;
  });
  const rng=Math.random();
  let filtered=rng<.55?pool.filter(i=>i.rarity==='common'):rng<.82?pool.filter(i=>i.rarity==='uncommon'):pool.filter(i=>i.rarity==='rare');
  if(!filtered.length)filtered=pool.filter(i=>i.rarity==='common');
  if(!filtered.length)return;
  const item={...filtered[Math.floor(Math.random()*filtered.length)]};
  if(addItem(item)){G.totalItems++;AUDIO.sfx.loot();log('🎁 Found: '+item.icon+' '+item.name+' ['+item.rarity.toUpperCase()+']','l');}
}

function buyUpgrade(id){
  const u=G.upgrades.find(u=>u.id===id);
  if(!u||u.bought||G.gold<u.cost)return;
  G.gold-=u.cost; u.bought=true;
  if(u.eff==='atk')G.atk+=u.val;
  if(u.eff==='def')G.def+=u.val;
  if(u.eff==='maxHp'){G.maxHp+=u.val;G.hp+=u.val;}
  if(u.eff==='xpMult')G.xpMult+=u.val;
  if(u.eff==='crit')G.critBonus=(G.critBonus||0)+u.val;
  log('📈 Upgrade: '+u.name,'s');
  renderAll();
}

// ══════════════════════════════════════════════════════════
//  CAMPFIRE — TABBED IN-GAME UI
// ══════════════════════════════════════════════════════════
function showCampfire(){
  stopPlayerAnim();
  checkObjectiveProgress('campfire_used',true);
  if(enemyTurnTimeout){clearTimeout(enemyTurnTimeout);enemyTurnTimeout=null;}
  AUDIO.playBGM('campfire');
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
  // Update continue button label based on state
  const contBtn=document.querySelector('.cf-continue-wrap button');
  if(contBtn){
    contBtn.textContent=bossCleared?'CONTINUE JOURNEY ▶':'BACK TO BATTLE ▶';
  }
  cfRenderTab('rest');
  showScreen('campfire');
  if(typeof renderLives==='function') renderLives();
  // Start pixel campfire animation
  startCampfireAnim();
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

function startPlayerAnim(){
  // Delegate to Anim system — keeps all existing callers working
  if(window.Anim) window.Anim.startPlayerIdle();
}

function stopPlayerAnim(){
  // Delegate to Anim system
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
    <p style="font-size:17px;color:var(--parchment);margin-bottom:16px;">Take a Long Rest to fully restore your HP, MP, and spell slots.</p>
    <div class="rest-preview">
      <div class="rest-item">❤️ HP<span>Restore to ${G.maxHp}</span></div>
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
  // Check rest limit — only one long rest per campfire visit
  const restLimit = null;
  if(restLimit !== null && (G.restsThisZone||0) >= restLimit){
    const el=document.getElementById('restResult');
    if(el){el.textContent='✗ No rests remaining this zone!';el.style.color='var(--red2)';el.style.display='block';}
    return;
  }
  G._longRestUsed=true;
  G.hp=G.maxHp; // Always fully restore HP on long rest
  G.conditions=[];G.conditionTurns={};
  // Restore all skill charges on long rest
  G.skillCharges={};
  CLASSES[G.classId].skills.forEach(sk=>{ if(sk.charges) G.skillCharges[sk.id]=sk.charges; });G.sx={};G.raging=false;G.hunterMarked=false;G.concentrating=null;
  G.wildShapeHp=0;G.wildShapeActive=false;G.spiritualWeaponActive=false;G.spiritualWeaponTurns=0;
  G._undyingFuryUsed=false;G._divineInterventionUsed=false;G._ultimateUsed=false;
  // Class campfire actions reset on rest (so they show as available next campfire)
  G._inscribeScroll=false;G._inscribeScrollId=null;G._inscribeScrollSpell=null;G._inscribeScrollMenu=false;
  G._caseTarget=false;G._warReadiness=false;G._oathRenewal=false;
  G._bloodOffering=false;G._dawnBlessing=false;G._wildAttunement=false;G._wildAttunementActive=false;
  G.skillCooldowns={};
  // Restore druid sprite on zone travel
  if(G.classId==='druid'){const p=document.getElementById('playerSprite');if(p&&CLASS_SPRITES.druid)renderSprite(CLASS_SPRITES.druid,14,p);if(p)p.style.filter='';startPlayerAnim();}
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
  if(el){el.textContent='✓ Fully rested! HP, resources and conditions restored.';el.style.color='var(--green2)';el.style.display='block';}
  // Re-render rest tab to update counter
  setTimeout(()=>cfRenderTab('rest'), 600);
}

function cfDoShortRest(){
  const heal=Math.floor(G.maxHp*0.5);
  G.hp=Math.min(G.maxHp,G.hp+heal);
  const el=document.getElementById('restResult');
  if(el){el.textContent='💤 Short rest: +'+heal+' HP restored.';el.style.color='var(--green2)';el.style.display='block';}
  renderAll();
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


// ══════════════════════════════════════════════════════════
//  ACHIEVEMENT / CODEX SYSTEM
// ══════════════════════════════════════════════════════════
const ACHIEVEMENTS = [
  // ── Combat ─────────────────────────────────────────────
  {id:'first_blood',   icon:'⚔️', title:'First Blood',      desc:'Win your first battle.',                           check:g=>g.totalKills>=1},
  {id:'kill10',        icon:'💀', title:'Slayer',            desc:'Defeat 10 enemies.',                               check:g=>g.totalKills>=10},
  {id:'kill50',        icon:'🗡️', title:'Veteran',           desc:'Defeat 50 enemies.',                               check:g=>g.totalKills>=50},
  {id:'kill200',       icon:'☠️', title:'Butcher',           desc:'Defeat 200 enemies.',                              check:g=>g.totalKills>=200},
  {id:'first_crit',    icon:'💥', title:'Critical Hit!',    desc:'Land your first critical strike.',                  check:g=>(g.totalCrits||0)>=1},
  {id:'crit25',        icon:'🎯', title:'Precision',         desc:'Land 25 critical strikes.',                        check:g=>(g.totalCrits||0)>=25},
  // ── Progression ────────────────────────────────────────
  {id:'zone2',         icon:'🗺️', title:'Going Deeper',     desc:'Reach Zone II.',                                   check:g=>g.zoneIdx>=1||g.bossDefeated[0]},
  {id:'zone4',         icon:'🌑', title:'Into the Abyss',   desc:'Reach Zone IV.',                                   check:g=>g.zoneIdx>=3||g.bossDefeated[2]},
  {id:'zone8',         icon:'🏆', title:'Descent Complete', desc:'Reach the Shadow Realm.',                          check:g=>g.zoneIdx>=7||g.bossDefeated[6]},
  {id:'lvl5',          icon:'⬆️', title:'Rising Power',     desc:'Reach level 5.',                                   check:g=>g.level>=5},
  {id:'lvl10',         icon:'🌟', title:'Champion',          desc:'Reach level 10.',                                  check:g=>g.level>=10},
  {id:'lvl20',         icon:'👑', title:'Legend',            desc:'Reach level 20.',                                  check:g=>g.level>=20},
  // ── Bosses ─────────────────────────────────────────────
  {id:'boss1',         icon:'🌿', title:'Thornslayer',       desc:'Defeat the Thornwarden.',                          check:g=>g.bossDefeated[0]},
  {id:'boss3',         icon:'🔮', title:'Cultbreaker',       desc:'Defeat Vexara the Crimson.',                       check:g=>g.bossDefeated[2]},
  {id:'boss5',         icon:'🌀', title:'Gate Sealer',       desc:'Defeat Zareth the Sundered.',                      check:g=>g.bossDefeated[4]},
  {id:'boss8',         icon:'🌑', title:'The Return',        desc:'Defeat the Hollow Empress.',                       check:g=>g.bossDefeated[7]},
  // ── Economy ────────────────────────────────────────────
  {id:'gold500',       icon:'🪙', title:'Well-Funded',       desc:'Accumulate 500 total gold.',                       check:g=>(g.totalGold||0)>=500},
  {id:'gold5000',      icon:'💰', title:'War Chest',         desc:'Accumulate 5000 total gold.',                      check:g=>(g.totalGold||0)>=5000},
  {id:'craft5',        icon:'⚗️', title:'Alchemist',         desc:'Craft 5 items.',                                   check:g=>(g.totalCrafts||0)>=5},
  {id:'craft20',       icon:'🧪', title:'Master Alchemist',  desc:'Craft 20 items.',                                  check:g=>(g.totalCrafts||0)>=20},
  // ── Objectives ─────────────────────────────────────────
  {id:'obj1',          icon:'★',  title:'Overachiever',      desc:'Complete 1 secondary objective.',                  check:g=>(g.totalObjectives||0)>=1},
  {id:'obj5',          icon:'★★', title:'Perfectionist',     desc:'Complete 5 secondary objectives.',                 check:g=>(g.totalObjectives||0)>=5},
  // ── Class ──────────────────────────────────────────────
  {id:'subclass',      icon:'🎓', title:'Awakened',          desc:'Unlock your subclass.',                            check:g=>g.subclassUnlocked},
  {id:'talent3',       icon:'💡', title:'Talented',          desc:'Pick 3 talents.',                                  check:g=>(g.talents||[]).length>=3},
];

function checkAchievements(){
  if(!G) return;
  // unlockedAchievements on G is used as a run-time cache to avoid double-toasts
  if(!G.unlockedAchievements) G.unlockedAchievements = getSlotAchievements();
  ACHIEVEMENTS.forEach(ach=>{
    if(G.unlockedAchievements.includes(ach.id)) return;
    try{
      if(ach.check(G)){
        G.unlockedAchievements.push(ach.id);
        // Persist to slot — only fires if it's actually new
        if(typeof unlockAchievement==='function') unlockAchievement(ach.id);
        showAchievementToast(ach);
        autoSave();
      }
    }catch(e){}
  });
}

let _achToastQueue=[];
let _achToastShowing=false;
function showAchievementToast(ach){
  _achToastQueue.push(ach);
  if(!_achToastShowing)drainAchToast();
}
function drainAchToast(){
  if(!_achToastQueue.length){_achToastShowing=false;return;}
  _achToastShowing=true;
  const ach=_achToastQueue.shift();
  const el=document.getElementById('achToast');
  if(!el){_achToastShowing=false;return;}
  document.getElementById('achToastIcon').textContent=ach.icon;
  document.getElementById('achToastTitle').textContent=ach.title;
  document.getElementById('achToastDesc').textContent=ach.desc;
  el.classList.add('show');
  setTimeout(()=>{
    el.classList.remove('show');
    setTimeout(drainAchToast,400);
  },3000);
}

function codexHTML(){
  if(!G)return '';
  // Read from slot — authoritative list. Fall back to G cache during a run.
  const unlocked = typeof getSlotAchievements==='function' ? getSlotAchievements() : (G.unlockedAchievements||[]);
  const total=ACHIEVEMENTS.length;
  const done=unlocked.length;
  const pct=Math.round(done/total*100);
  const rows=ACHIEVEMENTS.map(a=>{
    const got=unlocked.includes(a.id);
    return`<div class="ach-row ${got?'got':'locked'}">
      <span class="ach-icon">${got?a.icon:'🔒'}</span>
      <div class="ach-info">
        <div class="ach-title">${got?a.title:'???'}</div>
        <div class="ach-desc">${got?a.desc:'Hidden achievement'}</div>
      </div>
      ${got?'<span class="ach-check">✓</span>':''}
    </div>`;
  }).join('');
  return`<div>
    <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--gold);margin-bottom:12px;text-align:center;">
      CODEX — ${done}/${total} (${pct}%)
    </div>
    <div style="background:#000;height:6px;border:1px solid var(--border);margin-bottom:14px;border-radius:3px;">
      <div style="height:100%;width:${pct}%;background:var(--gold);border-radius:3px;transition:width .4s;"></div>
    </div>
    <div class="ach-grid">${rows}</div>
  </div>`;
}

// ══════════════════════════════════════════════════════════
//  SECONDARY OBJECTIVES
// ══════════════════════════════════════════════════════════
// Each zone has one secondary objective. Completing it awards bonus gold + item.
// Progress is tracked in G.objective = { zoneIdx, id, progress, goal, completed }

const ZONE_OBJECTIVES = [
  // Zone 0 — Woods
  { id:'woods_nokill_poison', zoneIdx:0,
    title:'Untainted', icon:'🌿',
    desc:'Defeat the Thornwarden without ever becoming Poisoned.',
    type:'no_condition', condition:'Poisoned',
    reward:{ gold:40, item:'frostRing' } },
  // Zone 1 — Outpost
  { id:'outpost_kill10_undead', zoneIdx:1,
    title:'Exorcist', icon:'💀',
    desc:'Defeat 10 undead enemies in this zone.',
    type:'kill_type', killType:'isUndead', goal:10,
    reward:{ gold:65, item:'boneWard' } },
  // Zone 2 — Castle
  { id:'castle_no_death', zoneIdx:2,
    title:'Unbowed', icon:'🏰',
    desc:'Clear the Castle zone without retreating to the campfire.',
    type:'no_campfire',
    reward:{ gold:90, item:'cultistsCowl' } },
  // Zone 3 — Underdark
  { id:'underdark_dmg', zoneIdx:3,
    title:'Light in the Dark', icon:'🔦',
    desc:'Deal 500 total damage in this zone.',
    type:'deal_damage', goal:500,
    reward:{ gold:130, item:'voidEye' } },
  // Zone 4 — Abyss
  { id:'abyss_nokill_burn', zoneIdx:4,
    title:'Fireproof', icon:'🧯',
    desc:'Defeat Zareth without ever becoming Burning.',
    type:'no_condition', condition:'Burning',
    reward:{ gold:200, item:'demonscaleGauntlets' } },
  // Zone 5 — Frostveil
  { id:'frost_kill_fast', zoneIdx:5,
    title:'Speed of the Storm', icon:'⚡',
    desc:'Defeat 8 enemies in a single dungeon run (no campfire).',
    type:'kill_streak', goal:8,
    reward:{ gold:260, item:'glacialCrown' } },
  // Zone 6 — Celestial
  { id:'celestial_no_reactions', zoneIdx:6,
    title:'Stoic Resolve', icon:'🧘',
    desc:'Defeat Auranthos without using any Reactions.',
    type:'no_reaction',
    reward:{ gold:320, item:'seraphimWings' } },
  // Zone 7 — Shadow Realm
  { id:'shadow_survive', zoneIdx:7,
    title:'Into the Dark', icon:'🌑',
    desc:'Defeat the Hollow Empress at or below 25% HP.',
    type:'low_hp_boss',
    reward:{ gold:400, item:'voidcrownOfMalvaris' } },
];

function initObjective(zoneIdx){
  const obj=ZONE_OBJECTIVES.find(o=>o.zoneIdx===zoneIdx);
  if(!obj)return;
  G.objective={
    id:obj.id, zoneIdx, type:obj.type,
    condition:obj.condition||null,
    killType:obj.killType||null,
    goal:obj.goal||0, progress:0,
    completed:false, failed:false,
    reactionsUsed:0,
    campfireUsed:false,
  };
}

function checkObjectiveProgress(event, data){
  if(!G.objective||G.objective.completed||G.objective.failed)return;
  if(G.objective.zoneIdx!==G.zoneIdx)return;
  const obj=G.objective;
  switch(obj.type){
    case 'no_condition':
      if(event==='condition_gained'&&data===obj.condition){obj.failed=true;log('✗ Objective failed: '+data+' applied','s');}
      break;
    case 'kill_type':
      if(event==='enemy_killed'&&data[obj.killType]){obj.progress++;if(obj.progress>=obj.goal){obj.completed=true;grantObjectiveReward(obj);}}
      break;
    case 'no_campfire':
      if(event==='campfire_used'){obj.failed=true;log('✗ Objective failed: used campfire','s');}
      break;
    case 'deal_damage':
      if(event==='damage_dealt'){obj.progress+=(data||0);if(obj.progress>=obj.goal){obj.completed=true;grantObjectiveReward(obj);}}
      break;
    case 'kill_streak':
      if(event==='enemy_killed'){obj.progress++;if(obj.progress>=obj.goal){obj.completed=true;grantObjectiveReward(obj);}}
      if(event==='campfire_used'){obj.progress=0;}// streak resets
      break;
    case 'no_reaction':
      if(event==='reaction_used'){obj.failed=true;log('✗ Objective failed: reaction used','s');}
      break;
    case 'low_hp_boss':
      if(event==='boss_killed'&&G.hp<=(G.maxHp*0.25)){obj.completed=true;grantObjectiveReward(obj);}
      break;
  }
  if(obj.completed) renderObjectiveStatus();
  if(obj.failed) renderObjectiveStatus();
}

function grantObjectiveReward(obj){
  const def=ZONE_OBJECTIVES.find(o=>o.id===obj.id);
  if(!def)return;
  G.gold+=def.reward.gold;
  G.totalGold+=def.reward.gold;
  if(def.reward.item){
    const item=ITEMS.find(i=>i.id===def.reward.item);
    if(item)addItem({...item,qty:1});
  }
  G.totalObjectives=(G.totalObjectives||0)+1;
  log('★ OBJECTIVE COMPLETE: '+def.title+'! +'+def.reward.gold+'🪙'+(def.reward.item?' + bonus item':''),'l');
  AUDIO.sfx.levelup&&AUDIO.sfx.levelup();
  checkAchievements();
  renderAll();
}

function renderObjectiveStatus(){
  const el=document.getElementById('objectiveStatus');
  if(!el||!G)return;
  const obj=G.objective;
  if(!obj){el.style.display='none';return;}
  const def=ZONE_OBJECTIVES.find(o=>o.id===obj.id);
  if(!def){el.style.display='none';return;}
  const status=obj.completed?'✅ COMPLETE':obj.failed?'❌ FAILED':
    (obj.goal?`${obj.progress}/${obj.goal}`:'Active');
  const color=obj.completed?'var(--green2)':obj.failed?'var(--red2)':'var(--gold2)';
  el.style.display='block';
  el.innerHTML=`<span style="color:${color}">${def.icon} ${def.title}: ${def.desc} — ${status}</span>`;
}

const CRAFT_RECIPES=[
  // ── BASIC POTIONS ──────────────────────────────────────────────────
  {cat:'basic',req:{herb:2},
   result:{id:'hpPotion',name:'Healing Potion',icon:'🧪',type:'consumable',slot:null,rarity:'common',stats:{heal:15},value:10},
   desc:'2 Herbs → Healing Potion (15 HP)'},
  {cat:'basic',req:{herb:3,fang:1},
   result:{id:'strongPotion',name:'Strong Potion',icon:'⚗️',type:'consumable',slot:null,rarity:'uncommon',stats:{heal:35},value:28},
   desc:'3 Herbs + 1 Fang → Strong Potion (35 HP)'},
  {cat:'basic',req:{bone:3},
   result:{id:'antidote',name:'Antidote',icon:'💊',type:'consumable',slot:null,rarity:'common',stats:{heal:5,clearPoison:1},value:8},
   desc:'3 Bones → Antidote (clears Poison)'},
  {cat:'basic',req:{herb:1,bone:2},
   result:{id:'burnSalve',name:'Burn Salve',icon:'🫙',type:'consumable',slot:null,rarity:'common',stats:{heal:8,clearBurn:1},value:10},
   desc:'1 Herb + 2 Bones → Burn Salve (clears Burning)'},
  {cat:'basic',req:{fang:2,herb:2},
   result:{id:'swiftnessDraft',name:'Swiftness Draft',icon:'💨',type:'consumable',slot:null,rarity:'uncommon',stats:{heal:10,tempAtk:5},value:22},
   desc:'2 Fangs + 2 Herbs → Swiftness Draft (+5 ATK, 10 HP)'},
  // ── ADVANCED POTIONS ───────────────────────────────────────────────
  {cat:'advanced',req:{ghostEssence:2,bone:2},
   result:{id:'elixir',name:'Elixir of Life',icon:'✨',type:'consumable',slot:null,rarity:'rare',stats:{heal:60},value:75},
   desc:'2 Ghost Essence + 2 Bones → Elixir of Life (60 HP)'},
  {cat:'advanced',req:{voidShard:2,ghostEssence:1},
   result:{id:'voidElixir',name:'Void Elixir',icon:'🌀',type:'consumable',slot:null,rarity:'rare',stats:{heal:40,tempDef:8},value:65},
   desc:'2 Void Shards + 1 Ghost Essence → Void Elixir (40 HP, +8 DEF)'},
  {cat:'advanced',req:{demonAsh:1,fang:2},
   result:{id:'rageDraught',name:'Rage Draught',icon:'🔥',type:'consumable',slot:null,rarity:'rare',stats:{heal:20,tempAtk:12},value:80},
   desc:'1 Demon Ash + 2 Fangs → Rage Draught (+12 ATK, 20 HP)'},
  {cat:'advanced',req:{frostCrystal:1,herb:3},
   result:{id:'frostShield',name:'Frost Shield',icon:'🧊',type:'consumable',slot:null,rarity:'rare',stats:{heal:15,tempDef:15},value:85},
   desc:'1 Frost Crystal + 3 Herbs → Frost Shield (+15 DEF, 15 HP)'},
  {cat:'advanced',req:{ironCore:2,bone:2},
   result:{id:'ironSkin',name:'Iron Skin',icon:'🛡️',type:'consumable',slot:null,rarity:'uncommon',stats:{heal:5,tempDef:12},value:45},
   desc:'2 Iron Cores + 2 Bones → Iron Skin (+12 DEF, 5 HP)'},
  // ── LEGENDARY BREWS ────────────────────────────────────────────────
  {cat:'legendary',req:{celestialDust:1,ghostEssence:2,herb:2},
   result:{id:'celestialDraught',name:'Celestial Draught',icon:'⭐',type:'consumable',slot:null,rarity:'epic',stats:{heal:100},value:150},
   desc:'1 Celestial Dust + 2 Ghost Essence + 2 Herbs → Celestial Draught (100 HP)'},
  {cat:'legendary',req:{shadowEssence:1,voidShard:2,demonAsh:1},
   result:{id:'shadowBlood',name:'Shadow Blood',icon:'🌑',type:'consumable',slot:null,rarity:'epic',stats:{heal:60,tempAtk:20,tempDef:10},value:200},
   desc:'1 Shadow Essence + 2 Void Shards + 1 Demon Ash → Shadow Blood (60 HP, +20 ATK, +10 DEF)'},
  {cat:'legendary',req:{frostCrystal:2,ironCore:2},
   result:{id:'titanBlood',name:"Titan's Blood",icon:'💪',type:'consumable',slot:null,rarity:'epic',stats:{heal:50,tempAtk:15,tempDef:20},value:180},
   desc:"2 Frost Crystals + 2 Iron Cores → Titan's Blood (50 HP, +15 ATK, +20 DEF)"},
  {cat:'legendary',req:{celestialDust:2,shadowEssence:1},
   result:{id:'etherFlask',name:'Ether Flask',icon:'🌈',type:'consumable',slot:null,rarity:'legendary',stats:{heal:150},value:300},
   desc:'2 Celestial Dust + 1 Shadow Essence → Ether Flask (FULL heal)'},
];

function cfDoCraft(idx){
  const recipe=CRAFT_RECIPES[idx];
  for(const[mat,qty]of Object.entries(recipe.req))removeItems(mat,qty);
  addItem({...recipe.result,qty:1});
  G.totalCrafts=(G.totalCrafts||0)+1;
  checkAchievements();
  AUDIO.sfx.craftSuccess();
  document.getElementById('craftResult').textContent='✓ Crafted: '+recipe.result.name+'!';
  cfRenderTab('craft');
}

let _shopCat='all';

function drawShopWizard(){
  const c=document.getElementById('shopWizardCanvas');
  if(!c)return;
  const ctx=c.getContext('2d');
  ctx.clearRect(0,0,48,64);
  // Helper: draw a rectangle of pixels
  function px(x,y,w,h,col){ctx.fillStyle=col;ctx.fillRect(x,y,w,h);}

  // Wizard pixel art — 48x64 grid, each "pixel" = 1 unit
  // === HAT ===
  px(16,2,16,3,'#1a0a2e');  // hat top
  px(14,5,20,3,'#1a0a2e');  // hat mid
  px(12,8,24,3,'#1a0a2e');  // hat brim top
  px(10,11,28,2,'#2a1048'); // hat brim bottom
  // Hat band
  px(14,8,20,1,'#c8a030');
  // Hat shine
  px(18,3,3,2,'#3a1860');

  // === FACE ===
  px(16,13,16,14,'#d4a56a'); // skin
  // Eyes — glowing
  px(18,16,4,3,'#fff');      // left eye white
  px(26,16,4,3,'#fff');      // right eye white
  px(19,17,2,2,'#3060e0');   // left pupil
  px(27,17,2,2,'#3060e0');   // right pupil
  px(19,17,2,2,'rgba(180,210,255,0.6)'); // left eye glow
  // Eyebrows (bushy)
  px(17,15,5,1,'#888');
  px(26,15,5,1,'#888');
  // Nose
  px(23,21,3,2,'#b88050');
  // Mouth (slight smile)
  px(19,25,2,1,'#8a5030');
  px(21,26,6,1,'#8a5030');
  px(27,25,2,1,'#8a5030');
  // Beard
  px(14,24,20,6,'#ccc');
  px(16,30,16,4,'#bbb');
  px(18,34,12,2,'#aaa');

  // === ROBE BODY ===
  px(10,27,28,28,'#1e0840');  // main robe
  // Robe trim
  px(10,27,2,28,'#4a2090');   // left side
  px(36,27,2,28,'#4a2090');   // right side
  px(10,53,28,2,'#4a2090');   // bottom trim
  // Robe gold detail
  px(22,28,4,24,'#c8a030');   // center stripe
  px(20,28,2,2,'#c8a030');    // clasp top
  px(26,28,2,2,'#c8a030');
  // Stars on robe
  px(14,32,2,2,'#a0c0ff');
  px(14,42,2,2,'#ffd060');
  px(32,36,2,2,'#a0c0ff');
  px(32,48,2,2,'#c080ff');

  // === ARMS ===
  px(4,27,8,18,'#1e0840');   // left sleeve
  px(36,27,8,18,'#1e0840');  // right sleeve
  // Hands
  px(4,45,8,6,'#d4a56a');    // left hand
  px(36,45,8,6,'#d4a56a');   // right hand

  // === STAFF (left hand holds it) ===
  px(2,10,3,54,'#5a3010');   // staff pole
  // Staff orb
  px(0,6,7,8,'rgba(100,60,200,0.3)'); // glow
  px(1,7,5,6,'#8040e0');     // orb body
  px(2,8,3,4,'#a060ff');     // orb highlight
  px(3,8,1,1,'#fff');        // orb shine

  // === GLOW EFFECT (animated via requestAnimationFrame stored on canvas) ===
  if(!c._wizardGlow){
    c._wizardGlow=0;
    function animWizard(){
      if(!document.getElementById('shopWizardCanvas'))return;
      c._wizardGlow=(c._wizardGlow||0)+0.05;
      const g=Math.sin(c._wizardGlow)*0.4+0.6;
      ctx.clearRect(0,0,48,64);
      // redraw
      drawShopWizard._draw(ctx,px,g);
      requestAnimationFrame(animWizard);
    }
    // Attach draw fn
    drawShopWizard._draw=function(ctx2,px2,g){
      // hat
      px2(16,2,16,3,'#1a0a2e');px2(14,5,20,3,'#1a0a2e');px2(12,8,24,3,'#1a0a2e');px2(10,11,28,2,'#2a1048');
      px2(14,8,20,1,'#c8a030');px2(18,3,3,2,'#3a1860');
      // face
      px2(16,13,16,14,'#d4a56a');
      px2(18,16,4,3,'#fff');px2(26,16,4,3,'#fff');
      px2(19,17,2,2,'#3060e0');px2(27,17,2,2,'#3060e0');
      px2(17,15,5,1,'#888');px2(26,15,5,1,'#888');
      px2(23,21,3,2,'#b88050');
      px2(19,25,2,1,'#8a5030');px2(21,26,6,1,'#8a5030');px2(27,25,2,1,'#8a5030');
      px2(14,24,20,6,'#ccc');px2(16,30,16,4,'#bbb');px2(18,34,12,2,'#aaa');
      // robe
      px2(10,27,28,28,'#1e0840');px2(10,27,2,28,'#4a2090');px2(36,27,2,28,'#4a2090');
      px2(10,53,28,2,'#4a2090');px2(22,28,4,24,'#c8a030');px2(20,28,2,2,'#c8a030');px2(26,28,2,2,'#c8a030');
      px2(14,32,2,2,'#a0c0ff');px2(14,42,2,2,'#ffd060');px2(32,36,2,2,'#a0c0ff');px2(32,48,2,2,'#c080ff');
      // arms
      px2(4,27,8,18,'#1e0840');px2(36,27,8,18,'#1e0840');
      px2(4,45,8,6,'#d4a56a');px2(36,45,8,6,'#d4a56a');
      // staff
      px2(2,10,3,54,'#5a3010');
      // orb with glow pulse
      const alpha=g*0.5;
      ctx2.fillStyle=`rgba(100,60,200,${alpha})`;ctx2.fillRect(0,6,7,8);
      px2(1,7,5,6,'#8040e0');px2(2,8,3,4,'#a060ff');px2(3,8,1,1,'#fff');
      // eye glow pulse
      ctx2.fillStyle=`rgba(80,160,255,${g*0.7})`;ctx2.fillRect(19,17,2,2);ctx2.fillRect(27,17,2,2);
    };
    requestAnimationFrame(animWizard);
  } else {
    drawShopWizard._draw(ctx,px,1);
  }
}

function cfShopHTML(cat){
  if(cat)_shopCat=cat;
  const rc={common:'#6a5838',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#9b54bd',legendary:'var(--gold)'};
  const typeLabel={weapon:'Weapon',armor:'Armor',offhand:'Off-Hand',accessory:'Accessory',consumable:'Consumable'};
  const rarityLabel={common:'Common',uncommon:'Uncommon',rare:'Rare',epic:'Epic ✦',legendary:'★ Legendary'};

  // ── SHOP TIER ─────────────────────────────────────────────
  const shopTier = typeof getShopTier==='function' ? getShopTier() : 1;
  const allowedRarities = typeof getShopTierRarities==='function' ? getShopTierRarities() : ['common','uncommon'];
  const totalDonated = typeof getWizardDonations==='function' ? getWizardDonations() : 0;
  const nextTierCost = shopTier===1 ? 500 : shopTier===2 ? 2000 : null;
  const toNext = nextTierCost !== null ? nextTierCost - totalDonated : 0;
  const tierColor = shopTier===3 ? 'var(--gold)' : shopTier===2 ? 'var(--blue2)' : 'var(--dim)';
  const tierLabel = shopTier===3 ? '★ TIER III — FULL STOCK' : shopTier===2 ? '✦ TIER II — RARE UNLOCKED' : '◆ TIER I — BASIC STOCK';

  // Donation panel HTML
  const donationHTML = `
    <div style="border:2px solid var(--border2);background:rgba(0,0,0,0.3);padding:10px 12px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-family:'Press Start 2P',monospace;font-size:7px;color:${tierColor};">${tierLabel}</span>
        <span style="font-size:13px;color:var(--dim);">🪙 ${totalDonated} donated</span>
      </div>
      ${shopTier < 3 ? `
        <div style="font-size:12px;color:var(--dim);margin-bottom:8px;">
          ${shopTier===1
            ? 'Donate <span style="color:var(--gold)">500g total</span> to unlock Rare items.'
            : 'Donate <span style="color:var(--gold)">'+(toNext)+'g more</span> to unlock Epic &amp; Legendary items.'}
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${[10,25,50,100].filter(amt=>amt<=G.gold).map(amt=>
            `<button class="btn" style="font-size:8px;padding:5px 10px;border-color:#3a5a8a;color:#6aafea;" onclick="cfDonateWizard(${amt})">Donate 🪙${amt}</button>`
          ).join('')}
          ${G.gold<=0?'<span style="font-size:12px;color:var(--dim);">No gold to donate.</span>':''}
        </div>
      ` : '<div style="font-size:12px;color:var(--gold);">The wizard bows deeply. You have unlocked everything.</div>'}
    </div>`;

  // ── CLASS FILTER: each class only sees relevant gear ──────
  const CLASS_ALLOWED={
    fighter:   {weapon:['sword','silverSword','greatsword','handaxe'],armor:['leather','paddedArmor','chainmail','scaleMail','plateArmor'],offhand:['shield','ironShield'],ring:true,helmet:true,gloves:['roughGloves','ironGauntlets','deathgripGauntlets'],boots:true,amulet:true,consumable:true},
    wizard:    {weapon:['staff','wand','arcaneOrb'],armor:['paddedArmor','robes','shadowLeather'],offhand:['spellbook','arcaneOrb2'],ring:true,helmet:['leatherCap','magesHood','shadowCowl'],gloves:['roughGloves','spellbinderGloves','runeweaveGloves'],boots:true,amulet:true,consumable:true},
    rogue:     {weapon:['dagger','voidDagger','sword','silverSword'],armor:['leather','shadowLeather','paddedArmor'],offhand:['shield'],ring:true,helmet:['leatherCap','shadowCowl'],gloves:['roughGloves','ironGauntlets','deathgripGauntlets'],boots:['travelerBoots','ironBoots','rangerTreads','shadowstepBoots'],amulet:true,consumable:true},
    paladin:   {weapon:['sword','silverSword','greatsword'],armor:['chainmail','scaleMail','plateArmor','leather'],offhand:['shield','ironShield'],ring:true,helmet:['leatherCap','ironCoif','knightHelm','greatHelm'],gloves:['roughGloves','ironGauntlets','deathgripGauntlets'],boots:['travelerBoots','ironBoots','wardensGreaves'],amulet:true,consumable:true},
    ranger:    {weapon:['bow','longbow','dagger'],armor:['leather','shadowLeather','scaleMail'],offhand:['shield','spellbook'],ring:true,helmet:['leatherCap','ironCoif','shadowCowl'],gloves:['roughGloves','ironGauntlets','spellbinderGloves','deathgripGauntlets'],boots:['travelerBoots','ironBoots','rangerTreads','shadowstepBoots'],amulet:true,consumable:true},
    barbarian: {weapon:['club','handaxe','greatsword','sword'],armor:['leather','paddedArmor','chainmail'],offhand:[],ring:true,helmet:['leatherCap','ironCoif','knightHelm','greatHelm'],gloves:['roughGloves','ironGauntlets','deathgripGauntlets'],boots:['travelerBoots','ironBoots','wardensGreaves'],amulet:true,consumable:true},
    cleric:    {weapon:['staff','wand','club','sword'],armor:['chainmail','scaleMail','robes','leather'],offhand:['shield','ironShield','spellbook'],ring:true,helmet:['leatherCap','ironCoif','knightHelm','magesHood'],gloves:['roughGloves','ironGauntlets','spellbinderGloves','runeweaveGloves'],boots:true,amulet:true,consumable:true},
    druid:     {weapon:['staff','druidStaff','bow','club'],armor:['leather','robes','paddedArmor'],offhand:['spellbook','shield'],ring:true,helmet:['leatherCap','magesHood'],gloves:['roughGloves','spellbinderGloves','runeweaveGloves'],boots:['travelerBoots','ironBoots','rangerTreads'],amulet:true,consumable:true},
  };
  const allowed=CLASS_ALLOWED[G.classId]||{};
  function itemAllowedForClass(item){
    if(item.type==='consumable'||item.type==='material')return true;
    if(item.type==='accessory')return true;
    if(item.forClass)return item.forClass===G.classId;
    if(item.set&&!item.forClass)return true;
    if(item.rarity==='legendary')return true;
    const allowedIds=allowed[item.type==='offhand'?'offhand':item.slot||item.type];
    if(Array.isArray(allowedIds))return allowedIds.includes(item.id);
    return !!allowedIds;
  }

  // ── TIER FILTER: only show rarities unlocked by donations ─
  const allItems=ITEMS.filter(i=>
    i.type!=='material' &&
    i.value>0 &&
    itemAllowedForClass(i) &&
    allowedRarities.includes(i.rarity)
  );

  const cats=[
    {k:'all',l:'All'},
    {k:'weapon',l:'Weapons'},
    {k:'armor',l:'Armor'},
    {k:'offhand',l:'Off-Hand'},
    {k:'accessory',l:'Rings'},
    {k:'consumable',l:'Potions'},
    {k:'epic',l:'✦ Sets'},
  ];
  const filtered=_shopCat==='all'?allItems:_shopCat==='epic'?allItems.filter(i=>i.rarity==='epic'||i.rarity==='legendary'):allItems.filter(i=>i.type===_shopCat);
  const catHTML=cats.map(c=>`<div class="shop-cat ${_shopCat===c.k?'active':''}" onclick="cfShopHTML('${c.k}');cfRenderTab('shop')">${c.l}</div>`).join('');
  const statStr=s=>Object.entries(s).filter(([k,v])=>v&&k!=='heal').map(([k,v])=>`+${v} ${k}`).join(' ');
  const itemsHTML=filtered.map((item,_)=>{
    const i=ITEMS.indexOf(item);
    const canBuy=G.gold>=item.value;
    const color=rc[item.rarity]||'#888';
    const isSet=!!item.set;
    const setDef=isSet&&SET_BONUSES[item.set];
    const statsLine=Object.entries(item.stats).filter(([k,v])=>v).map(([k,v])=>`+${v} ${k}`).join(' · ');
    return `<div class="shop-item ${canBuy?'':'cant'}" onclick="${canBuy?`cfBuyItem(${i})`:''}">
      <div class="si-icon-wrap"><span class="si-icon">${item.icon}</span></div>
      <div class="si-info">
        <span class="si-name" style="color:${color}">${item.name}${isSet?`<span class="shop-set-badge">SET</span>`:''}</span>
        <div class="si-meta-row">
          <span class="si-stats-inline">${statsLine}</span>
          <span class="si-cost">🪙${item.value}</span>
        </div>
      </div>
    </div>`;
  }).join('');

  // Build equipped bar
  const slots=[{k:'weapon',l:'WEAPON'},{k:'armor',l:'ARMOR'},{k:'offhand',l:'OFF-H'},{k:'ring',l:'RING'},{k:'helmet',l:'HELM'},{k:'gloves',l:'GLOVES'},{k:'boots',l:'BOOTS'},{k:'amulet',l:'AMUL'}];
  const equippedBar=slots.map(s=>{
    const item=G.equipped[s.k];
    const rColor=item?({common:'#6a5838',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#9b54bd',legendary:'var(--gold)'}[item.rarity]||'#888'):'';
    if(item){
      const statsStr=Object.entries(item.stats).filter(([k,v])=>v).map(([k,v])=>`${v>0?'+':''}${v} ${k}`).join(' · ')||'No stats';
      return `<div class="shop-eq-slot has-item" onmouseenter="showShopEqTooltip(event,'${s.k}')" onmouseleave="hideInvTooltip()">
        <span class="shop-eq-icon">${item.icon}</span>
        <span class="shop-eq-lbl filled" style="color:${rColor}" title="${item.name}">${item.name.length>7?item.name.substring(0,7)+'…':item.name}</span>
      </div>`;
    } else {
      return `<div class="shop-eq-slot">
        <span class="shop-eq-empty">—</span>
        <span class="shop-eq-lbl">${s.l}</span>
      </div>`;
    }
  }).join('');

  // Wizard NPC dialogue — zone-aware
  const MALACHAR_LINES = [
    { greeting: "Malachar the Grey, scholar of forgotten things.",
      tip: "The Thornwarden has stood for three centuries. Something keeps it rooted here — not instinct. Purpose. Watch its roots. They reach toward you.",
      boss: "Root Slam hits hard. A STR save, so boost your constitution potions before engaging. And whatever you do — don't stand still." },
    { greeting: "Still breathing? The outpost has a way of fixing that.",
      tip: "Grakthar's soldiers aren't truly dead — they're *held*. Something beneath the garrison keeps them animate. Kill the commander and the hold breaks.",
      boss: "His Bellow inflicts Fear — a WIS save. Clerics, Paladins resist best. For the rest of you: potions of clarity fetch a fine price, hint hint." },
    { greeting: "Ah. A survivor. The cult usually... discourages visitors.",
      tip: "The Crimson Cult brands their initiates with a void sigil. It lets them channel Vexara's power even after death. Burn the body. Just in case.",
      boss: "Vexara draws power from fear. Her Void Eruption targets INT — scholars suffer. Keep your mind calm and your saves high. Phase 2 sets you ablaze." },
    { greeting: "You've gone deeper than most. That tells me something about you.",
      tip: "The Underdark warps perception. Those Stone Golems? They're not constructs — they're memories. People who went mad down here and calcified. Tragic, really.",
      boss: "Nethrix is a *mind*. Not a body. The body is just what it's wearing. Its Mind Shatter is a WIS save — fortify your mental defenses or you'll fight Frightened the whole time." },
    { greeting: "The gate is open. I felt it from three zones away.",
      tip: "Hellhounds track by soul-scent, not sight. You can't hide from them — but you can confuse them. Multiple targets, summoned allies, companions. Spread the scent.",
      boss: "Zareth the Sundered was once a man. I knew him, actually. He made a deal he couldn't pay. His Abyssal Slam is a STR save — get your resistances up." },
    { greeting: "Cold enough for you? The frost here doesn't melt. It *accumulates*.",
      tip: "Valdris has occupied this citadel for four hundred years. His armor isn't iron — it's compressed time. Each layer is a decade he refused to let go.",
      boss: "The Titan fights in staggered waves. First the ice shield, then the man beneath. His Glacial Crush is a CON save. Stamina and HP buffs are your friends here." },
    { greeting: "The Celestial Plane. Even I've only read about this place.",
      tip: "The angels here aren't benevolent — they're *correct*. They follow a logic so pure it became cruelty. They'll kill you without malice, which is somehow worse.",
      boss: "Auranthos is blind. It perceives guilt, not light. If you're carrying sins — and you are, we all are — it will find you. Cleanse your conditions before engaging." },
    { greeting: "... You made it. I honestly wasn't sure you would.",
      tip: "The Shadowrealm is the scar left where reality was wounded. Malvaris didn't *create* it. She *is* it. To destroy her is to close the wound. I wonder if it will hurt.",
      boss: "Everything I know is useless here. This is beyond scholarship. But I'll tell you this — she has been waiting for *you* specifically. She knows your true name. Don't let her say it." },
  ];
  const z=G.zoneIdx||0;
  const npc=MALACHAR_LINES[Math.min(z,MALACHAR_LINES.length-1)];
  const bossDefeated=G.bossDefeated&&G.bossDefeated[z];
  const npcQuote=bossDefeated?'"The boss is felled. Your name grows heavier."':'"'+npc.tip+'"';
  const npcColor=bossDefeated?'var(--dim)':'var(--parchment)';

  return `<div>
    <div class="shop-header">
      <div class="shop-header-left">
        <div class="shop-gold">🪙 ${G.gold} gold</div>
        <div style="font-size:11px;color:var(--gold);margin-bottom:4px;font-style:italic;">${npc.greeting}</div>
        <div style="font-size:12px;color:${npcColor};line-height:1.7;max-width:340px;margin-bottom:4px;">${npcQuote}</div>
        ${!bossDefeated?`<div style="font-size:11px;color:var(--red2);margin-top:4px;cursor:pointer;text-decoration:underline;" onclick="this.nextSibling.style.display=this.nextSibling.style.display==='block'?'none':'block';this.textContent=this.textContent.includes('▼')?'⚔ Boss Intel ▲':'⚔ Boss Intel ▼'">⚔ Boss Intel ▼</div><div style="display:none;background:rgba(60,0,0,.3);border:1px solid var(--red2);padding:8px 10px;font-size:12px;color:#e08080;line-height:1.8;max-width:340px;margin-top:4px;">${npc.boss}</div>`:''}
      </div>
      <div class="px-wizard-wrap">
        <canvas id="shopWizardCanvas" class="px-wizard" width="48" height="64" style="width:72px;height:96px;"></canvas>
      </div>
    </div>
    ${donationHTML}
    <div class="shop-equipped-bar">
      <div class="shop-equipped-bar-title">EQUIPPED</div>
      ${equippedBar}
    </div>
    <div class="shop-categories">${catHTML}</div>
    <div class="shop-grid">${itemsHTML.length?itemsHTML:'<div style="padding:12px;font-size:14px;color:var(--dim);">Nothing here.</div>'}</div>
    <div id="shopResult" style="margin-top:12px;font-size:16px;color:var(--green2);"></div>
  </div>`;
}

let _lastBoughtItem=null;
let _lastBoughtSlot=null;

function cfBuyItem(itemIdx){
  const item=ITEMS[itemIdx];
  if(!item||G.gold<item.value){document.getElementById('shopResult').textContent='✗ Not enough gold!';return;}
  if(item.value===0){document.getElementById('shopResult').textContent='✗ This item cannot be purchased — find it as a drop!';return;}
  if(!addItem({...item})){document.getElementById('shopResult').textContent='✗ Inventory full!';return;}
  G.gold-=item.value;
  if(item.slot){
    _lastBoughtItem={...item};
    _lastBoughtSlot=item.slot;
    showShopBuyPrompt(item);
  } else {
    document.getElementById('shopResult').textContent='✓ Purchased: '+item.name+'!';
    cfRenderTab('shop');
  }
}

function showShopBuyPrompt(item){
  const rc={common:'#6a5838',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#9b54bd',legendary:'var(--gold)'}[item.rarity]||'#888';
  const rarLabel={common:'Common',uncommon:'Uncommon',rare:'Rare',epic:'Epic ✦',legendary:'★ Legendary'}[item.rarity]||item.rarity;
  document.getElementById('sbpIcon').textContent=item.icon;
  document.getElementById('sbpName').textContent=item.name;
  document.getElementById('sbpName').style.color=rc;
  document.getElementById('sbpRar').textContent=rarLabel+' '+item.type;
  document.getElementById('sbpRar').style.color=rc;
  const statsHTML=Object.entries(item.stats).filter(([k,v])=>v).map(([k,v])=>`${v>0?'+':''}${v} ${k.toUpperCase()}`).join('<br>');
  document.getElementById('sbpStats').innerHTML=statsHTML||'No stats';
  document.getElementById('shopBuyPrompt').classList.add('open');
}

function shopBuyEquip(){
  document.getElementById('shopBuyPrompt').classList.remove('open');
  // Find the item we just added in inventory and equip it
  const idx=G.inventory.findIndex(i=>i&&i.name===_lastBoughtItem.name);
  if(idx!==-1){
    const item=G.inventory[idx];
    if(G.equipped[item.slot]){removeItemStats(G.equipped[item.slot]);addItem({...G.equipped[item.slot]});}
    G.equipped[item.slot]=item;
    applyItemStats(item);
    G.inventory[idx]=null;
    AUDIO.sfx.equip();
  }
  _lastBoughtItem=null; _lastBoughtSlot=null;
  cfRenderTab('shop');
}

function shopBuyKeep(){
  document.getElementById('shopBuyPrompt').classList.remove('open');
  _lastBoughtItem=null; _lastBoughtSlot=null;
  document.getElementById('shopResult').textContent='✓ Added to inventory!';
  cfRenderTab('shop');
}

function cfDonateWizard(amount){
  if(!G||G.gold<amount) return;
  G.gold -= amount;
  const newTotal = addWizardDonation(amount);
  const tier = getShopTier();
  AUDIO.sfx.loot();
  if(newTotal===500||tier===2){
    log('🧙 The wizard grins. "Rare wares, unlocked for you." — Tier II shop unlocked!','l');
  } else if(newTotal>=2000&&tier===3){
    log('🧙 "You have my full inventory. Take what you need." — Tier III shop unlocked!','l');
  } else {
    log('🧙 "A generous soul. I shall remember." ('+newTotal+'g total donated)','l');
  }
  cfRenderTab('shop');
}

// ── CAMPFIRE INVENTORY + EQUIP TAB ──────────────────────────────────────────
function cfInventoryHTML(){
  const rc={common:'#6a5838',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#9b54bd',legendary:'var(--gold)'};
  const slots=[{k:'weapon',l:'WEAPON'},{k:'armor',l:'ARMOR'},{k:'offhand',l:'OFF-H'},{k:'ring',l:'RING'},{k:'helmet',l:'HELMET'},{k:'gloves',l:'GLOVES'},{k:'boots',l:'BOOTS'},{k:'amulet',l:'AMULET'}];

  // Equipped slots
  const eqHTML=slots.map(s=>{
    const it=G.equipped[s.k];
    const col=it?(rc[it.rarity]||'#888'):'var(--dim)';
    const stats=it?Object.entries(it.stats).filter(([,v])=>v).map(([k,v])=>`${v>0?'+':''}${v} ${k}`).join(' · '):'empty';
    return `<div class="cf-eq-row ${it?'cf-eq-filled':''}" onclick="${it?`cfUnequipAt('${s.k}')`:''}">
      <span class="cf-eq-slot-lbl">${s.l}</span>
      ${it?`<span class="cf-eq-icon">${it.icon}</span><span class="cf-eq-name" style="color:${col}">${it.name}</span><span class="cf-eq-stats">${stats}</span><span class="cf-eq-unequip">✕</span>`
          :`<span class="cf-eq-name" style="color:var(--dim);font-style:italic;">— empty —</span>`}
    </div>`;
  }).join('');

  // Inventory grid
  const invHTML=G.inventory.map((item,i)=>{
    if(!item)return`<div class="cf-inv-slot empty" data-idx="${i}" ondragover="cfInvDragOver(event,${i})" ondrop="cfInvDrop(event,${i})" ondragleave="cfInvDragLeave(event)">·</div>`;
    return`<div class="cf-inv-slot r-${item.rarity}" id="cfInvSlot${i}"
      draggable="true"
      data-idx="${i}"
      onclick="cfItemAction(${i})"
      ondragstart="cfInvDragStart(event,${i})"
      ondragend="cfInvDragEnd(event)"
      ondragover="cfInvDragOver(event,${i})"
      ondrop="cfInvDrop(event,${i})"
      ondragleave="cfInvDragLeave(event)"
    >${item.icon}${(item.qty||1)>1?`<div class="inv-qty">${item.qty}</div>`:''}</div>`;
  }).join('');

  return `<div class="cf-inv-panel">
    <div class="cf-inv-section-title">⚔ EQUIPPED</div>
    <div class="cf-eq-list">${eqHTML}</div>
    <div class="cf-inv-section-title" style="margin-top:14px;">🎒 INVENTORY</div>
    <div class="cf-inv-grid">${invHTML}</div>
    <div id="cfItemDetail" class="cf-item-detail"></div>
  </div>`;
}

function bindCfInventoryTooltips(){
  document.querySelectorAll('.cf-inv-slot[data-idx]').forEach(el=>{
    const i=parseInt(el.dataset.idx);
    el.addEventListener('mouseenter',e=>showInvTooltip(e,i));
    el.addEventListener('mouseleave',()=>hideInvTooltip());
  });
}


let _cfDragIdx = null;

function cfInvDragStart(e, idx){
  _cfDragIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
  // Use timeout so the element renders before going semi-transparent
  setTimeout(()=>{
    const el = document.querySelector(`.cf-inv-slot[data-idx="${idx}"]`);
    if(el) el.classList.add('dragging');
  }, 0);
}

function cfInvDragEnd(e){
  document.querySelectorAll('.cf-inv-slot').forEach(el=>{
    el.classList.remove('dragging','drag-over');
  });
  _cfDragIdx = null;
}

function cfInvDragOver(e, idx){
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if(_cfDragIdx === null || _cfDragIdx === idx) return;
  document.querySelectorAll('.cf-inv-slot').forEach(el=>el.classList.remove('drag-over'));
  const el = document.querySelector(`.cf-inv-slot[data-idx="${idx}"]`);
  if(el) el.classList.add('drag-over');
}

function cfInvDragLeave(e){
  e.currentTarget.classList.remove('drag-over');
}

function cfInvDrop(e, toIdx){
  e.preventDefault();
  const fromIdx = _cfDragIdx;
  if(fromIdx === null || fromIdx === toIdx) return;
  // Swap items
  const tmp = G.inventory[fromIdx];
  G.inventory[fromIdx] = G.inventory[toIdx];
  G.inventory[toIdx] = tmp;
  cfRenderTab('inventory');
}

function cfUnequipAt(slot){
  if(!G.equipped[slot])return;
  const item=G.equipped[slot];
  if(addItem({...item})){
    removeItemStats(item);
    G.equipped[slot]=null;
    AUDIO.sfx.equip();
    renderAll();
    cfRenderTab('inventory');
  } else {
    const d=document.getElementById('cfItemDetail');
    if(d){d.textContent='Inventory full!';d.style.color='var(--red2)';}
  }
}

function cfItemAction(idx){
  const item=G.inventory[idx];
  if(!item)return;
  const d=document.getElementById('cfItemDetail');
  const rc={common:'#6a5838',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#9b54bd',legendary:'var(--gold)'};
  const col=rc[item.rarity]||'#888';
  const stats=Object.entries(item.stats).filter(([,v])=>v).map(([k,v])=>`${v>0?'+':''}${v} ${k}`).join('  ');

  if(item.slot){
    // Equippable — show equip button
    if(d){d.innerHTML=`<span style="color:${col}">${item.icon} ${item.name}</span>
      <span style="color:var(--dim);font-size:9px;margin-left:6px;">${stats||''}</span>
      <button class="btn btn-green" style="padding:5px 14px;font-size:7px;margin-left:10px;" onclick="cfEquipItem(${idx})">EQUIP</button>
      <button class="btn" style="padding:5px 14px;font-size:7px;margin-left:6px;border-color:#5a3a1a;color:#c8a84b;" onclick="cfSellItem(${idx})">SELL 🪙${Math.floor(item.value*.5)}</button>
    `;}
  } else if(item.stats&&item.stats.heal){
    // Consumable
    if(d){d.innerHTML=`<span style="color:${col}">${item.icon} ${item.name}</span>
      <span style="color:var(--dim);font-size:9px;margin-left:6px;">Heals ${item.stats.heal} HP</span>
      <button class="btn" style="padding:5px 14px;font-size:7px;margin-left:10px;border-color:var(--green2);color:var(--green2);" onclick="cfUsePotion(${idx})">USE</button>
      <button class="btn" style="padding:5px 14px;font-size:7px;margin-left:6px;border-color:#5a3a1a;color:#c8a84b;" onclick="cfSellItem(${idx})">SELL 🪙${Math.floor(item.value*.5)}</button>
    `;}
  } else {
    // Material or other
    if(d){d.innerHTML=`<span style="color:${col}">${item.icon} ${item.name}</span>
      <span style="color:var(--dim);font-size:9px;margin-left:6px;">${item.type||'material'}</span>
      <button class="btn" style="padding:5px 14px;font-size:7px;margin-left:10px;border-color:#5a3a1a;color:#c8a84b;" onclick="cfSellItem(${idx})">SELL 🪙${Math.floor((item.value||2)*.5)}</button>
    `;}
  }
}

function cfEquipItem(idx){
  const item=G.inventory[idx];
  if(!item||!item.slot)return;
  if(G.equipped[item.slot]){removeItemStats(G.equipped[item.slot]);addItem({...G.equipped[item.slot]});}
  G.equipped[item.slot]=item;
  applyItemStats(item);
  G.inventory[idx]=null;
  AUDIO.sfx.equip();
  renderAll();
  cfRenderTab('inventory');
}

function cfUsePotion(idx){
  const item=G.inventory[idx];
  if(!item||!item.stats||!item.stats.heal)return;
  heal(item.stats.heal,item.name+' 🧪');
  item.qty=(item.qty||1)-1;
  if(item.qty<=0)G.inventory[idx]=null;
  renderAll();
  cfRenderTab('inventory');
}

function cfSellItem(idx){
  const item=G.inventory[idx];
  if(!item)return;
  G.gold+=Math.floor((item.value||2)*.5*(item.qty||1));
  G.inventory[idx]=null;
  log('Sold '+item.name,'l');
  renderAll();
  cfRenderTab('inventory');
}

function cfEventHTML(){
  // Locked until the player takes a long rest
  if(!G.eventUnlockedByRest&&!G.eventUsedThisRest){
    return `<div class="event-panel" style="text-align:center;padding:24px 16px;">
      <div style="font-size:28px;margin-bottom:12px;filter:grayscale(1);opacity:0.4;">🎲</div>
      <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:var(--dim);margin-bottom:10px;line-height:1.8;">FATE AWAITS</div>
      <div style="font-size:13px;color:var(--dim);line-height:1.7;max-width:280px;margin:0 auto;">Take a Long Rest first — the world reveals its mysteries only to those who sleep beneath the stars.</div>
    </div>`;
  }
  // If event was used this rest, show resolved state
  if(G.eventUsedThisRest){
    return `<div class="event-panel">
      <div class="panel-title" style="margin-bottom:10px;">${G._lastEventTitle||'Event'}</div>
      <div class="ev-text" style="color:var(--dim);font-style:italic;">You have already made your choice.</div>
      <div class="ev-result show" style="margin-top:16px;">${G._lastEventResult||''}</div>
    </div>`;
  }
  if(!cfCurrentEvent){
    const zoneId=ZONES[G.zoneIdx].id;
    const eligible=RANDOM_EVENTS.filter(e=>!e.zones||e.zones.includes(zoneId));
    const pool=eligible.length>0?eligible:RANDOM_EVENTS;
    cfCurrentEvent=pool[Math.floor(Math.random()*pool.length)];
  }
  const ev=cfCurrentEvent;
  // Zone 3+: inject class set item as bonus choice if player doesn't have the full set
  let extraChoice='';
  if(G.zoneIdx>=2){
    const classSetItems=ITEMS.filter(i=>i.forClass===G.classId&&i.set);
    const owned=new Set([
      ...Object.values(G.equipped||{}).filter(Boolean).map(i=>i.id),
      ...(G.inventory||[]).filter(Boolean).map(i=>i.id)
    ]);
    const available=classSetItems.filter(i=>!owned.has(i.id));
    if(available.length>0){
      const setId=available[0].set;
      const setName=SET_BONUSES[setId]?.name||'Class Set';
      extraChoice=`<button class="ev-choice" style="border-color:#9b54bd;color:#c07aee;" onclick="cfResolveEventClassSet()">✦ Claim a ${setName} piece (class reward)</button>`;
    }
  }
  return `<div class="event-panel">
    <div class="panel-title" style="margin-bottom:10px;">${ev.title}</div>
    <div class="ev-text">${ev.text}</div>
    <div class="ev-choices">
      ${ev.choices.map((c,i)=>`<button class="ev-choice" onclick="cfResolveEvent(${i})">${c.text}</button>`).join('')}
      ${extraChoice}
    </div>
    <div class="ev-result" id="evResult"></div>
  </div>`;
}

function cfResolveEventClassSet(){
  const classSetItems=ITEMS.filter(i=>i.forClass===G.classId&&i.set);
  const owned=new Set([
    ...Object.values(G.equipped||{}).filter(Boolean).map(i=>i.id),
    ...(G.inventory||[]).filter(Boolean).map(i=>i.id)
  ]);
  const available=classSetItems.filter(i=>!owned.has(i.id));
  if(!available.length){cfRenderTab('event');return;}
  const item={...available[Math.floor(Math.random()*available.length)]};
  const setDef=SET_BONUSES[item.set];
  const el=document.getElementById('evResult');
  if(addItem(item)){
    G.totalItems++;AUDIO.sfx.loot();
    const result=`✦ You received: ${item.icon} ${item.name}! (${setDef?.name||item.set} — ${3-available.length+1}/3 pieces)`;
    if(el){el.textContent=result;el.className='ev-result show';}
    document.querySelectorAll('.ev-choice').forEach(b=>b.disabled=true);
    G.eventUsedThisRest=true;
    G._lastEventResult=result;
    G._lastEventTitle=cfCurrentEvent?.title||'Class Reward';
    log('✦ CLASS SET PIECE: '+item.name+' claimed from event!','l');
  } else {
    if(el){el.textContent='✗ Inventory full! Make room first.';el.className='ev-result show';}
  }
}

function cfResolveEvent(idx){
  const ev=cfCurrentEvent;
  const choice=ev.choices[idx];
  const result=choice.outcome(G);
  const el=document.getElementById('evResult');
  if(el){el.textContent=result||'...';el.className='ev-result show';}
  document.querySelectorAll('.ev-choice').forEach(b=>b.disabled=true);
  G.eventUsedThisRest=true;
  G._lastEventResult=result||'...';
  G._lastEventTitle=ev.title;
  // Don't null cfCurrentEvent — keep it so re-entering tab shows same resolved state
}

function quickUsePotion(){
  if(!G||!G.isPlayerTurn||paused)return;
  if(G.bonusUsed){log('Bonus action already used this turn!','s');return;}
  const idx=G.inventory.findIndex(i=>i&&(i.id==='hpPotion'||i.id==='strongPotion'||i.id==='elixir'));
  if(idx===-1){log('No potions in inventory!','s');return;}
  const item=G.inventory[idx];
  heal(item.stats.heal,item.name+' 🧪');
  item.qty=(item.qty||1)-1;
  if(item.qty<=0)G.inventory[idx]=null;
  G.bonusUsed=true; // costs your bonus action
  renderAll();
}

function updateCampBtn(){
  if(!G)return;
  const btn=document.getElementById('quickCampBtn');
  const prog=document.getElementById('campProgress');
  if(!btn)return;
  const unlocked=G.campUnlocked;
  if(unlocked){
    btn.disabled=false;
    btn.classList.remove('locked');
    if(prog)prog.textContent='';
  } else {
    btn.disabled=true;
    btn.classList.add('locked');
    btn.classList.remove('unlocked-flash');
    if(prog)prog.textContent=G.dungeonFights+'/'+G.dungeonGoal;
  }
}

function flashCampBtn(){
  const btn=document.getElementById('quickCampBtn');
  if(!btn)return;
  btn.classList.remove('locked');
  btn.classList.add('unlocked-flash');
  btn.disabled=false;
  const prog=document.getElementById('campProgress');
  if(prog)prog.textContent='';
  setTimeout(()=>btn.classList.remove('unlocked-flash'),1400);
}

function quickCampfire(){
  if(!G||paused)return;
  if(G.currentEnemy&&G.currentEnemy.hp>0){
    log('Cannot camp while in combat!','s');return;
  }
  if(!G.campUnlocked&&!G.bossDefeated[G.zoneIdx]){
    log('Fight through the dungeon first! ('+G.dungeonFights+'/'+G.dungeonGoal+' enemies)','s');return;
  }
  showCampfire();
}

function updateQuickButtons(){
  if(!G)return;
  const potBtn=document.getElementById('quickPotionBtn');
  if(!potBtn)return;
  const hasPotion=G.inventory.some(i=>i&&(i.id==='hpPotion'||i.id==='strongPotion'||i.id==='elixir'));
  potBtn.disabled=!hasPotion||!G.isPlayerTurn||G.bonusUsed||paused;
}

function continueJourney(){
  cfCurrentEvent=null;
  if(G){G.eventUsedThisRest=false;G._lastEventResult='';G._lastEventTitle='';G.eventUnlockedByRest=false;}
  if(G.runBossDefeated[G.zoneIdx]&&G.zoneIdx<ZONES.length-1){
    // Send player to Elderfen between zones
    fadeToScreen('town', ()=>showTownHub());
  } else if(G.runBossDefeated[G.zoneIdx]&&G.zoneIdx>=ZONES.length-1){
    log('You have conquered all known zones. The darkness retreats... for now.','l');
    showMap();
  } else {
    // Mid-zone rest — return to battle with fresh enemy, reset dungeon run
    const bgmForZone=ZONES[G.zoneIdx]?.id||'woods';
    const bgmMapContinue={woods:'woods',outpost:'outpost',castle:'castle',underdark:'underdark',abyss:'abyss',frostpeak:'abyss',celestial:'abyss',shadowrealm:'abyss'};
    AUDIO.playBGM(bgmMapContinue[bgmForZone]||'woods');
    G.dungeonFights=0;
    G.campUnlocked=false;
    G.dungeonGoal=3;
    showScreen('game');
    renderAll();
    updateCampBtn();
    spawnEnemy();
  }
}

// ══════════════════════════════════════════════════════════
//  WORLD MAP
// ══════════════════════════════════════════════════════════
const MAP_NODES=[
  {id:'woods',     label:'Whispering\nWoods',    x:80,  y:220, zone:0},
  {id:'fungal',    label:'Fungal\nWarren',        x:80,  y:330, zone:null, branch:'fungalwarren', dotted:true},
  {id:'outpost',   label:'Ruined\nOutpost',       x:210, y:160, zone:1},
  {id:'vault',     label:'Sunken\nVault',         x:160, y:290, zone:null, branch:'sunkenvault',  dotted:true},
  {id:'castle',    label:'Thornwall\nCastle',     x:340, y:230, zone:2},
  {id:'catacombs', label:'The\nCatacombs',        x:290, y:340, zone:null, branch:'catacombs',    dotted:true},
  {id:'underdark', label:'The\nUnderdark',        x:460, y:150, zone:3},
  {id:'ashen',     label:'Ashen\nWastes',         x:420, y:290, zone:null, branch:'ashenwastes',  dotted:true},
  {id:'abyss',     label:'Abyssal\nGate',         x:560, y:250, zone:4},
  {id:'frostpeak', label:'Frostveil\nPeaks',      x:650, y:140, zone:5},
  {id:'celestial', label:'Celestial\nPlane',      x:710, y:280, zone:6},
  {id:'shadowrealm',label:'Shadow\nRealm',        x:740, y:170, zone:7},
];

const MAP_EDGES=[
  ['woods','outpost',false],
  ['woods','fungal',true],
  ['outpost','vault',true],
  ['outpost','castle',false],
  ['castle','catacombs',true],
  ['castle','underdark',false],
  ['underdark','ashen',true],
  ['underdark','abyss',false],
  ['abyss','frostpeak',false],
  ['frostpeak','celestial',false],
  ['celestial','shadowrealm',false],
];

function showMap(postBoss){
  G._postBossMap = !!postBoss;
  renderWorldMap();
  showScreen('map');
  const closeBtn = document.getElementById('mapCloseBtn');
  if(closeBtn) closeBtn.style.display = postBoss ? 'none' : 'block';
}

function renderWorldMap(){
  const svg=document.getElementById('mapSvg');
  const area=document.getElementById('worldMapArea');
  svg.innerHTML='';
  area.querySelectorAll('.map-node').forEach(n=>n.remove());

  MAP_EDGES.forEach(([a,b,dotted])=>{
    const na=MAP_NODES.find(n=>n.id===a);const nb=MAP_NODES.find(n=>n.id===b);
    if(!na||!nb)return;
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    const W=780,H=380;
    line.setAttribute('x1',na.x/W*100+'%');line.setAttribute('y1',na.y/H*100+'%');
    line.setAttribute('x2',nb.x/W*100+'%');line.setAttribute('y2',nb.y/H*100+'%');
    line.setAttribute('stroke',dotted?'#2a2a20':'#3a3028');
    line.setAttribute('stroke-width','2');
    if(dotted)line.setAttribute('stroke-dasharray','6,4');
    svg.appendChild(line);
  });

  MAP_NODES.forEach(node=>{
    const isBranchNode = node.branch != null;
    const isMainNode   = node.zone  != null;

    // Main node unlock/clear state — use runBossDefeated for navigation (this run only)
    const runDefeated = G.runBossDefeated || [];
    const cleared   = isMainNode && runDefeated[node.zone];
    const isCur     = isMainNode && node.zone === G.zoneIdx;
    const unlocked  = isMainNode && (node.zone===0 || runDefeated[node.zone-1] || cleared);

    // Branch node state — must beat linked boss THIS run
    let branchCleared=false, branchUnlocked=false;
    if(isBranchNode){
      const bDef = BRANCH_ZONES.find(b=>b.id===node.branch);
      branchCleared  = G.branchDefeated && G.branchDefeated[node.branch];
      branchUnlocked = bDef && runDefeated[bDef.unlocksAfter] && !branchCleared;
    }

    const el=document.createElement('div');
    let cls='map-node ';
    if(isBranchNode){
      cls += branchCleared?'cleared branch-node':branchUnlocked?'branch-node unlocked':'branch-node locked';
    } else {
      cls += cleared?'cleared':isCur?'current':unlocked?'unlocked':'locked';
    }
    el.className=cls;
    el.style.left=(node.x/780*100)+'%';
    el.style.top=(node.y/380*100)+'%';

    const dotChar = isBranchNode
      ? (branchCleared?'✓':branchUnlocked?'★':'?')
      : (cleared?'✓':isCur?'★':'◆');

    // Action label shown on clickable nodes
    let actionLabel = '';
    if(isBranchNode && branchUnlocked) actionLabel = '<div class="mn-action">▶ ENTER</div>';
    else if(!isBranchNode && unlocked && !isCur && !cleared) actionLabel = '<div class="mn-action">▶ TRAVEL</div>';
    else if(!isBranchNode && isCur && !cleared) actionLabel = '<div class="mn-action" style="color:var(--gold)">★ HERE</div>';
    else if(cleared) actionLabel = '<div class="mn-action" style="color:var(--green2)">✓ CLEARED</div>';

    const labelSuffix = isBranchNode && !branchCleared ? '<br><span style="font-size:6px;color:#aa8830;">★ SIDE QUEST</span>' : '';
    el.innerHTML=`<div class="mn-dot">${dotChar}</div><div class="mn-label">${node.label}${labelSuffix}</div>${actionLabel}`;

    if(isBranchNode && branchUnlocked){
      el.onclick=()=>travelToBranch(node.branch);
    } else if(!isBranchNode && unlocked && !isCur && !cleared){
      el.onclick=()=>travelToZone(node.zone);
    }
    area.appendChild(el);
  });
}

function travelToZone(zoneIdx){
  G.zoneIdx=zoneIdx;G.zoneKills=0;G.bossReady=false;
  G.dungeonFights=0;G.campUnlocked=false;G.dungeonGoal=3;
  G.restsThisZone=0;
  G.hp=G.maxHp;
  G.conditions=[];G.conditionTurns={};G.sx={};G.raging=false;G.hunterMarked=false;G.concentrating=null;
  G.wildShapeHp=0;G.wildShapeActive=false;G.spiritualWeaponActive=false;G.spiritualWeaponTurns=0;
  G.skillCooldowns={};
  // Restore all skill charges on zone travel (full rest between zones)
  G.skillCharges={};
  CLASSES[G.classId].skills.forEach(sk=>{ if(sk.charges) G.skillCharges[sk.id]=sk.charges; });
  // Restore druid sprite on zone travel
  if(G.classId==='druid'){const p=document.getElementById('playerSprite');if(p&&CLASS_SPRITES.druid)renderSprite(CLASS_SPRITES.druid,14,p);if(p)p.style.filter='';startPlayerAnim();}
  const exitBtnZ=document.getElementById('exitWildShapeBtn');if(exitBtnZ)exitBtnZ.style.display='none';
  if(G.classId!=='wizard'){G.res=G.resMax;}
  else if(G.spellSlots&&G.spellSlotsMax){
    for(const lvl of Object.keys(G.spellSlotsMax))G.spellSlots[lvl]=G.spellSlotsMax[lvl];
  }
  // Restore paladin Lay on Hands pool on zone travel
  if(G.classId==='paladin')G.layOnHandsPool=Math.floor(G.level*5*(G.talents.includes('Lay on Hands+')?1.5:1));
  G.currentEnemy=null;
  document.getElementById('bossAlert').style.display='none';
  showStoryIntro(zoneIdx);
}

function closeMap(){
  G._postBossMap = false;
  showScreen('game');
  setupGameUI();
  const neb=document.getElementById('nextEnemyBtn');
  if(!G.currentEnemy&&neb&&neb.style.display==='block'){
    neb.style.display='block';
  } else if(!G.currentEnemy){
    spawnEnemy();
  }
}

// ══════════════════════════════════════════════════════════
//  CHAR SHEET
// ══════════════════════════════════════════════════════════
function toggleCharDrawer(){
  const drawer=document.getElementById('charDrawer');
  const backdrop=document.getElementById('charDrawerBackdrop');
  if(!drawer)return;
  const isOpen=drawer.classList.toggle('open');
  if(backdrop) backdrop.classList.toggle('open',isOpen);
  if(isOpen&&G) renderInlineCharSheet();
}

// Legacy alias (still called from setupGameUI)
function toggleInlineCharSheet(){ toggleCharDrawer(); }

function renderInlineCharSheet(){
  const body=document.getElementById('csiBody');
  if(!body||!G)return;
  const cls=CLASSES[G.classId];
  const abilities=['str','dex','con','int','wis','cha'];
  const rarityColor={common:'#4a4038',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#8b44ad',legendary:'var(--gold)'};
  const row=(k,v,col)=>`<div class="csi-row"><span>${k}</span><span class="csi-val" style="${col?'color:'+col:''}">${v}</span></div>`;
  const section=(t)=>`<div class="csi-section">${t}</div>`;

  body.innerHTML=`
    <div class="csi-cols">
      <div class="csi-col">
        ${section('CORE')}
        ${row('Class',cls.name)}
        ${row('Subclass',G.subclassUnlocked?cls.subclass.name:'(Lv3)')}
        ${row('Level',G.level)}
        ${row('Prof','+'+G.profBonus)}
        ${row('HP',Math.ceil(G.hp)+'/'+G.maxHp,'var(--green2)')}
        ${(()=>{
          const inBear=G.classId==='druid'&&G.wildShapeActive&&G._humanStats;
          const atkLabel='ATK'+(inBear?'  🐻':'');
          const atkColor=inBear?'#cd853f':'#e74c3c';
          const atkVal=G.atk+(G.magBonus>0?' (+'+G.magBonus+'✨)':'')+(inBear?' [BEAR]':'');
          return row(atkLabel,atkVal,atkColor);
        })()}
        ${row('DEF',G.def,'#3498db')}
        ${row('Crit',(G.critRange-(G.critBonus||0))+'-20','var(--gold)')}
        ${row('Gold','🪙'+G.gold)}
        ${row('Kills',G.totalKills)}
        ${section('ABILITY SCORES')}
        <div class="csi-ability-row">
          ${abilities.map(a=>{
            const inBear=G.classId==='druid'&&G.wildShapeActive&&G._humanStats;
            const boosted=inBear&&(a==='str'||a==='con')&&G.stats[a]>(G._humanStats[a]||0);
            const glowStyle=boosted?'background:rgba(139,100,0,0.25);border:1px solid #cd853f;border-radius:3px;':'';
            const scoreColor=boosted?'color:#cd853f;text-shadow:0 0 6px #cd853f;':'';
            const modColor=boosted?'color:#cd853f;':'';
            return `<div class="csi-ab" style="${glowStyle}">
              <span class="csi-ab-name">${a.toUpperCase()}${boosted?'<span style="color:#cd853f;font-size:4px;"> ▲</span>':''}</span>
              <span class="csi-ab-score" style="${scoreColor}">${G.stats[a]}</span>
              <span class="csi-ab-mod" style="${modColor}">${md(G.stats[a])>=0?'+':''}${md(G.stats[a])}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="csi-col">
        ${section('EQUIPMENT')}
        ${['weapon','armor','ring','offhand','helmet','gloves','boots','amulet'].map(slot=>{const item=G.equipped[slot];return row(slot.toUpperCase(),item?item.icon+' '+item.name:'—',item?rarityColor[item.rarity]:'var(--dim)');}).join('')}
        ${section('SAVING THROWS')}
        ${(cls.saves||[]).map(s=>row(s.toUpperCase()+' Save','+'+( md(G.stats[s])+G.profBonus),'var(--gold2)')).join('')}
        ${section('CONDITIONS')}
        ${G.conditions.length?G.conditions.map(c=>`<div class="csi-row" style="color:#9b59b6;">⚠ ${c}</div>`).join(''):'<div class="csi-row" style="color:var(--dim)">None</div>'}
        ${section('SKILL CHARGES')}
        ${cls.skills.filter(sk=>sk.charges).map(sk=>{
          const left=G.skillCharges[sk.id]||0;
          const pips=Array.from({length:sk.charges},(_,i)=>i<left?'●':'○').join('');
          return row(sk.name,pips,'var(--gold)');
        }).join('')}
      </div>
      <div class="csi-col">
        ${section('TALENTS')}
        ${G.talents.length?G.talents.map(t=>{const td=(TALENT_POOLS[G.classId]||[]).find(p=>p.name===t);return`<div class="csi-talent"><div class="csi-talent-name">${td?td.icon:''} ${t}</div><div class="csi-talent-desc">${td?td.desc:''}</div></div>`;}).join(''):'<div style="color:var(--dim);font-size:12px;padding:4px;">None yet.</div>'}
        ${section('CLASS SKILLS')}
        ${cls.skills.filter(sk=>(!sk.subclassOnly||G.subclassUnlocked)&&(!sk.ultimateOnly||G.ultimateUnlocked)).map(sk=>`<div class="csi-talent"><div class="csi-talent-name">${sk.icon} ${sk.name} <span style="color:var(--dim);font-size:5px;">[${sk.type.toUpperCase()}]</span></div><div class="csi-talent-desc">${sk.desc}</div></div>`).join('')}
        ${(()=>{
          if(typeof getEquippedGraces!=='function') return '';
          const graces = getEquippedGraces(G.classId).filter(Boolean);
          if(!graces.length) return section('GRACES')+'<div style="color:var(--dim);font-size:12px;padding:4px;">None equipped.</div>';
          const rc={uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#9b54bd',legendary:'var(--gold)'};
          return section('GRACES')+graces.map(g=>{
            const statsStr=Object.entries(g.stats).map(([k,v])=>'+'+v+' '+k).join(' · ');
            return '<div class="csi-talent"><div class="csi-talent-name" style="color:'+(rc[g.rarity]||'#888')+'">'+g.icon+' '+g.name+'</div><div class="csi-talent-desc">'+statsStr+'</div></div>';
          }).join('');
        })()}
      </div>
    </div>
  `;
}

function showCharSheet(){
  renderCharSheet();
  showScreen('charsheet');
}

function renderCharSheet(){
  const cls=CLASSES[G.classId];
  const abilities=['str','dex','con','int','wis','cha'];
  const rarityColor={common:'#4a4038',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#8b44ad',legendary:'var(--gold)'};
  document.getElementById('csGrid').innerHTML=`
    <div class="cs-panel">
      <div class="panel-title">CORE</div>
      ${[['Class',cls.name],['Subclass',G.subclassUnlocked?cls.subclass.name:'(Unlocks Lv3)'],['Level',G.level],['Proficiency','+'+G.profBonus],['HP',Math.ceil(G.hp)+'/'+G.maxHp],['ATK',G.atk+(G.magBonus>0?' (+'+G.magBonus+'✨)':'')],['DEF',G.def],['Crit',(G.critRange-(G.critBonus||0))+'-20'],['Gold','🪙'+G.gold],['Kills',G.totalKills]].map(([k,v])=>`<div class="cs-row"><span>${k}</span><span class="cs-val">${v}</span></div>`).join('')}
      <div class="panel-title" style="margin-top:6px;">ABILITIES</div>
      <div class="ability-grid">${abilities.map(a=>`<div class="ability-box"><span class="ab-name">${a.toUpperCase()}</span><span class="ab-score">${G.stats[a]}</span><br><span class="ab-mod">${md(G.stats[a])>=0?'+':''}${md(G.stats[a])}</span></div>`).join('')}</div>
    </div>
    <div class="cs-panel">
      <div class="panel-title">EQUIPMENT</div>
      ${['weapon','armor','ring','offhand','helmet','gloves','boots','amulet'].map(slot=>{const item=G.equipped[slot];return`<div class="cs-row"><span style="color:var(--dim)">${slot.toUpperCase()}</span><span style="color:${item?rarityColor[item.rarity]:'var(--dim)'}">${item?item.icon+' '+item.name:'—'}</span></div>`;}).join('')}
      <div class="panel-title" style="margin-top:6px;">SAVES</div>
      ${(cls.saves||[]).map(s=>`<div class="cs-row"><span>${s.toUpperCase()} Save</span><span class="cs-val">+${md(G.stats[s])+G.profBonus}</span></div>`).join('')}
      <div class="panel-title" style="margin-top:6px;">CONDITIONS</div>
      ${G.conditions.length?G.conditions.map(c=>`<div class="cs-row" style="color:#9b59b6;">⚠ ${c}</div>`).join(''):'<div class="cs-row" style="color:var(--dim)">None</div>'}
    </div>
    <div class="cs-panel">
      <div class="panel-title">TALENTS</div>
      ${G.talents.length?G.talents.map(t=>{const td=(TALENT_POOLS[G.classId]||[]).find(p=>p.name===t);return`<div class="talent-entry"><div class="te-name">${td?td.icon:''} ${t}</div><div class="te-desc">${td?td.desc:''}</div></div>`;}).join(''):'<div class="talent-entry"><div class="te-desc" style="color:var(--dim)">No talents yet. Gain one at every 3rd level.</div></div>'}
      <div class="panel-title" style="margin-top:6px;">CLASS SKILLS</div>
      ${cls.skills.filter(sk=>(!sk.subclassOnly||G.subclassUnlocked)&&(!sk.ultimateOnly||G.ultimateUnlocked)).map(sk=>`<div class="talent-entry"><div class="te-name">${sk.icon} ${sk.name}</div><div class="te-desc">${sk.desc} [${sk.type}]</div></div>`).join('')}
    </div>
  `;
}

function closeCharSheet(){
  showScreen('game');
  // Only auto-spawn if player was actively in a fight before opening char sheet
  // Don't spawn if it's between fights (nextEnemyBtn was showing)
  const neb=document.getElementById('nextEnemyBtn');
  if(!G.currentEnemy&&neb&&neb.style.display==='block'){
    // Between fights — show the next enemy button state, don't auto-spawn
    neb.style.display='block';
  } else if(!G.currentEnemy){
    spawnEnemy();
  }
}

// ══════════════════════════════════════════════════════════
//  PAUSE & HELP
// ══════════════════════════════════════════════════════════
// ── AUDIO PANEL CONTROLS ─────────────────────────────────
let _musicMuted=false;
let _sfxMuted=false;
let _audioPanelOpen=false;

function toggleAudioPanel(){
  _audioPanelOpen=!_audioPanelOpen;
  const panel=document.getElementById('audioPanel');
  const btn=document.getElementById('audioToggleBtn');
  if(panel)panel.classList.toggle('open',_audioPanelOpen);
  if(btn)btn.style.borderColor=_audioPanelOpen?'var(--gold)':'';
}

// Close panel when clicking outside
document.addEventListener('click',function(e){
  if(_audioPanelOpen){
    const wrap=document.getElementById('audioPanelWrap');
    if(wrap&&!wrap.contains(e.target)){
      _audioPanelOpen=false;
      const panel=document.getElementById('audioPanel');
      if(panel)panel.classList.remove('open');
      const btn=document.getElementById('audioToggleBtn');
      if(btn)btn.style.borderColor='';
    }
  }
});

function onMusicVol(v){
  const vol=Number(v)/100;
  AUDIO.setMusicVol(_musicMuted?0:vol);
  // Sync all music vol elements
  ['musicVolNum','titleMusicVolNum'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=v;});
  ['musicSlider','titleMusicSlider'].forEach(id=>{const el=document.getElementById(id);if(el&&el.value!=v)el.value=v;});
  _updateAudioIcon();
}

function onSfxVol(v){
  const vol=Number(v)/100;
  AUDIO.setSfxVol(_sfxMuted?0:vol);
  // Sync all sfx vol elements
  ['sfxVolNum','titleSfxVolNum'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=v;});
  ['sfxSlider','titleSfxSlider'].forEach(id=>{const el=document.getElementById(id);if(el&&el.value!=v)el.value=v;});
  _updateAudioIcon();
}

function updateTitleAudioBtns(){
  const mm=document.getElementById('titleMuteMusicBtn');
  const ms=document.getElementById('titleMuteSfxBtn');
  if(mm)mm.className='audio-mute-btn'+(_musicMuted?' active':'');
  if(ms)ms.className='audio-mute-btn'+(_sfxMuted?' active':'');
  // Also keep in-game mute buttons in sync
  const mm2=document.getElementById('muteMusicBtn');
  const ms2=document.getElementById('muteSfxBtn');
  if(mm2)mm2.classList.toggle('active',_musicMuted);
  if(ms2)ms2.classList.toggle('active',_sfxMuted);
}
function toggleMuteMusic(){
  _musicMuted=!_musicMuted;
  const btn=document.getElementById('muteMusicBtn');
  if(btn)btn.classList.toggle('active',_musicMuted);
  const sliderVal=Number(document.getElementById('musicSlider')?.value||35);
  AUDIO.setMusicVol(_musicMuted?0:sliderVal/100);
  if(!_musicMuted){
    const bgmMap=['woods','outpost','castle','underdark','abyss'];
    if(G&&G.currentEnemy&&G.currentEnemy.isBoss)AUDIO.playBGM('boss');
    else if(G)AUDIO.playBGM(bgmMap[G.zoneIdx]||'woods');
  } else {
    AUDIO.stopBGM();
  }
  _updateAudioIcon();
  updateTitleAudioBtns();
}

function toggleMuteSfx(){
  _sfxMuted=!_sfxMuted;
  const btn=document.getElementById('muteSfxBtn');
  if(btn)btn.classList.toggle('active',_sfxMuted);
  const sliderVal=Number(document.getElementById('sfxSlider')?.value||55);
  AUDIO.setSfxVol(_sfxMuted?0:sliderVal/100);
  _updateAudioIcon();
  updateTitleAudioBtns();
}

function _updateAudioIcon(){
  const btn=document.getElementById('audioToggleBtn');
  if(!btn)return;
  if(_musicMuted&&_sfxMuted) btn.textContent='🔇';
  else if(_musicMuted) btn.textContent='🎵';
  else if(_sfxMuted) btn.textContent='💥';
  else btn.textContent='🔊';
}

// Keep old toggleAudio as no-op for any lingering refs
function toggleAudio(){}

function togglePause(){
  paused=!paused;
  const btn=document.getElementById('pauseBtn');
  const townBtn=document.getElementById('townPauseBtn');
  if(paused){
    document.getElementById('pause-overlay').classList.add('open');
    if(btn)btn.className='topbar-btn paused';
    if(townBtn){townBtn.style.borderColor='var(--gold)';townBtn.style.color='var(--gold)';}
    if(enemyTurnTimeout){clearTimeout(enemyTurnTimeout);enemyTurnTimeout=null;}
    hideReactionPrompt();
  } else {
    document.getElementById('pause-overlay').classList.remove('open');
    if(btn)btn.className='topbar-btn';
    if(townBtn){townBtn.style.borderColor='var(--border)';townBtn.style.color='var(--dim)';}
    if(G&&!G.isPlayerTurn&&G.currentEnemy){
      enemyTurnTimeout=setTimeout(doEnemyTurn,800);
    }
  }
  renderSkillButtons();
}

function quitToTitle(){
  // confirm() is blocked in iframes — use the pause overlay with a confirm step
  const pauseBox=document.querySelector('.pause-box');
  pauseBox.innerHTML=`
    <div class="pause-title" style="font-size:13px;color:var(--red2);">QUIT TO TITLE?</div>
    <div style="font-size:16px;color:var(--dim);margin-bottom:20px;">All progress will be lost.</div>
    <div class="pause-btns">
      <button class="btn btn-red" style="font-size:9px;" onclick="doQuitToTitle()">YES — QUIT</button>
      <button class="btn" style="font-size:9px;" onclick="restorePauseMenu()">NO — GO BACK</button>
    </div>`;
}

function doQuitToTitle(){
  if(typeof stopPlayTimer==='function') stopPlayTimer();
  if(typeof _enemyTurnQueue!=='undefined'){_enemyTurnQueue=[];_enemyTurnQueueIdx=0;}
  if(G && typeof autoSave==='function') autoSave();
  if(G)G._dyingFlag=false;
  G=null;
  paused=false;
  pendingLevelUps=[];
  levelUpShowing=false;
  cfCurrentEvent=null;
  if(enemyTurnTimeout){clearTimeout(enemyTurnTimeout);enemyTurnTimeout=null;}
  if(reactionTimer){clearTimeout(reactionTimer);reactionTimer=null;}
  // Close all overlays consistently using classList only
  document.querySelectorAll('[id$="-overlay"]').forEach(el=>{
    el.classList.remove('open');
  });
  restorePauseMenu();
  showScreen('title');
}

function restorePauseMenu(){
  const pauseBox=document.querySelector('.pause-box');
  pauseBox.innerHTML=`
    <div class="pause-title">⏸ PAUSED</div>
    <div class="pause-btns">
      <button class="btn btn-gold" onclick="togglePause()">▶ RESUME</button>
      <button class="btn" onclick="openHelp()">? HOW TO PLAY</button>
      <button class="btn" style="border-color:#4a3a18;color:#c8a84b;" onclick="returnToTown()">🏘 RETURN TO TOWN</button>
      <button class="btn btn-red" onclick="quitToTitle()">✗ QUIT TO TITLE</button>
    </div>`;
}

function openHelp(){document.getElementById('help-overlay').classList.add('open');}
function closeHelp(){document.getElementById('help-overlay').classList.remove('open');}

function returnToTown(){
  // Close pause overlay and clean up combat state
  paused=false;
  document.getElementById('pause-overlay').classList.remove('open');
  const btn=document.getElementById('pauseBtn');
  if(btn) btn.className='topbar-btn';
  restorePauseMenu();
  // Clean up any active timers
  if(typeof enemyTurnTimeout!=='undefined'&&enemyTurnTimeout){clearTimeout(enemyTurnTimeout);enemyTurnTimeout=null;}
  if(typeof reactionTimer!=='undefined'&&reactionTimer){clearTimeout(reactionTimer);reactionTimer=null;}
  // Reset combat state so re-entering zone works cleanly
  if(G){
    G.currentEnemy=null;
    G.isPlayerTurn=true;
    G.actionUsed=false;
    G.bonusUsed=false;
    G.reactionUsed=false;
    G.conditions=[];
    G.conditionTurns={};
  }
  if(typeof autoSave==='function') autoSave();
  showTownHub();
}

// ══════════════════════════════════════════════════════════
//  FLOATERS & ANIMATIONS
// ══════════════════════════════════════════════════════════
function spawnFloater(val,type,onRight){
  const stage=document.getElementById('battleStage');if(!stage)return;

  // Splat shape colors per type (RS-style)
  // dmg=red, crit=orange/yellow, heal=green, miss=blue-gray, cond=purple
  const cfg={
    dmg:  {fill:'#c0392b',stroke:'#7b241c',rim:'#e74c3c'},
    crit: {fill:'#e67e22',stroke:'#935116',rim:'#f39c12'},
    heal: {fill:'#1e8449',stroke:'#145a32',rim:'#27ae60'},
    miss: {fill:'#566573',stroke:'#2c3e50',rim:'#7f8c8d'},
    cond: {fill:'#6c3483',stroke:'#4a235a',rim:'#8e44ad'},
  };
  const c=cfg[type]||cfg.dmg;
  const txt=type==='heal'?'+'+val:type==='miss'?'MISS':type==='crit'?val+'!':String(val);

  // RS splat is a 4-pointed star / diamond blob shape
  const svg=`<svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2 Q28 12 42 22 Q28 32 22 42 Q16 32 2 22 Q16 12 22 2Z"
      fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>
    <path d="M22 6 Q27 14 38 22 Q27 30 22 38 Q17 30 6 22 Q17 14 22 6Z"
      fill="${c.rim}" opacity="0.3"/>
  </svg>`;

  const wrap=document.createElement('div');
  wrap.className=`splat splat-${type}`;

  // Randomize position on the sprite
  const baseLeft=onRight?52:8;
  const jitterX=(Math.random()-0.5)*18;
  const jitterY=(Math.random()-0.5)*12;
  wrap.style.left=(baseLeft+jitterX)+'%';
  wrap.style.top=(30+jitterY)+'px';

  const svgWrap=document.createElement('div');
  svgWrap.innerHTML=svg;

  const numEl=document.createElement('div');
  numEl.className='splat-num';
  numEl.textContent=txt;

  wrap.appendChild(svgWrap);
  wrap.appendChild(numEl);
  stage.appendChild(wrap);
  setTimeout(()=>wrap.remove(),1450);
}

function animEl(id,cls,duration){
  const el=document.getElementById(id);if(!el)return;
  el.classList.add(cls);
  setTimeout(()=>el.classList.remove(cls),duration);
}

// ══════════════════════════════════════════════════════════
//  LOGGER
// ══════════════════════════════════════════════════════════
function log(msg,type='s'){
  const el=document.getElementById('battleLog');if(!el)return;
  const p=document.createElement('div');
  p.className={'p':'bl-p','e':'bl-e','s':'bl-s','l':'bl-l','c':'bl-c','up':'bl-up'}[type]||'bl-s';
  p.textContent=msg;
  el.appendChild(p);el.scrollTop=el.scrollHeight;
  while(el.children.length>100)el.removeChild(el.firstChild);
}

// ══════════════════════════════════════════════════════════
//  OVERLAY HELPERS
// ══════════════════════════════════════════════════════════
function openOverlay(id){document.getElementById(id).classList.add('open');}
function closeOverlay(id){document.getElementById(id).classList.remove('open');}

let _genericConfirmCallback = null;
function showGenericConfirm(title, msg, yesLabel, onYes){
  _genericConfirmCallback = onYes;
  document.getElementById('genericConfirmTitle').textContent = title;
  document.getElementById('genericConfirmMsg').textContent = msg;
  document.getElementById('genericConfirmYesBtn').textContent = yesLabel;
  openOverlay('genericConfirmOverlay');
}
function genericConfirmYes(){
  closeOverlay('genericConfirmOverlay');
  if(_genericConfirmCallback){ const fn=_genericConfirmCallback; _genericConfirmCallback=null; fn(); }
}

// ══════════════════════════════════════════════════════════
//  SCREEN SWITCH
// ══════════════════════════════════════════════════════════
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+id).classList.add('active');
  if(id==='game'){
    if(G&&CLASS_SPRITES[G.classId])startPlayerAnim();
  } else if(id==='saveSlots'){
    if(typeof renderTitleSaveSlots==='function') renderTitleSaveSlots();
  } else if(id==='town'){
    const goldEl = document.getElementById('town-gold-display');
    if(goldEl && G) goldEl.textContent = G.gold + 'g';
  }
  // Stop town engine if leaving town
  if(id !== 'town' && typeof stopTownEngine === 'function') stopTownEngine(); else if(id==='title'){
    // nothing extra needed on title
  }
}

// Fade to black → switch screen → fade back in
function fadeToScreen(id, onMidpoint){
  const overlay = document.getElementById('fadeOverlay');
  if(!overlay){ showScreen(id); if(onMidpoint) onMidpoint(); return; }
  // Fade BGM out gently
  if(typeof AUDIO!=='undefined'&&AUDIO.bgm) try{ AUDIO.bgm.volume=0.0; } catch(e){}
  overlay.style.opacity='0';
  overlay.style.display='block';
  // Force reflow
  overlay.getBoundingClientRect();
  overlay.style.transition='opacity 0.8s ease';
  overlay.style.opacity='1';
  setTimeout(()=>{
    showScreen(id);
    if(onMidpoint) onMidpoint();
    overlay.style.transition='opacity 0.6s ease';
    overlay.style.opacity='0';
    setTimeout(()=>{ overlay.style.display='none'; }, 650);
  }, 850);
}

// ── Bootstrap audio on first ANY interaction ─────────────
(function(){
  let audioStarted = false;
  function startAudio(){
    if(audioStarted) return;
    audioStarted = true;
    AUDIO.init();
    AUDIO.resume();
    document.removeEventListener('click', startAudio);
    document.removeEventListener('keydown', startAudio);
  }
  document.addEventListener('click', startAudio);
  document.addEventListener('keydown', startAudio);
})();

// ── Global ESC key → pause (works in game and town) ──────────────
document.addEventListener('keydown', function(e){
  if(e.key !== 'Escape') return;
  const gameActive = document.getElementById('screen-game')?.classList.contains('active');
  const townActive = document.getElementById('screen-town')?.classList.contains('active');
  if(!gameActive && !townActive) return;
  // Don't trigger if typing in an input or textarea
  if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  e.preventDefault();
  togglePause();
});

// ══════════════════════════════════════════════════════════
//  BUG LOG SYSTEM
// ══════════════════════════════════════════════════════════
const _bugEntries = [];
let _bugFilter = 'all';

// Seed with the 3 known fixed bugs from the last debug session
(function seedFixedBugs(){
  const fixes = [
    {
      level:'fixed',
      title:'setCooldown() — ReferenceError (FIXED)',
      detail:'Function was called in 4 places (sneak_attack, surge_strike, pickpocket, preserve_life) but never defined. Caused a JS ReferenceError crash every time those skills resolved. <code>setCooldown(skillId, seconds)</code> now defined as a helper that writes to <code>G.skillCooldowns</code>.',
    },
    {
      level:'fixed',
      title:'G._ultimateUsed not reset on long rest (FIXED)',
      detail:'All ultimates say "once per rest" but <code>cfDoRest()</code> only reset <code>_divineInterventionUsed</code> and <code>_undyingFuryUsed</code> — completely missing <code>_ultimateUsed</code>. After first use, ultimates were permanently locked for the entire run. Added <code>G._ultimateUsed=false</code> to rest logic.',
    },
    {
      level:'fixed',
      title:'Pickpocket material branch is a no-op (FIXED)',
      detail:'The 20% "steal material" outcome built a <code>mats</code> array (broken — filtered by <code>e.drop</code> which doesn\'t exist) then never added anything to inventory. Log message fired but player got nothing. Replaced with a zone-scaled material picker that calls <code>addItem()</code>.',
    },
  ];
  fixes.forEach(f => {
    _bugEntries.push({
      level: f.level,
      title: f.title,
      detail: f.detail,
      time: new Date().toLocaleTimeString(),
      ts: Date.now() - Math.floor(Math.random() * 120000),
    });
  });
})();

// Global error capture
window.addEventListener('error', function(e){
  bugLog('error',
    'Runtime Error: ' + (e.message||'Unknown error'),
    'File: <code>' + (e.filename||'unknown').split('/').pop() + '</code> · Line: <code>' + (e.lineno||'?') + '</code>' + (e.colno?' Col: <code>'+e.colno+'</code>':'')
  );
});
window.addEventListener('unhandledrejection', function(e){
  bugLog('error', 'Unhandled Promise Rejection', '<code>'+(e.reason||'unknown')+'</code>');
});

function bugLog(level, title, detail, silent){
  // silent = true means don't flash indicator (e.g. routine calls)
  if(level==='info' && silent) return; // suppress routine info noise
  _bugEntries.unshift({level, title, detail: detail||'', time: new Date().toLocaleTimeString(), ts: Date.now()});
  if(_bugEntries.length > 200) _bugEntries.length = 200;
  _refreshBugLog();
  if(!silent && (level==='error'||level==='warn')){
    _flashBugIndicator(level);
  }
}

function _flashBugIndicator(level){
  // Add a subtle flash to the pause button as a hint
  const btn = document.getElementById('pauseBtn');
  if(!btn) return;
  const orig = btn.style.borderColor;
  btn.style.borderColor = level==='error' ? '#c0392b' : '#c8a84b';
  setTimeout(() => { if(btn) btn.style.borderColor = orig; }, 1200);
}

function _refreshBugLog(){
  const body = document.getElementById('buglog-body');
  const empty = document.getElementById('buglog-empty');
  const counter = document.getElementById('buglog-count');
  if(!body || !counter) return;

  const filtered = _bugFilter === 'all' ? _bugEntries : _bugEntries.filter(e => e.level === _bugFilter);

  counter.textContent = _bugEntries.length + ' entr' + (_bugEntries.length===1?'y':'ies');

  if(!filtered.length){
    empty.style.display = 'block';
    empty.textContent = _bugFilter==='all' ? 'No entries yet.' : 'No '+_bugFilter+' entries.';
    body.innerHTML = '';
    body.appendChild(empty);
    return;
  }

  empty.style.display = 'none';

  const badgeMap = {
    fixed: '<span class="buglog-badge badge-fixed">FIXED</span>',
    error: '<span class="buglog-badge badge-error">ERROR</span>',
    warn:  '<span class="buglog-badge badge-warn">WARN</span>',
    info:  '<span class="buglog-badge badge-info">INFO</span>',
    note:  '<span class="buglog-badge badge-info">NOTE</span>',
  };

  body.innerHTML = filtered.map(e => `
    <div class="buglog-entry lvl-${e.level}">
      <span class="buglog-time">${e.time}</span>
      ${badgeMap[e.level]||badgeMap.info}
      <div class="buglog-msg">
        <span class="msg-title">${escHtml(e.title)}</span>
        ${e.detail ? `<span class="msg-detail">${e.detail}</span>` : ''}
      </div>
    </div>
  `).join('');
}

function escHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function setBugFilter(f){
  _bugFilter = f;
  document.querySelectorAll('.buglog-filter').forEach(b => {
    b.classList.remove('active','active-warn','active-error');
  });
  const btn = document.getElementById('filter-'+f);
  if(btn){
    if(f==='error') btn.classList.add('active-error');
    else if(f==='warn') btn.classList.add('active-warn');
    else btn.classList.add('active');
  }
  _refreshBugLog();
}

function submitBugNote(){
  const input = document.getElementById('buglog-input');
  if(!input) return;
  const txt = input.value.trim();
  if(!txt) return;
  bugLog('note', txt, G ? 'Class: '+G.classId+' · Zone: '+(G.zoneIdx+1)+' · Level: '+G.level : 'Outside game session');
  input.value = '';
}

function openBugLog(){
  _refreshBugLog();
  document.getElementById('buglog-overlay').classList.add('open');
  setTimeout(() => {
    const input = document.getElementById('buglog-input');
    if(input) input.focus();
  }, 100);
}

function closeBugLog(){
  document.getElementById('buglog-overlay').classList.remove('open');
}
function deathReturnToTown(){
  // Called from death screen — reset combat state and return to Elderfen
  if(G){
    G.currentEnemy=null;
    G.conditions=[];G.conditionTurns={};G.sx={};
    G.raging=false;G.hunterMarked=false;G.concentrating=null;
    G.wildShapeActive=false;G.spiritualWeaponActive=false;
    G.isPlayerTurn=true;G.actionUsed=false;G.bonusUsed=false;G.reactionUsed=false;
    G.hp=Math.max(1,Math.floor(G.maxHp/2)); // arrive at half HP
  }
  if(typeof autoSave==='function') autoSave();
  showTownHub();
}
