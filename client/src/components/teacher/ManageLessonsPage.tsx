import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const ManageLessonsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lessons, deleteLesson, loading } = useData();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teacherLessons, setTeacherLessons] = useState<any[]>([]);

  useEffect(() => {
    // Filter lessons created by the current teacher (from AuthContext)
    if (user) {
      const myLessons = lessons.filter(lesson => lesson.createdBy?._id === user.id);
      setTeacherLessons(myLessons);
    } else {
      setTeacherLessons([]);
    }
  }, [lessons, user]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      try {
        setError('');
        await deleteLesson(id);
        setSuccess('Lesson deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete lesson');
      }
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'Draft': return 'secondary';
      case 'Published': return 'success';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <Row className="mb-4">
        <Col>
          <h2>My Lessons</h2>
          <p className="text-muted">Manage your created lessons</p>
        </Col>
        <Col className="text-end">
          <Button 
            variant="primary" 
            onClick={() => navigate('/teacher/add-lesson')}
            className="d-inline-flex align-items-center gap-1"
          >
            <i className="fas fa-plus"></i> Add New Lesson
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <Card.Body>
          {teacherLessons.length === 0 ? (
            <div className="text-center py-5">
              <h4>No lessons found</h4>
              <p>You haven't created any lessons yet. Click the button above to create your first lesson.</p>
            </div>
          ) : (
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teacherLessons.map((lesson) => (
                  <tr key={lesson._id}>
                    <td>{lesson.title}</td>
                    <td>{lesson.subject}</td>
                    <td>Class {lesson.classLevel}</td>
                    <td className="text-uppercase">{lesson.language}</td>
                    <td>
                      <Badge bg={getBadgeVariant(lesson.status || 'Draft')}>
                        {lesson.status || 'Draft'}
                      </Badge>
                    </td>
                    <td>{new Date(lesson.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          onClick={() => navigate(`/lessons/${lesson._id}`)}
                          title="View"
                        >
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          onClick={() => navigate(`/teacher/edit-lesson/${lesson._id}`)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => handleDelete(lesson._id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ManageLessonsPage;
