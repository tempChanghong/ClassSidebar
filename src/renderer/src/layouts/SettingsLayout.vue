<template>
  <div class="settings-shell">
    <aside class="settings-nav">
      <div class="nav-title">设置</div>
      <nav>
        <a
          v-for="tab in tabs"
          :key="tab.id"
          :class="{ active: currentTab === tab.id }"
          @click="$emit('update:tab', tab.id)"
        >
          {{ tab.label }}
        </a>
      </nav>
    </aside>
    <main class="settings-content">
      <slot></slot>
    </main>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tabs: { id: string; label: string }[]
  currentTab: string
}>()

defineEmits<{
  (e: 'update:tab', id: string): void
}>()
</script>

<style scoped>
.settings-shell {
  display: flex;
  height: 100vh;
  background: #f9fafb;
  color: #1f2937;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.settings-nav {
  width: 200px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
}

.nav-title {
  padding: 0 20px;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.settings-nav nav {
  display: flex;
  flex-direction: column;
}

.settings-nav a {
  padding: 10px 20px;
  cursor: pointer;
  color: #4b5563;
  text-decoration: none;
  font-size: 14px;
  transition: background-color 0.2s, color 0.2s;
}

.settings-nav a:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.settings-nav a.active {
  background-color: #e5e7eb;
  color: #111827;
  font-weight: 500;
  border-left: 3px solid #3b82f6; /* Accent color */
}

.settings-content {
  flex: 1;
  padding: 30px 40px;
  overflow-y: auto;
}
</style>
