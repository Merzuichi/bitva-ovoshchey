'use strict';
/* ============ задания песочницы (v=411) ============
   В песочнице монеты сами не капают: ни за удары, ни за урон, ни за время. Их дают только задания этого окна.
   Монеты общие со всей игрой (S.coins). Прогресс лежит в S.missions.sb (сохраняется вместе с остальными заданиями).
   События пишет SbM.add(событие[, сколько]); ключи событий:
   kill, dmg, cut, spawn_npc, spawn:<предмет>, equip, equip:<оружие>, equip_new, map, map_new, kind_new, grab, freeze, team,
   revive, grow, boom, gravity, slow, play, play_kill, battle, battle3, battle8, battle12, kinds5, vs:<а>|<б>, kp:<убийца>><жертва>,
   kw:<оружие убийцы>, blast, burn, spike, combo, fight_end, duel_end. */
const SbM={
 blast:false,combo:[],fightInfo:null,_defs:null,_by:null,
 TIERS:['Разогрев','Дуэли овощей','Оружейный мастер','Подрывник','Большие битвы','Легенда песочницы'],
 // ---------- описание заданий ----------
 build(){
  if(this._defs)return this._defs;
  const L=[],N=k=>NPC[k].n,W=w=>WEAPONS[w].n,vs=(a,b)=>[a,b].sort().join('|');
  // tier, id, событие, сколько, награда, текст по-русски, текст по-английски, подстановки (русские названия)
  const P=(tier,id,ev,n,r,ru,en,args)=>{EN[ru]=en;L.push({tier,id,ev,n,r,ru,args:args||[],icon:'fight'});};
  const duel=(id,a,b,r)=>P(1,id,'vs:'+vs(a,b),1,r,'Устрой бой: {0} против {1}','Stage a fight: {0} vs {1}',[N(a),N(b)]);
  const beat=(id,a,b,r)=>P(1,id,`kp:${a}>${b}`,1,r,'Пусть {0} победит бойца: {1}','Let {0} defeat: {1}',[N(a),N(b)]);
  const wk=(id,w,n,r)=>P(2,id,'kw:'+w,n,r,'Победи {1} бойцов оружием «{0}»','Defeat {1} fighters with the {0}',[W(w),n]);
  // 0 — разогрев
  P(0,'s_spawn3','spawn_npc',3,20,'Расставь на сцене 3 бойцов','Place 3 fighters on the scene');
  P(0,'s_battle1','battle',1,25,'Запусти первый бой ⚔️','Start your first fight ⚔️');
  P(0,'s_kill3','kill',3,25,'Победи 3 бойцов','Defeat 3 fighters');
  P(0,'s_equip2','equip',2,25,'Выдай оружие двум бойцам','Give weapons to 2 fighters');
  P(0,'s_bomb1','spawn:bomb',1,25,'Поставь бомбу','Place a bomb');
  P(0,'s_blast1','blast',1,30,'Взорви бойца','Blow up a fighter');
  P(0,'s_map1','map',1,20,'Выбери карту для боя','Pick a map for the fight');
  P(0,'s_grab3','grab',3,20,'Подними рукой 3 раза','Grab with the hand 3 times');
  P(0,'s_dmg300','dmg',300,30,'Нанеси бойцам 300 урона','Deal 300 damage');
  P(0,'s_cut1','cut',1,30,'Отруби бойцу конечность','Cut off a fighter\'s limb');
  // 1 — дуэли и победы конкретных овощей
  duel('v_po','perets','kukuruza',50);duel('v_og','ogurets','pomidor',40);duel('v_bm','baklazhan','morkov',50);
  duel('v_ak','arbuz','kapusta',50);duel('v_mp','morkov','pomidor',50);duel('v_kp','kapusta','perets',50);duel('v_kak','kaktus','perets',80);
  beat('k_pk','perets','kukuruza',60);beat('k_kp','kukuruza','perets',60);beat('k_op','ogurets','pomidor',50);beat('k_po','pomidor','ogurets',50);
  beat('k_ao','arbuz','ogurets',60);beat('k_oa','ogurets','arbuz',90);beat('k_bk','baklazhan','kapusta',70);beat('k_mb','morkov','baklazhan',90);
  // 2 — оружие
  wk('w_fists','fists',5,40);wk('w_bat','bat',3,50);wk('w_sword','sword',3,50);wk('w_axe','axe',3,60);wk('w_hammer','hammer',3,60);
  wk('w_pistol','pistol',5,60);wk('w_smg','smg',5,70);wk('w_shotgun','shotgun',3,70);wk('w_bow','bow',3,70);wk('w_spear','spear',3,70);
  wk('w_knife','knife',3,60);wk('w_flamer','flamer',3,90);
  P(2,'e_new5','equip_new',5,80,'Попробуй 5 разных видов оружия','Try 5 different weapons');
  P(2,'e_new10','equip_new',10,150,'Попробуй 10 разных видов оружия','Try 10 different weapons');
  P(2,'e_bazooka','equip:bazooka',1,60,'Выдай бойцу базуку','Give a fighter the bazooka');
  P(2,'e_flamer','equip:flamer',1,60,'Выдай бойцу огнемёт','Give a fighter the flamethrower');
  // 3 — взрывы и опасные предметы
  P(3,'b_blast3','blast',3,50,'Взорви 3 бойцов','Blow up 3 fighters');
  P(3,'b_blast10','blast',10,100,'Взорви 10 бойцов','Blow up 10 fighters');
  P(3,'b_blast30','blast',30,200,'Взорви 30 бойцов','Blow up 30 fighters');
  P(3,'b_dyn3','spawn:dynamite',3,50,'Поставь 3 динамита','Place 3 sticks of dynamite');
  P(3,'b_mine2','spawn:mine',2,50,'Поставь 2 мины','Place 2 mines');
  P(3,'b_saw1','spawn:saw',1,40,'Поставь пилу','Place a saw');
  P(3,'b_burn3','burn',3,80,'Победи 3 бойцов огнём','Defeat 3 fighters with fire');
  P(3,'b_spike2','spike',2,60,'Пусть 2 бойца погибнут на шипах','Let 2 fighters die on spikes');
  P(3,'b_combo1','combo',1,80,'Победи 3 бойцов за 3 секунды','Defeat 3 fighters within 3 seconds');
  P(3,'b_combo5','combo',5,200,'Сделай 5 серий по 3 победы за 3 секунды','Chain 5 triple knockouts');
  P(3,'b_boom5','boom',5,60,'Взорви что-нибудь пальцем 5 раз','Use the finger blast 5 times');
  P(3,'b_grav2','gravity',2,40,'Включи невесомость','Switch on zero gravity');
  // 4 — большие битвы
  P(4,'f_3t','battle3',1,100,'Запусти бой трёх команд','Start a fight with three teams');
  P(4,'f_8','battle8',1,100,'Запусти бой, где 8 и больше бойцов','Start a fight with 8 or more fighters');
  P(4,'f_12','battle12',1,200,'Запусти бой, где 12 и больше бойцов','Start a fight with 12 or more fighters');
  P(4,'f_kinds','kinds5',1,120,'Собери в бою 5 разных видов овощей','Bring 5 different veggies to one fight');
  P(4,'f_end3','fight_end',3,80,'Доведи 3 боя до победы одной команды','Finish 3 fights with one team left');
  P(4,'f_end10','fight_end',10,200,'Доведи 10 боёв до победы одной команды','Finish 10 fights with one team left');
  P(4,'f_duel3','duel_end',3,80,'Выиграй 3 дуэли один на один','Settle 3 one-on-one duels');
  P(4,'f_b10','battle',10,100,'Запусти 10 боёв','Start 10 fights');
  P(4,'f_b25','battle',25,250,'Запусти 25 боёв','Start 25 fights');
  // 5 — легенда
  P(5,'l_kill50','kill',50,100,'Победи 50 бойцов','Defeat 50 fighters');
  P(5,'l_kill150','kill',150,200,'Победи 150 бойцов','Defeat 150 fighters');
  P(5,'l_kill500','kill',500,400,'Победи 500 бойцов','Defeat 500 fighters');
  P(5,'l_dmg2k','dmg',2000,100,'Нанеси 2000 урона','Deal 2000 damage');
  P(5,'l_dmg10k','dmg',10000,300,'Нанеси 10 000 урона','Deal 10,000 damage');
  P(5,'l_dmg50k','dmg',50000,600,'Нанеси 50 000 урона','Deal 50,000 damage');
  P(5,'l_cut25','cut',25,150,'Отруби 25 конечностей','Cut off 25 limbs');
  P(5,'l_revive5','revive',5,60,'Оживи 5 бойцов','Revive 5 fighters');
  P(5,'l_grow3','grow',3,60,'Увеличь бойца 3 раза','Enlarge a fighter 3 times');
  P(5,'l_team5','team',5,40,'Смени команду бойцам 5 раз','Switch teams 5 times');
  P(5,'l_freeze5','freeze',5,40,'Закрепи 5 предметов','Pin 5 items');
  P(5,'l_slow3','slow',3,30,'Включи замедление времени','Switch on slow motion');
  P(5,'l_play3','play',3,80,'Поиграй за бойца 3 раза','Play as a fighter 3 times');
  P(5,'l_playkill','play_kill',10,150,'Победи 10 бойцов, играя за героя','Defeat 10 fighters while playing as a hero');
  P(5,'l_map3','map_new',3,100,'Побывай на 3 разных картах','Visit 3 different maps');
  P(5,'l_map6','map_new',6,300,'Побывай на всех 6 картах','Visit all 6 maps');
  P(5,'l_kind5','kind_new',5,100,'Выставь бойцов 5 разных видов','Place 5 different kinds of fighters');
  P(5,'l_kind9','kind_new',9,300,'Выставь бойцов всех 9 видов','Place all 9 kinds of fighters');
  // ежедневные: каждый день три из них, счётчики обнуляются в полночь
  const D=[];
  const Q=(id,ev,n,r,ru,en,args)=>{EN[ru]=en;D.push({tier:-1,id,ev,n,r,ru,args:args||[],icon:'fight'});};
  Q('d_kill10','kill',10,40,'Победи 10 бойцов','Defeat 10 fighters');
  Q('d_battle3','battle',3,40,'Запусти 3 боя','Start 3 fights');
  Q('d_blast3','blast',3,45,'Взорви 3 бойцов','Blow up 3 fighters');
  Q('d_equip5','equip',5,40,'Выдай оружие 5 раз','Hand out weapons 5 times');
  Q('d_dmg500','dmg',500,40,'Нанеси 500 урона','Deal 500 damage');
  Q('d_cut3','cut',3,45,'Отруби 3 конечности','Cut off 3 limbs');
  Q('d_spawn10','spawn_npc',10,35,'Расставь на сцене 10 бойцов','Place 10 fighters');
  Q('d_combo','combo',1,60,'Победи 3 бойцов за 3 секунды','Defeat 3 fighters within 3 seconds');
  Q('d_end2','fight_end',2,50,'Доведи 2 боя до победы одной команды','Finish 2 fights with one team left');
  Q('d_play','play_kill',3,50,'Победи 3 бойцов, играя за героя','Defeat 3 fighters while playing as a hero');
  Q('d_grab10','grab',10,30,'Подними рукой 10 раз','Grab with the hand 10 times');
  Q('d_dyn','spawn:dynamite',2,40,'Поставь 2 динамита','Place 2 sticks of dynamite');
  this._defs={perm:L,daily:D};
  this._by={};for(const q of L.concat(D))(this._by[q.ev]||(this._by[q.ev]=[])).push(q);
  return this._defs;
 },
 icon(q){const e=q.ev,m={kill:'enemies',dmg:'muscle',cut:'scissors',blast:'tool_boom',boom:'tool_boom',burn:'tool_boom',spike:'skull',combo:'skull',map:'map',map_new:'map',grab:'tool_hand',freeze:'tool_pin',team:'tool_team',revive:'tool_heal',grow:'tool_grow',gravity:'gravity_on',slow:'slowmo',play:'play',play_kill:'play',spawn_npc:'cat_creatures',kind_new:'cat_creatures',equip:'cat_weapons',equip_new:'cat_weapons',fight_end:'trophy',duel_end:'trophy'};
  return m[e]||(e.startsWith('kw:')?'cat_weapons':e.startsWith('equip:')?'cat_weapons':e.startsWith('spawn:')?'cat_danger':e.startsWith('kp:')?'enemies':'fight');},
 label(q){return t(q.ru,...q.args.map(a=>typeof a==='string'?t(a):a));},
 // ---------- состояние ----------
 st(){
  const m=Missions.state();if(!m.sb||typeof m.sb!=='object')m.sb={};const s=m.sb;
  s.n=s.n||{};s.claimed=s.claimed||{};s.seen=s.seen||{};s.seen.w=s.seen.w||{};s.seen.m=s.seen.m||{};s.seen.k=s.seen.k||{};s.dn=s.dn||{};s.dclaimed=s.dclaimed||{};
  const day=today();
  if(s.day!==day){s.day=day;s.dn={};s.dclaimed={};s.dbonus=false;s.dids=this.pickDaily(day);}
  return s;
 },
 pickDaily(day){
  const pool=this.build().daily.map(q=>q.id);let x=Math.floor(Date.parse(day)/86400000)*2654435761%4294967296||1;
  const rnd=()=>(x=(x*1664525+1013904223)%4294967296)/4294967296,out=[];
  while(out.length<3&&pool.length){out.push(pool.splice(Math.floor(rnd()*pool.length),1)[0]);}
  return out;
 },
 daily(){const s=this.st(),D=this.build().daily;return s.dids.map(id=>D.find(q=>q.id===id)).filter(Boolean);},
 count(q,daily){const s=this.st();return Math.min(q.n,Math.floor((daily?s.dn:s.n)[q.ev]||0));},
 done(q,daily){return this.count(q,daily)>=q.n;},
 ready(){
  const s=this.st(),perm=this.build().perm.filter(q=>this.done(q)&&!s.claimed[q.id]).length;
  const dl=this.daily(),d=dl.filter(q=>this.done(q,1)&&!s.dclaimed[q.id]).length+(!s.dbonus&&dl.length&&dl.every(q=>s.dclaimed[q.id])?1:0);
  return {perm,daily:d,total:perm+d};
 },
 // ---------- события ----------
 live(){return screen==='sandbox'&&Mode.id==='sandbox';},
 add(ev,amount=1){
  if(!this.live()||!(amount>0))return;
  this.build();const s=this.st(),list=this._by[ev];
  const before=list?list.map(q=>[this.done(q),this.done(q,1)]):null;
  s.n[ev]=Math.min(1e9,(s.n[ev]||0)+amount);s.dn[ev]=Math.min(1e9,(s.dn[ev]||0)+amount);
  this.sync();
  if(!list)return;
  let fresh=null;
  list.forEach((q,i)=>{
   const isD=q.tier<0;if(isD&&!s.dids.includes(q.id))return;
   if(!before[i][isD?1:0]&&this.done(q,isD)&&!(isD?s.dclaimed:s.claimed)[q.id])fresh=q;
  });
  if(fresh){toast(`🎯 ${t('Задание выполнено')}: ${this.label(fresh)}`);try{Snd.reward();}catch(e){}save();this.sync();}
 },
 // записать «первый раз» (оружие, карта, вид бойца) и тогда засчитать событие
 first(group,key,ev){const s=this.st();if(s.seen[group][key])return;s.seen[group][key]=1;this.add(ev);},
 onSpawn(id,isNpc){this.add(isNpc?'spawn_npc':'spawn_item');this.add('spawn:'+id);if(isNpc)this.first('k',id,'kind_new');},
 onEquip(ent,id){this.add('equip');this.add('equip:'+id);this.first('w',id,'equip_new');},
 onMap(id){this.add('map');this.first('m',id,'map_new');},
 fightStart(){
  const list=fighters().filter(e=>!e.dead&&e.team>=0),teams=new Set(list.map(e=>e.team));
  this.fightInfo={n:list.length};
  if(teams.size<2)return;
  const kinds=new Set(list.map(e=>e.kind)),pairs=new Set();
  for(const a of list)for(const b of list)if(a.team!==b.team&&a.kind!==b.kind)pairs.add([a.kind,b.kind].sort().join('|'));
  this.add('battle');if(teams.size>=3)this.add('battle3');if(list.length>=8)this.add('battle8');if(list.length>=12)this.add('battle12');if(kinds.size>=5)this.add('kinds5');
  pairs.forEach(p=>this.add('vs:'+p));
 },
 fightStop(){this.fightInfo=null;},
 onKill(ent,src){
  if(ent.type!=='npc')return;
  this.add('kill');
  if(src&&src!==ent){this.add('kw:'+(src.weapon||'fists'));this.add(`kp:${src.kind}>${ent.kind}`);if(typeof SbPlay!=='undefined'&&SbPlay.ent&&src===SbPlay.ent)this.add('play_kill');}
  // погиб в самом взрыве или разбился, отброшенный им (в течение 1,5 с)
  if(this.blast||frame-(ent.blastAt??-999)<90)this.add('blast');
  else if(ent.burnUntil>frame)this.add('burn');
  if(ent.spikeDeath)this.add('spike');
  this.combo=this.combo.filter(f=>frame-f<180);this.combo.push(frame);
  if(this.combo.length>=3){this.combo=[];this.add('combo');}
  if(this.fightInfo&&SandboxMode.fight){
   const alive=new Set(entities.filter(e=>e.type==='npc'&&!e.dead&&e.team>=0).map(e=>e.team));
   if(alive.size<=1){this.add('fight_end');if(this.fightInfo.n===2)this.add('duel_end');this.fightInfo=null;}
  }
 },
 // ---------- награды ----------
 claim(id,daily,mult){
  const s=this.st(),D=this.build(),q=(daily?D.daily:D.perm).find(x=>x.id===id),box=daily?s.dclaimed:s.claimed;
  if(!q||box[id]||!this.done(q,daily))return false;
  box[id]=1;const r=q.r*(mult||1);addCoins(r);save();Snd.reward();
  GameStats.send('mission_reward_claimed',{mission:id,group:daily?'sandbox_daily':'sandbox',reward:r,multiplier:mult||1});
  this.sync();return true;
 },
 // плашка заданий в верхней панели песочницы: что забрать и что делать дальше
 sync(){clearTimeout(this._bt);this._bt=setTimeout(()=>this.render(),120);},
 render(){
  const b=$('#sbMissionBar');if(!b||screen!=='sandbox')return;
  const lock=this.locked(),n=lock?0:this.ready().total,label=lock?t('Откроется после обучения'):n?t('Задания: наград к получению — {0}',n):t('Задания');
  b.disabled=lock;b.classList.toggle('locked',lock);b.classList.toggle('mission-ready',n>0);b.classList.toggle('y',n>0);
  b.innerHTML=`${IC('book')} ${t('Задания')}${n?`<i class="mission-dot" aria-hidden="true">${n}</i>`:''}`;
  b.title=label;b.setAttribute('aria-label',label);
 },
 // ---------- окно ----------
 locked(){return screen==='sandbox'&&(SbTut.on||!S.tut.sbFirstBattle);},
 open(){
  if(this.locked()){toast(t('Задания откроются после обучения'));return;}
  const D=this.build(),s=this.st(),rd=this.ready(),rdM=Missions.rewards(),canAd=Y.canReward(),inMenu=screen==='menu';
  const dl=this.daily(),dIds=new Set(dl.map(q=>q.id));
  const card=(q,d)=>{
   const n=this.count(q,d),ok=n>=q.n,taken=!!(d?s.dclaimed:s.claimed)[q.id];
   return `<div class="mission-card ${ok&&!taken?'complete':''}"><div class="mission-icon">${IC(this.icon(q))}</div><div class="mission-copy"><b>${this.label(q)}</b><div class="mission-progress"><i style="width:${n/q.n*100}%"></i></div><small>${n}/${q.n}</small></div>
    <div class="sbm-btns"><button class="btn sm ${ok&&!taken?'y':''}" data-sc="${q.id}" ${!ok||taken?'disabled':''}>${taken?t('Получено'):ok?`${t('Забрать')} · ${q.r} ${IC('coin')}`:`${q.r} ${IC('coin')}`}</button>${ok&&!taken&&canAd?`<button class="btn ad sm" data-sc2="${q.id}">🎬 ×2</button>`:''}</div></div>`;
  };
  const all=D.perm.map(q=>({q,d:0})).concat(dl.map(q=>({q,d:1})));
  const claimable=c=>this.done(c.q,c.d)&&!(c.d?s.dclaimed:s.claimed)[c.q.id];
  const rank=c=>claimable(c)?0:(c.d?s.dclaimed:s.claimed)[c.q.id]?2:1;
  const top=all.filter(claimable);
  const rest=(list)=>list.filter(c=>!claimable(c)).sort((a,b)=>rank(a)-rank(b));
  const bonusReady=!s.dbonus&&dl.length&&dl.every(q=>s.dclaimed[q.id]);
  const doneN=D.perm.filter(q=>s.claimed[q.id]).length;
  const sec=(title,items,extra)=>items.length?`<h4 class="sbm-tier">${title} ${extra||''}</h4>`+items.map(c=>card(c.q,c.d)).join(''):'';
  const body=`<p class="missions-info">${t('В песочнице монеты дают только за задания. Выполнено: {0} из {1}',doneN,D.perm.length)}</p><div class="mission-list sbm-list">
   ${sec('✔ '+t('Готово — забери награду!'),top)}
   ${sec(t('Задания дня'),rest(all.filter(c=>c.d)),`<small id="sbmTimer"></small>`)}
   ${this.TIERS.map((nm,ti)=>{const own=all.filter(c=>!c.d&&c.q.tier===ti),items=D.perm.filter(q=>q.tier===ti);return sec(t(nm),rest(own),`<small>${items.filter(q=>s.claimed[q.id]).length}/${items.length}</small>`);}).join('')}
  </div>${dl.length?`<button class="btn ${bonusReady?'y':''}" id="sbmBonus" ${bonusReady?'':'disabled'}>${s.dbonus?t('Бонус получен'):t('Все задания дня: +60 монет')}</button>`:''}`;
  const main=inMenu?`<div class="tabs ctr"><button data-mtab="daily" class="${rdM.daily?'blink':''}">${t('На сегодня')}${rdM.daily?`<i class="mission-tab-badge">${rdM.daily}</i>`:''}</button><button data-mtab="novice" class="${rdM.novice?'blink':''}">${t('Миссии новичка')}${rdM.novice?`<i class="mission-tab-badge">${rdM.novice}</i>`:''}</button><button data-mtab="sandbox" class="on ${rd.total?'blink':''}">${t('Песочница')}${rd.total?`<i class="mission-tab-badge">${rd.total}</i>`:''}</button></div>`:'';
  modal(`<h3>${inMenu?t('Задания'):'🎯 '+t('Задания песочницы')}</h3>${main}${body}<button class="btn" id="sbmClose">${t('Назад')}</button>`,{wide:true,x:closeModal});
  $('#modal .box').classList.add('missions-box','sbm-box');
  const list=$('#modal .sbm-list');if(list&&this._scroll)list.scrollTop=this._scroll;this._scroll=0;
  document.querySelectorAll('[data-mtab]').forEach(b=>b.onclick=()=>{clearTimeout(this.timer);Missions.open(b.dataset.mtab);});
  const go=async(id,mult)=>{
   const l=$('#modal .sbm-list');this._scroll=l?l.scrollTop:0;
   if(mult>1){if(!(await Y.rewarded('sandbox_mission_x2')))return;}
   if(this.claim(id,dIds.has(id),mult))this.open();
  };
  document.querySelectorAll('[data-sc]').forEach(b=>b.onclick=()=>go(b.dataset.sc,1));
  document.querySelectorAll('[data-sc2]').forEach(b=>b.onclick=()=>go(b.dataset.sc2,2));
  const bonus=$('#sbmBonus');if(bonus)bonus.onclick=()=>{const x=this.st();if(x.dbonus||!this.daily().every(q=>x.dclaimed[q.id]))return;x.dbonus=true;addCoins(60);save();Snd.reward();GameStats.send('mission_reward_claimed',{mission:'all_daily',group:'sandbox_daily',reward:60});this.sync();this._scroll=0;this.open();};
  const close=()=>{clearTimeout(this.timer);closeModal();if(screen==='menu')buildMenu();};$('#sbmClose').onclick=close;const cross=$('#modal .mx');if(cross)cross.onclick=close;
  clearTimeout(this.timer);this.tick();
  GameStats.send('missions_opened',{group:'sandbox'});
  if(typeof fitMobileModal==='function')fitMobileModal();
 },
 tick(){
  const n=$('#sbmTimer');if(!n)return;
  const ms=Date.parse(today()+'T00:00:00Z')+86400000-Date.now(),sec=Math.max(0,Math.floor(ms/1000));
  n.textContent='· '+t('Новые задания через {0}',[Math.floor(sec/3600),Math.floor(sec/60)%60,sec%60].map(x=>String(x).padStart(2,'0')).join(':'));
  this.timer=setTimeout(()=>this.tick(),1000);
 }
};
Object.assign(EN,{
 'Задания откроются после обучения':'Missions unlock after the tutorial','Откроется после обучения':'Unlocks after the tutorial','Готово — забери награду!':'Ready — claim your reward!','Задания дня':'Daily missions','Песочница':'Sandbox',
 'Задание выполнено':'Mission complete','Задания песочницы':'Sandbox missions','Все задания':'All missions','На сегодня':'Today',
 'Три задания на день. Выполни все и забери ещё 60 монет!':'Three missions each day. Complete all three for 60 bonus coins!',
 'Все задания дня: +60 монет':'All daily missions: +60 coins',
 'В песочнице монеты дают только за задания. Выполнено: {0} из {1}':'Coins in the sandbox come only from missions. Done: {0} of {1}',
 'Разогрев':'Warm-up','Дуэли овощей':'Veggie duels','Оружейный мастер':'Weapon master','Подрывник':'Demolition','Большие битвы':'Big battles','Легенда песочницы':'Sandbox legend',
 'Устрой бой: {0} против {1}':'Stage a fight: {0} vs {1}','Пусть {0} победит бойца: {1}':'Let {0} defeat: {1}',
 'Задания':'Missions'
});
// стили окна: список длинный — прокручивается, заголовки уровней, кнопки награды в столбик
(()=>{const st=document.createElement('style');st.textContent=`.mission-entry.locked,.mission-entry:disabled{filter:grayscale(1) brightness(.8)!important;opacity:.6;animation:none!important;cursor:default}
@keyframes sbmBlink{0%,100%{filter:none;box-shadow:none}50%{filter:brightness(1.3);box-shadow:0 0 14px 3px #ffe066}}
.tabs button.blink{animation:sbmBlink 1s ease-in-out infinite}
#sbMissionBar{pointer-events:auto;margin:0 8px;align-self:flex-start;white-space:nowrap}
body:not([data-screen=sandbox]) #sbMissionBar{display:none}
.sbm-box .sbm-list{max-height:48vh;overflow-y:auto;overscroll-behavior:contain;padding-right:4px}
.sbm-tier{margin:10px 2px 4px;font-size:15px;text-align:left;opacity:.95}.sbm-tier small{opacity:.7;font-weight:600;margin-left:6px}
.sbm-btns{display:flex;flex-direction:column;gap:4px;align-items:stretch;flex:none}.sbm-btns .btn{white-space:nowrap}`;document.head.appendChild(st);})();
