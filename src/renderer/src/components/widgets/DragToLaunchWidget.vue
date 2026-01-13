<template>
  <div
    class="drag-to-launch"
    :class="{ 'drag-over': isDragOver }"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
      <div class="launcher-icon-placeholder">🚀</div>
      <div style="font-size: 13px; color: #4b5563; font-weight: 500;">拖拽文件到此处运行</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  config: any
}>()

const isDragOver = ref(false)

const onDragOver = () => {
  isDragOver.value = true
}

const onDragLeave = () => {
  isDragOver.value = false
}

const onDrop = async (e: DragEvent) => {
  isDragOver.value = false

  if (e.dataTransfer && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0]
    // 使用 preload 中提供的 getFilePath 解决 Context Isolation 问题
    const filePath = window.electronAPI.getFilePath(file)

    if (filePath) {
      // 构建命令
      // 如果配置中有 command_template，则替换 {path}
      // 否则直接运行文件
      let command = filePath
      if (props.config.command_template) {
        command = props.config.command_template.replace('{path}', `"${filePath}"`)
      } else if (props.config.command_prefix) {
        command = `${props.config.command_prefix} "${filePath}"`
      } else {
        // 默认直接打开
        window.electronAPI.launchApp(filePath, [])
        return
      }

      window.electronAPI.executeCommand(command)
    }
  }
}
</script>
