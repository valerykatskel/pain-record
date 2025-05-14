import React, { useState, useRef } from 'react';
import { usePainRecords } from '../context/PainRecordContext';

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
    <div className="mt-2 mb-5 flex justify-end">
      <button 
        className="bg-gray-700 text-white py-1.5 px-3 text-sm rounded hover:bg-gray-800 transition-colors duration-200"
        onClick={() => setIsModalOpen(true)}
      >
        Управление данными
      </button>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-4">Управление данными</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-800 mb-2">Экспорт данных</h4>
                  <p className="text-sm text-gray-600 mb-3">Сохраните ваши данные в файл, чтобы не потерять их при очистке браузера</p>
                  <button 
                    className={`w-full py-2 px-4 rounded font-medium text-white text-sm 
                      ${records.length === 0 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'}`} 
                    onClick={handleExport}
                    disabled={records.length === 0}
                  >
                    Экспортировать данные
                  </button>
                  {records.length === 0 && (
                    <p className="text-sm text-gray-500 italic mt-2">Нет данных для экспорта</p>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-800 mb-2">Импорт данных</h4>
                  <p className="text-sm text-gray-600 mb-3">Загрузите ранее сохраненные данные из файла</p>
                  <input 
                    type="file" 
                    accept=".json" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <button 
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700"
                    onClick={handleImportClick}
                  >
                    Импортировать данные
                  </button>
                  {importError && (
                    <p className="text-sm text-red-600 mt-2">{importError}</p>
                  )}
                  {importSuccess && (
                    <p className="text-sm text-green-600 mt-2">{importSuccess}</p>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-800 mb-2">Очистка данных</h4>
                  <p className="text-sm text-gray-600 mb-3">Удалите все записи о боли</p>
                  {!showClearConfirm ? (
                    <button 
                      className={`w-full py-2 px-4 rounded font-medium text-white text-sm 
                        ${records.length === 0 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-red-600 hover:bg-red-700'}`}
                      onClick={handleClearData}
                      disabled={records.length === 0}
                    >
                      Очистить все данные
                    </button>
                  ) : (
                    <div className="bg-red-50 p-3 rounded-md border border-red-300">
                      <p className="text-sm font-semibold text-red-700 mb-2">Вы уверены? Это действие нельзя отменить!</p>
                      <div className="flex gap-2">
                        <button 
                          className="flex-1 py-1.5 px-3 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                          onClick={confirmClearData}
                        >
                          Да, удалить все
                        </button>
                        <button 
                          className="flex-1 py-1.5 px-3 bg-gray-300 text-gray-800 rounded text-sm font-medium hover:bg-gray-400"
                          onClick={cancelClearData}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                  {records.length === 0 && !showClearConfirm && (
                    <p className="text-sm text-gray-500 italic mt-2">Нет данных для удаления</p>
                  )}
                </div>
              </div>
              
              <button 
                className="w-full mt-5 py-2 px-4 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors duration-200"
                onClick={() => setIsModalOpen(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement; 