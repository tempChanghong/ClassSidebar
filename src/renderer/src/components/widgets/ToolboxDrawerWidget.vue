<template>
  <BaseWidget
    :name="config.name || '工具箱'"
    :title="config.name"
    :icon="config.icon"
    :default-icon="Folder"
    :layout="config.layout || 'grid'"
    :class="['grid-item', { 'active': isOpen }]"
    @click="toggleDrawer"
  >
    <template #icon v-if="!config.icon">
      <div class="widget-icon">
        <Folder class="w-full h-full" />
      </div>
    </template>
  </BaseWidget>

  <Teleport to=".sidebar-container">
    <transition name="drawer">
      <div v-if="isOpen" class="toolbox-drawer">
        <div class="drawer-header">
          <h3>{{ config.name || '工具箱' }}</h3>
          <button class="close-btn" @click="toggleDrawer">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="tools-grid">
          <template v-for="(child, index) in config.children" :key="child.id || index">
            <!-- Reuse existing widgets but render them as grid items inside drawer -->
            <div class="drawer-item-wrapper">
               <!-- We need to render the child widget.
                    Since we can't easily recurse WidgetHost here without circular dependency issues or complex setup,
                    we'll render a simplified version or use dynamic component if possible.
                    For now, let's manually handle the common types supported in presets (URL, Launcher).
               -->

               <div
                 class="tool-item relative overflow-hidden"
                 @click="handleChildClick(child)"
                 :title="child.name"
               >
                  <div class="tool-icon">
                    <img v-if="child.icon && !child.icon.startsWith('fa-') && (child.icon.includes('/') || child.icon.includes('.'))" :src="child.icon" class="w-full h-full object-contain" />
                    <i v-else-if="child.icon && child.icon.startsWith('fa-')" :class="child.icon"></i>
                    <component v-else-if="child.icon && getIconComponent(child.icon)" :is="getIconComponent(child.icon)" class="w-full h-full" />
                    <component v-else :is="getIconForType(child.type)" class="w-full h-full" />
                  </div>
                  <span class="tool-label font-bold">{{ child.name }}</span>
               </div>
            </div>
          </template>

          <div v-if="!config.children || config.children.length === 0" class="col-span-2 text-center text-slate-400 text-sm py-4">
            空文件夹
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Folder, X, Globe, AppWindow, Terminal, Volume2, MousePointerClick, Settings, RefreshCw, User, Zap, PlayCircle } from 'lucide-vue-next'
import type { DrawerWidgetConfig, WidgetConfig } from '../../../../main/store'
import BaseWidget from './BaseWidget.vue'

defineProps<{
  config: DrawerWidgetConfig
}>()

const isOpen = ref(false)

const toggleDrawer = () => {
  isOpen.value = !isOpen.value
}

const getIconForType = (type: string) => {
  switch (type) {
    case 'launcher': return AppWindow
    case 'url': return Globe
    case 'command': return Terminal
    case 'volume_slider': return Volume2
    case 'drag_to_launch': return MousePointerClick
    case 'system_tools': return Settings
    default: return AppWindow
  }
}

// Helper to map icon names (from presets) to Lucide components
// This is needed because we store icon names as strings in the config for presets
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'refresh-cw': return RefreshCw
    case 'user': return User
    case 'zap': return Zap
    case 'play-circle': return PlayCircle
    case 'tool': return Settings
    default: return null
  }
}

const handleChildClick = (child: WidgetConfig) => {
  // Execute the child widget's action
  switch (child.type) {
    case 'url':
      if (child.url) window.electronAPI.openExternal(child.url)
      break
    case 'launcher':
      if (child.target) {
        const args = child.args ? JSON.parse(JSON.stringify(child.args)) : []
        window.electronAPI.launchApp(child.target, args)
      }
      break
    case 'command':
      if (child.command) {
        let cmd = child.command
        const escapedCmd = cmd.replace(/"/g, '\\"')
        if (child.shell === 'powershell') {
            cmd = `start "" powershell -NoExit -Command "${escapedCmd}"`
        } else if (child.shell === 'bash') {
            cmd = `start "" bash -c "${escapedCmd}; exec bash"`
        } else {
            cmd = `start "" cmd /k "${escapedCmd}"`
        }
        window.electronAPI.executeCommand(cmd)
      }
      break
    // Add other types if needed
  }

  // Optional: Close drawer after click? SystemTools closes after 500ms.
  // Let's keep it open for now as it might be a folder of apps.
  // Or maybe close it for "actions" like URL/Command but keep for others?
  // For consistency with SystemTools, let's close it with a small delay if it's an action.
  if (['url', 'launcher', 'command'].includes(child.type)) {
     setTimeout(() => {
       isOpen.value = false
     }, 300)
  }
}
</script>

<style scoped>
.widget-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #334155;
}

/* 抽屉样式 - 复用 SystemTools 的设计 */
.toolbox-drawer {
  position: absolute;
  inset: 0;
  background: rgba(243, 244, 246, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  z-index: 50;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.drawer-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1f2937;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  overflow-y: auto;
  padding: 16px;
  flex: 1;
}

.tool-item {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(0, 0, 0, 0.05);
  min-height: 80px;
}

.tool-item:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
}

.tool-icon {
  width: 28px;
  height: 28px;
  color: #4b5563;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tool-label {
  font-size: 12px;
  color: #374151;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 滚动条样式 */
.tools-grid::-webkit-scrollbar {
  width: 4px;
}

.tools-grid::-webkit-scrollbar-track {
  background: transparent;
}

.tools-grid::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.tools-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 抽屉动画 */
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
</style>
