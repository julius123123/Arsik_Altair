// Text-to-Speech utility for announcing detected faces
class TextToSpeechService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.announcedFaces = new Set(); // Track which faces have been announced
    this.lastAnnouncementTime = new Map(); // Track last announcement time per person
    this.minAnnouncementInterval = 30000; // 30 seconds minimum between announcements for same person
    this.initVoice();
  }

  initVoice() {
    // Wait for voices to be loaded
    const setVoice = () => {
      const voices = this.synth.getVoices();
      
      // Try to find Indonesian voice first
      this.voice = voices.find(voice => voice.lang.startsWith('id-')) ||
                   voices.find(voice => voice.lang.startsWith('id')) ||
                   voices[0]; // Fallback to first available voice
      
      if (this.voice) {
        console.log('TTS Voice selected:', this.voice.name, this.voice.lang);
      }
    };

    // Chrome loads voices asynchronously
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = setVoice;
    }
    
    // Try to set voice immediately (works in Firefox)
    setVoice();
  }

  speak(text, options = {}) {
    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply voice if available
    if (this.voice) {
      utterance.voice = this.voice;
    }
    
    // Set language to Indonesian
    utterance.lang = options.lang || 'id-ID';
    utterance.rate = options.rate || 1.0; // Speaking speed
    utterance.pitch = options.pitch || 1.0; // Voice pitch
    utterance.volume = options.volume || 1.0; // Volume (0 to 1)

    // Event handlers
    utterance.onstart = () => {
      console.log('TTS started:', text);
    };

    utterance.onend = () => {
      console.log('TTS ended');
    };

    utterance.onerror = (event) => {
      console.error('TTS error:', event.error);
    };

    this.synth.speak(utterance);
  }

  speakWithCallback(text, onEndCallback, options = {}) {
    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply voice if available
    if (this.voice) {
      utterance.voice = this.voice;
    }
    
    // Set language to Indonesian
    utterance.lang = options.lang || 'id-ID';
    utterance.rate = options.rate || 1.0; // Speaking speed
    utterance.pitch = options.pitch || 1.0; // Voice pitch
    utterance.volume = options.volume || 1.0; // Volume (0 to 1)

    // Event handlers
    utterance.onstart = () => {
      console.log('TTS started:', text);
    };

    utterance.onend = () => {
      console.log('TTS ended');
      if (onEndCallback) {
        onEndCallback();
      }
    };

    utterance.onerror = (event) => {
      console.error('TTS error:', event.error);
      // Call callback even on error to restart microphone
      if (onEndCallback) {
        onEndCallback();
      }
    };

    this.synth.speak(utterance);
  }

  announceDetectedPerson(name, relation) {
    const personKey = `${name}_${relation}`;
    const now = Date.now();
    const lastTime = this.lastAnnouncementTime.get(personKey);

    // Check if we've announced this person recently
    if (lastTime && (now - lastTime) < this.minAnnouncementInterval) {
      console.log(`Skipping announcement for ${name} (announced ${Math.round((now - lastTime) / 1000)}s ago)`);
      return false;
    }

    // Announce in Indonesian
    const message = `${name}, ${relation} Anda`;
    console.log('Announcing:', message);
    
    this.speak(message, {
      rate: 0.9, // Slightly slower for clarity
      pitch: 1.0,
      volume: 1.0,
    });

    // Mark as announced
    this.announcedFaces.add(personKey);
    this.lastAnnouncementTime.set(personKey, now);
    
    return true;
  }

  // Reset announcements (e.g., when detection is stopped/restarted)
  reset() {
    this.announcedFaces.clear();
    this.lastAnnouncementTime.clear();
    this.synth.cancel();
    console.log('TTS announcements reset');
  }

  // Manually clear announcement history for a specific person
  clearPersonAnnouncement(name, relation) {
    const personKey = `${name}_${relation}`;
    this.announcedFaces.delete(personKey);
    this.lastAnnouncementTime.delete(personKey);
  }

  // Play notification bell sound
  playBellSound() {
    // Create audio context for bell sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create bell sound using oscillators (3-tone bell)
    const playTone = (frequency, startTime, duration) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      // Envelope for bell sound (quick attack, longer decay)
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    // Bell sound: Three harmonious tones
    const now = audioContext.currentTime;
    playTone(800, now, 0.5);        // Main tone
    playTone(1000, now + 0.1, 0.4); // Second tone
    playTone(1200, now + 0.2, 0.3); // Third tone
    
    console.log('🔔 Bell sound played');
  }

  // Stop any ongoing speech
  stop() {
    this.synth.cancel();
  }

  // Check if TTS is available
  static isSupported() {
    return 'speechSynthesis' in window;
  }
}

// Singleton instance
let ttsInstance = null;

export const getTTSService = () => {
  if (!ttsInstance) {
    ttsInstance = new TextToSpeechService();
  }
  return ttsInstance;
};

export default TextToSpeechService;
