import { computed } from 'vue'
import { useSidebarStore } from '../stores/sidebarStore'

export function useConfig() {
  const store = useSidebarStore()

  // 确保配置已加载
  if (!store.config) {
    store.loadConfig()
  }

  const config = computed(() => store.config)

  const saveConfig = async (newConfig: any) => {
    await store.saveConfig(newConfig)
  }

  return {
    config,
    saveConfig,
    store // 暴露 store 以便访问其他状态
  }
}
