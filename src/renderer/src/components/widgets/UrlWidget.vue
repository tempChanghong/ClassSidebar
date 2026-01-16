<template>
  <div
    class="launcher-item"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
    :title="item.url"
  >
    <div class="launcher-icon">
      <img v-if="item.icon" :src="item.icon" alt="icon" class="w-full h-full object-contain" />
      <div v-else class="launcher-icon-placeholder bg-blue-100 text-blue-500">
        <Globe class="w-5 h-5" />
      </div>
    </div>
    <div class="launcher-info">
      <div class="launcher-name">{{ item.name || 'Web Link' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Globe } from 'lucide-vue-next'
import type { UrlWidgetConfig } from '../../../../main/store'

const props = defineProps<{
  item: UrlWidgetConfig
  widgetIndex: number
}>()

const handleClick = () => {
  if (props.item.url) {
    window.electronAPI.openExternal(props.item.url)
  }
}

const handleContextMenu = () => {
  window.electronAPI.showContextMenu({
    widgetIndex: props.widgetIndex,
    itemIndex: -1, // -1 表示这是顶层 Widget，不是 Launcher 内部的 item
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
  border-radius: 6px;
}
</style>
