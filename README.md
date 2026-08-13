# DIAMA Dungeon — CDMX Quest

Juego web estático de Team DIAMA. No necesita instalación, compilación
ni dependencias externas.

## Ejecutarlo localmente

Por las restricciones de audio de algunos navegadores, se recomienda abrir la
carpeta con un servidor local:

```bash
python -m http.server 8080
```

Después abre `http://localhost:8080`.

## Subirlo a GitHub Pages

1. Sube todo el contenido de esta carpeta a la raíz de un repositorio.
2. En GitHub abre **Settings → Pages**.
3. Selecciona **Deploy from a branch**.
4. Elige la rama principal y la carpeta raíz.

No cambies las mayúsculas o rutas dentro de `assets/` sin actualizar
`game.js`.

## Controles

- WASD o flechas: mover.
- Espacio o Z: atacar.
- E o X: interactuar.
- En celular: joystick táctil, A y B. Apoya el dedo en cualquier parte del
  joystick y arrástralo; también acepta diagonales.
- El joystick favorece las cuatro direcciones principales para que caminar
  recto sea preciso; las diagonales se activan cerca de sus ángulos naturales.
- Se puede caminar mientras se ataca.

## Música

- CAPARROSO — Ready
- CAPARROSO — Phantoms
- CAPARROSO — DK (Y2K)

Los tres discos se encuentran dentro del recorrido principal y la colección
queda guardada en el navegador. El reproductor permite reproducir, pausar,
adelantar o retroceder diez segundos, mover la línea de tiempo y cambiar entre
los discos ya encontrados. En celular, el reproductor se minimiza
automáticamente a una pestaña compacta fuera del monitor y puede abrirse o
cerrarse manualmente.

## Fragmentos y créditos

Hay ocho Fragmentos DIAMA animados escondidos a lo largo del recorrido. Al
reunirlos se desbloquea la pantalla de créditos y agradecimientos de Team DIAMA.

Los cristales del cuarto 3 se consumen al activar correctamente la secuencia y
reaparecen si el jugador falla. Los cristales, la llave, los discos, los
fragmentos, las cápsulas de energía y el cofre tienen colisión física.

## Modo casual

- El jugador tiene tres puntos de energía.
- La espada tiene alcance amplio y golpea durante toda su animación.
- Los enemigos detectan al jugador a menor distancia.
- Los núcleos del cuarto 2 pueden empujarse incluso si aún quedan enemigos.
- Hay cuatro cápsulas de corazón que restauran un punto.
- Morir conserva llaves, discos, enemigos derrotados y puzles completados.
- **Continuar** reaparece al jugador al inicio del cuarto actual.

## Reveal final

Al abrir el cofre se desbloquea **DIAMA Penthouse**, programado para el
**22 de agosto de 2026** en Ciudad de México.

## Ambiente

`CAPARROSO — DkAmbience (DiamaDungeon)` se reproduce durante todo el recorrido
con un fundido cruzado muy breve al reiniciarse. Cuando suena un DIAMA Disc, el
ambiente se silencia por completo; al pausar o terminar la canción, regresa
a su nivel normal. Para asegurar este comportamiento en Safari móvil, el audio
ambiental se pausa físicamente mientras se reproduce cualquier disco.
Al cambiar de pestaña, bloquear el teléfono o salir de Safari, todos los audios
se detienen para impedir reproducción en segundo plano.

El exterior del monitor incluye frecuencias y señales DIAMA animadas. En
teléfonos se usa una cantidad reducida para conservar el rendimiento.
En teléfonos y tabletas, la orientación vertical usa una interfaz de consola
portátil: monitor 16:9 arriba y controles abajo. No obliga a girar el equipo,
por lo que también funciona dentro del navegador de Instagram. En horizontal,
el monitor conserva su proporción y deja los controles táctiles a los lados.
La interfaz toma el tamaño del área realmente visible para no quedar debajo de
las barras de Safari o Instagram. El botón **Pantalla** solicita pantalla
completa cuando el navegador lo permite. Si Instagram limita esa función, la
portada muestra instrucciones y un botón para copiar el enlace.
