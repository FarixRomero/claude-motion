# Cues visuales y de sonido

Los 19 eventos de Timeline.json están anclados a IDs de palabras, frases y turnos de la voz definitiva a 1.2×.

- `fix.key`: Claude salta, tecla baja, dashboard verde; tecla y confirmación breve.
- `logs.off`: interruptor OFF y log vacío; clic y barrido corto.
- `alerts.off`: alertas OFF; clic y barrido corto.
- `logs.reaction`, `argument.jump`: reacción del desarrollador y caída sobre tecla.
- `smoke.start`: humo discreto junto a los racks, sin sonido continuo.
- `dashboard.zero`: presentación del cero; confirmación breve.
- `fire.reveal`: apertura de cámara y fuego; barrido, golpe único y crepitaciones puntuales.
- `records.empty`: panel Sin registros; clic.
- `punchline.look`: giro de Claude a cámara y pausa final.

No hay música, pad ni hum. Los efectos se atenúan automáticamente bajo la voz; la mezcla final se normaliza a −14 LUFS con techo previo a AAC de −2 dBTP.
