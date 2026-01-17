import { contextBridge, ipcRenderer, webUtils, IpcRendererEvent } from 'electron'
import type { AppSchema } from '../main/store'

/**
 * 预加载脚本：在渲染进程和主进程之间架起桥梁
 * 安全地暴露部分 API 给渲染进程
 */
contextBridge.exposeInMainWorld('electronAPI', {
    // 调整窗口大小
    resizeWindow: (width: number, height: number, y: number): void => ipcRenderer.send('resize-window', width, height, y),

    // 设置鼠标穿透（预留接口）
    setIgnoreMouse: (ignore: boolean, forward: boolean): void => ipcRenderer.send('set-ignore-mouse', ignore, forward),

    // 获取配置信息
    getConfig: (): Promise<AppSchema> => ipcRenderer.invoke('get-config'),

    // 保存配置信息
    saveConfig: (newConfig: AppSchema): Promise<{ success: boolean }> => ipcRenderer.invoke('save-config', newConfig),

    // 监听配置更新
    onConfigUpdated: (callback: (newConfig: AppSchema) => void): void => {
        ipcRenderer.on('config-updated', (_event: IpcRendererEvent, newConfig: AppSchema) => callback(newConfig))
    },

    // 添加快捷方式
    addShortcut: (filePath: string): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('add-shortcut', filePath),

    // 打开文件选择对话框
    openFileDialog: (options?: any): Promise<string | null> => ipcRenderer.invoke('open-file-dialog', options),

    // 显示右键菜单
    showContextMenu: (itemData: any): void => ipcRenderer.send('show-context-menu', itemData),

    // 启动外部应用
    launchApp: (target: string, args: string[]): void => ipcRenderer.send('launch-app', target, args),

    // 获取文件图标
    getFileIcon: (path: string): Promise<string | null> => ipcRenderer.invoke('get-file-icon', path),

    // 设置窗口置顶状态
    setAlwaysOnTop: (flag: boolean): void => ipcRenderer.send('set-always-on-top', flag),

    // 音量控制
    getVolume: (): Promise<number> => ipcRenderer.invoke('get-volume'),
    setVolume: (value: number): void => ipcRenderer.send('set-volume', value),

    // 获取文件夹下的文件
    getFilesInFolder: (path: string, maxCount: number): Promise<any[]> => ipcRenderer.invoke('get-files-in-folder', path, maxCount),

    // 执行任意命令
    executeCommand: (command: string): void => ipcRenderer.send('execute-command', command),

    // 打开外部链接 (新增)
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('open-external', url),

    // 移动窗口 (新增)
    moveWindow: (deltaY: number): void => ipcRenderer.send('move-window', deltaY),
    
    // 获取当前 posy (新增)
    getCurrentPosY: (): Promise<number> => ipcRenderer.invoke('get-current-posy'),

    // 获取文件路径 (解决 Context Isolation 导致 file.path 为空的问题)
    getFilePath: (file: File): string => {
        if (webUtils && webUtils.getPathForFile) {
            return webUtils.getPathForFile(file)
        }
        return file.path
    },

    // 获取应用版本
    getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),

    // 获取开机自启设置
    getLoginItemSettings: (): Promise<Electron.LoginItemSettings> => ipcRenderer.invoke('get-login-item-settings'),

    // 设置开机自启
    setLoginItemSettings: (settings: Electron.Settings): Promise<Electron.LoginItemSettings> => ipcRenderer.invoke('set-login-item-settings', settings),

    // 打开设置窗口
    openSettings: (): void => ipcRenderer.send('open-settings'),

    // 系统工具相关
    checkSystemCapability: (toolName: string): Promise<boolean> => ipcRenderer.invoke('system:check-capability', toolName),
    executeSystemTool: (toolName: string): void => ipcRenderer.send('system:execute-tool', toolName),
    showToolboxMenu: (): void => ipcRenderer.send('system:show-toolbox-menu')
})
