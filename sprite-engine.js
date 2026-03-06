// ================================================================
// sprites.js — PNG Image Sprite System
// Self-contained: preloads, renders, and animates image sprites.
// Falls back to pixel-grid renderSprite() for classes without PNGs.
// Descent into Eternity
// ================================================================

(function(){

// ── Frame definitions ────────────────────────────────────────

const IMAGE_SPRITES = {
  fighter: {
    idle:   ['sprites/fighter-idle-1.png','sprites/fighter-idle-2.png','sprites/fighter-idle-3.png','sprites/fighter-idle-4.png'],
    attack: ['sprites/fighter-attack-1.png','sprites/fighter-attack-2.png','sprites/fighter-attack-3.png','sprites/fighter-attack-4.png'],
    defend: ['sprites/fighter-defend-1.png','sprites/fighter-defend-2.png','sprites/fighter-defend-3.png'],
  },
  wizard: {
    idle:   ['sprites/wizard-idle-1.png','sprites/wizard-idle-2.png','sprites/wizard-idle-3.png','sprites/wizard-idle-4.png'],
    attack: ['sprites/wizard-attack-1.png','sprites/wizard-attack-2.png','sprites/wizard-attack-3.png','sprites/wizard-attack-4.png'],
    defend: ['sprites/wizard-defend-1.png','sprites/wizard-defend-2.png','sprites/wizard-defend-3.png'],
  },
  rogue: {
    idle:   ['sprites/rogue-idle-1.png','sprites/rogue-idle-2.png','sprites/rogue-idle-3.png','sprites/rogue-idle-4.png'],
    attack: ['sprites/rogue-attack-1.png','sprites/rogue-attack-2.png','sprites/rogue-attack-3.png','sprites/rogue-attack-4.png'],
    defend: ['sprites/rogue-defend-1.png','sprites/rogue-defend-2.png','sprites/rogue-defend-3.png'],
  },
};

// Idle timing per class (ms per frame)
const IMG_IDLE_TIMING = {
  fighter: [220, 160, 220, 160],
  wizard:  [320, 280, 320, 280],
  rogue:   [200, 180, 200, 180],
};

// ── Chroma definitions — 8 classes × 4 each ─────────────────

const CHROMAS = {
  fighter: [
    { id:'fighter_crimson',  name:'Crimson Knight',    filter:'hue-rotate(340deg) saturate(1.4) brightness(0.95)',
      desc:'Forged in the blood of a hundred battlefields.',  achId:'chr_fighter_crimson' },
    { id:'fighter_frost',    name:'Frost Champion',    filter:'hue-rotate(180deg) saturate(0.8) brightness(1.15)',
      desc:'Steel tempered in the glaciers of Frostveil.',    achId:'chr_fighter_frost' },
    { id:'fighter_gilded',   name:'Gilded Warden',     filter:'sepia(0.6) saturate(1.6) brightness(1.1) hue-rotate(10deg)',
      desc:'Armor blessed by the last light of Elderfen.',    achId:'chr_fighter_gilded' },
    { id:'fighter_shadow',   name:'Blackiron Knight',  filter:'saturate(0.15) brightness(0.7) contrast(1.3)',
      desc:'No banner. No name. Only the sword remains.',     achId:'chr_fighter_shadow' },
  ],
  wizard: [
    { id:'wizard_blood',     name:'Blood Mage',        filter:'hue-rotate(320deg) saturate(1.5) brightness(0.9)',
      desc:'Power drawn from the vein, not the page.',        achId:'chr_wizard_blood' },
    { id:'wizard_frost',     name:'Frost Sage',        filter:'hue-rotate(160deg) saturate(0.7) brightness(1.2)',
      desc:'The cold preserves what fire would destroy.',      achId:'chr_wizard_frost' },
    { id:'wizard_void',      name:'Void Scholar',      filter:'hue-rotate(260deg) saturate(1.3) brightness(0.85)',
      desc:'Some knowledge comes from beyond the stars.',      achId:'chr_wizard_void' },
    { id:'wizard_golden',    name:'Archmage Aurelian', filter:'sepia(0.5) saturate(1.8) brightness(1.15) hue-rotate(15deg)',
      desc:'The oldest spells are written in gold.',           achId:'chr_wizard_golden' },
  ],
  rogue: [
    { id:'rogue_crimson',    name:'Crimson Fang',      filter:'hue-rotate(340deg) saturate(1.6) brightness(0.9)',
      desc:'Every mark bleeds. Every job is personal.',        achId:'chr_rogue_crimson' },
    { id:'rogue_ghost',      name:'The Ghost',         filter:'saturate(0.1) brightness(1.4) contrast(0.85)',
      desc:'They never saw you. You were never there.',        achId:'chr_rogue_ghost' },
    { id:'rogue_royal',      name:'Royal Thief',       filter:'sepia(0.4) hue-rotate(300deg) saturate(1.3) brightness(1.05)',
      desc:'Steal from kings. Dress like one.',                achId:'chr_rogue_royal' },
    { id:'rogue_nightshade', name:'Nightshade',        filter:'hue-rotate(100deg) saturate(0.9) brightness(0.75) contrast(1.2)',
      desc:'The poison is always one step ahead of you.',      achId:'chr_rogue_nightshade' },
  ],
  paladin: [
    { id:'paladin_blood',    name:'Blood Crusader',    filter:'hue-rotate(340deg) saturate(1.4) brightness(0.85)',
      desc:'Judgment requires sacrifice. Always yours first.', achId:'chr_paladin_blood' },
    { id:'paladin_lunar',    name:'Moonlight Sentinel',filter:'hue-rotate(200deg) saturate(0.6) brightness(1.25)',
      desc:'The vigil continues long after the sun sets.',     achId:'chr_paladin_lunar' },
    { id:'paladin_dusk',     name:'Dusk Templar',      filter:'sepia(0.5) saturate(1.2) brightness(1.0) hue-rotate(350deg)',
      desc:'Between the light and dark, the oath holds.',      achId:'chr_paladin_dusk' },
    { id:'paladin_void',     name:'Oathbreaker',       filter:'hue-rotate(260deg) saturate(1.5) brightness(0.75) contrast(1.15)',
      desc:'The oath was broken. The power was not.',          achId:'chr_paladin_void' },
  ],
  ranger: [
    { id:'ranger_ember',     name:'Ember Hunter',      filter:'hue-rotate(350deg) saturate(1.5) brightness(1.0) sepia(0.2)',
      desc:'The forest burned. The hunter remained.',          achId:'chr_ranger_ember' },
    { id:'ranger_arctic',    name:'Arctic Scout',      filter:'hue-rotate(175deg) saturate(0.6) brightness(1.3)',
      desc:'Tracks in snow vanish. The arrows do not.',        achId:'chr_ranger_arctic' },
    { id:'ranger_shadow',    name:'Shadow Stalker',    filter:'saturate(0.2) brightness(0.65) contrast(1.35)',
      desc:'In the dark, the predator becomes invisible.',     achId:'chr_ranger_shadow' },
    { id:'ranger_verdant',   name:'Verdant Warden',    filter:'hue-rotate(75deg) saturate(1.6) brightness(1.1)',
      desc:'Where the warden walks, the forest follows.',      achId:'chr_ranger_verdant' },
  ],
  barbarian: [
    { id:'barb_bloodrage',   name:'Blood Rager',       filter:'hue-rotate(350deg) saturate(2.0) brightness(0.8) contrast(1.1)',
      desc:'The rage is not a choice. It is the blood.',       achId:'chr_barb_bloodrage' },
    { id:'barb_frost',       name:'Frost Berserker',   filter:'hue-rotate(185deg) saturate(0.5) brightness(1.3) contrast(1.1)',
      desc:'Cold as the grave. Twice as angry.',               achId:'chr_barb_frost' },
    { id:'barb_volcanic',    name:'Volcanic Fury',     filter:'sepia(0.4) saturate(2.0) brightness(1.05) hue-rotate(10deg)',
      desc:'Magma runs where blood should be.',                achId:'chr_barb_volcanic' },
    { id:'barb_void',        name:'Void Breaker',      filter:'hue-rotate(270deg) saturate(1.4) brightness(0.7) contrast(1.25)',
      desc:'What the void touched, the void cannot break.',    achId:'chr_barb_void' },
  ],
  cleric: [
    { id:'cleric_shadow',    name:'Shadow Priest',     filter:'hue-rotate(280deg) saturate(1.2) brightness(0.8)',
      desc:'The light casts shadows. Someone must tend them.', achId:'chr_cleric_shadow' },
    { id:'cleric_lunar',     name:'Moonlit Healer',    filter:'hue-rotate(195deg) saturate(0.5) brightness(1.3)',
      desc:'Healing comes softly, like moonlight on water.',   achId:'chr_cleric_lunar' },
    { id:'cleric_solar',     name:'Sun Cleric',        filter:'sepia(0.5) saturate(1.8) brightness(1.2) hue-rotate(15deg)',
      desc:'Dawn is not a time. It is a weapon.',              achId:'chr_cleric_solar' },
    { id:'cleric_ember',     name:'Ember Priest',      filter:'hue-rotate(10deg) saturate(1.4) brightness(0.95) sepia(0.3)',
      desc:'The flame that heals is the same one that burns.', achId:'chr_cleric_ember' },
  ],
  druid: [
    { id:'druid_autumn',     name:'Autumn Druid',      filter:'sepia(0.4) hue-rotate(350deg) saturate(1.5) brightness(1.0)',
      desc:'All things end. The druid tends the ending.',      achId:'chr_druid_autumn' },
    { id:'druid_winter',     name:'Winter Druid',      filter:'hue-rotate(180deg) saturate(0.4) brightness(1.25)',
      desc:'Beneath the frost, the roots still hold.',         achId:'chr_druid_winter' },
    { id:'druid_shadow',     name:'Blight Druid',      filter:'hue-rotate(90deg) saturate(1.8) brightness(0.7) contrast(1.2)',
      desc:'Nature is not kind. Neither is its servant.',      achId:'chr_druid_shadow' },
    { id:'druid_primal',     name:'Primal Avatar',     filter:'hue-rotate(40deg) saturate(2.0) brightness(1.1)',
      desc:'The wild does not answer to names.',               achId:'chr_druid_primal' },
  ],
};

// ── Chroma helper functions ──────────────────────────────────

function getChromaFilter(classId){
  if(typeof G==='undefined' || !G || !G._activeChroma) return 'none';
  const chromas = CHROMAS[classId];
  if(!chromas) return 'none';
  const chroma = chromas.find(c => c.id === G._activeChroma);
  return chroma ? chroma.filter : 'none';
}

function applyChromaFilter(element, classId){
  if(!element) return;
  element.style.filter = getChromaFilter(classId);
}

// ── Image cache & preloader ──────────────────────────────────

const _cache = {};

function _preload(src){
  if(_cache[src]) return _cache[src];
  const img = new Image();
  img.src = src;
  _cache[src] = img;
  return img;
}

// Preload everything on load
Object.values(IMAGE_SPRITES).forEach(cls => {
  Object.values(cls).forEach(frames => {
    frames.forEach(src => _preload(src));
  });
});

// ── Internal animation state ─────────────────────────────────

let _animTimer = null;
let _animClassId = null;
let _animState = 'idle';
let _animFrame = 0;
let _animContainer = null;
let _animHeight = 260;

function _stopAnim(){
  if(_animTimer){ clearTimeout(_animTimer); _animTimer = null; }
}

function _setFrame(classId, state, frameIndex, container, height){
  const cls = IMAGE_SPRITES[classId];
  if(!cls) return;
  const frames = cls[state] || cls.idle;
  if(!frames || !frames.length) return;
  const src = frames[frameIndex % frames.length];
  const imgObj = _cache[src] || _preload(src);

  let existing = container.querySelector('img.img-sprite');
  if(existing){
    existing.src = imgObj.src;
    existing.style.height = height + 'px';
    applyChromaFilter(existing, classId);
  } else {
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.alignItems = 'flex-end';
    container.style.justifyContent = 'center';
    container.style.width = '240px';   // fixed width prevents reflow/enemy shifting
    container.style.overflow = 'visible'; // allow frames to extend if needed
    const el = document.createElement('img');
    el.className = 'img-sprite';
    el.src = imgObj.src;
    el.style.height = height + 'px';
    el.style.width = 'auto';
    el.style.imageRendering = 'pixelated';
    el.style.display = 'block';
    el.draggable = false;
    applyChromaFilter(el, classId);
    container.appendChild(el);
  }
}

function _idleTick(){
  if(!_animClassId || !_animContainer) return;
  const cls = IMAGE_SPRITES[_animClassId];
  if(!cls) return;
  const frames = cls[_animState] || cls.idle;
  if(!frames) return;

  _setFrame(_animClassId, _animState, _animFrame, _animContainer, _animHeight);

  const timing = IMG_IDLE_TIMING[_animClassId] || [250, 250, 250, 250];
  const delay = timing[_animFrame % timing.length];
  _animFrame = (_animFrame + 1) % frames.length;
  _animTimer = setTimeout(_idleTick, delay);
}

// ── Public API ───────────────────────────────────────────────

function hasImageSprite(classId){
  return !!IMAGE_SPRITES[classId];
}

function getImageFrameCount(classId, state){
  const cls = IMAGE_SPRITES[classId];
  if(!cls) return 0;
  return (cls[state] || cls.idle || []).length;
}

// Start idle animation loop
function startImageIdle(classId, container, height){
  _stopAnim();
  _animClassId = classId;
  _animState = 'idle';
  _animFrame = 0;
  _animContainer = container;
  _animHeight = height || 260;
  _idleTick();
}

// Stop animation loop
function stopImageAnim(){
  _stopAnim();
  _animClassId = null;
}

// Play attack sequence (one-shot, returns to idle after)
function playImageAttack(classId, container, height, onDone){
  _stopAnim();
  const cls = IMAGE_SPRITES[classId];
  if(!cls || !cls.attack) { if(onDone) onDone(); return; }

  const frames = cls.attack;
  const duration = 500;
  const perFrame = Math.floor(duration / frames.length);
  let i = 0;

  _setFrame(classId, 'attack', 0, container, height);

  const atkTimer = setInterval(() => {
    i++;
    if(i < frames.length){
      _setFrame(classId, 'attack', i, container, height);
    } else {
      clearInterval(atkTimer);
      if(onDone) onDone();
    }
  }, perFrame);
}

// Play defend sequence (one-shot, returns to idle after)
function playImageDefend(classId, container, height, onDone){
  _stopAnim();
  const cls = IMAGE_SPRITES[classId];
  if(!cls || !cls.defend) { if(onDone) onDone(); return; }

  const frames = cls.defend;
  const duration = 380;
  const perFrame = Math.floor(duration / frames.length);
  let i = 0;

  _setFrame(classId, 'defend', 0, container, height);

  const defTimer = setInterval(() => {
    i++;
    if(i < frames.length){
      _setFrame(classId, 'defend', i, container, height);
    } else {
      clearInterval(defTimer);
      if(onDone) onDone();
    }
  }, perFrame);
}

// Render static frame (class select, mini HUD)
function renderImageSpriteStatic(classId, container, displayHeight){
  _setFrame(classId, 'idle', 0, container, displayHeight);
  return true;
}

// Render a specific frame (used by external callers)
function renderImageSprite(classId, state, frameIndex, container, displayHeight){
  _setFrame(classId, state, frameIndex, container, displayHeight);
  return true;
}

// ── Expose to window ─────────────────────────────────────────

window.IMAGE_SPRITES          = IMAGE_SPRITES;
window.CHROMAS                = CHROMAS;
window.getChromaFilter        = getChromaFilter;
window.applyChromaFilter      = applyChromaFilter;
window.hasImageSprite         = hasImageSprite;
window.getImageFrameCount     = getImageFrameCount;
window.renderImageSprite      = renderImageSprite;
window.renderImageSpriteStatic = renderImageSpriteStatic;
window.startImageIdle         = startImageIdle;
window.stopImageAnim          = stopImageAnim;
window.playImageAttack        = playImageAttack;
window.playImageDefend        = playImageDefend;

})();
