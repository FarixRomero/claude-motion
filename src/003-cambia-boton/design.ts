import timeline from '../../projects/003-cambia-boton/002-Cues/Timeline.json';
export {C, F} from '../../projects/003-cambia-boton/003-Escenas/palette';
export const TL = timeline;
export const beat = (name: keyof typeof TL.events) => TL.events[name].at;
