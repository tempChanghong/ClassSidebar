import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppSchema, WidgetConfig } from '../../../main/store'

// 扩展 AppSchema 以包含 displayBounds
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
    const sidebarWidth = ref(4)
    const sidebarHeight = ref(64)

    // 动作
    const loadConfig = async () => {
        try {
            const loadedConfig = await window.electronAPI.getConfig()
            config.value = loadedConfig
            
            if (loadedConfig.transforms) {
                if (typeof loadedConfig.transforms.height === 'number') {
                    sidebarHeight.value = loadedConfig.transforms.height
                }
            }
        } catch (err) {
            console.error('加载配置失败:', err)
        }

        if (window.electronAPI.onConfigUpdated) {
            window.electronAPI.onConfigUpdated((newConfig: ExtendedAppSchema) => {
                console.log('配置已更新', newConfig)
                config.value = newConfig
                if (newConfig.transforms && typeof newConfig.transforms.height === 'number') {
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

    // --- Widget Management Actions ---

    const addWidget = async (widget: Omit<WidgetConfig, 'id'>) => {
        if (!config.value) return
        const newWidget = { ...widget, id: crypto.randomUUID() } as WidgetConfig
        const newWidgets = [...config.value.widgets, newWidget]
        const newConfig = { ...config.value, widgets: newWidgets }
        await saveConfig(newConfig)
    }

    const updateWidget = async (id: string, updates: Partial<WidgetConfig>) => {
        if (!config.value) return
        const newWidgets = config.value.widgets.map(w => 
            w.id === id ? { ...w, ...updates } : w
        ) as WidgetConfig[]
        const newConfig = { ...config.value, widgets: newWidgets }
        await saveConfig(newConfig)
    }

    const removeWidget = async (id: string) => {
        if (!config.value) return
        const newWidgets = config.value.widgets.filter(w => w.id !== id)
        const newConfig = { ...config.value, widgets: newWidgets }
        await saveConfig(newConfig)
    }

    const reorderWidget = async (fromIndex: number, toIndex: number) => {
        if (!config.value) return
        const newWidgets = [...config.value.widgets]
        const [moved] = newWidgets.splice(fromIndex, 1)
        newWidgets.splice(toIndex, 0, moved)
        const newConfig = { ...config.value, widgets: newWidgets }
        await saveConfig(newConfig)
    }

    // 兼容旧版基于索引的操作 (可选，如果不再使用可移除)
    const moveWidget = async (index: number, direction: 'up' | 'down') => {
        if (!config.value) return
        const newIndex = direction === 'up' ? index - 1 : index + 1
        if (newIndex >= 0 && newIndex < config.value.widgets.length) {
            await reorderWidget(index, newIndex)
        }
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
        reorderWidget,
        moveWidget
    }
})
