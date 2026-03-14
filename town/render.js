// ── Collision ─────────────────────────────────────────────
function _extBlocked(wx,wy){
  const tc=Math.floor(wx/TILE), tr=Math.floor(wy/TILE);
  if(tc<0||tr<0||tc>=EXT_COLS||tr>=EXT_ROWS) return true;
  if(EXT_MAP[tr][tc]===3) return true;
  for(const b of EXT_BUILDINGS){
    if(b.id==='noticeboard') continue;
    if(b.id==='gate'){
      if(tc>=b.tx&&tc<b.tx+b.tw&&tr>=b.ty&&tr<b.ty+b.th){
        if(tc===b.doorTx||tc===b.doorTx+1) return false;
        return true;
      }
      continue;
    }
    if(b.id==='graveyard'){
      // Stone walls are 1 tile thick on all four sides — block unless in gate gap
      const inX = tc>=b.tx && tc<b.tx+b.tw;
      const inY = tr>=b.ty && tr<b.ty+b.th;
      if(!inX||!inY) continue;
      const onTopWall    = tr===b.ty;
      const onBottomWall = tr===b.ty+b.th-1;
      const onLeftWall   = tc===b.tx;
      const onRightWall  = tc===b.tx+b.tw-1;
      if(onTopWall||onLeftWall||onRightWall) return true;
      if(onBottomWall){
        // gate gap = doorTx and doorTx+1
        if(tc===b.doorTx||tc===b.doorTx+1) return false;
        return true;
      }
      continue; // interior of graveyard is walkable
    }
    if(tc>=b.tx&&tc<b.tx+b.tw&&tr>=b.ty&&tr<b.ty+b.th){
      if(tc===b.doorTx&&tr===b.doorTy) return false;
      return true;
    }
  }
  for(const d of EXT_DECORS){
    if((d.type==='tree'||d.type==='well')&&tc===d.tx&&tr===d.ty) return true;
  }
  return false;
}

function _intBlocked(map,wx,wy){
  const tc=Math.floor(wx/TILE), tr=Math.floor(wy/TILE);
  if(tc<0||tr<0||tc>=INT_W||tr>=INT_H) return true;
  const t=map[tr][tc];
  // Only hard walls (1) and counter/bar (2) and bookshelves (5) and anvil (8) block movement
  return t===1||t===2||t===5||t===8;
}

// ── Camera ────────────────────────────────────────────────
function _logW(){ return _tc ? _tc.width/DRAW_SCALE : window.innerWidth/DRAW_SCALE; }
function _logH(){ return _tc ? _tc.height/DRAW_SCALE : window.innerHeight/DRAW_SCALE; }

function _updateCamera(canvasW, canvasH){
  const vpW = canvasW, vpH = canvasH;
  const mapW = (_tScene==='exterior' ? EXT_COLS : INT_W) * TILE;
  const mapH = (_tScene==='exterior' ? EXT_ROWS : INT_H) * TILE;
  if(_tScene !== 'exterior'){
    // Center interior map on screen — camera is fixed
    _camX = -Math.floor((vpW - mapW) / 2);
    _camY = -Math.floor((vpH - mapH) / 2);
  } else if(_introCamActive) {
    // Smooth lerp toward intro tour target
    const targetCamX = _introCamTarget.x - vpW/2;
    const targetCamY = _introCamTarget.y - vpH/2;
    _camX += (targetCamX - _camX) * 0.045;
    _camY += (targetCamY - _camY) * 0.045;
    _camX = Math.max(0, Math.min(mapW - vpW, _camX));
    _camY = Math.max(0, Math.min(mapH - vpH, _camY));
  } else {
    _camX = Math.round(_pl.wx - vpW/2 + TILE/2);
    _camY = Math.round(_pl.wy - vpH/2 + TILE/2);
    _camX = Math.max(0, Math.min(mapW - vpW, _camX));
    if(!_victoryActive) _camY = Math.max(0, Math.min(mapH - vpH, _camY));
    else _camY = Math.max(0, _camY); // let camera follow past bottom
  }
}

// ── Near NPC detection ────────────────────────────────────
function _findNearInteractable(){
  // Exterior: buildings with interiors / NPCs + wanderers
  if(_tScene==='exterior'){
    // Check door proximity for buildings
    for(const b of EXT_BUILDINGS){
      if(!b.interior) continue;
      const dx=(_pl.wx/TILE)-b.doorTx, dy=(_pl.wy/TILE)-b.doorTy;
      if(Math.hypot(dx,dy)<1.5) return {type:'door',ref:b};
    }
    // Gate
    const gate=EXT_BUILDINGS.find(b=>b.id==='gate');
    if(gate){ const dx=(_pl.wx/TILE)-gate.doorTx,dy=(_pl.wy/TILE)-gate.doorTy; if(Math.hypot(dx,dy)<1.8) return {type:'gate',ref:gate}; }
    // Grace Vault
    const gv=EXT_DECORS.find(d=>d.type==='graceVault');
    if(gv){ const dx=(_pl.wx/TILE)-(gv.tx+0.5),dy=(_pl.wy/TILE)-(gv.ty+1); if(Math.hypot(dx,dy)<2) return {type:'graceVault',ref:gv}; }
    // Stash Chest
    const sc=EXT_DECORS.find(d=>d.type==='stashChest');
    if(sc){ const dx=(_pl.wx/TILE)-(sc.tx+0.5),dy=(_pl.wy/TILE)-(sc.ty+1); if(Math.hypot(dx,dy)<2) return {type:'stashChest',ref:sc}; }
    // Notice board
    const nb=EXT_BUILDINGS.find(b=>b.id==='noticeboard');
    if(nb){ const dx=(_pl.wx/TILE)-nb.doorTx,dy=(_pl.wy/TILE)-nb.doorTy; if(Math.hypot(dx,dy)<1.8) return {type:'notice',ref:nb}; }
    // Graveyard entrance — opens death history
    const gy=EXT_BUILDINGS.find(b=>b.id==='graveyard');
    if(gy){ const dx=(_pl.wx/TILE)-gy.doorTx,dy=(_pl.wy/TILE)-gy.doorTy; if(Math.hypot(dx,dy)<1.8) return {type:'graveyard',ref:gy}; }
    // Wanderers
    for(const w of _wanderers){
      const dx=_pl.wx-w.wx, dy=_pl.wy-w.wy;
      if(Math.hypot(dx,dy)<TILE*1.8) return {type:'wanderer',ref:w};
    }
  } else {
    // Interior: NPCs
    const int=INTERIORS[_tScene]; if(!int) return null;
    for(const n of int.npcs){
      const nwx = n._wx !== undefined ? n._wx : n.tx*TILE+TILE/2;
      const nwy = n._wy !== undefined ? n._wy : n.ty*TILE+TILE/2;
      const dx=_pl.wx-nwx, dy=_pl.wy-nwy;
      if(Math.hypot(dx,dy)<TILE*1.8) return {type:'npc',ref:n};
    }
    // Exit — trigger when player walks into the bottom exit gap (cols 9 or 10, row 13)
    const _pc=Math.floor(_pl.wx/TILE), _pr=Math.floor(_pl.wy/TILE);
    if(_pr>=int.exitTy && (_pc===int.exitTx||_pc===int.exitTx+1))
      return {type:'exit',ref:int};
  }
  return null;
}

// ══════════════════════════════════════════════════════════
//  DRAWING — TILES
// ══════════════════════════════════════════════════════════
function _drawExtTiles(ctx, a, cx, cy, cw, ch){
  const startC=Math.max(0,Math.floor(cx/TILE));
  const endC  =Math.min(EXT_COLS,Math.ceil((cx+cw)/TILE)+1);
  const startR=Math.max(0,Math.floor(cy/TILE));
  const endR  =Math.min(EXT_ROWS,Math.ceil((cy+ch)/TILE)+1);

  for(let r=startR;r<endR;r++){
    for(let c=startC;c<endC;c++){
      const t=EXT_MAP[r][c];
      const sx=c*TILE-cx, sy=r*TILE-cy;
      if(t===0){
        ctx.fillStyle=a.ground; ctx.fillRect(sx,sy,TILE,TILE);
        if((c+r)%2===0){ctx.fillStyle='rgba(255,255,255,0.02)';ctx.fillRect(sx,sy,TILE,TILE);}
        // Micro-texture: position-seeded brightness variation + sparse grass marks
        const _gs=(c*7+r*13)%8;
        if(_gs>5){ctx.fillStyle='rgba(255,255,255,0.03)';ctx.fillRect(sx,sy,TILE,TILE);}
        else if(_gs>3){ctx.fillStyle='rgba(255,255,255,0.015)';ctx.fillRect(sx,sy,TILE,TILE);}
        if(_gs===2||_gs===6){ctx.fillStyle='rgba(80,120,40,0.15)';ctx.fillRect(sx+3,sy+5,2,3);ctx.fillRect(sx+9,sy+2,2,4);ctx.fillRect(sx+12,sy+9,2,3);}
        else if(_gs===4){ctx.fillStyle='rgba(60,100,30,0.12)';ctx.fillRect(sx+1,sy+10,3,2);ctx.fillRect(sx+8,sy+4,2,3);}
      } else if(t===1){
        ctx.fillStyle=a.path; ctx.fillRect(sx,sy,TILE,TILE);
        ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.5; ctx.strokeRect(sx+1,sy+1,TILE-2,TILE-2);
        // Edge darkening where path meets grass
        const _pN=r>0?EXT_MAP[r-1][c]:1,_pS=r<EXT_ROWS-1?EXT_MAP[r+1][c]:1;
        const _pW=c>0?EXT_MAP[r][c-1]:1,_pE=c<EXT_COLS-1?EXT_MAP[r][c+1]:1;
        ctx.fillStyle='rgba(0,0,0,0.12)';
        if(_pN===0){ctx.fillRect(sx,sy,TILE,2);}
        if(_pS===0){ctx.fillRect(sx,sy+TILE-2,TILE,2);}
        if(_pW===0){ctx.fillRect(sx,sy,2,TILE);}
        if(_pE===0){ctx.fillRect(sx+TILE-2,sy,2,TILE);}
        // Gravel marks
        const _pgm=(c*11+r*7)%6;
        if(_pgm===0){ctx.fillStyle='rgba(0,0,0,0.08)';ctx.fillRect(sx+5,sy+7,2,2);ctx.fillRect(sx+11,sy+3,1,1);}
        else if(_pgm===3){ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fillRect(sx+8,sy+10,2,1);ctx.fillRect(sx+3,sy+5,1,2);}
      } else if(t===2){
        ctx.fillStyle=a.water; ctx.fillRect(sx,sy,TILE,TILE);
        const _wt=Date.now()*0.001;
        const _ws1=Math.sin(_wt+c*0.8+r*0.5)*0.06;
        const _ws2=Math.sin(_wt*1.4+c*0.5+r*0.9+1.5)*0.04;
        ctx.fillStyle=`rgba(80,140,200,${0.08+_ws1})`; ctx.fillRect(sx,sy,TILE,TILE/2);
        ctx.fillStyle=`rgba(80,140,200,${0.05+_ws2})`; ctx.fillRect(sx,sy+TILE/2,TILE,TILE/2);
        ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(sx+1,sy+2,TILE-2,1);
        // Sparkle highlights
        const _wsk=(c*7+r*11)%5;
        const _wsp=Math.sin(_wt*2+_wsk*1.2);
        if(_wsp>0.85){ctx.fillStyle=`rgba(255,255,255,${(_wsp-0.85)*2})`;ctx.fillRect(sx+_wsk*2+1,sy+3,2,1);}
      } else if(t===3){
        ctx.fillStyle=a.wallDark; ctx.fillRect(sx,sy,TILE,TILE);
        ctx.fillStyle='rgba(255,255,255,0.02)'; ctx.fillRect(sx,sy,TILE,1);
      } else if(t===4){
        ctx.fillStyle=a.ground; ctx.fillRect(sx,sy,TILE,TILE);
        ctx.fillStyle='rgba(40,30,0,0.3)'; ctx.fillRect(sx,sy,TILE,TILE);
      } else if(t===5){
        ctx.fillStyle=a.ground; ctx.fillRect(sx,sy,TILE,TILE);
        ctx.fillStyle=`rgba(${a.tr===255?180:100},${a.tg===150?120:80},30,0.5)`;
        ctx.fillRect(sx+3,sy+3,4,4); ctx.fillRect(sx+9,sy+6,4,4); ctx.fillRect(sx+5,sy+10,4,4);
      }
    }
  }
}

function _drawIntTiles(ctx, a, map, cx, cy){
  const T=TILE;
  for(let r=0;r<INT_H;r++){
    for(let c=0;c<INT_W;c++){
      const t=map[r][c];
      const sx=c*T-cx, sy=r*T-cy;
      const tt=Date.now()*0.006;

      switch(t){
        case 0: { // ── WOOD FLOOR ──
          // Base plank colour, alternating rows
          const pc = (r%2===0) ? '#3a2810' : '#352608';
          ctx.fillStyle=pc; ctx.fillRect(sx,sy,T,T);
          // Plank grain lines (horizontal)
          ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(sx,sy+T-1,T,1);
          ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(sx,sy,T,1);
          // Vertical seam every 2 tiles offset by row
          if((c+(r%2))%2===0){ ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(sx+T-1,sy,1,T); }
          // Occasional knot
          if((c*7+r*3)%17===0){ ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(sx+5,sy+8,3,2,0,0,Math.PI*2); ctx.fill(); }
          break;
        }
        case 1: { // ── STONE WALL ──
          // Base stone
          ctx.fillStyle='#2a2218'; ctx.fillRect(sx,sy,T,T);
          // Brick pattern — offset mortar
          const row=Math.floor(r), col=Math.floor(c);
          const brickOff=(row%2)*8;
          // Horizontal mortar line in middle
          ctx.fillStyle='#1a1610'; ctx.fillRect(sx,sy+T/2-1,T,2);
          // Vertical seams
          for(let bx=sx+(brickOff%T);bx<sx+T;bx+=8){ ctx.fillStyle='#1a1610'; ctx.fillRect(bx,sy,1,T/2); }
          for(let bx=sx+((brickOff+4)%T);bx<sx+T;bx+=8){ ctx.fillStyle='#1a1610'; ctx.fillRect(bx,sy+T/2,1,T/2); }
          // Top highlight on each stone face
          ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(sx,sy,T,1);
          // Occasional moss
          if((c*5+r*11)%13===0){ ctx.fillStyle='rgba(20,50,10,0.4)'; ctx.fillRect(sx+3,sy+3,5,4); }
          break;
        }
        case 2: { // ── BAR / COUNTER ──
          // Counter top (dark polished wood)
          ctx.fillStyle='#2a1808'; ctx.fillRect(sx,sy,T,T);
          // Top surface — lighter
          ctx.fillStyle='#5a3418'; ctx.fillRect(sx,sy,T,5);
          // Polish sheen
          ctx.fillStyle='rgba(255,200,100,0.12)'; ctx.fillRect(sx+2,sy+1,T-4,2);
          // Front edge
          ctx.fillStyle='#3a2010'; ctx.fillRect(sx,sy+5,T,T-5);
          // Grain lines on front
          ctx.fillStyle='rgba(0,0,0,0.15)';
          ctx.fillRect(sx,sy+8,T,1); ctx.fillRect(sx,sy+12,T,1);
          // Items on bar — occasional mug
          if(c%3===1){ ctx.fillStyle='#8a6030'; ctx.fillRect(sx+5,sy+1,4,4); ctx.fillStyle='rgba(200,160,60,0.8)'; ctx.fillRect(sx+6,sy+1,2,3); }
          break;
        }
        case 3: { // ── RUG ──
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Rug base — deep red
          ctx.fillStyle='rgba(140,25,25,0.75)'; ctx.fillRect(sx+1,sy+1,T-2,T-2);
          // Border pattern
          ctx.fillStyle='rgba(200,140,30,0.5)'; ctx.strokeStyle='rgba(200,140,30,0.5)'; ctx.lineWidth=1;
          ctx.strokeRect(sx+1,sy+1,T-2,T-2);
          ctx.strokeRect(sx+3,sy+3,T-6,T-6);
          // Diagonal cross-lines
          ctx.fillStyle='rgba(200,140,30,0.2)';
          ctx.fillRect(sx+T/2-1,sy+1,1,T-2); ctx.fillRect(sx+1,sy+T/2-1,T-2,1);
          break;
        }
        case 4: { // ── FIREPLACE ──
          // Stone surround
          ctx.fillStyle='#2a1c14'; ctx.fillRect(sx,sy,T,T);
          // Brick pattern around surround
          ctx.fillStyle='#1e1610'; ctx.fillRect(sx,sy+T/2,T,1);
          ctx.fillStyle='#1e1610'; for(let bx=sx;bx<sx+T;bx+=6) ctx.fillRect(bx,sy,1,T);
          // Firebox opening
          ctx.fillStyle='#100c08'; ctx.fillRect(sx+3,sy+3,T-6,T-6);
          // Animated fire
          const ff=0.5+0.5*Math.sin(tt+sx*0.3);
          const ff2=0.5+0.5*Math.sin(tt*1.3+sx*0.5);
          // Coals at bottom
          ctx.fillStyle=`rgba(200,80,10,0.9)`; ctx.fillRect(sx+4,sy+T-6,T-8,4);
          ctx.fillStyle=`rgba(255,120,0,0.7)`; ctx.fillRect(sx+5,sy+T-7,T-10,3);
          // Main flame
          ctx.fillStyle=`rgba(${220+Math.floor(ff*35)},${80+Math.floor(ff*60)},10,0.85)`;
          ctx.fillRect(sx+4,sy+5,T-8,T-8);
          // Inner bright flame
          ctx.fillStyle=`rgba(255,${180+Math.floor(ff2*60)},${40+Math.floor(ff2*40)},0.7)`;
          ctx.fillRect(sx+6,sy+6,T-12,T-12);
          // Tip glow
          ctx.fillStyle=`rgba(255,230,100,${0.4+ff*0.3})`; ctx.fillRect(sx+7,sy+5,3,3);
          // Glow cast on floor in front
          const fglo=ctx.createRadialGradient(sx+T/2,sy+T,0,sx+T/2,sy+T,T*1.5);
          fglo.addColorStop(0,`rgba(255,120,20,${0.12*ff})`); fglo.addColorStop(1,'rgba(255,120,20,0)');
          ctx.fillStyle=fglo; ctx.fillRect(sx-T/2,sy,T*2,T*2);
          break;
        }
        case 5: { // ── BOOKSHELF ──
          // Wood backing
          ctx.fillStyle='#2a1808'; ctx.fillRect(sx,sy,T,T);
          // Shelf planks
          ctx.fillStyle='#4a2e14'; ctx.fillRect(sx,sy+5,T,2); ctx.fillRect(sx,sy+11,T,2);
          // Books — varied colours and heights
          const bookCols=['#8a1818','#1a3a8a','#1a6a1a','#8a6010','#5a1a8a','#8a4010','#1a6a6a','#6a6a1a'];
          for(let i=0;i<5;i++){
            const bc=bookCols[(c*5+r*3+i)%bookCols.length];
            const bw=2+(i%2); const bh=4+((c+r+i)%3);
            ctx.fillStyle=bc; ctx.fillRect(sx+1+i*3,sy+7-bh,bw,bh);
            // Spine highlight
            ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(sx+1+i*3,sy+7-bh,1,bh);
          }
          // Lower shelf books
          for(let i=0;i<5;i++){
            const bc=bookCols[(c*5+r*3+i+3)%bookCols.length];
            const bw=2+(i%2); const bh=3+((c+r+i+1)%3);
            ctx.fillStyle=bc; ctx.fillRect(sx+1+i*3,sy+13-bh,bw,bh);
            ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(sx+1+i*3,sy+13-bh,1,bh);
          }
          // Top shelf dust
          ctx.fillStyle='rgba(255,240,200,0.05)'; ctx.fillRect(sx,sy,T,2);
          break;
        }
        case 6: { // ── BED ──
          // Floor beneath
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Bed frame — dark wood
          ctx.fillStyle='#3a2010'; ctx.fillRect(sx+1,sy+1,T-2,T-2);
          // Headboard (top)
          ctx.fillStyle='#2a1408'; ctx.fillRect(sx+1,sy+1,T-2,4);
          ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(sx+2,sy+2,T-4,1);
          // Footboard (bottom)
          ctx.fillStyle='#2a1408'; ctx.fillRect(sx+1,sy+T-3,T-2,2);
          // Mattress / blanket
          ctx.fillStyle='#b0a0c0'; ctx.fillRect(sx+2,sy+5,T-4,T-8);
          // Blanket fold line
          ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(sx+2,sy+8,T-4,1);
          ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+2,sy+9,T-4,1);
          // Pillow
          ctx.fillStyle='#e0d8f0'; ctx.fillRect(sx+3,sy+5,T-6,4);
          ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(sx+4,sy+6,3,2);
          break;
        }
        case 7: { // ── ALTAR ──
          ctx.fillStyle='#10102a'; ctx.fillRect(sx,sy,T,T);
          // Stone base
          ctx.fillStyle='#282870'; ctx.fillRect(sx+2,sy+4,T-4,T-5);
          ctx.fillStyle='#1a1a50'; ctx.fillRect(sx+2,sy+T-3,T-4,3);
          // Top surface glow
          const ag=0.5+0.5*Math.sin(tt*0.8);
          ctx.fillStyle=`rgba(140,160,255,${0.3+ag*0.2})`; ctx.fillRect(sx+3,sy+4,T-6,4);
          // Mystical rune glow
          const rg=ctx.createRadialGradient(sx+T/2,sy+T/2,0,sx+T/2,sy+T/2,T/2);
          rg.addColorStop(0,`rgba(160,180,255,${0.35+ag*0.25})`);
          rg.addColorStop(1,'rgba(80,100,200,0)');
          ctx.fillStyle=rg; ctx.fillRect(sx,sy,T,T);
          // Cross symbol
          ctx.fillStyle=`rgba(200,220,255,${0.6+ag*0.3})`;
          ctx.fillRect(sx+T/2-1,sy+5,2,T-9); ctx.fillRect(sx+4,sy+T/2-1,T-8,2);
          // Candle flames on corners (tiny)
          [[sx+2,sy+3],[sx+T-4,sy+3]].forEach(([cx2,cy2])=>{
            ctx.fillStyle='rgba(255,200,50,0.7)'; ctx.fillRect(cx2,cy2,2,3);
            ctx.fillStyle='rgba(255,120,10,0.5)'; ctx.fillRect(cx2,cy2+2,2,2);
          });
          break;
        }
        case 8: { // ── ANVIL ──
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Anvil body — top face (wide)
          ctx.fillStyle='#484848'; ctx.fillRect(sx+1,sy+4,T-2,4);
          ctx.fillStyle='#585858'; ctx.fillRect(sx+1,sy+4,T-2,2);
          ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+2,sy+4,4,1);
          // Anvil horn (left point)
          ctx.fillStyle='#404040';
          ctx.beginPath(); ctx.moveTo(sx+1,sy+8); ctx.lineTo(sx+1,sy+6); ctx.lineTo(sx-2,sy+7); ctx.closePath(); ctx.fill();
          // Anvil waist
          ctx.fillStyle='#383838'; ctx.fillRect(sx+3,sy+8,T-6,3);
          // Anvil base
          ctx.fillStyle='#404040'; ctx.fillRect(sx+1,sy+11,T-2,3);
          ctx.fillStyle='#303030'; ctx.fillRect(sx+1,sy+13,T-2,1);
          // Heat glow on top from recent use
          ctx.fillStyle=`rgba(255,80,10,${0.05+0.05*Math.sin(tt)})`; ctx.fillRect(sx+1,sy+4,T-2,4);
          break;
        }
        case 9: { // ── TABLE ──
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Table top (top-down view — mostly the surface)
          ctx.fillStyle='#6a4020'; ctx.fillRect(sx+1,sy+2,T-2,T-4);
          ctx.fillStyle='#7a4c26'; ctx.fillRect(sx+1,sy+2,T-2,3);
          // Wood grain
          ctx.fillStyle='rgba(0,0,0,0.12)'; ctx.fillRect(sx+1,sy+6,T-2,1); ctx.fillRect(sx+1,sy+10,T-2,1);
          ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(sx+2,sy+3,3,1);
          // Legs visible at corners (slightly darker squares)
          ctx.fillStyle='#3a2010';
          ctx.fillRect(sx+1,sy+2,3,3); ctx.fillRect(sx+T-4,sy+2,3,3);
          ctx.fillRect(sx+1,sy+T-5,3,3); ctx.fillRect(sx+T-4,sy+T-5,3,3);
          break;
        }
        case 10: { // ── WINDOW WALL ──
          // Draw as wall with a window in it
          ctx.fillStyle='#2a2218'; ctx.fillRect(sx,sy,T,T);
          ctx.fillStyle='#1a1610'; ctx.fillRect(sx,sy+T/2-1,T,2);
          for(let bx=sx;bx<sx+T;bx+=8){ ctx.fillStyle='#1a1610'; ctx.fillRect(bx,sy,1,T/2); ctx.fillRect(bx+4,sy+T/2,1,T/2); }
          ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(sx,sy,T,1);
          // Window pane — exterior light
          const wlum=0.3+0.1*Math.sin(tt*0.3);
          ctx.fillStyle=`rgba(180,210,255,${wlum})`; ctx.fillRect(sx+3,sy+3,T-6,T-6);
          // Window cross bars
          ctx.fillStyle='#3a2818'; ctx.fillRect(sx+T/2-1,sy+3,2,T-6); ctx.fillRect(sx+3,sy+T/2-1,T-6,2);
          // Light glint
          ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(sx+4,sy+4,3,2);
          // Sill
          ctx.fillStyle='#4a3020'; ctx.fillRect(sx+2,sy+T-4,T-4,3);
          break;
        }
        case 11: { // ── WALL TORCH ──
          // Wall background
          ctx.fillStyle='#2a2218'; ctx.fillRect(sx,sy,T,T);
          ctx.fillStyle='#1a1610'; ctx.fillRect(sx,sy+T/2-1,T,2);
          for(let bx=sx;bx<sx+T;bx+=8){ ctx.fillStyle='#1a1610'; ctx.fillRect(bx,sy,1,T/2); ctx.fillRect(bx+4,sy+T/2,1,T/2); }
          // Torch bracket
          ctx.fillStyle='#504030'; ctx.fillRect(sx+T/2-1,sy+5,2,8);
          ctx.fillStyle='#403020'; ctx.fillRect(sx+T/2-3,sy+10,6,2);
          // Torch body
          ctx.fillStyle='#6a3a18'; ctx.fillRect(sx+T/2-2,sy+4,4,7);
          ctx.fillStyle='#8a5020'; ctx.fillRect(sx+T/2-1,sy+4,2,5);
          // Flame
          const tf=0.5+0.5*Math.sin(tt*1.5+c);
          ctx.fillStyle=`rgba(${220+Math.floor(tf*35)},${80+Math.floor(tf*80)},10,0.9)`;
          ctx.fillRect(sx+T/2-2,sy+1,4,5);
          ctx.fillStyle=`rgba(255,200,50,${0.6+tf*0.3})`; ctx.fillRect(sx+T/2-1,sy+1,2,3);
          // Glow cast
          const tglo=ctx.createRadialGradient(sx+T/2,sy+4,0,sx+T/2,sy+4,T*1.2);
          tglo.addColorStop(0,`rgba(255,140,20,${0.18*tf})`); tglo.addColorStop(1,'rgba(255,140,20,0)');
          ctx.fillStyle=tglo; ctx.fillRect(sx-T,sy-T,T*3,T*3);
          break;
        }
        case 12: { // ── CHEST ──
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Chest body
          ctx.fillStyle='#5a3810'; ctx.fillRect(sx+2,sy+5,T-4,T-7);
          // Lid (top)
          ctx.fillStyle='#7a4a18'; ctx.fillRect(sx+2,sy+3,T-4,4);
          ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+3,sy+3,T-6,1);
          // Metal band
          ctx.fillStyle='#808080'; ctx.fillRect(sx+2,sy+7,T-4,2);
          ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(sx+2,sy+7,T-4,1);
          // Lock
          ctx.fillStyle='#c0a020'; ctx.fillRect(sx+T/2-2,sy+6,4,4);
          ctx.fillStyle='#1a1408'; ctx.fillRect(sx+T/2-1,sy+8,2,2);
          // Corner brackets
          ctx.fillStyle='#707070';
          ctx.fillRect(sx+2,sy+5,2,T-7); ctx.fillRect(sx+T-4,sy+5,2,T-7);
          break;
        }
        case 13: { // ── STAIRS DOWN ──
          ctx.fillStyle='#252018'; ctx.fillRect(sx,sy,T,T);
          // Steps (4 steps going down = smaller each row)
          for(let s=0;s<4;s++){
            const sw=T-s*3;
            ctx.fillStyle=`rgba(${40+s*15},${35+s*12},${25+s*8},1)`;
            ctx.fillRect(sx+(T-sw)/2,sy+s*4,sw,4);
            ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(sx+(T-sw)/2,sy+s*4,sw,1);
            ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(sx+(T-sw)/2,sy+s*4+3,sw,1);
          }
          // Dark void at bottom
          ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(sx+4,sy+12,T-8,4);
          // Down arrow hint
          ctx.fillStyle='rgba(200,170,80,0.4)';
          ctx.fillRect(sx+T/2-1,sy+8,2,5); ctx.fillRect(sx+T/2-3,sy+11,6,2); ctx.fillRect(sx+T/2-2,sy+10,4,1);
          break;
        }
        case 14: { // ── PLANT / VASE ──
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Pot
          ctx.fillStyle='#8a4820'; ctx.fillRect(sx+4,sy+10,8,6);
          ctx.fillStyle='#6a3010'; ctx.fillRect(sx+3,sy+9,10,3);
          ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+4,sy+10,3,2);
          // Leaves
          ctx.fillStyle='#206020'; ctx.fillRect(sx+5,sy+5,6,6);
          ctx.fillStyle='#308030'; ctx.fillRect(sx+3,sy+6,5,5); ctx.fillRect(sx+8,sy+5,5,5);
          ctx.fillStyle='#409040'; ctx.fillRect(sx+6,sy+3,4,4);
          ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+6,sy+4,2,2);
          break;
        }
        case 15: { // ── WEAPON RACK ──
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Rack frame
          ctx.fillStyle='#4a3018'; ctx.fillRect(sx+1,sy+2,T-2,2); ctx.fillRect(sx+1,sy+T-4,T-2,2);
          ctx.fillRect(sx+1,sy+2,2,T-4); ctx.fillRect(sx+T-3,sy+2,2,T-4);
          // Sword
          ctx.fillStyle='#909090'; ctx.fillRect(sx+4,sy+3,2,T-6);
          ctx.fillStyle='#c0c0c0'; ctx.fillRect(sx+4,sy+3,1,T-6);
          ctx.fillStyle='#c09020'; ctx.fillRect(sx+2,sy+7,6,2);
          ctx.fillStyle='#806020'; ctx.fillRect(sx+4,sy+T-6,2,3);
          // Axe
          ctx.fillStyle='#707070'; ctx.fillRect(sx+9,sy+4,2,T-7);
          ctx.fillStyle='#585858'; ctx.fillRect(sx+8,sy+4,3,6);
          ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(sx+8,sy+4,1,5);
          break;
        }
        case 16: { // ── CAULDRON ──
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
          // Cauldron body
          ctx.fillStyle='#282828'; ctx.fillRect(sx+2,sy+5,T-4,T-7);
          ctx.fillStyle='#202020'; ctx.fillRect(sx+3,sy+6,T-6,T-9);
          // Rim
          ctx.fillStyle='#383838'; ctx.fillRect(sx+1,sy+4,T-2,3);
          ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+2,sy+4,T-4,1);
          // Legs
          ctx.fillStyle='#303030'; ctx.fillRect(sx+2,sy+T-3,3,3); ctx.fillRect(sx+T-5,sy+T-3,3,3);
          // Bubbling liquid
          const cv=0.5+0.5*Math.sin(tt*2);
          ctx.fillStyle=`rgba(60,${140+Math.floor(cv*60)},20,0.8)`; ctx.fillRect(sx+3,sy+5,T-6,3);
          ctx.fillStyle=`rgba(100,${180+Math.floor(cv*40)},30,0.5)`;
          ctx.beginPath(); ctx.arc(sx+5,sy+5+cv*2,1.5,0,Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(sx+10,sy+4+cv,1,0,Math.PI*2); ctx.fill();
          break;
        }
        default: {
          ctx.fillStyle=a.floorCol||'#3a2810'; ctx.fillRect(sx,sy,T,T);
        }
      }
    }
  }
}

// ── Draw exterior building ────────────────────────────────
function _drawExtBuilding(ctx, b, a, cx, cy){
  const pal=BPAL[b.pal];
  const x=b.tx*TILE-cx, y=b.ty*TILE-cy;
  const w=b.tw*TILE, h=b.th*TILE;
  const isHouse = b.pal===8;

  if(x+w<0||y+h<0||x>_logW()||y>_logH()) return; // cull

  // ── Dungeon Gate ──────────────────────────────────────────
  if(b.id==='gate'){
    const near=_nearInteractable&&_nearInteractable.type==='gate';
    const t2=Date.now()*0.001;
    const flicker=0.7+0.3*Math.sin(t2*3.1+Math.sin(t2*1.7));
    ctx.fillStyle='#0e0b08'; ctx.fillRect(x,y,w,h);
    ctx.fillStyle='rgba(255,255,255,0.04)';
    for(let bx=x;bx<x+w;bx+=TILE){ for(let by=y;by<y+h;by+=TILE/2){ const offset=(by/8%2===0)?0:TILE/2; ctx.fillRect(bx+offset,by,TILE-1,TILE/2-1); } }
    ctx.fillStyle='rgba(0,0,0,0.3)';
    for(let bx=x;bx<x+w;bx+=TILE) ctx.fillRect(bx,y,1,h);
    for(let by=y;by<y+h;by+=TILE/2) ctx.fillRect(x,by,w,1);
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.fillRect(x+w*0.15,y+3,1,h*0.4); ctx.fillRect(x+w*0.16,y+h*0.15,1,h*0.2); ctx.fillRect(x+w*0.8,y+5,1,h*0.35);
    const archX=x+w*0.25, archW=w*0.5, archY=y+2, archH=h-4, archMidX=archX+archW/2, archTopY=archY+archH*0.18;
    const voidGrad=ctx.createLinearGradient(archX,archY,archX,archY+archH);
    voidGrad.addColorStop(0,`rgba(60,0,0,${0.4*flicker})`); voidGrad.addColorStop(0.4,'rgba(10,0,0,0.95)'); voidGrad.addColorStop(1,'rgba(0,0,0,1)');
    ctx.fillStyle=voidGrad; ctx.beginPath(); ctx.moveTo(archX,archY+archH); ctx.lineTo(archX,archTopY+archH*0.25); ctx.quadraticCurveTo(archX,archTopY,archMidX,archY); ctx.quadraticCurveTo(archX+archW,archTopY,archX+archW,archTopY+archH*0.25); ctx.lineTo(archX+archW,archY+archH); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#2a1a10'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(archX,archY+archH); ctx.lineTo(archX,archTopY+archH*0.25); ctx.quadraticCurveTo(archX,archTopY,archMidX,archY); ctx.quadraticCurveTo(archX+archW,archTopY,archX+archW,archTopY+archH*0.25); ctx.lineTo(archX+archW,archY+archH); ctx.stroke();
    const glowR=archW*0.55;
    const glow=ctx.createRadialGradient(archMidX,archY+archH*0.6,0,archMidX,archY+archH*0.6,glowR);
    glow.addColorStop(0,`rgba(160,20,0,${0.25*flicker})`); glow.addColorStop(0.5,`rgba(80,5,0,${0.1*flicker})`); glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow; ctx.fillRect(archX,archY,archW,archH);
    const eyeY=archY+archH*0.35;
    [archMidX-archW*0.15, archMidX+archW*0.1].forEach(ex=>{ const eg=ctx.createRadialGradient(ex,eyeY,0,ex,eyeY,5); eg.addColorStop(0,`rgba(255,60,0,${0.9*flicker})`); eg.addColorStop(0.4,`rgba(200,20,0,${0.5*flicker})`); eg.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(ex,eyeY,5,0,Math.PI*2); ctx.fill(); ctx.fillStyle=`rgba(255,200,0,${0.8*flicker})`; ctx.beginPath(); ctx.arc(ex,eyeY,1.5,0,Math.PI*2); ctx.fill(); });
    ctx.strokeStyle='#302820'; ctx.lineWidth=2;
    for(let ci=0;ci<3;ci++){ const cx3=archX+4+ci*5; for(let cy3=archY+4;cy3<archY+archH*0.5;cy3+=6){ ctx.beginPath(); ctx.arc(cx3,cy3,2,0,Math.PI*2); ctx.stroke(); } const cx4=archX+archW-4-ci*5; for(let cy4=archY+4;cy4<archY+archH*0.5;cy4+=6){ ctx.beginPath(); ctx.arc(cx4,cy4,2,0,Math.PI*2); ctx.stroke(); } }
    [[x+TILE*0.5,y+TILE*0.4],[x+w-TILE*1.2,y+TILE*0.4]].forEach(([sx2,sy2])=>{ ctx.fillStyle='#2a1a0a'; ctx.fillRect(sx2,sy2,10,8); ctx.fillRect(sx2+2,sy2-2,6,4); ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(sx2+1,sy2+2,3,3); ctx.fillRect(sx2+6,sy2+2,3,3); ctx.fillRect(sx2+3,sy2+6,4,2); });
    const fogGrad=ctx.createLinearGradient(archX,archY+archH-8,archX,archY+archH+6); fogGrad.addColorStop(0,`rgba(80,10,0,${0.3*flicker})`); fogGrad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=fogGrad; ctx.fillRect(archX,archY+archH-8,archW,14);
    ctx.font='bold 4px "Press Start 2P",monospace'; ctx.textAlign='center'; ctx.textBaseline='bottom';
    const labelW=ctx.measureText('⚔ DUNGEON GATE').width+10; const lx=archMidX-labelW/2, ly2=y-3;
    ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(lx,ly2-8,labelW,9);
    ctx.strokeStyle=near?'#ffd84a':'rgba(180,30,0,0.8)'; ctx.lineWidth=1; ctx.strokeRect(lx,ly2-8,labelW,9);
    ctx.fillStyle=near?'#ffd84a':`rgba(220,80,30,${0.7+0.3*flicker})`; ctx.fillText('⚔ DUNGEON GATE',archMidX,ly2-1);
    return;
  }

  // ── Notice Board ──────────────────────────────────────────
  if(b.id==='noticeboard'){
    const cx2=x+w/2, cy2=y+h/2;
    const near=_nearInteractable&&(_nearInteractable.ref===b);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(x+6,y+h-2,w-12,4);
    ctx.fillStyle='#5a3a18'; ctx.fillRect(cx2-14,cy2,4,h/2+4); ctx.fillRect(cx2+10,cy2,4,h/2+4);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(cx2-11,cy2,1,h/2+4); ctx.fillRect(cx2+13,cy2,1,h/2+4);
    ctx.fillStyle='#4a2e10'; ctx.fillRect(cx2-16,cy2-2,32,4);
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(cx2-16,cy2-2,32,1);
    ctx.fillStyle='#6a4a20'; ctx.fillRect(cx2-18,cy2-20,36,22);
    ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(cx2-18,cy2-20,2,22); ctx.fillRect(cx2+16,cy2-20,2,22);
    ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(cx2-18,cy2-12,36,1); ctx.fillRect(cx2-18,cy2-5,36,1);
    ctx.fillStyle='rgba(240,230,200,0.88)'; ctx.fillRect(cx2-15,cy2-18,14,10);
    ctx.fillStyle='rgba(240,230,200,0.75)'; ctx.fillRect(cx2+1,cy2-17,12,9);
    ctx.fillStyle='rgba(235,225,195,0.65)'; ctx.fillRect(cx2-10,cy2-8,10,7);
    ctx.fillStyle='rgba(50,30,10,0.45)';
    ctx.fillRect(cx2-13,cy2-16,10,1); ctx.fillRect(cx2-13,cy2-14,8,1); ctx.fillRect(cx2-13,cy2-12,9,1);
    ctx.fillRect(cx2+3,cy2-15,8,1); ctx.fillRect(cx2+3,cy2-13,6,1); ctx.fillRect(cx2+3,cy2-11,7,1);
    ctx.fillStyle='rgba(180,50,30,0.9)'; ctx.fillRect(cx2-15,cy2-18,2,2); ctx.fillRect(cx2-3,cy2-18,2,2); ctx.fillRect(cx2+1,cy2-17,2,2); ctx.fillRect(cx2+11,cy2-17,2,2);
    ctx.font='bold 5px "Press Start 2P",monospace';
    const tw=ctx.measureText('Notice Board').width+8; const sx2=cx2-tw/2;
    ctx.fillStyle='rgba(80,60,30,0.8)'; ctx.fillRect(sx2+tw*0.25,cy2-26,1,4); ctx.fillRect(sx2+tw*0.75,cy2-26,1,4);
    ctx.fillStyle=near?'#3a2800':'#2a1c08'; ctx.fillRect(sx2,cy2-22,tw,10);
    ctx.strokeStyle=near?'#ffd84a':pal[2]; ctx.lineWidth=1; ctx.strokeRect(sx2,cy2-22,tw,10);
    ctx.fillStyle=near?'#ffd84a':pal[2]; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('Notice Board',cx2,cy2-17);
    return;
  }

  // ── Graveyard ────────────────────────────────────────────
  if(b.id==='graveyard'){
    const near=_nearInteractable&&(_nearInteractable.ref===b);
    ctx.fillStyle='#141412'; ctx.fillRect(x,y,w,h);
    for(let gr=0;gr<h;gr+=5){ ctx.fillStyle='rgba(255,255,255,0.01)'; ctx.fillRect(x,y+gr,w,1); }
    const T=TILE;
    ctx.fillStyle='#3a3630'; ctx.fillRect(x,y,w,T); ctx.fillRect(x,y+h-T,w,T); ctx.fillRect(x,y,T,h); ctx.fillRect(x+w-T,y,T,h);
    ctx.fillStyle='rgba(0,0,0,0.25)';
    for(let wc=x+T*2;wc<x+w-T;wc+=T){ ctx.fillRect(wc,y,1,T); ctx.fillRect(wc,y+h-T,1,T); }
    for(let wr=y+T*2;wr<y+h-T;wr+=T){ ctx.fillRect(x,wr,T,1); ctx.fillRect(x+w-T,wr,T,1); }
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,y,w,1); ctx.fillRect(x,y,1,h); ctx.fillRect(x+w-1,y,1,h); ctx.fillRect(x,y+h-1,w,1);
    ctx.fillStyle='rgba(20,50,15,0.4)'; ctx.fillRect(x+T*2,y+4,T-2,4); ctx.fillRect(x+T*5,y+3,T-4,5); ctx.fillRect(x+T*2,y+h-T+5,T-2,4); ctx.fillRect(x+T*6,y+h-T+4,T-3,4); ctx.fillRect(x+2,y+T*2,4,T-2); ctx.fillRect(x+3,y+T*5,5,T-3);
    const gx=b.doorTx*TILE-cx;
    ctx.fillStyle='#141412'; ctx.fillRect(gx,y+h-T,T*2,T+2);
    ctx.fillStyle='#4a4440'; ctx.fillRect(gx-2,y+h-T-4,4,T+4); ctx.fillRect(gx+T*2-2,y+h-T-4,4,T+4);
    ctx.fillStyle='#5a5450'; ctx.fillRect(gx-2,y+h-T-4,4,3); ctx.fillRect(gx+T*2-2,y+h-T-4,4,3);
    ctx.fillStyle='#2a2828'; for(let fi=0;fi<5;fi++) ctx.fillRect(gx+3+fi*5,y+h-T,2,T);
    const iX=x+T+4, iY=y+T+4, iW=w-T*2-8, iH=h-T*2-8;
    const stones=[[0.05,0.05],[0.22,0.02],[0.40,0.07],[0.60,0.03],[0.78,0.08],[0.92,0.04],[0.10,0.25],[0.30,0.22],[0.52,0.28],[0.70,0.20],[0.88,0.26],[0.08,0.45],[0.28,0.50],[0.50,0.44],[0.72,0.48],[0.90,0.42],[0.06,0.68],[0.20,0.72],[0.42,0.65],[0.82,0.70],[0.95,0.66]];
    for(const [fx,fy] of stones){
      const gsx=Math.floor(iX+fx*iW), gsy=Math.floor(iY+fy*iH);
      if(gsy>y+h-T*2.5 && gsx>gx-T && gsx<gx+T*3) continue;
      const seed=(gsx*7+gsy*13)%10; const sw=7+(seed%3), sh=6+(seed%2);
      ctx.fillStyle=seed>5?'#383230':'#403a36'; ctx.fillRect(gsx,gsy+4,sw,sh);
      ctx.fillStyle=seed>5?'#302c28':'#383230'; ctx.fillRect(gsx,gsy,sw,5); ctx.fillRect(gsx+1,gsy-2,sw-2,3);
      ctx.fillStyle='rgba(255,255,255,0.07)'; ctx.fillRect(gsx,gsy,1,7);
      if(seed%3===0){ ctx.fillStyle='rgba(25,55,15,0.45)'; ctx.fillRect(gsx+2,gsy+5,sw-3,3); }
      ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(gsx+2,gsy+1,sw-4,1); ctx.fillRect(gsx+2,gsy+3,sw-5,1);
      ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(gsx-1,gsy+sh+3,sw+2,2);
    }
    ctx.fillStyle='#242018'; ctx.fillRect(x+w-T-8,y+T+4,3,18); ctx.fillRect(x+w-T-14,y+T+10,10,2); ctx.fillRect(x+w-T-8,y+T+7,7,2); ctx.fillRect(x+w-T-10,y+T+14,6,2);
    ctx.font='bold 5px "Press Start 2P",monospace';
    const stw=ctx.measureText('Graveyard').width+8, ssx=gx+T-stw/2;
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(ssx+1,y+h-T-16,stw,10);
    ctx.fillStyle=near?'#3a2800':'#1a1410'; ctx.fillRect(ssx,y+h-T-17,stw,10);
    ctx.strokeStyle=near?'#ffd84a':'#504848'; ctx.lineWidth=1; ctx.strokeRect(ssx,y+h-T-17,stw,10);
    ctx.fillStyle=near?'#ffd84a':'#807070'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('Graveyard',gx+T,y+h-T-12);
    return;
  }

  // Drop shadow — gradient fade
  const _shg=ctx.createLinearGradient(0,y+h,0,y+h+8);
  _shg.addColorStop(0,'rgba(0,0,0,0.35)'); _shg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=_shg; ctx.fillRect(x+2,y+h,w+4,8);

  // ── HELPERS ──────────────────────────────────────────────
  function _roof(rx,ry,rw,rh,col,overhang=3){
    ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(rx-overhang,ry+rh); ctx.lineTo(rx+rw+overhang,ry+rh); ctx.lineTo(rx+rw/2,ry); ctx.closePath(); ctx.fill();
  }
  function _win(wx,wy,ws,wh,glowCol){
    ctx.fillStyle='#1a1208'; ctx.fillRect(wx,wy,ws,wh);
    ctx.fillStyle=glowCol||'rgba(255,200,100,0.25)'; ctx.fillRect(wx,wy,ws,wh);
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(wx+Math.floor(ws/2)-1,wy,2,wh); ctx.fillRect(wx,wy+Math.floor(wh/2)-1,ws,2);
    ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(wx+1,wy+1,Math.floor(ws/2)-2,Math.floor(wh/2)-2);
    ctx.strokeStyle='#4a3010'; ctx.lineWidth=1; ctx.strokeRect(wx-0.5,wy-0.5,ws+1,wh+1);
  }
  function _bricks(rx,ry,rw,rh,alpha=0.1){
    ctx.fillStyle=`rgba(0,0,0,${alpha})`;
    for(let row=ry+5;row<ry+rh;row+=5){ ctx.fillRect(rx,row,rw,1); }
    for(let row=ry;row<ry+rh;row+=5){ const off=(Math.floor((row-ry)/5)%2)*TILE/2; for(let col=rx+off;col<rx+rw;col+=TILE) ctx.fillRect(col,row,1,5); }
  }
  function _planks(rx,ry,rw,rh,alpha=0.08){
    ctx.fillStyle=`rgba(0,0,0,${alpha})`; for(let row=ry+5;row<ry+rh;row+=5) ctx.fillRect(rx,row,rw,1);
    ctx.fillStyle=`rgba(255,255,255,0.04)`; for(let row=ry+2;row<ry+rh;row+=5) ctx.fillRect(rx,row,rw,1);
  }
  function _door(dx2,dy2,dw,dh,dcol,acol){
    ctx.fillStyle=dcol; ctx.fillRect(dx2,dy2,dw,dh);
    ctx.fillStyle=acol||'rgba(255,200,80,0.1)'; ctx.fillRect(dx2+2,dy2+4,dw-4,dh-5);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(dx2,dy2,dw,2);
    ctx.fillStyle=dcol; ctx.fillRect(dx2+dw-5,dy2+Math.floor(dh/2)-1,3,3);
    ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.lineWidth=1; ctx.strokeRect(dx2,dy2,dw,dh);
  }
  function _sign(sx2,sy2,label,nearSign){
    ctx.font='bold 4px "Press Start 2P",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    const tw=ctx.measureText(label).width, sw=tw+10, sh=10, sgx=sx2-sw/2;
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(sgx+4,sy2-5,1,6); ctx.fillRect(sgx+sw-5,sy2-5,1,6);
    ctx.fillStyle=nearSign?'#c8a020':'#7a5020'; ctx.fillRect(sgx,sy2,sw,sh);
    ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(sgx,sy2+3,sw,1); ctx.fillRect(sgx,sy2+6,sw,1);
    ctx.strokeStyle=nearSign?'#ffd84a':'#5a3810'; ctx.lineWidth=1; ctx.strokeRect(sgx+0.5,sy2+0.5,sw-1,sh-1);
    ctx.fillStyle=nearSign?'#ffd84a':'#b08040'; ctx.fillRect(sgx+1,sy2+1,2,2); ctx.fillRect(sgx+sw-3,sy2+1,2,2); ctx.fillRect(sgx+1,sy2+sh-3,2,2); ctx.fillRect(sgx+sw-3,sy2+sh-3,2,2);
    ctx.fillStyle=nearSign?'#1a0a00':'#f0d890'; ctx.fillText(label,sx2,sy2+sh/2+0.5);
  }

  const near2=_nearInteractable&&(_nearInteractable.ref===b);
  const st2=Date.now()*0.001;
  const dx=b.doorTx*TILE-cx, dy=b.doorTy*TILE-cy;

  if(isHouse){
    const wallY=y+Math.floor(h*0.42);
    const wallH=h-Math.floor(h*0.42);
    const midWallY=wallY+Math.floor(wallH*0.4);

    if(b.id==='house1'){
      ctx.fillStyle='#6a4820'; ctx.fillRect(x,wallY,w,wallH);
      _planks(x,wallY,w,wallH,0.1);
      ctx.fillStyle='rgba(255,255,255,0.05)'; ctx.fillRect(x,wallY,2,wallH);
      _roof(x,y,w,wallY-y,'#7a2a10');
      ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY;ry+=4){ const t=(ry-y)/(wallY-y); ctx.beginPath(); ctx.moveTo(x-3*t,ry); ctx.lineTo(x+w+3*t,ry); ctx.stroke(); }
      ctx.fillStyle='#4a3020'; ctx.fillRect(x+4,y-8,5,wallY-y+4);
      ctx.fillStyle='#3a2010'; ctx.fillRect(x+3,y-9,7,3);
      ctx.globalAlpha=0.25+0.15*Math.sin(st2); ctx.fillStyle='#b0a090';
      ctx.beginPath(); ctx.arc(x+6,y-12+Math.sin(st2)*2,4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+8,y-17+Math.sin(st2+1)*1.5,3,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      _win(x+w/2-5,midWallY-4,10,9,'rgba(255,200,80,0.3)');
      ctx.fillStyle='#5a2a10'; ctx.fillRect(x+w/2-6,midWallY+5,13,3);
      ctx.fillStyle='#c03030'; ctx.fillRect(x+w/2-5,midWallY+3,3,3);
      ctx.fillStyle='#e04040'; ctx.fillRect(x+w/2-3,midWallY+2,3,3);
      ctx.fillStyle='#c03030'; ctx.fillRect(x+w/2,midWallY+3,3,3);
      ctx.fillStyle='#208020'; ctx.fillRect(x+w/2+3,midWallY+3,3,3);
      _door(dx+2,dy,TILE-4,TILE,'#5a3010');

    } else if(b.id==='house2'){
      ctx.fillStyle='#585048'; ctx.fillRect(x,wallY,w,wallH);
      _bricks(x,wallY,w,wallH,0.15);
      ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(x,wallY,w,1);
      _roof(x,y,w,wallY-y,'#3a3028');
      ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=0.5;
      for(let ry=y+5;ry<wallY;ry+=5){ const t=(ry-y)/(wallY-y); ctx.beginPath(); ctx.moveTo(x-3*t,ry); ctx.lineTo(x+w+3*t,ry); ctx.stroke(); }
      const aw=10,ah=11,awx=x+w/2-5,awy=midWallY-6;
      ctx.fillStyle='#1a1208'; ctx.fillRect(awx,awy+4,aw,ah-4);
      ctx.fillStyle='rgba(120,160,255,0.25)'; ctx.fillRect(awx,awy+4,aw,ah-4);
      ctx.beginPath(); ctx.arc(awx+aw/2,awy+4,aw/2,Math.PI,0); ctx.fillStyle='#1a1208'; ctx.fill();
      ctx.fillStyle='rgba(120,160,255,0.2)'; ctx.beginPath(); ctx.arc(awx+aw/2,awy+4,aw/2,Math.PI,0); ctx.fill();
      ctx.strokeStyle='#484038'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(awx+aw/2,awy+4,aw/2+1,Math.PI,0); ctx.stroke();
      ctx.fillStyle='rgba(20,60,15,0.5)'; for(let iv=0;iv<4;iv++) ctx.fillRect(x+iv%2,wallY+iv*4,3+iv,4);
      _door(dx+2,dy,TILE-4,TILE,'#3a2810');

    } else if(b.id==='house3'){
      ctx.fillStyle='#4a3018'; ctx.fillRect(x,wallY,w,wallH);
      _planks(x,wallY,w,wallH,0.12);
      ctx.fillStyle='#3a2010'; ctx.fillRect(x,wallY,3,wallH); ctx.fillRect(x+w-3,wallY,3,wallH);
      ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(x+1,wallY,1,wallH);
      _roof(x,y,w,wallY-y,'#602010',2);
      ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY;ry+=4){ const t=(ry-y)/(wallY-y); ctx.beginPath(); ctx.moveTo(x-2*t,ry); ctx.lineTo(x+w+2*t,ry); ctx.stroke(); }
      _win(x+3,midWallY-4,8,8,'rgba(255,200,80,0.25)');
      _win(x+w-11,midWallY-4,8,8,'rgba(255,200,80,0.2)');
      ctx.fillStyle='#3a2818'; ctx.fillRect(x+w-8,y-6,5,wallY-y+4);
      ctx.fillStyle='#2a1808'; ctx.fillRect(x+w-9,y-7,7,3);
      ctx.globalAlpha=0.2+0.1*Math.sin(st2+0.5); ctx.fillStyle='#a09080';
      ctx.beginPath(); ctx.arc(x+w-6,y-11+Math.sin(st2)*1.5,3,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      _door(dx+2,dy,TILE-4,TILE,'#3a2010');

    } else if(b.id==='house4'){
      ctx.fillStyle='#7a4028'; ctx.fillRect(x,wallY,w,wallH);
      _bricks(x,wallY,w,wallH,0.08);
      ctx.fillStyle='rgba(255,100,50,0.06)'; ctx.fillRect(x,wallY,w,wallH);
      _roof(x,y,w,wallY-y,'#501808',4);
      ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=0.5;
      for(let ry=y+5;ry<wallY;ry+=5){ const t=(ry-y)/(wallY-y); ctx.beginPath(); ctx.moveTo(x-4*t,ry); ctx.lineTo(x+w+4*t,ry); ctx.stroke(); }
      [[x+4,midWallY-5],[x+w-14,midWallY-5]].forEach(([wx2,wy2])=>{
        _win(wx2,wy2,10,9,'rgba(255,180,60,0.35)');
        ctx.fillStyle='#5a2a10'; ctx.fillRect(wx2-3,wy2,3,9); ctx.fillRect(wx2+10,wy2,3,9);
        ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(wx2-3,wy2+3,3,1); ctx.fillRect(wx2-3,wy2+6,3,1); ctx.fillRect(wx2+10,wy2+3,3,1); ctx.fillRect(wx2+10,wy2+6,3,1);
      });
      ctx.fillStyle='#5a3018'; ctx.fillRect(x+Math.floor(w*0.6),y-5,6,wallY-y+3);
      ctx.fillStyle='#3a1808'; ctx.fillRect(x+Math.floor(w*0.6)-1,y-6,8,3);
      ctx.globalAlpha=0.3+0.2*Math.sin(st2+1); ctx.fillStyle='#b0a898';
      ctx.beginPath(); ctx.arc(x+Math.floor(w*0.6)+3,y-10+Math.sin(st2)*2,4,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      _door(dx+2,dy,TILE-4,TILE,'#5a2810');

    } else if(b.id==='house5'){
      ctx.fillStyle='#3a2c18'; ctx.fillRect(x,wallY,w,wallH);
      _planks(x,wallY,w,wallH,0.15);
      ctx.fillStyle='#5a4020'; ctx.fillRect(x+w-8,wallY+3,6,wallH-5);
      _planks(x+w-8,wallY+3,6,wallH-5,0.1);
      ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(x+w-9,wallY+3,1,wallH-5);
      ctx.fillStyle='#502808'; ctx.beginPath(); ctx.moveTo(x-2,wallY+2); ctx.lineTo(x+w+1,wallY+2); ctx.lineTo(x+w*0.55,y+3); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY;ry+=5){ ctx.beginPath(); ctx.moveTo(x-1,ry); ctx.lineTo(x+w+1,ry); ctx.stroke(); }
      _win(x+w/2-2,midWallY-3,8,7,'rgba(200,160,60,0.15)');
      ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(x+w*0.3,wallY,3,Math.PI,0); ctx.fill();
      _door(dx+1,dy,TILE-3,TILE,'#2a1808');

    } else if(b.id==='house6'){
      ctx.fillStyle='#c8b090'; ctx.fillRect(x,wallY,w,wallH);
      ctx.fillStyle='rgba(0,0,0,0.04)'; for(let py=wallY;py<y+h;py+=3) for(let px=x;px<x+w;px+=4) if((px+py)%7===0) ctx.fillRect(px,py,1,1);
      ctx.fillStyle='#a08060'; for(let qy=wallY;qy<y+h;qy+=6){ ctx.fillRect(x,qy,4,4); ctx.fillRect(x+w-4,qy,4,4); }
      _roof(x,y,w,wallY-y,'#6a3a18',3);
      ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY;ry+=4){ const t=(ry-y)/(wallY-y); ctx.beginPath(); ctx.moveTo(x-3*t,ry); ctx.lineTo(x+w+3*t,ry); ctx.stroke(); }
      [[x+3,midWallY-5],[x+w-13,midWallY-5]].forEach(([wx2,wy2])=>{
        _win(wx2,wy2,10,9,'rgba(255,220,120,0.35)');
        ctx.fillStyle='#a08060'; ctx.fillRect(wx2-1,wy2+9,12,2);
        ctx.fillStyle='#7a4820'; ctx.fillRect(wx2,wy2+11,10,3);
        ctx.fillStyle='#e03060'; ctx.fillRect(wx2+1,wy2+9,3,3);
        ctx.fillStyle='#f05020'; ctx.fillRect(wx2+4,wy2+10,3,3);
        ctx.fillStyle='#d04080'; ctx.fillRect(wx2+7,wy2+9,3,3);
      });
      _door(dx+2,dy,TILE-4,TILE,'#7a4820');

    } else if(b.id==='house7'){
      ctx.fillStyle='#5a4830'; ctx.fillRect(x,wallY,w,wallH);
      _planks(x,wallY,w,wallH,0.09);
      ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(x,wallY+Math.floor(wallH*0.5),w,2);
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x,wallY+Math.floor(wallH*0.5)+2,w,1);
      ctx.fillStyle='#4a3820'; ctx.fillRect(x-2,wallY+Math.floor(wallH*0.5)-1,w+4,3);
      _roof(x,y,w,wallY-y,'#5a2808',3);
      ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY;ry+=4){ const t=(ry-y)/(wallY-y); ctx.beginPath(); ctx.moveTo(x-3*t,ry); ctx.lineTo(x+w+3*t,ry); ctx.stroke(); }
      _win(x+2,wallY+4,8,7,'rgba(255,200,80,0.2)');
      _win(x+w-10,wallY+4,8,7,'rgba(255,200,80,0.2)');
      _win(x+w/2-4,wallY+Math.floor(wallH*0.55)+3,8,7,'rgba(255,200,80,0.25)');
      _door(dx+2,dy,TILE-4,TILE,'#4a2810');

    } else if(b.id==='house8'){
      ctx.fillStyle='#4a4438'; ctx.fillRect(x,wallY,w,wallH);
      _bricks(x,wallY,w,wallH,0.2);
      ctx.fillStyle='rgba(20,55,15,0.4)'; ctx.fillRect(x,wallY,w,2); ctx.fillRect(x,wallY+6,4,3); ctx.fillRect(x+w-6,wallY+8,5,4); ctx.fillRect(x+4,y+h-3,8,3);
      _roof(x,y,w,wallY-y,'#302820',2);
      ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=0.5;
      for(let ry=y+5;ry<wallY;ry+=5){ const t=(ry-y)/(wallY-y); ctx.beginPath(); ctx.moveTo(x-2*t,ry); ctx.lineTo(x+w+2*t,ry); ctx.stroke(); }
      _win(x+w/2-5,midWallY-4,10,8,'rgba(150,180,200,0.15)');
      ctx.strokeStyle='rgba(20,60,15,0.5)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(x+w-2,y+h); ctx.bezierCurveTo(x+w,wallY+5,x+w-3,wallY,x+w-1,y+4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+w-2,wallY+8); ctx.lineTo(x+w-8,wallY+4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+w-2,wallY+14); ctx.lineTo(x+w+3,wallY+10); ctx.stroke();
      _door(dx+2,dy,TILE-4,TILE,'#2a2018');

    } else {
      // house9 — abandoned
      ctx.fillStyle='#352a1a'; ctx.fillRect(x,wallY,w,wallH);
      _planks(x,wallY,w,wallH,0.2);
      ctx.fillStyle='#251a0a'; ctx.fillRect(x+5,wallY,3,wallH); ctx.fillRect(x+w-9,wallY,3,wallH);
      _roof(x,y,w,wallY-y,'#3a1808',2);
      ctx.fillStyle='#2a1008'; ctx.fillRect(x+4,y+6,8,4); ctx.fillRect(x+w-10,y+3,6,5);
      ctx.fillStyle='#3a2818'; ctx.fillRect(x+w/2-3,y-4,5,wallY-y+3);
      ctx.fillStyle='#2a1808'; ctx.fillRect(x+w/2-4,y-5,7,3);
      _win(x+w/2-5,midWallY-4,10,8,'rgba(100,100,120,0.1)');
      ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(x+w/2-5,midWallY-4); ctx.lineTo(x+w/2+3,midWallY+2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+w/2+5,midWallY-4); ctx.lineTo(x+w/2-1,midWallY+4); ctx.stroke();
      _door(dx+2,dy,TILE-4,TILE,'#251808');
      ctx.fillStyle='#4a3018'; ctx.fillRect(dx+1,dy+2,TILE-2,3); ctx.fillRect(dx+1,dy+8,TILE-2,3); ctx.fillRect(dx+1,dy+14,TILE-2,3);
    }

    // Roof-slope corner cuts — triangular shadow covers rectangular wall corners
    {const _roofH=wallY-y,_slope=(w/2+3)/_roofH;
    const _cW=Math.round(w*0.1),_cH=Math.round(_cW/_slope);
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.moveTo(x,wallY); ctx.lineTo(x+_cW,wallY); ctx.lineTo(x,wallY+_cH); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x+w,wallY); ctx.lineTo(x+w-_cW,wallY); ctx.lineTo(x+w,wallY+_cH); ctx.closePath(); ctx.fill();}

  } else {
    // ── NAMED BUILDINGS ──────────────────────────────────────

    if(b.id==='tavern'){
      const wallY2=y+Math.floor(h*0.35), wallH2=h-Math.floor(h*0.35);
      ctx.fillStyle='#6a3a14'; ctx.fillRect(x,wallY2,w,wallH2);
      _planks(x,wallY2,w,wallH2,0.1);
      ctx.fillStyle='#2a1408'; ctx.fillRect(x,wallY2,3,wallH2); ctx.fillRect(x+w-3,wallY2,3,wallH2); ctx.fillRect(x+Math.floor(w*0.5)-1,wallY2,3,wallH2); ctx.fillRect(x,wallY2+Math.floor(wallH2*0.45),w,2);
      ctx.strokeStyle='#2a1408'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(x+3,wallY2); ctx.lineTo(x+Math.floor(w*0.5)-1,wallY2+Math.floor(wallH2*0.45)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+Math.floor(w*0.5)+2,wallY2); ctx.lineTo(x+w-3,wallY2+Math.floor(wallH2*0.45)); ctx.stroke();
      ctx.fillStyle='#7a1a08'; ctx.beginPath(); ctx.moveTo(x-4,wallY2+2); ctx.lineTo(x+w+4,wallY2+2); ctx.lineTo(x+w*0.6,y); ctx.lineTo(x+w*0.4,y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY2;ry+=4){ const t=(ry-y)/(wallY2-y); ctx.beginPath(); ctx.moveTo(x-4*t,ry); ctx.lineTo(x+w+4*t,ry); ctx.stroke(); }
      ctx.fillStyle='#5a1008'; ctx.fillRect(x-4,wallY2-1,w+8,3);
      const tglow=ctx.createRadialGradient(x+w*0.3,wallY2+5,0,x+w*0.3,wallY2+5,20); tglow.addColorStop(0,'rgba(255,140,30,0.2)'); tglow.addColorStop(1,'rgba(255,140,30,0)');
      ctx.fillStyle=tglow; ctx.fillRect(x,wallY2,w,wallH2);
      _win(x+4,wallY2+4,10,8,'rgba(255,180,50,0.4)');
      _win(x+Math.floor(w*0.5)-4,wallY2+4,10,8,'rgba(255,180,50,0.35)');
      _win(x+w-14,wallY2+4,10,8,'rgba(255,180,50,0.3)');
      ctx.fillStyle='#5a3010'; ctx.fillRect(x-2,wallY2+wallH2-12,8,11); ctx.fillStyle='#7a4820'; ctx.fillRect(x-2,wallY2+wallH2-12,8,3); ctx.fillStyle='#c08020'; ctx.fillRect(x-2,wallY2+wallH2-9,8,1); ctx.fillRect(x-2,wallY2+wallH2-5,8,1); ctx.fillStyle='#4a2810'; ctx.fillRect(x-2,wallY2+wallH2-1,8,2); ctx.fillStyle='#5a3010'; ctx.fillRect(x+8,wallY2+wallH2-8,7,8);
      ctx.fillStyle='#5a3820'; ctx.fillRect(x+Math.floor(w*0.75),y-8,6,wallY2-y+4); ctx.fillStyle='#3a2010'; ctx.fillRect(x+Math.floor(w*0.75)-1,y-9,8,3);
      ctx.globalAlpha=0.35+0.2*Math.sin(st2); ctx.fillStyle='#b0a898'; ctx.beginPath(); ctx.arc(x+Math.floor(w*0.75)+3,y-13+Math.sin(st2)*3,5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#c0b8a8'; ctx.beginPath(); ctx.arc(x+Math.floor(w*0.75)+5,y-19+Math.sin(st2+1)*2,4,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      _door(dx+1,dy,TILE-2,TILE,'#5a3010');
      ctx.fillStyle='#3a2008'; ctx.fillRect(dx,dy,2,TILE); ctx.fillRect(dx+TILE-2,dy,2,TILE); ctx.fillRect(dx,dy,TILE,2);
      _sign(x+w/2,wallY2+4,b.label,near2);

    } else if(b.id==='inn'){
      const wallY2=y+Math.floor(h*0.38), wallH2=h-Math.floor(h*0.38);
      ctx.fillStyle='#7a5a30'; ctx.fillRect(x,wallY2,w,wallH2);
      _planks(x,wallY2,w,wallH2,0.08);
      ctx.fillStyle='#3a2010'; ctx.fillRect(x,wallY2,2,wallH2); ctx.fillRect(x+w-2,wallY2,2,wallH2); ctx.fillRect(x,wallY2+Math.floor(wallH2*0.48),w,2);
      ctx.fillStyle='#6a3a18'; ctx.beginPath(); ctx.moveTo(x-3,wallY2+2); ctx.lineTo(x+w+3,wallY2+2); ctx.lineTo(x+w*0.55,y+2); ctx.lineTo(x+w*0.45,y+2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY2;ry+=5){ const t=(ry-y)/(wallY2-y); ctx.beginPath(); ctx.moveTo(x-3*t,ry); ctx.lineTo(x+w+3*t,ry); ctx.stroke(); }
      ctx.fillStyle='#7a3a18'; ctx.fillRect(x+w/2-5,y+4,10,8); _win(x+w/2-4,y+5,8,6,'rgba(255,200,100,0.3)');
      _win(x+3,wallY2+3,8,7,'rgba(255,190,80,0.3)'); _win(x+w-11,wallY2+3,8,7,'rgba(255,190,80,0.3)');
      const loY2=wallY2+Math.floor(wallH2*0.52)+2;
      _win(x+3,loY2,8,7,'rgba(255,190,80,0.25)'); _win(x+w-11,loY2,8,7,'rgba(255,190,80,0.25)');
      ctx.fillStyle='#8a3010'; ctx.beginPath(); ctx.moveTo(dx-3,dy+1); ctx.lineTo(dx+TILE+3,dy+1); ctx.lineTo(dx+TILE,dy-5); ctx.lineTo(dx,dy-5); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(dx-3,dy+1,TILE+6,2);
      _door(dx+2,dy,TILE-4,TILE,'#5a3010');
      _sign(x+w/2,wallY2+3,b.label,near2);

    } else if(b.id==='temple'){
      const wallY2=y+Math.floor(h*0.3), wallH2=h-Math.floor(h*0.3);
      ctx.fillStyle='#5050a0'; ctx.fillRect(x,wallY2,w,wallH2);
      _bricks(x,wallY2,w,wallH2,0.12);
      ctx.fillStyle='rgba(100,120,255,0.08)'; ctx.fillRect(x,wallY2,w,wallH2);
      ctx.fillStyle='#1a1a7a'; ctx.beginPath(); ctx.moveTo(x-2,wallY2+2); ctx.lineTo(x+w+2,wallY2+2); ctx.lineTo(x+w/2,y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=0.5;
      for(let ry=y+5;ry<wallY2;ry+=5){ const t=(ry-y)/(wallY2-y); ctx.beginPath(); ctx.moveTo(x-2*t,ry); ctx.lineTo(x+w+2*t,ry); ctx.stroke(); }
      ctx.fillStyle='#9090e0'; ctx.fillRect(x+w/2-1,y-4,3,8); ctx.fillRect(x+w/2-4,y+1,9,3);
      ctx.fillStyle='rgba(150,180,255,0.6)'; ctx.fillRect(x+w/2,y-4,1,8); ctx.fillRect(x+w/2-4,y+2,9,1);
      [[x,wallY2],[x+w-5,wallY2]].forEach(([cx2,cy2])=>{ ctx.fillStyle='#6060b0'; ctx.fillRect(cx2,cy2,5,wallH2); ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(cx2,cy2,2,wallH2); ctx.fillStyle='#4040a0'; ctx.fillRect(cx2,cy2,5,3); ctx.fillRect(cx2,cy2+wallH2-3,5,3); });
      const aw2=14,ah2=16,awx2=x+w/2-7,awy2=wallY2+6;
      ctx.fillStyle='#0a0a30'; ctx.fillRect(awx2,awy2+5,aw2,ah2-5); ctx.beginPath(); ctx.arc(awx2+aw2/2,awy2+5,aw2/2,Math.PI,0); ctx.fill();
      const bglow=ctx.createRadialGradient(awx2+aw2/2,awy2+10,0,awx2+aw2/2,awy2+10,aw2); bglow.addColorStop(0,'rgba(80,120,255,0.5)'); bglow.addColorStop(1,'rgba(80,120,255,0)');
      ctx.fillStyle=bglow; ctx.fillRect(awx2,awy2,aw2,ah2);
      ctx.fillStyle='rgba(150,180,255,0.6)'; ctx.fillRect(awx2+aw2/2-1,awy2+2,2,ah2+2); ctx.fillRect(awx2+1,awy2+8,aw2-2,2);
      ctx.strokeStyle='#4040a0'; ctx.lineWidth=1; ctx.strokeRect(awx2-1,awy2-1,aw2+2,ah2+2); ctx.beginPath(); ctx.arc(awx2+aw2/2,awy2+5,aw2/2+1,Math.PI,0); ctx.stroke();
      const sglow=ctx.createRadialGradient(x+w/2,wallY2+10,0,x+w/2,wallY2+10,25); sglow.addColorStop(0,'rgba(80,100,255,0.15)'); sglow.addColorStop(1,'rgba(80,100,255,0)');
      ctx.fillStyle=sglow; ctx.fillRect(x,wallY2,w,wallH2);
      ctx.fillStyle='#4848a0'; ctx.fillRect(dx-3,dy+TILE-2,TILE+6,3); ctx.fillStyle='#5858b0'; ctx.fillRect(dx-5,dy+TILE,TILE+10,3);
      _door(dx+2,dy,TILE-4,TILE,'#101040');
      ctx.fillStyle='#3030a0'; ctx.beginPath(); ctx.arc(dx+TILE/2,dy,TILE/2-2,Math.PI,0); ctx.fill();
      _sign(x+w/2,wallY2+3,b.label,near2);

    } else if(b.id==='forge'){
      const wallY2=y+Math.floor(h*0.28), wallH2=h-Math.floor(h*0.28);
      ctx.fillStyle='#3a2818'; ctx.fillRect(x,wallY2,w,wallH2);
      _bricks(x,wallY2,w,wallH2,0.18);
      ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(x,wallY2,w,6); ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(x+Math.floor(w*0.7),wallY2,Math.floor(w*0.3),wallH2);
      ctx.fillStyle='#2a1808'; ctx.beginPath(); ctx.moveTo(x-2,wallY2+2); ctx.lineTo(x+w+2,wallY2+2); ctx.lineTo(x+w*0.6,y+4); ctx.lineTo(x+w*0.4,y+4); ctx.closePath(); ctx.fill();
      const chfx=x+Math.floor(w*0.65);
      ctx.fillStyle='#3a2010'; ctx.fillRect(chfx,y-12,10,wallY2-y+5); ctx.fillStyle='#2a1408'; ctx.fillRect(chfx-2,y-14,14,4);
      const cglow=ctx.createRadialGradient(chfx+5,y-14,0,chfx+5,y-14,18); cglow.addColorStop(0,`rgba(255,80,10,${0.5+0.3*Math.sin(st2*3)})`); cglow.addColorStop(1,'rgba(255,80,10,0)');
      ctx.fillStyle=cglow; ctx.beginPath(); ctx.arc(chfx+5,y-14,18,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=0.4+0.2*Math.sin(st2*2); ctx.fillStyle='#5a4838'; ctx.beginPath(); ctx.arc(chfx+5,y-18+Math.sin(st2)*3,5,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=0.3+0.15*Math.sin(st2*2+1); ctx.fillStyle='#4a3828'; ctx.beginPath(); ctx.arc(chfx+7,y-25+Math.sin(st2+0.5)*2,4,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      const fglow=ctx.createRadialGradient(dx+TILE/2,dy+TILE/2,0,dx+TILE/2,dy+TILE/2,20); fglow.addColorStop(0,`rgba(255,100,0,${0.2+0.1*Math.sin(st2*3)})`); fglow.addColorStop(1,'rgba(255,100,0,0)');
      ctx.fillStyle=fglow; ctx.fillRect(x,wallY2,w,wallH2);
      ctx.fillStyle='#1a0c04'; ctx.fillRect(x+4,wallY2+8,4,3); ctx.fillRect(x+w-8,wallY2+8,4,3);
      ctx.fillStyle=`rgba(255,80,10,${0.15+0.1*Math.sin(st2*3)})`; ctx.fillRect(x+4,wallY2+8,4,3); ctx.fillRect(x+w-8,wallY2+8,4,3);
      ctx.fillStyle='#403028'; ctx.fillRect(dx-8,dy+TILE-8,10,5); ctx.fillRect(dx-6,dy+TILE-11,6,4); ctx.fillRect(dx-5,dy+TILE-3,4,3);
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(dx-8,dy+TILE-8,10,1);
      _door(dx+2,dy,TILE-4,TILE,'#2a1008');
      _sign(x+w/2,wallY2+4,b.label,near2);

    } else if(b.id==='store'){
      const wallY2=y+Math.floor(h*0.35), wallH2=h-Math.floor(h*0.35);
      ctx.fillStyle='#4a6030'; ctx.fillRect(x,wallY2,w,wallH2);
      _planks(x,wallY2,w,wallH2,0.08);
      ctx.fillStyle='rgba(50,100,30,0.15)'; ctx.fillRect(x,wallY2,w,wallH2);
      _roof(x,y,w,wallY2-y,'#3a5020',3);
      ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=0.5;
      for(let ry=y+4;ry<wallY2;ry+=4){ const t=(ry-y)/(wallY2-y); ctx.beginPath(); ctx.moveTo(x-3*t,ry); ctx.lineTo(x+w+3*t,ry); ctx.stroke(); }
      ctx.fillStyle='#3a5820'; ctx.beginPath(); ctx.moveTo(x-3,wallY2+4); ctx.lineTo(x+w+3,wallY2+4); ctx.lineTo(x+w,wallY2-1); ctx.lineTo(x,wallY2-1); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.15)'; for(let sx3=x;sx3<x+w;sx3+=6) ctx.fillRect(sx3,wallY2-1,3,5);
      _win(x+3,wallY2+8,10,9,'rgba(150,220,100,0.25)'); _win(x+w-13,wallY2+8,10,9,'rgba(150,220,100,0.25)');
      ctx.fillStyle='#e04020'; ctx.beginPath(); ctx.arc(dx-5,dy+TILE-3,3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#f06020'; ctx.beginPath(); ctx.arc(dx+TILE+4,dy+TILE-4,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#d04010'; ctx.fillRect(dx+TILE+2,dy+TILE-4,4,1);
      ctx.fillStyle='#206010'; ctx.fillRect(dx+TILE+4,dy+TILE-8,1,5);
      _door(dx+2,dy,TILE-4,TILE,'#3a4820');
      _sign(x+w/2,wallY2+4,b.label,near2);

    } else if(b.id==='study'){
      const wallY2=y+Math.floor(h*0.32), wallH2=h-Math.floor(h*0.32);
      ctx.fillStyle='#2a1840'; ctx.fillRect(x,wallY2,w,wallH2);
      _bricks(x,wallY2,w,wallH2,0.15);
      ctx.fillStyle='rgba(100,50,200,0.08)'; ctx.fillRect(x,wallY2,w,wallH2);
      ctx.fillStyle='#200a38'; ctx.beginPath(); ctx.moveTo(x-2,wallY2+2); ctx.lineTo(x+w+2,wallY2+2); ctx.lineTo(x+w/2,y-2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(100,50,200,0.2)'; ctx.lineWidth=0.5;
      for(let ry=y+5;ry<wallY2;ry+=5){ const t=(ry-y)/(wallY2-y); ctx.beginPath(); ctx.moveTo(x-2*t,ry); ctx.lineTo(x+w+2*t,ry); ctx.stroke(); }
      ctx.fillStyle='#8050c0'; ctx.beginPath(); ctx.arc(x+w/2,y+1,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#200a38'; ctx.beginPath(); ctx.arc(x+w/2+2,y,4,0,Math.PI*2); ctx.fill();
      const awcx=x+w/2, awcy=wallY2+12;
      ctx.fillStyle='#0a0520'; ctx.beginPath(); ctx.arc(awcx,awcy,9,0,Math.PI*2); ctx.fill();
      const aglow=ctx.createRadialGradient(awcx,awcy,0,awcx,awcy,9); aglow.addColorStop(0,'rgba(150,80,255,0.6)'); aglow.addColorStop(0.5,'rgba(80,40,200,0.3)'); aglow.addColorStop(1,'rgba(40,10,120,0)');
      ctx.fillStyle=aglow; ctx.beginPath(); ctx.arc(awcx,awcy,9,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(150,100,255,0.5)'; ctx.lineWidth=1;
      for(let ang=0;ang<Math.PI;ang+=Math.PI/3){ ctx.beginPath(); ctx.moveTo(awcx+Math.cos(ang)*9,awcy+Math.sin(ang)*9); ctx.lineTo(awcx-Math.cos(ang)*9,awcy-Math.sin(ang)*9); ctx.stroke(); }
      ctx.strokeStyle='rgba(180,140,255,0.8)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(awcx,awcy,9,0,Math.PI*2); ctx.stroke();
      const smglow=ctx.createRadialGradient(x+w/2,wallY2+8,0,x+w/2,wallY2+8,22); smglow.addColorStop(0,'rgba(100,50,200,0.18)'); smglow.addColorStop(1,'rgba(100,50,200,0)');
      ctx.fillStyle=smglow; ctx.fillRect(x,wallY2,w,wallH2);
      _win(x+3,wallY2+22,7,7,'rgba(150,80,255,0.3)');
      _door(dx+2,dy,TILE-4,TILE,'#180830');
      ctx.strokeStyle='#8040c0'; ctx.lineWidth=1; ctx.strokeRect(dx+2,dy,TILE-4,TILE);
      _sign(x+w/2,wallY2+3,b.label,near2);

    } else if(b.id==='market'){
      const wallY2=y+Math.floor(h*0.3), wallH2=h-Math.floor(h*0.3);
      ctx.fillStyle='#7a6030'; ctx.fillRect(x,wallY2,w,wallH2);
      _planks(x,wallY2,w,wallH2,0.09);
      _roof(x,y,w,wallY2-y,'#8a4018',4);
      ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.5;
      for(let ry=y+5;ry<wallY2;ry+=5){ const t=(ry-y)/(wallY2-y); ctx.beginPath(); ctx.moveTo(x-4*t,ry); ctx.lineTo(x+w+4*t,ry); ctx.stroke(); }
      const bunts=['#c02020','#2040c0','#20a020','#c0a020','#8020c0'];
      for(let bi=0;bi<5;bi++){ const bx=x+4+bi*(w-8)/4; ctx.fillStyle=bunts[bi]; ctx.beginPath(); ctx.moveTo(bx,wallY2+2); ctx.lineTo(bx+6,wallY2+2); ctx.lineTo(bx+3,wallY2+7); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle='rgba(80,60,20,0.6)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x+4,wallY2+2); ctx.lineTo(x+w-4,wallY2+2); ctx.stroke();
      _win(x+4,wallY2+10,12,10,'rgba(255,220,100,0.3)'); _win(x+w-16,wallY2+10,12,10,'rgba(255,220,100,0.3)');
      _door(dx+2,dy,TILE-4,TILE,'#5a3810');
      _sign(x+w/2,wallY2+3,b.label,near2);

    } else if(b.id==='proving'){
      // ── The Proving Grounds — warm stone training hall with bronze accents ──
      const wallY2=y+Math.floor(h*0.3), wallH2=h-Math.floor(h*0.3);
      ctx.fillStyle='#5a4028'; ctx.fillRect(x,wallY2,w,wallH2);
      _bricks(x,wallY2,w,wallH2,0.12);
      ctx.fillStyle='rgba(180,120,40,0.06)'; ctx.fillRect(x,wallY2,w,wallH2);
      // Roof — peaked stone
      ctx.fillStyle='#6a3418'; ctx.beginPath(); ctx.moveTo(x-2,wallY2+2); ctx.lineTo(x+w+2,wallY2+2); ctx.lineTo(x+w*0.55,y+2); ctx.lineTo(x+w*0.45,y+2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=0.5;
      for(let ry=y+5;ry<wallY2;ry+=5){ const t=(ry-y)/(wallY2-y); ctx.beginPath(); ctx.moveTo(x-2*t,ry); ctx.lineTo(x+w+2*t,ry); ctx.stroke(); }
      // Decorative crossed swords on roof peak
      const peakX=x+w/2, peakY=y+6;
      ctx.strokeStyle='#c08040'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(peakX-6,peakY-4); ctx.lineTo(peakX+6,peakY+4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(peakX+6,peakY-4); ctx.lineTo(peakX-6,peakY+4); ctx.stroke();
      ctx.fillStyle='#c08040'; ctx.beginPath(); ctx.arc(peakX,peakY,2,0,Math.PI*2); ctx.fill();
      // Stone pillars at corners
      [[x,wallY2],[x+w-5,wallY2]].forEach(([cx2,cy2])=>{
        ctx.fillStyle='#6a5030'; ctx.fillRect(cx2,cy2,5,wallH2);
        ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(cx2,cy2,2,wallH2);
        ctx.fillStyle='#5a4020'; ctx.fillRect(cx2,cy2,5,3); ctx.fillRect(cx2,cy2+wallH2-3,5,3);
      });
      // Window — warm glow
      const wglow=ctx.createRadialGradient(x+w/2,wallY2+12,0,x+w/2,wallY2+12,18);
      wglow.addColorStop(0,'rgba(200,140,40,0.2)'); wglow.addColorStop(1,'rgba(200,140,40,0)');
      ctx.fillStyle=wglow; ctx.fillRect(x,wallY2,w,wallH2);
      _win(x+4,wallY2+8,10,9,'rgba(220,160,60,0.35)');
      _win(x+w-14,wallY2+8,10,9,'rgba(220,160,60,0.3)');
      // Weapon rack silhouettes beside door
      ctx.fillStyle='#3a2810'; ctx.fillRect(dx-8,dy+2,5,TILE-4); ctx.fillRect(dx+TILE+3,dy+2,5,TILE-4);
      ctx.fillStyle='#554020'; ctx.fillRect(dx-7,dy+3,3,2); ctx.fillRect(dx-7,dy+7,3,2); ctx.fillRect(dx-7,dy+11,3,2);
      ctx.fillRect(dx+TILE+4,dy+3,3,2); ctx.fillRect(dx+TILE+4,dy+7,3,2); ctx.fillRect(dx+TILE+4,dy+11,3,2);
      _door(dx+2,dy,TILE-4,TILE,'#3a2010');
      ctx.strokeStyle='#c08040'; ctx.lineWidth=1; ctx.strokeRect(dx+2,dy,TILE-4,TILE);
      _sign(x+w/2,wallY2+3,b.label,near2);

    } else {
      const roofH2=Math.max(TILE,Math.floor(h*0.3));
      ctx.fillStyle=pal[0]; ctx.fillRect(x,y+roofH2,w,h-roofH2);
      _bricks(x,y+roofH2,w,h-roofH2,0.1);
      _roof(x,y,w,roofH2,pal[1]);
      const mwy=y+roofH2+Math.floor((h-roofH2)/2)-4;
      _win(x+4,mwy,10,9,'rgba(255,200,100,0.25)');
      if(w>TILE*4) _win(x+w-14,mwy,10,9,'rgba(255,200,100,0.2)');
      _door(dx+2,dy,TILE-4,TILE,pal[3]);
      if(b.label) _sign(x+w/2,y+roofH2+4,b.label,near2);
    }
  }
}

// ── Draw decor ────────────────────────────────────────────
function _drawDecor(ctx, d, a, cx, cy){
  const sx=d.tx*TILE-cx, sy=d.ty*TILE-cy;
  if(sx+TILE*2<0||sy+TILE*2<0||sx>_logW()||sy>_logH()) return;
  if(d.type==='tree'){
    ctx.fillStyle=a.treeTrunk; ctx.fillRect(sx+6,sy+9,4,7);
    ctx.fillStyle=a.treeTop;
    ctx.fillRect(sx+3,sy+6,10,5); ctx.fillRect(sx+2,sy+3,12,5); ctx.fillRect(sx+4,sy+0,8,5);
    ctx.fillStyle='rgba(255,255,255,0.04)'; ctx.fillRect(sx+4,sy+1,3,3);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(sx+2,sy+9,12,2);
  } else if(d.type==='lamp'){
    // Ground light pool
    const _lglx=sx+13,_lgly=sy+TILE+4;
    const _lgR=14+2*Math.sin(Date.now()*0.003);
    const _lgg=ctx.createRadialGradient(_lglx,_lgly,0,_lglx,_lgly,_lgR);
    _lgg.addColorStop(0,`rgba(${a.tr},${a.tg},${a.tb},0.18)`);
    _lgg.addColorStop(1,`rgba(${a.tr},${a.tg},${a.tb},0)`);
    ctx.fillStyle=_lgg; ctx.beginPath(); ctx.arc(_lglx,_lgly,_lgR,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(80,60,30,0.9)'; ctx.fillRect(sx+7,sy+5,2,11); ctx.fillRect(sx+7,sy+5,6,2);
    const lx=sx+13,ly=sy+3;
    ctx.fillStyle=`rgb(${a.tr},${a.tg},${a.tb})`; ctx.fillRect(lx-3,ly,6,6);
    ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fillRect(lx-2,ly+1,2,2);
    const gR=18+2*Math.sin(Date.now()*0.003);
    const g=ctx.createRadialGradient(lx,ly+3,0,lx,ly+3,gR);
    g.addColorStop(0,`rgba(${a.tr},${a.tg},${a.tb},0.25)`);
    g.addColorStop(1,`rgba(${a.tr},${a.tg},${a.tb},0)`);
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(lx,ly+3,gR,0,Math.PI*2); ctx.fill();
  } else if(d.type==='well'){
    ctx.fillStyle='#3a2a18'; ctx.fillRect(sx+2,sy+8,12,8);
    ctx.fillStyle='#6a5a38'; ctx.fillRect(sx+1,sy+6,14,4);
    ctx.fillStyle='#5a4a30'; ctx.fillRect(sx+2,sy+2,2,7); ctx.fillRect(sx+12,sy+2,2,7); ctx.fillRect(sx+2,sy+2,12,2);
    ctx.fillStyle=`rgba(60,100,160,0.5)`; ctx.fillRect(sx+3,sy+10,10,4);
  } else if(d.type==='barrel'){
    ctx.fillStyle='#4a3018'; ctx.fillRect(sx+3,sy+3,10,11);
    ctx.fillStyle='#6a4a28'; ctx.fillRect(sx+3,sy+3,10,3); ctx.fillRect(sx+3,sy+11,10,3);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(sx+3,sy+6,10,1); ctx.fillRect(sx+3,sy+9,10,1);
  } else if(d.type==='stall'){
    ctx.fillStyle='#5a3a10'; ctx.fillRect(sx,sy+6,TILE,TILE-6);
    ctx.fillStyle='#c87020'; ctx.fillRect(sx-2,sy+2,TILE+4,6);
    ctx.fillStyle='rgba(200,100,20,0.3)'; ctx.fillRect(sx-2,sy+2,TILE+4,3);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(sx,sy+7,TILE,1);
  } else if(d.type==='grave'){
    ctx.fillStyle='#504848'; ctx.fillRect(sx+4,sy+4,8,12);
    ctx.fillStyle='#302828'; ctx.fillRect(sx+3,sy+2,10,5);
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(sx+4,sy+3,4,1);
  } else if(d.type==='stashChest'){
    const near=_nearInteractable&&_nearInteractable.type==='stashChest';
    const stash = typeof getStash==='function' ? getStash() : [];
    const hasItems = stash.length > 0;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(sx+2,sy+15,12,3);
    // Chest body
    ctx.fillStyle='#5a3a10'; ctx.fillRect(sx+1,sy+8,14,8);
    ctx.fillStyle='#7a5020'; ctx.fillRect(sx+1,sy+8,14,3); // lid highlight
    ctx.fillStyle='#3a2008'; ctx.fillRect(sx+1,sy+10,14,1); // lid seam
    // Lid
    ctx.fillStyle='#6a4818'; ctx.fillRect(sx+1,sy+5,14,5);
    ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+1,sy+5,14,1);
    // Metal bands
    ctx.fillStyle='#c8a020'; ctx.fillRect(sx+1,sy+8,14,1); ctx.fillRect(sx+1,sy+14,14,1);
    ctx.fillRect(sx+6,sy+5,2,10); ctx.fillRect(sx+9,sy+5,2,10);
    // Lock
    ctx.fillStyle='#c8a020'; ctx.fillRect(sx+7,sy+10,2,3);
    ctx.fillStyle='rgba(255,200,50,0.4)'; ctx.fillRect(sx+7,sy+10,1,1);
    // Glow if has items
    if(hasItems){
      const t=Date.now()*0.002;
      const pulse=0.4+0.3*Math.sin(t*2);
      const hg=ctx.createRadialGradient(sx+8,sy+8,0,sx+8,sy+8,12);
      hg.addColorStop(0,`rgba(200,160,40,${pulse*0.4})`);
      hg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(sx+8,sy+8,12,0,Math.PI*2); ctx.fill();
    }
    // Label
    ctx.font='bold 4px "Press Start 2P",monospace';
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillStyle=near?'#ffd84a':'rgba(200,160,60,0.85)';
    ctx.fillText('STASH'+(hasItems?' ('+stash.length+')':''),sx+8,sy-2);
  } else if(d.type==='graceVault'){
    const near=_nearInteractable&&_nearInteractable.type==='graceVault';
    const t3=Date.now()*0.001;
    const pulse=0.5+0.5*Math.sin(t3*2);
    // Check for unequipped graces
    let invCount=0;
    try{ const gr=getSlotGraces(); invCount=gr.inventory.length; }catch(e){}
    // Shadow
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(sx+1,sy+15,14,3);
    // Stone plinth base
    ctx.fillStyle='#3a3040'; ctx.fillRect(sx+2,sy+10,12,6);
    ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(sx+2,sy+10,12,1);
    // Column shaft
    ctx.fillStyle='#483858'; ctx.fillRect(sx+4,sy+1,8,10);
    ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect(sx+4,sy+1,2,10);
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(sx+10,sy+1,2,10);
    // Capital top
    ctx.fillStyle='#584868'; ctx.fillRect(sx+2,sy,12,3);
    // Glowing gem
    const gemCol=`rgba(180,100,255,${0.7+0.3*pulse})`;
    ctx.fillStyle=gemCol; ctx.fillRect(sx+6,sy-3,5,5);
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fillRect(sx+7,sy-2,2,2);
    // Gem halo
    const hr=9+7*pulse;
    const hg=ctx.createRadialGradient(sx+8,sy-1,0,sx+8,sy-1,hr);
    hg.addColorStop(0,`rgba(180,80,255,${0.3*pulse})`);
    hg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(sx+8,sy-1,hr,0,Math.PI*2); ctx.fill();
    // Label
    ctx.font='bold 4px "Press Start 2P",monospace';
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillStyle=near?'#ffd84a':'rgba(180,120,255,0.85)';
    ctx.fillText('GRACE VAULT',sx+8,sy-6);
    // Unequipped graces indicator badge
    if(invCount>0){
      const bx=sx+14, by=sy-5;
      const badgePulse=0.7+0.3*Math.sin(t3*3);
      ctx.fillStyle=`rgba(200,168,75,${badgePulse})`;
      ctx.beginPath(); ctx.arc(bx,by,3.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#000';
      ctx.font='bold 3px "Press Start 2P",monospace';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(invCount>9?'!':String(invCount),bx,by);
    }
  }
}

// ── Draw NPC (wanderer or interior) ──────────────────────
function _drawNPC(ctx, npc, wx, wy, facing, cx, cy, near, label){
  const sx=Math.round(wx-cx), sy=Math.round(wy-cy);
  if(sx<-TILE*2||sy<-TILE*2||sx>_logW()+TILE||sy>_logH()+TILE) return;

  const t=Date.now()*0.003;
  // Walking bob — only if NPC is moving (non-stationary) 
  const moving = !npc.stationary && npc._moving;
  const legSwing = moving ? Math.sin(t*3.5) : 0;
  const bob = moving ? Math.abs(Math.sin(t*3.5))*0.8 : Math.sin(t*0.5)*0.5;

  // ── Shadow ──
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(sx,sy+14,5,2,0,0,Math.PI*2); ctx.fill();

  // ── Body colour from npc.color ──
  const col = npc.color||'#808080';

  // ── Legs ──
  const lLeg = Math.round(legSwing*2);
  const rLeg = -lLeg;
  ctx.fillStyle='#2a1c10';
  ctx.fillRect(sx-3, sy+8+lLeg, 3, 6);
  ctx.fillRect(sx+1,  sy+8+rLeg, 3, 6);
  // Boots
  ctx.fillStyle='#1a1008';
  ctx.fillRect(sx-4, sy+13+lLeg, 4, 2);
  ctx.fillRect(sx+1,  sy+13+rLeg, 5, 2);
  // Boot highlight
  ctx.fillStyle='rgba(255,255,255,0.07)';
  ctx.fillRect(sx-4, sy+13+lLeg, 2, 1);
  ctx.fillRect(sx+1,  sy+13+rLeg, 2, 1);

  // ── Torso ──
  ctx.fillStyle=col;
  ctx.fillRect(sx-4, sy+1-bob, 9, 8);
  // Shoulder highlight
  ctx.fillStyle='rgba(255,255,255,0.12)';
  ctx.fillRect(sx-4, sy+1-bob, 9, 2);
  // Waist shadow
  ctx.fillStyle='rgba(0,0,0,0.2)';
  ctx.fillRect(sx-4, sy+7-bob, 9, 2);

  // ── Belt ──
  ctx.fillStyle='#3a2010';
  ctx.fillRect(sx-4, sy+8-bob, 9, 2);
  // Belt buckle
  ctx.fillStyle='#b08020';
  ctx.fillRect(sx-1, sy+8-bob, 3, 2);
  ctx.fillStyle='rgba(255,255,255,0.3)';
  ctx.fillRect(sx-1, sy+8-bob, 1, 1);

  // ── Arms ──
  const lArm = moving ? Math.round(-legSwing*2) : 0;
  const rArm = -lArm;
  ctx.fillStyle=col;
  ctx.fillRect(sx-6, sy+2-bob+lArm, 3, 6);
  ctx.fillRect(sx+4,  sy+2-bob+rArm, 3, 6);
  // Hands (skin)
  ctx.fillStyle='#d4a870';
  ctx.fillRect(sx-6, sy+7-bob+lArm, 3, 3);
  ctx.fillRect(sx+4,  sy+7-bob+rArm, 3, 3);

  // ── Head ──
  ctx.fillStyle='#d4a870';
  ctx.fillRect(sx-3, sy-6-bob, 7, 7);
  // Ear left
  ctx.fillRect(sx-4, sy-5-bob, 2, 3);
  // Ear right
  ctx.fillRect(sx+4, sy-5-bob, 2, 3);
  // Ear shade
  ctx.fillStyle='rgba(0,0,0,0.15)';
  ctx.fillRect(sx-4, sy-5-bob, 1, 3);
  ctx.fillRect(sx+5, sy-5-bob, 1, 3);
  // Chin shadow
  ctx.fillStyle='rgba(0,0,0,0.1)';
  ctx.fillRect(sx-3, sy-bob, 7, 1);

  // ── Hair (colour varies by npc id) ──
  const hairCols = {
    // ── Interior NPCs ──
    rook:'#3a1c08',        // dark brown — grizzled tavern keep
    aldric:'#1a0c04',      // near-black — soot-darkened smith
    seraphine:'#f4f0e8',   // white-blonde — priestess
    malachar:'#180830',    // deep purple-black — wizard
    mirela:'#a03010',      // auburn-red — merchant woman
    innkeeper:'#7a3010',   // warm chestnut — Rosalind bun
    patron1:'#6a5030',     // dirty blond — Old Ferris
    patron2:'#c06080',     // pinkish auburn — Marta
    bard:'#204060',        // dark teal-blue — Pell the bard
    apprentice:'#3a2010',  // brown — Tam
    scribe:'#706050',      // mousy brown — Petra
    worshipper1:'#808080', // grey — Brother Ewan
    worshipper2:'#c0a0c0', // lilac-grey — Sister Lena
    vendor1:'#a07010',     // golden — Cassia
    vendor2:'#504060',     // dark purple-grey — Dunk
    shopper:'#806040',     // tawny — generic shopper
    traveler:'#403020',    // dark brown — vagrant
    customer:'#905030',    // copper — customer
    // ── Wanderers / outdoor NPCs ──
    oldwoman:'#d0ccc0',    // silver-white — Elspeth
    child1:'#c08020',      // sandy-golden — Kit
    child2:'#90c8a0',      // light ash — Rue
    child3:'#e0c060',      // bright yellow — Pip
    guard1:'#1a1818',      // near-black — gate guard (veteran)
    guard2:'#4a4038',      // dark grey-brown — south guard
    merchant:'#b07820',    // rich amber — traveling merchant
    farmer1:'#6a4820',     // dark straw — Harlan
    farmer2:'#c09040',     // warm blonde — Bess
    scholar:'#504878',     // dusty lavender — Brother Edwyn
    priest:'#e8e4e0',      // pale grey-white — Father Oswin
    soldier:'#3a3820',     // dark olive — Sergeant Dael
    beggar:'#5a4838',      // greying brown — Old Cray
    healer:'#d04060',      // deep rose — Mira
    fisher:'#3a6070',      // dark teal — Cord
    smith2:'#802818',      // dark rust-red — Beryl
    weaver:'#6040a0',      // violet — Syl
    tanner:'#3a2c18',      // dark brown — Hugh
    refugee:'#908070',     // dusty grey-brown — refugee
    soldier2:'#283828',    // dark forest green-brown — scout
  };
  const hairCol = hairCols[npc.id] || '#3a2810';
  ctx.fillStyle=hairCol;
  // Hair top + sides
  ctx.fillRect(sx-3, sy-6-bob, 7, 3);
  ctx.fillRect(sx-4, sy-5-bob, 2, 2); // left tuft
  ctx.fillRect(sx+4, sy-5-bob, 2, 1); // right tuft
  // Hair highlight
  ctx.fillStyle='rgba(255,255,255,0.1)';
  ctx.fillRect(sx-2, sy-6-bob, 2, 1);

  // ── Eyes (by facing direction) ──
  ctx.fillStyle='#1a1208';
  if(facing===2){      // south — front facing, eyes middle
    ctx.fillRect(sx-2, sy-3-bob, 1, 1);
    ctx.fillRect(sx+1,  sy-3-bob, 1, 1);
    // Nose dot
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(sx, sy-2-bob, 1, 1);
  } else if(facing===0){ // north — back, no eyes visible, back of head
    ctx.fillStyle=hairCol;
    ctx.fillRect(sx-3, sy-6-bob, 7, 7); // cover whole head with hair
    ctx.fillRect(sx-4, sy-5-bob, 2, 3);
    ctx.fillRect(sx+4, sy-5-bob, 2, 2);
  } else if(facing===3){ // west
    ctx.fillStyle='#1a1208';
    ctx.fillRect(sx-3, sy-4-bob, 1, 1);
    ctx.fillRect(sx-3, sy-2-bob, 1, 1);
  } else {               // east
    ctx.fillRect(sx+3, sy-4-bob, 1, 1);
    ctx.fillRect(sx+3, sy-2-bob, 1, 1);
  }

  // ── NPC-specific accessories ──
  if(npc.id==='rook'){
    // Tavern keeper — apron, holds mug
    ctx.fillStyle='#c8c0a8';
    ctx.fillRect(sx-3, sy+3-bob, 7, 6); // apron front
    ctx.fillStyle='rgba(0,0,0,0.1)'; ctx.fillRect(sx-3, sy+3-bob, 1, 6);
    // Mug in right hand
    ctx.fillStyle='#7a4a20'; ctx.fillRect(sx+4, sy+5-bob, 5, 4);
    ctx.fillStyle='rgba(200,160,60,0.9)'; ctx.fillRect(sx+5, sy+5-bob, 3, 2); // beer foam
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(sx+4, sy+8-bob, 5, 1);
    // Handle
    ctx.fillStyle='#5a3010'; ctx.fillRect(sx+8, sy+6-bob, 2, 2);
    // Bushy beard
    ctx.fillStyle='#5a3818';
    ctx.fillRect(sx-3, sy-1-bob, 7, 3);
    ctx.fillRect(sx-2, sy+1-bob, 5, 2);
  } else if(npc.id==='seraphine'){
    // Priestess — white hood/robe
    ctx.fillStyle='#e8e8f0';
    // Hood over hair (covers top and sides)
    ctx.fillRect(sx-4, sy-7-bob, 9, 5);
    ctx.fillRect(sx-5, sy-5-bob, 11, 7); // hood drape
    ctx.fillStyle='rgba(0,0,0,0.08)';
    ctx.fillRect(sx-5, sy-5-bob, 1, 7); ctx.fillRect(sx+5, sy-5-bob, 1, 7);
    // Holy symbol on chest
    ctx.fillStyle='rgba(180,200,255,0.8)';
    ctx.fillRect(sx-1, sy+2-bob, 3, 5); ctx.fillRect(sx-3, sy+4-bob, 7, 2);
    // Robe (replaces body colour)
    ctx.fillStyle='#dcdce8';
    ctx.fillRect(sx-4, sy+1-bob, 9, 8);
    ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(sx-4, sy+1-bob, 9, 1);
  } else if(npc.id==='aldric'){
    // Blacksmith — leather apron, soot, big arms
    ctx.fillStyle='#5a3820';
    ctx.fillRect(sx-3, sy+2-bob, 7, 8); // apron
    ctx.fillStyle='rgba(0,0,0,0.2)';
    ctx.fillRect(sx-3, sy+2-bob, 1, 8); ctx.fillRect(sx+3, sy+2-bob, 1, 8);
    // Soot marks on face
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.fillRect(sx-1, sy-4-bob, 2, 1); ctx.fillRect(sx+1, sy-2-bob, 2, 1);
    // Thick forearms (wider arms for a smith)
    ctx.fillStyle=col;
    ctx.fillRect(sx-7, sy+2-bob, 4, 7); ctx.fillRect(sx+4, sy+2-bob, 4, 7);
    // Heavy beard/stubble
    ctx.fillStyle='#2a1808';
    ctx.fillRect(sx-2, sy-1-bob, 5, 2);
  } else if(npc.id==='malachar'){
    // Wizard — pointed hat, robes
    // Dark robe
    ctx.fillStyle='#1a0830';
    ctx.fillRect(sx-5, sy+1-bob, 11, 8);
    ctx.fillStyle='rgba(100,50,200,0.2)';
    ctx.fillRect(sx-5, sy+1-bob, 11, 8);
    // Stars on robe
    ctx.fillStyle='rgba(200,180,255,0.5)';
    ctx.fillRect(sx-3, sy+3-bob, 1, 1); ctx.fillRect(sx+2, sy+5-bob, 1, 1); ctx.fillRect(sx, sy+2-bob, 1, 1);
    // Pointed hat
    ctx.fillStyle='#18062a';
    ctx.fillRect(sx-4, sy-7-bob, 9, 3);  // brim
    ctx.fillRect(sx-2, sy-11-bob, 5, 5); // lower cone
    ctx.fillRect(sx-1, sy-14-bob, 3, 4); // upper cone
    ctx.fillRect(sx,   sy-16-bob, 1, 3); // tip
    ctx.fillStyle='rgba(180,100,255,0.5)';
    ctx.fillRect(sx-1, sy-11-bob, 3, 1); // hat band
    // Long white beard
    ctx.fillStyle='#e0dce8';
    ctx.fillRect(sx-2, sy-1-bob, 5, 4);
    ctx.fillRect(sx-1, sy+2-bob, 3, 5);
  } else if(npc.id==='mirela'){
    // Merchant — green vest, headscarf
    ctx.fillStyle='#3a7a20';
    ctx.fillRect(sx-4, sy+1-bob, 9, 8); // green vest
    ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(sx-4, sy+1-bob, 9, 1);
    // Headscarf (over hair)
    ctx.fillStyle='#c07020';
    ctx.fillRect(sx-4, sy-7-bob, 9, 4);
    ctx.fillRect(sx-5, sy-4-bob, 2, 4); // scarf drape left
    // Earring
    ctx.fillStyle='#d0a020'; ctx.fillRect(sx+4, sy-3-bob, 1, 2);
  } else if(npc.id==='innkeeper'){
    // Innkeeper Rosalind — pink apron, bun hair
    ctx.fillStyle='#d06080';
    ctx.fillRect(sx-3, sy+2-bob, 7, 8); // pink apron
    ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(sx-3, sy+2-bob, 7, 1);
    // Hair bun (override hair)
    ctx.fillStyle='#7a3010';
    ctx.fillRect(sx-3, sy-7-bob, 7, 2);
    ctx.fillRect(sx-1, sy-9-bob, 3, 3); // bun on top
    ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(sx-1, sy-9-bob, 2, 1);
  }

  // ── Name label ──
  if(label){
    ctx.font='4px "Press Start 2P",monospace';
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    const lw=ctx.measureText(label).width+4;
    ctx.fillStyle='rgba(0,0,0,0.55)';
    ctx.fillRect(sx-lw/2, sy-18-bob, lw, 7);
    ctx.fillStyle=near?'#ffd84a':'rgba(220,200,150,0.85)';
    ctx.fillText(label, sx, sy-12-bob);
  }

  // ── Interact prompt ──
  if(near){
    const pulse=0.75+0.25*Math.sin(Date.now()*0.006);
    const txt='[E] Talk';
    ctx.font='4px "Press Start 2P",monospace';
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    const tw2=ctx.measureText(txt).width+6;
    const by=sy-26-bob;
    ctx.globalAlpha=pulse;
    ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(sx-tw2/2, by-1, tw2, 8);
    ctx.strokeStyle='#ffd84a'; ctx.lineWidth=1; ctx.strokeRect(sx-tw2/2, by-1, tw2, 8);
    ctx.fillStyle='#ffd84a'; ctx.fillText(txt, sx, by+6);
    ctx.globalAlpha=1;
  }
}
// ── Draw player ───────────────────────────────────────────
function _drawPlayer(ctx, cx, cy){
  const sx=Math.round(_pl.wx-cx), sy=Math.round(_pl.wy-cy);
  const moving=_keys['ArrowLeft']||_keys['a']||_keys['A']||_keys['ArrowRight']||_keys['d']||_keys['D']||_keys['ArrowUp']||_keys['w']||_keys['W']||_keys['ArrowDown']||_keys['s']||_keys['S'];
  const t=Date.now()*0.012;
  const bob=moving?Math.sin(t)*1.5:0;
  const legSwing=moving?Math.sin(t)*2:0;
  const f=_pl.facing; // 0=up,1=right,2=down,3=left

  // Class color schemes
  const cls=(typeof G!=='undefined'&&G)?G.classId:'fighter';
  const P={
    fighter:  {body:'#8090a8',bodyHi:'#a0b0c8',bodyLo:'#404858',belt:'#604808',buckle:'#e8c030',skin:'#e8c99a',hair:'#5a3818',hat:null,     cape:null,      weapon:'#c0c8d8',weaponHi:'#e0e4ec',acc:null,       glow:null},
    wizard:   {body:'#3a2880',bodyHi:'#5040a8',bodyLo:'#1a1040',belt:'#6a5020',buckle:'#c8a848',skin:'#e8c99a',hair:'#2a1a40',hat:'#3a2880', cape:null,      weapon:'#8a6030',weaponHi:'#b89060',acc:'#80c0ff',  glow:'rgba(100,160,255,0.15)'},
    rogue:    {body:'#2a2a2a',bodyHi:'#404040',bodyLo:'#141414',belt:'#3a2010',buckle:'#808080',skin:'#e8c99a',hair:'#1a1a1a',hat:'hood',    cape:null,      weapon:'#a0a0a0',weaponHi:'#d0d0d0',acc:null,       glow:null},
    paladin:  {body:'#e0d8c0',bodyHi:'#f0ece0',bodyLo:'#a09880',belt:'#c8a848',buckle:'#e8c030',skin:'#e8c99a',hair:'#c8a060',hat:null,     cape:'#1a3a8a', weapon:'#e0d8c0',weaponHi:'#f0f0e8',acc:'#ffd84a',  glow:'rgba(255,216,74,0.12)'},
    ranger:   {body:'#2a5020',bodyHi:'#3a6830',bodyLo:'#1a3010',belt:'#5a3818',buckle:'#8a6030',skin:'#e8c99a',hair:'#5a3818',hat:null,     cape:'#1a3a10', weapon:null,     weaponHi:null,     acc:'#5a3818',  glow:null},
    barbarian:{body:'#e8c99a',bodyHi:'#f0d8b0',bodyLo:'#c8a070',belt:'#4a2000',buckle:'#808080',skin:'#e8c99a',hair:'#8a2010',hat:null,     cape:'#4a2000', weapon:'#808080',weaponHi:'#a0a0a0',acc:null,       glow:null},
    cleric:   {body:'#d0c8b8',bodyHi:'#e8e0d0',bodyLo:'#a09880',belt:'#c8a848',buckle:'#e8c030',skin:'#e8c99a',hair:'#6a5040',hat:null,     cape:null,      weapon:null,     weaponHi:null,     acc:'#ffd84a',  glow:'rgba(255,216,74,0.08)'},
    druid:    {body:'#5a4830',bodyHi:'#7a6848',bodyLo:'#3a2818',belt:'#2a4a10',buckle:'#6a8a40',skin:'#e8c99a',hair:'#4a6020',hat:null,     cape:null,      weapon:'#6a5020',weaponHi:'#8a7040',acc:'#4a8a20',  glow:'rgba(80,160,40,0.1)'}
  };
  const p=P[cls]||P.fighter;

  // ── Shadow ──
  ctx.fillStyle='rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(sx+4,sy+15,5,2,0,0,Math.PI*2); ctx.fill();

  // ── Glow (magic classes) ──
  if(p.glow){
    ctx.fillStyle=p.glow;
    ctx.beginPath(); ctx.ellipse(sx+4,sy+8,8,10,0,0,Math.PI*2); ctx.fill();
  }

  // ── Cape (behind body) ──
  if(p.cape && (f===0||f===1||f===3)){
    ctx.fillStyle=p.cape;
    if(f===0){ ctx.fillRect(sx+1,sy+5+bob,6,8); }
    else if(f===1){ ctx.fillRect(sx-1,sy+4+bob,3,9); }
    else{ ctx.fillRect(sx+6,sy+4+bob,3,9); }
  }

  // ── Legs ──
  ctx.fillStyle='#1a1008';
  ctx.fillRect(sx+1,sy+11+bob,3,4+legSwing);
  ctx.fillRect(sx+4,sy+11+bob,3,4-legSwing);
  // Boots
  ctx.fillStyle=cls==='barbarian'?'#5a3818':'#2a1a08';
  ctx.fillRect(sx,  sy+14+bob+legSwing,4,2);
  ctx.fillRect(sx+3,sy+14+bob-legSwing,4,2);

  // ── Torso ──
  ctx.fillStyle=p.body;
  ctx.fillRect(sx,sy+5+bob,8,7);
  // Highlight top
  ctx.fillStyle=p.bodyHi;
  ctx.fillRect(sx,sy+5+bob,8,2);
  // Shadow bottom
  ctx.fillStyle=p.bodyLo;
  ctx.fillRect(sx,sy+10+bob,8,2);
  // Belt
  ctx.fillStyle=p.belt;
  ctx.fillRect(sx,sy+11+bob,8,1);
  ctx.fillStyle=p.buckle;
  ctx.fillRect(sx+3,sy+11+bob,2,1);

  // ── Arms ──
  ctx.fillStyle=p.body;
  ctx.fillRect(sx-1,sy+5+bob,2,6);
  ctx.fillRect(sx+7,sy+5+bob,2,6);
  // Hands
  ctx.fillStyle=cls==='barbarian'?p.skin:'rgba(200,180,140,0.7)';
  ctx.fillRect(sx-1,sy+10+bob,2,2);
  ctx.fillRect(sx+7,sy+10+bob,2,2);

  // ── Weapon (right side) ──
  if(p.weapon){
    if(cls==='fighter'||cls==='paladin'){
      // Sword
      if(f===1||f===2){ ctx.fillStyle=p.weapon; ctx.fillRect(sx+9,sy+3+bob,1,10); ctx.fillStyle=p.weaponHi; ctx.fillRect(sx+9,sy+3+bob,1,3); ctx.fillStyle=p.buckle; ctx.fillRect(sx+8,sy+7+bob,3,1); }
      else if(f===3){ ctx.fillStyle=p.weapon; ctx.fillRect(sx-2,sy+3+bob,1,10); ctx.fillStyle=p.weaponHi; ctx.fillRect(sx-2,sy+3+bob,1,3); ctx.fillStyle=p.buckle; ctx.fillRect(sx-3,sy+7+bob,3,1); }
    } else if(cls==='wizard'||cls==='druid'){
      // Staff
      const staffX=f===3?sx-2:sx+9;
      ctx.fillStyle=p.weapon; ctx.fillRect(staffX,sy-2+bob,1,16);
      ctx.fillStyle=p.acc||p.weaponHi; ctx.fillRect(staffX-1,sy-3+bob,3,2);
      if(cls==='wizard'){ ctx.fillStyle='#80c0ff'; ctx.fillRect(staffX,sy-4+bob,1,2); }
    } else if(cls==='rogue'){
      // Dagger
      if(f===1||f===2){ ctx.fillStyle=p.weapon; ctx.fillRect(sx+9,sy+6+bob,1,6); ctx.fillStyle=p.weaponHi; ctx.fillRect(sx+9,sy+6+bob,1,2); }
      else if(f===3){ ctx.fillStyle=p.weapon; ctx.fillRect(sx-2,sy+6+bob,1,6); ctx.fillStyle=p.weaponHi; ctx.fillRect(sx-2,sy+6+bob,1,2); }
    } else if(cls==='barbarian'){
      // Big axe
      const axX=f===3?sx-3:sx+9;
      ctx.fillStyle='#5a3818'; ctx.fillRect(axX,sy+bob,1,13);
      ctx.fillStyle=p.weapon; ctx.fillRect(axX-(f===3?2:0),sy+bob,3,4);
      ctx.fillStyle=p.weaponHi; ctx.fillRect(axX-(f===3?2:0),sy+bob,3,1);
    }
  }
  // Ranger bow on back
  if(cls==='ranger'){
    ctx.fillStyle=p.acc;
    if(f===0){ ctx.strokeStyle=p.acc; ctx.lineWidth=0.8; ctx.beginPath(); ctx.arc(sx+4,sy+6+bob,4,Math.PI*0.8,Math.PI*2.2,false); ctx.stroke(); }
    else if(f===1){ ctx.fillRect(sx-1,sy+2+bob,1,10); }
    else if(f===3){ ctx.fillRect(sx+8,sy+2+bob,1,10); }
  }

  // ── Head ──
  ctx.fillStyle=p.skin; ctx.fillRect(sx+1,sy-1+bob,6,6);

  // ── Hair / Hat ──
  if(p.hat==='#3a2880'){
    // Wizard pointed hat
    ctx.fillStyle=p.hat;
    ctx.fillRect(sx,sy-2+bob,8,3);
    ctx.fillRect(sx+1,sy-4+bob,6,2);
    ctx.fillRect(sx+2,sy-6+bob,4,2);
    ctx.fillRect(sx+3,sy-7+bob,2,1);
    // Hat brim
    ctx.fillStyle=p.bodyHi; ctx.fillRect(sx-1,sy-1+bob,10,1);
  } else if(p.hat==='hood'){
    // Rogue hood
    ctx.fillStyle='#1a1a1a';
    ctx.fillRect(sx,sy-2+bob,8,4);
    ctx.fillRect(sx-1,sy-1+bob,10,2);
    // Shadow over face
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(sx+1,sy-1+bob,6,2);
  } else {
    // Normal hair
    ctx.fillStyle=p.hair;
    ctx.fillRect(sx+1,sy-2+bob,6,2);
    ctx.fillRect(sx,sy-1+bob,1,3);
    ctx.fillRect(sx+7,sy-1+bob,1,3);
  }
  // Helmet for fighter/paladin
  if(cls==='fighter'||cls==='paladin'){
    ctx.fillStyle=p.bodyHi;
    ctx.fillRect(sx,sy-2+bob,8,3);
    ctx.fillStyle=p.body;
    ctx.fillRect(sx+1,sy-3+bob,6,1);
    // Visor slit
    ctx.fillStyle='#1a1208'; ctx.fillRect(sx+2,sy+bob,4,1);
    if(cls==='paladin'){ ctx.fillStyle='#ffd84a'; ctx.fillRect(sx+3,sy-3+bob,2,1); }
  }

  // ── Eyes (based on facing) ──
  if(cls!=='fighter'&&cls!=='paladin'){
    ctx.fillStyle='#1a1008';
    if(f===2){ ctx.fillRect(sx+2,sy+2+bob,1,1); ctx.fillRect(sx+5,sy+2+bob,1,1); }
    else if(f===0){ ctx.fillRect(sx+2,sy+1+bob,1,1); ctx.fillRect(sx+5,sy+1+bob,1,1); }
    else if(f===3){ ctx.fillRect(sx+1,sy+2+bob,1,1); }
    else{ ctx.fillRect(sx+6,sy+2+bob,1,1); }
  }

  // ── Class accent (holy symbol, leaf, etc.) ──
  if(cls==='cleric'&&p.acc){
    ctx.fillStyle=p.acc;
    ctx.fillRect(sx+3,sy+6+bob,2,3);
    ctx.fillRect(sx+2,sy+7+bob,4,1);
  }
  if(cls==='druid'&&p.acc){
    // Floating leaf particles
    const lt=Date.now()*0.002;
    ctx.fillStyle=p.acc;
    ctx.globalAlpha=0.5+0.3*Math.sin(lt);
    ctx.fillRect(sx+8+Math.sin(lt)*2,sy-2+Math.cos(lt)*3+bob,2,1);
    ctx.globalAlpha=1;
  }
}

// ── Draw particles ────────────────────────────────────────
function _drawParticles(ctx, a, cx, cy){
  for(const p of _ptcls){
    const l=1-p.life, px=p.x-cx, py=p.y-cy;
    if(px<-20||py<-20||px>_logW()+20||py>_logH()+20) continue;
    if(p.fx==='fireflies'){ ctx.globalAlpha=(0.3+0.7*Math.abs(Math.sin(p.blink+Date.now()*0.003)))*l; ctx.fillStyle='#ccff88'; ctx.fillRect(px-p.r,py-p.r,p.r*2,p.r*2); }
    else if(p.fx==='ash'){ ctx.globalAlpha=0.4*l; ctx.fillStyle='#aaa090'; ctx.fillRect(px,py,p.r,p.r); }
    else if(p.fx==='mist'){ ctx.globalAlpha=p.a*(1-Math.abs(p.life-.5)*2); ctx.fillStyle='#a0b0c0'; ctx.beginPath(); ctx.arc(px,py,p.r,0,6.28); ctx.fill(); }
    else if(p.fx==='spores'){ ctx.globalAlpha=0.5*l; ctx.fillStyle=`hsl(${p.hue},80%,60%)`; ctx.fillRect(px,py,p.r,p.r); }
    else if(p.fx==='embers'){ ctx.globalAlpha=0.8*l; ctx.fillStyle=`hsl(${15+Math.random()*25},100%,65%)`; ctx.fillRect(px,py,p.r,p.r); }
  }
  ctx.globalAlpha=1;
}

// ── Draw HUD ──────────────────────────────────────────────
function _drawHUD(ctx, a, near){
  const W=_logW(), H=_logH();
  // Top bar
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,0,W,11);
  ctx.font='5px "Press Start 2P",monospace';
  ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillStyle='#c8a84b';
  ctx.fillText('🪙 '+((typeof G!=='undefined'&&G)?G.gold+'g':'—'), 4, 5.5);
  ctx.textAlign='center';
  ctx.fillStyle='rgba(200,180,120,0.5)';
  ctx.fillText(_tScene==='exterior'?'ELDERFEN':((INTERIORS[_tScene]||{}).label||_tScene), W/2, 5.5);
  // top-right label removed

  // Bottom bar
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,H-11,W,11);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='rgba(180,160,100,0.5)';
  if(_victoryActive){
    // No prompt during victory — clean view
  } else if(near){
    let prompt='';
    if(near.type==='door')    prompt=`[E] Enter ${near.ref.label||'building'}`;
    else if(near.type==='gate')   prompt='[E] Approach the Dungeon Gate';
    else if(near.type==='graceVault') prompt='[E] Open Grace Vault';
    else if(near.type==='stashChest') prompt='[E] Open Stash';
    else if(near.type==='notice') prompt='[E] Read Notices';
    else if(near.type==='graveyard') prompt='[E] Open the Graveyard';
    else if(near.type==='exit')   prompt='[E] Leave building';
    else if(near.type==='wanderer'||near.type==='npc') prompt='[E] Talk';
    ctx.fillStyle='#ffd84a';
    ctx.fillText(prompt, W/2, H-5.5);
  } else {
    ctx.fillText('WASD / ARROWS  ·  E to interact', W/2, H-5.5);
  }
}

