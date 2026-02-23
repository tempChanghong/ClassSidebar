<template>
  <Teleport to="body">
    <Transition name="modal-backdrop" appear>
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="close"
        ></div>

        <!-- Panel -->
        <Transition name="modal-panel" appear>
          <div
            v-if="modelValue"
            class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 class="text-lg font-semibold text-slate-900">
                {{ title }}
              </h3>
              <button
                @click="close"
                class="text-slate-400 hover:text-slate-600 rounded-full p-1.5 hover:bg-slate-200/50 transition-colors focus:outline-none"
                aria-label="关闭"
              >
                <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body (default slot) -->
            <div class="p-6 overflow-y-auto flex-1">
              <slot />
            </div>

            <!-- Footer (named slot) -->
            <div
              v-if="$slots.footer"
              class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 基础弹窗组件 (BaseModal)
 *
 * 使用 Teleport 挂载到 body，避免父级 overflow / z-index 层叠问题。
 * 支持 v-model 控制显示隐藏，Esc 键与遮罩层点击关闭。
 * 提供默认插槽（主内容）和 footer 具名插槽（按钮区）。
 */
import { watch, onMounted, onUnmounted } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const close = () => {
  emit('update:modelValue', false)
}

// --- Esc 键关闭 ---
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// --- 禁止背景滚动 ---
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)
</script>

<style scoped>
/* ===== Backdrop fade ===== */
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.25s ease;
}
.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

/* ===== Panel scale + slide ===== */
.modal-panel-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-panel-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-panel-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
.modal-panel-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
