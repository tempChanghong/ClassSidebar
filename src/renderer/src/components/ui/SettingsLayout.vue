<template>
  <div class="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
    <!-- Sidebar Navigation -->
    <aside class="w-[240px] flex-shrink-0 bg-slate-100 border-r border-slate-200 flex flex-col">
      <div class="h-14 flex items-center px-6 border-b border-slate-200/50">
        <span class="font-bold text-lg tracking-tight text-slate-800">设置</span>
      </div>

      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="$emit('update:tab', tab.id)"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative"
          :class="[
            currentTab === tab.id
              ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
          ]"
        >
          <!-- Active Indicator -->
          <div
            v-if="currentTab === tab.id"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full"
          ></div>

          <component
            :is="tab.icon"
            class="w-4 h-4 transition-colors"
            :class="currentTab === tab.id ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-600'"
          />
          {{ tab.label }}
        </button>
      </nav>

      <div class="p-4 border-t border-slate-200 text-xs text-slate-400 text-center">
        v{{ version }}
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col min-w-0 bg-white">
      <!-- Title Bar -->
      <header class="h-14 flex items-center justify-between px-8 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <h1 class="text-lg font-semibold text-slate-800">{{ currentTabLabel }}</h1>
        <div class="flex items-center gap-2">
          <slot name="actions"></slot>
        </div>
      </header>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-8">
        <div class="max-w-3xl mx-auto space-y-8 pb-12">
          <slot></slot>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

const props = defineProps<{
  tabs: { id: string; label: string; icon: Component }[]
  currentTab: string
  version?: string
}>()

defineEmits<{
  (e: 'update:tab', id: string): void
}>()

const currentTabLabel = computed(() =>
  props.tabs.find(t => t.id === props.currentTab)?.label || 'Settings'
)
</script>
