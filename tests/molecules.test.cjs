const {test}=require('node:test');
const assert=require('node:assert/strict');
const {repel,wall}=require('../molecules.js');

test('a nearby pointer repels the structure, without singularity at its centre',()=>{
  const b={x:100,y:100,radius:30,vx:0,vy:0};
  repel(b,{active:true,x:90,y:100},1/30); assert.ok(b.vx>0); assert.equal(b.vy,0);
  repel(b,{active:true,x:100,y:100},1/30); assert.ok(Number.isFinite(b.vx));
  for(let i=0;i<100;i++)repel(b,{active:true,x:99,y:100},1/30);
  assert.ok(Math.hypot(b.vx,b.vy)<=620.001);
});
test('inactive or distant pointers leave velocity unchanged',()=>{
  const b={x:100,y:100,radius:30,vx:7,vy:5};
  repel(b,{active:false,x:100,y:100},.05);
  repel(b,{active:true,x:900,y:900},.05);
  assert.deepEqual([b.vx,b.vy],[7,5]);
});
test('fast impacts fragment at any viewport wall and bounce inward',()=>{
  for(const [x,y,vx,vy] of [[0,150,-100,0],[400,150,100,0],[200,0,0,-100],[200,300,0,100]]){
    const b={x,y,vx,vy,radius:30};
    assert.equal(wall(b,400,300),true);
    assert.ok(b.x>=30 && b.x<=370 && b.y>=30 && b.y<=270);
    assert.ok(b.vx*vx<=0 && b.vy*vy<=0);
  }
});
test('idle drifting at an edge does not repeatedly fragment',()=>{
  const b={x:29,y:100,vx:-7,vy:5,radius:30};
  assert.equal(wall(b,400,300),false); assert.ok(b.vx>0);
  assert.equal(wall(b,400,300),false);
});
test('wall collisions follow the rotated image bounds',()=>{
  const b={x:55,y:100,vx:-100,vy:0,radius:120,w:200,h:80,angle:Math.PI/2};
  assert.equal(wall(b,400,300),false); // half width is 40 after rotation
  b.x=35;
  assert.equal(wall(b,400,300),true); assert.ok(Math.abs(b.x-40)<.001);
});
