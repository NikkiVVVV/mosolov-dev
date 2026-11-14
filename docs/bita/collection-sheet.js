// One light sheet: a five-cap fan, with the inspected cap in the center.
export function createCollectionSheet({getItems,ensureItem,imageFor,nameFor,descriptionFor=()=>'',inspect,snapshot=()=>null,stopInspect,shareUrl,onClose=()=>{}}){
 const dialog=document.getElementById('album'),track=document.getElementById('albumCarousel'),preview=document.getElementById('albumPreview'),neighbors=document.getElementById('albumNeighbors'),name=document.getElementById('albumName'),description=document.getElementById('albumDescription'),grab=document.getElementById('albumGrab');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),cards=new Map();
 const shareButton=document.getElementById('shareAlbum');
 let items=[],selected=-1,cursor=0,revision=0,closing=false,gesture=null,swipe=null,returnFocus=null,ghost=null,shareTimer=null;
 const motion=[];
 function clearMotion(){for(const a of motion.splice(0))a.cancel();ghost?.remove();ghost=null;for(const b of cards.values())delete b.dataset.leaving}
 const wrap=i=>(i%items.length+items.length)%items.length;
 async function loadCard(button,index){
  if(button.dataset.loaded)return;button.dataset.loaded='pending';
  try{await ensureItem(items[index]);if(!button.isConnected||!dialog.open)return;const img=button.querySelector('img');img.src=imageFor(items[index]);await img.decode();button.dataset.loaded='true'}catch{delete button.dataset.loaded}
 }
 function paint(){
  const visible=new Map();for(const offset of [0,-1,1,-2,2]){const i=wrap(cursor+offset);if(!visible.has(i))visible.set(i,offset)}
  for(const [i,b]of cards)if(!visible.has(i)){b.remove();cards.delete(i)}
  for(const [i,offset]of visible){
   let b=cards.get(i);
   if(!b){b=document.createElement('button');b.type='button';b.className='album-cap-card';b.dataset.index=i;b.tabIndex=-1;b.setAttribute('aria-label',`View ${nameFor(items[i])}`);const img=new Image();img.alt='';img.width=img.height=160;img.decoding='async';b.append(img);b.onclick=e=>{if(e.detail===0)select(i)};neighbors.append(b);cards.set(i,b);loadCard(b,i)}
   const abs=Math.abs(offset);b.style.setProperty('--offset',offset);b.style.setProperty('--scale',abs===0?1:abs===1?.58:.42);b.style.setProperty('--yaw',`${offset===0?0:-Math.sign(offset)*(abs===1?32:48)}deg`);b.style.zIndex=String(10-abs);b.dataset.current=String(offset===0);b.setAttribute('aria-hidden',String(offset===0));
  }
 }
 async function select(index){
  if(!dialog.open||!items.length)return;index=wrap(index);if(index===selected&&index===cursor)return;
  const token=++revision;cursor=index;preview.setAttribute('aria-busy','true');
  try{await ensureItem(items[index]);if(token!==revision||!dialog.open)return;
   clearMotion();const previous=selected;let delta=previous<0?0:index-previous;if(Math.abs(delta)>items.length/2)delta-=Math.sign(delta)*items.length;const direction=Math.sign(delta)||1;
   if(previous>=0&&!reduced.matches){ghost=snapshot();if(ghost){ghost.className='album-outgoing';ghost.setAttribute('aria-hidden','true');track.append(ghost)}}
   selected=index;paint();inspect(items[index],preview,{revealFromBack:true,direction});name.textContent=nameFor(items[index]);description.textContent=descriptionFor(items[index]);preview.setAttribute('aria-label',nameFor(items[index]));
   if(previous>=0&&!reduced.matches){
    const shift=preview.clientWidth*.44;
    if(ghost){const leaving=cards.get(previous);if(leaving)leaving.dataset.leaving='true';const outgoing=ghost,a=ghost.animate([{translate:'0 0',scale:1,rotate:'y 0deg',opacity:1},{translate:`${-direction*shift}px 12px`,scale:.58,rotate:`y ${direction*32}deg`,opacity:0}],{duration:420,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});motion.push(a);a.finished.then(()=>{outgoing.remove();if(leaving)delete leaving.dataset.leaving}).catch(()=>{})}
    motion.push(preview.animate([{translate:`${direction*shift}px 12px`,scale:.58,rotate:`y ${-direction*32}deg`,opacity:.4},{translate:'0 0',scale:1,rotate:'y 0deg',opacity:1}],{duration:480,easing:'cubic-bezier(.22,1,.36,1)'}));
    for(const e of [name,description])motion.push(e.animate([{opacity:0,translate:`${direction*12}px 0`},{opacity:1,translate:'0 0'}],{duration:320,easing:'ease-out'}));
   }
  }catch{if(token===revision&&selected>=0){cursor=selected;paint()}}
  finally{if(token===revision)preview.setAttribute('aria-busy','false')}
 }
 function resetSwipe(){swipe=null;track.removeAttribute('data-dragging');track.style.setProperty('--carousel-drag','0px')}
 track.addEventListener('pointerdown',e=>{if(e.button!==0||swipe)return;swipe={id:e.pointerId,x:e.clientX,y:e.clientY,at:performance.now(),axis:null,tap:Number(e.target.closest('.album-cap-card')?.dataset.index)};track.setPointerCapture(e.pointerId)},true);
 track.addEventListener('pointermove',e=>{if(swipe?.id!==e.pointerId)return;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;if(!swipe.axis&&Math.max(Math.abs(dx),Math.abs(dy))>8)swipe.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';if(swipe.axis==='x'){e.stopPropagation();track.dataset.dragging='true';track.style.setProperty('--carousel-drag',`${Math.max(-48,Math.min(48,dx*.35))}px`)}},true);
 track.addEventListener('pointerup',e=>{if(swipe?.id!==e.pointerId)return;const s=swipe,dx=e.clientX-s.x,dy=e.clientY-s.y;resetSwipe();if(s.axis==='x'&&(Math.abs(dx)>28||(Math.abs(dx)>16&&Math.abs(dx)/Math.max(1,performance.now()-s.at)>.6)))select(cursor+(dx<0?1:-1));else if(Math.hypot(dx,dy)<8&&Number.isInteger(s.tap))select(s.tap)},true);
 track.addEventListener('pointercancel',resetSwipe,true);
 track.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=cursor+1;else if(e.key==='ArrowLeft')next=cursor-1;else if(e.key==='Home')next=0;else if(e.key==='End')next=items.length-1;else return;e.preventDefault();e.stopPropagation();select(next)},true);
 function resetDrag(){dialog.style.removeProperty('transform');dialog.style.removeProperty('opacity');gesture=null}
 async function close(){if(!dialog.open||closing)return;closing=true;++revision;
  if(!reduced.matches){const from=getComputedStyle(dialog).transform;await dialog.animate([{transform:from==='none'?'translateY(0)':from,opacity:1},{transform:'translateY(32px)',opacity:0}],{duration:160,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{})}
  dialog.close();
 }
 dialog.addEventListener('close',()=>{++revision;clearMotion();clearTimeout(shareTimer);shareButton.textContent='share';stopInspect();dialog.getAnimations().forEach(a=>a.cancel());resetDrag();resetSwipe();closing=false;preview.setAttribute('aria-busy','false');onClose();returnFocus?.focus({preventScroll:true})});
 dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 document.getElementById('closeAlbum').onclick=close;
 shareButton.onclick=async()=>{const url=shareUrl();try{if(navigator.share&&matchMedia('(any-pointer: coarse)').matches){try{await navigator.share({title:'My pog collection',url});return}catch(e){if(e.name==='AbortError')return}}await navigator.clipboard.writeText(url);shareButton.textContent='copied'}catch{shareButton.textContent='try again'}finally{clearTimeout(shareTimer);shareTimer=setTimeout(()=>shareButton.textContent='share',2200)}};
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}});
 grab.addEventListener('pointerdown',e=>{if(e.button!==0)return;dialog.getAnimations().forEach(a=>a.cancel());gesture={id:e.pointerId,y:e.clientY,lastY:e.clientY,at:performance.now(),speed:0,dy:0};grab.setPointerCapture(e.pointerId)});
 grab.addEventListener('pointermove',e=>{if(gesture?.id!==e.pointerId)return;const now=performance.now();gesture.speed=(e.clientY-gesture.lastY)/Math.max(1,now-gesture.at);gesture.lastY=e.clientY;gesture.at=now;gesture.dy=Math.max(0,e.clientY-gesture.y);dialog.style.transform=`translateY(${gesture.dy}px)`});
 grab.addEventListener('pointerup',e=>{if(gesture?.id!==e.pointerId)return;if(gesture.dy>80||(gesture.dy>24&&gesture.speed>.65))close();else{const dy=gesture.dy;resetDrag();if(!reduced.matches)dialog.animate([{transform:`translateY(${dy}px)`},{transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.2,.8,.2,1)'})}});grab.addEventListener('pointercancel',resetDrag);
 function open(){if(dialog.open)return;items=getItems().slice().reverse();if(!items.length)return;returnFocus=document.activeElement;selected=-1;cursor=0;closing=false;cards.clear();neighbors.replaceChildren();name.textContent=description.textContent='';dialog.showModal();select(0);track.focus({preventScroll:true})}
 return {open,close,isOpen:()=>dialog.open};
}
