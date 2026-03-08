// ================================================================
// ui/ui-campfire-services.js — Shop, Craft, Events, Campfire Inventory, Quick Buttons
// Descent into Eternity
// ================================================================

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
   result:{id:'shadowBlood',name:'Shadow Blood',icon:'🌑',type:'consumable',slot:null,rarity:'epic',stats:{heal:40,tempAtk:12,tempDef:6},value:200},
   desc:'1 Shadow Essence + 2 Void Shards + 1 Demon Ash → Shadow Blood (60 HP, +20 ATK, +10 DEF)'},
  {cat:'legendary',req:{frostCrystal:2,ironCore:2},
   result:{id:'titanBlood',name:"Titan's Blood",icon:'💪',type:'consumable',slot:null,rarity:'epic',stats:{heal:35,tempAtk:10,tempDef:12},value:180},
   desc:"2 Frost Crystals + 2 Iron Cores → Titan's Blood (50 HP, +15 ATK, +20 DEF)"},
  {cat:'legendary',req:{celestialDust:2,shadowEssence:1},
   result:{id:'etherFlask',name:'Ether Flask',icon:'🌈',type:'consumable',slot:null,rarity:'legendary',stats:{heal:80},value:300},
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
  // Zone modifier: Famine halves shop prices
  const priceMult=(G._activeModifier&&G._activeModifier.effects.shopPriceMult)||1;
  const shopPrice=(item)=>Math.max(1,Math.floor(item.value*priceMult));
  const rc={common:'#6a5838',uncommon:'var(--green2)',rare:'var(--blue2)',epic:'#9b54bd',legendary:'var(--gold)'};
  const typeLabel={weapon:'Weapon',armor:'Armor',offhand:'Off-Hand',accessory:'Accessory',consumable:'Consumable'};
  const rarityLabel={common:'Common',uncommon:'Uncommon',rare:'Rare',epic:'Epic ✦',legendary:'★ Legendary'};

  // ── SHOP TIER ─────────────────────────────────────────────
  const shopTier = typeof getShopTier==='function' ? getShopTier() : 1;
  const allowedRarities = typeof getShopTierRarities==='function' ? getShopTierRarities() : ['common','uncommon'];
  const totalDonated = typeof getWizardDonations==='function' ? getWizardDonations() : 0;
  const nextTierCost = shopTier===1 ? 650 : shopTier===2 ? 2500 : null;
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
            ? 'Donate <span style="color:var(--gold)">650g total</span> to unlock Rare items.'
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

  // ── A1: RANDOMIZE SHOP STOCK ──────────────────────────────
  // Generate random shop stock once per campfire visit
  if(!G._shopStock){
    const consumables=allItems.filter(i=>i.type==='consumable');
    const equipment=allItems.filter(i=>i.type!=='consumable');
    // Stock size scales with tier
    const stockSize=shopTier===3?7:shopTier===2?6:5;
    // Shuffle equipment and pick random subset
    const shuffled=equipment.slice().sort(()=>Math.random()-0.5);
    const picked=shuffled.slice(0,stockSize);
    // Boss campfires guarantee at least 1 rare+ item
    if(G.bossReady===false&&G.runBossDefeated&&G.runBossDefeated[G.zoneIdx]){
      const hasRarePlus=picked.some(i=>i.rarity==='rare'||i.rarity==='epic'||i.rarity==='legendary');
      if(!hasRarePlus){
        const rarePool=equipment.filter(i=>i.rarity==='rare'||i.rarity==='epic'||i.rarity==='legendary');
        if(rarePool.length){picked[0]=rarePool[Math.floor(Math.random()*rarePool.length)];}
      }
    }
    // Store as ITEMS indices (consumables always included)
    G._shopStock=[...consumables,...picked].map(i=>ITEMS.indexOf(i)).filter(idx=>idx>=0);
  }
  // Filter allItems to only show stocked items
  const stockedItems=G._shopStock.map(idx=>ITEMS[idx]).filter(Boolean);

  const cats=[
    {k:'all',l:'All'},
    {k:'weapon',l:'Weapons'},
    {k:'armor',l:'Armor'},
    {k:'offhand',l:'Off-Hand'},
    {k:'accessory',l:'Rings'},
    {k:'consumable',l:'Potions'},
    {k:'epic',l:'✦ Sets'},
  ];
  const filtered=_shopCat==='all'?stockedItems:_shopCat==='epic'?stockedItems.filter(i=>i.rarity==='epic'||i.rarity==='legendary'):stockedItems.filter(i=>i.type===_shopCat);
  const catHTML=cats.map(c=>`<div class="shop-cat ${_shopCat===c.k?'active':''}" onclick="cfShopHTML('${c.k}');cfRenderTab('shop')">${c.l}</div>`).join('');
  const statStr=s=>Object.entries(s).filter(([k,v])=>v&&k!=='heal').map(([k,v])=>`+${v} ${statLabel(k)}`).join(' ');
  const itemsHTML=filtered.map((item,_)=>{
    const i=ITEMS.indexOf(item);
    const price=shopPrice(item);
    const canBuy=G.gold>=price;
    const color=rc[item.rarity]||'#888';
    const isSet=!!item.set;
    const setDef=isSet&&SET_BONUSES[item.set];
    const statsLine=Object.entries(item.stats).filter(([k,v])=>v).map(([k,v])=>`+${v} ${statLabel(k)}`).join(' · ');
    return `<div class="shop-item ${canBuy?'':'cant'}" onclick="${canBuy?`cfBuyItem(${i})`:''}">
      <div class="si-icon-wrap"><span class="si-icon">${item.icon}</span></div>
      <div class="si-info">
        <span class="si-name" style="color:${color}">${item.name}${isSet?`<span class="shop-set-badge">SET</span>`:''}</span>
        <div class="si-meta-row">
          <span class="si-stats-inline">${statsLine}</span>
          <span class="si-cost">${priceMult<1?'<span style="color:var(--green2);">':''}🪙${price}${priceMult<1?'</span>':''}</span>
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
      const statsStr=Object.entries(item.stats).filter(([k,v])=>v).map(([k,v])=>`${v>0?'+':''}${v} ${statLabel(k)}`).join(' · ')||'No stats';
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
  const priceMult=(G._activeModifier&&G._activeModifier.effects.shopPriceMult)||1;
  const price=Math.max(1,Math.floor(item.value*priceMult));
  if(!item||G.gold<price){document.getElementById('shopResult').textContent='✗ Not enough gold!';return;}
  if(item.value===0){document.getElementById('shopResult').textContent='✗ This item cannot be purchased — find it as a drop!';return;}
  if(!addItem({...item})){document.getElementById('shopResult').textContent='✗ Inventory full!';return;}
  G.gold-=price;
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
  const statsHTML=Object.entries(item.stats).filter(([k,v])=>v).map(([k,v])=>`${v>0?'+':''}${v} ${statLabel(k)}`).join('<br>');
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
  G._shopStock=null; // A1: restock on tier change
  if(newTotal===650||tier===2){
    log('🧙 The wizard grins. "Rare wares, unlocked for you." — Tier II shop unlocked!','l');
  } else if(newTotal>=2500&&tier===3){
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
    const stats=it?Object.entries(it.stats).filter(([,v])=>v).map(([k,v])=>`${v>0?'+':''}${v} ${statLabel(k)}`).join(' · '):'empty';
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
  const stats=Object.entries(item.stats).filter(([,v])=>v).map(([k,v])=>`${v>0?'+':''}${v} ${statLabel(k)}`).join('  ');

  if(item.slot){
    // Equippable — show equip + sell + salvage buttons
    const salvVal=Math.floor(item.value*({common:0.30,uncommon:0.40,rare:0.50,epic:0.50,legendary:0.60}[item.rarity]||0.30));
    if(d){d.innerHTML=`<span style="color:${col}">${item.icon} ${item.name}</span>
      <span style="color:var(--dim);font-size:9px;margin-left:6px;">${stats||''}</span>
      <button class="btn btn-green" style="padding:5px 14px;font-size:7px;margin-left:10px;" onclick="cfEquipItem(${idx})">EQUIP</button>
      <button class="btn" style="padding:5px 14px;font-size:7px;margin-left:6px;border-color:#5a3a1a;color:#c8a84b;" onclick="cfSellItem(${idx})">SELL 🪙${Math.floor(item.value*.5)}</button>
      <button class="btn" style="padding:5px 14px;font-size:7px;margin-left:6px;border-color:#3a5a3a;color:#6aea6a;" onclick="cfSalvageItem(${idx})">♻ SALVAGE 🪙${salvVal}</button>
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

// ── A4: SALVAGE SYSTEM ──────────────────────────────────────
function cfSalvageItem(idx){
  const item=G.inventory[idx];
  if(!item)return;
  const rarity=item.rarity||'common';
  // Gold return scales with rarity
  const goldPct={common:0.30,uncommon:0.40,rare:0.50,epic:0.50,legendary:0.60}[rarity]||0.30;
  const goldGain=Math.floor((item.value||2)*goldPct);
  G.gold+=goldGain; G.totalGold+=goldGain;
  let resultMsg='♻ Salvaged '+item.name+': +'+goldGain+'g';

  // Material drop by rarity
  const commonMats=['herb','fang','bone'];
  const uncommonMats=['voidShard','ghostEssence','ironCore'];
  const rareMats=['demonAsh','frostCrystal'];
  const epicMats=['celestialDust','shadowEssence'];
  let matPool=[];
  if(rarity==='uncommon') matPool=commonMats;
  else if(rarity==='rare') matPool=uncommonMats;
  else if(rarity==='epic') matPool=rareMats;
  else if(rarity==='legendary') matPool=epicMats;

  if(matPool.length){
    const matId=matPool[Math.floor(Math.random()*matPool.length)];
    const mat=ITEMS.find(i=>i.id===matId);
    if(mat){addItem({...mat,qty:1});resultMsg+=' + '+mat.icon+' '+mat.name;}
  }

  // Temp buff from rare+ items
  if(rarity==='rare'||rarity==='epic'||rarity==='legendary'){
    const buffVal=rarity==='legendary'?8:rarity==='epic'?6:5;
    const buffStat=Math.random()<0.5?'atk':'def';
    if(buffStat==='atk') addOffensiveStat(G,buffVal);
    else G.def+=buffVal;
    G._salvageBuffs.push({stat:buffStat,value:buffVal,source:item.name});
    const salvStatLbl=buffStat==='atk'?getOffensiveStatLabel(G):'DEF';
    resultMsg+=' + '+salvStatLbl+' +'+buffVal+' (this zone)';
  }

  // Remove item
  G.inventory[idx]=null;
  log(resultMsg,'l');
  AUDIO.sfx.loot();
  // Phase B: Track salvage for unlocks
  if(typeof updateUnlockStats === 'function') updateUnlockStats('salvage');
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
  const qpHeal=G._branchSwiftHands?Math.ceil(item.stats.heal*1.5):item.stats.heal;
  heal(qpHeal,item.name+' 🧪');
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
  // Branches have no campfire
  if(G._inBranch){
    btn.disabled=true;
    btn.classList.add('locked');
    btn.classList.remove('unlocked-flash');
    if(prog)prog.textContent='';
    return;
  }
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
  if(G._inBranch){
    log('No campfire in side quests — fight through all 5 enemies!','s');return;
  }
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
  // Safety: if somehow in a branch, return to branch combat, not town
  if(G._inBranch){
    const bgmForZone=ZONES[G.zoneIdx]?.id||'woods';
    AUDIO.playBGM(bgmForZone);
    showScreen('game');
    renderAll();
    if(typeof spawnBranchEnemy==='function') spawnBranchEnemy();
    return;
  }
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
    G.dungeonGoal=G.zoneIdx>=5?6:5;
    showScreen('game');
    renderAll();
    updateCampBtn();
    spawnEnemy();
  }
}

