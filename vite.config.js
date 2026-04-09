import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: 'public',
  server: {
    port: 3009,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  preview: {
    port: 3009,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
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
