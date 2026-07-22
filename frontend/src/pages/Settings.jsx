import React, { useState, useContext, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, Form, Button, Alert, ListGroup, InputGroup } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Save, User, LogOut, Briefcase, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [settings, setSettings] = useState({
    jobTypes: [],
    printingCompanies: [],
    orderStatuses: []
  });

  const [employees, setEmployees] = useState([]);

  const [newJobType, setNewJobType] = useState('');
  const [newPrintingCompany, setNewPrintingCompany] = useState('');
  const [newOrderStatus, setNewOrderStatus] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        username: user.username || ''
      }));
      
      if (user.role === 'Admin') {
        fetchSettings();
      } else if (user.role === 'Employee') {
        fetchEmployees();
      }
    }
  }, [user]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/users');
      const otherEmployees = res.data.filter(emp => emp._id !== user._id && emp.role !== 'Admin');
      setEmployees(otherEmployees);
    } catch (error) {
      console.error('Error fetching employees', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data) setSettings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        name: formData.name,
        username: formData.username
      };
      if (formData.password) {
        updateData.password = formData.password;
      }

      await api.put(`/users/${user._id}`, updateData);
      
      const updatedUser = { ...user, name: formData.name, username: formData.username };
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      
      setMessage('Profile updated successfully');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const updateSettingsAPI = async (newSettings) => {
    setSettingsMessage('');
    setSettingsError('');
    try {
      const res = await api.put('/settings', newSettings);
      setSettings(res.data);
      setSettingsMessage('Settings updated successfully!');
    } catch (err) {
      setSettingsError('Error updating settings.');
    }
  };

  const handleAddJobType = () => {
    if (!newJobType.trim()) return;
    if (settings.jobTypes.includes(newJobType.trim())) return;
    updateSettingsAPI({ jobTypes: [...settings.jobTypes, newJobType.trim()] });
    setNewJobType('');
  };

  const handleRemoveJobType = (job) => {
    const updated = settings.jobTypes.filter(j => j !== job);
    updateSettingsAPI({ jobTypes: updated });
  };

  const handleAddPrintingCompany = () => {
    if (!newPrintingCompany.trim()) return;
    if (settings.printingCompanies.includes(newPrintingCompany.trim())) return;
    updateSettingsAPI({ printingCompanies: [...settings.printingCompanies, newPrintingCompany.trim()] });
    setNewPrintingCompany('');
  };

  const handleRemovePrintingCompany = (company) => {
    const updated = settings.printingCompanies.filter(c => c !== company);
    updateSettingsAPI({ printingCompanies: updated });
  };

  const handleAddOrderStatus = () => {
    if (!newOrderStatus.trim()) return;
    if (settings.orderStatuses?.includes(newOrderStatus.trim())) return;
    updateSettingsAPI({ orderStatuses: [...(settings.orderStatuses || []), newOrderStatus.trim()] });
    setNewOrderStatus('');
  };

  const handleRemoveOrderStatus = (status) => {
    const updated = (settings.orderStatuses || []).filter(s => s !== status);
    updateSettingsAPI({ orderStatuses: updated });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout>
      <div className="mb-4">
        <h3 className="mb-1 fw-bold">Settings</h3>
        <p className="text-muted mb-0 small">Update your profile details {user?.role === 'Admin' && 'and application settings'}</p>
      </div>

      <div className="row">
        <div className="col-12 col-md-6 mb-4">
          <Card className="dashboard-card border-0 h-100">
            <Card.Body className="p-4 p-md-5">
              <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle me-3">
                  <User size={24} />
                </div>
                <div>
                  <h5 className="fw-bold mb-1">Profile Details</h5>
                  <p className="text-muted small mb-0">Manage your personal information</p>
                </div>
              </div>

              {message && <Alert variant="success" className="border-0 bg-success bg-opacity-10 text-success fw-medium">{message}</Alert>}
              {error && <Alert variant="danger" className="border-0 bg-danger bg-opacity-10 text-danger fw-medium">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="name"
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    className="bg-light"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="username"
                    value={formData.username} 
                    onChange={handleChange} 
                    required 
                    className="bg-light"
                  />
                </Form.Group>

                <h6 className="fw-bold mt-5 mb-3 pt-3 border-top">Change Password</h6>
                <p className="text-muted small mb-4">Leave blank if you do not wish to change your password</p>

                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password} 
                      onChange={handleChange} 
                      placeholder="Enter new password"
                      className="bg-light"
                    />
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

                <Form.Group className="mb-4">
                  <Form.Label>Confirm Password</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword} 
                      onChange={handleChange} 
                      placeholder="Confirm new password"
                      className="bg-light"
                    />
                    <Button 
                      variant="outline-secondary" 
                      className="bg-light border" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex="-1"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <div className="pt-2">
                  <Button variant="primary" type="submit" disabled={loading} className="px-4 fw-medium d-flex align-items-center">
                    {loading ? 'Saving...' : (
                      <>
                        <Save size={18} className="me-2" /> Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </div>

        <div className="col-12 col-md-6 mb-4">
          <div className="d-block d-md-none mb-4">
            <Card className="dashboard-card border-0">
              <Card.Body className="p-4 p-md-5">
                <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                  <div className="bg-info bg-opacity-10 text-info p-3 rounded-circle me-3">
                    <User size={24} />
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1">Team Members</h5>
                    <p className="text-muted small mb-0">Access team dashboards</p>
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {user?.role === 'Admin' ? (
                    <Button variant="outline-primary" onClick={() => navigate('/admin/employees')} className="w-100 py-3 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center">
                      <Users className="me-2" size={20} /> Manage Team
                    </Button>
                  ) : (
                    employees.length > 0 ? (
                      employees.map(emp => (
                        <Button key={emp._id} variant="outline-primary" onClick={() => navigate(`/employee/user/${emp._id}`, { state: { employeeName: emp.name } })} className="w-100 py-3 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center mb-2">
                          <Users className="me-2" size={20} /> {emp.name}
                        </Button>
                      ))
                    ) : (
                      <div className="text-muted text-center w-100">No other team members found</div>
                    )
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>

          {user?.role === 'Admin' && (
            <Card className="dashboard-card border-0 mb-4">
              <Card.Body className="p-4 p-md-5">
                <div className="d-flex align-items-center mb-4 pb-3 border-bottom">
                  <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle me-3">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1">Application Settings</h5>
                    <p className="text-muted small mb-0">Configure global order options</p>
                  </div>
                </div>

                {settingsMessage && <Alert variant="success" className="border-0 bg-success bg-opacity-10 text-success fw-medium">{settingsMessage}</Alert>}
                {settingsError && <Alert variant="danger" className="border-0 bg-danger bg-opacity-10 text-danger fw-medium">{settingsError}</Alert>}

                {/* Job Types */}
                <h6 className="fw-bold mb-3">Job Types</h6>
                <InputGroup className="mb-3">
                  <Form.Control
                    placeholder="New job type..."
                    value={newJobType}
                    onChange={(e) => setNewJobType(e.target.value)}
                    className="bg-light"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddJobType()}
                  />
                  <Button variant="outline-primary" onClick={handleAddJobType} className="d-flex align-items-center">
                    <Plus size={18} />
                  </Button>
                </InputGroup>
                <ListGroup className="mb-5 shadow-sm rounded-3">
                  {settings.jobTypes.map((job, index) => (
                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center border-light">
                      {job}
                      <Button variant="link" className="text-danger p-0 m-0" onClick={() => handleRemoveJobType(job)}>
                        <Trash2 size={16} />
                      </Button>
                    </ListGroup.Item>
                  ))}
                  {settings.jobTypes.length === 0 && (
                    <ListGroup.Item className="text-muted text-center border-light">No job types configured.</ListGroup.Item>
                  )}
                </ListGroup>

                {/* Printing Methods */}
                <h6 className="fw-bold mb-3">Printing Methods</h6>
                <InputGroup className="mb-3">
                  <Form.Control
                    placeholder="New printing method..."
                    value={newPrintingCompany}
                    onChange={(e) => setNewPrintingCompany(e.target.value)}
                    className="bg-light"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPrintingCompany()}
                  />
                  <Button variant="outline-primary" onClick={handleAddPrintingCompany} className="d-flex align-items-center">
                    <Plus size={18} />
                  </Button>
                </InputGroup>
                <ListGroup className="shadow-sm rounded-3">
                  {settings.printingCompanies.map((company, index) => (
                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center border-light">
                      {company}
                      <Button variant="link" className="text-danger p-0 m-0" onClick={() => handleRemovePrintingCompany(company)}>
                        <Trash2 size={16} />
                      </Button>
                    </ListGroup.Item>
                  ))}
                  {settings.printingCompanies.length === 0 && (
                    <ListGroup.Item className="text-muted text-center border-light">No printing methods configured.</ListGroup.Item>
                  )}
                </ListGroup>

                {/* Order Statuses */}
                <h6 className="fw-bold mb-3 mt-5">Order Statuses</h6>
                <InputGroup className="mb-3">
                  <Form.Control
                    placeholder="New order status..."
                    value={newOrderStatus}
                    onChange={(e) => setNewOrderStatus(e.target.value)}
                    className="bg-light"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddOrderStatus()}
                  />
                  <Button variant="outline-primary" onClick={handleAddOrderStatus} className="d-flex align-items-center">
                    <Plus size={18} />
                  </Button>
                </InputGroup>
                <ListGroup className="shadow-sm rounded-3">
                  {(settings.orderStatuses || []).map((status, index) => (
                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center border-light">
                      {status}
                      <Button variant="link" className="text-danger p-0 m-0" onClick={() => handleRemoveOrderStatus(status)}>
                        <Trash2 size={16} />
                      </Button>
                    </ListGroup.Item>
                  ))}
                  {(!settings.orderStatuses || settings.orderStatuses.length === 0) && (
                    <ListGroup.Item className="text-muted text-center border-light">No order statuses configured.</ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          )}

          <Card className="dashboard-card border-0 mb-4">
            <Card.Body className="p-4 p-md-5">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h6 className="fw-bold text-danger mb-1">Sign Out</h6>
                  <p className="text-muted small mb-0">Securely sign out of your account.</p>
                </div>
                <Button variant="outline-danger" className="fw-medium d-flex align-items-center" onClick={handleLogout}>
                  <LogOut size={18} className="me-2" /> Logout
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
