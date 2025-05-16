import React, { useState } from 'react';
import Calendar from 'react-calendar';
// Удаляем импорт CSS для react-calendar, чтобы избежать проблем с PostCSS
// import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { usePainRecords } from '../context/PainRecordContext';
import { PainRecord } from '../types';
import './PainCalendar.css'; // Оставим этот файл для специфических стилей календаря

type CalendarValue = Date | null | [Date | null, Date | null];

const PainCalendar = () => {
  const [date, setDate] = useState<Date>(new Date());
  const { getRecordsForDate, deleteRecord } = usePainRecords();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sortByTime, setSortByTime] = useState<boolean>(true);

  // Функция для определения стиля даты в зависимости от наличия записей о боли
  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return '';

    const dateRecords = getRecordsForDate(date);
    if (!dateRecords.length) return '';

    const classNames = [];
    
    // Проверяем типы боли для этой даты
    if (dateRecords.some(record => record.type === 'headache')) {
      classNames.push('headache-pain');
    }
    
    if (dateRecords.some(record => record.type === 'stomach')) {
      classNames.push('stomach-pain');
    }
    
    return classNames.join(' ');
  };

  const handleDateChange = (value: CalendarValue) => {
    if (value instanceof Date) {
      setDate(value);
    } else if (Array.isArray(value) && value[0] instanceof Date) {
      setDate(value[0]);
    }
  };

  const getDayRecords = () => {
    const records = getRecordsForDate(date);
    
    // Сортируем записи по времени, если включена соответствующая опция
    if (sortByTime) {
      return [...records].sort((a, b) => {
        return a.time.localeCompare(b.time);
      });
    }
    
    return records;
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = (id: string) => {
    deleteRecord(id);
    setDeleteConfirmId(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  // Функция для определения времени суток (утро, день, вечер, ночь)
  const getTimeOfDay = (time: string): string => {
    const hour = parseInt(time.split(':')[0], 10);
    
    if (hour >= 5 && hour < 12) return 'Утро';
    if (hour >= 12 && hour < 18) return 'День';
    if (hour >= 18 && hour < 23) return 'Вечер';
    return 'Ночь';
  };
  
  // Функция для получения иконки времени суток
  const getTimeIcon = (time: string): string => {
    const timeOfDay = getTimeOfDay(time);
    
    switch (timeOfDay) {
      case 'Утро': return '🌅';
      case 'День': return '☀️';
      case 'Вечер': return '🌆';
      case 'Ночь': return '🌙';
      default: return '⏱️';
    }
  };
  
  return (
    <div className="mt-5 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Календарь боли</h2>
      
      <div className="mx-auto mb-6 calendar-container">
        <Calendar 
          onChange={handleDateChange}
          value={date}
          tileClassName={getTileClassName}
          className="border-0 rounded-lg shadow-md"
        />
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-gray-800">
            Записи на {format(date, 'dd.MM.yyyy')}
          </h3>
          
          <div className="flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={sortByTime}
                onChange={() => setSortByTime(!sortByTime)}
                className="form-checkbox h-3.5 w-3.5 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span className="ml-1.5 text-sm text-gray-700">Сортировать по времени</span>
            </label>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-pink-300 mr-1.5"></div>
            <span className="text-sm">Головная боль</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-300 mr-1.5"></div>
            <span className="text-sm">Боль в животе</span>
          </div>
        </div>
        
        {getDayRecords().length === 0 ? (
          <p className="text-gray-500 italic">Нет записей на этот день</p>
        ) : (
          <ul className="space-y-3">
            {getDayRecords().map((record: PainRecord) => (
              <li key={record.id} className="bg-gray-50 rounded-md p-3 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className={`font-medium ${record.type === 'headache' ? 'text-pink-700' : 'text-blue-700'} mr-2`}>
                      {record.type === 'headache' ? 'Головная боль' : 'Боль в животе'}
                    </span>
                    
                    <div className="bg-gray-200 rounded-full px-2 py-0.5 text-xs text-gray-700 flex items-center">
                      <span className="mr-1">{getTimeIcon(record.time)}</span>
                      <span>{record.time}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-700 space-y-1">
                    <div>Причина: <span className="font-medium">{getPainCauseLabel(record.cause)}</span></div>
                    <div>Интенсивность: <span className="font-medium">{record.intensity}/10</span></div>
                    {record.notes && (
                      <div className="text-gray-600 italic">Заметки: {record.notes}</div>
                    )}
                  </div>
                </div>
                
                {deleteConfirmId === record.id ? (
                  <div className="flex flex-col items-end ml-2">
                    <div className="text-xs font-medium text-red-600 mb-1">Удалить?</div>
                    <div className="flex space-x-1">
                      <button 
                        className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
                        onClick={() => confirmDelete(record.id)}
                      >
                        Да
                      </button>
                      <button 
                        className="bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-400"
                        onClick={cancelDelete}
                      >
                        Нет
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="text-gray-400 hover:text-red-500 text-xl font-medium w-8 h-8 flex items-center justify-center"
                    onClick={() => handleDeleteClick(record.id)}
                    title="Удалить запись"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Вспомогательная функция для получения русского названия причины боли
function getPainCauseLabel(cause: string): string {
  switch (cause) {
    case 'menstruation':
      return 'Менструация';
    case 'stress':
      return 'Стресс';
    case 'solarFlare':
      return 'Солнечная вспышка';
    case 'unknown':
    default:
      return 'Неизвестно';
  }
}

export default PainCalendar; 