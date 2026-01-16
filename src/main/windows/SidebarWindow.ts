import { BrowserWindow, screen, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import store from '../store'

export class SidebarWindow {
    public win: BrowserWindow | null = null
    private shouldAlwaysOnTop = true

    create(): void {
        const config = store.store
        // 默认高度设为 450 (与前端 TARGET_H 一致)，避免初始高度跳变
        const transforms = config.transforms || { display: 0, height: 450, posy: 0 }
        const displays = screen.getAllDisplays()
        const targetDisplay =
            transforms.display < displays.length
                ? displays[transforms.display]
                : screen.getPrimaryDisplay()

        const { x: screenX, y: screenY, height: screenHeight } = targetDisplay.bounds
        
        // 关键修复：使用配置中的高度，而不是硬编码的 100
        // 注意：收起状态下高度通常较小 (如 64)，展开时较大 (如 450)
        // 这里我们初始化为收起状态的高度 (通常是 transforms.height，如果前端逻辑是收起时 height=64)
        // 但为了安全，我们先用一个合理值，前端加载后会立即 resize
        const initialHeight = transforms.height || 450 
        
        // 初始宽度：收起状态通常很窄 (如 20px)
        const initialWidth = 20 

        // 修改 Y 轴计算逻辑：posy: 0 意味着垂直居中
        let yPos = Math.floor(screenY + (screenHeight / 2) + transforms.posy - (initialHeight / 2))

        // 边界限制 (Clamping)
        if (yPos < screenY) yPos = screenY
        else if (yPos + initialHeight > screenY + screenHeight)
            yPos = screenY + screenHeight - initialHeight

        this.win = new BrowserWindow({
            width: initialWidth,
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
            // 关键：使用传入的 height 进行计算，而不是 store 中的 height
            // 因为 resize 时 height 可能正在变化（例如展开/收起动画）
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

    move(deltaY: number): void {
        if (!this.win) return
        const bounds = this.win.getBounds()
        const newY = bounds.y + deltaY
        
        // 只更新窗口位置，不更新 store，避免循环和性能问题
        this.win.setBounds({ y: newY })
    }
    
    // 新增：获取当前 posy (用于前端保存)
    getCurrentPosY(): number {
        if (!this.win) return 0
        const bounds = this.win.getBounds()
        const config = store.store
        const transforms = config.transforms
        const displays = screen.getAllDisplays()
        const targetDisplay =
            transforms.display < displays.length
                ? displays[transforms.display]
                : screen.getPrimaryDisplay()
        const { y: screenY, height: screenHeight } = targetDisplay.bounds
        
        // 反向计算 posy
        // y = screenY + (screenHeight / 2) + posy - (height / 2)
        // posy = y - screenY - (screenHeight / 2) + (height / 2)
        return Math.floor(bounds.y - screenY - (screenHeight / 2) + (bounds.height / 2))
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
