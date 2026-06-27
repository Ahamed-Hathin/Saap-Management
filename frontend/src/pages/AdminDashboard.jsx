import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Row, Col, Card, Form } from 'react-bootstrap';
import api from '../services/api';
import { ShoppingBag, CheckCircle, Clock, IndianRupee, Package } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    readyToDispatch: 0,
    pendingPayments: 0,
    deliveredOrders: 0
  });
  const [filter, setFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchStats = async () => {
    try {
      let query = `?filter=${filter}`;
      if (filter === 'custom') {
        if (!customStartDate || !customEndDate) return;
        query += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }
      const { data } = await api.get(`/orders/dashboard-stats${query}`);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filter, customStartDate, customEndDate]);

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <Card 
      className="dashboard-card h-100" 
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
    >
      <Card.Body className="d-flex align-items-center p-3">
        <div className={`icon-wrapper bg-${color} bg-opacity-10 text-${color} me-3 p-2 p-md-3`}>
          {icon}
        </div>
        <div>
          <h6 className="text-muted text-uppercase tracking-wider mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>{title}</h6>
          <h3 className="mb-0 fw-bold">{value}</h3>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <Layout>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="mb-0 fw-bold">Overview</h3>
          <span className="text-muted small">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <Form.Select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="w-auto shadow-sm"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="weekly">Weekly (Last 7 Days)</option>
            <option value="monthly">Monthly (Last 30 Days)</option>
            <option value="custom">Custom Date</option>
          </Form.Select>

          {filter === 'custom' && (
            <div className="d-flex gap-2">
              <Form.Control 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="shadow-sm"
              />
              <Form.Control 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="shadow-sm"
              />
            </div>
          )}
        </div>
      </div>
      <Row className="g-3 mb-4">
        <Col xs={6} md={4}><StatCard title="Total Order" value={stats.totalOrders || 0} icon={<ShoppingBag size={20} />} color="primary" onClick={() => navigate('/admin/orders')} /></Col>
        <Col xs={6} md={4}><StatCard title="Pending Order" value={stats.pendingOrders || 0} icon={<Clock size={20} />} color="warning" onClick={() => navigate('/admin/orders?filter=pending')} /></Col>
        <Col xs={6} md={4}><StatCard title="Ready To Dispatch" value={stats.readyToDispatch || 0} icon={<Package size={20} />} color="info" onClick={() => navigate('/admin/orders?filter=ready')} /></Col>
        <Col xs={6} md={6}><StatCard title="Payment Pending" value={stats.pendingPayments || 0} icon={<IndianRupee size={20} />} color="danger" onClick={() => navigate('/admin/orders?filter=payment_pending')} /></Col>
        <Col xs={6} md={6}><StatCard title="Delivered" value={stats.deliveredOrders || 0} icon={<CheckCircle size={20} />} color="success" onClick={() => navigate('/admin/orders?filter=delivered')} /></Col>
      </Row>
    </Layout>
  );
};

export default AdminDashboard;
