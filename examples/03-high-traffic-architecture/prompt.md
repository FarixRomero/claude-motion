# Prompt recibido · 100 000 usuarios concurrentes

Crear una simulación cinematográfica continua de 30 segundos, 1080×1080,
60 fps, con audio estéreo, entregada en `out/high-traffic-architecture.mp4`.
Usar la estética premium oscura, infraestructura 3D isométrica, conexiones
luminosas y partículas simbólicas escaladas. Textos explicativos en español.

Cinco etapas de seis segundos:

1. Red de usuarios concurrentes; contador 1 000 → 10 000 → 50 000 → 100 000;
   convergencia de solicitudes hacia API GATEWAY. Texto: «¿100 000 usuarios al
   mismo tiempo?». Distinguir usuarios activos de solicitudes por segundo.
2. Servicio y base de datos. Entrada ilustrativa de 20 000 req/s frente a
   capacidad de 5 000 req/s. Cola limitada, aumento de latencia, ámbar y rojo,
   timeouts y errores. Texto: «Más tráfico no significa más capacidad».
3. RATE LIMITING según una política, con HTTP 429; LOAD SHEDDING ante presión
   de recursos, con rechazo por sobrecarga. Rechazos diferentes y visibles;
   recuperación gradual. Texto: «Controlar la carga para proteger el sistema».
4. LOAD BALANCER distribuye entre tres instancias ya disponibles. AUTOSCALING
   solicita una cuarta, que pasa de iniciando a lista antes de recibir tráfico.
   Conservar la protección. Texto: «Distribuir tráfico y escalar capacidad».
5. Arquitectura completa: clientes → gateway → balanceador → servicios → base
   de datos. Monitoreo ilustrativo de throughput, p95, salud y sobrecarga.
   Excedentes continúan rechazándose. Título: «100 000 USUARIOS. ¿TU SISTEMA ESTÁ
   PREPARADO?», subtítulo «Alta concurrencia y resiliencia», sostenidos al menos
   cuatro segundos.

La base de datos también tiene límites; balanceo no crea servidores y escalar
no garantiza resolver un cuello compartido. No mostrar éxito del 100 % ni una
garantía universal de disponibilidad. La estabilidad requiere carga admitida
dentro de capacidad disponible.

Música electrónica original: crecimiento 0–8 s, tensión 8–17 s y recuperación
17–30 s. Sin narración. Efectos sincronizados de solicitudes, rechazo, saturación,
protección, distribución, ensamblaje, readiness y resolución. −14 LUFS y pico
verdadero máximo −1 dBTP.

Seguir AGENTS.md y skills: storyboard → timeline → simulación pura en tiempo →
revisión de fotogramas y transiciones → sonido → render y verificación → gallery.
Mantener coherencia espacial y legibilidad móvil; evitar acciones simultáneas,
escalamiento instantáneo, cola infinita, métricas presentadas como mediciones
reales, partículas sin significado o efectos que oculten la explicación.

## Instrucción adicional del usuario

«Antes, siempre tiene que salir en algún lugar farix.romero que es mi trademark».
La firma exacta se conserva visible durante toda la pieza, en el margen seguro.

## Ajuste solicitado

Igualar farix.romero al estilo aprobado de CI/CD (JetBrains Mono 400, 19 px, #9db3ce, tracking .19em, top 66 y right 70). Suavizar el salto de notas innecesario entre los segundos 2 y 3 de la música.
