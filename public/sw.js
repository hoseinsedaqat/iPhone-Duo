const CACHE = 'duo-shell-v2'
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    const response = await fetch('/')
    const html = await response.clone().text()
    await cache.put('/', response)
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map(match => match[1])
    // The Vite manifest includes lazy app chunks, so every built-in app can load offline.
    try {
      const manifestResponse = await fetch('/build-manifest.json')
      const manifest = await manifestResponse.clone().json()
      await cache.put('/build-manifest.json', manifestResponse)
      for (const entry of Object.values(manifest)) {
        if (entry.file) assets.push('/' + entry.file)
        for (const file of [...(entry.css || []), ...(entry.assets || [])]) assets.push('/' + file)
      }
    } catch { /* The shell can still run; uncached chunks need a connection. */ }
    await Promise.allSettled([...new Set([...assets, '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/wallpapers/aurora.png', '/images/coast.png'])].map(asset => cache.add(asset)))
    await self.skipWaiting()
  })())
})
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('duo-shell-') && key !== CACHE) await caches.delete(key)
  await self.clients.claim()
})()))
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); void caches.open(CACHE).then(cache => cache.put('/', copy)); return response }).catch(async () => (await caches.match('/', { ignoreVary: true })) || Response.error()))
  } else {
    event.respondWith(caches.match(event.request, { ignoreVary: true }).then(cached => cached || fetch(event.request).then(response => { if (response.ok) { const copy = response.clone(); void caches.open(CACHE).then(cache => cache.put(event.request, copy)) } return response })))
  }
})
