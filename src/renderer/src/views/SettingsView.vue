<template>
  <div class="settings-container">
    <div class="settings-header">
      <h2>设置</h2>
      <div class="version-info">v{{ appVersion }}</div>
    </div>

    <div class="settings-content">
      <!-- 开机自启设置 -->
      <div class="setting-item">
        <label class="setting-label">
          <span>开机自启</span>
          <input type="checkbox" v-model="autoLaunch" @change="toggleAutoLaunch">
        </label>
      </div>

      <!-- JSON 配置编辑器 -->
      <div class="setting-section">
        <h3>配置文件 (JSON)</h3>
        <p class="hint">直接编辑下方的 JSON 配置来修改布局和小组件。</p>
        <textarea
          v-model="configJson"
          class="json-editor"
          spellcheck="false"
          :class="{ 'error': jsonError }"
        ></textarea>
        <div v-if="jsonError" class="error-message">{{ jsonError }}</div>
      </div>
    </div>

    <div class="settings-footer">
      <button class="btn btn-secondary" @click="resetConfig">重置更改</button>
      <button class="btn btn-primary" @click="saveSettings" :disabled="!!jsonError">保存配置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSidebarStore } from '../stores/sidebarStore'

const store = useSidebarStore()
const appVersion = ref('')
const autoLaunch = ref(false)
const configJson = ref('')
const jsonError = ref('')

onMounted(async () => {
  // 获取版本号
  appVersion.value = await window.electronAPI.getAppVersion()

  // 获取开机自启状态
  const settings = await window.electronAPI.getLoginItemSettings()
  autoLaunch.value = settings.openAtLogin

  // 加载配置
  await store.loadConfig()
  if (store.config) {
    configJson.value = JSON.stringify(store.config, null, 2)
  }
})

// 监听 JSON 变化并校验
watch(configJson, (newVal) => {
  try {
    JSON.parse(newVal)
    jsonError.value = ''
  } catch (e: any) {
    jsonError.value = e.message
  }
})

const toggleAutoLaunch = async () => {
  await window.electronAPI.setLoginItemSettings({
    openAtLogin: autoLaunch.value,
    path: process.execPath // Electron 会自动处理，这里通常不需要显式传 path，除非有特殊需求
  })
}

const resetConfig = () => {
  if (store.config) {
    configJson.value = JSON.stringify(store.config, null, 2)
    jsonError.value = ''
  }
}

const saveSettings = async () => {
  if (jsonError.value) return

  try {
    const newConfig = JSON.parse(configJson.value)
    await store.saveConfig(newConfig)
    alert('配置已保存！')
  } catch (e) {
    console.error('保存失败', e)
    alert('保存失败，请检查控制台日志。')
  }
}
</script>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f9fafb;
  color: #1f2937;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.settings-header {
  padding: 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-header h2 {
  margin: 0;
  font-size: 20px;
}

.version-info {
  color: #6b7280;
  font-size: 14px;
}

.settings-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.setting-item {
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.setting-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
}

.setting-section h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 16px;
}

.hint {
  margin: 0 0 10px 0;
  color: #6b7280;
  font-size: 14px;
}

.json-editor {
  width: 100%;
  height: 300px;
  font-family: monospace;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  resize: vertical;
  font-size: 13px;
  line-height: 1.4;
  box-sizing: border-box;
}

.json-editor:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.json-editor.error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 13px;
  margin-top: 5px;
}

.settings-footer {
  padding: 20px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.btn-secondary {
  background: #fff;
  border-color: #d1d5db;
  color: #374151;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
