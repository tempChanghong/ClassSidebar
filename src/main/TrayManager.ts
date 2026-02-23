import { app, Menu, Tray, nativeImage } from 'electron'
import * as path from 'path'
import { sidebarWindow } from './windows/SidebarWindow'
import { settingsWindow } from './windows/SettingsWindow'
import log from './Logger'

export class TrayManager {
    private tray: Tray | null = null

    constructor() {
        // 监听窗口状态变化
        sidebarWindow.onShow = () => this.updateContextMenu()
        sidebarWindow.onHide = () => this.updateContextMenu()
    }

    init(): void {
        log.debug('Initializing TrayManager...')
        // 确保应用准备就绪后再创建托盘
        app.whenReady().then(() => {
            this.createTray()
        }).catch(err => {
            log.error('Failed to initialize tray on whenReady:', err)
        })
    }

    createTray(): void {
        log.debug('Creating tray icon...')
        try {
            // 获取图标路径
            // 注意：在开发环境和生产环境中，资源路径可能不同
            // 这里假设 icons 目录在项目根目录下，或者打包后在 resources 目录下
            let iconPath = path.join(__dirname, '../../icons/icons.png')
            
            // 如果是打包后的环境，可能需要调整路径
            if (app.isPackaged) {
                 iconPath = path.join(process.resourcesPath, 'icons/icons.png')
            }

            // 如果找不到 png，尝试 ico (Windows 推荐 ico)
            // 这里为了简单，先尝试 png，实际项目中建议根据平台选择
            const icon = nativeImage.createFromPath(iconPath)

            this.tray = new Tray(icon)
            this.tray.setToolTip('Sidebar for Class')

            this.updateContextMenu()

            // 左键点击事件
            this.tray.on('click', () => {
                log.info('Tray icon clicked. Toggling window visibility.')
                this.toggleWindow()
            })
            log.info('Tray icon created successfully.')
        } catch (error) {
            log.error('Failed to create tray icon:', error)
        }
    }

    updateContextMenu(): void {
        if (!this.tray) return

        const contextMenu = Menu.buildFromTemplate([
            {
                label: '设置',
                click: () => {
                    log.info('User clicked setting from tray icon')
                    settingsWindow.create()
                }
            },
            { type: 'separator' },
            {
                label: '重启应用',
                click: () => {
                    log.info('User clicked relaunch from tray icon')
                    app.relaunch()
                    app.exit(0)
                }
            },
            {
                label: '退出',
                click: () => {
                    log.info('User clicked quit from tray icon')
                    // 彻底退出
                    app.quit()
                }
            }
        ])

        this.tray.setContextMenu(contextMenu)
    }

    toggleWindow(): void {
        const win = sidebarWindow.win
        if (!win) {
            log.warn('Attempted to toggle window, but sidebarWindow.win is null.')
            return
        }

        if (win.isVisible()) {
            win.hide()
            log.debug('Sidebar window hidden.')
        } else {
            win.show()
            win.setSkipTaskbar(true) // 保持不显示在任务栏
            win.setAlwaysOnTop(true, 'screen-saver') // 确保置顶
            log.debug('Sidebar window shown.')
        }
        
        // 更新菜单文案
        this.updateContextMenu()
    }
    
    // 销毁托盘
    destroy(): void {
        if (this.tray) {
            this.tray.destroy()
            this.tray = null
            log.info('Tray icon destroyed.')
        }
    }
}

export const trayManager = new TrayManager()
