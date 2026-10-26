import {readFileSync} from 'node:fs';
import {test,expect} from '@playwright/test';
test('landing page, demo walk, and honest download state',async({page})=>{
 await page.route('**/release.json',route=>route.fulfill({json:{verified:false,url:null}}));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Your hydration buddy');
 await page.getByRole('link',{name:'See My Buddy Walk'}).click();const preview=page.locator('#preview');await preview.getByRole('button',{name:'Meet your buddy'}).click();const buddy=preview.locator('.walking-buddy');await expect(buddy).toBeAttached();const before=await buddy.evaluate(e=>e.getBoundingClientRect().left);await page.waitForTimeout(1200);const after=await buddy.evaluate(e=>e.getBoundingClientRect().left);expect(after).toBeGreaterThan(before);
 await expect(page.locator('#download')).toContainText('NOT RELEASED YET');expect(await page.locator('body').evaluate(e=>e.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
test('tracker logs water, persists reload, and saves preferences',async({page})=>{await page.goto('/');await page.getByRole('button',{name:'Explore the dashboard'}).click();const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'250 mL',exact:true}).click();await expect(dialog.locator('.progress-ring strong')).toHaveText('250');await dialog.getByRole('button',{name:'Pause',exact:true}).click();await expect(dialog.locator('.countdown')).toHaveText('Paused');await dialog.getByRole('button',{name:'Preferences',exact:true}).click();await dialog.getByRole('spinbutton',{name:'Daily water goal (mL)'}).fill('2500');await dialog.getByRole('button',{name:'Save preferences'}).click();await expect(dialog.getByRole('status')).toContainText('Preferences saved');await page.reload();await page.getByRole('button',{name:'Explore the dashboard'}).click();await expect(page.locator('.progress-ring strong')).toHaveText('250');await expect(page.locator('.progress-ring')).toContainText('2,500');});
test('original avatar renders with transparency and natural proportions',async({page})=>{await page.goto('/');await page.getByRole('button',{name:'Use original demo avatar',exact:true}).click();const avatar=page.getByRole('img',{name:'Aman’s personal hydration buddy'}).first();await expect(avatar).toBeVisible();const result=await avatar.evaluate((element:HTMLImageElement)=>{const canvas=document.createElement('canvas');canvas.width=element.naturalWidth;canvas.height=element.naturalHeight;const ctx=canvas.getContext('2d')!;ctx.drawImage(element,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let transparent=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]===0)transparent++;const rect=element.getBoundingClientRect();return {width:element.naturalWidth,height:element.naturalHeight,ratio:rect.width/rect.height,transparent}});expect(result.width).toBeGreaterThan(0);expect(result.transparent).toBeGreaterThan(0);expect(result.ratio).toBeCloseTo(result.width/result.height,2)});
test('walking buddy alternates planted legs and bends knees without replacing the original avatar',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Use original demo avatar',exact:true}).click();await page.locator('#preview').getByRole('button',{name:'Meet your buddy'}).click();
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

test('personal photo avatar stays local, replaces the original, persists, and can be removed',async({page})=>{
 const posted:string[]=[];const originalLoads:string[]=[];page.on('request',r=>{if(r.method()==='POST')posted.push(r.url());if(r.url().includes('aman-water-chibi.png'))originalLoads.push(r.url())});
 await page.goto('/');const studio=page.getByRole('region',{name:'Create your personal avatar'});
 await studio.getByRole('button',{name:'Private photo avatar',exact:true}).click();
 await studio.getByLabel('Upload your photo').setInputFiles({name:'private-photo.png',mimeType:'image/png',buffer:readFileSync('assets/tray.png')});
 await expect(studio.locator('[data-personal-portrait]')).toBeVisible();
 await studio.getByRole('textbox',{name:'Buddy’s name'}).fill('Sam');await studio.getByRole('button',{name:'Outfit #7356a5',exact:true}).click();await studio.getByRole('button',{name:'Use my avatar',exact:true}).click();
 await expect(studio.getByRole('status')).toContainText('saved on this device');
 const profile=await page.evaluate(()=>JSON.parse(localStorage.getItem('sipbuddy-demo')!).settings.avatar);
 expect(profile.kind).toBe('personal');expect(profile.name).toBe('Sam');expect(profile.shirtColor).toBe('#7356a5');expect(profile.portrait).toMatch(/^data:image\/png;base64,/);
 await expect(page.locator('.hero-visual [data-personal-portrait]')).toBeVisible();
 await page.reload();await expect(page.locator('.hero-visual [data-personal-portrait]')).toBeVisible();
 await page.locator('#preview').getByRole('button',{name:'Meet your buddy'}).click();await expect(page.locator('#preview .walking-mascot [data-personal-portrait]')).toBeAttached();
 expect(originalLoads).toEqual([]);expect(posted).toEqual([]);
 await studio.getByRole('button',{name:'Remove my photo'}).click();
 await expect(studio.getByRole('status')).toContainText('saved on this device');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sipbuddy-demo')!).settings.avatar.portrait)).toBeNull();
 await expect(page.locator('.hero-visual [data-personal-portrait]')).toHaveCount(0);
});
test('unsupported photo files cannot replace a saved avatar',async({page})=>{
 await page.goto('/');const studio=page.getByRole('region',{name:'Create your personal avatar'});
 await studio.getByRole('button',{name:'Private photo avatar',exact:true}).click();
 await studio.getByLabel('Upload your photo').setInputFiles({name:'unsafe.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')});
 await expect(studio.getByRole('alert')).toContainText('PNG, JPEG, or WebP');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sipbuddy-demo')!).settings.avatar.portrait)).toBeNull();
});

test('existing avatar is used as artwork, stays private, and survives reload',async({page})=>{
 const sent:string[]=[];page.on('request',r=>{if(r.method()==='POST')sent.push(r.url())});await page.goto('/');
 const studio=page.getByRole('region',{name:'Create your personal avatar'});
 await studio.getByLabel('Upload your avatar image').setInputFiles({name:'my-avatar.png',mimeType:'image/png',buffer:readFileSync('assets/tray.png')});
 await expect(studio.locator('.uploaded-mascot')).toBeVisible();
 await studio.getByRole('textbox',{name:'Buddy’s name'}).fill('My avatar');
 await studio.getByRole('combobox',{name:'Avatar movement'}).selectOption('float');
 await studio.getByRole('button',{name:'Use my avatar',exact:true}).click();await expect(studio.getByRole('status')).toContainText('saved on this device');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('sipbuddy-demo')!).settings.avatar);
 expect(saved.kind).toBe('uploaded');expect(saved.motion).toBe('float');expect(saved.image).toMatch(/^data:image\/png;base64,/);expect(saved.name).toBe('My avatar');
 await page.reload();await expect(page.locator('.hero-visual .uploaded-mascot')).toBeVisible();
 await page.locator('#preview').getByRole('button',{name:'Meet your buddy'}).click();const walk=page.locator('#preview .walking-mascot');await expect(walk).toBeAttached();expect(await walk.locator('[data-uploaded-avatar]').getAttribute('href')).toBe(saved.image);
 const alpha=await page.locator('.hero-visual [data-uploaded-avatar]').evaluate(async element=>{const image=new Image();image.src=element.getAttribute('href')!;await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d')!;c.drawImage(image,0,0);const data=c.getImageData(0,0,512,512).data;let transparent=0;for(let i=3;i<data.length;i+=4)if(data[i]===0)transparent++;return transparent});expect(alpha).toBeGreaterThan(0);expect(sent).toEqual([]);
 await studio.getByRole('combobox',{name:'Avatar movement'}).selectOption('walk');await studio.getByText('Adjust walking joints',{exact:true}).click();await studio.getByRole('slider',{name:'Hip height',exact:true}).focus();await studio.getByRole('slider',{name:'Hip height',exact:true}).press('ArrowRight');await studio.getByRole('button',{name:'Use my avatar',exact:true}).click();
 const adjusted=await page.evaluate(()=>JSON.parse(localStorage.getItem('sipbuddy-demo')!).settings.avatar);expect(adjusted.rig.hipY).toBe(saved.rig.hipY+1);expect(adjusted.image).toBe(saved.image);await expect(page.locator('#preview .gait-leg')).toHaveCount(2);
 await studio.getByRole('button',{name:'Remove my avatar',exact:true}).click();await expect(page.locator('.hero-visual .uploaded-mascot')).toHaveCount(0);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sipbuddy-demo')!).settings.avatar.kind)).toBe('personal');
});
