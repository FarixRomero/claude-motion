"""Record the inspected final MP4 and preserve its rendered timeline."""
from pathlib import Path
import hashlib,json,copy
PROJECT=Path(__file__).resolve().parents[1];OUT=PROJECT/'004-Render';TL=PROJECT/'002-Cues/Timeline.json'
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((OUT/'final.mp4.json').read_text())
assert manifest['output_sha256']==digest(OUT/'final.mp4')
assert manifest['timeline_sha256']==digest(TL)
assert -15<=manifest['loudness']['integrated_lufs']<=-13
assert manifest['loudness']['true_peak_dbfs']<=-1
before=json.loads(TL.read_text());after=copy.deepcopy(before)
(OUT/'render-timeline.json').write_bytes(TL.read_bytes())
after['visuals']['review']='passed'
assert {k:v for k,v in before.items() if k!='visuals'}=={k:v for k,v in after.items() if k!='visuals'}
TL.write_text(json.dumps(after,ensure_ascii=False,indent=2)+'\n')
manifest['render_timeline_sha256']=manifest['timeline_sha256'];manifest['timeline_sha256']=digest(TL)
manifest['review_metadata_update']='Only visuals.review changed after inspection; render-timeline.json preserves the rendered timeline.'
(OUT/'final.mp4.json').write_text(json.dumps(manifest,indent=2)+'\n')
sheets=sorted(OUT.glob('final-sheet-*.png'));assert sheets and (OUT/'final-wave.png').exists()
old=json.loads((OUT/'before-claude-voice/yo-hashes.json').read_text())
assert all(digest(PROJECT/'001-Voz/turns'/name)==value for name,value in old.items())
report={'state':'passed','final_sha256':digest(OUT/'final.mp4'),'timeline_sha256':digest(TL),'checked_times':json.loads((OUT/'review-times.json').read_text()),'contact_sheets':[p.name for p in sheets],'loudness':manifest['loudness'],'summary':'Inspected every current final contact sheet and waveform after re-anchoring all nine scenes to the new voice. Original script and all five Yo recordings preserved; Claude uses the approved claude-robot profile and robot-soft effect. Capture used RTX 4070 Ti via D3D12 and NVENC.','speaker_defaults':'scripts/project/speaker-defaults.json','fixes':['Replaced Claude voice with the approved independent masculine soft robotic voice.','Rebuilt word anchors, captions, scene timings and effects from the new joined recording.','Updated shadows on every frame and disabled character self-shadow reception, removing frozen facial shadow artifacts.']}
review=OUT/'review';review.mkdir(exist_ok=True);(review/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Review passed:',OUT/'final.mp4')
