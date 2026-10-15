import timeline from '../../projects/005-low-poly-tokens/002-Cues/Timeline.json';
import {HEAD_C, HEAD_F} from './head-design';

export const TL = timeline;
export const C = {...HEAD_C, panel:'#11182b', panelHi:'#1a2340', border:'#354363',
  white:'#f5f7ff', muted:'#9db3ce', cyan:'#58dcff', green:'#64e6ac', red:'#ff656d',
  claude:'#ff602e', cubeDefault:'#5fd3d0', cubeEye:'#6b4a3a', keyboard:'#111523', keyTop:'#323959'};
export const F = {...HEAD_F, sans:'Inter Variable'};
export const at = (name: keyof typeof TL.events) => TL.events[name].at;
export const activeScene = (t: number) => TL.scenes.find(s => t>=s.start && t<s.end) ?? TL.scenes[TL.scenes.length-1];
