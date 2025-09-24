import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Form, Button, Badge, Spinner, Modal, DropdownButton, Dropdown } from 'react-bootstrap';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import SimpleVoiceControl from './SimpleVoiceControl';

const LessonsPage: React.FC = () => {
  const { lessons, loading, fetchLessons } = useData();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    subject: '',
    classLevel: user?.classLevel ? String(user.classLevel) : '',
    language: user?.languagePreference || '',
    category: '',
    contentType: ''
  });
  const navigate = useNavigate();
  const [previewLesson, setPreviewLesson] = useState<any | null>(null);

  // Auto-fetch lessons for the student's class on first load

  useEffect(() => {
    setFilters(prev => ({ ...prev, language: user?.languagePreference || '', classLevel: user?.classLevel ? String(user.classLevel) : '' }));
  }, [user?.languagePreference, user?.classLevel]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Prevent changing classLevel filter by student
    if (name === 'classLevel' && user?.role === 'Student') {
      return;
    }
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const [showEmpty, setShowEmpty] = useState(true);
  const [autoLoaded, setAutoLoaded] = useState(false);

  const applyFilters = () => {
    const filterParams: any = {};
    if (filters.subject) filterParams.subject = filters.subject;
    // Always use fixed classLevel for students
    if (user?.role === 'Student' && user.classLevel) {
      filterParams.classLevel = user.classLevel;
    } else if (filters.classLevel) {
      filterParams.classLevel = parseInt(filters.classLevel);
    }
    if (filters.language) filterParams.language = filters.language as 'en' | 'hi' | 'pa';
    if (filters.category) filterParams.category = filters.category;
    // Content type filter removed
    
    const noFiltersSelected =
      !filters.subject && !(user?.role === 'Student' ? user.classLevel : filters.classLevel) && !filters.language && !filters.category;

    if (noFiltersSelected) {
      setShowEmpty(true);
      return;
    }

    setShowEmpty(false);
    fetchLessons(filterParams);
  };

  const clearFilters = () => {
    setFilters({ subject: '', classLevel: '', language: user?.languagePreference || '', category: '', contentType: '' });
    setShowEmpty(true);
  };

  const quickDigitalSkills = () => {
    const newFilters = { ...filters, category: 'Digital Skills' };
    setFilters(newFilters);
    fetchLessons({ category: 'Digital Skills', language: newFilters.language as any });
  };

  // Auto-load by student's standard (classLevel) when available
  useEffect(() => {
    if (!autoLoaded && user?.role === 'Student' && user.classLevel) {
      const params: any = { classLevel: user.classLevel };
      if (filters.language) params.language = filters.language as 'en' | 'hi' | 'pa';
      setFilters(prev => ({
        ...prev,
        classLevel: String(user.classLevel),
      }));
      setShowEmpty(false);
      setAutoLoaded(true);
      fetchLessons(params);
    }
    // Intentionally omit fetchLessons from deps to avoid function identity changes causing loops
  }, [autoLoaded, user?.classLevel, user?.role, filters.language]);

  // Separate lessons with quizzes
  const quizzes = lessons.filter(lesson => lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0);
  const nonQuizLessons = lessons.filter(lesson => !lesson.quiz || !lesson.quiz.questions || lesson.quiz.questions.length === 0);

  const subjects = ['Math', 'Science', 'English', 'Punjabi', 'Social Studies', 'Computer Science'];
  const classLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'pa', label: 'Punjabi' }
  ];
  const categories = ['Digital Skills', 'School Subjects', 'Life Skills'];
  // Content types removed from UI

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Quick actions */}
      <div className="d-flex justify-content-end mb-3">
        <Button variant="success" size="sm" onClick={quickDigitalSkills}>
          <i className="fas fa-bolt me-2"></i>
          Show Digital Skills
        </Button>
      </div>

      {/* Filters */}
      <Card className="filter-container mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={2}>
              <Form.Label>Subject</Form.Label>
              <Form.Select
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </Form.Select>
            </Col>
            {/* Remove class level dropdown for students */}
            {user?.role !== 'Student' && (
              <Col md={2}>
                <Form.Label>Class Level</Form.Label>
                <Form.Select
                  name="classLevel"
                  value={filters.classLevel}
                  onChange={handleFilterChange}
                >
                  <option value="">All Classes</option>
                  {classLevels.map(level => (
                    <option key={level} value={level}>Class {level}</option>
                  ))}
                </Form.Select>
              </Col>
            )}
            <Col md={2}>
              <Form.Label>Language</Form.Label>
              <Form.Select
                name="language"
                value={filters.language}
                onChange={handleFilterChange}
              >
                <option value="">All Languages</option>
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Form.Select>
            </Col>
            {/* Content Type filter removed */}
            <Col md={12} className="d-flex align-items-end gap-2">
              <Button variant="primary" onClick={applyFilters} className="flex-fill">
                Apply Filters
              </Button>
              <Button variant="outline-secondary" onClick={clearFilters}>
                Clear
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Quizzes section intentionally removed - quizzes are listed in the dedicated Quizzes tab */}

      {/* Lessons Grid */}
      {showEmpty ? (
        <div style={{ minHeight: '120px' }}></div>
      ) : (
        <Row className="g-4">
          {lessons.length === 0 ? (
            <Col>
              <Card className="text-center p-5">
                <Card.Body>
                  <i className="fas fa-book fa-3x text-muted mb-3"></i>
                  <h4>No lessons found</h4>
                  <p className="text-muted">Try adjusting your filters or check back later for new content.</p>
                </Card.Body>
              </Card>
            </Col>
          ) : (
            lessons.map(lesson => (
              <Col key={lesson._id} md={6} lg={4}>
                <Card className="lesson-card h-100">
                  <Card.Body className="d-flex flex-column">
                    <div className="lesson-meta mb-3">
                      <Badge bg="primary" className="meta-badge">
                        {lesson.subject}
                      </Badge>
                      <Badge bg="secondary" className="meta-badge">
                        Class {lesson.classLevel}
                      </Badge>
                      <Badge bg="info" className="meta-badge">
                        {lesson.language}
                      </Badge>
                    </div>
                    
                    <h5 className="lesson-title">{lesson.title}</h5>
                    <p className="lesson-description flex-grow-1">
                      {lesson.description}
                    </p>
                    
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">
                          by {lesson.createdBy.name}
                        </small>
                        <div className="d-flex gap-2 align-items-center">
                          <DropdownButton id={`lang-dd-${lesson._id}`} title="Language" variant="outline-secondary" size="sm">
                            <Dropdown.Item as={Link} to={`/student/lessons/${lesson._id}?lang=en`}>English</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/student/lessons/${lesson._id}?lang=hi`}>Hindi</Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/student/lessons/${lesson._id}?lang=pa`}>Punjabi</Dropdown.Item>
                          </DropdownButton>
                        <SimpleVoiceControl 
                          key={`voice-${lesson.language}-${lesson._id}`}
                          text={`${lesson.title}. ${lesson.description}`}
                          language={lesson.language}
                        />
                        </div>
                      </div>
                      <div className="d-flex justify-content-center">
                        <Link to={`/student/lessons/${lesson._id}`}>
                          <Button variant="primary" size="lg">
                            <i className="fas fa-play me-2"></i>
                            Start Lesson
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}
    {/* Preview Modal */}
    <Modal show={!!previewLesson} onHide={() => setPreviewLesson(null)} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Lesson Preview{previewLesson ? `: ${previewLesson.title}` : ''}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {previewLesson && (
          <>
            <div className="mb-3 text-muted">{previewLesson.description}</div>
            {previewLesson.videoLink && (
              <div className="mb-3">
                <div className="ratio ratio-16x9">
                  <iframe src={previewLesson.videoLink} title={previewLesson.title} allowFullScreen></iframe>
                </div>
              </div>
            )}
            <div className="border rounded p-3 bg-light" dangerouslySetInnerHTML={{ __html: previewLesson.content }} />
            {previewLesson.images && previewLesson.images.length > 0 && (
              <Row className="mt-3">
                {previewLesson.images.map((img: string, idx: number) => (
                  <Col md={6} key={idx} className="mb-2">
                    <img src={img} alt={`preview-${idx}`} className="img-fluid rounded" />
                  </Col>
                ))}
              </Row>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={() => setPreviewLesson(null)}>Close</Button>
        <Button
          variant={previewLesson && previewLesson.quiz && previewLesson.quiz.questions && previewLesson.quiz.questions.length > 0 ? 'success' : 'outline-secondary'}
          disabled={!(previewLesson && previewLesson.quiz && previewLesson.quiz.questions && previewLesson.quiz.questions.length > 0)}
          onClick={() => {
            if (!previewLesson) return;
            setPreviewLesson(null);
            navigate(`/student/lessons/${previewLesson._id}?startQuiz=1`);
          }}
        >
          <i className="fas fa-question-circle me-2"></i>
          Start Quiz
        </Button>
      </Modal.Footer>
    </Modal>
  </div>
);
}
export default LessonsPage;
