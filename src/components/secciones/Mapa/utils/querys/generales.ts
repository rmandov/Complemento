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
  metropoli:"METROPOLI"
};
