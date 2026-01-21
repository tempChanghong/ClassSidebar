<template>
  <SettingsSection title="日志设置">
    <div class="flex flex-col gap-4">
      <!-- Log Level -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-700 dark:text-gray-200">日志级别</span>
        <select
          v-model="currentLevel"
          @change="updateLogLevel"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        >
          <option value="error">Error (仅错误)</option>
          <option value="warn">Warn (警告及以上)</option>
          <option value="info">Info (普通及以上)</option>
          <option value="debug">Debug (调试及以上)</option>
        </select>
      </div>

      <!-- Clear Logs -->
      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-sm text-gray-700 dark:text-gray-200">清理日志</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">清空当前日志文件内容</span>
        </div>
        <button
          @click="clearLogs"
          class="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 transition-colors"
        >
          清空日志
        </button>
      </div>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SettingsSection from './SettingsSection.vue'

const currentLevel = ref('info')

const updateLogLevel = async () => {
  try {
    await window.electronAPI.setLogLevel(currentLevel.value)
  } catch (e) {
    console.error('Failed to set log level:', e)
  }
}

const clearLogs = async () => {
  if (confirm('确定要清空所有日志吗？此操作不可撤销。')) {
    try {
      const result = await window.electronAPI.clearLogs()
      if (result.success) {
        alert('日志已清空')
      } else {
        alert('清空失败: ' + result.error)
      }
    } catch (e) {
      console.error('Failed to clear logs:', e)
      alert('清空失败')
    }
  }
}

onMounted(async () => {
    // Initial sync could be done if we had a getLogLevel API, 
    // but for now we rely on the component defaults or store.
    // Ideally we should fetch the current config from store.
    const config = await window.electronAPI.getConfig();
    if (config.logLevel) {
        currentLevel.value = config.logLevel;
    }
})
</script>
