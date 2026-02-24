<template>
  <div class="group flex items-center justify-between py-4 px-6 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-all duration-300 rounded-lg mx-2 mb-1">
    <div class="flex-1 pr-8">
      <div class="text-sm font-semibold text-slate-800 tracking-tight">{{ label }}</div>
      <div v-if="description" class="mt-1 text-xs text-slate-500 leading-relaxed">{{ description }}</div>
    </div>
    <div class="flex-shrink-0 flex items-center gap-3">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  description?: string
}>()
</script>
