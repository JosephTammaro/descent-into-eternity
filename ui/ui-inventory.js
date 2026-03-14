// ================================================================
// ui/ui-inventory.js — Inventory, Equipment, Items, Loot
// Descent into Eternity
// ================================================================

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
  // Loot reveal theater — accumulate new slot indices, animate after current sync batch
  G._newLootSlots=G._newLootSlots||[];
  G._newLootSlots.push(idx);
  if(!G._lootAnimPending){
    G._lootAnimPending=true;
    requestAnimationFrame(()=>{
      G._lootAnimPending=false;
      const slots=(G._newLootSlots||[]).slice();
      G._newLootSlots=[];
      const grid=document.getElementById('invGrid');
      if(!grid)return;
      slots.forEach((si,i)=>{
        setTimeout(()=>{
          const el=grid.querySelector('[data-idx="'+si+'"]');
          if(el&&!el.classList.contains('empty'))el.classList.add('inv-popin');
        },i*140);
      });
    });
  }
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
    >${iconHTML(item.icon)}${(item.qty||1)>1?`<div class="inv-qty">${item.qty}</div>`:''}</div>`;
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
      <div class="eq-icon">${G.equipped[s.k]?iconHTML(G.equipped[s.k].icon):'+'}</div>
      <div class="eq-lbl">${G.equipped[s.k]?G.equipped[s.k].name.substring(0,8):s.l}</div>
    </div>
  `).join('');
  // Build active set bonus display
  let setBonusHTML='';
  for(const[setId,setDef]of Object.entries(SET_BONUSES)){
    const count=countSetPieces(setId);
    if(count>=2){
      const active3=count>=3&&setDef.bonuses[3];
      const b=active3?setDef.bonuses[3]:(setDef.bonuses[2]||setDef.bonuses[3]);
      const isClassSet=!!setDef.forClass;
      const borderColor=isClassSet&&active3?'#cc88ff':isClassSet?'#9b54bd':'#c8a84b';
      const textColor=isClassSet&&active3?'#cc88ff':isClassSet?'#bb77dd':'#c8a84b';
      const prefix=isClassSet&&active3?'✦ CLASS SET':'✦';
      setBonusHTML+=`<div style="font-family:'Press Start 2P',monospace;font-size:5px;padding:4px 6px;margin-top:3px;background:#0a0800;border:1px solid ${borderColor};color:${textColor};">${prefix} ${setDef.name} (${count}/3) — ${b.label}</div>`;
    }
  }
  document.getElementById('equipSlots').innerHTML=slotsHTML+(setBonusHTML?`<div style="grid-column:1/-1;">${setBonusHTML}</div>`:'');
}


function openItemModal(idx){
  selectedItemIdx=idx;
  const item=G.inventory[idx];
  if(!item)return;
  const rc={common:'#4a4038',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#8b44ad',legendary:'var(--gold)'}[item.rarity]||'#888';
  document.getElementById('ibTitle').textContent=item.name;
  document.getElementById('ibTitle').style.color=rc;
  document.getElementById('ibBody').innerHTML=`
    <div class="ib-icon">${iconHTML(item.icon)}</div>
    <div class="ib-stats">
      <div class="ib-name" style="color:${rc}">${item.name}</div>
      <div class="ib-rar" style="color:${rc}">${item.rarity.toUpperCase()} ${item.type}</div>
      ${Object.entries(item.stats).filter(([k,v])=>v).map(([k,v])=>`<div class="ib-stat">${v>0?'+':''}${v} ${statLabel(k)}</div>`).join('')}
      <div style="font-size:13px;color:var(--dim);margin-top:4px">Sell: 🪙${Math.floor(item.value*.5*(item.qty||1))}</div>
      ${item.desc?`<div style="font-style:italic;color:${rc};opacity:0.85;font-size:11px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1);line-height:1.6;">${item.desc}</div>`:''}
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
  const statsHTML=Object.entries(item.stats).filter(([k,v])=>v).map(([k,v])=>`<div class="inv-tt-stat">${v>0?'+':''}${v} ${statLabel(k)}</div>`).join('');
  const slotLabel=item.slot?`<div class="inv-tt-sell" style="color:var(--dim);border:none;padding:0;margin-bottom:3px;">${item.slot.toUpperCase()} slot</div>`:'';
  const descHTML=item.desc?`<div style="font-style:italic;color:${rc};opacity:0.85;font-size:10px;margin-top:5px;padding-top:5px;border-top:1px solid rgba(255,255,255,0.08);line-height:1.5;">${item.desc}</div>`:'';
  tt.innerHTML=`
    <span class="inv-tt-name" style="color:${rc}">${item.name}</span>
    <div class="inv-tt-rar" style="color:${rc}">${rarLabel} ${item.type}</div>
    ${slotLabel}
    ${statsHTML||'<div class="inv-tt-stat" style="color:var(--dim)">No stat bonuses</div>'}
    <div class="inv-tt-sell">Sell: 🪙${Math.floor((item.value||0)*.5*(item.qty||1))}</div>
    ${descHTML}
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
  if(G.equipped[item.slot]){
    // Check if we can fit the old item (swap uses the slot we're about to free)
    const oldItem={...G.equipped[item.slot]};
    // Free the inventory slot first so addItem can use it
    G.inventory[selectedItemIdx]=null;
    removeItemStats(oldItem);
    if(!addItem(oldItem)){
      // Inventory truly full — abort swap, restore state
      G.inventory[selectedItemIdx]=item;
      applyItemStats(oldItem);
      G.equipped[item.slot]=oldItem;
      log('Inventory full — cannot swap!','e');
      closeItemModal();renderAll();return;
    }
    G.equipped[item.slot]=item;
    applyItemStats(item);
    AUDIO.sfx.equip();
    closeItemModal();renderAll();
    return;
  }
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
  if(item.stats.heal){const healAmt=G._branchSwiftHands?Math.ceil(item.stats.heal*1.5):item.stats.heal;heal(healAmt,item.name+' 🧪');}
  if(item.id==='antidote'||item.stats.clearPoison){removeCondition('Poisoned');log('Poison cleared!','s');}
  if(item.stats.clearBurn){removeCondition('Burning');log('Burning cleared!','s');}
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

// ── Equipped item helpers (used by combat code for passive effects) ──────────
function hasEquippedItem(id){
  return Object.values(G.equipped||{}).some(i=>i&&i.id===id);
}
function hasEquippedPassive(passiveId){
  return Object.values(G.equipped||{}).some(i=>i&&i.passive&&i.passive.id===passiveId);
}
function getEquippedPassive(passiveId){
  return Object.values(G.equipped||{}).find(i=>i&&i.passive&&i.passive.id===passiveId)||null;
}

function _applyStats(stats,sign){
  if(stats.atk)G.atk+=stats.atk*sign;
  if(stats.def)G.def+=stats.def*sign;
  if(stats.hp){G.maxHp+=stats.hp*sign;if(sign>0)G.hp=Math.min(G.maxHp,G.hp+stats.hp);else G.hp=Math.min(G.hp,G.maxHp);}
  if(stats.magAtk){G.magBonus=Math.max(0,(G.magBonus||0)+stats.magAtk*sign);}
  if(stats.crit)G.critBonus=Math.max(0,(G.critBonus||0)+stats.crit*sign);
  // goldMult: additive bonus on top of base 1.0 (e.g. merchantLedger +0.15)
  if(stats.goldMult)G.goldMult=Math.max(0.1,(G.goldMult||1)+stats.goldMult*sign);
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
    // Always keep _classSetBonus in sync with current state (iterate 2→3 so tier 3 wins)
    for(let t=2;t<=3;t++){
      if(now>=t&&setDef.bonuses[t]&&setDef.bonuses[t].skillBonus){
        G._classSetBonus=setDef.bonuses[t].skillBonus;
      }
    }
    G.activeSets[setId]=now;
  }
}

function dropLoot(enemy, minRarity){
  // ── CLASS SET ITEM DROP (zone 3+, 5% chance) ────────────
  if(G.zoneIdx>=3&&Math.random()<0.05){
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
        log('✦ CLASS SET ITEM: '+item.name+' ['+item.set.toUpperCase()+']','l');
        log('⚠ Equip all 3 '+SET_BONUSES[item.set].name+' pieces for the set bonus!','s');
        return;
      }
    }
  }
  // ── NORMAL LOOT ───────────────────────────────────────────
  const pool=ITEMS.filter(i=>{
    if(i.type==='material'||i.type==='consumable')return false;
    if(i.forClass)return false; // class set items only drop via the block above
    if(G.level<8&&i.rarity==='rare')return false;
    if(G.level<12&&i.rarity==='epic')return false;
    return true;
  });
  const rng=Math.random();
  let rolledRarity=rng<.60?'common':rng<.88?'uncommon':'rare';
  // Mythic modifier: upgrade all drops one rarity tier
  if(G._activeModifier&&G._activeModifier.effects.upgradeDrops){
    const upgradeMap={common:'uncommon',uncommon:'rare',rare:'epic'};
    if(upgradeMap[rolledRarity])rolledRarity=upgradeMap[rolledRarity];
  }
  // Elite room: minimum rarity override
  if(minRarity){
    const rarityRank={common:0,uncommon:1,rare:2,epic:3,legendary:4};
    if((rarityRank[rolledRarity]||0)<(rarityRank[minRarity]||0)) rolledRarity=minRarity;
  }
  let filtered=pool.filter(i=>i.rarity===rolledRarity);
  if(!filtered.length){
    // Fallback: try descending rarities instead of jumping to common
    const _fallbackOrder=['epic','rare','uncommon','common'];
    for(const r of _fallbackOrder){if(!filtered.length)filtered=pool.filter(i=>i.rarity===r);}
  }
  if(!filtered.length)return;
  const item={...filtered[Math.floor(Math.random()*filtered.length)]};
  if(addItem(item)){G.totalItems++;AUDIO.sfx.loot();log('🎁 Found: '+item.name+' ['+item.rarity.toUpperCase()+']','l');}
}

function buyUpgrade(id){
  const u=G.upgrades.find(u=>u.id===id);
  if(!u||u.bought||G.gold<u.cost)return;
  G.gold-=u.cost; u.bought=true;
  if(u.eff==='atk')addOffensiveStat(G,u.val);
  if(u.eff==='def')G.def+=u.val;
  if(u.eff==='maxHp'){G.maxHp+=u.val;G.hp+=u.val;}
  if(u.eff==='xpMult')G.xpMult+=u.val;
  if(u.eff==='crit')G.critBonus=(G.critBonus||0)+u.val;
  log('📈 Upgrade: '+u.name,'s');
  renderAll();
}
