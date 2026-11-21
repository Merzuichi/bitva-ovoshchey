'use strict';
/* ============ спрайты: загрузка и подгонка под физические тела ============ */
// Если файла нет — элемент рисуется кодом, как раньше, поэтому графику можно добавлять по частям.
const PARTS=['head','torso','arm_upper','arm_lower','leg_upper','leg_lower'];
const CHAR_KINDS=['ogurets','pomidor','baklazhan','morkov','arbuz','kaktus','perets','kukuruza','kapusta'];
const FACE_PARTS=['eye_white','pupil','eye_blink','eye_hurt','eye_dead','brow_angry','mouth_smile','mouth_angry','mouth_hurt','mouth_dead'];
const SPRITES={};
CHAR_KINDS.forEach(k=>PARTS.forEach(p=>SPRITES[`char_${k}_${p}`]=`characters/char_${k}_${p}.png`));
FACE_PARTS.forEach(p=>SPRITES['face_'+p]=`faces/face_${p}.png`);
['fists','sword','bat','axe','hammer','pistol','smg','shotgun','grenade','bazooka','bazooka_empty','rocket'].forEach(w=>SPRITES['wpn_'+w]=`weapons/wpn_${w}.png`);
const ITEM_FILES=['press','belt','cp_on','cp_off','zone_arrow','box','ball','brick','plank','barrel','anvil','bomb','dynamite','mine','mine_light_on','mine_light_off','car','wheel','saw','spikes','wall','flag','tramp','tramp_squash','platform_left','platform_mid','platform_right','ice_left','ice_mid','ice_right',...['box','plank','brick','ball','barrel','anvil','wall'].flatMap(i=>[i+'_d1',i+'_d2',i+'_p1',i+'_p2',i+'_p3'])];
const ITEM_ICONS=['anvil','ball','barrel','bomb','box','brick','car','dynamite','mine','plank','wheel'];
ITEM_FILES.forEach(i=>SPRITES['item_'+i]=`items/item_${i}.png`);
ITEM_ICONS.forEach(i=>SPRITES['icon_item_'+i]=`items/icon_item_${i}.png`);
SPRITES.item_mine='items/item_mine_toon_v365.png';
SPRITES.icon_item_mine='items/icon_item_mine_toon_v365.png';
const OVERLAYS=['headband','crown','player_arrow','hpbar_frame','hpbar_fill'];
const FX_FILES=['explosion','heal','hit_1','hit_2','juice_drop','juice_splat_1','juice_splat_2','juice_splat_3','juice_splat_4','muzzle_1','muzzle_2','muzzle_3','smoke_1','smoke_2','smoke_3','smoke_4','spark'];
OVERLAYS.forEach(o=>SPRITES['ovl_'+o]=`overlays/ovl_${o}.png`);FX_FILES.forEach(f=>SPRITES['fx_'+f]=`fx/fx_${f}.png`);
[0,1,2,3].forEach(i=>SPRITES['item_flag_'+i]=`items/item_flag_${i}.png`);
const MAP_IDS=['garden','greenhouse','market','kitchen','moon','factory'];
MAP_IDS.forEach(m=>{SPRITES['bg_'+m]=`maps/bg_${m}.jpg`;SPRITES['floor_'+m]=`maps/floor_${m}.jpg`;});
CHAR_KINDS.forEach(k=>SPRITES['portrait_'+k]=`ui/portrait_${k}.png`);
['fists','sword','bat','axe','hammer','pistol','smg','shotgun','grenade','bazooka'].forEach(w=>SPRITES['icon_wpn_'+w]=`weapons/icon_wpn_${w}.png`);

// список файлов, которые реально лежат в assets — чтобы не делать сотни запросов в пустоту
SPRITES.icon_coin='ui/icon_coin.png';
// v528: сундук нарисован Codex (_codex_art/prompt_chest.txt), фон вырезан tools/key_magenta.py
for(const s of ['','_d1','_d2','_open','_p1','_p2','_p3'])SPRITES['item_chest'+s]=`items/item_chest${s}.png`;
// эффекты из Epic Toon FX (tools/import_toonfx.py): комикс-надписи, листы кадров, вспышки
const TFX_WORDS=['pow','bang','boom','kapow','ko','smack','crit','splat','whammm','crack','hit'];
const TFX_FILES=['burst','splat','nova','muzzle','cloud','confetti','spike','slash1','slash2','slashc','star','sparkle','shock','scorch','excl',...TFX_WORDS.map(w=>'txt_'+w)];
TFX_FILES.forEach(f=>SPRITES['tfx_'+f]=`fx/tfx_${f}.png`);
const AVAILABLE=new Set(['icon_coin',...['','_d1','_d2','_open','_p1','_p2','_p3'].map(s=>'item_chest'+s),...TFX_FILES.map(f=>'tfx_'+f),
 ...CHAR_KINDS.flatMap(k=>PARTS.map(p=>`char_${k}_${p}`)),...FACE_PARTS.map(p=>'face_'+p),
 ...['fists','sword','bat','axe','hammer','pistol','smg','shotgun','grenade','bazooka','bazooka_empty','rocket'].map(w=>'wpn_'+w),
 ...['fists','sword','bat','axe','hammer','pistol','smg','shotgun','grenade','bazooka'].map(w=>'icon_wpn_'+w),
 ...CHAR_KINDS.map(k=>'portrait_'+k),...ITEM_FILES.map(i=>'item_'+i),...ITEM_ICONS.map(i=>'icon_item_'+i),
 ...OVERLAYS.map(o=>'ovl_'+o),...MAP_IDS.flatMap(m=>['bg_'+m,'floor_'+m]),...FX_FILES.map(f=>'fx_'+f),...[0,1,2,3].map(i=>'item_flag_'+i),
]);
MAP_IDS.forEach(m=>{const key='bg_'+m+'_upper';SPRITES[key]=`maps/bg_${m}_upper_v349.jpg`;  /* v=463: JPG — прозрачности нет, вес в ~5 раз меньше */AVAILABLE.add(key);});
// ночные фоны нарисованы ChatGPT (Codex image_gen, исходники Playgama_media/night_bg_v389, импорт tools/import_night_bg.py)
const NIGHT_BG=['garden','greenhouse','market','kitchen','factory'],NIGHT_UPPER=['garden','market'];
NIGHT_BG.forEach(m=>{SPRITES['bg_'+m+'_night']=`maps/bg_${m}_night.jpg`;AVAILABLE.add('bg_'+m+'_night');});
NIGHT_UPPER.forEach(m=>{SPRITES['bg_'+m+'_upper_night']=`maps/bg_${m}_upper_night.jpg`;AVAILABLE.add('bg_'+m+'_upper_night');});
const nightBg=key=>MODS.night&&SPR[key+'_night']||null;
// Оружие: карточки, характеристики, патроны и кольцо перезарядки.
const WEAPON_UI_ASSETS=["ui_wpn_card", "ui_wpn_card_sel", "ui_wpn_card_lock", "ui_ammo_full", "ui_ammo_empty", "ui_reload_ring", "ui_price_tag", "ui_badge_owned", "ui_badge_new", "ui_pickup_bubble", "ui_pickup_ribbon", "ui_stat_segment_empty", "ui_stat_segment_full", "ui_ammo_grenade", "ui_ammo_rocket", "icon_stat_dmg", "icon_stat_knock", "icon_stat_rate", "icon_stat_ammo", "icon_stat_reload"];
WEAPON_UI_ASSETS.forEach(k=>{SPRITES[k]=`ui/${k}.png`;AVAILABLE.add(k);});
['scissors','shield','reload'].forEach(k=>{SPRITES['icon_'+k]=`ui/icon_${k}.png`;AVAILABLE.add('icon_'+k);});['tomato','cabbage','eggplant','carrot','corn'].forEach(k=>{SPRITES['veg_'+k]=`maps/veg_${k}.png`;AVAILABLE.add('veg_'+k);});['cog_small','cog_big'].forEach(k=>{SPRITES[k]=`maps/${k}.png`;AVAILABLE.add(k);});['greenhouse','market','kitchen','factory'].forEach(m=>['on','off'].forEach(st=>{const k=`item_cp_${m}_${st}`;SPRITES[k]=`items/${k}.png`;AVAILABLE.add(k);}));SPRITES.sunflower='maps/sunflower.png';AVAILABLE.add('sunflower');[1,2,3].forEach(k=>{SPRITES['cloud'+k]=`maps/cloud${k}.png`;AVAILABLE.add('cloud'+k);});['stake1','stake2'].forEach(k=>{SPRITES[k]=`maps/${k}.png`;AVAILABLE.add(k);});SPRITES.fence_garden='maps/fence_garden.png';AVAILABLE.add('fence_garden');
const SPR={};
['hp','speed'].forEach(k=>{SPRITES['icon_upg_'+k]='ui/icon_upg_'+k+'.png';AVAILABLE.add('icon_upg_'+k);});
// v523: картинки оружия нарисованы шириной 800–1000 px, а на экране занимают 40–66 единиц (до ~250 px на плотном экране).
// Сжимаем их один раз при загрузке в ImageBitmap — кадр не пересчитывает огромную картинку, меньше памяти.
// .src сохраняем: иконки в HTML (iconHtml, призрак перетаскивания) берут адрес картинки.
const SPR_FIT=[[/^wpn_/,384]];
function fitSprite(k,im){
 const lim=SPR_FIT.find(([re])=>re.test(k));if(!lim||typeof createImageBitmap!=='function')return;
 const s=lim[1]/Math.max(im.width,im.height);if(s>=1)return;
 createImageBitmap(im,{resizeWidth:Math.max(1,Math.round(im.width*s)),resizeHeight:Math.max(1,Math.round(im.height*s)),resizeQuality:'high'})
  .then(b=>{if(SPR[k]!==im)return;b.src=im.src;SPR[k]=b;if(typeof silCache!=='undefined')delete silCache[k];}).catch(()=>{});
}
function loadSprites(){
 // v=480: фоны других карт, верхние и ночные фоны, флажки и декор уровней не нужны в меню — грузим их после него.
 // Рисуются они каждый кадр через SPR[...], до загрузки там заливка цветом.
 const later=k=>/^(bg_|floor_)/.test(k)&&!/^(bg|floor)_garden$/.test(k)||/^(item_|veg_|cog_|tfx_|fx_|portrait_)/.test(k);  // v=480
 const all=[...AVAILABLE].filter(k=>SPRITES[k]),keys=all.filter(k=>!later(k)),rest=all.filter(later);let done=0;
 const loadOne=k=>new Promise(res=>{const im=new Image();im.onload=()=>{SPR[k]=im;fitSprite(k,im);res();};im.onerror=res;im.src='assets/'+SPRITES[k]+'?v='+ASSET_V;});
 window.sprRest=new Promise(r=>addEventListener('veggie-menu',()=>Promise.all(rest.map(loadOne)).then(r),{once:true}));
 // рамки интерфейса подгружаем вместе со спрайтами, иначе первые кнопки появляются без картинок
 const css=['ui_panel','ui_ribbon','ui_btn_gray','ui_btn_green','ui_btn_yellow','ui_btn_ad','ui_modecard_story','ui_modecard_sandbox','ui_modecard_arcade','ui_coinbar','ui_ib','ui_ib_alt','ui_ib_on'];
 const total=keys.length+css.length,tick=()=>{done++;const e=document.getElementById('loadText');if(e)e.textContent=t('Загрузка')+' '+Math.round(done/total*100)+'%';};
 return Promise.all([...keys.map(k=>new Promise(res=>{const im=new Image();im.onload=()=>{SPR[k]=im;fitSprite(k,im);tick();res();};im.onerror=()=>{tick();res();};im.src='assets/'+SPRITES[k]+'?v='+ASSET_V;})),
  ...css.map(n=>new Promise(res=>{const im=new Image();im.onload=im.onerror=()=>{tick();res();};im.src=`assets/ui/${n}.png?v=20`;}))]);
}

// подгонка частей тела: by — по ширине или высоте тела, k — множитель (часть заходит в сустав),
// cx/cy — какая точка картинки совпадает с центром физического тела
const PART_FIT={
 head:{by:'w',k:1.3,cx:.5,cy:.62},
 torso:{by:'h',k:1.12,kw:1.12,cx:.5,cy:.5},
 arm_upper:{by:'h',k:1.28,kw:1.55,cx:.5,cy:.48},
 arm_lower:{by:'h',k:1.32,kw:1.65,cx:.5,cy:.5},
 leg_upper:{by:'h',k:1.22,kw:1.45,cx:.5,cy:.48},
 leg_lower:{by:'h',k:1.26,cx:.4,cy:.5},
};
const PART_KEY={head:'head',torso:'torso',uaL:'arm_upper',uaR:'arm_upper',laL:'arm_lower',laR:'arm_lower',ulL:'leg_upper',ulR:'leg_upper',llL:'leg_lower',llR:'leg_lower'};
// оружие: L — длина в игровых единицах, gx/gy — точка хвата в долях картинки
// точки хвата — по манифесту набора графики (доля ширины), высота — по рисунку рукояти
// значения печатает tools/make_gun_art.py; L ближнего боя подобран так, чтобы дальность удара L*(1-gx) осталась прежней
const WPN_FIT={fists:{L:40,gx:.12,gy:.5},sword:{L:62,gx:.155,gy:.5},bat:{L:56,gx:.128,gy:.5},axe:{L:53,gx:.116,gy:.668},hammer:{L:59,gx:.137,gy:.501},pistol:{L:30,gx:.32,gy:.667},smg:{L:62,gx:.315,gy:.58},bazooka:{L:66,gx:.333,gy:.747},shotgun:{L:56,gx:.247,gy:.515},grenade:{L:15,gx:.509,gy:.614}};
// предметы: w — ширина картинки в игровых единицах, cy — какая точка картинки совпадает с центром тела
const ITEM_FIT={box:{w:52},ball:{w:42},brick:{w:46},plank:{w:172},barrel:{w:42},anvil:{w:74,cx:.47},bomb:{w:34,cy:.6},grenade:{w:26,cy:.58,key:'grenade'},dyn:{w:18,cy:.53,key:'dynamite'},
 mine:{w:66,cy:.77},car:{w:124,cy:.68},wheel:{w:30},saw:{w:108}};

function drawPartSprite(ent,b){
 const pk=PART_KEY[b.plugin.part],key=`char_${ent.kind}_${pk}`,im=SPR[key];
 if(!im)return false;
 const f=PART_FIT[pk],bw=b.plugin.w,bh=b.plugin.h;
 let w,h;
 // kw — ширина по телу (картинку слегка растягиваем), иначе ширина по пропорциям картинки
 if(f.by==='w'){w=bw*f.k;h=w*im.height/im.width;}else{h=bh*f.k;w=f.kw?bw*f.kw:h*im.width/im.height;}
 ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
 if(ent.facing<0)ctx.scale(-1,1);
 ctx.drawImage(im,-w*f.cx,-h*f.cy,w,h);
 // вспышка попадания: белый силуэт поверх
 if(ent.flash>0){const sil=whiteSil(key);if(sil){ctx.globalAlpha=Math.min(.85,ent.flash/7);ctx.drawImage(sil,-w*f.cx,-h*f.cy,w,h);ctx.globalAlpha=1;}}
 ctx.restore();
 return true;
}
// «макушка»: спрайт головы рисуется позади туловища — над телом видны только хвостик/листья/цветок
function drawTopper(ent){
 const im=SPR[`char_${ent.kind}_head`];if(!im)return;
 const t=ent.parts.torso,P=BODY[ent.kind]||BODY.ogurets,w=t.plugin.w*P.top[0],baseH=w*im.height/im.width,h=baseH;
 ctx.save();ctx.translate(t.position.x,t.position.y);ctx.rotate(t.angle);if(ent.facing<0)ctx.scale(-1,1);
 ctx.drawImage(im,-w/2,-t.plugin.h/2+baseH*(1-P.top[1])-h,w,h);ctx.restore();
}
// частокол смертельных кольев: те же рисунки, что у кольев в ямах, острия на разной высоте
function drawStakeRow(b){
 const s1=SPR.stake1,s2=SPR.stake2;if(!s1||!s2)return false;
 const w=b.plugin.w,base=b.bounds.max.y+2,top=b.bounds.min.y,n=Math.max(3,Math.round(w/18)),step=w/n,x0=b.position.x-w/2;
 for(let i=0;i<n;i++){const spr=i%2?s2:s1,sw=Math.min(20,step*.95),t=top+(i%2)*8+hash(i+Math.round(x0))*5,lean=(hash(i*3+Math.round(x0))-.5)*.08;
  const sh=base-t,dh=Math.min(sh,spr.height*sw/spr.width);
  ctx.save();ctx.translate(x0+step*(i+.5),t);ctx.rotate(lean);ctx.drawImage(spr,0,0,spr.width,spr.height*dh/(spr.height*sw/spr.width),-sw/2,0,sw,dh);ctx.restore();}
 return true;
}
function drawItemSprite(b){
 const deco=b.plugin&&b.plugin.deco;if(!deco)return false;
 if(deco==='platform')return drawPlatformSprite(b)||drawStripSprite(b,deco);
 if(deco==='ice')return drawStripSprite(b,deco);
 if(deco==='press')return drawPressSprite(b);
 if(deco==='wall')return drawWallSprite(b);
 if(deco==='spikes')return drawSpikesSprite(b);
 if(deco==='stakerow')return drawStakeRow(b);
 if(deco==='tramp')return drawTrampSprite(b);
 const f=ITEM_FIT[deco],stg=b.plugin.stage,im=f&&((stg&&SPR['item_'+(f.key||deco)+'_d'+stg])||(deco==='grenade'?SPR.wpn_grenade:SPR['item_'+(f.key||deco)]));
 if(!im)return false;
 const w=deco==='plank'&&b.plugin.w?b.plugin.w+6:f.w,h=deco==='plank'?f.w*im.height/im.width:w*im.height/im.width;  // v520: доска рисуется по своей ширине — верёвки на её концах
 ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
 ctx.drawImage(im,-w*(f.cx||.5),-h*(f.cy||.5),w,h);
 // сок на диске пилы: крутится вместе с ней и за 30 с стекает
 if(deco==='saw'&&b.plugin.stains){
  b.plugin.stains=b.plugin.stains.filter(s=>frame-s.t<1800);
  for(const s of b.plugin.stains){const sp=tinted('fx_juice_splat_'+s.v,s.c);if(!sp)continue;const a=clamp(1-(frame-s.t)/1800,0,1);ctx.save();ctx.rotate(s.a);ctx.globalAlpha=.85*a;ctx.drawImage(sp,s.r-s.s/2,-s.s*.35,s.s,s.s*.7);ctx.restore();}
  ctx.globalAlpha=1;
 }
 if(deco==='grenade'&&b.plugin.ent?.fuseTotal){
  const e=b.plugin.ent,left=e.fuse,elapsed=e.fuseTotal-left,period=left>45?12:left>20?8:5;
  const reduced=grenadeReducedMotion.matches;
  if(reduced||Math.floor(elapsed/period)%2===0){
   const mask=grenadeWarningSprite();ctx.save();ctx.globalAlpha=reduced?.4:.72;
   if(mask)ctx.drawImage(mask,-w*(f.cx||.5),-h*(f.cy||.5),w,h);
   ctx.globalAlpha=reduced?.35:.65;ctx.strokeStyle='#ffb33d';ctx.lineWidth=1.8;ctx.beginPath();ctx.ellipse(0,-h*.08,w*.65,h*.58,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
 }
 // лампа мигает на взведённой мине: свечение поверх красной лампы рисунка
 // фитиль бомбы и динамита горит: мерцающая искра на кончике и разлетающиеся угольки
 if(deco==='bomb'||deco==='dyn'){const fx=deco==='bomb'?-w/2+w*.35:-w/2+w*.72,fy=-h*(f.cy||.5)+1,fl=.75+Math.sin(frame*.9)*.25+Math.random()*.15;
  const g=ctx.createRadialGradient(fx,fy,0,fx,fy,9*fl);g.addColorStop(0,'#fffbe0');g.addColorStop(.35,'#ffd23a');g.addColorStop(.7,'rgba(255,110,20,.6)');g.addColorStop(1,'rgba(255,80,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(fx,fy,9*fl,0,7);ctx.fill();
  ctx.strokeStyle='#fff3b0';ctx.lineWidth=1.5;for(let i=0;i<4;i++){const a=frame*.3+i*1.57,r=5+Math.random()*5*fl;ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx+Math.cos(a)*r,fy+Math.sin(a)*r);ctx.stroke();}
  if(frame%4===0&&!paused){const c=Math.cos(b.angle),s=Math.sin(b.angle),wx=b.position.x+fx*c-fy*s,wy=b.position.y+fx*s+fy*c;particles.push({x:wx,y:wy,vx:rnd(-1.2,1.2),vy:rnd(-2.4,-.6),life:rnd(10,18),c:Math.random()<.5?'#ffd23a':'#ff8a1e',r:rnd(1,2),fire:true});}}
 if(deco==='mine'){const ent=b.plugin.ent;if(ent&&ent.armed<=0&&frame%30<15){const lx=w*.016,ly=-h*f.cy+h*.12,g=ctx.createRadialGradient(lx,ly,1,lx,ly,12);g.addColorStop(0,'#fff3d6');g.addColorStop(.3,'#ff4a2a');g.addColorStop(1,'rgba(255,40,20,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(lx,ly,12,0,7);ctx.fill();}}
 ctx.restore();
 if(b.plugin.frozen){pathBody(b);ctx.strokeStyle='#4dd2ff';ctx.lineWidth=3;ctx.stroke();}
 return true;
}
// One cached colour mask, no filters, new particles or full-screen flashing per frame.
const grenadeReducedMotion=matchMedia('(prefers-reduced-motion:reduce)');
let grenadeWarningMask=null;
function grenadeWarningSprite(){
 if(grenadeWarningMask)return grenadeWarningMask;const im=SPR.wpn_grenade;if(!im)return null;
 const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#ff613b';g.fillRect(0,0,c.width,c.height);return grenadeWarningMask=c;
}
// платформа и лёд: левый край + повторяющаяся середина + правый край
function drawStripSprite(b,kind){
 const L=SPR[`item_${kind}_left`],M=SPR[`item_${kind}_mid`],R=SPR[`item_${kind}_right`];
 if(!L||!M||!R)return false;
 const w=b.plugin.w||200,h=b.plugin.h||18,k=h/M.height,cw=L.width*k,mw=M.width*k;
 ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
 let x=-w/2;ctx.drawImage(L,x,-h/2,cw,h);x+=cw;
 const end=w/2-cw;
 while(x<end-.5){const seg=Math.min(mw,end-x);ctx.drawImage(M,0,0,M.width*seg/mw,M.height,x,-h/2,seg+.4,h);x+=seg;}
 ctx.drawImage(R,end,-h/2,cw,h);
 ctx.restore();return true;
}
// платформа сделана из пола текущей локации: верхняя полоса текстуры, скруглённая плита без обводки. Готовый рисунок хранится по локации и ширине
const PLAT_H=36,PLAT_PAD=3,platTex=new Map();
function platformTexture(w){
 const fl=SPR['floor_'+mapId];if(!fl)return null;
 const key=mapId+'|'+Math.round(w);let cv=platTex.get(key);if(cv)return cv;
 cv=document.createElement('canvas');cv.width=(w+PLAT_PAD*2)*2;cv.height=(PLAT_H+PLAT_PAD*2)*2;
 const g=cv.getContext('2d');g.scale(2,2);g.translate(PLAT_PAD,PLAT_PAD);
 const path=(x,y,W,H,rt,rb)=>{g.beginPath();g.moveTo(x+rt,y);g.lineTo(x+W-rt,y);g.quadraticCurveTo(x+W,y,x+W,y+rt);g.lineTo(x+W,y+H-rb);g.quadraticCurveTo(x+W,y+H,x+W-rb,y+H);g.lineTo(x+rb,y+H);g.quadraticCurveTo(x,y+H,x,y+H-rb);g.lineTo(x,y+rt);g.quadraticCurveTo(x,y,x+rt,y);g.closePath();};
 g.save();path(0,0,w,PLAT_H,9,14);g.clip();
 const crop=fl.height*.34,tw=fl.width*PLAT_H/crop;
 for(let x=-(w*37%tw);x<w;x+=tw)g.drawImage(fl,0,0,fl.width,crop,x,0,tw+.5,PLAT_H);
 const sh=g.createLinearGradient(0,PLAT_H*.45,0,PLAT_H);sh.addColorStop(0,'rgba(40,16,4,0)');sh.addColorStop(1,'rgba(40,16,4,.42)');g.fillStyle=sh;g.fillRect(0,0,w,PLAT_H);
 g.fillStyle='rgba(255,255,255,.28)';g.fillRect(4,1,w-8,2);
 g.restore();
 platTex.set(key,cv);return cv;
}
function drawPlatformSprite(b){
 const w=b.plugin.w||200,h=b.plugin.h||18,cv=platformTexture(w);if(!cv)return false;
 // верх рисунка совпадает с верхом тела платформы, ниже плита свисает
 ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
 ctx.drawImage(cv,-w/2-PLAT_PAD,-h/2-PLAT_PAD,w+PLAT_PAD*2,PLAT_H+PLAT_PAD*2);
 ctx.restore();return true;
}
function drawPressSprite(b){
 const im=SPR.item_press,x=b.position.x,y=b.position.y;
 // шток идёт от верха экрана до головы пресса
 const g=ctx.createLinearGradient(x-16,0,x+16,0);g.addColorStop(0,'#c9d2dc');g.addColorStop(.5,'#8d99a8');g.addColorStop(1,'#5f6b7a');ctx.fillStyle=g;ctx.fillRect(x-16,-20,32,y+20);
 if(!im)return false;
 const w=132,h=w*im.height/im.width;ctx.drawImage(im,x-w/2,y+28-h,w,h);return true;
}
function drawWallSprite(b){
 const im=(b.plugin.stage&&SPR['item_wall_d'+b.plugin.stage])||SPR.item_wall;if(!im)return false;
 const w=b.plugin.w||22,h=b.plugin.h||200,th=im.height*w/im.width;
 ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
 for(let y=-h/2;y<h/2-.5;y+=th){const seg=Math.min(th,h/2-y);ctx.drawImage(im,0,0,im.width,im.height*seg/th,-w/2,y,w,seg+.4);}
 ctx.restore();return true;
}
// шипы: тайл (шип + планка) повторяется по ширине; планка совпадает с физическим телом
function drawSpikesSprite(b){
 const im=SPR.item_spikes;if(!im)return false;
 const w=b.plugin.w||120,tw=15,th=30,n=Math.max(1,Math.round(w/tw)),step=w/n;
 ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
 for(let i=0;i<n;i++)ctx.drawImage(im,-w/2+i*step,15-th,step+.3,th);  // v=452: тело шипов 30 px с центром на 6 выше — рисунок на прежнем месте
 ctx.restore();return true;
}
function drawTrampSprite(b){
 const sq=b.plugin.squash>frame,im=SPR[sq?'item_tramp_squash':'item_tramp'];if(!im)return false;
 // тело батута на 24 выше точки установки: верх рисунка совпадает с верхом мата, подставка стоит на земле
 const w=(b.plugin.w||140)+10,h=im.height*w/im.width;
 ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
 ctx.drawImage(im,-w/2,-10,w,h);
 ctx.restore();return true;
}
function drawFlagSprite(f){
 const im=SPR['item_flag_'+(Math.floor(frame/9)%4)]||SPR.item_flag;if(!im)return false;
 // столб стоит в точке f.x
 const w=104,h=w*im.height/im.width;
 ctx.drawImage(im,f.x-w*.07,FLOOR-h,w,h);
 return true;
}
// лук в руке: картинка лука без тетивы, тетива и стрела — кодом. Натяжение отводит тетиву со стрелой назад, к плечу,
// после выстрела тетива дрожит; на перезарядке стрелы на тетиве нет. Координаты — как у картинки лука (wpn_bow_v366)
function drawBowRig(ent){
 const im=SPR.wpn_bow_body,f=WPN_FIT.bow,L=f.L,H=L*im.height/im.width,x0=-f.gx*L,y0=-f.gy*H;
 const pull=BowMotion.pull(ent),tw=BowMotion.twang(ent),loaded=ent.reload<=0&&(ent.ammo>0||!WEAPONS.bow.mag)&&frame-(ent.bowSnap??-99)>8;
 const tipX=x0+.29*L,tipY=.44*H,restX=x0+.25*L,nock=restX-pull*15+tw;
 ctx.drawImage(im,x0,y0,L,H*(1-pull*.04));
 ctx.lineCap='round';
 for(const [w,c] of [[2.4,'#5a3414'],[1.1,'#f6e2b4']]){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(tipX,-tipY);ctx.lineTo(nock,0);ctx.lineTo(tipX,tipY*(1-pull*.04));ctx.stroke();}
 if(loaded||pull>0){ctx.save();ctx.translate(nock+17,0);drawArrow(ctx,34);ctx.restore();}
 // полностью натянут — искорка на наконечнике
 if(pull>=1){ctx.save();ctx.globalAlpha=.6+.4*Math.sin(frame*.8);drawTfx('sparkle',0,nock+34,0,9,9,frame*.2);ctx.restore();}
 ctx.lineCap='butt';
 return true;
}
// ореол заряда: белый силуэт оружия, размытый тенью, — один раз на оружие и цвет. pad — поле вокруг в долях длины оружия
const wpnGlowCache={};
function wpnGlow(id,color,n){
 const key=id+'|'+color+'|'+n;if(wpnGlowCache[key])return wpnGlowCache[key];
 const sil=whiteSil('wpn_'+id),f=WPN_FIT[id];if(!sil||!f)return null;
 // работаем в масштабе 4 px на игровую единицу: размытие ~14 единиц — как у прежнего shadowBlur посреди замаха
 const u=4,W=Math.round(f.L*u),H=Math.round(W*sil.height/sil.width),pad=.35,P=Math.round(f.L*pad*u);
 const c=document.createElement('canvas');c.width=W+P*2;c.height=H+P*2;const g=c.getContext('2d');
 g.shadowColor=color;g.shadowBlur=14*u;g.globalAlpha=.75;for(let i=0;i<n;i++)g.drawImage(sil,P,P,W,H);
 const out={im:c,pad};wpnGlowCache[key]=out;
 // в ImageBitmap — дешевле рисовать каждый кадр, когда сам холст игры рисуется без видеокарты
 if(typeof createImageBitmap==='function')createImageBitmap(c).then(b=>{out.im=b;}).catch(()=>{});
 return out;
}
function drawWeaponSprite(ent,id){
 if(id==='bow'&&SPR.wpn_bow_body)return drawBowRig(ent);
 if((id==='spear'||id==='knife')&&ent.reload>0)return true;
 // базука на перезарядке — без ракеты в стволе (картинки одного размера)
 const im=(id==='bazooka'&&ent.reload>0&&SPR.wpn_bazooka_empty)||SPR['wpn_'+id],f=WPN_FIT[id];
 if(!im||!f)return false;
 const L=f.L,H=L*im.height/im.width,x=-f.gx*L,y=-f.gy*H;
 // замах: светится всё оружие целиком, сильнее по мере заряда; при полном заряде свечение пульсирует
 // замах броска (копьё, нож): оружие в руке светится всё сильнее до самого броска
 const tm=ent.throwMotion,throwK=tm&&!tm.released&&(id==='spear'||id==='knife')?clamp((frame-tm.start)/tm.wind,0,1):0;
 const k=throwK||(typeof CH_MIN!=='undefined'&&ent.charge>CH_MIN?clamp((ent.charge-CH_MIN)/CH_FULL,0,1):0);
 if(k>0){
  const full=k>=1,pulse=full?.5+.5*Math.sin(frame*.5):0,sil=whiteSil('wpn_'+id);
  // v523: ореол — готовая картинка (wpnGlow), а не shadowBlur каждый кадр: размытие тени на телефоне стоило десятки мс на кадр
  const gl=wpnGlow(id,full?(pulse>.5?'#ffffff':'#ffb52e'):'#ffd23a',full?3:2);
  if(gl){const p=gl.pad*L;ctx.globalAlpha=full?1:.55+.45*k;ctx.drawImage(gl.im,x-p,y-p,L+p*2,H+p*2);ctx.globalAlpha=1;}
  ctx.drawImage(im,x,y,L,H);
  if(sil){ctx.globalAlpha=(.12+k*.38+pulse*.2);ctx.drawImage(sil,x,y,L,H);ctx.globalAlpha=1;}
  return true;
 }
 ctx.drawImage(im,x,y,L,H);
 return true;
}
// лицо из спрайтов; координаты — в системе головы (как в старой отрисовке кодом)
function faceImg(k,x,y,w,h,flip){const im=SPR['face_'+k];if(!im)return;ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore();}
function drawFaceSprites(ent){
 if(!SPR.face_eye_white)return false;
 const ey=-2,fx=ent.facing*.9;
 if(ent.dead){faceImg('eye_dead',-5,ey,6,6);faceImg('eye_dead',5,ey,6,6);faceImg('mouth_dead',0,7,8.5,2.2);return true;}
 const hurt=ent.stun>0,bl=ent.blink<6,angry=ent.target&&!hurt;
 for(const ex of [-5,5]){
  if(hurt)faceImg('eye_hurt',ex,ey,5.6,5.4,ex>0);
  else if(bl)faceImg('eye_blink',ex,ey+1,7,2.2);
  else{faceImg('eye_white',ex,ey,7,9.6);faceImg('pupil',ex+fx*1.3,ey+.6,4,4);}
  if(angry)faceImg('brow_angry',ex*.9,ey-6.2,6.6,4,ex>0);
 }
 if(hurt)faceImg('mouth_hurt',0,7.5,4.4,6);
 else if(angry)faceImg('mouth_angry',0,6.5,8,3.2);
 else faceImg('mouth_smile',0,6,9,2.9);
 return true;
}
// иконки для интерфейса: картинка, если спрайт есть, иначе эмодзи
// иконка: портрет героя, иконка оружия или спрайт предмета; если нет картинки — эмодзи
const ICON_ALIAS={platform:'item_platform_mid',ice:'item_ice_mid',tramp:'item_tramp',wall:'item_wall',spikes:'item_spikes',saw:'item_saw'};
function iconKey(id){if(NPC[id])return 'portrait_'+id;if(WEAPONS[id])return 'icon_wpn_'+id;if(ICON_ALIAS[id])return ICON_ALIAS[id];return SPR['icon_item_'+id]?'icon_item_'+id:'item_'+id;}
function iconHtml(id,emoji){const im=SPR[iconKey(id)];return im?`<img class="spi" src="${im.src}" alt="">`:emoji;}
