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
      <div class="widgets-container">
        <h2>Sidebar</h2>
        <button class="settings-button" @click="openSettings" title="设置">
          <Settings class="w-4 h-4" />
        </button>

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
import { Settings } from 'lucide-vue-next'
import { useSidebarInteraction } from '../composables/useSidebarInteraction'

const store = useSidebarStore()
const wrapperRef = ref<HTMLElement | null>(null)
const sidebarRef = ref<HTMLElement | null>(null)

// 使用 Composable 提取交互逻辑
const { sidebarStyle, onWrapperMouseDown, onWrapperTouchStart } = useSidebarInteraction(
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
