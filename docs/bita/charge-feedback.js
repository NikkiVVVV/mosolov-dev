import * as THREE from './vendor/three.module.js';
import {traceShape,spawnArc,vertex,fragment,ARCS,PULSES,hexToRgb} from './vendor/electric-logo-core.js';
// React Bits Electric Logo shader and edge tracing, with a Three.js adapter.
export function createChargeFeedback(button){
 const renderer=new THREE.WebGLRenderer({alpha:true,premultipliedAlpha:true,antialias:false,powerPreference:'low-power'});renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.25));
 const canvas=renderer.domElement;canvas.className='charge-fx';canvas.setAttribute('aria-hidden','true');button.append(canvas);
 const ends=new Float32Array(ARCS*4),arcs=new Float32Array(ARCS*4),pulses=new Float32Array(PULSES*4);
 const uniforms={tFieldFrom:{value:null},tFieldTo:{value:null},tGlowFrom:{value:null},tGlowTo:{value:null},uMapFrom:{value:[0,0,1,0]},uMapTo:{value:[0,0,1,0]},uSizeFrom:{value:[1,1,1,1]},uSizeTo:{value:[1,1,1,1]},uMorph:{value:1},uResolution:{value:[1,1]},uUnit:{value:1},uTime:{value:0},uPresence:{value:0},uHover:{value:[0,0,0]},uHoverRadius:{value:80},uPulses:{value:pulses},uPulseBoost:{value:0},uFlash:{value:0},uColor:{value:hexToRgb('#e1f2ff')},uGlowColor:{value:hexToRgb('#6f93f6')},uIntensity:{value:1},uGlow:{value:1},uThickness:{value:1.1},uStrands:{value:2},uBend:{value:.5},uCrackle:{value:1.5},uFlicker:{value:.5},uFill:{value:0},uInk:{value:1},uArcEnds:{value:ends},uArcShape:{value:arcs}};
 const material=new THREE.RawShaderMaterial({vertexShader:vertex.replace('#version 300 es',''),fragmentShader:fragment.replace('#version 300 es',''),glslVersion:THREE.GLSL3,uniforms,transparent:true,premultipliedAlpha:true,depthTest:false,depthWrite:false});
 const scene=new THREE.Scene(),mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material),camera=new THREE.Camera();mesh.frustumCulled=false;scene.add(mesh);
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),sparks=[];let power=0,presence=0,time=0,width=1,height=1,shape,fit=1,ox=0,oy=0,dirty=false,field,glow;
 function texture(data,w,h,format,internal){const t=new THREE.DataTexture(data,w,h,format,THREE.FloatType);t.internalFormat=internal;t.minFilter=t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;t.flipY=false;t.unpackAlignment=1;t.needsUpdate=true;return t}
 function resize(){const bw=button.clientWidth,bh=button.clientHeight;if(!bw||!bh)return;width=bw+160;height=bh+160;renderer.setSize(width,height,false);canvas.style.width=width+'px';canvas.style.height=height+'px';
  const mask=document.createElement('canvas');mask.width=bw*2;mask.height=bh*2;const c=mask.getContext('2d');c.fillStyle='#fff';c.beginPath();c.roundRect(1,1,mask.width-2,mask.height-2,30);c.fill();shape=traceShape(mask);if(!shape)return;field?.dispose();glow?.dispose();
  field=texture(shape.field,shape.width,shape.height,THREE.RedFormat,'R16F');glow=texture(shape.glow,shape.glowWidth,shape.glowHeight,THREE.RGFormat,'RG16F');uniforms.tFieldFrom.value=uniforms.tFieldTo.value=field;uniforms.tGlowFrom.value=uniforms.tGlowTo.value=glow;
  fit=bw/shape.logoWidth;ox=width/2-(shape.pad+shape.logoWidth/2)*fit;oy=height/2-(shape.pad+shape.logoHeight/2)*fit;uniforms.uMapFrom.value=uniforms.uMapTo.value=[ox,oy,fit,shape.glowOffset];uniforms.uSizeFrom.value=uniforms.uSizeTo.value=[shape.width,shape.height,shape.glowWidth,shape.glowHeight];uniforms.uResolution.value=[width,height];uniforms.uUnit.value=bw/100;dirty=true;
 }
 const observer=new ResizeObserver(resize);observer.observe(button);resize();
 return {setPower(value){power=Math.max(0,Math.min(1,value));button.style.setProperty('--charge',power);button.dataset.level=power>.8?'edge':power>.45?'strong':power?'building':'idle'},update(now,dt){
  if(!shape)return;const target=reduced.matches?0:power;presence+=(target-presence)*(1-Math.exp(-dt/(target>presence?.09:.14)));
  if(!power&&presence<.002){presence=0;if(dirty){renderer.clear();dirty=false}return}if(reduced.matches)return;dirty=true;time+=Math.min(dt,.05)*(1.2+power*3.3);
  for(let i=sparks.length-1;i>=0;i--)if(time-sparks[i].born>sparks[i].life)sparks.splice(i,1);
  if(power>.12&&sparks.length<ARCS&&Math.random()<dt*(2+power*power*34)){
   let spark;
   if(power>.48&&Math.random()<power*.95){const i=Math.floor(Math.random()*shape.edges.length/2),ax=shape.edges[i*2],ay=shape.edges[i*2+1],cx=shape.pad+shape.logoWidth/2,cy=shape.pad+shape.logoHeight/2;let nx=(ax-cx)/(shape.logoWidth/2),ny=(ay-cy)/(shape.logoHeight/2);const length=Math.hypot(nx,ny)||1;nx/=length;ny/=length;const reach=shape.logoWidth*(ny>.35?.12+power*.1:.14+power*.2);spark={ax,ay,bx:ax+nx*reach,by:ay+ny*reach,bow:(Math.random()-.5)*reach*.5,seed:1+Math.random()*60,born:time,life:.35+Math.random()*.35}}
   else spark=spawnArc(shape,time,null);
   if(spark)sparks.push(spark)
  }
  for(let i=0;i<ARCS;i++){const p=sparks[i],o=i*4;if(!p){arcs[o+1]=0;continue}ends[o]=ox+p.ax*fit;ends[o+1]=oy+p.ay*fit;ends[o+2]=ox+p.bx*fit;ends[o+3]=oy+p.by*fit;arcs[o]=p.bow*fit;arcs[o+1]=Math.sin(Math.PI*Math.min(1,(time-p.born)/p.life))*presence;arcs[o+2]=p.seed}
  uniforms.uTime.value=time;uniforms.uPresence.value=Math.sqrt(presence);uniforms.uIntensity.value=.3+power*power*1.35;uniforms.uGlow.value=.4+power*.65;uniforms.uThickness.value=.65+power*.7;uniforms.uStrands.value=1+Math.floor(power*4);uniforms.uBend.value=.16+power*power*.9;uniforms.uCrackle.value=.6+power*2;
  const ambient=Number(document.documentElement.style.getPropertyValue('--scene-dark'))||0;uniforms.uInk.value=1-ambient;renderer.render(scene,camera);
 },destroy(){observer.disconnect();field?.dispose();glow?.dispose();mesh.geometry.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove()}};
}
