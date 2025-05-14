import React, { useState, useEffect } from 'react';
import { PainRecordProvider } from './context/PainRecordContext';
import Navigation from './components/Navigation';
import PainCalendar from './components/PainCalendar';
import AddPainForm from './components/AddPainForm';
import PainChart from './components/PainChart';
import DataManagement from './components/DataManagement';
import Reminders from './components/Reminders';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState<string>('calendar');
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Регистрируем сервис-воркер для PWA функциональности
  useEffect(() => {
    serviceWorkerRegistration.register({
      onSuccess: (registration) => {
        console.log('Сервис-воркер успешно зарегистрирован');
        setSwRegistration(registration);
        
        // Проверяем наличие запланированных уведомлений при загрузке
        checkScheduledNotifications();
      },
      onUpdate: (registration) => {
        // Сохраняем новую регистрацию
        setSwRegistration(registration);
        
        // Показываем уведомление о том, что доступно обновление
        const updateAvailable = window.confirm('Доступна новая версия приложения. Обновить сейчас?');
        if (updateAvailable && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      }
    });
    
    // Добавляем обработчик для получения сообщений от service worker
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);
  
  // Функция для обработки сообщений от service worker
  const handleServiceWorkerMessage = (event: MessageEvent) => {
    if (!event.data) return;
    
    console.log('Получено сообщение от service worker:', event.data);
    
    if (event.data.type === 'NOTIFICATION_SHOWN') {
      console.log('Показано уведомление:', event.data.payload);
      // Здесь можно добавить дополнительную логику для обработки показанных уведомлений
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-green-600 text-white p-4 shadow-md">
        <h1 className="text-center text-xl md:text-2xl font-bold">Дневник боли</h1>
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
            <Reminders />
          )}
        </main>
      </PainRecordProvider>
      
      <footer className="bg-gray-800 text-white text-center p-4 mt-auto">
        <p>© {new Date().getFullYear()} Дневник боли</p>
      </footer>
    </div>
  );
};

export default App;
