const CACHE_NAME = '3m-travel-pwa-v28-employer-collaboration-oversight-static';
const IS_PREVIEW_HOST = /\.manus\.computer$|\.manuspre\.computer$|\.manuscomputer\.ai$/i.test(self.location.hostname);
const ASSETS_TO_CACHE = [
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  if (IS_PREVIEW_HOST) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: '3M Travel & Services', body: 'Mise à jour concernant votre vol' };
  const options = {
    body: data.body,
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: { url: data.url || '/' }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // La prévisualisation utilise Vite ; il ne faut jamais y intercepter ni
  // mettre en cache les scripts du serveur de développement.
  if (IS_PREVIEW_HOST) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  const url = new URL(event.request.url);

  // Ne jamais mettre en cache le client Vite, les sources de développement ou
  // les scripts de prévisualisation : une ancienne version provoquerait une
  // tentative de WebSocket vers localhost:5173 après un redémarrage.
  if (
    url.pathname.startsWith('/@vite/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/__manus__/')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Pour les requêtes API tRPC ou données de vol, tenter le réseau puis stocker/fallback sur le cache local
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Réponse de repli JSON hors ligne pour l'API
            return new Response(JSON.stringify({ offline: true, message: "Mode hors ligne - Données chargées depuis le cache local." }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Les navigations utilisent d’abord le réseau afin d’éviter de servir une
  // page HTML ancienne. La dernière page consultée reste disponible hors ligne.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((cachedResponse) => cachedResponse || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (event.request.url.startsWith('http')) cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});
