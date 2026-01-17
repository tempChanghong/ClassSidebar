<template>
  <div class="widget-list">
    <template v-if="widgets && widgets.length > 0">
      <!--
        We need to group consecutive 'grid' layout launchers together to render them in a single grid container.
        Other widgets are rendered normally.
      -->
      <template v-for="(group, groupIndex) in groupedWidgets" :key="groupIndex">

        <!-- Grid Group -->
        <div v-if="group.type === 'grid'" class="launcher-group layout-grid">
          <LauncherWidget
            v-for="(widget, wIndex) in group.items"
            :key="widget.id || wIndex"
            :item="widget"
            :widgetIndex="group.originalIndices[wIndex]"
            class="grid-item"
          />
        </div>

        <!-- Single Widget (Vertical or other types) -->
        <div v-else class="widget-wrapper">
          <!-- Launcher (Vertical) -->
          <LauncherWidget
            v-if="group.item.type === 'launcher'"
            :item="group.item"
            :widgetIndex="group.originalIndex"
            class="layout-vertical"
          />

          <!-- URL -->
          <UrlWidget
            v-else-if="group.item.type === 'url'"
            :item="group.item"
            :widgetIndex="group.originalIndex"
            class="layout-vertical"
          />

          <!-- Command -->
          <CommandWidget
            v-else-if="group.item.type === 'command'"
            :item="group.item"
            :widgetIndex="group.originalIndex"
            class="layout-vertical"
          />

          <!-- Volume Slider -->
          <VolumeWidget v-else-if="group.item.type === 'volume_slider'" />

          <!-- Files Widget -->
          <FilesWidget v-else-if="group.item.type === 'files'" :config="group.item" />

          <!-- Drag to Launch -->
          <DragToLaunchWidget v-else-if="group.item.type === 'drag_to_launch'" :config="group.item" />

          <!-- Fallback -->
          <div v-else class="p-2 bg-red-50 text-red-500 text-xs rounded">
            Unknown type: {{ (group.item as any).type }}
          </div>
        </div>

      </template>
    </template>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
      <Inbox class="w-8 h-8" />
      <p class="text-sm font-medium">侧边栏为空</p>
      <p class="text-xs">点击右下角设置按钮添加组件</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Inbox } from 'lucide-vue-next'
import LauncherWidget from './LauncherWidget.vue'
import VolumeWidget from './VolumeWidget.vue'
import FilesWidget from './FilesWidget.vue'
import DragToLaunchWidget from './DragToLaunchWidget.vue'
import UrlWidget from './UrlWidget.vue'
import CommandWidget from './CommandWidget.vue'
import type { WidgetConfig } from '../../../../main/store'

const props = defineProps<{
  widgets: WidgetConfig[]
}>()

// Helper to group consecutive grid items
const groupedWidgets = computed(() => {
  const groups: any[] = []
  let currentGrid: any[] = []
  let currentGridIndices: number[] = []

  props.widgets.forEach((widget, index) => {
    // Check if it's a launcher with grid layout
    if (widget.type === 'launcher' && widget.layout === 'grid') {
      currentGrid.push(widget)
      currentGridIndices.push(index)
    } else {
      // If we have a pending grid, push it first
      if (currentGrid.length > 0) {
        groups.push({ type: 'grid', items: [...currentGrid], originalIndices: [...currentGridIndices] })
        currentGrid = []
        currentGridIndices = []
      }
      // Push the current non-grid widget
      groups.push({ type: 'single', item: widget, originalIndex: index })
    }
  })

  // Push remaining grid items
  if (currentGrid.length > 0) {
    groups.push({ type: 'grid', items: [...currentGrid], originalIndices: [...currentGridIndices] })
  }

  return groups
})
</script>
