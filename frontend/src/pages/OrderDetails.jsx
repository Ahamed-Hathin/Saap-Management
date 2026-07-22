import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import { Card, Row, Col, Badge, Form, Button, Alert, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [settings, setSettings] = useState({ jobTypes: ['Visiting Card', 'Invitation', 'Offset', 'Screen', 'Digital', 'Lamination'], printingCompanies: ['Elite', 'Impression', 'Zig Zag', 'Vignesh', 'Amutham Flex', 'Chandru Screen', 'Amirtham Binding', 'Saravana Offset', 'Others'] });
  const [advanceReceived, setAdvanceReceived] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [printingCompany, setPrintingCompany] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    clientName: '',
    mobileNumber: '',
    cardType: '',
    description: '',
    totalAmount: 0,
    advanceAmount: 0,
    balanceAmount: 0
  });

  const statusOptions = settings?.orderStatuses || ['Printing', 'Cutting', 'Ready To Dispatch', 'Delivered'];

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
      setEditForm({
        clientName: data.clientName || '',
        mobileNumber: data.mobileNumber || '',
        cardType: data.cardType || (settings.jobTypes?.length > 0 ? settings.jobTypes[0] : 'Visiting Card'),
        description: data.description || '',
        totalAmount: data.totalAmount || 0,
        advanceAmount: data.advanceAmount || 0,
        balanceAmount: data.balanceAmount || 0
      });
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

  const handleSaveInlineEdits = async () => {
    try {
      const payload = {
        clientName: editForm.clientName,
        mobileNumber: editForm.mobileNumber,
        cardType: editForm.cardType,
        description: editForm.description,
        totalAmount: editForm.totalAmount ? Number(editForm.totalAmount) : 0,
        advanceAmount: editForm.advanceAmount ? Number(editForm.advanceAmount) : 0,
        balanceAmount: editForm.balanceAmount ? Number(editForm.balanceAmount) : 0,
        status,
        paymentReceived: advanceReceived,
        paymentMethod,
        printingCompany
      };
      await api.put(`/orders/${id}`, payload);
      setMessage('Order updated successfully!');
      setIsEditing(false);
      fetchOrder();
    } catch (err) {
      setMessage('Error updating order.');
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        status, 
        paymentReceived: advanceReceived, 
        paymentMethod, 
        printingCompany 
      };
      
      if (isEditing) {
        payload.clientName = editForm.clientName;
        payload.mobileNumber = editForm.mobileNumber;
        payload.cardType = editForm.cardType;
        payload.description = editForm.description;
        payload.totalAmount = editForm.totalAmount ? Number(editForm.totalAmount) : 0;
        payload.advanceAmount = editForm.advanceAmount ? Number(editForm.advanceAmount) : 0;
        payload.balanceAmount = editForm.balanceAmount ? Number(editForm.balanceAmount) : 0;
      }
      
      await api.put(`/orders/${id}`, payload);
      setMessage('Order updated successfully!');
      if (isEditing) setIsEditing(false);
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
      <Button variant="link" onClick={() => navigate(-1)} className="text-decoration-none text-dark fw-bold mb-4 d-inline-flex align-items-center p-0">
        <ArrowLeft size={20} className="me-2" /> Back
      </Button>
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
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">Client Information</h5>
                <Button variant={isEditing ? "outline-secondary" : "outline-primary"} size="sm" onClick={() => {
                  if (isEditing) {
                    setIsEditing(false);
                    setEditForm({
                      clientName: order.clientName || '',
                      mobileNumber: order.mobileNumber || '',
                      cardType: order.cardType || '',
                      description: order.description || '',
                      totalAmount: order.totalAmount || 0,
                      advanceAmount: order.advanceAmount || 0,
                      balanceAmount: order.balanceAmount || 0
                    });
                  } else {
                    setIsEditing(true);
                  }
                }}>
                  {isEditing ? 'Cancel Edit' : 'Edit Information'}
                </Button>
              </div>
              <Row className="mb-3">
                <Col sm={4} className="text-muted">Client Name</Col>
                <Col sm={8}>
                  {isEditing ? <Form.Control value={editForm.clientName} onChange={(e) => setEditForm({...editForm, clientName: e.target.value ? e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase()) : ''})} /> : order.clientName}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted">Mobile Number</Col>
                <Col sm={8}>
                  {isEditing ? (
                    <Form.Control 
                      minLength={11}
                      maxLength={11}
                      pattern="\d{5} \d{5}"
                      title="Mobile number must be exactly 10 digits with a space after the first 5"
                      value={editForm.mobileNumber} 
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                        const formattedValue = rawValue.length > 5 ? `${rawValue.slice(0, 5)} ${rawValue.slice(5)}` : rawValue;
                        setEditForm({...editForm, mobileNumber: formattedValue});
                      }} 
                    />
                  ) : order.mobileNumber}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted">Job</Col>
                <Col sm={8}>
                  {isEditing ? (
                    <Form.Select value={editForm.cardType} onChange={(e) => setEditForm({...editForm, cardType: e.target.value})}>
                      {settings.jobTypes?.map(job => <option key={job} value={job}>{job}</option>)}
                    </Form.Select>
                  ) : order.cardType}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted">Printing Method</Col>
                <Col sm={8}>{order.printingCompany !== 'None' ? order.printingCompany : 'Not Set'}</Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted">Description</Col>
                <Col sm={8} style={{ whiteSpace: 'pre-line' }}>
                  {isEditing ? <Form.Control as="textarea" rows={3} value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value ? e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase()) : ''})} /> : (order.description || '-')}
                </Col>
              </Row>

              <h5 className="mt-5 fw-bold mb-4">Payment Information</h5>
              <Row className="mb-3">
                <Col sm={4} className="text-muted fw-medium">Total Amount</Col>
                <Col sm={8} className={isEditing ? "" : "fw-bold"}>
                  {isEditing ? <Form.Control type="number" value={editForm.totalAmount} onChange={(e) => setEditForm({...editForm, totalAmount: e.target.value})} /> : `₹${order.totalAmount}`}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted fw-medium">Advance Amount</Col>
                <Col sm={8}>
                  {isEditing ? <Form.Control type="number" value={editForm.advanceAmount} onChange={(e) => setEditForm({...editForm, advanceAmount: e.target.value})} /> : `₹${order.advanceAmount} ${order.advanceAmount > 0 ? `(${order.paymentMethod || 'None'})` : ''}`}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted fw-medium">Balance Paid</Col>
                <Col sm={8}>
                  {isEditing ? <Form.Control type="number" value={editForm.balanceAmount} onChange={(e) => setEditForm({...editForm, balanceAmount: e.target.value})} /> : (
                    <>
                      <div>₹{order.balanceAmount || 0}</div>
                      {order.balancePayments && order.balancePayments.length > 0 && (
                        <div className="small text-muted mt-1">
                          {order.balancePayments.map((bp, i) => (
                            <div key={i}>{new Date(bp.date).toLocaleDateString()} - ₹{bp.amount} ({bp.method})</div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted fw-medium">
                  {((order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0)) > 0 ? 'Pending Amount' : 'Amount Paid'}
                </Col>
                <Col sm={8} className={((order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0)) > 0 ? "text-danger fw-medium" : "text-success fw-medium"}>
                  ₹{((order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0)) > 0 
                    ? ((order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0)) 
                    : ((order.advanceAmount || 0) + (order.balanceAmount || 0))} 
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted fw-medium">Payment Status</Col>
                <Col sm={8}>
                  <span className={`badge-custom badge-${(order.totalAmount > 0 && (order.advanceAmount + (order.balanceAmount || 0)) >= order.totalAmount) ? 'success' : 'danger'} me-2`}>
                    {(order.totalAmount > 0 && (order.advanceAmount + (order.balanceAmount || 0)) >= order.totalAmount) ? 'Paid' : 'Pending'}
                  </span>
                </Col>
              </Row>
              
              {isEditing && (
                <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                  <Button variant="primary" className="fw-medium px-4" onClick={handleSaveInlineEdits}>Save Information</Button>
                </div>
              )}
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
                        <option value="B-Gpay">B-Gpay</option>
                        <option value="KVB">KVB</option>
                        <option value="Dtdc Wallet">Dtdc Wallet</option>
                        <option value="Cash">Cash</option>
<option value="Discount Amount">Discount Amount</option>
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
      <Modal backdrop="static" show={!!previewImage} onHide={() => setPreviewImage(null)} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg bg-transparent">
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
