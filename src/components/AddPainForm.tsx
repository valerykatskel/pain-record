import React, { useState } from 'react';
import { usePainRecords } from '../context/PainRecordContext';
import { PainType, PainCause } from '../types';

const AddPainForm = () => {
  const { addRecord } = usePainRecords();
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [type, setType] = useState<PainType>('headache');
  const [cause, setCause] = useState<PainCause>('unknown');
  const [intensity, setIntensity] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRecord({
      date: new Date(date),
      type,
      cause,
      intensity,
      notes
    });
    
    // Сбросить форму
    setType('headache');
    setCause('unknown');
    setIntensity(5);
    setNotes('');
    setShowForm(false);
  };

  return (
    <div className="my-5">
      {!showForm ? (
        <button 
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors duration-200 shadow-sm w-full md:w-auto"
          onClick={() => setShowForm(true)}
        >
          + Добавить запись о боли
        </button>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Добавить запись о боли</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Дата:</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Тип боли:</label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as PainType)}
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="headache">Головная боль</option>
                <option value="stomach">Боль в животе</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="cause" className="block text-sm font-medium text-gray-700 mb-1">Причина:</label>
              <select
                id="cause"
                value={cause}
                onChange={(e) => setCause(e.target.value as PainCause)}
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="unknown">Неизвестно</option>
                <option value="menstruation">Менструация</option>
                <option value="stress">Стресс</option>
                <option value="solarFlare">Солнечная вспышка</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="intensity" className="block text-sm font-medium text-gray-700 mb-1">Интенсивность (1-10):</label>
              <div className="flex items-center">
                <input
                  type="range"
                  id="intensity"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="ml-2 font-medium text-gray-700 min-w-[25px] text-center">{intensity}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Заметки:</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button 
                type="submit" 
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors duration-200"
              >
                Сохранить
              </button>
              <button 
                type="button" 
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors duration-200"
                onClick={() => setShowForm(false)}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddPainForm; 