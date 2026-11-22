'use strict';
/* ============ площадка: Пикабу Игры ============ */
// Подключается вместо platform_yandex.js сборкой tools/build_pikabu.py. Документация SDK: https://games.pikabu.ru/sdk/docs/
// SDK работает только на странице игры на Пикабу или в тестовом окружении Студии; при локальном запуске — тестовые заглушки.
const PF={name:'pikabu',sdk:null,lastAd:0,started:Date.now(),
 sfxExt:'mp3',         // сборка перекодирует .wav в .mp3, как для Playgama
 escPause:true,        // Esc открывает паузу
 devAllowed:['localhost','127.0.0.1','[::1]',''].includes(location.hostname), // режим разработчика только при локальном запуске
 initFirst:false,      // SDK можно запускать после загрузки ресурсов
 arcadeAdEvery:3,      // аркада: реклама раз в столько уровней
 storyAdEvery:2,       // история: реклама раз в столько уровней
 async init(){
  try{
   await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://games.pikabu.ru/sdk/sdk.js';s.async=true;s.onload=res;s.onerror=rej;document.head.appendChild(s);setTimeout(rej,12000);});
   // вне площадки init() может не ответить вовсе — не даём игре зависнуть на загрузке
   this.sdk=await Promise.race([PkbSDK.init(),new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),12000))]);
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
    if(cloud&&cloud.pid&&cloud.pid===id){location.reload();return;}
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
 restore(){},
 online(){return !!this.sdk;},
 lang(){return 'ru';},  // требование площадки: при запуске игра на русском
 ready(){if(this.started2)return;this.started2=true;try{this.sdk&&this.sdk.gameStarted();}catch(e){}},
 start(){},
 stop(){},
 level(){},
 interstitial(){return new Promise(async res=>{
  const now=Date.now();
  // не чаще раза в 3,5 минуты и не раньше 3,5 минуты после запуска (как в версии для Яндекса; у площадки минимум 2 минуты)
  if(now-this.lastAd<210000||now-this.started<210000){res();return;}
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
