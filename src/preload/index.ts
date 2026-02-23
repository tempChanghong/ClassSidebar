import { contextBridge, ipcRenderer, webUtils, IpcRendererEvent } from 'electron'
import type { AppSchema } from '../main/store'
import { IPC_CHANNELS } from '../shared/ipcChannels'

/**
 * 预加载脚本：在渲染进程和主进程之间架起桥梁
 *
 * 安全原则：
 * 1. 所有频道名称使用 IPC_CHANNELS 常量，杜绝动态注入
 * 2. 参数由调用方传入，preload 只做转发，不做业务逻辑
 * 3. 不暴露 ipcRenderer 本身，仅暴露白名单方法
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ── 窗口控制 ──────────────────────────────────────
  resizeWindow: (width: number, height: number, y?: number): void =>
    ipcRenderer.send(IPC_CHANNELS.RESIZE_WINDOW, width, height, y),

  setIgnoreMouse: (ignore: boolean, forward: boolean): void =>
    ipcRenderer.send(IPC_CHANNELS.SET_IGNORE_MOUSE, ignore, forward),

  setAlwaysOnTop: (flag: boolean): void =>
    ipcRenderer.send(IPC_CHANNELS.SET_ALWAYS_ON_TOP, flag),

  moveWindow: (deltaY: number): void =>
    ipcRenderer.send(IPC_CHANNELS.MOVE_WINDOW, deltaY),

  getCurrentPosY: (): Promise<number> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_CURRENT_POSY),

  // ── 配置管理 ──────────────────────────────────────
  getConfig: (): Promise<AppSchema> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_CONFIG),

  saveConfig: (newConfig: AppSchema): Promise<{ success: boolean }> =>
    ipcRenderer.invoke(IPC_CHANNELS.SAVE_CONFIG, newConfig),

  resetConfig: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke(IPC_CHANNELS.RESET_CONFIG),

  onConfigUpdated: (callback: (newConfig: AppSchema) => void): void => {
    ipcRenderer.on(
      IPC_CHANNELS.CONFIG_UPDATED,
      (_event: IpcRendererEvent, newConfig: AppSchema) => callback(newConfig)
    )
  },

  // ── 应用生命周期 ──────────────────────────────────
  relaunchApp: (): void =>
    ipcRenderer.send(IPC_CHANNELS.RELAUNCH_APP),

  getAppVersion: (): Promise<string> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_APP_VERSION),

  openSettings: (): void =>
    ipcRenderer.send(IPC_CHANNELS.OPEN_SETTINGS),

  // ── 文件 & 启动 ──────────────────────────────────
  openFileDialog: (options?: OpenFileDialogOptions): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.OPEN_FILE_DIALOG, options),

  getFileIcon: (filePath: string): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_FILE_ICON, filePath),

  launchApp: (target: string, args: string[]): void =>
    ipcRenderer.send(IPC_CHANNELS.LAUNCH_APP, target, args),

  addShortcut: (filePath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.ADD_SHORTCUT, filePath),

  getFilesInFolder: (folderPath: string, maxCount: number): Promise<FileEntry[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_FILES_IN_FOLDER, folderPath, maxCount),

  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL, url),

  // ── 右键菜单 ──────────────────────────────────────
  showContextMenu: (itemData: ContextMenuPayload): void =>
    ipcRenderer.send(IPC_CHANNELS.SHOW_CONTEXT_MENU, itemData),

  // ── 命令执行 ──────────────────────────────────────
  executeCommand: (command: string): void =>
    ipcRenderer.send(IPC_CHANNELS.EXECUTE_COMMAND, command),

  // ── 音量控制 ──────────────────────────────────────
  getVolume: (): Promise<number> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_VOLUME),

  setVolume: (value: number): void =>
    ipcRenderer.send(IPC_CHANNELS.SET_VOLUME, value),

  // ── 开机自启 ──────────────────────────────────────
  getLoginItemSettings: (): Promise<LoginItemSettingsResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.GET_LOGIN_ITEM_SETTINGS),

  setLoginItemSettings: (settings: LoginItemSettingsInput): Promise<LoginItemSettingsResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.SET_LOGIN_ITEM_SETTINGS, settings),

  // ── 系统工具 ──────────────────────────────────────
  checkSystemCapability: (toolName: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_CHECK_CAPABILITY, toolName),

  executeSystemTool: (toolName: string): void =>
    ipcRenderer.send(IPC_CHANNELS.SYSTEM_EXECUTE_TOOL, toolName),

  // ── 文件路径 (本地 API，非 IPC) ──────────────────
  getFilePath: (file: File): string => {
    if (webUtils && webUtils.getPathForFile) {
      return webUtils.getPathForFile(file)
    }
    return file.path
  },

  // ── 日志管理 ──────────────────────────────────────
  openLogDirectory: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.LOGS_OPEN_DIRECTORY),

  setLogLevel: (level: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke(IPC_CHANNELS.LOGS_SET_LEVEL, level),

  clearLogs: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.LOGS_CLEAR),
})

// ─────────────────────────────────────────────────────────────────
// 以下类型仅在 preload 内部使用，用于给 exposeInMainWorld 的参数标注类型。
// 渲染进程的全局类型声明在 env.d.ts 中。
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

/** getLoginItemSettings 返回值 */
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
