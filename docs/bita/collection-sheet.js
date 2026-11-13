// A single native modal: the 3D preview stays above a scrollable cap tray.
export function createCollectionSheet({getItems,ensureItem,imageFor,nameFor,inspect,stopInspect}){
 const dialog=document.getElementById('album'),grid=document.getElementById('albumGrid'),preview=document.getElementById('albumPreview'),name=document.getElementById('albumName'),position=document.getElementById('albumPosition'),grab=document.getElementById('albumGrab');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let items=[],buttons=[],selected=-1,revision=0,observer=null,closing=false,gesture=null,returnFocus=null;
 function mark(index){for(const [i,button]of buttons.entries()){button.setAttribute('aria-pressed',String(i===index));button.tabIndex=i===index?0:-1}}
 async function thumbnail(button){if(button.dataset.loaded)return;button.dataset.loaded='pending';const item=items[+button.dataset.slot];try{await ensureItem(item);const img=button.querySelector('img');img.src=imageFor(item);await img.decode();button.dataset.loaded='true'}catch{delete button.dataset.loaded}}
 async function select(index,{focus=false,scroll=false}={}){
  if(!dialog.open||index<0||index>=items.length)return;const token=++revision;preview.setAttribute('aria-busy','true');mark(index);
  try{await ensureItem(items[index]);if(token!==revision||!dialog.open)return;
   selected=index;inspect(items[index],preview);name.textContent=nameFor(items[index]);position.textContent=`${index+1} / ${items.length}`;preview.setAttribute('aria-label',nameFor(items[index]));
   if(!reduced.matches)preview.animate([{opacity:.45,transform:'translateY(6px) scale(.98)'},{opacity:1,transform:'none'}],{duration:220,easing:'cubic-bezier(.2,.7,.2,1)'});
   if(scroll)buttons[index].scrollIntoView({block:'nearest',behavior:reduced.matches?'instant':'smooth'});
   if(focus)buttons[index].focus({preventScroll:true});
  }catch{if(token===revision)mark(selected)}finally{if(token===revision)preview.setAttribute('aria-busy','false')}
 }
 function resetDrag(){dialog.style.removeProperty('transform');dialog.style.removeProperty('opacity');gesture=null}
 async function close(){if(!dialog.open||closing)return;closing=true;++revision;
  if(!reduced.matches){const from=getComputedStyle(dialog).transform;await dialog.animate([{transform:from==='none'?'translateY(0)':from,opacity:1},{transform:'translateY(32px)',opacity:0}],{duration:160,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{})}
  dialog.close();
 }
 dialog.addEventListener('close',()=>{++revision;stopInspect();observer?.disconnect();dialog.getAnimations().forEach(a=>a.cancel());resetDrag();closing=false;preview.setAttribute('aria-busy','false');returnFocus?.focus({preventScroll:true})});
 dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 document.getElementById('closeAlbum').onclick=close;
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}});
 grab.addEventListener('pointerdown',e=>{if(e.button!==0)return;dialog.getAnimations().forEach(a=>a.cancel());gesture={id:e.pointerId,y:e.clientY,lastY:e.clientY,at:performance.now(),speed:0,dy:0};grab.setPointerCapture(e.pointerId)});
 grab.addEventListener('pointermove',e=>{if(gesture?.id!==e.pointerId)return;const now=performance.now();gesture.speed=(e.clientY-gesture.lastY)/Math.max(1,now-gesture.at);gesture.lastY=e.clientY;gesture.at=now;gesture.dy=Math.max(0,e.clientY-gesture.y);dialog.style.transform=`translateY(${gesture.dy}px)`});
 const end=e=>{if(gesture?.id!==e.pointerId)return;const dismiss=gesture.dy>80||(gesture.dy>24&&gesture.speed>.65);if(dismiss)close();else{const dy=gesture.dy;resetDrag();if(!reduced.matches)dialog.animate([{transform:`translateY(${dy}px)`},{transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.2,.8,.2,1)'})}};
 grab.addEventListener('pointerup',end);grab.addEventListener('pointercancel',()=>resetDrag());
 grid.addEventListener('keydown',e=>{const from=Number(e.target.closest('button')?.dataset.slot);if(!Number.isInteger(from))return;const columns=getComputedStyle(grid).gridTemplateColumns.split(' ').length;let to;
  if(e.key==='ArrowRight')to=from+1;else if(e.key==='ArrowLeft')to=from-1;else if(e.key==='ArrowDown')to=from+columns;else if(e.key==='ArrowUp')to=from-columns;else if(e.key==='Home')to=0;else if(e.key==='End')to=items.length-1;else return;
  e.preventDefault();select(Math.max(0,Math.min(items.length-1,to)),{focus:true,scroll:true});
 });
 function open(){if(dialog.open)return;items=getItems().slice().reverse();if(!items.length)return;returnFocus=document.activeElement;selected=-1;closing=false;buttons=[];grid.replaceChildren();name.textContent='';position.textContent=`1 / ${items.length}`;observer?.disconnect();
  observer=new IntersectionObserver(entries=>{for(const item of entries)if(item.isIntersecting){thumbnail(item.target);observer.unobserve(item.target)}},{root:grid,rootMargin:'96px'});
  for(const [i,item]of items.entries()){
   const button=document.createElement('button'),img=new Image();button.type='button';button.dataset.slot=i;button.tabIndex=i===0?0:-1;button.setAttribute('aria-label',`View ${nameFor(item)}`);button.setAttribute('aria-pressed','false');img.alt='';img.width=img.height=64;img.decoding='async';button.append(img);button.onclick=()=>select(i);grid.append(button);buttons.push(button);observer.observe(button);
  }
  dialog.showModal();grid.scrollTop=0;select(0);document.getElementById('closeAlbum').focus({preventScroll:true});
 }
 return {open,close,isOpen:()=>dialog.open};
}
