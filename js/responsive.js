'use strict';
// Layout depends on the iframe viewport and primary input, including tablet browsers.
(function(){
 const touch=matchMedia('(pointer:coarse)');
 const narrow=matchMedia('(max-width:900px)');
 const short=matchMedia('(max-height:600px)');
 const body=document.body;
 const options=document.createElement('div');
 options.id='sbOptions';
 const more=document.createElement('button');
 more.id='bMore';more.className='ib';more.textContent='⋯';
 more.setAttribute('aria-controls','sbOptions');
 more.setAttribute('aria-expanded','false');
 const actions=document.querySelector('#top>.grp:last-child');
 actions.append(more);
 actions.append(options);
 for(const id of ['bPause','bSlow','bGrav','bUndo','bClear','bMaps'])options.append(document.getElementById(id));
 options.append(document.getElementById('tools'));
 const palette=document.createElement('button');
 palette.id='bPalette';palette.className='ib';palette.textContent='⌃';
 palette.setAttribute('aria-controls','items');
 document.getElementById('bottom').prepend(palette);
 function label(){
  more.title=t('Инструменты');more.setAttribute('aria-label',more.title);
  palette.title=t(body.classList.contains('palette-open')?'Свернуть предметы':'Предметы');
  palette.setAttribute('aria-label',palette.title);
  palette.setAttribute('aria-expanded',String(body.classList.contains('palette-open')));
  palette.textContent=body.classList.contains('palette-open')?'⌄':'⌃';
  const shortNames={hand:'Рука',team:'Команда',boom:'Взрыв'};
  for(const button of options.querySelectorAll('button')){
   button.setAttribute('aria-label',button.title);
   button.dataset.label=shortNames[button.dataset.tool]?t(shortNames[button.dataset.tool]):button.title;
  }
  for(const button of document.querySelectorAll('#cats .cat'))button.setAttribute('aria-label',button.textContent.trim());
 }
 function closeOptions(){
  body.classList.remove('options-open');more.setAttribute('aria-expanded','false');
 }
 more.onclick=()=>{const on=body.classList.toggle('options-open');more.setAttribute('aria-expanded',String(on));};
 palette.onclick=()=>{body.classList.toggle('palette-open');label();};
 options.addEventListener('click',event=>{if(event.target.closest('button'))closeOptions();});
 document.getElementById('cats').addEventListener('click',event=>{
  if(event.target.closest('[data-cat]')){body.classList.add('palette-open');label();}
 });
 document.addEventListener('pointerdown',event=>{
  if(!event.target.closest('#sbOptions,#bMore'))closeOptions();
 });
 document.addEventListener('sandbox-tutorial-target',event=>{
  body.classList.toggle('show-sb-count',event.detail==='#sbCount');
  if(!body.classList.contains('compact-ui')||!event.detail)return;
  const target=document.querySelector(event.detail);
  if(!target)return;
  if(options.contains(target)){
   body.classList.add('options-open');more.setAttribute('aria-expanded','true');
   requestAnimationFrame(()=>target.scrollIntoView({block:'nearest'}));
  }else closeOptions();
  if(target.closest('#items')){
   body.classList.add('palette-open');label();
  }
 });
 const portraitQ=matchMedia('(max-aspect-ratio:999/1000)');
 function layout(){
  const compact=touch.matches||narrow.matches||short.matches;
  // мобильная раскладка: вертикальный экран или сенсорный экран; ПК с мышью в горизонтальном окне — без изменений
  const portrait=portraitQ.matches,qMob=new URLSearchParams(location.search).get('mob'),mobile=qMob==='1'||(qMob!=='0'&&(portrait||touch.matches));
  body.classList.toggle('compact-ui',compact||qMob==='1');
  body.classList.toggle('touch-ui',touch.matches||qMob==='1');
  body.classList.toggle('is-mobile',mobile);
  body.classList.toggle('mob-p',mobile&&portrait);
  body.classList.toggle('mob-l',mobile&&!portrait);
  closeOptions();label();
 }
 portraitQ.addEventListener('change',layout);
 for(const query of [touch,narrow,short])query.addEventListener('change',layout);
 touch.addEventListener('change',()=>onViewport());
 let pending=false;
 function syncFloor(){
  pending=false;
  if(typeof screen==='undefined'||screen!=='sandbox')return;
  const previous=FLOOR;
  const inset=body.classList.contains('sbplay')?Math.min(110,innerHeight*.2):document.getElementById('bottom').offsetHeight;
  if(Math.abs(floorInset-inset)<.5)return;
  setFloorInset(inset);
  shiftWorld(FLOOR-previous);
 }
 function schedule(){
  if(pending)return;pending=true;
  requestAnimationFrame(syncFloor);
 }
 new ResizeObserver(schedule).observe(document.getElementById('bottom'));
 new MutationObserver(()=>{label();schedule();}).observe(body,{attributes:true,attributeFilter:['data-screen','class']});
 new MutationObserver(label).observe(document.getElementById('cats'),{childList:true});
 new MutationObserver(label).observe(document.getElementById('tools'),{childList:true});
 window.addEventListener('resize',schedule);
 // низ HUD уровня: на вертикальном экране под ним по очереди выстраиваются реплики, обучение и подсказки
 const hud=document.getElementById('hud');
 new ResizeObserver(()=>{const r=hud.getBoundingClientRect();if(r.height)document.documentElement.style.setProperty('--hud-bottom',Math.round(r.bottom)+'px');}).observe(hud);
 layout();
})();
