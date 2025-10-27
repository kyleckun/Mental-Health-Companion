// src/types/mood.types.ts

export interface MoodEntry {
  id: string;
  userId: string;
  moodScore: number; // 1-10
  note?: string;
  timestamp: Date;
  tags?: string[];
}

export interface MoodTrendData {
  date: string;
  moodScore: number;
  avgScore?: number;
}

export interface VisualizationFilters {
  dateRange: 'week' | 'month' | 'custom';
  startDate?: Date;
  endDate?: Date;
}

export type MoodLevel = 'low' | 'medium' | 'high';

export const getMoodLevel = (score: number): MoodLevel => {
  if (score <= 3) return 'low';
  if (score <= 7) return 'medium';
  return 'high';
};

export const getMoodColor = (score: number): string => {
  const colors = [
    '#ef4444', // 1
    '#f97316', // 2
    '#f59e0b', // 3
    '#eab308', // 4
    '#84cc16', // 5
    '#22c55e', // 6
    '#10b981', // 7
    '#06b6d4', // 8
    '#3b82f6', // 9
    '#6366f1'  // 10
  ];
  return colors[Math.max(0, Math.min(9, score - 1))];
};