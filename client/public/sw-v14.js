const CACHE_NAME = '3m-travel-pwa-v14-footer-shortcut-motion';
const IS_PREVIEW_HOST = /\.manus\.computer$|\.manuspre\.computer$|\.manuscomputer\.ai$/i.test(self.location.hostname);
const ASSETS_TO_CACHE = ['/manifest.json'];

self.addEventListener('install', (event) => {
  if (IS_PREVIEW_HOST) { self.skipWaiting(); return; }
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('message', (event) => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: '3M Travel & Services', body: 'Mise à jour concernant votre vol' };
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: '/favicon.png', badge: '/favicon.png', data: { url: data.url || '/' } }));
});
self.addEventListener('notificationclick', (event) => { event.notification.close(); event.waitUntil(clients.openWindow(event.notification.data.url)); });
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (IS_PREVIEW_HOST) { event.respondWith(fetch(event.request)); return; }
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/@vite/') || url.pathname.startsWith('/src/') || url.pathname.startsWith('/__manus__/')) { event.respondWith(fetch(event.request)); return; }
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request).then((response) => { if (response?.status === 200) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone())); return response; }).catch(() => caches.match(event.request).then((cached) => cached || new Response(JSON.stringify({ offline: true, message: 'Mode hors ligne - Données chargées depuis le cache local.' }), { headers: { 'Content-Type': 'application/json' } }))));
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => { caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone())); return response; }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/'))));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => caches.open(CACHE_NAME).then((cache) => { if (event.request.url.startsWith('http')) cache.put(event.request, response.clone()); return response; }))));
});
