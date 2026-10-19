import {spawn} from 'node:child_process';
import {createServer} from 'vite';
import './build.mjs';
const server=await createServer(); await server.listen();
const child=spawn('electron',['.'],{shell:true,stdio:'inherit',env:{...process.env,SIPBUDDY_DEV_URL:'http://localhost:5174'}});
child.on('exit',code=>{server.close();process.exit(code??0)});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{child.kill();server.close()});
