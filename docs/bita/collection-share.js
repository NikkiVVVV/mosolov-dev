import {isPlayable} from './cap-catalog.js?v=20261113-clean24';

// A shared collection is a view of design IDs, never an ownership import.
export function readSharedCollection(hash,manifest){
 const caps=new URLSearchParams(hash.replace(/^#/, '')).get('caps');
 if(!caps||caps.length>12000)return null;
 const lookup=new Map(manifest.flatMap((e,i)=>isPlayable(e)?[[e.id,i]]:[]));
 const items=[...new Set(caps.split(','))].flatMap(id=>lookup.has(id)?[lookup.get(id)]:[]);
 return items.length?items:null;
}

export function collectionShareUrl(){return 'https://mosolov.dev/bita/'}
