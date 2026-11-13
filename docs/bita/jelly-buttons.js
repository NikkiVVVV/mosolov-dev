import {JellyBody,traceSmoothPath} from './vendor/jelly-body.js';
const blend=(a,b,t)=>`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*t)).join(' ')})`;
// Real Jelly UI membrane, behind native controls so hold, focus and disabled remain native.
export function createJellyButtons(buttons,{getThemeMix=()=>0}={}){
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),items=[];
 for(const button of buttons){
  const content=document.createElement('span');content.className='jelly-content';while(button.firstChild)content.append(button.firstChild);button.append(content);
  const canvas=document.createElement('canvas');canvas.className='jelly-face';canvas.setAttribute('aria-hidden','true');button.prepend(canvas);
  const ctx=canvas.getContext('2d'),pad=32;let body,width=0,height=0,dpr=1,pointer=null,dirty=true,lastTheme=-1;
  function resize(){width=button.clientWidth;height=button.clientHeight;if(!width||!height)return;
   body=new JellyBody({width:width-2,height:height-2,radius:parseFloat(getComputedStyle(button).borderRadius)||16,config:{samples:96}});
   dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=(width+pad*2)*dpr;canvas.height=(height+pad*2)*dpr;
   canvas.style.width=width+pad*2+'px';canvas.style.height=height+pad*2+'px';dirty=true;button.dataset.jellyReady='true';paint();
  }
  function paint(){if(!body)return;const theme=button.id==='strike'?Number(document.documentElement.dataset.theme==='dark'):getThemeMix();lastTheme=theme;
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width+pad*2,height+pad*2);ctx.save();ctx.translate(pad+width/2,pad+height/2);
   const depth=body.state.clickDepth,scale=1-depth*.025;ctx.translate(0,depth*1.5);ctx.scale(scale,scale);
   traceSmoothPath(ctx,body.getSurfacePoints().map(p=>body.projectPoint(p)));
   const fill=ctx.createLinearGradient(0,-height/2,0,height/2);fill.addColorStop(0,blend([250,250,248],[70,72,73],theme));fill.addColorStop(1,blend([229,231,227],[43,45,46],theme));
   ctx.fillStyle=fill;ctx.shadowColor=theme>.5?'#0005':'#2930231d';ctx.shadowBlur=8;ctx.shadowOffsetY=3;ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.lineWidth=1;ctx.strokeStyle=blend([255,255,255],[91,93,94],theme);ctx.stroke();ctx.restore();
   content.style.color=blend([67,71,65],[236,237,234],theme);content.style.transform=`translateY(${depth*1.5}px) scale(${scale})`;dirty=false;
  }
  function local(e){const r=button.getBoundingClientRect();return [e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2]}
  button.addEventListener('pointerdown',e=>{if(button.disabled||reduced.matches||!body)return;pointer=e.pointerId;body.pressAtLocal(...local(e));dirty=true});
  button.addEventListener('pointermove',e=>{if(e.pointerId===pointer&&body)body.moveToLocal(...local(e))});
  function release(e){if(pointer===null||e&&e.pointerId!==undefined&&e.pointerId!==pointer)return;pointer=null;body?.release();dirty=true}
  window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('blur',()=>release());
  button.addEventListener('keydown',e=>{if(!button.disabled&&!e.repeat&&['Space','Enter'].includes(e.code)&&!reduced.matches){body?.centerPulse();dirty=true}});
  button.addEventListener('keyup',e=>{if(['Space','Enter'].includes(e.code)){body?.release();dirty=true}});
  const observer=new ResizeObserver(resize);observer.observe(button);resize();
  items.push({update(dt){if(!body)return;const theme=button.id==='strike'?Number(document.documentElement.dataset.theme==='dark'):getThemeMix();if(!reduced.matches&&!body.isResting()){body.update(Math.min(dt,.033));dirty=true}if(dirty||Math.abs(theme-lastTheme)>.002)paint()},active:()=>body&&!body.isResting()&&!reduced.matches});
 }
 return {update(dt){items.forEach(item=>item.update(dt))},active:()=>items.some(item=>item.active())};
}
