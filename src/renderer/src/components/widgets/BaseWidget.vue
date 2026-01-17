<template>
  <div
    class="launcher-item relative overflow-hidden"
    @click="handleClick"
    @contextmenu.prevent="$emit('contextmenu')"
    :title="title"
    :class="{ 'cursor-wait': isLoading }"
  >
    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-black/20 z-10 flex items-center justify-center backdrop-blur-[1px] transition-all duration-200"
    >
      <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
    </div>

    <div class="launcher-icon relative z-0">
      <slot name="icon">
        <img v-if="icon" :src="icon" alt="icon" class="w-full h-full object-contain" />
        <div v-else class="launcher-icon-placeholder" :class="placeholderClass">
          <slot name="icon-placeholder">
            <component :is="defaultIcon" class="w-5 h-5" />
          </slot>
        </div>
      </slot>
    </div>
    <div class="launcher-info relative z-0">
      <div class="launcher-name">{{ name }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Component, ref } from 'vue'

const props = defineProps<{
  name: string
  title?: string
  icon?: string
  defaultIcon?: Component
  placeholderClass?: string
  loadingDuration?: number // Optional: override default loading duration
}>()

const emit = defineEmits(['click', 'contextmenu'])

const isLoading = ref(false)

const handleClick = (e: MouseEvent) => {
  if (isLoading.value) return // Prevent double clicks

  // Start loading animation
  isLoading.value = true

  // Emit click event
  emit('click', e)

  // Reset loading state after duration
  // Default to 800ms if not provided, which is enough to give feedback
  // but not too long to be annoying
  setTimeout(() => {
    isLoading.value = false
  }, props.loadingDuration || 800)
}
</script>

<style scoped>
.launcher-icon-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

/* Ensure loading spinner is visible on top of everything */
.launcher-item {
  isolation: isolate;
}
</style>
