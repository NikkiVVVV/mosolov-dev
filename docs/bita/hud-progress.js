// A quick visible start, then a slower approach to full power. Physics stays linear.
export function chargeFill(power){const p=Math.max(0,Math.min(1,power));return Math.log1p(4*p)/Math.log(5)}
export function wonRailLayout(count,width,{size=36,step=14}={}){
 const available=Math.max(size,width),capacity=Math.max(1,Math.floor((available-size)/step)+1);
 function row(n){
  const overflow=n>capacity,visible=Math.min(n,capacity-(overflow?1:0)),start=Math.max(0,n-visible),hidden=n-visible,occupied=visible+(overflow?1:0),span=occupied?size+(occupied-1)*step:0;
  return{start,visible,hidden,width:span,overflowRight:overflow?0:null,slots:Array.from({length:visible},(_,i)=>({ordinal:start+i,right:(visible-1-i+(overflow?1:0))*step}))};
 }
 const current=row(count),next=row(count+1);return{capacity,...current,nextRight:next.slots.at(-1)?.right??0};
}
export function createWonRail({fan,getItems,ensureItem,imageFor,enabled=()=>true}){
 const overflow=document.createElement('span');overflow.className='collection-overflow';overflow.setAttribute('aria-hidden','true');overflow.hidden=true;fan.append(overflow);
 const nodes=new Map(),reduced=matchMedia('(prefers-reduced-motion:reduce)');let previousCount=null,destroyed=false;
 function render(){
  if(!enabled()||destroyed)return;const items=getItems(),layout=wonRailLayout(items.length,fan.clientWidth),visible=new Set(layout.slots.map(s=>s.ordinal)),batch=[];
  for(const [ordinal,entry]of nodes)if(!visible.has(ordinal)){entry.shell.remove();nodes.delete(ordinal)}
  for(const {ordinal,right}of layout.slots){
   let entry=nodes.get(ordinal);
   if(!entry){
    const shell=document.createElement('span'),img=new Image(36,36);shell.className='collection-slot';shell.setAttribute('aria-hidden','true');shell.dataset.ordinal=ordinal;img.alt='';img.draggable=false;img.decoding='async';shell.append(img);fan.append(shell);entry={shell,img};nodes.set(ordinal,entry);
    const arrives=previousCount!==null&&ordinal>=previousCount;
    const loaded=Promise.resolve().then(()=>ensureItem(items[ordinal])).then(async()=>{if(!shell.isConnected)return;img.src=imageFor(items[ordinal]);await img.decode();return true}).catch(()=>false);
    batch.push({entry,loaded,arrives});
   }
   entry.shell.style.setProperty('--rail-right',right+'px');entry.shell.style.setProperty('--rail-tilt',((ordinal%3)-1)*4+'deg');entry.shell.style.zIndex=ordinal+1;
  }
  // Reveal the initial strip as a single ordered wave, never in network completion order.
  if(batch.length)Promise.all(batch.map(b=>b.loaded)).then(results=>{
   if(destroyed)return;batch.forEach(({entry:{shell,img},arrives},i)=>{
    if(!shell.isConnected)return;if(!results[i]){shell.dataset.failed='true';return}
    const delay=reduced.matches?0:Math.min(i*42,420);shell.dataset.ready='true';
    if(!reduced.matches){img.animate([{opacity:0,transform:`translateX(${arrives?8:-10}px) scale(.88)`},{opacity:1,transform:'translateX(0) scale(1)'}],{delay,duration:360,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});shell.animate([{backgroundColor:'#e2e4e2'},{backgroundColor:'transparent'}],{delay,duration:360,fill:'backwards'})}
   });
  });
  overflow.hidden=layout.hidden===0;overflow.textContent=layout.hidden?`+${layout.hidden}`:'';overflow.style.zIndex=items.length+2;overflow.style.right=(layout.overflowRight??0)+'px';fan.dataset.count=items.length;previousCount=items.length;
 }
 const observer=new ResizeObserver(render);observer.observe(fan);
 return {render,nextTarget(){const r=fan.getBoundingClientRect(),layout=wonRailLayout(getItems().length,r.width);return{x:r.right-layout.nextRight-18,y:r.top+r.height/2}},destroy(){destroyed=true;observer.disconnect();for(const e of nodes.values())e.shell.remove();nodes.clear();overflow.remove()}};
}
