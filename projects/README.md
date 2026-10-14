# Proyectos con narración local

Cada proyecto tiene `001-Voz/`, `002-Cues/`, `003-Escenas/` y `004-Render/`.
La voz definitiva marca el ritmo; las escenas y los efectos consumen el mismo
`002-Cues/Timeline.json`. `examples/` sigue siendo la galería de piezas terminadas.

## Uso

Desde la raíz del repositorio:

```bash
npm run project -- doctor
npm run project -- init 001-mi-video
```

Escribe la narración en `projects/001-mi-video/001-Voz/guion.md`. Se omiten los
títulos Markdown y los comentarios `<!-- indicaciones visuales -->`. Se eliminan
las marcas de listas, énfasis y enlaces, conservando el texto. No uses bloques de
código. La velocidad predeterminada es 1,2×, conservando el tono. Divide el texto en frases de hasta 300 caracteres. Revisa el texto que se
pronunciará en `narracion.txt` tras generar la voz.

```bash
# Ejecutar ambas etapas, o ejecutarlas por separado para escuchar la voz primero.
npm run project -- prepare 001-mi-video
npm run project -- voice 001-mi-video
npm run project -- sync 001-mi-video
npm run project -- status 001-mi-video

# Después de construir y registrar las escenas:
npm run project -- mix 001-mi-video
npm run project -- preview 001-mi-video
npm run project -- render 001-mi-video

# Estas opciones se guardan en project.json.
npm run project -- voice 001-mi-video --speed 1.15 --voice mi-voz
npm run project -- prepare 001-mi-video --force
```

`--force` repite la etapa aunque esté al día. Un cambio de guion, perfil, velocidad
o semilla invalida la voz. Cambiar modelo de Whisper, FPS o margen final invalida
la sincronización. Los comandos conservan resultados anteriores si falla el
trabajador; los archivos nuevos se publican únicamente tras completar la etapa.
No ejecutes dos procesos sobre el mismo proyecto. Una interrupción abrupta puede
dejar `.pipeline.lock`; elimínalo solo después de comprobar que el proceso terminó.

Para otro directorio de proyectos:

```bash
npm run project -- --projects-root /ruta/projects init 001-mi-video
```

## Archivos

- `project.json`: formato (vertical 1080×1920 por defecto), FPS, estilo `pixel-tech`,
  motor visual, voz, Whisper y `closing_hold` en segundos. Tras crear las escenas:
  `composition` indica el ID registrado y `sound_cues` la ruta al cue sheet dentro del proyecto.
- `001-Voz/guion.md`: original; `narracion.txt`: texto hablado; `voz.wav`: audio con
  velocidad definitiva; `generation.json`: parámetros, huellas, duración y frases de síntesis.
- `002-Cues/transcript.json`: transcripción real por frases y palabras con IDs,
  tiempos en segundos y probabilidad por palabra.
- `002-Cues/subtitles.srt`: subtítulos por frase, sin incorporarlos automáticamente al video.
- `002-Cues/validation.json`: diferencias entre texto esperado y reconocido, y palabras inciertas.
- `002-Cues/Timeline.json`: narración, escenas y eventos compartidos con el diseño visual.
- `003-Escenas/`: storyboard, recursos y documentación del diseño. Registra la composición
  en `src/Root.tsx` y sus componentes en `src/<proyecto>/`, según `AGENTS.md`.
- `004-Render/`: previews, video sin sonido, mezcla, video final y revisión visual.

El texto reconocido no sustituye al guion. Las diferencias se señalan para revisión;
pueden ser errores de reconocimiento o errores de síntesis. Whisper entrega tiempos
estimados, especialmente en pausas, números y palabras con baja confianza. Esta
versión usa faster-whisper, sin una etapa adicional de alineación forzada.

## Contrato para construir las escenas

Después de escuchar la voz y revisar `validation.json`, pide al agente:

> Crea las escenas de projects/001-mi-video usando el guion y la voz preparada.

`Timeline.json` contiene:

```json
{
  "fps": 60,
  "duration": 9,
  "durationInFrames": 540,
  "narration": {
    "audio": "../001-Voz/voz.wav",
    "offset": 0,
    "duration": 8,
    "phrases": [{"id": "p0001", "start": 0.2, "end": 2.1, "text": "Texto hablado.", "words": ["w00001"]}],
    "words": [{"id": "w00001", "phrase": "p0001", "start": 0.2, "end": 0.6, "text": "Texto", "probability": 0.98}]
  },
  "scenes": [],
  "events": {},
  "sync": {"state": "ok"},
  "visuals": {"state": "pending"}
}
```

Ejemplo ilustrativo; el CLI calcula los tiempos a partir del WAV y redondea la
duración total hacia arriba al siguiente frame. El margen de cierre predeterminado
es 1 segundo. La ruta del audio se interpreta respecto a `002-Cues/`; para Remotion
hay que servir el WAV mediante `public/` o un servidor y usar esa URL en `<Audio>`.

Al construir el storyboard, vincula cada evento a un ID de palabra o frase y
registra su tiempo en `events`. No codifiques los inicios en los componentes ni
repartas las escenas uniformemente. Los IDs corresponden a una transcripción;
no garantizan conservar significado si cambia el audio. `sync` conserva `scenes`,
`events` y los campos adicionales del timeline y marca `visuals.state` como
`needs_review` cuando cambia la sincronización. El agente debe revisar y actualizar
los tiempos y las referencias antes de renderizar.

La marca `farix.romero`, paleta, storyboard, revisión y mezcla siguen las reglas de
`AGENTS.md`. El agente construye y registra la composición según el guion; el CLI
no inventa las escenas. `mix` genera efectos y un fondo a partir del cue sheet,
los atenúa mientras habla la voz y normaliza la mezcla final. `preview` y `render`
usan la composición registrada, generan el video sin audio y lo unen con `mix.wav`.
Comprueban formato, FPS, duración, pista de audio, −14 LUFS ±1 y pico real ≤−1 dBFS.
Los resultados quedan en `004-Render/`; cada MP4 tiene un manifiesto `.mp4.json`.
El recurso para Studio se copia automáticamente a `public/projects/<id>/mix.wav`.

Antes de renderizar, la voz y la sincronización deben estar al día, `sync.state`
debe ser `ok` y `visuals.state` `ready` o `reviewed`. Si las diferencias de Whisper
son solo formas equivalentes (por ejemplo «treinta» y «30»), registra la revisión
sin borrar sus diferencias originales. Si se regenera la voz, hay que revisar de
nuevo las escenas y la transcripción. La inspección visual del video sigue siendo
obligatoria después de renderizar; los checks técnicos no la sustituyen.

## Entornos locales

Se reutilizan automáticamente los entornos hermanos de `../videos_remotion/`:

- `.venv-voice/bin/python` para Chatterbox Multilingual V3.
- `.venv/bin/python` para faster-whisper.
- `.tools/voices/mi-voz/{voice.json,profile.pt,reference.wav}` para el perfil existente.
- `.tools/voice-cache/` para los modelos de Chatterbox.

No se modifica el otro repositorio ni se duplican modelos o perfiles. Chatterbox
termina antes de cargar Whisper, liberando la memoria GPU. Se requieren `ffmpeg`
y `ffprobe` en PATH. La primera descarga de modelos necesita conexión; la síntesis
y la transcripción se ejecutan localmente.

Para otras rutas, copia `pipeline.local.example.json` a `pipeline.local.json`
(ignorado por Git). Las rutas relativas se interpretan respecto a este repositorio.
También puedes usar `PIPELINE_VOICE_PYTHON`, `PIPELINE_WHISPER_PYTHON`,
`PIPELINE_VOICES_DIR` y `PIPELINE_VOICE_CACHE`.

Las dependencias para recrear entornos separados están en
`scripts/project/requirements-voice.txt` y `requirements-whisper.txt`. Chatterbox
requiere Python 3.11 y PyTorch con CUDA. Para Whisper en CPU cambia
`whisper.device` a `cpu` en `project.json`; la síntesis sigue requiriendo CUDA.

```bash
npm run test:project
npm run project -- doctor
```


## Diálogos con varias voces

Un guion puede alternar etiquetas de hablante. Cada etiqueta inicia un turno:

También se aceptan etiquetas al principio de la misma línea: `[Yo] ¿Y el botón?`.
En `speakers`, `exaggeration` permite ajustar la expresividad por hablante
(predeterminado 0,35; `003-cambia-boton` usa 0,6 para la voz alegre de Claude).

```text
[mi-voz]
Hola, quiero agendar una cita.

[mujer]
¡Claro! Puedes consultar nuestros horarios.
```

Configura los perfiles en `project.json`:

```json
{
  "speakers": {
    "mi-voz": {"profile": "mi-voz", "label": "Usuario / narrador"},
    "mujer": {"profile": "mujer", "label": "Asistente"}
  },
  "dialogue": {"turn_pause": 0.35}
}
```

La configuración se añade al resto del archivo existente. `prepare`, `voice` y
`sync` funcionan igual. Las etiquetas se excluyen de la locución y de `narracion.txt`.
Los turnos individuales quedan en `001-Voz/turns/`, con tiempos reales en `turns.json`.
Whisper transcribe cada turno con el texto previsto como contexto; sus tiempos se
trasladan al audio completo y sus frases/palabras guardan `speaker` y `turn`.
No hace falta inferir el hablante con diarización cuando ya se conoce al sintetizar.

Los perfiles se buscan primero en `voices_dir` y luego en `.tools/voices/` del repo.
El perfil femenino genérico `mujer` es local. Su referencia se generó con Piper y
se preparó para Chatterbox; su procedencia está documentada en
`projects/002-dentista-permisos/001-Voz/perfil-mujer.txt`.

Para crear otro perfil desde una referencia de voz:

```bash
PYTHONNOUSERSITE=1 HF_HOME=../videos_remotion/.tools/voice-cache \
../videos_remotion/.venv-voice/bin/python scripts/project/create_voice_profile.py \
  --name otro-perfil --reference /ruta/referencia.wav
```

El comando conserva los perfiles existentes y requiere al menos seis segundos
de referencia. No entrena un modelo nuevo. Las grabaciones y perfiles quedan fuera de Git.
