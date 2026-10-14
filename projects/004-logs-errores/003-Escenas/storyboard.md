# Cero errores — storyboard aprobado

Formato: 1080×1920, 60 fps. Diálogo original sin cambios, mi-voz a 1.2× con diferente expresividad para Yo y Claude. Claude naranja, desarrollador azul. Personajes cúbicos con ojos rectangulares, brazos pequeños y cuatro patas; animación física breve, sin deformar su silueta.

Escenario continuo: teclado gigante, monitor oscuro y racks inicialmente fuera del encuadre. Luz violeta ambiental, naranja para Claude y rojo para errores. Interfaces legibles; subtítulos blancos con palabra activa cyan. Marca farix.romero según AGENTS.md.

| Escena | Turnos | Acción |
|---|---|---|
| Producción falla | 1 | Ambos sobre el teclado; logs rojos en el monitor. Desarrollador señala los errores. |
| Solución inmediata | 2 | Claude salta y pulsa una tecla; dashboard verde. |
| Demasiado rápido | 3 | Acercamiento al desarrollador, mirada inquisitiva hacia Claude. |
| Apagar la evidencia | 4–5 | Claude pasa Logs de ON a OFF; desaparecen las líneas. Desarrollador reacciona. |
| También las alertas | 6 | Claude apaga Alertas; aparece humo discreto detrás del monitor. |
| La discusión | 7 | Desarrollador gesticula; Claude sigue tranquilo. |
| La falsa victoria | 8 | Claude presenta el dashboard: un gran 0 verde. |
| La realidad | 9 | Cámara abre el plano y revela racks ardiendo junto al dashboard verde. Único momento principal. |
| El remate | 10 | Primer plano de Claude con luz de fuego, panel «Sin registros» y mirada a cámara. Hold final. |

Los tiempos y eventos se anclan a turnos, frases y palabras de la grabación definitiva en ../002-Cues/Timeline.json. No se distribuyen las escenas a intervalos iguales.

Implementación: entorno 3D determinista con Three.js capturado a 60 fps mediante sims/, integrado como composición en Remotion para Studio y CLI del proyecto. Fuentes y colores centralizados. Sin imágenes generadas: personajes, teclado, interfaz y fuego son geometría procedural.

Sonido: voz y efectos puntuales de teclas, interruptores, confirmación, golpe de revelación y crepitar no tonal del fuego. Sin música, pad ni hum.
