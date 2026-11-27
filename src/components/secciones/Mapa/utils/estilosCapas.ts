export const estiloEF: L.PathOptions = {
  weight: 1.2,
  fillOpacity: 1,
  color: '#004D2B',
  opacity: 1,
  dashArray: "10, 5",
  lineCap: "round",
};

export const estiloEFSeleccionado: L.PathOptions = {
  fillOpacity: 0,
  opacity: 0,
};
export const estiloEFHover: L.PathOptions = {
  fillOpacity: 0.5,
};

export const estiloMun: L.PathOptions = {
  color: "rgb(254, 178, 92)",
  weight: 1,
  fillOpacity: 0.2,
  opacity: 1,
  fillColor: "rgb(248, 204, 58)",
};

export const estiloMunSeleccionado: L.PathOptions = {
  fillOpacity: 0,
  opacity: 0,
};
export const estiloMunHover: L.PathOptions = {
  fillOpacity: 0.8,
};

export const estilosTooltip:L.TooltipOptions = {
  direction: "auto",
  opacity: 0.9,
  sticky: false,
  interactive: false,
};

export interface ChoroplethColors {
  color: string;
  hover: string;
}

export const getChoroplethColor = (value: number): ChoroplethColors => {
  const scales: { max: number; color: string; hover: string }[] = [
    {max:1, color:"#fafafa",hover:"#ffffff"},
    { max: 10, color: '#E5F5E0', hover: '#C3D0BE' },
    { max: 20, color: '#C7E9C0', hover: '#A9C6A3' },
    { max: 50, color: '#A1D99B', hover: '#89B883' },
    { max: 100, color: '#74C476', hover: '#63A764' },
    { max: 200, color: '#41AB5D', hover: '#37914F' },
    { max: 500, color: '#238B45', hover: '#1E763B' },
    { max: Infinity, color: '#005A32', hover: '#004D2B' }
  ];

  return scales.find(scale => value < scale.max) ?? scales[6];
};
export const clasificacionColores: Record<string, ClassificationStyle> = {
  "Agropecuaria": {
    normal: "#DD7A2C",
    hover: "#F6A65C",
    icon: "agriculture",
  },
  "Agua": {
    normal: "#2563EB",
    hover: "#60A5FA",
    icon: "water_drop",
  },
  "Cultura": {
    normal: "#8846B7",
    hover: "#B47BE0",
    icon: "theater_comedy",
  },
  "Economía": {
    normal: "#B9850B",
    hover: "#E6B335",
    icon: "payments",
  },
  "Educación y ciencia": {
    normal: "#5F54C7",
    hover: "#948AEB",
    icon: "school",
  },
  "Energía": {
    normal: "#D63E3E",
    hover: "#F36F69",
    icon: "bolt",
  },
  "Gobierno y seguridad": {
    normal: "#5D647A",
    hover: "#939DB6",
    icon: "account_balance",
  },
  "Infraestructura vial": {
    normal: "#2B73A7",
    hover: "#67A5D5",
    icon: "road",
  },
  "Medio ambiente": {
    normal: "#B24BA0",
    hover: "#D77DC6",
    icon: "eco",
  },
  "Salud": {
    normal: "#D73382",
    hover: "#F173B3",
    icon: "health_and_safety",
  },
  "Servicios": {
    normal: "#C85C3E",
    hover: "#ED8C6C",
    icon: "volunteer_activism",
  },
  "Telecomunicaciones": {
    normal: "#4A82C1",
    hover: "#79B2EB",
    icon: "cell_tower",
  },
  "Territorio": {
    normal: "#926044",
    hover: "#C38F6F",
    icon: "map",
  },
  "Transporte público y comercial": {
    normal: "#3F4EA4",
    hover: "#7987DC",
    icon: "local_shipping",
  },
  "Turismo": {
    normal: "#E26589",
    hover: "#F598B2",
    icon: "travel",
  },
};
export interface ClassificationStyle  {
  normal: string;
  hover: string;
  icon: string;
};
