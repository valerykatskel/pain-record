import React, { useState } from 'react';
import { PainRecordProvider } from './context/PainRecordContext';
import Navigation from './components/Navigation';
import PainCalendar from './components/PainCalendar';
import AddPainForm from './components/AddPainForm';
import PainChart from './components/PainChart';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState<string>('calendar');

  return (
    <div className="App">
      <header className="app-header">
        <h1>Дневник боли</h1>
      </header>
      
      <PainRecordProvider>
        <Navigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        <main className="app-content">
          {activeTab === 'calendar' && (
            <>
              <AddPainForm />
              <PainCalendar />
            </>
          )}
          
          {activeTab === 'chart' && (
            <PainChart />
          )}
        </main>
      </PainRecordProvider>
      
      <footer className="app-footer">
        <p>© 2023 Дневник боли</p>
      </footer>
    </div>
  );
};

export default App;
