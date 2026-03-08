// ================================================================
// ui/ui-charsheet.js — Character Sheet + Chroma Gallery
// Descent into Eternity
// ================================================================

let _chromaGalleryClass = 'fighter';

// ══════════════════════════════════════════════════════════
//  CHAR SHEET
// ══════════════════════════════════════════════════════════
function toggleCharDrawer(){
  // Drawer removed — left panel is always visible.
  // Open full character sheet instead.
  if(G) showCharSheet();
}

// Legacy alias
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
        ${row('Subclass',G.subclassId&&typeof SUBCLASSES!=='undefined'&&SUBCLASSES[G.subclassId]?SUBCLASSES[G.subclassId].name:'(Lv3)')}
        ${row('Level',G.level)}
        ${row('Prof','+'+G.profBonus)}
        ${row('HP',Math.ceil(G.hp)+'/'+G.maxHp,'var(--green2)')}
        ${(()=>{
          const casters=['wizard','cleric','druid'];
          const isCaster=casters.includes(G.classId);
          const isHybrid=G.classId==='paladin';
          const inBear=G.classId==='druid'&&G.wildShapeActive&&G._humanStats;
          if(isCaster && !inBear){
            const splTotal=typeof getSpellPower==='function'?getSpellPower():(G.spellPower||0)+(G.magBonus||0)+G.profBonus;
            return row('SPL',splTotal,'#c090ff');
          } else if(isHybrid){
            const splTotal=typeof getSpellPower==='function'?getSpellPower():(G.spellPower||0)+(G.magBonus||0)+G.profBonus;
            return row('ATK',G.atk,'#e74c3c') + row('SPL',splTotal,'#c090ff');
          } else {
            const atkLabel='ATK'+(inBear?' 🐻':'');
            const atkColor=inBear?'#cd853f':'#e74c3c';
            const atkVal=G.atk+(inBear?' [BEAR]':'');
            return row(atkLabel,atkVal,atkColor);
          }
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
        ${cls.skills.filter(sk=>(!sk.subclassOnly||(G.level>=3&&G.subclassId&&sk.subclassId===G.subclassId))&&(!sk.ultimateOnly||G.ultimateUnlocked)&&(!G.skillLoadout||G.skillLoadout.includes(sk.id)||sk.ultimateOnly)).map(sk=>`<div class="csi-talent"><div class="csi-talent-name">${sk.icon} ${sk.name} <span style="color:var(--dim);font-size:5px;">[${sk.type.toUpperCase()}]</span></div><div class="csi-talent-desc">${sk.desc}</div></div>`).join('')}
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
      ${(function(){
        const casters=['wizard','cleric','druid'];
        const isCaster=casters.includes(G.classId);
        const isHybrid=G.classId==='paladin';
        const splVal=typeof getSpellPower==='function'?getSpellPower():(G.spellPower||0)+(G.magBonus||0)+G.profBonus;
        const rows=[['Class',cls.name],['Subclass',G.subclassId&&typeof SUBCLASSES!=='undefined'&&SUBCLASSES[G.subclassId]?SUBCLASSES[G.subclassId].name:'(Unlocks Lv3)'],['Level',G.level],['Proficiency','+'+G.profBonus],['HP',Math.ceil(G.hp)+'/'+G.maxHp]];
        if(isCaster){ rows.push(['SPL',splVal]); }
        else if(isHybrid){ rows.push(['ATK',G.atk]); rows.push(['SPL',splVal]); }
        else { rows.push(['ATK',G.atk]); }
        rows.push(['DEF',G.def],['Crit',(G.critRange-(G.critBonus||0))+'-20'],['Gold','🪙'+G.gold],['Kills',G.totalKills]);
        return rows.map(([k,v])=>`<div class="cs-row"><span>${k}</span><span class="cs-val">${v}</span></div>`).join('');
      })()}
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
      ${cls.skills.filter(sk=>(!sk.subclassOnly||(G.level>=3&&G.subclassId&&sk.subclassId===G.subclassId))&&(!sk.ultimateOnly||G.ultimateUnlocked)&&(!G.skillLoadout||G.skillLoadout.includes(sk.id)||sk.ultimateOnly)).map(sk=>`<div class="talent-entry"><div class="te-name">${sk.icon} ${sk.name}</div><div class="te-desc">${sk.desc} [${sk.type}]</div></div>`).join('')}
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

// ══════════════════════════════════════════════════════════
//  CHROMA GALLERY — Browse, preview, and select chromas
// ══════════════════════════════════════════════════════════

function openChromaGallery(classId){
  _chromaGalleryClass = classId || 'fighter';
  let overlay = document.getElementById('chromaGalleryOverlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'chromaGalleryOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:850;background:#04020a;overflow-y:auto;display:flex;flex-direction:column;align-items:center;padding:32px 24px 80px;';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
  _renderChromaGalleryContent(overlay);
}

function closeChromaGallery(){
  const overlay = document.getElementById('chromaGalleryOverlay');
  if(overlay) overlay.style.display = 'none';
  // Refresh class select so chroma filters update on the cards
  if(typeof renderClassSelect==='function') renderClassSelect();
}

function _renderChromaGalleryContent(container){
  const classId = _chromaGalleryClass;
  const chromas = (typeof CHROMAS!=='undefined') ? CHROMAS[classId] : [];
  const slotData = (typeof activeSaveSlot!=='undefined'&&activeSaveSlot&&typeof loadSlotData==='function') ? loadSlotData(activeSaveSlot) : null;
  const unlockedAchs = slotData ? (slotData.achievements||[]) : [];
  const selections = slotData ? (slotData.chromaSelections||{}) : {};
  const activeChroma = selections[classId] || null;
  const totalUnlocked = Object.keys(CHROMAS||{}).reduce((sum,cid)=>{
    return sum + (CHROMAS[cid]||[]).filter(c=>unlockedAchs.includes(c.achId)).length;
  },0);
  const totalChromas = Object.keys(CHROMAS||{}).reduce((sum,cid)=>sum+(CHROMAS[cid]||[]).length, 0);

  const ALL_CLASSES = typeof CLASSES!=='undefined' ? CLASSES : {};

  // Class tab bar
  let tabsHtml = Object.keys(ALL_CLASSES).map(cid=>{
    const cls = ALL_CLASSES[cid];
    const active = cid===classId;
    const classUnlocked = ((CHROMAS||{})[cid]||[]).filter(c=>unlockedAchs.includes(c.achId)).length;
    return `<button onclick="_chromaGalleryClass='${cid}';_renderChromaGalleryContent(document.getElementById('chromaGalleryOverlay'));"
      style="
        font-family:'Press Start 2P',monospace;font-size:clamp(8px,1vw,11px);
        padding:10px 16px;border:1px solid ${active?'var(--gold)':'rgba(255,255,255,0.12)'};
        background:${active?'rgba(200,168,75,0.15)':'transparent'};
        color:${active?'var(--gold)':'#666'};cursor:pointer;white-space:nowrap;
        transition:all 0.15s;
      ">${cls.name} <span style="opacity:0.5;font-size:8px;">${classUnlocked}/4</span></button>`;
  }).join('');

  // Card shared styles
  const CARD_W = 'min-width:180px;flex:1;max-width:260px;';
  const SPRITE_H = '180px';
  const SPRITE_SCALE = 140;

  // Chroma cards — default + 4 chromas
  let cardsHtml = '';

  // Default card
  const isDefaultActive = !activeChroma;
  cardsHtml += `<div onclick="selectChroma('${classId}',null)" style="
    background:rgba(255,255,255,0.02);border:2px solid ${isDefaultActive?'var(--gold)':'rgba(255,255,255,0.08)'};
    padding:24px 20px;text-align:center;cursor:pointer;transition:all 0.2s;${CARD_W}
    ${isDefaultActive?'box-shadow:0 0 24px rgba(200,168,75,0.2);':''}
  ">
    <div style="width:100%;height:${SPRITE_H};display:flex;align-items:center;justify-content:center;margin-bottom:16px;position:relative;">
      <div id="cg-sprite-default" style="display:flex;align-items:flex-end;justify-content:center;width:${SPRITE_SCALE}px;height:${SPRITE_H};"></div>
    </div>
    <div style="font-family:'Press Start 2P',monospace;font-size:clamp(10px,1.2vw,14px);color:var(--gold);letter-spacing:1px;margin-bottom:6px;">DEFAULT</div>
    <div style="font-size:13px;color:#666;font-style:italic;">The original.</div>
    ${isDefaultActive?'<div style="font-family:\'Press Start 2P\',monospace;font-size:9px;color:var(--gold);margin-top:10px;letter-spacing:1px;">✓ ACTIVE</div>':''}
  </div>`;

  // Chroma cards
  if(chromas) chromas.forEach(chroma=>{
    const unlocked = unlockedAchs.includes(chroma.achId);
    const isActive = activeChroma===chroma.id;
    const ach = ACHIEVEMENTS.find(a=>a.id===chroma.achId);

    if(unlocked){
      cardsHtml += `<div onclick="selectChroma('${classId}','${chroma.id}')" style="
        background:rgba(255,255,255,0.02);border:2px solid ${isActive?'var(--gold)':'rgba(255,255,255,0.08)'};
        padding:24px 20px;text-align:center;cursor:pointer;transition:all 0.2s;${CARD_W}
        ${isActive?'box-shadow:0 0 24px rgba(200,168,75,0.2);':''}
      ">
        <div style="width:100%;height:${SPRITE_H};display:flex;align-items:center;justify-content:center;margin-bottom:16px;position:relative;">
          <div id="cg-sprite-${chroma.id}" style="display:flex;align-items:flex-end;justify-content:center;width:${SPRITE_SCALE}px;height:${SPRITE_H};"></div>
        </div>
        <div style="font-family:'Press Start 2P',monospace;font-size:clamp(10px,1.2vw,14px);color:var(--gold);letter-spacing:1px;margin-bottom:6px;">${chroma.name.toUpperCase()}</div>
        <div style="font-size:13px;color:#888;font-style:italic;line-height:1.6;">${chroma.desc}</div>
        ${isActive?'<div style="font-family:\'Press Start 2P\',monospace;font-size:9px;color:var(--gold);margin-top:10px;letter-spacing:1px;">✓ ACTIVE</div>':'<div style="font-family:\'Press Start 2P\',monospace;font-size:9px;color:#555;margin-top:10px;letter-spacing:1px;">SELECT</div>'}
      </div>`;
    } else {
      // Locked silhouette
      cardsHtml += `<div style="
        background:rgba(255,255,255,0.01);border:2px solid rgba(255,255,255,0.05);
        padding:24px 20px;text-align:center;${CARD_W}opacity:0.6;
      ">
        <div style="width:100%;height:${SPRITE_H};display:flex;align-items:center;justify-content:center;margin-bottom:16px;position:relative;">
          <div id="cg-sprite-locked-${chroma.id}" style="display:flex;align-items:flex-end;justify-content:center;width:${SPRITE_SCALE}px;height:${SPRITE_H};filter:brightness(0);opacity:0.4;"></div>
        </div>
        <div style="font-family:'Press Start 2P',monospace;font-size:clamp(10px,1.2vw,14px);color:#555;letter-spacing:1px;margin-bottom:6px;">???</div>
        <div style="font-size:12px;color:#444;margin-top:10px;">🔒 ${ach?ach.title:'Hidden'}</div>
        <div style="font-size:12px;color:#383838;font-style:italic;line-height:1.6;margin-top:6px;">${ach?ach.desc:''}</div>
      </div>`;
    }
  });

  container.innerHTML = `
    <div style="width:100%;max-width:1200px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;">
        <button onclick="closeChromaGallery()" style="font-family:'Press Start 2P',monospace;font-size:10px;padding:10px 18px;background:transparent;border:1px solid rgba(255,255,255,0.15);color:#888;cursor:pointer;">← BACK</button>
        <div style="text-align:center;">
          <div style="font-family:'Press Start 2P',monospace;font-size:clamp(14px,2vw,22px);color:var(--gold);letter-spacing:4px;">CHROMA GALLERY</div>
          <div style="font-family:'Press Start 2P',monospace;font-size:9px;color:#555;margin-top:6px;">${totalUnlocked} / ${totalChromas} UNLOCKED</div>
        </div>
        <div style="width:90px;"></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:36px;">
        ${tabsHtml}
      </div>
      <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center;">
        ${cardsHtml}
      </div>
    </div>
  `;

  // Render sprites into their containers
  setTimeout(()=>{
    // Default sprite
    const defEl = document.getElementById('cg-sprite-default');
    if(defEl){
      if(window.hasImageSprite && window.hasImageSprite(classId)){
        window.renderImageSpriteStatic(classId, defEl, SPRITE_SCALE);
      } else if(typeof CLASS_SPRITES!=='undefined' && CLASS_SPRITES[classId]){
        renderSprite(CLASS_SPRITES[classId], 6, defEl);
      }
    }
    // Chroma sprites
    if(chromas) chromas.forEach(chroma=>{
      const unlocked = unlockedAchs.includes(chroma.achId);
      const elId = unlocked ? 'cg-sprite-'+chroma.id : 'cg-sprite-locked-'+chroma.id;
      const el = document.getElementById(elId);
      if(!el) return;
      if(window.hasImageSprite && window.hasImageSprite(classId)){
        window.renderImageSpriteStatic(classId, el, SPRITE_SCALE);
        if(unlocked){
          const img = el.querySelector('img.img-sprite');
          if(img) img.style.filter = chroma.filter;
        }
      } else if(typeof CLASS_SPRITES!=='undefined' && CLASS_SPRITES[classId]){
        renderSprite(CLASS_SPRITES[classId], 6, el);
        if(unlocked) el.style.filter = chroma.filter;
      }
    });
  }, 50);
}

function selectChroma(classId, chromaId){
  if(typeof activeSaveSlot==='undefined'||!activeSaveSlot||typeof updateSlotData!=='function') return;
  updateSlotData(activeSaveSlot, function(d){
    if(!d.chromaSelections) d.chromaSelections = {};
    d.chromaSelections[classId] = chromaId; // null = default
  });
  // If currently in a run as this class, update live
  if(G && G.classId===classId){
    G._activeChroma = chromaId;
  }
  // Refresh gallery
  const overlay = document.getElementById('chromaGalleryOverlay');
  if(overlay && overlay.style.display!=='none') _renderChromaGalleryContent(overlay);
}

