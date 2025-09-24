import React, { useState, useEffect } from 'react';
import { Button, Dropdown, DropdownButton } from 'react-bootstrap';
import { voiceService } from '../../services/voiceService';

interface SimpleVoiceControlProps {
  text: string;
  language: 'en' | 'hi' | 'pa';
  className?: string;
}

const SimpleVoiceControl: React.FC<SimpleVoiceControlProps> = ({ 
  text, 
  language, 
  className = ''
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    setIsSupported(voiceService.isSupported());
    
    if (voiceService.isSupported()) {
      const loadVoices = () => {
        const availableVoices = voiceService.getVoices();
        setVoices(availableVoices);
        
        // Set default voice for the specific language (Indian English, Hindi, or Punjabi)
        const languageVoices = availableVoices.filter(voice => 
          voiceService.isVoiceForLanguage(voice, language)
        );
        
        // Select the first voice for the language, or null if no language-specific voice available
        const selectedVoice = languageVoices.length > 0 ? languageVoices[0] : null;
        setSelectedVoice(selectedVoice);
      };

      loadVoices();
      if (voices.length === 0) {
        const timer = setTimeout(loadVoices, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [language, text]); // Also re-run when text changes (language translation)

  const handleSpeak = async () => {
    if (!text.trim() || !isSupported) return;

    // Check if we have a voice for the selected language
    if (!selectedVoice) {
      alert(`No ${language === 'en' ? 'Indian English' : language === 'hi' ? 'Hindi' : 'Punjabi'} voice available. Please install language voices for this language.`);
      return;
    }

    try {
      if (isSpeaking) {
        voiceService.stop();
        setIsSpeaking(false);
      } else {
        const cleanText = voiceService.cleanTextForSpeech(text);
        const options = {
          language: voiceService.getLanguageCode(language),
          rate: 0.8,
          volume: 1,
          pitch: 1,
          voice: selectedVoice
        };

        await voiceService.speak(cleanText, options);
      }
    } catch (error) {
      console.error('Voice error:', error);
    }
  };

  // Update speaking state
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpeaking(voiceService.isSpeaking());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (!isSupported) {
    return null;
  }

  return (
    <div className={`simple-voice-control ${className}`}>
      <Button
        variant={isSpeaking ? "danger" : "outline-primary"}
        onClick={handleSpeak}
        disabled={!text.trim() || !selectedVoice}
        size="sm"
        className="me-2"
        title={!selectedVoice ? `No ${language === 'en' ? 'Indian English' : language === 'hi' ? 'Hindi' : 'Punjabi'} voice available` : ''}
      >
        <i className={`fas ${isSpeaking ? 'fa-stop' : 'fa-volume-up'} me-1`}></i>
        {isSpeaking ? 'Stop' : 'Listen'}
      </Button>
      
      {voices.length > 0 && (
        <DropdownButton
          id="voice-selector"
          title={`Voice`}
          variant="outline-secondary"
          size="sm"
        >
          {(() => {
            // Filter voices for the specific language (Indian English, Hindi, or Punjabi only)
            const filteredVoices = voices.filter(voice => 
              voiceService.isVoiceForLanguage(voice, language)
            );
            
            // If no language-specific voices found, show a message
            if (filteredVoices.length === 0) {
              return (
                <Dropdown.Item disabled>
                  No {language === 'en' ? 'Indian English' : language === 'hi' ? 'Hindi' : 'Punjabi'} voices available
                </Dropdown.Item>
              );
            }
            
            return filteredVoices.map((voice, index) => (
              <Dropdown.Item
                key={index}
                active={selectedVoice === voice}
                onClick={() => setSelectedVoice(voice)}
              >
                {voice.name} ({voice.lang})
              </Dropdown.Item>
            ));
          })()}
        </DropdownButton>
      )}
    </div>
  );
};

export default SimpleVoiceControl;
