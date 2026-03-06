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

  // ── Distant mountain silhouette ──
  function drawMountains(){
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#08050e';
    const baseY = h * 0.7;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    // Left range
    ctx.lineTo(w*0.05, baseY - h*0.08);
    ctx.lineTo(w*0.12, baseY - h*0.18);
    ctx.lineTo(w*0.2, baseY - h*0.12);
    ctx.lineTo(w*0.28, baseY - h*0.22);
    ctx.lineTo(w*0.35, baseY - h*0.15);
    // Center peak (behind gate)
    ctx.lineTo(w*0.42, baseY - h*0.2);
    ctx.lineTo(w*0.5, baseY - h*0.28);
    ctx.lineTo(w*0.58, baseY - h*0.2);
    // Right range
    ctx.lineTo(w*0.65, baseY - h*0.15);
    ctx.lineTo(w*0.72, baseY - h*0.22);
    ctx.lineTo(w*0.8, baseY - h*0.12);
    ctx.lineTo(w*0.88, baseY - h*0.18);
    ctx.lineTo(w*0.95, baseY - h*0.08);
    ctx.lineTo(w, baseY);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Lighter ridge in front
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#0c0812';
    ctx.beginPath();
    ctx.moveTo(0, baseY + h*0.05);
    ctx.lineTo(w*0.1, baseY - h*0.04);
    ctx.lineTo(w*0.22, baseY + h*0.02);
    ctx.lineTo(w*0.35, baseY - h*0.06);
    ctx.lineTo(w*0.45, baseY);
    ctx.lineTo(w*0.55, baseY);
    ctx.lineTo(w*0.65, baseY - h*0.06);
    ctx.lineTo(w*0.78, baseY + h*0.02);
    ctx.lineTo(w*0.9, baseY - h*0.04);
    ctx.lineTo(w, baseY + h*0.05);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  }

  // ── Gate silhouette ──
  function drawGate(){
    const gx = w/2;
    const gy = h*0.62;
    const scale = Math.min(w,h) / 800;
    const pw = 18*scale;  // pillar width
    const gap = 50*scale; // gap between pillars
    const ph = 130*scale; // pillar height
    const archH = 30*scale;

    // Glow from within the archway
    const glowPulse = 0.25 + Math.sin(time*1.2)*0.12;
    const glowR = gap*1.8;
    const grad = ctx.createRadialGradient(gx, gy-ph*0.15, 0, gx, gy-ph*0.15, glowR);
    grad.addColorStop(0, `rgba(139,26,26,${glowPulse*0.5})`);
    grad.addColorStop(0.3, `rgba(200,96,30,${glowPulse*0.15})`);
    grad.addColorStop(0.6, `rgba(200,168,75,${glowPulse*0.04})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(gx-glowR, gy-ph-glowR, glowR*2, glowR*2);

    // Draw the solid gate shape as one path
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#06030a';

    // Left pillar
    const lx = gx - gap/2 - pw;
    const rx = gx + gap/2;
    ctx.fillRect(lx, gy-ph, pw, ph);
    ctx.fillRect(rx, gy-ph, pw, ph);

    // Crossbar at top
    ctx.fillRect(lx-pw*0.3, gy-ph-archH*0.4, (rx+pw) - (lx-pw*0.3) + pw*0.3, archH*0.6);
    // Capstone
    ctx.fillRect(lx-pw*0.15, gy-ph-archH*0.4-archH*0.25, (rx+pw)-(lx-pw*0.15)+pw*0.15, archH*0.25);

    // Arch (semicircle) carved into the crossbar — draw with dark fill from inside
    // Actually, just draw the archway opening as a subtle glow shape
    ctx.globalAlpha = 0.08 + Math.sin(time*1.0)*0.04;
    ctx.fillStyle = '#8b1a1a';
    ctx.beginPath();
    ctx.ellipse(gx, gy-ph+archH*0.3, gap/2-2*scale, archH*1.2, 0, Math.PI, 0);
    ctx.lineTo(gx+gap/2-2*scale, gy);
    ctx.lineTo(gx-gap/2+2*scale, gy);
    ctx.closePath();
    ctx.fill();

    // Small highlights on pillar edges
    ctx.globalAlpha = 0.04 + Math.sin(time*0.7)*0.02;
    ctx.fillStyle = '#c8a84b';
    ctx.fillRect(lx+pw-1*scale, gy-ph+10*scale, 1*scale, ph-20*scale);
    ctx.fillRect(rx, gy-ph+10*scale, 1*scale, ph-20*scale);

    // Ground shadow beneath gate
    ctx.globalAlpha = 0.3;
    const groundGrad = ctx.createRadialGradient(gx, gy+5*scale, 0, gx, gy+5*scale, gap*1.5);
    groundGrad.addColorStop(0, 'rgba(4,2,10,0.8)');
    groundGrad.addColorStop(1, 'rgba(4,2,10,0)');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(gx-gap*1.5, gy, gap*3, gap*0.8);
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
