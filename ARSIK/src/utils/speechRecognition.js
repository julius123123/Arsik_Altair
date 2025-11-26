// Speech recognition utilities using Web Speech API

export class SpeechListener {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResult = null;
    this.transcript = '';
  }

  initialize() {
    console.log('Checking for speech recognition support...');
    console.log('webkitSpeechRecognition:', 'webkitSpeechRecognition' in window);
    console.log('SpeechRecognition:', 'SpeechRecognition' in window);
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      console.error('Browser:', navigator.userAgent);
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    console.log('Initializing SpeechRecognition...');
    
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'id-ID'; // Bahasa Indonesia
      console.log('SpeechRecognition initialized successfully with language: id-ID');
    } catch (error) {
      console.error('Failed to initialize SpeechRecognition:', error);
      return false;
    }

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.transcript += finalTranscript;
        console.log(this.transcript);
        this.analyzeTranscript(finalTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        console.error('Microphone permission denied. Please allow microphone access.');
      } else if (event.error === 'no-speech') {
        console.log('No speech detected, continuing to listen...');
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Restart if it stops unexpectedly
        this.recognition.start();
      }
    };

    return true;
  }

  start(onResultCallback) {
    // console.log('start() called');
    
    // Prevent starting if already listening
    if (this.isListening) {
      console.log('Speech recognition already active, skipping start');
      return true; // Return true since it's technically running
    }
    
    if (!this.recognition) {
      console.log('Recognition not initialized, initializing now...');
      if (!this.initialize()) {
        console.error('Failed to initialize speech recognition');
        return false;
      }
    }

    this.onResult = onResultCallback;
    this.transcript = '';
    this.isListening = true;
    
    try {
      console.log('Starting speech recognition...');
      this.recognition.start();
      console.log('Speech recognition started successfully');
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      console.error('Error details:', error.message, error.name);
      this.isListening = false; // Reset flag on error
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  analyzeTranscript(text) {
    const extracted = this.extractNameAndRelation(text.toLowerCase());
    if (extracted && this.onResult) {
      this.onResult(extracted);
    }
  }

  extractNameAndRelation(text) {
    // Pattern matching for Indonesian phrases (self-introduction)
    const patterns = [
      // "Nama saya [name], [relation] Anda" or "Nama saya [name], saya [relation] Anda"
      /nama\s+saya\s+(\w+),?\s+(?:saya\s+)?(\w+)\s+(?:anda|bapak|ibu)/i,
      // "Saya [name], [relation] Anda"
      /saya\s+(\w+),?\s+(\w+)\s+(?:anda|bapak|ibu)/i,
      // "Saya [relation] Anda, nama saya [name]"
      /saya\s+(\w+)\s+(?:anda|bapak|ibu),?\s+nama\s+saya\s+(\w+)/i,
      // "Perkenalkan, nama saya [name], [relation] Anda"
      /perkenalkan,?\s+nama\s+saya\s+(\w+),?\s+(\w+)\s+(?:anda|bapak|ibu)/i,
      // "Kenalkan saya [name], [relation] Anda"
      /kenalkan\s+saya\s+(\w+),?\s+(\w+)\s+(?:anda|bapak|ibu)/i,
      // "Saya [name], saya [relation] Anda"
      /saya\s+(\w+),?\s+saya\s+(\w+)\s+(?:anda|bapak|ibu)/i,
      // "Nama saya [name], [relation] bapak/ibu"
      /nama\s+saya\s+(\w+),?\s+(\w+)\s+(?:bapak|ibu)/i,
      
      // English patterns (backup)
      /my name is (\w+),?\s+(?:i am|i'm)?\s+your\s+(\w+)/i,
      /i am (\w+),?\s+your\s+(\w+)/i,
      /i'm (\w+),?\s+your\s+(\w+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        // Indonesian relations
        const commonRelations = [
          // Indonesian
          'istri', 'suami', 'anak', 'ibu', 'ayah', 'bapak', 'mama', 'papa',
          'kakak', 'adik', 'saudara', 'teman', 'tetangga', 'cucu', 
          'keponakan', 'sepupu', 'paman', 'om', 'bibi', 'tante', 'menantu',
          'mertua', 'kakek', 'nenek',
          // English
          'wife', 'husband', 'son', 'daughter', 'mother', 'father', 
          'sister', 'brother', 'friend', 'neighbor', 'grandson', 
          'granddaughter', 'nephew', 'niece', 'cousin', 'uncle', 'aunt',
          'grandpa', 'grandma'
        ];
        
        let name, relation;
        // Check which capture group contains the relation
        if (commonRelations.includes(match[1].toLowerCase())) {
          // Pattern: "Saya [relation] Anda, nama saya [name]"
          relation = match[1];
          name = match[2];
        } else if (commonRelations.includes(match[2].toLowerCase())) {
          // Pattern: "Nama saya [name], [relation] Anda"
          name = match[1];
          relation = match[2];
        } else {
          // Default: assume first is name, second is relation
          name = match[1];
          relation = match[2];
        }

        // Capitalize first letter
        name = name.charAt(0).toUpperCase() + name.slice(1);
        relation = relation.charAt(0).toUpperCase() + relation.slice(1);

        return { name, relation, confidence: 'medium' };
      }
    }

    return null;
  }

  getFullTranscript() {
    return this.transcript;
  }
}
