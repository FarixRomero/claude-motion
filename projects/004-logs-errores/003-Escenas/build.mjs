import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(project, '../..');
const timeline = JSON.parse(fs.readFileSync(path.join(project, '002-Cues/Timeline.json'), 'utf8'));
if (timeline.sync.state !== 'ok' || !['ready', 'reviewed'].includes(timeline.visuals.state)) {
  throw new Error('Prepare and review narration and timeline before capturing.');
}
const run = (command, args) => execFileSync(command, args, {cwd: root, stdio: 'inherit'});
run('node', ['sims/build.mjs', 'logs-errores']);
run('node', ['sims/capture.mjs', 'logs-errores', '--size', '1080x1920', '--dpr', '1', '--fps', String(timeline.fps), '--out', path.join(project, '004-Render/scene-3d.mp4')]);
const publicDir = path.join(root, 'public/projects/004-logs-errores');
fs.mkdirSync(publicDir, {recursive: true});
fs.copyFileSync(path.join(project, '004-Render/scene-3d.mp4'), path.join(publicDir, 'scene-3d.mp4'));
run('npm', ['run', 'project', '--', 'render', '004-logs-errores']);
