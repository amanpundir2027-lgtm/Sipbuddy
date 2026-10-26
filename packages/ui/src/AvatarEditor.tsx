import React,{useEffect,useId,useRef,useState} from 'react';
import {Check,ShieldCheck,Trash2,Upload} from 'lucide-react';
import {DEFAULT_AVATAR,validateAvatar,type AvatarProfile} from '@sipbuddy/core';
import {PersonalMascot} from './PersonalMascot';
import {createPortrait,loadPhoto} from './photo-avatar';

const shirts=['#087f83','#7356a5','#cf7e52','#418ac4','#374957','#b85878'];
const skins=['#f1d4bd','#e5ba97','#d8a07b','#bb805b','#925e40','#644331'];
type Personal=Extract<AvatarProfile,{kind:'personal'}>;
const fresh=()=>({...DEFAULT_AVATAR}) as Personal;
export function AvatarEditor({avatar,onSave}:{avatar:AvatarProfile;onSave:(avatar:AvatarProfile)=>Promise<unknown>}) {
 const id=useId();const [draft,setDraft]=useState<Personal>(()=>avatar.kind==='personal'?avatar:fresh());
 const [source,setSource]=useState<HTMLImageElement|null>(null);const [zoom,setZoom]=useState(1.2);const [x,setX]=useState(50);const [y,setY]=useState(35);const [cartoon,setCartoon]=useState(true);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');const request=useRef(0);
 useEffect(()=>{if(avatar.kind==='personal')setDraft(avatar)},[avatar]);
 useEffect(()=>()=>{request.current++},[]);
 useEffect(()=>{if(!source)return;const timer=setTimeout(()=>{try{const portrait=createPortrait(source,{zoom,x,y,cartoon});setDraft(d=>({...d,portrait}));setError('')}catch(e){setError(e instanceof Error?e.message:'Could not process photo')}},75);return ()=>clearTimeout(timer)},[source,zoom,x,y,cartoon]);
 async function upload(file?:File){if(!file)return;const current=++request.current;setError('');setNotice('');setLoading(true);try{const image=await loadPhoto(file);if(current!==request.current)return;const crop={zoom:1.2,x:50,y:35,cartoon};const portrait=createPortrait(image,crop);setSource(image);setZoom(crop.zoom);setX(crop.x);setY(crop.y);setDraft(d=>({...d,portrait}));}catch(e){if(current===request.current)setError(e instanceof Error?e.message:'Could not load photo')}finally{if(current===request.current)setLoading(false)}}
 async function save(profile:AvatarProfile){setBusy(true);setError('');setNotice('');try{await onSave(validateAvatar(profile));setNotice(profile.kind==='original'?'Original demo avatar selected.':'Your avatar is saved on this device. Future walks use your buddy.')}catch(e){setError(e instanceof Error?e.message:'Could not save avatar')}finally{setBusy(false)}}
 async function remove(){request.current++;setLoading(false);setSource(null);const next={...draft,portrait:null};setDraft(next);await save(next)}
 return <section className="avatar-studio" aria-label="Create your personal avatar">
  <div className="avatar-studio-heading"><div><p className="eyebrow">YOUR PHOTO. YOUR LITTLE SIDEKICK.</p><h2>A buddy that looks like you.</h2><p>Turn a face photo into a stylized photo avatar with an animated cartoon body.</p></div><span className="avatar-private"><ShieldCheck size={15}/> Stays on this device</span></div>
  <div className="avatar-studio-grid"><div className="avatar-live-preview"><div className="avatar-preview-orbit"/><PersonalMascot avatar={draft} height={240} walking/><span className="avatar-preview-label">{draft.portrait?'Your personal buddy':'Your new buddy starts here'}</span></div>
   <div className="avatar-controls"><label className="avatar-upload" htmlFor={`${id}-photo`}><Upload size={21}/><strong>{loading?'Preparing your photo…':'Choose your photo'}</strong><span>PNG, JPEG, or WebP · up to 10 MB</span><input id={`${id}-photo`} aria-label="Upload your photo" type="file" accept="image/png,image/jpeg,image/webp" disabled={loading||busy} onChange={e=>{void upload(e.target.files?.[0]);e.target.value=''}}/></label>
    {source&&<fieldset className="avatar-crop"><legend>Frame your face</legend><p>Keep your whole face and hair inside the preview. Adjust the crop until it feels like you.</p><label>Face zoom<input type="range" min="1" max="4" step="0.05" value={zoom} onChange={e=>setZoom(+e.target.value)}/></label><label>Left / right<input type="range" min="0" max="100" value={x} onChange={e=>setX(+e.target.value)}/></label><label>Up / down<input type="range" min="0" max="100" value={y} onChange={e=>setY(+e.target.value)}/></label><div className="avatar-style-buttons"><button type="button" aria-pressed={cartoon} onClick={()=>setCartoon(true)}>Cartoon portrait</button><button type="button" aria-pressed={!cartoon} onClick={()=>setCartoon(false)}>Natural photo</button></div></fieldset>}
    <label className="avatar-name">Buddy’s name<input maxLength={32} value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))}/></label>
    <div className="avatar-palettes"><fieldset><legend>Outfit color</legend><div>{shirts.map(color=><button type="button" key={color} style={{background:color}} aria-label={`Outfit ${color}`} aria-pressed={draft.shirtColor===color} onClick={()=>setDraft(d=>({...d,shirtColor:color}))}/>)}</div></fieldset><fieldset><legend>Skin tone</legend><div>{skins.map(color=><button type="button" key={color} style={{background:color}} aria-label={`Skin tone ${color}`} aria-pressed={draft.skinTone===color} onClick={()=>setDraft(d=>({...d,skinTone:color}))}/>)}</div></fieldset></div>
   </div></div>
  <p className="avatar-method">A photo-based avatar with a cartoon color treatment. Only the cropped avatar is stored; your original photo is never uploaded. Website choices stay in this browser; choose your photo in the Windows app for desktop reminders.</p>
  {error&&<p className="avatar-error" role="alert">{error}</p>}{notice&&<p className="avatar-success" role="status">{notice}</p>}
  <div className="avatar-studio-actions"><button className="button primary" disabled={busy||loading} onClick={()=>{try{const next=source?{...draft,portrait:createPortrait(source,{zoom,x,y,cartoon})}:draft;setDraft(next);void save(next)}catch(e){setError(e instanceof Error?e.message:'Could not create avatar')}}}><Check size={16}/> {busy?'Saving…':'Use my avatar'}</button>{draft.portrait&&<button className="button subtle" disabled={busy||loading} onClick={()=>void remove()}><Trash2 size={15}/> Remove my photo</button>}<button className="text-button" disabled={busy||loading} onClick={()=>void save({kind:'original'})}>Use original demo avatar</button></div>
 </section>;
}
