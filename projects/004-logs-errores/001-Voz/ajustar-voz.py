"""Generate softer Claude turns while preserving the recorded user turns."""
from pathlib import Path
import importlib.util
import json

ROOT = Path(__file__).resolve().parents[3]
PROJECT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('pipeline', ROOT / 'scripts/project.py')
pipeline = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pipeline)
settings = pipeline.runtime()
config = pipeline.read_json(PROJECT / 'project.json')
previous = pipeline.read_json(PROJECT / '001-Voz/generation.json')
turns = {t['id']: t for t in previous['turns']}
original_input = pipeline.voice_input

def preserved_input(project, config, settings):
    key, inputs, text, plan = original_input(project, config, settings)
    if (config['speakers']['Yo'] != previous['speakers']['Yo']
            or config['voice']['speed'] != previous['voice']['speed']
            or inputs['speaker_profiles_sha256']['Yo'] != previous['speaker_profiles_sha256']['Yo']):
        raise ValueError('Cambió la voz del usuario; revisa su audio antes de reutilizarlo.')
    for turn in plan:
        if turn['speaker'] != 'Yo':
            continue
        old = turns[turn['id']]
        if turn['text'] != old['text']:
            raise ValueError('El guion cambió; no se puede reutilizar este turno.')
        audio = PROJECT / '001-Voz' / old['audio']
        turn.update(reuse_audio=str(audio), reuse_sha256=pipeline.digest(audio),
                    reuse_segments=[dict(s, start=s['start']-old['start'], end=s['end']-old['start']) for s in previous['segments'] if s['turn'] == old['id']])
    return key, inputs, text, plan

config['speakers']['Claude']['effect'] = 'robot-soft'
pipeline.write_json(PROJECT / 'project.json', config)
pipeline.voice_input = preserved_input
with pipeline.project_lock(PROJECT):
    pipeline.generate_voice(PROJECT, config, settings, force=True)
