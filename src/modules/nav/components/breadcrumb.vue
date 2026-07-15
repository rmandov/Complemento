<template>
  <nav>
    <ol>
      <li v-for="(crumb, index) in breadcrumbs" :key="index">

        <router-link v-if="index < breadcrumbs.length - 1" :to="crumb.path">
          {{ crumb.label }}
        </router-link>

        <span v-else>
          {{ crumb.label }}
        </span>

        <span v-if="index < breadcrumbs.length - 1"> / </span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
console.log('vue router: ', route.matched)

const breadcrumbs = computed(() => {
  const crumbs = [{ label: "Home", path: "/" }];
  const paths = route.path.split("/").filter(Boolean);

  let currentPath = "";

  paths.forEach((path, index) => {
    currentPath += `/${path}`;

    crumbs.push({
      label: route.matched[index + 1]?.meta?.breadcrumb || path,
      path: currentPath,
    });
  });

  return crumbs;
});
</script>

<style scoped>
ol {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  margin-right: 5px;
  background-color: royalblue;
}
</style>
