import { useState, useEffect, useContext } from 'react';
import { Card, Table, Badge, Form, Row, Col, Button } from 'react-bootstrap';
import { Calendar, Clock, UserCheck, UserX, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const MonthlyAttendance = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const currentDate = new Date();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const currentYear = currentDate.getFullYear().toString();
  
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState('');

  useEffect(() => {
    const fetchMonthlyAttendance = async () => {
      try {
        setLoading(true);
        const endpoint = `/attendance/monthly/${id}`;
        const res = await api.get(`${endpoint}?month=${month}&year=${year}`);
        setAttendances(res.data);
        if (res.data.length > 0 && res.data[0].employeeId?.name) {
          setEmployeeName(res.data[0].employeeId.name);
        } else {
          // Fetch user name if needed, or leave blank if no attendance records
          try {
             const userRes = await api.get('/users');
             const emp = userRes.data.find(u => u._id === id);
             if(emp) setEmployeeName(emp.name);
          } catch (error) {
             console.error('Error fetching user for name:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching monthly attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyAttendance();
  }, [month, year, id, user.name]);

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

  const formatDateStr = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Calculate statistics
  const stats = {
    totalDays: attendances.length,
    present: attendances.filter(a => ['Completed', 'Late', 'Early Exit'].includes(a.status) || a.checkIn).length,
    absent: attendances.filter(a => a.status === 'Absent').length,
    late: attendances.filter(a => a.isLate).length,
    totalWorkingMins: attendances.reduce((acc, curr) => acc + (curr.workingMinutes || 0), 0)
  };

  const years = Array.from(new Array(5), (val, index) => currentYear - index);
  const months = [
    { value: '01', label: 'January' }, { value: '02', label: 'February' },
    { value: '03', label: 'March' }, { value: '04', label: 'April' },
    { value: '05', label: 'May' }, { value: '06', label: 'June' },
    { value: '07', label: 'July' }, { value: '08', label: 'August' },
    { value: '09', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="d-flex align-items-center">
          {id && (
            <Button variant="light" className="me-3 shadow-sm rounded-circle p-2" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
          )}
          <div>
            <h2 className="mb-1 fw-bold text-dark d-flex align-items-center">
              <Calendar size={28} className="me-2 text-primary" />
              Monthly Time Tracking
            </h2>
            <p className="text-muted mb-0">
              {employeeName ? `Viewing records for ${employeeName}` : 'Viewing monthly records'}
            </p>
          </div>
        </div>
        
        <div className="d-flex align-items-center gap-2">
          <Form.Select 
            value={month} 
            onChange={(e) => setMonth(e.target.value)}
            className="shadow-sm"
            style={{ width: '140px' }}
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Form.Select>
          <Form.Select 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            className="shadow-sm"
            style={{ width: '100px' }}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Form.Select>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col md={3} xs={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="text-center p-3">
              <UserCheck size={24} className="text-success mb-2" />
              <h3 className="fw-black mb-0">{stats.present}</h3>
              <small className="text-muted fw-medium">Days Present</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} xs={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="text-center p-3">
              <UserX size={24} className="text-dark mb-2" />
              <h3 className="fw-black mb-0">{stats.absent}</h3>
              <small className="text-muted fw-medium">Days Absent</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} xs={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="text-center p-3">
              <AlertTriangle size={24} className="text-danger mb-2" />
              <h3 className="fw-black mb-0">{stats.late}</h3>
              <small className="text-muted fw-medium">Days Late</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} xs={6}>
          <Card className="border-0 shadow-sm rounded-4 h-100 bg-white">
            <Card.Body className="text-center p-3">
              <Clock size={24} className="text-primary mb-2" />
              <h3 className="fw-black mb-0">{formatDuration(stats.totalWorkingMins)}</h3>
              <small className="text-muted fw-medium">Total Working Time</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="dashboard-card border-0 mb-4 shadow-sm rounded-4">
        <Card.Body className="p-0">
          <Table responsive className="table-custom mb-0">
            <thead className="bg-light">
              <tr>
                <th className="border-0">Date</th>
                <th className="border-0">Check In</th>
                <th className="border-0">Lunch Start</th>
                <th className="border-0">Lunch End</th>
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
                  <td colSpan="7" className="text-center p-4 text-muted">No attendance records found for this month.</td>
                </tr>
              ) : (
                attendances.map((att, index) => (
                  <tr key={index}>
                    <td className="fw-bold">{formatDateStr(att.date)}</td>
                    <td>{formatTime(att.checkIn)}</td>
                    <td>{formatTime(att.lunchStart)}</td>
                    <td>{formatTime(att.lunchEnd)}</td>
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

export default MonthlyAttendance;
