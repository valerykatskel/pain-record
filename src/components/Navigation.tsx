import React from 'react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  return (
    <nav className="bg-gray-800 sticky top-0 z-10 shadow-md">
      <ul className="flex w-full">
        <li 
          className={`py-3 px-4 text-center flex-1 cursor-pointer transition-colors duration-200 
            ${activeTab === 'calendar' 
              ? 'bg-green-600 text-white font-medium' 
              : 'text-gray-200 hover:bg-gray-700'}`}
          onClick={() => onTabChange('calendar')}
        >
          Календарь
        </li>
        <li 
          className={`py-3 px-4 text-center flex-1 cursor-pointer transition-colors duration-200 
            ${activeTab === 'chart' 
              ? 'bg-green-600 text-white font-medium' 
              : 'text-gray-200 hover:bg-gray-700'}`}
          onClick={() => onTabChange('chart')}
        >
          График
        </li>
        <li 
          className={`py-3 px-4 text-center flex-1 cursor-pointer transition-colors duration-200 
            ${activeTab === 'reminders' 
              ? 'bg-green-600 text-white font-medium' 
              : 'text-gray-200 hover:bg-gray-700'}`}
          onClick={() => onTabChange('reminders')}
        >
          Напоминания
        </li>
      </ul>
    </nav>
  );
};

export default Navigation; 