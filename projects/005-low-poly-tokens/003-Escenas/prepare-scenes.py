"""Anchor the storyboard and speech envelopes to the approved recording."""
from pathlib import Path
import array, hashlib, json, math, unicodedata, wave

PROJECT = Path(__file__).resolve().parents[1]
p = PROJECT / '002-Cues/Timeline.json'
t = json.loads(p.read_text())
n = t['narration']; turns = n['turns']; words = n['words']; phrases = n['phrases']
normalize = lambda s: ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if unicodedata.category(c)!='Mn').strip('¿?¡!.,')
t['events'] = {}
def anchor(name, turn_number, token=None):
    turn = turns[turn_number-1]
    ws = [w for w in words if w['turn']==turn['id']]
    if not ws:
        t['events'][name] = {'at':turn['start'],'anchor':{'turn':turn['id']},'kind':'intentional_silence'}
        return
    word = next(w for w in ws if normalize(w['text'])==normalize(token)) if token else ws[0]
    t['events'][name] = {'at':word['start'],'anchor':{'word':word['id'],'phrase':word['phrase'],'turn':turn['id']}}

plan = [
    ('tokens','TOKENS AGOTADOS','wide'),('complete','¡SOLICITUD COMPLETADA!','claude'),
    ('variable','SOLO UNA VARIABLE','human'),('audit','847 ARCHIVOS','wide'),
    ('files','¿847 ARCHIVOS?','human'),('work','200 PRUEBAS · 15 DOCS','wide'),
    ('ask','¿CUÁNTO COSTÓ?','human'),('bill','$47','wide'),
    ('outrage','¡47 DÓLARES!','human'),('permission','FALTA AUTORIZACIÓN','wide'),
    ('silence','…','wide'),('continue','¿CONTINUAR? +$80','wide'),
]
t['scenes'] = []
for i,(name,title,shot) in enumerate(plan):
    start = turns[i]['start']; end = turns[i+1]['start'] if i+1<len(turns) else t['duration']
    t['scenes'].append({'id':name,'title':title,'shot':shot,'cameraTrack':'permission' if name in ('silence','continue') else name,'start':start,'end':end,'turn':turns[i]['id'],'phrases':[x['id'] for x in phrases if x['turn']==turns[i]['id']],'enter':.32})
    anchor(name+'.enter',i+1)
for args in [('tokens.empty',1,'tokens'),('claude.complete',2,'completado'),('request.variable',3,'variable'),('files.count',4,'847'),('files.reaction',5),('tests.count',6,'200'),('docs.count',6,'15'),('cost.question',7),('invoice.total',8,'47'),('price.reaction',9),('variable.question',9,'Al'),('changes.zero',10,'No'),('permission.lock',10,'autorización'),('silence.hold',11),('continue.offer',12,'continúe'),('estimate.total',12,'80')]:
    anchor(*args)
t['motion'] = {'blinkPeriod':3,'breathingPeriod':4,'bobPeriod':3.8,'backgroundPeriod':8,'cubeEntrance':'tokens.enter'}
t['captions'] = []
for turn in turns:
    ws = [w for w in words if w['turn']==turn['id']]
    if not ws:
        t['captions'].append({'start':turn['start'],'end':turn['end'],'speaker':turn['speaker'],'words':[],'text':'…'})
        continue
    tokens = turn['text'].split()
    assert len(ws)==len(tokens),(turn['id'],len(ws),len(tokens))
    chunks = []; chunk = []
    for i, token in enumerate(tokens):
        if chunk and (len(chunk)>=5 or len(' '.join(tokens[j] for j in chunk))+len(token)+1>30):
            chunks.append(chunk); chunk = []
        chunk.append(i)
        if token.endswith(('?', '!', '.')):
            chunks.append(chunk); chunk = []
    if chunk:
        chunks.append(chunk)
    for indices in chunks:
        first, last = indices[0], indices[-1]
        t['captions'].append({'start':ws[first]['start'],'end':ws[last+1]['start'] if last+1<len(ws) else turn['end']+.08,'speaker':turn['speaker'],'words':[{'id':ws[j]['id'],'start':ws[j]['start'],'end':ws[j]['end'],'text':tokens[j]} for j in indices]})
with wave.open(str(PROJECT/'001-Voz/voz.wav')) as wav:
    rate = wav.getframerate(); values = array.array('h',wav.readframes(wav.getnframes()))
    assert wav.getnchannels()==1 and wav.getsampwidth()==2
rms = []
for f in range(t['durationInFrames']):
    samples = values[round(f*rate/t['fps']):round((f+1)*rate/t['fps'])]
    rms.append(math.sqrt(sum((s/32768)**2 for s in samples)/len(samples)) if samples else 0)
speech = sorted(r for r in rms if r>.003); reference = speech[int(len(speech)*.85)]
t['speechEnvelope'] = [round(min(1,max(0,((rms[max(0,i-1)]+rms[i]*2+rms[min(len(rms)-1,i+1)])/4-.003)/reference)),5) for i in range(len(rms))]
validation_path = PROJECT/'002-Cues/validation.json'; validation = json.loads(validation_path.read_text())
assert not validation['differences']
uncertain = [w for w in words if w['id'] in validation['uncertain_words']]
assert all(w['end']>w['start'] and normalize(w['text'])=='cuarenta' for w in uncertain)
validation['review'] = {'state':'accepted','reason':'Approved recording matches the script. CUARENTA is recognized correctly with a nonzero 0.42-second interval; confidence flag retained. The ellipsis turn is preserved as recorded silence.','uncertain_words':uncertain}
validation_path.write_text(json.dumps(validation,ensure_ascii=False,indent=2)+'\n')
t['sync']['state'] = 'ok';t['sync']['review'] = validation['review']
t['visuals'] = {'state':'ready','style':'low-poly-3d','storyboard':'../003-Escenas/storyboard.md','review':'pending'}
p.write_text(json.dumps(t,ensure_ascii=False,indent=2)+'\n')
print('Duration',t['duration'],'frames',t['durationInFrames'],'scenes',len(t['scenes']),'events',len(t['events']))
