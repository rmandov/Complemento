// data/duckdb.js
import * as duckdb from '@duckdb/duckdb-wasm'

let db = null
let conn = null
let initPromise = null

export async function initDB() {
  if (db && conn) return { db, conn }
  if (initPromise) return await initPromise

  initPromise = (async () => {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles()
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES)

    const workerScriptResponse = await fetch(bundle.mainWorker)
    const workerScriptText = await workerScriptResponse.text()
    const workerBlob = new Blob([workerScriptText], { type: 'application/javascript' })
    const workerUrl = URL.createObjectURL(workerBlob)

    const worker = new Worker(workerUrl)
    URL.revokeObjectURL(workerUrl)

    const logger = new duckdb.ConsoleLogger()
    db = new duckdb.AsyncDuckDB(logger, worker)
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker)

    conn = await db.connect()

    // Cargar CSV usando fetch binario directo (más seguro para Vite/Servidores locales)
    const baseURL = import.meta.env.BASE_URL
    const csvUrl = `${baseURL}data/BD_PPI_OPA.csv`.replace(/\/+/g, '/') // Asegura rutas limpias

    const res = await fetch(csvUrl)
    if (!res.ok) throw new Error(`Error al descargar el CSV: ${res.statusText}`)

    const buffer = await res.arrayBuffer()
    await db.registerFileBuffer('datos.csv', new Uint8Array(buffer))

    // Crear la tabla explícitamente
    await conn.query(`CREATE TABLE IF NOT EXISTS dataset AS FROM read_csv_auto('datos.csv')`)
    await db.dropFile('datos.csv')

    return { db, conn }
  })()

  return await initPromise
}

export async function query(sql) {
  // Garantiza que initDB haya completado la creación de la tabla antes de hacer la consulta
  const { conn } = await initDB()
  return await conn.query(sql)
}
