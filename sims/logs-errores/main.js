import {runSim} from '../kit/runtime.js';
import {setupScene, TL} from '../../projects/004-logs-errores/003-Escenas/scene.js';
runSim({duration: TL.duration, fps: TL.fps, watermark: '', hud: {enabled: false, title: 'Cero errores', subtitle: ''}, director: {enabled: false}}, setupScene);
