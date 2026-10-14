import React from 'react';
import {C} from '../../projects/002-dentista-permisos/003-Escenas/palette';

export const Person: React.FC<{x: number; t: number; frame: number; assistant?: boolean; speaking: boolean; reaction: number}> = ({x, t, frame, assistant = false, speaking, reaction}) => {
  const base = assistant ? C.orange : C.blue;
  const light = assistant ? C.orangeLight : C.blueLight;
  const dark = assistant ? C.orangeDark : C.blueDark;
  const bob = Math.sin(t * 2.2 + (assistant ? 1.7 : 0)) * 2.5;
  const blink = Math.cos(t * 2 + (assistant ? 2 : 0)) > .995;
  const mouth = speaking ? 9 + (Math.floor(frame / 4) % 3) * 6 : 7;
  return <g transform={`translate(${x} ${944 + bob}) rotate(${assistant ? 0 : -reaction * 3} 120 150) scale(1.25)`}>
    <ellipse cx="120" cy="288" rx="150" ry="17" fill={C.black} opacity=".7" />
    <rect x="27" y="11" width="194" height="203" fill={dark} />
    <rect x="27" y="11" width="179" height="189" fill={base} />
    <rect x="27" y="11" width="194" height="16" fill={light} />
    <rect x="-14" y={78 - (assistant ? reaction * 30 : 0)} width="44" height="49" fill={base} />
    <rect x="219" y={78 - (assistant ? reaction * 30 : 0)} width="45" height="49" fill={base} />
    <rect x="52" y="210" width="49" height="72" fill={base} />
    <rect x="150" y="210" width="49" height="72" fill={base} />
    <rect x="52" y="210" width="49" height="15" fill={dark} />
    <rect x="150" y="210" width="49" height="15" fill={dark} />
    <rect x="69" y={blink ? 84 : 66} width="29" height={blink ? 7 : 45} fill={C.black} />
    <rect x="151" y={blink ? 84 : 66} width="29" height={blink ? 7 : 45} fill={C.black} />
    <rect x="103" y="140" width="46" height={mouth} fill={C.black} />
    {!assistant && <g>
      <path d="M27 26 V-15 H56 V-32 H163 V-15 H207 V26 H183 V7 H49 V26 Z" fill={C.blueDark} />
      <path d="M66 55 L101 65 M148 65 L183 55" stroke={C.black} strokeWidth="7" opacity={reaction} />
      <g transform="translate(185 132) rotate(-10)">
        <rect width="61" height="104" rx="5" fill={C.line} />
        <rect x="6" y="8" width="49" height="78" fill={C.black} />
        <rect x="13" y="23" width="35" height="11" fill={C.cyan} />
        <circle cx="30" cy="95" r="4" fill={C.muted} />
      </g>
    </g>}
    {assistant && <g>
      <path d="M32 59 V-15 H215 V60" fill="none" stroke={C.orangeDark} strokeWidth="15" />
      <rect x="10" y="49" width="31" height="60" fill={C.cyan} />
      <rect x="209" y="49" width="27" height="60" fill={C.cyan} />
      <path d="M223 102 V132 H170" stroke={C.cyan} strokeWidth="8" fill="none" />
      <rect x="155" y="125" width="20" height="14" fill={C.black} />
    </g>}
    {speaking && <path d="M-9 251 H24 M-9 262 H12" stroke={C.cyan} strokeWidth="5" />}
  </g>;
};

