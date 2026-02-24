import { BrowserWindow, app } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import log from '../Logger'

export class OnboardingWindow {
    public win: BrowserWindow | null = null
    public isCompleted = false

    create(): void {
        if (this.win) return

        this.win = new BrowserWindow({
            width: 720,
            height: 540,
            frame: false,
            transparent: true,
            resizable: false,
            center: true,
            show: false, // 等待 ready-to-show
            webPreferences: {
                preload: join(__dirname, '../preload/index.js'),
                sandbox: false,
                contextIsolation: true,
                nodeIntegration: false
            }
        })

        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            this.win.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/onboarding')
        } else {
            this.win.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'onboarding' })
        }

        this.win.on('ready-to-show', () => {
            this.win?.show()
        })

        // 极端情况拦截：监听窗口关闭
        this.win.on('closed', () => {
            if (!this.isCompleted) {
                log.warn('[Onboarding] Window closed before completion. Quitting app...')
                app.quit()
            }
            this.win = null
        })
    }

    destroy(): void {
        if (this.win) {
            this.win.close()
        }
    }
}

export const onboardingWindow = new OnboardingWindow()
