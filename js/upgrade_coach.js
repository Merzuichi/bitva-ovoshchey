'use strict';
// Progression is taught on the already loaded level, after its story dialogue.
const COACH_DELAY=6*60;
const UpgradeCoach={
 phase:'idle',kind:null,hero:null,scene:null,oldWeapon:null,
 state(){return S.tut['gearCoach_'+Run.kind];},
 queue(){
  const key='gearCoach_'+Run.kind;if(S.tut[key])return;
  const u=heroData(Run.kind,Run.heroId);
  S.tut[key]={hero:Run.heroId,step:u.lv>=UPG_MAX[Run.kind]?(weaponOwned('bat')?'equip':'bat'):'upgrade',baseLv:u.lv};save();
 },
 clear(){
  const portrait=$('#hpico');if(portrait)portrait.classList.remove('tut-hl');
  $('#upgradeArrow')?.remove();
  const tutor=$('#tutor');if(tutor?.classList.contains('gear-coach')){tutor.classList.remove('on','gear-coach');tutor.innerHTML='';}
  pauseAll(false,'upgradeCoach');document.body.classList.remove('coach-pause');this.phase='idle';this.scene=null;this.inBetween=false;
 },
 tick(){
  if(this.phase!=='idle'){
   if(this.inBetween)return; // экран прокачки между уровнями: уровень уже закончен, это нормально
   if(screen!=='play'||Run.state!=='play'||Run.def!==this.scene){this.clear();return;}
   if(this.phase==='portrait')this.arrow();return;
  }
  if(screen!=='play'||Run.state!=='play'||Run.idx<1||Run.type==='puzzle'||!Run.hero||Run.hero.dead||Tut.on)return;
  if($('#modal').classList.contains('on')||pauseReasons.has('storyIntro')||document.hidden||$('.coinfx>.coins')||StoryDialogue.active)return;
  // v=446: не сразу при входе во второй уровень, а по ходу его: 6 с игры и рядом нет врагов (драку не прерываем)
  if(this.waitScene!==Run.def){this.waitScene=Run.def;this.waitFrom=frame;}
  if(frame-this.waitFrom<COACH_DELAY)return;  // игровые кадры: на паузе время не идёт
  {const p=Run.hero.parts.torso.position;if(entities.some(e=>e.type==='npc'&&e.team===1&&!e.dead&&!e.removed&&Math.abs(e.parts.torso.position.x-p.x)<450))return;}
  if(!this.state()&&(S.tut['firstMission_'+Run.kind]||S.tut[Run.kind==='story'?'fight':'arcade']))this.queue();
  const s=this.state();if(!s||s.step==='done')return;
  this.kind=Run.kind;this.hero=Run.heroId;s.hero=this.hero;
  this.scene=Run.def;this.phase='portrait';resetGameInput();resetCrateTutorial();pauseAll(true,'upgradeCoach');document.body.classList.add('coach-pause'); // сцена притемнена — видно, что игра стоит
  const gift='gearCoachGift_'+this.kind,u=heroData(this.kind,this.hero);this.oldWeapon=u.weapon;
  if(!S.tut[gift]){
   const budget=(s.step==='upgrade'?lvCost(u.lv,this.kind):0)+(weaponOwned('bat')?0:WEAPONS.bat.lock);
   if(S.coins<budget){S.coins=budget;showCoins();}S.tut[gift]=1;save();
  }
  $('#hpico').classList.add('tut-hl');
  const n=$('#tutor');n.classList.add('on','gear-coach');
  n.innerHTML=`<div class="tt">${t('Нажми на портрет героя — здесь прокачка и оружие!')}</div><button class="btn sm" id="gearSkip">${t('Пропустить')}</button>`;
  $('#gearSkip').onclick=()=>this.finish(true);this.arrow();
  GameStats.send('tutorial_started',{tutorial:'hero_progression',step:'portrait'});
  GameStats.send('tutorial_step',{tutorial:'hero_progression',step:'portrait'});
 },
 arrow(){
  let a=$('#upgradeArrow');if(!a){a=document.createElement('div');a.id='upgradeArrow';a.innerHTML=ARROW_SVG;document.body.append(a);}
  const r=$('#hpico').getBoundingClientRect();a.style.left=(r.left+r.width/2)+'px';a.style.top=(r.bottom+6)+'px';
 },
 open(){
  if(screen!=='play'||Run.state!=='play'||!Run.hero||Run.hero.dead||Run.type==='puzzle')return;
  const guided=this.phase==='portrait'||this.phase==='modal';
  const kind=Run.kind,id=Run.heroId;this.oldWeapon=heroData(kind,id).weapon;
  if(guided){this.phase='modal';$('#upgradeArrow')?.remove();$('#hpico').classList.remove('tut-hl');const n=$('#tutor');n.classList.remove('on','gear-coach');n.innerHTML='';}
  resetGameInput();S[kind==='arcade'?'ahero':'hero']=id;
  heroScreen(kind,{title:t('Прокачка героя'),coach:guided,noClose:guided,back:()=>{
   // v=455: в окне перелистнули на другого купленного героя — в игре теперь он (на том же месте, с тем же запасом здоровья)
   const sel=Object.keys(ROSTER[kind])[heroIdx[kind]];
   if(!guided&&sel&&sel!==id&&heroOwned(kind,sel))this.switchHero(kind,sel);else this.apply(kind,id);
   if(guided)this.finish(this.state()?.step!=='ready');}});
 },
 switchHero(kind,nid){
  const old=Run.hero;if(!old||old.dead||old.removed||Run.kind!==kind)return;
  const p={...old.parts.torso.position},frac=clamp(old.hp/Math.max(1,old.hpMax-(old.tempHp||0)),0,1),bonus=old.hpAdBonus||0;
  Run.heroId=nid;S[kind==='arcade'?'ahero':'hero']=nid;Run.trial=null;Run.gunUi=undefined;save();
  respawnHero(p.x,bonus,'switch');Run.deaths=Math.max(0,Run.deaths-1);  // смена героя — не смерть
  const h=Run.hero;const dy=p.y-h.parts.torso.position.y;for(const b of h.bodies)Body.translate(b,{x:0,y:dy});
  h.hp=Math.max(1,h.hpMax*frac);h.invuln=40;FX.heal&&FX.heal(p.x,p.y-40);updateHud();updateCam(true);
  GameStats.send('hero_switched',{hero:nid,where:'in_level'});
 },
 apply(kind,id){
  const h=Run.hero;if(!h||h.dead||h.removed||Run.kind!==kind||Run.heroId!==id)return;
  const previousLevel=h.upgradeLevel||0;
  const st=heroStats(kind,id),fraction=clamp(h.hp/h.hpMax,0,1),u=heroData(kind,id);
  h.hpMax=st.hp+(h.hpAdBonus||0);h.hp=Math.max(1,h.hpMax*fraction);h.dmgMul=st.dmgMul*(h.adBoost==='dmg'?BOOST_DMG:1);h.speed=st.speed*(h.adBoost==='spd'?BOOST_SPD:1);HeroEvolution.apply(h,u.lv,UPG_MAX[kind]);updateCam(true);if(u.lv>previousLevel){HeroEvolution.pending.delete(kind+':'+id);HeroEvolution.celebrate(h);}
  if(u.weapon!==this.oldWeapon){h.weapon=u.weapon;h.ammoW=null;h.reload=0;h.atkCd=0;h.charge=0;h.swing=0;Run.trial=null;Run.gunUi=undefined;}
  updateHud();
 },
 upgraded(id){
  const s=this.state();if(this.phase!=='modal'||id!==this.hero||s?.step!=='upgrade')return;
  s.step=weaponOwned('bat')?'equip':'bat';save();
 },
 // бита сразу оказывается в руках — шаг «возьми биту» пропускаем
 unlocked(id){const s=this.state();if(this.phase==='modal'&&s?.step==='bat'&&id==='bat'){s.step='ready';S.tut.batShown=1;save();}},
 equipped(id){const s=this.state();if(this.phase==='modal'&&s?.step==='equip'&&id==='bat'){s.step='ready';save();}},
 decorate(){
  if(this.phase!=='modal')return;
  const s=this.state();if(!s)return;
  $('#modal .box').classList.add('gear-coach-box');
  if(s.step==='bat'&&weaponOwned('bat')){s.step='equip';save();}
  const text={upgrade:'Улучшение навсегда повышает здоровье, урон и скорость. Нажми «Улучшить».',bat:'Теперь открой биту за монеты — денег достаточно!',equip:'Нажми на открытую биту, чтобы взять её в бой.',ready:'Бита готова! Нажми «В бой» и проверь новое оружие.'};
  const note=document.createElement('div');note.className='hx-coach';note.textContent=t(text[s.step]);$('#modal .hx').before(note);
  $('#hxPrev').disabled=true;$('#hxNext').disabled=true;document.querySelectorAll('[data-hi]').forEach(b=>b.style.pointerEvents='none');
  for(const b of document.querySelectorAll('.hx-w'))b.disabled=!(s.step==='bat'&&b.dataset.unw==='bat'||s.step==='equip'&&b.dataset.hw==='bat');
  const up=$('#hxUp');if(up&&s.step!=='upgrade')up.disabled=true;
  const target=s.step==='upgrade'?up:s.step==='bat'?$('.hx-w[data-unw="bat"]'):s.step==='equip'?$('.hx-w[data-hw="bat"]'):$('#hxBack');
  if(target){target.classList.add('tut-hl');requestAnimationFrame(()=>{if(target.isConnected)target.scrollIntoView({block:'nearest'});});}
  $('#hxBack').textContent=t(s.step==='ready'?'В бой':'Пропустить');$('#hxBack').classList.toggle('g',s.step==='ready');$('#hxAd')?.remove();
  GameStats.send('tutorial_step',{tutorial:'hero_progression',step:s.step});
 },
 // сразу после победы в первом уровне: экран прокачки с подсказками, монет хватает на первое улучшение и биту.
 // Возвращает обещание — следующий уровень начинается, когда игрок нажмёт «В бой» (или «Пропустить»)
 between(){return new Promise(res=>{
  if(!this.state()&&(S.tut['firstMission_'+Run.kind]||S.tut[Run.kind==='story'?'fight':'arcade']))this.queue();
  const s=this.state();if(!s||s.step==='done'){res();return;}
  this.kind=Run.kind;this.hero=Run.heroId;s.hero=this.hero;this.phase='modal';this.scene=null;this.inBetween=true;
  const gift='gearCoachGift_'+this.kind,u=heroData(this.kind,this.hero);this.oldWeapon=u.weapon;
  if(!S.tut[gift]){const budget=(s.step==='upgrade'?lvCost(u.lv,this.kind):0)+(weaponOwned('bat')?0:WEAPONS.bat.lock);if(S.coins<budget)addCoins(budget-S.coins);S.tut[gift]=1;save();}
  S[this.kind==='arcade'?'ahero':'hero']=this.hero;
  GameStats.send('tutorial_started',{tutorial:'hero_progression',step:'after_first_win'});
  GameStats.send('tutorial_step',{tutorial:'hero_progression',step:'after_first_win'});
  heroScreen(this.kind,{title:t('Прокачка героя'),coach:true,noClose:true,back:()=>{this.finish(this.state()?.step!=='ready');res();}});
 });},
 finish(skipped=false){
  const s=this.state();if(s){s.step='done';save();}
  if(this.kind&&this.hero)this.apply(this.kind,this.hero);
  GameStats.send(skipped?'tutorial_skipped':'tutorial_completed',{tutorial:'hero_progression'});
  this.clear();resetGameInput();
 }
};
