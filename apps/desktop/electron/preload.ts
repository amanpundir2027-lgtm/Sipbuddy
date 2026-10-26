import {contextBridge,ipcRenderer} from 'electron';
import type {Command,State,WalkData,UpdateState,DesktopNavigation} from '@sipbuddy/core';
contextBridge.exposeInMainWorld('sipbuddy',{
 getUpdateState:()=>ipcRenderer.invoke('updates:get'),checkForUpdates:()=>ipcRenderer.invoke('updates:check'),downloadUpdate:()=>ipcRenderer.invoke('updates:download'),installUpdate:()=>ipcRenderer.invoke('updates:install'),openReleases:()=>ipcRenderer.invoke('updates:releases'),
 onUpdate:(listener:(s:UpdateState)=>void)=>{const handler=(_:unknown,s:UpdateState)=>listener(s);ipcRenderer.on('updates:changed',handler);return()=>ipcRenderer.removeListener('updates:changed',handler)},
 getNavigation:()=>ipcRenderer.invoke('navigation:get'),onNavigate:(listener:(n:DesktopNavigation)=>void)=>{const handler=(_:unknown,n:DesktopNavigation)=>listener(n);ipcRenderer.on('navigation:changed',handler);return()=>ipcRenderer.removeListener('navigation:changed',handler)},
 getState:()=>ipcRenderer.invoke('state:get'),command:(c:Command)=>ipcRenderer.invoke('state:command',c),monitors:()=>ipcRenderer.invoke('monitors:get'),
 subscribe:(listener:(s:State)=>void)=>{const handler=(_:unknown,s:State)=>listener(s);ipcRenderer.on('state:changed',handler);return ()=>ipcRenderer.removeListener('state:changed',handler)},
 onWalk:(listener:(w:WalkData)=>void)=>{const handler=(_:unknown,w:WalkData)=>listener(w);ipcRenderer.on('overlay:walk',handler);ipcRenderer.send('overlay:ready');return ()=>ipcRenderer.removeListener('overlay:walk',handler)},
 walkDone:()=>ipcRenderer.send('overlay:done')
});
