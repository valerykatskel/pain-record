import React, { useState, useEffect } from 'react';
import { PainRecordProvider } from './context/PainRecordContext';
import Navigation from './components/Navigation';
import PainCalendar from './components/PainCalendar';
import AddPainForm from './components/AddPainForm';
import PainChart from './components/PainChart';
import DataManagement from './components/DataManagement';
import Reminders from './components/Reminders';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { appVersion } from './version';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState<string>('calendar');
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  // Проверяем наличие отложенных уведомлений для iOS
  const checkPendingNotifications = async () => {
    try {
      if (!('indexedDB' in window)) return;
      
      const openRequest = indexedDB.open('painRecordDB', 1);
      
      openRequest.onsuccess = (event) => {
        // @ts-ignore
        const db = event.target.result;
        
        // Проверяем, существует ли хранилище reminders
        if (!db.objectStoreNames.contains('reminders')) return;
        
        const transaction = db.transaction(['reminders'], 'readwrite');
        const store = transaction.objectStore('reminders');
        
        // Получаем все записи, начинающиеся с 'pendingNotification_'
        const request = store.openCursor();
        
        request.onsuccess = (e: Event) => {
          // @ts-ignore
          const cursor = e.target.result;
          if (cursor) {
            const key = cursor.key;
            const value = cursor.value;
            
            // Если это сохраненное уведомление
            if (typeof key === 'string' && key.startsWith('pendingNotification_')) {
              console.log('Найдено отложенное уведомление:', value);
              
              // Показываем уведомление
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(value.title, {
                  body: value.body,
                  icon: '/logo192.png',
                  requireInteraction: true
                });
              }
              
              // Удаляем уведомление из БД
              store.delete(key);
            }
            
            cursor.continue();
          }
        };
      };
      
      openRequest.onupgradeneeded = (event) => {
        // @ts-ignore
        const db = event.target.result;
        if (!db.objectStoreNames.contains('reminders')) {
          db.createObjectStore('reminders', { keyPath: 'id' });
        }
      };
    } catch (error) {
      console.error('Ошибка при проверке отложенных уведомлений:', error);
    }
  };

  // Регистрируем сервис-воркер для PWA функциональности
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Добавляем обработчик для сообщений от Service Worker
      const handleServiceWorkerMessage = (event: MessageEvent) => {
        console.log('Получено сообщение от SW:', event.data);
        if (event.data && event.data.type === 'NOTIFICATION_SHOWN') {
          console.log('Показано уведомление:', event.data.payload);
        }
      };
      
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      // Проверяем наличие контроллера и получаем его регистрацию
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          console.log('Service Worker уже активен');
          setSwRegistration(registration);
          checkScheduledNotifications();
          
          // Проверяем наличие отложенных уведомлений (для iOS)
          checkPendingNotifications();
        });
      }
      
      // Регистрируем Service Worker
      serviceWorkerRegistration.register({
        onSuccess: (registration) => {
          console.log('Сервис-воркер успешно зарегистрирован');
          setSwRegistration(registration);
          
          // Проверяем наличие запланированных уведомлений при загрузке
          checkScheduledNotifications();
          
          // Проверяем наличие отложенных уведомлений (для iOS)
          checkPendingNotifications();
        },
        onUpdate: (registration) => {
          console.log('Доступна новая версия приложения');
          setSwRegistration(registration);
          setUpdateAvailable(true);
        }
      });
      
      // Проверяем уведомления также при активации вкладки/окна
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          checkPendingNotifications();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);
  
  // Обработчик обновления приложения
  const handleUpdate = () => {
    if (swRegistration && swRegistration.waiting) {
      // Отправляем сообщение service worker для пропуска ожидания
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Перезагружаем страницу после получения контрольного сообщения
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  };
  
  // Функция для проверки и восстановления запланированных уведомлений
  const checkScheduledNotifications = () => {
    try {
      // Пытаемся восстановить настройки напоминаний
      const storedReminders = localStorage.getItem('painRecordReminders');
      if (storedReminders) {
        const reminderSettings = JSON.parse(storedReminders);
        
        // Если напоминания включены и есть service worker
        if (reminderSettings.enabled && navigator.serviceWorker.controller) {
          console.log('Восстанавливаем запланированные напоминания');
          
          // Разбираем время (HH:MM)
          const [hours, minutes] = reminderSettings.time.split(':').map(Number);
          
          // Создаем дату для напоминания
          let reminderDate = new Date();
          reminderDate.setHours(hours, minutes, 0, 0);
          
          // Если время сегодня уже прошло, переносим на завтра
          if (reminderDate < new Date()) {
            reminderDate.setDate(reminderDate.getDate() + 1);
          }
          
          // Проверяем, если частота еженедельная, нужно проверить день недели
          if (reminderSettings.frequency === 'weekly') {
            const dayOfWeek = reminderDate.getDay().toString();
            if (!reminderSettings.daysOfWeek.includes(dayOfWeek)) {
              // Ищем следующий подходящий день
              for (let i = 1; i <= 7; i++) {
                const nextDate = new Date(reminderDate);
                nextDate.setDate(reminderDate.getDate() + i);
                const nextDayOfWeek = nextDate.getDay().toString();
                
                if (reminderSettings.daysOfWeek.includes(nextDayOfWeek)) {
                  reminderDate = nextDate;
                  break;
                }
              }
            }
          }
          
          // Отправляем сообщение service worker для планирования напоминания
          navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_REMINDER',
            payload: {
              time: reminderDate.getTime(),
              settings: reminderSettings
            }
          });
        }
      }
    } catch (error) {
      console.error('Ошибка при восстановлении запланированных напоминаний:', error);
    }
  };
  
  // Функция для запроса разрешения на уведомления
  const requestNotificationsPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Проверяем, есть ли разрешение на периодическую синхронизацию
          if ('periodicSync' in navigator.serviceWorker.controller!) {
            try {
              const status = await navigator.permissions.query({
                name: 'periodic-background-sync' as PermissionName
              });
              
              if (status.state === 'granted') {
                console.log('Разрешение на периодическую синхронизацию получено');
              } else {
                console.log('Запрашиваем разрешение на периодическую синхронизацию');
              }
            } catch (e) {
              console.error('Периодическая синхронизация не поддерживается', e);
            }
          }
          
          // Запрашиваем разрешение на push-уведомления
          if ('pushManager' in swRegistration!) {
            try {
              console.log('Запрашиваем разрешение на push-уведомления');
            } catch (e) {
              console.error('Push-уведомления не поддерживаются', e);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при запросе разрешения на уведомления:', error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-green-600 text-white p-4 shadow-md">
        <h1 className="text-center text-xl md:text-2xl font-bold">Дневник боли</h1>
        {updateAvailable && (
          <div className="text-center mt-2">
            <button 
              className="bg-white text-green-700 px-4 py-1 rounded-full text-sm font-medium hover:bg-green-100"
              onClick={handleUpdate}
            >
              Обновить приложение
            </button>
          </div>
        )}
      </header>
      
      <PainRecordProvider>
        <Navigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        <main className="flex-1 p-4 md:p-6 w-full max-w-6xl mx-auto">
          <DataManagement />
          
          {activeTab === 'calendar' && (
            <>
              <AddPainForm />
              <PainCalendar />
            </>
          )}
          
          {activeTab === 'chart' && (
            <PainChart />
          )}
          
          {activeTab === 'reminders' && (
            <Reminders 
              swRegistration={swRegistration}
              requestPermission={requestNotificationsPermission}
            />
          )}
        </main>
      </PainRecordProvider>
      
      <footer className="bg-gray-800 text-white text-center p-4 mt-auto">
        <p>© {new Date().getFullYear()} Дневник боли | Версия: {appVersion}</p>
      </footer>
    </div>
  );
};

export default App;
