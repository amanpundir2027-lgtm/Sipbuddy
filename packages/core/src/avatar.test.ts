import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {applyCommand,DEFAULT_AVATAR,DEFAULT_UPLOAD_RIG,initialState,parseState,validateAvatar,type AvatarProfile} from './index';
const photo='data:image/png;base64,'+readFileSync('assets/tray.png').toString('base64');
const personal={...DEFAULT_AVATAR,kind:'personal',portrait:photo,name:'Sam'} as AvatarProfile;
describe('personal avatars',()=>{
 it('starts new users with a neutral personal buddy',()=>{expect(initialState().settings.avatar).toEqual(DEFAULT_AVATAR);expect(initialState().settings.avatar.kind).toBe('personal')});
 it('preserves old users and their water history when migrating',()=>{const now=Date.now();const old=applyCommand(initialState(now),{type:'log',ml:250},now);const raw=JSON.parse(JSON.stringify(old));delete raw.settings.avatar;const restored=parseState(JSON.stringify(raw),now);expect(restored.settings.avatar).toEqual({kind:'original'});expect(restored.water).toEqual(old.water)});
 it('changes and removes an avatar without rescheduling or resetting water',()=>{const now=Date.now();const before=applyCommand(initialState(now),{type:'log',ml:250},now);const next=applyCommand(before,{type:'avatar',avatar:personal},now+10000);expect(next.settings.avatar).toEqual(personal);expect(next.nextReminderAt).toBe(before.nextReminderAt);expect(next.water).toEqual(before.water);expect(parseState(JSON.stringify(next),now).settings.avatar).toEqual(personal);const removed=applyCommand(next,{type:'avatar',avatar:DEFAULT_AVATAR},now);expect(removed.water).toEqual(before.water);expect(removed.settings.avatar).toEqual(DEFAULT_AVATAR)});
 it.each(['https://tracking.example/photo.png','file:///secret.png','data:image/svg+xml;base64,PHN2Zz4=','data:text/html;base64,PHNjcmlwdD4=','data:image/png;base64,iVBORw0KGgo'])('rejects remote paths and malformed image %s',portrait=>expect(()=>validateAvatar({...personal,portrait})).toThrow());
 it('rejects decompression-sized portraits and oversized payloads',()=>{const bytes=readFileSync('assets/tray.png');bytes.writeUInt32BE(100000,16);expect(()=>validateAvatar({...personal,portrait:'data:image/png;base64,'+bytes.toString('base64')})).toThrow('512');expect(()=>validateAvatar({...personal,portrait:photo+'A'.repeat(500000)})).toThrow()});
 it('validates colors and names, and strips unknown fields',()=>{expect(()=>validateAvatar({...personal,shirtColor:'url(https://tracking.example)'})).toThrow();expect(()=>validateAvatar({...personal,name:' '})).toThrow();expect(validateAvatar({...personal,untrusted:'ignored'})).toEqual(personal)});
});

it('persists uploaded artwork and walking joints without resetting reminders',()=>{const now=Date.now(),before=initialState(now);const avatar={kind:'uploaded',name:'My artwork',image:photo,motion:'walk',rig:{...DEFAULT_UPLOAD_RIG}};const next=applyCommand(before,{type:'avatar',avatar},now+1234);expect(next.nextReminderAt).toBe(before.nextReminderAt);expect(next.settings.avatar).toEqual(avatar);expect(parseState(JSON.stringify(next),now).settings.avatar).toEqual(avatar)});
it.each([
 {motion:'run'},
 {image:'https://tracking.example/avatar.png'},
 {rig:{...DEFAULT_UPLOAD_RIG,hipY:5000}},
 {rig:{...DEFAULT_UPLOAD_RIG,kneeY:330,hipY:338}},
])('rejects invalid uploaded artwork or joints',patch=>expect(()=>validateAvatar({kind:'uploaded',name:'Buddy',image:photo,motion:'walk',rig:DEFAULT_UPLOAD_RIG,...patch})).toThrow());
