import React, { useState } from 'react';
import { Button, Card, Alert } from 'react-bootstrap';
import { voiceService } from '../../services/voiceService';

const VoiceTest: React.FC = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  React.useEffect(() => {
    setIsSupported(voiceService.isSupported());
  }, []);

  const runTests = async () => {
    const results: string[] = [];
    
    try {
      // Test 1: Basic functionality
      results.push('Testing basic voice functionality...');
      await voiceService.speak('Hello, this is a test of the voice service.', {
        language: 'en-US',
        rate: 0.8
      });
      results.push('✓ Basic voice test passed');

      // Test 2: Language support
      results.push('Testing language support...');
      const voices = voiceService.getVoices();
      results.push(`✓ Found ${voices.length} available voices`);
      
      const enVoices = voiceService.getLanguageVoices('en');
      const hiVoices = voiceService.getLanguageVoices('hi');
      const paVoices = voiceService.getLanguageVoices('pa');
      
      results.push(`✓ English voices: ${enVoices.length}`);
      results.push(`✓ Hindi voices: ${hiVoices.length}`);
      results.push(`✓ Punjabi voices: ${paVoices.length}`);

      // Test 3: HTML cleaning
      results.push('Testing HTML content cleaning...');
      const htmlContent = '<p>This is <strong>bold</strong> text with <em>emphasis</em>.</p>';
      const cleanText = voiceService.cleanTextForSpeech(htmlContent);
      results.push(`✓ Cleaned text: "${cleanText}"`);

      // Test 4: Different languages
      results.push('Testing different language codes...');
      const enCode = voiceService.getLanguageCode('en');
      const hiCode = voiceService.getLanguageCode('hi');
      const paCode = voiceService.getLanguageCode('pa');
      
      results.push(`✓ English code: ${enCode}`);
      results.push(`✓ Hindi code: ${hiCode}`);
      results.push(`✓ Punjabi code: ${paCode}`);

    } catch (error) {
      results.push(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setTestResults(results);
  };

  if (!isSupported) {
    return (
      <Alert variant="warning">
        <i className="fas fa-exclamation-triangle me-2"></i>
        Speech synthesis is not supported in this browser
      </Alert>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">Voice Service Test</h5>
      </Card.Header>
      <Card.Body>
        <Button onClick={runTests} className="mb-3">
          <i className="fas fa-play me-2"></i>
          Run Voice Tests
        </Button>
        
        {testResults.length > 0 && (
          <div>
            <h6>Test Results:</h6>
            <pre className="bg-light p-3 rounded" style={{ fontSize: '0.875rem' }}>
              {testResults.join('\n')}
            </pre>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default VoiceTest;
