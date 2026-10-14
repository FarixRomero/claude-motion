import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Grain} from '../components/primitives';
import {useFonts} from '../components/useFonts';
import {clamp01, easeOut, lerp, prog, sp} from '../lib';
import {Character} from './Character';
import {beat, C, F, TL} from './design';

export type VideoProps = {silent: boolean; audioFile: string};

const Headline: React.FC<{lines: string[]; accent: string; color: string; k: number}> = ({lines, accent, color, k}) => (
  <div style={{position: 'absolute', top: 174, left: 65, right: 65, textAlign: 'center',
    fontFamily: F.sans, fontSize: 89, lineHeight: 1.04, fontWeight: 900, letterSpacing: '-0.045em',
    transform: `translateY(${(1 - k) * 20}px)`, opacity: k}}>
    {lines.map((line) => <div key={line} style={{color: line === accent ? color : C.white}}>{line}</div>)}
  </div>
);

const Hud: React.FC<{left: string; right: string; error: boolean}> = ({left, right, error}) => (
  <div style={{position: 'absolute', top: 1515, left: 110, width: 860, height: 104, borderRadius: 55,
    background: C.black, border: `3px solid ${C.line}`, display: 'flex', alignItems: 'center',
    fontFamily: F.sans, fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em'}}>
    <span style={{flex: 1, textAlign: 'center', color: C.green}}>{left}</span>
    <span style={{height: 48, width: 3, background: C.line}} />
    <span style={{flex: 1, textAlign: 'center', color: error ? C.red : C.white}}>{right}</span>
  </div>
);

const Subtitles: React.FC<{t: number}> = ({t}) => {
  const c = TL.captions.find((item) => t >= item.start && t < item.end);
  if (!c) return null;
  const words = c.words.map((id) => TL.narration.words.find((w) => w.id === id)!);
  return <div style={{position: 'absolute', left: 85, right: 85, top: 1671, textAlign: 'center',
    fontFamily: F.sans, fontSize: 57, fontWeight: 850, lineHeight: 1.2, letterSpacing: '-0.03em',
    WebkitTextStroke: `7px ${C.black}`, paintOrder: 'stroke fill', textShadow: `0 5px 0 ${C.black}`}}>
    {words.map((w, i) => <React.Fragment key={w.id}>{i > 0 && ' '}<span style={{color: t >= w.start && t < w.end ? C.cyan : C.white}}>{w.text}</span></React.Fragment>)}
  </div>;
};

const Network: React.FC<{t: number; frame: number; visible: number; expansion: number}> = ({t, frame, visible, expansion}) => (
  <g opacity={visible}>
    {Array.from({length: 30}, (_, i) => {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const x = lerp(155 + (i % 3) * 260, 155 + col * 129, expansion);
      const y = lerp(760 + (Math.floor(i / 3) % 2) * 100, 741 + row * 42, expansion);
      const width = lerp(220, 105, expansion);
      const height = lerp(64, 30, expansion);
      const k = clamp01(sp(frame, beat('thirty') + i * 0.012, {damping: 15, stiffness: 210}, TL.fps));
      return <g key={i} opacity={i < 6 ? 1 : k}>
        {col < 5 && <path d={`M${x + width} ${y + height / 2} h${lerp(40, 24, expansion)}`} stroke={C.dim} strokeWidth="3" opacity={i % 3 < 2 ? 1 : expansion} />}
        {row < 4 && <path d={`M${x + width / 2} ${y + height} v${lerp(36, 12, expansion)}`} stroke={C.dim} strokeWidth="3" opacity={i < 3 ? 1 : expansion} />}
        <rect x={x} y={y} width={width} height={height} rx="4" fill={C.panelHi} stroke={C.green} strokeWidth="2" />
        <rect x={x + 12} y={y + height / 2 - 5} width="10" height="10" fill={C.green} opacity={0.8 + Math.sin(t * 2 + i) * 0.1} />
        <text x={x + width * 0.6} y={y + height * 0.69} fontFamily={F.mono} fontSize={lerp(26, 16, expansion)} fill={C.white} textAnchor="middle">svc-{String(i + 1).padStart(2, '0')}</text>
      </g>;
    })}
    {([{name: 'kubernetes', text: 'KUBERNETES'}, {name: 'kafka', text: 'KAFKA'}, {name: 'events', text: 'EVENTOS'}] as const).map((chip, i) => {
      const k = clamp01(sp(frame, beat(chip.name), {damping: 16, stiffness: 200}, TL.fps));
      return <g key={chip.name} opacity={k} transform={`translate(0 ${(1 - k) * 14})`}>
        <rect x={150 + i * 262} y="966" width="250" height="46" rx="9" fill={C.greenDark} />
        <text x={275 + i * 262} y="997" fill={C.green} textAnchor="middle" fontFamily={F.mono} fontSize="24" fontWeight="600">{chip.text}</text>
      </g>;
    })}
  </g>
);

const Servers: React.FC<{t: number; frame: number; visible: number}> = ({t, frame, visible}) => (
  <g opacity={visible}>
    {Array.from({length: 6}, (_, i) => {
      const x = 160 + (i % 3) * 265;
      const y = 766 + Math.floor(i / 3) * 114;
      const k = clamp01(sp(frame, beat('autoscale') + i * 0.065, {damping: 17}, TL.fps));
      return <g key={i} opacity={k} transform={`translate(0 ${(1 - k) * 24})`}>
        <rect x={x} y={y} width="228" height="90" rx="7" fill={C.panelHi} stroke={C.green} strokeWidth="2" />
        {[0, 1, 2].map((j) => <g key={j}>
          <rect x={x + 14} y={y + 12 + j * 24} width="198" height="18" rx="2" fill={C.black} />
          <rect x={x + 25} y={y + 17 + j * 24} width="8" height="8" fill={C.green} opacity={0.75 + Math.sin(t * 4 + i + j) * 0.2} />
          <path d={`M${x + 54} ${y + 21 + j * 24} h130`} stroke={C.dim} strokeWidth="3" />
        </g>)}
      </g>;
    })}
  </g>
);

const Users: React.FC<{frame: number; visible: number; t: number}> = ({frame, visible, t}) => (
  <g opacity={visible}>
    {[C.blue, C.orange, C.muted].map((color, i) => {
      const k = clamp01(sp(frame, beat('three') + i * 0.075, {damping: 16}, TL.fps));
      return <g key={color} opacity={k} transform={`translate(${300 + i * 240} ${784 + (1 - k) * 30})`}>
        <rect x="-52" width="104" height="92" fill={color} />
        <rect x="-65" y="35" width="15" height="25" fill={color} />
        <rect x="50" y="35" width="15" height="25" fill={color} />
        <rect x="-29" y="90" width="23" height="37" fill={color} />
        <rect x="10" y="90" width="23" height="37" fill={color} />
        <rect x="-31" y="27" width="12" height="20" fill={C.black} />
        <rect x="19" y="27" width="12" height="20" fill={C.black} />
        {i === 0 && <g><path d="M-48 0 V-21 H48 V0 Z" fill={C.yellow} /><rect x="-60" y="-3" width="120" height="9" fill={C.yellowDark} /></g>}
        <text x="0" y="171" fill={i === 0 ? C.cyan : C.muted} fontFamily={F.sans} fontWeight="800" fontSize="30" textAnchor="middle">{i === 0 ? 'TÚ' : `USUARIO ${i + 1}`}</text>
        {i === 0 && <rect x="-71" y="-38" width="142" height="227" rx="9" fill="none" stroke={C.cyan} strokeWidth="3" opacity={prog(t, beat('you'), beat('you') + 0.25, easeOut)} />}
      </g>;
    })}
  </g>
);

export const CambiaBotonVideo: React.FC<VideoProps> = ({silent, audioFile}) => {
  useFonts();
  const frame = useCurrentFrame();
  const t = frame / TL.fps;
  const rise = (name: keyof typeof TL.events, duration = 0.4) => prog(t, beat(name), beat(name) + duration, easeOut);
  const current = [...TL.scenes].reverse().find((s) => t >= s.start) ?? TL.scenes[0];
  const chapter = TL.scenes.indexOf(current);
  const final = rise('where', 0.55);
  const answer = rise('punchline', 0.25);
  const expansion = rise('thirty', 0.7);
  const network = rise('redesign') * (1 - rise('complaint', 0.3));
  const servers = rise('autoscale') * (1 - rise('question', 0.3));
  const people = rise('three', 0.25) * (1 - final);
  const dock = clamp01(Math.max(network, rise('autoscale') * (1 - final)));
  const buttonWidth = lerp(lerp(420, 344, dock), 640, final);
  const buttonHeight = lerp(lerp(106, 82, dock), 160, final);
  const buttonY = lerp(lerp(796, 632, dock), 803, final);
  const capacity = Math.round(10000000 * prog(t, beat('capacity'), beat('million'), easeOut));
  const activeWord = TL.narration.words.find((w) => t >= w.start && t < w.end);
  const worry = rise('confused') * (1 - final * 0.45);
  const celebrate = (rise('understood') * (1 - rise('confused'))) * 0.6 + network * 0.5 + servers * 0.5 + people * 0.25;
  const h = chapter === 0 ? {lines: ['SOLO UN', 'BOTÓN.'], accent: 'BOTÓN.', color: C.green}
    : chapter === 1 ? {lines: ['ARQUITECTURA', 'REDISEÑADA.'], accent: 'REDISEÑADA.', color: C.green}
    : chapter === 2 ? {lines: ['30', 'MICROSERVICIOS.'], accent: '30', color: C.green}
    : chapter === 3 ? (t < beat('autoscale') ? {lines: ['ERA CAMBIAR', 'EL COLOR.'], accent: 'EL COLOR.', color: C.red}
      : {lines: ['LISTO PARA', '10 MILLONES.'], accent: '10 MILLONES.', color: C.green})
    : chapter === 4 ? (t < beat('three') ? {lines: ['¿CUÁNTOS', 'USUARIOS?'], accent: 'USUARIOS?', color: C.cyan}
      : {lines: ['USUARIOS', 'REALES: 3.'], accent: 'REALES: 3.', color: C.red})
    : (t < beat('punchline') ? {lines: ['¿Y EL', 'BOTÓN?'], accent: 'BOTÓN?', color: C.cyan}
      : {lines: ['SIGUE', 'AZUL.'], accent: 'AZUL.', color: C.button});
  const headlineStart = chapter === 3 && t >= beat('autoscale') ? beat('autoscale')
    : chapter === 4 && t >= beat('three') ? beat('three')
    : chapter === 5 && t >= beat('punchline') ? beat('punchline') : current.start;
  const headlineK = headlineStart === 0 ? 1 : prog(t, headlineStart, headlineStart + 0.35, easeOut);
  const hudLeft = chapter <= 1 ? 'CAMBIO PEDIDO: 1' : chapter === 2 ? 'SERVICIOS: 30'
    : chapter === 3 ? (t < beat('autoscale') ? 'CAMBIO PEDIDO: 1' : 'AUTOESCALADO ✓')
    : chapter === 4 ? 'CAPACIDAD: 10 M' : 'SERVICIOS: 30';
  const hudRight = chapter === 4 ? (t < beat('three') ? 'USUARIOS: ?' : 'USUARIOS: 3')
    : chapter === 3 && t >= beat('autoscale') ? 'USUARIOS: ?' : 'CAMBIOS: 0';
  return <AbsoluteFill style={{background: C.bg, color: C.white}}>
    {!silent && <Audio src={staticFile(audioFile)} />}
    <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% 57%, ${C.panelHi} 0%, ${C.clear} 100%)`}} />
    <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
      <defs><pattern id="button-grid" width="160" height="160" patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${-t * 1.5})`}>
        <path d="M160 0 H0 V160" stroke={C.grid} strokeWidth="1.2" fill="none" />
      </pattern></defs>
      <rect width="1080" height="1465" fill="url(#button-grid)" opacity="0.5" />
      <rect y="1465" width="1080" height="455" fill={C.floor} opacity="0.55" />
      <path d="M0 1465 H1080" stroke={C.line} strokeWidth="3" />
    </svg>
    <Headline {...h} k={headlineK} />
    <div style={{position: 'absolute', top: 439, left: 75, right: 75, textAlign: 'center', color: C.muted,
      fontFamily: F.mono, fontSize: 25, letterSpacing: '0.035em'}}>
      {chapter === 0 ? 'LA TAREA: AZUL → VERDE' : chapter === 1 ? (t >= beat('confused') ? '¿CÓMO QUE REDISEÑADO?' : 'CLAUDE TIENE OTROS PLANES')
        : chapter === 2 ? 'UN BOTÓN. DEMASIADA INFRAESTRUCTURA.'
        : chapter === 3 ? (t >= beat('autoscale') ? `CAPACIDAD: ${capacity.toLocaleString('es-PE')} USUARIOS` : 'EL BOTÓN SIGUE ESPERANDO')
        : chapter === 4 ? (t >= beat('three') ? 'CONTÁNDOTE A TI.' : 'VEAMOS LOS DATOS...') : (answer > 0 ? 'LA TAREA ORIGINAL: PENDIENTE' : 'VOLVAMOS AL PRINCIPIO...')}
    </div>
    <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
      <rect x="110" y="575" width="880" height="480" rx="24" fill={C.black} opacity="0.4" />
      <rect x="100" y="560" width="880" height="480" rx="24" fill={C.panel} stroke={answer > 0.5 ? C.red : C.line} strokeWidth="4" />
      <path d="M124 560 H956 Q980 560 980 584 V616 H100 V584 Q100 560 124 560" fill={C.panelHi} />
      {[C.red, C.yellow, C.green].map((color, i) => <circle key={color} cx={135 + i * 30} cy="588" r="8" fill={color} />)}
      <text x="943" y="595" textAnchor="end" fontFamily={F.mono} fontSize="23" fill={C.muted}>{chapter === 2 ? 'arquitectura.yaml' : chapter === 3 && servers > 0 ? 'autoscaling.yaml' : 'button.tsx'}</text>
      <g opacity={(1 - dock) * (1 - final)}>
        <rect x="152" y="660" width="525" height="17" rx="4" fill={C.dim} />
        <rect x="152" y="697" width="344" height="17" rx="4" fill={C.line} />
        <text x="540" y="761" textAnchor="middle" fontFamily={F.mono} fontSize="27" fill={C.muted}>LA APP DE SIEMPRE</text>
      </g>
      <Network t={t} frame={frame} visible={network} expansion={expansion} />
      <Servers t={t} frame={frame} visible={servers} />
      <Users frame={frame} visible={people} t={t} />
      <g opacity={(1 - rise('redesign')) * rise('green')}>
        <text x="427" y="984" fontFamily={F.sans} fontWeight="750" fontSize="28" textAnchor="end" fill={C.muted}>COLOR PEDIDO</text>
        <path d="M463 973 H551 M537 961 L551 973 L537 985" stroke={C.white} strokeWidth="4" fill="none" />
        <rect x="587" y="944" width="109" height="55" rx="9" fill={C.green} />
      </g>
      <g transform={`translate(540 ${buttonY})`}>
        <rect x={-buttonWidth / 2} y="9" width={buttonWidth} height={buttonHeight} rx="13" fill={C.buttonDark} />
        <rect x={-buttonWidth / 2} width={buttonWidth} height={buttonHeight} rx="13" fill={C.button} />
        <text x="0" y={buttonHeight * 0.65} textAnchor="middle" fill={C.white} fontFamily={F.sans} fontWeight="850" fontSize={lerp(38, 64, final)}>Enviar</text>
        <rect x={-buttonWidth / 2 - 9} y="-9" width={buttonWidth + 18} height={buttonHeight + 18} rx="20" fill="none" stroke={C.cyan} strokeWidth="4"
          opacity={0.7 * rise('blue', 0.1) * (1 - rise('green')) + 0.8 * rise('color') * (1 - rise('autoscale'))} />
      </g>
      <g opacity={answer}>
        <text x="540" y="739" textAnchor="middle" fontFamily={F.mono} fontSize="29" fill={C.muted}>color: azul;</text>
        <text x="540" y="1010" textAnchor="middle" fontFamily={F.sans} fontWeight="850" fontSize="35" fill={C.red}>CAMBIO DE COLOR: PENDIENTE</text>
      </g>
      <Character role="builder" x={130} t={t} worried={worry} speaking={activeWord?.speaker === 'Yo'} deadpan={final} />
      <Character role="architect" x={669} t={t} celebrate={celebrate} speaking={activeWord?.speaker === 'Claude'} />
      <g transform="translate(449 1350)">
        <rect x="7" width="169" height="102" rx="9" fill={C.line} />
        <rect x="17" y="10" width="149" height="80" rx="3" fill={C.black} />
        <rect x="32" y="25" width="14" height="14" fill={C.button} />
        <rect y="98" width="183" height="15" rx="5" fill={C.dim} />
      </g>
      <text x="279" y="1494" textAnchor="middle" fontFamily={F.mono} fontSize="22" fill={activeWord?.speaker === 'Yo' ? C.cyan : C.muted}>YO</text>
      <text x="818" y="1494" textAnchor="middle" fontFamily={F.mono} fontSize="22" fill={activeWord?.speaker === 'Claude' ? C.cyan : C.muted}>CLAUDE</text>
    </svg>
    <Hud left={hudLeft} right={hudRight} error={chapter >= 4 || t >= beat('complaint') && t < beat('autoscale')} />
    <Subtitles t={t} />
    <div style={{position: 'absolute', top: 1816, left: 70, right: 70, display: 'flex', justifyContent: 'space-between',
      color: C.dim, fontFamily: F.mono, fontSize: 20, letterSpacing: '0.07em'}}>
      <span>SOLO CAMBIA EL BOTÓN</span><span>{String(chapter + 1).padStart(2, '0')} / 06</span>
    </div>
    <div style={{position: 'absolute', top: 1860, left: 70, right: 70, background: C.line, height: 3}}>
      <div style={{background: C.cyan, height: 3, width: `${t / TL.duration * 100}%`}} />
    </div>
    <Grain frame={frame} opacity={0.035} />
    <div style={{position: 'absolute', top: 66, right: 70, fontFamily: F.mono, fontWeight: 400,
      fontSize: 19, color: C.brand, letterSpacing: '0.19em', opacity: 1}}>farix.romero</div>
  </AbsoluteFill>;
};
