import Store, { Schema } from 'electron-store'
import { v4 as uuidv4 } from 'uuid'

// --- 基础类型定义 ---

export type WidgetType = 'launcher' | 'url' | 'command' | 'volume_slider' | 'files' | 'drag_to_launch';

export interface BaseWidget {
    id: string;
    type: WidgetType;
    name: string; // 显示名称
    icon?: string; // 图标路径或名称
    column?: number; // 预留给栅格布局
}

// --- 具体组件类型 ---

export interface LauncherWidgetConfig extends BaseWidget {
    type: 'launcher';
    target: string; // exe 路径
    args?: string[];
    // 兼容旧的 Grid 布局
    layout?: 'grid' | 'vertical'; 
    targets?: any[];
}

export interface UrlWidgetConfig extends BaseWidget {
    type: 'url';
    url: string;
}

export interface CommandWidgetConfig extends BaseWidget {
    type: 'command';
    command: string;
    shell?: 'cmd' | 'powershell' | 'bash';
}

export interface VolumeWidgetConfig extends BaseWidget {
    type: 'volume_slider';
}

export interface FilesWidgetConfig extends BaseWidget {
    type: 'files';
    folder_path: string;
    max_count?: number;
}

export interface DragToLaunchWidgetConfig extends BaseWidget {
    type: 'drag_to_launch';
    command_template?: string;
}

// --- 联合类型 ---
export type WidgetConfig = 
    | LauncherWidgetConfig 
    | UrlWidgetConfig 
    | CommandWidgetConfig 
    | VolumeWidgetConfig
    | FilesWidgetConfig
    | DragToLaunchWidgetConfig;

export interface AppSchema {
    widgets: WidgetConfig[];
    transforms: {
        display: number;
        height: number;
        posy: number;
        width: number;
        opacity: number;
        animation_speed: number;
    };
}

// --- 丰富的默认配置 ---
const defaultWidgets: WidgetConfig[] = [
    {
        id: 'default-launcher-001',
        type: 'launcher',
        name: '文件资源管理器',
        target: 'explorer.exe',
        icon: 'folder' // 将由前端解析为 Lucide 图标
    },
    {
        id: 'default-url-001',
        type: 'url',
        name: 'Google',
        url: 'https://www.google.com',
        icon: 'globe'
    },
    {
        id: 'default-command-001',
        type: 'command',
        name: '网络测试',
        command: 'ping google.com -t',
        shell: 'cmd',
        icon: 'terminal'
    },
    {
        id: 'default-system-001',
        type: 'volume_slider',
        name: '系统音量',
        icon: 'volume-2'
    }
];


// --- Schema 定义 (用于 electron-store 校验) ---
const schema: Schema<AppSchema> = {
    widgets: {
        type: 'array',
        default: [], // 默认值留空，由迁移逻辑处理
        items: {
            type: 'object',
            required: ['id', 'type'],
            properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                name: { type: 'string' },
                icon: { type: 'string' },
                // 特定字段
                target: { type: 'string' },
                url: { type: 'string' },
                command: { type: 'string' },
                shell: { type: 'string' },
                folder_path: { type: 'string' }
            },
            additionalProperties: true
        }
    },
    transforms: {
        type: 'object',
        default: {
            display: 0,
            height: 64,
            posy: 0,
            width: 400,
            opacity: 0.95,
            animation_speed: 1
        },
        properties: {
            display: { type: 'number' },
            height: { type: 'number' },
            posy: { type: 'number' },
            width: { type: 'number' },
            opacity: { type: 'number' },
            animation_speed: { type: 'number' }
        }
    }
}

const store = new Store<AppSchema>({ 
    schema,
    // 不在这里设置 defaults，因为我们需要覆盖空数组的情况
});

// --- 迁移逻辑 ---
// 在应用启动时检查并填充默认配置
function initializeDefaults() {
    const currentWidgets = store.get('widgets');
    if (!currentWidgets || currentWidgets.length === 0) {
        console.log('No widgets found, initializing with defaults.');
        store.set('widgets', defaultWidgets);
    }

    // 确保所有 widget 都有 ID (兼容旧配置)
    const widgetsWithIds = store.get('widgets').map(w => {
        if (!w.id) {
            return { ...w, id: uuidv4() };
        }
        return w;
    });
    store.set('widgets', widgetsWithIds);
}

initializeDefaults();


export default store;
