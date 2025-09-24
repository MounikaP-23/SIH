import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const email = formData.email.trim().toLowerCase();
      const password = formData.password.trim();
      if (!email || !password) {
        setError('Please enter email and password');
        return;
      }
      const { user } = await login(email, password);
      // Redirect based on user role
      if (user.role === 'Student') {
        navigate('/student');
      } else if (user.role === 'Teacher') {
        navigate('/teacher');
      } else if (user.role === 'Admin') {
        navigate('/admin');
      } else if (user.role === 'Parent') {
        navigate('/parent');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const msg = err?.message || 'Login failed';
      // Make network errors clearer
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('timeout')) {
        setError('Cannot reach server. Please ensure the backend is running.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="form-container border-0">
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-primary">{t('login.welcome')}</h2>
                  <p className="text-muted">{t('login.signInToAccount')}</p>
                </div>

                {error && (
                  <Alert variant="danger" className="text-center">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('login.email')}</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('login.emailPlaceholder')}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>{t('login.password')}</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={t('login.passwordPlaceholder')}
                      required
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? t('login.signingIn') : t('login.signIn')}
                  </Button>
                </Form>

                <div className="text-center">
                  <p className="mb-0">
                    {t('login.noAccount')}
                    <Link to="/signup" className="text-primary fw-semibold text-decoration-none">
                      {t('login.signUpHere')}
                    </Link>
                  </p>
                  <Link to="/" className="text-muted text-decoration-none">
                    {t('common.backToHome')}
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;
