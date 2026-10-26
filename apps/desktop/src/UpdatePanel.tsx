import React,{useEffect,useState} from 'react';
import type {UpdateState} from '@sipbuddy/core';

export function UpdatePanel(){
 const [state,setState]=useState<UpdateState|null>(null);
 useEffect(()=>{const api=window.sipbuddy!;let active=true;const off=api.onUpdate(s=>{if(active)setState(s)});api.getUpdateState().then(s=>{if(active)setState(s)});return()=>{active=false;off()}},[]);
 if(!state)return null;
 const messages={idle:'Checks for new releases at startup and every six hours.',disabled:'Update checks are available in the installed Windows app.',checking:'Checking for a new release…',current:'You have the latest version.',available:`Version ${state.version} is ready to download.`,downloading:`Downloading… ${state.percent??0}%`,downloaded:`Version ${state.version} is ready. Restart when convenient.`,installing:'Restarting to install…',error:state.message};
 return <section className="card app-updates" aria-label="App updates"><div><h2>SipBuddy updates</h2><p>Installed version {state.currentVersion}</p><p role="status">{messages[state.status]}</p><small>Your avatar, preferences and water history stay on this computer when you update.</small></div><div className="update-actions">
 {['idle','current','error'].includes(state.status)&&<button className="button subtle" onClick={()=>void window.sipbuddy!.checkForUpdates().then(setState)}>Check for updates</button>}
 {state.status==='available'&&<button className="button primary" onClick={()=>void window.sipbuddy!.downloadUpdate().then(setState)}>Download update</button>}
 {state.status==='downloaded'&&<button className="button primary" onClick={()=>void window.sipbuddy!.installUpdate().then(setState)}>Restart and install</button>}
 {state.status==='downloading'&&<progress aria-label="Update download" max="100" value={state.percent??0}/>}
 <a href="https://github.com/amanpundir2027-lgtm/Sipbuddy/releases/latest" onClick={e=>{e.preventDefault();void window.sipbuddy!.openReleases()}}>Latest release &amp; manual installer</a>
 </div></section>;
}
