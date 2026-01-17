import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export class SettingsWindow {
    public win: BrowserWindow | null = null

    create(): void {
        if (this.win && !this.win.isDestroyed()) {
            this.win.focus()
            return
        }

        this.win = new BrowserWindow({
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
                preload: join(__dirname, '../preload/index.js'),
                sandbox: false,
                contextIsolation: true,
                nodeIntegration: false
            },
            autoHideMenuBar: true
        })

        this.win.setMenuBarVisibility(false)

        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            this.win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#/settings`)
        } else {
            this.win.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'settings' })
        }

        this.win.on('closed', () => {
            this.win = null
        })
    }
}

export const settingsWindow = new SettingsWindow()
