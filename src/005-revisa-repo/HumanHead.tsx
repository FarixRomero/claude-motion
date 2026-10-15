import React, {useMemo} from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BufferGeometry, Float32BufferAttribute, IcosahedronGeometry, Mesh, MeshBasicMaterial, Quaternion, Raycaster, Vector3} from 'three';
import {HEAD_C as C, HEAD_TL as TL} from './head-design';

export type HumanHeadProps = {
  talking?: boolean;
  surprised?: boolean;
  audioVolume?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
};

const MATERIAL = {flatShading: true, roughness: .85, metalness: 0};
const RAD = Math.PI / 180;
const UP = new Vector3(0, 1, 0);
const EYE_X = [.15,.60];
const FACE_X = (EYE_X[0]+EYE_X[1])/2;
const HAIR = [
  [-.78,.79,.1,-26,-18], [-.56,1.00,-.36,-17,-12], [-.31,1.15,.27,-9,13],
  [.02,1.24,-.2,2,-8], [.31,1.17,.18,13,12], [.60,1.00,-.24,22,-13],
  [.81,.82,.09,30,10], [.16,1.14,-.63,8,-27],
];

function capFromFacets(base: BufferGeometry) {
  const p = base.getAttribute('position');
  const vertices: number[] = [];
  // Seleccionar triángulos enteros produce una unión dentada, sin una línea de corte recta.
  for (let i = 0; i < p.count; i += 3) {
    const x = (p.getX(i)+p.getX(i+1)+p.getX(i+2))/3;
    const y = (p.getY(i)+p.getY(i+1)+p.getY(i+2))/3;
    const z = (p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3;
    if (y <= .14 + Math.sin(x*4+z*2)*.10) continue;
    for (let j = 0; j < 3; j++) vertices.push(p.getX(i+j),p.getY(i+j),p.getZ(i+j));
  }
  const cap = new BufferGeometry();
  cap.setAttribute('position', new Float32BufferAttribute(vertices,3));
  cap.computeVertexNormals();
  return cap;
}

export const HumanHead: React.FC<HumanHeadProps> = ({talking = false, surprised = false, audioVolume = 0, position = [0,0,0], rotation = [0,0,0]}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const geometry = useMemo(() => new IcosahedronGeometry(1.2,1), []);
  const cap = useMemo(() => capFromFacets(geometry), [geometry]);
  const surface = useMemo(() => {
    const mesh = new Mesh(geometry,new MeshBasicMaterial());
    mesh.updateMatrixWorld();
    const ray = new Raycaster();
    return (x: number, y: number) => {
      ray.set(new Vector3(x,y,3),new Vector3(0,0,-1));
      return ray.intersectObject(mesh)[0]?.point.z ?? .7;
    };
  }, [geometry]);
  const faceSurface = (x: number, y: number) => surface(FACE_X+x,y);
  const breath = interpolate(Math.sin(frame/(fps*TL.events.breathing.period)*Math.PI*2),[-1,1],[1,1.025]);
  const nod = Math.sin(frame/(fps*TL.events.nod.period)*Math.PI*2);
  const micro = Math.sin(frame/(fps*TL.events.features.period)*Math.PI*2);
  const blinkPhase = frame < TL.events.blink.first*fps ? TL.events.blink.period*fps : (frame-TL.events.blink.first*fps)%(TL.events.blink.period*fps);
  const blink = interpolate(blinkPhase,[0,TL.events.blink.duration*fps/2,TL.events.blink.duration*fps,TL.events.blink.period*fps],[1,.06,1,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const mouthOpen = talking ? interpolate(Number.isFinite(audioVolume) ? audioVolume : 0,[0,1],[0,.26],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}) : 0;
  const mouthHeight = .065 + mouthOpen;
  const noseRotation = useMemo(() => new Quaternion().setFromUnitVectors(UP,new Vector3(.8,-.38,.52).normalize()), []);

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0,-2.4,0]} scale={[1,breath,1]}>
        <boxGeometry args={[2.2,2.4,1]} />
        <meshStandardMaterial {...MATERIAL} color={C.torso} />
      </mesh>
      <group position={[0,(breath-1)*.6,0]} rotation={[nod*.024,micro*.018,nod*.015]}>
        <mesh geometry={geometry}><meshStandardMaterial {...MATERIAL} color={C.face} /></mesh>
        <mesh geometry={cap} scale={1.018}><meshStandardMaterial {...MATERIAL} color={C.cap} /></mesh>
        {HAIR.map(([x,y,z,rz,rx],i) => (
          <mesh key={i} position={[x,y,z]} rotation={[rx*RAD,0,-rz*RAD]}>
            <coneGeometry args={[.14,.6,5]} />
            <meshStandardMaterial {...MATERIAL} color={C.hair} />
          </mesh>
        ))}
        {/* Todas las piezas comparten el eje medio de los ojos y la rotación de la cabeza. */}
        <group position={[FACE_X,0,0]}>
          {/* Pirámide izquierda parcialmente hundida en la superficie real. */}
          <mesh position={[-.52-FACE_X,.04+micro*.008,faceSurface(-.52-FACE_X,.04)-.055]} rotation={[Math.PI/2,0,Math.PI/4]} scale={[1,1,blink]}>
            <coneGeometry args={[.17,.2,4]} />
            <meshStandardMaterial {...MATERIAL} color={C.leftEye} />
          </mesh>
          {EYE_X.map((x,i) => (
            <mesh key={x} position={[x-FACE_X,.07+Math.sin(frame/(fps*TL.events.features.period)*Math.PI*2+i)*.009,faceSurface(x-FACE_X,.07)+.15]} scale={[1,blink,1]}>
              <boxGeometry args={[.25,.55,.2]} />
              <meshStandardMaterial {...MATERIAL} color={C.eye} />
            </mesh>
          ))}
          {[-.52,.45].map((x,i) => (
            <mesh key={x} position={[x-FACE_X,.52+(surprised?.075:0)+Math.sin(frame/(fps*TL.events.features.period)*Math.PI*2+i)*.018,faceSurface(x-FACE_X,.52)+.07]} rotation={[0,0,(i===0?-8:5)*RAD]}>
              <boxGeometry args={[.6,.08,.1]} />
              <meshStandardMaterial {...MATERIAL} color={C.eye} />
            </mesh>
          ))}
          <mesh position={[0,-.30+micro*.006,faceSurface(0,-.30)+.12]} quaternion={noseRotation}>
            <coneGeometry args={[.18,.5,4]} />
            <meshStandardMaterial {...MATERIAL} color={C.nose} />
          </mesh>
          {/* Apertura por volumen: labios visibles y cavidad oscura sobre la cara. */}
          <group position={[0,-.70,faceSurface(0,-.70)+.075]} rotation={[0,0,15*RAD]}>
            <mesh scale={[1,mouthHeight,1]}>
              <boxGeometry args={[.48,1,.08]} />
              <meshStandardMaterial {...MATERIAL} color={C.mouth} />
            </mesh>
            <mesh position={[0,0,.055]} scale={[1,Math.max(.014,mouthHeight-.045),1]}>
              <boxGeometry args={[.39,1,.025]} />
              <meshStandardMaterial {...MATERIAL} color={C.eye} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};
