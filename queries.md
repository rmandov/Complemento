🧪 1. Query “realista” (filtros + selección + limpieza)
SELECT 
  ID_PPI_ESPACIAL,
  NUMERO_SOLICITUD,
  RAMO_DESC,
  UNIDAD_DESC,
  NOMBRE_CORTO,
  FASE_DESC,
  ENTIDAD_FEDERATIVA,
  POBLACION_BENEFICIADA
FROM dataset
WHERE ENTIDAD_FEDERATIVA_ID = '11'
  AND FASE_DESC = 'Concluido'
  AND TIENE_PPEF = false
ORDER BY NUMERO_SOLICITUD DESC
LIMIT 20;

✔️ Esto prueba:

filtros múltiples
booleanos
ordenamiento
limit
selección de columnas reales
📊 2. Query analítico (agregaciones por fase)
SELECT 
  FASE_DESC,
  COUNT(*) AS total_proyectos,
  SUM(POBLACION_BENEFICIADA) AS poblacion_total
FROM dataset
WHERE ENTIDAD_FEDERATIVA_ID = '11'
GROUP BY FASE_DESC
ORDER BY total_proyectos DESC;

✔️ Esto prueba:

GROUP BY
agregaciones
sumas
análisis por categoría
🧠 3. Query “tipo dashboard” (más avanzada)
SELECT 
  RAMO_DESC,
  FASE_DESC,
  COUNT(*) AS total,
  AVG(POBLACION_BENEFICIADA) AS promedio_beneficiados,
  SUM(CASE WHEN TIENE_PPEF THEN 1 ELSE 0 END) AS con_ppef
FROM dataset
WHERE ENTIDAD_FEDERATIVA_ID = '11'
GROUP BY RAMO_DESC, FASE_DESC
ORDER BY total DESC;

✔️ Esto prueba:

GROUP BY múltiple
CASE WHEN
AVG / SUM mixtos
lógica condicional
🔍 4. Query de “calidad de datos” (muy útil en ETLs)
SELECT 
  COUNT(*) AS total,
  SUM(CASE WHEN LATITUD_INICIAL IS NULL THEN 1 ELSE 0 END) AS sin_latitud,
  SUM(CASE WHEN LONGITUD_INICIAL IS NULL THEN 1 ELSE 0 END) AS sin_longitud,
  SUM(CASE WHEN MUNICIPIO IS NULL THEN 1 ELSE 0 END) AS sin_municipio,
  SUM(CASE WHEN NOMBRE_LARGO IS NULL THEN 1 ELSE 0 END) AS sin_nombre
FROM dataset
WHERE ENTIDAD_FEDERATIVA_ID = '11';

✔️ Esto prueba:

data profiling
null handling
diagnóstico de dataset
⚡ 5. Query con transformación (tipo “feature engineering”)
SELECT 
  ID_PPI_ESPACIAL,
  NOMBRE_CORTO,
  FASE_DESC,
  CASE 
    WHEN POBLACION_BENEFICIADA = 0 THEN 'SIN BENEFICIO'
    WHEN POBLACION_BENEFICIADA < 1000 THEN 'BAJO'
    WHEN POBLACION_BENEFICIADA < 10000 THEN 'MEDIO'
    ELSE 'ALTO'
  END AS nivel_impacto
FROM dataset
WHERE ENTIDAD_FEDERATIVA_ID = '11';

✔️ Esto prueba:

CASE avanzado
categorización dinámica