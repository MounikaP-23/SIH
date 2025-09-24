import { offlineStorage } from './offlineStorage';

class NetworkService {
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Network: Online');
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Network: Offline');
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);

          // Set up background sync
          if ('sync' in window.ServiceWorkerRegistration.prototype) {
            this.setupBackgroundSync(registration);
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }

  private setupBackgroundSync(registration: ServiceWorkerRegistration): void {
    // Register for background sync (if supported)
    if ('sync' in registration) {
      (registration as any).sync.register('progress-sync')
        .then(() => {
          console.log('Background sync registered');
        })
        .catch((error: any) => {
          console.error('Background sync registration failed:', error);
        });
    } else {
      console.log('Background sync not supported in this browser');
    }
  }

  async syncOfflineData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;
    console.log('Syncing offline data...');

    try {
      // Get offline actions
      const offlineActions = await offlineStorage.getOfflineActions();

      for (const action of offlineActions) {
        try {
          await this.processOfflineAction(action);
          await offlineStorage.clearOfflineAction(action.id);
        } catch (error) {
          console.error('Failed to sync action:', action, error);
          // Increment retry count
          action.retries = (action.retries || 0) + 1;
          if (action.retries < 3) {
            await offlineStorage.queueOfflineAction(action);
          }
        }
      }

      console.log('Offline data sync completed');
    } catch (error) {
      console.error('Offline data sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processOfflineAction(action: any): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');

    const response = await fetch(action.url, {
      method: action.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...action.headers
      },
      body: action.body ? JSON.stringify(action.body) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async queueOfflineAction(url: string, method: string, body?: any, headers?: any): Promise<void> {
    await offlineStorage.queueOfflineAction({
      url,
      method,
      body,
      headers,
      timestamp: Date.now()
    });
  }

  // Enhanced fetch with offline support
  async fetchWithOfflineSupport(url: string, options: RequestInit = {}): Promise<Response> {
    if (this.isOnline) {
      try {
        const response = await fetch(url, options);

        // Cache successful responses
        if (response.ok && url.includes('/api/lessons')) {
          const data = await response.clone().json();
          await offlineStorage.saveLessons(data);
        }

        return response;
      } catch (error) {
        console.error('Network request failed:', error);
        // Fall back to offline data
        return this.getOfflineResponse(url, options);
      }
    } else {
      return this.getOfflineResponse(url, options);
    }
  }

  private async getOfflineResponse(url: string, options: RequestInit): Promise<Response> {
    if (url.includes('/api/lessons')) {
      const lessons = await offlineStorage.getLessons();
      return new Response(JSON.stringify(lessons), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.includes('/api/lessons/') && options.method === 'POST') {
      // Queue for later sync
      await this.queueOfflineAction(url, options.method || 'POST', options.body);
      return new Response(JSON.stringify({
        message: 'Queued for sync when online',
        offline: true
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      message: 'Offline - please check your connection'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Translation with offline caching
  async translateWithCache(text: string, source: string, target: string): Promise<string> {
    // Check cache first
    const cached = await offlineStorage.getTranslation(text, source, target);
    if (cached) {
      return cached;
    }

    if (this.isOnline) {
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: text, source, target })
        });

        if (response.ok) {
          const data = await response.json();
          const translation = data.translatedText || text;

          // Cache the translation
          await offlineStorage.saveTranslation(text, translation, source, target);

          return translation;
        }
      } catch (error) {
        console.error('Translation failed:', error);
      }
    }

    // Fallback to comprehensive word replacement
    return this.getFallbackTranslation(text, source, target);
  }

  private getFallbackTranslation(text: string, source: string, target: string): string {
    const fallbacks: Record<string, Record<string, string>> = {
      'en-hi': {
        'Mouse': 'माउस',
        'A Computer Part': 'एक कंप्यूटर भाग',
        'Parts of a Mouse': 'माउस के भाग',
        'Left Button': 'बायां बटन',
        'Right Button': 'दायां बटन',
        'Scroll Wheel': 'स्क्रॉल व्हील',
        'Uses of Mouse': 'माउस के उपयोग',
        'Example for Students': 'छात्रों के लिए उदाहरण',
        'A computer mouse is a small device that we hold in our hand to control the computer.': 'कंप्यूटर माउस एक छोटा उपकरण है जिसे हम अपने हाथ में पकड़कर कंप्यूटर को नियंत्रित करते हैं।',
        'A mouse is a small device that helps us control the computer.': 'माउस एक छोटा उपकरण है जो हमें कंप्यूटर को नियंत्रित करने में मदद करता है।',
        'It has two buttons and a scroll wheel.': 'इसमें दो बटन और एक स्क्रॉल व्हील होता है।',
        'We use the left button to select or open things, the right button to see more options, and the scroll wheel to move the page up and down.': 'हम बाएं बटन का उपयोग चीजों को चुनने या खोलने के लिए, दाएं बटन का उपयोग अधिक विकल्प देखने के लिए, और स्क्रॉल व्हील का उपयोग पेज को ऊपर-नीचे करने के लिए करते हैं।',
        'The mouse helps us to point, click, draw, and play games on the computer.': 'माउस हमें कंप्यूटर पर पॉइंट करने, क्लिक करने, ड्रॉ करने और गेम खेलने में मदद करता है।',
        'A mouse is a small device we use to control the computer.': 'माउस एक छोटा उपकरण है जिसका उपयोग हम कंप्यूटर को नियंत्रित करने के लिए करते हैं।',
        'It is held in the hand and moved on a table.': 'इसे हाथ में पकड़ा जाता है और मेज पर हिलाया जाता है।',
        'The mouse helps us to point, click, and move things on the screen.': 'माउस हमें स्क्रीन पर पॉइंट करने, क्लिक करने और चीजों को हिलाने में मदद करता है।',
        'Left button – used for clicking and selecting.': 'बायां बटन - क्लिक करने और चुनने के लिए उपयोग किया जाता है।',
        'Right button - shows a menu with more options.': 'दायां बटन - अधिक विकल्पों के साथ एक मेन्यू दिखाता है।',
        'Scroll Wheel - used to move up and down on the screen.': 'स्क्रॉल व्हील - स्क्रीन पर ऊपर-नीचे जाने के लिए उपयोग किया जाता है।',
        'To open programs (by clicking).': 'प्रोग्राम खोलने के लिए (क्लिक करके)।',
        'To move things (drag and drop)': 'चीजों को हिलाने के लिए (ड्रैग और ड्रॉप)',
        'We use the mouse to select, open, point, click, draw, and play games.': 'हम माउस का उपयोग चुनने, खोलने, इंगित करने, क्लिक करने, चित्र बनाने और गेम खेलने के लिए करते हैं।',
        'The mouse is a small device that helps us control the computer.': 'माउस एक छोटा उपकरण है जो हमें कंप्यूटर को नियंत्रित करने में मदद करता है।',
        'We move the mouse to move the cursor on the screen.': 'हम स्क्रीन पर कर्सर को हिलाने के लिए माउस को हिलाते हैं।',
        'The left button is used to select and open things.': 'बायां बटन चीजों को चुनने और खोलने के लिए उपयोग किया जाता है।',
        'The right button shows us more options.': 'दायां बटन हमें अधिक विकल्प दिखाता है।',
        'The scroll wheel helps us move up and down on the page.': 'स्क्रॉल व्हील पेज पर ऊपर-नीचे जाने में हमारी मदद करता है।',
        'We can open programs by clicking on them.': 'हम उन पर क्लिक करके प्रोग्राम खोल सकते हैं।',
        'We can move things by dragging and dropping.': 'हम चीजों को खींचकर और छोड़कर हिला सकते हैं।',
        'We can play games using the mouse.': 'हम माउस का उपयोग करके गेम खेल सकते हैं।',
        'We can draw pictures using the mouse.': 'हम माउस का उपयोग करके चित्र बना सकते हैं।',
        'Click the left button to open a picture.': 'चित्र खोलने के लिए बायां बटन क्लिक करें।',
        // Add more comprehensive translations for common computer terms
        'computer': 'कंप्यूटर',
        'keyboard': 'कीबोर्ड',
        'screen': 'स्क्रीन',
        'monitor': 'मॉनिटर',
        'printer': 'प्रिंटर',
        'speaker': 'स्पीकर',
        'camera': 'कैमरा',
        'microphone': 'माइक्रोफोन',
        'headphone': 'हेडफोन',
        'USB': 'यूएसबी',
        'cable': 'केबल',
        'wire': 'तार',
        'power': 'पावर',
        'battery': 'बैटरी',
        'charger': 'चार्जर',
        'internet': 'इंटरनेट',
        'website': 'वेबसाइट',
        'email': 'ईमेल',
        'password': 'पासवर्ड',
        'username': 'यूजरनेम',
        'login': 'लॉगिन',
        'logout': 'लॉगआउट',
        'save': 'सेव',
        'delete': 'डिलीट',
        'copy': 'कॉपी',
        'paste': 'पेस्ट',
        'cut': 'कट',
        'undo': 'अंडू',
        'redo': 'रीडू',
        'search': 'खोजें',
        'download': 'डाउनलोड',
        'upload': 'अपलोड',
        'folder': 'फोल्डर',
        'file': 'फाइल',
        'document': 'डॉक्यूमेंट',
        'image': 'इमेज',
        'video': 'वीडियो',
        'audio': 'ऑडियो',
        'music': 'म्यूजिक',
        'game': 'गेम',
        'app': 'ऐप',
        'software': 'सॉफ्टवेयर',
        'program': 'प्रोग्राम',
        'application': 'एप्लिकेशन',
        'window': 'विंडो',
        'menu': 'मेन्यू',
        'button': 'बटन',
        'icon': 'आइकन',
        'desktop': 'डेस्कटॉप',
        'taskbar': 'टास्कबार',
        'start': 'स्टार्ट',
        'shutdown': 'शटडाउन',
        'restart': 'रिस्टार्ट',
        'settings': 'सेटिंग्स',
        'preferences': 'प्रेफरेंसेस',
        'help': 'हेल्प',
        'support': 'सपोर्ट',
        'tutorial': 'ट्यूटोरियल',
        'lesson': 'पाठ',
        'course': 'कोर्स',
        'learning': 'सीखना',
        'education': 'शिक्षा',
        'student': 'छात्र',
        'teacher': 'शिक्षक',
        'class': 'कक्षा',
        'school': 'स्कूल',
        'college': 'कॉलेज',
        'university': 'विश्वविद्यालय',
        'book': 'किताब',
        'page': 'पेज',
        'chapter': 'अध्याय',
        'section': 'सेक्शन',
        'topic': 'विषय',
        'subject': 'विषय',
        'question': 'प्रश्न',
        'answer': 'उत्तर',
        'quiz': 'क्विज',
        'test': 'टेस्ट',
        'exam': 'परीक्षा',
        'grade': 'ग्रेड',
        'score': 'स्कोर',
        'mark': 'अंक',
        'result': 'परिणाम',
        'progress': 'प्रगति',
        'achievement': 'उपलब्धि',
        'certificate': 'प्रमाणपत्र',
        'diploma': 'डिप्लोमा',
        'degree': 'डिग्री'
      },
      'en-pa': {
        'Mouse': 'ਮਾਊਸ',
        'A Computer Part': 'ਕੰਪਿਊਟਰ ਦਾ ਇੱਕ ਹਿੱਸਾ',
        'Parts of a Mouse': 'ਮਾਊਸ ਦੇ ਹਿੱਸੇ',
        'Left Button': 'ਖੱਬਾ ਬਟਨ',
        'Right Button': 'ਸੱਜਾ ਬਟਨ',
        'Scroll Wheel': 'ਸਕ੍ਰੋਲ ਵ੍ਹੀਲ',
        'Uses of Mouse': 'ਮਾਊਸ ਦੇ ਉਪਯੋਗ',
        'Example for Students': 'ਵਿਦਿਆਰਥੀਆਂ ਲਈ ਉਦਾਹਰਣ',
        'A computer mouse is a small device that we hold in our hand to control the computer.': 'ਕੰਪਿਊਟਰ ਮਾਊਸ ਇੱਕ ਛੋਟਾ ਉਪਕਰਣ ਹੈ ਜਿਸ ਨੂੰ ਅਸੀਂ ਆਪਣੇ ਹੱਥ ਵਿੱਚ ਫੜ ਕੇ ਕੰਪਿਊਟਰ ਨੂੰ ਕੰਟਰੋਲ ਕਰਦੇ ਹਾਂ।',
        'A mouse is a small device that helps us control the computer.': 'ਮਾਊਸ ਇੱਕ ਛੋਟਾ ਉਪਕਰਣ ਹੈ ਜੋ ਸਾਨੂੰ ਕੰਪਿਊਟਰ ਨੂੰ ਕੰਟਰੋਲ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।',
        'It has two buttons and a scroll wheel.': 'ਇਸ ਵਿੱਚ ਦੋ ਬਟਨ ਅਤੇ ਇੱਕ ਸਕ੍ਰੋਲ ਵ੍ਹੀਲ ਹੁੰਦਾ ਹੈ।',
        'We use the left button to select or open things, the right button to see more options, and the scroll wheel to move the page up and down.': 'ਅਸੀਂ ਖੱਬੇ ਬਟਨ ਦਾ ਉਪਯੋਗ ਚੀਜ਼ਾਂ ਨੂੰ ਚੁਣਨ ਜਾਂ ਖੋਲ੍ਹਣ ਲਈ, ਸੱਜੇ ਬਟਨ ਦਾ ਉਪਯੋਗ ਹੋਰ ਵਿਕਲਪ ਦੇਖਣ ਲਈ, ਅਤੇ ਸਕ੍ਰੋਲ ਵ੍ਹੀਲ ਦਾ ਉਪਯੋਗ ਪੇਜ ਨੂੰ ਉੱਪਰ-ਹੇਠਾਂ ਕਰਨ ਲਈ ਕਰਦੇ ਹਾਂ।',
        'The mouse helps us to point, click, draw, and play games on the computer.': 'ਮਾਊਸ ਸਾਨੂੰ ਕੰਪਿਊਟਰ ਉੱਤੇ ਪੁਆਇੰਟ ਕਰਨ, ਕਲਿਕ ਕਰਨ, ਡਰਾਅ ਕਰਨ ਅਤੇ ਗੇਮ ਖੇਡਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।',
        'computer': 'ਕੰਪਿਊਟਰ',
        'keyboard': 'ਕੀਬੋਰਡ',
        'screen': 'ਸਕ੍ਰੀਨ',
        'monitor': 'ਮਾਨੀਟਰ',
        'printer': 'ਪ੍ਰਿੰਟਰ',
        'speaker': 'ਸਪੀਕਰ',
        'camera': 'ਕੈਮਰਾ',
        'microphone': 'ਮਾਈਕ੍ਰੋਫੋਨ',
        'headphone': 'ਹੈੱਡਫੋਨ',
        'USB': 'ਯੂਐਸਬੀ',
        'cable': 'ਕੇਬਲ',
        'wire': 'ਤਾਰ',
        'power': 'ਪਾਵਰ',
        'battery': 'ਬੈਟਰੀ',
        'charger': 'ਚਾਰਜਰ',
        'internet': 'ਇੰਟਰਨੈੱਟ',
        'website': 'ਵੈਬਸਾਈਟ',
        'email': 'ਈਮੇਲ',
        'password': 'ਪਾਸਵਰਡ',
        'username': 'ਯੂਜ਼ਰਨੇਮ',
        'login': 'ਲੌਗਇਨ',
        'logout': 'ਲੌਗਆਉਟ',
        'save': 'ਸੇਵ',
        'delete': 'ਡਿਲੀਟ',
        'copy': 'ਕਾਪੀ',
        'paste': 'ਪੇਸਟ',
        'cut': 'ਕੱਟ',
        'undo': 'ਅੰਡੂ',
        'redo': 'ਰੀਡੂ',
        'search': 'ਖੋਜੋ',
        'download': 'ਡਾਊਨਲੋਡ',
        'upload': 'ਅਪਲੋਡ',
        'folder': 'ਫੋਲਡਰ',
        'file': 'ਫਾਈਲ',
        'document': 'ਡੌਕਿਊਮੈਂਟ',
        'image': 'ਇਮੇਜ',
        'video': 'ਵੀਡੀਓ',
        'audio': 'ਆਡੀਓ',
        'music': 'ਮਿਊਜ਼ਿਕ',
        'game': 'ਗੇਮ',
        'app': 'ਐਪ',
        'software': 'ਸਾਫਟਵੇਅਰ',
        'program': 'ਪ੍ਰੋਗਰਾਮ',
        'application': 'ਐਪਲੀਕੇਸ਼ਨ',
        'window': 'ਵਿੰਡੋ',
        'menu': 'ਮੇਨੂ',
        'button': 'ਬਟਨ',
        'icon': 'ਆਈਕਨ',
        'desktop': 'ਡੈਸਕਟਾਪ',
        'taskbar': 'ਟਾਸਕਬਾਰ',
        'start': 'ਸਟਾਰਟ',
        'shutdown': 'ਸ਼ਟਡਾਊਨ',
        'restart': 'ਰਿਸਟਾਰਟ',
        'settings': 'ਸੈਟਿੰਗਜ਼',
        'preferences': 'ਪ੍ਰਿਫਰੰਸਿਜ਼',
        'help': 'ਹੈਲਪ',
        'support': 'ਸਪੋਰਟ',
        'tutorial': 'ਟਿਊਟੋਰੀਅਲ',
        'lesson': 'ਪਾਠ',
        'course': 'ਕੋਰਸ',
        'learning': 'ਸਿੱਖਣਾ',
        'education': 'ਸਿੱਖਿਆ',
        'student': 'ਵਿਦਿਆਰਥੀ',
        'teacher': 'ਅਧਿਆਪਕ',
        'class': 'ਕਲਾਸ',
        'school': 'ਸਕੂਲ',
        'college': 'ਕਾਲਜ',
        'university': 'ਯੂਨੀਵਰਸਿਟੀ',
        'book': 'ਕਿਤਾਬ',
        'page': 'ਪੇਜ',
        'chapter': 'ਅਧਿਆਇ',
        'section': 'ਸੈਕਸ਼ਨ',
        'topic': 'ਵਿਸ਼ਾ',
        'subject': 'ਵਿਸ਼ਾ',
        'question': 'ਸਵਾਲ',
        'answer': 'ਜਵਾਬ',
        'quiz': 'ਕਵਿਜ਼',
        'test': 'ਟੈਸਟ',
        'exam': 'ਪ੍ਰੀਖਿਆ',
        'grade': 'ਗ੍ਰੇਡ',
        'score': 'ਸਕੋਰ',
        'mark': 'ਨੰਬਰ',
        'result': 'ਨਤੀਜਾ',
        'progress': 'ਤਰੱਕੀ',
        'achievement': 'ਪ੍ਰਾਪਤੀ',
        'certificate': 'ਸਰਟੀਫਿਕੇਟ',
        'diploma': 'ਡਿਪਲੋਮਾ',
        'degree': 'ਡਿਗਰੀ'
      }
    };

    const key = `${source}-${target}`;
    const fallbackMap = fallbacks[key] || {};
    
    let translated = text;
    for (const [english, translation] of Object.entries(fallbackMap)) {
      translated = translated.replace(new RegExp(english, 'gi'), translation);
    }
    
    return translated;
  }

  // Push notification setup
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async subscribeToPushNotifications(): Promise<void> {
    const permission = await this.requestNotificationPermission();
    if (!permission) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa40HI8YFy0p8wWmBHfK4lsw3OUvUcXU4pg-LXvVcYSu8HkAHEsqTnyi5fofE'
        ) as BufferSource
      });

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(subscription)
      });

      console.log('Push subscription successful');
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export const networkService = new NetworkService();
