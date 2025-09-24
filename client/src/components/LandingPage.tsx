import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { digitalSkillsLessons } from '../utils/addDigitalSkillsLessons';

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showExplore, setShowExplore] = useState(false);
  const [selectedClass, setSelectedClass] = useState<number>(1);

  const classLevels = useMemo(() => [1,2,3,4,5,6,7,8,9,10,11,12], []);

  const filteredLessons = useMemo(() => {
    return digitalSkillsLessons.filter(l => l.classLevel === selectedClass);
  }, [selectedClass]);

  return (
    <div className="landing-hero">
      <Container>
        <Row className="align-items-center">
          <Col lg={6} className="fade-in-up">
            <h1 className="hero-title">
              {t('landing.title')}
            </h1>
            <p className="hero-subtitle">
              {t('landing.subtitle')}
            </p>
            <div className="d-flex gap-3 flex-wrap">
              <Link to="/login">
                <Button variant="light" size="lg" className="btn-hero">
                  {t('common.login')}
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline-light" size="lg" className="btn-hero">
                  {t('common.signUp')}
                </Button>
              </Link>
              <Button variant="warning" size="lg" className="btn-hero" onClick={() => setShowExplore(true)}>
                Explore Content
              </Button>
            </div>
          </Col>
          <Col lg={6} className="text-center fade-in-up">
            <div className="mt-5 mt-lg-0">
              <div className="d-flex justify-content-center gap-4 mb-4">
                <div className="text-center">
                  <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '80px', height: '80px' }}>
                    <i className="fas fa-user-graduate fa-2x"></i>
                  </div>
                  <h5>{t('landing.students')}</h5>
                  <small>{t('landing.studentsSub')}</small>
                </div>
                <div className="text-center">
                  <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '80px', height: '80px' }}>
                    <i className="fas fa-user-tie fa-2x"></i>
                  </div>
                  <h5>{t('landing.teachers')}</h5>
                  <small>{t('landing.teachersSub')}</small>
                </div>
                <div className="text-center">
                  <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '80px', height: '80px' }}>
                    <i className="fas fa-user-shield fa-2x"></i>
                  </div>
                  <h5>{t('landing.admins')}</h5>
                  <small>{t('landing.adminsSub')}</small>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Explore Content Modal */}
      <Modal show={showExplore} onHide={() => setShowExplore(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Explore Digital Skills</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <div className="mb-2">Select Class</div>
            <div className="d-flex flex-wrap gap-2">
              {classLevels.map(level => (
                <Button
                  key={level}
                  variant={selectedClass === level ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => { setSelectedClass(level); setShowExplore(false); navigate(`/explore/digital-skills/${level}`); }}
                >
                  {`Class ${level}`}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2">Digital Skills for Class {selectedClass}</div>
            {filteredLessons.length === 0 ? (
              <div className="text-muted">No lessons available.</div>
            ) : (
              <ul className="list-unstyled m-0">
                {filteredLessons.map((lesson, idx) => (
                  <li key={idx} className="mb-2">
                    <div className="fw-semibold">{lesson.title}</div>
                    <div className="text-muted small">{lesson.description}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Link to="/login">
            <Button variant="success">Login to Start Learning</Button>
          </Link>
          <Button variant="secondary" onClick={() => setShowExplore(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default LandingPage;
