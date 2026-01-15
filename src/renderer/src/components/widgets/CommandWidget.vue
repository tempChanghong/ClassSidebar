<template>
  <div
    class="launcher-item"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
    :title="item.name || item.command"
  >
    <div class="launcher-icon">
      <img v-if="item.icon" :src="item.icon" alt="icon" />
      <div v-else class="launcher-icon-placeholder">💻</div>
    </div>
    <div class="launcher-info">
      <div class="launcher-name">{{ item.name || 'Command' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import type { WidgetConfig } from '../../../../main/store'

const props = defineProps<{
  item: WidgetConfig
  widgetIndex: number
  itemIndex: number
}>()

const handleClick = () => {
  if (props.item.command) {
    // 如果指定了 shell，可能需要特殊处理，目前简单调用 executeCommand
    // 注意：executeCommand 目前在 preload 中定义为 ipcRenderer.send('execute-command', command)
    // 主进程中使用 exec(command)
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
    itemIndex: props.itemIndex,
    target: props.item.command // 仅用于标识
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
  background: #f3e8ff;
  color: #9333ea;
  font-weight: bold;
  font-size: 16px;
}
</style>
