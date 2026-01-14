<template>
  <div
    class="launcher-item"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
    :title="item.name"
  >
    <div class="launcher-icon">
      <i v-if="isFontAwesome" :class="item.icon"></i>
      <img v-else-if="iconSrc" :src="iconSrc" alt="icon" />
      <div v-else class="launcher-icon-placeholder">?</div>
    </div>
    <div class="launcher-info">
      <div class="launcher-name">{{ item.name }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps<{
  item: any
  widgetIndex: number
  itemIndex: number
}>()

const iconSrc = ref<string>('')

const isFontAwesome = computed(() => {
  return props.item.icon && (props.item.icon.startsWith('fa-') || props.item.icon.includes(' fa-'))
})

const loadIcon = async () => {
  if (isFontAwesome.value) return

  if (props.item.icon) {
    // 如果配置中有图标路径，直接使用
    iconSrc.value = props.item.icon
  } else if (props.item.target) {
    // 否则尝试获取系统图标
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
  console.log('[LauncherWidget] Clicked:', props.item)
  if (props.item.target) {
    // 关键修改：将 Proxy 对象转换为普通数组，防止 IPC 克隆错误
    const args = props.item.args ? JSON.parse(JSON.stringify(props.item.args)) : []

    console.log('[LauncherWidget] Invoking launchApp:', props.item.target, args)
    window.electronAPI.launchApp(props.item.target, args)
  } else {
    console.warn('[LauncherWidget] No target defined for item')
  }
}

const handleContextMenu = () => {
  window.electronAPI.showContextMenu({
    widgetIndex: props.widgetIndex,
    itemIndex: props.itemIndex,
    target: props.item.target
  })
}
</script>

<style scoped>
/* 样式已在全局 main.css 中定义，这里只需处理组件特有的微调 */
.launcher-icon-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  color: #9ca3af;
  font-weight: bold;
}
</style>
