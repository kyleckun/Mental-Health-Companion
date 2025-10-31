// src/components/Chat/AIChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { authService } from '../../services/authService';
import JournalAnalyzer from './JournalAnalyzer';
import type { MoodEntry } from '../../types/mood.types';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isCrisis?: boolean;
  isStreaming?: boolean;
}

interface AIChatInterfaceProps {
  onCrisisDetected?: () => void;
}

// Use empty string for relative URLs - Vite proxy will forward to backend
const API_BASE_URL = '';

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ onCrisisDetected }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI Mental Health Companion. How are you feeling today? Feel free to share what\'s on your mind.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showJournalAnalyzer, setShowJournalAnalyzer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Crisis keyword detection
  const detectCrisis = (text: string): boolean => {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end my life', 'want to die',
      'self harm', 'hurt myself', 'no point living'
    ];
    const lowerText = text.toLowerCase();
    return crisisKeywords.some(keyword => lowerText.includes(keyword));
  };

  // Get authentication token using authService
  const getAuthToken = (): string | null => {
    return authService.getToken();
  };

  // Call AI API with streaming support
  const callAIAPIStream = async (userMessage: string, allMessages: Message[]): Promise<void> => {
    // Create abort controller for request cancellation
    abortControllerRef.current = new AbortController();

    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }

    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        messages: allMessages.map(msg => ({ role: msg.role, content: msg.content }))
      }),
      signal: abortControllerRef.current.signal
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear auth and redirect to login
        localStorage.removeItem('auth');
        window.location.href = '/login';
        throw new Error('Unauthorized - Please login again');
      }
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get AI response');
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Create placeholder message for streaming
    const streamingMessageId = (Date.now() + 1).toString();
    const streamingMessage: Message = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    setMessages(prev => [...prev, streamingMessage]);

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'metadata' && data.decision) {
                // Handle decision metadata (e.g., crisis detection)
                if (data.decision.next_action === 'crisis_flow') {
                  onCrisisDetected?.();
                }
              } else if (data.type === 'content') {
                // Update streaming message content
                setMessages(prev => prev.map(msg =>
                  msg.id === streamingMessageId
                    ? { ...msg, content: msg.content + data.content }
                    : msg
                ));
              } else if (data.type === 'done') {
                // Mark streaming as complete
                setMessages(prev => prev.map(msg =>
                  msg.id === streamingMessageId
                    ? { ...msg, isStreaming: false }
                    : msg
                ));
              } else if (data.type === 'error') {
                throw new Error(data.content);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      abortControllerRef.current = null;
    }
  };

  // Handle journal analysis
  const handleJournalAnalysis = (entries: MoodEntry[], timeRange: string) => {
    if (entries.length === 0) return;

    // Format entries for AI analysis
    const entriesText = entries.map(entry =>
      `Date: ${new Date(entry.timestamp).toLocaleDateString()} ${new Date(entry.timestamp).toLocaleTimeString()}\n` +
      `Mood Score: ${entry.moodScore}/10\n` +
      `Note: ${entry.note || 'No note provided'}\n`
    ).join('\n---\n');

    const analysisPrompt = `I'd like you to analyze my mood journal entries from ${timeRange}. Here are my ${entries.length} entries:\n\n${entriesText}\n\nPlease provide:\n1. Overall emotional patterns and trends\n2. Insights about my mood fluctuations\n3. Potential triggers or positive influences\n4. Personalized suggestions for improving my mental wellbeing`;

    // Add user message with journal data
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: analysisPrompt,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    // Call AI to analyze
    callAIAPIStream(analysisPrompt, updatedMessages)
      .catch((error: any) => {
        console.error('AI Analysis Error:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I apologize, but I encountered an error while analyzing your journal. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Use streaming API for all messages
      await callAIAPIStream(inputValue, updatedMessages);
    } catch (error: any) {
      console.error('AI API Error:', error);

      // Don't show error if request was aborted by user
      if (error.name === 'AbortError') {
        console.log('Request cancelled by user');
        return;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, I\'m having trouble responding right now. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel ongoing request
  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '600px',
    maxWidth: '800px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textAlign: 'center',
  };

  const messagesContainerStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    backgroundColor: '#f9fafb',
  };

  const messageStyle = (role: string, isCrisis?: boolean): React.CSSProperties => ({
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '12px',
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    background: isCrisis ? '#fee2e2' : role === 'user' ? '#3b82f6' : 'white',
    color: isCrisis ? '#991b1b' : role === 'user' ? 'white' : '#374151',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  });

  const timestampStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '4px',
  };

  const inputContainerStyle: React.CSSProperties = {
    padding: '16px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    background: 'white',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    resize: 'none',
  };

  const sendButtonStyle: React.CSSProperties = {
    padding: '12px 24px',
    background: isLoading ? '#ef4444' : '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: 'pointer',
    opacity: !isLoading && !inputValue.trim() ? 0.5 : 1,
    transition: 'all 0.2s',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>AI Mental Health Companion</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
          Available 24/7 for support
        </p>
      </div>

      <div style={messagesContainerStyle}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={messageStyle(message.role, message.isCrisis)}>
              {message.content || (message.isStreaming ? '...' : '')}
            </div>
            <div style={timestampStyle}>
              {message.timestamp.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {message.isStreaming && ' (streaming...)'}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={inputContainerStyle}>
        <button
          onClick={() => setShowJournalAnalyzer(true)}
          style={{
            padding: '10px 16px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            marginRight: '8px',
            whiteSpace: 'nowrap',
          }}
          disabled={isLoading}
        >
          📊 Analyze Journal
        </button>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Press Enter to send)"
          style={inputStyle}
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={isLoading ? handleCancelRequest : handleSendMessage}
          style={sendButtonStyle}
          disabled={!isLoading && !inputValue.trim()}
        >
          {isLoading ? 'Cancel' : 'Send'}
        </button>
      </div>

      {/* Journal Analyzer Modal */}
      <JournalAnalyzer
        isOpen={showJournalAnalyzer}
        onClose={() => setShowJournalAnalyzer(false)}
        onAnalyze={handleJournalAnalysis}
      />
    </div>
  );
};

export default AIChatInterface;