<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <SettingsSection title="系统集成">
      <SettingsRow label="开机自启" description="随系统启动自动运行 ClassSidebar">
        <BaseSwitch v-model="autoLaunch" @update:model-value="toggleAutoLaunch" />
      </SettingsRow>
    </SettingsSection>

    <SettingsSection title="调试工具">
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
    </SettingsSection>

    <SettingsSection title="日志设置">
      <LogSettings />
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Play } from 'lucide-vue-next'
import SettingsSection from '../ui/SettingsSection.vue'
import SettingsRow from '../ui/SettingsRow.vue'
import BaseSwitch from '../ui/BaseSwitch.vue'
import BaseInput from '../ui/BaseInput.vue'
import BaseButton from '../ui/BaseButton.vue'
import LogSettings from './LogSettings.vue'

const autoLaunch = ref(false)
const testPath = ref('notepad.exe')

onMounted(async () => {
  const settings = await window.electronAPI.getLoginItemSettings()
  autoLaunch.value = settings.openAtLogin
})

const toggleAutoLaunch = async (val: boolean) => {
  await window.electronAPI.setLoginItemSettings({
    openAtLogin: val,
    path: process.execPath // 注意: 如果在开发模式可能不准，但生产模式是对的
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
