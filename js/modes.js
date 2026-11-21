'use strict';
/* ============ режимы: песочница, история, аркада ============ */
// у каждого режима свой состав героев и своя прокачка
const ROSTER={
 story:{
  ogurets:{role:'Боец',desc:'Сбалансированный, начинает с палкой',hp:100,spd:3.1,dmg:1,weapon:'fists',lock:0},
  pomidor:{role:'Стрелок',desc:'Быстрый, начинает с пистолетом',hp:85,spd:3.4,dmg:1,weapon:'pistol',lock:1600},
  baklazhan:{role:'Танк',desc:'Много здоровья, мощные удары',hp:150,spd:2.5,dmg:1.2,weapon:'bat',lock:1000},
  morkov:{role:'Ниндзя',desc:'Очень быстрая, сильный урон',hp:75,spd:4.2,dmg:1.15,weapon:'sword',lock:'ad'},
 },
 arcade:{
  perets:{role:'Ловкач',desc:'Быстрый и вёрткий, начинает с палкой',hp:90,spd:3.6,dmg:1.05,weapon:'fists',lock:0},
  kukuruza:{role:'Стрелок',desc:'Дробовик в упор — страшная сила',hp:85,spd:3.2,dmg:1.05,weapon:'shotgun',lock:700},
  kapusta:{role:'Танк',desc:'Сто одёжек — огромный запас здоровья',hp:170,spd:2.4,dmg:1.1,weapon:'hammer',lock:1200},
  arbuz:{role:'Громила',desc:'Огромный и очень сильный',hp:140,spd:2.6,dmg:1.35,weapon:'axe',lock:'ad'},
 },
};
const MODE_NAME={story:'История',arcade:'Аркада'};
const UPG=[['hp',`<img class="ico" src="assets/ui/icon_upg_hp.png?v=${ASSET_V}" alt="">`,'Здоровье'],['dmg',`<img class="ico" src="assets/ui/icon_upg_dmg.png?v=${ASSET_V}" alt="">`,'Урон'],['spd',`<img class="ico" src="assets/ui/icon_upg_speed.png?v=${ASSET_V}" alt="">`,'Скорость']];
const UPG_MAX={story:10,arcade:15};
const UPG_STEP={story:{hp:.1,dmg:.1,spd:.04},arcade:{hp:.08,dmg:.08,spd:.03}};
// один уровень героя: «Улучшить» поднимает здоровье, урон и скорость сразу
const lvCost=(l,mode)=>mode==='arcade'?Math.round(110*Math.pow(1.28,l)):Math.round(150*Math.pow(1.35,l));
const heroStore=mode=>mode==='arcade'?S.aheroes:S.heroes;
const heroOwned=(mode,id)=>S.all||S.dev||!!(heroStore(mode)[id]&&heroStore(mode)[id].own);
function heroData(mode,id){const st=heroStore(mode);if(!st[id])st[id]={own:false,lv:0,weapon:ROSTER[mode][id].weapon};const u=st[id];
 // старые сохранения: три отдельные прокачки → один уровень (среднее, с округлением вверх)
 if(u.lv===undefined)u.lv=Math.min(UPG_MAX[mode],Math.ceil(((u.hp||0)+(u.dmg||0)+(u.spd||0))/3));return u;}
function heroStats(mode,id){
 const h=ROSTER[mode][id],u=heroData(mode,id),k=UPG_STEP[mode];
 const hp=Math.round(h.hp*(1+k.hp*u.lv));
 return{size:HeroEvolution.size(u.lv,UPG_MAX[mode]),hp,hpMul:hp/(100*NPC[id].s),dmgMul:+(h.dmg*(1+k.dmg*u.lv)).toFixed(2),speed:+(h.spd*(1+k.spd*u.lv)).toFixed(2)};
}
// подсказки в начале глав
const TIPS={
 tip_controls:matchMedia('(hover:hover) and (pointer:fine)').matches?'← → — ходьба · пробел — прыжок · F или мышка — удар':'Джойстик — ходьба · ↑ — прыжок · » — рывок · кнопка справа — удар',
 tip_tackle:'Разбегись, зажми атаку и прыгни — таран во врага! 💢',
 tip_cut:'Проведи пальцем по верёвке, чтобы перерезать её ✂',
 tip_heavy:'Зажми атаку подольше — сильный удар с замахом 💥',
 tip_order:'Важен порядок: сначала враг, потом пленник',
 tip_boss:'Пока босс замахивается — отойди, потом бей',
 tip_defend:'Враги идут к пленнику, а не к тебе — не подпускай их! 🛡',
 tip_hang:'Видишь груз над врагом? Перережь верёвку пальцем или мечом!',
 tip_swing:'Перережь одну верёвку, потом вторую — в нужный момент',
 tip_bomb:'Бомба взрывается от удара — раскачай её в сторону врагов',
 tip_tramp:'Отпусти пленника над батутом — он подбросит его вверх',
 tip_factory:'Не падай в чаны с зельем, а под прессами беги, когда они подняты',
 tip_moon:'На Луне слабая гравитация — прыжки длиннее',
};

const DANGER=[['Разминка','#5fdc4a'],['Опасно','#ffcc33'],['Очень опасно','#ff8a33'],['Безумие','#ff4545']];
const CombatBalance={
 recommended(n,mode){return Math.min(UPG_MAX[mode],Math.floor(n/(mode==='arcade'?2.5:4)));},
 sample(rows,n){
  n=Math.max(0,n);for(let i=1;i<rows.length;i++)if(n<=rows[i][0]){const a=rows[i-1],b=rows[i],k=(n-a[0])/(b[0]-a[0]);return {hp:a[1]+(b[1]-a[1])*k,dm:a[2]+(b[2]-a[2])*k};}
  const a=rows.at(-1);return {hp:a[1]+(n-a[0])*.045,dm:a[2]+(n-a[0])*.025};
 },
 story(n){return this.sample([[0,.45,.3],[3,.65,.46],[7,.86,.62],[15,1.35,.95],[23,1.85,1.28],[31,2.35,1.62],[39,2.85,1.95]],n);},
 arcade(n){return this.sample([[0,.48,.32],[3,.72,.5],[7,1.05,.75],[14,1.55,1.1],[24,2.35,1.65],[40,3.4,2.3]],n);},
 forRun(n){return Run.kind==='arcade'?this.arcade(n):this.story(n);},
 storyArena(e,n){const p=this.story(n);return {...e,hp:(e.hp||1)*(e.boss?.82+n*.014:p.hp),dm:(e.dm||1)*(e.boss?.65+n*.028:p.dm)};}
};
const dangerTier=n=>n<5?0:n<12?1:n<20?2:3;
 // v509: локации аркады чаще меняются — следующий уровень не на той же карте, что предыдущий
function arcadeMap(n){if(n<2)return 'garden';const all=['garden','greenhouse','market','kitchen','moon','factory'].filter(m=>m!==Run.lastArcadeMap);const m=pick(all);Run.lastArcadeMap=m;return m;}
function genArcade(n){
 const route=arcadeRoute(n);if(route)return route;
 const tier=dangerTier(n),boss=n%5===4;
 const defend=!boss&&n>=2&&n%5===2;
 const def={type:'arena',n:t('Уровень {0}',n+1),obj:boss?'boss':defend?'defend':'kill',map:arcadeMap(n),plats:[],hazards:[],enemies:[]};
 const np=ri(1,2+tier);
 // высота прыжка ~155: платформа достаётся с земли (до 145) или с соседней платформы (на 75–95 выше)
 // платформы не пересекаются: при наложении место выбирается заново, запас 40 по горизонтали
 const free=p=>def.plats.every(q=>Math.abs(p.x-q.x)*WW>(p.w+q.w)/2+40||Math.abs(p.y-q.y)>=70);
 for(let i=0;i<np;i++)for(let tr=0;tr<14;tr++){const prev=def.plats[def.plats.length-1],w=ri(140,240),p=prev&&prev.y<170&&Math.random()<.5?{x:clamp(prev.x+rnd(-.16,.16),.25,.88),y:prev.y+ri(75,95),w}:{x:rnd(.28,.85),y:ri(105,145),w};
  if(free(p)){if(Math.random()<.3)p.item=pick(['box','barrel']);def.plats.push(p);break;}}
 for(let i=0;i<ri(0,tier);i++)def.hazards.push({t:'saw',x:rnd(.35,.9),y:ri(25,50)});
 if(tier>=1)for(let i=0;i<ri(0,tier);i++)def.hazards.push({t:'spikes',x:rnd(.3,.9),w:ri(90,160)});
 if(tier>=2)for(let i=0;i<ri(0,tier);i++)def.hazards.push({t:'mine',x:rnd(.3,.95)});
 // v498: шипы, мины и пилы не появляются там, где стоят герой и охраняемый союзник: переносим или убираем
 {const safe=defend?[.36,.5]:n>=6&&n%5===1?[.42,.5,.58]:n>=5&&(n%5===0||n%5===3)?[.1,.18,.25]:[.1],gap=h=>(h.t==='spikes'?(h.w||120)/2:20)+90;
  def.hazards=def.hazards.filter(h=>{for(let tr=0;tr<20;tr++){if(safe.every(z=>Math.abs(h.x-z)*WW>gap(h)))return true;h.x=rnd(.3,.95);}return false;});}
 if(tier>=2)def.rain=Math.max(45,140-n*3);
 const pool=['fists','bat','sword'];
 if(n>=3)pool.push('pistol');if(n>=6)pool.push('axe','grenade');if(n>=9)pool.push('smg','hammer');if(n>=14)pool.push('shotgun');if(n>=2)pool.push('knife');if(n>=4)pool.push('spear');if(n>=6)pool.push('bow');
 // v=472: в аркаде врагами бывают все: и наши (огурец, помидор, баклажан, морковка), и одичавшие; арбуз — с 8-го уровня
 const kinds=['pomidor','morkov','baklazhan','ogurets','perets','kukuruza','kapusta'];if(n>=8)kinds.push('arbuz');
 const curve=CombatBalance.arcade(n),hpM=curve.hp,dm=curve.dm,sp=2.2+Math.min(1.2,n*.035);
 const cnt=boss?Math.min(3,tier):clamp(1+Math.floor(n/2),1,6);
 for(let i=0;i<cnt;i++){
  const onPlat=Math.random()<.35&&def.plats.length?pick(def.plats):null;
  def.enemies.push({k:pick(kinds),w:pick(pool),x:onPlat?onPlat.x:rnd(.45,.95),y:onPlat?onPlat.y+20:0,hp:hpM,dm,sp});
 }
 if(boss)def.enemies.push({k:pick(['kaktus','arbuz']),w:pick(['axe','hammer','shotgun']),x:.85,boss:true,hp:1.8+n*.075,dm:dm*1.15,sp:2.3});
 // v502: обычные арены с 6-го уровня (6, 11, 19, 24, 26…, где номер даёт 0 или 3 по модулю 5) — бой вместе с союзниками; врагов на столько же больше
 if(!boss&&!defend&&n>=5&&(n%5===0||n%5===3)){const our=['ogurets','pomidor','morkov','baklazhan'].filter(k=>k!==Run.heroId),na=n>=13?2:1;
  def.allies=[];for(let i=0;i<na;i++){const k=our.splice(ri(0,our.length-1),1)[0];def.allies.push({k,w:pick(pool.filter(w=>w!=='fists'))||'bat',x:.18+i*.07,hp:hpM*1.3});}
  for(let i=0;i<na;i++)def.enemies.push({k:pick(kinds),w:pick(pool),x:rnd(.6,.95),y:0,hp:hpM,dm,sp});}
 // v503: выживание под бомбами (7, 12, 17… если не забег/подъём): продержаться до конца таймера, враги волнами с двух сторон
 if(!boss&&!defend&&n>=6&&n%5===1){Object.assign(def,{obj:'survive',time:28+Math.min(17,n),waves:true,waveEvery:300,waveSize:2,waveLimit:n>=21?4:3,
  rain:Math.max(120,180-n*2),foes:kinds,wpool:pool,whp:hpM*.85,wdm:dm*.55,wsp:sp,allies:[]});def.enemies=def.enemies.slice(0,2).map(e=>Object.assign(e,{x:pick([.04,.96]),y:0}));}
 if(defend){def.time=30+Math.min(20,n);def.guard=pick(['ogurets','pomidor','morkov','baklazhan']);def.foes=kinds;def.wpool=pool;def.enemies=def.enemies.slice(0,2).map(e=>Object.assign(e,{x:pick([.04,.96]),y:0}));}
 // модификатор: с 4-го уровня — иногда один, с 12-го — бывает два
 if(n>=3&&Math.random()<.5){const ms=Object.keys(MODDEF);def.mods=[pick(ms)];if(n>=11&&Math.random()<.35)def.mods.push(pick(ms.filter(m=>m!==def.mods[0])));}
 def.tier=tier;
 return def;
}

let Mode={id:'none'};
const SandboxMode={id:'sandbox',fight:false,fightOn(){return this.fight;},showBars(){return true;},onDeath(ent,src){SbM.onKill(ent,src);},
 // инерция после броска камеры; несём предмет к краю экрана — камера едет следом
 update(){
  sbTutTick();sbPlayUpdate();sbFightCheck();sbOfferTick();if(frame%15===0)sbCountUpdate();
  if(pan&&!pan.down&&Math.abs(pan.v)>.2){panCam(pan.v);pan.v*=.92;}
  if(grab&&grab.sx!=null){const e=60/scale,x=grab.sx/scale;const d=x<e?-(e-x):x>WW-e?x-(WW-e):0;if(d){const was=camX;panCam(d*.25);grab.target.x+=camX-was;}}
 }};
const AttractMode={id:'attract',t:0,fightOn:()=>true,showBars:()=>true,
 update(){const alive=[0,1].map(tm=>entities.some(e=>e.type==='npc'&&e.team===tm&&!e.dead));if(!alive[0]||!alive[1]){if(++this.t>150){this.t=0;attractScene();}}},onDeath(){}};
function attractScene(){
 clearWorld();setLevelWidth(0);mapId='garden';
 const ks=['ogurets','pomidor','baklazhan','morkov','perets','kukuruza','kapusta'],ws=['sword','bat','axe','pistol','smg','hammer','shotgun'];
 spawnRagdoll(pick(ks),WW*.25,FLOOR-70,{team:0,ai:true,weapon:pick(ws)});
 spawnRagdoll(pick(ks),WW*.75,FLOOR-70,{team:1,ai:true,weapon:pick(ws)});
 if(Math.random()<.5)spawnRagdoll(pick(ks),WW*.85,FLOOR-70,{team:1,ai:true,weapon:pick(ws),hpMul:.6});
 spawnItem('box',WW*.5,FLOOR-30);
}

/* ============ уровень (история и аркада) ============ */
// type: arena — один экран; run — длинный уровень с камерой; puzzle — головоломка с верёвками
const Run={kind:null,idx:0,def:null,type:'arena',hero:null,heroId:'ogurets',state:'idle',endAt:0,timer:0,reviveUsed:false,heroHp:1,coinsRun:0,waveT:0,won:false,
 cuts:0,cp:0,deaths:0,coinsGot:0,bag:0,freed:0,cagesTotal:0,hostages:[],zone:null,zoneT:0,stillT:0,safeX:150,flagWarn:0,loseWhy:''};
const canRestartLevel=()=>!(Run.type==='run'&&Run.cp>0&&!Run.captiveLost&&(Run.cpUsed||0)<CP_FREE);  // точки кончились — «Заново» снова есть
const keys={left:false,right:false,jump:false,dash:false,attack:false};
function queueAttackPress(){const h=screen==='sandbox'?SbPlay.ent:Run.hero;if(h&&!h.dead&&h.weapon==='grenade')h.throwQueued=true;if(h&&!h.dead)h.atkQueued=frame;}  // v=482: буфер нажатия для ближнего боя
function queueDash(){
 const h=screen==='sandbox'?SbPlay.ent:Run.hero;
 if(h&&!h.dead&&!h.removed)h.dashBuf=8;
}
function queueJump(){
 const h=screen==='sandbox'?SbPlay.ent:Run.hero;
 if(h&&!h.dead&&!h.removed)h.jumpBuf=12;
}
// v=431: временное здоровье сверх полного — бонус здоровья при полном HP. До +50% базы, держится 20 с, урон снимает его первым
const CP_FREE=3;  // v=461: с контрольной точки бесплатно 3 раза за уровень, потом кнопка пропадает (воскрешение — 2 раза, REVIVES_PER_LEVEL)
const TEMP_HP_T=35*60,TEMP_HP_MAX=.5;  // v=460: 35 с (было 20)
const tempHpRoom=h=>!!h&&(h.hpMax-(h.tempHp||0))*TEMP_HP_MAX-(h.tempHp||0)>.5;
function addTempHp(h,v){const base=h.hpMax-(h.tempHp||0),add=Math.min(v,base*TEMP_HP_MAX-(h.tempHp||0));if(add<=0)return 0;
 h.tempHp=(h.tempHp||0)+add;h.hpMax+=add;h.hp+=add;h.tempUntil=frame+TEMP_HP_T;h.hpShow=90;updateHud();return add;}
function tempHpTick(h){if(!h||!h.tempHp)return;const base=h.hpMax-h.tempHp,left=frame>=h.tempUntil||h.dead?0:clamp(h.hp-base,0,h.tempHp);
 if(left!==h.tempHp){h.hpMax=base+left;h.tempHp=left;if(h.hp>h.hpMax)h.hp=h.hpMax;updateHud();}}
// v=452: восхождения — враг сорвался намного ниже героя и сам наверх не заберётся: возвращаем его на платформу рядом с героем (не вплотную)
function climbRescueFoes(){
 if(!Run.def?.climb||frame%30||!Run.hero||Run.hero.dead||!Run.climbNodes?.length)return;
 const hp=Run.hero.parts.torso.position;
 for(const e of entities){
  if(e.type!=='npc'||e.team!==1||e.dead||e.removed||e.hung||e.caged)continue;
  const p=e.parts.torso.position;if(p.y<hp.y+420)continue;
  const near=Run.climbNodes.filter(n=>n.y<hp.y+80&&n.y>hp.y-300&&Math.abs(n.x-hp.x)>140);
  const n=near.length?pick(near):Run.climbNodes.slice().sort((a,b)=>Math.abs(a.y-hp.y)-Math.abs(b.y-hp.y))[0];if(!n)continue;
  const dx=n.x-p.x,dy=n.y-70-p.y;
  for(const b of e.bodies){Body.translate(b,{x:dx,y:dy});Body.setVelocity(b,{x:0,y:0});Body.setAngularVelocity(b,0);}
  e.standY=null;e.stun=Math.max(e.stun||0,25);FX.puff&&FX.puff(n.x,n.y-40);
 }
}
const LevelMode={id:'level',flag:null,fightOn:()=>true,showBars:()=>true,update(){runUpdate();tempHpTick(Run.hero);climbRescueFoes();},
 onDeath(ent,src){Memes.onKill(ent,src);if(ent.isPlayer)Memes.onHeroDown(ent);if(ent.team===1&&Tut.on)tutFinish(false);/* v=396: убил врага во время обучения — обучение закончено */if(ent.team===1){Run.goalKills=(Run.goalKills||0)+1;Missions.record('defeat');const q=ent.parts.torso.position;killSlow(q.x,q.y);}if(ent.team===1&&Run.kind==='arcade'){Run.coinsRun+=Econ.ARCADE_KILL;addCoins(Econ.ARCADE_KILL);}},
 onCut(){Run.cuts++;},
 // в головоломках враги хрупче, а пленники крепче — чтобы решала голова, а не случай
 dmgTo(ent,kind){return Run.type==='puzzle'?(ent.team===1?2.5:ent.team===0?(kind==='hit'?3:.35):1):1;},
 ropeHint(){return Run.state==='play'&&(Run.type==='run'||Run.cuts===0);}};

function startStory(idx,heroId){
 if(Run.trial&&(Run.trial.kind!=='story'||Run.trial.idx!==idx))Run.trial=null;  // v496: пробное оружие только на свой уровень
 Run.kind='story';Run.idx=idx;Run.heroId=heroId;Run.reviveUsed=false;Run.heroHp=1;
 const c=STORY[idx];
 closeModal();resetGameInput();pauseAll(false,'storyIntro');buildLevel(c);render();
 if(c.intro)showDialog(c.intro,null,actName(ACTS[c.act])+' · '+t('Глава {0}',idx+1)+': '+chName(c));
}
// подбор монеты на уровне: монета подпрыгивает и крутясь тает, вокруг искры и кольцо, сверху крупное «+1»
function coinPickupFx(x,y){
 const im=SPR.icon_coin;if(im)particles.push({x,y,vx:rnd(-.8,.8),vy:-7.5,life:26,c:'#ffd23a',r:0,gib:{im,w:34,h:34},ang:0,vr:.55});
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2+rnd(-.2,.2),v=rnd(2.5,5.5);particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,life:rnd(16,28),c:Math.random()<.5?'#ffd23a':'#fff6c8',r:rnd(2,4),fire:true});}
 FX.ring(x,y,38);FX.sparkle(x,y,40);FX.sparkle(x+rnd(-18,18),y+rnd(-18,10),24);FX.sparkle(x+rnd(-18,18),y+rnd(-18,10),20);
 floats.push({x,y:y-26,t:'+1',life:48,c:'#ffd23a',big:2.4,pop:1});
}
function startArcade(heroId){Run.trial=null;Run.activeBoost=null;Run.boostOffer=null;Run.kind='arcade';Run.idx=0;Run.heroId=heroId;Run.reviveUsed=false;Run.heroHp=1;Run.coinsRun=0;Run.doubled=false;Run.recorded=false;const def=genArcade(0);
 if(!tutDone())def.enemies.forEach(e=>{e.y=0;e.x=.6;});  // на обучении враг стоит на земле, до него легко дойти
 buildLevel(def);
 if(Tut.on)showDialog([
  [heroId,'Новая арена! Сначала освоим движение — противник пока подождёт.','A new arena! Let us learn to move first — the opponent can wait.'],
  [heroId,'Прыжок и рывок помогут обходить препятствия и уходить от ударов.','Jump and dash to cross obstacles and dodge attacks.'],
  [heroId,'Разбивай ящики, собирай награды и попробуй сильный удар!','Break crates, collect rewards, and try a charged attack!']
 ]);
}
// записываем забег в личную таблицу рекордов, когда он действительно закончен
function recordRun(){
 if(Run.kind!=='arcade'||Run.recorded)return -1;Run.recorded=true;
 const r={lvl:Run.idx,hero:Run.heroId,coins:Run.coinsRun,date:today()};
 const runs=(S.arcade.runs||[]).concat([r]).sort((a,b)=>b.lvl-a.lvl||b.coins-a.coins).slice(0,10);
 S.arcade.runs=runs;save();
 const place=runs.indexOf(r);
 GameStats.send('arcade_run_ended',{levels_cleared:Run.idx,coins_earned:Run.coinsRun,best:S.arcadeBest,personal_place:place+1,hero:Run.heroId,doubled:!!Run.doubled,revived:!!Run.reviveUsed});
 if(place===0&&r.lvl>0)toast(t('🏆 Новый личный рекорд!'));else if(place>0)toast(t('🏅 {0}-е место в твоих рекордах',place+1));
 return place;
}
// A rewarded health boost belongs only to its selected level.
const boostActive=()=>!!(Run.hero&&Run.hero.hpAdBonus);
// v=396: временный буст за рекламу — случайный: здоровье, урон или скорость; действует на весь уровень (и после возрождений)
const BOOSTS={hp:{ic:'upg_hp',txt:'+50 HP'},dmg:{ic:'upg_dmg',txt:'+25% урона'},spd:{ic:'upg_speed',txt:'+15% скорости'},};
const BOOST_DMG=1.25,BOOST_SPD=1.15;
const levelBoost=()=>Run.activeBoost&&Run.activeBoost.kind===Run.kind&&Run.activeBoost.idx===Run.idx?Run.activeBoost:null;
function applyBoost(h,type){if(type==='dmg')h.dmgMul*=BOOST_DMG;else if(type==='spd')h.speed*=BOOST_SPD;h.adBoost=type;}
function spawnHero(x,preservedBonus=0){
 const st=heroStats(Run.kind,Run.heroId);
 const pending=Run.boost&&Run.boost.kind===Run.kind&&Run.boost.idx===Run.idx;
 if(pending){Run.activeBoost={...Run.boost};Run.boost=null;}
 const ab=levelBoost(),bonus=ab?(ab.type==='hp'?50:0):preservedBonus;
 const h=spawnRagdoll(Run.heroId,x,FLOOR-70,{team:0,player:true,weapon:Run.def?.firstMinutes?'fists':(trialWeapon()||heroData(Run.kind,Run.heroId).weapon),hpMul:st.hpMul*(st.hp+bonus)/st.hp,dmgMul:st.dmgMul,speed:st.speed,scale:(MODS.giant?1.4:1)*st.size*(Run.def?.introBattle?Intro.SCALE:1)});
 h.upgradeScale=st.size;h.upgradeLevel=heroData(Run.kind,Run.heroId).lv;HeroEvolution.apply(h,h.upgradeLevel,UPG_MAX[Run.kind]);
 h.hpAdBonus=bonus;if(ab)applyBoost(h,ab.type);if(Run.def?.climb)Run.climbPeak=h.parts.torso.position.y;
 h.facing=1;if(HeroEvolution.pending.delete(Run.kind+':'+Run.heroId))HeroEvolution.celebrate(h);return h;
}
const REVIVES_PER_LEVEL=2;
// урон от падения (v=396): высота своего прыжка (~175) и спрыгивание с невысокой платформы — без урона (до FALL_SAFE);
// дальше урон растёт с высотой: FALL_KILL и выше — смертельно. Полёт с батута не считается
const FALL_SAFE=260,FALL_KILL=780;
function fallDamage(h){
 const p=h.parts.torso.position;
 if(h.fallPeak===undefined||frame-(h.bounced??-999)<150||h.hung){h.fallPeak=p.y;return;}
 if(frame-h.grounded>2){h.fallPeak=Math.min(h.fallPeak,p.y);return;}
 const drop=p.y-h.fallPeak;h.fallPeak=p.y;
 // v=396: безопасная высота — три роста героя (от макушки до ступней), дальше урон растёт; смерть — ещё на FALL_KILL-FALL_SAFE выше
 const P=h.parts,tall=Math.max(60,Math.max(P.llL.bounds.max.y,P.llR.bounds.max.y)-(P.head.position.y-(P.head.plugin.h||30)/2)),safe=4.5*tall;  // v=486: было 3 роста — от средних падений урон был слишком большим

 if(drop<=safe||h.dead||shieldBlock(h))return;  // щит гасит и удар о землю
 // v=486: урон растёт медленно вначале и круто к большой высоте; смертельно — примерно на 900 px выше безопасной
 const dmg=h.hpMax*Math.pow((drop-safe)/900,1.6);
 shake=Math.min(14,shake+4+dmg/h.hpMax*8);dust(p.x,p.y+40,10,0);Snd.hit(14);
 if(dmg>=h.hp){h.invuln=0;Run.loseWhy=t('Слишком высокое падение. Прыгай на соседнюю платформу.');killNpc(h,null);}
 else{h.hp-=dmg;h.hitT=frame;floats.push({x:p.x,y:p.y-60,t:'-'+Math.round(dmg),life:40,c:'#ff6a4a',pop:1});}
}
function buildLevel(def,preservedBonus=0){
 Run.revives=0;
 def=FirstMinutes.prepare(def);
 GameStats.endAttempt('left','restart');
 Mode=LevelMode;LevelMode.flag=null;dropGrab();clearWorld();
 Run.goalKills=0;Run.goalTotal=(def.enemies||[]).length;
 Run.def=def;Run.type=def.type||'arena';mapId=def.map||'garden';
 Object.assign(Run,{won:false,gateTip:false,cpUsed:0,cuts:0,cp:0,deaths:0,coinsGot:0,bag:0,freed:0,cagesTotal:0,hostages:[],zone:null,zoneT:0,stillT:0,safeX:150,flagWarn:0,loseWhy:'',rains:[],gunUi:undefined,guard:null,waveN:0,waveIndex:def.obj==='survive'?1:0,ambushes:(def.ambush||[]).map(a=>({...a,phase:'waiting',ticks:0}))});
 if(def.chase&&def.mods)def.mods=def.mods.filter(m=>m!=='wind');MODS=Object.fromEntries((def.mods||[]).map(m=>[m,1]));if(MODS.wind)wind={v:0,to:Math.random()<.5?1:-1,t:0};
 document.body.classList.toggle('puzzle',Run.type==='puzzle');
 showScreen('play');
 if(def.introBattle){Intro.build(def);Run.hero=spawnHero(Intro.START_X,preservedBonus);}  // v530: интро — длинная ровная дорога, камера следует за героем
 else if(Run.type==='run'){
  const L=buildRun(def);
  setLevelWidth(L.len,L.pits);L.ops.forEach(f=>f());Run.rains=L.rains;
  L.cps.forEach(x=>pickups.push({t:'cp',x,on:false}));
  LevelMode.flag={x:L.len-260};
  Run.hero=spawnHero(touchStartX(150),preservedBonus);
 }else if(def.climb){
  Climb.build(def,preservedBonus);
 }else if(Run.type==='puzzle'){
  buildPuzzle(def);Run.hero=null;
 }else{
  setLevelWidth(0);
  (def.plats||[]).forEach(p=>{spawnItem('platform',p.x*WW,FLOOR-p.y,{w:p.w});if(p.item)spawnItem(p.item,p.x*WW+rnd(-p.w/5,p.w/5),FLOOR-p.y-9-30);});
  (def.hazards||[]).forEach(h=>{
   if(h.t==='saw')spawnItem('saw',h.x*WW,FLOOR-(h.y||30));
   if(h.t==='spikes')spawnItem('spikes',h.x*WW,FLOOR-9,{w:h.w||120});
   if(h.t==='mine'){const m=spawnItem('mine',h.x*WW,FLOOR-6);m.armed=0;}
  });
  if(def.obj==='defend')spawnGuard(def);
  Run.hero=spawnHero(def.obj==='defend'?WW*.36:def.obj==='survive'&&Run.kind==='arcade'?WW*.5:touchStartX(WW*.1),preservedBonus);  // v503: в аркадном выживании — в центре, враги идут с краёв
  const si=Run.kind==='story'?def.i:-1;
  (def.enemies||[]).forEach(e=>spawnEnemy(si>=0?(def.firstMinutes?{...e,hp:(e.hp||1)*.8,dm:(e.dm||1)*.6}:CombatBalance.storyArena(e,si)):e));
  (def.props||[]).forEach(p=>spawnItem(p.id,p.x*WW,FLOOR-(p.y||0)-(p.id==='barrel'?30:26)));
  (def.allies||[]).forEach(a=>{const e=spawnRagdoll(a.k,a.x*WW,FLOOR-70,{team:0,ai:true,weapon:a.w,hpMul:a.hp||1.3,speed:2.6,scale:MODS.giant?1.4:1});e.facing=1;});
 }
 if(Run.hero){Run.hero.hp=Math.max(1,Run.hero.hpMax*Run.heroHp);Run.hero.invuln=60;}
 camX=0;updateCam(true);
 Run.timer=(def.time||0)*60;Run.state='play';Run.hintList=null;Run.hintK=0;Run.hintT=frame;Y.level('started');if(!paused)Y.start();Run.waveT=0;Run.endAt=0;
 GameStats.beginAttempt(Run.nextRetry||'new');Run.nextRetry=null;Missions.syncEntry();
 Object.keys(keys).forEach(k=>keys[k]=false);
 updateHud();
 if(Run.type!=='puzzle')setTimeout(()=>{if(Run.state==='play'&&!paused&&Run.def===def)Snd.voice('v_fight',.75,1,0);},350);
 if(MODS.ice)for(const g of grounds)g.friction=.02;
 const mods=(def.mods||[]).map(m=>MODDEF[m]);
 if(mods.length)setTimeout(()=>{if(Run.def===def)showBanner(mods.map(m=>m.e+' '+t(m.n)).join(' · '),mods.map(m=>t(m.d)).join(' · '),'#ffe27a');},def.tip?5600:0);

 tutStop();
 if(tutWanted())tutStart();else if(def.tip)showTip(t(TIPS[def.tip]||def.tip));  // в головоломках подсказка только на самой первой
 else if(Run.kind==='arcade')showBanner(def.n,t(DANGER[def.tier][0])+(def.obj==='boss'?' · '+t('БОСС!'):''),DANGER[def.tier][1]);
 FirstMinutes.start();
 Chests.place(def);
 ensureCrateTutorialBox();
 Memes.reset();
 // v=396: в аркаде в начале уровня герой говорит мемную фразу (memes.js)
 if(Run.kind==='arcade'&&Run.idx>0){const l=Memes.startLine();showDialog([[l[0],l[1],l[1]]]);}
}
// на телефоне герой появляется правее, иначе в начале уровня его закрывает джойстик
const touchStartX=x=>matchMedia('(hover:hover) and (pointer:fine)').matches?x:x+170;
function spawnEnemy(e){
 const ent=spawnRagdoll(e.k,e.x*WW,FLOOR-(e.y||0)-70,{team:1,ai:true,weapon:e.w==='bazooka'?'bow':e.w,hpMul:e.hp||1,dmgMul:e.dm||1,speed:e.sp||2.5,boss:e.boss,scale:(e.boss?1.25:1)*(MODS.giant?1.4:1),aggro:e.aggro||0});
 ent.facing=-1;ent.aiT=ri(20,60);return ent;
}
// защита пленника: связанный друг стоит посреди арены, сам не дерётся; его держит «пружина», чтобы удары не сбили с места
function spawnGuard(def){
 let k=def.guard||'ogurets';if(k===Run.heroId)k=['ogurets','pomidor','morkov','baklazhan'].find(x=>x!==Run.heroId);
 const x=WW*.5,g=spawnRagdoll(k,x,FLOOR-70,{team:0,ai:false,hpMul:Run.kind==='story'?4.5+def.i*.05:5+Run.idx*.2,scale:MODS.giant?1.4:1});
 g.guard=true;g.facing=1;g.pin={x,y:g.parts.torso.position.y};g.cageW=k==='baklazhan'||k==='pomidor'?120:100;g.cageH=(k==='baklazhan'||k==='morkov'?160:145)*(MODS.giant?1.35:1);
 const c=Constraint.create({pointA:{...g.pin},bodyB:g.parts.torso,length:0,stiffness:.04,damping:.1,render:{visible:false}});g.cons.push(c);Composite.add(world,c);
 Run.guard=g;return g;
}
// волны к клетке: с обеих сторон по очереди, не больше нескольких живых сразу
function updateAmbushes(){
 const h=Run.hero;if(!h||h.dead||!Run.ambushes?.length)return;
 for(const a of Run.ambushes){
  if(a.phase==='waiting'&&h.parts.torso.position.x>=LW*a.at){
   a.phase='warning';a.ticks=45;a.x=clamp(h.parts.torso.position.x+(h.facing||1)*120,80,LW-80);
  }else if(a.phase==='warning'&&--a.ticks<=0){
   a.phase='done';
   for(let k=0;k<a.count;k++){
    const x=clamp(a.x+k*75,60,LW-60),top=viewY-100;
    const e=spawnEnemy({k:pick(Run.def.foes||['perets']),w:pick(Run.def.weap||['fists','bat']),x:x/WW,y:FLOOR-top-70,hp:storyHp(Run.idx)*.8,dm:storyDm(Run.idx)*.65,sp:2.5,aggro:1400});
    e.target=h;e.chaseRange=2400;e.invuln=30;for(const b of e.bodies)Body.setVelocity(b,{x:0,y:2});
   }
  }
 }
}
function defendWaves(def){
 const st=Run.kind==='story',n=st?2+Math.floor(def.i/12):clamp(2+Math.floor(Run.idx/5),2,5),every=st?240:Math.max(150,240-Run.idx*4);
 if(frame%every!==0||enemiesAlive()>=n)return;
 const foes=def.foes||(st?WILD.slice(0,1+Math.min(3,Math.floor(def.i/8))):['pomidor','morkov']),ws=def.wpool||['fists','bat','sword','pistol'];
 spawnEnemy({k:pick(foes),w:pick(ws),x:Run.waveN++%2?.03:.97,hp:CombatBalance.forRun(st?def.i:Run.idx).hp,dm:CombatBalance.forRun(st?def.i:Run.idx).dm,sp:2.6});
}
const enemiesAlive=()=>entities.filter(e=>e.type==='npc'&&e.team===1&&!e.dead).length;
// камера идёт за героем с небольшим упреждением по направлению взгляда
// кулаки бьют сами (каждый 4-й удар — с замахом); оружием — режем и стреляем только по нажатию игрока
// (холодное: короткое нажатие — удар, удержание — сильный удар с замахом)
const heroArmed=h=>armSide(h)&&h.weapon&&h.weapon!=='fists'?h.weapon:null;
// нажатие во время перезарядки не теряется: удар/выстрел сработает, как только оружие будет готово — ровно один раз.
// Огнестрел стреляет в том же шаге, где перезарядка доходит до нуля, поэтому сброс по нулю его не ловил и буфер
// «залипал»: после одного нажатия пистолет стрелял сам бесконечно. Теперь буфер тратится, когда перезарядка началась заново
function queuedAttack(h,wantAtk){
 const cd=h.atkCd||0;if(h.atkQ&&cd>(h.prevAtkCd??0))h.atkQ=0;h.prevAtkCd=cd;
 if(h.weapon==='grenade')h.atkQ=0;else if(keys.attack&&cd>0)h.atkQ=1;
 if(h.atkQ){wantAtk=true;if(cd<=0){if(h.atkQ===2)h.atkQ=0;else h.atkQ=2;}}
 return wantAtk;
}
/* ---------- прицел ---------- */
// ПК: оружие дальнего боя целится в курсор (пока мышью двигали последние 2,5 с или держат кнопку), выстрел — ЛКМ или F.
// Мышь не трогали — прицел, как раньше, на ближайшего врага. Сенсор: огнестрел стреляет сам по врагу в кадре,
// кнопка атаки — стрелять вручную; гранаты и холодное оружие — только по кнопке
const MouseAim={x:0,y:0,at:-1e9,inside:false,held:false,shown:false};
// автоприцел (автострельба по врагу в кадре) — по умолчанию на сенсорных экранах; в настройках можно включить/выключить вручную (S.autoAim),
// потому что у планшетов и ноутбуков с сенсором тип устройства определяется не всегда верно
const autoAimOn=()=>S.autoAim===true||S.autoAim===false?S.autoAim:!fineInput();
const AUTO_FIRE_X=560,AUTO_FIRE_Y=240,ROCKET_SAFE=170;
function heroAim(h,wantAtk){
 const wid=heroArmed(h),wp=WEAPONS[wid||'fists'],ranged=!!wid&&wp.type!=='melee';
 h.ctrl.aim=null;
 const pc=!autoAimOn()&&!Intro.cutscene();  // v537: в кат-сцене интро мышь не целится — героем управляет бот
 if(ranged&&pc&&MouseAim.inside&&(MouseAim.held||performance.now()-MouseAim.at<2500))h.ctrl.aim=toWorld({clientX:MouseAim.x,clientY:MouseAim.y});
 const show=!!h.ctrl.aim;if(show!==MouseAim.shown){MouseAim.shown=show;document.body.classList.toggle('aiming',show);}
 return wantAtk;
}
function clearHeroAim(){if(MouseAim.shown){MouseAim.shown=false;document.body.classList.remove('aiming');}MouseAim.held=false;}
// перекрестие прицела в мире: краснеет, когда под ним враг
function drawAimReticle(){
 const h=screen==='sandbox'?SbPlay.ent:screen==='play'&&Run.state==='play'?Run.hero:null,p=h&&!h.dead&&h.ctrl.aim;
 if(!p){if(MouseAim.shown){MouseAim.shown=false;document.body.classList.remove('aiming');}return;}
 const on=entities.some(e=>e.type==='npc'&&e.team!==h.team&&e.team>=0&&!e.dead&&e.bodies.some(b=>Vector.magnitude(Vector.sub(b.position,p))<26*e.s));
 const r=13,col=on?'#ff5a4a':'#ffffff';
 ctx.save();ctx.lineCap='round';
 for(const [w,c] of [[5,'rgba(40,20,10,.75)'],[2.4,col]]){ctx.lineWidth=w;ctx.strokeStyle=c;ctx.beginPath();ctx.arc(p.x,p.y,r,0,7);ctx.stroke();ctx.beginPath();
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ctx.moveTo(p.x+dx*(r-5),p.y+dy*(r-5));ctx.lineTo(p.x+dx*(r+6),p.y+dy*(r+6));}ctx.stroke();}
 ctx.fillStyle=col;ctx.beginPath();ctx.arc(p.x,p.y,2.2,0,7);ctx.fill();ctx.restore();
}
function autoAttack(h){
 if(!h.dead&&Intro.autoFire(h))return true;  // v529: в интро автомат стреляет сам по ближайшему врагу
 if(keys.attack&&!h.dead)return true;  // кнопка удара работает всегда, палка ещё и бьёт сама
 if(heroArmed(h))return false;
 const tg=h.target;if(!tg||tg.dead||h.dead){h.autoHold=0;return false;}
 const wid=armSide(h)?(h.weapon||'fists'):'fists',wp=WEAPONS[wid],t=h.parts.torso.position,tp=tg.parts.torso.position,dx=tp.x-t.x,dy=tp.y-t.y;
 if(wp.type==='melee'){
  if(h.autoHold>0){h.autoHold--;return true;}
  const R=reachOf(h,wid)+(h.parts.torso.plugin.w+tg.parts.torso.plugin.w)*.5;
  if(Math.abs(dx)<R+14&&Math.abs(dy)<90&&h.atkCd<=0&&!h.charge&&!h.tackle){h.hits=(h.hits||0)+1;h.autoHold=h.hits%4===0?CH_MIN+CH_FULL:1;return true;}
  return false;
 }
 return h.reload<=0&&Math.abs(dx)<620&&Math.abs(dy)<260&&onScreen(tp.x,0);
}
let viewAt=0; // левый край видимого окна в координатах мира
function updateCam(snap){
 const h=Run.hero,alive=h&&!h.removed&&!h.dead;  // погибший герой камеру не ведёт: она остаётся там, где он погиб
 if(LW<=WW+1)camX=0;
 else if(alive){const want=clamp(h.parts.torso.position.x-WW*.4+h.facing*70,0,LW-WW);camX=snap?want:camX+(want-camX)*.09;}
 // ближняя камера вертикального экрана: окно viewW держит героя у центра, чуть впереди — больше видно по ходу движения
 const room=WW-viewW,roomY=VH-viewH;
 if(viewMode!=='follow'){
  if(ch>cw&&Run.type==='puzzle'){const sp=puzzleSpan(Run.def);viewX=clamp((WW-960)/2+sp.cx-viewW/2,0,Math.max(0,room));viewY=Math.max(0,roomY);}
  else{viewX=0;viewY=0;}
  return;
 }
 // по вертикали герой чуть ниже середины кадра: над ним видно платформы и врагов; у пола камера упирается в низ мира
 if(Run.def?.climb&&alive){const vy=clamp(h.parts.torso.position.y-viewH*.6,Run.climbMinY||-1800,Math.max(0,roomY));viewY=snap?vy:viewY+(vy-viewY)*.12;}
 else if(roomY>0&&alive){const vy=clamp(h.parts.torso.position.y-viewH*.6,0,roomY);viewY=snap?vy:viewY+(vy-viewY)*.12;}else if(roomY<=0)viewY=0;
 if(room<=0){viewX=0;return;}
 if(!alive)return;
 const v=clamp(h.parts.torso.position.x-viewW*.5+h.facing*70,0,Math.max(0,LW-viewW));
 viewAt=snap?v:viewAt+(v-viewAt)*.1;
 viewX=clamp(viewAt-camX,0,room);
}
// поворот экрана меняет размеры мира: уровень собираем заново (забег — с последней контрольной точки), здоровье героя сохраняем
function rebuildLevel(){
 const h=Run.hero,cp=Run.cp,deaths=Run.deaths,got=Run.coinsGot,bonus=h?.hpAdBonus||0;
 Run.heroHp=h&&!h.removed&&!h.dead?h.hp/h.hpMax:1;
 Run.nextRetry='rotate';buildLevel(Run.def,bonus);
 Run.coinsGot=got;Run.deaths=deaths;
 const back=Run.type==='run'&&cp>0;
 if(back){respawnHero(cp-30,bonus,'rotate');Run.deaths=deaths;Run.cp=cp;Run.hero.hp=Math.max(1,Run.hero.hpMax*Run.heroHp);for(const c of pickups)if(c.t==='cp'&&c.x<=cp)c.on=true;updateHud();}
 updateCam(true);
 toast(t(back?'🔄 Экран повёрнут — продолжаем с контрольной точки':'🔄 Экран повёрнут — уровень начат заново'));
}
// обучение в первой главе: ходьба, прыжок, удар и главное — сильный удар; враг ждёт, пока герой учится
const Tut={on:false,i:0,t:0,x:0,foes:[],hp:0,full:false};
const TUT_STEPS=()=>{const pc=matchMedia('(hover:hover) and (pointer:fine)').matches,move=pc?'[data-k=right]':'#joy',jump=pc?'.keys [data-k=jump]':'#touchJump',atk='#controls .atk';return [
 {id:'walk',txt:pc?'Иди вправо: зажми клавишу →':'Сдвинь джойстик вправо',hl:move},
 {id:'jump',txt:pc?'Прыгни: нажми ↑ или пробел':'Нажми кнопку ↑ — это прыжок. Джойстиком выбирай направление',hl:jump},
 {id:'dash',txt:pc?'Рывок — нажми E. Направление задаётся движением, перезарядка — 1,2 с':'Нажми » для рывка. Направление задаётся джойстиком, перезарядка — 1,2 с',hl:pc?null:'#touchDash'},
 ...(Run.def?.firstMinutes?[{id:'crate',txt:pc?'Разбей ящик: подойди и нажми мышку или F. Внутри монеты, здоровье или усиление!':'Разбей ящик: подойди и нажми кнопку атаки. Внутри монеты, здоровье или усиление!',hl:atk},{id:'loot',txt:'Подойди к монетам из ящика — они подберутся автоматически',hl:null}]:[]),
 {id:'hit',txt:pc?'Подойди к врагу: нажми левую кнопку мыши или F':'Подойди к врагу и нажми кнопку удара',hl:atk},
 {id:'charge',txt:pc?'Зажми левую кнопку мыши или F, пока оружие не засветится':'Главный приём! Зажми кнопку удара, пока оружие не засветится',hl:atk},
 {id:'release',txt:'Рядом с врагом отпусти — это СИЛЬНЫЙ УДАР!',hl:atk},
 {id:'end',txt:'Сильный удар — твоё главное оружие. Теперь победи врага!',hl:null}];};
function tutShow(){
 const st=TUT_STEPS(),s=st[Tut.i],n=$('#tutor');
 if(s.id==='jump')Tut.jumpAt=Run.hero?.lastJumpAt??-1;
 if(s.id==='dash')Tut.dashAt=Run.hero?.lastDashAt||-1;
 GameStats.send('tutorial_step',{tutorial:tutKey(),step:s.id,step_index:Tut.i+1,total_steps:st.length});
 document.querySelectorAll('.tut-hl').forEach(e=>e.classList.remove('tut-hl'));
 if(s.hl)document.querySelectorAll(s.hl).forEach(e=>e.classList.add('tut-hl'));
 n.classList.add('on');n.classList.toggle('big',s.id==='charge'||s.id==='release');
 n.innerHTML=`<div class="tt">${emo(t(s.txt))}</div><div class="td">${st.slice(0,-1).map((_,k)=>`<i class="${k<Tut.i?'ok':k===Tut.i?'cur':''}"></i>`).join('')}</div>`;
}
// обучение идёт в первой главе истории и на первом уровне аркады; у каждого режима своя отметка о прохождении
const tutKey=()=>Run.kind==='arcade'?'arcade':'fight';
// v=396: обучение общее для истории и аркады — прошёл в одном режиме, в другом его уже нет
const tutDone=()=>!!(S.tut.fight||S.tut.arcade);
// самая первая глава-головоломка: только на ней учим резать верёвку
const isFirstPuzzle=()=>Run.kind==='story'&&Run.idx===STORY.findIndex(c=>c.type==='puzzle');
const tutWanted=()=>(Run.kind==='story'||Run.kind==='arcade')&&Run.idx===0&&!tutDone()&&!Run.def?.introBattle;
function tutStart(){
 Tut.on=true;Tut.i=0;Tut.t=0;Tut.full=false;const h=Run.hero;Tut.x=h?h.parts.torso.position.x:0;
 Tut.foes=entities.filter(e=>e.type==='npc'&&e.team===1&&!e.dead);
 for(const e of Tut.foes){e.tutAi=e.ai;e.ai=false;e.hpMax*=3;e.hp*=3;}
 Tut.hp=Tut.foes[0]?Tut.foes[0].hp:0;
 Tut.startedAt=performance.now();
 GameStats.send('tutorial_started',{tutorial:tutKey(),step:TUT_STEPS()[0]?.id||'walk',step_index:1,total_steps:TUT_STEPS().length});
 tutShow();
}
function tutRelease(){for(const e of Tut.foes){e.ai=e.tutAi;e.hpMax/=3;e.hp/=3;}Tut.foes=[];}
function tutStop(){Tut.foes=[];Tut.on=false;document.querySelectorAll('.tut-hl').forEach(e=>e.classList.remove('tut-hl'));const n=$('#tutor');if(n){n.classList.remove('on','big');n.innerHTML='';}}
function tutFinish(skipped=false){const k=tutKey();if(skipped&&FirstMinutes.active){S.tut.crateLoot=1;S.tut.crateLootV2=1;S.tut.dash=1;}if(Tut.on)GameStats.send(skipped?'tutorial_skipped':'tutorial_completed',{tutorial:k,duration_sec:Tut.startedAt?Math.round((performance.now()-Tut.startedAt)/1000):0,step:TUT_STEPS()[Tut.i]?.id||'end',step_index:Tut.i+1});if(!S.tut.fight||!S.tut.arcade){S.tut.fight=1;S.tut.arcade=1;save();}tutRelease();tutStop();}
function tutNext(){StoryDialogue.tutorialStep();Tut.i++;Tut.t=0;Snd.checkpoint();if(TUT_STEPS()[Tut.i].id==='end')tutRelease();tutShow();}
function tutUpdate(h){
 if(!h||h.removed||h.dead)return;
 const id=TUT_STEPS()[Tut.i].id,p=h.parts.torso.position,foe=Tut.foes[0],melee=WEAPONS[h.weapon||'fists'].type==='melee',hurt=foe&&foe.hp<Tut.hp-.01;Tut.t++;
 if(id==='walk'&&p.x-Tut.x>90)tutNext();
 else if(id==='jump'&&(h.lastJumpAt??-1)>Tut.jumpAt)tutNext();
 else if(id==='crate'&&FirstMinutes.box?.removed)tutNext();
 else if(id==='loot'&&FirstMinutes.collected)tutNext();
 else if(id==='dash'&&(h.lastDashAt||-1)>Tut.dashAt)tutNext();
 else if(id==='hit'){if(!foe||foe.dead||hurt){if(foe)Tut.hp=foe.hp;tutNext();}}
 else if(id==='charge'){
  // оружие без замаха (огнестрел) приём пропускает
  if(!melee){Tut.i=TUT_STEPS().length-2;tutNext();}
  else if((h.charge||0)>=CH_MIN+CH_FULL)tutNext();
 }
 else if(id==='release'){
  if(!foe||foe.dead)tutNext();
  else{if(hurt&&(h.pw||0)>=1)tutNext();else if(foe)Tut.hp=foe.hp;
   // отпустил раньше времени или далеко от врага — зажми ещё раз
   if(!keys.attack&&(h.charge||0)<CH_MIN&&h.swing<=0&&Tut.i<TUT_STEPS().length-1&&TUT_STEPS()[Tut.i].id==='release'){Tut.i--;tutShow();}}
 }
 else if(id==='end'&&Tut.t>200)tutFinish();
}
function runUpdate(){
 const h=Run.hero,def=Run.def;
 if(Tut.on)tutUpdate(h);
 FirstMinutes.tick();
 Intro.tick();
 // конвейер везёт тех, кто стоит на ленте
 for(const c of pickups){if(c.t!=='belt')continue;for(const e of entities){if(e.type!=='npc'||e.dead||e.removed||e.hung||e.caged)continue;const q=e.parts.torso.position,f=e.parts.llL.position;if(q.x>c.x0&&q.x<c.x1&&f.y>FLOOR-34)for(const b of e.bodies)Body.translate(b,{x:c.dir*2.4,y:0});}}
 if(h&&!h.removed){
  let mv=(keys.right?1:0)-(keys.left?1:0);
  // палец/мышь: идём к точке касания (мёртвая зона — чтобы герой не дёргался под пальцем)
  if(drive&&Run.type!=='puzzle'){drive.x=drive.sx/scale+viewX+camX;const dx=drive.x-h.parts.torso.position.x;mv=Math.abs(dx)>36?Math.sign(dx):0;}
  mv=Intro.move(mv);
  h.ctrl.move=mv;h.ctrl.jump=keys.jump||jumpQ>0;if(jumpQ>0)jumpQ--;
  // нажатие во время перезарядки не теряется: удар сработает, как только оружие будет готово
  let wantAtk=autoAttack(h);
  wantAtk=queuedAttack(h,wantAtk);
  h.ctrl.attack=heroAim(h,wantAtk);
  // на кнопке атаки — иконка оружия; подсказка при первом оружии
  const gun=heroArmed(h);
  if(gun!==Run.gunUi){Run.gunUi=gun;const b=$('#controls .atk');b.classList.toggle('gun',!!gun);b.style.setProperty('--wi',gun?`url("${weaponIconSrc(gun)}")`:'none');if(!gun)keys.attack=false;
   if(gun&&!S.tut.atk2&&!Intro.active){S.tut.atk2=1;S.tut.atk=1;save();showTip(t(!autoAimOn()?'Целься мышкой и стреляй левой кнопкой (или F). Холодным оружием: зажми — сильный удар 💥':'Оружие само целится во врага. Нажимай кнопку атаки для выстрела! Зажми — сильный удар 💥'));}}
 }
 updateCam();
 if(Run.state==='play'){
  if(def.rain&&frame%def.rain===0&&!(def.obj==='survive'&&Run.kind==='arcade'&&Run.waveT<180))spawnItem('bomb',camX+rnd(.05,.95)*WW,-30,{fuse:110});
  // бомбопад на участке длинного уровня — пока герой рядом
  if(h&&!h.removed)for(const z of Run.rains){const x=h.parts.torso.position.x;if(x>z.x0-250&&x<z.x1&&frame%z.every===0){const b=spawnItem('bomb',clamp(x+rnd(-150,500),z.x0,z.x1),-30,{fuse:95});b.power=.042;b.radius=165;}}
  if(def.waves){
   Run.waveT++;
   if(def.obj==='survive'){
    if(Run.waveT%(def.waveEvery||360)===0&&enemiesAlive()<(def.waveLimit||4)){
     const count=Math.min(def.waveSize||2,(def.waveLimit||4)-enemiesAlive());Run.waveIndex++;
     for(let k=0;k<count;k++)spawnEnemy({k:pick(def.foes||['perets']),w:pick(def.wpool||['fists','bat']),x:(Run.waveIndex+k)%2?.04:.96,hp:def.whp||storyHp(def.i),dm:def.wdm||storyDm(def.i)*.8,sp:def.wsp||2.5});
    }
   }else if(Run.waveT%420===0&&enemiesAlive()<3)spawnEnemy({k:pick(Run.kind==='story'?WILD.slice(0,4):['pomidor','morkov']),w:pick(['sword','pistol','bat']),x:pick([.04,.96]),hp:CombatBalance.forRun(Run.idx).hp,dm:CombatBalance.forRun(Run.idx).dm});
  }
  updateAmbushes();Climb.update();
  if(Run.type==='puzzle'){puzzleUpdate();if(frame%6===0)updateHud();return;}
  if(!h||h.dead||h.removed){endLevel(false);return;}
  collectCoins(h);Memes.update();fallDamage(h);if(h.dead)return;
  if(Run.type==='run')RunHazards.update(h);
  if(Run.type==='run')runLevelUpdate(h);
  if(Run.state!=='play')return;
  if(def.obj==='survive'){Run.timer--;if(Run.timer<=0){endLevel(true);return;}}
  if(def.obj==='defend'){const g=Run.guard;if(!g||g.dead||g.removed){endLevel(false,t('Пленника не уберегли…'),true);return;}
   defendWaves(def);if(--Run.timer<=0){endLevel(true);for(const e of entities)if(e.type==='npc'&&e.team===1&&!e.dead)killNpc(e,null);return;}}
  if((def.obj==='kill'||def.obj==='boss')&&enemiesAlive()===0&&!FirstMinutes.blockWin()){endLevel(true);return;}
  if(frame%6===0)updateHud();
 }else if(Run.state==='ending'&&frame>=Run.endAt){Run.state='done';Y.level(Run.won?'completed':'failed');Run.won?onWin():onLose();}
}
// монеты на уровне: в забегах и на подъёмах (раньше подбирались только в забегах — на подъёме их было не взять)
function collectCoins(h){
 if(h.dead||h.removed)return;
 const p=h.parts.torso.position;let got=false;
 // v531: зона подбора шире и по всему росту героя, плюс притягивание монет в радиусе ~170
 const top=p.y-h.parts.torso.plugin.h-60,bot=Math.max(p.y+80,...['llL','llR'].filter(n=>h.attached.has(n)).map(n=>h.parts[n].bounds.max.y))+30;
 for(const c of pickups)if(c.t==='coin'&&!c.taken){const d=Math.hypot(c.x-p.x,c.y-p.y);if(d<75&&d>15){c.x+=(p.x-c.x)*.2;c.y+=(p.y-c.y)*.2;}}  // v534: лёгкое притяжение только вблизи
 for(const c of pickups)if(c.t==='coin'&&!c.taken&&Math.abs(c.x-p.x)<55&&c.y>top&&c.y<bot){c.taken=got=true;Run.coinsGot++;bagCoins(1);Missions.record('loot_coins');Snd.coin();coinPickupFx(c.x,c.y);}
 if(got)pickups=pickups.filter(c=>!c.taken);
}
// длинный уровень: контрольные точки, клетки, ворота, флаг
function runLevelUpdate(h){
 const p=h.parts.torso.position;
 for(const c of pickups){
  if(c.t==='cp'&&!c.on&&p.x>c.x){c.on=true;c.onAt=frame;Run.cp=c.x;Missions.record('checkpoint');Snd.checkpoint();for(let i=0;i<12;i++)FX.sparkle(c.x+rnd(-60,60),FLOOR-rnd(20,170),rnd(20,38));FX.shock(c.x,FLOOR-100,150);FX.ring(c.x,FLOOR-100,110);FX.burst(c.x,FLOOR-100,190,'#ffe27a');FX.confetti(c.x-130,c.x+130,FLOOR-230,36);shake=Math.min(12,shake+4);toast(t('🚩 Контрольная точка'));healNpc(h,.25);}
 }
 pickups=pickups.filter(c=>!c.taken);
 // запоминаем последнее безопасное место — туда вернёт воскрешение
 if(frame%20===0&&frame-h.grounded<4&&!PITS.some(q=>p.x>q[0]-170&&p.x<q[1]+170)&&!entities.some(e=>(e.type==='saw'||e.type==='mine'||e.type==='static'&&e.bodies[0].plugin.hazard)&&Math.abs(e.bodies[0].position.x-p.x)<170))Run.safeX=p.x;
 for(const e of entities){
  if(e.type==='cage'&&Math.abs(e.box.x-p.x)<e.box.w/2+55&&p.y>FLOOR-e.box.h-80)openCage(e);
  if(e.type==='gate'&&frame%10===0){
   e.left=entities.filter(x=>x.type==='npc'&&x.gid===e.gid&&!x.dead).length;
   if(e.left===0)openGate(e);
   // подсказка: подошёл к стене — её можно сломать (один раз за уровень)
   if(!Run.gateTip&&!e.removed&&Math.abs(e.bodies[0].position.x-p.x)<300){Run.gateTip=true;showTip(t('Стена! Бей её, чтобы сломать, — или победи охрану'));}
  }
 }
 if(p.x>LevelMode.flag.x-50){  // у флага или уже за ним (мог пробежать мимо, пока у флага были враги)
  // v=396: у флага враги — уровень не засчитывается, пока они живы и рядом (дальше FLAG_FOE_R от флага — можно)
  // правка пользователя: пока у флага есть живые враги, уровень не заканчивается (без поблажек по времени)
  const foesNear=entities.filter(e=>e.type==='npc'&&e.team===1&&!e.dead&&!e.removed&&!e.hung&&!e.caged&&Math.abs(e.parts.torso.position.x-LevelMode.flag.x)<FLAG_FOE_R);
  // враги у флага сами идут к герою: чтобы никто не «застрял» вне досягаемости
  for(const e of foesNear){e.target=Run.hero;e.aggro=Math.max(e.aggro||0,900);}
  // v=485: освобождать всех друзей не обязательно — уровень проходится и без них (пленники дают только бонус)
  if(foesNear.length){if(frame-Run.flagWarn>150){Run.flagWarn=frame;toast(t('У флага враги — победи их!'));for(const e of foesNear)FX.excl&&FX.excl(e);}}
  else endLevel(true);
 }
}
// головоломка: пленники должны стоять у флажка, враги — повержены
const FLAG_FOE_R=400;
function puzzleUpdate(){
 const def=Run.def,hs=Run.hostages;
 if(hs.some(e=>e.dead||e.removed)){endLevel(false,t('Пленник не выжил…'),true);return;}
 const needKill=def.goal==='both'||def.goal==='kill';
 const killed=!needKill||enemiesAlive()===0;
 const z=Run.zone;
 // освобождённый (не висит и стоит на земле) пленник сам идёт к флажку; у края ямы останавливается
 if(z)for(const e of hs){if(e.dead||e.removed||e.hung)continue;
  if(!e.walkTo&&frame-e.grounded<8){e.walkTo=(z[0]+z[1])/2;e.ai=true;e.aiT=0;}}
 // v=452: пленник в зоне — стоит на земле ИЛИ спокойно лежит (например, на другом пленнике: двое стопкой у флажка раньше не засчитывались)
 const inZone=!z||hs.every(e=>{const p=e.parts.torso.position,v=Vector.magnitude(e.parts.torso.velocity);return !e.hung&&p.x>z[0]-30&&p.x<z[1]+30&&(frame-e.grounded<30&&v<4||v<1.2);});
 if(killed&&inZone){if(++Run.zoneT>40)endLevel(true);}else Run.zoneT=Math.max(0,Run.zoneT-2);
 // тупик: верёвок не осталось, всё замерло, а цель не достигнута
 const ropes=entities.some(e=>e.type==='rope'),busy=entities.some(e=>e.type==='bomb')||entities.some(e=>e.type==='npc'&&!e.dead&&Vector.magnitude(e.parts.torso.velocity)>.7);
 if(!ropes&&!busy&&!(killed&&inZone)){if(++Run.stillT>150)endLevel(false,t('Не вышло — попробуй иначе!'));}else Run.stillT=0;
}
// captive: проиграли, потому что погиб пленник — воскрешение и контрольная точка уровень уже не спасут, только заново
function endLevel(won,why,captive){
 if(Run.state!=='play')return;
 if(won){FirstMinutes.completed();Missions.record('win');Missions.record(Run.kind==='arcade'?'arcade_win':'story_win');if(Run.def.obj==='boss')Missions.record('boss_win');if(Run.type==='puzzle'&&storyStars()===3)Missions.record('puzzle3');}  // v=522: события заданий дня
 // счёт поражений подряд на одном уровне: после второго предлагаем оружие помощнее (loseHelpOffer)
 {const key=Run.kind+':'+Run.idx;if(won){Run.loseKey=key;Run.loseN=0;}else{Run.loseN=Run.loseKey===key?(Run.loseN||0)+1:1;Run.loseKey=key;}}
 Y.stop();
 Run.state='ending';Run.won=won;Run.loseWhy=why||'';Run.captiveLost=!!captive;Run.endAt=frame+(won?70:90);
 GameStats.endAttempt(won?'completed':'failed',won?'goal':captive?'captive_lost':Run.hero?.dead?'hero_dead':Run.def?.obj==='survive'||Run.def?.obj==='defend'?'objective_failed':Run.type==='puzzle'?'puzzle_stuck':'objective_failed');
 if(!won&&Run.hero?.hpAdBonus){Run.hero.hpMax-=Run.hero.hpAdBonus;Run.hero.hp=Math.min(Run.hero.hp,Run.hero.hpMax);Run.hero.hpAdBonus=0;}
 if(won){Run.def.obj==='boss'?Snd.winBig():Snd.win();FX.confetti(camX+40,camX+WW-40,-20,Run.def.obj==='boss'?110:70);setTimeout(()=>Snd.voice('v_victory',.75,1,0),250);if(Run.hero&&!Run.hero.removed)Run.hero.invuln=999;for(const e of entities)if(e.type==='bomb')e.fuse=9999;}else{Snd.lose();setTimeout(()=>Snd.voice('v_lose',.7,1,0),300);}
 updateHud();
}
function heroHpFrac(){const h=Run.hero;return h&&!h.removed?clamp(h.hp/h.hpMax,0,1):0;}
function storyStars(){
 if(Run.type==='puzzle'){const par=Run.def.par||1;let s=Run.cuts<=par?3:Run.cuts<=par+1?2:1;if(Run.hostages.some(e=>e.hp/e.hpMax<.5))s=Math.min(s,2);return s;}
 let f=heroHpFrac();if(Run.guard&&!Run.guard.removed)f=Math.min(f,Run.guard.hp/Run.guard.hpMax);return Math.max(1,(f>.66?3:f>.33?2:1)-Run.deaths);
}
/* ============ особое предложение: некупленное оружие на один уровень ============ */
const TRIAL_CHANCE=.65,TRIAL_GAP=1,TRIAL_BY_AD=true;  // offers remain optional, outside active gameplay
let trialWait=1;
// хватает монет на биту, а её ещё нет: подсвечиваем её на экране героя
const batTutWanted=()=>!S.dev&&!S.all&&!weaponOwned('bat')&&S.coins>=WEAPONS.bat.lock;
new Image().src='assets/ui/ui_offer_badge.png?v=1';  // заранее, чтобы бейдж не появлялся пустым
// оружие на текущий уровень: пока игрок на этом уровне, оно сохраняется и при повторной попытке
const trialWeapon=()=>{const q=Run.trial;return q&&!q.off&&q.kind===Run.kind&&q.idx===Run.idx?q.w:null;};  // v=486: q.off — игрок выбрал в окне героя своё оружие
// выпало ли предложение после этой победы: возвращает оружие или null
function trialPick(idx){
 if(idx===2&&!S.tut.smgOffer&&(!TRIAL_BY_AD||Y.canReward())){
  S.tut.smgOffer=1;save();trialWait=TRIAL_GAP;return 'smg';
 }
 if(trialWait>0){trialWait--;return null;}
 const list=Object.keys(WEAPONS).filter(id=>!weaponOwned(id));
 if(!list.length||Math.random()>TRIAL_CHANCE||(TRIAL_BY_AD&&!Y.canReward()))return null;
 trialWait=TRIAL_GAP;return pick(list);
}
// левитирующий пузырь сбоку от окна победы; нажатие — оружие на уровень idx. Окно не перекрывает и игру не останавливает
function trialBubble(idx){
 const id=trialPick(idx);if(!id)return;
 const w=WEAPONS[id],im=SPR['icon_wpn_'+id],box=$('#modal .box');if(!box)return;
 const b=document.createElement('button');b.className='trb';b.setAttribute('aria-label',t('Взять на уровень')+': '+t(w.n));
 b.innerHTML=emo(`${im?`<img src="${im.src}" alt="">`:''}<span>${TRIAL_BY_AD?'🎬 ':''}${t('На уровень')}</span>`);
 $('#modal').appendChild(b);
 const r=box.getBoundingClientRect(),size=b.offsetWidth,right=innerWidth-r.right,left=r.left;
 // справа, если не помещается — слева, на совсем узком экране заходит на край окна
 const x=right>=size+8?r.right+(right-size)/2:left>=size+8?(left-size)/2:r.right-size*.55;
 b.style.left=Math.round(x)+'px';b.style.top=Math.round(r.top+r.height*.24)+'px';
 b.onclick=async()=>{if(TRIAL_BY_AD&&!(await Y.rewarded('weapon_trial')))return;
  Run.trial={kind:Run.kind,idx,w:id};Snd.unlock();weaponUnlockFx(id);toast(t('{0} — только на этот уровень!',t(w.n)));b.remove();};
}
// показывает окно и возвращает true, если игрок взял оружие на уровень idx (в аркаде нет окна победы)
function trialOffer(idx){
 const id=trialPick(idx);if(!id)return Promise.resolve(false);
 GameStats.send('weapon_offer',{action:'shown',weapon:id,target_level:idx+1});
 const w=WEAPONS[id],im=SPR['icon_wpn_'+id];
 return new Promise(res=>{
  const done=ok=>{GameStats.send('weapon_offer',{action:ok?'accepted':'declined',weapon:id,target_level:idx+1});closeModal();if(ok){Run.trial={kind:Run.kind,idx,w:id};weaponUnlockFx(id);toast(t('{0} — только на этот уровень!',t(w.n)));}res(ok);};
  modal(`<div class="emb">${im?`<img src="${im.src}" alt="">`:''}</div><h3>${t('Особое предложение')}</h3><p>${t('Попробуй оружие на следующем уровне: <b>{0}</b>',t(w.n))}<br>${wpShort(w)}</p>
  <button class="btn ${TRIAL_BY_AD?'ad':'g'}" id="trY">${TRIAL_BY_AD?'🎬 ':''}${t('Взять на уровень')}</button><button class="btn" id="trN">${t('Нет, спасибо')}</button>`,{noClose:true,x:()=>done(false)});
  $('#trN').onclick=()=>done(false);
  $('#trY').onclick=async()=>{const yes=$('#trY'),no=$('#trN');yes.disabled=true;no.disabled=true;if(!TRIAL_BY_AD||await Y.rewarded('weapon_trial'))done(true);else{yes.disabled=false;no.disabled=false;}};
 });
}
// монеты уровня («мешок»): видны в кошельке сразу, но в сохранение попадают только при победе
function bagCoins(n){Run.bag=(Run.bag||0)+n;showCoins();}
function bankBag(fx){const n=Run.bag||0;Run.bag=0;if(!n)return;if(fx)rewardCoins(n);else{S.coins+=n;save();showCoins();}}
const FIRST_WIN_BONUS=50;  // v528: стартовые монеты за первую победу — игрок сразу видит награду
async function onWin(){
 bankBag();
 if(Run.kind==='story'){
  const i=Run.idx,stars=storyStars(),rw=storyReward(i)+(Run.def.firstMinutes?FIRST_WIN_BONUS:0),c=STORY[i];
  S.story.stars[i]=Math.max(S.story.stars[i]||0,stars);const was=S.story.open;S.story.open=Math.max(S.story.open,i+1);save();
  // v=396: до какой главы дошёл игрок — событие при каждой новой открытой главе
  if(S.story.open>was)GameStats.send('level_reached',{max_level:S.story.open+1,chapters_total:STORY.length});
  Y.score('story',Object.values(S.story.stars).reduce((a,b)=>a+b,0));
  const last=i>=STORY.length-1,actEnd=!last&&STORY[i+1].act!==c.act;
  const extra=Run.type==='run'?`<br>${t('Собрано монет')}: 🪙 ${Run.coinsGot}`:Run.type==='puzzle'?`<br>✂ ${t('Разрезов')}: ${Run.cuts} (${t('лучше всего')}: ${Run.def.par})`:'';
  modal(`<div class="emb"><img src="assets/ui/ui_win_emblem.png?v=${ASSET_V}" alt=""></div><h3>${chName(c)}</h3>${STARS(stars,'big')}<p>${t('Награда')}: 🪙 ${rw}${extra}${last?'<br><b>'+t('Ты прошёл всю историю!')+'</b>':actEnd?'<br><b>'+t('Акт пройден!')+'</b>':''}</p>
  <button class="btn ad" id="w2">🎬 ×${Econ.WIN_AD_MULT} · ${rw*Econ.WIN_AD_MULT} 🪙</button><button class="btn g" id="w1">${last?t('В меню'):t('Дальше')}</button>`,{noClose:true});
  let rewardTaken=false;
  // на телефоне вместо парящего пузыря сбоку от окна — карточка «Особое предложение» после награды
  const mobCard=document.body.classList.contains('is-mobile')&&!Run.def.firstMinutes&&!last&&STORY[i+1].type!=='puzzle';
  if(actEnd||last)GameStats.send(last?'story_completed':'story_act_completed',{act:c.act+1,stars_total:Object.values(S.story.stars).reduce((a,b)=>a+b,0)});
  const go=async(m,viaAd=false)=>{if(rewardTaken)return;rewardTaken=true;GameStats.send('win_reward_claimed',{multiplier:m,coins:rw*m,stars});addCoins(rw*m);closeModal();
   const next=async()=>{
    // v530: по просьбе пользователя после обучающей главы игра сразу продолжается второй главой (экран с подарком из v528 убран)
    if(last){if(!viaAd)await Y.interstitial('story_final');showMenu();return;}
    // после первого уровня — сразу обучение прокачке (улучшение и бита), потом вторая глава
    // v=446: прокачке учим уже внутри второго уровня (UpgradeCoach.tick), а не экраном между уровнями
    if((i===1||mobCard)&&(!TRIAL_BY_AD||Y.canReward()))await trialOffer(i+1);
    // хватает на биту: один раз показываем, как её купить, прямо перед следующей главой
    if(!Run.def.firstMinutes&&batTutWanted()&&!S.tut.batShown){S.tut.batShown=1;save();await new Promise(res=>heroScreen('story',{title:t('Новое оружие!'),play:id=>{Run.heroId=id;res();},back:res}));}
    // только что посмотрел рекламу ради оружия или ради ×3 награды — обычную не показываем
    // v525: иначе на Playgama сразу после ролика за награду грузилась ещё и межстраничная — секунды висел пройденный уровень, потом вторая реклама подряд
    if(!Run.def.firstMinutes&&!viaAd&&!(Run.trial&&Run.trial.idx===i+1)&&(i+1)%(PF.storyAdEvery||1)===0)await Y.interstitial('story_next');
    startStory(i+1,Run.heroId);};
   c.outro?showDialog(c.outro,next,last?t('Финал'):chName(c)):next();};
  $('#w2').onclick=async()=>{const b=$('#w2');if(b.disabled)return;b.disabled=true;if(await Y.rewarded('win_multiplier')){Snd.reward();go(Econ.WIN_AD_MULT,true);}else if(b.isConnected)b.disabled=false;};$('#w1').onclick=()=>go(1);
  if(!Run.def.firstMinutes&&!last&&i!==1&&!mobCard&&STORY[i+1].type!=='puzzle')trialBubble(i+1);
 }else{
  const wasIntro=!!Run.def.firstMinutes;Run.idx++;const rw=Econ.arcadeLevel(Run.idx);Run.coinsRun+=rw;addCoins(rw);
  if(Run.idx>S.arcadeBest){S.arcadeBest=Run.idx;Y.score('arcade',S.arcadeBest);}save();
  Run.heroHp=Run.hero?Math.min(1,heroHpFrac()+.3):Math.max(.6,Run.heroHp);
  toast(t('✅ Пройдено! +🪙 {0} · ❤️ +30%',rw));
  setTimeout(async()=>{if(!wasIntro&&!(await trialOffer(Run.idx))&&Run.idx%PF.arcadeAdEvery===0)await Y.interstitial('arcade_next');if(Mode===LevelMode)buildLevel(genArcade(Run.idx));},900);
 }
}
// проиграл главу больше двух раз подряд: попап с автоматом или базукой на эту главу за рекламу (один раз на главу за запуск).
// Взял — глава начинается заново с этим оружием; отказался — обычное окно поражения
function loseHelpOffer(){
 const key=Run.kind+':'+Run.idx;
 if(Run.kind!=='story'||Run.type==='puzzle'||Run.def?.firstMinutes||(Run.loseN||0)<=2||Run.helpOffered===key||trialWeapon()||!Y.canReward())return false;
 const list=['smg','bazooka'].filter(w=>!weaponOwned(w));if(!list.length)return false;
 Run.helpOffered=key;const id=pick(list),w=WEAPONS[id],im=SPR['icon_wpn_'+id];
 GameStats.send('weapon_offer',{action:'shown',weapon:id,target_level:Run.idx+1,source:'lose_streak',losses:Run.loseN});
 const done=ok=>{GameStats.send('weapon_offer',{action:ok?'accepted':'declined',weapon:id,target_level:Run.idx+1,source:'lose_streak'});closeModal();
  if(ok){Run.trial={kind:Run.kind,idx:Run.idx,w:id};weaponUnlockFx(id);toast(t('{0} — только на этот уровень!',t(w.n)));Run.nextRetry='restart';startStory(Run.idx,Run.heroId);}else onLose(true);};
 modal(`<div class="emb">${im?`<img src="${im.src}" alt="">`:''}</div><h3>${t('Не получается?')}</h3><p>${t('Возьми на эту главу: <b>{0}</b>',t(w.n))}<br>${wpShort(w)}</p>
  <button class="btn ad" id="lhY">🎬 ${t('Взять и попробовать снова')}</button><button class="btn" id="lhN">${t('Нет, спасибо')}</button>`,{noClose:true,x:()=>done(false)});
 $('#lhN').onclick=()=>done(false);
 $('#lhY').onclick=async()=>{const y=$('#lhY'),n=$('#lhN');y.disabled=n.disabled=true;if(await Y.rewarded('lose_weapon'))done(true);else{y.disabled=n.disabled=false;}};
 return true;
}
function onLose(skipHelp){
 if(!skipHelp&&loseHelpOffer())return;
 const arcade=Run.kind==='arcade',puzzle=Run.type==='puzzle';
 const canDouble=arcade&&Run.coinsRun>=10&&!Run.doubled&&Y.canReward();  // удвоение заработка за забег, один раз
 const canSkip=!arcade&&Run.idx<STORY.length-1&&Y.canReward();  // финал пропустить нельзя
 // v=396: «Воскреснуть и продолжить» за рекламу — до REVIVES_PER_LEVEL раз за уровень
 const canRevive=(Run.revives||0)<REVIVES_PER_LEVEL&&!puzzle&&!Run.captiveLost,canCp=Run.type==='run'&&Run.cp>0&&!Run.captiveLost&&(Run.cpUsed||0)<CP_FREE;  // v=461: 3 раза, потом кнопка пропадает
 const msg=arcade?t('Пройдено уровней: <b>{0}</b> · Рекорд: <b>{1}</b><br>Заработано: 🪙 {2}',Run.idx,S.arcadeBest,Run.coinsRun):(Run.loseWhy||t('Попробуй ещё раз'));
 // v=428: монеты, подобранные на уровне, лежат в «мешке» и сгорают, если уровень не пройден. Продолжение
 // (контрольная точка, воскрешение) их сохраняет
 const bag=Run.bag||0;  // v=446: кнопку «Сохранить монеты» за рекламу убрали
 const cpFree=true;  // v=461: с контрольной точки — только бесплатно, 3 раза за уровень (CP_FREE), без рекламы
 const bagLine=bag?`<br><span class="lose-bag">${t(canCp||canRevive?'Монеты уровня: 🪙 {0} — сгорят, если выйти или начать заново':'Монеты уровня сгорели: 🪙 {0}',bag)}</span>`:'';
 modal(`<div class="emb lose"><img src="assets/ui/ui_lose_emblem.png?v=${ASSET_V}" alt=""></div><h3>${arcade?t('Забег окончен'):puzzle?t('Попробуй ещё раз'):t('Поражение')}</h3><p>${msg}${bagLine}</p>
 ${canCp?`<button class="btn ${cpFree?'g':'ad'}" id="lc">${cpFree?'🚩':'🎬'} ${t('С контрольной точки')}${cpFree?'':''}</button>`:''}
 ${canRevive?`<button class="btn ad" id="lr">🎬 ${t(document.body.classList.contains('is-mobile')?'Воскреснуть':'Воскреснуть и продолжить')}</button>`:''}
 ${canDouble?`<button class="btn b" id="ldbl">🎬 ${t('Удвоить монеты')}: +🪙 ${Run.coinsRun}</button>`:''}
 ${puzzle&&hintAvail()?`<button class="btn ad" id="lhint">🎬 ${t('Подсказка')}</button>`:''}
 ${canSkip?`<button class="btn b" id="lskip">🎬 ${t('Пропустить уровень')}</button>`:''}
 ${canRestartLevel()?`<button class="btn g" id="la">↻ ${arcade?t('К таблице рекордов'):t('Заново')}</button>`:''}<button class="btn" id="lm">🏠 ${t('Меню')}</button>`,{noClose:true});
 // с контрольной точки — бесплатно в обоих режимах
 if(canCp)$('#lc').onclick=async()=>{if(!cpFree){const b=$('#lc');if(b.disabled)return;b.disabled=true;if(!(await Y.rewarded('checkpoint'))){if(b.isConnected)b.disabled=false;return;}}Run.cpUsed=(Run.cpUsed||0)+1;closeModal();respawnHero(Run.cp-30,0,'checkpoint');};
 if(canRevive)$('#lr').onclick=async()=>{if(await Y.rewarded('revive')){closeModal();revive();}};
 // пропуск: глава считается открытой, но без звёзд и награды
 if(canDouble)$('#ldbl').onclick=async()=>{if(!(await Y.rewarded('run_multiplier')))return;Run.doubled=true;rewardCoins(Run.coinsRun);closeModal();onLose(true);};
 if($('#lhint'))$('#lhint').onclick=takeHint;
 if(canSkip)$('#lskip').onclick=async()=>{if(!(await Y.rewarded('skip_level')))return;closeModal();S.story.open=Math.max(S.story.open,Run.idx+1);save();startStory(Run.idx+1,Run.heroId);};
 // окно и пауза держатся до конца рекламы: иначе на время её загрузки игра снималась с паузы; повторные нажатия игнорируются
 let leaving=false;const leave=(where,next)=>async()=>{if(leaving)return;leaving=true;document.querySelectorAll('#modal .btn').forEach(b=>b.disabled=true);recordRun();await Y.interstitial(where);closeModal();next();};
 if($('#la'))$('#la').onclick=leave(arcade?'arcade_records':'lose_restart',()=>{if(arcade)openArcadeLobby();else{Run.nextRetry='restart';startStory(Run.idx,Run.heroId);}});
 $('#lm').onclick=leave('lose_menu',showMenu);
}
// новый герой в точке x (после падения в яму или с контрольной точки)
function respawnHero(x,preservedBonus=0,retry='checkpoint'){
 if(!GameStats.attempt)GameStats.beginAttempt(retry);else if(retry!=='revive')GameStats.send('hero_respawned',{reason:retry});
 Run.deaths++;
 const old=Run.hero;if(old&&!old.removed){const q=old.parts.torso.position;juice(q.x,q.y,'#ffffff',12,3);removeEnt(old);}
 const h=Run.hero=spawnHero(x,preservedBonus);h.invuln=120;Run.statsChanged=false;RunHazards.onRespawn(x);
 for(const e of entities)if(e.type==='bomb'&&Math.abs(e.bodies[0].position.x-x)<300)removeEnt(e);
 juice(x,FLOOR-60,'#7dffb0',20,4);FX.heal(x,FLOOR-110);
 updateCam(true);Run.state='play';updateHud();
}
// точка на земле рядом с ямой: сначала край, с которого шли; если там другая яма или опасность — другой край, иначе последнее безопасное место
function besidePit(pit){
 const free=x=>x>60&&x<LW-60&&!PITS.some(q=>x>q[0]-50&&x<q[1]+50)&&!entities.some(e=>(e.type==='saw'||e.type==='mine'||e.type==='static'&&e.bodies[0].plugin.hazard)&&Math.abs(e.bodies[0].position.x-x)<110);
 return [pit[0]-80,pit[1]+80].find(free)??Run.safeX;
}
function revive(){
 if(!GameStats.attempt)GameStats.beginAttempt('revive');
 Run.reviveUsed=true;Run.revives=(Run.revives||0)+1;
 const h=Run.hero;
 // погиб над ямой или на кольях — возвращаем на твёрдую землю прямо перед ней
 const hp=h&&!h.removed?h.parts.torso.position:null,px=hp?hp.x:Run.diedX,pit=px!==undefined&&PITS.find(q=>px>q[0]-24&&px<q[1]+24);
 if(Run.def.climb){const node=Run.climbNodes.find(p=>p.y>(hp?.y??FLOOR)+55)||Run.climbNodes[0];respawnHero(node.x,0,'revive');const dy=node.y-65-Run.hero.parts.torso.position.y;for(const b of Run.hero.bodies)Body.translate(b,{x:0,y:dy});Run.climbPeak=Run.hero.parts.torso.position.y;Run.deaths--;updateCam(true);return;}
 if(!hp||pit||hp.y>FLOOR+80){respawnHero(pit?besidePit(pit):Run.safeX,0,'revive');Run.diedX=undefined;Run.deaths--;return;}
 // прокачался или сменил оружие после поражения: новый боец с новыми характеристиками на том же месте
 // v=472: воскрешение — с полным здоровьем (было 60%)
 if(Run.statsChanged){respawnHero(hp.x,0,'revive');Run.deaths--;Run.hero.hp=Run.hero.hpMax;updateHud();return;}
 healNpc(h,1);h.hp=h.hpMax;h.invuln=120;
 for(const e of entities)if(e.type==='bomb'){const p=e.bodies[0].position;if(Vector.magnitude(Vector.sub(p,h.parts.torso.position))<250)removeEnt(e);}
 juice(h.parts.torso.position.x,h.parts.torso.position.y,'#7dffb0',20,4);FX.heal(h.parts.head.position.x,h.parts.head.position.y-20);
 Run.state='play';updateHud();
}
/* ============ подсказка в головоломке за рекламу ============ */
const hintAvail=()=>Run.type==='puzzle'&&Run.kind==='story'&&!!HINTS[Run.idx]&&Run.hintFor!==Run.idx&&Y.canReward();
const hintOn=()=>Run.type==='puzzle'&&Run.kind==='story'&&Run.hintFor===Run.idx&&!!HINTS[Run.idx];
// после рекламы уровень начинается заново, потому что время разрезов считается от начала
async function takeHint(){if(!(await Y.rewarded('puzzle_hint')))return;closeModal();Run.hintFor=Run.idx;Run.nextRetry='hint';buildLevel(STORY[Run.idx]);toast(t('Подсказка включена'));}
function openHint(){
 if(Run.state!=='play')return;
 modal(`<h3>${t('Подсказка')}</h3><p>${t('Покажем, какую верёвку резать и когда. Уровень начнётся заново.')}</p><button class="btn ad" id="hY">🎬 ${t('Смотреть рекламу')}</button><button class="btn" id="hN">${t('Назад')}</button>`,{x:closeModal});
 $('#hY').onclick=takeHint;$('#hN').onclick=closeModal;
}
// HUD обновляется каждые 6 кадров: DOM меняем, только если текст действительно другой (иначе лишние пересчёты стилей на телефоне)
const setHtml=(el,html)=>{if(el&&el._html!==html){el._html=html;el.innerHTML=html;}};
function updateHud(){
 const h=Run.hero,def=Run.def;if(!def)return;
 const puzzle=Run.type==='puzzle';positionPuzzleTip();
 $('.hp').style.display=puzzle?'none':'';
 $('#pHint').style.display=hintAvail()?'':'none';
 $('#pRestart').style.display=canRestartLevel()?'':'none';
 if(h&&!puzzle){
  const st=heroStats(Run.kind,Run.heroId),ib=Math.max(1,h.hpMax-(h.tempHp||0)),f=h.removed?0:clamp(h.hp/ib,0,1),over=!!h.tempHp&&h.hp>ib;  // ib — полный запас без временного
  // крошечный остаток не превращаем в точку: полоса не уже скругления
  const wd=f>0?`max(${(f*100).toFixed(1)}%, 14px)`:'0';$('#hpbar i').style.width=wd;$('#hpbar em').style.width=wd;$('#hpbar').classList.toggle('low',f<=.3);$('#hpbar').classList.toggle('over',over);$('#hpnum').classList.toggle('over',over);
  const hp=Math.ceil((h.removed?0:Math.max(0,h.hp)/ib)*(st.hp+(boostActive()?50:0))),pv=+$('#hpnum').dataset.v;if(hp<pv){const b=$('.hp');b.classList.remove('hit');void b.offsetWidth;b.classList.add('hit');}
  $('#hpnum').dataset.v=hp;setHtml($('#hpnum'),`${hp}<small>/${st.hp+(boostActive()?50:0)}</small>`);
  if($('#hpico').dataset.id!==Run.heroId){$('#hpico').dataset.id=Run.heroId;$('#hpico').innerHTML=`<img src="assets/ui/portrait_${Run.heroId}.png?v=${ASSET_V}" alt="">`;}
  const upgrade=heroData(Run.kind,Run.heroId);
  $('#hpico').classList.toggle('upgrade-ready',!Tut.on&&!h.dead&&upgrade.lv<CombatBalance.recommended(Run.idx,Run.kind)&&S.coins>=lvCost(upgrade.lv,Run.kind));
  // патроны
  const wp=WEAPONS[h.weapon||'fists'],am=$('#ammo');
  if(wp&&wp.mag&&!h.dead){
   am.style.display='';
   if(h.reload>0){const progress=clamp(1-h.reload/wp.rl,0,1);setHtml(am,`<span class="reload-hud" role="progressbar" aria-label="${t('Перезарядка')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress*100)}"><i class="reload-progress" style="--reload-angle:${progress*360}deg"></i><img class="reload-arrows" src="assets/ui/icon_reload.png?v=${ASSET_V}" alt=""></span>`);}
   // огнемёт: шкала топлива вместо 90 значков
   else if(wp.type==='flame'){const k=clamp(h.ammo/wp.mag,0,1);setHtml(am,`<span class="fuel-hud"><img src="assets/ui/ui_ammo_fuel.png?v=${ASSET_V}" alt=""><i><b style="width:${Math.round(k*10)*10}%"></b></i></span>`);}
   else{const slots=Math.min(wp.mag,12),kind={spear:'spear',bow:'arrow',knife:'knife'}[h.weapon]||(wp.type==='rocket'?'rocket':wp.type==='throw'?'grenade':'bullet');
    setHtml(am,Array.from({length:slots},(_,i)=>`<i class="ammo-round ${kind} ${i<h.ammo?'full':'empty'}"></i>`).join('')+(h.ammo>slots?'<b>+'+(h.ammo-slots)+'</b>':''));}
   am.classList.toggle('low',h.ammo<=Math.ceil(wp.mag/4));
  }
  else am.style.display='none';
 }
 let obj='';
 if(def.obj==='kill')obj=`👊 ${t('Победи врагов')}: ${Math.min(Run.goalKills||0,Run.goalTotal||0)}/${Run.goalTotal||0}`;
 if(FirstMinutes.active)obj=FirstMinutes.objective();
 if(def.obj==='boss'){const b=entities.find(e=>e.boss&&!e.dead);obj=b?`👑 ${t('Босс')}: ${Math.ceil(b.hp/b.hpMax*100)}%`:'👑 '+t('Босс повержен!');}
 if(def.climb)obj=`↑ ${t('Поднимись к флажку')} · ${Math.round(clamp((FLOOR-h.parts.torso.position.y)/(FLOOR-Run.climbGoal.y),0,1)*100)}%`;
 if(def.obj==='survive')obj=`${t('Волна {0}',Run.waveIndex||1)} · ⏱ ${t('Продержись')}: ${Math.max(0,Math.ceil(Run.timer/60))}`;
 if(def.obj==='defend'){const g=Run.guard,f=g&&!g.dead?Math.ceil(g.hp/g.hpMax*100):0;obj=`🛡 ${g?npcName(g.kind):''}: ${f}% · ⏱ ${Math.max(0,Math.ceil(Run.timer/60))}`;}
 const md=$('#mods');if(md){const ms=(def.mods||[]).map(m=>`<span>${MODDEF[m].e} ${t(MODDEF[m].n)}</span>`).join('');if(md.dataset.v!==ms){md.dataset.v=ms;md.innerHTML=emo(ms);}/* эмодзи → иконки игры (ветер, ночь) */}
 if(Run.type==='run'){const p=h&&!h.removed?clamp(h.parts.torso.position.x/LevelMode.flag.x,0,1):0;
  obj=`🚩 ${Math.round(p*100)}%`+(Run.cagesTotal?` · 🔓 ${Run.freed}/${Run.cagesTotal}`:'')+` · 🪙 ${Run.coinsGot}`;}
 if(puzzle){const g=def.goal==='both'?t('Победи врагов и спаси пленника'):def.goal==='kill'?t('Победи врагов'):t('Доставь пленника к флажку');obj=`✂ ${Run.cuts} · ${g}`;}
 if(Run.state==='ending')obj=Run.won?'🏆 '+t('Победа!'):'💀 '+t('Поражение');
 setHtml($('#obj'),emo(obj));
 const lv=def.introBattle?chName(def):Run.kind==='story'?`${t('Глава {0}',Run.idx+1)}: ${chName(def)}`:`${def.n} · <span style="color:${DANGER[def.tier][1]}">${t(DANGER[def.tier][0])}</span>`;
 const lvKey=lv+'|'+innerWidth+'|'+innerHeight+'|'+puzzle;
 if(lvKey!==lvFit){lvFit=lvKey;$('#lvname').innerHTML=lv;fitLvName();}
}
// лента с названием не должна заезжать на полоску здоровья и кнопку паузы: сначала уменьшаем шрифт, а если места совсем мало — опускаем ленту под полоску
let lvFit='';
function fitLvName(){
 const el=$('#lvname'),box=el.parentElement,hp=$('.hp');
 el.style.fontSize='';el.style.maxWidth='none';box.style.marginTop='';box.style.maxWidth='none';
 if(document.body.classList.contains('mob-p'))return;
 // лента по центру экрана: не заходит ни на полоску здоровья слева, ни на кошелёк с кнопками справа
 const grp=$('#hud .grp'),hpR=hp&&hp.offsetWidth?hp.getBoundingClientRect().right:0,grpL=grp&&grp.offsetWidth?grp.getBoundingClientRect().left:innerWidth,side=Math.max(hpR+10,innerWidth-grpL+10),room=innerWidth-side*2;
 const cs=getComputedStyle(el),pad=['Left','Right'].reduce((a,q)=>a+parseFloat(cs['border'+q+'Width'])+parseFloat(cs['padding'+q]),0);
 const base=parseFloat(cs.fontSize),need=el.offsetWidth;
 // поля ленты не масштабируются, поэтому считаем только по тексту
 const fit=w=>{const k=(w-pad)/(need-pad);if(k<1)el.style.fontSize=(base*k*.97).toFixed(1)+'px';el.style.maxWidth=w+'px';box.style.maxWidth=w+'px';};
 if((room-pad)/(need-pad)>=.62)return fit(room);
 // места совсем мало: лента идёт отдельной строкой под полоской здоровья
 box.style.marginTop=(hp&&hp.offsetWidth?hp.offsetHeight+4:0)+'px';
 fit(Math.min(need,innerWidth-24));
}
