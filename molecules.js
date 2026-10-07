/* SPDX-License-Identifier: AGPL-3.0-only
 * Decorative motion of the original scientific illustrations, not a chemical
 * reaction simulation. No input capture, tracking, dependencies or network calls.
 */
(function () {
  'use strict';

  function repel(body, pointer, dt) {
    if (!pointer.active) return;
    const dx = body.x - pointer.x, dy = body.y - pointer.y;
    const distance = Math.hypot(dx, dy), reach = body.radius + 120;
    if (distance >= reach) return;
    const force = (1 - distance / reach) * 2100 * dt;
    body.vx += (distance > 1 ? dx / distance : 1) * force;
    body.vy += (distance > 1 ? dy / distance : -.25) * force;
    const speed = Math.hypot(body.vx, body.vy);
    if (speed > 620) { body.vx *= 620 / speed; body.vy *= 620 / speed; }
  }

  function wall(body, width, height) {
    const cos=Math.abs(Math.cos(body.angle || 0)), sin=Math.abs(Math.sin(body.angle || 0));
    const rx=body.w ? (body.w*cos+body.h*sin)/2 : body.radius;
    const ry=body.h ? (body.w*sin+body.h*cos)/2 : body.radius;
    const hitX = (body.x < rx && body.vx < 0) || (body.x > width - rx && body.vx > 0);
    const hitY = (body.y < ry && body.vy < 0) || (body.y > height - ry && body.vy > 0);
    const impact = (hitX || hitY) && Math.hypot(body.vx, body.vy) > 55;
    body.x = Math.max(rx, Math.min(width - rx, body.x));
    body.y = Math.max(ry, Math.min(height - ry, body.y));
    if (hitX) body.vx *= -.7;
    if (hitY) body.vy *= -.7;
    return impact;
  }

  // The physical rules can be checked without a browser or a running animation.
  if (typeof module !== 'undefined' && module.exports) module.exports = { repel, wall };
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById('molecule-field');
  const toggle = document.getElementById('motion-toggle');
  if (!canvas || !toggle) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const pointer = { x:0, y:0, active:false };
  let width = 0, height = 0, ratio = 1, frame = 0, lastTime = 0;
  let paused = false, ready = false, pageHidden = false, motionOptIn = false;
  let bodies = [], fragments = [];
  const settings = [
    { file:'melatonin.png', x:.60, y:.28, size:340, angle:-.23, opacity:.105 },
    { file:'glycine.png', x:.88, y:.72, size:180, angle:.18, opacity:.10 },
    { file:'growth-hormone.jpeg', x:.18, y:.83, size:220, angle:-.16, opacity:.06 }
  ];

  // Remove white margins in memory; original files and their attribution stay intact.
  function prepare(image) {
    const source = document.createElement('canvas');
    source.width = image.naturalWidth; source.height = image.naturalHeight;
    const ctx = source.getContext('2d', { willReadFrequently:true });
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, source.width, source.height);
    let left=source.width, right=0, top=source.height, bottom=0;
    for (let i=0; i<pixels.data.length; i+=4) {
      const d=pixels.data, shade=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];
      d[i+3] = Math.round(d[i+3] * Math.max(0, (245-shade)/245));
      d[i]=d[i+1]=d[i+2]=35;
      if (d[i+3]>20) {
        const x=(i/4)%source.width, y=Math.floor(i/4/source.width);
        left=Math.min(left,x); right=Math.max(right,x); top=Math.min(top,y); bottom=Math.max(bottom,y);
      }
    }
    ctx.putImageData(pixels,0,0);
    if (right<=left || bottom<=top) return source;
    const cropped=document.createElement('canvas');
    cropped.width=right-left+1; cropped.height=bottom-top+1;
    cropped.getContext('2d').drawImage(source,left,top,cropped.width,cropped.height,0,0,cropped.width,cropped.height);
    return cropped;
  }

  function reset(body) {
    const narrow=width<650;
    const aspect=body.image.height/body.image.width;
    const size=Math.min(body.size, width*(narrow ? .48 : .29), height*.43, Math.min(width,height)*.8/Math.hypot(1,aspect));
    body.w=size; body.h=size*body.image.height/body.image.width;
    body.radius=Math.hypot(body.w,body.h)/2;
    // All edges, including a rotated structure, start inside the viewport.
    body.x=Math.max(body.radius,Math.min(width-body.radius,width*body.homeX));
    body.y=Math.max(body.radius,Math.min(height-body.radius,height*body.homeY));
    body.vx=(body.homeX>.5 ? -1 : 1)*7; body.vy=5;
    body.angle=body.homeAngle; body.age=0; body.wait=0;
  }

  function resize() {
    width=document.documentElement.clientWidth; height=window.innerHeight;
    ratio=Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width=Math.round(width*ratio); canvas.height=Math.round(height*ratio);
    context.setTransform(ratio,0,0,ratio,0,0);
    bodies.forEach(reset); fragments=[];
    draw();
  }

  function breakApart(body) {
    // Sections of the actual image retain their bonds / ribbon, rather than confetti.
    const columns=4, rows=3;
    for (let row=0;row<rows;row++) for (let col=0;col<columns;col++) {
      const ox=((col+.5)/columns-.5)*body.w, oy=((row+.5)/rows-.5)*body.h;
      const dx=ox*Math.cos(body.angle)-oy*Math.sin(body.angle);
      const dy=ox*Math.sin(body.angle)+oy*Math.cos(body.angle);
      fragments.push({image:body.image, sx:col*body.image.width/columns, sy:row*body.image.height/rows,
        sw:body.image.width/columns, sh:body.image.height/rows, w:body.w/columns, h:body.h/rows,
        x:body.x+dx, y:body.y+dy, vx:body.vx*.35+dx*1.2, vy:body.vy*.35+dy*1.2,
        angle:body.angle, spin:(Math.random()-.5)*1.6, life:2.1});
    }
    body.wait=2.3;
  }

  function draw() {
    context.clearRect(0,0,width,height);
    for (const body of bodies) {
      if (body.wait>0) continue;
      context.save(); context.translate(body.x,body.y); context.rotate(body.angle);
      context.globalAlpha=body.opacity*(running() ? Math.min(1,body.age/1.2) : 1);
      context.drawImage(body.image,-body.w/2,-body.h/2,body.w,body.h); context.restore();
    }
    for (const p of fragments) {
      context.save(); context.translate(p.x,p.y); context.rotate(p.angle);
      context.globalAlpha=.14*Math.min(1,p.life/1.3);
      context.drawImage(p.image,p.sx,p.sy,p.sw,p.sh,-p.w/2,-p.h/2,p.w,p.h); context.restore();
    }
  }

  function running() {return ready && !paused && (!reduced.matches || motionOptIn) && fine.matches && !document.hidden && !pageHidden;}
  function tick(now) {
    frame=0;
    if (!running()) return;
    // Limit work to 30 fps, and never integrate a suspended tab's elapsed time.
    if (lastTime && now-lastTime<1000/30) {frame=requestAnimationFrame(tick); return;}
    const dt=lastTime ? Math.min((now-lastTime)/1000,.05) : 1/30; lastTime=now;
    for (const body of bodies) {
      if (body.wait>0) {body.wait-=dt; if (body.wait<=0) reset(body); continue;}
      body.age+=dt;
      repel(body,pointer,dt);
      body.x+=body.vx*dt; body.y+=body.vy*dt;
      body.angle+=Math.max(-.2,Math.min(.2,body.vx*.0005))*dt;
      if (wall(body,width,height)) breakApart(body);
      const drag=Math.exp(-.45*dt);
      body.vx=body.vx*drag+(body.homeX>.5?-1:1)*3*dt;
      body.vy=body.vy*drag+2*dt;
    }
    fragments=fragments.filter(p=>{
      p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.angle+=p.spin*dt;
      if (p.x<0 || p.x>width) {p.vx*=-.7; p.x=Math.max(0,Math.min(width,p.x));}
      if (p.y<0 || p.y>height) {p.vy*=-.7; p.y=Math.max(0,Math.min(height,p.y));}
      return p.life>0;
    });
    draw(); frame=requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame=0; lastTime=0;
    const fr=document.documentElement.lang==='fr';
    toggle.hidden=!ready || !fine.matches;
    toggle.textContent=reduced.matches && !motionOptIn ? (fr?'Activer l’animation':'Enable animation') : paused ? (fr?'Reprendre l’animation':'Resume animation') : (fr?'Mettre l’animation en pause':'Pause animation');
    if (running()) frame=requestAnimationFrame(tick);
    else draw();
  }
  toggle.addEventListener('click',()=>{
    if (reduced.matches && !motionOptIn) {motionOptIn=true;paused=false;} else paused=!paused;
    pointer.active=false;sync();
  });
  window.addEventListener('pointermove',event=>{
    if (event.pointerType==='touch' || !running()) return;
    pointer.x=event.clientX;pointer.y=event.clientY;pointer.active=true;
  },{passive:true});
  document.addEventListener('pointerleave',()=>{pointer.active=false;});
  window.addEventListener('blur',()=>{pointer.active=false;});
  window.addEventListener('scroll',()=>{pointer.active=false;},{passive:true});
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('pagehide',()=>{pageHidden=true;sync();});
  window.addEventListener('pageshow',()=>{pageHidden=false;sync();});
  reduced.addEventListener('change',()=>{motionOptIn=false;pointer.active=false;fragments=[];bodies.forEach(reset);sync();});
  fine.addEventListener('change',sync);
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

  Promise.all(settings.map(setting=>new Promise(resolve=>{
    const image=new Image();
    image.onload=()=>{try {resolve({...setting,image:prepare(image),homeX:setting.x,homeY:setting.y,homeAngle:setting.angle});} catch (_) {resolve(null);}};
    image.onerror=()=>resolve(null);
    image.src='/assets/molecules/'+setting.file;
  }))).then(loaded=>{
    bodies=loaded.filter(Boolean); if (!bodies.length) return;
    ready=true; resize(); document.body.classList.add('has-molecule-field'); sync();
  });
})();
