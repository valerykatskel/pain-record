import React, { useState } from 'react';
import { usePainRecords } from '../context/PainRecordContext';
import { PainType, PainCause } from '../types';
import './AddPainForm.css';

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
    <div className="add-pain-form-container">
      {!showForm ? (
        <button 
          className="open-form-button" 
          onClick={() => setShowForm(true)}
        >
          + Добавить запись о боли
        </button>
      ) : (
        <div className="form-wrapper">
          <h3>Добавить запись о боли</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="date">Дата:</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="type">Тип боли:</label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as PainType)}
                required
              >
                <option value="headache">Головная боль</option>
                <option value="stomach">Боль в животе</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="cause">Причина:</label>
              <select
                id="cause"
                value={cause}
                onChange={(e) => setCause(e.target.value as PainCause)}
                required
              >
                <option value="unknown">Неизвестно</option>
                <option value="menstruation">Менструация</option>
                <option value="stress">Стресс</option>
                <option value="solarFlare">Солнечная вспышка</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="intensity">Интенсивность (1-10):</label>
              <div className="intensity-wrapper">
                <input
                  type="range"
                  id="intensity"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                />
                <span className="intensity-value">{intensity}</span>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Заметки:</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="form-buttons">
              <button type="submit" className="submit-button">Сохранить</button>
              <button 
                type="button" 
                className="cancel-button"
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