"""Install the approved characters and continuous-camera episode adapter."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];P=Path(__file__).resolve().parents[1];TARGET=ROOT/'src/006-envio-prd';BASE=ROOT/'.claude/skills/low-poly-dialogue/assets/template/src'
TARGET.mkdir(exist_ok=True)
for f in BASE.iterdir():
 if f.is_file():(TARGET/f.name).write_text(f.read_text().replace('005-low-poly-tokens','006-envio-prd').replace('LowPolyTokensVideo','EnvioPrdVideo'))
p=TARGET/'video-design.ts';s=p.read_text().replace("export const at = (name: keyof typeof TL.events) => TL.events[name].at;","export const at = (name:string) => (TL.events as Record<string,{at:number}>)[name].at;");p.write_text(s)
p=TARGET/'CubeCharacter.tsx';s=p.read_text().replace('  color?: string;','  color?: string;\n  opacity?: number;').replace('color=C.cubeDefault,talking=false','color=C.cubeDefault,opacity=1,talking=false').replace('color={color}/>', 'color={color} transparent opacity={opacity}/>').replace('color={C.cubeEye}/>', 'color={C.cubeEye} transparent opacity={opacity}/>');p.write_text(s)
p=TARGET/'Disappearance.tsx';p.write_text((P/'003-Escenas/Disappearance.tsx').read_text())
s=(ROOT/'src/005-revisa-repo/Video.tsx').read_text();stage=s[:s.index('const panelStyle:')].replace('005-revisa-repo','006-envio-prd').replace("import {CubeCharacter} from './CubeCharacter';", "import {CubeCharacter} from './CubeCharacter';\nimport {Disappearance} from './Disappearance';")
stage=stage.replace('import {easeOut, prog}', 'import {easeOut, easeInOut, prog}')
stage=stage.replace('const dolly=prog(t,s.start,s.end,easeOut);',"const dolly=prog(t,TL.motion.cameraStart,TL.motion.cameraEnd,easeOut);\n  const departure=prog(t,TL.motion.departureStart,TL.motion.departureEnd,easeInOut);")
stage=stage.replace("scene==='files'||scene==='outrage'",'activeScene(t).reaction')
stage=stage.replace('<CubeCharacter color={C.claude}', '<CubeCharacter opacity={1-departure} color={C.claude}')
stage=stage.replace('<group visible={wide||!human} position=', '<group visible={(wide||!human)&&departure<1} position=')
stage=stage.replace('      <group visible={wide}><Keyboard/></group>', '      <Disappearance progress={departure}/>\n      <group visible={wide}><Keyboard/></group>')
(TARGET/'Video.tsx').write_text(stage+(P/'003-Escenas/ui-part.txt').read_text())
p=ROOT/'src/Root.tsx';s=p.read_text()
if 'id="EnvioPrdVideo"' not in s:
 s=s.replace('export const Root:',"import {EnvioPrdVideo} from './006-envio-prd/Video';\nimport envioPrdTimeline from '../projects/006-envio-prd/002-Cues/Timeline.json';\n\nexport const Root:",1).replace('<Still id="ArticleCover"','''<Composition id="EnvioPrdVideo" component={EnvioPrdVideo} durationInFrames={envioPrdTimeline.durationInFrames} fps={envioPrdTimeline.fps} width={1080} height={1920} defaultProps={{silent:false,audioFile:'projects/006-envio-prd/mix.wav'}} />
    <Still id="ArticleCover"''',1)
 p.write_text(s)
print('Installed continuous camera, crossfades, approved characters and departure effect.')
