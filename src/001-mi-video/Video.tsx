import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Grain, Mask, Roll} from '../components/primitives';
import {useFonts} from '../components/useFonts';
import {clamp01, easeIn, easeOut, lerp, prog, sp} from '../lib';
import {beat, C, F, scene, TL} from './design';
import {Character} from './Character';

export type VideoProps = {silent: boolean; audioFile: string};
const W = 1080;
const H = 1920;

const Headline: React.FC<{lines: string[]; accent?: number; error?: boolean}> = ({lines, accent = 1, error = false}) => (
  <div style={{position: 'absolute', left: 65, right: 65, top: 178, textAlign: 'center', fontFamily: F.sans,
    fontWeight: 900, fontSize: 83, lineHeight: 1.08, letterSpacing: '-0.04em'}}>
    {lines.map((line, i) => <div key={i} style={{color: i === accent ? error ? C.red : C.green : C.white}}>{line}</div>)}
  </div>
);

const Layer: React.FC<{id: string; t: number; children: React.ReactNode}> = ({id, t, children}) => {
  const s = scene(id);
  if (t < s.start || t >= s.end) return null;
  const enter = id === 'book' ? 1 : prog(t, s.start + 0.05, s.start + s.enter, easeOut);
  const exit = id === 'lesson' ? 0 : prog(t, s.end - s.exit - 0.15, s.end - 0.15, easeIn);
  return <AbsoluteFill style={{opacity: enter * (1 - exit)}}>{children}</AbsoluteFill>;
};

const Frame: React.FC<{title: string; error?: number; children: React.ReactNode; y?: number; h?: number}> = ({title, error = 0, children, y = 645, h = 364}) => (
  <g transform="translate(0 -100)">
    <rect x="180" y={y + 14} width="720" height={h} rx="23" fill={C.black} opacity={0.4} />
    <rect x="180" y={y} width="720" height={h} rx="23" fill={C.panel} stroke={error > 0.5 ? C.red : C.green} strokeWidth="4" />
    <path d={`M203 ${y} H877 Q900 ${y} 900 ${y + 23} V${y + 50} H180 V${y + 23} Q180 ${y} 203 ${y}`} fill={error > 0.5 ? C.redDark : C.greenDark} />
    {[C.red, C.yellow, C.green].map((color, i) => <circle key={color} cx={213 + i * 29} cy={y + 25} r="8" fill={color} />)}
    <text x="869" y={y + 32} fill={C.muted} fontFamily={F.mono} fontSize="18" textAnchor="end">{title}</text>
    {children}
  </g>
);

const Network: React.FC<{k: number; broken?: number; t: number}> = ({k, broken = 0, t}) => (
  <g>
    <g opacity={1 - k}>
      <rect x="361" y="733" width="358" height="205" rx="9" fill={C.panelHi} stroke={C.green} strokeWidth="3" />
      <path d="M415 802 L438 784 L438 820 Z M665 802 L642 784 L642 820 Z" fill={C.green} />
      <text x="540" y="825" fontFamily={F.sans} fontWeight="800" fontSize="37" fill={C.white} textAnchor="middle">MONOLITO</text>
      <text x="540" y="887" fontFamily={F.mono} fontSize="20" fill={C.muted} textAnchor="middle">empresa.app</text>
    </g>
    <g opacity={k}>
      {Array.from({length: 30}, (_, i) => {
        const col = i % 6;
        const row = Math.floor(i / 6);
        const x = lerp(497, 215 + col * 113, k);
        const y = lerp(810, 719 + row * 49, k);
        const red = broken > 0.5;
        return <g key={i}>
          {col < 5 && <path d={`M${x + 84} ${y + 16} h${red ? 8 : 29}`} stroke={red ? C.red : C.dim} strokeWidth="3" opacity={red ? 0.8 : 0.5} />}
          <rect x={x} y={y} width="84" height="33" rx="3" fill={red ? C.redDark : C.panelHi} stroke={red ? C.red : C.green} strokeWidth="2" />
          <rect x={x + 8} y={y + 10} width="11" height="11" fill={red ? C.red : C.green} opacity={0.75 + Math.sin(t * 2 + i) * 0.15} />
          <path d={`M${x + 31} ${y + 11} h37 M${x + 31} ${y + 21} h25`} stroke={C.muted} strokeWidth="3" opacity="0.7" />
          {red && col < 5 && <path d={`M${x + 96} ${y + 10} l8 12 M${x + 104} ${y + 10} l-8 12`} stroke={C.red} strokeWidth="2" />}
        </g>;
      })}
    </g>
  </g>
);

const Check: React.FC<{x?: number; y?: number; k: number; error?: boolean}> = ({x = 820, y = 852, k, error = false}) => (
  <g transform={`translate(${x} ${y}) scale(${k})`}>
    <circle r="43" fill={error ? C.red : C.green} />
    <path d={error ? 'M-15 -15 L15 15 M15 -15 L-15 15' : 'M-20 0 L-5 15 L23 -16'} stroke={C.white} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </g>
);

const Code: React.FC<{t: number; k: number}> = ({t, k}) => (
  <g>
    {[{w: 384, c: C.muted}, {w: 281, c: C.cyan}, {w: 454, c: C.green}, {w: 315, c: C.cyan}, {w: 352, c: C.muted}].map((line, i) => (
      <rect key={i} x={220 + (i % 2) * 32} y={735 + i * 43} width={line.w} height="15" rx="5" fill={line.c} opacity={0.75 + Math.sin(t + i) * 0.03} />
    ))}
    <Check k={k} />
  </g>
);

const Hud: React.FC<{left: string; right: string; error?: boolean}> = ({left, right, error = false}) => (
  <div style={{position: 'absolute', top: 1352, left: 145, width: 790, height: 103, borderRadius: 55,
    border: `3px solid ${C.line}`, background: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: F.sans, fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em'}}>
    <span style={{flex: 1, textAlign: 'center', color: C.green}}>{left}</span>
    <span style={{height: 51, width: 3, background: C.line}} />
    <span style={{flex: 1, textAlign: 'center', color: error ? C.red : C.white}}>{right}</span>
  </div>
);

const People: React.FC<{k: number; hr: number}> = ({k, hr}) => (
  <g opacity={k}>
    {Array.from({length: 50}, (_, i) => {
      const x = 245 + (i % 10) * 64;
      const y = 719 + Math.floor(i / 10) * 47;
      const color = i < 40 && hr > 0.1 ? C.green : C.muted;
      return <g key={i} transform={`translate(${x} ${y})`}>
        <rect x="9" width="13" height="13" fill={color} />
        <path d="M4 18 H28 V36 H21 V44 H12 V36 H4 Z" fill={color} opacity="0.85" />
      </g>;
    })}
  </g>
);

const Infrastructure: React.FC<{t: number; frame: number}> = ({t, frame}) => (
  <g>
    {[
      {key: 'kubernetes', label: 'Kubernetes', icon: 'K8S'},
      {key: 'gateway', label: 'API Gateway', icon: 'API'},
      {key: 'observability', label: 'Observabilidad', icon: 'LOG'},
      {key: 'meetings', label: '3 reuniones', icon: '???'},
    ].map((row, i) => {
      const k = sp(frame, beat(row.key as keyof typeof TL.events), {damping: 17, stiffness: 180}, TL.fps);
      const y = 667 + i * 75;
      return <g key={row.key} opacity={clamp01(k)} transform={`translate(${(1 - k) * 35} 0)`}>
        <rect x="212" y={y} width="655" height="62" rx="6" fill={C.panelHi} />
        <rect x="230" y={y + 13} width="70" height="36" rx="3" fill={i === 3 ? C.redDark : C.greenDark} />
        <text x="265" y={y + 38} fill={i === 3 ? C.red : C.green} fontSize="19" fontWeight="700" fontFamily={F.mono} textAnchor="middle">{row.icon}</text>
        <text x="325" y={y + 41} fill={C.white} fontSize="34" fontWeight="750" fontFamily={F.sans}>{row.label}</text>
        <path d={`M817 ${y + 24} l10 8 l-10 8`} stroke={C.dim} strokeWidth="3" fill="none" />
      </g>;
    })}
    <Check x={850} y={610} k={prog(t, beat('error'), beat('error') + 0.3, easeOut)} error />
  </g>
);

const Subtitles: React.FC<{t: number}> = ({t}) => {
  const caption = TL.captions.find((c) => t >= c.start && t < c.end);
  if (!caption) return null;
  const words = caption.words.map((id) => TL.narration.words.find((w) => w.id === id)!);
  return <div style={{position: 'absolute', top: 1521, left: 80, right: 80, textAlign: 'center',
    fontFamily: F.sans, fontSize: 53, fontWeight: 850, lineHeight: 1.23, letterSpacing: '-0.035em',
    WebkitTextStroke: `7px ${C.black}`, paintOrder: 'stroke fill', textShadow: `0 5px 0 ${C.black}`}}>
    {words.map((word, i) => <React.Fragment key={word.id}>
      {i > 0 && ' '}<span style={{color: t >= word.start && t < word.end ? C.cyan : C.white}}>{word.text}</span>
    </React.Fragment>)}
  </div>;
};

export const MicroservicesVoiceVideo: React.FC<VideoProps> = ({silent, audioFile}) => {
  const frame = useCurrentFrame();
  const t = frame / TL.fps;
  useFonts();
  const split = prog(t, beat('split'), beat('split') + 1.05, easeOut);
  const users = sp(frame, beat('users'), {damping: 18, stiffness: 180}, TL.fps);
  const hr = prog(t, beat('hr'), beat('hr') + 0.4, easeOut);
  const solved = prog(t, beat('solve'), beat('solve') + 0.45, easeOut);
  const worry = prog(t, beat('kubernetes'), beat('meetings'), easeOut) * (1 - prog(t, beat('before'), beat('before') + 0.4, easeOut))
    + prog(t, beat('disconnected'), beat('disconnected') + 0.3, easeOut) * (1 - solved);
  const currentScene = [...TL.scenes].reverse().find((s) => t >= s.start) ?? TL.scenes[0];
  const chapter = TL.scenes.findIndex((s) => s.id === currentScene.id) + 1;
  return <AbsoluteFill style={{background: C.bg, color: C.white}}>
    {!silent && <Audio src={staticFile(audioFile)} />}
    <AbsoluteFill style={{background: `radial-gradient(ellipse 75% 48% at 50% 66%, ${C.panelHi} 0%, ${C.clear} 100%)`}} />
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <pattern id="micro-grid" width="180" height="180" patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${-t * 1.8})`}>
          <path d="M180 0 H0 V180" fill="none" stroke={C.grid} strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect width={W} height="1320" fill="url(#micro-grid)" opacity="0.5" />
      <path d="M0 1305 H1080 L1080 1920 H0 Z" fill={C.floor} opacity="0.45" />
      <path d="M0 1305 H1080" stroke={C.line} strokeWidth="4" />
    </svg>
    <Layer id="book" t={t}>
      <Headline lines={t < beat('split') ? ['UN LIBRO DE', 'MICROSERVICIOS.'] : ['DEL MONOLITO A', '30 SERVICIOS.']} />
      <svg width={W} height={H}><Frame title="empresa.app"><Network k={split} t={t} /></Frame></svg>
      <div style={{position: 'absolute', top: 485, left: 0, right: 0, textAlign: 'center', fontFamily: F.mono, fontSize: 25, color: C.muted}}>
        <Roll a="UNA EMPRESA. UNA APLICACIÓN." b="UNA EMPRESA. TREINTA SERVICIOS." k={prog(t, beat('thirty'), beat('thirty') + 0.35, easeOut)} />
      </div>
      <Hud left={`SERVICIOS ${Math.round(lerp(1, 30, split))}`} right="USUARIOS ?" />
    </Layer>
    <Layer id="excuse" t={t}>
      <Headline lines={['LE PREGUNTAS:', '¿POR QUÉ?']} />
      <svg width={W} height={H}>
        <Frame title="escalabilidad.exe"><Network k={1} t={t} /></Frame>
        <g opacity={prog(t, beat('quote'), beat('quote') + 0.25, easeOut)}>
          <rect x="525" y="375" width="415" height="140" rx="17" fill={C.panelHi} stroke={C.cyan} strokeWidth="3" />
          <path d="M757 515 L786 540 L805 515" fill={C.panelHi} stroke={C.cyan} strokeWidth="3" />
          <text x="732" y="432" fontFamily={F.sans} fontSize="39" fontWeight="850" fill={C.white} textAnchor="middle">«Así escala</text>
          <text x="732" y="480" fontFamily={F.sans} fontSize="39" fontWeight="850" fill={C.cyan} textAnchor="middle">mejor»</text>
        </g>
      </svg>
      <Hud left="SERVICIOS 30" right="MOTIVO: ESCALAR" />
    </Layer>
    <Layer id="users" t={t}>
      <Headline lines={['COLEGA...', 'SON 50 USUARIOS.']} />
      <svg width={W} height={H}><Frame title="usuarios.csv"><People k={clamp01(users)} hr={hr} /></Frame></svg>
      <div style={{position: 'absolute', top: 460, left: 0, right: 0, textAlign: 'center', fontFamily: F.sans,
        fontSize: 44, fontWeight: 800, color: C.green, opacity: hr}}>40 son de Recursos Humanos.</div>
      <Hud left={`USUARIOS ${Math.round(50 * clamp01(users))}`} right={hr > 0.1 ? 'RR. HH. 40' : 'RR. HH. ?'} />
    </Layer>
    <Layer id="infrastructure" t={t}>
      <Headline lines={['Y AHORA...', 'NECESITAS TODO.']} />
      <svg width={W} height={H}><Frame title="infraestructura.yaml" error={1} y={590} h={405}><Infrastructure t={t} frame={frame} /></Frame></svg>
      <Hud left="DEPENDENCIAS 4" right={t >= beat('error') ? 'ERRORES 1' : 'REUNIONES 3'} error />
    </Layer>
    <Layer id="before" t={t}>
      <Headline lines={['ANTES:', 'FUNCIONABA.']} />
      <svg width={W} height={H}><Frame title="monolito.app"><Code t={t} k={sp(frame, beat('before'), {damping: 17}, TL.fps)} /></Frame></svg>
      <Hud left="SERVICIOS 1" right="ERRORES 0" />
    </Layer>
    <Layer id="after" t={t}>
      <Headline lines={['AHORA:', 'NO SE HABLAN.']} error />
      <svg width={W} height={H}><Frame title="servicios.offline" error={1}><Network k={1} broken={1} t={t} /></Frame></svg>
      <Hud left="SERVICIOS 30" right="CONEXIONES 0" error />
    </Layer>
    <Layer id="lesson" t={t}>
      <Headline lines={t < beat('solve') ? ['LA BUENA', 'ARQUITECTURA...'] : ['RESUELVE', 'PROBLEMAS.']} />
      <svg width={W} height={H}><Frame title="problema.resuelto"><Network k={1 - solved} t={t} /><Check x={815} y={819} k={solved} /></Frame></svg>
      <div style={{position: 'absolute', top: 486, left: 0, right: 0, textAlign: 'center', fontFamily: F.sans,
        fontSize: 41, fontWeight: 800, color: C.muted, opacity: prog(t, beat('without'), beat('without') + 0.3, easeOut)}}>
        <Mask k={prog(t, beat('without'), beat('without') + 0.3, easeOut)} tilt={0}>Sin crear otros treinta.</Mask>
      </div>
      <Hud left={`RESUELTOS ${solved > 0.5 ? '1' : '0'}`} right={`NUEVOS ${solved > 0.5 ? '0' : '30'}`} />
    </Layer>
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <Character role="builder" x={130} t={t} worried={clamp01(worry)} celebrate={solved} book={1 - prog(t, beat('quote'), beat('quote') + 0.5, easeOut)} />
      <Character role="architect" x={669} t={t} worried={clamp01(worry)} celebrate={solved} />
      <g transform="translate(444 1183)">
        <rect x="10" width="167" height="106" rx="10" fill={C.line} />
        <rect x="20" y="10" width="147" height="84" rx="3" fill={C.black} />
        <rect x="30" y="22" width="11" height="11" fill={C.cyan} />
        <rect y="102" width="187" height="17" rx="6" fill={C.dim} />
      </g>
    </svg>
    <Subtitles t={t} />
    <div style={{position: 'absolute', top: 1768, left: 70, right: 70, display: 'flex', justifyContent: 'space-between',
      fontFamily: F.mono, fontSize: 20, letterSpacing: '0.13em', color: C.dim}}>
      <span>ARQUITECTURA · SIN HUMO</span><span>{String(chapter).padStart(2, '0')} / 07</span>
    </div>
    <div style={{position: 'absolute', left: 70, right: 70, top: 1827, height: 3, background: C.line}}>
      <div style={{width: `${(t / TL.duration) * 100}%`, height: 3, background: C.green}} />
    </div>
    <Grain frame={frame} opacity={0.035} />
    <div style={{position: 'absolute', top: 66, right: 70, fontFamily: F.mono, fontWeight: 400,
      fontSize: 19, color: C.brand, letterSpacing: '0.19em', opacity: 1}}>farix.romero</div>
  </AbsoluteFill>;
};
