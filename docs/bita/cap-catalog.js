export const isPlayable=entry=>Boolean(entry)&&entry.enabled!==false;

// Quality exclusions hide designs, without erasing previously won cap IDs.
export function readOwnedCollection(serialized,manifest){
 let ids=[];try{const value=JSON.parse(serialized||'[]');if(Array.isArray(value))ids=value.filter(id=>typeof id==='string')}catch{}
 const lookup=new Map(manifest.map((entry,index)=>[entry.id,index]));
 const visible=ids.flatMap(id=>{const index=lookup.get(id);return index!==undefined&&isPlayable(manifest[index])?[index]:[]});
 return {ids,visible};
}
