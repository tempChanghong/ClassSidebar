import Store from 'electron-store'

interface WidgetConfig {
    type: string
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

const schema: any = {
    widgets: {
        type: 'array',
        default: [],
        items: {
            type: 'object',
            properties: {
                type: { type: 'string' }
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
