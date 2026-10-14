"""Transcribe each known dialogue turn, keeping its speaker and global time."""
import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--audio', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--model', required=True)
    parser.add_argument('--device', required=True)
    args = parser.parse_args()
    from faster_whisper import WhisperModel
    root = Path(args.audio).resolve().parent
    turns = json.loads((root / 'turns.json').read_text())
    model = WhisperModel(args.model, device=args.device,
                         compute_type='float16' if args.device == 'cuda' else 'int8')
    phrases, words, missed = [], [], []
    for turn in turns:
        file = (root / turn['audio']).resolve()
        if not file.is_relative_to(root):
            raise ValueError('La ruta de un turno debe permanecer dentro de 001-Voz/.')
        print(f'Transcribiendo {turn["id"]} [{turn["speaker"]}]', flush=True)
        segments, info = model.transcribe(str(file), language='es', beam_size=5,
            word_timestamps=True, vad_filter=True, condition_on_previous_text=False,
            initial_prompt=turn['text'])
        before = len(words)
        for segment in segments:
            if not segment.text.strip():
                continue
            phrase_id = f'p{len(phrases) + 1:04d}'
            phrase_words = []
            for word in segment.words or []:
                if not word.word.strip():
                    continue
                start = min(turn['end'], max(turn['start'], turn['start'] + word.start))
                end = min(turn['end'], max(start, turn['start'] + word.end))
                item = {'id': f'w{len(words) + 1:05d}', 'phrase': phrase_id,
                        'speaker': turn['speaker'], 'turn': turn['id'], 'start': start,
                        'end': end, 'text': word.word.strip(), 'probability': word.probability}
                words.append(item)
                phrase_words.append(item)
            if phrase_words:
                phrases.append({'id': phrase_id, 'start': phrase_words[0]['start'],
                    'end': phrase_words[-1]['end'], 'text': ' '.join(w['text'] for w in phrase_words),
                    'speaker': turn['speaker'], 'turn': turn['id'], 'words': [w['id'] for w in phrase_words]})
        if len(words) == before:
            missed.append(turn['id'])
    if missed:
        raise ValueError('Whisper no reconoció estos turnos: ' + ', '.join(missed))
    Path(args.output).write_text(json.dumps({'model': f'faster-whisper/{args.model}',
        'language': 'es', 'text': ' '.join(p['text'] for p in phrases), 'segments': phrases,
        'words': words, 'turns': turns, 'recognition': 'Per-turn audio with script context; speaker known from generation.'},
        ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
