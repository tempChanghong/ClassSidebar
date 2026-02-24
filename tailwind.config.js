/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/renderer/index.html",
        "./src/renderer/src/**/*.{vue,js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            // ─────────────────────────────────────────────────────────
            // 颜色系统
            // 来源：cankao/css/variables.css + base.css 设计令牌统一
            // ─────────────────────────────────────────────────────────
            colors: {
                // 设计系统基础色（对应 CSS 变量）
                'bg-primary':   'var(--bg-primary, #ffffff)',
                'bg-secondary': 'var(--bg-secondary, #f8fafc)',
                'bg-tertiary':  'var(--bg-tertiary, #f1f5f9)',
                'border-subtle':'var(--border-subtle, #e2e8f0)',

                // 毛玻璃效果基础半透明色（来自 variables.css）
                // 对应 --bg-transparent: rgba(255, 255, 255, 0.15)
                'glass': {
                    DEFAULT: 'rgba(255, 255, 255, 0.15)', // --bg-transparent
                    hover:   'rgba(255, 255, 255, 0.25)', // --bg-transparent-hover
                    dark:    'rgba(0, 0, 0, 0.10)',       // --bg-transparent-dark
                    medium:  'rgba(255, 255, 255, 0.70)', // 展开态侧边栏背景
                    heavy:   'rgba(255, 255, 255, 0.95)', // 截图遮罩等强毛玻璃
                },

                // 品牌色（来自 variables.css --primary-color）
                'brand': {
                    DEFAULT: '#3b82f6', // --primary-color / --border-focus
                    hover:   '#2563eb', // Blue-600
                },

                // 语义文字色（来自 variables.css）
                'txt': {
                    main:    '#1f2937', // --text-main  / Gray-800
                    muted:   '#4b5563', // --text-muted / Gray-600
                    subtle:  '#9ca3af', // Gray-400
                },

                // 功能色
                'functional': {
                    success: '#10b981', // Emerald-500
                    danger:  '#ef4444', // Red-500 / --danger
                },
            },

            // ─────────────────────────────────────────────────────────
            // 阴影系统
            // 来源：sidebar.css / screenshot 中的 box-shadow 值
            // ─────────────────────────────────────────────────────────
            boxShadow: {
                // 侧边栏默认阴影 (sidebar.css: box-shadow: 0 2px 10px rgba(0,0,0,0.1))
                'soft':      '0 2px 10px rgba(0, 0, 0, 0.10)',
                // 卡片-图片阴影 (screenshot-preview-img)
                'card':      '0 4px 12px rgba(0, 0, 0, 0.15)',
                // 激活标签页阴影 (display-tab-btn.active)
                'tab':       '0 1px 3px rgba(0, 0, 0, 0.10)',
                // 裁剪选区阴影
                'crop':      '0 0 0 1px rgba(0, 0, 0, 0.20), inset 0 0 10px rgba(0, 0, 0, 0.10)',
                // 毛玻璃组件通用阴影（可替代 --widget-shadow: none 的增强版）
                'widget':    '0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.20)',
            },

            // ─────────────────────────────────────────────────────────
            // 模糊滤镜
            // ─────────────────────────────────────────────────────────
            backdropBlur: {
                // 组件/侧边栏标准毛玻璃 (launcher-group, toolbar-buttons)
                'widget': '10px',
                // 遮罩层毛玻璃
                'overlay': '8px',
                // 侧边栏收起态加强毛玻璃
                'sidebar': '20px',
            },

            // ─────────────────────────────────────────────────────────
            // 圆角
            // --widget-border-radius: 12px
            // ─────────────────────────────────────────────────────────
            borderRadius: {
                'widget': '12px', // 小组件的标准圆角 --widget-border-radius
            },

            // ─────────────────────────────────────────────────────────
            // 缓动曲线（Easing）
            // 来源：sidebar.css transition 中的 cubic-bezier
            // ─────────────────────────────────────────────────────────
            transitionTimingFunction: {
                // 弹簧展开：快速弹入，轻松收尾（侧边栏展开动画）
                'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
                // 标准 Material Design 缓动
                'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },

            // ─────────────────────────────────────────────────────────
            // 过渡时长
            // 来源：variables.css --sidebar-duration / --content-duration
            // ─────────────────────────────────────────────────────────
            transitionDuration: {
                'sidebar': '500ms', // --sidebar-duration: 0.5s
                'content': '300ms', // --content-duration: 0.3s
            },

            // ─────────────────────────────────────────────────────────
            // 关键帧（Keyframes）
            // 来源：animations.css + sidebar.css
            // ─────────────────────────────────────────────────────────
            keyframes: {
                // Toast 消息：先淡入、保持、后淡出（animations.css: fadeInOut）
                // 用法：animate-toast
                'toast': {
                    '0%':   { opacity: '0', transform: 'translate(-50%, -20px)' },
                    '15%':  { opacity: '1', transform: 'translate(-50%, 0)' },
                    '85%':  { opacity: '1', transform: 'translate(-50%, 0)' },
                    '100%': { opacity: '0', transform: 'translate(-50%, -20px)' },
                },

                // 遮罩层渐显（sidebar.css: fadeInOverlay）
                // 用法：animate-fade-in-overlay
                'fade-in-overlay': {
                    'from': { opacity: '0', backdropFilter: 'blur(0px)' },
                    'to':   { opacity: '1', backdropFilter: 'blur(8px)' },
                },

                // 组件列表滑入（widgets/common.css: widget-list 展开动画）
                // 用法：animate-slide-up
                'slide-up': {
                    'from': { opacity: '0', transform: 'translateY(10px)' },
                    'to':   { opacity: '1', transform: 'translateY(0)' },
                },

                // 通用淡入
                // 用法：animate-fade-in
                'fade-in': {
                    'from': { opacity: '0' },
                    'to':   { opacity: '1' },
                },

                // 弹缩出现（组件图标 hover 放大反弹）
                // 用法：animate-pop-in
                'pop-in': {
                    '0%':   { opacity: '0', transform: 'scale(0.85)' },
                    '70%':  { opacity: '1', transform: 'scale(1.05)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },

                // 按压下沉脉冲（toolbar-button / overlay-btn-small :active 的 scale 0.95~0.98）
                // 用法：animate-press
                'press': {
                    '0%':   { transform: 'scale(1)' },
                    '50%':  { transform: 'scale(0.96)' },
                    '100%': { transform: 'scale(1)' },
                },

                // 侧边栏展开（宽度/透明度弹入，对应 sidebar expand）
                // 用法：animate-sidebar-expand
                'sidebar-expand': {
                    'from': { opacity: '0', transform: 'scaleX(0.95)' },
                    'to':   { opacity: '1', transform: 'scaleX(1)' },
                },

                // 图标点击弹跳（overlay-btn-small:hover i 的 scale 1.1）
                // 用法：animate-bounce-icon
                'bounce-icon': {
                    '0%':   { transform: 'scale(1)' },
                    '40%':  { transform: 'scale(1.15)' },
                    '70%':  { transform: 'scale(0.95)' },
                    '100%': { transform: 'scale(1)' },
                },
            },

            // ─────────────────────────────────────────────────────────
            // 动画快捷类（Animation Utilities）
            // ─────────────────────────────────────────────────────────
            animation: {
                // Toast 提示：3s 完整生命周期，不循环
                'toast':             'toast 3s ease forwards',
                // 遮罩渐显：0.3s 快速（与 sidebar.css fadeInOverlay 0.3s 一致）
                'fade-in-overlay':   'fade-in-overlay 0.3s ease forwards',
                // 组件列表滑入：0.2s（与 common.css 0.2s 一致）
                'slide-up':          'slide-up 0.2s ease forwards',
                // 通用淡入
                'fade-in':           'fade-in 0.2s ease forwards',
                // 弹出出现（图标等）
                'pop-in':            'pop-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                // 按压反馈（单次触发）
                'press':             'press 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                // 侧边栏展开（0.5s 弹簧，与 --sidebar-duration 一致）
                'sidebar-expand':    'sidebar-expand 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                // 图标弹跳（Hover 交互增强）
                'bounce-icon':       'bounce-icon 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                // 缓慢脉冲（状态指示灯等）
                'pulse-slow':        'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [],
}