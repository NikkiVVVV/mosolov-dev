import * as THREE from './vendor/three.module.js';
import {traceShape,spawnArc,vertex,fragment,ARCS,PULSES,hexToRgb} from './vendor/electric-logo-core.js';
// React Bits Electric Logo shader and edge tracing, with a Three.js adapter.
const ARC_COUNT=8;
const chargeFragment=fragment.replace(`uArcEnds[${ARCS}]`,`uArcEnds[${ARC_COUNT}]`).replace(`uArcShape[${ARCS}]`,`uArcShape[${ARC_COUNT}]`).replace(`i < ${ARCS}; i++) addArc`,`i < ${ARC_COUNT}; i++) addArc`);
export function createChargeFeedback(button){
 const renderer=new THREE.WebGLRenderer({alpha:true,premultipliedAlpha:true,antialias:false,powerPreference:'low-power'});renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.25));
 const canvas=renderer.domElement;canvas.className='charge-fx';canvas.setAttribute('aria-hidden','true');button.append(canvas);
 const ends=new Float32Array(ARC_COUNT*4),arcs=new Float32Array(ARC_COUNT*4),pulses=new Float32Array(PULSES*4);
 const uniforms={tFieldFrom:{value:null},tFieldTo:{value:null},tGlowFrom:{value:null},tGlowTo:{value:null},uMapFrom:{value:[0,0,1,0]},uMapTo:{value:[0,0,1,0]},uSizeFrom:{value:[1,1,1,1]},uSizeTo:{value:[1,1,1,1]},uMorph:{value:1},uResolution:{value:[1,1]},uUnit:{value:1},uTime:{value:0},uPresence:{value:0},uHover:{value:[0,0,0]},uHoverRadius:{value:80},uPulses:{value:pulses},uPulseBoost:{value:0},uFlash:{value:0},uColor:{value:hexToRgb('#f3dfff')},uGlowColor:{value:hexToRgb('#a35cff')},uIntensity:{value:1},uGlow:{value:1},uThickness:{value:1.1},uStrands:{value:2},uBend:{value:.5},uCrackle:{value:1.5},uFlicker:{value:.5},uFill:{value:0},uInk:{value:1},uArcEnds:{value:ends},uArcShape:{value:arcs}};
 const material=new THREE.RawShaderMaterial({vertexShader:vertex.replace('#version 300 es',''),fragmentShader:chargeFragment.replace('#version 300 es',''),glslVersion:THREE.GLSL3,uniforms,transparent:true,premultipliedAlpha:true,depthTest:false,depthWrite:false});
 const scene=new THREE.Scene(),mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material),camera=new THREE.Camera();mesh.frustumCulled=false;scene.add(mesh);
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),sparks=[];let power=0,presence=0,time=0,width=1,height=1,shape,fit=1,ox=0,oy=0,dirty=false,field,glow,sector=0;
 function texture(data,w,h,format,internal){const t=new THREE.DataTexture(data,w,h,format,THREE.FloatType);t.internalFormat=internal;t.minFilter=t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;t.flipY=false;t.unpackAlignment=1;t.needsUpdate=true;return t}
 function resize(){const bw=button.clientWidth,bh=button.clientHeight;if(!bw||!bh)return;width=bw+224;height=bh+224;renderer.setSize(width,height,false);canvas.style.width=width+'px';canvas.style.height=height+'px';
  const mask=document.createElement('canvas');mask.width=bw*2;mask.height=bh*2;const c=mask.getContext('2d');c.fillStyle='#fff';c.beginPath();c.roundRect(1,1,mask.width-2,mask.height-2,30);c.fill();shape=traceShape(mask);if(!shape)return;field?.dispose();glow?.dispose();
  field=texture(shape.field,shape.width,shape.height,THREE.RedFormat,'R16F');glow=texture(shape.glow,shape.glowWidth,shape.glowHeight,THREE.RGFormat,'RG16F');uniforms.tFieldFrom.value=uniforms.tFieldTo.value=field;uniforms.tGlowFrom.value=uniforms.tGlowTo.value=glow;
  fit=bw/shape.logoWidth;ox=width/2-(shape.pad+shape.logoWidth/2)*fit;oy=height/2-(shape.pad+shape.logoHeight/2)*fit;uniforms.uMapFrom.value=uniforms.uMapTo.value=[ox,oy,fit,shape.glowOffset];uniforms.uSizeFrom.value=uniforms.uSizeTo.value=[shape.width,shape.height,shape.glowWidth,shape.glowHeight];uniforms.uResolution.value=[width,height];uniforms.uUnit.value=bw/100;dirty=true;
 }
 const observer=new ResizeObserver(resize);observer.observe(button);resize();
 return {setPower(value){power=Math.max(0,Math.min(1,value));button.style.setProperty('--charge',power);button.dataset.level=power>.8?'edge':power>.45?'strong':power?'building':'idle'},update(now,dt){
  if(!shape)return;const target=reduced.matches?0:power;presence+=(target-presence)*(1-Math.exp(-dt/(target>presence?.09:.14)));
  if(!power&&presence<.002){presence=0;if(dirty){renderer.clear();dirty=false}return}if(reduced.matches)return;dirty=true;time+=Math.min(dt,.05)*(1.4+power*2.6);
  for(let i=sparks.length-1;i>=0;i--)if(time-sparks[i].born>sparks[i].life)sparks.splice(i,1);
  if(power>.10&&sparks.length<ARC_COUNT&&Math.random()<dt*(6+power*power*74)){
   let spark;
   if(power>.2&&Math.random()<.75+power*.2){
    const angle=sector++*2.399963+(Math.random()-.5)*.22,nx=Math.cos(angle),ny=Math.sin(angle),cx=shape.pad+shape.logoWidth/2,cy=shape.pad+shape.logoHeight/2;
    let edge=0,best=-Infinity;
    for(let i=0;i<shape.edges.length;i+=2){const dx=(shape.edges[i]-cx)/(shape.logoWidth/2),dy=(shape.edges[i+1]-cy)/(shape.logoHeight/2),score=(dx*nx+dy*ny)/(Math.hypot(dx,dy)||1);if(score>best){best=score;edge=i}}
    const ax=shape.edges[edge],ay=shape.edges[edge+1],reach=shape.logoWidth*(ny>.35?.12+power*.10:.18+power*.35);
    spark={ax,ay,bx:ax+nx*reach,by:ay+ny*reach,bow:(Math.random()-.5)*reach*.6,seed:1+Math.random()*60,born:time,life:.45+Math.random()*.4};
   }else spark=spawnArc(shape,time,null);
   if(spark)sparks.push(spark)
  }
  for(let i=0;i<ARC_COUNT;i++){const p=sparks[i],o=i*4;if(!p){arcs[o+1]=0;continue}ends[o]=ox+p.ax*fit;ends[o+1]=oy+p.ay*fit;ends[o+2]=ox+p.bx*fit;ends[o+3]=oy+p.by*fit;arcs[o]=p.bow*fit;arcs[o+1]=Math.sin(Math.PI*Math.min(1,(time-p.born)/p.life))*presence;arcs[o+2]=p.seed}
  uniforms.uTime.value=time;uniforms.uPresence.value=Math.sqrt(presence);uniforms.uIntensity.value=.35+power*power*1.9;uniforms.uGlow.value=.4+power*.5;uniforms.uThickness.value=.65+power*.85;uniforms.uStrands.value=1+Math.floor(power*4);uniforms.uBend.value=.16+power*power*.9;uniforms.uCrackle.value=.6+power*2;
  const ambient=Number(document.documentElement.style.getPropertyValue('--scene-dark'))||0;uniforms.uInk.value=1-ambient;renderer.render(scene,camera);
 },destroy(){observer.disconnect();field?.dispose();glow?.dispose();mesh.geometry.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove()}};
}
