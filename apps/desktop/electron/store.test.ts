import {it,expect} from 'vitest';
import {mkdtempSync,readdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Store} from './store';
import {applyCommand,initialState} from '@sipbuddy/core';
it('persists water and settings through a new store instance',()=>{const dir=mkdtempSync(join(tmpdir(),'sipbuddy-'));try{const store=new Store(dir);const now=Date.now();const state=applyCommand(initialState(now),{type:'log',ml:250},now);store.save(state);expect(new Store(dir).load(now)).toEqual(state);expect(readdirSync(dir)).toEqual(['sipbuddy-state.json'])}finally{rmSync(dir,{recursive:true})}});
it('retains the original corrupt file before recovery',()=>{const dir=mkdtempSync(join(tmpdir(),'sipbuddy-'));try{const store=new Store(dir);writeFileSync(store.path,'original damaged data');expect(store.load().water).toEqual([]);const recovery=readdirSync(dir).find(n=>n.includes('recovery-'));expect(recovery).toBeTruthy();expect(readFileSync(join(dir,recovery!),'utf8')).toBe('original damaged data')}finally{rmSync(dir,{recursive:true})}});
