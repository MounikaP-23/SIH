// Offline storage service using IndexedDB
class OfflineStorageService {
  private dbName = 'EduPlatformDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('lessons')) {
          const lessonsStore = db.createObjectStore('lessons', { keyPath: '_id' });
          lessonsStore.createIndex('classLevel', 'classLevel', { unique: false });
          lessonsStore.createIndex('subject', 'subject', { unique: false });
        }

        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', { keyPath: 'id' });
          progressStore.createIndex('student', 'student', { unique: false });
          progressStore.createIndex('lesson', 'lesson', { unique: false });
        }

        if (!db.objectStoreNames.contains('translations')) {
          db.createObjectStore('translations', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('offlineActions')) {
          const offlineStore = db.createObjectStore('offlineActions', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          offlineStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  // Lessons storage
  async saveLessons(lessons: any[]): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['lessons'], 'readwrite');
    const store = transaction.objectStore('lessons');
    
    for (const lesson of lessons) {
      await new Promise((resolve, reject) => {
        const request = store.put(lesson);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
  }

  async getLessons(classLevel?: number, subject?: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['lessons'], 'readonly');
    const store = transaction.objectStore('lessons');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let lessons = request.result;
        
        if (classLevel) {
          lessons = lessons.filter(lesson => lesson.classLevel === classLevel);
        }
        
        if (subject) {
          lessons = lessons.filter(lesson => lesson.subject === subject);
        }
        
        resolve(lessons);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Progress storage
  async saveProgress(progress: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['progress'], 'readwrite');
    const store = transaction.objectStore('progress');
    
    await new Promise((resolve, reject) => {
      const request = store.put({
        ...progress,
        id: `${progress.student}-${progress.lesson}`,
        timestamp: Date.now()
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProgress(studentId: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['progress'], 'readonly');
    const store = transaction.objectStore('progress');
    const index = store.index('student');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(studentId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Translation cache
  async saveTranslation(key: string, translation: string, source: string, target: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['translations'], 'readwrite');
    const store = transaction.objectStore('translations');
    
    await new Promise((resolve, reject) => {
      const request = store.put({
        key: `${source}-${target}-${key}`,
        translation,
        source,
        target,
        timestamp: Date.now()
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTranslation(key: string, source: string, target: string): Promise<string | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['translations'], 'readonly');
    const store = transaction.objectStore('translations');
    
    return new Promise((resolve, reject) => {
      const request = store.get(`${source}-${target}-${key}`);
      request.onsuccess = () => {
        const result = request.result;
        if (result && (Date.now() - result.timestamp) < 7 * 24 * 60 * 60 * 1000) { // 7 days
          resolve(result.translation);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Offline actions queue
  async queueOfflineAction(action: any): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');
    
    await new Promise((resolve, reject) => {
      const request = store.add({
        ...action,
        timestamp: Date.now(),
        retries: 0
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineActions(): Promise<any[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['offlineActions'], 'readonly');
    const store = transaction.objectStore('offlineActions');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearOfflineAction(id: number): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');
    
    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Network status
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Clear all data
  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    
    const stores = ['lessons', 'progress', 'translations', 'offlineActions'];
    
    for (const storeName of stores) {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
  }
}

export const offlineStorage = new OfflineStorageService();
