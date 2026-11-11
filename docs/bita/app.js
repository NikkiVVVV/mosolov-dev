import * as THREE from './vendor/three.module.js';
import {RAPIER,createWorld,createStackBody,strikeStackDown,STACK_DISC_HEIGHT,HOVER_HEIGHT,STACK_LAYER_STEP,fanStack,turnStack,faceUp,sleepRestingBody,sleepRestingGroup,enforceTable} from './dynamics.js?v=20261111-hover3b';
const $=id=>document.getElementById(id),stage=$('stage'),strike=$('strike');
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;stage.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-2,2,3,-3,.1,60);
const hemi=new THREE.HemisphereLight(0xffffff,0xc2bcb0,1.6);scene.add(hemi);
const key=new THREE.DirectionalLight(0xfffcf4,2.4);key.position.set(-3,7,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-4.5,right:4.5,top:4.5,bottom:-4.5,near:.1,far:20});key.shadow.normalBias=.008;key.shadow.bias=-.0001;scene.add(key);
const fill=new THREE.DirectionalLight(0xdbe7ff,.65);fill.position.set(4,4,-3);scene.add(fill);
const studio=new THREE.Scene();studio.background=new THREE.Color(0x777777);
for(const [x,y,z,sx,sy,sz,p]of[[-4,4,3,2,7,1,4],[4,2,1,1,6,3,2],[0,7,-2,6,1,4,3]]){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshBasicMaterial({color:new THREE.Color().setScalar(p)}));m.position.set(x,y,z);studio.add(m)}
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(studio,.025).texture;pmrem.dispose();studio.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:.20,color:0x36382c}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;floor.receiveShadow=true;scene.add(floor);
let dark=localStorage.getItem('bita-theme')==='dark';
function applyTheme(){document.documentElement.dataset.theme=dark?'dark':'light';$('theme').setAttribute('aria-pressed',String(dark));$('theme').setAttribute('aria-label',dark?'Включить светлую тему':'Включить тёмную тему');hemi.intensity=dark?.85:1.6;key.intensity=dark?3:2.4;key.position.set(dark?4:-3,7,dark?-2:4);fill.intensity=dark?1.1:.65;floor.material.opacity=dark?.35:.20;document.querySelector('meta[name="theme-color"]').content=dark?'#191b1a':'#f8f8f6'}
applyTheme();$('theme').onclick=async e=>{const change=()=>{dark=!dark;localStorage.setItem('bita-theme',dark?'dark':'light');applyTheme();renderer.render(scene,camera)};if(!document.startViewTransition||matchMedia('(prefers-reduced-motion:reduce)').matches)return change();const x=e.clientX,y=e.clientY,r=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));const transition=document.startViewTransition(change);try{await transition.ready}catch{return}document.documentElement.animate({clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${r}px at ${x}px ${y}px)`]},{duration:480,easing:'ease-out',pseudoElement:'::view-transition-new(root)'})};
function texture(draw,w=512,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t}
const manifest=await fetch('assets/caps/manifest.json?v=20261111-hover3b').then(r=>r.json());
const imageCache=new Map();
function loadImage(path){if(!imageCache.has(path))imageCache.set(path,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=path+'?v=20261111-hover3b'}));return imageCache.get(path)}
const images=await Promise.all(manifest.map(e=>loadImage(e.file)));
const reverseImages=await Promise.all(manifest.map(e=>e.backFile?loadImage(e.backFile):null));
await document.fonts.ready;
function arcText(c,text,r,y,spacing){c.save();c.translate(256,y);c.fillStyle='#fff8df';c.font='500 43px "Golos Text",sans-serif';c.textAlign='center';for(let i=0;i<text.length;i++){c.save();c.rotate((i-(text.length-1)/2)*spacing);c.fillText(text[i],0,-r);c.restore()}c.restore()}
function backTexture(entry,i){if(reverseImages[i]){const t=new THREE.Texture(reverseImages[i]);t.needsUpdate=true;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}return texture(c=>{
 c.fillStyle='#d0b880';c.fillRect(0,0,512,512);c.beginPath();c.arc(256,256,248,0,Math.PI*2);c.fillStyle=entry.series==='mk'?'#cb672d':entry.series==='turtles'?'#67a33b':'#f4ecd7';c.fill();
 if(entry.series==='mk'){
  arcText(c,'DUNKIN',155,264,.2);c.font='italic 500 42px "Golos Text",sans-serif';c.textAlign='center';c.fillStyle='#fff3d4';c.fillText('SUPER',256,345);c.font='italic 500 83px "Golos Text",sans-serif';c.fillText('CAP',256,419);
  c.save();c.beginPath();c.arc(256,244,70,0,Math.PI*2);c.clip();c.drawImage(images[6],184,171,144,144);c.restore();c.strokeStyle='#ffedc3';c.lineWidth=4;c.beginPath();c.arc(256,244,70,0,Math.PI*2);c.stroke();
  for(const [x,n]of[[93,'2'],[419,String(18+i)]]){c.fillStyle='#fff1d3';c.beginPath();c.arc(x,264,23,0,Math.PI*2);c.fill();c.fillStyle='#c86930';c.font='500 25px "Golos Text"';c.fillText(n,x,273)}
 }else if(entry.series==='pokemon'){
  c.save();c.beginPath();c.arc(256,256,242,0,Math.PI*2);c.clip();c.fillStyle='#c62932';c.fillRect(0,0,512,228);c.fillStyle='#292b29';c.fillRect(0,223,512,9);c.restore();
  c.textAlign='center';c.font='italic 500 64px "Golos Text",sans-serif';c.strokeStyle='#274375';c.lineWidth=9;c.strokeText('Pokémon',256,147);c.fillStyle='#f2d34c';c.fillText('Pokémon',256,147);c.fillStyle='#272d30';c.font='500 24px "Golos Text"';c.fillText('POCKET MONSTERS',256,192);
  c.beginPath();c.arc(256,229,44,0,Math.PI*2);c.fillStyle='#282a29';c.fill();c.beginPath();c.arc(256,229,33,0,Math.PI*2);c.fillStyle='#f5efe0';c.fill();c.beginPath();c.arc(256,229,15,0,Math.PI*2);c.strokeStyle='#282a29';c.lineWidth=5;c.stroke();
  c.fillStyle='#35352c';c.font='500 30px "Golos Text"';c.fillText(entry.name,256,321);c.font='23px "Golos Text"';c.fillText('HP 60     •     40 / 60',256,367);
  ['#d63c37','#e9bc34','#3c98b0','#6a9860','#454c90'].forEach((color,j)=>{c.fillStyle=color;c.beginPath();c.arc(164+j*46,416,14,0,Math.PI*2);c.fill()});
 }else{c.textAlign='center';c.fillStyle='#192f19';c.font='500 33px "Golos Text"';c.fillText('TEENAGE MUTANT',256,177);c.font='500 62px "Golos Text"';c.fillText('NINJA',256,254);c.fillText('TURTLES',256,325);c.font='500 27px "Golos Text"';c.fillText('SUPER CAP',256,399)}
 c.strokeStyle='#e9d9b7';c.lineWidth=9;c.beginPath();c.arc(256,256,243,0,Math.PI*2);c.stroke();
 // A light paper grain, never UI decoration.
 for(let k=0;k<1800;k++){c.fillStyle=k%2?'#ffffff09':'#57371509';c.fillRect((k*127.31)%512,(k*79.63)%512,1.5,1.5)}
})}
const frontMats=images.map(img=>{const t=new THREE.Texture(img);t.needsUpdate=true;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return new THREE.MeshPhysicalMaterial({map:t,roughness:.43,metalness:0,clearcoat:.23,clearcoatRoughness:.36})});
const backMats=manifest.map((e,i)=>new THREE.MeshPhysicalMaterial({map:backTexture(e,i),roughness:.53,metalness:0,clearcoat:.16,clearcoatRoughness:.5}));
const edgeMap=texture((c,w,h)=>{c.fillStyle='#bdbbb0';c.fillRect(0,0,w,h);for(let y=0;y<h;y++){c.fillStyle=y%5===0?'#8e8c80':'#e7e4d8';c.globalAlpha=.15;c.fillRect(0,y,w,1)}for(let i=0;i<1800;i++){c.globalAlpha=.15;c.fillStyle=i%2?'#fffbe8':'#4b3927';c.fillRect((i*71.3)%w,(i*13.7)%h,1.5,1)}c.globalAlpha=.35;c.fillStyle='#77766d';c.fillRect(0,0,w,2);c.fillRect(0,h-2,w,2)},512,64);
const edgeMat=new THREE.MeshStandardMaterial({map:edgeMap,roughness:.92,metalness:0,color:0xffffff});
function makeCap(index,seed){const g=new THREE.Group();
 const bend=geo=>{const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),r=Math.hypot(x,z)/.53;pos.setY(i,pos.getY(i)+r*r*(.0018*Math.cos(Math.atan2(z,x)*3+seed)+.0011*Math.sin(x*5+seed)))}geo.computeVertexNormals();return geo};
 const edge=new THREE.Mesh(bend(new THREE.CylinderGeometry(.53,.53,STACK_DISC_HEIGHT,64,1,true)),edgeMat);edge.castShadow=true;g.add(edge);
 for(const [isFront,mat]of[[true,frontMats[index]],[false,backMats[index]]]){const geo=new THREE.CircleGeometry(.528,64);geo.rotateX(isFront?-Math.PI/2:Math.PI/2);geo.translate(0,isFront?STACK_DISC_HEIGHT/2+.0005:-STACK_DISC_HEIGHT/2-.0005,0);const m=new THREE.Mesh(bend(geo),mat);m.castShadow=true;m.receiveShadow=true;g.add(m)}
 scene.add(g);return g;
}
const world=await createWorld({extent:2.15}),events=new RAPIER.EventQueue(true);
let caps=[],count=4,state='ready',charge=null,physicsTime=0,flightStart=0,impactAt=0,impactElevation=.43,edgeAt=-1,twistAt=-1,groupRest={},still=0,numberedAt=0,collectAt=0;
let orbitYaw=-.18,orbitElevation=.43,orbitVelocity=0,viewWidth=2.65,viewElevation=.43,viewTarget=new THREE.Vector3(0,.18,0),viewYaw=-.18;
const order=[6,0,7,15,1,16,12,2,17,8,3,18,13,9,4,14,10,5,11];let serial=0;
const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
function resize(){renderer.setSize(stage.clientWidth,stage.clientHeight)}new ResizeObserver(resize).observe(stage);resize();
const collection=[];
try{const saved=JSON.parse(localStorage.getItem('bita-collection-v3')||'[]');for(const id of saved){const i=manifest.findIndex(e=>e.id===id);if(i>=0)collection.push(i)}}catch{}
function controls(){$('collectionToggle').disabled=!['ready','result'].includes(state);const locked=!['ready','result'].includes(state);$('minus').disabled=locked||count<=1;$('plus').disabled=locked||count>=12;strike.disabled=(locked&&state!=='charging')||(state==='ready'&&caps.some(c=>performance.now()-c.born<600));}
function renderCollection(){const fan=$('collectionFan');fan.replaceChildren();for(const i of collection.slice(-5)){const img=new Image();img.src=images[i].src;img.alt='';fan.append(img)}$('collectionCount').textContent=collection.length;$('collectionToggle').hidden=!collection.length;$('collectionToggle').setAttribute('aria-label',`Открыть коллекцию (${collection.length})`)}
function showCollection(){const grid=$('albumGrid');grid.replaceChildren();for(const i of collection){const img=new Image();img.src=images[i].src;img.alt=manifest[i].name;grid.append(img)}$('albumCount').textContent=collection.length;$('album').showModal()}
$('collectionToggle').onclick=showCollection;$('closeAlbum').onclick=()=>$('album').close();$('album').onclick=e=>{if(e.target!==$('album'))return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()};renderCollection();
function addCap(drop=true){const i=caps.length,index=order[serial++%order.length];const physical=createStackBody(world,i);const item={...physical,index,mesh:makeCap(index,i*.91),born:drop?performance.now():-10000,rest:{},won:false};caps.push(item);count=caps.length;if(drop){item.body.setTranslation({x:1.6,y:physical.position.y+.8,z:physical.position.z},true);item.body.setRotation(physical.rotation,true)}return item}
function removeCap(c){scene.remove(c.mesh);c.mesh.traverse(o=>{if(o.isMesh)o.geometry.dispose()});world.removeRigidBody(c.body)}
function reset(n=count,drop=true){caps.forEach(removeCap);caps=[];count=n||4;state='ready';$('announcer').textContent='';$('markers').replaceChildren();edgeAt=twistAt=-1;groupRest={};still=0;const desired=count;for(let i=0;i<desired;i++){const item=addCap(drop);if(drop)item.born=performance.now()+i*70}count=caps.length;controls()}
function restackRemaining(drop=true){const left=caps.filter(c=>!c.won).length;reset(left||4,drop)}
$('plus').onclick=()=>{if(state==='result')restackRemaining();if(state==='ready'&&count<12){addCap(true);controls()}};
$('minus').onclick=()=>{if(state==='result')restackRemaining();if(state==='ready'&&count>1){removeCap(caps.pop());count=caps.length;controls()}};
let audio=null;function ensureAudio(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume()}catch{}}
function sound(power){if(!audio||audio.state!=='running')return;const t=audio.currentTime;const buffer=audio.createBuffer(1,audio.sampleRate*.09,audio.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.exp(-i/(samples.length*.13));const src=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();src.buffer=buffer;filter.type='lowpass';filter.frequency.value=2200;gain.gain.value=.18+power*.08;src.connect(filter).connect(gain).connect(audio.destination);src.start(t)}
function begin(e){if(state==='result')restackRemaining(false);if(state!=='ready')return;ensureAudio();charge={start:performance.now(),power:0};state='charging';if(e.pointerId!==undefined)e.currentTarget.setPointerCapture?.(e.pointerId);strike.classList.add('charging');controls()}
function cancel(){if(!charge)return;charge=null;state='ready';strike.classList.remove('charging');strike.style.setProperty('--charge',0);controls()}
function release(){if(!charge)return;const power=clamp((performance.now()-charge.start)/1200,.15,1);charge=null;strike.classList.remove('charging');strike.style.setProperty('--charge',0);state='airborne';flightStart=physicsTime;still=0;groupRest={};strikeStackDown(caps.map(c=>c.body),power);caps.forEach(c=>{c.power=power;c.rest={}});controls()}
strike.addEventListener('pointerdown',begin);strike.addEventListener('pointerup',release);strike.addEventListener('pointercancel',cancel);
strike.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)&&!e.repeat){e.preventDefault();begin(e)}});strike.addEventListener('keyup',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();release()}});window.addEventListener('blur',cancel);
const pointers=new Map();let lastGesture=null;
renderer.domElement.addEventListener('pointerdown',e=>{if(!['ready','result'].includes(state))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});renderer.domElement.setPointerCapture(e.pointerId);lastGesture={x:e.clientX,y:e.clientY};orbitVelocity=0});
renderer.domElement.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!lastGesture)return;const dx=e.clientX-lastGesture.x,dy=e.clientY-lastGesture.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){orbitYaw-=dx*.009;orbitElevation=clamp(orbitElevation+dy*.006,.16,1.3);orbitVelocity=-dx*.0018}else{viewTarget.x=clamp(viewTarget.x-dx*.003,-.35,.35);viewTarget.z=clamp(viewTarget.z-dy*.003,-.35,.35)}lastGesture={x:e.clientX,y:e.clientY}});
function endGesture(e){pointers.delete(e.pointerId);if(!pointers.size)lastGesture=null}renderer.domElement.addEventListener('pointerup',endGesture);renderer.domElement.addEventListener('pointercancel',endGesture);
function impact(){if(state!=='airborne')return;state='scattering';impactAt=physicsTime;impactElevation=viewElevation;edgeAt=physicsTime+3/120;twistAt=physicsTime+12/120;const p=caps[0].power;sound(p);navigator.vibrate?.(12)}
function projectCap(c){return c.mesh.position.clone().project(camera)}
function finish(){caps.forEach(c=>{c.body.sleep();c.won=faceUp(c.body)});const won=caps.filter(c=>c.won).sort((a,b)=>projectCap(b).y-projectCap(a).y);$('markers').replaceChildren();
 if(!won.length){state='result';$('announcer').textContent='Ни одна фишка не перевернулась';controls();return}
 state='numbering';numberedAt=performance.now();collectAt=numberedAt+2600+won.length*180;
 won.forEach((c,i)=>{c.rank=i+1;const label=document.createElement('span');label.className='win-number';label.textContent=c.rank;label.setAttribute('aria-label',`Перевернувшаяся фишка ${c.rank}`);label.style.animationDelay=`${i*140}ms`;$('markers').append(label);c.label=label});$('announcer').textContent=`Перевернулось: ${won.length}`;controls();
}
async function collectWinners(){if(state!=='numbering')return;state='collecting';$('markers').replaceChildren();const won=caps.filter(c=>c.won).sort((a,b)=>a.rank-b.rank);const flights=[];const size=.53*2/viewWidth*stage.clientWidth;
 won.forEach((c,i)=>{const p=projectCap(c),startX=(p.x*.5+.5)*stage.clientWidth,startY=(-p.y*.5+.5)*stage.clientHeight;const targetX=innerWidth/2+(i-(won.length-1)/2)*9,targetY=stage.clientHeight-parseFloat(getComputedStyle($('collectionToggle')).bottom)-19;const img=new Image();img.src=images[c.index].src;img.className='flying-cap';img.style.cssText=`width:${size}px;height:${size}px;left:${startX-size/2}px;top:${startY-size/2}px`;$('flyingCaps').append(img);c.collected=true;c.mesh.visible=false;collection.push(c.index);
 const duration=matchMedia('(prefers-reduced-motion:reduce)').matches?150:650;const animation=img.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${targetX-startX}px,${targetY-startY}px) scale(${28/size})`,opacity:1}],{duration,delay:i*110,easing:'cubic-bezier(.35,0,.2,1)',fill:'forwards'});flights.push(animation.finished.catch(()=>{}).then(()=>img.remove()));
 });try{localStorage.setItem('bita-collection-v3',JSON.stringify(collection.map(i=>manifest[i].id)))}catch{}await Promise.all(flights);renderCollection();state='result';controls();
}
let previous=performance.now(),acc=0,lastFrame=0;
function frame(now){requestAnimationFrame(frame);if(document.hidden){previous=now;return}const idle=state==='ready'||state==='result';if(idle&&now-lastFrame<1000/30)return;lastFrame=now;const dt=Math.min((now-previous)/1000,.05);previous=now;const t=now/1000;
 if(state==='ready')controls();
 if(['ready','charging'].includes(state)){
  const p=charge?clamp((now-charge.start)/1200,0,1):0;if(charge)strike.style.setProperty('--charge',p);
  for(const [i,c]of caps.entries()){
   const age=(now-c.born)/600,progress=clamp(age,0,1),drop=1-progress,bounce=age>1?.018*Math.sin((age-1)*22)*Math.exp(-(age-1)*9):0,jitter=p*p*.026,bob=.010*Math.sin(t*.9);
   const x=c.position.x+drop*drop*1.6+Math.sin(t*56+i*.7)*jitter,y=c.position.y+.8*(1-progress*progress)+bounce+bob+Math.sin(t*65)*jitter*.7,z=c.position.z+Math.cos(t*61+i)*jitter*.6;
   c.body.setNextKinematicTranslation({x,y,z});const q=new THREE.Quaternion(c.rotation.x,c.rotation.y,c.rotation.z,c.rotation.w);if(jitter){const w=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(t*67)*jitter*.6,0,Math.cos(t*59)*jitter*.6));q.premultiply(w)}c.body.setNextKinematicRotation(q);
  }
 }
 acc+=dt;while(acc>=1/120){world.step(events);physicsTime+=1/120;events.drainCollisionEvents((a,b,start)=>{if(start&&state==='airborne'&&physicsTime-flightStart>.025&&(a===world.tableColliderHandle||b===world.tableColliderHandle)){const handle=a===world.tableColliderHandle?b:a;if(caps.some(c=>c.body.collider(0).handle===handle))impact()}});
  if(edgeAt>=0&&physicsTime>=edgeAt){fanStack(caps.map(c=>c.body),caps[0].power);edgeAt=-1}
  if(twistAt>=0&&physicsTime>=twistAt){turnStack(caps.map(c=>c.body),caps[0].power);twistAt=-1}
  if(state==='scattering'){const elapsed=physicsTime-impactAt;for(const c of caps){enforceTable(c.body,.53,STACK_DISC_HEIGHT);sleepRestingBody(c.body,c.rest,elapsed,1/120);if(elapsed>4){c.body.setAngularDamping(4);c.body.setLinearDamping(1.8)}}sleepRestingGroup(caps.map(c=>c.body),groupRest,elapsed,1/120)}acc-=1/120;
 }
 for(const c of caps){const p=c.body.translation(),q=c.body.rotation();c.mesh.position.set(p.x,p.y,p.z);c.mesh.quaternion.set(q.x,q.y,q.z,q.w);c.mesh.visible=!c.collected}
 if(state==='scattering'){const moving=caps.some(c=>{const v=c.body.linvel(),w=c.body.angvel();return Math.hypot(v.x,v.y,v.z)>.2||Math.hypot(w.x,w.y,w.z)>1.3});still=!moving&&physicsTime-impactAt>1?still+dt:0;if(still>.5)finish()}
 if(!pointers.size&&idle){orbitYaw+=orbitVelocity;orbitVelocity*=.87;if(state==='ready'&&Math.abs(orbitVelocity)<.0001)orbitYaw+=dt*.022}
 const spreading=['scattering','numbering','collecting','result'].includes(state),air=state==='airborne';
 const progress=spreading?clamp((physicsTime-impactAt)/1.35,0,1):0,smooth=progress*progress*(3-2*progress);
 const desiredElevation=spreading?lerp(impactElevation,1.515,smooth):orbitElevation;
 const extent=Math.max(...caps.map(c=>Math.abs(c.mesh.position.x*Math.cos(viewYaw)-c.mesh.position.z*Math.sin(viewYaw))+.58));
 const aspect=stage.clientWidth/stage.clientHeight,baseWidth=Math.max(2.65,4.4*aspect),targetWidth=spreading?Math.max(4.8,4.8*aspect,extent*2+.25):baseWidth;
 viewWidth=lerp(viewWidth,targetWidth,Math.min(1,dt*(spreading?4:3)));viewElevation=lerp(viewElevation,desiredElevation,Math.min(1,dt*5));viewYaw=lerp(viewYaw,orbitYaw,Math.min(1,dt*7));
 const averageY=caps.reduce((s,c)=>s+c.mesh.position.y,0)/caps.length;const targetY=spreading?0:air?Math.max(.15,averageY*.7):HOVER_HEIGHT+(.025+count*STACK_LAYER_STEP)/2;
 viewTarget.y=lerp(viewTarget.y,targetY,Math.min(1,dt*5));camera.position.set(viewTarget.x+Math.sin(viewYaw)*10*Math.cos(viewElevation),viewTarget.y+10*Math.sin(viewElevation),viewTarget.z+Math.cos(viewYaw)*10*Math.cos(viewElevation));camera.lookAt(viewTarget);
 camera.left=-viewWidth/2;camera.right=viewWidth/2;camera.top=viewWidth/aspect/2;camera.bottom=-camera.top;camera.updateProjectionMatrix();
 if(state==='numbering'){
  const used=[];
  for(const c of caps.filter(c=>c.label&&c.won).sort((a,b)=>a.rank-b.rank)){
   const p=projectCap(c),r=.53/viewWidth*stage.clientWidth;
   let x=clamp((p.x*.5+.5)*stage.clientWidth+r*.65,18,stage.clientWidth-18),y=clamp((-p.y*.5+.5)*stage.clientHeight-r*.65,80,stage.clientHeight-130);
   for(let k=0;k<12&&used.some(q=>Math.hypot(q.x-x,q.y-y)<30);k++){x+=30;if(x>stage.clientWidth-18){x-=60;y-=30}}
   c.label.style.left=`${x}px`;c.label.style.top=`${y}px`;used.push({x,y});
  }
  if(now>=collectAt)collectWinners();
 }
 renderer.render(scene,camera);
}
reset(4);$('loading').remove();requestAnimationFrame(frame);
