'use strict';
// A small, replayable introduction using the game's own weapons, loot, sounds and effects.
const FirstMinutes={
 active:false,phase:'',foes:[],box:null,drop:null,collected:false,boxPlaced:false,
 key(){return 'firstMission_'+Run.kind;},
 prepare(def){
  this.active=false;this.phase='';this.foes=[];this.box=null;this.drop=null;this.collected=false;this.boxPlaced=false;
  if(def.firstMinutes)def=def.firstMinutesSource;
  // The controls tutorial is authoritative, including after replay/reset of an old save.
  if(Run.idx!==0||tutDone()||def.introBattle)return def;
  this.active=true;this.phase='training';
  return {...def,firstMinutes:true,firstMinutesSource:def,type:'arena',obj:'kill',map:'garden',plats:[],hazards:[],waves:false,rain:0,mods:[],allies:[],
   enemies:[{k:'perets',w:'fists',x:.55,hp:.1,dm:.15,sp:1.8}]};
 },
 start(){
  if(!this.active)return;
  Run.hero.weapon='fists';Run.hero.ammoW=null;Run.hero.atkCd=0;Run.hero.reload=0;$('#controls .atk').classList.remove('gun');$('#controls .atk').style.setProperty('--wi','none');updateHud();
  this.foes=entities.filter(e=>e.type==='npc'&&e.team===1);
  this.box=spawnItem('box',Math.min(WW*.46,Run.hero.parts.torso.position.x+160),FLOOR-26);this.box.crateTutorial=true;this.box.hp=this.box.hpMax=12;
  GameStats.send('first_minutes_step',{step:'training'});
  GameStats.send('tutorial_started',{tutorial:'first_minutes',step:'training',step_index:1});
 },
 crateDrop(box,loot){if(this.active&&box===this.box&&loot){this.drop=loot;loot.kind='coin';loot.value=5;}},
 collect(loot){
  if(!this.active||loot!==this.drop)return;
  this.collected=true;S.tut.crateLootV2=1;S.tut.crateLoot=1;save();
  GameStats.send('tutorial_completed',{tutorial:'crate_loot'});
 },
 tick(){
  if(!this.active||Run.state!=='play')return;
  const h=Run.hero;if(!h||h.dead||h.removed)return;
  if(this.phase==='training'){
   if(Tut.on&&TUT_STEPS()[Tut.i].id==='crate'&&!this.boxPlaced&&this.box&&!this.box.removed){
    // The preceding dash can carry the player past the original crate position.
    Body.setPosition(this.box.bodies[0],{x:clamp(h.parts.torso.position.x+120,70,WW-70),y:FLOOR-26});Body.setVelocity(this.box.bodies[0],{x:0,y:0});this.boxPlaced=true;
   }
   if(Tut.on&&TUT_STEPS()[Tut.i].id==='crate'&&(!this.box||(!this.box.removed&&!entities.includes(this.box)))){
    this.box=spawnItem('box',clamp(h.parts.torso.position.x+100,50,WW-50),FLOOR-26);
    this.box.crateTutorial=true;this.box.hp=this.box.hpMax=12;this.boxPlaced=true;
   }
   // A lost/expired pickup must never leave the action lesson without a target.
   if(Tut.on&&['crate','loot'].includes(TUT_STEPS()[Tut.i].id)){
    if(this.drop?.collected&&!this.collected)this.collect(this.drop);
    if((this.box?.removed||TUT_STEPS()[Tut.i].id==='loot')&&!this.collected&&(!this.drop||this.drop.taken||!pickups.includes(this.drop))){
     const x=clamp(h.parts.torso.position.x+(h.facing||1)*80,50,WW-50);
     const loot=dropCrateLoot(x,FLOOR-30,true);if(loot){this.drop=loot;loot.kind='coin';loot.value=5;}
    }
   }
   // Loot waits for the player throughout the lesson, even if they take a break.
   if(this.drop&&!this.collected)this.drop.age=Math.min(this.drop.age,120);
   if(!Tut.on&&this.phase==='training'){this.phase='combat';GameStats.send('first_minutes_step',{step:'combat'});GameStats.send('tutorial_step',{tutorial:'first_minutes',step:'combat',step_index:2});}
  }
 },
 blockWin(){return this.active&&(Tut.on||this.foes.some(e=>!e.dead&&!e.removed));},
 objective(){
  if(!this.active)return '';
  const count=this.foes.filter(e=>e.dead||e.removed).length;
  return `👊 ${t('Победи врагов')}: ${count}/${this.foes.length||Run.goalTotal||1}`;
 },
 completed(){if(this.active){S.tut[this.key()]=1;UpgradeCoach.queue();save();GameStats.send('first_minutes_step',{step:'victory'});GameStats.send('tutorial_completed',{tutorial:'first_minutes',step:'victory'});}},
 draw(){
  if(screen!=='play'||Run.state!=='play'||Run.type==='puzzle'||Run.def?.climb)return;
  const h=Run.hero;if(!h||h.dead||h.removed)return;
  // Blue shield and text distinguish allies without changing their existing character art.
  for(const e of entities)if(e.type==='npc'&&e.team===0&&e!==h&&!e.dead&&!e.hung&&!e.caged){
   const p=e.parts.torso.position;if(!onScreen(p.x,30))continue;
   const y=p.y-e.parts.torso.plugin.h*.75-33;
   if(SPR.icon_shield)ctx.drawImage(SPR.icon_shield,p.x-12,y-23,24,24);
   ctx.font='900 13px Nunito,system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#3a2518';ctx.strokeText(t('Союзник'),p.x,y+14);ctx.fillStyle='#a4e2ff';ctx.fillText(t('Союзник'),p.x,y+14);
  }
  if(!this.active&&(Run.idx>2||Intro.active))return;  // v531: в интро стрелок-подсказок нет
  let target=this.active&&Tut.on&&['crate','loot'].includes(TUT_STEPS()[Tut.i].id)?(this.box&&!this.box.removed?this.box.bodies[0].position:this.drop):nearestEnemy(h);
  if(target?.parts)target=target.parts.torso.position;
  if(!target)return;
  const left=camX+viewX+30,right=camX+viewX+viewW-30,x=clamp(target.x,left,right),y=clamp(target.y-110,viewY+90,FLOOR-100),off=target.x<left?-1:target.x>right?1:0;
  ctx.save();ctx.translate(x,y+Math.sin(frame*.09)*4);if(off)ctx.rotate(-off*Math.PI/2);
  ctx.fillStyle='#ffdc57';ctx.strokeStyle='#744218';ctx.lineWidth=3;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-7,-19);ctx.lineTo(7,-19);ctx.lineTo(7,-3);ctx.lineTo(15,-3);ctx.lineTo(0,14);ctx.lineTo(-15,-3);ctx.lineTo(-7,-3);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 }
};
