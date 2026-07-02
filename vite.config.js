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

// Dev vía https://sheets.local/map-dev/ (proxeado por Apache) en vez de localhost:5173 directo.
// Necesario pa' que servicios externos con whitelist de CORS por origin (ej. geoserver) acepten
// las peticiones del visor en desarrollo. Activar con: VITE_BASE_PATH=/map-dev/ npm run serve
const basePath = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  plugins: [vue()],
  base: basePath,
  server: {
    host: '127.0.0.1',
    origin: basePath !== '/' ? 'https://sheets.local' : undefined,
  },
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
