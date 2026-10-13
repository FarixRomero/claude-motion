"""Chatterbox worker, run only in the dedicated voice environment."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--text', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--profile', required=True)
    parser.add_argument('--speed', type=float, required=True)
    parser.add_argument('--seed', type=int, required=True)
    args = parser.parse_args()
    import numpy as np
    import soundfile as sf
    import torch
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS, Conditionals

    if not torch.cuda.is_available():
        raise RuntimeError('CUDA no está disponible en el entorno de voz.')
    chunks = [s.strip() for s in re.split(r'(?<=[.!?])\s+|\n+', Path(args.text).read_text()) if s.strip()]
    if not chunks or any(len(s) > 300 for s in chunks):
        raise ValueError('Separa el guion en frases de hasta 300 caracteres.')
    print(f'GPU: {torch.cuda.get_device_name(0)}', flush=True)
    model = ChatterboxMultilingualTTS.from_pretrained(device='cuda', t3_model='v3')
    model.conds = Conditionals.load(Path(args.profile) / 'profile.pt', map_location='cuda').to('cuda')
    torch.manual_seed(args.seed)
    pieces, spans, position = [], [], 0
    silence = np.zeros(round(model.sr * 0.22), dtype=np.float32)
    for index, chunk in enumerate(chunks):
        print(f'Frase {index + 1}/{len(chunks)}: {chunk}', flush=True)
        wav = model.generate(chunk, language_id='es', exaggeration=0.35, cfg_weight=0.4,
                             temperature=0.65, repetition_penalty=1.3)
        audio = wav.detach().cpu().squeeze().numpy().astype(np.float32)
        if audio.size == 0 or not np.isfinite(audio).all():
            raise RuntimeError('Chatterbox devolvió audio vacío o inválido.')
        spans.append({'text': chunk, 'start': position / model.sr, 'end': (position + audio.size) / model.sr})
        pieces.append(audio)
        position += audio.size
        if index < len(chunks) - 1:
            pieces.append(silence)
            position += silence.size
    output = Path(args.output)
    source = output / 'source.wav'
    sf.write(source, np.concatenate(pieces), model.sr, subtype='PCM_16')
    subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source),
                    '-af', f'atempo={args.speed}', '-c:a', 'pcm_s16le', str(output / 'voz.wav')], check=True)
    duration = sf.info(output / 'voz.wav').duration
    for span in spans:
        span['start'] = min(span['start'] / args.speed, duration)
        span['end'] = min(span['end'] / args.speed, duration)
    (output / 'worker.json').write_text(json.dumps({'sample_rate': model.sr, 'duration': duration,
        'gpu': torch.cuda.get_device_name(0), 'segments': spans,
        'synthesis': {'exaggeration': 0.35, 'cfg_weight': 0.4, 'temperature': 0.65,
                      'repetition_penalty': 1.3, 'pause_seconds': 0.22}}, ensure_ascii=False, indent=2) + '\n')
    source.unlink()


if __name__ == '__main__':
    os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY', '1')
    main()
