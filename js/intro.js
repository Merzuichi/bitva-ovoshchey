'use strict';
// v530: интро для новых игроков (A/B: S.ab.intro = 'intro' | 'control').
// Уровень-пробежка: камера следует за героем. Сначала кат-сцена — огурец с автоматом сам бежит вперёд и
// расстреливает врагов впереди; когда все повержены, управление переходит игроку. Дальше враги идут группами
// по 2–3: то с одной стороны, то с другой. В конце — большая группа с обеих сторон, экран темнеет:
// «За два дня до этого…» — и начинается обучающая глава.
// Проиграть по-настоящему нельзя: до финала здоровье не падает ниже 1; финал кончается по времени или гибелью.
const Intro={
 START_X:5100,   // старт у правого края: в кат-сцене герой бежит влево
 CUT_T:300,      // кат-сцена 5 с: героем управляет бот, игрок не управляет ничем
 SLOW_T:90,      // последние ~1,5 с кат-сцены — слоу-мо
 DEF:{introBattle:true,n:'Финальная битва',en:'The Final Battle',type:'arena',obj:'intro',map:'factory',len:6000,plats:[],hazards:[],enemies:[],props:[],allies:[],mods:[]},
 SCALE:1,          // v538: обычный размер прокачанного героя (при ×1,1 физика тела поднимала его над полом)
 WAVES:2,          // волн после кат-сцены (стороны чередуются)
 FINALE_T:240,     // ~5 с финальной толпы
 MAX_T:3600,       // страховка: не дольше минуты до финала
 FOES:['perets','kukuruza','kapusta','pomidor'],
 active:false,t:0,phase:'',ended:false,spawned:0,wave:0,group:[],waitT:0,finaleT:0,cutFoes:[],
 variant(){
  // только новые игроки получают вариант; ?intro=1 / ?intro=0 — принудительно для проверки (локально)
  try{const q=new URLSearchParams(location.search).get('intro');if(PF.devAllowed&&(q==='1'||q==='0'))return q==='1'?'intro':'control';}catch(_){}
  S.ab=S.ab||{};
  if(!S.ab.intro){S.ab.intro=Math.random()<.5?'intro':'control';save();GameStats.send('ab_assigned',{test:'intro',variant:S.ab.intro});}
  return S.ab.intro;
 },
 wanted(){return !S.tut.introSeen&&this.variant()==='intro';},
 // вызывается из buildLevel: ровная длинная дорога (без ящиков и монет)
 build(def){
  setLevelWidth(def.len);
  // v538: монет в интро нет
 },
 start(){
  S.tut.introSeen=1;save();
  Run.trial=null;Run.boost=null;Run.activeBoost=null;
  Run.kind='story';Run.idx=0;Run.heroId='ogurets';Run.reviveUsed=false;Run.heroHp=1;
  closeModal();resetGameInput();pauseAll(false,'storyIntro');
  Object.assign(this,{active:true,t:0,phase:'cut',ended:false,spawned:0,wave:0,group:[],waitT:0,finaleT:0});
  buildLevel({...this.DEF});render();
  document.body.classList.add('intro-cut');
  const h=Run.hero;
  if(h){h.facing=1;h.weapon='smg';h.ammoW=null;h.hpMax*=4;h.hp=h.hpMax;h.invuln=120;
   try{HeroEvolution.apply(h,UPG_MAX.story,UPG_MAX.story);}catch(_){}}
  // кат-сцена: герой убегает влево, погоня справа; он разворачивается и отстреливается
  const x0=h?h.parts.torso.position.x:this.START_X;
  this.cutFoes=[260,400,560].map(dx=>this.chaser(x0+dx));
  showBanner(t('Финальная битва'),t('Патроны бесконечны!'),'#ffe27a');
  GameStats.send('intro_started',{variant:'intro'});
 },
 // преследователь: быстрый, чтобы погоня не отставала
 chaser(x){const e=this.spawnAt(x,-1);e.speed=Math.max(e.speed||0,4.6);return e;},
 spawnAt(x,facing){
  const e=spawnEnemy({k:pick(this.FOES),w:Math.random()<.25?'pistol':pick(['fists','bat']),x:clamp(x,60,LW-60)/WW,hp:.3,dm:.5,sp:2.4+Math.random()*.5,aggro:2000});
  e.facing=facing;this.spawned++;return e;
 },
 // группа у края экрана: side 1 — впереди (справа), -1 — сзади (слева)
 spawnGroup(side,n){
  const h=Run.hero,hx=h.parts.torso.position.x,out=[];
  for(let k=0;k<n;k++)out.push(this.spawnAt(hx+side*(viewW*.6+80+k*70),-side));
  return out;
 },
 down(list){return list.every(e=>!e||e.dead||e.removed);},
 // подсказка «нажимай на удар»: подсвеченная кнопка атаки; гаснет после первых выстрелов игрока
 fireHint(on){
  const b=document.querySelector('#controls .atk');
  if(on){this.hintOn=true;this.shots=0;b&&b.classList.add('tut-hl');showTip(t(fineInput()?'Стреляй: нажимай F или левую кнопку мыши!':'Нажимай на кнопку удара, чтобы стрелять!'));}
  else{this.hintOn=false;b&&b.classList.remove('tut-hl');}
 },
 cutscene(){return this.active&&this.phase==='cut';},
 move(mv){return this.active&&this.phase==='cut'?-1:mv;},
 // v539: сам стреляет только бот в кат-сцене; после передачи управления стреляет игрок
 autoFire(h){return this.active&&this.phase==='cut'&&!!h.target;},
 tick(){
  if(!this.active||screen!=='play'||this.ended)return;
  const h=Run.hero;
  this.t++;
  // трупы быстро тают, чтобы не заваливали экран
  for(const e of entities)if(e.type==='npc'&&e.team===1&&e.dead&&e.deadAt!==undefined&&!e.introFast){e.introFast=true;e.deadAt=Math.min(e.deadAt,frame-SB_CORPSE_T+50);}
  if(h&&!h.removed&&!h.dead){
   h.ammo=WEAPONS[h.weapon]?.mag||h.ammo;h.reload=0;  // бесконечные патроны
   // v538: на бегу (особенно спиной вперёд) регдолл понемногу «всплывал» над полом — прижимаем, пока герой не в прыжке
   {const feet=Math.max(...['llL','llR'].filter(n=>h.attached.has(n)).map(n=>h.parts[n].bounds.max.y)),gap=FLOOR-feet,vy=h.parts.torso.velocity.y;
    if(gap>2&&gap<60&&Math.abs(vy)<1.5&&!keys.jump&&!(h.jumpBuf>0)){const d=Math.min(gap-1,1.6);for(const b of h.bodies)Body.translate(b,{x:0,y:d});}}
   if(this.phase!=='finale')h.hp=Math.max(h.hp,1);
   if(this.phase==='cut'){
    h.runT=0;  // без разгона: погоня держится рядом
    // v536: кат-сцена — игрок не управляет: весь ввод гасится, кнопки спрятаны (body.intro-cut)
    for(const k in keys)keys[k]=false;h.jumpBuf=0;h.dashBuf=0;h.atkQueued=0;h.throwQueued=false;drive=null;jumpQ=0;
    // погоня не кончается: на место сбитых справа выбегают новые (до слоу-мо)
    const slowAt=this.CUT_T-this.SLOW_T;
    if(this.t%28===0&&this.t<slowAt-30&&this.cutFoes.filter(e=>!e.dead&&!e.removed).length<6)this.cutFoes.push(this.chaser(h.parts.torso.position.x+viewW*.6+60));
    // последние враги — в слоу-мо: двое совсем рядом, хилые, герой добивает их замедленно
    if(this.t===slowAt){
     for(const dx of [260,380]){const e=this.chaser(h.parts.torso.position.x+dx);e.hp=e.hpMax=Math.min(e.hpMax,8);this.cutFoes.push(e);}
     slow=true;GameStats.send('intro_step',{step:'slowmo'});
    }
    if(this.t>=this.CUT_T){
     slow=false;document.body.classList.remove('intro-cut');
     this.phase='play';this.waitT=20;this.group=this.cutFoes.slice();
     toast(t('Управление твоё! Отбивайся'));GameStats.send('intro_step',{step:'control'});
     this.fireHint(true);
    }
   }else if(this.phase==='play'){
    if(this.hintOn&&(keys.attack||h.atkQueued>frame-2)&&++this.shots>40)this.fireHint(false);
    // v539: враги нападают чаще — следующая группа не ждёт полной зачистки: хватает, чтобы в живых осталось не больше одного
    if(this.group.filter(e=>e&&!e.dead&&!e.removed).length<=1){
     if(--this.waitT<=0){
      if(this.wave>=this.WAVES||this.t>this.MAX_T){
       this.phase='finale';this.finaleT=0;GameStats.send('intro_step',{step:'finale'});
       showBanner(t('Их слишком много!'),'','#ff8a6a');
       this.group=[...this.spawnGroup(1,4),...this.spawnGroup(-1,4)];
      }else{
       const side=this.wave%2===0?1:-1;this.wave++;
       this.group=this.spawnGroup(side,this.wave<3?3:4);this.waitT=25;
       GameStats.send('intro_step',{step:'wave',wave:this.wave});
      }
     }
    }
   }else if(this.phase==='finale'){
    this.finaleT++;
    if(this.finaleT%40===0&&entities.filter(e=>e.type==='npc'&&e.team===1&&!e.dead&&!e.removed).length<12)this.group.push(...this.spawnGroup(this.finaleT%80?1:-1,2));
    if(this.finaleT>=this.FINALE_T)this.finish('time');
   }
  }
  if(!h||h.removed||h.dead)this.finish('died');
 },
 finish(why){
  if(this.ended)return;this.ended=true;this.fireHint(false);slow=false;document.body.classList.remove('intro-cut');
  Run.state='cutscene';
  GameStats.send('intro_completed',{reason:why,seconds:Math.round(this.t/60),foes:this.spawned,waves:this.wave});
  const d=document.createElement('div');d.id='introFade';
  d.style.cssText='position:fixed;inset:0;z-index:1500;background:#000;opacity:0;transition:opacity .9s;display:flex;align-items:center;justify-content:center;pointer-events:all';
  d.innerHTML=`<div style="color:#fff;font:900 clamp(28px,6vw,56px) Nunito,system-ui;text-align:center;opacity:0;transition:opacity .8s .9s;text-shadow:0 3px 0 #000">${t('За два дня до этого…')}</div>`;
  document.body.appendChild(d);
  requestAnimationFrame(()=>{d.style.opacity='1';d.firstChild.style.opacity='1';});
  setTimeout(()=>{
   this.active=false;
   startStoryFromMenu();
   d.firstChild.style.transition='opacity .5s';d.firstChild.style.opacity='0';d.style.transition='opacity .8s .3s';d.style.opacity='0';
   setTimeout(()=>d.remove(),1300);
  },3400);
 },
 abort(){this.fireHint(false);this.active=false;this.ended=true;slow=false;document.body.classList.remove('intro-cut');document.getElementById('introFade')?.remove();}
};
