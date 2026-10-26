import {chromium} from '@playwright/test';
import {readFileSync} from 'node:fs';
const input=process.argv[2];
if(!input)throw new Error('Pass the public deployment URL');
const site=new URL(input);site.protocol='https:';
const response=await fetch(site,{signal:AbortSignal.timeout(30000)});
if(!response.ok)throw new Error(`Public website returned HTTP ${response.status}`);
const html=await response.text();if(!html.includes('SipBuddy'))throw new Error('Public address did not serve SipBuddy');
const releaseResponse=await fetch(new URL('release.json',site));
if(!releaseResponse.ok)throw new Error('Public download manifest missing');
const release=await releaseResponse.json();if(!release.verified||!release.url?.startsWith('https://github.com/amanpundir2027-lgtm/Sipbuddy/releases/download/'))throw new Error('Public installer link is not verified');
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1366,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(site.href,{waitUntil:'networkidle'});
 await page.getByRole('heading',{level:1}).filter({hasText:'Your hydration buddy'}).waitFor();
 const avatar=page.locator('.hero-visual .mascot, .hero-visual .personal-mascot').first();await avatar.waitFor();if(!await avatar.evaluate(e=>e instanceof HTMLImageElement?e.complete&&e.naturalWidth>0:e.getAttribute('data-avatar-kind')==='personal'))throw new Error('Avatar did not load');
 await page.waitForFunction(url=>!!document.querySelector(`a[href="${url}"]`),release.url);
 const preview=page.locator('#preview');await preview.getByRole('button',{name:'Meet your buddy'}).click();const buddy=preview.locator('.walking-buddy');await buddy.waitFor();const first=await buddy.evaluate(e=>e.getBoundingClientRect().left);await page.waitForTimeout(1200);const second=await buddy.evaluate(e=>e.getBoundingClientRect().left);if(second<=first)throw new Error('Live mascot demo did not move');
 if(errors.length)throw new Error(`Browser errors: ${errors.join('; ')}`);
 const sent=[];page.on('request',r=>{if(r.method()==='POST')sent.push(r.url())});
 const studio=page.getByRole('region',{name:'Create your personal avatar'});await studio.getByLabel('Upload your avatar image').setInputFiles({name:'test-avatar.png',mimeType:'image/png',buffer:readFileSync(new URL('../assets/tray.png',import.meta.url))});await studio.locator('.uploaded-mascot').waitFor();await studio.getByRole('button',{name:'Use my avatar',exact:true}).click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('sipbuddy-demo')).settings.avatar.kind==='uploaded');await page.reload({waitUntil:'networkidle'});await page.locator('.hero-visual .uploaded-mascot').waitFor();if(sent.length)throw new Error('Selecting an avatar unexpectedly made a POST request');console.log('PUBLIC_AVATAR_UPLOAD_VERIFIED');
 console.log(`LIVE_SITE_VERIFIED ${site.href}`);console.log(`VERIFIED_INSTALLER ${release.url}`);
}finally{await browser.close()}
