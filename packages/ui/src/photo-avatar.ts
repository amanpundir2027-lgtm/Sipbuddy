export async function loadPhoto(file:File):Promise<HTMLImageElement> {
 if(file.size>10*1024*1024)throw new Error('Choose a photo smaller than 10 MB.');
 const header=new Uint8Array(await file.slice(0,24).arrayBuffer());
 const png=[137,80,78,71,13,10,26,10].every((v,i)=>header[i]===v);
 const jpeg=header[0]===255&&header[1]===216&&header[2]===255;
 const webp=String.fromCharCode(...header.slice(0,4))==='RIFF'&&String.fromCharCode(...header.slice(8,12))==='WEBP';
 if(!png&&!jpeg&&!webp)throw new Error('Choose a PNG, JPEG, or WebP photo. SVG and other files are not supported.');
 if(png){const view=new DataView(header.buffer);if(view.getUint32(16)>8192||view.getUint32(20)>8192)throw new Error('Choose a photo smaller than 8192 × 8192 pixels.')}
 const url=URL.createObjectURL(file);
 try{const image=new Image();image.src=url;await image.decode();if(image.naturalWidth<16||image.naturalHeight<16||image.naturalWidth>8192||image.naturalHeight>8192)throw new Error('Choose a photo between 16 and 8192 pixels on each side.');return image}
 catch(error){if(error instanceof Error&&error.message.startsWith('Choose'))throw error;throw new Error('This photo could not be read. Try another PNG, JPEG, or WebP.')}
 finally{URL.revokeObjectURL(url)}
}
export function createPortrait(image:HTMLImageElement,{zoom,x,y,cartoon}:{zoom:number;x:number;y:number;cartoon:boolean}):string {
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw new Error('Your browser could not create the avatar.');
 const side=Math.min(image.naturalWidth,image.naturalHeight)/zoom;
 const left=(image.naturalWidth-side)*x/100,top=(image.naturalHeight-side)*y/100;
 context.fillStyle='#eff5ee';context.fillRect(0,0,256,256);
 context.imageSmoothingQuality='high';context.filter=cartoon?'blur(0.4px) saturate(1.16) contrast(1.05)':'none';
 context.drawImage(image,left,top,side,side,0,0,256,256);context.filter='none';
 if(cartoon){
  const pixels=context.getImageData(0,0,256,256),source=new Uint8ClampedArray(pixels.data);
  const luminance=(x:number,y:number)=>{const i=(y*256+x)*4;return .299*source[i]+.587*source[i+1]+.114*source[i+2]};
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   const i=(y*256+x)*4;let edge=0;
   if(x>0&&y>0&&x<255&&y<255){const dx=luminance(x+1,y)-luminance(x-1,y),dy=luminance(x,y+1)-luminance(x,y-1);edge=Math.hypot(dx,dy)>48?.82:1}
   for(let c=0;c<3;c++)pixels.data[i+c]=Math.min(255,Math.round(source[i+c]/20)*20)*edge;
  }
  context.putImageData(pixels,0,0);
 }
 // Canvas exports pixels only: camera metadata and the original file are not saved.
 return canvas.toDataURL('image/png');
}

export function createUploadedAvatar(image:HTMLImageElement,removeBackground:boolean):{image:string;opaqueBackground:boolean} {
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw new Error('Your browser could not prepare this image.');
 const scale=Math.min(472/image.naturalWidth,472/image.naturalHeight);
 const width=Math.round(image.naturalWidth*scale),height=Math.round(image.naturalHeight*scale),left=Math.floor((512-width)/2),top=Math.floor((512-height)/2);
 context.imageSmoothingQuality='high';context.drawImage(image,left,top,width,height);
 const pixels=context.getImageData(0,0,512,512),data=pixels.data;
 const corners=[[left+1,top+1],[left+width-2,top+1],[left+1,top+height-2],[left+width-2,top+height-2]].map(([x,y])=>(y*512+x)*4);
 const opaqueBackground=corners.every(p=>data[p+3]>240);
 if(removeBackground&&opaqueBackground){
  const color=[0,1,2].map(c=>corners.reduce((sum,p)=>sum+data[p+c],0)/4);
  const flat=corners.every(p=>color.reduce((sum,v,c)=>sum+(v-data[p+c])**2,0)<2500);
  if(flat){const seen=new Uint8Array(512*512),queue:number[]=[];
   const add=(index:number)=>{if(seen[index])return;seen[index]=1;const p=index*4;const similar=data[p+3]<16||color.reduce((sum,v,c)=>sum+(v-data[p+c])**2,0)<1600;if(similar)queue.push(index)};
   for(let i=0;i<512;i++){add(i);add(511*512+i);add(i*512);add(i*512+511)}
   for(let i=0;i<queue.length;i++){const n=queue[i],x=n%512,y=Math.floor(n/512);data[n*4+3]=0;if(x>0)add(n-1);if(x<511)add(n+1);if(y>0)add(n-512);if(y<511)add(n+512)}
   context.putImageData(pixels,0,0);
  }
 }
 return {image:canvas.toDataURL('image/png'),opaqueBackground:opaqueBackground&&(!removeBackground||corners.some(p=>data[p+3]>240))};
}
