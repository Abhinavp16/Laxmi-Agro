/* Laxmi Agro Admin shared service worker: PWA shell + FCM push.
 * GENERATED at build time by scripts/generate-sw.js - do not edit directly.
 * Firebase web config is public by design (restricted via Firebase console).
 */
const SW_VERSION = '__SW_VERSION__';
const CACHE_NAME = `laxmi-admin-${SW_VERSION}`;
const OFFLINE_URL = '/offline';
const PRECACHE_URLS = [OFFLINE_URL, '/manifest.webmanifest', '/icon-192.png', '/apple-touch-icon.png'];

const FCM_ENABLED = '__FCM_ENABLED__' === '1';
const FIREBASE_CONFIG = __FIREBASE_CONFIG_JSON__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API traffic or auth payloads - always go to network.
  if (url.pathname.startsWith('/api/')) return;

  // App shell assets: cache first, refresh in background.
  if (url.pathname.startsWith('/_next/static/') || /\.(png|svg|ico|woff2?|ttf)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }).catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // Navigations: network first, branded offline page when unreachable.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL)),
    );
  }
});

// ---- Firebase Cloud Messaging (background push when panel is closed) ----
if (FCM_ENABLED) {
  try {
    importScripts(
      'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js',
    );
    firebase.initializeApp(FIREBASE_CONFIG);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'Laxmi Admin';
      const options = {
        body: payload.notification?.body || payload.data?.body || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: {
          link: payload.data?.link || '/',
          notificationId: payload.data?.notificationId || '',
        },
      };
      self.registration.showNotification(title, options);
    });

    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      const link = (event.notification.data && event.notification.data.link) || '/';
      const target = new URL(link, self.location.origin).href;
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
          for (const client of windowClients) {
            if (client.url === target && 'focus' in client) return client.focus();
          }
          if (clients.openWindow) return clients.openWindow(target);
          return undefined;
        }),
      );
    });
  } catch (err) {
    console.error('[SW] FCM init failed:', err);
  }
}
