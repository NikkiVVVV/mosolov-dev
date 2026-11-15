// A visual demonstration only: this controller has no strike/physics callbacks.
export const HOLD_DEMO_KEY='bita-hold-demo-v1';
export function createHoldDemo({storage,reduced=false}={}){
 let seen=false;try{storage??=window.localStorage;seen=storage.getItem(HOLD_DEMO_KEY)==='1'}catch{}
 let phase=seen?'done':'dormant',elapsed=0,power=0;
 const wait=.6,hold=reduced?1:1.8,lower=reduced?.6:.9,peak=reduced?.18:.28;
 const remember=()=>{seen=true;try{storage?.setItem(HOLD_DEMO_KEY,'1')}catch{}};
 function interrupt(){if(phase==='done'||phase==='dormant')return false;remember();phase='done';elapsed=0;power=0;return true}
 return{
  get phase(){return phase},get active(){return phase==='holding'||phase==='lowering'},get power(){return power},
  arm(){if(seen||phase!=='dormant')return false;phase='waiting';elapsed=0;return true},
  interrupt,
  update(dt,eligible=true){
   if(!Number.isFinite(dt)||dt<=0)return;
   if(!eligible){if(phase==='holding'||phase==='lowering')interrupt();return}
   if(!['waiting','holding','lowering'].includes(phase))return;elapsed+=dt;
   if(phase==='waiting'){if(elapsed<wait)return;elapsed-=wait;remember();phase='holding'}
   if(phase==='holding'){
    if(elapsed<hold){const t=Math.min(elapsed/hold,1);power=peak*(1-(1-t)**2);return}
    elapsed-=hold;phase='lowering';
   }
   if(phase==='lowering'){
    const t=Math.min(elapsed/lower,1);power=peak*(1-t*t*(3-2*t));
    if(t===1){phase='done';power=0;elapsed=0}
   }
  }
 };
}
