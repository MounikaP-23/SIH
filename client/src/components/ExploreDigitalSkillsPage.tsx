import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { digitalSkillsLessons } from '../utils/addDigitalSkillsLessons';

const ExploreDigitalSkillsPage: React.FC = () => {
  const navigate = useNavigate();
  const { classLevel } = useParams();
  const levelNumber = Number(classLevel);

  const lessons = useMemo(() => {
    if (Number.isNaN(levelNumber)) return [];
    return digitalSkillsLessons.filter(l => l.classLevel === levelNumber);
  }, [levelNumber]);

  return (
    <div className="py-4">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1">Digital Skills - Class {levelNumber}</h3>
            <div className="text-muted">Explore curated lessons for your class</div>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>Back</Button>
            <Button variant="success" onClick={() => navigate('/login')}>Login to Start</Button>
          </div>
        </div>

        {lessons.length === 0 ? (
          <Card className="p-4 text-center">
            <div className="mb-2">No lessons found for Class {levelNumber}.</div>
            <div className="text-muted">Try a different class from the home page.</div>
          </Card>
        ) : (
          <Row className="g-3">
            {lessons.map((lesson, idx) => (
              <Col key={idx} md={6} lg={4}>
                <Card className="h-100">
                  <Card.Body>
                    <div className="d-flex align-items-start justify-content-between mb-2">
                      <Badge bg="info">Digital Skills</Badge>
                      <Badge bg="secondary">Class {lesson.classLevel}</Badge>
                    </div>
                    <Card.Title className="mb-1">{lesson.title}</Card.Title>
                    <Card.Text className="text-muted">{lesson.description}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default ExploreDigitalSkillsPage;


