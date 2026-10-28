import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    manifest: 'build-manifest.json',
    rollupOptions: { output: { manualChunks(id) {
      if (!id.includes('node_modules')) return undefined
      if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion'
      if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react-vendor'
      if (id.includes('dexie')) return 'database-vendor'
      if (id.includes('lucide-react')) return 'icons'
      return undefined
    } } },
  },
  server: { host: '0.0.0.0', allowedHosts: true },
  preview: { host: '0.0.0.0', allowedHosts: true },
  test: { environment: 'jsdom', setupFiles: ['./src/tests/setup.ts'], include: ['src/**/*.test.{ts,tsx}'] },
})
