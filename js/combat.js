'use strict';
/* ============ оружие, бойцы, ИИ ============ */
// type: melee — удар по дуге; gun — мгновенный выстрел лучом; throw — бросок гранаты
// mag — патронов в обойме, rl — время перезарядки (кадры)
// lock: 0 — есть сразу, число — монеты, 'ad' — за рекламу
// v=394, баланс: цена растёт с силой. Урон в секунду с учётом перезарядки (одна цель): бита ≈34, меч ≈40, топор ≈41, молот ≈35
// (сильнее отбрасывает), пистолет ≈27, калаш ≈36, дробовик ≈37 (вблизи), копьё ≈15 (втыкается, сильно отбрасывает), ножи ≈17 (сбивают),
// лук ≈14, базука и гранаты — по площади, огнемёт ≈27 по одному и ≈96 по толпе, но бьёт только вблизи — самый дорогой
const WEAPONS={
 fists:{n:'Палка',e:'👊',type:'melee',dmg:10,cd:22,len:14,kb:3,sw:10,lock:0},
 sword:{n:'Меч',e:'🗡️',type:'melee',dmg:20,cd:30,len:46,kb:5,sw:12,lock:'ad',cut:.4},
 bat:{n:'Бита',e:'🏏',type:'melee',dmg:16,cd:28,len:42,kb:10,sw:13,lock:250},
 axe:{n:'Топор',e:'🪓',type:'melee',dmg:34,cd:50,len:42,kb:8,sw:16,lock:1400,cut:.6},
 hammer:{n:'Молот',e:'🔨',type:'melee',dmg:26,cd:44,len:44,kb:14,sw:16,lock:900},  // v=433: молот за монеты; цены оружия подняты и растут вместе с уроном  // 2026-11-10: молот и ножи — за рекламу, пистолет — за монеты
 pistol:{n:'Пистолет',e:'🔫',type:'gun',dmg:16,cd:26,spread:.05,len:22,pellets:1,mag:8,rl:80,lock:1600},
 smg:{n:'Калаш',e:'💥',type:'gun',dmg:7,cd:7,spread:.13,len:36,pellets:1,mag:25,rl:120,lock:2600},
 shotgun:{n:'Дробовик',e:'🧨',type:'gun',dmg:8,cd:50,spread:.28,len:38,pellets:6,kb:4,mag:4,rl:110,lock:3200},
 grenade:{n:'Гранаты',e:'💣',type:'throw',cd:80,power:.06,radius:190,mag:3,rl:160,lock:'ad'},
 bazooka:{n:'Базука',e:'🚀',type:'rocket',cd:60,len:60,power:.085,radius:210,mag:1,rl:130,lock:4500},
};
// боец без оружия держит палку; связанные и висящие пленники — нет
const holdsStick=e=>(!e.weapon||e.weapon==='fists')&&e.team>=0&&!e.hung&&!e.caged;
const weaponOwned=id=>WEAPONS[id].lock===0||S.all||S.weapons[id];
// песочница: своё оружие, открывается отдельно от сюжета и аркады (v=393); как и предметы песочницы, в режиме разработчика открыто
const sbWeaponOwned=id=>id==='fists'||WEAPONS[id].lock===0||S.all||S.dev||!!S.sbWeapons?.[id];  // режим разработчика оружие не открывает: его покупают за бесконечные монеты
// разбег: сколько кадров бежать в одну сторону, чтобы разогнаться; замах: с какого кадра удержания начинается сильный удар и сколько до полного
const SPRINT_T=40,CH_MIN=12,CH_FULL=34;

function slipFall(ent){
 const t=ent.parts.torso,d=Math.sign(t.velocity.x)||ent.facing||1;
 for(const k of ['ulL','ulR','llL','llR'])if(ent.attached.has(k)){const b=ent.parts[k];Body.setVelocity(b,{x:b.velocity.x+d*7,y:-3.5});}
 Body.setVelocity(t,{x:t.velocity.x-d*1.5,y:-2.5});Body.setAngularVelocity(t,-d*.28);ent.stun=Math.max(ent.stun||0,55);ent.grounded=-99;
 const q=t.position;dust(q.x,q.y+40,6,d);floats.push({x:q.x,y:q.y-50,t:'!',life:30,c:'#9fe3ff',pop:1});if(onScreen(q.x,0))Snd.swish&&Snd.swish();
}
// рабочая рука: правая, а если её отрезали — левая
function armSide(ent){const a=ent.attached;if(a.has('uaR')&&a.has('laR'))return['uaR','laR'];if(a.has('uaL')&&a.has('laL'))return['uaL','laL'];return null;}
function handPart(ent){const s=armSide(ent);return s?ent.parts[s[1]]:null;}
function handPos(ent){const la=handPart(ent)||ent.parts.laR;return Vector.add(la.position,Vector.rotate({x:0,y:la.plugin.h/2},la.angle));}
function armDir(ent){return Vector.rotate({x:0,y:1},(handPart(ent)||ent.parts.laR).angle);}
// A throw has an actual wind-up, forward stroke, release and follow-through.
// лук: тетива натягивается (у игрока 14 кадров, у врага дольше — успеешь увернуться), стрела слетает с тетивы,
// тетива дрожит. Целится по ходу натяжения: игрок может довести прицел мышью
const BowMotion={
 start(ent,wp){
  if(ent.bowDraw||!armSide(ent))return;
  const dur=ent.isPlayer?14:24;ent.bowDraw={start:frame,dur};ent.atkCd=wp.cd+dur;
  if(!ent.isPlayer)FX.excl(ent);Snd.play('rope',.5,.8);
 },
 update(ent){
  const m=ent.bowDraw;if(!m)return;
  if(ent.dead||ent.stun>0||ent.weapon!=='bow'||!armSide(ent)||ent.hung||ent.caged){ent.bowDraw=null;return;}
  if(frame-m.start<m.dur)return;
  ent.bowDraw=null;const wp=WEAPONS.bow;attack(ent,wp,ent.aim||{x:ent.parts.torso.position.x+ent.facing*200,y:ent.parts.torso.position.y},0,true);ent.atkCd=wp.cd;ent.bowSnap=frame;
  const m2=weaponMuzzle(ent);FX.sparkle(m2.x,m2.y,18);if(ent.isPlayer||onScreen(m2.x,0))Snd.twang();
 },
 // натяжение 0..1 и дрожание тетивы после выстрела
 pull(ent){const m=ent.bowDraw;if(!m)return 0;const k=clamp((frame-m.start)/m.dur,0,1);return 1-(1-k)*(1-k);},
 twang(ent){const a=frame-(ent.bowSnap??-99);return a<12?Math.sin(a*2.1)*3.2*(1-a/12):0;}
};
/* ---------- супер-удар босса: удар по земле ---------- */
// Раз в SLAM_GAP кадров (с разбросом) босс, стоя рядом с целью, готовит удар: на земле загорается красная зона
// (SLAM_WARN кадров — успеешь подпрыгнуть или отбежать), он подпрыгивает и обрушивается. Ударная волна ранит и
// подбрасывает всех, кто стоит на земле в зоне; кто в прыжке — цел. Пыль, трещина, тряска, звук взрыва
const SLAM_GAP=420,SLAM_WARN=46,SLAM_R=230,SLAM_DMG=22;
const BossSlam={
 tryStart(ent){
  if(!ent.boss||ent.dead||ent.slam||ent.stun>0||ent.hung||Mode.id!=='level'||Run.state!=='play'||Tut.on)return;
  if(ent.slamNext===undefined){ent.slamNext=frame+240+ri(0,180);return;}
  const tg=ent.target;if(frame<ent.slamNext||!tg||tg.dead||frame-ent.grounded>3)return;
  const tp=ent.parts.torso.position,dx=Math.abs(tg.parts.torso.position.x-tp.x);if(dx>SLAM_R*1.4||dx<30)return;
  const feet=Math.max(...['llL','llR'].filter(k=>ent.attached.has(k)).map(k=>ent.parts[k].bounds.max.y),tp.y+40);
  ent.slam={phase:'warn',t:0,x:tp.x,y:feet,dir:Math.sign(tg.parts.torso.position.x-tp.x)||ent.facing||1};
  ent.slamNext=frame+SLAM_GAP+ri(0,200);FX.excl(ent);Snd.charged();
  if(!S.tut.bossSlam){S.tut.bossSlam=1;save();showTip(t('Босс бьёт по земле! Увидишь «!» над ним — подпрыгни или отбеги'));}
 },
 update(ent){
  const s=ent.slam;if(!s)return;
  if(ent.dead||ent.removed||ent.hung||Run.state!=='play'){ent.slam=null;return;}
  s.t++;
  const tp=ent.parts.torso.position;
  if(s.phase==='warn'){
   s.x=tp.x;// зона идёт за боссом, пока он готовится
   // меток на земле нет (2026-11-09): удар выдают «!» над боссом, пыль из-под ног и дрожь перед прыжком
   if(frame%4===0)dust(tp.x+rnd(-30,30),s.y-2,3,rnd(-1,1));
   if(s.t>SLAM_WARN*.5)for(const b of ent.bodies)if(ent.attached.has(b.plugin.part))Body.setVelocity(b,{x:b.velocity.x+rnd(-.6,.6),y:b.velocity.y});
   if(s.t>=SLAM_WARN){s.phase='air';s.t=0;for(const b of ent.bodies)if(ent.attached.has(b.plugin.part))Body.setVelocity(b,{x:s.dir*2.2,y:-11.5});Snd.jump();}
   return;
  }
  if(s.phase==='air'){
   // вниз — с ускорением, чтобы удар был тяжёлым
   if(s.t>10)for(const b of ent.bodies)if(ent.attached.has(b.plugin.part)&&b.velocity.y<14)Body.setVelocity(b,{x:b.velocity.x*.96,y:b.velocity.y+.9});
   if((s.t>14&&frame-ent.grounded<2)||s.t>70){this.impact(ent,s);ent.slam=null;}
  }
 },
 impact(ent,s){
  const x=ent.parts.torso.position.x,y=Math.min(FLOOR,s.y);
  shake=Math.min(14,shake+11);if(Mode.id==='level')hitStop=Math.max(hitStop,3);
  Snd.boom(false);Snd.hit(18);
  FX.shock(x,y-6,SLAM_R*.9);FX.ring(x,y-10,SLAM_R*.55);FX.word(x,y-150,'boom',110);
  // волна пыли бежит по земле в обе стороны
  for(const d of [-1,1])for(let i=0;i<7;i++)FX.cloud(x+d*(20+i*30),y-10-rnd(0,8),58-i*5,d*(2.2+i*.45),-.2-rnd(0,.25),'#ead9bd');
  for(let i=0;i<26;i++)particles.push({x:x+rnd(-40,40),y:y-4,vx:rnd(-7,7),vy:rnd(-9,-3),life:rnd(26,46),c:pick(['#8a5a2e','#6b4422','#c9a26a','#e8dcc8']),r:rnd(2,4.5)});
  addDecal({scorch:true,x,y:FLOOR,r:SLAM_R*.35});
  flashes.push({x,y:y-20,r:120,life:8});
  for(const e of entities){
   if(!isEnemy(ent,e))continue;
   const p=e.parts.torso.position,dx=p.x-x;if(Math.abs(dx)>SLAM_R)continue;
   const feet=Math.max(...['llL','llR'].filter(k=>e.attached.has(k)).map(k=>e.parts[k].bounds.max.y),p.y+30);
   if(frame-e.grounded>5||Math.abs(feet-y)>70)continue; // в прыжке или на другой высоте — мимо
   const k=1-Math.abs(dx)/SLAM_R*.5,dir=Math.sign(dx)||s.dir;
   damageNpc(e,SLAM_DMG*(ent.dmgMul||1)*k*(e.isPlayer&&Mode.id==='level'?.8:1),p.x,feet,ent);
   for(const b of e.bodies)if(e.attached.has(b.plugin.part))Body.setVelocity(b,{x:b.velocity.x+dir*7*k,y:-7.5*k});
   e.stun=Math.max(e.stun||0,30);
  }
  // предметы рядом подпрыгивают
  for(const e of entities)if(e.item&&e.bodies[0]&&!e.bodies[0].isStatic){const b=e.bodies[0];if(Math.abs(b.position.x-x)<SLAM_R&&Math.abs(b.position.y-y)<90)Body.setVelocity(b,{x:b.velocity.x+Math.sign(b.position.x-x)*3,y:-6});}
 },
 // красная зона на земле: пульсирует чаще перед самым ударом
 draw(){
  for(const ent of entities){
   const s=ent.slam;if(!s||s.phase==='impact')continue;
   const left=s.phase==='warn'?1-s.t/SLAM_WARN:0,pulse=.5+.5*Math.sin(frame*(left>.4?.35:.8));
   ctx.save();ctx.translate(s.x,Math.min(FLOOR,s.y)-2);ctx.scale(1,.18);
   const g=ctx.createRadialGradient(0,0,SLAM_R*.2,0,0,SLAM_R);g.addColorStop(0,`rgba(255,70,40,${.18+.2*pulse})`);g.addColorStop(.85,`rgba(255,40,30,${.3+.3*pulse})`);g.addColorStop(1,'rgba(255,40,30,0)');
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,SLAM_R,0,7);ctx.fill();
   ctx.lineWidth=10;ctx.strokeStyle=`rgba(255,235,120,${.5+.5*pulse})`;ctx.beginPath();ctx.arc(0,0,SLAM_R*(.92+.08*(1-left)),0,7);ctx.stroke();
   ctx.restore();
  }
 }
};
const ThrowMotion={
 isWeapon(id){return ['spear','knife','grenade'].includes(id);},
 start(ent,wp,aim){
  if(ent.throwMotion||!armSide(ent))return;
  // копьё: замах длиннее и заметнее (свечение в руке нарастает), бросок резче
  const wind=ent.weapon==='knife'?8:ent.weapon==='spear'?17:11,stroke=ent.weapon==='knife'?6:ent.weapon==='spear'?6:8;
  ent.throwMotion={weapon:ent.weapon,side:armSide(ent)[0],start:frame,wind,release:wind+stroke,end:wind+stroke+9,aim:{x:aim.x,y:aim.y},facing:ent.facing||1,released:false};
  ent.atkCd=wp.cd+wind+stroke;
  if(!ent.isPlayer)FX.excl(ent);
 },
 pose(ent){
  const m=ent.throwMotion;if(!m)return null;
  const age=frame-m.start,d=m.facing,t=ent.parts.torso.position;
  const base=Math.atan2(m.aim.y-t.y,m.aim.x-t.x)-Math.PI/2;
  const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
  let upper,lower;
  if(age<m.wind){const k=ease(age/m.wind);upper=base-d*.95*k;lower=base-d*2.1*k;}
  else if(age<m.release){const k=ease((age-m.wind)/(m.release-m.wind-2));upper=base-d*.95*(1-k);lower=base-d*2.1*(1-k)+d*.18*k;}
  else{const k=ease((age-m.release)/(m.end-m.release));upper=base+d*.7*k;lower=base+d*(.18+.65*k);}
  return {upper,lower};
 },
 update(ent){
  const m=ent.throwMotion;if(!m)return;
  if(ent.dead||ent.stun>0||ent.hung||ent.caged||(grab&&ent.bodies.includes(grab.body))||ent.weapon!==m.weapon||armSide(ent)?.[0]!==m.side){ent.throwMotion=null;return;}
  ent.facing=m.facing;
  const age=frame-m.start;
  if(!m.released&&age>=m.release){m.released=true;attack(ent,WEAPONS[m.weapon],ent.isPlayer&&ent.aim?ent.aim:m.aim,0,true);
   if(m.weapon==='spear'){Snd.heavy();if(ent.isPlayer)shake=Math.min(12,shake+2.5);const hp=handPos(ent);for(let i=0;i<6;i++)particles.push({x:hp.x,y:hp.y,vx:-m.facing*rnd(1,3),vy:rnd(-1.5,.5),life:rnd(12,20),c:'#ffffff',r:rnd(1.5,3),fire:true});}}
  if(age>=m.end)ent.throwMotion=null;
 }
};
// пленник на верёвке или в клетке ни с кем не дерётся, и его никто не трогает
function isEnemy(a,b){return b!==a&&b.type==='npc'&&!b.dead&&!b.removed&&!b.hung&&!b.caged&&a.team>=0&&b.team>=0&&a.team!==b.team;}
function nearestEnemy(ent,maxD){
 const p=ent.parts.torso.position;let best=null,bd=maxD||1e9;
 for(const e of entities){if(!isEnemy(ent,e))continue;const d=Vector.magnitude(Vector.sub(e.parts.torso.position,p));if(d<bd){bd=d;best=e;}}
 return best;
}
function fightingNow(ent){return !ent.dead&&!ent.hung&&!ent.caged&&ent.team>=0&&(ent.isPlayer||(ent.ai&&Mode.fightOn&&Mode.fightOn()));}
const legCount=ent=>(ent.attached.has('llL')?1:0)+(ent.attached.has('llR')?1:0);
function hasJumpSupport(ent){
 if(ent.parts.torso.velocity.y< -2||frame-(ent.lastJumpAt??-99)<10)return false;
 const supports=Composite.allBodies(world).filter(b=>!b.isSensor&&!b.plugin.stakes&&(b.isStatic||b.plugin.ent?.type==='obj'));
 return ['llL','llR'].some(part=>{
  if(!ent.attached.has(part))return false;
  const foot=ent.parts[part],a=foot.bounds;
  return supports.some(b=>{
   const gap=b.bounds.min.y-a.max.y;
   return gap>=-16&&gap<=18&&foot.position.y<b.position.y&&a.max.x>b.bounds.min.x+2&&a.min.x<b.bounds.max.x-2;
  });
 });
}

// верх опоры прямо под ступнями (земля, платформа, ящик) или null; та же проверка, что у hasJumpSupport
function supportTop(ent){
 let best=null;const t=ent.parts.torso;
 for(const b of Composite.allBodies(world)){
  if(b.isSensor||b.plugin.stakes||!(b.isStatic||b.plugin.ent?.type==='obj'))continue;
  for(const part of ['llL','llR']){
   if(!ent.attached.has(part))continue;const a=ent.parts[part].bounds,gap=b.bounds.min.y-a.max.y;
   if(gap>=-16&&gap<=18&&t.position.y<b.bounds.min.y&&a.max.x>b.bounds.min.x+2&&a.min.x<b.bounds.max.x-2)best=best===null?b.bounds.min.y:Math.min(best,b.bounds.min.y);
  }
 }
 return best;
}
// шаг: фаза растёт от пройденного пути, поэтому опорная нога не скользит. Ноги ставятся по расчёту (физика утаскивала их назад),
// корпус держится на высоте стойки и слегка покачивается, свободные руки идут навстречу ногам
function stepGait(ent,d,sprint){
 const P=ent.parts,t=P.torso,L=P.ulL.plugin.h+P.llL.plugin.h,A=sprint?.72:.52,K=sprint?1.3:1;
 const v=Math.abs(t.velocity.x);
 ent.gait=(ent.gait||0)+v*2*Math.PI/(4*L*Math.sin(A));
 ent.gaitAmp=Math.min(1,(ent.gaitAmp||0)+(v>.25?.12:-.08));if(ent.gaitAmp<0)ent.gaitAmp=0;
 const amp=ent.gaitAmp;
 // тело держим на высоте, с которой пошли; лёгкая волна на каждый шаг
 // v=429: корпус ставится от верха опоры под ногами (земля, платформа) на длину ноги в полный рост — ступни не утопают в земле;
 // нет опоры рядом — по высоте стойки, как раньше. У героя корпус почти не качается
 const top=ent.standOff?supportTop(ent):null,base=top!==null?top-ent.standOff:ent.standY;
 const y=t.position.y,bob=ent.isPlayer?.012:.05,want=(base===undefined?y:base)-Math.abs(Math.cos(ent.gait))*L*bob*amp;
 Body.setVelocity(t,{x:t.velocity.x,y:clamp((want-y)*.35,-4,4)});
 // точки сустава в Matter уже повёрнуты на угол тела из прошлого решения (angleA/angleB), поэтому поворачиваем только на разницу
 const put=(b,part,c,ang)=>{const j=Vector.add(part.position,Vector.rotate(c.pointA,part.angle-c.angleA));Body.setPosition(b,Vector.sub(j,Vector.rotate(c.pointB,ang-c.angleB)));Body.setAngle(b,ang);Body.setVelocity(b,t.velocity);Body.setAngularVelocity(b,0);};
 for(const [u,l,nu,nl,off] of [[P.ulL,P.llL,'ulL','llL',0],[P.ulR,P.llR,'ulR','llR',Math.PI]]){
  const p=ent.gait+off,tu=-d*A*Math.sin(p)*amp,tl=tu+d*K*Math.max(0,Math.cos(p))*amp;
  const ju=ent.joints[nu],jl=ent.joints[nl];
  put(u,t,ju,t.angle*.3+tu);put(l,u,jl,t.angle*.3+tl);
 }
 const side=armSide(ent),busy=(ent.weapon&&ent.weapon!=='fists')||holdsStick(ent)||ent.swing>0||ent.charge>0,drive=(b,to,k)=>Body.setAngularVelocity(b,b.angularVelocity*.35+normA(to-b.angle)*k);
 for(const [ua,la,n,off] of [[P.uaL,P.laL,'uaL',Math.PI],[P.uaR,P.laR,'uaR',0]]){
  if(!ent.attached.has(n)||(busy&&side&&side[0]===n))continue;
  const a=-d*.55*Math.sin(ent.gait+off)*amp;drive(ua,a,.22);drive(la,a-d*.5*amp,.22);
 }
}
function updateFighter(ent){
 const P=ent.parts,t=P.torso;
 updHead(ent);
 if(ent.stun>0)ent.stun--;if(ent.hpShow>0)ent.hpShow--;if(ent.invuln>0)ent.invuln--;if(ent.flash>0)ent.flash--;
 if(ent.trail){for(const p of ent.trail)p.l--;ent.trail=ent.trail.filter(p=>p.l>0);}
 if(--ent.blink<0)ent.blink=rnd(90,240);
 if(ent.atkCd>0)ent.atkCd--;if(ent.jumpCd>0)ent.jumpCd--;
 drip(ent);
 if(ent.dead){ent.throwMotion=null;ent.target=null;if(frame%20===0&&Math.random()<.3)juice(t.position.x,t.position.y,NPC[ent.kind].juice,1,1);return;}
 if(ent.bleed>0){ent.bleed--;if(frame%12===0)damageNpc(ent,1,t.position.x,t.position.y,null);}
 const grabbed=grab&&ent.bodies.includes(grab.body);
 const grounded=frame-ent.grounded<4;
 // после увеличения лупой — не подпрыгивает: первые 45 кадров вверх не летит
 if(ent.growSettle>frame)for(const b of ent.bodies)if(b.velocity.y<-.5)Body.setVelocity(b,{x:b.velocity.x*.8,y:-.5});
 // v=396: на льду (предмет «Лёд» в песочнице) бойцы скользят и время от времени поскальзываются и падают
 // v=453: на льду (предмет «Лёд» и уровни «Гололёд») поскальзываются и падают чаще: на бегу 1/30 за кадр (было 1/70),
 // при развороте на скорости — 1/6; между падениями не меньше 1,5 с
 {const onIce=frame-(ent.onIceAt??-99)<4,vx=Math.abs(ent.parts.torso.velocity.x);
  if(grounded&&onIce&&ent.stun<=0&&!ent.dead&&vx>1&&frame-(ent.slipAt??-999)>90){
   const turn=ent.ctrl&&ent.ctrl.move&&Math.sign(ent.ctrl.move)!==Math.sign(ent.parts.torso.velocity.x)&&vx>1.2;
   if(Math.random()<(turn?1/6:1/30)){ent.slipAt=frame;slipFall(ent);}}}
 const dashing=ent.isPlayer&&frame<(ent.dashUntil||0);
 const fighting=fightingNow(ent);
 if(fighting&&ent.ai)aiThink(ent);
 // стараются стоять ровно
 // v=429: на ходу ступни ставятся расчётом и висят на 1–6 px над опорой, поэтому касания нет; через 18 кадров шаг
 // выключался, герой проседал и подскакивал (цикл ~24 кадра). Опора прямо под ступнями — значит стоим
 if(ent.gaitOn&&frame-ent.grounded>=2&&(ent.isPlayer||frame%3===0)&&hasJumpSupport(ent))ent.grounded=frame;
 // идёт ли шаг: двумя ногами, по своей воле; тогда ноги ведёт stepGait, а не выпрямление.
 // v549: у героя опора проверяется каждый кадр (строка выше), поэтому запас без опоры — 5 кадров, а не 18:
 // за 18 кадров шаг держал корпус в воздухе, и герой пробегал над ямой с кольями шириной до ~130 px
 // и «бежал по воздуху» с края платформы
 const stepping=!dashing&&fighting&&ent.ctrl&&ent.ctrl.move&&ent.stun<=0&&!grabbed&&!ent.tackle&&!zeroG&&legCount(ent)===2&&frame-ent.grounded<(ent.isPlayer?5:18)&&(ent.jumpCd||0)<=20&&frame-(ent.bounced||-99)>30;
 if(!stepping&&grounded&&Math.abs(t.velocity.y)<1){ent.standY=t.position.y;  // высота стойки для шага
  const foot=Math.max(P.llL.bounds.max.y,P.llR.bounds.max.y)-t.position.y;if(foot>(ent.standOff||0))ent.standOff=foot;}  // от корпуса до ступней в полный рост
 if(stepping!==!!ent.gaitOn){ent.gaitOn=stepping;P.llL.friction=P.llR.friction=stepping?.05:.8;if(!stepping)ent.gaitAmp=0;}  // ступни не цепляются за землю, пока идём
 if(ent.stun<=0&&!grabbed&&!zeroG&&!ent.tackle){
  const a=normA(t.angle-(stepping?Math.sign(ent.ctrl.move)*(ent.runT>SPRINT_T?.2:.08):0));  // на ходу корпус чуть наклонён вперёд
  Body.setAngularVelocity(t,t.angularVelocity*.85-a*.06);
  const legs=legCount(ent);
  if((grounded||stepping)&&legs>0&&Math.abs(a)<.9){
   const up=ent.liftMass*engine.gravity.y*engine.gravity.scale*1.05;
   Body.applyForce(t,t.position,{x:0,y:-up});
   if(!stepping)for(const l of [P.llL,P.llR,P.ulL,P.ulR])Body.setAngularVelocity(l,l.angularVelocity*.8-normA(l.angle)*.08);
  }
 }
 // связанный: руки прижаты к телу
 if(ent.caged||ent.guard)for(const [n,sg] of [['uaL',.12],['laL',.06],['uaR',-.12],['laR',-.06]]){const b=P[n];Body.setAngularVelocity(b,b.angularVelocity*.4+normA(t.angle+sg-b.angle)*.3);}
 if(!fighting){ent.throwMotion=null;ent.target=null;ent.charge=0;ent.runT=0;return;}
 const c=ent.ctrl,wid=ent.weapon||'fists',wp=WEAPONS[wid];
 // обойма: при смене оружия — полная; кончились патроны — перезарядка
 if(ent.ammoW!==wid){ent.ammoW=wid;ent.ammo=wp.mag||0;ent.reload=0;}
 if(ent.reload>0&&--ent.reload===0){ent.ammo=wp.mag;if(ent.isPlayer||onScreen(t.position.x,0))Snd.reloadDone();}
 if(ent.isPlayer)ent.target=nearestEnemy(ent,750);
 // ближний бой: герой разворачивается к врагу, только когда тот рядом. Иначе он смотрит туда, куда идёт игрок,
 // и может ударить ящик за спиной (обучение в первой главе застревало, если игрок проскочил ящик рывком)
 ent.aimLock=!!ent.target&&(!ent.isPlayer||wp.type!=='melee'||Math.abs(ent.target.parts.torso.position.x-t.position.x)<reachOf(ent,wid)+150);
 const legs=legCount(ent);
 // разбег: бежим в одну сторону по земле — разгоняемся
 const dir=Math.sign(c.move);
 if(dir&&dir===ent.runDir&&legs===2&&ent.stun<=0&&(grounded||ent.runT>0))ent.runT++;else if(!dir||dir!==ent.runDir||ent.stun>0)ent.runT=0;
 if(dir)ent.runDir=dir;
 const sprint=ent.runT>SPRINT_T&&!ent.charge;
 // движение
 if(c.move&&ent.stun<=0&&!grabbed&&!ent.tackle&&!dashing){
  if(!(ent.aimLock||ent.isPlayer&&c.aim)||sprint)ent.facing=dir;
  const crawl=legs===0&&frame-ent.touch<4;
  const tv=c.move*ent.speed*(ent.lootSpeedUntil>frame?1.25:1)*(ent.isPlayer?1.12:1)*(legs===2?1:legs===1?.6:.5)*(sprint?1.45:1)*(ent.charge>CH_MIN?.55:1),k=(grounded&&legs>0)||crawl?(frame-(ent.onIceAt??-99)<4&&grounded?.04:ent.isPlayer?.34:.22):ent.isPlayer?.18:.05;
  const own=ent.bodies.filter(b=>ent.attached.has(b.plugin.part));
  if(crawl){Body.setAngularVelocity(t,t.angularVelocity+Math.sin(frame*.45)*.06);if(frame%22===0)for(const b of own)Body.setVelocity(b,{x:b.velocity.x,y:Math.min(b.velocity.y,-3)});}
  if(legs===1&&grounded&&frame%18===0)for(const b of own)Body.setVelocity(b,{x:b.velocity.x,y:Math.min(b.velocity.y,-4.5)});
  Body.setVelocity(t,{x:t.velocity.x+(tv-t.velocity.x)*k,y:t.velocity.y});
  if(ent.gaitOn)stepGait(ent,dir,sprint);
  if(sprint&&grounded&&frame%5===0)dust(t.position.x,FLOOR-3,2,dir);
 }
 // отпустил кнопку на платформе — тормозим, иначе герой уезжает с неё по инерции
 if(ent.isPlayer&&!c.move&&!dashing&&!ent.tackle&&ent.stun<=0&&!grabbed&&!(frame-(ent.onIceAt??-99)<4)&&(grounded||frame-(ent.platF||-99)<24))for(const b of ent.bodies)if(ent.attached.has(b.plugin.part))Body.setVelocity(b,{x:b.velocity.x*.7,y:b.velocity.y});
 // при беге ноги касаются опоры редко: игроку прощаем нажатие чуть раньше касания и чуть позже отрыва
 if(ent.isPlayer){
  if(c.jump&&!ent.jumpWasHeld)ent.jumpBuf=12;
  else ent.jumpBuf=Math.max(0,(ent.jumpBuf||0)-1);
  ent.jumpWasHeld=c.jump;
 }
 const wantJump=ent.isPlayer?ent.jumpBuf>0:c.jump;
 const canJump=legs>0?(ent.isPlayer?frame-ent.grounded<8||wantJump&&hasJumpSupport(ent):grounded):frame-ent.touch<4;
 if(wantJump&&canJump&&ent.jumpCd<=0&&ent.stun<=0&&!grabbed){
  ent.jumpBuf=0;ent.lastJumpAt=frame;
  if(ent.isPlayer){ent.grounded=-99;ent.platF=-99;ent.gaitOn=false;}
  ent.jumpCd=ent.isPlayer?6:38;const g=Math.sqrt(Math.max(.25,engine.gravity.y)),jv=-(ent.isPlayer?11.4:10.5)*g*(legs===2?1:legs===1?.8:.6);
  const own=ent.bodies.filter(b=>ent.attached.has(b.plugin.part));
  if(sprint&&(!ent.isPlayer||keys.attack&&!platformAhead(ent))){
   // прыжок с разбега — таран: летим вперёд корпусом
   ent.tackle=44;ent.runT=0;
   const vx=ent.runDir*Math.max(ent.speed*2.5,8);
   for(const b of own)Body.setVelocity(b,{x:vx,y:jv*.72});
   Body.setAngularVelocity(t,ent.runDir*.06);
   Snd.tackle();dust(t.position.x,FLOOR-3,8,ent.runDir);for(let i=0;i<2;i++)FX.cloud(t.position.x-ent.runDir*rnd(10,30),FLOOR-12,rnd(30,44),-ent.runDir*rnd(.3,.9),-rnd(.1,.4),'#efe6d6');if(ent.isPlayer)Snd.voice('v_iiiha',.55,.6);
  }else{
   // у игрока высота прыжка всегда одна, чтобы до платформ было понятно, достанешь или нет
   for(const b of own)Body.setVelocity(b,{x:b.velocity.x,y:ent.isPlayer?jv:Math.min(b.velocity.y,0)+jv});
   if(ent.isPlayer)Snd.jump();
  }
 }
 // A dash is a short horizontal burst, not a teleport: walls and hazards still collide.
 if(ent.isPlayer){
  if(ent.dashBuf>0){
   ent.dashBuf--;
   if(frame>=(ent.dashReadyAt||0)&&ent.stun<=0&&!grabbed&&!ent.caged&&!ent.hung){
    ent.dashBuf=0;ent.dashDir=Math.sign(c.move)||ent.facing||1;
    ent.dashUntil=frame+10;ent.dashReadyAt=frame+72;ent.lastDashAt=frame;ent.gaitOn=false;ent.tackle=0;Missions.record('dash');
    Snd.tackle();dust(t.position.x,Math.min(FLOOR,t.position.y+45),5,ent.dashDir);
    if(!S.tut.dash){S.tut.dash=1;save();GameStats.send('tutorial_completed',{tutorial:'dash'});}
   }
  }
  if(frame<(ent.dashUntil||0)&&ent.stun<=0&&!grabbed){
   for(const b of ent.bodies)if(ent.attached.has(b.plugin.part))Body.setVelocity(b,{x:ent.dashDir*13,y:b.velocity.y});
   if(frame%3===0)FX.cloud(t.position.x-ent.dashDir*25,t.position.y+20,22,-ent.dashDir*.8,-.2,'#fff0cc');
  }
 }
 if(ent.tackle){ent.tackle--;tackleHit(ent);if(grounded&&ent.tackle<30)ent.tackle=0;}
 // прицел
 // игрок на ПК целится мышью (heroAim в modes.js) — только оружием дальнего боя
 const mouseAim=ent.isPlayer&&c.aim&&wp.type!=='melee'?c.aim:null;
 const aim=mouseAim||(ent.aimLock?ent.target.parts.torso.position:{x:t.position.x+ent.facing*120,y:t.position.y-10});
 ent.aim=aim;
 if((mouseAim||ent.aimLock)&&!sprint)ent.facing=Math.sign(aim.x-t.position.x)||ent.facing;
 const side=armSide(ent),melee=wp.type==='melee';
 // поза руки: целимся, замахиваемся, перезаряжаемся
 if(side&&ent.stun<=0&&(ent.weapon&&ent.weapon!=='fists'||holdsStick(ent)||ent.swing>0||ent.charge>0)){
  const sh=P[side[0]].position;let ang=Math.atan2(aim.y-sh.y,aim.x-sh.x),kk=.3;
  if(melee){
   if(ent.swing>0){const k=1-ent.swing/wp.sw;ang+=ent.facing*(-1.9+3.4*k);kk=.55;}
   else if(ent.charge>0){const k=clamp(ent.charge/(CH_MIN+CH_FULL),0,1);ang+=ent.facing*(-1.1-1.5*k)+(k>=1?Math.sin(frame*.9)*.08:0);kk=.45;}
   else ang+=ent.facing*-1.1;
  }else if(ent.reload>0){ang=Math.PI/2-ent.facing*(.5+Math.sin(ent.reload*.25)*.25);}
  const pose=ThrowMotion.pose(ent);
  for(let i=0;i<2;i++){const b=P[side[i]],to=pose?(i?pose.lower:pose.upper):ang-Math.PI/2;Body.setAngularVelocity(b,b.angularVelocity*.35+normA(to-b.angle)*(pose?.5:kk));}
 }
 ThrowMotion.update(ent);BowMotion.update(ent);
 // атака
 const canAct=ent.atkCd<=0&&!ent.throwMotion&&ent.stun<=0&&!grabbed&&!ent.tackle;
 if(melee||!side){
  // v=482: нажатие во время перезарядки или оглушения запоминается на 0,4 с и срабатывает, как только можно бить (тап на телефоне не теряется)
  if(ent.isPlayer&&ent.atkQueued&&frame-ent.atkQueued>24)ent.atkQueued=0;
  if(ent.isPlayer&&ent.atkQueued&&canAct&&!c.attack&&ent.charge===0){ent.atkQueued=0;ent.charge=1;releaseMelee(ent,wp,aim,side);}
  // ближний бой: зажал — замах, отпустил — удар (чем дольше замах, тем сильнее); ИИ «держит» кнопку сам
  const hold=ent.isPlayer?c.attack:ent.aiHold>0;
  if(hold&&canAct&&(side||ent.attached.has('head'))){ent.charge++;if(!ent.isPlayer&&--ent.aiHold<=0)releaseMelee(ent,wp,aim,side);
   if(ent.charge===CH_MIN+CH_FULL&&(ent.isPlayer||onScreen(t.position.x,0)))Snd.charged();}
  else if(ent.charge>0){if(canAct){ent.atkQueued=0;releaseMelee(ent,wp,aim,side);}else{ent.charge=0;if(ent.isPlayer)ent.atkQueued=frame;}}
 }else if(canAct&&ent.reload<=0&&(ent.isPlayer&&wp.type==='throw'?ent.throwQueued:c.attack)){if(wp.type==='throw')ent.throwQueued=false;attack(ent,wp,aim,0);}
 if(ent.swing>0&&side&&!ent.dead){const tp=Vector.add(handPos(ent),Vector.mult(armDir(ent),reachOf(ent,ent.weapon||'fists')));(ent.trail=ent.trail||[]).push({x:tp.x,y:tp.y,l:8});if(ent.trail.length>8)ent.trail.shift();}
 if(ent.swing>0){ent.swing--;const k=1-ent.swing/wp.sw;if(k>=.2&&k<=.85)meleeHit(ent,wp);else ent.prevTip=null;}
 headbuttHit(ent);
}
function releaseMelee(ent,wp,aim,side){
 const ch=ent.charge;ent.charge=0;ent.aiHold=0;
 const pw=ch<CH_MIN?0:clamp((ch-CH_MIN)/CH_FULL,0,1);
 if(side)attack(ent,wp,aim,pw);else headbutt(ent,aim,pw);
}

function aiThink(ent){
 // паника от огня: бросает драку и бежит прочь от поджигателя, подпрыгивает, у ямы разворачивается
 if(ent.panicUntil>frame&&!ent.dead){const c=ent.ctrl,t=ent.parts.torso.position,src=ent.panicFrom&&!ent.panicFrom.removed?ent.panicFrom.parts.torso.position:null;
  let dir=src?Math.sign(t.x-src.x)||1:(ent.panicDir||ent.facing||1);if(pitAhead(ent,dir)||t.x<60||t.x>LW-60)dir=-dir;ent.panicDir=dir;
  c.move=ent.stayPut?0:dir;c.attack=false;ent.target=null;c.jump=!ent.stayPut&&(Math.random()<.05||stuck(ent));ent.charge=0;
  if(frame%40===0&&onScreen(t.x,0))floats.push({x:t.x,y:t.y-60,t:'!!',life:28,c:'#ffb33d'});return;}
 // пленник головоломки идёт к флажку (puzzleUpdate): ни с кем не дерётся, по шипам идёт дальше, у ямы ждёт
 if(ent.walkTo!==undefined){const c=ent.ctrl,dx=ent.walkTo-ent.parts.torso.position.x;c.attack=false;c.jump=false;c.move=Math.abs(dx)>26?Math.sign(dx):0;
  if(c.move&&pitAhead(ent,c.move))c.move=0;if(c.move&&stuck(ent))c.jump=true;ent.target=null;return;}
 if(ent.slam){ent.ctrl.move=0;ent.ctrl.attack=false;ent.ctrl.jump=false;return;} // босс готовит удар по земле
 if(--ent.aiT>0)return;
 ent.aiT=ent.boss?3:5;
 const c=ent.ctrl,t=ent.parts.torso.position;
 // держим цель, пока она не убежала далеко; новую ищем в радиусе «агрессии»
 let tgt=ent.target;
 const retained=tgt&&isEnemy(ent,tgt)&&Vector.magnitude(Vector.sub(tgt.parts.torso.position,t))<=(ent.chaseRange||2200);
 if(!retained)tgt=nearestEnemy(ent,ent.aggro||1e9);
 if(tgt&&!ent.alerted&&ent.team===1&&Mode.id==='level'&&onScreen(t.x,0)){ent.alerted=true;FX.excl(ent);}
 // враг на длинном уровне не уходит далеко от своего поста
 if(!retained&&tgt&&ent.home!==undefined&&Math.abs(tgt.parts.torso.position.x-ent.home)>ent.leash)tgt=null;
 // защита пленника: враги идут к клетке; на героя отвлекаются, только если он вплотную
 const gd=Run.guard;
 if(ent.team===1&&Mode.id==='level'&&gd&&!gd.dead&&!gd.removed){const h=Run.hero,dg=Math.abs(gd.parts.torso.position.x-t.x),dh=h&&!h.dead&&!h.removed?Vector.magnitude(Vector.sub(h.parts.torso.position,t)):1e9;tgt=dh<150&&dh<dg?h:gd;}
 ent.target=tgt;
 if(!tgt){
  c.attack=false;c.jump=false;c.move=0;
  if(ent.home!==undefined){const dx=ent.home-t.x;c.move=Math.abs(dx)>40?Math.sign(dx):0;if(c.move&&(stuck(ent)||pitAhead(ent,c.move)))c.jump=true;return;}
  // союзник идёт за героем
  const h=ent.follow&&Run.hero;
  if(h&&!h.removed&&!h.dead){const dx=h.parts.torso.position.x-t.x;c.move=Math.abs(dx)>150?Math.sign(dx):0;if(c.move&&(stuck(ent)||pitAhead(ent,c.move)))c.jump=true;}
  return;
 }
 const tp=tgt.parts.torso.position,dx=tp.x-t.x,dy=tp.y-t.y,dist=Math.hypot(dx,dy);
 const wp=armSide(ent)?WEAPONS[ent.weapon||'fists']:WEAPONS.fists;
 c.jump=false;
 if(wp.type==='melee'){
  // дистанция удара с учётом толщины обоих тел: толстого Помидора бьём с того же «вытянутого» оружия
  const R=reachOf(ent,armSide(ent)?(ent.weapon||'fists'):'fists')+(ent.parts.torso.plugin.w+tgt.parts.torso.plugin.w)*.5;
  c.move=Math.abs(dx)>R-6?Math.sign(dx):0;
  if(Math.abs(dx)<R+16&&Math.abs(dy)<90&&ent.atkCd<=0&&!ent.aiHold&&!ent.charge&&Math.random()<(ent.boss?.9:.65))
  {ent.aiHold=Math.random()<(ent.boss?.35:.25)?ri(CH_MIN+14,CH_MIN+CH_FULL):1; // иногда — сильный удар с замахом (v496: чаще, с «!» над головой — можно сбить своим ударом)
   if(ent.aiHold>1&&onScreen(t.x,0))FX.excl(ent);}
  // разогнался — таран с прыжка
  if(ent.runT>SPRINT_T&&Math.abs(dx)<240&&Math.abs(dx)>70&&Math.abs(dy)<90&&Math.random()<(ent.boss?.5:.25))c.jump=true;
 }else{
  // перезаряжается — отходит; иначе держит дистанцию под оружие
  const want=ent.reload>0?420:wp.type==='flame'?130:wp.type==='throw'?320:wp.type==='rocket'?360:260;
  c.move=Math.abs(dx)>want+80?Math.sign(dx):Math.abs(dx)<want-110?-Math.sign(dx):0;
  c.attack=ent.reload<=0&&dist<(wp.type==='flame'?wp.range:640)&&Math.random()<(wp.type==='flame'?.9:ent.boss?.8:.45);
 }
 if((dy<-90&&Math.random()<.3)||stuck(ent)||(c.move&&(hazardAhead(ent,c.move)||pitAhead(ent,c.move))))c.jump=true;
 if(ent.stayPut){c.jump=false;c.move=0;ent.facing=Math.sign(dx)||ent.facing;}  // v516: стоит на месте (враги на доске в головоломках)
 if(c.jump)ent.stuckT=0;
}
// застрял — прыгаем
function stuck(ent){const x=ent.parts.torso.position.x;if(ent.ctrl.move&&Math.abs(x-ent.stuckX)<3)ent.stuckT++;else ent.stuckT=0;ent.stuckX=x;return ent.stuckT>5;}
function hazardAhead(ent,dir){
 const t=ent.parts.torso.position;
 for(const e of entities){if(e.type!=='saw'&&!(e.type==='static'&&e.bodies[0].plugin.hazard)&&e.type!=='mine')continue;const b=e.bodies[0],dx=(b.position.x-t.x)*dir;if(dx>20&&dx<90&&Math.abs(b.position.y-t.y)<110)return true;}
 return false;
}
function pitAhead(ent,dir){const x=ent.parts.torso.position.x;return frame-ent.grounded<4&&(inPit(x+dir*45)||inPit(x+dir*75));}

function attack(ent,wp,aim,pw,released=false){
 if(ent.weapon==='bow'&&!released){if(ent.ammo<=0){ent.reload=wp.rl;return;}BowMotion.start(ent,wp);return;}
 if(ThrowMotion.isWeapon(ent.weapon)&&!released){if(wp.mag&&ent.ammo<=0){ent.reload=wp.rl;return;}ThrowMotion.start(ent,wp,aim);return;}
 if(wp.type==='projectile'&&!released&&!ent.isPlayer&&!ent.projectileReadying){ent.projectileReadying=frame+18;ent.atkCd=18;FX.excl(ent);return;}
 ent.projectileReadying=null;ent.atkCd=wp.cd;
 if(wp.type==='melee'){if(ent.isPlayer)ent.atkCd=Math.max(wp.sw,Math.round(wp.cd*.6));  // v=482
  ent.swing=wp.sw;ent.pw=pw||0;ent.swingHits=new Set();ent.swingImpactFx=false;ent.prevTip=null;pw>.5?Snd.heavy():Snd.swish();if(ent.lootW)lootWeaponUse(ent);return;}
 // обойма
 if(wp.mag){if(ent.ammo<=0){ent.reload=wp.rl;return;}if(--ent.ammo<=0){ent.reload=wp.rl;if(ent.isPlayer||onScreen(ent.parts.torso.position.x,0))Snd.reload();}}
 if(ent.lootW)lootWeaponUse(ent);  // v497: оружие из ящика — считаем выстрелы
 const h=handPos(ent);
 if(wp.type==='projectile'){FlyingShots.launch(ent,wp,aim);return;}
 if(wp.type==='flame'){Fire.emit(ent,wp);return;}
 if(wp.type==='gun'){
  const muzzle=weaponMuzzle(ent),base=muzzle.angle;
  for(let i=0;i<wp.pellets;i++)hitscan(ent,muzzle,base+rnd(-wp.spread,wp.spread),wp);
  gunShotFx(ent,muzzle,base);
  sparks(muzzle.x,muzzle.y,5);FX.muzzle(muzzle.x,muzzle.y,base);FX.add({k:'muz',x:muzzle.x+Math.cos(base)*10,y:muzzle.y+Math.sin(base)*10,ang:base,fr:ri(0,3),t:0,life:3,size:ent.weapon==='shotgun'?54:38});FX.flashAt(muzzle.x,muzzle.y);Snd.shot(ent.weapon);shell(h,base);
  if(ent.isPlayer)shake=Math.min(12,shake+(ent.weapon==='shotgun'?2:.6));
  const hp=handPart(ent);if(hp)Body.setVelocity(hp,Vector.add(hp.velocity,{x:-Math.cos(base)*2,y:-Math.sin(base)*2}));
  return;
 }
 if(wp.type==='rocket'){
  // ракета летит прямо и взрывается от первого касания
  const m=weaponMuzzle(ent),base=m.angle,dir={x:Math.cos(base),y:Math.sin(base)};
  const b=Bodies.rectangle(m.x,m.y,30,10,{density:.002,frictionAir:0,collisionFilter:{group:ent.group},render:{fillStyle:'#ddd'},plugin:{deco:'rocket'}});
  Body.setAngle(b,base);
  addEnt('rocket',[b],null,{owner:ent,dir,life:160,power:wp.power,radius:wp.radius});
  Body.setVelocity(b,Vector.mult(dir,13));
  FX.muzzle(m.x,m.y,base);Snd.shot('bazooka');if(ent.isPlayer)shake=Math.min(12,shake+2);
  const hp=handPart(ent);if(hp)Body.setVelocity(hp,Vector.add(hp.velocity,{x:-dir.x*4,y:-dir.y*4}));
  return;
 }
 if(wp.type==='throw'){
  const b=spawnItem('bomb',h.x,h.y,{fuse:80});b.bodies[0].plugin.deco='grenade';  // летит граната; бомбы падают только сверху на уровнях
  b.power=wp.power;b.radius=wp.radius;b.owner=ent;b.fuseTotal=b.fuse;
  // граната не цепляет бросающего: первые кадры полёта не сталкивается с его телом (та же группа, что у частей рэгдолла)
  const gb=b.bodies[0],grp=ent.parts.torso.collisionFilter.group;if(grp){gb.collisionFilter.group=grp;b.noSelfUntil=frame+18;}
  const dx=aim.x-h.x,dy=aim.y-h.y,tt=38;
  Body.setVelocity(b.bodies[0],{x:clamp(dx/tt,-14,14),y:clamp(dy/tt-.5*engine.gravity.y*tt*.4,-16,8)});
  Snd.swish();
 }
}
// ближайшая к точке p точка внутри рамки тела
function boundsPoint(b,p){return {x:clamp(p.x,b.bounds.min.x,b.bounds.max.x),y:clamp(p.y,b.bounds.min.y,b.bounds.max.y)};}
function segDist(p,a,b){const ab=Vector.sub(b,a),t=clamp(Vector.dot(Vector.sub(p,a),ab)/Math.max(1,Vector.dot(ab,ab)),0,1);return Vector.magnitude(Vector.sub(p,Vector.add(a,Vector.mult(ab,t))));}
// длина клинка от кисти — по спрайту оружия (то, что игрок видит), для кулака — короткий тычок
function reachOf(ent,wid){const f=WPN_FIT[wid],w=WEAPONS[wid];return (f?f.L*(1-f.gx):w.len)*ent.s;}
const rayBodies=(list,a,b,w)=>Query.ray(list,a,b,w).map(c=>list.includes(c.bodyA)?c.bodyA:c.bodyB);
// удар ближнего боя: проверяется весь замах (активная фаза), по настоящим контурам тел.
// Каждого врага один удар задевает один раз. Плюс щадящая зона досягаемости перед бойцом —
// чтобы удар, который выглядит попавшим, всегда засчитывался.
function meleeHit(ent,wp){
 const pw=ent.pw||0,mD=1+1.6*pw,mK=1+1.5*pw,wid=ent.weapon||'fists';
 const L=reachOf(ent,wid)*(1+pw*.25)+6;
 const h=handPos(ent),d=armDir(ent),tip=Vector.add(h,Vector.mult(d,L)),from=Vector.sub(h,Vector.mult(d,6));
 const prev=ent.prevTip;ent.prevTip=tip;
 if(!ent.swingHits)ent.swingHits=new Set();
 if(wp.cut||pw>.5){cutRopesAlong(from,tip,10);if(prev)cutRopesAlong(prev,tip,10);}
 const me=ent.parts.torso.position,dirX=ent.facing;
 // Freeze the target list: destroying an item appends debris to entities.
 for(const e of entities.slice()){
  if(e.removed||e.type==='debris'||ent.swingHits.has(e))continue;
  if(e.type==='npc'){
   if(e===ent||e.dead||e.hung||e.caged||(e.team===ent.team&&ent.team>=0))continue;
   if(ent.team>=0&&e.team<0&&Mode.id!=='sandbox')continue;
   const own=e.bodies.filter(b=>e.attached.has(b.plugin.part));
   // 1) клинок (и его след с прошлого кадра) пересекает тело
   let hits=rayBodies(own,from,tip,10);
   if(!hits.length&&prev)hits=rayBodies(own,prev,tip,10);
   // 2) зона досягаемости: враг прямо перед бойцом, на расстоянии вытянутого оружия
   if(!hits.length&&ent.swing<=Math.ceil(wp.sw*.5)){
    const tt=e.parts.torso,dx=(tt.position.x-me.x)*dirX,dy=tt.position.y-me.y,rx=L+ent.parts.torso.plugin.w*.5+tt.plugin.w*.5+8,ry=(tt.plugin.h+ent.parts.torso.plugin.h)*.6;
    if(dx>-6&&dx<rx&&Math.abs(dy)<ry)hits=[tt];
   }
   if(!hits.length)continue;
   // часть, ближайшая к острию
   let part=hits[0],bd=1e9;for(const b of hits){const q=Vector.magnitude(Vector.sub(b.position,tip));if(q<bd){bd=q;part=b;}}
   ent.swingHits.add(e);
   const hp=Vector.add(part.position,Vector.mult(Vector.normalise(Vector.sub(tip,part.position)),Math.min(bd,(part.plugin.w||16)*.5)));
   // враги теперь попадают точно, поэтому их удары по герою на уровнях слабее
   const dmg=wp.dmg*ent.dmgMul*rnd(.9,1.1)*mD*(Mode.dmgTo?Mode.dmgTo(e,'hit'):1)*(e.isPlayer&&Mode.id==='level'?.6:1);
   e.lastHitBy=ent;damageNpc(e,dmg,hp.x,hp.y,ent);
   if(ent.isPlayer&&pw>=.95&&e.team!==ent.team&&ent.swingHits.size===1)Missions.record('strong_hit');  // v=522: задание дня — удар с полного замаха (раз за взмах)
   if(ent.weapon==='hammer'){FX.zap(hp.x,hp.y,dirX);sparks(hp.x,hp.y,5);}  // молот бьёт с небольшой молнией
   if(wp.cut&&canCut(e)){const pn=part.plugin.part,ch=wp.cut*(e.dead?1.8:1)*(1+pw);
    const cut=pn==='torso'?Math.random()<ch*.6&&severNearest(e,tip):(pn!=='head'||e.dead)&&Math.random()<ch&&sever(e,pn);
    if(cut&&ent.isPlayer&&e.team!==ent.team)Missions.record('cut');}  // v=522: задание дня — отруби части тела
   // героя на уровнях отбрасывает слабее — иначе один удар битой улетает в яму
   const dir=Vector.normalise(Vector.sub(e.parts.torso.position,me)),kt=e.isPlayer&&Mode.id==='level'?.45:1;
   for(const b of e.bodies)Body.setVelocity(b,Vector.add(b.velocity,{x:dir.x*wp.kb*.55*mK*kt,y:(dir.y*wp.kb*.3*mK-wp.kb*.2*mK)*kt}));
   // v=482: героя короткое оглушение (раньше до 35 кадров — враг «запинывал»); удар героя сбивает замах врага и ощутимо «встряхивает»
   e.stun=Math.max(e.stun,e.isPlayer?Math.min(10,wp.kb*2.5*mK):wp.kb*2.5*mK);
   if(ent.isPlayer&&!e.isPlayer&&!e.boss){e.swing=0;e.charge=0;e.aiHold=0;e.atkCd=Math.max(e.atkCd||0,14);}
   if(ent.isPlayer){hitStop=Math.max(hitStop,pw>=1?4:2);shake=Math.min(12,shake+(pw>=1?5:2));}
   impactFx(e,hp,dmg,pw,wid,d);
  }else if(e.type!=='rope'&&e.type!=='cage'){
   // попадание считаем по настоящему контуру предмета: линия оружия, её след с прошлого кадра и зона прямо у острия
   // v=458: стену (gate) теперь можно ломать ударами
   const targets=e.bodies.filter(b=>!b.isStatic||e.item||e.type==='gate');if(!targets.length)continue;
   let hit=rayBodies(targets,from,tip,10)[0]||(prev&&rayBodies(targets,prev,tip,10)[0]);
   if(!hit)for(const b of targets){const q=boundsPoint(b,tip);if(Vector.magnitude(Vector.sub(q,tip))<16){hit=b;break;}}
   // зона досягаемости: предмет прямо перед бойцом, от плеч до пола; замах заканчивается раньше, чем оружие достаёт до земли
   if(!hit&&ent.swing<=Math.ceil(wp.sw*.5)){
    const tw=ent.parts.torso.plugin.w,th=ent.parts.torso.plugin.h,x1=me.x+dirX*(tw*.3),x2=me.x+dirX*(L+tw*.5+12),lx=Math.min(x1,x2),rx=Math.max(x1,x2),ty=me.y-th*.8,by=me.y+th*1.6;
    for(const b of targets)if(b.bounds.max.x>lx&&b.bounds.min.x<rx&&b.bounds.max.y>ty&&b.bounds.min.y<by){hit=b;break;}
   }
   if(!hit)continue;
   ent.swingHits.add(e);
   const q=boundsPoint(hit,tip),kick=(1+pw)*wp.kb*.55*clamp(4/hit.mass,.12,1);
   if(!hit.isStatic){Body.setVelocity(hit,Vector.add(hit.velocity,{x:d.x*kick,y:d.y*kick-kick*.35}));Body.setAngularVelocity(hit,hit.angularVelocity+dirX*.02*kick);}
   const heavyHit=pw>.5||wid==='hammer';
   Snd.hit(heavyHit?18:12);sparks(q.x,q.y,heavyHit?10:6);FX.hit(q.x,q.y);FX.ring(q.x,q.y,heavyHit?44:26);
   hitStop=Math.max(hitStop,ent.isPlayer&&pw>=1?1:0);if(ent.isPlayer)shake=Math.min(12,shake+(pw>=1?7:heavyHit?3:1));
   if(pw>=1&&!ent.swingImpactFx){ent.swingImpactFx=true;FX.flashAt(q.x,q.y);FX.shock(q.x,q.y,130);FX.burst(q.x,q.y,160,'#ffe27a');FX.word(q.x,q.y-46,'crit',140);}
   hurtItem(e,wp.dmg*(ent.dmgMul||1)*(1+pw*1.5)*1.6,q.x,q.y);
   if(e.type==='bomb'&&e.fuse>20&&!e.hung)e.fuse=20;
  }
 }
}
// «сочность» попадания: стоп-кадр, вспышка, брызги, кольцо удара, тряска, крупная цифра урона
function impactFx(e,p,dmg,pw,wid,dir){
 const blade=wid==='sword'||wid==='axe',heavy=pw>.5||wid==='hammer';
 Snd.punch(pw,wid);
 e.flash=7;
 const mine=e.isPlayer||(e.lastHitBy&&e.lastHitBy.isPlayer);
 const source=e.lastHitBy,major=pw>=1&&(!source||!source.swingImpactFx);
 if(major&&source)source.swingImpactFx=true;
 if(mine||pw>=1){hitStop=Math.max(hitStop,major?1:0);shake=Math.min(12,shake+(pw>=1?10:pw>.5?3+pw*3:1.5));}
 // One charged-impact burst per swing; keep simulation responsive between contacts.
 if(major){FX.flashAt(p.x,p.y);FX.shock(p.x,p.y,170);FX.ring(p.x,p.y,120);FX.burst(p.x,p.y,210,'#ffe27a');FX.spike(p.x,p.y,230,'#ffd23a');for(let i=0;i<12;i++)particles.push({x:p.x,y:p.y,vx:rnd(-11,11),vy:rnd(-12,4),life:rnd(22,42),c:pick(['#ffd23a','#ffb52e','#fff3b0']),r:rnd(3,7),fire:true});}
 FX.hit(p.x,p.y);FX.ring(p.x,p.y,heavy?46:30);FX.spike(p.x,p.y,heavy?96:62,pw>.5?'#ffe27a':'#ffffff');
 if(blade){FX.slashTex(p.x,p.y,Math.atan2(dir.y,dir.x)+Math.PI/2,heavy?110:80);FX.splat(p.x,p.y,Math.atan2(dir.y,dir.x),NPC[e.kind].juice,heavy?90:64);}
 else FX.burst(p.x,p.y,heavy?70:44,'#ffffff');
 // комикс-надпись: на сильных ударах — всегда, на обычных — иногда
 if(major)FX.word(p.x,p.y-60,'crit',140);
 else if(pw<1&&(pw>.5||wid==='hammer'))FX.word(p.x,p.y-38,pick(['kapow','whammm','crack']),100);
 else if(Math.random()<.28)FX.word(p.x,p.y-34,blade?pick(['smack','hit']):pick(['pow','smack','hit']),74);
 juice(p.x,p.y,NPC[e.kind].juice,blade?14:8,blade?6:4);
 sparks(p.x,p.y,heavy?10:5);
 popDamage(p.x,p.y-14,dmg,pw>.5);
 if(pw>=1&&e.hp>0)Snd.voice('v_cool',.7,.7);
}
function popDamage(x,y,dmg,crit){floats.push({x:x+rnd(-8,8),y,t:Math.round(dmg)+(crit?'!':''),life:48,c:crit?'#ffd23a':'#ffffff',big:clamp(.9+dmg/40,.9,1.8),pop:1});}
// таран: летим корпусом в первого попавшегося врага
function tackleHit(ent){
 const tb=ent.parts.torso,sp=Math.abs(tb.velocity.x);if(sp<2.5)return;
 for(const e of entities){
  if(e===ent||e.type!=='npc'||e.dead||e.hung||e.caged||(e.team===ent.team&&ent.team>=0))continue;
  if(ent.team>=0&&e.team<0&&Mode.id!=='sandbox')continue;
  const r=tb.plugin.w*.5+14*e.s;
  const part=e.bodies.find(b=>Vector.magnitude(Vector.sub(b.position,tb.position))<r+b.plugin.w*.5);
  if(!part)continue;
  const dir=Math.sign(tb.velocity.x)||ent.facing;
  damageNpc(e,(10+sp*2.4)*ent.dmgMul*(Mode.dmgTo?Mode.dmgTo(e,'hit'):1)*(e.isPlayer&&Mode.id==='level'?.7:1),part.position.x,part.position.y,ent);
  if(ent.isPlayer)Missions.record('ram');  // v=522: задание дня — таран
  const kt=e.isPlayer&&Mode.id==='level'?.45:1;
  for(const b of e.bodies)Body.setVelocity(b,Vector.add(b.velocity,{x:dir*(5+sp*.7)*kt,y:-4.5*kt}));
  e.stun=Math.max(e.stun,e.isPlayer?30:60);
  for(const b of ent.bodies)Body.setVelocity(b,{x:b.velocity.x*-.25,y:b.velocity.y-2});
  if(ent.isPlayer||e.isPlayer)shake=Math.min(12,shake+4);Snd.punch(1,'fists');FX.hit(part.position.x,part.position.y);sparks(part.position.x,part.position.y,10);
  FX.word(part.position.x,part.position.y-40,pick(['whammm','smack','kapow']),104);FX.burst(part.position.x,part.position.y,80,'#ffffff');FX.spike(part.position.x,part.position.y,100,'#ffe27a');
  for(let i=0;i<3;i++)FX.cloud(part.position.x+rnd(-20,20),part.position.y+rnd(-10,20),rnd(36,54),rnd(-.8,.8),-rnd(.2,.6),'#f4ecdc');
  ent.tackle=0;return;
 }
}
function hitscan(ent,from,ang,wp){
 const dir={x:Math.cos(ang),y:Math.sin(ang)},len=900;
 let to=Vector.add(from,Vector.mult(dir,len));
 // пуля летит до пола
 if(dir.y>0.001){const k=(FLOOR-from.y)/dir.y;if(k>0&&k<len&&!inPit(from.x+dir.x*k))to=Vector.add(from,Vector.mult(dir,k));}
 const cands=Composite.allBodies(world).filter(b=>{
  if(ent.bodies.includes(b)||(b.plugin&&b.plugin.bound))return false;
  const e=b.plugin&&b.plugin.ent;
  if(e&&e.type==='npc'&&(e.dead||e.hung||e.caged||(e.team===ent.team&&ent.team>=0)))return false;
  return true;});
 // все тела на линии выстрела; берём ближайшее по ходу пули
 let hitB=null,best=1e9;
 for(const b of rayBodies(cands,from,to,4)){const q=Vector.dot(Vector.sub(b.position,from),dir)-(b.circleRadius||Math.min((b.plugin&&b.plugin.w)||10,(b.plugin&&b.plugin.h)||10)*.5);if(q<best){best=q;hitB=b;}}
 const end=hitB?Vector.add(from,Vector.mult(dir,Math.max(0,best))):to;
 // пуля перебивает верёвку на своём пути
 cutRopesAlong(from,end,1);
 tracers.push({x1:from.x,y1:from.y,x2:end.x,y2:end.y,life:7});
 if(!hitB){sparks(end.x,end.y,3);FX.puff(end.x,end.y);return;}
 const e=hitB.plugin&&hitB.plugin.ent;
 if(e&&e.type==='npc'){
  const tt=e.parts.torso,headshot=hitB===tt&&end.y<tt.position.y-tt.plugin.h*.15;
  const dmg=wp.dmg*ent.dmgMul*rnd(.9,1.1)*(headshot?1.5:1)*(Mode.dmgTo?Mode.dmgTo(e,'hit'):1)*(e.isPlayer&&Mode.id==='level'?.7:1);
  damageNpc(e,dmg,end.x,end.y,ent);
  const lv=e.isPlayer&&Mode.id==='level';
  Body.setVelocity(hitB,Vector.add(hitB.velocity,Vector.mult(dir,(wp.kb||2.5)*(lv?.25:1))));
  if(!lv)e.stun=Math.max(e.stun,6);
  e.flash=5;juice(end.x,end.y,NPC[e.kind].juice,6,4);FX.ring(end.x,end.y,18);FX.spike(end.x,end.y,38,'#fff6c8');if(headshot)FX.word(end.x,end.y-30,'crit',80);
  popDamage(end.x,end.y-10,dmg,headshot);
  if(headshot&&ent.isPlayer)Snd.voice('v_headshot',.75,.8,1500);
  Snd.play('squish',.35,1.5);
 }else{
  sparks(end.x,end.y,5);FX.puff(end.x,end.y);
  if(!hitB.isStatic)Body.applyForce(hitB,end,Vector.mult(dir,.004*hitB.mass*(wp.kb||2)));
  if(e&&e.type==='bomb'&&e.fuse>10&&!e.hung)e.fuse=6;
  hurtItem(e,wp.dmg*(ent.dmgMul||1)*1.2,end.x,end.y);
  if(e&&e.type==='mine'&&!e.removed){const pos={...hitB.position};removeEnt(e);explode(pos.x,pos.y,e.power,e.radius,hitB);}
 }
}
// гильза из оружия
// выстрел: дымок из ствола, вспышка света (освещает и ночь), отдача — ствол дёргается назад и вверх
function gunShotFx(ent,m,ang){
 const big=ent.weapon==='shotgun';
 for(let i=0;i<(big?3:1);i++)FX.cloud(m.x+Math.cos(ang)*(14+i*8),m.y+Math.sin(ang)*(14+i*8)-2,big?30:20,Math.cos(ang)*.5+rnd(-.2,.2),-.35,'#d9d4cc');
 flashes.push({x:m.x+Math.cos(ang)*12,y:m.y+Math.sin(ang)*12,r:big?46:30,life:4});
 ent.recoilAt=frame;ent.recoilK=big?1:ent.weapon==='smg'?.45:.75;
}
function shell(h,ang){particles.push({x:h.x,y:h.y-4,vx:-Math.cos(ang)*rnd(1.5,3)+rnd(-.5,.5),vy:-rnd(2.5,4.5),life:rnd(40,60),c:'#e8b93a',r:1.8,shell:true});}

/* ============ отрисовка оружия ============ */
function drawWeapon(ent){
 if(ent.dead||((!ent.weapon||ent.weapon==='fists')&&!holdsStick(ent)))return;
 if(ThrowMotion.isWeapon(ent.weapon)&&(ent.throwMotion?.released||!ent.throwMotion&&(ent.atkCd>8||ent.reload>0)))return;
 const h=handPos(ent),d=armDir(ent),a=Math.atan2(d.y,d.x),id=ent.weapon||'fists';
 // холодное оружие сторону не меняет посреди замаха; у топора лезвие смотрит вперёд, по направлению удара
 const mel=WEAPONS[id].type==='melee',back=mel?ent.facing<0:d.x<0;
 ctx.save();ctx.translate(h.x,h.y);ctx.rotate(a);if(id==='axe'?!back:back)ctx.scale(1,-1);
 const s=ent.s;ctx.scale(s,s);
 // отдача после выстрела: назад вдоль руки и стволом вверх, за 6 кадров возвращается
 {const ra=frame-(ent.recoilAt??-99);if(ra<6){const k=(ent.recoilK||.6)*(1-ra/6);ctx.translate(-k*6,0);ctx.rotate(-k*.22);}}
 if(drawWeaponSprite(ent,id)){ctx.restore();return;}
 ctx.lineWidth=1.5;ctx.strokeStyle='#0008';
 if(id==='sword'){ctx.fillStyle='#6b4a2a';ctx.fillRect(-6,-2.5,10,5);ctx.fillStyle='#c9a227';ctx.fillRect(3,-7,4,14);ctx.fillStyle='#dfe6ee';ctx.beginPath();ctx.moveTo(7,-3);ctx.lineTo(42,-2);ctx.lineTo(48,0);ctx.lineTo(42,2);ctx.lineTo(7,3);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff8';ctx.fillRect(9,-1,30,1);}
 if(id==='bat'){ctx.fillStyle='#c58a4a';ctx.beginPath();ctx.moveTo(-6,-2.5);ctx.lineTo(40,-5.5);ctx.quadraticCurveTo(46,0,40,5.5);ctx.lineTo(-6,2.5);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#333';ctx.fillRect(-6,-2.5,8,5);}
 if(id==='axe'){ctx.fillStyle='#7a5230';ctx.fillRect(-6,-2.5,44,5);ctx.strokeRect(-6,-2.5,44,5);ctx.fillStyle='#b8c0cc';ctx.beginPath();ctx.moveTo(28,-3);ctx.quadraticCurveTo(34,-18,44,-16);ctx.lineTo(44,4);ctx.quadraticCurveTo(34,4,28,3);ctx.closePath();ctx.fill();ctx.stroke();}
 if(id==='hammer'){ctx.fillStyle='#7a5230';ctx.fillRect(-6,-2.5,40,5);ctx.fillStyle='#5a606c';ctx.fillRect(30,-12,16,24);ctx.strokeRect(30,-12,16,24);}
 if(id==='pistol'){ctx.fillStyle='#2a2d33';ctx.fillRect(-2,-3,22,7);ctx.fillRect(-2,2,7,9);ctx.strokeRect(-2,-3,22,7);}
 if(id==='smg'){ctx.fillStyle='#2f3a2f';ctx.fillRect(-4,-4,34,8);ctx.fillRect(2,3,6,11);ctx.fillRect(-12,-2,9,6);ctx.fillStyle='#1b1d20';ctx.fillRect(30,-2,8,4);ctx.strokeRect(-4,-4,34,8);}
 if(id==='shotgun'){ctx.fillStyle='#6b4a2a';ctx.fillRect(-14,-3,16,8);ctx.fillStyle='#3a3d44';ctx.fillRect(2,-4,36,4);ctx.fillRect(2,0,34,4);ctx.strokeRect(2,-4,36,8);}
 if(id==='grenade'&&ent.atkCd<WEAPONS.grenade.cd-12){ctx.fillStyle='#3d5a2a';ctx.beginPath();ctx.ellipse(6,0,7,8,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#999';ctx.fillRect(3,-11,6,4);}
 ctx.restore();
}

/* ============ разрезание и отрывание частей тела ============ */
const PARENT={head:'torso',uaL:'torso',uaR:'torso',ulL:'torso',ulR:'torso',laL:'uaL',laR:'uaR',llL:'ulL',llR:'ulR'};
const CHILDREN={uaL:['laL'],uaR:['laR'],ulL:['llL'],ulR:['llR']};
// Captive allies and the introductory lesson stay intact; the player can lose limbs in normal battles.
function canCut(ent){return ent&&ent.type==='npc'&&!ent.removed&&!ent.hung&&!ent.caged&&!(Mode.id==='level'&&ent.team===0&&!ent.isPlayer)&&!(ent.isPlayer&&Mode.id==='level'&&Tut.on)&&(!ent.isPlayer||frame-(ent.limbLostAt??-999)>=90);}
function playerLimbDamage(ent,dmg,x,y){
 if(!ent.isPlayer||ent.dead||!canCut(ent)||dmg<Math.max(10,ent.hpMax*.08))return;
 const point={x,y};let best=null,distance=Infinity;
 for(const name of ['uaL','uaR','laL','laR','ulL','ulR','llL','llR']){
  if(!ent.attached.has(name))continue;
  const part=ent.parts[name],q=boundsPoint(part,point),d=Math.hypot(q.x-x,q.y-y);
  if(d<distance){distance=d;best=part;}
 }
 if(!best||distance>30*ent.s)return;
 best.plugin.trauma=(best.plugin.trauma||0)+dmg;
 if(best.plugin.trauma>=Math.max(22,ent.hpMax*.22))sever(ent,best.plugin.part);
}
function recomputeAttached(ent){
 const a=new Set(['torso','head']);
 for(const p of ['uaL','uaR','ulL','ulR','laL','laR','llL','llR'])if(a.has(PARENT[p])&&!ent.joints[p].cut)a.add(p);
 ent.attached=a;
 ent.liftMass=ent.parts.torso.mass+['uaL','uaR','laL','laR','ulL','ulR'].filter(p=>a.has(p)).reduce((sum,p)=>sum+ent.parts[p].mass,0);
}
function sever(ent,p){
 const c=ent.joints[p];if(!c||c.cut||!ent.attached.has(p))return false;
 c.cut=true;Composite.remove(world,c);ent.cons=ent.cons.filter(x=>x!==c);
 const sub=[p,...(CHILDREN[p]||[]).filter(ch=>!ent.joints[ch].cut)];
 const g=Body.nextGroup(true);
 for(const n of sub){const b=ent.parts[n];b.collisionFilter.group=g;b.plugin.cut=true;}
 // срезы на обеих сторонах сустава
 const parent=ent.parts[PARENT[p]],child=ent.parts[p];
 const sr=Math.min(child.plugin.w,child.plugin.h)*.5;
 (parent.plugin.stumps=parent.plugin.stumps||[]).push({x:c.pointA.x,y:c.pointA.y,p,r:sr});
 (child.plugin.stumps=child.plugin.stumps||[]).push({x:c.pointB.x,y:c.pointB.y,p,r:sr});
 child.plugin.drip=150;parent.plugin.drip=Math.max(parent.plugin.drip||0,220);
 const wpnt=Vector.add(parent.position,Vector.rotate(c.pointA,parent.angle));
 juice(wpnt.x,wpnt.y,NPC[ent.kind].juice,16,5);FX.splat(wpnt.x,wpnt.y,rnd(0,6),NPC[ent.kind].juice,80);if(Math.random()<.35)FX.word(wpnt.x,wpnt.y-30,'splat',80);
 Body.setVelocity(child,Vector.add(child.velocity,{x:rnd(-3,3),y:rnd(-5,-2)}));
 Body.setAngularVelocity(child,rnd(-.3,.3));
 recomputeAttached(ent);
 if(ent.isPlayer){ent.limbLostAt=frame;ent.throwMotion=null;}
 Snd.slice();
 // отрубленный кусок полежит 2 с и растает — без «палок», торчащих сквозь тела
 for(const n of sub)ent.parts[n].plugin.fadeAt=frame+120;
 if(Mode.id==='sandbox'){S.cuts=(S.cuts||0)+1;SbM.add('cut');}
 floats.push({x:wpnt.x,y:wpnt.y-14,t:'✂',life:35,c:'#fff'});
 if(!armSide(ent))dropWeapon(ent);
 if(!ent.dead)ent.bleed+=150;
 ent.stun=Math.max(ent.stun,30);ent.charge=0;
 return true;
}
// режем сустав, ближайший к точке удара (когда попали в туловище или в пилу); limbsOnly — только руки и ноги
function severNearest(ent,pt,limbsOnly){
 let best=null,bd=1e9;
 for(const p of Object.keys(ent.joints)){
  if(ent.joints[p].cut||!ent.attached.has(p)||limbsOnly&&p==='head')continue;
  const c=ent.joints[p],par=ent.parts[PARENT[p]],w=Vector.add(par.position,Vector.rotate(c.pointA,par.angle));
  const d=Vector.magnitude(Vector.sub(w,pt))+(CHILDREN[p]?0:6);
  if(d<bd){bd=d;best=p;}
 }
 if(best&&bd<60*ent.s)return sever(ent,best);
 return false;
}
/* ---------- пила ---------- */
// часть тела, коснувшаяся диска в сумме SAW_CUT_T кадров (диск отбрасывает тело, поэтому касания складываются), отпиливается; пока пилит — сок брызжет по ходу вращения.
// Прижали туловище — отпиливается ближайшая к диску рука или нога. Кто защищён от расчленения — решает canCut
const SAW_CUT_T=5,SAW_FORGET=45; // кадров касания до разреза; столько кадров без касания — счёт сначала
function sawSpray(o,pt,color,n,speed){
 const dx=pt.x-o.position.x,dy=pt.y-o.position.y,l=Math.hypot(dx,dy)||1,w=Math.sign(o.angularVelocity||.25),tx=-dy/l*w,ty=dx/l*w;
 for(let i=0;i<n&&particles.length<900;i++){const v=speed*rnd(.5,1.25);particles.push({x:pt.x,y:pt.y,vx:tx*v+dx/l*rnd(0,1.5)+rnd(-.8,.8),vy:ty*v+dy/l*rnd(0,1.5)+rnd(-1.2,.4),life:rnd(26,60),c:color,r:rnd(1.8,4.4)});}
}
function sawContact(ent,x,o,pair){
 if(ent.removed||ent.hung||ent.caged)return;
 const pl=x.plugin,pt=pair.collision.supports&&pair.collision.supports[0]||x.position,col=NPC[ent.kind].juice;
 if(frame-(pl.sawAt??-999)>SAW_FORGET)pl.sawT=0;
 pl.sawAt=frame;pl.sawT=(pl.sawT||0)+1;
 if(frame%2===0)sawSpray(o,pt,col,2,5);
 if(!canCut(ent)||pl.sawT<SAW_CUT_T)return;
 pl.sawT=0;
 const before=new Set(ent.attached),part=pl.part;
 if(!(part!=='torso'&&part!=='head'?sever(ent,part):severNearest(ent,pt,true)))return;
 // отпиленный кусок летит по ходу диска
 const dx=pt.x-o.position.x,dy=pt.y-o.position.y,l=Math.hypot(dx,dy)||1,w=Math.sign(o.angularVelocity||.25);
 for(const n of before)if(!ent.attached.has(n)){const b=ent.parts[n];Body.setVelocity(b,{x:-dy/l*w*7+rnd(-1,1),y:dx/l*w*7-rnd(2,4)});Body.setAngularVelocity(b,rnd(-.4,.4));}
 sawCutFx(ent,o,pt,col);
}
// шипы: рука или нога, пролежавшая на остриях в сумме SPIKE_CUT_T кадров, отрубается; упавший с размаху — сразу.
// Сок брызжет вверх фонтаном, отрубленный кусок подлетает над шипами
const SPIKE_CUT_T=12,SPIKE_HARD_FALL=7;
function spikeContact(ent,x,o,pair){
 if(ent.removed||ent.hung||ent.caged)return;
 const pl=x.plugin,pt=pair.collision.supports&&pair.collision.supports[0]||x.position,col=NPC[ent.kind].juice;
 if(frame-(pl.spikeAt??-999)>SAW_FORGET)pl.spikeT=0;
 const hard=frame-(pl.spikeAt??-999)>10&&x.velocity.y>SPIKE_HARD_FALL;
 pl.spikeAt=frame;pl.spikeT=(pl.spikeT||0)+1;ent.spikeTouch=frame;
 if(frame%5===0)juice(pt.x,pt.y,col,2,2.5);
 if(!canCut(ent)||(!hard&&pl.spikeT<SPIKE_CUT_T))return;
 pl.spikeT=0;
 const before=new Set(ent.attached),part=pl.part;
 if(!(part!=='torso'&&part!=='head'?sever(ent,part):severNearest(ent,pt,true)))return;
 for(const n of before)if(!ent.attached.has(n)){const b=ent.parts[n];Body.setVelocity(b,{x:rnd(-2.5,2.5),y:-rnd(5,8)});Body.setAngularVelocity(b,rnd(-.4,.4));}
 for(let i=0;i<26&&particles.length<900;i++)particles.push({x:pt.x+rnd(-8,8),y:pt.y,vx:rnd(-2.5,2.5),vy:-rnd(3,9),life:rnd(26,55),c:col,r:rnd(1.8,4.2)});
 juice(pt.x,pt.y,col,10,5);FX.splat(pt.x,pt.y-6,-Math.PI/2+rnd(-.5,.5),col,105);FX.burst(pt.x,pt.y-8,65,col);
 FX.list=FX.list.filter(f=>!(f.k==='word'&&f.t===0));if(frame-(o.plugin.wordAt??-99)>30){o.plugin.wordAt=frame;FX.word(pt.x,pt.y-46,'splat',90);}
 shake=Math.min(12,shake+(ent.isPlayer?5:2.5));if(Mode.id==='level')hitStop=Math.max(hitStop,2);
 Snd.squish();
}
// сочный эффект отпиливания: фонтан сока по касательной, клякса, «SPLAT», пятно сока на самом диске, тряска
function sawCutFx(ent,o,pt,col){
 sawSpray(o,pt,col,34,9);juice(pt.x,pt.y,col,12,6);
 FX.splat(pt.x,pt.y,rnd(0,6),col,115);FX.burst(pt.x,pt.y,75,col);
 // одна надпись на разрез: sever() мог уже добавить свою
 FX.list=FX.list.filter(f=>!(f.k==='word'&&f.t===0));if(frame-(o.plugin.wordAt??-99)>30){o.plugin.wordAt=frame;FX.word(pt.x,pt.y-42,'splat',95);}
 const st=o.plugin.stains=o.plugin.stains||[];
 st.push({a:Math.atan2(pt.y-o.position.y,pt.x-o.position.x)-o.angle,r:rnd(20,36),s:rnd(18,26),c:col,v:ri(1,4),t:frame});if(st.length>6)st.shift();
 shake=Math.min(12,shake+(ent.isPlayer?6:3));if(Mode.id==='level')hitStop=Math.max(hitStop,2);
 Snd.squish();
}
function dropWeapon(ent){
 const id=ent.weapon;if(!id||id==='fists')return;
 ent.weapon=null;
 const h=handPos(ent),len=(WPN_FIT[id]&&WPN_FIT[id].L)||40;
 const b=Bodies.rectangle(h.x,h.y,len*.9,9,{density:.002,friction:.6,chamfer:{radius:3},render:{fillStyle:'#8d97a8'},plugin:{deco:'wpn',wpn:id,len}});
 const e=addEnt('obj',[b]);e.age=0;
 Body.setVelocity(b,{x:rnd(-2,2),y:-3});Body.setAngularVelocity(b,rnd(-.2,.2));
}
// пришиваем всё обратно (шприц, воскрешение)
function reattachAll(ent){
 if(!ent.joints)return;
 for(const p of ['uaL','uaR','ulL','ulR','laL','laR','llL','llR']){
  const c=ent.joints[p];if(!c||!c.cut)continue;
  const par=ent.parts[PARENT[p]],ch=ent.parts[p];
  const w=Vector.add(par.position,Vector.rotate(c.pointA,par.angle));
  Body.setAngle(ch,par.angle);Body.setPosition(ch,Vector.sub(w,Vector.rotate(c.pointB,ch.angle)));
  Body.setVelocity(ch,{x:0,y:0});Body.setAngularVelocity(ch,0);
  for(const n of CHILDREN[p]||[]){const b=ent.parts[n];Body.setPosition(b,Vector.add(ch.position,{x:0,y:20*ent.s}));}
  c.cut=false;Composite.add(world,c);ent.cons.push(c);
 }
 for(const b of ent.bodies){if(b.plugin.gone){b.plugin.frozen=false;Body.setStatic(b,false);Body.setPosition(b,Vector.add(ent.parts.torso.position,{x:0,y:20*ent.s}));}b.plugin.gone=false;b.plugin.fadeAt=0;b.collisionFilter.group=ent.group;b.plugin.cut=false;b.plugin.stumps=null;b.plugin.drip=0;}
 ent.bleed=0;ent.limbLostAt=-999;for(const b of ent.bodies)b.plugin.trauma=0;recomputeAttached(ent);
}
// без рук — удар головой: рывок к цели и урон тому, в кого врезался
function headbutt(ent,aim,pw){
 ent.atkCd=40;ent.pw=pw||0;
 const t=ent.parts.torso,dir=Vector.normalise(Vector.sub(aim,t.position)),k=1+(pw||0);
 for(const b of ent.bodies)if(ent.attached.has(b.plugin.part))Body.setVelocity(b,Vector.add(b.velocity,{x:dir.x*7*k,y:dir.y*4-3}));
 Snd.swish();ent.butt=10;
}
function headbuttHit(ent){
 // проверяем попадание на всём рывке, засчитываем один раз
 if(!ent.butt)return;ent.butt--;
 const h=ent.parts.head.position,dir=Vector.normalise(Vector.sub(h,ent.parts.torso.position));
 for(const e of entities){
  if(e===ent||e.type!=='npc'||e.dead||e.hung||e.caged||(e.team===ent.team&&ent.team>=0))continue;
  const part=e.bodies.find(b=>Vector.magnitude(Vector.sub(b.position,h))<34*e.s);
  if(part){damageNpc(e,10*ent.dmgMul*(1+1.5*(ent.pw||0)),part.position.x,part.position.y,ent);for(const b of e.bodies)Body.setVelocity(b,Vector.add(b.velocity,{x:dir.x*4,y:-2}));e.stun=Math.max(e.stun,20);Snd.punch(ent.pw||0,'fists');ent.butt=0;return;}
 }
}
function drip(ent){
 if(frame%5)return;
 for(const b of ent.bodies){
  if(!b.plugin.drip||!b.plugin.stumps)continue;
  b.plugin.drip-=5;
  const st=b.plugin.stumps[b.plugin.stumps.length-1],w=Vector.add(b.position,Vector.rotate(st,b.angle));
  particles.push({x:w.x,y:w.y,vx:rnd(-.8,.8),vy:rnd(-1.5,.2),life:rnd(30,50),c:NPC[ent.kind].juice,r:rnd(1.5,3)});
 }
}
