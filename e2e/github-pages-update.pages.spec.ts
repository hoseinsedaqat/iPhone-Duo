import { expect, test } from '@playwright/test'
import { execFile } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { extname, join, resolve, sep } from 'node:path'
import { promisify } from 'node:util'

const basePath = '/iPhone-Duo/'
const runFile = promisify(execFile)

// Serve two real builds at one origin, so the browser can exercise an actual
// service-worker update rather than just a first-time offline installation.
test('a new deployment refreshes previously unopened apps in the offline cache', async ({ page, context }) => {
  test.setTimeout(120_000)
  const source = process.cwd()
  const temporary = await mkdtemp(join(tmpdir(), 'duo-pages-update-'))
  const workspace = join(temporary, 'workspace')
  let server: Server | undefined

  try {
    await mkdir(workspace)
    for (const entry of ['src', 'public', 'index.html', 'vite.config.ts', 'package.json', 'postcss.config.js', 'tailwind.config.js']) {
      await cp(join(source, entry), join(workspace, entry), { recursive: true })
    }
    await symlink(join(source, 'node_modules'), join(workspace, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')

    // This changes a lazy chunk without opening it in the first deployment.
    const calculator = join(workspace, 'src/apps/Calculator.tsx')
    const original = await readFile(calculator, 'utf8')
    const updated = original.replace('Keyboard supported', 'Updated calculator offline')
    expect(updated).not.toEqual(original)
    await writeFile(calculator, updated)
    await runFile(process.execPath, [join(source, 'node_modules/vite/bin/vite.js'), 'build'], {
      cwd: workspace,
      env: { ...process.env, DUO_BASE_PATH: basePath },
      timeout: 90_000,
    })

    let deployed = join(source, 'dist')
    const nextDeployment = join(workspace, 'dist')
    const versionOf = async (directory: string) => {
      const worker = await readFile(join(directory, 'sw.js'), 'utf8')
      const version = worker.match(/v4-[0-9a-f]{16}/)?.[0]
      if (!version) throw new Error('Built service worker is missing its build version')
      return version
    }
    const oldVersion = await versionOf(deployed)
    const newVersion = await versionOf(nextDeployment)
    expect(newVersion).not.toEqual(oldVersion)

    const contentTypes: Record<string, string> = {
      '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8', '.json': 'application/json',
      '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
    }
    server = createServer(async (request, response) => {
      try {
        const pathname = new URL(request.url || '/', 'http://localhost').pathname
        if (!pathname.startsWith(basePath)) throw new Error('Outside site scope')
        const root = resolve(deployed)
        const file = resolve(root, decodeURIComponent(pathname.slice(basePath.length)) || 'index.html')
        if (!file.startsWith(root + sep)) throw new Error('Outside deployment directory')
        const body = await readFile(file)
        response.writeHead(200, {
          'Content-Type': contentTypes[extname(file)] || 'application/octet-stream',
          'Cache-Control': 'no-store',
        }).end(body)
      } catch {
        response.writeHead(404).end('Not found')
      }
    })
    await new Promise<void>(done => server!.listen(0, '127.0.0.1', done))
    const address = server.address() as AddressInfo
    await page.goto(`http://127.0.0.1:${address.port}${basePath}`)
    await expect(page.locator('.home-screen')).toBeVisible()
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.waitForFunction(() => !!navigator.serviceWorker.controller)

    // A different application cache must neither satisfy our requests nor be deleted.
    await page.evaluate(async () => {
      const other = await caches.open('unrelated-app-cache')
      await other.put(new URL('foreign-only.txt', location.href), new Response('unrelated cache entry'))
    })
    expect(await page.evaluate(async () => (await fetch('foreign-only.txt')).status)).toBe(404)

    deployed = nextDeployment
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) throw new Error('Missing initial service worker')
      const changed = new Promise<void>(done => navigator.serviceWorker.addEventListener('controllerchange', () => done(), { once: true }))
      await registration.update()
      await changed
    })
    await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated')
    const cacheKeys = await page.evaluate(() => caches.keys())
    const prefix = `duo-shell-${encodeURIComponent(basePath)}-`
    expect(cacheKeys).toContain(`${prefix}${newVersion}`)
    expect(cacheKeys).not.toContain(`${prefix}${oldVersion}`)
    expect(cacheKeys).toContain('unrelated-app-cache')

    await context.setOffline(true)
    await page.reload()
    await expect(page.locator('.home-screen')).toBeVisible()
    await page.getByRole('button', { name: 'Open Calculator' }).click()
    await expect(page.getByText('Updated calculator offline')).toBeVisible()
    await expect(page.getByLabel('Calculator result')).toHaveText('0')
  } finally {
    if (server?.listening) {
      await new Promise<void>((done, fail) => {
        server!.close(error => error ? fail(error) : done())
        server!.closeAllConnections()
      })
    }
    await rm(temporary, { recursive: true, force: true })
  }
})
