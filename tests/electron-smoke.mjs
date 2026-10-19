import {_electron as electron} from '@playwright/test';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import path from 'node:path';
const require=createRequire(new URL('../apps/desktop/package.json',import.meta.url));
const executable=require('electron');
const main=fileURLToPath(new URL('../apps/desktop/dist-electron/main.cjs',import.meta.url));
import fs from 'node:fs/promises';
const profile=await fs.mkdtemp(path.join(tmpdir(),'sipbuddy-smoke-'));
const app=await electron.launch({executablePath:executable,args:[...(process.env.SIPBUDDY_TEST_NO_SANDBOX==='1'?['--no-sandbox']:[]),main],env:{...process.env,SIPBUDDY_TEST_DATA_DIR:profile},timeout:30000});
try {
 const page=await app.firstWindow();await page.waitForSelector('.dashboard');console.log('Electron dashboard loaded');
 console.log('Security:',await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];const p=w.webContents.getLastWebPreferences();return {contextIsolation:p.contextIsolation,nodeIntegration:p.nodeIntegration,sandbox:p.sandbox}}));
 await page.getByRole('button',{name:'250 mL',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.progress-ring strong')?.textContent==='250');console.log('Real main-process IPC water log passed');
 const before=await page.evaluate(()=>window.sipbuddy.getState());
 await page.getByRole('button',{name:'Test My Mascot Walk'}).click();await page.waitForTimeout(1000);
 const windows=app.windows();console.log('Window count during walk:',windows.length);
 const overlay=windows.find(w=>w.url().includes('overlay=1'));if(!overlay)throw Error('Overlay missing');
 await overlay.waitForSelector('.walking-buddy');
 const gait=overlay.locator('.walking-mascot');await gait.waitFor();const kneeBefore=await gait.locator('.gait-knee').first().evaluate(e=>getComputedStyle(e).transform);await overlay.waitForTimeout(200);const kneeAfter=await gait.locator('.gait-knee').first().evaluate(e=>getComputedStyle(e).transform);if(kneeBefore===kneeAfter)throw Error('Desktop knees did not articulate');console.log('Original-avatar knee articulation passed');
 const x=await overlay.locator('.walking-buddy').evaluate(e=>e.getBoundingClientRect().left);await overlay.waitForTimeout(1200);const x2=await overlay.locator('.walking-buddy').evaluate(e=>e.getBoundingClientRect().left);if(x2<=x)throw Error('Overlay did not move');console.log('Real overlay traversed right:',{from:x,to:x2});
 const transparent=await overlay.evaluate(()=>[document.documentElement,document.body,document.getElementById('root')].every(e=>getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)'));if(!transparent)throw Error('Overlay CSS is opaque');
 console.log('Overlay flags:',await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('overlay=1'));return {focusable:w.isFocusable(),alwaysOnTop:w.isAlwaysOnTop(),background:w.getBackgroundColor()}}));
 await overlay.waitForEvent('close',{timeout:30000});console.log('Overlay destroyed after animation');
 const after=await page.evaluate(()=>window.sipbuddy.getState());if(after.water.length!==before.water.length||after.nextReminderAt!==before.nextReminderAt)throw Error('Test walk changed hydration history or schedule');
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());const result=await app.evaluate(({BrowserWindow})=>({alive:true,visible:BrowserWindow.getAllWindows()[0].isVisible()}));if(result.visible)throw Error('Dashboard did not hide to tray');console.log('Dashboard close kept process alive and hidden');
 console.log('ELECTRON_SMOKE_PASSED');
} finally {await app.close();await fs.rm(profile,{recursive:true,force:true})}
