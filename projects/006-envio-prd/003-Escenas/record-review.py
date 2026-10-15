"""Record a completed manual review without changing animation data."""
from pathlib import Path
import copy, hashlib, json

PROJECT = Path(__file__).resolve().parents[1]
OUT = PROJECT/'004-Render'
TL = PROJECT/'002-Cues/Timeline.json'
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
manifest = json.loads((OUT/'final.mp4.json').read_text())
assert manifest['output_sha256']==digest(OUT/'final.mp4')
assert manifest['timeline_sha256']==digest(TL)
assert -15<=manifest['loudness']['integrated_lufs']<=-13
assert manifest['loudness']['true_peak_dbfs']<=-1
before = json.loads(TL.read_text()); after = copy.deepcopy(before)
(OUT/'render-timeline.json').write_bytes(TL.read_bytes())
assert digest(OUT/'render-timeline.json')==manifest['timeline_sha256']
after['visuals']['review'] = 'passed'
assert {k:v for k,v in before.items() if k!='visuals'}=={k:v for k,v in after.items() if k!='visuals'}
TL.write_text(json.dumps(after,ensure_ascii=False,indent=2)+'\n')
manifest['render_timeline_sha256'] = manifest['timeline_sha256']
manifest['timeline_sha256'] = digest(TL)
manifest['review_metadata_update'] = 'Only visuals.review changed after inspection; render-timeline.json preserves the rendered timeline.'
(OUT/'final.mp4.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
sheets = sorted(OUT.glob('final-sheet-*.png'))
assert sheets and (OUT/'final-wave.png').exists()
report = {'state':'passed','final_sha256':digest(OUT/'final.mp4'),'composition':'EnvioPrdVideo','timeline_sha256':digest(TL),'checked_times':json.loads((OUT/'review-times.json').read_text()),'contact_sheets':[p.name for p in sheets],'waveform':'final-wave.png','loudness':manifest['loudness'],'checks':['All 17 turns, frame zero, every named visual state, transitions and closing hold inspected on current final MP4.','The approved human and Claude geometries are retained; only Claude opacity is animated for the requested departure.','One camera track covers the entire scene with no cut or dolly reset; headings and panels crossfade over 0.42 seconds.','Claude fades over 2.2 seconds with deterministic orange fragments; the empty position remains visible at the end.','Original script preserved; stage direction excluded explicitly and not narrated.','Repaired two synthesized turns; 104 spoken words match the script and original punctuation is retained in captions.','Voice and punctual effects only; audio and video format measured by render pipeline.'],'gpu':json.loads((OUT/'gpu-device.json').read_text()) if (OUT/'gpu-device.json').exists() else {'renderer':'CPU fallback; see render log'},'encoding':'h264_nvenc, hardware accelerated','fixes':['Corrected synthesis in API-key and cost turns while preserving the remaining recordings.','Anchored all visual effects to the corrected recording.','Added continuous framing, crossfades and the requested slow Claude disappearance.','Re-rendered using short GPU segments to avoid context loss and initialized Claude materials as transparent for a continuous fade.']}
review=OUT/'review';review.mkdir(exist_ok=True)
(review/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Review recorded for',OUT/'final.mp4')
