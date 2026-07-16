import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// base './' so bundled asset paths work when Tauri serves from its custom
// protocol. strictPort + clearScreen:false keep `tauri dev` and Vite in sync.
export default defineConfig({
  plugins: [react()],
  base: './',
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  build: { outDir: 'dist', target: 'es2022' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
