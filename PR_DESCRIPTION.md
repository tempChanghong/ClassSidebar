# refactor: 重构 Widget 系统并修复核心稳定性问题

## 📝 变更摘要 (Summary)
本次 PR 对 ClassSidebar 进行了大规模的重构和修复，重点集中在 Widget 系统的增强、配置管理的健壮性提升以及 UI 交互的优化。

主要改进包括：
1.  **Widget 系统增强**：引入了可视化的 Widget 管理器，支持多种新类型的组件（URL, Command），并实现了拖拽排序和动态配置。
2.  **稳定性修复**：彻底解决了配置加载崩溃、保存失败以及侧边栏尺寸卡死等严重 Bug。
3.  **架构优化**：将复杂的侧边栏交互逻辑提取为 Composable，并全面升级了 TypeScript 类型定义。

## ✨ 新增功能 (Features)
*   **可视化组件管理** (`WidgetManager`): 在设置页面新增了组件管理面板，支持添加、编辑、删除和排序 Widget。
*   **新组件类型**:
    *   `UrlWidget`: 支持直接打开网页链接。
    *   `CommandWidget`: 支持执行系统命令（如 PowerShell/CMD）。
*   **交互优化**: 侧边栏现在能更流畅地响应配置变化，窗口尺寸会自动同步。

## 🐛 Bug 修复 (Fixes)
*   **配置崩溃**: 修复了 `electron-store` 因 Schema 校验导致的启动崩溃问题，并添加了自动迁移逻辑 (`runMigration`)。
*   **侧边栏卡死**: 修复了修改配置后窗口尺寸未同步导致 UI 截断的问题。
*   **命令执行**: 升级 `execute-command` IPC，支持 `spawn(shell: true)`，现在可以正确执行 `dir`, `ipconfig` 等命令。
*   **路径解析**: 修复了带空格路径的可执行文件解析错误。
*   **文件选择**: 修复了文件夹选择器无法选择目录的问题。

## ♻️ 代码重构 (Refactoring)
*   **Composable**: 将 `SidebarView` 中的拖拽、动画逻辑提取到 `useSidebarInteraction.ts`。
*   **TypeScript**: 全面完善了 `WidgetConfig` 和 `AppSchema` 的类型定义，消除了大量 `any` 类型隐患。
*   **Store**: 重写了 Store 的初始化和保存逻辑，确保数据一致性。

## ✅ 测试计划 (Test Plan)
1.  **全新安装**: 删除 `config.json`，启动应用，验证默认组件是否正确加载。
2.  **组件管理**: 进入设置页，尝试添加一个 URL 组件和一个 Command 组件，验证是否能正常保存和使用。
3.  **尺寸调整**: 修改侧边栏宽度配置，验证窗口是否即时响应且无卡顿。
4.  **命令测试**: 添加一个 `ping google.com` 命令组件，点击验证是否弹出终端窗口执行。

## 🔗 关联 Commits
*   `fix: 修复侧边栏定位、配置保存及命令执行等多个严重 Bug`
*   `fix(types): 修复因类型收窄导致的编译错误`
*   `fix(types): 修复 Widget 相关类型错误并完善默认配置`
*   `feat(widgets): 增强 Widget 系统并添加可视化管理`
*   `refactor(sidebar): 提取交互逻辑到 useSidebarInteraction Composable`
*   `fix: 增强类型安全并统一 UI 风格`
*   `fix: 修复路径解析逻辑并优化文件读取性能`
