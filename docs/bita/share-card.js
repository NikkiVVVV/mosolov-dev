import {shareMessage} from './i18n.js';
export function featuredCaps(items,limit=12){return [...new Set(items.slice().reverse())].slice(0,limit)}
function places(n){if(n<=3)return Array.from({length:n},(_,i)=>({x:540+(i-(n-1)/2)*(n===2?340:270),y:540+(i%2?16:-8),diameter:n===1?480:n===2?420:340}));const columns=n<=9?3:4,rows=Math.ceil(n/columns),diameter=columns===4?218:n<=6?290:260;return Array.from({length:n},(_,i)=>{const row=Math.floor(i/columns),inRow=Math.min(columns,n-row*columns),col=i%columns;return{x:540+(col-(inRow-1)/2)*(columns===4?230:290),y:540+(row-(rows-1)/2)*(columns===4?236:280)+(i%2?10:-10),diameter}});}
export async function renderShareCard({items,images,language='ru'}){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1080;const c=canvas.getContext('2d',{alpha:false});c.fillStyle='#f2f2f2';c.fillRect(0,0,1080,1080);c.fillStyle='#cecece';for(let y=30;y<1080;y+=32)for(let x=28;x<1080;x+=32){c.beginPath();c.arc(x,y,1.5,0,Math.PI*2);c.fill()}
 const featured=featuredCaps(items);for(const[i,index]of featured.entries()){const p=places(featured.length)[i],r=p.diameter/2;c.save();c.translate(p.x,p.y);c.rotate(([-9,7,-4,10,-7,4][i%6])*Math.PI/180);c.shadowColor='#00000024';c.shadowBlur=22;c.shadowOffsetY=12;c.fillStyle='#e6e0cf';c.beginPath();c.arc(0,0,r+5,0,Math.PI*2);c.fill();c.shadowColor='transparent';c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.clip();c.drawImage(images.get(index),-r,-r,r*2,r*2);c.restore()}
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG export failed')),'image/png'));return new File([blob],'pogs.png',{type:'image/png'});
}
export function createCollectionShare({getItems,ensureItem,imageFor,urlFor,getLanguage,onBusy=()=>{},renderCard=renderShareCard,platform=globalThis.navigator}){
 const cache=new Map();let preparing=null;
 const key=()=>getItems().join(',');
 const dataFor=base=>({file:base.file,text:shareMessage(base.count,getLanguage())+'\n'+base.url,language:getLanguage()});
 function prepare(){const id=key();if(cache.has(id)){onBusy(false);return Promise.resolve(dataFor(cache.get(id)))}if(preparing?.id===id)return preparing.promise;const items=getItems().slice(),url=urlFor();onBusy(true);const promise=(async()=>{const selected=featuredCaps(items);await Promise.all(selected.map(ensureItem));const images=new Map(selected.map(i=>[i,imageFor(i)])),file=await renderCard({items,images,language:getLanguage()}),base={file,count:items.length,url};cache.set(id,base);if(cache.size>2)cache.delete(cache.keys().next().value);return dataFor(base)})().finally(()=>{if(preparing?.id===id){preparing=null;onBusy(false)}});preparing={id,promise};return promise}
 const ready=()=>cache.has(key())?dataFor(cache.get(key())):null;
 return{prepare,ready,canShare(data=ready()){return Boolean(data&&platform?.canShare?.({files:[data.file]})&&platform.share)},share(){const data=ready();if(!data)return Promise.reject(Error('Card not ready'));return platform.share({files:[data.file],text:data.text})}};
}
