"""Whisper worker, run after Chatterbox exits to release GPU memory."""
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
    model = WhisperModel(args.model, device=args.device,
                         compute_type='float16' if args.device == 'cuda' else 'int8')
    segments, info = model.transcribe(args.audio, language='es', beam_size=5,
        word_timestamps=True, vad_filter=True, condition_on_previous_text=False)
    phrases, words = [], []
    for segment in segments:
        if not segment.text.strip():
            continue
        phrase_id = f'p{len(phrases) + 1:04d}'
        phrase = {'id': phrase_id, 'start': segment.start, 'end': segment.end,
                  'text': segment.text.strip(), 'words': []}
        for word in segment.words or []:
            if word.word.strip():
                item = {'id': f'w{len(words) + 1:05d}', 'phrase': phrase_id,
                        'start': word.start, 'end': word.end,
                        'text': word.word.strip(), 'probability': word.probability}
                words.append(item)
                phrase['words'].append(item['id'])
        phrases.append(phrase)
    Path(args.output).write_text(json.dumps({'model': f'faster-whisper/{args.model}',
        'language': info.language, 'text': ' '.join(p['text'] for p in phrases),
        'segments': phrases, 'words': words}, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
