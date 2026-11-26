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
