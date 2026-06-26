import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, Table, Button, Modal, Form, Alert, Badge, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Trash2 } from 'lucide-react';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState({ jobTypes: ['Visiting Card', 'Invitation', 'Offset', 'Screen', 'Digital', 'Lamination'], printingCompanies: ['Elite', 'Impression', 'Zig Zag', 'Vignesh', 'Amutham Flex', 'Chandru Screen', 'Amirtham Binding', 'Saravana Offset', 'Others'] });
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    mobileNumber: '',
    cardType: '',
    advanceAmount: 0,
    totalAmount: 0,
    assignedEmployee: '',
    advanceReceived: false,
    paymentMethod: 'GPay',
    printingCompany: 'Elite'
  });

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
      clientName: '', mobileNumber: '', cardType: settings.jobTypes.length > 0 ? settings.jobTypes[0] : 'Visiting Card', advanceAmount: 0, totalAmount: 0,
      assignedEmployee: employees.length > 0 ? employees[0]._id : '', advanceReceived: false, paymentMethod: 'GPay', printingCompany: settings.printingCompanies.length > 0 ? settings.printingCompanies[0] : 'Elite'
    });
    setFile(null);
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await api.delete(`/orders/${id}`);
        fetchData();
      } catch (err) {
        console.error('Error deleting order:', err);
        alert(err.response?.data?.message || 'Error deleting order');
      }
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating status');
    }
  };

  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    try {
      await api.put(`/orders/${orderId}`, { paymentReceived: newPaymentStatus });
      fetchData();
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert('Error updating payment status');
    }
  };

  const handlePaymentMethodChange = async (orderId, newMethod) => {
    try {
      await api.put(`/orders/${orderId}`, { paymentMethod: newMethod });
      fetchData();
    } catch (err) {
      console.error('Error updating payment method:', err);
      alert('Error updating payment method');
    }
  };

  const statusOptions = ['Printing', 'Cutting', 'Ready To Dispatch', 'Delivered'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

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
          {orders.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <h5 className="fw-medium mb-3">No orders found</h5>
              <p>You haven't created any orders yet.</p>
              <Button variant="outline-primary" onClick={handleShow} className="mt-2">
                <Plus size={18} className="me-2" /> Create First Order
              </Button>
            </div>
          ) : (
            <>
              <Table className="table-custom mb-0 align-middle d-none d-md-table">
                <thead>
                  <tr>
                    <th className="text-nowrap">S.No</th>
                    <th>Customer Name</th>
                    <th className="text-nowrap">Number</th>
                    <th>Job</th>
                    <th>Printing Method</th>
                    <th className="text-nowrap">Status</th>
                    <th className="text-nowrap">Payment</th>
                    <th>Update By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr key={order._id}>
                      <td className="text-nowrap">{index + 1}</td>
                      <td>{order.clientName}</td>
                      <td className="text-nowrap">{order.mobileNumber}</td>
                      <td className="text-capitalize">{order.cardType}</td>
                      <td>{order.printingCompany !== 'None' ? order.printingCompany : '-'}</td>
                      <td className="text-nowrap">
                        <span className={`badge-custom badge-${order.status === 'Delivered' ? 'success' : 'primary'} text-nowrap`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="text-nowrap">
                        <Form.Check 
                          type="switch" 
                          id={`pay-switch-${order._id}`} 
                          label={order.advanceReceived ? 'Paid' : 'Pending'} 
                          checked={order.advanceReceived} 
                          onChange={(e) => handlePaymentStatusChange(order._id, e.target.checked)} 
                          className={`fw-medium mb-0 ${order.advanceReceived ? 'text-success' : 'text-danger'}`} 
                        />
                        {order.advanceReceived && (
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
                      <td>{order.assignedEmployee?.name || '-'}</td>
                      <td className="text-end">
                        <div className="d-flex flex-wrap justify-content-end align-items-center gap-2">
                          <Dropdown>
                            <Dropdown.Toggle variant="outline-success" size="sm" className="fw-medium shadow-sm">
                              Update Status
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
                            <Button variant="outline-primary" size="sm" className="fw-medium text-nowrap">View / Edit</Button>
                          </Link>
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
                {orders.map((order) => (
                  <div key={order._id} className="p-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="fw-bold mb-0">{order.clientName}</h6>
                      <span className={`badge-custom badge-${order.status === 'Completed' || order.status === 'Delivered' ? 'success' : 'primary'}`}>
                        {order.status}
                      </span>
                    </div>
                    {order.designImage && (
                      <div className="mb-2">
                        <img 
                          src={order.designImage.startsWith('http') ? order.designImage : `https://saap-management.onrender.com/${order.designImage.replace(/\\/g, '/').replace(/^\//, '')}`} 
                          alt="Design" 
                          style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }} 
                        />
                      </div>
                    )}
                    <div className="text-muted small mb-2">
                      <strong>Assigned To:</strong> {order.assignedEmployee?.name || 'Unassigned'}<br />
                      <strong>Printing Method:</strong> {order.printingCompany !== 'None' ? order.printingCompany : 'Not Set'}<br />
                      <div className="d-flex align-items-center mt-1">
                        <strong className="me-2">Payment:</strong>
                        <Form.Check 
                          type="switch" 
                          id={`pay-switch-mobile-${order._id}`} 
                          label={order.advanceReceived ? 'Paid' : 'Pending'} 
                          checked={order.advanceReceived} 
                          onChange={(e) => handlePaymentStatusChange(order._id, e.target.checked)} 
                          className={`fw-medium mb-0 me-2 ${order.advanceReceived ? 'text-success' : 'text-danger'}`} 
                        />
                        {order.advanceReceived && (
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
                    </div>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      <Dropdown className="flex-grow-1">
                        <Dropdown.Toggle variant="outline-success" size="sm" className="w-100 fw-medium shadow-sm">
                          Update Status
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
                <Form.Select value={formData.printingCompany} onChange={(e) => setFormData({ ...formData, printingCompany: e.target.value })} className="bg-light">
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
                      <option value="GPay">GPay</option>
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
    </Layout>
  );
};

export default ManageOrders;
