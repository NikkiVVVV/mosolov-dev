export const resultSplashKind=(won,overloaded)=>overloaded?'spill':won>=3?'win':null;

export function createResultSplash(){
 const root=document.createElement('div');root.className='result-splash';root.hidden=true;root.setAttribute('aria-hidden','true');
 root.innerHTML='<div class="result-splash-veil"></div><div class="result-splash-band"><span class="result-splash-bolt"><svg viewBox="0 0 80 96"><path d="M47 2 8 54h26l-5 40 43-58H45Z"/></svg></span><strong></strong><i></i><i></i><i></i></div>';
 document.body.append(root);const band=root.querySelector('.result-splash-band'),veil=root.firstElementChild,label=root.querySelector('strong'),bolt=root.querySelector('.result-splash-bolt');let pending=null;
 function play(kind){if(pending)return pending;root.dataset.kind=kind;label.textContent=kind==='win'?'wow!':'oops!';root.hidden=false;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,duration=reduced?500:1250;
  const animations=[veil.animate([{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.75},{opacity:0}],{duration,fill:'both'}),band.animate(reduced?[{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.75},{opacity:0}]:[{transform:'translate(-150%,-50%) rotate(-6deg)',opacity:1},{transform:'translate(-50%,-50%) rotate(-6deg)',offset:.25},{transform:'translate(-50%,-50%) rotate(-6deg)',offset:.72},{transform:'translate(60%,-50%) rotate(-6deg)',opacity:1}],{duration,easing:'linear',fill:'both'})];
  if(!reduced)animations.push(bolt.animate([{scale:.5,rotate:'-18deg',opacity:0},{scale:1.12,rotate:'4deg',opacity:1,offset:.3},{scale:1,rotate:'0deg',opacity:1,offset:.6},{scale:1,opacity:1}],{duration:950,fill:'both'}));
  pending=Promise.all(animations.map(a=>a.finished.catch(()=>{}))).finally(()=>{root.hidden=true;animations.forEach(a=>a.cancel());pending=null});return pending;
 }
 return {play};
}
