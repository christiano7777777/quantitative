import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// base './' so the build works from a GitHub Pages sub-path (HashRouter, no server rewrites)
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { include: ['src/**/*.test.{ts,tsx}'] },
})
