import { precacheAndRoute } from 'workbox-precaching';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly, CacheFirst, NetworkFirst } from 'workbox-strategies';

precacheAndRoute(self.__WB_MANIFEST || []);

const bgSyncPlugin = new BackgroundSyncPlugin('civicpulse-outbox-queue', {
    maxRetentionTime: 24 * 60, 
    onSync: async ({ queue }) => {
        console.log('[ServiceWorker] Background Sync Triggered! Flushing queue...');
        let entry;
        while ((entry = await queue.shiftRequest())) {
            try {
                await fetch(entry.request.clone());
                console.log('[ServiceWorker] Successfully synced offline request:', entry.request.url);
            } catch (error) {
                console.error('[ServiceWorker] Replay failed for request', entry.request.url, error);
                await queue.unshiftRequest(entry);
                throw error; 
            }
        }
    }
});

registerRoute(
    ({ url, request }) => url.pathname.startsWith('/api/v1/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method),
    new NetworkOnly({
        plugins: [bgSyncPlugin]
    })
);

registerRoute(
    ({ url }) => url.hostname.endsWith('tile.openstreetmap.org'),
    new CacheFirst({
        cacheName: 'map-tiles-cache',
        plugins: [{
            cacheWillUpdate: async ({ response }) => response.status === 200 ? response : null,
        }],
    })
);

registerRoute(
    ({ url, request }) => url.pathname.startsWith('/api/v1/') && request.method === 'GET',
    new NetworkFirst({
        cacheName: 'api-cache',
    })
);

self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'sync-latest-complaints') {
        event.waitUntil(
            fetch(`${self.location.origin}/api/v1/complaint/all`)
                .then(res => {
                    if(res.ok) {
                        return caches.open('api-cache').then(cache => {
                            return cache.put(`${self.location.origin}/api/v1/complaint/all`, res);
                        });
                    }
                })
        );
    }
});

self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url
            }
        };
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});
