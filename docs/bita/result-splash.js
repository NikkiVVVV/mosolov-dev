import {createResultPrism} from './result-prism.js?v=20261115-flow47';
export const resultSplashKind=(won,overloaded)=>overloaded?'spill':won>=8?'epic':won>=5?'super':won>=2?'win':won===1?'nice':'miss';
const phrases={nice:['тыщ'],win:['вау','крутой чел','чел ты крейзи','тыщ','да ты чо','базару ноль'],super:['крутой чел','чел ты крейзи','да ты чо','базару ноль','вау'],epic:['чел ты крейзи','базару ноль','крутой чел','да ты чо'],miss:['бывает','ну почти'],spill:['перебор']};
export const RESULT_PALETTES={violet:['#f0dfff','#a56cff'],coral:['#ffe6ed','#ff6c86'],amber:['#fff0cd','#ffb94e'],cyan:['#d8fcff','#51d6ea'],rose:['#fbe1ff','#e473e9'],blue:['#e2f4ff','#479aff'],black:['#e1e4e7','#3d4149']};
function pick(items,random,avoid){const pool=items.filter(x=>x!==avoid);return(pool.length?pool:items)[Math.min((pool.length||items.length)-1,Math.floor(Math.max(0,random())*(pool.length||items.length)))]}
export function chooseResultStyle(kind,previous={},random=Math.random){const neutral=['miss','spill'].includes(kind),phrase=pick(phrases[kind],random,previous.phrase),colorName=neutral?'black':pick(['violet','coral','amber','cyan','rose','blue'],random,previous.colorName),entrance=neutral?'stamp':pick(['pop','stamp','twist'],random,previous.entrance);return{kind,phrase,colorName,palette:RESULT_PALETTES[colorName],entrance}}
let resources;
function loadResources(){return resources??=Promise.all([import('./vendor/lottie_light.min.js'),fetch(new URL('./assets/effects/burst-stars.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Burst unavailable');return r.json()})]).then(([,data])=>({player:window.lottie,data})).catch(()=>null)}
function recolor(node,color){if(!node||typeof node!=='object')return;if((node.ty==='st'||node.ty==='fl')&&node.c&&!node.c.a)node.c.k=color;for(const value of Object.values(node))if(value&&typeof value==='object')recolor(value,color)}
const impactFrames={
 pop:[{transform:'scale(.35) rotate(-8deg)',opacity:0},{transform:'scale(1.04) rotate(0deg)',opacity:1,offset:.18},{transform:'scale(1) rotate(0deg)',offset:.28},{transform:'scale(1) rotate(0deg)',offset:.4},{transform:'scale(1) rotate(0deg)',opacity:1,offset:.76},{transform:'scale(1.2) rotate(-3deg)',opacity:0}],
 stamp:[{transform:'translateY(-56px) scale(1.15)',opacity:0},{transform:'translateY(4px) scale(.98)',opacity:1,offset:.17},{transform:'translateY(0) scale(1)',offset:.3},{transform:'translateY(0) scale(1)',opacity:1,offset:.76},{transform:'translateY(16px) scale(.98)',opacity:0}],
 twist:[{transform:'scale(.2) rotate(20deg)',opacity:0},{transform:'scale(1.04) rotate(-7deg)',opacity:1,offset:.21},{transform:'scale(1) rotate(0deg)',offset:.37},{transform:'scale(1) rotate(0deg)',opacity:1,offset:.76},{transform:'scale(1.24) rotate(6deg)',opacity:0}]
};
export function createResultSplash(){
 const root=document.createElement('div');root.className='result-splash';root.hidden=true;root.setAttribute('aria-hidden','true');root.innerHTML='<div class="result-splash-veil"></div><div class="result-burst"></div><svg class="result-electric" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"></svg><div class="result-impact"><div class="result-ring"></div><strong></strong></div>';document.body.append(root);
 const veil=root.firstElementChild,burst=root.querySelector('.result-burst'),impact=root.querySelector('.result-impact'),label=root.querySelector('strong'),ring=root.querySelector('.result-ring'),electric=root.querySelector('.result-electric');document.fonts.load('800 64px "Result Display"').catch(()=>{});let pending=null,previous={},prism=null;
 const preload=()=>loadResources();if('requestIdleCallback'in window)requestIdleCallback(preload,{timeout:3000});else setTimeout(preload,1500);
 function play(kind){
  if(pending)return pending;const style=chooseResultStyle(kind,previous);previous=style;const{palette,phrase,entrance}=style;root.dataset.kind=kind;root.dataset.entrance=entrance;root.dataset.color=style.colorName;root.dataset.long=String(phrase.includes(' '));root.style.setProperty('--result-color',palette[1]);root.style.setProperty('--result-light',palette[0]);
  root.lang='ru';label.replaceChildren(...phrase.split(' ').map(word=>{const row=document.createElement('span');row.className='result-word';for(const char of word){const letter=document.createElement('span');letter.className='result-letter';letter.textContent=char;row.append(letter)}return row}));root.hidden=false;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,duration=reduced?500:kind==='nice'?1350:kind==='miss'?1100:phrase.length>10?1850:1650;let player=null,closed=false;
  if(!reduced)loadResources().then(resource=>{if(!resource||closed)return;const data=structuredClone(resource.data),rgb=palette[1].match(/\w\w/g).map(x=>parseInt(x,16)/255);recolor(data,[...rgb,1]);player=resource.player.loadAnimation({container:burst,renderer:'svg',loop:false,autoplay:true,animationData:data,rendererSettings:{preserveAspectRatio:'xMidYMid meet',progressiveLoad:false}});player.setSpeed(entrance==='stamp'?1.45:1.2);root.dataset.lottie='playing'});
  if(!reduced){try{prism??=createResultPrism(root);root.dataset.prism='true';prism.play(palette,duration,['miss','spill'].includes(kind))}catch{}}
  const options={duration,fill:'both'},animations=[veil.animate([{opacity:0},{opacity:1,offset:.1},{opacity:1,offset:.72},{opacity:0}],options)];
  if(reduced)animations.push(impact.animate([{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.7},{opacity:0}],options));
  else{
   // Vector arcs retain sharp edges at every device pixel ratio; no full-screen canvas.
   electric.replaceChildren();
   if(kind!=='miss'&&kind!=='spill'){
    const count=kind==='nice'?4:kind==='epic'?10:8;
    for(let i=0;i<count;i++){
     const a=i*Math.PI*2/count+Math.random()*.16,ux=Math.cos(a),uy=Math.sin(a),j=(Math.random()-.5)*50;
     const point=(r,side=0)=>`${500+ux*r-uy*side},${500+uy*r+ux*side}`;
     const path=document.createElementNS('http://www.w3.org/2000/svg','path');
     path.setAttribute('d',`M${point(190)} L${point(245,j)} L${point(275,-j*.8)} L${point(340,j*.6)} L${point(395,-j)} M${point(275,-j*.8)} L${point(315,j*2+25)} L${point(355,j*2+35)}`);
     path.setAttribute('pathLength','1');electric.append(path);
     animations.push(path.animate([{strokeDashoffset:1,opacity:0},{strokeDashoffset:.2,opacity:1,offset:.17},{strokeDashoffset:0,opacity:.8,offset:.3},{strokeDashoffset:0,opacity:.7,offset:.48},{strokeDashoffset:0,opacity:0,offset:.65},{opacity:0}],{duration:kind==='nice'?720:1000,delay:i%3*38,fill:'both',easing:'ease-out'}));
    }
   }
   animations.push(impact.animate(impactFrames[entrance],options));animations.push(ring.animate([{transform:'scale(.15)',opacity:0},{opacity:.65,offset:.12},{transform:'scale(2.8)',opacity:0,offset:.6},{opacity:0}],options));for(const[i,letter]of [...label.querySelectorAll('.result-letter')].entries())animations.push(letter.animate([{transform:'translateY(14px)',opacity:0},{transform:'translateY(-2px)',opacity:1,offset:.24},{transform:'translateY(0) scale(1)',opacity:1,offset:.5},{opacity:1}],{duration:520,delay:40+i*18,fill:'both',easing:'cubic-bezier(.2,.7,.3,1)'}));animations.push(burst.animate([{opacity:0},{opacity:1,offset:.08},{opacity:1,offset:.68},{opacity:0}],options))}
  pending=Promise.all(animations.map(a=>a.finished.catch(()=>{}))).finally(()=>{closed=true;prism?.stop();player?.destroy();burst.replaceChildren();electric.replaceChildren();root.hidden=true;root.dataset.lottie='idle';animations.forEach(a=>a.cancel());pending=null});return pending;
 }
 return{play};
}
