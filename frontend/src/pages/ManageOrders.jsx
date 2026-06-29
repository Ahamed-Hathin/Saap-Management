import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, Table, Button, Modal, Form, Alert, Badge, Dropdown } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Plus, Trash2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState({ jobTypes: ['Visiting Card', 'Invitation', 'Offset', 'Screen', 'Digital', 'Lamination'], printingCompanies: ['Elite', 'Impression', 'Zig Zag', 'Vignesh', 'Amutham Flex', 'Chandru Screen', 'Amirtham Binding', 'Saravana Offset', 'Others'] });
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({ advanceAmount: '', balanceAmount: '', paymentMethod: '' });
  const [previewImage, setPreviewImage] = useState(null);

  const [formData, setFormData] = useState({
    clientName: '',
    mobileNumber: '',
    cardType: '',
    advanceAmount: '',
    totalAmount: '',
    assignedEmployee: '',
    advanceReceived: false,
    paymentMethod: '',
    printingCompany: '',
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
      const ordersRes = await api.get('/orders');
      setOrders(ordersRes.data);
      const empRes = await api.get('/users');
      setEmployees(empRes.data);
      const setRes = await api.get('/settings');
      if (setRes.data) setSettings(setRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShow = () => {
    setFormData({
      clientName: '', mobileNumber: '', cardType: '', advanceAmount: '', totalAmount: '',
      assignedEmployee: '', advanceReceived: false, paymentMethod: '', printingCompany: '', description: ''
    });
    setFile(null);
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this order?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/orders/${id}`);
        fetchData();
        Swal.fire('Deleted!', 'Order has been deleted.', 'success');
      } catch (err) {
        console.error('Error deleting order:', err);
        Swal.fire('Error', err.response?.data?.message || 'Error deleting order', 'error');
      }
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
      Swal.fire('Error', 'Error updating status', 'error');
    }
  };

  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { paymentReceived: newPaymentStatus });
      fetchData();
    } catch (err) {
      console.error('Error updating payment status:', err);
      Swal.fire('Error', 'Error updating payment status', 'error');
    }
  };

  const handlePaymentMethodChange = async (orderId, newMethod) => {
    try {
      await api.put(`/orders/${orderId}`, { paymentMethod: newMethod });
      fetchData();
    } catch (err) {
      console.error('Error updating payment method:', err);
      Swal.fire('Error', 'Error updating payment method', 'error');
    }
  };

  const handlePaymentToggle = (order, isChecked) => {
    setSelectedOrderForPayment(order);
    setPaymentFormData({ 
      advanceAmount: order.advanceAmount || '', 
      balanceAmount: order.balanceAmount || '', 
      paymentMethod: order.paymentMethod || '' 
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
        paymentMethod: paymentFormData.paymentMethod === '' ? 'None' : paymentFormData.paymentMethod
      });
      setShowPaymentModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving payment:', err);
      Swal.fire('Error', 'Error saving payment', 'error');
    }
  };

  const handleDownloadPDF = (order, index) => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text('Order Invoice', 105, 25, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    
    const serialNum = order.serialNumber || (orders.length - index);
    const methodStr = (order.paymentMethod && order.paymentMethod !== 'None') ? ` (${order.paymentMethod})` : '';
    const balance = (order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0);

    let startY = 45;
    const lineHeight = 10;
    
    // Details
    doc.setFont("helvetica", "bold"); doc.text('SI Number:', 20, startY);
    doc.setFont("helvetica", "normal"); doc.text(String(serialNum), 65, startY);
    startY += lineHeight;

    doc.setFont("helvetica", "bold"); doc.text('Client Name:', 20, startY);
    doc.setFont("helvetica", "normal"); doc.text(order.clientName || '-', 65, startY);
    startY += lineHeight;

    doc.setFont("helvetica", "bold"); doc.text('Mobile Number:', 20, startY);
    doc.setFont("helvetica", "normal"); doc.text(order.mobileNumber || '-', 65, startY);
    startY += lineHeight;

    doc.setFont("helvetica", "bold"); doc.text('Job / Card Type:', 20, startY);
    doc.setFont("helvetica", "normal"); doc.text(order.cardType || '-', 65, startY);
    startY += lineHeight;

    doc.setFont("helvetica", "bold"); doc.text('Description:', 20, startY);
    doc.setFont("helvetica", "normal");
    const splitDesc = doc.splitTextToSize(order.description || '-', 120);
    doc.text(splitDesc, 65, startY);
    startY += (splitDesc.length * 6) + 5; 

    // Payment Section
    doc.setLineWidth(0.2);
    doc.line(20, startY, 190, startY);
    startY += 10;
    
    doc.setFont("helvetica", "bold");
    doc.text('Payment Summary', 20, startY);
    startY += 8;

    doc.setFont("helvetica", "normal");
    doc.text(`Total Amount: Rs. ${order.totalAmount || 0}`, 20, startY);
    startY += 8;
    doc.text(`Advance Paid: Rs. ${order.advanceAmount || 0}${methodStr}`, 20, startY);
    startY += 8;
    doc.setFont("helvetica", "bold");
    doc.text(`Balance Amount: Rs. ${balance}`, 20, startY);
    
    doc.save(`Order_${serialNum}_${order.clientName.replace(/\s+/g, '_')}.pdf`);
  };

  const statusOptions = settings?.orderStatuses || ['Printing', 'Cutting', 'Ready To Dispatch', 'Delivered'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        advanceAmount: formData.advanceAmount === '' ? 0 : Number(formData.advanceAmount),
        totalAmount: formData.totalAmount === '' ? 0 : Number(formData.totalAmount),
        paymentMethod: formData.paymentMethod === '' ? 'None' : formData.paymentMethod,
        printingCompany: formData.printingCompany === '' ? 'None' : formData.printingCompany,
      };
      const { data: newOrder } = await api.post('/orders', payload);

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
    } finally {
      setIsLoading(false);
    }
  };

  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  let displayedOrders = orders;
  if (filterParam === 'pending') {
    displayedOrders = orders.filter(o => o.status !== 'Delivered');
  } else if (filterParam === 'ready') {
    displayedOrders = orders.filter(o => o.status === 'Ready To Dispatch');
  } else if (filterParam === 'payment_pending') {
    displayedOrders = orders.filter(o => o.totalAmount > 0 && (o.advanceAmount + (o.balanceAmount || 0)) < o.totalAmount);
  } else if (filterParam === 'delivered') {
    displayedOrders = orders.filter(o => o.status === 'Delivered');
  }

  return (
    <Layout>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="mb-1 fw-bold">Manage Orders</h3>
          <p className="text-muted mb-0 small">Track and manage all card orders</p>
        </div>
        <Button variant="primary" onClick={handleShow} className="d-flex align-items-center mt-2 mt-md-0">
          <Plus size={18} className="me-2" /> Create Order
        </Button>
      </div>

      <Card className="dashboard-card border-0 mb-4">
        <Card.Body className="p-0">
          {displayedOrders.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <h5 className="fw-medium mb-3">No orders found</h5>
              <p>You haven't created any orders yet, or no orders match your filter.</p>
              <Button variant="outline-primary" onClick={handleShow} className="mt-2">
                <Plus size={18} className="me-2" /> Create First Order
              </Button>
            </div>
          ) : (
            <>
              <Table className="table-custom mb-0 align-middle d-none d-md-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Customer Name</th>
                    <th>Number</th>
                    <th>Job</th>
                    <th>Image</th>
                    <th>Description</th>
                    <th>Printing Method</th>
                    <th>Payment</th>
                    <th>Update By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOrders.map((order, index) => (
                    <tr key={order._id}>
                      <td>{order.serialNumber || (orders.length - index)}</td>
                      <td>{order.clientName}</td>
                      <td>{order.mobileNumber}</td>
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
                          </Form.Select>
                        )}
                      </td>
                      <td>{order.assignedEmployee?.name || '-'}</td>
                      <td className="text-end">
                        <div className="d-flex flex-wrap justify-content-end align-items-center gap-2">
                          <Dropdown>
                            <Dropdown.Toggle variant={order.status === 'Delivered' ? 'success' : 'outline-success'} size="sm" className="fw-medium shadow-sm">
                              {order.status || 'Update Status'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              {statusOptions.map(opt => (
                                <Dropdown.Item 
                                  key={opt} 
                                  active={order.status === opt}
                                  onClick={() => handleStatusChange(order._id, opt)}
                                >
                                  {opt}
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Menu>
                          </Dropdown>
                          <Link to={`/orders/${order._id}`}>
                            <Button variant="outline-primary" size="sm" className="fw-medium">View / Edit</Button>
                          </Link>
                          <Button variant="outline-info" size="sm" onClick={() => handleDownloadPDF(order, index)} title="Download PDF">
                            <Download size={16} />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(order._id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
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
                    <div className="text-muted small mb-2">
                      <strong>Mobile:</strong> {order.mobileNumber || '-'}<br />
                      <strong>Job:</strong> <span className="text-capitalize">{order.cardType || '-'}</span><br />
                      {order.description && (
                        <><strong>Description:</strong> <span style={{cursor: 'pointer', color: 'blue', textDecoration: 'underline'}} onClick={() => Swal.fire({ title: 'Description', html: `<div style="text-align: left; font-size: 15px; line-height: 1.5;">${order.description.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</div>` })}>{order.description.length > 30 ? order.description.substring(0, 30) + '...' : order.description}</span><br /></>
                      )}
                      <strong>Assigned To:</strong> {order.assignedEmployee?.name || 'Unassigned'}<br />
                      <strong>Printing Method:</strong> {order.printingCompany !== 'None' ? order.printingCompany : 'Not Set'}<br />
                      <strong>Total Amount:</strong> ₹{order.totalAmount || 0}<br />
                      <strong>Advance Paid:</strong> {order.advanceAmount > 0 ? `₹${order.advanceAmount} (${order.paymentMethod || 'None'})` : 'No'}<br />
                      {((order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0)) > 0 ? (
                        <><strong className="text-danger">Pending Amount:</strong> ₹{(order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0)}<br /></>
                      ) : (
                        <><strong className="text-success">Amount Paid:</strong> ₹{(order.advanceAmount || 0) + (order.balanceAmount || 0)} {((order.advanceAmount || 0) + (order.balanceAmount || 0)) > 0 ? `(${order.paymentMethod || 'None'})` : ''}<br /></>
                      )}
                      <div className="d-flex align-items-center mt-1">
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
                          </Form.Select>
                        )}
                      </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      <Dropdown className="flex-grow-1" drop="up">
                        <Dropdown.Toggle variant={order.status === 'Delivered' ? 'success' : 'outline-success'} size="sm" className="w-100 fw-medium shadow-sm">
                          {order.status || 'Update Status'}
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="w-100">
                          {statusOptions.map(opt => (
                            <Dropdown.Item 
                              key={opt} 
                              active={order.status === opt}
                              onClick={() => handleStatusChange(order._id, opt)}
                            >
                              {opt}
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                      <Link to={`/orders/${order._id}`} className="flex-grow-1">
                        <Button variant="outline-primary" size="sm" className="w-100 fw-medium">View / Edit</Button>
                      </Link>
                      <Button variant="outline-info" size="sm" onClick={() => handleDownloadPDF(order, orders.indexOf(order))} title="Download PDF">
                        <Download size={16} />
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(order._id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
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
              <div className="col-md-6">
                <Form.Label>Client Name</Form.Label>
                <Form.Control type="text" required value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} className="bg-light" />
              </div>
              <div className="col-md-6">
                <Form.Label>Mobile Number</Form.Label>
                <Form.Control type="text" required minLength={10} maxLength={10} pattern="\d{10}" title="Mobile number must be exactly 10 digits" value={formData.mobileNumber} onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="bg-light" />
              </div>
              <div className="col-12">
                <Form.Label>Job</Form.Label>
                <Form.Select required value={formData.cardType} onChange={(e) => setFormData({ ...formData, cardType: e.target.value })} className="bg-light">
                  <option value="">Select Job</option>
                  {settings.jobTypes.map(job => (
                    <option key={job} value={job}>{job}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-12">
                <Form.Label>Description (Optional)</Form.Label>
                <Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-light" />
              </div>
              <div className="col-12">
                <Form.Label>Design Image (Optional)</Form.Label>
                <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" className="bg-white" />
              </div>
              <div className="col-md-6">
                <Form.Label>Total Amount</Form.Label>
                <Form.Control type="number" required value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} className="bg-light" />
              </div>
              <div className="col-md-6 pt-4">
                <Form.Check type="switch" id="advance-switch" label="Advance Amount Received" checked={formData.advanceReceived} onChange={(e) => setFormData({ ...formData, advanceReceived: e.target.checked })} className="fw-medium" />
              </div>
              <div className="col-md-6">
                <Form.Label>Assign Employee</Form.Label>
                <Form.Select required value={formData.assignedEmployee} onChange={(e) => setFormData({ ...formData, assignedEmployee: e.target.value })} className="bg-light">
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-md-6">
                <Form.Label>Printing Method</Form.Label>
                <Form.Select required value={formData.printingCompany} onChange={(e) => setFormData({ ...formData, printingCompany: e.target.value })} className="bg-light">
                  <option value="">Select Printing Method</option>
                  {settings.printingCompanies.map(pc => (
                    <option key={pc} value={pc}>{pc}</option>
                  ))}
                </Form.Select>
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
                      <option value="">Select Payment Method</option>
                      <option value="GPay">GPay</option>
                      <option value="B-Gpay">B-Gpay</option>
                      <option value="KVB">KVB</option>
                      <option value="Dtdc Wallet">Dtdc Wallet</option>
                      <option value="Cash">Cash</option>
                    </Form.Select>
                  </div>
                </>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 px-4 pb-4">
            <Button variant="light" onClick={() => setShowModal(false)} className="fw-medium" disabled={isLoading}>Cancel</Button>
            <Button variant="primary" type="submit" className="fw-medium px-4" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Order'}
            </Button>
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
                <option value="">Select Payment Method</option>
                <option value="GPay">GPay</option>
                <option value="B-Gpay">B-Gpay</option>
                <option value="KVB">KVB</option>
                <option value="Dtdc Wallet">Dtdc Wallet</option>
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

export default ManageOrders;
