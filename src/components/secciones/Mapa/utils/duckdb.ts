// data/duckdb.ts

import * as duckdb from "@duckdb/duckdb-wasm";

interface DuckTableConfig {
  name: string;
  file: string;
  options?: string;
}

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

let initPromise: Promise<{
  db: duckdb.AsyncDuckDB;
  conn: duckdb.AsyncDuckDBConnection;
}> | null = null;

/**
 * En desarrollo:
 *   usa .csv
 *
 * En producción:
 *   usa .csv.gz
 */
function getFilePath(file: string): string {
  //@ts-ignore
  if (import.meta.env.DEV) {
    return file;
  }

  return `${file}.gz`;
}

/**
 * Inicializa DuckDB y crea las tablas configuradas.
 */
export async function initDB(tables: DuckTableConfig[] = []) {
  if (db && conn) {
    return { db, conn };
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    // ---------------------------------------------------------
    // 1. Seleccionar bundle de DuckDB-Wasm
    // ---------------------------------------------------------

    const bundles = duckdb.getJsDelivrBundles();

    const bundle = await duckdb.selectBundle(bundles);

    if (!bundle.mainWorker || !bundle.mainModule) {
      throw new Error("No se encontró un bundle válido de DuckDB-Wasm");
    }

    // ---------------------------------------------------------
    // 2. Crear Worker
    // ---------------------------------------------------------

    const workerScriptResponse = await fetch(bundle.mainWorker);

    if (!workerScriptResponse.ok) {
      throw new Error(
        `No se pudo descargar el Worker de DuckDB: ` + `${workerScriptResponse.status}`,
      );
    }

    const workerScriptText = await workerScriptResponse.text();

    const workerBlob = new Blob([workerScriptText], {
      type: "application/javascript",
    });

    const workerUrl = URL.createObjectURL(workerBlob);

    const worker = new Worker(workerUrl);

    const logger = new duckdb.ConsoleLogger();

    db = new duckdb.AsyncDuckDB(logger, worker);

    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    URL.revokeObjectURL(workerUrl);

    // ---------------------------------------------------------
    // 3. Crear conexión
    // ---------------------------------------------------------

    conn = await db.connect();

    // @ts-ignore
    const baseURL = import.meta.env.BASE_URL;

    // ---------------------------------------------------------
    // 4. Cargar tablas
    // ---------------------------------------------------------

    for (const table of tables) {
      const file = getFilePath(table.file);

      const fileUrl = `${baseURL}${file}`;

      console.log(`[DuckDB] Cargando ${fileUrl}...`);

      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error(`No existe ${file} (${response.status})`);
      }

      // -------------------------------------------------------
      // Desarrollo: CSV normal
      // -------------------------------------------------------
      //@ts-ignore
      if (import.meta.env.DEV) {
        const text = await response.text();

        const virtualFile = file.split("/").pop()!;

        await db.registerFileText(virtualFile, text);

        try {
          await conn.query(`
            CREATE OR REPLACE TABLE ${table.name}
            AS
            FROM read_csv_auto('${virtualFile}');
          `);

          console.log(`[DuckDB] Tabla "${table.name}" creada`);
        } finally {
          await db.dropFile(virtualFile);
        }
      }

      // -------------------------------------------------------
      // Producción: CSV.GZ
      // -------------------------------------------------------
      else {
        const buffer = new Uint8Array(await response.arrayBuffer());

        console.log(`[DuckDB] ${file}: ` + `${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

        const virtualFile = file.split("/").pop()!;

        await db.registerFileBuffer(virtualFile, buffer);

        try {
          await conn.query(`
            CREATE OR REPLACE TABLE ${table.name}
            AS
            FROM read_csv_auto('${virtualFile}');
          `);

          console.log(`[DuckDB] Tabla "${table.name}" creada`);
        } finally {
          await db.dropFile(virtualFile);
        }
      }
    }

    console.log("[DuckDB] Inicialización completada");

    return {
      db,
      conn,
    };
  })();

  try {
    return await initPromise;
  } catch (error) {
    initPromise = null;
    db = null;
    conn = null;

    console.error("[DuckDB] Error inicializando DuckDB:", error);

    throw error;
  }
}

/**
 * Ejecuta una consulta SQL.
 */
export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const { conn } = await initDB(tablas);

  let result;

  if (params.length > 0) {
    const statement = await conn.prepare(sql);

    try {
      result = await statement.query(...params);
    } finally {
      await statement.close();
    }
  } else {
    result = await conn.query(sql);
  }

  return result.toArray().map((row) => ({ ...row })) as T[];
}

/**
 * Archivos base.
 *
 * En DEV:
 *   municipios.csv
 *
 * En BUILD:
 *   municipios.csv.gz
 */
const tablas: DuckTableConfig[] = [
  {
    name: "municipios",
    file: "datos/municipios.csv",
  },

  {
    name: "entidades_federativas",
    file: "datos/entidades_federativas.csv",
  },
  {
    name: "ppi",
    file: "datos/proyectos/BD_PPI_OPA.csv",
  },
];
export interface Entidad_federativaInterface {
  id_entidad_federativa: number;
  entidad_federativa: string;
}
export interface MunicipioInterface {
  id_entidad_federativa: number;
  id_municipio: number;
  municipio: string;
}

export interface PPI {
  ID_PPI_CAML: string;
  ID_PPI: string;
  CC: string;
  CICLO_PND: string | null;

  ID_RAMO: number;
  RAMO: string;

  ID_UR: string;
  UR: string;

  SUBCLASIFICACION: string | null;

  PPI: string;
  DESC_PPI: string | null;
  PP: string | null;

  FASE: string;

  ID_EJE_PND: string | null;
  EJE_PND: string | null;

  ID_OBJ_PND: string | null;
  OBJ_PND: string | null;

  BENEFICIOS: string | null;

  ID_EF: number;
  EF: string;

  ID_MUN: number | null;
  MUN: string | null;

  ID_LOC: number | null;
  LOC: string | null;

  LATITUD: number | null;
  LONGITUD: number | null;

  NIVEL_SEGREGACION: string;
  CLASIFICACION: string;


  TIPO3_PPI: string;
  REGION: string;
  METROPOLI: string;
  ESTATUS_OPERACION: string;


  FECHA_INICIO_CAL_FF:Date;
  FECHA_FIN_CAL_FF:Date;
  MONTO_TOTAL_INVERSION:number;
  BENEFICIOS_ESPERADOS:string;
}
