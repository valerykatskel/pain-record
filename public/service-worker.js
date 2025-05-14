/* eslint-disable no-restricted-globals */

// Это версия кеша, которая будет изменяться при каждом обновлении приложения
const CACHE_NAME = 'pain-record-v1';

// Список URL-адресов для предварительного кеширования при установке сервис-воркера
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Событие установки сервис-воркера
self.addEventListener('install', (event) => {
  // Выполняем кеширование важных ресурсов
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Событие активации сервис-воркера
self.addEventListener('activate', (event) => {
  // Удаляем старые кеши
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Перехват сетевых запросов
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Возвращаем закешированный ответ, если он найден
        if (response) {
          return response;
        }
        
        // Если нет в кеше, выполняем запрос к сети
        return fetch(event.request).then(
          (response) => {
            // Проверяем, получен ли ответ и является ли он валидным
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Клонируем ответ, так как он может быть использован только один раз
            const responseToCache = response.clone();
            
            // Кешируем ответ для будущих запросов
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }
        );
      })
  );
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Не забудьте записать информацию о болях за сегодня',
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Дневник боли', 
        options
      )
    );
  }
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Получаем URL для перехода
  const urlToOpen = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/';
  
  // Открываем основное окно приложения при клике на уведомление
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((windowClients) => {
      // Проверяем, есть ли открытые окна
      const hasClient = windowClients.some((client) => {
        if (client.url === urlToOpen && 'focus' in client) {
          client.focus();
          return true;
        }
        return false;
      });
      
      // Если нет открытых окон, открываем новое
      if (!hasClient && self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Обработка запланированных уведомлений (используется периодическая синхронизация)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'pain-record-reminder') {
    event.waitUntil(
      // Здесь можно получить настройки напоминаний из IndexedDB/localStorage
      // и отправить уведомление, если нужно
      self.registration.showNotification('Дневник боли', {
        body: 'Не забудьте записать информацию о болях за сегодня',
        icon: '/logo192.png',
        badge: '/logo192.png',
        data: {
          url: '/'
        }
      })
    );
  }
}); 