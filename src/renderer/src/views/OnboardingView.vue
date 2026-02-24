<template>
  <!-- 
    极简化、毛玻璃玻璃拟物窗口基座。
    外层通过 -webkit-app-region: drag 支持窗口拖拽。
  -->
  <div class="w-screen h-screen bg-white/80 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col antialiased relative" style="-webkit-app-region: drag;">
    
    <!-- 顶部占位/Logo 区 (这里可以设计为您项目的真实风格) -->
    <div class="pt-10 pb-4 flex flex-col items-center justify-center">
      <!-- 一个充满现代感的小徽标。可替换为真实图片 -->
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-xl flex items-center justify-center -webkit-app-region: drag mb-4">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      </div>
    </div>

    <!-- 
      核心内容幻灯片区。
      内部的输入、按钮等必须去除拖拽行为 (-webkit-app-region: no-drag)。
    -->
    <div class="flex-1 relative overflow-hidden px-8">
      <Transition name="slide-fade" mode="out-in">
        
        <!-- Step 1: 欢迎页 -->
        <div v-if="currentStep === 1" :key="'step1'" class="absolute inset-0 flex flex-col items-center justify-center text-center px-4" style="-webkit-app-region: no-drag;">
          <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight mb-4">
            欢迎体验 ClassSidebar
          </h1>
          <p class="text-slate-500 leading-relaxed text-sm max-w-sm mb-8">
            化繁为简，为现代化课堂和演示重建纯粹秩序。<br>让我们花 1 分钟为您进行初始配置。
          </p>
        </div>

        <!-- Step 2: 核心功能演示 -->
        <div v-else-if="currentStep === 2" :key="'step2'" class="absolute inset-0 flex flex-col items-center justify-center text-center px-4" style="-webkit-app-region: no-drag;">
          <h2 class="text-2xl font-bold text-slate-800 tracking-tight mb-4">
            一键唤起，丝滑收纳
          </h2>
          <div class="w-full max-w-sm bg-slate-100/50 rounded-xl p-6 border border-slate-200/50 shadow-inner mb-6 space-y-3">
             <p class="text-slate-600 text-sm">
                通过默认的全局快捷键快速呼出侧边栏：
             </p>
             <!-- 仿 Mac 按键 UI -->
             <div class="flex items-center justify-center gap-2">
                <kbd class="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg shadow-sm">Ctrl / Cmd</kbd>
                <span class="text-slate-400">+</span>
                <kbd class="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg shadow-sm">Shift</kbd>
                <span class="text-slate-400">+</span>
                <kbd class="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg shadow-sm">S</kbd>
             </div>
          </div>
          <p class="text-slate-500 leading-relaxed text-xs max-w-xs">
            您可在随后的设置面板中进一步自定义属于您的模块和布局。
          </p>
        </div>

        <!-- Step 3: 前置偏好配置 -->
        <div v-else-if="currentStep === 3" :key="'step3'" class="absolute inset-0 flex flex-col items-center justify-center px-8" style="-webkit-app-region: no-drag;">
          <h2 class="text-2xl font-bold text-slate-800 tracking-tight mb-8 text-center">
            最后一步：偏好预设
          </h2>
          
          <div class="w-full max-w-sm space-y-4">
            <!-- 直接内联一个极简样式的 Switch -->
            <label class="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:bg-white/80 transition-colors">
              <div class="flex flex-col">
                <span class="text-sm font-semibold text-slate-800">开机自动运行</span>
                <span class="text-xs text-slate-500 mt-1">推荐开启，常驻后台且几乎不占用系统资源</span>
              </div>
              
              <!-- 纯 CSS Switch -->
              <div class="relative inline-flex items-center">
                <input type="checkbox" v-model="autoStart" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-500 transition-colors duration-300"></div>
                <div class="absolute left-[2px] top-[2px] bg-white w-5 h-5 rounded-full transition-transform duration-300 peer-checked:translate-x-full shadow-sm"></div>
              </div>
            </label>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 底部导航与控制栏 -->
    <div class="p-6 pt-0 flex items-center justify-between" style="-webkit-app-region: no-drag;">
      <!-- 左侧：如果是第一步隐藏返回 -->
      <div>
        <button 
          v-if="currentStep > 1" 
          @click="prevStep"
          class="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 bg-slate-100/50 hover:bg-slate-200/50 hover:text-slate-700 hover:scale-105 active:scale-95 transition-all outline-none"
        >
          上一步
        </button>
      </div>

      <!-- 右侧：下一步或完成 -->
      <div>
        <button 
          v-if="currentStep < 3" 
          @click="nextStep"
          class="px-6 py-2 rounded-xl text-sm font-medium text-white bg-indigo-500 shadow-md shadow-indigo-500/20 hover:bg-indigo-600 hover:shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all outline-none"
        >
          {{ currentStep === 1 ? '开始探索' : '下一步' }}
        </button>
        <button 
          v-else
          @click="completeWizard"
          class="px-6 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-700/30 hover:scale-105 active:scale-95 transition-all outline-none flex items-center gap-2"
        >
          完成并启动
        </button>
      </div>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const currentStep = ref(1)

// 偏好预设：默认自启
const autoStart = ref(true)

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const completeWizard = () => {
  // 收集配置并发送回主进程
  // 这里使用的是您在 Phase 1 暴露的 completeOnboarding IPC 事件
  window.electronAPI.completeOnboarding({
    openAtLogin: autoStart.value
  })
}
</script>

<style scoped>
/* 
 * 优雅的 Vue 过渡动画 
 * 利用水平位移和透明度，创造像 iOS 类似的分步向导效果 
 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.98);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px) scale(0.98);
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
}
</style>
