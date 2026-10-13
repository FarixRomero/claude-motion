# Escenas y estilo

Referencia visual: [captura del usuario](assets/style-reference.png).

- [Storyboard](storyboard.md), [paleta y fuentes](palette.ts), [cue sheet](sound.py).
- [Composición y escenas](../../../src/001-mi-video/Video.tsx).
- [Personajes de bloques](../../../src/001-mi-video/Character.tsx).
- [Acceso al timeline](../../../src/001-mi-video/design.ts).
- [Timeline compartido](../002-Cues/Timeline.json).

Los personajes se dibujan con SVG y se animan como función del frame. No requieren
sprites externos ni imágenes generadas. Las escenas conservan una ventana de código,
un constructor azul y un arquitecto naranja; cambia el contenido de la interfaz,
las reacciones y los contadores según la voz.

El final simplifica el diagrama como metáfora de reducir complejidad. No prescribe
monolitos para todos los casos: el mensaje del guion es resolver los problemas reales.

```bash
npm run project -- mix 001-mi-video
npm run project -- preview 001-mi-video
npm run project -- render 001-mi-video
```

`preview` exporta 540 × 960; `render` exporta 1080 × 1920. Ambos incluyen la mezcla,
con efectos puntuales atenuados por la voz, sin fondo tonal sostenido. El WAV original queda intacto. El render
verifica formato, FPS, duración, presencia de audio, −14 LUFS ±1 y pico real ≤−1 dBFS.

En Remotion Studio, selecciona `MicroservicesVoiceVideo`. Ejecuta `mix` primero
para preparar `public/projects/001-mi-video/mix.wav`, el recurso que usa la vista previa.
