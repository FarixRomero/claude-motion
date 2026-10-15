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
report = {'state':'passed','final_sha256':digest(OUT/'final.mp4'),'composition':'LowPolyTokensVideo','timeline_sha256':digest(TL),'checked_times':json.loads((OUT/'review-times.json').read_text()),'contact_sheets':[p.name for p in sheets],'waveform':'final-wave.png','loudness':manifest['loudness'],'checks':['All twelve scenes, every named visual state, frame zero and closing hold inspected on current final MP4.','Human mouth opens with the approved voice envelope, is aligned beneath the right eyes, and closes during intentional silence.','Captions retain original punctuation, fit inside safe margins and highlight the current word.','Titles and panels clear essential face features; completion panel raised after draft inspection.','Approved independent Claude robot-soft voice preserved; punctual effects only.','Trademark present throughout; vertical dimensions, 60 fps, duration and audio verified by render pipeline.'],'gpu':json.loads((OUT/'gpu-d3d12-device.json').read_text()),'encoding':'h264_nvenc, hardware accelerated','fixes':['Long outrage caption split at sentence boundaries; normal wrapping enforced.','Human close-up camera raised to keep hair clear of titles.','Completion card raised to clear the cube.','Removed the brief human-only shot during the silent pause; both characters and the permission panel remain visible with a held camera.','Final offer shares the permission camera track; there is no dolly reset entering or leaving the ellipsis pause.']}
review=OUT/'review';review.mkdir(exist_ok=True)
(review/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Review recorded for',OUT/'final.mp4')
