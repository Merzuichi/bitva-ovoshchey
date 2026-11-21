'use strict';
const Climb={
 background(){
  const im=nightBg('bg_'+mapId+'_upper')||SPR['bg_'+mapId+'_upper']||nightBg('bg_'+mapId)||SPR['bg_'+mapId];if(!im)return;
  ctx.fillStyle=mapId==='garden'?'#59cce8':mapId==='greenhouse'?'#afe5d8':'#acc9dc';ctx.fillRect(viewX,viewY,viewW,viewH);
  const k=Math.max(viewW/im.width,viewH/im.height)*1.08,w=im.width*k,h=im.height*k;
  const progress=clamp(-viewY/Math.max(1,FLOOR-(Run.climbGoal?.y||0)),0,1);
  ctx.drawImage(im,viewX+(viewW-w)/2,viewY+(viewH-h)*progress,w,h);
 },
 // восхождение (v=396): лестница платформ вправо и вверх; с пола до флага не добраться
 buildAscent(def,bonus){
  const n=def.climb.steps||10,R=mulberry(def.climb.seed||77),rr=(a,b)=>a+R()*(b-a);
  const nodes=[];let x=300,y=FLOOR-80;
  for(let i=0;i<n;i++){
   const dip=i%4===3;   // каждая 4-я ступень — чуть ниже, ближе и шире: передышка и разнообразие
   if(i>0){x+=dip?rr(175,195):rr(205,245);y-=dip?-rr(10,30):rr(68,92);}
   nodes.push({x,y,w:i===n-1?(def.climb.boss?420:250):Math.round(rr(150,200))+(dip?60:0)});
  }
  setLevelWidth(Math.max(WW,x+420));
  Run.climbNodes=[];
  nodes.forEach((q,i)=>{
   spawnItem('platform',q.x,q.y,{w:q.w});Run.climbNodes.push({x:q.x,y:q.y-9,w:q.w});
   if(i<n-1)pickups.push({t:'coin',x:q.x+(i%2?40:-30),y:q.y-55});
   if(i>1&&i%3===1&&i<n-1)spawnEnemy({k:pick(Run.kind==='arcade'?ARCADE_FOES:['perets','kukuruza']),w:pick(['fists','knife','bat']),x:(q.x+20)/WW,y:FLOOR-q.y+12,hp:CombatBalance.forRun(Run.idx).hp*.8,dm:CombatBalance.forRun(Run.idx).dm*.6,sp:1.8,aggro:420});
   // шипы на задней половине платформы: прыгай подальше вперёд
   if(def.climb.spikes&&i%4===2&&i<n-1)spawnItem('spikes',q.x-q.w/2+34,q.y-9-9,{w:56});
  });
  const goal=Run.climbNodes[n-1];
  Run.hero=spawnHero(140,bonus);Run.climbPeak=Run.hero.parts.torso.position.y;
  Run.climbMinY=goal.y-260;Run.climbGoal={x:goal.x,y:goal.y};LevelMode.flag={...Run.climbGoal};this.topBoss(def,goal);
 },
 // v509: на вершине высокой башни ждёт мини-босс; флажок засчитывается, только когда он побеждён
 topBoss(def,goal){Run.topBoss=null;if(!def.climb.boss)return;const c=CombatBalance.forRun(Run.idx);
  const e=spawnEnemy({k:pick(['kaktus','arbuz']),w:pick(['hammer','axe','bat']),x:(goal.x+40)/WW,y:FLOOR-goal.y+14,hp:c.hp*1.6,dm:c.dm*.7,sp:1.9,aggro:260,boss:true});
  e.facing=-1;Run.topBoss=e;},
 build(def,bonus){
  if(def.climb.ascent)return this.buildAscent(def,bonus);
  setLevelWidth(0);const n=def.climb.steps||10,spacing=104,amplitude=Math.min(170,WW*.17),pattern=[-.65,.2,1,.3,-.6,-1,-.15,.65];
  Run.climbNodes=[];
  for(let i=0;i<n;i++){
   const x=WW*.5+pattern[i%pattern.length]*amplitude,y=FLOOR-95-i*spacing;
   spawnItem('platform',x,y,{w:i===n-1?(def.climb.boss?400:230):205});Run.climbNodes.push({x,y:y-9});
   pickups.push({t:'coin',x,y:y-50});
   if(i>0&&i%3===0&&i<n-1)spawnEnemy({k:pick(Run.kind==='arcade'?ARCADE_FOES:['perets','kukuruza']),w:i%2?'knife':'bow',x:x/WW,y:FLOOR-y+12,hp:CombatBalance.forRun(Run.idx).hp*.8,dm:CombatBalance.forRun(Run.idx).dm*.6,sp:1.8,aggro:600});
   // шипы лежат на самой платформе у её внешнего края (раньше выносились за край и висели в воздухе)
   if(def.climb.spikes&&i%4===2)spawnItem('spikes',x+(x<WW/2?-1:1)*(205/2-38),y-9-9,{w:65});
  }
  const first=Run.climbNodes[0],goal=Run.climbNodes[n-1];
  Run.hero=spawnHero(first.x-45,bonus);Run.climbPeak=Run.hero.parts.torso.position.y;
  Run.climbMinY=goal.y-220;Run.climbGoal={x:goal.x,y:goal.y};LevelMode.flag={...Run.climbGoal};this.topBoss(def,goal);
  // обучение подъёму — один раз за игру (2026-11-09), дальше без подсказки
  if(!S.tut.climb&&def.climbTutor){S.tut.climb=1;save();showTip(t('Прыгай по платформам вверх к флажку. Стрелка покажет следующую платформу. Падение с большой высоты опасно!'));}
 },
 update(){
  const h=Run.hero;if(!h||h.dead||!Run.def.climb)return;
  const p=h.parts.torso.position,feet=Math.max(...['llL','llR'].filter(k=>h.attached.has(k)).map(k=>h.parts[k].bounds.max.y),p.y+35);
  Run.climbPeak=Math.min(Run.climbPeak??p.y,p.y);
  // v=396: мгновенная смерть от падения убрана — урон от падения растёт с высотой (fallDamage в modes.js)
  if(frame-h.grounded<4&&h.parts.torso.velocity.y>-.5)Run.climbPeak=p.y;
  const g=Run.climbGoal;
  if(g&&Math.abs(p.x-g.x)<110&&Math.abs(feet-g.y)<36&&frame-h.grounded<8){const b=Run.topBoss;if(b&&!b.dead&&!b.removed&&b.parts.torso.position.y<g.y+250){  /* страж упал с вершины — тоже побеждён */if(frame-(Run.bossTipAt||-999)>240){Run.bossTipAt=frame;showTip(t('Сначала победи стража вершины!'));}return;}endLevel(true);return;}
 },
 arrow(){
  // стрелка-подсказка — только на первом уровне с этой механикой (первый подъём, первое восхождение, первый подъём в аркаде)
  const h=Run.hero;if(!Run.def?.climb||!h||h.dead)return;
  // восхождение: дошёл по полу до угла (дальше пути нет) — над героем прыгает стрелка вверх
  if(Run.def.climb.ascent){const p=h.parts.torso.position,feet=Math.max(h.parts.llL.bounds.max.y,h.parts.llR.bounds.max.y);
   if(feet>FLOOR-14&&p.x>Math.min(LW-420,Run.climbNodes[2]?.x??LW)){const im=SPR.item_zone_arrow,b=Math.sin(frame*.15)*8,y=p.y-120+b;
    if(im){ctx.save();ctx.translate(p.x,y);ctx.rotate(Math.PI);ctx.drawImage(im,-22,-30,44,60);ctx.restore();}
    if(!Run.cornerTold){Run.cornerTold=true;toast('⬆ '+t('Забирайся наверх по платформам!'));}}
   return;}
  if(!Run.def.climbTutor)return;
  const feet=Math.max(...['llL','llR'].map(k=>h.parts[k].bounds.max.y)),hx=h.parts.torso.position.x;
  const node=(Run.def.climb.ascent?Run.climbNodes.find(p=>p.x>hx+50&&p.y<feet+60):Run.climbNodes.find(p=>p.y<feet-30))||Run.climbGoal;if(!node)return;
  const x=clamp(node.x,camX+viewX+30,camX+viewX+viewW-30),y=clamp(node.y-25,viewY+100,viewY+viewH-80)+Math.sin(frame*.1)*5;
  const im=SPR.item_zone_arrow;if(im)ctx.drawImage(im,x-17,y-45,34,45);
 }
};

// v=472: враги аркадных забегов — все персонажи
const ARCADE_FOES=['ogurets','pomidor','baklazhan','morkov','perets','kukuruza','kapusta'];
function arcadeRoute(n){
 if(n<1||n%5===4)return null;
 const base={i:n,n:t('Уровень {0}',n+1),map:arcadeMap(n),enemies:[],mods:[],tier:dangerTier(n)};
 // v509: условия в забегах — ночь, ветер, гололёд (у волны ветра не бывает)
 const runMods=chase=>n>=5&&Math.random()<.5?[pick(['night','ice',...(chase?[]:['wind'])].filter(m=>MODDEF[m]))]:[];
 // v=396: в аркаде те же механики, что в истории: подъём, восхождение вперёд-вверх, забег с ямами-кольями и маятником, погоня от волны
 // v507: высокие башни — каждый второй подъём (уровни 16, 28, 40…) и восхождение (9, 21, 33…) почти вдвое выше
 if(n%12===3&&n>=15)return {...base,n:t('Уровень {0}',n+1)+' · '+t('Высокая башня'),type:'arena',obj:'climb',climb:{steps:18+Math.min(8,Math.floor(n/6)),spikes:true,boss:true}};
 if(n%12===8)return {...base,n:t('Уровень {0}',n+1)+' · '+t('Высокая башня'),type:'arena',obj:'climb',climb:{ascent:true,steps:20+Math.min(8,Math.floor(n/6)),spikes:true,seed:600+n,boss:true}};
 if(n%6===3)return {...base,type:'arena',obj:'climb',climb:{steps:9+Math.min(5,Math.floor(n/6)),spikes:n>8}};
 if(n%6===2&&n>=8)return {...base,type:'arena',obj:'climb',climb:{ascent:true,steps:10+Math.min(6,Math.floor(n/6)),spikes:n>12,seed:600+n}};
  // v509: погоня чаще — ещё и на уровнях 12, 24, 36…
 if(n%12===11)return {...base,type:'run',seed:200+n,len:3400,lvl:Math.min(.6,.08+n*.018),chase:{speed:2.45+Math.min(.45,n*.01)},feat:{pit:2,stakes:1,spikes:1,pend:1,coins:4,fight:1,crates:1,steps:1},foes:ARCADE_FOES,weap:['fists','knife'],allies:[],mods:runMods(true)};
 if(n%12===7)return {...base,mods:runMods(true),type:'run',seed:200+n,len:3600,lvl:Math.min(.6,.08+n*.018),chase:{speed:2.4+Math.min(.5,n*.01)},feat:{pit:2,stakes:1,coins:4,fight:1,crates:1,steps:1},foes:ARCADE_FOES,weap:['fists','knife'],allies:[]};
 if(n%6===1)return {...base,type:'run',seed:200+n,len:3000,lvl:Math.min(.6,.08+n*.018),mods:runMods(false),feat:{spikeplat:2,spikes:2,pit:1,hang:2,steps:1,coins:2,fight:1,pend:1,...(n>4?{stakes:1}:{}),...(n>6?{mplat:1}:{}),...(n>4?{gate:1}:{}),...(n>6?{press:1}:{}),...(n>12?{lift:1}:{})},foes:ARCADE_FOES,weap:['fists','knife','spear'],ambush:[{at:.6,count:1}]};
 // v=471: в аркаде нет уровней, где нужно только освобождать связанных союзников (головоломка-спасение убрана — на её месте бой)
 return null;
}

for(const i of [4,12,20,28]){
 const c=STORY[i];Object.assign(c,{n:'Подъём к флажку',en:'Climb to the Checkpoint',type:'arena',obj:'climb',climb:{steps:9+Math.floor(i/8),spikes:i>8},enemies:[],allies:[],props:[],mods:(c.mods||[]).filter(m=>m==='night'),rain:0,waves:false,ambush:[]});
 // реплика-подсказка только перед первым подъёмом; подсказку показывает Climb.build один раз
 if(i===4)c.intro=[['ogurets','Флажок наверху! Прыгаю на соседние платформы и не тороплюсь на краю.','The checkpoint is at the top! I will jump to the next platform and take care at the edge.']];else delete c.intro;
 delete c.tip;
}
for(const i of [6,8,16,24,32]){
 const c=STORY[i];if(c.type!=='run')continue;
 c.feat.spikeplat=(c.feat.spikeplat||0)+2;c.feat.spikes=(c.feat.spikes||0)+1;c.feat.hang=(c.feat.hang||0)+2;
}
// New ranged weapons are shared by both sides; enemy rocket launchers are excluded.
STORY.forEach((c,i)=>{
 for(const e of [...(c.enemies||[]),...(c.items||[]).filter(x=>x.t==='enemy')]){
  if(e.w==='bazooka')e.w='bow';else if(i>=8&&['pistol','smg'].includes(e.w)&&i%3===1)e.w=['knife','spear','bow'][Math.floor(i/3)%3];
 }
 if(c.type==='run'&&i>=4)c.weap=[...new Set([...(c.weap||['fists']),'knife',...(i>8?['spear','bow']:[])])];
});
