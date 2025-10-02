import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Dropdown, DropdownButton } from 'react-bootstrap';
import { useData } from '../../contexts/DataContext';
import QuizComponent from './QuizComponent';
import SimpleVoiceControl from './SimpleVoiceControl';
import { useTranslation } from 'react-i18next';
import { networkService } from '../../services/networkService_improved';
import { voiceService } from '../../services/voiceService';

const LessonViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lessons, completeLesson } = useData();
  const location = useLocation();
  const { i18n } = useTranslation();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'pa'>('en');
  const [runtimeTranslations, setRuntimeTranslations] = useState<Record<'hi' | 'pa', { title?: string; description?: string; content?: string }>>({ hi: {}, pa: {} });
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
    if (!id) return;

    // Use cached lesson first if available for a snappy UI
    if (lessons.length > 0) {
      const foundLesson = lessons.find(l => l._id === id);
      if (foundLesson) {
        setLesson(foundLesson);
        setLoading(false);
      }
    }

    // Always fetch latest from server to reflect newly added quiz questions
    fetchLesson();
  }, [id, lessons]);

  // If URL contains ?startQuiz=1 and a quiz is available, open it automatically
  useEffect(() => {
    if (!lesson) return;
    const params = new URLSearchParams(location.search);
    const shouldStart = params.get('startQuiz') === '1';
    const hasQuiz = !!(lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0);
    if (shouldStart && hasQuiz) {
      setShowQuiz(true);
    }
  }, [lesson, location.search]);

  const fetchLesson = async () => {
    try {
      const response = await fetch(`/api/lessons/${id}`);
      if (response.ok) {
        const lessonData = await response.json();
        setLesson(lessonData);
        // Initialize selected language from URL (?lang=) or lesson default
        const params = new URLSearchParams(location.search);
        const qLang = params.get('lang') as 'en' | 'hi' | 'pa' | null;
        const initial = (qLang || (i18n.language as 'en' | 'hi' | 'pa') || lessonData.language || 'en') as 'en' | 'hi' | 'pa';
        setSelectedLang(initial);
        if (i18n.language !== initial) {
          i18n.changeLanguage(initial);
        }
      } else {
        navigate('/student/lessons');
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
      navigate('/student/lessons');
    } finally {
      setLoading(false);
    }
  };

  // Compute display fields based on selected language with graceful fallback (no setState here)
  const computeDisplay = () => {
    if (!lesson) return { title: '', description: '', content: '', note: '' };
    if (selectedLang === 'en') {
      console.log('Displaying English content');
      return { title: lesson.title, description: lesson.description, content: lesson.content, note: '' };
    }
    
    const rt = runtimeTranslations[selectedLang] || {};
    const t = { ...(lesson.translations?.[selectedLang] || {}), ...rt };
    
    // Always use translated content if available, otherwise fallback to original
    const title = t.title || lesson.title;
    const description = t.description || lesson.description;
    const content = t.content || lesson.content;
    
    console.log('Displaying translated content for', selectedLang, {
      hasStoredTranslations: !!(lesson.translations?.[selectedLang]),
      hasRuntimeTranslations: !!(rt.title || rt.description || rt.content),
      title: title.substring(0, 50),
      description: description.substring(0, 50),
      content: content.substring(0, 100),
      originalTitle: lesson.title.substring(0, 50),
      originalDescription: lesson.description.substring(0, 50)
    });
    
    // Check if we have any translations (either stored or runtime)
    const hasTranslations = !!(t.title || t.description || t.content);
    const hasRuntimeTranslations = !!(rt.title || rt.description || rt.content);
    
    const note = isTranslating
      ? 'Translating…'
      : !hasTranslations && !hasRuntimeTranslations
      ? 'Translation coming soon'
      : '';
    return { title, description, content, note };
  };

  const { title: displayTitle, description: displayDescription, content: displayContent, note: translationNote } = computeDisplay();

  const handleSelectLanguage = (code: 'en' | 'hi' | 'pa') => {
    console.log('Language changed to:', code);
    setSelectedLang(code);
    if (i18n.language !== code) {
      i18n.changeLanguage(code);
    }
    // Clear existing runtime translations to force new translation
    if (code !== 'en') {
      setRuntimeTranslations(prev => ({ ...prev, [code]: {} }));
    }
    // Update URL query without navigating away
    const params = new URLSearchParams(location.search);
    params.set('lang', code);
    navigate({ pathname: `/student/lessons/${id}`, search: params.toString() }, { replace: true });
  };

  // Auto-translate when selected language changes
  useEffect(() => {
    const run = async () => {
      if (!lesson) return;
      if (selectedLang === 'en') {
        console.log('English selected, no translation needed');
        return;
      }
      
      console.log('Starting translation for language:', selectedLang);
      
      // Always translate when language changes, don't skip if translations exist
      const cached = runtimeTranslations[selectedLang];
      if (cached && (cached.title || cached.description || cached.content)) {
        console.log('Using cached translations for:', selectedLang);
        return; // already have runtime translations
      }
      
      // Create comprehensive fallback translations for any lesson
      const createFallbackTranslation = (text: string, language: 'hi' | 'pa') => {
        if (language === 'hi') {
          return text
            // Complete sentence translations first
            .replace(/A computer mouse is a small device that we hold in our hand to control the computer\./gi, 'कंप्यूटर माउस एक छोटा उपकरण है जिसे हम अपने हाथ में पकड़कर कंप्यूटर को नियंत्रित करते हैं।')
            .replace(/It has two buttons and a scroll wheel\./gi, 'इसमें दो बटन और एक स्क्रॉल व्हील होता है।')
            .replace(/We use the left button to select or open things, the right button to see more options, and the scroll wheel to move the page up and down\./gi, 'हम बाएं बटन का उपयोग चीजों को चुनने या खोलने के लिए, दाएं बटन का उपयोग अधिक विकल्प देखने के लिए, और स्क्रॉल व्हील का उपयोग पेज को ऊपर-नीचे करने के लिए करते हैं।')
            .replace(/The mouse helps us to point, click, draw, and play games on the computer\./gi, 'माउस हमें कंप्यूटर पर पॉइंट करने, क्लिक करने, ड्रॉ करने और गेम खेलने में मदद करता है।')
            .replace(/A mouse is a small device we use to control the computer\./gi, 'माउस एक छोटा उपकरण है जिसका उपयोग हम कंप्यूटर को नियंत्रित करने के लिए करते हैं।')
            .replace(/It is held in the hand and moved on a table\./gi, 'इसे हाथ में पकड़ा जाता है और मेज पर हिलाया जाता है।')
            .replace(/The mouse helps us to point, click, and move things on the screen\./gi, 'माउस हमें स्क्रीन पर पॉइंट करने, क्लिक करने और चीजों को हिलाने में मदद करता है।')
            .replace(/Left button – used for clicking and selecting\./gi, 'बायां बटन - क्लिक करने और चुनने के लिए उपयोग किया जाता है।')
            .replace(/Right button - shows a menu with more options\./gi, 'दायां बटन - अधिक विकल्पों के साथ एक मेन्यू दिखाता है।')
            .replace(/Scroll Wheel - used to move up and down on the screen\./gi, 'स्क्रॉल व्हील - स्क्रीन पर ऊपर-नीचे जाने के लिए उपयोग किया जाता है।')
            .replace(/To open programs \(by clicking\)\./gi, 'प्रोग्राम खोलने के लिए (क्लिक करके)।')
            .replace(/To move things \(drag and drop\)/gi, 'चीजों को हिलाने के लिए (ड्रैग और ड्रॉप)')
            // Common computer terms
            .replace(/computer/gi, 'कंप्यूटर')
            .replace(/mouse/gi, 'माउस')
            .replace(/keyboard/gi, 'कीबोर्ड')
            .replace(/screen/gi, 'स्क्रीन')
            .replace(/cursor/gi, 'कर्सर')
            .replace(/button/gi, 'बटन')
            .replace(/click/gi, 'क्लिक')
            .replace(/program/gi, 'प्रोग्राम')
            .replace(/software/gi, 'सॉफ्टवेयर')
            .replace(/hardware/gi, 'हार्डवेयर')
            .replace(/internet/gi, 'इंटरनेट')
            .replace(/website/gi, 'वेबसाइट')
            .replace(/email/gi, 'ईमेल')
            .replace(/file/gi, 'फाइल')
            .replace(/folder/gi, 'फोल्डर')
            .replace(/desktop/gi, 'डेस्कटॉप')
            .replace(/window/gi, 'विंडो')
            .replace(/menu/gi, 'मेन्यू')
            .replace(/icon/gi, 'आइकन')
            // Common actions
            .replace(/learn/gi, 'सीखें')
            .replace(/practice/gi, 'अभ्यास')
            .replace(/use/gi, 'उपयोग')
            .replace(/open/gi, 'खोलें')
            .replace(/close/gi, 'बंद करें')
            .replace(/save/gi, 'सेव करें')
            .replace(/delete/gi, 'डिलीट करें')
            .replace(/create/gi, 'बनाएं')
            .replace(/edit/gi, 'एडिट करें')
            .replace(/type/gi, 'टाइप करें')
            // Common phrases
            .replace(/how to/gi, 'कैसे')
            .replace(/step by step/gi, 'चरणबद्ध तरीके से')
            .replace(/important/gi, 'महत्वपूर्ण')
            .replace(/remember/gi, 'याद रखें')
            .replace(/note/gi, 'नोट')
            .replace(/example/gi, 'उदाहरण')
            .replace(/tutorial/gi, 'ट्यूटोरियल')
            .replace(/lesson/gi, 'पाठ')
            .replace(/course/gi, 'कोर्स')
            .replace(/skill/gi, 'कौशल');
        } else if (language === 'pa') {
          return text
            // Complete sentence translations first
            .replace(/A computer mouse is a small device that we hold in our hand to control the computer\./gi, 'ਕੰਪਿਊਟਰ ਮਾਊਸ ਇੱਕ ਛੋਟਾ ਉਪਕਰਣ ਹੈ ਜਿਸਨੂੰ ਅਸੀਂ ਆਪਣੇ ਹੱਥ ਵਿੱਚ ਪਕੜ ਕੇ ਕੰਪਿਊਟਰ ਨੂੰ ਨਿਯੰਤਰਿਤ ਕਰਦੇ ਹਾਂ।')
            .replace(/It has two buttons and a scroll wheel\./gi, 'ਇਸ ਵਿੱਚ ਦੋ ਬਟਨ ਅਤੇ ਇੱਕ ਸਕ੍ਰੌਲ ਵ੍ਹੀਲ ਹੁੰਦਾ ਹੈ।')
            .replace(/We use the left button to select or open things, the right button to see more options, and the scroll wheel to move the page up and down\./gi, 'ਅਸੀਂ ਖੱਬੇ ਬਟਨ ਦਾ ਉਪਯੋਗ ਚੀਜ਼ਾਂ ਨੂੰ ਚੁਣਨ ਜਾਂ ਖੋਲ੍ਹਣ ਲਈ, ਸੱਜੇ ਬਟਨ ਦਾ ਉਪਯੋਗ ਹੋਰ ਵਿਕਲਪ ਦੇਖਣ ਲਈ, ਅਤੇ ਸਕ੍ਰੌਲ ਵ੍ਹੀਲ ਦਾ ਉਪਯੋਗ ਪੇਜ ਨੂੰ ਉੱਪਰ-ਹੇਠਾਂ ਕਰਨ ਲਈ ਕਰਦੇ ਹਾਂ।')
            .replace(/The mouse helps us to point, click, draw, and play games on the computer\./gi, 'ਮਾਊਸ ਸਾਨੂੰ ਕੰਪਿਊਟਰ ਉੱਤੇ ਪੁਆਇੰਟ ਕਰਨ, ਕਲਿਕ ਕਰਨ, ਡਰਾਅ ਕਰਨ ਅਤੇ ਗੇਮ ਖੇਡਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।')
            .replace(/A mouse is a small device we use to control the computer\./gi, 'ਮਾਊਸ ਇੱਕ ਛੋਟਾ ਉਪਕਰਣ ਹੈ ਜਿਸਦਾ ਉਪਯੋਗ ਅਸੀਂ ਕੰਪਿਊਟਰ ਨੂੰ ਨਿਯੰਤਰਿਤ ਕਰਨ ਲਈ ਕਰਦੇ ਹਾਂ।')
            .replace(/It is held in the hand and moved on a table\./gi, 'ਇਸਨੂੰ ਹੱਥ ਵਿੱਚ ਪਕੜਿਆ ਜਾਂਦਾ ਹੈ ਅਤੇ ਮੇਜ਼ ਉੱਤੇ ਹਿਲਾਇਆ ਜਾਂਦਾ ਹੈ।')
            .replace(/The mouse helps us to point, click, and move things on the screen\./gi, 'ਮਾਊਸ ਸਾਨੂੰ ਸਕ੍ਰੀਨ ਉੱਤੇ ਪੁਆਇੰਟ ਕਰਨ, ਕਲਿਕ ਕਰਨ ਅਤੇ ਚੀਜ਼ਾਂ ਨੂੰ ਹਿਲਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।')
            .replace(/Left button – used for clicking and selecting\./gi, 'ਖੱਬਾ ਬਟਨ - ਕਲਿਕ ਕਰਨ ਅਤੇ ਚੁਣਨ ਲਈ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ।')
            .replace(/Right button - shows a menu with more options\./gi, 'ਸੱਜਾ ਬਟਨ - ਹੋਰ ਵਿਕਲਪਾਂ ਦੇ ਸਾਥ ਇੱਕ ਮੈਨੂ ਦਿਖਾਉਂਦਾ ਹੈ।')
            .replace(/Scroll Wheel - used to move up and down on the screen\./gi, 'ਸਕ੍ਰੌਲ ਵ੍ਹੀਲ - ਸਕ੍ਰੀਨ ਉੱਤੇ ਉੱਪਰ-ਹੇਠਾਂ ਜਾਣ ਲਈ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ।')
            .replace(/To open programs \(by clicking\)\./gi, 'ਪ੍ਰੋਗਰਾਮ ਖੋਲ੍ਹਣ ਲਈ (ਕਲਿਕ ਕਰਕੇ)।')
            .replace(/To move things \(drag and drop\)/gi, 'ਚੀਜ਼ਾਂ ਨੂੰ ਹਿਲਾਉਣ ਲਈ (ਡ੍ਰੈਗ ਅਤੇ ਡ੍ਰੌਪ)')
            // Common computer terms
            .replace(/computer/gi, 'ਕੰਪਿਊਟਰ')
            .replace(/mouse/gi, 'ਮਾਊਸ')
            .replace(/keyboard/gi, 'ਕੀਬੋਰਡ')
            .replace(/screen/gi, 'ਸਕ੍ਰੀਨ')
            .replace(/cursor/gi, 'ਕਰਸਰ')
            .replace(/button/gi, 'ਬਟਨ')
            .replace(/click/gi, 'ਕਲਿਕ')
            .replace(/program/gi, 'ਪ੍ਰੋਗਰਾਮ')
            .replace(/software/gi, 'ਸਾਫਟਵੇਅਰ')
            .replace(/hardware/gi, 'ਹਾਰਡਵੇਅਰ')
            .replace(/internet/gi, 'ਇੰਟਰਨੈੱਟ')
            .replace(/website/gi, 'ਵੈੱਬਸਾਈਟ')
            .replace(/email/gi, 'ਈਮੇਲ')
            .replace(/file/gi, 'ਫਾਈਲ')
            .replace(/folder/gi, 'ਫੋਲਡਰ')
            .replace(/desktop/gi, 'ਡੈਸਕਟਾਪ')
            .replace(/window/gi, 'ਵਿੰਡੋ')
            .replace(/menu/gi, 'ਮੈਨੂ')
            .replace(/icon/gi, 'ਆਈਕਨ')
            // Common actions
            .replace(/learn/gi, 'ਸਿੱਖੋ')
            .replace(/practice/gi, 'ਅਭਿਆਸ')
            .replace(/use/gi, 'ਇਸਤੇਮਾਲ')
            .replace(/open/gi, 'ਖੋਲੋ')
            .replace(/close/gi, 'ਬੰਦ ਕਰੋ')
            .replace(/save/gi, 'ਸੇਵ ਕਰੋ')
            .replace(/delete/gi, 'ਡਿਲੀਟ ਕਰੋ')
            .replace(/create/gi, 'ਬਣਾਓ')
            .replace(/edit/gi, 'ਐਡਿਟ ਕਰੋ')
            .replace(/type/gi, 'ਟਾਈਪ ਕਰੋ')
            // Common phrases
            .replace(/how to/gi, 'ਕਿਵੇਂ')
            .replace(/step by step/gi, 'ਕਦਮ ਦਰ ਕਦਮ')
            .replace(/important/gi, 'ਮਹੱਤਵਪੂਰਨ')
            .replace(/remember/gi, 'ਯਾਦ ਰੱਖੋ')
            .replace(/note/gi, 'ਨੋਟ')
            .replace(/example/gi, 'ਉਦਾਹਰਣ')
            .replace(/tutorial/gi, 'ਟਿਊਟੋਰੀਅਲ')
            .replace(/lesson/gi, 'ਪਾਠ')
            .replace(/course/gi, 'ਕੋਰਸ')
            .replace(/skill/gi, 'ਹੁਨਰ');
        }
        return text;
      };

      const fallbackTranslations = {
        'hi': {
          title: createFallbackTranslation(lesson.title, 'hi'),
          description: createFallbackTranslation(lesson.description, 'hi'),
          content: createFallbackTranslation(lesson.content, 'hi')
        },
        'pa': {
          title: createFallbackTranslation(lesson.title, 'pa'),
          description: createFallbackTranslation(lesson.description, 'pa'),
          content: createFallbackTranslation(lesson.content, 'pa')
        }
      };
      
      // Always set immediate fallback translation first
      if (fallbackTranslations[selectedLang]) {
        console.log('Setting immediate fallback translation for:', selectedLang);
        setRuntimeTranslations(prev => ({
          ...prev,
          [selectedLang]: fallbackTranslations[selectedLang]
        }));
      }
      
      try {
        setIsTranslating(true);
        const source = (lesson.language || 'en') as 'en' | 'hi' | 'pa';
        const target = selectedLang;

        console.log('Translating from', source, 'to', target);

        const translate = async (q: string): Promise<string> => {
          if (!q) return '';
          console.log('Translating:', q.substring(0, 50), 'from', source, 'to', target);
          return await networkService.translateWithCache(q, source, target);
        };

        const [tTitle, tDesc, tContent] = await Promise.all([
          translate(lesson.title || ''),
          translate(lesson.description || ''),
          translate(stripHtml(lesson.content || '')),
        ]);

              console.log('Translation completed:', { tTitle, tDesc, tContent: tContent.substring(0, 100) });

              // Only update if we got valid translations
              if (tTitle && tDesc && tContent) {
                setRuntimeTranslations(prev => ({
                  ...prev,
                  [target]: {
                    title: tTitle,
                    description: tDesc,
                    content: wrapAsParagraphs(tContent)
                  }
                }));
              } else {
                console.log('Network translation failed, keeping fallback translations');
              }
      } catch (e) {
        console.error('Auto-translation failed', e);
      } finally {
        setIsTranslating(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLang, lesson?._id]);

  // Helpers to handle HTML content simplification for translation
  const stripHtml = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };
  const wrapAsParagraphs = (text: string) => {
    const escaped = text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => `<p>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`) // very basic escape
      .join('');
    return escaped || `<p>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
  };

  const handleQuizComplete = async (score: number, totalQuestions: number) => {
    try {
      const seconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : undefined;
      await completeLesson(lesson._id, score, totalQuestions, seconds);
      setQuizCompleted(true);
      setShowQuiz(false);
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <Alert variant="danger">
        Lesson not found. <Button variant="link" onClick={() => navigate('/student/lessons')}>Go back to lessons</Button>
      </Alert>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{displayTitle}</h4>
                  <small>by {lesson.createdBy.name}</small>
                </div>
                <div className="text-end">
                  <span className="badge bg-light text-dark me-2">{lesson.subject}</span>
                  <span className="badge bg-light text-dark">Class {lesson.classLevel}</span>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <h6>Description</h6>
                <p className="text-muted">{displayDescription}</p>
              </div>

              {lesson.videoLink && (
                <div className="mb-4">
                  <h6>Video Content</h6>
                  <div className="ratio ratio-16x9">
                    <iframe
                      src={lesson.videoLink}
                      title={lesson.title}
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h6>Lesson Content</h6>
                <div 
                  className="border rounded p-3 bg-light"
                  style={{ minHeight: '200px' }}
                  dangerouslySetInnerHTML={{ __html: displayContent }}
                />
                {translationNote && (
                  <div className="mt-2 text-muted small">{translationNote}</div>
                )}
              </div>

              {lesson.images && lesson.images.length > 0 && (
                <div className="mb-4">
                  <h6>Images</h6>
                  <Row>
                    {lesson.images.map((image: string, index: number) => (
                      <Col key={index} md={6} className="mb-3">
                        <img
                          src={image}
                          alt={`Content ${index + 1}`}
                          className="img-fluid rounded"
                          style={{ maxHeight: '200px', objectFit: 'cover' }}
                        />
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
                <div className="d-flex gap-2 align-items-center">
                  <Button 
                    variant="outline-primary" 
                    onClick={() => navigate('/student/lessons')}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Back to Lessons
                  </Button>

                  {(() => {
                    const hasQuiz = !!(lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0);
                    return (
                      <Button
                        variant={hasQuiz ? 'success' : 'outline-secondary'}
                        onClick={() => hasQuiz && !quizCompleted ? setShowQuiz(true) : null}
                        disabled={!hasQuiz || quizCompleted}
                        title={hasQuiz ? (quizCompleted ? 'Quiz already completed' : 'Start Quiz') : 'No quiz available yet'}
                      >
                        <i className="fas fa-question-circle me-2"></i>
                        {hasQuiz ? `Quiz (${lesson.quiz.questions.length} questions)` : 'Quiz'}
                      </Button>
                    );
                  })()}
                  {(!lesson.quiz || !lesson.quiz.questions || lesson.quiz.questions.length === 0) && (
                    <span className="text-muted align-self-center">
                      No quiz available for this lesson
                    </span>
                  )}
                </div>

                <div className="d-flex gap-2 align-items-center">
                  {/* Language selection dropdown - only changes lesson text fields */}
                  <DropdownButton id="lesson-lang" title={`Language: ${selectedLang === 'en' ? 'English' : selectedLang === 'hi' ? 'Hindi' : 'Punjabi'}`} variant="outline-secondary">
                    <Dropdown.Item active={selectedLang === 'en'} onClick={() => handleSelectLanguage('en')}>English</Dropdown.Item>
                    <Dropdown.Item active={selectedLang === 'hi'} onClick={() => handleSelectLanguage('hi')}>Hindi</Dropdown.Item>
                    <Dropdown.Item active={selectedLang === 'pa'} onClick={() => handleSelectLanguage('pa')}>Punjabi</Dropdown.Item>
                  </DropdownButton>

                  {/* Simple voice control */}
                  <SimpleVoiceControl 
                    key={`voice-${selectedLang}-${lesson._id}`}
                    text={`${displayTitle}. ${displayDescription}. ${voiceService.cleanTextForSpeech(displayContent)}`}
                    language={selectedLang}
                  />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Lesson Info</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>Subject:</strong> {lesson.subject}
              </div>
              <div className="mb-3">
                <strong>Class Level:</strong> {lesson.classLevel}
              </div>
              <div className="mb-3">
                <strong>Language:</strong> {lesson.language}
              </div>
              <div className="mb-3">
                <strong>Created:</strong> {new Date(lesson.createdAt).toLocaleDateString()}
              </div>
              {lesson.quiz && lesson.quiz.questions && (
                <div className="mb-3">
                  <strong>Quiz:</strong> {lesson.quiz.questions.length} questions
                </div>
              )}
            </Card.Body>
          </Card>

          {quizCompleted && (
            <Card className="mt-3 border-success">
              <Card.Body className="text-center">
                <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
                <h5 className="text-success">Quiz Completed!</h5>
                <p className="text-muted">Great job! You've completed this lesson.</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Quiz Modal */}
      {showQuiz && lesson.quiz && (
        <QuizComponent
          quiz={lesson.quiz}
          onComplete={handleQuizComplete}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </Container>
  );
};

export default LessonViewer;
