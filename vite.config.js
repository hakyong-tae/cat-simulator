import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const unityHeaders = {
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

// Plugin to set correct MIME types for Unity WebGL build files
function unityMimePlugin() {
  return {
    name: 'unity-mime',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        if (url.endsWith('.wasm')) {
          res.setHeader('Content-Type', 'application/wasm')
        } else if (url.endsWith('.data')) {
          res.setHeader('Content-Type', 'application/octet-stream')
        } else if (url.endsWith('.framework.js') || url.endsWith('.loader.js')) {
          res.setHeader('Content-Type', 'application/javascript')
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        if (url.endsWith('.wasm')) {
          res.setHeader('Content-Type', 'application/wasm')
        } else if (url.endsWith('.data')) {
          res.setHeader('Content-Type', 'application/octet-stream')
        } else if (url.endsWith('.framework.js') || url.endsWith('.loader.js')) {
          res.setHeader('Content-Type', 'application/javascript')
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), unityMimePlugin()],
  publicDir: 'public',
  server: {
    port: 3009,
    headers: unityHeaders,
  },
  preview: {
    port: 3009,
    headers: unityHeaders,
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 5000,
  },
  assetsInclude: [
    '**/*.wasm', '**/*.arcd0', '**/*.arci0',
    '**/*.dmanifest0', '**/*.projectc0', '**/*.der0',
    '**/*.bin', '**/*.dat', '**/*.pak',
  ],
})
