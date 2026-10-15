// Render dedicado: Chrome for Testing para WebGL y NVENC para el MP4.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.resolve(project,'../..');
const outputLocation=path.resolve(process.argv[2]);
const inputProps=JSON.parse(process.argv[3]);
const frameRange=process.argv[4]?process.argv[4].split('-').map(Number):undefined;
const outDir=path.join(project,'004-Render/gpu-bundle');
const link=path.join(outDir,'public');
if(fs.existsSync(link)&&fs.lstatSync(link).isSymbolicLink())fs.unlinkSync(link);
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),outDir,symlinkPublicDir:true});
const options={serveUrl,inputProps,chromeMode:'chrome-for-testing',chromiumOptions:{gl:'angle'},logLevel:'verbose'};
const composition=await selectComposition({...options,id:'LowPolyTokensVideo'});
await renderMedia({...options,composition,outputLocation,codec:'h264',pixelFormat:'yuv420p',videoBitrate:'12M',hardwareAcceleration:'required',concurrency:2,imageFormat:'jpeg',jpegQuality:95,frameRange,onProgress:({renderedFrames,encodedFrames})=>{if(renderedFrames%60===0)console.log(`Progress: rendered=${renderedFrames} encoded=${encodedFrames}`);}});
