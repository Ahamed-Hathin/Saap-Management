import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, Table, Button, Modal, Form, Alert, Badge, Dropdown } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Plus, Trash2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
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
  const [balancePayments, setBalancePayments] = useState([{ amount: '', method: '' }]);
  const [previewImage, setPreviewImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      paymentMethod: order.paymentMethod || ''
    });
    setBalancePayments([{ amount: '', method: '' }]);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const validPayments = balancePayments.filter(p => p.amount && p.method);
      const payload = {
        paymentReceived: true,
        advanceAmount: Number(paymentFormData.advanceAmount),
        paymentMethod: paymentFormData.paymentMethod || 'None'
      };
      if (validPayments.length > 0) {
        payload.newBalancePayments = validPayments;
      }

      await api.put(`/orders/${selectedOrderForPayment._id}`, payload);
      setShowPaymentModal(false);
      fetchData();
    } catch (err) {
      console.error('Error saving payment:', err);
      Swal.fire('Error', 'Error saving payment', 'error');
    }
  };

  const handleDownloadPDF = async (order, index) => {
    const doc = new jsPDF();
    const serialNum = order.serialNumber || (orders.length - index);

    // --- Header ---
    // Brand Name
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text('SAPP Creation', 20, 26);

    // Yellow Bar & INVOICE Text
    doc.setFillColor(253, 192, 47); // Yellowish color
    doc.rect(20, 40, 95, 10, 'F'); // Left bar
    
    doc.setFontSize(28);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 120, 48);
    
    doc.setFillColor(253, 192, 47);
    doc.rect(172, 40, 18, 10, 'F'); // Right bar

    // --- Information Section ---
    // Left side: Invoice to
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text('Invoice to:', 20, 65);
    
    doc.setFontSize(11);
    doc.text(order.clientName || 'Client Name', 20, 72);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text('Mobile:', 20, 78);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(order.mobileNumber || '-', 32, 78);

    let leftY = 84;
    if (order.description) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text('Description:', 20, leftY);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const splitDesc = doc.splitTextToSize(order.description, 80);
      doc.text(splitDesc, 20, leftY + 5);
      leftY += 5 + (splitDesc.length * 4.5);
    }

    // Right side: Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text('Date', 120, 65);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    doc.text(dateStr, 135, 65);

    // --- Table ---
    const itemDesc = order.cardType || '-';
    
    autoTable(doc, {
      startY: Math.max(95, leftY + 10),
      head: [['SL.', 'Item Description', 'Price', 'Qty.', 'Total']],
      body: [
        ['1', itemDesc, `Rs. ${order.totalAmount || 0}`, '1', `Rs. ${order.totalAmount || 0}`]
      ],
      theme: 'plain',
      headStyles: {
        fillColor: [50, 54, 63],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        fontSize: 9,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { halign: 'left' },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 30 }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // --- Footer Section ---

    // Payment Summary instead of Payment Info
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text('Payment Summary:', 20, finalY + 12);
    
    const advanceAmount = order.advanceAmount || 0;
    const balancePaid = order.balanceAmount || 0;
    const methodStr = (order.paymentMethod && order.paymentMethod !== 'None') ? ` (${order.paymentMethod})` : '';
    const pendingBalance = Math.max(0, (order.totalAmount || 0) - advanceAmount - balancePaid);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    doc.text('Total Amount:', 20, finalY + 18);
    doc.text(`Rs. ${order.totalAmount || 0}`, 50, finalY + 18);
    
    doc.text('Advance Paid:', 20, finalY + 23);
    doc.text(`Rs. ${advanceAmount}${methodStr}`, 50, finalY + 23);
    
    doc.text('Balance Amount:', 20, finalY + 28);
    doc.text(`Rs. ${pendingBalance}`, 50, finalY + 28);

    // Thank you for your business
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text('Thank you for your business', 20, finalY + 40);

    // Footer completely removed as requested

    // Generate PDF array buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    
    // Convert to image
    try {
      const loadingTask = pdfjsLib.getDocument({ data: pdfArrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      
      // Use scale for high-resolution image
      const scale = 3; 
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;
      
      const imgData = canvas.toDataURL('image/png');
      
      // Trigger download
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Invoice_${serialNum}_${(order.clientName || 'Client').replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error converting PDF to image:', err);
      Swal.fire('Error', 'Failed to generate image invoice', 'error');
    }
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
  const dateFilterParam = searchParams.get('dateFilter');
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  let displayedOrders = orders;

  if (dateFilterParam && dateFilterParam !== 'all') {
    const now = new Date();
    let start, end;
    if (dateFilterParam === 'today') {
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(new Date().setHours(23, 59, 59, 999));
    } else if (dateFilterParam === 'weekly') {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (dateFilterParam === 'monthly') {
      start = new Date(now);
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (dateFilterParam === 'custom' && startDateParam && endDateParam) {
      start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
    }

    if (start) {
      displayedOrders = displayedOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        if (end) {
          return orderDate >= start && orderDate <= end;
        }
        return orderDate >= start;
      });
    }
  }

  if (filterParam === 'pending') {
    displayedOrders = displayedOrders.filter(o => o.status !== 'Delivered');
  } else if (filterParam === 'ready') {
    displayedOrders = displayedOrders.filter(o => o.status === 'Ready To Dispatch');
  } else if (filterParam === 'payment_pending') {
    displayedOrders = displayedOrders.filter(o => o.totalAmount > 0 && (o.advanceAmount + (o.balanceAmount || 0)) < o.totalAmount);
  } else if (filterParam === 'delivered') {
    displayedOrders = displayedOrders.filter(o => o.status === 'Delivered');
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayedOrders = displayedOrders.filter(o =>
      (o.clientName && o.clientName.toLowerCase().includes(q)) ||
      (o.mobileNumber && o.mobileNumber.includes(q)) ||
      (o.serialNumber && String(o.serialNumber).includes(q)) ||
      (o.cardType && o.cardType.toLowerCase().includes(q))
    );
  }

  return (
    <Layout>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="mb-1 fw-bold">Manage Orders</h3>
          <p className="text-muted mb-0 small">Track and manage all card orders</p>
        </div>
        <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2">
          <Form.Control
            type="search"
            placeholder="Search Orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="shadow-sm border-light bg-white"
            style={{ minWidth: '250px' }}
          />
          <Button variant="primary" onClick={handleShow} className="d-flex align-items-center justify-content-center text-nowrap shadow-sm">
            <Plus size={18} className="me-2" /> Create Order
          </Button>
        </div>
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
                      <td>{displayedOrders.length - index}</td>
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
                            <span className="text-danger">₹{((order.totalAmount || 0) - (order.advanceAmount || 0) - (order.balanceAmount || 0))}</span>
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

                      </td>
                      <td>
                        {order.assignedEmployee?.name || '-'}
                        {order.createdAt && (
                          <div className="small text-muted mt-1">
                            {new Date(order.createdAt).toLocaleDateString('en-GB')}
                          </div>
                        )}
                      </td>
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
                          <Button variant="outline-info" size="sm" onClick={() => handleDownloadPDF(order, index)} title="Download Image">
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
                        <><strong>Description:</strong> <span style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }} onClick={() => Swal.fire({ title: 'Description', html: `<div style="text-align: left; font-size: 15px; line-height: 1.5;">${order.description.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</div>` })}>{order.description.length > 30 ? order.description.substring(0, 30) + '...' : order.description}</span><br /></>
                      )}
                      <strong>Assigned To:</strong> {order.assignedEmployee?.name || 'Unassigned'}
                      {order.createdAt && (
                        <span className="ms-2 text-muted">({new Date(order.createdAt).toLocaleDateString('en-GB')})</span>
                      )}
                      <br />
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
                      <Button variant="outline-info" size="sm" onClick={() => handleDownloadPDF(order, orders.indexOf(order))} title="Download Image">
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
                <Form.Control type="text" required value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : '' })} className="bg-light" />
              </div>
              <div className="col-md-6">
                <Form.Label>Mobile Number</Form.Label>
                <Form.Control type="text" required minLength={11} maxLength={11} pattern="\d{5} \d{5}" title="Mobile number must be exactly 10 digits with a space after the first 5" value={formData.mobileNumber} onChange={(e) => { const rawValue = e.target.value.replace(/\D/g, '').slice(0, 10); const formattedValue = rawValue.length > 5 ? `${rawValue.slice(0, 5)} ${rawValue.slice(5)}` : rawValue; setFormData({ ...formData, mobileNumber: formattedValue }); }} className="bg-light" />
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
                      <option value="Discount Amount">Discount Amount</option>
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
              <Form.Label>Advance Amount</Form.Label>
              <Form.Control
                type="number"
                value={paymentFormData.advanceAmount}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, advanceAmount: e.target.value })}
                className="bg-light"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Advance Payment Method</Form.Label>
              <Form.Select
                required={Number(paymentFormData.advanceAmount) > 0}
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
                <option value="Discount Amount">Discount Amount</option>
              </Form.Select>
            </Form.Group>

            <h6 className="fw-bold mb-3 mt-4">Balance Payments</h6>
            {balancePayments.map((bp, i) => (
              <div key={i} className="d-flex gap-2 mb-3">
                <Form.Control
                  type="number"
                  placeholder="Amount"
                  required={!!bp.method}
                  value={bp.amount}
                  onChange={(e) => {
                    const newBps = [...balancePayments];
                    newBps[i].amount = e.target.value;
                    setBalancePayments(newBps);
                  }}
                  className="bg-light"
                />
                <Form.Select
                  required={!!bp.amount}
                  value={bp.method}
                  onChange={(e) => {
                    const newBps = [...balancePayments];
                    newBps[i].method = e.target.value;
                    setBalancePayments(newBps);
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
                {balancePayments.length > 1 && (
                  <Button variant="outline-danger" onClick={() => {
                    const newBps = balancePayments.filter((_, idx) => idx !== i);
                    setBalancePayments(newBps);
                  }}>
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline-primary" size="sm" onClick={() => setBalancePayments([...balancePayments, { amount: '', method: '' }])}>
              <Plus size={16} className="me-1" /> Add Payment Split
            </Button>
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
