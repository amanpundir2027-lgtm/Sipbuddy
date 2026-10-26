import {app,BrowserWindow,Tray,Menu,nativeImage,ipcMain,screen,powerMonitor,shell,session} from 'electron';
import type {IpcMainInvokeEvent,Display} from 'electron';
import path from 'node:path';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Store} from './store';
import {validateAvatar,advanceScheduler,applyCommand,chooseMessage,inQuietHours,nextDue,shouldRemind,type State,type WalkData} from '@sipbuddy/core';
app.setName('SipBuddy');
if(!app.isPackaged&&process.env.SIPBUDDY_TEST_DATA_DIR)app.setPath('userData',path.resolve(process.env.SIPBUDDY_TEST_DATA_DIR));
const dev=process.env.SIPBUDDY_DEV_URL==='http://localhost:5174'&&!app.isPackaged;
let dashboard:BrowserWindow|null=null,tray:Tray,store:Store,state:State,quitting=false,locked=false,suspended=false,lastTick=Date.now();
const overlays=new Map<number,{window:BrowserWindow;data:WalkData;timer:ReturnType<typeof setTimeout>}>();
let tickTimer:ReturnType<typeof setInterval>;
const preload=path.join(__dirname,'preload.cjs');
const renderer=path.join(__dirname,'../dist/index.html');
const resources=app.isPackaged?path.join(process.resourcesPath,'assets'):path.resolve(__dirname,'../../../assets');
function load(win:BrowserWindow,overlay=false){if(dev)void win.loadURL(`http://localhost:5174/${overlay?'?overlay=1':''}`);else void win.loadFile(renderer,{query:overlay?{overlay:'1'}:{}})}
function secure(win:BrowserWindow){win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',(e)=>e.preventDefault());win.webContents.on('will-attach-webview',e=>e.preventDefault())}
function openDashboard(){if(dashboard&&!dashboard.isDestroyed()){dashboard.show();dashboard.focus();return}
 dashboard=new BrowserWindow({width:1180,height:850,minWidth:760,minHeight:650,title:'SipBuddy',backgroundColor:'#f6f8f6',autoHideMenuBar:true,webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true}});
 secure(dashboard);load(dashboard);dashboard.on('close',e=>{if(!quitting){e.preventDefault();dashboard?.hide()}});dashboard.on('closed',()=>{dashboard=null});}
function publish(){store.save(state);if(dashboard&&!dashboard.isDestroyed())dashboard.webContents.send('state:changed',state);updateTray()}
function clearOverlays(){for(const o of overlays.values()){clearTimeout(o.timer);o.window.destroy()}overlays.clear()}
function startWalk(test=false){
 if(!test&&(locked||suspended||state.settings.paused||inQuietHours(state.settings,Date.now())))return;
 clearOverlays();const settings=state.settings;const message=chooseMessage(settings.messages,state.lastMessage);
 state={...state,lastMessage:message,...(!test?{reminders:[...state.reminders,Date.now()],nextReminderAt:nextDue(settings,Date.now())}:{})};publish();
 const displays=screen.getAllDisplays();const selected=settings.monitor==='all'?displays:[displays.find(d=>String(d.id)===settings.monitor)??screen.getPrimaryDisplay()];
 for(const display of selected)createOverlay(display,{avatar:settings.avatar,durationSeconds:settings.durationSeconds,size:settings.size,bottomOffset:settings.bottomOffset,message,sound:settings.sound});
 if(settings.sound)shell.beep();
}
function createOverlay(display:Display,data:WalkData){
 const bounds=display.workArea;
 const win=new BrowserWindow({...bounds,transparent:true,frame:false,hasShadow:false,resizable:false,movable:false,focusable:false,skipTaskbar:true,show:false,alwaysOnTop:true,backgroundColor:'#00000000',webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 win.setIgnoreMouseEvents(true,{forward:true});win.setAlwaysOnTop(true,'screen-saver');win.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:false});secure(win);
 const id=win.webContents.id;
 const timer=setTimeout(()=>{if(!win.isDestroyed())win.destroy();overlays.delete(id)},(data.durationSeconds+8)*1000);
 overlays.set(win.webContents.id,{window:win,data:{...data,bottomOffset:Math.min(data.bottomOffset,Math.max(0,bounds.height-data.size-120))},timer});
 win.on('closed',()=>{clearTimeout(timer);for(const [id,o]of overlays)if(o.window===win)overlays.delete(id)});load(win,true);
}
function updateTray(){if(!tray)return;tray.setToolTip(`SipBuddy · ${state.settings.paused?'Paused':'Your next sip is on its way'}`);tray.setContextMenu(Menu.buildFromTemplate([
 {label:'Drink Water Now / Test Mascot Walk',click:()=>startWalk(true)},
 {label:'Log 250 mL Water',click:()=>command({type:'log',ml:250})},
 {label:'Open SipBuddy',click:openDashboard},{type:'separator'},
 {label:'Pause Reminders (presentations & games)',enabled:!state.settings.paused,click:()=>command({type:'pause'})},
 {label:'Snooze 30 Minutes',click:()=>command({type:'snooze',minutes:30})},
 {label:'Resume Reminders',click:()=>command({type:'resume'})},{type:'separator'},
 {label:'Quit SipBuddy',click:()=>{quitting=true;app.quit()}}
 ]))}
function command(input:unknown){
 if(input&&typeof input==='object'&&['avatar','settings'].includes((input as {type:string}).type)){
  const command=input as {type:string;avatar?:unknown;settings?:{avatar?:unknown}};
  const avatar=validateAvatar(command.type==='avatar'?command.avatar:command.settings?.avatar??{kind:'original'});
  if(avatar.kind==='personal'&&avatar.portrait){const image=nativeImage.createFromDataURL(avatar.portrait);if(image.isEmpty())throw new Error('Invalid portrait image');}
 }
 const previous=state.settings;state=applyCommand(state,input);if((input as {type:string}).type==='test')startWalk(true);else{
 if(state.settings.paused||(input as {type:string}).type==='avatar')clearOverlays();
 if(previous.startAtLogin!==state.settings.startAtLogin||previous.startMinimized!==state.settings.startMinimized)app.setLoginItemSettings({openAtLogin:state.settings.startAtLogin,args:state.settings.startMinimized?['--hidden']:[]});publish();}return state}
function trusted(event:IpcMainInvokeEvent){if(!dashboard||event.sender.id!==dashboard.webContents.id||event.senderFrame!==dashboard.webContents.mainFrame)throw new Error('Unauthorized renderer')}
function defer(){clearOverlays();state={...state,nextReminderAt:nextDue(state.settings,Date.now())};lastTick=Date.now();publish()}
if(!app.requestSingleInstanceLock())app.quit();else{
 app.on('second-instance',openDashboard);app.on('before-quit',()=>{quitting=true;if(tickTimer)clearInterval(tickTimer);clearOverlays()});app.on('window-all-closed',()=>{});
 app.whenReady().then(()=>{
 session.defaultSession.setPermissionRequestHandler((_w,_p,cb)=>cb(false));
 session.defaultSession.webRequest.onHeadersReceived((details,cb)=>cb({responseHeaders:{...details.responseHeaders,'Content-Security-Policy':["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ws://localhost:5174; object-src 'none'; base-uri 'none'"]}}));
 store=new Store(app.getPath('userData'));const firstRun=!existsSync(store.path);state=store.load();store.save(state);
 tray=new Tray(nativeImage.createFromPath(path.join(resources,'tray.png')));tray.on('double-click',openDashboard);updateTray();
 ipcMain.handle('state:get',e=>{trusted(e);return state});ipcMain.handle('state:command',(e,input)=>{trusted(e);return command(input)});
 ipcMain.handle('monitors:get',e=>{trusted(e);return screen.getAllDisplays().map((d,i)=>({id:String(d.id),name:d.label||`Display ${i+1} (${d.size.width} × ${d.size.height})`}))});
 ipcMain.on('overlay:ready',e=>{const o=overlays.get(e.sender.id);if(o&&e.senderFrame===e.sender.mainFrame){o.window.showInactive();e.sender.send('overlay:walk',o.data)}});
 ipcMain.on('overlay:done',e=>{const id=e.sender.id;const o=overlays.get(id);if(o&&e.senderFrame===e.sender.mainFrame){clearTimeout(o.timer);o.window.destroy();overlays.delete(id)}});
 powerMonitor.on('lock-screen',()=>{locked=true;defer()});powerMonitor.on('unlock-screen',()=>{locked=false;defer()});powerMonitor.on('suspend',()=>{suspended=true;defer()});powerMonitor.on('resume',()=>{suspended=false;defer()});
 tickTimer=setInterval(()=>{const now=Date.now();const result=advanceScheduler(state,now,lastTick,locked||suspended);lastTick=now;if(result.remind)startWalk();else if(result.state!==state){state=result.state;publish()}},1000);
 if(firstRun||dev||(!state.settings.startMinimized&&!process.argv.includes('--hidden')))openDashboard();
 });
}
