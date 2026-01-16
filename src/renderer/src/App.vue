<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useSidebarStore } from './stores/sidebarStore'

const store = useSidebarStore()

// 统一的窗口尺寸更新逻辑
const updateWindowSize = () => {
  if (!store.config?.transforms) return

  const { width, height } = store.config.transforms
  // const START_W = 4 // 初始收起宽度 (未使用，已移除)
  const PADDING = 40 // 窗口额外高度

  if (store.isExpanded) {
    // 展开状态：使用配置的完整宽度和高度
    window.electronAPI.resizeWindow(width, height)
  } else {
    // 收起状态：使用初始宽度 (20)，高度跟随配置（加 padding）
    window.electronAPI.resizeWindow(20, height + PADDING)
  }
}

// 1. 深度监听配置变化
watch(
  () => store.config,
  (newConfig) => {
    if (newConfig) {
      updateWindowSize()
    }
  },
  { deep: true }
)

// 2. 监听展开状态变化
watch(
  () => store.isExpanded,
  () => {
    updateWindowSize()
  }
)

// 3. 初始化时强制同步
onMounted(() => {
  // 确保配置加载后再同步，或者如果已有配置立即同步
  if (store.config) {
    updateWindowSize()
  } else {
    // 如果配置尚未加载，watch 会在加载完成后触发
    // 但为了保险，可以监听一次性加载
    const unwatch = watch(
      () => store.config,
      (val) => {
        if (val) {
          updateWindowSize()
          unwatch()
        }
      }
    )
  }
})
</script>
