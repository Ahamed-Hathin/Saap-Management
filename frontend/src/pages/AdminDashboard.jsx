import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Row, Col, Card, Form, ProgressBar, Table, Badge, Modal } from 'react-bootstrap';
import api from '../services/api';
import { ShoppingBag, CheckCircle, Clock, IndianRupee, Package, TrendingUp, DollarSign, Activity, FileText } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    readyToDispatch: 0,
    pendingPayments: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
    collectedRevenue: 0,
    pendingRevenue: 0,
    paymentBreakdown: {},
    chartData: [],
    recentOrders: []
  });
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [filter, setFilter] = useState(localStorage.getItem('globalDateFilter') || 'all');
  const [customStartDate, setCustomStartDate] = useState(localStorage.getItem('globalStartDate') || '');
  const [customEndDate, setCustomEndDate] = useState(localStorage.getItem('globalEndDate') || '');

  useEffect(() => {
    localStorage.setItem('globalDateFilter', filter);
    localStorage.setItem('globalStartDate', customStartDate);
    localStorage.setItem('globalEndDate', customEndDate);
  }, [filter, customStartDate, customEndDate]);

  const fetchStats = async () => {
    try {
      let query = `?filter=${filter}`;
      if (filter === 'custom') {
        if (!customStartDate || !customEndDate) return;
        query += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }
      const { data } = await api.get(`/orders/dashboard-stats${query}`);
      setStats({
        totalOrders: data.totalOrders || 0,
        pendingOrders: data.pendingOrders || 0,
        readyToDispatch: data.readyToDispatch || 0,
        pendingPayments: data.pendingPayments || 0,
        deliveredOrders: data.deliveredOrders || 0,
        totalRevenue: data.totalRevenue || 0,
        collectedRevenue: data.collectedRevenue || 0,
        pendingRevenue: data.pendingRevenue || 0,
        paymentBreakdown: data.paymentBreakdown || {},
        chartData: data.chartData || [],
        recentOrders: data.recentOrders || []
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filter, customStartDate, customEndDate]);

  const buildUrl = (statusFilter) => {
    let url = '/admin/orders';
    let params = [];
    if (statusFilter) params.push(`filter=${statusFilter}`);
    if (filter !== 'all') {
      params.push(`dateFilter=${filter}`);
      if (filter === 'custom' && customStartDate && customEndDate) {
        params.push(`startDate=${customStartDate}`);
        params.push(`endDate=${customEndDate}`);
      }
    }
    return params.length > 0 ? `${url}?${params.join('&')}` : url;
  };

  const getPercentage = (value) => {
    if (stats.totalOrders === 0) return 0;
    return Math.round((value / stats.totalOrders) * 100);
  };

  return (
    <Layout>
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="mb-0 fw-bold text-dark tracking-tight">Overview</h2>
          <p className="text-muted mt-1 mb-0" style={{ fontSize: '0.9rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-center bg-white rounded shadow-sm border p-1">
          <Form.Select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="border-0 shadow-none bg-transparent font-weight-medium text-dark"
            style={{ width: '130px', cursor: 'pointer' }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
            <option value="custom">Custom Date</option>
          </Form.Select>

          {filter === 'custom' && (
            <div className="d-flex gap-2 border-start ps-2 ms-1">
              <Form.Control 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border-0 bg-transparent shadow-none text-secondary"
              />
              <Form.Control 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border-0 bg-transparent shadow-none text-secondary"
              />
            </div>
          )}
        </div>
      </div>

      {/* Financial KPIs */}
      <Row className="g-3 mb-4">
        {/* Total Income */}
        <Col xs={12} md={6}>
          <Card className="border shadow-sm rounded-4 h-100 p-2 border-light" style={{ cursor: 'pointer' }} onClick={() => setShowIncomeModal(true)}>
            <Card.Body className="d-flex align-items-center p-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: '56px', height: '56px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', fontWeight: 600 }}>Total Income</h6>
                <h3 className="fw-bold mb-0 text-dark">₹{stats.collectedRevenue.toLocaleString()}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Pending Amount */}
        <Col xs={12} md={6}>
          <Card className="border shadow-sm rounded-4 h-100 p-2 border-light" style={{ cursor: 'pointer' }} onClick={() => navigate(buildUrl('payment_pending'))}>
            <Card.Body className="d-flex align-items-center p-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: '56px', height: '56px', backgroundColor: '#fefce8', color: '#ca8a04' }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', fontWeight: 600 }}>Pending Amount</h6>
                <h3 className="fw-bold mb-0 text-dark">₹{stats.pendingRevenue.toLocaleString()}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Order KPI Cards */}
      <Row className="g-3 mb-5">
        {/* Total Orders */}
        <Col xs={12} md={6} lg={4}>
          <Card className="border shadow-sm rounded-4 h-100 p-2 border-light" style={{ cursor: 'pointer' }} onClick={() => navigate(buildUrl(''))}>
            <Card.Body className="d-flex align-items-center p-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: '56px', height: '56px', backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                <ShoppingBag size={24} />
              </div>
              <div>
                <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', fontWeight: 600 }}>Total Order</h6>
                <h3 className="fw-bold mb-0 text-dark">{stats.totalOrders}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Pending Orders */}
        <Col xs={12} md={6} lg={4}>
          <Card className="border shadow-sm rounded-4 h-100 p-2 border-light" style={{ cursor: 'pointer' }} onClick={() => navigate(buildUrl('pending'))}>
            <Card.Body className="d-flex align-items-center p-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: '56px', height: '56px', backgroundColor: '#fffbeb', color: '#d97706' }}>
                <Clock size={24} />
              </div>
              <div>
                <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', fontWeight: 600 }}>Pending Order</h6>
                <h3 className="fw-bold mb-0 text-dark">{stats.pendingOrders}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Ready to Dispatch */}
        <Col xs={12} md={6} lg={4}>
          <Card className="border shadow-sm rounded-4 h-100 p-2 border-light" style={{ cursor: 'pointer' }} onClick={() => navigate(buildUrl('ready'))}>
            <Card.Body className="d-flex align-items-center p-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: '56px', height: '56px', backgroundColor: '#ecfeff', color: '#0891b2' }}>
                <Package size={24} />
              </div>
              <div>
                <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', fontWeight: 600 }}>Ready to Dispatch</h6>
                <h3 className="fw-bold mb-0 text-dark">{stats.readyToDispatch}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Payment Pending */}
        <Col xs={12} md={6} lg={5}>
          <Card className="border shadow-sm rounded-4 h-100 p-2 border-light" style={{ cursor: 'pointer' }} onClick={() => navigate(buildUrl('payment_pending'))}>
            <Card.Body className="d-flex align-items-center p-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: '56px', height: '56px', backgroundColor: '#fef2f2', color: '#dc2626' }}>
                <IndianRupee size={24} />
              </div>
              <div>
                <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', fontWeight: 600 }}>Payment Pending</h6>
                <h3 className="fw-bold mb-0 text-dark">{stats.pendingPayments || 0}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Delivered */}
        <Col xs={12} md={6} lg={5}>
          <Card className="border shadow-sm rounded-4 h-100 p-2 border-light" style={{ cursor: 'pointer' }} onClick={() => navigate(buildUrl('delivered'))}>
            <Card.Body className="d-flex align-items-center p-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: '56px', height: '56px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', fontWeight: 600 }}>Delivered</h6>
                <h3 className="fw-bold mb-0 text-dark">{stats.deliveredOrders}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Income Breakdown Modal */}
      <Modal show={showIncomeModal} onHide={() => setShowIncomeModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-5">Income Breakdown</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table hover responsive className="mb-0 border rounded overflow-hidden">
            <thead className="table-light">
              <tr>
                <th>Payment Method</th>
                <th className="text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.paymentBreakdown || {}).map(([method, amount]) => (
                <tr key={method}>
                  <td className="fw-medium">{method}</td>
                  <td className="text-end text-success fw-medium">₹{amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="table-light">
                <td className="fw-bold">Total Collected</td>
                <td className="text-end fw-bold text-success fs-5">₹{stats.collectedRevenue.toLocaleString()}</td>
              </tr>
            </tbody>
          </Table>
        </Modal.Body>
      </Modal>
    </Layout>
  );
};

export default AdminDashboard;
