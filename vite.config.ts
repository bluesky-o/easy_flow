import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
    vue(),
    tailwindcss()
    ],
    build: {
        rollupOptions: {
            input: {
            newtab: new URL('./dashboard.html', import.meta.url).pathname,
            popup: new URL('./popup.html', import.meta.url).pathname
            }
        }
    }
})
