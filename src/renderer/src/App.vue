<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
// App.vue 应该只负责路由渲染，不应该包含任何窗口尺寸控制逻辑。
// 所有的窗口尺寸控制逻辑都已经移交给了 useSidebarInteraction.ts。
// 这里的重复逻辑是导致冲突的根源。
</script>
