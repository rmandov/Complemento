import { query } from "@/data/duckdb";

let queries = null;

async function loadQueries() {
  if (queries) {
    return queries;
  }

  const baseURL = import.meta.env.BASE_URL;

  const url = `${baseURL}data/queries.json`.replace(/\/+/g, "/");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error cargando queries.json: ${response.status} ${response.statusText}`);
  }

  queries = await response.json();

  return queries;
}

function applyParams(sql, params = {}) {
  let result = sql;

  for (const [key, value] of Object.entries(params)) {
    result = result.replaceAll(`{{${key}}}`, String(value));
  }

  return result;
}

export async function executeQuery(grupo, nombre, params = {}) {
  const queries = await loadQueries();

  let sql = queries?.[grupo]?.[nombre];

  if (!sql) {
    throw new Error(`Query no encontrado: ${grupo}.${nombre}`);
  }

  sql = applyParams(sql, params);

  return await query(sql);
}
