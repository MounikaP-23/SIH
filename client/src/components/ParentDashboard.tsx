import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Card, Button, Badge, ProgressBar, Alert, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const ParentDashboard: React.FC = () => {
  const { user, logout, fetchChildren, fetchChildrenProgress, linkChild } = useAuth();
  const { fetchLessons } = useData();
  const [activeTab, setActiveTab] = useState('children');
  const [children, setChildren] = useState<any[]>([]);
  const [childrenProgress, setChildrenProgress] = useState<any>({});
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [studentCode, setStudentCode] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    loadChildren();
    loadChildrenProgress();
  }, []);

  const loadChildren = async () => {
    const data = await fetchChildren();
    setChildren(data);
  };

  const loadChildrenProgress = async () => {
    const data = await fetchChildrenProgress();
    setChildrenProgress(data);
  };

  const handleLinkChild = async () => {
    if (!studentCode.trim()) return;
    setLinking(true);
    try {
      await linkChild(studentCode.trim());
      alert('Child linked successfully!');
      setStudentCode('');
      setShowLinkModal(false);
      loadChildren();
      loadChildrenProgress();
    } catch (error: any) {
      alert(error.message || 'Failed to link child');
    } finally {
      setLinking(false);
    }
  };

  const navItems = [
    { key: 'children', label: 'My Children', icon: 'fas fa-users' },
    { key: 'progress', label: 'Progress Overview', icon: 'fas fa-chart-line' }
  ];

  return (
    <div className="dashboard-container">
      <Row className="g-0">
        {/* Sidebar */}
        <Col md={3} lg={2}>
          <div className="sidebar">
            <div className="sidebar-header">
              <h4 className="sidebar-brand">EduPlatform</h4>
              <p className="text-white-50 mb-0">Parent Portal</p>
            </div>

            <Nav className="flex-column sidebar-nav">
              {navItems.map(item => (
                <Nav.Item key={item.key} className="nav-item">
                  <Nav.Link
                    className={`nav-link ${activeTab === item.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.key)}
                  >
                    <i className={`nav-icon ${item.icon}`}></i>
                    {item.label}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>

            <div className="mt-auto p-3">
              <div className="text-white-50 small mb-2">Welcome back,</div>
              <div className="text-white fw-semibold">{user?.name}</div>
              <Button
                variant="outline-light"
                size="sm"
                className="mt-2 w-100"
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          </div>
        </Col>

        {/* Main Content */}
        <Col md={9} lg={10}>
          <div className="main-content">
            {/* Header */}
            <div className="content-header">
              <Row className="align-items-center">
                <Col>
                  <h1 className="page-title">
                    {navItems.find(item => item.key === activeTab)?.label || 'Dashboard'}
                  </h1>
                  <p className="page-subtitle">
                    {activeTab === 'children' && 'Manage and view your children\'s accounts'}
                    {activeTab === 'progress' && 'Track your children\'s learning progress'}
                  </p>
                </Col>
                <Col xs="auto">
                  <Button variant="primary" onClick={() => setShowLinkModal(true)}>
                    Link New Child
                  </Button>
                </Col>
              </Row>
            </div>

            {/* Content */}
            {activeTab === 'children' && (
              <Row>
                {children.length === 0 ? (
                  <Col>
                    <Alert variant="info">
                      No children linked yet. Click "Link New Child" to add your first child.
                    </Alert>
                  </Col>
                ) : (
                  children.map(child => (
                    <Col md={6} lg={4} key={child._id} className="mb-4">
                      <Card>
                        <Card.Body>
                          <Card.Title>{child.name}</Card.Title>
                          <Card.Text>
                            <strong>Class:</strong> {child.classLevel}<br />
                            <strong>Student ID:</strong> {child.studentCode}
                          </Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            )}

            {activeTab === 'progress' && (
              <Row>
                {Object.keys(childrenProgress).length === 0 ? (
                  <Col>
                    <Alert variant="info">
                      No progress data available. Link children and ensure they have completed lessons.
                    </Alert>
                  </Col>
                ) : (
                  Object.entries(childrenProgress).map(([childId, data]: [string, any]) => (
                    <Col md={6} key={childId} className="mb-4">
                      <Card>
                        <Card.Header>
                          <h5>{data.child.name} (Class {data.child.classLevel})</h5>
                        </Card.Header>
                        <Card.Body>
                          {data.progress.length === 0 ? (
                            <p>No progress yet.</p>
                          ) : (
                            <div>
                              <p><strong>Completed Lessons:</strong> {data.progress.filter((p: any) => p.isCompleted).length}</p>
                              <p><strong>Total Lessons:</strong> {data.progress.length}</p>
                              <ProgressBar
                                now={(data.progress.filter((p: any) => p.isCompleted).length / data.progress.length) * 100}
                                label={`${Math.round((data.progress.filter((p: any) => p.isCompleted).length / data.progress.length) * 100)}%`}
                              />
                              <div className="mt-3">
                                <h6>Recent Activity:</h6>
                                <ul>
                                  {data.progress.slice(0, 3).map((p: any, idx: number) => (
                                    <li key={idx}>
                                      {p.lesson?.title} - {p.isCompleted ? 'Completed' : 'In Progress'}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            )}
          </div>
        </Col>
      </Row>

      {/* Link Child Modal */}
      <Modal show={showLinkModal} onHide={() => setShowLinkModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Link Child</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Student Code</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter student code (e.g., CLS-ABC123)"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
              />
              <Form.Text className="text-muted">
                Ask your child for their student code from their dashboard.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLinkModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleLinkChild} disabled={linking}>
            {linking ? 'Linking...' : 'Link Child'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ParentDashboard;
