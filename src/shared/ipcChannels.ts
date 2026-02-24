/**
 * IPC 频道名称常量
 *
 * 统一管理所有主进程 ↔ 渲染进程的通信频道名称。
 * 在 preload 脚本和主进程中复用，杜绝硬编码字符串拼写错误的风险。
 *
 * 命名约定：
 * - send (fire-and-forget):  ipcRenderer.send → ipcMain.on
 * - invoke (request-reply):  ipcRenderer.invoke → ipcMain.handle
 * - on (main→renderer push): ipcRenderer.on
 */
export const IPC_CHANNELS = {
  // ── 窗口控制 ──────────────────────────────────────
  RESIZE_WINDOW: 'resize-window',
  SET_IGNORE_MOUSE: 'set-ignore-mouse',
  SET_ALWAYS_ON_TOP: 'set-always-on-top',
  MOVE_WINDOW: 'move-window',
  GET_CURRENT_POSY: 'get-current-posy',

  // ── 配置管理 ──────────────────────────────────────
  GET_CONFIG: 'get-config',
  SAVE_CONFIG: 'save-config',
  RESET_CONFIG: 'reset-config',
  CONFIG_UPDATED: 'config-updated', // main → renderer push

  // ── 应用生命周期 ──────────────────────────────────
  RELAUNCH_APP: 'relaunch-app',
  GET_APP_VERSION: 'get-app-version',
  OPEN_SETTINGS: 'open-settings',

  // ── 文件 & 启动 ──────────────────────────────────
  OPEN_FILE_DIALOG: 'open-file-dialog',
  GET_FILE_ICON: 'get-file-icon',
  LAUNCH_APP: 'launch-app',
  ADD_SHORTCUT: 'add-shortcut',
  GET_FILES_IN_FOLDER: 'get-files-in-folder',
  OPEN_EXTERNAL: 'open-external',

  // ── 右键菜单 ──────────────────────────────────────
  SHOW_CONTEXT_MENU: 'show-context-menu',

  // ── 命令执行 ──────────────────────────────────────
  EXECUTE_COMMAND: 'execute-command',

  // ── 音量控制 ──────────────────────────────────────
  GET_VOLUME: 'get-volume',
  SET_VOLUME: 'set-volume',

  // ── 开机自启 ──────────────────────────────────────
  GET_LOGIN_ITEM_SETTINGS: 'get-login-item-settings',
  SET_LOGIN_ITEM_SETTINGS: 'set-login-item-settings',

  // ── 系统工具 ──────────────────────────────────────
  SYSTEM_CHECK_CAPABILITY: 'system:check-capability',
  SYSTEM_EXECUTE_TOOL: 'system:execute-tool',
  TAKE_SCREENSHOT: 'take-screenshot',

  // ── 日志管理 ──────────────────────────────────────
  LOGS_OPEN_DIRECTORY: 'logs:open-directory',
  LOGS_SET_LEVEL: 'logs:set-level',
  LOGS_CLEAR: 'logs:clear',

  // ── 高级/调试功能 ──────────────────────────────────
  DEBUG_OPEN_CONFIG_FOLDER: 'debug:open-config-folder',
  DEBUG_OPEN_DEVTOOLS: 'debug:open-devtools',
  DEBUG_QUIT_APP: 'debug:quit-app',
  DEBUG_CLEAR_CACHE: 'debug:clear-cache',
} as const

/** 所有频道名称的联合类型 */
export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
