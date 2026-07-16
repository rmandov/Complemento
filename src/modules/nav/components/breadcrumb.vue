<template>
  <nav v-if="breadcrumbs.length > 1" class="breadcrumb-nav">
    <ol>
      <li v-for="(crumb, index) in breadcrumbs" :key="index">
        <router-link v-if="index < breadcrumbs.length - 1" :to="crumb.path" class="crumb-link">
          <HomeIcon v-if="index === 0" />
          <template v-else>{{ crumb.label }}</template>
        </router-link>

        <span v-else class="crumb-link current">
          <HomeIcon v-if="index === 0" />
          <template v-else>{{ crumb.label }}</template>
        </span>

        <span v-if="index < breadcrumbs.length - 1" class="separator">›</span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed, h } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const HomeIcon = () =>
  h(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '14',
      height: '14',
      fill: 'currentColor',
      class: 'bi bi-house',
      viewBox: '0 0 16 16',
      style: 'display: block;',
    },
    [
      h('path', {
        d: 'M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z',
      }),
    ],
  )

const breadcrumbs = computed(() => {
  const crumbs = [{ label: 'Home', path: '/' }]

  route.matched.forEach((record) => {
    if (record.path === '/') return

    const hasIdentifier = record.meta?.breadcrumb || record.name
    if (!hasIdentifier && record.path === '') return

    const label =
      record.meta?.breadcrumb || record.name || record.path.split('/').filter(Boolean).pop()

    crumbs.push({
      label,
      path: record.path,
    })
  })

  return crumbs
})
</script>

<style scoped>
.breadcrumb-nav {
  position: absolute;
  top: 5rem;
  left: 1rem;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 25px;
  box-shadow: 0 10px 10px rgba(0, 0, 0, 0.06);
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
}

ol {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  align-items: center;
}

li {
  display: flex;
  align-items: center;
}

.crumb-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: #6b7280;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.crumb-link:hover {
  color: #111827;
  background: rgba(0, 0, 0, 0.04);
}

.crumb-link.current {
  color: #111827;
  font-weight: 600;
  cursor: default;
}

.separator {
  display: inline-flex;
  align-items: center;
  color: #d1d5db;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0 0.2rem;
  user-select: none;
}

svg {
  display: block;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
</style>
