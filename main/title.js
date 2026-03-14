const _title = (function(){
  let canvas, ctx, w, h, raf;
  let stars=[], embers=[], whisperLines=[];
  let awakened = false;
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

    drawStars();
    drawWhispers(dt);
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
  let _titleOnKey=null, _titleOnClick=null;
  function reset(){
    awakened = false;
    const screen = document.getElementById('screen-title');
    const prompt = document.getElementById('titlePrompt');
    const menu   = document.getElementById('titleMenu');
    if(screen) screen.classList.remove('awakened');
    if(prompt) prompt.classList.remove('hidden');
    if(menu) menu.classList.remove('revealed');
    // Remove old listeners to prevent leaks
    if(_titleOnKey) document.removeEventListener('keydown',_titleOnKey);
    if(_titleOnClick) document.removeEventListener('click',_titleOnClick);
    // Re-listen
    _titleOnKey = function(e){
      if(awakened) return;
      if(['Shift','Control','Alt','Meta','Tab'].includes(e.key)) return;
      awakened=true;
      document.removeEventListener('keydown',_titleOnKey);
      document.removeEventListener('click',_titleOnClick);
      revealMenu();
    };
    _titleOnClick = function(){
      if(awakened) return;
      if(!document.getElementById('screen-title')?.classList.contains('active')) return;
      awakened=true;
      document.removeEventListener('keydown',_titleOnKey);
      document.removeEventListener('click',_titleOnClick);
      revealMenu();
    };
    document.addEventListener('keydown',_titleOnKey);
    document.addEventListener('click',_titleOnClick);
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
