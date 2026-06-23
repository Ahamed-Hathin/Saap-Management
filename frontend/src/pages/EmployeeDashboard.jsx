import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Row, Col, Card, Table, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ShoppingBag, CheckCircle, Clock, Plus } from 'lucide-react';

const EmployeeDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState({ jobTypes: ['Visiting Card', 'Invitation', 'Offset', 'Screen', 'Digital', 'Lamination'], printingCompanies: ['In-House', 'Partner A', 'Partner B', 'Other'] });
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    clientName: '',
    mobileNumber: '',
    cardType: '',
    advanceAmount: 0,
    totalAmount: 0,
    advanceReceived: false,
    paymentMethod: 'None',
    printingCompany: 'None'
  });

  const fetchData = async () => {
    try {
      const ordersRes = await api.get('/orders');
      setOrders(ordersRes.data);
      const setRes = await api.get('/settings');
      if (setRes.data) setSettings(setRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShow = () => {
    setFormData({
      clientName: '', mobileNumber: '', cardType: settings.jobTypes.length > 0 ? settings.jobTypes[0] : 'Visiting Card', advanceAmount: 0, totalAmount: 0,
      advanceReceived: false, paymentMethod: 'None', printingCompany: 'None'
    });
    setFile(null);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: newOrder } = await api.post('/orders', formData);

      if (file) {
        const uploadData = new FormData();
        uploadData.append('image', file);
        await api.post(`/orders/${newOrder._id}/upload`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const statusOptions = [
    'Processing', 'Design Uploaded', 'Ready', 'Delivered'
  ];

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="mb-1 fw-bold">My Orders</h2>
          <p className="text-muted mb-0">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Button variant="primary" onClick={handleShow} className="d-flex align-items-center">
          <Plus size={18} className="me-2" /> Create Order
        </Button>
      </div>

      <Card className="dashboard-card border-0 mb-4">
        <Card.Body className="p-0">
          {orders.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <h5 className="fw-medium mb-3">No orders assigned</h5>
              <p className="mb-3">You currently have no orders assigned to you.</p>
              <Button variant="outline-primary" onClick={handleShow} className="mt-2">
                <Plus size={18} className="me-2" /> Create First Order
              </Button>
            </div>
          ) : (
            <>
              <Table className="table-custom mb-0 d-none d-md-table">
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>Job</th>
                    <th>Printing</th>
                    <th className="text-nowrap">Status</th>
                    <th className="text-nowrap">Date</th>
                    <th className="text-end text-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>{order.clientName}</td>
                      <td className="text-capitalize">{order.cardType}</td>
                      <td>{order.printingCompany !== 'None' ? order.printingCompany : '-'}</td>
                      <td className="text-nowrap">
                        <span className={`badge-custom badge-${order.status === 'Delivered' ? 'success' : 'warning'} text-nowrap`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="text-nowrap">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="text-end text-nowrap">
                        <Form.Select
                          size="sm"
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="fw-medium border-primary text-primary shadow-sm"
                          style={{ cursor: 'pointer', backgroundColor: 'transparent' }}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt} value={opt} className="text-dark">{opt}</option>
                          ))}
                        </Form.Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Mobile Cards View */}
              <div className="d-md-none">
                {orders.map((order) => (
                  <div key={order._id} className="p-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="fw-bold mb-0">{order.clientName}</h6>
                      <span className={`badge-custom badge-${order.status === 'Delivered' ? 'success' : 'warning'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-muted small mb-3">
                      <strong>Job:</strong> {order.cardType}<br />
                      <strong>Printing Co:</strong> {order.printingCompany !== 'None' ? order.printingCompany : 'Not Set'}<br />
                      <strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <Form.Select
                      size="sm"
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="fw-medium border-primary text-primary mt-2 shadow-sm"
                      style={{ cursor: 'pointer', backgroundColor: 'transparent' }}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt} className="text-dark">{opt}</option>
                      ))}
                    </Form.Select>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="border-0 rounded-4 shadow-lg">
        <Modal.Header closeButton className="border-0 pb-0 mt-3 mx-2">
          <Modal.Title className="fw-bold">Create New Order</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="px-4 pt-4">
            {error && <Alert variant="danger" className="border-0 bg-danger bg-opacity-10 text-danger">{error}</Alert>}
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Label>Client Name</Form.Label>
                <Form.Control type="text" required value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} className="bg-light" />
              </div>
              <div className="col-md-6">
                <Form.Label>Mobile Number</Form.Label>
                <Form.Control type="text" required value={formData.mobileNumber} onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })} className="bg-light" />
              </div>
              <div className="col-12">
                <Form.Label>Job</Form.Label>
                <Form.Select required value={formData.cardType} onChange={(e) => setFormData({ ...formData, cardType: e.target.value })} className="bg-light">
                  {settings.jobTypes.map(job => (
                    <option key={job} value={job}>{job}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-12">
                <Form.Label>Design Image (Optional)</Form.Label>
                <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" className="bg-white" />
              </div>
              <div className="col-md-6">
                <Form.Label>Total Amount</Form.Label>
                <Form.Control type="number" required value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} className="bg-light" />
              </div>
              <div className="col-md-6">
                <Form.Label>Printing Company</Form.Label>
                <Form.Select value={formData.printingCompany} onChange={(e) => setFormData({ ...formData, printingCompany: e.target.value })} className="bg-light">
                  <option value="None">None</option>
                  {settings.printingCompanies.map(pc => (
                    <option key={pc} value={pc}>{pc}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-md-6 pt-4">
                <Form.Check type="switch" id="advance-switch-emp" label="Advance Amount Received" checked={formData.advanceReceived} onChange={(e) => setFormData({ ...formData, advanceReceived: e.target.checked })} className="fw-medium" />
              </div>
              {formData.advanceReceived && (
                <>
                  <div className="col-md-6">
                    <Form.Label>Advance Amount</Form.Label>
                    <Form.Control type="number" required value={formData.advanceAmount} onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })} className="bg-light" />
                  </div>
                  <div className="col-md-6">
                    <Form.Label>Payment Method</Form.Label>
                    <Form.Select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="bg-light">
                      <option value="None">None</option>
                      <option value="GPay">GPay</option>
                      <option value="B-Gpay">B-Gpay</option>
                    </Form.Select>
                  </div>
                </>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 px-4 pb-4">
            <Button variant="light" onClick={() => setShowModal(false)} className="fw-medium">Cancel</Button>
            <Button variant="primary" type="submit" className="fw-medium px-4">Create Order</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Layout>
  );
};

export default EmployeeDashboard;
