import {createTableDots} from './table-dots.js?v=20261113-arcade22';
import {PHYSICS_RATE} from './physics-scale.js?v=20261113-arcade22';
import {slammerPath,SLAMMER_MOVE_MS} from './slammer-motion.js?v=20261113-arcade22';
import {makeCapDeck} from './cap-deck.js?v=20261113-arcade22';
import * as THREE from './vendor/three.module.js';
import {RAPIER,createWorld,createStackBody,strikeStackDown,STACK_DISC_HEIGHT,HOVER_HEIGHT,STACK_LAYER_STEP,chargeLift,fanStack,turnStack,faceUp,sleepRestingBody,sleepRestingGroup,discCanRest,discIsMoving,enforceTable,MAX_STACK,SLAMMER_HEIGHT,SLAMMER_RADIUS,slammerY,capInsertionOffset,createSlammerBody,slammerResponse,separateDiscs,limitDiscSpeed} from './dynamics.js?v=20261113-arcade22';
import {createShowcase} from './showcase.js?v=20261113-arcade22';
import {createChargeFeedback} from './charge-feedback.js?v=20261113-arcade22';
import {createJellyButtons} from './jelly-buttons.js?v=20261113-arcade22';
import {createPackIntro} from './pack-intro.js?v=20261113-arcade22';
const CHARGE_MS=7000;
const $=id=>document.getElementById(id),stage=$('stage'),strike=$('strike');
let introFinished=false,atmosphere=0;
const jellyButtons=createJellyButtons(document.querySelectorAll('.controls button,#chooseSlammer'),{getThemeMix:()=>atmosphere});
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;renderer.shadowMap.autoUpdate=false;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;stage.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-2,2,3,-3,1,24);
const packIntro=createPackIntro({renderer,host:stage,getEnvironment:()=>scene.environment});
const hemi=new THREE.HemisphereLight(0xffffff,0xc2bcb0,1.6);scene.add(hemi);
const key=new THREE.DirectionalLight(0xfffcf4,2.4);key.position.set(0,9,.25);key.castShadow=true;key.shadow.mapSize.set(innerWidth<=640?512:1024,innerWidth<=640?512:1024);Object.assign(key.shadow.camera,{left:-4.5,right:4.5,top:4.5,bottom:-4.5,near:.1,far:20});key.shadow.radius=1.5;key.shadow.blurSamples=8;key.shadow.normalBias=.002;key.shadow.bias=-.00003;scene.add(key);
const fill=new THREE.DirectionalLight(0xdbe7ff,.65);fill.position.set(4,4,-3);scene.add(fill);
const studio=new THREE.Scene();studio.background=new THREE.Color(0x777777);
for(const [x,y,z,sx,sy,sz,p]of[[-4,4,3,2,7,1,4],[4,2,1,1,6,3,2],[0,7,-2,6,1,4,3]]){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshBasicMaterial({color:new THREE.Color().setScalar(p)}));m.position.set(x,y,z);studio.add(m)}
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(studio,.025).texture;pmrem.dispose();studio.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:.07,color:0x000000}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;floor.receiveShadow=true;floor.renderOrder=-1;scene.add(floor);
const tableDots=createTableDots(scene);
let hasHit=false;const flexed=new Set();
document.documentElement.dataset.theme='light';
document.querySelector('meta[name="theme-color"]').content='#f1f1ee';
function updateAtmosphere(dt){const elapsed=charge?performance.now()-charge.start:0,t=clamp(elapsed/2400,0,1),target=t**.72;atmosphere+=(target-atmosphere)*(1-Math.exp(-dt/(charge?.12:.4)));if(Math.abs(target-atmosphere)<.0002)atmosphere=target;document.documentElement.style.setProperty('--scene-dark',atmosphere.toFixed(4));hemi.intensity=lerp(1.6,.85,atmosphere);key.intensity=lerp(2.4,3,atmosphere);key.position.x=atmosphere*.15;fill.intensity=lerp(.65,1.1,atmosphere);floor.material.opacity=lerp(.07,.11,atmosphere)}
function texture(draw,w=512,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t}
const manifest=await fetch('assets/caps/manifest.json?v=20261113-arcade22').then(r=>r.json());
const imageCache=new Map();
function loadImage(path){if(!imageCache.has(path))imageCache.set(path,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=e=>{imageCache.delete(path);reject(e)};img.src=path+'?v=20261113-arcade22'}));return imageCache.get(path)}
async function capImage(entry){const image=await loadImage(entry.file);if(!entry.imageRect)return image;const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.drawImage(image,...entry.imageRect,0,0,256,256);const result=new Image();result.src=c.toDataURL('image/png');await result.decode();return result}
const images=Array(manifest.length),reverseImages=Array(manifest.length);
await Promise.all([document.fonts.load('400 24px "Golos Text"'),document.fonts.load('500 24px "Golos Text"'),document.fonts.load('500 18px "IBM Plex Mono"')]);
await document.fonts.ready;
function arcText(c,text,r,y,spacing){c.save();c.translate(256,y);c.fillStyle='#fff8df';c.font='500 43px "Golos Text",sans-serif';c.textAlign='center';for(let i=0;i<text.length;i++){c.save();c.rotate((i-(text.length-1)/2)*spacing);c.fillText(text[i],0,-r);c.restore()}c.restore()}
function backTexture(entry,i){if(entry.series==='batman')return texture(c=>{c.fillStyle='#26343e';c.fillRect(0,0,512,512);c.strokeStyle='#d2b55c';c.lineWidth=6;c.beginPath();c.ellipse(256,256,194,88,0,0,Math.PI*2);c.stroke();c.fillStyle='#dfc96b';c.font='500 57px "Golos Text"';c.textAlign='center';c.textBaseline='middle';c.fillText('BATMAN',256,260)});if(entry.blankBack||entry.series==='bakugan-roks'||entry.series==='simpsons-2006')return texture(c=>{
 const nintendo=entry.series==='nintendo',simpsons=entry.series==='simpsons-2006';c.fillStyle=nintendo?'#eee9dc':simpsons?'#f0c848':'#31424f';c.fillRect(0,0,512,512);c.strokeStyle=nintendo?'#bcae94':simpsons?'#d3a62d':'#8193a0';c.lineWidth=6;c.beginPath();c.arc(256,256,235,0,Math.PI*2);c.stroke();c.textAlign='center';c.textBaseline='middle';c.fillStyle=nintendo?'#a93435':simpsons?'#252925':'#f2eee1';
 if(nintendo){c.lineWidth=7;c.strokeStyle=c.fillStyle;c.beginPath();c.roundRect(68,206,376,100,50);c.stroke();c.font='500 62px "Golos Text"';c.fillText('Nintendo',256,258)}else{c.font='500 54px "Golos Text"';c.fillText(simpsons?'The Simpsons':'BAKUGAN',256,256);c.lineWidth=3;c.beginPath();c.moveTo(130,310);c.lineTo(382,310);c.stroke()}
 });if(reverseImages[i]){const t=new THREE.Texture(reverseImages[i]);t.needsUpdate=true;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}return texture(c=>{
 c.fillStyle='#d0b880';c.fillRect(0,0,512,512);c.beginPath();c.arc(256,256,248,0,Math.PI*2);c.fillStyle=entry.series==='mk'?'#cb672d':entry.series==='turtles'?'#67a33b':'#f4ecd7';c.fill();
 if(entry.series==='mk'){
  arcText(c,'DUNKIN',155,264,.2);c.font='italic 500 42px "Golos Text",sans-serif';c.textAlign='center';c.fillStyle='#fff3d4';c.fillText('SUPER',256,345);c.font='italic 500 83px "Golos Text",sans-serif';c.fillText('CAP',256,419);
  c.save();c.beginPath();c.arc(256,244,70,0,Math.PI*2);c.clip();if(images[6])c.drawImage(images[6],184,171,144,144);c.restore();c.strokeStyle='#ffedc3';c.lineWidth=4;c.beginPath();c.arc(256,244,70,0,Math.PI*2);c.stroke();
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
const frontMats=manifest.map(e=>new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:e.material==='plastic'?.4:.8,clearcoat:e.material==='plastic'?.35:.025,specularIntensity:e.material==='plastic'?.4:.15,envMapIntensity:e.material==='plastic'?.7:.35}));
const backMats=manifest.map(e=>new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:e.material==='plastic'?.45:.85,clearcoat:e.material==='plastic'?.3:.015,specularIntensity:e.material==='plastic'?.35:.12,envMapIntensity:.35}));
const backTextureCache=new Map(),capLoads=new Map();
function ensureCap(i){if(!capLoads.has(i))capLoads.set(i,(async()=>{const e=manifest[i];images[i]=await capImage(e);reverseImages[i]=e.backFile&&!e.blankBack&&!['batman','bakugan-roks','simpsons-2006'].includes(e.series)?await loadImage(e.backFile):null;const t=new THREE.Texture(images[i]);t.needsUpdate=true;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;frontMats[i].map=t;frontMats[i].needsUpdate=true;const key=e.backFile??(['mk','pokemon','turtles'].includes(e.series)?e.id:e.series);if(!backTextureCache.has(key))backTextureCache.set(key,backTexture(e,i));backMats[i].map=backTextureCache.get(key);backMats[i].needsUpdate=true;})());return capLoads.get(i)}
let deck=makeCapDeck(manifest),readyDeck=[];
async function loadBatch(){const batch=deck.splice(0,5);await Promise.all(batch.map(async i=>{try{await ensureCap(i);return i}catch(e){capLoads.delete(i);console.warn('Cap unavailable',manifest[i].id);return null}})).then(ids=>readyDeck.push(...ids.filter(i=>i!==null)));}
do{await loadBatch()}while(readyDeck.length<5&&deck.length);if(readyDeck.length<5)throw new Error('Initial cap textures unavailable');
const edgeMap=texture((c,w,h)=>{c.fillStyle='#bdbbb0';c.fillRect(0,0,w,h);for(let y=0;y<h;y++){c.fillStyle=y%5===0?'#8e8c80':'#e7e4d8';c.globalAlpha=.15;c.fillRect(0,y,w,1)}for(let i=0;i<1800;i++){c.globalAlpha=.15;c.fillStyle=i%2?'#fffbe8':'#4b3927';c.fillRect((i*71.3)%w,(i*13.7)%h,1.5,1)}c.globalAlpha=.35;c.fillStyle='#77766d';c.fillRect(0,0,w,2);c.fillRect(0,h-2,w,2)},512,64);
const edgeMat=new THREE.MeshStandardMaterial({map:edgeMap,roughness:.92,metalness:0,color:0xffffff});
const plasticEdgeMat=new THREE.MeshPhysicalMaterial({color:0xcbd1d8,roughness:.28,metalness:0,clearcoat:.65});
function makeCap(index,seed){const g=new THREE.Group(),plastic=manifest[index].material==='plastic',height=plastic?.022:STACK_DISC_HEIGHT;
 const bend=geo=>{const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),r=Math.hypot(x,z)/.53;pos.setY(i,pos.getY(i)+(plastic?.15:1)*r*r*(.00028*Math.cos(Math.atan2(z,x)*3+seed)+.00018*Math.sin(x*5+seed)))}geo.computeVertexNormals();return geo};
 const edge=new THREE.Mesh(bend(new THREE.CylinderGeometry(.527,.527,height-.002,64,1,true)),plastic?plasticEdgeMat:edgeMat);edge.castShadow=true;g.add(edge);
 for(const [isFront,mat]of[[true,frontMats[index]],[false,backMats[index]]]){const geo=new THREE.CircleGeometry(.526,64);if(!isFront)geo.rotateZ(Math.PI);geo.rotateX(isFront?-Math.PI/2:Math.PI/2);geo.translate(0,isFront?height/2-.001:-height/2+.001,0);const m=new THREE.Mesh(bend(geo),mat);m.castShadow=true;m.receiveShadow=false;g.add(m)}
 scene.add(g);return g;
}
const world=await createWorld({extent:2.15}),events=new RAPIER.EventQueue(true);

const slammerManifest=await fetch('assets/slammers/manifest.json').then(r=>r.json());
const slammerMats=await Promise.all(slammerManifest.map(async e=>Promise.all([e.frontFile,e.backFile].map(async path=>{const img=await loadImage(path),t=new THREE.Texture(img);t.needsUpdate=true;t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshPhysicalMaterial({map:t,bumpMap:t,bumpScale:.004,roughness:.25,clearcoat:1,clearcoatRoughness:.18})}))));
let slammer=null,slammerDesign=1,slammerSlot=2,slammerEnabled=true,slotOpened=false,insertAt=0,slammerContact=false,slammerAt=-1,slammerMove=null;
function makeSlammer(){const g=new THREE.Group(),e=slammerManifest[slammerDesign],mat=new THREE.MeshPhysicalMaterial({color:e.color,roughness:.22,clearcoat:1});const edge=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,SLAMMER_HEIGHT,64,1,true),mat);edge.castShadow=true;g.add(edge);for(const [i,front]of[true,false].entries()){const geo=new THREE.CircleGeometry(.548,64);geo.rotateX(front?-Math.PI/2:Math.PI/2);geo.translate(0,front?.038:-.038,0);const m=new THREE.Mesh(geo,slammerMats[slammerDesign][i]);m.castShadow=true;g.add(m)}for(const y of[-.033,.033]){const rim=new THREE.Mesh(new THREE.TorusGeometry(.538,.004,6,64),mat);rim.rotation.x=Math.PI/2;rim.position.y=y;g.add(rim)}scene.add(g);return g}
const pieces=()=>slammer?[...caps,slammer]:caps;
const showcase=createShowcase({makeModel:item=>{const m=makeCap(item.index,0);scene.remove(m);return m},nameFor:item=>manifest[item.index].name,onBack:()=>showCollection()});
function setupSlammer(){if(slammer)removeCap(slammer);slammer=null;slammerSlot=Math.min(slammerSlot,count);if(slammerEnabled)slammer={...createSlammerBody(world,slammerSlot,slammerManifest[slammerDesign].id),mesh:makeSlammer(),isSlammer:true,rest:{},born:-10000};$('slammerSlot').max=count;$('slammerSlot').value=slammerSlot;updateSlammerUI()}
function updateSlammerUI(){$('slammerSlot').disabled=!slammerEnabled;$('slammerSlot').setAttribute('aria-valuetext',slammerEnabled?`Layer ${slammerSlot} of ${count}`:'No slammer');$('slammerImage').src=slammerManifest[slammerDesign].frontFile}
$('slammerSlot').onpointerdown=()=>{if(state==='result')restackRemaining(false);slotOpened=true};
function moveSlammer(slot,design=slammerDesign){if(!slammer)return;slammerMove={start:performance.now(),from:{...slammer.body.translation()},q:slammer.mesh.quaternion.clone(),design,swapped:design===slammerDesign};slammerSlot=slot;updateSlammerUI();controls()}
$('slammerSlot').oninput=e=>moveSlammer(+e.target.value);
$('slammerSlot').onchange=()=>slotOpened=false;window.addEventListener('pointerup',()=>slotOpened=false);window.addEventListener('pointercancel',()=>slotOpened=false);
$('chooseSlammer').onclick=()=>$('slammerPicker').showModal();
for(let i=0;i<slammerManifest.length;i++){const b=document.createElement('button');b.type='button';if(i<0)b.textContent='No slammer';else{const img=new Image();img.src=slammerManifest[i].frontFile;img.alt=slammerManifest[i].name;b.append(img)}b.onclick=()=>{slammerEnabled=i>=0;$('slammerPicker').close();if(state==='result'){if(i>=0)slammerDesign=i;restackRemaining(false)}else if(i>=0)moveSlammer(slammerSlot,i)};b.setAttribute('aria-label',i<0?'No slammer':slammerManifest[i].name);$('slammerOptions').append(b)}
$('closeSlammer').onclick=()=>$('slammerPicker').close();

let overloaded=false,assemblingUntil=0,reframeUntil=0,lastPower=0,resetQueued=false;
function setStrikeLabel(text){strike.setAttribute('aria-label',text==='restack'?'restack. Gather the caps':'strike. Hold for a stronger strike');const label=$('strikeLabel');if(label.textContent===text)return;label.textContent=text;label.animate([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'})}
let caps=[],count=5,state='ready',charge=null,physicsTime=0,flightStart=0,impactAt=0,impactElevation=.43,edgeAt=-1,twistAt=-1,groupRest={},still=0;
let orbitYaw=-.18,orbitElevation=.43,orbitVelocity=0,viewWidth=2.65,viewElevation=.43,viewTarget=new THREE.Vector3(0,.18,0),viewYaw=-.18;
function nextCap(){return readyDeck.shift()}

const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp;
const renderSize=new THREE.Vector2();
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.getSize(renderSize);if(w&&h&&(renderSize.x!==w||renderSize.y!==h))renderer.setSize(w,h)}new ResizeObserver(resize).observe(stage);resize();
const collection=[];
try{const saved=JSON.parse(localStorage.getItem('bita-collection-v3')||'[]');for(const id of saved){const i=manifest.findIndex(e=>e.id===id);if(i>=0)collection.push(i)}}catch{}
function controls(){const locked=!introFinished||!['ready','result'].includes(state)||performance.now()<assemblingUntil;const tool=$('slammerTool'),stowed=!['ready','charging'].includes(state);tool.hidden=false;tool.dataset.stowed=String(stowed);tool.inert=stowed;tool.setAttribute('aria-hidden',String(stowed));$('chooseSlammer').disabled=locked||Boolean(slammerMove);$('slammerSlot').disabled=locked||!slammerEnabled;$('collectionToggle').disabled=!['ready','result'].includes(state);$('minus').disabled=!introFinished;$('plus').disabled=!introFinished;strike.disabled=Boolean(slammerMove)||(locked&&state!=='charging')||(state==='ready'&&caps.some(c=>performance.now()-c.born<800));}
function renderCollection(){const fan=$('collectionFan');fan.dataset.count=Math.min(3,collection.length);fan.replaceChildren();for(const i of collection.slice(-3)){const img=new Image();img.alt='';fan.append(img);ensureCap(i).then(()=>img.src=images[i].src).catch(()=>{})}$('collectionToggle').hidden=!collection.length&&state!=='collecting';$('collectionToggle').setAttribute('aria-label','Open won caps');}
function showCollection(){const grid=$('albumGrid');grid.replaceChildren();for(const i of collection){const img=new Image();img.alt=manifest[i].name;img.loading='lazy';ensureCap(i).then(()=>img.src=images[i].src).catch(()=>{});const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Inspect ${manifest[i].name}`);b.append(img);b.onclick=async()=>{await ensureCap(i);$('album').close();showcase.inspect({index:i})};grid.append(b)}$('albumCount').textContent=collection.length;$('album').showModal()}
$('collectionToggle').onclick=showCollection;$('closeAlbum').onclick=()=>$('album').close();$('album').onclick=e=>{if(e.target!==$('album'))return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()};renderCollection();
function addCap(drop=true,chosen=null){const i=caps.length,index=chosen??nextCap();if(!Number.isInteger(index)||!images[index]||!frontMats[index].map)return null;const physical=createStackBody(world,i,Math.random,manifest[index].material,manifest[index].id);const item={...physical,index,mesh:makeCap(index,i*.91),born:drop?performance.now():-10000,rest:{},won:false};caps.push(item);count=caps.length;if(drop){item.body.setTranslation({x:1.6,y:physical.position.y+.8,z:physical.position.z},true);item.body.setRotation(physical.rotation,true)}return item}
function removeCap(c){scene.remove(c.mesh);c.mesh.traverse(o=>{if(o.isMesh)o.geometry.dispose()});world.removeRigidBody(c.body)}
function reset(n=count,drop=true,indices=null){if(!indices&&!readyDeck.length){if(!resetQueued){resetQueued=true;setTimeout(()=>{resetQueued=false;reset(n,drop,indices)},300)}return}caps.forEach(removeCap);caps=[];count=clamp(n||5,1,MAX_STACK);hasHit=false;flexed.clear();overloaded=false;setStrikeLabel('strike');state='ready';stage.setAttribute('aria-label','Drag to rotate the stack');$('announcer').textContent='';$('markers').replaceChildren();edgeAt=twistAt=-1;groupRest={};still=0;const desired=indices?count:Math.min(count,readyDeck.length);for(let i=0;i<desired;i++){const item=addCap(drop,indices?.[i]);if(drop&&item)item.born=performance.now()+i*70}count=caps.length;setupSlammer();renderCollection();controls()}
function restackRemaining(drop=true){const remaining=caps.filter(c=>!c.won),indices=remaining.map(c=>c.index),saved=new Map(remaining.map(c=>[c.index,{p:{...c.mesh.position},q:c.mesh.quaternion.clone()}])),oldBit=slammer?{p:{...slammer.mesh.position},q:slammer.mesh.quaternion.clone()}:null;reset(indices.length||5,false,indices.length?indices:null);const now=performance.now();assemblingUntil=now+750;reframeUntil=now+900;lastPower=0;for(const c of caps){const from=saved.get(c.index);if(from)c.assemble={...from,start:now}}if(slammer&&oldBit)slammer.assemble={...oldBit,start:now};controls()}
// Queue presses during a strike/reveal; keep native +/- controls responsive.
let pendingAdjustment=0,adjustmentLoading=false;
function requestAdjustment(delta){if(!introFinished)return;pendingAdjustment=clamp(pendingAdjustment+delta,-MAX_STACK,MAX_STACK);flushAdjustments()}
function loadAdjustmentCaps(){if(adjustmentLoading)return;adjustmentLoading=true;if(!deck.length)deck=makeCapDeck(manifest);loadBatch().finally(()=>{adjustmentLoading=false;controls()})}
function flushAdjustments(){
 if(!pendingAdjustment||!introFinished||!['ready','result'].includes(state)||slammerMove||performance.now()<assemblingUntil)return;
 if(state==='result'){
  if(!caps.some(c=>!c.won)){
   if(!readyDeck.length){loadAdjustmentCaps();return}
   reset(1);pendingAdjustment-=Math.sign(pendingAdjustment);
  }else restackRemaining(false);
 }
 while(pendingAdjustment){
  if(pendingAdjustment>0){
   if(count>=MAX_STACK){pendingAdjustment=0;break}
   if(!readyDeck.length){loadAdjustmentCaps();break}
   if(!addCap(true))break;pendingAdjustment--;
  }else{
   if(count<=1){pendingAdjustment=0;break}
   removeCap(caps.pop());count=caps.length;pendingAdjustment++;
  }
 }
 slammerSlot=Math.min(slammerSlot,count);$('slammerSlot').max=count;$('slammerSlot').value=slammerSlot;updateSlammerUI();controls();
}
$('plus').onclick=()=>requestAdjustment(1);
$('minus').onclick=()=>requestAdjustment(-1);
for(const id of['plus','minus']){let timer,repeat;const b=$(id),action=b.onclick;b.onclick=e=>{if(!repeat)action(e);repeat=false};b.addEventListener('pointerdown',()=>{repeat=false;timer=setTimeout(()=>{repeat=true;action();timer=setInterval(action,140)},350)});for(const type of['pointerup','pointercancel'])window.addEventListener(type,()=>{clearTimeout(timer);clearInterval(timer)});b.addEventListener('pointerleave',()=>{clearTimeout(timer);clearInterval(timer)})}
let audio=null;function ensureAudio(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume()}catch{}}
let lastMaterialSound=-10;
function sound(power,plastic=false,level=1){if(!audio||audio.state!=='running')return;const t=audio.currentTime,duration=plastic?.038:.026,buffer=audio.createBuffer(1,audio.sampleRate*duration,audio.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.exp(-i/(samples.length*.17));const src=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();src.buffer=buffer;filter.type='lowpass';filter.frequency.value=plastic?4200:1250;gain.gain.value=(.10+power*.06)*level;src.connect(filter).connect(gain).connect(audio.destination);src.start(t);if(plastic){const ring=audio.createOscillator(),envelope=audio.createGain();ring.type='triangle';ring.frequency.setValueAtTime(2700+Math.random()*500,t);ring.frequency.exponentialRampToValueAtTime(2100,t+.035);envelope.gain.setValueAtTime(.025*level,t);envelope.gain.exponentialRampToValueAtTime(.0001,t+.05);ring.connect(envelope).connect(audio.destination);ring.start(t);ring.stop(t+.055)}}

function begin(e){if(!introFinished||slammerMove)return;if(state==='result'){restackRemaining(false);return}if(state!=='ready'||performance.now()<assemblingUntil)return;ensureAudio();charge={start:performance.now(),power:0};orbitVelocity=0;state='charging';if(e.pointerId!==undefined)e.currentTarget.setPointerCapture?.(e.pointerId);strike.classList.add('charging');controls()}
function cancel(){if(!charge)return;charge=null;state='ready';strike.classList.remove('charging');setChargeVisual(0);controls()}
const chargeFeedback=createChargeFeedback(strike);
function setChargeVisual(p){chargeFeedback.setPower(Math.min(1,p*CHARGE_MS/2000))}
function release(){if(!charge)return;if(performance.now()-charge.start>=CHARGE_MS)return overload();const power=clamp((performance.now()-charge.start)/CHARGE_MS,.15,1);lastPower=power;charge=null;strike.classList.remove('charging');setChargeVisual(0);state='airborne';flightStart=physicsTime;still=0;groupRest={};slammerContact=false;slammerAt=-1;strikeStackDown(pieces().map(c=>c.body),power);pieces().forEach(c=>{c.power=power;c.rest={}});controls()}
function overload(){if(!charge)return;lastPower=1;charge=null;overloaded=true;strike.classList.remove('charging');setChargeVisual(0);state='airborne';flightStart=physicsTime;groupRest={};still=0;slammerContact=false;slammerAt=-2;strikeStackDown(pieces().map(c=>c.body),.1);pieces().forEach((c,i)=>{const angle=i*2.399963;c.power=.1;c.rest={};c.body.setLinvel({x:Math.cos(angle)*(1.6+i*.02)*PHYSICS_RATE,y:-.7*PHYSICS_RATE,z:Math.sin(angle)*(1.6+i*.02)*PHYSICS_RATE},true);c.body.setAngvel({x:Math.cos(angle)*3*PHYSICS_RATE,y:Math.sin(angle)*2*PHYSICS_RATE,z:Math.sin(angle)*3*PHYSICS_RATE},true)});setStrikeLabel('restack');controls()}
strike.addEventListener('pointerdown',begin);strike.addEventListener('pointerup',release);strike.addEventListener('pointercancel',cancel);
strike.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)&&!e.repeat){e.preventDefault();begin(e)}});strike.addEventListener('keyup',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();release()}});window.addEventListener('blur',cancel);
const pointers=new Map();let lastGesture=null,dragging=null;
const pickRay=new THREE.Raycaster(),pointerNDC=new THREE.Vector2(),dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),planePoint=new THREE.Vector3();
function updateRay(e){const r=stage.getBoundingClientRect();pointerNDC.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);pickRay.setFromCamera(pointerNDC,camera)}
function supportHeight(entry){const body=entry.body,q=body.rotation(),ny=1-2*(q.x*q.x+q.z*q.z);return Math.abs(ny)*(entry.isSlammer?SLAMMER_HEIGHT:(entry.height??STACK_DISC_HEIGHT))/2+(entry.isSlammer?SLAMMER_RADIUS:.53)*Math.sqrt(Math.max(0,1-ny*ny))}
renderer.domElement.addEventListener('pointerdown',e=>{
 if(!introFinished||!['ready','inspection','result'].includes(state))return;
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
function endGesture(e){if(dragging?.pointerId===e.pointerId){const c=dragging.cap,p=c.body.translation();if(dragging.moved){const support=supportHeight(c),others=pieces().filter(o=>o!==c&&!o.collected&&Math.hypot(o.body.translation().x-p.x,o.body.translation().z-p.z)<1.12);const y=Math.max(support,...others.map(o=>o.body.translation().y+supportHeight(o)+support+.002));c.body.setTranslation({x:p.x,y,z:p.z},true)}parkBody(c.body);dragging=null;renderer.shadowMap.needsUpdate=true;}pointers.delete(e.pointerId);if(!pointers.size)lastGesture=null;}
renderer.domElement.addEventListener('pointerup',endGesture);renderer.domElement.addEventListener('pointercancel',endGesture);
function impact(plastic=false){if(state!=='airborne')return;hasHit=true;setStrikeLabel('restack');state='scattering';renderCollection();impactAt=physicsTime;impactElevation=viewElevation;edgeAt=-1;twistAt=-1;const p=caps[0].power;if(!overloaded)fanStack(caps.map(c=>c.body),p,false,flexed);sound(p,plastic);lastMaterialSound=physicsTime;navigator.vibrate?.(12)}
function parkBody(body){const p=body.translation(),q=body.rotation();body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);body.setTranslation(p,true);body.setRotation(q,true);body.setNextKinematicTranslation(p);body.setNextKinematicRotation(q)}
function projectCap(c){return c.mesh.position.clone().project(camera)}
function finish(){separateDiscs(world,pieces());stage.setAttribute('aria-label','Drag caps across the table');pieces().forEach(c=>{c.won=!overloaded&&!c.isSlammer&&faceUp(c.body);parkBody(c.body)});const won=caps.filter(c=>c.won).sort((a,b)=>projectCap(b).y-projectCap(a).y);$('markers').replaceChildren();setStrikeLabel('restack');
if(!won.length){state='result';$('announcer').textContent=overloaded?'Too much power. The stack scattered':'No caps flipped';renderCollection();controls();return}
state='inspection';won.forEach((c,i)=>c.rank=i+1);$('announcer').textContent=`Flipped: ${won.length}`;collectWinners();}
async function collectWinners(){if(state!=='inspection'||dragging)return;state='collecting';renderCollection();controls();$('markers').replaceChildren();const won=caps.filter(c=>c.won).sort((a,b)=>a.rank-b.rank);
try{localStorage.setItem('bita-collection-v3',JSON.stringify([...collection,...won.map(c=>c.index)].map(i=>manifest[i].id)))}catch{}
for(const [i,c]of won.entries()){c.collected=true;c.mesh.visible=false;const r=$('collectionFan').getBoundingClientRect();await showcase.award({index:c.index},{target:{x:r.right-18,y:r.y+r.height/2},index:i,total:won.length});collection.push(c.index);renderCollection()}
state='result';count=caps.filter(c=>!c.won).length;renderCollection();controls();}
let previous=performance.now(),acc=0,lastFrame=0;
function frame(now){requestAnimationFrame(frame);if(document.hidden){previous=now;return}const idle=state==='ready'||state==='result'||state==='inspection';if(idle&&!jellyButtons.active()&&now-lastFrame<1000/30)return;lastFrame=now;const dt=Math.min((now-previous)/1000,.1);previous=now;const t=now/1000;
 showcase.update(now,dt);if(pendingAdjustment)flushAdjustments();if(charge&&now-charge.start>=CHARGE_MS)overload();if(state==='ready')controls();
 updateAtmosphere(dt);tableDots.update(dt,atmosphere,introFinished);jellyButtons.update(dt);chargeFeedback.update(now,dt);
 if(['ready','charging'].includes(state)){
  const p=charge?clamp((now-charge.start)/CHARGE_MS,0,1):0;if(charge)setChargeVisual(p);
  for(const [i,c]of caps.entries()){
   const age=(now-c.born)/800,progress=clamp(age,0,1),drop=1-progress,bounce=age>1?.018*Math.sin((age-1)*22)*Math.exp(-(age-1)*9):0,jitter=p*p*.052,bob=0;
   const gap=capInsertionOffset(i,slammerSlot,slammerEnabled)+(slotOpened&&i>=slammerSlot?.14:0);c.gapOffset??=gap;c.gapOffset+=(gap-c.gapOffset)*(1-Math.exp(-dt*24));
   const x=c.position.x+drop*drop*1.6+Math.sin(t*56)*jitter,y=c.position.y+c.gapOffset+.8*(1-progress*progress)+bounce+bob+chargeLift(p)+Math.sin(t*65)*jitter*.7,z=c.position.z+Math.cos(t*61)*jitter*.6;
   let target=new THREE.Vector3(x,y,z);if(c.assemble){const a=clamp((now-c.assemble.start)/750,0,1),e=a*a*(3-2*a);target.lerpVectors(new THREE.Vector3(c.assemble.p.x,c.assemble.p.y,c.assemble.p.z),target,e);target.y+=Math.sin(a*Math.PI)*.12;if(a===1)c.assemble=null}c.body.setNextKinematicTranslation(target);const q=new THREE.Quaternion(c.rotation.x,c.rotation.y,c.rotation.z,c.rotation.w);if(jitter){const w=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(t*67)*jitter*.6,0,Math.cos(t*59)*jitter*.6));q.premultiply(w)}if(c.assemble){const a=clamp((now-c.assemble.start)/750,0,1);q.slerpQuaternions(c.assemble.q,q.clone(),a*a*(3-2*a))}c.body.setNextKinematicRotation(q);
  }
  if(slammer){const p=charge?clamp((now-charge.start)/CHARGE_MS,0,1):0,j=p*p*.052;let progress=slammerMove?clamp((now-slammerMove.start)/SLAMMER_MOVE_MS,0,1):1;
   if(slammerMove&&!slammerMove.swapped&&progress>=.3){slammerDesign=slammerMove.design;setupSlammer();slammerMove.swapped=true}
   let target=new THREE.Vector3(Math.sin(t*56)*j,slammerY(slammerSlot)+chargeLift(p),Math.cos(t*61)*j*.6),q=new THREE.Quaternion();
   if(slammerMove){const point=slammerPath(slammerMove.from,target,progress);target.set(point.x,point.y,point.z);q.setFromEuler(new THREE.Euler(0,0,Math.sin(progress*Math.PI)*.1));if(progress===1)slammerMove=null}
   if(slammer.assemble){const a=clamp((now-slammer.assemble.start)/750,0,1),e=a*a*(3-2*a);target.lerpVectors(new THREE.Vector3(slammer.assemble.p.x,slammer.assemble.p.y,slammer.assemble.p.z),target,e);target.y+=Math.sin(a*Math.PI)*.12;q.slerpQuaternions(slammer.assemble.q,q.clone(),e);if(a===1)slammer.assemble=null}
   slammer.body.setNextKinematicTranslation(target);slammer.body.setNextKinematicRotation(q)
  }
 }
 acc+=dt;if(!['airborne','scattering'].includes(state)){world.timestep=dt;world.step(events);physicsTime+=dt;acc=0}world.timestep=1/240;while(acc>=1/240){if(['airborne','scattering'].includes(state))pieces().forEach(c=>limitDiscSpeed(c.body));world.step(events);physicsTime+=1/240;events.drainCollisionEvents((a,b,start)=>{if(start&&!overloaded&&state==='scattering'){if(physicsTime-lastMaterialSound>.055&&pieces().some(c=>(c.isSlammer||manifest[c.index].material==='plastic')&&(c.body.collider(0).handle===a||c.body.collider(0).handle===b))){sound(caps[0].power,true,.3);lastMaterialSound=physicsTime}for(const c of caps){const h=c.body.collider(0).handle;if((h===a||h===b)&&!flexed.has(h)){fanStack([c.body],c.power,true,flexed)}}}if(start&&slammer&&['airborne','scattering'].includes(state)&&(a===slammer.body.collider(0).handle||b===slammer.body.collider(0).handle))slammerContact=true;if(start&&state==='airborne'&&physicsTime-flightStart>0&&(a===world.tableColliderHandle||b===world.tableColliderHandle)){const handle=a===world.tableColliderHandle?b:a;const hit=pieces().find(c=>c.body.collider(0).handle===handle);if(hit)impact(hit.isSlammer||manifest[hit.index].material==='plastic')}});
  if(!overloaded&&state==='scattering'&&slammerContact&&slammerAt===-1)slammerAt=physicsTime;if(slammerAt>0&&physicsTime>=slammerAt){slammerResponse(caps.map(c=>c.body),slammer.body,slammerSlot,caps[0].power);slammerAt=-2}
  if(edgeAt>=0&&physicsTime>=edgeAt){fanStack(caps.map(c=>c.body),caps[0].power);edgeAt=-1}
  if(twistAt>=0&&physicsTime>=twistAt){turnStack(caps.map(c=>c.body),caps[0].power);twistAt=-1}
  if(state==='scattering'){const elapsed=physicsTime-impactAt;if(!overloaded&&elapsed<.12/PHYSICS_RATE)fanStack(caps.map(c=>c.body),caps[0].power,false,flexed);for(const c of pieces()){enforceTable(c.body,c.isSlammer?SLAMMER_RADIUS:.53,c.isSlammer?SLAMMER_HEIGHT:(c.height??STACK_DISC_HEIGHT));sleepRestingBody(c.body,c.rest,elapsed,1/240);if(elapsed>4/PHYSICS_RATE){c.body.setAngularDamping((discCanRest(c.body)?4:1.6)*PHYSICS_RATE);c.body.setLinearDamping(1.8*PHYSICS_RATE)}}sleepRestingGroup(pieces().map(c=>c.body),groupRest,elapsed,1/240)}acc-=1/240;
 }
 // Keep displayed faces disjoint between physics ticks. The physics poses and
 // velocities are restored immediately; this does not select winning sides.
 const displayPass=true,displaySaved=displayPass?pieces().filter(c=>!c.collected).map(c=>({body:c.body,p:c.body.translation()})):null;
 if(displaySaved)separateDiscs(world,pieces(),{stableOrder:true});
 for(const c of pieces()){const p=c.body.translation(),q=c.body.rotation();c.mesh.position.set(p.x,p.y,p.z);c.mesh.quaternion.set(q.x,q.y,q.z,q.w);c.mesh.visible=!c.collected&&(c.isSlammer||now>=c.born)}
 if(displaySaved){for(const {body,p}of displaySaved)if(body.translation().y!==p.y)body.setTranslation(p,false);world.propagateModifiedBodyPositionsToColliders()}
 if(state==='scattering'){const moving=pieces().some(c=>{const v=c.body.linvel(),w=c.body.angvel();return discIsMoving(c.body)});still=!moving&&physicsTime-impactAt>1/PHYSICS_RATE?still+dt:0;if(still>.5/PHYSICS_RATE)finish()}
 if(!pointers.size&&idle){orbitYaw+=orbitVelocity;orbitVelocity*=.87;if(state==='ready'&&Math.abs(orbitVelocity)<.0001)orbitYaw+=dt*.022}
 const spreading=['scattering','inspection','collecting','result'].includes(state),air=state==='airborne';
 const progress=spreading?clamp((physicsTime-impactAt)/.75,0,1):0,smooth=progress*progress*(3-2*progress);
 const desiredElevation=spreading?lerp(impactElevation,1.515,smooth):orbitElevation;
 const extent=Math.max(...caps.map(c=>Math.abs(c.mesh.position.x*Math.cos(viewYaw)-c.mesh.position.z*Math.sin(viewYaw))+.58));
 const aspect=stage.clientWidth/stage.clientHeight,chargePower=charge?clamp((now-charge.start)/CHARGE_MS,0,1):0,baseWidth=Math.max(2.18,3.8*aspect),chargeWidth=baseWidth+Math.pow(chargePower,1.2)*2.0;
 const targetWidth=spreading?Math.max(3.6+lastPower*1.6,4.4*aspect,extent*2+.3):air?Math.max(baseWidth+lastPower*2,extent*2+.3):Math.max(chargeWidth,performance.now()<reframeUntil?baseWidth+.35:baseWidth);
 if(!dragging){const ease=charge?3-chargePower*1.6:spreading?3.2:performance.now()<reframeUntil?1.8:3;viewWidth=lerp(viewWidth,targetWidth,Math.min(1,dt*ease));viewElevation=lerp(viewElevation,desiredElevation,Math.min(1,dt*5));viewYaw=lerp(viewYaw,orbitYaw,Math.min(1,dt*7));
 const averageY=caps.length?caps.reduce((s,c)=>s+c.mesh.position.y,0)/caps.length:0,targetY=spreading?0:Math.max(.06,averageY*.65);
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
 const shadowHeight=pieces().length?pieces().reduce((total,c)=>total+Math.max(0,c.mesh.position.y),0)/pieces().length:0;
 key.shadow.radius=1+Math.min(1,shadowHeight/1.1)*6;
 floor.material.opacity=lerp(.07,.11,atmosphere)*(1-Math.min(.35,shadowHeight*.25));
 if(['charging','airborne','scattering','collecting'].includes(state)||dragging||slammerMove||performance.now()<assemblingUntil||Math.abs((frame.shadowHeight??-1)-shadowHeight)>.002||Math.abs((frame.shadowAtmosphere??-1)-atmosphere)>.004||caps.some(c=>now-c.born<1000))renderer.shadowMap.needsUpdate=true;
 frame.shadowHeight=shadowHeight;frame.shadowAtmosphere=atmosphere;
 if(introFinished)renderer.render(scene,camera);
}
reset(5,false);requestAnimationFrame(frame);packIntro.setReady(caps.map(c=>c.mesh)).then(()=>{
 const now=performance.now();
 for(const [i,c]of caps.entries()){
  c.born=now+i*90;
  const target={x:c.position.x+1.6,y:c.position.y+capInsertionOffset(i,slammerSlot,slammerEnabled)+.8,z:c.position.z};
  c.body.setTranslation(target,true);c.body.setNextKinematicTranslation(target);c.mesh.position.copy(target);c.mesh.visible=i===0;
 }
 introFinished=true;renderer.shadowMap.needsUpdate=true;controls();backgroundCaps();
});

async function backgroundCaps(){while(true){await new Promise(r=>setTimeout(r,1500));if(!deck.length&&readyDeck.length<10)deck=makeCapDeck(manifest);if(deck.length){await loadBatch();controls()}}}
