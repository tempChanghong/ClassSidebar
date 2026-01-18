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
  if (props.item.command) {
    let cmd = props.item.command
    // Escape double quotes for the wrapper command
    const escapedCmd = cmd.replace(/"/g, '\\"')

    if (props.item.shell === 'powershell') {
        // PowerShell: Open new window, keep it open (-NoExit)
        // start "" is used to prevent the first quoted argument being interpreted as window title
        cmd = `start "" powershell -NoExit -Command "${escapedCmd}"`
    } else if (props.item.shell === 'bash') {
        // Bash: Open new window
        cmd = `start "" bash -c "${escapedCmd}; exec bash"`
    } else {
        // CMD (default): Open new window, keep it open (/k)
        cmd = `start "" cmd /k "${escapedCmd}"`
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
