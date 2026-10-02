// src/data/duckdb.js

import * as duckdb from "@duckdb/duckdb-wasm";

let db = null;
let conn = null;
let initPromise = null;

const DATASETS = [
  {
    table: "ppi",
    file: "BD_PPI_OPA.csv.gz",
  },
  {
    table: "cat_edo",
    file: "CAT_EDO.csv",
  },
  {
    table: "cat_mun",
    file: "CAT_MUN.csv",
  },
  {
    table: "dim_claveppi",
    file: "DIM_CLAVEPPI.csv",
  },
  {
    table: "dim_edo",
    file: "DIM_EDO.csv",
  },
  {
    table: "dim_mun",
    file: "DIM_MUN.csv",
  },
  {
    table: "dim_ramour",
    file: "DIM_RAMOUR.csv",
  },
  {
    table: "dim_sin_edo",
    file: "DIM_SIN_EDO.csv",
  },
];

async function loadCSV(tableName, fileName, encoding = "utf-8") {
  const baseURL = import.meta.env.BASE_URL;

  const csvUrl = `${baseURL}data/${fileName}`.replace(/\/+/g, "/");

  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error(`Error cargando ${fileName}: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Un archivo GZIP real comienza con los bytes:
  // 0x1F 0x8B
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;

  console.log(`Archivo: ${fileName}`);
  console.log("Content-Encoding:", response.headers.get("content-encoding"));
  console.log("¿Los bytes siguen comprimidos?", isGzip);

  // Si el navegador ya lo descomprimió,
  // quitamos .gz del nombre virtual.
  const virtualFile = isGzip ? `duckdb_${fileName}` : `duckdb_${fileName.replace(/\.gz$/i, "")}`;

  console.log("Nombre registrado en DuckDB:", virtualFile);

  await db.registerFileBuffer(virtualFile, bytes);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS ${tableName}
    AS
    SELECT *
    FROM read_csv_auto(
      '${virtualFile}',
      encoding = '${encoding}',
      header = true
    );
  `);

  await db.dropFile(virtualFile);
}

export async function initDB() {
  if (db && conn) {
    return { db, conn };
  }

  if (initPromise) {
    return await initPromise;
  }

  initPromise = (async () => {
    // -----------------------------------------
    // 1. Seleccionar bundle de DuckDB
    // -----------------------------------------

    const bundles = duckdb.getJsDelivrBundles();

    const bundle = await duckdb.selectBundle(bundles);

    // -----------------------------------------
    // 2. Crear Worker
    // -----------------------------------------

    const workerResponse = await fetch(bundle.mainWorker);

    const workerText = await workerResponse.text();

    const workerBlob = new Blob([workerText], {
      type: "application/javascript",
    });

    const workerUrl = URL.createObjectURL(workerBlob);

    const worker = new Worker(workerUrl);

    URL.revokeObjectURL(workerUrl);

    // -----------------------------------------
    // 3. Inicializar DuckDB
    // -----------------------------------------

    const logger = new duckdb.ConsoleLogger();

    db = new duckdb.AsyncDuckDB(logger, worker);

    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    // -----------------------------------------
    // 4. Crear conexión
    // -----------------------------------------

    conn = await db.connect();

    // -----------------------------------------
    // 5. Crear tablas
    // -----------------------------------------

    for (const dataset of DATASETS) {
      await loadCSV(dataset.table, dataset.file);
    }

    return {
      db,
      conn,
    };
  })();

  return await initPromise;
}

export async function query(sql) {
  const { conn } = await initDB();

  return await conn.query(sql);
}
