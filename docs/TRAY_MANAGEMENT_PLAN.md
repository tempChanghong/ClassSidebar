# 📋 系统托盘管理功能规划 (System Tray Management)

## 1. 概述 (Overview)
本功能旨在为应用添加 Windows 系统托盘支持。允许应用在关闭主窗口后继续在后台运行，并通过托盘图标提供快速访问入口（显示/隐藏、重启、退出），从而提升用户体验和应用的即时可用性。

## 2. 用户故事 (User Stories)
*   **作为用户**，我希望点击窗口关闭按钮时，应用最小化到托盘而不是直接退出，防止误操作。
*   **作为用户**，我希望通过右下角托盘图标右键菜单，快速执行“重启应用”或“彻底退出”。
*   **作为用户**，我希望单击托盘图标能快速切换侧边栏的显示与隐藏状态。
*   **作为用户**，我希望能直观地看到应用是否正在运行（通过托盘图标）。

## 3. 功能需求 (Functional Requirements)

### 3.1 托盘图标
*   在 Windows 任务栏右下角显示应用图标。
*   图标应清晰，支持 `.ico` 或高分辨率 `.png`。
*   悬停在图标上时显示应用名称提示 (Tooltip)。

### 3.2 交互逻辑
*   **左键单击 (Click)**:
    *   如果窗口当前隐藏：显示窗口并置顶。
    *   如果窗口当前显示：隐藏窗口。
*   **右键单击 (Right Click)**:
    *   弹出上下文菜单 (Context Menu)。

### 3.3 上下文菜单项
1.  **显示/隐藏侧边栏 (Show/Hide Sidebar)**
    *   动态文案：根据当前窗口状态变化。
2.  **分割线 (Separator)**
3.  **重启应用 (Restart)**
    *   用于快速重载应用（方便开发调试或应用更新后刷新）。
4.  **退出 (Quit)**
    *   彻底关闭应用进程。

### 3.4 窗口行为变更
*   拦截主窗口的 `close` 事件。
*   默认行为改为 `hide()` 而非 `app.quit()`。
*   只有通过托盘菜单点击“退出”时，才执行真正的销毁逻辑。

## 4. 技术架构 (Technical Architecture)

假设项目基于 **Electron**，逻辑将主要在 **Main Process (主进程)** 中实现。

### 4.1 模块化设计
建议创建一个独立的 `TrayManager` 类或模块，避免 `background.js` / `main.js` 过于臃肿。

```javascript
// 伪代码示例
class TrayManager {
  constructor(mainWindow, app) {
    this.mainWindow = mainWindow;
    this.app = app;
    this.tray = null;
  }

  createTray() {
    // 1. 加载图标
    // 2. 创建 Tray 实例
    // 3. 绑定点击事件
    // 4. 构建并设置 ContextMenu
  }

  updateMenu() {
    // 当窗口状态改变时，更新菜单文案 (显示 vs 隐藏)
  }
}
```

### 4.2 关键 API
*   `electron.Tray`: 核心类。
*   `electron.Menu`: 构建右键菜单。
*   `electron.nativeImage`: 处理图标路径和缩放。
*   `win.on('close', (e) => { ... })`: 拦截关闭事件。

## 5. 开发任务清单 (Task List)

- [x] **资源准备**:
    - [x] 准备 16x16, 32x32 尺寸的 `.ico` 图标文件（确保在深色/浅色任务栏下均可见）。
- [x] **核心实现**:
    - [x] 在主进程中引入 `Tray` 模块。
    - [x] 实现 `createTray()` 函数，加载图标。
    - [x] 实现右键菜单逻辑（显示、重启、退出）。
    - [x] 实现左键点击切换可见性逻辑。
- [x] **窗口生命周期管理**:
    - [x] 修改 `BrowserWindow` 的关闭逻辑（`e.preventDefault()`）。
    - [x] 确保 `app.quit()` 能正确绕过关闭拦截。
- [x] **UI/UX 优化**:
    - [x] 添加托盘气泡提示 (Tooltip)。
    - [x] (可选) 添加闪烁或角标功能（用于通知）。
- [x] **测试**:
    - [x] 测试 Windows 10/11 下的表现。
    - [x] 测试打包后的图标路径是否正确（常见坑）。

## 6. 注意事项 (Notes)
*   **路径问题**: 开发环境 (`development`) 和生产环境 (`production`) 的图标路径通常不同，需使用 `path.join(__dirname, ...)` 或 `process.resourcesPath` 进行兼容处理。
*   **单例模式**: 确保应用不会启动多个实例（`app.requestSingleInstanceLock`），否则托盘会出现多个图标。