import {PHYSICS_RATE as RATE} from './physics-scale.js?v=20261113-arcade22';
// Stable differences between physical objects, never between winning sides.
export function capProfile(material='cardboard',id='default'){
 let hash=2166136261;for(const c of String(id))hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
 const n=(hash%1000)/999,plastic=material==='plastic';
 return {height:plastic?.022:.014,mass:(plastic?.005:.003)*(.88+n*.24),friction:(plastic?.30:.38)+n*.10,restitution:(plastic?.45:.12)+n*(plastic?.14:.08),flex:(plastic?1.05:1)+n*.18,linearDamping:(.28+n*.15)*RATE,angularDamping:((plastic?.7:1.15)+n*.25)*RATE};
}
export const SLAMMER_PROFILES={
 'mk-dragon':{mass:.021,friction:.48,restitution:.34,kick:.82},
 'chupa-blue':{mass:.015,friction:.36,restitution:.52,kick:1},
 'chupa-purple':{mass:.011,friction:.28,restitution:.68,kick:1.22}
};
export function slammerProfile(id='chupa-blue'){return SLAMMER_PROFILES[id]??SLAMMER_PROFILES['chupa-blue']}
