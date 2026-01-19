<template>
  <SettingsLayout
    :tabs="tabs"
    :current-tab="currentTab"
    :version="appVersion"
    @update:tab="currentTab = $event"
  >
    <!-- Actions Slot (Top Right) -->
    <template #actions>
      <button
        v-if="currentTab === 'widgets'"
        @click="saveJsonConfig"
        class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
        :disabled="!!jsonError"
        :class="{ 'opacity-50 cursor-not-allowed': !!jsonError }"
      >
        <Save class="w-4 h-4" />
        保存 JSON
      </button>
    </template>

    <!-- Tab: General -->
    <div v-if="currentTab === 'general'" class="space-y-6">
      <SettingsSection title="系统集成">
        <SettingsRow label="开机自启" description="随系统启动自动运行 ClassSidebar">
          <BaseSwitch v-model="autoLaunch" @update:model-value="toggleAutoLaunch" />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="调试工具">
        <SettingsRow label="测试工具路径" description="指定用于测试启动功能的外部程序路径">
          <div class="flex items-center gap-2 w-64">
            <BaseInput v-model="testPath" placeholder="e.g. notepad.exe" />
            <button
              @click="testLaunch"
              class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="测试启动"
            >
              <Play class="w-4 h-4" />
            </button>
          </div>
        </SettingsRow>
        <SettingsRow label="重置应用" description="清除所有本地配置并恢复默认状态">
          <button
            @click="resetConfig"
            class="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-200"
          >
            重置所有设置
          </button>
        </SettingsRow>
      </SettingsSection>
    </div>

    <!-- Tab: Appearance (Widgets) -->
    <div v-else-if="currentTab === 'widgets'" class="space-y-6">

      <!-- Visual Widget Manager -->
      <SettingsSection title="组件管理" description="拖拽排序或点击编辑来管理侧边栏组件">
        <WidgetManager />
      </SettingsSection>

      <!-- Advanced JSON Editor -->
      <SettingsSection title="高级配置 (JSON)" description="直接编辑配置文件以获得完全控制权">
        <div class="relative border-t border-slate-100">
          <textarea
            v-model="configJson"
            class="w-full h-[300px] p-4 font-mono text-xs leading-relaxed bg-slate-900 text-slate-300 focus:outline-none resize-y"
            spellcheck="false"
          ></textarea>
          <div
            v-if="jsonError"
            class="absolute bottom-4 right-4 px-3 py-1.5 bg-red-500/90 text-white text-xs rounded shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2"
          >
            {{ jsonError }}
          </div>
        </div>
      </SettingsSection>
    </div>

    <!-- Tab: About -->
    <div v-else-if="currentTab === 'about'" class="space-y-6">
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl flex items-center justify-center mb-6 text-white overflow-hidden">
          <img :src="appIcon" alt="Logo" class="w-full h-full object-cover" />
        </div>
        <h2 class="text-2xl font-bold text-slate-900">ClassSidebar</h2>
        <p class="text-slate-500 mt-2">专为现代化课堂设计的智能侧边栏</p>
        <div class="mt-8 flex items-center gap-4">
          <div class="px-4 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
            v{{ appVersion }}
          </div>
          <div class="px-4 py-1.5 bg-green-100 rounded-full text-xs font-medium text-green-700">
            Stable Channel
          </div>
        </div>
      </div>

      <SettingsSection title="开发团队">
        <SettingsRow label="tempChanghong" description="核心开发与维护">
          <a href="https://github.com/tempChanghong" target="_blank" class="text-sm text-blue-600 hover:underline">GitHub</a>
        </SettingsRow>
      </SettingsSection>
    </div>

  </SettingsLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Settings,
  LayoutGrid,
  Info,
  Play,
  Save
} from 'lucide-vue-next'
import SettingsLayout from '../components/ui/SettingsLayout.vue'
import SettingsSection from '../components/ui/SettingsSection.vue'
import SettingsRow from '../components/ui/SettingsRow.vue'
import BaseSwitch from '../components/ui/BaseSwitch.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import WidgetManager from '../components/settings/WidgetManager.vue'
import { useConfig } from '../composables/useConfig'
import appIcon from '../assets/icons.png' // 恢复图片导入

// --- State & Config ---
const { config, saveConfig } = useConfig()
const currentTab = ref('general')
const appVersion = ref('')
const autoLaunch = ref(false)
const testPath = ref('notepad.exe')
const configJson = ref('')
const jsonError = ref('')

// --- Tabs Definition ---
const tabs = [
  { id: 'general', label: '通用', icon: Settings },
  { id: 'widgets', label: '组件与外观', icon: LayoutGrid },
  { id: 'about', label: '关于', icon: Info }
]

// --- Lifecycle ---
onMounted(async () => {
  appVersion.value = await window.electronAPI.getAppVersion()
  const settings = await window.electronAPI.getLoginItemSettings()
  autoLaunch.value = settings.openAtLogin

  if (config.value) {
    configJson.value = JSON.stringify(config.value, null, 2)
  }
})

// --- Watchers ---
watch(config, (newVal) => {
  if (newVal) {
    try {
      const currentObj = JSON.parse(configJson.value)
      if (JSON.stringify(currentObj) !== JSON.stringify(newVal)) {
        configJson.value = JSON.stringify(newVal, null, 2)
      }
    } catch (e) {
      configJson.value = JSON.stringify(newVal, null, 2)
    }
  }
}, { deep: true })

watch(configJson, (newVal) => {
  try {
    JSON.parse(newVal)
    jsonError.value = ''
  } catch (e: unknown) {
    jsonError.value = e instanceof Error ? e.message : 'Invalid JSON format'
  }
})

// --- Actions ---
const toggleAutoLaunch = async (val: boolean) => {
  await window.electronAPI.setLoginItemSettings({
    openAtLogin: val,
    path: process.execPath
  })
  ElMessage.success(`开机自启已${val ? '开启' : '关闭'}`)
}

const testLaunch = () => {
  if (!testPath.value) return
  window.electronAPI.launchApp(testPath.value, [])
  ElMessage.info(`尝试启动: ${testPath.value}`)
}

const resetConfig = () => {
  ElMessageBox.confirm(
    '此操作将清除所有自定义设置和组件，恢复到初始状态。确定要继续吗？',
    '重置确认',
    {
      confirmButtonText: '确认重置',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        await window.electronAPI.resetConfig()
        ElMessage.success('应用已重置，正在重启...')
        // 延迟一下让用户看到提示
        setTimeout(() => {
          window.electronAPI.relaunchApp()
        }, 1500)
      } catch (e) {
        console.error('Reset failed:', e)
        ElMessage.error('重置失败')
      }
    })
    .catch(() => {
      // cancel
    })
}

const saveJsonConfig = async () => {
  if (jsonError.value) return
  try {
    const newConfig = JSON.parse(configJson.value)
    await saveConfig(newConfig)
    ElMessage.success('配置已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}
</script>
