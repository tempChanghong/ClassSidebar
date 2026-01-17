import Store, { Schema } from 'electron-store'
import { v4 as uuidv4 } from 'uuid'

// --- Type Definitions ---
export type WidgetType = 'launcher' | 'url' | 'command' | 'volume_slider' | 'files' | 'drag_to_launch' | 'system_tools';

export interface BaseWidget {
    id: string;
    type: WidgetType;
    name: string;
    icon?: string;
    column?: number;
}

export interface LauncherWidgetConfig extends BaseWidget {
    type: 'launcher';
    target?: string;
    args?: string[];
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

export interface SystemToolsWidgetConfig extends BaseWidget {
    type: 'system_tools';
    // 可以添加特定于系统工具箱的配置，例如默认展开状态等
    defaultExpanded?: boolean;
}

export type WidgetConfig = 
    | LauncherWidgetConfig 
    | UrlWidgetConfig 
    | CommandWidgetConfig 
    | VolumeWidgetConfig
    | FilesWidgetConfig
    | DragToLaunchWidgetConfig
    | SystemToolsWidgetConfig;

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

// --- Default Configuration ---
const defaultWidgets: WidgetConfig[] = [
    { id: 'default-launcher-001', type: 'launcher', name: '文件资源管理器', target: 'explorer.exe', icon: 'folder' },
    { id: 'default-url-001', type: 'url', name: 'Google', url: 'https://www.google.com', icon: 'globe' },
    { id: 'default-command-001', type: 'command', name: '网络测试', command: 'ping google.com -t', shell: 'cmd', icon: 'terminal' },
    { id: 'default-system-001', type: 'volume_slider', name: '系统音量', icon: 'volume-2' }
];

const defaultTransforms = {
    display: 0,
    height: 64,
    posy: 0,
    width: 400,
    opacity: 0.95,
    animation_speed: 1
};

// --- Schema Definition ---
const schema: Schema<AppSchema> = {
    widgets: {
        type: 'array',
        // REMOVED default: [], to allow manual control
        items: {
            type: 'object',
            // REMOVED required: ['id'], to allow loading old configs
            properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                name: { type: 'string' },
            },
            additionalProperties: true
        }
    },
    transforms: {
        type: 'object',
        // REMOVED default: {}, to allow manual control
        properties: {
            display: { type: 'number' },
            height: { type: 'number' },
            posy: { type: 'number' },
            width: { type: 'number' },
            opacity: { type: 'number' },
            animation_speed: { type: 'number' }
        }
    }
};

// --- Store Initialization ---
const store = new Store<AppSchema>({ schema });

// --- Initialization Logic (Force Defaults) ---
function initDefaults() {
    const widgets = store.get('widgets');
    const transforms = store.get('transforms');

    // 1. Check and set default widgets
    if (!widgets || !Array.isArray(widgets) || widgets.length === 0) {
        console.log('[Store] Initializing default widgets...');
        store.set('widgets', defaultWidgets);
    } else {
        // Migration: Ensure all widgets have IDs
        let needsUpdate = false;
        const migratedWidgets = widgets.map(w => {
            if (!w.id) {
                needsUpdate = true;
                return { ...w, id: uuidv4() };
            }
            return w;
        });
        if (needsUpdate) {
            console.log('[Store] Migrating widgets: Adding missing IDs...');
            store.set('widgets', migratedWidgets);
        }
    }

    // 2. Check and set default transforms
    if (!transforms || typeof transforms !== 'object') {
        console.log('[Store] Initializing default transforms...');
        store.set('transforms', defaultTransforms);
    }
}

// Execute initialization immediately
initDefaults();

export default store;
