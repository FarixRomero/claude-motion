"""Rebuild visual anchors after preparing this project's final narration."""
from pathlib import Path
import json
import math
import unicodedata

PROJECT = Path(__file__).resolve().parents[1]
p = PROJECT / '002-Cues/Timeline.json'
t = json.loads(p.read_text())
n = t['narration']
turns, words, phrases = n['turns'], n['words'], n['phrases']

def clean(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn').strip('¡!¿?.,')

def event(name, ti, word=None, offset=0):
    turn = turns[ti-1]
    ws = [w for w in words if w['turn'] == turn['id']]
    w = next(w for w in ws if clean(w['text']) == clean(word)) if word else ws[0]
    t['events'][name] = {'at': round(w['start'] + offset, 6), 'anchor': {'word': w['id'], 'phrase': w['phrase'], 'turn': turn['id']}, 'offset': offset}

names = ['production','fixed','question','logs','alerts','argument','dashboard','fire','punchline']
indices = [1,2,3,4,6,7,8,9,10]
titles = ['Producción falla','Solución inmediata','Demasiado rápido','Apagar la evidencia','También las alertas','La discusión','La falsa victoria','La realidad','El remate']
t['scenes'], t['events'] = [], {}
for i, (name, ti, title) in enumerate(zip(names, indices, titles)):
    start = 0 if i == 0 else turns[ti-1]['start']
    end = turns[indices[i+1]-1]['start'] if i+1 < len(indices) else t['duration']
    ps = [p['id'] for p in phrases if start <= p['start'] < end]
    t['scenes'].append({'id': name, 'title': title, 'start': start, 'end': end, 'phrases': ps, 'camera': name, 'enter': .65})
    event(name+'.enter', ti)
for args in [('fix.key',2,'solucioné'),('logs.off',4,'logs'),('logs.reaction',5),('alerts.off',6,'alertas'),('smoke.start',6,'innecesarias'),('argument.jump',7,'nada'),('dashboard.zero',8,'Cero'),('fire.reveal',9,'servidores'),('records.empty',10,'registros'),('punchline.look',10,'incidente')]:
    event(*args)
t['captions'] = []
for turn in turns:
    ws = [w for w in words if w['turn'] == turn['id']]
    tokens = turn['text'].split()
    if len(ws) != len(tokens):
        raise ValueError(f'Review caption word mapping: {turn["id"]}')
    size = math.ceil(len(ws) / math.ceil(len(ws)/5))
    for i in range(0, len(ws), size):
        chunk = ws[i:i+size]
        t['captions'].append({'start': chunk[0]['start'], 'end': ws[i+size]['start'] if i+size < len(ws) else turn['end']+.10, 'speaker': turn['speaker'], 'words': [{'id': w['id'], 'start': w['start'], 'end': w['end'], 'text': tokens[i+j]} for j,w in enumerate(chunk)]})
t['visuals'] = {'state': 'ready', 'style': 'block-3d', 'storyboard': '../003-Escenas/storyboard.md', 'renderer': 'sims/logs-errores', 'review': 'pending'}
p.write_text(json.dumps(t, ensure_ascii=False, indent=2)+'\n')
print(f'{t["duration"]:.2f} seconds; {len(t["scenes"])} scenes; {len(t["events"])} anchors')
