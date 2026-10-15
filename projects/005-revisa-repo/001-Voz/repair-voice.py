"""Repair the repeated Hazlo while preserving the other 22 recorded turns."""
from pathlib import Path
import importlib.util
ROOT=Path(__file__).resolve().parents[3];PROJECT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('pipeline',ROOT/'scripts/project.py');pipeline=importlib.util.module_from_spec(spec);spec.loader.exec_module(pipeline)
previous=pipeline.read_json(PROJECT/'001-Voz/generation.json');turns={t['id']:t for t in previous['turns']};original=pipeline.voice_input

def voice_input(project,config,settings):
 key,inputs,text,plan=original(project,config,settings)
 for turn in plan:
  if turn['id']=='t0016':turn['seed']=997;continue
  old=turns[turn['id']];assert old['text']==turn['text'];audio=PROJECT/'001-Voz'/old['audio']
  turn.update(reuse_audio=str(audio),reuse_sha256=pipeline.digest(audio),reuse_segments=[dict(s,start=s['start']-old['start'],end=s['end']-old['start']) for s in previous['segments'] if s['turn']==old['id']])
 return key,inputs,text,plan
pipeline.voice_input=voice_input
with pipeline.project_lock(PROJECT):pipeline.generate_voice(PROJECT,pipeline.read_json(PROJECT/'project.json'),pipeline.runtime(),force=True)
