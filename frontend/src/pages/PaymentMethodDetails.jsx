import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, Table, Spinner, Button, Form } from 'react-bootstrap';
import { ArrowLeft, Eye, Calendar } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { formatDate } from '../utils/formatDate';


const PaymentMethodDetails = () => {
  const { method } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const [filter, setFilter] = useState(searchParams.get('dateFilter') || 'all');
  const [customStartDate, setCustomStartDate] = useState(searchParams.get('startDate') || '');
  const [customEndDate, setCustomEndDate] = useState(searchParams.get('endDate') || '');

  useEffect(() => {
    fetchOrders();
  }, [filter, customStartDate, customEndDate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = `?filter=${filter}`;
      if (filter === 'custom') {
        if (!customStartDate || !customEndDate) {
          setLoading(false);
          return;
        }
        query += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }
      
      const { data } = await api.get('/orders' + query); // Ensure endpoint uses filters if possible or we can filter frontend

      // For safety, filter dates on frontend if backend doesn't support date filters on /orders
      let filteredData = data;
      
      const now = new Date();
      let filterStart = null;
      let filterEnd = null;

      if (filter === 'today') {
        const startOfToday = new Date(now).setHours(0, 0, 0, 0);
        const endOfToday = new Date(now).setHours(23, 59, 59, 999);
        filterStart = startOfToday;
        filterEnd = endOfToday;
        filteredData = filteredData.filter(o => new Date(o.updatedAt) >= startOfToday);
      } else if (filter === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const start = new Date(yesterday).setHours(0, 0, 0, 0);
        const end = new Date(yesterday).setHours(23, 59, 59, 999);
        filterStart = start;
        filterEnd = end;
        filteredData = filteredData.filter(o => new Date(o.updatedAt) >= start && new Date(o.updatedAt) <= end);
      } else if (filter === 'weekly') {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        const startWeekly = start.setHours(0, 0, 0, 0);
        filterStart = startWeekly;
        filteredData = filteredData.filter(o => new Date(o.updatedAt) >= startWeekly);
      } else if (filter === 'monthly') {
        const start = new Date(now);
        start.setDate(now.getDate() - 30);
        const startMonthly = start.setHours(0, 0, 0, 0);
        filterStart = startMonthly;
        filteredData = filteredData.filter(o => new Date(o.updatedAt) >= startMonthly);
      } else if (filter === 'custom' && customStartDate && customEndDate) {
        const start = new Date(customStartDate).setHours(0, 0, 0, 0);
        const end = new Date(customEndDate).setHours(23, 59, 59, 999);
        filterStart = start;
        filterEnd = end;
        filteredData = filteredData.filter(o => new Date(o.updatedAt) >= start && new Date(o.updatedAt) <= end);
      }

      const isDateInRange = (dateToCheck) => {
        if (!filterStart && !filterEnd) return true;
        const d = new Date(dateToCheck).getTime();
        if (filterStart && d < filterStart) return false;
        if (filterEnd && d > filterEnd) return false;
        return true;
      };

      const relevantOrders = filteredData.map(order => {
        let amountPaid = 0;
        let lastPaymentDate = order.createdAt;
        
        if (order.paymentMethod === method && order.advanceAmount > 0) {
          if (isDateInRange(order.createdAt)) {
            amountPaid += order.advanceAmount;
            lastPaymentDate = order.createdAt;
          }
        }
        
        if (order.balancePayments && order.balancePayments.length > 0) {
          order.balancePayments.forEach(bp => {
            if (bp.method === method && bp.amount > 0) {
              if (isDateInRange(bp.date)) {
                amountPaid += Number(bp.amount);
                lastPaymentDate = bp.date;
              }
            }
          });
        }
        
        return { ...order, amountPaid, lastPaymentDate };
      }).filter(order => order.amountPaid > 0);
      
      setOrders(relevantOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Swal.fire('Error', 'Failed to fetch payment details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = orders.reduce((sum, order) => sum + order.amountPaid, 0);

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button variant="light" onClick={() => navigate(-1)} className="rounded-circle p-2 shadow-sm border">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="mb-0 fw-bold text-dark">{method} Payments</h2>
            <p className="text-muted mb-0">Total amount received: ₹{totalAmount.toLocaleString()}</p>
          </div>
        </div>

      </div>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center p-5 text-muted">
              No payments found for {method} with the selected date range.
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Date</th>
                  <th className="py-3 border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Order No</th>
                  <th className="py-3 border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Client Name</th>
                  <th className="py-3 border-0 fw-semibold text-muted text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Order Total</th>
                  <th className="py-3 border-0 fw-semibold text-muted text-uppercase text-end pe-4" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Amount Paid ({method})</th>
                  <th className="py-3 border-0 fw-semibold text-muted text-uppercase text-center" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td className="px-4 text-dark fw-medium">
                      {formatDate(order.lastPaymentDate || order.createdAt)}
                    </td>
                    <td className="fw-medium text-primary">#{order.serialNumber}</td>
                    <td className="fw-bold text-dark">{order.clientName}</td>
                    <td className="text-muted fw-medium">₹{order.totalAmount?.toLocaleString()}</td>
                    <td className="text-end pe-4 fw-bold text-success">₹{order.amountPaid.toLocaleString()}</td>
                    <td className="text-center">
                      <Button variant="light" size="sm" onClick={() => navigate(`/orders/${order._id}`)} className="rounded-pill px-3 fw-medium">
                        <Eye size={16} className="me-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Layout>
  );
};

export default PaymentMethodDetails;
