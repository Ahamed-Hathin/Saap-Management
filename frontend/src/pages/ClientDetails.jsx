import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, Table, Badge, Button, Row, Col, Form, Modal } from 'react-bootstrap';
import api from '../services/api';
import { ArrowLeft, User, Phone, IndianRupee, FileText, Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

const ClientDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayAllModal, setShowPayAllModal] = useState(false);
  const [payAllPayments, setPayAllPayments] = useState([{ amount: '', method: '' }]);

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

  const handlePayAllClick = () => {
    if (!data || !data.summary.pendingBalance) return;
    setPayAllPayments([{ amount: data.summary.pendingBalance, method: '' }]);
    setShowPayAllModal(true);
  };

  const handlePayAllSubmit = async (e) => {
    e.preventDefault();
    try {
      const validPayments = payAllPayments.filter(p => p.amount && p.method).map(p => ({
        amount: Number(p.amount),
        method: p.method
      }));
      
      const totalEntered = validPayments.reduce((sum, p) => sum + p.amount, 0);
      if (totalEntered > data.summary.pendingBalance) {
        Swal.fire('Error', 'Total amount entered cannot exceed pending balance', 'error');
        return;
      }

      setLoading(true);
      await api.post(`/clients/${id}/pay-all`, { payments: validPayments });
      setShowPayAllModal(false);
      await fetchClientOrders();
      Swal.fire('Success', 'Payments applied successfully', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to clear payments', 'error');
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setLoading(true);
      await api.put(`/orders/${orderId}`, { status: newStatus });
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        icon: 'success',
        title: 'Status updated successfully'
      });
      await fetchClientOrders();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to update status', 'error');
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

        <Col md={3} lg={2}>
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

        <Col md={3} lg={2}>
          <Card className="border-0 shadow-sm rounded-4 h-100 text-center">
            <Card.Body className="p-4">
              <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle d-inline-block mb-3">
                <IndianRupee size={20} />
              </div>
              <h6 className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>Total Amount</h6>
              <h3 className="fw-bold mb-0 text-primary">₹{summary.totalBilled.toLocaleString()}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} lg={2}>
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

        <Col md={3} lg={2}>
          <Card className="border-0 shadow-sm rounded-4 h-100 text-center">
            <Card.Body className="p-4">
              <div className="bg-danger bg-opacity-10 text-danger p-2 rounded-circle d-inline-block mb-3">
                <IndianRupee size={20} />
              </div>
              <h6 className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>Pending Balance</h6>
              <h3 className="fw-bold mb-0 text-danger">₹{summary.pendingBalance.toLocaleString()}</h3>
              {summary.pendingBalance > 0 && (
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  className="mt-3 w-100 fw-bold rounded-pill" 
                  onClick={handlePayAllClick}
                >
                  Pay All
                </Button>
              )}
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
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Description</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Status</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase text-end" style={{fontSize: '0.85rem'}}>Total</th>
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
                  <td 
                    className="py-3 px-4 text-truncate" 
                    style={{ maxWidth: '200px', cursor: order.description ? 'pointer' : 'default' }} 
                    title={order.description ? "Click to view full description" : ""}
                    onClick={() => {
                      if (order.description) {
                        Swal.fire({ title: 'Description', html: `<div style="text-align: left; font-size: 15px; line-height: 1.5;">${order.description.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</div>` });
                      }
                    }}
                  >
                    {order.description || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <Form.Select 
                      size="sm" 
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="rounded-pill shadow-none"
                      style={{ minWidth: '130px', cursor: 'pointer' }}
                    >
                      <option value="Printing">Printing</option>
                      <option value="Cutting">Cutting</option>
                      <option value="Ready To Dispatch">Ready To Dispatch</option>
                      <option value="Delivered">Delivered</option>
                    </Form.Select>
                  </td>
                  <td className="py-3 px-4 text-end fw-bold">₹{order.totalAmount || 0}</td>
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

      <Modal backdrop="static" show={showPayAllModal} onHide={() => setShowPayAllModal(false)} centered contentClassName="border-0 rounded-4 shadow-lg">
        <Modal.Header closeButton className="border-0 pb-0 mt-3 mx-2">
          <Modal.Title className="fw-bold">Pay All Pending (₹{data.summary.pendingBalance})</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePayAllSubmit}>
          <Modal.Body className="px-4 pt-4">
            {payAllPayments.map((bp, i) => (
              <div key={i} className="d-flex gap-2 mb-3">
                <Form.Control
                  type="number"
                  placeholder="Amount"
                  required={!!bp.method}
                  value={bp.amount}
                  onChange={(e) => {
                    const newBps = [...payAllPayments];
                    newBps[i].amount = e.target.value;
                    setPayAllPayments(newBps);
                  }}
                  className="bg-light"
                />
                <Form.Select
                  required={!!bp.amount}
                  value={bp.method}
                  onChange={(e) => {
                    const newBps = [...payAllPayments];
                    newBps[i].method = e.target.value;
                    setPayAllPayments(newBps);
                  }}
                  className="bg-light"
                >
                  <option value="">Method</option>
                  <option value="GPay">GPay</option>
                  <option value="B-Gpay">B-Gpay</option>
                  <option value="KVB">KVB</option>
                  <option value="Dtdc Wallet">Dtdc Wallet</option>
                  <option value="Cash">Cash</option>
                  <option value="Discount Amount">Discount Amount</option>
                </Form.Select>
                {payAllPayments.length > 1 && (
                  <Button variant="outline-danger" onClick={() => {
                    const newBps = payAllPayments.filter((_, idx) => idx !== i);
                    setPayAllPayments(newBps);
                  }}>
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline-primary" size="sm" onClick={() => setPayAllPayments([...payAllPayments, { amount: '', method: '' }])}>
              <Plus size={16} className="me-1" /> Add Payment Split
            </Button>
            
            <div className="mt-3 text-muted small fw-medium">
              Total split entered: ₹{payAllPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)} / ₹{data.summary.pendingBalance}
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 px-4 pb-4">
            <Button variant="light" onClick={() => setShowPayAllModal(false)} className="fw-medium">Cancel</Button>
            <Button variant="primary" type="submit" className="fw-medium px-4">Submit Payment</Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </Layout>
  );
};

export default ClientDetails;
