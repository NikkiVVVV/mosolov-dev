import RAPIER from './vendor/rapier.mjs';
export {RAPIER};
export async function createWorld(){
 await RAPIER.init();
 const world=new RAPIER.World({x:0,y:-12,z:0});world.timestep=1/120;world.numSolverIterations=12;world.integrationParameters.maxCcdSubsteps=4;
 world.tableColliderHandle=world.createCollider(RAPIER.ColliderDesc.cuboid(4,.5,4).setTranslation(0,-.5,0).setFriction(.55).setRestitution(.18)).handle;
 for(const [x,z,hx,hz] of [[-3.12,0,.1,4],[3.12,0,.1,4],[0,-3.12,4,.1],[0,3.12,4,.1]])world.createCollider(RAPIER.ColliderDesc.cuboid(hx,10,hz).setTranslation(x,9.9,z).setRestitution(.28));
 return world;
}
export function discCollider(radius,height){
 const vertices=new Float32Array(32*2*3);let k=0;
 for(const y of [-height/2,height/2])for(let i=0;i<32;i++){const a=i/32*Math.PI*2;vertices[k++]=Math.cos(a)*radius;vertices[k++]=y;vertices[k++]=Math.sin(a)*radius}
 return RAPIER.ColliderDesc.convexHull(vertices);
}
export function createCapBody(world,index,random=Math.random){
 const x=Math.PI+Math.sin(index*2.7)*.018+(random()-.5)*.015,y=index*.73,z=Math.cos(index*2)*.012;
 const c1=Math.cos(x/2),c2=Math.cos(y/2),c3=Math.cos(z/2),s1=Math.sin(x/2),s2=Math.sin(y/2),s3=Math.sin(z/2);
 const rotation={x:s1*c2*c3+c1*s2*s3,y:c1*s2*c3-s1*c2*s3,z:c1*c2*s3+s1*s2*c3,w:c1*c2*c3-s1*s2*s3};
 const body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(Math.sin(index*1.7)*.025+(random()-.5)*.02,.038+index*.075,Math.cos(index*2.4)*.025+(random()-.5)*.02).setRotation(rotation).setLinearDamping(.35).setAngularDamping(.65).setCcdEnabled(true).setSoftCcdPrediction(.15));
 world.createCollider(discCollider(.53,.07).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS).setMass(.012).setFriction(.43).setRestitution(.27),body);
 return body;
}
export function launch(body,count,power,target,rotation,spin){
 const start=body.translation(),down=4+power*6;
 const flight=(Math.sqrt(down*down+24*Math.max(.1,start.y-count*.075))-down)/12;
 body.setBodyType(RAPIER.RigidBodyType.Dynamic,true);body.setRotation(rotation,true);
 body.setLinvel({x:(target.x-start.x)/flight,y:-down,z:(target.z-start.z)/flight},true);
 body.setAngvel(spin,true);
}
export function rebound(body){const v=body.linvel();body.applyImpulse({x:0,y:.09*(Math.max(0,-v.y)+3),z:0},true)}
// Thin cardboard bends. Two brief impulse phases approximate its elastic release;
// Rapier handles all motion and collisions. These forces never choose a final side.
export function releaseEdges(bodies,hit,power){
 bodies.forEach((body,i)=>{
  const p=body.translation(),a=i*2.399963+hit.x*2+hit.z,dir={x:Math.cos(a),z:Math.sin(a)};
  const k=(.48+power*.65)*(1-i/(bodies.length*2.5));
  body.applyImpulseAtPoint({x:dir.x*.07*k,y:(.065+i*.003)*k,z:dir.z*.07*k},{x:p.x+dir.z*.3,y:p.y,z:p.z-dir.x*.3},true);
 });
}
export function releaseTwist(bodies,power){
 bodies.forEach((body,i)=>{const a=i*2.399963;
  body.applyImpulse({x:0,y:.045*(.6+power),z:0},true);
  body.applyTorqueImpulse({x:Math.cos(a)*.014*(.5+power),y:0,z:Math.sin(a)*.014*(.5+power)},true);
 });
}
export function faceUp(body){const q=body.rotation();return 1-2*(q.x*q.x+q.z*q.z)>.65}
// Thin discs can keep a tiny contact wobble in a rigid solver. Sleep only when
// their measured pose stays still for half a second, never at a flight apex.
export function sleepRestingBody(body,record,elapsed,dt){
 if(elapsed<2||body.isSleeping())return;
 record.time=(record.time||0)+dt;
 if(record.time<.5)return;
 record.time=0;const p=body.translation(),q=body.rotation(),v=body.linvel();
 if(record.p){
  const distance=Math.hypot(p.x-record.p.x,p.y-record.p.y,p.z-record.p.z);
  const dot=Math.min(1,Math.abs(q.x*record.q.x+q.y*record.q.y+q.z*record.q.z+q.w*record.q.w));
  if(p.y>.015&&p.y<.9&&distance<.04&&2*Math.acos(dot)<.15&&Math.hypot(v.x,v.y,v.z)<.6)body.sleep();
 }
 record.p=p;record.q=q;
}
// Exact support of a rotated disc above the table. A thin, quickly rotating
// convex collider can otherwise penetrate the plane between solver steps.
export function enforceTable(body,radius=.53,height=.07){
 const p=body.translation(),q=body.rotation(),ny=1-2*(q.x*q.x+q.z*q.z);
 const support=Math.abs(ny)*height/2+radius*Math.sqrt(Math.max(0,1-ny*ny));
 if(p.y<height/2-.004){
  body.setTranslation({x:p.x,y:support,z:p.z},false);
  const v=body.linvel();if(v.y<0)body.setLinvel({x:v.x*.97,y:-v.y*.12,z:v.z*.97},false);
 }
}
export function sleepRestingGroup(bodies,record,elapsed,dt){
 if(elapsed<3)return false;
 record.time=(record.time||0)+dt;if(record.time<.6)return false;record.time=0;
 const poses=bodies.map(b=>({p:b.translation(),q:b.rotation()}));
 const stable=record.poses&&poses.every(({p,q},i)=>{
  const old=record.poses[i],v=bodies[i].linvel();
  const dot=Math.min(1,Math.abs(q.x*old.q.x+q.y*old.q.y+q.z*old.q.z+q.w*old.q.w));
  return p.y>.015&&p.y<1&&Math.hypot(p.x-old.p.x,p.y-old.p.y,p.z-old.p.z)<.07&&2*Math.acos(dot)<.24&&Math.hypot(v.x,v.y,v.z)<.65;
 });
 record.poses=poses;if(stable)bodies.forEach(b=>b.sleep());return Boolean(stable);
}

export const STACK_DISC_HEIGHT=.045;
export function createStackBody(world,index,random=Math.random){
 const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setCcdEnabled(true).setSoftCcdPrediction(.12));
 world.createCollider(discCollider(.53,STACK_DISC_HEIGHT).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS).setMass(.008).setFriction(.43).setRestitution(.27),body);
 const x=[0,.09,-.065,.055][index%4]+(random()-.5)*.055,z=[0,-.045,.055,-.025][index%4]+(random()-.5)*.055;
 const ax=Math.PI+(random()-.5)*(index===0?.008:.025),ay=random()*Math.PI*2,az=(random()-.5)*.025;
 const c1=Math.cos(ax/2),c2=Math.cos(ay/2),c3=Math.cos(az/2),s1=Math.sin(ax/2),s2=Math.sin(ay/2),s3=Math.sin(az/2);
 const rotation={x:s1*c2*c3+c1*s2*s3,y:c1*s2*c3-s1*c2*s3,z:c1*c2*s3+s1*s2*c3,w:c1*c2*c3-s1*s2*s3};
 const position={x,y:.034+index*.064,z};
 body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);body.setTranslation(position,true);body.setRotation(rotation,true);
 return {body,position,rotation};
}
export function throwStack(bodies,power){
 for(const [i,body] of bodies.entries()){
  body.setBodyType(RAPIER.RigidBodyType.Dynamic,true);
  body.setLinearDamping(.18);body.setAngularDamping(.5);
  body.setLinvel({x:Math.sin(i*2.4)*.02,y:3.2+power*3.3,z:Math.cos(i*1.7)*.02},true);
  body.setAngvel({x:Math.sin(i*2)*.06,y:.06,z:Math.cos(i*2.4)*.06},true);
 }
}
