// src/components/Chat/AIChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isCrisis?: boolean;
}

interface AIChatInterfaceProps {
  onCrisisDetected?: () => void;
}

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ onCrisisDetected }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your Mental Health Companion. How are you feeling today? Feel free to share what\'s on your mind.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 危机关键词检测
  const detectCrisis = (text: string): boolean => {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end my life', 'want to die',
      'self harm', 'hurt myself', 'no point living'
    ];
    const lowerText = text.toLowerCase();
    return crisisKeywords.some(keyword => lowerText.includes(keyword));
  };

  // 调用AI API（这里用Mock演示，可以替换成真实API）
  const callAIAPI = async (userMessage: string): Promise<string> => {
    // Mock AI响应
    // TODO: 替换成真实的OpenAI API或其他LLM API
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 基于关键词的智能回复
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('exam') || lowerMessage.includes('test') || lowerMessage.includes('study')) {
      return "I understand exams can be stressful. Here are some tips:\n\n" +
        "1. Take a 5-minute break every hour\n" +
        "2. Try deep breathing exercises\n" +
        "3. Break study material into smaller chunks\n" +
        "4. Get enough sleep (7-8 hours)\n\n" +
        "Would you like me to guide you through a quick relaxation exercise?";
    }
    
    if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('stress')) {
      return "It's okay to feel anxious. Let's work through this together:\n\n" +
        "• Acknowledge your feelings - they're valid\n" +
        "• Practice grounding: Name 5 things you can see around you\n" +
        "• Take slow, deep breaths\n" +
        "• Remember: This feeling is temporary\n\n" +
        "What specifically is making you feel this way?";
    }
    
    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
      return "I'm sorry you're feeling down. Remember, it's okay not to be okay. " +
        "Would you like to:\n\n" +
        "• Talk about what's bothering you?\n" +
        "• Try a mood-boosting activity?\n" +
        "• Connect with support resources?\n\n" +
        "I'm here to listen without judgment.";
    }
    
    if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('insomnia')) {
      return "Sleep problems are common with stress. Here's what might help:\n\n" +
        "• Maintain a regular sleep schedule\n" +
        "• Avoid screens 1 hour before bed\n" +
        "• Try progressive muscle relaxation\n" +
        "• Keep your room cool and dark\n\n" +
        "How long have you been having trouble sleeping?";
    }

    // 默认支持性回复
    return "Thank you for sharing that with me. I'm here to support you. " +
      "Can you tell me more about how you're feeling? " +
      "Understanding your emotions better will help me provide more personalized support.";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    // 检测危机
    const isCrisis = detectCrisis(inputValue);
    if (isCrisis) {
      userMessage.isCrisis = true;
    }

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // 如果检测到危机，显示紧急支持
    if (isCrisis) {
      const crisisMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: '⚠️ CRISIS SUPPORT ACTIVATED\n\n' +
          'I\'m concerned about your safety. Please contact:\n\n' +
          '🆘 Emergency: 000 (Australia)\n' +
          '📞 Lifeline: 13 11 14 (24/7)\n' +
          '💬 Beyond Blue: 1300 22 4636\n\n' +
          'You don\'t have to go through this alone. Would you like me to help you connect with immediate support?',
        timestamp: new Date(),
        isCrisis: true
      };
      setMessages(prev => [...prev, crisisMessage]);
      setIsLoading(false);
      onCrisisDetected?.();
      return;
    }

    try {
      const aiResponse = await callAIAPI(inputValue);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI API Error:', error);
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
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading || !inputValue.trim() ? 0.5 : 1,
    transition: 'all 0.2s',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>💬 AI Mental Health Companion</h2>
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
              {message.content}
            </div>
            <div style={timestampStyle}>
              {message.timestamp.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ ...messageStyle('assistant'), opacity: 0.6 }}>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={inputContainerStyle}>
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
          onClick={handleSendMessage}
          style={sendButtonStyle}
          disabled={isLoading || !inputValue.trim()}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default AIChatInterface;