import { BrowserWindow, screen, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import store from '../store'

export class SidebarWindow {
    public win: BrowserWindow | null = null
    private shouldAlwaysOnTop = true

    create(): void {
        const config = store.store
        const transforms = config.transforms || { display: 0, height: 450, posy: 0 }
        const displays = screen.getAllDisplays()
        const targetDisplay =
            transforms.display < displays.length
                ? displays[transforms.display]
                : screen.getPrimaryDisplay()

        const { x: screenX, y: screenY, height: screenHeight } = targetDisplay.bounds
        
        const initialHeight = transforms.height || 64 
        const initialWidth = 20 

        let yPos = Math.floor(screenY + (screenHeight / 2) + transforms.posy - (initialHeight / 2))

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

        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            this.win.loadURL(process.env['ELECTRON_RENDERER_URL'])
        } else {
            this.win.loadFile(join(__dirname, '../renderer/index.html'))
        }

        this.win.on('ready-to-show', () => this.win?.show())
        this.startAlwaysOnTopLoop()

        this.win.webContents.setWindowOpenHandler((details) => {
            shell.openExternal(details.url)
            return { action: 'deny' }
        })
    }

    resize(width: number, height: number, y?: number): void {
        if (!this.win) return
        
        console.log(`[MAIN-DEBUG] resize() called. w=${width}, h=${height}, y=${y}`)
        const currentBounds = this.win.getBounds()
        console.log(`[MAIN-DEBUG] Current Bounds: x=${currentBounds.x}, y=${currentBounds.y}, w=${currentBounds.width}, h=${currentBounds.height}`)

        const config = store.store
        const transforms = config.transforms
        const displays = screen.getAllDisplays()
        const targetDisplay =
            transforms.display < displays.length
                ? displays[transforms.display]
                : screen.getPrimaryDisplay()
        const { x: screenX, width: screenWidth, y: screenY, height: screenHeight } = targetDisplay.bounds

        let newY: number
        if (typeof y === 'number') {
            newY = y
        } else {
            newY = this.win.getBounds().y
        }

        if (newY < screenY) newY = screenY
        else if (newY + height > screenY + screenHeight) newY = screenY + screenHeight - height

        let newX = screenX
        if (newX + width > screenX + screenWidth) newX = screenX + screenWidth - width

        console.log(`[MAIN-DEBUG] Applying Bounds: x=${Math.floor(newX)}, y=${Math.floor(newY)}, w=${Math.floor(width)}, h=${Math.floor(height)}`)

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
        this.win.setBounds({ y: bounds.y + deltaY })
    }
    
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
        
        return Math.floor(bounds.y - screenY - (screenHeight / 2) + (bounds.height / 2))
    }

    setIgnoreMouse(ignore: boolean): void {
        if (this.win) {
            if (ignore) {
                this.win.setIgnoreMouseEvents(true, { forward: true })
            } else {
                this.win.setIgnoreMouseEvents(false)
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