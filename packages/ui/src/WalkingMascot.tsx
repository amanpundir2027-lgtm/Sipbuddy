import React, {useId, useState, type CSSProperties} from 'react';
import {DEFAULT_AVATAR,type AvatarProfile} from '@sipbuddy/core';
import {PersonalMascot} from './PersonalMascot';

// The supplied PNG is a square canvas. These masks follow its pants and shoes;
// every visible body part still comes from that original, unmodified image.
const legs = [
  {name: 'rear', hip: '570px 815px', knee: '563px 1005px',
    outline: '488,782 644,791 641,910 626,1000 617,1108 638,1160 617,1201 433,1205 426,1167 471,1100 488,966'},
  {name: 'front', hip: '695px 815px', knee: '731px 1010px',
    outline: '640,788 751,786 785,933 805,1085 850,1128 895,1180 899,1230 720,1230 690,1180 665,1086 649,1008 635,940 638,856'},
] as const;

export function WalkingMascot({height,avatar=DEFAULT_AVATAR}: {height:number;avatar?:AvatarProfile}) {
 return avatar.kind==='personal'?<PersonalMascot height={height} avatar={avatar} walking/>:<OriginalWalkingMascot height={height}/>;
}
function OriginalWalkingMascot({height}: {height: number}) {
  const id = `gait-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="walking-asset-error" role="status">Your avatar couldn’t load.</span>;

  return <svg className="walking-mascot" viewBox="0 0 1254 1254"
    width={height} height={height} role="img" aria-label="Aman walking with alternating steps">
    <defs>
      <image id={`${id}-original`} href="./aman-water-chibi.png" width="1254" height="1254"
        onError={() => setFailed(true)}/>
      <clipPath id={`${id}-upper`}><path d="M0 0H1254V850H0Z"/></clipPath>
      <linearGradient id={`${id}-waist-fade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.975" stopColor="white"/><stop offset="1" stopColor="black"/>
      </linearGradient>
      <mask id={`${id}-waist`}><rect width="1254" height="850" fill={`url(#${id}-waist-fade)`}/></mask>
      {legs.map(leg => <React.Fragment key={leg.name}>
        <clipPath id={`${id}-${leg.name}`}><polygon points={leg.outline}/></clipPath>
        <clipPath id={`${id}-${leg.name}-thigh`}><rect width="1254" height="1020"/></clipPath>
        <clipPath id={`${id}-${leg.name}-shin`}><rect y="995" width="1254" height="259"/></clipPath>
      </React.Fragment>)}
      <radialGradient id={`${id}-shadow`}><stop stopColor="#244d40" stopOpacity="0.2"/>
        <stop offset="1" stopColor="#244d40" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse className="gait-shadow" cx="653" cy="1228" rx="235" ry="27" fill={`url(#${id}-shadow)`}/>
    <g className="gait-body">
      {legs.map(leg => <g key={leg.name} className={`gait-leg gait-leg-${leg.name}`}
        data-leg={leg.name} style={{transformOrigin: leg.hip} as CSSProperties}>
        <g clipPath={`url(#${id}-${leg.name}-thigh)`}>
          <use href={`#${id}-original`} clipPath={`url(#${id}-${leg.name})`}/>
        </g>
        <g className={`gait-knee gait-knee-${leg.name}`} style={{transformOrigin: leg.knee} as CSSProperties}>
          <g clipPath={`url(#${id}-${leg.name}-shin)`}>
            <use href={`#${id}-original`} clipPath={`url(#${id}-${leg.name})`}/>
          </g>
        </g>
      </g>)}
      <g clipPath={`url(#${id}-upper)`} mask={`url(#${id}-waist)`}>
        <use href={`#${id}-original`}/>
      </g>
    </g>
  </svg>;
}
