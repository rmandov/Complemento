# Home 3D con etapas dinámicas (Vue 3 + Three.js)

Paquete de integración para el módulo `home` enviado en `home.zip`. **No es un proyecto Vue autónomo**: el ZIP original no incluye `package.json`, `App.vue`, router ni navbar/footer. Aquí se conservan los componentes originales del módulo y se incorpora una nueva experiencia modular.

## Instalación

1. Copia el contenido de `src/modules/home/` sobre `src/modules/home/` de tu proyecto actual, sustituyendo `views/HomeView.vue` y manteniendo el resto de tus archivos del proyecto. También puedes comparar los cambios antes de integrar.
2. Copia `public/models/sphere.glb` a la misma ruta de la **raíz** de tu proyecto Vite. No lo coloques en `src/assets`.
3. Verifica que existan las dependencias `vue`, `vue-router`, `three` y `gsap`. Si falta alguna: `npm install three gsap` (Vue y Vue Router ya deberían existir en el proyecto original).
4. Arranca normalmente con `npm run dev`. Vite resuelve el alias `@` a `src` como en el proyecto existente.
5. Asegura que la altura del navbar sea la indicada en `src/modules/home/config/journeyConfig.js` o ajústala a tu layout real. No se incluyeron los archivos del navbar y footer en el ZIP suministrado, así que no fue posible medirlos ni modificarlos.

> IMPORTANTE: El archivo `HomeView.vue` original estaba usando `ScrollSphere.vue`, que dibujaba una esfera con `SphereGeometry`, creaba un canvas `position: fixed` y añadía `min-height: 500vh`. La nueva integración reemplaza esa **invocación**. Se retiran del paquete actualizado los archivos antiguos `ScrollSphere.vue`, `useSphereScene.js` y `utils/spherePath.js`, que ya no son necesarios; si necesitas consultarlos, permanecen en el ZIP original que compartiste.

## Funcionamiento general

1. `SphereJourney.vue` importa **todas** las etapas desde `data/stages.json`.
2. `useScrollStages.js` crea un único ScrollTrigger asociado a esa sección: el progreso `0..1` se transforma en el índice de etapa activa (`0..N-1`).
3. **El mismo estado** `progress` alimenta el componente de contenido, la navegación lateral y `useJourneyScene.js`.
4. `useJourneyScene.js` carga un `.glb` con `GLTFLoader`, monta una escena única de Three.js y mueve el modelo por la curva `CatmullRomCurve3` de `utils/journeyPath.js`.
5. La sección es alta según las etapas; solo el contenedor de la experiencia es `sticky`. El canvas **no** tiene `position: fixed`: abandona el viewport antes de las otras secciones y del footer.
6. La curva es cerrada, pero el recorrido por scroll **no es infinito**: etapa 1 se asigna a `t=0`, la última a `t=(N-1)/N`; el último tramo que regresa al principio queda reservado para cerrar geométricamente la curva, sin teletransportación del scroll.

## Estructura de archivos

```text
src/modules/home/
  views/HomeView.vue                 Integración con el Home y #map-section
  components/SphereJourney.vue      Contenedor sticky y estado compartido
  components/StageNavigation.vue    Barra izquierda / menú compacto móvil
  components/StageContent.vue       Título y textos, con transición suave
  composables/useScrollStages.js    ScrollTrigger, progreso, saltos y mapa
  composables/useJourneyScene.js    Escena, renderer, cámara, ruta, animación
  composables/useGltfModel.js       Carga y liberación del GLB
  config/journeyConfig.js           Configuración principal
  data/stages.json                  Datos de todas las etapas
  utils/journeyPath.js              Puntos 3D y distribución de etapas
public/models/sphere.glb            Modelo externo incluido en la entrega
```

Se conservan los demás componentes y composables originales del archivo recibido, excepto el prototipo antiguo de la esfera, que se sustituye por la implementación basada en GLB.

## Agregar nuevas etapas / cambiar textos

Edita solo `src/modules/home/data/stages.json` y añade otro elemento (IDs únicos):

```json
{
  "id": "etapa-4",
  "titulo": "Etapa 4",
  "texto1": "Descripción principal",
  "texto2": "Descripción complementaria"
}
```

Al guardar, se actualizarán automáticamente las posiciones distribuidas en la misma curva, la extensión del scroll, la navegación, el índice activo y el texto. **No** tienes que agregar geometría, nuevas animaciones ni botones en Vue. El orden del arreglo determina el orden del recorrido. Si dejas el arreglo vacío, se mostrará un aviso en lugar de navegación.

## Cambiar el modelo 3D (esfera por tren)

1. Coloca `train.glb` en `public/models/`.
2. En `src/modules/home/config/journeyConfig.js` modifica:

```js
model: {
  path: `${import.meta.env.BASE_URL}models/train.glb`,
  scale: 1,
  mobileScale: 0.77,
  tabletScale: 0.88,
  rotate: false,          // detener rotación sobre su propio eje
  rotationSpeed: 0.42,
  followTangent: true,    // orientar el tren según la tangente de la vía
  forwardAxis: [0, 0, 1], // dirección frontal local del modelo
  rotationOffsetDegrees: [0, 0, 0],
},
```

`rotate` (rotación propia) y `followTangent` (orientación de marcha) son independientes. El desplazamiento por el recorrido seguirá funcionando aunque `rotate: false`. Si el tren camina de costado o en reversa, prueba `forwardAxis: [0, 0, -1]` o ajusta `rotationOffsetDegrees`, según el eje del GLB original. La curva se dibuja como **línea guía**, no hay rieles físicos en esta versión; si después necesitas traviesas y vías, puedes generar su geometría a partir de la misma curva.

Todos los GLB se centran y normalizan a un tamaño base; posteriormente se aplica `model.scale`. Por eso el cambio no depende del tamaño original exportado desde Blender. Para animaciones internas incluidas en un GLB (por ejemplo ruedas de tren), se necesitaría incorporar un `AnimationMixer`; las animaciones de GLB no se reproducen automáticamente en esta implementación.

## Modificar el recorrido

En `utils/journeyPath.js`, cambia `JOURNEY_PATH_POINTS`:

```js
[0.66, 0.25, 0.15] // [X proporcional, Y proporcional, Z en unidades 3D]
```

`X` crece hacia la derecha, `Y` hacia arriba y `Z` se acerca a la cámara. Se recomiendan al menos cuatro puntos para un bucle visual suave. La función `createJourneyPath()` construye una única curva cerrada; `journeyCurveProgress()` reparte N paradas dentro de ella. No añadas paradas individuales a la curva cuando cambie el JSON: se distribuirán automáticamente. Puedes ocultar la línea guía con `journey.showPath: false`.

## Cambiar velocidades

En `config/journeyConfig.js`:

- `model.rotationSpeed`: velocidad propia de rotación del modelo en **radianes por segundo**. `0` la detiene; `rotate: false` la desactiva.
- `journey.scrollVhPerStage`: cantidad de scroll entre etapas en unidades de altura de viewport, por defecto `115`.
- `journey.smoothingSeconds`: tiempo característico para interpolar el movimiento 3D. Aumentarlo lo hace más suave pero más lento para alcanzar el scroll.
- `journey.jumpDurationSeconds`: duración del salto por el menú lateral.
- La aparición del texto se controla en `StageContent.vue`, clases `stage-fade-*`.

## Modificar tamaño y cámara

En `config/journeyConfig.js`:

- `model.scale`, `model.tabletScale`, `model.mobileScale` regulan el tamaño del GLB por dispositivo.
- `camera.fov` cambia el ángulo de visión; `camera.distance` acerca/aleja la cámara.
- `camera.near` y `camera.far` son los planos de recorte; `camera.background` es el color del canvas.
- En `useJourneyScene.js` la cámara inicia en `(0, 0, camera.distance)`; ahí se puede cambiar su orientación si es necesario.
- Como el recorrido se escala según el campo de visión, una variación de FOV o aspect ratio mantiene el camino relativamente contenido en pantalla.

## Barra lateral y botón “Ir al mapa”

La barra se genera con `v-for` usando `stages.json`. La etapa activa se calcula de forma única en `useScrollStages.js`; cada botón ejecuta `goToStage(index)` que anima la posición **real del scroll** y, por lo tanto, el desplazamiento intermedio del GLB. En móviles, los botones se presentan en una tira horizontal desplazable. La navegación admite teclado y anuncia la etapa activa.

El botón **Ir al mapa** no navega a `/mapa`: desplaza hasta `<section id="map-section">` en `HomeView.vue`, donde ya está `TrenAnimation`, y dentro se conserva el `RouterLink` original **Territorio** → `/mapa`. Para cambiar la sección destino, modifica `layout.mapTarget` en `journeyConfig.js` y mueve o renombra el ID correspondiente en `HomeView.vue`.

## Navbar y footer

`SphereJourney.vue` utiliza una posición `sticky` limitada a su propia sección. Respeta el espacio reservado arriba por medio de `layout.navbarDesktopPx` / `navbarTabletPx` / `navbarMobilePx`, que además se usan para definir las posiciones de ScrollTrigger. Ajusta estos valores a la altura **real** de la barra de navegación fija/sticky del proyecto. La sección termina antes del contenido siguiente, por lo que el canvas no se superpone al footer. Evita aplicar `overflow: hidden` o `overflow: auto` a los elementos ancestros del `sticky` (por ejemplo `.home` y wrappers del layout): alteran su comportamiento. También evita aplicar `transform` a los ancestros del sticky cuando no sea necesario.

## Responsive

Los estilos se encuentran en los tres componentes Vue:

- `SphereJourney.vue`: altura usable, redondeo y offsets del navbar. Puntos de corte `1023px` y `767px`.
- `StageNavigation.vue`: menú vertical en desktop y tira horizontal en móviles.
- `StageContent.vue`: panel de información reposicionado y más compacto.
- `useJourneyScene.js`: reajuste de FOV/aspect ratio y escala/modelo según ancho; la curva también se recentra y se eleva para mobile, dejando libre el espacio inferior del texto.

Puedes modificar los umbrales a la estructura de tu sitio. Revisa especialmente el tamaño de pantalla en landscape cuando los textos sean largos.

## Rendimiento y limpieza

- Se utiliza **una sola escena y un solo renderer**, con antialias y límite de pixel ratio (máximo 1.6; móvil 1.25).
- No se vuelve a cargar el modelo al cambiar de etapa.
- El loop de `requestAnimationFrame` solo funciona mientras la sección es visible y exista movimiento o rotación. Si `rotate: false` y el modelo está quieto, se detiene.
- `ResizeObserver` ajusta la cámara. `IntersectionObserver` apaga el render fuera de pantalla.
- Al desmontar se cancelan animaciones, observadores y ScrollTrigger, y se liberan geometrías, materiales y texturas.
- Respeta `prefers-reduced-motion` para omitir desplazamientos animados y rotaciones automáticas.

## Notas sobre el material recibido

- `home.zip` contenía únicamente 29 entradas del módulo original. No incluía `package.json`, `public`, navbar, footer ni el resto del proyecto completo, por lo que no es posible comprobar la integración con esos elementos externos ni compilar el sitio completo únicamente con los archivos recibidos.
- `HomeView.vue` tenía importaciones y carga de JSON de un carrusel actualmente comentado. La nueva vista elimina esa petición que no se usaba, pero **no elimina los archivos originales**; sus secciones se pueden reactivar en `HomeView.vue`.
- La esfera incluida como `sphere.glb` es un modelo simple de ejemplo, no la geometría procedural de Three.js del código antiguo. Puedes sustituirla por tu modelo definitivo sin reescribir la lógica del recorrido.
