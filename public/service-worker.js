/* eslint-disable no-restricted-globals */

// Это версия кеша, которая будет изменяться при каждом обновлении приложения
const CACHE_NAME = 'pain-record-v2';

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

// Хранилище для запланированных уведомлений
const scheduledNotifications = new Map();

// DB для хранения напоминаний
let db;

// Открываем IndexedDB для хранения настроек напоминаний
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('painRecordDB', 1);
    
    request.onerror = (event) => {
      console.error('Ошибка открытия базы данных', event);
      reject(event);
    };
    
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('reminders')) {
        db.createObjectStore('reminders', { keyPath: 'id' });
      }
    };
  });
}

// Сохраняем настройки напоминаний в IndexedDB
function saveReminderSettings(settings) {
  return new Promise((resolve, reject) => {
    openDatabase().then((db) => {
      const transaction = db.transaction(['reminders'], 'readwrite');
      const store = transaction.objectStore('reminders');
      
      const request = store.put({
        id: 'reminderSettings',
        settings: settings,
        nextScheduledTime: settings.nextScheduledTime || null
      });
      
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e);
    }).catch(reject);
  });
}

// Получаем настройки напоминаний из IndexedDB
function getReminderSettings() {
  return new Promise((resolve, reject) => {
    openDatabase().then((db) => {
      const transaction = db.transaction(['reminders'], 'readonly');
      const store = transaction.objectStore('reminders');
      
      const request = store.get('reminderSettings');
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.settings);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = (e) => reject(e);
    }).catch(reject);
  });
}

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
  
  // Активируем service worker немедленно
  self.skipWaiting();
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
    }).then(() => {
      // Берем контроль над всеми клиентами
      return self.clients.claim();
    }).then(() => {
      // Восстанавливаем запланированные уведомления
      return restoreScheduledNotifications();
    })
  );
});

// Восстановление запланированных уведомлений после перезагрузки
async function restoreScheduledNotifications() {
  try {
    const settings = await getReminderSettings();
    if (settings && settings.enabled) {
      console.log('[SW] Восстанавливаем запланированные уведомления', settings);
      scheduleNotification(settings.nextScheduledTime || Date.now() + 5000, settings);
    }
  } catch (error) {
    console.error('[SW] Ошибка при восстановлении уведомлений', error);
  }
}

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

// Обработка сообщений от основного потока
self.addEventListener('message', (event) => {
  if (!event.data) return;

  console.log('[SW] Received message:', event.data);

  if (event.data.type === 'SCHEDULE_REMINDER') {
    const { time, settings } = event.data.payload;
    
    // Сохраняем настройки в IndexedDB
    settings.nextScheduledTime = time;
    saveReminderSettings(settings).then(() => {
      console.log('[SW] Настройки напоминаний сохранены в IndexedDB');
    });
    
    // Планируем уведомление
    scheduleNotification(time, settings);
    
    // Регистрируем периодическую синхронизацию, если поддерживается
    if ('periodicSync' in self.registration) {
      try {
        self.registration.periodicSync.register('pain-record-reminder-check', {
          minInterval: 60 * 60 * 1000, // Минимальный интервал - 1 час
        }).then(() => {
          console.log('[SW] Периодическая синхронизация зарегистрирована');
        });
      } catch (error) {
        console.error('[SW] Ошибка при регистрации периодической синхронизации', error);
      }
    }
    
    // Регистрируем фоновую синхронизацию для надежности
    if ('sync' in self.registration) {
      self.registration.sync.register('pain-record-reminder-sync').then(() => {
        console.log('[SW] Фоновая синхронизация зарегистрирована');
      });
    }
    
  } else if (event.data.type === 'CANCEL_REMINDERS') {
    // Отменяем все запланированные уведомления
    cancelAllNotifications();
    
    // Сохраняем настройки с disabled = false
    getReminderSettings().then(settings => {
      if (settings) {
        settings.enabled = false;
        saveReminderSettings(settings);
      }
    });
  }
});

// Функция для планирования уведомлений
function scheduleNotification(time, settings) {
  // Отменяем все предыдущие уведомления
  cancelAllNotifications();
  
  const now = Date.now();
  const delay = time - now;
  
  // Если время уже прошло, вычисляем следующее время напоминания
  if (delay <= 0) {
    const nextTime = calculateNextNotificationTime(settings);
    time = nextTime;
  }
  
  console.log(`[SW] Запланировано уведомление через ${Math.floor((time - now)/1000)} секунд (${new Date(time).toLocaleString()})`);
  
  // Создаем таймер для показа уведомления
  const timerId = setTimeout(() => {
    showNotification('Дневник боли', 'Не забудьте записать информацию о болях за сегодня');
    
    // Планируем следующее уведомление, если они включены
    if (settings.enabled) {
      const nextTime = calculateNextNotificationTime(settings);
      
      // Сохраняем время следующего уведомления
      settings.nextScheduledTime = nextTime;
      saveReminderSettings(settings);
      
      // Планируем следующее уведомление
      scheduleNotification(nextTime, settings);
    }
  }, Math.max(1000, time - now)); // Минимальная задержка 1 секунда
  
  // Сохраняем ID таймера
  scheduledNotifications.set('reminder', timerId);
}

// Функция для расчёта времени следующего уведомления
function calculateNextNotificationTime(settings) {
  // Текущая дата и время
  const now = new Date();
  
  // Разбираем время напоминания (HH:MM)
  const [hours, minutes] = settings.time.split(':').map(Number);
  
  // Создаем дату для сегодняшнего дня с указанным временем
  let reminderDate = new Date();
  reminderDate.setHours(hours, minutes, 0, 0);
  
  // Если время сегодня уже прошло, переносим на завтра
  if (reminderDate <= now) {
    reminderDate.setDate(reminderDate.getDate() + 1);
  }
  
  // Если частота "weekly", проверяем подходит ли день недели
  if (settings.frequency === 'weekly') {
    // Получаем день недели (0 = воскресенье, 1 = понедельник, и т.д.)
    const dayOfWeek = reminderDate.getDay().toString();
    
    // Если текущий день не в списке выбранных дней
    if (!settings.daysOfWeek.includes(dayOfWeek)) {
      // Находим следующий подходящий день
      let foundDay = false;
      for (let i = 1; i <= 7; i++) {
        const nextDate = new Date(reminderDate);
        nextDate.setDate(reminderDate.getDate() + i);
        
        const nextDayOfWeek = nextDate.getDay().toString();
        if (settings.daysOfWeek.includes(nextDayOfWeek)) {
          reminderDate = nextDate;
          foundDay = true;
          break;
        }
      }
      
      // Если не найдено подходящих дней (на всякий случай)
      if (!foundDay) {
        reminderDate.setDate(reminderDate.getDate() + 1);
      }
    }
  }
  
  return reminderDate.getTime();
}

// Функция для показа уведомления
function showNotification(title, body) {
  self.registration.showNotification(title, {
    body: body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: {
      url: '/',
      timestamp: Date.now()
    },
    vibrate: [200, 100, 200],
    // Важно: делаем уведомление персистентным, чтобы оно не исчезало автоматически
    requireInteraction: true
  });
  
  // Отправляем сообщение всем клиентам о том, что уведомление показано
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICATION_SHOWN',
        payload: {
          title,
          body,
          timestamp: Date.now()
        }
      });
    });
  });
}

// Функция для отмены всех запланированных уведомлений
function cancelAllNotifications() {
  scheduledNotifications.forEach((timerId) => {
    clearTimeout(timerId);
  });
  scheduledNotifications.clear();
}

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  console.log('[SW] Получено push-уведомление', event);
  
  let title = 'Дневник боли';
  let body = 'Не забудьте записать информацию о болях за сегодня';
  let data = { url: '/' };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      body = payload.body || body;
      data = payload.data || data;
    } catch (e) {
      console.error('[SW] Ошибка при обработке данных push-уведомления', e);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: data,
      vibrate: [200, 100, 200],
      requireInteraction: true
    })
  );
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

// Обработка периодической синхронизации
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'pain-record-reminder-check') {
    event.waitUntil((async () => {
      try {
        console.log('[SW] Проверка напоминаний через периодическую синхронизацию');
        const settings = await getReminderSettings();
        
        if (settings && settings.enabled) {
          const now = Date.now();
          
          // Если запланированное время уже прошло, показываем уведомление и планируем следующее
          if (settings.nextScheduledTime && settings.nextScheduledTime < now) {
            showNotification('Дневник боли', 'Не забудьте записать информацию о болях за сегодня');
            
            // Рассчитываем следующее время
            const nextTime = calculateNextNotificationTime(settings);
            settings.nextScheduledTime = nextTime;
            await saveReminderSettings(settings);
            
            console.log('[SW] Запланировано следующее уведомление на', new Date(nextTime).toLocaleString());
          }
        }
      } catch (error) {
        console.error('[SW] Ошибка при проверке напоминаний', error);
      }
    })());
  }
});

// Обработка фоновой синхронизации
self.addEventListener('sync', (event) => {
  if (event.tag === 'pain-record-reminder-sync') {
    event.waitUntil((async () => {
      try {
        console.log('[SW] Проверка напоминаний через фоновую синхронизацию');
        const settings = await getReminderSettings();
        
        if (settings && settings.enabled) {
          // Проверяем, нужно ли запланировать уведомление
          if (!settings.nextScheduledTime || !scheduledNotifications.has('reminder')) {
            const nextTime = calculateNextNotificationTime(settings);
            settings.nextScheduledTime = nextTime;
            await saveReminderSettings(settings);
            
            scheduleNotification(nextTime, settings);
          }
        }
      } catch (error) {
        console.error('[SW] Ошибка в фоновой синхронизации', error);
      }
    })());
  }
}); 