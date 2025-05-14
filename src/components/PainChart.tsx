import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { usePainRecords } from '../context/PainRecordContext';
import { PainType, PainCause } from '../types';
import { subMonths } from 'date-fns';

const PainChart = () => {
  const { getChartData } = usePainRecords();
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 3));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedTypes, setSelectedTypes] = useState<PainType[]>(['headache', 'stomach']);
  const [selectedCauses, setSelectedCauses] = useState<PainCause[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const data = getChartData(startDate, endDate, {
      types: selectedTypes,
      causes: selectedCauses
    });
    setChartData(data);
  }, [startDate, endDate, selectedTypes, selectedCauses, getChartData]);

  const handleTypeToggle = (type: PainType) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleCauseToggle = (cause: PainCause) => {
    if (selectedCauses.includes(cause)) {
      setSelectedCauses(selectedCauses.filter(c => c !== cause));
    } else {
      setSelectedCauses([...selectedCauses, cause]);
    }
  };

  const handlePeriodChange = (period: string) => {
    const now = new Date();
    let newStartDate;
    
    switch (period) {
      case '1month':
        newStartDate = subMonths(now, 1);
        break;
      case '3months':
        newStartDate = subMonths(now, 3);
        break;
      case '6months':
        newStartDate = subMonths(now, 6);
        break;
      case '1year':
        newStartDate = subMonths(now, 12);
        break;
      default:
        newStartDate = subMonths(now, 3);
    }
    
    setStartDate(newStartDate);
    setEndDate(now);
  };

  const getLineColor = (key: string) => {
    switch (key) {
      case 'headache':
        return '#FF6384';
      case 'stomach':
        return '#36A2EB';
      case 'menstruation':
        return '#FF9F40';
      case 'stress':
        return '#4BC0C0';
      case 'solarFlare':
        return '#9966FF';
      case 'unknown':
        return '#C9CBCF';
      default:
        return '#000000';
    }
  };

  const getCauseName = (cause: PainCause): string => {
    switch (cause) {
      case 'menstruation':
        return 'Менструация';
      case 'stress':
        return 'Стресс';
      case 'solarFlare':
        return 'Солнечная вспышка';
      case 'unknown':
        return 'Неизвестно';
      default:
        return cause;
    }
  };

  const getTypeName = (type: PainType): string => {
    switch (type) {
      case 'headache':
        return 'Головная боль';
      case 'stomach':
        return 'Боль в животе';
      default:
        return type;
    }
  };

  return (
    <div className="mt-5 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">График боли</h2>
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Типы боли</h3>
            <div className="space-y-2">
              {(['headache', 'stomach'] as PainType[]).map(type => (
                <label key={type} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => handleTypeToggle(type)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{getTypeName(type)}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Причины</h3>
            <div className="space-y-2">
              {(['menstruation', 'stress', 'solarFlare', 'unknown'] as PainCause[]).map(cause => (
                <label key={cause} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCauses.includes(cause)}
                    onChange={() => handleCauseToggle(cause)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{getCauseName(cause)}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Период</h3>
            <select 
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              onChange={(e) => handlePeriodChange(e.target.value)}
              defaultValue="3months"
            >
              <option value="1month">1 месяц</option>
              <option value="3months">3 месяца</option>
              <option value="6months">6 месяцев</option>
              <option value="1year">1 год</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 h-96">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              
              {selectedTypes.map(type => (
                <Line
                  key={type}
                  type="monotone"
                  dataKey={type}
                  name={getTypeName(type)}
                  stroke={getLineColor(type)}
                  activeDot={{ r: 6 }}
                  strokeWidth={2}
                />
              ))}
              
              {selectedCauses.map(cause => (
                <Line
                  key={cause}
                  type="monotone"
                  dataKey={cause}
                  name={getCauseName(cause)}
                  stroke={getLineColor(cause)}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 italic">Нет данных для отображения на графике</p>
          </div>
        )}
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md text-sm text-gray-600">
        <h3 className="font-medium text-gray-700 mb-2">Информация о графике</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>График показывает интенсивность боли по шкале от 1 до 10</li>
          <li>Сплошные линии — типы боли, пунктирные — причины боли</li>
          <li>Используйте фильтры выше для анализа корреляций</li>
        </ul>
      </div>
    </div>
  );
};

export default PainChart; 