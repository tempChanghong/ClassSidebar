<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <SettingsSection title="系统集成">
      <SettingsRow 
        label="开机自启" 
        :description="autoLaunchDisabled ? '随系统启动自动运行 ClassSidebar (开发模式下不可用)' : '随系统启动自动运行 ClassSidebar'"
      >
        <BaseSwitch 
          v-model="autoLaunch" 
          :disabled="autoLaunchDisabled"
          @update:model-value="toggleAutoLaunch" 
        />
      </SettingsRow>
    </SettingsSection>

    <SettingsSection title="高级/调试 (Advanced/Debug)" description="系统级调试与管理工具">
      <div class="grid grid-cols-2 gap-4 w-full">
        <BaseButton @click="openConfigFolder" variant="secondary" class="w-full justify-start text-left bg-slate-100 hover:bg-slate-200 text-slate-700">
          <FolderOpen class="w-4 h-4 mr-2" />
          打开配置文件夹
        </BaseButton>
        <BaseButton @click="debugShowOnboarding" variant="secondary" class="w-full justify-start text-left bg-indigo-50 hover:bg-indigo-100 text-indigo-700">
          <Rocket class="w-4 h-4 mr-2" />
          手动测试引导页面 (Onboarding)
        </BaseButton>
        <BaseButton @click="clearAppCache" variant="secondary" class="w-full justify-start text-left bg-slate-100 hover:bg-slate-200 text-slate-700">
          <Trash2 class="w-4 h-4 mr-2" />
          清除应用缓存
        </BaseButton>
        <BaseButton @click="openMainDevTools" variant="secondary" class="w-full justify-start text-left bg-slate-100 hover:bg-slate-200 text-slate-700">
          <Terminal class="w-4 h-4 mr-2" />
          主窗口 DevTools
        </BaseButton>
        <BaseButton @click="openSettingsDevTools" variant="secondary" class="w-full justify-start text-left bg-slate-100 hover:bg-slate-200 text-slate-700">
          <Terminal class="w-4 h-4 mr-2" />
          设置页 DevTools
        </BaseButton>
        <BaseButton @click="forceRelaunchApp" variant="secondary" class="w-full justify-start text-left bg-orange-100 hover:bg-orange-200 text-orange-700 hover:text-orange-800 transition-colors">
          <RefreshCw class="w-4 h-4 mr-2" />
          强制重启应用
        </BaseButton>
        <BaseButton @click="forceQuitApp" variant="danger" class="w-full justify-start text-left bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 transition-colors">
          <Power class="w-4 h-4 mr-2" />
          完全退出应用
        </BaseButton>
      </div>

      <div class="mt-6 space-y-4 pt-4 border-t border-slate-100">
        <SettingsRow label="测试工具路径" description="指定用于测试启动功能的外部程序路径">
          <div class="flex items-center gap-2 w-64">
            <BaseInput v-model="testPath" placeholder="e.g. notepad.exe" />
            <BaseButton
              @click="testLaunch"
              variant="ghost"
              title="测试启动"
              class="p-2!"
            >
              <Play class="w-4 h-4" />
            </BaseButton>
          </div>
        </SettingsRow>
        <SettingsRow label="重置应用" description="清除所有本地配置并恢复默认状态">
          <BaseButton
            @click="resetConfig"
            variant="danger"
            size="sm"
          >
            重置所有设置
          </BaseButton>
        </SettingsRow>
      </div>
    </SettingsSection>

    <SettingsSection title="日志设置">
      <LogSettings />
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Play, FolderOpen, Terminal, RefreshCw, Trash2, Power, Rocket } from 'lucide-vue-next'
import SettingsSection from '../ui/SettingsSection.vue'
import SettingsRow from '../ui/SettingsRow.vue'
import BaseSwitch from '../ui/BaseSwitch.vue'
import BaseInput from '../ui/BaseInput.vue'
import BaseButton from '../ui/BaseButton.vue'
import LogSettings from './LogSettings.vue'

const autoLaunch = ref(false)
const autoLaunchDisabled = ref(false)
const testPath = ref('notepad.exe')

onMounted(async () => {
  const settings = await window.electronAPI.getLoginItemSettings()
  autoLaunch.value = settings.openAtLogin
  autoLaunchDisabled.value = settings.isDisabled ?? false
})

const toggleAutoLaunch = async (val: boolean) => {
  if (autoLaunchDisabled.value) {
    ElMessage.warning('开发模式下不可用开机自启功能')
    autoLaunch.value = false
    return
  }

  const res = await window.electronAPI.setLoginItemSettings({
    openAtLogin: val,
    path: process.execPath // 注意: 如果在开发模式可能不准，但生产模式是对的
  })
  
  if (res.isDisabled) {
    ElMessage.warning('开发模式下无法设置开机自启')
    autoLaunchDisabled.value = true
    autoLaunch.value = false
  } else {
    ElMessage.success(`开机自启已${val ? '开启' : '关闭'}`)
  }
}

const debugShowOnboarding = () => {
  window.electronAPI.debugShowOnboarding()
  ElMessage.info('已发送唤起引导页指令。请查看主进程控制台日志。')
}

const openConfigFolder = async () => {
  const res = await window.electronAPI.openConfigFolder()
  if (!res.success) {
    ElMessage.error(`打开失败: ${res.error}`)
  }
}

const clearAppCache = async () => {
  const res = await window.electronAPI.clearCache()
  if (res.success) {
    ElMessage.success('应用缓存清理成功')
  } else {
    ElMessage.error(`缓存清理失败: ${res.error}`)
  }
}

const openMainDevTools = () => {
  window.electronAPI.openDevTools('main')
}

const openSettingsDevTools = () => {
  window.electronAPI.openDevTools('settings')
}

const forceRelaunchApp = () => {
  window.electronAPI.relaunchApp()
}

const forceQuitApp = () => {
  window.electronAPI.quitApp()
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
        setTimeout(() => {
          window.electronAPI.relaunchApp()
        }, 1500)
      } catch (e) {
        console.error('Reset failed:', e)
        ElMessage.error('重置失败')
      }
    })
    .catch(() => {})
}
</script>
