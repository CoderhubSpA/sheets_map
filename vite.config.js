import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import path from 'path'

/**
 * Plugin que renombra el CSS generado por el build de librería.
 * Vite nombra el CSS con el `name` del package.json, pero el
 * consumidor espera `dist/index.css` según el campo "style" en package.json.
 */
function renameCssPlugin() {
  return {
    name: 'rename-css-to-index',
    generateBundle(_, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (fileName.endsWith('.css') && fileName !== 'index.css') {
          bundle['index.css'] = { ...bundle[fileName], fileName: 'index.css' }
          delete bundle[fileName]
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.js'),
      name: 'index',
      formats: ['umd', 'es'],
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      // Externalizar dependencias pesadas para no incluirlas en el bundle
      external: ['vue', 'leaflet', 'vue2-leaflet'],
      output: {
        globals: {
          vue: 'Vue',
          leaflet: 'L'
        },
        plugins: [renameCssPlugin()]
      }
    },
    sourcemap: true
  }
})
