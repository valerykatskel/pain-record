/* eslint-disable no-restricted-globals */
// Скрипты Firebase для сервис-воркера
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Инициализация Firebase
firebase.initializeApp({
  // Здесь нужно заполнить данные Firebase проекта
  apiKey: "REPLACE_WITH_YOUR_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID",
  messagingSenderId: "REPLACE_WITH_YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_FIREBASE_APP_ID"
});

// Инициализация Firebase Messaging
const messaging = firebase.messaging();

// Обработка push-уведомлений в фоновом режиме
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Получено фоновое сообщение ', payload);
  
  // Настройка уведомления
  const notificationTitle = payload.notification.title || 'Дневник боли';
  const notificationOptions = {
    body: payload.notification.body || 'Не забудьте записать информацию о болях за сегодня',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: true
  };

  // Показываем уведомление
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Получаем URL для перехода из данных уведомления или используем корневой URL
  const urlToOpen = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/';
  
  // Открываем окно приложения при клике на уведомление
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Проверяем, есть ли открытые окна приложения
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

// Для совместимости с основным сервис-воркером импортируем его
self.importScripts('./service-worker.js'); 