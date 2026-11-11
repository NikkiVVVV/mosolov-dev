import * as THREE from './vendor/three.module.js';
export function createShowcase({makeModel,nameFor,onBack}){
 const pane=document.getElementById('showcase'),back=document.getElementById('showcaseBack'),title=document.getElementById('showcaseTitle'),step=document.getElementById('showcaseStep');
 let renderer=null,scene=null,camera=null,model=null,mode=null,entry=null,size=0,canvasSize=0,yaw=0,pitch=0,drag=null,reward=null;
 function ensure(){if(renderer)return;
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;pane.prepend(renderer.domElement);renderer.domElement.className='showcase-canvas';renderer.domElement.tabIndex=0;
  scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-200,200,200,-200,.1,2000);camera.position.z=1000;
  scene.add(new THREE.HemisphereLight(0xffffff,0x9c9a8f,1.8));const key=new THREE.DirectionalLight(0xffffff,2.6);key.position.set(-300,400,600);scene.add(key);const fill=new THREE.DirectionalLight(0xe0eaff,.8);fill.position.set(400,-100,300);scene.add(fill);
  const studio=new THREE.Scene();studio.background=new THREE.Color(0x888888);for(const [x,y,z,sx,sy,sz,p]of[[-4,4,3,2,7,1,4],[4,2,1,1,6,3,2],[0,7,-2,6,1,4,3]]){const panel=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshBasicMaterial({color:new THREE.Color().setScalar(p)}));panel.position.set(x,y,z);studio.add(panel)}const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(studio,.025).texture;pm.dispose();studio.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}});
  renderer.domElement.addEventListener('pointerdown',e=>{if(mode==='reward'){if(reward)reward.fast=true;return}drag={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId)});
  renderer.domElement.addEventListener('pointermove',e=>{if(mode!=='inspect'||drag?.id!==e.pointerId)return;yaw+=(e.clientX-drag.x)*.012;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.009,-1.25,1.25);drag.x=e.clientX;drag.y=e.clientY});
  const end=()=>drag=null;renderer.domElement.addEventListener('pointerup',end);renderer.domElement.addEventListener('pointercancel',end);
  renderer.domElement.addEventListener('keydown',e=>{if(mode==='reward'&&['Space','Enter'].includes(e.code)){e.preventDefault();reward.fast=true}});
 }
 function disposeModel(){if(!model)return;scene.remove(model);model.traverse(o=>{if(o.isMesh)o.geometry.dispose()});model=null}
 function resize(){canvasSize=Math.min(460,innerWidth,innerHeight*.72);size=canvasSize*.72;renderer.setSize(canvasSize,canvasSize);camera.left=-canvasSize/2;camera.right=canvasSize/2;camera.top=canvasSize/2;camera.bottom=-canvasSize/2;camera.updateProjectionMatrix();pane.style.setProperty('--showcase-size',canvasSize+'px');pane.style.setProperty('--showcase-title-offset',size/2+24+'px')}
 function prepare(item,newMode){ensure();disposeModel();entry=item;mode=newMode;drag=null;resize();model=makeModel(item);scene.add(model);model.scale.setScalar(size/1.06);pane.hidden=false;pane.dataset.mode=newMode;pane.style.setProperty('--showcase-veil',newMode==='inspect'?'.96':'.86');back.hidden=newMode!=='inspect';title.textContent=nameFor(item);title.hidden=false;title.style.opacity='1';step.style.opacity='1';renderer.domElement.style.transform='translate(-50%,-50%)';renderer.domElement.setAttribute('aria-label',newMode==='reward'?'Следующая выбитая фишка':'Вращайте фишку пальцем');}
 function close(){const old=mode;mode=null;reward=null;pane.hidden=true;disposeModel();if(old==='inspect')onBack?.()}
 back.onclick=close;pane.addEventListener('keydown',e=>{if(e.key==='Escape'&&mode==='inspect')close()});
 function inspect(item){prepare(item,'inspect');yaw=0;pitch=0;step.hidden=true;renderer.domElement.focus()}
 function award(item,{target,index,total}){prepare(item,'reward');step.textContent=`${index+1} / ${total}`;step.hidden=false;const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;return new Promise(resolve=>{reward={started:performance.now(),target,resolve,reduced,fast:false};})}
 const base=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2),qy=new THREE.Quaternion(),qx=new THREE.Quaternion();
 function update(now,dt){if(!mode||!model)return;let scale=1;
  if(mode==='inspect'){if(!drag&&!matchMedia('(prefers-reduced-motion:reduce)').matches)yaw+=dt*.22;model.quaternion.copy(qy.setFromAxisAngle(new THREE.Vector3(0,1,0),yaw)).multiply(qx.setFromAxisAngle(new THREE.Vector3(1,0,0),pitch)).multiply(base);}
  else if(reward){const r=reward,hold=r.reduced?220:1400,fly=r.reduced?180:500;if(r.fast&&now-r.started<hold)r.started=now-hold;const age=now-r.started,p=THREE.MathUtils.clamp(age/hold,0,1),turn=r.reduced?0:Math.PI*2*(p*p*(3-2*p));model.quaternion.copy(qy.setFromAxisAngle(new THREE.Vector3(0,1,0),turn)).multiply(qx.setFromAxisAngle(new THREE.Vector3(1,0,0),Math.sin(p*Math.PI)*.15)).multiply(base);scale=.85+.15*Math.min(1,p*5);
   const f=THREE.MathUtils.clamp((age-hold)/fly,0,1),ease=f*f*(3-2*f),s=1+(28/size-1)*ease;renderer.domElement.style.transform=`translate(-50%,-50%) translate(${(r.target.x-innerWidth/2)*ease}px,${(r.target.y-innerHeight/2)*ease}px) scale(${s})`;pane.style.setProperty('--showcase-veil',String(.86*(1-ease)));title.style.opacity=String(1-f);step.style.opacity=String(1-f);
   if(age>=hold+fly){const resolve=r.resolve;mode=null;reward=null;pane.hidden=true;disposeModel();resolve();return}
  }
  if(model){model.scale.setScalar(size/1.06*scale);renderer.render(scene,camera)}
 }
 window.addEventListener('resize',()=>{if(mode)resize()});return {inspect,award,update,active:()=>!!mode};
}
