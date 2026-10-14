"""Generate a labeled dialogue with multiple Chatterbox voice profiles."""
import argparse
import hashlib
import shutil
import json
import os
from pathlib import Path
import re
import subprocess


def effect_filter(effect):
    if effect == 'none':
        return ''
    if effect == 'robot':
        return 'highpass=f=100,lowpass=f=6000,aeval=val(0)*(0.78+0.22*cos(2*PI*40*t)),aecho=0.8:0.9:18:0.18,'
    if effect == 'robot-soft':
        return 'highpass=f=75,lowpass=f=8500,aeval=val(0)*(0.93+0.07*cos(2*PI*40*t)),'
    raise ValueError(f'Efecto de voz desconocido: {effect}')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--plan', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--speed', type=float, required=True)
    parser.add_argument('--seed', type=int, required=True)
    parser.add_argument('--pause', type=float, required=True)
    args = parser.parse_args()
    import numpy as np
    import soundfile as sf
    import torch
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS, Conditionals

    if not torch.cuda.is_available():
        raise RuntimeError('CUDA no está disponible para Chatterbox.')
    plan = json.loads(Path(args.plan).read_text())
    output = Path(args.output)
    turns_dir = output / 'turns'
    turns_dir.mkdir()
    print(f'GPU: {torch.cuda.get_device_name(0)}; {len(plan)} turnos.', flush=True)
    model = None
    sample_rate = 24000
    profiles = {}
    pieces, spans, turns, position = [], [], [], 0
    phrase_silence = np.zeros(round(sample_rate * 0.22), dtype=np.float32)
    turn_silence = np.zeros(round(sample_rate * args.pause), dtype=np.float32)
    for index, turn in enumerate(plan):
        speaker = turn['speaker']
        profile = turn['profile_path']
        relative = f'turns/{turn["id"]}-{speaker}.wav'
        if turn.get('reuse_audio'):
            source = Path(turn['reuse_audio'])
            if hashlib.sha256(source.read_bytes()).hexdigest() != turn['reuse_sha256']:
                raise RuntimeError(f'Cambió el WAV que se quería conservar: {turn["id"]}')
            shutil.copyfile(source, output / relative)
            local_spans = turn['reuse_segments']
            print(f'Turno {index + 1}/{len(plan)} [{speaker}]: WAV conservado.', flush=True)
        else:
            if model is None:
                model = ChatterboxMultilingualTTS.from_pretrained(device='cuda', t3_model='v3')
                if model.sr != sample_rate:
                    raise RuntimeError('El modelo debe usar 24 kHz.')
            if profile not in profiles:
                profiles[profile] = Conditionals.load(Path(profile) / 'profile.pt', map_location='cuda').to('cuda')
            model.conds = profiles[profile]
            torch.manual_seed(turn.get('seed', args.seed + index))
            print(f'Turno {index + 1}/{len(plan)} [{speaker}]: {turn["text"]}', flush=True)
            chunks = [s.strip() for s in re.split(r'(?<=[.!?])\s+|\n+', turn['text']) if s.strip()]
            local_audio, local_spans, local_position = [], [], 0
            for ci, chunk in enumerate(chunks):
                if not any(character.isalnum() for character in chunk):
                    local_audio.append(phrase_silence)
                    local_position += phrase_silence.size
                    continue
                if len(chunk) > 300:
                    raise ValueError('Usa frases de hasta 300 caracteres.')
                wav = model.generate(chunk, language_id='es', exaggeration=turn.get('exaggeration', 0.35), cfg_weight=turn.get('cfg_weight', 0.4),
                                     temperature=0.65, repetition_penalty=1.3)
                audio = wav.detach().cpu().squeeze().numpy().astype(np.float32)
                if audio.size == 0 or not np.isfinite(audio).all():
                    raise RuntimeError(f'Audio inválido en {turn["id"]}.')
                local_spans.append({'text': chunk, 'start': local_position / sample_rate,
                                    'end': (local_position + audio.size) / sample_rate})
                local_audio.append(audio)
                local_position += audio.size
                if ci < len(chunks) - 1:
                    local_audio.append(phrase_silence)
                    local_position += phrase_silence.size
            raw = output / 'source.wav'
            sf.write(raw, np.concatenate(local_audio), sample_rate, subtype='PCM_16')
            relative = f'turns/{turn["id"]}-{speaker}.wav'
            # Normalize speakers individually so one voice does not overpower the other.
            subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', '-i', str(raw), '-af',
                f"atempo={args.speed},{effect_filter(turn.get('effect', 'none'))}loudnorm=I=-18:TP=-2:LRA=9", '-ar', str(sample_rate),
                '-c:a', 'pcm_s16le', str(output / relative)], check=True)
        rendered, sr = sf.read(output / relative, dtype='float32')
        if sr != sample_rate or rendered.ndim != 1:
            raise RuntimeError('El audio de turno debe ser mono y conservar el sample rate.')
        turn_start = position / sr
        duration = rendered.size / sr
        span_speed = 1 if turn.get('reuse_audio') else args.speed
        for span in local_spans:
            spans.append(dict(span, start=turn_start + min(span['start'] / span_speed, duration),
                              end=turn_start + min(span['end'] / span_speed, duration),
                              turn=turn['id'], speaker=speaker))
        turns.append({'id': turn['id'], 'speaker': speaker, 'profile': turn['profile'],
                      'text': turn['text'], 'start': turn_start, 'end': turn_start + duration,
                      'audio': relative, 'seed': turn.get('seed', args.seed + index),
                      'effect': turn.get('effect', 'none'),
                      'reused_audio': bool(turn.get('reuse_audio')),
                      'exaggeration': turn.get('exaggeration', 0.35)})
        pieces.append(rendered)
        position += rendered.size
        if index < len(plan) - 1:
            pieces.append(turn_silence)
            position += turn_silence.size
    sf.write(output / 'voz.wav', np.concatenate(pieces), sample_rate, subtype='PCM_16')
    metadata = {'sample_rate': sample_rate, 'duration': position / sample_rate,
                'gpu': torch.cuda.get_device_name(0), 'segments': spans, 'turns': turns,
                'synthesis': {'exaggeration': 0.35, 'cfg_weight': 0.4, 'temperature': 0.65,
                              'repetition_penalty': 1.3, 'phrase_pause_seconds': 0.22,
                              'turn_pause_seconds': args.pause, 'turn_loudness_target': -18}}
    (output / 'worker.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
    (output / 'turns.json').write_text(json.dumps(turns, ensure_ascii=False, indent=2) + '\n')
    if (output / 'source.wav').exists():
        (output / 'source.wav').unlink()


if __name__ == '__main__':
    os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY', '1')
    main()
