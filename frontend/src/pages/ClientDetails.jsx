import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, Table, Badge, Button, Row, Col } from 'react-bootstrap';
import api from '../services/api';
import { ArrowLeft, User, Phone, IndianRupee, FileText } from 'lucide-react';
import Swal from 'sweetalert2';

const ClientDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientOrders();
  }, [id]);

  const fetchClientOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/clients/${id}/orders`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch client details', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center vh-100">
          Loading...
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center p-5">
          <h4 className="text-muted">Client not found</h4>
          <Link to="/clients" className="btn btn-primary mt-3">Back to Clients</Link>
        </div>
      </Layout>
    );
  }

  const { client, summary, orders } = data;

  return (
    <Layout>
      <div className="mb-4 d-flex align-items-center">
        <Link to="/clients" className="btn btn-light rounded-circle p-2 me-3 shadow-sm">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="fw-bold mb-0">Client Details</h2>
      </div>

      <Row className="g-4 mb-5">
        <Col md={12} lg={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4 d-flex flex-column justify-content-center">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle me-3">
                  <User size={24} />
                </div>
                <div>
                  <h4 className="fw-bold mb-0">{client.clientName}</h4>
                  <span className="badge bg-light text-primary border border-primary mt-1">@{client.username}</span>
                </div>
              </div>
              <div className="d-flex align-items-center text-secondary">
                <Phone size={18} className="me-2" />
                <span className="fw-medium">{client.mobileNumber}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} lg={2}>
          <Card className="border-0 shadow-sm rounded-4 h-100 text-center">
            <Card.Body className="p-4">
              <div className="bg-info bg-opacity-10 text-info p-2 rounded-circle d-inline-block mb-3">
                <FileText size={20} />
              </div>
              <h6 className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>Total Orders</h6>
              <h3 className="fw-bold mb-0">{summary.totalOrders}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} lg={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100 text-center">
            <Card.Body className="p-4">
              <div className="bg-success bg-opacity-10 text-success p-2 rounded-circle d-inline-block mb-3">
                <IndianRupee size={20} />
              </div>
              <h6 className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>Total Paid</h6>
              <h3 className="fw-bold mb-0 text-success">₹{summary.totalPaid.toLocaleString()}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} lg={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100 text-center">
            <Card.Body className="p-4">
              <div className="bg-danger bg-opacity-10 text-danger p-2 rounded-circle d-inline-block mb-3">
                <IndianRupee size={20} />
              </div>
              <h6 className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>Pending Balance</h6>
              <h3 className="fw-bold mb-0 text-danger">₹{summary.pendingBalance.toLocaleString()}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="bg-white p-4 border-bottom">
          <h5 className="fw-bold mb-0">Order History</h5>
        </div>
        <Table responsive hover className="mb-0 align-middle text-nowrap">
          <thead className="bg-light">
            <tr>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Date</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Order No</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Job Type</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Status</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase text-end" style={{fontSize: '0.85rem'}}>Total</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Payment Breakdown</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase text-end" style={{fontSize: '0.85rem'}}>Pending</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              let orderPaid = order.advanceAmount || 0;
              if (order.balancePayments && Array.isArray(order.balancePayments)) {
                order.balancePayments.forEach(bp => {
                  orderPaid += (bp.amount || 0);
                });
              }
              const orderPending = Math.max(0, (order.totalAmount || 0) - orderPaid);
              const dateObj = new Date(order.createdAt);
              const formattedDate = dateObj.toLocaleDateString('en-GB');
              
              let statusBadge = 'secondary';
              if (order.status === 'Printing') statusBadge = 'primary';
              else if (order.status === 'Cutting') statusBadge = 'warning';
              else if (order.status === 'Ready To Dispatch') statusBadge = 'info';
              else if (order.status === 'Delivered') statusBadge = 'success';

              return (
                <tr key={order._id}>
                  <td className="py-3 px-4 fw-medium text-secondary">{formattedDate}</td>
                  <td className="py-3 px-4">
                    <Link to={`/orders/${order._id}`} className="fw-bold text-decoration-none text-primary">
                      #{order.serialNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-4">{order.cardType}</td>
                  <td className="py-3 px-4">
                    <Badge bg={statusBadge} className="px-2 py-1 rounded-pill fw-medium">
                      {order.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-end fw-bold">₹{order.totalAmount || 0}</td>
                  <td className="py-3 px-4">
                    {order.advanceAmount > 0 && (
                      <div className="small fw-medium text-success mb-1">
                        Adv: ₹{order.advanceAmount} <span className="text-muted fw-normal">({order.paymentMethod || 'None'})</span>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(order.createdAt).toLocaleDateString('en-GB')}</div>
                      </div>
                    )}
                    {order.balancePayments && order.balancePayments.length > 0 && order.balancePayments.map((bp, i) => (
                      <div key={i} className="small fw-medium text-success mb-1">
                        Bal: ₹{bp.amount} <span className="text-muted fw-normal">({bp.method || 'None'})</span>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{bp.date ? new Date(bp.date).toLocaleDateString('en-GB') : '-'}</div>
                      </div>
                    ))}
                    {orderPaid === 0 && <span className="text-muted small">No payments yet</span>}
                  </td>
                  <td className="py-3 px-4 text-end fw-bold text-danger">₹{orderPending}</td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-5 text-muted">
                  No orders found for this client.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </Layout>
  );
};

export default ClientDetails;
