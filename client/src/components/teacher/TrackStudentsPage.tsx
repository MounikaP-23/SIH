import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Table, Badge, ProgressBar, Spinner, Form, Button } from 'react-bootstrap';
import { useData } from '../../contexts/DataContext';

interface StudentProgress {
  studentId: string;
  name: string;
  email: string;
  classLevel?: number;
  completed: number;
  total: number;
  averageScore: number;
  lastActive: string;
  subjects: {
    [key: string]: {
      completed: number;
      total: number;
      averageScore: number;
    };
  };
}

const TrackStudentsPage: React.FC = () => {
  const { users, teacherProgress, loading, fetchUsers, fetchTeacherProgress } = useData();
  const [filteredStudents, setFilteredStudents] = useState<StudentProgress[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'all' | '7d' | '30d'>('all');

  useEffect(() => {
    fetchUsers();
    fetchTeacherProgress();
  }, []);

  const handleRefresh = () => {
    fetchUsers();
    fetchTeacherProgress();
  };

  useEffect(() => {
    const students = users
      .filter(user => user.role === 'Student' && 
        (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         user.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (classFilter ? (user as any).classLevel === parseInt(classFilter) : true)
      )
      .map(student => {
        const studentProgress = teacherProgress.filter(p => p.student && p.student._id === student._id);
        const completed = studentProgress.filter(p => p.isCompleted);
        const averageScore = completed.length > 0 
          ? Math.round(completed.reduce((sum, p) => sum + p.quizScore, 0) / completed.length)
          : 0;
        
        // Group by lesson subject
        const subjects = studentProgress.reduce((acc, p) => {
          const subject = p.lesson?.subject || 'General';
          if (!acc[subject]) {
            acc[subject] = { completed: 0, total: 0, totalScore: 0 } as any;
          }
          acc[subject].total++;
          if (p.isCompleted) {
            acc[subject].completed++;
            acc[subject].totalScore += p.quizScore;
          }
          return acc;
        }, {} as {[key: string]: {completed: number, total: number, totalScore: number}});

        // Calculate average scores per subject
        const subjectsWithAverages = Object.entries(subjects).reduce((acc, [subj, data]) => {
          acc[subj] = {
            completed: data.completed,
            total: data.total,
            averageScore: data.completed > 0 ? Math.round(data.totalScore / data.completed) : 0
          };
          return acc;
        }, {} as {[key: string]: {completed: number, total: number, averageScore: number}});

        return {
          studentId: student._id,
          name: student.name,
          email: student.email,
          classLevel: (student as any).classLevel,
          completed: completed.length,
          total: studentProgress.length,
          averageScore,
          lastActive: studentProgress.length > 0 
            ? new Date(Math.max(...studentProgress.map(p => new Date(p.createdAt).getTime()))).toLocaleDateString()
            : 'Never',
          subjects: subjectsWithAverages
        };
      })
      .sort((a, b) => b.averageScore - a.averageScore);

    setFilteredStudents(students);
  }, [users, teacherProgress, searchTerm, classFilter]);

  // Date windowed progress list
  const windowedProgress = useMemo(() => {
    if (timeRange === 'all') return teacherProgress;
    const now = Date.now();
    const cutoff = timeRange === '7d' ? now - 7 * 24 * 60 * 60 * 1000 : now - 30 * 24 * 60 * 60 * 1000;
    return teacherProgress.filter(p => new Date(p.updatedAt || p.completedAt || p.createdAt).getTime() >= cutoff);
  }, [teacherProgress, timeRange]);

  // KPI cards derived from windowedProgress
  const kpis = useMemo(() => {
    const uniqueStudents = new Set<string>();
    let completedCount = 0;
    let totalCount = 0;
    let scoreSum = 0;
    let scoreNum = 0;
    windowedProgress.forEach(p => {
      if (p.student?._id) uniqueStudents.add(p.student._id);
      totalCount += 1;
      if (p.isCompleted) {
        completedCount += 1;
        if (typeof p.quizScore === 'number') {
          scoreSum += p.quizScore;
          scoreNum += 1;
        }
      }
    });
    const avgCompletionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const avgScore = scoreNum > 0 ? Math.round(scoreSum / scoreNum) : 0;
    return {
      activeStudents: uniqueStudents.size,
      totalEvents: totalCount,
      completionRate: avgCompletionRate,
      averageScore: avgScore,
    };
  }, [windowedProgress]);

  // Leaderboards (UI-only) derived from windowedProgress
  const completionLeaderboard = useMemo(() => {
    const events = windowedProgress
      .filter(p => p.isCompleted)
      .map(p => ({
        when: new Date(p.completedAt || p.updatedAt || p.createdAt).getTime(),
        studentName: p.student?.name || 'Unknown',
        studentEmail: p.student?.email || '',
        lessonTitle: p.lesson?.title || 'Lesson',
        classLevel: p.lesson?.classLevel,
      }))
      .sort((a, b) => a.when - b.when);
    return events.slice(0, 10);
  }, [windowedProgress]);

  const quizLeaderboard = useMemo(() => {
    const rows = windowedProgress
      .filter(p => p.isCompleted)
      .map(p => ({
        score: p.quizScore || 0,
        totalQuestions: p.totalQuestions || 0,
        when: new Date(p.completedAt || p.updatedAt || p.createdAt).getTime(),
        studentName: p.student?.name || 'Unknown',
        studentEmail: p.student?.email || '',
        lessonTitle: p.lesson?.title || 'Lesson',
        classLevel: p.lesson?.classLevel,
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.when - b.when; // earlier wins tie
      });
    return rows.slice(0, 10);
  }, [windowedProgress]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Satisfactory';
    if (score >= 60) return 'Needs Improvement';
    return 'Needs Attention';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Filters and KPIs */}
      <Row className="align-items-center mb-3">
        <Col md={4} className="mb-2 mb-md-0">
          <div className="d-flex gap-2">
            <Form.Select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)}>
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </Form.Select>
            <Button variant="outline-primary" onClick={handleRefresh}>
              <i className="fas fa-rotate"></i> Refresh
            </Button>
          </div>
        </Col>
        <Col md={8}>
          <Row className="g-3">
            <Col md={3} sm={6} xs={6}>
              <Card className="border-0" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <Card.Body className="py-3 text-center">
                  <div className="h4 mb-0">{kpis.activeStudents}</div>
                  <small>Active Students</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} xs={6}>
              <Card className="border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Card.Body className="py-3 text-center">
                  <div className="h4 mb-0">{kpis.totalEvents}</div>
                  <small>Progress Events</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} xs={6}>
              <Card className="border-0" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                <Card.Body className="py-3 text-center">
                  <div className="h4 mb-0">{kpis.completionRate}%</div>
                  <small>Completion Rate</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6} xs={6}>
              <Card className="border-0" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                <Card.Body className="py-3 text-center">
                  <div className="h4 mb-0">{kpis.averageScore}%</div>
                  <small>Average Score</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
      {/* Leaderboards */}
      <Row className="mb-4">
        <Col md={6} className="mb-3 mb-md-0">
          <Card className="h-100">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">First to Complete</h5>
                <span className="text-muted small">Top 10</span>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                <Table hover responsive className="mb-0">
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Lesson</th>
                      <th>Completed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completionLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-muted">No completions yet</td>
                      </tr>
                    ) : (
                      completionLeaderboard.map((e, idx) => (
                        <tr key={`${e.studentEmail}-${e.when}-${idx}`}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="fw-semibold">{e.studentName}</div>
                            <div className="small text-muted">Class {e.classLevel ?? '-'}</div>
                          </td>
                          <td>{e.lessonTitle}</td>
                          <td>{new Date(e.when).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Top Quiz Scores</h5>
                <span className="text-muted small">Top 10</span>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                <Table hover responsive className="mb-0">
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Lesson</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-muted">No quiz results yet</td>
                      </tr>
                    ) : (
                      quizLeaderboard.map((e, idx) => (
                        <tr key={`${e.studentEmail}-${e.when}-${idx}`}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="fw-semibold">{e.studentName}</div>
                            <div className="small text-muted">Class {e.classLevel ?? '-'}</div>
                          </td>
                          <td>{e.lessonTitle}</td>
                          <td>
                            <Badge bg={getScoreColor(e.score)}>{e.score}%</Badge>
                            <span className="small text-muted ms-2">{new Date(e.when).toLocaleDateString()}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="mb-4">
        <Col md={8}>
          <h4>Student Progress</h4>
          <p className="text-muted">Track and monitor student performance and progress</p>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Control
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={3}>
          <Form.Group className="d-flex align-items-center gap-2">
            <Form.Label className="mb-0">Class</Form.Label>
            <Form.Select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">All Classes</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(level => (
                <option key={level} value={level}>Class {level}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={selectedStudent ? 8 : 12}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Student Overview</h5>
              <div className="text-muted small">
                Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <Table hover className="mb-0">
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                    <tr>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Progress</th>
                      <th>Average Score</th>
                      <th>Last Active</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => {
                      const completionRate = student.total > 0 
                        ? Math.round((student.completed / student.total) * 100) 
                        : 0;
                      
                      return (
                        <tr 
                          key={student.studentId} 
                          className={selectedStudent === student.studentId ? 'table-active' : ''}
                          onClick={() => setSelectedStudent(
                            selectedStudent === student.studentId ? null : student.studentId
                          )}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                                  style={{ width: '36px', height: '36px' }}>
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-semibold">{student.name}</div>
                                <div className="text-muted small">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {student.classLevel ? `Class ${student.classLevel}` : '—'}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                                <div 
                                  className="progress-bar bg-primary" 
                                  role="progressbar" 
                                  style={{ width: `${completionRate}%` }}
                                  aria-valuenow={completionRate}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <div className="small" style={{ minWidth: '40px' }}>
                                {student.completed}/{student.total}
                              </div>
                            </div>
                            <div className="small text-muted">
                              {Object.entries(student.subjects).map(([subj, data]) => (
                                <span key={subj} className="me-2">
                                  {subj}: {data.completed}/{data.total}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="me-2 fw-bold" style={{ minWidth: '40px' }}>
                                {student.averageScore}%
                              </div>
                              <div style={{ width: '80px' }}>
                                <ProgressBar 
                                  now={student.averageScore} 
                                  variant={getScoreColor(student.averageScore)}
                                  style={{ height: '6px' }}
                                />
                              </div>
                            </div>
                            <div className="small text-muted">
                              {Object.entries(student.subjects).map(([subj, data]) => (
                                <span key={subj} className="me-2">
                                  {subj}: {data.averageScore}%
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div className="small">{student.lastActive}</div>
                            <div className="small text-muted">
                              {student.completed} lessons completed
                            </div>
                          </td>
                          <td>
                            <Badge 
                              bg={
                                completionRate === 100 ? 'success' : 
                                completionRate >= 50 ? 'primary' : 'warning'
                              }
                              className="text-uppercase"
                            >
                              {getScoreBadge(student.averageScore)}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {selectedStudent && (
          <Col md={4}>
            <Card className="sticky-top" style={{ top: '1rem' }}>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Progress Details</h5>
                <button 
                  className="btn-close" 
                  onClick={() => setSelectedStudent(null)}
                  aria-label="Close"
                ></button>
              </Card.Header>
              <Card.Body>
                {(() => {
                  const student = filteredStudents.find(s => s.studentId === selectedStudent);
                  if (!student) return null;
                  
                  const subjects = Object.keys(student.subjects);
                  if (subjects.length === 0) {
                    return <div className="text-center p-4">No progress data available</div>;
                  }
                  
                  return (
                    <>
                      <h6 className="text-center mb-3">{student.name}'s Progress by Subject</h6>
                      <Table size="sm" className="mb-0">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Completed</th>
                            <th>Avg. Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {subjects.map(subj => (
                            <tr key={subj}>
                              <td>{subj}</td>
                              <td>
                                {student.subjects[subj].completed}/{student.subjects[subj].total}
                              </td>
                              <td>
                                <Badge bg={getScoreColor(student.subjects[subj].averageScore)}>
                                  {student.subjects[subj].averageScore}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </>
                  );
                })()}
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default TrackStudentsPage;
