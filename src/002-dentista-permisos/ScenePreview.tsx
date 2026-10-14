import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../components/primitives';
import {useFonts} from '../components/useFonts';
import {prog, easeOut, clamp01} from '../lib';
import {Person} from './Character';
import {C, F} from '../../projects/002-dentista-permisos/003-Escenas/palette';
import TL from '../../projects/002-dentista-permisos/002-Cues/Timeline.json';

const at = (name: keyof typeof TL.events) => TL.events[name].at;


export const DentistScenePreview: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / TL.fps;
  useFonts();
  const clear = prog(t, at('database.clear'), at('database.clearEnd'), easeOut);
  const success = prog(t, at('assistant.success'), at('assistant.success') + .25, easeOut);
  const activeWord = TL.narration.words.find((w) => t >= w.start && t < w.end);
  const caption = TL.captions.find((c) => t >= c.start && t < c.end);
  const captionWords = caption?.words.map((id) => TL.narration.words.find((w) => w.id === id)!);
  return <AbsoluteFill style={{background: C.bg, color: C.white}}>
    <Audio src={staticFile('projects/002-dentista-permisos/mix.wav')} />
    <AbsoluteFill style={{background: `radial-gradient(ellipse 75% 48% at 50% 66%, ${C.panelHi}, ${C.clear})`}} />
    <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
      <defs><pattern id="dentist-grid" width="180" height="180" patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${-t * 1.8})`}>
        <path d="M180 0 H0 V180" fill="none" stroke={C.grid} strokeWidth="1.2" />
      </pattern></defs>
      <rect width="1080" height="1320" fill="url(#dentist-grid)" opacity=".5" />
      <path d="M0 1305 H1080 V1920 H0 Z" fill={C.floor} opacity=".5" />
      <path d="M0 1305 H1080" stroke={C.line} strokeWidth="4" />
      <rect x="180" y="559" width="720" height="382" rx="23" fill={C.black} opacity=".4" />
      <rect x="180" y="545" width="720" height="382" rx="23" fill={C.panel} stroke={clear > .5 ? C.red : C.line} strokeWidth="4" />
      <path d="M203 545 H877 Q900 545 900 568 V595 H180 V568 Q180 545 203 545" fill={clear > .5 ? C.redDark : C.panelHi} />
      {[C.red,C.yellow,C.green].map((color,i)=><circle key={color} cx={213+i*29} cy="570" r="8" fill={color} />)}
      <text x="869" y="577" textAnchor="end" fill={C.muted} fontFamily={F.mono} fontSize="18">consultorio.app</text>
      <rect x="211" y="618" width="659" height="62" rx="5" fill={C.black} />
      <text x="229" y="659" fill={C.red} fontFamily={F.mono} fontSize="31">DELETE FROM <tspan fill={C.white}>users;</tspan></text>
      <text x="219" y="714" fill={C.muted} fontFamily={F.mono} fontSize="20">TABLA: users</text>
      {[0,1,2].map((row)=> {
        const k = clamp01(clear * 1.4 - row * .12);
        return <g key={row} opacity={1-k} transform={`translate(${k*30} 0)`}>
          <rect x="219" y={737+row*47} width="645" height="34" rx="4" fill={C.panelHi} />
          <rect x="235" y={747+row*47} width="14" height="14" fill={C.muted} />
          <path d={`M268 ${752+row*47} h205 M520 ${752+row*47} h285`} stroke={C.dim} strokeWidth="9" />
        </g>;
      })}
      <g opacity={clear}>
        <text x="540" y="791" fill={C.red} fontFamily={F.sans} fontWeight="900" fontSize="49" textAnchor="middle">USUARIOS: 0</text>
        <text x="540" y="841" fill={C.muted} fontFamily={F.sans} fontSize="29" textAnchor="middle">La tabla quedó vacía.</text>
      </g>
      <g transform={`translate(950 554) scale(${success})`}>
        <circle r="39" fill={C.green} />
        <path d="M-18 0 L-4 14 L21 -15" stroke={C.white} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <Person x={130} t={t} frame={frame} speaking={activeWord?.speaker==='mi-voz'} reaction={.35+clear*.65} />
      <Person x={669} t={t} frame={frame} assistant speaking={activeWord?.speaker==='mujer'} reaction={success} />
    </svg>
    <div style={{position:'absolute',top:178,left:65,right:65,textAlign:'center',fontFamily:F.sans,fontWeight:900,fontSize:83,lineHeight:1.08,letterSpacing:'-.04em'}}>
      <div>¡OPERACIÓN</div><div style={{color:C.green}}>EXITOSA!</div>
    </div>
    <div style={{position:'absolute',top:445,left:70,right:70,textAlign:'center',fontFamily:F.sans,fontSize:39,fontWeight:750,color:C.muted}}>La cita sigue pendiente.</div>
    <div style={{position:'absolute',top:1317,left:130,width:350,textAlign:'center',fontFamily:F.mono,fontSize:21,color:C.muted,letterSpacing:'.12em'}}>PACIENTE</div>
    <div style={{position:'absolute',top:1317,left:669,width:330,textAlign:'center',fontFamily:F.mono,fontSize:21,color:C.cyan,letterSpacing:'.12em'}}>ASISTENTE IA</div>
    <div style={{position:'absolute',top:1374,left:145,width:790,height:103,borderRadius:55,border:`3px solid ${C.line}`,background:C.black,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:F.sans,fontWeight:900,fontSize:32}}>
      <span style={{flex:1,textAlign:'center',color:C.red}}>CITAS 0</span><span style={{height:51,width:3,background:C.line}} />
      <span style={{flex:1,textAlign:'center',color:clear>.5?C.red:C.muted}}>USUARIOS {clear>.5?'0':'—'}</span>
    </div>
    <div style={{position:'absolute',top:1521,left:80,right:80,textAlign:'center',fontFamily:F.sans,fontSize:53,fontWeight:850,lineHeight:1.23,letterSpacing:'-.035em',WebkitTextStroke:`7px ${C.black}`,paintOrder:'stroke fill',textShadow:`0 5px 0 ${C.black}`}}>
      {captionWords?.map((w,i)=><React.Fragment key={w.id}>{i>0&&' '}<span style={{color:activeWord?.id===w.id?C.cyan:C.white}}>{w.text}</span></React.Fragment>)}
    </div>
    <div style={{position:'absolute',top:1768,left:70,right:70,display:'flex',justifyContent:'space-between',fontFamily:F.mono,fontSize:20,letterSpacing:'.13em',color:C.dim}}><span>PERMISOS · CONSULTORIO</span><span>BORRADOR</span></div>
    <Grain frame={frame} opacity={.035} />
    <div style={{position:'absolute',top:66,right:70,fontFamily:F.mono,fontWeight:400,fontSize:19,color:C.brand,letterSpacing:'.19em',opacity:1}}>farix.romero</div>
  </AbsoluteFill>;
};
