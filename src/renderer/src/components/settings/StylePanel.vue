<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <!-- Window & Appearance -->
    <SettingsSection title="窗口与外观" description="自定义侧边栏的视觉呈现效果">
      <SettingsRow label="基本不透明度" description="调整侧边栏整体的透明度。较低的值会透出更多背景颜色。">
        <div class="flex items-center gap-4 w-64">
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            v-model.number="opacity"
            @input="updateOpacity"
            class="flex-1 w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span class="text-xs font-mono w-10 text-right text-slate-500">{{ Math.round(opacity * 100) }}%</span>
        </div>
      </SettingsRow>

      <SettingsRow label="动画速度" description="全局组件动画和呼起/隐藏的切换时长 (越大越慢)">
        <div class="flex items-center gap-4 w-64">
           <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            v-model.number="animationSpeed"
            @change="updateAnimationSpeed"
            class="flex-1 w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span class="text-xs font-mono w-10 text-right text-slate-500">{{ animationSpeed.toFixed(1) }}x</span>
        </div>
      </SettingsRow>
    </SettingsSection>

    <!-- Layout & Size -->
    <SettingsSection title="布局与尺寸">
      <SettingsRow label="侧边栏宽度" description="侧边栏展开时的固定宽度 (像素)">
        <div class="w-32">
          <BaseInput
            type="number"
            v-model.number="width"
            @change="updateWidth"
            min="200"
            max="800"
            size="sm"
          />
        </div>
      </SettingsRow>
      <SettingsRow label="垂直高度模式" description="侧边栏展开时占据屏幕的高度模式">
        <div class="w-40">
           <BaseSelect
            v-model="heightMode"
            @change="updateHeight"
            :options="heightOptions"
            size="sm"
          />
        </div>
      </SettingsRow>
    </SettingsSection>

    <!-- Title Content -->
    <SettingsSection title="标题栏内容" description="自定义侧边栏主页左上角的显示内容">
      <SettingsRow label="标题显示类型" description="选择显示固定文本或者动态时间日期">
        <div class="w-40">
           <BaseSelect
            v-model="titleType"
            @change="updateTitle"
            :options="titleOptions"
            size="sm"
          />
        </div>
      </SettingsRow>
      <SettingsRow v-if="titleType === 'text'" label="自定义文本" description="输入你想要显示的固定文本">
        <div class="w-40">
          <BaseInput
            type="text"
            v-model="customText"
            @change="updateTitle"
            placeholder="例如: Sidebar"
            size="sm"
          />
        </div>
      </SettingsRow>
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import SettingsSection from '../ui/SettingsSection.vue'
import SettingsRow from '../ui/SettingsRow.vue'
import BaseInput from '../ui/BaseInput.vue'
import BaseSelect from '../ui/BaseSelect.vue'
import { useConfig } from '../../composables/useConfig'

const { config, saveConfig } = useConfig()

// Local state for snappy UI updates before saving
const opacity = ref(0.95)
const animationSpeed = ref(1)
const width = ref(400)
const heightMode = ref('auto')
const titleType = ref('text')
const customText = ref('Sidebar')

const heightOptions = [
  { label: '自适应内容', value: 'auto' },
  { label: '填满屏幕', value: 'max' }
]

const titleOptions = [
  { label: '自定义文本', value: 'text' },
  { label: '当前日期', value: 'date' },
  { label: '当前时间', value: 'time' },
  { label: '日期和时间', value: 'datetime' }
]

onMounted(() => {
  if (config.value?.transforms) {
    opacity.value = config.value.transforms.opacity ?? 0.85
    animationSpeed.value = config.value.transforms.animation_speed ?? 1
    width.value = config.value.transforms.width ?? 400
    // Hacky interpretation of height: if large enough, assume max
    heightMode.value = config.value.transforms.height > 80 ? 'max' : 'auto'
  }
  if (config.value) {
    titleType.value = config.value.sidebarTitleType ?? 'text'
    customText.value = config.value.sidebarCustomText ?? 'Sidebar'
  }
})

// Sync config changes from external to local state
watch(
  () => config.value,
  (newVal) => {
    if (newVal?.transforms) {
      opacity.value = newVal.transforms.opacity
      animationSpeed.value = newVal.transforms.animation_speed
      width.value = newVal.transforms.width
    }
    if (newVal) {
      titleType.value = newVal.sidebarTitleType ?? 'text'
      customText.value = newVal.sidebarCustomText ?? 'Sidebar'
    }
  },
  { deep: true }
)

const updateOpacity = async () => {
  if (!config.value) return
  config.value.transforms.opacity = opacity.value
  await saveConfig(config.value)
}

const updateAnimationSpeed = async () => {
  if (!config.value) return
  config.value.transforms.animation_speed = animationSpeed.value
  await saveConfig(config.value)
}

const updateWidth = async () => {
  if (!config.value) return
  if (width.value < 200) width.value = 200
  if (width.value > 1200) width.value = 1200
  config.value.transforms.width = width.value
  await saveConfig(config.value)
}

const updateHeight = async () => {
  if (!config.value) return
  const hValue = heightMode.value === 'max' ? 100 : 70 // just some logical values your app had
  config.value.transforms.height = hValue
  await saveConfig(config.value)
}

const updateTitle = async () => {
  if (!config.value) return
  config.value.sidebarTitleType = titleType.value as any
  config.value.sidebarCustomText = customText.value
  await saveConfig(config.value)
}
</script>
