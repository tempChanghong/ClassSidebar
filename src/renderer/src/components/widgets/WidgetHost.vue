<template>
  <div class="widget-list">
    <template v-if="widgets && widgets.length > 0">
      <template v-for="(widget, index) in widgets" :key="widget.id || index">

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

        <!-- System Tools (Grid Item - acts like a folder) -->
        <SystemToolsWidget
          v-else-if="widget.type === 'system_tools'"
          :config="widget"
          class="grid-item"
        />

        <!-- Fallback -->
        <div v-else class="p-2 bg-red-50 text-red-500 text-xs rounded col-span-full">
          Unknown type: {{ (widget as any).type }}
        </div>

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
import { Inbox } from 'lucide-vue-next'
import LauncherWidget from './LauncherWidget.vue'
import VolumeWidget from './VolumeWidget.vue'
import FilesWidget from './FilesWidget.vue'
import DragToLaunchWidget from './DragToLaunchWidget.vue'
import UrlWidget from './UrlWidget.vue'
import CommandWidget from './CommandWidget.vue'
import SystemToolsWidget from './SystemToolsWidget.vue'
import type { WidgetConfig } from '../../../../main/store'

defineProps<{
  widgets: WidgetConfig[]
}>()
</script>

<style scoped>
/*
  Styles are now controlled by the parent (SidebarView) or global styles
  to ensure the grid layout works correctly.

  .grid-item classes will be styled to fit the 3-column layout.
  .col-span-full classes will span all 3 columns.
*/
</style>
