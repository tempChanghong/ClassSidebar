<template>
  <div class="relative">
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :type="type"
      :placeholder="placeholder"
      class="block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 bg-slate-50 transition-all duration-200"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: string
  type?: string
  placeholder?: string
}>(), {
  type: 'text',
  placeholder: ''
})

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>
