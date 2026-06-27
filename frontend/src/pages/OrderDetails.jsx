import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import { Card, Row, Col, Badge, Form, Button, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [settings, setSettings] = useState({ printingCompanies: ['Elite', 'Impression', 'Zig Zag', 'Vignesh', 'Amutham Flex', 'Chandru Screen', 'Amirtham Binding', 'Saravana Offset', 'Others'] });
  const [advanceReceived, setAdvanceReceived] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [printingCompany, setPrintingCompany] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const statusOptions = [
    'Printing', 'Cutting', 'Ready To Dispatch', 'Delivered'
  ];

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}/${imagePath.replace(/\\/g, '/').replace(/^\//, '')}`;
  };

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
      setStatus(data.status);
      setAdvanceReceived(data.advanceReceived);
      setPaymentMethod(data.paymentMethod && data.paymentMethod !== 'None' ? data.paymentMethod : 'GPay');
      setPrintingCompany(data.printingCompany && data.printingCompany !== 'None' ? data.printingCompany : (settings.printingCompanies.length > 0 ? settings.printingCompanies[0] : 'Elite'));
      const setRes = await api.get('/settings');
      if (setRes.data) setSettings(setRes.data);
    } catch (err) {
      console.error(err);
      navigate('/');
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id, navigate]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        status, 
        paymentReceived: advanceReceived, 
        paymentMethod, 
        printingCompany 
      };
      await api.put(`/orders/${id}`, payload);
      setMessage('Order updated successfully!');
      fetchOrder();
    } catch (err) {
      setMessage('Error updating order.');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      await api.post(`/orders/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Design image uploaded successfully!');
      fetchOrder();
    } catch (err) {
      setMessage('Error uploading image.');
    }
  };

  if (!order) return <Layout>Loading...</Layout>;

  return (
    <Layout>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <h3 className="mb-0 fw-bold">Order Details #{order._id.substring(0, 8)}</h3>
        <span className={`badge-custom badge-${order.status === 'Delivered' ? 'success' : 'primary'} fs-6 py-2 px-3`}>
          {order.status}
        </span>
      </div>
      {message && <Alert variant="info" className="border-0 bg-info bg-opacity-10 text-primary">{message}</Alert>}

      <Row className="g-4">
        <Col md={8}>
          <Card className="dashboard-card border-0 mb-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4">Client Information</h5>
              <Row className="mb-3">
                <Col sm={4} className="text-muted">Client Name</Col>
                <Col sm={8}>{order.clientName}</Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted">Mobile Number</Col>
                <Col sm={8}>{order.mobileNumber}</Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted">Job</Col>
                <Col sm={8}>{order.cardType}</Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted">Printing Method</Col>
                <Col sm={8}>{order.printingCompany !== 'None' ? order.printingCompany : 'Not Set'}</Col>
              </Row>

              <h5 className="mt-5 fw-bold mb-4">Payment Information</h5>
              <Row className="mb-3">
                <Col sm={4} className="text-muted fw-medium">Total Amount</Col>
                <Col sm={8} className="fw-bold">₹{order.totalAmount}</Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted fw-medium">Advance Amount</Col>
                <Col sm={8}>₹{order.advanceAmount} {order.advanceAmount > 0 ? `(${order.paymentMethod || 'None'})` : ''}</Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted fw-medium">Balance Paid</Col>
                <Col sm={8}>₹{order.balanceAmount || 0} {(order.balanceAmount > 0) ? `(${order.paymentMethod || 'None'})` : ''}</Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted fw-medium">
                  {((order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0)) > 0 ? 'Pending Amount' : 'Amount Paid'}
                </Col>
                <Col sm={8} className={((order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0)) > 0 ? "text-danger fw-medium" : "text-success fw-medium"}>
                  ₹{((order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0)) > 0 
                    ? ((order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0)) 
                    : ((order.advanceAmount || 0) + (order.balanceAmount || 0))} 
                  {((order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0)) <= 0 && ((order.advanceAmount || 0) + (order.balanceAmount || 0)) > 0 ? `(${order.paymentMethod || 'None'})` : ''}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted fw-medium">Payment Status</Col>
                <Col sm={8}>
                  <span className={`badge-custom badge-${(order.totalAmount > 0 && (order.advanceAmount + (order.balanceAmount || 0)) >= order.totalAmount) ? 'success' : 'danger'} me-2`}>
                    {(order.totalAmount > 0 && (order.advanceAmount + (order.balanceAmount || 0)) >= order.totalAmount) ? 'Paid' : 'Pending'}
                  </span>
                  {order.advanceReceived && <span className="text-muted">({order.paymentMethod})</span>}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="dashboard-card border-0 mb-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4">Design Image</h5>
              {order.designImage ? (
                <div>
                  <img 
                    src={getImageUrl(order.designImage)} 
                    alt="Design" 
                    className="img-fluid rounded" 
                    style={{ maxHeight: '400px', cursor: 'pointer' }} 
                    onClick={() => setPreviewImage(order.designImage)}
                  />
                </div>
              ) : (
                <p className="text-muted">No design uploaded yet.</p>
              )}

              <Form onSubmit={handleFileUpload} className="mt-4 bg-light p-4 rounded-3 border">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Upload New Design</Form.Label>
                  <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" className="bg-white" />
                </Form.Group>
                <Button type="submit" variant="primary" disabled={!file} className="fw-medium">Upload Image</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="dashboard-card border-0">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4">Update Order</h5>
              <Form onSubmit={handleStatusUpdate}>
                <Form.Group className="mb-4">
                  <Form.Label>Order Status</Form.Label>
                  <Form.Select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-light">
                    {statusOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                    <Form.Check type="switch" id="advance-switch" label="Advance Amount Received" checked={advanceReceived} onChange={(e) => setAdvanceReceived(e.target.checked)} className="mb-3 fw-medium" />
                    {advanceReceived && (
                      <Form.Group className="mb-4">
                        <Form.Label>Payment Method</Form.Label>
                        <Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="bg-light">
                        <option value="GPay">GPay</option>
                          <option value="Cash">Cash</option>
                        </Form.Select>
                      </Form.Group>
                    )}
                    <Form.Group className="mb-4">
                      <Form.Label>Printing Method</Form.Label>
                        <Form.Select value={printingCompany} onChange={(e) => setPrintingCompany(e.target.value)} className="bg-light">
                          {settings.printingCompanies.map(pc => (
                          <option key={pc} value={pc}>{pc}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                <Button type="submit" variant="primary" className="w-100 fw-bold py-2">Update Order</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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

export default OrderDetails;
