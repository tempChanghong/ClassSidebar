<template>
  <div class="settings-item">
    <div class="item-info">
      <div class="item-label">{{ label }}</div>
      <div v-if="description" class="item-desc">{{ description }}</div>
    </div>
    <div class="item-control">
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

<style scoped>
.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
}

.settings-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.settings-item:first-child {
  padding-top: 0;
}

.item-info {
  flex: 1;
  padding-right: 20px;
}

.item-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.item-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.4;
}

.item-control {
  flex-shrink: 0;
}
</style>
