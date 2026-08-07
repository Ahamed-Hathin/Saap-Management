import React, { useContext } from 'react';
import Layout from '../components/Layout';
import AttendanceCard from '../components/AttendanceCard';
import { Row, Col, ButtonGroup, Button } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock } from 'lucide-react';

const MyAttendance = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="d-flex align-items-center flex-grow-1">
          <div>
            <h2 className="mb-1 fw-bold text-dark d-flex align-items-center">
              <Clock size={28} className="me-2 text-primary" />
              My Time Tracking
            </h2>
            <p className="text-muted mb-0">Track your daily attendance and working hours</p>
          </div>
          
          {user?.role === 'Admin' && (
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
          )}
        </div>
      </div>

      <Row>
        <Col md={8} lg={6}>
          <AttendanceCard />
        </Col>
      </Row>
    </Layout>
  );
};

export default MyAttendance;
