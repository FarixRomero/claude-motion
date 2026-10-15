#!/usr/bin/env python3
"""Create an isolated narrated project from the approved low-poly scene bank."""
from pathlib import Path
import argparse,importlib.util,json,re,shutil

SKILL=Path(__file__).resolve().parents[1]
ROOT=SKILL.parents[2]
ASSETS=SKILL/'assets/template'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('id',help='Example: 006-claude-deploy')
parser.add_argument('--script',type=Path,help='New labeled dialogue; otherwise copy the example script.')
parser.add_argument('--workspace',type=Path,default=ROOT)
parser.add_argument('--no-register',action='store_true',help='Create an isolated fixture without editing Root.tsx.')
args=parser.parse_args()
if not re.fullmatch(r'[0-9]{3}-[a-z0-9]+(?:-[a-z0-9]+)*',args.id):parser.error('Use an ID such as 006-claude-deploy.')
workspace=args.workspace.resolve();project=workspace/'projects'/args.id;source=workspace/'src'/args.id
if project.exists() or source.exists():parser.error('Project or source already exists; nothing was overwritten.')
script=(args.script.resolve() if args.script else ASSETS/'example-script.md').read_text()
composition='LowPoly'+''.join(part.title() for part in args.id.split('-'))+'Video'
alias='dialogueTimeline'+args.id.split('-')[0]
root_file=workspace/'src/Root.tsx'
root_text=None
if not args.no_register:
    root_text=root_file.read_text()
    if 'export const Root:' not in root_text or '<Still id=' not in root_text:parser.error('Root.tsx layout differs; use --no-register and register manually.')
    if composition in root_text:parser.error('Composition already registered.')
spec=importlib.util.spec_from_file_location('pipeline',ROOT/'scripts/project.py')
pipeline=importlib.util.module_from_spec(spec);spec.loader.exec_module(pipeline)
pipeline.initialize(project,args.id)
replace=lambda text:text.replace('005-low-poly-tokens',args.id).replace('LowPolyTokensVideo',composition)
config=json.loads((ASSETS/'project.json').read_text());config.update(id=args.id,composition=composition,title=args.id.split('-',1)[1].replace('-',' ').title())
config['speakers']['Claude'].update(pipeline.read_json(ROOT/'scripts/project/speaker-defaults.json')['Claude'])
pipeline.write_json(project/'project.json',config)
(project/'001-Voz/guion.md').write_text(script)
(project/'002-Cues/Timeline.json').write_text(replace((ASSETS/'example.timeline.json').read_text()))
for f in (ASSETS/'scenes').iterdir():
    if f.is_file():(project/'003-Escenas'/f.name).write_text(replace(f.read_text()))
source.mkdir(parents=True)
for f in (ASSETS/'src').iterdir():
    if f.is_file():(source/f.name).write_text(replace(f.read_text()))
if root_text is not None:
    imports=f"import {{{composition}}} from './{args.id}/Video';\nimport {alias} from '../projects/{args.id}/002-Cues/Timeline.json';\n\n"
    root_text=root_text.replace('export const Root:',imports+'export const Root:',1)
    registration=f'''<Composition
      id="{composition}"
      component={{{composition}}}
      durationInFrames={{{alias}.durationInFrames}}
      fps={{{alias}.fps}}
      width={{1080}}
      height={{1920}}
      defaultProps={{{{silent: false, audioFile: 'projects/{args.id}/mix.wav'}}}}
    />
    '''
    root_file.write_text(root_text.replace('<Still id=',registration+'<Still id=',1))
print('Created:',project)
print('Composition:',composition)
print('Edit 003-Escenas/content.json and scene-plan.json to match the new dialogue.')
print(f'npm run project -- prepare {args.id}')
print(f'python3 projects/{args.id}/003-Escenas/prepare-scenes.py')
print(f'nice -n 12 python3 projects/{args.id}/003-Escenas/render-final.py')
print('Example timing remains pending until the new voice is generated and synced.')
