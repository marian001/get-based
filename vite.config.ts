import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

export default defineConfig({
  plugins: [svelte()],
  root: '.',
  build: {
    outDir: 'dist-v2',
    rollupOptions: {
      input: resolve(__dirname, 'v2.html'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: '/v2.html',
  },
})
