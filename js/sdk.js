'use strict';
/* ============ сохранение, Яндекс SDK, звук, тосты ============ */
const $=s=>document.querySelector(s);
const today=()=>new Date().toISOString().slice(0,10);
const SAVE_KEY='ogurchiki_v2';
const DEFAULT_S=()=>({v:2,coins:100,unlocked:{},noads:false,all:false,map:'garden',giftDay:'',giftAt:0,hint:true,sound:true,damage:0,
 heroes:{ogurets:{own:true,hp:0,dmg:0,spd:0,weapon:'fists'}},
 aheroes:{perets:{own:true,hp:0,dmg:0,spd:0,weapon:'fists'}},weapons:{fists:true},sbWeapons:{fists:true},
 story:{stars:{},open:0,v:3,ord:3},arcade:{runs:[]},arcadeBest:0,cut:true,cuts:0,hero:'ogurets',ahero:'perets',sbTeam:0,tut:{}});
let S=DEFAULT_S();

// эмодзи в интерфейсе заменяются на иконки из assets/ui (если иконки нет — остаётся эмодзи)
// версия картинок интерфейса: увеличить при замене файлов с теми же именами, чтобы браузер не брал старые из кэша
const ASSET_V=536;  // v=535: новый калаш (Codex); v=522: иконки калаша/базуки, портрет огурца, миниатюры глав
const IC=n=>`<img class="ico" src="assets/ui/icon_${n}.png?v=${ASSET_V}" alt="">`;
const EMO={'🪙':'coin','🎬':'ad','🎁':'gift','🛒':'shop','🏠':'home','🔒':'lock','🔓':'unlock_all','🏆':'trophy','🥇':'medal_gold','🥈':'medal_silver','🥉':'medal_bronze',
 '💀':'skull','⏱':'timer','🚩':'flag','👑':'crown','👊':'enemies','🌍':'gravity_on','🪐':'gravity_off','🌐':'world','📜':'scroll','❤️':'heart_full','🤍':'heart_empty',
 '🔊':'sound_on','🔇':'sound_off','⚙️':'settings','⏸':'pause','▶️':'play','🚫':'noads','⚔️':'fight','⚔':'fight','👟':'upg_speed','🗺️':'map','🧹':'clear','↩️':'undo','🐢':'slowmo',
 '✋':'tool_hand','🗑️':'tool_delete','📌':'tool_pin','🎽':'tool_team','💉':'tool_heal','💥':'tool_boom','🔎':'tool_grow','🥒':'cat_creatures','🗡️':'cat_weapons','📦':'cat_items','💣':'cat_danger','🧱':'cat_build',
 '🦸':'upgrade','↻':'restart','🔄':'restart','✂':'scissors','🛡':'shield','🌬️':'wind','📖':'book','✅':'check','⏳':'hourglass','💢':'anger','🛠':'wrench','🕊️':'dove','💪':'muscle','🪨':'rock','🌙':'moon','🏃':'upg_speed','🧩':'puzzle','🏅':'medal_gold','★':'star_full','📺':'ad'};
const EMO_RE=new RegExp(Object.keys(EMO).sort((a,b)=>b.length-a.length).map(e=>e.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
const emo=h=>String(h).replace(EMO_RE,m=>IC(EMO[m]));
const STARS=(n,cls)=>`<span class="stars ${cls||''}">${IC('star_full').repeat(n)}${IC('star_empty').repeat(3-n)}</span>`;
function toast(t){if(screen==='sandbox'&&typeof SbTut!=='undefined'&&SbTut.on)return;  // во время обучения песочницы сообщения закрывали подсказку
const e=document.createElement('div');e.className='toast';e.innerHTML=emo(t);$('#toast').appendChild(e);placeToast();setTimeout(placeToast,60);setTimeout(()=>{e.remove();placeToast();},2200);}
// v=446: сообщение не накрывает подсказку, реплику героя, обучение и баннер главы — встаёт под ними
function placeToast(){
 const c=$('#toast');if(!c)return;c.style.removeProperty('top');if(!c.children.length)return;
 const r=c.getBoundingClientRect();let y=null;
 for(const sel of ['#tip.on','#tutor.on','#storySpeech','#banner.on']){
  const o=document.querySelector(sel);if(!o||!o.offsetWidth)continue;const cs=getComputedStyle(o);if(cs.visibility==='hidden'||+cs.opacity<.05||cs.display==='none')continue;
  const q=o.getBoundingClientRect();if(q.bottom>r.top-4&&q.top<r.bottom+4&&q.right>r.left&&q.left<r.right)y=Math.max(y||0,q.bottom+8);
 }
 if(y!==null)c.style.setProperty('top',Math.round(y)+'px','important');
}

// обёртка площадки: игра вызывает только Y, а всё про конкретную площадку лежит в PF (js/platform_*.js)
// v528: новичку не показываем рекламу до первой победы (но не дольше 3 минут сессии, чтобы не терять показы у тех, кто сразу ушёл в песочницу).
// Это условие, а не счётчик частоты: частоту рекламы по-прежнему решает Bridge.
const AD_HOLD_MS=180000;
const adHold=()=>{try{return !(S.story.open>0||S.arcadeBest>0||S.tut.firstMission_story||S.tut.firstMission_arcade)&&performance.now()<AD_HOLD_MS;}catch(_){return false;}};
setInterval(()=>{try{document.body.classList.toggle('ad-hold',adHold());}catch(_){}},1000);
const Y={
 init(){return PF.init();},
 restore(){return PF.restore();},
 ready(){PF.ready();},
 start(){PF.start();},
 stop(){PF.stop();},
 level(kind){PF.level(kind);},
 online(){return PF.online();},
 lang(){return PF.lang();},
 // placement — где показана межстраничная реклама (для аналитики): площадка сама решает, показать ли её
 interstitial(placement='other'){if(S.noads||adHold())return Promise.resolve();GameStats.send('interstitial_requested',{placement});return PF.interstitial();},
 async rewarded(placement='other'){
  if(adHold())return false;
  GameStats.send('reward_action',{placement,action:'requested'});
  try{const granted=!!(await PF.rewarded());GameStats.send('reward_action',{placement,action:granted?'granted':'not_granted'});return granted;}
  catch(_){GameStats.send('reward_action',{placement,action:'not_granted'});return false;}
 },
 canReward(){return !adHold()&&PF.canReward();},
 shopItems(){return IAP.filter(p=>PF.sells(p.id));},
 price(id){return PF.price(id);},
 async buy(id){
  try{pauseAll(true,'ad');const token=await PF.purchase(id);pauseAll(false,'ad');this.grant(id,token);return true;}
  catch(e){pauseAll(false,'ad');toast(t('Покупка отменена'));return false;}
 },
 grant(id,token,restore){
  if(id==='noads')S.noads=true;
  if(id==='unlock_all')S.all=true;
  if(id==='coins_2000')addCoins(2000);
  try{PF.commit(id,token,id==='coins_2000');}catch(e){}
  save();if(!restore)toast(t('✅ Покупка активирована!'));if(typeof refreshUI==='function')refreshUI();
 },
 load(){return PF.load();},
 // t — время записи: по нему выбирается более свежее из облачного и локального сохранения
 save(){if(!saveReady)return;S.t=Date.now();PF.save(S);},
 hasTop(){return PF.hasTop();},
 topEmptyText(){return PF.topEmptyText();},
 top(name){return PF.top(name);},
 score(name,v){PF.score(name,v);},
};
// saveReady: до загрузки прогресса запись запрещена, иначе начальное пустое состояние затрёт настоящее сохранение
let saveT=0,saveReady=false;function save(){clearTimeout(saveT);saveT=setTimeout(()=>{saveT=0;Y.save();},400);}
// v528: сохранение не теряется, если игрок закрыл вкладку раньше, чем сработал отложенный save
function flushSave(){if(saveT&&saveReady){clearTimeout(saveT);saveT=0;try{Y.save();}catch(_){}}}
addEventListener('pagehide',flushSave);document.addEventListener('visibilitychange',()=>{if(document.hidden)flushSave();});
// телефон замораживает свёрнутую вкладку: отложенная запись не успевает. При уходе со страницы пишем сразу
function flushSave(){if(!saveReady)return;if(saveT){clearTimeout(saveT);saveT=0;Y.save();}try{PF.flush&&PF.flush();}catch(e){}}
addEventListener('visibilitychange',()=>{if(document.hidden)flushSave();});
addEventListener('pagehide',flushSave);
function migrate(saved){
 const n=DEFAULT_S();if(!saved)return n;
 for(const k of ['coins','unlocked','noads','all','map','giftDay','giftAt','dev','devCoins','hint','sound','damage','arcadeBest','hero','ahero','sbTeam','tut','missions','cut','cuts','lang','langPg','autoAim'])if(saved[k]!==undefined)n[k]=saved[k];
 if(saved.v===2){Object.assign(n.heroes,saved.heroes||{});Object.assign(n.aheroes,saved.aheroes||{});Object.assign(n.weapons,saved.weapons||{});
  // v=393: оружие песочницы открывается отдельно; старым сохранениям — всё, что уже было куплено (раньше открытия были общими)
  Object.assign(n.sbWeapons,saved.sbWeapons||saved.weapons||{});n.story=Object.assign(n.story,saved.story||{});n.arcade=Object.assign(n.arcade,saved.arcade||{});}
 // в версии 3 история стала длиннее (40 глав) — старый прогресс глав не подходит, монеты и прокачка сохраняются
 if(!saved.story||!saved.story.v||saved.story.v<3){n.story={stars:{},open:0,v:3,ord:3};}
 else{
  // v=396: в историю добавлены восхождения (по 3 на акт) — номера глав сдвинулись, переносим звёзды и открытую главу
  if(!saved.story.ord&&typeof remapStoryProgress==='function')n.story=remapStoryProgress(n.story);
  // v=449: сюжетные главы — в каждом акте по 14 (js/lore.js), номера сдвинулись ещё раз
  if(n.story.ord===2&&typeof remapStory3==='function')n.story=remapStory3(n.story);
 }
 n.cut=true;
 if(!['garden','greenhouse','market','kitchen','moon','factory'].includes(n.map))n.map='garden';
 return n;
}
let coinFrac=0;
// число монет в плашке: длинное уменьшается ровно настолько, чтобы не выйти за светлую часть
let coinPending=0,coinTap=null,coinSndAt=0; // coinPending — монеты ещё в полёте: в плашке они появятся при прилёте
function showCoins(){document.querySelectorAll('.cv').forEach(e=>{e.textContent=S.dev?'∞':Math.max(0,S.coins-coinPending+(typeof screen!=='undefined'&&screen==='play'&&typeof Run!=='undefined'&&Run.bag||0));e.style.fontSize=S.dev?'1.7em':'';if(S.dev)return;const w=e.clientWidth;if(!w)return;const r=document.createRange();r.selectNodeContents(e);const tw=r.getBoundingClientRect().width;if(tw>w-2)e.style.fontSize=(parseFloat(getComputedStyle(e).fontSize)*(w-2)/tw).toFixed(1)+'px';});}
addEventListener('pointerdown',e=>{coinTap={x:e.clientX,y:e.clientY,t:Date.now()};},true);
// награда от 10 монет: россыпь вылетает от места нажатия (иначе от центра экрана) и залетает в плашку, число растёт по мере прилёта.
// Если плашки на экране нет (в уровне), на время полёта показывается временная.
function flyCoins(n){
 if(n<10||document.hidden||!(innerWidth>0)||matchMedia('(prefers-reduced-motion:reduce)').matches||matchMedia('(max-aspect-ratio:999/1000)').matches)return;
 const L=document.createElement('div');L.className='coinfx';document.body.appendChild(L);
 const visible=()=>[...document.querySelectorAll('.coins')].find(e=>e.offsetWidth>0);
 let bar=visible();
 if(!bar){L.innerHTML=`<div class="coins">${IC('coin')}<span class="cv"></span></div>`;bar=L.firstChild;}
 const r=(bar.querySelector('.ico')||bar).getBoundingClientRect(),tx=r.left+r.width/2,ty=r.top+r.height/2;
 const near=coinTap&&Date.now()-coinTap.t<2000,sx=near?coinTap.x:innerWidth/2,sy=near?coinTap.y:innerHeight/2;
 const count=Math.min(14,5+Math.round(n/40)),each=Math.floor(n/count);
 let left=count,value=n;coinPending+=n;showCoins();
 const land=v=>{coinPending-=v;value-=v;left--;showCoins();const b=visible();if(b){b.classList.remove('got');void b.offsetWidth;b.classList.add('got');}
  const now=Date.now();if(now-coinSndAt>70){coinSndAt=now;try{Snd.coin();}catch(e){}}
  if(left<=0){clearTimeout(guard);setTimeout(()=>L.remove(),350);}};
 const guard=setTimeout(()=>{if(left>0){left=0;coinPending-=value;showCoins();L.remove();}},count*55+1800); // страховка: вкладку свернули и анимации не закончились
 for(let i=0;i<count;i++){
  const c=document.createElement('img');c.src=`assets/ui/icon_coin.png?v=${ASSET_V}`;c.alt='';L.appendChild(c);
  const a=Math.random()*Math.PI*2,d=40+Math.random()*80,mx=sx+Math.cos(a)*d,my=sy+Math.sin(a)*d-30,at=(x,y,k)=>`translate(${x-17}px,${y-17}px) scale(${k})`;
  const an=c.animate([{transform:at(sx,sy,.3),opacity:0,offset:0},{transform:at(mx,my,1),opacity:1,offset:.28,easing:'cubic-bezier(.45,0,.75,.4)'},{transform:at(tx,ty,.7),opacity:1,offset:.97},{transform:at(tx,ty,.4),opacity:0,offset:1}],{duration:760+Math.random()*180,delay:i*55,fill:'both',easing:'linear'});
  const v=i===count-1?n-each*(count-1):each;
  an.onfinish=()=>{c.remove();if(left>0)land(v);};
 }
}
// в режиме разработчика монеты бесконечные: счёт не меняется, награда только прилетает для вида; при выключении вернётся обычный счёт
// монеты за рекламу: свой звук награды и обычный полёт монет
function rewardCoins(n){try{Snd.reward();}catch(e){}addCoins(n);}
function addCoins(n){if(S.dev){flyCoins(n);coinPending=0;showCoins();return;}S.coins+=n;flyCoins(n);showCoins();save();}
function addCoinsFrac(v){coinFrac+=v;if(coinFrac>=1){const n=Math.floor(coinFrac);coinFrac-=n;addCoins(n);}}

// звуки: свои, синтезированные скриптом tools/make_sfx.py (assets/sfx/*.wav); если файл не загрузился — синтез WebAudio
// Все звуки — из пака HyperCasual Voice SFX, собраны и выровнены по громкости скриптом tools/import_sfx.py
// (каждый файл: самый громкий участок −16 дБ). Число — сколько вариантов (имя_1.wav … имя_N.wav); 0 — один файл имя.wav.
const SFX_FILES={punch:6,punch_heavy:6,chop:8,slice:6,squish:6,swish:8,swish_heavy:4,rope:4,jump:4,thud:6,wood:4,click:3,reload:2,reload_done:2,select:4,charged:4,
 bounce:3,coin:1,reward:1,unlock:1,checkpoint:1,win:3,win_big:3,lose:3,boom:2,boom_big:0,gun_pistol:3,gun_ak:8,gun_shotgun:3,gun_rocket:2,gun_pump:2,bow_twang:3,arrow_hit:3,flame:2,ignite:2,  // оружие — синтез tools/make_gun_sfx.py (рецепт ChatGPT)
 rocket_fly:0,music:0,
 // только голоса без слов: крики, стоны, смех. Реплики со словами убраны из игры (копии в _bak_sfx/words_v238)
 v_pain:8,v_death:6,v_joy:0,v_laugh:3,v_iiiha:4};
// громкость задаётся только по группам — так все звуки в игре одного уровня
const SND_GROUP=k=>k==='music'?'music':k.startsWith('v_')?'voice':['win','win_big','lose'].includes(k)?'jingle':['click','select','coin','reward','unlock','checkpoint'].includes(k)?'ui':'sfx';
const SND_VOL={sfx:.55,ui:.45,voice:.75,jingle:.6,music:.22};
const Snd={ctx:null,last:0,lastThud:0,lastVoice:0,buf:{},musicSrc:null,
 make(){if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}},
 init(){this.make();if(this.ctx&&!soundMuted())syncAudioContext();this.music(S.sound);},
 // грузим и раскодируем все звуки заранее (контекст может быть «уснувшим» до первого касания — это не мешает)
 async load(){
  this.make();if(!this.ctx)return;
  const jobs=[];
  for(const [k,v] of Object.entries(SFX_FILES)){
   const files=k==='music'?['music.mp3']:v===0?[`${k}.${PF.sfxExt}`]:Array.from({length:v},(_,i)=>`${k}_${i+1}.${PF.sfxExt}`);
   for(const f of files)jobs.push(fetch('assets/sfx/'+f).then(r=>r.ok?r.arrayBuffer():null).then(a=>a&&new Promise(res=>this.ctx.decodeAudioData(a,res,()=>res(null)))).then(b=>{if(b)(this.buf[k]=this.buf[k]||[]).push(b);}).catch(()=>{}));
  }
  await Promise.all(jobs);
  if(this.ctx.state==='running')this.music(S.sound);
 },
 ok(){return S.sound&&this.ctx&&!soundMuted();},
 // сыграть: случайный вариант, чуть разная высота; mul — только поправка внутри группы (например, сила удара о землю)
 play(k,mul,rate){if(!this.ok())return true;const l=this.buf[k];if(!l||!l.length)return false;const c=this.ctx,s=c.createBufferSource(),g=c.createGain();
  s.buffer=l[Math.floor(Math.random()*l.length)];s.playbackRate.value=(rate||1)*(.95+Math.random()*.1);g.gain.value=SND_VOL[SND_GROUP(k)]*volFx()*(mul===undefined?1:mul);s.connect(g).connect(c.destination);s.start();return true;},
 // ползунок музыки в настройках меняет громкость сразу, без перезапуска петли
 setMusicVol(){if(this.musicGain)this.musicGain.gain.value=SND_VOL.music*volMusic();},
 // фоновая музыка: тихая петля; включается после первого касания (так требуют браузеры), выключается вместе со звуком
 music(on){
  if(!this.ctx)return;
  if(on&&!this.musicSrc&&this.buf.music){const c=this.ctx,s=c.createBufferSource(),g=c.createGain();s.buffer=this.buf.music[0];s.loop=true;g.gain.value=SND_VOL.music*volMusic();s.connect(g).connect(c.destination);s.start();this.musicSrc=s;this.musicGain=g;}
  if(!on&&this.musicSrc){try{this.musicSrc.stop();}catch(e){}this.musicSrc=null;}
 },
 // реплика голосом: не чаще раза в ~1 с, чтобы голоса не наслаивались; chance — вероятность (громкость у всех голосов одна)
 voice(k,_vol,chance,gap){if(chance!==undefined&&Math.random()>chance)return;const now=performance.now();if(now-this.lastVoice<(gap||1000))return;if(this.play(k))this.lastVoice=now;},
 // столкновения тел (падения, ящики) — глухой стук, громче при сильном ударе
 hit(v){const now=performance.now();if(now-this.lastThud<80)return;this.lastThud=now;this.play(v>9?'thud':'wood',clamp(v/18,.2,.8),v>12?.85:1);},
 // удар оружием: клинок — «чвак», тупое — шлепок, с замахом — тяжёлый удар
 punch(pw,wid){const now=performance.now();if(now-this.last<40)return;this.last=now;
  const blade=wid==='sword'||wid==='axe';
  if(pw>.5){this.play('punch_heavy');if(blade)this.play('chop',.6);return;}
  this.play(blade?'chop':'punch');},
 squish(){this.play('squish',.7);},
 boom(big){this.play(big?'boom_big':'boom');},
 pop(){this.play('click');},
 ui(){this.play('select');},
 // выстрел: вариант звука случайный, высота чуть гуляет (play); у дробовика после выстрела — передёргивание затвора
 shot(id){const m={pistol:'gun_pistol',smg:'gun_ak',shotgun:'gun_shotgun',bazooka:'gun_rocket'}[id];if(m)this.play(m,id==='smg'?.8:1);if(id==='bazooka')this.play('rocket_fly',.45);
  if(id==='shotgun')setTimeout(()=>this.play('gun_pump',.9),330);},
 twang(){this.play('bow_twang',.9);},
 arrowHit(){this.play('arrow_hit',.85);},
 swish(){this.play('swish',.8);},
 slice(){this.play('slice');},
 rope(){this.play('rope');},
 jump(){this.play('jump',.6,1.15);},
 bounce(){this.play('bounce');},
 win(){this.play('win');},
 winBig(){this.play('win_big');},
 lose(){this.play('lose');},
 reload(){this.play('reload',.8);},
 reloadDone(){this.play('reload_done',.8);},
 heavy(){this.play('swish_heavy');},
 charged(){this.play('charged',.8,1.2);},
 tackle(){this.play('swish_heavy');},
 // монета — «поп» из «Летающего кота»: каждая следующая подряд чуть выше тоном (до +60%), пауза дольше 0,8 с сбрасывает
 coin(){const now=performance.now();this.coinCombo=now-(this.coinAt||0)<800?Math.min((this.coinCombo||0)+1,8):0;this.coinAt=now;this.play('coin',1,1+this.coinCombo*.075);},
 reward(){this.play('reward');},
 checkpoint(){this.play('checkpoint');},
 unlock(){this.play('unlock');},
};

/* ============ пауза ============ */
let paused=false;
const pauseReasons=new Set();
// игру останавливает любая причина, а звук глушат только реклама, скрытая вкладка и вертикальный экран: в окнах и на паузе кнопки звучат
let platformMuted=false; // площадка сама выключила звук (игра при этом идёт)
// громкость из настроек (0..1): звуки и музыка отдельно; у старых сохранений полей нет — значит 100%
const volFx=()=>S.vol==null?1:S.vol,volMusic=()=>S.mvol==null?1:S.mvol;
const soundMuted=()=>platformMuted||pauseReasons.has('ad')||pauseReasons.has('hidden')||pauseReasons.has('portrait')||pauseReasons.has('platform');
function syncAudioContext(){
 try{const c=Snd.ctx;if(!c)return;const op=soundMuted()?c.suspend():c.resume();if(op&&op.catch)op.catch(()=>{});}catch(_){}
}
function setPlatformMute(on){platformMuted=!!on;syncAudioContext();}
function pauseAll(on,why){
 const wasMuted=soundMuted(),was=paused;
 on?pauseReasons.add(why):pauseReasons.delete(why);
 paused=pauseReasons.size>0;const muted=soundMuted();
 if(muted!==wasMuted)syncAudioContext();
 if(paused&&!was){Y.stop();if(typeof renderDirty!=='undefined')renderDirty=true;}
 if(!paused&&was){Y.start();if(typeof resetClock==='function')resetClock();}
}
document.addEventListener('visibilitychange',()=>pauseAll(document.hidden,'hidden'));
addEventListener('focus',()=>{pauseAll(document.hidden,'hidden');syncAudioContext();});
addEventListener('pointerdown',()=>{if(!soundMuted())syncAudioContext();},{passive:true});
