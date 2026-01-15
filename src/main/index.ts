import {
    app,
    ipcMain,
    screen,
    IpcMainEvent,
    IpcMainInvokeEvent,
    dialog,
    shell,
    Menu,
    MenuItem,
    BrowserWindow
} from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { sidebarWindow } from './windows/SidebarWindow'
import store, { AppSchema } from './store'
import * as utils from './utils'
import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'

let settingsWindow: BrowserWindow | null = null

function createSettingsWindow(): void {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.focus()
        return
    }

    settingsWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: '设置',
        frame: true,
        transparent: false,
        alwaysOnTop: false,
        skipTaskbar: false,
        resizable: true,
        minimizable: true,
        maximizable: true,
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
        },
        autoHideMenuBar: true
    })

    settingsWindow.setMenuBarVisibility(false)

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        settingsWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#/settings`)
    } else {
        settingsWindow.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: 'settings' })
    }

    settingsWindow.on('closed', () => {
        settingsWindow = null
    })
}

// 这里是大部分 IPC 逻辑的迁移
function registerIpc(): void {
    ipcMain.on('resize-window', (_: IpcMainEvent, w: number, h: number, y?: number) =>
        sidebarWindow.resize(w, h, y)
    )
    ipcMain.on('set-ignore-mouse', (_: IpcMainEvent, ignore: boolean) =>
        sidebarWindow.setIgnoreMouse(ignore)
    )
    ipcMain.on('set-always-on-top', (_: IpcMainEvent, flag: boolean) =>
        sidebarWindow.setAlwaysOnTop(flag)
    )

    ipcMain.handle('get-config', (_: IpcMainInvokeEvent) => {
        const config = store.store
        const displays = screen.getAllDisplays()
        const targetDisplay =
            config.transforms.display < displays.length
                ? displays[config.transforms.display]
                : screen.getPrimaryDisplay()
        return { ...config, displayBounds: targetDisplay.bounds }
    })

    ipcMain.handle('save-config', (_: IpcMainInvokeEvent, newConfig: AppSchema) => {
        store.store = newConfig
        sidebarWindow.win?.webContents.send('config-updated', newConfig)
        return { success: true }
    })

    ipcMain.handle('get-volume', (_: IpcMainInvokeEvent) => utils.getSystemVolume())
    ipcMain.on('set-volume', (_: IpcMainEvent, val: number) => utils.setSystemVolume(val))

    // 获取应用版本
    ipcMain.handle('get-app-version', () => app.getVersion())

    // 打开文件选择对话框
    ipcMain.handle('open-file-dialog', async () => {
        const win = settingsWindow || sidebarWindow.win
        if (!win) return null
        const result = await dialog.showOpenDialog(win, {
            properties: ['openFile'],
            filters: [
                { name: 'Applications', extensions: ['exe', 'lnk', 'url', 'bat', 'cmd'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        })

        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0]
        }
        return null
    })

    // 获取文件图标
    ipcMain.handle('get-file-icon', async (_: IpcMainInvokeEvent, filePath: string) => {
        try {
            let resolvedPath = filePath

            // 优先处理协议
            if (filePath.includes('://')) {
                const protocol = filePath.split('://')[0]
                resolvedPath = utils.getExePathFromProtocol(protocol)
                if (!resolvedPath) {
                    console.warn(`[Main] Protocol ${protocol} not found.`)
                    return null
                }
            } else {
                // 处理快捷方式
                if (resolvedPath.toLowerCase().endsWith('.lnk')) {
                    try {
                        const shortcut = shell.readShortcutLink(resolvedPath)
                        if (shortcut.target) {
                            resolvedPath = shortcut.target
                        }
                    } catch (e) {
                        console.warn('解析快捷方式失败:', e)
                    }
                }

                if (!path.isAbsolute(resolvedPath)) {
                    const fullPath = utils.resolveExecutablePath(resolvedPath)
                    if (fullPath) resolvedPath = fullPath
                }
            }

            const icon = await app.getFileIcon(resolvedPath, { size: 'large' })
            return icon.toDataURL()
        } catch (err) {
            console.error('获取图标失败:', filePath, err)
            return null
        }
    })

    // 启动应用
    ipcMain.on('launch-app', async (_: IpcMainEvent, target: string, args: string[]) => {
        console.log(`[launch-app] Request: target="${target}", args=${JSON.stringify(args)}`)

        // 处理 URI
        if (target.includes('://')) {
            console.log('[launch-app] Opening URI')
            shell.openExternal(target).catch((e) => console.error('打开 URI 失败:', e))
            return
        }

        const lowerTarget = target.toLowerCase()
        // 移除可能的 .exe 后缀进行比较
        const baseTarget = lowerTarget.replace('.exe', '')
        const systemCommands = ['explorer', 'notepad', 'calc', 'cmd']

        try {
            // 1. 系统命令直接 spawn
            if (systemCommands.includes(baseTarget)) {
                console.log('[launch-app] Detected system command, using spawn')
                // Windows 上某些命令可能需要 shell: true 才能正确解析
                const child = spawn(target, args || [], {
                    detached: true,
                    stdio: 'ignore',
                    shell: process.platform === 'win32'
                })
                child.unref()
                child.on('error', (err) => console.error('[launch-app] Spawn error:', err))
                return
            }

            // 2. 如果有参数，直接 spawn (openPath 不支持参数)
            if (args && args.length > 0) {
                console.log('[launch-app] Has args, using spawn')
                const child = spawn(target, args, { detached: true, stdio: 'ignore' })
                child.unref()
                child.on('error', (err) => console.error('[launch-app] Spawn error:', err))
                return
            }

            // 3. 普通文件尝试 openPath
            console.log('[launch-app] Trying shell.openPath')
            const error = await shell.openPath(target)
            if (error) {
                console.warn(`shell.openPath 失败 (${error}), 尝试 spawn 回退...`)
                // 4. 回退机制：尝试作为可执行文件运行
                const child = spawn(target, [], { detached: true, stdio: 'ignore' })
                child.unref()
                child.on('error', (err) => console.error('[launch-app] Fallback spawn error:', err))
            } else {
                console.log('[launch-app] shell.openPath success')
            }
        } catch (e) {
            console.error('[launch-app] Unexpected error:', e)
        }
    })

    // 打开外部链接 (新增)
    ipcMain.handle('open-external', async (_: IpcMainInvokeEvent, url: string) => {
        try {
            await shell.openExternal(url)
        } catch (e) {
            console.error('Failed to open external URL:', url, e)
        }
    })

    // 打开设置窗口
    ipcMain.on('open-settings', () => {
        createSettingsWindow()
    })

    // 获取开机自启设置
    ipcMain.handle('get-login-item-settings', () => {
        return app.getLoginItemSettings()
    })

    // 设置开机自启
    ipcMain.handle('set-login-item-settings', (_: IpcMainInvokeEvent, settings: any) => {
        app.setLoginItemSettings(settings)
        return app.getLoginItemSettings()
    })

    // 执行任意命令
    ipcMain.on('execute-command', (_: IpcMainEvent, command: string) => {
        const { exec } = require('child_process')
        exec(command, (error: any) => {
            if (error) {
                console.error(`exec error: ${error}`)
            }
        })
    })

    // 显示右键菜单
    ipcMain.on('show-context-menu', (event: IpcMainEvent, itemData: any) => {
        const menu = new Menu()

        if (
            itemData &&
            typeof itemData.widgetIndex === 'number' &&
            typeof itemData.itemIndex === 'number'
        ) {
            const { widgetIndex, itemIndex, target } = itemData

            // --- 内置组件子功能 ---
            if (target) {
                const lowerTarget = target.toLowerCase()

                // ClassIsland 扩展功能
                if (lowerTarget.includes('classisland')) {
                    menu.append(
                        new MenuItem({
                            label: 'CI 换课',
                            click: () => {
                                shell
                                    .openExternal('classisland://app/class-swap')
                                    .catch((e) => console.error('启动 CI 换课失败:', e))
                            }
                        })
                    )
                    menu.append(new MenuItem({ type: 'separator' }))
                }

                // SecRandom 扩展功能
                if (lowerTarget.includes('secrandom')) {
                    menu.append(
                        new MenuItem({
                            label: '随机点名',
                            click: () => {
                                shell
                                    .openExternal('secrandom://pumping')
                                    .catch((e) => console.error('启动随机点名失败:', e))
                            }
                        })
                    )
                    menu.append(new MenuItem({ type: 'separator' }))
                }
            }
            // --------------------

            menu.append(
                new MenuItem({
                    label: '打开所在位置',
                    click: () => {
                        if (target) {
                            const fullPath = utils.resolveExecutablePath(target)
                            console.log('[Main] Showing item in folder:', target, '->', fullPath)

                            if (fullPath) {
                                shell.showItemInFolder(fullPath)
                            } else {
                                console.error('[Main] Path does not exist:', target)
                            }
                        }
                    }
                })
            )

            menu.append(new MenuItem({ type: 'separator' }))

            menu.append(
                new MenuItem({
                    label: '删除',
                    click: () => {
                        // 执行删除逻辑
                        const widgets = store.get('widgets')
                        if (
                            widgets[widgetIndex] &&
                            widgets[widgetIndex].targets &&
                            widgets[widgetIndex].targets[itemIndex]
                        ) {
                            // 从数组中移除
                            widgets[widgetIndex].targets.splice(itemIndex, 1)

                            // 保存配置
                            store.set('widgets', widgets)

                            // 通知更新
                            sidebarWindow.win?.webContents.send('config-updated', store.store)
                        }
                    }
                })
            )
        } else if (itemData && itemData.target) {
            menu.append(
                new MenuItem({
                    label: '打开所在位置',
                    click: () => {
                        const fullPath = utils.resolveExecutablePath(itemData.target)
                        console.log(
                            '[Main] Showing item in folder:',
                            itemData.target,
                            '->',
                            fullPath
                        )
                        if (fullPath) {
                            shell.showItemInFolder(fullPath)
                        }
                    }
                })
            )
        } else {
            menu.append(
                new MenuItem({
                    label: '设置',
                    click: () => {
                        createSettingsWindow()
                    }
                })
            )

            menu.append(
                new MenuItem({
                    label: '退出应用',
                    click: () => {
                        app.quit()
                    }
                })
            )
        }

        menu.popup({ window: BrowserWindow.fromWebContents(event.sender) || undefined })
    })

    // 获取文件夹下的文件
    ipcMain.handle(
        'get-files-in-folder',
        async (_: IpcMainInvokeEvent, folderPath: string, maxCount: number) => {
            try {
                const resolvedPath = utils.resolveWindowsEnv(folderPath)
                if (!fs.existsSync(resolvedPath)) {
                    console.warn('Folder does not exist:', resolvedPath)
                    return []
                }

                // 替换为异步 API
                const files = await fs.promises.readdir(resolvedPath)

                const fileStatsPromises = files.map(async (file) => {
                    const fullPath = path.join(resolvedPath, file)
                    try {
                        const stats = await fs.promises.stat(fullPath)
                        return {
                            name: file,
                            path: fullPath,
                            mtime: stats.mtime,
                            isDirectory: stats.isDirectory()
                        }
                    } catch (e) {
                        return null
                    }
                })

                const fileStats = (await Promise.all(fileStatsPromises))
                    .filter(
                        (f) =>
                            f !== null &&
                            !f.isDirectory &&
                            !f.name.startsWith('desktop.ini')
                    )

                // 按时间倒序排列
                fileStats.sort((a, b) => {
                    if (a && b) {
                        return b.mtime.getTime() - a.mtime.getTime()
                    }
                    return 0
                })

                return fileStats.slice(0, maxCount || 100)
            } catch (err) {
                console.error('Error listing files:', err)
                return []
            }
        }
    )

    // 添加快捷方式
    ipcMain.handle('add-shortcut', async (_: IpcMainInvokeEvent, filePath: string) => {
        try {
            const fileName = path.basename(filePath)
            const name = fileName.replace(/\.[^/.]+$/, '')

            const widgets = store.get('widgets', [])
            let launcherWidget = widgets.find((w) => w.type === 'launcher')

            if (!launcherWidget) {
                launcherWidget = {
                    type: 'launcher',
                    layout: 'grid',
                    targets: []
                }
                widgets.push(launcherWidget)
            }

            if (!Array.isArray(launcherWidget.targets)) {
                launcherWidget.targets = []
            }

            launcherWidget.targets.push({
                name: name,
                target: filePath
            })

            store.set('widgets', widgets)
            sidebarWindow.win?.webContents.send('config-updated', store.store)

            return { success: true }
        } catch (err: unknown) {
            console.error('添加快捷方式失败:', err)
            const message = err instanceof Error ? err.message : 'An unknown error occurred'
            return { success: false, error: message }
        }
    })
}

app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.class.sidebar')

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    registerIpc()
    sidebarWindow.create()

    app.on('activate', function () {
        if (sidebarWindow.win === null) sidebarWindow.create()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
