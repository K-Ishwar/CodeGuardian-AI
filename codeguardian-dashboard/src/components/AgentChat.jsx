import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../api/client';

export default function AgentChat({ reviewId, isAnalyzed }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Reset chat when PR changes
  useEffect(() => {
    setMessages([]);
    setIsOpen(false);
  }, [reviewId]);

  if (!isAnalyzed) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user', content: inputValue.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await sendChatMessage(reviewId, newMessages);
      setMessages([...newMessages, { role: 'agent', content: response.reply }]);
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'agent', content: '❌ Sorry, I encountered an error answering that.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '28px',
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          border: '1px solid rgba(147, 197, 253, 0.4)',
          boxShadow: '0 4px 24px rgba(59, 130, 246, 0.5)',
          cursor: 'pointer',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          backdropFilter: 'blur(8px)',
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)',
        }}
        title="Chat with AI"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '380px',
            height: '500px',
            maxHeight: 'calc(100vh - 120px)',
            backgroundColor: 'var(--color-glass-panel)',
            border: '1px solid var(--color-glass-border-strong)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9998,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--color-glass-border)',
              backgroundColor: 'rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{ fontSize: '1.2rem' }}>🤖</div>
            <div>
              <div style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>CodeGuardian AI</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>Ask questions about this PR</div>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.length === 0 && (
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
                Ask me anything about the issues I found, or ask for refactoring suggestions!
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.role === 'user' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: msg.role === 'user' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  maxWidth: '85%',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center'
                }}
              >
                <span className="dot-pulse">●</span>
                <span className="dot-pulse" style={{ animationDelay: '0.2s' }}>●</span>
                <span className="dot-pulse" style={{ animationDelay: '0.4s' }}>●</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '16px',
              borderTop: '1px solid var(--color-glass-border)',
              display: 'flex',
              gap: '8px',
              backgroundColor: 'rgba(0,0,0,0.1)'
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              disabled={isTyping}
              style={{
                flex: 1,
                backgroundColor: 'var(--color-glass-input)',
                border: '1px solid var(--color-glass-border-strong)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (isTyping || !inputValue.trim()) ? 'not-allowed' : 'pointer',
                opacity: (isTyping || !inputValue.trim()) ? 0.5 : 1,
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}
      <style>{`
        .dot-pulse {
          animation: pulse-dot 1.4s infinite ease-in-out both;
        }
        @keyframes pulse-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
