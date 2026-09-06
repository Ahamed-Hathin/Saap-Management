import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Form, Button, Card, Row, Col, Alert, Spinner, Modal, ButtonGroup } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import { Calculator, Save, User as UserIcon, Calendar, Settings, Users, Clock } from 'lucide-react';

const SalaryAutomate = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [settings, setSettings] = useState({
    salaryPerDay: '',
    hoursPerDay: '',
    workingDaysPerMonth: ''
  });

  const [showConfig, setShowConfig] = useState(false);

  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchEmployees();
    }
  }, [user]);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/users');
      // Filter out only employees, or show all if needed
      const emps = res.data.filter(u => u.role === 'Employee');
      setEmployees(emps);
      if (emps.length > 0) {
        setSelectedEmployee(emps[0]._id);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  // Fetch settings when employee changes
  useEffect(() => {
    if (selectedEmployee) {
      fetchSalarySettings(selectedEmployee);
    }
  }, [selectedEmployee]);

  // Auto calculate when employee or month changes
  useEffect(() => {
    if (selectedEmployee && selectedMonth) {
      handleCalculate();
    }
  }, [selectedEmployee, selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSalarySettings = async (empId) => {
    setFetchLoading(true);
    try {
      const res = await api.get(`/salary/settings/${empId}`);
      if (res.data) {
        setSettings({
          salaryPerDay: res.data.salaryPerDay || '',
          hoursPerDay: res.data.hoursPerDay || '',
          workingDaysPerMonth: res.data.workingDaysPerMonth || ''
        });
      }
    } catch (err) {
      console.error('Error fetching salary settings:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      setLoading(true);
      await api.post('/salary/settings', {
        employeeId: selectedEmployee,
        salaryPerDay: Number(settings.salaryPerDay),
        hoursPerDay: Number(settings.hoursPerDay),
        workingDaysPerMonth: Number(settings.workingDaysPerMonth)
      });
      Swal.fire('Success', 'Salary settings updated successfully', 'success');
      setShowConfig(false);
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Error updating settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedEmployee || !selectedMonth) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/salary/calculate/${selectedEmployee}/${selectedMonth}`);
      setCalculation(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error calculating salary');
      setCalculation(null);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'Admin') {
    return (
      <Layout>
        <Alert variant="danger">You do not have permission to view this page.</Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="d-flex flex-column flex-md-row align-items-md-center align-items-start flex-grow-1 gap-3">
          <div>
            <h2 className="mb-1 fw-bold text-dark d-flex align-items-center">
              <Users size={28} className="me-2 text-primary" />
              Time Tracking Dashboard
            </h2>
            <p className="text-muted mb-0">Automate and calculate employee monthly salary</p>
          </div>
          <ButtonGroup className="ms-md-5 shadow-sm rounded-pill">
            <Button 
              variant={location.pathname === '/admin/my-attendance' ? 'primary' : 'light'} 
              className={`px-4 rounded-start-pill ${location.pathname === '/admin/my-attendance' ? '' : 'text-muted'}`}
              onClick={() => navigate('/admin/my-attendance')}
            >
              My Time Tracking
            </Button>
            <Button 
              variant={location.pathname === '/admin/attendance' ? 'primary' : 'light'} 
              className={`px-4 ${location.pathname === '/admin/attendance' ? '' : 'text-muted'}`}
              onClick={() => navigate('/admin/attendance')}
            >
              Manage Time Tracking
            </Button>
            <Button 
              variant={location.pathname === '/admin/salary-automate' ? 'primary' : 'light'} 
              className={`px-4 rounded-end-pill ${location.pathname === '/admin/salary-automate' ? '' : 'text-muted'}`}
              onClick={() => navigate('/admin/salary-automate')}
            >
              Salary Automate
            </Button>
          </ButtonGroup>
        </div>
        <Button variant="outline-primary" onClick={() => setShowConfig(true)} className="d-flex align-items-center gap-2 rounded-pill shadow-sm px-3 bg-white">
          <Settings size={18} className="text-primary" /> Salary Configuration
        </Button>
      </div>

      <Row className="mb-4">
        <Col md={12}>
          <Card className="dashboard-card border-0 shadow-sm">
            <Card.Body className="p-4">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-secondary"><UserIcon size={16} className="me-2"/>Select Employee</Form.Label>
                    <Form.Select 
                      value={selectedEmployee} 
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="bg-light"
                    >
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>{emp.name} ({emp.username})</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold text-secondary"><Calendar size={16} className="me-2"/>Select Month</Form.Label>
                    <Form.Control 
                      type="month" 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-light"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12} className="mb-4">
          <Card className="dashboard-card border-0 shadow-sm h-100 hover-lift">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-success mb-0">Calculation Result</h5>
              <Button variant="success" size="sm" onClick={handleCalculate} disabled={loading} className="d-flex align-items-center gap-1">
                {loading ? <Spinner size="sm" /> : <Calculator size={16} />}
                Calculate
              </Button>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              
              {!calculation && !error && (
                <div className="text-center text-muted py-5">
                  <Calculator size={48} className="opacity-25 mb-3" />
                  <p>Click calculate to view salary details for {selectedMonth}</p>
                </div>
              )}

              {calculation && (
                <div className="fade-in">
                  <div className="p-4 bg-light rounded-3 mb-4">
                    <h6 className="fw-bold text-secondary mb-3 text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Overview</h6>
                    <Row className="g-3">
                      <Col sm={6}>
                        <div className="bg-white p-3 rounded shadow-sm border border-light h-100">
                          <div className="text-muted small fw-semibold mb-1">Base Monthly Salary</div>
                          <h4 className="mb-0 fw-bold text-dark">₹{calculation.baseSalary?.toFixed(2)}</h4>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="bg-white p-3 rounded shadow-sm border border-light h-100">
                          <div className="text-muted small fw-semibold mb-1">Hourly Rate</div>
                          <h4 className="mb-0 fw-bold text-dark">₹{calculation.hourlyRate?.toFixed(2)}</h4>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <div className="p-4 bg-white border rounded-3 mb-4 shadow-sm">
                    <h6 className="fw-bold text-secondary mb-3 text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Hours Breakdown</h6>
                    <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                      <span className="fw-medium text-dark">Expected Hours:</span>
                      <span className="fw-bold text-primary">{calculation.expectedHours?.toFixed(1)} hrs</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                      <span className="fw-medium text-dark">Actual Worked Hours:</span>
                      <span className="fw-bold text-primary">{calculation.actualWorkedHours?.toFixed(1)} hrs</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-1">
                      <span className="fw-bold text-dark">Hours Difference:</span>
                      <span className={`fw-bold ${calculation.differenceInHours > 0 ? 'text-success' : calculation.differenceInHours < 0 ? 'text-danger' : 'text-secondary'}`}>
                        {calculation.differenceInHours > 0 ? '+' : ''}{calculation.differenceInHours?.toFixed(1)} hrs
                      </span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-3 text-center ${calculation.differenceInHours > 0 ? 'bg-success bg-opacity-10' : calculation.differenceInHours < 0 ? 'bg-danger bg-opacity-10' : 'bg-primary bg-opacity-10'}`}>
                    <h6 className="fw-bold text-secondary mb-1">Final Payable Salary</h6>
                    <h2 className={`mb-0 fw-bold ${calculation.differenceInHours > 0 ? 'text-success' : calculation.differenceInHours < 0 ? 'text-danger' : 'text-primary'}`}>
                      ₹{calculation.finalSalary?.toFixed(2)}
                    </h2>
                    <div className={`small fw-bold mt-2 ${calculation.differenceInHours > 0 ? 'text-success' : calculation.differenceInHours < 0 ? 'text-danger' : 'text-secondary'}`}>
                      (Adjustment: {calculation.salaryAdjustment > 0 ? '+' : ''}₹{calculation.salaryAdjustment?.toFixed(2)})
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showConfig} onHide={() => setShowConfig(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title className="fw-bold text-primary">Salary Configuration</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          {fetchLoading ? (
            <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Form onSubmit={handleSaveSettings}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-secondary">Salary Per Day (₹)</Form.Label>
                <Form.Control 
                  type="number" 
                  placeholder="e.g. 800"
                  name="salaryPerDay"
                  value={settings.salaryPerDay}
                  onChange={handleSettingChange}
                  required
                  className="bg-light"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-secondary">Total Hours Per Day</Form.Label>
                <Form.Control 
                  type="number" 
                  placeholder="e.g. 8"
                  name="hoursPerDay"
                  value={settings.hoursPerDay}
                  onChange={handleSettingChange}
                  required
                  className="bg-light"
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold text-secondary">No. of Working Days</Form.Label>
                <Form.Control 
                  type="number" 
                  placeholder="e.g. 26"
                  name="workingDaysPerMonth"
                  value={settings.workingDaysPerMonth}
                  onChange={handleSettingChange}
                  required
                  className="bg-light"
                />
              </Form.Group>
              <Button variant="primary" type="submit" disabled={loading} className="w-100 d-flex justify-content-center align-items-center gap-2">
                {loading ? <Spinner size="sm" /> : <Save size={18} />}
                Save Configuration
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </Layout>
  );
};

export default SalaryAutomate;
