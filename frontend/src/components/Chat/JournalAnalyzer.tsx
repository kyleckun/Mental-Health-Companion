// src/components/Chat/JournalAnalyzer.tsx
import React, { useState, useEffect } from 'react';
import { moodService } from '../../services/moodService';
import { MoodEntry } from '../../types/mood.types';

interface JournalAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (entries: MoodEntry[], timeRange: string) => void;
}

type TimeRange = 'today' | '3days' | 'week' | 'month' | 'custom';

const JournalAnalyzer: React.FC<JournalAnalyzerProps> = ({ isOpen, onClose, onAnalyze }) => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<MoodEntry[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEntries();
    }
  }, [isOpen]);

  useEffect(() => {
    filterEntries();
  }, [timeRange, entries, customStartDate, customEndDate]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await moodService.getEntries();
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    if (entries.length === 0) {
      setFilteredEntries([]);
      return;
    }

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '3days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 3);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'custom':
        if (!customStartDate) {
          setFilteredEntries([]);
          return;
        }
        startDate = new Date(customStartDate);
        break;
      default:
        startDate = new Date(0);
    }

    const endDate = timeRange === 'custom' && customEndDate
      ? new Date(customEndDate)
      : now;

    const filtered = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });

    setFilteredEntries(filtered);
  };

  const handleAnalyze = () => {
    if (filteredEntries.length === 0) {
      alert('No entries found in the selected time range.');
      return;
    }

    const rangeLabel = timeRange === 'custom'
      ? `${customStartDate} to ${customEndDate || 'now'}`
      : timeRange;

    onAnalyze(filteredEntries, rangeLabel);
    onClose();
  };

  const getAverageMood = () => {
    if (filteredEntries.length === 0) return 0;
    const sum = filteredEntries.reduce((acc, entry) => acc + entry.moodScore, 0);
    return (sum / filteredEntries.length).toFixed(1);
  };

  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1f2937',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#9ca3af',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    marginTop: '8px',
  };

  const summaryBoxStyle: React.CSSProperties = {
    backgroundColor: '#f3f4f6',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
  };

  const summaryItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  };

  const analyzeButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: filteredEntries.length > 0 ? 'pointer' : 'not-allowed',
    opacity: filteredEntries.length > 0 ? 1 : 0.5,
  };

  const cancelButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Analyze My Journal</h2>
          <button style={closeButtonStyle} onClick={onClose}>×</button>
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Select Time Range</label>
          <select
            style={selectStyle}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          >
            <option value="today">Today</option>
            <option value="3days">Last 3 Days</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {timeRange === 'custom' && (
          <div style={sectionStyle}>
            <label style={labelStyle}>Custom Date Range</label>
            <input
              type="date"
              style={inputStyle}
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <input
              type="date"
              style={inputStyle}
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              placeholder="End Date (optional)"
            />
          </div>
        )}

        <div style={summaryBoxStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
            Selected Entries Summary
          </h3>
          <div style={summaryItemStyle}>
            <span style={{ color: '#6b7280' }}>Total Entries:</span>
            <span style={{ fontWeight: 600 }}>{filteredEntries.length}</span>
          </div>
          {filteredEntries.length > 0 && (
            <>
              <div style={summaryItemStyle}>
                <span style={{ color: '#6b7280' }}>Average Mood:</span>
                <span style={{ fontWeight: 600 }}>{getAverageMood()}/10</span>
              </div>
              <div style={summaryItemStyle}>
                <span style={{ color: '#6b7280' }}>Date Range:</span>
                <span style={{ fontSize: '12px' }}>
                  {new Date(filteredEntries[filteredEntries.length - 1].timestamp).toLocaleDateString()}
                  {' - '}
                  {new Date(filteredEntries[0].timestamp).toLocaleDateString()}
                </span>
              </div>
            </>
          )}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading entries...</p>
        ) : filteredEntries.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#ef4444', fontSize: '14px' }}>
            No entries found in the selected time range.
          </p>
        ) : (
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            AI will analyze {filteredEntries.length} mood {filteredEntries.length === 1 ? 'entry' : 'entries'}
            {' '}and provide insights about your emotional patterns, trends, and personalized suggestions.
          </p>
        )}

        <div style={buttonContainerStyle}>
          <button
            style={analyzeButtonStyle}
            onClick={handleAnalyze}
            disabled={filteredEntries.length === 0}
          >
            Analyze with AI
          </button>
          <button style={cancelButtonStyle} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalAnalyzer;
