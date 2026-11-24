import { Filtros } from "../../ViewMapa.vue";
import { PPI, query } from "../duckdb";
import { generarFiltros } from "./generales";

/**Función para traer el total de ppi*/
export async function contarTotal(filtros: Filtros): Promise<ContarTotal> {
  const filtrar = generarFiltros(filtros);

  const querySql: string = `SELECT COUNT(*) AS total
FROM ppi WHERE 1 = 1 ${filtrar.where};
`;

  const respuesta = await query<ContarTotal>(querySql, filtrar.params);
  return {
    total: parseInt(respuesta[0].total.toString()),
  };
}

/**Función para traer el top 3 de ppi*/
export async function calcularTop3(filtros: Filtros): Promise<CalcularTop3[]> {
  const filtrar = generarFiltros(filtros);

  const querySql: string = `SELECT CLASIFICACION, COUNT(*) AS total
FROM ppi
WHERE CLASIFICACION IS NOT NULL ${filtrar.where}
GROUP BY CLASIFICACION
ORDER BY total DESC
LIMIT 3;
`;

  const respuesta = await query<CalcularTop3>(querySql, filtrar.params);
  return respuesta;
}

/**Función para traer los proyectos*/
export async function calcularProyectos(): Promise<PPI[]> {
  const querySql: string = `
`;

  const respuesta = await query<PPI>(querySql);
  return respuesta;
}

export async function obtenerPPIFIltro(filtros: Filtros): Promise<PPI[]> {
  const filtrar = generarFiltros(filtros);
  const querySql: string = `SELECT * FROM PPI WHERE 1 = 1  ${filtrar.where}`;
  console.log(querySql, filtrar.params);

  const respuesta = await query<PPI>(querySql, filtrar.params);
  return respuesta;
}
export async function obtenerEstatus(): Promise<ListaEstatus[]> {
  const querySql: string = `SELECT DISTINCT ESTATUS_OPERACION FROM PPI ORDER BY ESTATUS_OPERACION ASC`;
  const respuesta = await query<ListaEstatus>(querySql);
  return respuesta;
}

export async function obtenerEF(): Promise<ListaEF[]> {
  const querySql: string = `SELECT DISTINCT ID_EF, EF FROM PPI ORDER BY ID_EF ASC`;
  const respuesta = await query<ListaEF>(querySql);
  return respuesta;
}
export async function obtenerMunicipios(id:string): Promise<ListaMunicipio[]> {
  const querySql: string = `SELECT DISTINCT  ID_EF, ID_MUN, MUN  FROM PPI WHERE ID_EF = ? ORDER BY MUN ASC `;
  const respuesta = await query<ListaMunicipio>(querySql, [id]);
  return respuesta;
}
export async function obtenerRegiones(): Promise<ListaRegiones[]> {
  const querySql: string = `SELECT DISTINCT REGION FROM PPI ORDER BY REGION ASC`;
  const respuesta = await query<ListaRegiones>(querySql);
  return respuesta;
}
export async function obtenerMertropolis(): Promise<ListaMetropolis[]> {
  const querySql: string = `SELECT DISTINCT METROPOLI FROM PPI ORDER BY METROPOLI ASC`;
  const respuesta = await query<ListaMetropolis>(querySql);
  return respuesta;
}

export interface ContarTotal {
  total: number;
}
export interface CalcularTop3 {
  CLASIFICACION: string;
  total: number;
}
export interface ListaEstatus {
  ESTATUS_OPERACION: string;
}
export interface ListaEF {
  EF: string;
  ID_EF: string;
}
export interface ListaMunicipio {
  MUN: string;
  ID_MUN: string;
}
export interface ListaRegiones {
  REGION: string;
}
export interface ListaMetropolis {
  METROPOLI: string;
}
