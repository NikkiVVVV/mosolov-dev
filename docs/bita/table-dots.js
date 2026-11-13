import * as THREE from './vendor/three.module.js';

// World-space marks on the table: scale and foreshortening come from the camera.
export function createTableDots(scene){
 const material=new THREE.ShaderMaterial({
  uniforms:{uDark:{value:0},uPresence:{value:0}},
  vertexShader:`varying vec2 vTable;
   void main(){vec4 world=modelMatrix*vec4(position,1.0);vTable=world.xz;gl_Position=projectionMatrix*viewMatrix*world;}`,
  fragmentShader:`varying vec2 vTable;uniform float uDark;uniform float uPresence;
   void main(){
    vec2 cell=(fract(vTable/.28+.5)-.5)*.28;
    float distanceToDot=length(cell),aa=max(fwidth(distanceToDot),.0001);
    float dotAlpha=1.0-smoothstep(.010-aa,.010+aa,distanceToDot);
    float fade=1.0-smoothstep(4.0,9.0,length(vTable));
    vec3 ink=mix(vec3(.38,.40,.43),vec3(.40,.44,.53),uDark);
    gl_FragColor=vec4(ink,dotAlpha*fade*mix(.27,.22,uDark)*uPresence);
   }`,
  transparent:true,depthWrite:false,toneMapped:false
 });
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(40,40),material);
 mesh.rotation.x=-Math.PI/2;mesh.position.y=-.006;mesh.renderOrder=-2;scene.add(mesh);
 return {update(dt,dark,visible){material.uniforms.uDark.value=dark;material.uniforms.uPresence.value+=(Number(visible)-material.uniforms.uPresence.value)*(1-Math.exp(-dt/.4));}};
}
