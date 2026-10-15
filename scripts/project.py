"""CLI de proyectos: guion → voz local → transcripción → timeline."""
import argparse
from contextlib import contextmanager
import difflib
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unicodedata

ROOT = Path(__file__).resolve().parent.parent
WORKERS = ROOT / 'scripts' / 'project'
FOLDERS = ('001-Voz', '002-Cues', '003-Escenas', '004-Render')
MODEL = 'chatterbox-multilingual-v3'


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path, value):
    temporary = path.with_name(path.name + '.partial')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()


def identifier(value):
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]*', value):
        raise argparse.ArgumentTypeError('Usa letras, números, guiones y guiones bajos.')
    return value


def positive_speed(value):
    speed = float(value)
    if not math.isfinite(speed) or not 0.5 <= speed <= 2:
        raise argparse.ArgumentTypeError('La velocidad debe estar entre 0.5 y 2.')
    return speed


def runtime():
    sibling = ROOT.parent / 'videos_remotion'
    config_file = ROOT / 'pipeline.local.json'
    settings = read_json(config_file) if config_file.exists() else {}
    defaults = {
        'voice_python': sibling / '.venv-voice/bin/python',
        'whisper_python': sibling / '.venv/bin/python',
        'voices_dir': sibling / '.tools/voices',
        'voice_cache': sibling / '.tools/voice-cache',
    }
    return {key: Path(os.path.abspath(ROOT / Path(os.environ.get('PIPELINE_' + key.upper(), settings.get(key, str(value)))).expanduser()))
            for key, value in defaults.items()}


def narration(script):
    text = re.sub(r'<!--.*?-->', '', script, flags=re.S)
    if '```' in text or '~~~' in text:
        raise ValueError('Pon las indicaciones visuales en comentarios <!-- ... -->, no en bloques de código.')
    lines = []
    for line in text.splitlines():
        line = line.strip()
        if not line or re.match(r'^#{1,6}\s', line):
            continue
        line = re.sub(r'^[-*+]\s+|^\d+[.)]\s+', '', line)
        line = re.sub(r'\[([^]]+)\]\([^)]*\)', r'\1', line)
        for marker in ('**', '__', '*', '_', '`'):
            line = re.sub(r'(?<!\w)' + re.escape(marker) + r'(.+?)' + re.escape(marker) + r'(?!\w)', r'\1', line)
        lines.append(line)
    result = '\n'.join(lines)
    if any(re.fullmatch(r'\[[A-Za-z0-9_-]+\]', line) for line in lines):
        raise ValueError('El guion tiene etiquetas de hablante; configura speakers en project.json.')
    chunks = [s.strip() for s in re.split(r'(?<=[.!?])\s+|\n+', result) if s.strip()]
    if not chunks:
        raise ValueError('Escribe tu guion en 001-Voz/guion.md antes de generar la voz.')
    if any(len(s) > 300 for s in chunks):
        raise ValueError('Separa el guion en frases de hasta 300 caracteres.')
    return result + '\n'


def profile(settings, config):
    name = identifier(config['voice']['profile'])
    local = ROOT / '.tools/voices' / name
    shared = settings['voices_dir'] / name
    directory = shared if shared.is_dir() else local
    for name in ('voice.json', 'profile.pt', 'reference.wav'):
        if not (directory / name).is_file():
            raise ValueError(f'Falta el perfil de voz: {directory / name}')
    if read_json(directory / 'voice.json')['model'] != MODEL:
        raise ValueError('El perfil debe corresponder a Chatterbox Multilingual V3.')
    return directory


def dialogue_turns(script, speakers, stage_directions=()):
    clean = re.sub(r'<!--.*?-->', '', script, flags=re.S)
    for direction in stage_directions:
        clean = re.sub(r'^\s*\[' + re.escape(direction) + r'\]\s*$', '', clean, flags=re.M)
    clean = re.sub(r'^\[([A-Za-z0-9_-]+)\][ \t]+(?=\S)', r'[\1]\n', clean, flags=re.M)
    parts = re.split(r'^\[([A-Za-z0-9_-]+)\]\s*$', clean, flags=re.M)
    intro = '\n'.join(line for line in parts[0].splitlines() if line.strip() and not re.match(r'^#{1,6}\s', line.strip()))
    if intro.strip() or len(parts) == 1:
        raise ValueError('En un diálogo, todo el texto debe ir después de una etiqueta [hablante].')
    turns = []
    for i in range(1, len(parts), 2):
        speaker = parts[i]
        if speaker not in speakers:
            raise ValueError(f'Hablante desconocido: {speaker}. Configúralo en speakers.')
        turns.append({'id': f't{len(turns) + 1:04d}', 'speaker': speaker,
                      'text': narration(parts[i + 1]).strip()})
    return turns


def apply_speaker_defaults(config):
    # Claude conserva la voz independiente aprobada en todos los diálogos.
    defaults = read_json(WORKERS / 'speaker-defaults.json')
    for speaker, preset in defaults.items():
        if speaker in config.get('speakers', {}):
            config['speakers'][speaker].update(preset)


def voice_input(project, config, settings):
    apply_speaker_defaults(config)
    script = (project / '001-Voz/guion.md').read_text(encoding='utf-8')
    if config.get('speakers'):
        turns = dialogue_turns(script, config['speakers'], config.get('dialogue', {}).get('stage_directions', ()))
        profiles = {}
        for turn in turns:
            speaker = turn['speaker']
            name = config['speakers'][speaker]['profile']
            directory = profile(settings, {'voice': {'profile': name}})
            turn.update(profile=name, profile_path=str(directory),
                        exaggeration=config['speakers'][speaker].get('exaggeration', 0.35),
                        cfg_weight=config['speakers'][speaker].get('cfg_weight', 0.4),
                        effect=config['speakers'][speaker].get('effect', 'none'))
            profiles[speaker] = digest(directory / 'profile.pt')
        text = '\n'.join(turn['text'] for turn in turns) + '\n'
        inputs = {'script_sha256': digest(project / '001-Voz/guion.md'),
                  'narration_sha256': hashlib.sha256(text.encode()).hexdigest(),
                  'speaker_profiles_sha256': profiles, 'speakers': config['speakers'],
                  'dialogue': config.get('dialogue', {'turn_pause': 0.35}),
                  'voice': config['voice'], 'worker_sha256': digest(WORKERS / 'dialogue.py')}
        return fingerprint(inputs), inputs, text, turns
    text = narration(script)
    directory = profile(settings, config)
    inputs = {'script_sha256': digest(project / '001-Voz/guion.md'),
              'narration_sha256': hashlib.sha256(text.encode()).hexdigest(),
              'profile_sha256': digest(directory / 'profile.pt'),
              'voice': config['voice'], 'worker_sha256': digest(WORKERS / 'voice.py')}
    return fingerprint(inputs), inputs, text, directory


def sync_input(project, config):
    return fingerprint({'audio_sha256': digest(project / '001-Voz/voz.wav'),
                        'narration_sha256': digest(project / '001-Voz/narracion.txt'),
                        'whisper': config['whisper'], 'fps': config['fps'],
                        'closing_hold': config['closing_hold'],
                        **({'turns_sha256': digest(project / '001-Voz/turns.json')} if config.get('speakers') else {}),
                        'worker_sha256': digest(WORKERS / ('transcribe_dialogue.py' if config.get('speakers') else 'transcribe.py'))})


def run(command, env=None, capture=False):
    result = subprocess.run([str(x) for x in command], cwd=ROOT, env=env,
                            check=True, text=True, capture_output=capture)
    return result.stdout if capture else None


def worker_environment(settings, whisper=False):
    env = dict(os.environ, PYTHONNOUSERSITE='1', HF_HUB_DISABLE_TELEMETRY='1')
    if not whisper:
        env['HF_HOME'] = str(settings['voice_cache'])
    else:
        libs = run([settings['whisper_python'], '-c',
            'import nvidia.cublas.lib,nvidia.cudnn.lib; '
            'print(next(iter(nvidia.cublas.lib.__path__))); print(next(iter(nvidia.cudnn.lib.__path__)))'], capture=True)
        env['LD_LIBRARY_PATH'] = ':'.join(libs.splitlines() + [env.get('LD_LIBRARY_PATH', '')]).rstrip(':')
    return env


def require_tools(settings, kind):
    if not settings[kind + '_python'].is_file():
        raise ValueError(f'Falta {settings[kind + "_python"]}. Configura pipeline.local.json (ver projects/README.md).')
    for executable in ('ffmpeg', 'ffprobe'):
        if not shutil.which(executable):
            raise ValueError(f'Falta {executable} en PATH.')


def audio_duration(path):
    value = float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                      '-of', 'default=noprint_wrappers=1:nokey=1', path], capture=True).strip())
    if not math.isfinite(value) or value <= 0:
        raise ValueError('La grabación no tiene una duración válida.')
    return value


@contextmanager
def project_lock(project):
    lock = project / '.pipeline.lock'
    try:
        fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        raise ValueError(f'El proyecto está ocupado. Si el proceso terminó, elimina {lock}.') from None
    try:
        with os.fdopen(fd, 'w') as stream:
            stream.write(str(os.getpid()))
        yield
    finally:
        lock.unlink(missing_ok=True)


def initialize(project, name):
    if project.exists():
        raise ValueError(f'El proyecto ya existe: {project}')
    for folder in FOLDERS:
        (project / folder).mkdir(parents=True)
    write_json(project / 'project.json', {'schema_version': 1, 'id': name, 'engine': 'remotion',
        'width': 1080, 'height': 1920, 'style': 'pixel-tech', 'fps': 60, 'closing_hold': 1,
        'voice': {'model': MODEL, 'profile': 'mi-voz', 'language': 'es', 'speed': 1.2, 'seed': 42},
        'whisper': {'model': 'turbo', 'device': 'cuda'}})
    (project / '001-Voz/guion.md').write_text('# Guion\n\n<!-- Escribe aquí el texto que debe pronunciarse. -->\n', encoding='utf-8')
    write_json(project / '002-Cues/Timeline.json', {'schema_version': 1, 'fps': 60, 'duration': 0,
        'durationInFrames': 0, 'narration': {'audio': '../001-Voz/voz.wav', 'offset': 0,
            'duration': 0, 'phrases': [], 'words': []}, 'scenes': [], 'events': {},
        'sync': {'state': 'pending'}, 'visuals': {'state': 'pending'}})
    (project / '003-Escenas/storyboard.md').write_text('# Storyboard\n\nSe construirá después de revisar la voz y Timeline.json.\n', encoding='utf-8')
    (project / '004-Render/.gitkeep').touch()
    print(f'Proyecto creado: {project}\nEscribe el guion en {project / "001-Voz/guion.md"}')


def generate_voice(project, config, settings, force=False):
    key, inputs, text, directory = voice_input(project, config, settings)
    dest = project / '001-Voz'
    generation = dest / 'generation.json'
    extra_ready = not config.get('speakers') or ((dest / 'turns.json').exists() and all(
        (dest / turn['audio']).exists() for turn in read_json(dest / 'turns.json')))
    if generation.exists() and (dest / 'voz.wav').exists() and extra_ready and not force:
        old = read_json(generation)
        if old.get('input_sha256') == key and old.get('audio_sha256') == digest(dest / 'voz.wav') and (dest / 'narracion.txt').exists() and digest(dest / 'narracion.txt') == inputs['narration_sha256']:
            print('Voz al día; se conserva voz.wav. Usa --force para regenerarla.')
            return
    require_tools(settings, 'voice')
    print(f'Generando voz: {config["voice"]["profile"]}, velocidad {config["voice"]["speed"]}.', flush=True)
    with tempfile.TemporaryDirectory(prefix='.voice-', dir=dest) as temporary:
        work = Path(temporary)
        (work / 'narracion.txt').write_text(text, encoding='utf-8')
        if config.get('speakers'):
            write_json(work / 'plan.json', directory)
            run([settings['voice_python'], '-u', WORKERS / 'dialogue.py', '--plan', work / 'plan.json',
                 '--output', work, '--speed', config['voice']['speed'], '--seed', config['voice']['seed'],
                 '--pause', config.get('dialogue', {}).get('turn_pause', 0.35)], env=worker_environment(settings))
        else:
            run([settings['voice_python'], '-u', WORKERS / 'voice.py', '--text', work / 'narracion.txt',
                 '--output', work, '--profile', directory, '--speed', config['voice']['speed'],
                 '--seed', config['voice']['seed']], env=worker_environment(settings))
        metadata = read_json(work / 'worker.json')
        metadata.update(inputs, input_sha256=key, audio_sha256=digest(work / 'voz.wav'))
        write_json(work / 'generation.json', metadata)
        if config.get('speakers'):
            stored_turns = dest / 'turns'
            stored_turns.mkdir(exist_ok=True)
            for turn_file in (work / 'turns').iterdir():
                turn_file.replace(stored_turns / turn_file.name)
            (work / 'turns.json').replace(dest / 'turns.json')
        for name in ('voz.wav', 'narracion.txt', 'generation.json'):
            (work / name).replace(dest / name)
    print(f'Voz generada: {dest / "voz.wav"}. Ejecuta sync para actualizar los tiempos.')


def normalized_words(text):
    plain = ''.join(c for c in unicodedata.normalize('NFD', text.casefold()) if unicodedata.category(c) != 'Mn')
    return re.findall(r'\w+', plain)


def validate_transcript(text, transcript, duration):
    expected = normalized_words(text)
    actual = normalized_words(transcript['text'])
    matcher = difflib.SequenceMatcher(a=expected, b=actual, autojunk=False)
    differences = [{'type': tag, 'expected': ' '.join(expected[i:j]), 'heard': ' '.join(actual[k:l])}
                   for tag, i, j, k, l in matcher.get_opcodes() if tag != 'equal']
    warnings = []
    if not transcript['segments'] or not transcript['words']:
        raise ValueError('Whisper no detectó frases y palabras; no se publicará un timeline vacío.')
    for items in (transcript['segments'], transcript['words']):
        previous = 0
        for item in items:
            start, end = item['start'], item['end']
            if not all(math.isfinite(v) for v in (start, end)) or not 0 <= start <= end <= duration + 0.05 or start < previous:
                raise ValueError('Whisper devolvió tiempos inválidos o desordenados.')
            previous = start
    if differences:
        warnings.append('La transcripción difiere del guion. Revisa differences antes de construir escenas.')
    low = [w['id'] for w in transcript['words'] if w.get('probability', 1) < 0.5 or w['end'] == w['start']]
    if low:
        warnings.append('Hay palabras con baja confianza o duración cero; sus tiempos requieren revisión.')
    return {'state': 'needs_review' if warnings else 'ok', 'similarity': round(matcher.ratio(), 4),
            'differences': differences, 'uncertain_words': low, 'warnings': warnings,
            'note': 'Los tiempos de Whisper son estimaciones. El audio grabado es la referencia.'}


def srt_time(seconds):
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3600000)
    minutes, milliseconds = divmod(milliseconds, 60000)
    secs, milliseconds = divmod(milliseconds, 1000)
    return f'{hours:02}:{minutes:02}:{secs:02},{milliseconds:03}'


def annotate_speakers(transcript, turns):
    if not turns:
        return
    for word in transcript['words']:
        midpoint = (word['start'] + word['end']) / 2
        turn = max(turns, key=lambda t: (max(0, min(word['end'], t['end']) - max(word['start'], t['start'])),
            -abs(midpoint - max(t['start'], min(t['end'], midpoint)))))
        word.update(speaker=turn['speaker'], turn=turn['id'])
    phrases = []
    words_by_id = {w['id']: w for w in transcript['words']}
    for source in transcript['segments']:
        groups = []
        for id in source.get('words', []):
            word = words_by_id[id]
            if not groups or groups[-1][-1]['turn'] != word['turn']:
                groups.append([])
            groups[-1].append(word)
        for group in groups:
            phrase_id = f'p{len(phrases) + 1:04d}'
            for word in group:
                word['phrase'] = phrase_id
            phrases.append({'id': phrase_id, 'start': group[0]['start'], 'end': group[-1]['end'],
                            'text': ' '.join(w['text'] for w in group), 'speaker': group[0]['speaker'],
                            'turn': group[0]['turn'], 'words': [w['id'] for w in group]})
    transcript['segments'] = phrases
    transcript['turns'] = turns


def synchronize(project, config, settings, force=False):
    key, _, _, _ = voice_input(project, config, settings)
    generation_file = project / '001-Voz/generation.json'
    if not generation_file.exists() or not (project / '001-Voz/voz.wav').exists():
        raise ValueError('Primero genera la voz con voice o prepare.')
    generation = read_json(generation_file)
    if generation.get('input_sha256') != key or generation.get('audio_sha256') != digest(project / '001-Voz/voz.wav') or not (project / '001-Voz/narracion.txt').exists() or digest(project / '001-Voz/narracion.txt') != generation.get('narration_sha256'):
        raise ValueError('La voz está desactualizada o fue modificada. Ejecuta voice o prepare.')
    key = sync_input(project, config)
    cues = project / '002-Cues'
    timeline_file = cues / 'Timeline.json'
    timeline = read_json(timeline_file)
    if not force and timeline.get('sync', {}).get('input_sha256') == key and all((cues / name).exists() for name in ('transcript.json', 'subtitles.srt', 'validation.json')):
        print('Sincronización al día.')
        return
    require_tools(settings, 'whisper')
    print(f'Transcribiendo audio definitivo con Whisper {config["whisper"]["model"]}...', flush=True)
    duration = audio_duration(project / '001-Voz/voz.wav')
    with tempfile.TemporaryDirectory(prefix='.sync-', dir=cues) as temporary:
        work = Path(temporary)
        env = worker_environment(settings, whisper=config['whisper']['device'] == 'cuda')
        run([settings['whisper_python'], '-u', WORKERS / ('transcribe_dialogue.py' if config.get('speakers') else 'transcribe.py'), '--audio', project / '001-Voz/voz.wav',
             '--output', work / 'transcript.json', '--model', config['whisper']['model'],
             '--device', config['whisper']['device']], env=env)
        transcript = read_json(work / 'transcript.json')
        if config.get('speakers'):
            annotate_speakers(transcript, read_json(project / '001-Voz/turns.json'))
        validation = validate_transcript((project / '001-Voz/narracion.txt').read_text(), transcript, duration)
        transcript['duration'] = duration
        transcript['audio_sha256'] = generation['audio_sha256']
        write_json(work / 'transcript.json', transcript)
        write_json(work / 'validation.json', validation)
        (work / 'subtitles.srt').write_text('\n\n'.join(f'{i}\n{srt_time(s["start"])} --> {srt_time(s["end"])}\n{s["text"]}'
            for i, s in enumerate(transcript['segments'], 1)) + '\n', encoding='utf-8')
        previous_audio = timeline.get('sync', {}).get('audio_sha256')
        previous_sync = timeline.get('sync', {}).get('input_sha256')
        has_visuals = bool(timeline.get('scenes') or timeline.get('events'))
        total_frames = math.ceil((duration + config['closing_hold']) * config['fps'])
        timeline.update(fps=config['fps'], duration=total_frames / config['fps'], durationInFrames=total_frames,
            narration={'audio': '../001-Voz/voz.wav', 'offset': 0, 'duration': duration,
                       'phrases': transcript['segments'], 'words': transcript['words'],
                       **({'turns': transcript['turns'], 'speakers': config['speakers']} if config.get('speakers') else {})},
            sync={'state': validation['state'], 'input_sha256': key, 'audio_sha256': generation['audio_sha256']})
        if has_visuals and (previous_audio != generation['audio_sha256'] or previous_sync != key):
            timeline['visuals'] = {'state': 'needs_review', 'reason': 'Cambió la sincronización; revisa tiempos y referencias de escenas conservadas.'}
        write_json(work / 'Timeline.json', timeline)
        for name in ('transcript.json', 'subtitles.srt', 'validation.json', 'Timeline.json'):
            (work / name).replace(cues / name)
    print(f'Sincronización lista: {duration:.2f} s de voz, {len(transcript["words"])} palabras.\n{timeline_file}')
    for warning in validation['warnings']:
        print(f'Revisar: {warning}')
    if timeline.get('visuals', {}).get('state') == 'needs_review':
        print(timeline['visuals']['reason'])


def render_voice_current(project, key, inputs, generation):
    audio_hash = digest(project / '001-Voz/voz.wav')
    if generation.get('audio_sha256') != audio_hash or digest(project / '001-Voz/narracion.txt') != inputs['narration_sha256']:
        return False
    if generation.get('input_sha256') == key:
        return True
    # A reviewed recording can survive a worker-only change without rewriting its provenance.
    review_file = project / '001-Voz/review.json'
    if not review_file.exists() or any(generation.get(k) != v for k, v in inputs.items() if k != 'worker_sha256'):
        return False
    review = read_json(review_file)
    return review.get('render_voice_input_sha256') == key and review.get('audio_sha256') == audio_hash


def status(project, config, settings):
    voice_state = 'pendiente'
    sync_state = 'pendiente'
    try:
        key, inputs, _, _ = voice_input(project, config, settings)
        metadata = read_json(project / '001-Voz/generation.json')
        voice_state = 'al día' if render_voice_current(project, key, inputs, metadata) else 'desactualizada'
    except (ValueError, OSError, KeyError) as error:
        print(f'Voz: {error}')
    timeline = read_json(project / '002-Cues/Timeline.json')
    if timeline.get('sync', {}).get('input_sha256'):
        try:
            sync_state = timeline['sync']['state'] if voice_state == 'al día' and timeline['sync']['input_sha256'] == sync_input(project, config) and all((project / '002-Cues' / name).exists() for name in ('transcript.json', 'subtitles.srt', 'validation.json')) else 'desactualizada'
        except OSError:
            sync_state = 'desactualizada'
    print(f'Proyecto: {project.name}\nVoz: {voice_state}\nSincronización: {sync_state}')
    visuals_state = timeline.get('visuals', {}).get('state', 'pending')
    if (timeline.get('scenes') or timeline.get('events')) and sync_state not in ('ok', 'needs_review'):
        visuals_state = 'desactualizadas; sincroniza y revisa los tiempos'
    print(f'Escenas: {visuals_state} ({len(timeline.get("scenes", []))} escenas)')
    render_state = 'pendiente'
    final = project / '004-Render/final.mp4'
    if final.exists():
        render_state = 'existe; comprobar revisión'
        try:
            manifest = read_json(project / '004-Render/final.mp4.json')
            sources = fingerprint({str(f.relative_to(ROOT)): digest(f) for f in (ROOT / 'src').rglob('*') if f.is_file()})
            if voice_state != 'al día' or sync_state != 'ok' or manifest['timeline_sha256'] != digest(project / '002-Cues/Timeline.json') or manifest.get('source_sha256') != sources or manifest['audio_sha256'] != digest(project / '004-Render/mix.wav'):
                render_state = 'desactualizado'
            else:
                report = read_json(project / '004-Render/review/report.json')
                if report.get('state') == 'passed' and report.get('final_sha256') == digest(final):
                    render_state = 'revisado'
        except (OSError, ValueError, KeyError):
            pass
    print(f'Render: {render_state}')


def check_prepared(project, config, settings):
    key, inputs, _, _ = voice_input(project, config, settings)
    generation = read_json(project / '001-Voz/generation.json')
    if not render_voice_current(project, key, inputs, generation):
        raise ValueError('La voz está desactualizada. Ejecuta prepare antes de renderizar.')
    timeline = read_json(project / '002-Cues/Timeline.json')
    if timeline.get('sync', {}).get('input_sha256') != sync_input(project, config):
        raise ValueError('La sincronización está desactualizada. Ejecuta sync y revisa las escenas.')
    if timeline.get('sync', {}).get('state') != 'ok' or timeline.get('visuals', {}).get('state') not in ('ready', 'reviewed'):
        raise ValueError('Revisa transcripción y escenas antes de renderizar; sync debe estar ok y visuals ready/reviewed.')
    if not timeline.get('scenes'):
        raise ValueError('El timeline todavía no tiene escenas.')
    if not config.get('composition'):
        raise ValueError('Define composition en project.json y regístrala en src/Root.tsx.')
    return timeline


def build_mix(project, config, timeline):
    destination = project / '004-Render'
    duration = timeline['duration']
    with tempfile.TemporaryDirectory(prefix='.mix-', dir=destination) as temporary:
        work = Path(temporary)
        effects = work / 'effects.wav'
        cues = config.get('sound_cues')
        if cues:
            cue_path = (project / cues).resolve()
            if not cue_path.is_relative_to(project.resolve()) or not cue_path.is_file():
                raise ValueError('sound_cues debe apuntar a un cue sheet dentro del proyecto.')
            run(['python3', '-m', 'sfx', cue_path, '--timeline', project / '002-Cues/Timeline.json', '--out', effects])
        else:
            run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
                 '-t', duration, effects])
        raw = work / 'premix.wav'
        # The voice controls ducking; duration explicitly includes the final hold.
        graph = (f'[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v][key];'
                 f'[1:a]volume=0.5[fx];[fx][key]sidechaincompress=threshold=0.025:ratio=6:attack=5:release=200[d];'
                 f'[v][d]amix=inputs=2:duration=longest:normalize=0,apad,atrim=duration={duration}[a]')
        run(['ffmpeg', '-v', 'error', '-y', '-i', project / '001-Voz/voz.wav', '-i', effects,
             '-filter_complex', graph, '-map', '[a]', '-ar', '48000', raw])
        first = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(raw), '-af',
            'loudnorm=I=-14:TP=-2:LRA=9:print_format=json', '-f', 'null', '-'],
            check=True, capture_output=True, text=True)
        measured = json.loads(first.stderr[first.stderr.rfind('{'):first.stderr.rfind('}') + 1])
        normalizer = ('loudnorm=I=-14:TP=-2:LRA=9:linear=true:'
            f'measured_I={measured["input_i"]}:measured_TP={measured["input_tp"]}:'
            f'measured_LRA={measured["input_lra"]}:measured_thresh={measured["input_thresh"]}:'
            f'offset={measured["target_offset"]}')
        run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', normalizer,
             '-ar', '48000', '-c:a', 'pcm_s16le', work / 'mix.wav'])
        write_json(work / 'mix-analysis.json', {'target_lufs': -14, 'true_peak_ceiling': -2,
            'measurement': measured, 'voice_sha256': digest(project / '001-Voz/voz.wav'),
            'timeline_sha256': digest(project / '002-Cues/Timeline.json')})
        for name in ('effects.wav', 'mix.wav', 'mix-analysis.json'):
            (work / name).replace(destination / name)
    public = ROOT / 'public/projects' / project.name
    public.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(destination / 'mix.wav', public / 'mix.wav')
    print(f'Mezcla preparada: {destination / "mix.wav"}', flush=True)


def render_project(project, config, settings, preview=False):
    timeline = check_prepared(project, config, settings)
    build_mix(project, config, timeline)
    destination = project / '004-Render'
    output = 'preview.mp4' if preview else 'final.mp4'
    with tempfile.TemporaryDirectory(prefix='.render-', dir=destination) as temporary:
        work = Path(temporary)
        props = work / 'props.json'
        write_json(props, {'silent': True, 'audioFile': f'projects/{project.name}/mix.wav'})
        run(['npx', 'remotion', 'render', config['composition'], work / 'silent.mp4', '--props', props,
             '--scale', '0.5' if preview else '1', '--crf', '25' if preview else '16', '--concurrency', '4'])
        run(['ffmpeg', '-v', 'error', '-y', '-i', work / 'silent.mp4', '-i', destination / 'mix.wav',
             '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k',
             '-t', timeline['duration'], '-movflags', '+faststart', work / output])
        probe = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json',
                               work / output], capture=True))
        video = next(s for s in probe['streams'] if s['codec_type'] == 'video')
        scale = 0.5 if preview else 1
        if video['width'] != round(config['width'] * scale) or video['height'] != round(config['height'] * scale):
            raise ValueError('El formato registrado en Root.tsx no coincide con project.json.')
        rate = video['r_frame_rate'].split('/')
        if abs(float(rate[0]) / float(rate[1]) - config['fps']) > 0.01:
            raise ValueError('Los FPS renderizados no coinciden con project.json.')
        if not any(s['codec_type'] == 'audio' for s in probe['streams']):
            raise ValueError('El archivo final no contiene audio.')
        if abs(float(probe['format']['duration']) - timeline['duration']) > 0.08:
            raise ValueError('La duración renderizada no coincide con Timeline.json.')
        loudness = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(work / output),
            '-af', 'ebur128=peak=true', '-f', 'null', '-'], check=True, capture_output=True, text=True)
        summary = loudness.stderr[loudness.stderr.rfind('Summary'):]
        lufs = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summary).group(1))
        peak = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summary).group(1))
        if not math.isfinite(lufs) or abs(lufs + 14) > 1 or not math.isfinite(peak) or peak > -1:
            raise ValueError(f'La mezcla final requiere ajuste: {lufs} LUFS, pico {peak} dBFS.')
        print(f'Audio final: {lufs} LUFS, pico real {peak} dBFS.', flush=True)
        if not preview:
            (work / 'silent.mp4').replace(destination / 'silent.mp4')
        (work / output).replace(destination / output)
        write_json(destination / (output + '.json'), {'timeline_sha256': digest(project / '002-Cues/Timeline.json'),
            'audio_sha256': digest(destination / 'mix.wav'), 'output_sha256': digest(destination / output),
            'loudness': {'integrated_lufs': lufs, 'true_peak_dbfs': peak},
            'composition': config['composition'], 'width': video['width'], 'height': video['height'],
            'duration': float(probe['format']['duration']), 'fps': video['r_frame_rate'],
            'source_sha256': fingerprint({str(f.relative_to(ROOT)): digest(f) for f in (ROOT / 'src').rglob('*') if f.is_file()})})
    print(f'Video: {destination / output}', flush=True)


def doctor(settings):
    for key, value in settings.items():
        print(f'{key}: {value} ({"OK" if value.exists() else "FALTA"})')
    for kind, snippet in [('voice', 'import torch; from chatterbox.mtl_tts import ChatterboxMultilingualTTS; '
        'import inspect; assert "t3_model" in inspect.signature(ChatterboxMultilingualTTS.from_pretrained).parameters; '
        'print("Chatterbox V3 / CUDA:",torch.cuda.is_available()); assert torch.cuda.is_available()'),
        ('whisper', 'from faster_whisper import WhisperModel; print("faster-whisper: OK")')]:
        require_tools(settings, kind)
        run([settings[kind + '_python'], '-c', snippet])
    profile(settings, {'voice': {'profile': 'mi-voz'}})
    print('Perfil mi-voz: OK')


def validate_config(config):
    if config['voice'].get('model') != MODEL or config['voice'].get('language') != 'es':
        raise ValueError('Esta versión utiliza Chatterbox Multilingual V3 en español.')
    positive_speed(config['voice']['speed'])
    identifier(config['voice']['profile'])
    if not isinstance(config['voice']['seed'], int):
        raise ValueError('seed debe ser un entero.')
    for key in ('fps', 'width', 'height'):
        if not isinstance(config[key], int) or config[key] <= 0:
            raise ValueError(f'{key} debe ser un entero positivo.')
    if not isinstance(config['closing_hold'], (float, int)) or not math.isfinite(config['closing_hold']) or config['closing_hold'] < 0:
        raise ValueError('closing_hold debe ser un número >= 0.')
    if config.get('speakers'):
        for name, speaker in config['speakers'].items():
            identifier(name)
            identifier(speaker['profile'])
        pause = config.get('dialogue', {}).get('turn_pause', 0.35)
        if not isinstance(pause, (int, float)) or not math.isfinite(pause) or not 0 <= pause <= 3:
            raise ValueError('turn_pause debe estar entre 0 y 3 segundos.')
    if config['whisper']['device'] not in ('cuda', 'cpu'):
        raise ValueError('El dispositivo de Whisper debe ser cuda o cpu.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--projects-root', type=Path, default=ROOT / 'projects', help='Carpeta de proyectos (por defecto projects/).')
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('doctor', help='Comprobar entornos, GPU y perfil mi-voz.')
    for name in ('init', 'voice', 'sync', 'prepare', 'status', 'mix', 'preview', 'render'):
        command = commands.add_parser(name)
        command.add_argument('id', type=identifier)
        if name in ('voice', 'prepare'):
            command.add_argument('--speed', type=positive_speed)
            command.add_argument('--voice', type=identifier)
        if name in ('voice', 'sync', 'prepare'):
            command.add_argument('--force', action='store_true', help='Regenerar incluso si las entradas no cambiaron.')
    args = parser.parse_args()
    try:
        settings = runtime()
        if args.command == 'doctor':
            doctor(settings)
            return
        project = args.projects_root.resolve() / args.id
        if args.command == 'init':
            initialize(project, args.id)
            return
        if not (project / 'project.json').exists():
            raise ValueError(f'No existe {project}. Ejecuta init primero.')
        config = read_json(project / 'project.json')
        apply_speaker_defaults(config)
        if args.command == 'status':
            status(project, config, settings)
            return
        with project_lock(project):
            if getattr(args, 'speed', None) is not None:
                config['voice']['speed'] = args.speed
            if getattr(args, 'voice', None) is not None:
                config['voice']['profile'] = args.voice
            validate_config(config)
            write_json(project / 'project.json', config)
            if args.command == 'mix':
                build_mix(project, config, check_prepared(project, config, settings))
                return
            if args.command in ('preview', 'render'):
                render_project(project, config, settings, preview=args.command == 'preview')
                return
            if args.command in ('voice', 'prepare'):
                generate_voice(project, config, settings, args.force)
            if args.command in ('sync', 'prepare'):
                synchronize(project, config, settings, args.force)
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as error:
        parser.exit(1, f'Error: {error}\n')


if __name__ == '__main__':
    main()
