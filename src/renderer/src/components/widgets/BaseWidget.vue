<template>
  <div
    class="base-widget relative overflow-hidden flex p-2
           rounded-xl transition-all duration-300 ease-in-out
           bg-white/40 hover:bg-white/80 hover:scale-105 active:scale-95
           cursor-pointer select-none border border-white/30 shadow-sm hover:shadow-md"
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
    <!-- 【终极视觉微调】: 控制图标圆角为 rounded-xl，使用高对比度深色 text-slate-800 -->
    <div
      class="widget-icon flex items-center justify-center text-slate-800 rounded-xl overflow-hidden"
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
    <!-- 【终极视觉微调】: 字体加粗 (font-semibold) 提升精致感，并使用高对比度 text-slate-800 -->
    <div
      class="widget-label text-slate-800 truncate"
      :class="[
        layout === 'vertical' ? 'text-sm font-semibold flex-1 text-left' : 'text-xs font-semibold text-center w-full px-1'
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
  /* 移除原本固定的不透明白底色和黑边框 */
  /* 完全由 html 类如 hover:bg-white/10 及 hover:border-white/20 负责动态质感 */
}
</style>
