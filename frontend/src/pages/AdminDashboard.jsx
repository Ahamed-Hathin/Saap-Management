import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Row, Col, Card, Form, ProgressBar, Table, Badge, Modal } from 'react-bootstrap';
import api from '../services/api';
import { ShoppingBag, CheckCircle, Clock, IndianRupee, Package, TrendingUp, DollarSign, Activity, FileText, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

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
        <div className="d-flex flex-column flex-sm-row gap-3 align-items-sm-center">
          <div className="d-flex gap-2">
            <button onClick={() => navigate('/admin/orders')} className="btn btn-primary d-flex align-items-center gap-2 border-0 shadow-sm" style={{ fontWeight: 600 }}>
              <Plus size={18} /> <span className="d-none d-sm-inline">New Order</span>
            </button>
            <button onClick={() => navigate('/admin/tasks')} className="btn btn-light d-flex align-items-center gap-2 border shadow-sm" style={{ fontWeight: 600, color: '#4f46e5' }}>
              <CheckCircle size={18} /> <span className="d-none d-sm-inline">Tasks</span>
            </button>
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
      </div>

      {/* Order KPI Cards */}
      <Row className="g-3 mb-4">
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
        <Col xs={12} md={6} lg={4}>
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
        <Col xs={12} md={6} lg={4}>
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

      {/* Analytics & Revenue Breakdown */}
      {(stats.chartData && stats.chartData.length > 0) && (
        <Row className="mb-4 fade-in g-3">
          {/* Financial KPIs (Left Side) */}
          <Col xs={12} lg={4} className="d-flex flex-column gap-3">
            {/* Total Income */}
            <Card className="border shadow-sm rounded-4 border-light bg-white flex-grow-1" style={{ cursor: 'pointer' }} onClick={() => setShowIncomeModal(true)}>
              <Card.Body className="d-flex align-items-center p-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                  <DollarSign size={24} />
                </div>
                <div>
                  <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', fontWeight: 600 }}>Total Income</h6>
                  <h4 className="fw-bold mb-0 text-dark">₹{stats.collectedRevenue.toLocaleString()}</h4>
                </div>
              </Card.Body>
            </Card>

            {/* Pending Amount */}
            <Card className="border shadow-sm rounded-4 border-light bg-white flex-grow-1" style={{ cursor: 'pointer' }} onClick={() => navigate(buildUrl('payment_pending'))}>
              <Card.Body className="d-flex align-items-center p-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px', backgroundColor: '#fefce8', color: '#ca8a04' }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', fontWeight: 600 }}>Pending Amount</h6>
                  <h4 className="fw-bold mb-0 text-dark">₹{stats.pendingRevenue.toLocaleString()}</h4>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Area Chart */}
          <Col xs={12} lg={8}>
            <Card className="border shadow-sm rounded-4 border-light overflow-hidden h-100">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold text-dark mb-0 d-flex align-items-center">
                    <Activity size={20} className="me-2 text-primary" />
                    Revenue & Orders Overview
                  </h5>
                </div>
                <div style={{ width: '100%', height: '320px' }}>
                  <ResponsiveContainer>
                    <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} tickMargin={10} />
                      <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                        itemStyle={{ fontWeight: 600 }}
                      />
                      <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                      <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" name="Orders" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>

        </Row>
      )}

      {/* Recent Orders and Pie Chart */}
      {stats.recentOrders && stats.recentOrders.length > 0 && (
        <Row className="mb-4 fade-in g-3">
          {/* Recent Orders */}
          <Col xs={12} lg={8}>
            <Card className="border shadow-sm rounded-4 border-light overflow-hidden h-100">
              <Card.Header className="bg-white border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center">
                  <ShoppingBag size={20} className="me-2 text-primary" />
                  Recent Orders
                </h5>
                <button 
                  onClick={() => navigate('/admin/orders')} 
                  className="btn btn-sm btn-light border text-primary fw-medium px-3 rounded-pill"
                >
                  View All
                </button>
              </Card.Header>
              <Card.Body className="p-0 mt-3">
                <Table responsive hover className="mb-0 table-custom align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4 text-secondary font-weight-semibold">Order ID</th>
                      <th className="text-secondary font-weight-semibold">Client Name</th>
                      <th className="text-secondary font-weight-semibold">Assigned To</th>
                      <th className="text-secondary font-weight-semibold">Status</th>
                      <th className="pe-4 text-end text-secondary font-weight-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((order) => (
                      <tr key={order._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${order._id}`)}>
                        <td className="ps-4 fw-medium text-primary">#{order.serialNumber}</td>
                        <td className="fw-medium text-dark">{order.clientName}</td>
                        <td className="text-muted">
                          {order.assignedEmployee ? order.assignedEmployee.name : 'Unassigned'}
                        </td>
                        <td>
                          <Badge 
                            bg={
                              order.status === 'Delivered' ? 'success' : 
                              order.status === 'Ready To Dispatch' ? 'info' : 
                              'warning'
                            }
                            className="rounded-pill px-3 py-2 fw-medium"
                          >
                            {order.status}
                          </Badge>
                        </td>
                        <td className="pe-4 text-end fw-bold text-dark">₹{order.totalAmount?.toLocaleString() || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          {/* Revenue by Payment Method Pie Chart */}
          <Col xs={12} lg={4}>
            <Card className="border shadow-sm rounded-4 border-light overflow-hidden h-100">
              <Card.Body className="p-4 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold text-dark mb-0 d-flex align-items-center">
                    <FileText size={20} className="me-2 text-primary" />
                    Payment Methods
                  </h5>
                </div>
                <div style={{ width: '100%', height: '320px' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={Object.entries(stats.paymentBreakdown || {})
                          .filter(([_, val]) => val > 0)
                          .map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {Object.entries(stats.paymentBreakdown || {})
                          .filter(([_, val]) => val > 0)
                          .map((entry, index) => {
                            const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                            return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                          })}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => `₹${value.toLocaleString()}`}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}


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
