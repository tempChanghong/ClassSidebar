/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/renderer/index.html",
        "./src/renderer/src/**/*.{vue,js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                // 这里定义一些 EA2 风格的变量，防止类名失效
                'bg-primary': 'var(--color-bg-primary, #ffffff)',
                'bg-secondary': 'var(--color-bg-secondary, #f3f4f6)',
                'border-subtle': 'var(--color-border, #e5e7eb)',
            }
        },
    },
    plugins: [],
}