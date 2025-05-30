import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { PainRecord, PainType, PainCause, HourlyChartData } from '../types';
import { format, parseISO, setHours, setMinutes, isValid } from 'date-fns';

// Ключ для хранения записей в localStorage
const STORAGE_KEY = 'painRecords';

interface PainRecordContextType {
  records: PainRecord[];
  addRecord: (record: Omit<PainRecord, 'id'>) => void;
  deleteRecord: (id: string) => void;
  clearAllRecords: () => void;
  getRecordsForDate: (date: Date) => PainRecord[];
  getChartData: (startDate: Date, endDate: Date, filters: {
    types: PainType[];
    causes: PainCause[];
  }) => Array<{
    date: string;
    [key: string]: any;
  }>;
  getHourlyChartData: (date: Date, filters: {
    types: PainType[];
    causes: PainCause[];
  }) => HourlyChartData[];
}

const PainRecordContext = createContext<PainRecordContextType | undefined>(undefined);

export const PainRecordProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Инициализируем состояние из localStorage, если данные есть
  const [records, setRecords] = useState<PainRecord[]>(() => {
    try {
      const storedRecords = localStorage.getItem(STORAGE_KEY);
      if (storedRecords) {
        const parsedRecords = JSON.parse(storedRecords);
        // Преобразуем строки дат обратно в объекты Date
        return parsedRecords.map((record: any) => ({
          ...record,
          date: new Date(record.date),
          // Добавляем поле time для совместимости со старыми записями
          time: record.time || '12:00' // Устанавливаем полдень как значение по умолчанию для старых записей
        }));
      }
      return [];
    } catch (error) {
      console.error('Ошибка при загрузке данных из localStorage:', error);
      return [];
    }
  });

  // Сохраняем данные в localStorage при изменении records
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      console.error('Ошибка при сохранении данных в localStorage:', error);
    }
  }, [records]);

  const addRecord = (newRecord: Omit<PainRecord, 'id'>) => {
    const record: PainRecord = {
      ...newRecord,
      id: Date.now().toString(),
    };
    setRecords([...records, record]);
  };

  const deleteRecord = (id: string) => {
    setRecords(records.filter(record => record.id !== id));
  };

  const clearAllRecords = () => {
    setRecords([]);
  };

  const getRecordsForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return records.filter(record => {
      const recordDate = format(new Date(record.date), 'yyyy-MM-dd');
      return recordDate === dateString;
    });
  };

  const getChartData = (startDate: Date, endDate: Date, filters: {
    types: PainType[];
    causes: PainCause[];
  }) => {
    // Создаем мапу дата -> записи
    const dateMap = new Map<string, PainRecord[]>();
    
    // Фильтруем записи по дате и фильтрам
    records
      .filter(record => {
        const recordDate = new Date(record.date);
        return (
          recordDate >= startDate && 
          recordDate <= endDate && 
          filters.types.includes(record.type) &&
          (filters.causes.length === 0 || filters.causes.includes(record.cause))
        );
      })
      .forEach(record => {
        const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, []);
        }
        dateMap.get(dateKey)?.push(record);
      });
    
    // Преобразуем в формат для графика
    return Array.from(dateMap.entries()).map(([date, dateRecords]) => {
      const chartDataPoint: { date: string, [key: string]: any } = { date };
      
      // Группируем по типу боли
      filters.types.forEach(type => {
        const typeRecords = dateRecords.filter(r => r.type === type);
        if (typeRecords.length > 0) {
          // Используем максимальную интенсивность для данного типа в этот день
          chartDataPoint[type] = Math.max(...typeRecords.map(r => r.intensity));
        }
      });
      
      // Добавляем информацию о причинах
      filters.causes.forEach(cause => {
        const causeRecords = dateRecords.filter(r => r.cause === cause);
        if (causeRecords.length > 0) {
          // Здесь просто отмечаем, что причина присутствовала в этот день
          chartDataPoint[cause] = Math.max(...causeRecords.map(r => r.intensity));
        }
      });
      
      return chartDataPoint;
    });
  };

  // Новая функция для получения почасовых данных за конкретный день
  const getHourlyChartData = (date: Date, filters: {
    types: PainType[];
    causes: PainCause[];
  }): HourlyChartData[] => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Создаем массив для всех часов дня (0-23)
    const hourlyData: HourlyChartData[] = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      painCount: 0
    }));
    
    // Фильтруем записи только за указанный день
    const dayRecords = records.filter(record => {
      const recordDate = format(new Date(record.date), 'yyyy-MM-dd');
      return (
        recordDate === dateString && 
        filters.types.includes(record.type) &&
        (filters.causes.length === 0 || filters.causes.includes(record.cause))
      );
    });
    
    // Распределяем записи по часам
    dayRecords.forEach(record => {
      // Извлекаем час из времени записи (формат HH:MM)
      const hour = parseInt(record.time.split(':')[0], 10);
      
      if (hour >= 0 && hour < 24) {
        // Увеличиваем счетчик болей для этого часа
        hourlyData[hour].painCount += 1;
        
        // Добавляем интенсивность боли по типу
        if (record.type === 'headache') {
          hourlyData[hour].headache = Math.max(hourlyData[hour].headache || 0, record.intensity);
        } else if (record.type === 'stomach') {
          hourlyData[hour].stomach = Math.max(hourlyData[hour].stomach || 0, record.intensity);
        }
      }
    });
    
    return hourlyData;
  };

  return (
    <PainRecordContext.Provider value={{
      records,
      addRecord,
      deleteRecord,
      clearAllRecords,
      getRecordsForDate,
      getChartData,
      getHourlyChartData
    }}>
      {children}
    </PainRecordContext.Provider>
  );
};

export const usePainRecords = () => {
  const context = useContext(PainRecordContext);
  if (context === undefined) {
    throw new Error('usePainRecords must be used within a PainRecordProvider');
  }
  return context;
}; 