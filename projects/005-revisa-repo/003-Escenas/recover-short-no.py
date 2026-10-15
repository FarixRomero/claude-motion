"""Recover a VAD-omitted word using independent recognition of unchanged audio."""
from pathlib import Path
import importlib.util,json
P=Path(__file__).resolve().parents[1];ROOT=P.parents[1]
spec=importlib.util.spec_from_file_location('pipeline',ROOT/'scripts/project.py');pipeline=importlib.util.module_from_spec(spec);spec.loader.exec_module(pipeline)
tr=json.loads((P/'002-Cues/transcript.json').read_text());(P/'004-Render/transcript-before-no-recovery.json').write_text(json.dumps(tr,ensure_ascii=False,indent=2)+'\n')
original={w['id']:w for w in tr['words']};short=json.loads((P/'004-Render/short-no-recognition.json').read_text());assert short[0]['text']=='No.' and short[0]['probability']>.8
words=[];phrases=[]
for turn in tr['turns']:
 groups=[[dict(w,start=w['start']+turn['start'],end=w['end']+turn['start'],speaker=turn['speaker'],turn=turn['id']) for w in short]] if turn['id']=='t0013' else [[original[x] for x in ph['words']] for ph in tr['segments'] if ph['turn']==turn['id']]
 for group in groups:
  pid=f'p{len(phrases)+1:04d}';ids=[]
  for source in group:
   w=dict(source,id=f'w{len(words)+1:05d}',phrase=pid);words.append(w);ids.append(w['id'])
  phrases.append({'id':pid,'speaker':turn['speaker'],'turn':turn['id'],'start':group[0]['start'],'end':group[-1]['end'],'text':' '.join(w['text'] for w in group),'words':ids})
tr.update(words=words,segments=phrases,text=' '.join(p['text'] for p in phrases));tr['review']='t0013 independently recognized without VAD; original WAV unchanged.'
v=pipeline.validate_transcript((P/'001-Voz/narracion.txt').read_text(),tr,tr['duration']);assert not v['differences'];flag=[w for w in words if w['id'] in v['uncertain_words']];assert all(w['end']>w['start'] for w in flag)
v['review']={'state':'accepted','reason':'All script words matched. Short No recovered from unchanged turn using non-VAD recognition with confidence 0.897. Remaining confidence flags have positive durations and correct script text; retained for audit. Repeated Hazlo was regenerated.','uncertain_words':flag}
t=json.loads((P/'002-Cues/Timeline.json').read_text());t['narration'].update(words=words,phrases=phrases);t['sync'].update(state='ok',review=v['review'])
for file,obj in [('transcript.json',tr),('validation.json',v),('Timeline.json',t)]: (P/'002-Cues'/file).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
(P/'002-Cues/subtitles.srt').write_text('\n\n'.join(f'{i}\n{pipeline.srt_time(p["start"])} --> {pipeline.srt_time(p["end"])}\n{p["text"]}' for i,p in enumerate(phrases,1))+'\n')
print(len(words),'words; full script recovered; WAV unchanged.')
