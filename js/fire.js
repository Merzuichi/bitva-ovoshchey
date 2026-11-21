'use strict';
/* ============ огнемёт и горение (v=382) ============ */
// Огнемёт: пока зажата атака, из сопла бьёт струя языков пламени (каждые FLAME_CD кадров — новые языки, расход топлива).
// Языки летят, слабеют, поднимаются и стелются по земле, пережигают верёвки, ранят и поджигают.
// Подожжённый горит BURN_T кадров: урон каждые BURN_TICK кадров, на теле пляшет огонь и идёт дым.
// С шансом PANIC_CHANCE подожжённый (не босс и не герой игрока) паникует: бросает драку и с криком убегает от поджигателя.
// баланс (замер tools: 10 с атаки по манекенам): огнемёт ≈ базука по одной цели, сильнее против толпы, но бьёт только вблизи
const WOOD_ITEMS=new Set(['box','barrel','plank','crate']),WOOD_BURN_DMG=3,FIRE_DECO_MAX=520,BURN_T=210,BURN_TICK=10,BURN_DMG=1.5,PANIC_CHANCE=.4,PANIC_T=[130,210],FLAME_MAX=240;

Object.assign(WEAPONS,{
 // dmg — урон одного языка при попадании; range — дальность для ИИ и автострельбы; mag — топливо (одна порция на выстрел)
 flamer:{n:'Огнемёт',e:'🔥',type:'flame',dmg:.55,cd:3,len:56,mag:90,rl:130,range:230,lock:3600}  // v=394: за монеты (раньше за рекламу), дороже базуки
});
// картинки нарисованы ChatGPT (Codex image_gen), исходники — Playgama_media/flamer_art_v383, импорт tools/import_codex_weapon.py
SPRITES.wpn_flamer='weapons/wpn_flamer_v383.png';AVAILABLE.add('wpn_flamer');
SPRITES.icon_wpn_flamer='weapons/icon_wpn_flamer_v383.png';AVAILABLE.add('icon_wpn_flamer');
WPN_FIT.flamer={L:66,gx:.285,gy:.6};

const Fire={
 list:[],   // языки струи (наносят урон)
 deco:[],   // огонь на горящих телах (только картинка)
 spr:null,
 clear(){this.list=[];this.deco=[];},
 // заранее нарисованные «капли» пламени: белое ядро → жёлтый → оранжевый → красный → дым
 sprites(){
  if(this.spr)return this.spr;
  const mk=stops=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
   stops.forEach(([o,col])=>gr.addColorStop(o,col));g.fillStyle=gr;g.fillRect(0,0,64,64);return c;};
  // насыщенные мультяшные цвета с плотной серединой: читаются и на светлом небе, и ночью
  this.spr=[
   mk([[0,'rgba(255,255,215,1)'],[.3,'rgba(255,236,110,1)'],[.62,'rgba(255,170,30,.95)'],[.85,'rgba(255,110,20,.55)'],[1,'rgba(255,90,0,0)']]),
   mk([[0,'rgba(255,214,70,1)'],[.38,'rgba(255,140,25,1)'],[.7,'rgba(236,72,18,.85)'],[.9,'rgba(200,40,10,.35)'],[1,'rgba(180,30,0,0)']]),
   mk([[0,'rgba(250,110,25,.95)'],[.45,'rgba(214,52,14,.85)'],[.8,'rgba(150,30,8,.4)'],[1,'rgba(110,20,0,0)']]),
   mk([[0,'rgba(95,85,80,.6)'],[.6,'rgba(75,68,62,.35)'],[1,'rgba(60,55,50,0)']]),
   mk([[0,'rgba(255,250,200,.9)'],[.5,'rgba(255,220,120,.35)'],[1,'rgba(255,200,80,0)']])];
  return this.spr;
 },
 /* ---------- выстрел ---------- */
 emit(ent,wp){
  const m=weaponMuzzle(ent),a=m.angle;
  for(let i=0;i<3;i++){
   const sp=rnd(6.8,9.4),aa=a+rnd(-.16,.16);
   this.list.push({x:m.x+Math.cos(a)*6,y:m.y+Math.sin(a)*6,vx:Math.cos(aa)*sp+(ent.parts.torso.velocity.x*.6),vy:Math.sin(aa)*sp,t:0,life:ri(24,32),r:7,owner:ent,team:ent.team,dmg:wp.dmg*(ent.dmgMul||1),hit:new Set(),seed:Math.random()*6});
  }
  if(this.list.length>FLAME_MAX)this.list.splice(0,this.list.length-FLAME_MAX);
  if(ent.isPlayer||onScreen(m.x,0)){if(frame-(ent.flameSndAt??-99)>8){ent.flameSndAt=frame;Snd.play('flame',.7);}}
  ent.firingFlameAt=frame;
 },
 /* ---------- поджог ---------- */
 ignite(e,src){
  if(e.dead||e.removed||e.hung||e.caged)return;
  const fresh=!(e.burnUntil>frame);
  e.burnUntil=frame+BURN_T;e.burnSrc=src||e.burnSrc;
  if(!fresh)return;
  const q=e.parts.torso.position;FX.burst(q.x,q.y,60,'#ff8a1e');Snd.play('ignite',.8);
  if(!e.isPlayer&&!e.boss&&!e.hostage&&!e.guard&&Math.random()<PANIC_CHANCE){e.panicUntil=frame+ri(PANIC_T[0],PANIC_T[1]);e.panicFrom=src||null;FX.excl(e);Snd.voice('v_pain',.8,1,300);}
 },
 hitTest(f){
  for(const e of entities){
   if(e.type!=='npc'||e.dead||e.removed||e.hung||e.caged||e===f.owner||f.hit.has(e))continue;
   if(f.team>=0&&e.team===f.team)continue;
   const t=e.parts.torso.bounds,pad=f.r*.8;
   if(f.x<t.min.x-pad-10||f.x>t.max.x+pad+10||f.y<t.min.y-pad-30||f.y>t.max.y+pad+40)continue;
   let near=false;for(const b of e.bodies)if(e.attached.has(b.plugin.part)){const bb=b.bounds;if(f.x>bb.min.x-pad&&f.x<bb.max.x+pad&&f.y>bb.min.y-pad&&f.y<bb.max.y+pad){near=true;break;}}
   if(!near)continue;
   f.hit.add(e);
   damageNpc(e,f.dmg*(Mode.dmgTo?Mode.dmgTo(e):1)*(e.isPlayer&&Mode.id==='level'?.6:1),f.x,f.y,f.owner);
   this.ignite(e,f.owner);
  }
  // деревянные предметы тлеют, верёвки перегорают
  // v=396: деревянные ящики, бочки и доски горят и ломаются (раньше урон был меньше 1 — hurtItem его не засчитывал)
  for(const e of entities){if(!WOOD_ITEMS.has(e.item)||e.removed||!e.bodies[0]||f.hit.has(e))continue;const b=e.bodies[0].bounds,pad=f.r*.6;
   if(f.x>b.min.x-pad&&f.x<b.max.x+pad&&f.y>b.min.y-pad&&f.y<b.max.y+pad){f.hit.add(e);hurtItem(e,WOOD_BURN_DMG,f.x,f.y);if(Math.random()<.3)this.deco.push({x:f.x,y:f.y,vx:0,vy:-rnd(1,2),t:0,life:ri(14,22),r:rnd(6,10)});}}
 },
 /* ---------- шаг ---------- */
 update(){
  for(const f of this.list){
   f.t++;const px=f.x,py=f.y;
   f.x+=f.vx;f.y+=f.vy;f.vx*=.955;f.vy=f.vy*.95-.07;f.r=7+f.t*1.4;
   if(f.y>FLOOR-6&&!inPit(f.x)){f.y=FLOOR-6;f.vy=Math.min(0,f.vy);f.vx*=.9;}
   if(f.t<f.life*.75){cutRopesAlong({x:px,y:py},f,3);if(f.t%2===0)this.hitTest(f);}
  }
  this.list=this.list.filter(f=>f.t<f.life);
  // горящие: урон, огонь на теле, дым, крик
  for(const e of entities){
   if(e.type!=='npc'||!(e.burnUntil>frame))continue;
   if(e.dead||e.removed){if(e.dead&&frame%6===0&&e.burnUntil-frame>60&&this.deco.length<FIRE_DECO_MAX){const q=e.parts.torso.position;this.deco.push({x:q.x+rnd(-10,10),y:q.y,vx:rnd(-.3,.3),vy:-rnd(.6,1.2),t:0,life:30,r:7,smoke:true});}continue;}
   if(frame%BURN_TICK===0){const q=e.parts.torso.position;damageNpc(e,BURN_DMG*(e.burnSrc?.dmgMul||1)*(e.isPlayer&&Mode.id==='level'?.6:1),q.x,q.y,e.burnSrc||null);}
   // v=396: горящий — весь в огне: каждый кадр языки пламени с нескольких частей тела, крупнее и выше
   if(this.deco.length<FIRE_DECO_MAX){const parts=e.bodies.filter(b=>e.attached.has(b.plugin.part));for(let k=0;k<3;k++){const b=pick(parts);if(b)this.deco.push({x:b.position.x+rnd(-8,8),y:b.position.y+rnd(-8,4),vx:rnd(-.5,.5)+b.velocity.x*.6,vy:-rnd(1.6,3.2),t:0,life:ri(16,26),r:rnd(8,14)});}}
   if(frame%7===0&&this.deco.length<FIRE_DECO_MAX){const q=e.parts.head.position;this.deco.push({x:q.x+rnd(-8,8),y:q.y-10,vx:rnd(-.3,.3),vy:-rnd(.8,1.4),t:0,life:34,r:8,smoke:true});}
  }
  for(const d of this.deco){d.t++;d.x+=d.vx;d.y+=d.vy;d.r+=d.smoke?.35:.15;}
  this.deco=this.deco.filter(d=>d.t<d.life);
 },
 /* ---------- отрисовка ---------- */
 drawBlob(x,y,r,k,smoke){
  const s=this.sprites(),im=smoke?s[3]:k<.25?s[0]:k<.55?s[1]:k<.85?s[2]:s[3];
  ctx.globalAlpha=smoke?(1-k)*.8:k<.85?1-k*.35:(1-k)*3;ctx.drawImage(im,x-r,y-r,r*2,r*2);
 },
 draw(){
  if(!this.list.length&&!this.deco.length&&!entities.some(e=>e.weapon==='flamer'))return;
  ctx.save();
  // дым — обычным смешиванием, огонь — «светом»
  for(const d of this.deco)if(d.smoke)this.drawBlob(d.x,d.y,d.r,d.t/d.life,true);
  for(const f of this.list)if(f.t/f.life>.85)this.drawBlob(f.x,f.y,f.r*1.2,f.t/f.life,true);
  // сначала внешние красно-оранжевые языки, поверх — жёлтые и белые сердцевины; лёгкое свечение — сложением
  for(const d of this.deco)if(!d.smoke)this.drawBlob(d.x,d.y,d.r,Math.min(.8,.3+d.t/d.life*.6),false);
  for(const f of this.list){const k=f.t/f.life;if(k>.85)continue;const wob=Math.sin(f.t*.7+f.seed)*2;this.drawBlob(f.x+wob,f.y,f.r*1.15,Math.min(.84,k+.3),false);}
  for(const f of this.list){const k=f.t/f.life;if(k>.6)continue;this.drawBlob(f.x,f.y,f.r*.7,k*.4,false);}
  ctx.globalCompositeOperation='lighter';const glow=this.sprites()[4];
  // горящий светится: тёплый ореол вокруг всего тела, мерцает
  for(const e of entities){if(e.type!=='npc'||e.removed||!(e.burnUntil>frame)||!onScreen(e.parts.torso.position.x,60))continue;const q=e.parts.torso.position,R=(70+Math.sin(frame*.5+q.x)*8)*(e.s||1);ctx.globalAlpha=.55;ctx.drawImage(glow,q.x-R,q.y-R*1.15,R*2,R*2);}
  for(let i=0;i<this.list.length;i+=2){const f=this.list[i],k=f.t/f.life;if(k>.6)continue;ctx.globalAlpha=.35*(1-k);ctx.drawImage(glow,f.x-f.r*1.6,f.y-f.r*1.6,f.r*3.2,f.r*3.2);}
  ctx.globalCompositeOperation='source-over';
  // дежурный огонёк на сопле у всех, кто держит огнемёт
  for(const e of entities){if(e.type!=='npc'||e.dead||e.weapon!=='flamer'||!armSide(e)||!onScreen(e.parts.torso.position.x,40))continue;
   const m=weaponMuzzle(e),fl=.75+Math.sin(frame*.9+e.parts.torso.id)*.2+Math.random()*.1,firing=frame-(e.firingFlameAt??-99)<4;
   this.drawBlob(m.x+Math.cos(m.angle)*4,m.y+Math.sin(m.angle)*4-1,(firing?9:5.5)*fl,.15,false);}
  ctx.restore();ctx.globalAlpha=1;
 },
 // ночью пламя светит: окошки во мгле (вызывается из drawNight)
 lightHoles(hole){
  for(let i=0;i<this.list.length;i+=4){const f=this.list[i];hole(f.x,f.y,40+f.r*2,.7);}
  for(const e of entities)if(e.type==='npc'&&e.burnUntil>frame&&!e.removed){const q=e.parts.torso.position;hole(q.x,q.y,110,.75);}
 }
};
