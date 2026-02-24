<template>
  <div class="widget-list">
    <template v-if="widgets && widgets.length > 0">
      <template v-for="(widget, index) in widgets" :key="widget.id">

        <!-- 每个 Widget 都被独立的错误边界包裹 -->
        <!-- 使用 widget.id 作为 key 重置错误边界状态 -->
        <!--
          widget-entry: 触发交错入场动画。
          --widget-index 驱动 animation-delay，每个 Widget 依次
          以 40ms 间隔滑入，形成层叠瀑布感（最多 8 级，防止末尾
          等待时间过长）。
        -->
        <WidgetErrorBoundary
          :widget-id="widget.id"
          :widget-type="widget.type"
          class="widget-entry"
          :style="{ '--widget-index': Math.min(index, 8) }"
        >

          <!-- Launcher -->
          <LauncherWidget
            v-if="widget.type === 'launcher'"
            :item="widget"
            :widgetIndex="index"
            :class="widget.layout === 'vertical' ? 'col-span-full' : 'grid-item'"
          />

          <!-- URL -->
          <UrlWidget
            v-else-if="widget.type === 'url'"
            :item="widget"
            :widgetIndex="index"
            :class="widget.layout === 'vertical' ? 'col-span-full' : 'grid-item'"
          />

          <!-- Command -->
          <CommandWidget
            v-else-if="widget.type === 'command'"
            :item="widget"
            :widgetIndex="index"
            :class="widget.layout === 'vertical' ? 'col-span-full' : 'grid-item'"
          />

          <!-- Volume Slider (Full Width) -->
          <div v-else-if="widget.type === 'volume_slider'" class="col-span-full">
             <VolumeWidget />
          </div>

          <!-- Files Widget (Full Width) -->
          <div v-else-if="widget.type === 'files'" class="col-span-full">
             <FilesWidget :config="widget" />
          </div>

          <!-- Drag to Launch (Full Width) -->
          <div v-else-if="widget.type === 'drag_to_launch'" class="col-span-full">
             <DragToLaunchWidget :config="widget" />
          </div>

          <!-- System Tools -->
          <SystemToolsWidget
            v-else-if="widget.type === 'system_tools'"
            :config="widget"
            :class="widget.layout === 'vertical' ? 'col-span-full' : 'grid-item'"
          />

          <!-- Drawer Widget -->
          <ToolboxDrawerWidget
            v-else-if="widget.type === 'drawer'"
            :config="widget"
            class="grid-item"
          />

          <!-- Fallback for unknown types -->
          <div v-else class="p-2 bg-red-50 text-red-500 text-xs rounded col-span-full">
            Unknown type: {{ (widget as any).type }}
          </div>

        </WidgetErrorBoundary>

      </template>
    </template>

    <!-- Empty State -->
    <div v-else class="col-span-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
      <Inbox class="w-8 h-8" />
      <p class="text-sm font-medium">侧边栏为空</p>
      <p class="text-xs">点击右下角设置按钮添加组件</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, defineComponent, h } from 'vue'
import { Inbox, AlertTriangle } from 'lucide-vue-next'
import LauncherWidget from './LauncherWidget.vue'
import VolumeWidget from './VolumeWidget.vue'
import FilesWidget from './FilesWidget.vue'
import DragToLaunchWidget from './DragToLaunchWidget.vue'
import UrlWidget from './UrlWidget.vue'
import CommandWidget from './CommandWidget.vue'
import SystemToolsWidget from './SystemToolsWidget.vue'
import ToolboxDrawerWidget from './ToolboxDrawerWidget.vue'
import type { WidgetConfig } from '../../../../main/store'

defineProps<{
  widgets: WidgetConfig[]
}>()

// ─────────────────────────────────────────────────────────────────
// WidgetErrorBoundary — 每个 Widget 实例独立的错误边界
// 内联在此文件中，无需新建文件。
// ─────────────────────────────────────────────────────────────────
const WidgetErrorBoundary = defineComponent({
  name: 'WidgetErrorBoundary',

  props: {
    widgetId: {
      type: String,
      required: true
    },
    widgetType: {
      type: String,
      required: true
    }
  },

  setup(props, { slots }) {
    const hasError = ref(false)
    const errorMessage = ref('')

    // 捕获来自子树（具体 Widget 组件）的任何渲染/逻辑错误
    onErrorCaptured((err: unknown, _instance, info: string) => {
      const message = err instanceof Error ? err.message : String(err)
      hasError.value = true
      errorMessage.value = message

      console.error(
        `[WidgetErrorBoundary] Widget crashed — id="${props.widgetId}", type="${props.widgetType}", info="${info}":`,
        err
      )

      // 返回 false：阻止错误继续向上冒泡，防止影响其他 Widget
      return false
    })

    const reset = () => {
      hasError.value = false
      errorMessage.value = ''
    }

    return () => {
      if (hasError.value) {
        // ── 降级 UI (Fallback UI) ────────────────────────────────
        return h(
          'div',
          {
            class: [
              'grid-item relative flex flex-col items-center justify-center gap-1',
              'h-20 rounded-lg p-2 text-center cursor-pointer select-none',
              'border border-red-500/30 bg-red-50/60',
              'transition-colors hover:bg-red-100/60'
            ],
            title: `组件错误: ${errorMessage.value}`,
            onClick: reset
          },
          [
            h(AlertTriangle, { class: 'w-5 h-5 text-red-400 shrink-0' }),
            h('p', { class: 'text-[10px] font-medium text-red-500 leading-tight' }, '组件异常'),
            h(
              'p',
              { class: 'text-[9px] text-red-400 leading-tight truncate max-w-full px-1' },
              '点击重试'
            )
          ]
        )
      }

      // 正常：渲染默认插槽（即具体的 Widget 组件）
      return slots.default?.()
    }
  }
})
</script>

<style scoped>
/*
  Grid 布局由父级 SidebarView 的 :deep(.widget-list) 控制。
  此处只管理 Widget 的入场交错动画。
*/

/* ── 交错入场动画 ──────────────────────────────────────────────
   每个 WidgetErrorBoundary 实例都带有 .widget-entry 类。
   --widget-index 由模板中的 :style 绑定 (0~8)。
   animation-delay 计算公式：index × 40ms，形成瀑布效。
   animation-fill-mode: both 确保动画开始前元素已处于初始帧，
   避免短暂的「闪烁出现」。
────────────────────────────────────────────────────────────── */
.widget-entry {
  /* 这里不能直接用 Tailwind 的 animate-slide-up，
     因为需要动态的 animation-delay。
     直接写原生 animation 来配合 tailwind.config 中的
     keyframes.slide-up 定义（from: opacity 0 / translateY 10px）。 */
  animation: slide-up 0.25s ease both;
  animation-delay: calc(var(--widget-index, 0) * 40ms);
}

/* Webkit 前缀（Electron 基于 Chromium，实际很少需要，但保留以防万一） */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
