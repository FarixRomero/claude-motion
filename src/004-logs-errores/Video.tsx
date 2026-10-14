import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, staticFile} from 'remotion';

export type LogsVideoProps = {silent: boolean; audioFile: string};

// The deterministic Three.js capture includes the scene, captions and trademark.
export const LogsErroresVideo: React.FC<LogsVideoProps> = ({silent, audioFile}) => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile('projects/004-logs-errores/scene-3d.mp4')} muted style={{width: '100%', height: '100%'}} />
    {!silent && <Audio src={staticFile(audioFile)} />}
  </AbsoluteFill>
);
