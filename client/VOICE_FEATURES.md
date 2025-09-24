# Voice Features for Lessons

This document describes the simplified voice functionality added to the student dashboard for lessons.

## Overview

The voice feature allows students to listen to lesson content in their preferred language using text-to-speech technology. This enhances accessibility and learning experience for students who prefer audio learning.

## Features

### 1. Simple Voice Control Component (`SimpleVoiceControl.tsx`)

A simplified component that provides:
- **Play/Stop button**: Start or stop audio playback
- **Voice selection**: Choose from available voices for the selected language
- **Language support**: Automatically selects appropriate voice for the lesson language
- **Integrated with language selector**: Positioned near the language dropdown for easy access

### 2. Voice Service (`voiceService.ts`)

A comprehensive service that handles:
- **Text-to-speech conversion**: Converts text to speech using Web Speech API
- **Language detection**: Maps lesson languages to appropriate voice codes
- **HTML content cleaning**: Strips HTML tags and cleans text for better speech
- **Voice management**: Lists and filters available voices by language
- **Error handling**: Graceful fallback when speech synthesis is not supported

### 3. Integration Points

#### Lesson Viewer (`LessonViewer.tsx`)
- Single voice control near the language selector
- Reads entire lesson content (title, description, and content) in selected language
- Language-aware voice selection based on selected lesson language

#### Lessons Page (`LessonsPage.tsx`)
- Simple voice control near language dropdown in lesson cards
- Quick preview of lesson title and description
- Integrated with existing language selection

#### Student Dashboard (`StudentDashboard.tsx`)
- Added "Voice Test" tab for testing voice functionality
- Voice test component for debugging and verification

## Supported Languages

- **English (en)**: Uses `en-US` voice codes
- **Hindi (hi)**: Uses `hi-IN` voice codes  
- **Punjabi (pa)**: Uses `pa-IN` voice codes

## Browser Compatibility

The voice features use the Web Speech API (`speechSynthesis`), which is supported in:
- Chrome/Chromium browsers
- Safari
- Edge
- Firefox (with limited support)

## Usage

### For Students

1. **In Lesson Cards**: Click the "Listen" button near the language dropdown to hear lesson preview
2. **In Lesson Viewer**: Use the voice control near the language selector to hear the entire lesson
3. **Language Switching**: Voice automatically adapts when switching lesson languages
4. **Voice Selection**: Choose preferred voice from the dropdown (automatically filtered by language)

### For Developers

```typescript
import { voiceService } from '../services/voiceService';

// Basic usage
await voiceService.speak('Hello world', {
  language: 'en-US',
  rate: 0.8,
  pitch: 1,
  volume: 1
});

// Clean HTML content
const cleanText = voiceService.cleanTextForSpeech('<p>Hello <strong>world</strong></p>');

// Get available voices
const voices = voiceService.getVoices();
const englishVoices = voiceService.getLanguageVoices('en');
```

## Styling

Voice controls are styled with:
- Responsive design that adapts to different screen sizes
- Consistent styling with the existing design system
- Special styling for voice controls in the lesson header (white text on blue background)
- Hover effects and smooth transitions

## Error Handling

- Graceful fallback when speech synthesis is not supported
- Error messages for failed speech operations
- Automatic voice selection when preferred voice is not available
- Support for browsers with limited voice options

## Testing

Use the "Voice Test" tab in the student dashboard to:
- Test basic voice functionality
- Verify language support
- Check available voices
- Test HTML content cleaning
- Debug voice-related issues

## Future Enhancements

Potential improvements could include:
- Voice recording for pronunciation practice
- Highlighting text as it's being spoken
- Custom voice training
- Offline voice support
- Voice commands for navigation
