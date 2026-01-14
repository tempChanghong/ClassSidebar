<template>
  <div class="widget-list">
    <template v-for="(widget, index) in widgets" :key="index">

      <!-- Launcher Widget -->
      <div
        v-if="widget.type === 'launcher'"
        class="launcher-group"
        :class="getLayoutClass(widget.layout)"
      >
        <LauncherWidget
          v-for="(item, itemIndex) in widget.targets"
          :key="itemIndex"
          :item="item"
          :widgetIndex="index"
          :itemIndex="itemIndex"
        />
      </div>

      <!-- Volume Widget -->
      <VolumeWidget
        v-else-if="widget.type === 'volume_slider'"
      />

      <!-- Files Widget -->
      <FilesWidget
        v-else-if="widget.type === 'files'"
        :config="widget"
      />

      <!-- Drag To Launch Widget -->
      <DragToLaunchWidget
        v-else-if="widget.type === 'drag_to_launch'"
        :config="widget"
      />

    </template>
  </div>
</template>

<script setup lang="ts">
import LauncherWidget from './LauncherWidget.vue'
import VolumeWidget from './VolumeWidget.vue'
import FilesWidget from './FilesWidget.vue'
import DragToLaunchWidget from './DragToLaunchWidget.vue'

defineProps<{
  widgets: any[]
}>()

const getLayoutClass = (layout?: string) => {
  if (layout === 'grid') return 'layout-grid'
  if (layout === 'grid_no_text') return 'layout-grid_no_text'
  return 'layout-vertical'
}
</script>
