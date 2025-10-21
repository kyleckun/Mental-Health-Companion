// src/services/moodService.ts
import { MoodEntry, MoodTrendData } from '../types/mood.types';

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const MOCK_DATA_KEY = 'mood_entries';

// --- LocalStorage Manager ---
class LocalStorageManager<T> {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  get(): T | null {
    try {
      const item = localStorage.getItem(this.key);
      if (!item) return null;
      
      // Safely parse and handle date revival
      return JSON.parse(item, (key, value) => {
        if (key === 'timestamp' && typeof value === 'string') {
          return new Date(value);
        }
        return value;
      });
    } catch (error) {
      console.error(`Error reading from localStorage key “${this.key}”:`, error);
      return null;
    }
  }

  set(value: T): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key “${this.key}”:`, error);
    }
  }
}

const moodStorage = new LocalStorageManager<MoodEntry[]>(MOCK_DATA_KEY);

// --- Mock Data Generation ---
const generateMockData = (): MoodEntry[] => {
  const mockEntries: MoodEntry[] = [];
  const now = new Date();
  const notes = [
    "Feeling optimistic about the new project.",
    "A bit tired today, need more rest.",
    "Had a great time with friends.",
    "Feeling stressed about the upcoming deadline.",
    "Enjoyed a quiet evening with a good book.",
    "Productive day at work.",
    "Feeling a little down for no reason.",
  ];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(Math.floor(Math.random() * 12) + 8); // Random time between 8 AM and 8 PM

    const moodScore = Math.round(5.5 + 3.5 * Math.sin(i / 4) + Math.random() * 2 - 1);

    mockEntries.push({
      id: `mock-${i}`,
      userId: 'user-1',
      moodScore: Math.max(1, Math.min(10, moodScore)),
      note: Math.random() < 0.4 ? notes[i % notes.length] : undefined,
      timestamp: date,
      tags: ['daily']
    });
  }
  
  return mockEntries;
};

// Initialize mock data if none exists
if (!moodStorage.get()) {
  moodStorage.set(generateMockData());
}

// --- Mood Service ---
class MoodService {
  private useMockData: boolean = true;

  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }

  async createEntry(data: Omit<MoodEntry, 'id' | 'userId' | 'timestamp'>): Promise<MoodEntry> {
    if (this.useMockData) {
      const entries = moodStorage.get() || [];
      const newEntry: MoodEntry = {
        id: `entry-${Date.now()}`,
        userId: 'user-1',
        timestamp: new Date(),
        ...data
      };
      moodStorage.set([...entries, newEntry]);
      return newEntry;
    }
    
    const response = await fetch(`${API_BASE_URL}/mood-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.getAuthToken()}` },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create mood entry');
    return response.json();
  }

  async getEntries(limit?: number): Promise<MoodEntry[]> {
    if (this.useMockData) {
      const entries = moodStorage.get() || [];
      const sorted = entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return limit ? sorted.slice(0, limit) : sorted;
    }

    const url = new URL(`${API_BASE_URL}/mood-entries`);
    if (limit) url.searchParams.set('limit', limit.toString());
    const response = await fetch(url.toString(), { headers: { 'Authorization': `Bearer ${this.getAuthToken()}` } });
    if (!response.ok) throw new Error('Failed to fetch mood entries');
    const data = await response.json();
    return data.map((entry: any) => ({ ...entry, timestamp: new Date(entry.timestamp) }));
  }

  async updateEntry(id: string, data: Partial<Omit<MoodEntry, 'id'>>): Promise<MoodEntry> {
    if (this.useMockData) {
      const entries = moodStorage.get() || [];
      const index = entries.findIndex(e => e.id === id);
      if (index === -1) throw new Error('Entry not found');
      
      const updatedEntry = { ...entries[index], ...data };
      entries[index] = updatedEntry;
      moodStorage.set(entries);
      return updatedEntry;
    }

    const response = await fetch(`${API_BASE_URL}/mood-entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.getAuthToken()}` },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update mood entry');
    return response.json();
  }

  async deleteEntry(id: string): Promise<void> {
    if (this.useMockData) {
      const entries = moodStorage.get() || [];
      moodStorage.set(entries.filter(e => e.id !== id));
      return;
    }

    const response = await fetch(`${API_BASE_URL}/mood-entries/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
    });
    if (!response.ok) throw new Error('Failed to delete mood entry');
  }

  async getTrendData(range: 'week' | 'month' = 'week'): Promise<MoodTrendData[]> {
    const entries = await this.getEntries();
    const days = range === 'week' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const filteredEntries = entries.filter(entry => entry.timestamp >= startDate);

    const groupedByDate: { [key: string]: number[] } = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      groupedByDate[dateKey] = [];
    }

    filteredEntries.forEach(entry => {
      const dateKey = entry.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      if (groupedByDate[dateKey]) {
        groupedByDate[dateKey].push(entry.moodScore);
      }
    });

    return Object.entries(groupedByDate).map(([date, scores]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      moodScore: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0
    }));
  }

  setMockMode(useMock: boolean): void {
    this.useMockData = useMock;
  }
}

export const moodService = new MoodService();
export default moodService;
