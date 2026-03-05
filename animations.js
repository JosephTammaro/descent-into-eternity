// ================================================================
// animations.js — Combat Animation System
// Frame swapper + CSS idle + attack/hit/death
// Descent into Eternity
// ================================================================

(function(){

// ══════════════════════════════════════════════════════════
//  CSS INJECTION
// ══════════════════════════════════════════════════════════

const _CSS = `

#playerSprite, #enemySprite {
  transform-origin: bottom center;
  display: inline-block;
  will-change: transform, filter;
}

@keyframes anim-idle-fighter {
  0%   { transform: translateY(0px) rotate(0deg);
         animation-timing-function: cubic-bezier(0.4, 0, 0.8, 0.6); }
  38%  { transform: translateY(3px) rotate(0.7deg);
         animation-timing-function: cubic-bezier(0.0, 0, 0.2, 1); }
  44%  { transform: translateY(3.2px) rotate(0.7deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}
@keyframes anim-idle-barbarian {
  0%   { transform: translateY(0px) translateX(0px) rotate(0deg);
         animation-timing-function: cubic-bezier(0.5, 0, 0.9, 0.5); }
  35%  { transform: translateY(4px) translateX(-1px) rotate(1.0deg);
         animation-timing-function: cubic-bezier(0.0, 0, 0.15, 1); }
  42%  { transform: translateY(4.2px) translateX(-1px) rotate(1.0deg); }
  72%  { transform: translateY(1px) translateX(1px) rotate(-0.3deg);
         animation-timing-function: cubic-bezier(0.0, 0, 0.2, 1); }
  100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
}
@keyframes anim-idle-wizard {
  0%   { transform: translateY(0px) scale(1.000);
         animation-timing-function: cubic-bezier(0.3, 0, 0.7, 0.4); }
  45%  { transform: translateY(2px) scale(1.005);
         animation-timing-function: cubic-bezier(0.0, 0, 0.3, 1); }
  100% { transform: translateY(0px) scale(1.000); }
}
@keyframes anim-idle-rogue {
  0%   { transform: translateY(0px) rotate(0deg);
         animation-timing-function: cubic-bezier(0.45, 0, 0.85, 0.55); }
  36%  { transform: translateY(3px) rotate(-0.6deg);
         animation-timing-function: cubic-bezier(0.0, 0, 0.2, 1); }
  100% { transform: translateY(0px) rotate(0deg); }
}
@keyframes anim-idle-paladin {
  0%   { transform: translateY(0px) rotate(0deg);
         animation-timing-function: cubic-bezier(0.35, 0, 0.65, 0.5); }
  42%  { transform: translateY(1.5px) rotate(0.3deg); }
  52%  { transform: translateY(1.5px) rotate(0.3deg);
         animation-timing-function: cubic-bezier(0.0, 0, 0.2, 1); }
  100% { transform: translateY(0px) rotate(0deg); }
}
@keyframes anim-idle-ranger {
  0%   { transform: translateY(0px) rotate(0deg);
         animation-timing-function: cubic-bezier(0.4, 0, 0.8, 0.55); }
  37%  { transform: translateY(3px) rotate(0.4deg);
         animation-timing-function: cubic-bezier(0.0, 0, 0.2, 1); }
  65%  { transform: translateY(0.8px) rotate(-0.2deg);
         animation-timing-function: cubic-bezier(0.0, 0, 0.3, 1); }
  100% { transform: translateY(0px) rotate(0deg); }
}
@keyframes anim-idle-cleric {
  0%   { transform: translateY(0px) rotate(0deg);
         animation-timing-function: cubic-bezier(0.35, 0, 0.65, 0.45); }
  42%  { transform: translateY(2.5px) rotate(0.5deg); }
  50%  { transform: translateY(2.5px) rotate(0.5deg);
         animation-timing-function: cubic-bezier(0.0, 0, 0.25, 1); }
  100% { transform: translateY(0px) rotate(0deg); }
}
@keyframes anim-idle-druid {
  0%   { transform: translateY(0px) rotate(0deg);
         animation-timing-function: cubic-bezier(0.3, 0, 0.6, 0.4); }
  38%  { transform: translateY(2px) rotate(0.4deg);
         animation-timing-function: cubic-bezier(0.0, 0, 0.2, 1); }
  55%  { transform: translateY(1.5px) rotate(0.2deg);
         animation-timing-function: cubic-bezier(0.0, 0, 0.3, 1); }
  75%  { transform: translateY(0.5px) rotate(-0.1deg);
         animation-timing-function: cubic-bezier(0.0, 0, 0.3, 1); }
  100% { transform: translateY(0px) rotate(0deg); }
}

@keyframes anim-idle-enemy {
  0%   { transform: translateY(0px) rotate(0deg);
         animation-timing-function: cubic-bezier(0.4, 0, 0.8, 0.6); }
  40%  { transform: translateY(3px) rotate(0.5deg);
         animation-timing-function: cubic-bezier(0.0, 0, 0.2, 1); }
  100% { transform: translateY(0px) rotate(0deg); }
}

@keyframes anim-attack-player {
  0%   { transform: translateX(0px) translateY(0px) rotate(0deg);
         animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1); }
  18%  { transform: translateX(-5px) translateY(2px) rotate(-2.5deg);
         animation-timing-function: cubic-bezier(0.2, 0, 0.1, 1); }
  50%  { transform: translateX(24px) translateY(-2px) rotate(4deg);
         animation-timing-function: ease; }
  65%  { transform: translateX(24px) translateY(0px) rotate(3deg);
         animation-timing-function: cubic-bezier(0.3, 0, 0.5, 1); }
  100% { transform: translateX(0px) translateY(0px) rotate(0deg); }
}

@keyframes anim-hit-player {
  0%   { transform: translateX(0px) translateY(0px); filter: brightness(1);
         animation-timing-function: cubic-bezier(0.1, 0, 0.3, 1); }
  20%  { transform: translateX(-10px) translateY(1px); filter: brightness(5) saturate(0);
         animation-timing-function: cubic-bezier(0.3, 0, 0.6, 1); }
  50%  { transform: translateX(-6px) translateY(0px); filter: brightness(2) saturate(0.3);
         animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1); }
  100% { transform: translateX(0px) translateY(0px); filter: brightness(1); }
}

@keyframes anim-attack-enemy {
  0%   { transform: translateX(0px) translateY(0px) rotate(0deg);
         animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1); }
  18%  { transform: translateX(5px) translateY(2px) rotate(2deg);
         animation-timing-function: cubic-bezier(0.2, 0, 0.1, 1); }
  50%  { transform: translateX(-22px) translateY(-2px) rotate(-4deg);
         animation-timing-function: ease; }
  65%  { transform: translateX(-22px) translateY(0px) rotate(-2deg);
         animation-timing-function: cubic-bezier(0.3, 0, 0.5, 1); }
  100% { transform: translateX(0px) translateY(0px) rotate(0deg); }
}

@keyframes anim-hit-enemy {
  0%   { transform: translateX(0px); filter: brightness(1);
         animation-timing-function: cubic-bezier(0.1, 0, 0.3, 1); }
  20%  { transform: translateX(10px); filter: brightness(5) saturate(0);
         animation-timing-function: cubic-bezier(0.3, 0, 0.6, 1); }
  55%  { transform: translateX(5px); filter: brightness(1.5);
         animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1); }
  100% { transform: translateX(0px); filter: brightness(1); }
}

@keyframes anim-death {
  0%   { opacity:1; transform:translateY(0px) rotate(0deg) scaleY(1);
         animation-timing-function:cubic-bezier(0.2,0,0.5,1); }
  25%  { opacity:1; transform:translateY(-6px) rotate(-8deg) scaleY(1.04);
         animation-timing-function:cubic-bezier(0.4,0,0.8,0.5); }
  65%  { opacity:0.7; transform:translateY(12px) rotate(-35deg) scaleY(0.92);
         animation-timing-function:cubic-bezier(0.2,0,0.4,1); }
  100% { opacity:0; transform:translateY(28px) rotate(-50deg) scaleY(0.75); }
}

#playerSprite.anim-idle-fighter  { animation: anim-idle-fighter  2.0s infinite; }
#playerSprite.anim-idle-barbarian{ animation: anim-idle-barbarian 1.6s infinite; }
#playerSprite.anim-idle-wizard   { animation: anim-idle-wizard   2.4s infinite; }
#playerSprite.anim-idle-rogue    { animation: anim-idle-rogue    1.8s infinite; }
#playerSprite.anim-idle-paladin  { animation: anim-idle-paladin  2.8s infinite; }
#playerSprite.anim-idle-ranger   { animation: anim-idle-ranger   1.9s infinite; }
#playerSprite.anim-idle-cleric   { animation: anim-idle-cleric   2.2s infinite; }
#playerSprite.anim-idle-druid    { animation: anim-idle-druid    3.0s infinite; }

#enemySprite.anim-idle-enemy {
  animation: anim-idle-enemy 2.1s infinite;
  animation-delay: -1.05s;
}

#playerSprite.anim-attack { animation: anim-attack-player 0.5s  ease-in-out forwards !important; }
#playerSprite.anim-hit    { animation: anim-hit-player    0.38s ease-in-out forwards !important; }
#enemySprite.anim-attack  { animation: anim-attack-enemy  0.5s  ease-in-out forwards !important; }
#enemySprite.anim-hit     { animation: anim-hit-enemy     0.32s ease-in-out forwards !important; }
#enemySprite.anim-death   { animation: anim-death         0.85s ease-in-out forwards !important; }

`;

(function injectStyles(){
  if(document.getElementById('anim-sys-styles')) return;
  const tag = document.createElement('style');
  tag.id = 'anim-sys-styles';
  tag.textContent = _CSS;
  document.head.appendChild(tag);
})();


// ══════════════════════════════════════════════════════════
//  FRAME SWAPPER CONFIGURATION
//  [frame1ms, frame2ms, frame3ms] — time each frame is visible.
//  Asymmetric timing creates distinct rhythm per class.
// ══════════════════════════════════════════════════════════

const _FRAME_TIMING = {
  fighter:   [220, 160, 220, 160],  // 4 frames for image sprites
  barbarian: [110, 210, 110],
  wizard:    [320, 280, 320, 280],  // 4 frames for image sprites
  rogue:     [200, 180, 200, 180],  // 4 frames for image sprites
  paladin:   [480, 180, 480],
  ranger:    [210, 140, 210],
  cleric:    [290, 210, 290],
  druid:     [400, 320, 400],
};

const _SPRITE_SIZE = 13;


// ══════════════════════════════════════════════════════════
//  FRAME SWAPPER STATE
// ══════════════════════════════════════════════════════════

let _frameTimer   = null;
let _frameIndex   = 0;
let _frameClassId = null;
let _framePaused  = false;
let _imgAnimState = 'idle';      // current animation state for image sprites
const _IMG_DISPLAY_HEIGHT = 260; // combat sprite display height in px


function _getFrames(cid){
  const f1 = window.CLASS_SPRITES        && window.CLASS_SPRITES[cid];
  const f2 = window.CLASS_SPRITE_FRAMES  && window.CLASS_SPRITE_FRAMES[cid];
  const f3 = window.CLASS_SPRITE_FRAMES3 && window.CLASS_SPRITE_FRAMES3[cid];
  return [f1, f2, f3].filter(Boolean);
}

function _showFrame(cid, index){
  const el = document.getElementById('playerSprite');
  if(!el) return;
  // Image sprite path
  if(window.hasImageSprite && window.hasImageSprite(cid)){
    const state = _imgAnimState || 'idle';
    if(window.renderImageSprite) window.renderImageSprite(cid, state, index, el, _IMG_DISPLAY_HEIGHT);
    return;
  }
  // Pixel grid fallback
  const frames = _getFrames(cid);
  if(!frames.length) return;
  const data = frames[index % frames.length];
  if(data && typeof renderSprite === 'function'){
    renderSprite(data, _SPRITE_SIZE, el);
  }
}

function _resetToFrame1(cid){
  const el = document.getElementById('playerSprite');
  if(!el) return;
  if(window.hasImageSprite && window.hasImageSprite(cid)){
    _imgAnimState = 'idle';
    if(window.renderImageSprite) window.renderImageSprite(cid, 'idle', 0, el, _IMG_DISPLAY_HEIGHT);
    return;
  }
  const f1 = window.CLASS_SPRITES && window.CLASS_SPRITES[cid];
  if(f1 && typeof renderSprite === 'function'){
    renderSprite(f1, _SPRITE_SIZE, el);
  }
}

function _tick(){
  if(_framePaused || !_frameClassId) return;
  const cid    = _frameClassId;
  const timing = _FRAME_TIMING[cid] || [200, 200, 200];

  // Image sprite path
  if(window.hasImageSprite && window.hasImageSprite(cid)){
    const state = _imgAnimState || 'idle';
    const count = window.getImageFrameCount ? window.getImageFrameCount(cid, state) : 4;
    _showFrame(cid, _frameIndex);
    const delay = timing[_frameIndex % timing.length];
    _frameIndex = (_frameIndex + 1) % count;
    _frameTimer = setTimeout(_tick, delay);
    return;
  }

  // Pixel grid path
  const frames = _getFrames(cid);
  const count  = frames.length;
  _showFrame(cid, _frameIndex);
  const delay = timing[_frameIndex % timing.length];
  _frameIndex = (_frameIndex + 1) % count;
  _frameTimer = setTimeout(_tick, delay);
}

function _startSwapper(cid){
  _stopSwapper();
  _frameClassId = cid;
  _frameIndex   = 0;
  _framePaused  = false;
  _tick();
}

function _stopSwapper(){
  if(_frameTimer){ clearTimeout(_frameTimer); _frameTimer = null; }
  _framePaused  = true;
  _frameClassId = null;
}

function _pauseSwapper(){
  // Freeze without clearing classId so resume knows who to restart
  _framePaused = true;
  if(_frameTimer){ clearTimeout(_frameTimer); _frameTimer = null; }
  if(_frameClassId) _resetToFrame1(_frameClassId);
}

function _resumeSwapper(){
  if(!_frameClassId) return;
  _frameIndex  = 0;
  _framePaused = false;
  _tick();
}


// ══════════════════════════════════════════════════════════
//  CSS IDLE CLASS HELPERS
// ══════════════════════════════════════════════════════════

const _PLAYER_IDLE_CLASSES = [
  'anim-idle-fighter','anim-idle-barbarian','anim-idle-wizard',
  'anim-idle-rogue','anim-idle-paladin','anim-idle-ranger',
  'anim-idle-cleric','anim-idle-druid',
];

const _CLASS_TO_IDLE = {
  fighter:   'anim-idle-fighter',
  barbarian: 'anim-idle-barbarian',
  wizard:    'anim-idle-wizard',
  rogue:     'anim-idle-rogue',
  paladin:   'anim-idle-paladin',
  ranger:    'anim-idle-ranger',
  cleric:    'anim-idle-cleric',
  druid:     'anim-idle-druid',
};

function _addIdleClass(cid){
  const el = document.getElementById('playerSprite');
  if(!el) return;
  _PLAYER_IDLE_CLASSES.forEach(c => el.classList.remove(c));
  const cls = _CLASS_TO_IDLE[cid];
  if(cls) el.classList.add(cls);
}

function _removeIdleClass(){
  const el = document.getElementById('playerSprite');
  if(el) _PLAYER_IDLE_CLASSES.forEach(c => el.classList.remove(c));
}


// ══════════════════════════════════════════════════════════
//  TIMER UTILITY (CSS action animations)
// ══════════════════════════════════════════════════════════

const _timers = {};

function _clearTimer(key){
  if(_timers[key]){ clearTimeout(_timers[key]); delete _timers[key]; }
}

function _applyClass(id, cls, duration, onDone){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.add(cls);
  _clearTimer(id+'_'+cls);
  _timers[id+'_'+cls] = setTimeout(()=>{
    el.classList.remove(cls);
    if(onDone) onDone();
  }, duration);
}


// ══════════════════════════════════════════════════════════
//  PUBLIC API — window.Anim
// ══════════════════════════════════════════════════════════

const Anim = {

  startPlayerIdle(classId){
    const cid = classId || (G && G.classId);
    if(!cid) return;
    if(cid === 'druid' && G && G.wildShapeHp > 0) return;
    // Image sprite classes are animated by ui.js startPlayerAnim()
    if(window.hasImageSprite && window.hasImageSprite(cid)){
      _frameClassId = cid; // track for attack/hit pause/resume
      _addIdleClass(cid);
      return;
    }
    _imgAnimState = 'idle';
    _addIdleClass(cid);
    _startSwapper(cid);
  },

  stopPlayerIdle(){
    _removeIdleClass();
    _stopSwapper();
    if(window.stopImageAnim) window.stopImageAnim();
  },

  startEnemyIdle(){
    const el = document.getElementById('enemySprite');
    if(el) el.classList.add('anim-idle-enemy');
  },

  stopEnemyIdle(){
    const el = document.getElementById('enemySprite');
    if(el) el.classList.remove('anim-idle-enemy');
  },

  playerAttack(onPeak){
    const DURATION = 500;
    const cid = _frameClassId || (G && G.classId);
    const isImg = cid && window.hasImageSprite && window.hasImageSprite(cid);

    // Stop any running image idle loop
    if(isImg && typeof stopPlayerAnim === 'function') stopPlayerAnim();
    _pauseSwapper();
    _removeIdleClass();

    if(isImg){
      const el = document.getElementById('playerSprite');
      if(el && window.playImageAttack){
        window.playImageAttack(cid, el, _IMG_DISPLAY_HEIGHT);
      }
    }

    _applyClass('playerSprite', 'anim-attack', DURATION, ()=>{
      if(isImg){
        // Restart image idle loop
        if(typeof startPlayerAnim === 'function') startPlayerAnim();
      } else {
        if(cid){ _addIdleClass(cid); _resumeSwapper(); }
      }
    });
    if(onPeak){
      _clearTimer('player_attack_peak');
      _timers['player_attack_peak'] = setTimeout(onPeak, Math.round(DURATION * 0.5));
    }
  },

  playerHit(){
    const DURATION = 380;
    const cid = _frameClassId || (G && G.classId);
    const isImg = cid && window.hasImageSprite && window.hasImageSprite(cid);

    // Stop any running image idle loop
    if(isImg && typeof stopPlayerAnim === 'function') stopPlayerAnim();
    _pauseSwapper();
    _removeIdleClass();

    if(isImg){
      const el = document.getElementById('playerSprite');
      if(el && window.playImageDefend){
        window.playImageDefend(cid, el, _IMG_DISPLAY_HEIGHT);
      }
    }

    _applyClass('playerSprite', 'anim-hit', DURATION, ()=>{
      if(isImg){
        if(typeof startPlayerAnim === 'function') startPlayerAnim();
      } else {
        if(cid){ _addIdleClass(cid); _resumeSwapper(); }
      }
    });
  },

  enemyAttack(){
    const DURATION = 500;
    this.stopEnemyIdle();
    _applyClass('enemySprite', 'anim-attack', DURATION, ()=>{ this.startEnemyIdle(); });
  },

  enemyHit(){
    const DURATION = 320;
    this.stopEnemyIdle();
    _applyClass('enemySprite', 'anim-hit', DURATION, ()=>{ this.startEnemyIdle(); });
  },

  enemyDeath(onDone){
    this.stopEnemyIdle();
    _applyClass('enemySprite', 'anim-death', 850, onDone);
  },

  onCombatStart(){
    this.startPlayerIdle();
    this.startEnemyIdle();
  },

  onCombatEnd(){
    this.stopPlayerIdle();
    this.stopEnemyIdle();
    if(window.stopImageAnim) window.stopImageAnim();
    Object.keys(_timers).forEach(k=>{ clearTimeout(_timers[k]); delete _timers[k]; });
  },

};

window.Anim = Anim;

})();
