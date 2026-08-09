import { useState, useEffect, useContext } from 'react';
import { Card, Table, Form, Button } from 'react-bootstrap';
import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const OverallMonthlyAttendance = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const currentDate = new Date();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const currentYear = currentDate.getFullYear().toString();
  
  const [monthYear, setMonthYear] = useState(`${currentYear}-${currentMonth}`);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.role !== 'Admin') {
      navigate('/login');
      return;
    }

    const fetchOverallAttendance = async () => {
      try {
        setLoading(true);
        const [selectedYear, selectedMonth] = monthYear.split('-');
        const res = await api.get(`/attendance/monthly-all?month=${selectedMonth}&year=${selectedYear}`);
        setRecords(res.data);
      } catch (error) {
        console.error('Error fetching overall monthly attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverallAttendance();
  }, [monthYear, user, navigate]);

  

  const formatWorkingHours = (ms) => {
    if (!ms || ms <= 0) return '0h 0m';
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const filteredRecords = records.filter(record => 
    record.employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="d-flex align-items-center">
          <Button variant="light" className="me-3 shadow-sm rounded-circle p-2" onClick={() => navigate('/admin/attendance')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="mb-1 fw-bold text-dark d-flex align-items-center">
              Overall Monthly Overview
            </h2>
            <p className="text-muted mb-0">Track monthly attendance metrics for all employees</p>
          </div>
        </div>
        
        <div className="d-flex gap-2 align-items-center">
          <div className="position-relative">
            <Search size={18} className="position-absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <Form.Control
              type="text"
              placeholder="Search employee..."
              className="shadow-sm rounded-pill border-0 ps-5 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '200px' }}
            />
          </div>
          <Form.Control 
            type="month"
            className="shadow-sm rounded-pill px-3 border-0 bg-white"
            value={monthYear} 
            onChange={(e) => setMonthYear(e.target.value)}
            style={{ width: '160px' }}
          />
        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <Card.Body className="p-0">
          <Table responsive className="mb-0">
            <thead className="bg-light text-muted">
              <tr>
                <th className="py-3 px-4 border-bottom-0">Employee Name</th>
                <th className="py-3 px-4 border-bottom-0 text-center">Days Present</th>
                <th className="py-3 px-4 border-bottom-0 text-center">Days Late</th>
                <th className="py-3 px-4 border-bottom-0 text-center">Days Absent</th>
                <th className="py-3 px-4 border-bottom-0 text-center">Total Working Hours</th>
                <th className="py-3 px-4 border-bottom-0 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">Loading overview...</td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">No attendance data found for this month</td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => (
                  <tr key={record.employee._id} className="align-middle">
                    <td className="px-4 py-3 fw-bold">{record.employee.name}</td>
                    <td className="px-4 py-3 text-center text-success fw-bold">{record.daysPresent}</td>
                    <td className="px-4 py-3 text-center text-warning fw-bold">{record.daysLate}</td>
                    <td className="px-4 py-3 text-center text-danger fw-bold">{record.daysAbsent}</td>
                    <td className="px-4 py-3 text-center fw-medium">{formatWorkingHours(record.totalWorkingMs)}</td>
                    <td className="px-4 py-3 text-center">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="rounded-pill px-3"
                        onClick={() => navigate(`/admin/attendance/employee/${record.employee._id}/monthly`)}
                      >
                        <Search size={16} className="me-1" /> View Daily
                      </Button>
                    </td>
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

export default OverallMonthlyAttendance;
