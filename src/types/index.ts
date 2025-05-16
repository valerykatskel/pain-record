export type PainType = 'headache' | 'stomach';

export type PainCause = 'menstruation' | 'stress' | 'solarFlare' | 'unknown';

// Периоды отображения графика
export type ChartPeriod = 'day' | 'week' | 'month' | 'year';

export interface PainRecord {
  id: string;
  date: Date;
  time: string; // Время в формате HH:MM
  type: PainType;
  cause: PainCause;
  intensity: number; // шкала от 1 до 10
  notes?: string;
}

export interface ChartData {
  date: string;
  headache?: number;
  stomach?: number;
  menstruation?: number;
  stress?: number;
  solarFlare?: number;
  unknown?: number;
}

// Данные для почасового графика за день
export interface HourlyChartData {
  hour: string; // Час в формате HH:00
  headache?: number;
  stomach?: number;
  painCount: number; // Количество записей о боли в этот час
} 