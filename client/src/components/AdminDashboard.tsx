import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Container, Row, Col, Nav, Card, Button } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import ManageUsersPage from './admin/ManageUsersPage';
import AnalyticsPage from './admin/AnalyticsPage';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { users, lessons, progress, fetchUsers, fetchLessons } = useData();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchUsers();
    fetchLessons();
  }, []);

  useEffect(() => {
    const path = location.pathname.split('/')[2];
    if (path) setActiveTab(path);
  }, [location]);

  const students = users.filter(u => u.role === 'Student');
  const teachers = users.filter(u => u.role === 'Teacher');
  const totalLessons = lessons.length;
  const lessonsWithQuizzes = lessons.filter(lesson => 
    lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0
  ).length;

  const navItems = [
    { key: 'users', label: 'Manage Users', icon: 'fas fa-users', path: '/admin/users' },
    { key: 'analytics', label: 'Analytics', icon: 'fas fa-chart-bar', path: '/admin/analytics' }
  ];

  return (
    <div className="dashboard-container">
      <Row className="g-0">
        {/* Sidebar */}
        <Col md={3} lg={2}>
          <div className="sidebar">
            <div className="sidebar-header">
              <h4 className="sidebar-brand">EduPlatform</h4>
              <p className="text-white-50 mb-0">Admin Portal</p>
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
                    {activeTab === 'users' && 'Manage students, teachers, and user accounts'}
                    {activeTab === 'analytics' && 'View platform statistics and performance metrics'}
                  </p>
                </Col>
                <Col xs="auto">
                  <div className="d-flex gap-3">
                    <Card className="text-center p-3 border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                      <div className="h4 mb-0">{users.length}</div>
                      <small>Total Users</small>
                    </Card>
                    <Card className="text-center p-3 border-0" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                      <div className="h4 mb-0">{totalLessons}</div>
                      <small>Total Lessons</small>
                    </Card>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Content */}
            <Routes>
              <Route path="/" element={<ManageUsersPage />} />
              <Route path="/users" element={<ManageUsersPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
