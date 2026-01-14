<template>
  <section class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div v-if="title" class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
      <h3 class="text-sm font-semibold text-slate-900 uppercase tracking-wider">{{ title }}</h3>
      <p v-if="description" class="mt-1 text-xs text-slate-500">{{ description }}</p>
    </div>
    <div class="p-0">
      <slot></slot>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>
