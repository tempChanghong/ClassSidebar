<template>
  <div class="flex flex-col w-full">
    <!-- Optional Label -->
    <label
      v-if="label"
      :for="selectId"
      class="block text-sm font-semibold mb-1 text-slate-700"
    >
      {{ label }}
    </label>
    
    <div class="relative">
      <select
        :id="selectId"
        :value="modelValue"
        @change="onChange"
        class="w-full transition-all duration-300 border rounded-lg focus:outline-none focus:ring-4 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 appearance-none bg-white hover:bg-slate-50 border-slate-200 text-slate-800 focus:ring-blue-500/20 shadow-sm"
        :class="sizeClasses[size]"
        v-bind="$attrs"
      >
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      
      <!-- Custom Dropdown Arrow -->
      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 9l-7 7-7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 基础下拉框组件 (BaseSelect)
 * 
 * 用于封装原生的 <select>，提供统一的尾风样式设计、深色模式适配和自定义箭头。
 * 与 BaseInput 类似，通过 options 属性接收菜单项配置。
 */

const selectId = `base-select-${Math.random().toString(36).substring(2, 9)}`;

interface SelectOption {
  label: string;
  value: string | number;
}

interface Props {
  modelValue?: string | number;
  label?: string;
  options: SelectOption[];
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '',
  size: 'md',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();

const onChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  // HTML select values are always strings. We are emitting strings.
  emit('update:modelValue', target.value);
};

const sizeClasses = {
  sm: 'px-2.5 py-1.5 text-xs pr-8',
  md: 'px-3 py-2 text-sm pr-8',
  lg: 'px-4 py-3 text-base pr-8',
};
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>
