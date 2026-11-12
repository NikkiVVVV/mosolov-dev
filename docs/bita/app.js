import * as THREE from './vendor/three.module.js';
import {RAPIER,createWorld,createStackBody,strikeStackDown,STACK_DISC_HEIGHT,HOVER_HEIGHT,STACK_LAYER_STEP,chargeLift,fanStack,turnStack,faceUp,sleepRestingBody,sleepRestingGroup,enforceTable,MAX_STACK,SLAMMER_HEIGHT,SLAMMER_RADIUS,slammerY,capInsertionOffset,createSlammerBody,slammerResponse,separateDiscs,limitDiscSpeed} from './dynamics.js?v=20261112-contact8';
import {createShowcase} from './showcase.js?v=20261112-contact8';
const CHARGE_MS=7000;
const $=id=>document.getElementById(id),stage=$('stage'),strike=$('strike');
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;stage.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-2,2,3,-3,.1,60);
const hemi=new THREE.HemisphereLight(0xffffff,0xc2bcb0,1.6);scene.add(hemi);
const key=new THREE.DirectionalLight(0xfffcf4,2.4);key.position.set(-3,7,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-4.5,right:4.5,top:4.5,bottom:-4.5,near:.1,far:20});key.shadow.normalBias=.0015;key.shadow.bias=-.00003;scene.add(key);
const fill=new THREE.DirectionalLight(0xdbe7ff,.65);fill.position.set(4,4,-3);scene.add(fill);
const studio=new THREE.Scene();studio.background=new THREE.Color(0x777777);
for(const [x,y,z,sx,sy,sz,p]of[[-4,4,3,2,7,1,4],[4,2,1,1,6,3,2],[0,7,-2,6,1,4,3]]){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshBasicMaterial({color:new THREE.Color().setScalar(p)}));m.position.set(x,y,z);studio.add(m)}
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(studio,.025).texture;pmrem.dispose();studio.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:.20,color:0x36382c}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;floor.receiveShadow=true;scene.add(floor);
let hasHit=false;
let dark=localStorage.getItem('bita-theme')==='dark';
function applyTheme(){document.documentElement.dataset.theme=dark?'dark':'light';$('theme').setAttribute('aria-pressed',String(dark));$('theme').setAttribute('aria-label',dark?'Включить светлую тему':'Включить тёмную тему');hemi.intensity=dark?.85:1.6;key.intensity=dark?3:2.4;key.position.set(dark?4:-3,7,dark?-2:4);fill.intensity=dark?1.1:.65;floor.material.opacity=dark?.35:.20;document.querySelector('meta[name="theme-color"]').content=dark?'#191b1a':'#f8f8f6'}
applyTheme();$('theme').onclick=async e=>{const change=()=>{dark=!dark;localStorage.setItem('bita-theme',dark?'dark':'light');applyTheme();renderer.render(scene,camera)};if(!document.startViewTransition||matchMedia('(prefers-reduced-motion:reduce)').matches)return change();const x=e.clientX,y=e.clientY,r=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));const transition=document.startViewTransition(change);try{await transition.ready}catch{return}document.documentElement.animate({clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${r}px at ${x}px ${y}px)`]},{duration:480,easing:'ease-out',pseudoElement:'::view-transition-new(root)'})};
function texture(draw,w=512,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t}
const manifest=await fetch('assets/caps/manifest.json?v=20261112-contact8').then(r=>r.json());
const imageCache=new Map();
function loadImage(path){if(!imageCache.has(path))imageCache.set(path,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=path+'?v=20261112-contact8'}));return imageCache.get(path)}
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
 }else if(entry.series!=='turtles'){c.textAlign='center';c.fillStyle='#e3c241';c.fillRect(0,0,512,512);c.fillStyle='#2b4675';c.font='italic 500 64px \"Golos Text\"';c.fillText(entry.series==='sonic'?'WACKERS':'SUPER CAPS',256,205);c.font='500 30px \"Golos Text\"';c.fillText(entry.series==='sonic'?'SONIC THE HEDGEHOG':entry.series.toUpperCase(),256,295);c.font='500 28px \"Golos Text\"';c.fillText('CAPS',256,380)}else{c.textAlign='center';c.fillStyle='#192f19';c.font='500 33px "Golos Text"';c.fillText('TEENAGE MUTANT',256,177);c.font='500 62px "Golos Text"';c.fillText('NINJA',256,254);c.fillText('TURTLES',256,325);c.font='500 27px "Golos Text"';c.fillText('SUPER CAP',256,399)}
 c.strokeStyle='#e9d9b7';c.lineWidth=9;c.beginPath();c.arc(256,256,243,0,Math.PI*2);c.stroke();
 // A light paper grain, never UI decoration.
 for(let k=0;k<1800;k++){c.fillStyle=k%2?'#ffffff09':'#57371509';c.fillRect((k*127.31)%512,(k*79.63)%512,1.5,1.5)}
})}
const frontMats=images.map((img,i)=>{const t=new THREE.Texture(img);t.needsUpdate=true;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return new THREE.MeshPhysicalMaterial({map:t,roughness:.44,metalness:0,clearcoat:.22,clearcoatRoughness:.25})});
const backTextureCache=new Map();
const backMats=manifest.map((e,i)=>{const key=e.backFile??(['mk','pokemon','turtles'].includes(e.series)?e.id:e.series);if(!backTextureCache.has(key))backTextureCache.set(key,backTexture(e,i));return new THREE.MeshPhysicalMaterial({map:backTextureCache.get(key),roughness:.53,metalness:0,clearcoat:.16,clearcoatRoughness:.5})});
const edgeMap=texture((c,w,h)=>{c.fillStyle='#bdbbb0';c.fillRect(0,0,w,h);for(let y=0;y<h;y++){c.fillStyle=y%5===0?'#8e8c80':'#e7e4d8';c.globalAlpha=.15;c.fillRect(0,y,w,1)}for(let i=0;i<1800;i++){c.globalAlpha=.15;c.fillStyle=i%2?'#fffbe8':'#4b3927';c.fillRect((i*71.3)%w,(i*13.7)%h,1.5,1)}c.globalAlpha=.35;c.fillStyle='#77766d';c.fillRect(0,0,w,2);c.fillRect(0,h-2,w,2)},512,64);
const edgeMat=new THREE.MeshStandardMaterial({map:edgeMap,roughness:.92,metalness:0,color:0xffffff});
const plasticEdgeMat=new THREE.MeshPhysicalMaterial({color:0xcbd1d8,roughness:.28,metalness:0,clearcoat:.65});
function makeCap(index,seed){const g=new THREE.Group(),plastic=false;
 const bend=geo=>{const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),r=Math.hypot(x,z)/.53;pos.setY(i,pos.getY(i)+(plastic?.15:1)*r*r*(.00028*Math.cos(Math.atan2(z,x)*3+seed)+.00018*Math.sin(x*5+seed)))}geo.computeVertexNormals();return geo};
 const edge=new THREE.Mesh(bend(new THREE.CylinderGeometry(.527,.527,STACK_DISC_HEIGHT-.002,64,1,true)),plastic?plasticEdgeMat:edgeMat);edge.castShadow=true;g.add(edge);
 for(const [isFront,mat]of[[true,frontMats[index]],[false,backMats[index]]]){const geo=new THREE.CircleGeometry(.526,64);if(!isFront)geo.rotateZ(Math.PI);geo.rotateX(isFront?-Math.PI/2:Math.PI/2);geo.translate(0,isFront?STACK_DISC_HEIGHT/2-.001:-STACK_DISC_HEIGHT/2+.001,0);const m=new THREE.Mesh(bend(geo),mat);m.castShadow=true;m.receiveShadow=true;g.add(m)}
 scene.add(g);return g;
}
const world=await createWorld({extent:2.15}),events=new RAPIER.EventQueue(true);

const slammerManifest=await fetch('assets/slammers/manifest.json').then(r=>r.json());
const slammerMats=await Promise.all(slammerManifest.map(async e=>Promise.all([e.frontFile,e.backFile].map(async path=>{const img=await loadImage(path),t=new THREE.Texture(img);t.needsUpdate=true;t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshPhysicalMaterial({map:t,bumpMap:t,bumpScale:.004,roughness:.25,clearcoat:1,clearcoatRoughness:.18})}))));
let slammer=null,slammerDesign=1,slammerSlot=6,slammerEnabled=true,slotOpened=false,insertAt=0,slammerContact=false,slammerAt=-1;
function makeSlammer(){const g=new THREE.Group(),e=slammerManifest[slammerDesign],mat=new THREE.MeshPhysicalMaterial({color:e.color,roughness:.22,clearcoat:1});const edge=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,SLAMMER_HEIGHT,64,1,true),mat);edge.castShadow=true;g.add(edge);for(const [i,front]of[true,false].entries()){const geo=new THREE.CircleGeometry(.548,64);geo.rotateX(front?-Math.PI/2:Math.PI/2);geo.translate(0,front?.041:-.041,0);const m=new THREE.Mesh(geo,slammerMats[slammerDesign][i]);m.castShadow=true;g.add(m)}for(const y of[-.035,.035]){const rim=new THREE.Mesh(new THREE.TorusGeometry(.544,.007,6,64),mat);rim.rotation.x=Math.PI/2;rim.position.y=y;g.add(rim)}scene.add(g);return g}
const pieces=()=>slammer?[...caps,slammer]:caps;
const showcase=createShowcase({makeModel:item=>{const m=makeCap(item.index,0);scene.remove(m);return m},nameFor:item=>manifest[item.index].name,onBack:()=>showCollection()});
function setupSlammer(){if(slammer)removeCap(slammer);slammer=null;slammerSlot=Math.min(slammerSlot,count);if(slammerEnabled)slammer={...createSlammerBody(world,slammerSlot),mesh:makeSlammer(),isSlammer:true,rest:{},born:-10000};$('slammerSlot').max=count;$('slammerSlot').value=slammerSlot;updateSlammerUI()}
function updateSlammerUI(){$('slammerSlot').disabled=!slammerEnabled;$('slammerSlot').setAttribute('aria-valuetext',slammerEnabled?`Слой ${slammerSlot} из ${count}`:'Без биты');$('slammerImage').src=slammerManifest[slammerDesign].frontFile}
$('slammerSlot').onpointerdown=()=>{if(state==='result')restackRemaining(false);slotOpened=true};
$('slammerSlot').oninput=e=>{slammerSlot=+e.target.value;insertAt=performance.now();updateSlammerUI()};
$('slammerSlot').onchange=()=>slotOpened=false;window.addEventListener('pointerup',()=>slotOpened=false);window.addEventListener('pointercancel',()=>slotOpened=false);
$('chooseSlammer').onclick=()=>$('slammerPicker').showModal();
for(let i=-1;i<slammerManifest.length;i++){const b=document.createElement('button');b.type='button';if(i<0)b.textContent='Без биты';else{const img=new Image();img.src=slammerManifest[i].frontFile;img.alt=slammerManifest[i].name;b.append(img)}b.onclick=()=>{slammerEnabled=i>=0;if(i>=0)slammerDesign=i;$('slammerPicker').close();if(state==='result')restackRemaining(false);else setupSlammer()};b.setAttribute('aria-label',i<0?'Без биты':slammerManifest[i].name);$('slammerOptions').append(b)}
$('closeSlammer').onclick=()=>$('slammerPicker').close();

let overloaded=false;
function setStrikeLabel(text){strike.setAttribute('aria-label',text+'. Удерживайте для сильного удара');const label=$('strikeLabel');if(label.textContent===text)return;label.textContent=text;label.animate([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'})}
let caps=[],count=12,state='ready',charge=null,physicsTime=0,flightStart=0,impactAt=0,impactElevation=.43,edgeAt=-1,twistAt=-1,groupRest={},still=0;
let orbitYaw=-.18,orbitElevation=.43,orbitVelocity=0,viewWidth=2.65,viewElevation=.43,viewTarget=new THREE.Vector3(0,.18,0),viewYaw=-.18;
const preferred=['batman-1','digimon-1','streetfighter-1','power-rangers-1','mad-monster-1','sonic-1','spacejam-10','dbz-1','sonic-29','spacejam-12','pokemon-25','cheetos-82','pokemon-25','mk-3','pokemon-6','mk-5','cheetos-62','pokemon-94','mk-7','pokemon-150','cheetos-90','pokemon-133','mk-20'];
const order=[...new Set([...preferred.map(id=>manifest.findIndex(e=>e.id===id)).filter(i=>i>=0),...manifest.map((_,i)=>i)])];let serial=0;
const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
function resize(){renderer.setSize(stage.clientWidth,stage.clientHeight)}new ResizeObserver(resize).observe(stage);resize();
const collection=[];
try{const saved=JSON.parse(localStorage.getItem('bita-collection-v3')||'[]');for(const id of saved){const i=manifest.findIndex(e=>e.id===id);if(i>=0)collection.push(i)}}catch{}
function controls(){const locked=!['ready','result'].includes(state);$('slammerTool').hidden=!['ready','result','charging'].includes(state);$('chooseSlammer').disabled=locked;$('slammerSlot').disabled=locked||!slammerEnabled;$('collectionToggle').disabled=!['ready','result'].includes(state);$('minus').disabled=locked||count<=1;$('plus').disabled=locked||count>=MAX_STACK;strike.disabled=(locked&&state!=='charging')||(state==='ready'&&caps.some(c=>performance.now()-c.born<750));}
function renderCollection(){const fan=$('collectionFan');fan.replaceChildren();for(const i of collection.slice(-3)){const img=new Image();img.src=images[i].src;img.alt='';fan.append(img)}$('collectionToggle').hidden=!collection.length&&state!=='collecting';$('collectionToggle').setAttribute('aria-label','Открыть выбитые фишки');}
function showCollection(){const grid=$('albumGrid');grid.replaceChildren();for(const i of collection){const img=new Image();img.src=images[i].src;img.alt=manifest[i].name;const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Рассмотреть ${manifest[i].name}`);b.append(img);b.onclick=()=>{$('album').close();showcase.inspect({index:i})};grid.append(b)}$('albumCount').textContent=collection.length;$('album').showModal()}
$('collectionToggle').onclick=showCollection;$('closeAlbum').onclick=()=>$('album').close();$('album').onclick=e=>{if(e.target!==$('album'))return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()};renderCollection();
function addCap(drop=true,chosen=null){const i=caps.length,index=chosen??order[serial++%order.length];const physical=createStackBody(world,i);const item={...physical,index,mesh:makeCap(index,i*.91),born:drop?performance.now():-10000,rest:{},won:false};caps.push(item);count=caps.length;if(drop){item.body.setTranslation({x:1.6,y:physical.position.y+.8,z:physical.position.z},true);item.body.setRotation(physical.rotation,true)}return item}
function removeCap(c){scene.remove(c.mesh);c.mesh.traverse(o=>{if(o.isMesh)o.geometry.dispose()});world.removeRigidBody(c.body)}
function reset(n=count,drop=true,indices=null){caps.forEach(removeCap);caps=[];count=n||12;hasHit=false;overloaded=false;setStrikeLabel('Бить');state='ready';stage.setAttribute('aria-label','Вращайте всю стопку пальцем');$('announcer').textContent='';$('markers').replaceChildren();edgeAt=twistAt=-1;groupRest={};still=0;const desired=count;for(let i=0;i<desired;i++){const item=addCap(drop,indices?.[i]);if(drop)item.born=performance.now()+i*70}count=caps.length;setupSlammer();renderCollection();controls()}
function restackRemaining(drop=true){const indices=caps.filter(c=>!c.won).map(c=>c.index);reset(indices.length||4,drop,indices.length?indices:null)}
$('plus').onclick=()=>{if(state==='result'&&!caps.some(c=>!c.won)){reset(1);return}if(state==='result')restackRemaining();if(state==='ready'&&count<MAX_STACK){addCap(true);$('slammerSlot').max=count;updateSlammerUI();controls()}};
$('minus').onclick=()=>{if(state==='result')restackRemaining();if(state==='ready'&&count>1){removeCap(caps.pop());count=caps.length;slammerSlot=Math.min(slammerSlot,count);$('slammerSlot').max=count;$('slammerSlot').value=slammerSlot;updateSlammerUI();controls()}};
for(const id of['plus','minus']){let timer,repeat;const b=$(id),action=b.onclick;b.onclick=e=>{if(!repeat)action(e);repeat=false};b.addEventListener('pointerdown',()=>{repeat=false;timer=setTimeout(()=>{repeat=true;action();timer=setInterval(action,140)},350)});for(const type of['pointerup','pointercancel'])window.addEventListener(type,()=>{clearTimeout(timer);clearInterval(timer)});b.addEventListener('pointerleave',()=>{clearTimeout(timer);clearInterval(timer)})}
let audio=null;function ensureAudio(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume()}catch{}}
function sound(power){if(!audio||audio.state!=='running')return;const t=audio.currentTime;const buffer=audio.createBuffer(1,audio.sampleRate*.09,audio.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.exp(-i/(samples.length*.13));const src=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();src.buffer=buffer;filter.type='lowpass';filter.frequency.value=2200;gain.gain.value=.18+power*.08;src.connect(filter).connect(gain).connect(audio.destination);src.start(t)}
function begin(e){if(state==='result')restackRemaining(false);if(state!=='ready')return;ensureAudio();charge={start:performance.now(),power:0};orbitVelocity=0;state='charging';if(e.pointerId!==undefined)e.currentTarget.setPointerCapture?.(e.pointerId);strike.classList.add('charging');controls()}
function cancel(){if(!charge)return;charge=null;state='ready';strike.classList.remove('charging');strike.style.setProperty('--charge',0);controls()}
function release(){if(!charge)return;if(performance.now()-charge.start>=CHARGE_MS)return overload();const power=clamp((performance.now()-charge.start)/CHARGE_MS,.15,1);charge=null;strike.classList.remove('charging');strike.style.setProperty('--charge',0);state='airborne';flightStart=physicsTime;still=0;groupRest={};slammerContact=false;slammerAt=-1;strikeStackDown(pieces().map(c=>c.body),power);pieces().forEach(c=>{c.power=power;c.rest={}});controls()}
function overload(){if(!charge)return;charge=null;overloaded=true;strike.classList.remove('charging');strike.style.setProperty('--charge',0);state='airborne';flightStart=physicsTime;groupRest={};still=0;slammerContact=false;slammerAt=-2;strikeStackDown(pieces().map(c=>c.body),.1);pieces().forEach((c,i)=>{const angle=i*2.399963;c.power=.1;c.rest={};c.body.setLinvel({x:Math.cos(angle)*(1.6+i*.02),y:-.7,z:Math.sin(angle)*(1.6+i*.02)},true);c.body.setAngvel({x:Math.cos(angle)*3,y:Math.sin(angle)*2,z:Math.sin(angle)*3},true)});setStrikeLabel('Ещё раз');controls()}
strike.addEventListener('pointerdown',begin);strike.addEventListener('pointerup',release);strike.addEventListener('pointercancel',cancel);
strike.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)&&!e.repeat){e.preventDefault();begin(e)}});strike.addEventListener('keyup',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();release()}});window.addEventListener('blur',cancel);
const pointers=new Map();let lastGesture=null,dragging=null;
const pickRay=new THREE.Raycaster(),pointerNDC=new THREE.Vector2(),dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),planePoint=new THREE.Vector3();
function updateRay(e){const r=stage.getBoundingClientRect();pointerNDC.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);pickRay.setFromCamera(pointerNDC,camera)}
function supportHeight(entry){const body=entry.body,q=body.rotation(),ny=1-2*(q.x*q.x+q.z*q.z);return Math.abs(ny)*(entry.isSlammer?SLAMMER_HEIGHT:STACK_DISC_HEIGHT)/2+(entry.isSlammer?SLAMMER_RADIUS:.53)*Math.sqrt(Math.max(0,1-ny*ny))}
renderer.domElement.addEventListener('pointerdown',e=>{
 if(!['ready','inspection','result'].includes(state))return;
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});renderer.domElement.setPointerCapture(e.pointerId);lastGesture={x:e.clientX,y:e.clientY};orbitVelocity=0;
 if(state!=='ready'&&pointers.size===1){updateRay(e);const active=pieces().filter(c=>!c.collected);const hits=pickRay.intersectObjects(active.map(c=>c.mesh),true);if(hits.length){const cap=active.find(c=>c.mesh===hits[0].object.parent);if(cap){const p=cap.body.translation();dragPlane.constant=-(p.y+.07);pickRay.ray.intersectPlane(dragPlane,planePoint);dragging={cap,pointerId:e.pointerId,offsetX:p.x-planePoint.x,offsetZ:p.z-planePoint.z,startX:e.clientX,startY:e.clientY,moved:false,rotation:cap.body.rotation()};cap.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);}}}
});
renderer.domElement.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId)||!lastGesture)return;
 if(dragging?.pointerId===e.pointerId){updateRay(e);if(pickRay.ray.intersectPlane(dragPlane,planePoint)){const c=dragging.cap,x=clamp(planePoint.x+dragging.offsetX,-1.6,1.6),z=clamp(planePoint.z+dragging.offsetZ,-1.6,1.6);dragging.moved ||= Math.hypot(e.clientX-dragging.startX,e.clientY-dragging.startY)>4;
  if(dragging.moved){const others=pieces().filter(o=>o!==c&&!o.collected&&Math.hypot(o.body.translation().x-x,o.body.translation().z-z)<1.12);const y=Math.max(supportHeight(c)+.04,...others.map(o=>o.body.translation().y+supportHeight(o)+supportHeight(c)+.04));c.body.setNextKinematicTranslation({x,y,z});c.body.setNextKinematicRotation(dragging.rotation)}
 }lastGesture={x:e.clientX,y:e.clientY};return}
 const dx=e.clientX-lastGesture.x,dy=e.clientY-lastGesture.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===1){orbitYaw-=dx*.009;if(state==='ready')orbitElevation=clamp(orbitElevation+dy*.006,.16,1.3);orbitVelocity=-dx*.0018}else{viewTarget.x=clamp(viewTarget.x-dx*.003,-.35,.35);viewTarget.z=clamp(viewTarget.z-dy*.003,-.35,.35)}lastGesture={x:e.clientX,y:e.clientY};
});
function endGesture(e){if(dragging?.pointerId===e.pointerId){const c=dragging.cap,p=c.body.translation();if(dragging.moved){const support=supportHeight(c),others=pieces().filter(o=>o!==c&&!o.collected&&Math.hypot(o.body.translation().x-p.x,o.body.translation().z-p.z)<1.12);const y=Math.max(support,...others.map(o=>o.body.translation().y+supportHeight(o)+support+.002));c.body.setTranslation({x:p.x,y,z:p.z},true)}parkBody(c.body);dragging=null;}pointers.delete(e.pointerId);if(!pointers.size)lastGesture=null;}
renderer.domElement.addEventListener('pointerup',endGesture);renderer.domElement.addEventListener('pointercancel',endGesture);
function impact(){if(state!=='airborne')return;hasHit=true;setStrikeLabel('Ещё раз');state='scattering';renderCollection();impactAt=physicsTime;impactElevation=viewElevation;edgeAt=overloaded?-1:physicsTime+3/120;twistAt=overloaded?-1:physicsTime+24/120;const p=caps[0].power;sound(p);navigator.vibrate?.(12)}
function parkBody(body){const p=body.translation(),q=body.rotation();body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);body.setTranslation(p,true);body.setRotation(q,true);body.setNextKinematicTranslation(p);body.setNextKinematicRotation(q)}
function projectCap(c){return c.mesh.position.clone().project(camera)}
function finish(){separateDiscs(world,pieces());stage.setAttribute('aria-label','Перетаскивайте фишки по столу');pieces().forEach(c=>{c.won=!overloaded&&!c.isSlammer&&faceUp(c.body);parkBody(c.body)});const won=caps.filter(c=>c.won).sort((a,b)=>projectCap(b).y-projectCap(a).y);$('markers').replaceChildren();setStrikeLabel('Ещё раз');
if(!won.length){state='result';$('announcer').textContent=overloaded?'Стопка рассыпалась от избытка силы':'Ни одна фишка не перевернулась';renderCollection();controls();return}
state='inspection';won.forEach((c,i)=>c.rank=i+1);$('announcer').textContent=`Перевернулось: ${won.length}`;collectWinners();}
async function collectWinners(){if(state!=='inspection'||dragging)return;state='collecting';renderCollection();controls();$('markers').replaceChildren();const won=caps.filter(c=>c.won).sort((a,b)=>a.rank-b.rank);
try{localStorage.setItem('bita-collection-v3',JSON.stringify([...collection,...won.map(c=>c.index)].map(i=>manifest[i].id)))}catch{}
for(const [i,c]of won.entries()){c.collected=true;c.mesh.visible=false;const r=$('collectionToggle').getBoundingClientRect();await showcase.award({index:c.index},{target:{x:r.x+r.width/2,y:r.y+r.height/2},index:i,total:won.length});collection.push(c.index);renderCollection()}
state='result';count=caps.filter(c=>!c.won).length;renderCollection();controls();}
let previous=performance.now(),acc=0,lastFrame=0;
function frame(now){requestAnimationFrame(frame);if(document.hidden){previous=now;return}const idle=state==='ready'||state==='result'||state==='inspection';if(idle&&now-lastFrame<1000/30)return;lastFrame=now;const dt=Math.min((now-previous)/1000,.05);previous=now;const t=now/1000;
 showcase.update(now,dt);if(charge&&now-charge.start>=CHARGE_MS)overload();if(state==='ready')controls();
 if(['ready','charging'].includes(state)){
  const p=charge?clamp((now-charge.start)/CHARGE_MS,0,1):0;if(charge)strike.style.setProperty('--charge',p);
  for(const [i,c]of caps.entries()){
   const age=(now-c.born)/750,progress=clamp(age,0,1),drop=1-progress,bounce=age>1?.018*Math.sin((age-1)*22)*Math.exp(-(age-1)*9):0,jitter=p*p*.026,bob=.010*Math.sin(t*.9);
   const x=c.position.x+drop*drop*1.6+Math.sin(t*56+i*.7)*jitter,y=c.position.y+capInsertionOffset(i,slammerSlot,slammerEnabled)+(slotOpened&&i>=slammerSlot?.14:0)+.8*(1-progress*progress)+bounce+bob+chargeLift(p)+Math.sin(t*65)*jitter*.7,z=c.position.z+Math.cos(t*61+i)*jitter*.6;
   c.body.setNextKinematicTranslation({x,y,z});const q=new THREE.Quaternion(c.rotation.x,c.rotation.y,c.rotation.z,c.rotation.w);if(jitter){const w=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(t*67)*jitter*.6,0,Math.cos(t*59)*jitter*.6));q.premultiply(w)}c.body.setNextKinematicRotation(q);
  }
  if(slammer){const p=charge?clamp((now-charge.start)/CHARGE_MS,0,1):0,j=p*p*.026;slammer.body.setNextKinematicTranslation({x:Math.max(0,1-(now-insertAt)/450)*.9+Math.sin(t*56)*j,y:slammerY(slammerSlot)+chargeLift(p)+.01*Math.sin(t*.9),z:Math.cos(t*61)*j});slammer.body.setNextKinematicRotation({x:0,y:0,z:0,w:1})}
 }
 acc+=dt;if(!['airborne','scattering'].includes(state)){world.timestep=dt;world.step(events);physicsTime+=dt;acc=0}world.timestep=1/240;while(acc>=1/240){if(['airborne','scattering'].includes(state))pieces().forEach(c=>limitDiscSpeed(c.body));world.step(events);physicsTime+=1/240;events.drainCollisionEvents((a,b,start)=>{if(start&&slammer&&['airborne','scattering'].includes(state)&&(a===slammer.body.collider(0).handle||b===slammer.body.collider(0).handle))slammerContact=true;if(start&&state==='airborne'&&physicsTime-flightStart>.025&&(a===world.tableColliderHandle||b===world.tableColliderHandle)){const handle=a===world.tableColliderHandle?b:a;if(pieces().some(c=>c.body.collider(0).handle===handle))impact()}});
  if(!overloaded&&state==='scattering'&&slammerContact&&slammerAt===-1)slammerAt=physicsTime+14/120;if(slammerAt>0&&physicsTime>=slammerAt){slammerResponse(caps.map(c=>c.body),slammer.body,slammerSlot,caps[0].power);slammerAt=-2}
  if(edgeAt>=0&&physicsTime>=edgeAt){fanStack(caps.map(c=>c.body),caps[0].power);edgeAt=-1}
  if(twistAt>=0&&physicsTime>=twistAt){turnStack(caps.map(c=>c.body),caps[0].power);twistAt=-1}
  if(state==='scattering'){const elapsed=physicsTime-impactAt;for(const c of pieces()){enforceTable(c.body,c.isSlammer?SLAMMER_RADIUS:.53,c.isSlammer?SLAMMER_HEIGHT:STACK_DISC_HEIGHT);sleepRestingBody(c.body,c.rest,elapsed,1/240);if(elapsed>4){c.body.setAngularDamping(4);c.body.setLinearDamping(1.8)}}sleepRestingGroup(pieces().map(c=>c.body),groupRest,elapsed,1/240)}acc-=1/240;
 }
 // Keep displayed faces disjoint between physics ticks. The physics poses and
 // velocities are restored immediately; this does not select winning sides.
 const displayPass=['airborne','scattering'].includes(state),displaySaved=displayPass?pieces().filter(c=>!c.collected).map(c=>({body:c.body,p:c.body.translation()})):null;
 if(displaySaved)separateDiscs(world,pieces());
 for(const c of pieces()){const p=c.body.translation(),q=c.body.rotation();c.mesh.position.set(p.x,p.y,p.z);c.mesh.quaternion.set(q.x,q.y,q.z,q.w);c.mesh.visible=!c.collected}
 if(displaySaved){for(const {body,p}of displaySaved)if(body.translation().y!==p.y)body.setTranslation(p,false);world.propagateModifiedBodyPositionsToColliders()}
 if(state==='scattering'){const moving=pieces().some(c=>{const v=c.body.linvel(),w=c.body.angvel();return Math.hypot(v.x,v.y,v.z)>.2||Math.hypot(w.x,w.y,w.z)>1.3});still=!moving&&physicsTime-impactAt>1?still+dt:0;if(still>.5)finish()}
 if(!pointers.size&&idle){orbitYaw+=orbitVelocity;orbitVelocity*=.87;if(state==='ready'&&Math.abs(orbitVelocity)<.0001)orbitYaw+=dt*.022}
 const spreading=['scattering','inspection','collecting','result'].includes(state),air=state==='airborne';
 const progress=spreading?clamp((physicsTime-impactAt)/1.35,0,1):0,smooth=progress*progress*(3-2*progress);
 const desiredElevation=spreading?lerp(impactElevation,1.515,smooth):orbitElevation;
 const extent=Math.max(...caps.map(c=>Math.abs(c.mesh.position.x*Math.cos(viewYaw)-c.mesh.position.z*Math.sin(viewYaw))+.58));
 const aspect=stage.clientWidth/stage.clientHeight,baseWidth=Math.max(2.65,4.4*aspect),targetWidth=spreading?Math.max(4.8,4.8*aspect,extent*2+.25):baseWidth;
 if(!dragging){viewWidth=lerp(viewWidth,targetWidth,Math.min(1,dt*(spreading?4:3)));viewElevation=lerp(viewElevation,desiredElevation,Math.min(1,dt*5));viewYaw=lerp(viewYaw,orbitYaw,Math.min(1,dt*7));
 const averageY=caps.reduce((s,c)=>s+c.mesh.position.y,0)/caps.length;const targetY=spreading?0:air?Math.max(.15,averageY*.7):HOVER_HEIGHT+(.025+count*STACK_LAYER_STEP)/2+chargeLift(charge?clamp((now-charge.start)/CHARGE_MS,0,1):0)*.25;
 viewTarget.y=lerp(viewTarget.y,targetY,Math.min(1,dt*5));camera.position.set(viewTarget.x+Math.sin(viewYaw)*10*Math.cos(viewElevation),viewTarget.y+10*Math.sin(viewElevation),viewTarget.z+Math.cos(viewYaw)*10*Math.cos(viewElevation));camera.lookAt(viewTarget);
 camera.left=-viewWidth/2;camera.right=viewWidth/2;camera.top=viewWidth/aspect/2;camera.bottom=-camera.top;camera.updateProjectionMatrix();}
 if(state==='inspection'){
  const used=[];
  for(const c of caps.filter(c=>c.label&&c.won).sort((a,b)=>a.rank-b.rank)){
   const p=projectCap(c),r=.53/viewWidth*stage.clientWidth;
   let x=clamp((p.x*.5+.5)*stage.clientWidth+r*.65,18,stage.clientWidth-18),y=clamp((-p.y*.5+.5)*stage.clientHeight-r*.65,80,stage.clientHeight-130);
   for(let k=0;k<12&&used.some(q=>Math.hypot(q.x-x,q.y-y)<30);k++){x+=30;if(x>stage.clientWidth-18){x-=60;y-=30}}
   c.label.style.left=`${x}px`;c.label.style.top=`${y}px`;used.push({x,y});
  }
 }
 renderer.render(scene,camera);
}
reset(12);$('loading').remove();requestAnimationFrame(frame);
