'use strict';
/* ============ мемные реплики в аркаде (v=396) ============ */
// Только текст (без озвучки). Отдельные списки для русской и английской версии: в русской — мемы рунета и
// переложения американских, в английской — американские. Реплики короткие, своими словами, без цитат из фильмов и песен.
// Где звучат: 1) комментарий в начале уровня — одна мемная фраза героя;
// 2) пузырь над головой: герой победил врага — не чаще, чем каждое 3-е убийство и раз в 9 с;
//    враг заметил героя — с шансом 35% и не чаще раза в 14 с; герой видит нового врага — не чаще раза в 18 с;
//    героя победили — враг рядом злорадствует (всегда, один раз). Между любыми пузырями — не меньше 5 с.
const MEMES={
 ru:{
  start:['Сначала прокачка, потом разнос. Это база.','Всё идёт по плану.','Ну что, погнали. Изи катка.','Включаю режим «сигма».','Я в своём познании преисполнился — пора бить.','Не баг, а фича: я снова здесь.','Шок-контент: огурец против всех!','Вайб чекнут. Погнали.','Сейчас будет контент.','Время больших мозгов.'],
  win:['Изи катка','Это база','Скилл ишью','Стонкс!','Чётко!','GG WP','Без шансов','Ору','Всё по плану','Кринж… для тебя','Лови вайб','Имба'],
  see:['Ну, погоди!','Ты кто такой? Давай, до свидания!','А ну иди сюда!','Опа, нежданчик','Сейчас будет шок-контент','Ждун дождался','Мы вам перезвоним','Это моя грядка!','Ща будет больно','Сюда смотри!'],
  spot:['Ну начинается…','Опять работа?','Всё норм. Всё горит, но норм','Ща разберёмся','Время больших мозгов','О, контент подъехал'],
  gloat:['Изи','Скилл ишью','Жми F','Ой, всё','Не повезло, не фортануло','Учись, салага','GG']
 },
 en:{
  start:['Upgrade first, then we cook.','Everything is going according to plan.','Main character energy: on.','Let him cook.','Big brain time.','Vibe check: passed.','This is fine. Totally fine.','No cap, I got this.','Sigma grindset activated.','Built different.'],
  win:['Skill issue','Stonks!','Easy peasy','Sheesh!','That\'s a W','GG no re','Emotional damage!','Built different','No cap','Big brain','Ratio','Too easy'],
  see:['Hold my juice!','Bruh.','Who invited this guy?','Not today!','Here we go again','Sus…','Get over here!','My garden!','You\'re cooked','Let me cook'],
  spot:['Here we go again…','This is fine','Big brain time','Oh, content incoming','Bruh moment','Let him cook'],
  gloat:['Press F','Skill issue','L','Too easy','Get rekt','Bruh moment','GG']
 }
};
const Memes={
 list:[],last:-9999,lastWin:-9999,lastSee:-9999,lastSpot:-9999,kills:0,bag:{},
 // v=396: пузыри и в истории (кроме головоломок); мемная фраза в начале уровня — только в аркаде
 on(){return (Run.kind==='arcade'||Run.kind==='story')&&Run.type!=='puzzle'&&screen==='play'&&!StoryDialogue.active;},
 // без повторов подряд: каждая группа — «мешок», фразы берутся по кругу в случайном порядке
 pick(kind){const L=MEMES[LANG==='en'?'en':'ru'][kind];let b=this.bag[kind];if(!b||!b.length){b=this.bag[kind]=L.map((_,i)=>i).sort(()=>Math.random()-.5);}return L[b.pop()];},
 reset(){this.list=[];this.kills=0;this.last=-9999;},
 startLine(){return [Run.heroId||'perets',this.pick('start'),null];},
 say(ent,text,force){
  if(!ent||ent.removed||(!force&&frame-this.last<300))return false;
  this.list=this.list.filter(b=>b.ent!==ent);this.list.push({ent,text,t:frame,life:150});this.last=frame;return true;
 },
 onKill(ent,src){
  if(!this.on()||ent.team!==1)return;const h=Run.hero;if(!h||h.dead)return;
  if(++this.kills<3||frame-this.lastWin<540)return;
  if(this.say(h,this.pick('win'))){this.kills=0;this.lastWin=frame;}
 },
 onHeroDown(h){
  if(!this.on())return;
  const foe=entities.filter(e=>e.type==='npc'&&e.team===1&&!e.dead&&!e.removed).sort((a,b)=>Math.abs(a.parts.torso.position.x-h.parts.torso.position.x)-Math.abs(b.parts.torso.position.x-h.parts.torso.position.x))[0];
  if(foe)this.say(foe,this.pick('gloat'),true);
 },
 update(){
  if(!this.on())return;const h=Run.hero;if(!h||h.dead)return;
  for(const e of entities){
   if(e.type!=='npc'||e.team!==1||e.dead||e.removed)continue;
   // враг заметил героя
   if(e.target===h&&!e.memeSaw){e.memeSaw=true;if(frame-this.lastSee>840&&Math.random()<.35&&onScreen(e.parts.torso.position.x,0)&&this.say(e,this.pick('see')))this.lastSee=frame;}
   // герой видит нового врага
   if(!e.memeSpotted&&onScreen(e.parts.torso.position.x,-60)){e.memeSpotted=true;if(frame-this.lastSpot>1080&&frame-this.last>300&&Math.random()<.4&&this.say(h,this.pick('spot')))this.lastSpot=frame;}
  }
  this.list=this.list.filter(b=>frame-b.t<b.life&&!b.ent.removed);
 },
 // пузырь над головой: кремовая плашка с коричневой обводкой и хвостиком, как реплики истории
 draw(){
  if(!this.list.length)return;
  ctx.save();ctx.font='800 15px Nunito,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  for(const b of this.list){
   const hd=b.ent.parts.head.position,age=frame-b.t,k=age<8?age/8:age>b.life-15?(b.life-age)/15:1;
   const w=Math.min(260,ctx.measureText(b.text).width+26),hh=30,x=clamp(hd.x,camX+viewX+w/2+6,camX+viewX+viewW-w/2-6),y=hd.y-96-(age<8?(1-k)*10:0);  // выше полоски здоровья
   ctx.globalAlpha=clamp(k,0,1);
   ctx.fillStyle='#fff6e8';ctx.strokeStyle='#c98a45';ctx.lineWidth=3;
   ctx.beginPath();ctx.roundRect(x-w/2,y-hh/2,w,hh,13);ctx.fill();ctx.stroke();
   ctx.beginPath();ctx.moveTo(x-8,y+hh/2-1);ctx.lineTo(x,y+hh/2+10);ctx.lineTo(x+8,y+hh/2-1);ctx.closePath();ctx.fill();
   ctx.beginPath();ctx.moveTo(x-8,y+hh/2);ctx.lineTo(x,y+hh/2+10);ctx.lineTo(x+8,y+hh/2);ctx.stroke();
   ctx.fillStyle='#5b3410';ctx.fillText(b.text,x,y+1,w-14);
  }
  ctx.restore();ctx.globalAlpha=1;
 }
};
