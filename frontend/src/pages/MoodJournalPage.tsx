import React, { useState, useEffect, useCallback } from 'react';
import MoodEntryForm from '../components/MoodJournal/MoodEntryForm';
import MoodHistoryList from '../components/MoodJournal/MoodHistoryList';
import MoodTrendChart from '../components/Visualization/MoodTrendChart';
import AIChatInterface from '../components/Chat/AIChatInterface';
import CrisisAlert from '../components/Chat/CrisisAlert';
import { moodService } from '../services/moodService';
import { MoodEntry, MoodTrendData } from '../types/mood.types';

const MoodJournalPage: React.FC = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [trendData, setTrendData] = useState<MoodTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'journal' | 'trends'>('chat'); // 改为默认chat
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [notification, setNotification] = useState<string | null>(null);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false); // 新增

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [entriesData, trendsData] = await Promise.all([
        moodService.getEntries(),
        moodService.getTrendData(timeRange)
      ]);
      setEntries(entriesData);
      setTrendData(trendsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setNotification('Error: Could not load your data.');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (data: Omit<MoodEntry, 'id' | 'userId' | 'timestamp'>) => {
    try {
      if (editingEntry) {
        await moodService.updateEntry(editingEntry.id, data);
        showNotification('Entry updated successfully!');
      } else {
        await moodService.createEntry(data);
        showNotification('New entry saved!');
      }
      
      await loadData();
      setShowForm(false);
      setEditingEntry(null);
    } catch (error) {
      setNotification('Error: Could not save the entry.');
    }
  };

  const handleEdit = (entry: MoodEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await moodService.deleteEntry(id);
        showNotification('Entry deleted.');
        await loadData();
      } catch (error) {
        setNotification('Error: Could not delete the entry.');
      }
    }
  };

  const handleTimeRangeChange = (range: 'week' | 'month') => {
    setTimeRange(range);
  };

  // 新增：处理危机检测
  const handleCrisisDetected = () => {
    setShowCrisisAlert(true);
  };

  const pageStyle: React.CSSProperties = { background: '#f4f7f6', minHeight: '100vh', padding: '20px' };
  const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto 20px' };
  const h1Style: React.CSSProperties = { fontSize: '28px', color: '#1f2937' };
  const addEntryBtnStyle: React.CSSProperties = { background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer' };
  const notificationStyle: React.CSSProperties = { maxWidth: '1200px', margin: '0 auto 16px', padding: '12px 20px', borderRadius: '8px', background: '#22c55e', color: 'white' };
  const welcomeMessageStyle: React.CSSProperties = { textAlign: 'center', maxWidth: '600px', margin: '80px auto' };
  const welcomeBtnStyle: React.CSSProperties = { background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '16px', cursor: 'pointer', marginTop: '20px' };
  const tabNavigationStyle: React.CSSProperties = { display: 'flex', gap: '10px', maxWidth: '1200px', margin: '0 auto 20px' };
  const tabBtnStyle = (isActive: boolean): React.CSSProperties => ({ 
    padding: '10px 20px', 
    border: `1px solid ${isActive ? '#3b82f6' : '#d1d5db'}`, 
    background: isActive ? '#3b82f6' : 'white', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    color: isActive ? 'white' : '#1f2937',
    fontWeight: isActive ? '600' : '400'
  });
  const pageContentStyle: React.CSSProperties = { maxWidth: '1200px', margin: '0 auto' };
  const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };
  const modalContentStyle: React.CSSProperties = { background: 'white', borderRadius: '12px', maxWidth: '500px', width: '100%' };
  const modalHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e5e7eb' };
  const closeBtnStyle: React.CSSProperties = { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9ca3af' };
  const loadingContainerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' };
  const loadingSpinnerStyle: React.CSSProperties = { width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' };

  if (loading) {
    return <div style={loadingContainerStyle}><div style={loadingSpinnerStyle}></div></div>;
  }

  return (
    <div style={pageStyle}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <header style={headerStyle}>
        <h1 style={h1Style}>🧠 Mental Health Companion</h1>
        {activeTab === 'journal' && (
          <button style={addEntryBtnStyle} onClick={() => { setShowForm(true); setEditingEntry(null); }}>
            + Add New Entry
          </button>
        )}
      </header>

      {notification && <div style={notificationStyle}>{notification}</div>}

      {/* Tab Navigation - 添加AI Chat标签 */}
      <div style={tabNavigationStyle}>
        <button style={tabBtnStyle(activeTab === 'chat')} onClick={() => setActiveTab('chat')}>
          💬 AI Chat
        </button>
        <button style={tabBtnStyle(activeTab === 'journal')} onClick={() => setActiveTab('journal')}>
          📝 Journal
        </button>
        <button style={tabBtnStyle(activeTab === 'trends')} onClick={() => setActiveTab('trends')}>
          📊 Trends
        </button>
      </div>

      {/* Main Content */}
      <main style={pageContentStyle}>
        {/* AI Chat Tab - 新增 */}
        {activeTab === 'chat' && (
          <AIChatInterface onCrisisDetected={handleCrisisDetected} />
        )}

        {/* Journal Tab */}
        {activeTab === 'journal' && (
          <>
            {entries.length === 0 ? (
              <div style={welcomeMessageStyle}>
                <h2>Welcome to Your Mood Journal</h2>
                <p>Start tracking your emotional well-being by adding your first entry.</p>
                <button style={welcomeBtnStyle} onClick={() => setShowForm(true)}>Add First Entry</button>
              </div>
            ) : (
              <MoodHistoryList entries={entries} onEdit={handleEdit} onDelete={handleDelete} />
            )}
          </>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <MoodTrendChart data={trendData} onTimeRangeChange={handleTimeRangeChange} timeRange={timeRange} />
        )}
      </main>

      {/* Modal for Add/Edit Form */}
      {showForm && (
        <div style={modalOverlayStyle} onClick={() => setShowForm(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h2>{editingEntry ? 'Edit Mood Entry' : 'How are you feeling?'}</h2>
              <button style={closeBtnStyle} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <MoodEntryForm
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              initialData={editingEntry || undefined}
            />
          </div>
        </div>
      )}

      {/* Crisis Alert Modal - 新增 */}
      <CrisisAlert
        isOpen={showCrisisAlert}
        onClose={() => setShowCrisisAlert(false)}
      />
    </div>
  );
};

export default MoodJournalPage;