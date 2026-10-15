// Segmentos continuos con navegador nuevo para evitar agotar el contexto D3D12.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, selectComposition} from '@remotion/renderer';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.resolve(project,'../..');
const outputLocation=path.resolve(process.argv[2]);
const inputProps=JSON.parse(process.argv[3]);
const requested=process.argv[4]?process.argv[4].split('-').map(Number):undefined;
const outDir=path.join(project,'004-Render/gpu-bundle');
const link=path.join(outDir,'public');
if(fs.existsSync(link)&&fs.lstatSync(link).isSymbolicLink())fs.unlinkSync(link);
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),outDir,symlinkPublicDir:true});
const segments=path.join(project,'004-Render/gpu-segments');fs.mkdirSync(segments,{recursive:true});
const files=[];
let next=requested?.[0]??0,end=requested?.[1];
while(end===undefined||next<=end){
  const browser=await openBrowser('chrome',{chromeMode:'chrome-for-testing',chromiumOptions:{gl:'angle'},logLevel:'warn'});
  try{
    const gpu=(await browser.connection.send('SystemInfo.getInfo')).value.gpu;
    fs.writeFileSync(path.join(project,'004-Render/gpu-device.json'),JSON.stringify({devices:gpu.devices,renderer:gpu.auxAttributes.glRenderer},null,2)+'\n');
    const options={serveUrl,inputProps,puppeteerInstance:browser,chromeMode:'chrome-for-testing',chromiumOptions:{gl:'angle'},logLevel:'warn'};
    const composition=await selectComposition({...options,id:'EnvioPrdVideo'});
    end??=composition.durationInFrames-1;
    const last=Math.min(next+359,end);
    const file=path.join(segments,`${next}-${last}.mp4`);
    console.log(`Segment ${next}-${last} / ${end}`);
    await renderMedia({...options,composition,outputLocation:file,codec:'h264',pixelFormat:'yuv420p',videoBitrate:'12M',hardwareAcceleration:'required',concurrency:2,imageFormat:'jpeg',jpegQuality:95,frameRange:[next,last]});
    files.push(file);next=last+1;
  }finally{await browser.close({silent:true});}
}
// Los tiempos absolutos de Remotion conservan la cámara y la animación entre segmentos.
const list=path.join(segments,'concat.txt');
fs.writeFileSync(list,files.map(f=>`file '${f.replaceAll("'","'\\''")}'`).join('\n')+'\n');
const result=spawnSync('ffmpeg',['-v','error','-y','-f','concat','-safe','0','-i',list,'-c','copy',outputLocation],{stdio:'inherit'});
if(result.status!==0)throw new Error('No se pudieron unir los segmentos');
console.log(`Rendered ${files.length} segments: ${outputLocation}`);
