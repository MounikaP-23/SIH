import React, { useEffect } from 'react';
import { Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { useData } from '../../contexts/DataContext';

const ProgressPage: React.FC = () => {
  const { progress, loading, fetchProgress } = useData();

  useEffect(() => {
    fetchProgress();
  }, []);

  const completedLessons = progress.filter(p => p.isCompleted);
  const totalLessons = progress.length;



  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress Overview */} 
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="text-center border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Card.Body className="p-4">
              <i className="fas fa-book fa-2x mb-3"></i>
              <h3 className="mb-1">{completedLessons.length}</h3>
              <p className="mb-0">Completed Lessons</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="text-center border-0" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <Card.Body className="p-4">
              <i className="fas fa-clock fa-2x mb-3"></i>
              <h3 className="mb-1">{totalLessons - completedLessons.length}</h3>
              <p className="mb-0">Remaining</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Progress Table */}
      <Card className="table-container">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <i className="fas fa-chart-bar me-2"></i>
            Lesson Progress
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {progress.length === 0 ? (
            <div className="text-center p-5">
              <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
              <h5>No Progress Yet</h5>
              <p className="text-muted">Start completing lessons to see your progress here.</p>
            </div>
          ) : (
            <Table responsive className="mb-0">
              <thead>
                <tr>
                  <th>Lesson</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {progress.map((item, index) => (
                  <tr key={item._id}>
                    <td>
                      <div>
                        <strong>{item.lesson.title}</strong>
                      </div>
                    </td>
                    <td>
                      <Badge bg="primary">{item.lesson.subject}</Badge>
                    </td>
                    <td>Class {item.lesson.classLevel}</td>
                    <td>
                      {item.isCompleted ? (
                        <Badge bg="success">
                          <i className="fas fa-check me-1"></i>
                          Completed
                        </Badge>
                      ) : (
                        <Badge bg="secondary">
                          <i className="fas fa-clock me-1"></i>
                          In Progress
                        </Badge>
                      )}
                    </td>

                    <td>
                      {item.completedAt ? (
                        <small className="text-muted">
                          {new Date(item.completedAt).toLocaleDateString()}
                        </small>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
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

export default ProgressPage;
