// Registration scope is the deployment base: / locally, /<repo>/ on Pages.
const scope = new URL(self.registration.scope)
const shellUrl = scope.href
const scopedUrl = path => new URL(path.replace(/^\/+/, ''), scope).href
const cachePrefix = `duo-shell-${encodeURIComponent(scope.pathname)}-`
const cacheName = `${cachePrefix}v4-__DUO_BUILD_VERSION__`

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName)
    const response = await fetch(shellUrl, { cache: 'no-cache' })
    if (!response.ok) throw new Error('Could not cache the simulator shell')
    const html = await response.clone().text()
    await cache.put(shellUrl, response)

    // Vite's manifest contains every lazy app chunk, including chunks not yet opened.
    const manifestUrl = scopedUrl('build-manifest.json')
    const manifestResponse = await fetch(manifestUrl, { cache: 'no-cache' })
    if (!manifestResponse.ok) throw new Error('Could not cache the build manifest')
    const manifest = await manifestResponse.clone().json()
    await cache.put(manifestUrl, manifestResponse)

    const assets = new Set([
      'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
      'wallpapers/aurora.png', 'images/coast.png',
    ].map(scopedUrl))
    for (const match of html.matchAll(/(?:src|href)=["']([^"'?#]+)["']/g)) {
      const url = new URL(match[1], scope)
      if (url.origin === scope.origin && url.pathname.startsWith(`${scope.pathname}assets/`)) assets.add(url.href)
    }
    for (const entry of Object.values(manifest)) {
      if (entry.file) assets.add(scopedUrl(entry.file))
      for (const file of [...(entry.css || []), ...(entry.assets || [])]) assets.add(scopedUrl(file))
    }
    // Don't activate an incomplete offline cache if any required asset fails.
    await cache.addAll([...assets])
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) {
    const oldScopedCache = key.startsWith(cachePrefix) && key !== cacheName
    const oldRootCache = scope.pathname === '/' && key === 'duo-shell-v2'
    if (oldScopedCache || oldRootCache) await caches.delete(key)
  }
  await self.clients.claim()
})()))

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return
  if (event.request.mode === 'navigate') {
    // Keep the installed shell paired with its pre-cached chunks. A later
    // deployment installs a new cache instead of overwriting this one piecemeal.
    event.respondWith(fetch(event.request).catch(async () => {
      const cache = await caches.open(cacheName)
      return (await cache.match(shellUrl, { ignoreVary: true })) || Response.error()
    }))
  } else {
    event.respondWith((async () => {
      // Never return another deployment scope's cache for a matching URL.
      const cache = await caches.open(cacheName)
      const cached = await cache.match(event.request, { ignoreVary: true })
      if (cached) return cached
      const response = await fetch(event.request)
      if (response.ok) {
        try { await cache.put(event.request, response.clone()) } catch { /* The online response still works if storage is full. */ }
      }
      return response
    })())
  }
})
