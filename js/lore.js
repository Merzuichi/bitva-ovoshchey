'use strict';
/* ============ Лор «Грядочной войны» и 14 глав в каждом акте (v=449) ============
   После ascent.js в актах было 13/12/12/12/12 глав. Здесь в каждый акт добавляются сюжетные главы, чтобы глав стало
   ровно 14 (два ряда по 7 на карте). Новые главы собраны из уже проверенных уровней своего акта (новое зерно генерации,
   своё название и реплики) и несут повороты сюжета: сторожка Садовника, его дневник, «витаминки» на рынке,
   рецепт Озверина, архив завода. Номера глав сдвигаются — прогресс переносится (STORY_ORD2TO3, sdk.js), подсказки головоломок тоже. */
const LORE={
 prologue:['На краю огорода «Солнечная Грядка» стоит старая теплица. Когда-то в ней работал Садовник: выводил удобрения, от которых овощи росли крупнее и крепче. Его любимым опытом был маленький кактус — тринадцатый в ряду. Садовник поливал его не водой, а пробными смесями и держал в тени, чтобы проверить, как удобрения действуют без солнца.',
  'At the edge of the Sunny Bed garden stands an old greenhouse. A Gardener once worked there, brewing fertilizers that made veggies grow bigger and stronger. His favourite experiment was a little cactus, the thirteenth in the row. The Gardener fed it trial mixtures instead of water and kept it in the shade to see how fertilizer works without sunlight.'],
 prologue2:['Однажды Садовник ушёл и не вернулся. Кактус остался один в тёмной теплице и сам дописал последнюю формулу — «Озверин». Капля Озверина делает овощ сильным и злым, а от второй он уже не может без зелья. Кактус решил, что если одичает весь огород, никто больше не скажет, что колючим не место на солнечной грядке. Простой огурец из третьего ряда первым заметил беду.',
  'One day the Gardener left and never came back. Alone in the dark greenhouse, the Cactus finished the last formula himself: Rage-juice. One drop makes a veggie strong and angry, and after a second one it cannot live without the potion. The Cactus decided that if the whole garden went wild, nobody would ever again say that prickly ones do not belong in the sunny beds. A plain cucumber from the third row was the first to notice the trouble.'],
 acts:[
  ['Перчики первыми попробовали Озверин: Кактус раздал его тем, кто громче всех кричит. Ночами одичавшие топчут грядки и связывают тех, кто не согласен. Огурец собирает друзей — Помидора, Морковку и Баклажана — и идёт по следу пустых склянок.',
   'The peppers were the first to try Rage-juice: Cactus handed it to the loudest shouters. At night the wild ones trample the beds and tie up anyone who disagrees. Cucumber gathers friends, Tomato, Carrot and Eggplant, and follows the trail of empty vials.'],
  ['Теплица — дом Кактуса и сердце его лаборатории. Здесь жарко, душно и пахнет химией. В брошенной сторожке остался дневник Садовника, и в нём правда о том, кем был Кактус до Озверина. Вход сторожат капустные латники и их Король.',
   'The greenhouse is the home of Cactus and the heart of his lab. It is hot, stuffy and smells of chemicals. The Gardener left a diary in the abandoned hut, and it holds the truth about who Cactus was before Rage-juice. Cabbage knights and their King guard the entrance.'],
  ['Кактус везёт бочки на рынок: продавцы разносят Озверин в обёртках «витаминок», и весь огород дичает за один день. Ряды заминированы, прилавки утыканы шипами, а Арбузище стоит на страже склада.',
   'Cactus is shipping barrels to the market: sellers hand out Rage-juice wrapped as "vitamins", and the whole garden can go wild in a single day. The rows are mined, the stalls are covered in spikes, and Big Watermelon guards the warehouse.'],
  ['На кухне стоит главный котёл Кактуса. Пленных он держит в холодильнике и грозит засолить. Здесь же спрятан рецепт: в Озверин уходят колючая вытяжка, темнота и обида — и он теряет силу под солнечным светом.',
   'The kitchen holds Cactus\'s main cauldron. He keeps prisoners in the fridge and threatens to pickle them. The recipe is hidden here too: Rage-juice is made of prickly extract, darkness and resentment, and it loses its power in sunlight.'],
  ['Завод «Озверин» отправляет зелье на сотню огородов. Кактус заперся у последнего котла. Чтобы победить, мало одолеть его в бою: нужно открыть крышу цеха и впустить солнце, которого он никогда не видел.',
   'The Rage-juice factory ships the potion to a hundred gardens. Cactus has locked himself in by the last cauldron. Beating him in a fight is not enough: the hall roof must be opened to let in the sun he has never seen.'],
 ]
};
const STORY_ORD2TO3={};
(()=>{
 const cp=o=>JSON.parse(JSON.stringify(o));
 const byName=(a,n)=>STORY.find(c=>c.act===a&&c.n===n);
 // новая глава из уровня своего акта: свои название, зерно генерации и реплики; без концовки и босса
 const like=(src,o)=>{const c=cp(src);delete c.i;delete c.oi;delete c.outro;delete c.waveTutorial;delete c.climbTutor;delete c.rescueNo;delete c.tip;c.lore=1;return Object.assign(c,o);};
 const ADD=[ // акт: [[вставить перед главой с названием, новая глава], ...]
  [[ 'Босс: Ночной Главарь', like(byName(0,'Прыжки над грядками'),{n:'Сторожка Садовника',en:'The Gardener\'s Hut',seed:61,mods:[],lvl:.14,len:3000,fightN:1,feat:{pit:2,spikes:1,steps:1,coins:3,crates:1,fight:2},foes:['perets','kukuruza'],weap:['fists','bat'],
     intro:[['morkov','Это сторожка старого Садовника. Он ушёл давным-давно, а дверь в теплицу с тех пор заперта изнутри.','This is the old Gardener\'s hut. He left long ago, and the greenhouse door has been locked from the inside ever since.'],
            ['ogurets','А перчики таскают оттуда склянки. Значит, внутри кто-то хозяйничает.','And the peppers keep carrying vials out of there. So someone is in charge inside.']]})]],
  [[ 'Качели над шипами', like(byName(1,'Отбей волны'),{n:'Дневник Садовника',en:'The Gardener\'s Diary',
     intro:[['baklazhan','Смотри, дневник! «Опыт №13: кактус в тени. Без солнца не цветёт — пробую новую смесь…»','Look, a diary! "Experiment No. 13: a cactus in the shade. Will not bloom without sun — trying a new mixture…"'],
            ['ogurets','Кактуса вырастили в темноте на химии. Вот откуда в нём столько злости.','The Cactus was raised in the dark on chemicals. That is where all his anger comes from.']]})],
   [ 'Босс: Капустный Король', like(byName(1,'Дождь из Озверина'),{n:'Королевская оранжерея',en:'The Royal Orangery',seed:59,
     intro:[['kapusta','Король обещал нам по листу короны за каждого пойманного огурца!','The King promised us a leaf of his crown for every cucumber we catch!'],
            ['ogurets','Корону ему пообещал Кактус. А Кактус раздаёт обещания, как Озверин, — всем подряд.','It was Cactus who promised him the crown. And Cactus hands out promises like Rage-juice: to everyone.']]})]],
  [[ 'Спасти продавцов', like(byName(2,'Волны под бомбами'),{n:'Ларёк «Витаминки»',en:'The "Vitamins" Stall',
     intro:[['pomidor','«Витаминки для силы, бесплатно!» Это же Озверин в обёртке!','"Free vitamins for strength!" That is Rage-juice in a wrapper!'],
            ['perets','Бери, огурчик! Одну штучку — и ты такой же сильный, как мы!','Take one, little cucumber! Just one and you will be as strong as us!'],
            ['ogurets','Спасибо, я сильный и без химии. Ларёк закрывается!','No thanks, I am strong without chemicals. This stall is closing!']]})],
   [ 'Босс: Арбузище', like(byName(2,'Погоня за фургоном'),{n:'Склад бочек',en:'The Barrel Warehouse',seed:99,mods:[],
     intro:[['morkov','Здесь Кактус держит бочки перед отправкой. Если склад уцелеет — рынок одичает к утру.','This is where Cactus stores barrels before shipping. If the warehouse survives, the market will go wild by morning.'],
            ['ogurets','Тогда через склад — и к тому, кто его охраняет.','Then through the warehouse — and on to whoever guards it.']]})]],
  [[ 'Ножи и тёрки', like(byName(3,'Столешница'),{n:'Холодильник',en:'The Fridge',seed:113,
     intro:[['ogurets','Холод… На полках банки с надписью «Солёные». Это же пленники!','Cold… The shelves are full of jars labelled "Pickled". Those are prisoners!'],
            ['baklazhan','Кактус хотел засолить всех, кто не пил Озверин. Освободим, кого успеем!','Cactus wanted to pickle everyone who refused Rage-juice. Let us free whoever we can!']]})],
   [ 'Босс: Кактус', like(byName(3,'Отбей волны'),{n:'Рецепт Озверина',en:'The Rage-juice Recipe',
     intro:[['morkov','Нашла рецепт! «Колючая вытяжка, тьма и обида. Хранить без света — на солнце распадается».','I found the recipe! "Prickly extract, darkness and resentment. Keep away from light — breaks down in sunlight."'],
            ['ogurets','Солнце! Вот чего он боится. Если доберёмся до него — у нас будет чем ответить.','Sunlight! That is what he fears. If we reach him, we will have an answer.']]})]],
  [[ 'Ночная смена', like(byName(4,'Ночная смена'),{n:'Архив завода',en:'The Factory Archive',
     intro:[['pomidor','Тут все накладные: Озверин уже отправлен на сто огородов!','Here are all the waybills: Rage-juice has already been shipped to a hundred gardens!'],
            ['ogurets','Значит, остановить нужно не бочки, а сам котёл. Без него зелье выдохнется.','Then it is not the barrels we must stop, but the cauldron itself. Without it the potion will fade.']]})],
   [ 'Финал: Кактус-Аномалия', like(byName(4,'Цех прессов'),{n:'Сердце завода',en:'The Heart of the Factory',seed:167,
     intro:[['baklazhan','Над главным котлом — стеклянная крыша. Её закрасили чёрной краской.','There is a glass roof above the main cauldron. Someone painted it black.'],
            ['ogurets','Пробьёмся наверх, откроем крышу — и Кактус впервые увидит солнце.','We fight our way up, open the roof, and the Cactus will see the sun for the first time.']]})]],
 ];
 const old=STORY.slice();old.forEach((c,i)=>{c.o2=i;});
 const out=[];
 for(let a=0;a<ACTS.length;a++){
  const ch=old.filter(c=>c.act===a);
  for(const c of ch){for(const [before,nc] of ADD[a])if(before===c.n)out.push(nc);out.push(c);}
 }
 STORY.length=0;out.forEach((c,i)=>{c.i=i;STORY.push(c);if(c.o2!==undefined)STORY_ORD2TO3[c.o2]=i;});
 const h={...HINTS};for(const k in HINTS)delete HINTS[k];for(const k in h)if(STORY_ORD2TO3[k]!==undefined)HINTS[STORY_ORD2TO3[k]]=h[k];
 // проверка: в каждом акте ровно 14 глав
 for(let a=0;a<ACTS.length;a++){const n=STORY.filter(c=>c.act===a).length;if(n!==14)console.warn('акт',a+1,'глав',n);}
})();
// перенос прогресса со второй нумерации (61 глава) на третью (70 глав)
function remapStory3(st){
 if(!st||st.ord===3)return st;
 const stars={};for(const k in st.stars||{})if(STORY_ORD2TO3[k]!==undefined)stars[STORY_ORD2TO3[k]]=st.stars[k];
 const n2=Object.keys(STORY_ORD2TO3).length,open=st.open>=n2?STORY.length:STORY_ORD2TO3[st.open]??0;
 return {...st,stars,open,ord:3};
}
const loreText=x=>LANG==='en'?x[1]:x[0];
Object.assign(EN,{'с':'s','Ускорение · 20 с':'Speed boost · 20s','Щит · 15 с':'Shield · 15s','Сломай стену!':'Break the wall!','Стена! Бей её, чтобы сломать, — или победи охрану':'A wall! Hit it to break it — or defeat the guards','Летопись':'Chronicle','Летопись огорода':'Chronicle of the Garden','Пройди предыдущий акт, чтобы узнать, что было дальше.':'Finish the previous act to find out what happened next.','Эта страница летописи ещё не написана: пройди предыдущий акт.':'This page of the chronicle is not written yet: finish the previous act.'});
// новые главы — английские названия для карты
for(const c of STORY)if(c.lore&&c.en)EN[c.n]=c.en;

/* v=456: арены и боссы — платформы, ящики, бочки и ловушки. Раньше часть арен была пустой площадкой (финальный бой — только пол).
   Главы со своей раскладкой (plats уже заданы), защита и восхождения не трогаются. Ловушки — подальше от старта героя (x<0.25). */
(()=>{
 const L=[ // раскладки платформ: x — доля ширины, y — высота над полом
  [{x:.2,y:150,w:210},{x:.8,y:150,w:210},{x:.5,y:250,w:260}],   // боковые площадки и мост в центре
  [{x:.3,y:120,w:180},{x:.5,y:200,w:180},{x:.7,y:280,w:180}],   // лесенка
  [{x:.25,y:140,w:170},{x:.25,y:270,w:150},{x:.75,y:140,w:170},{x:.75,y:270,w:150}], // две башни
  [{x:.5,y:150,w:420},{x:.85,y:260,w:180}],                     // широкий балкон
 ];
 for(const c of STORY){
  if(c.type!=='arena'||c.climb||c.obj==='defend'||c.obj==='climb'||c.firstMinutes||c.i<2)continue;
  if((c.plats||[]).length)continue;
  const a=c.act,k=c.i%L.length;
  c.plats=L[k].map((p,j)=>({...p,item:j===0&&a>=1?'barrel':j===1?'box':undefined}));
  c.hazards=(c.hazards||[]).slice();
  if(a>=1)c.hazards.push({t:'spikes',x:k%2?.62:.42,w:100+a*10});
  // у боссов — только шипы: бой и так тяжёлый (пилы и мины — на обычных аренах)
  if(a>=2&&c.obj!=='boss')c.hazards.push({t:'mine',x:k%2?.88:.7});
  if(a>=3&&c.obj!=='boss')c.hazards.push({t:'saw',x:.55,y:40});
  c.props=(c.props||[]).concat(c.obj==='boss'?[{id:'barrel',x:.35},{id:'box',x:.92}]:[{id:'box',x:.4}]);
 }
})();
// v=456: сложность истории — по доле пройденного пути, а не по номеру главы: таблица CombatBalance рассчитана на 40 глав,
// после добавления глав финал (70-я) стал сильнее задуманного. Теперь финал ≈ 48-я ступень таблицы (на ~20% легче, чем было)
{const orig=CombatBalance.story.bind(CombatBalance),norm=n=>n*48/Math.max(1,STORY.length-1);
 CombatBalance.story=n=>orig(norm(n));
 // боссы усиливались отдельной формулой от сырого номера главы (у финала урон ×2,58 вместо задуманных ×1,74) — тоже по доле пути
 CombatBalance.storyArena=(e,n)=>{const m=norm(n),p=orig(m);return {...e,hp:(e.hp||1)*(e.boss?.82+m*.014:p.hp),dm:(e.dm||1)*(e.boss?.65+m*.028:p.dm)};};}
