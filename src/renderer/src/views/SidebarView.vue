<template>
  <div
    class="sidebar-wrapper"
    @mousedown="onWrapperMouseDown"
    @touchstart="onWrapperTouchStart"
  >
    <!--
      sidebar-container: 侧边栏 **核心容器**
      ─────────────────────────────────────────────────────────────
      · 终极视觉微调 (提升底板厚度与精致排版):
        - !bg-white/[0.85]: 进一步提高白色底板不透明度，让奶白感极其扎实，不再过度透出底层杂色
        - antialiased: 全局平滑字体边缘，打造苹果系统级别的精美排版质感
        - backdrop-blur-2xl / backdrop-saturate-150: 保持强大的毛玻璃色彩穿透
        - border border-white/60: 明显的高光边缘折射
        - shadow-xl shadow-black/10: 柔和的底层阴影
        - !rounded-2xl: 统一顺滑的大圆角
    -->
    <div
      class="sidebar-container
             !bg-white/[0.85]
             backdrop-blur-2xl
             backdrop-saturate-150
             border border-white/60
             shadow-xl shadow-black/10
             !rounded-2xl
             antialiased
             overflow-hidden
             will-change-[width,height,border-radius]"
      ref="sidebarRef"
      :style="sidebarStyle"
    >
      <!-- ── 伪亚克力噪点层 ──────────────────────────────────────
           在 backdrop-filter 之后、在内容之前独立渲染。
           增加极具质感的高级拟物化微噪点
      ──────────────────────────────────────────────────────────── -->
      <div class="acrylic-noise absolute inset-0" aria-hidden="true" />
      <!-- ── 拖拽手柄 ─────────────────────────────────────────── -->
      <!--
        drag-handle：保持原有事件绑定。
        新增 group 类以便 GripHorizontal 响应 hover 状态变化。
      -->
      <div
        class="drag-handle group
               h-3 w-full
               flex items-center justify-center
               cursor-ns-resize
               hover:bg-black/5
               transition-colors duration-200"
        @mousedown="onDragHandleMouseDown"
        @touchstart="onDragHandleTouchStart"
      >
        <!--
          图标在 group-hover 时增强可见度，
          给用户更清晰的可拖拽提示
        -->
        <GripHorizontal
          class="w-4 h-4
                 text-slate-300 group-hover:text-slate-400
                 transition-colors duration-200"
        />
      </div>

      <!-- ── 内容区（Widget 列表 + 标题栏） ─────────────────────
           sidebar-content-area 在 body.expanded 状态下可见。
           animate-slide-up：侧边栏展开时子内容以 translateY(10px)→0
           + fade-in 的 0.2s 动画出现，对应 cankao/common.css 的
           widget-list 展开效果。
           transition-content：后续内部面板切换时的过渡底座。
      ──────────────────────────────────────────────────────────── -->
      <div
        class="widgets-container
               pt-1 px-0
               animate-slide-up
               transition-content"
      >
        <!-- 标题栏 -->
        <div class="flex justify-between items-center mb-4">
          <!--
            标题文字：终极视觉微调，采用 font-extrabold 和 tracking-tight 强化现代感，
            并使用高对比度 text-slate-800。
          -->
          <h2 class="text-xl font-extrabold tracking-tight text-slate-800 select-none">
            {{ displayTitle }}
          </h2>

          <!--
            设置按钮：保持 .settings-button scoped 样式不变，
            仅追加 press-active 工具类（base.css @layer utilities），
            实现 :active scale(0.97) 按压微反馈。
          -->
          <button
            class="settings-button press-active"
            @click="openSettings"
            title="设置"
          >
            <Settings class="w-4 h-4" />
          </button>
        </div>

        <!-- Widget 宿主区域 -->
        <div id="widget-container">
          <WidgetHost
            v-if="store.config && store.config.widgets"
            :widgets="store.config.widgets"
          />
          <!--
            加载占位：保留原有 widget-list 类以承接 grid 布局，
            追加淡入动画。
          -->
          <div v-else class="widget-list animate-fade-in">
            <p class="text-sm text-txt-muted col-span-full text-center py-4">
              正在加载配置...
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useSidebarStore } from '../stores/sidebarStore'
import WidgetHost from '../components/widgets/WidgetHost.vue'
import { Settings, GripHorizontal } from 'lucide-vue-next'
import { useSidebarInteraction } from '../composables/useSidebarInteraction'

const store = useSidebarStore()
const sidebarRef = ref<HTMLElement | null>(null)

const currentTime = ref(new Date())
let timer: ReturnType<typeof setInterval>

const displayTitle = computed(() => {
  const c = store.config
  if (!c) return 'Sidebar'
  if (c.sidebarTitleType === 'time') {
    return currentTime.value.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  if (c.sidebarTitleType === 'date') {
    return currentTime.value.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' })
  }
  if (c.sidebarTitleType === 'datetime') {
    return currentTime.value.toLocaleString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })
  }
  return c.sidebarCustomText || 'Sidebar'
})

// 使用 Composable 提取交互逻辑（保持不变）
const {
    sidebarStyle,
    onWrapperMouseDown,
    onWrapperTouchStart,
    onDragHandleMouseDown,
    onDragHandleTouchStart
} = useSidebarInteraction(
  sidebarRef
)

function openSettings() {
  window.electronAPI.openSettings()
}

onMounted(() => {
  store.loadConfig()
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
/* ── 设置按钮（保持原有样式不变） ────────────────────────────── */
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

/* ── Widget 网格布局（保持原有）────────────────────────────────
   :deep 深度选择器，覆盖 WidgetHost 内部的 grid 布局
────────────────────────────────────────────────────────────── */
:deep(.widget-list) {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  width: 100%;
}

:deep(.widget-wrapper) {
  /* 每个 widget-wrapper 作为 grid item 存在，特殊组件可在此扩展 */
}

:deep(.col-span-full) {
  grid-column: 1 / -1;
}

/* ── 侧边栏内容区进场动画增强 ────────────────────────────────
   body.expanded 时 .widgets-container 重播 animate-slide-up。
   CSS 实现：非 expanded 状态隐藏 + 取消动画，
   expanded 状态重启动画（通过取消再重赋 animation-name 实现）。
   原 JS 控制的 opacity 通过 sidebarStyle 中 currentOpacity 驱动，
   这里的 CSS 仅在内容区提供额外的位移入场效果。
────────────────────────────────────────────────────────────── */
.widgets-container {
  opacity: 0;
  pointer-events: none;
  transform: translateY(8px);
  transition: opacity var(--content-duration) ease,
              transform var(--content-duration) ease;
}

/* body.expanded 由 useSidebarInteraction.expand() 添加 */
:global(body.expanded) .widgets-container {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

/* ── 伪亚克力容器强化 ────────────────────────────────────────
   使用 Tailwind 类控制背景和模糊，此处保留内阴影高光以增强玻璃边缘质感
──────────────────────────────────────────────────────────── */
.sidebar-container {
  /* 物理玻璃边缘：顶部高光内阴影增强玻璃折射感，配合 Tailwind 的 shadow-2xl 使用 */
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.20), var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
</style>
