'use strict';
// Upgrade appearance follows the saved hero level, with real, matching body geometry.
// равномерно масштабирует весь рэгдолл вокруг точки (по умолчанию — у ступней): прокачка героя и «Увеличить» в песочнице
function scaleRig(h,ratio,pivot){
 if(!pivot){const feet=['llL','llR'].filter(p=>h.attached.has(p)&&!h.parts[p].plugin.gone);pivot={x:h.parts.torso.position.x,y:feet.length?Math.max(...feet.map(p=>h.parts[p].bounds.max.y)):h.parts.torso.bounds.max.y};}
 for(const b of h.bodies){Body.scale(b,ratio,ratio,pivot);if(b.plugin.w)b.plugin.w*=ratio;if(b.plugin.h)b.plugin.h*=ratio;for(const stump of b.plugin.stumps||[]){stump.x*=ratio;stump.y*=ratio;stump.r*=ratio;}}
 for(const c of new Set([...h.cons,...Object.values(h.joints||{})])){if(c.bodyA){c.pointA.x*=ratio;c.pointA.y*=ratio;}if(c.bodyB){c.pointB.x*=ratio;c.pointB.y*=ratio;}c.length*=ratio;}
 h.s*=ratio;h.parts.head.plugin.faceY*=ratio;
 // движок принял бы сдвиг частей при масштабе за огромную скорость (боец улетал) — гасим её
 for(const b of h.bodies){Body.setVelocity(b,{x:0,y:0});Body.setAngularVelocity(b,0);}
 h.standOff=0;
 recomputeAttached(h);
}
const HeroEvolution={
 pending:new Set(),
 size(level,max){return .78+.4*clamp(level/max,0,1);},
 // Preserve the original anatomy: upgrades scale the entire rig uniformly.
 sprout(){return 1;},
 topExtra(){return 0;},
 apply(h,level,max){
  const size=this.size(level,max),ratio=size/(h.upgradeScale||1);
  h.upgradeLevel=level;h.upgradeProgress=clamp(level/max,0,1);h.upgradeScale=size;
  if(Math.abs(ratio-1)<.001)return;
  const feet=['llL','llR'].filter(p=>h.attached.has(p)&&!h.parts[p].plugin.gone);
  const pivot={x:h.parts.torso.position.x,y:feet.length?Math.max(...feet.map(p=>h.parts[p].bounds.max.y)):h.parts.torso.bounds.max.y};
  scaleRig(h,ratio,pivot);
 },
 celebrate(h){
  if(!h||h.dead)return;h.evolutionFxUntil=frame+75;
  const p=h.parts.torso.position;FX.burst(p.x,p.y,90*h.s,'#ffe67b');FX.ring(p.x,p.y,55*h.s);
 },
 drawUpgrade(h){
  const left=(h.evolutionFxUntil||0)-frame;if(left<=0)return;
  const p=h.parts.torso.position,age=75-left;
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3+age*.035,r=(28+age*.25)*h.s;
   drawTfx('sparkle',0,p.x+Math.cos(a)*r,p.y+Math.sin(a)*r-age*.22,13*h.s,13*h.s,a,Math.min(1,left/25));
  }
 }
};

Object.assign(WEAPONS,{
 // копьё: быстрое и почти прямое; v=396 — всегда втыкается в того, в кого попало (не пробивает), со временем тает; нож — пошатывает (v=374)
 spear:{n:'Метательные копья',e:'🔱',type:'projectile',dmg:28,cd:48,len:64,speed:13,fall:.018,mag:1,rl:65,lock:1100,pierce:0,kb:7.5},
 knife:{n:'Метательные ножи',e:'🗡️',type:'projectile',dmg:15,cd:26,len:26,speed:12,fall:.02,mag:3,rl:85,lock:'ad',kb:2.2,stagger:16},
 bow:{n:'Лук',e:'🏹',type:'projectile',dmg:26,cd:50,len:28,speed:10,fall:.02,mag:1,rl:60,lock:1200}
});
for(const id of ['spear','knife','bow'])for(const prefix of ['wpn_','icon_wpn_']){
 const key=prefix+id;SPRITES[key]='weapons/'+key+'_v366.png';AVAILABLE.add(key);
}
// лук без тетивы и стрелы: их рисует код и анимирует натяжение (tools/make_bow_parts.py, drawBowRig в combat.js)
SPRITES.wpn_bow_body='weapons/wpn_bow_body_v372.png';AVAILABLE.add('wpn_bow_body');
Object.assign(WPN_FIT,{spear:{L:78,gx:.23,gy:.5},knife:{L:38,gx:.22,gy:.5},bow:{L:38,gx:.56,gy:.5}});

function weaponIconSrc(id){return SPR['icon_wpn_'+id]?.src||('assets/weapons/icon_wpn_'+id+'.png?v='+ASSET_V);}

// The same grip, sprite dimensions, scale and flip used by drawWeapon.
function weaponMuzzle(ent,id=ent.weapon){
 const f=WPN_FIT[id],im=SPR['wpn_'+id],h=handPos(ent),d=armDir(ent),angle=Math.atan2(d.y,d.x);
 if(!f||!im)return {...h,angle};
 const tip={pistol:[.99,.235],smg:[.99,.28],shotgun:[.99,.26],flamer:[.94,.57],bazooka:[.73,.44],bow:[.97,.51]}[id]||[.95,.5];
 const L=f.L,H=L*im.height/im.width,flip=d.x<0?-1:1,s=ent.s;
 const x=(tip[0]-f.gx)*L*s,y=(tip[1]-f.gy)*H*s*flip,c=Math.cos(angle),sn=Math.sin(angle);
 return {x:h.x+c*x-sn*y,y:h.y+sn*x+c*y,angle};
}

// Independent swept projectiles: a jump or dash can move out of their flight path.
const FlyingShots={
 list:[],
 launch(owner,wp,aim){
  const p=owner.weapon==='bow'?weaponMuzzle(owner):handPos(owner),dx=aim.x-p.x,dy=aim.y-p.y;
  const flight=Math.abs(dx)/wp.speed,a=Math.atan2(dy-.5*wp.fall*flight*flight,p.x===aim.x?.001:dx),s=wp.speed;
  this.list.push({x:p.x,y:p.y,prev:{...p},vx:Math.cos(a)*s,vy:Math.sin(a)*s,owner,team:owner.team,id:owner.weapon,damage:wp.dmg*owner.dmgMul,fall:wp.fall,size:owner.s,life:150,trail:[],spin:0,pierce:wp.pierce||0,kb:wp.kb||0,stagger:wp.stagger||0,hitSet:new Set()});
  if(this.list.length>50)this.list.shift();if(owner.weapon!=='bow')Snd.swish();
  // бросок: воздушный росчерк от руки по направлению полёта
  if(owner.weapon!=='bow')FX.slashTex(p.x+Math.cos(a)*14,p.y+Math.sin(a)*14,a,owner.weapon==='spear'?70:46);
 },
 update(){
  for(const shot of this.list){
   if(--shot.life<=0)continue;
   shot.prev={x:shot.x,y:shot.y};shot.x+=shot.vx;shot.y+=shot.vy;shot.vy+=shot.fall;
   shot.trail.push({x:shot.x,y:shot.y});if(shot.trail.length>(shot.id==='spear'?13:7))shot.trail.shift();if(shot.id==='knife')shot.spin+=.55;
   cutRopesAlong(shot.prev,shot,4);
   const candidates=Composite.allBodies(world).filter(b=>{
    const e=b.plugin?.ent;if(e===shot.owner||b.isSensor)return false;
    if(e?.type==='npc')return !e.dead&&!e.removed&&!e.hung&&!e.caged&&e.team!==shot.team&&e.attached.has(b.plugin.part)&&!shot.hitSet.has(e);
    return b.isStatic||!!e?.item;
   });
   const hits=rayBodies(candidates,shot.prev,shot,4);
   hits.sort((a,b)=>Vector.magnitude(Vector.sub(a.position,shot.prev))-Vector.magnitude(Vector.sub(b.position,shot.prev)));
   const hit=hits[0];
   // в пол стрела и нож втыкаются, а не пропадают
   if(!hit&&shot.y>=FLOOR-2&&!inPit(shot.x)&&shot.vy>0){StuckShots.add(shot,null,{x:shot.x,y:FLOOR-1});if(onScreen(shot.x,0))Snd.arrowHit();dust(shot.x,FLOOR-2,4,Math.sign(shot.vx));shot.life=0;continue;}
   if(!hit){if(shot.y>FLOOR+100||shot.x<0||shot.x>LW)shot.life=0;continue;}
   const e=hit.plugin?.ent,p=boundsPoint(hit,shot);
   if(e?.type==='npc'){
    e.lastHitBy=shot.owner;damageNpc(e,shot.damage*(e.isPlayer&&Mode.id==='level'?.6:1),p.x,p.y,shot.owner);
    juice(p.x,p.y,NPC[e.kind].juice,7,4);FX.hit(p.x,p.y);FX.spike(p.x,p.y,34,NPC[e.kind].juice);
    if(shot.owner?.isPlayer)shake=Math.min(12,shake+(shot.id==='spear'?3:1.5));
    // отброс по ходу полёта: копьё заметно отталкивает, нож — чуть-чуть и пошатывает
    const sp=Math.hypot(shot.vx,shot.vy)||1,dx=shot.vx/sp,dy=shot.vy/sp;
    if(shot.kb&&!e.dead)for(const b of e.bodies)if(e.attached.has(b.plugin.part))Body.setVelocity(b,{x:b.velocity.x+dx*shot.kb,y:b.velocity.y+dy*shot.kb*.5-shot.kb*.35});
    if(shot.stagger)e.stun=Math.max(e.stun||0,shot.stagger);
    // копьё пробивает насквозь и летит дальше, слабея; в последнем враге остаётся торчать насквозь
    // v=396: добивающее копьё не летит дальше — остаётся торчать в убитом
    if(shot.pierce>0&&!e.dead){shot.pierce--;shot.hitSet.add(e);shot.vx*=.82;shot.vy*=.82;shot.damage*=.8;e.stun=Math.max(e.stun||0,24);
     for(let i=0;i<10;i++)particles.push({x:p.x,y:p.y,vx:dx*rnd(3,7)+rnd(-1,1),vy:dy*rnd(3,7)+rnd(-2,0),life:rnd(18,32),c:NPC[e.kind].juice,r:rnd(2,4)});
     FX.word(p.x,p.y-40,'crit',80);continue;}
   }else if(e?.item||e?.type==='gate')hurtItem(e,shot.damage*1.2,p.x,p.y);  // v=458: стрелы, ножи и копья ломают стену
   // попадание в дерево, камень, стену: щепки и пыль
   if(e?.type!=='npc')for(let i=0;i<6;i++)particles.push({x:p.x,y:p.y,vx:-shot.vx*rnd(.1,.35)+rnd(-1.5,1.5),vy:rnd(-3,0),life:rnd(14,26),c:pick(['#c58a4a','#8a5a2e','#e8dcc8']),r:rnd(1.2,2.6)});
   StuckShots.add(shot,hit,p);if(e?.type!=='npc'&&onScreen(p.x,0))Snd.arrowHit();
   FX.ring(p.x,p.y,18);shot.life=0;
  }
  this.list=this.list.filter(s=>s.life>0);
 },
 draw(){
  for(const s of this.list){
   // след в воздухе: сужающийся светлый росчерк
   // у копья (v=396) шлейф длиннее и с тёмной каймой — виден и на светлом небе
   if(s.id==='spear'&&s.trail.length>1){ctx.save();ctx.lineCap='round';for(let i=1;i<s.trail.length;i++){const a=s.trail[i-1],b=s.trail[i],k=i/s.trail.length;ctx.strokeStyle=`rgba(90,60,30,${.28*k})`;ctx.lineWidth=9*k;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.restore();}
   if(s.trail.length>1){ctx.save();ctx.lineCap='round';for(let i=1;i<s.trail.length;i++){const a=s.trail[i-1],b=s.trail[i],k=i/s.trail.length;ctx.strokeStyle=`rgba(255,255,255,${(s.id==='spear'?.8:.5)*k})`;ctx.lineWidth=(s.id==='spear'?5.5:3.2)*k;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.restore();}
   drawShotSprite(s.id,s.x,s.y,Math.atan2(s.vy,s.vx)+(s.spin||0),s.size||1,1);
  }
 }
};
// стрела (как на рисунке лука: древко, серебряный наконечник, жёлтое оперение) или нож/копьё картинкой; L — длина стрелы
function drawArrow(g,L){
 g.lineCap='round';g.strokeStyle='#4a2a12';g.lineWidth=3.4;g.beginPath();g.moveTo(-L*.5,0);g.lineTo(L*.32,0);g.stroke();
 g.strokeStyle='#c4743a';g.lineWidth=1.8;g.beginPath();g.moveTo(-L*.5,0);g.lineTo(L*.32,0);g.stroke();
 g.fillStyle='#dfe8f5';g.strokeStyle='#4a3a2e';g.lineWidth=1;g.beginPath();g.moveTo(L*.5,0);g.lineTo(L*.28,-3.6);g.lineTo(L*.32,0);g.lineTo(L*.28,3.6);g.closePath();g.fill();g.stroke();
 g.fillStyle='#ffd23a';g.strokeStyle='#8a5a12';for(const sy of [-1,1]){g.beginPath();g.moveTo(-L*.5,0);g.lineTo(-L*.36,0);g.lineTo(-L*.46,sy*4.6);g.lineTo(-L*.56,sy*4.2);g.closePath();g.fill();g.stroke();}
}
function drawShotSprite(id,x,y,ang,size,alpha){
 ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.globalAlpha=alpha;
 if(id==='bow'){ctx.scale(size,size);drawArrow(ctx,34);}
 else{const im=SPR['wpn_'+id],w=(id==='spear'?64:32)*size;if(im)ctx.drawImage(im,-w/2,-w*im.height/im.width/2,w,w*im.height/im.width);}
 ctx.restore();
}
// воткнувшиеся стрелы, ножи и копья: держатся за часть тела (двигаются вместе с ней) или торчат из стены/пола, потом тают
const StuckShots={list:[],
 add(shot,body,p){
  const npc=body?.plugin?.ent?.type==='npc',ang=Math.atan2(shot.vy,shot.vx),depth=shot.id==='spear'?(npc?34:14):shot.id==='bow'?(npc?14:9):(npc?10:6);
  const tip={x:p.x-Math.cos(ang)*depth,y:p.y-Math.sin(ang)*depth};
  const live=body&&!body.isStatic;
  this.list.push({id:shot.id,size:shot.size||1,body:live?body:null,ent:live?body.plugin?.ent:null,
   off:live?Vector.rotate(Vector.sub(tip,body.position),-body.angle):tip,ang:live?ang-body.angle:ang,t:frame,life:live?150:240});
  if(this.list.length>40)this.list.shift();
 },
 draw(){
  this.list=this.list.filter(s=>frame-s.t<s.life&&!(s.body&&(s.body.plugin?.gone||s.ent?.removed)));
  for(const s of this.list){
   const left=s.life-(frame-s.t),a=Math.min(1,left/30);
   let x=s.off.x,y=s.off.y,ang=s.ang;
   if(s.body){const w=Vector.add(s.body.position,Vector.rotate(s.off,s.body.angle));x=w.x;y=w.y;ang+=s.body.angle;}
   // воткнулся остриём: центр картинки отодвинут назад вдоль полёта
   // копьё в теле — насквозь: центр картинки почти в точке попадания, наконечник торчит с другой стороны
   const back=(s.id==='spear'?(s.ent?4:26):s.id==='bow'?12:8)*s.size;
   drawShotSprite(s.id,x-Math.cos(ang)*back,y-Math.sin(ang)*back,ang,s.size,a);
  }
 },
 clear(){this.list=[];}
};
