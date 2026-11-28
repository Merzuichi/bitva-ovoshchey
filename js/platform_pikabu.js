'use strict';
/* ============ площадка: Пикабу Игры ============ */
// Подключается вместо platform_yandex.js сборкой tools/build_pikabu.py. Документация SDK: https://games.pikabu.ru/sdk/docs/
// SDK работает только на странице игры на Пикабу или в тестовом окружении Студии; при локальном запуске — тестовые заглушки.
// тексты, которые есть только в версии для Пикабу (переводы для английского языка в настройках)
Object.assign(EN,{'Войди через Пикабу — прогресс сохранится в аккаунте и будет на любом устройстве':'Sign in with Pikabu to keep your progress on any device','Войти и сохранить':'Sign in and save','Готово! Прогресс сохранён в аккаунте Пикабу':'Done! Progress saved to your Pikabu account','Нашли прогресс в аккаунте — загрузим его':'Found progress in your account, loading it'});
const PF={name:'pikabu',sdk:null,lastAd:0,started:Date.now(),
 sfxExt:'mp3',         // сборка перекодирует .wav в .mp3, как для Playgama
 escPause:true,        // Esc открывает паузу
 devAllowed:['localhost','127.0.0.1','[::1]',''].includes(location.hostname), // режим разработчика только при локальном запуске
 initFirst:true,       // v546: SDK до загрузки ресурсов — по облачному сохранению видно, новичок ли это (быстрый старт)
 lateRest:true,        // фоны остальных глав — после начала игры
 arcadeAdEvery:2,      // v548: аркада — реклама раз в 2 уровня (было 3), чаще не даёт интервал 2 мин
 storyAdEvery:1,       // v548: история — после каждого уровня (было через один), чаще не даёт интервал 2 мин
 rewardFree:true,      // v548: реклама за награду доступна сразу, без паузы новичка (она только по кнопке игрока)
 AD_GAP:120000,        // v548: межстраничная не чаще раза в 2 минуты — минимум площадки (было 3,5 мин)
 // v547: игровые события (GameStats.send) дублируются целями в наш счётчик Яндекс Метрики.
 // null — отправка выключена. Локально не шлём (только с ?metrika=1), чтобы не засорять статистику тестами.
 metrikaId:114707939,  // счётчик «Битва овощей — Пикабу», сайт merzuichi.github.io/bitva-ovoshchey
 track(name,payload){
  const id=this.metrikaId;if(!id)return;
  if(this.devAllowed&&!new URLSearchParams(location.search).has('metrika'))return;
  if(!this.ymReady){
   this.ymReady=true;
   window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments);};window.ym.l=window.ym.l||Date.now();
   // tag.js может уже подключить SDK Пикабу (для своего счётчика) — второй раз не грузим
   if(![...document.scripts].some(s=>s.src.includes('mc.yandex.ru/metrika/tag.js'))){
    const s=document.createElement('script');s.async=true;s.src='https://mc.yandex.ru/metrika/tag.js?id='+id;document.head.appendChild(s);
   }
   window.ym(id,'init',{ssr:false,clickmap:false,trackLinks:false,accurateTrackBounce:true,referrer:document.referrer,url:location.href,params:{platform:'pikabu'}});
  }
  window.ym(id,'reachGoal',name,payload);
 },
 async init(){
  this.wrapBoot();
  try{
   await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://games.pikabu.ru/sdk/sdk.js';s.async=true;s.onload=res;s.onerror=rej;document.head.appendChild(s);setTimeout(rej,10000);});
   // вне площадки init() может не ответить вовсе — не даём игре зависнуть на загрузке
   this.sdk=await Promise.race([PkbSDK.init(),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),8000))]);
   this.pid=this.sdk.player&&this.sdk.player.id||null;
   this.debug({event:'init',rewarded:this.sdk.ads.rewarded.isSupported,fullscreen:this.sdk.ads.fullscreen.isSupported,preloader:this.sdk.ads.preloader.isSupported,auth:!!this.sdk.player.isAuthorized});
   // ошибки облачного сохранения: при конфликте (игра открыта на другом устройстве/вкладке) дальнейшие записи невозможны до перезагрузки
   this.sdk.on('storageSaveError',reason=>{
    console.warn('[PF] сохранение не удалось:',reason);
    if(reason==='REVISION_CONFLICT'&&!this.conflict){this.conflict=true;toast(t('Прогресс изменён в другой вкладке или на другом устройстве. Перезагрузи страницу'));}
   });
   // вход в аккаунт посреди игры: если у аккаунта уже есть прогресс — перезапуск с ним, иначе текущий прогресс переходит в аккаунт
   this.sdk.on('userAuthorized',()=>{
    const id=this.sdk.player.id;if(id===this.pid)return;
    let cloud=null;try{cloud=this.sdk.storage.get('save');}catch(e){}
    this.pid=id;
    // v550: у аккаунта уже есть прогресс — перезапуск с ним; если открыто окно (например, итоги уровня), ждём, пока его закроют, чтобы не пропала награда
    if(cloud&&cloud.pid&&cloud.pid===id){const go=()=>{if($('#modal').classList.contains('on'))setTimeout(go,500);else location.reload();};toast(t('Нашли прогресс в аккаунте — загрузим его'));go();return;}
    toast(t('Готово! Прогресс сохранён в аккаунте Пикабу'));
    try{save();flushSave();}catch(e){}
   });
  }catch(e){this.sdk=null;console.log('[PF] локальный режим: SDK Пикабу недоступен');}
  if(!this.canReward()){const st=document.createElement('style');st.textContent='.btn.ad{display:none!important}';document.head.appendChild(st);}
 },
 // диагностика для проверки в тестовом окружении: в консоль, а при ?pkbdebug в адресе — ещё и странице Пикабу (фрейм с другого сайта, его консоль снаружи не видна)
 debug(info){
  console.log('[PF]',JSON.stringify(info));
  try{if(/pkbdebug/.test(location.search))parent.postMessage({pkbDebug:info},'*');}catch(e){}
 },
 /* ---------- быстрый старт (перенесён из версии для CrazyGames, v544): новичку до боя нужен только набор первой сцены ---------- */
 // вернувшимся игрокам грузим как обычно — файлы уже в кэше браузера
 fast:false,booting:false,abIntro:'',sceneReady:null,coreReady:null,coreDone:true,sceneDone:true,
 SETS:{
  intro:{chars:['ogurets','perets','pomidor'],map:'factory',wpn:['smg','fists','bat'],more:/^(icon_reload|ui_reload_ring|ui_ammo_full|ui_ammo_empty)$/},
  control:{chars:['ogurets','perets'],map:'garden',wpn:['fists'],more:/^(sunflower|fence_garden|cloud\d)$/},
 },
 COMMON:/^(face_|ovl_|icon_coin$)/,
 HUD:['ui_ribbon','ui_coinbar','ui_ib','ui_ib_alt'],
 inSet(k,v){const s=this.SETS[v];
  return this.COMMON.test(k)||s.more.test(k)||k===`bg_${s.map}`||k===`floor_${s.map}`||s.wpn.some(w=>k==='wpn_'+w)||s.chars.some(c=>k.startsWith(`char_${c}_`));},
 sprite(k){return SPR[k]?Promise.resolve():new Promise(res=>{const im=new Image();im.onload=()=>{SPR[k]=im;fitSprite(k,im);res();};im.onerror=res;im.src='assets/'+SPRITES[k]+'?v='+ASSET_V;});},
 isNew(){
  let local=null;try{local=localStorage.getItem(SAVE_KEY);}catch(e){}
  let cloud=null;try{cloud=this.sdk?this.sdk.storage.get('save'):null;}catch(e){}
  return !!this.sdk&&!local&&cloud==null;
 },
 async bootAssets(){
  this.fast=this.isNew();
  if(!this.fast){Snd.load();return loadSprites();}
  this.booting=true;this.sceneDone=this.coreDone=false;
  const q=this.devAllowed?new URLSearchParams(location.search).get('intro'):null;
  this.abIntro=q==='1'?'intro':q==='0'?'control':Math.random()<.5?'intro':'control';
  this.foes=Intro.FOES;Intro.FOES=['perets','pomidor'];  // остальные противники интро выходят, как только догрузятся
  const keys=[...AVAILABLE].filter(k=>SPRITES[k]&&this.inSet(k,this.abIntro)),total=keys.length+this.HUD.length;let done=0;
  const tick=()=>{done++;const e=document.getElementById('loadText');if(e)e.textContent=t('Загрузка')+' '+Math.round(done/total*100)+'%';};
  await Promise.all([this.preloader(),...keys.map(k=>this.sprite(k).then(tick)),...this.HUD.map(n=>new Promise(r=>{const im=new Image();im.onload=im.onerror=()=>{tick();r();};im.src=`assets/ui/${n}.png?v=20`;}))]);
 },
 // v548: реклама при загрузке (preloader) — только новичкам, пока грузится первая сцена; площадка даёт её только на телефонах и до gameStarted.
 // Закрыть её можно сразу. Звук ещё не загружен, так что ставить музыку на паузу не нужно.
 async preloader(){
  try{
   const p=this.sdk&&this.sdk.ads.preloader;if(!p||!p.isSupported||!(await p.canShow()))return;
   const r=await p.show();this.debug({event:'preloader_show',result:r});
   if(r&&r.rendered)this.lastAd=Date.now();  // межстраничная — не сразу после неё
  }catch(e){this.debug({event:'preloader_error',error:String(e)});}
 },
 // игра уже идёт: сначала звуки и вторая стартовая сцена, затем остальные герои и оружие, эффекты, в конце фоны глав
 async afterReady(loadRest){
  if(!this.fast){loadRest();return;}
  this.booting=false;
  const all=[...AVAILABLE].filter(k=>SPRITES[k]),get=f=>Promise.all(all.filter(f).map(k=>this.sprite(k)));
  const late=k=>/^(bg_|floor_)/.test(k)||/^(item_|veg_|cog_|portrait_)/.test(k);
  let sceneOk,coreOk;this.sceneReady=new Promise(r=>sceneOk=r);this.coreReady=new Promise(r=>coreOk=r);
  await Promise.all([Snd.load('first'),Intro.active?get(k=>/^char_(kukuruza|kapusta)_/.test(k)).then(()=>{Intro.FOES=this.foes;}):0]);
  Intro.FOES=this.foes;
  await get(k=>this.inSet(k,'control'));
  this.sceneDone=true;sceneOk();
  await get(k=>/^(char_|wpn_)/.test(k));
  this.coreDone=true;coreOk();
  await get(k=>/^(fx_|tfx_)/.test(k));
  await get(k=>!late(k));
  await Promise.all([Snd.load('rest'),get(late)]);
  loadRest();
 },
 wrapBoot(){
  // меню под экраном загрузки новому игроку не видно, а его картинки весят 1,7 МБ
  const menu=buildMenu;buildMenu=()=>{if(!this.booting)menu();};
  const v=Intro.variant;Intro.variant=()=>{if(this.abIntro){S.ab=S.ab||{};if(!S.ab.intro)S.ab.intro=this.abIntro;}return v.call(Intro);};
  // следующая глава, аркада и песочница ждут, пока догрузятся герои (обычно уже готово)
  const gate=(fn,ready)=>(...a)=>{const p=ready(...a);if(!p)return fn(...a);this.waitLoad(p).then(()=>fn(...a));};
  startStory=gate(startStory,i=>i>0?(this.coreDone?null:this.coreReady):(this.sceneDone?null:this.sceneReady));
  startArcade=gate(startArcade,()=>this.coreDone?null:this.coreReady);
  enterSandbox=gate(enterSandbox,()=>this.coreDone?null:this.coreReady);
 },
 waitLoad(p){
  const c=document.createElement('div');c.style.cssText='position:fixed;inset:0;z-index:1500;background:#12352dee;color:#fff;display:flex;align-items:center;justify-content:center;font:900 28px Nunito,sans-serif';
  c.textContent=t('Загрузка')+'...';document.body.appendChild(c);pauseAll(true,'loadwait');
  return Promise.race([p,new Promise(r=>setTimeout(r,20000))]).then(()=>{c.remove();pauseAll(false,'loadwait');});
 },
 restore(){},
 online(){return !!this.sdk;},
 lang(){return 'ru';},  // требование площадки: при запуске игра на русском
 ready(){if(this.started2)return;this.started2=true;try{this.sdk&&this.sdk.gameStarted();}catch(e){}},
 start(){},
 stop(){},
 // v550: после победы гостю предлагаем войти через Пикабу — прогресс сохранится в аккаунте и будет на всех устройствах.
 // Пикабу советует просить вход не при запуске, а после первого уровня. Отказался (не нажал) — снова не раньше чем через 3 дня, и не чаще раза за сессию.
 AUTH_ASK_GAP:3*864e5,
 level(kind){if(kind==='completed')setTimeout(()=>this.authCard(),0);},
 authCard(){
  try{
   if(!this.sdk||this.sdk.player.isAuthorized||this.authAsked||Run.kind!=='story')return;
   if(Date.now()-(S.pkAuthAskAt||0)<this.AUTH_ASK_GAP)return;
   const box=$('#modal.on .box'),btn=box&&box.querySelector('#w1');if(!btn)return;
   this.authAsked=true;S.pkAuthAskAt=Date.now();save();
   const w=document.createElement('div');w.id='pkAuth';
   w.innerHTML=`<p class="note">🔐 ${t('Войди через Пикабу — прогресс сохранится в аккаунте и будет на любом устройстве')}</p><button class="btn b" id="pkAuthBtn">${t('Войти и сохранить')}</button>`;
   btn.after(w);  // под «Дальше»: не отбирает нажатия у ×3 за рекламу — главного дохода
   GameStats.send('auth_prompt',{action:'shown',level:Run.idx+1});
   $('#pkAuthBtn').onclick=async()=>{
    GameStats.send('auth_prompt',{action:'clicked',level:Run.idx+1});
    try{await this.sdk.auth.openAuthDialog();}catch(e){}
    const ok=!!this.sdk.player.isAuthorized;GameStats.send('auth_prompt',{action:ok?'authorized':'closed',level:Run.idx+1});
    if(ok){const el=$('#pkAuth');if(el)el.remove();}
   };
  }catch(e){console.warn('[PF] authCard',e);}
 },
 interstitial(){return new Promise(async res=>{
  const now=Date.now();
  // v548: не чаще раза в 2 минуты и не в первую минуту после запуска; новичку — ещё и не до первой победы (adHold в sdk.js)
  if(now-this.lastAd<this.AD_GAP||now-this.started<60000){res();return;}
  if(!this.sdk){this.lastAd=now;toast(t('📺 (тест) межстраничная реклама'));res();return;}
  let can=false;try{can=await this.sdk.ads.fullscreen.canShow();}catch(e){}
  if(!can){res();return;}
  this.lastAd=now;pauseAll(true,'ad');
  try{const r=await this.sdk.ads.fullscreen.show();this.debug({event:'fullscreen_show',result:r});}catch(e){this.debug({event:'fullscreen_error',error:String(e)});}
  pauseAll(false,'ad');res();
 });},
 async rewarded(){
  if(!this.sdk){toast(t('🎬 (тест) реклама просмотрена'));await new Promise(r=>setTimeout(r,300));return true;}
  let can=false;try{can=await this.sdk.ads.rewarded.canShow();}catch(e){}
  this.debug({event:'rewarded_canShow',can});
  if(!can){toast(t('Реклама сейчас недоступна'));return false;}
  pauseAll(true,'ad');
  let ok=false;
  try{const r=await this.sdk.ads.rewarded.show();ok=!!(r&&r.reward);this.debug({event:'rewarded_show',result:r});}catch(e){this.debug({event:'rewarded_error',error:String(e)});}
  pauseAll(false,'ad');
  if(ok)this.lastAd=Date.now();
  return ok;
 },
 canReward(){return !this.sdk||this.sdk.ads.rewarded.isSupported!==false;},
 // покупки на Пикабу требуют сервера для проверки подписи — в этой версии магазина за рубли нет
 sells(){return false;},
 price(id){return (IAP.find(x=>x.id===id)||{}).def+' ₽';},
 async purchase(){throw new Error('покупки недоступны');},
 commit(){},
 // облако (sdk.storage) и локальная копия: берём более свежее по полю t; чужое локальное (другой игрок в этом браузере) не берём
 async load(){
  let cloud=null,local=null;
  if(this.sdk){try{cloud=this.sdk.storage.get('save')||null;}catch(e){}}
  try{const l=localStorage.getItem(SAVE_KEY);if(l)local=JSON.parse(l);}catch(e){}
  if(local&&local.pid&&this.pid&&local.pid!==this.pid)local=null;
  if(cloud&&local)return (local.t||0)>(cloud.t||0)?local:cloud;
  return cloud||local;
 },
 save(s){
  if(this.pid)s.pid=this.pid;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(s));}catch(e){}
  if(this.sdk&&!this.conflict){try{this.sdk.storage.set('save',s);}catch(e){}}
 },
 // при сворачивании и закрытии вкладки — отправить накопленное сразу
 flush(){if(this.sdk&&!this.conflict){try{this.sdk.storage.flush().catch(()=>{});}catch(e){}}},
 hasTop(){return false;},
 topEmptyText(){return 'Мировой таблицы рекордов на Пикабу пока нет.<br>Смотри свои лучшие забеги во вкладке «Мои забеги».';},
 async top(){return null;},
 score(){},
};
