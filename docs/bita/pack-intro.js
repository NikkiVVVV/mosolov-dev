import * as THREE from './vendor/three.module.js';
const clamp=THREE.MathUtils.clamp,lerp=THREE.MathUtils.lerp,ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const W=1024,H=1536,SW=1.7,SH=2.55,CUT=174;
// Native mesh clipping uses the selected image unchanged. No baked background rectangle.
const outline=[[116,84],[904,46],[909,81],[899,140],[886,156],[876,189],[884,236],[887,316],[875,485],[889,675],[878,842],[893,1012],[878,1167],[888,1367],[896,1468],[103,1452],[112,1401],[124,1331],[132,1221],[135,1142],[127,1022],[133,854],[137,686],[134,519],[132,350],[127,243]];
function clip(poly,y,below){const result=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ai=below?a[1]>=y:a[1]<=y,bi=below?b[1]>=y:b[1]<=y;if(ai)result.push(a);if(ai!==bi){const t=(y-a[1])/(b[1]-a[1]);result.push([lerp(a[0],b[0],t),y])}}return result}
function clipX(poly,x,left){const result=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ai=left?a[0]<=x:a[0]>=x,bi=left?b[0]<=x:b[0]>=x;if(ai)result.push(a);if(ai!==bi){const t=(x-a[0])/(b[0]-a[0]);result.push([x,lerp(a[1],b[1],t)])}}return result}
function geometry(top){const points=[],uvs=[],step=top?20:48;
 for(let y=top?0:CUT;y<(top?CUT:H);y+=step){
  const band=clip(clip(outline,y,true),Math.min(y+step,top?CUT:H),false);if(band.length<3)continue;
  for(let x=80;x<920;x+=step){
   const poly=clipX(clipX(band,x,false),x+step,true);if(poly.length<3)continue;
   const shape=new THREE.Shape(poly.map(([x,y])=>new THREE.Vector2((x/W-.5)*SW,(.5-y/H)*SH))),g=new THREE.ShapeGeometry(shape).toNonIndexed(),p=g.attributes.position;
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);points.push(x,y,0);uvs.push(x/SW+.5,y/SH+.5)}g.dispose();
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();return g;
}
export function createPackIntro({renderer,host,getEnvironment}){
 const overlay=document.getElementById('packIntro'),button=document.getElementById('openPack'),placeholder=document.getElementById('packPlaceholder'),hint=document.getElementById('packHint');
 const savedClearColor=new THREE.Color();renderer.getClearColor(savedClearColor);const savedClearAlpha=renderer.getClearAlpha();
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xf8f8f6);
 const camera=new THREE.OrthographicCamera(-1,1,2,-2,.1,24),group=new THREE.Group();scene.add(group);camera.position.set(0,0,6);
 const hemi=new THREE.HemisphereLight(0xffffff,0x687080,1.8),key=new THREE.DirectionalLight(0xffffff,2);key.position.set(-2,4,5);scene.add(hemi,key);
 const front=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.52,metalness:.08,transparent:true,depthWrite:false,opacity:0});
 const foil=new THREE.MeshStandardMaterial({color:0xd4dbe0,roughness:.52,metalness:.25,side:THREE.BackSide,transparent:true,depthWrite:false,opacity:0});
 const bodyGroup=new THREE.Group(),topGroup=new THREE.Group();group.add(bodyGroup,topGroup);
 const bodyGeo=geometry(false),topGeo=geometry(true),body=new THREE.Mesh(bodyGeo,front),top=new THREE.Mesh(topGeo,front.clone());
 const bases=new Float32Array(bodyGeo.attributes.position.array),topBases=new Float32Array(topGeo.attributes.position.array);bodyGroup.add(body,new THREE.Mesh(bodyGeo,foil));topGroup.add(top,new THREE.Mesh(topGeo,foil.clone()));
 const cutY=(.5-CUT/H)*SH;
 const lineGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.62,cutY,.035),new THREE.Vector3(.62,cutY,.035)]),line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:0xd0eaff,transparent:true,opacity:.3}));group.add(line);
 const spark=new THREE.Mesh(new THREE.CircleGeometry(.018,12),new THREE.MeshBasicMaterial({color:0xf1fbff,transparent:true,opacity:1}));spark.position.set(-.62,cutY,.04);group.add(spark);
 let contents=[],ready=false,active=true,opening=0,drag=null,progress=0,curl=0,peelStart=0,raf=0,previous=performance.now(),viewHeight=4.4,textureReady=false;
 let resolve;const done=new Promise(r=>resolve=r),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 function resize(){const aspect=host.clientWidth/host.clientHeight;viewHeight=Math.max(3.8,2/aspect);camera.left=-viewHeight*aspect/2;camera.right=-camera.left;camera.top=viewHeight/2;camera.bottom=-camera.top;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);const k=host.clientHeight/viewHeight;placeholder.style.height=SH*k+'px';placeholder.style.width=SW*k+'px';button.style.width=SW*.82*k+'px';button.style.height=SH*.94*k+'px';hint.style.top=host.clientHeight/2-cutY*k+'px'}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function fail(){if(!active||opening)return;overlay.dataset.error='true';button.disabled=false;hint.hidden=false;button.setAttribute('aria-label','Повторить загрузку');hint.innerHTML='<svg viewBox="0 0 24 24"><path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5"/></svg>'}
 window.addEventListener('unhandledrejection',fail);
 button.addEventListener('click',()=>{if(overlay.dataset.error==='true')location.reload()});
 new THREE.TextureLoader().load('assets/pack/prism.webp',texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;front.map=top.material.map=texture;front.opacity=top.material.opacity=1;foil.opacity=topGroup.children[1].material.opacity=1;front.needsUpdate=top.material.needsUpdate=true;textureReady=true;placeholder.remove();if(overlay.dataset.waiting==='true'&&ready)open()},undefined,()=>{placeholder.hidden=false;fail()});
 function open(){if(opening)return;if(!ready||!textureReady){overlay.dataset.waiting='true';return;}peelStart=curl;opening=performance.now();overlay.dataset.opening='true';hint.hidden=true;button.disabled=true;}
 function point(e){const r=button.getBoundingClientRect();return {x:e.clientX,y:e.clientY,width:r.width}}
 button.addEventListener('pointerdown',e=>{if(opening)return;const p=point(e);drag={...p,id:e.pointerId};progress=0;button.setPointerCapture(e.pointerId)});
 button.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id||opening)return;const dx=drag.x-e.clientX;progress=clamp(dx/(drag.width*.65),0,1);overlay.style.setProperty('--tear',progress);if(progress>=.88&&ready)open()});
 function release(e){if(!drag||e.pointerId!==drag.id)return;if(progress>.64&&ready)open();else if(progress>.64)overlay.dataset.waiting='true';else progress=0;drag=null;}
 button.addEventListener('pointerup',release);button.addEventListener('pointercancel',()=>{drag=null;if(!opening)progress=0});
 button.addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space'){e.preventDefault();if(overlay.dataset.error==='true'){location.reload();return}progress=1;if(ready)open();else overlay.dataset.waiting='true'}});
 function finish(){active=false;window.removeEventListener('unhandledrejection',fail);cancelAnimationFrame(raf);observer.disconnect();overlay.hidden=true;document.documentElement.dataset.intro='done';
  bodyGeo.dispose();topGeo.dispose();front.map?.dispose();front.dispose();top.material.dispose();foil.dispose();topGroup.children[1].material.dispose();lineGeo.dispose();line.material.dispose();spark.geometry.dispose();spark.material.dispose();scene.clear();renderer.setRenderTarget(null);renderer.setClearColor(savedClearColor,savedClearAlpha);renderer.clear(true,true,true);resolve();}
 function frame(now){if(!active)return;raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-previous)/1000);previous=now;if(document.hidden)return;
  const dark=document.documentElement.dataset.theme==='dark';hemi.intensity=dark?1.5:1.8;key.intensity=dark?2.3:2;scene.environment=getEnvironment?.()??null;
  // An opaque intro pass avoids transparent-canvas black flashes on mobile.
  const background=dark?0x191b1a:0xf8f8f6;scene.background.set(background);renderer.setRenderTarget(null);renderer.setClearColor(background,1);
  if(!opening){
   curl+=(progress-curl)*(1-Math.exp(-dt/.14));
   group.rotation.y=reduced.matches?0:Math.sin(now*.0005)*.035-curl*.025;group.rotation.z=reduced.matches?0:Math.sin(now*.00035)*.012;group.position.y=reduced.matches?0:Math.sin(now*.0007)*.018;
   topGroup.position.set(0,0,0);topGroup.rotation.set(0,0,0);line.material.opacity=.23+progress*.65;spark.position.x=lerp(.62,-.62,progress||(now%1600)/1600);spark.material.opacity=textureReady?(progress?.95:.55):0;
   if(!drag&&progress<.64)progress=Math.max(0,progress-dt*2);
  }else{
   const t=(now-opening)/1000*(reduced.matches?2:1);curl=lerp(peelStart,1,ease(t/1.0));const depart=ease((t-.95)/.95);
   group.rotation.set(0,0,0);group.position.set(0,-ease((t-1.25)/.85)*1.6,0);
   topGroup.position.set(-depart*.45,depart*1.4,depart*.3);topGroup.rotation.set(-depart*.25,depart*.2,-depart*.35);
   top.material.opacity=topGroup.children[1].material.opacity=1-ease((t-1.35)/.6);
   front.opacity=foil.opacity=1-ease((t-1.45)/.65);
   line.material.opacity=spark.material.opacity=0;
   const p=bodyGeo.attributes.position;for(let i=0;i<p.count;i++){const y=bases[i*3+1],topness=clamp((y+SH*.35)/(SH*.7),0,1);p.setXYZ(i,bases[i*3],y,topness**4*Math.sin((bases[i*3]+.8)*2.7)*Math.sin(curl*Math.PI*.5)*.14)}p.needsUpdate=true;bodyGeo.computeVertexNormals();
   for(let i=0;i<contents.length;i++){
    const item=contents[i],u=clamp((t-.85-i*.08)/.95,0,1),v=1-u;
    const from=new THREE.Vector3((i-2)*.035,cutY-.24,.05+i*.015),control=new THREE.Vector3(.5+i*.08,cutY+.85+i*.06,.3),to=new THREE.Vector3(camera.right+.8+i*.1,camera.top+.8,.3);
    item.clone.visible=t>.85+i*.08&&u<1;
    item.clone.position.copy(from).multiplyScalar(v*v).addScaledVector(control,2*v*u).addScaledVector(to,u*u);
    item.clone.scale.setScalar(lerp(.43,.54,u));
    item.clone.quaternion.setFromEuler(new THREE.Euler(Math.PI/2+u*2.5,(i-2)*.08+u*2.1,(i-2)*-.14+u*.85));
   }
   if(t>2.3){finish();return}
  }
  // The torn strip curls continuously around its moving tear front. Its
  // silver reverse becomes visible as it folds, rather than rotating rigidly.
  const topPositions=topGeo.attributes.position,tearX=lerp(.65,-.65,curl),radius=.5;
  for(let i=0;i<topPositions.count;i++){
   const x=topBases[i*3],y=topBases[i*3+1],released=Math.max(0,x-tearX),angle=released/radius;
   topPositions.setXYZ(i,released?tearX+Math.sin(angle)*radius:x,y+released*.10*Math.sin(curl*Math.PI*.5),released?radius*(1-Math.cos(angle))+.012:0);
  }
  topPositions.needsUpdate=true;topGeo.computeVertexNormals();
  renderer.render(scene,camera);
 }
 raf=requestAnimationFrame(frame);
 return {active:()=>active,done,setReady(models){contents=models.map(original=>{const clone=original.clone(true);clone.visible=false;scene.add(clone);return {clone,original}});ready=contents.length===5;overlay.dataset.ready=String(ready);if(overlay.dataset.waiting==='true'&&ready)open();return done}};
}
