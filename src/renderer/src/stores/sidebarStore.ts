import { defineStore } from 'pinia'
import { ref, toRaw } from 'vue'
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
                console.log('[DEBUG] 配置已更新', newConfig)
                console.log('[DEBUG] isExpanded:', isExpanded.value)
                console.log('[DEBUG] 当前 sidebarHeight:', sidebarHeight.value)
                console.log('[DEBUG] 新配置 height:', newConfig.transforms?.height)

                config.value = newConfig
                // Only update sidebarHeight from config when NOT expanded
                // When expanded, the height is controlled by the animation, not by config
                if (newConfig.transforms && typeof newConfig.transforms.height === 'number') {
                    if (!isExpanded.value) {
                        console.log('[DEBUG] 窗口未展开，更新 sidebarHeight 为配置值:', newConfig.transforms.height)
                        sidebarHeight.value = newConfig.transforms.height
                    } else {
                        // When expanded, ensure sidebarHeight is set to TARGET_H (450)
                        // This prevents the window from collapsing to 64px after drag
                        // However, we should be careful not to override if it's already correct
                        if (sidebarHeight.value < 450) {
                             console.log('[DEBUG] 窗口已展开但高度不正确，强制设置 sidebarHeight 为 450')
                             sidebarHeight.value = 450
                        }
                    }
                }
                console.log('[DEBUG] 更新后 sidebarHeight:', sidebarHeight.value)
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

    const saveConfig = async (newConfig: ExtendedAppSchema) => {
        try {
            // 1. 创建副本并移除 Vue Proxy
            const configToSave = JSON.parse(JSON.stringify(toRaw(newConfig)))
            
            // 2. 移除运行时注入的 displayBounds 属性
            if ('displayBounds' in configToSave) {
                delete configToSave.displayBounds
            }

            // 3. 发送给主进程
            await window.electronAPI.saveConfig(configToSave)
            
            // 4. 更新本地状态 (保留 displayBounds)
            if (config.value) {
                // 这里我们只更新配置部分，保留原有的 displayBounds
                const { displayBounds } = config.value
                config.value = { ...newConfig, displayBounds }
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
