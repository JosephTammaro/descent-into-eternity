
// ── Gate logic ────────────────────────────────────────────
function _handleGate(){
  const hasClass = typeof G!=='undefined' && G && G.classId;
  if(!hasClass){
    stopTownEngine();
    window._classFromTown=true;
    if(typeof showScreen==='function') showScreen('class');
    if(typeof renderClassSelect==='function') renderClassSelect();
  } else if(G.zoneIdx >= 7 && !G._farewellShown) {
    G._farewellShown = true;
    // Phase B: Track farewell for unlocks before state gets wiped
    if(typeof updateUnlockStats==='function') updateUnlockStats('farewell');
    startFarewellInTown(()=>{ stopTownEngine(); townEnterDungeon(); });
  } else {
    openPrepareScreen();
  }
}

// ── Grace Vault logic ─────────────────────────────────────
function townOpenGraces(){
  stopTownEngine();
  const backBtn = document.querySelector('#screen-graces .grace-back-btn, #screen-graces [onclick*="showScreen"]');
  if(backBtn){
    backBtn._origOnclick = backBtn.getAttribute('onclick');
    backBtn._origText = backBtn.textContent;
    backBtn.setAttribute('onclick','townReturnFromGraces()');
    backBtn.textContent = '◀ BACK TO TOWN';
  }
  if(typeof activeSaveSlot!=='undefined'&&typeof slotOpenGraces==='function'){
    slotOpenGraces(activeSaveSlot);
  } else if(typeof showScreen==='function'){
    showScreen('graces');
  }
}

function townReturnFromGraces(){
  const backBtn = document.querySelector('#screen-graces .grace-back-btn, #screen-graces [onclick*="townReturnFromGraces"]');
  if(backBtn&&backBtn._origOnclick){
    backBtn.setAttribute('onclick', backBtn._origOnclick);
    backBtn.textContent = backBtn._origText || '◀ BACK';
  }
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const ts = document.getElementById('screen-town');
  if(ts) ts.classList.add('active');
  if(typeof _startTown==='function') _startTown();
}

// ══════════════════════════════════════════════════════════
//  TOWN INTRODUCTION — Animated guided tour (first visit)
//  Camera pans to each location with marker & slide transitions
// ══════════════════════════════════════════════════════════

const TOWN_INTRO_LINES = [
  { icon:'🏘', heading:'WELCOME TO ELDERFEN',
    camTx:30, camTy:22, marker:null,
    text:`The last town before the dark. People have lived here for three hundred years without fully understanding why they stay — but they stay. Something in the soil holds them.` },
  { icon:'🕹', heading:'HOW TO EXPLORE',
    camTx:30, camTy:22, marker:null,
    text:`Walk with WASD or arrow keys. Press E or Space near doors, people, and objects to interact. The people here have things to say — and what they say will change as you descend deeper.` },
  { icon:'⚔', heading:'THE DUNGEON GATE',
    camTx:29, camTy:3, marker:{tx:29,ty:4},
    text:`The entrance to what lies below. Approach it when you're ready to choose your class and begin your descent. After each boss, you'll return here to resupply.` },
  { icon:'✨', heading:'THE GRACE VAULT',
    camTx:25, camTy:4, marker:{tx:25,ty:3},
    text:`Permanent blessings earned across all your runs. Even death cannot take what the vault remembers. Spend Grace Points here on lasting power.` },
  { icon:'📦', heading:'THE STASH CHEST',
    camTx:22, camTy:8, marker:{tx:22,ty:8},
    text:`Your personal storage. Items here persist between runs — salvage gear from the dungeon and it waits for you next time. Load items before each descent.` },
  { icon:'🍺', heading:'THE RUSTED FLAGON',
    camTx:6, camTy:18, marker:{tx:6,ty:21},
    text:`Rook's tavern. Buy the old soldier a drink and he'll share rumors about what waits below. You'll also receive a combat buff each visit.` },
  { icon:'⛪', heading:'SHRINE OF SERAPHINE',
    camTx:36, camTy:5, marker:{tx:36,ty:8},
    text:`The Shrine's fire has burned without oil for three days. Seraphine offers class-specific blessings and heals your wounds. Don't leave town without one.` },
  { icon:'⚒', heading:"ALDRIC'S FORGE",
    camTx:5, camTy:31, marker:{tx:5,ty:34},
    text:`The blacksmith. Pay him to sharpen your blade before a run, and sell dungeon materials for gold. Every edge matters in the deep.` },
  { icon:'📚', heading:"MALACHAR'S STUDY",
    camTx:37, camTy:18, marker:{tx:37,ty:21},
    text:`The scholar has been circling a truth for years. Donate gold to fund his research and unlock access to rarer knowledge.` },
  { icon:'🛍', heading:"MIRELA'S GOODS",
    camTx:19, camTy:5, marker:{tx:19,ty:7},
    text:`Supplies for the descent. Browse her shop for gear and consumables. Purchases go into your stash for safekeeping.` },
  { icon:'🏟', heading:'THE PROVING GROUNDS',
    camTx:38, camTy:41, marker:{tx:38,ty:44},
    text:`A training arena in the south quarter. Practice combat and learn your abilities before risking the real thing below.` },
  { icon:'📋', heading:'THE NOTICE BOARD',
    camTx:29, camTy:16, marker:{tx:29,ty:17},
    text:`Posted notices from townsfolk and travelers. Check here for bounties that reward extra gold and rare items during your runs.` },
  { icon:'🏘', heading:'THE GATE WAITS',
    camTx:30, camTy:22, marker:null,
    text:`Explore at your own pace. Talk to the children, the guards, the farmers. Elderfen is alive. For now. When you're ready — the Gate waits.` },
];

// ── Intro camera & marker state ──────────────────────────
let _introCamActive = false;
let _introCamTarget = { x:0, y:0 };
let _introMarker = null; // {tx,ty} or null

let _townIntroTimer = null;
let _townIntroDone = null;
let _townIntroStep = 0;
let _townIntroSkipped = false;

function showTownIntro(onDone) {
  _townIntroDone = onDone;
  _townIntroStep = 0;
  _townIntroSkipped = false;

  const el = document.getElementById('townIntroScreen');
  if (!el) { if(onDone) onDone(); return; }
  el.style.display = 'flex';
  el.classList.remove('fading-out');

  // Activate intro camera — snap to first target immediately
  _introCamActive = true;
  const first = TOWN_INTRO_LINES[0];
  _introCamTarget = { x: first.camTx * TILE, y: first.camTy * TILE };
  _introMarker = first.marker;
  const mapW = EXT_COLS * TILE, mapH = EXT_ROWS * TILE;
  const vpW = _logW(), vpH = _logH();
  _camX = Math.max(0, Math.min(mapW - vpW, _introCamTarget.x - vpW/2));
  _camY = Math.max(0, Math.min(mapH - vpH, _introCamTarget.y - vpH/2));

  _renderIntroStep(false);
  document.addEventListener('keydown', _townIntroKeyHandler);
}

function _renderIntroStep(animate) {
  if (_townIntroSkipped) return;
  const line = TOWN_INTRO_LINES[_townIntroStep];
  if (!line) return;

  const inner   = document.getElementById('townIntroCardInner');
  const icon    = document.getElementById('townIntroIcon');
  const heading = document.getElementById('townIntroHeading');
  const text    = document.getElementById('townIntroText');
  const counter = document.getElementById('townIntroCounter');
  const nextBtn = document.getElementById('townIntroNextBtn');
  const bar     = document.getElementById('townIntroProgressBar');
  if (!inner || !text) return;

  // Update camera target & marker
  _introCamTarget = { x: line.camTx * TILE, y: line.camTy * TILE };
  _introMarker = line.marker;

  function applyContent() {
    // Icon with pulse
    if (icon) {
      icon.textContent = line.icon || '';
      icon.classList.remove('pulse');
      void icon.offsetWidth;
      icon.classList.add('pulse');
    }
    // Heading
    if (heading) {
      heading.textContent = line.heading || '';
      heading.style.display = line.heading ? 'block' : 'none';
    }
    // Typewriter text
    text.textContent = '';
    let i = 0;
    const txt = line.text;
    if (_townIntroTimer) clearTimeout(_townIntroTimer);
    function type() {
      if (_townIntroSkipped) return;
      if (i < txt.length) {
        text.textContent += txt[i++];
        _townIntroTimer = setTimeout(type, 12);
      }
    }
    type();
    // Counter & button
    if (counter) counter.textContent = (_townIntroStep + 1) + ' / ' + TOWN_INTRO_LINES.length;
    if (nextBtn) nextBtn.textContent = _townIntroStep >= TOWN_INTRO_LINES.length - 1 ? '⚔ ENTER ELDERFEN' : 'NEXT ▸';
    // Progress bar
    if (bar) bar.style.width = ((_townIntroStep + 1) / TOWN_INTRO_LINES.length * 100) + '%';
  }

  if (animate && inner) {
    inner.classList.add('slide-out');
    setTimeout(() => {
      if (_townIntroSkipped) return;
      applyContent();
      inner.classList.remove('slide-out');
      inner.classList.add('slide-in');
      setTimeout(() => inner.classList.remove('slide-in'), 400);
    }, 200);
  } else {
    applyContent();
    if (bar) bar.style.width = (1 / TOWN_INTRO_LINES.length * 100) + '%';
  }
}

function _townIntroAdvance() {
  if (_townIntroSkipped) return;
  // First press: if typewriter is still running, finish it instantly
  const text = document.getElementById('townIntroText');
  const line = TOWN_INTRO_LINES[_townIntroStep];
  if (text && line && text.textContent.length < line.text.length) {
    if (_townIntroTimer) clearTimeout(_townIntroTimer);
    text.textContent = line.text;
    return;
  }
  // Second press: advance to next step
  _townIntroStep++;
  if (_townIntroStep >= TOWN_INTRO_LINES.length) {
    closeTownIntro();
  } else {
    _renderIntroStep(true);
  }
}

function _townIntroKeyHandler(e) {
  if (e.key === 'Escape') {
    closeTownIntro();
  } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') {
    e.preventDefault();
    _townIntroAdvance();
  }
}

function closeTownIntro() {
  _townIntroSkipped = true;
  if (_townIntroTimer) { clearTimeout(_townIntroTimer); _townIntroTimer = null; }
  document.removeEventListener('keydown', _townIntroKeyHandler);

  // Fade out overlay
  const el = document.getElementById('townIntroScreen');
  if (el) {
    el.classList.add('fading-out');
    setTimeout(() => { el.style.display = 'none'; el.classList.remove('fading-out'); }, 600);
  }

  // Release camera & marker
  _introCamActive = false;
  _introMarker = null;

  // Persist flag
  if (typeof G !== 'undefined' && G) G._townIntroShown = true;
  if (typeof updateSlotData === 'function' && typeof activeSaveSlot !== 'undefined' && activeSaveSlot) {
    updateSlotData(activeSaveSlot, d => { d._townIntroShown = true; });
  }

  setTimeout(() => {
    if (_townIntroDone) { const fn = _townIntroDone; _townIntroDone = null; fn(); }
  }, 300);
}

// ── Draw pulsing location marker on canvas ───────────────
function _drawIntroMarker(ctx, camX, camY) {
  if (!_introMarker) return;
  const px = _introMarker.tx * TILE + TILE/2 - camX;
  const py = _introMarker.ty * TILE - camY;
  const t = performance.now() / 1000;
  const bob = Math.sin(t * 3) * 3;
  const pulse = 0.6 + Math.sin(t * 4) * 0.4;

  ctx.save();

  // Large radial glow on ground
  const glowR = 14 + Math.sin(t * 2.5) * 3;
  const grd = ctx.createRadialGradient(px, py + TILE*0.3, 0, px, py + TILE*0.3, glowR);
  grd.addColorStop(0, `rgba(200,168,75,${0.35 * pulse})`);
  grd.addColorStop(0.5, `rgba(200,168,75,${0.12 * pulse})`);
  grd.addColorStop(1, 'rgba(200,168,75,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(px - glowR, py + TILE*0.3 - glowR, glowR*2, glowR*2);

  // Pulsing ground ring
  ctx.globalAlpha = pulse * 0.5;
  ctx.strokeStyle = '#c8a84b';
  ctx.lineWidth = 1;
  const ringR = 10 + Math.sin(t * 2) * 2;
  ctx.beginPath();
  ctx.ellipse(px, py + TILE * 0.4, ringR, ringR * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Vertical beam of light
  ctx.globalAlpha = pulse * 0.08;
  ctx.fillStyle = '#c8a84b';
  ctx.fillRect(px - 1.5, py - 30 + bob, 3, 35);

  // Main arrow — big solid downward chevron
  const ay = py - 12 + bob;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#c8a84b';
  ctx.shadowColor = '#c8a84b';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(px, ay + 10);      // tip
  ctx.lineTo(px - 8, ay);       // top-left outer
  ctx.lineTo(px - 4, ay);       // top-left inner
  ctx.lineTo(px, ay + 6);       // inner notch
  ctx.lineTo(px + 4, ay);       // top-right inner
  ctx.lineTo(px + 8, ay);       // top-right outer
  ctx.closePath();
  ctx.fill();

  // Second chevron above (slightly smaller, fainter)
  const ay2 = ay - 8;
  ctx.globalAlpha = pulse * 0.55;
  ctx.beginPath();
  ctx.moveTo(px, ay2 + 8);
  ctx.lineTo(px - 6, ay2);
  ctx.lineTo(px - 3, ay2);
  ctx.lineTo(px, ay2 + 5);
  ctx.lineTo(px + 3, ay2);
  ctx.lineTo(px + 6, ay2);
  ctx.closePath();
  ctx.fill();

  // Third chevron (faintest, highest)
  const ay3 = ay2 - 7;
  ctx.globalAlpha = pulse * 0.25;
  ctx.beginPath();
  ctx.moveTo(px, ay3 + 6);
  ctx.lineTo(px - 5, ay3);
  ctx.lineTo(px - 2, ay3);
  ctx.lineTo(px, ay3 + 4);
  ctx.lineTo(px + 2, ay3);
  ctx.lineTo(px + 5, ay3);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;

  // Sparkle particles orbiting
  for (let i = 0; i < 4; i++) {
    const angle = t * 2 + i * Math.PI / 2;
    const orbitR = 8 + Math.sin(t * 3 + i) * 2;
    const sx = px + Math.cos(angle) * orbitR;
    const sy = py - 4 + Math.sin(angle) * orbitR * 0.4 + bob * 0.5;
    const sparkAlpha = 0.3 + Math.sin(t * 5 + i * 1.5) * 0.3;
    ctx.globalAlpha = sparkAlpha;
    ctx.fillStyle = '#ffe090';
    ctx.fillRect(sx - 0.5, sy - 0.5, 1, 1);
  }

  ctx.restore();
}

// ── Elspeth's Gate Farewell — triggered before Zone VIII descent ──
const FAREWELL_LINES = [
  { speaker: 'Narrator',     text: `They came to the Gate at dawn. You did not ask them to. They simply all ended up there — Rook, Elspeth, Seraphine, Aldric's apprentice, Father Oswin. And Kit.` },
  { speaker: 'Narrator',     text: `Nobody spoke at first. The Gate hummed very quietly, the way it always does before the dark takes hold.` },
  { speaker: 'Rook',         text: `"I kept a stool empty for thirty years. Didn't know why. I know now. You've got a seat whenever you come back. It'll be there."` },
  { speaker: 'Father Oswin', text: `"I wrote a prayer for endings. Good ones. I'll say it when you return. Go with everything you have."` },
  { speaker: 'Seraphine',    text: `"The Shrine's fire has been burning without oil since you arrived. This morning it burned gold. I take that as a good sign."` },
  { speaker: 'Kit',          text: `"I left the last page of my journal blank. For the ending. Whatever you say when you come back out — that's what goes in it. Don't make me leave it blank."` },
  { speaker: 'Narrator',     text: `Elspeth took your hand. She held it for a moment — not frail, not trembling. Steady, the way a person is steady when they have decided something completely.` },
  { speaker: 'Elspeth',      text: `"You have come back every time. I do not know what you are doing down there. I do not need to know."` },
  { speaker: 'Elspeth',      text: `"But whatever it is — finish it."` },
  { speaker: 'Narrator',     text: `You turned toward the Gate.` },
  { speaker: 'Narrator',     text: `Behind you, six people who do not know your real name stand in the cold morning light, holding it for you until you return.` },
];

let _farewellTimer = null;
let _farewellDone = null;
let _farewellStep = 0;

function showFarewellCutscene(onDone) {
  _farewellDone = onDone;
  _farewellStep = 0;
  const el = document.getElementById('farewellScreen');
  if (!el) { onDone(); return; }
  el.style.display = 'flex';
  const box = document.getElementById('farewellBox');
  const speaker = document.getElementById('farewellSpeaker');
  const text = document.getElementById('farewellText');
  const btn = document.getElementById('farewellBtn');
  btn.style.opacity = '0';
  box.classList.remove('fade-in');

  function showStep() {
    if (_farewellStep >= FAREWELL_LINES.length) {
      btn.style.opacity = '1';
      return;
    }
    const line = FAREWELL_LINES[_farewellStep];
    speaker.textContent = line.speaker === 'Narrator' ? '' : line.speaker;
    speaker.style.opacity = line.speaker === 'Narrator' ? '0' : '1';
    text.textContent = '';
    box.classList.remove('fade-in');
    void box.offsetWidth; // force reflow
    box.classList.add('fade-in');
    // Typewriter effect
    let i = 0;
    const txt = line.text;
    function type() {
      if (i < txt.length) {
        text.textContent += txt[i++];
        _farewellTimer = setTimeout(type, i === txt.length ? 0 : 22);
      }
    }
    type();
    _farewellStep++;
    if (_farewellStep < FAREWELL_LINES.length) {
      _farewellTimer = setTimeout(showStep, 3400);
    } else {
      _farewellTimer = setTimeout(() => { btn.style.opacity = '1'; }, 1200);
    }
  }
  showStep();
}

function closeFarewellCutscene() {
  if (_farewellTimer) clearTimeout(_farewellTimer);
  const el = document.getElementById('farewellScreen');
  if (el) el.style.display = 'none';
  if (_farewellDone) { const fn = _farewellDone; _farewellDone = null; fn(); }
}

// ══════════════════════════════════════════════════════════
//  IN-TOWN FAREWELL SEQUENCE
//  Replaces the text-overlay farewell with a live town scene.
//  NPCs gather at the Gate, hero turns north, narrator text
//  and speech bubbles play in sequence. Player advances each
//  beat with Space / Enter / click.
// ══════════════════════════════════════════════════════════

var _farewellInTownActive = false;
var _farewellGathering    = false;
var _farewellBeatIdx      = 0;
var _farewellOnDone       = null;
var _farewellGatherTimer  = null;

// Gate is at col ~29, row ~4. Crowd gathers rows 7-11.
// IDs match the render system's hairCols/accessory lookup keys.
const FAREWELL_GATHER = [
  { id:'rook',       label:'Rook',              color:'#c8a020', icon:'🍺', tx:26, ty:8,  facing:1 },
  { id:'priest',     label:'Father Oswin',      color:'#d0d0e0', icon:'✝',  tx:24, ty:9,  facing:1 },
  { id:'seraphine',  label:'Seraphine',         color:'#a0c4ff', icon:'⛪', tx:33, ty:8,  facing:3 },
  { id:'apprentice', label:"Aldric's Apprentice",color:'#c06830',icon:'⚒', tx:35, ty:9,  facing:3 },
  { id:'child1',     label:'Kit',               color:'#c0d090', icon:'🧒', tx:31, ty:10, facing:0 },
  { id:'oldwoman',   label:'Elspeth',           color:'#c0a080', icon:'👵', tx:29, ty:11, facing:0 },
];

const FAREWELL_BEATS = [
  { type:'narrator', text:`They came to the Gate at dawn. You did not ask them to. They simply all ended up there — Rook, Elspeth, Seraphine, Aldric's apprentice, Father Oswin. And Kit.` },
  { type:'narrator', text:`Nobody spoke at first. The Gate hummed very quietly, the way it always does before the dark takes hold.` },
  { type:'bubble', id:'rook',       label:'Rook',               text:`"I kept a stool empty for thirty years. Didn't know why. I know now. You've got a seat whenever you come back. It'll be there."` },
  { type:'bubble', id:'priest',     label:'Father Oswin',       text:`"I wrote a prayer for endings. Good ones. I'll say it when you return. Go with everything you have."` },
  { type:'bubble', id:'seraphine',  label:'Seraphine',          text:`"The Shrine's fire has been burning without oil since you arrived. This morning it burned gold. I take that as a good sign."` },
  { type:'bubble', id:'apprentice', label:"Aldric's Apprentice",text:`"Aldric told me to sharpen it one last time. I did. This morning. Before dawn."` },
  { type:'bubble', id:'child1',     label:'Kit',                text:`"I left the last page of my journal blank. For the ending. Whatever you say when you come back out — that's what goes in it. Don't make me leave it blank."` },
  { type:'narrator', text:`Elspeth took your hand. She held it for a moment — not frail, not trembling. Steady, the way a person is steady when they have decided something completely.` },
  { type:'bubble', id:'oldwoman',   label:'Elspeth',            text:`"You have come back every time. I do not know what you are doing down there. I do not need to know."` },
  { type:'bubble', id:'oldwoman',   label:'Elspeth',            text:`"But whatever it is — finish it."` },
  { type:'narrator', text:`Behind you, six people who do not know your real name stand in the cold morning light, holding it for you until you return.`, isFinal:true },
];

function _buildFarewellWanderers(){
  return FAREWELL_GATHER.map(npc => {
    // Start at row 13 — guaranteed southern edge of the clear zone around
    // the Gate (cols 23-35, rows 5-13). Pure north walk to target, no
    // diagonal movement so no building collision possible.
    const startX = npc.tx * TILE + TILE/2 + (Math.random()-0.5)*4;
    const startY = 13 * TILE + Math.random()*TILE*0.8;
    return {
      id: npc.id, label: npc.label, color: npc.color, icon: npc.icon,
      wx: startX, wy: startY,
      wanderTarget: { x: npc.tx*TILE + TILE/2, y: npc.ty*TILE + TILE/2 },
      wanderTimer: 9999, talking: false, talkTimer: 0, activeLine: 0,
      facing: 2, stationary: false, lines: [],
      _speed: 1.2,
    };
  });
}

function startFarewellInTown(onDone){
  _farewellInTownActive = true;
  _farewellGathering    = true;
  _farewellBeatIdx      = 0;
  _farewellOnDone       = onDone;

  // Hero turns to face the crowd (north = toward gate)
  _pl.facing = 0;

  // Replace wanderers with farewell crowd
  _wanderers = _buildFarewellWanderers();

  // Repurpose the NPC speech close button as a "continue" button
  const closeBtn = document.querySelector('.npc-speech-close');
  if(closeBtn){
    closeBtn._farewellOrig = closeBtn.getAttribute('onclick');
    closeBtn.setAttribute('onclick', '_farewellAdvance()');
    closeBtn.textContent = '▼';
  }

  closeNpcDialog();

  // Gather phase — NPCs walk into position, then begin beats
  _farewellGatherTimer = setTimeout(()=>{
    _farewellGathering = false;
    // Lock them in place facing the right direction
    _wanderers.forEach((w, i) => {
      w.stationary = true;
      w.facing = FAREWELL_GATHER[i].facing;
    });
    _farewellShowBeat();
  }, 4000);
}

function _farewellShowBeat(){
  if(_farewellBeatIdx >= FAREWELL_BEATS.length){ _farewellEnd(); return; }
  const beat = FAREWELL_BEATS[_farewellBeatIdx];
  if(beat.type === 'narrator'){
    closeNpcDialog();
    const el  = document.getElementById('farewellNarrator');
    const txt = document.getElementById('farewellNarrText');
    if(el && txt){ txt.textContent = beat.text; el.classList.add('active'); }
  } else {
    _farewellHideNarrator();
    const w = _wanderers.find(w => w.id === beat.id);
    _showDialog(beat.label, beat.text, w ? w.wx : _pl.wx, w ? w.wy : _pl.wy);
    // Disable auto-dismiss — player controls pacing
    if(_npcDialogTimer){ clearTimeout(_npcDialogTimer); _npcDialogTimer = null; }
  }
}

function _farewellAdvance(){
  if(!_farewellInTownActive || _farewellGathering) return;
  const beat = FAREWELL_BEATS[_farewellBeatIdx];
  _farewellBeatIdx++;
  _farewellHideNarrator();
  closeNpcDialog();
  if(beat && beat.isFinal){ _farewellEnd(); return; }
  _farewellShowBeat();
}

function _farewellHideNarrator(){
  const el = document.getElementById('farewellNarrator');
  if(el) el.classList.remove('active');
}

function _farewellEnd(){
  if(_farewellGatherTimer){ clearTimeout(_farewellGatherTimer); _farewellGatherTimer = null; }
  _farewellInTownActive = false;
  _farewellGathering    = false;
  _farewellHideNarrator();
  closeNpcDialog();
  // Restore close button
  const closeBtn = document.querySelector('.npc-speech-close');
  if(closeBtn){
    if(closeBtn._farewellOrig !== undefined) closeBtn.setAttribute('onclick', closeBtn._farewellOrig);
    closeBtn.textContent = '✕';
  }
  // Brief pause — let the scene breathe before the dungeon screen fires
  if(_farewellOnDone){
    const fn = _farewellOnDone; _farewellOnDone = null;
    setTimeout(fn, 1200);
  }
}

// ── Wanderer talk ─────────────────────────────────────────
function _talkToWanderer(w){
  if(w.talking) return;
  w.talking=true;
  w.talkTimer=180; // pause movement for 3 seconds
  // Face player
  const dx=_pl.wx-w.wx, dy=_pl.wy-w.wy;
  w.facing=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);
  // Show dialog
  const zi=_townState(_townBossCount());
  const zLines=NPC_LINES[zi]||NPC_LINES[0];
  let lines=typeof w.getLines==='function' ? w.getLines() : (w.lines||[]);
  // Resolve string keys to actual lines
  if(lines.length && typeof lines[0]==='string' && lines[0].startsWith('z_')){
    const key=lines[0]; lines=(zLines[key]||['...']).slice();
  }
  if(!lines.length) lines=['...'];
  const line=lines[w.activeLine||0];
  w.activeLine=((w.activeLine||0)+1)%lines.length;
  _showDialog(w.label||'???', line, w.wx, w.wy);
}

function _showNPCLine(n){
  const zi=_townState(_townBossCount());
  const zLines=NPC_LINES[zi]||NPC_LINES[0];
  let lines=n.lines||[];
  if(typeof lines[0]==='string' && lines[0].startsWith('z_')){
    const key=lines[0]; lines=(zLines[key]||['...']).slice();
  }
  if(!lines.length) lines=['...'];
  const line=lines[n._lineIdx||0];
  n._lineIdx=((n._lineIdx||0)+1)%lines.length;
  const _nwx = n._wx !== undefined ? n._wx : n.tx*TILE+TILE/2;
  const _nwy = n._wy !== undefined ? n._wy : n.ty*TILE+TILE/2;
  _showDialog(n.label||'???', line, _nwx, _nwy);
}

// ── Simple dialog box (NPC speech) ───────────────────────
let _npcDialogTimer = null;
function _showDialog(name, text, srcX, srcY){
  const ov=document.getElementById('npcSpeechOverlay');
  const nm=document.getElementById('npcSpeechName');
  const tx=document.getElementById('npcSpeechText');
  if(!ov||!nm||!tx) return;
  nm.textContent=name;
  tx.textContent=text;
  ov.classList.add('open');
  _dialogSrcX = (srcX !== undefined) ? srcX : null;
  _dialogSrcY = (srcY !== undefined) ? srcY : null;
  if(_npcDialogTimer) clearTimeout(_npcDialogTimer);
  _npcDialogTimer=setTimeout(()=>{ ov.classList.remove('open'); _dialogSrcX=null; _dialogSrcY=null; }, 8000);
}
function closeNpcDialog(){
  const ov=document.getElementById('npcSpeechOverlay');
  if(ov) ov.classList.remove('open');
  _dialogSrcX=null; _dialogSrcY=null;
  if(_npcDialogTimer){clearTimeout(_npcDialogTimer);_npcDialogTimer=null;}
}

// ══════════════════════════════════════════════════════════
//  TOWN STATE CHANGE FLASH
// ══════════════════════════════════════════════════════════
const STATE_CHANGE_TEXT = [
  null, // state 0 → no flash on first visit
  { main: "The merchants left in the night.\nThe market stands half-empty.", sub: "The First Wave" },
  { main: "Families with children have gone.\nOnly those who cannot leave remain.", sub: "The Second Wave" },
  { main: "The streets are quiet now.\nFive souls hold vigil in the dark.", sub: "The Faithful Few" },
  { main: "The town holds its breath.\nThe Gate hums louder than the wind.", sub: "The Final Descent" }
];

let _lastSeenTownState = -1;
let _stateFlashTimer = null;

function _triggerStateFlash(newState){
  const data = STATE_CHANGE_TEXT[newState];
  if(!data) return;
  const el = document.getElementById('townStateFlash');
  const txt = document.getElementById('tsfText');
  const sub = document.getElementById('tsfSub');
  if(!el||!txt||!sub) return;

  txt.textContent = data.main;
  sub.textContent = data.sub;

  // Reset animations
  el.classList.remove('fading');
  el.offsetHeight; // force reflow
  el.classList.add('active');

  // Auto-dismiss after 10 seconds
  if(_stateFlashTimer) clearTimeout(_stateFlashTimer);
  _stateFlashTimer = setTimeout(()=>{ _dismissStateFlash(); }, 10000);
}

function _dismissStateFlash(){
  if(_stateFlashTimer){ clearTimeout(_stateFlashTimer); _stateFlashTimer=null; }
  const el = document.getElementById('townStateFlash');
  if(!el) return;
  el.classList.add('fading');
  setTimeout(()=>{
    el.classList.remove('active','fading');
  }, 1300);
}

// ══════════════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════════════
function showTownHub(){
  TOWN.blessingUsed=false; TOWN.tavernDrinkUsed=false;
  TOWN.forgeVisited=false; TOWN._sharpenApplied=false;

  // Mark player as in town for save/continue routing
  if(typeof G!=='undefined'&&G) G._inTown=true;

  const isVictory = (typeof G!=='undefined' && G && G._victoryMode);

  const bossesBeaten=_townBossCount();
  const atmosIdx=Math.min(bossesBeaten<=0?0:bossesBeaten<=2?1:bossesBeaten<=4?2:bossesBeaten<=6?3:4, ATMOS.length-1);
  const currentState = _townState(bossesBeaten);
  _tZone=atmosIdx; _tScene='exterior';

  // Spawn player near main road centre (victory mode overrides position later)
  _pl.wx=30*TILE+TILE/2; _pl.wy=26*TILE;
  _pl.facing=2;

  _wanderers=_buildWanderers(bossesBeaten);
  _initPtcls(ATMOS[atmosIdx].fx);
  _initAmbient(currentState);

  if(typeof AUDIO!=='undefined'&&AUDIO.playBGM) AUDIO.playBGM('campfire');
  if(typeof showScreen==='function') showScreen('town');
  if(!isVictory && typeof autoSave==='function') autoSave();

  // ── Town State Change Flash (skip in victory mode) ──
  if(!isVictory){
    if(_lastSeenTownState >= 0 && currentState > _lastSeenTownState && currentState <= 4){
      _triggerStateFlash(currentState);
    }
    _lastSeenTownState = currentState;
  }

  setTimeout(()=>{
    _startTown();
    if(isVictory){
      // Victory mode — gather NPCs at gate and play sequence
      _startVictoryInTown();
    } else {
      // ── Town Introduction — first visit only ──
      _checkTownIntro();
    }
  }, 80);
}

function _checkTownIntro(){
  // Check if intro has already been shown (from G state or slot data)
  let shown = false;
  if(typeof G!=='undefined' && G && G._townIntroShown) shown = true;
  if(!shown && typeof loadSlotData==='function' && typeof activeSaveSlot!=='undefined' && activeSaveSlot){
    const sd = loadSlotData(activeSaveSlot);
    if(sd && sd._townIntroShown) shown = true;
  }
  if(!shown){
    showTownIntro(()=>{
      // Intro finished — resume normal town activity
    });
  }
}

function _startTown(){
  _tc=document.getElementById('townCanvas');
  if(!_tc){console.warn('[Town] canvas not found');return;}

  // Physical canvas = full screen, logical size = physical / scale
  // This makes every tile 3x bigger on screen without changing game logic
  _tc.width  = window.innerWidth;
  _tc.height = window.innerHeight;
  _tc.style.width='100%';
  _tc.style.height='100%';

  _tx=_tc.getContext('2d');
  _tx.imageSmoothingEnabled=false;
  _tx.scale(DRAW_SCALE, DRAW_SCALE);

  for(const k in _keys) delete _keys[k];
  if(_tRAF) cancelAnimationFrame(_tRAF);
  _tRunning=true;
  _tRAF=requestAnimationFrame(_townTick);

  document.removeEventListener('keydown',_kd);
  document.removeEventListener('keyup',_ku);
  document.addEventListener('keydown',_kd);
  document.addEventListener('keyup',_ku);

  // Initial loadout HUD update
  updateTownLoadout();

  // Handle window resize
  window.removeEventListener('resize',_onResize);
  window.addEventListener('resize',_onResize);
}

function _onResize(){
  if(!_tc||!_tx) return;
  _tc.width=window.innerWidth;
  _tc.height=window.innerHeight;
  _tx.imageSmoothingEnabled=false;
  _tx.scale(DRAW_SCALE, DRAW_SCALE);
}

function stopTownEngine(){
  _tRunning=false;
  if(_tRAF){cancelAnimationFrame(_tRAF);_tRAF=null;}
  document.removeEventListener('keydown',_kd);
  document.removeEventListener('keyup',_ku);
  window.removeEventListener('resize',_onResize);
  // Hide loadout HUD
  const hud=document.getElementById('townLoadoutHUD');
  if(hud) hud.innerHTML='';
}

function _resumeTown(){
  if(!_tc) _tc=document.getElementById('townCanvas');
  if(!_tc) return;
  _tx=_tc.getContext('2d');
  _tx.setTransform(DRAW_SCALE,0,0,DRAW_SCALE,0,0);
  _tx.imageSmoothingEnabled=false;
  for(const k in _keys) delete _keys[k];
  document.addEventListener('keydown',_kd);
  document.addEventListener('keyup',_ku);
  window.addEventListener('resize',_onResize);
  if(_tRAF) cancelAnimationFrame(_tRAF);
  _tRunning=true;
  _tRAF=requestAnimationFrame(_townTick);
}

function townEnterDungeon(){
  stopTownEngine();
  if(typeof AUDIO!=='undefined'&&AUDIO.sfx&&AUDIO.sfx.rage) AUDIO.sfx.rage();

  // Always start fresh — preserve only what persists between runs
  if(typeof G!=='undefined'&&G&&G.classId){
    const classId      = G.classId;
    const savedGold    = G.gold || 0;
    const bossDefeated = G.bossDefeated ? [...G.bossDefeated] : [];

    // ── Capture town buffs before reset ──
    const townBuffs = [];
    if(TOWN._sharpenApplied) townBuffs.push({id:'sharpen', icon:'⚒', name:'Sharpened Weapon', desc:'+2 '+getOffensiveStatLabel(G), apply:()=>{addOffensiveStat(G,2);}});
    if(TOWN.blessingUsed && SHRINE_BLESSINGS[classId]){
      const bl = SHRINE_BLESSINGS[classId];
      townBuffs.push({id:'blessing', icon:bl.icon, name:bl.name, desc:bl.desc, apply:bl.apply});
    }

    G = newState(classId);

    // Restore persistent values
    G.gold         = savedGold;
    G.bossDefeated = bossDefeated;

    // Seed bossDefeated from slot data in case it's more up to date
    if(typeof activeSaveSlot!=='undefined'&&activeSaveSlot&&typeof loadSlotData==='function'){
      const slotData=loadSlotData(activeSaveSlot);
      if(slotData&&slotData.bossDefeated){
        slotData.bossDefeated.forEach((v,i)=>{ if(v) G.bossDefeated[i]=true; });
      }
      // Load active chroma for this class from save slot
      if(slotData&&slotData.chromaSelections&&slotData.chromaSelections[classId]){
        G._activeChroma=slotData.chromaSelections[classId];
      }
      // Load lifetime chroma trackers from save slot
      if(slotData){
        G._lifetimeSmites=slotData.lifetimeSmitesPaladin||0;
        G._lifetimeChannels=slotData.lifetimeChannelsCleric||0;
        G._lifetimePoisonsApplied=slotData.lifetimePoisonsDruid||0;
        G._lifetimeWildShapeTurns=slotData.lifetimeWildShapeTurnsDruid||0;
        G._lifetimeFlawlessRogue=slotData.lifetimeFlawlessRogue||0;
        G._lifetimeGoldRogue=slotData.lifetimeGoldRogue||0;
        G._lifetimeObjectivesRanger=slotData.lifetimeObjectivesRanger||0;
        G._markedBossKills=slotData.lifetimeMarkedBossKillsRanger||0;
      }
    }

    // Starter weapon
    const starters={fighter:'sword',wizard:'staff',rogue:'dagger',paladin:'sword',ranger:'bow',barbarian:'sword',cleric:'staff',druid:'staff'};
    const starterItem={...ITEMS.find(i=>i.id===starters[classId])};
    G.equipped.weapon=starterItem;
    if(typeof applyItemStats==='function') applyItemStats(starterItem);

    // Starting potions
    if(typeof addItem==='function') addItem({...ITEMS.find(i=>i.id==='hpPotion'),qty:2});

    // Grace buffs and grace gold
    G.unlockedAchievements = typeof getSlotAchievements==='function' ? getSlotAchievements() : [];
    if(typeof applyGraceBuffs==='function') applyGraceBuffs(classId);
    if(typeof consumePendingGraceGold==='function'){
      const graceGold=consumePendingGraceGold();
      if(graceGold>0){ G.gold+=graceGold; }
    }

    // ── Apply permanent upgrades from Proving Grounds ──
    if(typeof applyPermanentUpgrades==='function') applyPermanentUpgrades(classId);

    // ── Re-apply and store town buffs ──
    G._townBuffs = [];
    townBuffs.forEach(b=>{
      b.apply();
      G._townBuffs.push({icon:b.icon, name:b.name, desc:b.desc});
    });
  }

  if(typeof G!=='undefined'&&G){
    G.runBossDefeated=[false,false,false,false,false,false,false,false];
    G._inTown=false;
    // ── Phase B: Roll zone modifiers for this run ──
    if(typeof rollZoneModifiers==='function') rollZoneModifiers();
  }
  if(typeof travelToZone==='function') travelToZone(0);
}
