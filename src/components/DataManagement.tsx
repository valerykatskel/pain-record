import React, { useState, useRef } from 'react';
import { usePainRecords } from '../context/PainRecordContext';
import './DataManagement.css';

const DataManagement = () => {
  const { records, addRecord, clearAllRecords } = usePainRecords();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    // Подготовка данных для экспорта
    const dataToExport = JSON.stringify(records, null, 2);
    
    // Создание blob и ссылки для скачивания
    const blob = new Blob([dataToExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Создание элемента ссылки для скачивания и активация его
    const a = document.createElement('a');
    a.href = url;
    a.download = `pain-records-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Очистка
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);
    
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        
        if (!Array.isArray(parsedData)) {
          throw new Error('Некорректный формат данных. Ожидается массив записей.');
        }
        
        // Проверяем структуру каждой записи
        let importCount = 0;
        parsedData.forEach(record => {
          if (!record.id || !record.date || !record.type || !record.cause || !record.intensity) {
            throw new Error('Некорректная структура данных в одной из записей.');
          }
          
          // Добавляем запись в контекст
          // Используем addRecord, чтобы генерировать новый ID
          addRecord({
            date: new Date(record.date),
            type: record.type,
            cause: record.cause,
            intensity: record.intensity,
            notes: record.notes || ''
          });
          
          importCount++;
        });
        
        setImportSuccess(`Успешно импортировано ${importCount} записей.`);
      } catch (error) {
        console.error('Ошибка при импорте данных:', error);
        setImportError(error instanceof Error ? error.message : 'Неизвестная ошибка при импорте.');
      }
    };
    
    reader.onerror = () => {
      setImportError('Ошибка при чтении файла.');
    };
    
    reader.readAsText(file);
    
    // Сбрасываем input, чтобы можно было загрузить тот же файл повторно
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleClearData = () => {
    setShowClearConfirm(true);
  };

  const confirmClearData = () => {
    clearAllRecords();
    setShowClearConfirm(false);
    setImportSuccess('Все записи успешно удалены.');
  };

  const cancelClearData = () => {
    setShowClearConfirm(false);
  };

  return (
    <div className="data-management">
      <button className="data-btn" onClick={() => setIsModalOpen(true)}>
        Управление данными
      </button>
      
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Управление данными</h3>
            
            <div className="modal-actions">
              <div className="action-group">
                <h4>Экспорт данных</h4>
                <p>Сохраните ваши данные в файл, чтобы не потерять их при очистке браузера</p>
                <button 
                  className="action-btn export-btn" 
                  onClick={handleExport}
                  disabled={records.length === 0}
                >
                  Экспортировать данные
                </button>
                {records.length === 0 && (
                  <p className="info-message">Нет данных для экспорта</p>
                )}
              </div>
              
              <div className="action-group">
                <h4>Импорт данных</h4>
                <p>Загрузите ранее сохраненные данные из файла</p>
                <input 
                  type="file" 
                  accept=".json" 
                  style={{ display: 'none' }} 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button 
                  className="action-btn import-btn" 
                  onClick={handleImportClick}
                >
                  Импортировать данные
                </button>
                {importError && (
                  <p className="error-message">{importError}</p>
                )}
                {importSuccess && (
                  <p className="success-message">{importSuccess}</p>
                )}
              </div>
              
              <div className="action-group">
                <h4>Очистка данных</h4>
                <p>Удалите все записи о боли</p>
                {!showClearConfirm ? (
                  <button 
                    className="action-btn clear-btn" 
                    onClick={handleClearData}
                    disabled={records.length === 0}
                  >
                    Очистить все данные
                  </button>
                ) : (
                  <div className="clear-confirm">
                    <p className="warning-message">Вы уверены? Это действие нельзя отменить!</p>
                    <div className="clear-confirm-actions">
                      <button 
                        className="confirm-clear-btn" 
                        onClick={confirmClearData}
                      >
                        Да, удалить все
                      </button>
                      <button 
                        className="cancel-clear-btn" 
                        onClick={cancelClearData}
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
                {records.length === 0 && !showClearConfirm && (
                  <p className="info-message">Нет данных для удаления</p>
                )}
              </div>
            </div>
            
            <button 
              className="close-modal-btn" 
              onClick={() => setIsModalOpen(false)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement; 