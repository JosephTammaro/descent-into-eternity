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
};

// Idle timing per class (ms per frame)
const IMG_IDLE_TIMING = {
  fighter: [220, 160, 220, 160],
  wizard:  [320, 280, 320, 280],
};

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
window.hasImageSprite         = hasImageSprite;
window.getImageFrameCount     = getImageFrameCount;
window.renderImageSprite      = renderImageSprite;
window.renderImageSpriteStatic = renderImageSpriteStatic;
window.startImageIdle         = startImageIdle;
window.stopImageAnim          = stopImageAnim;
window.playImageAttack        = playImageAttack;
window.playImageDefend        = playImageDefend;

})();
