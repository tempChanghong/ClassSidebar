<template>
  <div class="flex flex-col w-full">
    <!-- Optional Label -->
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-semibold mb-1 text-slate-700"
    >
      {{ label }}
    </label>
    
    <!-- Input Wrapper for potential icons -->
    <div class="relative flex items-center">
      <input
        :id="inputId"
        :value="modelValue"
        @input="onInput"
        class="w-full transition-all duration-300 border rounded-lg focus:outline-none focus:ring-4 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 shadow-sm placeholder-slate-400"
        :class="[
          sizeClasses[size],
          error 
            ? 'border-red-300 text-red-900 focus:ring-red-500/20' 
            : 'border-slate-200 text-slate-800 focus:ring-blue-500/20 hover:border-slate-300'
        ]"
        v-bind="$attrs"
      />
    </div>

    <!-- Error Message -->
    <p v-if="error" class="mt-1 text-xs text-red-500 dark:text-red-400">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * 基础输入框组件 (BaseInput)
 * 
 * 适用于各种文本输入的标准组件，内置了 Label 和 Error 信息的展示。
 * 支持 v-model 双向绑定。使用 `v-bind="$attrs"` 透传 placeholder, type="password" 等属性。
 * 支持完善的深色模式与焦点/错误交互样式。
 */
import { computed } from 'vue';

// 随机生成一个 ID 以供 label 的 `for` 属性绑定
const inputId = `base-input-${Math.random().toString(36).substring(2, 9)}`;

interface Props {
  modelValue?: string | number; // 绑定的值
  label?: string;               // 标题
  error?: string;               // 错误信息（存在时会呈现红色边框样式）
  size?: 'sm' | 'md' | 'lg';    // 尺寸
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  error: '',
  size: 'md',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

// 内部更新方法，触发 v-model
const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

// 尺寸样式计算
const sizeClasses = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};
</script>

<script lang="ts">
// 禁止属性透传到最外层的 <div class="flex">，而是手动到 <input> 上
export default {
  inheritAttrs: false,
}
</script>
