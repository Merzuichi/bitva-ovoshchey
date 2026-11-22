'use strict';
/* ============ интерфейс: меню, песочница, герои, магазин, управление ============ */
const CATS=[['npc','🥒 Существа'],['weapon','🗡️ Оружие'],['obj','📦 Предметы'],['danger','💣 Опасное'],['build','🧱 Стройка']];
const ITEMS=[
 {id:'ogurets',cat:'npc',n:'Огурец',e:'🥒',lock:0},{id:'pomidor',cat:'npc',n:'Помидор',e:'🍅',lock:0},
 {id:'baklazhan',cat:'npc',n:'Баклажан',e:'🍆',lock:300},{id:'morkov',cat:'npc',n:'Морковка',e:'🥕',lock:'ad'},
 {id:'arbuz',cat:'npc',n:'Арбузище',e:'🍉',lock:'ad'},{id:'perets',cat:'npc',n:'Перчик',e:'🌶️',lock:200},{id:'kukuruza',cat:'npc',n:'Кукуруза',e:'🌽',lock:'ad'},
 {id:'kapusta',cat:'npc',n:'Капуста',e:'🥬',lock:400},{id:'kaktus',cat:'npc',n:'Кактус',e:'🌵',lock:1500},
 {id:'box',cat:'obj',n:'Ящик',e:'📦',lock:0},{id:'ball',cat:'obj',n:'Мяч',e:'⚽',lock:'ad'},{id:'brick',cat:'obj',n:'Кирпич',e:'🧱',lock:0},
 {id:'plank',cat:'obj',n:'Доска',e:'🪵',lock:0},{id:'barrel',cat:'obj',n:'Бочка',e:'🛢️',lock:100},
 {id:'anvil',cat:'obj',n:'Наковальня',e:'⚓',lock:'ad'},
 {id:'bomb',cat:'danger',n:'Бомба',e:'💣',lock:0},{id:'spikes',cat:'danger',n:'Шипы',e:'🔺',lock:200},{id:'dynamite',cat:'danger',n:'Динамит',e:'🧨',lock:400},
 {id:'saw',cat:'danger',n:'Пила',e:'⚙️',lock:'ad'},{id:'mine',cat:'danger',n:'Мина',e:'🔴',lock:'ad'},
 {id:'platform',cat:'build',n:'Платформа',e:'➖',lock:0},{id:'tramp',cat:'build',n:'Батут',e:'🟦',lock:'ad'},{id:'ice',cat:'build',n:'Лёд',e:'🧊',lock:150},
 {id:'wall',cat:'build',n:'Стена',e:'▮',lock:'ad'},
];
const TOOLS=[
 {id:'hand',e:'✋',n:'Рука: хватай и бросай',lock:0},{id:'del',e:'🗑️',n:'Удалить',lock:0},{id:'freeze',e:'📌',n:'Закрепить',lock:0},
 {id:'team',e:'🎽',n:'Сменить команду',lock:0},{id:'heal',e:'💉',n:'Оживить',lock:0},{id:'boom',e:'💥',n:'Взрыв пальцем',lock:'ad'},{id:'grow',e:'🔎',n:'Увеличить бойца',lock:'ad'},
];
const IAP=[
 {id:'noads',e:'🚫',n:'Отключить рекламу',d:'Навсегда убирает рекламу между уровнями',def:'99'},
 {id:'unlock_all',e:'🔓',n:'Открыть всё',d:'Все герои, оружие, предметы и карты',def:'299'},
 {id:'coins_2000',e:'🪙',n:'2000 монет',d:'На прокачку героев',def:'49'},
];
const SB_SHORT={'Метательные копья':'Копья','Метательные ножи':'Ножи','Наковальня':'Наковальня'};
// прокрутка подменю песочницы (v=396): колесом мыши и перетаскиванием, если плитки не влезают
function makeScroller(el,vertical){if(!el||el.dataset.scroller)return;el.dataset.scroller=1;
 el.addEventListener('wheel',e=>{const d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(vertical){if(el.scrollHeight<=el.clientHeight)return;el.scrollTop+=d;}else{if(el.scrollWidth<=el.clientWidth)return;el.scrollLeft+=d;}e.preventDefault();},{passive:false});
 let drag=null;el.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;drag={x:e.clientX,y:e.clientY,l:el.scrollLeft,t:el.scrollTop,moved:false};});
 addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>8)drag.moved=true;if(vertical)el.scrollTop=drag.t-dy;else el.scrollLeft=drag.l-dx;});
 addEventListener('pointerup',()=>{if(drag&&drag.moved){el.addEventListener('click',ev=>{ev.stopPropagation();ev.preventDefault();},{capture:true,once:true});}drag=null;});}
// «Увеличить бойца» лупой (v=396, за рекламу): каждый тап +0,5 к размеру (1 → 1,5 → … → 3,5, 5 тапов), здоровье растёт до ×3
const GROW_ADD=.35,GROW_MAXK=2.75,  /* v=425: лупа увеличивает слабее (было +50% за шаг, до ×3,5) */GROW_MAX=Math.round((GROW_MAXK-1)/GROW_ADD),GROW_HP=Math.pow(3,1/GROW_MAX);
function growNpc(e){
 if(e.dead||e.removed)return;e.growN=e.growN||0;
 if(e.growN>=GROW_MAX){const q=e.parts.head.position;floats.push({x:q.x,y:q.y-40,t:t('Максимум!'),life:40,c:'#ffe27a',pop:1});Snd.pop();return;}
 const k0=e.growK||1;e.growN++;if(e.growN===1)GameStats.send('sandbox_control',{action:'grow',kind:e.kind});e.growK=1+GROW_ADD*e.growN;scaleRig(e,e.growK/k0);e.growSettle=frame+45;e.standY=null;const k=Math.min(3,Math.pow(GROW_HP,e.growN))/Math.min(3,Math.pow(GROW_HP,e.growN-1));e.hpMax*=k;e.hp=Math.min(e.hpMax,e.hp*k+e.hpMax*.1);
 const p=e.parts.torso.position;FX.ring(p.x,p.y,70*e.s);FX.burst(p.x,p.y,80*e.s,'#9be86a');floats.push({x:p.x,y:p.y-70*e.s,t:'×'+(Math.min(3,Math.pow(GROW_HP,e.growN))).toFixed(1)+' HP',life:44,c:'#9be86a',pop:1});
 Snd.unlock();shake=Math.min(10,shake+2);
}
let sbBoomUntil=0;  // взрыв пальцем открыт на время за рекламу
const itemUnlocked=x=>x.lock===0||S.all||S.dev||S.unlocked[x.id]||(x.id==='boom'&&Date.now()<sbBoomUntil);
// режим разработчика: открыты все главы, герои, оружие и предметы; монет — с запасом (свои монеты возвращаются при выключении)
const storyOpen=()=>S.dev?STORY.length-1:S.story.open;
// доступен только при локальном запуске: на Яндекс Играх его нет
const DEV_OK=PF.devAllowed&&['localhost','127.0.0.1','[::1]',''].includes(location.hostname);
// при выключении: оружие и герои, взятые только в режиме разработчика, заменяются честными
function dropDevPicks(){
 for(const m of ['story','arcade']){const st=heroStore(m);for(const id in st){const h=ROSTER[m][id];const w=st[id].weapon;if(h&&(!WEAPONS[w]||!weaponOwned(w)))st[id].weapon=h.weapon;}}
 if(!heroOwned('story',S.hero))S.hero='ogurets';
 if(!heroOwned('arcade',S.ahero))S.ahero='perets';
}
function setDev(on){if(on&&!DEV_OK)return;if(!!S.dev===on)return;S.dev=on;if(on){S.devCoins=S.coins;S.coins=Math.max(S.coins,999999);dropDevPicks();}else{S.coins=S.devCoins||0;S.devCoins=0;dropDevPicks();}save();refreshUI();}
let screen='menu',tool='spawn',selItem='ogurets',selWeapon=null,cat='npc';

/* ============ модальные окна, подсказки ============ */
let modalOpts={};
// opts.x — что делает крестик в углу окна; без него крестика нет
const MX=()=>`<div class="mxw"><button class="mx" aria-label="${t('Закрыть')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19"/></svg></button></div>`;
// окно уже открыто (переключили настройку, купили, улучшили — окно перерисовывается): меняем содержимое без анимации
// появления, иначе оно на мгновение пропадало и появлялось снова; прокрутку того же окна сохраняем
function modal(html,opts){modalOpts=opts||{};const m=$('#modal'),was=m.classList.contains('on')&&m.querySelector('.box'),title=was&&was.querySelector('h3')?.textContent,scroll=was?was.scrollTop:0;
 m.innerHTML=emo(`<div class="box ${modalOpts.wide?'wide':''} ${was?'stay':''}">${modalOpts.x?MX():''}${html}</div>`);
 if(was&&title&&m.querySelector('.box h3')?.textContent===title)m.querySelector('.box').scrollTop=scroll;if(modalOpts.x)$('#modal .mx').onclick=modalOpts.x;m.classList.add('on');pauseAll(true,'modal');GameStats.offers();fitMobileModal();requestAnimationFrame(fitMobileModal);}
function closeModal(){$('#modal').classList.remove('on');$('#modal').innerHTML='';pauseAll(false,'modal');}
$('#modal').addEventListener('pointerdown',e=>{if(e.target.id==='modal'&&!modalOpts.noClose)closeModal();});
let tipT=0;
function showTip(s){const e=$('#tip');e.innerHTML=emo(s);e.classList.add('on');positionPuzzleTip();clearTimeout(tipT);tipT=setTimeout(()=>e.classList.remove('on'),5500);}
function positionPuzzleTip(){
 const el=$('#tip');if(!el)return;
 const below=screen==='play'&&Run.type==='puzzle';el.classList.toggle('actor-tip',below);
 if(!below||!el.classList.contains('on'))return;
 const actors=Run.hostages.filter(e=>!e.removed&&!e.dead);if(!actors.length)return;
 const feet=Math.max(...actors.flatMap(e=>e.bodies.filter(b=>e.attached.has(b.plugin.part)).map(b=>b.bounds.max.y)));
 const x=(actors.reduce((sum,e)=>sum+e.parts.torso.position.x,0)/actors.length-camX-viewX)*scale;
 const half=el.offsetWidth/2,top=clamp((feet-viewY)*scale+18,12,Math.max(12,innerHeight-el.offsetHeight-14));
 const left=clamp(x,half+12,Math.max(half+12,innerWidth-half-12));
 el.style.setProperty('--actor-tip-x',Math.round(left)+'px');el.style.setProperty('--actor-tip-y',Math.round(top)+'px');
}
function showBanner(a,b,col){const e=$('#banner');e.innerHTML=emo(`${a}<small style="color:${col||'#fff'}">${b||''}</small>`);/* эмодзи → иконки игры */e.classList.remove('on');void e.offsetWidth;e.classList.add('on');}
function refreshUI(){showCoins();if(screen==='sandbox')buildSandboxUI();if(screen==='menu')buildMenu();}

/* ============ экраны ============ */
function showScreen(name){
 StoryDialogue.clear();UpgradeCoach.clear();
 if(name==='menu')GameStats.leaveMode('menu');
 else if(name==='sandbox')GameStats.setMode('sandbox');
 screen=name;document.body.dataset.screen=name;requestAnimationFrame(showCoins);
 $('#banner').classList.remove('on');$('#tip').classList.remove('on');
 if(name!=='play')document.body.classList.remove('puzzle');
 resetSandboxGesture();dropGrab();swipe=null;drive=null;jumpQ=0;
 viewMode=name==='sandbox'?'sandbox':name==='play'&&Run.type!=='puzzle'?'follow':'fit';viewX=0;viewY=0;
 if(name==='sandbox'){buildSandboxUI();setFloorInset($('#bottom').offsetHeight);requestAnimationFrame(()=>setFloorInset($('#bottom').offsetHeight));}
 else if(name==='play')setFloorInset(Run.type==='puzzle'?28:Math.min(110,innerHeight*.2));
 else setFloorInset(14);
}
function showMenu(){if(Intro.active)Intro.abort();Y.stop();Run.trial=null;Run.boost=null;Run.activeBoost=null;sbTutStop(false);if(SbPick.on)sbPickStop();if(SbPlay.ent)sbPlayStop();sbOfferClear();Mode=AttractMode;AttractMode.t=0;LevelMode.flag=null;showScreen('menu');attractScene();buildMenu();}
function buildMenu(){
 const stars=Object.values(S.story.stars).reduce((a,b)=>a+b,0);
 $('#menu').innerHTML=`<div class="mtop"><div class="menu-wallet"><div class="coins">🪙 <span class="cv">${S.coins}</span></div><button class="btn sm" id="mRecords">${IC('trophy')} ${t('Лучшие игроки')}</button></div><div class="grow"></div>
 <button class="btn sm mission-entry" id="mMissions">${IC('book')} ${t('Задания')}</button><button class="ib" id="mShop">🛒</button><button class="ib" id="mSet" title="${t('Настройки')}">⚙️</button></div>
 <div class="mcenter"><h1><img class="logo" src="assets/ui/${LANG==='en'?'logo_text_en':'logo_text'}.png?v=${ASSET_V}" alt="${t('Битва овощей')}"><img class="logo logo-line" src="assets/ui/${LANG==='en'?'logo_text_line_en':'logo_text_line'}.png?v=${ASSET_V}" alt=""></h1><p class="sub">${t('Песочница · Битвы · Приключения')}</p>
 <div class="modes">
  <button class="mode" data-m="sandbox"><b><img src="assets/ui/ui_mode_sandbox.png?v=${ASSET_V}" alt=""></b><span>${t('Песочница')}<small>${t('Твори и устраивай бои')}</small></span></button>
  <button class="mode" data-m="story"><b><img src="assets/ui/ui_mode_story.png?v=${ASSET_V}" alt=""></b><span>${t('История')}<small>${IC('star_full')} ${stars} / ${STORY.length*3}</small></span></button>
  <button class="mode" data-m="arcade"><b><img src="assets/ui/ui_mode_arcade.png?v=${ASSET_V}" alt=""></b><span>${t('Аркада')}<small>🏆 ${t('Рекорд: {0} ур.',S.arcadeBest)}</small></span></button>
 </div>
 </div>
 <div id="mGift"><img class="rays" src="assets/ui/ui_rays.png?v=${ASSET_V}" alt=""><img class="gb" src="assets/ui/icon_gift.png?v=${ASSET_V}" alt=""><span class="gt"></span></div>`;
 giftTick();Missions.syncEntry();
 showCoins();
 document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{Snd.init();const m=b.dataset.m;GameStats.send('mode_selected',{selected_mode:m});if(m==='sandbox')enterSandbox();if(m==='story')startStoryFromMenu();if(m==='arcade')startArcadeFromMenu();});
 $('#menu').querySelectorAll('.mtop,.modes small').forEach(e=>e.innerHTML=emo(e.innerHTML));
 $('#mGift').onclick=openGift;$('#mShop').onclick=openShop;
 $('#mRecords').onclick=()=>{lobbyTab=Y.hasTop()&&Y.online()?'world':'mine';openArcadeRecords(()=>{closeModal();buildMenu();});};
 $('#mSet').onclick=openSettings;$('#mMissions').onclick=()=>Missions.open();
}

/* ============ песочница ============ */
function enterSandbox(){
 SbPlay.ent=null;if(SbPick.on)sbPickStop();document.body.classList.remove('sbplay');sbFight.lock=false;sbFight.teams=0;
 Mode=SandboxMode;SandboxMode.fight=false;SbM.fightStop();showScreen('sandbox');Missions.record('sandbox_play');SbM.sync();clearWorld();setLevelWidth(Math.max(SB_LW,WW*2));camX=(LW-WW)/2;
 if(!MAPS.find(m=>m.id===S.map&&itemUnlocked(m)))S.map='garden';mapId=S.map;
 setTimeout(()=>{
  const X=v=>camX+WW*v;
  spawnItem('platform',X(.5),FLOOR-140);
  spawnRagdoll('ogurets',X(.35),FLOOR-70,{team:0,ai:true,weapon:'sword'});
  spawnRagdoll('pomidor',X(.65),FLOOR-70,{team:1,ai:true,weapon:'bat'});
  spawnItem('box',X(.5),FLOOR-230);spawnItem('ball',X(.2),FLOOR-40);
  if(!S.tut.sbFirstBattle)clearWorld();
  sbTutStart();
 },60);
 tool='spawn';selItem='ogurets';buildSandboxUI();
}
// v=433: монета и значок рекламы уже нарисованы в фоне ценника (ui_badge_coin/ui_badge_ad); эмодзи 🪙 на Windows рисовался квадратиком «□»
function lockBadge(x,owned){if(owned)return'';return x.lock==='ad'?'<span class="lk ad"></span>':`<span class="lk">${x.lock}</span>`;}
function buildSandboxUI(){
 showCoins();sbCountKey='';setTimeout(sbCountUpdate);
 $('#cats').innerHTML=CATS.map(([id,n])=>`<button class="cat ${id===cat?'on':''}" data-cat="${id}">${t(n)}</button>`).join('')+
  `<div class="teams"><span>${t('Команда:')}</span>${[0,1,2,-1].map(tm=>`<button class="tm ${S.sbTeam===tm?'on':''}" data-team="${tm}" style="background:${tm<0?'#888':TEAMC[tm]}" title="${tm<0?t('Без команды'):t(TEAMN[tm])}">${tm<0?'⚪':''}</button>`).join('')}</div>`;
 let items;
 // подписи плиток — короткие (v=396: «Метательные копья» не влезали), полное имя — во всплывающей подсказке
 const lbl=n=>`<span class="itn">${t(SB_SHORT[n]||n)}</span>`;
 if(cat==='weapon')items=wpOrder(Object.keys(WEAPONS)).map(id=>[id,WEAPONS[id]]).map(([id,w])=>`<div class="it ${tool==='equip'&&selWeapon===id?'on':''} ${sbWeaponOwned(id)?'':'lock'}" data-wp="${id}" title="${t(w.n)}"><b>${iconHtml(id,w.e)}</b>${lbl(w.n)}${lockBadge(w,sbWeaponOwned(id))}</div>`).join('');
 else items=ITEMS.filter(i=>i.cat===cat).map(i=>`<div class="it ${tool==='spawn'&&selItem===i.id?'on':''} ${itemUnlocked(i)?'':'lock'}" data-it="${i.id}" title="${t(i.n)}"><b>${iconHtml(i.id,i.e)}</b>${lbl(i.n)}${lockBadge(i,itemUnlocked(i))}</div>`).join('');
 $('#items').innerHTML=items;makeScroller($('#items'));makeScroller($('#cats'));makeScroller($('#tools'),true);
 $('#cats').innerHTML=emo($('#cats').innerHTML);
 $('#tools').innerHTML=emo(TOOLS.map(x=>`<button class="ib ${tool===x.id?'on':''} ${itemUnlocked(x)?'':'locked'}" data-tool="${x.id}" title="${t(x.n)}">${x.e}${itemUnlocked(x)?'':`<img class="ib-lock" src="assets/ui/icon_lock.png?v=${ASSET_V}" alt=""><span class="ib-ad">AD</span>`}</button>`).join(''));
 $('#bFight').classList.toggle('on',SandboxMode.fight);
 document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{cat=b.dataset.cat;buildSandboxUI();});
 document.querySelectorAll('[data-team]').forEach(b=>b.onclick=()=>{S.sbTeam=+b.dataset.team;save();buildSandboxUI();toast(S.sbTeam<0?t('⚪ Новые бойцы — без команды'):t('Новые бойцы: {0}',t(TEAMN[S.sbTeam])));});
 document.querySelectorAll('[data-it]').forEach(b=>b.onclick=()=>{const it=ITEMS.find(x=>x.id===b.dataset.it);if(!itemUnlocked(it)){askUnlock(it,()=>{S.unlocked[it.id]=true;GameStats.send('sandbox_item_unlocked',{item:it.id,category:it.cat,via:it.lock==='ad'?'ad':'coins',price:it.lock==='ad'?0:it.lock});});return;}selItem=it.id;tool='spawn';buildSandboxUI();});
 sbTutMark();
 document.querySelectorAll('[data-wp]').forEach(b=>b.addEventListener('pointerdown',e=>wpDragStart(e,b.dataset.wp)));
 document.querySelectorAll('[data-wp]').forEach(b=>b.onclick=()=>{const id=b.dataset.wp,w=WEAPONS[id];if(!sbWeaponOwned(id)){askUnlock(w,()=>{(S.sbWeapons||(S.sbWeapons={}))[id]=true;GameStats.send('sandbox_weapon_unlocked',{weapon:id,via:w.lock==='ad'?'ad':'coins',price:w.lock==='ad'?0:w.lock});},()=>weaponUnlockFx(id,$(`[data-wp="${id}"]`)),t('Только для песочницы — в сюжете и аркаде оружие открывается отдельно.'));return;}selWeapon=id;tool='equip';buildSandboxUI();toast(t('{0} Тапни по бойцу, чтобы выдать: {1}',w.e,t(w.n)));});
 document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{const x=TOOLS.find(q=>q.id===b.dataset.tool);if(!itemUnlocked(x)){askUnlock(x,()=>{S.unlocked[x.id]=true;GameStats.send('sandbox_item_unlocked',{item:x.id,category:'tool',via:x.lock==='ad'?'ad':'coins',price:x.lock==='ad'?0:x.lock});});return;}tool=x.id;buildSandboxUI();toast(x.e+' '+t(x.n));});
}
function askUnlock(x,grant,after,note){
 const isAd=x.lock==='ad';
 modal(`<div class="big">${x.e}</div><h3>${t(x.n)}</h3><p>${isAd?t('Посмотри короткую рекламу и открой навсегда!'):t('Открой за монеты. Монеты дают за уровни, бои и разрушения.')}</p>${note?`<p class="note">${note}</p>`:''}
 ${isAd?`<button class="btn ad" id="uAd">🎬 ${t('Открыть за рекламу')}</button>`:`<button class="btn y" id="uCoin" ${S.coins<x.lock?'disabled':''}>🪙 ${t('Открыть за {0}',x.lock)}</button>${S.coins<x.lock?`<button class="btn ad" id="uCoinAd">🎬 ${t('+{0} монет за рекламу',Econ.adCoins())}</button>`:''}`}
 <button class="btn" id="uShop">🔓 ${t('Открыть всё сразу')}</button><button class="btn" id="uNo">${t('Позже')}</button>`);
 const done=()=>{grant();save();closeModal();toast(t('🔓 {0} открыт!',x.e+' '+t(x.n)));refreshUI();if(after)after();};
 const on=(s,f)=>{const e=$(s);if(e)e.onclick=f;};
 on('#uAd',async()=>{if(await Y.rewarded('item_unlock'))done();});
 on('#uCoin',()=>{if(S.coins<x.lock)return;addCoins(-x.lock);done();});
 on('#uCoinAd',async()=>{if(await Y.rewarded('unlock_coins')){rewardCoins(Econ.adCoins());askUnlock(x,grant,after);}});
 on('#uShop',openShop);on('#uNo',closeModal);
}
function toWorld(e){return{x:e.clientX/scale+viewX+camX,y:e.clientY/scale+viewY};}
function bodyAt(p,includeStatic){
 const list=Composite.allBodies(world).filter(b=>!(b.plugin&&b.plugin.bound)&&(includeStatic||!b.isStatic||b.plugin.frozen));
 const hit=Query.point(list,p);if(hit.length)return hit[hit.length-1];
 let best=null,bd=24;for(const b of list){const d=Vector.magnitude(Vector.sub(b.position,p));if(d<bd){bd=d;best=b;}}return best;
}
function npcAt(p){const b=bodyAt(p,false);const e=b&&b.plugin&&b.plugin.ent;return e&&e.type==='npc'?{e,b}:null;}
const SB_MAX_ITEMS=50,SB_MAX_FIGHTERS=16;
// сколько уже стоит бойцов и предметов — так же считает проверка лимита при создании
const sbCounts=()=>({npc:entities.filter(e=>e.type==='npc').length,obj:entities.filter(e=>e.type!=='npc'&&e.type!=='debris').length});
let sbCountKey='';
function sbCountUpdate(){const el=$('#sbCount');if(!el)return;const c=sbCounts(),k=c.npc+'/'+c.obj;if(k===sbCountKey)return;sbCountKey=k;
 el.innerHTML=`<span class="${c.npc>=SB_MAX_FIGHTERS?'full':''}">${IC('cat_creatures')}${c.npc}/${SB_MAX_FIGHTERS}</span><span class="${c.obj>=SB_MAX_ITEMS?'full':''}">${IC('cat_items')}${c.obj}/${SB_MAX_ITEMS}</span>`;}
const undoStack=[];let lastTap=0,pan=null,shootPtr=null;
// действие инструмента по тапу (для «создать» и «взрыв» — при отпускании, чтобы перетаскивание листало карту)
// выдача оружия в песочнице: иконка выскакивает над бойцом, лучи, кольцо и искры
function giveWeapon(ent,id){
 if(ent.team===1&&!ent.isPlayer&&id==='bazooka')id='bow';
 ent.weapon=id==='fists'?null:id;ent.ai=true;
 const h=ent.parts.head.position,tp=ent.parts.torso.position,y=h.y-46;
 floats.push({x:h.x,y,img:SPR['icon_wpn_'+id],life:62,c:'#fff'});
 FX.ring(tp.x,tp.y,70);for(let i=0;i<10;i++)FX.sparkle(tp.x+rnd(-55,55),tp.y+rnd(-70,40),rnd(18,34));
 Snd.unlock();sbTutFlag('equip');SbM.onEquip(ent,id);if(!ent.missionEquipped){ent.missionEquipped=true;Missions.record('sandbox_equip');}
}
// перетаскивание оружия с панели на бойца
let wpDrag=null;
function wpDragStart(e,id){
 if(!sbWeaponOwned(id))return;
 wpDrag={id,x:e.clientX,y:e.clientY,ghost:null,pid:e.pointerId};
}
document.addEventListener('pointermove',e=>{
 if(!wpDrag||e.pointerId!==wpDrag.pid)return;
 if(!wpDrag.ghost){
  if(Math.hypot(e.clientX-wpDrag.x,e.clientY-wpDrag.y)<14)return;
  const im=SPR['icon_wpn_'+wpDrag.id];const g=document.createElement('img');g.className='wpghost';g.alt='';if(im)g.src=im.src;document.body.appendChild(g);wpDrag.ghost=g;
 }
 wpDrag.ghost.style.left=e.clientX+'px';wpDrag.ghost.style.top=e.clientY+'px';
});
const wpDragEnd=e=>{
 if(!wpDrag||e.pointerId!==wpDrag.pid)return;const d=wpDrag;wpDrag=null;if(!d.ghost)return;d.ghost.remove();
 if(screen!=='sandbox')return;
 if(!SbPlay.ent&&e.button===0){const loot=pickups.find(q=>q.t==='crateLoot'&&!q.taken&&Math.hypot(q.x-p.x,q.y-p.y)<34);if(loot&&collectCrateLoot(loot,null))return;}
 const n=npcAt(toWorld(e));if(n){selWeapon=d.id;tool='equip';buildSandboxUI();giveWeapon(n.e,d.id);}
};
document.addEventListener('pointerup',wpDragEnd);document.addEventListener('pointercancel',e=>{if(wpDrag&&e.pointerId===wpDrag.pid){if(wpDrag.ghost)wpDrag.ghost.remove();wpDrag=null;}});
/* ============ обучение песочнице: шаг закрывается, когда игрок сделал действие ============ */
const SB_STEPS=[
 {get txt(){return matchMedia('(pointer:coarse)').matches?'Своди два пальца, чтобы отдалить камеру, разводи — чтобы приблизить':'Колёсико мыши приближает и отдаляет камеру. Перетаскивай сцену, чтобы осмотреться';},next:true},
 {txt:'Выбери бойца внизу и нажми на сцену — он появится там',hl:'#items .it:first-child',ok:s=>entities.filter(e=>e.type==='npc').length>s.npcs},
 {txt:'Здесь видно, сколько ещё можно поставить бойцов и предметов',hl:'#sbCount',next:true},
 {txt:'Выбери цвет команды: бойцы разных команд дерутся друг с другом',hl:'#cats .teams',ok:s=>S.sbTeam!==s.team},
 {txt:'Открой вкладку «Оружие»',hl:'[data-cat="weapon"]',ok:()=>cat==='weapon'},
 {txt:'Перетащи оружие на бойца или выбери его и нажми на бойца',hl:'#items .it:not(.lock)',ok:s=>s.equip},
 {txt:'Рука: возьми бойца или предмет и брось его',hl:'[data-tool="hand"]',ok:()=>!!grab},
 {txt:'Удалить: нажми на бойца или предмет, и он исчезнет',hl:'[data-tool="del"]',next:true},
 {txt:'Закрепить: предмет застынет на месте, даже в воздухе',hl:'[data-tool="freeze"]',next:true},
 {txt:'Сменить команду: нажми на бойца, и он перейдёт в другую команду',hl:'[data-tool="team"]',next:true},
 {txt:'Оживить: нажми на побеждённого бойца',hl:'[data-tool="heal"]',next:true},
 {txt:'Взрыв пальцем: взрыв там, куда нажмёшь',hl:'[data-tool="boom"]',next:true},
 {txt:'Играть за бойца: нажми сюда, потом на бойца на сцене, и управляй им сам',hl:'#bPlay',next:true},
 {txt:'Пауза и замедление времени',hl:'#bSlow',next:true},
 {txt:'Гравитация: включи невесомость',hl:'#bGrav',next:true},
 {txt:'Отменить последнее действие и очистить сцену',hl:'#bUndo',next:true},
 {txt:'Карта: выбери, где будет битва',hl:'#bMaps',next:true},
 {txt:'Нажми ⚔️ — и бойцы начнут драться!',hl:'#bFight',ok:()=>SandboxMode.fight},
 {txt:'Готово! Экспериментируй: строй, взрывай и устраивай битвы',end:true},
];
const SB_FIRST_STEPS=[
 {txt:'Поставь синего бойца: выбери овощ внизу и нажми на сцену',hl:'#items .it:first-child',ok:()=>entities.some(e=>e.type==='npc'&&e.team===0)},
 {txt:'Теперь выбери красную команду',hl:'[data-team="1"]',ok:()=>S.sbTeam===1},
 {txt:'Поставь красного бойца рядом с синим',hl:'#items .it:first-child',ok:()=>entities.some(e=>e.type==='npc'&&e.team===1)},
 {txt:'Открой вкладку «Оружие»',hl:'[data-cat="weapon"]',ok:()=>cat==='weapon'},
 {txt:'Выбери палку и нажми на бойца, чтобы выдать оружие',hl:'[data-wp="fists"]',ok:s=>s.equip},
 {txt:'Нажми ⚔️ — и бойцы начнут драться!',hl:'#bFight',ok:()=>SandboxMode.fight},
 {get txt(){return matchMedia('(pointer:coarse)').matches?'Готово! Своди и разводи два пальца для масштаба. Создавай новые битвы!':'Готово! Колёсико меняет масштаб, перетаскивание двигает камеру. Создавай новые битвы!';},end:true}
];
const SbTut={on:false,i:0,t:0,steps:SB_STEPS,key:'sb3',npcs:0,team:0,equip:false};
/* ============ песочница: игра за своего героя ============ */
const SbPlay={ent:null,deadAt:0};
const fineInput=()=>matchMedia('(hover:hover) and (pointer:fine)').matches;
const SB_PLAY_STEPS=()=>[
 {txt:fineInput()?'Ходи стрелками ← →':'Ходи джойстиком',hl:fineInput()?'#controls .keys':'#joy',ok:s=>!!SbPlay.ent&&Math.abs(SbPlay.ent.parts.torso.position.x-s.x0)>70},
 {txt:fineInput()?'Прыжок — пробел или ↑':'Нажми кнопку ↑ — это прыжок. Джойстиком выбирай направление',hl:fineInput()?'#controls .keys [data-k=jump]':'#touchJump',ok:s=>s.jumped},
 {txt:fineInput()?'Рывок — нажми Q. Направление задаётся движением, перезарядка — 1,2 с':'Нажми » для рывка. Направление задаётся джойстиком, перезарядка — 1,2 с',hl:fineInput()?null:'#touchDash',ok:()=>!!SbPlay.ent?.lastDashAt},
 {txt:fineInput()?'Удар — F или мышка, зажми для сильного удара. Палка бьёт сама':'Удар — кнопка справа внизу, зажми для сильного удара. Палка бьёт сама',hl:'#controls .atk',ok:s=>s.hit||s.t>300},
 {txt:'Нажми ⚔️ — и бойцы других команд нападут на тебя',hl:'#bFight',ok:()=>SandboxMode.fight},
 {txt:'Чтобы вернуться к созданию, нажми на героя вверху ещё раз',hl:'#bPlay',end:true},
];
// белая стрелка в стиле интерфейса: белая заливка, коричневый контур как у кнопок. Смотрит вниз
const ARROW_SVG=`<svg viewBox="-3 -2 46 56" aria-hidden="true"><path d="M14 3H26Q30 3 30 7V23H35Q40 23 37 27L23 46Q20 50 17 46L3 27Q0 23 5 23H10V7Q10 3 14 3Z" fill="#fff" stroke="#6b3f1f" stroke-width="4" stroke-linejoin="round"/><path d="M26 7V27H33L21 43" fill="none" stroke="#e9dccb" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
// выбор бойца для игры: игрок нажимает на любого бойца, который уже стоит на сцене
const SbPick={on:false,arrows:[]};
const sbLiveNpcs=()=>entities.filter(e=>e.type==='npc'&&!e.dead&&!e.removed);
function sbPlayPick(){
 if(SbTut.on)sbTutStop(false);
 if(!sbLiveNpcs().length){toast(t('Сначала поставь бойца на сцену'));return;}
 SbPick.on=true;$('#bPlay').classList.add('on');document.body.classList.add('sbpicking');
 const n=$('#tutor');n.classList.add('on','sb');
 n.innerHTML=`<div class="tt">${emo(t('Нажми на бойца, за которого будешь играть'))}</div><div class="tb"><button class="btn sm" id="spCancel">${t('Отмена')}</button></div>`;
 $('#spCancel').onclick=()=>{Snd.init();sbPickStop();};
}
function sbPickStop(){
 SbPick.on=false;document.body.classList.remove('sbpicking');SbPick.arrows.forEach(a=>a.remove());SbPick.arrows=[];
 if(!SbPlay.ent){const b=$('#bPlay');if(b)b.classList.remove('on');}
 const n=$('#tutor');if(n&&n.classList.contains('sb')&&!SbTut.on){n.classList.remove('on','sb');n.innerHTML='';}
}
// нажатие во время выбора: ближайший к пальцу живой боец
function sbPickAt(p){
 let best=null,bd=110;for(const e of sbLiveNpcs()){const q=e.parts.torso.position,d=Math.hypot(q.x-p.x,(q.y-p.y)*.7);if(d<bd){bd=d;best=e;}}
 if(!best)return false;sbPickStop();sbPlayStart(best);return true;
}
// стрелки над бойцами, пока идёт выбор
function sbPickUpdate(){
 if(!SbPick.on)return;
 const list=sbLiveNpcs();if(!list.length){sbPickStop();return;}
 while(SbPick.arrows.length<list.length){const a=document.createElement('div');a.className='sbpk';a.innerHTML=ARROW_SVG;document.body.appendChild(a);SbPick.arrows.push(a);}
 while(SbPick.arrows.length>list.length)SbPick.arrows.pop().remove();
 list.forEach((e,k)=>{const h=e.parts.head||e.parts.torso,a=SbPick.arrows[k];a.style.left=Math.round((h.position.x-viewX-camX)*scale)+'px';a.style.top=Math.round((h.position.y-48-viewY)*scale)+'px';});
}
function sbPlayStart(h){
 GameStats.send('sandbox_control',{action:'started',hero:h.kind});
 if(SbTut.on)sbTutStop(false);
 // боец остаётся в своей команде; запоминаем, как он вёл себя раньше, чтобы вернуть после игры
 SbPlay.prevAi=h.ai;h.isPlayer=true;h.ai=false;const growthMode=ROSTER.story[h.kind]?'story':ROSTER.arcade[h.kind]?'arcade':null;if(growthMode)HeroEvolution.apply(h,heroData(growthMode,h.kind).lv,UPG_MAX[growthMode]);h.ctrl.move=0;h.ctrl.attack=false;h.ctrl.jump=false;
 h.facing=h.facing||1;SbPlay.ent=h;SbPlay.deadAt=0;SbM.add('play');Run.hero=h;Run.gunUi=undefined;Object.keys(keys).forEach(k=>keys[k]=false);
 document.body.classList.add('sbplay');$('#bPlay').classList.add('on');
 const x=h.parts.torso.position.x,y=h.parts.torso.position.y;
 FX.ring(x,y,80);for(let i=0;i<8;i++)FX.sparkle(x+rnd(-50,50),y+rnd(-70,40),rnd(18,30));Snd.unlock();
 sbTutStart(SB_PLAY_STEPS(),'sbplay');
 const oldFloor=FLOOR;resize();shiftWorld(FLOOR-oldFloor);
}
function sbPlayStop(){
 if(SbPlay.ent)GameStats.send('sandbox_control',{action:'stopped',hero:SbPlay.ent.kind});
 const h=SbPlay.ent;SbPlay.ent=null;SbPlay.deadAt=0;if(Run.hero===h)Run.hero=null;
 if(h&&!h.removed){h.isPlayer=false;h.ai=SbPlay.prevAi!==undefined?SbPlay.prevAi:true;h.ctrl.move=0;h.ctrl.attack=false;h.ctrl.jump=false;}
 Object.keys(keys).forEach(k=>keys[k]=false);document.body.classList.remove('sbplay');const b=$('#bPlay');if(b)b.classList.remove('on');
 const oldFloor=FLOOR;resize();shiftWorld(FLOOR-oldFloor);
 if(SbTut.on&&SbTut.key==='sbplay')sbTutStop(!!SbTut.steps[SbTut.i].end);
}
// управление как на уровне: клавиши или джойстик и кнопки, камера следует за героем
function sbPlayUpdate(){
 sbPickUpdate();
 const h=SbPlay.ent;if(!h)return;
 if(h.removed||h.dead){if(!SbPlay.deadAt)SbPlay.deadAt=frame;if(frame-SbPlay.deadAt>90){sbPlayStop();toast(t('Герой выбыл. Нажми на героя вверху, чтобы сыграть снова'));}return;}
 h.ctrl.move=(keys.right?1:0)-(keys.left?1:0);h.ctrl.jump=keys.jump||jumpQ>0;if(jumpQ>0)jumpQ--;
 let wantAtk=queuedAttack(h,autoAttack(h));
 h.ctrl.attack=heroAim(h,wantAtk);
 const gun=heroArmed(h);
 if(gun!==Run.gunUi){Run.gunUi=gun;const b=$('#controls .atk');b.classList.toggle('gun',!!gun);b.style.setProperty('--wi',gun?`url("${weaponIconSrc(gun)}")`:'none');if(!gun)keys.attack=false;}
 if(LW>WW+1){const want=clamp(h.parts.torso.position.x-WW*.45,0,LW-WW);camX+=(want-camX)*.09;}
 const ceiling=FLOOR-SB_MAX_RISE,top=Math.min(...h.bodies.filter(b=>h.attached.has(b.plugin.part)).map(b=>b.bounds.min.y));
 if(top<ceiling){
  for(const b of h.bodies){Body.translate(b,{x:0,y:ceiling-top});if(b.velocity.y<0)Body.setVelocity(b,{x:b.velocity.x,y:0});}
  h.jumpBuf=0;if(frame-(h.ceilingNoticeAt??-999)>300){h.ceilingNoticeAt=frame;toast(t('Достигнут предел высоты'));}
 }
 const cameraY=clamp(h.parts.torso.position.y-viewH*.58,ceiling-160,Math.max(0,VH-viewH));
 viewY+=(cameraY-viewY)*.12;

 if(keys.jump)SbTut.jumped=true;if(keys.attack)SbTut.hit=true;  // палка бьёт сама, поэтому засчитываем только нажатие
}
/* ============ песочница: реклама в конце боя и предложение за награду ============ */
const sbFight={teams:0,lock:false};
function sbFightCheck(){
 if(!SandboxMode.fight||frame%20)return;
 const al=entities.filter(e=>e.type==='npc'&&!e.dead&&!e.removed),n=new Set(al.map(e=>e.team<0?'n'+entities.indexOf(e):e.team)).size;
 if(n>=2){sbFight.lock=false;sbFight.teams=n;return;}
 if(sbFight.teams>=2&&!sbFight.lock){
  sbFight.lock=true;sbFight.teams=n;const w=al[0];
  showBanner(!w?t('Ничья'):w.team>=0?t('Победа: {0}',t(TEAMN[w.team])):t('Победа!'),'',w&&w.team>=0?TEAMC[w.team]:'#fff');
  // бой закончился — естественная пауза: Bridge сам решит, показать ли рекламу
  // реклама в конце боя песочницы убрана (v475)
 }
}
let sbOfferT=0,sbOfferEl=null,sbBoomWas=false;
const SB_OFFER_EVERY=60*90;  // раз в 1,5 минуты активной игры в песочнице
function sbOfferTick(){
 if(paused)return;
 const bo=Date.now()<sbBoomUntil;
 if(bo!==sbBoomWas){sbBoomWas=bo;const bt=TOOLS.find(x=>x.id==='boom');if(!bo&&tool==='boom'&&bt&&!itemUnlocked(bt))tool='spawn';buildSandboxUI();if(!bo)toast(t('Взрыв пальцем снова закрыт'));}
 if(SbTut.on||sbOfferEl||!Y.canReward())return;
 // всплывающий бейдж сбоку («взрыв пальцем на 3 мин» / «+150») по просьбе заказчика не показываем (2026-11-09);
 // инструмент «Взрыв» по-прежнему открывается за рекламу на панели
}
function sbOfferShow(){
 const bt=TOOLS.find(x=>x.id==='boom'),boom=!!bt&&!itemUnlocked(bt);
 const b=document.createElement('button');b.className='trb sboffer';b.title=boom?t('Взрыв пальцем на 3 минуты'):t('+150 монет');
 b.innerHTML=emo(`<img src="assets/ui/${boom?'icon_tool_boom':'icon_coin_big'}.png?v=${ASSET_V}" alt=""><span>🎬 ${boom?t('3 мин'):'+150'}</span>`);
 document.body.appendChild(b);sbOfferEl=b;
 const kill=()=>{if(sbOfferEl===b){b.remove();sbOfferEl=null;}};setTimeout(kill,15000);
 b.onclick=async()=>{if(!(await Y.rewarded('sandbox_bonus')))return;kill();if(boom){sbBoomUntil=Date.now()+180000;sbBoomWas=true;tool='boom';buildSandboxUI();toast(t('Взрыв пальцем открыт на 3 минуты'));}else{rewardCoins(Econ.adCoins());}};
}
function sbOfferClear(){if(sbOfferEl){sbOfferEl.remove();sbOfferEl=null;}sbOfferT=0;}
function sbTutFlag(k){if(SbTut.on)SbTut[k]=true;}
function sbTutStart(steps,key){if(!steps&&!key){steps=SB_FIRST_STEPS;key='sbFirstBattle';}steps=steps||SB_STEPS;key=key||'sb3';if(S.tut[key]||SbTut.on)return;Object.assign(SbTut,{on:true,i:0,t:0,steps,key,equip:false,jumped:false,hit:false,x0:SbPlay.ent?SbPlay.ent.parts.torso.position.x:0,npcs:entities.filter(e=>e.type==='npc').length,team:S.sbTeam});if(key==='sb3'||key==='sbFirstBattle'){cat='npc';tool='spawn';if(key==='sbFirstBattle'){S.sbTeam=0;selItem='ogurets';}buildSandboxUI();}sbTutShow();}
function sbTutStop(done,skipped=false){setTimeout(()=>SbM.sync(),50);if(SbTut.on&&done)GameStats.send(skipped?'tutorial_skipped':'tutorial_completed',{tutorial:SbTut.key});sbCountKey='';if(done&&SbTut.key&&!S.tut[SbTut.key]){S.tut[SbTut.key]=1;save();}SbTut.on=false;const ar=$('#sbArrow');if(ar)ar.style.display='none';document.querySelectorAll('.tut-hl').forEach(e=>e.classList.remove('tut-hl'));const n=$('#tutor');if(n&&n.classList.contains('sb')){n.classList.remove('on','sb');n.innerHTML='';}}
function sbTutMark(){if(!SbTut.on)return;document.querySelectorAll('.tut-hl').forEach(e=>e.classList.remove('tut-hl'));const s=SbTut.steps[SbTut.i];if(s&&s.hl){const el=$(s.hl);if(el)el.classList.add('tut-hl');}sbArrow();}
// стрелка обучения — отдельный элемент поверх экрана: края панелей её не обрезают. Над целью, а если сверху нет места — под ней
function sbArrow(){
 let a=$('#sbArrow');const s=SbTut.on&&SbTut.steps[SbTut.i],el=s&&s.hl&&$(s.hl);
 if(!el||!el.offsetWidth){if(a)a.style.display='none';return;}
 if(!a){a=document.createElement('div');a.id='sbArrow';a.innerHTML=ARROW_SVG;document.body.appendChild(a);}
 const r=el.getBoundingClientRect(),side=!!el.closest('#tools'),up=!side&&r.top<70;
 a.style.display='block';a.classList.toggle('up',up);a.classList.toggle('side',side);
 // у вертикальной панели инструментов стрелка справа и смотрит влево, чтобы не налезать на соседние кнопки
 if(side){a.style.left=Math.round(r.right+8)+'px';a.style.top=Math.round(r.top+r.height/2)+'px';}
 else{a.style.left=Math.round(r.left+r.width/2)+'px';a.style.top=Math.round(up?r.bottom+8:r.top-8)+'px';}
}
function sbTutShow(){
 const s=SbTut.steps[SbTut.i],n=$('#tutor');
 GameStats.send('tutorial_step',{tutorial:SbTut.key,step_index:SbTut.i});
 document.dispatchEvent(new CustomEvent('sandbox-tutorial-target',{detail:s.hl}));
 sbTutMark();
 n.classList.add('on','sb');
 n.innerHTML=`<div class="tt">${emo(t(s.txt))}</div><div class="td">${SbTut.steps.slice(0,-1).map((_,k)=>`<i class="${k<SbTut.i?'ok':k===SbTut.i?'cur':''}"></i>`).join('')}</div><div class="tb">${s.next?`<button class="btn sm g" id="sbNext">${t('Далее')}</button>`:''}<button class="btn sm ${s.end?'g':''}" id="sbSkip">${s.end?t('Понятно'):t('Пропустить')}</button></div>`;
 $('#sbSkip').onclick=()=>{Snd.init();sbTutStop(true,!s.end);};
 if($('#sbNext'))$('#sbNext').onclick=()=>{Snd.init();SbTut.i++;SbTut.t=0;sbTutShow();};
}
function sbTutTick(){
 if(!SbTut.on)return;const s=SbTut.steps[SbTut.i];
 if(frame%10===0)sbArrow();  // панель могла перестроиться или окно изменить размер
 SbTut.t++;
 if(!s.end&&!s.next&&s.ok(SbTut)){SbTut.i++;SbTut.t=0;Snd.checkpoint();sbTutShow();}
}
function sbTap(p){
 if(tool==='spawn'){
  if(p.y>FLOOR-2&&!['spikes','platform','tramp','ice','wall'].includes(selItem))p.y=FLOOR-60;
  // лимит, чтобы песочница не тормозила: бойцы считаются отдельно, обломки не считаются
  const isNpc=!!NPC[selItem],placed=entities.filter(e=>isNpc?e.type==='npc':e.type!=='npc'&&e.type!=='debris').length;
  if(placed>=(isNpc?SB_MAX_FIGHTERS:SB_MAX_ITEMS)||bodyCount()>MAXBODIES){toast(t(isNpc?'Слишком много бойцов — убери лишних 🧹':'Слишком много предметов — очисти сцену 🧹'));return;}
  const ent=NPC[selItem]?spawnRagdoll(selItem,p.x,p.y,{team:S.sbTeam,ai:true}):spawnItem(selItem,p.x,p.y);
  if(ent){undoStack.push(ent);if(undoStack.length>60)undoStack.shift();Snd.pop();GameStats.bump(isNpc?'sb_fighters_spawned':'sb_items_spawned');SbM.onSpawn(selItem,isNpc);}
 }
 if(tool==='boom'){explode(p.x,p.y,.07,240,null);SbM.add('boom');}
}
const startPan=(e,tap)=>{pan={down:true,id:e.pointerId,sx:e.clientX,cam:camX,moved:false,v:0,lx:e.clientX,tap};try{canvas.setPointerCapture(e.pointerId);}catch(_){}};
// Capture two-finger gestures before placement and editing tools can react.
const sbTouches=new Map();let sbPinch=null,sbTouchTap=null;
function resetSandboxGesture(){sbTouches.clear();sbPinch=null;sbTouchTap=null;pan=null;dropGrab();}
canvas.addEventListener('pointerdown',e=>{
 if(e.pointerType!=='touch'||screen!=='sandbox'||SbPlay.ent)return;
 sbTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 canvas.setPointerCapture(e.pointerId);
 if(sbTouches.size<2)return;
 const [a,b]=[...sbTouches.values()],mid=(a.x+b.x)/2;
 sbPinch={distance:Math.max(20,Math.hypot(a.x-b.x,a.y-b.y)),zoom:sandboxZoom,anchor:camX+viewX+mid/scale};
 sbTouchTap=null;pan=null;dropGrab();e.preventDefault();e.stopImmediatePropagation();
},true);
canvas.addEventListener('pointermove',e=>{
 if(!sbTouches.has(e.pointerId))return;
 sbTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(sbPinch){
  if(sbTouches.size>=2){const [a,b]=[...sbTouches.values()];setSandboxZoom(sbPinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/sbPinch.distance,(a.x+b.x)/2,sbPinch.anchor);}
  e.preventDefault();e.stopImmediatePropagation();
 }else if(sbTouchTap&&Math.hypot(e.clientX-sbTouchTap.x,e.clientY-sbTouchTap.y)>8)sbTouchTap.moved=true;
},true);
function endSandboxTouch(e){
 if(!sbTouches.has(e.pointerId))return;
 sbTouches.delete(e.pointerId);
 if(sbPinch){
  if(!sbTouches.size)sbPinch=null;
  sbTouchTap=null;pan=null;dropGrab();e.preventDefault();e.stopImmediatePropagation();
 }
}
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,endSandboxTouch,true);
addEventListener('blur',resetSandboxGesture);
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetSandboxGesture();});
function canvasPointerDown(e){
 Snd.init();
 const p=toWorld(e);
 // на уровнях палец режет верёвки (тап или свайп)
 if(screen==='play'){if(Run.state!=='play')return;
  // на ПК удар/выстрел оружием — кнопкой мыши (по верёвке — режем верёвку, не бьём)
  const cut=cutRopesAlong(p,p,22)>0;if(!cut&&e.pointerType==='mouse'&&e.button===0&&Run.hero){if(!keys.attack)queueAttackPress();keys.attack=true;shootPtr=e.pointerId;}swipe={last:p,trail:[p],t:performance.now()};canvas.setPointerCapture(e.pointerId);return;}
 if(screen!=='sandbox')return;
 if(SbPlay.ent){if(e.pointerType==='mouse'&&e.button===0){if(!keys.attack)queueAttackPress();keys.attack=true;shootPtr=e.pointerId;canvas.setPointerCapture(e.pointerId);}return;}
 if(e.pointerType==='touch'&&!e.sbTapReplay&&(SbPick.on||['equip','team','del','freeze','heal'].includes(tool))){sbTouchTap={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};return;}
 // у мыши один указатель: новое нажатие значит, что прошлое закончилось (кнопку могли отпустить за окном, и прокрутка залипала)
 if(pan&&pan.down){if(e.pointerType!=='mouse')return;pan=null;}
 // нажатие мимо цели инструмента листает сцену; повтор касания (sbTapReplay) — уже после отпускания пальца, листать нечего
 const panHere=()=>{if(!e.sbTapReplay)startPan(e,false);};
 if(SbPick.on){if(!sbPickAt(p))panHere();return;}
 // правая/средняя кнопка мыши — всегда листает
 if(e.button>0){startPan(e,false);return;}
 if(tool==='spawn'||tool==='boom'){startPan(e,true);return;}
 // раньше с оружием и сменой команды сцена не листалась совсем
 if(tool==='equip'){const n=npcAt(p);if(n)giveWeapon(n.e,selWeapon);else panHere();return;}
 if(tool==='team'){const n=npcAt(p);if(!n){panHere();return;}if(n){const order=[0,1,2,-1],i=order.indexOf(n.e.team);n.e.team=order[(i+1)%4];n.e.ai=true;SbM.add('team');Snd.pop();floats.push({x:p.x,y:p.y-20,t:n.e.team<0?'⚪':t(TEAMN[n.e.team]),life:40,c:n.e.team<0?'#fff':TEAMC[n.e.team]});}return;}
 const b=bodyAt(p,tool==='del'||tool==='freeze');
 // в песочнице тоже можно резать верёвки (если они есть)
 if(!b){if(!cutRopesAlong(p,p,16))startPan(e,false);return;}
 const ent=b.plugin&&b.plugin.ent;
 if(tool==='del'){if(ent){juice(b.position.x,b.position.y,'#ffffff',8,3);removeEnt(ent);Snd.pop();}return;}
 if(tool==='freeze'){if(!ent||ent.type==='static'||ent.type==='saw')return;const fr=!b.plugin.frozen;b.plugin.frozen=fr;Body.setStatic(b,fr);Snd.pop();if(fr)SbM.add('freeze');return;}
 if(tool==='grow'){if(ent&&ent.type==='npc'){growNpc(ent);SbM.add('grow');}else panHere();return;}
 if(tool==='heal'){if(!ent||ent.type!=='npc'){panHere();return;}if(ent&&ent.type==='npc'){if(ent.dead)SbM.add('revive');healNpc(ent,1);juice(b.position.x,b.position.y,'#7dffb0',14,3);FX.heal(ent.parts.head.position.x,ent.parts.head.position.y-20);Snd.unlock();}return;}
 if(tool==='hand'){
  if(b.isStatic)return;
  const local=Vector.rotate(Vector.sub(p,b.position),-b.angle);
  const c=Constraint.create({pointA:{...p},bodyB:b,pointB:local,length:0,stiffness:.08,damping:.05,render:{visible:false}});
  Composite.add(world,c);grab={c,body:b,target:{...p},sx:e.clientX};SbM.add('grab');canvas.setPointerCapture(e.pointerId);
 }
}
canvas.addEventListener('pointerdown',canvasPointerDown);
// положение мыши для прицела (только мышь: касания прицел не двигают)
const trackMouse=e=>{if(e.pointerType!=='mouse')return;MouseAim.x=e.clientX;MouseAim.y=e.clientY;MouseAim.at=performance.now();MouseAim.inside=true;};
canvas.addEventListener('pointermove',trackMouse);
canvas.addEventListener('pointerdown',e=>{trackMouse(e);if(e.pointerType==='mouse'&&e.button===0)MouseAim.held=true;});
addEventListener('pointerup',e=>{if(e.pointerType==='mouse'&&e.button===0)MouseAim.held=false;});
canvas.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!MouseAim.held)MouseAim.inside=false;});
canvas.addEventListener('pointermove',e=>{
 const p=toWorld(e);
 if(pan&&pan.down&&e.pointerId===pan.id&&e.pointerType==='mouse'&&!e.buttons){pan.down=false;pan.v=0;return;} // кнопку отпустили, а pointerup не пришёл
 if(pan&&pan.down&&e.pointerId===pan.id){const dx=e.clientX-pan.sx;if(Math.abs(dx)>8)pan.moved=true;
  if(pan.moved){const was=camX;camX=clamp(pan.cam-dx/scale,0,Math.max(0,LW-WW));pan.v=pan.v*.5+(camX-was)*.5;}return;}
 if(grab){grab.target.x=p.x;grab.target.y=p.y;grab.sx=e.clientX;}
 if(swipe){cutRopesAlong(swipe.last,p,10);swipe.last=p;swipe.t=performance.now();swipe.trail.push(p);if(swipe.trail.length>8)swipe.trail.shift();}
});
const endPointer=e=>{if(sbTouchTap&&(!e||e.pointerId===sbTouchTap.id)){const tap=sbTouchTap;sbTouchTap=null;if(e?.type==='pointerup'&&!tap.moved)canvasPointerDown({clientX:e.clientX,clientY:e.clientY,button:0,pointerType:'touch',pointerId:e.pointerId,sbTapReplay:true});}if(shootPtr!=null&&(!e||e.pointerId===shootPtr)){keys.attack=false;shootPtr=null;}if(pan&&pan.down&&(!e||e.pointerId===pan.id)){pan.down=false;if(!pan.moved){pan.v=0;if(pan.tap&&e&&e.type==='pointerup')sbTap(toWorld(e));}}if(drive&&(!e||e.pointerId===drive.id))drive=null;dropGrab();if(swipe){const s=swipe;setTimeout(()=>{if(swipe===s)swipe=null;},120);}};
canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);
document.addEventListener('contextmenu',e=>e.preventDefault());
// колесо слушаем на всём окне: над подсказкой обучения, счётчиком и верхними кнопками масштаб раньше не менялся.
// Нижняя панель и окна прокручивают сами себя
addEventListener('wheel',e=>{if(screen!=='sandbox'||SbPlay.ent)return;if(e.target.closest&&e.target.closest('#bottom,#tools,#modal,#mockAd'))return;e.preventDefault();const dy=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?ch:1);if(dy)setSandboxZoom(sandboxZoom*Math.exp(-clamp(dy,-400,400)*.0015),e.clientX);else if(e.deltaX)panCam(e.deltaX/scale);if(pan)pan.v=0;},{passive:false});
// щелчок кнопок интерфейса
document.addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('.btn,.ib,.mode,.tabs button,.it,.cat,.lvc,.hc,.hch,.map,.wch,.tm')){Snd.init();Snd.ui();}},true);
$('#bHome').onclick=async()=>{await Y.interstitial('sandbox_exit');showMenu();};
$('#bFight').onclick=()=>{
 SandboxMode.fight=!SandboxMode.fight;buildSandboxUI();
 if(SandboxMode.fight)GameStats.bump('sb_fights');
 if(SandboxMode.fight){const teams=new Set(fighters().filter(e=>!e.dead&&e.team>=0).map(e=>e.team));if(teams.size>=2)Missions.record('sandbox_battle');SbM.fightStart();toast(teams.size>=2?t('⚔️ В бой!'):t('⚔️ Бой включён — нужны бойцы разных команд'));}
 else{SbM.fightStop();toast(t('🕊️ Перемирие'));}
};
$('#sbMissionBar').onclick=()=>{Snd.init();SbM.open();};
$('#bPlay').onclick=()=>{Snd.init();SbPlay.ent?sbPlayStop():SbPick.on?sbPickStop():sbPlayPick();};
$('#bPause').onclick=()=>{const on=!pauseReasons.has('user');pauseAll(on,'user');// рекламы на паузе нет (2026-11-09): игроки жаловались на частую рекламу
 $('#bPause').classList.toggle('on',on);$('#bPause').innerHTML=emo(on?'▶️':'⏸');};
$('#bSlow').onclick=()=>{slow=!slow;if(slow)SbM.add('slow');$('#bSlow').classList.toggle('on',slow);};
$('#bGrav').onclick=()=>{zeroG=!zeroG;if(zeroG)SbM.add('gravity');$('#bGrav').classList.toggle('on',zeroG);$('#bGrav').innerHTML=emo(zeroG?'🪐':'🌍');if(zeroG)for(const b of Composite.allBodies(world))if(!b.isStatic)Body.setVelocity(b,{x:b.velocity.x+rnd(-1,1),y:b.velocity.y-rnd(1,3)});};
$('#bUndo').onclick=()=>{let e;while((e=undoStack.pop())&&e.removed);if(e){removeEnt(e);Snd.pop();}};
$('#bClear').onclick=async()=>{const had=entities.length>0;clearWorld();undoStack.length=0;};  // без рекламы при очистке (2026-11-09)
$('#bMaps').onclick=openMaps;
function openMaps(){
 modal(`<h3>🗺️ ${t('Карта')}</h3><div class="maps">${MAPS.map(m=>`<div class="map ${S.map===m.id?'on':''} ${itemUnlocked(m)?'':'locked'}" data-map="${m.id}"><img class="mprev" src="assets/maps/ui_map_${m.id}.png?v=${ASSET_V}" alt="">${t(m.n)}${itemUnlocked(m)?'':`<div class="mlk">${m.lock==='ad'?'🎬 '+t('реклама'):'🪙'+m.lock}</div>`}</div>`).join('')}</div><button class="btn" id="mc">${t('Закрыть')}</button>`);
 document.querySelectorAll('[data-map]').forEach(b=>b.onclick=async()=>{const m=MAPS.find(x=>x.id===b.dataset.map);
  if(!itemUnlocked(m)){if(m.lock==='ad'){if(!(await Y.rewarded('map_unlock')))return;}else{if(S.coins<m.lock){toast(t('Не хватает монет'));return;}addCoins(-m.lock);}S.unlocked[m.id]=true;GameStats.send('map_unlocked',{map:m.id,via:m.lock==='ad'?'ad':'coins'});}
  closeModal();GameStats.send('sandbox_map_selected',{map:m.id});S.map=m.id;mapId=m.id;decals=[];save();SbM.onMap(m.id);});
 $('#mc').onclick=closeModal;
}

/* ============ история: карта глав, выбор героя ============ */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const TYPE_ICON={run:IC('upg_speed'),puzzle:IC('puzzle'),arena:IC('fight')};
function startStoryFromMenu(){
 const hero=ROSTER.story[S.hero]&&heroOwned('story',S.hero)?S.hero:'ogurets';
 S.hero=hero;save();
 // v=395: первый вход — сразу обучающая глава; когда обучение пройдено, «История» открывает меню глав (текущая глава подсвечена)
 if(tutDone()&&storyOpen()>0){openStoryMap();return;}
 startStory(!tutDone()?0:clamp(S.story.open||0,0,STORY.length-1),hero);
}
// v=449: летопись мира — вступление и хроника открытых актов
function openLore(){
 const acts=ACTS.map((a,ai)=>{const open=STORY.find(c=>c.act===ai).i<=storyOpen();
  return `<h4 class="lore-act ${open?'':'lock'}">${actName(a)}</h4><p class="lore-p ${open?'':'lock'}">${open?loreText(LORE.acts[ai]):t('Эта страница летописи ещё не написана: пройди предыдущий акт.')}</p>`;}).join('');
 modal(`<h3>📜 ${t('Летопись огорода')}</h3><div class="lore-body"><p class="lore-p">${loreText(LORE.prologue)}</p><p class="lore-p">${loreText(LORE.prologue2)}</p>${acts}</div><button class="btn" id="loreBack">${t('Назад')}</button>`,{wide:true,x:openStoryMap});
 $('#loreBack').onclick=openStoryMap;fitMobileModal();
}
function openStoryMap(){
 const acts=ACTS.map((act,ai)=>{const ch=STORY.filter(c=>c.act===ai);const open=ch[0].i<=storyOpen();
  const got=ch.reduce((a,c)=>a+(S.story.stars[c.i]||0),0);
  return `<div class="acth ${open?'':'lock'}"><img class="actimg" src="assets/maps/act_${ai+1}${open?'_open':''}.jpg?v=${ASSET_V}" onerror="this.onerror=null;this.src='assets/maps/act_${ai+1}.jpg?v=${ASSET_V}'" alt=""></div><div class="act-plate ${open?'':'lock'}"><div class="act-bar"><b class="act-name">${actName(act)}</b><em class="act-stars">${IC('star_full')} ${got}/${ch.length*3}</em></div><p class="act-lore ${open?'':'lock'}">${open?loreText(LORE.acts[ai]):t('Пройди предыдущий акт, чтобы узнать, что было дальше.')}</p></div><div class="lv">${ch.map(c=>{const i=c.i,lock=i>storyOpen(),st=S.story.stars[i]||0,boss=c.obj==='boss';
   return `<div class="lvc ${lock?'lock':''} ${boss?'boss':''} ${i===storyOpen()&&!S.dev?'next':''} ${c.mods?.includes('night')?'night-level':''}" data-l="${i}"><img class="chimg" src="assets/ui/ch/ch_${String(c.img||i+1).padStart(2,'0')}.jpg?v=${ASSET_V}" alt="" loading="lazy"><i class="ty">${boss?IC('crown'):TYPE_ICON[c.type]}</i>${c.mods?.includes('night')?`<i class="night-badge" title="${t('Ночной уровень')}">☾</i>`:''}<b>${lock?'🔒':i+1}</b><small>${chName(c)}</small>${STARS(st)}</div>`;}).join('')}</div>`;}).join('');
 modal(`<h3>📖 ${t('Грядочная война')}</h3><div class="map-head"><p class="map-tag">${t('Кактус-аномалия варит «Озверин», и овощи дичают. Останови его!')}</p><div class="legend map-legend"><span>🏃 ${t('забег')}</span><span>🧩 ${t('головоломка')}</span><span>⚔️ ${t('бой')}</span><span>👑 ${t('босс')}</span></div><button class="btn sm lore-btn" id="scLore">📜 ${t('Летопись')}</button></div>${acts}<button class="btn" id="sc">${t('Закрыть')}</button>`,{wide:true,x:closeModal});
 document.querySelectorAll('[data-l]').forEach(e=>e.onclick=()=>{const i=+e.dataset.l;if(i>storyOpen()){toast(t('Сначала пройди предыдущие главы'));return;}
  // в головоломках герой не нужен
  if(STORY[i].type==='puzzle'){closeModal();startStory(i,S.hero||'ogurets');return;}
  pickHero('story',id=>startStory(i,id),t('Глава {0}',i+1),chName(STORY[i]),i);});
 $('#sc').onclick=closeModal;
 if($('#scLore'))$('#scLore').onclick=openLore;
 // прокручиваем к текущей главе
 setTimeout(()=>{const n=document.querySelector('.lvc.next');if(n)n.scrollIntoView({block:'center'});},30);
}
// Story speech shares the live level with action-based lessons.
const StoryDialogue={
 lines:[],index:0,elapsed:0,scene:null,done:null,active:false,advanceRequested:false,
 clear(){this.active=false;this.lines=[];this.done=null;$('#storySpeech')?.remove();document.body.classList.remove('story-speaking');},
 start(lines,done){
  this.clear();if(!lines?.length){done?.();return;}
  this.lines=lines;this.index=0;this.elapsed=0;this.scene=Run.def;this.done=done;this.active=true;this.draw();
 },
 draw(){
  const [who,ru,en]=this.lines[this.index],text=LANG==='en'&&en?en:ru;
  let el=$('#storySpeech');if(!el){el=document.createElement('div');el.id='storySpeech';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.append(el);}
  el.innerHTML=`<img class="speech-portrait" src="assets/ui/portrait_${who}.png?v=${ASSET_V}" alt="${npcName(who)}"><div class="speech-bubble"><b>${npcName(who)}</b><p></p></div>`;
  el.querySelector('p').textContent=text;
  // v=396: реплики героя и союзников — слева, врагов — справа (портрет смотрит к центру)
  el.classList.toggle('foe',!(ROSTER[Run.kind==='arcade'?'arcade':'story'][who]||who===Run.heroId));
  // v=396: крестика у реплики нет (по просьбе) — реплика уходит сама по таймеру
  // реплика держится меньше (2026-11-10): раньше 3,6–7,8 с, теперь 2,2–4,8 с в зависимости от длины
  this.duration=clamp(1100+text.length*30,2200,4800);this.elapsed=0;this.advanceRequested=false;
  document.body.classList.add('story-speaking');this.layout();requestAnimationFrame(()=>this.layout());requestAnimationFrame(()=>this.layout());
 },
 layout(){const el=$('#storySpeech');if(el)document.body.style.setProperty('--story-bottom',(el.getBoundingClientRect().bottom+10)+'px');},
 finish(){const done=this.done;this.clear();done?.();},
 tutorialStep(){if(this.active)this.advanceRequested=true;},
 tick(dt){
  if(!this.active)return;
  if(screen!=='play'||this.scene!==Run.def){this.clear();return;}
  if(paused||$('#modal').classList.contains('on')||document.hidden)return;
  this.elapsed+=dt;
  if(this.elapsed<this.duration&&!(this.advanceRequested&&this.elapsed>=1600))return;
  if(++this.index<this.lines.length)this.draw();
  else this.finish();
 }
};
function showDialog(lines,done,title){StoryDialogue.start(lines,done);}
function heroCardStats(mode,id){const wid=heroData(mode,id).weapon,st=heroStats(mode,id),w=WEAPONS[wid];return `${IC('upg_hp')} ${st.hp} · ${IC('upg_dmg')} ×${st.dmgMul} · ${IC('upg_speed')} ${st.speed} · ${iconHtml(wid,w.e)} ${t(w.n)}`;}
// карточка героя/оружия как на референсе: крупная картинка, табличка с именем, кнопка снизу
const POR=id=>`<img class="por" src="assets/ui/portrait_${id}.png?v=${ASSET_V}" alt="">`;
const priceBtn=(lock,attr)=>lock==='ad'?`<button class="btn ad sm" ${attr}>🎬 ${t('Открыть')}</button>`:`<button class="btn y sm" ${attr} ${S.coins<lock?'disabled':''}>🪙 ${lock}</button>`;
const card=(cls,pic,name,sub,btn,attr)=>`<div class="hcard ${cls}" ${attr||''}><div class="hpic">${pic}</div><div class="hname">${name}</div>${sub?`<div class="hsub">${sub}</div>`:''}${btn}</div>`;
function pickHero(mode,cb,title,sub,idx){heroScreen(mode,{play:cb,title,sub,boost:{kind:mode,idx},back:mode==='story'?openStoryMap:null});}
function bindUnlock(after){
 document.querySelectorAll('[data-unh]').forEach(b=>b.onclick=async e=>{e.stopPropagation();const [mode,id]=b.dataset.unh.split(':'),h=ROSTER[mode][id],newWeapon=!weaponOwned(h.weapon);
  if(h.lock==='ad'){if(!(await Y.rewarded('hero_unlock')))return;}else{if(S.coins<h.lock)return;addCoins(-h.lock);}
  heroData(mode,id).own=true;S.weapons[h.weapon]=true;save();GameStats.send('hero_unlocked',{hero:id,hero_mode:mode,via:h.lock==='ad'?'ad':'coins',price:h.lock==='ad'?0:h.lock});Snd.unlock();Snd.voice('v_joy');toast(t('{0} в команде!',NPC[id].e+' '+npcName(id)));after('hero');if(newWeapon)weaponUnlockFx(h.weapon,$(`.hx-w[data-hw="${h.weapon}"]`));});
 document.querySelectorAll('[data-unw]').forEach(b=>b.onclick=async e=>{e.stopPropagation();const id=b.dataset.unw,w=WEAPONS[id];if(b.disabled||weaponOwned(id))return;b.disabled=true;
  // v=396: не хватает монет (или реклама недоступна) — замок подпрыгивает и увеличивается: оружие пока закрыто
  const deny=()=>{const l=b.querySelector('.hx-lock');b.classList.remove('lk-deny');void b.offsetWidth;b.classList.add('lk-deny');if(l){l.classList.remove('pop');void l.offsetWidth;l.classList.add('pop');}Snd.pop&&Snd.pop();if(w.lock!=='ad')toast(t('Не хватает монет'));};
  try{if(w.lock==='ad'){if(!Y.canReward()){deny();return;}if(!(await Y.rewarded('weapon_unlock')))return;}else{if(S.coins<w.lock){deny();return;}addCoins(-w.lock);}
   S.weapons[id]=true;save();GameStats.send('weapon_unlocked',{weapon:id,via:w.lock==='ad'?'ad':'coins',price:w.lock==='ad'?0:w.lock});Snd.unlock();toast(t('Куплено: {0}',w.e+' '+t(w.n)));after('weapon',id);
  }finally{if(b.isConnected)b.disabled=false;}});
}

/* ============ аркада: лобби с таблицей рекордов ============ */
let lobbyTab=null;
const fmtDate=d=>d?d.slice(8,10)+'.'+d.slice(5,7):'';
const medal=i=>['🥇','🥈','🥉'][i]||(i+1);
// вход в аркаду такой же, как в главу истории: окно героя с кнопкой «Играть»; таблица рекордов открывается отдельно
function startArcadeFromMenu(){
 const hero=ROSTER.arcade[S.ahero]&&heroOwned('arcade',S.ahero)?S.ahero:'perets';
 S.ahero=hero;save();startArcade(hero);
}
function openArcadeLobby(fresh){
 if(!heroOwned('arcade',S.ahero))S.ahero='perets';
 heroScreen('arcade',{title:t('Аркада'),sub:t('Бесконечные уровни. Чем дальше — тем опаснее!'),play:id=>startArcade(id),fresh,boost:{kind:'arcade',idx:0},
  extra:`<div class="hx-rec"><span>${t('Твой рекорд')}: <b>${S.arcadeBest}</b> ${t('ур.')}</span><button class="btn sm" id="hxRec">${t('Рекорды')}</button></div>`,
  bind:()=>{$('#hxRec').onclick=openArcadeRecords;},
  back:()=>{if(screen==='menu')buildMenu();else showMenu();}});
}
function openArcadeRecords(back){
 if(typeof back!=='function')back=null;
 if(!Y.hasTop())lobbyTab='mine';
 if(!lobbyTab)lobbyTab=Y.online()?'world':'mine';
 const runs=S.arcade.runs||[];
 const mine=runs.length?`<table>${runs.map((r,i)=>`<tr><td class="pl">${medal(i)}</td><td>${NPC[r.hero]?NPC[r.hero].e+' '+npcName(r.hero):'—'}</td><td><b>${r.lvl}</b> ${t('ур.')}</td><td>🪙 ${r.coins}</td><td class="dt">${fmtDate(r.date)}</td></tr>`).join('')}</table>`:`<div class="empty">${t('Пока нет забегов — самое время начать!')}</div>`;
 modal(`<h3>${t('Рекорды')}</h3>
 <div class="tabs ctr">${Y.hasTop()?`<button class="${lobbyTab==='world'?'on':''}" data-lt="world">🌐 ${t('Таблица рекордов')}</button>`:''}<button class="${lobbyTab==='mine'?'on':''}" data-lt="mine">📜 ${t('Мои забеги')}</button></div>
 <div class="rec-note">${t('Рекорды считаются только в режиме «Аркада»')}</div>
 <div class="rec" id="rec">${lobbyTab==='mine'?mine:`<div class="empty">${t('Загрузка...')}</div>`}</div>
 <div class="besth">${t('Твой рекорд')}: <b>${S.arcadeBest}</b> ${t('ур.')}</div>
 <button class="btn" id="aBack">${t('Назад')}</button>`,{wide:true});
 document.querySelectorAll('[data-lt]').forEach(b=>b.onclick=()=>{lobbyTab=b.dataset.lt;openArcadeRecords(back);});
 $('#aBack').onclick=back||(()=>openArcadeLobby(false));
 if(lobbyTab==='world')loadWorldTable();
}
async function loadWorldTable(){
 const r=await Y.top('arcade');const el=$('#rec');if(!el||lobbyTab!=='world')return;
 // v526: таблица приходит после открытия окна — окно выросло, подгоняем его под экран заново, иначе низ рамки обрезался
 if(!r||!r.entries.length){el.innerHTML=`<div class="empty">${t(Y.topEmptyText())}</div>`;fitMobileModal();return;}
 let rows=r.entries.map(e=>`<tr class="${e.me?'me':''}"><td class="pl">${medal(e.rank-1)}</td><td class="nm">${esc(e.name)}${e.me?' ('+t('ты')+')':''}</td><td><b>${e.score}</b> ${t('ур.')}</td></tr>`).join('');
 if(!r.userRank)rows+=`<tr><td colspan="3" class="empty">${t('Пройди хотя бы один уровень, чтобы попасть в таблицу')}</td></tr>`;
 el.innerHTML=emo(`<table>${rows}</table>`);fitMobileModal();
}

/* ============ герои: один экран — листаешь героев, одна кнопка «Улучшить», оружие рядом иконок ============ */
// opts: {play(id) — кнопка «Играть» (выбор героя перед главой), title, sub, back() — куда «Назад»}
const heroIdx={story:0,arcade:0};
// эффект прокачки поверх только что перерисованного окна: вспышка за героем, кольца, надпись с новым уровнем, подсветка делений и характеристик
function hxLevelFx(lv){
 const p=$('.hx-pic');if(!p)return;
 p.classList.add('pop');
 // на пару секунд герой радуется: спрайт с той же позой и другим лицом
 const por=p.querySelector('.por');if(por&&por.src){const was=por.src;por.src=was.replace(/portrait_(\w+)\.png/,'portrait_$1_happy.png');clearTimeout(hxLevelFx.t);hxLevelFx.t=setTimeout(()=>{const q=$('.hx-pic .por');if(q&&/_happy\.png/.test(q.src))q.src=q.src.replace('_happy.png','.png');},1900);}
 const pips=document.querySelectorAll('.hx-pips i.f');if(pips.length)pips[pips.length-1].classList.add('new');
 const st=$('.hx-st');if(st)st.classList.add('pop');
 const lvl=$('.hx-lvl span');if(lvl)lvl.classList.add('pop');
 if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;

 const fx=document.createElement('div');fx.className='hx-fx';
 fx.innerHTML=`<i class="flash"></i><i class="ring"></i><i class="ring r2"></i><b>${t('Ур.')} ${lv}</b>`;
 p.appendChild(fx);setTimeout(()=>fx.remove(),1400);
}
// эффект открытия оружия на его плитке: толчок, лучи, вспышка и кольца
function weaponUnlockFx(id,el){
 unlockFx(el);const w=WEAPONS[id];if(!w)return;
 document.querySelectorAll('.weapon-reveal').forEach(n=>n.remove());
 const n=document.createElement('div');n.className='weapon-reveal';
 n.innerHTML=`<img class="reveal-rays" src="assets/ui/ui_rays.png?v=${ASSET_V}" alt=""><div class="reveal-card"><b>${t('Новое оружие!')}</b><img class="reveal-weapon" src="${weaponIconSrc(id)}" alt=""><strong>${t(w.n)}</strong></div>`;
 document.body.append(n);setTimeout(()=>n.remove(),1700);
}
function unlockFx(el){
 if(!el)return;
 el.classList.add('fxon');setTimeout(()=>el.classList.remove('fxon'),1200);
 if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 const fx=document.createElement('div');fx.className='hx-fx tile';
 fx.innerHTML=`<i class="rays"></i><i class="flash"></i><i class="ring"></i><i class="ring r2"></i>`;
 el.appendChild(fx);setTimeout(()=>fx.remove(),1200);
}
// сила оружия для порядка плиток: урон за выстрел со всей дробью; у взрывного — наибольший урон в центре взрыва (формула из explode)
const wpPower=w=>w.dmg?w.dmg*(w.pellets||1):90*w.power/.06;
// v=433: сила оружия для порядка плиток (по возрастанию): урон за удар/выстрел с дробью, взрыв — урон в центре;
// скорострельное (калаш) — урон в секунду ×0,75, огнемёт с поджогом — 55. Равные — дешёвое раньше
const wpRank=w=>w.type==='flame'?55:w.dmg&&w.cd<=10?w.dmg*60/w.cd*.75:wpPower(w);
const wpGroup=w=>w.type==='melee'?0:w.type==='projectile'||w.type==='throw'?1:2;  // ближний бой, метательное, огнестрел
const wpOrder=ids=>ids.slice().sort((a,b)=>wpGroup(WEAPONS[a])-wpGroup(WEAPONS[b])||wpRank(WEAPONS[a])-wpRank(WEAPONS[b])||(WEAPONS[a].lock==='ad'?1e4:+WEAPONS[a].lock||0)-(WEAPONS[b].lock==='ad'?1e4:+WEAPONS[b].lock||0));
function wpShort(w){const p=[];if(w.type==='flame')return t('струя огня · поджигает');if(w.dmg)p.push(t('урон')+' '+(w.pellets>1?w.dmg+'×'+w.pellets:w.dmg));else p.push(t('взрыв')+' '+w.radius);return p.join(' · ');}
// Мобильное окно вписывается в экран через CSS zoom в обе стороны: большое уменьшается, маленькое увеличивается,
// чтобы кнопки были под палец (docs/UI_RULES.md: область нажатия от 44 px). Окно не занимает весь экран: по ширине
// до 92% в портрете и 62–84% боком, по высоте до 82% / 92%. Мельче MOB_MODAL_MIN не сжимаем — тогда окно прокручивается.
const MOB_MODAL_MIN=.74,MOB_MODAL_MAX=1.9;
// v=436 (v=438): надпись на кнопке окна телефона не помещается в одну строку — уменьшаем шрифт этой кнопки (не мельче 9 px).
// Меряем сам текст со значками (Range), а не scrollWidth: подложка .btn::after выступает за кнопку и давала ложное «не влезает»
function fitBtnLabels(box){
 if(!document.body.classList.contains('is-mobile'))return;
 const need=b=>{const r=document.createRange();r.selectNodeContents(b);const cs=getComputedStyle(b),room=b.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);return r.getBoundingClientRect().width/(parseFloat(getComputedStyle(box).zoom)||1)>room+1;};
 for(const b of box.querySelectorAll('.btn')){
  if(!b.offsetWidth)continue;b.style.removeProperty('font-size');let fs=parseFloat(getComputedStyle(b).fontSize),n=0;
  while(need(b)&&fs>9&&n++<20){fs-=.5;b.style.setProperty('font-size',fs+'px','important');}  // important: мобильные правила задают размер с !important
 }
}
function fitMobileModal(){
 const box=$('#modal.on .box');if(!box)return;
 fitBtnLabels(box);
 if(!document.body.classList.contains('is-mobile')){
  if(!box.classList.contains('hxbox')){box.style.zoom='';box.style.maxHeight='';box.style.overflow='';
   // компьютер, небольшое окно браузера: окно, которое не влезло по высоте (настройки, задания), ужимается целиком,
   // а не прокручивается с кнопкой под краем; карта глав по-прежнему листается
   if(!box.querySelector('.lv')&&box.scrollHeight>box.clientHeight+4){
    box.style.animation='none';box.style.maxHeight='none';const h=box.getBoundingClientRect().height,z=Math.max(.7,Math.min(1,innerHeight*.94/h));
    box.style.zoom=z.toFixed(3);if(h*z>innerHeight*.96){box.style.maxHeight=Math.floor(innerHeight*.94/z)+'px';box.style.overflow='auto';}
   }
  }
  return;
 }
 if(box.querySelector('.lv')){box.style.zoom='';return;}
 const W=innerWidth,H=innerHeight,p=H>W,wide=box.classList.contains('wide')||box.classList.contains('hxbox')||box.classList.contains('missions-box')||!!box.querySelector('.setrow,.shop');
 const maxW=p?Math.min(W*.92,620):Math.min(W*(wide?.84:.62),wide?820:600),maxH=H*(p?.82:.92);
 box.style.animation='none';box.style.zoom='1';box.style.setProperty('max-height','none','important');box.style.setProperty('overflow','hidden','important');
 let r=box.getBoundingClientRect();if(!(r.width>0&&r.height>0))return;
 let z=clamp(Math.min(maxW/r.width,maxH/r.height),MOB_MODAL_MIN,MOB_MODAL_MAX);
 box.style.zoom=z.toFixed(3);
 // ширина окна может зависеть от экрана (vw), поэтому после масштаба сверяемся ещё раз и только уменьшаем
 for(let i=0;i<3;i++){r=box.getBoundingClientRect();const k=Math.min(maxW/r.width,maxH/r.height);if(k>=.995||z<=MOB_MODAL_MIN)break;z=Math.max(MOB_MODAL_MIN,z*k*.99);box.style.zoom=z.toFixed(3);}
 r=box.getBoundingClientRect();
 if(r.height>H*.96){box.style.setProperty('max-height',Math.floor(H*.94/z)+'px','important');box.style.setProperty('overflow','auto','important');}
}
const heroWsScroll={key:'',x:0};
function fitHeroPanel(){
 const box=$('#modal .hxbox');if(!box)return;
 if(document.body.classList.contains('is-mobile')){fitMobileModal();return;}
 if(innerHeight>innerWidth){
  box.style.animation='';box.style.zoom='';box.style.width='';box.style.maxWidth='';box.style.maxHeight='';box.style.overflow='';
  return;
 }
 box.style.animation='none';box.style.zoom='1';box.style.maxHeight='none';box.style.overflow='hidden';
 const wide=innerWidth>=1100&&innerHeight>=600;
 box.style.width=Math.min(wide?860:760,innerWidth-28)+'px';box.style.maxWidth='none';
 const maxH=Math.min(innerHeight-24,innerHeight*.94);
 let scale=1;
 for(let i=0;i<6;i++){
  const height=box.getBoundingClientRect().height;if(height<=maxH)break;
  scale*=Math.min(.98,maxH/height);box.style.zoom=String(scale);
 }
}
addEventListener('resize',()=>requestAnimationFrame(()=>{fitHeroPanel();fitMobileModal();}));
function heroScreen(mode,opts){
 mode=mode==='arcade'?'arcade':'story';opts=opts||{};
 const ids=Object.keys(ROSTER[mode]),selKey=mode==='arcade'?'ahero':'hero';
 if(opts.fresh!==false&&ids.includes(S[selKey]))heroIdx[mode]=ids.indexOf(S[selKey]);
 const reopen=()=>heroScreen(mode,Object.assign({},opts,{fresh:false,redraw:true}));
 const id=ids[heroIdx[mode]],h=ROSTER[mode][id],own=heroOwned(mode,id),u=heroData(mode,id),max=UPG_MAX[mode],lv=u.lv,isMax=lv>=max,cost=lvCost(lv,mode);
 const st=heroStats(mode,id),k=UPG_STEP[mode];
 const boost=opts.retryBoost||opts.boost,boostTaken=boost&&(Run.boost&&Run.boost.kind===boost.kind&&Run.boost.idx===boost.idx||Run.activeBoost&&Run.activeBoost.kind===boost.kind&&Run.activeBoost.idx===boost.idx);
 // случайный вид буста для этого уровня (выбирается один раз на уровень)
 const offerFor=(kind,idx)=>{const o=Run.boostOffer;if(o&&o.kind===kind&&o.idx===idx)return o;return Run.boostOffer={kind,idx,type:pick(Object.keys(BOOSTS))};};
 const bOffer=boost?offerFor(boost.kind,boost.idx):null,bLabel=o=>`${IC(BOOSTS[o.type].ic)} ${t(BOOSTS[o.type].txt)}`;
 const boostButton=boost&&Y.canReward()?`<button class="btn ${boostTaken?'g':'ad'}" id="hxBoost" ${boostTaken?'disabled':''} title="${t('Временный буст на уровень')}">${boostTaken?'':'🎬 '}${bLabel(bOffer)}</button>`:'';
 // открыт посреди уровня (портрет героя): вместо «+150 монет» за рекламу — +50 временного здоровья живому герою на этот уровень
 const live=screen==='play'&&Run.state==='play'&&Run.hero&&!Run.hero.dead&&!Run.hero.removed&&Run.kind===mode&&Run.heroId===id&&!opts.play&&!opts.coach&&!boost&&Y.canReward(),liveTaken=live&&!!(levelBoost()||boostActive()),lOffer=live?offerFor(Run.kind,Run.idx):null;
 // действующий временный буст — плашкой под кнопкой «Улучшить»
 const actB=(boostTaken?(Run.boost||Run.activeBoost):null)||(screen==='play'&&Run.kind===mode&&Run.heroId===id?levelBoost():null);
 const boostBadge=actB?`<div class="hx-boost">⏳ ${t('Временный буст на уровень')}: ${bLabel(actB)}</div>`:'';
 const gain=[Math.round(h.hp*k.hp),(h.dmg*k.dmg).toFixed(1),(h.spd*k.spd).toFixed(1)];
 const stat=(ic,v,g)=>`<span><img src="assets/ui/icon_upg_${ic}.png?v=${ASSET_V}" alt="">${v}${own&&!isMax?`<b>+${g}</b>`:''}</span>`;
 const wid=u.weapon,weps=wpOrder(Object.keys(WEAPONS));  // v=433: одним рядом по возрастанию силы
 // v=486: пробное оружие за рекламу видно в окне героя как надетое и временное; можно переключаться между ним и своим
 const tq=own&&Run.trial&&Run.trial.kind===mode&&Run.heroId===id&&Run.trial.idx>=(Run.idx||0)?Run.trial:null,tw=tq?tq.w:null;
 const lwH=own&&screen==='play'&&Run.kind===mode&&Run.heroId===id&&Run.hero&&!Run.hero.dead&&Run.hero.lootW&&Run.hero.weapon===Run.hero.lootW.w?Run.hero:null,lw=lwH?lwH.lootW.w:null;  // v497: оружие из ящика
 const eq=lw||(tw&&!tq.off?tw:wid);
 const tile=w=>{const W=WEAPONS[w],tmp=w===lw||w===tw&&!weaponOwned(w),ow=weaponOwned(w)||tmp;
  return `<button class="hx-w ${own&&eq===w?'on':''} ${ow?'':'lk'} ${tmp?'tmp':''}" ${ow?`data-hw="${w}"`:(W.lock==='ad'?`data-unw="${w}"`:`data-unw="${w}"`)} title="${t(W.n)}">${iconHtml(w,W.e)}${tmp?`<i class="hx-tmp">⏳</i>`:''}${ow?'':`<img class="hx-lock" src="assets/ui/icon_lock.png?v=${ASSET_V}" alt=""><i class="hx-pr ${W.lock==='ad'?'ad':''}">${W.lock==='ad'?'AD':W.lock}</i>`}</button>`;};
 const main=own
  ?(isMax?`<div class="hx-max">★ ${t('Максимальный уровень')}</div>`:`<button class="btn y hx-up" id="hxUp" ${S.coins<cost?'disabled':''}><span>${t('Улучшить')}</span><b>${cost}</b></button>`)
  :(h.lock==='ad'?`<button class="btn ad hx-up" data-unh="${mode}:${id}">🎬 <span>${t('Открыть героя')}</span></button>`:`<button class="btn y hx-up" data-unh="${mode}:${id}" ${S.coins<h.lock?'disabled':''}>${IC('coin')}<span>${t('Открыть героя')}</span><b>${h.lock}</b></button>`);
 modal(`<h3>${opts.title||t('Герои')}</h3>${opts.sub?`<p class="hx-sub">${opts.sub}</p>`:''}${opts.extra||''}
 <div class="hx">
  <div class="hx-l">
   <div class="hx-pw"><div class="hx-pic ${own?'':'lock'}">${POR(id)}${own?'':`<img class="hx-plock" src="assets/ui/icon_lock.png?v=${ASSET_V}" alt="">`}</div>
   <button class="hx-arr l" id="hxPrev" aria-label="◀">◀</button><button class="hx-arr r" id="hxNext" aria-label="▶">▶</button></div>
   <div class="hx-dots">${ids.map((x,i)=>`<i class="${i===heroIdx[mode]?'on':''} ${heroOwned(mode,x)?'':'lk'}" data-hi="${i}"></i>`).join('')}</div>
   <div class="hx-wp ${own?'':'off'}"><img src="${weaponIconSrc(wid)}" alt=""></div>
  </div>
  <div class="hx-r">
   <div class="hx-name">${npcName(id)}</div>
   <div class="hx-role"><b>${t(h.role)}</b> · ${t(h.desc)}</div>
   <div class="hx-lvl"><span>${t('Ур.')} ${lv}</span><span class="hx-pips">${Array.from({length:max},(_,i)=>`<i class="${i<lv?'f':''}"></i>`).join('')}</span></div>
   <div class="hx-st">${stat('hp',st.hp,gain[0])}${stat('dmg','×'+(+st.dmgMul).toFixed(1),gain[1])}${stat('speed',(+st.speed).toFixed(1),gain[2])}</div>
   ${main}${boostBadge}
  </div>
 </div>
 <!-- оружие — на всю ширину окна под героем (2026-11-10): крупные плитки, видно, что покупаешь -->
 <div class="hx-wfull"><div class="hx-wl">${t('Оружие')}: <b>${t(WEAPONS[eq].n)}</b>${eq===lw?' ⏳ ×'+lwH.lootW.left:eq===tw&&!weaponOwned(tw)?' ⏳':''} <small>${wpShort(WEAPONS[eq])}</small></div>
 <div class="hx-wsw"><div class="hx-ws ${own?'':'off'}">${weps.map(tile).join('')}</div></div></div>
 <div class="row2"><button class="btn" id="hxBack">${t('Назад')}</button>${boostButton}${opts.play?`<button class="btn g" id="hxGo" ${own?'':'disabled'}>▶ ${t('Играть')}</button>`:opts.retryBoost?'':live?`<button class="btn ${liveTaken?'g':'ad'}" id="hxLive" ${liveTaken?'disabled':''} title="${t('Временный буст на уровень')}">${liveTaken?'':'🎬 '}${bLabel(lOffer)}</button>`:`<button class="btn ad" id="hxAd">🎬 +${Econ.adCoins()} 🪙</button>`}</div>`,{wide:true,noClose:opts.noClose,x:()=>$('#hxBack').click()});
 $('#modal .box').classList.add('hxbox');
 // счётчик монет в окне героя (v=396): видно, на что хватает
 $('.hx-l').insertAdjacentHTML('afterbegin',`<div class="coins hx-coins">${IC('coin')}<span class="cv">${S.dev?'∞':S.coins}</span></div>`);  // по центру над портретом
 const preview=$('.hx-pic .por');if(preview)preview.style.scale=String(.86+.12*clamp(lv/max,0,1));
 if(opts.bind)opts.bind();
 if(opts.redraw)$('#modal .box').style.animation='none'; // перерисовка содержимого — окно не «выпрыгивает» заново
 const go=d=>{if(opts.coach)return;heroIdx[mode]=(heroIdx[mode]+d+ids.length)%ids.length;Snd.pop();reopen();};
 $('#hxPrev').onclick=()=>go(-1);$('#hxNext').onclick=()=>go(1);
 document.querySelectorAll('[data-hi]').forEach(b=>b.onclick=()=>{heroIdx[mode]=+b.dataset.hi;Snd.pop();reopen();});
 // свайп по портрету — тоже листает
 const pic=$('.hx-l');let sx=null;pic.addEventListener('dragstart',e=>e.preventDefault());pic.addEventListener('pointerdown',e=>sx=e.clientX);pic.addEventListener('pointerup',e=>{if(sx!==null&&Math.abs(e.clientX-sx)>40)go(e.clientX<sx?1:-1);sx=null;});
 if(opts.guideUpgrade===id&&u.lv===0&&$('#hxUp'))$('#hxUp').classList.add('tut-hl');
 if($('#hxUp')&&!$('#hxUp').disabled)$('#hxUp').classList.add('upgrade-ready');
 if($('#hxUp'))$('#hxUp').onclick=()=>{if(S.coins<cost||u.lv>=max)return;addCoins(-cost);u.lv++;HeroEvolution.pending.add(mode+':'+id);if(opts.coach)UpgradeCoach.upgraded(id);S.tut['firstUpgrade_'+mode]=1;Missions.record('upgrade');save();GameStats.send('upgrade_purchased',{hero:id,upgrade_level:u.lv,cost});Snd.unlock();Snd.voice('v_lvlup');reopen();hxLevelFx(u.lv);};
 document.querySelectorAll('[data-hw]').forEach(b=>b.onclick=()=>{if(!own)return;const pick=b.dataset.hw;
  if(lw){if(pick===lw){Snd.pop();return;}const hh=lwH;hh.lootW=null;const nw=tq&&pick===tw?tw:pick;hh.weapon=nw;hh.ammoW=null;hh.reload=0;hh.atkCd=0;hh.charge=0;hh.swing=0;Run.gunUi=undefined;  // сменили — оружие из ящика пропадает
   if(!weaponOwned(pick)&&!(tq&&pick===tw)){reopen();return;}}
  if(tq){tq.off=pick!==tw;const h=Run.hero;if(screen==='play'&&h&&!h.dead&&h.isPlayer){const nw=pick===tw?tw:(pick);if(h.weapon!==nw){h.weapon=nw;h.ammoW=null;h.reload=0;h.atkCd=0;h.charge=0;h.swing=0;Run.gunUi=undefined;}}
   if(pick===tw&&!weaponOwned(tw)){Snd.pop();reopen();return;}}
  u.weapon=pick;GameStats.send('weapon_equipped',{weapon:b.dataset.hw,hero:id,hero_mode:mode});if(opts.coach)UpgradeCoach.equipped(b.dataset.hw);save();Snd.pop();reopen();$('.hx-wp').classList.add('pop');});
 // обучение покупке биты: плитка пульсирует, над ней подсказка
 if(!opts.coach&&batTutWanted()){const tb=$('.hx-w[data-unw="bat"]');if(tb){tb.classList.add('tutbat');tb.insertAdjacentHTML('beforeend',`<span class="hx-tutb">${t('Купи биту!')}</span>`);}}
 // купленное оружие сразу в руках у выбранного героя (2026-11-09: раньше его надо было ещё «взять»)
 bindUnlock((what,wp)=>{if(what==='hero'){S[selKey]=id;save();}if(what==='weapon'&&own){u.weapon=wp;save();}if(what==='weapon'&&opts.coach)UpgradeCoach.unlocked(wp);reopen();if(what==='weapon')weaponUnlockFx(wp,$(`.hx-w[data-hw="${wp}"]`));});
 $('#hxBack').onclick=()=>{closeModal();if(opts.back)opts.back();else if(screen==='menu')buildMenu();};
 if($('#hxBoost'))$('#hxBoost').onclick=async()=>{const button=$('#hxBoost');button.disabled=true;const granted=await Y.rewarded('temporary_hp');if(!granted){button.disabled=false;return;}Run.boost={...boost,type:bOffer.type};GameStats.send('boost_activated',{boost:bOffer.type,where:'before_level'});Run.statsChanged=true;toast(t('Временный буст на уровень')+': '+t(BOOSTS[bOffer.type].txt));reopen();};
 if($('#hxGo'))$('#hxGo').onclick=()=>{if(!heroOwned(mode,id))return;S[selKey]=id;save();closeModal();opts.play(id);};
 if($('#hxAd'))$('#hxAd').onclick=async()=>{if(await Y.rewarded('upgrade_coins')){rewardCoins(Econ.adCoins());reopen();}};
 if($('#hxLive'))$('#hxLive').onclick=async()=>{const b=$('#hxLive');b.disabled=true;if(!(await Y.rewarded('temporary_hp'))){if(b.isConnected)b.disabled=false;return;}
  const hh=Run.hero,ty=lOffer.type;if(hh&&!hh.dead&&!hh.removed&&!levelBoost()){Run.activeBoost={kind:Run.kind,idx:Run.idx,type:ty};GameStats.send('boost_activated',{boost:ty,where:'in_level'});if(ty==='hp'){hh.hpAdBonus=50;hh.hpMax+=50;hh.hp+=50;}else applyBoost(hh,ty);FX.heal(hh.parts.head.position.x,hh.parts.head.position.y-20);updateHud();}toast(t('Временный буст на уровень')+': '+t(BOOSTS[ty].txt));Snd.reward();reopen();};
 if(opts.coach)UpgradeCoach.decorate();
 fitHeroPanel();requestAnimationFrame(fitHeroPanel);
 // панель оружия на мобильных листается: положение сохраняем между перерисовками окна, при первом показе — к надетому оружию
 {const ws=$('#modal .hx-ws');if(ws){makeScroller(ws);const key=mode+':'+(typeof id!=='undefined'?id:'');
  if(heroWsScroll.key===key)ws.scrollLeft=heroWsScroll.x;else{const on=ws.querySelector('.hx-w.tutbat')||ws.querySelector('.hx-w.on');ws.scrollLeft=on?Math.max(0,on.offsetLeft-ws.clientWidth/2+on.offsetWidth/2):0;heroWsScroll.key=key;heroWsScroll.x=ws.scrollLeft;}
  const more=()=>{const w=ws.closest('.hx-wfull');if(!w)return;w.classList.toggle('more-l',ws.scrollLeft>6);w.classList.toggle('more-r',ws.scrollLeft<ws.scrollWidth-ws.clientWidth-6);};
  ws.addEventListener('scroll',()=>{heroWsScroll.x=ws.scrollLeft;more();},{passive:true});more();requestAnimationFrame(more);}}
}
// старые входы: прокачка из меню/конца уровня/аркады
function openHeroes(tab){heroScreen(tab==='arcade'?'arcade':'story');}

/* ============ магазин и подарок ============ */
function openShop(){
 modal(`<h3>🛒 ${t('Магазин')}</h3><p>${t('Поддержи разработчиков и играй без ограничений')}</p>
 ${Y.shopItems().map(p=>{const owned=(p.id==='noads'&&S.noads)||(p.id==='unlock_all'&&S.all);return `<div class="shop"><span class="e">${p.e}</span><span class="t">${t(p.n)}<small>${t(p.d)}</small></span><button class="btn ${owned?'':'g'} sm" data-buy="${p.id}" ${owned?'disabled':''}>${owned?t('Куплено'):Y.price(p.id)}</button></div>`;}).join('')}
 <div class="shop"><span class="e">🎬</span><span class="t">${t('Бесплатные монеты')}<small>${t('+{0} за просмотр рекламы',Econ.adCoins())}</small></span><button class="btn ad sm" id="freeC">${t('Смотреть')}</button></div>
 <button class="btn" id="sClose">${t('Закрыть')}</button>`);
 document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=async()=>{if(await Y.buy(b.dataset.buy))openShop();});
 $('#freeC').onclick=async()=>{if(await Y.rewarded('shop_coins')){const n=Econ.adCoins();rewardCoins(n);toast('🪙 +'+n);}};
 $('#sClose').onclick=closeModal;
}
// подарок: в левом нижнем углу меню, прыгает и светится, когда готов; открывается раз в 2 часа
const GIFT_CD=2*3600e3;
const giftLeft=()=>Math.max(0,(S.giftAt||0)-Date.now());
const fmtLeft=ms=>{const s=Math.ceil(ms/1000),h=Math.floor(s/3600),m=Math.floor(s/60)%60,x=s%60;return(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0');};
function placeGift(){}
function giftTick(){
 const g=$('#mGift');if(!g)return;const ms=giftLeft();
 g.classList.toggle('ready',!ms);g.querySelector('.gt').textContent=ms?fmtLeft(ms):t('ЗАБРАТЬ');
}
setInterval(()=>{if(screen==='menu')giftTick();if(screen==='menu'||screen==='play')Missions.syncEntry();},1000);
// настройки: звук и язык
function openSettings(){
 modal(`<h3>⚙️ ${t('Настройки')}</h3>
  <div class="setrow"><span>${t('Звук')}</span><button class="btn sm ${S.sound?'g':''}" id="sSnd">${S.sound?'🔊 '+t('Вкл'):'🔇 '+t('Выкл')}</button></div>
  <div class="setrow vol ${S.sound?'':'off'}"><span>${t('Звуки')}</span><input type="range" class="vrange" id="sVol" min="0" max="100" step="5" value="${Math.round(volFx()*100)}"><b class="vv" id="sVolV">${Math.round(volFx()*100)}%</b></div>
  <div class="setrow vol ${S.sound?'':'off'}"><span>${t('Музыка')}</span><input type="range" class="vrange" id="sMus" min="0" max="100" step="5" value="${Math.round(volMusic()*100)}"><b class="vv" id="sMusV">${Math.round(volMusic()*100)}%</b></div>
  ${DEV_OK?`<div class="setrow"><span>${t('Режим разработчика')}<small>${t('Бесконечные монеты, открыты главы и герои')}</small></span><button class="btn sm ${S.dev?'g':''}" id="sDev">${S.dev?'🛠 '+t('Вкл'):t('Выкл')}</button></div>`:''}
  ${DEV_OK&&S.dev?`<div class="setrow"><span>${t('Сбросить прогресс')}<small>${t('Как у нового игрока: монеты, герои, главы')}</small></span><button class="btn sm" id="sReset">${t('Сбросить')}</button></div><div class="setrow"><span>${t('Интро «Финальная битва»')}<small>${t('Только для разработчика: запустить интро без A/B')}</small></span><button class="btn sm" id="sIntro">${t('Запустить')}</button></div>`:''}
  <div class="setrow"><span>${t('Автоприцел')}<small>${t(autoAimOn()?'Оружие само целится во врагов (выстрел кнопкой атаки)':'Прицел мышью, выстрел — левой кнопкой или F')}</small></span><button class="btn sm ${autoAimOn()?'g':''}" id="sAim">${autoAimOn()?t('Вкл'):t('Выкл')}</button></div>
  <div class="setrow"><span>${t('Обучение')}</span><button class="btn sm" id="sTut">${t('Пройти заново')}</button></div>
  <div class="setrow"><span>${t('Язык')}</span><div class="seg"><button class="btn sm ${LANG==='ru'?'y':''}" data-lang="ru">Русский</button><button class="btn sm ${LANG==='en'?'y':''}" data-lang="en">English</button></div></div>
  <button class="btn" id="sOk">${t('Готово')}</button>`);
 $('#sAim').onclick=()=>{S.autoAim=!autoAimOn();save();GameStats.send('settings_changed',{setting:'auto_aim',value:S.autoAim});openSettings();};
 $('#sSnd').onclick=()=>{S.sound=!S.sound;save();GameStats.send('settings_changed',{setting:'sound',value:S.sound});Snd.init();Snd.music(S.sound);openSettings();};
 // ползунки громкости: заливка дорожки до бегунка, проба звука при отпускании, сохранение без лишних записей во время перетаскивания
 const vfill=el=>el.style.setProperty('--p',el.value+'%');
 for(const [id,key,cb] of [['sVol','vol',()=>Snd.coin()],['sMus','mvol',()=>Snd.setMusicVol()]]){
  const el=$('#'+id);vfill(el);
  el.oninput=()=>{S[key]=el.value/100;vfill(el);$('#'+id+'V').textContent=el.value+'%';if(key==='mvol')cb();};
  el.onchange=()=>{Snd.init();cb();save();};
 }
 if($('#sTut'))$('#sTut').onclick=()=>{
  const replayMode=screen==='play'?Run.kind:null,replayHero=Run.heroId;
  if(Tut.on)tutRelease();tutStop();sbTutStop(false);resetCrateTutorial();UpgradeCoach.clear();
  for(const key of ['fight','arcade','sb3','sbplay','crateLoot','crateLootV2','atk','dash','firstMission_story','firstMission_arcade','sbFirstBattle','gearCoach_story','gearCoach_arcade'])delete S.tut[key];
  save();GameStats.send('tutorial_reset',{tutorial:'all'});
  toast(t('Обучение сброшено: история, аркада, песочница и ящики'));
  if(replayMode==='story'){closeModal();startStory(0,replayHero);}
  else if(replayMode==='arcade'){closeModal();startArcade(replayHero);}
 };
 document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{if(b.dataset.lang===LANG)return;GameStats.send('settings_changed',{setting:'language',value:b.dataset.lang});setLang(b.dataset.lang);S.lang=LANG;if(PF.name==='playgama')S.langPg=LANG;save();applyStaticText();buildMenu();openSettings();});
 if($('#sDev'))$('#sDev').onclick=()=>{setDev(!S.dev);buildMenu();openSettings();toast(S.dev?'🛠 '+t('Режим разработчика включён'):t('Режим разработчика выключен'));};
 if($('#sReset'))$('#sReset').onclick=askResetProgress;
 if($('#sIntro'))$('#sIntro').onclick=()=>{closeModal();Intro.start();};  // v535: кнопка разработчика — интро в любой момент (отметка introSeen ставится, на A/B не влияет)
 $('#sOk').onclick=closeModal;
}
// только для разработчика: новое сохранение, язык и звук остаются, режим разработчика выключается, иначе всё осталось бы открыто
function askResetProgress(){
 modal(`<h3>${t('Сбросить прогресс?')}</h3><p>${t('Монеты, герои, оружие и главы вернутся к началу. Отменить это нельзя.')}</p><button class="btn ad" id="rYes">${t('Сбросить')}</button><button class="btn" id="rNo">${t('Отмена')}</button>`);
 $('#rNo').onclick=openSettings;
 $('#rYes').onclick=()=>{clearTimeout(saveT);const{lang,sound}=S;S=DEFAULT_S();S.lang=lang;S.sound=sound;Y.save();location.reload();};
}
// v528: после подарка на первом экране после первого боя открываем ежедневные задания (один раз)
function firstHubNext(){if(!window.__firstHub)return;window.__firstHub=false;setTimeout(()=>{if(screen==='menu'&&!$('#modal').classList.contains('on'))Missions.open();},350);}
function openGift(){
 if(giftLeft()){modal(`<div class="big">⏳</div><h3>${t('Подарок уже получен')}</h3><p>${t('Следующий подарок через {0}',fmtLeft(giftLeft()))}</p><button class="btn ad" id="gAd">🎬 ${t('+{0} монет',Econ.adCoins())}</button><button class="btn" id="gC">${t('Ок')}</button>`);
  $('#gAd').onclick=async()=>{if(await Y.rewarded('gift_coins')){const n=Econ.adCoins();GameStats.send('gift_claimed',{coins:n,via:'ad_extra'});rewardCoins(n);closeModal();}};$('#gC').onclick=()=>{closeModal();firstHubNext();};return;}
 modal(`<div class="big">🎁</div><h3>${t('Подарок')}</h3><p>${t('Новый подарок — каждые 2 часа!')}</p><button class="btn ad" id="g3">🎬 ${t('Забрать ×{0}',Econ.GIFT_AD_MULT)} · ${Econ.gift()*Econ.GIFT_AD_MULT} 🪙</button><button class="btn y" id="g1">${t('Забрать {0} 🪙',Econ.gift())}</button>`);
 const take=n=>{GameStats.send('gift_claimed',{coins:n,via:n>Econ.gift()?'ad':'free'});S.giftAt=Date.now()+GIFT_CD;addCoins(n);giftTick();closeModal();refreshUI();toast(`🪙 +${n}`);firstHubNext();};
 $('#g1').onclick=()=>take(Econ.gift());$('#g3').onclick=async()=>{if(await Y.rewarded('gift_multiplier')){Snd.reward();take(Econ.gift()*Econ.GIFT_AD_MULT);}};
}

/* ============ управление героем ============ */
document.querySelectorAll('#controls [data-k]').forEach(b=>{
 const k=b.dataset.k;
 const down=e=>{e.preventDefault();Snd.init();if(k==='jump'&&!keys.jump)queueJump();if(k==='dash'&&!keys.dash)queueDash();if(k==='attack'&&!keys.attack)queueAttackPress();keys[k]=true;b.classList.add('on');try{b.setPointerCapture(e.pointerId);}catch(_){}};
 const up=()=>{keys[k]=false;b.classList.remove('on');};
 b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
});
// джойстик на телефоне: влево-вправо — ходьба, вверх — прыжок
{const joy=$('#joy');let id=null;
 const setJoy=(nx,ny)=>{joy.style.setProperty('--jx',(nx*joy.offsetWidth*.3)+'px');joy.style.setProperty('--jy',(ny*joy.offsetWidth*.3)+'px');keys.left=nx<-.18;keys.right=nx>.18;if(document.body.classList.contains('is-mobile'))return;/* v493: на мобильных прыжок только кнопкой, джойстик задаёт направление */const jump=ny<(keys.jump?-.22:-.42);if(jump&&!keys.jump)queueJump();keys.jump=jump;};
 const mv=e=>{if(e.pointerId!==id)return;const r=joy.getBoundingClientRect(),R=r.width*.42;let dx=(e.clientX-r.left-r.width/2)/R,dy=(e.clientY-r.top-r.height/2)/R;const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m;}setJoy(dx,dy);};
 const end=e=>{if(e.pointerId!==id)return;id=null;joy.classList.remove('on');setJoy(0,0);};
 joy.addEventListener('pointerdown',e=>{e.preventDefault();Snd.init();id=e.pointerId;joy.classList.add('on');try{joy.setPointerCapture(id);}catch(_){}mv(e);});
 joy.addEventListener('pointermove',mv);joy.addEventListener('pointerup',end);joy.addEventListener('pointercancel',end);joy.addEventListener('lostpointercapture',end);}
// v492: на мобильных рывок стоит рядом с джойстиком, на его месте справа — кнопка прыжка; на ПК всё как было
{const placeDash=()=>{const d=$('#touchDash'),to=document.body.classList.contains('is-mobile')?$('#controls .cl'):$('#controls .cr');if(d&&to&&d.parentNode!==to){if(to.classList.contains('cr'))to.insertBefore(d,to.querySelector('.atk'));else to.appendChild(d);}};
 placeDash();new MutationObserver(placeDash).observe(document.body,{attributes:true,attributeFilter:['class']});}
const keyBtn=(k,on)=>document.querySelectorAll(`#controls [data-k=${k}]`).forEach(b=>b.classList.toggle('on',on));
const KEYMAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',KeyQ:'dash',KeyL:'dash',KeyF:'attack',KeyJ:'attack',KeyK:'attack',Enter:'attack'};
addEventListener('keydown',e=>{if($('#modal').classList.contains('on'))return;if(screen!=='play'&&!(screen==='sandbox'&&SbPlay.ent))return;const k=KEYMAP[e.code];if(k){if(k==='jump'&&!keys.jump)queueJump();if(k==='dash'&&!keys.dash)queueDash();if(k==='attack'&&!keys.attack)queueAttackPress();keys[k]=true;keyBtn(k,true);e.preventDefault();}if(e.code==='Escape'&&PF.escPause)openPause();if(e.code==='KeyR'&&Run.type==='puzzle')restartLevel();});
addEventListener('keyup',e=>{const k=KEYMAP[e.code];if(k){keys[k]=false;keyBtn(k,false);}});
function resetGameInput(){
 Object.keys(keys).forEach(k=>keys[k]=false);
 document.querySelectorAll('#controls .on').forEach(b=>b.classList.remove('on'));
 const h=screen==='sandbox'?SbPlay.ent:Run.hero;
 if(h){h.jumpBuf=0;h.dashBuf=0;h.jumpWasHeld=false;h.atkQ=0;h.throwQueued=false;}
}
addEventListener('blur',resetGameInput);
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetGameInput();});
let dashCoachHero=null;
function updateDashUI(){
 const h=screen==='sandbox'?SbPlay.ent:screen==='play'&&Run.state==='play'?Run.hero:null,b=$('#touchDash');
 const left=h?Math.max(0,(h.dashReadyAt||0)-frame):0;
 const cooling=left>0;
 b.classList.toggle('cooldown',cooling);b.setAttribute('aria-disabled',String(cooling));
 const text=cooling?(left/60).toFixed(1):'»',glyph=b.querySelector('.dash-glyph');if(glyph&&glyph.textContent!==text)glyph.textContent=text;
 if(h&&!h.dead&&!S.tut.dash&&dashCoachHero!==h&&!Intro.active&&!Tut.on&&!SbTut.on&&!$('#tutor').classList.contains('on')&&!paused){
  dashCoachHero=h;showTip(t(fineInput()?'Рывок — нажми Q. Направление задаётся движением, перезарядка — 1,2 с':'Нажми » для рывка. Направление задаётся джойстиком, перезарядка — 1,2 с'));
  GameStats.send('tutorial_step',{tutorial:'dash',step:'hint'});
 }
}
$('#hpico').onclick=()=>UpgradeCoach.open();
$('#hpico').addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();e.stopPropagation();UpgradeCoach.open();}});
$('#pMissions').onclick=()=>{if(screen==='play'&&!$('#modal').classList.contains('on'))Missions.open();};
$('#pPause').onclick=openPause;
$('#pHint').onclick=openHint;
$('#pRestart').onclick=()=>restartLevel();
async function restartLevel(){if(Run.state==='done'||!canRestartLevel())return;closeModal();recordRun();Run.nextRetry='restart';Run.kind==='arcade'?startArcade(Run.heroId):startStory(Run.idx,Run.heroId);}
function openPause(){
 if(Run.state!=='play'||$('#modal').classList.contains('on'))return;
 modal(`<h3>⏸ ${t('Пауза')}</h3><p>${Run.kind==='story'?t('Глава {0}',Run.idx+1)+': '+chName(Run.def):Run.def.n}</p><button class="btn g" id="pr">▶ ${t('Продолжить')}</button>${Run.type!=='puzzle'&&Run.hero&&!Run.hero.dead?`<button class="btn y" id="pUpg">🦸 ${t('Прокачка героя')}</button>`:''}${Run.kind==='story'?`<button class="btn" id="pChapters">${t('Карта глав')}</button>`:''}${canRestartLevel()?`<button class="btn" id="pa">↻ ${t('Заново')}</button>`:''}<button class="btn" id="pm">🏠 ${t('В меню')}</button>`);
 GameStats.send('pause_action',{action:'opened'});
 let busy=false;const act=a=>{GameStats.send('pause_action',{action:a});};
 const once=fn=>async()=>{if(busy)return;busy=true;document.querySelectorAll('#modal .btn').forEach(x=>x.disabled=true);await fn();};
 $('#pr').onclick=()=>{act('resume');closeModal();};
 if($('#pChapters'))$('#pChapters').onclick=()=>{act('chapters');openStoryMap();};
 // v=396: прокачка героя прямо из паузы (окно героя; после закрытия статы применяются к герою на уровне)
 if($('#pUpg'))$('#pUpg').onclick=()=>{act('upgrade');closeModal();UpgradeCoach.open();};
 // окно не закрываем до конца рекламы: иначе игра на мгновение снимается с паузы, пока реклама грузится
 if($('#pa'))$('#pa').onclick=once(async()=>{act('restart');recordRun();closeModal();Run.nextRetry='restart';Run.kind==='arcade'?startArcade(Run.heroId):startStory(Run.idx,Run.heroId);});
 $('#pm').onclick=once(async()=>{act('menu');recordRun();await Y.interstitial('pause_menu');closeModal();showMenu();});
}
// надписи в разметке (кнопки-подсказки, загрузка) — на текущем языке
function applyStaticText(){
 document.documentElement.lang=LANG;document.title=t('Битва овощей');
 $('#pMissions').innerHTML=IC('book');
 const tt={hpico:'Прокачка',touchDash:'Рывок',touchJump:'Прыжок',bPlay:'Играть за героя',bHome:'Меню',sbMissionBar:'Задания песочницы',bFight:'Бой',bPause:'Пауза',bSlow:'Замедление',bGrav:'Гравитация',bUndo:'Отменить',bClear:'Очистить',bMaps:'Карта',pRestart:'Заново'};
 for(const id in tt){const e=$('#'+id);if(e)e.title=t(tt[id]);}
 {const pc=matchMedia('(hover:hover) and (pointer:fine)').matches;$('#rotate').classList.toggle('pc',pc);$('#rotTouch').textContent=t(pc?'Разверни экран':'Поверни экран');}$('#rotLogo').alt=t('Битва овощей');
 if(LANG==='en')$('#rotLogo').src=`assets/ui/logo_text_en.png?v=${ASSET_V}`;
 const ll=$('#loadLogo');if(ll&&LANG==='en'){ll.src=`assets/ui/logo_text_en.png?v=${ASSET_V}`;ll.alt=t('Битва овощей');$('#loadText').textContent=t('Загрузка...');}
}

/* ============ старт ============ */
let wasPortrait=innerHeight>innerWidth;
const portraitNow=()=>matchMedia('(max-aspect-ratio:999/1000)').matches;
function onViewport(){
 if(!(innerWidth>0&&innerHeight>0))return;   // окно скрыто: это не поворот экрана
 // в вертикальном положении игра закрыта экраном #rotate и стоит на паузе; раскладку не трогаем, чтобы при обратном повороте уровень не собирался заново
 pauseAll(false,'portrait');
 const f0=FLOOR,p=innerHeight>innerWidth,turned=p!==wasPortrait;wasPortrait=p;
 resize();StoryDialogue.layout();positionPuzzleTip();if(screen==='sandbox'){setFloorInset(SbPlay.ent?Math.min(110,innerHeight*.2):$('#bottom').offsetHeight);shiftWorld(FLOOR-f0);}showCoins();
 if(screen==='play'&&!turned)shiftLevel(FLOOR-f0);  // v515
 if(screen==='play')updateCam(true);
 if(!turned)return;
 if(screen==='menu')attractScene();
 else if(screen==='play'&&Run.state==='play')rebuildLevel();
}
(async function boot(){
 if(PF.initFirst)await Y.init(); // Playgama: Bridge должен запуститься раньше загрузки ресурсов
 setLang(detectLang());applyStaticText(); // сразу: экран поворота виден уже во время загрузки
 resize();makeBounds();addEventListener('resize',onViewport);
 // portrait mode active
 Snd.load();
 await Promise.race([loadSprites(),new Promise(r=>setTimeout(r,30000))]);
 if(!PF.initFirst)await Y.init();
 S=migrate(await Y.load());
 saveReady=true;
 await Y.restore();
 if(S.dev&&!DEV_OK)setDev(false);
 if(S.dev)dropDevPicks(); // оружие больше не открыто режимом: снимаем то, что не куплено
 setLang(detectLang());
 applyStaticText();
 document.querySelectorAll('#top .ib,#top .coins,#hud .ib,#hud .coins').forEach(e=>e.innerHTML=emo(e.innerHTML));
 showMenu();
 // v527: новый игрок сразу попадает в геймплей (обучающий бой), минуя меню; вернувшиеся, тесты и режимы съёмки видят обычное меню
 try{
  const q=new URLSearchParams(location.search);
  if(!(S.story.open||S.arcadeBest)&&!navigator.webdriver&&!['noauto','shot','video','analytics'].some(k=>q.has(k))&&!q.has('menu')){
   window.__autoStart=true;if(Intro.wanted())Intro.start();else startStoryFromMenu();
  }
 }catch(e){window.__autoStart=false;console.warn('autostart',e);}
 $('#loading').remove();
 dispatchEvent(new Event('veggie-menu'));  // v=480: догружаем фоны уровней (sprites.js, sprRest)
 // v=491: картинки окна «История» (обложки актов, рамка, мини-карты) тянем в кэш заранее — окно открывается без ожидания
 setTimeout(()=>{const u=[];for(let a=1;a<=ACTS.length;a++)u.push(`assets/maps/act_${a}.jpg?v=${ASSET_V}`,`assets/maps/act_${a}_open.jpg?v=${ASSET_V}`);
  u.push('assets/ui/ui_act_frame.png?v=20');if(typeof MAPS!=='undefined')for(const m of MAPS)if(m&&m.id)u.push(`assets/maps/ui_map_${m.id}.png?v=${ASSET_V}`);
  for(const s of u){const im=new Image();im.decoding='async';im.src=s;}},400);
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(showCoins); // ширина числа зависит от загруженного шрифта
 requestAnimationFrame(loop);
 // game_ready — только когда видимый интерфейс (логотип, кнопки, HUD) реально загружен и отрисован
 {const vis=[...document.querySelectorAll('img')].filter(i=>i.offsetParent&&!i.complete);
  await Promise.race([Promise.all(vis.map(i=>new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});}))),new Promise(r=>setTimeout(r,4000))]);
  try{await Promise.race([document.fonts?document.fonts.ready:0,new Promise(r=>setTimeout(r,1500))]);}catch(e){}
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}
 Y.ready();if(!paused)Y.start();
 GameStats.loaded();
 // режим скриншотов для страницы игры (tools/shots.js)
 if(PF.devAllowed&&new URLSearchParams(location.search).get('shot'))await new Promise(r=>{const sc=document.createElement('script');sc.src='tools/shots.js';sc.onload=r;sc.onerror=r;document.head.appendChild(sc);});
 if(window.SHOT)window.SHOT();
 // режим записи видео (tools/video.js): только локально, в сборку площадки не входит
 if(PF.devAllowed&&new URLSearchParams(location.search).get('video'))await new Promise(r=>{const sc=document.createElement('script');sc.src='tools/video.js?v=2';sc.onload=r;sc.onerror=r;document.head.appendChild(sc);});
 if(window.VIDEO)window.VIDEO();
})();
