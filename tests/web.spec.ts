import {test,expect} from '@playwright/test';
test('landing page, demo walk, and honest download state',async({page})=>{
 await page.route('**/release.json',route=>route.fulfill({json:{verified:false,url:null}}));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Your hydration buddy');
 await page.getByRole('link',{name:'See My Buddy Walk'}).click();const preview=page.locator('#preview');await preview.getByRole('button',{name:'Meet your buddy'}).click();const buddy=preview.locator('.walking-buddy');await expect(buddy).toBeAttached();const before=await buddy.evaluate(e=>e.getBoundingClientRect().left);await page.waitForTimeout(1200);const after=await buddy.evaluate(e=>e.getBoundingClientRect().left);expect(after).toBeGreaterThan(before);
 await expect(page.locator('#download')).toContainText('NOT RELEASED YET');expect(await page.locator('body').evaluate(e=>e.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
test('tracker logs water, persists reload, and saves preferences',async({page})=>{await page.goto('/');await page.getByRole('button',{name:'Explore the dashboard'}).click();const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'250 mL',exact:true}).click();await expect(dialog.locator('.progress-ring strong')).toHaveText('250');await dialog.getByRole('button',{name:'Pause',exact:true}).click();await expect(dialog.locator('.countdown')).toHaveText('Paused');await dialog.getByRole('button',{name:'Preferences',exact:true}).click();await dialog.getByRole('spinbutton',{name:'Daily water goal (mL)'}).fill('2500');await dialog.getByRole('button',{name:'Save preferences'}).click();await expect(dialog.getByRole('status')).toContainText('Preferences saved');await page.reload();await page.getByRole('button',{name:'Explore the dashboard'}).click();await expect(page.locator('.progress-ring strong')).toHaveText('250');await expect(page.locator('.progress-ring')).toContainText('2,500');});
test('original avatar renders with transparency and natural proportions',async({page})=>{await page.goto('/');const avatar=page.getByRole('img',{name:'Aman’s personal hydration buddy'}).first();await expect(avatar).toBeVisible();const result=await avatar.evaluate((element:HTMLImageElement)=>{const canvas=document.createElement('canvas');canvas.width=element.naturalWidth;canvas.height=element.naturalHeight;const ctx=canvas.getContext('2d')!;ctx.drawImage(element,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let transparent=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]===0)transparent++;const rect=element.getBoundingClientRect();return {width:element.naturalWidth,height:element.naturalHeight,ratio:rect.width/rect.height,transparent}});expect(result.width).toBeGreaterThan(0);expect(result.transparent).toBeGreaterThan(0);expect(result.ratio).toBeCloseTo(result.width/result.height,2)});
test('walking buddy alternates planted legs and bends knees without replacing the original avatar',async({page})=>{
 await page.goto('/');await page.locator('#preview').getByRole('button',{name:'Meet your buddy'}).click();
 const rig=page.locator('#preview .walking-mascot');await expect(rig).toBeAttached();
 const poses=await rig.evaluate(element=>{
  const sample=(phase:number)=>{for(const animation of element.getAnimations({subtree:true})){animation.pause();animation.currentTime=Number(animation.effect!.getTiming().duration)*phase}
   return {legs:[...element.querySelectorAll('.gait-leg')].map(e=>new DOMMatrix(getComputedStyle(e).transform).b),knees:[...element.querySelectorAll('.gait-knee')].map(e=>new DOMMatrix(getComputedStyle(e).transform).b)};
  };
  return {contact:sample(0),otherContact:sample(.5),swing:sample(.78),source:element.querySelector('defs image')?.getAttribute('href')};
 });
 expect(poses.source).toBe('./aman-water-chibi.png');expect(poses.contact.legs).toHaveLength(2);
 expect(poses.contact.legs[0]*poses.contact.legs[1]).toBeLessThan(0);
 expect(poses.contact.legs[0]*poses.otherContact.legs[0]).toBeLessThan(0);
 expect(Math.max(...poses.swing.knees.map(Math.abs))).toBeGreaterThan(.15);
 await page.emulateMedia({reducedMotion:'reduce'});
 expect(await rig.evaluate(e=>e.getAnimations({subtree:true}).length)).toBe(0);
});
