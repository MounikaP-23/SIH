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

    // Fallback to simple word replacement
    return this.getFallbackTranslation(text, source, target);
  }

  private getFallbackTranslation(text: string, source: string, target: string): string {
    const fallbacks: Record<string, Record<string, string>> = {
      'en-hi': {
        'Mouse': 'माउस',
        'computer': 'कंप्यूटर',
        'button': 'बटन',
        'click': 'क्लिक करें'
      },
      'en-pa': {
        'Mouse': 'ਮਾਊਸ',
        'computer': 'ਕੰਪਿਊਟਰ',
        'button': 'ਬਟਨ',
        'click': 'ਕਲਿਕ ਕਰੋ'
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
