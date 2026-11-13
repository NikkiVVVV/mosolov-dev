import * as THREE from './vendor/three.module.js';
const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp,ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const W=1024,H=1536,SW=1.7,SH=2.55,CUT=174;
// Native mesh clipping uses the selected image unchanged. No baked background rectangle.
const outline=[[116,84],[904,46],[909,81],[899,140],[886,156],[876,189],[884,236],[887,316],[875,485],[889,675],[878,842],[893,1012],[878,1167],[888,1367],[896,1468],[103,1452],[112,1401],[124,1331],[132,1221],[135,1142],[127,1022],[133,854],[137,686],[134,519],[132,350],[127,243]];
function clip(poly,y,below){const result=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ai=below?a[1]>=y:a[1]<=y,bi=below?b[1]>=y:b[1]<=y;if(ai)result.push(a);if(ai!==bi){const t=(y-a[1])/(b[1]-a[1]);result.push([lerp(a[0],b[0],t),y])}}return result}
function geometry(top){const points=[],uvs=[];for(let y=top?0:CUT;y<(top?CUT:H);y+=40){const poly=clip(clip(outline,y,true),Math.min(y+40,top?CUT:H),false);if(poly.length<3)continue;
 const shape=new THREE.Shape(poly.map(([x,y])=>new THREE.Vector2((x/W-.5)*SW,(.5-y/H)*SH))),g=new THREE.ShapeGeometry(shape).toNonIndexed(),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);points.push(x,y,0);uvs.push(x/SW+.5,y/SH+.5)}g.dispose();}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();return g;
}
export function createPackIntro({renderer,host,getGameCamera,getEnvironment}){
 const overlay=document.getElementById('packIntro'),button=document.getElementById('openPack'),placeholder=document.getElementById('packPlaceholder'),hint=document.getElementById('packHint');
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,2,-2,.1,24),group=new THREE.Group();scene.add(group);camera.position.set(0,0,6);
 const hemi=new THREE.HemisphereLight(0xffffff,0x687080,1.8),key=new THREE.DirectionalLight(0xffffff,2);key.position.set(-2,4,5);scene.add(hemi,key);
 const front=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.45,metalness:.12,clearcoat:.55,clearcoatRoughness:.3,transparent:true,opacity:0});
 const foil=new THREE.MeshStandardMaterial({color:0x8e9eaf,roughness:.3,metalness:.8,side:THREE.BackSide,transparent:true,opacity:0});
 const bodyGroup=new THREE.Group(),topGroup=new THREE.Group();group.add(bodyGroup,topGroup);
 const bodyGeo=geometry(false),topGeo=geometry(true),body=new THREE.Mesh(bodyGeo,front),top=new THREE.Mesh(topGeo,front.clone());
 const bases=new Float32Array(bodyGeo.attributes.position.array);bodyGroup.add(body,new THREE.Mesh(bodyGeo,foil));topGroup.add(top,new THREE.Mesh(topGeo,foil.clone()));
 const cutY=(.5-CUT/H)*SH,mouth=new THREE.Mesh(new THREE.PlaneGeometry(1.24,.08),new THREE.MeshBasicMaterial({color:0x080b16,transparent:true,opacity:0}));mouth.position.set(.005,cutY-.015,-.004);group.add(mouth);
 const lineGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.62,cutY,.035),new THREE.Vector3(.62,cutY,.035)]),line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:0xd0eaff,transparent:true,opacity:.3}));group.add(line);
 const spark=new THREE.Mesh(new THREE.CircleGeometry(.018,12),new THREE.MeshBasicMaterial({color:0xf1fbff,transparent:true,opacity:1}));spark.position.set(-.62,cutY,.04);group.add(spark);
 let contents=[],ready=false,active=true,opening=0,drag=null,progress=0,direction=1,raf=0,previous=performance.now(),startCamera=null,viewHeight=4.4,textureReady=false;
 let resolve;const done=new Promise(r=>resolve=r),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 function resize(){const aspect=host.clientWidth/host.clientHeight;viewHeight=Math.max(3.8,2/aspect);camera.left=-viewHeight*aspect/2;camera.right=-camera.left;camera.top=viewHeight/2;camera.bottom=-camera.top;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);const k=host.clientHeight/viewHeight;placeholder.style.height=SH*k+'px';placeholder.style.width=SW*k+'px';button.style.width=SW*.82*k+'px';button.style.height=SH*.94*k+'px';hint.style.top=host.clientHeight/2-cutY*k+'px'}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function fail(){if(!active||opening)return;overlay.dataset.error='true';button.disabled=false;button.setAttribute('aria-label','Повторить загрузку');hint.innerHTML='<svg viewBox="0 0 24 24"><path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5"/></svg>'}
 window.addEventListener('unhandledrejection',fail);
 button.addEventListener('click',()=>{if(overlay.dataset.error==='true')location.reload()});
 new THREE.TextureLoader().load('assets/pack/prism.webp',texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;front.map=top.material.map=texture;front.opacity=top.material.opacity=1;foil.opacity=topGroup.children[1].material.opacity=1;front.needsUpdate=top.material.needsUpdate=true;textureReady=true;placeholder.hidden=true;if(overlay.dataset.waiting==='true'&&ready)open()},undefined,()=>{placeholder.hidden=false;fail()});
 function open(){if(opening)return;if(!ready||!textureReady){overlay.dataset.waiting='true';return;}opening=performance.now();overlay.dataset.opening='true';hint.hidden=true;startCamera=camera.clone();button.disabled=true;}
 function point(e){const r=button.getBoundingClientRect();return {x:e.clientX,y:e.clientY,width:r.width}}
 button.addEventListener('pointerdown',e=>{if(opening)return;const p=point(e);drag={...p,id:e.pointerId};progress=0;button.setPointerCapture(e.pointerId)});
 button.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id||opening)return;const dx=e.clientX-drag.x;direction=dx>=0?1:-1;progress=clamp(Math.abs(dx)/(drag.width*.7),0,1);overlay.style.setProperty('--tear',progress);if(progress>=.88&&ready)open()});
 function release(e){if(!drag||e.pointerId!==drag.id)return;if(progress>.64&&ready)open();else if(progress>.64)overlay.dataset.waiting='true';else progress=0;drag=null;}
 button.addEventListener('pointerup',release);button.addEventListener('pointercancel',()=>{drag=null;if(!opening)progress=0});
 button.addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();if(overlay.dataset.error==='true'){location.reload();return}progress=1;if(ready)open();else overlay.dataset.waiting='true'}});
 function finish(){active=false;window.removeEventListener('unhandledrejection',fail);cancelAnimationFrame(raf);observer.disconnect();overlay.hidden=true;document.documentElement.dataset.intro='done';
  bodyGeo.dispose();topGeo.dispose();front.map?.dispose();front.dispose();top.material.dispose();foil.dispose();topGroup.children[1].material.dispose();mouth.geometry.dispose();mouth.material.dispose();lineGeo.dispose();line.material.dispose();spark.geometry.dispose();spark.material.dispose();scene.clear();resolve();}
 function frame(now){if(!active)return;raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-previous)/1000);previous=now;if(document.hidden)return;
  const dark=document.documentElement.dataset.theme==='dark';hemi.intensity=dark?1.2:1.8;key.intensity=dark?2.5:2;scene.environment=getEnvironment?.()??null;
  if(!opening){group.rotation.y=reduced.matches?0:Math.sin(now*.0005)*.035+progress*.045*direction;group.rotation.z=reduced.matches?0:Math.sin(now*.00035)*.012;group.position.y=reduced.matches?0:Math.sin(now*.0007)*.018;
   topGroup.rotation.z=progress*.025*direction;topGroup.position.y=progress*.015;line.material.opacity=.23+progress*.65;spark.position.x=progress?lerp(-.62,.62,direction>0?progress:1-progress):lerp(-.62,.62,(now%1900)/1900);spark.material.opacity=textureReady?(progress?.95:.55):0;
   if(!drag&&progress<.64)progress=Math.max(0,progress-dt*2);
  }else{
   const t=(now-opening)/1000*(reduced.matches?2:1),peel=ease(t/.8),gather=ease((t-1.12)/.9);
   group.rotation.set(0,0,0);group.position.set(0,-ease((t-.75)/.8)*1.35,0);
   topGroup.position.set(direction*peel*.5,peel*2.2,peel*.8);topGroup.rotation.set(peel*.8,peel*.3,direction*peel*1.1);
   top.material.opacity=topGroup.children[1].material.opacity=1-ease((t-.35)/.65);
   front.opacity=foil.opacity=1-ease((t-.95)/.45);mouth.material.opacity=(1-ease((t-.85)/.6))*ease(t/.2);mouth.scale.y=1+Math.sin(Math.min(1,t)*Math.PI)*1.8;
   line.material.opacity=spark.material.opacity=0;
   const p=bodyGeo.attributes.position;for(let i=0;i<p.count;i++){const y=bases[i*3+1],topness=clamp((y+SH*.35)/(SH*.7),0,1);p.setXYZ(i,bases[i*3],y,Math.sin(topness*Math.PI*.5)*Math.sin(peel*Math.PI)*.08)}p.needsUpdate=true;
   for(let i=0;i<contents.length;i++){const item=contents[i],u=ease((t-.18-i*.09)/.55),fan=new THREE.Vector3((i-2)*.23,cutY-.25+u*.67+i*.018,.02+i*.025);
    item.clone.visible=t>.18+i*.09;item.clone.position.copy(fan).lerp(item.original.position,gather);item.clone.scale.setScalar(lerp(.46,item.original.scale.x,gather));
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,Math.sin(i)*.12,(i-2)*-.12));item.clone.quaternion.copy(q).slerp(item.original.quaternion,gather);
   }
   const game=getGameCamera();if(gather>0&&game){camera.position.lerpVectors(startCamera.position,game.position,gather);camera.quaternion.slerpQuaternions(startCamera.quaternion,game.quaternion,gather);for(const k of ['left','right','top','bottom','near','far'])camera[k]=lerp(startCamera[k],game[k],gather);camera.updateProjectionMatrix()}
   if(t>2.05){finish();return}
  }
  renderer.render(scene,camera);
 }
 raf=requestAnimationFrame(frame);
 return {active:()=>active,done,setReady(models){contents=models.map(original=>{const clone=original.clone(true);clone.visible=false;scene.add(clone);return {clone,original}});ready=contents.length===5;overlay.dataset.ready=String(ready);if(overlay.dataset.waiting==='true'&&ready)open();return done}};
}
