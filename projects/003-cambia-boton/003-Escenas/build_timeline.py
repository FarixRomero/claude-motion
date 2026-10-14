"""Build the approved storyboard from the final recorded dialogue."""
import json
from pathlib import Path
import unicodedata

PROJECT = Path(__file__).resolve().parents[1]
PATH = PROJECT / '002-Cues/Timeline.json'
tl = json.loads(PATH.read_text())
words = tl['narration']['words']
turns = tl['narration']['turns']

def normal(text):
    return ''.join(c for c in unicodedata.normalize('NFD', text.lower()) if c.isalnum())

def word(turn, text):
    candidates = [w for w in words if w['turn'] == f't{turn:04d}' and normal(w['text']) == normal(text)]
    if not candidates:
        raise ValueError(f'No word anchor for turn {turn}: {text}')
    return candidates[0]

def event(turn, text):
    w = word(turn, text)
    return {'at': w['start'], 'anchor': {'word': w['id'], 'turn': w['turn']}, 'text': w['text']}

def first(turn):
    return next(w for w in words if w['turn'] == f't{turn:04d}')

spec = [('request', 1, 'SOLO UN BOTÓN'), ('redesign', 2, 'ARQUITECTURA REDISEÑADA'),
        ('services', 4, '30 MICROSERVICIOS'), ('scale', 5, 'ERA CAMBIAR EL COLOR'),
        ('users', 7, 'USUARIOS REALES: 3'), ('button', 9, 'SIGUE AZUL')]
tl['scenes'] = []
for i, (name, turn, title) in enumerate(spec):
    w = first(turn)
    start = 0 if i == 0 else max(0, w['start'] - 0.12)
    tl['scenes'].append({'id': name, 'title': title, 'start': start, 'anchor': {'word': w['id'], 'turn': w['turn']},
                         'enter': 0.45, 'exit': 0.25})
for i, s in enumerate(tl['scenes']):
    s['end'] = tl['scenes'][i+1]['start'] if i+1 < len(tl['scenes']) else tl['duration']

anchors = {'blue': (1, 'azul'), 'green': (1, 'verde'), 'understood': (2, 'Entendido'),
           'redesign': (2, 'rediseñado'), 'confused': (3, 'Cómo'), 'thirty': (4, 'treinta'),
           'kubernetes': (4, 'Kubernetes'), 'kafka': (4, 'Kafka'), 'events': (4, 'eventos'),
           'complaint': (5, 'Pero'), 'color': (5, 'color'), 'autoscale': (6, 'escalamiento'),
           'capacity': (6, 'diez'), 'million': (6, 'usuarios'), 'question': (7, 'cuántos'),
           'three': (8, 'Tres'), 'you': (8, 'ti'), 'where': (9, 'botón'),
           'punchline': (10, 'Sigue'), 'stillBlue': (10, 'azul')}
tl['events'] = {name: event(*ref) for name, ref in anchors.items()}
tl['captions'] = []
for turn in turns:
    ww = [w for w in words if w['turn'] == turn['id']]
    groups, group = [], []
    for w in ww:
        if group and (len(group) >= 5 or len(' '.join(x['text'] for x in group+[w])) > 34):
            groups.append(group); group = []
        group.append(w)
        if w['text'].endswith(('.', '!', '?', ':')):
            groups.append(group); group = []
    if group:
        groups.append(group)
    for i, g in enumerate(groups):
        end = groups[i+1][0]['start'] if i+1 < len(groups) else min(turn['end'] + 0.18, tl['duration'])
        tl['captions'].append({'start': g[0]['start'], 'end': end, 'words': [w['id'] for w in g], 'speaker': turn['speaker']})
tl['visuals'] = {'state': 'ready', 'storyboard': '../003-Escenas/storyboard.md', 'hero': 'thirty',
                 'note': 'Scene and word anchors checked against the final sped-up dialogue.'}
PATH.write_text(json.dumps(tl, ensure_ascii=False, indent=2)+'\n')
print(f"{len(tl['scenes'])} scenes, {len(tl['events'])} events, {len(tl['captions'])} captions; {tl['duration']} s")
