from contextlib import redirect_stdout
import importlib.util
import io
import subprocess
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('pipeline', Path(__file__).parents[1] / 'project.py')
pipeline = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pipeline)


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.project = self.root / '001-test'
        self.output = redirect_stdout(io.StringIO())
        self.output.__enter__()
        pipeline.initialize(self.project, self.project.name)
        self.config = pipeline.read_json(self.project / 'project.json')
        self.settings = {'voices_dir': self.root / 'voices'}
        self.profile = self.settings['voices_dir'] / 'mi-voz'
        self.profile.mkdir(parents=True)
        pipeline.write_json(self.profile / 'voice.json', {'model': pipeline.MODEL})
        (self.profile / 'profile.pt').write_bytes(b'profile')
        (self.profile / 'reference.wav').write_bytes(b'reference')
        (self.project / '001-Voz/guion.md').write_text('Una prueba.\n')

    def tearDown(self):
        self.output.__exit__(None, None, None)
        self.temporary.cleanup()

    def prepared_voice(self):
        key, inputs, text, _ = pipeline.voice_input(self.project, self.config, self.settings)
        (self.project / '001-Voz/narracion.txt').write_text(text)
        (self.project / '001-Voz/voz.wav').write_bytes(b'audio')
        pipeline.write_json(self.project / '001-Voz/generation.json', dict(inputs, input_sha256=key,
                            audio_sha256=pipeline.digest(self.project / '001-Voz/voz.wav')))

    def test_render_retains_reviewed_recording_after_worker_only_change(self):
        self.prepared_voice()
        generation = pipeline.read_json(self.project / '001-Voz/generation.json')
        key, inputs, _, _ = pipeline.voice_input(self.project, self.config, self.settings)
        generation['input_sha256'] = 'previous-worker-input'
        generation['worker_sha256'] = 'previous-worker'
        self.assertFalse(pipeline.render_voice_current(self.project, key, inputs, generation))
        pipeline.write_json(self.project / '001-Voz/review.json', {
            'render_voice_input_sha256': key, 'audio_sha256': generation['audio_sha256']})
        self.assertTrue(pipeline.render_voice_current(self.project, key, inputs, generation))
        (self.project / '001-Voz/voz.wav').write_bytes(b'changed-audio')
        self.assertFalse(pipeline.render_voice_current(self.project, key, inputs, generation))

    def test_review_cannot_accept_changed_script_profile_or_speed(self):
        self.prepared_voice()
        generation = pipeline.read_json(self.project / '001-Voz/generation.json')
        generation['input_sha256'] = 'previous-worker-input'
        generation['worker_sha256'] = 'previous-worker'
        for changed in ('script_sha256', 'profile_sha256', 'voice'):
            key, inputs, _, _ = pipeline.voice_input(self.project, self.config, self.settings)
            inputs[changed] = {'speed': 1.5} if changed == 'voice' else 'changed'
            key = pipeline.fingerprint(inputs)
            pipeline.write_json(self.project / '001-Voz/review.json', {
                'render_voice_input_sha256': key, 'audio_sha256': generation['audio_sha256']})
            self.assertFalse(pipeline.render_voice_current(self.project, key, inputs, generation))

    def test_rejects_traversal_and_invalid_speed(self):
        for name in ('../other', '/tmp/other', 'two/parts'):
            with self.assertRaises(Exception):
                pipeline.identifier(name)
        for value in ('nan', 'inf', '0', '3'):
            with self.assertRaises(Exception):
                pipeline.positive_speed(value)

    def test_markdown_separates_visual_instructions(self):
        self.assertEqual(pipeline.narration('# Título\n<!-- Panel azul. -->\n**Una prueba.**\n'), 'Una prueba.\n')
        self.assertEqual(pipeline.narration('El campo user_id contiene el ID.'), 'El campo user_id contiene el ID.\n')
        with self.assertRaises(ValueError):
            pipeline.narration('# Solo un título\n<!-- Sin narración -->')

    def test_dialogue_labels_are_not_spoken_and_repeated_speakers_keep_turns(self):
        script = '# Diálogo\n[mi-voz]  \nHola.\n[mujer]\n¡Claro!\n[mi-voz]\nFin.\n[mi-voz]\nMoraleja.\n'
        turns = pipeline.dialogue_turns(script, {'mi-voz': {}, 'mujer': {}})
        self.assertEqual([t['speaker'] for t in turns], ['mi-voz', 'mujer', 'mi-voz', 'mi-voz'])
        self.assertEqual([t['text'] for t in turns], ['Hola.', '¡Claro!', 'Fin.', 'Moraleja.'])
        with self.assertRaisesRegex(ValueError, 'speakers'):
            pipeline.narration(script)
        with self.assertRaisesRegex(ValueError, 'desconocido'):
            pipeline.dialogue_turns('[otra]\nHola.', {'mi-voz': {}})
        with self.assertRaises(ValueError):
            pipeline.dialogue_turns('Texto sin etiqueta.\n[mi-voz]\nHola.', {'mi-voz': {}})

    def test_dialogue_fingerprints_include_both_profiles(self):
        female = self.settings['voices_dir'] / 'mujer'
        female.mkdir()
        pipeline.write_json(female / 'voice.json', {'model': pipeline.MODEL})
        (female / 'profile.pt').write_bytes(b'female-profile')
        (female / 'reference.wav').write_bytes(b'female-reference')
        self.config['speakers'] = {'mi-voz': {'profile': 'mi-voz'}, 'mujer': {'profile': 'mujer'}}
        (self.project / '001-Voz/guion.md').write_text('[mi-voz]\nHola.\n[mujer]\nBuenas.')
        key, _, text, plan = pipeline.voice_input(self.project, self.config, self.settings)
        self.assertEqual(text, 'Hola.\nBuenas.\n')
        self.assertEqual(len(plan), 2)
        self.config['speakers']['mujer']['exaggeration'] = 0.6
        expressive_key, _, _, expressive_plan = pipeline.voice_input(self.project, self.config, self.settings)
        self.assertNotEqual(key, expressive_key)
        self.assertEqual(expressive_plan[1]['exaggeration'], 0.6)
        (female / 'profile.pt').write_bytes(b'new-female-profile')
        self.assertNotEqual(expressive_key, pipeline.voice_input(self.project, self.config, self.settings)[0])

    def test_robot_profile_settings_reach_the_dialogue_plan(self):
        self.config['speakers'] = {'mi-voz': {'profile': 'mi-voz', 'effect': 'robot', 'cfg_weight': 0.65}}
        (self.project / '001-Voz/guion.md').write_text('[mi-voz] Una prueba.')
        key, _, _, plan = pipeline.voice_input(self.project, self.config, self.settings)
        self.assertEqual(plan[0]['effect'], 'robot')
        self.assertEqual(plan[0]['cfg_weight'], 0.65)
        self.config['speakers']['mi-voz']['effect'] = 'none'
        self.assertNotEqual(key, pipeline.voice_input(self.project, self.config, self.settings)[0])

    def test_claude_uses_the_approved_independent_voice(self):
        robot = self.settings['voices_dir'] / 'claude-robot'
        robot.mkdir()
        pipeline.write_json(robot / 'voice.json', {'model': pipeline.MODEL})
        (robot / 'profile.pt').write_bytes(b'claude-profile')
        (robot / 'reference.wav').write_bytes(b'claude-reference')
        self.config['speakers'] = {'Yo': {'profile': 'mi-voz'}, 'Claude': {'profile': 'mi-voz', 'label': 'Claude'}}
        (self.project / '001-Voz/guion.md').write_text('[Yo] Hola.\n[Claude] Buenas.')
        _, inputs, _, plan = pipeline.voice_input(self.project, self.config, self.settings)
        self.assertEqual(plan[0]['profile'], 'mi-voz')
        self.assertEqual(plan[1]['profile'], 'claude-robot')
        self.assertEqual(plan[1]['effect'], 'robot-soft')
        self.assertEqual(plan[1]['exaggeration'], 0.2)
        self.assertEqual(plan[1]['cfg_weight'], 0.65)
        self.assertNotEqual(inputs['speaker_profiles_sha256']['Yo'], inputs['speaker_profiles_sha256']['Claude'])
        self.assertEqual(self.config['speakers']['Claude']['label'], 'Claude')

    def test_inline_dialogue_preserves_text_without_speaking_labels(self):
        turns = pipeline.dialogue_turns('# Guion\n\n[Yo] ¿Y el botón?\n\n[Claude] Sigue azul.',
                                        {'Yo': {}, 'Claude': {}})
        self.assertEqual([t['speaker'] for t in turns], ['Yo', 'Claude'])
        self.assertEqual([t['text'] for t in turns], ['¿Y el botón?', 'Sigue azul.'])

    def test_explicit_stage_direction_is_not_spoken(self):
        turns = pipeline.dialogue_turns('[Claude] Adiós.\n\n[Claude desaparece lentamente]\n\n[Yo] Todavía no funciona.',
            {'Claude': {}, 'Yo': {}}, ['Claude desaparece lentamente'])
        self.assertEqual([t['text'] for t in turns], ['Adiós.', 'Todavía no funciona.'])

    def test_known_turn_boundaries_split_whisper_phrases_by_speaker(self):
        transcript = {'segments': [{'id': 'p0001', 'words': ['w1', 'w2']}],
            'words': [{'id': 'w1', 'text': 'Hola.', 'start': 0.2, 'end': 0.8},
                      {'id': 'w2', 'text': 'Buenas.', 'start': 1.4, 'end': 1.8}]}
        turns = [{'id': 't1', 'speaker': 'mi-voz', 'start': 0, 'end': 1},
                 {'id': 't2', 'speaker': 'mujer', 'start': 1.3, 'end': 2}]
        pipeline.annotate_speakers(transcript, turns)
        self.assertEqual([p['speaker'] for p in transcript['segments']], ['mi-voz', 'mujer'])
        self.assertEqual([w['turn'] for w in transcript['words']], ['t1', 't2'])
        self.assertEqual(transcript['words'][1]['phrase'], 'p0002')

    def test_changed_speed_invalidates_voice(self):
        key, *_ = pipeline.voice_input(self.project, self.config, self.settings)
        self.config['voice']['speed'] = 1.15
        next_key, *_ = pipeline.voice_input(self.project, self.config, self.settings)
        self.assertNotEqual(key, next_key)
        self.prepared_voice()
        (self.project / '001-Voz/guion.md').write_text('Cambió el guion.')
        with self.assertRaisesRegex(ValueError, 'desactualizada'):
            pipeline.synchronize(self.project, self.config, self.settings)

    def test_failed_worker_preserves_existing_voice(self):
        self.prepared_voice()
        old_audio = (self.project / '001-Voz/voz.wav').read_bytes()
        old_metadata = (self.project / '001-Voz/generation.json').read_bytes()
        self.settings['voice_python'] = Path('python')

        def failing_worker(command, **kwargs):
            temporary = Path(command[command.index('--output') + 1])
            (temporary / 'voz.wav').write_bytes(b'incomplete')
            raise subprocess.CalledProcessError(1, command)

        with patch.object(pipeline, 'require_tools'), patch.object(pipeline, 'worker_environment', return_value={}), \
             patch.object(pipeline, 'run', side_effect=failing_worker):
            with self.assertRaises(subprocess.CalledProcessError):
                pipeline.generate_voice(self.project, self.config, self.settings, force=True)
        self.assertEqual((self.project / '001-Voz/voz.wav').read_bytes(), old_audio)
        self.assertEqual((self.project / '001-Voz/generation.json').read_bytes(), old_metadata)
        self.assertFalse(list((self.project / '001-Voz').glob('.voice-*')))

    def test_edited_narration_requires_regenerating_voice(self):
        self.prepared_voice()
        (self.project / '001-Voz/narracion.txt').write_text('Texto diferente.')
        with self.assertRaisesRegex(ValueError, 'desactualizada'):
            pipeline.synchronize(self.project, self.config, self.settings)

    def test_changed_profile_invalidates_voice(self):
        key, *_ = pipeline.voice_input(self.project, self.config, self.settings)
        (self.profile / 'profile.pt').write_bytes(b'new-profile')
        self.assertNotEqual(key, pipeline.voice_input(self.project, self.config, self.settings)[0])

    def test_sync_preserves_scenes_and_marks_review(self):
        self.prepared_voice()
        timeline_path = self.project / '002-Cues/Timeline.json'
        timeline = pipeline.read_json(timeline_path)
        timeline['scenes'] = [{'id': 'hero', 'start': 0.1}]
        timeline['events'] = {'hero.appear': 0.1}
        timeline['custom_palette'] = {'accent': 'coral'}
        pipeline.write_json(timeline_path, timeline)
        self.settings['whisper_python'] = Path('python')
        transcript = {'text': 'Una prueba.', 'segments': [{'id': 'p0001', 'start': 0.1, 'end': 1.5, 'text': 'Una prueba.'}],
            'words': [{'id': 'w00001', 'text': 'Una', 'start': 0.1, 'end': 0.4},
                      {'id': 'w00002', 'text': 'prueba.', 'start': 0.5, 'end': 1.5}]}

        def worker(command, **kwargs):
            pipeline.write_json(Path(command[command.index('--output') + 1]), transcript)

        with patch.object(pipeline, 'require_tools'), patch.object(pipeline, 'worker_environment', return_value={}), \
             patch.object(pipeline, 'audio_duration', return_value=2.123), patch.object(pipeline, 'run', side_effect=worker) as run:
            pipeline.synchronize(self.project, self.config, self.settings)
            after = pipeline.read_json(timeline_path)
            self.assertEqual(after['scenes'], timeline['scenes'])
            self.assertEqual(after['events'], timeline['events'])
            self.assertEqual(after['custom_palette'], timeline['custom_palette'])
            self.assertEqual(after['visuals']['state'], 'needs_review')
            self.assertEqual(after['durationInFrames'], 188)
            pipeline.synchronize(self.project, self.config, self.settings)
            self.assertEqual(run.call_count, 1)

    def test_validation_reports_missing_and_repeated_words(self):
        transcript = {'text': 'Una una.', 'segments': [{'start': 0, 'end': 1}],
                      'words': [{'id': 'w1', 'start': 0, 'end': 0.5, 'probability': 0.2}]}
        result = pipeline.validate_transcript('Una prueba.', transcript, 2)
        self.assertEqual(result['state'], 'needs_review')
        self.assertTrue(result['differences'])
        self.assertEqual(result['uncertain_words'], ['w1'])
        transcript['words'][0]['end'] = 4
        with self.assertRaises(ValueError):
            pipeline.validate_transcript('Una prueba.', transcript, 2)

    def test_render_requires_fresh_sync_and_reviewed_scenes(self):
        self.prepared_voice()
        self.config['composition'] = 'TestVideo'
        timeline_file = self.project / '002-Cues/Timeline.json'
        timeline = pipeline.read_json(timeline_file)
        timeline['sync'] = {'state': 'ok', 'input_sha256': pipeline.sync_input(self.project, self.config)}
        timeline['visuals'] = {'state': 'ready'}
        timeline['scenes'] = [{'id': 'intro', 'start': 0, 'end': 3}]
        pipeline.write_json(timeline_file, timeline)
        self.assertEqual(pipeline.check_prepared(self.project, self.config, self.settings)['scenes'], timeline['scenes'])
        timeline['visuals']['state'] = 'needs_review'
        pipeline.write_json(timeline_file, timeline)
        with self.assertRaisesRegex(ValueError, 'Revisa'):
            pipeline.check_prepared(self.project, self.config, self.settings)
        timeline['visuals']['state'] = 'ready'
        timeline['sync']['input_sha256'] = 'old'
        pipeline.write_json(timeline_file, timeline)
        with self.assertRaisesRegex(ValueError, 'sincronización'):
            pipeline.check_prepared(self.project, self.config, self.settings)

    def test_missing_composition_blocks_render(self):
        self.prepared_voice()
        timeline_file = self.project / '002-Cues/Timeline.json'
        timeline = pipeline.read_json(timeline_file)
        timeline['sync'] = {'state': 'ok', 'input_sha256': pipeline.sync_input(self.project, self.config)}
        timeline['visuals'] = {'state': 'ready'}
        timeline['scenes'] = [{'id': 'intro', 'start': 0, 'end': 3}]
        pipeline.write_json(timeline_file, timeline)
        with self.assertRaisesRegex(ValueError, 'composition'):
            pipeline.check_prepared(self.project, self.config, self.settings)

    def test_lock_prevents_concurrent_mutations(self):
        with pipeline.project_lock(self.project):
            with self.assertRaises(ValueError):
                with pipeline.project_lock(self.project):
                    pass
        self.assertFalse((self.project / '.pipeline.lock').exists())

    def test_srt_handles_minute_rollover(self):
        self.assertEqual(pipeline.srt_time(59.9996), '00:01:00,000')

    def test_runtime_keeps_virtualenv_interpreter_path(self):
        settings = pipeline.runtime()
        self.assertIn('bin/python', str(settings['voice_python']))
        self.assertIn('bin/python', str(settings['whisper_python']))


if __name__ == '__main__':
    unittest.main()
