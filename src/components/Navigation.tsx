import React from 'react';
import './Navigation.css';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  return (
    <nav className="navigation">
      <ul className="nav-list">
        <li 
          className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => onTabChange('calendar')}
        >
          Календарь
        </li>
        <li 
          className={`nav-item ${activeTab === 'chart' ? 'active' : ''}`}
          onClick={() => onTabChange('chart')}
        >
          График
        </li>
      </ul>
    </nav>
  );
};

export default Navigation; 