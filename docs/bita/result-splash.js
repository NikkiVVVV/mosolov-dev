export const resultSplashKind=(won,overloaded)=>overloaded?'spill':won>=8?'epic':won>=5?'super':won>=3?'win':won>=1?'nice':'miss';
const labels={nice:'nice!',win:'wow!',super:'super!',epic:'epic!',miss:'miss',spill:'overload'};
const palettes={blue:['#e2f4ff','#479aff'],purple:['#f0dfff','#aa63ff'],black:['#e1e4e7','#3d4149']};
let resources;
function loadResources(){return resources??=Promise.all([import('./vendor/lottie_light.min.js'),fetch(new URL('./assets/effects/burst-stars.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Burst unavailable');return r.json()})]).then(([,data])=>({player:window.lottie,data})).catch(()=>null)}
function recolor(node,color){if(!node||typeof node!=='object')return;if((node.ty==='st'||node.ty==='fl')&&node.c&&!node.c.a)node.c.k=color;for(const value of Object.values(node))if(value&&typeof value==='object')recolor(value,color)}
export function createResultSplash(){
 const root=document.createElement('div');root.className='result-splash';root.hidden=true;root.setAttribute('aria-hidden','true');
 root.innerHTML='<div class="result-splash-veil"></div><div class="result-burst"></div><div class="result-impact"><div class="result-ring"></div><strong></strong></div>';
 document.body.append(root);const veil=root.firstElementChild,burst=root.querySelector('.result-burst'),impact=root.querySelector('.result-impact'),label=root.querySelector('strong'),ring=root.querySelector('.result-ring');let pending=null;
 // Fetch only the tiny vector burst at startup. The player loads during idle time.
 const preload=()=>loadResources();if('requestIdleCallback'in window)requestIdleCallback(preload,{timeout:3000});else setTimeout(preload,1500);
 function play(kind,tone='purple'){
  if(pending)return pending;root.dataset.kind=kind;const neutral=kind==='miss'||kind==='spill',palette=palettes[neutral?'black':tone]||palettes.purple;
  root.style.setProperty('--result-color',palette[1]);root.style.setProperty('--result-light',palette[0]);label.replaceChildren(...[...labels[kind]].map(char=>{const el=document.createElement('span');el.textContent=char;return el}));root.hidden=false;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,duration=reduced?500:kind==='nice'?1300:kind==='miss'?1100:1650;
  let player=null,closed=false;
  if(!reduced)loadResources().then(resource=>{if(!resource||closed)return;const data=structuredClone(resource.data),rgb=palette[1].match(/\w\w/g).map(x=>parseInt(x,16)/255);recolor(data,[...rgb,1]);player=resource.player.loadAnimation({container:burst,renderer:'svg',loop:false,autoplay:true,animationData:data,rendererSettings:{preserveAspectRatio:'xMidYMid meet',progressiveLoad:false}});player.setSpeed(1.3);root.dataset.lottie='playing'});
  const options={duration,fill:'both'},animations=[veil.animate([{opacity:0},{opacity:1,offset:.1},{opacity:1,offset:.72},{opacity:0}],options)];
  if(reduced)animations.push(impact.animate([{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.7},{opacity:0}],options));
  else{
   animations.push(impact.animate([{transform:'scale(.4) rotate(-10deg)',opacity:0},{transform:'scale(1.08) rotate(-4deg)',opacity:1,offset:.18},{transform:'scale(.97) rotate(-4deg)',offset:.28},{transform:'scale(1) rotate(-4deg)',offset:.4},{transform:'scale(1.02) rotate(-4deg)',opacity:1,offset:.76},{transform:'scale(1.24) rotate(-4deg)',opacity:0}],options));
   animations.push(ring.animate([{transform:'scale(.15)',opacity:0},{opacity:.65,offset:.12},{transform:'scale(2.8)',opacity:0,offset:.6},{opacity:0}],options));
   for(const [i,letter]of [...label.children].entries())animations.push(letter.animate([{transform:'translateY(24px) scale(.3)',opacity:0},{transform:'translateY(-8px) scale(1.16)',opacity:1,offset:.22},{transform:'translateY(0) scale(1)',opacity:1,offset:.4},{transform:'translateY(0) scale(1)',opacity:1}],{duration:600,delay:60+i*28,fill:'both',easing:'cubic-bezier(.2,.7,.3,1)'}));
   animations.push(burst.animate([{opacity:0},{opacity:1,offset:.08},{opacity:1,offset:.68},{opacity:0}],options));
  }
  pending=Promise.all(animations.map(a=>a.finished.catch(()=>{}))).finally(()=>{closed=true;player?.destroy();burst.replaceChildren();root.hidden=true;root.dataset.lottie='idle';animations.forEach(a=>a.cancel());pending=null});return pending;
 }
 return {play};
}
