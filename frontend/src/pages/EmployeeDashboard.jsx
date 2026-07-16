import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Row, Col, Card, Table, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { Link, useLocation, useParams } from 'react-router-dom';
import api from '../services/api';
import { ShoppingBag, CheckCircle, Clock, Plus, Search } from 'lucide-react';
import Swal from 'sweetalert2';

const EmployeeDashboard = () => {
  const location = useLocation();
  const { id } = useParams();
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState({ jobTypes: ['Visiting Card', 'Invitation', 'Offset', 'Screen', 'Digital', 'Lamination'], printingCompanies: ['Elite', 'Impression', 'Zig Zag', 'Vignesh', 'Amutham Flex', 'Chandru Screen', 'Amirtham Binding', 'Saravana Offset', 'Others'] });
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({ advanceAmount: '', balanceAmount: '', paymentMethod: 'GPay' });
  const [previewImage, setPreviewImage] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    mobileNumber: '',
    cardType: settings.jobTypes.length > 0 ? settings.jobTypes[0] : '',
    advanceAmount: 0,
    totalAmount: 0,
    advanceReceived: false,
    paymentMethod: 'GPay',
    printingCompany: settings.printingCompanies.length > 0 ? settings.printingCompanies[0] : 'Elite',
    description: ''
  });

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}/${imagePath.replace(/\\/g, '/').replace(/^\//, '')}`;
  };

  const fetchData = async () => {
    try {
      let endpoint = '/orders';
      if (id) {
        endpoint = `/orders?employeeId=${id}`;
      }
      const ordersRes = await api.get(endpoint);
      setOrders(ordersRes.data);
      const setRes = await api.get('/settings');
      if (setRes.data) setSettings(setRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, location.pathname]);

  const handleShow = () => {
    setFormData({
      clientName: '', mobileNumber: '', cardType: settings.jobTypes.length > 0 ? settings.jobTypes[0] : 'Visiting Card', advanceAmount: 0, totalAmount: 0,
      advanceReceived: false, paymentMethod: 'GPay', printingCompany: settings.printingCompanies.length > 0 ? settings.printingCompanies[0] : 'Elite', description: ''
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
      Swal.fire('Error', 'Error updating status', 'error');
    }
  };

  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { paymentReceived: newPaymentStatus });
      fetchData();
    } catch (err) {
      Swal.fire('Error', 'Error updating payment status', 'error');
    }
  };

  const handlePaymentMethodChange = async (orderId, newMethod) => {
    try {
      await api.put(`/orders/${orderId}`, { paymentMethod: newMethod });
      fetchData();
    } catch (err) {
      Swal.fire('Error', 'Error updating payment method', 'error');
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
      Swal.fire('Error', 'Error saving payment', 'error');
    }
  };

  const statusOptions = settings?.orderStatuses || ['Printing', 'Cutting', 'Ready To Dispatch', 'Delivered'];

  let displayedOrders = orders.filter(order => {
    if (order.status !== 'Delivered') return true;
    const pendingAmount = (order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0);
    const isFullyPaid = pendingAmount <= 0;
    
    if (isFullyPaid) {
      const today = new Date();
      const updatedDate = new Date(order.updatedAt);
      const isToday = updatedDate.getDate() === today.getDate() && 
                      updatedDate.getMonth() === today.getMonth() && 
                      updatedDate.getFullYear() === today.getFullYear();
      return isToday;
    }
    
    return true;
  });

  if (filter === 'ready') {
    displayedOrders = displayedOrders.filter(o => o.status === 'Ready To Dispatch');
  } else if (filter === 'payment_pending') {
    displayedOrders = displayedOrders.filter(o => o.totalAmount > 0 && (o.advanceAmount + (o.balanceAmount || 0)) < o.totalAmount);
  }

  if (searchTerm) {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    displayedOrders = displayedOrders.filter(order => 
      (order.clientName && order.clientName.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (order.mobileNumber && order.mobileNumber.includes(lowerCaseSearchTerm))
    );
  }

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
        <div>
          <h2 className="mb-1 fw-bold">
            {id ? (location.state?.employeeName ? `${location.state.employeeName} Orders` : 'Employee Orders') : 'My Orders'}
          </h2>
          <p className="text-muted mb-0">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="d-flex gap-3 align-items-center flex-wrap">
          <div className="position-relative">
            <Search size={18} className="position-absolute text-muted" style={{ top: '50%', left: '12px', transform: 'translateY(-50%)' }} />
            <Form.Control
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-sm ps-5"
            />
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Button 
              variant={filter === 'all' ? 'primary' : 'outline-primary'} 
              onClick={() => setFilter('all')}
              className="fw-medium shadow-sm"
            >
              All Orders
            </Button>
            <Button 
              variant={filter === 'ready' ? 'primary' : 'outline-primary'} 
              onClick={() => setFilter('ready')}
              className="fw-medium shadow-sm"
            >
              Ready To Dispatch
            </Button>
            <Button 
              variant={filter === 'payment_pending' ? 'primary' : 'outline-primary'} 
              onClick={() => setFilter('payment_pending')}
              className="fw-medium shadow-sm"
            >
              Pending Payment
            </Button>
          </div>
          <Button variant="primary" onClick={handleShow} className="d-flex align-items-center text-nowrap">
            <Plus size={18} className="me-2" /> Create Order
          </Button>
        </div>
      </div>

      <Card className="dashboard-card border-0 mb-4">
        <Card.Body className="p-0">
          {displayedOrders.length === 0 ? (
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
                    <th>Description</th>
                    <th>Printing Method</th>
                    <th>Payment</th>
                    <th>Date</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOrders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <div className="fw-medium">{order.clientName}</div>
                        {order.mobileNumber && <div className="text-muted small">{order.mobileNumber}</div>}
                      </td>
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
                        <td 
                          style={{ cursor: order.description ? 'pointer' : 'default', maxWidth: '120px' }} 
                          className="text-truncate"
                          onClick={() => {
                            if (order.description) {
                              Swal.fire({ title: 'Description', html: `<div style="text-align: left; font-size: 15px; line-height: 1.5;">${order.description.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</div>` });
                            }
                          }}
                          title={order.description ? "Click to view full description" : ""}
                        >
                          {order.description || '-'}
                        </td>
                        <td>{order.printingCompany !== 'None' ? order.printingCompany : '-'}</td>
                      <td>
                        <div className="small fw-bold mb-1">
                          {((order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0)) > 0 ? (
                            <span className="text-danger">₹{((order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0))} Pending</span>
                          ) : (
                            <span className="text-success">Fully Paid</span>
                          )}
                        </div>
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
<option value="B-Gpay">B-Gpay</option>
<option value="KVB">KVB</option>
<option value="Dtdc Wallet">Dtdc Wallet</option>
<option value="Cash">Cash</option>
<option value="Discount Amount">Discount Amount</option>
                          </Form.Select>
                        )}
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="text-end">
                        <Form.Select
                          size="sm"
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="fw-medium border-primary text-primary shadow-sm"
                          style={{ cursor: 'pointer', backgroundColor: 'transparent', minWidth: '165px' }}
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
                {displayedOrders.map((order) => (
                  <div key={order._id} className="p-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="fw-bold mb-0">{order.clientName}</h6>
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
                      <strong>Mobile:</strong> {order.mobileNumber || '-'}<br />
                      <strong>Job:</strong> <span className="text-capitalize">{order.cardType || '-'}</span><br />
                      {order.description && (
                        <><strong>Description:</strong> <span style={{cursor: 'pointer', color: 'blue', textDecoration: 'underline'}} onClick={() => Swal.fire({ title: 'Description', html: `<div style="text-align: left; font-size: 15px; line-height: 1.5;">${order.description.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</div>` })}>{order.description.length > 30 ? order.description.substring(0, 30) + '...' : order.description}</span><br /></>
                      )}
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
<option value="B-Gpay">B-Gpay</option>
<option value="KVB">KVB</option>
<option value="Dtdc Wallet">Dtdc Wallet</option>
<option value="Cash">Cash</option>
<option value="Discount Amount">Discount Amount</option>
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

      <Modal backdrop="static" show={showModal} onHide={() => setShowModal(false)} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg">
        <Modal.Header closeButton className="border-0 pb-0 mt-3 mx-2">
          <Modal.Title className="fw-bold">Create New Order</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="px-4 pt-4">
            {error && <Alert variant="danger" className="border-0 bg-danger bg-opacity-10 text-danger">{error}</Alert>}
            <div className="row g-3">
              <div className="col-md-6 position-relative">
                <Form.Label>Client Name</Form.Label>
                <div className="d-flex align-items-center mb-1">
                  <Form.Control 
                    type="text" 
                    required 
                    value={formData.clientName} 
                    onChange={async (e) => { 
                      const val = e.target.value;
                      setFormData({ ...formData, clientName: val ? val.replace(/(^\w|\s\w)/g, m => m.toUpperCase()) : '' });
                      if (val.trim().length > 0) {
                        try {
                          const res = await api.get(`/clients/search?q=${val}`);
                          setClientSuggestions(res.data);
                          setShowSuggestions(res.data.length > 0);
                        } catch (err) { console.error(err); }
                      } else {
                        setShowSuggestions(false);
                      }
                    }} 
                    onFocus={() => { if(clientSuggestions.length > 0) setShowSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="bg-light" 
                  />
                </div>
                {showSuggestions && (
                  <ul className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 1000 }}>
                    {clientSuggestions.map(client => (
                      <li 
                        key={client._id} 
                        className="list-group-item list-group-item-action cursor-pointer py-2"
                        style={{ cursor: 'pointer' }}
                        onMouseDown={() => {
                          setFormData({ ...formData, clientName: client.clientName, mobileNumber: client.mobileNumber });
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="fw-bold">{client.username}</div>
                        <small className="text-muted">{client.clientName} - {client.mobileNumber}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="col-md-6">
                <Form.Label>Mobile Number</Form.Label>
                <Form.Control type="text" required minLength={11} maxLength={11} pattern="\d{5} \d{5}" title="Mobile number must be exactly 10 digits with a space after the first 5" value={formData.mobileNumber} onChange={(e) => { const rawValue = e.target.value.replace(/\D/g, '').slice(0, 10); const formattedValue = rawValue.length > 5 ? `${rawValue.slice(0, 5)} ${rawValue.slice(5)}` : rawValue; setFormData({ ...formData, mobileNumber: formattedValue }); }} className="bg-light" />
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
                <Form.Label>Description (Optional)</Form.Label>
                <Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value ? e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase()) : '' })} className="bg-light" />
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
                      <option value="B-Gpay">B-Gpay</option>
                      <option value="KVB">KVB</option>
                      <option value="Dtdc Wallet">Dtdc Wallet</option>
                      <option value="Cash">Cash</option>
<option value="Discount Amount">Discount Amount</option>
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
      <Modal backdrop="static" show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered contentClassName="border-0 rounded-4 shadow-lg">
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
                <option value="B-Gpay">B-Gpay</option>
                <option value="KVB">KVB</option>
                <option value="Dtdc Wallet">Dtdc Wallet</option>
                <option value="Cash">Cash</option>
<option value="Discount Amount">Discount Amount</option>
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

export default EmployeeDashboard;
