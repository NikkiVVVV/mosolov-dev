import {isPlayable} from './cap-catalog.js?v=20261113-clean24';
// Draw across collections, without repeats until each design has been used.
export function makeCapDeck(manifest,random=Math.random){
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 const groups=new Map();manifest.forEach((e,i)=>{if(!isPlayable(e))return;if(!groups.has(e.series))groups.set(e.series,[]);groups.get(e.series).push(i)});for(const group of groups.values())shuffle(group);
 const deck=[];let previous=null;
 while(groups.size){const keys=shuffle([...groups.keys()]);if(keys.length>1&&keys[0]===previous)[keys[0],keys[1]]=[keys[1],keys[0]];for(const key of keys){const group=groups.get(key);deck.push(group.pop());previous=key;if(!group.length)groups.delete(key)}}
 return deck;
}
