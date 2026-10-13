import React from 'react';
import {C} from './design';

export const Character: React.FC<{
  role: 'builder' | 'architect';
  x: number;
  t: number;
  worried?: number;
  celebrate?: number;
  book?: number;
}> = ({role, x, t, worried = 0, celebrate = 0, book = 0}) => {
  const builder = role === 'builder';
  const base = builder ? C.blue : C.orange;
  const light = builder ? C.blueLight : C.orangeLight;
  const dark = builder ? C.blueDark : C.orangeDark;
  const bob = Math.sin(t * 2.3 + (builder ? 0 : 1.4)) * 3;
  const blink = Math.cos(t * 2.1 + (builder ? 0.8 : 2.6)) > 0.992;
  const arm = 8 + celebrate * 50;
  return (
    <g transform={`translate(${x} ${944 + bob}) rotate(${worried * (builder ? -3 : 4)} 120 150) scale(1.25)`}>
      <ellipse cx="120" cy="288" rx="158" ry="18" fill={C.black} opacity={0.7} />
      <rect x="27" y="11" width="194" height="203" fill={dark} />
      <rect x="27" y="11" width="179" height="189" fill={base} />
      <rect x="27" y="11" width="194" height="16" fill={light} />
      <rect x="-14" y={86 - arm} width="44" height="49" fill={base} />
      <rect x="-14" y={86 - arm} width="44" height="12" fill={light} />
      <rect x="219" y={86 - arm} width="45" height="49" fill={base} />
      <rect x="219" y={86 - arm} width="45" height="12" fill={light} />
      <rect x="52" y="210" width="49" height="72" fill={base} />
      <rect x="150" y="210" width="49" height="72" fill={base} />
      <rect x="52" y="210" width="49" height="16" fill={dark} />
      <rect x="150" y="210" width="49" height="16" fill={dark} />
      <rect x="69" y={blink ? 85 : 67} width="31" height={blink ? 8 : 48} fill={C.black} />
      <rect x="151" y={blink ? 85 : 67} width="31" height={blink ? 8 : 48} fill={C.black} />
      {worried > 0.1 && <path d="M66 54 L102 64 M148 64 L184 54" stroke={C.black} strokeWidth="8" opacity={worried} />}
      {builder ? (
        <g>
          <rect x="39" y="-38" width="165" height="49" fill={C.yellow} />
          <rect x="65" y="-61" width="111" height="38" fill={C.yellow} />
          <rect x="112" y="-61" width="20" height="72" fill={C.yellowDark} />
          <rect x="14" y="-1" width="220" height="18" fill={C.yellowDark} />
          <rect x="54" y="-47" width="42" height="10" fill={C.yellowLight} />
        </g>
      ) : (
        <g>
          <rect x="115" y="-52" width="14" height="63" fill={dark} />
          <rect x="96" y="-66" width="48" height="34" fill={C.cyan} />
          <rect x="103" y="-64" width="24" height="7" fill={C.white} opacity={0.45} />
          <path d="M99 145 L82 159 L99 173 M151 145 L168 159 L151 173" fill="none" stroke={C.white} strokeWidth="8" />
          <rect x="120" y="144" width="9" height="32" fill={C.white} transform="rotate(13 125 160)" />
        </g>
      )}
      {book > 0.01 && <g opacity={book} transform="translate(173 111) rotate(-12)">
        <rect width="104" height="117" fill={C.greenDark} stroke={C.green} strokeWidth="5" />
        <rect x="12" y="0" width="6" height="117" fill={C.green} />
        <path d="M30 29 H89 M30 41 H79 M30 75 H89 M30 87 H68" stroke={C.white} strokeWidth="7" />
      </g>}
    </g>
  );
};
