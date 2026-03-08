const ZONES = [
  {id:'woods',name:'Whispering Woods',num:'I',reqLvl:1,kills:10,
   bgSky:'bg-woods-sky',bgGround:'bg-ground-woods',showTrees:true,
   story:{title:'The Whispering Woods',
     text:'"The road into the Whispering Woods is overgrown and silent. The trees list toward you as you pass — not with malice, but recognition. As if they have been waiting. You have had this feeling before, in dreams. Your hands know the path before your eyes do."'},
   enemies:[
     {id:'goblin',name:'Goblin Scout',sprite:'goblin',color:'#2d6b3a',hp:18,atk:5,def:0,xp:8,gold:2,saveType:'dex',saveDC:10,drop:'herb',dropChance:0.05},
     {id:'wolf',name:'Forest Wolf',sprite:'wolf',color:'#5a5a4a',hp:26,atk:7,def:1,xp:12,gold:3,saveType:'str',saveDC:11},
     {id:'spider',name:'Giant Spider',sprite:'spider',color:'#3a2a4a',hp:21,atk:9,def:1,xp:10,gold:2,saveType:'dex',saveDC:11,canPoison:true},
     {id:'zombie',name:'Treant Sapling',sprite:'zombie',color:'#3a5a2a',hp:31,atk:6,def:3,xp:11,gold:3,saveType:'str',saveDC:11,dropMat:'herb'},
     {id:'skeleton',name:'Bog Witch',sprite:'skeleton',color:'#4a6a3a',hp:16,atk:10,def:0,xp:9,gold:3,saveType:'int',saveDC:11,canPoison:true,dropMat:'herb'},
   ],
   boss:{id:'thornwarden',name:'The Thornwarden',title:'Ancient of the Woods',sprite:'thornwarden',color:'#2d6b3a',
     hp:100,atk:12,def:3,xp:70,gold:20,saveType:'con',saveDC:13,isBoss:true,regen:5,
     special:{name:'Root Slam',desc:'Roots burst from earth — STR save DC12 or Restrained + 8 dmg',saveType:'str',saveDC:12,damage:8},
     phase2:{name:'Thorn Frenzy',desc:'Ancient rage — thorns erupt everywhere for 14 dmg, CON save DC13 or Poisoned',saveType:'con',saveDC:13,damage:14,condition:'Poisoned',atkBonus:2}}},
  {id:'outpost',name:'Ruined Outpost',num:'II',reqLvl:3,kills:12,
   bgSky:'bg-outpost-sky',bgGround:'bg-ground-outpost',showTrees:false,
   story:{title:'The Ruined Outpost',
     text:'"The garrison fell three hundred years ago — the same night the sky first went dark. The soldiers never left. They could not leave. Something beneath the earth holds them here like pins in a map. Their commander, Grakthar, has not forgotten the old war. He has been waiting for the person who started it."'},
   enemies:[
     {id:'skeleton',name:'Skeleton Warrior',sprite:'skeleton',color:'#8a8a7a',hp:35,atk:11,def:2,xp:15,gold:3,saveType:'str',saveDC:12,isUndead:true},
     {id:'zombie',name:'Rotting Zombie',sprite:'zombie',color:'#5a7a4a',hp:46,atk:13,def:3,xp:18,gold:4,saveType:'con',saveDC:12,isUndead:true},
     {id:'ghost',name:'Wailing Ghost',sprite:'ghost',color:'#7a8aaa',hp:27,atk:13,def:0,xp:20,gold:4,saveType:'wis',saveDC:13,isUndead:true,ignoresArmor:true},
     {id:'wolf',name:'Cursed Archer',sprite:'wolf',color:'#6a5a3a',hp:30,atk:14,def:1,xp:17,gold:3,saveType:'dex',saveDC:12,isUndead:true,dropMat:'bone'},
     {id:'goblin',name:'Death Knight',sprite:'goblin',color:'#3a2a4a',hp:54,atk:11,def:5,xp:19,gold:4,saveType:'str',saveDC:13,isUndead:true,dropMat:'bone'},
   ],
   boss:{id:'grakthar',name:'Commander Grakthar',title:'The Undying Warlord',sprite:'grakthar',color:'#8a3a2a',
     hp:175,atk:18,def:5,xp:130,gold:45,saveType:'str',saveDC:14,isBoss:true,isUndead:true,
     special:{name:"Warlord's Bellow",desc:'Frightening roar — WIS save DC13 or Frightened 2 rounds',saveType:'wis',saveDC:13,damage:8,condition:'Frightened'},
     phase2:{name:'Death March',desc:'Undying fury — 18 dmg, STR save DC14 or Stunned 1 round',saveType:'str',saveDC:14,damage:18,condition:'Stunned',atkBonus:3}}},
  {id:'castle',name:'Thornwall Castle',num:'III',reqLvl:6,kills:14,
   bgSky:'bg-outpost-sky',bgGround:'bg-ground-outpost',showTrees:false,
   story:{title:'Thornwall Castle',
     text:'"The Crimson Cult has known your name for decades. They have been preparing this place — not as a fortress, but as a message. The High Priestess Vexara serves something so far below that its voice takes years to travel upward. It told her you were coming. It told her to let you through — after you proved yourself worthy."'},
   enemies:[
     {id:'goblin',name:'Crimson Cultist',sprite:'goblin',color:'#8b1a1a',hp:51,atk:15,def:4,xp:22,gold:5,saveType:'int',saveDC:14,canBurn:true},
     {id:'zombie',name:'Castle Guard',sprite:'zombie',color:'#5a5a8a',hp:70,atk:21,def:7,xp:26,gold:6,saveType:'str',saveDC:14},
     {id:'spider',name:'Gargoyle',sprite:'spider',color:'#6a6a8a',hp:59,atk:20,def:8,xp:24,gold:6,saveType:'dex',saveDC:13},
     {id:'ghost',name:'Dark Sorcerer',sprite:'ghost',color:'#6a1a6a',hp:41,atk:20,def:2,xp:25,gold:6,saveType:'int',saveDC:14,canBurn:true,ignoresArmor:true,dropMat:'voidShard'},
     {id:'skeleton',name:'Iron Sentinel',sprite:'skeleton',color:'#4a4a6a',hp:81,atk:16,def:10,xp:24,gold:6,saveType:'con',saveDC:14,canStun:true,dropMat:'ironCore'},
   ],
   boss:{id:'vexara',name:'Vexara the Crimson',title:'High Priestess of Ruin',sprite:'vexara',color:'#8b0000',
     hp:400,atk:28,def:10,xp:190,gold:65,saveType:'wis',saveDC:16,isBoss:true,brandRound:2,legendaryDrop:'crimsonBrandAmulet',
     special:{name:'Void Eruption',desc:'Dark energy bursts — INT save DC15 or Frightened + 16 dmg',saveType:'int',saveDC:15,damage:16,condition:'Frightened'},
     phase2:{name:'Crimson Ritual',desc:'Blood magic ignites — 30 dmg, CON save DC16 or Burning 3 turns',saveType:'con',saveDC:16,damage:30,condition:'Burning',atkBonus:6}}},
  {id:'underdark',name:'The Underdark',num:'IV',reqLvl:9,kills:16,
   bgSky:'bg-woods-sky',bgGround:'bg-ground-woods',showTrees:false,
   story:{title:'The Underdark',
     text:'"Below the roots, the darkness is not empty — it is full. Full of memories pressed flat by the weight of stone. You can feel them against your skin as you walk. Your own memories. Things you chose to forget. The deeper you go, the more your hands remember a weapon they have carried before."'},
   enemies:[
     {id:'spider',name:'Phase Spider',sprite:'spider',color:'#4a2a8a',hp:81,atk:23,def:6,xp:32,gold:7,saveType:'dex',saveDC:15,canPoison:true},
     {id:'ghost',name:'Shadow Wraith',sprite:'ghost',color:'#2a2a4a',hp:70,atk:31,def:2,xp:36,gold:8,saveType:'wis',saveDC:15,isUndead:true,ignoresArmor:true},
     {id:'zombie',name:'Stone Golem',sprite:'zombie',color:'#6a6a5a',hp:112,atk:29,def:14,xp:34,gold:8,saveType:'con',saveDC:15,canStun:true},
     {id:'goblin',name:'Mind Flayer',sprite:'goblin',color:'#5a2a7a',hp:63,atk:31,def:4,xp:37,gold:9,saveType:'int',saveDC:16,canStun:true,dropMat:'voidShard'},
     {id:'wolf',name:'Deep Lurker',sprite:'wolf',color:'#2a3a5a',hp:98,atk:26,def:8,xp:34,gold:8,saveType:'dex',saveDC:15,canPoison:true,dropMat:'ghostEssence'},
   ],
   boss:{id:'nethrix',name:'Nethrix',title:'Devourer of Worlds',sprite:'nethrix',color:'#4a0a8a',
     hp:560,atk:36,def:14,xp:280,gold:90,saveType:'con',saveDC:17,isBoss:true,
     special:{name:'Mind Shatter',desc:'Psychic assault — WIS save DC16 or Frightened + 20 dmg',saveType:'wis',saveDC:16,damage:20,condition:'Frightened'},
     phase2:{name:'Void Consumption',desc:'Reality unravels — 36 dmg, WIS save DC17 or Stunned + Poisoned',saveType:'wis',saveDC:17,damage:36,condition:'Stunned',condition2:'Poisoned',atkBonus:8}}},
  {id:'abyss',name:'Abyssal Gate',num:'V',reqLvl:12,kills:18,
   bgSky:'bg-outpost-sky',bgGround:'bg-ground-outpost',showTrees:false,
   story:{title:'The Abyssal Gate',
     text:'"The horn that tears the gate open has been sounding for three days. You know this sound. You heard it three centuries ago, when you first descended — when you were the one who chose to open the door in the first place. The demons are not invading. They are responding to a summons. Your summons, echoing backward through time."'},
   enemies:[
     {id:'goblin',name:'Lesser Demon',sprite:'goblin',color:'#6a1a0a',hp:98,atk:32,def:8,xp:44,gold:14,saveType:'dex',saveDC:16,canBurn:true},
     {id:'wolf',name:'Hellhound',sprite:'wolf',color:'#8a2a0a',hp:119,atk:39,def:10,xp:48,gold:11,saveType:'str',saveDC:16,canBurn:true},
     {id:'skeleton',name:'Bone Colossus',sprite:'skeleton',color:'#aaaaaa',hp:154,atk:42,def:16,xp:52,gold:13,saveType:'str',saveDC:17,isUndead:true,canStun:true},
     {id:'ghost',name:'Chaos Imp',sprite:'ghost',color:'#8a1a5a',hp:77,atk:38,def:4,xp:46,gold:11,saveType:'dex',saveDC:16,canBurn:true,ignoresArmor:true,dropMat:'demonAsh'},
     {id:'zombie',name:'Infernal Juggernaut',sprite:'zombie',color:'#5a1a0a',hp:182,atk:32,def:18,xp:54,gold:13,saveType:'con',saveDC:17,canBurn:true,canStun:true,dropMat:'demonAsh'},
   ],
   boss:{id:'zareth',name:'Zareth the Sundered',title:'Lord of the Abyss',sprite:'zareth',color:'#4a0000',
     hp:780,atk:46,def:18,xp:400,gold:140,saveType:'str',saveDC:18,isBoss:true,
     special:{name:'Abyssal Rend',desc:'Reality tears — CON save DC17 or Restrained + 26 dmg',saveType:'con',saveDC:17,damage:26,condition:'Restrained'},
     phase2:{name:'Sundering Howl',desc:'The abyss screams — 45 dmg, CON save DC18 or Burning + Stunned',saveType:'con',saveDC:18,damage:45,condition:'Burning',condition2:'Stunned',atkBonus:11}}},
  {id:'frostpeak',name:'Frostveil Peaks',num:'VI',reqLvl:15,kills:20,
   bgSky:'bg-frostpeak-sky',bgGround:'bg-ground-frost',showTrees:false,
   story:{title:'The Frostveil Peaks',
     text:'"You surfaced from the Abyssal Gate and the town was almost empty. Elspeth was waiting at your door. She handed you a bowl of soup and sat with you until morning. She did not ask where you had been.\n\nThe Frostveil Peaks are where the old war ended — the one the gods scraped from every record, every gravestone, every mouth that might have told it. The soldiers who fell here were not your enemies. They were yours. They followed you into a war against the gods themselves and did not survive it.\n\nValdris was their general. He has been frozen here for three centuries — not trapped. Waiting. He woke the moment he felt you ascending.\n\nHe has one thing left to say to you. He will not say it gently."'},
   enemies:[
     {id:'zombie',name:'Frost Troll',sprite:'zombie',color:'#6a8aaa',hp:174,atk:41,def:12,xp:58,gold:15,saveType:'str',saveDC:17,canStun:true},
     {id:'wolf',name:'Winter Wyvern',sprite:'wolf',color:'#8aaacc',hp:145,atk:50,def:10,xp:62,gold:15,saveType:'dex',saveDC:18,canPoison:true},
     {id:'ghost',name:'Blizzard Wraith',sprite:'ghost',color:'#aaccee',hp:123,atk:53,def:4,xp:60,gold:15,saveType:'wis',saveDC:18,isUndead:true,ignoresArmor:true},
     {id:'skeleton',name:'Glacial Golem',sprite:'skeleton',color:'#aabbcc',hp:210,atk:38,def:20,xp:64,gold:16,saveType:'con',saveDC:18,canStun:true},
     {id:'goblin',name:'Frost Witch',sprite:'goblin',color:'#ccddff',hp:131,atk:51,def:6,xp:63,gold:15,saveType:'int',saveDC:18,canPoison:true,canStun:true,dropMat:'frostCrystal'},
   ],
   boss:{id:'valdris',name:'Valdris the Unbroken',title:'Titan of the Frozen Age',sprite:'zareth',color:'#6aaacc',
     hp:1000,atk:55,def:22,xp:520,gold:180,saveType:'str',saveDC:19,isBoss:true,
     legendaryDrop:'glacialCrown',
     special:{name:'Avalanche Slam',desc:'Mountain-shattering blow — STR save DC18 or Restrained + 32 dmg',saveType:'str',saveDC:18,damage:32,condition:'Restrained'},
     phase2:{name:'Permafrost Roar',desc:'Glacial fury erupts — 55 dmg, CON save DC19 or Stunned + Poisoned',saveType:'con',saveDC:19,damage:55,condition:'Stunned',condition2:'Poisoned',atkBonus:12}}},
  {id:'celestial',name:'Celestial Plane',num:'VII',reqLvl:18,kills:22,
   bgSky:'bg-celestial-sky',bgGround:'bg-ground-celestial',showTrees:false,
   story:{title:'The Celestial Plane',
     text:'"Fewer candles in the windows now. Fewer names on the wall outside the inn. The town has the quality of a breath held a very long time.\n\nThe Celestial Plane is where the vote was taken three hundred years ago. Every god, every divine voice, unanimous. Seal the Unnamed. Seal whatever it loves. Erase the record. Tell the world it was heroism.\n\nAll of them scattered afterward — unable to look at what they had agreed to. All except one.\n\nAuranthos, the Blind God, blinded itself rather than watch the aftermath of its own hand. It has been here since, in a palace of white stone it cannot see, tended by creatures of light that do not understand what they serve.\n\nIt has been waiting for this conversation. It will try to kill you first. That is not malice. It is simply the only way it knows how to begin something it has been dreading for three centuries."'},
   enemies:[
     {id:'ghost',name:'Fallen Seraphim',sprite:'ghost',color:'#ccaaff',hp:189,atk:61,def:8,xp:72,gold:19,saveType:'wis',saveDC:19,ignoresArmor:true},
     {id:'goblin',name:'Astral Assassin',sprite:'goblin',color:'#9966ff',hp:167,atk:66,def:12,xp:70,gold:18,saveType:'dex',saveDC:19},
     {id:'spider',name:'Void Tendril',sprite:'spider',color:'#5533aa',hp:203,atk:52,def:15,xp:74,gold:20,saveType:'con',saveDC:20,canPoison:true},
     {id:'wolf',name:'Divine Hound',sprite:'wolf',color:'#eeccaa',hp:225,atk:50,def:18,xp:76,gold:20,saveType:'str',saveDC:20,canBurn:true},
     {id:'skeleton',name:'Celestial Arbiter',sprite:'skeleton',color:'#ddcc88',hp:210,atk:57,def:16,xp:74,gold:19,saveType:'str',saveDC:20,canStun:true},
   ],
   boss:{id:'auranthos',name:'Auranthos',title:'The Blind God',sprite:'nethrix',color:'#ccaaff',
     hp:1250,atk:70,def:26,xp:650,gold:220,saveType:'wis',saveDC:20,isBoss:true,
     legendaryDrop:'godslayerBlade',
     special:{name:'Divine Judgement',desc:'Blinding light — WIS save DC19 or Frightened + 40 dmg',saveType:'wis',saveDC:19,damage:40,condition:'Frightened'},
     phase2:{name:'Celestial Collapse',desc:'Reality unmakes itself — 65 dmg, WIS save DC20 or Stunned + Burning',saveType:'wis',saveDC:20,damage:65,condition:'Stunned',condition2:'Burning',atkBonus:14}}},
  {id:'shadowrealm',name:'The Shadow Realm',num:'VIII',reqLvl:20,kills:24,
   bgSky:'bg-shadowrealm-sky',bgGround:'bg-ground-shadow',showTrees:false,
   story:{title:'The Shadow Realm',
     text:'"They came to the Gate at dawn. All of them — Rook, Elspeth, Seraphine, Aldric, Father Oswin, Kit. They did not plan it. They simply all ended up there, in the cold, before you left.\n\nElspeth took your hand. She said: You have come back every time. I do not know what you are doing down there. But whatever it is — finish it.\n\nThe Shadow Realm is not a place you built. It grew. Three centuries of the Unnamed\'s grief crystallised into landscape — shadow architecture, frozen light, the shape of a life lived alone in the dark. The Hollow Empress is the last thing standing between you and what you came for.\n\nShe is not the Unnamed. She is what three hundred years of waiting looks like from the outside.\n\nShe will not speak. She will not recognise you. She was not built for recognition. She was built so that the last step would have to be earned.\n\nYou have been earning it since the moment you arrived in Elderfen."'},
   enemies:[
     {id:'ghost',name:'Shade Revenant',sprite:'ghost',color:'#443366',hp:240,atk:76,def:10,xp:85,gold:23,saveType:'wis',saveDC:20,isUndead:true,ignoresArmor:true},
     {id:'spider',name:'Nightmare Stalker',sprite:'spider',color:'#221133',hp:263,atk:78,def:16,xp:88,gold:24,saveType:'dex',saveDC:21,canPoison:true},
     {id:'zombie',name:'Abyssal Hulk',sprite:'zombie',color:'#332244',hp:315,atk:62,def:24,xp:90,gold:25,saveType:'con',saveDC:21,canStun:true},
     {id:'skeleton',name:'Void Knight',sprite:'skeleton',color:'#554477',hp:285,atk:81,def:20,xp:92,gold:25,saveType:'str',saveDC:21,isUndead:true},
     {id:'ghost',name:'Echo Wraith',sprite:'ghost',color:'#331155',hp:248,atk:72,def:8,xp:88,gold:23,saveType:'wis',saveDC:21,isUndead:true,ignoresArmor:true},
   ],
   boss:{id:'malvaris',name:'Malvaris',title:'The Hollow Empress',sprite:'nethrix',color:'#220033',
     hp:1600,atk:90,def:30,xp:800,gold:280,saveType:'wis',saveDC:22,isBoss:true,
     legendaryDrop:'voidcrownOfMalvaris',
     special:{name:"Empress's Silence",desc:'Soul-crushing void — WIS save DC21 or Frightened + Restrained + 50 dmg',saveType:'wis',saveDC:21,damage:50,condition:'Frightened'},
     phase2:{name:'Eternal Darkness',desc:'The realm collapses — 85 dmg, CON save DC22 or Stunned + Burning + Poisoned',saveType:'con',saveDC:22,damage:85,condition:'Stunned',condition2:'Poisoned',atkBonus:18}}},
];

// ══════════════════════════════════════════════════════════
//  SIDE BRANCHES
//  4 optional zones unlocked after specific main-path bosses.
//  Each branch: 5 fights (no campfire), scaling difficulty,
//  unique enemies, unique boss, one-time legendary reward.
// ══════════════════════════════════════════════════════════
const BRANCH_ZONES = [
  // ── BRANCH 0: The Catacombs (unlocks after Zone 2 — Thornwall Castle) ──
  {
    id:'catacombs', name:'The Catacombs', icon:'💀', unlocksAfter:2,
    mapId:'catacombs',
    bgSky:'bg-woods-sky', bgGround:'bg-ground-outpost', showTrees:false,
    mechanic:'gauntlet', // no campfire, 5 fights straight
    story:{
      title:'The Catacombs',
      text:'"Beneath Thornwall Castle lie passages that predate the castle itself. The air here tastes of centuries — of battles sealed underground rather than won. Something has been walking these halls for a very long time. It remembers you."'
    },
    enemies:[
      {id:'skeleton',name:'Crypt Stalker',sprite:'skeleton',color:'#8a8a6a',hp:48,atk:15,def:6,xp:26,gold:9,saveType:'str',saveDC:14,isUndead:true,dropMat:'bone'},
      {id:'ghost',name:'Tomb Wraith',sprite:'ghost',color:'#6a6a9a',hp:36,atk:18,def:2,xp:28,gold:10,saveType:'wis',saveDC:14,isUndead:true,ignoresArmor:true},
      {id:'zombie',name:'Crypt Guardian',sprite:'zombie',color:'#7a6a5a',hp:65,atk:14,def:11,xp:27,gold:9,saveType:'con',saveDC:14,isUndead:true,canStun:true,dropMat:'bone'},
      {id:'wolf',name:'Bone Hound',sprite:'wolf',color:'#9a8a7a',hp:42,atk:16,def:4,xp:25,gold:8,saveType:'dex',saveDC:13,isUndead:true},
      {id:'goblin',name:'Grave Robber',sprite:'goblin',color:'#5a5a4a',hp:38,atk:17,def:3,xp:24,gold:10,saveType:'dex',saveDC:13,canPoison:true,dropMat:'voidShard'},
    ],
    boss:{id:'gravemind',name:'The Gravemind',title:'Ancient Warden of the Dead',sprite:'grakthar',color:'#6a5a8a',
      hp:340,atk:23,def:12,xp:240,gold:80,saveType:'con',saveDC:16,isBoss:true,isUndead:true,
      legendaryDrop:'tombwardenSeal',
      special:{name:'Crypt Surge',desc:'Undead energy erupts — CON save DC15 or Stunned + 22 dmg',saveType:'con',saveDC:15,damage:22,condition:'Stunned'},
      phase2:{name:'Death Unbound',desc:'All restraint gone — 32 dmg, WIS save DC16 or Frightened + Poisoned',saveType:'wis',saveDC:16,damage:32,condition:'Frightened',atkBonus:5}},
  },
  // ── BRANCH 1: The Fungal Warren (unlocks after Zone 0 — Whispering Woods) ──
  {
    id:'fungalwarren', name:'The Fungal Warren', icon:'🍄', unlocksAfter:0,
    mapId:'fungalwarren',
    bgSky:'bg-woods-sky', bgGround:'bg-ground-woods', showTrees:false,
    mechanic:'poison_spreading', // enemies start fight with Poisoned stacks that can spread
    story:{
      title:'The Fungal Warren',
      text:'"The spores reached the surface three months ago. Travelers who entered the Warren came back changed — quieter, slower, smiling at things that weren\'t there. You can feel the haze at the edge of your thoughts already. The fungus is not malicious. It simply wants to grow."'
    },
    enemies:[
      {id:'spider',name:'Spore Crawler',sprite:'spider',color:'#6a8a2a',hp:22,atk:6,def:1,xp:11,gold:3,saveType:'con',saveDC:11,canPoison:true,isFungal:true},
      {id:'zombie',name:'Myconid Shambler',sprite:'zombie',color:'#5a7a3a',hp:28,atk:5,def:4,xp:12,gold:4,saveType:'con',saveDC:11,canPoison:true,isFungal:true,dropMat:'herb'},
      {id:'goblin',name:'Spore Caller',sprite:'goblin',color:'#4a6a2a',hp:18,atk:8,def:0,xp:10,gold:3,saveType:'int',saveDC:11,canPoison:true,isFungal:true},
      {id:'wolf',name:'Infected Beast',sprite:'wolf',color:'#7a8a3a',hp:32,atk:7,def:2,xp:13,gold:4,saveType:'str',saveDC:11,canPoison:true,isFungal:true},
      {id:'zombie',name:'Spore Hulk',sprite:'zombie',color:'#3a5a1a',hp:44,atk:9,def:6,xp:16,gold:5,saveType:'con',saveDC:12,canPoison:true,isFungal:true},
    ],
    boss:{id:'sporelord',name:'The Sporelord',title:'Heart of the Warren',sprite:'thornwarden',color:'#5a8a2a',
      hp:180,atk:13,def:6,xp:100,gold:35,saveType:'con',saveDC:14,isBoss:true,isFungal:true,
      legendaryDrop:'sporecloak',
      special:{name:'Spore Cloud',desc:'Toxic eruption — CON save DC13 or Poisoned 3 turns + 10 dmg',saveType:'con',saveDC:13,damage:10,condition:'Poisoned'},
      phase2:{name:'Mycelium Surge',desc:'The Warren responds — 18 dmg, CON save DC14 or Poisoned + Restrained',saveType:'con',saveDC:14,damage:18,condition:'Poisoned',atkBonus:3}},
  },
  // ── BRANCH 2: The Sunken Vault (unlocks after Zone 1 — Ruined Outpost) ──
  {
    id:'sunkenvault', name:'The Sunken Vault', icon:'💰', unlocksAfter:1,
    mapId:'sunkenvault',
    bgSky:'bg-outpost-sky', bgGround:'bg-ground-outpost', showTrees:false,
    mechanic:'double_loot', // all gold/item drops doubled, but enemies hit 25% harder
    story:{
      title:'The Sunken Vault',
      text:'"The old kingdom\'s treasury went underground when the fortress fell — not looted, just submerged. The guardians who were locked inside to protect it never stopped. Three hundred years of loyalty with nothing left to protect. They attack on sight now. Old habits."'
    },
    enemies:[
      {id:'skeleton',name:'Vault Sentry',sprite:'skeleton',color:'#aa9960',hp:34,atk:11,def:5,xp:18,gold:12,saveType:'str',saveDC:13,isUndead:true,dropMat:'ironCore'},
      {id:'goblin',name:'Flooded Marauder',sprite:'goblin',color:'#6a8a9a',hp:28,atk:13,def:3,xp:17,gold:14,saveType:'dex',saveDC:12,canPoison:true},
      {id:'zombie',name:'Iron Vault Golem',sprite:'zombie',color:'#8a8a6a',hp:50,atk:10,def:9,xp:20,gold:11,saveType:'con',saveDC:13,canStun:true,dropMat:'ironCore'},
      {id:'wolf',name:'Treasure Hound',sprite:'wolf',color:'#aa8840',hp:30,atk:14,def:2,xp:16,gold:15,saveType:'dex',saveDC:12},
      {id:'skeleton',name:'Drowned Sentinel',sprite:'skeleton',color:'#5a7a8a',hp:42,atk:15,def:7,xp:21,gold:16,saveType:'str',saveDC:13,isUndead:true,canStun:true},
    ],
    boss:{id:'vaultkeeper',name:'The Vault Keeper',title:'Eternal Guardian of Lost Coin',sprite:'grakthar',color:'#aa9930',
      hp:250,atk:16,def:9,xp:170,gold:60,saveType:'str',saveDC:15,isBoss:true,isUndead:true,
      legendaryDrop:'keepersMantle',
      special:{name:'Treasury Lock',desc:'Crushing slam — STR save DC14 or Restrained + 16 dmg',saveType:'str',saveDC:14,damage:16,condition:'Restrained'},
      phase2:{name:'Final Lockdown',desc:'Last resort — 24 dmg, CON save DC15 or Stunned 2 rounds',saveType:'con',saveDC:15,damage:24,condition:'Stunned',atkBonus:4}},
  },
  // ── BRANCH 3: The Ashen Wastes (unlocks after Zone 3 — Underdark) ──
  {
    id:'ashenwastes', name:'The Ashen Wastes', icon:'🔥', unlocksAfter:3,
    mapId:'ashenwastes',
    bgSky:'bg-outpost-sky', bgGround:'bg-ground-outpost', showTrees:false,
    mechanic:'event_combat', // random campfire event before each fight instead of normal flow
    story:{
      title:'The Ashen Wastes',
      text:'"The battle here ended three centuries ago but the ground never cooled. Demons and angels died together in numbers large enough to change the soil. The ash that rises with every step used to be something. The things that survived are not quite demons anymore. They are something the war made."'
    },
    enemies:[
      {id:'goblin',name:'Ash Revenant',sprite:'goblin',color:'#8a5a3a',hp:72,atk:21,def:9,xp:36,gold:13,saveType:'dex',saveDC:16,canBurn:true,dropMat:'demonAsh'},
      {id:'wolf',name:'Cinder Hound',sprite:'wolf',color:'#aa4a2a',hp:80,atk:23,def:7,xp:38,gold:14,saveType:'str',saveDC:16,canBurn:true},
      {id:'ghost',name:'Ember Wraith',sprite:'ghost',color:'#cc6a2a',hp:55,atk:26,def:3,xp:39,gold:14,saveType:'wis',saveDC:17,canBurn:true,ignoresArmor:true,dropMat:'demonAsh'},
      {id:'skeleton',name:'Scorched Sentinel',sprite:'skeleton',color:'#7a5a4a',hp:95,atk:19,def:15,xp:37,gold:13,saveType:'con',saveDC:16,canBurn:true,canStun:true,isUndead:true},
      {id:'ghost',name:'Cinder Revenant',sprite:'ghost',color:'#cc4422',hp:88,atk:24,def:11,xp:40,gold:15,saveType:'wis',saveDC:17,canBurn:true,isUndead:true,ignoresArmor:true},
    ],
    boss:{id:'ashprince',name:'The Ash Prince',title:'Last Survivor of the Burning War',sprite:'zareth',color:'#cc5522',
      hp:580,atk:30,def:16,xp:360,gold:125,saveType:'con',saveDC:18,isBoss:true,
      legendaryDrop:'ashprinceMantle',
      special:{name:'Inferno Wave',desc:'Rolling fire — CON save DC17 or Burning 3 turns + 28 dmg',saveType:'con',saveDC:17,damage:28,condition:'Burning'},
      phase2:{name:'Ashen Apocalypse',desc:'The wastes ignite — 42 dmg, CON save DC18 or Burning + Stunned',saveType:'con',saveDC:18,damage:42,condition:'Burning',atkBonus:7}},
  },
];

// Branch reward pool — rolled randomly on branch completion
const BRANCH_STAT_BONUSES = [
  {label:'ATK +6', getLabel:(g)=>getOffensiveStatLabel(g)+' +6', apply:(g)=>{addOffensiveStat(g,6);}},
  {label:'DEF +5',  apply:(g)=>{g.def+=5;}},
  {label:'Max HP +15', apply:(g)=>{g.maxHp+=15; g.hp=Math.min(g.maxHp,g.hp+15);}},
  {label:'Crit Range +1', apply:(g)=>{g.critRange=Math.max(19,g.critRange-1);}},
  {label:'XP Gain +15%', apply:(g)=>{g.xpMult=(g.xpMult||1)*1.15;}},
  {label:'Gold +20%', apply:(g)=>{g.goldMult=(g.goldMult||1)*1.20;}},
];

const BRANCH_PASSIVE_CHOICES = [
  [{name:'Iron Skin',desc:'Permanently reduce all incoming damage by 2.'},{name:'Battle Hardened',desc:'Start every fight with +10 temporary HP.'},{name:'Scavenger',desc:'12% chance to find an extra item after every fight.'}],
  [{name:'Predator',desc:'Deal +15% damage to enemies below 50% HP.'},{name:'Swift Hands',desc:'Potions heal 50% more.'},{name:'Veteran',desc:'+3 ATK and +2 DEF permanently.'}],
  [{name:'Death Defiant',desc:'Once per zone, survive a killing blow at 1 HP.'},{name:'Arcane Infusion',desc:'+10 to all magic damage.'},{name:'Relentless',desc:'Recover 5 HP after killing any enemy.'}],
  [{name:'Sixth Sense',desc:'Reduce all boss special damage by 20%.'},{name:'Treasure Hunter',desc:'All gold gains increased by 40%.'},{name:'Combat Mastery',desc:'+3 ATK, +3 DEF, +15 Max HP permanently.'}],
];

