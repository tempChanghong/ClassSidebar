import { app, Menu, Tray, nativeImage } from 'electron'
import * as path from 'path'
import { sidebarWindow } from './windows/SidebarWindow'
import { settingsWindow } from './windows/SettingsWindow'
import log from './Logger'

/**
 * 系统托盘管理器 (TrayManager)
 *
 * 根据 docs/TRAY_MANAGEMENT_PLAN.md 规划实现：
 * - 托盘图标 + Tooltip
 * - 左键单击切换侧边栏可见性
 * - 右键上下文菜单（显示/隐藏、设置中心、重启、退出）
 * - 菜单文案根据窗口状态动态更新
 */
export class TrayManager {
    private tray: Tray | null = null

    constructor() {
        // 监听窗口 show/hide 事件以动态更新菜单文案
        sidebarWindow.onShow = () => this.updateContextMenu()
        sidebarWindow.onHide = () => this.updateContextMenu()
    }

    /**
     * 初始化托盘 —— 确保在 app.whenReady() 之后调用
     */
    init(): void {
        log.debug('[TrayManager] Initializing...')
        app.whenReady()
            .then(() => this.createTray())
            .catch((err) => {
                log.error('[TrayManager] Failed to initialize tray:', err)
            })
    }

    /**
     * 创建托盘图标、绑定事件、构建上下文菜单
     */
    private createTray(): void {
        log.debug('[TrayManager] Creating tray icon...')
        try {
            const icon = this.loadTrayIcon()
            this.tray = new Tray(icon)
            this.tray.setToolTip('ClassSidebar')

            // 构建初始右键菜单
            this.updateContextMenu()

            // 左键单击 → 切换侧边栏可见性
            this.tray.on('click', () => {
                log.info('[TrayManager] Tray icon clicked — toggling sidebar visibility.')
                this.toggleWindow()
            })

            log.info('[TrayManager] Tray icon created successfully.')
        } catch (error) {
            log.error('[TrayManager] Failed to create tray icon:', error)
        }
    }

    /**
     * 加载托盘图标，兼容开发环境与打包后环境。
     * Windows 上优先使用 .ico，回退到 .png。
     */
    private loadTrayIcon(): Electron.NativeImage {
        const iconName = process.platform === 'win32' ? 'icons.ico' : 'icons.png'
        const fallbackName = 'icons.png'

        let iconPath: string
        if (app.isPackaged) {
            iconPath = path.join(process.resourcesPath, 'icons', iconName)
        } else {
            iconPath = path.join(__dirname, '../../icons', iconName)
        }

        let icon = nativeImage.createFromPath(iconPath)

        // 如果首选格式加载失败 (empty)，尝试回退
        if (icon.isEmpty() && iconName !== fallbackName) {
            log.warn(`[TrayManager] Icon not found at ${iconPath}, trying fallback...`)
            const fallbackPath = app.isPackaged
                ? path.join(process.resourcesPath, 'icons', fallbackName)
                : path.join(__dirname, '../../icons', fallbackName)
            icon = nativeImage.createFromPath(fallbackPath)
        }

        if (icon.isEmpty()) {
            log.warn('[TrayManager] Failed to load any tray icon. Using empty image.')
        }

        return icon
    }

    /**
     * 构建 / 更新右键上下文菜单
     * 菜单项按照规划文档: 显示/隐藏侧边栏 → 设置中心 → 分割线 → 重启应用 → 退出
     */
    updateContextMenu(): void {
        if (!this.tray) return

        const isVisible = sidebarWindow.win?.isVisible() ?? false

        const contextMenu = Menu.buildFromTemplate([
            {
                label: isVisible ? '隐藏侧边栏' : '显示侧边栏',
                click: () => {
                    log.info('[TrayManager] Menu: Toggle sidebar visibility.')
                    this.toggleWindow()
                }
            },
            {
                label: '设置中心',
                click: () => {
                    log.info('[TrayManager] Menu: Open settings.')
                    settingsWindow.create()
                }
            },
            { type: 'separator' },
            {
                label: '重启应用',
                click: () => {
                    log.info('[TrayManager] Menu: Relaunch application.')
                    app.relaunch()
                    app.exit(0)
                }
            },
            {
                label: '完全退出',
                click: () => {
                    log.info('[TrayManager] Menu: Quit application.')
                    // app.quit() 会触发 before-quit，SidebarWindow 中的
                    // isQuitting 标志会被设为 true，从而绕过 close 拦截
                    app.quit()
                }
            }
        ])

        this.tray.setContextMenu(contextMenu)
    }

    /**
     * 切换侧边栏窗口的可见性
     */
    toggleWindow(): void {
        const win = sidebarWindow.win
        if (!win) {
            log.warn('[TrayManager] toggleWindow: sidebarWindow.win is null, attempting to create.')
            sidebarWindow.create()
            return
        }

        if (win.isVisible()) {
            win.hide()
            log.debug('[TrayManager] Sidebar window hidden.')
        } else {
            win.show()
            win.setSkipTaskbar(true)       // 保持不显示在任务栏
            win.setAlwaysOnTop(true, 'screen-saver') // 恢复置顶
            log.debug('[TrayManager] Sidebar window shown.')
        }

        // 窗口状态改变后更新菜单文案
        this.updateContextMenu()
    }

    /**
     * 销毁托盘图标 —— 在应用退出前调用
     */
    destroy(): void {
        if (this.tray) {
            this.tray.destroy()
            this.tray = null
            log.info('[TrayManager] Tray icon destroyed.')
        }
    }
}

export const trayManager = new TrayManager()
