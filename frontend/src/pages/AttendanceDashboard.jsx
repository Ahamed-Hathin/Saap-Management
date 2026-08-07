import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Row, Col, Form, ButtonGroup, Button } from 'react-bootstrap';
import { Users, UserCheck, UserX, Clock, Coffee, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { formatDate } from '../utils/formatDate';

const AttendanceDashboard = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchAttendances();
  }, [dateFilter]);

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/admin?date=${dateFilter}`);
      setAttendances(res.data);
    } catch (error) {
      console.error('Error fetching admin attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Working':
      case 'Working After Lunch':
        return <Badge bg="primary">{status}</Badge>;
      case 'Completed':
        return <Badge bg="success">{status}</Badge>;
      case 'Late':
      case 'Early Exit':
        return <Badge bg="danger">{status}</Badge>;
      case 'Absent':
        return <Badge bg="dark">{status}</Badge>;
      case 'Lunch Break':
        return <Badge bg="warning" text="dark">{status}</Badge>;
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
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="d-flex align-items-center flex-grow-1">
          <div>
            <h2 className="mb-1 fw-bold text-dark d-flex align-items-center">
              <Users size={28} className="me-2 text-primary" />
              Time Tracking Dashboard
            </h2>
            <p className="text-muted mb-0">Track employee attendance and working hours</p>
          </div>
          <ButtonGroup className="ms-5 shadow-sm rounded-pill">
            <Button 
              variant={location.pathname === '/admin/my-attendance' ? 'primary' : 'light'} 
              className={`px-4 rounded-start-pill ${location.pathname === '/admin/my-attendance' ? '' : 'text-muted'}`}
              onClick={() => navigate('/admin/my-attendance')}
            >
              My Time Tracking
            </Button>
            <Button 
              variant={location.pathname === '/admin/attendance' ? 'primary' : 'light'} 
              className={`px-4 rounded-end-pill ${location.pathname === '/admin/attendance' ? '' : 'text-muted'}`}
              onClick={() => navigate('/admin/attendance')}
            >
              Manage Time Tracking
            </Button>
          </ButtonGroup>
        </div>
        <div className="d-flex align-items-center">
          <Form.Control 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="shadow-sm"
          />
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col md={2} xs={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="text-center p-3">
              <UserCheck size={24} className="text-success mb-2" />
              <h3 className="fw-black mb-0">{stats.present}</h3>
              <small className="text-muted fw-medium">Present</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} xs={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="text-center p-3">
              <Clock size={24} className="text-danger mb-2" />
              <h3 className="fw-black mb-0">{stats.late}</h3>
              <small className="text-muted fw-medium">Late Today</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} xs={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="text-center p-3">
              <Users size={24} className="text-primary mb-2" />
              <h3 className="fw-black mb-0">{stats.workingNow}</h3>
              <small className="text-muted fw-medium">Working Now</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} xs={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="text-center p-3">
              <LogOut size={24} className="text-info mb-2" />
              <h3 className="fw-black mb-0">{stats.checkedOut}</h3>
              <small className="text-muted fw-medium">Checked Out</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2} xs={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="text-center p-3">
              <UserX size={24} className="text-dark mb-2" />
              <h3 className="fw-black mb-0">{stats.absent}</h3>
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
                <th className="border-0">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center p-4 text-muted">Loading attendance data...</td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-4 text-muted">No attendance records found for this date.</td>
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
                    <td>{getStatusBadge(att.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Layout>
  );
};

export default AttendanceDashboard;
