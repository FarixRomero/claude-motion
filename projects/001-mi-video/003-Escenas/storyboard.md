# Un libro. Treinta microservicios.

Formato: 1080 × 1920, 60 fps, 32,03 s. Voz acelerada a 1,2× sin cambiar el tono; original conservado en voz-original.wav.
Referencia: captura aportada por el usuario. Fondo negro azulado con cuadrícula,
títulos en Inter de peso 900, personajes geométricos de bloques, interfaz de código
y subtítulos blancos con palabra activa cian. Verde para éxito; rojo para error.
Un constructor azul con casco y un arquitecto naranja comparten el escenario.
La ventana detrás de ellos pasa de monolito a treinta servicios, lista de infraestructura
y un error. Los personajes reaccionan a las palabras clave de la narración.

| Voz | Escena | Diseño |
| --- | --- | --- |
| Libro → dividir el monolito | Un libro. 30 servicios. | El constructor sostiene un libro de arquitectura. El bloque único se fragmenta en una retícula de 30 servicios. Es el momento principal. |
| «Porque así escala mejor» | ¿Por qué? | El arquitecto responde con un globo de diálogo. El diagrama persiste al pie. |
| 50 usuarios, 40 de RR. HH. | Solo 50 usuarios | Cincuenta personas en una retícula. Cuarenta se resaltan cuando la voz menciona recursos humanos. |
| Kubernetes, API Gateway, observabilidad, reuniones | La factura de complejidad | Una lista de cuatro dependencias dentro de la ventana aparece al pronunciar cada dependencia. Tres reuniones buscan un único error. |
| Antes tenías un monolito funcionando | Antes: funcionaba | Un solo servicio estable, con una petición que entra y vuelve. |
| Ahora, 30 servicios que no se hablan | Ahora: no se hablan | Los treinta nodos reaparecen; las conexiones se cortan y las peticiones no llegan. |
| La buena arquitectura resuelve problemas | Resuelve problemas. | El diagrama se simplifica a un bloque. El mensaje final se sostiene más de tres segundos. |

## Sincronización y continuidad

Los beats están anclados a IDs de palabra en `002-Cues/Timeline.json`.
Los componentes no tienen inicios absolutos; consumen `events` y `scenes`.
Los subtítulos agrupan seis palabras según sus tiempos reales. La marca
`farix.romero` permanece en todos los frames con la especificación del repositorio.
Se conserva una línea de diagrama y un indicador de capítulo a lo largo de la pieza.

## Sonido

Voz al frente. Pulsos discretos acompañan los elementos de infraestructura;
un único impacto acompaña la fragmentación. Un acorde breve marca el cierre.
Por preferencia del usuario, no se incluye ningún fondo tonal sostenido ni zumbido.
La mezcla final se normaliza con FFmpeg, no solo el archivo de efectos.
