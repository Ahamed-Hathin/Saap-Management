import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Clock, Play, Pause, Square, CheckSquare } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../services/api';

const AttendanceCard = () => {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchAttendance();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/today');
      setAttendance(res.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (endpoint, actionName, successMessage) => {
    try {
      const res = await api.post(`/attendance/${endpoint}`);
      setAttendance(res.data);
      Swal.fire({
        icon: 'success',
        title: successMessage,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Action Failed',
        text: error.response?.data?.message || 'Something went wrong'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Working':
      case 'Working After Lunch':
        return 'primary';
      case 'Completed':
        return 'success';
      case 'Late':
      case 'Early Exit':
        return 'danger';
      case 'Absent':
        return 'dark';
      case 'Lunch Break':
        return 'warning';
      default:
        return 'secondary';
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

  const getLiveWorkingTime = () => {
    if (!attendance || !attendance.checkIn) return '--';

    let workingMs = 0;

    if (attendance.checkOut) {
      workingMs = new Date(attendance.checkOut).getTime() - new Date(attendance.checkIn).getTime();
    } else {
      workingMs = currentTime.getTime() - new Date(attendance.checkIn).getTime();
    }

    if (attendance.lunchDuration) {
      workingMs -= attendance.lunchDuration * 60000;
    } else if (attendance.lunchStart && !attendance.lunchEnd) {
      workingMs -= (currentTime.getTime() - new Date(attendance.lunchStart).getTime());
    }

    if (workingMs < 0) return '00 : 00 : 00';

    const hrs = Math.floor(workingMs / 3600000).toString().padStart(2, '0');
    const mins = Math.floor((workingMs % 3600000) / 60000).toString().padStart(2, '0');
    const secs = Math.floor((workingMs % 60000) / 1000).toString().padStart(2, '0');

    return `${hrs} : ${mins} : ${secs}`;
  };

  if (loading) return <div>Loading attendance...</div>;

  const status = attendance?.status || 'Not Checked In';

  return (
    <Card className="shadow-sm mb-4 border-0 rounded-4">
      <Card.Body className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0 text-dark d-flex align-items-center">
            <Clock size={20} className="me-2 text-primary" />
            Today's Time Tracking
          </h5>
          <Badge bg={getStatusColor(status)} className="px-3 py-2 rounded-pill fs-6">
            {status}
          </Badge>
        </div>

        <div className="bg-light p-3 rounded-4 mb-4 text-center">
          <small className="text-muted d-block fw-bold mb-1">Working Time</small>
          <div className="fs-2 fw-black text-dark" style={{ fontFamily: 'monospace' }}>
            {getLiveWorkingTime()}
          </div>
        </div>

        <div className="d-flex justify-content-around mb-4 text-center">
          <div>
            <small className="text-muted d-block mb-1">Check In</small>
            <strong className="text-dark">{formatTime(attendance?.checkIn)}</strong>
          </div>
          <div>
            <small className="text-muted d-block mb-1">Lunch Start</small>
            <strong className="text-dark">{formatTime(attendance?.lunchStart)}</strong>
          </div>
          <div>
            <small className="text-muted d-block mb-1">Lunch End</small>
            <strong className="text-dark">{formatTime(attendance?.lunchEnd)}</strong>
          </div>
          <div>
            <small className="text-muted d-block mb-1">Check Out</small>
            <strong className="text-dark">{formatTime(attendance?.checkOut)}</strong>
          </div>
        </div>
        
        <div className="d-flex justify-content-around mb-4 text-center border-top pt-3">
          <div>
            <small className="text-muted d-block mb-1">Lunch Duration</small>
            <strong className="text-dark">{formatDuration(attendance?.lunchDuration)}</strong>
          </div>
          <div>
            <small className="text-muted d-block mb-1">Total Working Time</small>
            <strong className="text-dark">{formatDuration(attendance?.workingMinutes)}</strong>
          </div>
        </div>

        <div className="d-flex justify-content-center mt-3">
          {(!attendance?.checkIn) && (
            <Button 
              variant="primary" 
              className="px-4 py-2 rounded-pill d-flex align-items-center shadow-sm"
              onClick={() => handleAction('checkin', 'Check In', 'Check In Successful')}
            >
              <Play size={18} className="me-2" /> Check In
            </Button>
          )}

          {(attendance?.checkIn && !attendance?.lunchStart && !attendance?.checkOut) && (
            <Button 
              variant="warning" 
              className="px-4 py-2 rounded-pill d-flex align-items-center shadow-sm text-dark"
              onClick={() => handleAction('lunch/start', 'Start Lunch', 'Lunch Started')}
            >
              <Pause size={18} className="me-2" /> Start Lunch
            </Button>
          )}

          {(attendance?.lunchStart && !attendance?.lunchEnd && !attendance?.checkOut) && (
            <Button 
              variant="success" 
              className="px-4 py-2 rounded-pill d-flex align-items-center shadow-sm"
              onClick={() => handleAction('lunch/end', 'End Lunch', 'Lunch Ended')}
            >
              <Play size={18} className="me-2" /> End Lunch
            </Button>
          )}

          {(attendance?.checkIn && (!attendance?.lunchStart || attendance?.lunchEnd) && !attendance?.checkOut) && (
            <Button 
              variant="danger" 
              className="px-4 py-2 rounded-pill d-flex align-items-center shadow-sm ms-2"
              onClick={() => handleAction('checkout', 'Check Out', 'Check Out Successful')}
            >
              <Square size={18} className="me-2" /> Check Out
            </Button>
          )}
          
          {attendance?.checkOut && (
            <Button variant="secondary" className="px-4 py-2 rounded-pill d-flex align-items-center shadow-sm" disabled>
              <CheckSquare size={18} className="me-2" /> Completed
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default AttendanceCard;
