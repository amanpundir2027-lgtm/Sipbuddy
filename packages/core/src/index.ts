import {DEFAULT_AVATAR,validateAvatar,type AvatarProfile} from './avatar';
export {DEFAULT_AVATAR,DEFAULT_UPLOAD_RIG,validateAvatar,type AvatarProfile,type UploadRig} from './avatar';
export const MESSAGES = {
  Hinglish: ['Oye, paani pee le! 💧','Ek sip toh banta hai!','Chal, ek water break ho jaye!','Hydration break, boss!'],
  English: ['Your water bottle misses you.','Paani > another coffee!','CEO of dehydration? Not today.',"You've been working hard. Time for water!"],
  Hindi: ['थोड़ा पानी पी लो! 💧','चलो, पानी का ब्रेक हो जाए!','एक घूंट तो बनता है!']
};
export type Language = keyof typeof MESSAGES;
export interface Settings {
  avatar:AvatarProfile; intervalMinutes:number; paused:boolean; quietEnabled:boolean; quietStart:string; quietEnd:string;
  startAtLogin:boolean; startMinimized:boolean; sound:boolean; durationSeconds:number; size:number;
  bottomOffset:number; monitor:string; language:Language; messages:string[]; dailyGoal:number;
}
export interface WaterEntry {id:string; at:number; ml:number}
export interface State {version:1; settings:Settings; water:WaterEntry[]; reminders:number[]; nextReminderAt:number; lastMessage:string}
export const DEFAULT_SETTINGS:Settings = {avatar:DEFAULT_AVATAR,intervalMinutes:30,paused:false,quietEnabled:true,quietStart:'22:00',quietEnd:'08:00',startAtLogin:false,startMinimized:true,sound:false,durationSeconds:23,size:170,bottomOffset:24,monitor:'primary',language:'Hinglish',messages:[...MESSAGES.Hinglish],dailyGoal:2000};
export function initialState(now=Date.now()):State{return {version:1,settings:{...DEFAULT_SETTINGS,avatar:{...DEFAULT_AVATAR},messages:[...DEFAULT_SETTINGS.messages]},water:[],reminders:[],nextReminderAt:now+30*60000,lastMessage:''}}
export function localDate(at:number):string { const d=new Date(at);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function dailyTotal(water:WaterEntry[],at=Date.now()):number{return water.filter(e=>localDate(e.at)===localDate(at)).reduce((n,e)=>n+e.ml,0)}
export function weekHistory(water:WaterEntry[],now=Date.now()){return Array.from({length:7},(_,i)=>{const d=new Date(now);d.setDate(d.getDate()-6+i);return {date:localDate(d.getTime()),label:d.toLocaleDateString(undefined,{weekday:'short'}),ml:dailyTotal(water,d.getTime())}})}
export function streak(water:WaterEntry[],goal:number,now=Date.now()):number {const d=new Date(now);if(dailyTotal(water,now)<goal)d.setDate(d.getDate()-1);let count=0;while(count<3660&&dailyTotal(water,d.getTime())>=goal){count++;d.setDate(d.getDate()-1)}return count}
export function inQuietHours(s:Settings,at:number):boolean {if(!s.quietEnabled)return false;const d=new Date(at),m=d.getHours()*60+d.getMinutes();const toMinute=(v:string)=>Number(v.slice(0,2))*60+Number(v.slice(3));const a=toMinute(s.quietStart),b=toMinute(s.quietEnd);return a===b|| (a<b ? m>=a&&m<b : m>=a||m<b)}
export function nextDue(s:Settings,now:number,minutes=s.intervalMinutes):number{return now+minutes*60000}
export function shouldRemind(state:State,now:number,blocked=false):boolean{return !blocked&&!state.settings.paused&&!inQuietHours(state.settings,now)&&now>=state.nextReminderAt}
export function chooseMessage(pool:string[],previous:string,random=Math.random):string {const options=pool.filter(s=>s!==previous);const choices=options.length?options:pool;return choices[Math.floor(random()*choices.length)]??MESSAGES.Hinglish[0]}
const numberIn=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
export function validateSettings(input:unknown):Settings {
 if(!input||typeof input!=='object')throw new Error('Invalid settings');const s=input as Settings;
 for(const [key,min,max] of [['intervalMinutes',1,1440],['durationSeconds',10,60],['size',100,250],['bottomOffset',0,1600],['dailyGoal',100,10000]] as const)if(!numberIn(s[key],min,max))throw new Error(`Invalid ${key}`);
 for(const key of ['paused','quietEnabled','startAtLogin','startMinimized','sound'] as const)if(typeof s[key]!=='boolean')throw new Error(`Invalid ${key}`);
 for(const key of ['quietStart','quietEnd'] as const)if(typeof s[key]!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(s[key]))throw new Error(`Invalid ${key}`);
 if(!['Hinglish','English','Hindi'].includes(s.language))throw new Error('Invalid language');
 if(typeof s.monitor!=='string'||s.monitor.length>64)throw new Error('Invalid monitor');
 if(!Array.isArray(s.messages)||s.messages.length<1||s.messages.length>30||s.messages.some(m=>typeof m!=='string'||!m.trim()||m.length>180))throw new Error('Use 1–30 messages, up to 180 characters each');
 return {...Object.fromEntries(Object.keys(DEFAULT_SETTINGS).map(k=>[k,s[k as keyof Settings]])),avatar:validateAvatar(s.avatar??{kind:'original'})} as unknown as Settings;
}
export function parseState(raw:string,now=Date.now()):State {
 const v=JSON.parse(raw) as State;if(v.version!==1)throw new Error('Unsupported state version');const settings=validateSettings(v.settings);
 if(!Array.isArray(v.water)||v.water.some(e=>!e||typeof e.id!=='string'||!numberIn(e.at,0,1e15)||!numberIn(e.ml,1,5000)))throw new Error('Invalid water history');
 if(!Array.isArray(v.reminders)||v.reminders.some(t=>!numberIn(t,0,1e15))||!numberIn(v.nextReminderAt,0,1e15)||typeof v.lastMessage!=='string')throw new Error('Invalid reminder state');
 // Restart never catches up missed reminders. Future snoozes survive restart.
 return {...v,settings,nextReminderAt:v.nextReminderAt<=now?nextDue(settings,now):v.nextReminderAt};
}
export type Command = {type:'avatar';avatar:AvatarProfile}|{type:'settings';settings:Settings}|{type:'log';ml:number}|{type:'pause'}|{type:'resume'}|{type:'snooze';minutes:number}|{type:'test'};
export function applyCommand(state:State,input:unknown,now=Date.now()):State {
 if(!input||typeof input!=='object')throw new Error('Invalid command');const c=input as Command;
 switch(c.type){
 case 'avatar':return {...state,settings:{...state.settings,avatar:validateAvatar(c.avatar)}};
 case 'settings':{const settings=validateSettings(c.settings);return {...state,settings,nextReminderAt:nextDue(settings,now)}}
 case 'log':if(!numberIn(c.ml,1,5000))throw new Error('Choose 1–5000 mL');return {...state,water:[...state.water,{id:crypto.randomUUID(),at:now,ml:c.ml}]};
 case 'pause':return {...state,settings:{...state.settings,paused:true}};
 case 'resume':return {...state,settings:{...state.settings,paused:false},nextReminderAt:nextDue(state.settings,now)};
 case 'snooze':if(![10,15,30,60].includes(c.minutes))throw new Error('Invalid snooze');return {...state,nextReminderAt:nextDue(state.settings,now,c.minutes)};
 case 'test':return state;
 default:throw new Error('Unknown command');
 }
}
export interface Monitor {id:string;name:string}
export interface DesktopAPI {getState:()=>Promise<State>;command:(command:Command)=>Promise<State>;monitors:()=>Promise<Monitor[]>;subscribe:(listener:(state:State)=>void)=>()=>void;onWalk:(listener:(data:WalkData)=>void)=>()=>void;walkDone:()=>void}
export interface WalkData {avatar?:AvatarProfile;durationSeconds:number;size:number;bottomOffset:number;message:string;sound:boolean}
declare global {interface Window {sipbuddy?:DesktopAPI}}

export function advanceScheduler(state:State,now:number,lastTick:number,blocked=false):{state:State;remind:boolean} {
 const drift=now-lastTick;
 if(drift>90000||drift<0)return {state:{...state,nextReminderAt:nextDue(state.settings,now)},remind:false};
 if(shouldRemind(state,now,blocked))return {state,remind:true};
 if(now>=state.nextReminderAt)return {state:{...state,nextReminderAt:nextDue(state.settings,now)},remind:false};
 return {state,remind:false};
}
