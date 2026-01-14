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
        保存配置
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
      <SettingsSection title="快速添加组件" description="点击下方按钮将预设组件添加到侧边栏">
        <div class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <button
            v-for="action in widgetActions"
            :key="action.label"
            @click="action.handler"
            class="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
          >
            <component :is="action.icon" class="w-6 h-6 mb-2 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900">{{ action.label }}</span>
          </button>
        </div>
      </SettingsSection>

      <SettingsSection title="高级配置 (JSON)" description="直接编辑配置文件以获得完全控制权">
        <div class="relative border-t border-slate-100">
          <textarea
            v-model="configJson"
            class="w-full h-[400px] p-4 font-mono text-xs leading-relaxed bg-slate-900 text-slate-300 focus:outline-none resize-y"
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
        <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl flex items-center justify-center mb-6 text-white">
          <Sidebar class="w-10 h-10" />
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
import { ElMessage } from 'element-plus'
import {
  Settings,
  LayoutGrid,
  Info,
  Play,
  Save,
  Sidebar,
  AppWindow,
  Volume2,
  FolderOpen,
  MousePointerClick,
  GraduationCap,
  Shuffle
} from 'lucide-vue-next'
import SettingsLayout from '../components/ui/SettingsLayout.vue'
import SettingsSection from '../components/ui/SettingsSection.vue'
import SettingsRow from '../components/ui/SettingsRow.vue'
import BaseSwitch from '../components/ui/BaseSwitch.vue'
import BaseInput from '../components/ui/BaseInput.vue'
import { useConfig } from '../composables/useConfig'

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
  } catch (e: any) {
    jsonError.value = e.message
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
  ElMessage.warning('重置功能暂未完全实现')
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

// --- Widget Helpers ---
const addWidgetToConfig = async (widget: any) => {
  try {
    const currentConfig = config.value ? JSON.parse(JSON.stringify(config.value)) : { widgets: [] }
    if (!currentConfig.widgets) currentConfig.widgets = []
    currentConfig.widgets.push(widget)
    await saveConfig(currentConfig)
    ElMessage.success('组件已添加')
  } catch (e) {
    console.error(e)
    ElMessage.error('添加组件失败')
  }
}

const widgetActions = [
  {
    label: '启动器',
    icon: AppWindow,
    handler: () => addWidgetToConfig({
      type: 'launcher',
      layout: 'grid',
      targets: [{ name: '示例应用', target: 'notepad.exe' }]
    })
  },
  {
    label: '音量条',
    icon: Volume2,
    handler: () => addWidgetToConfig({ type: 'volume_slider' })
  },
  {
    label: '文件夹',
    icon: FolderOpen,
    handler: () => addWidgetToConfig({
      type: 'files',
      folder_path: 'C:\\Users\\Public\\Desktop',
      max_count: 10
    })
  },
  {
    label: '拖拽启动',
    icon: MousePointerClick,
    handler: () => addWidgetToConfig({
      type: 'drag_to_launch',
      command_template: '"{path}"'
    })
  },
  {
    label: 'ClassIsland',
    icon: GraduationCap,
    handler: () => addWidgetToConfig({
      type: 'launcher',
      layout: 'grid',
      targets: [
        { name: 'ClassIsland', target: 'classisland://app', icon: 'classisland.exe' },
        { name: 'CI 换课', target: 'classisland://app/class-swap', icon: 'classisland.exe' }
      ]
    })
  },
  {
    label: 'SecRandom',
    icon: Shuffle,
    handler: () => addWidgetToConfig({
      type: 'launcher',
      layout: 'grid',
      targets: [
        { name: 'SecRandom', target: 'secrandom://app', icon: 'secrandom.exe' },
        { name: '随机点名', target: 'secrandom://pumping', icon: 'secrandom.exe' }
      ]
    })
  }
]
</script>
