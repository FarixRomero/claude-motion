import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = {...process.env};
// The bootstrap can install Chromium's shared libraries without sudo.
const localLibs = path.join(os.homedir(), '.local/opt/browser-libs/usr/lib/x86_64-linux-gnu');
if (fs.existsSync(localLibs)) env.LD_LIBRARY_PATH = [localLibs, env.LD_LIBRARY_PATH].filter(Boolean).join(':');

const run = (command, args) => {
  const result = spawnSync(command, args, {cwd: root, env, stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run('python3', ['-m', 'sfx', 'sfx/cues/cicd-production.py']);
run('node', ['sims/build.mjs', 'cicd-production']);
run('node', [
  'sims/capture.mjs', 'cicd-production', '--size', '1080x1080', '--dpr', '1',
  '--fps', '60', '--crf', '16', '--out', 'out/cicd-production-silent.mp4',
]);
run('ffmpeg', [
  '-loglevel', 'error', '-y', '-i', 'out/cicd-production-silent.mp4',
  '-i', 'public/cicd-production.wav', '-map', '0:v', '-map', '1:a',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart',
  '-shortest', 'out/cicd-production.mp4',
]);
run('node', ['scripts/wave.mjs', 'out/cicd-production.mp4', '--timeline', 'sims/cicd-production/timeline.json']);
fs.copyFileSync(path.join(root, 'out/wave.png'), path.join(root, 'out/cicd-production-wave.png'));
console.log('Final: out/cicd-production.mp4');
