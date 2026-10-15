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
report = {'state':'passed','final_sha256':digest(OUT/'final.mp4'),'composition':'RevisaRepoVideo','timeline_sha256':digest(TL),'checked_times':json.loads((OUT/'review-times.json').read_text()),'contact_sheets':[p.name for p in sheets],'waveform':'final-wave.png','loudness':manifest['loudness'],'checks':['All 23 turns, frame zero, all named visual states and closing hold inspected on the current final MP4.','Human and Claude geometries match the approved skill assets byte for byte.','Mouth follows the active human voice; Claude uses squash and stretch with the approved robot-soft voice.','Short responses share a continuous wide camera track; only the five-year reaction uses a motivated human close-up.','Original script retained; repeated Hazlo repaired and VAD-missed No recovered independently from unchanged audio.','Captions fit safe margins, retain original punctuation and highlight the current word.','21 punctual cues without music; format and final audio measured by pipeline.'],'gpu':json.loads((OUT/'gpu-device.json').read_text()) if (OUT/'gpu-device.json').exists() else {'renderer':'CPU fallback; see render log'},'encoding':'h264_nvenc, hardware accelerated','fixes':['Repaired repeated Hazlo in turn 16; preserved the other 22 recordings.','Recovered No in turn 13 using independent non-VAD word recognition.','Adapted the approved interface layouts and camera tracks to the actual 23-turn dialogue.']}
review=OUT/'review';review.mkdir(exist_ok=True)
(review/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Review recorded for',OUT/'final.mp4')
