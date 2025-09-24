import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const QuizzesPage: React.FC = () => {
  const { progress } = useData();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Fetch quizzes for the logged-in student
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        let res = await axios.get('/api/lessons/student/quizzes');
        if (!mounted) return;
        // Optionally filter again by classLevel in UI safety net
        let items = Array.isArray(res.data) ? res.data : [];
        // Fallback: if API not available (e.g., server not restarted) or returns empty but lessons exist globally,
        // fetch from /api/lessons and filter client-side so the page still works.
        if ((!items || items.length === 0) && (!res || res.status !== 200)) {
          try {
            const all = await axios.get('/api/lessons');
            items = Array.isArray(all.data) ? all.data : [];
          } catch (fallbackErr) {
            // keep items as []
          }
        }
        const filtered = items.filter((lesson: any) => {
          const hasQuiz = lesson?.quiz?.questions?.length > 0;
          const isActive = hasQuiz ? lesson.quiz.isActive !== false : false;
          const classMatch = user?.classLevel ? lesson.classLevel === user.classLevel : true;
          return hasQuiz && isActive && classMatch;
        });
        setQuizzes(filtered);
      } catch (e) {
        console.error('Failed to load student quizzes', e);
        setError('Unable to load quizzes. Please try again.');
        setQuizzes([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [user?.classLevel]);

  // Debugging helper
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[QuizzesPage] quizzes loaded:', quizzes.length);
    }
  }, [quizzes]);

  const statsByLesson = useMemo(() => {
    const map = new Map<string, { avg?: number; attempts?: number }>();
    progress.forEach(p => {
      if (p.lesson?._id) {
        map.set(p.lesson._id, { avg: p.averageScore, attempts: p.attemptsCount });
      }
    });
    return map;
  }, [progress]);

  // Only block the page with a spinner on initial load
  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert alert-warning" role="alert">{error}</div>
      )}
      <Row className="g-4">
        {quizzes.length === 0 ? (
          <Col>
            <Card className="text-center p-5">
              <Card.Body>
                <i className="fas fa-question-circle fa-3x text-muted mb-3"></i>
                <h4>No quizzes available</h4>
                <p className="text-muted">Either none are assigned to your class yet, or they are inactive. Please check back later.</p>
              </Card.Body>
            </Card>
          </Col>
        ) : null}
        {quizzes.length === 0 ? (
          <Col>
            <Card className="text-center p-5">
              <Card.Body>
                <i className="fas fa-question-circle fa-3x text-muted mb-3"></i>
                <h4>No quizzes available</h4>
                <p className="text-muted">Complete some lessons to unlock quizzes, or check back later for new content.</p>
                <Link to="/student/lessons">
                  <Button variant="primary">
                    <i className="fas fa-book me-2"></i>
                    Browse Lessons
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ) : (
          quizzes.map(lesson => {
            const stats = statsByLesson.get(lesson._id) || {};
            const hasStats = typeof stats.avg === 'number' && (stats.attempts || 0) > 0;
            return (
            <Col key={lesson._id} md={6} lg={4}>
              <Card className="lesson-card h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <Badge bg="primary" className="me-2">{lesson.subject}</Badge>
                      <Badge bg="secondary">Class {lesson.classLevel}</Badge>
                    </div>
                    <div className="d-flex flex-column align-items-end">
                      <Badge bg="success" className="mb-1">
                        <i className="fas fa-question-circle me-1"></i>
                        {lesson.quiz.questions.length} Questions
                      </Badge>
                      {hasStats ? (
                        <Badge bg="info">Avg: {Math.round((stats.avg || 0))}% ({stats.attempts} attempt{(stats.attempts||0) > 1 ? 's' : ''})</Badge>
                      ) : (
                        <Badge bg="secondary">Not attempted</Badge>
                      )}
                    </div>
                  </div>
                  
                  <h5 className="lesson-title">{lesson.title} - Quiz</h5>
                  <p className="lesson-description flex-grow-1">
                    Test your knowledge of {lesson.title} with this interactive quiz.
                  </p>
                  
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <small className="text-muted">
                        by {lesson.createdBy.name}
                      </small>
                      <small className="text-muted">
                        {new Date(lesson.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                    
                    <Link to={`/student/lessons/${lesson._id}?startQuiz=1`}>
                      <Button variant="success" className="w-100">
                        <i className="fas fa-play me-2"></i>
                        Start Quiz
                      </Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
          })
        )}
      </Row>
    </div>
  );
};

export default QuizzesPage;
