import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Container, Row, Col, Nav, Card, Button } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import AddLessonPage from './teacher/AddLessonPage';
import MyLessonsPage from './teacher/MyLessonsPage';
import TrackStudentsPage from './teacher/TrackStudentsPage';
import ManageLessonsPage from './teacher/ManageLessonsPage';

const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { lessons, fetchLessons } = useData();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('lessons');

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    const path = location.pathname.split('/')[2];
    if (path) setActiveTab(path);
  }, [location]);

  const myLessons = lessons.filter(lesson => lesson.createdBy._id === user?.id);
  const totalLessons = myLessons.length;
  const lessonsWithQuizzes = myLessons.filter(lesson => 
    lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0
  ).length;

  const navItems = [
    { key: 'lessons', label: 'My Lessons', icon: 'fas fa-book', path: '/teacher/lessons' },
    { key: 'add-lesson', label: 'Add Lesson', icon: 'fas fa-plus', path: '/teacher/add-lesson' },
    { key: 'manage-lessons', label: 'Manage Lessons', icon: 'fas fa-edit', path: '/teacher/manage-lessons' },
    { key: 'students', label: 'Track Students', icon: 'fas fa-users', path: '/teacher/students' }
  ];

  return (
    <div className="dashboard-container">
      <Row className="g-0">
        {/* Sidebar */}
        <Col md={3} lg={2}>
          <div className="sidebar">
            <div className="sidebar-header">
              <h4 className="sidebar-brand">EduPlatform</h4>
              <p className="text-white-50 mb-0">Teacher Portal</p>
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
              <div className="text-white fw-semibold">{user?.name}</div>
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
                    {activeTab === 'lessons' && 'Manage your created lessons and content'}
                    {activeTab === 'add-lesson' && 'Create new lessons with interactive content and quizzes'}
                    {activeTab === 'manage-lessons' && 'Manage your lessons'}
                    {activeTab === 'students' && 'Monitor student progress and performance'}
                  </p>
                </Col>
                <Col xs="auto">
                  <div className="d-flex gap-3">
                    <Card className="text-center p-3 border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                      <div className="h4 mb-0">{totalLessons}</div>
                      <small>Total Lessons</small>
                    </Card>
                    <Card className="text-center p-3 border-0" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                      <div className="h4 mb-0">{lessonsWithQuizzes}</div>
                      <small>With Quizzes</small>
                    </Card>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Content */}
            <Routes>
              <Route path="/" element={<MyLessonsPage />} />
              <Route path="/lessons" element={<MyLessonsPage />} />
              <Route path="/add-lesson" element={<AddLessonPage />} />
              <Route path="/manage-lessons" element={<ManageLessonsPage />} />
              <Route path="/students" element={<TrackStudentsPage />} />
            </Routes>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherDashboard;
