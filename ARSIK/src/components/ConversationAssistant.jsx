import React, { useState, useEffect, useRef } from 'react';
import { getConversationAI } from '../utils/conversationAI';
import { getTTSService } from '../utils/textToSpeech';

function ConversationAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(false);
  const conversationAI = useRef(getConversationAI());
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const tts = useRef(getTTSService());

  useEffect(() => {
    // Check if backend API is configured
    fetch('http://localhost:3001/api/ai-config')
      .then(res => res.json())
      .then(data => setApiConfigured(data.configured))
      .catch(() => setApiConfigured(false));

    // Load conversation history
    loadHistory();

    // Initialize speech recognition with always-on continuous mode
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'id-ID';
      recognitionRef.current.continuous = true; // Enable continuous listening
      recognitionRef.current.interimResults = true; // Get interim results

      let silenceTimer = null;
      let finalTranscript = '';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Update input with current transcript
        setInput((finalTranscript + interimTranscript).trim());

        // Clear previous timer
        if (silenceTimer) {
          clearTimeout(silenceTimer);
        }

        // Set new timer for 3 seconds of silence
        silenceTimer = setTimeout(() => {
          if (finalTranscript.trim()) {
            // Auto-send after 3 seconds of silence
            const trimmedInput = finalTranscript.trim();
            setInput(trimmedInput);
            
            // Trigger send
            setTimeout(() => {
              if (trimmedInput) {
                handleSendMessage(trimmedInput);
                finalTranscript = '';
                setInput('');
              }
            }, 100);
          }
        }, 3000);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        // Auto-restart on any error to keep microphone always on
        if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'not-allowed') {
          console.log('Recognition error, will restart...');
        }
        // Always keep listening flag true
        setTimeout(() => {
          if (recognitionRef.current && isListening) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.log('Already started');
            }
          }
        }, 1000);
      };

      recognitionRef.current.onend = () => {
        console.log('Recognition ended, restarting...');
        // Auto-restart to keep microphone always on (but not while speaking)
        if (isListening && !isSpeaking) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.log('Already started or error:', e);
          }
        }
      };

      // Auto-start listening when component mounts
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.log('Could not start recognition:', e);
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSpeaking]);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = () => {
    const history = conversationAI.current.conversationHistory;
    const formattedMessages = history.map(h => ({
      role: h.role,
      content: h.content,
      timestamp: h.timestamp,
      isRepeated: h.isRepeated?.repeated
    }));
    setMessages(formattedMessages);
  };

  const handleSendMessage = async (messageText) => {
    const userMessage = messageText || input.trim();
    if (!userMessage) return;

    setInput('');
    setIsLoading(true);

    // Add user message to UI
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);

    try {
      // Get AI response
      const response = await conversationAI.current.generateResponse(userMessage);

      if (response.success) {
        // Add AI response to UI
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString()
        }]);

        // Stop microphone and speak the response
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
            setIsSpeaking(true);
          } catch (e) {
            console.log('Error stopping recognition:', e);
          }
        }
        
        tts.current.speakWithCallback(response.response, () => {
          // Restart microphone after speaking
          setIsSpeaking(false);
          if (recognitionRef.current && isListening) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.log('Error restarting recognition:', e);
            }
          }
        });
      } else {
        // Show error
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString(),
          isError: true
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan. Mohon coba lagi.',
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  const toggleListening = () => {
    // Microphone is always on, this button is now just for visual feedback
    if (!recognitionRef.current) {
      alert('Speech recognition tidak didukung di browser ini');
      return;
    }

    // Do nothing - microphone is always active
    // Keep the button visible but it doesn't actually toggle anymore
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: '600px',
      border: '2px solid #4CAF50',
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: 'white'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        backgroundColor: '#4CAF50',
        color: 'white',
        fontSize: '18px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>💬</span>
        <span>Asisten Percakapan</span>
        {!apiConfigured && (
          <span style={{
            marginLeft: 'auto',
            fontSize: '14px',
            backgroundColor: '#ff9800',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            ⚙️ Perlu Konfigurasi
          </span>
        )}
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: '#f5f5f5'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            marginTop: '40px'
          }}>
            <p style={{ fontSize: '48px', marginBottom: '8px' }}>👋</p>
            <p>Mulai percakapan dengan mengetik atau berbicara</p>
            {!apiConfigured && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                textAlign: 'left'
              }}>
                <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚠️ API belum dikonfigurasi</p>
                <p style={{ fontSize: '14px' }}>Backend belum dikonfigurasi dengan GEMINI_API_KEY. Silakan hubungi administrator.</p>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: msg.role === 'user' ? '#2196F3' : (msg.isError ? '#f44336' : '#4CAF50'),
                color: 'white',
                position: 'relative'
              }}>
                {msg.isRepeated && (
                  <div style={{
                    fontSize: '12px',
                    opacity: 0.9,
                    marginBottom: '4px',
                    fontStyle: 'italic'
                  }}>
                    🔄 Pertanyaan berulang
                  </div>
                )}
                <div style={{ wordWrap: 'break-word' }}>{msg.content}</div>
                <div style={{
                  fontSize: '11px',
                  opacity: 0.7,
                  marginTop: '4px',
                  textAlign: 'right'
                }}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #ddd',
        backgroundColor: 'white',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-end'
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ketik pesan atau gunakan mikrofon..."
          disabled={isLoading || !apiConfigured}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            resize: 'none',
            minHeight: '50px',
            maxHeight: '100px',
            fontFamily: 'inherit'
          }}
        />
        
        <button
          disabled={true}
          style={{
            padding: '12px 16px',
            fontSize: '24px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'default',
            minWidth: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 1,
            animation: 'pulse 2s infinite'
          }}
          title="Mikrofon selalu aktif"
        >
          🔴
        </button>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
        `}</style>

        <button
          onClick={() => handleSendMessage(input)}
          disabled={isLoading || !input.trim() || !apiConfigured}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: (isLoading || !input.trim() || !apiConfigured) ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            minWidth: '80px',
            height: '50px',
            opacity: (isLoading || !input.trim() || !apiConfigured) ? 0.5 : 1
          }}
        >
          {isLoading ? '⏳' : '📤 Kirim'}
        </button>
      </div>
    </div>
  );
}

export default ConversationAssistant;
