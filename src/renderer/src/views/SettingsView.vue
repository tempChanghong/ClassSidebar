<template>
  <el-container class="settings-container">
    <el-header class="settings-header">
      <h2>设置</h2>
      <div class="version-info">v{{ appVersion }}</div>
    </el-header>

    <el-main class="settings-content">
      <!-- 开机自启设置 -->
      <el-card class="setting-item">
        <div class="setting-label">
          <span>开机自启</span>
          <el-switch v-model="autoLaunch" @change="toggleAutoLaunch" />
        </div>
      </el-card>

      <!-- 快捷添加组件 -->
      <el-card class="setting-item">
        <template #header>
          <div class="card-header">
            <h3>添加组件</h3>
          </div>
        </template>
        <div class="add-widget-buttons">
          <el-button @click="addLauncherWidget">添加启动器</el-button>
          <el-button @click="addVolumeWidget">添加音量条</el-button>
          <el-button @click="addFilesWidget">添加文件夹</el-button>
          <el-button @click="addDragToLaunchWidget">添加拖拽启动</el-button>
          <el-button @click="addClassIslandWidget">添加 ClassIsland</el-button>
          <el-button @click="addSecRandomWidget">添加 SecRandom</el-button>
        </div>
      </el-card>

      <!-- JSON 配置编辑器 -->
      <el-card class="setting-section">
        <template #header>
          <div class="card-header">
            <h3>配置文件 (JSON)</h3>
          </div>
        </template>
        <p class="hint">直接编辑下方的 JSON 配置来修改布局和小组件。</p>
        <el-input
          v-model="configJson"
          type="textarea"
          :rows="15"
          class="json-editor"
          spellcheck="false"
          :class="{ 'error': jsonError }"
        />
        <div v-if="jsonError" class="error-message">{{ jsonError }}</div>
      </el-card>
    </el-main>

    <el-footer class="settings-footer">
      <el-button @click="resetConfig">重置更改</el-button>
      <el-button type="primary" @click="saveSettings" :disabled="!!jsonError">保存配置</el-button>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSidebarStore } from '../stores/sidebarStore'
import { ElMessage } from 'element-plus'

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
    ElMessage.success('配置已保存！')
  } catch (e) {
    console.error('保存失败', e)
    ElMessage.error('保存失败，请检查控制台日志。')
  }
}

// 辅助函数：向配置中添加 Widget
const addWidgetToConfig = (widget: any) => {
  try {
    const currentConfig = JSON.parse(configJson.value)
    if (!currentConfig.widgets) {
      currentConfig.widgets = []
    }
    currentConfig.widgets.push(widget)
    configJson.value = JSON.stringify(currentConfig, null, 2)
    ElMessage.success('组件已添加到配置，请点击保存生效。')
  } catch (e) {
    ElMessage.error('当前 JSON 格式错误，无法添加组件。')
  }
}

const addLauncherWidget = () => {
  addWidgetToConfig({
    type: 'launcher',
    layout: 'grid',
    targets: [
      { name: '示例应用', target: 'notepad.exe' }
    ]
  })
}

const addVolumeWidget = () => {
  addWidgetToConfig({
    type: 'volume_slider'
  })
}

const addFilesWidget = () => {
  addWidgetToConfig({
    type: 'files',
    folder_path: 'C:\\Users\\Public\\Desktop',
    max_count: 10
  })
}

const addDragToLaunchWidget = () => {
  addWidgetToConfig({
    type: 'drag_to_launch',
    command_template: '"{path}"'
  })
}

const addClassIslandWidget = () => {
  addWidgetToConfig({
    type: 'launcher',
    layout: 'grid',
    targets: [
      {
        name: 'ClassIsland',
        target: 'classisland://app',
        icon: 'classisland.exe' // 假设有这个图标，或者让用户自己配置
      },
      {
        name: 'CI 换课',
        target: 'classisland://app/class-swap',
        icon: 'classisland.exe'
      }
    ]
  })
}

const addSecRandomWidget = () => {
  addWidgetToConfig({
    type: 'launcher',
    layout: 'grid',
    targets: [
      {
        name: 'SecRandom',
        target: 'secrandom://app',
        icon: 'secrandom.exe'
      },
      {
        name: '随机点名',
        target: 'secrandom://pumping',
        icon: 'secrandom.exe'
      }
    ]
  })
}
</script>

<style scoped>
.settings-container {
  height: 100vh;
  background: #f9fafb;
  color: #1f2937;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.settings-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
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
  padding: 20px;
  overflow-y: auto;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.setting-section h3 {
  margin: 0;
  font-size: 16px;
}

.hint {
  margin: 0 0 10px 0;
  color: #6b7280;
  font-size: 14px;
}

.json-editor {
  font-family: monospace;
  font-size: 13px;
  line-height: 1.4;
}

.json-editor.error :deep(.el-textarea__inner) {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 13px;
  margin-top: 5px;
}

.settings-footer {
  background: #fff;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 20px;
}

.add-widget-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
