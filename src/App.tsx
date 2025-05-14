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

  // Регистрируем сервис-воркер для PWA функциональности
  useEffect(() => {
    serviceWorkerRegistration.register({
      onSuccess: () => console.log('Сервис-воркер успешно зарегистрирован'),
      onUpdate: (registration) => {
        // Показываем уведомление о том, что доступно обновление
        const updateAvailable = window.confirm('Доступна новая версия приложения. Обновить сейчас?');
        if (updateAvailable && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      }
    });
  }, []);

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
