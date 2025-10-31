// src/components/MoodJournal/MoodHistoryList.tsx
import React from 'react';
import { MoodEntry, getMoodColor } from '../../types/mood.types';

interface MoodHistoryListProps {
  entries: MoodEntry[];
  onEdit?: (entry: MoodEntry) => void;
  onDelete?: (id: string) => void;
}

const MoodHistoryList: React.FC<MoodHistoryListProps> = ({ 
  entries, 
  onEdit, 
  onDelete 
}) => {
  const formatDate = (date: Date): string => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return `Today, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getMoodEmoji = (score: number): string => {
    if (score <= 2) return 'Very Low';
    if (score <= 4) return 'Low';
    if (score <= 6) return 'Neutral';
    if (score <= 8) return 'Good';
    return 'Great';
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#6b7280',
  };

  const emptyIconStyle: React.CSSProperties = {
    fontSize: '64px',
    marginBottom: '16px',
  };

  const emptyH3Style: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#374151',
  };

  const emptyPStyle: React.CSSProperties = {
    fontSize: '14px',
  };

  const listContainerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px',
  };

  const listTitleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '24px',
    color: '#111827',
  };

  const entriesContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const moodCardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'all 0.2s',
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  };

  const moodInfoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const moodEmojiStyle: React.CSSProperties = {
    fontSize: '32px',
  };

  const moodScoreBadgeStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: '20px',
    fontWeight: 700,
    fontSize: '14px',
  };

  const timestampStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#6b7280',
  };

  const cardBodyStyle: React.CSSProperties = {
    marginBottom: '12px',
  };

  const moodNoteStyle: React.CSSProperties = {
    color: '#374151',
    lineHeight: '1.6',
    fontSize: '14px',
    margin: 0,
  };

  const cardActionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
  };

  const actionBtnStyle: React.CSSProperties = {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'transparent',
  };

  const editBtnStyle: React.CSSProperties = {
    ...actionBtnStyle,
    color: '#3b82f6',
  };

  const deleteBtnStyle: React.CSSProperties = {
    ...actionBtnStyle,
    color: '#ef4444',
  };

  if (entries.length === 0) {
    return (
      <div style={emptyStateStyle}>
        <div style={emptyIconStyle}>NOTE</div>
        <h3 style={emptyH3Style}>No mood entries yet</h3>
        <p style={emptyPStyle}>Start tracking your mood to see your history here</p>
      </div>
    );
  }

  return (
    <div style={listContainerStyle}>
      <h2 style={listTitleStyle}>Your Mood History</h2>
      
      <div style={entriesContainerStyle}>
        {entries.map((entry) => (
          <div key={entry.id} style={moodCardStyle} className="mood-card">
            <div style={cardHeaderStyle} className="card-header">
              <div style={moodInfoStyle}>
                <span style={moodEmojiStyle}>{getMoodEmoji(entry.moodScore)}</span>
                <div style={{ 
                  ...moodScoreBadgeStyle,
                  backgroundColor: getMoodColor(entry.moodScore),
                  color: 'white'
                }}>
                  {entry.moodScore}/10
                </div>
              </div>
              <div style={timestampStyle}>{formatDate(entry.timestamp)}</div>
            </div>

            {entry.note && (
              <div style={cardBodyStyle}>
                <p style={moodNoteStyle}>{entry.note}</p>
              </div>
            )}

            {(onEdit || onDelete) && (
              <div style={cardActionsStyle}>
                {onEdit && (
                  <button
                    onClick={() => onEdit(entry)}
                    style={editBtnStyle}
                    className="edit-btn"
                    aria-label="Edit entry"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this entry?')) {
                        onDelete(entry.id);
                      }
                    }}
                    style={deleteBtnStyle}
                    className="delete-btn"
                    aria-label="Delete entry"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .mood-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transform: translateY(-2px);
        }

        .edit-btn:hover {
          background: #eff6ff;
        }

        .delete-btn:hover {
          background: #fef2f2;
        }

        @media (max-width: 640px) {
          .mood-history-list {
            padding: 16px;
          }

          .list-title {
            font-size: 20px;
          }

          .card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .mood-emoji {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
};

export default MoodHistoryList;