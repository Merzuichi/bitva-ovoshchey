'use strict';
/* ============ «Вверх к флагу» — уровни-восхождения (v=396) ============ */
// Идём вперёд, но пройти можно только поднимаясь: лестница из платформ уходит вправо и вверх, флаг — на самой верхней.
// С пола до флага не добраться; сорвался с большой высоты — падение опасно (как в «Подъёме к флажку»).
// В каждом акте по 3 таких главы (и ещё одна глава-спасение, RESCUE_CH): вставляются после 3-й, 5-й и 7-й главы акта (перед боссом). Старые главы
// перенумеровываются, сохранённый прогресс переносится (STORY_OLD2NEW, migrate в sdk.js), подсказки головоломок — тоже.
const ASCENT_CH=[
 [['Вверх по грядкам','Up the Garden Beds'],['Лестница из ящиков','Crate Staircase'],['Флаг на холме','Flag on the Hill']],
 [['Полки теплицы','Greenhouse Shelves'],['Под стеклянной крышей','Under the Glass Roof'],['Горшки до потолка','Pots to the Ceiling']],
 [['Крыши прилавков','Stall Rooftops'],['Пирамида из ящиков','Crate Pyramid'],['Над рыночной толпой','Above the Market Crowd']],
 [['Вверх по полкам','Up the Pantry Shelves'],['Гора кастрюль','Mountain of Pots'],['К вытяжке','Up to the Hood']],
 [['Трубы завода','Factory Pipes'],['Мостки над чанами','Catwalks over the Vats'],['На самую крышу','Up to the Roof']],
];
// ещё по одной главе на акт — «спасение»: подвешенные друзья с головоломками (качается над кольями, две верёвки, враг под другом)
const RESCUE_CH=[['Друзья на верёвках','Friends on Ropes'],['Висячие сады','Hanging Gardens'],['Спасение над кольями','Rescue over the Stakes'],['Кухонные качели','Kitchen Swings'],['Канатная фабрика','The Rope Factory']];
const RESCUE_VAR=[['plain','two','guard'],['two','pit','guard'],['pit','guard','two','pit'],['guard','pit','two','pit'],['pit','two','guard','pit']];
// сюжет новых глав (v=396): реплики [кто, по-русски, по-английски]
const ASCENT_INTRO=[
 [null,
  [['pomidor','Ящики до самого неба! Кто их так сложил?','Crates up to the sky! Who stacked them like that?'],['ogurets','Неважно. Флаг наверху — значит, нам туда.','Never mind. The flag is up top, so that is where we go.']],
  [['morkov','Главарь сбежал на холм и поднял там свой флаг!','The Chief ran up the hill and raised his flag there!'],['ogurets','Заберу его флаг — пусть знает, чья это грядка.','I will take his flag — let him know whose garden this is.']]],
 [[['baklazhan','Кактус спрятал ключ от лаборатории на верхней полке.','Cactus hid the lab key on the top shelf.'],['ogurets','Значит, лезем по полкам. Только горшки не разбей!','Then we climb the shelves. Just do not break the pots!']],
  [['kukuruza','Ха! Под самой крышей тебя никто не спасёт!','Ha! Nobody will save you up under the roof!'],['ogurets','А меня и не надо спасать.','I do not need saving.']],
  [['pomidor','Отсюда видно всю теплицу! И лабораторию Кактуса!','You can see the whole greenhouse from here! And the Cactus lab!'],['ogurets','Ещё выше — и мы над ним.','A bit higher and we are above him.']]],
 [[['morkov','Внизу толпа озверевших. Пойдём поверху, по навесам!','A raging crowd below. Let us go over the awnings!'],['ogurets','Главное — не провалиться в помидоры.','Just do not fall into the tomatoes.']],
  [['perets','Это моя пирамида! Сюда нельзя!','This is my pyramid! Keep out!'],['ogurets','Поздно, я уже на полпути.','Too late, I am halfway up.']],
  [['baklazhan','Фургон Кактуса за рынком! Сверху его будет видно.','The Cactus van is behind the market! We can spot it from above.'],['ogurets','Тогда наверх — и в погоню.','Then up we go — and after him.']]],
 [[['pomidor','Кухонные полки — как горы. Только пахнут супом.','Kitchen shelves are like mountains. Only they smell of soup.'],['ogurets','Лишь бы не в кастрюлю.','As long as it is not into the pot.']],
  [['arbuz','Кастрюли — моя крепость! Ты не заберёшься!','The pots are my fortress! You will not climb up!'],['ogurets','Спорим?','Wanna bet?']],
  [['morkov','Кактус ушёл через вытяжку на крышу!','Cactus escaped through the hood to the roof!'],['ogurets','Значит, и мы — через вытяжку.','Then so do we — through the hood.']]],
 [[['baklazhan','По трубам течёт Озверин. Горячих не касайся!','Rage-juice flows in these pipes. Do not touch the hot ones!'],['ogurets','Прыгаю только по холодным. Наверное.','I only jump on the cold ones. Probably.']],
  [['kapusta','Упадёшь в чан — станешь как мы!','Fall into a vat and you will become like us!'],['ogurets','Я лучше останусь огурцом.','I would rather stay a cucumber.']],
  [['pomidor','Кактус на крыше! Последний подъём!','Cactus is on the roof! One last climb!'],['ogurets','Держись, Кактус. Я иду.','Hold on, Cactus. I am coming.']]],
];
const RESCUE_INTRO=[
 [['morkov','Перчики подвесили наших друзей на верёвках!','The peppers hung our friends on ropes!'],['ogurets','Перережу верёвки — и все вместе зададим им жару.','I will cut the ropes, and together we will give them a beating.']],
 [['pomidor','Висячие сады? Скорее висячие друзья!','Hanging gardens? More like hanging friends!'],['ogurets','Режем аккуратно — внизу колья.','Cut carefully — there are stakes below.']],
 [['baklazhan','Нас развесили прямо над кольями! Помоги!','They hung us right above the stakes! Help!'],['ogurets','Дождусь, когда качнёшься над землёй, — и режу.','I will wait until you swing over the ground, then cut.']],
 [['morkov','Нас раскачивают, как поварёшки!','They are swinging us like ladles!'],['ogurets','Сейчас всех сниму, а потом устроим им салат.','I will get everyone down, then we make salad of them.']],
 [['pomidor','Канатная фабрика! Тут верёвки повсюду.','A rope factory! Ropes everywhere.'],['ogurets','Значит, и резать буду повсюду.','Then I will be cutting everywhere.']],
];
const STORY_OLD2NEW={};
function rescue(a,ch){
 const near=ch.filter(q=>q.type==='run'&&!q.chase),src=near[near.length-1]||near[0];const [ru,en]=RESCUE_CH[a];
 return {act:a,n:ru,en,type:'run',img:(ch.find(q=>q.type==='puzzle')||ch[0]).img,rescueNo:a,seed:700+a*7,len:3600+a*350,lvl:src?src.lvl:.1+a*.15,
  feat:{coins:3,crates:1,fight:1+(a>1?1:0),pit:1,steps:1,...(a>0?{pend:1}:{})},hangcaps:RESCUE_VAR[a].map((_,j)=>['pomidor','morkov','baklazhan'][(a+j)%3]),hangVar:RESCUE_VAR[a],finale:5,/* спасённые друзья + эпичная битва с 5 врагами у флага */
  foes:src?.foes||['perets','kukuruza'],weap:src?.weap||['fists','bat'],map:ACTS[a].map,allies:[],intro:RESCUE_INTRO[a]};
}
function ascent(a,slot,img){
 const [ru,en]=ASCENT_CH[a][slot];
 return {act:a,n:ru,en,type:'arena',obj:'climb',img,ascentNo:a*3+slot,
  climb:{ascent:true,steps:10+a+slot*2,spikes:a>0||slot>0,seed:500+a*10+slot},
  enemies:[],allies:[],props:[],mods:[],rain:0,waves:false,ambush:[],map:ACTS[a].map,
  intro:a===0&&slot===0?[['ogurets','Флаг на самом верху! Забираюсь всё выше — с платформы на платформу.','The flag is way up top! I will climb higher and higher, platform to platform.']]:ASCENT_INTRO[a][slot]};
}
// акт I (правки пользователя): «Подъём к флажку» — 4-я глава (обучение прыжкам), отдельная обучающая глава «Беги от волны!»;
// «Спасение у ворот» остаётся погоней, но уже без обучения
function act0(ch,climbImg){
 const [k0,k1,k2,k3,k4,k5,k6,k7]=ch,chaseImg=k6.img;
 if(k6.chase){k6.chase.tutor=false;k6.chase.speed=2.3;}
 const wave={act:0,n:'Беги от волны!',en:'Outrun the Wave!',type:'run',img:chaseImg,waveTutorial:true,seed:777,len:2600,lvl:.06,
  feat:{pit:1,coins:4,steps:1,crates:1},foes:['perets'],weap:['fists'],chase:{speed:2,tutor:true},allies:[],mods:[],map:'garden',
  intro:[['ogurets','Кактус разлил Озверин — за мной катится волна! Бегу и не останавливаюсь!','Cactus spilled the Rage-juice — a wave is rolling after me! I run and do not stop!']]};
 return [k0,k1,k2,k4,k3,ascent(0,0,climbImg),k5,rescue(0,ch),wave,ascent(0,1,climbImg),k6,ascent(0,2,climbImg),k7];
}
(()=>{
 const old=STORY.slice();old.forEach((c,i)=>{c.oi=i;c.img=i+1;});
 const out=[];
 for(let a=0;a<ACTS.length;a++){
  const ch=old.filter(c=>c.act===a),climbImg=(old.find(c=>c.act===a&&c.climb)||ch[0]).img;
  if(a===0){out.push(...act0(ch,climbImg));continue;}
  ch.forEach((c,k)=>{
   out.push(c);
   if(k===5)out.push(rescue(a,ch));
   const slot=[2,4,6].indexOf(k);if(slot>=0)out.push(ascent(a,slot,climbImg));
  });
 }
 STORY.length=0;out.forEach((c,i)=>{c.i=i;STORY.push(c);if(c.oi!==undefined)STORY_OLD2NEW[c.oi]=i;});
 // подсказки головоломок были по старым номерам
 const h={...HINTS};for(const k in HINTS)delete HINTS[k];for(const k in h)HINTS[STORY_OLD2NEW[k]]=h[k];
 // обучение прыжкам по платформам (подсказка и стрелка) — только в одной главе: ночной «Подъём к флажку» (правка пользователя);
 // больше нигде его нет. На восхождениях вместо обучения — стрелка вверх, когда герой дошёл по полу до угла
 const tutor=STORY.find(c=>c.climb&&!c.climb.ascent&&(c.mods||[]).includes('night'))||STORY.find(c=>c.climb&&!c.climb.ascent);
 if(tutor)tutor.climbTutor=true;
})();
// перенос сохранения со старой нумерации глав (40 глав) на новую
function remapStoryProgress(st){
 if(!st||st.ord===2)return st;
 const stars={};for(const k in st.stars||{})if(STORY_OLD2NEW[k]!==undefined)stars[STORY_OLD2NEW[k]]=st.stars[k];
 const oldLen=Object.keys(STORY_OLD2NEW).length,open=st.open>=oldLen?STORY.length:STORY_OLD2NEW[st.open]??0;
 return {...st,stars,open,ord:2};
}
