<script lang="ts" setup>
import { MEXICO_ICON } from '@/assets/img/mexicoIcon';
import { regresarMapa } from '../utils/mapController';
import { handleMouseLeave, handleMouseMove } from '@/modules/map/composables/gsap/magenticButton';
const emit = defineEmits(["onClick"])
function handleClick(){
  regresarMapa();
  emit("onClick");
}
</script>
<template>
  <button type="button" @click="handleClick" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave"
      class="absolute top-2 right-2 shadow-xl bg-white  z-999 rounded-full w-[3rem] h-[3rem] cursor-pointer">
      <div class="magnetic flex items-center justify-center text-5xl">
        <svg width="1em" height="1em" viewBox="150 -40 200 600" xmlns="http://www.w3.org/2000/svg">
          <path fill="#afafaf" :d="MEXICO_ICON" />
        </svg>
      </div>
    </button>
</template>
