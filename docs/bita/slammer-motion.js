const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
export const SLAMMER_MOVE_MS=300;
// Leave the old slot, travel outside the stack, then enter the new slot.
export function slammerPath(from,to,progress){
 const a={x:-1.2,y:from.y+.07,z:from.z},b={x:-1.2,y:to.y+.07,z:to.z};
 if(progress<.3)return mix(from,a,ease(progress/.3));
 if(progress<.6)return mix(a,b,ease((progress-.3)/.3));
 return mix(b,to,ease((progress-.6)/.4));
}
