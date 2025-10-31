import React, { useState } from 'react';
import { MoodEntry, getMoodColor, getMoodLevel } from '../../types/mood.types';

interface MoodCardProps {
  entry: MoodEntry;
  onEdit: (entry: MoodEntry) => void;
  onDelete: (id: string) => void;
}

const MoodCard: React.FC<MoodCardProps> = ({ entry, onEdit, onDelete }) => {
  const [isCardHovered, setCardHovered] = useState(false);
  const [isEditHovered, setEditHovered] = useState(false);
  const [isDeleteHovered, setDeleteHovered] = useState(false);

  const getMoodEmoji = (score: number): string => {
    if (score <= 2) return 'Very Low';
    if (score <= 4) return 'Low';
    if (score <= 6) return 'Neutral';
    if (score <= 8) return 'Good';
    return 'Great';
  };

  const formattedDate = new Date(entry.timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const moodCardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: isCardHovered ? '0 8px 20px rgba(0,0,0,0.12)' : '0 4px 12px rgba(0,0,0,0.08)',
    borderLeft: `5px solid ${getMoodColor(entry.moodScore)}`,
    transition: 'transform 0.2s, box-shadow 0.2s',
    transform: isCardHovered ? 'translateY(-4px)' : 'translateY(0)',
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  };

  const moodDisplayStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const moodEmojiStyle: React.CSSProperties = {
    fontSize: '32px',
  };

  const moodScoreStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: getMoodColor(entry.moodScore),
  };

  const cardActionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
  };

  const btnIconStyle = (isHovered: boolean): React.CSSProperties => ({
    background: isHovered ? '#e5e7eb' : '#f3f4f6',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    color: isHovered ? '#111827' : '#6b7280',
    transition: 'all 0.2s',
  });

  const moodNoteStyle: React.CSSProperties = {
    fontSize: '15px',
    color: '#374151',
    margin: '0 0 16px 0',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.6,
  };

  const cardFooterStyle: React.CSSProperties = {
    textAlign: 'right',
  };

  const moodTimestampStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 500,
  };

  return (
    <div 
      style={moodCardStyle}
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
    >
      <div style={cardHeaderStyle}>
        <div style={moodDisplayStyle}>
          <span style={moodEmojiStyle}>{getMoodEmoji(entry.moodScore)}</span>
          <span style={moodScoreStyle}>
            {entry.moodScore}/10
          </span>
        </div>
        <div style={cardActionsStyle}>
          <button
            onClick={() => onEdit(entry)}
            style={btnIconStyle(isEditHovered)}
            aria-label="Edit"
            onMouseEnter={() => setEditHovered(true)}
            onMouseLeave={() => setEditHovered(false)}
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            style={btnIconStyle(isDeleteHovered)}
            aria-label="Delete"
            onMouseEnter={() => setDeleteHovered(true)}
            onMouseLeave={() => setDeleteHovered(false)}
          >
            Delete
          </button>
        </div>
      </div>
      {entry.note && <p style={moodNoteStyle}>{entry.note}</p>}
      <div style={cardFooterStyle}>
        <span style={moodTimestampStyle}>{formattedDate}</span>
      </div>
    </div>
  );
};

export default MoodCard;