# 🛠️ 设置页快捷功能规划 (Quick Actions in Settings)

## 1. 概述 (Overview)
在设置页面引入“快捷工具箱”组件。该组件采用抽屉式设计（默认折叠或紧凑排列），提供一组 Windows 系统级的高频操作入口（如任务管理器、注册表、服务等）。
设计目标是**极简**、**高效**，仅使用图标展示，不占用过多 UI 空间。

## 2. 用户故事 (User Stories)
*   **作为开发者/极客用户**，我希望在调整应用设置时，能顺手打开任务管理器查看资源占用，而不需要切换到开始菜单搜索。
*   **作为用户**，我希望有一键“返回桌面”的功能，以便快速隐藏所有干扰窗口。
*   **作为用户**，我希望应用能自动识别我的系统版本（如 Windows 家庭版），并隐藏不可用的工具（如组策略），避免点击无效。

## 3. 功能需求 (Functional Requirements)

### 3.1 工具列表
| 图标 (拟定) | 功能名称 | 命令/实现方式 | 备注 |
| :--- | :--- | :--- | :--- |
| 🖥️ | **返回桌面** (Show Desktop) | PowerShell / Shell Object | 最小化所有窗口 |
| 🔲 | **多任务视角** (Task View) | 模拟 Win+Tab / Shell CLSID | 需兼容 Win10/11 |
| 📊 | **任务管理器** (Task Manager) | `taskmgr` | |
| ⌨️ | **终端** (Terminal) | `wt` (优先) / `cmd` / `powershell` | 优先唤起 Windows Terminal |
| 🛡️ | **组策略** (Group Policy) | `gpedit.msc` | **需检测**: 仅专业版/企业版可用 |
| 📝 | **注册表** (Registry) | `regedit` | |
| ⚙️ | **服务** (Services) | `services.msc` | |
| 🔌 | **设备管理器** (Device Manager) | `devmgmt.msc` | |

### 3.2 交互设计 (UI/UX)
*   **抽屉式容器 (Drawer)**:
    *   组件为一个可折叠的面板，标题为“系统工具 (System Tools)”。
    *   **折叠态**: 仅显示标题和展开箭头，高度极小。
    *   **展开态**: 向下滑出图标网格（Grid Layout）。
*   **图标设计**:
    *   使用单色/线性图标（SVG），保持风格统一简约。
    *   **无文字标签**: 图标下方不显示文字。
    *   **Tooltip**: 鼠标悬停 0.5s 后显示功能名称气泡。
*   **响应式**: 根据设置窗口宽度自动调整每行显示的图标数量（4个或8个）。

### 3.3 组策略检测逻辑
*   在组件加载时，通过 IPC 通知主进程检查环境。
*   主进程检测 `C:\Windows\System32\gpedit.msc` 文件是否存在。
*   如果不存在（如家庭版），前端渲染时：
    *   方案 A: 隐藏该图标（推荐，保持整洁）。
    *   方案 B: 图标置灰，Tooltip 提示“当前系统版本不支持”。

## 4. 技术架构 (Technical Architecture)

### 4.1 IPC 通信
需要在 `preload` 和 `main` 之间建立通道。

*   `system:check-capability`:
    *   Input: `toolName` (string)
    *   Output: `boolean`
*   `system:execute-tool`:
    *   Input: `toolName` (string)
    *   Action: 主进程执行对应 `spawn` 或 `exec`。

### 4.2 核心代码逻辑 (Main Process)

```typescript
import { spawn, exec } from 'child_process';
import fs from 'fs';

// 检查能力
function checkCapability(tool: string): boolean {
    if (tool === 'gpedit') {
        return fs.existsSync('C:\\Windows\\System32\\gpedit.msc');
    }
    return true;
}

// 执行工具
function executeTool(tool: string) {
    switch (tool) {
        case 'taskmgr':
            spawn('taskmgr');
            break;
        case 'show-desktop':
            // 使用 PowerShell 调用 Shell.Application
            const psCommand = '(New-Object -ComObject Shell.Application).ToggleDesktop()';
            spawn('powershell', ['-command', psCommand]);
            break;
        case 'gpedit':
            // 再次检查防止绕过前端
            if (checkCapability('gpedit')) {
                exec('gpedit.msc');
            }
            break;
        // ... 其他工具
    }
}
```

## 5. 开发任务清单 (Task List)

- [ ] **后端 (Main Process)**:
    - [ ] 实现 `SystemToolManager` 类或在现有 IPC 处理中添加逻辑。
    - [ ] 实现 `gpedit` 的文件存在性检查。
    - [ ] 封装各系统命令的执行方法，处理异常（如命令未找到）。
- [ ] **前端 (Renderer - Settings)**:
    - [ ] 创建 `QuickActions` 组件。
    - [ ] 集成图标库（如 `@vicons/fluent` 或本地 SVG）。
    - [ ] 实现抽屉折叠/展开动画 (CSS transition)。
    - [ ] 实现 Tooltip 功能。
    - [ ] 在 `SettingsWindow` 页面引入该组件。
- [ ] **兼容性测试**:
    - [ ] Win10 vs Win11 测试“多任务视角”和“返回桌面”的表现。
    - [ ] 验证 Windows 家庭版下“组策略”图标是否正确隐藏。