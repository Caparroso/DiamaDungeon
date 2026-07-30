# DIAMA Dungeon — CDMX Quest

Juego web estático de CAPARROSO para DIAMA. No necesita instalación, compilación
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

## Música

- CAPARROSO — Ready
- CAPARROSO — Phantoms
- CAPARROSO — DK (Y2K)

Los tres discos se encuentran dentro del recorrido principal y la colección
queda guardada en el navegador. El reproductor permite reproducir, pausar,
adelantar o retroceder diez segundos, mover la línea de tiempo y cambiar entre
los discos ya encontrados. En celular, el reproductor se minimiza
automáticamente a una pestaña pequeña en la parte superior y puede abrirse o
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
