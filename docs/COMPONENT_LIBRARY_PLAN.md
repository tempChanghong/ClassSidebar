# **组件库与抽屉容器开发技术规格书**

目标用户: Gemini Code Assist (AI 开发者)  
项目: ClassSidebar  
语言: TypeScript / Vue 3  
本文件定义了实现“组件库”、“抽屉容器”及“网格布局优化”的技术细节。请遵循以下规范进行代码生成。

## **1\. 数据结构定义 (Data Structures)**

### **1.1 组件配置扩展 (WidgetConfig)**

需要更新 src/renderer/src/stores/sidebarStore.ts 中的 WidgetConfig 接口，以支持抽屉结构。

export interface WidgetConfig {  
  id: string;  
  type: string; // 新增枚举值: 'drawer'  
  data?: any;   // 现有字段  
    
  // \--- 新增字段 \---  
  // 仅当 type \=== 'drawer' 时有效  
  children?: WidgetConfig\[\];   
  drawerName?: string;   
  drawerIcon?: string; // 可选，抽屉图标  
}

### **1.2 组件库预设接口 (WidgetPreset)**

需要在 src/renderer/src/config/widgetPresets.ts (新建文件) 中定义预设结构。

export interface WidgetPreset {  
  id: string; // 预设的唯一标识，如 'ci-quick-swap'  
  type: 'item' | 'group'; // 单个组件还是组合(抽屉)  
  category: 'ClassIsland' | 'SecRandom' | 'System' | 'General';  
    
  // UI 展示信息  
  displayName: string;  
  description: string; // 必须包含 "需在对应应用中开启URL设置" 等提示  
  iconPath: string;    // 用于组件库展示的图标  
    
  // 生成配置的数据  
  widgetType?: string;  // 对应 WidgetConfig.type (type='item'时必填)  
  defaultConfig?: Record\<string, any\>; // 对应 WidgetConfig.data  
    
  // 若 type \=== 'group'，则包含以下字段  
  children?: WidgetPreset\[\];   
}

## **2\. 预设数据内容 (Preset Data Content)**

在 src/renderer/src/config/widgetPresets.ts 中硬编码以下数据。  
注意: 预设数据应当以“组”为核心组织（如 ClassIsland 组），以便前端分别渲染“整组添加”和“单项添加”的入口。

### **2.1 ClassIsland 分类 (Group)**

* **提示文本**: "请确保已在 ClassIsland 设置中开启 URL 协议支持。"  
* **子项 1**: 快捷换课  
  * widgetType: 'url'  
  * url: classisland://app/class-swap  
* **子项 2**: 档案设置  
  * widgetType: 'url'  
  * url: classisland://app/profile/

### **2.2 SecRandom 分类 (Group)**

* **提示文本**: "请确保已在 SecRandom 设置中开启 URL 协议支持。"  
* **子项 1**: 使用闪抽  
  * widgetType: 'url'  
  * url: secrandom://direct\_extraction  
* **子项 2**: 主界面抽取  
  * widgetType: 'url'  
  * url: secrandom://pumping?action=start

### **2.3 系统工具分类**

* **组件**: 系统工具栏 (单项)  
  * 迁移原有的 SystemToolsWidget 配置。

## **3\. 核心功能模块 (Core Modules)**

### **3.1 抽屉组件 (ToolboxDrawerWidget.vue)**

**路径**: src/renderer/src/components/widgets/ToolboxDrawerWidget.vue

* **设计核心参考**: **SystemToolsWidget.vue**  
  * **重要**: 用户明确指出 SystemToolsWidget 的设计非常好。抽屉组件的 UI 和交互逻辑必须严格参考系统工具组件的实现方式。  
  * **外观**: 在主侧边栏中表现为一个容器入口。  
  * **展开方式**: 参考系统工具的展开/交互模式（例如：网格状排列子项，紧凑且节省空间）。  
* **UI 规范**:  
  * **主态**: 单个图标按钮（类似文件夹或工具箱图标）。  
  * **展开态**:  
    * 使用与系统工具一致的 **Grid/Flex 布局** 来排列内部组件。  
    * 必须支持在设置中自定义内部组件的排序。  
  * **交互**: 点击图标展开/收起，或通过 Popover 悬浮显示（具体取决于 SystemTools 目前的实现方式，保持一致）。  
* **逻辑约束**:  
  * 渲染子组件时，复用 WidgetHost 或直接根据 type 渲染对应组件。  
  * **禁止递归**: 抽屉内的组件渲染逻辑中，不得再次渲染 ToolboxDrawerWidget (代码层面防御)。

### **3.2 组件库管理界面 (WidgetManager.vue 重构)**

**路径**: src/renderer/src/components/settings/WidgetManager.vue

* **布局变更**:  
  * **Tab 1: 当前组件**: 现有的拖拽排序列表。  
  * **Tab 2: 组件库**: 新增界面。  
* **组件库 UI**:  
  * 左侧/顶部：分类标签 (ClassIsland, SecRandom, 系统, 通用)。  
  * 右侧/内容：网格显示预设卡片。  
* 双重添加模式 (关键):  
  对于包含多个子项的预设组（如 ClassIsland 组），UI 必须提供两种添加方式：  
  1. **添加整个抽屉 (Add as Drawer)**:  
     * 创建一个新的 type: 'drawer' 组件。  
     * 将预设组中的所有子项自动填充到该抽屉的 children 中。  
     * 添加到主界面根列表。  
  2. **添加单个组件 (Add Individually)**:  
     * 在组卡片内列出子项（如“快捷换课”、“档案设置”）。  
     * 允许用户点击具体子项旁的添加按钮。  
     * 将该**单个组件**直接添加到主界面根列表（不包裹在抽屉中）。

## **4\. UI 布局优化 (Layout & Styling)**

### **4.1 网格布局重构 (SidebarView.vue)**

**目标**: 实现每行 3 个组件的紧凑网格，且视觉高度与垂直布局组件高度一致。

* **CSS Grid 实现**:  
  * 容器样式:  
    display: grid;  
    grid-template-columns: repeat(3, 1fr); /\* 强制3列 \*/  
    gap: 0.5rem; /\* 调整间距 \*/  
    width: 100%;

* **组件适配 (BaseWidget.vue)**:  
  * **设计语言**: 必须与垂直布局组件（及抽屉组件/系统工具）的设计语言高度统一，流畅且优雅。  
  * **高度约束**: 强制高度为固定值，与垂直模式下的单行高度对齐。  
  * **内容布局**:  
    * 垂直模式 (flex-row): 图标在左，文字在右。  
    * 网格模式 (grid-item): 图标居中，文字处理需优雅（建议仅图标或图标+微型标签）。  
    * 样式需去除多余边距，确保在 3 列布局下不拥挤。

## **5\. 开发步骤 (Implementation Steps)**

1. **Phase 1: 数据层**: 创建 widgetPresets.ts 并更新 Store 类型定义。  
2. **Phase 2: 布局层**: 修改 SidebarView.vue 和基础组件样式，实现完美的 3 列网格布局。  
3. **Phase 3: 抽屉组件**:  
   * 深入分析 SystemToolsWidget 源码。  
   * 基于其设计模式开发 ToolboxDrawerWidget.vue。  
   * 在 WidgetHost 中注册。  
4. **Phase 4: 设置页**: 重构 WidgetManager.vue，实现组件库浏览与添加逻辑，**确保实现“整组”与“单项”双重添加功能**。  
5. **Phase 5: 清理**: 移除旧版系统工具设置入口。