/// <reference types="vite/client" />
import type { AppSchema } from '../../main/store'

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 扩展全局 Window 接口
declare global {
  interface Window {
    electronAPI: {
      resizeWindow: (width: number, height: number, y?: number) => void
      setIgnoreMouse: (ignore: boolean, forward: boolean) => void
      getConfig: () => Promise<AppSchema>
      saveConfig: (newConfig: AppSchema) => Promise<{ success: boolean }>
      onConfigUpdated: (callback: (newConfig: AppSchema) => void) => void
      addShortcut: (filePath: string) => Promise<{ success: boolean; error?: string }>
      openFileDialog: (options?: any) => Promise<string | null>
      showContextMenu: (itemData: any) => void
      launchApp: (target: string, args: string[]) => void
      getFileIcon: (path: string) => Promise<string | null>
      setAlwaysOnTop: (flag: boolean) => void
      getVolume: () => Promise<number>
      setVolume: (value: number) => void
      getFilesInFolder: (path: string, maxCount: number) => Promise<any[]>
      executeCommand: (command: string) => void
      openExternal: (url: string) => Promise<void>
      moveWindow: (deltaY: number) => void
      getCurrentPosY: () => Promise<number>
      getFilePath: (file: File) => string
      getAppVersion: () => Promise<string>
      getLoginItemSettings: () => Promise<any>
      setLoginItemSettings: (settings: any) => Promise<any>
      openSettings: () => void
    }
  }
}
