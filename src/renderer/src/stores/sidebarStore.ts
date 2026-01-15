import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppSchema, WidgetConfig } from '../../../main/store'

// 扩展 AppSchema 以包含 displayBounds，因为后端返回的 config 包含此字段
interface ExtendedAppSchema extends AppSchema {
    displayBounds?: {
        x: number
        y: number
        width: number
        height: number
    }
}

export const useSidebarStore = defineStore('sidebar', () => {
    // 状态
    const config = ref<ExtendedAppSchema | null>(null)
    const isExpanded = ref(false)
    const isDragging = ref(false)
    const sidebarWidth = ref(4) // START_W
    const sidebarHeight = ref(64) // START_H

    // 动作
    const loadConfig = async () => {
        try {
            const loadedConfig = await window.electronAPI.getConfig()
            config.value = loadedConfig
            
            // 初始化尺寸
            if (loadedConfig.transforms) {
                if (typeof loadedConfig.transforms.height === 'number') {
                    sidebarHeight.value = loadedConfig.transforms.height
                }
            }
        } catch (err) {
            console.error('加载配置失败:', err)
        }

        // 监听配置更新
        if (window.electronAPI.onConfigUpdated) {
            window.electronAPI.onConfigUpdated((newConfig: ExtendedAppSchema) => {
                console.log('配置已更新，重新应用...', newConfig)
                config.value = newConfig
                if (newConfig.transforms && typeof newConfig.transforms.height === 'number') {
                    // 只有在未展开时才直接更新高度，避免动画冲突
                    if (!isExpanded.value) {
                        sidebarHeight.value = newConfig.transforms.height
                    }
                }
            })
        }
    }

    const setExpanded = (expanded: boolean) => {
        isExpanded.value = expanded
    }

    const updateDimensions = (width: number, height: number) => {
        sidebarWidth.value = width
        sidebarHeight.value = height
    }

    const saveConfig = async (newConfig: AppSchema) => {
        try {
            await window.electronAPI.saveConfig(newConfig)
            if (config.value) {
                config.value = { ...config.value, ...newConfig }
            }
        } catch (err) {
            console.error('保存配置失败:', err)
        }
    }

    // Widget Management Actions
    const addWidget = async (widget: WidgetConfig) => {
        if (!config.value) return
        const newWidgets = [...config.value.widgets, widget]
        const newConfig = { ...config.value, widgets: newWidgets }
        await saveConfig(newConfig)
    }

    const updateWidget = async (index: number, widget: WidgetConfig) => {
        if (!config.value) return
        const newWidgets = [...config.value.widgets]
        if (index >= 0 && index < newWidgets.length) {
            newWidgets[index] = widget
            const newConfig = { ...config.value, widgets: newWidgets }
            await saveConfig(newConfig)
        }
    }

    const removeWidget = async (index: number) => {
        if (!config.value) return
        const newWidgets = [...config.value.widgets]
        if (index >= 0 && index < newWidgets.length) {
            newWidgets.splice(index, 1)
            const newConfig = { ...config.value, widgets: newWidgets }
            await saveConfig(newConfig)
        }
    }

    const moveWidget = async (index: number, direction: 'up' | 'down') => {
        if (!config.value) return
        const newWidgets = [...config.value.widgets]
        if (direction === 'up' && index > 0) {
            const temp = newWidgets[index]
            newWidgets[index] = newWidgets[index - 1]
            newWidgets[index - 1] = temp
        } else if (direction === 'down' && index < newWidgets.length - 1) {
            const temp = newWidgets[index]
            newWidgets[index] = newWidgets[index + 1]
            newWidgets[index + 1] = temp
        } else {
            return // No change
        }
        const newConfig = { ...config.value, widgets: newWidgets }
        await saveConfig(newConfig)
    }

    return {
        config,
        isExpanded,
        isDragging,
        sidebarWidth,
        sidebarHeight,
        loadConfig,
        setExpanded,
        updateDimensions,
        saveConfig,
        addWidget,
        updateWidget,
        removeWidget,
        moveWidget
    }
})
