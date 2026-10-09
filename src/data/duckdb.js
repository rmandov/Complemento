// src/data/duckdb.js

import * as duckdb from "@duckdb/duckdb-wasm";

let db = null;
let conn = null;
let initPromise = null;

// =====================================================
// CONFIGURACIÓN DE TABLAS
// =====================================================

const DATASETS = [
  {
    table: "ppi",
    file: "BD_PPI_OPA.csv.gz",
    encoding: "latin-1",
  },
  {
    table: "cat_edo",
    file: "CAT_EDO.csv",
    encoding: "utf-8",
  },
  {
    table: "cat_mun",
    file: "CAT_MUN.csv",
    encoding: "utf-8",
  },
  {
    table: "dim_claveppi",
    file: "DIM_CLAVEPPI.csv",
    encoding: "utf-8",
  },
  {
    table: "dim_edo",
    file: "DIM_EDO.csv",
    encoding: "utf-8",
  },
  {
    table: "dim_mun",
    file: "DIM_MUN.csv",
    encoding: "utf-8",
  },
  {
    table: "dim_ramour",
    file: "DIM_RAMOUR.csv",
    encoding: "utf-8",
  },
  {
    table: "dim_sin_edo",
    file: "DIM_SIN_EDO.csv",
    encoding: "utf-8",
  },
];

// =====================================================
// CARGAR UN CSV EN DUCKDB
// =====================================================

async function loadCSV(tableName, fileName, encoding = "utf-8") {
  const baseURL = import.meta.env.BASE_URL;

  const csvUrl = `${baseURL}data/${fileName}`.replace(/\/+/g, "/");

  console.log(`Cargando: ${fileName}`);

  // ---------------------------------------------------
  // Descargar archivo
  // ---------------------------------------------------

  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error(`Error cargando ${fileName}: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();

  const bytes = new Uint8Array(buffer);

  // ---------------------------------------------------
  // Detectar si realmente sigue comprimido como GZIP
  // ---------------------------------------------------

  // Un GZIP comienza con:
  // 0x1F 0x8B

  const isGzip = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;

  /*
   * Puede ocurrir que el servidor entregue:
   *
   * BD_PPI_OPA.csv.gz
   *
   * pero debido a Content-Encoding el navegador ya
   * lo haya descomprimido.
   *
   * En ese caso NO debemos registrarlo como .gz.
   */

  const virtualFile = isGzip ? `duckdb_${fileName}` : `duckdb_${fileName.replace(/\.gz$/i, "")}`;

  console.log({
    file: fileName,
    table: tableName,
    encoding,
    isGzip,
    virtualFile,
    contentEncoding: response.headers.get("content-encoding"),
  });

  try {
    // -------------------------------------------------
    // Registrar archivo temporal dentro de DuckDB
    // -------------------------------------------------

    await db.registerFileBuffer(virtualFile, bytes);

    // -------------------------------------------------
    // Crear tabla
    // -------------------------------------------------

    await conn.query(`
      CREATE TABLE IF NOT EXISTS "${tableName}" AS

      SELECT *
      FROM read_csv_auto(
        '${virtualFile}',
        encoding = '${encoding}',
        header = true
      );
    `);

    console.log(`Tabla creada correctamente: ${tableName}`);
  } finally {
    // -------------------------------------------------
    // Eliminar archivo temporal
    // -------------------------------------------------

    try {
      await db.dropFile(virtualFile);
    } catch (error) {
      console.warn(`No se pudo eliminar el archivo temporal ${virtualFile}`, error);
    }
  }
}

// =====================================================
// INICIALIZAR DUCKDB
// =====================================================

export async function initDB() {
  // DuckDB ya está inicializado
  if (db && conn) {
    return {
      db,
      conn,
    };
  }

  // Ya existe una inicialización en proceso
  if (initPromise) {
    return await initPromise;
  }

  initPromise = (async () => {
    try {
      // ===============================================
      // 1. Seleccionar bundle de DuckDB
      // ===============================================

      const bundles = duckdb.getJsDelivrBundles();

      const bundle = await duckdb.selectBundle(bundles);

      // ===============================================
      // 2. Crear Web Worker
      // ===============================================

      const workerResponse = await fetch(bundle.mainWorker);

      if (!workerResponse.ok) {
        throw new Error(`No se pudo cargar el Worker de DuckDB`);
      }

      const workerText = await workerResponse.text();

      const workerBlob = new Blob([workerText], {
        type: "application/javascript",
      });

      const workerUrl = URL.createObjectURL(workerBlob);

      const worker = new Worker(workerUrl);

      URL.revokeObjectURL(workerUrl);

      // ===============================================
      // 3. Crear DuckDB
      // ===============================================

      const logger = new duckdb.ConsoleLogger();

      db = new duckdb.AsyncDuckDB(logger, worker);

      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

      // ===============================================
      // 4. Crear conexión
      // ===============================================

      conn = await db.connect();

      // ===============================================
      // 5. Cargar todas las tablas
      // ===============================================

      for (const dataset of DATASETS) {
        await loadCSV(dataset.table, dataset.file, dataset.encoding);
      }

      console.log("DuckDB inicializado correctamente");

      console.log(
        "Tablas cargadas:",
        DATASETS.map((dataset) => dataset.table),
      );

      return {
        db,
        conn,
      };
    } catch (error) {
      console.error("Error inicializando DuckDB:", error);

      // Si falla la inicialización,
      // permitimos volver a intentarlo posteriormente.
      db = null;
      conn = null;
      initPromise = null;

      throw error;
    }
  })();

  return await initPromise;
}

// =====================================================
// EJECUTAR QUERY
// =====================================================

export async function query(sql) {
  if (!sql || typeof sql !== "string") {
    throw new Error("La consulta SQL no es válida");
  }

  const { conn } = await initDB();

  return await conn.query(sql.trim());
}
