'use strict';
/* ============ эффекты и метки из спрайтов ============ */
// белый силуэт спрайта (вспышка попадания) — с кэшем
const silCache={};
function whiteSil(key){const im=SPR[key];if(!im)return null;if(silCache[key])return silCache[key];
 const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);return silCache[key]=c;}
// Перекрашивание белых спрайтов (повязка, полоска здоровья, сок) в нужный цвет — с кэшем,
// потому что ctx.filter слишком медленный.
const tintCache={};
function tinted(key,color){
 const im=SPR[key];if(!im)return null;
 const id=key+'|'+color;if(tintCache[id])return tintCache[id];
 const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');
 g.drawImage(im,0,0);g.globalCompositeOperation='multiply';g.fillStyle=color;g.fillRect(0,0,c.width,c.height);
 g.globalCompositeOperation='destination-in';g.drawImage(im,0,0);
 return tintCache[id]=c;
}
// листы кадров: [колонки, ряды]
const TFX_SHEET={burst:[3,3],splat:[3,3],nova:[3,3],muzzle:[2,2],cloud:[2,2],confetti:[3,3]};
// нарисовать кадр листа (или целую текстуру), по центру, с поворотом, масштабом, прозрачностью и цветом
function drawTfx(name,frame,x,y,w,h,rot,alpha,tint,g=ctx){
 const key='tfx_'+name,im=tint?tinted(key,tint):SPR[key];if(!im)return false;
 g.save();g.translate(x,y);if(rot)g.rotate(rot);g.globalAlpha=alpha===undefined?1:Math.max(0,alpha);
 const sh=TFX_SHEET[name];
 if(sh){const [c,r]=sh,fw=im.width/c,fh=im.height/r,i=Math.min(c*r-1,Math.max(0,frame|0));g.drawImage(im,(i%c)*fw,Math.floor(i/c)*fh,fw,fh,-w/2,-h/2,w,h);}
 else g.drawImage(im,-w/2,-h/2,w,h);
 g.restore();g.globalAlpha=1;return true;
}
const FX={list:[],
 add(o){this.list.push(o);if(this.list.length>160)this.list.shift();},
 // комикс-надпись: выпрыгивает, чуть наклонена, всплывает и тает
 word(x,y,w,size){if(!SPR['tfx_txt_'+w])return;this.add({k:'word',x,y,w,size:size||90,rot:rnd(-.22,.22),t:0,life:42});},
 // мультяшный «пых» (лист 3×3), лучистая вспышка, брызги сока, волна, облачко, конфетти, «!»
 burst(x,y,size,tint){this.add({k:'burst',x,y,size,tint,t:0,life:18,rot:rnd(0,6)});},
 spike(x,y,size,tint){this.add({k:'spike',x,y,size,tint,t:0,life:10,rot:rnd(0,6)});},
 splat(x,y,ang,tint,size){this.add({k:'splat',x,y,ang,tint,size:size||70,t:0,life:18});},
 shock(x,y,r){this.add({k:'shock',x,y,r,t:0,life:20});},
 cloud(x,y,size,vx,vy,tint){this.add({k:'cloud',x,y,size,vx:vx||0,vy:vy||-.3,tint,fr:ri(0,3),t:0,life:34,rot:rnd(-.3,.3)});},
 slashTex(x,y,ang,size){this.add({k:'slashT',x,y,ang,size:size||80,v:Math.random()<.5?'slash1':'slash2',t:0,life:11});},
 sparkle(x,y,size){this.add({k:'sparkle',x,y,size:size||22,t:0,life:22,rot:rnd(0,6)});},
 excl(ent){this.add({k:'excl',ent,t:0,life:46});},
 confetti(x0,x1,y,n){for(let i=0;i<n;i++)this.add({k:'conf',x:rnd(x0,x1),y:y-rnd(0,120),vx:rnd(-1.2,1.2),vy:rnd(.6,2.2),fr:ri(0,8),rot:rnd(0,6),vr:rnd(-.2,.2),size:rnd(9,15),t:0,life:ri(140,200)});},
 explosion(x,y,size){this.add({k:'boom',x,y,size,t:0,life:40});for(let i=0;i<3;i++)this.add({k:'smoke',x:x+rnd(-30,30),y:y+rnd(-20,10),size:size*.35,t:0,life:70,v:ri(1,4),vy:-rnd(.4,1)});},
 muzzle(x,y,ang){this.add({k:'muzzle',x,y,ang,t:0,life:4,v:ri(1,3)});},
 hit(x,y){this.add({k:'hit',x,y,t:0,life:9,v:ri(1,2),rot:rnd(0,6)});},
 heal(x,y){this.add({k:'heal',x,y,t:0,life:40});},
 ring(x,y,r){this.add({k:'ring',x,y,r,t:0,life:12});},
 slash(x,y,ang){this.add({k:'slash',x,y,ang,t:0,life:9});},
 puff(x,y){this.add({k:'puff',x,y,t:0,life:16,rot:rnd(0,6)});},
 flashAt(x,y){this.add({k:'flash',x,y,t:0,life:3});},
 ko(x,y){this.add({k:'ko',x,y,t:0,life:50});},
 // небольшая молния (удар молота, v=396): 3–4 ломаных разряда от точки удара, каждый кадр дрожат, голубое свечение
 zap(x,y,dir){this.add({k:'zap',x,y,dir:dir||1,t:0,life:10,seed:Math.random()*99});},
 update(){for(const f of this.list){f.t++;if(f.vy)f.y+=f.vy;if(f.vx)f.x+=f.vx;if(f.k==='conf'){f.vx+=Math.sin((f.t+f.fr*9)*.08)*.05;f.rot+=f.vr;if(f.y>FLOOR-4){f.y=FLOOR-4;f.vy=0;f.vx*=.9;f.vr*=.8;}}}this.list=this.list.filter(f=>f.t<f.life&&!(f.ent&&f.ent.removed));},
 draw(){
  for(const f of this.list){
   const k=f.t/f.life;
   if(f.k==='zap'){const a=1-k;ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    const g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,40);g.addColorStop(0,`rgba(120,190,255,${.35*a})`);g.addColorStop(1,'rgba(120,180,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,40,0,7);ctx.fill();
    for(let b=0;b<4;b++){const ang=(b-1.5)*.7+(f.dir<0?Math.PI:0)+Math.sin(f.seed+b)*.3,L=32+((f.seed*7+b*13)%26);let x=f.x,y=f.y;const pts=[[x,y]];
     for(let s=1;s<=5;s++){const d=L*s/5,j=(Math.random()-.5)*12;pts.push([f.x+Math.cos(ang)*d-Math.sin(ang)*j,f.y+Math.sin(ang)*d+Math.cos(ang)*j]);}
     for(const [w,c] of [[6.5,`rgba(25,60,170,${.85*a})`],[3.6,`rgba(80,190,255,${a})`],[1.4,`rgba(255,255,255,${a})`]]){ctx.lineWidth=w;ctx.strokeStyle=c;ctx.beginPath();pts.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.stroke();}}
    ctx.restore();continue;}
   if(f.k==='dropWarning'){
    ctx.save();ctx.translate(f.x,f.y);ctx.globalAlpha=.55+.35*Math.sin(f.t*.5);ctx.fillStyle='#ffb52e';ctx.strokeStyle='#6b3d1a';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,27,8,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.font='900 28px Nunito,system-ui';ctx.textAlign='center';ctx.strokeText('!',0,-18);ctx.fillStyle='#fff0b2';ctx.fillText('!',0,-18);ctx.restore();
   }else if(f.k==='boom'){const im=SPR.fx_explosion;if(!im)continue;const fr=Math.min(7,Math.floor(f.t/5)),s=f.size;ctx.drawImage(im,fr*256,0,256,256,f.x-s/2,f.y-s/2,s,s);}
   else if(f.k==='smoke'){const im=SPR['fx_smoke_'+f.v];if(!im)continue;const s=f.size*(1+k);ctx.globalAlpha=.7*(1-k);ctx.drawImage(im,f.x-s/2,f.y-s/2,s,s);ctx.globalAlpha=1;}
   else if(f.k==='muzzle'){const im=SPR['fx_muzzle_'+f.v];if(!im)continue;ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.ang);ctx.drawImage(im,-2,-7,24,18);ctx.restore();}
   else if(f.k==='hit'){const im=SPR['fx_hit_'+f.v];if(!im)continue;const s=22+k*10;ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.rot);ctx.globalAlpha=1-k;ctx.drawImage(im,-s/2,-s/2,s,s);ctx.restore();ctx.globalAlpha=1;}
   else if(f.k==='heal'){const im=SPR.fx_heal;if(!im)continue;const s=26;ctx.globalAlpha=1-k;ctx.drawImage(im,f.x-s/2,f.y-s/2-k*30,s,s);ctx.globalAlpha=1;}
   // кольцо удара: быстро расширяется и тает
   else if(f.k==='ring'&&SPR.tfx_shock){const s=f.r*2*(.3+k*.9);drawTfx('shock',0,f.x,f.y,s,s,0,(1-k)*.95);}
   else if(f.k==='ring'){ctx.globalAlpha=(1-k)*.9;ctx.strokeStyle='#fff';ctx.lineWidth=5*(1-k)+1;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(.3+k*.9),0,7);ctx.stroke();ctx.globalAlpha=1;}
   // росчерк клинка поперёк точки удара
   else if(f.k==='slash'){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.ang);const L=46*(1-k*.3);ctx.globalAlpha=1-k;
    ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-L,0);ctx.quadraticCurveTo(0,-7*(1-k)-1,L,0);ctx.quadraticCurveTo(0,3,-L,0);ctx.fill();
    ctx.fillStyle='#ffe9a0';ctx.beginPath();ctx.moveTo(-L*.7,0);ctx.quadraticCurveTo(0,-3,L*.7,0);ctx.quadraticCurveTo(0,1.5,-L*.7,0);ctx.fill();ctx.restore();ctx.globalAlpha=1;}
   // облачко пыли от пули
   else if(f.k==='puff'){const im=SPR.fx_smoke_1;const s=10+k*18;ctx.globalAlpha=.7*(1-k);if(im)ctx.drawImage(im,f.x-s/2,f.y-s/2-k*8,s,s);else{ctx.fillStyle='#ddd';ctx.beginPath();ctx.arc(f.x,f.y,s/2,0,7);ctx.fill();}ctx.globalAlpha=1;}
   // вспышка у дула — освещает пространство вокруг
   else if(f.k==='flash'){const g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,46);g.addColorStop(0,`rgba(255,235,160,${.55*(1-k)})`);g.addColorStop(1,'rgba(255,180,60,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,46,0,7);ctx.fill();}
   else if(f.k==='word'){const s=k<.12?.3+k/.12*1.05:k<.22?1.35-(k-.12)*3.5:1,w=f.size*s,im=SPR['tfx_txt_'+f.w];drawTfx('txt_'+f.w,0,f.x,f.y-k*26,w,w*im.height/im.width,f.rot,k>.72?(1-k)/.28:1);}
   else if(f.k==='muz')drawTfx('muzzle',f.fr,f.x,f.y,f.size,f.size*.7,f.ang,1,'#ffe27a');
   else if(f.k==='burst')drawTfx('burst',f.t/2,f.x,f.y,f.size,f.size,f.rot,1,f.tint);
   else if(f.k==='spike'){const s=f.size*(.55+k*.7);drawTfx('spike',0,f.x,f.y,s,s,f.rot,1-k*k,f.tint);}
   else if(f.k==='splat'){const s=f.size*(.8+k*.4);drawTfx('splat',f.t/2,f.x,f.y,s,s,f.ang,1-Math.max(0,k-.6)/.4,f.tint);}
   else if(f.k==='shock'){const s=f.r*2*(.2+k*.9);drawTfx('shock',0,f.x,f.y,s,s,0,(1-k)*.9);}
   else if(f.k==='cloud'){const s=f.size*(.6+k*.6);drawTfx('cloud',f.fr,f.x,f.y,s,s,f.rot,(1-k)*.95,f.tint);}
   else if(f.k==='slashT'){const s=f.size*(.8+k*.4);drawTfx(f.v,0,f.x,f.y,s,s*.5+s*.3*(1-k),f.ang,1-k);}
   else if(f.k==='sparkle'){const s=f.size*Math.sin(Math.min(1,k*1.4)*Math.PI);drawTfx('sparkle',0,f.x,f.y-k*10,s,s,f.rot+k*2,1,'#fff3a0');}
   else if(f.k==='conf')drawTfx('confetti',f.fr,f.x,f.y,f.size,f.size,f.rot,f.t>f.life-30?(f.life-f.t)/30:1);
   else if(f.k==='excl'){const e=f.ent;if(!e||e.dead)continue;const h=e.parts.head.position,y=h.y-e.parts.head.plugin.h/2-34+(k<.15?(1-k/.15)*-14:Math.sin(f.t*.3)*2),s=k<.15?k/.15*1.2:1;drawTfx('excl',0,h.x,y,18*s,28*s,0,k>.75?(1-k)/.25:1,'#ff5a3a');}
   // «K.O.» над поверженным
   else if(f.k==='ko'){const s=k<.15?k/.15*1.3:k<.25?1.3-(k-.15)*3:1;ctx.save();ctx.translate(f.x,f.y-k*20);ctx.scale(s,s);ctx.rotate(-.12);ctx.globalAlpha=k>.7?(1-k)/.3:1;
    ctx.font='900 26px Nunito,system-ui,sans-serif';ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#1b1b1b';ctx.strokeText('K.O.',0,0);ctx.fillStyle='#ffd23a';ctx.fillText('K.O.',0,0);ctx.restore();ctx.globalAlpha=1;}
  }
 }
};
// лужицы сока: белый спрайт, перекрашенный в цвет сока
function drawDecal(d,g=ctx){
 if(d.scorch){const w=d.r*2;drawTfx('scorch',0,d.x,d.y+2,w,w*.32,0,.6,'#3a2414',g);return;}
 const im=tinted('fx_juice_splat_'+(d.v||1),d.c);
 if(!im){g.fillStyle=d.c;g.globalAlpha=.7;g.beginPath();g.ellipse(d.x,d.y,d.r*1.6,d.r*.6,0,0,7);g.fill();g.globalAlpha=1;return;}
 const w=d.r*4.2,h=w*im.height/im.width;g.globalAlpha=.85;g.drawImage(im,d.x-w/2,d.y-h/2,w,h);g.globalAlpha=1;
}

// Лужицы и подпалины на полу неподвижны: каждую рисуем один раз в полосу-кэш вокруг экрана, а в кадре выводим её одним drawImage.
// Раньше все пятна (до 350) рисовались заново каждый кадр — до трети времени отрисовки в песочнице и в боях.
// Полоса пересобирается, когда камера уходит за её край, меняется пол, масштаб или список пятен.
const DECAL_MAX=350,DECAL_UP=90,DECAL_DOWN=60,DECAL_H=DECAL_UP+DECAL_DOWN;
function addDecal(d){decals.push(d);if(decals.length>DECAL_MAX+50){decals.splice(0,50);DecalLayer.src=null;}}
const DecalLayer={cv:null,g:null,x0:0,w:0,k:0,floor:0,src:null,n:0,
 draw(){
  if(!decals.length&&!this.n)return;
  const vx=camX+viewX,vw=viewW,k=Math.min(2,Math.max(1,Math.ceil(scale*dpr*2)/2));
  if(!this.cv||this.src!==decals||this.n>decals.length||this.floor!==FLOOR||this.k!==k||vx<this.x0||vx+vw>this.x0+this.w)this.rebuild(vx,vw,k);
  else while(this.n<decals.length)this.bake(decals[this.n++]);
  ctx.drawImage(this.cv,this.x0,FLOOR-DECAL_UP,this.w,DECAL_H);
 },
 rebuild(vx,vw,k){
  const m=Math.max(240,vw*.25);this.x0=Math.floor(vx-m);this.w=Math.ceil(vw+m*2);this.k=k;this.floor=FLOOR;this.src=decals;
  const W=Math.ceil(this.w*k),H=Math.ceil(DECAL_H*k);
  if(!this.cv){this.cv=document.createElement('canvas');this.g=this.cv.getContext('2d');}
  if(this.cv.width!==W||this.cv.height!==H){this.cv.width=W;this.cv.height=H;}else{this.g.setTransform(1,0,0,1,0,0);this.g.clearRect(0,0,W,H);}
  this.g.setTransform(k,0,0,k,-this.x0*k,(DECAL_UP-FLOOR)*k);
  this.n=0;while(this.n<decals.length)this.bake(decals[this.n++]);
 },
 bake(d){const r=d.scorch?d.r*1.1:d.r*2.2+4;if(d.x+r<this.x0||d.x-r>this.x0+this.w)return;drawDecal(d,this.g);this.g.globalAlpha=1;}
};
// метки над персонажем
// повязка команды: на всю ширину тела, толстая, с тёмной обводкой — чтобы команду было видно издалека
function drawHeadbandSprite(ent){
 const im=tinted('ovl_headband',TEAMC[ent.team]),ol=tinted('ovl_headband','#000000');if(!im)return false;
 const k=ent.s*(ent.fs||1),bw=ent.parts.torso.plugin.w/k*1.12; // ширина тела в координатах лица
 const w=bw/.6,h=Math.max(9,w*im.height/im.width*1.7),x=-w*.7,y=-11-h/2;
 ctx.save();if(ent.facing<0)ctx.scale(-1,1);
 ctx.drawImage(ol,x-1.4,y-1.4,w+2.8,h+2.8);ctx.drawImage(im,x,y,w,h);
 ctx.restore();
 return true;
}
function drawCrownSprite(){const im=SPR.ovl_crown;if(!im)return false;const w=20,h=w*im.height/im.width;ctx.drawImage(im,-w/2,-18-h,w,h);return true;}
function drawHpBarSprite(x,y,w,frac,color){
 const fr=SPR.ovl_hpbar_frame,fill=tinted('ovl_hpbar_fill',color);if(!fr||!fill)return false;
 const h=6;ctx.drawImage(fill,0,0,fill.width*Math.max(.02,frac),fill.height,x+1,y+1,(w-2)*frac,h-2);ctx.drawImage(fr,x,y,w,h);
 return true;
}
function drawPlayerArrowSprite(x,y){const im=SPR.ovl_player_arrow;if(!im)return false;const w=15,h=w*im.height/im.width;ctx.drawImage(im,x-w/2,y-h,w,h);return true;}
