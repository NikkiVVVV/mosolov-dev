// Game events only. Failure to load Metrica must never interrupt play.
(()=>{
 const id=113296360,root=document.documentElement;
 const enabled=location.hostname==='mosolov.dev'&&/^\/bita(?:\/|$)/.test(location.pathname)&&!navigator.webdriver;
 const allowed=new Set(['bita_pack_open','bita_strike','bita_win','bita_miss','bita_overload','bita_collection_open','bita_slammer_open','bita_share_click']);
 const recent=new Map();
 function track(name,details={}){
  if(!enabled||!allowed.has(name))return false;
  const now=Date.now();if(name!=='bita_strike'&&now-(recent.get(name)||0)<1100)return false;recent.set(name,now);
  const params={project:'bita'};
  for(const k of ['hold_ms','stack_size','slammer_slot','won_count'])if(Number.isFinite(details[k]))params[k]=Math.max(0,Math.round(details[k]));
  if(typeof details.slammer==='string')params.slammer=details.slammer.slice(0,60);
  try{window.ym(id,'reachGoal',name,params);return true}catch{return false}
 }
 window.bitaAnalytics={track};if(!enabled)return;
 window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments)};window.ym.l=Date.now();root.dataset.analytics='loading';
 document.addEventListener('yacounter'+id+'inited',()=>{root.dataset.analytics='ready'},{once:true});
 window.ym(id,'init',{triggerEvent:true,url:'https://mosolov.dev/bita/',clickmap:false,trackLinks:false,accurateTrackBounce:true,webvisor:false,ecommerce:false,disableYtm:true,params:{project:'bita'}});
 const script=document.createElement('script');script.async=true;script.src='https://mc.yandex.ru/metrika/tag.js?id='+id;script.onerror=()=>{root.dataset.analytics='unavailable'};document.head.append(script);
})();
