<template>
  <BaseWidget
    :name="item.name || 'Application'"
    :title="item.name || item.target"
    :icon="iconSrc"
    :default-icon="AppWindow"
    placeholder-class="bg-slate-200 text-slate-400"
    @click="handleClick"
    @contextmenu="handleContextMenu"
  >
    <template #icon v-if="isFontAwesome">
      <i :class="item.icon"></i>
    </template>
  </BaseWidget>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { AppWindow } from 'lucide-vue-next'
import type { LauncherWidgetConfig } from '../../../../main/store'
import BaseWidget from './BaseWidget.vue'

const props = defineProps<{
  item: LauncherWidgetConfig | any
  widgetIndex: number
  itemIndex?: number
}>()

const iconSrc = ref<string>('')

const isFontAwesome = computed(() => {
  return props.item.icon && (props.item.icon.startsWith('fa-') || props.item.icon.includes(' fa-'))
})

const loadIcon = async () => {
  if (isFontAwesome.value) return

  if (props.item.icon) {
    iconSrc.value = props.item.icon
  } else if (props.item.target) {
    try {
      const icon = await window.electronAPI.getFileIcon(props.item.target)
      if (icon) {
        iconSrc.value = icon
      }
    } catch (e) {
      console.error('Failed to load icon for', props.item.name, e)
    }
  }
}

onMounted(loadIcon)
watch(() => props.item, loadIcon, { deep: true })

const handleClick = () => {
  if (props.item.target) {
    const args = props.item.args ? JSON.parse(JSON.stringify(props.item.args)) : []
    window.electronAPI.launchApp(props.item.target, args)
  }
}

const handleContextMenu = () => {
  window.electronAPI.showContextMenu({
    widgetIndex: props.widgetIndex,
    itemIndex: props.itemIndex ?? -1,
    target: props.item.target
  })
}
</script>
