import {contextBridge,ipcRenderer} from 'electron';
import type {Command,State,WalkData} from '@sipbuddy/core';
contextBridge.exposeInMainWorld('sipbuddy',{
 getState:()=>ipcRenderer.invoke('state:get'),command:(c:Command)=>ipcRenderer.invoke('state:command',c),monitors:()=>ipcRenderer.invoke('monitors:get'),
 subscribe:(listener:(s:State)=>void)=>{const handler=(_:unknown,s:State)=>listener(s);ipcRenderer.on('state:changed',handler);return ()=>ipcRenderer.removeListener('state:changed',handler)},
 onWalk:(listener:(w:WalkData)=>void)=>{const handler=(_:unknown,w:WalkData)=>listener(w);ipcRenderer.on('overlay:walk',handler);ipcRenderer.send('overlay:ready');return ()=>ipcRenderer.removeListener('overlay:walk',handler)},
 walkDone:()=>ipcRenderer.send('overlay:done')
});
