'use strict';
// Игровая аналитика. На Playgama события уходят в bridge.analytics.send; на любой площадке они
// дополнительно пишутся в короткий журнал GameStats.log (последние LOG_MAX), его читают тесты (tools/e2e.cjs).
// ?analytics=debug при локальном запуске печатает каждое событие в консоль.
// Требования Bridge: имя в snake_case, данные — плоский объект только из строк, чисел и логических значений.
// Показы рекламы, покупки, начало/конец сессии и сообщения platform.sendMessage площадка пишет сама — их здесь не дублируем.
const TUTORIAL_VERSION='t396';  // менять при изменении шагов обучения
const GameStats={
 version:'551',mode:null,modeMs:0,attempt:null,attemptNumber:0,lastTime:0,frames:[],sampleMs:0,milestones:new Set(),
 log:[],LOG_MAX:400,counters:{},bootAt:performance.now(),
 debug:(()=>{try{return PF.devAllowed&&new URLSearchParams(location.search).get('analytics')==='debug';}catch(_){return false;}})(),
 context(){
  const level=this.mode==='story'||this.mode==='arcade';
  return {build_version:this.version,mode:this.mode||'menu',level_index:level?Run.idx+1:0,player_day:this.playerDay(),ab_intro:(typeof S!=='undefined'&&S&&S.ab&&S.ab.intro)||''};
 },
 // только примитивы, без undefined/NaN; строки укорочены, вложенное — строкой
 clean(data){
  const out={};
  for(const [k,v] of Object.entries(data||{})){
   if(v===undefined||v===null)continue;
   if(typeof v==='number'){if(Number.isFinite(v))out[k]=Math.round(v*1000)/1000;continue;}
   if(typeof v==='boolean'){out[k]=v;continue;}
   out[k]=String(typeof v==='object'?JSON.stringify(v):v).slice(0,120);
  }
  return out;
 },
 send(name,data={}){
  // версия обучения — чтобы сравнивать воронку обучения между сборками (руководство Playgama по телеметрии)
  if(name.startsWith('tutorial_'))data={tutorial_version:TUTORIAL_VERSION,...data};
  const payload=this.clean({...this.context(),...data});
  this.log.push({name,t:Math.round(performance.now()),...payload});
  if(this.log.length>this.LOG_MAX)this.log.splice(0,this.log.length-this.LOG_MAX);
  if(this.debug)console.log('[stats]',name,payload);
  if(typeof PF.track==='function')try{PF.track(name,payload);}catch(_){}  // v547: площадки со своей аналитикой (Пикабу → Метрика)
  if(PF.name!=='playgama'||!PF.ok||!window.bridge?.analytics?.send)return;
  try{Promise.resolve(bridge.analytics.send(name,payload)).catch(()=>{});}catch(_){}
 },
 // счётчики действий внутри режима (спавн в песочнице и т.п.) — уходят одним событием при выходе из режима
 bump(key,n=1){this.counters[key]=(this.counters[key]||0)+n;},
 setMode(mode){
  if(this.mode===mode)return;
  this.leaveMode('mode_switch');
  this.mode=mode;this.modeMs=0;this.milestones.clear();this.counters={};
  this.send('mode_entered');
 },
 leaveMode(reason){
  this.endAttempt('left',reason);
  if(this.mode)this.send('mode_left',{reason,active_seconds:Math.round(this.modeMs/1000),...this.counters});
  this.mode=null;this.modeMs=0;this.frames=[];this.sampleMs=0;this.lastTime=0;this.counters={};
 },
 // v527: день игрока (0 — первый день) — для удержания D1/D7 по событиям; дата первого входа хранится в сохранении
 playerDay(){
  try{if(typeof S==='undefined'||!S||!S.firstDay)return 0;return Math.max(0,Math.round((Date.parse(new Date().toISOString().slice(0,10))-Date.parse(S.firstDay))/86400000));}catch(_){return 0;}
 },
 // retry: как начата попытка — new | restart | checkpoint | revive | rotate | hint
 beginAttempt(retry='new'){
  if(Run.def?.introBattle)return;  // v529: интро не попадает в воронку уровней (свои события intro_*)
  this.endAttempt('left','restart');
  this.setMode(Run.kind);
  const def=Run.def||{};
  // step_id / step_index — поля из руководства Playgama по телеметрии: стабильный ид шага воронки (story_12, arcade_5)
  this.attempt={...this.context(),step_id:(Run.kind||'level')+'_'+(Run.idx+1),step_index:Run.idx+1,attempt_index:++this.attemptNumber,active_ms:0,level_type:def.climb?.ascent?'ascent':def.climb?'climb':def.chase?'chase':def.rescueNo!==undefined?'rescue':Run.type,chapter:Run.kind==='story'?String(def.en||def.n||''):'',objective:def.obj||'',map:mapId,hero:Run.heroId,
   hero_level:heroData(Run.kind,Run.heroId).lv||0,act:Run.kind==='story'?(def.act??-1)+1:0,retry};
  this.send('progression_started',{...this.attempt,active_ms:0});
  this.send('level_started',{level:Run.idx+1,level_name:def.en||def.n||('Level '+(Run.idx+1)),mode:Run.kind||'story',level_type:this.attempt.level_type,step_id:this.attempt.step_id,step_index:this.attempt.step_index,attempt_index:this.attempt.attempt_index,retry,hero:this.attempt.hero,hero_level:this.attempt.hero_level});
 },
 endAttempt(result,reason){
  if(!this.attempt)return;
  const a=this.attempt;this.attempt=null;
  const extra=result==='left'?{}:{hp_left_pct:Math.round(heroHpFrac()*100),deaths:Run.deaths||0,cuts:Run.cuts||0,kills:Run.goalKills||0,
   stars:result==='completed'&&Run.kind==='story'?storyStars():0,boosted:boostActive()||!!levelBoost(),boost:levelBoost()?.type||'',trial_weapon:trialWeapon()||''};
  this.send('progression_'+result,{...a,active_ms:undefined,active_seconds:Math.round(a.active_ms/1000),duration_sec:Math.round(a.active_ms/1000),reason,weapon:Run.hero?.weapon||'fists',coins:Run.coinsGot||0,...extra});
  if(result==='completed'){
   this.send('level_completed',{level:a.step_index,level_name:a.chapter||('Level '+a.step_index),mode:a.mode||'story',level_type:a.level_type,step_id:a.step_id,attempt_index:a.attempt_index,duration_sec:Math.round(a.active_ms/1000),stars:extra.stars||0,score:Run.coinsGot||0,hp_left_pct:extra.hp_left_pct,kills:extra.kills||0,weapon:Run.hero?.weapon||'fists'});
  }else if(result==='failed'){
   this.send('level_failed',{level:a.step_index,level_name:a.chapter||('Level '+a.step_index),mode:a.mode||'story',level_type:a.level_type,step_id:a.step_id,attempt_index:a.attempt_index,reason:reason||'failed',duration_sec:Math.round(a.active_ms/1000),hp_left_pct:extra.hp_left_pct,deaths:extra.deaths||0,weapon:Run.hero?.weapon||'fists'});
  }
 },
 frame(now){
  const active=!paused&&!document.hidden&&(screen==='sandbox'||screen==='play'&&Run.state==='play');
  const dt=this.lastTime?now-this.lastTime:0;this.lastTime=now;
  if(!active){this.lastTime=0;this.frames=[];this.sampleMs=0;return;}
  if(dt<=0)return;
  this.modeMs+=dt;
  if(this.attempt)this.attempt.active_ms+=dt;
  for(const seconds of [30,60,120,300,600])if(this.modeMs>=seconds*1000&&!this.milestones.has(seconds)){
   this.milestones.add(seconds);this.send('engagement_checkpoint',{active_seconds:seconds});
  }
  this.frames.push(dt);this.sampleMs+=dt;
  if(this.sampleMs<30000)return;
  const times=this.frames.slice().sort((a,b)=>a-b),quantile=q=>times[Math.floor((times.length-1)*q)];
  const sample={target_fps:60,window_ms:this.sampleMs,active_ms:this.sampleMs,frame_count:times.length,fps_avg:times.length*1000/this.sampleMs,
   fps_p10:1000/quantile(.9),frame_time_p50_ms:quantile(.5),frame_time_p95_ms:quantile(.95),frame_time_p99_ms:quantile(.99),frame_time_max_ms:times[times.length-1],
   entities:entities.length,particles:particles.length,touch:!fineInput()};
  for(const limit of [50,100,250,500,1000])sample['frames_over_'+limit+'ms']=times.filter(t=>t>limit).length;
  this.send('performance_sample',sample);this.frames=[];this.sampleMs=0;
 },
 // одно событие при старте: сколько грузилась игра и на чём играют
 loaded(){
  const wasNew=!S.firstDay;if(wasNew){S.firstDay=new Date().toISOString().slice(0,10);try{save();}catch(_){}}
  this.send('game_loaded',{load_ms:Math.round(performance.now()-this.bootAt),platform:PF.name,lang:LANG,story_max_level:(S.story.open||0)+1,arcade_best:S.arcadeBest||0,touch:!fineInput(),
   viewport_w:innerWidth,viewport_h:innerHeight,dpr:+(devicePixelRatio||1).toFixed(2),portrait:innerHeight>innerWidth,new_player:wasNew,player_day:this.playerDay(),auto_start:!!window.__autoStart,returning:!!(S.story.open||S.arcadeBest||Object.keys(S.tut||{}).length),
   coins:S.coins,story_open:S.story.open||0,arcade_best:S.arcadeBest||0});
 },
 placement(id){
  return {hxBoost:'temporary_hp',hxAd:'upgrade_coins',freeC:'shop_coins',gAd:'gift_coins',g3:'gift_multiplier',uAd:'item_unlock',uCoinAd:'unlock_coins',
   trY:'weapon_trial',lhY:'lose_weapon',hxLive:'temporary_hp',w2:'win_multiplier',lr:'revive',ldbl:'run_multiplier',lskip:'skip_level',hY:'puzzle_hint',lhint:'puzzle_hint'}[id]||'other';
 },
 offers(){
  for(const b of document.querySelectorAll('#modal button.ad,#modal button[data-unh],#modal button[data-unw]')){
   if(!b.getClientRects().length||b.disabled)continue;
   if(!b.classList.contains('ad'))continue; // за монеты — не рекламное место
   this.send('ad_opportunity',{placement:b.dataset.unh?'hero_unlock':b.dataset.unw?'weapon_unlock':this.placement(b.id)});
  }
 }
};
document.addEventListener('visibilitychange',()=>{
 GameStats.lastTime=0;GameStats.frames=[];GameStats.sampleMs=0;
 GameStats.send(document.hidden?'journey_backgrounded':'journey_returned',{active_seconds:Math.round(GameStats.modeMs/1000),attempt_active_seconds:Math.round((GameStats.attempt?.active_ms||0)/1000)});
});
window.addEventListener('pagehide',()=>GameStats.leaveMode('page_exit'));
