<template>
  <div class="widget-list">
    <div v-for="(widget, index) in widgets" :key="index" class="widget-wrapper">
      <!-- Launcher (Grid/List) -->
      <div
        v-if="widget.type === 'launcher'"
        class="launcher-group"
        :class="[
          widget.layout === 'grid' ? 'layout-grid' : 'layout-vertical',
          { 'layout-grid_no_text': widget.layout === 'grid' && widget.hideText }
        ]"
      >
        <template v-if="widget.targets && widget.targets.length">
          <template v-for="(item, itemIndex) in widget.targets" :key="itemIndex">
             <!-- 根据 item 类型分发，如果 item 没有明确 type，默认为 launcher item -->
             <UrlWidget
               v-if="item.url"
               :item="item"
               :widgetIndex="index"
               :itemIndex="itemIndex"
             />
             <CommandWidget
               v-else-if="item.command"
               :item="item"
               :widgetIndex="index"
               :itemIndex="itemIndex"
             />
             <LauncherWidget
               v-else
               :item="item"
               :widgetIndex="index"
               :itemIndex="itemIndex"
             />
          </template>
        </template>
      </div>

      <!-- Volume Slider -->
      <VolumeWidget v-else-if="widget.type === 'volume_slider'" />

      <!-- Files Widget -->
      <FilesWidget v-else-if="widget.type === 'files'" :config="widget" />

      <!-- Drag to Launch -->
      <DragToLaunchWidget v-else-if="widget.type === 'drag_to_launch'" :config="widget" />

      <!-- Fallback for unknown types -->
      <div v-else class="unknown-widget">
        Unknown widget type: {{ widget.type }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

<style scoped>
.unknown-widget {
  padding: 10px;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 8px;
  font-size: 12px;
}
</style>
