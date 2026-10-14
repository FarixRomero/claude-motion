"""Create a reusable local Chatterbox V3 profile from an audio reference."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--name', required=True)
    parser.add_argument('--reference', type=Path, required=True)
    parser.add_argument('--description', default='Perfil local de referencia.')
    parser.add_argument('--source-url')
    args = parser.parse_args()
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]*', args.name):
        parser.error('Usa un nombre de perfil sin rutas.')
    root = Path(__file__).resolve().parents[2]
    output = root / '.tools/voices' / args.name
    if (output / 'profile.pt').exists() or (output / 'voice.json').exists():
        parser.error('El perfil ya existe; usa otro nombre para conservarlo.')
    import soundfile as sf
    import torch
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    if not torch.cuda.is_available():
        parser.error('CUDA no está disponible.')
    output.mkdir(parents=True, exist_ok=True)
    temporary = output / 'reference.partial.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-y', '-i', str(args.reference.resolve()),
                    '-t', '12', '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', str(temporary)], check=True)
    info = sf.info(temporary)
    if not 6 <= info.duration <= 20:
        temporary.unlink()
        parser.error('La referencia debe contener al menos 6 segundos de voz limpia.')
    model = ChatterboxMultilingualTTS.from_pretrained(device='cuda', t3_model='v3')
    model.prepare_conditionals(str(temporary), exaggeration=0.35)
    profile = output / 'profile.partial.pt'
    model.conds.to('cpu').save(profile)
    metadata = {'voice': args.name, 'model': 'chatterbox-multilingual-v3', 'language': 'es',
                'description': args.description, 'source_url': args.source_url,
                'duration': info.duration, 'reference_sha256': hashlib.sha256(temporary.read_bytes()).hexdigest()}
    temporary.replace(output / 'reference.wav')
    profile.replace(output / 'profile.pt')
    (output / 'voice.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
    print(f'Perfil creado: {output}', flush=True)


if __name__ == '__main__':
    main()
