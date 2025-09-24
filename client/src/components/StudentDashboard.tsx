import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Container, Row, Col, Nav, Card, Button, Badge, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import LessonsPage from './student/LessonsPage';
import QuizzesPage from './student/QuizzesPage';
import ProgressPage from './student/ProgressPage';
import LessonViewer from './student/LessonViewer';
import VoiceTest from './student/VoiceTest';

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { fetchProgress, progress, fetchLessons } = useData();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('lessons');

  useEffect(() => {
    fetchProgress();
  }, []);

  useEffect(() => {
    const path = location.pathname.split('/')[2];
    if (path) setActiveTab(path);
  }, [location]);

  // Removed auto-fetch for Quizzes tab; QuizzesPage fetches lessons on demand

  const completedLessons = progress.filter(p => p.isCompleted).length;
  const totalLessons = progress.length;
  const averageScore = progress.length > 0 
    ? Math.round(
        progress.reduce((sum, p) => sum + (typeof p.averageScore === 'number' ? p.averageScore : p.quizScore || 0), 0) / progress.length
      )
    : 0;
  const remaining = Math.max(totalLessons - completedLessons, 0);

  const navItems = [
    { key: 'lessons', label: 'Lessons', icon: 'fas fa-book', path: '/student/lessons' },
    { key: 'quizzes', label: 'Quizzes', icon: 'fas fa-question-circle', path: '/student/quizzes' },
    { key: 'progress', label: 'Progress', icon: 'fas fa-chart-line', path: '/student/progress' },
    { key: 'voice-test', label: 'Voice Test', icon: 'fas fa-volume-up', path: '/student/voice-test' }
  ];

  return (
    <div className="dashboard-container">
      <Row className="g-0">
        {/* Sidebar */}
        <Col md={3} lg={2}>
          <div className="sidebar">
            <div className="sidebar-header">
              <h4 className="sidebar-brand">EduPlatform</h4>
              <p className="text-white-50 mb-0">Student Portal</p>
            </div>
            
            <Nav className="flex-column sidebar-nav">
              {navItems.map(item => (
                <Nav.Item key={item.key} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link ${activeTab === item.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.key)}
                  >
                    <i className={`nav-icon ${item.icon}`}></i>
                    {item.label}
                  </Link>
                </Nav.Item>
              ))}
            </Nav>

            <div className="mt-auto p-3">
              <div className="text-white-50 small mb-2">Welcome back,</div>
              <div className="text-white fw-semibold d-flex align-items-center gap-2">
                <span>{user?.name}</span>
                {user?.studentCode && (
                  <Badge bg="light" text="dark">{user.studentCode}</Badge>
                )}
              </div>
              {user?.classLevel && (
                <div className="text-white-50 small">Class {user.classLevel}</div>
              )}
              <Button
                variant="outline-light"
                size="sm"
                className="mt-2 w-100"
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          </div>
        </Col>

        {/* Main Content */}
        <Col md={9} lg={10}>
          <div className="main-content">
            {/* Header */}
            <div className="content-header">
              <Row className="align-items-center">
                <Col>
                  <h1 className="page-title">
                    {navItems.find(item => item.key === activeTab)?.label || 'Dashboard'}
                  </h1>
                  <p className="page-subtitle">
                    {activeTab === 'lessons' && 'Explore and learn from our comprehensive lesson library'}
                    {activeTab === 'quizzes' && 'Test your knowledge with interactive quizzes'}
                    {activeTab === 'progress' && 'Track your learning journey and achievements'}
                    {activeTab === 'voice-test' && 'Test voice functionality and language support'}
                  </p>
                  {user?.studentCode && (
                    <div className="mt-3">
                      <Card className="border-primary">
                        <Card.Body className="py-2">
                          <Row className="align-items-center">
                            <Col xs="auto">
                              <i className="fas fa-id-card text-primary"></i>
                            </Col>
                            <Col>
                              <small className="text-muted">Your Student ID</small>
                              <div className="fw-bold text-primary">{user.studentCode}</div>
                            </Col>
                            <Col xs="auto">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(user.studentCode || '');
                                  alert('Student ID copied to clipboard!');
                                }}
                              >
                                <i className="fas fa-copy"></i>
                              </Button>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </div>
                  )}
                </Col>
                <Col xs="auto">
                  <div className="d-flex gap-3 flex-wrap">
                    <Card className="text-center p-3 border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                      <div className="h4 mb-0">{completedLessons}</div>
                      <small>Completed</small>
                    </Card>
                    <Card className="text-center p-3 border-0" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                      <div className="h4 mb-0">{averageScore}%</div>
                      <small>Avg Score</small>
                    </Card>
                    <Card className="text-center p-3 border-0" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                      <div className="h4 mb-0">{remaining}</div>
                      <small>Remaining</small>
                    </Card>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Content */}
            <Routes>
              <Route path="/" element={<LessonsPage />} />
              <Route path="/lessons" element={<LessonsPage />} />
              <Route path="/lessons/:id" element={<LessonViewer />} />
              <Route path="/quizzes" element={<QuizzesPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/voice-test" element={<VoiceTest />} />
            </Routes>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default StudentDashboard;
