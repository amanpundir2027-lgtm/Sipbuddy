import React,{useCallback,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {UpdatePanel} from './UpdatePanel';
import {Dashboard,Walk} from '@sipbuddy/ui';
import type {DesktopNavigation,Monitor,State,WalkData} from '@sipbuddy/core';
import '@sipbuddy/ui/styles.css';
function Overlay(){const [data,setData]=useState<WalkData|null>(null);useEffect(()=>window.sipbuddy?.onWalk(setData),[]);const done=useCallback(()=>window.sipbuddy?.walkDone(),[]);return data?<Walk data={data} onDone={done}/>:null}
function App(){const [navigation,setNavigation]=useState<DesktopNavigation|null>(null);useEffect(()=>{const api=window.sipbuddy;if(!api)return;const off=api.onNavigate(setNavigation);api.getNavigation().then(setNavigation);return off},[]);const [state,setState]=useState<State|null>(null);const [monitors,setMonitors]=useState<Monitor[]>([]);const [error,setError]=useState('');useEffect(()=>{const api=window.sipbuddy;if(!api){setError('Open this dashboard from the SipBuddy desktop app.');return}api.getState().then(setState).catch(e=>setError(String(e)));api.monitors().then(setMonitors).catch(e=>setError(String(e)));return api.subscribe(setState)},[]);return state?<Dashboard navigation={navigation} updates={<UpdatePanel/>} state={state} monitors={monitors} onCommand={async c=>{const s=await window.sipbuddy!.command(c);setState(s)}}/>:<p className="loading">{error||'Getting your little corner ready…'}</p>}
const overlay=new URLSearchParams(location.search).has('overlay');if(overlay)document.documentElement.classList.add('overlay-page');
createRoot(document.getElementById('root')!).render(overlay?<Overlay/>:<App/>);
