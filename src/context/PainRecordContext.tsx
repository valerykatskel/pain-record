import React, { createContext, useState, useContext, ReactNode } from 'react';
import { PainRecord, PainType, PainCause } from '../types';
import { format } from 'date-fns';

interface PainRecordContextType {
  records: PainRecord[];
  addRecord: (record: Omit<PainRecord, 'id'>) => void;
  deleteRecord: (id: string) => void;
  getRecordsForDate: (date: Date) => PainRecord[];
  getChartData: (startDate: Date, endDate: Date, filters: {
    types: PainType[];
    causes: PainCause[];
  }) => Array<{
    date: string;
    [key: string]: any;
  }>;
}

const PainRecordContext = createContext<PainRecordContextType | undefined>(undefined);

export const PainRecordProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<PainRecord[]>([]);

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

  return (
    <PainRecordContext.Provider value={{
      records,
      addRecord,
      deleteRecord,
      getRecordsForDate,
      getChartData
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