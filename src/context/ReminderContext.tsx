import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export interface ReminderSettings {
  enabled: boolean;
  time: string;
  frequency: 'daily' | 'weekly';
  daysOfWeek: string[];
}

interface ReminderContextType {
  settings: ReminderSettings;
  updateSettings: (newSettings: Partial<ReminderSettings>) => void;
  notificationsPermission: NotificationPermission | null;
  requestNotificationPermission: () => Promise<NotificationPermission | null>;
  sendTestNotification: () => void;
}

// Ключ для хранения настроек в localStorage
const STORAGE_KEY = 'painRecordReminders';

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const ReminderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Инициализируем состояние из localStorage, если данные есть
  const [settings, setSettings] = useState<ReminderSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {
        enabled: false,
        time: '20:00',
        frequency: 'daily',
        daysOfWeek: ['1', '3', '5']
      };
    } catch (error) {
      console.error('Ошибка при загрузке настроек напоминаний:', error);
      return {
        enabled: false,
        time: '20:00',
        frequency: 'daily',
        daysOfWeek: ['1', '3', '5']
      };
    }
  });
  
  const [notificationsPermission, setNotificationsPermission] = useState<NotificationPermission | null>(null);
  
  // Проверяем разрешение на уведомления при инициализации
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsPermission(Notification.permission);
    }
  }, []);
  
  // Сохраняем настройки в localStorage при изменении
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      
      if (settings.enabled && notificationsPermission === 'granted') {
        scheduleReminder();
      }
    } catch (error) {
      console.error('Ошибка при сохранении настроек напоминаний:', error);
    }
  }, [settings, notificationsPermission]);
  
  // Функция для запроса разрешения на уведомления
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return null;
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationsPermission(permission);
      return permission;
    } catch (error) {
      console.error('Ошибка при запросе разрешения на уведомления:', error);
      return null;
    }
  };
  
  // Функция для отправки тестового уведомления
  const sendTestNotification = () => {
    if (notificationsPermission === 'granted') {
      new Notification('Дневник боли', {
        body: 'Это тестовое напоминание. Уведомления работают корректно!',
        icon: '/logo192.png'
      });
    }
  };
  
  // Функция для обновления настроек напоминаний
  const updateSettings = (newSettings: Partial<ReminderSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  // Функция для планирования напоминаний
  const scheduleReminder = () => {
    // В реальном приложении здесь бы использовались Push API и периодическая синхронизация
    // Сейчас мы просто используем простой механизм
    
    // Если сервис-воркер зарегистрирован и доступен, используем его
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Отправляем информацию о напоминаниях в service worker
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_REMINDER',
        payload: settings
      });
      
      console.log('Отправлены настройки напоминаний в service worker:', settings);
    } else {
      console.log('Service worker не инициализирован или не доступен');
    }
    
    // Для демонстрации
    if (process.env.NODE_ENV === 'development') {
      console.log('Напоминания настроены:', settings);
    }
  };
  
  return (
    <ReminderContext.Provider value={{
      settings,
      updateSettings,
      notificationsPermission,
      requestNotificationPermission,
      sendTestNotification
    }}>
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminders = () => {
  const context = useContext(ReminderContext);
  if (context === undefined) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
}; 