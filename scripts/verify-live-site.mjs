import {chromium} from '@playwright/test';
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
 const avatar=page.getByRole('img',{name:'Aman’s personal hydration buddy'}).first();await avatar.waitFor();if(!await avatar.evaluate(e=>e.complete&&e.naturalWidth>0))throw new Error('Original PNG did not load');
 await page.waitForFunction(url=>!!document.querySelector(`a[href="${url}"]`),release.url);
 const preview=page.locator('#preview');await preview.getByRole('button',{name:'Meet your buddy'}).click();const buddy=preview.locator('.walking-buddy');await buddy.waitFor();const first=await buddy.evaluate(e=>e.getBoundingClientRect().left);await page.waitForTimeout(1200);const second=await buddy.evaluate(e=>e.getBoundingClientRect().left);if(second<=first)throw new Error('Live mascot demo did not move');
 if(errors.length)throw new Error(`Browser errors: ${errors.join('; ')}`);
 console.log(`LIVE_SITE_VERIFIED ${site.href}`);console.log(`VERIFIED_INSTALLER ${release.url}`);
}finally{await browser.close()}
