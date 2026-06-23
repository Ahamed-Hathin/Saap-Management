import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Row, Col, Card } from 'react-bootstrap';
import api from '../services/api';
import { ShoppingBag, CheckCircle, Clock, DollarSign, Users } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    deliveredOrders: 0,
    pendingPayments: 0,
    totalEmployees: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/orders/dashboard-stats');
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <Card className="dashboard-card h-100">
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0 fw-bold">Overview</h3>
        <span className="text-muted small">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
      </div>
      <Row className="g-3 mb-4">
        <Col xs={6} md={4}><StatCard title="Total Orders" value={stats.totalOrders} icon={<ShoppingBag size={20} />} color="primary" /></Col>
        <Col xs={6} md={4}><StatCard title="Active Orders" value={stats.activeOrders} icon={<Clock size={20} />} color="warning" /></Col>
        <Col xs={6} md={4}><StatCard title="Delivered" value={stats.deliveredOrders} icon={<CheckCircle size={20} />} color="success" /></Col>
        <Col xs={6} md={6}><StatCard title="Pending Pay" value={stats.pendingPayments} icon={<DollarSign size={20} />} color="danger" /></Col>
        <Col xs={6} md={6}><StatCard title="Employees" value={stats.totalEmployees} icon={<Users size={20} />} color="info" /></Col>
      </Row>
    </Layout>
  );
};

export default AdminDashboard;
