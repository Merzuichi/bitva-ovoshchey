'use strict';
/* ============ локации: овощной мир ============ */
// Фоны рисуются кодом в мультяшном стиле, пока нет артов. Когда появятся bg_<id>.jpg / floor_<id>.png —
// их можно подставить в MAP_BG без изменений остальной игры.
const MAPS=[
 {id:'garden',n:'Огород',e:'🌻',lock:0,g:1,desc:'Грядки, забор и подсолнухи'},
 {id:'greenhouse',n:'Теплица',e:'🌿',lock:'ad',g:1,desc:'Логово Кактуса-аномалии'},
 {id:'market',n:'Рынок',e:'🧺',lock:300,g:1,desc:'Прилавки и ящики с овощами'},
 {id:'kitchen',n:'Кухня',e:'🍳',lock:'ad',g:1,desc:'Гигантская кухонная столешница'},
 {id:'moon',n:'Луна',e:'🌙',lock:600,g:.22,desc:'Бонус: слабая гравитация'},
 {id:'factory',n:'Завод',e:'🏭',lock:800,g:1,desc:'Чаны с зельем и трубы'},
];
const OUTLINE='#1b1b1b';
// детерминированный «шум» по номеру — чтобы декор не прыгал каждый кадр
const hash=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function strokeO(w){ctx.lineWidth=w||2.5;ctx.strokeStyle=OUTLINE;ctx.stroke();}
function vgrad(y0,y1,stops){const g=ctx.createLinearGradient(0,y0,0,y1);stops.forEach((c,i)=>g.addColorStop(i/(stops.length-1),c));return g;}
function cloud(x,y,s){ctx.fillStyle='#ffffffd9';for(const [dx,dy,r] of [[0,0,22],[22,-8,26],[48,0,20],[24,8,22]]){ctx.beginPath();ctx.arc(x+dx*s,y+dy*s,r*s,0,7);ctx.fill();}}

function bgGarden(fy){
 ctx.fillStyle=vgrad(0,fy,['#7fcbff','#c9ecff','#eaf8ff']);ctx.fillRect(0,0,WW,fy);
 // солнце
 const sx=WW*.86;ctx.fillStyle='#fff3b0';ctx.globalAlpha=.5;ctx.beginPath();ctx.arc(sx,90,62,0,7);ctx.fill();ctx.globalAlpha=1;
 ctx.fillStyle='#ffd84a';ctx.beginPath();ctx.arc(sx,90,40,0,7);ctx.fill();strokeO(3);
 // холмы и теплица вдали
 ctx.fillStyle='#a8dc8e';for(let i=0;i<8;i++){ctx.beginPath();ctx.ellipse(i*WW/6,fy-60,WW/7,70,0,Math.PI,0);ctx.fill();}
 const gx=WW*.7;ctx.fillStyle='#dff3f0cc';rr(gx,fy-200,170,140,6);ctx.fill();strokeO(2);
 ctx.beginPath();ctx.moveTo(gx-6,fy-200);ctx.lineTo(gx+85,fy-250);ctx.lineTo(gx+176,fy-200);ctx.closePath();ctx.fillStyle='#e9f8f5cc';ctx.fill();strokeO(2);
 ctx.strokeStyle='#9bbdb6';ctx.lineWidth=1.5;for(let x=gx+28;x<gx+170;x+=28){ctx.beginPath();ctx.moveTo(x,fy-200);ctx.lineTo(x,fy-60);ctx.stroke();}
 // забор
 ctx.fillStyle='#d2a066';rr(0,fy-58,WW,10,3);ctx.fill();strokeO(2);rr(0,fy-30,WW,10,3);ctx.fill();strokeO(2);
 for(let x=-6;x<WW+20;x+=30){ctx.fillStyle=hash(x)>.5?'#dcab70':'#cf9a5e';ctx.beginPath();ctx.moveTo(x,fy);ctx.lineTo(x,fy-72);ctx.lineTo(x+10,fy-84);ctx.lineTo(x+20,fy-72);ctx.lineTo(x+20,fy);ctx.closePath();ctx.fill();strokeO(2);}
 // подсолнухи
 for(let i=0;i*190<WW+190;i++){const x=80+i*190+hash(i)*40,h=120+hash(i+3)*50,top=fy-h;
  ctx.strokeStyle='#3f8f2c';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x,fy);ctx.lineTo(x,top);ctx.stroke();
  ctx.fillStyle='#5fb33f';ctx.beginPath();ctx.ellipse(x+14,fy-h*.45,14,6,-.5,0,7);ctx.fill();strokeO(1.5);
  ctx.fillStyle='#ffc93a';for(let a=0;a<12;a++){ctx.save();ctx.translate(x,top);ctx.rotate(a*Math.PI/6+Math.sin(frame*.02+i)*.05);ctx.beginPath();ctx.ellipse(0,-17,6,11,0,0,7);ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle=OUTLINE;ctx.stroke();ctx.restore();}
  ctx.fillStyle='#7a4a1e';ctx.beginPath();ctx.arc(x,top,11,0,7);ctx.fill();strokeO(2);}
 // пол: грядки
 ctx.fillStyle='#6b4423';ctx.fillRect(0,fy,WW,WH-fy);
 ctx.fillStyle='#5a381c';for(let x=20;x<WW;x+=140){ctx.beginPath();ctx.ellipse(x+50,fy+30,60,13,0,0,7);ctx.fill();}
 ctx.fillStyle='#4fa03a';for(let x=50;x<WW;x+=140){for(const d of [-20,0,20]){ctx.beginPath();ctx.ellipse(x+d,fy+20,5,9,d/40,0,7);ctx.fill();}}
 ctx.fillStyle='#5fae3c';ctx.fillRect(0,fy,WW,7);ctx.fillStyle='#4c9a30';for(let x=0;x<WW;x+=9)ctx.fillRect(x,fy-3-(hash(x)*4),3,6);
 ctx.fillStyle=OUTLINE;ctx.fillRect(0,fy+6,WW,2);
}
function bgGreenhouse(fy){
 ctx.fillStyle=vgrad(0,fy,['#cfeede','#b9e0c6','#a7d3b2']);ctx.fillRect(0,0,WW,fy);
 // лучи света сквозь стекло
 ctx.fillStyle='#ffffff';ctx.globalAlpha=.13;for(let i=0;i<5;i++){const x=i*WW/4;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+90,0);ctx.lineTo(x+260,fy);ctx.lineTo(x+120,fy);ctx.fill();}ctx.globalAlpha=1;
 // рама теплицы
 ctx.strokeStyle='#eef7f2';ctx.lineWidth=7;for(let x=0;x<WW;x+=130){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,fy);ctx.stroke();}
 for(let y=60;y<fy;y+=110){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WW,y);ctx.stroke();}
 ctx.strokeStyle='#8fb8a4';ctx.lineWidth=1.5;for(let x=0;x<WW;x+=130){ctx.beginPath();ctx.moveTo(x+4,0);ctx.lineTo(x+4,fy);ctx.stroke();}
 // подвесные горшки
 for(let i=0;i*240<WW;i++){const x=110+i*240,y=70+hash(i)*30;ctx.strokeStyle='#6d5a43';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,y);ctx.stroke();
  ctx.fillStyle='#4ea33a';for(let l=0;l<5;l++){ctx.beginPath();ctx.ellipse(x-16+l*8,y+26+Math.abs(l-2)*7,6,12,(l-2)*.4,0,7);ctx.fill();}
  ctx.fillStyle='#c96f3f';ctx.beginPath();ctx.moveTo(x-18,y);ctx.lineTo(x+18,y);ctx.lineTo(x+13,y+24);ctx.lineTo(x-13,y+24);ctx.closePath();ctx.fill();strokeO(2);}
 // стеллажи с рассадой
 for(const sy of [fy-190,fy-100]){ctx.fillStyle='#8a5a32';rr(0,sy,WW,12,3);ctx.fill();strokeO(2);
  for(let x=30;x<WW;x+=56){const k=hash(x+sy);ctx.fillStyle='#4fae3a';ctx.beginPath();ctx.ellipse(x-5,sy-26,5,9,-.5,0,7);ctx.ellipse(x+5,sy-28,5,9,.5,0,7);ctx.fill();
   if(k>.7){ctx.fillStyle='#3c7a3a';rr(x-5,sy-40,10,22,4);ctx.fill();strokeO(1.5);} // маленький кактус — намёк на злодея
   ctx.fillStyle='#c96f3f';ctx.beginPath();ctx.moveTo(x-11,sy-18);ctx.lineTo(x+11,sy-18);ctx.lineTo(x+8,sy);ctx.lineTo(x-8,sy);ctx.closePath();ctx.fill();strokeO(1.5);}}
 // бочки с «Озверином»
 for(let i=0;i<2;i++){const x=WW*(.18+i*.62);ctx.fillStyle='#7d3fb3';rr(x,fy-62,38,60,8);ctx.fill();strokeO(2.5);ctx.fillStyle='#b2f05a';ctx.beginPath();ctx.arc(x+19,fy-32,10,0,7);ctx.fill();strokeO(1.5);
  ctx.fillStyle='#b2f05a';ctx.globalAlpha=.5+.3*Math.sin(frame*.08+i);ctx.beginPath();ctx.arc(x+19,fy-70-((frame+i*30)%60)*.6,4,0,7);ctx.fill();ctx.globalAlpha=1;}
 // пол: терракотовая плитка
 ctx.fillStyle='#b8704a';ctx.fillRect(0,fy,WW,WH-fy);ctx.strokeStyle='#9a5a38';ctx.lineWidth=2;
 for(let y=fy+18;y<WH;y+=18){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WW,y);ctx.stroke();}
 for(let r=0;fy+r*18<WH;r++)for(let x=(r%2)*30;x<WW;x+=60){ctx.beginPath();ctx.moveTo(x,fy+r*18);ctx.lineTo(x,fy+r*18+18);ctx.stroke();}
 ctx.fillStyle='#d08a5e';ctx.fillRect(0,fy,WW,5);ctx.fillStyle=OUTLINE;ctx.fillRect(0,fy+5,WW,2);
}
function bgMarket(fy){
 ctx.fillStyle=vgrad(0,fy,['#ffc98a','#ffe2b8','#fff3df']);ctx.fillRect(0,0,WW,fy);
 // домики вдали
 for(let i=0;i*110<WW;i++){const h=110+hash(i)*90;ctx.fillStyle=hash(i+5)>.5?'#e8c39a':'#dcb48c';ctx.fillRect(i*110,fy-h-60,104,h);ctx.fillStyle='#c98f6a';ctx.beginPath();ctx.moveTo(i*110-6,fy-h-60);ctx.lineTo(i*110+52,fy-h-100);ctx.lineTo(i*110+110,fy-h-60);ctx.fill();
  ctx.fillStyle='#fff6d8';for(let wy=fy-h-40;wy<fy-80;wy+=36)ctx.fillRect(i*110+20,wy,18,22),ctx.fillRect(i*110+64,wy,18,22);}
 // гирлянда флажков
 const cols=['#ff5c5c','#ffcc33','#5fbf4a','#4da3ff'];
 ctx.strokeStyle='#6d5a43';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<=WW;x+=20){const y=40+Math.sin(x/WW*Math.PI*3)*14;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
 for(let x=10,i=0;x<WW;x+=36,i++){const y=40+Math.sin(x/WW*Math.PI*3)*14;ctx.fillStyle=cols[i%4];ctx.beginPath();ctx.moveTo(x-9,y);ctx.lineTo(x+9,y);ctx.lineTo(x,y+18);ctx.closePath();ctx.fill();strokeO(1.5);}
 // прилавки с навесами
 for(let i=0;i*300<WW+300;i++){const x=40+i*300,w=230,top=fy-210,c1=['#e8473b','#3f9e4a','#f08a24','#4d7fd6'][i%4];
  ctx.fillStyle='#8a5a32';ctx.fillRect(x+8,top+30,9,180);ctx.fillRect(x+w-17,top+30,9,180);
  // полосатый навес с фестонами
  for(let s=0;s<8;s++){ctx.fillStyle=s%2?'#fff4e6':c1;ctx.beginPath();ctx.moveTo(x+s*w/8,top);ctx.lineTo(x+(s+1)*w/8,top);ctx.lineTo(x+(s+1)*w/8+4,top+38);ctx.lineTo(x+s*w/8+4,top+38);ctx.closePath();ctx.fill();}
  ctx.beginPath();ctx.rect(x,top,w+4,38);strokeO(2.5);
  for(let s=0;s<8;s++){ctx.fillStyle=s%2?'#fff4e6':c1;ctx.beginPath();ctx.arc(x+4+s*w/8+w/16,top+38,w/16,0,Math.PI);ctx.fill();strokeO(2);}
  // прилавок
  ctx.fillStyle='#b37a45';rr(x,fy-92,w+4,92,4);ctx.fill();strokeO(2.5);ctx.strokeStyle='#8a5a32';ctx.lineWidth=2;for(let yy=fy-70;yy<fy;yy+=22){ctx.beginPath();ctx.moveTo(x+4,yy);ctx.lineTo(x+w,yy);ctx.stroke();}
  // горка овощей
  const pc=[['#e8473b','#b02a20'],['#f08a24','#c0610a'],['#5fbf4a','#3d8f2e'],['#7a3fb0','#4f2378'],['#f2c230','#c99a1e']][i%5];
  for(let r=0;r<3;r++)for(let k=0;k<7-r*2;k++){const cx=x+30+r*24+k*28,cy=fy-102-r*18;ctx.fillStyle=pc[(k+r)%2];ctx.beginPath();ctx.arc(cx,cy,13,0,7);ctx.fill();strokeO(2);ctx.fillStyle='#ffffff66';ctx.beginPath();ctx.arc(cx-4,cy-5,4,0,7);ctx.fill();}
  // весы с табличкой без текста
  ctx.fillStyle='#fff6d8';rr(x+w-60,top+48,46,28,4);ctx.fill();strokeO(2);ctx.fillStyle='#e8473b';rr(x+w-52,top+56,30,6,3);ctx.fill();}
 // пол: брусчатка
 ctx.fillStyle='#8d8780';ctx.fillRect(0,fy,WW,WH-fy);
 for(let r=0;fy+r*16<WH;r++)for(let x=(r%2)*14;x<WW;x+=28){ctx.fillStyle=hash(x*3+r)>.5?'#a39d95':'#999289';rr(x+2,fy+r*16+2,24,12,5);ctx.fill();}
 ctx.fillStyle='#b8b1a8';ctx.fillRect(0,fy,WW,5);ctx.fillStyle=OUTLINE;ctx.fillRect(0,fy+5,WW,2);
}
function bgKitchen(fy){
 // плитка на стене
 ctx.fillStyle='#f4efe4';ctx.fillRect(0,0,WW,fy);ctx.strokeStyle='#e0d8c8';ctx.lineWidth=2;
 for(let x=0;x<WW;x+=44){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,fy);ctx.stroke();}
 for(let y=0;y<fy;y+=44){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WW,y);ctx.stroke();}
 // фартук из синей плитки у столешницы
 ctx.fillStyle='#bcd8f2';ctx.fillRect(0,fy-70,WW,70);ctx.strokeStyle='#9fc2e3';for(let x=0;x<WW;x+=35){ctx.beginPath();ctx.moveTo(x,fy-70);ctx.lineTo(x,fy);ctx.stroke();}ctx.beginPath();ctx.moveTo(0,fy-35);ctx.lineTo(WW,fy-35);ctx.stroke();
 // верхние шкафчики
 ctx.fillStyle='#c98f5a';rr(-10,-10,WW+20,130,8);ctx.fill();strokeO(3);
 for(let x=20;x<WW;x+=170){ctx.fillStyle='#d9a06b';rr(x,10,150,96,8);ctx.fill();strokeO(2);ctx.fillStyle='#8a5a32';rr(x+66,84,18,6,3);ctx.fill();}
 // окно
 const wx=WW*.62,wy=150;ctx.fillStyle='#9fd8ff';rr(wx,wy,220,150,8);ctx.fill();cloud(wx+40,wy+50,.5);cloud(wx+130,wy+80,.4);strokeO(4);
 ctx.strokeStyle='#ffffff';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(wx+110,wy);ctx.lineTo(wx+110,wy+150);ctx.moveTo(wx,wy+75);ctx.lineTo(wx+220,wy+75);ctx.stroke();
 ctx.fillStyle='#ff8a80';for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(wx+110+s*140,wy-10);ctx.quadraticCurveTo(wx+110+s*120,wy+90,wx+110+s*150,wy+170);ctx.lineTo(wx+110+s*112,wy+170);ctx.quadraticCurveTo(wx+110+s*100,wy+80,wx+110+s*112,wy-10);ctx.closePath();ctx.fill();strokeO(2);}
 // половник и сковородка на рейлинге
 ctx.strokeStyle='#888';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(WW*.08,150);ctx.lineTo(WW*.42,150);ctx.stroke();
 ctx.fillStyle='#3a3d44';ctx.beginPath();ctx.arc(WW*.15,230,38,0,7);ctx.fill();strokeO(3);ctx.fillStyle='#2a2d33';rr(WW*.15-5,150,10,48,4);ctx.fill();
 ctx.fillStyle='#c9ced8';rr(WW*.3-4,150,8,90,4);ctx.fill();strokeO(2);ctx.beginPath();ctx.arc(WW*.3,250,18,0,Math.PI);ctx.fill();strokeO(2);
 // подставка для ножей и банка с солёными огурцами (мрачная шутка для огурцов)
 const kx=WW*.08;ctx.fillStyle='#8a5a32';ctx.beginPath();ctx.moveTo(kx,fy);ctx.lineTo(kx+20,fy-110);ctx.lineTo(kx+90,fy-110);ctx.lineTo(kx+80,fy);ctx.closePath();ctx.fill();strokeO(3);
 for(let i=0;i<3;i++){ctx.fillStyle='#2a2d33';rr(kx+28+i*20,fy-150,12,44,4);ctx.fill();strokeO(1.5);}
 const jx=WW*.4;ctx.fillStyle='#d8f0f8aa';rr(jx,fy-150,90,150,14);ctx.fill();strokeO(3);ctx.fillStyle='#d9a06b';rr(jx-4,fy-166,98,20,6);ctx.fill();strokeO(2.5);
 ctx.fillStyle='#5f9f3c';for(let i=0;i<4;i++){rr(jx+10+i*19,fy-130+hash(i)*20,16,100,8);ctx.fill();strokeO(1.5);}
 ctx.fillStyle='#e9f6c888';ctx.fillRect(jx+3,fy-120,84,117);
 // пол: деревянная столешница
 ctx.fillStyle='#c99a63';ctx.fillRect(0,fy,WW,WH-fy);ctx.strokeStyle='#b0824f';ctx.lineWidth=2;
 for(let y=fy+14;y<WH;y+=14){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WW,y);ctx.stroke();}
 for(let r=0;fy+r*14<WH;r++)for(let x=hash(r)*120;x<WW;x+=180+hash(x+r)*60){ctx.beginPath();ctx.moveTo(x,fy+r*14);ctx.lineTo(x,fy+r*14+14);ctx.stroke();}
 ctx.fillStyle='#ddb07a';ctx.fillRect(0,fy,WW,6);ctx.fillStyle=OUTLINE;ctx.fillRect(0,fy+6,WW,2);
}
const lunarStars=Array.from({length:120},()=>({x:Math.random(),y:Math.random()*.8,r:Math.random()*1.5+.3}));
function bgMoon(fy){
 ctx.fillStyle='#0b0e1c';ctx.fillRect(0,0,WW,WH);ctx.fillStyle='#fff';
 for(const s of lunarStars){ctx.globalAlpha=.4+.6*Math.abs(Math.sin(frame*.01+s.x*50));ctx.beginPath();ctx.arc(s.x*WW,s.y*fy,s.r,0,7);ctx.fill();}
 ctx.globalAlpha=1;ctx.fillStyle='#3a6fd8';ctx.beginPath();ctx.arc(WW*.82,120,46,0,7);ctx.fill();strokeO(3);ctx.fillStyle='#3fae5a';ctx.beginPath();ctx.arc(WW*.82-12,110,18,0,7);ctx.fill();
 ctx.fillStyle='#9a9aa5';ctx.fillRect(0,fy,WW,WH-fy);ctx.fillStyle='#82828e';for(let x=30;x<WW;x+=140){ctx.beginPath();ctx.ellipse(x,fy+25,30,8,0,0,7);ctx.fill();}
 ctx.fillStyle=OUTLINE;ctx.fillRect(0,fy,WW,2);
}
const MAP_BG={garden:bgGarden,greenhouse:bgGreenhouse,market:bgMarket,kitchen:bgKitchen,moon:bgMoon,factory:bgKitchen};
// Фон из артов: bg_<id>.jpg (2560×1440, пол по задумке на 85% высоты) + бесшовный пол floor_<id>.png (512×256, линия ходьбы — верхний край).
// Фон двигается медленнее камеры (параллакс) и повторяется зеркально, чтобы стыки не были видны.
// Если картинок нет — рисуем процедурный фон.
const BG_FLOOR_LINE=.85,PARALLAX=.28;
// облака огорода — отдельные спрайты: плывут сами, каждое со своей скоростью; v — единицы в секунду
// подсолнухи огорода — отдельные спрайты, стоят на линии земли и качаются: стебель чуть-чуть, голова сильнее
const SUNFLOWERS=[{x:.13,h:.36,ph:0},{x:.24,h:.28,ph:1.7},{x:.62,h:.33,ph:3.1},{x:.8,h:.27,ph:4.6}];
const CLOUDS=[{k:1,x:.08,y:.24,w:.2,v:9},{k:2,x:.42,y:.4,w:.14,v:6},{k:3,x:.74,y:.31,w:.17,v:12}]; // y — доля высоты от верха экрана до земли
const FLOWER_NECK=0.605;
// рынок: дым из труб и овощи, которые иногда открывают глаза и следят за героем (доли картинки фона; r — радиус глаза)
const CHIMNEYS=[{x:.0875,y:.298,ph:.1},{x:.3145,y:.352,ph:.55},{x:.8055,y:.358,ph:.3},{x:.9695,y:.254,ph:.8}];
// живые овощи на прилавках: [вид, x, низ овоща y, ширина, наклон] в долях картинки фона
const LIVE_VEG=[['tomato',.1275,.63,.027,0],['tomato',.094,.641,.024,.08],['tomato',.15,.638,.023,-.08],['tomato',.06,.697,.023,0],['tomato',.19,.697,.023,.05],['tomato',.066,.76,.023,0],
 ['cabbage',.531,.654,.037,0],['cabbage',.512,.698,.035,-.05],['cabbage',.546,.7,.037,.05],['corn',.592,.685,.02,-.05],['corn',.615,.685,.02,.07],['carrot',.44,.695,.03,-.35],['carrot',.47,.685,.03,.3],
 ['eggplant',.758,.698,.036,-.25],['eggplant',.785,.698,.036,-.2],['cabbage',.896,.648,.031,0],['cabbage',.908,.698,.033,0],['cabbage',.943,.698,.035,0],['cabbage',.897,.757,.033,0]].map(([k,x,y,w,r],i)=>({k,x,y,w,r,ph:hash(i*13+7)*17,per:9+hash(i*17+3)*9,sd:hash(i*5+1)*6}));
function drawChimneySmoke(px,py,w,h,ph){
 const im=SPR.fx_smoke_1;if(!im)return;const t=performance.now()/1000;
 for(let j=0;j<7;j++){const a=((t*.09+ph)+j/7)%1,sz=w*(.012+a*.04),sx=px+Math.sin(a*5+j+ph*9)*w*.006+a*w*.022,sy=py-a*h*.17;
  ctx.globalAlpha=.55*Math.min(1,a*7)*(1-a);ctx.drawImage(im,sx-sz/2,sy-sz/2,sz,sz);}
 ctx.globalAlpha=1;
}
// овощ всё время дышит; время от времени просыпается: подпрыгивает, смотрит на героя, моргает и улыбается
function drawLiveVeg(f,px,py,w,mir){
 const im=SPR['veg_'+f.k];if(!im)return;
 const t=performance.now()/1000,c=(t+f.ph)%f.per,dur=3.4,awake=c<dur,vw=w*f.w,vh=vw*im.height/im.width;
 const open=awake?Math.min(1,c/.2,(dur-c)/.2):0;
 // прыжки: два подскока в начале пробуждения, со сжатием при приземлении
 const hopT=awake?clamp(c/1.1,0,1):1,hop=awake&&hopT<1?Math.abs(Math.sin(hopT*Math.PI*2)):0,land=awake&&hopT<1?Math.max(0,.25-hop)*.5:0;
 const br=Math.sin(t*2.2+f.sd);
 const sy=1+br*.018-land*.5+hop*.06,sx=1-br*.014+land*.5-hop*.03;
 const hero=Run&&Run.hero&&!Run.hero.removed&&screen==='play'?Run.hero.parts.torso.position:null,tx=hero?hero.x-camX:WW/2,ty=hero?hero.y:FLOOR-60;
 const side=clamp((tx-px)/(w*.25),-1,1),lean=(mir?-f.r:f.r)+Math.sin(t*1.3+f.sd)*.025+open*side*.1;
 ctx.save();ctx.translate(px,py-hop*vh*.34);ctx.rotate(lean);ctx.scale(sx,sy);
 ctx.drawImage(im,-vw/2,-vh,vw,vh);
 if(open>0){
  // лицо рисуем поверх: глаза следят за героем, рот улыбается
  const r=vw*.13,fy=-vh*(f.k==='carrot'||f.k==='corn'?.62:f.k==='eggplant'?.42:.52),blink=Math.abs(c-1.9)<.08?.1:1,oy=Math.max(.05,open*blink);
  for(const s of [-1,1]){
   const ex=s*r*1.1,wx=px+ex,wy=py+fy,d=Math.hypot(tx-wx,ty-wy)||1,lx=(tx-wx)/d*r*.42,ly=(ty-wy)/d*r*.42;
   ctx.save();ctx.translate(ex,fy);ctx.scale(1,oy);
   const g=ctx.createRadialGradient(-r*.25,-r*.3,r*.1,0,0,r);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#e8ddcf');
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();ctx.lineWidth=Math.max(.7,r*.12);ctx.strokeStyle='rgba(90,50,24,.7)';ctx.stroke();
   ctx.fillStyle='#2c1a10';ctx.beginPath();ctx.arc(lx,ly,r*.52,0,7);ctx.fill();
   ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(lx-r*.17,ly-r*.2,r*.16,0,7);ctx.fill();
   ctx.restore();
  }
  ctx.globalAlpha=open;ctx.lineCap='round';ctx.strokeStyle='#5a2c14';ctx.lineWidth=Math.max(.9,r*.26);ctx.beginPath();
  if(hop>.3){ctx.fillStyle='#7a2a1c';ctx.ellipse(0,fy+r*1.5,r*.5,r*.42,0,0,7);ctx.fill();}else{ctx.arc(0,fy+r*.95,r*.62,.25,Math.PI-.25);ctx.stroke();}
  ctx.lineCap='butt';ctx.globalAlpha=1;
 }
 ctx.restore();
}
// завод: зелье в сосудах колышется и пузырится, шестерни крутятся, стрелки дрожат. Координаты — в сетке 1400×788 картинки фона
const FACTORY_VESSELS=[{e:[125,430,128,112],bot:505,s:422,n:9},{e:[327,578,71,71],bot:625,s:556,n:5},{p:[[1076,538],[1148,538],[1180,598],[1170,605],[1056,605],[1045,598]],bot:605,s:540,n:5},{e:[1268,503,48,74],bot:575,s:487,n:5}];
const FACTORY_COGS=[{k:'cog_small',x:476,y:178,r:62,v:-.7},{k:'cog_big',x:975,y:115,r:100,v:.43}];
const FACTORY_GAUGES=[{x:140,y:590,r:25,ph:0},{x:1365,y:443,r:21,ph:2.4}];
function drawFactoryLife(x,y,w,h,mir){
 const u=w/1400,t=performance.now()/1000,X=v=>x+(mir?1400-v:v)*u,Y=v=>y+v*u;
 for(const c of FACTORY_COGS){const im=SPR[c.k],px=X(c.x),py=Y(c.y),R=c.r*u;
  // шестерня сидит на круглой стальной плите
  const g=ctx.createRadialGradient(px-R*.3,py-R*.3,R*.2,px,py,R*1.02);g.addColorStop(0,'#8fc4bc');g.addColorStop(1,'#4c8a86');ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py,R*1.02,0,7);ctx.fill();
  if(im){ctx.save();ctx.translate(px,py);ctx.rotate(t*c.v*(mir?-1:1));ctx.drawImage(im,-R,-R,R*2,R*2);ctx.restore();}}
 for(const v of FACTORY_VESSELS){
  ctx.save();ctx.beginPath();
  if(v.e)ctx.ellipse(X(v.e[0]),Y(v.e[1]),v.e[2]*u,v.e[3]*u,0,0,7);else v.p.forEach((q,i)=>i?ctx.lineTo(X(q[0]),Y(q[1])):ctx.moveTo(X(q[0]),Y(q[1])));
  ctx.closePath();ctx.clip();
  const x0=(v.e?v.e[0]-v.e[2]:v.p[5][0]),x1=(v.e?v.e[0]+v.e[2]:v.p[2][0]),wave=q=>Y(v.s+Math.sin(q*.035+t*1.8+v.s)*4+Math.sin(q*.07-t*1.1)*2);
  ctx.beginPath();ctx.moveTo(X(x0),Y(v.bot));for(let q=x0;q<=x1+6;q+=6)ctx.lineTo(X(q),wave(q));ctx.lineTo(X(x1+6),Y(v.bot));ctx.closePath();
  const g=ctx.createLinearGradient(0,Y(v.s),0,Y(v.bot));g.addColorStop(0,'#dcf53f');g.addColorStop(.35,'#b4ea24');g.addColorStop(1,'#84d416');ctx.fillStyle=g;ctx.fill();
  ctx.strokeStyle='rgba(245,255,190,.9)';ctx.lineWidth=2.4*u;ctx.beginPath();for(let q=x0;q<=x1+6;q+=6)q===x0?ctx.moveTo(X(q),wave(q)):ctx.lineTo(X(q),wave(q));ctx.stroke();
  for(let i=0;i<v.n;i++){const p=hash(i*7+v.s),q=(t*(.1+p*.14)+p*3)%1,r=(3+p*7)*u,bx=X(x0+(x1-x0)*(.1+.8*hash(i*5+v.s+1))+Math.sin(t*1.4+i)*4),by=Y(v.bot-(v.bot-v.s)*q);
   ctx.globalAlpha=.7*Math.min(1,(1-q)*5);ctx.fillStyle='#eaff9a';ctx.beginPath();ctx.arc(bx,by,r,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.globalAlpha*=.8;ctx.beginPath();ctx.arc(bx-r*.3,by-r*.35,r*.3,0,7);ctx.fill();}
  ctx.globalAlpha=1;ctx.restore();
 }
 for(const n of FACTORY_GAUGES){const a=-2.1+Math.sin(t*.8+n.ph)*.55+Math.sin(t*6.5+n.ph)*.05,L=n.r*u*.92,px=X(n.x),py=Y(n.y);
  ctx.save();ctx.translate(px,py);ctx.rotate(a+Math.PI/2+.7);ctx.fillStyle='#d9432e';ctx.beginPath();ctx.moveTo(-2.6*u,0);ctx.lineTo(0,-L);ctx.lineTo(2.6*u,0);ctx.closePath();ctx.fill();ctx.restore();
  ctx.fillStyle='#6b4a34';ctx.beginPath();ctx.arc(px,py,3.6*u,0,7);ctx.fill();}
}
function drawSunflower(x,fy,h,ph){
 const im=SPR.sunflower;if(!im)return;
 const tm=performance.now()/1000,w=h*im.width/im.height,sway=Math.sin(tm*1.25+ph)*.035+Math.sin(tm*2.3+ph*2)*.012,nod=Math.sin(tm*1.25+ph-.6)*.07;
 const sh=im.height*(1-FLOWER_NECK),hs=h*(1-FLOWER_NECK),hh=h*FLOWER_NECK;
 ctx.save();ctx.translate(x,fy+2);ctx.rotate(sway);
 ctx.drawImage(im,0,im.height*FLOWER_NECK,im.width,sh,-w/2,-hs,w,hs);        // стебель с листьями
 ctx.translate(0,-hs+h*.01);ctx.rotate(nod);
 ctx.drawImage(im,0,0,im.width,im.height*FLOWER_NECK+1,-w/2,-hh,w,hh+1);     // голова на шее
 ctx.restore();
}
const sandboxSkyColors={};
const sandboxSkyJoins={};
function sandboxSkyJoin(bg){
 if(sandboxSkyJoins[mapId])return sandboxSkyJoins[mapId];
 const fraction=mapId==='moon'?.06:mapId==='market'?.08:.12,sourceHeight=bg.height*fraction;
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.max(1,Math.round(sourceHeight*1024/bg.width));
 const g=canvas.getContext('2d');g.drawImage(bg,0,0,bg.width,sourceHeight,0,0,canvas.width,canvas.height);
 const mask=g.createLinearGradient(0,0,0,canvas.height);mask.addColorStop(0,'rgba(0,0,0,0)');mask.addColorStop(1,'rgba(0,0,0,1)');
 g.globalCompositeOperation='destination-in';g.fillStyle=mask;g.fillRect(0,0,canvas.width,canvas.height);
 return sandboxSkyJoins[mapId]={canvas,sourceHeight,fraction};
}
function drawSandboxBg(fy,bg){
 // Size every layer in world units; the shared camera transform zooms scenery and actors together.
 const k=Math.max(sceneW/bg.width,fy/(bg.height*BG_FLOOR_LINE),VH/bg.height)*(LW>sceneW+1?1.3:1);
 const w=bg.width*k,h=bg.height*k,y=fy-h*BG_FLOOR_LINE,left=viewX,right=viewX+viewW,off=-camX*PARALLAX;
 if(!sandboxSkyColors[mapId]){
  const sample=document.createElement('canvas');sample.width=32;sample.height=4;
  const g=sample.getContext('2d');g.drawImage(bg,0,0,bg.width,Math.min(16,bg.height),0,0,32,4);
  const pixels=g.getImageData(0,0,32,4).data;let red=0,green=0,blue=0,weight=0;
  for(let i=0;i<pixels.length;i+=4){const a=pixels[i+3]/255;red+=pixels[i]*a;green+=pixels[i+1]*a;blue+=pixels[i+2]*a;weight+=a;}
  sandboxSkyColors[mapId]=weight?`rgb(${Math.round(red/weight)},${Math.round(green/weight)},${Math.round(blue/weight)})`:'#53cef4';
 }
 ctx.fillStyle=sandboxSkyColors[mapId];ctx.fillRect(left-1,viewY-1,viewW+2,viewH+2);
 const ceiling=SPR['bg_'+mapId+'_upper']||null;
 const skyJoin=ceiling&&['garden','market','moon'].includes(mapId)?sandboxSkyJoin(bg):null;
 const overlap=skyJoin?h*skyJoin.fraction:0;
 const first=Math.floor((left-off)/w);
 for(let i=first,x=off+first*w;x<right;x+=w,i++){
  ctx.save();ctx.translate(i%2?x+w:x,y);if(i%2)ctx.scale(-1,1);
  if(ceiling){
   const sourceHeight=ceiling.height*(mapId==='garden'?.62:1),upperHeight=w*sourceHeight/ceiling.width;
   for(let top=overlap;top>viewY-y;top-=upperHeight)ctx.drawImage(ceiling,0,0,ceiling.width,sourceHeight,0,top-upperHeight,w+.5,upperHeight+.5);
  }
  if(skyJoin){
   ctx.drawImage(bg,0,skyJoin.sourceHeight,bg.width,bg.height-skyJoin.sourceHeight,0,overlap,w+.5,h-overlap);
   ctx.drawImage(skyJoin.canvas,0,0,w+.5,overlap+.5);
  }else ctx.drawImage(bg,0,0,w+.5,h);
  ctx.restore();
 }
 // Extend the sky with a smooth colour transition, rather than stretching a noisy pixel row.
 if(!ceiling&&viewY<y+h*.16){
  const fade=Math.max(48,h*.16),blend=ctx.createLinearGradient(0,y,0,y+fade);
  blend.addColorStop(0,sandboxSkyColors[mapId]);blend.addColorStop(1,sandboxSkyColors[mapId].replace('rgb(','rgba(').replace(')',',0)'));
  ctx.fillStyle=blend;ctx.fillRect(left-1,y,viewW+2,fade);
 }
 if(mapId==='garden'){
  const tm=performance.now()/1000;
  for(const cloud of CLOUDS){const im=SPR['cloud'+cloud.k];if(!im)continue;const width=sceneW*cloud.w,height=width*im.height/im.width,span=sceneW+width*2,base=((cloud.x*span+tm*cloud.v)%span+span)%span-width;
   for(let x=base+Math.floor((left-base)/span)*span;x<right;x+=span)ctx.drawImage(im,x,fy*cloud.y-height/2,width,height);
  }
 }
 for(let i=first,x=off+first*w;x<right;x+=w,i++){
  if(mapId==='garden')for(const f of SUNFLOWERS)drawSunflower(i%2?x+w*(1-f.x):x+w*f.x,fy,VH*f.h,f.ph);
  if(mapId==='factory')drawFactoryLife(x,y,w,h,!!(i%2));
  if(mapId==='market'){for(const f of CHIMNEYS)drawChimneySmoke(i%2?x+w*(1-f.x):x+w*f.x,y+h*f.y,w,h,f.ph);for(const f of LIVE_VEG)drawLiveVeg(f,i%2?x+w*(1-f.x):x+w*f.x,y+h*f.y,w,!!(i%2));}
 }
 const fence=fenceStrip();if(mapId==='garden'&&fence){const fh=VH*.105,fw=fh*fence.width/fence.height;
  for(let x=off+Math.floor((left-off)/fw)*fw;x<right;x+=fw){ctx.drawImage(fence,x,fy-fh+3,fw+.5,fh);ctx.drawImage(fence,0,fence.height-3,fence.width,3,x,fy+2,fw+.5,FENCE_DOWN);}
 }
}
function drawMapBg(fy){
 const bg=nightBg('bg_'+mapId)||SPR['bg_'+mapId],fl=SPR['floor_'+mapId];
 if(!bg||!fl){(MAP_BG[mapId]||MAP_BG.garden)(fy);return;}
 if(screen==='play'&&Run.def?.climb){Climb.background();return;}
 if(sandboxBuildView()||(screen==='sandbox'&&SbPlay.ent)){drawSandboxBg(fy,bg);return;}
 // на длинных уровнях фон чуть крупнее экрана и за весь уровень проезжает ровно свой запас — без повторов
 const long=LW>WW+1,k=Math.max(WW/bg.width,fy/(bg.height*BG_FLOOR_LINE),VH/bg.height)*(long?1.3:1),w=bg.width*k,h=bg.height*k,y=fy-h*BG_FLOOR_LINE;
 const off=long?-camX*Math.min(PARALLAX,(w-WW)/(LW-WW)):(WW-w)/2;
 let i=Math.floor(-off/w);
 const paintClouds=()=>{if(mapId!=='garden')return;const tm=performance.now()/1000;for(const f of CLOUDS){const im=SPR['cloud'+f.k];if(!im)continue;const cw=WW*f.w,ch=cw*im.height/im.width,span=WW+cw*2,cx=((f.x*span+tm*f.v)%span+span)%span-cw;ctx.drawImage(im,cx,fy*f.y-ch/2,cw,ch);}};
 for(let pass=0;pass<2;pass++){if(pass===1)paintClouds();i=Math.floor(-off/w);
 for(let x=off+i*w;x<WW;x+=w,i++){
  if(pass===1){if(mapId==='garden')for(const f of SUNFLOWERS)drawSunflower(i%2?x+w*(1-f.x):x+w*f.x,fy,VH*f.h,f.ph);
   if(mapId==='factory')drawFactoryLife(x,y,w,h,!!(i%2));
   if(mapId==='market'){for(const f of CHIMNEYS)drawChimneySmoke(i%2?x+w*(1-f.x):x+w*f.x,y+h*f.y,w,h,f.ph);for(const f of LIVE_VEG)drawLiveVeg(f,i%2?x+w*(1-f.x):x+w*f.x,y+h*f.y,w,!!(i%2));}
   continue;}
  if(i%2){ctx.save();ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(bg,0,0,w+.5,h);ctx.restore();}
  else ctx.drawImage(bg,x,y,w+.5,h);
 }
 }
 // забор отдельным слоем: подсолнухи стоят за ним
 const fen=fenceStrip();if(mapId==='garden'&&fen){const fh=VH*.105,fw=fh*fen.width/fen.height;for(let fx=(off%fw)-fw;fx<WW;fx+=fw){ctx.drawImage(fen,fx,fy-fh+3,fw+.5,fh);ctx.drawImage(fen,0,fen.height-3,fen.width,3,fx,fy+2,fw+.5,FENCE_DOWN);}}
}
// забор собирается один раз из штакетин спрайта: n — целая, t — покосилась, b — сломана, m — выпала, g — выпала вместе с верхней перекладиной
const FENCE_DOWN=44,PIT_WALL_TOP=30;  // на сколько забор уходит ниже линии земли и где в яме начинается задняя стенка
const FENCE_PLAN='nnnntnnnbnnnnmnnnnbntnnnnngnnnnbnnnmnntn';
let fenceCv=null;
function fenceStrip(){
 const im=SPR.fence_garden;if(!im)return null;if(fenceCv)return fenceCv;
 const k=im.width/720,S=.5,PITCH=72,H=185,c=document.createElement('canvas');c.width=PITCH*FENCE_PLAN.length;c.height=H;const g=c.getContext('2d');
 const railTop=115/370*H,railBottom=305/370*H,railMid=(160+260)/2/370*H;
 // перекладины: верхняя и нижняя половины кусочка между штакетинами
 const rail=(x,w,top)=>{const sy=top?0:im.height*.5,sh=im.height*.5,dy=top?0:H*.5;g.drawImage(im,125*k,sy,40*k,sh,x,dy,w,H*.5);};
 [...FENCE_PLAN].forEach((p,i)=>{
  const x=i*PITCH;rail(x,PITCH,false);
  if(p!=='g'){rail(x,PITCH,true);return;}
  // обломки верхней перекладины торчат с двух сторон
  for(const [sx,sw,d] of [[x,20,1],[x+PITCH-14,14,-1]]){g.save();g.beginPath();const e=d>0?sx+sw:sx,o=d>0?sx:sx+sw;g.moveTo(o,0);g.lineTo(e,0);g.lineTo(e-d*6,railTop+6);g.lineTo(e+d*2,railTop+13);g.lineTo(e-d*5,railTop+20);g.lineTo(e,H*.5);g.lineTo(o,H*.5);g.closePath();g.clip();rail(sx,sw,true);g.restore();}
 });
 [...FENCE_PLAN].forEach((p,i)=>{
  if(p==='m'||p==='g')return;
  const x=i*PITCH,pw=94*S,ph=H,t=document.createElement('canvas');t.width=Math.ceil(pw);t.height=ph;const q=t.getContext('2d');
  q.drawImage(im,25*k,0,94*k,im.height,0,0,pw,ph);
  // немного разный оттенок, чтобы штакетины не были копиями
  const shade=(hash(i*7+3)-.5)*.14;q.globalCompositeOperation='source-atop';q.fillStyle=shade>0?`rgba(255,226,170,${shade})`:`rgba(110,40,0,${-shade})`;q.fillRect(0,0,pw,ph);
  if(p==='b'){
   // верх отломан неровно, на изломе светлое дерево
   const b=ph*(.26+hash(i*5)*.2),pts=[[0,b+8],[pw*.2,b-7],[pw*.38,b+6],[pw*.58,b-11],[pw*.78,b+3],[pw,b-5]];
   const jag=()=>{q.beginPath();pts.forEach(([a,d],n)=>n?q.lineTo(a,d):q.moveTo(a,d));};
   q.globalCompositeOperation='destination-out';q.fillStyle='#000';jag();q.lineTo(pw,0);q.lineTo(0,0);q.closePath();q.fill();
   q.globalCompositeOperation='source-atop';q.strokeStyle='#ffd9a3';q.lineWidth=5;q.lineJoin='round';jag();q.stroke();
  }
  const drop=(hash(i*11+1)*5)|0;
  g.save();g.translate(x+PITCH/2,railMid);if(p==='t')g.rotate((hash(i)>.5?1:-1)*(.13+hash(i+9)*.07));g.drawImage(t,-pw/2,-railMid+drop);g.restore();
 });
 // v523: готовую полосу переводим в ImageBitmap — холст-источник при каждом кадре обходится дороже неизменяемой картинки
 if(typeof createImageBitmap==='function')createImageBitmap(c).then(b=>{if(fenceCv===c)fenceCv=b;}).catch(()=>{});
 return fenceCv=c;
}
// пол рисуется в координатах мира кусками между ямами; в яме — тёмный провал
function drawFloor(fy){
 const fl=SPR['floor_'+mapId];if(!fl)return;
 if(sandboxBuildView()&&!PITS.length){
  const th=Math.max(VH-fy,60),tw=th*fl.width/fl.height,x0=camX+viewX,x1=x0+viewW;
  ctx.save();ctx.beginPath();ctx.rect(x0-1,fy,viewW+2,Math.max(th,viewY+viewH-fy)+th);ctx.clip();
  for(let y=fy;y<viewY+viewH+th;y+=th)for(let x=Math.floor(x0/tw)*tw;x<x1;x+=tw)ctx.drawImage(fl,x,y,tw+.5,th+.5);
  ctx.restore();if(mapId==='factory')drawBelts(fy);return;
 }
 const th=Math.max(VH-fy,60),tw=th*fl.width/fl.height,x0=camX-tw,x1=camX+WW+tw;
 const near=PITS.filter(([a,b])=>b>=x0&&a<=x1),lipR=(a,b)=>Math.min(6,(b-a)/4);
 // земля вырезается по краю обрыва с маленьким скруглением; стенка ямы заполняет его целиком, сквозь угол фон не виден
 ctx.save();ctx.beginPath();ctx.rect(x0,fy-2,x1-x0,th+6);
 for(const [a,b] of near){const r=lipR(a,b);ctx.moveTo(a-r,fy-2);ctx.lineTo(a-r,fy);ctx.quadraticCurveTo(a,fy,a,fy+r);ctx.lineTo(a,fy+th+4);ctx.lineTo(b,fy+th+4);ctx.lineTo(b,fy+r);ctx.quadraticCurveTo(b,fy,b+r,fy);ctx.lineTo(b+r,fy-2);ctx.closePath();}
 ctx.clip('evenodd');
 for(let x=Math.floor(x0/tw)*tw;x<x1;x+=tw)ctx.drawImage(fl,x,fy,tw+.5,th);
 // земля у края постепенно темнеет, и обрыв не выглядит вырезанным
 for(const [a,b] of near){
  const fe=Math.min(44,(a-(PITS.filter(q=>q[1]<=a).map(q=>q[1]).pop()??a-200))/2);
  const fb=PITS.find(q=>q[0]>=b),fe2=Math.min(44,((fb?fb[0]:b+200)-b)/2);
  for(const [x,d,w] of [[a,-1,fe],[b,1,fe2]]){const h=ctx.createLinearGradient(x,0,x+d*w,0);h.addColorStop(0,'rgba(58,28,10,.5)');h.addColorStop(.55,'rgba(58,28,10,.14)');h.addColorStop(1,'rgba(58,28,10,0)');ctx.fillStyle=h;for(let row=0;row<8;row++){ctx.globalAlpha=.25+.75*row/7;ctx.fillRect(Math.min(x,x+d*w),fy+row*5,w,row<7?5:th);}ctx.globalAlpha=1;}
 }
 ctx.restore();
 if(mapId==='factory')drawBelts(fy);
 for(const [a,b] of near){
  // яма: задняя стенка — та же земля без травы, верх скруглён навстречу обрывам, колья торчат над краем
  const r=lipR(a,b),wt=mapId==='garden'?PIT_WALL_TOP:0;
  const hole=()=>{ctx.beginPath();ctx.moveTo(a-r,fy);ctx.quadraticCurveTo(a,fy,a,fy+r);ctx.lineTo(a,fy+th+2);ctx.lineTo(b,fy+th+2);ctx.lineTo(b,fy+r);ctx.quadraticCurveTo(b,fy,b+r,fy);ctx.closePath();};
  ctx.save();hole();ctx.clip();ctx.beginPath();ctx.rect(a-r,fy+wt,b-a+2*r,th);ctx.clip();
  const sy=fl.height*.3;for(let x=Math.floor((a-r)/tw)*tw;x<b+r;x+=tw)ctx.drawImage(fl,0,sy,fl.width,fl.height-sy,x,fy,tw+.5,th);
  const dark=ctx.createLinearGradient(0,fy,0,fy+th);dark.addColorStop(0,'rgba(58,28,10,.3)');dark.addColorStop(.45,'rgba(58,28,10,.55)');dark.addColorStop(1,'rgba(58,28,10,.78)');ctx.fillStyle=dark;ctx.fillRect(a-r,fy,b-a+2*r,th+2);
  // тень от обрывов; ширина большая, чтобы не было резкой границы
  const edgeShade=(al,y0=fy,hh=th+2)=>{const e=Math.min(46,(b-a)/2.4);for(const [x,d] of [[a,1],[b,-1]]){const h=ctx.createLinearGradient(x,0,x+d*e,0);h.addColorStop(0,`rgba(58,28,10,${al})`);h.addColorStop(.5,`rgba(58,28,10,${al*.32})`);h.addColorStop(1,'rgba(58,28,10,0)');ctx.fillStyle=h;ctx.fillRect(Math.min(x,x+d*e),y0,e,hh);}};
  edgeShade(.5);
  ctx.restore();
  if(wt){const fade=ctx.createLinearGradient(0,fy+PIT_WALL_TOP-14,0,fy+PIT_WALL_TOP+1);fade.addColorStop(0,'rgba(92,50,22,0)');fade.addColorStop(1,'rgba(92,50,22,.95)');ctx.fillStyle=fade;ctx.fillRect(a,fy+PIT_WALL_TOP-14,b-a,15);}
  if(mapId==='factory'){drawVat(a,b,fy,th);continue;}
  drawStakes(a,b,fy-34);  // колья торчат над землёй; опасное дно (pitTip) глубже, чтобы яму было так же легко перепрыгнуть
  // колья уходят в ту же тень, что и стенка: нижняя часть и края мягко темнеют поверх них
  ctx.save();ctx.beginPath();ctx.rect(a,fy-40,b-a,th+42);ctx.clip();
  const low=ctx.createLinearGradient(0,fy-34,0,fy+th);low.addColorStop(0,'rgba(58,28,10,0)');low.addColorStop(.5,'rgba(58,28,10,.12)');low.addColorStop(1,'rgba(58,28,10,.42)');ctx.fillStyle=low;ctx.fillRect(a,fy-40,b-a,th+42);
  for(let row=0;row<12;row++){ctx.globalAlpha=(row+1)/12;edgeShade(.12,fy-34+row*6,row<11?6:th);}ctx.globalAlpha=1;ctx.restore();
 }
}
// заострённые деревянные колья на дне ямы; tip — высота кончиков
// чан с зельем вместо кольев: светящаяся поверхность с волной и пузырями
function drawVat(a,b,fy,th){
 const top=fy+14,w=b-a,tm=performance.now()/1000;
 const surf=()=>{ctx.beginPath();ctx.moveTo(a,fy+th+2);ctx.lineTo(a,top);for(let x=a;x<=b;x+=8)ctx.lineTo(x,top+Math.sin(x*.05+tm*2.4)*3);ctx.lineTo(b,top);ctx.lineTo(b,fy+th+2);ctx.closePath();};
 const g=ctx.createLinearGradient(0,top,0,fy+th);g.addColorStop(0,'#c8ff5a');g.addColorStop(.25,'#7fe02c');g.addColorStop(1,'#2f9a22');
 surf();ctx.fillStyle=g;ctx.fill();
 // куски упавшего тонут: сверху их подкрашивает зелье, вокруг шипят пузыри
 for(const s of sinkers){if(s.b<a||s.a>b)continue;const k=s.age/s.life,sc=1-k*.55;
  ctx.save();ctx.globalAlpha=k<.45?1:Math.max(0,1-(k-.45)/.55);ctx.translate(s.x,s.y);ctx.rotate(s.ang);ctx.scale(sc,sc);ctx.drawImage(s.im,-s.w/2,-s.h/2,s.w,s.h);ctx.restore();}
 surf();ctx.fillStyle='rgba(135,225,45,.42)';ctx.fill();
 ctx.save();surf();ctx.clip();
 for(const s of sinkers){if(s.b<a||s.a>b||s.y<top)continue;for(let i=0;i<3;i++){const p=(s.age*.03+i*.33)%1;ctx.globalAlpha=(1-p)*.8*(1-s.age/s.life);ctx.fillStyle='#f2ffb8';ctx.beginPath();ctx.arc(s.x+Math.sin(s.age*.2+i*2)*s.w*.35,s.y-p*34,2+i,0,7);ctx.fill();}}
 ctx.globalAlpha=1;
 for(let i=0;i<Math.ceil(w/30);i++){const p=hash(i*7+a),t=((tm*(.25+p*.3)+p*5)%1),r=3+p*6,bx=a+8+(w-16)*hash(i*3+a+1);ctx.globalAlpha=(1-t)*.75;ctx.fillStyle='#eaffb0';ctx.beginPath();ctx.arc(bx+Math.sin(tm*2+i)*3,top+th*.7*(1-t),r,0,7);ctx.fill();}
 ctx.globalAlpha=1;ctx.restore();
 ctx.strokeStyle='rgba(240,255,190,.85)';ctx.lineWidth=3;ctx.beginPath();for(let x=a;x<=b;x+=8){const y=top+Math.sin(x*.05+tm*2.4)*3;x===a?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
}
// конвейер: лента у самого пола, рисунок едет в сторону движения.
// v=456: раньше полоса просто лежала на полу и обрывалась срезом — теперь стальной корпус, утопленный в пол, с закруглёнными
// торцами, лента уходит под валы-барабаны на концах, барабаны крутятся вместе с лентой
function drawBelts(fy){
 const im=SPR.item_belt;if(!im)return;
 for(const c of pickups){if(c.t!=='belt'||c.x1<camX-60||c.x0>camX+WW+60)continue;
  const a=c.x0,b=c.x1,h=26,top=fy-18,cy=top+h/2,r=h/2+3,tw=h*im.width/im.height,off=((frame*1.4)%tw)*c.dir;
  ctx.save();
  // тень и корпус
  ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse((a+b)/2,fy+6,(b-a)/2+r+10,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#2a2f37';ctx.strokeStyle='#15181d';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(a-r-6,top-5,b-a+2*r+12,h+14,r+5);ctx.fill();ctx.stroke();
  // опоры корпуса, уходящие в пол
  ctx.fillStyle='#3b424d';for(let x=a+40;x<b-30;x+=120){ctx.fillRect(x-6,top+h+6,12,fy-(top+h)+2);}
  // лента между барабанами
  ctx.save();ctx.beginPath();ctx.rect(a,top,b-a,h);ctx.clip();
  for(let x=a-tw*2+off;x<b+tw;x+=tw){if(c.dir<0){ctx.save();ctx.translate(x+tw,0);ctx.scale(-1,1);ctx.drawImage(im,0,top,tw+.5,h);ctx.restore();}else ctx.drawImage(im,x,top,tw+.5,h);}
  ctx.restore();
  // валы-барабаны на концах
  const ang=frame*.09*c.dir;
  for(const x of [a,b]){
   ctx.fillStyle='#9aa4b3';ctx.strokeStyle='#2a2f37';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,cy,r,0,Math.PI*2);ctx.fill();ctx.stroke();
   ctx.strokeStyle='#5d6672';ctx.lineWidth=3;for(let k=0;k<3;k++){const q=ang+k*Math.PI*2/3;ctx.beginPath();ctx.moveTo(x,cy);ctx.lineTo(x+Math.cos(q)*(r-4),cy+Math.sin(q)*(r-4));ctx.stroke();}
   ctx.fillStyle='#3a404a';ctx.beginPath();ctx.arc(x,cy,4.5,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.arc(x-r*.35,cy-r*.4,r*.28,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();}
}
function drawStakes(a,b,tip){
 const n=Math.max(3,Math.round((b-a-12)/20)),step=(b-a-12)/n,base=VH+30;
 for(let i=0;i<n;i++){
  const x=a+6+step*(i+.5),w=Math.min(14,step*.8),t=tip+(i%2)*9+hash(i+a)*4,lean=(hash(i*3+a)-.5)*6;
  // спрайт кола в стиле фона; нарисованный кодом остался только на случай, если файла нет
  const spr=SPR[i%2?'stake2':'stake1'];if(spr){const sw=Math.min(20,step*.9),sh=base-t,srcH=Math.min(spr.height,sh*spr.width/sw);ctx.save();ctx.translate(x,t);ctx.rotate(lean*.006);const dh=srcH*sw/spr.width;ctx.drawImage(spr,0,0,spr.width,srcH,-sw/2,0,sw,dh);if(sh>dh)ctx.drawImage(spr,0,srcH-4,spr.width,3,-sw/2,dh-1,sw,sh-dh+2);ctx.restore();continue;}  // ниже спрайта тянем ровную часть кола
  ctx.beginPath();ctx.moveTo(x-w/2,base);ctx.lineTo(x-w/2+lean*.3,t+16);ctx.lineTo(x+lean,t);ctx.lineTo(x+w/2+lean*.3,t+16);ctx.lineTo(x+w/2,base);ctx.closePath();
  ctx.fillStyle=i%2?'#a8743f':'#bd8549';ctx.fill();ctx.lineWidth=2.2;ctx.strokeStyle=OUTLINE;ctx.stroke();
  // светлая заточенная часть и тень сбоку
  ctx.beginPath();ctx.moveTo(x-w/2+lean*.3,t+16);ctx.lineTo(x+lean,t);ctx.lineTo(x+w/2+lean*.3,t+16);ctx.closePath();ctx.fillStyle='#ecc68f';ctx.fill();ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle='#0003';ctx.fillRect(x+w*.15,t+18,w*.3,base-t-20);
 }
}
/* ============ живой фон: птицы, бабочки, пар, пылинки, звёзды ============ */
const BIRDS=Array.from({length:4},(_,i)=>({x:hash(i+40)*1800,y:70+hash(i+41)*120,v:.7+hash(i+42)*.6,ph:hash(i+43)*6}));
const MOTES=Array.from({length:26},(_,i)=>({x:hash(i+60),y:hash(i+61),v:.1+hash(i+62)*.3,ph:hash(i+63)*6,r:1+hash(i+64)*2}));
const LEAVES=Array.from({length:8},(_,i)=>({x:hash(i+80),y:hash(i+81),v:.4+hash(i+82)*.5,ph:hash(i+83)*6}));
const wrap=(v,span)=>((v%span)+span)%span;
// птицы и бабочки в стиле фона: мягкие градиенты и блик, без чёрных линий
function softWing(x,y,dx,dy,c0,c1){const g=ctx.createLinearGradient(x,y,x+dx,y+dy);g.addColorStop(0,c0);g.addColorStop(1,c1);return g;}
function drawBirds(){
 for(const b of BIRDS){
  const x=wrap(b.x+frame*b.v-camX*.15,WW+400)-200,y=b.y+Math.sin(frame*.02+b.ph)*12,f=Math.sin(frame*.25+b.ph);
  ctx.save();ctx.translate(x,y);ctx.scale(1.3,1.3);
  // крылья: при взмахе кончики ходят вверх и вниз
  ctx.fillStyle=softWing(0,-10,0,14,'#ffffff','#a9cbea');
  for(const s of [-1,1]){const tip=-2-f*10;ctx.beginPath();ctx.moveTo(s*1,-1.5);ctx.quadraticCurveTo(s*7,tip-3,s*15,tip);ctx.quadraticCurveTo(s*8,tip+5,s*1,3);ctx.closePath();ctx.fill();}
  // тело, голова и клюв
  ctx.fillStyle=softWing(0,-3,0,7,'#ffffff','#bcd6ef');ctx.beginPath();ctx.ellipse(0,1,6,3.2,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(5.5,-.5,2.5,0,7);ctx.fill();
  ctx.fillStyle='#ffb238';ctx.beginPath();ctx.moveTo(7.6,-1.3);ctx.lineTo(11,-.2);ctx.lineTo(7.6,.8);ctx.closePath();ctx.fill();
  ctx.restore();
 }
}
function drawButterflies(fy){
 const cols=[['#ffc4ec','#f25fb8'],['#ffe98a','#ff9d1f'],['#c4ecff','#3f9fe8']];
 for(let i=0;i<4;i++){
  const t=frame*.01+i*1.7,x=wrap(hash(i+90)*WW+Math.sin(t*1.3)*120+frame*.3-camX*.6,WW+100)-50,y=fy-70-hash(i+91)*140+Math.sin(t*3)*25,f=.25+.75*Math.abs(Math.sin(frame*.4+i)),[c0,c1]=cols[i%3];
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*2)*.18);
  for(const s of [-1,1]){
   ctx.save();ctx.scale(s*f,1);
   ctx.fillStyle=softWing(0,-5,10,4,c0,c1);ctx.beginPath();ctx.ellipse(5.4,-3,5.8,4.8,-.45,0,7);ctx.fill();  // верхнее крыло
   ctx.fillStyle=softWing(0,1,7,7,c0,c1);ctx.beginPath();ctx.ellipse(3.8,3.4,3.8,3.3,.5,0,7);ctx.fill();    // нижнее крыло
   ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(5.6,-4.2,2,1.3,-.45,0,7);ctx.fill();    // блик
   ctx.restore();
  }
  ctx.fillStyle=softWing(0,-5,0,10,'#8a5a34','#5a3518');ctx.beginPath();ctx.ellipse(0,0,1.5,5,0,0,7);ctx.fill();
  ctx.restore();
 }
}
function drawMotes(fy,col,up){
 for(const m of MOTES){
  const x=wrap(m.x*WW+Math.sin(frame*.01+m.ph)*30-camX*.4,WW),y=up?wrap(m.y*fy-frame*m.v,fy):m.y*fy+Math.sin(frame*.015+m.ph)*20;
  ctx.globalAlpha=.25+.35*Math.abs(Math.sin(frame*.02+m.ph));ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,m.r,0,7);ctx.fill();
 }
 ctx.globalAlpha=1;
}
function drawLeaves(fy,col){
 for(const l of LEAVES){
  const y=wrap(l.y*fy+frame*l.v,fy+40)-20,x=wrap(l.x*WW+Math.sin(frame*.02+l.ph)*40-camX*.5,WW),a=Math.sin(frame*.05+l.ph);
  ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=col;ctx.strokeStyle='#1b1b1b';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,6,3,0,0,7);ctx.fill();ctx.stroke();ctx.restore();
 }
}
function drawSteam(fy){
 for(let i=0;i<5;i++){
  const t=(frame*.4+i*70)%260,x=wrap(hash(i+120)*WW-camX*.3,WW),y=fy*.55-t*.5;
  ctx.globalAlpha=Math.max(0,.22*(1-t/260));ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x+Math.sin(t*.05+i)*14,y,14+t*.12,0,7);ctx.fill();
 }
 ctx.globalAlpha=1;
}
function drawLightRays(fy){
 ctx.fillStyle='#fffbe0';
 for(let i=0;i<4;i++){const x=wrap(i*WW/3.2+120-camX*.2,WW+300)-150;ctx.globalAlpha=.06+.04*Math.sin(frame*.015+i*2);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+70,0);ctx.lineTo(x+230,fy);ctx.lineTo(x+100,fy);ctx.fill();}
 ctx.globalAlpha=1;
}
let shoot=null;
function drawShootingStars(fy){
 if(!shoot&&Math.random()<.005)shoot={x:rnd(.2,1)*WW,y:rnd(20,fy*.3),t:0};
 if(shoot){shoot.t++;const x=shoot.x-shoot.t*9,y=shoot.y+shoot.t*4,g=ctx.createLinearGradient(x,y,x+70,y-31);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#ffffff00');ctx.strokeStyle=g;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+70,y-31);ctx.stroke();if(shoot.t>45)shoot=null;}
 for(let i=0;i<30;i++){const x=wrap(hash(i+150)*WW-camX*.05,WW),y=hash(i+151)*fy*.6;ctx.globalAlpha=.2+.8*Math.abs(Math.sin(frame*.03+i));ctx.fillStyle='#fff';ctx.fillRect(x-1,y-1,2,2);}
 ctx.globalAlpha=1;
}
function drawAmbient(fy){
 if(!SPR['bg_'+mapId])return;
 // ночью ни чаек, ни бабочек, ни солнечных лучей: только светлячки (и пар на кухне и заводе)
 if(MODS.night){drawMotes(fy,'#f4ff9a',true);if(mapId==='kitchen'||mapId==='factory')drawSteam(fy);return;}
 if(mapId==='garden'){drawBirds();drawButterflies(fy);}
 else if(mapId==='market'){drawBirds();drawLeaves(fy,'#ffb347');}
 else if(mapId==='greenhouse'){drawLightRays(fy);drawMotes(fy,'#fffbd0',true);drawLeaves(fy,'#6fcf4a');}
 else if(mapId==='kitchen'){drawSteam(fy);drawMotes(fy,'#fff3d8',false);}
 else if(mapId==='moon'){drawShootingStars(fy);}
 else if(mapId==='factory'){drawSteam(fy);drawMotes(fy,'#d6ff8a',true);}
}
