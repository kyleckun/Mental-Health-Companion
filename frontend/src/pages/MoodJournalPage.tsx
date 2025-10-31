import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MoodEntryForm from '../components/MoodJournal/MoodEntryForm';
import MoodHistoryList from '../components/MoodJournal/MoodHistoryList';
import MoodTrendChart from '../components/Visualization/MoodTrendChart';
import AIChatInterface from '../components/Chat/AIChatInterface';
import CrisisAlert from '../components/Chat/CrisisAlert';
import { moodService } from '../services/moodService';
import { suggestionsService, SuggestionCard, SuggestionsResponse } from '../services/suggestionsService';
import { MoodEntry, MoodTrendData } from '../types/mood.types';

const MoodJournalPage: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [trendData, setTrendData] = useState<MoodTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'journal' | 'trends' | 'suggestions'>('chat');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<SuggestionCard[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [suggestionsTimeRange, setSuggestionsTimeRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [suggestionsStartDate, setSuggestionsStartDate] = useState<string>('');
  const [suggestionsEndDate, setSuggestionsEndDate] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [entriesData, trendsData] = await Promise.all([
        moodService.getEntries(),
        moodService.getTrendData(timeRange, customStartDate, customEndDate)
      ]);
      setEntries(entriesData);
      setTrendData(trendsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setNotification('Error: Could not load your data.');
    } finally {
      setLoading(false);
    }
  }, [timeRange, customStartDate, customEndDate]);

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
    // Confirmation is already handled in MoodHistoryList component
    try {
      await moodService.deleteEntry(id);
      showNotification('Entry deleted.');
      await loadData();
    } catch (error) {
      setNotification('Error: Could not delete the entry.');
    }
  };

  const handleTimeRangeChange = (
    range: 'today' | 'week' | 'month' | 'custom',
    startDate?: string,
    endDate?: string
  ) => {
    setTimeRange(range);
    if (range === 'custom' && startDate && endDate) {
      setCustomStartDate(startDate);
      setCustomEndDate(endDate);
    }
  };

  const handleCrisisDetected = () => {
    setShowCrisisAlert(true);
  };

  const loadSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      const response = await suggestionsService.getSuggestions(
        suggestionsTimeRange,
        suggestionsStartDate,
        suggestionsEndDate
      );
      setSuggestions(response.suggestions);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      showNotification('Failed to load suggestions');
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    try {
      const response = await suggestionsService.generateAISuggestions(
        suggestionsTimeRange,
        suggestionsStartDate,
        suggestionsEndDate
      );
      setSuggestions(response.suggestions);
      showNotification('AI suggestions generated!');
    } catch (err) {
      console.error('Failed to generate AI suggestions:', err);
      showNotification('Failed to generate AI suggestions');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCompleteSuggestion = async (suggestionId: string) => {
    try {
      await suggestionsService.completeSuggestion(suggestionId);
      showNotification('Suggestion completed!');
      await loadSuggestions();
    } catch (err) {
      console.error('Failed to complete suggestion:', err);
    }
  };

  const handleSkipSuggestion = async (suggestionId: string) => {
    try {
      await suggestionsService.skipSuggestion(suggestionId);
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (err) {
      console.error('Failed to skip suggestion:', err);
    }
  };

  // Load suggestions when switching to suggestions tab or time range changes
  useEffect(() => {
    if (activeTab === 'suggestions') {
      loadSuggestions();
    }
  }, [activeTab, suggestionsTimeRange, suggestionsStartDate, suggestionsEndDate]);

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
        <h1 style={h1Style}>Mental Health Companion</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {activeTab === 'journal' && (
            <button style={addEntryBtnStyle} onClick={() => { setShowForm(true); setEditingEntry(null); }}>
              + Add New Entry
            </button>
          )}
          <button
            style={{ ...addEntryBtnStyle, background: '#8b5cf6' }}
            onClick={() => navigate('/profile')}
          >
            Profile
          </button>
        </div>
      </header>

      {notification && <div style={notificationStyle}>{notification}</div>}

      {/* Tab Navigation */}
      <div style={tabNavigationStyle}>
        <button style={tabBtnStyle(activeTab === 'chat')} onClick={() => setActiveTab('chat')}>
          AI Chat
        </button>
        <button style={tabBtnStyle(activeTab === 'journal')} onClick={() => setActiveTab('journal')}>
          Journal
        </button>
        <button style={tabBtnStyle(activeTab === 'trends')} onClick={() => setActiveTab('trends')}>
          Trends
        </button>
        <button style={tabBtnStyle(activeTab === 'suggestions')} onClick={() => setActiveTab('suggestions')}>
          Suggestions
        </button>
      </div>

      <main style={pageContentStyle}>
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
          <MoodTrendChart
            data={trendData}
            onTimeRangeChange={handleTimeRangeChange}
            timeRange={timeRange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
          />
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {suggestionsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid #e5e7eb',
                  borderTopColor: '#3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px'
                }}></div>
                <p>Loading suggestions...</p>
              </div>
            ) : (
              <>
                {/* Time Range Selector */}
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '8px', display: 'block' }}>
                      Analysis Time Range
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {(['today', 'week', 'month', 'custom'] as const).map((range) => (
                        <button
                          key={range}
                          onClick={() => setSuggestionsTimeRange(range)}
                          style={{
                            padding: '8px 16px',
                            border: suggestionsTimeRange === range ? '2px solid #3b82f6' : '1px solid #d1d5db',
                            background: suggestionsTimeRange === range ? '#3b82f6' : 'white',
                            color: suggestionsTimeRange === range ? 'white' : '#1f2937',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {range === 'today' ? 'Today' : range === 'week' ? 'Past 2 Weeks' : range === 'month' ? 'Past Month' : 'Custom Range'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {suggestionsTimeRange === 'custom' && (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>Start Date</label>
                        <input
                          type="date"
                          value={suggestionsStartDate}
                          onChange={(e) => setSuggestionsStartDate(e.target.value)}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>End Date</label>
                        <input
                          type="date"
                          value={suggestionsEndDate}
                          onChange={(e) => setSuggestionsEndDate(e.target.value)}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleGenerateAI}
                    disabled={generatingAI}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                      color: 'white',
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: generatingAI ? 'not-allowed' : 'pointer',
                      opacity: generatingAI ? 0.7 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {generatingAI ? '⏳ Generating...' : '✨ Generate with AI'}
                  </button>
                  <button
                    onClick={loadSuggestions}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    🔄 Refresh
                  </button>
                </div>

                {suggestions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px' }}>
                    <h3 style={{ color: '#1f2937', marginBottom: '12px' }}>No Suggestions Yet</h3>
                    <p style={{ color: '#6b7280' }}>Click "Generate with AI" or "Refresh" to get personalized suggestions!</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '20px'
                  }}>
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        style={{
                          background: 'white',
                          borderRadius: '12px',
                          padding: '20px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          borderLeft: `4px solid #3b82f6`,
                          transition: 'transform 0.2s',
                        }}
                      >
                        <div style={{ marginBottom: '12px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0' }}>
                            {suggestion.title}
                          </h3>
                          <span style={{
                            background: '#3b82f6',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {suggestion.category}
                          </span>
                        </div>

                        <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
                          {suggestion.description}
                        </p>

                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '12px',
                          borderTop: '1px solid #e5e7eb',
                          marginBottom: '12px'
                        }}>
                          <span style={{ color: '#6b7280', fontSize: '14px' }}>
                            ⏱️ {suggestion.duration_minutes} min
                          </span>
                          {suggestion.user_type_specific && (
                            <span style={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              padding: '4px 10px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              Personalized
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleCompleteSuggestion(suggestion.id)}
                            style={{
                              flex: 1,
                              background: '#10b981',
                              color: 'white',
                              padding: '10px',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            ✓ Complete
                          </button>
                          <button
                            onClick={() => handleSkipSuggestion(suggestion.id)}
                            style={{
                              flex: 1,
                              background: '#f3f4f6',
                              color: '#6b7280',
                              padding: '10px',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Modal for Add/Edit Form */}
      {showForm && (
        <div style={modalOverlayStyle} onClick={() => setShowForm(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h2>{editingEntry ? 'Edit Mood Entry' : 'How are you feeling?'}</h2>
              <button style={closeBtnStyle} onClick={() => setShowForm(false)}>X</button>
            </div>
            <MoodEntryForm
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              initialData={editingEntry || undefined}
            />
          </div>
        </div>
      )}

      <CrisisAlert
        isOpen={showCrisisAlert}
        onClose={() => setShowCrisisAlert(false)}
      />
    </div>
  );
};

export default MoodJournalPage;