'use strict';
/* ============ забеги: маятники, движущиеся платформы, погоня (v=372) ============ */
// Маятник: бревно (позже — наковальня) на верёвке качается над дорогой. Сбивает всех, кого заденет на скорости.
// Перережь верёвку пальцем, мечом или пулей — груз полетит по ходу качания, во врагов за маятником.
// Движущиеся платформы: над широкой ямой ездит туда-сюда, у высокого уступа ездит вверх-вниз; стоящих везёт с собой.
// Погоня: раз в акт за героем ползёт волна «Озверина». Догнала — жжёт и выталкивает вперёд; с контрольной точки начинается снова.
const PEND_HIT_SPEED=4,PEND_HIT_GAP=30,CHASE_LEAD=620;
const RunHazards={
 pends:[],movers:[],chase:null,caps:[],
 clear(){this.pends=[];this.movers=[];this.chase=null;this.caps=[];},
 /* ---------- подвешенный друг ---------- */
 captive(ax,ay,kind,v='plain'){
  const f=spawnRagdoll(kind,ax,ay+190,{team:0,ai:false,weapon:ROSTER.story[kind]?ROSTER.story[kind].weapon:'fists',hpMul:1.4,speed:2.9,aggro:520});
  const tb=f.parts.torso;f.facing=-1;f.hangCaptive=true;
  if(v==='two'){for(const s of [-1,1]){addRope({x:ax+s*80,y:ay},{body:tb,pt:{x:s*6,y:-tb.plugin.h/2}});this.pends.push({mountOnly:true,ax:ax+s*80,ay});}}
  else{addRope({x:ax,y:ay},{body:tb,pt:{x:0,y:-tb.plugin.h/2}});this.pends.push({mountOnly:true,ax,ay});}
  Run.cagesTotal++;this.caps.push({f,ax,ay,v,freed:false,told:false,seed:Math.random()*6});
 },
 // подсказка к каждой головоломке — один раз за игру
 capTip(v){return {plain:'Друг подвешен! Перережь верёвку пальцем, мечом или пулей',pit:'Друг висит над кольями! Режь верёвку, когда он качнётся над землёй',two:'Две верёвки — перережь обе. После первой друг закачается',guard:'Под другом враг! Перережь верёвку — друг свалится врагу на голову'}[v];},
 updateCaptives(h){
  for(const c of this.caps){
   const f=c.f;if(c.freed||c.lost)continue;
   // друг погиб (упал на колья, задели) — снимаем его со счёта, иначе финиш не откроется
   if(f.removed||f.dead){c.lost=true;Run.cagesTotal=Math.max(Run.freed,Run.cagesTotal-1);toast(t('Друг не выжил…'));continue;}
   const tk=c.v==='plain'?'hangcap':'hang_'+c.v;
   if(!c.told&&h&&!S.tut[tk]&&Math.abs(h.parts.torso.position.x-c.ax)<480){c.told=true;S.tut[tk]=1;save();showTip(t(this.capTip(c.v)));}
   // над ямой друг раскачивается (как маятник): перерезать надо в крайней точке, над землёй
   if(c.v==='pit'&&f.hung){const tb=f.parts.torso,want=c.ax+118*Math.sin(frame*.032+c.seed);Body.setVelocity(tb,{x:clamp((want-tb.position.x)*.09,-6,6),y:tb.velocity.y});}
   if(f.hung||frame-f.grounded>6)continue;
   // упал на врага — оглушает и ранит его
   if(c.v==='guard')for(const e of entities){if(e.type!=='npc'||e.team!==1||e.dead)continue;const q=e.parts.torso.position,p=f.parts.torso.position;if(Math.abs(q.x-p.x)<70&&Math.abs(q.y-p.y)<120){damageNpc(e,Math.max(30,e.hpMax*.6),q.x,q.y-30,Run.hero);e.stun=Math.max(e.stun||0,90);FX.ring(q.x,q.y-30,50);floats.push({x:q.x,y:q.y-70,t:'BONK!',life:40,c:'#ffe27a',big:1.4,pop:1});shake=Math.min(12,shake+4);}}
   // упал на землю — свободен: лечим и ведём за героем
   c.freed=true;Run.freed++;f.ai=true;f.follow=true;f.invuln=60;healNpc(f,1);FX.heal(f.parts.head.position.x,f.parts.head.position.y-20);
   Snd.unlock();Snd.voice('v_joy',.7,1,0);toast(t('🔓 {0} на свободе!',npcName(f.kind)));
  }
 },
 /* ---------- маятник ---------- */
 pendulum(ax,ay,len,amp,heavy){
  const x=ax+Math.sin(amp)*len,y=ay+Math.cos(amp)*len;
  const w=heavy?spawnItem('anvil',x,y,{crush:4}):spawnItem('plank',x,y,{w:132,d:.006});
  const b=w.bodies[0];b.plugin.crush=heavy?7:5;w.pendulum=true;  // v=453: маятник бьёт сильнее (было 4 / 3)
  const rope=addRope({x:ax,y:ay},{body:b,pt:{x:0,y:heavy?-14:-7}});
  this.pends.push({w,b,rope,ax,ay,len,vb:0,hits:new Map(),heavy});
 },
 updatePendulums(h){
  for(const p of this.pends){
   if(p.mountOnly||p.w.removed)continue;
   const b=p.b,free=p.rope.removed||!entities.includes(p.rope);
   const dx=b.position.x-p.ax,dy=b.position.y-p.ay,sp=Vector.magnitude(b.velocity);
   if(!free){
    // внизу дуги поддерживаем размах: трение и удары не должны его гасить
    if(Math.abs(dx)<14&&dy>0){if(!p.vb)p.vb=sp;else if(sp<p.vb*.96&&sp>.2)Body.setVelocity(b,Vector.mult(b.velocity,p.vb/sp));}
    if(!p.told&&h&&!S.tut.pend&&Math.abs(h.parts.torso.position.x-p.ax)<520){p.told=true;S.tut.pend=1;save();showTip(t('Перережь верёвку маятника — груз полетит во врагов!'));}
   }else if(!p.cutAt){p.cutAt=frame;FX.word(b.position.x,b.position.y-40,'whammm',80);}
   // удар грузом на скорости: урон и отброс по ходу движения, каждому не чаще раза в PEND_HIT_GAP кадров
   if(sp<PEND_HIT_SPEED)continue;
   const bb=b.bounds;
   for(const e of entities){
    if(e.type!=='npc'||e.dead||e.removed||e.hung||e.caged)continue;
    const t=e.parts.torso.bounds;if(t.max.x<bb.min.x-6||t.min.x>bb.max.x+6||t.max.y<bb.min.y-6||t.min.y>bb.max.y+6)continue;
    if(frame-(p.hits.get(e)??-99)<PEND_HIT_GAP)continue;p.hits.set(e,frame);
    const k=clamp(sp/9,.5,1.6),dir=Math.sign(b.velocity.x)||1,q=e.parts.torso.position;
    damageNpc(e,(p.heavy?20:14)*k*(e.isPlayer&&Mode.id==='level'?.8:1)*(free?1.3:1),q.x,q.y,null);
    for(const part of e.bodies)if(e.attached.has(part.plugin.part))Body.setVelocity(part,{x:dir*7*k,y:-5*k});
    e.stun=Math.max(e.stun||0,28);FX.hit(q.x,q.y);FX.word(q.x,q.y-50,'smack',80);Snd.hit(16);
    if(e.isPlayer)shake=Math.min(12,shake+5);
   }
  }
 },
 /* ---------- движущиеся платформы ---------- */
 mover(x,y,w,dx,dy,sp,ph){
  const e=spawnItem('platform',x,y,{w});this.movers.push({e,b:e.bodies[0],bx:x,by:y,dx,dy,sp,ph});
 },
 updateMovers(){
  for(const m of this.movers){
   if(m.e.removed)continue;
   const k=Math.sin(frame*m.sp+m.ph),nx=m.bx+m.dx*k,ny=m.by+m.dy*k,ox=m.b.position.x,oy=m.b.position.y;
   Body.setPosition(m.b,{x:nx,y:ny},true);
   const ddx=nx-ox,ddy=ny-oy;
   // кто стоит на платформе — едет вместе с ней
   for(const e of entities){
    if(e.type!=='npc'||e.dead||e.removed||e.plat!==m.b||frame-(e.platF??-99)>3)continue;
    for(const b of e.bodies)if(e.attached.has(b.plugin.part))Body.translate(b,{x:ddx,y:Math.min(0,ddy)});
   }
  }
 },
 /* ---------- погоня ---------- */
 updateChase(h){
  const def=Run.def,c=this.chase;if(!def?.chase||!h||h.removed)return;
  const hx=h.parts.torso.position.x;
  if(!c){if(hx>620&&Run.state==='play'){const tut=def.chase.tutor&&!S.tut.wave;this.chase={x:hx-CHASE_LEAD-(tut?260:0),v:0,warned:false,bub:[],tut};showBanner(t('Беги!'),t('За тобой ползёт волна Озверина — не останавливайся!'),'#8fe35a');
   // обучение волне (один раз): подсказка, волна стартует дальше и первые секунды ползёт медленно
   if(tut){S.tut.wave=1;save();setTimeout(()=>{if(this.chase&&Run.state==='play')showTip(t('Сзади волна Озверина! Беги вправо, перепрыгивай преграды и не стой на месте'));},1600);GameStats.send('tutorial_step',{tutorial:'wave',step:'shown'});}Snd.voice('v_iiiha',.8,1,0);}return;}
  const flag=LevelMode.flag?.x??LW;
  if(c.x>flag-260)return; // у флага волна останавливается
  const base=def.chase.speed||2.6,gap=hx-c.x;
  // резинка: далеко отстала — догоняет быстрее, вплотную — чуть медленнее, чтобы был шанс убежать
  const want=(gap>900?base*1.7:gap<160?base*.8:base)*(c.tut&&frame-(c.t0??=frame)<300?.6:1);
  c.v+=(want-c.v)*.05;c.x+=c.v;
  if(!c.warned&&gap<360){c.warned=true;toast(t('Волна догоняет!'));}
  // кто в волне — получает урон и вылетает вперёд
  for(const e of entities){
   if(e.type!=='npc'||e.dead||e.removed||e.hung||e.caged)continue;
   const p=e.parts.torso.position;if(p.x>c.x-6)continue;
   const hurt=e.isPlayer?e.hpMax*.005:1.2;damageNpc(e,hurt,p.x,p.y,null);
   // выталкивает вперёд, но не в яму
   if(frame%12===0&&!inPit(p.x+60)&&!inPit(p.x+120)){for(const b of e.bodies)if(e.attached.has(b.plugin.part))Body.setVelocity(b,{x:Math.max(b.velocity.x,6),y:-4});juice(p.x,p.y,'#9cff6a',4,3);}
  }
  // брызги срываются с завитка и падают перед волной, у земли — пенные капли
  const H=Math.min(FLOOR-viewY+20,300),yTop=FLOOR-H;
  if(frame%2===0&&particles.length<900){const y=yTop+rnd(10,60);particles.push({x:this.waveFront(c,y,yTop,H,frame)+rnd(0,12),y,vx:c.v+rnd(1,3.5),vy:rnd(-3.5,-.5),life:rnd(24,44),c:pick(['#9cff6a','#d9ffb0','#7be04a']),r:rnd(2,4.5)});}
  if(frame%4===0&&particles.length<900)particles.push({x:c.x+rnd(-10,25),y:FLOOR-rnd(4,14),vx:c.v+rnd(.5,2),vy:rnd(-2.5,-1),life:rnd(14,24),c:'#e8ffd0',r:rnd(2,3.5)});
 },
 onRespawn(x){if(this.chase){this.chase.x=x-CHASE_LEAD;this.chase.v=0;this.chase.warned=false;}},
 update(h){
  this.updateMovers();this.updatePendulums(h);this.updateCaptives(h);this.updateChase(h);
 },
 /* ---------- отрисовка ---------- */
 draw(){
  // крепления маятников: деревянная балка с крюком
  // крепление — доска из рисунков ChatGPT (item_plank, как и само бревно); свой крюк: Playgama_media/bow_art_prompts_v372.md
  for(const p of this.pends){
   const im=SPR.item_plank;
   if(im){const w=110,h=22;ctx.drawImage(im,p.ax-w/2,p.ay-h+4,w,h);}
   else{ctx.save();ctx.fillStyle='#7a4a24';ctx.beginPath();ctx.roundRect(p.ax-46,p.ay-16,92,16,5);ctx.fill();ctx.restore();}
  }
  const c=this.chase;if(c)this.drawWave(c);
 },
 // волна «Озверина» — силуэт разбивающейся волны: спереди высокий гребень с завитком и белой пенной кромкой,
 // назад она плавно спускается «хвостом»; стоит на земле, у основания пенная лужа. Всё колышется и катится
 waveFront(c,y,yTop,H,t){
  const u=clamp((y-yTop)/H,0,1);
  // гребень → завиток вперёд → вогнутая стенка → основание чуть впереди
  const shape=u<.2?Math.sin(u/.2*Math.PI*.5)*52:u<.6?52-(u-.2)/.4*76:-24+(u-.6)/.4*40;
  return c.x+shape+Math.sin(y*.055-t*.22)*6+Math.sin(y*.13+t*.37)*2.5;
 },
 // верх «хвоста» волны: от гребня назад спускается и колышется
 waveTop(x,crestX,yTop,t,drop){
  const back=Math.max(0,crestX-x);
  return Math.min(FLOOR-70,yTop+12+back*drop+Math.sin(x*.02-t*.12)*7+Math.sin(x*.047+t*.21)*3);
 },
 // v=393: по просьбе вернули прежнюю волну, нарисованную кодом (рисунок ChatGPT v=392 лежит в Playgama_media/wave_art_v392)
 drawWave(c){
  const t=frame,left=camX+viewX-60;if(c.x+80<left)return;
  const H=Math.min(FLOOR-viewY+20,290),yTop=FLOOR-H+Math.sin(t*.06)*8,bot=FLOOR+14;  // v=394: низ волны заходит на полосу травы — без зазора между волной и землёй
  const crestX=this.waveFront(c,yTop,yTop,H,t);
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  // задний вал: ниже и темнее, с собственной светлой кромкой — даёт объём
  {const yT=yTop+38+Math.sin(t*.05+2)*10,cx=crestX-110;
   const bg=ctx.createLinearGradient(0,yT,0,FLOOR);bg.addColorStop(0,'#38a032');bg.addColorStop(1,'#14461a');
   ctx.fillStyle=bg;ctx.beginPath();ctx.moveTo(left,bot);
   const top=[];for(let x=left;x<=cx;x+=16){const y=this.waveTop(x,cx,yT,t+50,.32);top.push([x,y]);ctx.lineTo(x,y);}
   for(let y=yT;y<=bot;y+=12)ctx.lineTo(this.waveFront({x:c.x-115},y,yT,FLOOR-yT,t+50),y);
   ctx.lineTo(left,bot);ctx.closePath();ctx.fill();
   ctx.strokeStyle='rgba(200,255,160,.55)';ctx.lineWidth=4;ctx.beginPath();top.forEach(([x,y],k)=>k?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
  // основная волна
  const g=ctx.createLinearGradient(c.x-380,0,c.x+60,0);g.addColorStop(0,'#155a19');g.addColorStop(.55,'#2f9a2a');g.addColorStop(.85,'#5cc83c');g.addColorStop(1,'#9af065');
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(left,bot);
  const top=[];for(let x=left;x<=crestX;x+=14){const y=this.waveTop(x,crestX,yTop,t,.22);top.push([x,y]);ctx.lineTo(x,y);}
  const face=[];for(let y=yTop;y<=bot;y+=8){const x=this.waveFront(c,y,yTop,H,t);face.push([x,y]);ctx.lineTo(x,y);}
  ctx.lineTo(left,bot);ctx.closePath();ctx.fill();
  const sh=ctx.createLinearGradient(0,yTop,0,FLOOR);sh.addColorStop(0,'rgba(0,40,0,0)');sh.addColorStop(1,'rgba(0,35,0,.4)');ctx.fillStyle=sh;ctx.fill();
  // тень под нависающим завитком
  ctx.strokeStyle='rgba(8,55,10,.5)';ctx.lineWidth=16;ctx.beginPath();
  face.forEach(([x,y])=>{const u=(y-yTop)/H;if(u<.1||u>.5)return;u<.11?ctx.moveTo(x-22,y):ctx.lineTo(x-22,y);});ctx.stroke();
  // кромка: пена по всему верху волны и по гребню — сразу видно, где у волны верх
  ctx.strokeStyle='#effee0';ctx.lineWidth=8;ctx.beginPath();top.forEach(([x,y],k)=>k?ctx.lineTo(x,y+3):ctx.moveTo(x,y+3));
  face.forEach(([x,y])=>{if((y-yTop)/H<.24)ctx.lineTo(x-3,y);});ctx.stroke();
  ctx.fillStyle='#f4ffe8';
  for(let k=0;k<top.length;k+=2){const [x,y]=top[k];ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(x+Math.sin(t*.2+k)*2,y+2,3.5+2.5*Math.abs(Math.sin(t*.17+k*.9)),0,7);ctx.fill();}
  // светлый передний край и бегущие вниз блики
  ctx.globalAlpha=1;ctx.strokeStyle='rgba(205,255,160,.85)';ctx.lineWidth=4;ctx.beginPath();face.forEach(([x,y],k)=>k?ctx.lineTo(x-2,y):ctx.moveTo(x-2,y));ctx.stroke();
  for(const [off,a,w] of [[16,.35,4],[38,.22,6],[66,.14,8]]){
   ctx.setLineDash([26,34]);ctx.lineDashOffset=-t*2.4-off*3;ctx.strokeStyle=`rgba(230,255,200,${a})`;ctx.lineWidth=w;ctx.beginPath();
   let on=false;face.forEach(([x,y])=>{if(y<yTop+40||y>FLOOR-12)return;on?ctx.lineTo(x-off,y):(ctx.moveTo(x-off,y),on=true);});ctx.stroke();
  }
  ctx.setLineDash([]);
  // завиток: пенные шапки на нависающем краю
  ctx.fillStyle='#ecffd6';
  for(let k=0;k<12;k++){const f=k/11,y=yTop+f*H*.24,x=this.waveFront(c,y,yTop,H,t)-4,r=(6+4*Math.sin(t*.2+k*1.7))*(1-f*.4)+3;ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(x,y,Math.max(2,r),0,7);ctx.fill();}
  // основание (v=394): без «лужи» перед волной — по всей нижней кромке кипит пена, у фронта шапка пены гуще и выше
  const baseX=this.waveFront(c,FLOOR,yTop,H,t);
  ctx.globalAlpha=.95;ctx.fillStyle='#e6ffcf';
  for(let x=Math.max(left,baseX-700)-8;x<baseX-14;x+=13){const k=Math.round(x/13),y=FLOOR+15-Math.abs(Math.sin(t*.16+k*1.1))*4;ctx.beginPath();ctx.arc(x+Math.sin(t*.25+k)*2,y,7+(k%3)*2,0,7);ctx.fill();}  // пена ниже кромки волны — край не виден
  ctx.fillStyle='#f4ffe8';
  for(let k=0;k<14;k++){const f=k/13,x=baseX+6-f*120+Math.sin(t*.3+k)*3,y=FLOOR+15-Math.abs(Math.sin(t*.18+k*1.3))*10-(1-f)*10-(k%2)*6;ctx.beginPath();ctx.arc(x,y,6+(k%4)*2.5+(1-f)*3,0,7);ctx.fill();}
  ctx.fillStyle='rgba(205,255,170,.9)';for(let k=0;k<6;k++){const x=baseX-8-k*22+Math.sin(t*.2+k*2)*4,y=FLOOR-6-Math.abs(Math.sin(t*.22+k))*14;ctx.beginPath();ctx.arc(x,y,3.5+(k%3)*1.5,0,7);ctx.fill();}
  // пузыри внутри
  ctx.globalAlpha=1;ctx.fillStyle='rgba(225,255,190,.5)';ctx.strokeStyle='rgba(240,255,220,.7)';ctx.lineWidth=1.5;
  for(let k=0;k<14;k++){const bx=c.x-40-((k*61)%300)+Math.sin(t*.07+k)*8,by=FLOOR-12-((k*83+t*(1.2+(k%4)*.4))%(H-50)),r=2.5+(k%4)*1.8;if(bx<left||by<this.waveTop(bx,crestX,yTop,t,.22)+10)continue;ctx.beginPath();ctx.arc(bx,by,r,0,7);ctx.fill();ctx.stroke();}
  ctx.restore();
 },
 // зелёное зарево у левого края экрана, когда волна близко (координаты экрана)
 // v=396: зелёное свечение у края экрана («туман»), когда волна близко, убрано по просьбе — предупреждает тост «Волна догоняет!»
 drawWarn(){}
};

// смертельные колья: в каждом забеге с 4-й главы по одному частоколу, в «главе кольев» каждого акта — три.
// подвешенные друзья: в забегах, где есть клетки, одну клетку заменяем подвешенным; в забегах без клеток с 9-й главы — один подвешенный
STORY.forEach((c,i)=>{
 if(c.type!=='run'||c.climb)return;c.feat=c.feat||{};
 if(i>=3)c.feat.stakes=(c.feat.stakes||0)+1;
 if(c.cages?.length){c.hangcaps=[c.cages.pop()];if(!c.cages.length)delete c.cages;}
 else if(i>=8)c.hangcaps=[pick(['pomidor','morkov','baklazhan'])];
});
for(let a=0;a<ACTS.length;a++){const runs=STORY.filter(c=>c.act===a&&c.type==='run'&&!c.climb&&c.i>1&&!c.chase);const c=runs[runs.length-1];if(c){c.feat.stakes=(c.feat.stakes||0)+2;c.stakeLevel=true;}}
// где появляются новые препятствия: маятники с 6-й главы, платформы над ямой с 9-й, лифты с 19-й;
// погоня — во второй главе-забеге каждого акта (ворота в ней заменены обычной дракой: у волны нельзя стоять)
STORY.forEach((c,i)=>{
 if(c.type!=='run'||c.climb)return;
 c.feat=c.feat||{};
 if(i>=5)c.feat.pend=(c.feat.pend||0)+(i>=14?2:1);
 if(i>=8)c.feat.mplat=(c.feat.mplat||0)+1;
 if(i>=18)c.feat.lift=(c.feat.lift||0)+1;
});
for(let a=0;a<ACTS.length;a++){
 const runs=STORY.filter(c=>c.act===a&&c.type==='run'&&!c.climb&&c.i>1);
 const c=runs[1]||runs[0];if(!c)continue;
 c.chase={speed:2.45+a*.12};
 if(c.feat.gate){c.feat.fight=(c.feat.fight||0)+c.feat.gate;delete c.feat.gate;}
 // у волны нельзя стоять: убираем всё, где надо ждать (пресс, бомбопад, ямы с платформами, лифты)
 delete c.feat.press;delete c.feat.rain;delete c.feat.mplat;delete c.feat.lift;
 // первая волна (акт 1) — обучающая: медленнее, без смертельных ловушек и маятника, с подсказкой при появлении волны
 if(a===0){c.chase.speed=2.15;c.chase.tutor=true;delete c.feat.stakes;delete c.feat.spikeplat;delete c.feat.spikes;delete c.feat.pend;c.feat.hang=Math.min(c.feat.hang||0,1);c.feat.coins=(c.feat.coins||0)+2;}
 // v=396: у волны проще — без союзников и пленников (их некогда спасать), одна короткая драка на весь уровень
 delete c.cages;delete c.hangcaps;c.allies=[];delete c.feat.hang;c.feat.fight=1;c.feat.coins=(c.feat.coins||0)+1;
 // волна и ветер вместе не бывают: ветер сносит героя прямо в волну
 if(c.mods)c.mods=c.mods.filter(m=>m!=='wind');
}
