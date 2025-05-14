import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { usePainRecords } from '../context/PainRecordContext';
import { PainRecord, PainType } from '../types';
import './PainCalendar.css';

type CalendarValue = Date | null | [Date | null, Date | null];

const PainCalendar = () => {
  const [date, setDate] = useState<Date>(new Date());
  const { records, getRecordsForDate } = usePainRecords();

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
    return getRecordsForDate(date);
  };

  return (
    <div className="pain-calendar">
      <h2>Календарь боли</h2>
      <Calendar 
        onChange={handleDateChange}
        value={date}
        tileClassName={getTileClassName}
      />
      
      <div className="pain-records">
        <h3>Записи на {format(date, 'dd.MM.yyyy')}</h3>
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color headache-pain"></div>
            <span>Головная боль</span>
          </div>
          <div className="legend-item">
            <div className="legend-color stomach-pain"></div>
            <span>Боль в животе</span>
          </div>
        </div>
        {getDayRecords().length === 0 ? (
          <p>Нет записей на этот день</p>
        ) : (
          <ul>
            {getDayRecords().map((record: PainRecord) => (
              <li key={record.id} className="pain-record-item">
                <div className="pain-type">{record.type === 'headache' ? 'Головная боль' : 'Боль в животе'}</div>
                <div className="pain-details">
                  <span>Причина: {getPainCauseLabel(record.cause)}</span>
                  <span>Интенсивность: {record.intensity}/10</span>
                  {record.notes && <div className="pain-notes">Заметки: {record.notes}</div>}
                </div>
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