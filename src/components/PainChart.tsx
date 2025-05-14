import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { usePainRecords } from '../context/PainRecordContext';
import { PainType, PainCause } from '../types';
import { addMonths, format, subMonths } from 'date-fns';
import './PainChart.css';

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
    <div className="pain-chart">
      <h2>График боли</h2>
      
      <div className="chart-controls">
        <div className="filter-section">
          <h3>Типы боли</h3>
          <div className="filter-options">
            {(['headache', 'stomach'] as PainType[]).map(type => (
              <label key={type} className="filter-option">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => handleTypeToggle(type)}
                />
                <span className="filter-name">{getTypeName(type)}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="filter-section">
          <h3>Причины</h3>
          <div className="filter-options">
            {(['menstruation', 'stress', 'solarFlare', 'unknown'] as PainCause[]).map(cause => (
              <label key={cause} className="filter-option">
                <input
                  type="checkbox"
                  checked={selectedCauses.includes(cause)}
                  onChange={() => handleCauseToggle(cause)}
                />
                <span className="filter-name">{getCauseName(cause)}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="filter-section">
          <h3>Период</h3>
          <select 
            className="period-select"
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
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 10]} />
            <Tooltip />
            <Legend />
            
            {selectedTypes.map(type => (
              <Line
                key={type}
                type="monotone"
                dataKey={type}
                name={getTypeName(type)}
                stroke={getLineColor(type)}
                activeDot={{ r: 8 }}
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
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="chart-explanation">
        <p>График показывает интенсивность боли (по шкале от 1 до 10) в зависимости от времени.</p>
        <p>Сплошные линии показывают типы боли, а пунктирные — причины боли.</p>
        <p>Используйте фильтры выше, чтобы включить или отключить определенные типы боли и причины.</p>
      </div>
    </div>
  );
};

export default PainChart; 