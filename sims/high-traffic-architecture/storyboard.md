# 100 000 usuarios · arquitectura bajo presión

30 segundos, 1080×1080, 60 fps. Firma `farix.romero` visible siempre.

Una única arquitectura fija: clientes a la izquierda, gateway en el centro
izquierdo, balanceador al centro, cuatro plataformas de servicio a la derecha
y base de datos al fondo. La cámara descubre componentes sin moverlos.

1. **0–6 s — Crecimiento.** Red de usuarios instanciados, contador de usuarios
   activos separado del flujo HTTP. La cámara sigue la convergencia al gateway.
2. **6–12 s — Saturación.** Gateway, una instancia y base de datos; entrada
   ilustrativa 20 000 req/s frente a 5 000 req/s. Cola acotada, latencia creciente,
   errores y rechazos cuando se llena. El servidor sigue trabajando.
3. **12–18 s — Momento protagonista.** Rate Limiting desvía excedentes a HTTP429;
   Load Shedding responde HTTP503 ante presión de recursos. Baja la carga
   admitida a 4 000 req/s y se drena la cola. Las salidas rojas siguen visibles.
4. **18–24 s — Distribución y preparación.** El balanceador reparte entre tres
   instancias ya listas. Autoscaling solicita una cuarta: preparación visible
   durante dos segundos y ninguna solicitud antes de READY. Los límites siguen
   activos y el presupuesto compartido de base de datos no aumenta.
5. **24–30 s — Estabilidad condicional.** Plano general y monitoreo: 12 000 req/s
   admitidos bajo un presupuesto DB de 14 000 req/s; los excedentes se rechazan.
   Título legible desde 25 s hasta el final. Pulso de cierre y audio con fade.

Partículas escaladas: no se simulan cien mil mallas ni una carga real. Usuarios,
req/s y métricas no son equivalentes. El arranque se comprime narrativamente,
sin afirmar que una réplica real tarda dos segundos. La cola y admisión están
acotadas. La base compartida continúa siendo un límite.

## Ajuste de firma y música

La firma adopta el estilo aprobado de CI/CD: JetBrains Mono 400, 19 px, #9db3ce, tracking .19em, opacidad 1, top 66 px y right 70 px. El crecimiento inicial utiliza un pulso melódico suave sobre una sola nota, evitando saltos de altura entre los segundos 2 y 3. Los cambios de contador se acompañan con ticks discretos.
