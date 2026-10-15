import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {Bloom, DepthOfField, EffectComposer, ToneMapping} from '@react-three/postprocessing';
import {ToneMappingMode} from 'postprocessing';
import {PerspectiveCamera} from 'three';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFonts} from '../components/useFonts';
import {easeOut, prog} from '../lib';
import {HumanHead} from './HumanHead';
import {CubeCharacter} from './CubeCharacter';
import {BackgroundLights, CaptureBarrier} from './CloseUpScene';
import {C,F,TL,at,activeScene} from './video-design';
import {delayRender} from 'remotion';
import CONTENT from '../../projects/005-low-poly-tokens/003-Escenas/content.json';

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
  const dolly=prog(t,s.start,s.end,easeOut);
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
        <HumanHead rotation={[0,wide?.13:-.11,0]} talking={turn?.speaker==='Yo'} audioVolume={volume} surprised={scene==='files'||scene==='outrage'||scene==='silence'}/>
        <group visible={wide}>
          {[-1,1].map(side=><group key={side} position={[side*1.18,-1.65,0]} rotation={[0,0,side*((turn?.speaker==='Yo'?.35:.12)+(scene==='files'||scene==='outrage'?.28:0))]}><mesh position={[0,-.43,0]}><boxGeometry args={[.48,.95,.7]}/><meshStandardMaterial color={C.torso} roughness={.85} flatShading/></mesh><mesh position={[0,-1.02,.04]}><icosahedronGeometry args={[.28,0]}/><meshStandardMaterial color={C.face} roughness={.85} flatShading/></mesh></group>)}
          {[-.5,.5].map(x=><mesh key={x} position={[x,-3.93,.08]}><boxGeometry args={[.45,.65,.65]}/><meshStandardMaterial color={C.cap} roughness={.85} flatShading/></mesh>)}
        </group>
      </group>
      <group visible={wide||!human} position={wide?[1.15,2.2,0]:[0,0,0]} scale={wide?.7:.88}>
        <CubeCharacter color={C.claude} rotation={[0,-.16,0]} talking={turn?.speaker==='Claude'} audioVolume={volume}/>
      </group>
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
const Row: React.FC<{label:string;value:string;color?:string}> = ({label,value,color=C.white}) => <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${C.border}`,fontSize:27}}><span style={{color:C.muted}}>{label}</span><b style={{color,fontSize:32}}>{value}</b></div>;
const Code: React.FC<{locked?:boolean}> = ({locked=false}) => <div style={{fontFamily:F.mono,fontSize:32,lineHeight:1.35,padding:'15px 24px',background:C.background,borderRadius:15}}><div><span style={{color:C.cyan}}>const </span><span style={{color:C.gold}}>{CONTENT.originalVariable}</span><span style={{color:C.white}}> = 'Farix';</span></div><div style={{fontSize:20,color:locked?C.red:C.muted,marginTop:10}}>{locked?'// sin modificaciones':`// pedido: ${CONTENT.originalVariable} → ${CONTENT.targetVariable}`}</div></div>;

const Interface: React.FC<{id:string;t:number;shot:string}> = ({id,t,shot}) => {
  if(shot==='human')return null;
  // La pausa mantiene el panel anterior y su cámara, sin volver a entrar.
  if(id==='silence')id='permission';
  const s=id==='permission'?TL.scenes.find(s=>s.id==='permission')!:activeScene(t);
  const enter=prog(t,s.start,s.start+s.enter,easeOut);
  const compact=shot==='claude';
  let content: React.ReactNode;
  if(id==='complete')content=<div style={{padding:'24px 30px',display:'flex',alignItems:'center',gap:22}}><span style={{color:C.green,fontSize:58}}>✓</span><div><b style={{fontSize:39,color:C.green}}>Solicitud completada</b><div style={{fontFamily:F.mono,fontSize:23,color:C.muted,marginTop:9}}>quality_check: passed</div></div></div>;
  else if(id==='tokens')content=<div style={{padding:'20px 28px'}}><Row label="Tokens restantes" value="0 %" color={C.red}/><div style={{height:10,background:C.border,borderRadius:10,margin:'13px 0 22px'}}/><Code/></div>;
  else if(id==='audit')content=<div style={{padding:'22px 30px'}}><Row label="Archivos del proyecto" value={t>=at('files.count')?String(CONTENT.files):'Analizando…'} color={C.gold}/><div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:5,marginTop:16}}>{Array.from({length:48},(_,i)=><div key={i} style={{height:18,borderRadius:3,background:i/48<prog(t,s.start,at('files.count')+.45,easeOut)?C.gold:C.border,opacity:.6}}/>)}</div><div style={{fontFamily:F.mono,fontSize:22,color:C.muted,marginTop:14}}>src / tests / config / packages / docs</div></div>;
  else if(id==='work')content=<div style={{padding:'16px 30px'}}><Row label="Archivos analizados" value={String(CONTENT.files)} color={C.gold}/><Row label="Pruebas ejecutadas" value={t>=at('tests.count')?String(CONTENT.tests):'…'} color={C.green}/><Row label="Documentos generados" value={t>=at('docs.count')?String(CONTENT.documents):'…'} color={C.cyan}/></div>;
  else if(id==='bill')content=<div style={{padding:'20px 30px'}}><div style={{fontSize:26,color:C.muted,letterSpacing:'.10em'}}>FACTURA DEL ASISTENTE</div><Row label="Análisis del repositorio" value={`${CONTENT.files} archivos`}/><Row label="Solicitud original" value="1 variable"/><div style={{fontSize:29,color:C.red,marginTop:20}}>Costo confirmado · {CONTENT.bill} dólares</div></div>;
  else if(id==='permission')content=<div style={{padding:'17px 28px'}}><Row label="Cambios realizados" value={t>=at('changes.zero')?'0':'…'} color={C.red}/><Code locked/><div style={{display:'flex',alignItems:'center',gap:15,marginTop:18,color:C.gold,fontSize:26}}><span style={{fontFamily:F.mono}}>▣</span> Esperando autorización para editar</div></div>;
  else content=<div style={{padding:'17px 30px'}}><Row label="Ya gastados" value={`$${CONTENT.bill}`} color={C.muted}/><Row label="Costo adicional estimado" value={t>=at('estimate.total')?`$${CONTENT.estimate}`:'…'} color={C.red}/><div style={{display:'flex',justifyContent:'space-between',marginTop:22,gap:18}}><div style={{flex:1,border:`1px solid ${C.border}`,borderRadius:12,padding:14,textAlign:'center',fontSize:25,color:C.muted}}>Cancelar</div><div style={{flex:1,border:`1px solid ${C.red}`,borderRadius:12,padding:14,textAlign:'center',fontSize:25,color:C.red}}>¿Continuar?</div></div></div>;
  return <div style={{position:'absolute',left:100,right:100,top:compact?265:370,...panelStyle,opacity:enter,transform:`translateY(${(1-enter)*20}px)`}}><div style={{height:47,display:'flex',alignItems:'center',padding:'0 22px',gap:10,borderBottom:`1px solid ${C.border}`,background:C.panelHi}}>{[C.red,C.gold,C.green].map(color=><i key={color} style={{display:'block',width:9,height:9,borderRadius:5,background:color}}/>)}<span style={{fontFamily:F.mono,fontSize:19,color:C.muted,marginLeft:13}}>workspace / agent</span></div>{content}</div>;
};

const Title: React.FC<{id:string;t:number}> = ({id,t}) => {
  let lines: string[];let color:string=C.white;let size=78;
  switch(id){
    case 'tokens':lines=['TOKENS','AGOTADOS'];color=C.red;break;
    case 'complete':lines=['¡COMPLETADO!'];color=C.green;size=89;break;
    case 'variable':lines=['SOLO UNA','VARIABLE'];break;
    case 'audit':lines=[`${CONTENT.files} ARCHIVOS`];color=C.gold;size=96;break;
    case 'files':lines=[`¿${CONTENT.files} ARCHIVOS?`];size=91;break;
    case 'work':lines=t>=at('docs.count')?[`${CONTENT.documents} DOCUMENTOS`]:t>=at('tests.count')?[`${CONTENT.tests} PRUEBAS`]:['REVISIÓN','EXHAUSTIVA'];color=C.gold;break;
    case 'ask':lines=['¿CUÁNTO','COSTÓ?'];break;
    case 'bill':lines=[`$${CONTENT.bill}`];color=C.red;size=172;break;
    case 'outrage':lines=t>=at('variable.question')?['¿CAMBIÓ LA','VARIABLE?']:[`¡${CONTENT.bill} DÓLARES!`];color=t>=at('variable.question')?C.white:C.red;size=t>=at('variable.question')?78:98;break;
    case 'permission':lines=['FALTA TU','AUTORIZACIÓN'];color=C.red;size=77;break;
    case 'silence':lines=['…'];size=115;break;
    default:lines=['¿CONTINUAR?',t>=at('estimate.total')?`+$${CONTENT.estimate}`:''];color=C.red;size=87;
  }
  const overrides=CONTENT.headlines as Record<string,string[]>;
  lines=overrides[id]??lines;
  const hero=id==='bill'?1+Math.sin(clamp((t-at('invoice.total'))/.45)*Math.PI)*.08:1;
  return <div style={{position:'absolute',left:65,right:65,top:145,textAlign:'center',fontWeight:900,fontFamily:F.sans,fontSize:size,lineHeight:1.04,letterSpacing:'-.045em',color,transform:`scale(${hero})`,textShadow:`0 4px 25px ${C.background}`}}>{lines.map((line,i)=><div key={i}>{line}</div>)}</div>;
};

export const LowPolyTokensVideo: React.FC<TokensVideoProps> = ({silent,audioFile}) => {
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const t=frame/fps;useFonts();
  const s=activeScene(t);const handle=useMemo(()=>delayRender('Escena 3D y postprocesado'),[frame]);
  const caption=TL.captions.find(c=>t>=c.start&&t<c.end);
  return <AbsoluteFill style={{background:C.background,color:C.white,fontFamily:F.sans}}>
    <Stage t={t} frame={frame} shot={s.shot} scene={s.id} handle={handle}/>
    <Title id={s.id} t={t}/>
    <Interface id={s.id} t={t} shot={s.shot}/>
    <div style={{position:'absolute',top:66,right:70,fontFamily:F.mono,fontWeight:400,fontSize:19,color:C.trademark,letterSpacing:'.19em',opacity:1}}>farix.romero</div>
    <div style={{position:'absolute',left:72,top:69,fontFamily:F.mono,fontSize:17,color:C.muted,letterSpacing:'.13em'}}>UNA VARIABLE</div>
    <div style={{position:'absolute',left:72,right:72,top:1650,textAlign:'center',textShadow:`0 3px 12px ${C.background},0 2px 3px ${C.background}`}}>
      <div style={{fontFamily:F.mono,fontSize:20,letterSpacing:'.16em',marginBottom:20,color:caption?.speaker==='Yo'?C.torso:C.claude}}>{caption?(caption.speaker==='Yo'?'TÚ':'CLAUDE'):''}</div>
      <div style={{fontSize:53,fontWeight:750,lineHeight:1.2,whiteSpace:'normal',overflowWrap:'break-word',letterSpacing:'-.025em'}}>{caption?.words.length?caption.words.map((w,i)=><React.Fragment key={w.id}><span style={{color:t>=w.start&&t<w.end?C.cyan:C.white}}>{w.text}</span>{i<caption.words.length-1?' ':''}</React.Fragment>):caption?.text??''}</div>
    </div>
    <div style={{position:'absolute',left:72,bottom:80,fontFamily:F.mono,fontSize:17,color:C.muted,letterSpacing:'.12em'}}>{CONTENT.originalVariable} → {CONTENT.targetVariable}</div>
    {!silent&&<Audio src={staticFile(audioFile)}/>}
  </AbsoluteFill>;
};
