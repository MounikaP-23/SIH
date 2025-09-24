import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, ProgressBar } from 'react-bootstrap';
import { useData } from '../../contexts/DataContext';

const AnalyticsPage: React.FC = () => {
  const { users, lessons, progress, loading, fetchUsers, fetchLessons } = useData();
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    totalLessons: 0,
    lessonsWithQuizzes: 0,
    totalProgress: 0,
    completedLessons: 0,
    averageScore: 0,
    subjectDistribution: [] as any[],
    classDistribution: [] as any[],
    recentActivity: [] as any[]
  });

  useEffect(() => {
    fetchUsers();
    fetchLessons();
  }, []);

  useEffect(() => {
    if (users.length > 0 || lessons.length > 0) {
      calculateAnalytics();
    }
  }, [users, lessons, progress]);

  const calculateAnalytics = () => {
    const students = users.filter(u => u.role === 'Student');
    const teachers = users.filter(u => u.role === 'Teacher');
    const admins = users.filter(u => u.role === 'Admin');
    
    const lessonsWithQuizzes = lessons.filter(lesson => 
      lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0
    );
    
    const completedLessons = progress.filter(p => p.isCompleted);
    const averageScore = completedLessons.length > 0 
      ? Math.round(completedLessons.reduce((sum, p) => sum + p.quizScore, 0) / completedLessons.length)
      : 0;

    // Subject distribution
    const subjectCount: { [key: string]: number } = {};
    lessons.forEach(lesson => {
      subjectCount[lesson.subject] = (subjectCount[lesson.subject] || 0) + 1;
    });
    const subjectDistribution = Object.entries(subjectCount).map(([subject, count]) => ({
      subject,
      count,
      percentage: Math.round((count / lessons.length) * 100)
    }));

    // Class distribution
    const classCount: { [key: number]: number } = {};
    lessons.forEach(lesson => {
      classCount[lesson.classLevel] = (classCount[lesson.classLevel] || 0) + 1;
    });
    const classDistribution = Object.entries(classCount).map(([classLevel, count]) => ({
      classLevel: parseInt(classLevel),
      count,
      percentage: Math.round((count / lessons.length) * 100)
    }));

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = [
      ...users.filter(u => new Date(u.createdAt) >= sevenDaysAgo).map(u => ({
        type: 'user_registered',
        message: `${u.name} (${u.role}) registered`,
        date: u.createdAt,
        icon: 'fas fa-user-plus'
      })),
      ...lessons.filter(l => new Date(l.createdAt) >= sevenDaysAgo).map(l => ({
        type: 'lesson_created',
        message: `New lesson "${l.title}" created`,
        date: l.createdAt,
        icon: 'fas fa-book'
      })),
      ...completedLessons.filter(p => new Date(p.completedAt || p.createdAt) >= sevenDaysAgo).map(p => ({
        type: 'lesson_completed',
        message: `Lesson completed with ${p.quizScore}% score`,
        date: p.completedAt || p.createdAt,
        icon: 'fas fa-check-circle'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    setAnalytics({
      totalUsers: users.length,
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalAdmins: admins.length,
      totalLessons: lessons.length,
      lessonsWithQuizzes: lessonsWithQuizzes.length,
      totalProgress: progress.length,
      completedLessons: completedLessons.length,
      averageScore,
      subjectDistribution,
      classDistribution,
      recentActivity
    });
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Key Metrics */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="text-center border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Card.Body className="p-4">
              <i className="fas fa-users fa-2x mb-3"></i>
              <h3 className="mb-1">{analytics.totalUsers}</h3>
              <p className="mb-0">Total Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <Card.Body className="p-4">
              <i className="fas fa-book fa-2x mb-3"></i>
              <h3 className="mb-1">{analytics.totalLessons}</h3>
              <p className="mb-0">Total Lessons</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <Card.Body className="p-4">
              <i className="fas fa-check-circle fa-2x mb-3"></i>
              <h3 className="mb-1">{analytics.completedLessons}</h3>
              <p className="mb-0">Completed Lessons</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <Card.Body className="p-4">
              <i className="fas fa-chart-line fa-2x mb-3"></i>
              <h3 className="mb-1">{analytics.averageScore}%</h3>
              <p className="mb-0">Average Score</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* User Distribution */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-users me-2"></i>
                User Distribution
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Students</span>
                  <span className="fw-bold">{analytics.totalStudents}</span>
                </div>
                <ProgressBar 
                  now={(analytics.totalStudents / analytics.totalUsers) * 100} 
                  variant="primary"
                  style={{ height: '8px' }}
                />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Teachers</span>
                  <span className="fw-bold">{analytics.totalTeachers}</span>
                </div>
                <ProgressBar 
                  now={(analytics.totalTeachers / analytics.totalUsers) * 100} 
                  variant="success"
                  style={{ height: '8px' }}
                />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Admins</span>
                  <span className="fw-bold">{analytics.totalAdmins}</span>
                </div>
                <ProgressBar 
                  now={(analytics.totalAdmins / analytics.totalUsers) * 100} 
                  variant="warning"
                  style={{ height: '8px' }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Subject Distribution */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-chart-pie me-2"></i>
                Subject Distribution
              </h5>
            </Card.Header>
            <Card.Body>
              {analytics.subjectDistribution.map((item, index) => (
                <div key={item.subject} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>{item.subject}</span>
                    <span className="fw-bold">{item.count} ({item.percentage}%)</span>
                  </div>
                  <ProgressBar 
                    now={item.percentage} 
                    variant={['primary', 'success', 'info', 'warning', 'danger'][index % 5]}
                    style={{ height: '8px' }}
                  />
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Class Distribution */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-graduation-cap me-2"></i>
                Class Level Distribution
              </h5>
            </Card.Header>
            <Card.Body>
              {analytics.classDistribution.map((item, index) => (
                <div key={item.classLevel} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Class {item.classLevel}</span>
                    <span className="fw-bold">{item.count} ({item.percentage}%)</span>
                  </div>
                  <ProgressBar 
                    now={item.percentage} 
                    variant={['primary', 'success', 'info', 'warning', 'danger', 'secondary'][index % 6]}
                    style={{ height: '8px' }}
                  />
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-clock me-2"></i>
                Recent Activity
              </h5>
            </Card.Header>
            <Card.Body>
              {analytics.recentActivity.length === 0 ? (
                <p className="text-muted text-center">No recent activity</p>
              ) : (
                <div className="activity-feed">
                  {analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="d-flex align-items-start mb-3">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                           style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                        <i className={activity.icon}></i>
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-1">{activity.message}</p>
                        <small className="text-muted">
                          {new Date(activity.date).toLocaleDateString()} at {new Date(activity.date).toLocaleTimeString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Platform Statistics */}
        <Col lg={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-chart-bar me-2"></i>
                Platform Statistics
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-4">
                <Col md={3}>
                  <div className="text-center">
                    <div className="h2 text-primary mb-1">{analytics.lessonsWithQuizzes}</div>
                    <p className="text-muted mb-0">Lessons with Quizzes</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <div className="h2 text-success mb-1">
                      {analytics.totalLessons > 0 ? Math.round((analytics.lessonsWithQuizzes / analytics.totalLessons) * 100) : 0}%
                    </div>
                    <p className="text-muted mb-0">Quiz Coverage</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <div className="h2 text-info mb-1">
                      {analytics.totalProgress > 0 ? Math.round((analytics.completedLessons / analytics.totalProgress) * 100) : 0}%
                    </div>
                    <p className="text-muted mb-0">Completion Rate</p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <div className="h2 text-warning mb-1">
                      {analytics.averageScore >= 80 ? 'Excellent' : analytics.averageScore >= 60 ? 'Good' : 'Needs Improvement'}
                    </div>
                    <p className="text-muted mb-0">Overall Performance</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsPage;
