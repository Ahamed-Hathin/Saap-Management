import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, Table, Button, Modal, Form, Alert, InputGroup } from 'react-bootstrap';
import api from '../services/api';
import { Edit2, Trash2, UserPlus, Eye, EyeOff } from 'lucide-react';

const ManageEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/users');
      setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleShow = () => {
    setEditMode(false);
    setFormData({ id: '', name: '', username: '', password: '' });
    setError('');
    setShowPassword(false);
    setShowModal(true);
  };

  const handleEdit = (emp) => {
    setEditMode(true);
    setFormData({ id: emp._id, name: emp.name, username: emp.username, password: '' });
    setError('');
    setShowPassword(false);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchEmployees();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting employee');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editMode) {
        await api.put(`/users/${formData.id}`, {
          name: formData.name,
          username: formData.username,
          password: formData.password || undefined
        });
      } else {
        await api.post('/users', formData);
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="mb-1 fw-bold">Manage Employees</h3>
          <p className="text-muted mb-0 small">View and manage your team members</p>
        </div>
        <Button variant="primary" onClick={handleShow} className="d-flex align-items-center mt-2 mt-md-0">
          <UserPlus size={18} className="me-2" /> Add Employee
        </Button>
      </div>

      <Card className="dashboard-card border-0 mb-4">
        <Card.Body className="p-0">
          {employees.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <h5 className="fw-medium mb-3">No employees found</h5>
              <p>You haven't added any team members yet.</p>
              <Button variant="outline-primary" onClick={handleShow} className="mt-2">
                <UserPlus size={18} className="me-2" /> Add First Employee
              </Button>
            </div>
          ) : (
            <>
              <Table responsive className="table-custom mb-0 align-middle d-none d-md-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Joined Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp._id}>
                      <td>{emp.name}</td>
                      <td>{emp.username}</td>
                      <td>{new Date(emp.createdAt).toLocaleDateString()}</td>
                      <td className="text-end">
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(emp)}>
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(emp._id)}>
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {/* Mobile Cards View */}
              <div className="d-md-none">
                {employees.map((emp) => (
                  <div key={emp._id} className="p-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold mb-0">{emp.name}</h6>
                      <div className="text-muted small">{new Date(emp.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-muted small mb-3">
                      <strong>Username:</strong> {emp.username}
                    </div>
                    <div className="d-flex gap-2">
                      <Button variant="outline-primary" size="sm" className="flex-grow-1" onClick={() => handleEdit(emp)}>
                        <Edit2 size={14} className="me-1" /> Edit
                      </Button>
                      <Button variant="outline-danger" size="sm" className="flex-grow-1" onClick={() => handleDelete(emp._id)}>
                        <Trash2 size={14} className="me-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="border-0 rounded-4 shadow-lg">
        <Modal.Header closeButton className="border-0 pb-0 mt-3 mx-2">
          <Modal.Title className="fw-bold">{editMode ? 'Edit Employee' : 'Add New Employee'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="px-4 pt-4">
            {error && <Alert variant="danger" className="border-0 bg-danger bg-opacity-10 text-danger">{error}</Alert>}
            <Form.Group className="mb-4">
              <Form.Label>Full Name</Form.Label>
              <Form.Control type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-light" />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Username</Form.Label>
              <Form.Control type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="bg-light" />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Password {editMode && <span className="text-muted fw-normal" style={{fontSize: '0.8rem'}}>(leave blank to keep current)</span>}</Form.Label>
              <InputGroup>
                <Form.Control type={showPassword ? "text" : "password"} required={!editMode} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="bg-light" />
                <Button 
                  variant="outline-secondary" 
                  className="bg-light border" 
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </InputGroup>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 px-4 pb-4">
            <Button variant="light" onClick={() => setShowModal(false)} className="fw-medium" disabled={isLoading}>Cancel</Button>
            <Button variant="primary" type="submit" className="fw-medium px-4" disabled={isLoading}>
              {isLoading ? (editMode ? 'Saving...' : 'Creating...') : (editMode ? 'Save Employee' : 'Create Employee')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ManageEmployees;
