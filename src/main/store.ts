import Store, { Schema } from 'electron-store'

export interface WidgetConfig {
    type: string
    id?: string
    name?: string
    icon?: string
    // Launcher specific
    target?: string
    args?: string[]
    layout?: 'grid' | 'vertical'
    targets?: any[] // For container widgets like 'launcher' (grid)
    // URL specific
    url?: string
    // Command specific
    command?: string
    shell?: string
    // Files specific
    folder_path?: string
    max_count?: number
    // Drag to launch specific
    command_template?: string
    [key: string]: any
}

export interface AppSchema {
    widgets: WidgetConfig[]
    transforms: {
        display: number
        height: number
        posy: number
        width: number
        opacity: number
        animation_speed: number
    }
}

const schema: Schema<AppSchema> = {
    widgets: {
        type: 'array',
        default: [],
        items: {
            type: 'object',
            properties: {
                type: { type: 'string' },
                id: { type: 'string' },
                name: { type: 'string' },
                icon: { type: 'string' },
                target: { type: 'string' },
                url: { type: 'string' },
                command: { type: 'string' },
                shell: { type: 'string' }
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

const store = new Store<AppSchema>({ schema })

export default store
