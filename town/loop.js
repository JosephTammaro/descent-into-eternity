// ── Wander AI ─────────────────────────────────────────────
function _stepWanderers(zi){
  for(const w of _wanderers){
    if(w.stationary){ w._moving=false; continue; }

    if(w.talking){
      w._moving=false;
      const bubbleOpen=document.getElementById('npcSpeechOverlay')?.classList.contains('open');
      if(!bubbleOpen){ w.talkTimer--; if(w.talkTimer<=0) w.talking=false; }
      continue;
    }

    // Proximity pause — "chatting" with another NPC
    if(w._proxPause && w._proxPause>0){ w._proxPause--; w._moving=false; continue; }

    w.wanderTimer--;
    if(w.wanderTimer<=0){
      const a=w.wanderArea;
      const tx=(a.x1+Math.random()*(a.x2-a.x1))*TILE;
      const ty=(a.y1+Math.random()*(a.y2-a.y1))*TILE;
      w.wanderTarget={x:tx,y:ty};
      w.wanderTimer=80+Math.random()*120;
    }

    const dx=w.wanderTarget.x-w.wx, dy=w.wanderTarget.y-w.wy;
    const dist=Math.hypot(dx,dy);
    if(dist>2){
      const spd=w._speed||0.2;
      const nx=w.wx+dx/dist*spd, ny=w.wy+dy/dist*spd;
      if(!_extBlocked(nx,w.wy)) w.wx=nx;
      if(!_extBlocked(w.wx,ny)) w.wy=ny;
      if(Math.abs(dx)>Math.abs(dy)) w.facing=dx>0?1:3;
      else w.facing=dy>0?2:0;
      w._moving=true;
    } else { w._moving=false; }
  }
  _checkProximity();
}

// Interior NPC wander — non-stationary NPCs pace around their room
function _stepInteriorNPCs(int){
  for(const n of int.npcs){
    if(n.stationary) continue;

    // Init wander state on first use
    if(!n._wx){ n._wx=n.tx*TILE+TILE/2; n._wy=n.ty*TILE+TILE/2; }
    if(!n._wTarget){ n._wTarget={x:n._wx,y:n._wy}; n._wTimer=60+Math.random()*80; n._wFacing=2; }

    n._wTimer--;
    if(n._wTimer<=0){
      // Wander within 3 tiles of home position
      const hx=n.tx*TILE+TILE/2, hy=n.ty*TILE+TILE/2;
      n._wTarget={x:hx+(Math.random()-0.5)*3*TILE, y:hy+(Math.random()-0.5)*3*TILE};
      n._wTimer=60+Math.random()*80;
    }

    const dx=n._wTarget.x-n._wx, dy=n._wTarget.y-n._wy;
    const dist=Math.hypot(dx,dy);
    if(dist>2){
      const spd=0.15;
      const nx2=n._wx+dx/dist*spd, ny2=n._wy+dy/dist*spd;
      if(!_intBlocked(int.map,nx2,n._wy)) n._wx=nx2;
      if(!_intBlocked(int.map,n._wx,ny2)) n._wy=ny2;
      if(Math.abs(dx)>Math.abs(dy)) n._wFacing=dx>0?1:3;
      else n._wFacing=dy>0?2:0;
    }
  }
}

// ── Near interactable (cached per frame) ─────────────────
let _nearInteractable = null;

// ══════════════════════════════════════════════════════════
//  MAIN LOOP
// ══════════════════════════════════════════════════════════
function _townTick(){
  if(!_tRunning) return;

  const zi=(typeof G!=='undefined'&&G)?Math.min(G.zoneIdx||0,ATMOS.length-1):0;
  const a=ATMOS[zi];
  const ctx=_tx;
  const W=_logW(), H=_logH();

  // ── Input ──
  // Block movement while intro, farewell, or victory are active
  const _farewellActive = _farewellInTownActive
                        || document.getElementById('farewellScreen')?.style.display === 'flex';
  let dx=0,dy=0;
  if(!_introCamActive && !_farewellActive && !_victoryActive){
    if(_keys['ArrowLeft'] ||_keys['a']||_keys['A']){dx=-1;_pl.facing=3;}
    if(_keys['ArrowRight']||_keys['d']||_keys['D']){dx= 1;_pl.facing=1;}
    if(_keys['ArrowUp']   ||_keys['w']||_keys['W']){dy=-1;_pl.facing=0;}
    if(_keys['ArrowDown'] ||_keys['s']||_keys['S']){dy= 1;_pl.facing=2;}
  }
  if(dx&&dy){dx*=0.707;dy*=0.707;}

  const spd=_pl.speed;
  const nx=_pl.wx+dx*spd, ny=_pl.wy+dy*spd;
  const m=4; // pixel collision margin

  if(_tScene==='exterior'){
    if(!_extBlocked(nx+m,_pl.wy+m)&&!_extBlocked(nx+m,_pl.wy+TILE-m)&&!_extBlocked(nx+TILE-m,_pl.wy+m)&&!_extBlocked(nx+TILE-m,_pl.wy+TILE-m)) _pl.wx=nx;
    if(!_extBlocked(_pl.wx+m,ny+m)&&!_extBlocked(_pl.wx+m,ny+TILE-m)&&!_extBlocked(_pl.wx+TILE-m,ny+m)&&!_extBlocked(_pl.wx+TILE-m,ny+TILE-m)) _pl.wy=ny;
    if(!_victoryActive){
      _pl.wx=Math.max(TILE,Math.min((EXT_COLS-2)*TILE,_pl.wx));
      _pl.wy=Math.max(TILE,Math.min((EXT_ROWS-2)*TILE,_pl.wy));
    }
  } else {
    const int=INTERIORS[_tScene];
    if(int){
      if(!_intBlocked(int.map,nx+m,_pl.wy+m)&&!_intBlocked(int.map,nx+m,_pl.wy+TILE-m)&&!_intBlocked(int.map,nx+TILE-m,_pl.wy+m)&&!_intBlocked(int.map,nx+TILE-m,_pl.wy+TILE-m)) _pl.wx=nx;
      if(!_intBlocked(int.map,_pl.wx+m,ny+m)&&!_intBlocked(int.map,_pl.wx+m,ny+TILE-m)&&!_intBlocked(int.map,_pl.wx+TILE-m,ny+m)&&!_intBlocked(int.map,_pl.wx+TILE-m,ny+TILE-m)) _pl.wy=ny;
      _pl.wx=Math.max(0,Math.min((INT_W-1)*TILE,_pl.wx));
      _pl.wy=Math.max(0,Math.min((INT_H-1)*TILE,_pl.wy));
    }
  }

  _nearInteractable=_findNearInteractable();
  if(!_victoryActive && !_farewellInTownActive && _dialogSrcX!==null && Math.hypot(_pl.wx-_dialogSrcX, _pl.wy-_dialogSrcY) > TILE*3){
    closeNpcDialog();
  }
  if(_victoryActive) _victoryStep();
  if(_tScene==='exterior') _stepWanderers(zi);
  else { const _int=INTERIORS[_tScene]; if(_int) _stepInteriorNPCs(_int); }
  _stepPtcls(a.fx);
  _stepAmbient();
  _updateCamera(W,H);

  // ── Draw ──
  ctx.fillStyle=a.sky; ctx.fillRect(0,0,W,H); // W/H are logical (pre-scale)

  if(_tScene==='exterior'){
    _drawExtTiles(ctx,a,_camX,_camY,W,H);
    _drawRipples(ctx,_camX,_camY);
    EXT_DECORS.filter(d=>d.type==='tree').forEach(d=>_drawDecor(ctx,d,a,_camX,_camY));
    EXT_BUILDINGS.forEach(b=>{ if(b.id==='noticeboard') return; _drawExtBuilding(ctx,b,a,_camX,_camY); });
    _drawSmoke(ctx,_camX,_camY);
    EXT_DECORS.filter(d=>d.type!=='tree').forEach(d=>_drawDecor(ctx,d,a,_camX,_camY));
    _drawCat(ctx,_camX,_camY);
    // Wanderers
    for(const w of _wanderers){
      const near=_nearInteractable&&_nearInteractable.type==='wanderer'&&_nearInteractable.ref===w;
      _drawNPC(ctx,w,w.wx,w.wy,w.facing,_camX,_camY,near,w.label);
    }
  } else {
    const int=INTERIORS[_tScene];
    if(int){
      // Dark border fill behind centered interior map
      ctx.fillStyle='#0a0806'; ctx.fillRect(0,0,W,H);
      const _mW=INT_W*TILE, _mH=INT_H*TILE;
      const _oX=-_camX, _oY=-_camY;
      ctx.fillStyle='#1a1410'; ctx.fillRect(_oX-4,_oY-4,_mW+8,_mH+8);
      ctx.strokeStyle='#3a2a1a'; ctx.lineWidth=2; ctx.strokeRect(_oX-2,_oY-2,_mW+4,_mH+4);
      _drawIntTiles(ctx,a,int.map,_camX,_camY);
      for(const n of int.npcs){
        const near=_nearInteractable&&_nearInteractable.type==='npc'&&_nearInteractable.ref===n;
        // Use wander position if available (non-stationary NPCs), else fixed tx/ty
        const nwx = n._wx !== undefined ? n._wx : n.tx*TILE+TILE/2;
        const nwy = n._wy !== undefined ? n._wy : n.ty*TILE+TILE/2;
        const nfacing = n._wFacing !== undefined ? n._wFacing : 2;
        _drawNPC(ctx,n,nwx,nwy,nfacing,_camX,_camY,near,n.label);
      }
    }
  }

  _drawParticles(ctx,a,_camX,_camY);
  if(_tScene==='exterior') _drawBirds(ctx,_camX,_camY);

  // Vignette
  ctx.fillStyle=a.ambient; ctx.fillRect(0,0,W,H);
  const vig=ctx.createRadialGradient(W/2,H/2,H*.1,W/2,H/2,W*.65);
  vig.addColorStop(0,'transparent'); vig.addColorStop(1,'rgba(0,0,0,0.5)');
  ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

  // Intro tour marker (pulsing chevron over target building)
  if(_introCamActive && typeof _drawIntroMarker==='function'){
    _drawIntroMarker(ctx,_camX,_camY);
  }

  // Hide player & HUD during intro tour for cleaner presentation
  if(!_introCamActive){
    _drawPlayer(ctx,_camX,_camY);
    // Draw noticeboard AFTER player so player walks under it
    if(_tScene==='exterior'){
      const nb=EXT_BUILDINGS.find(b=>b.id==='noticeboard');
      if(nb) _drawExtBuilding(ctx,nb,a,_camX,_camY);
    }
    _drawHUD(ctx,a,_nearInteractable);
    _drawMinimap(ctx);
  }

  _tRAF=requestAnimationFrame(_townTick);
}

// ── Keyboard ──────────────────────────────────────────────
function _kd(e){
  _keys[e.key]=true;
  // Block interactions while intro, farewell, or victory overlays are active
  const _overlayActive = _introCamActive || _victoryActive || _farewellInTownActive ||
                         document.getElementById('farewellScreen')?.style.display === 'flex';
  if(_overlayActive){
    // Allow advancing the in-town farewell with Space / Enter / arrow
    if(_farewellInTownActive && !e.repeat &&
       (e.key===' '||e.key==='Enter'||e.key==='ArrowRight'||e.key==='ArrowDown')){
      e.preventDefault();
      _farewellAdvance();
    }
    return;
  }
  // e.repeat=true when key held down — only interact on the very first press
  if(!e.repeat && (e.key==='e'||e.key==='E')){
    if(_nearInteractable){
      e.preventDefault();
      const target=_nearInteractable;
      _nearInteractable=null; // clear so the transition frame can't re-fire
      _handleInteract(target);
    }
  }
  if(!e.repeat && (e.key==='m'||e.key==='M'||e.key==='Tab')){
    e.preventDefault();
    _minimapExpanded=!_minimapExpanded;
  }
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
}
function _ku(e){ _keys[e.key]=false; }

// ── Interact handler ──────────────────────────────────────
function _handleInteract(near){
  if(!near) return;
  if(near.type==='door'){
    _enterInterior(near.ref.interior);
  } else if(near.type==='exit'){
    _exitInterior();
  } else if(near.type==='gate'){
    _handleGate();
  } else if(near.type==='graceVault'){
    townOpenGraces();
  } else if(near.type==='stashChest'){
    townOpenDialog('stash');
  } else if(near.type==='notice'){
    townOpenDialog('notice');
  } else if(near.type==='graveyard'){
    if(typeof showGraveyard==='function') showGraveyard();
  } else if(near.type==='wanderer'){
    _talkToWanderer(near.ref);
  } else if(near.type==='npc'){
    const n=near.ref;
    if(n.onInteract){ n.onInteract(); }
    else if(n.lines){ _showNPCLine(n); }
  }
}

function _enterInterior(id){
  if(!INTERIORS[id]) return;
  const int=INTERIORS[id];
  _tScene=id;
  _pl.wx=int.spawnTx*TILE+TILE/2;
  _pl.wy=int.spawnTy*TILE+TILE/2;
  _pl.facing=0;
  if(typeof AUDIO!=='undefined'&&AUDIO.playBGM) AUDIO.playBGM(int.bgm||'campfire');
}

function _exitInterior(){
  // Find which building this interior belongs to
  const bldg=EXT_BUILDINGS.find(b=>b.interior===_tScene);
  _tScene='exterior';
  if(bldg){
    _pl.wx=(bldg.doorTx+0.5)*TILE;
    _pl.wy=(bldg.doorTy+1)*TILE; // one tile south of door
  }
  _pl.facing=2;
  const zi=(typeof G!=='undefined'&&G)?Math.min(G.zoneIdx||0,ATMOS.length-1):0;
  if(typeof AUDIO!=='undefined'&&AUDIO.playBGM) AUDIO.playBGM('campfire');
}
