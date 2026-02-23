<template>
  <BaseWidget
    :name="item.name || 'Command'"
    :title="item.command"
    :icon="item.icon"
    :default-icon="Terminal"
    :layout="item.layout || 'grid'"
    placeholder-class="bg-purple-100 text-purple-500"
    @click="handleClick"
    @contextmenu="handleContextMenu"
  />
</template>

<script setup lang="ts">
import { Terminal } from 'lucide-vue-next'
import type { CommandWidgetConfig } from '../../../../main/store'
import BaseWidget from './BaseWidget.vue'

const props = defineProps<{
  item: CommandWidgetConfig
  widgetIndex: number
}>()

const handleClick = () => {
  const rawCmd = props.item.command?.trim()
  if (!rawCmd) return

  try {
    // Escape double quotes for the wrapper command
    const escapedCmd = rawCmd.replace(/"/g, '\\"')
    let cmd: string

    if (props.item.shell === 'powershell') {
      // PowerShell: Open new window, keep it open (-NoExit)
      cmd = `start "" powershell -NoExit -Command "${escapedCmd}"`
    } else if (props.item.shell === 'bash') {
      // Bash: Open new window
      cmd = `start "" bash -c "${escapedCmd}; exec bash"`
    } else {
      // CMD (default): Open new window, keep it open (/k)
      cmd = `start "" cmd /k "${escapedCmd}"`
    }

    window.electronAPI.executeCommand(cmd)
  } catch (e) {
    console.error('[CommandWidget] Failed to execute command:', e)
  }
}

const handleContextMenu = () => {
  try {
    window.electronAPI.showContextMenu({
      widgetIndex: props.widgetIndex,
      itemIndex: -1,
      target: props.item.command
    })
  } catch (e) {
    console.error('[CommandWidget] Failed to show context menu:', e)
  }
}
</script>
