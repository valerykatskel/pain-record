export type PainType = 'headache' | 'stomach';

export type PainCause = 'menstruation' | 'stress' | 'solarFlare' | 'unknown';

export interface PainRecord {
  id: string;
  date: Date;
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