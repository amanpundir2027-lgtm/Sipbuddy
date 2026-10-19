import {writeFile} from 'node:fs/promises';
const output=new URL('../assets/release.json',import.meta.url);
let release={verified:false,url:null};
try {
 const headers={'Accept':'application/vnd.github+json','User-Agent':'SipBuddy-build'};
 const r=await fetch('https://api.github.com/repos/amanpundir2027-lgtm/Sipbuddy/releases/latest',{headers,signal:AbortSignal.timeout(10000)});
 if(r.ok){const data=await r.json();const asset=data.assets?.find(a=>/^SipBuddy-Setup-\d+\.\d+\.\d+\.exe$/.test(a.name));
 if(asset){const u=new URL(asset.browser_download_url);if(u.origin==='https://github.com'&&u.pathname.startsWith('/amanpundir2027-lgtm/Sipbuddy/releases/download/')){const head=await fetch(u,{method:'HEAD',signal:AbortSignal.timeout(15000)});if(head.ok)release={verified:true,url:u.href}}}
 } else console.log(`No verified public installer (release API: ${r.status}).`);
} catch {console.log('Release verification unavailable; installer download stays inactive.');}
await writeFile(output,JSON.stringify(release));
console.log(release.verified?'Verified published Windows installer.':'No active installer download.');
