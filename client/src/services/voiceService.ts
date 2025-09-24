interface VoiceOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
}

interface VoiceService {
  isSupported: () => boolean;
  speak: (text: string, options?: VoiceOptions) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: () => boolean;
  isPaused: () => boolean;
  getVoices: () => SpeechSynthesisVoice[];
  getLanguageVoices: (language: string) => SpeechSynthesisVoice[];
}

class VoiceServiceImpl implements VoiceService {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isCurrentlySpeaking = false;
  private isCurrentlyPaused = false;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  async speak(text: string, options: VoiceOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Speech synthesis is not supported in this browser');
    }

    // Stop any current speech
    this.stop();

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;

        // Set voice based on options or language
        if (options.voice) {
          utterance.voice = options.voice;
        } else {
          const voices = this.getVoices();
          const languageVoices = this.getLanguageVoices(options.language || 'en');
          const selectedVoice = languageVoices.length > 0 ? languageVoices[0] : voices[0];
          
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }

        // Set speech options
        utterance.rate = options.rate || 0.8;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;

        // Event handlers
        utterance.onstart = () => {
          this.isCurrentlySpeaking = true;
          this.isCurrentlyPaused = false;
        };

        utterance.onend = () => {
          this.isCurrentlySpeaking = false;
          this.isCurrentlyPaused = false;
          this.currentUtterance = null;
          resolve();
        };

        utterance.onerror = (event) => {
          this.isCurrentlySpeaking = false;
          this.isCurrentlyPaused = false;
          this.currentUtterance = null;
          reject(new Error(`Speech synthesis error: ${event.error}`));
        };

        // Start speaking
        this.synth.speak(utterance);
      } catch (error) {
        reject(error);
      }
    });
  }

  stop(): void {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.isCurrentlySpeaking = false;
    this.isCurrentlyPaused = false;
    this.currentUtterance = null;
  }

  pause(): void {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.isCurrentlyPaused = true;
    }
  }

  resume(): void {
    if (this.synth.paused) {
      this.synth.resume();
      this.isCurrentlyPaused = false;
    }
  }

  isSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  isPaused(): boolean {
    return this.isCurrentlyPaused;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  getLanguageVoices(language: string): SpeechSynthesisVoice[] {
    const voices = this.getVoices();
    return voices.filter(voice => 
      voice.lang.startsWith(language) || 
      voice.lang.includes(language)
    );
  }

  // Helper method to get language code for speech synthesis (Indian English, Hindi, Punjabi)
  getLanguageCode(language: 'en' | 'hi' | 'pa'): string {
    const languageMap = {
      'en': 'en-IN', // Indian English
      'hi': 'hi-IN', // Hindi
      'pa': 'pa-IN'  // Punjabi
    };
    return languageMap[language] || 'en-IN';
  }

  // Helper method to get all possible language codes for a language (Indian variants only)
  getLanguageVariants(language: 'en' | 'hi' | 'pa'): string[] {
    const variants = {
      'en': ['en-IN', 'en', 'English (India)', 'English', 'Indian English'],
      'hi': ['hi-IN', 'hi', 'Hindi'],
      'pa': ['pa-IN', 'pa', 'Punjabi', 'pan']
    };
    return variants[language] || ['en-IN'];
  }

  // Helper method to check if a voice is for the specific language (Indian English, Hindi, Punjabi only)
  isVoiceForLanguage(voice: SpeechSynthesisVoice, language: 'en' | 'hi' | 'pa'): boolean {
    const voiceLang = voice.lang.toLowerCase();
    const voiceName = voice.name.toLowerCase();
    
    switch (language) {
      case 'en':
        // Only Indian English voices
        return (voiceLang.includes('en-in') || voiceLang.includes('english (india)')) ||
               (voiceLang.includes('en') && (voiceName.includes('india') || voiceName.includes('indian')));
      case 'hi':
        // Only Hindi voices
        return voiceLang.includes('hi') || voiceLang.includes('hindi');
      case 'pa':
        // Only Punjabi voices
        return voiceLang.includes('pa') || voiceLang.includes('punjabi') || voiceLang.includes('pan');
      default:
        return false;
    }
  }

  // Helper method to clean HTML content for speech
  cleanTextForSpeech(htmlContent: string): string {
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    
    // Remove script and style elements
    const scripts = div.querySelectorAll('script, style');
    scripts.forEach(el => el.remove());
    
    // Get text content and clean it
    let text = div.textContent || div.innerText || '';
    
    // Remove extra whitespace and normalize
    text = text.replace(/\s+/g, ' ').trim();
    
    // Remove common HTML artifacts
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    
    return text;
  }
}

// Create singleton instance
export const voiceService = new VoiceServiceImpl();

// Export types for use in components
export type { VoiceOptions, VoiceService };
