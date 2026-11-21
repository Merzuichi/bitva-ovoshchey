'use strict';
/* ============ История «Грядочная война»: 5 актов, 40 глав ============ */
// Кактус-аномалия сбежал из теплицы-лаборатории и варит удобрение «Озверин»: овощи дичают.
// Огурец идёт через Огород, Теплицу, Рынок и Кухню, а в финале — на завод «Озверин», куда Кактус сбежал.
// Типы глав: arena — бой на одном экране (kill / survive / boss), run — длинный уровень с прокруткой
// (ямы, пилы, шипы, мины, клетки с друзьями, ворота, бомбопад, монеты, контрольные точки),
// puzzle — головоломка: режь верёвки пальцем, чтобы спасти пленника и победить врагов.
const ACTS=[
 {n:'Акт I. Огород',en:'Act I. The Garden',map:'garden'},
 {n:'Акт II. Теплица',en:'Act II. The Greenhouse',map:'greenhouse'},
 {n:'Акт III. Рынок',en:'Act III. The Market',map:'market'},
 {n:'Акт IV. Кухня',en:'Act IV. The Kitchen',map:'kitchen'},
 {n:'Акт V. Завод',en:'Act V. The Factory',map:'factory'},
];
const WILD=['perets','kukuruza','kapusta','arbuz','kaktus'];
// реплики: [кто, по-русски, по-английски]
const STORY=[
 // ===================== Акт I. Огород =====================
 // Core mechanics arrive in short, distinct lessons, beginning with one enemy.
 {act:0,n:'Тревога на грядке',en:'Garden Alarm',type:'arena',obj:'kill',enemies:[{k:'perets',w:'fists',x:.75,hp:.5,dm:.35}],tip:'tip_controls',
  intro:[['ogurets','Утро на огороде… Стоп, кто топчет мою грядку?','Morning in the garden… Wait, who is trampling my bed?'],['perets','Озверин! Хочу ещё Озверина! Р-р-р!','Rage-juice! I want more Rage-juice! Grrr!'],['ogurets','Перчик, ты чего? Сначала освою движение и сильный удар.','Pepper, what is wrong with you? First, I will practise moving and charging an attack.']]},
 {act:0,n:'Прыжки над грядками',en:'Above the Garden Beds',type:'run',seed:11,len:2400,lvl:.02,feat:{pit:1,tramp:1,coins:1,crates:1,fight:2},fightN:1,/* v=396: два врага (по одному в двух местах) */foes:['perets'],weap:['fists'],
  tip:'Батут подбросит к верхней платформе. Собирай монеты и активируй флажки контрольных точек.',
  intro:[['ogurets','По верхним платформам быстрее! Батут поможет запрыгнуть повыше.','The upper platforms are a shortcut! A trampoline will launch me higher.'],['ogurets','Соберу монеты для прокачки. Флажок сохранит место при падении.','I will collect upgrade coins. Checkpoint flags save my place if I fall.']]},
 {act:0,n:'Защита у бочки',en:'Defend the Garden',type:'arena',obj:'defend',time:18,guard:'pomidor',foes:['perets'],wpool:['fists'],plats:[{x:.7,y:105,w:180}],props:[{id:'barrel',x:.57},{id:'box',x:.45}],
  enemies:[{k:'kukuruza',w:'pistol',x:.7,y:125,hp:.48,dm:.3,sp:2},{k:'perets',w:'fists',x:.58,hp:.35,dm:.3}],
  tip:'Защищай Помидора 18 секунд. Подойди к стрелку во время перезарядки или взорви бочку у врага.',
  intro:[['pomidor','Защити меня, пока я освобождаюсь! На это нужно 18 секунд.','Protect me while I get free! I need 18 seconds.'],['ogurets','Пока он перезаряжается, подойду ближе. А красная бочка взрывается от удара!','I will move in while he reloads. The red barrel explodes when hit!']]},
 {act:0,n:'Первое спасение',en:'The First Rescue',type:'puzzle',par:1,goal:'save',tip:'tip_cut',
  items:[{t:'zone',x0:340,x1:620},{t:'spikes',x:780,w:150},{t:'host',k:'pomidor',x:480,h:230,ropes:[[480,480]]}],
  intro:[['pomidor','Огурец! Меня привязали. Перережь верёвку — внизу безопасно!','Cucumber! I am tied up. Cut the rope — the ground below is safe!'],['ogurets','Проведу по верёвке. В следующих головоломках сначала проверю, куда упадёт друг.','I will swipe across the rope. In later puzzles, I must check where my friend will land.']]},
 {act:0,n:'Ночной патруль',en:'Night Patrol',type:'run',seed:37,len:2800,lvl:.08,feat:{saw:1,spikes:1,mines:1,steps:1,coins:1,fight:1},foes:['perets'],weap:['fists'],mods:['night'],
  tip:'Ночью следи за светящимися минами и перепрыгивай опасности. Рывок помогает уйти от удара.',
  intro:[['morkov','Стемнело! На тропе пилы, шипы и мины. По платформам безопаснее.','It is dark! Saws, spikes, and mines block the trail. Platforms are safer.'],['ogurets','Держусь света, прыгаю через ловушки и ищу контрольные точки.','I will stay in the light, jump over traps, and look for checkpoints.']]},
 {act:0,n:'Бомба вместо ключа',en:'An Explosive Solution',type:'puzzle',par:2,goal:'both',tip:'tip_bomb',
  items:[{t:'zone',x0:100,x1:300},{t:'host',k:'morkov',x:200,h:230,ropes:[[200,480]]},{t:'bomb',x:690,h:270,ropes:[[690,500]]},{t:'enemy',k:'perets',w:'fists',x:680},{t:'enemy',k:'perets',w:'fists',x:760}],
  intro:[['morkov','Бомба висит прямо над хулиганами! А меня опусти на землю слева.','The bomb hangs right above the bullies! Lower me to the ground on the left.'],['ogurets','Две верёвки, две задачи: убрать врагов взрывом и освободить друга.','Two ropes, two goals: defeat the enemies with an explosion and free my friend.']]},
 {act:0,n:'Спасение у ворот',en:'Rescue at the Gate',type:'run',seed:23,len:3200,lvl:.12,feat:{gate:1,hang:1,rain:1,coins:1,crates:1},cages:['baklazhan'],foes:['perets','kukuruza'],weap:['fists','bat'],mods:['wind'],
  tip:'Освободи связанного союзника. Победи охрану, чтобы открыть ворота; груз на верёвке можно уронить на врага.',
  intro:[['baklazhan','Развяжи меня, и я помогу! Ворота откроются после победы над охраной.','Untie me and I will help! Defeat the guards to open the gate.'],['ogurets','Укроюсь от падающих бомб за ящиками. Груз над врагом тоже можно сбросить.','I will take cover behind crates when bombs fall. I can also drop the hanging weight on an enemy.']]},
 {act:0,n:'Босс: Ночной Главарь',en:'Boss: The Night Chief',type:'arena',obj:'boss',mods:['night'],enemies:[{k:'perets',w:'bat',x:.8,boss:true,hp:2,dm:.72,sp:2.85},{k:'perets',w:'fists',x:.6,hp:.5,dm:.35},{k:'kukuruza',w:'fists',x:.95,hp:.45,dm:.3}],tip:'tip_boss',/* v=396: босс акта I чуть сложнее — больше здоровья и урона, ещё один помощник */
  intro:[['perets','Думаешь, ночью я слабее? Я Главарь всех перчиков!','Think I am weaker at night? I am the Chief of all peppers!'],['ogurets','Уйду от замаха рывком, затем отвечу сильным ударом.','I will dash out of his wind-up, then strike with a charged attack.']],
  outro:[['perets','Ай-ай… Мне дали попробовать Озверин. В теплице… Кактус!','Ouch… They gave me Rage-juice. In the greenhouse… Cactus!'],['ogurets','Значит, идём в теплицу.','Then we go to the greenhouse.']]},
 // ===================== Акт II. Теплица =====================
 {act:1,n:'Стеклянный коридор',mods:['wind'],en:'The Glass Corridor',type:'run',seed:41,len:4900,lvl:.24,feat:{pit:2,spikes:2,fight:3,steps:1,coins:3,hang:1},foes:['kukuruza','perets'],weap:['fists','bat','pistol'],
  tip:'tip_hang',
  intro:[['baklazhan','В теплице жарко и душно. И пахнет… химией.','It is hot and stuffy in the greenhouse. And it smells… like chemicals.'],['ogurets','Кукуруза с пистолетами. Будь осторожен — они перезаряжаются, тогда и бей!','Corn with pistols. Careful — strike while they reload!']]},
 {act:1,n:'Снайпер на стеллаже',en:'Sniper on the Shelf',type:'arena',obj:'kill',plats:[{x:.55,y:105,w:170},{x:.78,y:200,w:230}],enemies:[{k:'kukuruza',w:'pistol',x:.78,y:220},{k:'perets',w:'bat',x:.55}],
  tip:'Запрыгни на стеллаж к стрелку',
  intro:[['kukuruza','Ни шагу дальше! Теплица — владения Хозяина!','Not one more step! The greenhouse belongs to the Master!'],['ogurets','Хозяина? Кукуруза, кто тебя так накрутил?','The Master? Corn, who wound you up like this?'],['kukuruza','Ты увидишь его… если доживёшь!','You will see him… if you survive!']]},
 {act:1,n:'Качели над шипами',en:'Swing over Spikes',type:'puzzle',par:2,goal:'save',tip:'tip_swing',
  items:[{t:'zone',x0:735,x1:945},{t:'spikes',x:430,w:570},{t:'host',k:'morkov',x:480,h:300,ropes:[[330,560],[630,560]]}],
  intro:[['morkov','Меня подвесили над шипами! Только не роняй меня прямо вниз!','They hung me over the spikes! Do not drop me straight down!'],['ogurets','Раскачаю тебя одной верёвкой, а другую перережу в нужный момент.','I will swing you on one rope and cut the other at the right moment.']]},
 {act:1,n:'Дождь из Озверина',en:'Rage-juice Rain',type:'run',seed:53,len:5200,lvl:.3,feat:{rain:2,pit:2,fight:2,coins:3,crates:2},foes:['kukuruza','perets','kapusta'],weap:['fists','bat','pistol'],
  intro:[['baklazhan','С потолка падают капсулы с Озверином — они взрываются!','Rage-juice capsules are falling from the ceiling — they explode!'],['ogurets','Бежим быстро и прячемся за ящиками!','We run fast and hide behind crates!']]},
 {act:1,n:'Капустные стражи',mods:['giant'],en:'Cabbage Guards',type:'arena',obj:'kill',enemies:[{k:'kapusta',w:'hammer',x:.65},{k:'kapusta',w:'fists',x:.82,hp:1.2},{k:'kukuruza',w:'pistol',x:.92}],
  allies:[{k:'baklazhan',w:'bat',x:.2}],
  intro:[['kapusta','Сто одёжек — и все бронированные! Не пройдёшь!','A hundred leaves — all armoured! You shall not pass!'],['baklazhan','Я с тобой, Огурец! Вместе мы их раскатаем!','I am with you, Cucumber! Together we will flatten them!']]},
 {act:1,n:'Бомба на верёвочке',en:'Bomb on a String',type:'puzzle',par:3,goal:'both',tip:'tip_bomb',
  items:[{t:'zone',x0:90,x1:260},{t:'host',k:'pomidor',x:170,h:310,ropes:[[170,560]]},{t:'bomb',x:470,h:380,ropes:[[380,560],[560,560]]},{t:'enemy',k:'kukuruza',w:'pistol',x:700},{t:'enemy',k:'kapusta',w:'fists',x:790}],
  intro:[['pomidor','Опять я на верёвке! А внизу стрелки Кактуса!','On a rope again! And the Cactus gunmen are below!'],['ogurets','Эта бомба взрывается от удара. Надо раскачать её прямо в них.','This bomb explodes on impact. I need to swing it right into them.']]},
 {act:1,n:'Лаборатория Кактуса',en:'The Cactus Lab',type:'run',seed:67,len:6200,lvl:.36,feat:{mines:2,gate:2,msaw:1,pit:2,steps:1,coins:4,fight:1},cages:['pomidor'],foes:['kukuruza','kapusta','perets'],weap:['fists','bat','pistol','hammer'],
  intro:[['ogurets','Колбы, трубки, бочки с черепом… Это и есть лаборатория.','Flasks, tubes, barrels with skulls… This is the lab.'],['baklazhan','Смотри, Помидора снова поймали! Он связан дальше по коридору.','Look, Tomato got caught again! He is tied up down the corridor.']]},
 {act:1,n:'Босс: Капустный Король',en:'Boss: The Cabbage King',type:'arena',obj:'boss',enemies:[{k:'kapusta',w:'hammer',x:.8,boss:true,hp:3.6,dm:1.1,sp:2.4},{k:'kukuruza',w:'pistol',x:.62,hp:.8}],
  intro:[['kapusta','Я Король теплицы! Кактус обещал мне корону из листьев!','I am the King of the greenhouse! Cactus promised me a crown of leaves!'],['ogurets','Корона тебе к лицу. Но дорогу ты нам не закроешь.','The crown suits you. But you will not block our way.']],
  outro:[['kapusta','Ох… Кактус увёз бочки с Озверином на рынок. Хочет опоить всех!','Oh… Cactus took the Rage-juice barrels to the market. He wants to poison everyone!'],['ogurets','На рынок, друзья!','To the market, friends!']]},
 // ===================== Акт III. Рынок =====================
 {act:2,n:'Прилавки с шипами',en:'Spiky Stalls',type:'run',seed:71,len:5200,lvl:.4,feat:{spikeplat:2,spikes:2,steps:1,fight:2,coins:3,pit:1},foes:['kukuruza','perets'],weap:['bat','pistol','sword'],
  intro:[['morkov','Кактус везёт Озверин на рынок, чтобы опоить ВСЕ овощи!','Cactus is bringing Rage-juice to the market to poison ALL veggies!'],['ogurets','Тогда бегом — через прилавки!','Then we run — over the stalls!']]},
 {act:2,n:'Перестрелка у весов',mods:['wind'],en:'Shootout at the Scales',type:'arena',obj:'kill',plats:[{x:.3,y:145,w:170},{x:.72,y:145,w:170}],enemies:[{k:'kukuruza',w:'pistol',x:.72,y:165},{k:'perets',w:'smg',x:.92},{k:'kukuruza',w:'pistol',x:.3,y:165}],
  allies:[{k:'pomidor',w:'pistol',x:.18}],
  intro:[['perets','Рынок наш! Каждый овощ получит порцию Озверина!','The market is ours! Every veggie gets a dose of Rage-juice!'],['pomidor','Только через мой сок! Прикрываю, Огурец!','Over my juice! I am covering you, Cucumber!']]},
 {act:2,n:'Груз над рядами',en:'Cargo over the Rows',type:'puzzle',par:2,goal:'both',
  items:[{t:'zone',x0:800,x1:950},{t:'spikes',x:480,w:560},{t:'plank',x:480,h:280,w:300,ropes:[[330,560,-150],[630,560,150]]},{t:'enemy',k:'perets',w:'bat',x:430,h:300},{t:'enemy',k:'perets',w:'fists',x:540,h:300},{t:'host',k:'baklazhan',x:875,h:320,ropes:[[875,560]]}],
  intro:[['perets','Мы стоим на доске — нас тут не достать! Ха!','We stand on a plank — you cannot reach us! Ha!'],['ogurets','Доска держится на двух верёвках. А под ней — шипы.','The plank hangs on two ropes. And there are spikes below.']]},
 {act:2,n:'Спасти продавцов',en:'Save the Merchants',type:'run',seed:83,len:6400,lvl:.46,feat:{fight:3,gate:1,pit:2,hsaw:1,crates:2,coins:3},cages:['morkov','baklazhan'],foes:['kukuruza','perets','arbuz'],weap:['bat','pistol','sword','fists'],
  intro:[['pomidor','Одичавшие связали Морковку и Баклажана!','The wild ones tied up Carrot and Eggplant!'],['ogurets','Освободим обоих. Без них дальше не пойдём.','We free them both. We do not go on without them.']]},
 {act:2,n:'Минный ряд',mods:['night'],en:'Mine Row',type:'run',seed:97,len:5400,lvl:.5,feat:{mines:3,pit:2,fight:2,tramp:1,coins:3},foes:['kukuruza','perets','arbuz'],weap:['bat','pistol','axe'],
  intro:[['arbuz','Хозяин заминировал ряды. Шаг влево — и ты салат!','The Master mined the rows. One wrong step and you are salad!'],['ogurets','Арбуз… Значит, и тяжёлая артиллерия у Кактуса есть.','Watermelon… So Cactus has heavy artillery too.']]},
 {act:2,n:'Батутный трюк',en:'Trampoline Trick',type:'puzzle',par:2,tip:'tip_tramp',goal:'save',
  items:[{t:'zone',x0:700,x1:920},{t:'spikes',x:600,w:160},{t:'spikes',x:225,w:250},{t:'tramp',x:440,kick:6,a:-.12},{t:'host',k:'morkov',x:290,h:330,ropes:[[140,560],[440,560]]}],
  intro:[['morkov','Меня подвесили над шипами, а до выхода — ещё одна полоса шипов!','They hung me over spikes, and there is another strip of spikes before the exit!'],['ogurets','Внизу батут. Раскачаю тебя и отпущу прямо на него — перелетишь!','There is a trampoline below. I will swing you and drop you right onto it — you will fly over!']]},
 {act:2,n:'Погоня за фургоном',en:'Chasing the Van',type:'run',seed:103,len:7200,lvl:.55,feat:{rain:1,pit:3,hsaw:1,fight:3,gate:1,steps:1,coins:4},foes:['kukuruza','perets','arbuz'],weap:['bat','pistol','smg','axe'],
  intro:[['morkov','Фургон с бочками уезжает к кухне! За ним!','The van with barrels is heading to the kitchen! After it!'],['ogurets','Бежим! Разгон, прыжок — и никакие ямы нас не остановят.','Run! Speed up, jump — no pit will stop us.']]},
 {act:2,n:'Босс: Арбузище',en:'Boss: Big Watermelon',type:'arena',obj:'boss',enemies:[{k:'arbuz',w:'axe',x:.8,boss:true,hp:3.8,dm:1.2,sp:2.3},{k:'perets',w:'pistol',x:.6,hp:.8}],
  intro:[['arbuz','Я — тяжёлая артиллерия Кактуса! Раздавлю!','I am the heavy artillery of Cactus! I will crush you!'],['ogurets','Большой шкаф громко падает.','The bigger they are, the harder they fall.']],
  outro:[['arbuz','Кактус… на кухне. Там его главный котёл с Озверином.','Cactus… is in the kitchen. His main Rage-juice cauldron is there.'],['ogurets','Значит, кухня. Последний рывок!','The kitchen, then. One last push!']]},
 // ===================== Акт IV. Кухня =====================
 {act:3,n:'Столешница',mods:['ice'],en:'The Countertop',type:'run',seed:109,len:5700,lvl:.6,feat:{pit:3,saw:2,crates:2,fight:2,steps:1,coins:3},foes:['arbuz','kukuruza','kapusta'],weap:['bat','pistol','hammer','shotgun'],
  intro:[['ogurets','Кухня… Огромная. И банка с солёными огурцами. Брр.','The kitchen… Huge. And a jar of pickles. Brr.'],['morkov','Не смотри туда! Вперёд, по столешнице!','Do not look there! Forward, across the countertop!']]},
 {act:3,n:'Арбузная гвардия',mods:['ice'],en:'Watermelon Guard',type:'arena',obj:'kill',enemies:[{k:'arbuz',w:'hammer',x:.65},{k:'kapusta',w:'grenade',x:.9},{k:'kukuruza',w:'shotgun',x:.78}],
  allies:[{k:'morkov',w:'sword',x:.2}],
  intro:[['arbuz','Гвардия Кактуса! Никто не пройдёт к котлу!','The Cactus Guard! Nobody gets to the cauldron!'],['morkov','К бою! Я беру того, что с гранатами!','To battle! I will take the one with grenades!']]},
 {act:3,n:'Банка с огурцами',en:'The Pickle Jar',type:'puzzle',par:3,goal:'both',
  items:[{t:'zone',x0:690,x1:950},{t:'spikes',x:405,w:500},{t:'host',k:'pomidor',x:420,h:300,ropes:[[270,560],[570,560]]},{t:'plat',x:860,h:230,w:180},{t:'enemy',k:'kukuruza',w:'pistol',x:860,h:240},{t:'anvil',x:860,h:440,ropes:[[860,600]]}],
  intro:[['kukuruza','Только отпусти Помидора — и я подстрелю его в полёте!','Just drop Tomato — and I will shoot him mid-air!'],['ogurets','Сначала наковальня на стрелка. Потом — качели.','First the anvil on the gunman. Then the swing.']]},
 {act:3,n:'Ножи и тёрки',en:'Knives and Graters',type:'run',seed:127,len:6300,lvl:.66,feat:{msaw:3,hsaw:2,spikes:2,fight:2,coins:4},foes:['arbuz','kukuruza','perets'],weap:['sword','smg','axe'],
  intro:[['baklazhan','Тут всё режет и крутится! Кто строил эту кухню?','Everything here cuts and spins! Who built this kitchen?'],['ogurets','Кактус. Специально для нас.','Cactus. Especially for us.']]},
 {act:3,n:'Осада кухни',en:'Siege of the Kitchen',type:'arena',obj:'defend',time:45,rain:90,guard:'pomidor',foes:['perets','kukuruza','arbuz'],wpool:['sword','bat','pistol','hammer'],enemies:[{k:'perets',w:'sword',x:.97},{k:'kukuruza',w:'pistol',x:.03}],
  intro:[['kaktus','Ты зашёл слишком далеко, огурчик. Моя армия тебя замаринует! А Помидора я уже связал.','You came too far, little cucumber. My army will pickle you! And I have already tied up Tomato.'],['ogurets','Помидор, держись! Никто к тебе не подойдёт!','Hold on, Tomato! Nobody gets near you!']]},
 {act:3,n:'Полка со специями',en:'The Spice Shelf',type:'puzzle',par:2,goal:'both',
  items:[{t:'zone',x0:80,x1:250},{t:'host',k:'morkov',x:165,h:320,ropes:[[165,560]]},{t:'spikes',x:690,w:420},{t:'plank',x:690,h:260,w:280,ropes:[[560,560,-130],[820,560,130]]},{t:'enemy',k:'arbuz',w:'hammer',x:640,h:280},{t:'enemy',k:'kukuruza',w:'pistol',x:740,h:280},{t:'bomb',x:420,h:420,ropes:[[420,600]]}],
  intro:[['arbuz','Мы на полке со специями. Попробуй достань!','We are on the spice shelf. Try and reach us!'],['ogurets','Полка висит на верёвках. Одна верёвка — и они съедут вниз.','The shelf hangs on ropes. One rope — and they slide down.']]},
 {act:3,n:'В погоню!',en:'The Chase',type:'run',seed:131,len:7400,lvl:.72,feat:{pit:3,gate:2,fight:3,rain:1,mines:1,steps:1,coins:4},cages:['pomidor'],foes:['arbuz','kukuruza','kapusta','perets'],weap:['bat','smg','axe','shotgun','grenade'],
  intro:[['morkov','Кактус грузит бочки в фургон! Он хочет сбежать!','Cactus is loading barrels into a van! He wants to escape!'],['ogurets','Помидора опять связали по дороге. Освободим — и в погоню!','Tomato got tied up again on the way. We free him — and give chase!']]},
 {act:3,n:'Босс: Кактус',en:'Boss: Cactus',type:'arena',obj:'boss',enemies:[{k:'kaktus',w:'axe',x:.8,boss:true,hp:3.6,dm:1.2,sp:2.3},{k:'perets',w:'pistol',x:.6}],
  tip:'Кактус колется — не стой к нему вплотную!',
  intro:[['kaktus','Я вырос в лаборатории. Меня поливали химией, пока вы грелись на солнышке!','I grew up in a lab. They sprayed me with chemicals while you basked in the sun!'],['ogurets','Мы вернём овощам их вкус. Сдавайся, колючка!','We will give the veggies their taste back. Surrender, prickly!']],
  outro:[['kaktus','Вам меня не достать! На заводе я сварю целую армию!','You will never catch me! At the factory I will brew a whole army!'],['ogurets','На завод?! Ребята, за ним!','To the factory?! Guys, after him!']]},
 // ===================== Акт V. Завод «Озверин» =====================
 {act:4,n:'Ворота завода',en:'The Factory Gates',type:'run',seed:139,len:5400,lvl:.76,feat:{pit:2,press:1,belt:1,fight:2,coins:4,crates:1},foes:['kukuruza','perets'],weap:['pistol','bat','smg'],
  tip:'tip_factory',
  intro:[['ogurets','Вот он, завод «Озверин». Отсюда зелье расходится по всем грядкам.','Here it is, the Rage-juice factory. The potion spreads to every garden from here.'],['pomidor','Смотри под ноги: в чанах кипит зелье, а прессы бьют без предупреждения!','Watch your step: potion boils in the vats, and the presses strike without warning!']]},
 {act:4,n:'Чаны с Озверином',en:'Vats of Rage-juice',type:'run',seed:149,len:6200,lvl:.8,feat:{pit:3,bigpit:1,mines:2,fight:2,gate:1,coins:4},cages:['morkov'],foes:['kukuruza','kapusta','arbuz'],weap:['pistol','hammer','smg'],
  intro:[['baklazhan','Кактус поймал Морковку и связал её в цеху!','Cactus caught Carrot and tied her up in the workshop!'],['ogurets','Пройдём мимо чанов и вытащим её.','We get past the vats and pull her out.']]},
 {act:4,n:'Кран над шипами',en:'Crane over Spikes',type:'puzzle',par:4,goal:'save',
  items:[{t:'zone',x0:335,x1:625},{t:'spikes',x:175,w:280},{t:'spikes',x:785,w:280},{t:'host',k:'pomidor',x:190,h:300,ropes:[[60,560],[330,560]]},{t:'host',k:'baklazhan',x:770,h:300,ropes:[[630,560],[900,560]]}],
  intro:[['pomidor','Нас обоих подвесили на кранах над шипами!','They hung both of us on cranes over the spikes!'],['ogurets','Раскачаю каждого к середине и отпущу вовремя.','I will swing each of you to the middle and let go in time.']]},
 {act:4,n:'Ночная смена',mods:['night'],en:'The Night Shift',type:'arena',obj:'kill',enemies:[{k:'kukuruza',w:'bazooka',x:.7},{k:'kapusta',w:'hammer',x:.82},{k:'arbuz',w:'axe',x:.92}],allies:[{k:'baklazhan',w:'bat',x:.18}],
  intro:[['arbuz','Хозяин велел никого не пускать в главный цех!','The Master ordered: nobody gets into the main hall!'],['baklazhan','Свет отключили, но вдвоём не страшно!','The lights are out, but it is not scary with two of us!']]},
 {act:4,n:'Дождь из капсул',en:'Capsule Rain',type:'arena',obj:'survive',time:45,rain:42,waves:true,enemies:[{k:'perets',w:'smg',x:.85}],
  intro:[['kaktus','Ловите подарочки с конвейера! Ха-ха-ха!','Catch these gifts from the conveyor! Ha-ha-ha!'],['ogurets','Это капсулы Озверина! Уворачивайся!','Those are Rage-juice capsules! Dodge!']]},
 {act:4,n:'Цех прессов',en:'The Press Hall',type:'run',seed:163,len:7800,lvl:.88,feat:{pit:2,bigpit:1,press:3,belt:2,fight:3,gate:2,rain:1,coins:5},foes:['kukuruza','kapusta','arbuz','perets'],weap:['smg','axe','shotgun','hammer','grenade'],
  intro:[['morkov','Главный цех совсем рядом! Но путь идёт через прессы и конвейеры.','The main hall is very close! But the way leads through presses and conveyors.'],['ogurets','Прорвёмся. Мы прошли огород, теплицу, рынок и кухню.','We will break through. We crossed the garden, greenhouse, market and kitchen.']]},
 {act:4,n:'Последний рубеж',mods:['heavy'],en:'The Last Line',type:'arena',obj:'kill',enemies:[{k:'arbuz',w:'hammer',x:.62},{k:'arbuz',w:'axe',x:.9},{k:'kukuruza',w:'smg',x:.78},{k:'perets',w:'sword',x:.7}],allies:[{k:'pomidor',w:'pistol',x:.15},{k:'morkov',w:'sword',x:.22}],
  intro:[['kaktus','Последняя гвардия! Если они падут — я сам выйду!','My last guard! If they fall — I will come out myself!'],['pomidor','Все вместе, как в старые добрые!','All together, like the good old days!']]},
 {act:4,n:'Финал: Кактус-Аномалия',en:'Finale: The Cactus Anomaly',type:'arena',obj:'boss',waves:true,enemies:[{k:'kaktus',w:'axe',x:.8,boss:true,hp:5,dm:1.35,sp:2.5},{k:'perets',w:'pistol',x:.6}],
  tip:'Кактус колется — не стой к нему вплотную!',
  intro:[['kaktus','Ты добрался до моего котла, огурчик? Здесь я сильнее всего!','You reached my cauldron, little cucumber? I am at my strongest here!'],['kaktus','Теперь весь мир будет колючим, как я!','Now the whole world will be prickly like me!'],['ogurets','Нет. Мир будет сочным. Сдавайся, колючка!','No. The world will be juicy. Surrender, prickly!']],
  outro:[['kaktus','Ох… Озверин выветривается… Что я наделал?','Oh… The Rage-juice is wearing off… What have I done?'],['ogurets','Ты просто рос без солнца. Пойдём домой — на огороде хватит места всем.','You just grew up without the sun. Let us go home — there is room for everyone in the garden.'],['pomidor','Смотрите! Перчики, Кукуруза и Капуста приходят в себя!','Look! The Peppers, Corn and Cabbage are coming back to their senses!'],['ogurets','Грядочная война окончена. Добро пожаловать домой — всем!','The Garden War is over. Welcome home — everyone!']]},
];
// Standalone survival waves: no captive or allied guard is required.
for(const [i,seconds,bombEvery] of [[9,28,0],[17,32,110],[25,35,0],[36,40,85]]){
 const c=STORY[i];Object.assign(c,{obj:'survive',time:seconds,waves:true,waveEvery:300,waveSize:2,waveLimit:4,rain:bombEvery,allies:[],guard:null,foes:i<16?['perets','kukuruza']:['perets','kukuruza','kapusta'],wpool:i<16?['fists','bat']:['bat','pistol']});
 c.n=bombEvery?'Волны под бомбами':'Отбей волны';c.en=bombEvery?'Waves under Bombs':'Hold off the Waves';
 c.tip=bombEvery?'Побеждай волны и уходи от падающих бомб. Союзника защищать не нужно — продержись до конца таймера.':'Враги приходят волнами с двух сторон. Защищай только себя и продержись до конца таймера.';
 c.intro=[['ogurets',bombEvery?'Они наступают волнами, а сверху летят бомбы! Буду двигаться и искать просветы.':'Они идут с двух сторон! Нужно продержаться — этот бой только за себя.',bombEvery?'Enemies arrive in waves, and bombs fall from above! I must keep moving and find a gap.':'They are coming from both sides! I must hold out — this time I only protect myself.']];
}
// One-time ambushes in selected runs; telegraph the landing before an enemy drops.
for(const i of [4,6,8,16,24,32])STORY[i].ambush=[{at:.28,count:1},{at:.62,count:i<8?1:2}];
// A repeatable day/night rhythm in every act; retain each chapter's other modifiers.
STORY.forEach((c,i)=>{c.map=ACTS[c.act].map;c.i=i;
 if(c.act>0&&[3,6].includes(i%8)&&c.type!=='puzzle')c.mods=[...new Set([...(c.mods||[]),'night'])];
});
const storyReward=i=>Econ.story(i);  // v=423: числа экономики — в js/economy.js
// подсказки головоломок: [номер верёвки, сколько кадров ждать после прошлого разреза]. Найдены перебором (tools/solvepuzzles.js)
const HINTS={3:[[0,30]],5:[[1,30],[0,60]],10:[[0,30],[1,64]],13:[[1,30],[0,35],[2,10]],18:[[0,30],[2,64]],21:[[0,30],[1,36]],26:[[0,30],[2,10],[1,90]],29:[[2,30],[0,190]],34:[[0,30],[1,35],[3,40],[2,35]]};
const chName=c=>LANG==='en'?c.en:c.n;
const actName=a=>LANG==='en'?a.en:a.n;
// сила врагов растёт к концу истории
const storyHp=i=>CombatBalance.story(i).hp,storyDm=i=>CombatBalance.story(i).dm;

/* ============ генератор длинного уровня ============ */
// детерминированный случайный генератор: одна и та же глава всегда собирается одинаково
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let q=Math.imul(a^a>>>15,1|a);q=q+Math.imul(q^q>>>7,61|q)^q;return((q^q>>>14)>>>0)/4294967296;};}
function buildRun(def){
 let hangN=0;
 const R=mulberry(def.seed||1),rr=(a,b)=>a+R()*(b-a),rp=a=>a[Math.floor(R()*a.length)];
 const lvl=def.lvl||0,moon=def.map==='moon',i=def.i||0;
 const ops=[],pits=[],rains=[];
 const Y=h=>FLOOR-h;
 const coinArc=(x0,x1,h,n)=>ops.push(()=>{for(let k=0;k<n;k++){const f=n>1?k/(n-1):.5;pickups.push({t:'coin',x:x0+(x1-x0)*f,y:Y(h+Math.sin(f*Math.PI)*40)});}});
 // стрелков не больше половины: огнестрел на длинном уровне иначе слишком злой
 const pickW=()=>{let w=rp(def.weap);if(WEAPONS[w].type!=='melee'&&R()<.5)w=rp(['fists','bat','sword',...def.weap.filter(q=>WEAPONS[q].type==='melee')]);return w;};
 const enemy=(x,h,o)=>ops.push(()=>{const e=spawnEnemy({k:(o&&o.k)||rp(def.foes),w:(o&&o.w)||pickW(),x:x/WW,y:h||0,hp:CombatBalance.forRun(i).hp*((o&&o.hp)||1),dm:CombatBalance.forRun(i).dm,sp:2.4+lvl*.6,aggro:o&&o.aggro||620});if(o&&o.gid)e.gid=o.gid;e.home=x;e.leash=o&&o.gid?420:650;});
 let gateN=0;
 // предмет на платформе; верх платформы на 9 выше её центра
 const putOn=(it,cx,h,w)=>{const top=h+9;
  if(it==='box')spawnItem('box',cx,Y(top+26));
  if(it==='box2'){spawnItem('box',cx-Math.min(40,w/4),Y(top+26));spawnItem('box',cx+Math.min(40,w/4),Y(top+26));}
  if(it==='barrel')spawnItem('barrel',cx,Y(top+30));
  if(it==='mine'){const m=spawnItem('mine',cx,Y(top+6));m.armed=0;m.power=.05;m.radius=160;}};
 const F={
  pit:()=>{const w=(moon?190:105)+rr(0,40)+lvl*35;return{w,place:x=>{pits.push([x,x+w]);coinArc(x,x+w,moon?190:140,3);}};},
  bigpit:()=>{const w=moon?rr(330,400):rr(280,330);return{w,place:x=>{pits.push([x,x+w]);ops.push(()=>spawnItem('platform',x+w/2,Y(36),{w:110}));coinArc(x+20,x+w-20,moon?210:150,5);}};},
  spikes:()=>{const w=80+rr(0,40)+lvl*40;return{w,place:x=>{ops.push(()=>spawnItem('spikes',x+w/2,Y(9),{w}));coinArc(x,x+w,130,3);}};},
  spikeplat:()=>({w:320,place:x=>{ops.push(()=>{spawnItem('spikes',x+160,Y(9),{w:320});spawnItem('platform',x+160,Y(118),{w:170});});coinArc(x+100,x+220,160,3);}}),
  press:()=>({w:190,place:x=>{ops.push(()=>spawnItem('press',x+95,Y(150),{mv:{dy:105,sp:.03+lvl*.01,slam:1}}));coinArc(x+20,x+170,110,3);}}),
  // v=459: конвейер — часть испытания, а не просто полоса на полу:
  //  «разгон к шипам» — лента несёт вперёд и обрывается у шипов, нужно прыгнуть в конце (монеты дугой над шипами);
  //  «встречная под прессом» — лента тянет назад, посередине бьёт пресс: пробиваться против хода и ловить момент
  belt:()=>R()<.5
   ?{w:600,place:x=>{ops.push(()=>{pickups.push({t:'belt',x:x+210,x0:x,x1:x+420,dir:1});spawnItem('spikes',x+490,Y(9),{w:130});});coinArc(x+380,x+600,150,4);}}
   :{w:520,place:x=>{ops.push(()=>{pickups.push({t:'belt',x:x+260,x0:x,x1:x+520,dir:-1});spawnItem('press',x+260,Y(150),{mv:{dy:105,sp:.028+lvl*.01,slam:1}});});coinArc(x+60,x+460,110,4);}},
  saw:()=>({w:150,place:x=>{ops.push(()=>spawnItem('saw',x+75,Y(24)));coinArc(x+20,x+130,150,3);}}),
  msaw:()=>({w:170,place:x=>ops.push(()=>spawnItem('saw',x+85,Y(160),{mv:{dy:115,sp:.022+lvl*.012}}))}),
  hsaw:()=>({w:340,place:x=>ops.push(()=>spawnItem('saw',x+170,Y(24),{mv:{dx:120,sp:.016+lvl*.01}}))}),
  mines:()=>({w:340,place:x=>{ops.push(()=>{for(const d of [40,170,300]){const m=spawnItem('mine',x+d,Y(6));m.armed=0;m.power=.05;m.radius=160;}});coinArc(x+20,x+320,150,5);}}),
  steps:()=>({w:660,place:x=>{ops.push(()=>{spawnItem('platform',x+90,Y(105),{w:170});spawnItem('platform',x+330,Y(205),{w:170});spawnItem('platform',x+570,Y(105),{w:170});});coinArc(x+270,x+390,250,4);if(lvl>.2)enemy(x+330,215,{w:rp(['pistol',...def.weap]),aggro:520});}}),
  tramp:()=>({w:440,place:x=>{ops.push(()=>{spawnItem('tramp',x+70,Y(8));spawnItem('platform',x+290,Y(235),{w:230});spawnItem('box',x+340,Y(270));});coinArc(x+200,x+380,290,5);}}),
  // платформа с предметом: h — высота платформы, на ней ящик, бочка, мина или просто монеты
  ledge:()=>{const h=rr(100,130),w=rr(170,220),it=rp(lvl<.2?['box','coins']:lvl<.35?['box','barrel','coins','box2']:['box','barrel','mine','box2','mine']);return{w:w+60,place:x=>{const cx=x+30+w/2;ops.push(()=>{spawnItem('platform',cx,Y(h),{w});putOn(it,cx,h,w);});coinArc(cx-w/2+24,cx+w/2-24,h+70,3);}};},
  // лесенка: наверху лежит предмет, за ним монеты
  stairs:()=>{const it=rp(lvl<.35?['box','barrel']:['box','barrel','mine']);return{w:560,place:x=>{ops.push(()=>{spawnItem('platform',x+80,Y(105),{w:160});spawnItem('platform',x+290,Y(195),{w:160});spawnItem('platform',x+500,Y(105),{w:160});putOn(it,x+290,195,160);});coinArc(x+40,x+120,165,2);coinArc(x+460,x+540,165,2);}};},
  // яма с платформой посередине
  pitplat:()=>{const w=rr(230,270);return{w,place:x=>{pits.push([x,x+w]);ops.push(()=>spawnItem('platform',x+w/2,Y(60),{w:110}));coinArc(x+w/2-30,x+w/2+30,125,3);}};},
  crates:()=>({w:190,place:x=>ops.push(()=>{spawnItem('box',x+40,Y(26));spawnItem('box',x+92,Y(26));if(Math.round(x)*7919%100<35)Chests.make(x+66,Y(78));else spawnItem('box',x+66,Y(78));if(R()<.5)spawnItem('barrel',x+160,Y(30));})}),
  hang:()=>({w:330,place:x=>{enemy(x+165,0,{aggro:260});ops.push(()=>{spawnItem('platform',x+55,Y(105),{w:130});const a=spawnItem('anvil',x+165,Y(260),{crush:4});addRope({x:x+165,y:Y(450)},{body:a.bodies[0],pt:{x:0,y:-14}});});}}),
  fight:()=>({w:440,place:x=>{const n=def.chase?1:def.fightN||1+Math.floor(R()*(1.3+lvl*1.6));/* у волны — один враг */for(let k=0;k<n;k++)enemy(x+120+k*110,0);coinArc(x+60,x+380,100,4);}}),
  gate:()=>{const gid=++gateN;return{w:560,place:x=>{const n=2+Math.floor(R()*(1+lvl*1.1));for(let k=0;k<n;k++)enemy(x+80+k*110,0,{gid,aggro:700});
   ops.push(()=>{const g=addEnt('gate',[Bodies.rectangle(x+500,Y(150),26,300,{isStatic:true,chamfer:{radius:4},render:{fillStyle:'#5d6680'},plugin:{deco:'wall',w:26,h:300}})],null,{gid,left:n});});}};},
  rain:()=>({w:780,place:x=>{rains.push({x0:x,x1:x+780,every:Math.round(78-lvl*30)});ops.push(()=>{spawnItem('box',x+260,Y(26));spawnItem('box',x+560,Y(26));});coinArc(x+40,x+740,110,7);}}),
  coins:()=>({w:300,place:x=>coinArc(x,x+300,90,6)}),
  // маятник над дорогой (js/run_hazards.js); за ним враг — его можно сбить, перерезав верёвку
  pend:()=>({w:330,place:x=>{const ax=x+150,amp=(.62+lvl*.25)*(R()<.5?1:-1);enemy(x+300,0,{aggro:300});ops.push(()=>RunHazards.pendulum(ax,Y(440),270,amp,lvl>.45&&R()<.5));coinArc(x+40,x+260,95,3);}}),
  // смертельные колья на земле — только перепрыгнуть
  // смертельные колья — как раньше: отдельная яма с кольями на дне (v=393; частокол на земле убран)
  stakes:()=>{const w=rr(95,130)+lvl*45;return{w,place:x=>{pits.push([x,x+w]);coinArc(x,x+w,150,3);}};},
  // друг подвешен на верёвке: перережь её — он упадёт, освободится и пойдёт за героем; рядом сторож
  // подвешенный друг — головоломки (v=396): plain — просто перережь; pit — висит и качается над ямой с кольями (режь, когда он над землёй);
  // two — две верёвки (одна перерезанная — качается); guard — под ним враг: сбрось друга на голову врагу
  hangcap:k=>{const v=def.hangVar?def.hangVar[hangN++%def.hangVar.length]:lvl<.15?'plain':['pit','two','guard','pit'][Math.floor(R()*4)];return{w:360,place:x=>{
   if(v==='pit')pits.push([x+100,x+200]);
   if(v==='guard')enemy(x+150,0,{aggro:150});else if(lvl>.1)enemy(x+320,0,{aggro:420});
   ops.push(()=>RunHazards.captive(x+150,Y(430),k,v));}};},
  // широкая яма, над ней платформа ездит туда-сюда
  mplat:()=>{const w=rr(330,390);return{w,place:x=>{pits.push([x,x+w]);ops.push(()=>RunHazards.mover(x+w/2,Y(62),120,(w-150)/2,0,.017+lvl*.008,R()*6));coinArc(x+40,x+w-40,140,4);}};},
  // лифт к высокому уступу с монетами и ящиком
  lift:()=>({w:470,place:x=>{ops.push(()=>{RunHazards.mover(x+90,Y(150),120,0,85,.02,R()*6);spawnItem('platform',x+320,Y(265),{w:220});spawnItem('box',x+360,Y(265+9+26));});coinArc(x+250,x+390,320,4);}}),
  cage:k=>({w:320,place:x=>{if(lvl>.1)enemy(x+70,0,{aggro:500});ops.push(()=>spawnCage(k,x+230));}}),
 };
 // список препятствий: перемешиваем, клетки ставим равномерно
 const feats=[];
 for(const [k,n] of Object.entries(def.feat||{}))for(let j=0;j<n;j++)feats.push(k);
 // в каждом забеге есть прыжки по платформам, с ростом сложности их больше и они разнообразнее
 const jumpPool=lvl<.15?['ledge']:lvl<.25?['ledge','ledge','stairs']:['ledge','ledge','stairs','pitplat'];
 for(let j=0,n=2+Math.round(lvl*3);j<n;j++)feats.push(rp(jumpPool));
 for(let j=feats.length-1;j>0;j--){const q=Math.floor(R()*(j+1));[feats[j],feats[q]]=[feats[q],feats[j]];}
 // первым не ставим тяжёлое — пусть игрок разомнётся
 const hard=['gate','rain','hsaw','msaw','press'];if(hard.includes(feats[0])){const q=feats.findIndex(f=>!hard.includes(f));if(q>0)[feats[0],feats[q]]=[feats[q],feats[0]];}
 (def.cages||[]).forEach((k,j)=>feats.splice(Math.round((j+1)*feats.length/(def.cages.length+1))+j,0,'cage:'+k));
 (def.hangcaps||[]).forEach((k,j)=>feats.splice(Math.round((j+1)*feats.length/(def.hangcaps.length+1))+j,0,'hang:'+k));
 const plan=feats.map(f=>f.startsWith('cage:')?F.cage(f.slice(5)):f.startsWith('hang:')?F.hangcap(f.slice(5)):F[f]());
 const total=plan.reduce((a,p)=>a+p.w,0),start=560,endZone=650;
 const len=Math.max(def.len||0,start+endZone+total+(plan.length+1)*150);
 const gap=(len-start-endZone-total)/(plan.length+1);
 let x=start,lastCp=0;const cps=[];
 for(const p of plan){x+=gap;if(x-lastCp>2100&&x>1800){cps.push(x-gap/2);lastCp=x;}p.place(x);x+=p.w;}
 // финальная битва у флага (v=396): def.finale врагов перед флагом — пока они живы, флаг не засчитывается
 if(def.finale)for(let k=0;k<def.finale;k++)enemy(len-640+k*85,0,{aggro:520});
 return {len,pits,ops,rains,cps};
}
// связанный друг: стоит на месте и зовёт на помощь, развязывается, когда герой подходит
function spawnCage(kind,x){
 const w=kind==='baklazhan'||kind==='pomidor'?112:92,h=kind==='baklazhan'||kind==='morkov'?150:135,y=FLOOR;
 const f=spawnRagdoll(kind,x,FLOOR-70,{team:0,ai:true,weapon:ROSTER.story[kind]?ROSTER.story[kind].weapon:'fists',hpMul:1.4,speed:2.9,aggro:520});
 f.caged=true;f.facing=-1;
 const o={isStatic:true,isSensor:true,render:{fillStyle:'#0000'},plugin:{deco:'cagebar'}};
 const c=addEnt('cage',[Bodies.rectangle(x,y-h/2,8,8,o)],null,{friend:f,box:{x,y,w,h}});
 Run.cagesTotal++;return c;
}
function openCage(c){
 const f=c.friend;removeEnt(c);Run.freed++;Missions.record('rescue');  // v=522: задание дня
 if(f&&!f.removed){f.caged=false;f.follow=true;f.invuln=60;healNpc(f,1);FX.heal(f.parts.head.position.x,f.parts.head.position.y-20);}
 for(let i=0;i<14;i++)particles.push({x:c.box.x+rnd(-24,24),y:FLOOR-c.box.h*rnd(.25,.7),vx:rnd(-4,4),vy:rnd(-5,-1),life:rnd(26,44),c:'#c9a063',r:rnd(2,4),fire:true});  // куски верёвки
 Snd.unlock();Snd.voice('v_joy',.7,1,0);
 toast(t('🔓 {0} на свободе!',npcName(f.kind)));
}

/* ============ головоломки: режь верёвки ============ */
// координаты в макете шириной 960 (по центру экрана), высоты — от пола вверх
function buildPuzzle(def){
 const ox=(WW-960)/2,X=x=>ox+x,Y=h=>FLOOR-h;
 const pits=[];for(const it of def.items)if(it.t==='pit')pits.push([X(it.x0),X(it.x1)]);
 setLevelWidth(0,pits);
 const ropes=(body,list,pt)=>(list||[]).forEach(r=>addRope({x:X(r[0]),y:Y(r[1])},{body,pt:r[2]!==undefined?{x:r[2],y:0}:pt}));
 for(const it of def.items){
  switch(it.t){
   case 'zone':pickups.push({t:'zone',x0:X(it.x0),x1:X(it.x1),y:it.h?Y(it.h):FLOOR});Run.zone=[X(it.x0),X(it.x1)];break;
   case 'spikes':spawnItem('spikes',X(it.x),Y((it.h||0)+9),{w:it.w});break;
   case 'plat':spawnItem('platform',X(it.x),Y(it.h),{w:it.w||180,a:it.a||0});break;
   case 'tramp':spawnItem('tramp',X(it.x),Y((it.h||0)+8),{kick:it.kick||0,a:it.a||0});break;
   case 'saw':spawnItem('saw',X(it.x),Y(it.h||24));break;
   case 'box':spawnItem('box',X(it.x),Y((it.h||0)+26));break;
   case 'anvil':{const a=spawnItem('anvil',X(it.x),Y(it.h),{crush:4});ropes(a.bodies[0],it.ropes,{x:0,y:-14});break;}
   case 'bomb':{const b=spawnItem('bomb',X(it.x),Y(it.h),{impact:true,fuse:999});b.power=.07;b.radius=230;ropes(b.bodies[0],it.ropes,{x:0,y:-15});break;}
   case 'plank':{const p=spawnItem('plank',X(it.x),Y(it.h),{w:it.w,d:.004});if(it.ropes){p.frozenPlank=true;Body.setStatic(p.bodies[0],true);}  /* v517: пока верёвки целы, доска неподвижна — стоящие на ней не раскачивают её */ropes(p.bodies[0],it.ropes);break;}
   case 'seesaw':{const p=spawnItem('plank',X(it.x),Y(it.h),{w:it.w,d:.003});const b=p.bodies[0];
    Composite.add(world,Constraint.create({pointA:{x:X(it.x),y:Y(it.h)},bodyB:b,length:0,stiffness:1,render:{visible:false}}));
    spawnItem('wall',X(it.x),Y((it.h-14)/2),{h:it.h-14,w:16});break;}
   case 'enemy':{const e=spawnEnemy({k:it.k,w:it.w,x:X(it.x)/WW,y:it.h||0,hp:.55,dm:.8,sp:2.3,aggro:2000});e.facing=-1;if(it.h)e.stayPut=true;break;}  // v516: враг на доске/уступе не бегает и не прыгает к герою
   case 'host':{
    const e=spawnRagdoll(it.k,X(it.x),it.stand?Y(it.h)-62*NPC[it.k].s:Y(it.h),{team:0,ai:false});e.hostage=true;e.facing=1;Run.hostages.push(e);
    const tb=e.parts.torso;ropes(tb,it.ropes,{x:0,y:-tb.plugin.h/2});break;}
  }
 }
}
