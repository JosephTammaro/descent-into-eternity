let _currentBranch = null;

function travelToBranch(branchId){
  const branch = BRANCH_ZONES.find(b=>b.id===branchId);
  if(!branch) return;
  _currentBranch = branch;
  // Save entire zone state so we can restore it after the branch
  G._savedZoneState = {
    zoneIdx: G.zoneIdx,
    dungeonFights: G.dungeonFights,
    campUnlocked: G.campUnlocked,
    dungeonGoal: G.dungeonGoal,
    zoneKills: G.zoneKills,
    bossReady: G.bossReady,
    // Bug 15: Save transient combat state so branch doesn't permanently strip it
    conditions: JSON.parse(JSON.stringify(G.conditions||[])),
    conditionTurns: JSON.parse(JSON.stringify(G.conditionTurns||{})),
    sx: JSON.parse(JSON.stringify(G.sx||{})),
    skillCooldowns: JSON.parse(JSON.stringify(G.skillCooldowns||{})),
    skillCharges: JSON.parse(JSON.stringify(G.skillCharges||{})),
    raging: G.raging,
    rageTurns: G.rageTurns,
    hunterMarked: G.hunterMarked,
    concentrating: G.concentrating,
    wildShapeHp: G.wildShapeHp,
    wildShapeActive: G.wildShapeActive,
    mirrorImages: G.mirrorImages,
    spiritualWeaponActive: G.spiritualWeaponActive,
    spiritualWeaponTurns: G.spiritualWeaponTurns,
  };
  // Branch runs in isolated state — doesn't touch main zone progress
  G.dungeonGoal = 999; // disable campfire unlock during branch
  G._inBranch = true;
  G._branchFights = 0;
  G._branchFightsRequired = 5;
  G.conditions = []; G.conditionTurns = {}; G.sx = {};
  G.raging = false; G.hunterMarked = false; G.concentrating = null;
  G.wildShapeHp = 0; G.wildShapeActive = false;
  G.skillCooldowns = {};
  G.skillCharges = {};
  CLASSES[G.classId].skills.forEach(sk=>{ if(sk.charges) G.skillCharges[sk.id]=sk.charges; });
  G.currentEnemy = null;
  // Show story intro screen for the branch
  showBranchIntro(branch);
}

function showBranchIntro(branch){
  document.getElementById('storyZoneTag').textContent = `SIDE BRANCH — ${branch.name.toUpperCase()}`;
  const _stEl=document.getElementById('storyTitle');
  _stEl.textContent = branch.story.title;
  _stEl.style.display = ''; // ensure visible (may have been hidden by zone intro)
  const healBadge = document.getElementById('storyHealBadge');
  if(healBadge) healBadge.style.display = 'none';
  const bodyEl = document.getElementById('storyBody');
  bodyEl.textContent = '';
  let i = 0;
  const t = setInterval(()=>{ bodyEl.textContent += branch.story.text[i++]; if(i>=branch.story.text.length) clearInterval(t); }, 28);
  // Branch warning
  const mechLabel = {gauntlet:'⚠ No campfire — 5 fights straight!', double_loot:'💰 Double loot — but enemies hit harder!', poison_spreading:'☠ Spores infect — watch your conditions!', event_combat:'🎲 Random events before each fight!'};
  setTimeout(()=>{
    const extra = document.createElement('div');
    extra.style.cssText = 'font-family:"Press Start 2P",monospace;font-size:7px;color:#cc9944;margin-top:16px;letter-spacing:1px;';
    extra.textContent = mechLabel[branch.mechanic] || '';
    bodyEl.appendChild(extra);
  }, 200);
  AUDIO.playBGM('boss');
  showScreen('story');
}

function enterBranch(){
  showScreen('game');
  {const bl=document.getElementById('battleLog');if(bl)bl.innerHTML='';}
  const branch = _currentBranch;
  if(!branch) return;
  // Setup UI
  document.getElementById('zoneNameLabel').textContent = branch.name + ' ★';
  document.getElementById('bgSky').className = 'bg-layer ' + branch.bgSky;
  document.getElementById('bgGround').className = 'bg-layer ' + branch.bgGround;
  document.getElementById('bgTrees').style.display = 'none';
  // Branch zones use earthy tints based on their theme
  const _BRANCH_TINTS={catacombs:'rgba(20,10,30,0.30)',fungalwarren:'rgba(10,40,10,0.22)',sunkenvault:'rgba(20,30,50,0.25)',ashenwastes:'rgba(60,20,10,0.28)'};
  const _sg=document.getElementById('screen-game');
  if(_sg) _sg.style.setProperty('--zone-tint',_BRANCH_TINTS[branch.id]||'rgba(30,20,10,0.20)');
  document.getElementById('bossAlert').style.display = 'none';
  if(typeof updateCampBtn==='function') updateCampBtn();
  renderAll();
  spawnBranchEnemy();
}

function spawnBranchEnemy(){
  const branch = _currentBranch;
  if(!branch) return;
  G._branchFights = G._branchFights || 0;
  // After 5 regular fights, spawn boss
  const isBoss = G._branchFights >= 5;
  const eData = isBoss ? branch.boss : branch.enemies[Math.floor(Math.random()*branch.enemies.length)];
  // Scale to player level — harder than main path (+15%)
  const lvlScale = (1 + (G.level-1)*0.09) * 1.15;
  const effectiveLvl = Math.max(1, Math.round((lvlScale-1)/0.06)+1);
  G.currentEnemy = {
    ...eData, isBoss,
    effectiveLvl,
    maxHp: Math.floor(eData.hp*lvlScale),
    hp:    Math.floor(eData.hp*lvlScale),
    atk:   Math.floor(eData.atk*lvlScale*(branch.mechanic==='double_loot'?1.25:1)),
    def:   Math.floor((eData.def||0)*lvlScale*0.9),
    xp:    Math.floor(eData.xp*lvlScale),
    gold:  Math.floor((eData.gold||5)*(branch.mechanic==='double_loot'?2:1)*(0.7+Math.random()*0.7)),
    conditions: [],
    isBranchEnemy: true,
  };
  G.currentEnemies = [G.currentEnemy];
  G.targetIdx = 0;
  // Apply mechanic: fungal warren — enemies start poisoned (can spread)
  if(branch.mechanic==='poison_spreading'&&!isBoss){
    G.currentEnemy.conditions = [{name:'Poisoned',turns:3}];
    log('🍄 The enemy reeks of spores — already Poisoned!','c');
  }
  // Render sprite
  const eEl = document.getElementById('enemySprite');
  const spriteData = isBoss ? BOSS_SPRITES[eData.sprite] : ENEMY_SPRITES[eData.sprite];
  if(spriteData) renderSprite(spriteData, isBoss?15:13, eEl);
  eEl.className = isBoss ? 'boss-anim' : '';
  if(!isBoss && window.Anim) Anim.startEnemyIdle();
  eEl.style.filter = `drop-shadow(0 0 4px ${eData.color})`;
  const lvlBadge = `<span style="font-size:11px;color:var(--dim);margin-left:6px;">Lv.${effectiveLvl}</span>`;
  document.getElementById('enemyNameTag').innerHTML = (isBoss?`⚠ ${G.currentEnemy.name}`:G.currentEnemy.name)+lvlBadge;
  document.getElementById('enemyNameTag').className = 'fighter-name-tag '+(isBoss?'boss-name-tag':'');
  document.getElementById('enemyHpFill').style.width='100%';
  const txt=document.getElementById('enemyHpText');
  if(txt) txt.textContent=G.currentEnemy.maxHp+' / '+G.currentEnemy.maxHp+' HP';
  // Restore battle UI
  const neb=document.getElementById('nextEnemyBtn');
  const etb=document.getElementById('endTurnBtn');
  if(neb) neb.style.display='none';
  if(etb) etb.style.display='block';
  G.roundNum=0; G.firstAttackUsed=false;
  if(isBoss){ AUDIO.sfx.bossAppear(); log(`⚠ BRANCH BOSS: ${eData.name}!`,'e'); log(eData.title,'e'); }
  else { log(`A ${G.currentEnemy.name} emerges from the dark!`,'s'); }
  setPlayerTurn(true);
}

function onBranchEnemyDefeated(){
  const branch = _currentBranch;
  if(!branch) return;
  G._branchFights = (G._branchFights||0) + 1;
  const isBossKill = G.currentEnemy && G.currentEnemy.isBoss;
  if(isBossKill){
    // Branch complete!
    // Check slot-level branchDefeated (persists across runs) for true first-clear
    const _slotData = (typeof loadSlotData==='function' && typeof activeSaveSlot!=='undefined' && activeSaveSlot)
      ? loadSlotData(activeSaveSlot) : null;
    const _slotBranchDefeated = _slotData && _slotData.branchDefeated ? _slotData.branchDefeated : {};
    const _firstBranchClear = !_slotBranchDefeated[branch.id]; // true only if never cleared on this slot
    G.branchDefeated[branch.id] = true;
    G._branchFirstClear = _firstBranchClear; // persist through reward chain
    G._inBranch = false;
    const bossName = G.currentEnemy.name;
    const bossTitle = G.currentEnemy.title || '';
    G.currentEnemy = null;
    setTimeout(()=>{
      showBossVictory(bossName, bossTitle, ()=>{
        // Restore full zone state from before the branch
        const saved = G._savedZoneState || {};
        G.zoneIdx = saved.zoneIdx ?? (G._returnZoneIdx || 0);
        G.dungeonFights = saved.dungeonFights ?? 0;
        G.campUnlocked = saved.campUnlocked ?? false;
        G.dungeonGoal = saved.dungeonGoal ?? 5;
        G.zoneKills = saved.zoneKills ?? 0;
        G.bossReady = saved.bossReady ?? false;
        // Bug 15: Restore transient combat state stripped on branch entry
        if(saved.conditions) G.conditions = saved.conditions;
        if(saved.conditionTurns) G.conditionTurns = saved.conditionTurns;
        if(saved.sx) G.sx = saved.sx;
        if(saved.skillCooldowns) G.skillCooldowns = saved.skillCooldowns;
        if(saved.skillCharges) G.skillCharges = saved.skillCharges;
        if(saved.raging !== undefined) G.raging = saved.raging;
        if(saved.rageTurns !== undefined) G.rageTurns = saved.rageTurns;
        if(saved.hunterMarked !== undefined) G.hunterMarked = saved.hunterMarked;
        if(saved.concentrating !== undefined) G.concentrating = saved.concentrating;
        if(saved.wildShapeHp !== undefined) G.wildShapeHp = saved.wildShapeHp;
        if(saved.wildShapeActive !== undefined) G.wildShapeActive = saved.wildShapeActive;
        if(saved.mirrorImages !== undefined) G.mirrorImages = saved.mirrorImages;
        if(saved.spiritualWeaponActive !== undefined) G.spiritualWeaponActive = saved.spiritualWeaponActive;
        if(saved.spiritualWeaponTurns !== undefined) G.spiritualWeaponTurns = saved.spiritualWeaponTurns;
        G._savedZoneState = null;
        _currentBranch = null;
        // 33% chance of grace drop from side quest bosses
        const afterBranchReward = () => showBranchReward(branch);
        if(Math.random() < 0.33 && typeof generateGrace==='function' && typeof showGraceDrop==='function'){
          showGraceDrop(generateGrace(), afterBranchReward);
        } else {
          afterBranchReward();
        }
      });
    }, 900);
  } else {
    // Next branch fight
    G.currentEnemy = null;
    renderAll();
    G.dungeonFights++;
    const neb=document.getElementById('nextEnemyBtn');
    const etb=document.getElementById('endTurnBtn');
    const remaining = 5 - G._branchFights;
    if(neb){
      neb.textContent = remaining > 0 ? `⚔ NEXT ENEMY (${remaining} left)` : '⚔ FACE THE BOSS ▶';
      neb.style.display='block';
    }
    if(etb) etb.style.display='none';
    log(`Fight ${G._branchFights}/5 complete.${remaining>0?' Press on — no rest here.':' The boss awaits...'}`, 's');
  }
}

function showBranchReward(branch){
  // Roll random reward type
  const roll_r = Math.random();
  let rewardType;
  if(roll_r < 0.25) rewardType = 'legendary';
  else if(roll_r < 0.50) rewardType = 'stat';
  else if(roll_r < 0.75) rewardType = 'choice';
  else rewardType = 'epic_gold';

  const overlay = document.getElementById('branchRewardOverlay');
  const titleEl = document.getElementById('branchRewardTitle');
  const bodyEl  = document.getElementById('branchRewardBody');
  if(!overlay) { enterReturnZone(); return; }

  titleEl.textContent = `${branch.icon} ${branch.name.toUpperCase()} COMPLETE!`;

  if(rewardType === 'legendary'){
    const item = ITEMS.find(i=>i.id===branch.boss.legendaryDrop);
    bodyEl.innerHTML = `<div class="br-sub">LEGENDARY REWARD</div>
      <div class="br-item-box">
        <span class="br-item-icon">${item?item.icon:'✨'}</span>
        <div class="br-item-name">${item?item.name:'Ancient Relic'}</div>
        <div class="br-item-desc">${item&&item.desc?item.desc:''}</div>
      </div>
      <button class="br-claim-btn" onclick="claimBranchReward('legendary','${branch.boss.legendaryDrop}')">✦ CLAIM ✦</button>`;
  } else if(rewardType === 'stat'){
    const stat = BRANCH_STAT_BONUSES[Math.floor(Math.random()*BRANCH_STAT_BONUSES.length)];
    bodyEl.innerHTML = `<div class="br-sub">PERMANENT BONUS</div>
      <div class="br-stat-box">⚔ ${stat.getLabel?stat.getLabel(G):stat.label}</div>
      <div class="br-note">This bonus applies permanently for this run.</div>
      <button class="br-claim-btn" onclick="claimBranchReward('stat',${JSON.stringify(stat.label).replace(/"/g,"'")})">✦ CLAIM ✦</button>`;
    window._pendingBranchStat = stat;
  } else if(rewardType === 'choice'){
    const pool = BRANCH_PASSIVE_CHOICES[Math.floor(Math.random()*BRANCH_PASSIVE_CHOICES.length)];
    bodyEl.innerHTML = `<div class="br-sub">CHOOSE A PASSIVE</div>
      ${pool.map((p,i)=>`<div class="br-choice-card" onclick="claimBranchReward('passive',${i})">
        <div class="br-choice-name">${p.name}</div>
        <div class="br-choice-desc">${p.desc.replace(/ATK/g, getOffensiveStatLabel(G))}</div>
      </div>`).join('')}`;
    window._pendingBranchChoices = pool;
  } else {
    // epic_gold: guaranteed epic item + big gold
    const epicItems = ITEMS.filter(i=>i.rarity==='epic');
    const picked = epicItems[Math.floor(Math.random()*epicItems.length)];
    const goldAmt = 80 + G.level * 12;
    bodyEl.innerHTML = `<div class="br-sub">TREASURE TROVE</div>
      <div class="br-item-box">
        <span class="br-item-icon">${picked?picked.icon:'💎'}</span>
        <div class="br-item-name">${picked?picked.name:'Epic Relic'}</div>
      </div>
      <div class="br-stat-box">🪙 +${goldAmt} Gold</div>
      <button class="br-claim-btn" onclick="claimBranchReward('epic_gold','${picked?picked.id:''}',${goldAmt})">✦ CLAIM ✦</button>`;
    window._pendingBranchEpic = {item:picked, gold:goldAmt};
  }

  overlay.style.display = 'flex';
  AUDIO.playBGM('victory');
}

function claimBranchReward(type, arg, arg2){
  if(type==='legendary'){
    const item = ITEMS.find(i=>i.id===arg);
    if(item) addItem({...item,qty:1});
    log(`✨ BRANCH LEGENDARY: ${item?item.name:'Ancient Relic'} added to inventory!`,'l');
  } else if(type==='stat'){
    const stat = window._pendingBranchStat;
    if(stat){ stat.apply(G); log(`⚔ BRANCH BONUS: ${stat.label} applied permanently!`,'l'); }
    window._pendingBranchStat = null;
  } else if(type==='passive'){
    const idx = parseInt(arg);
    const choices = window._pendingBranchChoices;
    if(choices&&choices[idx]){
      G.branchPassives = G.branchPassives || [];
      G.branchPassives.push(choices[idx].name);
      applyBranchPassive(choices[idx].name);
      log(`✦ PASSIVE GAINED: ${choices[idx].name} — ${choices[idx].desc.replace(/ATK/g, getOffensiveStatLabel(G))}`,'l');
    }
    window._pendingBranchChoices = null;
  } else if(type==='epic_gold'){
    const data = window._pendingBranchEpic;
    if(data){
      if(data.item) addItem({...data.item,qty:1});
      G.gold += data.gold; G.totalGold += data.gold;
      log(`💰 BRANCH TREASURE: ${data.item?data.item.name:''} + ${data.gold} gold!`,'l');
    }
    window._pendingBranchEpic = null;
  }
  document.getElementById('branchRewardOverlay').style.display = 'none';
  enterReturnZone();
}

function applyBranchPassive(name){
  if(!G) return;
  switch(name){
    case 'Iron Skin':      G._branchIronSkin=true; break;
    case 'Battle Hardened':G._branchBattleHardened=true; break;
    case 'Scavenger':      G._branchScavenger=true; break;
    case 'Predator':       G._branchPredator=true; break;
    case 'Swift Hands':    G._branchSwiftHands=true; break;
    case 'Veteran':        addOffensiveStat(G,3); G.def+=2; break;
    case 'Death Defiant':  G._branchDeathDefiant=true; break;
    case 'Arcane Infusion':G.magBonus=(G.magBonus||0)+10; break;
    case 'Relentless':     G._branchRelentlessHeal=true; break;
    case 'Sixth Sense':    G._branchSixthSense=true; break;
    case 'Treasure Hunter':G.goldMult=(G.goldMult||1)*1.4; break;
    case 'Combat Mastery': addOffensiveStat(G,3); G.def+=3; G.maxHp+=15; G.hp=Math.min(G.maxHp,G.hp+15); break;
  }
}

function enterReturnZone(){
  AUDIO.stopBGM();
  const firstClear = G._branchFirstClear;
  G._branchFirstClear = false; // consume the flag

  if(firstClear){
    // First time ever clearing this branch boss — go to town, same as main zone first clear
    const slot = (typeof activeSaveSlot!=='undefined') ? activeSaveSlot : null;
    if(typeof updateSlotData==='function' && slot){
      updateSlotData(slot, d=>{
        if(G) d.branchDefeated = {...(d.branchDefeated||{}), ...(G.branchDefeated||{})};
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
      });
    }
    log('✨ Side quest complete. Return to Elderfen.','l');
    if(typeof showSalvagePrompt==='function'){
      showSalvagePrompt(()=>{
        if(typeof fadeToScreen==='function'){
          fadeToScreen('town', ()=>{ if(typeof showTownHub==='function') showTownHub(); });
        } else if(typeof showTownHub==='function'){
          showTownHub();
        }
      });
    } else {
      if(typeof fadeToScreen==='function'){
        fadeToScreen('town', ()=>{ if(typeof showTownHub==='function') showTownHub(); });
      } else if(typeof showTownHub==='function'){
        showTownHub();
      }
    }
  } else {
    // Repeat clear — show map so player can continue their run
    // Use false (not postBoss) so the close button is visible — player's current zone
    // may not have a click handler yet (e.g. still in zone 1), so they need a way back
    if(typeof showMap==='function'){
      showMap(false);
    } else {
      // Fallback: drop back into the dungeon where they left off
      showScreen('game');
      setupGameUI();
      initObjective(G.zoneIdx);
      renderObjectiveStatus();
      renderAll();
      const neb=document.getElementById('nextEnemyBtn');
      const etb=document.getElementById('endTurnBtn');
      if(neb){neb.textContent='⚔ NEXT ENEMY ▶';neb.style.display='block';}
      if(etb)etb.style.display='none';
    }
  }
}
