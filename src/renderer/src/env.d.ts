/// <reference types="vite/client" />
import type { AppSchema } from '../../main/store'

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

// ─────────────────────────────────────────────────────────────────
// 公共 IPC 类型定义
// 供渲染进程中的所有 .vue / .ts 消费
// ─────────────────────────────────────────────────────────────────

/** 文件选择对话框选项 */
interface OpenFileDialogOptions {
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>
  filters?: Array<{ name: string; extensions: string[] }>
}

/** 右键菜单数据载荷 */
interface ContextMenuPayload {
  widgetIndex?: number
  itemIndex?: number
  target?: string
}

/** getFilesInFolder 返回的文件条目 */
interface FileEntry {
  name: string
  path: string
  mtime: Date
  isDirectory: boolean
}

/** getLoginItemSettings 返回值 (Electron.LoginItemSettings 的精确子集) */
interface LoginItemSettingsResult {
  openAtLogin: boolean
  openAsHidden: boolean
  wasOpenedAtLogin: boolean
  wasOpenedAsHidden: boolean
  restoreState: boolean
  executableWillLaunchAtLogin: boolean
  launchItems: Array<{
    name: string
    path: string
    args: string[]
    scope: string
    enabled: boolean
  }>
}

/** setLoginItemSettings 入参 */
interface LoginItemSettingsInput {
  openAtLogin?: boolean
  openAsHidden?: boolean
  path?: string
  args?: string[]
  enabled?: boolean
  name?: string
}

// ─────────────────────────────────────────────────────────────────
// 全局 Window.electronAPI 接口
// ─────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    electronAPI: {
      // ── 窗口控制 ────────────────────────────────
      resizeWindow: (width: number, height: number, y?: number) => void
      setIgnoreMouse: (ignore: boolean, forward: boolean) => void
      setAlwaysOnTop: (flag: boolean) => void
      moveWindow: (deltaY: number) => void
      getCurrentPosY: () => Promise<number>

      // ── 配置管理 ────────────────────────────────
      getConfig: () => Promise<AppSchema>
      saveConfig: (newConfig: AppSchema) => Promise<{ success: boolean }>
      resetConfig: () => Promise<{ success: boolean }>
      onConfigUpdated: (callback: (newConfig: AppSchema) => void) => void

      // ── 应用生命周期 ────────────────────────────
      relaunchApp: () => void
      getAppVersion: () => Promise<string>
      openSettings: () => void

      // ── 文件 & 启动 ────────────────────────────
      openFileDialog: (options?: OpenFileDialogOptions) => Promise<string | null>
      getFileIcon: (filePath: string) => Promise<string | null>
      launchApp: (target: string, args: string[]) => void
      addShortcut: (filePath: string) => Promise<{ success: boolean; error?: string }>
      getFilesInFolder: (folderPath: string, maxCount: number) => Promise<FileEntry[]>
      openExternal: (url: string) => Promise<void>

      // ── 右键菜单 ────────────────────────────────
      showContextMenu: (itemData: ContextMenuPayload) => void

      // ── 命令执行 ────────────────────────────────
      executeCommand: (command: string) => void

      // ── 音量控制 ────────────────────────────────
      getVolume: () => Promise<number>
      setVolume: (value: number) => void

      // ── 开机自启 ────────────────────────────────
      getLoginItemSettings: () => Promise<LoginItemSettingsResult>
      setLoginItemSettings: (settings: LoginItemSettingsInput) => Promise<LoginItemSettingsResult>

      // ── 系统工具 ────────────────────────────────
      checkSystemCapability: (toolName: string) => Promise<boolean>
      executeSystemTool: (toolName: string) => void

      // ── 文件路径 (本地 API) ─────────────────────
      getFilePath: (file: File) => string

      // ── 日志管理 ────────────────────────────────
      openLogDirectory: () => Promise<void>
      setLogLevel: (level: string) => Promise<{ success: boolean }>
      clearLogs: () => Promise<{ success: boolean; error?: string }>
    }
  }
}
