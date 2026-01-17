<template>
  <div
    class="launcher-item"
    @click="$emit('click')"
    @contextmenu.prevent="$emit('contextmenu')"
    :title="title"
  >
    <div class="launcher-icon">
      <slot name="icon">
        <img v-if="icon" :src="icon" alt="icon" class="w-full h-full object-contain" />
        <div v-else class="launcher-icon-placeholder" :class="placeholderClass">
          <slot name="icon-placeholder">
            <component :is="defaultIcon" class="w-5 h-5" />
          </slot>
        </div>
      </slot>
    </div>
    <div class="launcher-info">
      <div class="launcher-name">{{ name }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Component } from 'vue'

defineProps<{
  name: string
  title?: string
  icon?: string
  defaultIcon?: Component
  placeholderClass?: string
}>()

defineEmits(['click', 'contextmenu'])
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
</style>
