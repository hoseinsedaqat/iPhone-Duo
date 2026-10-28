import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// A project Pages site is served below /<repo>/, while local development
// and custom domains commonly use /. Keep both preview and build configurable.
const requestedBase = process.env.DUO_BASE_PATH?.replace(/^\/+|\/+$/g, '') ?? ''
const base = requestedBase ? `/${requestedBase}/` : '/'

// Public files are normally copied unchanged by Vite. Stamp the worker with a
// fingerprint of the entire finished output so a deploy installs a new offline
// cache even when only a lazy chunk, image, or web manifest has changed.
function versionServiceWorker(): Plugin {
  let outputDir = ''
  return {
    name: 'duo:version-service-worker',
    apply: 'build',
    enforce: 'post',
    configResolved(config) { outputDir = resolve(config.root, config.build.outDir) },
    writeBundle() {
      const hash = createHash('sha256')
      const visit = (directory: string) => {
        const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
        for (const entry of entries) {
          const path = join(directory, entry.name)
          if (entry.isDirectory()) visit(path)
          else if (entry.isFile()) {
            hash.update(relative(outputDir, path).split(sep).join('/')).update('\0')
            hash.update(readFileSync(path)).update('\0')
          }
        }
      }
      visit(outputDir)
      const workerPath = join(outputDir, 'sw.js')
      const worker = readFileSync(workerPath, 'utf8')
      const marker = '__DUO_BUILD_VERSION__'
      if (!worker.includes(marker)) throw new Error('Service worker build version marker is missing')
      writeFileSync(workerPath, worker.replaceAll(marker, hash.digest('hex').slice(0, 16)))
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), versionServiceWorker()],
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
