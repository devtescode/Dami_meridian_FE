import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    // The deploy cache rules treat /assets/* as fingerprinted and immutable,
    // so the bundle output path has to stay `assets` (the Vite default).
    assetsDir: 'assets',
  },
})
