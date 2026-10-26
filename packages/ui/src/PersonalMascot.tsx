import React,{useEffect,useId,useState} from 'react';
import type {AvatarProfile} from '@sipbuddy/core';

type Personal = Extract<AvatarProfile,{kind:'personal'}>;
export function PersonalMascot({avatar,height=170,walking=false}:{avatar:Personal;height?:number;walking?:boolean}) {
 const id=`personal-${useId().replace(/[^a-zA-Z0-9]/g,'')}`;
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[avatar.portrait]);
 const moving=(name:string)=>walking?name:undefined;
 const portrait=avatar.portrait&&!failed;
 return <svg viewBox="0 0 260 360" width={height*260/360} height={height}
  className={`personal-mascot ${walking?'walking-mascot':'mascot'}`} role="img" aria-label={`${avatar.name} — your personal hydration avatar`} data-avatar-kind="personal">
  <defs>
   <clipPath id={`${id}-face`}><ellipse cx="130" cy="96" rx="57" ry="65"/></clipPath>
   <linearGradient id={`${id}-shirt`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={avatar.shirtColor}/><stop offset="1" stopColor={avatar.shirtColor} stopOpacity=".78"/></linearGradient>
   <radialGradient id={`${id}-shadow`}><stop stopColor="#234b45" stopOpacity=".2"/><stop offset="1" stopColor="#234b45" stopOpacity="0"/></radialGradient>
  </defs>
  <ellipse className={moving('gait-shadow')} cx="130" cy="345" rx="67" ry="9" fill={`url(#${id}-shadow)`}/>
  <g className={moving('gait-body')}>
   <g className={moving('gait-leg gait-leg-rear')} style={{transformOrigin:'110px 238px'}}>
    <path d="M94 231Q111 225 125 239L122 287H96Z" fill="#344753" stroke="#263b47" strokeWidth="3"/>
    <g className={moving('gait-knee gait-knee-rear')} style={{transformOrigin:'109px 281px'}}>
     <path d="M97 276H121L116 323H92Z" fill="#344753" stroke="#263b47" strokeWidth="3"/>
     <path d="M94 316Q106 321 117 315L122 332Q116 341 82 337Q77 327 94 316Z" fill="#fcfaf1" stroke="#405663" strokeWidth="3"/>
     <path d="M83 333H120M98 322L110 324" stroke="#b7d0cd" strokeWidth="3" strokeLinecap="round"/>
    </g>
   </g>
   <g className={moving('gait-leg gait-leg-front')} style={{transformOrigin:'146px 238px'}}>
    <path d="M130 233Q147 226 161 236L167 286H140Z" fill="#3d5360" stroke="#263b47" strokeWidth="3"/>
    <g className={moving('gait-knee gait-knee-front')} style={{transformOrigin:'153px 281px'}}>
     <path d="M140 277H165L170 322H145Z" fill="#3d5360" stroke="#263b47" strokeWidth="3"/>
     <path d="M144 317Q157 322 168 316Q186 328 182 337Q157 344 140 335Z" fill="#fcfaf1" stroke="#405663" strokeWidth="3"/>
     <path d="M143 334H180M151 324L165 322" stroke="#b7d0cd" strokeWidth="3" strokeLinecap="round"/>
    </g>
   </g>
   <path d="M90 181Q68 181 66 209L62 242Q66 254 77 247L89 215" fill={avatar.skinTone} stroke="#805f50" strokeWidth="3"/>
   <path d="M89 170Q129 157 170 174L179 205L162 213L163 242Q130 254 92 241L94 207L77 207L78 184Z" fill={`url(#${id}-shirt)`} stroke="#275a5b" strokeWidth="3" strokeLinejoin="round"/>
   <path d="M113 166L130 181L148 166M102 235Q132 242 158 236" stroke="#ffffff" strokeOpacity=".35" strokeWidth="3" fill="none"/>
   <path d="M171 195L184 225L204 211Q216 212 212 222L185 244Q176 248 171 238L159 207" fill={avatar.skinTone} stroke="#805f50" strokeWidth="3" strokeLinejoin="round"/>
   <g transform="rotate(12 206 204)">
    <rect x="197" y="178" width="22" height="48" rx="7" fill="#d5f6f7" fillOpacity=".9" stroke="#4f9da4" strokeWidth="2.5"/>
    <path d="M199 202Q207 199 217 202V218Q206 225 199 218Z" fill="#72cbd6" fillOpacity=".6"/>
    <rect x="201" y="172" width="15" height="8" rx="3" fill="#547e84"/>
    <path d="M202 185V197" stroke="white" strokeWidth="3" strokeLinecap="round"/>
   </g>
   <path d="M118 145V168Q129 181 143 168V145" fill={avatar.skinTone} stroke="#805f50" strokeWidth="3"/>
   <ellipse cx="130" cy="96" rx="61" ry="69" fill={avatar.skinTone} stroke="#76574c" strokeWidth="3"/>
   {portrait?<image href={avatar.portrait!} x="73" y="31" width="114" height="130" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}-face)`} onError={()=>setFailed(true)} data-personal-portrait="true"/>:<>
    <path d="M71 83Q61 20 108 28Q154 4 180 47L189 86L173 61Q131 84 90 59Z" fill="#35454b"/>
    <path d="M98 102Q105 93 113 102M148 102Q155 93 162 102" fill="none" stroke="#35454b" strokeWidth="5" strokeLinecap="round"/>
    <path d="M116 126Q130 139 145 126" fill="none" stroke="#76574c" strokeWidth="4" strokeLinecap="round"/>
    <ellipse cx="98" cy="117" rx="10" ry="5" fill="#e79284" opacity=".45"/><ellipse cx="163" cy="117" rx="10" ry="5" fill="#e79284" opacity=".45"/>
   </>}
  </g>
 </svg>;
}
