import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Button, Badge, Modal, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const MyLessonsPage: React.FC = () => {
  const { user } = useAuth();
  const { lessons, loading, fetchLessons, deleteLesson } = useData();
  const [myLessons, setMyLessons] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    if (user && lessons.length > 0) {
      const filtered = lessons.filter(lesson => lesson.createdBy._id === user.id);
      setMyLessons(filtered);
    }
  }, [lessons, user]);

  const handleDeleteClick = (lesson: any) => {
    setLessonToDelete(lesson);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (lessonToDelete) {
      try {
        await deleteLesson(lessonToDelete._id);
        setMyLessons(prev => prev.filter(l => l._id !== lessonToDelete._id));
        setShowDeleteModal(false);
        setLessonToDelete(null);
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || 'Error deleting lesson';
        setError(message);
      }
    }
  };

  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      'Math': 'primary',
      'Science': 'success',
      'English': 'info',
      'Punjabi': 'warning',
      'Social Studies': 'secondary'
    };
    return colors[subject] || 'primary';
  };

  const filterDigitalSkills = () => {
    setMyLessons(prev => lessons.filter(l => l.createdBy._id === user?.id && l.category === 'Digital Skills'));
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
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>My Lessons ({myLessons.length})</h4>
        <div className="d-flex gap-2">
          <Button variant="outline-success" onClick={filterDigitalSkills}>
            Digital Skills
          </Button>
          <Link to="/teacher/add-lesson">
            <Button variant="primary">
              <i className="fas fa-plus me-2"></i>
              Add New Lesson
            </Button>
          </Link>
        </div>
      </div>

      {myLessons.length === 0 ? (
        <Card className="text-center p-5">
          <Card.Body>
            <i className="fas fa-book fa-3x text-muted mb-3"></i>
            <h4>No lessons created yet</h4>
            <p className="text-muted">Start creating engaging lessons for your students.</p>
            <Link to="/teacher/add-lesson">
              <Button variant="primary" size="lg">
                <i className="fas fa-plus me-2"></i>
                Create Your First Lesson
              </Button>
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {myLessons.map(lesson => (
            <Col key={lesson._id} md={6} lg={4}>
              <Card className="lesson-card h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <Badge bg={getSubjectColor(lesson.subject)} className="me-2">
                        {lesson.subject}
                      </Badge>
                      <Badge bg="secondary">Class {lesson.classLevel}</Badge>
                    </div>
                    {/* Top-right delete button removed; using clearer action buttons below */}
                  </div>
                  
                  <h5 className="lesson-title">{lesson.title}</h5>
                  <p className="lesson-description flex-grow-1">
                    {lesson.description}
                  </p>
                  
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <small className="text-muted">
                        {lesson.language} • {lesson.category}
                      </small>
                      <small className="text-muted">
                        {new Date(lesson.createdAt).toLocaleDateString()}
                      </small>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        {lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0 ? (
                          <Badge bg="success">
                            <i className="fas fa-question-circle me-1"></i>
                            {lesson.quiz.questions.length} Questions
                          </Badge>
                        ) : (
                          <Badge bg="secondary">No Quiz</Badge>
                        )}
                      </div>
                      <div>
                        {lesson.videoLink && (
                          <Badge bg="info">
                            <i className="fas fa-video me-1"></i>
                            Video
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="d-flex gap-2">
                      <Link to={`/student/lessons/${lesson._id}`} className="flex-grow-1">
                        <Button variant="outline-primary" className="w-100">
                          <i className="fas fa-eye me-2"></i>
                          Preview
                        </Button>
                      </Link>
                      <Button 
                        variant="outline-danger"
                        onClick={() => handleDeleteClick(lesson)}
                      >
                        <i className="fas fa-trash me-2"></i>
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Lesson</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the lesson <strong>"{lessonToDelete?.title}"</strong>?</p>
          <p className="text-muted">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete Lesson
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MyLessonsPage;
