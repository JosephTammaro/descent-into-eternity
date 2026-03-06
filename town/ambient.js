
// ── Particles ─────────────────────────────────────────────
const _ptcls = [];
function _initPtcls(fx){ _ptcls.length=0; const n=fx==='fireflies'?20:fx==='mist'?8:28; for(let i=0;i<n;i++) _ptcls.push(_newPtcl(fx,true)); }
function _newPtcl(fx,rand=false){ const W=EXT_COLS*TILE,H=EXT_ROWS*TILE; const p={fx,x:Math.random()*W,life:Math.random()}; if(fx==='fireflies'){p.y=rand?Math.random()*H:H+2;p.vy=-(0.15+Math.random()*0.3);p.vx=(Math.random()-.5)*.25;p.r=1+Math.random();p.blink=Math.random()*6.28;} else if(fx==='ash'){p.y=rand?Math.random()*H:-2;p.vy=0.2+Math.random()*.35;p.vx=(Math.random()-.5)*.3;p.r=0.8+Math.random()*1.2;} else if(fx==='mist'){p.y=rand?Math.random()*H:H*.6+Math.random()*50;p.vy=-(0.04+Math.random()*.08);p.vx=(Math.random()-.5)*.12;p.r=20+Math.random()*35;p.a=0.03+Math.random()*.05;} else if(fx==='spores'){p.y=rand?Math.random()*H:H+2;p.vy=-(0.12+Math.random()*.2);p.vx=(Math.random()-.5)*.4;p.r=1+Math.random()*1.5;p.hue=180+Math.random()*120;} else if(fx==='embers'){p.y=rand?Math.random()*H:H+2;p.vy=-(0.4+Math.random()*.8);p.vx=(Math.random()-.5)*.7;p.r=0.8+Math.random()*1.5;} return p; }
function _stepPtcls(fx){ for(let i=_ptcls.length-1;i>=0;i--){ const p=_ptcls[i]; p.x+=p.vx; p.y+=p.vy; p.life+=0.005; if(p.life>1) _ptcls[i]=_newPtcl(fx); } }

// ══════════════════════════════════════════════════════════
//  AMBIENT LIFE SYSTEMS
// ══════════════════════════════════════════════════════════

// ── 1. Chimney Smoke ─────────────────────────────────────
const _smoke = [];
const _CHIMNEYS = [
  { bId:'tavern', ox:0.25, oy:0.0 },
  { bId:'tavern', ox:0.75, oy:0.0 },
  { bId:'forge',  ox:0.5,  oy:0.0, heavy:true },
  { bId:'study',  ox:0.35, oy:0.0 },
];
function _newSmokePuff(rand){
  const src=_CHIMNEYS[Math.floor(Math.random()*_CHIMNEYS.length)];
  const b=EXT_BUILDINGS.find(bb=>bb.id===src.bId);
  if(!b) return {x:0,y:0,life:2};
  const bx=b.tx*TILE+b.tw*TILE*src.ox;
  const by=b.ty*TILE;
  return {
    x:bx+(Math.random()-0.5)*3,
    y:rand? by-Math.random()*18 : by,
    vx:(Math.random()-0.5)*0.06,
    vy:-(0.06+Math.random()*0.1),
    r:src.heavy? 2.5+Math.random()*2 : 1.5+Math.random()*1.5,
    life:rand? Math.random() : 0,
    heavy:!!src.heavy,
  };
}
function _initSmoke(){ _smoke.length=0; for(let i=0;i<20;i++) _smoke.push(_newSmokePuff(true)); }
function _stepSmoke(){
  for(let i=_smoke.length-1;i>=0;i--){
    const s=_smoke[i];
    s.x+=s.vx; s.y+=s.vy;
    s.vx+=(Math.random()-0.5)*0.008;
    s.r+=0.012;
    s.life+=0.007;
    if(s.life>1) _smoke[i]=_newSmokePuff(false);
  }
}
function _drawSmoke(ctx,cx,cy){
  for(const s of _smoke){
    const px=s.x-cx, py=s.y-cy;
    if(px<-20||py<-20||px>_logW()+20||py>_logH()+20) continue;
    const fade=1-s.life;
    ctx.globalAlpha=fade*fade*(s.heavy?0.16:0.10);
    ctx.fillStyle=s.heavy?'#504030':'#908880';
    ctx.beginPath(); ctx.arc(px,py,s.r,0,6.28); ctx.fill();
  }
  ctx.globalAlpha=1;
}

// ── 2. Town Cat ──────────────────────────────────────────
const _cat = { wx:0, wy:0, facing:1, state:'sitting', timer:0, tx:0, ty:0, groomFrame:0, stuckCount:0, lastX:0, lastY:0 };
function _initCat(){
  _cat.wx=20*TILE; _cat.wy=24*TILE;
  _cat.state='sitting'; _cat.timer=80+Math.random()*160;
  _cat.facing=Math.floor(Math.random()*4);
  _cat.stuckCount=0; _cat.lastX=_cat.wx; _cat.lastY=_cat.wy;
}
function _catPickTarget(){
  // Pick a random walkable spot — try a few times to avoid buildings
  for(let attempt=0;attempt<8;attempt++){
    const cx=(6+Math.random()*44)*TILE;
    const cy=(10+Math.random()*34)*TILE;
    if(!_extBlocked(cx,cy)&&!_extBlocked(cx+4,cy+4)){ _cat.tx=cx; _cat.ty=cy; return; }
  }
  // Fallback: just go to a road tile
  _cat.tx=29*TILE; _cat.ty=(20+Math.random()*10)*TILE;
}
function _stepCat(){
  // Flee from player if close
  const pdx=_pl.wx-_cat.wx, pdy=_pl.wy-_cat.wy;
  if(Math.hypot(pdx,pdy)<TILE*2.5 && _cat.state!=='darting'){
    _cat.state='darting'; _cat.timer=50+Math.random()*30;
    _cat.stuckCount=0;
    const ang=Math.atan2(-pdy,-pdx)+(Math.random()-0.5)*0.8;
    const d=TILE*5+Math.random()*TILE*3;
    _cat.tx=Math.max(TILE*2,Math.min((EXT_COLS-3)*TILE, _cat.wx+Math.cos(ang)*d));
    _cat.ty=Math.max(TILE*2,Math.min((EXT_ROWS-3)*TILE, _cat.wy+Math.sin(ang)*d));
  }
  _cat.timer--;
  if(_cat.state==='sitting'){
    if(_cat.timer<=0){
      if(Math.random()<0.3){ _cat.state='grooming'; _cat.timer=60+Math.random()*80; _cat.groomFrame=0; }
      else { _cat.state='walking'; _cat.timer=100+Math.random()*120; _cat.stuckCount=0; _catPickTarget(); }
    }
  } else if(_cat.state==='grooming'){
    _cat.groomFrame++;
    if(_cat.timer<=0){ _cat.state='sitting'; _cat.timer=100+Math.random()*200; }
  } else { // walking or darting
    const spd=_cat.state==='darting'?1.2:0.25;
    const dx=_cat.tx-_cat.wx, dy=_cat.ty-_cat.wy;
    const dist=Math.hypot(dx,dy);
    if(dist>2){
      const nx=_cat.wx+dx/dist*spd, ny=_cat.wy+dy/dist*spd;
      if(!_extBlocked(nx,_cat.wy)&&!_extBlocked(nx+4,_cat.wy+4)) _cat.wx=nx;
      if(!_extBlocked(_cat.wx,ny)&&!_extBlocked(_cat.wx+4,ny+4)) _cat.wy=ny;
      if(Math.abs(dx)>Math.abs(dy)) _cat.facing=dx>0?1:3;
      else _cat.facing=dy>0?2:0;
    }
    // Stuck detection — if barely moved in 20 frames, pick new target or sit
    if(_cat.timer%20===0){
      const moved=Math.hypot(_cat.wx-_cat.lastX, _cat.wy-_cat.lastY);
      if(moved<2){ _cat.stuckCount++;
        if(_cat.stuckCount>=2){ _cat.state='sitting'; _cat.timer=40+Math.random()*80; _cat.stuckCount=0; }
        else { _catPickTarget(); }
      } else { _cat.stuckCount=0; }
      _cat.lastX=_cat.wx; _cat.lastY=_cat.wy;
    }
    if(dist<=3||_cat.timer<=0){ _cat.state='sitting'; _cat.timer=80+Math.random()*200; _cat.stuckCount=0; }
  }
}
function _drawCat(ctx,cx,cy){
  const sx=Math.round(_cat.wx-cx), sy=Math.round(_cat.wy-cy);
  if(sx<-TILE||sy<-TILE||sx>_logW()+TILE||sy>_logH()+TILE) return;
  const t=Date.now()*0.005;
  const darting=_cat.state==='darting', walking=_cat.state==='walking', grooming=_cat.state==='grooming';
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(sx,sy+5,3,1.2,0,0,6.28); ctx.fill();
  const body='#c08030', dark='#805020';
  if(darting||walking){
    const leg=Math.sin(t*(darting?6:3));
    ctx.fillStyle=body; ctx.fillRect(sx-4,sy-2,8,4);
    ctx.fillStyle=dark;
    ctx.fillRect(sx-3,sy+1+leg,2,3); ctx.fillRect(sx+2,sy+1-leg,2,3);
    ctx.fillStyle=body;
    const tw=Math.sin(t*4)*2;
    ctx.fillRect(sx+4,sy-3+tw,1,3); ctx.fillRect(sx+5,sy-4+tw,1,2);
  } else {
    ctx.fillStyle=body; ctx.fillRect(sx-3,sy-1,6,4);
    ctx.fillRect(sx-3,sy+2,2,2); ctx.fillRect(sx+2,sy+2,2,2);
    ctx.fillStyle=dark;
    const tw=Math.sin(t*1.5)*0.8;
    ctx.fillRect(sx+3,sy,1,3); ctx.fillRect(sx+4,sy+1+tw,1,2);
    if(grooming && Math.floor(_cat.groomFrame/15)%2===0){
      ctx.fillStyle=body; ctx.fillRect(sx-2,sy+0,4,3); return;
    }
  }
  // Head
  ctx.fillStyle=body; ctx.fillRect(sx-2,sy-4,5,3);
  ctx.fillStyle=dark; ctx.fillRect(sx-2,sy-5,2,2); ctx.fillRect(sx+2,sy-5,2,2);
  ctx.fillStyle='#e0a0a0'; ctx.fillRect(sx-1,sy-5,1,1); ctx.fillRect(sx+2,sy-5,1,1);
  ctx.fillStyle='#40c040'; ctx.fillRect(sx-1,sy-3,1,1); ctx.fillRect(sx+2,sy-3,1,1);
}

// ── 3. Birds Overhead ────────────────────────────────────
const _flocks = [];
let _flockState = 0;
function _newFlock(rand){
  const W=EXT_COLS*TILE;
  const fromLeft=Math.random()<0.5;
  const bx=rand?Math.random()*W:fromLeft?-20:W+20;
  const by=TILE*2+Math.random()*TILE*8;
  const vx=fromLeft?(0.3+Math.random()*0.4):-(0.3+Math.random()*0.4);
  const birds=[];
  for(let i=0,n=3+Math.floor(Math.random()*3);i<n;i++){
    birds.push({ ox:(Math.random()-0.5)*12, oy:(Math.random()-0.5)*6, phase:Math.random()*6.28 });
  }
  return { x:bx, y:by, vx, vy:(Math.random()-0.5)*0.05, birds, life:0 };
}
function _initBirds(ts){
  _flocks.length=0; _flockState=ts;
  const max=ts>=4?0:ts>=3?1:ts>=2?2:3;
  for(let i=0;i<max;i++) _flocks.push(_newFlock(true));
}
function _stepBirds(){
  const W=EXT_COLS*TILE;
  const max=_flockState>=4?0:_flockState>=3?1:_flockState>=2?2:3;
  for(let i=_flocks.length-1;i>=0;i--){
    const f=_flocks[i]; f.x+=f.vx; f.y+=f.vy; f.life+=0.001;
    if((f.vx>0&&f.x>W+40)||(f.vx<0&&f.x<-40)||f.life>1){
      if(_flocks.length<=max) _flocks[i]=_newFlock(false);
      else _flocks.splice(i,1);
    }
  }
}
function _drawBirds(ctx,cx,cy){
  const t=Date.now()*0.004;
  for(const f of _flocks){
    for(const b of f.birds){
      const bx=f.x+b.ox-cx, by=f.y+b.oy-cy;
      if(bx<-10||by<-10||bx>_logW()+10||by>_logH()+10) continue;
      const w=Math.sin(t*2+b.phase)*1.5;
      ctx.globalAlpha=0.55;
      ctx.fillStyle='#1a1008';
      ctx.fillRect(bx-2,by+w*0.5,2,1); ctx.fillRect(bx,by,1,1); ctx.fillRect(bx+1,by+w*0.5,2,1);
    }
  }
  ctx.globalAlpha=1;
}

// ── 4. Water Ripples ─────────────────────────────────────
const _ripples = [];
let _rippleTimer = 0;
let _waterTiles = null;
function _initRipples(){
  _ripples.length=0; _rippleTimer=0;
  if(!_waterTiles){
    _waterTiles=[];
    for(let r=0;r<EXT_ROWS;r++) for(let c=0;c<EXT_COLS;c++){
      if(EXT_MAP[r][c]===2) _waterTiles.push({r,c});
    }
  }
}
function _stepRipples(){
  _rippleTimer++;
  if(_rippleTimer>50+Math.random()*70 && _waterTiles && _waterTiles.length>0){
    _rippleTimer=0;
    const wt=_waterTiles[Math.floor(Math.random()*_waterTiles.length)];
    _ripples.push({
      x:wt.c*TILE+TILE/2+(Math.random()-0.5)*6,
      y:wt.r*TILE+TILE/2+(Math.random()-0.5)*6,
      r:0, maxR:5+Math.random()*4, life:0,
    });
  }
  for(let i=_ripples.length-1;i>=0;i--){
    const rp=_ripples[i];
    rp.life+=0.018; rp.r=rp.maxR*rp.life;
    if(rp.life>=1) _ripples.splice(i,1);
  }
}
function _drawRipples(ctx,cx,cy){
  for(const rp of _ripples){
    const px=rp.x-cx, py=rp.y-cy;
    if(px<-20||py<-20||px>_logW()+20||py>_logH()+20) continue;
    const alpha=0.2*(1-rp.life);
    ctx.strokeStyle=`rgba(150,200,255,${alpha})`;
    ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.arc(px,py,rp.r,0,6.28); ctx.stroke();
  }
}

// ── 5. NPC Proximity Reactions ───────────────────────────
const _PROX_DIST = TILE*2;
const _PROX_TIME = 120;
function _checkProximity(){
  for(let i=0;i<_wanderers.length;i++){
    const a=_wanderers[i];
    if(a.stationary||a.talking||a._proxPause) continue;
    for(let j=i+1;j<_wanderers.length;j++){
      const b=_wanderers[j];
      if(b.stationary||b.talking||b._proxPause) continue;
      const d=Math.hypot(a.wx-b.wx, a.wy-b.wy);
      if(d<_PROX_DIST && d>4){
        const ang=Math.atan2(b.wy-a.wy, b.wx-a.wx);
        a._proxPause=_PROX_TIME+Math.floor(Math.random()*40);
        b._proxPause=a._proxPause;
        if(Math.abs(Math.cos(ang))>Math.abs(Math.sin(ang))){
          a.facing=Math.cos(ang)>0?1:3; b.facing=Math.cos(ang)>0?3:1;
        } else {
          a.facing=Math.sin(ang)>0?2:0; b.facing=Math.sin(ang)>0?0:2;
        }
      }
    }
  }
}

// ── Master init / step ───────────────────────────────────
function _initAmbient(townState){
  _initSmoke(); _initCat(); _initBirds(townState); _initRipples();
}
function _stepAmbient(){
  if(_tScene!=='exterior') return;
  _stepSmoke(); _stepCat(); _stepBirds(); _stepRipples();
}

// ══════════════════════════════════════════════════════════
//  MINIMAP
// ══════════════════════════════════════════════════════════
let _minimapExpanded = false;
const _MM_SMALL = 1;    // 1px per tile → 60×48
const _MM_BIG   = 2.5;  // 2.5px per tile → 150×120
const _MM_PAD   = 3;
const _MM_BLDG_COLS = {
  gate:'#8b1a1a', tavern:'#6a4020', inn:'#6a4020', forge:'#c06020',
  study:'#4a2860', temple:'#b0a060', market:'#4a7040', store:'#4a7040',
  proving:'#907040', graveyard:'#3a3030', noticeboard:'#7a6a40',
  house1:'#504030',house2:'#504030',house3:'#504030',house4:'#504030',
  house5:'#504030',house6:'#504030',house7:'#504030',house8:'#504030',house9:'#504030',
};
const _MM_LABELS = {
  gate:'Gate', tavern:'Tavern', inn:'Inn', forge:'Forge',
  study:'Study', temple:'Shrine', market:'Market', store:'Shop',
  proving:'Proving', graveyard:'Graves',
};

function _drawMinimap(ctx){
  if(_tScene!=='exterior') return;
  const exp=_minimapExpanded;
  const scale=exp?_MM_BIG:_MM_SMALL;
  const mw=EXT_COLS*scale, mh=EXT_ROWS*scale;
  const W=_logW();
  const mx=W-mw-_MM_PAD;
  const my=13;

  // Background + border
  ctx.fillStyle=exp?'rgba(0,0,0,0.7)':'rgba(0,0,0,0.5)';
  ctx.fillRect(mx-2,my-2,mw+4,mh+4);
  ctx.strokeStyle='rgba(200,168,75,0.3)';
  ctx.lineWidth=0.5;
  ctx.strokeRect(mx-2,my-2,mw+4,mh+4);

  // Terrain — batch by tile type for fewer state changes
  const cols=['#5a4a30','#2a5070','#1a1008',null,'#3a4a20'];
  const tileMap=[null,0,1,2,null,4]; // EXT_MAP value → cols index
  for(let r=0;r<EXT_ROWS;r++){
    for(let c=0;c<EXT_COLS;c++){
      const t=EXT_MAP[r][c];
      const ci=tileMap[t];
      if(ci==null) continue;
      const col=cols[ci];
      if(!col) continue;
      ctx.fillStyle=col;
      ctx.fillRect(mx+c*scale, my+r*scale, scale, scale);
    }
  }

  // Buildings
  for(const b of EXT_BUILDINGS){
    ctx.fillStyle=_MM_BLDG_COLS[b.id]||'#504030';
    ctx.fillRect(mx+b.tx*scale, my+b.ty*scale, b.tw*scale, b.th*scale);
    ctx.strokeStyle='rgba(255,255,255,0.08)';
    ctx.lineWidth=0.3;
    ctx.strokeRect(mx+b.tx*scale, my+b.ty*scale, b.tw*scale, b.th*scale);
    // Labels — expanded only
    if(exp){
      const label=_MM_LABELS[b.id];
      if(label){
        ctx.font='3px "Press Start 2P",monospace';
        ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillStyle='rgba(220,200,150,0.65)';
        ctx.fillText(label, mx+(b.tx+b.tw/2)*scale, my+(b.ty+b.th)*scale+1);
      }
    }
  }

  // NPC dots
  const dr=exp?1.5:0.7;
  for(const w of _wanderers){
    ctx.fillStyle=w.color||'#808080';
    const dx2=mx+w.wx/TILE*scale, dy2=my+w.wy/TILE*scale;
    ctx.fillRect(dx2-dr,dy2-dr,dr*2,dr*2);
  }

  // Cat
  if(_cat.wx>0){
    ctx.fillStyle='#c08030';
    const cr=exp?1.2:0.6;
    ctx.fillRect(mx+_cat.wx/TILE*scale-cr, my+_cat.wy/TILE*scale-cr, cr*2, cr*2);
  }

  // Player — pulsing gold blip
  const pulse=0.6+0.4*Math.sin(Date.now()*0.005);
  const pr=exp?2.5:1.5;
  const px2=mx+_pl.wx/TILE*scale, py2=my+_pl.wy/TILE*scale;
  // Glow
  ctx.fillStyle=`rgba(255,216,80,${pulse*0.25})`;
  ctx.fillRect(px2-pr-1,py2-pr-1,pr*2+2,pr*2+2);
  // Core
  ctx.fillStyle=`rgba(255,216,80,${pulse})`;
  ctx.fillRect(px2-pr,py2-pr,pr*2,pr*2);

  // Hint text
  ctx.font='3px "Press Start 2P",monospace';
  ctx.textAlign='right'; ctx.textBaseline='top';
  ctx.fillStyle='rgba(180,160,100,0.35)';
  ctx.fillText(exp?'M to close':'M', mx+mw, my+mh+2);
}

