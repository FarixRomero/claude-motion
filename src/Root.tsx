import React from 'react';
import {Composition, Still} from 'remotion';
import {ArticleCover} from './ArticleCover';
import {EffortVideo} from './EffortVideo';
import {FPS, H, TL, W} from './lib';
import {MicroservicesVoiceVideo} from './001-mi-video/Video';
import voiceTimeline from '../projects/001-mi-video/002-Cues/Timeline.json';

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
    <Still id="ArticleCover" component={ArticleCover} width={2000} height={800} />
  </>
);
