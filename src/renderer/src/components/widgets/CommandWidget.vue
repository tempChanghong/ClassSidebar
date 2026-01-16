<template>
  <div
    class="launcher-item"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
    :title="item.command"
  >
    <div class="launcher-icon">
      <img v-if="item.icon" :src="item.icon" alt="icon" class="w-full h-full object-contain" />
      <div v-else class="launcher-icon-placeholder bg-purple-100 text-purple-500">
        <Terminal class="w-5 h-5" />
      </div>
    </div>
    <div class="launcher-info">
      <div class="launcher-name">{{ item.name || 'Command' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Terminal } from 'lucide-vue-next'
import type { CommandWidgetConfig } from '../../../../main/store'

const props = defineProps<{
  item: CommandWidgetConfig
  widgetIndex: number
}>()

const handleClick = () => {
  if (props.item.command) {
    let cmd = props.item.command
    if (props.item.shell === 'powershell') {
        cmd = `powershell -Command "${cmd.replace(/"/g, '\\"')}"`
    } else if (props.item.shell === 'bash') {
        cmd = `bash -c "${cmd.replace(/"/g, '\\"')}"`
    }
    window.electronAPI.executeCommand(cmd)
  }
}

const handleContextMenu = () => {
  window.electronAPI.showContextMenu({
    widgetIndex: props.widgetIndex,
    itemIndex: -1,
    target: props.item.command
  })
}
</script>

<style scoped>
.launcher-icon-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}
</style>
