<template>
  <BaseWidget
    :name="item.name || 'Web Link'"
    :title="item.url"
    :icon="item.icon"
    :default-icon="Globe"
    :layout="item.layout || 'grid'"
    placeholder-class="bg-blue-100 text-blue-500"
    @click="handleClick"
    @contextmenu="handleContextMenu"
  />
</template>

<script setup lang="ts">
import { Globe } from 'lucide-vue-next'
import type { UrlWidgetConfig } from '../../../../main/store'
import BaseWidget from './BaseWidget.vue'

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
    itemIndex: -1,
    target: props.item.url
  })
}
</script>
