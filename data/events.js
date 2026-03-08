const RANDOM_EVENTS = [
  // ── UNIVERSAL EVENTS (any zone) ────────────────────────────
  {title:'THE WOUNDED TRAVELER',
   zones:null,
   text:'"A badly wounded traveler collapses at your feet. They whisper of a nearby cache of supplies. Help me... and I will show you the way."',
   choices:[
     {text:'Aid them — gain a healing potion',outcome:(g)=>{addItem({...ITEMS.find(i=>i.id==='hpPotion'),qty:1});return '✓ You healed the traveler. They gave you a potion in gratitude.'}},
     {text:'Take their gold and leave (gain 25g)',outcome:(g)=>{g.gold+=25;return '✓ You took their purse (25g). A cold choice.'}},
     {text:'Pass them by',outcome:(g)=>'You left them to their fate. Some burdens are not yours to carry.'},
   ]},
  {title:'THE MYSTERIOUS MERCHANT',
   zones:null,
   text:'"A cloaked figure materialises from shadow, offering a glowing vial. This could change your life... or end it. Fifty gold, if you dare."',
   choices:[
     {text:'Buy it for 50g — temporary power surge',outcome:(g)=>{if(g.gold>=50){g.gold-=50;addOffensiveStat(g,8);g.critBonus=(g.critBonus||0)+3;return '✓ Lightning courses through you. '+getOffensiveStatLabel(g)+' +8, Crit +3 for this zone!'}return '✗ Not enough gold.'}},
     {text:'Drink the free sample (50/50 risk)',outcome:(g)=>{if(Math.random()<.5){g.def+=6;g.maxHp+=15;g.hp+=15;return '✓ Your skin hardens like bark. DEF +6, Max HP +15.'}else{g.hp=Math.max(1,g.hp-Math.floor(g.maxHp*.3));return '✗ It burned like acid. You lost 30% HP.'}}},
     {text:'Refuse and walk away',outcome:(g)=>'You walk away. The figure dissolves like smoke.'},
   ]},
  {title:'THE OLD SHRINE',
   zones:null,
   text:'"Half-buried in rubble stands an ancient shrine. Offerings left here long ago have rotted to dust — but the idol\'s eyes still glow faintly. Pray, take, or move on?"',
   choices:[
     {text:'Pray at the shrine (gain +2 to all saves)',outcome:(g)=>{g.def+=3;g.critBonus=(g.critBonus||0)+1;return '✓ A quiet strength fills you. DEF +3, Crit +1.'}},
     {text:'Take the offering gold (20g, risk a curse)',outcome:(g)=>{g.gold+=20;if(Math.random()<.4){g.hp=Math.max(1,g.hp-15);return '✓ You took 20g — then felt a sudden cold. Lost 15 HP.'}return '✓ You pocketed 20g. No curse. Lucky.'}},
     {text:'Leave an offering (spend 10g, gain XP)',outcome:(g)=>{if(g.gold>=10){g.gold-=10;g.xp+=Math.floor(g.xpNeeded*.08);return '✓ You spent 10g in tribute. A small blessing of insight fills you.'}return '✗ You have no gold to offer.'}},
   ]},
  {title:'THE GAMBLER\'S DICE',
   zones:null,
   text:'"A skeletal hand emerges from a crack in the wall, clutching a pair of dice. A note reads: Roll for fortune, or walk away poorer in spirit."',
   choices:[
     {text:'Roll the dice (win or lose 40g)',outcome:(g)=>{const r=Math.floor(Math.random()*6)+Math.floor(Math.random()*6)+2;if(r>=7){g.gold+=40;return `✓ You rolled ${r}! Fortune smiles — gained 40g.`}else{g.gold=Math.max(0,g.gold-40);return `✗ You rolled ${r}. The hand snatches 40g from you.`}}},
     {text:'Bet big — 80g for double (50/50)',outcome:(g)=>{if(g.gold<80)return '✗ Not enough gold to bet.';if(Math.random()<.5){g.gold+=80;return '✓ Against all odds, you doubled it! +80g.'}g.gold-=80;return '✗ You lost it all. 80g gone.'}},
     {text:'Ignore the dice',outcome:(g)=>'You walk past the dice. They stop themselves with a clatter. Probably rigged anyway.'},
   ]},
  {title:'THE FALLEN WARRIOR',
   zones:null,
   text:'"You find a dying warrior propped against a wall, still clutching their weapon. Their eyes flicker open. "Take it," they rasp. "Don\'t let it rust here.""',
   choices:[
     {text:'Accept their weapon (random uncommon)',outcome:(g)=>{const pool=ITEMS.filter(i=>i.rarity==='uncommon'&&i.type==='weapon');const item={...pool[Math.floor(Math.random()*pool.length)],qty:1};addItem(item);return `✓ You took the ${item.name}. The warrior smiled and closed their eyes.`}},
     {text:'Heal them with a potion instead',outcome:(g)=>{const idx=g.inventory.findIndex(i=>i&&(i.id==='hpPotion'||i.id==='strongPotion'));if(idx===-1)return '✗ You have no potions to spare.';g.inventory[idx].qty--;if(g.inventory[idx].qty<=0)g.inventory[idx]=null;g.xp+=Math.floor(g.xpNeeded*.12);return '✓ You used a potion on them. They gripped your arm in thanks. Gained bonus XP.'}},
     {text:'Leave them in peace',outcome:(g)=>'You close their eyes and move on. Some things cannot be saved.'},
   ]},
  {title:'THE ECHOING VOICE',
   zones:null,
   text:'"A disembodied voice fills the air: "Answer me truly, traveller. What do you fight for?" It feels like a test — or a trap."',
   choices:[
     {text:'Answer: Glory (gain 5% crit chance)',outcome:(g)=>{g.critBonus=(g.critBonus||0)+1;return '✓ The voice laughs — low and approving. Crit range +1.'}},
     {text:'Answer: Survival (gain 25 max HP)',outcome:(g)=>{g.maxHp+=25;g.hp+=25;return '✓ The voice sighs knowingly. Your body feels more resilient.'}},
     {text:'Answer: Nothing (50/50 punish or reward)',outcome:(g)=>{if(Math.random()<.5){g.gold+=60;return '✓ Silence. Then gold rains from nowhere. 60g.'}g.hp=Math.max(1,g.hp-Math.floor(g.maxHp*.25));return '✗ The voice screams. You lose 25% HP.'}},
   ]},

  // ── WOODS / EARLY ZONE EVENTS ──────────────────────────────
  {title:'THE SPIDER\'S WEB',
   zones:['woods','outpost'],
   text:'"Thick webs block the path. Something enormous has been feeding here recently — bones and armour scraps litter the ground. There might be something worth salvaging."',
   choices:[
     {text:'Carefully search the webs (50% find uncommon item)',outcome:(g)=>{if(Math.random()<.5){const pool=ITEMS.filter(i=>i.rarity==='uncommon'&&i.slot);const item={...pool[Math.floor(Math.random()*pool.length)],qty:1};addItem(item);return `✓ Wrapped in silk: ${item.icon} ${item.name}! You cut it free.`}return '✗ Nothing but old bones and rusted metal.'}},
     {text:'Burn the webs (take 8 dmg, clear path)',outcome:(g)=>{g.hp=Math.max(1,g.hp-8);return '✓ The webs ignite. You burst through — scorched but moving. Lost 8 HP.'}},
     {text:'Find a way around — lose nothing',outcome:(g)=>'You circle the webs cautiously. Slower, but safer.'},
   ]},
  {title:'THE WOLF PACK',
   zones:['woods'],
   text:'"You hear growling from the shadows. A pair of amber eyes blink at you — then a dozen more. You\'re surrounded. How do you respond?"',
   choices:[
     {text:'Stand firm and stare them down (WIS check)',outcome:(g)=>{if(Math.random()<.55){return '✓ The pack leader blinks first. They slink away — you\'ve earned a predator\'s respect.'}g.hp=Math.max(1,g.hp-12);return '✗ They attack as one. You fight them off — barely. Lost 12 HP.'}},
     {text:'Throw meat from rations (lose 10g value)',outcome:(g)=>{g.gold=Math.max(0,g.gold-10);return '✓ You distract them with scraps. The pack feeds and ignores you.'}},
     {text:'Run (50% escape, 50% get bitten for 15 dmg)',outcome:(g)=>{if(Math.random()<.5)return '✓ You sprint clear. They give up after a hundred yards.';g.hp=Math.max(1,g.hp-15);return '✗ One catches you. Bite wounds — lost 15 HP.'}},
   ]},

  // ── CASTLE / UNDEAD ZONE EVENTS ───────────────────────────
  {title:'THE HAUNTED ARMORY',
   zones:['outpost','castle'],
   text:'"Ghostly light spills from a cracked door. Inside: racks of ancient arms, still gleaming. The armour shifts. Something is still wearing it."',
   choices:[
     {text:'Speak to the spirit (ask for armour)',outcome:(g)=>{if(Math.random()<.6){const pool=ITEMS.filter(i=>i.rarity==='uncommon'&&(i.type==='armor'||i.type==='offhand'));const item={...pool[Math.floor(Math.random()*pool.length)],qty:1};addItem(item);return `✓ The ghost nods slowly and releases ${item.icon} ${item.name}.`}g.hp=Math.max(1,g.hp-10);return '✗ The spirit screams and hurls you back. Lost 10 HP.';}},
     {text:'Grab what you can and run (gain 50g)',outcome:(g)=>{g.gold+=50;g.hp=Math.max(1,g.hp-10);return '✓ You bolt with 50g in gear. The spirit shrieks behind you. Lost 10 HP.'}},
     {text:'Leave the dead to their rest',outcome:(g)=>'You back away slowly. The door swings shut with a hollow click.'},
   ]},
  {title:'THE NECROTIC POOL',
   zones:['underdark','castle'],
   text:'"A pool of faintly glowing liquid fills a stone basin. It smells of death — but also of power. Cultists have been using this. You could too."',
   choices:[
     {text:'Drink from the pool (gain +20 max HP, take 15 dmg)',outcome:(g)=>{g.maxHp+=20;g.hp=Math.max(1,g.hp-15);return '✓ Vile — but invigorating. Max HP +20. Lost 15 HP to the ritual.'}},
     {text:'Splash it on your weapon (+5 ATK for this zone)',outcome:(g)=>{addOffensiveStat(g,5);return '✓ The necrotic fluid clings to the blade. +5 '+getOffensiveStatLabel(g)+' until next zone.'}},
     {text:'Collapse the basin — deny the cultists',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.1);return '✓ You shatter the basin. Power wasted — but it\'s the right call. Small XP bonus.'}},
   ]},

  // ── ABYSS / HIGH ZONE EVENTS ──────────────────────────────
  {title:'THE DEMON\'S BARGAIN',
   zones:['abyss','shadowrealm','celestial'],
   text:'"A lesser demon kneels before you — unusual enough to stop you cold. It speaks: "I can make you stronger, mortal. All it costs is something small... your future pain.""',
   choices:[
     {text:'Accept the bargain (+40 max HP, -10 DEF)',outcome:(g)=>{g.maxHp+=40;g.hp+=40;g.def=Math.max(0,g.def-10);return '✓ Power floods in — then a cold numbness. Max HP +40, DEF -10.'}},
     {text:'Accept the bargain (+15 ATK, lose 25% current HP)',outcome:(g)=>{addOffensiveStat(g,15);g.hp=Math.max(1,Math.floor(g.hp*.75));return '✓ Your strikes become devastating. '+getOffensiveStatLabel(g)+' +15. Lost 25% HP as the price.'}},
     {text:'Destroy the demon (gain 80 XP)',outcome:(g)=>{g.xp+=80;return '✓ You drive your weapon through it. Some bargains should never be made. +80 XP.'}},
   ]},
  {title:'THE CELESTIAL FRAGMENT',
   zones:['celestial','frostpeak','shadowrealm'],
   text:'"A shard of divine light hovers in the air before you, pulsing with raw celestial energy. It burns to look at. Touching it could do anything."',
   choices:[
     {text:'Absorb the fragment (50/50 boon or backlash)',outcome:(g)=>{if(Math.random()<.5){g.maxHp+=30;g.hp=g.maxHp;return '✓ Divine fire remakes you. Max HP +30, fully healed!'}g.hp=Math.max(1,g.hp-Math.floor(g.maxHp*.4));return '✗ The energy is too raw. It tears through you — 40% HP lost.'}},
     {text:'Contain it in a vial (gain strong potion)',outcome:(g)=>{addItem({...ITEMS.find(i=>i.id==='strongPotion'),qty:1});return '✓ The fragment condenses into a glowing draught. Gain Strong Potion.'}},
     {text:'Shatter it — deny its power to enemies',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.15);g.gold+=40;return '✓ The shard explodes in a shower of motes. XP bonus + 40g of residue.'}},
   ]},
  {title:'THE MIRROR OF REGRET',
   zones:['shadowrealm','underdark'],
   text:'"A perfect mirror stands alone in the dark, showing a reflection that is not yours. It shows you as you could have been — stronger, rested, whole."',
   choices:[
     {text:'Reach into the mirror (trade HP for power)',outcome:(g)=>{const cost=Math.floor(g.maxHp*.15);g.maxHp-=cost;g.hp=Math.min(g.hp,g.maxHp);addOffensiveStat(g,12);g.critBonus=(g.critBonus||0)+5;return '✓ Your reflection steps out and merges with you. Max HP -'+cost+', but '+getOffensiveStatLabel(g)+' +12, Crit +5.'}},
     {text:'Smash the mirror (gain 60g from the shards)',outcome:(g)=>{g.gold+=60;if(Math.random()<.3){g.hp=Math.max(1,g.hp-8);return '✓ The shards shimmer gold. 60g — and a small cut. Lost 8 HP.'}return '✓ The shards rain down as coins. 60g.'}},
     {text:'Walk away — some reflections are traps',outcome:(g)=>{if(Math.random()<.4){g.xp+=Math.floor(g.xpNeeded*.1);return '✓ Wise. The mirror cracks on its own. Small XP bonus for resisting temptation.'}return 'You walk away. The mirror watches you go.'}},
   ]},
  {title:'THE FROST GIANT\'S CHALLENGE',
   zones:['frostpeak'],
   text:'"A frost giant blocks the pass, grinning. "I will not let a small thing pass without sport. Fight me, pay me, or amuse me.""',
   choices:[
     {text:'Duel it — arm wrestle (CON check, 65% win)',outcome:(g)=>{if(Math.random()<.65){g.xp+=Math.floor(g.xpNeeded*.2);g.gold+=80;return '✓ You slam its arm down. It roars with laughter and tosses you 80g. +XP.'}g.hp=Math.max(1,g.hp-30);return '✗ Its strength is immense. You walk away with 30 HP less and your dignity in tatters.'}},
     {text:'Pay the toll (50g)',outcome:(g)=>{if(g.gold>=50){g.gold-=50;return '✓ You pay. It steps aside with a grunt.'}return '✗ You don\'t have enough gold.'}},
     {text:'Tell it a joke (random outcome)',outcome:(g)=>{const r=Math.random();if(r<.33){addOffensiveStat(g,8);g.def+=5;return '✓ The giant howls with laughter. "Go, little funny-thing!" It tosses you a charm. '+getOffensiveStatLabel(g)+' +8, DEF +5.'}if(r<.66)return '... it stares at you blankly, then steps aside without a word.';g.hp=Math.max(1,g.hp-20);return '✗ It doesn\'t get it. You get a flick to the chest for 20 HP.'}},
   ]},
  // ── MORE UNIVERSAL EVENTS ──────────────────────────────────
  {title:'THE CURSED COIN',
   zones:null,
   text:'"A golden coin rests alone on a flat stone, heads-up. No footprints. A small etching reads: ONE WISH."',
   choices:[
     {text:'Pocket it — gain 30g (might be cursed)',outcome:(g)=>{if(Math.random()<.35){g.hp=Math.max(1,g.hp-Math.floor(g.maxHp*.2));return '✗ A chill runs through you as you take it. Cursed. Lost 20% HP.'}g.gold+=30;return '✓ Just a coin after all. 30g richer.'}},
     {text:'Make a wish: more strength (+8 ATK)',outcome:(g)=>{addOffensiveStat(g,8);return '✓ You whisper your wish. The coin dissolves into light. '+getOffensiveStatLabel(g)+' +8.'}},
     {text:'Toss it back — leave it for another',outcome:(g)=>{if(Math.random()<.3){g.xp+=Math.floor(g.xpNeeded*.1);return '✓ A quiet voice: "Wise." Small XP bonus.'}return 'The coin hits the stone. Heads again. You walk on.'}},
   ]},
  {title:'THE STARVING CHILD',
   zones:null,
   text:'"A small figure in the shadows — hollow eyes, trembling hands. They ask for nothing, which makes it worse."',
   choices:[
     {text:'Give your rations — spend 15g',outcome:(g)=>{if(g.gold<15)return '✗ You have nothing to give.';g.gold-=15;g.maxHp+=10;g.hp+=10;return '✓ A warmth settles in your chest. Max HP +10.'}},
     {text:'Give a healing potion',outcome:(g)=>{const idx=g.inventory.findIndex(i=>i&&i.id==='hpPotion');if(idx===-1)return '✗ You have no potions to spare.';g.inventory[idx].qty--;if(g.inventory[idx].qty<=0)g.inventory[idx]=null;g.xp+=Math.floor(g.xpNeeded*.15);return '✓ The color returns to their cheeks. +XP.'}},
     {text:'Pass by — you cannot save everyone',outcome:(g)=>{if(Math.random()<.4)return 'You keep walking. The guilt is its own weight.';g.hp=Math.max(1,g.hp-5);return 'The guilt manifests physically. Lost 5 HP.'}},
   ]},
  {title:'THE CARTOGRAPHER MAP',
   zones:null,
   text:'"A sealed map shows this very area. It marks danger, treasure — and a red X. You are standing on it."',
   choices:[
     {text:'Dig beneath your feet',outcome:(g)=>{const r=Math.random();if(r<.4){const pool=ITEMS.filter(i=>i.rarity==="rare"&&i.slot);const item={...pool[Math.floor(Math.random()*pool.length)],qty:1};addItem(item);return "✓ You find "+item.icon+" "+item.name+" in a buried satchel."}if(r<.7){g.gold+=90;return "✓ A small lockbox. 90g inside."}g.hp=Math.max(1,g.hp-20);return "✗ A pressure plate. Lost 20 HP."}},
     {text:'Follow the danger markings carefully',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.12);return '✓ You navigate perfectly. +XP for safe passage.'}},
     {text:'Sell the map at the shop (+40g)',outcome:(g)=>{g.gold+=40;return '✓ Maps are worth more to merchants. 40g.'}},
   ]},
  {title:'THE FRIENDLY GHOST',
   zones:null,
   text:'"A translucent figure floats before you — smiling. "I died here three centuries ago," it says cheerfully. "Want some advice?""',
   choices:[
     {text:'Listen to their advice',outcome:(g)=>{const r=Math.random();if(r<.33){g.critBonus=(g.critBonus||0)+4;return '✓ "Always aim for the eyes." Crit +4.'}if(r<.66){g.def+=4;return '✓ "Keep something between you and death." DEF +4.'}addOffensiveStat(g,4);return '✓ "Strike first. Always." '+getOffensiveStatLabel(g)+' +4.'}},
     {text:'Ask where they hid their treasure',outcome:(g)=>{if(Math.random()<.5){g.gold+=70;return '✓ In a hollow stone. 70g.'}return '✗ "I spent it all before I died." Regrets.'}},
     {text:'Perform a rite — release them',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.18);return '✓ The ghost fades with a sigh of relief. +XP.'}},
   ]},
  {title:'THE CURSED TOME',
   zones:null,
   text:'"A book floats at eye level, pages rewriting themselves. It wants to be opened."',
   choices:[
     {text:'Read it aloud (random effect)',outcome:(g)=>{const r=Math.random();if(r<.25){g.maxHp+=20;g.hp=g.maxHp;return '✓ A healing word. Max HP +20, fully healed.'}if(r<.5){addOffensiveStat(g,6);g.def-=4;return '✓ A war rite. '+getOffensiveStatLabel(g)+' +6, DEF -4.'}if(r<.75){g.hp=Math.max(1,g.hp-Math.floor(g.maxHp*.3));return '✗ A curse. Lost 30% HP.'}g.xp+=Math.floor(g.xpNeeded*.2);return '✓ An ancient teaching. Large XP bonus.'}},
     {text:'Transcribe a passage (sell to Malachar)',outcome:(g)=>{g.gold+=55;return '✓ Malachar will pay for this. 55g.'}},
     {text:'Burn it before it speaks',outcome:(g)=>{if(Math.random()<.4){g.def+=5;return '✓ As it burns, something protective settles over you. DEF +5.'}return 'It burns cleanly. Some things should stay unread.'}},
   ]},
  {title:'THE BLACKSMITH GHOST',
   zones:null,
   text:'"The clang of hammer on metal rings through an empty forge — tools moving on their own with expert precision."',
   choices:[
     {text:'Offer your weapon for improvement',outcome:(g)=>{
       const bonus=3+Math.floor(Math.random()*5);
       const isCaster=typeof CASTER_CLASSES!=='undefined'&&CASTER_CLASSES.includes(g.classId);
       addOffensiveStat(g,bonus);
       if(g.equipped&&g.equipped.weapon){
         // Clone before modifying to avoid mutating shared ITEMS object
         g.equipped.weapon={...g.equipped.weapon,stats:{...g.equipped.weapon.stats}};
         const statKey=isCaster?'magAtk':'atk';
         g.equipped.weapon.stats[statKey]=(g.equipped.weapon.stats[statKey]||0)+bonus;
         return "✓ Your weapon emerges sharper. "+getOffensiveStatLabel(g)+" +"+bonus+" (weapon upgraded permanently).";
       }
       return "✓ Your strikes feel sharper even without a weapon. "+getOffensiveStatLabel(g)+" +"+bonus+".";
     }},
     {text:'Offer your armor for improvement',outcome:(g)=>{
       const bonus=3+Math.floor(Math.random()*4);
       g.def+=bonus;
       if(g.equipped&&g.equipped.armor){
         // Clone before modifying to avoid mutating shared ITEMS object
         g.equipped.armor={...g.equipped.armor,stats:{...g.equipped.armor.stats}};
         g.equipped.armor.stats.def=(g.equipped.armor.stats.def||0)+bonus;
         return "✓ Every joint reinforced. DEF +"+bonus+" (armor upgraded permanently).";
       }
       return "✓ Your natural toughness improves. DEF +"+bonus+".";
     }},
     {text:'Watch in silence — learn the technique',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.12);g.critBonus=(g.critBonus||0)+2;return '✓ You absorb their craft. +XP, Crit +2.'}},
   ]},

  // ── WOODS / EARLY EVENTS ────────────────────────────────────
  {title:'THE MUSHROOM CIRCLE',
   zones:['woods','outpost'],
   text:'"A perfect ring of luminescent mushrooms pulses with faint light. The center feels warm and dry."',
   choices:[
     {text:'Eat one mushroom (50/50)',outcome:(g)=>{if(Math.random()<.5){addOffensiveStat(g,5);g.maxHp+=10;g.hp+=10;return '✓ Visions of battle sharpen your mind. '+getOffensiveStatLabel(g)+' +5, Max HP +10.'}g.hp=Math.max(1,g.hp-8);return '✗ The world tilts. Lost 8 HP.'}},
     {text:'Harvest them (50g sell value)',outcome:(g)=>{g.gold+=50;return '✓ Malachar will know their worth. 50g.'}},
     {text:'Study the ring (gain XP and insight)',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.15);g.def+=3;return '✓ The patterns reveal something about defense. +XP, DEF +3.'}},
   ]},
  {title:'THE TRAP MAKER',
   zones:['woods','outpost'],
   text:'"A crude pit trap sits in the path ahead. Someone set this recently. You spot it just in time."',
   choices:[
     {text:'Reset it facing the enemy direction',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.08);return '✓ Your next enemy walks right into it. +XP.'}},
     {text:'Disarm it — take the parts (+10g)',outcome:(g)=>{g.gold+=10;g.def+=2;return '✓ Salvaged mechanism. 10g + DEF +2.'}},
     {text:'Spring it yourself — clear the path',outcome:(g)=>{g.hp=Math.max(1,g.hp-10);return '✗ You fall through. Lost 10 HP but the path is clear.'}},
   ]},

  // ── CASTLE / OUTPOST EVENTS ─────────────────────────────────
  {title:'THE THRONE ROOM',
   zones:['castle','outpost'],
   text:'"A throne of blackened iron sits in a ruined hall. The arms glow with faint sigils. It has been waiting."',
   choices:[
     {text:'Sit upon the throne (random boon or curse)',outcome:(g)=>{const r=Math.random();if(r<.33){g.maxHp+=30;g.hp=g.maxHp;return '✓ A king\'s will fills you. Max HP +30, fully healed.'}if(r<.66){addOffensiveStat(g,10);g.def-=6;return "✓ A warlord's strength. "+getOffensiveStatLabel(g)+" +10, DEF -6."}g.hp=Math.max(1,g.hp-Math.floor(g.maxHp*.4));return '✗ It rejects you. 40% HP lost.'}},
     {text:'Pry off the sigil gems (80g)',outcome:(g)=>{g.gold+=80;return '✓ Enchanted stone. 80g.'}},
     {text:'Leave — some power is not yours',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.1);return '✓ Wisdom is its own reward. +XP.'}},
   ]},
  {title:'THE PRISONER',
   zones:['castle','underdark'],
   text:'"A cell door hangs open. Inside: someone in chains, months captive. They say they know a secret worth knowing."',
   choices:[
     {text:'Free them — spend a potion',outcome:(g)=>{const idx=g.inventory.findIndex(i=>i&&i.id==="hpPotion");if(idx===-1)return '✗ No potions to spare.';g.inventory[idx].qty--;if(g.inventory[idx].qty<=0)g.inventory[idx]=null;g.critBonus=(g.critBonus||0)+1;g.xp+=Math.floor(g.xpNeeded*.15);return '✓ They reveal enemy weak points. Crit +1. +XP.'}},
     {text:'Learn their secret first',outcome:(g)=>{g.def+=6;return '✓ They describe the enemies in detail. DEF +6.'}},
     {text:'Leave — you cannot take on more burden',outcome:(g)=>'You walk away. Their eyes follow you.'},
   ]},

  // ── UNDERDARK / ABYSS EVENTS ────────────────────────────────
  {title:'THE ANCIENT GOLEM',
   zones:['underdark','abyss'],
   text:'"A stone golem sits motionless, arms on its knees. Enormous. Very old. Its sapphire eyes track you."',
   choices:[
     {text:'Speak the command word (50/50)',outcome:(g)=>{if(Math.random()<.5){addOffensiveStat(g,12);g.def+=8;return '✓ It stands. It bows. '+getOffensiveStatLabel(g)+' +12, DEF +8.'}g.hp=Math.max(1,g.hp-35);return '✗ Wrong word. One strike. Lost 35 HP.'}},
     {text:'Harvest its sapphire eyes (100g)',outcome:(g)=>{g.gold+=100;return '✓ Flawless gems. 100g.'}},
     {text:'Leave it in peace',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.15);return '✓ As you pass, it raises one slow hand. +XP.'}},
   ]},
  {title:'THE VOID CRACK',
   zones:['abyss','shadowrealm'],
   text:'"A crack in reality hovers at head height — a line of absolute black, humming. You can hear something breathing inside."',
   choices:[
     {text:'Reach inside (random — reward or catastrophe)',outcome:(g)=>{const r=Math.random();if(r<.2){g.maxHp+=40;g.hp=g.maxHp;addOffensiveStat(g,8);return '✓ A voidstone. Max HP +40, '+getOffensiveStatLabel(g)+' +8, fully healed.'}if(r<.5){const pool=ITEMS.filter(i=>i.rarity==="rare"&&i.slot);const item={...pool[Math.floor(Math.random()*pool.length)],qty:1};addItem(item);return "✓ You pull out "+item.icon+" "+item.name+". From nothing."}g.hp=Math.max(1,g.hp-Math.floor(g.maxHp*.5));return '✗ Something grabs back. Lost 50% HP.'}},
     {text:'Seal it with a prayer',outcome:(g)=>{g.def+=8;return '✓ The crack seals. DEF +8.'}},
     {text:'Walk away — you know better',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.12);return '✓ Survival instinct has value. +XP.'}},
   ]},
  {title:'THE DYING DEMON',
   zones:['abyss','shadowrealm','underdark'],
   text:'"A lesser demon lies impaled on its own spear. "I have an offer," it rasps. "Better than the alternative.""',
   choices:[
     {text:'Hear its offer',outcome:(g)=>{g.gold+=60;g.critBonus=(g.critBonus||0)+3;return '✓ Gold and a whispered name. 60g, Crit +3.'}},
     {text:'End its suffering cleanly',outcome:(g)=>{g.xp+=Math.floor(g.xpNeeded*.12);return '✓ One clean blow. No deals. +XP.'}},
     {text:'Leave it to die alone',outcome:(g)=>{if(Math.random()<.5){g.def+=5;return '✓ As you walk away, it whispers something useful. DEF +5.'}return 'You leave it to its end.'}},
   ]},

];


// ══════════════════════════════════════════════════════════
//  ZONE MODIFIERS (B1) — Random mutators applied per zone
// ══════════════════════════════════════════════════════════


const RARE_EVENTS = [

  // ── UNIVERSAL (any zone) ────────────────────────────────────

  {title:'THE CURSED FORGE',
   zones:null,
   text:'"A forge burns without fuel in a chamber that shouldn\'t exist. Tools hover at the ready. A voice like grinding metal: \'Place your weapon. I will make it more. But more always costs.\'"',
   choices:[
     {text:'⚔ Upgrade weapon (+8 ATK, enemies deal +10% damage permanently)',outcome:(g)=>{
       if(!g.equipped||!g.equipped.weapon) return '✗ You have no weapon equipped.';
       const isCaster=typeof CASTER_CLASSES!=='undefined'&&CASTER_CLASSES.includes(g.classId);
       g.equipped.weapon={...g.equipped.weapon,stats:{...g.equipped.weapon.stats}};
       const statKey=isCaster?'magAtk':'atk';
       g.equipped.weapon.stats[statKey]=(g.equipped.weapon.stats[statKey]||0)+8;
       addOffensiveStat(g,8);
       g._rareEventFlags.cursedForge=true;
       return '✓ The blade hums with new power. '+getOffensiveStatLabel(g)+' +8. A cold whisper: "They will hit harder now." Enemies deal +10% damage for the rest of your descent.';
     }},
     {text:'🛡 Upgrade armor (+6 DEF, lose 15% max HP permanently)',outcome:(g)=>{
       if(!g.equipped||!g.equipped.armor) return '✗ You have no armor equipped.';
       g.equipped.armor={...g.equipped.armor,stats:{...g.equipped.armor.stats}};
       g.equipped.armor.stats.def=(g.equipped.armor.stats.def||0)+6;
       g.def+=6;
       const hpLoss=Math.floor(g.maxHp*0.15);
       g.maxHp-=hpLoss; g.hp=Math.min(g.hp,g.maxHp);
       return '✓ The armor thickens, hardens. DEF +6. But your body feels lighter — Max HP reduced by '+hpLoss+'.';
     }},
     {text:'Destroy the forge (gain 60g)',outcome:(g)=>{g.gold+=60;g.totalGold+=60;return '✓ You shatter the anvil. 60g of enchanted metal. The safe choice.'}},
   ]},

  {title:'THE BLOOD PACT',
   zones:null,
   text:'"A circle of runes pulses on the ground. You recognise it — a blood contract. The terms are carved into the stone: \'Give of yourself. Receive in kind.\'"',
   choices:[
     {text:'💉 Sign in blood (lose 20% max HP → next boss drops double loot)',outcome:(g)=>{
       const hpLoss=Math.floor(g.maxHp*0.20);
       g.maxHp-=hpLoss; g.hp=Math.min(g.hp,g.maxHp);
       g._rareEventFlags.bloodPact=true;
       return '✓ Pain. Real pain. Max HP reduced by '+hpLoss+'. But the runes glow with promise — next boss drops double gold and a guaranteed rare+ item.';
     }},
     {text:'🪙 Offer gold instead (40% gold → next boss drops extra item)',outcome:(g)=>{
       const goldCost=Math.floor(g.gold*0.40);
       if(goldCost<1) return '✗ You have nothing to offer.';
       g.gold-=goldCost;
       g._rareEventFlags.bloodPactGold=true;
       return '✓ The runes drink '+goldCost+'g. Next boss drops 1 extra item.';
     }},
     {text:'Walk over the runes',outcome:(g)=>{return 'Nothing happens. The runes dim. Probably for the best.'}},
   ]},

  {title:'THE GAMBLER\'S GAUNTLET',
   zones:null,
   text:'"A skeletal figure sits at a table with three cups. \'I have something you want beneath one of these. Your wager: something you\'re carrying. Win, and I double it. Lose, and it\'s mine forever.\'"',
   choices:[
     {text:'🎲 Bet your best item (50/50: upgrade one tier or lose it)',outcome:(g)=>{
       // Find highest rarity equipped item
       const rarOrder=['legendary','epic','rare','uncommon','common'];
       let bestSlot=null,bestRar=99;
       for(const [slot,item] of Object.entries(g.equipped||{})){
         if(!item)continue;
         const ri=rarOrder.indexOf(item.rarity);
         if(ri<bestRar){bestRar=ri;bestSlot=slot;}
       }
       if(!bestSlot) return '✗ You have nothing equipped worth wagering.';
       const item=g.equipped[bestSlot];
       if(Math.random()<0.5){
         // Win — boost the item's stats by 50%
         g.equipped[bestSlot]={...item,stats:{...item.stats}};
         for(const k of Object.keys(g.equipped[bestSlot].stats)){
           const v=g.equipped[bestSlot].stats[k];
           if(v>0){const bonus=Math.ceil(v*0.5);g.equipped[bestSlot].stats[k]+=bonus;if(k==='atk')g.atk+=bonus;if(k==='magAtk')g.magBonus=(g.magBonus||0)+bonus;if(k==='def')g.def+=bonus;if(k==='hp'){g.maxHp+=bonus;g.hp+=bonus;}}
         }
         return '✓ The cup lifts — light pours out. Your '+item.name+' surges with power! All stats boosted by 50%.';
       } else {
         // Lose — destroy the item
         if(typeof removeItemStats==='function') removeItemStats(item);
         g.equipped[bestSlot]=null;
         return '✗ Empty. The skeletal hand snatches your '+item.name+'. Gone forever. "Better luck next time."';
       }
     }},
     {text:'🪙 Bet 50% of your gold (50/50: double or nothing)',outcome:(g)=>{
       const bet=Math.floor(g.gold*0.5);
       if(bet<5) return '✗ Not enough gold to interest the gambler.';
       if(Math.random()<0.5){g.gold+=bet;g.totalGold+=bet;return '✓ You doubled it! +'+bet+'g. The skeleton applauds.';}
       g.gold-=bet;return '✗ Gone. '+bet+'g vanishes under the cup. "The house always wins. Eventually."';
     }},
     {text:'Refuse',outcome:(g)=>{return '"Wise. Or cowardly. I can never tell the difference." The figure dissolves.'}},
   ]},

  {title:'THE DOPPELGANGER',
   locked:true,
   zones:null,
   text:'"Something steps out of the shadows wearing your face. Same armour, same stance, same eyes. It speaks with your voice: \'One of us walks out. Choose how.\'"',
   choices:[
     {text:'⚔ Fight it (take 30% HP damage → gain +6 ATK, +4 DEF)',outcome:(g)=>{
       const cost=Math.floor(g.maxHp*0.30);
       g.hp=Math.max(1,g.hp-cost);
       addOffensiveStat(g,6); g.def+=4;
       return '✓ It fights like you — because it IS you. '+cost+' damage taken. But you absorb what made it strong. '+getOffensiveStatLabel(g)+' +6, DEF +4 permanently.';
     }},
     {text:'🔄 Merge with it (full heal, but skip next talent pick)',outcome:(g)=>{
       g.hp=g.maxHp;
       // Reset all cooldowns
       for(const k of Object.keys(g.skillCooldowns)) delete g.skillCooldowns[k];
       g._rareEventFlags.skipNextTalent=(g._rareEventFlags.skipNextTalent||0)+1;
       return '✓ Two become one. Fully healed, all cooldowns reset. But the merge is imperfect — your next talent pick is skipped.';
     }},
     {text:'Let it leave',outcome:(g)=>{
       g._rareEventFlags.doppelgangerBoss=true;
       return '⚠ It walks past you into the dark. Nothing happens... now. But something tells you it will be waiting at the boss.';
     }},
   ]},

  {title:'THE STRANGER\'S SATCHEL',
   zones:null,
   text:'"A leather satchel hangs from a spike in the wall. A note pinned to it reads: \'For the one who descends. Do not open until you are desperate. — E.\' The seal is old. Very old."',
   choices:[
     {text:'📦 Open it now (powerful temp buff, fades after boss)',outcome:(g)=>{
       addOffensiveStat(g,10); g.def+=8; g.maxHp+=25; g.hp+=25;
       g._rareEventFlags.unstableBuff={atk:10,def:8,hp:25};
       return '✓ Inside: a vial of liquid starlight. '+getOffensiveStatLabel(g)+' +10, DEF +8, Max HP +25. But the vial was enchanted to open at the right moment — these effects will fade after the next boss.';
     }},
     {text:'💾 Save it for later (auto-triggers at <25% HP: full heal + stat boost)',outcome:(g)=>{
       g._rareEventFlags.satchelSaved=true;
       return '✓ You clip the satchel to your belt. It pulses gently. When you are truly desperate, it will open on its own.';
     }},
     {text:'Sell it unopened (120g)',outcome:(g)=>{g.gold+=120;g.totalGold+=120;return '✓ Whatever was inside is someone else\'s mystery now. 120g.'}},
   ]},

  {title:'THE SOUL MERCHANT',
   locked:true,
   zones:null,
   text:'"A figure with too many eyes sits crosslegged on the ceiling. \'I trade in potential,\' it says. \'You have so much of it. Wasteful, really.\'"',
   choices:[
     {text:'🔮 Trade your next talent (+12 ATK, +8 DEF, +30 max HP)',outcome:(g)=>{
       g._rareEventFlags.skipNextTalent=(g._rareEventFlags.skipNextTalent||0)+1;
       addOffensiveStat(g,12); g.def+=8; g.maxHp+=30; g.hp+=30;
       return '✓ Power floods in — raw, unrefined, overwhelming. '+getOffensiveStatLabel(g)+' +12, DEF +8, Max HP +30. But your next talent pick is forfeit.';
     }},
     {text:'🪙 Trade gold income (-25% gold permanently → Crit +5, Crit Damage +50%)',outcome:(g)=>{
       g.goldMult=Math.max(0.1,(g.goldMult||1)*0.75);
       g.critRange=Math.max(1,(g.critRange||20)-5);
       g.critMult=(g.critMult||2)+0.5;
       return '✓ Your strikes become devastating. Crit range improved by 5, crit damage +50%. But gold feels lighter in your pockets — 25% less gold from all sources.';
     }},
     {text:'Trade nothing',outcome:(g)=>{return '"Disappointing. But I\'ll be here when you\'re desperate." It dissolves through the ceiling.'}},
   ]},

  {title:'THE SHATTERED WAYSTONE',
   zones:null,
   text:'"A fractured waystone hums with residual teleportation magic. You could redirect it — but the destination is uncertain."',
   choices:[
     {text:'⏩ Skip ahead (advance 2 fights toward campfire)',outcome:(g)=>{
       g.dungeonFights=(g.dungeonFights||0)+2;
       if(!g.campUnlocked&&g.dungeonFights>=g.dungeonGoal){
         g.campUnlocked=true; g._campReached=true;
         return '✓ The world blurs. You skip ahead — campfire is now unlocked! (Lost the gold and XP from those fights.)';
       }
       return '✓ Reality folds. You skip 2 fights ahead. ('+(g.dungeonGoal-g.dungeonFights)+' fights to campfire.)';
     }},
     {text:'📦 Pull treasure through (gain 2 random items)',outcome:(g)=>{
       let result='✓ The waystone tears something from another place: ';
       for(let i=0;i<2;i++){
         const pool=ITEMS.filter(it=>it.slot&&(it.rarity==='uncommon'||it.rarity==='rare'));
         const item={...pool[Math.floor(Math.random()*pool.length)],qty:1};
         addItem(item);
         result+=(i>0?' and ':'')+item.icon+' '+item.name;
       }
       return result+'.';
     }},
     {text:'Harvest the crystal (Void Shard + material)',outcome:(g)=>{
       addItem({...ITEMS.find(i=>i.id==='voidShard'),qty:1});
       const mats=ITEMS.filter(i=>i.type==='material'&&i.id!=='voidShard');
       addItem({...mats[Math.floor(Math.random()*mats.length)],qty:1});
       return '✓ The crystal shatters into useful parts. Gained Void Shard + bonus material.';
     }},
   ]},

  {title:'THE PRICE OF MEMORY',
   zones:null,
   text:'"A pool of black water shows your reflection — but younger. Stronger. It whispers a name you\'ve forgotten. Reaching in might bring it back."',
   choices:[
     {text:'🖐 Reach in (+3 all stats, +15 HP, Crit +1 — but lose ALL gold and consumables)',outcome:(g)=>{
       addOffensiveStat(g,3); g.def+=3; g.maxHp+=15; g.hp+=15; g.critRange=Math.max(1,g.critRange-1);
       const lostGold=g.gold; g.gold=0;
       // Remove all consumables
       for(let i=0;i<g.inventory.length;i++){
         if(g.inventory[i]&&(g.inventory[i].type==='consumable'))g.inventory[i]=null;
       }
       return '✓ Memory floods back — fragmented, blinding. ATK +3, DEF +3, Max HP +15, Crit +1. But you lost '+lostGold+'g and all potions. Memory costs everything you\'re carrying.';
     }},
     {text:'💧 Drink from it (full heal + 50 XP)',outcome:(g)=>{
       g.hp=g.maxHp; g.xp+=50;
       return '✓ A sip of who you were. Fully healed. +50 XP.';
     }},
     {text:'Pour it out (80g)',outcome:(g)=>{g.gold+=80;g.totalGold+=80;return '✓ The water turns to coins as it falls. 80g. Some memories are worth more forgotten.'}},
   ]},

  {title:'THE REFORGER',
   zones:null,
   text:'"An ancient anvil stands in a circle of runes. You feel it pulling at your equipped items. It wants to remake something."',
   choices:[
     {text:'⚔ Reforge weapon (stats rerolled ±30%)',outcome:(g)=>{
       if(!g.equipped||!g.equipped.weapon) return '✗ You have no weapon equipped.';
       g.equipped.weapon={...g.equipped.weapon,stats:{...g.equipped.weapon.stats}};
       let result='Reforged '+g.equipped.weapon.name+': ';
       for(const k of Object.keys(g.equipped.weapon.stats)){
         const v=g.equipped.weapon.stats[k];
         if(!v)continue;
         const mult=0.7+Math.random()*0.6; // 70%-130%
         const newVal=Math.max(1,Math.round(v*mult));
         const diff=newVal-v;
         if(k==='atk')g.atk+=diff;
         if(k==='magAtk')g.magBonus=(g.magBonus||0)+diff;
         if(k==='def')g.def+=diff;
         if(k==='hp'){g.maxHp+=diff;g.hp=Math.min(g.hp+Math.max(0,diff),g.maxHp);}
         g.equipped.weapon.stats[k]=newVal;
         result+=(diff>=0?'+':'')+diff+' '+k+' ';
       }
       return '✓ '+result.trim()+'. The runes fade.';
     }},
     {text:'🛡 Reforge armor (stats rerolled ±30%)',outcome:(g)=>{
       if(!g.equipped||!g.equipped.armor) return '✗ You have no armor equipped.';
       g.equipped.armor={...g.equipped.armor,stats:{...g.equipped.armor.stats}};
       let result='Reforged '+g.equipped.armor.name+': ';
       for(const k of Object.keys(g.equipped.armor.stats)){
         const v=g.equipped.armor.stats[k];
         if(!v)continue;
         const mult=0.7+Math.random()*0.6;
         const newVal=Math.max(1,Math.round(v*mult));
         const diff=newVal-v;
         if(k==='atk')g.atk+=diff;
         if(k==='magAtk')g.magBonus=(g.magBonus||0)+diff;
         if(k==='def')g.def+=diff;
         if(k==='hp'){g.maxHp+=diff;g.hp=Math.min(g.hp+Math.max(0,diff),g.maxHp);}
         g.equipped.armor.stats[k]=newVal;
         result+=(diff>=0?'+':'')+diff+' '+k+' ';
       }
       return '✓ '+result.trim()+'. The anvil goes silent.';
     }},
     {text:'Salvage the runes (2 crafting materials)',outcome:(g)=>{
       const mats=ITEMS.filter(i=>i.type==='material');
       for(let i=0;i<2;i++){addItem({...mats[Math.floor(Math.random()*mats.length)],qty:1});}
       return '✓ The runes dissolve into useful reagents. Gained 2 crafting materials.';
     }},
   ]},

  {title:'THE DESERTER\'S CACHE',
   zones:null,
   text:'"A hollow in the wall holds a dead adventurer\'s gear — everything they carried when they gave up and tried to leave. They didn\'t make it. You might."',
   choices:[
     {text:'💰 Take everything (3 items + 40g, but trapped: 15% HP + Cursed debuff)',outcome:(g)=>{
       for(let i=0;i<3;i++){
         const pool=ITEMS.filter(it=>it.slot&&(it.rarity==='common'||it.rarity==='uncommon'));
         addItem({...pool[Math.floor(Math.random()*pool.length)],qty:1});
       }
       g.gold+=40; g.totalGold+=40;
       const dmg=Math.floor(g.maxHp*0.15); g.hp=Math.max(1,g.hp-dmg);
       g._rareEventFlags._cursedDebuff=3; // -3 ATK/SPL, -3 DEF for 3 fights
       removeOffensiveStat(g,3); g.def-=3;
       return '✓ 3 items and 40g. But the cache was trapped — '+dmg+' damage and cursed for 3 fights (−3 '+getOffensiveStatLabel(g)+', −3 DEF).';
     }},
     {text:'Take only what you need (1 uncommon item, safe)',outcome:(g)=>{
       const pool=ITEMS.filter(i=>i.slot&&i.rarity==='uncommon');
       const item={...pool[Math.floor(Math.random()*pool.length)],qty:1};
       addItem(item);
       return '✓ '+item.icon+' '+item.name+'. Careful and clean.';
     }},
     {text:'🪦 Bury them properly (hidden: permanent +2 DEF)',outcome:(g)=>{
       g.xp+=Math.floor(g.xpNeeded*0.15);
       g.def+=2;
       return '✓ You lay them to rest. A warmth settles over you — the dead man\'s blessing. +XP. (+2 DEF)';
     }},
   ]},

  // ── ZONE-GATED EVENTS ────────────────────────────────────────

  {title:'THE WHISPERING ROOT',
   zones:['woods'],
   text:'"A tree root the size of a man\'s arm reaches from the earth and curls around your ankle — not hostile. Pleading. Something underground wants to show you something."',
   choices:[
     {text:'🌳 Follow the root (gain a random rare accessory)',outcome:(g)=>{
       const pool=ITEMS.filter(i=>i.rarity==='rare'&&(i.slot==='ring'||i.slot==='amulet'||i.slot==='boots'));
       if(!pool.length) return '✗ The root leads nowhere.';
       const item={...pool[Math.floor(Math.random()*pool.length)],qty:1};
       addItem(item);
       return '✓ A hidden grove. Resting in the roots: '+item.icon+' '+item.name+'. The root releases you gently.';
     }},
     {text:'🌿 Let it pull you under (full heal, but enemy gets first strike next fight)',outcome:(g)=>{
       g.hp=g.maxHp;
       g._rareEventFlags.enemyFirstStrike=true;
       return '✓ You sink into the earth. Warmth, darkness, healing. You surface fully restored — but disoriented. The next enemy will attack first.';
     }},
     {text:'Cut the root (50g of rare wood)',outcome:(g)=>{g.gold+=50;g.totalGold+=50;return '✓ 50g worth of rare wood. The ground trembles with something like grief.'}},
   ]},

  {title:'GRAKTHAR\'S LIEUTENANTS',
   zones:['outpost'],
   text:'"Three skeletal officers stand at attention in a sealed chamber. They are not hostile — they are waiting for orders. YOUR orders. They recognise you."',
   choices:[
     {text:'💀 Order them to fight (3 allied skeletons — each absorbs one enemy attack)',outcome:(g)=>{
       g._rareEventFlags.alliedSkeletons=3;
       return '✓ They salute with rusted fists. Three skeletal soldiers march behind you. Each will absorb one enemy attack before falling.';
     }},
     {text:'⚔ Order them to surrender arms (gain random rare weapon)',outcome:(g)=>{
       const pool=ITEMS.filter(i=>i.rarity==='rare'&&i.type==='weapon');
       if(!pool.length) return '✗ Their arms have rusted to nothing.';
       const item={...pool[Math.floor(Math.random()*pool.length)],qty:1};
       addItem(item);
       return '✓ They lay down their weapons. '+item.icon+' '+item.name+'. Duty complete. Their bones finally rest.';
     }},
     {text:'Dismiss them (+30 XP)',outcome:(g)=>{g.xp+=30;return '✓ "At ease, soldiers. You\'re done." Their bones finally rest. +30 XP.'}},
   ]},

  {title:'VEXARA\'S MIRROR',
   zones:['castle'],
   text:'"In a sealed chamber, a mirror reflects a room that doesn\'t match this one. You see yourself — crowned, seated on the crimson throne. The Crimson Cult was waiting for you."',
   choices:[
     {text:'👑 Sit on the throne (+10 ATK, enemies −10% HP this zone, but 5 dmg/fight)',outcome:(g)=>{
       addOffensiveStat(g,10);
       g._rareEventFlags.vexaraCrown={zoneIdx:g.zoneIdx};
       return '✓ Crimson Authority claimed. '+getOffensiveStatLabel(g)+' +10, enemies weakened this zone. But the crown burns — you take 5 damage at the start of each fight.';
     }},
     {text:'🗡 Shatter the mirror (+15 ATK temp weapon, fades after boss)',outcome:(g)=>{
       addOffensiveStat(g,15);
       g._rareEventFlags.tempAtkBonus={value:15,zoneIdx:g.zoneIdx};
       return '✓ The glass reforms into a crimson dagger. '+getOffensiveStatLabel(g)+' +15. It hums with borrowed power — but it will shatter after the boss.';
     }},
     {text:'Bow to the reflection (heal 30% HP)',outcome:(g)=>{
       const heal=Math.floor(g.maxHp*0.30);
       g.hp=Math.min(g.maxHp,g.hp+heal);
       return '✓ Your reflection bows back. Something old recognises something older. Healed '+heal+' HP.';
     }},
   ]},

  {title:'THE DROWNED VAULT',
   zones:['underdark'],
   text:'"Water floods through a crack, revealing a submerged chamber. Gold glints below the surface. The water is black and freezing."',
   choices:[
     {text:'🏊 Dive in (100g + rare item, but 20% HP damage + Chilled 3 fights)',outcome:(g)=>{
       g.gold+=100; g.totalGold+=100;
       const pool=ITEMS.filter(i=>i.slot&&i.rarity==='rare');
       const item={...pool[Math.floor(Math.random()*pool.length)],qty:1};
       addItem(item);
       const dmg=Math.floor(g.maxHp*0.20); g.hp=Math.max(1,g.hp-dmg);
       g._rareEventFlags._chilledDebuff=3; g.def-=3;
       return '✓ The cold bites deep. '+item.icon+' '+item.name+' + 100g. But '+dmg+' damage and Chilled for 3 fights (−3 DEF).';
     }},
     {text:'🎣 Fish with your weapon (50g, 10% chance weapon loses 2 ATK)',outcome:(g)=>{
       g.gold+=50; g.totalGold+=50;
       if(Math.random()<0.10&&g.equipped&&g.equipped.weapon){
         removeOffensiveStat(g,2);
         return '✓ 50g fished out. But your blade scraped stone — weapon lost 2 '+getOffensiveStatLabel(g)+'.';
       }
       return '✓ 50g fished out cleanly. No damage to your weapon.';
     }},
     {text:'Seal the crack (skip next fight)',outcome:(g)=>{
       g.dungeonFights=(g.dungeonFights||0)+1;
       if(!g.campUnlocked&&g.dungeonFights>=g.dungeonGoal){g.campUnlocked=true;g._campReached=true;}
       return '✓ The water recedes. A dry passage revealed — you bypass the next encounter. The Underdark rewards caution.';
     }},
   ]},

  {title:'THE FINAL HORN',
   zones:['abyss'],
   text:'"The horn that has been sounding for three days lies here — cracked, still vibrating. YOUR horn. You blew it three hundred years ago. It still has one note left."',
   choices:[
     {text:'📯 Sound the horn (enemies start at −15% HP this zone, but +1 extra enemy/fight)',outcome:(g)=>{
       g._rareEventFlags.finalHorn={zoneIdx:g.zoneIdx};
       return '✓ The sound shakes the very stone. Every creature in this zone is weakened by the blast (−15% HP). But the sound draws attention — expect reinforcements.';
     }},
     {text:'✨ Absorb its resonance (+4 ATK, +20 max HP permanently)',outcome:(g)=>{
       addOffensiveStat(g,4); g.maxHp+=20; g.hp+=20;
       return '✓ The horn crumbles to dust. Its last note lives in your bones. '+getOffensiveStatLabel(g)+' +4, Max HP +20.';
     }},
     {text:'Leave it sounding (full HP restore)',outcome:(g)=>{
       g.hp=g.maxHp;
       return '✓ The vibration washes through you like a wave. Fully healed. Some things should be left to finish on their own.';
     }},
   ]},

  {title:'THE FROZEN ARMY',
   locked:true,
   zones:['frostpeak'],
   text:'"Frozen in the glacier wall: soldiers. Hundreds of them. YOUR soldiers, from the war against the gods. One is still conscious. Ice crystals form words on the glass: \'LET. US. HELP.\'"',
   choices:[
     {text:'💀 Free one soldier (companion for this zone: attacks + absorbs hits)',outcome:(g)=>{
       g._rareEventFlags.frozenSoldier={zoneIdx:g.zoneIdx,hp:30,atk:10};
       return '✓ The ice cracks. A soldier steps free, frost still clinging to ancient armor. They salute with frozen fingers and fall in behind you. They fight at your side until they fall.';
     }},
     {text:'⏩ Free them all (skip straight to boss)',outcome:(g)=>{
       g.dungeonFights=g.dungeonGoal;
       g.campUnlocked=true; g._campReached=true;
       g.bossReady=true;
       return '⚠ The glacier shatters. An army surges forward — YOUR army. They clear the path in a final march. The boss awaits. (All fights skipped — you face the boss with your current HP.)';
     }},
     {text:'Let them rest (+10 DEF permanently)',outcome:(g)=>{
       g.def+=10;
       return '✓ "Rest, soldiers. You\'ve earned it." Their endurance passes to you as the ice seals again. DEF +10.';
     }},
   ]},

  {title:'THE BLIND GOD\'S TEAR',
   locked:true,
   zones:['celestial'],
   text:'"A single tear, crystallized, floats before you. It fell from Auranthos three centuries ago — the moment it blinded itself. The tear contains a fragment of divine sight."',
   choices:[
     {text:'👁 Crush and absorb (Crit +3, see enemy HP%, but lose 15% max HP)',outcome:(g)=>{
       g.critRange=Math.max(1,g.critRange-3);
       const hpLoss=Math.floor(g.maxHp*0.15);
       g.maxHp-=hpLoss; g.hp=Math.min(g.hp,g.maxHp);
       return '✓ Divine sight burns through you. Crit range +3. But the knowledge costs — Max HP reduced by '+hpLoss+'.';
     }},
     {text:'🛡 Hold it to your eye (auto-dodge first attack per fight this zone)',outcome:(g)=>{
       g._rareEventFlags.divineEvasion={zoneIdx:g.zoneIdx};
       return '✓ Through the tear, you see a half-second into the future. You will dodge the first attack in every fight this zone.';
     }},
     {text:'Return it to Auranthos (+100 XP, +5 DEF)',outcome:(g)=>{g.xp+=100;g.def+=5;return '✓ You place it at the foot of an empty throne. Even gods deserve their grief returned. +100 XP, DEF +5.'}},
   ]},

  {title:'THE EMPRESS\'S LULLABY',
   zones:['shadowrealm'],
   text:'"A melody drifts through the darkness — soft, heartbroken, ancient. It\'s the song the Hollow Empress sings to keep the Unnamed calm. Listening does something to you."',
   choices:[
     {text:'🎵 Listen fully (full heal + cooldown reset, but permanent −5 ATK)',outcome:(g)=>{
       g.hp=g.maxHp;
       for(const k of Object.keys(g.skillCooldowns)) delete g.skillCooldowns[k];
       removeOffensiveStat(g,5);
       return '✓ Full heal. All cooldowns reset. All conditions cleared. But you understand the Unnamed\'s loneliness now. Empathy is not free. '+getOffensiveStatLabel(g)+' permanently reduced by 5.';
     }},
     {text:'⚔ Hum along (+25% damage vs the Hollow Empress)',outcome:(g)=>{
       g._rareEventFlags.empressBossBonus=true;
       return '✓ Shadow Resonance acquired. You know her rhythm now. +25% damage against the Hollow Empress.';
     }},
     {text:'Cover your ears (+8 ATK this zone)',outcome:(g)=>{
       addOffensiveStat(g,8);
       g._rareEventFlags.tempAtkBonus={value:8,zoneIdx:g.zoneIdx};
       return '✓ Sentiment is a luxury you can\'t afford this deep. '+getOffensiveStatLabel(g)+' +8 for this zone.';
     }},
   ]},

  {title:'THE GATE FRAGMENT',
   locked:true,
   zones:['abyss','shadowrealm'],
   text:'"A chunk of the Gate itself has broken free — pulsing with the hero\'s name, barely legible. Holding it makes your hands shake. This is a piece of YOUR seal."',
   choices:[
     {text:'🔮 Reattach it (+15 HP, +5 ATK, +5 DEF — but take 25% HP damage now)',outcome:(g)=>{
       g.maxHp+=15; addOffensiveStat(g,5); g.def+=5;
       const cost=Math.floor(g.hp*0.25);
       g.hp=Math.max(1,g.hp-cost);
       return '✓ The fragment burns as it fuses. Max HP +15, '+getOffensiveStatLabel(g)+' +5, DEF +5. But the seal fights you — '+cost+' damage taken.';
     }},
     {text:'📖 Read the inscription (25% XP boost)',outcome:(g)=>{
       const xpGain=Math.floor(g.xpNeeded*0.25);
       g.xp+=xpGain;
       return '✓ A name almost surfaces. Almost. +'+xpGain+' XP. You remember something — not everything, but enough.';
     }},
     {text:'🔑 Carry it to the boss (boss starts at 90% HP)',outcome:(g)=>{
       g._rareEventFlags.gateFragmentBoss=true;
       return '✓ You wrap the fragment carefully. If you reach the boss, they start at 90% HP. You\'re bringing a piece of the key.';
     }},
   ]},

  {title:'THE LAST CAMPFIRE',
   zones:['frostpeak','celestial','shadowrealm'],
   text:'"Someone built a campfire here — recently. The embers are still warm. Carved into the stone beside it: a tally. Forty-seven marks. Someone has been trying to reach the bottom for a very long time."',
   choices:[
     {text:'🔥 Rest here (heal 50% HP, but next campfire rest only heals 50%)',outcome:(g)=>{
       const heal=Math.floor(g.maxHp*0.50);
       g.hp=Math.min(g.maxHp,g.hp+heal);
       // Reset cooldowns
       for(const k of Object.keys(g.skillCooldowns)) delete g.skillCooldowns[k];
       g._rareEventFlags.lastCampfireWeaken=true;
       return '✓ Warmth. Rest. Healed '+heal+' HP, cooldowns reset. But this counts as a rest — your next campfire long rest will only heal 50%.';
     }},
     {text:'✏️ Add your mark (+5 all stats permanently)',outcome:(g)=>{
       addOffensiveStat(g,5); g.def+=5; g.maxHp+=5; g.hp+=5; g.critRange=Math.max(1,g.critRange-1);
       return '✓ Forty-eight. '+getOffensiveStatLabel(g)+' +5, DEF +5, Max HP +5, Crit +1. You are not the first. You might be the last.';
     }},
     {text:'Study the marks (+100 XP)',outcome:(g)=>{
       g.xp+=100;
       return '✓ Forty-seven attempts. Forty-seven failures. You will not be the forty-eighth. +100 XP.';
     }},
   ]},

];

