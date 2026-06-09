/**
 * Encapsula toda la lógica visual de Leaflet.
 * Recibe un objeto de configuración para tooltips, estilos y eventos.
 */
export class ProyectoRenderer {
  constructor(config = {}) {
    this.config = {
      // Campo del tooltip (puedes cambiarlo sin tocar el renderer)
      tooltipField: config.tooltipField || "RAMO_DESC",
      tooltipFallback: config.tooltipFallback || "Proyecto",

      // Estilos por categoría (RAMO_DESC)
      estilosPorCategoria: config.estilosPorCategoria || {},

      // Estilo por defecto
      estiloBase: config.estiloBase || {
        radius: 6,
        fillColor: "#2980b9",
        color: "#1a5276",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
      },

      // Callback opcional al hacer clic
      onClick: config.onClick || null,
    };
  }

  crearCapa(features) {
    return L.geoJSON(features, {
      pointToLayer: (feature, latlng) => {
        const estilo = this._resolverEstilo(feature);
        return L.circleMarker(latlng, estilo);
      },

      onEachFeature: (feature, layer) => {
        // Tooltip dinámico desde configuración
        const texto = feature.properties?.[this.config.tooltipField] || this.config.tooltipFallback;
        layer.bindTooltip(texto, {
          direction: "top",
          offset: [0, -10],
          className: "proyecto-tooltip",
        });

        // Evento de clic delegado
        if (this.config.onClick) {
          layer.on("click", () => this.config.onClick(feature, layer));
        }
      },
    });
  }

  _resolverEstilo(feature) {
    const categoria = feature.properties?.RAMO_DESC || "default";
    const estiloCategoria = this.config.estilosPorCategoria[categoria];
    return { ...this.config.estiloBase, ...estiloCategoria };
  }
}
