import { defineConfig } from 'vite'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    viteCompression({
      filter: /\.(js|css|html|svg|json|wasm)$/i,
    }),
  ],
  base: './',
  build: {
    emptyOutDir: false,
  },
})