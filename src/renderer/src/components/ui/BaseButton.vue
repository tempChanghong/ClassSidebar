<template>
  <button
    class="inline-flex items-center justify-center font-medium
           transition-colors
           focus:outline-none focus:ring-2 focus:ring-offset-2
           disabled:opacity-50 disabled:cursor-not-allowed
           press-active"
    :class="[
      variantClasses[variant],
      sizeClasses[size],
      block ? 'w-full' : '',
      size === 'icon' ? 'icon-btn-hover' : '',
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <!-- Loading spinner icon -->
    <svg
      v-if="loading"
      class="animate-spin h-4 w-4"
      :class="size === 'icon' ? '' : '-ml-1 mr-2'"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    
    <!-- Button content -->
    <slot />
  </button>
</template>

<script setup lang="ts">
/**
 * 基础按钮组件 (BaseButton)
 * 
 * 这是一个高复用性的按钮组件，支持不同的颜色变体 (variant)、尺寸 (size)、全宽 (block) 
 * 以及加载状态 (loading)。
 * 使用 `v-bind="$attrs"` 自动透传如 `type="submit"`, `title` 等未定义的 HTML 属性。
 */
// No additional imports needed — props and variant/size maps are plain objects.

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  block: false,
});

// 定义每种尺寸对应的 Tailwind CSS 类
const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-3 text-base rounded-lg',
  icon: 'p-1.5 w-8 h-8 rounded-md',
};

// 定义每种变体（颜色风格）对应的 Tailwind CSS 类，支持深色模式 (dark:) 和交互状态 (hover:, focus:, active:)
const variantClasses = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:active:bg-blue-700 dark:focus:ring-blue-400',
  secondary:
    'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:active:bg-gray-500 dark:focus:ring-gray-400',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600 dark:active:bg-red-700 dark:focus:ring-red-400',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700 dark:focus:ring-gray-400',
};
</script>

<style scoped>
/*
  icon-btn-hover: 绯图标按鈕 hover 时，SVG 子元素轻微放大弹跳。
  对所有 variant 都有效，不影响文字按鈕（因为只有 size='icon'
  才会被添加此类）。

  注意：斑马线选择器作用于 slot 插入的 SVG （通常是 lucide-vue-next 组件）。
  :deep() 确保能穿透组件 Shadow DOM 边界。
*/
.icon-btn-hover :deep(svg) {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.icon-btn-hover:hover :deep(svg) {
  transform: scale(1.15);
}
/* 结合 press-active：按下时稍微缩回（全局定义在 base.css @layer utilities 中） */
.icon-btn-hover:active :deep(svg) {
  transform: scale(0.90);
}
</style>
