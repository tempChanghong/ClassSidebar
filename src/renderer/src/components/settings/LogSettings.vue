<template>
  <SettingsSection title="日志设置">
    <div class="flex flex-col gap-4">
      <!-- Log Level -->
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-700 dark:text-gray-200">日志级别</span>
        <div class="w-48">
          <BaseSelect
            v-model="currentLevel"
            @change="updateLogLevel"
            :options="logLevelOptions"
          />
        </div>
      </div>

      <!-- Clear Logs -->
      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-sm text-gray-700 dark:text-gray-200">清理日志</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">清空当前日志文件内容</span>
        </div>
        <BaseButton
          variant="danger"
          @click="clearLogs"
        >
          清空日志
        </BaseButton>
      </div>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SettingsSection from './SettingsSection.vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseSelect from '../ui/BaseSelect.vue'

const currentLevel = ref('info')

const logLevelOptions = [
  { value: 'error', label: 'Error (仅错误)' },
  { value: 'warn', label: 'Warn (警告及以上)' },
  { value: 'info', label: 'Info (普通及以上)' },
  { value: 'debug', label: 'Debug (调试及以上)' }
]

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
