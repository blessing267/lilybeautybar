import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',           // default Vite build folder
    assetsDir: 'assets',       // folder inside dist for JS/CSS
  },
  base: '/static/assets',            // ⚠️ important: Django serves static via STATIC_URL + 'assets/'
})
