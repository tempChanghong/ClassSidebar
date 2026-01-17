<template>
  <div class="toolbox-drawer-widget">
    <!-- 抽屉按钮 -->
    <div 
      class="toolbox-toggle"
      @click="toggleDrawer"
      :class="{ 'active': isOpen }"
    >
      <div class="toolbox-icon" v-html="icons.toolbox"></div>
    </div>

    <!-- 抽屉内容 -->
    <transition name="drawer">
      <div v-if="isOpen" class="drawer-content">
        <div class="drawer-header">
          <h3>系统工具</h3>
          <button class="close-btn" @click="toggleDrawer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="tools-grid">
          <div
            v-for="tool in tools"
            :key="tool.id"
            class="tool-item"
            @click="executeTool(tool.id)"
            :title="tool.label"
          >
            <div class="tool-icon" v-html="tool.icon"></div>
            <span class="tool-label">{{ tool.label }}</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)

// Icons (SVG strings)
const icons = {
  toolbox: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
  </svg>`,
  taskmgr: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>`,
  desktop: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
  </svg>`,
  terminal: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
  </svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.581-.495.644-.869l.214-1.281z" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>`,
  control: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.688.07 1.386.09 2.09.09h.75a4.5 4.5 0 100-9h-.75c-.704 0-1.402.03-2.09.09m-9.18 0c.688.07 1.386.09 2.09.09h.75a4.5 4.5 0 100-9h-.75c-.704 0-1.402.03-2.09.09m9.18 0c.688-.06 1.386-.09 2.09-.09h.75a4.5 4.5 0 110-9h-.75c-.704 0-1.402.03-2.09.09" />
  </svg>`,
  registry: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>`,
  services: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-6h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6" />
  </svg>`,
  device: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0-15V3m0 18V21m3.75-18v1.5m0-13.5V21m-9-1.5h12a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0012 3H3a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 003 21h12a2.25 2.25 0 002.25-2.25v-1.5m-1.5-15V21m0 0h3m-3 0h3" />
  </svg>`,
  gpedit: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5a3 3 0 013 3m0 0a3 3 0 11-6 0m3 3a3 3 0 100 6m0 0a3 3 0 110-6m-9.75 0H7.5a3 3 0 01-3 3m0 0a3 3 0 11-6 0m3 3a3 3 0 100 6m0 0a3 3 0 110-6m15.75-3h-3.375c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h3.375m-3.75-18h3.375c.621 0 1.125.504 1.125 1.125v17.25c0 .621-.504 1.125-1.125 1.125h-3.375m0-18h-3.375c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125h3.375m-3.75-18h-3.375c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125h3.375" />
  </svg>`
}

const tools = [
  { id: 'taskmgr', label: '任务管理器', icon: icons.taskmgr },
  { id: 'show-desktop', label: '返回桌面', icon: icons.desktop },
  { id: 'terminal', label: '终端', icon: icons.terminal },
  { id: 'control-panel', label: '控制面板', icon: icons.control },
  { id: 'regedit', label: '注册表编辑器', icon: icons.registry },
  { id: 'services', label: '服务', icon: icons.services },
  { id: 'devmgmt', label: '设备管理器', icon: icons.device },
  { id: 'gpedit', label: '组策略编辑器', icon: icons.gpedit }
]

const toggleDrawer = () => {
  isOpen.value = !isOpen.value
}

const executeTool = (toolId: string) => {
  console.log('[ToolboxDrawer] Executing tool:', toolId)
  window.electronAPI.executeSystemTool(toolId)
  isOpen.value = false
}
</script>

<style scoped>
.toolbox-drawer-widget {
  position: relative;
}

.toolbox-toggle {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.1);
}

.toolbox-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
}

.toolbox-toggle.active {
  background: rgba(255, 255, 255, 0.3);
}

.toolbox-icon {
  width: 24px;
  height: 24px;
  color: inherit;
}

.drawer-content {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  min-width: 280px;
  z-index: 1000;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.drawer-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1f2937;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.tool-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  transform: translateY(-2px);
}

.tool-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 8px;
  color: #4b5563;
}

.tool-label {
  font-size: 12px;
  color: #374151;
  text-align: center;
}

/* 抽屉动画 */
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.drawer-enter-to,
.drawer-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
