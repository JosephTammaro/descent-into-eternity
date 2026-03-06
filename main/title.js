const _title = (function(){
  let canvas, ctx, w, h, raf;
  let stars=[], embers=[], whisperLines=[];
  let awakened = false;
  let gateGlow = 0;
  let time = 0;

  // ── Stars ──
  function initStars(){
    stars=[];
    for(let i=0;i<160;i++){
      stars.push({
        x:Math.random()*w, y:Math.random()*h,
        r:Math.random()<0.12 ? 1.5 : (Math.random()<0.3 ? 0.8 : 0.4),
        speed:0.3+Math.random()*0.7,
        phase:Math.random()*Math.PI*2,
        bright:0.15+Math.random()*0.5
      });
    }
  }

  function drawStars(){
    for(const s of stars){
      const flicker = s.bright + Math.sin(time*s.speed + s.phase)*0.35;
      ctx.globalAlpha = Math.max(0.05, Math.min(1, flicker));
      ctx.fillStyle = '#c8a84b';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // ── Embers (float upward) ──
  function initEmbers(){
    embers=[];
    for(let i=0;i<40;i++){
      embers.push(newEmber(true));
    }
  }
  function newEmber(scatter){
    return {
      x: w*0.3 + Math.random()*w*0.4,
      y: scatter ? Math.random()*h : h+10,
      vx: (Math.random()-0.5)*0.15,
      vy: -(0.2+Math.random()*0.5),
      r: 0.4+Math.random()*1.2,
      life: 0.5+Math.random()*0.5,
      maxLife: 0.5+Math.random()*0.5,
      color: Math.random()<0.6 ? '#c8a84b' : '#c06030'
    };
  }
  function drawEmbers(dt){
    for(let i=0;i<embers.length;i++){
      const e=embers[i];
      e.x += e.vx + Math.sin(time*2+i)*0.1;
      e.y += e.vy;
      e.life -= dt*0.3;
      if(e.life<=0 || e.y<-20){
        embers[i]=newEmber(false);
        continue;
      }
      const alpha = (e.life/e.maxLife)*0.7;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = e.color;
      // Soft glow
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.shadowBlur=0;
  }

  // ── Helpers for stone/ruin drawing ──
  function _stoneBlocks(sx, sy, sw, sh, s){
    ctx.fillStyle = '#3a2d50';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = '#1e1630';
    const bw = 20*s, bh = 11*s;
    for(let row = 0; row * bh < sh + bh; row++){
      const off = (row % 2 === 0) ? 0 : bw * 0.5;
      ctx.fillRect(sx, sy + row * bh, sw, 1.5*s); // mortar row
      for(let col = -1; col * bw < sw + bw; col++){
        ctx.fillRect(sx + col * bw + off, sy, 1.5*s, sh); // mortar col
      }
    }
  }

  function _deadTree(tx, ty, s, flip){
    const f = flip ? -1 : 1;
    ctx.fillStyle = '#2a1e3c';
    ctx.fillRect(tx - 3*s, ty - 36*s, 5*s, 36*s);
    ctx.fillRect(tx + f*3*s, ty - 28*s, f*16*s, 3*s);
    ctx.fillRect(tx - f*3*s, ty - 21*s, -f*11*s, 3*s);
    ctx.fillRect(tx + f*17*s, ty - 28*s, f*2*s, -8*s);
    ctx.fillRect(tx + f*17*s, ty - 28*s, f*7*s, 2*s);
    ctx.fillRect(tx - f*12*s, ty - 21*s, -f*5*s, -6*s);
    ctx.fillRect(tx + f*3*s, ty - 16*s, f*9*s, 2*s);
    ctx.fillRect(tx + f*10*s, ty - 16*s, f*2*s, -6*s);
  }

  // ── Crumbling ruins & dungeon approach ──
  function drawMountains(){
    const baseY = h * 0.72;
    const s = Math.min(w, h) / 680;

    // Ground fill
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#16102a';
    ctx.fillRect(0, baseY, w, h - baseY);

    // Cobblestone rows
    const cbw = 24*s, cbh = 9*s;
    for(let row = 0; row < 6; row++){
      const ry = baseY + row * cbh;
      const off = (row % 2 === 0) ? 0 : cbw * 0.5;
      ctx.fillStyle = row % 2 === 0 ? '#241a38' : '#1c1430';
      ctx.globalAlpha = 0.7;
      for(let c = -1; c * cbw < w + cbw; c++){
        ctx.fillRect(c * cbw + off + 1, ry + 1, cbw - 2, cbh - 2);
      }
    }

    // ── Left: crumbling tower ──
    ctx.globalAlpha = 1;
    const lw = 58*s, lh = 95*s;
    _stoneBlocks(0, baseY - lh, lw, lh, s);
    _stoneBlocks(0, baseY - lh - 22*s, 36*s, 22*s, s);
    _stoneBlocks(0, baseY - lh - 34*s, 20*s, 12*s, s);
    _stoneBlocks(42*s, baseY - lh - 9*s, 12*s, 9*s, s);
    // Rubble
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = '#2e2244';
    ctx.fillRect(lw + 3*s, baseY - 5*s, 10*s, 5*s);
    ctx.fillRect(lw + 16*s, baseY - 3*s, 7*s, 3*s);
    ctx.fillRect(lw + 26*s, baseY - 4*s, 5*s, 4*s);

    // ── Left dead tree ──
    ctx.globalAlpha = 0.8;
    _deadTree(w * 0.18, baseY, s * 2.5, false);

    // ── Right: crumbling wall ──
    ctx.globalAlpha = 1;
    const rw = 62*s, rh = 72*s;
    _stoneBlocks(w - rw, baseY - rh, rw, rh, s);
    _stoneBlocks(w - rw, baseY - rh - 26*s, 38*s, 26*s, s);
    _stoneBlocks(w - rw, baseY - rh - 38*s, 21*s, 12*s, s);
    _stoneBlocks(w - 27*s, baseY - rh - 14*s, 27*s, 14*s, s);
    // Rubble
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = '#2e2244';
    ctx.fillRect(w - rw - 15*s, baseY - 4*s, 8*s, 4*s);
    ctx.fillRect(w - rw - 25*s, baseY - 2*s, 6*s, 2*s);

    // ── Right dead tree ──
    ctx.globalAlpha = 0.8;
    _deadTree(w * 0.82, baseY, s * 2.5, true);
    ctx.globalAlpha = 1;
  }

  // ── Gate silhouette ──
  function drawGate(){
    const gx = w/2;
    const gy = h*0.72;      // matches ground level
    const s  = Math.min(w,h) / 560;
    const pw  = 26*s;       // pillar width
    const gap = 72*s;       // inner opening
    const ph  = 170*s;      // pillar height
    const lx  = gx - gap/2 - pw;
    const rx  = gx + gap/2;
    const archCy = gy - ph; // top of pillars = arch centre
    const outerR = gap/2 + pw;
    const innerR = gap/2;

    // ── Void darkness seeping outward ──
    const vp = 0.10 + Math.sin(time*0.7)*0.03;
    const voidGrad = ctx.createRadialGradient(gx, archCy + ph*0.3, 0, gx, archCy + ph*0.3, gap*2.2);
    voidGrad.addColorStop(0,   `rgba(6,2,18,${vp*3})`);
    voidGrad.addColorStop(0.35,`rgba(14,6,34,${vp*1.4})`);
    voidGrad.addColorStop(0.7, `rgba(20,10,44,${vp*0.5})`);
    voidGrad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = voidGrad;
    ctx.fillRect(gx - gap*2.2, archCy - gap*2.2, gap*4.4, gap*4.4);

    // ── Stone steps (3 steps) ──
    ctx.globalAlpha = 1;
    for(let i = 0; i < 3; i++){
      const sw = (pw*2 + gap) + (3 - i) * 18*s;
      _stoneBlocks(gx - sw/2, gy - i*5*s, sw, 5*s, s);
    }

    // ── Left & right pillars ──
    _stoneBlocks(lx, archCy, pw, ph, s);
    _stoneBlocks(rx, archCy, pw, ph, s);

    // ── Stone arch (filled ring segment, top half) ──
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#3a2d50';
    ctx.beginPath();
    ctx.arc(gx, archCy, outerR, Math.PI, 0);
    ctx.arc(gx, archCy, innerR, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();

    // Arch block mortar lines (radial)
    ctx.strokeStyle = '#1e1630';
    ctx.lineWidth = 1*s;
    ctx.globalAlpha = 0.9;
    for(let i = 0; i <= 9; i++){
      const angle = Math.PI + (i / 9) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(gx + Math.cos(angle)*innerR, archCy + Math.sin(angle)*innerR);
      ctx.lineTo(gx + Math.cos(angle)*outerR, archCy + Math.sin(angle)*outerR);
      ctx.stroke();
    }

    // Keystone block at crown
    ctx.globalAlpha = 1;
    _stoneBlocks(gx - pw*0.55, archCy - outerR - 6*s, pw*1.1, 6*s, s);

    // ── Absolute darkness inside ──
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#020109';
    ctx.beginPath();
    ctx.arc(gx, archCy, innerR - 0.5, Math.PI, 0);
    ctx.lineTo(rx, gy - 15*s); // step top
    ctx.lineTo(lx + pw, gy - 15*s);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(lx + pw, archCy, gap, ph - 15*s);

    // Faint void gradient inside (depth illusion)
    ctx.globalAlpha = 0.55 + Math.sin(time*0.5)*0.06;
    const innerDark = ctx.createRadialGradient(gx, archCy + ph*0.4, 0, gx, archCy, innerR);
    innerDark.addColorStop(0, 'rgba(2,1,9,1)');
    innerDark.addColorStop(1, 'rgba(8,4,22,0.2)');
    ctx.fillStyle = innerDark;
    ctx.fillRect(lx + pw, archCy, gap, ph);

    // Very faint gold trace on inner arch edge
    ctx.globalAlpha = 0.025 + Math.sin(time*0.8)*0.01;
    ctx.strokeStyle = '#c8a84b';
    ctx.lineWidth = 1.5*s;
    ctx.beginPath();
    ctx.arc(gx, archCy, innerR - 1, Math.PI, 0);
    ctx.stroke();

    // Ground shadow
    ctx.globalAlpha = 0.5;
    const gGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gap*2);
    gGrad.addColorStop(0, 'rgba(2,1,9,0.9)');
    gGrad.addColorStop(1, 'rgba(2,1,9,0)');
    ctx.fillStyle = gGrad;
    ctx.fillRect(gx - gap*2, gy, gap*4, gap*0.5);
    ctx.globalAlpha = 1;
  }

  // ── Lore whispers (faint scrolling text in background) ──
  const WHISPER_TEXTS = [
    'the seal holds', 'remember your name', 'the gate waits',
    'three hundred years', 'the unnamed calls', 'return to the deep',
    'elderfen remembers', 'the descent is a homecoming',
    'the lock is a name', 'the dark is patient',
    'they stayed because you asked', 'the shrine burns without oil',
    'finish it', 'the unnamed loved you'
  ];
  function initWhispers(){
    whisperLines=[];
    for(let i=0;i<8;i++){
      whisperLines.push({
        text: WHISPER_TEXTS[Math.floor(Math.random()*WHISPER_TEXTS.length)],
        x: Math.random()*w,
        y: Math.random()*h,
        vy: -(0.08+Math.random()*0.12),
        alpha: 0.01+Math.random()*0.025,
        size: 8+Math.random()*6
      });
    }
  }
  function drawWhispers(dt){
    ctx.textAlign='center';
    for(const wh of whisperLines){
      wh.y += wh.vy;
      if(wh.y < -30){
        wh.y = h+30;
        wh.x = Math.random()*w;
        wh.text = WHISPER_TEXTS[Math.floor(Math.random()*WHISPER_TEXTS.length)];
      }
      ctx.globalAlpha = wh.alpha;
      ctx.fillStyle = '#c8a84b';
      ctx.font = `${wh.size}px "Press Start 2P", monospace`;
      ctx.fillText(wh.text, wh.x, wh.y);
    }
  }

  // ── Ground fog at bottom ──
  function drawGroundFog(){
    const fogH = h*0.2;
    const grad = ctx.createLinearGradient(0, h-fogH, 0, h);
    grad.addColorStop(0, 'rgba(4,2,10,0)');
    grad.addColorStop(0.5, `rgba(20,14,10,${0.15+Math.sin(time*0.5)*0.05})`);
    grad.addColorStop(1, `rgba(30,20,14,${0.25+Math.sin(time*0.7)*0.08})`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(0, h-fogH, w, fogH);
  }

  // ── Main render loop ──
  let lastTime = 0;
  function render(ts){
    const dt = Math.min((ts-lastTime)/1000, 0.05);
    lastTime = ts;
    time = ts/1000;

    ctx.clearRect(0,0,w,h);

    // Background gradient
    const bg = ctx.createRadialGradient(w/2, h*0.4, 0, w/2, h*0.5, Math.max(w,h)*0.8);
    bg.addColorStop(0, '#1a100a');
    bg.addColorStop(0.5, '#0a0608');
    bg.addColorStop(1, '#04020a');
    ctx.globalAlpha=1;
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,w,h);

    drawStars();
    drawWhispers(dt);
    drawMountains();
    drawGate();
    drawEmbers(dt);
    drawGroundFog();

    ctx.globalAlpha=1;
    raf = requestAnimationFrame(render);
  }

  // ── Resize ──
  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    w = canvas.width;
    h = canvas.height;
    initStars();
    initWhispers();
  }

  // ── Init ──
  function init(){
    canvas = document.getElementById('titleCanvas');
    if(!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    initEmbers();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(render);

    // Press-any-key ritual
    function onFirstKey(e){
      if(awakened) return;
      // Ignore if it's a modifier key alone
      if(['Shift','Control','Alt','Meta','Tab'].includes(e.key)) return;
      awakened = true;
      document.removeEventListener('keydown', onFirstKey);
      document.removeEventListener('click', onFirstClick);
      revealMenu();
    }
    function onFirstClick(e){
      if(awakened) return;
      // Only trigger on the title screen
      if(!document.getElementById('screen-title')?.classList.contains('active')) return;
      awakened = true;
      document.removeEventListener('keydown', onFirstKey);
      document.removeEventListener('click', onFirstClick);
      revealMenu();
    }
    document.addEventListener('keydown', onFirstKey);
    document.addEventListener('click', onFirstClick);
  }

  function revealMenu(){
    // Start audio on first interaction
    if(typeof AUDIO!=='undefined') { AUDIO.init(); AUDIO.playBGM('title'); }

    const screen = document.getElementById('screen-title');
    const prompt = document.getElementById('titlePrompt');
    const menu   = document.getElementById('titleMenu');

    if(screen) screen.classList.add('awakened');
    if(prompt) prompt.classList.add('hidden');
    setTimeout(()=>{
      if(menu) menu.classList.add('revealed');
    }, 300);
  }

  function stop(){
    if(raf) cancelAnimationFrame(raf);
  }

  // Reset when returning to title
  function reset(){
    awakened = false;
    const screen = document.getElementById('screen-title');
    const prompt = document.getElementById('titlePrompt');
    const menu   = document.getElementById('titleMenu');
    if(screen) screen.classList.remove('awakened');
    if(prompt) prompt.classList.remove('hidden');
    if(menu) menu.classList.remove('revealed');
    // Re-listen
    function onKey(e){
      if(awakened) return;
      if(['Shift','Control','Alt','Meta','Tab'].includes(e.key)) return;
      awakened=true;
      document.removeEventListener('keydown',onKey);
      document.removeEventListener('click',onClick);
      revealMenu();
    }
    function onClick(){
      if(awakened) return;
      if(!document.getElementById('screen-title')?.classList.contains('active')) return;
      awakened=true;
      document.removeEventListener('keydown',onKey);
      document.removeEventListener('click',onClick);
      revealMenu();
    }
    document.addEventListener('keydown',onKey);
    document.addEventListener('click',onClick);
    if(!raf) raf=requestAnimationFrame(render);
  }

  return { init, stop, reset, revealMenu };
})();

// Init on load
_title.init();

// Reset title state when returning to title screen (e.g. quit to title)
(function(){
  const el = document.getElementById('screen-title');
  if(!el) return;
  let wasActive = el.classList.contains('active');
  const obs = new MutationObserver(()=>{
    const isActive = el.classList.contains('active');
    // Only reset on transition from inactive → active (returning to title)
    if(isActive && !wasActive){
      _title.reset();
    }
    wasActive = isActive;
  });
  obs.observe(el, {attributes:true, attributeFilter:['class']});
})();

function beginDescent(){ showScreen('saveSlots'); }
