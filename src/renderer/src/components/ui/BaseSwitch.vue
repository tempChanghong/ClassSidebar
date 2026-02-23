<template>
  <label
    class="inline-flex items-center cursor-pointer relative"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
    v-bind="$attrs"
  >
    <div class="relative">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="onChange"
        class="sr-only"
        :disabled="disabled"
      />
      <!-- 轨道路线 (Track) -->
      <div
        class="block w-10 h-6 rounded-full transition-colors duration-200"
        :class="
          modelValue
            ? 'bg-blue-600 dark:bg-blue-500'
            : 'bg-gray-300 dark:bg-gray-600'
        "
      ></div>
      <!-- 开关推块 (Thumb) -->
      <div
        class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200"
        :class="modelValue ? 'transform translate-x-4' : ''"
      ></div>
    </div>
    
    <!-- 右侧可选文字标签 (Label) -->
    <div
      v-if="label"
      class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300"
    >
      {{ label }}
    </div>
  </label>
</template>

<script setup lang="ts">
/**
 * 基础开关组件 (BaseSwitch)
 * 
 * 用于开/关或开/关状态的切换，替代原生 checkbox。
 * 使用 v-model 双向绑定一个布尔值，支持禁用状态，并且完美适配深色模式。
 * 默认透传外部属性（如 title）到最外层的 label。
 */

interface Props {
  modelValue: boolean; // 绑定当前开关状态
  label?: string;      // 开关后置标签，不传则只有开关
  disabled?: boolean;  // 禁用状态控制
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  label: '',
  disabled: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

// 处理 input 原生的 change 事件并向上传递布尔值结果
const onChange = (event: Event) => {
  if (props.disabled) return;
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
};
</script>

<script lang="ts">
// 禁止属性透传到组件最外层默认合并方式，因为在此设计里最外层也就是 label，
// 我们手动显式使用 `v-bind="$attrs"` 为了更清晰的语义。如果觉得默认即可，也可以省去此处。
export default {
  inheritAttrs: false,
}
</script>
