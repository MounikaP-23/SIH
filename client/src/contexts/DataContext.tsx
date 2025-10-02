import React, { createContext, useContext, useState, ReactNode } from 'react';
import axios from 'axios';
import { offlineStorage } from '../services/offlineStorage';
import { networkService } from '../services/networkService';
import { useAuth } from './AuthContext';

interface Lesson {
  _id: string;
  title: string;
  description: string;
  subject: string;
  category: 'Digital Skills' | 'School Subjects' | 'Life Skills';
  classLevel: number;
  language: 'en' | 'hi' | 'pa';
  contentType: 'text' | 'video' | 'image' | 'mixed';
  content: string;
  videoLink?: string;
  images?: string[];
  attachments?: string[];
  quiz: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
    }>;
    isActive: boolean;
  };
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Progress {
  _id: string;
  student: string;
  lesson: {
    _id: string;
    title: string;
    subject: string;
    classLevel: number;
  };
  isCompleted: boolean;
  quizScore: number;
  totalQuestions: number;
  timeSpentSeconds?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
  // Enriched fields from API for averages and attempts
  attemptsCount?: number;
  averageScore?: number;
}

// Progress as seen by Teacher with populated student details
interface TeacherProgress {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    classLevel?: number;
  };
  lesson: {
    _id: string;
    title: string;
    subject: string;
    classLevel: number;
  };
  isCompleted: boolean;
  quizScore: number;
  totalQuestions: number;
  timeSpentSeconds?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'Student' | 'Teacher' | 'Admin';
  classLevel?: number;
  createdAt: string;
}

interface DataContextType {
  lessons: Lesson[];
  progress: Progress[];
  teacherProgress: TeacherProgress[];
  users: User[];
  loading: boolean;
  fetchLessons: (filters?: { subject?: string; classLevel?: number; language?: 'en' | 'hi' | 'pa'; category?: string; contentType?: string }) => Promise<void>;
  fetchProgress: () => Promise<void>;
  fetchTeacherProgress: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  createLesson: (lessonData: Partial<Lesson>) => Promise<void>;
  updateLesson: (id: string, lessonData: Partial<Lesson>) => Promise<void>;
  deleteLesson: (id: string) => Promise<void>;
  completeLesson: (lessonId: string, quizScore: number, totalQuestions: number, timeSpentSeconds?: number) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [teacherProgress, setTeacherProgress] = useState<TeacherProgress[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const lastLessonsQueryRef = React.useRef<string>('');
  const lastLessonsFetchTsRef = React.useRef<number>(0);
  const lessonsInFlightRef = React.useRef<boolean>(false);

  const fetchLessons = async (filters: { subject?: string; classLevel?: number; language?: 'en' | 'hi' | 'pa'; category?: string; contentType?: string } = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.classLevel) params.append('classLevel', filters.classLevel.toString());
      if (filters.language) params.append('language', filters.language);
      if (filters.category) params.append('category', filters.category);
      if (filters.contentType) params.append('contentType', filters.contentType);
      const query = params.toString();

      // If we already have lessons for the same query, short-circuit (avoid flashing spinner)
      if (lastLessonsQueryRef.current === query && lessons.length > 0) {
        return;
      }

      // Throttle: if the exact same query is requested while in-flight, or within a cooldown window, skip
      const now = Date.now();
      if (lessonsInFlightRef.current && lastLessonsQueryRef.current === query) {
        return;
      }
      // Cooldown window for identical queries (10 seconds) to avoid repeated traffic from multiple mounts
      if (lastLessonsQueryRef.current === query && now - lastLessonsFetchTsRef.current < 10000) {
        return;
      }

      lessonsInFlightRef.current = true;
      lastLessonsQueryRef.current = query;
      lastLessonsFetchTsRef.current = now;
      setLoading(true);

      // Try online first, fallback to offline
      try {
        const response = await networkService.fetchWithOfflineSupport(`/api/lessons?${query}`);
        const data = await response.json();
        setLessons(data);
        
        // Cache lessons for offline use
        if (response.ok) {
          await offlineStorage.saveLessons(data);
        }
      } catch (error) {
        console.error('Failed to fetch lessons:', error);
        // Try to get from offline storage
        const offlineLessons = await offlineStorage.getLessons(filters.classLevel, filters.subject);
        setLessons(offlineLessons);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      lessonsInFlightRef.current = false;
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/lessons/student/progress');
      setProgress(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherProgress = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/lessons/teacher/students-progress');
      // API returns { lessons, progress }
      setTeacherProgress(response.data.progress || []);
    } catch (error) {
      console.error('Error fetching teacher progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let response;
      try {
        // Admin endpoint (works for Admin)
        response = await axios.get('/api/auth/users');
      } catch (err: any) {
        // If forbidden for non-admins, fallback to teacher students list
        if (err?.response?.status === 403) {
          response = await axios.get('/api/auth/teacher/students');
        } else {
          throw err;
        }
      }
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLesson = async (lessonData: Partial<Lesson>) => {
    try {
      const response = await axios.post('/api/lessons', lessonData);
      setLessons(prev => [response.data, ...prev]);
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  };

  const updateLesson = async (id: string, lessonData: Partial<Lesson>) => {
    try {
      const response = await axios.put(`/api/lessons/${id}`, lessonData);
      setLessons(prev => prev.map(lesson => 
        lesson._id === id ? response.data : lesson
      ));
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  };

  const deleteLesson = async (id: string) => {
    try {
      await axios.delete(`/api/lessons/${id}`);
      setLessons(prev => prev.filter(lesson => lesson._id !== id));
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  };

  const completeLesson = async (lessonId: string, quizScore: number, totalQuestions: number, timeSpentSeconds?: number) => {
    const progressData = {
      lesson: lessonId,
      quizScore,
      totalQuestions,
      timeSpentSeconds,
      isCompleted: true,
      completedAt: new Date().toISOString()
    };

    try {
      if (networkService.getOnlineStatus()) {
        // Online: send to server
        const response = await axios.post(`/api/lessons/${lessonId}/complete`, {
          quizScore,
          totalQuestions,
          timeSpentSeconds
        });
        
        setProgress(prev => {
          const existing = prev.find(p => p.lesson._id === lessonId);
          if (existing) {
            return prev.map(p => p.lesson._id === lessonId ? response.data : p);
          } else {
            return [...prev, response.data];
          }
        });
      } else {
        // Offline: save locally and queue for sync
        await offlineStorage.saveProgress(progressData);
        await networkService.queueOfflineAction(
          `/api/lessons/${lessonId}/complete`,
          'POST',
          { quizScore, totalQuestions, timeSpentSeconds }
        );
        
        // Update local state
        setProgress(prev => {
          const existing = prev.find(p => p.lesson._id === lessonId);
          if (existing) {
            return prev.map(p => p.lesson._id === lessonId ? { 
              ...p, 
              quizScore: progressData.quizScore,
              totalQuestions: progressData.totalQuestions,
              timeSpentSeconds: progressData.timeSpentSeconds,
              isCompleted: progressData.isCompleted,
              completedAt: progressData.completedAt
            } : p);
          } else {
            // Create a proper Progress object for new entries
            const newProgress: Progress = {
              _id: `${user?.id}-${lessonId}`,
              student: user?.id || '',
              lesson: { _id: lessonId } as any,
              quizScore: progressData.quizScore,
              totalQuestions: progressData.totalQuestions,
              timeSpentSeconds: progressData.timeSpentSeconds,
              isCompleted: progressData.isCompleted,
              completedAt: progressData.completedAt,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            return [...prev, newProgress];
          }
        });
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
      
      // Fallback: save offline
      await offlineStorage.saveProgress(progressData);
      await networkService.queueOfflineAction(
        `/api/lessons/${lessonId}/complete`,
        'POST',
        { quizScore, totalQuestions, timeSpentSeconds }
      );
      
      throw error;
    }
  };

  const value = {
    lessons,
    progress,
    teacherProgress,
    users,
    loading,
    fetchLessons,
    fetchProgress,
    fetchTeacherProgress,
    fetchUsers,
    createLesson,
    updateLesson,
    deleteLesson,
    completeLesson
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
