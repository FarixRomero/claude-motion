from pathlib import Path
import json
from faster_whisper import WhisperModel
p=Path(__file__).resolve().parents[1];model=WhisperModel('turbo',device='cuda',compute_type='float16')
segments,_=model.transcribe(str(p/'001-Voz/turns/t0012-Claude.wav'),language='es',beam_size=5,word_timestamps=True,vad_filter=False,condition_on_previous_text=False,initial_prompt='Diez dólares, cien dólares, mil dólares.')
words=[{'text':w.word.strip(),'start':w.start,'end':w.end,'probability':w.probability} for s in segments for w in s.words]
(p/'004-Render/cost-recognition.json').write_text(json.dumps(words,ensure_ascii=False,indent=2)+'\n');print(words)
