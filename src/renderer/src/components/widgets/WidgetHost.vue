<template>
  <div class="widget-list">
    <template v-if="widgets && widgets.length > 0">
      <div v-for="(widget, index) in widgets" :key="widget.id || index" class="widget-wrapper">

        <!-- Launcher -->
        <LauncherWidget
          v-if="widget.type === 'launcher'"
          :item="widget"
          :widgetIndex="index"
        />

        <!-- URL -->
        <UrlWidget
          v-else-if="widget.type === 'url'"
          :item="widget"
          :widgetIndex="index"
        />

        <!-- Command -->
        <CommandWidget
          v-else-if="widget.type === 'command'"
          :item="widget"
          :widgetIndex="index"
        />

        <!-- Volume Slider -->
        <VolumeWidget v-else-if="widget.type === 'volume_slider'" />

        <!-- Files Widget -->
        <FilesWidget v-else-if="widget.type === 'files'" :config="widget" />

        <!-- Drag to Launch -->
        <DragToLaunchWidget v-else-if="widget.type === 'drag_to_launch'" :config="widget" />

        <!-- Fallback for unknown types -->
        <div v-else class="p-2 bg-red-50 text-red-500 text-xs rounded">
          Unknown: {{ widget.type }}
        </div>
      </div>
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
import { Inbox } from 'lucide-vue-next'
import LauncherWidget from './LauncherWidget.vue'
import VolumeWidget from './VolumeWidget.vue'
import FilesWidget from './FilesWidget.vue'
import DragToLaunchWidget from './DragToLaunchWidget.vue'
import UrlWidget from './UrlWidget.vue'
import CommandWidget from './CommandWidget.vue'
import type { WidgetConfig } from '../../../../main/store'

defineProps<{
  widgets: WidgetConfig[]
}>()
</script>
