<template>
  <div
    class="launcher-item"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
    :title="item.name || item.target"
  >
    <div class="launcher-icon">
      <i v-if="isFontAwesome" :class="item.icon"></i>
      <img v-else-if="iconSrc" :src="iconSrc" alt="icon" />
      <div v-else class="launcher-icon-placeholder">
        <AppWindow class="w-5 h-5 text-slate-400" />
      </div>
    </div>
    <div class="launcher-info">
      <div class="launcher-name">{{ item.name || 'Application' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { AppWindow } from 'lucide-vue-next'
import type { LauncherWidgetConfig } from '../../../../main/store'

// 注意：这里 item 可能是顶层 WidgetConfig，也可能是旧版 grid 中的子项
// 为了兼容，我们使用 any 或联合类型，但在新系统中主要作为顶层 Widget 使用
const props = defineProps<{
  item: LauncherWidgetConfig | any
  widgetIndex: number
  itemIndex?: number // 如果是在 Grid 中，则有此值
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

<style scoped>
.launcher-icon-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  border-radius: 6px;
}
</style>
