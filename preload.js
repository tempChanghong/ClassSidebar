const { contextBridge, ipcRenderer } = require('electron');

/**
 * 预加载脚本：在渲染进程和主进程之间架起桥梁
 * 安全地暴露部分 API 给渲染进程
 */
contextBridge.exposeInMainWorld('electronAPI', {
    // 调整窗口大小
    resizeWindow: (width, height, y) => ipcRenderer.send('resize-window', width, height, y),

    // 设置鼠标穿透（预留接口）
    setIgnoreMouse: (ignore, forward) => ipcRenderer.send('set-ignore-mouse', ignore, forward),

    // 获取配置信息
    getConfig: () => ipcRenderer.invoke('get-config'),

    // 保存配置信息
    saveConfig: (newConfig) => ipcRenderer.invoke('save-config', newConfig),

    // 监听配置更新
    onConfigUpdated: (callback) => ipcRenderer.on('config-updated', (event, newConfig) => callback(newConfig)),

    // 添加快捷方式
    addShortcut: (filePath) => ipcRenderer.invoke('add-shortcut', filePath),

    // 打开文件选择对话框
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),

    // 显示右键菜单
    showContextMenu: (itemData) => ipcRenderer.send('show-context-menu', itemData),

    // 启动外部应用
    launchApp: (target, args) => ipcRenderer.send('launch-app', target, args),

    // 获取文件图标
    getFileIcon: (path) => ipcRenderer.invoke('get-file-icon', path),

    // 设置窗口置顶状态
    setAlwaysOnTop: (flag) => ipcRenderer.send('set-always-on-top', flag),

    // 音量控制
    getVolume: () => ipcRenderer.invoke('get-volume'),
    setVolume: (value) => ipcRenderer.send('set-volume', value),

    // 获取文件夹下的文件
    getFilesInFolder: (path, maxCount) => ipcRenderer.invoke('get-files-in-folder', path, maxCount),

    // 执行任意命令
    executeCommand: (command) => ipcRenderer.send('execute-command', command),

    // 获取文件路径 (解决 Context Isolation 导致 file.path 为空的问题)
    getFilePath: (file) => {
        const { webUtils } = require('electron');
        if (webUtils && webUtils.getPathForFile) {
            return webUtils.getPathForFile(file);
        }
        return file.path;
    },

    // 获取应用版本
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    // 获取开机自启设置
    getLoginItemSettings: () => ipcRenderer.invoke('get-login-item-settings'),

    // 设置开机自启
    setLoginItemSettings: (settings) => ipcRenderer.invoke('set-login-item-settings', settings),

    // 打开设置窗口
    openSettings: () => ipcRenderer.send('open-settings')
});
