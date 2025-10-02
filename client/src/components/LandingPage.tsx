import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button, Navbar, Nav } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: 'fas fa-wifi-slash',
      title: t('landing.features.worksOffline.title'),
      description: t('landing.features.worksOffline.description'),
      color: 'primary'
    },
    {
      icon: 'fas fa-language',
      title: t('landing.features.localLanguages.title'),
      description: t('landing.features.localLanguages.description'),
      color: 'secondary'
    },
    {
      icon: 'fas fa-brain',
      title: t('landing.features.interactiveQuizzes.title'),
      description: t('landing.features.interactiveQuizzes.description'),
      color: 'success'
    },
    {
      icon: 'fas fa-chart-line',
      title: t('landing.features.teacherDashboard.title'),
      description: t('landing.features.teacherDashboard.description'),
      color: 'info'
    },
    {
      icon: 'fas fa-mobile-alt',
      title: t('landing.features.lowEndDevice.title'),
      description: t('landing.features.lowEndDevice.description'),
      color: 'warning'
    },
    {
      icon: 'fas fa-trophy',
      title: t('landing.features.progressTracking.title'),
      description: t('landing.features.progressTracking.description'),
      color: 'danger'
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <Navbar expand="lg" className="navbar-custom shadow-sm">
        <Container>
          <Navbar.Brand href="#home" className="d-flex align-items-center">
            <i className="fas fa-graduation-cap fa-2x me-2 text-primary"></i>
            <span className="fw-bold fs-4">{t('common.appName')}</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#home">{t('landing.nav.home')}</Nav.Link>
              <Nav.Link href="#features">{t('landing.nav.lessons')}</Nav.Link>
              <Nav.Link href="#features">{t('landing.nav.digitalLiteracy')}</Nav.Link>
              <Nav.Link href="#features">{t('landing.nav.teacherDashboard')}</Nav.Link>
              <Nav.Link href="#about">{t('landing.nav.about')}</Nav.Link>
              <Nav.Link href="#contact">{t('landing.nav.contact')}</Nav.Link>
            </Nav>
            <Nav className="d-flex align-items-center">
              <LanguageSwitcher />
              <Link to="/login">
                <Button variant="outline-primary" className="ms-3">
                  {t('common.login')}
                </Button>
              </Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center min-vh-100">
            <Col lg={6} className="hero-content">
              <h1 className="hero-title display-4 fw-bold mb-4">
                {t('landing.title')}
              </h1>
              <p className="hero-subtitle lead mb-4">
                {t('landing.subtitle')}
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/login">
                  <Button size="lg" className="btn-hero-primary">
                    <i className="fas fa-play me-2"></i>
                    {t('landing.startLearning')}
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline-light" className="btn-hero-secondary">
                    <i className="fas fa-chalkboard-teacher me-2"></i>
                    {t('landing.teacherLogin')}
                  </Button>
                </Link>
              </div>
            </Col>
            <Col lg={6} className="hero-image">
              <div className="hero-image-container">
                <img
                  src="/images/rural-students-classroom.jpg"
                  alt="Rural students learning in classroom"
                  className="img-fluid rounded shadow-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5SdXJhbCBTdHVkZW50cyBMZWFybmluZzwvdGV4dD48L3N2Zz4=';
                  }}
                />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Mission Section */}
      <section className="mission-section py-5">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h2 className="section-title mb-4">{t('landing.missionTitle')}</h2>
              <p className="mission-text lead">
                {t('landing.missionText')}
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section py-5 bg-light">
        <Container>
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="section-title">Features</h2>
              <p className="section-subtitle">Everything you need for effective digital learning</p>
            </Col>
          </Row>
          <Row>
            {features.map((feature, index) => (
              <Col lg={4} md={6} className="mb-4" key={index}>
                <div className="feature-card h-100">
                  <div className={`feature-icon bg-${feature.color} text-white mb-3`}>
                    <i className={feature.icon}></i>
                  </div>
                  <h5 className="feature-title">{feature.title}</h5>
                  <p className="feature-description">{feature.description}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="footer bg-dark text-white py-5">
        <Container>
          <Row>
            <Col lg={4} className="mb-4">
              <div className="d-flex align-items-center mb-3">
                <i className="fas fa-graduation-cap fa-2x me-2 text-primary"></i>
                <span className="fw-bold fs-4">{t('common.appName')}</span>
              </div>
              <p className="mb-3">Bridging the digital gap for rural education through accessible, offline-capable learning.</p>
              <div className="social-links">
                <a href="#" className="text-white me-3"><i className="fab fa-facebook-f"></i></a>
                <a href="#" className="text-white me-3"><i className="fab fa-twitter"></i></a>
                <a href="#" className="text-white me-3"><i className="fab fa-instagram"></i></a>
                <a href="#" className="text-white"><i className="fab fa-youtube"></i></a>
              </div>
            </Col>
            <Col lg={2} md={3} className="mb-4">
              <h5 className="mb-3">{t('landing.footer.about')}</h5>
              <ul className="list-unstyled">
                <li><a href="#" className="text-white-50 text-decoration-none">Our Story</a></li>
                <li><a href="#" className="text-white-50 text-decoration-none">Team</a></li>
                <li><a href="#" className="text-white-50 text-decoration-none">Careers</a></li>
              </ul>
            </Col>
            <Col lg={2} md={3} className="mb-4">
              <h5 className="mb-3">{t('landing.footer.support')}</h5>
              <ul className="list-unstyled">
                <li><a href="#" className="text-white-50 text-decoration-none">Help Center</a></li>
                <li><a href="#" className="text-white-50 text-decoration-none">Contact Us</a></li>
                <li><a href="#" className="text-white-50 text-decoration-none">FAQ</a></li>
              </ul>
            </Col>
            <Col lg={2} md={3} className="mb-4">
              <h5 className="mb-3">{t('landing.footer.contact')}</h5>
              <ul className="list-unstyled">
                <li><a href="#" className="text-white-50 text-decoration-none">Email</a></li>
                <li><a href="#" className="text-white-50 text-decoration-none">Phone</a></li>
                <li><a href="#" className="text-white-50 text-decoration-none">Address</a></li>
              </ul>
            </Col>
            <Col lg={2} md={3} className="mb-4">
              <h5 className="mb-3">{t('landing.footer.privacy')}</h5>
              <ul className="list-unstyled">
                <li><a href="#" className="text-white-50 text-decoration-none">Privacy Policy</a></li>
                <li><a href="#" className="text-white-50 text-decoration-none">Terms of Service</a></li>
                <li><a href="#" className="text-white-50 text-decoration-none">Cookies</a></li>
              </ul>
            </Col>
          </Row>
          <hr className="my-4" />
          <Row>
            <Col className="text-center">
              <p className="mb-0">&copy; 2024 {t('common.appName')}. All rights reserved.</p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;
