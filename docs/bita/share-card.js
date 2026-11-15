import {shareMessage} from './i18n.js?v=20261115-album54';
export function featuredCaps(items,limit=12){const unique=[...new Set(items.slice().reverse())];return unique.slice(0,unique.length>limit?limit-1:limit)}
export function albumShareLayout(items){const featured=featuredCaps(items),total=new Set(items).size;return{featured,total,remaining:total-featured.length};}
function rounded(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r)}
export async function renderShareCard({items,images}){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const c=canvas.getContext('2d',{alpha:false});
 c.fillStyle='#eeefed';c.fillRect(0,0,1080,1350);
 // A slim collector's binder: cloth spine, silver rings, one clear pocket sheet.
 c.save();c.shadowColor='#18232824';c.shadowBlur=42;c.shadowOffsetY=24;rounded(c,72,74,936,1202,36);c.fillStyle='#354149';c.fill();c.restore();
 const cover=c.createLinearGradient(72,0,156,0);cover.addColorStop(0,'#37434b');cover.addColorStop(.5,'#51616b');cover.addColorStop(1,'#29363f');rounded(c,72,74,88,1202,36);c.fillStyle=cover;c.fill();c.fillStyle='#ffffff12';c.fillRect(140,110,2,1128);
 c.save();c.shadowColor='#0b182e18';c.shadowBlur=16;c.shadowOffsetX=5;rounded(c,148,94,838,1162,20);c.fillStyle='#e0e5e4';c.fill();c.restore();
 const page=c.createLinearGradient(148,94,986,1256);page.addColorStop(0,'#f7faf8');page.addColorStop(.45,'#e9eeed');page.addColorStop(1,'#dce3e3');rounded(c,156,102,822,1146,16);c.fillStyle=page;c.fill();c.strokeStyle='#ffffffd9';c.lineWidth=2;c.stroke();
 for(const y of [246,675,1104]){c.save();c.shadowColor='#101a2530';c.shadowBlur=6;c.shadowOffsetY=3;c.strokeStyle='#25333c';c.lineWidth=15;c.beginPath();c.ellipse(153,y,30,16,0,0,Math.PI*2);c.stroke();const metal=c.createLinearGradient(122,y-16,176,y+16);metal.addColorStop(0,'#6b7b84');metal.addColorStop(.35,'#f7fafb');metal.addColorStop(.55,'#9aa8af');metal.addColorStop(.8,'#e5edef');metal.addColorStop(1,'#7a8992');c.strokeStyle=metal;c.lineWidth=9;c.stroke();c.restore();}
 const {featured,remaining}=albumShareLayout(items);
 for(let i=0;i<12;i++){
  const col=i%3,row=Math.floor(i/3),x=192+col*254,y=134+row*270,w=238,h=250,cx=x+w/2,cy=y+h/2;
  // Soft pocket depth and welded seams, not solid card tiles.
  rounded(c,x,y,w,h,12);c.fillStyle='#c1ced015';c.fill();c.strokeStyle='#a3b1b54a';c.lineWidth=1.5;c.stroke();
  if(i<featured.length){const index=featured[i],r=98;c.save();c.translate(cx,cy+3);c.rotate(([-5,3,-2,4,-3,2][i%6])*Math.PI/180);c.shadowColor='#23333c35';c.shadowBlur=10;c.shadowOffsetY=5;c.fillStyle='#ece6d2';c.beginPath();c.arc(0,0,r+3,0,Math.PI*2);c.fill();c.shadowColor='transparent';c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.clip();c.drawImage(images.get(index),-r,-r,r*2,r*2);c.restore();}
  else if(i===featured.length&&remaining){c.save();c.beginPath();c.arc(cx,cy+3,98,0,Math.PI*2);c.fillStyle='#33434b';c.fill();c.strokeStyle='#ffffff8c';c.lineWidth=2;c.stroke();c.font='500 46px "IBM Plex Mono",monospace';c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.fillText('+'+remaining,cx,cy+5);c.restore();}
  c.save();rounded(c,x,y,w,h,12);c.clip();const film=c.createLinearGradient(x,y,x+w,y+h);film.addColorStop(0,'#ffffff32');film.addColorStop(.28,'#ffffff08');film.addColorStop(.5,'#ffffff00');film.addColorStop(.55,'#ffffff1f');film.addColorStop(.61,'#ffffff00');film.addColorStop(1,'#c1d2d615');c.fillStyle=film;c.fillRect(x,y,w,h);
  c.fillStyle='#ffffff20';c.beginPath();c.moveTo(x+130,y);c.lineTo(x+180,y);c.lineTo(x+48,y+h);c.lineTo(x+20,y+h);c.closePath();c.fill();c.restore();
  c.strokeStyle='#ffffffa1';c.lineWidth=2;c.beginPath();c.moveTo(x+8,y+6);c.lineTo(x+w-8,y+6);c.moveTo(x+5,y+18);c.lineTo(x+5,y+h-12);c.lineTo(x+w-8,y+h-6);c.stroke();c.strokeStyle='#6b858b2a';c.lineWidth=1;c.beginPath();c.moveTo(x+8,y+15);c.lineTo(x+w-8,y+15);c.stroke();
 }
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
