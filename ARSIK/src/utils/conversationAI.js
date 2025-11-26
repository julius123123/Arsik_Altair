// Conversation Context AI for Dementia Patient Memory Aid
// Uses LLM to provide context-aware responses and track conversation history

class ConversationAI {
  constructor() {
    this.conversationHistory = [];
    this.patientProfile = this.loadPatientProfile();
    this.maxHistoryLength = 20; // Keep last 20 exchanges
    this.patientId = this.getPatientId();
    this.geminiEndpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent';
    
    // Load API key from backend (env)
    this.syncConfigFromBackend();
  }

  getPatientId() {
    let patientId = localStorage.getItem('arsik_patient_id');
    if (!patientId) {
      patientId = `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('arsik_patient_id', patientId);
    }
    return patientId;
  }

  async syncConfigFromBackend() {
    try {
      const response = await fetch(`http://localhost:3001/api/patient-profile/${this.patientId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          this.patientProfile = { ...this.patientProfile, ...data.profile };
          localStorage.setItem('arsik_patient_profile', JSON.stringify(this.patientProfile));
          console.log('✅ Patient profile loaded from backend:', this.patientProfile);
        }
      }
    } catch (error) {
      console.error('Error syncing patient profile:', error);
    }
  }

  loadPatientProfile() {
    const profile = localStorage.getItem('arsik_patient_profile');
    return profile ? JSON.parse(profile) : {
      name: 'Patient',
      age: null,
      interests: [],
      familyMembers: [],
      routines: [],
      commonQuestions: []
    };
  }

  updatePatientProfile(updates) {
    this.patientProfile = { ...this.patientProfile, ...updates };
    localStorage.setItem('arsik_patient_profile', JSON.stringify(this.patientProfile));
  }

  addToHistory(role, content, metadata) {
    const entry = {
      role,
      content,
      timestamp: new Date().toISOString()
    };
    
    if (metadata) {
      Object.assign(entry, metadata);
    }
    
    this.conversationHistory.push(entry);

    // Keep only recent history
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory.shift();
    }

    // Save to localStorage
    this.saveHistory();
  }

  saveHistory() {
    const recentHistory = this.conversationHistory.slice(-10); // Save last 10 only
    localStorage.setItem('arsik_conversation_history', JSON.stringify(recentHistory));
  }

  loadHistory() {
    const history = localStorage.getItem('arsik_conversation_history');
    if (history) {
      this.conversationHistory = JSON.parse(history);
    }
  }

  async getSystemPrompt() {
    // Fetch patient routines
    let routineInfo = '';
    try {
      const response = await fetch(`http://localhost:3001/api/routines/${this.patientId}`);
      if (response.ok) {
        const data = await response.json();
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().slice(0, 5);

        // Filter today's routines
        const todayRoutines = data.routines.filter(r => {
          if (r.dateTime) {
            return r.dateTime.startsWith(today);
          }
          return true; // Include routines with startTime/endTime
        });

        // Separate completed and upcoming
        const completed = [];
        const upcoming = [];

        todayRoutines.forEach(r => {
          if (r.endTime && currentTime > r.endTime) {
            completed.push(r);
          } else if (r.startTime) {
            upcoming.push(r);
          }
        });

        if (completed.length > 0) {
          routineInfo += '\n\nRUTINITAS YANG SUDAH DILAKUKAN HARI INI:\n';
          completed.forEach(r => {
            routineInfo += `- ${r.activityName} (${r.startTime} - ${r.endTime})\n`;
          });
        }

        if (upcoming.length > 0) {
          routineInfo += '\n\nRUTINITAS YANG AKAN DATANG:\n';
          upcoming.forEach(r => {
            routineInfo += `- ${r.activityName} (${r.startTime}${r.endTime ? ' - ' + r.endTime : ''})\n`;
          });
        }
      }
    } catch (error) {
      console.error('Error fetching routines:', error);
    }

    return `You are a compassionate AI assistant helping a dementia patient. Your role is to:

1. MEMORY SUPPORT: Help the patient remember recent conversations, names, and events
2. GENTLE REMINDERS: When they repeat questions, acknowledge and gently remind them
3. CONTEXT AWARENESS: Reference what was discussed earlier in the conversation
4. EMOTIONAL SUPPORT: Be patient, warm, and reassuring
5. CLARITY: Use simple, clear language. Avoid complex sentences
6. ORIENTATION: Help them with time, place, and person orientation
7. ROUTINE AWARENESS: Inform patient about their completed and upcoming activities

PATIENT PROFILE:
- Name: ${this.patientProfile.name}
- Family: ${this.patientProfile.familyMembers.join(', ') || 'Not specified'}
- Interests: ${this.patientProfile.interests.join(', ') || 'Not specified'}

${routineInfo}

IMPORTANT RULES:
- If they ask the same question multiple times, acknowledge it warmly: "As I mentioned a moment ago..."
- Always be encouraging and positive
- Keep responses SHORT (2-3 sentences max)
- Use their name occasionally to maintain personal connection
- Reference family members by name when relevant
- Suggest activities based on their interests
- When asked about activities, mention completed routines and remind about upcoming ones
- Praise them for completing activities

Current time: ${new Date().toLocaleString('id-ID', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}`;
  }

  async generateResponse(userMessage) {
    // Check for repeated questions
    const isRepeated = this.checkRepeatedQuestion(userMessage);

    // Add user message to history
    this.addToHistory('user', userMessage, isRepeated);

    try {
      const systemPrompt = await this.getSystemPrompt();
      const conversationMessages = this.conversationHistory.slice(-8).map(h => ({
        role: h.role,
        content: h.content
      }));

      // Call backend which will handle the Gemini API call
      const response = await fetch('http://localhost:3001/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: this.patientId,
          systemPrompt,
          messages: conversationMessages
        })
      });

      if (!response.ok) {
        throw new Error('Backend error');
      }

      const data = await response.json();

      if (data.success) {
        // Add assistant response to history
        this.addToHistory('assistant', data.response);
        return data;
      } else {
        return {
          success: false,
          error: data.error,
          response: data.response || 'Maaf, terjadi kesalahan.'
        };
      }
    } catch (error) {
      console.error('Error generating response:', error);
      return {
        success: false,
        error: error.message,
        response: 'Maaf, saya mengalami kesulitan. Mohon coba lagi.'
      };
    }
  }

  checkRepeatedQuestion(userMessage) {
    // Check if similar question was asked in last 5 messages
    const recentMessages = this.conversationHistory.slice(-10).filter(h => h.role === 'user');
    
    for (const msg of recentMessages) {
      const similarity = this.calculateSimilarity(userMessage.toLowerCase(), msg.content.toLowerCase());
      if (similarity > 0.7) {
        const timeDiff = new Date() - new Date(msg.timestamp);
        const minutesAgo = Math.round(timeDiff / 60000);
        return { repeated: true, minutesAgo, originalMessage: msg.content };
      }
    }

    return { repeated: false };
  }

  calculateSimilarity(str1, str2) {
    // Simple word-based similarity
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  // Generate conversation summary
  async generateSummary() {
    if (this.conversationHistory.length === 0) {
      return 'No conversations yet.';
    }

    const summary = {
      totalExchanges: Math.floor(this.conversationHistory.length / 2),
      duration: this.getConversationDuration(),
      topics: this.extractTopics(),
      repeatedQuestions: this.findRepeatedQuestions(),
      lastInteraction: this.conversationHistory[this.conversationHistory.length - 1]?.timestamp
    };

    return summary;
  }

  getConversationDuration() {
    if (this.conversationHistory.length < 2) return '0 minutes';
    
    const start = new Date(this.conversationHistory[0].timestamp);
    const end = new Date(this.conversationHistory[this.conversationHistory.length - 1].timestamp);
    const minutes = Math.round((end - start) / 60000);
    
    return `${minutes} minutes`;
  }

  extractTopics() {
    // Simple keyword extraction
    const keywords = new Map();
    
    this.conversationHistory.forEach(h => {
      const words = h.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 4) { // Only meaningful words
          keywords.set(word, (keywords.get(word) || 0) + 1);
        }
      });
    });

    // Get top 5 topics
    return Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  findRepeatedQuestions() {
    const questions = this.conversationHistory.filter(h => 
      h.role === 'user' && h.isRepeated?.repeated
    );
    return questions.length;
  }

  clearHistory() {
    this.conversationHistory = [];
    localStorage.removeItem('arsik_conversation_history');
    console.log('Conversation history cleared');
  }

  // Export conversation for caregiver review
  exportConversation() {
    return {
      patientProfile: this.patientProfile,
      history: this.conversationHistory,
      summary: this.generateSummary(),
      exportedAt: new Date().toISOString()
    };
  }
}

// Singleton instance
let aiInstance = null;

export const getConversationAI = () => {
  if (!aiInstance) {
    aiInstance = new ConversationAI();
    aiInstance.loadHistory();
  }
  return aiInstance;
};

export default ConversationAI;
