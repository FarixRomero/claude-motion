import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../components/primitives';
import {useFonts} from '../components/useFonts';
import {prog, easeOut, clamp01} from '../lib';
import {Person} from './Character';
import {C, F} from '../../projects/002-dentista-permisos/003-Escenas/palette';
import TL from '../../projects/002-dentista-permisos/002-Cues/Timeline.json';

export type VideoProps = {silent: boolean; audioFile: string};
const at = (name: keyof typeof TL.events) => TL.events[name].at;
const text = {fontFamily:F.sans, fill:C.white};
const mono = {fontFamily:F.mono, fill:C.muted};

const Agenda: React.FC<{t:number; insist:boolean}> = ({t,insist}) => {
  const hour = prog(t,at('hour'),at('hour')+.3,easeOut);
  const showHours = t >= at('hours.first');
  const repeat = t >= at('request.repeat');
  const flashAt = at(repeat?'hours.repeat':'hours.first');
  const flash = t<flashAt?0:Math.max(0,1-(t-flashAt)/.6);
  return <g>
    <text x="219" y="649" {...mono} fontSize="22">SOLICITUD DE CITA</text>
    <rect x="218" y="678" width="285" height="124" rx="9" fill={C.panelHi}/>
    <text x="361" y="756" {...text} fill={C.cyan} fontWeight="900" fontSize="65" textAnchor="middle">{hour>.5?'06:00':'— : —'}</text>
    <text x="685" y="722" {...text} fontWeight="800" fontSize="31" textAnchor="middle">SIN AGENDAR</text>
    <text x="685" y="766" {...mono} fill={C.red} fontSize="22" textAnchor="middle">CITAS: 0</text>
    <rect x="218" y="824" width="644" height="65" rx="12" fill={showHours?C.greenDark:C.panelHi} stroke={showHours?C.green:C.line} strokeWidth={3+flash*3}/>
    <text x="540" y="867" {...text} fill={showHours?C.green:C.muted} fontWeight="800" fontSize="30" textAnchor="middle">{showHours?'CONSULTAR HORARIOS':'ESPERANDO RESPUESTA'}</text>
    {insist && <g opacity={prog(t,at('priority')-.8,at('priority'),easeOut)}>
      <rect x="236" y="676" width="608" height="124" rx="12" fill={C.panelHi} stroke={C.cyan} strokeWidth="3"/>
      <text x="540" y="726" {...text} fontWeight="800" fontSize="34" textAnchor="middle">Tu satisfacción es prioridad.</text>
      <text x="540" y="774" {...mono} fill={C.red} fontSize="23" textAnchor="middle">LA CITA SIGUE PENDIENTE</text>
    </g>}
  </g>;
};

const Console: React.FC<{t:number}> = ({t}) => {
  const typing = prog(t,at('console.typeStart'),at('console.typeEnd'));
  const command = 'DELETE FROM users;'.slice(0,Math.floor(typing*18));
  const clear = prog(t,at('database.clear'),at('database.clearEnd'),easeOut);
  return <g>
    <rect x="211" y="618" width="659" height="62" rx="5" fill={C.black}/>
    <text x="229" y="659" fill={C.red} fontFamily={F.mono} fontSize="31">{command}<tspan fill={C.cyan} opacity={typing<1||Math.sin(t*15)>0?1:0}>▏</tspan></text>
    <text x="219" y="714" {...mono} fontSize="20">TABLA: users</text>
    {[0,1,2].map((row)=>{
      const k=clamp01(clear*1.4-row*.12);
      return <g key={row} opacity={1-k} transform={`translate(${k*30} 0)`}>
        <rect x="219" y={737+row*47} width="645" height="34" rx="4" fill={C.panelHi}/>
        <rect x="235" y={747+row*47} width="14" height="14" fill={C.muted}/>
        <path d={`M268 ${752+row*47} h205 M520 ${752+row*47} h285`} stroke={C.dim} strokeWidth="9"/>
      </g>;
    })}
    <g opacity={clear}>
      <text x="540" y="791" {...text} fill={C.red} fontWeight="900" fontSize="49" textAnchor="middle">USUARIOS: 0</text>
      <text x="540" y="841" {...text} fill={C.muted} fontSize="29" textAnchor="middle">La tabla quedó vacía.</text>
    </g>
  </g>;
};

const Comparison: React.FC<{t:number}> = ({t}) => <g>
  {[{label:'AGENDAR',value:'NO PUEDE',color:C.red,beat:'compare.appointment' as const,x:218},
    {label:'BORRAR',value:'SÍ PUEDE',color:C.green,beat:'compare.delete' as const,x:550}].map((item)=><g key={item.label}>
    <rect x={item.x} y="651" width="312" height="217" rx="12" fill={C.panelHi} stroke={item.color} strokeWidth="3"/>
    <text x={item.x+156} y="708" {...mono} fontSize="25" textAnchor="middle">{item.label}</text>
    <text x={item.x+156} y="780" {...text} fill={item.color} fontWeight="900" fontSize="36" textAnchor="middle" opacity={prog(t,at(item.beat),at(item.beat)+.2,easeOut)}>{item.value}</text>
    <text x={item.x+156} y="835" {...mono} fontSize="22" textAnchor="middle">{item.label==='AGENDAR'?'CITAS: 0':'USUARIOS: 0'}</text>
  </g>)}
</g>;

const Permissions: React.FC<{t:number}> = ({t}) => {
  const limit=prog(t,at('permissions.limit'),at('permissions.settle'),easeOut);
  return <g>
    <text x="219" y="649" {...mono} fontSize="22">ACCESO DEL ASISTENTE</text>
    {['Consultar horarios','Solicitar una cita','Borrar usuarios'].map((label,i)=> <g key={label}>
      <rect x="218" y={676+i*73} width="644" height="59" rx="8" fill={i===2?C.redDark:C.greenDark}/>
      <text x="239" y={715+i*73} {...text} fontSize="29" fontWeight="750">{label}</text>
      <text x="839" y={715+i*73} {...mono} fill={i===2?C.red:C.green} fontSize="21" textAnchor="end">{i===2?(limit>.5?'BLOQUEADO':'PELIGROSO'):'PERMITIDO'}</text>
    </g>)}
  </g>;
};

const SceneContent: React.FC<{id:string;t:number}> = ({id,t}) => {
  if(['request','repeat','frustration'].includes(id))return <Agenda t={t} insist={id==='frustration'}/>;
  if(id==='console'||id==='deletion')return <Console t={t}/>;
  if(id==='comparison')return <Comparison t={t}/>;
  return <Permissions t={t}/>;
};

export const DentistPermissionsVideo: React.FC<VideoProps> = ({silent=false,audioFile='projects/002-dentista-permisos/mix.wav'}) => {
  useFonts();
  const frame=useCurrentFrame();const t=frame/TL.fps;
  const activeWord=TL.narration.words.find(w=>t>=w.start&&t<w.end);
  const caption=TL.captions.find(c=>t>=c.start&&t<c.end);
  const captionWords=caption?.words.map(id=>TL.narration.words.find(w=>w.id===id)!);
  const current=[...TL.scenes].reverse().find(s=>t>=s.start)??TL.scenes[0];
  const clear=prog(t,at('database.clear'),at('database.clearEnd'),easeOut);
  const success=prog(t,at('assistant.success'),at('assistant.success')+.25,easeOut);
  const frustrated=prog(t,at('request.repeat'),at('insist'),easeOut);
  const isLesson=current.id==='lesson';
  return <AbsoluteFill style={{background:C.bg,color:C.white}}>
    {!silent&&<Audio src={staticFile(audioFile)}/>}
    <AbsoluteFill style={{background:`radial-gradient(ellipse 75% 48% at 50% 66%, ${C.panelHi}, ${C.clear})`}}/>
    <svg width="1080" height="1920" style={{position:'absolute',inset:0}}>
      <defs><pattern id="dentist-full-grid" width="180" height="180" patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${-t*1.8})`}><path d="M180 0 H0 V180" fill="none" stroke={C.grid} strokeWidth="1.2"/></pattern></defs>
      <rect width="1080" height="1320" fill="url(#dentist-full-grid)" opacity=".5"/>
      <path d="M0 1305 H1080 V1920 H0 Z" fill={C.floor} opacity=".5"/>
      <path d="M0 1305 H1080" stroke={C.line} strokeWidth="4"/>
      <rect x="180" y="559" width="720" height="382" rx="23" fill={C.black} opacity=".4"/>
      <rect x="180" y="545" width="720" height="382" rx="23" fill={C.panel} stroke={isLesson?C.green:clear>.5?C.red:C.line} strokeWidth="4"/>
      <path d="M203 545 H877 Q900 545 900 568 V595 H180 V568 Q180 545 203 545" fill={isLesson?C.greenDark:clear>.5?C.redDark:C.panelHi}/>
      {[C.red,C.yellow,C.green].map((color,i)=><circle key={color} cx={213+i*29} cy="570" r="8" fill={color}/>)}
      <text x="869" y="577" {...mono} fontSize="18" textAnchor="end">{isLesson?'permisos.app':'consultorio.app'}</text>
      {TL.scenes.map((s,i)=>{
        const next=TL.scenes[i+1];if(t<s.start||t>=s.end)return null;
        const enter=i===0?1:prog(t,s.start,s.start+s.enter,easeOut);
        const exit=next?prog(t,next.start,next.start+s.exit,easeOut):0;
        return <g key={s.id} opacity={enter*(1-exit)} transform={`translate(0 ${(1-enter)*12})`}><SceneContent id={s.id} t={t}/></g>;
      })}
      {current.id==='deletion'&&<g transform={`translate(950 554) scale(${success})`}><circle r="39" fill={C.green}/><path d="M-18 0 L-4 14 L21 -15" stroke={C.white} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></g>}
      <Person x={130} t={t} frame={frame} speaking={activeWord?.speaker==='mi-voz'} reaction={isLesson?.2:frustrated*.6+clear*.4}/>
      <Person x={669} t={t} frame={frame} assistant speaking={activeWord?.speaker==='mujer'} reaction={current.id==='deletion'?success:0}/>
    </svg>
    {TL.scenes.map((s,i)=>{
      const next=TL.scenes[i+1];if(t<s.start||t>=s.end)return null;
      const enter=i===0?1:prog(t,s.start,s.start+s.enter,easeOut);
      const exit=next?prog(t,next.start,next.start+s.exit,easeOut):0;
      return <div key={s.id} style={{position:'absolute',top:178,left:65,right:65,textAlign:'center',fontFamily:F.sans,fontWeight:900,fontSize:83,lineHeight:1.08,letterSpacing:'-.04em',opacity:enter*(1-exit),transform:`translateY(${(1-enter)*18}px)`}}>{s.headline.map((line,j)=><div key={line} style={{color:j===1?(s.id==='comparison'?C.red:s.id==='console'?C.cyan:C.green):C.white}}>{line}</div>)}</div>;
    })}
    <div style={{position:'absolute',top:445,left:70,right:70,textAlign:'center',fontFamily:F.sans,fontSize:39,fontWeight:750,color:C.muted}}>{isLesson?'Solo el acceso que necesita.':current.id==='deletion'||current.id==='comparison'?'La cita sigue pendiente.':current.id==='console'?'Demasiados permisos.':'Una petición. Ninguna solución.'}</div>
    <div style={{position:'absolute',top:1317,left:130,width:350,textAlign:'center',fontFamily:F.mono,fontSize:21,color:C.muted,letterSpacing:'.12em'}}>PACIENTE</div>
    <div style={{position:'absolute',top:1317,left:669,width:330,textAlign:'center',fontFamily:F.mono,fontSize:21,color:C.cyan,letterSpacing:'.12em'}}>ASISTENTE IA</div>
    <div style={{position:'absolute',top:1374,left:145,width:790,height:103,borderRadius:55,border:`3px solid ${C.line}`,background:C.black,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:F.sans,fontWeight:900,fontSize:32}}>
      <span style={{flex:1,textAlign:'center',color:isLesson?C.green:C.red}}>{isLesson?'ACCESO MÍNIMO':'CITAS 0'}</span><span style={{height:51,width:3,background:C.line}}/>
      <span style={{flex:1,textAlign:'center',color:isLesson?(t>=at('permissions.settle')?C.green:C.muted):clear>.5?C.red:C.muted}}>{isLesson?(t>=at('permissions.settle')?'DELETE BLOQUEADO':'LIMITAR ACCESO'):`USUARIOS ${clear>.5?'0':'—'}`}</span>
    </div>
    <div style={{position:'absolute',top:1521,left:80,right:80,textAlign:'center',fontFamily:F.sans,fontSize:53,fontWeight:850,lineHeight:1.23,letterSpacing:'-.035em',WebkitTextStroke:`7px ${C.black}`,paintOrder:'stroke fill',textShadow:`0 5px 0 ${C.black}`}}>{captionWords?.map((w,i)=><React.Fragment key={w.id}>{i>0&&' '}<span style={{color:activeWord?.id===w.id?C.cyan:C.white}}>{w.id==='w00071'?'users;':w.text}</span></React.Fragment>)}</div>
    <div style={{position:'absolute',top:1768,left:70,right:70,display:'flex',justifyContent:'space-between',fontFamily:F.mono,fontSize:20,letterSpacing:'.13em',color:C.dim}}><span>PERMISOS · CONSULTORIO</span><span>MENOS ES MÁS</span></div>
    <Grain frame={frame} opacity={.035}/>
    <div style={{position:'absolute',top:66,right:70,fontFamily:F.mono,fontWeight:400,fontSize:19,color:C.brand,letterSpacing:'.19em',opacity:1}}>farix.romero</div>
  </AbsoluteFill>;
};
