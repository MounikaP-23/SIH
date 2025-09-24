import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { offlineStorage } from './services/offlineStorage';
import { networkService } from './services/networkService';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Components
import LandingPage from './components/LandingPage';
import ExploreDigitalSkillsPage from './components/ExploreDigitalSkillsPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import LanguageSwitcher from './components/LanguageSwitcher';
import ParentDashboard from './components/ParentDashboard';

function App() {
  useEffect(() => {
    // Initialize offline storage and network service
    const initializeServices = async () => {
      try {
        await offlineStorage.init();
        console.log('Offline storage initialized');
        
        // Request notification permission
        await networkService.requestNotificationPermission();
        
        // Subscribe to push notifications if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
          await networkService.subscribeToPushNotifications();
        }
      } catch (error) {
        console.error('Failed to initialize services:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="App">
            <div className="position-fixed" style={{ top: 12, right: 12, zIndex: 1050 }}>
              <LanguageSwitcher />
            </div>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/explore/digital-skills/:classLevel" element={<ExploreDigitalSkillsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route 
                path="/student/*" 
                element={
                  <ProtectedRoute allowedRoles={['Student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teacher/*" 
                element={
                  <ProtectedRoute allowedRoles={['Teacher']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/*" 
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/parent/*" 
                element={
                  <ProtectedRoute allowedRoles={['Parent']}>
                    <ParentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
