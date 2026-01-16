# ClassSidebar

<div align="center">

![Logo](icons/icons.png)

**ClassSidebar** 是一个专为现代化课堂场景设计的智能侧边栏工具，基于 Electron 构建。它旨在提供极致的快捷操作体验，集成了应用启动、系统控制和自定义脚本执行等功能，帮助教师和学生更高效地管理课堂数字环境。

> [!IMPORTANT]
> **温馨提示**：本项目核心代码采用 **氛围编程 (Vibe Coding)** 理念编写，追求代码的灵动与交互的流畅。

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Electron](https://img.shields.io/badge/Electron-29.x-47848F?logo=electron)](https://www.electronjs.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)

</div>

## ✨ 核心特性

*   **🚀 智能启动器 (Smart Launcher)**
    *   支持快速启动本地应用程序 (`.exe`, `.lnk`)。
    *   支持自定义 URI 协议 (如 `classisland://`)，无缝集成第三方教学工具。
    *   支持直接打开网页链接 (URL Widget)。

*   **💻 强大的命令执行 (Command Widget)**
    *   内置终端支持，可直接执行 CMD 或 PowerShell 命令。
    *   支持一键执行复杂的系统维护脚本（如网络测试、服务重启）。

*   **🎛️ 系统级控制**
    *   **音量调节**: 内置平滑的音量滑块，实时控制系统主音量。
    *   **文件浏览**: 快速访问指定目录，支持文件拖拽启动。

*   **🎨 高度可定制**
    *   **可视化管理**: 提供直观的设置界面，支持拖拽排序、添加和编辑组件。
    *   **JSON 配置**: 高级用户可直接编辑配置文件，实现像素级的界面定制。
    *   **现代化 UI**: 采用 Tailwind CSS 设计，支持磨砂玻璃效果和流畅的展开/折叠动画。

## 📦 安装与运行

确保你的系统中已安装 [Node.js](https://nodejs.org/) (LTS 版本) 和 Git。

1.  **克隆仓库**
    ```bash
    git clone https://github.com/tempChanghong/ClassSidebar.git
    cd ClassSidebar
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **启动开发环境**
    ```bash
    npm run dev
    ```

4.  **构建生产版本**
    ```bash
    npm run build:win
    ```

## 🛠️ 配置指南

*   **可视化配置**: 点击侧边栏顶部的设置图标 (⚙️)，进入“组件管理”页面进行直观配置。
*   **高级配置**: 配置文件位于 `%APPDATA%\class-sidebar\config.json`。您也可以在设置页面的“高级配置”选项卡中直接编辑 JSON。

## 🤝 贡献与反馈

本项目处于 **Indev (开发中)** 阶段，欢迎社区贡献代码或反馈问题。

*   **提交 Issue**: 如果您发现 Bug 或有新功能建议，请提交 Issue。
*   **Pull Request**: 欢迎提交高质量的 PR，请遵循项目的代码规范和提交约定。

## 📄 许可证

本项目采用 **GPL-3.0** 许可证开源。详情请参阅 [LICENSE](LICENSE) 文件。
