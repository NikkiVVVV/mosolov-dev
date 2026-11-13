// Composite transparent scan edges onto paper before uploading the round face.
// Keep native detail: no bitmap enlargement or synthetic sharpening.
export function prepareFace(image,{imageRect,baseColor='#e8e2d5',zoom=1.025}={}){
 const rect=imageRect??[0,0,image.naturalWidth||image.width,image.naturalHeight||image.height],size=Math.min(512,rect[2],rect[3]);
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle=baseColor;ctx.fillRect(0,0,size,size);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.save();ctx.beginPath();ctx.arc(size/2,size/2,size/2,0,Math.PI*2);ctx.clip();
 const extent=size*zoom;ctx.drawImage(image,...rect,(size-extent)/2,(size-extent)/2,extent,extent);ctx.restore();return canvas;
}

export function faceThumbnail(face){
 const canvas=document.createElement('canvas'),size=Math.min(160,face.width);canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(face,0,0,size,size);return canvas.toDataURL('image/webp',.94);
}
