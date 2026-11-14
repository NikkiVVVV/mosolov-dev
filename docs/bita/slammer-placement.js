const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const ease=t=>t*t*(3-2*t);
export const SLAMMER_PEEK=0;
export const SLAMMER_OUTSIDE=1.24;

// Give thin layers a useful finger travel, independent of the camera scale.
export function slammerDragStep(count){return clamp(count*14,84,280)/count}
export function slammerDragSlot(startSlot,deltaY,count,step=slammerDragStep(count)){
 return clamp(startSlot-Math.round(deltaY/step),0,count);
}

// A new layer opens only after the disc clears the old one. Reversing a gesture
// continues from the current pose, including during the final insertion.
export function createSlammerPlacement({slot=2,count=5,heightForLayer}){
 let selected=clamp(slot,0,count),requested=selected,y=heightForLayer(selected);
 let distance=SLAMMER_PEEK,phase='seated',dragging=false,elapsed=0,from=distance,gapAge=0;
 function extract(){from=distance;elapsed=0;phase='extracting'}
 return {
  get slot(){return selected},get requestedSlot(){return requested},
  get active(){return phase!=='seated'},get dragging(){return dragging},
  get phase(){return phase},get pose(){return {distance,y}},
  reset(nextSlot,nextCount=count){count=nextCount;selected=requested=clamp(nextSlot,0,count);y=heightForLayer(selected);distance=SLAMMER_PEEK;phase='seated';dragging=false;elapsed=gapAge=0},
  setCount(nextCount){count=nextCount;requested=clamp(requested,0,count);if(phase==='seated'&&selected!==requested)extract()},
  begin(){dragging=true;if(phase==='seated'||phase==='inserting')extract()},
  select(nextSlot){requested=clamp(nextSlot,0,count);if(phase==='seated'&&selected!==requested)extract()},
  end(){dragging=false},
  commit(){selected=requested;y=heightForLayer(selected);distance=SLAMMER_PEEK;phase='seated';dragging=false;elapsed=gapAge=0;return {distance,y}},
  update(dt){
   dt=clamp(dt,0,.1);
   if(phase==='extracting'){
    elapsed+=dt;const t=clamp(elapsed/.11,0,1);distance=from+(SLAMMER_OUTSIDE-from)*ease(t);
    if(t===1){phase='tracking';gapAge=0}
   }
   if(phase==='tracking'){
    if(selected!==requested){selected=requested;gapAge=0}
    gapAge+=dt;const target=heightForLayer(selected);y+=(target-y)*(1-Math.exp(-dt*32));
    if(Math.abs(target-y)<.002){y=target;if(!dragging&&gapAge>=.09){phase='inserting';from=distance;elapsed=0}}
   }else if(phase==='inserting'){
    elapsed+=dt;const t=clamp(elapsed/.16,0,1);distance=from+(SLAMMER_PEEK-from)*ease(t);
    if(t===1){distance=SLAMMER_PEEK;phase='seated'}
   }
   return {distance,y};
  }
 };
}
