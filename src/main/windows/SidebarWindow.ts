import { BrowserWindow, screen, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import store from '../store'

export class SidebarWindow {
    public win: BrowserWindow | null = null
    private shouldAlwaysOnTop = true

    create(): void {
        const config = store.store
        const transforms = config.transforms || { display: 0, height: 64, posy: 0 }
        const displays = screen.getAllDisplays()
        const targetDisplay =
            transforms.display < displays.length
                ? displays[transforms.display]
                : screen.getPrimaryDisplay()

        const { x: screenX, y: screenY, height: screenHeight } = targetDisplay.bounds
        const initialHeight = 100 // 初始高度，稍后会通过 resize 调整

        // 修改 Y 轴计算逻辑：posy: 0 意味着垂直居中
        let yPos = Math.floor(screenY + (screenHeight / 2) + transforms.posy - (initialHeight / 2))

        // 边界限制 (Clamping)
        if (yPos < screenY) yPos = screenY
        else if (yPos + initialHeight > screenY + screenHeight)
            yPos = screenY + screenHeight - initialHeight

        this.win = new BrowserWindow({
            width: 50,
            height: initialHeight,
            x: screenX,
            y: yPos,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            movable: false,
            resizable: false,
            hasShadow: false,
            type: 'toolbar',
            webPreferences: {
                preload: join(__dirname, '../preload/index.js'),
                sandbox: false,
                contextIsolation: true,
                nodeIntegration: false
            }
        })

        // 加载页面
        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            this.win.loadURL(process.env['ELECTRON_RENDERER_URL'])
        } else {
            this.win.loadFile(join(__dirname, '../renderer/index.html'))
        }

        this.win.on('ready-to-show', () => this.win?.show())

        // 置顶逻辑
        this.startAlwaysOnTopLoop()

        // 链接打开逻辑
        this.win.webContents.setWindowOpenHandler((details) => {
            shell.openExternal(details.url)
            return { action: 'deny' }
        })
    }

    resize(width: number, height: number, y?: number): void {
        if (!this.win) return
        const config = store.store
        const transforms = config.transforms
        const displays = screen.getAllDisplays()
        const targetDisplay =
            transforms.display < displays.length
                ? displays[transforms.display]
                : screen.getPrimaryDisplay()
        const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } =
            targetDisplay.bounds

        // 修改 Y 轴计算逻辑：posy: 0 意味着垂直居中
        let newY: number
        if (typeof y === 'number') {
            newY = y
        } else {
            newY = Math.floor(screenY + (screenHeight / 2) + transforms.posy - (height / 2))
        }

        // 边界限制 (Clamping)
        if (newY < screenY) newY = screenY
        else if (newY + height > screenY + screenHeight) newY = screenY + screenHeight - height

        let newX = screenX
        if (newX + width > screenX + screenWidth) newX = screenX + screenWidth - width

        this.win.setBounds({
            width: Math.floor(width),
            height: Math.floor(height),
            x: Math.floor(newX),
            y: Math.floor(newY)
        })
    }

    setIgnoreMouse(ignore: boolean): void {
        if (this.win) {
            if (!ignore) {
                this.win.setIgnoreMouseEvents(false)
            } else {
                this.win.setIgnoreMouseEvents(true, { forward: true })
            }
        }
    }

    setAlwaysOnTop(flag: boolean): void {
        this.shouldAlwaysOnTop = flag
        this.win?.setAlwaysOnTop(flag, 'screen-saver')
    }

    private startAlwaysOnTopLoop(): void {
        setInterval(() => {
            if (this.win && !this.win.isDestroyed() && this.shouldAlwaysOnTop) {
                this.win.setAlwaysOnTop(true, 'screen-saver', 1)
                this.win.moveTop()
            }
        }, 200)
    }
}

export const sidebarWindow = new SidebarWindow()
