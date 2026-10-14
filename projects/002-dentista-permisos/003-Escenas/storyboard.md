# Cues para revisar

Estado: dirección visual aprobada por el usuario; siete escenas implementadas. Voz original conservada; no se han cambiado sus turnos ni sus marcas de tiempo.

| Escena | Intervalo | Titular | Acción |
| --- | --- | --- | --- |
| request | 0.00–10.06 s | UNA CITA. / A LAS 06:00. | La agenda muestra 06:00 y la cita pendiente. La asistente ofrece consultar horarios. |
| repeat | 9.86–18.35 s | OTRA VEZ: / VER HORARIOS. | El usuario vuelve a señalar 06:00. La asistente repite el mismo botón de horarios. |
| frustration | 18.15–27.66 s | TRES INTENTOS. / CERO CITAS. | El usuario se inclina y frunce el gesto; la asistente responde con un panel amable. La cita sigue pendiente. |
| console | 27.46–29.35 s | UN COMANDO. / OTRO RESULTADO. | La agenda se convierte en una consola. Se escribe DELETE FROM users; y se pulsa Enter. |
| deletion | 29.15–35.94 s | ¡OPERACIÓN / EXITOSA! | La asistente celebra. Al decir eliminados, las filas de usuarios desaparecen y el contador pasa a cero. |
| comparison | 35.74–39.82 s | NO AGENDA. / SÍ BORRA. | Dos tarjetas comparan Agendar: no puede y Borrar: sí puede. |
| lesson | 39.62–44.58 s | PERMISOS / MÍNIMOS. | Un panel de permisos bloquea borrar usuarios y permite las acciones necesarias para solicitar la cita. |

## Personajes y continuidad

Paciente azul a la izquierda, sin casco, con un teléfono. Asistente naranja a la derecha, con auriculares y micrófono. Se conserva la misma ventana del consultorio y el mismo escenario a lo largo del diálogo. La cita permanece pendiente; nunca se muestra una reserva confirmada.

La eliminación representa únicamente la tabla users del relato. En el cierre se muestra una propuesta de permisos mínimos, sin fingir que la cita ya se ha agendado.

Vista de revisión: `004-Render/review/scene.png` y `004-Render/scene-preview.mp4`. La muestra representa la escena de eliminación. El video completo se registra como DentistPermissionsVideo.
