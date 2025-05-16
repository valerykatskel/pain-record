import React, { useState, useEffect } from 'react';

interface ReminderSettings {
  enabled: boolean;
  time: string;
  frequency: 'daily' | 'weekly';
  daysOfWeek: string[];
}

interface RemindersProps {
  swRegistration?: ServiceWorkerRegistration | null;
  requestPermission?: () => Promise<void>;
}

// Проверка на iOS устройство
const isIOS = () => {
  const userAgent = navigator.userAgent || '';
  return (
    /iPad|iPhone|iPod/.test(userAgent) && 
    !(window as any).MSStream
  );
};

// Глобальный тип для Firebase
declare global {
  interface Window {
    firebase?: any;
    firebaseMessaging?: any;
  }
}

const Reminders: React.FC<RemindersProps> = ({ swRegistration, requestPermission }) => {
  const STORAGE_KEY = 'painRecordReminders';
  
  const [reminders, setReminders] = useState<ReminderSettings>(() => {
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
  const [nextNotificationTime, setNextNotificationTime] = useState<string>("");
  const [showIOSOption, setShowIOSOption] = useState<boolean>(false);
  const [fcmSupported, setFcmSupported] = useState<boolean>(false);
  const [fcmRegistered, setFcmRegistered] = useState<boolean>(false);
  
  useEffect(() => {
    // Определяем, показывать ли опцию для iOS
    setShowIOSOption(isIOS());
    
    if ('Notification' in window) {
      setNotificationsPermission(Notification.permission);
    }
  }, []);
  
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
      if (reminders.enabled) {
        scheduleNotification();
        calculateNextNotificationTime();
      } else {
        // Если напоминания отключены, удаляем все существующие запланированные
        cancelScheduledNotifications();
        setNextNotificationTime("");
      }
    } catch (error) {
      console.error('Ошибка при сохранении настроек напоминаний:', error);
    }
  }, [reminders]);
  
  useEffect(() => {
    // Проверяем поддержку Firebase Cloud Messaging
    if (window.firebase && window.firebaseMessaging) {
      setFcmSupported(true);
      
      // Проверяем, есть ли уже токен
      window.firebaseMessaging.getToken()
        .then((token: string) => {
          if (token) {
            setFcmRegistered(true);
            console.log('FCM token already exists:', token);
          }
        })
        .catch((err: any) => {
          console.log('FCM token error:', err);
        });
    }
  }, []);
  
  const toggleEnabled = () => {
    setReminders({
      ...reminders,
      enabled: !reminders.enabled
    });
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReminders({
      ...reminders,
      time: e.target.value
    });
  };
  
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReminders({
      ...reminders,
      frequency: e.target.value as 'daily' | 'weekly'
    });
  };
  
  const toggleDayOfWeek = (day: string) => {
    const updatedDays = reminders.daysOfWeek.includes(day)
      ? reminders.daysOfWeek.filter(d => d !== day)
      : [...reminders.daysOfWeek, day];
    
    setReminders({
      ...reminders,
      daysOfWeek: updatedDays
    });
  };
  
  const requestNotificationPermission = async () => {
    if (requestPermission) {
      // Используем функцию из App компонента, если она передана
      await requestPermission();
      if ('Notification' in window) {
        setNotificationsPermission(Notification.permission);
      }
    } else if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsPermission(permission);
      
      if (permission === 'granted') {
        new Notification('Дневник боли', {
          body: 'Уведомления включены! Вы будете получать напоминания о необходимости внести записи о болях.',
          icon: '/logo192.png'
        });
      }
    }
  };
  
  const calculateNextNotificationTime = () => {
    // Получаем текущую дату
    const now = new Date();
    
    // Разбираем время напоминания (HH:MM)
    const [hours, minutes] = reminders.time.split(':').map(Number);
    
    // Создаем дату запланированного напоминания
    let reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);
    
    // Если время сегодня уже прошло, переносим на завтра
    if (reminderDate < now) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }
    
    // Если частота "weekly", проверяем подходит ли день недели
    if (reminders.frequency === 'weekly') {
      // JavaScript использует 0 для воскресенья, а в нашей структуре 0 - это воскресенье
      const dayOfWeek = reminderDate.getDay().toString();
      
      // Если сегодняшний день не в списке выбранных
      if (!reminders.daysOfWeek.includes(dayOfWeek)) {
        // Находим ближайший следующий выбранный день
        let daysToAdd = 1;
        let nextDay = new Date(reminderDate);
        
        while (daysToAdd < 8) {
          nextDay.setDate(nextDay.getDate() + 1);
          const nextDayOfWeek = nextDay.getDay().toString();
          
          if (reminders.daysOfWeek.includes(nextDayOfWeek)) {
            reminderDate = nextDay;
            break;
          }
          
          daysToAdd++;
        }
      }
    }
    
    // Форматируем дату для отображения
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    setNextNotificationTime(reminderDate.toLocaleString('ru-RU', options));
    
    return reminderDate;
  };
  
  const scheduleNotification = () => {
    if (!('Notification' in window) || notificationsPermission !== 'granted') {
      console.log('Уведомления не разрешены или не поддерживаются');
      return;
    }
    
    // Отмена существующих таймеров
    cancelScheduledNotifications();
    
    // Получаем следующую дату уведомления
    const reminderDate = calculateNextNotificationTime();
    const now = new Date();
    
    console.log('Напоминание запланировано на', reminderDate.toLocaleString());
    
    // Вычисляем время до следующего напоминания в миллисекундах
    const timeUntilReminder = reminderDate.getTime() - now.getTime();
    
    // Если используется сервис-воркер, отправляем ему информацию
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_REMINDER',
        payload: {
          time: reminderDate.getTime(),
          settings: reminders
        }
      });
      
      console.log('Отправлено сообщение сервис-воркеру о планировании уведомления');
    } else {
      console.warn('Service Worker контроллер недоступен - используем локальный таймер');
      
      // Если сервис-воркер недоступен, используем таймер в основном потоке
      const timerId = setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification('Дневник боли', {
            body: 'Не забудьте записать информацию о болях за сегодня',
            icon: '/logo192.png',
          });
          
          // Сохраняем в localStorage время последнего уведомления
          localStorage.setItem('lastReminderShown', new Date().toISOString());
          
          // Если режим ежедневный, запланируем следующее уведомление на завтра
          if (reminders.enabled) {
            setTimeout(() => scheduleNotification(), 1000);
          }
        }
      }, timeUntilReminder);
      
      // Сохраняем ID таймера в localStorage для возможности отмены
      localStorage.setItem('reminderTimerId', timerId.toString());
    }
  };
  
  const cancelScheduledNotifications = () => {
    // Отменяем текущий таймер, если он существует
    const timerId = localStorage.getItem('reminderTimerId');
    if (timerId) {
      clearTimeout(parseInt(timerId));
      localStorage.removeItem('reminderTimerId');
    }
    
    // Уведомляем service worker об отмене запланированных уведомлений
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CANCEL_REMINDERS'
      });
    }
  };
  
  const sendTestReminderNotification = () => {
    if (notificationsPermission === 'granted') {
      new Notification('Дневник боли', {
        body: 'Не забудьте записать информацию о болях за сегодня',
        icon: '/logo192.png',
        requireInteraction: true,  // Важно для iOS: уведомление не исчезнет автоматически
        silent: false  // Будет издавать звук
      });
    }
  };
  
  // Функция для создания iCalendar события
  const generateICSFile = () => {
    try {
      // Получаем следующую дату напоминания
      const reminderDate = calculateNextNotificationTime();
      
      // Формат даты для iCalendar
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, '');
      };
      
      // Создаем дату окончания напоминания (через 1 час)
      const endDate = new Date(reminderDate.getTime() + 60 * 60 * 1000);
      
      // Создаем содержимое iCalendar файла
      const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:Напоминание о записи болей
DTSTART:${formatDate(reminderDate)}
DTEND:${formatDate(endDate)}
DESCRIPTION:Не забудьте записать информацию о болях за сегодня в приложении "Дневник боли".
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Напоминание!
END:VALARM
END:VEVENT
END:VCALENDAR`;
      
      // Создаем blob с содержимым файла
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      
      // Создаем ссылку для скачивания
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'pain-record-reminder.ics';
      
      // Запускаем скачивание
      document.body.appendChild(link);
      link.click();
      
      // Удаляем элемент
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }, 100);
    } catch (error) {
      console.error('Ошибка при создании файла календаря:', error);
    }
  };
  
  const dayLabels = [
    { value: '1', label: 'Пн' },
    { value: '2', label: 'Вт' },
    { value: '3', label: 'Ср' },
    { value: '4', label: 'Чт' },
    { value: '5', label: 'Пт' },
    { value: '6', label: 'Сб' },
    { value: '0', label: 'Вс' }
  ];
  
  // Функция для регистрации в FCM
  const registerForFCM = async () => {
    if (!fcmSupported || !window.firebaseMessaging) {
      console.error('Firebase Cloud Messaging не поддерживается или не инициализирован');
      return;
    }
    
    try {
      // Запрашиваем разрешение на уведомления
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
      
      // Получаем токен для устройства
      const token = await window.firebaseMessaging.getToken({
        vapidKey: 'REPLACE_WITH_YOUR_FIREBASE_VAPID_KEY'
      });
      
      if (token) {
        console.log('FCM токен получен:', token);
        setFcmRegistered(true);
        
        // Здесь можно сохранить токен на сервере или в localStorage
        localStorage.setItem('fcmToken', token);
      } else {
        console.log('Не удалось получить FCM токен');
      }
    } catch (error) {
      console.error('Ошибка при регистрации в FCM:', error);
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md my-4">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Настройка напоминаний</h3>
      
      {!('Notification' in window) ? (
        <div className="text-red-600 mb-4">
          Ваш браузер не поддерживает уведомления.
        </div>
      ) : notificationsPermission !== 'granted' ? (
        <div className="mb-4">
          <button 
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors duration-200"
            onClick={requestNotificationPermission}
          >
            {notificationsPermission === 'denied' 
              ? 'Разрешите уведомления в настройках браузера' 
              : 'Разрешить отправку уведомлений'}
          </button>
          {notificationsPermission === 'denied' && (
            <p className="text-sm text-red-500 mt-1">
              Уведомления заблокированы. Пожалуйста, измените настройки в вашем браузере.
            </p>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center mb-4">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={reminders.enabled}
                onChange={toggleEnabled}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-700">Включить напоминания</span>
            </label>
          </div>
          
          {reminders.enabled && (
            <>
              <div className="mb-4">
                <label htmlFor="reminder-time" className="block text-sm font-medium text-gray-700 mb-1">
                  Время напоминания:
                </label>
                <input
                  type="time"
                  id="reminder-time"
                  value={reminders.time}
                  onChange={handleTimeChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="reminder-frequency" className="block text-sm font-medium text-gray-700 mb-1">
                  Частота:
                </label>
                <select
                  id="reminder-frequency"
                  value={reminders.frequency}
                  onChange={handleFrequencyChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="daily">Ежедневно</option>
                  <option value="weekly">По определённым дням</option>
                </select>
              </div>
              
              {reminders.frequency === 'weekly' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дни недели:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {dayLabels.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        className={`h-10 w-10 rounded-full text-sm font-medium ${
                          reminders.daysOfWeek.includes(day.value)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                        onClick={() => toggleDayOfWeek(day.value)}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {nextNotificationTime && (
                <div className="mt-4 mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm">
                  <p className="font-medium text-green-800">Следующее напоминание:</p>
                  <p className="text-green-700">{nextNotificationTime}</p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
                <button
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors duration-200 text-sm"
                  onClick={() => {
                    if (Notification.permission === 'granted') {
                      new Notification('Дневник боли', {
                        body: 'Это тестовое напоминание. Проверка работоспособности уведомлений.',
                        icon: '/logo192.png',
                        requireInteraction: true
                      });
                    }
                  }}
                >
                  Отправить тестовое уведомление
                </button>
                
                <button
                  className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors duration-200 text-sm"
                  onClick={sendTestReminderNotification}
                >
                  Тест уведомления о записи боли
                </button>
              </div>
              
              {swRegistration && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  <p className="font-medium text-gray-700">Статус фоновых уведомлений:</p>
                  <p className="text-green-600">✓ Сервис-воркер активен</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Уведомления будут работать даже при закрытом приложении,
                    если устройство включено и подключено к интернету.
                  </p>
                </div>
              )}

              {showIOSOption && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                  <p className="font-medium text-yellow-800">Дополнительная опция для iOS:</p>
                  <p className="text-yellow-700 mb-2">
                    Для более надежной работы напоминаний на iOS вы можете добавить их 
                    в приложение "Календарь".
                  </p>
                  <button
                    className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition-colors duration-200 text-sm"
                    onClick={generateICSFile}
                  >
                    Создать напоминание для Календаря
                  </button>
                </div>
              )}

              {isIOS() && fcmSupported && !fcmRegistered && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                  <p className="font-medium text-blue-800">Улучшение уведомлений для iOS:</p>
                  <p className="text-blue-700 mb-2">
                    Для более надежной работы уведомлений на iOS вы можете использовать 
                    систему push-уведомлений Firebase.
                  </p>
                  <button
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors duration-200 text-sm"
                    onClick={registerForFCM}
                  >
                    Включить push-уведомления
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reminders; 