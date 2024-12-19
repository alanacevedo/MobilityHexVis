import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
    build: {
        target: 'esnext' //browsers can handle the latest ES features
    },
    resolve: {
        alias: {
            '@js': path.resolve(__dirname, 'js') // Adjust this to your actual directory
        }
    }
})