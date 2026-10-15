import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root=path.resolve(project,'../..');
const tl=JSON.parse(fs.readFileSync(path.join(project,'002-Cues/Timeline.json'),'utf8'));
const out=path.join(project,'004-Render/story-review-frames');fs.mkdirSync(out,{recursive:true});
const times=[0,...tl.scenes.map(s=>(s.start+s.end)/2),...Object.entries(tl.events).filter(([k])=>!k.endsWith('.enter')).map(([,v])=>v.at+.25),tl.duration-.1];
const frames=[...new Set(times.map(t=>Math.min(tl.durationInFrames-1,Math.round(t*tl.fps))))].sort((a,b)=>a-b);
const publicLink=path.join(project,'004-Render/review-bundle/public');
if(fs.existsSync(publicLink)&&fs.lstatSync(publicLink).isSymbolicLink())fs.unlinkSync(publicLink);
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),outDir:path.join(project,'004-Render/review-bundle'),symlinkPublicDir:true});
const browser=await openBrowser('chrome',{chromeMode:'chrome-for-testing',chromiumOptions:{gl:'angle'},logLevel:'warn'});
const inputProps={silent:true,audioFile:'projects/005-revisa-repo/mix.wav'};
try{
  const composition=await selectComposition({serveUrl,id:'RevisaRepoVideo',inputProps,puppeteerInstance:browser,logLevel:'warn'});
  for(const [i,frame] of frames.entries()){
    await renderStill({serveUrl,composition,inputProps,puppeteerInstance:browser,frame,scale:.5,imageFormat:'png',output:path.join(out,`${String(i).padStart(2,'0')}.png`),logLevel:'warn'});
    console.log(`${i+1}/${frames.length}  frame ${frame}  ${(frame/tl.fps).toFixed(2)}s`);
  }
}finally{await browser.close({silent:true});}
fs.writeFileSync(path.join(project,'004-Render/story-review-times.json'),JSON.stringify(frames.map(f=>({frame:f,time:f/tl.fps})),null,2)+'\n');
