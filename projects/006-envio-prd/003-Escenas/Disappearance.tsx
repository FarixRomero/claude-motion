import React from 'react';
import {interpolate} from 'remotion';
import {C} from './video-design';

// Fragmentos deterministas: nacen sobre Claude y se dispersan al desvanecerse.
export const Disappearance: React.FC<{progress:number}>=({progress})=>{
  const p=Math.max(0,Math.min(1,progress));
  return <group visible={p>0&&p<1}>
    {Array.from({length:42},(_,i)=>{
      const phase=Math.max(0,Math.min(1,(p-(i%7)*.035)/.79));
      const x=Math.sin(i*2.399)*.67;
      const y=((i%9)/8-.5)*1.45;
      const z=Math.cos(i*1.7)*.55;
      const alpha=Math.sin(Math.PI*phase)*.72;
      const size=interpolate(phase,[0,.25,1],[.025,.085,.015]);
      return <mesh key={i} position={[1.15+x+Math.sin(i*1.3)*phase*.95,2.2+y+phase*(.55+(i%4)*.17),z+Math.cos(i)*phase*.4]} rotation={[phase*(i%3),phase*2+i,phase*(i%5)]} scale={size}>
        <boxGeometry args={[1,1,1]}/><meshBasicMaterial color={i%4===0?C.gold:C.claude} transparent opacity={alpha} depthWrite={false} toneMapped={false}/>
      </mesh>;
    })}
  </group>;
};
