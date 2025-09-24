const CACHE_NAME = 'eduplatform-v1';
const STATIC_CACHE = 'eduplatform-static-v1';
const DYNAMIC_CACHE = 'eduplatform-dynamic-v1';

// Files to cache for offline use
const STATIC_FILES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/lessons/,
  /\/api\/auth\/me/,
  /\/api\/translate/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          return fetch(request)
            .then((response) => {
              // Cache successful API responses
              if (response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Serve from cache when offline
              return cache.match(request)
                .then((cachedResponse) => {
                  if (cachedResponse) {
                    return cachedResponse;
                  }
                  
                  // Return offline fallback for API requests
                  if (url.pathname.startsWith('/api/lessons')) {
                    return new Response(
                      JSON.stringify({ 
                        message: 'Offline mode - cached lessons available',
                        lessons: [] 
                      }),
                      { 
                        headers: { 'Content-Type': 'application/json' },
                        status: 200
                      }
                    );
                  }
                  
                  return new Response(
                    JSON.stringify({ 
                      message: 'Offline - please check your connection' 
                    }),
                    { 
                      headers: { 'Content-Type': 'application/json' },
                      status: 503
                    }
                  );
                });
            });
        })
    );
    return;
  }

  // Handle static files
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(request)
          .then((fetchResponse) => {
            // Cache successful responses
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return fetchResponse;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Background sync for offline progress
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'progress-sync') {
    event.waitUntil(syncProgressData());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New lesson available!',
    icon: '/logo192.png',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Lessons',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('EduPlatform', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/student/lessons')
    );
  }
});

// Helper function to sync progress data
async function syncProgressData() {
  try {
    // Get offline progress from IndexedDB
    const offlineProgress = await getOfflineProgress();
    
    if (offlineProgress.length > 0) {
      // Sync with server
      const response = await fetch('/api/lessons/sync-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ progress: offlineProgress })
      });

      if (response.ok) {
        // Clear offline progress after successful sync
        await clearOfflineProgress();
        console.log('Progress synced successfully');
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// IndexedDB helpers (simplified - would need proper IndexedDB implementation)
async function getOfflineProgress() {
  // This would interact with IndexedDB to get offline progress
  return [];
}

async function clearOfflineProgress() {
  // This would clear offline progress from IndexedDB
  console.log('Clearing offline progress');
}
