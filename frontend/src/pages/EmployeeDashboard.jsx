import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Row, Col, Card, Table, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ShoppingBag, CheckCircle, Clock, Plus } from 'lucide-react';

const EmployeeDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState({ jobTypes: ['Visiting Card', 'Invitation', 'Offset', 'Screen', 'Digital', 'Lamination'], printingCompanies: ['Elite', 'Impression', 'Zig Zag', 'Vignesh', 'Amutham Flex', 'Chandru Screen', 'Amirtham Binding', 'Saravana Offset', 'Others'] });
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({ advanceAmount: '', balanceAmount: '', paymentMethod: 'GPay' });
  const [previewImage, setPreviewImage] = useState(null);

  const [formData, setFormData] = useState({
    clientName: '',
    mobileNumber: '',
    cardType: settings.jobTypes.length > 0 ? settings.jobTypes[0] : '',
    advanceAmount: 0,
    totalAmount: 0,
    advanceReceived: false,
    paymentMethod: 'GPay',
    printingCompany: settings.printingCompanies.length > 0 ? settings.printingCompanies[0] : 'Elite'
  });

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}/${imagePath.replace(/\\/g, '/').replace(/^\//, '')}`;
  };

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
      advanceReceived: false, paymentMethod: 'GPay', printingCompany: settings.printingCompanies.length > 0 ? settings.printingCompanies[0] : 'Elite'
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

  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { paymentReceived: newPaymentStatus });
      fetchData();
    } catch (err) {
      alert('Error updating payment status');
    }
  };

  const handlePaymentMethodChange = async (orderId, newMethod) => {
    try {
      await api.put(`/orders/${orderId}`, { paymentMethod: newMethod });
      fetchData();
    } catch (err) {
      alert('Error updating payment method');
    }
  };

  const handlePaymentToggle = (order, isChecked) => {
    setSelectedOrderForPayment(order);
    setPaymentFormData({ 
      advanceAmount: order.advanceAmount || '', 
      balanceAmount: order.balanceAmount || '', 
      paymentMethod: order.paymentMethod || 'GPay' 
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/orders/${selectedOrderForPayment._id}`, { 
        paymentReceived: true, 
        advanceAmount: Number(paymentFormData.advanceAmount),
        balanceAmount: Number(paymentFormData.balanceAmount),
        paymentMethod: paymentFormData.paymentMethod
      });
      setShowPaymentModal(false);
      fetchData();
    } catch (err) {
      alert('Error saving payment');
    }
  };

  const statusOptions = [
    'Printing', 'Cutting', 'Ready To Dispatch', 'Delivered'
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
                    <th>Image</th>
                    <th>Printing Method</th>
                    <th className="text-nowrap">Payment</th>
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
                        <td>
                          {order.designImage ? (
                            <img 
                              src={getImageUrl(order.designImage)} 
                              alt="Design" 
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                              onClick={() => setPreviewImage(order.designImage)}
                            />
                          ) : '-'}
                        </td>
                        <td>{order.printingCompany !== 'None' ? order.printingCompany : '-'}</td>
                      <td className="text-nowrap">
                        <Form.Check 
                          type="switch" 
                          id={`pay-switch-${order._id}`} 
                          label={(order.totalAmount > 0 && (order.advanceAmount + (order.balanceAmount || 0)) >= order.totalAmount) ? 'Paid' : 'Pending'} 
                          checked={(order.totalAmount > 0 && (order.advanceAmount + (order.balanceAmount || 0)) >= order.totalAmount)} 
                          onChange={(e) => handlePaymentToggle(order, e.target.checked)} 
                          className={`fw-medium mb-0 ${(order.totalAmount > 0 && (order.advanceAmount + (order.balanceAmount || 0)) >= order.totalAmount) ? 'text-success' : 'text-danger'}`} 
                        />
                        {order.advanceReceived && !((order.totalAmount > 0) && (order.advanceAmount + (order.balanceAmount || 0)) >= order.totalAmount) && (
                          <Form.Select 
                            size="sm" 
                            value={order.paymentMethod} 
                            onChange={(e) => handlePaymentMethodChange(order._id, e.target.value)}
                            className="mt-1"
                            style={{ minWidth: '90px' }}
                          >
                            <option value="GPay">GPay</option>
                            <option value="Cash">Cash</option>
                          </Form.Select>
                        )}
                      </td>
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
                    {order.designImage && (
                      <div className="mb-2">
                        <img 
                          src={getImageUrl(order.designImage)} 
                          alt="Design" 
                          style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} 
                          onClick={() => setPreviewImage(order.designImage)}
                        />
                      </div>
                    )}
                    <div className="text-muted small mb-3">
                      <strong>Job:</strong> {order.cardType}<br />
                      <strong>Printing Method:</strong> {order.printingCompany !== 'None' ? order.printingCompany : 'Not Set'}<br />
                      <strong>Total Amount:</strong> ₹{order.totalAmount || 0}<br />
                      <strong>Advance Paid:</strong> {order.advanceAmount > 0 ? `₹${order.advanceAmount} (${order.paymentMethod || 'None'})` : 'No'}<br />
                      {((order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0)) > 0 ? (
                        <><strong className="text-danger">Pending Amount:</strong> ₹{(order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0)}<br /></>
                      ) : (
                        <><strong className="text-success">Amount Paid:</strong> ₹{(order.advanceAmount || 0) + (order.balanceAmount || 0)} {((order.advanceAmount || 0) + (order.balanceAmount || 0)) > 0 ? `(${order.paymentMethod || 'None'})` : ''}<br /></>
                      )}
                      <div className="d-flex align-items-center mt-1 mb-1">
                        <strong className="me-2">Payment:</strong>
                        <Form.Check 
                          type="switch" 
                          id={`pay-switch-mobile-${order._id}`} 
                          label={(order.totalAmount > 0 && (order.advanceAmount + (order.balanceAmount || 0)) >= order.totalAmount) ? 'Paid' : 'Pending'} 
                          checked={(order.totalAmount > 0 && (order.advanceAmount + (order.balanceAmount || 0)) >= order.totalAmount)} 
                          onChange={(e) => handlePaymentToggle(order, e.target.checked)} 
                          className={`fw-medium mb-0 me-2 ${(order.totalAmount > 0 && (order.advanceAmount + (order.balanceAmount || 0)) >= order.totalAmount) ? 'text-success' : 'text-danger'}`} 
                        />
                        {order.advanceReceived && !((order.totalAmount > 0) && (order.advanceAmount + (order.balanceAmount || 0)) >= order.totalAmount) && (
                          <Form.Select 
                            size="sm" 
                            value={order.paymentMethod} 
                            onChange={(e) => handlePaymentMethodChange(order._id, e.target.value)}
                            className="w-auto"
                          >
                            <option value="GPay">GPay</option>
                            <option value="Cash">Cash</option>
                          </Form.Select>
                        )}
                      </div>
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
                <Form.Label>Printing Method</Form.Label>
                <Form.Select value={formData.printingCompany} onChange={(e) => setFormData({ ...formData, printingCompany: e.target.value })} className="bg-light">
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
                      <option value="GPay">GPay</option>
                      <option value="Cash">Cash</option>
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

      {/* Payment Details Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered contentClassName="border-0 rounded-4 shadow-lg">
        <Modal.Header closeButton className="border-0 pb-0 mt-3 mx-2">
          <Modal.Title className="fw-bold">Payment Details</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePaymentSubmit}>
          <Modal.Body className="px-4 pt-4">
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control 
                type="number" 
                value={paymentFormData.balanceAmount} 
                onChange={(e) => setPaymentFormData({ ...paymentFormData, balanceAmount: e.target.value })} 
                className="bg-light"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Advance Amount</Form.Label>
              <Form.Control 
                type="number" 
                value={paymentFormData.advanceAmount} 
                onChange={(e) => setPaymentFormData({ ...paymentFormData, advanceAmount: e.target.value })} 
                className="bg-light"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Method</Form.Label>
              <Form.Select 
                value={paymentFormData.paymentMethod} 
                onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                className="bg-light"
              >
                <option value="GPay">GPay</option>
                <option value="Cash">Cash</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 px-4 pb-4">
            <Button variant="light" onClick={() => setShowPaymentModal(false)} className="fw-medium">Cancel</Button>
            <Button variant="primary" type="submit" className="fw-medium px-4">Save Payment</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Image Preview Modal */}
      <Modal show={!!previewImage} onHide={() => setPreviewImage(null)} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg bg-transparent">
        <Modal.Body className="p-0 text-center position-relative">
          <Button 
            variant="dark" 
            className="position-absolute rounded-circle p-2" 
            style={{ top: '-15px', right: '-15px', zIndex: 1050 }}
            onClick={() => setPreviewImage(null)}
          >
            &times;
          </Button>
          {previewImage && (
            <img 
              src={getImageUrl(previewImage)} 
              alt="Design Preview" 
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', backgroundColor: '#fff' }} 
            />
          )}
        </Modal.Body>
      </Modal>
    </Layout>
  );
};

export default EmployeeDashboard;
