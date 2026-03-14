// ================================================================
// helpers.js — Combat Helpers
// getSpellPower, addOffensiveStat, CASTER_CLASSES, DEX_CLASSES,
// spell slot restore, proficiency bonus helpers
// Descent into Eternity
// ================================================================

// ══════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════

// Restore one spell slot. If lvl given, restore that level; otherwise restore lowest available.
// Returns the level restored, or null if none available.
function restoreSpellSlot(lvl){
  if(!G.spellSlots||!G.spellSlotsMax) return null;
  if(lvl){
    if((G.spellSlots[lvl]||0)<(G.spellSlotsMax[lvl]||0)){G.spellSlots[lvl]++;return lvl;}
    return null;
  }
  for(const[l]of Object.entries(G.spellSlotsMax)){
    if((G.spellSlots[l]||0)<G.spellSlotsMax[l]){G.spellSlots[l]++;return l;}
  }
  return null;
}

// ══════════════════════════════════════════════════════════
//  SPELL POWER SYSTEM
// ══════════════════════════════════════════════════════════

const CASTER_CLASSES = ['wizard','cleric','druid'];
const DEX_CLASSES = ['rogue','ranger'];

// Central spell power calculation — every spell calls this
function getSpellPower(){
  if(!G) return 0;
  let sp = (G.spellPower||0) + (G.magBonus||0) + (G.profBonus||2);
  // Ancestral Fury stacks apply to spell damage too
  if(G._activeModifier && G._activeModifier.effects && G._activeModifier.effects.killAtkStack && G._ancestralStacks > 0){
    sp += G._ancestralStacks * G._activeModifier.effects.killAtkStack;
  }
  // Relic: Arcane Lens — stacking spell power bonus this fight
  if((G._relicArcaneLensBonus||0)>0) sp += G._relicArcaneLensBonus;
  return sp;
}

// Route offensive stat bonuses by class type
function addOffensiveStat(g, value){
  if(CASTER_CLASSES.includes(g.classId)){
    g.magBonus = (g.magBonus||0) + value;
  } else {
    g.atk += value;
  }
}

function removeOffensiveStat(g, value){
  if(CASTER_CLASSES.includes(g.classId)){
    g.magBonus = Math.max(0, (g.magBonus||0) - value);
  } else {
    g.atk = Math.max(0, g.atk - value);
  }
}

function getOffensiveStatLabel(g){
  return CASTER_CLASSES.includes(g.classId) ? 'SPL' : 'ATK';
}
