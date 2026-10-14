import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {MicroservicesVoiceVideo} from './001-mi-video/Video';
import voiceTimeline from '../projects/001-mi-video/002-Cues/Timeline.json';
import {CambiaBotonVideo} from './003-cambia-boton/Video';
import buttonTimeline from '../projects/003-cambia-boton/002-Cues/Timeline.json';
import {DentistPermissionsVideo} from './002-dentista-permisos/Video';
import {DentistScenePreview} from './002-dentista-permisos/ScenePreview';
import dentistTimeline from '../projects/002-dentista-permisos/002-Cues/Timeline.json';

import {LogsErroresVideo} from './004-logs-errores/Video';
import logsTimeline from '../projects/004-logs-errores/002-Cues/Timeline.json';

export const Root: React.FC = () => (
  <>
    <Composition
      id="EffortVideo"
      component={EffortVideo}
      durationInFrames={Math.round(TL.duration * FPS)}
      fps={FPS}
      width={W}
      height={H}
    />
    <Composition
      id="MicroservicesVoiceVideo"
      component={MicroservicesVoiceVideo}
      durationInFrames={voiceTimeline.durationInFrames}
      fps={voiceTimeline.fps}
      width={1080}
      height={1920}
      defaultProps={{silent: false, audioFile: 'projects/001-mi-video/mix.wav'}}
    />
    <Composition
      id="DentistPermissionsVideo"
      component={DentistPermissionsVideo}
      durationInFrames={dentistTimeline.durationInFrames}
      fps={dentistTimeline.fps}
      width={1080}
      height={1920}
      defaultProps={{silent: false, audioFile: 'projects/002-dentista-permisos/mix.wav'}}
    />
    <Composition
      id="DentistScenePreview"
      component={DentistScenePreview}
      durationInFrames={dentistTimeline.durationInFrames}
      fps={dentistTimeline.fps}
      width={1080}
      height={1920}
    />
    <Composition
      id="CambiaBotonVideo"
      component={CambiaBotonVideo}
      durationInFrames={buttonTimeline.durationInFrames}
      fps={buttonTimeline.fps}
      width={1080}
      height={1920}
      defaultProps={{silent: false, audioFile: 'projects/003-cambia-boton/mix.wav'}}
    />
    <Composition
      id="LogsErroresVideo"
      component={LogsErroresVideo}
      durationInFrames={logsTimeline.durationInFrames}
      fps={logsTimeline.fps}
      width={1080}
      height={1920}
      defaultProps={{silent: false, audioFile: 'projects/004-logs-errores/mix.wav'}}
    />
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
