# Home: esfera azul y etapas con scroll

## Integración en tu proyecto actual

Copia el contenido de `home/` dentro de `src/modules/home/`, conservando los demás módulos del proyecto. El archivo `views/HomeView.vue` ya usa `SphereJourney`. Mantén la ruta `/mapa` definida en tu router.

Si faltan dependencias: `npm install three gsap`. Vue 3 y Vue Router se utilizan desde el proyecto existente. Esta entrega es un módulo; no contiene un proyecto Vite nuevo.

## Cambios de esta versión

- Fondo blanco en Home y el recorrido; canvas transparente.
- Esfera azul generada en código, con iluminación y reflejos de estudio. No requiere GLB, imágenes ni texturas descargadas.
- Ruta visible y cerrada: la última parte conecta suavemente con el inicio. Se completa un circuito a lo largo del recorrido.
- Navegación siempre a la izquierda, también en móvil. En móvil se muestran números con el nombre completo accesible.
- Enlace `Ir al mapa` permanente dentro del panel sticky: lleva directamente a `/mapa`. El enlace no desplaza al final del Home.
- Eliminado el bloque inferior con el botón duplicado del mapa. Los componentes originales TrenAnimation y MagneticButton permanecen disponibles para otros usos.
- Textos alternados izquierda/derecha en escritorio, con entrada de abajo hacia arriba. En móvil se ubican debajo de la esfera.
- Se respetan el espacio configurado de la barra de navegación y el final del recorrido, sin fijar el canvas sobre el footer.

## Archivos modificados o agregados

- `views/HomeView.vue`: integración y fondo blanco; se elimina el acceso duplicado inferior.
- `components/SphereJourney.vue`: título y área de escena separados para evitar superposición; altura automática según etapas.
- `components/StageNavigation.vue`: navegación izquierda y RouterLink al mapa.
- `components/StageContent.vue`: entrada vertical de cada etapa y adaptación a móvil.
- `composables/useScrollStages.js`: navegación entre etapas, sin la función goToMap.
- `composables/useJourneyScene.js`: esfera azul, rotación con scroll y carga opcional de GLB.
- `config/journeyConfig.js`: apariencia, ruta del mapa, iluminación y opciones del recorrido.
- `utils/journeyPath.js`: puntos y cierre de la curva.
- `utils/createBlueSphere.js`: nuevo generador de la esfera azul.

El contenido original de `data/stages.json` se conserva.

## Agregar etapas

Edita `data/stages.json`. Cada etapa necesita un `id` único y un `titulo`. `texto1` y `texto2` son opcionales:

```json
{
  "id": "etapa-4",
  "titulo": "Nueva etapa",
  "texto1": "Primer párrafo.",
  "texto2": "Segundo párrafo opcional."
}
```

El menú, el contador, la altura de scroll y la distribución de las etapas se ajustan a la cantidad del JSON. El circuito se conserva cerrado para cualquier cantidad. Las etapas se distribuyen por el mismo circuito; la última vuelve a la posición inicial. Una única etapa permanece fija. Con muchas etapas el listado izquierdo tiene scroll propio, mientras el enlace del mapa se conserva visible.

El JSON se importa desde el módulo como en la versión recibida: modificarlo requiere recompilar para producción.

## Ajustes principales en config/journeyConfig.js

- `model.color`: azul de la esfera.
- `model.radius` y escalas: tamaño.
- `model.rotate`: activa o desactiva la rotación.
- `model.rotationMode`: `'scroll'` por defecto; `'time'` para giro continuo.
- `journey.scrollVhPerStage`: distancia de scroll entre etapas.
- `journey.showPath`: mostrar u ocultar la línea del recorrido.
- `journey.closed`: mantener en `true` para cerrar la curva.
- `layout.mapRoute`: destino directo de RouterLink (`'/mapa'`).
- `layout.navbarDesktopPx`, `navbarTabletPx`, `navbarMobilePx`: altura real de tu navbar.

Los puntos del recorrido se editan en `utils/journeyPath.js`. No repitas el primero al final: Three.js genera el cierre.

## Usar un GLB en el futuro

Cambia `model.type` a `'glb'` y `model.path` a la ruta de tu archivo dentro de `public/models/`. `useGltfModel.js` se conserva. Para un tren, utiliza `rotate: false` y `followTangent: true`; ajusta `forwardAxis` y `rotationOffsetDegrees` según la orientación del modelo.

## Estilos, accesibilidad y rendimiento

Los estilos están en cada componente y no cambian globalmente los colores del proyecto. Las animaciones de texto y movimientos adicionales respetan `prefers-reduced-motion`. El panel tiene foco de teclado y scroll interno si el texto no cabe; los enlaces y botones conservan nombres accesibles. Los recursos WebGL y los listeners se liberan al abandonar Home. El renderer deja de animar fuera de pantalla y cuando termina de alcanzar el scroll, salvo que se elija giro continuo.

No pongas `overflow: hidden/auto` en ancestros del recorrido: puede impedir que funcione `position: sticky`. El botón permanece visible mientras se recorre la sección, y sale con ella antes del footer.
