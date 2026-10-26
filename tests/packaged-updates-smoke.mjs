import {_electron as electron} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';

// Run only on the ephemeral Windows CI runner, after packaging. This exercises
// the actual shipped dependencies and feed, without downloading or installing.
if(process.platform!=='win32')throw Error('This smoke test requires a Windows runner');
const {version}=JSON.parse(await readFile(new URL('../apps/desktop/package.json',import.meta.url),'utf8'));
const executable=fileURLToPath(new URL('../apps/desktop/release/win-unpacked/SipBuddy.exe',import.meta.url));
const app=await electron.launch({executablePath:executable,timeout:45000});
try{
 // A second launch respects start-minimized. Reopen just as launching SipBuddy again would.
 await app.evaluate(({app})=>app.emit('second-instance',{},[],''));
 const page=await app.firstWindow();await page.waitForSelector('.dashboard');
 const initial=await page.evaluate(()=>window.sipbuddy.getUpdateState());
 if(initial.currentVersion!==version||initial.status==='disabled')throw Error('Packaged update client missing or wrong version');
 console.log('PACKAGED_UPDATE_RUNTIME_PASSED',initial.currentVersion);
 if(process.env.SIPBUDDY_VERIFY_PUBLIC_FEED!=='1'){console.log('Public feed check runs after release assets are published.')}else{
 const before=await page.evaluate(()=>window.sipbuddy.getState());
 await page.getByRole('button',{name:'Check for updates',exact:true}).click();
 await page.waitForFunction(async()=>['current','available','error'].includes((await window.sipbuddy.getUpdateState()).status),{},{timeout:60000});
 const checked=await page.evaluate(()=>window.sipbuddy.getUpdateState());
 if(checked.status==='error')throw Error('Packaged client failed to read the public GitHub update feed');
 if(checked.status==='available'){
  if(!await page.getByRole('button',{name:'Download update',exact:true}).isVisible())throw Error('Missing explicit download choice');
 }else if(!await page.getByText('You have the latest version.',{exact:true}).isVisible())throw Error('Missing up-to-date message');
 const after=await page.evaluate(()=>window.sipbuddy.getState());
 if(JSON.stringify(after)!==JSON.stringify(before))throw Error('Checking for updates changed user state');
 console.log('PACKAGED_UPDATE_CHECK_PASSED',checked.status,checked.currentVersion);
 }
}finally{await app.close()}
