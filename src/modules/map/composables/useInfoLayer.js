// composables/useMapControl.js
import L from "leaflet";

export function useInfoLayer() {
  // Crear el control personalizado
  const infoLayer = L.control({ position: "bottomleft" });

  // Referencias a los elementos del DOM
  let cuadradoDiv = null;
  let descripcionDiv = null;

  infoLayer.onAdd = function () {
    // Contenedor principal
    const container = L.DomUtil.create("div", "container_bl");

    // Cuadrado (título)
    cuadradoDiv = L.DomUtil.create("div", "cuadrado", container);
    cuadradoDiv.innerHTML = "Título";

    // Descripción
    descripcionDiv = L.DomUtil.create("div", "descripcion", container);
    descripcionDiv.innerHTML =
      "Lorem ipsum dolor sit amet consectetur, adipisicing elit. In obcaecati aliquam porro culpa dignissimos, exercitationem quam. Illum cumque perspiciatis asperiores maxime aliquam laborum qui impedit neque, corrupti veritatis, aut molestiae?";
    return container;
  };

  // Función pública para actualizar la descripción
  const updateDescription = (htmlContent) => {
    if (descripcionDiv) {
      descripcionDiv.innerHTML = htmlContent;
    }
  };

  // Función para actualizar el título
  const updateTitle = (titleText) => {
    if (cuadradoDiv) {
      cuadradoDiv.innerHTML = titleText;
    }
  };

  // Función para resetear a contenido por defecto
  const resetDescription = () => {
    updateTitle("Title reset");
    updateDescription(
      "Lorem ipsum dolor sit amet consectetur, adipisicing elit. In obcaecati aliquam porro culpa dignissimos, exercitationem quam. Illum cumque perspiciatis asperiores maxime aliquam laborum qui impedit neque, corrupti veritatis, aut molestiae?",
    );
  };

  return {
    infoLayer, // la instancia del control (para añadir al mapa)
    updateDescription, // método para cambiar el contenido
    updateTitle, // método para cambiar el título
    resetDescription, // resetear a texto largo por defecto
  };
}
