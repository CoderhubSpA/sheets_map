import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.js'),
      name: 'CoderhubSpaSheetsMap',
      formats: ['umd', 'es'],
      fileName: (format) => `index.${format}.js`,
      cssFileName: 'index'
    },
    rollupOptions: {
      // Externalizar dependencias pesadas para no incluirlas en el bundle
      external: ['vue', 'leaflet', 'vue2-leaflet'],
      output: {
        globals: {
          vue: 'Vue',
          leaflet: 'L'
        }
      }
    },
    sourcemap: true
  }
})
