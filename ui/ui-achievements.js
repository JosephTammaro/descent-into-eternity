// ================================================================
// ui/ui-achievements.js — Achievements, Objectives, Codex
// Descent into Eternity
// ================================================================

// ══════════════════════════════════════════════════════════
//  ACHIEVEMENT / CODEX SYSTEM
// ══════════════════════════════════════════════════════════
const ACHIEVEMENTS = [
  // ── Combat Milestones ─────────────────────────────────
  {id:'first_blood',   icon:'crossed-swords', title:'First Blood',         desc:'Win your first battle.',                           check:g=>g.totalKills>=1},
  {id:'kill10',        icon:'skull',          title:'Slayer',               desc:'Defeat 10 enemies.',                               check:g=>g.totalKills>=10},
  {id:'kill50',        icon:'plain-dagger',   title:'Veteran',              desc:'Defeat 50 enemies.',                               check:g=>g.totalKills>=50},
  {id:'kill100',       icon:'broken-skull',   title:'Centurion',            desc:'Defeat 100 enemies.',                              check:g=>g.totalKills>=100},
  {id:'kill200',       icon:'death-skull',    title:'Butcher',              desc:'Defeat 200 enemies.',                              check:g=>g.totalKills>=200},
  {id:'kill500',       icon:'dripping-blade', title:'Death Incarnate',      desc:'Defeat 500 enemies.',                              check:g=>g.totalKills>=500},
  {id:'first_crit',    icon:'explosion',      title:'Critical Hit!',        desc:'Land your first critical strike.',                  check:g=>(g.totalCrits||0)>=1},
  {id:'crit25',        icon:'target-arrows',  title:'Precision',            desc:'Land 25 critical strikes.',                        check:g=>(g.totalCrits||0)>=25},
  {id:'crit50',        icon:'target-arrows',  title:'Eagle Eye',            desc:'Land 50 critical strikes.',                        check:g=>(g.totalCrits||0)>=50},
  {id:'crit100',       icon:'axe-swing',      title:'Ruthless Efficiency',  desc:'Land 100 critical strikes.',                       check:g=>(g.totalCrits||0)>=100},

  // ── Progression ───────────────────────────────────────
  {id:'zone2',         icon:'compass',        title:'Going Deeper',         desc:'Reach Zone II.',                                   check:g=>g.zoneIdx>=1||g.bossDefeated[0]},
  {id:'zone3',         icon:'castle-emblem',  title:'Castle Crasher',       desc:'Reach Zone III.',                                  check:g=>g.zoneIdx>=2||g.bossDefeated[1]},
  {id:'zone4',         icon:'moon-sun',       title:'Into the Dark',        desc:'Reach Zone IV.',                                   check:g=>g.zoneIdx>=3||g.bossDefeated[2]},
  {id:'zone5',         icon:'fluffy-swirl',   title:'Abyssal Walker',       desc:'Reach Zone V.',                                    check:g=>g.zoneIdx>=4||g.bossDefeated[3]},
  {id:'zone6',         icon:'frost-emblem',   title:'Frostbitten',           desc:'Reach Zone VI.',                                   check:g=>g.zoneIdx>=5||g.bossDefeated[4]},
  {id:'zone7',         icon:'sunbeams',       title:'Heaven\'s Gate',        desc:'Reach Zone VII.',                                  check:g=>g.zoneIdx>=6||g.bossDefeated[5]},
  {id:'zone8',         icon:'trophy',         title:'Descent Complete',      desc:'Reach the Shadow Realm.',                          check:g=>g.zoneIdx>=7||g.bossDefeated[6]},
  {id:'lvl5',          icon:'cycle',          title:'Rising Power',          desc:'Reach level 5.',                                   check:g=>g.level>=5},
  {id:'lvl10',         icon:'trophy',         title:'Champion',              desc:'Reach level 10.',                                  check:g=>g.level>=10},
  {id:'lvl15',         icon:'crystal-cluster',title:'Ascendant',             desc:'Reach level 15.',                                  check:g=>g.level>=15},
  {id:'lvl20',         icon:'crown',          title:'Legend',                 desc:'Reach level 20.',                                  check:g=>g.level>=20},

  // ── Boss Kills ────────────────────────────────────────
  {id:'boss1',         icon:'leaf',           title:'Thornslayer',           desc:'Defeat the Thornwarden.',                          check:g=>g.bossDefeated[0]},
  {id:'boss2',         icon:'crossed-swords', title:'Commander Down',        desc:'Defeat Commander Grakthar.',                       check:g=>g.bossDefeated[1]},
  {id:'boss3',         icon:'crystal-ball',   title:'Cultbreaker',           desc:'Defeat Vexara the Crimson.',                       check:g=>g.bossDefeated[2]},
  {id:'boss4',         icon:'fluffy-swirl',   title:'World Devourer',        desc:'Defeat Nethrix.',                                  check:g=>g.bossDefeated[3]},
  {id:'boss5',         icon:'fluffy-swirl',   title:'Gate Sealer',           desc:'Defeat Zareth the Sundered.',                      check:g=>g.bossDefeated[4]},
  {id:'boss6',         icon:'frost-emblem',   title:'Titan Breaker',          desc:'Defeat Valdris the Unbroken.',                     check:g=>g.bossDefeated[5]},
  {id:'boss7',         icon:'eye-shield',     title:'Godslayer',             desc:'Defeat Auranthos the Blind God.',                  check:g=>g.bossDefeated[6]},
  {id:'boss8',         icon:'moon-sun',       title:'The Return',            desc:'Defeat the Hollow Empress.',                       check:g=>g.bossDefeated[7]},
  {id:'bossAll',       icon:'skull',          title:'No Gods, No Masters',  desc:'Defeat all 8 bosses in a single save.',            check:g=>g.bossDefeated.every(b=>b)},

  // ── Economy ───────────────────────────────────────────
  {id:'gold100',       icon:'gold-bar',       title:'Pocket Change',         desc:'Accumulate 100 total gold.',                       check:g=>(g.totalGold||0)>=100},
  {id:'gold500',       icon:'gold-bar',       title:'Well-Funded',           desc:'Accumulate 500 total gold.',                       check:g=>(g.totalGold||0)>=500},
  {id:'gold2000',      icon:'gold-bar',       title:'Merchant Prince',       desc:'Accumulate 2000 total gold.',                      check:g=>(g.totalGold||0)>=2000},
  {id:'gold5000',      icon:'gold-bar',       title:'War Chest',             desc:'Accumulate 5000 total gold.',                      check:g=>(g.totalGold||0)>=5000},
  {id:'hoard500',      icon:'gold-bar',       title:'Dragon\'s Hoard',       desc:'Hold 500 gold at once.',                           check:g=>g.gold>=500},
  {id:'craft5',        icon:'flask',          title:'Alchemist',             desc:'Craft 5 items.',                                   check:g=>(g.totalCrafts||0)>=5},
  {id:'craft20',       icon:'heart-bottle',   title:'Master Alchemist',      desc:'Craft 20 items.',                                  check:g=>(g.totalCrafts||0)>=20},

  // ── Equipment ─────────────────────────────────────────
  {id:'fullGear',      icon:'round-shield',   title:'Fully Loaded',          desc:'Fill all 8 equipment slots at once.',              check:g=>{if(!g.equipped)return false;return['weapon','armor','ring','offhand','helmet','boots','amulet','gloves'].every(s=>g.equipped[s])}},
  {id:'equipLeg',      icon:'trophy',         title:'Legendary Find',        desc:'Equip a legendary item.',                          check:g=>{if(!g.equipped)return false;return Object.values(g.equipped).some(i=>i&&i.rarity==='legendary')}},
  {id:'equipEpic',     icon:'crystal-ball',   title:'Epic Collector',        desc:'Equip an epic item.',                              check:g=>{if(!g.equipped)return false;return Object.values(g.equipped).some(i=>i&&i.rarity==='epic')}},

  // ── Class Mastery ─────────────────────────────────────
  {id:'subclass',      icon:'scroll-unfurled',title:'Awakened',              desc:'Unlock your subclass.',                            check:g=>g.subclassUnlocked},
  {id:'talent3',       icon:'crystal-wand',   title:'Talented',              desc:'Pick 3 talents.',                                  check:g=>(g.talents||[]).length>=3},
  {id:'talent5',       icon:'crystal-wand',   title:'Well Rounded',          desc:'Pick 5 talents.',                                  check:g=>(g.talents||[]).length>=5},
  {id:'talent7',       icon:'crystal-ball',   title:'Specialist',            desc:'Pick 7 talents.',                                  check:g=>(g.talents||[]).length>=7},
  {id:'ultimate',      icon:'lightning-bolt', title:'Ultimate Power',        desc:'Unlock your ultimate ability.',                    check:g=>g.ultimateUnlocked},
  {id:'capstone',      icon:'fire',           title:'Capstone',              desc:'Unlock your level 20 capstone.',                   check:g=>g.capstoneUnlocked},
  {id:'cls_fighter',   icon:'crossed-swords', title:'Sword and Board',      desc:'Reach Zone V as a Fighter.',                       check:g=>g.classId==='fighter'&&(g.zoneIdx>=4||g.bossDefeated[3])},
  {id:'cls_wizard',    icon:'book',           title:'Archmage',              desc:'Reach Zone V as a Wizard.',                        check:g=>g.classId==='wizard'&&(g.zoneIdx>=4||g.bossDefeated[3])},
  {id:'cls_rogue',     icon:'plain-dagger',   title:'Shadow Master',        desc:'Reach Zone V as a Rogue.',                         check:g=>g.classId==='rogue'&&(g.zoneIdx>=4||g.bossDefeated[3])},
  {id:'cls_paladin',   icon:'ankh',           title:'Holy Avenger',         desc:'Reach Zone V as a Paladin.',                       check:g=>g.classId==='paladin'&&(g.zoneIdx>=4||g.bossDefeated[3])},
  {id:'cls_ranger',    icon:'crossbow',       title:'Pathfinder',            desc:'Reach Zone V as a Ranger.',                        check:g=>g.classId==='ranger'&&(g.zoneIdx>=4||g.bossDefeated[3])},
  {id:'cls_barbarian', icon:'dripping-blade', title:'Unstoppable Fury',     desc:'Reach Zone V as a Barbarian.',                     check:g=>g.classId==='barbarian'&&(g.zoneIdx>=4||g.bossDefeated[3])},
  {id:'cls_cleric',    icon:'sunbeams',       title:'Divine Instrument',    desc:'Reach Zone V as a Cleric.',                        check:g=>g.classId==='cleric'&&(g.zoneIdx>=4||g.bossDefeated[3])},
  {id:'cls_druid',     icon:'leaf',           title:'Nature\'s Wrath',      desc:'Reach Zone V as a Druid.',                         check:g=>g.classId==='druid'&&(g.zoneIdx>=4||g.bossDefeated[3])},

  // ── Objectives & Side Content ─────────────────────────
  {id:'obj1',          icon:'★',             title:'Overachiever',          desc:'Complete 1 secondary objective.',                  check:g=>(g.totalObjectives||0)>=1},
  {id:'obj5',          icon:'★★',            title:'Perfectionist',         desc:'Complete 5 secondary objectives.',                 check:g=>(g.totalObjectives||0)>=5},
  {id:'obj10',         icon:'★★★',           title:'Completionist',         desc:'Complete 10 secondary objectives.',                check:g=>(g.totalObjectives||0)>=10},
  {id:'branch1',       icon:'cycle',          title:'Off the Beaten Path',  desc:'Clear an optional side branch.',                   check:g=>g.branchDefeated&&Object.values(g.branchDefeated).some(b=>b)},
  {id:'branchAll',     icon:'metal-gate',     title:'Explorer Supreme',     desc:'Clear all 4 optional side branches.',              check:g=>g.branchDefeated&&Object.values(g.branchDefeated).every(b=>b)},

  // ── Survival & Grit ───────────────────────────────────
  {id:'close_call',    icon:'health-increase',title:'Close Call',            desc:'Win a fight with less than 10% HP remaining.',     check:g=>g._closeCallFlag},
  {id:'ironman',       icon:'round-shield',   title:'Ironclad',             desc:'Finish a zone without dropping below 50% HP.',     check:g=>g._ironmanFlag},
  {id:'no_rest',       icon:'boot-stomp',     title:'Relentless',            desc:'Clear 5 fights in a row without resting.',         check:g=>(g._noRestStreak||0)>=5},

  // ── Lore & Story ──────────────────────────────────────
  {id:'farewell',      icon:'candle-fire',    title:'The Farewell',         desc:'Witness the farewell cutscene before Zone VIII.',  check:g=>g._farewellShown},
  {id:'town_decay',    icon:'castle-emblem',  title:'Watching It Fade',     desc:'See Elderfen reach its final state.',              check:g=>g.bossDefeated&&g.bossDefeated.filter(b=>b).length>=7},

  // ── Chroma Unlock Achievements ──────────────────────────
  // Fighter
  {id:'chr_fighter_crimson', icon:'crystals', title:'Iron Will',           desc:'Deal 5,000+ total damage in one run as Fighter.',                    category:'chroma', check:g=>g.classId==='fighter'&&(g.totalDmgDealt||0)>=5000},
  {id:'chr_fighter_frost',   icon:'crystals', title:'Frostveil Conqueror', desc:'Defeat Valdris as Fighter.',                                         category:'chroma', check:g=>g.classId==='fighter'&&g.bossDefeated&&g.bossDefeated[5]},
  {id:'chr_fighter_gilded',  icon:'crystals', title:'Untouchable',         desc:'Win 10 flawless fights in one run as Fighter.',                      category:'chroma', check:g=>g.classId==='fighter'&&(g.flawlessWins||0)>=10},
  {id:'chr_fighter_shadow',  icon:'crystals', title:'The Last Standing',   desc:'Defeat the Hollow Empress as Fighter.',                              category:'chroma', check:g=>g.classId==='fighter'&&g.bossDefeated&&g.bossDefeated[7]},
  // Wizard
  {id:'chr_wizard_blood',    icon:'crystals', title:'Thread the Needle',   desc:'Win 3 fights at 5 HP or less as Wizard.',                            category:'chroma', check:g=>g.classId==='wizard'&&(g._lowHpWins||0)>=3},
  {id:'chr_wizard_frost',    icon:'crystals', title:'Spellweaver',         desc:'Cast 150 spells in one run as Wizard.',                              category:'chroma', check:g=>g.classId==='wizard'&&(g.totalSpellsCast||0)>=150},
  {id:'chr_wizard_void',     icon:'crystals', title:'Cantrip Master',      desc:'Defeat a boss using only cantrips as Wizard.',                       category:'chroma', check:g=>g.classId==='wizard'&&g._cantripOnlyBossKill},
  {id:'chr_wizard_golden',   icon:'crystals', title:'Time Lord',           desc:'Kill a boss during Time Stop as Wizard.',                            category:'chroma', check:g=>g.classId==='wizard'&&g._timeStopBossKill},
  // Rogue
  {id:'chr_rogue_crimson',   icon:'crystals', title:'Backstab Artist',     desc:'Land 75 Sneak Attacks in one run as Rogue.',                         category:'chroma', check:g=>g.classId==='rogue'&&(g.totalSneakAttacks||0)>=75},
  {id:'chr_rogue_ghost',     icon:'crystals', title:'Phantom',             desc:'Win 15 flawless fights lifetime as Rogue.',                          category:'chroma', check:g=>g.classId==='rogue'&&(g._lifetimeFlawlessRogue||0)>=15},
  {id:'chr_rogue_royal',     icon:'crystals', title:'King of Thieves',     desc:'Earn 10,000 lifetime gold as Rogue.',                                category:'chroma', check:g=>g.classId==='rogue'&&(g._lifetimeGoldRogue||0)>=10000},
  {id:'chr_rogue_nightshade',icon:'crystals', title:'Perfect Assassination',desc:'Kill a boss in 3 rounds or fewer as Rogue.',                       category:'chroma', check:g=>g.classId==='rogue'&&g._fastBossKill&&g._fastBossKill<=3},
  // Paladin
  {id:'chr_paladin_blood',   icon:'crystals', title:'Smite Eternal',       desc:'Use Divine Smite 100 times lifetime as Paladin.',                    category:'chroma', check:g=>g.classId==='paladin'&&(g._lifetimeSmitesPaladin||0)>=100},
  {id:'chr_paladin_lunar',   icon:'crystals', title:'Healing Hands',       desc:'Heal 1,500+ HP with Lay on Hands in one run.',                      category:'chroma', check:g=>g.classId==='paladin'&&(g.totalHealingDone||0)>=1500},
  {id:'chr_paladin_dusk',    icon:'crystals', title:'Twilight Vigil',      desc:'Finish a run healing more than damage taken as Paladin.',             category:'chroma', check:g=>g.classId==='paladin'&&g.bossDefeated&&g.bossDefeated[7]&&(g.totalHealingDone||0)>(g.totalDmgTaken||0)},
  {id:'chr_paladin_void',    icon:'crystals', title:'Judgment',            desc:'Defeat Auranthos as Paladin.',                                       category:'chroma', check:g=>g.classId==='paladin'&&g.bossDefeated&&g.bossDefeated[6]},
  // Ranger
  {id:'chr_ranger_ember',    icon:'crystals', title:'Marked for Death',    desc:'Kill 30 marked enemies in one zone as Ranger.',                      category:'chroma', check:g=>g.classId==='ranger'&&(g._markedKillsThisZone||0)>=30},
  {id:'chr_ranger_arctic',   icon:'crystals', title:'Marked for Extinction',desc:'Kill 3 bosses with Hunter\'s Mark active as Ranger (lifetime).',     category:'chroma', check:g=>g.classId==='ranger'&&(g._markedBossKills||0)>=3},
  {id:'chr_ranger_shadow',   icon:'crystals', title:'Deadeye',             desc:'Land 50 crits in one run as Ranger.',                                category:'chroma', check:g=>g.classId==='ranger'&&(g.totalCrits||0)>=50},
  {id:'chr_ranger_verdant',  icon:'crystals', title:"Nature's Wrath",      desc:'Deal 4,000+ total damage in a single run as Ranger.',                category:'chroma', check:g=>g.classId==='ranger'&&(g.totalDmgDealt||0)>=4000},
  // Barbarian
  {id:'chr_barb_bloodrage',  icon:'crystals', title:'Reckless Abandon',    desc:'Use Reckless Attack 60 times in one run.',                           category:'chroma', check:g=>g.classId==='barbarian'&&(g.totalReckless||0)>=60},
  {id:'chr_barb_frost',      icon:'crystals', title:"Death's Door",        desc:'Win a fight at exactly 1 HP as Barbarian.',                          category:'chroma', check:g=>g.classId==='barbarian'&&g._wonAt1HP},
  {id:'chr_barb_volcanic',   icon:'crystals', title:'Wrecking Ball',       desc:'Deal 300+ damage in a single fight.',                                category:'chroma', check:g=>g.classId==='barbarian'&&(g._dmgThisFight||0)>=300},
  {id:'chr_barb_void',       icon:'crystals', title:'The Descent Complete',desc:'Defeat the Hollow Empress as Barbarian.',                            category:'chroma', check:g=>g.classId==='barbarian'&&g.bossDefeated&&g.bossDefeated[7]},
  // Cleric
  {id:'chr_cleric_shadow',   icon:'crystals', title:'Smite the Wicked',    desc:'Deal 3,000+ total damage in one run as Cleric.',                     category:'chroma', check:g=>g.classId==='cleric'&&(g.totalDmgDealt||0)>=3000},
  {id:'chr_cleric_lunar',    icon:'crystals', title:'Mercy',               desc:'Heal 3,000+ HP in one run as Cleric.',                               category:'chroma', check:g=>g.classId==='cleric'&&(g.totalHealingDone||0)>=3000},
  {id:'chr_cleric_solar',    icon:'crystals', title:'Channel Master',      desc:'Use Channel Divinity 40 times lifetime.',                            category:'chroma', check:g=>g.classId==='cleric'&&(g._lifetimeChannelsCleric||0)>=40},
  {id:'chr_cleric_ember',    icon:'crystals', title:'The Undying',         desc:'Full run never dropping below 25% HP as Cleric.',                    category:'chroma', check:g=>g.classId==='cleric'&&g.bossDefeated&&g.bossDefeated[7]&&!g._droppedBelow25},
  // Druid
  {id:'chr_druid_autumn',    icon:'crystals', title:'Shapeshifter',        desc:'Spend 120 turns in Wild Shape lifetime.',                            category:'chroma', check:g=>g.classId==='druid'&&(g._lifetimeWildShapeTurnsDruid||0)>=120},
  {id:'chr_druid_winter',    icon:'crystals', title:"Nature's Descent",    desc:'Reach Zone VIII as Druid.',                                          category:'chroma', check:g=>g.classId==='druid'&&(g.zoneIdx>=7||g.bossDefeated[6])},
  {id:'chr_druid_shadow',    icon:'crystals', title:'Toxic',               desc:'Poison 50 enemies lifetime as Druid.',                               category:'chroma', check:g=>g.classId==='druid'&&(g._lifetimePoisonsDruid||0)>=50},
  {id:'chr_druid_primal',    icon:'crystals', title:'Apex Predator',       desc:'Kill 3 enemies in one Primal Avatar activation.',                    category:'chroma', check:g=>g.classId==='druid'&&g._primalAvatarTripleKill},
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
  document.getElementById('achToastIcon').innerHTML=iconHTML(ach.icon);
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
      <span class="ach-icon">${got?iconHTML(a.icon):'●'}</span>
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
  if(G.classId==='ranger') G._lifetimeObjectivesRanger=(G._lifetimeObjectivesRanger||0)+1;
  log('★ OBJECTIVE COMPLETE: '+def.title+'! +'+def.reward.gold+'g'+(def.reward.item?' + bonus item':''),'l');
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
  const status=obj.completed?'✓ COMPLETE':obj.failed?'✗ FAILED':
    (obj.goal?`${obj.progress}/${obj.goal}`:'Active');
  const color=obj.completed?'var(--green2)':obj.failed?'var(--red2)':'var(--gold2)';
  el.style.display='block';
  el.innerHTML=`<span style="color:${color}">${def.icon} ${def.title}: ${def.desc} — ${status}</span>`;
}

