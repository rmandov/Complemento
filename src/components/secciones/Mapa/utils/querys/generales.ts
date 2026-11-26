import { Filtros } from "../../ViewMapa.vue";

export interface ResultadoFiltros {
  where: string;
  params: unknown[];
}

export function generarFiltros(
  filtros: Filtros
): ResultadoFiltros {

  const condiciones: string[] = [];
  const params: unknown[] = [];

  for (const [filtro, valor] of Object.entries(filtros)) {

    if (
      valor === undefined ||
      valor === null ||
      valor === ''
    ) continue;

    const columna = columnas[filtro as keyof Filtros];

    if (!columna) continue;

    if (Array.isArray(valor)) {
      if (!valor.length) continue;

      condiciones.push(
        `${columna} IN (${valor.map(() => '?').join(', ')})`
      );

      params.push(...valor);

    } else {
      condiciones.push(`${columna} = ?`);
      params.push(valor);
    }
  }

  return {
    where: condiciones.length
      ? ` AND ${condiciones.join(' AND ')}`
      : '',
    params
  };
}
const columnas: Partial<Record<keyof Filtros, string>> = {
  id_ef: 'ID_EF',
  id_municipio: 'ID_MUN',
  fase: 'FASE',
  tipo3_PPI:"TIPO3_PPI",
  estatus:"ESTATUS_OPERACION",
  region:"REGION",
  metropoli:"METROPOLI",
  ramo:"RAMO",
  unidad:"UNIDAD",
  fecha_inicio:"FECHA_INICIO_CAL_FF",
  fecha_final:"FECHA_FIN_CAL_FF",
  monto_total:"MONTO_TOTAL_INVERSION",

};
export const formatearMoneda = (valor: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(valor);
};
export function descargarCSV<T extends Record<string, any>>(
  data: T[],
  filename: string = 'export.csv'
): void {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';

    const stringValue = String(value);

    // Escapar comillas y envolver valores que lo necesiten
    if (/[",\n\r]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...data.map(row =>
      headers.map(header => escapeCSV(row[header])).join(',')
    )
  ].join('\r\n');

  // BOM para compatibilidad con Excel
  const blob = new Blob(
    ['\uFEFF' + csvContent],
    { type: 'text/csv;charset=utf-8;' }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
