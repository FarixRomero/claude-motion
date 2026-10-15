import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {Bloom, DepthOfField, EffectComposer, ToneMapping} from '@react-three/postprocessing';
import {ToneMappingMode} from 'postprocessing';
import {PerspectiveCamera} from 'three';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFonts} from '../components/useFonts';
import {easeOut, easeInOut, prog} from '../lib';
import {HumanHead} from './HumanHead';
import {CubeCharacter} from './CubeCharacter';
import {Disappearance} from './Disappearance';
import {BackgroundLights, CaptureBarrier} from './CloseUpScene';
import {C,F,TL,at,activeScene} from './video-design';
import {delayRender} from 'remotion';
import CONTENT from '../../projects/006-envio-prd/003-Escenas/content.json';

export type TokensVideoProps = {silent:boolean;audioFile:string};
const clamp = (n:number) => Math.max(0,Math.min(1,n));

const Keyboard: React.FC = () => (
  <group>
    <mesh position={[0,.67,1.3]}><boxGeometry args={[8,.15,4.6]}/><meshStandardMaterial color={C.keyboard} roughness={.85} flatShading/></mesh>
    {Array.from({length:35},(_,i)=><mesh key={i} position={[(i%7-3)*1.08,.82,Math.floor(i/7)*.86-.4]}><boxGeometry args={[.98,.2,.76]}/><meshStandardMaterial color={C.keyTop} roughness={.85} flatShading/></mesh>)}
  </group>
);

const Stage: React.FC<{t:number;frame:number;shot:string;scene:string;handle:number}> = ({t,frame,shot,scene,handle}) => {
  const {width,height}=useVideoConfig();
  const wide=shot==='wide', human=shot==='human';
  const camera=useMemo(()=>new PerspectiveCamera(38,width/height,.1,40),[width,height]);
  // Una pista continua conserva el encuadre de autorización durante el cierre.
  const s=TL.scenes.find(s=>s.id===activeScene(t).cameraTrack)!;
  const dolly=prog(t,TL.motion.cameraStart,TL.motion.cameraEnd,easeOut);
  const departure=prog(t,TL.motion.departureStart,TL.motion.departureEnd,easeInOut);
  camera.position.set(wide?0:.08,wide?3:human?.12:-.16,wide?11.8-dolly*.25:7.15-dolly*.32);
  camera.lookAt(wide?0:.02,wide?3:human?.12:-.16,0);camera.updateMatrixWorld();
  const turn=TL.narration.turns.find(tr=>t>=tr.start&&t<tr.end);
  const volume=TL.speechEnvelope[Math.min(frame,TL.speechEnvelope.length-1)]??0;
  const warm: [number,number,number]=wide?[-2.4,1.5,4]:[-2.2,-1.8,3];
  return (
    <ThreeCanvas width={width} height={height} camera={camera} dpr={1} gl={{antialias:false,alpha:false}}>
      <color attach="background" args={[C.background]}/>
      <ambientLight color={C.face} intensity={.075}/>
      <pointLight color={C.key} position={warm} intensity={46} decay={2} distance={20}/>
      <directionalLight color={C.rim} position={[-4,wide?5:2.6,-3]} intensity={3.8}/>
      <group position={[0,wide?2.3:0,0]}><BackgroundLights/></group>
      <group visible={wide||human} position={wide?[-1.1,3.05,0]:[0,0,0]} scale={wide?.5:1}>
        <HumanHead rotation={[0,wide?.13:-.11,0]} talking={turn?.speaker==='Yo'} audioVolume={volume} surprised={activeScene(t).reaction}/>
        <group visible={wide}>
          {[-1,1].map(side=><group key={side} position={[side*1.18,-1.65,0]} rotation={[0,0,side*((turn?.speaker==='Yo'?.35:.12)+(activeScene(t).reaction?.28:0))]}><mesh position={[0,-.43,0]}><boxGeometry args={[.48,.95,.7]}/><meshStandardMaterial color={C.torso} roughness={.85} flatShading/></mesh><mesh position={[0,-1.02,.04]}><icosahedronGeometry args={[.28,0]}/><meshStandardMaterial color={C.face} roughness={.85} flatShading/></mesh></group>)}
          {[-.5,.5].map(x=><mesh key={x} position={[x,-3.93,.08]}><boxGeometry args={[.45,.65,.65]}/><meshStandardMaterial color={C.cap} roughness={.85} flatShading/></mesh>)}
        </group>
      </group>
      <group visible={(wide||!human)&&departure<1} position={wide?[1.15,2.2,0]:[0,0,0]} scale={wide?.7:.88}>
        <CubeCharacter opacity={1-departure} color={C.claude} rotation={[0,-.16,0]} talking={turn?.speaker==='Claude'} audioVolume={volume}/>
      </group>
      <Disappearance progress={departure}/>
      <group visible={wide}><Keyboard/></group>
      <EffectComposer multisampling={4} enableNormalPass={false}>
        <Bloom luminanceThreshold={.6} luminanceSmoothing={.35} intensity={1.2} mipmapBlur/>
        <DepthOfField target={[0,wide?2.5:0,wide?.5:1.02]} worldFocusRange={wide?4:2.1} bokehScale={5} height={480}/>
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC}/>
        <CaptureBarrier handle={handle}/>
      </EffectComposer>
    </ThreeCanvas>
  );
};

const panelStyle: React.CSSProperties={background:C.panel,border:`2px solid ${C.border}`,borderRadius:24,boxShadow:`0 18px 45px ${C.background}aa`,overflow:'hidden'};
const tone=(name:string):string=>({error:C.red,success:C.green,gold:C.gold,cyan:C.cyan,white:C.white,orange:C.claude}[name]??C.white);
type SceneInfo=(typeof TL.scenes)[number];
const cost=(t:number)=>{
  const steps=[['cost.ten',10],['cost.hundred',100],['cost.thousand',1000]] as const;
  let value=0,previous=0;
  for(const [event,next] of steps){if(t>=at(event)){value=interpolate(t,[at(event),at(event)+.22],[previous,next],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});}previous=next;}
  return Math.round(value);
};
const Panel:React.FC<{s:SceneInfo;t:number;opacity:number}> = ({s,t,opacity})=><div style={{position:'absolute',left:100,right:100,top:370,height:320,...panelStyle,opacity}}>
  <div style={{height:47,display:'flex',alignItems:'center',padding:'0 22px',gap:10,borderBottom:`1px solid ${C.border}`,background:C.panelHi}}>{[C.red,C.gold,C.green].map(color=><i key={color} style={{display:'block',width:9,height:9,borderRadius:5,background:color}}/>)}<span style={{fontFamily:F.mono,fontSize:19,color:C.muted,marginLeft:13}}>{CONTENT.panelHeader}</span></div>
  <div style={{padding:'22px 28px'}}>
    {s.layout==='code'?<div style={{fontFamily:F.mono,fontSize:30,lineHeight:1.35,background:C.background,borderRadius:15,padding:'14px 22px'}}><div style={{color:C.cyan}}>deploy <span style={{color:C.gold}}>--env production</span></div><div style={{fontSize:26,color:C.red,marginTop:16}}>último cambio: pendiente</div><div style={{fontSize:24,color:C.muted,marginTop:12}}>{s.id==='punchline'?(t>=at('claude.gone')?'Claude: sin conexión':'Claude: desconectando…'):'esperando despliegue'}</div></div>:null}
    {s.layout==='list'?s.rows.map((r,i)=>{const revealed=!r.event||t>=at(r.event);return <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',minHeight:54,borderBottom:i<s.rows.length-1?`1px solid ${C.border}`:undefined}}><div style={{color:C.muted,fontSize:27}}>{r.label}</div><div style={{fontSize:r.value.length>22?26:30,color:revealed?tone(r.tone):C.muted,fontWeight:750}}>{revealed?r.value:'…'}</div></div>;}):null}
    {s.layout==='counter'?<><div style={{fontSize:25,color:C.muted}}>{s.status}</div><div style={{fontFamily:F.sans,fontSize:132,fontWeight:900,lineHeight:1.2,color:t>=at('cost.thousand')?C.red:C.gold,letterSpacing:'-.04em',marginTop:5}}>${cost(t).toLocaleString('es-PE')}</div><div style={{fontFamily:F.mono,fontSize:20,color:C.red}}>API · credencial expuesta</div></>:null}
    {s.layout==='status'?<><div style={{fontSize:34,fontWeight:700,lineHeight:1.2,color:tone(s.tone),padding:'10px 2px'}}>{s.id==='farewell'&&t>=at('claude.departure')?'Desconectando…':s.status}</div><div style={{height:9,background:C.border,borderRadius:8,marginTop:28,overflow:'hidden'}}><div style={{width:`${s.id==='deploy'?prog(t,s.start,s.end,easeOut)*90:100}%`,height:'100%',background:tone(s.tone),opacity:.6}}/></div></>:null}
  </div>
</div>;
const titleState=(t:number)=>{
  const s=activeScene(t);let lines=s.headline,color=s.tone,start=s.start;
  for(const v of s.headlineEvents)if(t>=at(v.event)){lines=v.lines;color=v.tone;start=at(v.event);}
  return {s,lines,color,start};
};
const Heading:React.FC<{state:ReturnType<typeof titleState>;opacity:number;offset:number}>=({state,opacity,offset})=><div style={{position:'absolute',left:65,right:65,top:145,textAlign:'center',fontWeight:900,fontFamily:F.sans,fontSize:state.s.size,lineHeight:1.04,letterSpacing:'-.045em',color:tone(state.color),opacity,transform:`translateY(${offset}px)`,textShadow:`0 4px 25px ${C.background}`}}>{state.lines.map((line,i)=><div key={i}>{line}</div>)}</div>;
const Overlay:React.FC<{t:number}>=({t})=>{
  const s=activeScene(t),heading=titleState(t);
  const titleP=heading.start<=0?1:prog(t,heading.start,heading.start+TL.motion.transition,easeOut);
  const panelP=s.start<=0?1:prog(t,s.start,s.start+TL.motion.transition,easeOut);
  return <>
    {titleP<1&&<Heading state={titleState(Math.max(0,heading.start-.0001))} opacity={1-titleP} offset={-5*titleP}/>}
    <Heading state={heading} opacity={titleP} offset={5*(1-titleP)}/>
    {panelP<1&&<Panel s={activeScene(Math.max(0,s.start-.0001))} t={t} opacity={1-panelP}/>}
    <Panel s={s} t={t} opacity={panelP}/>
  </>;
};
export const EnvioPrdVideo: React.FC<TokensVideoProps> = ({silent,audioFile}) => {
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;useFonts();
  const s=activeScene(t);const handle=useMemo(()=>delayRender('Escena 3D y postprocesado'),[frame]);
  const caption=TL.captions.find(c=>t>=c.start&&t<c.end);
  return <AbsoluteFill style={{background:C.background,color:C.white,fontFamily:F.sans}}>
    <Stage t={t} frame={frame} shot={s.shot} scene={s.id} handle={handle}/>
    <Overlay t={t}/>
    <div style={{position:'absolute',top:66,right:70,fontFamily:F.mono,fontWeight:400,fontSize:19,color:C.trademark,letterSpacing:'.19em',opacity:1}}>farix.romero</div>
    <div style={{position:'absolute',left:72,top:69,fontFamily:F.mono,fontSize:17,color:C.muted,letterSpacing:'.13em'}}>ENVÍO A PRODUCCIÓN</div>
    <div style={{position:'absolute',left:72,right:72,top:1650,textAlign:'center',textShadow:`0 3px 12px ${C.background},0 2px 3px ${C.background}`}}>
      <div style={{fontFamily:F.mono,fontSize:20,letterSpacing:'.16em',marginBottom:20,color:caption?.speaker==='Yo'?C.torso:C.claude}}>{caption?(caption.speaker==='Yo'?'TÚ':'CLAUDE'):''}</div>
      <div style={{fontSize:53,fontWeight:750,lineHeight:1.2,whiteSpace:'normal',overflowWrap:'break-word',letterSpacing:'-.025em'}}>{caption?.words.length?caption.words.map((w,i)=><React.Fragment key={w.id}><span style={{color:t>=w.start&&t<w.end?C.cyan:C.white}}>{w.text}</span>{i<caption.words.length-1?' ':''}</React.Fragment>):''}</div>
    </div>
    <div style={{position:'absolute',left:72,bottom:80,fontFamily:F.mono,fontSize:17,color:C.muted,letterSpacing:'.12em'}}>{CONTENT.footer}</div>
    {!silent&&<Audio src={staticFile(audioFile)}/>}
  </AbsoluteFill>;
};
