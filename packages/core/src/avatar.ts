export interface UploadRig {hipY:number;kneeY:number;splitX:number;stance:number}
export type AvatarProfile =
 | {kind:'original'}
 | {kind:'uploaded';image:string;name:string;motion:'walk'|'float';rig:UploadRig}
 | {kind:'personal';portrait:string|null;name:string;shirtColor:string;skinTone:string};
export const DEFAULT_AVATAR:AvatarProfile={kind:'personal',portrait:null,name:'Buddy',shirtColor:'#087f83',skinTone:'#d8a07b'};
export const DEFAULT_UPLOAD_RIG:UploadRig={hipY:338,kneeY:420,splitX:256,stance:42};
function png(value:unknown,maxLength:number):string {
 if(typeof value!=='string'||value.length>maxLength||!/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(value))throw new Error('Use a valid processed PNG image.');
 let header:string;try{header=atob(value.slice(22,66))}catch{throw new Error('Invalid PNG image')}
 const dimension=(offset:number)=>[0,1,2,3].reduce((n,i)=>n*256+(header.charCodeAt(offset+i)||0),0);
 if(header.length<24||dimension(16)<1||dimension(20)<1||dimension(16)>512||dimension(20)>512)throw new Error('Image must be at most 512 × 512 pixels');
 return value;
}
export function validateAvatar(input:unknown):AvatarProfile {
 if(!input||typeof input!=='object')throw new Error('Invalid avatar');
 const a=input as Record<string,unknown>;
 if(a.kind==='original')return {kind:'original'};
 if(typeof a.name!=='string'||!a.name.trim()||a.name.trim().length>32)throw new Error('Give your buddy a name of 1–32 characters');
 if(a.kind==='uploaded'){
  const image=png(a.image,2000000),rig=a.rig as Record<string,unknown>;
  if(a.motion!=='walk'&&a.motion!=='float')throw new Error('Choose walk or float movement');
  if(!rig||typeof rig!=='object')throw new Error('Invalid walking joints');
  for(const [key,min,max] of [['hipY',256,390],['kneeY',320,480],['splitX',180,330],['stance',20,90]] as const)if(typeof rig[key]!=='number'||!Number.isFinite(rig[key])||(rig[key] as number)<min||(rig[key] as number)>max)throw new Error('Invalid walking joints');
  if((rig.kneeY as number)<(rig.hipY as number)+24)throw new Error('Knees must be below hips');
  return {kind:'uploaded',image,name:a.name.trim(),motion:a.motion,rig:{hipY:rig.hipY as number,kneeY:rig.kneeY as number,splitX:rig.splitX as number,stance:rig.stance as number}};
 }
 if(a.kind!=='personal')throw new Error('Invalid avatar type');
 for(const key of ['shirtColor','skinTone'])if(typeof a[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(a[key] as string))throw new Error('Invalid avatar color');
 return {kind:'personal',portrait:a.portrait===null?null:png(a.portrait,500000),name:a.name.trim(),shirtColor:a.shirtColor as string,skinTone:a.skinTone as string};
}
