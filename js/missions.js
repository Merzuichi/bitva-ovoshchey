'use strict';
// UTC day boundary matches the existing save date helper; all rewards are claimed once.
const Missions={
 timer:0,noticeAt:-999,
 // v=522: 18 заданий дня в трёх уровнях сложности (tier): каждый день по одному из каждого уровня
 pool:[
  {id:'foes',tier:1,event:'defeat',target:10,text:'Победи 10 врагов',icon:'enemies'},
  {id:'coins',tier:1,event:'loot_coins',target:30,text:'Собери 30 монет на уровнях',icon:'coin'},
  {id:'crates',tier:1,event:'crate',target:5,text:'Разбей 5 ящиков',icon:'cat_items'},
  {id:'dashes',tier:1,event:'dash',target:10,text:'Сделай 10 рывков',icon:'upg_speed'},
  {id:'cps',tier:1,event:'checkpoint',target:3,text:'Доберись до 3 контрольных точек',icon:'flag'},
  {id:'equip',tier:1,event:'sandbox_equip',target:3,text:'Выдай оружие трём бойцам в песочнице',icon:'cat_weapons'},
  {id:'wins',tier:2,event:'win',target:2,text:'Пройди 2 уровня',icon:'trophy'},
  {id:'strong',tier:2,event:'strong_hit',target:5,text:'Попади по врагу 5 раз с полного замаха',icon:'muscle'},
  {id:'ram',tier:2,event:'ram',target:3,text:'Сбей врагов тараном 3 раза',icon:'stat_knock'},
  {id:'foes25',tier:2,event:'defeat',target:25,text:'Победи 25 врагов',icon:'enemies'},
  {id:'rescue',tier:2,event:'rescue',target:2,text:'Освободи 2 друзей из клеток',icon:'dove',ok:()=>S.story.open>=6},
  {id:'battle',tier:2,event:'sandbox_battle',target:1,text:'Устрой бой двух команд в песочнице',icon:'fight'},
  {id:'story2',tier:3,event:'story_win',target:2,text:'Пройди 2 главы истории',icon:'book'},
  {id:'arcade3',tier:3,event:'arcade_win',target:3,text:'Пройди 3 уровня аркады',icon:'medal_gold'},
  {id:'boss',tier:3,event:'boss_win',target:1,text:'Победи босса',icon:'crown',ok:()=>S.story.open>=7||(S.arcadeBest||0)>=4},
  {id:'cuts',tier:3,event:'cut',target:5,text:'Отруби врагам 5 частей тела',icon:'scissors'},
  {id:'puzzle3',tier:3,event:'puzzle3',target:1,text:'Пройди головоломку на 3 звезды',icon:'puzzle',ok:()=>S.story.open>=3},
  {id:'coins60',tier:3,event:'loot_coins',target:60,text:'Собери 60 монет на уровнях',icon:'coin_big'}
 ],
 TIER_REWARD:[0,30,45,60],
 novice:[
  {id:'first_win',event:'win',target:1,reward:50,text:'Одержи первую победу',icon:'trophy'},
  {id:'first_loot',event:'loot_coins',target:20,reward:40,text:'Собери первые 20 монет',icon:'coin'},
  {id:'first_upgrade',event:'upgrade',target:1,reward:60,text:'Улучши любого героя',icon:'upgrade'},
  {id:'first_sandbox',event:'sandbox_battle',target:1,reward:60,text:'Создай свою первую битву в песочнице',icon:'fight'},
  {id:'first_dash',event:'dash',target:5,reward:30,text:'Сделай 5 рывков',icon:'upg_speed'},
  {id:'three_wins',event:'win',target:3,reward:80,text:'Победи в трёх уровнях',icon:'star_full'}
 ],
 // На телефоне и планшете песочницы нет (docs/MOBILE_UI_SPEC.md): задания про неё там невыполнимы.
 // Ежедневные меняются на обычные, а в «Миссиях новичка» вместо «первой битвы» стоит приглашение зайти с ПК.
 // Прогресс общий (сохранение одно): сыграл в песочницу на ПК — награду можно забрать и на телефоне.
 mobileAlt:{
  battle:{id:'dashes',event:'dash',target:10,reward:40,text:'Сделай 10 рывков',icon:'upg_speed'},
  equip:{id:'foes20',event:'defeat',target:20,reward:40,text:'Победи 20 врагов',icon:'enemies'}
 },
 pcTask:{id:'pc_sandbox',event:'sandbox_play',target:1,reward:100,text:'Зайди в игру с ПК и сыграй в особый режим «Песочница»',pcText:'Загляни в особый режим «Песочница»',img:'ui_mode_sandbox',pc:true},
 mobile(){return document.body.classList.contains('is-mobile');},
 // v=425: на телефоне в заданиях нет ничего про песочницу (и приглашения «зайди с ПК» тоже)
 noviceList(){return this.mobile()?this.novice.filter(q=>!q.event.startsWith('sandbox')):this.novice.concat([this.pcTask]);},
 isNovice(q){return q===this.pcTask||this.novice.includes(q);},
 label(q){return t(q.pcText&&!this.mobile()?q.pcText:q.text);},
 state(){
  const day=today();
  if(!S.missions||typeof S.missions!=='object')S.missions={total:{},noviceClaimed:{}};
  const m=S.missions;m.total=m.total||{};m.noviceClaimed=m.noviceClaimed||{};
  if(m.day!==day){
   m.day=day;m.dailyIds=this.pick(day);m.counts={};m.claimed={};m.bonus=false;save();
  }
  return m;
 },
 // выбор на день: детерминированно по дате, по одному заданию каждого уровня, без повторов события, не больше одного про песочницу (на телефоне — ни одного)
 pick(day){
  let x=(Math.floor(Date.parse(day)/86400000)*2654435761)>>>0;const rnd=()=>(x=(x*1664525+1013904223)>>>0)/4294967296;
  const ids=[],ev=new Set(),mob=this.mobile();let sb=0;
  for(const tier of [1,2,3]){
   const c=this.pool.filter(q=>q.tier===tier&&!ev.has(q.event)&&(!q.ok||q.ok())&&!(q.event.startsWith('sandbox')&&(mob||sb)));
   const q=c[Math.floor(rnd()*c.length)];if(!q)continue;ids.push(q.id);ev.add(q.event);if(q.event.startsWith('sandbox'))sb++;
  }
  return ids;
 },
 reward(q){return q.reward||this.TIER_REWARD[q.tier]||40;},
 // серия: дни подряд, когда забран бонус «все задания дня»; бонус 50, 60, 70 … до 120
 nextStreak(){const m=this.state(),y=new Date(Date.parse(m.day)-86400000).toISOString().slice(0,10);return m.bonusDay===m.day?m.streak||1:m.bonusDay===y?(m.streak||0)+1:1;},
 bonusCoins(){return Math.min(120,40+10*this.nextStreak());},
 bonusText(){const m=this.state(),n=this.nextStreak();return m.bonus?t('Бонус получен')+(n>1?' · '+t('серия {0} дн.',n):''):t('Все задания дня: +{0} монет',this.bonusCoins())+(n>1?' · '+t('серия {0} дн.',n):'');},
 daily(){const m=this.state(),mob=this.mobile();return m.dailyIds.map(id=>this.pool.find(x=>x.id===id)).filter(Boolean).map(q=>mob&&this.mobileAlt[q.id]||q);},
 progress(task,novice=false){const m=this.state();return Math.min(task.target,Math.max(0,Number((novice?m.total:m.counts)[task.event])||0));},
 record(event,amount=1){
  if(!Number.isFinite(amount)||amount<=0)return;
  if(event!=='upgrade'&&!((screen==='play'&&Mode.id==='level')||(screen==='sandbox'&&Mode.id==='sandbox')))return;
  const m=this.state(),tasks=this.daily().concat(this.noviceList()),before=tasks.map(q=>this.progress(q,this.isNovice(q)));
  m.counts[event]=Math.min(1000000,(Number(m.counts[event])||0)+amount);m.total[event]=Math.min(1000000,(Number(m.total[event])||0)+amount);save();
  tasks.forEach((q,i)=>{if(q.event===event&&before[i]<q.target&&this.progress(q,this.isNovice(q))>=q.target){
   GameStats.send('mission_completed',{mission:q.id,group:this.isNovice(q)?'novice':'daily'});
  }});this.syncEntry();
 },
 rewards(){
  const m=this.state(),tasks=this.daily();
  const daily=tasks.filter(q=>this.progress(q)>=q.target&&!m.claimed[q.id]).length+(!m.bonus&&tasks.every(q=>m.claimed[q.id])?1:0);
  const novice=this.noviceList().filter(q=>this.progress(q,true)>=q.target&&!m.noviceClaimed[q.id]).length;
  const sandbox=this.mobile()||typeof SbM==='undefined'?0:SbM.ready().total;  // задания песочницы: на телефоне её нет
  return {daily,novice,sandbox,total:daily+novice+sandbox};
 },
 // пока не пройдено обучение, кнопка заданий неактивна
 unlocked(){return tutDone();},
 ready(){return this.rewards().total>0;},
 syncEntry(){
  const buttons=[$('#mMissions'),$('#pMissions')].filter(Boolean);if(!buttons.length)return;
  const lock=!this.unlocked(),total=lock?0:this.rewards().total;
  for(const button of buttons){
  button.disabled=lock;button.classList.toggle('locked',lock);
  button.classList.toggle('mission-ready',total>0);button.classList.toggle('y',total>0);
  let badge=button.querySelector('.mission-dot');
  if(total){
   if(!badge){badge=document.createElement('i');badge.className='mission-dot';badge.setAttribute('aria-hidden','true');button.append(badge);}
   if(badge.textContent!==String(total))badge.textContent=total;
  }else if(badge)badge.remove();
  const label=lock?t('Откроется после обучения'):total?t('Задания: наград к получению — {0}',total):t('Задания');
  button.title=label;button.setAttribute('aria-label',label);
  }
 },
 claim(id,group,mult=1){
  const m=this.state(),novice=group==='novice',task=(novice?this.noviceList():this.daily()).find(q=>q.id===id),claimed=novice?m.noviceClaimed:m.claimed;
  if(!task||claimed[id]||this.progress(task,novice)<task.target)return false;
  claimed[id]=1;const r=this.reward(task)*mult;addCoins(r);save();this.syncEntry();Snd.reward();GameStats.send('mission_reward_claimed',{mission:id,group,reward:r,multiplier:mult});return true;
 },
 refreshClaims(group){
  const m=this.state(),novice=group==='novice',claimed=novice?m.noviceClaimed:m.claimed;
  // награда получена — кнопка «×2 за рекламу» у этого задания больше не нужна
  for(const b of document.querySelectorAll('.missions-box [data-mclaim2]'))if(claimed[b.dataset.mclaim2])b.remove();
  for(const button of document.querySelectorAll('.missions-box [data-mclaim]')){
   if(!claimed[button.dataset.mclaim])continue;
   button.disabled=true;button.classList.remove('y');button.textContent=t('Получено');
  }
  const rewards=this.rewards();
  for(const tab of document.querySelectorAll('.missions-box [data-mtab]')){
   const count=rewards[tab.dataset.mtab];let badge=tab.querySelector('.mission-tab-badge');
   tab.classList.toggle('blink',!!count);if(!count){badge?.remove();continue;}
   if(!badge){badge=document.createElement('i');badge.className='mission-tab-badge';tab.append(badge);}badge.textContent=count;
  }
  const bonus=$('#missionBonus');if(bonus){const ready=!m.bonus&&this.daily().every(q=>m.claimed[q.id]);bonus.disabled=!ready;bonus.classList.toggle('y',ready);bonus.textContent=this.bonusText();}
  this.syncEntry();
 },
 open(group){
  if(!this.unlocked()){toast(t('Задания откроются после обучения'));return;}
  const rewards=this.rewards();
  if(!group)group=rewards.daily?'daily':rewards.novice?'novice':rewards.sandbox?'sandbox':'daily';
  if(group==='sandbox'&&!this.mobile())return SbM.open(undefined,true);
  group=group==='novice'?'novice':'daily';clearTimeout(this.timer);
  this.syncEntry();$('#toast').replaceChildren();
  const close=()=>{clearTimeout(this.timer);closeModal();if(screen==='menu')buildMenu();};
  const m=this.state(),novice=group==='novice',tasks=novice?this.noviceList():this.daily(),claimed=novice?m.noviceClaimed:m.claimed;
  const rk=q=>{const dn=this.progress(q,novice)>=q.target,tk=!!claimed[q.id];return dn&&!tk?0:tk?2:1;};  // готовые к награде — вверх, полученные — вниз
  const canAd=Y.canReward();  // удвоение награды за рекламу — как в заданиях песочницы
  const cards=tasks.slice().sort((a,b)=>rk(a)-rk(b)).map(q=>{const n=this.progress(q,novice),done=n>=q.target,taken=!!claimed[q.id];return `<div class="mission-card ${done?'complete':''} ${q.pc?'pc-task':''}"><div class="mission-icon">${q.img?`<img class="ico" src="assets/ui/${q.img}.png?v=${ASSET_V}" alt="">`:IC(q.icon)}</div><div class="mission-copy"><b>${this.label(q)}</b><div class="mission-progress"><i style="width:${n/q.target*100}%"></i></div><small>${n}/${q.target}</small></div><div class="sbm-btns"><button class="btn sm ${done&&!taken?'y':''}" data-mclaim="${q.id}" ${!done||taken?'disabled':''}>${taken?t('Получено'):done?`${t('Забрать')} · ${this.reward(q)} ${IC('coin')}`:`${this.reward(q)} ${IC('coin')}`}</button>${done&&!taken&&canAd?`<button class="btn ad sm" data-mclaim2="${q.id}">🎬 ×2</button>`:''}</div></div>`;}).join('');
  const bonusReady=!m.bonus&&this.daily().every(q=>m.claimed[q.id]);
  modal(`<h3>${t('Задания')}</h3><div class="tabs ctr"><button data-mtab="daily" class="${novice?'':'on'} ${rewards.daily?'blink':''}">${t('На сегодня')}${rewards.daily?`<i class="mission-tab-badge">${rewards.daily}</i>`:''}</button><button data-mtab="novice" class="${novice?'on':''} ${rewards.novice?'blink':''}">${t('Миссии новичка')}${rewards.novice?`<i class="mission-tab-badge">${rewards.novice}</i>`:''}</button>${this.mobile()?'':`<button data-mtab="sandbox" class="${rewards.sandbox?'blink':''}">${t('Песочница')}${rewards.sandbox?`<i class="mission-tab-badge">${rewards.sandbox}</i>`:''}</button>`}</div><p class="missions-info">${t(novice?'Миссии не исчезают. Осваивай игру в своём темпе.':'Три задания на день. Выполни все и забери бонус — каждый день подряд он больше!')}</p>${novice?'':`<p id="missionTimer" data-day="${m.day}"></p>`}<div class="mission-list">${cards}</div>${novice?'':`<button class="btn ${bonusReady?'y':''}" id="missionBonus" ${!bonusReady?'disabled':''}>${this.bonusText()}</button>`}<button class="btn" id="missionClose">${t('Назад')}</button>`,{wide:true,x:closeModal});
  $('#modal .box').classList.add('missions-box');fitMobileModal();
  document.querySelectorAll('[data-mtab]').forEach(b=>b.onclick=()=>this.open(b.dataset.mtab));
  document.querySelectorAll('[data-mclaim]').forEach(b=>b.onclick=()=>{if(this.claim(b.dataset.mclaim,group))this.refreshClaims(group);});
  document.querySelectorAll('[data-mclaim2]').forEach(b=>b.onclick=async()=>{if(b.disabled)return;b.disabled=true;
   if(!(await Y.rewarded('mission_x2'))){if(b.isConnected)b.disabled=false;return;}
   if(this.claim(b.dataset.mclaim2,group,2))this.refreshClaims(group);});
  const bonus=$('#missionBonus');if(bonus)bonus.onclick=()=>{const s=this.state();if(s.bonus||!this.daily().every(q=>s.claimed[q.id]))return;const n=this.nextStreak(),r=this.bonusCoins();s.bonus=true;s.streak=n;s.bonusDay=s.day;addCoins(r);save();Snd.reward();GameStats.send('mission_reward_claimed',{mission:'all_daily',group:'daily',reward:r,streak:n});this.refreshClaims('daily');};
  $('#missionClose').onclick=close;const cross=$('#modal .mx');if(cross)cross.onclick=close;
  if(!novice)this.countdown();GameStats.send('missions_opened',{group});
 },
 countdown(){
  const n=$('#missionTimer');if(!n)return;
  if(n.dataset.day!==today()){this.open('daily');return;}
  const ms=Date.parse(today()+'T00:00:00Z')+86400000-Date.now(),seconds=Math.max(0,Math.floor(ms/1000));
  n.textContent=t('Новые задания через {0}',[Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(x=>String(x).padStart(2,'0')).join(':'));
  this.timer=setTimeout(()=>this.countdown(),1000);
 }
};
