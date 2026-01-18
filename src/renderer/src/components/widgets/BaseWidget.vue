<template>
  <div
    class="base-widget relative overflow-hidden flex p-2 rounded-lg hover:bg-black/5 transition-colors cursor-pointer select-none border border-transparent hover:border-black/5"
    @click="handleClick"
    @contextmenu.prevent="$emit('contextmenu')"
    :title="title"
    :class="[
      { 'cursor-wait': isLoading },
      layout === 'vertical' ? 'flex-row items-center justify-start h-12' : 'flex-col items-center justify-center h-20'
    ]"
  >
    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-black/20 z-10 flex items-center justify-center backdrop-blur-[1px] transition-all duration-200 rounded-lg"
    >
      <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
    </div>

    <!-- Icon Container -->
    <div
      class="widget-icon flex items-center justify-center text-slate-700"
      :class="layout === 'vertical' ? 'w-8 h-8 mr-3' : 'w-8 h-8 mb-1'"
    >
      <slot name="icon">
        <img v-if="icon" :src="icon" alt="icon" class="w-full h-full object-contain" />
        <div v-else class="w-full h-full flex items-center justify-center rounded" :class="placeholderClass">
          <slot name="icon-placeholder">
            <component :is="defaultIcon" class="w-5 h-5" />
          </slot>
        </div>
      </slot>
    </div>

    <!-- Label Container -->
    <div
      class="widget-label text-slate-700 truncate"
      :class="[
        layout === 'vertical' ? 'text-sm font-medium flex-1 text-left' : 'text-xs font-bold text-center w-full px-1'
      ]"
    >
      {{ name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Component, ref } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  title?: string
  icon?: string
  defaultIcon?: Component
  placeholderClass?: string
  loadingDuration?: number
  layout?: 'grid' | 'vertical'
}>(), {
  layout: 'grid' // 默认为网格布局
})

const emit = defineEmits(['click', 'contextmenu'])

const isLoading = ref(false)

const handleClick = (e: MouseEvent) => {
  if (isLoading.value) return

  isLoading.value = true
  emit('click', e)

  setTimeout(() => {
    isLoading.value = false
  }, props.loadingDuration || 800)
}
</script>

<style scoped>
.base-widget {
  /* 基础样式，具体布局由 Tailwind 类控制 */
  /* 添加边框以增强可见性，特别是网格模式下 */
  border: 1px solid rgba(0, 0, 0, 0.05);
  background-color: rgba(255, 255, 255, 0.4);
}

.base-widget:hover {
  background-color: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.1);
}
</style>
