// Captura determinista de la escena existente con D3D12 y NVENC.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.resolve(project,'../..');
const tl=JSON.parse(fs.readFileSync(path.join(project,'002-Cues/Timeline.json'),'utf8'));
const browser=await chromium.launch({executablePath:path.join(root,'node_modules/.remotion/chrome-for-testing/linux64/chrome-linux64/chrome'),args:['--ignore-gpu-blocklist','--enable-gpu-rasterization','--use-angle=gl','--enable-webgl','--hide-scrollbars']});
const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
await page.addInitScript(()=>{window.__CAPTURE=true;});
await page.goto('file://'+path.join(root,'sims/dist/logs-errores.html'));
await page.waitForFunction(()=>window.SIM?.ready,null,{timeout:60000});
const gpu=await page.evaluate(()=>{const gl=document.createElement('canvas').getContext('webgl2');const ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);});
console.log('GPU:',gpu);
if(!gpu.includes('NVIDIA GeForce RTX 4070 Ti'))throw new Error('La escena no está usando la GPU verificada.');
if(process.argv.includes('--check')){
 const times=[tl.events['fix.key'].at+.25,tl.events['fix.key'].at+.65,(tl.scenes.find(s=>s.id==='argument').start+tl.scenes.find(s=>s.id==='argument').end)/2];
 for(const [i,t] of times.entries()){await page.evaluate(t=>window.SIM.render(t),t);await page.screenshot({path:path.join(project,`004-Render/shadow-fixed-${i}.png`)});}
 await browser.close();process.exit(0);
}
const output=path.join(project,'004-Render/scene-3d-new.mp4');
const ff=spawn(path.join(root,'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'),['-v','error','-y','-f','image2pipe','-framerate',String(tl.fps),'-vcodec','mjpeg','-s','1080x1920','-i','-','-c:v','h264_nvenc','-preset','p5','-b:v','12M','-pix_fmt','yuv420p','-movflags','+faststart',output],{stdio:['pipe','inherit','inherit']});
let failure;ff.stdin.on('error',e=>{failure=e;});
const finished=new Promise((resolve,reject)=>{ff.on('error',reject);ff.on('close',code=>code===0?resolve():reject(new Error(`FFmpeg terminó con código ${code}`)));});
try{
 for(let frame=0;frame<tl.durationInFrames;frame++){
  if(failure)throw failure;
  await page.evaluate(t=>window.SIM.render(t),frame/tl.fps);
  const image=await page.screenshot({type:'jpeg',quality:97});
  if(!ff.stdin.write(image))await new Promise(resolve=>ff.stdin.once('drain',resolve));
  if(frame%tl.fps===0)console.log(`Captured ${frame}/${tl.durationInFrames}`);
 }
 ff.stdin.end();await finished;
 fs.renameSync(output,path.join(project,'004-Render/scene-3d.mp4'));
 const publicDir=path.join(root,'public/projects/004-logs-errores');fs.mkdirSync(publicDir,{recursive:true});
 fs.copyFileSync(path.join(project,'004-Render/scene-3d.mp4'),path.join(publicDir,'scene-3d.mp4'));
 console.log('Captured',tl.durationInFrames,'frames; NVENC.');
}finally{await browser.close();}
