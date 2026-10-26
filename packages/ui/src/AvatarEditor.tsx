import React,{useEffect,useId,useRef,useState} from 'react';
import {Check,ShieldCheck,Trash2,Upload} from 'lucide-react';
import {DEFAULT_AVATAR,DEFAULT_UPLOAD_RIG,validateAvatar,type AvatarProfile,type UploadRig} from '@sipbuddy/core';
import {PersonalMascot} from './PersonalMascot';
import {UploadedMascot} from './UploadedMascot';
import {createPortrait,createUploadedAvatar,loadPhoto} from './photo-avatar';
const shirts=['#087f83','#7356a5','#cf7e52','#418ac4','#374957','#b85878'];
const skins=['#f1d4bd','#e5ba97','#d8a07b','#bb805b','#925e40','#644331'];
type Personal=Extract<AvatarProfile,{kind:'personal'}>;
type Uploaded=Extract<AvatarProfile,{kind:'uploaded'}>;
const fresh=()=>({...DEFAULT_AVATAR}) as Personal;
export function AvatarEditor({avatar,onSave}:{avatar:AvatarProfile;onSave:(avatar:AvatarProfile)=>Promise<unknown>}) {
 const id=useId();const [mode,setMode]=useState<'uploaded'|'photo'>(()=>avatar.kind==='personal'&&avatar.portrait?'photo':'uploaded');
 const [draft,setDraft]=useState<Personal>(()=>avatar.kind==='personal'?avatar:{...fresh(),name:avatar.kind==='uploaded'?avatar.name:'Buddy'});
 const [uploaded,setUploaded]=useState<Uploaded|null>(()=>avatar.kind==='uploaded'?avatar:null);
 const [source,setSource]=useState<HTMLImageElement|null>(null),[removeBg,setRemoveBg]=useState(false),[opaque,setOpaque]=useState(false);
 const [zoom,setZoom]=useState(1.2),[x,setX]=useState(50),[y,setY]=useState(35),[cartoon,setCartoon]=useState(true);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');const request=useRef(0);
 useEffect(()=>{if(avatar.kind==='personal')setDraft(avatar);if(avatar.kind==='uploaded')setUploaded(avatar)},[avatar]);
 useEffect(()=>()=>{request.current++},[]);
 useEffect(()=>{if(!source)return;const timer=setTimeout(()=>{try{
  if(mode==='photo'){const portrait=createPortrait(source,{zoom,x,y,cartoon});setDraft(d=>({...d,portrait}))}
  else{const result=createUploadedAvatar(source,removeBg);setOpaque(result.opaqueBackground);setUploaded(p=>({...p!,kind:'uploaded',image:result.image,name:p?.name||draft.name,motion:p?.motion||'walk',rig:p?.rig||{...DEFAULT_UPLOAD_RIG}}))}
  setError('');
 }catch(e){setError(e instanceof Error?e.message:'Could not prepare image')}},75);return ()=>clearTimeout(timer)},[source,mode,removeBg,zoom,x,y,cartoon]);
 async function upload(file?:File){if(!file)return;const current=++request.current;setError('');setNotice('');setLoading(true);try{
  const image=await loadPhoto(file);if(current!==request.current)return;
  if(mode==='uploaded'){const result=createUploadedAvatar(image,removeBg);setOpaque(result.opaqueBackground);setUploaded({kind:'uploaded',image:result.image,name:draft.name,motion:'walk',rig:{...DEFAULT_UPLOAD_RIG}})}
  else{const portrait=createPortrait(image,{zoom:1.2,x:50,y:35,cartoon});setDraft(d=>({...d,portrait}));setZoom(1.2);setX(50);setY(35)}
  setSource(image);
 }catch(e){if(current===request.current)setError(e instanceof Error?e.message:'Could not load image')}finally{if(current===request.current)setLoading(false)}}
 async function save(profile:AvatarProfile){setBusy(true);setError('');setNotice('');try{await onSave(validateAvatar(profile));setNotice(profile.kind==='original'?'Original demo avatar selected.':'Your avatar is saved on this device. Future walks use your buddy.')}catch(e){setError(e instanceof Error?e.message:'Could not save avatar')}finally{setBusy(false)}}
 function apply(){try{
  if(mode==='uploaded'){if(!uploaded){setError('Choose your avatar image first.');return}const result=source?createUploadedAvatar(source,removeBg):null;const next={...uploaded,name:draft.name,image:result?.image??uploaded.image};setUploaded(next);void save(next)}
  else{const next=source?{...draft,portrait:createPortrait(source,{zoom,x,y,cartoon})}:draft;setDraft(next);void save(next)}
 }catch(e){setError(e instanceof Error?e.message:'Could not save avatar')}}
 async function remove(){request.current++;setLoading(false);setSource(null);setUploaded(null);setOpaque(false);const next={...draft,portrait:null};setDraft(next);await save(next)}
 function changeMode(next:'uploaded'|'photo'){request.current++;setLoading(false);setSource(null);setMode(next);setError('');setNotice('')}
 function joint(key:keyof UploadRig,value:number){setUploaded(p=>p?{...p,rig:{...p.rig,[key]:value,...(key==='hipY'?{kneeY:Math.max(p.rig.kneeY,value+24)}:{})}}:p)}
 const hasImage=mode==='uploaded'?!!uploaded:!!draft.portrait;
 return <section className="avatar-studio" aria-label="Create your personal avatar">
  <div className="avatar-studio-heading"><div><p className="eyebrow">YOUR AVATAR. YOUR LITTLE SIDEKICK.</p><h2>Bring your own buddy.</h2><p>Upload your existing avatar image. SipBuddy uses your artwork, without AI redrawing.</p></div><span className="avatar-private"><ShieldCheck size={15}/> Never leaves your device</span></div>
  <div className="avatar-mode-tabs" role="group" aria-label="Avatar source"><button type="button" aria-pressed={mode==='uploaded'} disabled={busy||loading} onClick={()=>changeMode('uploaded')}>Upload existing avatar</button><button type="button" aria-pressed={mode==='photo'} disabled={busy||loading} onClick={()=>changeMode('photo')}>Private photo avatar</button></div>
  <div className="avatar-studio-grid"><div className="avatar-live-preview"><div className="avatar-preview-orbit"/>{mode==='uploaded'&&uploaded?<UploadedMascot avatar={{...uploaded,name:draft.name}} height={240} walking/>:<PersonalMascot avatar={draft} height={240} walking/>}<span className="avatar-preview-label">{hasImage?'Preview your buddy before saving':'Your new buddy starts here'}</span></div>
   <div className="avatar-controls"><label className="avatar-upload" htmlFor={`${id}-image`}><Upload size={21}/><strong>{loading?'Preparing your image…':mode==='uploaded'?'Choose your avatar image':'Choose your photo'}</strong><span>PNG, JPEG, or WebP · up to 10 MB</span><input id={`${id}-image`} aria-label={mode==='uploaded'?'Upload your avatar image':'Upload your photo'} type="file" accept="image/png,image/jpeg,image/webp" disabled={loading||busy} onChange={e=>{void upload(e.target.files?.[0]);e.target.value=''}}/></label>
    {mode==='uploaded'?<>
     <p className="avatar-upload-help">Use a transparent, full-body PNG with both legs visible for walking. Choose float for portraits or other artwork. Proportions and existing transparency are preserved.</p>
     {source&&<label className="avatar-background-option"><input type="checkbox" checked={removeBg} onChange={e=>setRemoveBg(e.target.checked)}/> Remove a flat-color background</label>}
     {opaque&&<p className="avatar-background-warning" role="status">This image has a background. A transparent PNG gives a clean desktop overlay; flat-background removal is optional.</p>}
     {uploaded&&<><label className="avatar-name">Movement<select aria-label="Avatar movement" value={uploaded.motion} onChange={e=>setUploaded(p=>p?{...p,motion:e.target.value as 'walk'|'float'}:p)}><option value="walk">Walk — full-body avatar</option><option value="float">Float — portraits and other images</option></select></label>{uploaded.motion==='walk'&&<details className="avatar-joints"><summary>Adjust walking joints</summary><p>Line up the joints with your avatar. These settings change the animation, not your image.</p>{([['hipY','Hip height',256,390],['kneeY','Knee height',Math.max(320,uploaded.rig.hipY+24),480],['splitX','Middle between legs',180,330],['stance','Leg spacing',20,90]] as const).map(([key,label,min,max])=><label key={key}>{label}<input type="range" min={min} max={max} value={uploaded.rig[key]} onChange={e=>joint(key,+e.target.value)}/></label>)}</details>}</>}
    </>:<>
     {source&&<fieldset className="avatar-crop"><legend>Frame your face</legend><p>Keep your whole face and hair inside the preview.</p><label>Face zoom<input type="range" min="1" max="4" step="0.05" value={zoom} onChange={e=>setZoom(+e.target.value)}/></label><label>Left / right<input type="range" min="0" max="100" value={x} onChange={e=>setX(+e.target.value)}/></label><label>Up / down<input type="range" min="0" max="100" value={y} onChange={e=>setY(+e.target.value)}/></label><div className="avatar-style-buttons"><button type="button" aria-pressed={cartoon} onClick={()=>setCartoon(true)}>Cartoon portrait</button><button type="button" aria-pressed={!cartoon} onClick={()=>setCartoon(false)}>Natural photo</button></div></fieldset>}
     <div className="avatar-palettes"><fieldset><legend>Outfit color</legend><div>{shirts.map(color=><button type="button" key={color} style={{background:color}} aria-label={`Outfit ${color}`} aria-pressed={draft.shirtColor===color} onClick={()=>setDraft(d=>({...d,shirtColor:color}))}/>)}</div></fieldset><fieldset><legend>Skin tone</legend><div>{skins.map(color=><button type="button" key={color} style={{background:color}} aria-label={`Skin tone ${color}`} aria-pressed={draft.skinTone===color} onClick={()=>setDraft(d=>({...d,skinTone:color}))}/>)}</div></fieldset></div>
    </>}
    <label className="avatar-name">Buddy’s name<input maxLength={32} value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))}/></label>
   </div></div>
  <p className="avatar-method">No AI generation, image service, or credits needed. Your image is prepared and stored locally. Website choices stay in this browser; upload your avatar in the Windows app for real desktop reminders.</p>
  {error&&<p className="avatar-error" role="alert">{error}</p>}{notice&&<p className="avatar-success" role="status">{notice}</p>}
  <div className="avatar-studio-actions"><button className="button primary" disabled={busy||loading} onClick={apply}><Check size={16}/> {busy?'Saving…':'Use my avatar'}</button>{hasImage&&<button className="button subtle" disabled={busy||loading} onClick={()=>void remove()}><Trash2 size={15}/> {mode==='uploaded'?'Remove my avatar':'Remove my photo'}</button>}<button className="text-button" disabled={busy||loading} onClick={()=>void save({kind:'original'})}>Use original demo avatar</button></div>
 </section>;
}
