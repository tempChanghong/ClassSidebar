import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppSchema } from '../../../main/store'

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
                // 应用其他初始样式设置（如透明度、动画速度）通常在组件层或通过 CSS 变量绑定处理
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
            // 保存后更新本地状态，注意这里可能需要重新获取带 displayBounds 的完整配置
            // 或者简单地合并
            if (config.value) {
                config.value = { ...config.value, ...newConfig }
            }
        } catch (err) {
            console.error('保存配置失败:', err)
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
        saveConfig
    }
})
