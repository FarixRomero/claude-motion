import timeline from '../../projects/001-mi-video/002-Cues/Timeline.json';
export {C, F} from '../../projects/001-mi-video/003-Escenas/palette';
export const TL = timeline;
export const beat = (name: keyof typeof TL.events) => TL.events[name].at;
export const scene = (id: string) => TL.scenes.find((s) => s.id === id)!;
