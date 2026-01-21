# 📄 日志系统功能开发规划 (Gemini Code Assist 驱动)

## 1. 概述 (Overview)

为 `ClassSidebar` 应用设计并实现一个全面、可靠的日志系统。本项目将**利用 Gemini Code Assist (GCA)** 来显著加速开发进程。

该系统旨在集中收集来自主进程 (Main Process) 和渲染进程 (Renderer Process) 的日志信息，将其输出到本地文件，并提供便捷的日志查看与管理功能。这将极大地提升开发调试效率和用户支持能力。

本项目依然推荐使用 `electron-log` 作为核心日志库，它专为 Electron 应用设计，功能强大且易于集成。我们将借助 GCA 来生成配置代码、实现 IPC 通信和创建 UI 组件。

## 2. 用户故事 (User Stories)

*   **作为开发者**，我希望在一个统一的日志文件中查看所有进程（主进程、侧边栏、设置窗口）的输出，以便快速追踪和定位问题。
*   **作为开发者**，我希望应用中未被捕获的异常（Uncaught Exceptions）能被自动记录到日志中，防止问题被静默忽略。
*   **作为用户**，当应用出现故障时，我希望能轻松地在设置页面找到“打开日志目录”的按钮，方便我将日志文件提供给开发者。
*   **作为高级用户**，我希望可以调整日志的记录级别（如从 `info` 切换到 `debug`），以进行更深入的诊断。

## 3. 功能需求 (Functional Requirements)

### 3.1 日志核心功能
*   **统一日志目标**: 主进程和所有渲染进程的日志均写入到同一个文件中。
*   **多级日志**: 支持标准日志级别：`error`, `warn`, `info`, `verbose`, `debug`。
*   **文件存储**:
    *   日志文件存储于用户数据目录 (`%APPDATA%/class-sidebar/logs/`)。
    *   默认文件名为 `main.log`。
*   **日志轮转 (Rotation)**: 当单个日志文件达到 2MB 时，自动重命名为 `main.old.log`。
*   **自动异常捕获**: 自动记录所有未处理的异常和 Promise rejections。
*   **日志格式**: `[时间戳] [级别] [进程名] 内容`。

### 3.2 UI 集成
*   在“设置”页面添加“打开日志目录”按钮。
*   点击按钮通过主进程调用 `shell.openPath()` 打开日志文件夹。

## 4. 技术架构 (Technical Architecture)

*   **核心库**: `electron-log`
*   **开发助理**: **Gemini Code Assist (GCA)**
*   **实现方式**:
    *   主进程创建 `Logger.ts` 模块，使用 GCA 生成初始化配置代码。
    *   渲染进程使用 `electron-log/renderer` 通过 IPC 将日志发送到主进程。
    *   通过 IPC 实现从渲染进程到主进程的通信，以触发“打开日志目录”操作。

---

## 5. 详细开发步骤 (Step-by-Step Development Plan)

本部分将指导您如何使用 Gemini Code Assist (GCA) 高效完成日志系统的开发。

### **步骤 1: 环境准备**

首先，将 `electron-log` 添加到项目依赖中。在终端中运行以下命令：

```bash
npm install electron-log
```

### **步骤 2: 创建主进程日志模块 (GCA)**

1.  在 `src/main/` 目录下创建一个新文件，命名为 `Logger.ts`。
2.  打开 `Logger.ts` 文件，然后打开 GCA 聊天窗口，发送以下 **prompt**：

    > **Prompt for GCA:**
    >
    > "请为 `electron-log` 库编写一个初始化函数 `initializeLogger`。
    >
    > 要求如下：
    > 1.  所有日志（包括主进程和渲染进程）都写入到单个文件。
    > 2.  日志文件路径为用户数据目录下的 `logs/main.log`。
    > 3.  日志格式为 `[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] [{processType}] {text}`。
    > 4.  日志文件最大为 2MB，超过后自动轮转。
    > 5.  在生产环境中，日志级别为 `info`；在开发环境中，级别为 `debug`。同时设置控制台的日志级别。
    > 6.  自动捕获所有未处理的异常和 Promise rejections。
    > 7.  将 `console.log` 等函数重定向到 `electron-log`。
    > 8.  在函数末尾打印一条 "Logger initialized." 的信息日志。
    > 9.  使用 TypeScript 编写，并导出该函数。"

3.  将 GCA 生成的代码粘贴到 `Logger.ts` 文件中并保存。

### **步骤 3: 在主进程中集成日志模块 (GCA)**

1.  打开主进程入口文件 `src/main/background.ts`。
2.  选中 `app.whenReady()` 函数体内的代码，使用快捷键 `Ctrl+I` (或右键选择 "Gemini -> Edit Selected Code") 启动内联编辑。
3.  在内联编辑框中输入以下 **prompt**：

    > **Prompt for GCA:**
    >
    > "在这些代码的最开始，从 `./Logger` 导入 `initializeLogger` 函数，并立即调用它。"

4.  GCA 将会自动在 `app.whenReady()` 的开头添加 `initializeLogger()` 的调用。审查并接受更改。

### **步骤 4: 实现 IPC 通信 (GCA)**

#### 4.1 主进程 Handler

1.  继续在 `src/main/background.ts` 文件中工作。
2.  找到处理 IPC 事件的区域（如果没有，可以在文件末尾添加）。
3.  使用 GCA 聊天窗口，发送以下 **prompt**：

    > **Prompt for GCA:**
    >
    > "为 Electron 创建一个 IPC Handler，监听名为 `logs:open-directory` 的通道。当收到事件时，使用 `shell.openPath` 打开 `electron-log` 当前正在使用的日志文件所在的目录。确保从 `electron-log` 和 `electron` 导入所需模块。"

4.  将生成的 `ipcMain.handle(...)` 代码段粘贴到 `background.ts` 中。

#### 4.2 Preload 脚本

1.  打开 `src/preload/index.ts` 文件。
2.  使用 GCA 聊天窗口，发送以下 **prompt**：

    > **Prompt for GCA:**
    >
    > "在 Electron 的 preload 脚本中，扩展 `contextBridge.exposeInMainWorld` 的 `electronAPI` 对象，添加一个名为 `openLogDirectory` 的异步函数，该函数调用 `ipcRenderer.invoke('logs:open-directory')`。"

3.  将 GCA 生成的代码合并到现有的 `contextBridge` 调用中。

### **步骤 5: 前端 UI 实现 (GCA)**

1.  定位到你想要添加按钮的 Vue 组件，例如 `src/renderer/src/components/QuickActions.vue`。
2.  选中该组件的 `<template>` 部分，启动内联编辑 (`Ctrl+I`)，输入 **prompt**：

    > **Prompt for GCA:**
    >
    > "在这里添加一个新的按钮，文本为‘打开日志目录’。"

3.  接下来，选中 `<script setup>` 部分，启动内联编辑，输入 **prompt**：

    > **Prompt for GCA:**
    >
    > "为‘打开日志目录’按钮创建一个点击事件处理函数。该函数调用 `window.electronAPI.openLogDirectory()`。"

4.  将模板中新生成的按钮与脚本中的处理函数关联起来（例如，使用 `@click`）。

### **步骤 6: 测试与验证**

1.  **启动应用**: 运行 `npm run dev`。
2.  **检查日志文件**:
    *   导航到应用的 `userData` 目录（通常在 `C:\Users\<YourUser>\AppData\Roaming\class-sidebar`）。
    *   确认 `logs/main.log` 文件已被创建。
    *   检查文件内容，应包含 "Logger initialized." 信息，并且格式正确。
3.  **触发日志**:
    *   在主进程和渲染进程代码中临时添加 `console.log('test from main')` 和 `console.log('test from renderer')`。
    *   刷新应用并检查 `main.log` 文件，确认两条新日志都已按正确格式记录。
4.  **测试 UI 按钮**:
    *   前往设置页面，点击“打开日志目录”按钮。
    *   验证系统文件浏览器是否成功打开了 `logs` 文件夹。
5.  **测试异常捕获**:
    *   在任意组件的 `onMounted` 或方法中故意引入一个错误，例如 `throw new Error('Test unhandled exception')`。
    *   重新加载应用，检查 `main.log` 文件中是否记录了该异常的堆栈跟踪信息。

## 6. Gemini Code Assist 使用技巧

*   **生成代码**: 对于新功能或模块，直接在聊天中描述需求，让 GCA 生成完整的代码框架。
*   **内联编辑**: 对于现有代码的修改（如添加函数调用、重构），选中代码后按 `Ctrl+I` 是最高效的方式。
*   **解释代码**: 如果对 GCA 生成的或项目中的现有代码不理解，可以选中后在聊天中提问“解释这段代码”。
*   **迭代优化**: 如果 GCA 第一次生成的结果不完美，不要放弃。继续在聊天中提出修改要求，例如“把这个改成异步函数”或“添加错误处理”。