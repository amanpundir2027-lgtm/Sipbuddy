import {EventEmitter} from 'node:events';
import {describe,it,expect,vi} from 'vitest';
import {Updates} from './updates';

function setup(enabled=true){
 const engine=Object.assign(new EventEmitter(),{autoDownload:true,autoInstallOnAppQuit:true,checkForUpdates:vi.fn(async()=>{}),downloadUpdate:vi.fn(async()=>{}),quitAndInstall:vi.fn()});
 const save=vi.fn();const publish=vi.fn();
 return {engine,save,publish,updates:new Updates(engine,'1.3.0',enabled,publish,save)};
}
describe('desktop update consent and recovery',()=>{
 it('requires checking, download consent, completed download and explicit restart in order',async()=>{
  const {engine,updates,save}=setup();
  expect(engine.autoDownload).toBe(false);expect(engine.autoInstallOnAppQuit).toBe(false);
  await updates.download();updates.install();expect(engine.downloadUpdate).not.toHaveBeenCalled();expect(save).not.toHaveBeenCalled();
  await updates.check();await updates.check();expect(engine.checkForUpdates).toHaveBeenCalledTimes(1);
  engine.emit('update-available',{version:'1.4.0'});expect(updates.state.status).toBe('available');expect(engine.downloadUpdate).not.toHaveBeenCalled();
  await updates.download();await updates.download();expect(engine.downloadUpdate).toHaveBeenCalledTimes(1);
  engine.emit('download-progress',{percent:53.7});expect(updates.state.percent).toBe(54);
  updates.install();expect(engine.quitAndInstall).not.toHaveBeenCalled();
  engine.emit('update-downloaded',{version:'1.4.0'});expect(engine.quitAndInstall).not.toHaveBeenCalled();
  updates.install();updates.install();expect(save).toHaveBeenCalledTimes(1);expect(engine.quitAndInstall).toHaveBeenCalledExactlyOnceWith(false,true);
  expect(save.mock.invocationCallOrder[0]).toBeLessThan(engine.quitAndInstall.mock.invocationCallOrder[0]);
 });
 it('keeps development builds offline',async()=>{
  const {updates,engine}=setup(false);await updates.check();await updates.download();updates.install();
  expect(updates.state.status).toBe('disabled');expect(engine.checkForUpdates).not.toHaveBeenCalled();expect(engine.downloadUpdate).not.toHaveBeenCalled();expect(engine.quitAndInstall).not.toHaveBeenCalled();
 });
 it('recovers from offline discovery and does not expose internal error details',async()=>{
  const {updates,engine}=setup();engine.checkForUpdates.mockRejectedValueOnce(new Error('private path'));
  await updates.check();expect(updates.state.status).toBe('error');expect(updates.state.message).not.toContain('private path');
  await updates.check();engine.emit('update-not-available');expect(updates.state.status).toBe('current');expect(updates.state.currentVersion).toBe('1.3.0');
 });
 it('does not allow install after a failed or incomplete download',async()=>{
  const {updates,engine}=setup();engine.emit('update-available',{version:'1.4.0'});
  engine.downloadUpdate.mockRejectedValueOnce(new Error('hash mismatch'));await updates.download();updates.install();
  expect(updates.state.status).toBe('error');expect(engine.quitAndInstall).not.toHaveBeenCalled();
  await updates.check();engine.emit('update-available',{version:'1.4.0'});await updates.download();engine.emit('error',new Error('offline'));expect(updates.state.status).toBe('error');
 });
});
