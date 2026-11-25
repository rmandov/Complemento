<script setup lang="ts">
import { ref, computed, watch } from 'vue';

export interface Columna {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

interface Props {
  datos: Record<string, any>[];
  columnas: Columna[];
}

const props = defineProps<Props>();

const pagActiva = ref<number>(0);
const tamPaginas = [10, 25, 50, 100];
const tamPag = ref<number>(tamPaginas[0]);

// Ordenamiento
const columnaOrden = ref<string | null>(null);
const direccionOrden = ref<'asc' | 'desc' | null>(null);

// Total de páginas
const totalPaginas = computed(() => {
  return Math.ceil(props.datos.length / tamPag.value);
});

// Datos ordenados
const datosOrdenados = computed(() => {
  if (!columnaOrden.value || !direccionOrden.value) {
    return props.datos;
  }

  const columna = columnaOrden.value;

  return props.datos
    .map((dato, index) => ({ dato, index }))
    .sort((a, b) => {
      const valorA = a.dato[columna];
      const valorB = b.dato[columna];

      let resultado = 0;

      if (valorA == null && valorB == null) {
        resultado = 0;
      } else if (valorA == null) {
        resultado = 1;
      } else if (valorB == null) {
        resultado = -1;
      } else if (
        typeof valorA === 'number' &&
        typeof valorB === 'number'
      ) {
        resultado = valorA - valorB;
      } else {
        resultado = String(valorA).localeCompare(
          String(valorB),
          undefined,
          {
            numeric: true,
            sensitivity: 'base'
          }
        );
      }

      if (direccionOrden.value === 'desc') {
        resultado *= -1;
      }

      return resultado || a.index - b.index;
    })
    .map(item => item.dato);
});

// Datos paginados
const datosPaginados = computed(() => {
  const inicio = pagActiva.value * tamPag.value;
  const fin = inicio + tamPag.value;

  return datosOrdenados.value.slice(inicio, fin);
});

// Ordenar por columna
const ordenar = (columna: Columna) => {
  if (!columna.sortable) return;

  if (columnaOrden.value !== columna.key) {
    columnaOrden.value = columna.key;
    direccionOrden.value = 'asc';
  } else if (direccionOrden.value === 'asc') {
    direccionOrden.value = 'desc';
  } else {
    columnaOrden.value = null;
    direccionOrden.value = null;
  }

  pagActiva.value = 0;
};

// Cambiar página (índice interno zero-based)
const cambiarPagina = (pagina: number) => {
  if (pagina >= 0 && pagina < totalPaginas.value) {
    pagActiva.value = pagina;
  }
};

// Cambiar tamaño de página
const cambiarTamPag = () => {
  pagActiva.value = 0;
};

// Reiniciar página cuando cambien los datos
watch(() => props.datos, () => {
  pagActiva.value = 0;
});

// Cambiar página desde el input (valor visible desde 1)
const handleChangePag = (event: Event) => {
  const input = event.target as HTMLInputElement;

  const valor = input.value.replace(/\D/g, '');

  if (input.value !== valor) {
    input.value = valor;
  }

  if (valor === '') return;

  const pagina = Number(valor);

  if (pagina >= 1 && pagina <= totalPaginas.value) {
    pagActiva.value = pagina - 1;
  }
};

// Restaurar el valor válido al salir del input
const restaurarPagina = (event: Event) => {
  const input = event.target as HTMLInputElement;

  input.value = String(totalPaginas.value > 0 ? pagActiva.value + 1 : 0);
};
</script>

<template>
  <div class="flex flex-col gap-4 h-full max-h-full overflow-hidden">

    <div class="contenedor-tabla flex-1 overflow-auto border border-gray-300 rounded-lg shadow">
      <table class="tabla">
        <thead class="sticky top-0 bg-gray-100">
          <tr>
            <th v-for="columna in columnas" :key="columna.key" :style="{
              maxWidth: columna.width || 'auto',
              minWidth: columna.width || 'auto'
            }">
              <button v-if="columna.sortable" type="button" @click="ordenar(columna)"
                class="w-full flex items-center justify-start cursor-pointer">
                {{ columna.label }}

                <span>
                  {{
                    columnaOrden === columna.key
                      ? direccionOrden === 'asc'
                        ? '↑'
                        : '↓'
                      : ''
                  }}
                </span>
              </button>

              <span v-else>
                {{ columna.label }}
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(dato, index) in datosPaginados" :key="index">
            <td v-for="columna in columnas" :key="columna.key"
              :title="dato[columna.key] == null ? '' : String(dato[columna.key])" :style="{
                width: columna.width || 'auto'
              }">
              <div class="truncate whitespace-nowrap">
                {{ dato[columna.key] }}
              </div>
            </td>
          </tr>

          <tr v-if="datosPaginados.length === 0">
            <td :colspan="columnas.length || 1">
              No hay registros disponibles
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-end gap-4">
      <div class="flex gap-2 items-center">
        <label for="rpp">Registros por página:</label>

        <select id="rpp" name="rpp" v-model.number="tamPag" @change="cambiarTamPag"
          class="border border-gray-200 rounded cursor-pointer">
          <option v-for="tam in tamPaginas" :key="tam" :value="tam">
            {{ tam }}
          </option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label for="pg">Página</label>

        <input id="pg" name="pg" type="text" inputmode="numeric" pattern="[0-9]*"
          class="rounded border border-gray-200 cursor-pointer w-auto input-pagina" :style="{
            '--ancho': String(Math.max(1, totalPaginas)).length
          }" :value="totalPaginas > 0 ? pagActiva + 1 : 0" @input="handleChangePag" @blur="restaurarPagina" />

        <span>
          de {{ totalPaginas }}
        </span>
      </div>

      <div class="flex gap-1">
        <button :disabled="pagActiva === 0" @click="cambiarPagina(0)"  class="boton-paginacion">
          <span class="material-symbols-outlined">
            keyboard_double_arrow_left
          </span>
        </button>
        <button :disabled="pagActiva === 0" @click="cambiarPagina(pagActiva - 1)" class="boton-paginacion">
          <span class="material-symbols-outlined">
            chevron_left
          </span>
        </button>

        <button :disabled="pagActiva >= totalPaginas - 1" @click="cambiarPagina(pagActiva + 1)"
          class="boton-paginacion">
          <span class="material-symbols-outlined">
            chevron_right
          </span>
        </button>
        <button :disabled="pagActiva >= totalPaginas - 1" @click="cambiarPagina(totalPaginas - 1)"
          class="boton-paginacion">
          <span class="material-symbols-outlined">
            keyboard_double_arrow_right
          </span>
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.tabla {
  width: max-content;
  min-width: 100%;
  table-layout: auto;
  border-collapse: collapse;
}

.tabla th,
.tabla td {
  padding: 0.25rem 0.5rem;
  white-space: nowrap;
  height: 1%;
}

.tabla td {
  border-bottom: 1px solid var(--color-gray-200);
}

.tabla td>div {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contenedor-tabla {
  scrollbar-width: thin;
  scrollbar-color: rgba(200, 200, 200, 0.8) transparent;
}

.contenedor-tabla::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.contenedor-tabla::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.contenedor-tabla::-webkit-scrollbar-thumb {
  background: rgba(200, 200, 200, 0.8);
  border-radius: 4px;
}

.contenedor-tabla::-webkit-scrollbar-thumb:hover {
  background: #555555;
}

.input-pagina {
  max-width: calc(var(--ancho) * 1.5ch);
}
.boton-paginacion{
  border: 1px solid var(--color-gray-200);
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
}
.boton-paginacion:disabled{
  opacity: 0.45;
  background-color: white !important;
}
.boton-paginacion:hover{
  background-color: var(--color-gray-200);
}
</style>
