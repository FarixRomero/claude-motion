import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, TL, at} from './video-design';

export type CubeCharacterProps = {
  color?: string;
  opacity?: number;
  talking?: boolean;
  audioVolume?: number;
  position?: [number,number,number];
  rotation?: [number,number,number];
};
const FEET = [[-.55,.53,.73],[.55,.53,.8],[-.51,-.53,.77],[.58,-.53,.84]];
const MATERIAL = {flatShading:true,roughness:.8,metalness:0};

export const CubeCharacter: React.FC<CubeCharacterProps> = ({color=C.cubeDefault,opacity=1,talking=false,audioVolume=0,position=[0,0,0],rotation=[0,0,0]}) => {
  const frame=useCurrentFrame();const {fps}=useVideoConfig();
  const breath=interpolate(Math.sin(frame/(fps*TL.motion.breathingPeriod)*Math.PI*2),[-1,1],[1,1.03]);
  const amount=talking?Math.max(0,Math.min(1,audioVolume)):0;
  const bounce=amount*(.09+Math.abs(Math.sin(frame/fps*16))*.12);
  const stretch=1+amount*Math.sin(frame/fps*16)*.09;
  const enter=spring({frame:frame-at('tokens.enter')*fps,fps,config:{damping:14,stiffness:170,mass:.8}});
  const blink=interpolate(frame%(TL.motion.blinkPeriod*fps),[0,3/30*fps,6/30*fps,TL.motion.blinkPeriod*fps],[1,.08,1,1]);
  return (
    <group position={position} rotation={rotation}>
      <group position={[0,bounce+Math.sin(Math.min(1,Math.max(0,enter))*Math.PI)*.16,0]} rotation={[0,0,Math.sin(frame/(fps*TL.motion.bobPeriod)*Math.PI*2)*Math.PI/90]}>
        <group scale={[1/Math.sqrt(stretch),breath*stretch,1/Math.sqrt(stretch)]}>
          <mesh><boxGeometry args={[2,2,2]}/><meshStandardMaterial {...MATERIAL} color={color} transparent opacity={opacity}/></mesh>
          {[-.5,.5].map(x=><mesh key={x} position={[x,.16,1.035]} scale={[1,blink,1]}><boxGeometry args={[.2,.6,.05]}/><meshStandardMaterial {...MATERIAL} color={C.cubeEye} transparent opacity={opacity}/></mesh>)}
        </group>
        {FEET.map(([x,z,h],i)=><mesh key={i} position={[x,-1-h/2,z]}><boxGeometry args={[.5,h,.5]}/><meshStandardMaterial {...MATERIAL} color={color} transparent opacity={opacity}/></mesh>)}
      </group>
    </group>
  );
};
