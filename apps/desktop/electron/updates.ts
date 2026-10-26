import type {UpdateState} from '@sipbuddy/core';

export interface UpdateEngine {
 autoDownload:boolean;autoInstallOnAppQuit:boolean;
 on(event:string,listener:(...args:any[])=>void):unknown;
 checkForUpdates():Promise<unknown>;
 downloadUpdate():Promise<unknown>;
 quitAndInstall(silent?:boolean,forceRunAfter?:boolean):void;
}

// Keep downloads and restarts explicit. Closing the tray app must never install silently.
export class Updates {
 state:UpdateState;
 constructor(private engine:UpdateEngine|null,version:string,enabled:boolean,private publish:(state:UpdateState)=>void,private beforeInstall:()=>void){
  this.state={status:enabled&&engine?'idle':'disabled',currentVersion:version};
  if(!engine)return;
  engine.autoDownload=false;engine.autoInstallOnAppQuit=false;
  engine.on('checking-for-update',()=>this.set({status:'checking'}));
  engine.on('update-available',info=>this.set({status:'available',version:info.version}));
  engine.on('update-not-available',()=>this.set({status:'current'}));
  engine.on('download-progress',progress=>this.set({status:'downloading',percent:Math.round(Math.max(0,Math.min(100,progress.percent)))}));
  engine.on('update-downloaded',info=>this.set({status:'downloaded',version:info.version,percent:100}));
  engine.on('error',()=>this.fail());
 }
 private set(next:Partial<UpdateState>&Pick<UpdateState,'status'>){this.state={currentVersion:this.state.currentVersion,version:this.state.version,...next};this.publish(this.state)}
 private fail(){this.set({status:'error',message:'Could not complete the update. Check your connection and try again. You can also install the latest release manually.'})}
 async check(){
  if(!['idle','current','error'].includes(this.state.status))return this.state;
  this.set({status:'checking'});
  try{await this.engine!.checkForUpdates()}catch{this.fail()}
  return this.state;
 }
 async download(){
  if(this.state.status!=='available')return this.state;
  this.set({status:'downloading',percent:0});
  try{await this.engine!.downloadUpdate()}catch{this.fail()}
  return this.state;
 }
 install(){
  if(this.state.status!=='downloaded')return this.state;
  this.set({status:'installing'});
  try{this.beforeInstall();this.engine!.quitAndInstall(false,true)}catch{this.fail()}
  return this.state;
 }
}
