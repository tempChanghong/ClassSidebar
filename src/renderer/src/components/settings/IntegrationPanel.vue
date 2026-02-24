<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <!-- Hotkeys Placeholder -->
    <SettingsSection title="全局快捷键" description="配置用于快速呼出侧边栏或执行动作的快捷键">
      <div class="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-center">
        <Keyboard class="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <h3 class="text-sm font-medium text-slate-800">快捷键模块重构中</h3>
        <p class="text-xs text-slate-500 mt-1">全局快捷键 (如 Alt+Space) 的自定义功能将在后续更新中开放。</p>
      </div>
    </SettingsSection>

    <!-- Quick Actions (System Tools Test) -->
    <SettingsSection title="快速调试动作" description="用于开发期间测试系统级命令是否可用">
      <QuickActions />
    </SettingsSection>
    
    <!-- Timer / Automation Placeholder -->
    <SettingsSection title="定时与自动化" description="配置课堂倒计时提醒和自动化任务 (开发中)">
      <div class="px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between opacity-60 grayscale">
        <div>
          <div class="text-sm font-medium text-slate-800">上课时间提醒</div>
          <div class="text-xs text-slate-500 mt-0.5">提前响铃或自动展开侧边栏</div>
        </div>
        <BaseSwitch :modelValue="false" disabled />
      </div>
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import { Keyboard } from 'lucide-vue-next'
import SettingsSection from '../ui/SettingsSection.vue'
import BaseSwitch from '../ui/BaseSwitch.vue'
import QuickActions from './QuickActions.vue'
</script>
