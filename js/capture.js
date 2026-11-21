// Временный инструмент для съёмки материалов страницы игры. Работает только локально (localhost), на площадках выключен.
// F12 — скриншот, F11 — начать/остановить запись видео, F10 — полный экран. Снимается вкладка целиком, вместе с интерфейсом и звуком.
// При первом нажатии браузер спросит, какую вкладку снимать: выбрать эту. Дальше доступ держится до перезагрузки.
(function(){
 if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))return;
 if(!(navigator.mediaDevices&&navigator.mediaDevices.getDisplayMedia))return;
 let stream=null,video=null,rec=null,chunks=[],title0='';
 const stamp=()=>new Date().toISOString().slice(0,19).replace(/[-:]/g,'').replace('T','_');
 const download=(blob,name)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);};
 async function getStream(){
  if(stream&&stream.active)return stream;
  stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:60,cursor:'never'},audio:true,preferCurrentTab:true,selfBrowserSurface:'include',surfaceSwitching:'exclude'});
  video=document.createElement('video');video.muted=true;video.srcObject=stream;await video.play();
  stream.getVideoTracks()[0].addEventListener('ended',()=>{if(rec&&rec.state!=='inactive')rec.stop();stream=null;});
  await new Promise(r=>setTimeout(r,300)); // первый кадр после выбора вкладки ещё с окном выбора
  return stream;
 }
 async function shot(){
  try{await getStream();}catch(e){console.warn('capture: доступ к вкладке не дан',e);return;}
  const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0);
  c.toBlob(b=>b&&download(b,`veggie_shot_${stamp()}.png`),'image/png');
 }
 async function toggleRec(){
  if(rec&&rec.state==='recording'){rec.stop();return;}
  try{await getStream();}catch(e){console.warn('capture: доступ к вкладке не дан',e);return;}
  const type=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  chunks=[];rec=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:12e6});
  rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  rec.onstop=()=>{document.title=title0;download(new Blob(chunks,{type:'video/webm'}),`veggie_video_${stamp()}.webm`);};
  title0=document.title;rec.start(1000);document.title='● REC '+title0; // знак записи только в заголовке вкладки, в кадр не попадает
 }
 addEventListener('keydown',e=>{
  if(e.code==='F12'){e.preventDefault();e.stopPropagation();if(!e.repeat)shot();}
  else if(e.code==='F11'){e.preventDefault();e.stopPropagation();if(!e.repeat)toggleRec();}
  // F10 — полный экран самой страницы: не сбрасывается окном выбора вкладки и во время записи (выход — Esc или снова F10)
  else if(e.code==='F10'){e.preventDefault();e.stopPropagation();if(e.repeat)return;
   if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(()=>{});}
 },true);
})();
