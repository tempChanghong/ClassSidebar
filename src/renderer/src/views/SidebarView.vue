<template>
  <div
    class="sidebar-wrapper"
    ref="wrapperRef"
    @mousedown="onWrapperMouseDown"
    @touchstart="onWrapperTouchStart"
  >
    <div
      class="sidebar-container"
      ref="sidebarRef"
      :style="sidebarStyle"
    >
      <!-- 拖拽手柄 -->
      <div
        class="drag-handle h-3 w-full flex items-center justify-center cursor-ns-resize hover:bg-black/5 transition-colors"
        @mousedown="onDragHandleMouseDown"
        @touchstart="onDragHandleTouchStart"
      >
        <GripHorizontal class="w-4 h-4 text-slate-400" />
      </div>

      <div class="widgets-container pt-1">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-slate-800">Sidebar</h2>
            <button class="settings-button" @click="openSettings" title="设置">
              <Settings class="w-4 h-4" />
            </button>
        </div>

        <div id="widget-container">
           <WidgetHost
             v-if="store.config && store.config.widgets"
             :widgets="store.config.widgets"
           />
           <div v-else class="widget-list">
              <p>正在加载配置...</p>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSidebarStore } from '../stores/sidebarStore'
import WidgetHost from '../components/widgets/WidgetHost.vue'
import { Settings, GripHorizontal } from 'lucide-vue-next'
import { useSidebarInteraction } from '../composables/useSidebarInteraction'

const store = useSidebarStore()
const wrapperRef = ref<HTMLElement | null>(null)
const sidebarRef = ref<HTMLElement | null>(null)

// 使用 Composable 提取交互逻辑
const {
    sidebarStyle,
    onWrapperMouseDown,
    onWrapperTouchStart,
    onDragHandleMouseDown,
    onDragHandleTouchStart
} = useSidebarInteraction(
  wrapperRef,
  sidebarRef
)

function openSettings() {
  window.electronAPI.openSettings()
}

onMounted(() => {
  store.loadConfig()
})
</script>

<style scoped>
/* 保留原有样式，Tailwind 类名已在模板中直接使用 */
.settings-button {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    transition: all 0.2s ease;
}
.settings-button:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
}

/* 全局网格布局样式 - 覆盖 WidgetHost 中的样式 */
:deep(.widget-list) {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 强制3列 */
  gap: 0.5rem; /* 调整间距 */
  width: 100%;
}

/* 让某些组件跨越所有列 (如音量滑块、文件列表等) */
:deep(.widget-wrapper) {
  /* 默认情况下，每个 widget-wrapper 也是一个 grid item */
  /* 如果需要特定组件占满一行，可以在这里或组件内部指定 */
}

/* 特殊处理：如果组件本身需要占满一行 */
:deep(.col-span-full) {
  grid-column: 1 / -1;
}
</style>
