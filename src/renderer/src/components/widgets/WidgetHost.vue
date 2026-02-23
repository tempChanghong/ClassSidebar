<template>
  <div class="widget-list">
    <template v-if="widgets && widgets.length > 0">
      <template v-for="(widget, index) in widgets" :key="widget.id">

        <!-- 每个 Widget 都被独立的错误边界包裹 -->
        <!-- 使用 widget.id 作为 key 重置错误边界状态 -->
        <WidgetErrorBoundary :widget-id="widget.id" :widget-type="widget.type">

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
  Styles are now controlled by the parent (SidebarView) or global styles
  to ensure the grid layout works correctly.

  .grid-item classes will be styled to fit the 3-column layout.
  .col-span-full classes will span all 3 columns.
*/
</style>
