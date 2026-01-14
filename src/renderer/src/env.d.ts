/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI: {
    resizeWindow: (width: number, height: number, y?: number) => void
    setIgnoreMouse: (ignore: boolean, forward: boolean) => void
    getConfig: () => Promise<any>
    saveConfig: (newConfig: any) => Promise<void>
    onConfigUpdated: (callback: (newConfig: any) => void) => void
    addShortcut: (filePath: string) => Promise<any>
    openFileDialog: () => Promise<any>
    showContextMenu: (itemData: any) => void
    launchApp: (target: string, args: string[]) => void
    getFileIcon: (path: string) => Promise<string>
    setAlwaysOnTop: (flag: boolean) => void
    getVolume: () => Promise<number>
    setVolume: (value: number) => void
    getFilesInFolder: (path: string, maxCount: number) => Promise<any[]>
    executeCommand: (command: string) => void
    getFilePath: (file: File) => string
    getAppVersion: () => Promise<string>
    getLoginItemSettings: () => Promise<any>
    setLoginItemSettings: (settings: any) => Promise<void>
    openSettings: () => void
  }
}
