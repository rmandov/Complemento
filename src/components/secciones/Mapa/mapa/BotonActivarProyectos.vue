<script lang="ts" setup>
import { handleMouseLeave, handleMouseMove } from '@/modules/map/composables/gsap/magenticButton';
const emit = defineEmits(["onClick"]);
const props = defineProps<Props>();
interface Props{
  habilitado:boolean;
}
function handleClick() {
  emit("onClick");
}
</script>
<template>
  <button type="button" @click="handleClick" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave"
    class="absolute top-16 right-2 shadow-xl bg-white  z-999 rounded-full w-[3rem] h-[3rem] cursor-pointer boton-proyectos "
    :class="{
      'activo':habilitado
    }">
    <div class="magnetic flex items-center justify-center text-5xl">
      <span class="material-symbols-outlined text-[#afafaf]">
        keep
      </span>
    </div>
  </button>
</template>
<style scoped>
.boton-proyectos{
  opacity: 0.5;
}
.boton-proyectos.activo{
  opacity: 1;
}
</style>
