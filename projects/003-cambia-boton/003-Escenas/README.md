# Solo cambia el botón

Storyboard aprobado: [storyboard.md](storyboard.md). Paleta: [palette.ts](palette.ts).
Referencia: `prompt-escenas-blocky.txt` y `projects/001-mi-video/003-Escenas/assets/style-reference.png`.
Personajes SVG adaptados de `src/001-mi-video/Character.tsx`; bocas y etiquetas siguen al hablante activo.

El timeline preserva narración, hablantes, turnos y metadatos de sincronización. Veinte eventos anclados a palabras,
seis escenas y subtítulos agrupados en bloques cortos. El botón azul nunca cambia de color.
Solo la muestra del color solicitado es verde. Treinta nodos aparecen al decir «treinta»; capacidad de diez
millones y tres usuarios reales tienen rótulos distintos. El acercamiento final conserva la ventana original.
La animación se deriva únicamente del frame. Marca permanente según AGENTS.md.

## Voces y procedencia

Yo: perfil local `mi-voz`, expresividad 0,35. Claude: perfil local sintético genérico `mujer`, expresividad 0,6.
Ambos sintetizados con Chatterbox Multilingual V3, velocidad 1,2× mediante atempo, sin cambiar el tono.
Las etiquetas no se pronuncian y el guion original permanece intacto.

El perfil genérico procede de Piper es_ES-sharvard-medium, speaker F/1; perfil ya disponible en el repositorio.
Origen y licencia: [documentación local](../../002-dentista-permisos/001-Voz/perfil-mujer.txt).
Datos Sharvard, Universidad de Edimburgo; licencia indicada CC BY 3.0.

No hay música, pad ni zumbido. [sound.py](sound.py) coloca únicamente efectos puntuales desde el timeline;
el mezclador atenúa los efectos bajo la voz y normaliza el archivo final.

## Regenerar

```bash
npm run project -- prepare 003-cambia-boton
# Revisar transcripción y sus advertencias antes de reconstruir los tiempos.
python3 projects/003-cambia-boton/003-Escenas/build_timeline.py
npm run project -- preview 003-cambia-boton
npm run project -- render 003-cambia-boton
```

El render requiere `sync.state = ok` después de revisar los tiempos. La revisión visual se hace sobre el MP4
actual, incluyendo el frame cero, cada evento, los cambios de escena y el cierre. La comprobación auditiva
directa no está disponible para el agente; se guardan las diferencias de la pasada independiente de Whisper.
