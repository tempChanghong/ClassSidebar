import { WidgetConfig } from '../../../main/store'

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
  defaultConfig?: Record<string, any>; // 对应 WidgetConfig.data

  // 若 type === 'group'，则包含以下字段
  children?: WidgetPreset[];
}

export const widgetPresets: WidgetPreset[] = [
  // 2.1 ClassIsland 分类 (Group)
  {
    id: 'classisland-group',
    type: 'group',
    category: 'ClassIsland',
    displayName: 'ClassIsland 工具组',
    description: '请确保已在 ClassIsland 设置中开启 URL 协议支持。',
    iconPath: 'classisland-icon', // 占位符
    children: [
      {
        id: 'ci-quick-swap',
        type: 'item',
        category: 'ClassIsland',
        displayName: '快捷换课',
        description: '快速切换当前课程',
        iconPath: 'refresh-cw',
        widgetType: 'url',
        defaultConfig: {
          url: 'classisland://app/class-swap',
          name: '快捷换课',
          icon: 'refresh-cw'
        }
      },
      {
        id: 'ci-profile',
        type: 'item',
        category: 'ClassIsland',
        displayName: '档案设置',
        description: '管理 ClassIsland 档案',
        iconPath: 'user',
        widgetType: 'url',
        defaultConfig: {
          url: 'classisland://app/profile/',
          name: '档案设置',
          icon: 'user'
        }
      }
    ]
  },

  // 2.2 SecRandom 分类 (Group)
  {
    id: 'secrandom-group',
    type: 'group',
    category: 'SecRandom',
    displayName: 'SecRandom 工具组',
    description: '请确保已在 SecRandom 设置中开启 URL 协议支持。',
    iconPath: 'secrandom-icon',
    children: [
      {
        id: 'sr-quick-draw',
        type: 'item',
        category: 'SecRandom',
        displayName: '使用闪抽',
        description: '直接进行一次随机抽取',
        iconPath: 'zap',
        widgetType: 'url',
        defaultConfig: {
          url: 'secrandom://direct_extraction',
          name: '使用闪抽',
          icon: 'zap'
        }
      },
      {
        id: 'sr-main-draw',
        type: 'item',
        category: 'SecRandom',
        displayName: '主界面抽取',
        description: '打开主界面并开始抽取',
        iconPath: 'play-circle',
        widgetType: 'url',
        defaultConfig: {
          url: 'secrandom://pumping?action=start',
          name: '主界面抽取',
          icon: 'play-circle'
        }
      }
    ]
  },

  // 2.3 系统工具分类
  {
    id: 'system-tools-item',
    type: 'item',
    category: 'System',
    displayName: '系统工具栏',
    description: '包含音量、亮度等系统控制功能的工具栏',
    iconPath: 'tool',
    widgetType: 'system_tools',
    defaultConfig: {
      name: '系统工具',
      icon: 'tool'
    }
  }
];
