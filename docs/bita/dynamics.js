import {GRAVITY,PHYSICS_RATE as RATE} from './physics-scale.js?v=20261113-pack17';
import {capProfile,slammerProfile} from './physical-profiles.js?v=20261113-pack17';
import RAPIER from './vendor/rapier.mjs';
export {RAPIER};
export async function createWorld({extent=3.12}={}){
 await RAPIER.init();
 const world=new RAPIER.World({x:0,y:-GRAVITY,z:0});world.timestep=1/240;world.numSolverIterations=16;world.integrationParameters.maxCcdSubsteps=8;world.integrationParameters.normalizedAllowedLinearError=.00015;world.integrationParameters.normalizedPredictionDistance=.003;
 world.tableColliderHandle=world.createCollider(RAPIER.ColliderDesc.cuboid(4,.5,4).setTranslation(0,-.5,0).setFriction(.55).setRestitution(.18)).handle;
 world.bitaWalls=[];for(const [x,z,hx,hz] of [[-extent,0,.1,4],[extent,0,.1,4],[0,-extent,4,.1],[0,extent,4,.1]]){const collider=world.createCollider(RAPIER.ColliderDesc.cuboid(hx,10,hz).setTranslation(x,9.9,z).setRestitution(.28));world.bitaWalls.push({collider,x:-Math.sign(x),z:-Math.sign(z)})}
 return world;
}
export function discCollider(radius,height){
 return RAPIER.ColliderDesc.cylinder(height/2,radius);
}
export function createCapBody(world,index,random=Math.random){
 const x=Math.PI+Math.sin(index*2.7)*.018+(random()-.5)*.015,y=index*.73,z=Math.cos(index*2)*.012;
 const c1=Math.cos(x/2),c2=Math.cos(y/2),c3=Math.cos(z/2),s1=Math.sin(x/2),s2=Math.sin(y/2),s3=Math.sin(z/2);
 const rotation={x:s1*c2*c3+c1*s2*s3,y:c1*s2*c3-s1*c2*s3,z:c1*c2*s3+s1*s2*c3,w:c1*c2*c3-s1*s2*s3};
 const body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(Math.sin(index*1.7)*.025+(random()-.5)*.02,.038+index*.075,Math.cos(index*2.4)*.025+(random()-.5)*.02).setRotation(rotation).setLinearDamping(.35*RATE).setAngularDamping(.65*RATE).setCcdEnabled(true).setSoftCcdPrediction(.15));
 world.createCollider(discCollider(.53,.07).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS).setMass(.012).setFriction(.43).setRestitution(.27),body);
 return body;
}
export function launch(body,count,power,target,rotation,spin){
 const start=body.translation(),down=(4+power*6)*RATE;
 const flight=(Math.sqrt(down*down+2*GRAVITY*Math.max(.1,start.y-count*.075))-down)/GRAVITY;
 body.setBodyType(RAPIER.RigidBodyType.Dynamic,true);body.setRotation(rotation,true);
 body.setLinvel({x:(target.x-start.x)/flight,y:-down,z:(target.z-start.z)/flight},true);
 body.setAngvel({x:spin.x*RATE,y:spin.y*RATE,z:spin.z*RATE},true);
}
export function rebound(body){const v=body.linvel();body.applyImpulse({x:0,y:.09*(Math.max(0,-v.y)+3),z:0},true)}
// Thin cardboard bends. Two brief impulse phases approximate its elastic release;
// Rapier handles all motion and collisions. These forces never choose a final side.
export function releaseEdges(bodies,hit,power){
 bodies.forEach((body,i)=>{
  const p=body.translation(),a=i*2.399963+hit.x*2+hit.z,dir={x:Math.cos(a),z:Math.sin(a)};
  const k=(.48+power*.65)*(1-i/(bodies.length*2.5));
  body.applyImpulseAtPoint({x:dir.x*.07*k*RATE,y:(.065+i*.003)*k*RATE,z:dir.z*.07*k*RATE},{x:p.x+dir.z*.3,y:p.y,z:p.z-dir.x*.3},true);
 });
}
export function releaseTwist(bodies,power){
 bodies.forEach((body,i)=>{const a=i*2.399963;
  body.applyImpulse({x:0,y:.045*(.6+power)*RATE,z:0},true);
  body.applyTorqueImpulse({x:Math.cos(a)*.014*(.5+power)*RATE,y:0,z:Math.sin(a)*.014*(.5+power)*RATE},true);
 });
}
export function faceUp(body){const q=body.rotation();return 1-2*(q.x*q.x+q.z*q.z)>.65}
// A stationary edge is not a completed landing. Moderate slopes over other
// caps are allowed; a nearly vertical disc must keep simulating.
export function discCanRest(body){const q=body.rotation();return Math.abs(1-2*(q.x*q.x+q.z*q.z))>=.94}
// Thin discs can keep a tiny contact wobble in a rigid solver. Sleep only when
// their measured pose stays still for half a second, never at a flight apex.
export function sleepRestingBody(body,record,elapsed,dt){
 if(!body.isDynamic())return;
 const pose=body.rotation(),ny=1-2*(pose.x*pose.x+pose.z*pose.z),v=body.linvel(),spin=body.angvel();
 if(!discCanRest(body)){
  if(body.isSleeping())body.wakeUp();
  const shape=body.collider(0).shape,p=body.translation(),support=Math.abs(ny)*shape.halfHeight+shape.radius*Math.sqrt(Math.max(0,1-ny*ny));
  // A thin cardboard/plastic rim loses energy as it rolls. An ideal rigid
  // cylinder has no rolling resistance and can otherwise travel indefinitely.
  const onTable=p.y-support<.02;
  body.setLinearDamping(onTable?2.4*RATE:(body.bitaProfile?.linearDamping??.35*RATE));
  body.setAngularDamping(onTable?1.6*RATE:(body.bitaProfile?.angularDamping??.8*RATE));
  const nx=2*(pose.x*pose.y-pose.w*pose.z),nz=2*(pose.y*pose.z+pose.w*pose.x),rate=spin.z*nx-spin.x*nz;
  if(Math.abs(rate)>.015*RATE)record.lastTilt=rate;
  record.wallCooldown=Math.max(0,(record.wallCooldown||0)-dt);
  const wall=body.bitaWalls?.find(w=>{const c=body.collider(0).contactCollider(w.collider,.008);return c&&c.distance<.006});
  if(wall&&elapsed>.35/RATE&&!record.wallCooldown&&v.x*wall.x+v.z*wall.z<.1*RATE){
   body.applyImpulseAtPoint({x:wall.x*body.mass()*2*RATE,y:0,z:wall.z*body.mass()*2*RATE},{x:p.x,y:p.y+.15,z:p.z},true);
   record.wallCooldown=.45/RATE;
  }
  const slow=Math.hypot(v.x,v.y,v.z)<.22*RATE&&Math.hypot(spin.x,spin.y,spin.z)<.85*RATE;
  record.edgeTime=elapsed>.35/RATE&&slow?(record.edgeTime||0)+dt:0;
  if(record.edgeTime>.16/RATE){
   // Real cardboard rims are not ideal cylinders. A tiny contact disturbance
   // breaks the solver's exact edge balance, then gravity completes the fall.
   if(!wall){
    const sign=Math.abs(ny)>.02?Math.sign(ny):Math.sign(record.lastTilt||ny||Math.sin(nx*12.9+nz*7.3+body.mass()*1000)||1);
    const impulse=body.mass()*.035*RATE;
    body.applyTorqueImpulse({x:-nz*sign*impulse,y:0,z:nx*sign*impulse},true);
    body.applyImpulse({x:-nx*sign*body.mass()*.1*RATE,y:0,z:-nz*sign*body.mass()*.1*RATE},true);
   }
   record.edgeTime=0;
  }
  record.time=0;record.p=null;return;
 }
 record.edgeTime=0;
 if(elapsed<2/RATE||body.isSleeping())return;
 record.time=(record.time||0)+dt;
 if(record.time<.5/RATE)return;
 record.time=0;const p=body.translation(),q=body.rotation();
 if(record.p){
  const distance=Math.hypot(p.x-record.p.x,p.y-record.p.y,p.z-record.p.z);
  const dot=Math.min(1,Math.abs(q.x*record.q.x+q.y*record.q.y+q.z*record.q.z+q.w*record.q.w));
  if(p.y>.001&&p.y<.9&&distance<.04&&2*Math.acos(dot)<.15&&Math.hypot(v.x,v.y,v.z)<.6*RATE)body.sleep();
 }
 record.p=p;record.q=q;
}
// Exact support of a rotated disc above the table. A thin, quickly rotating
// convex collider can otherwise penetrate the plane between solver steps.
export function enforceTable(body,radius=.53,height=.07){
 const p=body.translation(),q=body.rotation(),ny=1-2*(q.x*q.x+q.z*q.z);
 const support=Math.abs(ny)*height/2+radius*Math.sqrt(Math.max(0,1-ny*ny));
 if(p.y<support-.0005){
  body.setTranslation({x:p.x,y:support,z:p.z},false);
  const v=body.linvel();if(v.y<0)body.setLinvel({x:v.x*.97,y:0,z:v.z*.97},false);
 }
}
export function sleepRestingGroup(bodies,record,elapsed,dt){
 if(elapsed<3/RATE)return false;
 record.time=(record.time||0)+dt;if(record.time<.6/RATE)return false;record.time=0;
 const poses=bodies.map(b=>({p:b.translation(),q:b.rotation()}));
 const stable=record.poses&&poses.every(({p,q},i)=>{
  const old=record.poses[i],v=bodies[i].linvel();
  const dot=Math.min(1,Math.abs(q.x*old.q.x+q.y*old.q.y+q.z*old.q.z+q.w*old.q.w));
  return discCanRest(bodies[i])&&p.y>.001&&p.y<1&&Math.hypot(p.x-old.p.x,p.y-old.p.y,p.z-old.p.z)<.07&&2*Math.acos(dot)<.24&&Math.hypot(v.x,v.y,v.z)<.65*RATE;
 });
 record.poses=poses;if(stable)bodies.forEach(b=>b.sleep());return Boolean(stable);
}

export const STACK_DISC_HEIGHT=.014;
export const HOVER_HEIGHT=0;
export const STACK_LAYER_STEP=.034;
export function createStackBody(world,index,random=Math.random,material='cardboard',id=index){
 const profile=capProfile(material,id),height=profile.height;
 const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setCanSleep(false).setCcdEnabled(true).setSoftCcdPrediction(.12));
 world.createCollider(discCollider(.53,height).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS).setContactSkin(.0015).setMass(profile.mass).setFriction(profile.friction).setRestitution(profile.restitution).setRestitutionCombineRule(material==='plastic'?RAPIER.CoefficientCombineRule.Max:RAPIER.CoefficientCombineRule.Average),body);
 const x=[0,.09,-.065,.055][index%4]+(random()-.5)*.055,z=[0,-.045,.055,-.025][index%4]+(random()-.5)*.055;
 const ax=Math.PI+(random()-.5)*.008,ay=random()*Math.PI*2,az=(random()-.5)*.008;
 const c1=Math.cos(ax/2),c2=Math.cos(ay/2),c3=Math.cos(az/2),s1=Math.sin(ax/2),s2=Math.sin(ay/2),s3=Math.sin(az/2);
 const rotation={x:s1*c2*c3+c1*s2*s3,y:c1*s2*c3-s1*c2*s3,z:c1*c2*s3+s1*s2*c3,w:c1*c2*c3-s1*s2*s3};
 const position={x,y:HOVER_HEIGHT+.014+index*STACK_LAYER_STEP,z};
 body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);body.setTranslation(position,true);body.setRotation(rotation,true);
 body.bitaProfile=profile;body.bitaWalls=world.bitaWalls;return {body,position,rotation,height,profile};
}
export function throwStack(bodies,power){
 for(const [i,body] of bodies.entries()){
  body.setBodyType(RAPIER.RigidBodyType.Dynamic,true);
  body.setLinearDamping(.18*RATE);body.setAngularDamping(.5*RATE);
  body.setLinvel({x:Math.sin(i*2.4)*.02*RATE,y:(3.2+power*3.3)*RATE,z:Math.cos(i*1.7)*.02*RATE},true);
  body.setAngvel({x:Math.sin(i*2)*.06*RATE,y:.06*RATE,z:Math.cos(i*2.4)*.06*RATE},true);
 }
}

export function strikeStackDown(bodies,power){
 for(const [i,body] of bodies.entries()){
  body.setBodyType(RAPIER.RigidBodyType.Dynamic,true);
  body.setLinearDamping(body.bitaProfile?.linearDamping??.35*RATE);body.setAngularDamping(body.bitaProfile?.angularDamping??.8*RATE);
  body.setLinvel({x:Math.sin(i*2.4)*.012*RATE,y:(-2.4-power*3.4)*RATE,z:Math.cos(i*1.7)*.012*RATE},true);
  body.setAngvel({x:Math.sin(i*2)*.04*RATE,y:.03*RATE,z:Math.cos(i*2.4)*.04*RATE},true);
 }
}
// A small, mass-scaled flex release only while a cap touches another cap
// or the table. Never give a flying cap a second upward kick.
export function fanStack(bodies,power,contactConfirmed=false,released=null){
 let affected=0;
 bodies.forEach((body,i)=>{if(released?.has(body.collider(0).handle))return;const p=body.translation(),shape=body.collider(0).shape,q=body.rotation(),ny=1-2*(q.x*q.x+q.z*q.z),support=Math.abs(ny)*shape.halfHeight+shape.radius*Math.sqrt(Math.max(0,1-ny*ny));
 const touches=contactConfirmed||p.y-support<.025||bodies.some(other=>other!==body&&body.collider(0).contactCollider(other.collider(0),.012));
 if(!touches||body.linvel().y>2.5*RATE)return;released?.add(body.collider(0).handle);
 const a=2*Math.atan2(q.z,q.x)+i*2.399963+p.x*7+p.z*11,dx=Math.cos(a),dz=Math.sin(a),mass=body.mass(),k=(.95+power*.45)*(body.bitaProfile?.flex??1);
 body.applyImpulseAtPoint({x:dx*mass*1.3*k*RATE,y:mass*(3.2*k*RATE-Math.min(0,body.linvel().y)),z:dz*mass*1.3*k*RATE},{x:p.x+dz*.42,y:p.y,z:p.z-dx*.42},true);body.applyTorqueImpulse({x:dz*mass*.65*k*RATE,y:0,z:-dx*mass*.65*k*RATE},true);affected++;
 });return affected;
}
// Kept for old callers; rigid contact handles the later tumbling.
export function turnStack(){return 0}

export function chargeLift(power){return .85*Math.max(0,Math.min(1,power))**2}

export const MAX_STACK=25;
export const SLAMMER_HEIGHT=.08;
export const SLAMMER_RADIUS=.55;
export function slammerY(slot){return HOVER_HEIGHT+SLAMMER_HEIGHT/2+.004+slot*STACK_LAYER_STEP}
export function capInsertionOffset(index,slot,enabled=true){return enabled&&index>=slot?SLAMMER_HEIGHT+.018:0}
export function createSlammerBody(world,slot,design='chupa-blue'){
 const profile=slammerProfile(design);
 const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setCanSleep(false).setTranslation(0,slammerY(slot),0).setCcdEnabled(true).setSoftCcdPrediction(.1));
 const collider=world.createCollider(discCollider(SLAMMER_RADIUS,SLAMMER_HEIGHT).setMass(profile.mass).setFriction(profile.friction).setRestitution(profile.restitution).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),body);
 body.bitaProfile=profile;body.bitaWalls=world.bitaWalls;return {body,collider,profile,position:{x:0,y:slammerY(slot),z:0},rotation:{x:0,y:0,z:0,w:1}};
}
export function slammerWeights(count,slot){
 if(slot>=count)return Array(count).fill(0);
 return Array.from({length:count},(_,i)=>{const above=i>=slot,d=above?i-slot:slot-1-i;return d>4?0:Math.exp(-d/1.3)*(above?1:.55)});
}
// A local elastic response at the stiff plastic insert. No final sides are chosen.
// On top there are no overlying caps: only the insert receives the extra rebound.
export function slammerResponse(bodies,insert,slot,power){
 const weights=slammerWeights(bodies.length,slot);let reaction=0,affected=0;
 if(slot>=bodies.length)return {affected,weights};
 bodies.forEach((body,i)=>{const contact=body.collider(0).contactCollider(insert.collider(0),.025),k=weights[i]*(.5+power*.5);if(!k||!contact)return;
 const p=body.translation(),a=i*2.399963,impulse=body.mass()*1.6*RATE*k*(insert.bitaProfile?.kick??1);
 body.applyImpulseAtPoint({x:Math.cos(a)*impulse*.15,y:impulse,z:Math.sin(a)*impulse*.15},{x:p.x+Math.sin(a)*.16,y:p.y,z:p.z-Math.cos(a)*.16},true);reaction+=impulse;affected++;
 });insert.applyImpulse({x:0,y:-reaction,z:0},true);return {affected,weights};
}

// Resolve residual overlap before freezing the result.
// Orientations and horizontal trajectories remain the simulated ones.
export function separateDiscs(world,entries,{stableOrder=false}={}){
 const sorted=entries.filter(e=>!e.collected).map(e=>{const b=e.body,q=b.rotation(),s=b.collider(0).shape,ny=1-2*(q.x*q.x+q.z*q.z);const y=b.translation().y;if(!stableOrder||e.sortHeight===undefined||Math.abs(y-e.sortHeight)>.03)e.sortHeight=y;return {b,entry:e,key:e.sortHeight,r:s.radius,support:Math.abs(ny)*s.halfHeight+s.radius*Math.sqrt(Math.max(0,1-ny*ny))}}).sort((a,b)=>a.key-b.key||(a.entry.drawOrder??0)-(b.entry.drawOrder??0));
 const placed=[];let corrections=0;world.propagateModifiedBodyPositionsToColliders();
 for(const item of sorted){const b=item.b,p=b.translation(),near=placed.filter(o=>{const q=o.b.translation();return Math.hypot(p.x-q.x,p.z-q.z)<item.r+o.r+.002});
  const clearAt=y=>{if(b.translation().y!==y){b.setTranslation({x:p.x,y,z:p.z},false);world.propagateModifiedBodyPositionsToColliders()}return near.every(o=>{if(Math.abs(y-o.b.translation().y)>item.support+o.support+.004)return true;const c=b.collider(0).contactCollider(o.b.collider(0),.003);return !c||c.distance>=.0025})};
  let low=Math.max(p.y,item.support+.0045);if(!clearAt(low)){let high=Math.max(low,...near.map(o=>o.b.translation().y+o.support+item.support+.004));for(let i=0;i<18;i++){const mid=(low+high)/2;if(clearAt(mid))high=mid;else low=mid}clearAt(high);corrections++}
  item.entry.drawOrder=placed.length;placed.push(item);
 }
 world.propagateModifiedBodyPositionsToColliders();return corrections;
}
export function limitDiscSpeed(body){const w=body.angvel(),spin=Math.hypot(w.x,w.y,w.z);if(spin>36*RATE)body.setAngvel({x:w.x*36*RATE/spin,y:w.y*36*RATE/spin,z:w.z*36*RATE/spin},false);const v=body.linvel(),speed=Math.hypot(v.x,v.y,v.z);if(speed>12*RATE)body.setLinvel({x:v.x*12*RATE/speed,y:v.y*12*RATE/speed,z:v.z*12*RATE/speed},false)}

export function discIsMoving(body){const v=body.linvel(),w=body.angvel();return !discCanRest(body)||Math.hypot(v.x,v.y,v.z)>.2*RATE||Math.hypot(w.x,w.y,w.z)>1.3*RATE}
