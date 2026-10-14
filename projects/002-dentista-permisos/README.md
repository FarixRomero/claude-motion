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
es 44,58 s. Las escenas y el render aún están pendientes.

## Perfil femenino

La referencia se creó localmente con Piper `es_ES-sharvard-medium`, speaker F/1,
y se acondicionó en Chatterbox Multilingual V3. El perfil reutilizable se guarda en
`.tools/voices/mujer/`, fuera de Git. [Origen y licencia de la voz base](001-Voz/perfil-mujer.txt).
