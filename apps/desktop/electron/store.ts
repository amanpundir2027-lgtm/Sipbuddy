import {existsSync,readFileSync,writeFileSync,renameSync,copyFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {initialState,parseState,type State} from '@sipbuddy/core';
export class Store {
 readonly path:string;
 constructor(directory:string){mkdirSync(directory,{recursive:true});this.path=join(directory,'sipbuddy-state.json')}
 load(now=Date.now()):State {if(!existsSync(this.path))return initialState(now);try{return parseState(readFileSync(this.path,'utf8'),now)}catch(error){
 // Preserve unreadable history instead of overwriting the only copy.
 copyFileSync(this.path,`${this.path}.recovery-${Date.now()}`);
 console.error('State could not be read; preserved a recovery copy.',error);return initialState(now);
 }}
 save(state:State){const temp=this.path+'.tmp';writeFileSync(temp,JSON.stringify(state),{encoding:'utf8',mode:0o600});renameSync(temp,this.path)}
}
