import * as THREE from './vendor/three.module.js';
import {RAPIER,createWorld,createCapBody,launch,rebound,releaseEdges,releaseTwist as twistBodies,faceUp,sleepRestingBody,sleepRestingGroup,enforceTable} from './dynamics.js';

const $=id=>document.getElementById(id), stage=$('stage');
const roster=[
 [25,'PIKACHU','#f3cc50'],[1,'BULBASAUR','#81bfb0'],[4,'CHARMANDER','#e99563'],[7,'SQUIRTLE','#82bdcf'],
 [39,'JIGGLYPUFF','#e2a3c3'],[52,'MEOWTH','#d6bf89'],[54,'PSYDUCK','#e8ce6d'],[94,'GENGAR','#a599c4'],
 [133,'EEVEE','#c6a37e'],[143,'SNORLAX','#84abb6'],[150,'MEWTWO','#b4a1c9'],[151,'MEW','#e5b4cc']
];
let renderer;
try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'}); }
catch { $('loading').textContent='Для игры нужен браузер с WebGL'; throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;stage.appendChild(renderer.domElement);
const scene=new THREE.Scene(), camera=new THREE.OrthographicCamera(-4,4,6,-6,.1,80);
camera.position.set(0,12,9);camera.lookAt(0,0,0);
const hemi=new THREE.HemisphereLight(0xffffff,0xb1ae9f,1.1);scene.add(hemi);
const key=new THREE.DirectionalLight(0xfffaf0,2.4);key.position.set(-4,10,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.camera.near=.5;key.shadow.camera.far=24;key.shadow.bias=-.00015;key.shadow.normalBias=.015;key.shadow.radius=4;scene.add(key);
const fill=new THREE.DirectionalLight(0xe8f1ff,.8);fill.position.set(5,6,-5);scene.add(fill);
const studio=new THREE.Scene();studio.background=new THREE.Color(0x777777);
for(const [x,y,z,sx,sy,sz,p]of[[-4,4,3,2,7,1,5],[4,2,1,1,6,3,3],[0,7,-2,6,1,4,4]]){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshBasicMaterial({color:new THREE.Color().setScalar(p)}));m.position.set(x,y,z);studio.add(m)}
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(studio,.025).texture;pmrem.dispose();studio.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x36382c,opacity:.16}));floor.rotation.x=-Math.PI/2;floor.position.y=-.003;floor.receiveShadow=true;scene.add(floor);
const ring=new THREE.Mesh(new THREE.RingGeometry(3.18,3.19,128),new THREE.MeshBasicMaterial({color:0xc9ccbf,transparent:true,opacity:.35,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.002;scene.add(ring);
const centerRing=new THREE.Mesh(new THREE.RingGeometry(.72,.728,64),ring.material);centerRing.rotation.x=-Math.PI/2;centerRing.position.y=.004;scene.add(centerRing);
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);const width=Math.max(7.0,7.2*w/h);camera.left=-width/2;camera.right=width/2;camera.top=width*h/w/2;camera.bottom=-camera.top;camera.updateProjectionMatrix()}
new ResizeObserver(resize).observe(stage);resize();
let dark=false;
$('theme').onclick=()=>{dark=!dark;document.body.classList.toggle('dark',dark);$('theme').setAttribute('aria-pressed',String(dark));hemi.intensity=dark?.8:1.1;key.position.set(dark?5:-4,10,dark?-2:5);key.color.set(dark?0xddeaff:0xfffaf0);key.intensity=dark?3.2:2.4;fill.intensity=dark?1.2:.8;floor.material.opacity=dark?.4:.16;ring.material.color.set(dark?0x7d8775:0xc9ccbf);document.querySelector('meta[name="theme-color"]').content=dark?'#242723':'#f4f4f1'};

function canvasTexture(draw){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');draw(ctx,512);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return {tex,url:c.toDataURL('image/webp',.88)}}
function textureFor(entry,img,slammer=false){return canvasTexture((c,s)=>{
 const g=c.createRadialGradient(185,135,10,256,256,280);g.addColorStop(0,'#fffdf2');g.addColorStop(.52,entry[2]);g.addColorStop(1,'#3b404a');c.fillStyle=g;c.fillRect(0,0,s,s);
 c.save();c.translate(256,256);for(let i=0;i<48;i++){c.rotate(Math.PI/24);c.beginPath();c.moveTo(0,0);c.lineTo(-15,-250);c.lineTo(15,-250);c.fillStyle=i%2?'#ffffff13':'#18223806';c.fill()}c.restore();
 c.strokeStyle=slammer?'#f8e6a9':'#f9f2d3';c.lineWidth=11;c.beginPath();c.arc(256,256,239,0,Math.PI*2);c.stroke();c.strokeStyle='#292e4266';c.lineWidth=2;c.beginPath();c.arc(256,256,225,0,Math.PI*2);c.stroke();
 c.save();c.shadowColor='#19223955';c.shadowBlur=14;c.shadowOffsetY=8;c.drawImage(img,64,38,384,384);c.restore();
 c.textAlign='center';c.fillStyle='#fffaf1';c.shadowColor='#192239';c.shadowBlur=6;c.font='500 30px Golos, sans-serif';c.fillText(entry[1],256,444);c.shadowBlur=0;c.font='18px Golos, sans-serif';c.fillText(slammer?'SLAMMER':`No. ${String(entry[0]).padStart(3,'0')}`,256,478);
 // Iridescent printed finish. It stays subtle; the moving studio reflection provides the gloss.
 const sheen=c.createLinearGradient(0,0,512,512);sheen.addColorStop(0,'#86f1ff30');sheen.addColorStop(.35,'#ffffff00');sheen.addColorStop(.6,'#ffffff36');sheen.addColorStop(1,'#f7b7ff15');c.fillStyle=sheen;c.fillRect(0,0,s,s);
})}
const back=canvasTexture((c)=>{c.fillStyle='#2c405f';c.fillRect(0,0,512,512);const g=c.createRadialGradient(180,130,10,256,256,270);g.addColorStop(0,'#7191b2');g.addColorStop(1,'#1b2d46');c.fillStyle=g;c.fillRect(0,0,512,512);c.strokeStyle='#d4d9cf';c.lineWidth=10;c.beginPath();c.arc(256,256,240,0,Math.PI*2);c.stroke();c.save();c.translate(256,256);c.rotate(-.18);c.beginPath();c.arc(0,0,116,Math.PI,0);c.fillStyle='#d34e48';c.fill();c.beginPath();c.arc(0,0,116,0,Math.PI);c.fillStyle='#edece5';c.fill();c.strokeStyle='#243041';c.lineWidth=14;c.beginPath();c.arc(0,0,116,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(-116,0);c.lineTo(116,0);c.stroke();c.beginPath();c.arc(0,0,32,0,Math.PI*2);c.fillStyle='#f3f1e7';c.fill();c.stroke();c.restore();c.fillStyle='#eee9d8';c.textAlign='center';c.font='500 32px Golos, sans-serif';c.fillText('POCKET MONSTERS',256,84);c.font='20px Golos,sans-serif';c.fillText('COLLECT • FLIP • PLAY',256,443)});
const loader=new THREE.TextureLoader();
const imgs=await Promise.all(roster.map(([id])=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=`assets/${id}.png`})));
await document.fonts.ready;
const art=roster.map((entry,i)=>({...textureFor(entry,imgs[i]),entry}));
const slammerArt=textureFor(roster[0],imgs[0],true);
const world=await createWorld();
const discGeo=new THREE.CylinderGeometry(.53,.53,.07,48,1,true), faceGeo=new THREE.CircleGeometry(.522,48);
const edgeMat=new THREE.MeshStandardMaterial({color:0xd7cdb4,roughness:.65,metalness:.05});
const slammerGeo=new THREE.CylinderGeometry(.65,.65,.17,64,1,true),slammerFaceGeo=new THREE.CircleGeometry(.642,64),slammerRimGeo=new THREE.TorusGeometry(.642,.018,8,64);
const slammerEdgeMat=new THREE.MeshStandardMaterial({color:0xbcc2c6,metalness:.95,roughness:.22});
const slammerFaceMat=new THREE.MeshStandardMaterial({map:slammerArt.tex,roughness:.26,metalness:.35});
const backMat=new THREE.MeshStandardMaterial({map:back.tex,roughness:.46,metalness:.03});
const faceMats=art.map(a=>new THREE.MeshStandardMaterial({map:a.tex,roughness:.4,metalness:.06}));
function makeDisc(i,metal=false){const group=new THREE.Group(),r=metal?.65:.53,h=metal?.17:.07;
 const edge=new THREE.Mesh(metal?slammerGeo:discGeo,metal?slammerEdgeMat:edgeMat);edge.castShadow=true;group.add(edge);
 const geo=metal?slammerFaceGeo:faceGeo;
 const front=new THREE.Mesh(geo,metal?slammerFaceMat:faceMats[i]);front.rotation.x=-Math.PI/2;front.position.y=h/2+.001;front.castShadow=true;group.add(front);
 const rear=new THREE.Mesh(geo,backMat);rear.rotation.x=Math.PI/2;rear.position.y=-h/2-.001;rear.castShadow=true;group.add(rear);
 if(metal){const rim=new THREE.Mesh(slammerRimGeo,edge.material);rim.rotation.x=Math.PI/2;rim.position.y=h/2;group.add(rim);const bottom=rim.clone();bottom.position.y=-h/2;group.add(bottom)}
 scene.add(group);return group;
}
const events=new RAPIER.EventQueue(true);
let strikePower=.3,physicsTime=0,releaseAt=-1,twistAt=-1,flightStart=0,groupRest={};
let caps=[],stackCount=6,state='ready',charge=null,startTime=0,stillTime=0,impactPlayed=false,collection=[],slammer=null,pointer=null,aim={x:.3,z:0},shake=0;
const q=new THREE.Quaternion();
function newCap(i,index){return {mesh:makeDisc(i),body:createCapBody(world,index),index:i,won:false,collectAt:0};}
function removeBody(item){scene.remove(item.mesh);world.removeRigidBody(item.body)}
function makeSlammer(){const mesh=makeDisc(0,true);q.setFromEuler(new THREE.Euler(.65,-.15,-.1));const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0,2.6,1.15).setRotation(q).setCcdEnabled(true).setLinearDamping(.5).setAngularDamping(.6));const collider=world.createCollider(RAPIER.ColliderDesc.roundCylinder(.075,.64,.01).setMass(.09).setFriction(.45).setRestitution(.28).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),body);return {mesh,body,collider}}
function stack(){caps.forEach(removeBody);caps=[];if(slammer)removeBody(slammer);for(let i=0;i<stackCount;i++)caps.push(newCap((i+collection.length)%art.length,i));slammer=makeSlammer();state='ready';$('announcement').textContent='';$('hint').textContent='Потяни биту и отпусти';$('buttonText').textContent='Ударить';$('again').hidden=true;setControls(false);$('count').textContent=stackCount;$('countLabel').textContent='в стопке';aim={x:.3,z:0};impactPlayed=false;releaseAt=twistAt=-1;groupRest={};stillTime=0;}
function setControls(disabled){$('minus').disabled=disabled||stackCount<=1;$('plus').disabled=disabled||stackCount>=12;$('strike').disabled=disabled;}
$('minus').onclick=()=>{if(state==='ready'||state==='result'){stackCount=Math.max(1,stackCount-1);stack()}};
$('plus').onclick=()=>{if(state==='ready'||state==='result'){stackCount=Math.min(12,stackCount+1);stack()}};
$('again').onclick=()=>{if(!stackCount)stackCount=6;stack()};
function begin(e){if(state==='result'){const left=caps.filter(c=>!c.won).length;stackCount=left||6;stack()}if(state!=='ready'||charge)return;ensureAudio();charge={start:performance.now(),x:e.clientX,y:e.clientY,power:0};state='charging';$('hint').textContent='Отпусти, чтобы ударить';if(e.pointerId!==undefined)e.currentTarget.setPointerCapture?.(e.pointerId);}
function release(e){if(!charge)return;const duration=(performance.now()-charge.start)/1000;const dx=e.clientX-charge.x,dy=e.clientY-charge.y;const power=Math.min(1,Math.max(.22,duration/1.2,Math.hypot(dx,dy)/210));strikePower=power;flightStart=physicsTime;charge=null;state='flying';startTime=performance.now();stillTime=0;setControls(true);$('strike').style.setProperty('--power',0);$('hint').textContent='';$('buttonText').textContent='…';
 const sx=THREE.MathUtils.clamp(dx/150,-.65,.65),sz=THREE.MathUtils.clamp(dy/150,-.65,.65);
 const x=aim.x+sx*.2,z=aim.z+sz*.2;q.setFromEuler(new THREE.Euler(.28+power*.25,0,-.2-sx*.3));
 launch(slammer.body,stackCount,power,{x,z},q,{x:1.2+sz*3,y:sx*2,z:-1.5-sx*3});shake=power*.025;
}
const strike=$('strike');strike.addEventListener('pointerdown',begin);strike.addEventListener('pointerup',release);strike.addEventListener('pointercancel',()=>{if(charge){charge=null;state='ready';strike.style.setProperty('--power',0);$('hint').textContent='Потяни биту и отпусти'}});
strike.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Enter')&&!e.repeat&&(state==='ready'||state==='result')){e.preventDefault();begin({clientX:0,clientY:0,currentTarget:strike})}});strike.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();release({clientX:0,clientY:0})}});
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown',e=>{if(state!=='ready')return;const r=stage.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);if(!ray.intersectObject(slammer.mesh,true).length)return;pointer=e.pointerId;begin(e)});
renderer.domElement.addEventListener('pointermove',e=>{if(charge&&pointer===e.pointerId){aim.x=THREE.MathUtils.clamp((e.clientX-charge.x)/130+.3,-.45,.65);aim.z=THREE.MathUtils.clamp((e.clientY-charge.y)/180,-.45,.45)}});
renderer.domElement.addEventListener('pointerup',e=>{if(pointer===e.pointerId){release(e);pointer=null}});
renderer.domElement.addEventListener('pointercancel',()=>{if(pointer!==null){pointer=null;charge=null;state='ready';strike.style.setProperty('--power',0)}});
let audio=null;
function ensureAudio(){try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume()}catch{}}
function sound(strength=1){if(!audio||audio.state!=='running')return;const duration=.065;const b=audio.createBuffer(1,audio.sampleRate*duration,audio.sampleRate),data=b.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(data.length*.14));const src=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();src.buffer=b;filter.type='highpass';filter.frequency.value=700;gain.gain.value=.12*strength;src.connect(filter).connect(gain).connect(audio.destination);src.start();const osc=audio.createOscillator(),g=audio.createGain();osc.type='triangle';osc.frequency.setValueAtTime(310,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(95,audio.currentTime+.08);g.gain.setValueAtTime(.07*strength,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.1);osc.connect(g).connect(audio.destination);osc.start();osc.stop(audio.currentTime+.11)}
function showAlbum(){const g=$('albumGrid');g.replaceChildren();for(const i of collection){const img=new Image();img.src=art[i].url;img.alt=art[i].entry[1];g.append(img)}$('albumCount').textContent=collection.length;$('emptyAlbum').hidden=collection.length>0;$('album').showModal()}
$('collection').onclick=showAlbum;$('closeAlbum').onclick=()=>$('album').close();$('album').addEventListener('click',e=>{if(e.target===$('album')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}});
// A rigid disc does not flex. At contact, release the stack's stored elastic energy
// as impulses at its edges. All subsequent flights, contacts and final sides are Rapier.
function elasticImpact(){
 impactPlayed=true;sound(.6+strikePower*.5);shake=.025+strikePower*.04;navigator.vibrate?.(12);
 rebound(slammer.body);
 releaseAt=physicsTime+10/120;twistAt=releaseAt+18/120;
}
function releaseElasticEnergy(){releaseEdges(caps.map(c=>c.body),slammer.body.translation(),strikePower)}
function releaseTwist(){twistBodies(caps.map(c=>c.body),strikePower)}
function settle(){state='result';const won=caps.filter(c=>faceUp(c.body));won.forEach((c,j)=>{c.won=true;c.collectAt=performance.now()+650+j*110;collection.push(c.index)});$('announcement').textContent=won.length?`+${won.length} в коллекцию`:'Ещё удар?';$('total').textContent=collection.length;$('hint').textContent=won.length?'Перевернувшиеся — твои':'Попробуй ударить под другим углом';$('buttonText').textContent='Ещё удар';$('strike').disabled=false;$('again').hidden=false;stackCount=caps.length-won.length;$('count').textContent=stackCount;$('countLabel').textContent='на столе';setControls(false);
 setTimeout(()=>{if(state!=='result')return;$('tray').replaceChildren();collection.slice(-7).forEach(i=>{const img=new Image();img.src=art[i].url;img.alt=art[i].entry[1];$('tray').append(img)});},700);
}
let prev=performance.now(),acc=0,lastRendered=0;
function frame(now){requestAnimationFrame(frame);if(document.hidden){prev=now;return}if(state==='ready'&&now-lastRendered<1000/30)return;lastRendered=now;const dt=Math.min((now-prev)/1000,.05);prev=now;acc+=dt;
 while(acc>=1/120){world.step(events);physicsTime+=1/120;events.drainCollisionEvents((a,b,started)=>{if(started&&state==='flying'&&!impactPlayed&&(a===slammer.collider.handle||b===slammer.collider.handle)){const other=a===slammer.collider.handle?b:a;if(caps.some(c=>c.body.collider(0).handle===other))elasticImpact()}});if(releaseAt>=0&&physicsTime>=releaseAt){releaseElasticEnergy();releaseAt=-1}if(twistAt>=0&&physicsTime>=twistAt){releaseTwist();twistAt=-1}if(state==='flying'){const elapsed=physicsTime-flightStart;for(const c of caps){enforceTable(c.body);sleepRestingBody(c.body,c.rest??={},elapsed,1/120)}enforceTable(slammer.body,.65,.17);sleepRestingBody(slammer.body,slammer.rest??={},elapsed,1/120);sleepRestingGroup([...caps.map(c=>c.body),slammer.body],groupRest,elapsed,1/120)}acc-=1/120}
 const t=now/1000;
 if(state==='ready'||state==='charging'){
  const p=charge?Math.min(1,(now-charge.start)/1200):0;if(charge){charge.power=p;strike.style.setProperty('--power',p)}
  const jitter=p*p*.035;const x=(state==='charging'?1.1+aim.x*.3:1.1)+Math.sin(t*55)*jitter,y=2.65+Math.sin(t*1.7)*.06+p*.45,z=1.15;
  slammer.body.setNextKinematicTranslation({x,y,z});q.setFromEuler(new THREE.Euler(.64+Math.sin(t*.7)*.03+Math.sin(t*66)*jitter,-.15+Math.sin(t*.5)*.08,-.1+Math.cos(t*58)*jitter));slammer.body.setNextKinematicRotation(q);
 }
 for(const c of [...caps,slammer]){const p=c.body.translation(),r=c.body.rotation();c.mesh.position.set(p.x,p.y,p.z);c.mesh.quaternion.set(r.x,r.y,r.z,r.w);if(c.won&&now>c.collectAt){const k=Math.min(1,(now-c.collectAt)/450);c.mesh.position.y+=k*2;c.mesh.scale.setScalar(1-k);c.mesh.visible=k<1}}
 if(state==='flying'){
  let moving=false;for(const c of [...caps,slammer]){const v=c.body.linvel(),w=c.body.angvel();if(Math.hypot(v.x,v.y,v.z)>.25||Math.hypot(w.x,w.y,w.z)>1.5)moving=true}
  if(now-startTime>6500)for(const c of [...caps,slammer]){c.body.setAngularDamping(3);c.body.setLinearDamping(1.2)}
  if(now-startTime>1300&&!moving)stillTime+=dt;else stillTime=0;
  if(stillTime>.45)settle();
 }
 camera.zoom=THREE.MathUtils.lerp(camera.zoom,state==='ready'||state==='charging'?1.12:1,Math.min(1,dt*4));camera.updateProjectionMatrix();
 shake*=.88;camera.position.x=Math.sin(t*74)*shake;camera.position.z=9+Math.cos(t*67)*shake;camera.lookAt(0,0,0);renderer.render(scene,camera);
}
stack();$('loading').remove();requestAnimationFrame(frame);
window.addEventListener('pagehide',()=>audio?.suspend());
