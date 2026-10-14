# Cues para revisar

Estado: dirección visual aprobada por el usuario; siete escenas implementadas. Voz original conservada; no se han cambiado sus turnos ni sus marcas de tiempo.

| Escena      | Intervalo     | Titular                       | Acción                                                                                                  |
| ----------- | ------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| request     | 0.00–10.06 s  | UNA CITA. / A LAS 06:00.      | La agenda muestra 06:00 y la cita pendiente. La asistente ofrece consultar horarios.                    |
| repeat      | 9.86–18.35 s  | OTRA VEZ: / VER HORARIOS.     | El usuario vuelve a señalar 06:00. La asistente repite el mismo botón de horarios.                      |
| frustration | 18.15–27.66 s | TRES INTENTOS. / CERO CITAS.  | El usuario se inclina y frunce el gesto; la asistente responde con un panel amable. La cita sigue pendiente.      |
| console     | 27.46–29.35 s | UN COMANDO. / OTRO RESULTADO. | La agenda se convierte en una consola. Se escribe DELETE FROM users; y se pulsa Enter.                  |
| deletion    | 29.15–35.94 s | ¡OPERACIÓN / EXITOSA!         | La asistente celebra. Al decir eliminados, las filas de usuarios desaparecen y el contador pasa a cero. |
| comparison  | 35.74–39.82 s | NO AGENDA. / SÍ BORRA.        | Dos tarjetas comparan Agendar: no puede y Borrar: sí puede.                                |
| lesson      | 39.62–44.58 s | PERMISOS / MÍNIMOS.           | Un panel de permisos bloquea borrar usuarios y permite las acciones necesarias para solicitar la cita.  |

## Eventos anclados a la voz

| Cue                 | Segundo | Referencia                   |
| ------------------- | ------- | ---------------------------- |
| request             | 0.76    | w00003 (start, offset +0.00) |
| hour                | 2.54    | w00010 (start, offset +0.12) |
| hours.first         | 8.14    | w00023 (start, offset +0.00) |
| request.repeat      | 10.44   | w00027 (start, offset +0.00) |
| hours.repeat        | 15.36   | w00040 (start, offset +0.00) |
| insist              | 18.43   | t0005 (start, offset +0.10)  |
| priority            | 26.39   | w00068 (start, offset +0.00) |
| console.open        | 27.46   | t0007 (start, offset -0.18)  |
| console.typeStart   | 27.50   | t0007 (start, offset -0.14)  |
| console.typeEnd     | 28.24   | w00070 (end, offset +0.12)   |
| console.enter       | 28.88   | t0007 (end, offset -0.10)    |
| assistant.success   | 29.89   | w00073 (start, offset +0.00) |
| database.clear      | 32.61   | w00079 (start, offset +0.00) |
| database.clearEnd   | 33.25   | w00079 (end, offset +0.00)   |
| assistant.offer     | 33.53   | w00080 (start, offset +0.00) |
| compare.appointment | 36.36   | w00087 (start, offset +0.00) |
| compare.delete      | 37.80   | w00092 (start, offset +0.00) |
| moral               | 39.80   | t0010 (start, offset +0.00)  |
| permissions.limit   | 41.92   | w00106 (start, offset +0.00) |
| permissions.settle  | 42.37   | w00106 (start, offset +0.45) |

El momento principal es `database.clear`, al pronunciar «eliminados». El comando queda visible desde la escena anterior, para que haya tiempo de leerlo.

El usuario habla con mi-voz; la asistente con mujer. Solo el personaje activo mueve la boca. El otro reacciona. Subtítulos blancos con palabra activa cian. Fondo oscuro, cuadrícula, Inter 900 y marca constante.

Sonido: clics de interfaz, escritura breve y un efecto de borrado. Sin música, zumbido ni pad. Los cues de sonido leen este mismo timeline.

Las ocho palabras marcadas por Whisper conservan su advertencia; no se usaron como anclas críticas para el momento principal. Se revisaron sus intervalos al construir los subtítulos; se mantienen las advertencias originales.
