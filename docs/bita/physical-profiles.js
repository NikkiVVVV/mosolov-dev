import {PHYSICS_RATE as RATE} from './physics-scale.js?v=20261113-arcade22';
// Stable differences between physical objects, never between winning sides.
export function capProfile(material='cardboard',id='default'){
 let hash=2166136261;for(const c of String(id))hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
 const n=(hash%1000)/999,plastic=material==='plastic',springy=(hash>>>10)%5===0;
 return {height:plastic?.022:.014,mass:(plastic?.005:.003)*(.88+n*.24),friction:(plastic?.30:.38)+n*.10,springy,restitution:Math.min(.78,(plastic?.45:.12)+n*(plastic?.14:.08)+(springy?(plastic?.09:.14):0)),flex:((plastic?1.05:1)+n*.18)*(springy?1.22:1),linearDamping:(.28+n*.15)*RATE,angularDamping:((plastic?.7:1.15)+n*.25)*RATE};
}
export const SLAMMER_PROFILES={
 'mk-dragon':{mass:.025,friction:.56,restitution:.28,linearDamping:.45*RATE,angularDamping:1*RATE,spread:.13,lever:.23,kickLow:.5,kickHigh:2.8,powerStart:.35,powerEnd:.95},
 'chupa-blue':{mass:.016,friction:.32,restitution:.62,linearDamping:.26*RATE,angularDamping:.7*RATE,spread:.28,lever:.20,kickLow:1.65,kickHigh:1.85,powerStart:0,powerEnd:1},
 'chupa-purple':{mass:.011,friction:.30,restitution:.40,linearDamping:.5*RATE,angularDamping:1.2*RATE,spread:.10,lever:.14,kickLow:2.25,kickHigh:.6,powerStart:.15,powerEnd:.8}
};
export function slammerProfile(id='chupa-blue'){return SLAMMER_PROFILES[id]??SLAMMER_PROFILES['chupa-blue']}
export function slammerTransfer(profile,power){if(typeof profile==='string')profile=slammerProfile(profile);const t=Math.max(0,Math.min(1,(power-profile.powerStart)/(profile.powerEnd-profile.powerStart)));return profile.kickLow+(profile.kickHigh-profile.kickLow)*t*t*(3-2*t)}

// Layer advantage changes energy transfer, never the winning orientation.
export function slammerLayerGain(id,count,slot){
 if(count<1||slot>=count)return 0;
 const depth=count>1?slot/(count-1):0;
 if(id==='chupa-blue')return .65+1.55*(1-depth)**4;
 if(id==='mk-dragon')return 1+.85*Math.sin(Math.PI*depth)**2;
 return 1;
}
