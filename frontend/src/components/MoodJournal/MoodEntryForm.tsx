// src/components/MoodJournal/MoodEntryForm.tsx
import React, { useState } from 'react';
import { MoodEntry, getMoodColor } from '../../types/mood.types';

interface MoodEntryFormProps {
  onSubmit: (entry: Omit<MoodEntry, 'id' | 'userId' | 'timestamp'>) => void;
  onCancel?: () => void;
  initialData?: MoodEntry;
}

const MoodEntryForm: React.FC<MoodEntryFormProps> = ({ 
  onSubmit, 
  onCancel,
  initialData 
}) => {
  const [moodScore, setMoodScore] = useState(initialData?.moodScore || 5);
  const [note, setNote] = useState(initialData?.note || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({ moodScore, note });
      setMoodScore(5);
      setNote('');
    } catch (error) {
      console.error('Failed to submit mood entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMoodEmoji = (score: number): string => {
    if (score <= 2) return 'Very Low';
    if (score <= 4) return 'Low';
    if (score <= 6) return 'Neutral';
    if (score <= 8) return 'Good';
    return 'Great';
  };

  const formStyle: React.CSSProperties = {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '24px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  };

  const formGroupStyle: React.CSSProperties = {
    marginBottom: '24px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#333',
    fontSize: '16px',
  };

  const sliderContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '8px',
  };

  const sliderStyle: React.CSSProperties = {
    flex: 1,
    height: '8px',
    borderRadius: '4px',
    outline: 'none',
    WebkitAppearance: 'none',
    background: `linear-gradient(to right, ${getMoodColor(moodScore)} 0%, ${getMoodColor(moodScore)} ${moodScore * 10}%, #ddd ${moodScore * 10}%, #ddd 100%)`,
  };

  const scoreDisplayStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
    minWidth: '60px',
  };

  const scoreValueStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: getMoodColor(moodScore),
  };

  const scoreLabelStyle: React.CSSProperties = {
    fontSize: '16px',
    color: '#666',
  };

  const scaleLabelsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#666',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const characterCountStyle: React.CSSProperties = {
    textAlign: 'right',
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  };

  const formActionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  };

  const btnBaseStyle: React.CSSProperties = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: isSubmitting ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: isSubmitting ? 0.6 : 1,
  };

  const btnPrimaryStyle: React.CSSProperties = {
    ...btnBaseStyle,
    background: '#3b82f6',
    color: 'white',
  };

  const btnSecondaryStyle: React.CSSProperties = {
    ...btnBaseStyle,
    background: '#e5e7eb',
    color: '#374151',
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <div style={formGroupStyle}>
        <label htmlFor="mood-score" style={labelStyle}>
          How are you feeling? {getMoodEmoji(moodScore)}
        </label>
        
        <div style={sliderContainerStyle}>
          <input
            type="range"
            id="mood-score"
            min="1"
            max="10"
            value={moodScore}
            onChange={(e) => setMoodScore(Number(e.target.value))}
            style={sliderStyle}
            aria-label="Mood score from 1 to 10"
          />
          <div style={scoreDisplayStyle}>
            <span style={scoreValueStyle}>{moodScore}</span>
            <span style={scoreLabelStyle}>/10</span>
          </div>
        </div>

        <div style={scaleLabelsStyle}>
          <span>Very Low</span>
          <span>Medium</span>
          <span>Very High</span>
        </div>
      </div>

      <div style={formGroupStyle}>
        <label htmlFor="mood-note" style={labelStyle}>
          Notes (Optional)
        </label>
        <textarea
          id="mood-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's on your mind? (optional)"
          rows={4}
          maxLength={500}
          aria-label="Mood notes"
          style={textareaStyle}
        />
        <div style={characterCountStyle}>
          {note.length}/500
        </div>
      </div>

      <div style={formActionsStyle}>
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            style={btnSecondaryStyle}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          style={btnPrimaryStyle}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Entry'}
        </button>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 3px solid ${getMoodColor(moodScore)};
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 3px solid ${getMoodColor(moodScore)};
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          border: none;
        }

        textarea:focus {
          outline: none;
          border-color: #3b82f6 !important;
        }

        button:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        @media (max-width: 640px) {
          form {
            padding: 16px !important;
          }
          
          .form-actions {
            flex-direction: column !important;
          }
          
          button {
            width: 100% !important;
          }
        }
      `}</style>
    </form>
  );
};

export default MoodEntryForm