// Service Worker для Novado PWA
const CACHE_NAME = 'novado-v4.5.1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon.svg'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing v4.5.1...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Opened cache v4.5.1');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker v4.5.1 installed successfully');
        return self.skipWaiting(); // Принудительно активируем новую версию
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  // NETWORK FIRST для всех запросов в Android приложении
  const isAndroidApp = event.request.headers.get('user-agent')?.includes('CapacitorWebView') || 
                      event.request.headers.get('user-agent')?.includes('Novado');
  
  if (isAndroidApp || event.request.url.includes('/api/') || event.request.url.includes('supabase.co')) {
    // Network First - всегда пытаемся получить свежие данные
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Клонируем ответ для кеша
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
          return response;
        })
        .catch(() => {
          // Если сеть недоступна, пытаемся взять из кеша
          return caches.match(event.request);
        })
    );
  } else {
    // Для веб-версии используем Cache First
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});

// Проверка обновлений
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('🔍 Checking for updates...');
    
    // Проверяем есть ли новая версия
    fetch('/manifest.json')
      .then(response => response.json())
      .then(manifest => {
        // Логика проверки версий
        console.log('📋 Current manifest:', manifest);
        
        // Уведомляем клиент о доступном обновлении
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'UPDATE_AVAILABLE',
              version: manifest.version || '1.0.0'
            });
          });
        });
      })
      .catch(error => {
        console.error('❌ Update check failed:', error);
      });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Skipping waiting...');
    self.skipWaiting();
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Нове повідомлення в Novado',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Відкрити',
        icon: '/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Закрити'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Novado', options)
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification click received');
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});