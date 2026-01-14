<template>
  <section class="settings-section">
    <h3 v-if="title" class="section-title">{{ title }}</h3>
    <div class="section-body">
      <slot></slot>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<style scoped>
.settings-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.section-title {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-body {
  display: flex;
  flex-direction: column;
}
</style>
