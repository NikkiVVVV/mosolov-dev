import {JellyBody,traceSmoothPath} from './vendor/jelly-body.js';
// Procedural frosted-violet glass: no text or icons baked into the texture.
function glassTexture(width,height,dpr){
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*dpr);canvas.height=Math.ceil(height*dpr);const context=canvas.getContext('2d'),image=context.createImageData(canvas.width,canvas.height);
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  const nx=(x/canvas.width-.5)*2,ny=(y/canvas.height-.5)*2,edge=Math.max(Math.abs(nx)**5,Math.abs(ny)**4),bloom=Math.exp(-(nx*nx*1.4+(ny-.5)**2*1.7)),noise=((Math.imul(x+17,y+131)*1597334677>>>0)%1024)/1024-.5;
  const light=36*bloom-18*edge+noise*17,at=(y*canvas.width+x)*4;
  image.data[at]=105+light;image.data[at+1]=46+light*.8;image.data[at+2]=212+light*.75;image.data[at+3]=255;
 }
 context.putImageData(image,0,0);return canvas;
}
// Real Jelly UI membrane, behind native controls so hold, focus and disabled remain native.
export function createJellyButtons(buttons,{getThemeMix=()=>0}={}){
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),items=[];
 for(const button of buttons){
  const content=document.createElement('span');content.className='jelly-content';while(button.firstChild)content.append(button.firstChild);button.append(content);
  const canvas=document.createElement('canvas');canvas.className='jelly-face';canvas.setAttribute('aria-hidden','true');button.prepend(canvas);
  const ctx=canvas.getContext('2d'),pad=32;let body,width=0,height=0,dpr=1,pointer=null,dirty=true,lastTheme=-1,glass=null,press=[0,0];
  function resize(){width=button.clientWidth;height=button.clientHeight;if(!width||!height)return;
   body=new JellyBody({width:width-2,height:height-2,radius:parseFloat(getComputedStyle(button).borderRadius)||16,config:{samples:96}});
   dpr=Math.min(devicePixelRatio||1,1.5);glass=glassTexture(width+12,height+4,dpr);canvas.width=(width+pad*2)*dpr;canvas.height=(height+pad*2)*dpr;
   canvas.style.width=width+pad*2+'px';canvas.style.height=height+pad*2+'px';dirty=true;button.dataset.jellyReady='true';paint();
  }
  function paint(){if(!body)return;const theme=button.id==='strike'?Number(document.documentElement.dataset.theme==='dark'):getThemeMix();lastTheme=theme;
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width+pad*2,height+pad*2);ctx.save();ctx.translate(pad+width/2,pad+height/2);
   const depth=body.state.clickDepth,scale=1-depth*.025;ctx.translate(0,depth*1.5);ctx.scale(scale,scale);
   traceSmoothPath(ctx,body.getSurfacePoints().map(p=>body.projectPoint(p)));
   ctx.shadowColor=`rgba(116,54,227,${.2+theme*.18})`;ctx.shadowBlur=14;ctx.shadowOffsetY=5;ctx.fillStyle='#7737dc';ctx.fill();
   ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.lineWidth=6;ctx.strokeStyle=theme>.5?'#c498ff20':'#bca2e53d';ctx.stroke();
   ctx.save();ctx.clip();
   // Refract the static grain in narrow overlapping strips around the press.
   // The membrane and the glass surface deform together; no new WebGL context.
   const strips=18,band=height/strips;
   for(let i=0;i<strips;i++){
    const y=-height/2+i*band,wave=Math.sin((y-press[1])*.12)*Math.exp(-Math.abs(y-press[1])/(height*.7))*depth*2.4;
    ctx.drawImage(glass,0,i*glass.height/strips,glass.width,glass.height/strips+1,-width/2-6+wave,y,width+12,band+1);
   }
   const glow=ctx.createRadialGradient(width*.2,height*.48,1,width*.1,height*.48,width*.8);glow.addColorStop(0,'#f1d4ff65');glow.addColorStop(.55,'#b46bff20');glow.addColorStop(1,'#6d2bff00');ctx.fillStyle=glow;ctx.fillRect(-width/2,-height/2,width,height);
   const rim=ctx.createLinearGradient(0,-height/2,0,height/2);rim.addColorStop(0,'#e5caffb0');rim.addColorStop(.25,'#d3a7ff18');rim.addColorStop(.65,'#e2afff18');rim.addColorStop(1,'#ead0ffd9');ctx.strokeStyle=rim;ctx.lineWidth=5;ctx.stroke();
   const caustic=ctx.createRadialGradient(press[0],press[1],0,press[0],press[1],width*.55);caustic.addColorStop(0,`rgba(249,224,255,${.05+depth*.2})`);caustic.addColorStop(1,'#e5b6ff00');ctx.fillStyle=caustic;ctx.fillRect(-width/2,-height/2,width,height);ctx.restore();
   ctx.strokeStyle='#e8d1ff91';ctx.lineWidth=1;ctx.stroke();ctx.restore();
   content.style.color='#fff';content.style.textShadow='0 1px 3px #40127735';content.style.transform=`translateY(${depth*1.5}px) scale(${scale})`;dirty=false;
  }
  function local(e){const r=button.getBoundingClientRect();return [e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2]}
  button.addEventListener('pointerdown',e=>{if(button.disabled||reduced.matches||!body)return;pointer=e.pointerId;press=local(e);body.pressAtLocal(...press);dirty=true});
  button.addEventListener('pointermove',e=>{if(e.pointerId===pointer&&body){press=local(e);body.moveToLocal(...press)}});
  function release(e){if(pointer===null||e&&e.pointerId!==undefined&&e.pointerId!==pointer)return;pointer=null;body?.release();dirty=true}
  window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('blur',()=>release());
  button.addEventListener('keydown',e=>{if(!button.disabled&&!e.repeat&&['Space','Enter'].includes(e.code)&&!reduced.matches){body?.centerPulse();dirty=true}});
  button.addEventListener('keyup',e=>{if(['Space','Enter'].includes(e.code)){body?.release();dirty=true}});
  const observer=new ResizeObserver(resize);observer.observe(button);resize();
  items.push({update(dt){if(!body)return;const theme=button.id==='strike'?Number(document.documentElement.dataset.theme==='dark'):getThemeMix();if(!reduced.matches&&!body.isResting()){body.update(Math.min(dt,.033));dirty=true}if(dirty||Math.abs(theme-lastTheme)>.002)paint()},active:()=>body&&!body.isResting()&&!reduced.matches});
 }
 return {update(dt){items.forEach(item=>item.update(dt))},active:()=>items.some(item=>item.active())};
}
