import { useState, useEffect } from 'react';
import { Card, Table, Badge, Row, Col, Form, ButtonGroup, Button, Modal } from 'react-bootstrap';
import { Users, UserCheck, UserX, Clock, LogOut, Calendar, Edit } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import Swal from 'sweetalert2';

const AttendanceDashboard = () => {
  const { user } = useContext(AuthContext);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();
  const location = useLocation();

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editForm, setEditForm] = useState({
    checkIn: '',
    lunchStart: '',
    lunchEnd: '',
    checkOut: ''
  });

  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayMonth, setHolidayMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [holidaysList, setHolidaysList] = useState([]);
  const [holidayForm, setHolidayForm] = useState({
    date: new Date().toISOString().split('T')[0],
    title: ''
  });
  const [currentHoliday, setCurrentHoliday] = useState(null);

  const fetchHolidays = async (mMonth = holidayMonth) => {
    try {
      const [y, m] = mMonth.split('-');
      const res = await api.get(`/attendance/holidays?month=${m}&year=${y}`);
      setHolidaysList(res.data);
    } catch (err) {
      console.error('Error fetching holidays:', err);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!holidayForm.date) {
      Swal.fire('Error', 'Please select a date', 'error');
      return;
    }
    try {
      await api.post('/attendance/holidays', {
        date: holidayForm.date,
        title: holidayForm.title || 'Company Holiday'
      });
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Holiday set successfully',
        showConfirmButton: false,
        timer: 1500
      });
      setHolidayForm({ date: holidayForm.date, title: '' });
      fetchHolidays(holidayMonth);
      fetchAttendances();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to set holiday', 'error');
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Delete Holiday?',
        text: 'Are you sure you want to remove this company holiday?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete'
      });
      if (result.isConfirmed) {
        await api.delete(`/attendance/holidays/${id}`);
        fetchHolidays(holidayMonth);
        fetchAttendances();
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to delete holiday', 'error');
    }
  };

  const handleEditClick = (att) => {
    setSelectedEmployee(att.employeeId);
    
    const formatForInput = (dateString) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    setEditForm({
      checkIn: formatForInput(att.checkIn),
      lunchStart: formatForInput(att.lunchStart),
      lunchEnd: formatForInput(att.lunchEnd),
      checkOut: formatForInput(att.checkOut),
    });
    setShowEditModal(true);
  };

  const handleSaveAttendance = async () => {
    try {
      const constructDateTime = (timeString) => {
        if (!timeString) return null;
        return new Date(`${dateFilter}T${timeString}:00`);
      };

      await api.put('/attendance/admin/update', {
        employeeId: selectedEmployee._id,
        date: dateFilter,
        checkIn: constructDateTime(editForm.checkIn),
        lunchStart: constructDateTime(editForm.lunchStart),
        lunchEnd: constructDateTime(editForm.lunchEnd),
        checkOut: constructDateTime(editForm.checkOut),
      });

      setShowEditModal(false);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Attendance updated successfully',
        showConfirmButton: false,
        timer: 1500
      });
      // reload attendance
      fetchAttendances();
    } catch (error) {
      console.error('Error updating attendance:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || 'Something went wrong'
      });
    }
  };

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/admin?date=${dateFilter}`);
      if (Array.isArray(res.data)) {
        setAttendances(res.data);
        setCurrentHoliday(null);
      } else {
        setAttendances(res.data.attendances || []);
        setCurrentHoliday(res.data.holiday || null);
      }
    } catch (error) {
      console.error('Error fetching admin attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [dateFilter]);

  const formatHourDiff = (minsCount) => {
    const h = Math.floor(minsCount / 60);
    const m = minsCount % 60;
    if (h > 0 && m > 0) return `${h} hour ${m} min`;
    if (h > 0) return `${h} hour${h > 1 ? 's' : ''}`;
    return `${m} min${m > 1 ? 's' : ''}`;
  };

  const getStatusBadge = (att) => {
    if (!att) return <Badge bg="secondary">Not Checked In</Badge>;
    const status = att.status;

    if (status === 'Holiday') {
      return <Badge bg="info">{att.holidayTitle ? `Holiday (${att.holidayTitle})` : 'Holiday'}</Badge>;
    }

    if (att.checkOut || ['Completed', 'Early Exit', 'Checked Out'].includes(status)) {
      const targetMins = att.targetWorkingMinutes || ((att.hoursPerDay || 8) * 60);
      const workingMins = att.workingMinutes || 0;
      const diff = workingMins - targetMins;
      const absDiff = Math.abs(diff);

      if (diff > 0) {
        return <Badge bg="success">Worked {formatHourDiff(diff)} extra</Badge>;
      } else if (diff < 0) {
        return <Badge bg="danger">{formatHourDiff(absDiff)} early exit</Badge>;
      } else {
        return <Badge bg="success">Completed</Badge>;
      }
    }

    switch (status) {
      case 'Working':
      case 'Working After Lunch':
        return <Badge bg="primary">{status}</Badge>;
      case 'Late':
        return <Badge bg="danger">{status}</Badge>;
      case 'Absent':
        return <Badge bg="dark">{status}</Badge>;
      case 'Lunch Break':
        return <Badge bg="warning" text="dark">{status}</Badge>;
      case 'Paused':
        return <Badge bg="info">{status}</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '--';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const stats = {
    present: attendances.filter(a => ['Working', 'Working After Lunch', 'Completed', 'Late', 'Early Exit', 'Lunch Break'].includes(a.status)).length,
    late: attendances.filter(a => a.isLate).length,
    workingNow: attendances.filter(a => ['Working', 'Working After Lunch'].includes(a.status)).length,
    checkedOut: attendances.filter(a => ['Completed', 'Early Exit'].includes(a.status)).length,
    absent: attendances.filter(a => a.status === 'Absent').length,
    avgWorkingMins: attendances.filter(a => a.workingMinutes > 0).length 
      ? attendances.reduce((acc, curr) => acc + curr.workingMinutes, 0) / attendances.filter(a => a.workingMinutes > 0).length 
      : 0
  };

  return (
    <Layout>
      {/* Top Header Row */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center align-items-start mb-4 gap-3">
        <div>
          <h2 className="mb-1 fw-bold text-dark d-flex align-items-center">
            <Users size={28} className="me-2 text-primary" />
            Time Tracking Dashboard
          </h2>
          <p className="text-muted mb-0">Track employee attendance and working hours</p>
        </div>
        
        <ButtonGroup className="shadow-sm rounded-pill bg-white p-1 border">
          <Button 
            variant={location.pathname === '/admin/my-attendance' ? 'primary' : 'light'} 
            className={`px-3 py-2 rounded-pill border-0 fw-semibold ${location.pathname === '/admin/my-attendance' ? 'shadow-sm text-white' : 'text-muted bg-transparent'}`}
            onClick={() => navigate('/admin/my-attendance')}
          >
            My Time Tracking
          </Button>
          <Button 
            variant={location.pathname === '/admin/attendance' ? 'primary' : 'light'} 
            className={`px-3 py-2 rounded-pill border-0 fw-semibold ${location.pathname === '/admin/attendance' ? 'shadow-sm text-white' : 'text-muted bg-transparent'}`}
            onClick={() => navigate('/admin/attendance')}
          >
            Manage Time Tracking
          </Button>
          <Button 
            variant={location.pathname === '/admin/salary-automate' ? 'primary' : 'light'} 
            className={`px-3 py-2 rounded-pill border-0 fw-semibold ${location.pathname === '/admin/salary-automate' ? 'shadow-sm text-white' : 'text-muted bg-transparent'}`}
            onClick={() => navigate('/admin/salary-automate')}
          >
            Salary Automate
          </Button>
        </ButtonGroup>
      </div>

      {/* Date & Actions Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 bg-white p-3 rounded-4 shadow-sm border">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted fw-semibold d-flex align-items-center small">
            <Clock size={16} className="me-1 text-primary" /> Selected Date:
          </span>
          <Form.Control 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border rounded-pill px-3 py-1 shadow-none bg-light"
            style={{ width: '170px' }}
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button 
            variant="outline-primary" 
            className="rounded-pill px-3 py-2 d-flex align-items-center gap-2 border shadow-sm fw-medium bg-white"
            onClick={() => { setShowHolidayModal(true); fetchHolidays(holidayMonth); }}
          >
            <Calendar size={18} />
            Company Holidays
          </Button>
        </div>
      </div>

      {currentHoliday && (
        <div className="alert alert-info border-0 shadow-sm rounded-4 d-flex align-items-center mb-4 py-3 px-4 bg-info bg-opacity-10">
          <span className="fs-3 me-3">🎉</span>
          <div>
            <h6 className="fw-bold mb-0 text-dark">Company Holiday: {currentHoliday.title}</h6>
            <small className="text-muted">Today is marked as a company holiday. Employees not working are marked as Holiday.</small>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <Row className="row-cols-2 row-cols-sm-3 row-cols-lg-5 g-3 mb-4">
        <Col>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="text-center p-3">
              <UserCheck size={24} className="text-success mb-2" />
              <h3 className="fw-black mb-0 text-dark">{stats.present}</h3>
              <small className="text-muted fw-medium">Present</small>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="text-center p-3">
              <Clock size={24} className="text-danger mb-2" />
              <h3 className="fw-black mb-0 text-dark">{stats.late}</h3>
              <small className="text-muted fw-medium">Late Today</small>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="text-center p-3">
              <Users size={24} className="text-primary mb-2" />
              <h3 className="fw-black mb-0 text-dark">{stats.workingNow}</h3>
              <small className="text-muted fw-medium">Working Now</small>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="text-center p-3">
              <LogOut size={24} className="text-info mb-2" />
              <h3 className="fw-black mb-0 text-dark">{stats.checkedOut}</h3>
              <small className="text-muted fw-medium">Checked Out</small>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="text-center p-3">
              <UserX size={24} className="text-dark mb-2" />
              <h3 className="fw-black mb-0 text-dark">{stats.absent}</h3>
              <small className="text-muted fw-medium">Absent</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="dashboard-card border-0 mb-4 shadow-sm rounded-4">
        <Card.Body className="p-0">
          <Table responsive className="table-custom mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0">Employee</th>
                <th className="border-0">Check In</th>
                <th className="border-0">Lunch Start</th>
                <th className="border-0">Lunch End</th>
                <th className="border-0">Lunch Duration</th>
                <th className="border-0">Check Out</th>
                <th className="border-0">Working Time</th>
                <th className="border-0">Pause Duration</th>
                <th className="border-0">Status</th>
                <th className="border-0">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center p-4 text-muted">Loading attendance data...</td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center p-4 text-muted">No attendance records found for this date.</td>
                </tr>
              ) : (
                attendances.map((att, index) => (
                  <tr key={index}>
                    <td className="fw-bold">{att.employeeId?.name || 'Unknown'}</td>
                    <td>{formatTime(att.checkIn)}</td>
                    <td>{formatTime(att.lunchStart)}</td>
                    <td>{formatTime(att.lunchEnd)}</td>
                    <td className="fw-medium">{formatDuration(att.lunchDuration)}</td>
                    <td>{formatTime(att.checkOut)}</td>
                    <td className="fw-medium">{formatDuration(att.workingMinutes)}</td>
                    <td className="fw-medium text-muted">{formatDuration(att.pauseDuration)}</td>
                    <td>{getStatusBadge(att)}</td>
                    <td>
                      {att.employeeId && (
                        <div className="d-flex gap-2 justify-content-center">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => navigate(`/admin/attendance/employee/${att.employeeId._id}/monthly`)}
                            title="View Monthly History"
                          >
                            <Calendar size={14} />
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleEditClick(att)}
                            title="Edit / Set Time"
                          >
                            <Edit size={14} />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Holiday Management Modal */}
      <Modal show={showHolidayModal} onHide={() => setShowHolidayModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold d-flex align-items-center">
            <Calendar size={22} className="me-2 text-primary" />
            Manage Company Holidays
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">Select Month to View / Add Holidays</h6>
            <Form.Control 
              type="month" 
              value={holidayMonth} 
              onChange={(e) => {
                setHolidayMonth(e.target.value);
                fetchHolidays(e.target.value);
              }}
              style={{ width: '180px' }}
              className="shadow-sm"
            />
          </div>

          <Card className="border p-3 rounded-4 mb-4 bg-light">
            <h6 className="fw-bold mb-3 text-dark">Add New Company Holiday</h6>
            <Form onSubmit={handleAddHoliday}>
              <Row className="g-3">
                <Col md={5}>
                  <Form.Label className="small fw-medium text-muted">Holiday Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    required 
                    value={holidayForm.date}
                    onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                  />
                </Col>
                <Col md={5}>
                  <Form.Label className="small fw-medium text-muted">Holiday Name / Reason</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g. Diwali, New Year, Pongal" 
                    value={holidayForm.title}
                    onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })}
                  />
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button type="submit" variant="primary" className="w-100 rounded-pill">
                    Add
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card>

          <h6 className="fw-bold mb-3">Holidays for {holidayMonth}</h6>
          {holidaysList.length === 0 ? (
            <p className="text-muted text-center py-4 bg-white border rounded-4">No company holidays scheduled for this month.</p>
          ) : (
            <div className="table-responsive">
              <Table className="align-middle mb-0">
                <thead className="bg-light text-muted">
                  <tr>
                    <th>Date</th>
                    <th>Holiday Name</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {holidaysList.map(h => (
                    <tr key={h._id}>
                      <td className="fw-bold">{new Date(h.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td>
                        <Badge bg="info" className="fs-6 px-3 py-1 rounded-pill">{h.title}</Badge>
                      </td>
                      <td className="text-end">
                        <Button variant="outline-danger" size="sm" className="rounded-pill" onClick={() => handleDeleteHoliday(h._id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHolidayModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Edit Attendance: {selectedEmployee?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Check In</Form.Label>
              <Form.Control 
                type="time" 
                value={editForm.checkIn}
                onChange={(e) => setEditForm({...editForm, checkIn: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Lunch Start</Form.Label>
              <Form.Control 
                type="time" 
                value={editForm.lunchStart}
                onChange={(e) => setEditForm({...editForm, lunchStart: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Lunch End</Form.Label>
              <Form.Control 
                type="time" 
                value={editForm.lunchEnd}
                onChange={(e) => setEditForm({...editForm, lunchEnd: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Check Out</Form.Label>
              <Form.Control 
                type="time" 
                value={editForm.checkOut}
                onChange={(e) => setEditForm({...editForm, checkOut: e.target.value})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveAttendance}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};

export default AttendanceDashboard;
