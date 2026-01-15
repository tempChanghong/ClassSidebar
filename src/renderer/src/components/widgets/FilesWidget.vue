<template>
  <div class="launcher-group compact-files layout-vertical">
    <div
      v-for="file in files"
      :key="file.path"
      class="launcher-item"
      @click="openFile(file)"
      @contextmenu.prevent="handleContextMenu(file)"
      :title="file.name"
    >
      <div class="launcher-icon">
        <img v-if="file.icon" :src="file.icon" alt="icon" />
        <div v-else class="launcher-icon-placeholder">📄</div>
      </div>
      <div class="launcher-info">
        <div class="launcher-name">{{ file.name }}</div>
      </div>
    </div>
    <div v-if="files.length === 0" style="padding: 8px; color: #666; font-size: 12px;">
      文件夹为空或不存在
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  config: any
}>()

interface FileItem {
  name: string
  path: string
  icon?: string
}

const files = ref<FileItem[]>([])

const loadFiles = async () => {
  if (!props.config.folder_path) return

  try {
    const maxCount = props.config.max_count || 10
    const fileList = await window.electronAPI.getFilesInFolder(props.config.folder_path, maxCount)

    // 并行加载图标
    const filesWithIcons = await Promise.all(fileList.map(async (f: any) => {
      let icon = ''
      try {
        const iconResult = await window.electronAPI.getFileIcon(f.path)
        if (iconResult) {
          icon = iconResult
        }
      } catch (e) {
        // ignore icon error
      }
      return {
        name: f.name,
        path: f.path,
        icon
      }
    }))

    files.value = filesWithIcons
  } catch (e) {
    console.error('Failed to load files', e)
  }
}

onMounted(loadFiles)
watch(() => props.config.folder_path, loadFiles)

const openFile = (file: FileItem) => {
  console.log('[FilesWidget] Opening file:', file.path)
  // 确保传递的是普通数组
  window.electronAPI.launchApp(file.path, [])
}

const handleContextMenu = (file: FileItem) => {
  window.electronAPI.showContextMenu({
    target: file.path
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
  font-size: 12px;
}
</style>
