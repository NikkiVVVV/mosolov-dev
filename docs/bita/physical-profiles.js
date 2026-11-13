// Stable differences between physical objects, never between winning sides.
export function capProfile(material='cardboard',id='default'){
 let hash=2166136261;for(const c of String(id))hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
 const n=(hash%1000)/999,plastic=material==='plastic';
 return {height:plastic?.022:.014,mass:(plastic?.005:.003)*(.88+n*.24),friction:(plastic?.30:.38)+n*.10,restitution:(plastic?.32:.20)+n*.12,flex:(plastic?.85:1.05)+n*.25,linearDamping:.28+n*.15,angularDamping:.6+n*.3};
}
export const SLAMMER_PROFILES={
 'mk-dragon':{mass:.021,friction:.48,restitution:.34,kick:.82},
 'chupa-blue':{mass:.015,friction:.36,restitution:.52,kick:1},
 'chupa-purple':{mass:.011,friction:.28,restitution:.68,kick:1.22}
};
export function slammerProfile(id='chupa-blue'){return SLAMMER_PROFILES[id]??SLAMMER_PROFILES['chupa-blue']}
