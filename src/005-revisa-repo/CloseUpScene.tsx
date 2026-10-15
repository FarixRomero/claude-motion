import React, {useEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {Bloom, DepthOfField, EffectComposer, ToneMapping} from '@react-three/postprocessing';
import {AbsoluteFill, Audio, staticFile, continueRender, delayRender, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ToneMappingMode} from 'postprocessing';
import {AdditiveBlending, Color, PerspectiveCamera} from 'three';
import {useFonts} from '../components/useFonts';
import {HumanHead} from './HumanHead';
import {HEAD_C as C, HEAD_F as F, HEAD_TL as TL} from './head-design';

const BOKEH = [
  [-1.8,1.85,-4.2,.52], [1.65,.8,-4.5,.43], [-1.4,-.7,-3.9,.64],
  [1.45,-1.5,-4.8,.57], [.45,2.65,-5.3,.40], [-.30,1.6,-5.4,.35],
  [2.1,2.15,-5.5,.63],
];
const VERTEX = `varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const FRAGMENT = `uniform vec3 tint; varying vec2 vUv;
void main(){float r=length(vUv-0.5)*2.0;float a=exp(-r*r*4.0)*(1.0-smoothstep(0.6,1.0,r));gl_FragColor=vec4(tint,a*0.24);}`;

export const BackgroundLights: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const uniforms = useMemo(() => ({tint:{value:new Color(C.gold).multiplyScalar(1.6)}}), []);
  const drift = frame/(fps*TL.events.background.period)*Math.PI*2;
  return (
    <group>
      {BOKEH.map(([x,y,z,r],i) => (
        <mesh key={i} position={[x+Math.sin(drift+i)*.09,y+Math.cos(drift*.8+i)*.10,z]} scale={r}>
          <circleGeometry args={[1,48]} />
          <shaderMaterial uniforms={uniforms} vertexShader={VERTEX} fragmentShader={FRAGMENT} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
        </mesh>
      ))}
      {Array.from({length:22},(_,i) => (
        <mesh key={`star-${i}`} position={[Math.sin(i*2.399)*2.7,1.1+(i%7)*.36+Math.sin(drift+i)*.025,-3.8-(i%5)*.37]} rotation={[drift*.03,i*.31,i*.19]}>
          <icosahedronGeometry args={[.014+(i%3)*.005,0]} />
          <meshBasicMaterial color={C.star} transparent opacity={.5+(i%3)*.12} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

// Esperar los efectos evita capturar el canvas antes de inicializar el postprocesado.
export const CaptureBarrier: React.FC<{handle: number}> = ({handle}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const advance = useThree(s => s.advance);
  useEffect(() => {
    Promise.resolve().then(() => {
      advance(frame/fps*1000);
      continueRender(handle);
    });
  }, [advance, frame, fps, handle]);
  return null;
};

export const CloseUpScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {width,height,fps} = useVideoConfig();
  useFonts();
  const postHandle = useMemo(() => delayRender('Postprocesado low poly'), [frame]);
  const camera = useMemo(() => new PerspectiveCamera(38,width/height,.1,40), [width,height]);
  const cameraZ = interpolate(frame,[TL.events.dolly.start*fps,TL.events.dolly.end*fps],[7.15,6.55],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  // La cámara se recalcula desde el frame; no existe un bucle de animación independiente.
  camera.position.set(.08,-.16,cameraZ);
  camera.lookAt(.02,-.16,0);
  camera.updateMatrixWorld();
  return (
    <AbsoluteFill style={{backgroundColor:C.background}}>
      <ThreeCanvas width={width} height={height} camera={camera} dpr={1} gl={{antialias:false,alpha:false}}>
        <color attach="background" args={[C.background]} />
        <ambientLight color={C.face} intensity={.075} />
        <pointLight color={C.key} position={[-2.2,-1.8,3.0]} intensity={46} decay={2} distance={18} />
        <directionalLight color={C.rim} position={[-4,2.6,-3]} intensity={3.8} />
        <BackgroundLights />
        <HumanHead rotation={[0,-.11,0]} talking={frame < TL.narration.end*fps} audioVolume={TL.narration.audioVolume[Math.min(frame,TL.narration.audioVolume.length-1)] ?? 0} />
        <mesh position={[0,-3.7,0]} rotation={[-Math.PI/2,0,0]}>
          <planeGeometry args={[20,20]} />
          <meshStandardMaterial color={C.floor} flatShading roughness={.85} />
        </mesh>
        <EffectComposer multisampling={4} enableNormalPass={false}>
          <Bloom luminanceThreshold={.6} luminanceSmoothing={.35} intensity={1.2} mipmapBlur />
          <DepthOfField target={[0,0,1.02]} worldFocusRange={2.1} bokehScale={5} height={480} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <CaptureBarrier handle={postHandle} />
        </EffectComposer>
      </ThreeCanvas>
      <Audio src={staticFile(TL.narration.audio)} />
      <div style={{position:'absolute',top:66,right:70,fontFamily:F.mono,fontWeight:400,fontSize:19,color:C.trademark,letterSpacing:'.19em',opacity:1}}>farix.romero</div>
    </AbsoluteFill>
  );
};
