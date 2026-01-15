<template>
  <div
    class="launcher-item"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
    :title="item.name || item.url"
  >
    <div class="launcher-icon">
      <img v-if="item.icon" :src="item.icon" alt="icon" />
      <div v-else class="launcher-icon-placeholder">🌐</div>
    </div>
    <div class="launcher-info">
      <div class="launcher-name">{{ item.name || 'Web Link' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import type { WidgetConfig } from '../../../../main/store'

const props = defineProps<{
  item: WidgetConfig
  widgetIndex: number
  itemIndex: number
}>()

const handleClick = () => {
  if (props.item.url) {
    // 使用 launchApp 处理 URL，主进程会自动识别协议并调用 shell.openExternal
    window.electronAPI.launchApp(props.item.url, [])
  }
}

const handleContextMenu = () => {
  window.electronAPI.showContextMenu({
    widgetIndex: props.widgetIndex,
    itemIndex: props.itemIndex,
    target: props.item.url
  })
}
</script>

<style scoped>
.launcher-icon-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e0f2fe;
  color: #0ea5e9;
  font-weight: bold;
  font-size: 16px;
}
</style>
