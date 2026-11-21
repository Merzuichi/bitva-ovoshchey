'use strict';
// Crate contents share the world's pickup list and active-game frame clock.
const CRATE_LOOT={
 coin:{icon:'icon_coin',color:'#ffcf3a'},
 health:{icon:'icon_upg_hp',color:'#ff7a8b'},
 speed:{icon:'icon_upg_speed',color:'#ffb64a'},
 shield:{icon:'icon_shield',color:'#70cfff'},
 weapon:{icon:null,color:'#c58cff'}  // v497: случайное оружие на ограниченное число ударов/выстрелов
};
// сколько ударов или выстрелов даёт оружие из ящика (считаются и удары/выстрелы в воздух)
function lootCharges(id){const w=WEAPONS[id];
 return w.type==='melee'?15:w.type==='gun'?Math.max(6,Math.round(w.mag*1.5)):w.type==='flame'?150:w.type==='projectile'?Math.max(6,(w.mag||1)*3):(w.mag||1)+2;}
function lootWeaponUse(ent){const L=ent.lootW;if(L&&ent.weapon===L.w&&L.left>0)L.left--;}
function lootWeaponEnd(h,silent){const L=h.lootW;if(!L)return;h.lootW=null;
 if(h.weapon===L.w){h.weapon=L.prev;h.ammoW=null;h.reload=0;h.atkCd=0;h.charge=0;h.swing=0;Run.gunUi=undefined;}
 if(!silent){const q=h.parts.head.position;floats.push({x:q.x,y:q.y-40,t:t('Оружие закончилось'),life:80,c:'#c58cff',big:1.2});Snd.pop&&Snd.pop();}
 updateHud&&updateHud();}
function updateLootWeapon(h){const L=h&&h.lootW;if(!L)return;
 if(h.weapon!==L.w){h.lootW=null;return;}  // сменили оружие в окне героя — временное пропадает
 if(L.left<=0&&!(h.swing>0)&&!h.throwMotion&&!h.bowDraw&&!(h.charge>0))lootWeaponEnd(h);}
const CrateTut={on:false,box:null,drop:null,stage:'break'};
function ensureCrateTutorialBox(){
 if(S.tut.crateLootV2||Run.type!=='run'||!Run.hero)return;
 const q=Run.hero.parts.torso.position;
 if(!entities.some(e=>e.item==='box'&&!e.removed&&Math.abs(e.bodies[0].position.x-q.x)<260)){
  const box=spawnItem('box',q.x+160,FLOOR-26);
  box.crateTutorial=true;
 }
}
function crateTutorialDrop(box,loot){
 FirstMinutes.crateDrop(box,loot);
 if(!loot||S.tut.crateLootV2||Tut.on||SbTut.on)return;
 const h=Mode.id==='level'?Run.hero:SbPlay.ent;
 if(!h||h.dead||h.removed)return;
 if(CrateTut.on&&CrateTut.box!==box)return;
 CrateTut.on=true;CrateTut.box=box;CrateTut.drop=loot;
 showCrateTutorial('pickup');
}
function resetCrateTutorial(){
 CrateTut.on=false;CrateTut.box=null;CrateTut.drop=null;
 const n=document.getElementById('tutor');
 if(n&&n.classList.contains('crate')){n.classList.remove('on','crate');n.innerHTML='';}
}
function finishCrateTutorial(skipped){
 if(!CrateTut.on)return;
 S.tut.crateLoot=1;S.tut.crateLootV2=1;save();
 GameStats.send(skipped?'tutorial_skipped':'tutorial_completed',{tutorial:'crate_loot'});
 resetCrateTutorial();
}
function showCrateTutorial(stage){
 CrateTut.stage=stage;
 const pc=matchMedia('(hover:hover) and (pointer:fine)').matches;
 const text=stage==='break'?(pc?'Разбей ящик: подойди и нажми мышку или F. Внутри монеты, здоровье или усиление!':'Разбей ящик: подойди и нажми кнопку атаки. Внутри монеты, здоровье или усиление!'):'Подойди к добыче, чтобы подобрать её. Сердце лечит, ботинок ускоряет, щит защищает.';
 const n=document.getElementById('tutor');
 n.classList.add('on','crate');
 n.innerHTML=`<div class="tt">${t(text)}</div><div class="td"><i class="${stage==='break'?'cur':'ok'}"></i><i class="${stage==='pickup'?'cur':''}"></i></div><button class="btn sm" id="crateSkip">${t('Пропустить')}</button>`;
 document.getElementById('crateSkip').onclick=()=>finishCrateTutorial(true);
 GameStats.send('tutorial_step',{tutorial:'crate_loot',step:stage});
}
function updateCrateTutorial(h){
 if(!h||h.dead||h.removed||Tut.on||SbTut.on||Intro.active){resetCrateTutorial();return;}
 if(S.tut.crateLootV2)return;
 if(CrateTut.on){
  if(CrateTut.drop&&(CrateTut.drop.taken||CrateTut.drop.age>1800))resetCrateTutorial();
  else if(CrateTut.box&&CrateTut.box.removed&&!CrateTut.drop)resetCrateTutorial();
  return;
 }
 const q=h.parts.torso.position;
 const box=entities.find(e=>{
  if(e.item!=='box'||e.removed)return false;
  const p=e.bodies[0].position,x=(p.x-camX-viewX)*scale,y=(p.y-viewY)*scale;
  return Math.abs(p.x-q.x)<220&&Math.abs(p.y-q.y)<160&&x>35&&x<innerWidth-35&&y>60&&y<innerHeight-20;
 });
 if(!box)return;
 CrateTut.on=true;CrateTut.box=box;showCrateTutorial('break');
}
// v528: сундук — крепкий ящик, из которого при разбивании вылетает целый веер монет
const Chests={
 COINS_MIN:20,COINS_MAX:50,fx:[],
 make(x,y){
  const e=spawnItem('box',x,y);if(!e)return null;
  e.chest=true;e.hp=e.hpMax=Math.round(ITEM_HP.box*1.6);
  const b=e.bodies[0];b.render.fillStyle='#d79a22';b.plugin.deco='chest';
  Body.setDensity(b,b.density*4);  // v533: тяжелее ящика — удары и пули не отбрасывают сундук далеко
  return e;
 },
 // v531: 20–50 монет по 1 — вылетают фонтаном в течение ~0,6 с, а не все разом
 burst(x,y){
  if(Mode.id!=='level')return;
  const n=ri(this.COINS_MIN,this.COINS_MAX),y0=Math.min(y,FLOOR-30);
  this.fx.push({x,y:y0,t:0,left:n,n});
  FX.sparkle(x,y0,110);FX.ring&&FX.ring(x,y0,110);FX.shock&&FX.shock(x,y0,120);Snd.reward();
  for(let i=0;i<18;i++)particles.push({x,y:y0-20,vx:rnd(-6,6),vy:rnd(-9,-2),life:rnd(20,40),c:pick(['#ffe066','#ffd23a','#fff6c8']),r:rnd(2,4),fire:true});
  GameStats.send('chest_opened',{coins:n});
 },
 emit(f){
  const k=Math.min(f.left,f.t<8?3:2);
  // монеты сундука не падают по физике: разлетаются веером, зависают и летят к герою (fly)
  for(let i=0;i<k;i++){const a=rnd(-2.6,-.55),v=rnd(6,11);pickups.push({t:'crateLoot',kind:'coin',w:null,fly:1,coinArt:1,x:f.x+rnd(-8,8),y:f.y-26,vx:Math.cos(a)*v,vy:Math.sin(a)*v,age:0,value:1,spin:rnd(0,6)});}
  f.left-=k;
 },
 // v528: первый удар по сундуку — иногда сверху падают враги-охранники (не на первых уровнях и не в головоломках)
 AMBUSH_FROM:3,AMBUSH_CHANCE:.45,
 hit(ent){
  ent.bodies[0].plugin.hitT=frame;
  if(ent.ambushRolled||Mode.id!=='level')return;ent.ambushRolled=true;
  if(Run.idx<this.AMBUSH_FROM||Run.type==='puzzle'||Run.def?.firstMinutes||Math.random()>this.AMBUSH_CHANCE)return;
  const p=ent.bodies[0].position,n=Run.idx>=8&&Math.random()<.5?2:1,bal=CombatBalance.forRun(Run.idx);
  for(let k=0;k<n;k++){
   const x=clamp(p.x+(k?-1:1)*rnd(90,160),60,LW-60);
   const e=spawnEnemy({k:pick(Run.def?.foes||['perets']),w:pick(Run.def?.weap||Run.def?.wpool||['fists','bat']),x:x/WW,y:420,hp:bal.hp,dm:bal.dm,sp:2.5,aggro:1400});
   e.facing=x<p.x?1:-1;FX.ring&&FX.ring(x,FLOOR-480,50);
  }
  GameStats.send('chest_ambush',{foes:n});
 },
 // второй уровень истории: сундук прямо на пути, чтобы показать механику; дальше — изредка в стопках ящиков
 place(def){
  if(Run.kind!=='story'||Run.idx!==1||!Run.hero)return;
  const x=Run.hero.parts.torso.position.x+260;this.make(x,FLOOR-30);
 },
 // v532: открытого сундука нет — он только разламывается; здесь лишь выпуск монет порциями
 drawFx(){
  if(!this.fx.length)return;
  if(screen!=='play'){this.fx.length=0;return;}
  for(const f of this.fx){f.t++;if(f.left>0&&f.t%2===0)this.emit(f);}
  this.fx=this.fx.filter(f=>f.left>0);
 },
 // стрелка над сундуком на первых уровнях (как у первого боя), только пока он цел
 draw(){
  this.drawFx();
  if(screen!=='play'||Run.state!=='play'||Run.idx>2)return;
  const c=entities.find(e=>e.chest&&!e.removed);if(!c)return;
  const p=c.bodies[0].position,left=camX+viewX+30,right=camX+viewX+viewW-30;if(p.x<left||p.x>right)return;
  ctx.save();ctx.translate(p.x,p.y-62+Math.sin(frame*.09)*4);
  ctx.fillStyle='#ffdc57';ctx.strokeStyle='#744218';ctx.lineWidth=3;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-7,-19);ctx.lineTo(7,-19);ctx.lineTo(7,-3);ctx.lineTo(15,-3);ctx.lineTo(0,14);ctx.lineTo(-15,-3);ctx.lineTo(-7,-3);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.restore();
 }
};
// v535: подобрал оружие — над головой героя на ~2 с всплывает пузырь с его иконкой
const WeaponBubble={
 cur:null,
 show(h,w){if(!h||!h.isPlayer||!w||w==='fists')return;this.cur={h,w,t:0};},
 draw(){
  const c=this.cur;if(!c)return;
  const h=c.h;if(screen!=='play'&&screen!=='sandbox'||!h||h.removed||h.dead||c.t>130){this.cur=null;return;}
  c.t++;const t=c.t,head=h.parts.head.position,r=h.parts.head.circleRadius||22;
  const pop=t<10?1.25*Math.sin(t/10*Math.PI/2)-(t>7?.25*(t-7)/3:0):1,a=t<100?1:Math.max(0,1-(t-100)/30);
  const x=head.x,y=head.y-r-72+Math.sin(t*.12)*3;  // выше полоски здоровья
  ctx.save();ctx.translate(x,y);ctx.scale(pop,pop);ctx.globalAlpha=a;
  const W=66,H=54;
  ctx.fillStyle='#fffaf0';ctx.strokeStyle='#5a3618';ctx.lineWidth=3;ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(-W/2+12,-H/2);ctx.lineTo(W/2-12,-H/2);ctx.quadraticCurveTo(W/2,-H/2,W/2,-H/2+12);ctx.lineTo(W/2,H/2-12);ctx.quadraticCurveTo(W/2,H/2,W/2-12,H/2);
  ctx.lineTo(8,H/2);ctx.lineTo(0,H/2+12);ctx.lineTo(-8,H/2);ctx.lineTo(-W/2+12,H/2);ctx.quadraticCurveTo(-W/2,H/2,-W/2,H/2-12);ctx.lineTo(-W/2,-H/2+12);ctx.quadraticCurveTo(-W/2,-H/2,-W/2+12,-H/2);ctx.closePath();
  ctx.fill();ctx.stroke();
  const im=SPR['icon_wpn_'+c.w]||SPR['wpn_'+c.w];
  if(im){const k=Math.min(44/im.width,40/im.height);ctx.drawImage(im,-im.width*k/2,-im.height*k/2,im.width*k,im.height*k);}
  ctx.restore();
 }
};
function dropCrateLoot(x,y,tutorial=false){
 if(Mode.id!=='level')return;  // v=396: в песочнице из ящиков ничего не выпадает
 if(!tutorial&&pickups.filter(p=>p.t==='crateLoot').length>=80)return;
 const roll=Math.random(),hw=Run.hero&&Run.hero.weapon,pool=Object.keys(WEAPONS).filter(id=>id!=='fists'&&id!==hw);
 let kind=tutorial||roll<.48?'coin':roll<.62?'health':roll<.70?'speed':roll<.78?'shield':'weapon';  // v528: оружие чаще (было 8%, стало 22%)
 if(kind==='weapon'&&(Run.def?.firstMinutes||!pool.length))kind='coin';
 const p={t:'crateLoot',kind,w:kind==='weapon'?pick(pool):null,x,y:Math.min(y,FLOOR-30),vx:rnd(-1.5,1.5),vy:-4,age:0,value:kind==='coin'?ri(Econ.CRATE[0],Econ.CRATE[1]):1};
 pickups.push(p);
 FX.sparkle(x,y,42);
 return p;
}
function collectCrateLoot(p,h){
 if(p.taken||p.t!=='crateLoot')return false;
 if(p.kind!=='coin'&&(!h||h.dead||h.removed))return false;
 if(p.kind==='health'&&h.hp>=h.hpMax&&!(Mode.id==='level'&&h.isPlayer&&tempHpRoom(h)))return false;  // v=431: при полном HP — временное здоровье
 p.taken=true;p.collected=true;
 let healed=0;
 if(p.kind==='coin'){
  Missions.record('loot_coins',p.value);
  if(Mode.id==='level')bagCoins(p.value);else addCoins(p.value);
  if(Mode.id==='level')Run.coinsGot+=p.value;
  Snd.coin();
 }else if(p.kind==='health'){
  healed=Math.min(25,h.hpMax-h.hp);
  h.hp+=healed;h.hpShow=90;FX.heal(p.x,p.y);Snd.reward();
  if(healed<25&&Mode.id==='level'&&h.isPlayer){const was=h.tempHp>0;const add=addTempHp(h,25-healed);healed+=add;if(add>0)h.tempN=(was?(h.tempN||1):0)+1;}  // остаток сверх полного — временное здоровье
 }else if(p.kind==='weapon'){
  if(!h.isPlayer||!WEAPONS[p.w]){p.taken=false;p.collected=false;return false;}
  const prev=h.lootW?h.lootW.prev:h.weapon,n=lootCharges(p.w);
  h.lootW={w:p.w,prev,left:n,total:n};h.weapon=p.w;WeaponBubble.show(h,p.w);h.ammoW=null;h.reload=0;h.atkCd=0;h.charge=0;h.swing=0;Run.gunUi=undefined;
  FX.ring(p.x,p.y,70);Snd.reward();weaponUnlockFx&&Snd.unlock&&Snd.unlock();updateHud&&updateHud();
 }else{
  const key=p.kind==='speed'?'lootSpeedUntil':'lootShieldUntil',duration=(p.kind==='speed'?20:15)*60;  // v=460: дольше (было 12 и 8 с)
  h[key+'N']=(h[key]>frame?(h[key+'N']||1):0)+1;  // v=473: сколько бонусов этого вида сложено — «×N» на плашке
  h[key]=Math.max(frame,h[key]||0)+duration;
  FX.ring(p.x,p.y,65);Snd.reward();
 }
 const text=p.kind==='weapon'?t(WEAPONS[p.w].n)+' ×'+h.lootW.total:p.kind==='coin'?'+'+p.value:p.kind==='health'?'+'+Math.ceil(healed)+' HP':t(p.kind==='speed'?'Ускорение · 20 с':'Щит · 15 с');
 floats.push({x:p.x,y:p.y-22,t:text,life:70,c:CRATE_LOOT[p.kind].color,big:1.4});
 for(let i=0;i<8;i++)FX.sparkle(p.x+rnd(-20,20),p.y+rnd(-20,20),18);
 FirstMinutes.collect(p);
 GameStats.send('loot_collected',{kind:p.kind,value:p.kind==='coin'?p.value:p.kind==='health'?Math.ceil(healed):1});
 if(CrateTut.on&&CrateTut.stage==='pickup')finishCrateTutorial(false);
 return true;
}
function updateCrateLoot(){
 const h=Mode.id==='level'&&Run.state==='play'?Run.hero:Mode.id==='sandbox'?SbPlay.ent:null;
 updateCrateTutorial(h);updateLootWeapon(h);
 for(const p of pickups){
  if(p.t!=='crateLoot'||p.taken)continue;
  if(++p.age>1800){p.taken=true;continue;}
  if(p.fly){
   // веер: тормозят в воздухе ~0,3 с, потом с ускорением летят к герою; без героя — просто тают
   p.x+=p.vx;p.y+=p.vy;p.spin+=.3;
   // v534: после веера монеты падают на землю и ждут игрока — собирать их нужно самому
   if(p.age<14){p.vx*=.9;p.vy=p.vy*.9+.1;continue;}
   p.fly=0;p.vx=p.vx*.6+rnd(-2.2,2.2);p.vy=Math.max(p.vy,0);continue;
  }
  const oldY=p.y;
  p.vy=Math.min(7,p.vy+.22);p.x+=p.vx;p.y+=p.vy;p.vx*=.96;
  let ground=inPit(p.x)?VH+200:FLOOR;
  for(const e of entities){
   if(e.type!=='static'||e.removed)continue;
   const b=e.bodies[0];
   if(b.plugin.deco==='platform'&&p.x>=b.bounds.min.x&&p.x<=b.bounds.max.x&&oldY+20<=b.bounds.min.y+3)ground=Math.min(ground,b.bounds.min.y);
  }
  if(p.vy>=0&&p.y+20>=ground&&oldY+20<=ground+8){p.y=ground-20;p.vy=0;}
  if(p.y>VH+150){p.taken=true;continue;}
  if(h&&!h.dead&&!h.removed&&p.age>12){
   const q=h.parts.torso.position;
   const feet=Math.max(q.y+70,...['llL','llR'].filter(n=>h.attached.has(n)).map(n=>h.parts[n].bounds.max.y));
   // v531: монеты сами притягиваются к герою (у разных героев разный рост — раньше приходилось подходить вплотную)
   if(p.kind==='coin'&&Mode.id==='level'){const mx=q.x,my=(q.y+feet)/2,d=Math.hypot(mx-p.x,my-p.y);if(d<75){p.x+=(mx-p.x)*.25;p.y+=(my-p.y)*.25;}}  // v534: лёгкое притяжение только вблизи
   if(Math.abs(q.x-p.x)<60&&p.y>q.y-h.parts.torso.plugin.h-40&&p.y<feet+40){const was=p.taken;collectCrateLoot(p,h);if(!was&&p.taken&&p.coinArt)coinPickupFx(p.x,p.y);}
  }
 }
 pickups=pickups.filter(p=>!p.taken);
}
function drawCrateLoot(p){
 // v532: монета из сундука — просто крутящаяся монетка, без пузыря и «+1» (их там десятки)
 if(p.coinArt){const im=SPR.icon_coin;if(!p.fly)p.spin+=.08;ctx.save();ctx.translate(p.x,p.y);ctx.scale(Math.max(.25,Math.abs(Math.cos(p.spin))),1);if(im)ctx.drawImage(im,-13,-13,26,26);else{ctx.fillStyle='#ffd23a';ctx.beginPath();ctx.arc(0,0,11,0,7);ctx.fill();}ctx.restore();return;}
 const spec=CRATE_LOOT[p.kind],y=p.y+Math.sin(frame*.07+p.x)*3;
 ctx.save();ctx.translate(p.x,y);
 ctx.globalAlpha=p.age>1680?Math.max(0,(1800-p.age)/120):1;
 const glow=ctx.createRadialGradient(0,0,8,0,0,34);
 glow.addColorStop(0,spec.color+'99');glow.addColorStop(1,spec.color+'00');
 ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#fff4d9';ctx.strokeStyle='#9b5927';ctx.lineWidth=3;
 ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.fill();ctx.stroke();
 const im=p.kind==='weapon'?SPR['icon_wpn_'+p.w]:SPR[spec.icon];if(im)ctx.drawImage(im,-17,-17,34,34);
 if(p.kind==='coin'){ctx.font='900 13px Nunito,system-ui';ctx.textAlign='center';ctx.strokeStyle='#fff4d9';ctx.lineWidth=4;ctx.strokeText('+'+p.value,0,35);ctx.fillStyle='#734015';ctx.fillText('+'+p.value,0,35);}
 ctx.restore();
}
function drawLootBuffs(){
 const h=Mode.id==='level'?Run.hero:Mode.id==='sandbox'?SbPlay.ent:null;
 if(!h||h.dead||h.removed){syncBuffs(null);return;}
 const q=h.parts.head.position;
 if(CrateTut.on){
  const p=CrateTut.drop||(!CrateTut.box.removed?CrateTut.box.bodies[0].position:null);
  if(p&&SPR.ovl_player_arrow)ctx.drawImage(SPR.ovl_player_arrow,p.x-15,p.y-65+Math.sin(frame*.12)*5,30,30);
 }
 syncBuffs(h);  // v=468: бонусы — слева под полосой здоровья (раньше значки висели над головой героя)
}

// v=468: панель бонусов под полосой здоровья: ускорение, щит, временное здоровье — значок и оставшиеся секунды
let buffKey='';
function syncBuffs(h){
 let el=document.getElementById('buffs');
 if(!el){el=document.createElement('div');el.id='buffs';document.body.appendChild(el);}
 const list=[];
 if(h){if(h.lootSpeedUntil>frame)list.push(['icon_upg_speed',Math.ceil((h.lootSpeedUntil-frame)/60),h.lootSpeedUntilN||1]);
  if(h.lootShieldUntil>frame)list.push(['icon_shield',Math.ceil((h.lootShieldUntil-frame)/60),h.lootShieldUntilN||1]);
  if(h.tempHp>0&&h.tempUntil>frame)list.push(['icon_upg_hp',Math.ceil((h.tempUntil-frame)/60),h.tempN||1]);
  if(h.lootW&&h.weapon===h.lootW.w)list.push([weaponIconSrc(h.lootW.w),h.lootW.left,1,1]);}
 const hp=document.querySelector('#hud .hp'),r0=hp&&hp.offsetWidth?hp.getBoundingClientRect():null;
 // v=474: ниже полосы здоровья и ниже патронов (блок патронов висит под полосой) — не перекрываем их
 const am=document.getElementById('ammo'),ar=am&&am.offsetWidth&&am.style.display!=='none'?am.getBoundingClientRect():null;
 const r=r0?{left:r0.left,bottom:Math.max(r0.bottom,ar?ar.bottom:0)}:null;
 const key=list.map(x=>x.join(':')).join(',')+'|'+(r?Math.round(r.bottom)+','+Math.round(r.left):'');
 if(key===buffKey)return;buffKey=key;
 const on=!!(list.length&&r&&screen==='play');el.style.display=on?'flex':'none';document.body.classList.toggle('has-buffs',on);
 if(r){el.style.top=Math.round(r.bottom+6)+'px';el.style.left=Math.round(r.left+4)+'px';}
 el.innerHTML=list.map(([ic,s,n,wp])=>`<div class="buff${wp?' wp':''}"><img src="${wp?ic:`assets/ui/${ic}.png?v=${ASSET_V}`}" alt=""><b>${wp?'×'+s:s+t('с')}</b>${n>1?`<i>×${n}</i>`:''}</div>`).join('');
}
