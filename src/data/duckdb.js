// data/duckdb.js
import * as duckdb from "@duckdb/duckdb-wasm";

let db = null;
let conn = null;

export async function initDB() {
  if (db) return { db, conn };

  // 1. Seleccionar el bundle adecuado
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  // 2. Descargar el script del Worker y crear un Blob URL
  const workerScriptResponse = await fetch(bundle.mainWorker);
  const workerScriptText = await workerScriptResponse.text();
  const workerBlob = new Blob([workerScriptText], { type: "application/javascript" });
  const workerUrl = URL.createObjectURL(workerBlob);

  // 3. Crear el Worker con la URL del blob (mismo origen)
  const worker = new Worker(workerUrl);

  // 4. Instanciar DuckDB
  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  // 5. Cargar el CSV desde el servidor
  const csvResponse = await fetch("/data/BD_PPI_OPA_MAPA.csv");
  const csvText = await csvResponse.text();
  await db.registerFileText("datos.csv", csvText);

  // 6. Crear la tabla a partir del archivo registrado
  conn = await db.connect();
  await conn.query(`CREATE OR REPLACE TABLE dataset AS FROM read_csv_auto('datos.csv')`);

  // Opcional: ya podemos borrar el archivo virtual para liberar memoria
  await db.dropFile("datos.csv");

  return { db, conn };
}

export async function query(sql) {
  const { conn } = await initDB();
  return await conn.query(sql); // Devuelve una Arrow Table
}
