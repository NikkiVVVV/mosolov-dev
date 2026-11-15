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
 const nodes=new Map(),reduced=matchMedia('(prefers-reduced-motion:reduce)');let previousCount=null;
 function render(){
  if(!enabled())return;const items=getItems(),layout=wonRailLayout(items.length,fan.clientWidth),visible=new Set(layout.slots.map(s=>s.ordinal));
  for(const [ordinal,img]of nodes)if(!visible.has(ordinal)){img.remove();nodes.delete(ordinal)}
  for(const {ordinal,right}of layout.slots){
   let img=nodes.get(ordinal);
   if(!img){img=new Image(36,36);img.alt='';img.draggable=false;img.decoding='async';img.dataset.ordinal=ordinal;img.style.opacity='0';fan.append(img);nodes.set(ordinal,img);const arrives=previousCount!==null&&ordinal>=previousCount;
    ensureItem(items[ordinal]).then(async()=>{if(!img.isConnected)return;img.src=imageFor(items[ordinal]);await img.decode();if(!img.isConnected)return;img.style.opacity='1';if(arrives&&!reduced.matches)img.animate([{opacity:0,scale:.7,translate:'0 -4px'},{opacity:1,scale:1,translate:'0 0'}],{duration:260,easing:'cubic-bezier(.2,.75,.2,1)'})}).catch(()=>{});
   }
   img.style.setProperty('--rail-right',right+'px');img.style.setProperty('--rail-tilt',((ordinal%3)-1)*4+'deg');img.style.zIndex=ordinal+1;
  }
  overflow.hidden=layout.hidden===0;overflow.textContent=layout.hidden?`+${layout.hidden}`:'';overflow.style.zIndex=items.length+2;overflow.style.right=(layout.overflowRight??0)+'px';fan.dataset.count=items.length;previousCount=items.length;
 }
 const observer=new ResizeObserver(render);observer.observe(fan);
 return {render,nextTarget(){const r=fan.getBoundingClientRect(),layout=wonRailLayout(getItems().length,r.width);return{x:r.right-layout.nextRight-18,y:r.top+r.height/2}},destroy(){observer.disconnect();nodes.clear()}};
}
