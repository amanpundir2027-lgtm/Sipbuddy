import React,{useEffect,useId,useState} from 'react';
import {DEFAULT_AVATAR,type AvatarProfile} from '@sipbuddy/core';
import {PersonalMascot} from './PersonalMascot';
type Uploaded=Extract<AvatarProfile,{kind:'uploaded'}>;
export function UploadedMascot({avatar,height=170,walking=false}:{avatar:Uploaded;height?:number;walking?:boolean}) {
 const id=`uploaded-${useId().replace(/[^a-zA-Z0-9]/g,'')}`;const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[avatar.image]);
 if(failed)return <PersonalMascot avatar={DEFAULT_AVATAR as Extract<AvatarProfile,{kind:'personal'}>} height={height} walking={walking}/>;
 const {hipY,kneeY,splitX,stance}=avatar.rig;const articulate=walking&&avatar.motion==='walk';const move=(s:string)=>articulate?s:undefined;
 return <svg viewBox="0 0 512 512" width={height} height={height} className={`uploaded-mascot ${walking?'walking-mascot':'mascot'}`} role="img" aria-label={`${avatar.name} — your uploaded avatar`} data-avatar-kind="uploaded">
  <defs><image id={`${id}-image`} data-uploaded-avatar="true" href={avatar.image} width="512" height="512" onError={()=>setFailed(true)}/>
   <clipPath id={`${id}-upper`}><rect width="512" height={hipY+12}/></clipPath>
   <clipPath id={`${id}-thigh`}><rect y={hipY} width="512" height={kneeY-hipY+5}/></clipPath>
   <clipPath id={`${id}-shin`}><rect y={kneeY} width="512" height={512-kneeY}/></clipPath>
   <clipPath id={`${id}-rear`}><rect y={hipY} width={splitX} height={512-hipY}/></clipPath>
   <clipPath id={`${id}-front`}><rect x={splitX} y={hipY} width={512-splitX} height={512-hipY}/></clipPath>
  </defs>
  {!articulate?<use href={`#${id}-image`} className={walking?'uploaded-float':undefined}/>:<g className={move('gait-body')} style={{transformOrigin:`${splitX}px ${hipY}px`}}>
   {(['rear','front'] as const).map(leg=>{const hipX=splitX+(leg==='rear'?-stance:stance);return <g key={leg} className={move(`gait-leg gait-leg-${leg}`)} style={{transformOrigin:`${hipX}px ${hipY}px`}}>
    <g clipPath={`url(#${id}-thigh)`}><use href={`#${id}-image`} clipPath={`url(#${id}-${leg})`}/></g>
    <g className={move(`gait-knee gait-knee-${leg}`)} style={{transformOrigin:`${hipX}px ${kneeY}px`}}><g clipPath={`url(#${id}-shin)`}><use href={`#${id}-image`} clipPath={`url(#${id}-${leg})`}/></g></g>
   </g>})}
   <use href={`#${id}-image`} clipPath={`url(#${id}-upper)`}/>
  </g>}
 </svg>;
}
