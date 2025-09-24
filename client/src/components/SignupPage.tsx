import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Student',
    classLevel: '',
    mobile: '',
    languagePreference: 'en'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Email/password signup for Student/Teacher/Admin
    // Email/password signup for all roles (including Parent)
    if (formData.password !== formData.confirmPassword) {
      setError(t('signup.passwordsDoNotMatch'));
      return;
    }
    if (formData.password.length < 6) {
      setError(t('signup.passwordMin'));
      return;
    }

    setLoading(true);
    try {
      // For Students, classLevel is required
      let classLevelNum: number | undefined = undefined;
      if (formData.role === 'Student') {
        if (!formData.classLevel) {
          setError('Please select your class (standard).');
          setLoading(false);
          return;
        }
        classLevelNum = parseInt(formData.classLevel);
      }

      const { user } = await signup(
        formData.name,
        formData.email,
        formData.password,
        formData.role,
        undefined,
        classLevelNum
      );
      if (user.role === 'Student') navigate('/student');
      else if (user.role === 'Teacher') navigate('/teacher');
      else if (user.role === 'Admin') navigate('/admin');
      else if (user.role === 'Parent') navigate('/parent');
      else navigate('/');
    } catch (err: any) {
      const msg = err?.message || 'Signup failed';
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
          <Col md={6} lg={5}>
            <Card className="form-container border-0">
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-primary">{t('signup.createAccount')}</h2>
                  <p className="text-muted">{t('signup.joinPlatform')}</p>
                </div>

                {error && (
                  <Alert variant="danger" className="text-center">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('signup.fullName')}</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t('signup.fullNamePlaceholder')}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>{t('signup.email')}</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('signup.emailPlaceholder')}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>{t('signup.role')}</Form.Label>
                    <Form.Select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                    >
                      <option value="Student">{t('signup.student')}</option>
                      <option value="Teacher">{t('signup.teacher')}</option>
                      <option value="Admin">{t('signup.admin')}</option>
                      <option value="Parent">Parent</option>
                    </Form.Select>
                  </Form.Group>

                  {formData.role === 'Student' && (
                    <Form.Group className="mb-3">
                      <Form.Label>Class (Standard)</Form.Label>
                      <Form.Select
                        name="classLevel"
                        value={formData.classLevel}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select your class</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(level => (
                          <option key={level} value={String(level)}>Class {level}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  )}

                  {formData.role === 'Parent' && (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>Mobile Number (optional)</Form.Label>
                        <Form.Control
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          placeholder="Enter mobile number"
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Preferred Language</Form.Label>
                        <Form.Select
                          name="languagePreference"
                          value={formData.languagePreference}
                          onChange={handleChange}
                        >
                          <option value="en">English</option>
                          <option value="hi">Hindi</option>
                          <option value="pa">Punjabi</option>
                        </Form.Select>
                      </Form.Group>
                    </>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label>{t('signup.password')}</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={t('signup.passwordPlaceholder')}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>{t('signup.confirmPassword')}</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder={t('signup.confirmPasswordPlaceholder')}
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
                    {loading ? t('signup.creatingAccount') : t('signup.createAccountBtn')}
                  </Button>
                </Form>

                <div className="text-center">
                  <p className="mb-0">
                    {t('signup.haveAccount')} 
                    <Link to="/login" className="text-primary fw-semibold text-decoration-none">
                      {t('signup.signInHere')}
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

export default SignupPage;
