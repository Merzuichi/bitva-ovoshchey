'use strict';
/* ============ физический мир: сущности, урон, отрисовка ============ */
const {Engine,Bodies,Body,Composite,Constraint,Events,Query,Vector,Bounds}=Matter;
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const normA=a=>((a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;

const NPC={
 ogurets:{n:'Огурец',e:'🥒',c:'#5fbf4a',c2:'#3d8f2e',s:1,head:'oval',juice:'#7ad85f',flesh:'#e3f5c4'},
 pomidor:{n:'Помидор',e:'🍅',c:'#e8473b',c2:'#b02a20',s:.95,head:'round',juice:'#ff5a4a',flesh:'#ff9a86'},
 baklazhan:{n:'Баклажан',e:'🍆',c:'#7a3fb0',c2:'#4f2378',s:1.05,head:'oval',juice:'#b98ae0',flesh:'#f3ead2'},
 morkov:{n:'Морковка',e:'🥕',c:'#f08a24',c2:'#c0610a',s:.95,head:'oval',juice:'#ffa040',flesh:'#ffc070'},
 arbuz:{n:'Арбузище',e:'🍉',c:'#3fa34d',c2:'#d94a5a',s:1.1,head:'round',juice:'#e8475a',flesh:'#ff6b7a'},
 kaktus:{n:'Кактус',e:'🌵',c:'#3c7a3a',c2:'#25521f',s:1.25,head:'oval',hazard:true,juice:'#9be07c',flesh:'#cdeeb0'},
 perets:{n:'Перчик',e:'🌶️',c:'#e0302a',c2:'#a51d18',s:.9,head:'oval',juice:'#ff5040',flesh:'#ffd9c8'},
 kukuruza:{n:'Кукуруза',e:'🌽',c:'#f2c230',c2:'#5fa83a',s:1,head:'oval',juice:'#ffe070',flesh:'#fff1b0'},
 kapusta:{n:'Капуста',e:'🥬',c:'#9bd46a',c2:'#6aa844',s:1,head:'round',juice:'#c8f0a0',flesh:'#effad8'},
};
// пропорции тела по референсу: отдельной головы нет — тело это сам овощ, лицо на верхней части туловища,
// сверху торчит «макушка» (хвостик/листья — верх спрайта головы, нарисованный позади туловища).
// torso — [ширина, высота] к базе 36×56; arm/leg — [длина, толщина]; top — [ширина макушки к ширине тела, доля спрайта над телом]
const BODY={
 ogurets:{torso:[.7,1.35],arm:[1,.9],leg:[1.05,1.05],top:[.8,.42]},          // длинный и стройный
 pomidor:{torso:[1.75,1],arm:[.85,1.15],leg:[.95,1.3],top:[.55,.3]},      // толстый круглый колобок на коротких ножках
 baklazhan:{torso:[1.35,1.45],arm:[.9,1.05],leg:[.95,1.25],top:[.55,.42]},  // большая «груша»
 morkov:{torso:[1,1.5],arm:[.95,.95],leg:[1,1.05],top:[.85,.5]},          // высокая морковина
 perets:{torso:[.6,1.5],arm:[1.2,.85],leg:[1.25,.95],top:[.85,.4]},         // тонкий стручок, длинные руки-ноги
 kukuruza:{torso:[.85,1.55],arm:[1,.9],leg:[1.05,1.05],top:[.8,.3]},        // высокий початок
 kapusta:{torso:[1.85,1.15],arm:[.9,1.25],leg:[.95,1.35],top:[.6,.28]},     // огромный кочан, ножки-обрубки
 arbuz:{torso:[1.9,1.4],arm:[1.05,1.5],leg:[1,1.5],top:[.45,.32]},         // огромный тяжёлый громила
 kaktus:{torso:[1.05,1.6],arm:[1.05,1.3],leg:[1.05,1.25],top:[.75,.38]},     // высокая колонна
};
const TEAMC=['#3a7bff','#ff4545','#ffcc00'];
const TEAMN=['Синие','Красные','Жёлтые'];

const canvas=$('#game'),ctx=canvas.getContext('2d');
const engine=Engine.create();engine.positionIterations=8;engine.velocityIterations=6;engine.constraintIterations=3;
const world=engine.world;
// WW — ширина экрана в игровых единицах, VH — высота экрана, LW — длина уровня (у длинных уровней больше экрана),
// camX — сдвиг камеры по горизонтали (параллакс фона считается от него)
// viewW — ширина видимого окна (на вертикальном экране в уровне меньше WW), viewX — его сдвиг внутри WW
// viewMode: fit — видно всё (меню, головоломки); follow — ближняя камера за героем; sandbox — ближняя камера, листается через camX
const WH=720,MINW=960,PORTRAIT_W=380,PHONE_VIEW_H=420;
let WW=1280,VH=720,LW=1280,camX=0,fixedLW=false,scale=1,dpr=1,cw=0,ch=0,FLOOR=660,floorInset=110,mapId='garden',viewMode='fit',viewW=1280,viewX=0,viewH=720,viewY=0;
let grounds=[],PITS=[],wallL,wallR;
let lastRender=0,renderDirty=true; // перерисовка на паузе: см. loop()
let entities=[],particles=[],decals=[],flashes=[],tracers=[],floats=[],pickups=[],shake=0,frame=0,entSeq=0;
let slow=false,zeroG=false,grab=null,hitStop=0,slowmoT=0,killSlowT=0,killSlowAt=-9999;
// убил врага на уровне: каждое KILL_SLOW_EVERY-е убийство (v=394: по счёту, а не по случаю — срабатывает предсказуемо),
// но не чаще раза в KILL_SLOW_GAP кадров, время замедляется на KILL_SLOW_T кадров. Не успело остыть — сработает на следующем убийстве
const KILL_SLOW_T=56,KILL_SLOW_EVERY=3,KILL_SLOW_GAP=240;let killSlowN=0;
function killSlow(x,y){if(Mode.id!=='level'||Run.state!=='play'||Tut.on)return;if(++killSlowN<KILL_SLOW_EVERY||frame-killSlowAt<KILL_SLOW_GAP)return;
 killSlowN=0;killSlowAt=frame;killSlowT=KILL_SLOW_T;FX.flashAt(x,y);FX.ring(x,y,60);FX.shock(x,y,120);shake=Math.min(12,shake+3);}
const MAXBODIES=300;
let sandboxZoom=.85,boundsLayout='',sceneW=1280;
const sandboxBuildView=()=>viewMode==='sandbox'&&!document.body.classList.contains('sbplay');
function puzzleSpan(def){
 if(!def?.items?.length)return{cx:480,w:880,h:540};
 let x0=960,x1=0,maxH=460;
 const add=(a,b)=>{if(a<x0)x0=a;if(b>x1)x1=b;};
 for(const it of def.items){
  if(it.t==='zone'||it.t==='pit')add(it.x0-24,it.x1+24);
  else if(it.w)add(it.x-it.w/2-20,it.x+it.w/2+20);
  else if(typeof it.x==='number')add(it.x-68,it.x+68);
  if(it.h)maxH=Math.max(maxH,it.h+80);
  for(const r of it.ropes||[]){add(r[0]-30,r[0]+30);if(r[1])maxH=Math.max(maxH,r[1]+50);}
 }
 x0=clamp(x0,0,900);x1=clamp(x1,60,960);
 return{cx:(x0+x1)/2,w:clamp(x1-x0+60,520,920),h:clamp(maxH,460,640)};
}

function resize(){renderDirty=true;
 // окно нулевого размера (скрытая панель, свёрнутый iframe): scale=0 дал бы NaN в FLOOR и стенах — оставляем прежнюю раскладку
 if(!(innerWidth>0&&innerHeight>0))return;
 cw=innerWidth;ch=innerHeight;
 // v523: на сенсорных экранах холст не больше 1280 точек по длинной стороне (планшет 1180×820 при dpr 1.5 давал 1770×1230 — вдвое больше пикселей на кадр)
 {const touch=matchMedia('(pointer:coarse)').matches;dpr=Math.min(window.devicePixelRatio||1,touch?1.5:2);if(touch)dpr=Math.min(dpr,Math.max(1,1280/Math.max(cw,ch)));}
 if(canvas.width!==Math.round(cw*dpr))canvas.width=Math.round(cw*dpr);
 if(canvas.height!==Math.round(ch*dpr))canvas.height=Math.round(ch*dpr);
 // на узких экранах показываем не меньше MINW по ширине — головоломки и арены должны помещаться
 // вертикальный экран: камера ближе (видно PORTRAIT_W единиц по ширине), логическая ширина уровня остаётся не меньше MINW
 const close=ch>cw&&viewMode!=='fit',follow=close&&viewMode==='follow';
 // Dynamic camera rule: the smaller the screen, the closer the camera is to the player.
 // In portrait: narrow phones (360-390px) get a tight, punchy viewport (260-280 world units),
 // while tablets (768px+) get up to 380 world units.
 const dynPortraitW=clamp(cw*0.72,250,380);
 // телефон боком (низкий экран): в уровнях камера ближе — мир тот же, но в кадре его часть, герой крупнее;
 // окно viewW×viewH ездит за героем по горизонтали (viewX) и по вертикали (viewY)
 // v=451: меню на телефоне — камера ближе, бойцы фоновой сцены крупнее (портрет: ~520 единиц по ширине, боком: 540 по высоте)
 const menuMob=typeof screen!=='undefined'&&screen==='menu'&&document.body.classList.contains('is-mobile');
 const s0=menuMob?(ch>cw?cw/520:ch/540):Math.min(ch/WH,cw/(close?dynPortraitW:MINW));
 const buildView=sandboxBuildView();sceneW=cw/s0;
 // Телефон/планшет боком: чем ниже экран, тем ближе камера. ПК (мышь) — прежняя формула без изменений
 const coarse=matchMedia('(pointer:coarse)').matches,lvl=!close&&(viewMode==='follow'||viewMode==='sandbox')&&cw>ch;
 const landscapeZoom=!lvl?1:coarse?Math.max(1,Math.min(ch/s0/(ch<=420?360:PHONE_VIEW_H),cw/s0/(cw<=740?640:780))):ch<=500?Math.max(1,Math.min(ch/s0/500,cw/s0/820)):1;
 const puzPortrait=ch>cw&&typeof Run!=='undefined'&&screen==='play'&&Run.type==='puzzle';
 const pSpan=puzPortrait?puzzleSpan(Run.def):null;
 const puzZoom=pSpan?Math.max(1,Math.min(MINW/pSpan.w,(ch*.64)/(pSpan.h*s0))):1;
 const zoom=buildView?sandboxZoom:puzPortrait?puzZoom:landscapeZoom;
 scale=s0*zoom;viewW=cw/scale;viewH=ch/scale;VH=ch/s0;
 // песочница: ширина мира = видимая ширина (листается camX), низ кадра прижат к нижней панели
 const sbZoom=viewMode==='sandbox'&&(buildView||zoom>1);
 WW=follow?Math.max(MINW,viewW):sbZoom?viewW:cw/s0;
 viewX=pSpan?clamp((WW-960)/2+pSpan.cx-viewW/2,0,Math.max(0,WW-viewW)):clamp(viewX,0,WW-viewW);
 FLOOR=VH-(follow?Math.max(floorInset,ch*.2):floorInset)/(!buildView&&zoom>1?scale:s0)-6;
 // Construction zoom changes only the camera. World geometry stays in its original coordinates.
 viewY=buildView?FLOOR-FLOOR*s0/scale:(sbZoom||pSpan)?Math.max(0,VH-viewH):clamp(viewY,0,VH-viewH);
 if(!fixedLW)LW=WW;
 camX=clamp(camX,0,Math.max(0,LW-WW));
 placeBounds();
}
const viewTransform=()=>ctx.setTransform(dpr*scale,0,0,dpr*scale,-dpr*scale*viewX,-dpr*scale*viewY);
// поворот экрана в песочнице: всё, что стоит на полу, сдвигаем вслед за новым полом
function shiftWorld(dy){
 if(!dy)return;
 for(const b of Composite.allBodies(world))if(!(b.plugin&&b.plugin.bound))Body.setPosition(b,{x:b.position.x,y:b.position.y+dy});
 for(const c of Composite.allConstraints(world))if(!c.bodyA&&c.pointA)c.pointA.y+=dy;
 for(const e of entities)if(e.pts)for(const p of e.pts)p.y+=dy;
 for(const d of decals)if(typeof d.y==='number')d.y+=dy;
 for(const p of pickups)if(p.t==='crateLoot')p.y+=dy;
}
// v515: окно сменило высоту посреди уровня (выход из полноэкранного режима, свернули панель браузера): пол переехал —
// сдвигаем весь уровень вслед за ним, иначе платформы, монеты и флажок «висят» не там, где пол
function shiftLevel(dy){
 if(!dy)return;shiftWorld(dy);
 for(const p of pickups)if(p.t!=='crateLoot'&&typeof p.y==='number')p.y+=dy;
 const R=typeof Run!=='undefined'?Run:null;
 if(R){for(const q of R.climbNodes||[])q.y+=dy;if(R.climbGoal)R.climbGoal.y+=dy;if(typeof R.climbMinY==='number')R.climbMinY+=dy;if(typeof R.climbPeak==='number')R.climbPeak+=dy;}
 if(typeof LevelMode!=='undefined'&&LevelMode.flag&&typeof LevelMode.flag.y==='number')LevelMode.flag.y+=dy;
 if(typeof RunHazards!=='undefined'){for(const p of RunHazards.pends)if(typeof p.ay==='number')p.ay+=dy;for(const m of RunHazards.movers)if(typeof m.by==='number')m.by+=dy;for(const c of RunHazards.caps)if(typeof c.ay==='number')c.ay+=dy;}
}
function setFloorInset(px){floorInset=px;document.documentElement.style.setProperty('--bh',px+'px');resize();}
const BOUND={isStatic:true,friction:.9,render:{fillStyle:'#0000'},plugin:{bound:true}};
function makeBounds(){
 wallL=Bodies.rectangle(-40,WH/2,80,6000,BOUND);wallR=Bodies.rectangle(LW+40,WH/2,80,6000,BOUND);
 Composite.add(world,[wallL,wallR]);placeBounds();
}
// длина уровня; LW=0 — по ширине экрана (песочница, арены)
function setLevelWidth(w,pits){fixedLW=!!w;LW=w||WW;PITS=pits||[];camX=0;placeBounds();}
// песочница шире экрана: камеру двигают перетаскиванием пустого места, колесом и у края при переноске
const SB_LW=3840,SB_MAX_RISE=1800;
function setSandboxZoom(value,clientX=cw/2,worldX=camX+viewX+clientX/scale){
 if(screen!=='sandbox'||SbPlay.ent)return;
 const next=clamp(value,.5,1.25);
 if(Math.abs(next-sandboxZoom)<.0001)return;
 sandboxZoom=next;dropGrab();pan=null;
 resize();camX=clamp(worldX-viewX-clientX/scale,0,Math.max(0,LW-WW));
}
function panCam(dx){camX=clamp(camX+dx,0,Math.max(0,LW-WW));}
// пол из кусков: между ними ямы
function placeBounds(){
 if(!wallL)return;
 const layout=[LW,VH,FLOOR,JSON.stringify(PITS)].join('|');
 if(layout===boundsLayout)return;
 boundsLayout=layout;
 Body.setPosition(wallL,{x:-40,y:VH/2});Body.setPosition(wallR,{x:LW+40,y:VH/2});
 grounds.forEach(g=>Composite.remove(world,g));grounds=[];
 let x=-3000;const segs=[];
 for(const [a,b] of PITS){segs.push([x,a]);x=b;}segs.push([x,LW+3000]);
 for(const [a,b] of segs)grounds.push(Bodies.rectangle((a+b)/2,FLOOR+60,b-a,120,Object.assign({},BOUND,{plugin:{bound:true,ground:true}})));
 // дно ямы с кольями: кто упал — погиб
 for(const [a,b] of PITS)grounds.push(Bodies.rectangle((a+b)/2,pitTip()+30,b-a,60,Object.assign({},BOUND,{plugin:{bound:true,stakes:true}})));
 Composite.add(world,grounds);
}
const inPit=x=>PITS.some(p=>x>p[0]&&x<p[1]);
// кончики кольев в яме — у самого низа экрана, сами колья уходят за край
const pitTip=()=>FLOOR+20; // колья торчат почти до верха обрыва
// модификаторы уровня (лёд, ветер, ночь, великаны, двойная гравитация) — ставит buildLevel, сбрасывает clearWorld
let MODS={},wind={v:0,to:1,t:0};
const MODDEF={ice:{e:'🧊',n:'Гололёд',d:'Пол скользкий — тормози заранее'},wind:{e:'🌬️',n:'Ветер',d:'Ветер сносит бойцов и предметы'},
 night:{e:'🌙',n:'Ночь',d:'Темно — видно только вокруг героя'},giant:{e:'💪',n:'Великаны',d:'Все бойцы огромные'},heavy:{e:'🪨',n:'Двойная гравитация',d:'Всё падает вдвое быстрее'}};
const mapGravity=()=>(MAPS.find(m=>m.id===mapId)||MAPS[0]).g*(MODS.heavy?2:1);

/* ============ сущности ============ */
function addEnt(type,bodies,cons,data){
 const ent=Object.assign({id:++entSeq,type,bodies,cons:cons||[]},data||{});
 bodies.forEach(b=>{b.plugin=b.plugin||{};b.plugin.ent=ent;});
 Composite.add(world,[...bodies,...ent.cons]);entities.push(ent);return ent;
}
function removeEnt(ent){
 if(!ent||ent.removed)return;ent.removed=true;
 if(grab&&ent.bodies.includes(grab.body))dropGrab();
 ent.bodies.forEach(b=>Composite.remove(world,b));ent.cons.forEach(c=>Composite.remove(world,c));
 entities=entities.filter(e=>e!==ent);
 // верёвки, привязанные к удалённому телу, тоже убираем
 for(const r of entities.filter(e=>e.type==='rope'))if(ent.bodies.some(b=>b===r.cons[0].bodyA||b===r.cons[0].bodyB))removeEnt(r);
}
function clearWorld(){FlyingShots.list=[];StuckShots.clear();if(typeof Fire!=='undefined')Fire.clear();if(typeof RunHazards!=='undefined')RunHazards.clear();FX.list=[];resetCrateTutorial();sinkers=[];MODS={};pendingBooms=[];wind={v:0,to:1,t:0};for(const e of [...entities])removeEnt(e);ropeBits=[];particles=[];decals=[];flashes=[];tracers=[];floats=[];pickups=[];shake=0;hitStop=0;slowmoT=0;killSlowT=0;}
function bodyCount(){return entities.reduce((a,e)=>a+e.bodies.length,0);}
function dropGrab(){if(grab){Composite.remove(world,grab.c);grab=null;}}
const fighters=()=>entities.filter(e=>e.type==='npc');

// o: {team, weapon, ai, player, hpMul, dmgMul, speed, scale, boss}
function spawnRagdoll(kind,x,y,o){
 if(o?.team===1&&o.weapon==='bazooka')o={...o,weapon:'bow'};
 o=o||{};
 const k=NPC[kind],s=k.s*(o.scale||1),g=Body.nextGroup(true);
 const opt=(c,extra)=>Object.assign({collisionFilter:{group:g},friction:.8,frictionAir:.015,density:.0016,restitution:.05,chamfer:{radius:4*s},render:{fillStyle:c}},extra||{});
 // размеры частей по профилю персонажа (в единицах до масштаба s)
 const P=BODY[kind]||BODY.ogurets;
 const TW=36*P.torso[0],TH=56*P.torso[1];
 const UAW=6*P.arm[1],UAL=17*P.arm[0],LAW=6*P.arm[1],LAL=17*P.arm[0];
 const ULW=7.5*P.leg[1],ULL=16*P.leg[0],LLW=7.5*P.leg[1],LLL=17*P.leg[0];
 const sx=TW*.42,sy=-TH*.08,hip=TW*.2;
 // точки суставов (верх части = её «родительский» конец); руки растут по бокам тела
 const shA=-UAL/2+1.5,elA=UAL/2-1,elB=-LAL/2+1,hipT=TH/2-3,hipU=-ULL/2+1.5,knU=ULL/2-1,knL=-LLL/2+1.5;
 // ставим так, чтобы стопы оказались там же, где у базового персонажа (y+61)
 const ty=y+61*s-(hipT-hipU+knU-knL+LLL/2)*s;
 const at=v=>ty+v*s;
 const torso=Bodies.rectangle(x,ty,TW*s,TH*s,opt(k.c,{chamfer:{radius:Math.min(TW,TH)*.45*s}}));
 const uaY=at(sy-shA),laY=at(sy-shA+elA-elB),ulY=at(hipT-hipU),llY=at(hipT-hipU+knU-knL);
 const uaL=Bodies.rectangle(x-sx*s,uaY,UAW*s,UAL*s,opt(k.c2)),uaR=Bodies.rectangle(x+sx*s,uaY,UAW*s,UAL*s,opt(k.c2));
 const laL=Bodies.rectangle(x-sx*s,laY,LAW*s,LAL*s,opt(k.c)),laR=Bodies.rectangle(x+sx*s,laY,LAW*s,LAL*s,opt(k.c));
 const ulL=Bodies.rectangle(x-hip*s,ulY,ULW*s,ULL*s,opt(k.c2)),ulR=Bodies.rectangle(x+hip*s,ulY,ULW*s,ULL*s,opt(k.c2));
 const llL=Bodies.rectangle(x-hip*s,llY,LLW*s,LLL*s,opt(k.c)),llR=Bodies.rectangle(x+hip*s,llY,LLW*s,LLL*s,opt(k.c));
 const J=(a,pa,b,pb,st)=>Constraint.create({bodyA:a,pointA:{x:pa[0]*s,y:pa[1]*s},bodyB:b,pointB:{x:pb[0]*s,y:pb[1]*s},length:0,stiffness:st||.9,damping:.1,render:{visible:false}});
 const cons=[J(torso,[-sx,sy],uaL,[0,shA]),J(torso,[sx,sy],uaR,[0,shA]),J(uaL,[0,elA],laL,[0,elB]),J(uaR,[0,elA],laR,[0,elB]),
  J(torso,[-hip,hipT],ulL,[0,hipU]),J(torso,[hip,hipT],ulR,[0,hipU]),J(ulL,[0,knU],llL,[0,knL]),J(ulR,[0,knU],llR,[0,knL])];
 // «голова» — не физическое тело, а точка на верхней части туловища: там лицо, повязка, корона, полоска здоровья
 const head={isProxy:true,position:{x,y:at(-TH*.2)},angle:0,velocity:{x:0,y:0},plugin:{part:'head',w:TW*.8*s,h:TH*.8*s,faceY:-TH*.2*s}};
 const parts={head,torso,uaL,uaR,laL,laR,ulL,ulR,llL,llR};
 // размеры тел частей — по ним подгоняются спрайты
 const DIM={torso:[TW,TH],uaL:[UAW,UAL],uaR:[UAW,UAL],laL:[LAW,LAL],laR:[LAW,LAL],ulL:[ULW,ULL],ulR:[ULW,ULL],llL:[LLW,LLL],llR:[LLW,LLL]};
 for(const p in DIM){parts[p].plugin={part:p,dmg:0,w:DIM[p][0]*s,h:DIM[p][1]*s};if(k.hazard)parts[p].plugin.spiky=true;}
 const fs=clamp(Math.min(TW,TH*.8)/24,.85,1.65); // лицо по размеру тела, но не раздуваем на толстых
 const hp=100*k.s*(o.hpMul||1);
 const joints={uaL:cons[0],uaR:cons[1],laL:cons[2],laR:cons[3],ulL:cons[4],ulR:cons[5],llL:cons[6],llR:cons[7]};
 // вес для силы, которая держит бойца на ногах. Считаем один раз: у растаявшей или замороженной части масса становится Infinity
 const liftMass=torso.mass+(uaL.mass+laL.mass+ulL.mass)*2;
 return addEnt('npc',[torso,uaL,uaR,laL,laR,ulL,ulR,llL,llR],cons,{kind,parts,s,fs,hp,hpMax:hp,liftMass,joints,group:g,attached:new Set(Object.keys(parts)),bleed:0,touch:-99,dead:false,stun:0,hpShow:0,blink:rnd(60,200),
  team:o.team===undefined?-1:o.team,weapon:o.weapon||null,ai:!!o.ai,isPlayer:!!o.player,boss:!!o.boss,aggro:o.aggro||0,
  dmgMul:o.dmgMul||1,speed:o.speed||2.8,ctrl:{move:0,jump:false,attack:false},facing:Math.random()<.5?1:-1,
  atkCd:rnd(20,60)|0,swing:0,jumpCd:0,aiT:0,stuckX:x,stuckT:0,grounded:-99,target:null,runT:0,runDir:1,charge:0,tackle:0,reload:0});
}
function updHead(ent){
 const t=ent.parts.torso,h=ent.parts.head;
 h.position=Vector.add(t.position,Vector.rotate({x:0,y:h.plugin.faceY},t.angle));h.angle=t.angle;h.velocity=t.velocity;
}
function healNpc(ent,frac){
 reattachAll(ent);
 ent.hp=Math.min(ent.hpMax,Math.max(ent.hp,0)+ent.hpMax*(frac||1));ent.dead=false;ent.stun=0;ent.hpShow=90;
 ent.cons.forEach(c=>c.stiffness=.9);ent.bodies.forEach(x=>x.plugin.dmg=Math.max(0,x.plugin.dmg-(frac||1)));
}

/* ============ предметы песочницы ============ */
const MAT={wood:{c:'#b5793e',d:.0018},rubber:{d:.0008},brick:{c:'#b5483a',d:.004}};
/* ============ разрушаемые предметы ============ */
// прочность; платформы/стены/лёд ломаются только в песочнице (на уровнях это часть трассы)
const ITEM_HP={box:45,plank:35,brick:70,ball:25,barrel:14,anvil:240,platform:140,wall:160,ice:60};
// обломки: [кол-во, ширина, высота, цвета]
const DEBRIS={box:[6,26,7,['#c98a46','#a8672d','#e0a862']],plank:[5,34,8,['#c48a4c','#a8672d']],brick:[4,16,12,['#c4502e','#a33d22','#d9714a']],
 ball:[5,12,9,['#f4f4f4','#24262d']],barrel:[5,22,12,['#d8342c','#a8241e','#3a3f4d']],anvil:[4,22,16,['#4a4f5c','#5d6372']],
 platform:[6,30,10,['#5d6680','#8d96a8']],wall:[6,16,26,['#5d6680','#8d96a8']],ice:[7,20,10,['#a6e4ff','#dff6ff']]};
// осколки платформы в цветах локации
const PLAT_CHIPS={garden:['#b5612a','#7cc02e','#8f4a1e'],greenhouse:['#e0793f','#8fce2e','#c8602c'],market:['#9b8b80','#e6d6bc','#7c6d62'],kitchen:['#d59245','#ecc98a','#b5742e'],moon:['#a0a0c4','#7f7fa6','#c0c0da'],factory:['#a4a8ae','#f2c81e','#7d8188']};
const chipColors=id=>id==='platform'&&PLAT_CHIPS[mapId]||DEBRIS[id][3];
let pendingBooms=[];
function spawnItem(id,x,y,extra){
 const ent=spawnItem0(id,x,y,extra);
 if(ent&&ITEM_HP[id]&&(ent.type==='obj'||screen==='sandbox')){ent.item=id;ent.hp=ent.hpMax=ITEM_HP[id];}
 return ent;
}
// v=458: стена на уровне ломается ударами и выстрелами (не быстро: GATE_HP), трещины растут; победа над охраной тоже открывает
const GATE_HP=320;
function gateHit(g,dmg,x,y){
 if(!g||g.removed||dmg<1)return;g.hpMax=g.hpMax||GATE_HP;g.hp=(g.hp??g.hpMax)-dmg;g.hitT=frame;
 sparks(x,y,6);for(let i=0;i<5;i++)particles.push({x,y,vx:rnd(-3,3),vy:rnd(-4,0),life:rnd(14,26),c:pick(['#8a93a6','#5d6680','#c0c7d4']),r:rnd(1.5,3.5)});
 if(g.hp<=0)openGate(g);
}
function openGate(g){
 if(!g||g.removed)return;const b=g.bodies[0],p={...b.position};FX.explosion(p.x,p.y,140);Snd.boom();
 for(let i=0;i<26;i++)particles.push({x:p.x+rnd(-14,14),y:p.y+rnd(-140,140),vx:rnd(-6,6),vy:rnd(-7,1),life:rnd(30,60),c:pick(['#8a93a6','#5d6680','#c0c7d4']),r:rnd(3,7)});
 removeEnt(g);toast(t('🔓 Проход открыт!'));
}
function hurtItem(ent,dmg,x,y){
 if(ent&&ent.type==='gate'){gateHit(ent,dmg,x,y);return;}
 if(!ent||ent.removed||!ent.item||ent.hp<=0||dmg<1)return;
 if(ent.item==='ice'||ent.unbreakable)return;  // v516: доска на верёвках в головоломке не ломается от шагов стоящих на ней бойцов  // v=396: лёд — как платформа, не ломается
 if(ent.item==='platform')return;  // земляную платформу не бьют удары и падения: её рушит только взрыв (crumblePlatform)
 ent.hp-=dmg;ent.hitT=frame;
 if(ent.chest)Chests.hit(ent);
 {const fr=ent.hp/ent.hpMax;ent.bodies[0].plugin.stage=fr<.34?2:fr<.67?1:0;}
 const c=chipColors(ent.item);for(let i=0;i<Math.min(6,2+dmg/8);i++)particles.push({x,y,vx:rnd(-3,3),vy:rnd(-4,0),life:rnd(14,26),c:pick(c),r:rnd(1.5,3.5)});
 if(ent.hp<=0)breakItem(ent);
}
// земляная платформа от взрыва рассыпается целиком: комья земли и пыль по всей длине, без обломков-тел
function crumblePlatform(ent){
 const b=ent.bodies[0],pos={...b.position},w=b.bounds.max.x-b.bounds.min.x,cols=chipColors('platform');
 removeEnt(ent);
 for(let i=0;i<34;i++){const px=pos.x+rnd(-w/2,w/2);particles.push({x:px,y:pos.y+rnd(-10,10),vx:rnd(-3,3)+(px-pos.x)*.02,vy:rnd(-6,-1),life:rnd(22,40),c:pick(cols),r:rnd(2,5)});}
 for(let k=-1;k<=1;k++)FX.puff(pos.x+k*w*.33,pos.y);
 Snd.hit(16);
}
// разлом: тело заменяется обломками (они живут несколько секунд); бочка взрывается чуть позже — цепные взрывы выглядят как цепочка
function breakItem(ent){
 if(!ent||ent.removed)return;
 const b=ent.bodies[0],pos={...b.position},v=b.velocity,[n,w,h]=DEBRIS[ent.item],cols=chipColors(ent.item);
 removeEnt(ent);
 if(ent.chest){Missions.record('crate');Chests.burst(pos.x,pos.y);}
 else if(ent.item==='box'){Missions.record('crate');const loot=dropCrateLoot(pos.x,pos.y,!S.tut.crateLootV2);crateTutorialDrop(ent,loot);}
 const many=bodyCount()<MAXBODIES-20;
 for(let i=0;i<(many?n:2);i++){
  const ang=b.angle+rnd(-.6,.6),off=Vector.rotate({x:rnd(-w*.6,w*.6),y:rnd(-h,h)},b.angle);
  const d=Bodies.rectangle(pos.x+off.x,pos.y+off.y,w*rnd(.6,1.1),h*rnd(.7,1.1),{density:ent.item==='anvil'?.01:.0015,friction:.8,chamfer:{radius:2},angle:ang,render:{fillStyle:pick(cols)},plugin:{debris:true,chunk:ent.chest?'item_chest_p'+(1+i%3):'item_'+ent.item+'_p'+(1+i%3)}});
  d.plugin.chunkW=Math.max(w,h)*1.4;
  Body.setVelocity(d,{x:v.x+rnd(-4,4),y:v.y-rnd(1,5)});Body.setAngularVelocity(d,rnd(-.3,.3));
  addEnt('debris',[d],null,{life:ri(180,260)});
 }
 FX.puff(pos.x,pos.y);sparks(pos.x,pos.y,8);Snd.hit(16);
 if(ent.item==='ball')Snd.pop();
 if(ent.item==='barrel'){for(let i=0;i<14;i++)particles.push({x:pos.x,y:pos.y,vx:rnd(-6,6),vy:rnd(-7,1),life:rnd(18,34),c:pick(['#ffcf3a','#ff6a2a','#d8342c']),r:rnd(3,6),fire:true});pendingBooms.push({x:pos.x,y:pos.y,t:6});}
}
// трещины на побитом предмете: чем меньше прочности, тем больше трещин; рисунок постоянный для тела
function drawCracks(ent){
 const b=ent.bodies[0],f=ent.hp/ent.hpMax,n=SPR['item_'+ent.item+'_d1']?0:f<.35?4:f<.6?3:f<.8?2:0;  // для предметов со спрайтами поломки трещины не рисуем
 if(!n){if(frame-ent.hitT<4){ctx.save();ctx.globalAlpha=.5;pathBody(b);ctx.fillStyle='#fff';ctx.fill();ctx.restore();}return;}
 const bw=b.bounds.max.x-b.bounds.min.x,bh=b.bounds.max.y-b.bounds.min.y,s=Math.min(bw,bh)*.5;
 ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
 if(b.circleRadius){ctx.beginPath();ctx.arc(0,0,b.circleRadius,0,7);ctx.clip();}
 ctx.strokeStyle='#1b0f06cc';ctx.lineWidth=2;ctx.lineJoin='round';
 for(let i=0;i<n;i++){const a=hash(b.id*7+i)*6.28;let x=Math.cos(a)*s*.15,y=Math.sin(a)*s*.15;ctx.beginPath();ctx.moveTo(x,y);
  for(let k=1;k<=3;k++){const aa=a+(hash(b.id+i*5+k)-.5)*1.2;x+=Math.cos(aa)*s*.32;y+=Math.sin(aa)*s*.32;ctx.lineTo(x,y);}ctx.stroke();}
 ctx.restore();
 if(frame-ent.hitT<4){ctx.save();ctx.globalAlpha=.5;pathBody(b);ctx.fillStyle='#fff';ctx.fill();ctx.restore();}
}
function spawnItem0(id,x,y,extra){
 if(NPC[id])return spawnRagdoll(id,x,y,extra);
 extra=extra||{};
 const st={isStatic:true,friction:.8};
 switch(id){
  case 'box':return addEnt('obj',[Bodies.rectangle(x,y,50,50,{density:MAT.wood.d,friction:.7,chamfer:{radius:3},render:{fillStyle:MAT.wood.c},plugin:{deco:'box'}})]);
  case 'ball':return addEnt('obj',[Bodies.circle(x,y,20,{density:MAT.rubber.d,restitution:.82,friction:.6,render:{fillStyle:'#f4f4f4'},plugin:{deco:'ball'}})]);
  case 'brick':return addEnt('obj',[Bodies.rectangle(x,y,44,22,{density:MAT.brick.d,friction:.9,render:{fillStyle:MAT.brick.c},plugin:{deco:'brick'}})]);
  case 'plank':return addEnt('obj',[Bodies.rectangle(x,y,extra.w||170,14,{density:extra.d||MAT.wood.d,friction:.9,chamfer:{radius:3},render:{fillStyle:'#c48a4c'},plugin:{deco:'plank',w:extra.w||170}})]);
  case 'barrel':return addEnt('obj',[Bodies.rectangle(x,y,40,56,{density:.003,friction:.6,chamfer:{radius:10},render:{fillStyle:'#d8342c'},plugin:{deco:'barrel'}})]);
  case 'anvil':return addEnt('obj',[Bodies.trapezoid(x,y,70,34,-.4,{density:.03,friction:.6,render:{fillStyle:'#4a4f5c'},plugin:{deco:'anvil',crush:extra.crush||0}})]);
  case 'car':{
   const g=Body.nextGroup(true);
   const bd=Bodies.rectangle(x,y,120,30,{collisionFilter:{group:g},density:.004,chamfer:{radius:8},render:{fillStyle:'#e03a3a'},plugin:{deco:'car'}});
   const w1=Bodies.circle(x-40,y+18,14,{collisionFilter:{group:g},density:.003,friction:1,render:{fillStyle:'#1b1c20'},plugin:{deco:'wheel'}});
   const w2=Bodies.circle(x+40,y+18,14,{collisionFilter:{group:g},density:.003,friction:1,render:{fillStyle:'#1b1c20'},plugin:{deco:'wheel'}});
   const c1=Constraint.create({bodyA:bd,pointA:{x:-40,y:16},bodyB:w1,length:0,stiffness:.5,damping:.2,render:{visible:false}});
   const c2=Constraint.create({bodyA:bd,pointA:{x:40,y:16},bodyB:w2,length:0,stiffness:.5,damping:.2,render:{visible:false}});
   return addEnt('car',[bd,w1,w2],[c1,c2],{motor:true});}
  case 'bomb':return addEnt('bomb',[Bodies.circle(x,y,16,{density:.003,render:{fillStyle:'#24262d'},plugin:{deco:'bomb'}})],null,{fuse:extra.fuse||120,power:.06,radius:220,impact:!!extra.impact});
  case 'dynamite':return addEnt('bomb',[Bodies.rectangle(x,y,16,44,{density:.002,chamfer:{radius:3},render:{fillStyle:'#d8342c'},plugin:{deco:'dyn'}})],null,{fuse:150,power:.13,radius:330});
  case 'mine':return addEnt('mine',[Bodies.rectangle(x,y,58,14,{density:.004,chamfer:{radius:4},render:{fillStyle:'#55594f'},plugin:{deco:'mine'}})],null,{armed:60,power:.08,radius:240});
  // смертельные колья на земле: частокол из рисунков кольев ям (stake1/stake2), убивает при касании, как колья в яме
  case 'stakes':{const w=extra.w||120,h=56;return addEnt('static',[Bodies.rectangle(x,FLOOR-h/2+4,w,h,Object.assign({},st,{render:{fillStyle:'#bd8549'},plugin:{deco:'stakerow',stakes:true,w,h}}))]);}
  // v=452: тело шипов — от основания до остриёв (30 px, как рисунок), раньше 18 px и острия торчали выше тела — через них пробегали;
  // низ тела там же, где был (y+9). Урон выше: 9 вместо 6
  case 'spikes':return addEnt('static',[Bodies.rectangle(x,y-6,extra.w||120,30,Object.assign({},st,{render:{fillStyle:'#9aa3b5'},plugin:{deco:'spikes',hazard:9,w:extra.w||120,h:30}}))]);
  case 'press':return addEnt('saw',[Bodies.rectangle(x,y,120,56,Object.assign({},st,{chamfer:{radius:8},render:{fillStyle:'#8d96a8'},plugin:{deco:'press',hazard:14}}))],null,{press:true,mv:Object.assign({bx:x,by:y,ph:rnd(0,6)},extra.mv||{dy:105,sp:.03,slam:1})});
  case 'saw':return addEnt('saw',[Bodies.circle(x,y,46,Object.assign({},st,{render:{fillStyle:'#c9ced8'},plugin:{deco:'saw',hazard:15}}))],null,{mv:extra.mv?Object.assign({bx:x,by:y,ph:rnd(0,6)},extra.mv):null});
  case 'platform':{const b=Bodies.rectangle(x,y,extra.w||200,18,Object.assign({},st,{chamfer:{radius:4},render:{fillStyle:'#5d6680'},plugin:{deco:'platform',w:extra.w||200,h:18}}));if(extra.a)Body.setAngle(b,extra.a);return addEnt('static',[b]);}
  case 'wall':return addEnt('static',[Bodies.rectangle(x,y,extra.w||22,extra.h||200,Object.assign({},st,{chamfer:{radius:4},render:{fillStyle:'#5d6680'},plugin:{deco:'wall',w:extra.w||22,h:extra.h||200}}))]);
  case 'ice':return addEnt('static',[Bodies.rectangle(x,y,200,18,Object.assign({},st,{friction:0,frictionStatic:0,chamfer:{radius:4},render:{fillStyle:'#a6e4ff'},plugin:{deco:'ice',w:200,h:18}}))]);
  case 'tramp':{const b=Bodies.rectangle(x,y-24,140,16,Object.assign({},st,{chamfer:{radius:6},render:{fillStyle:'#3a8dff'},plugin:{deco:'tramp',bounce:true,w:140,h:16,kick:extra.kick||0}}));if(extra.a)Body.setAngle(b,extra.a);return addEnt('static',[b]);}
 }
}

/* ============ верёвки: висящие грузы и пленники, режутся пальцем или оружием ============ */
// Груз держит жёсткая связь Matter (надёжно), а сама верёвка — цепочка точек (Verlet):
// она провисает, качается вместе с грузом и рисуется плавной кривой. При разрезе рвётся на два куска:
// верхний остаётся болтаться на крючке, нижний — на грузе; концы отскакивают, летят волокна.
const ROPE_N=16;
let ropeBits=[];
function ropePt(o){return o.body?Vector.add(o.body.position,Vector.rotate(o.pt,o.body.angle)):{x:o.x,y:o.y};}
// a — точка крепления: {x,y} в мире или {body,pt}; b — {body,pt}
function addRope(a,b){
 const c=Constraint.create({bodyA:a.body||null,pointA:a.body?(a.pt||{x:0,y:0}):{x:a.x,y:a.y},bodyB:b.body,pointB:b.pt||{x:0,y:0},stiffness:1,damping:.02,render:{visible:false}});
 const holds=b.body.plugin&&b.body.plugin.ent;
 const r=addEnt('rope',[],[c],{holds});
 const A=a.body?{body:a.body,pt:{...(a.pt||{x:0,y:0})}}:{x:a.x,y:a.y},B={body:b.body,pt:{...(b.pt||{x:0,y:0})}};  // v521: копии — Matter сам поворачивает pointB, иначе конец верёвки поворачивался дважды
 const pa=ropePt(A),pb=ropePt(B),L=Vector.magnitude(Vector.sub(pb,pa));
 r.A=A;r.B=B;r.seg=L/(ROPE_N-1);   // под грузом верёвка натянута; свободно болтаются только обрывки
 r.pts=[];for(let i=0;i<ROPE_N;i++){const k=i/(ROPE_N-1);const x=pa.x+(pb.x-pa.x)*k,y=pa.y+(pb.y-pa.y)*k+Math.sin(k*Math.PI)*4;r.pts.push({x,y,px:x,py:y});}
 if(holds){holds.ropes=(holds.ropes||0)+1;holds.hung=true;}
 return r;
}
function ropeEnds(r){return [ropePt(r.A),ropePt(r.B)];}
// шаг цепочки: инерция + тяжесть, затем держим длину звеньев; закреплённые концы — на крючке/грузе
function verlet(pts,seg,pinA,pinB,gm){
 const g=.32*(gm===undefined?1:gm)*(zeroG?0:mapGravity());
 for(let i=0;i<pts.length;i++){const q=pts[i];if((i===0&&pinA)||(i===pts.length-1&&pinB))continue;
  const vx=(q.x-q.px)*.985,vy=(q.y-q.py)*.985;q.px=q.x;q.py=q.y;q.x+=vx;q.y+=vy+g;
  if(q.y>FLOOR-2&&!inPit(q.x)){q.y=FLOOR-2;q.px=q.x-vx*.5;}}
 for(let it=0;it<(pinA&&pinB?16:10);it++){
  if(pinA){pts[0].x=pinA.x;pts[0].y=pinA.y;}
  if(pinB){const l=pts[pts.length-1];l.x=pinB.x;l.y=pinB.y;}
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.001,f=(d-seg)/d*.5;
   const la=(i-1===0&&pinA),lb=(i===pts.length-1&&pinB);
   if(la&&!lb){b.x-=dx*f*2;b.y-=dy*f*2;}else if(lb&&!la){a.x+=dx*f*2;a.y+=dy*f*2;}else if(!la&&!lb){a.x+=dx*f;a.y+=dy*f;b.x-=dx*f;b.y-=dy*f;}}
 }
}
function updRope(r){verlet(r.pts,r.seg,ropePt(r.A),ropePt(r.B),.08);}   // натянута грузом: почти прямая, но дрожит при рывках
function updRopeBits(){
 for(const k of ropeBits){
  if(k.pin&&k.pin.body&&(!k.pin.body.plugin||!k.pin.body.plugin.ent||k.pin.body.plugin.ent.removed))k.pin=null;
  const P=k.pin?ropePt(k.pin):null;
  k.top?verlet(k.pts,k.seg,P,null):verlet(k.pts,k.seg,null,P);
  k.life--;
 }
 ropeBits=ropeBits.filter(k=>k.life>0);
}
function cutRope(r,at){
 if(r.removed)return;
 {const hb=r.cons[0]&&r.cons[0].bodyB,he=hb&&hb.plugin&&hb.plugin.ent;if(he&&he.frozenPlank){he.frozenPlank=false;Body.setStatic(hb,false);for(const f of entities)if(f.stayPut)f.stayPut=false;}}  // v517: доска «оживает», когда режут её верёвку
 const pts=r.pts;
 // где резали: ближайшее к точке разреза звено, иначе — середина
 let i=Math.floor(pts.length/2);
 if(at){let bd=1e9;for(let j=1;j<pts.length;j++){const d=segDist(at,pts[j-1],pts[j]);if(d<bd){bd=d;i=j;}}}
 i=clamp(i,1,pts.length-1);
 const cut={x:(pts[i-1].x+pts[i].x)/2,y:(pts[i-1].y+pts[i].y)/2};
 removeEnt(r);
 const h=r.holds;
 if(h&&!h.removed){h.ropes--;if(h.ropes<=0){h.hung=false;if(h.type==='bomb')h.lit=true;}}
 // два куска: верхний висит на крючке (остаётся), нижний — на грузе (через 3 с исчезает)
 const up=pts.slice(0,i).map(q=>({...q})),dn=pts.slice(i).map(q=>({...q}));
 // отдача: концы у разреза отскакивают в стороны от места разреза
 const dir=Vector.normalise(Vector.sub(pts[i].x===pts[i-1].x&&pts[i].y===pts[i-1].y?{x:pts[i].x+1,y:pts[i].y}:pts[i],pts[i-1]));
 for(let k=0;k<Math.min(5,up.length);k++){const q=up[up.length-1-k],f=(5-k)*1.1;q.px=q.x+dir.x*f+rnd(-1,1);q.py=q.y+dir.y*f+2;}
 for(let k=0;k<Math.min(5,dn.length);k++){const q=dn[k],f=(5-k)*1.1;q.px=q.x-dir.x*f+rnd(-1,1);q.py=q.y-dir.y*f+2;}
 if(up.length>1)ropeBits.push({pts:up,seg:r.seg,pin:r.A,top:true,life:1e9});
 // кусок, что остался на грузе или персонаже, сразу тает (v=396: раньше висел 3 с)
 if(dn.length>1)ropeBits.push({pts:dn,seg:r.seg,pin:r.B,top:false,life:16});
 // эффект: вспышка, волокна верёвки, искры, щелчок
 FX.spike(cut.x,cut.y,54,'#fff3c4');FX.ring(cut.x,cut.y,22);
 for(let k=0;k<14;k++){const a=rnd(0,Math.PI*2),v=rnd(1.5,4.5);particles.push({x:cut.x,y:cut.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.5,life:rnd(26,46),c:k%3?'#c9995f':'#8a5a32',r:1.4,rope:rnd(2,5),ang:a});}
 sparks(cut.x,cut.y,6);Snd.rope();
 floats.push({x:cut.x,y:cut.y-16,t:'✂',life:36,c:'#fff',big:1.2,pop:1});
 if(Mode.id==='level')hitStop=Math.max(hitStop,2);
 Mode.onCut&&Mode.onCut(r);
}
function segCross(p1,p2,p3,p4){
 const d=(p2.x-p1.x)*(p4.y-p3.y)-(p2.y-p1.y)*(p4.x-p3.x);if(!d)return false;
 const u=((p3.x-p1.x)*(p4.y-p3.y)-(p3.y-p1.y)*(p4.x-p3.x))/d,v=((p3.x-p1.x)*(p2.y-p1.y)-(p3.y-p1.y)*(p2.x-p1.x))/d;
 return u>=0&&u<=1&&v>=0&&v<=1;
}
// разрезать все верёвки, которые пересекает отрезок (свайп) или рядом с точкой (тап) — по самой кривой
function cutRopesAlong(p1,p2,tol){
 let n=0;
 for(const r of entities.filter(e=>e.type==='rope')){
  const P=r.pts;let hit=null;
  for(let j=1;j<P.length&&!hit;j++){
   if(segCross(p1,p2,P[j-1],P[j]))hit=p2;
   else if(segDist(p2,P[j-1],P[j])<(tol||14))hit=p2;
  }
  if(hit){cutRope(r,hit);n++;}
 }
 return n;
}

/* ============ урон и эффекты ============ */
function juice(x,y,color,n,sp){for(let i=0;i<n;i++)particles.push({x,y,vx:rnd(-1,1)*(sp||4),vy:rnd(-1.5,.5)*(sp||4),life:rnd(30,70),c:color,r:rnd(2,4.5)});}
function sawGroundSparks(b){
 const R=52,x=b.position.x,y=b.position.y;let gy=null;
 if(y+R>FLOOR&&y<FLOOR+R&&!inPit(x))gy=FLOOR;
 else for(const e of entities){const q=e.bodies[0];if(e.type!=='static'||!q||q.plugin.deco!=='platform')continue;const t=q.bounds.min.y;if(x>q.bounds.min.x&&x<q.bounds.max.x&&y+R>t&&y<t+R){gy=t;break;}}
 if(gy===null)return;
 const dy=gy-y,half=Math.sqrt(Math.max(0,R*R-dy*dy)),cx=x-half*.9;
 if(particles.length>520||frame%2)return;  // много пил — искр не больше разумного
 for(let i=0;i<2;i++)particles.push(sparkP(cx+rnd(-4,4),gy-2,-rnd(4,9),-rnd(2,6),rnd(14,24),rnd(20,34)));
 if(frame%8===0)particles.push(sparkP(cx,gy-4,0,0,7,rnd(16,22),4));
 if(frame%10===0)particles.push({x:cx,y:gy-3,vx:-rnd(.5,1.5),vy:-rnd(.3,.8),life:rnd(16,24),c:'#d9d2c4',r:rnd(2,3.5),fire:true,puff:true});
}
// искры (v=396): рисунки ChatGPT — вытянутые росчерки и звёздочка вместо кружков
SPRITES.fx_spark_1='fx/fx_spark_1.png';SPRITES.fx_spark_2='fx/fx_spark_2.png';SPRITES.fx_spark_3='fx/fx_spark_3.png';SPRITES.fx_spark_4='fx/fx_spark_4.png';['fx_spark_1','fx_spark_2','fx_spark_3','fx_spark_4'].forEach(k=>AVAILABLE.add(k));
const sparkP=(x,y,vx,vy,life,len,k)=>({x,y,vx,vy,life,life0:life,len,spark:k||(Math.random()<.5?1:Math.random()<.5?2:3),c:'#ffe27a',r:2,fire:true});
function sparks(x,y,n){for(let i=0;i<n;i++)particles.push(sparkP(x,y,rnd(-5,5),rnd(-5,2),rnd(10,18),rnd(12,22)));if(n>2)particles.push(sparkP(x,y,0,0,8,rnd(14,20),4));}
function dust(x,y,n,dir){for(let i=0;i<n;i++)particles.push({x:x+rnd(-6,6),y,vx:-dir*rnd(.5,2),vy:-rnd(.3,1.2),life:rnd(14,26),c:'#e8dcc8',r:rnd(2,4),fire:true,puff:true});}
// v=432: подобранный щит блокирует весь урон, пока действует (раньше только половину)
function shieldBlock(ent){
 if(!(ent&&ent.lootShieldUntil>frame))return false;
 if(frame-(ent.shieldFxAt??-99)>12){ent.shieldFxAt=frame;const q=ent.parts.torso.position;FX.ring(q.x,q.y,70);floats.push({x:q.x,y:q.y-55,t:t('Блок!'),life:32,c:'#9fd8ff',pop:1});}
 return true;
}
function damageNpc(ent,dmg,x,y,src){
 if(!ent||ent.removed||dmg<=0)return;
 if(ent.invuln>0)return;
 if(shieldBlock(ent))return;
 // A local tutorial assist never changes a hero's saved upgrade stats.
 if(src&&src.isPlayer&&Mode.id==='level'&&Tut.on)dmg*=1.5;
 if(ent.guard&&Run.kind==='arcade')dmg*=.6;  // v501: связанный союзник в аркаде получает меньше урона — враги не убивают его за секунды
 const k=NPC[ent.kind];
 const eff=Math.min(dmg,Math.max(0,ent.hp));
 ent.hp=Math.max(0,ent.hp-dmg);ent.hpShow=90;
 if(Mode.id==='sandbox'){S.damage+=eff;SbM.add('dmg',eff);}
 if(eff>=2)floats.push({x:x+rnd(-6,6),y:y-10,t:Math.round(eff),life:45,c:ent.isPlayer?'#ff6b6b':'#fff'});
 if(dmg>8){if(!(ent.isPlayer&&ent.tackle))ent.stun=Math.max(ent.stun,Math.min(40,dmg));juice(x,y,k.juice,Math.min(18,dmg|0),4);if(Math.random()<.5)Snd.squish();}
 if(ent.isPlayer&&dmg>=8&&ent.hp>0)Snd.voice('v_pain',.55,.5,1400);
 if(ent.boss&&!ent.finishSaid&&ent.hp>0&&ent.hp<ent.hpMax*.25){ent.finishSaid=true;Snd.voice('v_finish',.8,1,0);}
 if(ent.hp<=0&&!ent.dead)killNpc(ent,src);
 // после сильного удара герой на мгновение неуязвим — чтобы не забивали в углу
 else if(ent.isPlayer&&dmg>=10&&Mode.id==='level')ent.invuln=Math.max(ent.invuln||0,28);
 if(!ent.dead)playerLimbDamage(ent,eff,x,y);
}
function killNpc(ent,src){if(ent.dead)return;ent.dead=true;ent.deadAt=frame;ent.spikeDeath=frame-(ent.spikeTouch??-999)<20;ent.hp=0;ent.charge=0;const t=ent.parts.torso.position;juice(t.x,t.y,'#ffffffaa',10,3);ent.cons.forEach(c=>c.stiffness=.6);
 // эффектное поражение: всплеск сока, «K.O.», а на последнем враге уровня — замедление
 if(src&&(Mode.id==='level'||Mode.id==='sandbox')){juice(t.x,t.y,NPC[ent.kind].juice,26,6);if(SPR.tfx_txt_ko)FX.word(t.x,t.y-ent.parts.torso.plugin.h*.9,'ko',96);else FX.ko(t.x,t.y-ent.parts.torso.plugin.h*.8);FX.burst(t.x,t.y,90,'#ffffff');FX.splat(t.x,t.y,rnd(0,6),NPC[ent.kind].juice,110);FX.ring(t.x,t.y,60);if(src.isPlayer){hitStop=Math.max(hitStop,1);shake=Math.min(12,shake+3);}}
 if(onScreen(t.x,0)){if(ent.isPlayer)setTimeout(()=>Snd.voice('v_laugh',.6,.7,0),500);else if(src&&src.isPlayer)Snd.voice(Math.random()<.5?'v_kill':'v_death',.6,.6);else Snd.voice('v_death',.5,.45);}
 Mode.onDeath&&Mode.onDeath(ent,src);
 if(Mode.id==='level'&&ent.team===1&&!entities.some(e=>e.type==='npc'&&e.team===1&&!e.dead))slowmoT=12;}
// убитого взрывом разрывает полностью: тела исчезают, части разлетаются как осколки и тают, остаётся только сок
function blowUp(ent,x,y){
 const t=ent.parts.torso.position,c=NPC[ent.kind].juice,fly=(im,px,py,w,h,ang,k)=>{const d=Vector.normalise(Vector.sub({x:px,y:py},{x:x+rnd(-8,8),y:y+rnd(4,16)})),v=rnd(6,12)*k;
  particles.push({x:px,y:py,vx:d.x*v,vy:d.y*v-rnd(2,5),life:rnd(42,64),c,r:0,gib:{im,w,h},ang,vr:rnd(-.35,.35)});};
 for(const n in ent.parts){const b=ent.parts[n],pk=PART_KEY[n];if(b.isProxy||b.plugin.gone||!pk)continue;const im=SPR[`char_${ent.kind}_${pk}`],f=PART_FIT[pk];if(!im)continue;
  const h=b.plugin.h*f.k,w=f.kw?b.plugin.w*f.kw:h*im.width/im.height;fly(im,b.position.x,b.position.y,w,h,b.angle,n==='torso'?.7:1);}
 const top=SPR[`char_${ent.kind}_head`],P=BODY[ent.kind]||BODY.ogurets;
 if(top){const w=ent.parts.torso.plugin.w*P.top[0];fly(top,t.x,t.y-ent.parts.torso.plugin.h*.45,w,w*top.height/top.width,ent.parts.torso.angle,1.1);}
 juice(t.x,t.y,c,44,9);FX.splat(t.x,t.y,rnd(0,6),c,130);FX.splat(t.x+rnd(-24,24),t.y+rnd(-20,20),rnd(0,6),c,90);FX.burst(t.x,t.y,110,'#ffffff');
 Snd.squish();removeEnt(ent);
}
// упавший в чан с зельем распадается на части, они медленно тонут и растворяются
let sinkers=[];
function meltInVat(ent){
 const t=ent.parts.torso.position,pit=PITS.find(q=>t.x>q[0]-30&&t.x<q[1]+30)||[t.x-60,t.x+60],m=20;
 const add=(im,px,py,w,h,ang)=>sinkers.push({im,x:clamp(px,pit[0]+m,pit[1]-m),y:py,w,h,ang,vx:(px-t.x)*.035+rnd(-.5,.5),vy:rnd(-1.5,.5),vr:rnd(-.025,.025),age:0,life:ri(130,175),a:pit[0],b:pit[1]});
 for(const n in ent.parts){const b=ent.parts[n],pk=PART_KEY[n];if(b.isProxy||b.plugin.gone||!pk)continue;const im=SPR[`char_${ent.kind}_${pk}`],f=PART_FIT[pk];if(!im)continue;const h=b.plugin.h*f.k,w=f.kw?b.plugin.w*f.kw:h*im.width/im.height;add(im,b.position.x,b.position.y,w,h,b.angle);}
 const top=SPR[`char_${ent.kind}_head`],P=BODY[ent.kind]||BODY.ogurets;
 if(top){const w=ent.parts.torso.plugin.w*P.top[0];add(top,t.x,t.y-ent.parts.torso.plugin.h*.45,w,w*top.height/top.width,ent.parts.torso.angle);}
 for(let i=0;i<26;i++)particles.push({x:t.x+rnd(-30,30),y:FLOOR+10,vx:rnd(-3.5,3.5),vy:rnd(-8,-2),life:rnd(18,36),c:pick(['#c8ff5a','#8fe02c','#eaffb0']),r:rnd(2,6),fire:true});
 FX.ring(t.x,FLOOR+14,70);Snd.squish();removeEnt(ent);
}
// своя граната/взрыв бьёт игрока слабее (v=396: граната задевала бросающего)
const OWN_BLAST_MUL=.12,ALLY_BLAST_MUL=.15;  // v=396: себе и своим ещё слабее
// v=486: на уровнях «защити пленника» бомбы почти не ранят союзников героя (сам пленник и другие бойцы его команды) и не отрывают им части
const blastAllyMul=e=>screen==='play'&&Run.guard&&!Run.guard.removed&&!e.isPlayer&&e.team===0?.12:1;
function explode(x,y,power,radius,src,safe,owner){
 Snd.boom(power>.09);if(onScreen(x,0))shake=Math.min(12,shake+power*90);
 for(let i=0;i<40;i++)particles.push({x,y,vx:rnd(-9,9),vy:rnd(-9,6),life:rnd(18,40),c:Math.random()<.5?'#ffcf3a':'#ff6a2a',r:rnd(3,8),fire:true});
 flashes.push({x,y,r:radius*.6,life:12});FX.explosion(x,y,Math.min(260,radius*1.1));
 // мультяшный «пых», ударная волна, клубы дыма, надпись и подпалина на земле
 FX.burst(x,y,Math.min(240,radius*1.05),'#ffd27a');FX.shock(x,y,radius*.9);
 for(let i=0;i<5;i++)FX.cloud(x+rnd(-radius*.3,radius*.3),y+rnd(-radius*.25,radius*.1),rnd(50,90),rnd(-.6,.6),-rnd(.3,.9),'#c9c3bb');
 if(onScreen(x,0))FX.word(x,y-radius*.35,pick(['boom','bang','boom']),Math.min(150,70+radius*.3));
 if(y>FLOOR-90&&!inPit(x))addDecal({scorch:true,x,y:FLOOR,r:radius*.45});
 const hitEnts=new Set();
 for(const b of Composite.allBodies(world)){
  if(b.isStatic||b===src)continue;
  const d=Vector.sub(b.position,{x,y}),dist=Math.max(20,Vector.magnitude(d));
  if(dist>radius)continue;
  Body.applyForce(b,b.position,Vector.mult(Vector.normalise(d),power*b.mass*(1-dist/radius)*1.5));
  const ent=b.plugin&&b.plugin.ent;
  if(ent&&ent.type==='npc'&&ent.attached.has(b.plugin.part))hitEnts.add(ent);
  if(ent&&ent.type==='bomb'&&!ent.removed&&ent.fuse>10&&!ent.hung)ent.fuse=8;
 }
 for(const it of entities.filter(e=>e.item&&!e.removed)){const b=it.bodies[0];if(b===src)continue;
  // платформа длинная: меряем до ближайшей её точки, а не до центра
  if(it.item==='platform'){const bb=b.bounds,dx=Math.max(bb.min.x-x,0,x-bb.max.x),dy=Math.max(bb.min.y-y,0,y-bb.max.y);if(Math.hypot(dx,dy)<radius*.6)crumblePlatform(it);continue;}
  const dist=Math.max(20,Vector.magnitude(Vector.sub(b.position,{x,y})));if(dist<radius)hurtItem(it,(1-dist/radius)*170*power/.06,b.position.x,b.position.y);}
 // взрыв рвёт верёвки рядом
 for(const r of entities.filter(e=>e.type==='rope')){if(r.pts.some(q=>Math.hypot(q.x-x,q.y-y)<radius*.45))cutRope(r,{x,y});}
 if(safe)hitEnts.delete(safe);
 SbM.blast=true;
 try{
 for(const ent of hitEnts){const t=ent.parts.torso.position,dist=Math.max(20,Vector.magnitude(Vector.sub(t,{x,y})));ent.blastAt=frame;damageNpc(ent,Math.max(5,(1-dist/radius)*90*power/.06)*(Mode.dmgTo?Mode.dmgTo(ent):1)*blastAllyMul(ent)*(ent===owner&&ent.isPlayer?OWN_BLAST_MUL:owner&&ent!==owner&&ent.team===owner.team&&owner.team>=0?ALLY_BLAST_MUL:1),t.x,t.y,null);ent.stun=Math.max(ent.stun,50);
  if(ent.dead&&canCut(ent)){blowUp(ent,x,y);continue;}
  if(canCut(ent)&&blastAllyMul(ent)===1)for(const p of Object.keys(ent.joints)){const b=ent.parts[p],d2=Vector.magnitude(Vector.sub(b.position,{x,y}));if(d2<radius&&Math.random()<clamp((1-d2/radius)*power/.06*.45,0,.75))sever(ent,p);}}
 }finally{SbM.blast=false;}
}
// платформа держит бойца только сверху: снизу он пролетает насквозь и приземляется, когда ноги или корпус оказались выше её края
// впереди по ходу бега есть платформа, до которой достаёт обычный прыжок: тогда прыгаем вверх, а не тараном
function platformAhead(ent){
 const t=ent.parts.torso.position,dir=ent.runDir,feet=Math.max(ent.parts.llL.bounds.max.y,ent.parts.llR.bounds.max.y);
 for(const e of entities){
  if(e.type!=='static')continue;const b=e.bodies[0];if(!b.plugin||b.plugin.deco!=='platform')continue;
  const up=feet-b.bounds.min.y;if(up<25||up>175)continue;
  const near=dir>0?b.bounds.min.x-t.x:t.x-b.bounds.max.x,far=dir>0?b.bounds.max.x-t.x:t.x-b.bounds.min.x;
  if(far>0&&near<280)return true;
 }
 return false;
}
const SB_CORPSE_T=30*60,SPIKE_CORPSE_T=40; // кадров: сколько лежит павший боец; погибший на кольях
// Запрыгнул снизу на одностороннюю платформу, но вышел над краем только корпусом: платформа держит туловище,
// а ноги остаются внутри неё (они проходят сквозь, пока ниже края). Боец «сидел в земле» и не мог выбраться,
// на подъёме не засчитывался финиш. Такого бойца приподнимаем, чтобы ступни встали на край (не больше MANTLE_MAX).
const MANTLE_MAX=48;
function mantleOnPlatforms(){
 for(const e of entities){
  if(e.type!=='npc'||e.dead||e.removed||e.hung||e.caged||!e.plat||frame-(e.platF??-99)>2)continue;
  const pl=e.plat,t=e.parts.torso,top=pl.bounds.min.y;
  if(t.position.x<pl.bounds.min.x||t.position.x>pl.bounds.max.x||t.bounds.max.y>top+6)continue;
  let low=-Infinity;for(const k of ['llL','llR'])if(e.attached.has(k))low=Math.max(low,e.parts[k].bounds.max.y);
  if(low===-Infinity)continue;
  const dy=top-1-low;if(dy>-10||dy<-MANTLE_MAX)continue;
  for(const b of e.bodies)if(e.attached.has(b.plugin.part)){Body.translate(b,{x:0,y:dy});if(b.velocity.y>0)Body.setVelocity(b,{x:b.velocity.x,y:0});}
  e.grounded=frame;
 }
}
function platformPass(p){
 const a=p.bodyA,b=p.bodyB,tr=a.plugin&&a.plugin.bounce?a:b.plugin&&b.plugin.bounce?b:null;
 // подброшенный батутом боец не цепляется за него по пути вверх, даже если вошёл сбоку
 if(tr){const e=(tr===a?b:a).plugin&&(tr===a?b:a).plugin.ent,go=!!e&&e.type==='npc'&&frame-(e.bounced||-99)<25;p.isSensor=go;return go;}
 const pl=a.plugin&&a.plugin.deco==='platform'?a:b.plugin&&b.plugin.deco==='platform'?b:null;if(!pl||pl.angle)return false;
 const x=pl===a?b:a,ent=x.plugin&&x.plugin.ent;if(!ent||ent.type!=='npc'||x.plugin.cut)return false;
 // опора считается по верхней ноге: вторая может болтаться ниже края
 let low=Infinity,vy=0;
 for(const k of ['llL','llR'])if(ent.attached.has(k)&&ent.parts[k].bounds.max.y<low){low=ent.parts[k].bounds.max.y;vy=ent.parts[k].velocity.y;}
 if(low===Infinity){low=ent.parts.torso.bounds.max.y;vy=ent.parts.torso.velocity.y;}
 const top=pl.bounds.min.y,t=ent.parts.torso;
 // приземлился — платформа держит, пока боец на ней: при приземлении ноги подгибаются и корпус приседает до самого края, на бегу ноги уходят ниже края
 if(ent.plat===pl&&frame-ent.platF<12&&t.position.y<top+4){ent.platF=frame;p.isSensor=false;return false;}
 const feetOn=low-Math.max(0,vy)*1.2<=top+14,torsoOn=t.velocity.y>-.5&&t.bounds.max.y<=top-6,pass=!(feetOn||torsoOn);
 if(!pass&&t.velocity.y>-.5){ent.plat=pl;ent.platF=frame;}
 p.isSensor=pass;return pass;
}
Events.on(engine,'collisionStart',e=>{
 for(const p of e.pairs){
  if(platformPass(p))continue;
  const a=p.bodyA,b=p.bodyB;
  const rel=Vector.magnitude(Vector.sub(a.velocity,b.velocity));
  const sp=p.collision.supports&&p.collision.supports[0]||a.position;
  if(rel>3)Snd.hit(rel);
  if(rel>8)for(const [x,o] of [[a,b],[b,a]]){const it=x.plugin&&x.plugin.ent;if(it&&it.item&&!(o.plugin&&o.plugin.debris)&&!(o.plugin&&o.plugin.ent===it))hurtItem(it,(rel-8)*3.2*clamp(o.isStatic?1.2:o.mass/x.mass,.3,3),sp.x,sp.y);}
  for(const [x,o] of [[a,b],[b,a]]){
   const ent=x.plugin&&x.plugin.ent;
   if(ent?.type==='npc'&&!ent.attached.has(x.plugin.part))continue;
   if(o.plugin&&o.plugin.bounce&&!x.isStatic){
    // персонажа подбрасываем целиком, а не одну ногу
    const vy=-Math.max(ent&&ent.isPlayer?16:14,Math.abs(x.velocity.y)*1.15);
    if(ent&&ent.type==='npc'){if(frame-(ent.bounced||-99)>10){ent.bounced=frame;ent.grounded=-99;const vx=o.plugin.kick||ent.parts.torso.velocity.x;for(const b of ent.bodies)Body.setVelocity(b,{x:vx,y:vy});}}
    else Body.setVelocity(x,{x:x.velocity.x,y:vy});
    o.plugin.squash=frame+8;Snd.bounce();}
   if(ent&&ent.type==='rocket'&&!ent.removed&&!(o.plugin&&o.plugin.ent===ent.owner)){const pos={...x.position};removeEnt(ent);explode(pos.x,pos.y,ent.power,ent.radius,x,ent.owner,ent.owner);continue;}
   // насадился на колья в яме
   // v500: колья снимают треть здоровья за касание и подбрасывают из ямы; убивают, только если здоровья меньше трети
   if(ent&&ent.type==='npc'&&o.plugin&&o.plugin.stakes&&!ent.dead&&frame-(ent.stakeHitAt??-99)<40)continue;
   if(ent&&ent.type==='npc'&&o.plugin&&o.plugin.stakes&&!ent.dead&&ent.hp>ent.hpMax/3+.5){ent.stakeHitAt=frame;ent.spikeTouch=frame;
    juice(sp.x,sp.y,NPC[ent.kind].juice,12,3);Snd.squish();damageNpc(ent,ent.hpMax/3,sp.x,sp.y,null);if(ent.isPlayer)shake=Math.min(12,shake+4);
    const tx=ent.parts.torso.position.x,pit=PITS.find(([a,b])=>tx>=a-30&&tx<=b+30),dir=pit?(tx-pit[0]<pit[1]-tx?-1:1):(ent.facing||1);
    for(const bb of ent.bodies)Body.setVelocity(bb,{x:dir*7.5,y:-16});ent.grounded=-99;continue;}
   if(ent&&ent.type==='npc'&&o.plugin&&o.plugin.stakes&&!ent.dead){ent.invuln=0;ent.hp=0;ent.spikeTouch=frame;ent.stakeKill=true;juice(sp.x,sp.y,NPC[ent.kind].juice,24,5);Snd.squish();if(ent.isPlayer){shake=Math.min(12,shake+4);Run.diedX=sp.x;}killNpc(ent,null);if(mapId==='factory')meltInVat(ent);else blowUp(ent,sp.x,FLOOR+40);}  // на кольях разрывает на куски: тело исчезает
   if(ent&&ent.type==='mine'&&ent.armed<=0&&!ent.removed&&!o.isStatic){const pos={...x.position};removeEnt(ent);explode(pos.x,pos.y,ent.power,ent.radius,x);}
   // ударная бомба: взрывается от первого касания после того, как её отпустили
   if(ent&&ent.type==='bomb'&&ent.impact&&!ent.hung&&!ent.removed&&rel>2&&ent.fuse>2)ent.fuse=2;
   // тяжёлые грузы (наковальня на верёвке) давят даже с небольшой высоты
   const crushing=o.plugin&&o.plugin.crush&&!o.isStatic&&o.velocity.y>2;
   if(ent&&ent.type==='npc'&&crushing&&rel>4&&rel<=9){damageNpc(ent,(rel-4)*1.7*4*o.plugin.crush*(Mode.dmgTo?Mode.dmgTo(ent):1),sp.x,sp.y,null);}
   // рывок героя: удары тела о пол и предметы на скорости рывка не ранят (v=396); тяжёлые давящие предметы — ранят
   const dashSafe=ent&&ent.isPlayer&&frame<(ent.dashUntil||0)+14&&!(o.plugin&&o.plugin.crush&&!o.isStatic);
   if(ent&&ent.type==='npc'&&!dashSafe&&rel>9+((ent.growK||1)-1)*8){  // большой (лупа) от своих размахов и шагов не ранится
    // удары оружием считаются отдельно, поэтому столкновения тел бойцов почти не ранят
    const oe=o.plugin&&o.plugin.ent,npcHit=oe&&oe.type==='npc';
    const heavy=o.isStatic?1:clamp(o.mass/x.mass,.3,4)*(npcHit?.25:1);
    const crush=o.plugin&&o.plugin.crush&&!o.isStatic?o.plugin.crush:1;
    // v=453: груз маятника и наковальня на уровнях бьют в полную силу (обычные удары телом — вполовину, как раньше)
    const mult=(Mode.id==='level'&&crush<=1?.5:1)*(Mode.dmgTo?Mode.dmgTo(ent):1);
    damageNpc(ent,(rel-9)*1.7*heavy*crush*mult,sp.x,sp.y,null);
    x.plugin.dmg=Math.min(1,x.plugin.dmg+(rel-9)*.03);
   }
  }
 }
});
Events.on(engine,'collisionActive',e=>{
 for(const p of e.pairs){
  if(platformPass(p))continue;
  for(const [x,o] of [[p.bodyA,p.bodyB],[p.bodyB,p.bodyA]]){
   const ent=x.plugin&&x.plugin.ent;if(!ent||ent.type!=='npc'||!ent.attached.has(x.plugin.part))continue;
   // батут — не опора: иначе походка сразу гасит подброс
   if((x.plugin.part==='llL'||x.plugin.part==='llR')&&ent.attached.has(x.plugin.part)&&!(o.plugin&&o.plugin.bounce)&&
    (!ent.isPlayer||frame-(ent.lastJumpAt??-99)>5&&x.position.y<o.position.y&&x.bounds.max.y<=o.bounds.min.y+18)){
    ent.grounded=frame;if(o.plugin&&(o.plugin.deco==='ice'||o.plugin.ground&&MODS.ice))ent.onIceAt=frame;  // стоит на льду — скользит (v499: «Гололёд» — только пол, не платформы и ящики)
    // встал на другую опору (пол, платформа, ящик): высоту стойки считаем от неё, иначе походка утянет корпус к прежней опоре и проведёт ноги насквозь
    if(ent.support!==o.id){ent.support=o.id;if(ent.standOff&&(o.isStatic||o.mass>x.mass*3))ent.standY=o.bounds.min.y-ent.standOff;}
   }
   // касание земли любой прикреплённой частью — чтобы ползать без ног
   if(ent.attached.has(x.plugin.part)&&(o.isStatic||o.mass>x.mass*3))ent.touch=frame;
   if(o.plugin&&o.plugin.deco==='saw')sawContact(ent,x,o,p);
   else if(o.plugin&&o.plugin.deco==='spikes')spikeContact(ent,x,o,p);
   if(o.plugin&&o.plugin.deco==='wpn'&&!ent.dead&&(!ent.weapon||ent.weapon==='fists')&&handPart(ent)===x&&o.plugin.ent&&!o.plugin.ent.removed&&o.plugin.ent.age>40){ent.weapon=o.plugin.wpn;removeEnt(o.plugin.ent);Snd.pop();WeaponBubble.show(ent,ent.weapon);}
   const hz=o.plugin&&(o.plugin.hazard||(o.plugin.spiky&&o.plugin.ent!==ent?4:0));
   // пленника маленькие шипы ранят, но не убивают: не ниже четверти здоровья
   // v=452: пленник упал на шипы — почти насмерть: выживает с шансом 15% и 8% здоровья (раньше шипы не опускали его ниже 25%)
   if(ent.hostage&&o.plugin?.deco==='spikes'&&!ent.spikeHit&&!ent.dead){ent.spikeHit=true;const sp0=p.collision.supports&&p.collision.supports[0]||x.position;
    if(Math.random()<.15){const d=ent.hp-ent.hpMax*.08;if(d>0)damageNpc(ent,d,sp0.x,sp0.y,null);}else damageNpc(ent,ent.hp+1,sp0.x,sp0.y,null);}
   const hzRoom=ent.hostage&&o.plugin?.deco==='spikes'?ent.hp-ent.hpMax*.04:Infinity;
   if(hz&&frame%4===0&&hzRoom>0){const sp=p.collision.supports&&p.collision.supports[0]||x.position;damageNpc(ent,Math.min(hzRoom,hz*.6*(Mode.dmgTo?Mode.dmgTo(ent):1)),sp.x,sp.y,null);x.plugin.dmg=Math.min(1,x.plugin.dmg+.02);if(frame%8===0)juice(sp.x,sp.y,NPC[ent.kind].juice,3,3);}
  }
 }
});

/* ============ кадр ============ */
// герой и союзники на уровнях проходят друг сквозь друга: одна отрицательная группа Matter не даёт им сталкиваться
let allyGroup=0;
function syncAllyGroups(){
 if(Mode.id!=='level'||Run.type==='puzzle')return;
 allyGroup=allyGroup||Body.nextGroup(true);
 for(const e of entities){
  if(e.type!=='npc'||e.removed||e.hung||e.caged||(!e.isPlayer&&e.team!==0)||e.group===allyGroup)continue;
  e.group=allyGroup;for(const b of e.bodies)if(!b.plugin.cut)b.collisionFilter.group=allyGroup;
 }
}
function step(){
 frame++;
 if(frame%10===0)syncAllyGroups();
 if(slowmoT>0)slowmoT--;
 // замедление при убийстве (killSlow): почти до трети, в конце плавно разгоняется
 if(killSlowT>0)killSlowT--;
 const ks=killSlowT>0?.3+.7*Math.pow(clamp(1-killSlowT/(KILL_SLOW_T*.45),0,1),2):1;
 const tsc=(slow?.3:slowmoT>0?.65:1)*ks;engine.timing.timeScale=tsc;
 engine.gravity.y=zeroG?0:mapGravity();
 Mode.update&&Mode.update();
 if(frame%6===0)updateDashUI();
 updateCrateLoot();
 // ветер толкает всё подвижное; направление меняется раз в ~7 с
 if(MODS.wind){if(++wind.t>420){wind.t=0;wind.to=-wind.to;toast(wind.to>0?'🌬️ ➡':'⬅ 🌬️');}wind.v+=(wind.to-wind.v)*.01;
  // v=393: ветер толкает слабее (было .00022)
  const f=.00013*wind.v*engine.gravity.scale/.001;for(const b of Composite.allBodies(world))if(!b.isStatic&&!(b.plugin&&b.plugin.bound))Body.applyForce(b,b.position,{x:b.mass*f,y:0});}
 // растаявшие тела песочницы удаляем до обхода: удаление внутри цикла сдвинуло бы список
 for(const e of entities.filter(e=>e.corpseGone))removeEnt(e);
 for(const ent of entities){
  if(ent.type==='npc'){
   for(const b of ent.bodies)if(b.plugin.fadeAt&&!b.plugin.gone&&frame>b.plugin.fadeAt+30){
    b.plugin.gone=true;FX.cloud(b.position.x,b.position.y,34,0,-.4,'#f4ecdc');
    // повторный setStatic(true) затёр бы настоящую массу в _original (часть могла быть заморожена)
    if(!b.isStatic)Body.setStatic(b,true);Body.setPosition(b,{x:b.position.x,y:VH+3000});}
   // павший боец лежит не дольше 30 с (в песочнице и на уровнях), погибший на кольях тает почти сразу; потом удаляется.
   // Тело героя на уровне не удаляем — по нему работает воскрешение (растаявшее тело уходит вниз, и герой встаёт на безопасном месте)
   if(ent.dead&&ent.deadAt!==undefined&&!ent.corpseFade&&!ent.guard&&!ent.hostage&&ent!==SbPlay.ent&&(frame-ent.deadAt>=SB_CORPSE_T||ent.spikeDeath&&frame-ent.deadAt>=SPIKE_CORPSE_T)){
    if(!(ent===Run.hero&&Mode.id==='level'&&!ent.spikeDeath)){ent.corpseFade=frame;if(ent.spikeDeath)for(const b of ent.bodies)juice(b.position.x,b.position.y,NPC[ent.kind].juice,3,3);for(const b of ent.bodies)if(!b.plugin.gone&&!b.plugin.fadeAt)b.plugin.fadeAt=frame;}
   }
   if(ent.corpseFade&&frame-ent.corpseFade>32&&!(ent===Run.hero&&Mode.id==='level'))ent.corpseGone=true;
   updateFighter(ent);
   if(ent.boss){BossSlam.tryStart(ent);BossSlam.update(ent);}
   // упал в яму — всё
   if(!ent.dead&&ent.parts.torso.position.y>pitTip()+40)killNpc(ent,null);
  }
  else if(ent.type==='bomb'){
   if(ent.noSelfUntil&&frame>ent.noSelfUntil){ent.bodies[0].collisionFilter.group=0;ent.noSelfUntil=0;}  // граната отлетела от бросающего — снова сталкивается со всеми
   if(!ent.hung&&!(ent.impact&&!ent.lit&&ent.fuse>2))ent.fuse-=tsc;
   if(frame%6===0)particles.push({x:ent.bodies[0].position.x,y:ent.bodies[0].position.y-18,vx:rnd(-.5,.5),vy:-1,life:15,c:'#ffd23a',r:2});
   if(ent.fuse<=0){const b=ent.bodies[0],pos={...b.position};removeEnt(ent);explode(pos.x,pos.y,ent.power,ent.radius,b,null,ent.owner);}
  }else if(ent.type==='mine'){if(ent.armed>0)ent.armed--;}
  else if(ent.type==='saw'){const b=ent.bodies[0];if(!ent.press){Body.setAngle(b,b.angle+.25*tsc);Body.setAngularVelocity(b,.25);}
   if(ent.mv){const m=ent.mv;let k=Math.sin(frame*(m.sp||.02)+m.ph);if(m.slam)k=clamp(k*1.7,-1,1);  // пресс задерживается вверху и внизу
    Body.setPosition(b,{x:m.bx+(m.dx||0)*k,y:m.by+(m.dy||0)*k},true);}
   // v=396: пила режет пол или платформу — из-под зубьев летят искры (диск крутится по часовой: снизу зубья идут влево)
   if(!ent.press&&onScreen(b.position.x,60))sawGroundSparks(b);}
  else if(ent.type==='obj'){ent.age=(ent.age||0)+1;}
  else if(ent.type==='debris'){if(--ent.life<=0){const b=ent.bodies[0];if(onScreen(b.position.x,0))FX.puff(b.position.x,b.position.y);removeEnt(ent);}}
  else if(ent.type==='rope')updRope(ent);
  else if(ent.type==='rocket'){const b=ent.bodies[0];
   // летит по прямой без гравитации, за ней — дымный след
   Body.setVelocity(b,Vector.mult(ent.dir,13));Body.setAngle(b,Math.atan2(ent.dir.y,ent.dir.x));
   if(frame%2===0)particles.push({x:b.position.x-ent.dir.x*18,y:b.position.y-ent.dir.y*18,vx:rnd(-.4,.4),vy:rnd(-.4,.4),life:rnd(18,30),c:'#d8d8d8',r:rnd(3,6),fire:true,puff:true});
   if(frame%3===0)particles.push({x:b.position.x-ent.dir.x*16,y:b.position.y-ent.dir.y*16,vx:-ent.dir.x,vy:-ent.dir.y,life:8,c:'#ffb02a',r:3,fire:true});
   if(--ent.life<=0||b.position.y>FLOOR+30&&!inPit(b.position.x)){const pos={...b.position};removeEnt(ent);explode(pos.x,pos.y,ent.power,ent.radius,b,ent.owner,ent.owner);}}
 }
 // на уровнях бочка героя только отбрасывает — это ловушка для врагов, а не для игрока
 for(const q of pendingBooms)if(--q.t<=0)explode(q.x,q.y,.075,240,null,Mode.id==='level'?Run.hero:null);pendingBooms=pendingBooms.filter(q=>q.t>0);
 if(grab)grab.c.pointA=grab.target;
 Engine.update(engine,1000/60);FlyingShots.update();Fire.update();mantleOnPlatforms();
 for(const ent of [...entities])if(ent.bodies.length&&ent.bodies.every(b=>b.position.y>VH+500||b.position.x<-700||b.position.x>LW+700)){
  if(ent.type==='npc'&&!ent.dead)killNpc(ent,null);
  removeEnt(ent);
 }
 updRopeBits();
 for(const p of particles){p.x+=p.vx*tsc;p.y+=p.vy*tsc;p.vy+=(p.puff?-.02:.25)*tsc*(zeroG?0:1);p.life-=tsc;
  if(p.gib){p.ang+=p.vr*tsc;if(p.y>=FLOOR-4&&!inPit(p.x)){p.y=FLOOR-4;p.vy*=-.4;p.vx*=.7;p.vr*=.6;}continue;}
  if(p.shell){if(p.y>=FLOOR-1&&!inPit(p.x)){p.y=FLOOR-1;p.vy*=-.35;p.vx*=.6;}continue;}
  if(!p.fire&&!p.rope&&p.y>=FLOOR&&p.life>0){p.life=0;if(inPit(p.x))continue;addDecal({x:p.x,y:FLOOR-rnd(0,2),r:p.r*rnd(1,2),c:p.c,v:ri(1,4)});}}
 particles=particles.filter(p=>p.life>0);if(particles.length>700)particles.splice(0,particles.length-700);
 flashes.forEach(f=>f.life--);flashes=flashes.filter(f=>f.life>0);
 for(const s of sinkers){s.age++;s.x=clamp(s.x+s.vx,s.a+14,s.b-14);s.vx*=.97;s.ang+=s.vr;s.vy=s.y<FLOOR+14?s.vy+.32:s.vy*.86+.09;s.y+=s.vy;}
 sinkers=sinkers.filter(s=>s.age<s.life);
 tracers.forEach(f=>f.life--);tracers=tracers.filter(f=>f.life>0);FX.update();
 floats.forEach(f=>{f.life--;f.y-=.7;});floats=floats.filter(f=>f.life>0);
 if(shake>0){shake=Math.min(shake,12);shake*=.8;}
  if(frame%600===0)save();
}

/* ============ отрисовка ============ */
function pathBody(b){
 if(b.circleRadius){ctx.beginPath();ctx.arc(b.position.x,b.position.y,b.circleRadius,0,Math.PI*2);return;}
 const v=b.vertices;ctx.beginPath();ctx.moveTo(v[0].x,v[0].y);for(let i=1;i<v.length;i++)ctx.lineTo(v[i].x,v[i].y);ctx.closePath();
}
function drawBody(b){
 if(b.plugin&&b.plugin.deco==='chest'&&SPR.item_chest){  // v528: сундук — картинка; при ударе вздрагивает и сжимается
  const hit=frame-(b.plugin.hitT??-99),sh=hit<10?Math.sin(hit*1.9)*4*(1-hit/10):0,sq=hit<10?1-.08*(1-hit/10):1;
  ctx.save();ctx.translate(b.position.x+sh,b.position.y);ctx.rotate(b.angle);ctx.translate(0,25);ctx.scale(2-sq,sq);const st=b.plugin.stage||0,im=st===2&&SPR.item_chest_d2||st===1&&SPR.item_chest_d1||SPR.item_chest;ctx.drawImage(im,-31,-62,62,62);  /* v533: поворот вокруг центра тела — раньше при опрокидывании картинка уезжала под землю */ctx.restore();return;}
 if(b.plugin&&b.plugin.deco==='wpn'){drawDroppedWeapon(b);return;}
 if(b.plugin&&b.plugin.deco==='rocket'){const im=SPR.wpn_rocket;ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);if(im)ctx.drawImage(im,-20,-8,40,16);else{ctx.fillStyle='#e23a2e';ctx.fillRect(-15,-5,30,10);}ctx.restore();return;}
 if(b.plugin&&b.plugin.chunk&&SPR[b.plugin.chunk]){const im=SPR[b.plugin.chunk],q=(b.plugin.chunkW||30)/Math.max(im.width,im.height);ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);ctx.drawImage(im,-im.width*q/2,-im.height*q/2,im.width*q,im.height*q);ctx.restore();return;}
 if(drawItemSprite(b))return;
 const deco=b.plugin&&b.plugin.deco;
 pathBody(b);ctx.fillStyle=b.render.fillStyle;ctx.fill();
 ctx.lineWidth=2;ctx.strokeStyle='rgba(0,0,0,.45)';ctx.stroke();
 if(b.plugin&&b.plugin.dmg>0){pathBody(b);ctx.fillStyle=`rgba(60,20,10,${b.plugin.dmg*.45})`;ctx.fill();}
 if(b.plugin&&b.plugin.frozen){pathBody(b);ctx.strokeStyle='#4dd2ff';ctx.lineWidth=3;ctx.stroke();}
 if(!deco)return;
 ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
 if(deco==='chest'){ctx.fillStyle='#8a4f17';ctx.fillRect(-25,-6,50,6);ctx.fillStyle='#ffe066';ctx.strokeStyle='#6b3d10';ctx.lineWidth=2;ctx.fillRect(-25,-25,5,50);ctx.fillRect(20,-25,5,50);ctx.fillRect(-6,-6,12,12);ctx.strokeRect(-6,-6,12,12);ctx.fillStyle='#6b3d10';ctx.fillRect(-1.5,-2,3,5);}
 if(deco==='box'){ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=3;ctx.strokeRect(-19,-19,38,38);ctx.beginPath();ctx.moveTo(-19,-19);ctx.lineTo(19,19);ctx.stroke();}
 if(deco==='ball'){ctx.fillStyle='#222';ctx.beginPath();ctx.arc(0,0,7,0,7);ctx.fill();for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.beginPath();ctx.arc(Math.cos(a)*16,Math.sin(a)*16,4,0,7);ctx.fill();}}
 if(deco==='barrel'){ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-20,-16,40,4);ctx.fillRect(-20,12,40,4);ctx.fillStyle='#ffd23a';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText('☢',0,6);}
 if(deco==='brick'){ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(0,11);ctx.stroke();}
 if(deco==='bomb'){ctx.fillStyle='#fff3';ctx.beginPath();ctx.arc(-5,-5,5,0,7);ctx.fill();ctx.strokeStyle='#a87d3a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-16);ctx.quadraticCurveTo(6,-24,10,-22);ctx.stroke();}
 if(deco==='dyn'){ctx.fillStyle='#f3e1b0';ctx.fillRect(-8,-4,16,8);ctx.fillStyle='#222';ctx.font='bold 7px sans-serif';ctx.textAlign='center';ctx.fillText('TNT',0,3);}
 if(deco==='mine'){const ent=b.plugin.ent;ctx.fillStyle=ent&&ent.armed>0?'#777':(frame%30<15?'#ff2a2a':'#801010');ctx.beginPath();ctx.arc(0,-6,4,0,7);ctx.fill();}
 if(deco==='saw'){ctx.fillStyle='#9aa1ad';for(let i=0;i<16;i++){ctx.rotate(Math.PI/8);ctx.beginPath();ctx.moveTo(40,-6);ctx.lineTo(54,0);ctx.lineTo(40,6);ctx.fill();}ctx.fillStyle='#555';ctx.beginPath();ctx.arc(0,0,10,0,7);ctx.fill();}
 if(deco==='spikes'){const w=(b.bounds.max.x-b.bounds.min.x)/2;ctx.fillStyle='#c6ccd8';for(let x=-w;x<w-1;x+=15){ctx.beginPath();ctx.moveTo(x,-3);ctx.lineTo(x+7.5,-24);ctx.lineTo(x+15,-3);ctx.fill();ctx.strokeStyle='#0005';ctx.lineWidth=1;ctx.stroke();}}
 if(deco==='tramp'){ctx.strokeStyle='#fff8';ctx.lineWidth=2;for(let x=-60;x<=60;x+=20){ctx.beginPath();ctx.moveTo(x,-4);ctx.lineTo(x,4);ctx.stroke();}}
 if(deco==='ice'){ctx.fillStyle='#fff8';ctx.fillRect(-90,-6,50,3);ctx.fillRect(20,-2,40,2);}
 if(deco==='car'){ctx.fillStyle='#9fd3ff';ctx.beginPath();ctx.moveTo(-30,-15);ctx.lineTo(-18,-34);ctx.lineTo(24,-34);ctx.lineTo(38,-15);ctx.closePath();ctx.fill();ctx.strokeStyle='#0006';ctx.stroke();ctx.fillStyle='#ffe28a';ctx.fillRect(52,-6,8,6);}
 if(deco==='wheel'){ctx.fillStyle='#aab';ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fill();ctx.fillRect(-1,-12,2,24);}
 if(deco==='anvil'){ctx.fillStyle='#0003';ctx.fillRect(-30,-4,60,3);}
 ctx.restore();
}
function drawSpikes(b){ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);ctx.strokeStyle='#e8f0c0';ctx.lineWidth=1.5;const w=(b.bounds.max.x-b.bounds.min.x)*.3;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(-w,i*8);ctx.lineTo(-w-6,i*8-3);ctx.moveTo(w,i*8);ctx.lineTo(w+6,i*8-3);ctx.stroke();}ctx.restore();}
function drawFace(ent){
 const h=ent.parts.head,s=ent.s*(ent.fs||1);
 ctx.save();ctx.translate(h.position.x,h.position.y);ctx.rotate(h.angle);ctx.scale(s,s);
 const hasHead=!!SPR[`char_${ent.kind}_head`];
 if(!hasHead){
 if(ent.kind==='arbuz'){ctx.strokeStyle='#1f6b2a';ctx.lineWidth=2;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*6,-14);ctx.quadraticCurveTo(i*9,0,i*6,14);ctx.stroke();}}
 if(ent.kind==='pomidor'){ctx.fillStyle='#3d9b35';ctx.beginPath();ctx.moveTo(-6,-13);ctx.lineTo(0,-19);ctx.lineTo(6,-13);ctx.lineTo(0,-11);ctx.fill();}
 if(ent.kind==='morkov'){ctx.fillStyle='#4caf3a';ctx.fillRect(-2,-22,4,8);ctx.fillRect(-6,-20,3,6);ctx.fillRect(3,-20,3,6);}
 if(ent.kind==='perets'){ctx.strokeStyle='#3d9b35';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-14);ctx.quadraticCurveTo(2,-22,8,-22);ctx.stroke();ctx.fillStyle='#3d9b35';ctx.beginPath();ctx.ellipse(0,-14,6,2.5,0,0,7);ctx.fill();}
 if(ent.kind==='kukuruza'){ctx.fillStyle='#d9a520';for(let y=-10;y<=10;y+=5)for(let x=-6;x<=6;x+=4)if(!(Math.abs(y)<9&&Math.abs(x)<9)){ctx.beginPath();ctx.arc(x,y,1.2,0,7);ctx.fill();}ctx.fillStyle='#5fa83a';ctx.beginPath();ctx.moveTo(-11,10);ctx.quadraticCurveTo(-16,-4,-8,-16);ctx.lineTo(-9,6);ctx.fill();ctx.beginPath();ctx.moveTo(11,10);ctx.quadraticCurveTo(16,-4,8,-16);ctx.lineTo(9,6);ctx.fill();}
 if(ent.kind==='kapusta'){ctx.strokeStyle='#5f9a3a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,4,16,Math.PI*1.1,Math.PI*1.9);ctx.stroke();ctx.beginPath();ctx.arc(0,9,13,Math.PI*1.15,Math.PI*1.85);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(0,-6);ctx.stroke();}
 if(ent.kind==='ogurets'){ctx.fillStyle='#ffffff55';for(const [x,y] of [[-6,-8],[5,-3],[-3,8]]){ctx.beginPath();ctx.arc(x,y,1.5,0,7);ctx.fill();}}
 }
 // повязок нет — команду показывает цвет полоски здоровья; у босса корона
 if(ent.boss&&!drawCrownSprite()){ctx.fillStyle='#ffd23a';ctx.beginPath();ctx.moveTo(-9,-13);ctx.lineTo(-9,-22);ctx.lineTo(-4,-16);ctx.lineTo(0,-23);ctx.lineTo(4,-16);ctx.lineTo(9,-22);ctx.lineTo(9,-13);ctx.fill();}
 if(drawFaceSprites(ent)){ctx.restore();return;}
 const ey=-2,fx=ent.facing*.8;
 if(ent.dead){ctx.strokeStyle='#111';ctx.lineWidth=2;for(const ex of [-5,5]){ctx.beginPath();ctx.moveTo(ex-3,ey-3);ctx.lineTo(ex+3,ey+3);ctx.moveTo(ex+3,ey-3);ctx.lineTo(ex-3,ey+3);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(-4,7);ctx.quadraticCurveTo(0,4,4,7);ctx.stroke();}
 else{
  const hurt=ent.stun>0,bl=ent.blink<6,angry=ent.target&&!hurt;
  for(const ex of [-5,5]){ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(ex,ey,3.6,bl?.6:4.2,0,0,7);ctx.fill();if(!bl){ctx.fillStyle='#111';ctx.beginPath();ctx.arc(ex+(hurt?0:fx*1.2),ey+.5,hurt?1.2:2,0,7);ctx.fill();}}
  ctx.strokeStyle='#111';ctx.lineWidth=1.6;
  if(angry){ctx.beginPath();ctx.moveTo(-8,ey-6);ctx.lineTo(-2,ey-4);ctx.moveTo(8,ey-6);ctx.lineTo(2,ey-4);ctx.stroke();}
  ctx.beginPath();
  if(hurt)ctx.ellipse(0,7,2.5,3,0,0,7);else if(angry){ctx.moveTo(-4,7);ctx.lineTo(4,7);}else{ctx.moveTo(-4,5);ctx.quadraticCurveTo(0,9,4,5);}ctx.stroke();
 }
 ctx.restore();
}
function drawHud(ent){
 const t=ent.parts.head.position,hy=t.y-ent.parts.head.plugin.h/2-HeroEvolution.topExtra(ent)-((ent.growK||1)-1)*22;  // увеличенный лупой — полоска выше
 const show=!ent.dead&&(ent.hpShow>0||(ent.team>=0&&Mode.showBars&&Mode.showBars()));
 if(show){
  // крупная полоска здоровья с обводкой; цвет — команда (без команды — зелёный/красный по здоровью)
  const w=ent.boss||ent.guard?96:64,h=ent.boss||ent.guard?13:11,x=t.x-w/2,y=hy-19,f=Math.max(0,ent.hp/ent.hpMax);
  const col=ent.team>=0?TEAMC[ent.team]:(f>.4?'#5fdc4a':'#ff5c4a');
  ctx.globalAlpha=ent.team>=0&&Mode.showBars&&Mode.showBars()?1:Math.min(1,ent.hpShow/30);
  ctx.fillStyle='#111';ctx.beginPath();ctx.roundRect(x-2,y-2,w+4,h+4,5);ctx.fill();
  ctx.fillStyle='#3a3f4d';ctx.beginPath();ctx.roundRect(x,y,w,h,3);ctx.fill();
  if(f>0){ctx.fillStyle=col;ctx.beginPath();ctx.roundRect(x,y,Math.max(3,w*f),h,3);ctx.fill();
   ctx.fillStyle='#ffffff55';ctx.fillRect(x+2,y+1.5,Math.max(0,w*f-4),h*.3);}
  if(f<.3&&frame%30<15){ctx.strokeStyle='#ff5c4a';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x-2,y-2,w+4,h+4,5);ctx.stroke();}
  ctx.globalAlpha=1;}
 // стрелка-метка над героем игрока убрана (2026-11-10): героя видно по синей полоске здоровья
 if(ent.dead)return;
 // оглушён — над головой кружат звёздочки
 if(ent.stun>18&&SPR.tfx_star&&!ent.hung&&!ent.caged){const hx=t.x,hy2=hy-4;for(let i=0;i<3;i++){const a=frame*.14+i*Math.PI*2/3,sx=hx+Math.cos(a)*16,sy=hy2+Math.sin(a)*5,front=Math.sin(a)>0;drawTfx('star',0,sx,sy,front?11:8,front?11:8,a,front?1:.6,'#ffd23a');}}
 // перезарядка: кольцо над головой
 if(ent.reload>0){const wp=WEAPONS[ent.weapon]||{},k=1-ent.reload/(wp.rl||1),x=t.x+(ent.boss?50:36),y=hy-12;
  ctx.save();
  if(SPR.ui_reload_ring){ctx.drawImage(SPR.ui_reload_ring,x-12,y-12,24,24);const im=SPR.icon_reload;if(im){ctx.save();ctx.translate(x,y);ctx.rotate(frame*.12);ctx.drawImage(im,-8,-8,16,16);ctx.restore();}}
  else{ctx.fillStyle='#000a';ctx.beginPath();ctx.arc(x,y,10,0,7);ctx.fill();}
  ctx.strokeStyle='#ffcc33';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.arc(x,y,10,-Math.PI/2,-Math.PI/2+k*Math.PI*2);ctx.stroke();ctx.restore();}
 // замах: кулак светится кругом, оружие светится целиком (drawWeaponSprite); при полном заряде — искры
 if(ent.charge>CH_MIN&&armSide(ent)){const k=clamp((ent.charge-CH_MIN)/CH_FULL,0,1),h=handPos(ent),full=k>=1;
  if((!ent.weapon||ent.weapon==='fists')&&!holdsStick(ent)){ctx.globalAlpha=.35+.35*k;ctx.fillStyle=full?(frame%8<4?'#fff6a0':'#ff9a2a'):'#ffd23a';ctx.beginPath();ctx.arc(h.x,h.y,6+k*10,0,7);ctx.fill();ctx.globalAlpha=1;}  // с оружием светится само оружие
  if(full&&frame%4===0)sparks(h.x,h.y,1);}
}
// линии скорости за бегущим или летящим в таран
function drawSpeedLines(ent){
 if(ent.dead||(ent.runT<SPRINT_T&&!ent.tackle&&frame>=(ent.dashUntil||0)))return;
 const t=ent.parts.torso,v=t.velocity.x;if(Math.abs(v)<2.5)return;
 const d=-Math.sign(v),h=t.plugin.h;ctx.strokeStyle=ent.tackle?'#fff':'#ffffffaa';ctx.lineWidth=ent.tackle?3:2;ctx.lineCap='round';
 for(let i=0;i<4;i++){const y=t.position.y-h*.4+i*h*.27,x=t.position.x+d*(t.plugin.w*.6+((frame*3+i*7)%14)),L=14+Math.abs(v)*3;ctx.globalAlpha=.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+d*L,y);ctx.stroke();}
 ctx.globalAlpha=1;ctx.lineCap='butt';
}
// белый шлейф за остриём оружия во время взмаха
function drawSwingTrail(ent){
 const tr=ent.trail;if(!tr||tr.length<2)return;
 ctx.lineCap='round';
 for(let i=1;i<tr.length;i++){const a=tr[i-1],b=tr[i],k=i/tr.length;ctx.globalAlpha=.55*k*Math.min(1,b.l/4);ctx.strokeStyle=ent.pw>.5?'#ffe27a':'#ffffff';ctx.lineWidth=2+k*(ent.pw>.5?10:7);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 ctx.globalAlpha=1;ctx.lineCap='butt';
}
function drawNpcPart(ent,b){if(b.plugin.gone)return;const fa=b.plugin.fadeAt&&frame>b.plugin.fadeAt?Math.max(0,1-(frame-b.plugin.fadeAt)/30):1;if(fa<1)ctx.globalAlpha=fa;if(!drawPartSprite(ent,b))drawBody(b);if(b.plugin.stumps)drawStumps(ent,b);ctx.globalAlpha=1;}
function drawStumps(ent,b){
 const flesh=NPC[ent.kind].flesh||'#e8f5c8',a=ctx.globalAlpha;
 ctx.save();pathBody(b);ctx.clip();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
 for(const st of b.plugin.stumps){const r=Math.min(st.r||4*ent.s,b.plugin.w*.4,b.plugin.h*.4);
  ctx.fillStyle=flesh;ctx.strokeStyle='#0006';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(st.x,st.y,r,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle=NPC[ent.kind].juice;ctx.globalAlpha=a*.85;ctx.beginPath();ctx.arc(st.x,st.y,r*.45,0,7);ctx.fill();ctx.globalAlpha=a;}
 ctx.restore();
}
function drawDroppedWeapon(b){
 const id=b.plugin.wpn,im=SPR['wpn_'+id],f=WPN_FIT[id];
 ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
 if(im&&f){const L=f.L,H=L*im.height/im.width;ctx.drawImage(im,-L/2,-H/2,L,H);}
 else{ctx.fillStyle='#8d97a8';ctx.strokeStyle='#0008';ctx.lineWidth=1.5;const w=b.plugin.len;ctx.beginPath();ctx.roundRect(-w/2,-4,w,8,3);ctx.fill();ctx.stroke();ctx.fillStyle='#6b4a2a';ctx.fillRect(-w/2,-4,w*.3,8);}
 ctx.restore();
}
function ropePath(P){ctx.beginPath();ctx.moveTo(P[0].x,P[0].y);for(let i=1;i<P.length-1;i++){const mx=(P[i].x+P[i+1].x)/2,my=(P[i].y+P[i+1].y)/2;ctx.quadraticCurveTo(P[i].x,P[i].y,mx,my);}const l=P[P.length-1];ctx.lineTo(l.x,l.y);}
function drawRopePts(P,alpha){
 if(P.length<2)return;
 ctx.globalAlpha=alpha===undefined?1:alpha;ctx.lineCap='round';ctx.lineJoin='round';
 ropePath(P);ctx.strokeStyle='#1b1b1b';ctx.lineWidth=7;ctx.stroke();
 ropePath(P);ctx.strokeStyle='#b98a52';ctx.lineWidth=4;ctx.stroke();
 // скрутка волокон: штрихи вдоль верёвки
 ropePath(P);ctx.strokeStyle='#7a5530';ctx.lineWidth=4;ctx.setLineDash([2.5,5]);ctx.lineDashOffset=0;ctx.stroke();ctx.setLineDash([]);
 ropePath(P);ctx.strokeStyle='#e2b67c';ctx.lineWidth=1.2;ctx.stroke();
 ctx.globalAlpha=1;ctx.lineCap='butt';ctx.lineJoin='miter';
}
// зона спасения: столб света, светящаяся полоса на полу, флаг и прыгающие стрелки «сюда»
function drawGoalZone(p){
 const y=p.y||FLOOR,x1=p.x1,cx=(p.x0+x1)/2,H=Math.min(320,y-40);
 const im=SPR['item_flag_'+(Math.floor(frame/9)%4)]||SPR.item_flag;
 if(im){const fw=92,fh=fw*im.height/im.width;ctx.drawImage(im,x1-fw*.72,y-fh,fw,fh);}
 // стрелка покачивается и показывает, куда попасть
 const ar=SPR.item_zone_arrow;if(ar){const aw=46,ah=aw*ar.height/ar.width,ay=y-H*.42+Math.abs(Math.sin(frame*.07))*20;ctx.drawImage(ar,cx-aw/2,ay,aw,ah);}
}
// туториал: ножницы раз за разом проводят по верёвке, пока игрок не сделал первый разрез
function drawScissors(x,y,ang,open,a){
 // значок ножниц в стиле игры; при разрезе слегка покачивается
 if(SPR.icon_scissors){const s=56;ctx.save();ctx.globalAlpha=a;ctx.translate(x,y);ctx.rotate(ang*.15+(open-.32)*1.2);ctx.drawImage(SPR.icon_scissors,-s/2,-s/2,s,s);ctx.restore();return;}
 ctx.save();ctx.globalAlpha=a;ctx.translate(x,y);ctx.rotate(ang);ctx.scale(1.25,1.25);
 for(const sg of [1,-1]){ctx.save();ctx.rotate(sg*open);
  ctx.strokeStyle='#1b1b1b';ctx.lineWidth=3;ctx.fillStyle='#e9eef5';
  ctx.beginPath();ctx.moveTo(-3,-3.5*sg);ctx.quadraticCurveTo(18,-7*sg,34,0);ctx.lineTo(-3,3*sg);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffffffaa';ctx.fillRect(4,-2.5*sg-(sg<0?1.5:0),20,1.5);
  ctx.beginPath();ctx.ellipse(-15,9*sg,9,7,0,0,7);ctx.strokeStyle='#1b1b1b';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#ef4a33';ctx.lineWidth=4;ctx.stroke();
  ctx.restore();}
 ctx.fillStyle='#8b95a3';ctx.strokeStyle='#1b1b1b';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,3.5,0,7);ctx.fill();ctx.stroke();
 ctx.restore();
}
function drawCutTutor(only){
 const ropes=only?[only]:entities.filter(e=>e.type==='rope'&&e.pts);if(!ropes.length)return;
 const T=only?60:110,cyc=Math.floor(frame/T),t=(frame%T)/T,r=ropes[cyc%ropes.length],P=r.pts,i=Math.round((P.length-1)*.68),m=P[i],a=P[i-1],b=P[i+1];
 let dx=b.x-a.x,dy=b.y-a.y;const L=Math.hypot(dx,dy)||1;let nx=-dy/L,ny=dx/L;if(nx<0){nx=-nx;ny=-ny;}
 const k=t<.15?0:t>.7?1:(t-.15)/.55,e=k*k*(3-2*k),D=70,sx=m.x-nx*D,sy=m.y-ny*D,x=sx+nx*2*D*e,y=sy+ny*2*D*e;
 const al=t<.12?t/.12:t>.85?(1-t)/.15:1;
 // след пальца
 ctx.save();ctx.globalAlpha=al*.85;ctx.strokeStyle='#ffffff';ctx.lineWidth=5;ctx.lineCap='round';ctx.setLineDash([2,11]);
 ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(x,y);ctx.stroke();ctx.restore();
 // вспышка в момент пересечения верёвки
 if(e>.45&&e<.75){const q=(e-.45)/.3;ctx.globalAlpha=(1-q)*al;ctx.strokeStyle='#fff6a8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(m.x,m.y,8+q*22,0,7);ctx.stroke();ctx.globalAlpha=1;}
 const open=k>0&&k<1?.12+.28*Math.abs(Math.sin(frame*.45)):.32;
 drawScissors(x,y,Math.atan2(ny,nx),open,al);
}
// подсказка: кольцо на нужной верёвке сжимается к моменту разреза, затем ножницы и надпись
function drawHint(){
 if(!Run.hintList)Run.hintList=entities.filter(e=>e.type==='rope');
 const plan=HINTS[Run.idx];
 let r=Run.hintList[plan[Run.hintK]&&plan[Run.hintK][0]];
 if(r&&r.removed){Run.hintK++;Run.hintT=frame;r=plan[Run.hintK]&&Run.hintList[plan[Run.hintK][0]];}
 if(!r||!r.pts||r.removed)return;
 const left=plan[Run.hintK][1]-(frame-Run.hintT),m=r.pts[Math.round((r.pts.length-1)*.68)];
 ctx.save();ctx.lineCap='round';
 if(left>6){const q=clamp(left/90,0,1);ctx.strokeStyle='#ffe27a';ctx.lineWidth=5;ctx.beginPath();ctx.arc(m.x,m.y,16+q*44,0,7);ctx.stroke();ctx.fillStyle='#ffe27a';ctx.beginPath();ctx.arc(m.x,m.y,7,0,7);ctx.fill();}
 else{const pulse=1+Math.sin(frame*.35)*.18;ctx.strokeStyle='#7dff6a';ctx.lineWidth=6;ctx.beginPath();ctx.arc(m.x,m.y,20*pulse,0,7);ctx.stroke();
  ctx.font='900 26px Nunito,system-ui';ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#2c6b18';ctx.fillStyle='#fff';const s=t('Режь сейчас!');ctx.strokeText(s,m.x,m.y-34);ctx.fillText(s,m.x,m.y-34);}
 ctx.restore();
 if(left<=6)drawCutTutor(r);
}
function drawHook(p){ctx.fillStyle='#5b606c';ctx.strokeStyle='#1b1b1b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,6,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#9aa1ad';ctx.beginPath();ctx.arc(p.x-1.5,p.y-1.5,2,0,7);ctx.fill();}
function drawRope(r){
 drawRopePts(r.pts);
 if(!r.A.body)drawHook(r.pts[0]);
 // подсказка «режь здесь» на верёвках в головоломках
 if(Mode.ropeHint&&Mode.ropeHint()&&!(screen==='play'&&Run.type==='puzzle')){const m=r.pts[Math.floor(r.pts.length/2)];ctx.globalAlpha=.5+.4*Math.sin(frame*.12);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(m.x,m.y,13,0,7);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
}
// полоска над панелью песочницы: какая часть карты сейчас видна; ярче, пока карту листают
let barA=1;
function drawScrollBar(){
 const moving=(pan&&(pan.down&&pan.moved||Math.abs(pan.v)>.2))||(grab&&grab.sx!=null);
 barA+=((moving?1:.4)-barA)*.12;
 const W=Math.min(WW*.3,260),x0=(WW-W)/2,y=FLOOR+4,k=W/LW,w=Math.max(18,WW*k),x=x0+camX*k;
 ctx.save();ctx.globalAlpha=barA;ctx.fillStyle='#0005';ctx.beginPath();ctx.roundRect(x0-2,y-2,W+4,10,5);ctx.fill();
 ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(x,y,w,6,3);ctx.fill();ctx.restore();
}
// куда идёт герой: стрелки-шевроны у земли под пальцем
function drawDrive(){const h=Run.hero;if(!h||h.removed)return;const x=drive.x,hx=h.parts.torso.position.x,d=Math.sign(x-hx);if(!d||Math.abs(x-hx)<36)return;
 ctx.save();ctx.translate(x,FLOOR-10);ctx.globalAlpha=.55+.25*Math.sin(frame*.25);ctx.fillStyle='#fff';ctx.strokeStyle='#3a2518';ctx.lineWidth=3;ctx.lineJoin='round';
 for(let i=0;i<2;i++){const o=-d*i*16;ctx.beginPath();ctx.moveTo(o-d*8,-12);ctx.lineTo(o+d*6,0);ctx.lineTo(o-d*8,12);ctx.lineTo(o-d*2,0);ctx.closePath();ctx.stroke();ctx.fill();}
 ctx.restore();}
function drawRopeBits(){for(const k of ropeBits){drawRopePts(k.pts,k.life<40?k.life/40:1);if(k.top&&k.pin&&!k.pin.body)drawHook(k.pts[0]);}}
// клетка с пленником: прутья поверх персонажа, замок по центру
// связанный друг: клетки нет, только просьба о помощи над головой; верёвки рисует drawBonds
function drawCage(c){
 const {x,y,h}=c.box;
 if(frame%120<70){ctx.font='bold 15px Nunito,system-ui,sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#000';const s=t('Помогите!');ctx.strokeText(s,x,y-h-22);ctx.fillStyle='#fff';ctx.fillText(s,x,y-h-22);}
}
// верёвки на связанном: витки вокруг туловища и прижатых рук, узел спереди, ещё виток на ногах
function drawBonds(ent){
 const P=ent.parts,T=P.torso,w=T.plugin.w,h=T.plugin.h,hw=w*.5+P.uaL.plugin.w*1.05;
 const rope=(pts)=>{for(const [col,lw] of [['#3a2518',8.5],['#c9a063',5]]){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(pts[0],pts[1]);ctx.quadraticCurveTo(pts[2],pts[3],pts[4],pts[5]);ctx.stroke();}
  ctx.strokeStyle='#8f6c3a';ctx.lineWidth=1.6;for(let k=.1;k<1;k+=.14){const a=1-k,x=a*a*pts[0]+2*a*k*pts[2]+k*k*pts[4],y=a*a*pts[1]+2*a*k*pts[3]+k*k*pts[5];ctx.beginPath();ctx.moveTo(x-2,y-2);ctx.lineTo(x+2,y+2);ctx.stroke();}};
 ctx.save();ctx.lineCap='round';ctx.translate(T.position.x,T.position.y);ctx.rotate(T.angle);
 for(const f of [-.02,.14,.3]){const y=h*f;rope([-hw,y,0,y+7,hw,y]);}
 // узел и два хвостика
 ctx.fillStyle='#c9a063';ctx.strokeStyle='#3a2518';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,h*.14+4,7,5.5,0,0,7);ctx.fill();ctx.stroke();
 rope([-3,h*.14+7,-9,h*.14+14,-12,h*.14+22]);rope([3,h*.14+7,9,h*.14+14,12,h*.14+20]);
 ctx.restore();
 // ноги
 const a=P.llL.position,b=P.llR.position;ctx.save();ctx.lineCap='round';rope([a.x-10,a.y,(a.x+b.x)/2,(a.y+b.y)/2+5,b.x+10,b.y]);ctx.restore();
}
function drawGate(g){
 const b=g.bodies[0];drawBody(b);
 // v=458: цифры над стеной больше нет; от ударов проступают трещины, удар — короткая вспышка
 const fr=clamp((g.hp??GATE_HP)/(g.hpMax||GATE_HP),0,1),w=b.plugin.w,h=b.plugin.h;
 ctx.save();ctx.translate(b.position.x,b.position.y);
 if(frame-(g.hitT??-99)<5){ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(-w/2,-h/2,w,h);}
 if(fr<.85){ctx.strokeStyle='rgba(20,22,28,'+(0.35+(1-fr)*.55)+')';ctx.lineWidth=2;const n=Math.ceil((1-fr)*7);
  for(let i=0;i<n;i++){const y0=-h/2+((i*53)%h);ctx.beginPath();ctx.moveTo(-w/2+2,y0);ctx.lineTo(-w*.1,y0+9);ctx.lineTo(w*.15,y0+3);ctx.lineTo(w/2-2,y0+14);ctx.stroke();}}
 ctx.restore();
 // подсказка над стеной (вместо прежней цифры): герой рядом — покачивается плашка «Сломай стену!»
 const hr=typeof Run!=='undefined'&&Run.hero&&!Run.hero.dead?Run.hero.parts.torso.position:null;
 if(hr&&Math.abs(hr.x-b.position.x)<520){
  const tx=b.position.x,ty=b.position.y-h/2-34+Math.sin(frame*.12)*4,label=t('Сломай стену!');
  ctx.save();ctx.font='800 17px Nunito,system-ui';const tw=ctx.measureText(label).width+28;
  ctx.fillStyle='#fff6e8';ctx.strokeStyle='#d9974c';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(tx-tw/2,ty-16,tw,32,16);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(tx-8,ty+15);ctx.lineTo(tx,ty+25);ctx.lineTo(tx+8,ty+15);ctx.fill();
  ctx.fillStyle='#5b3410';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,tx,ty+1);ctx.restore();
 }
}
function drawPickups(){
 for(const p of pickups){
  if(p.x<camX-60||p.x>camX+WW+60)continue;
  if(p.t==='crateLoot'&&!p.taken){drawCrateLoot(p);continue;}
  // монета: крупная, не вращается — мягко покачивается, тонкий контур и тёплое свечение, по ней пробегает блик
  if(p.t==='coin'&&!p.taken){const im=SPR.icon_coin,y=p.y+Math.sin(frame*.06+p.x*.05)*4,w=34;
   ctx.save();ctx.translate(p.x,y);
   const g=ctx.createRadialGradient(0,0,w*.3,0,0,w*.95);g.addColorStop(0,'rgba(255,230,120,.55)');g.addColorStop(1,'rgba(255,230,120,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,w*.95,0,7);ctx.fill();
   ctx.fillStyle='#3a2518bb';ctx.beginPath();ctx.arc(0,.8,w/2+.8,0,7);ctx.fill();
   if(im)ctx.drawImage(im,-w/2,-w/2,w,w);else{ctx.fillStyle='#ffcc33';ctx.beginPath();ctx.arc(0,0,w/2,0,7);ctx.fill();}
   const sh=((frame+p.x*.7)%150)/150;if(sh<.3){ctx.save();ctx.beginPath();ctx.arc(0,0,w/2-1,0,7);ctx.clip();ctx.globalAlpha=.75;ctx.fillStyle='#fff';ctx.rotate(.5);const sx=-w+sh/.3*w*2;ctx.fillRect(sx,-w,w*.18,w*2);ctx.restore();}
   ctx.restore();}
  if(p.t==='cp')drawCheckpoint(p);
  if(p.t==='zone')drawGoalZone(p);
 }
}
// чекпоинт: после прохождения — вращающиеся золотые лучи, искры и «подпрыгивание» при активации
function drawCheckpoint(p){
 const st=p.on?'on':'off',im=SPR['item_cp_'+mapId+'_'+st]||SPR['item_cp_'+st];if(!im)return;
 const age=p.onAt===undefined?999:frame-p.onAt,pop=age<36?Math.exp(-age/10)*Math.sin(age*.5)*.45:0,H0=136,h=H0*(1+pop),w=h*im.width/im.height,cx=p.x,cy=FLOOR-H0*.8;
 ctx.save();
 if(p.on){
  const R=78+Math.sin(frame*.08)*6+(age<20?(20-age)*5:0);
  ctx.translate(cx,cy);ctx.rotate(frame*.012);
  for(let i=0;i<10;i++){ctx.rotate(Math.PI/5);const g=ctx.createLinearGradient(0,0,0,-R);g.addColorStop(0,'rgba(255,225,110,.75)');g.addColorStop(1,'rgba(255,225,110,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(0,-R);ctx.lineTo(9,0);ctx.closePath();ctx.fill();}
  ctx.rotate(-frame*.012);const gl=ctx.createRadialGradient(0,0,6,0,0,R*.8);gl.addColorStop(0,'rgba(255,240,170,.9)');gl.addColorStop(1,'rgba(255,220,90,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill();
  ctx.translate(-cx,-cy);
  if(frame%14===0&&onScreen(cx,0))FX.sparkle(cx+rnd(-46,46),cy+rnd(-44,50),rnd(16,26));
 }
 ctx.drawImage(im,cx-w/2,FLOOR-h+5,w,h);
 ctx.restore();
}
function drawFlag(f){if(f.y!==undefined){ctx.save();ctx.translate(0,f.y-FLOOR);const g={x:f.x};drawFlag(g);ctx.restore();return;}if(drawFlagSprite(f))return;const x=f.x,y=FLOOR;ctx.strokeStyle='#333';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-120);ctx.stroke();ctx.fillStyle=frame%40<20?'#3ddc84':'#2fbf70';ctx.beginPath();ctx.moveTo(x,y-120);ctx.lineTo(x+50,y-105+Math.sin(frame*.1)*3);ctx.lineTo(x,y-90);ctx.fill();
 ctx.globalAlpha=.15+.1*Math.sin(frame*.1);ctx.fillStyle='#3ddc84';ctx.fillRect(x-40,y-130,80,130);ctx.globalAlpha=1;}
const onScreen=(x,m)=>x>camX-(m||250)&&x<camX+WW+(m||250);
function render(){
 viewTransform();
 if(shake>.5)ctx.translate(rnd(-shake,shake)*.22,rnd(-shake,shake)*.22);
 drawMapBg(FLOOR);
 drawAmbient(FLOOR);
 if(MODS.night&&NightSky.open())NightSky.draw();
 ctx.save();ctx.translate(-Math.round(camX*100)/100,0);
 drawFloor(FLOOR);
 // ночью земля темнее: дневная текстура пола иначе светится на фоне ночного неба
 if(MODS.night){
  // по участкам между ямами: над ямой заливки нет, иначе колья перечёркивает полоса (v=395)
  const segs=[];let sx=camX+viewX-60;const ex=sx+viewW+120;
  for(const [a,b] of [...PITS].sort((p,q)=>p[0]-q[0])){if(b<sx)continue;if(a>ex)break;if(a>sx)segs.push([sx,a]);sx=Math.max(sx,b);}
  if(sx<ex)segs.push([sx,ex]);
  ctx.fillStyle='rgba(10,16,48,.45)';for(const [a,b] of segs)ctx.fillRect(a,FLOOR-4,b-a,viewY+viewH-FLOOR+60);
  // в теплице у ночного фона над линией земли светлая полоска — узкая мягкая тень у самой травы
  if(mapId==='greenhouse'){const sg=ctx.createLinearGradient(0,FLOOR-14,0,FLOOR-3);sg.addColorStop(0,'rgba(6,12,36,0)');sg.addColorStop(1,'rgba(6,12,36,.8)');ctx.fillStyle=sg;for(const [a,b] of segs)ctx.fillRect(a,FLOOR-14,b-a,11);}
 }
 if(MODS.ice)drawIce();
 DecalLayer.draw();
 ctx.globalAlpha=1;
 drawPickups();
 drawRopeBits();
 if(Mode.flag)drawFlag(Mode.flag);
 // v=396: сначала платформы, предметы и верёвки, потом все бойцы — и герой, и враги стоят перед платформами
 for(const pass of [0,1])for(const ent of entities){
  if((ent.type==='npc')!==(pass===1))continue;
  if(ent.type==='rope'){drawRope(ent);continue;}
  if(ent.type==='cage'){drawCage(ent);continue;}
  if(ent.type==='gate'){drawGate(ent);continue;}
  if(ent.bodies.length&&!ent.bodies.some(b=>onScreen(b.position.x)))continue;
  // слои: дальняя рука → ноги → туловище → оружие → ближняя рука → голова с лицом поверх всего
  if(ent.type==='npc'){const P=ent.parts;updHead(ent);drawSpeedLines(ent);drawSwingTrail(ent);drawTopper(ent);for(const b of [P.uaL,P.laL,P.ulL,P.llL,P.ulR,P.llR,P.torso])drawNpcPart(ent,b);if(NPC[ent.kind].hazard)for(const b of [P.torso,P.uaL,P.ulL])drawSpikes(b);drawFace(ent);HeroEvolution.drawUpgrade(ent);drawWeapon(ent);drawNpcPart(ent,P.uaR);drawNpcPart(ent,P.laR);if(ent.caged||ent.guard)drawBonds(ent);}
  else{ent.bodies.forEach(drawBody);if(ent.item&&ent.hp<ent.hpMax)drawCracks(ent);}
 }
 for(const ent of entities)if(ent.type==='npc'&&onScreen(ent.parts.torso.position.x))drawHud(ent);
 drawLootBuffs();
 Memes.draw();
 // трассер: тёплое свечение и яркое ядро, сзади тает быстрее, чем у цели
 ctx.lineCap='round';
 for(const t of tracers){const k=clamp(t.life/7,0,1),sx=t.x1+(t.x2-t.x1)*(1-k)*.6,sy=t.y1+(t.y2-t.y1)*(1-k)*.6;
  ctx.strokeStyle=`rgba(255,170,60,${.35*k})`;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(t.x2,t.y2);ctx.stroke();
  ctx.strokeStyle=`rgba(255,250,215,${k})`;ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(t.x2,t.y2);ctx.stroke();}
 ctx.lineCap='butt';
 for(const p of particles){ctx.globalAlpha=clamp(p.life/30,0,1)*(p.puff?.6:1);ctx.fillStyle=p.c;
  if(p.gib){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.ang);ctx.drawImage(p.gib.im,-p.gib.w/2,-p.gib.h/2,p.gib.w,p.gib.h);ctx.restore();continue;}
  // искра — рисунок ChatGPT (fx_spark_1..4), вытянута по направлению полёта, к концу жизни короче
  if(p.spark){const im=SPR['fx_spark_'+p.spark];if(im){const L=p.len*(.45+.55*clamp(p.life/p.life0,0,1)),H=L*im.height/im.width;ctx.globalAlpha=clamp(p.life/10,0,1);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.spark===4?p.life*.3:Math.atan2(p.vy,p.vx));ctx.drawImage(im,-L*.8,-H/2,L,H);ctx.restore();continue;}}
  if(p.shell){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.life*.4);ctx.fillRect(-2.5,-1.2,5,2.4);ctx.restore();}
  else if(p.rope){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.ang+(40-p.life)*.05);ctx.fillRect(-p.rope,-2,p.rope*2,4);ctx.restore();}
  else{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();}}
 ctx.globalAlpha=1;
 StuckShots.draw();FlyingShots.draw();FX.draw();Fire.draw();
 for(const f of flashes){const g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,f.r);g.addColorStop(0,`rgba(255,240,180,${f.life/12})`);g.addColorStop(1,'rgba(255,120,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,7);ctx.fill();}
 if(drive&&screen==='play'&&Run.type!=='puzzle')drawDrive();
 if(screen==='play'&&Run.guard)drawGuardCage();
 Climb.arrow();FirstMinutes.draw();Chests.draw();WeaponBubble.draw();drawAimReticle();if(screen==='play')RunHazards.draw();
 if(screen==='play'&&Run.state==='play'&&hintOn())drawHint();
 else if(screen==='play'&&Run.type==='puzzle'&&Run.state==='play'&&Run.cuts===0&&(isFirstPuzzle()||Run.def.ropePractice))drawCutTutor();
 ctx.font='bold 15px Nunito,system-ui,sans-serif';ctx.textAlign='center';
 for(const f of floats){ctx.globalAlpha=clamp(f.life/20,0,1);
  const age=48-f.life,sc=(f.big||1)*(f.pop?(age<5?.5+age*.18:age<9?1.4-(age-5)*.1:1):1);
  ctx.save();ctx.translate(f.x,f.y);ctx.scale(sc,sc);ctx.font=(f.pop||f.big?'900 17px':'bold 15px')+' Nunito,system-ui,sans-serif';
  if(f.img){ // оружие в руки: иконка с лучами выскакивает над бойцом
   const a=62-f.life,k=a<7?.35+a*.14:a<13?1.33-(a-7)*.055:1;ctx.scale(1/sc*k,1/sc*k);
   const gl=ctx.createRadialGradient(0,0,4,0,0,58);gl.addColorStop(0,'rgba(255,240,170,.95)');gl.addColorStop(.55,'rgba(255,205,60,.45)');gl.addColorStop(1,'rgba(255,205,60,0)');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,58,0,7);ctx.fill();
   ctx.save();ctx.rotate(frame*.04);ctx.fillStyle='rgba(255,214,70,.7)';for(let i=0;i<10;i++){ctx.rotate(Math.PI/5);ctx.beginPath();ctx.moveTo(-6,-26);ctx.lineTo(6,-26);ctx.lineTo(2,-62);ctx.lineTo(-2,-62);ctx.closePath();ctx.fill();}ctx.restore();
   if(f.img)ctx.drawImage(f.img,-34,-34,68,68);ctx.restore();continue;}
  if(f.t==='✂'&&SPR.icon_scissors){ctx.drawImage(SPR.icon_scissors,-15,-22,30,30);ctx.restore();continue;}
  ctx.lineWidth=f.pop?3:3;ctx.strokeStyle=f.pop?'#8a4a0c':'#000c';ctx.strokeText(f.t,0,0);ctx.fillStyle=f.c;ctx.fillText(f.t,0,0);ctx.restore();}
 ctx.globalAlpha=1;
 if(grab){ctx.strokeStyle='#ffffffcc';ctx.lineWidth=2;ctx.setLineDash([5,5]);const p=Vector.add(grab.body.position,Vector.rotate(grab.c.pointB,grab.body.angle));ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(grab.target.x,grab.target.y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(grab.target.x,grab.target.y,5,0,7);ctx.fill();}
 if(swipe&&swipe.trail.length>1){ctx.strokeStyle='#ffffffd0';ctx.lineCap='round';for(let i=1;i<swipe.trail.length;i++){const a=swipe.trail[i-1],b=swipe.trail[i];ctx.lineWidth=2+i*.5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.lineCap='butt';}
 ctx.restore();
 if(screen==='sandbox'&&LW>WW+1)drawScrollBar();
 if(MODS.wind)drawWind();
 if(MODS.night)drawNight();
 if(screen==='play')RunHazards.drawWarn();
}
// гололёд: голубая корка по полу с бликами (кроме ям)
function drawIce(){
 const x0=camX-20,x1=camX+WW+20;
 ctx.save();ctx.beginPath();ctx.rect(x0,FLOOR-4,x1-x0,16);for(const [a,b] of PITS)ctx.rect(b,FLOOR-4,a-b,16);ctx.clip('evenodd');
 const g=ctx.createLinearGradient(0,FLOOR-4,0,FLOOR+12);g.addColorStop(0,'rgba(235,250,255,.95)');g.addColorStop(.4,'rgba(160,220,250,.85)');g.addColorStop(1,'rgba(120,190,235,0)');
 ctx.fillStyle=g;ctx.fillRect(x0,FLOOR-4,x1-x0,16);
 ctx.fillStyle='#ffffff';for(let x=Math.floor(x0/90)*90;x<x1;x+=90){const k=hash(x*.37);ctx.globalAlpha=.5+.5*Math.sin(frame*.05+k*9);ctx.fillRect(x+k*60,FLOOR-2,18+k*14,2);}
 ctx.restore();
}
// ветер: летящие штрихи и листья по направлению ветра (экранные координаты)
function drawWind(){
 const v=wind.v;if(Math.abs(v)<.05)return;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 // v=393: мало редких тонких струй с завитком на конце (классический мультяшный «ветер»), медленно и полупрозрачно
 const d=Math.sign(v),av=Math.abs(v);
 for(let i=0;i<8;i++){const sp=.9+hash(i+400)*1.1,span=WW+320,raw=hash(i+401)*span+frame*sp*v,w=wrap(raw,span),x=w-160,k=w/span,
  y=hash(i+402)*(FLOOR-90)+30+Math.sin(frame*.015+i)*8,L=(70+hash(i+403)*50)*av,fade=Math.sin(k*Math.PI);
  const path=()=>{ctx.beginPath();ctx.moveTo(x-L*d,y);ctx.bezierCurveTo(x-L*.6*d,y-4,x-L*.25*d,y+3,x,y);
   if(i%2===0){const r=6+hash(i+405)*3;ctx.arc(x,y-r,r,Math.PI/2,Math.PI/2-d*Math.PI*1.5,d>0);}};
  // мягкая голубоватая подложка + белая линия: читается и на светлом небе, и в теплице
  const al=(.45+.2*hash(i+404))*fade*av;path();ctx.globalAlpha=al*.35;ctx.strokeStyle='#5a86b0';ctx.lineWidth=4.5;ctx.stroke();
  ctx.globalAlpha=al;ctx.strokeStyle='#ffffff';ctx.lineWidth=2.2;ctx.stroke();}
 for(let i=0;i<3;i++){const x=wrap(hash(i+410)*WW+frame*1.6*v,WW+100)-50,y=hash(i+411)*(FLOOR-110)+40+Math.sin(frame*.03+i*2)*18;ctx.globalAlpha=.6*av;ctx.fillStyle=i%2?'#7cc04a':'#c9a23a';
  ctx.save();ctx.translate(x,y);ctx.rotate(frame*.03*v+i+Math.sin(frame*.03+i)*.5);ctx.beginPath();ctx.ellipse(0,0,5.5,2.8,0,0,7);ctx.fill();ctx.restore();}
 ctx.restore();
}
// ночь: тёмная пелена с «дырами» света — вокруг героя, луч фонарика по взгляду, вспышки, бомбы; глаза врагов светятся
let nightCv=null;
// глаза врагов светятся в темноте: на месте нарисованных глаз (та же система координат, что у лица), мягкий ореол
// и светящиеся «миндалины»; у злого врага верх глаза срезан наискосок, моргание — щёлочка. В круге света героя свечение гаснет
function drawNightEyes(e,hero){
 const head=e.parts.head,hp=head.position;let dark=1;
 if(hero&&!hero.removed){const q=hero.parts.torso.position;dark=clamp((Math.hypot(hp.x-q.x,hp.y-q.y)-140)/110,0,1);}
 if(dark<.03)return;
 const s=e.s*(e.fs||1),c=Math.cos(head.angle),sn=Math.sin(head.angle),fx=(e.facing||1)*.6,blink=e.blink<6,hurt=e.stun>0,angry=!!e.target&&!hurt;
 const ey=-2,hx=hp.x-camX;
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(const ex of [-5,5]){const lx=ex+fx,x=hx+(lx*c-ey*sn)*s,y=hp.y+(lx*sn+ey*c)*s,R=12*s*(blink?.6:1);
  const g=ctx.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,`rgba(255,236,140,${.7*dark})`);g.addColorStop(.4,`rgba(255,190,40,${.35*dark})`);g.addColorStop(1,'rgba(255,160,0,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,R,0,7);ctx.fill();}
 ctx.globalCompositeOperation='source-over';ctx.globalAlpha=dark;
 ctx.translate(hx,hp.y);ctx.rotate(head.angle);ctx.scale(s,s);
 for(const ex of [-5,5]){
  const cx=ex+fx,rx=3.6,ry=blink?.8:hurt?2.6:4.8,inner=ex<0?1:-1;
  ctx.save();
  if(angry&&!blink){ctx.beginPath();ctx.moveTo(cx-inner*(rx+1),ey-ry-1);ctx.lineTo(cx+inner*(rx+1),ey-ry*.5);ctx.lineTo(cx+inner*(rx+1),ey+ry+2);ctx.lineTo(cx-inner*(rx+1),ey+ry+2);ctx.closePath();ctx.clip();}
  const g=ctx.createRadialGradient(cx,ey+.5,0,cx,ey,rx*1.4);g.addColorStop(0,'#fffff2');g.addColorStop(.5,'#fff17a');g.addColorStop(1,'#ffb91c');
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(cx,ey,rx,ry,0,0,7);ctx.fill();
  ctx.restore();
 }
 ctx.restore();
}
// ночное небо: звёзды и луна рисуются на фоне, а во мгле над ними прорезаются окошки — они остаются яркими.
// Позиции привязаны к экрану (небо «далеко»), звёзды только в верхней части кадра, мерцают
const NightSky={stars:null,
 // небо видно только под открытым небом: в теплице, на кухне и на заводе остаётся одна мгла
 // нарисованные кодом звёзды и луна — только если нет ночного фона из ChatGPT (там свои)
 open(){if(Run.def?.climb?nightBg('bg_'+mapId+'_upper'):nightBg('bg_'+mapId))return false;return !!Run.def?.climb||['garden','market','moon'].includes(mapId);},
 init(){let a=7;const r=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};this.stars=Array.from({length:90},()=>({x:r(),y:Math.pow(r(),1.4)*.62,s:.6+r()*1.6,ph:r()*6.3,sp:.02+r()*.05}));},
 moon(){return {x:viewX+viewW*.82,y:viewY+Math.max(70,viewH*.16),r:Math.max(26,Math.min(44,viewH*.055))};},
 draw(){
  if(!this.stars)this.init();
  ctx.save();
  for(const st of this.stars){const x=viewX+st.x*viewW,y=viewY+st.y*viewH,a=.55+.45*Math.sin(frame*st.sp+st.ph);
   ctx.globalAlpha=a;ctx.fillStyle='#fffbe6';ctx.beginPath();ctx.arc(x,y,st.s,0,7);ctx.fill();
   if(st.s>1.7){ctx.globalAlpha=a*.5;ctx.fillRect(x-st.s*2.6,y-.5,st.s*5.2,1);ctx.fillRect(x-.5,y-st.s*2.6,1,st.s*5.2);}}
  ctx.globalAlpha=1;
  const m=this.moon(),g=ctx.createRadialGradient(m.x,m.y,m.r*.6,m.x,m.y,m.r*3);g.addColorStop(0,'rgba(255,246,200,.45)');g.addColorStop(1,'rgba(255,246,200,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(m.x,m.y,m.r*3,0,7);ctx.fill();
  const d=ctx.createRadialGradient(m.x-m.r*.3,m.y-m.r*.3,m.r*.2,m.x,m.y,m.r);d.addColorStop(0,'#fffdf0');d.addColorStop(1,'#f3dfa0');
  ctx.fillStyle=d;ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,7);ctx.fill();
  ctx.fillStyle='rgba(205,180,120,.45)';for(const [dx,dy,rr] of [[-.3,-.2,.18],[.25,.15,.24],[-.05,.42,.12],[.38,-.35,.1]]){ctx.beginPath();ctx.arc(m.x+dx*m.r,m.y+dy*m.r,rr*m.r,0,7);ctx.fill();}
  ctx.restore();
 },
 // окошки во мгле над звёздами и луной (координаты холста мглы: k — её масштаб)
 holes(c,k){
  if(!this.stars)this.init();
  c.fillStyle='rgba(0,0,0,.9)';
  for(const st of this.stars){c.beginPath();c.arc(st.x*viewW*k,st.y*viewH*k,Math.max(1.2,st.s*k*1.6),0,7);c.fill();}
  const m=this.moon(),x=(m.x-viewX)*k,y=(m.y-viewY)*k,r=m.r*k,g=c.createRadialGradient(x,y,r*.9,x,y,r*2.6);
  g.addColorStop(0,'rgba(0,0,0,.95)');g.addColorStop(.35,'rgba(0,0,0,.35)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r*2.6,0,7);c.fill();
 }
};
function drawNight(){
 const k=.5,W=Math.ceil(viewW*k),H=Math.ceil(viewH*k);
 if(!nightCv)nightCv=document.createElement('canvas');if(nightCv.width!==W||nightCv.height!==H){nightCv.width=W;nightCv.height=H;}
 const c=nightCv.getContext('2d');c.globalCompositeOperation='source-over';c.clearRect(0,0,W,H);
 // ночная мгла: сверху почти чёрно-синяя, к земле чуть светлее и с фиолетовым оттенком
 // с ночным фоном мгла слабее: ночь уже нарисована, мгла лишь прячет то, что вдали от героя
 const nb=Run.def?.climb?nightBg('bg_'+mapId+'_upper'):nightBg('bg_'+mapId),m=nb?1:1;  // v=396: ночь темнее (было .55): мгла как без ночного фона
 const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,`rgba(3,5,22,${.9*m})`);sky.addColorStop(.6,`rgba(8,10,38,${.82*m})`);sky.addColorStop(1,`rgba(18,12,46,${.74*m})`);c.fillStyle=sky;c.fillRect(0,0,W,H);
 c.globalCompositeOperation='destination-out';
 if(NightSky.open())NightSky.holes(c,k);
 const hole=(x,y,r,a)=>{x=(x-camX-viewX)*k;y=(y-viewY)*k;r*=k;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(0,0,0,${a})`);g.addColorStop(.6,`rgba(0,0,0,${a*.7})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();};
 const h=Run.hero;
 // свет героя (v=396): яркий круг вокруг и «обзор» — пятно света впереди по взгляду
 if(h&&!h.removed){const p=h.parts.torso.position,d=h.facing||1;hole(p.x,p.y-10,190,.85);hole(p.x+d*180,p.y-20,160,.45);}
 if(Run.guard&&!Run.guard.removed){const p=Run.guard.parts.torso.position;hole(p.x,p.y-20,150,.85);}
 for(const f of flashes)hole(f.x,f.y,f.r*1.6,1);
 Fire.lightHoles(hole);
 // волна Озверина светится в темноте
 {const c=typeof RunHazards!=='undefined'&&RunHazards.chase;if(c){hole(c.x-40,FLOOR-110,230,.75);hole(c.x-160,FLOOR-60,200,.55);}}
 for(const e of entities){if(e.type==='bomb'||e.type==='mine'){const b=e.bodies[0];hole(b.position.x,b.position.y,46,.8);}
  if(e.type==='npc'&&!e.dead&&e!==h&&e.team===0)hole(e.parts.torso.position.x,e.parts.torso.position.y,90,.7);}
 for(const p of pickups)if(onScreen(p.x,40)&&(p.t==='coin'||p.t==='cp'))hole(p.x,p.t==='cp'?FLOOR-70:p.y,p.t==='cp'?95:28,.55);
 if(Mode.flag)hole(Mode.flag.x,(Mode.flag.y??FLOOR)-60,120,.8);
 ctx.save();viewTransform();ctx.drawImage(nightCv,viewX,viewY,viewW,viewH);
 // тёплый ореол вокруг героя — его видно сразу, даже в самой тёмной главе
 if(h&&!h.removed){const p=h.parts.torso.position,x=p.x-camX,y=p.y-10,g=ctx.createRadialGradient(x,y,10,x,y,130);g.addColorStop(0,'rgba(255,226,150,.12)');g.addColorStop(.5,'rgba(255,200,110,.05)');g.addColorStop(1,'rgba(255,190,90,0)');
  ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,130,0,7);ctx.fill();ctx.globalCompositeOperation='source-over';}
 // глаза врагов в темноте
 for(const e of entities)if(e.type==='npc'&&!e.dead&&e.team===1&&onScreen(e.parts.head.position.x,0))drawNightEyes(e,h);
 ctx.restore();
}
// пленник, которого защищаем: связан (верёвки рисует drawBonds), здесь только надпись
function drawGuardCage(){
 const g=Run.guard;if(!g||g.removed||!g.pin)return;
 const x=g.pin.x,y=FLOOR,h=g.cageH;
 ctx.save();
 // надпись: «защищай!»; мигает красным, когда пленнику плохо
 const f=Math.max(0,g.hp/g.hpMax),pulse=f<.35&&frame%30<15;
 ctx.font='900 16px Nunito,system-ui,sans-serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#3a2518';const s=t('Защищай!'),tw=ctx.measureText(s).width,tx=x+13;
 if(frame%140<90||pulse){if(SPR.icon_shield)ctx.drawImage(SPR.icon_shield,tx-tw/2-28,y-h-65,24,24);ctx.strokeText(s,tx,y-h-46);ctx.fillStyle=pulse?'#ff7a5a':'#fff';ctx.fillText(s,tx,y-h-46);}
 ctx.restore();
}
let swipe=null,drive=null,jumpQ=0;
let acc=0,last=performance.now();
function resetClock(){last=performance.now();acc=0;}
function loop(t){
 UpgradeCoach.tick();
 GameStats.frame(t);
 const dt=Math.min(100,t-last);last=t;StoryDialogue.tick(dt);
 if(!paused){acc+=dt;let n=0;while(acc>=1000/60&&n<3){if(hitStop>0)hitStop--;else step();acc-=1000/60;n++;}if(n===3)acc=0;}
 // на паузе мир не меняется: кадр перерисовываем 4 раза в секунду (окна, поворот), а под рекламой и в свёрнутой вкладке — ни разу.
 // В песочнице на паузе игрок продолжает ставить и таскать предметы — там рисуем как обычно
 // на паузе игра замирает полностью: последний кадр рисуется один раз (renderDirty — при входе в паузу и смене размера окна),
 // облака, птицы и бабочки тоже стоят. Исключение — пауза игрока в песочнице: там можно ставить и таскать предметы
 if(!paused||screen==='sandbox'&&pauseReasons.size===1&&pauseReasons.has('user')||renderDirty){renderDirty=false;lastRender=t;render();}
 requestAnimationFrame(loop);
}
