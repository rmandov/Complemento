import { SelectOption } from "../../forms/SelectInputBusqueda.vue";
import { Entidad_federativaInterface, MunicipioInterface, query } from "../duckdb";

/**Función para traer los estados de la db */
export async function consultarEntidadesFed():Promise<SelectOption[]> {
  const querySql: string = `SELECT * FROM entidades_federativas order by id_entidad_federativa`;

  const respuesta = await query<Entidad_federativaInterface>(querySql);

  return respuesta.map((i) => ({
    value: Number(i.id_entidad_federativa),
    label: i.entidad_federativa,
  }));
}

/**Función para traer los municipios de un estado de la db*/
export async function consultarMunicipios(id_entidad_fed: number | null):Promise<SelectOption[] | null> {
  if (id_entidad_fed) {
    const querySql: string = `SELECT * FROM municipios WHERE id_entidad_federativa = ? order by municipio`;

    const respuesta = await query<MunicipioInterface>(querySql, [id_entidad_fed]);

    return respuesta.map((i) => ({
      value: Number(i.id_municipio),
      label: i.municipio,
    }));
  } else {
    return null;
  }
}
