export type AvatarProfile =
 | {kind:'original'}
 | {kind:'personal';portrait:string|null;name:string;shirtColor:string;skinTone:string};
export const DEFAULT_AVATAR:AvatarProfile={kind:'personal',portrait:null,name:'Buddy',shirtColor:'#087f83',skinTone:'#d8a07b'};
export function validateAvatar(input:unknown):AvatarProfile {
 if(!input||typeof input!=='object')throw new Error('Invalid avatar');
 const a=input as Record<string,unknown>;
 if(a.kind==='original')return {kind:'original'};
 if(a.kind!=='personal')throw new Error('Invalid avatar type');
 if(typeof a.name!=='string'||!a.name.trim()||a.name.trim().length>32)throw new Error('Give your buddy a name of 1–32 characters');
 for(const key of ['shirtColor','skinTone'])if(typeof a[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(a[key] as string))throw new Error('Invalid avatar color');
 if(a.portrait!==null&&(typeof a.portrait!=='string'||a.portrait.length>500000||!/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(a.portrait)))throw new Error('Use a processed PNG portrait smaller than 375 kB');
 if(typeof a.portrait==='string'){
  let header:string;try{header=atob(a.portrait.slice(22,66))}catch{throw new Error('Invalid PNG portrait')}
  const dimension=(offset:number)=>[0,1,2,3].reduce((n,i)=>n*256+(header.charCodeAt(offset+i)||0),0);
  if(header.length<24||dimension(16)<1||dimension(20)<1||dimension(16)>512||dimension(20)>512)throw new Error('Portrait must be at most 512 × 512 pixels');
 }
 return {kind:'personal',portrait:a.portrait as string|null,name:a.name.trim(),shirtColor:a.shirtColor as string,skinTone:a.skinTone as string};
}
