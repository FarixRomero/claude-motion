# Una cita, demasiados permisos

Proyecto de diálogo con dos voces locales. Se generó la versión actual del guion,
con diez turnos y los dos intercambios adicionales que añadió el usuario.

- `mi-voz`: quien pide la cita, escribe el comando, comenta el resultado y narra la moraleja.
- `mujer`: asistente del consultorio; perfil femenino sintético genérico.
- Velocidad: 1,2× conservando el tono. Pausa entre turnos: 0,35 s.
- Audio completo: [001-Voz/voz.wav](001-Voz/voz.wav), 43,57 s.
- Audios individuales: [001-Voz/turns.json](001-Voz/turns.json) y `001-Voz/turns/`.
- Guion editable: [001-Voz/guion.md](001-Voz/guion.md).
- Tiempos y hablantes: [002-Cues/Timeline.json](002-Cues/Timeline.json).

## Formato del guion

Las etiquetas indican quién habla y no se pronuncian:

```text
[mi-voz]
Hola, quiero agendar una cita.

[mujer]
¡Claro! Puedes consultar nuestros horarios.
```

Cada etiqueta inicia un turno, incluso si se repite el mismo hablante. Sus nombres
se definen en `project.json → speakers`; allí se asigna el perfil de cada voz.
El texto SQL es contenido hablado del guion, no una operación de base de datos.

## Generación y sincronización

```bash
npm run project -- prepare 002-dentista-permisos
npm run project -- status 002-dentista-permisos
```

Chatterbox se carga una vez y alterna los dos perfiles. Cada turno se normaliza
individualmente para equilibrar los niveles. Los WAV se unen con pausas explícitas;
`turns.json` registra sus inicios y finales reales. No se añade música ni fondo tonal.

Whisper transcribe cada WAV individual con el guion como contexto y transforma
sus tiempos al reloj del diálogo completo. Los hablantes vienen de la generación,
no de una inferencia de género. Se conservan en frases, palabras y turnos del timeline.

La transcripción reconoce el texto previsto; algunas palabras tienen baja confianza,
marcada en [validation.json](002-Cues/validation.json). Hay que revisar sus tiempos al
construir los subtítulos. La duración futura del video, con el margen final actual,
es 44,58 s. Las siete escenas están implementadas en `src/002-dentista-permisos/Video.tsx`, con su composición `DentistPermissionsVideo`.

## Perfil femenino

La referencia se creó localmente con Piper `es_ES-sharvard-medium`, speaker F/1,
y se acondicionó en Chatterbox Multilingual V3. El perfil reutilizable se guarda en
`.tools/voices/mujer/`, fuera de Git. [Origen y licencia de la voz base](001-Voz/perfil-mujer.txt).

## Revisión de escenas

- [Cues y tiempos](002-Cues/Cues.md).
- [Storyboard de las siete escenas](003-Escenas/storyboard.md).
- [Imagen de la escena principal](004-Render/review/scene.png).
- [Clip de la escena con voz y efectos](004-Render/scene-preview.mp4).

La vista muestra al paciente azul y la asistente naranja con auriculares. Las filas
desaparecen al decir «eliminados», mientras la cita continúa pendiente. Los sonidos
son puntuales, sin zumbido de fondo. Este clip conserva la primera vista aprobada de la escena principal. El video completo
se guarda en `004-Render/final.mp4`. En Remotion Studio, la composición
`DentistScenePreview` permite revisar este momento alrededor de los segundos 29–36.

## Video completo

- [Final vertical, 1080 × 1920 y 60 fps](004-Render/final.mp4).
- [Versión ligera para revisar](004-Render/preview.mp4).
- [Metadatos y verificación del archivo](004-Render/final.mp4.json).
- [Revisión de fotogramas y sincronización](004-Render/review/full-review.json).

Para ver y editar la pieza: `npm run studio`, composición `DentistPermissionsVideo`.
Los cues del sonido y los eventos visuales leen `002-Cues/Timeline.json`.

Esta entrega utiliza el WAV aprobado, sin regenerar ni modificar el guion. Después
de generar ese WAV hubo cambios en el worker de diálogo del repositorio. Se comprobó
que guion, perfiles y opciones siguen coincidiendo; `generation.json` conserva
el hash del worker original. La revisión acepta esta grabación para renderizar
con el worker actual; el CLI sigue rechazando cambios del guion, perfiles, velocidad
o WAV. Si se genera una nueva voz, hay que revisar de nuevo tiempos y escenas.

```bash
npm run project -- status 002-dentista-permisos
npm run project -- preview 002-dentista-permisos
npm run project -- render 002-dentista-permisos
```

Para renderizar únicamente la imagen con la grabación actual:

```bash
npx remotion render DentistPermissionsVideo projects/002-dentista-permisos/004-Render/silent.mp4 --props '{"silent":true}' --crf 16 --concurrency 4
ffmpeg -y -i projects/002-dentista-permisos/004-Render/silent.mp4 -i projects/002-dentista-permisos/004-Render/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -movflags +faststart -shortest projects/002-dentista-permisos/004-Render/final.mp4
```
