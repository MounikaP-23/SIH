import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, Modal, Alert, Form } from 'react-bootstrap';
import { useData } from '../../contexts/DataContext';

const ManageUsersPage: React.FC = () => {
  const { users, loading, fetchUsers } = useData();
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState({
    role: '',
    search: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    if (filter.role) {
      filtered = filtered.filter(user => user.role === filter.role);
    }

    if (filter.search) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(filter.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filter.search.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [users, filter]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteClick = (user: any) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        // In a real app, you would call an API to delete the user
        setSuccess(`User ${userToDelete.name} deleted successfully`);
        setShowDeleteModal(false);
        setUserToDelete(null);
        // Refresh users list
        fetchUsers();
      } catch (err: any) {
        setError(err.message || 'Error deleting user');
      }
    }
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'Student': 'primary',
      'Teacher': 'success',
      'Admin': 'warning'
    };
    return colors[role] || 'secondary';
  };

  const getRoleIcon = (role: string) => {
    const icons: { [key: string]: string } = {
      'Student': 'fas fa-graduation-cap',
      'Teacher': 'fas fa-chalkboard-teacher',
      'Admin': 'fas fa-cogs'
    };
    return icons[role] || 'fas fa-user';
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

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Summary Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="text-center border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Card.Body className="p-4">
              <i className="fas fa-users fa-2x mb-3"></i>
              <h3 className="mb-1">{users.length}</h3>
              <p className="mb-0">Total Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <Card.Body className="p-4">
              <i className="fas fa-graduation-cap fa-2x mb-3"></i>
              <h3 className="mb-1">{users.filter(u => u.role === 'Student').length}</h3>
              <p className="mb-0">Students</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <Card.Body className="p-4">
              <i className="fas fa-chalkboard-teacher fa-2x mb-3"></i>
              <h3 className="mb-1">{users.filter(u => u.role === 'Teacher').length}</h3>
              <p className="mb-0">Teachers</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <Card.Body className="p-4">
              <i className="fas fa-cogs fa-2x mb-3"></i>
              <h3 className="mb-1">{users.filter(u => u.role === 'Admin').length}</h3>
              <p className="mb-0">Admins</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="filter-container mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Label>Search Users</Form.Label>
              <Form.Control
                type="text"
                name="search"
                value={filter.search}
                onChange={handleFilterChange}
                placeholder="Search by name or email"
              />
            </Col>
            <Col md={3}>
              <Form.Label>Filter by Role</Form.Label>
              <Form.Select
                name="role"
                value={filter.role}
                onChange={handleFilterChange}
              >
                <option value="">All Roles</option>
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Admin">Admin</option>
              </Form.Select>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                onClick={() => setFilter({ role: '', search: '' })}
                className="w-100"
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Users Table */}
      <Card className="table-container">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <i className="fas fa-users me-2"></i>
            User Management
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center p-5">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <h5>No Users Found</h5>
              <p className="text-muted">No users match your current filters.</p>
            </div>
          ) : (
            <Table responsive className="mb-0">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                             style={{ width: '40px', height: '40px' }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{user.name}</strong>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={getRoleColor(user.role)}>
                        <i className={`${getRoleIcon(user.role)} me-1`}></i>
                        {user.role}
                      </Badge>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Badge bg="success">Active</Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="outline-primary" size="sm">
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
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

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete the user <strong>"{userToDelete?.name}"</strong>?</p>
          <p className="text-muted">This action cannot be undone and will remove all associated data.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete User
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ManageUsersPage;
