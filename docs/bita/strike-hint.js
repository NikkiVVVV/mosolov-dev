const KEY='bita-strike-hint-v1';
export function createStrikeCoach({storage,show=()=>{},hide=()=>{}}={}){
 let learned=false;try{storage??=window.localStorage;learned=storage.getItem(KEY)==='1'}catch{}
 return {record(duration){if(learned)return false;learned=true;try{storage?.setItem(KEY,'1')}catch{}if(duration<450){show();return true}return false},hide};
}
export function createStrikeHint(){
 const toast=document.createElement('div');toast.className='strike-hint';toast.lang='ru';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.hidden=true;toast.textContent='Зажми кнопку, чтобы ударить сильнее';document.body.append(toast);
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');let timer=null,motion=null;
 function hide(){clearTimeout(timer);motion?.cancel();toast.hidden=true}
 function show(){hide();toast.hidden=false;if(!reduced.matches)motion=toast.animate([{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 0'}],{duration:220,easing:'cubic-bezier(.2,.75,.2,1)'});timer=setTimeout(()=>{if(reduced.matches){hide();return}motion=toast.animate([{opacity:1,translate:'0 0'},{opacity:0,translate:'0 8px'}],{duration:160,easing:'ease-in'});motion.finished.then(hide).catch(()=>{})},5000)}
 return createStrikeCoach({show,hide});
}
