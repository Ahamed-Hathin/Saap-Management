import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Form, Button, Row, Col, Table, Modal, Alert, Badge } from 'react-bootstrap';
import { Plus, Trash2, FileText, Download, Edit, Trash, CheckCircle, ReceiptText, ArrowRight, Check } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../services/api';
import html2canvas from 'html2canvas';
import sappLogo from '../assets/Sapp Logo.jpg.jpeg';
import signatureImg from '../assets/Sign.png';

const BANK_DETAILS = [
  {
    name: "Thangamani V",
    accNo: "1266155000013220",
    accLabel: "Acc No.",
    ifsc: "KVBL00012660",
    bank: "Karur Vysya Bank"
  },
  {
    name: "ARUN S",
    accNo: "1816155000042551",
    accLabel: "Acc No.",
    ifsc: "KVBL0001816",
    bank: "Karur Vysya Bank"
  },
  {
    name: "SAPP CREATION",
    accNo: "3618002100015276",
    accLabel: "Current Account",
    ifsc: "PUNB0361800",
    bank: "Punjab National Bank"
  }
];

const Quotation = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState({
    jobTypes: ['Visiting Card', 'Invitation', 'Offset', 'Screen', 'Digital', 'Lamination'],
    printingCompanies: ['Elite', 'Impression', 'Zig Zag', 'Vignesh', 'Amutham Flex', 'Chandru Screen', 'Amirtham Binding', 'Saravana Offset', 'Others'],
    orderStatuses: ['Printing', 'Cutting', 'Ready To Dispatch', 'Delivered']
  });
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [downloadQuotation, setDownloadQuotation] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    toAddress: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    bankIndex: 0,
    gstPercentage: 0,
    deliveryTime: '',
    adminNotes: '',
    items: [
      { id: 1, description: '', qtyPerItem: '', totalQuantity: '', price: '' }
    ]
  });

  // Convert to Order (Bill) State
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertErrors, setConvertErrors] = useState({});
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [convertData, setConvertData] = useState({
    quotationId: '',
    quotationTitle: '',
    clientName: '',
    mobileNumber: '',
    cardType: '',
    items: [{ itemName: '', totalQty: 1, price: 0 }],
    totalAmount: 0,
    advanceReceived: false,
    advanceAmount: '',
    paymentMethod: 'None',
    assignedEmployee: '',
    printingCompany: 'None',
    status: 'Pending',
    remarks: '',
    isClientOrder: false,
    markAsSelected: true
  });

  // Reference for the hidden print area
  const previewRef = useRef(null);

  useEffect(() => {
    fetchQuotations();
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [empRes, setRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/settings').catch(() => ({ data: null }))
      ]);
      if (empRes.data) setEmployees(empRes.data);
      if (setRes.data) setSettings(setRes.data);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    }
  };

  const fetchQuotations = async () => {
    try {
      const res = await api.get('/quotations');
      setQuotations(res.data);
    } catch (err) {
      console.error('Failed to fetch quotations:', err);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingId(null);
    setErrors({});
    setFormData({
      toAddress: '',
      title: '',
      date: new Date().toISOString().split('T')[0],
      bankIndex: 0,
      gstPercentage: 0,
      deliveryTime: '',
      adminNotes: '',
      items: [{ id: Date.now(), description: '', qtyPerItem: '', totalQuantity: '', price: '' }]
    });
  };

  const handleShow = () => setShowModal(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'bankIndex' ? Number(value) : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleItemChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id || item._id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'qtyPerItem' || field === 'totalQuantity') {
            const qty = Number(updatedItem.qtyPerItem) || 0;
            const pricePerQty = Number(updatedItem.totalQuantity) || 0;
            updatedItem.price = (qty * pricePerQty) || '';
          }
          return updatedItem;
        }
        return item;
      })
    }));
    if (errors[`item-${id}-${field}`]) {
      setErrors(prev => ({ ...prev, [`item-${id}-${field}`]: null }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), description: '', qtyPerItem: '', totalQuantity: '', price: '' }]
    }));
  };

  const removeItem = (id) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id && item._id !== id)
    }));
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!formData.title?.trim()) newErrors.title = 'Title is required';
    if (!formData.toAddress?.trim()) newErrors.toAddress = 'Recipient Address is required';

    formData.items.forEach(item => {
      const id = item.id || item._id;
      if (!item.description?.trim()) newErrors[`item-${id}-description`] = 'Description is required';
      if (!item.totalQuantity) newErrors[`item-${id}-totalQuantity`] = 'Price is required';
      if (!item.qtyPerItem) newErrors[`item-${id}-qtyPerItem`] = 'Qty is required';
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);

    try {
      setErrors({});
      const subTotal = formData.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
      const gstAmount = subTotal * (Number(formData.gstPercentage) || 0) / 100;
      const totalAmount = subTotal + gstAmount;
      const payload = { ...formData, totalAmount, gstPercentage: Number(formData.gstPercentage) || 0 };
      
      if (user?.role !== 'Admin') {
        delete payload.adminNotes;
      }

      if (editingId) {
        await api.put(`/quotations/${editingId}`, payload);
      } else {
        await api.post('/quotations', payload);
      }
      
      fetchQuotations();
      handleClose();
    } catch (err) {
      console.error('Error saving quotation:', err);
      alert('Failed to save quotation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (q) => {
    setFormData({
      toAddress: q.toAddress,
      title: q.title,
      date: new Date(q.date).toISOString().split('T')[0],
      bankIndex: q.bankIndex || 0,
      gstPercentage: q.gstPercentage || 0,
      adminNotes: q.adminNotes || '',
      items: q.items.map(i => ({ ...i, id: i._id || Date.now() }))
    });
    setEditingId(q._id);
    handleShow();
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Quotation?',
      text: 'Are you sure you want to delete this quotation?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/quotations/${id}`);
        fetchQuotations();
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Quotation has been removed.',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        console.error('Error deleting quotation:', err);
        Swal.fire('Error', 'Failed to delete quotation', 'error');
      }
    }
  };

  const handleToggleDone = async (q) => {
    try {
      await api.put(`/quotations/${q._id}`, { isDone: !q.isDone });
      fetchQuotations();
    } catch (error) {
      console.error('Error toggling quotation status', error);
    }
  };

  // Convert to Order Modal Handlers
  const handleOpenConvertModal = (q) => {
    // Extract recipient name from toAddress (first non-empty line)
    const addressLines = (q.toAddress || '').split('\n').map(l => l.trim()).filter(Boolean);
    const guessedClientName = addressLines.length > 0 ? addressLines[0] : (q.title || '');
    
    // Try to find a 10 digit phone number in toAddress
    const phoneMatch = (q.toAddress || '').match(/(?:\+91|0)?\s*([6-9]\d{9})/);
    let guessedPhone = '';
    if (phoneMatch && phoneMatch[1]) {
      const raw = phoneMatch[1];
      guessedPhone = `${raw.slice(0, 5)} ${raw.slice(5)}`;
    }

    // Pre-fill items from quotation items
    const mappedItems = (q.items && q.items.length > 0)
      ? q.items.map(item => ({
          itemName: item.description || '',
          totalQty: Number(item.qtyPerItem) || 1,
          price: Number(item.price) || (Number(item.qtyPerItem || 1) * Number(item.totalQuantity || 0))
        }))
      : [{ itemName: q.title || 'Custom Job Item', totalQty: 1, price: q.totalAmount || 0 }];

    // Find job type matching title or default
    const defaultJobType = settings.jobTypes && settings.jobTypes.length > 0
      ? (settings.jobTypes.find(j => (q.title || '').toLowerCase().includes(j.toLowerCase())) || settings.jobTypes[0])
      : 'Visiting Card';

    // Default employee: logged-in user if employee or first available employee
    const defaultEmp = (user && user.role === 'Employee') 
      ? user._id 
      : (employees[0]?._id || (user?._id || ''));

    const itemsTotal = mappedItems.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
    const calculatedTotal = q.totalAmount || itemsTotal;

    setConvertData({
      quotationId: q._id,
      quotationTitle: q.title || '',
      clientName: guessedClientName,
      mobileNumber: guessedPhone,
      cardType: defaultJobType,
      items: mappedItems,
      totalAmount: calculatedTotal,
      advanceReceived: false,
      advanceAmount: '',
      paymentMethod: 'None',
      assignedEmployee: defaultEmp,
      printingCompany: (settings.printingCompanies && settings.printingCompanies[0]) || 'None',
      status: 'Pending',
      remarks: `Converted from Quotation "${q.title || 'Untitled'}"${q.adminNotes ? ` | Note: ${q.adminNotes}` : ''}`,
      isClientOrder: false,
      markAsSelected: true
    });
    setConvertErrors({});
    setShowConvertModal(true);
  };

  const handleConvertItemChange = (index, field, value) => {
    const newItems = [...convertData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-update total amount from sum of item prices
    const newTotal = newItems.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
    
    setConvertData(prev => ({
      ...prev,
      items: newItems,
      totalAmount: newTotal
    }));

    if (convertErrors[`item-${index}-${field}`]) {
      setConvertErrors(prev => ({ ...prev, [`item-${index}-${field}`]: null }));
    }
  };

  const addConvertItem = () => {
    setConvertData(prev => ({
      ...prev,
      items: [...prev.items, { itemName: '', totalQty: 1, price: 0 }]
    }));
  };

  const removeConvertItem = (index) => {
    const newItems = convertData.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
    setConvertData(prev => ({
      ...prev,
      items: newItems,
      totalAmount: newTotal
    }));
  };

  const handleConvertSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!convertData.clientName?.trim()) {
      errors.clientName = 'Client Name is required';
    }

    const rawPhone = (convertData.mobileNumber || '').replace(/\D/g, '');
    if (!rawPhone || rawPhone.length !== 10) {
      errors.mobileNumber = 'Valid 10-digit mobile number is required (e.g. 98765 43210)';
    }

    if (!convertData.cardType) {
      errors.cardType = 'Job Type is required';
    }

    if (!convertData.assignedEmployee) {
      errors.assignedEmployee = 'Please assign an employee';
    }

    if (!convertData.items || convertData.items.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      convertData.items.forEach((it, idx) => {
        if (!it.itemName?.trim()) errors[`item-${idx}-itemName`] = 'Item name is required';
        if (!it.totalQty || Number(it.totalQty) <= 0) errors[`item-${idx}-totalQty`] = 'Qty is required';
      });
    }

    if (convertData.advanceReceived) {
      if (!convertData.advanceAmount || Number(convertData.advanceAmount) <= 0) {
        errors.advanceAmount = 'Please specify advance amount';
      }
      if (!convertData.paymentMethod || convertData.paymentMethod === 'None') {
        errors.paymentMethod = 'Please select a payment method';
      }
    }

    if (Object.keys(errors).length > 0) {
      setConvertErrors(errors);
      return;
    }

    setIsConverting(true);
    try {
      const formattedPhone = `${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}`;
      const payload = {
        clientName: convertData.clientName.trim(),
        mobileNumber: formattedPhone,
        cardType: convertData.cardType,
        items: convertData.items.map(it => ({
          itemName: it.itemName.trim(),
          totalQty: Number(it.totalQty) || 1,
          price: Number(it.price) || 0
        })),
        totalAmount: Number(convertData.totalAmount) || 0,
        advanceAmount: convertData.advanceReceived ? (Number(convertData.advanceAmount) || 0) : 0,
        balanceAmount: 0,
        advanceReceived: convertData.advanceReceived,
        paymentMethod: convertData.advanceReceived ? (convertData.paymentMethod || 'None') : 'None',
        assignedEmployee: convertData.assignedEmployee,
        printingCompany: convertData.printingCompany || 'None',
        status: convertData.status || 'Pending',
        remarks: convertData.remarks || '',
        isClientOrder: convertData.isClientOrder || false
      };

      const res = await api.post('/orders', payload);

      if (convertData.markAsSelected && convertData.quotationId) {
        await api.put(`/quotations/${convertData.quotationId}`, { isDone: true });
      }

      setShowConvertModal(false);
      fetchQuotations();

      Swal.fire({
        title: 'Bill (Order) Created!',
        html: `<b>Order #${res.data.serialNumber}</b> has been successfully created for <b>${convertData.clientName}</b>.`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'View Order Details',
        cancelButtonText: 'Stay on Quotations',
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(`/orders/${res.data._id}`);
        }
      });

    } catch (err) {
      console.error('Error converting quotation to order:', err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to convert quotation to order', 'error');
    } finally {
      setIsConverting(false);
    }
  };

  const executeDownload = async (q) => {
    setDownloadQuotation(q);
    
    setTimeout(async () => {
      if (previewRef.current) {
        try {
          const canvas = await html2canvas(previewRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `Quotation_${q.title || 'Draft'}.png`;
              link.href = url;
              link.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
            setDownloadQuotation(null);
          }, 'image/png');
        } catch (error) {
          console.error("Error generating image:", error);
          alert("Failed to generate quotation image.");
          setDownloadQuotation(null);
        }
      } else {
        setDownloadQuotation(null);
      }
    }, 50);
  };

  const filteredQuotations = quotations.filter(q => {
    let matchesFilter = true;
    if (filter === 'done') matchesFilter = q.isDone;
    if (filter === 'pending') matchesFilter = !q.isDone;
    
    let matchesSearch = true;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const titleMatch = q.title && q.title.toLowerCase().includes(lowerSearch);
      const addressMatch = q.toAddress && q.toAddress.toLowerCase().includes(lowerSearch);
      matchesSearch = titleMatch || addressMatch;
    }
    
    let matchesDate = true;
    if (dateFilter !== 'all' && q.date) {
      const qDate = new Date(q.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      if (dateFilter === 'today') {
        matchesDate = qDate >= today;
      } else if (dateFilter === 'yesterday') {
        matchesDate = qDate >= yesterday && qDate < today;
      } else if (dateFilter === 'weekly') {
        matchesDate = qDate >= startOfWeek;
      } else if (dateFilter === 'monthly') {
        matchesDate = qDate >= startOfMonth;
      } else if (dateFilter === 'custom') {
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          matchesDate = qDate >= start && qDate <= end;
        }
      }
    }
    
    return matchesFilter && matchesSearch && matchesDate;
  });

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0 fw-bold">Quotations</h2>
          <p className="text-muted mb-0">Manage, convert to bills (orders), and download your quotations</p>
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-md-end gap-2">
          <Form.Control
            type="text"
            placeholder="Search title or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '180px' }}
          />
          <Form.Select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: '130px' }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="custom">Custom Date</option>
          </Form.Select>
          
          {dateFilter === 'custom' && (
            <div className="d-flex align-items-center gap-1">
              <Form.Control
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                size="sm"
              />
              <span className="text-muted">to</span>
              <Form.Control
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                size="sm"
              />
            </div>
          )}

          <div className="d-flex gap-2 align-items-center">
            <Button 
              variant={filter === 'all' ? "primary" : "outline-primary"} 
              size="sm" 
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'done' ? "primary" : "outline-primary"} 
              size="sm" 
              onClick={() => setFilter('done')}
            >
              Selected
            </Button>
            <Button 
              variant={filter === 'pending' ? "primary" : "outline-primary"} 
              size="sm" 
              onClick={() => setFilter('pending')}
            >
              Not Selected
            </Button>
            <div className="vr d-none d-md-block mx-1"></div>
            <Button variant="primary" size="sm" onClick={handleShow} className="d-flex align-items-center text-nowrap">
              <FileText size={16} className="me-1" /> Create Quotation
            </Button>
          </div>
        </div>
      </div>

      {filteredQuotations.length === 0 ? (
        <div className="text-center p-5 bg-light rounded border">
          <FileText size={48} className="text-muted mb-3" />
          <h5 className="text-muted">No quotations found</h5>
          <p className="text-muted">Adjust your filter or generate a new quotation.</p>
        </div>
      ) : (
        <Row className="g-4">
          {filteredQuotations.map(q => (
            <Col key={q._id} xs={12} md={6} lg={4}>
              <div className="bg-white rounded shadow-sm border p-4 h-100 d-flex flex-column position-relative">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="fw-bold text-truncate mb-0" style={{ maxWidth: '70%' }} title={q.title}>{q.title || 'Untitled'}</h5>
                  <div className="d-flex flex-column align-items-end gap-1">
                    <span className="badge bg-light text-dark border">
                      {new Date(q.date).toLocaleDateString()}
                    </span>
                    {q.isDone && (
                      <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle">
                        <Check size={12} className="me-1" /> Selected
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mb-3 flex-grow-1">
                  <small className="text-muted d-block mb-1 fw-semibold">To (Customer)</small>
                  <p className="text-truncate mb-0" title={q.toAddress}>{q.toAddress || 'N/A'}</p>
                </div>

                {user?.role === 'Admin' && q.adminNotes && (
                  <div className="mb-3 p-2 bg-light rounded border">
                    <small className="text-muted d-block mb-1 fw-bold">Admin Notes</small>
                    <p className="mb-0 small text-break">{q.adminNotes}</p>
                  </div>
                )}
                
                <div className="mb-4 d-flex justify-content-between align-items-end">
                  <div>
                    <small className="text-muted d-block mb-1">Total Amount</small>
                    <h4 className="text-success fw-bold mb-0">₹{q.totalAmount?.toLocaleString() || 0}</h4>
                  </div>
                  {q.deliveryTime && (
                    <small className="text-muted">
                      Delivery: <strong>{q.deliveryTime} Days</strong>
                    </small>
                  )}
                </div>
                
                <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-auto">
                  <div className="d-flex align-items-center gap-2">
                    <Button 
                      variant={q.isDone ? "success" : "outline-success"} 
                      size="sm" 
                      onClick={() => handleToggleDone(q)} 
                      title={q.isDone ? "Mark as Pending" : "Mark as Selected"}
                    >
                      <CheckCircle size={16} />
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="d-flex align-items-center gap-1 shadow-sm fw-medium px-2 py-1"
                      onClick={() => handleOpenConvertModal(q)}
                      title="Convert this Quotation to a Bill / Order"
                    >
                      <ReceiptText size={15} />
                      <span>Convert to Bill</span>
                    </Button>
                  </div>
                  <div className="d-flex gap-1">
                    <Button variant="outline-primary" size="sm" onClick={() => executeDownload(q)} title="Download Quotation PNG">
                      <Download size={15} />
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => handleEdit(q)} title="Edit Quotation">
                      <Edit size={15} />
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(q._id)} title="Delete Quotation">
                      <Trash size={15} />
                    </Button>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* Convert to Bill (Order) Modal */}
      <Modal backdrop="static" show={showConvertModal} onHide={() => setShowConvertModal(false)} centered size="lg" contentClassName="border-0 rounded-4 shadow-lg">
        <Modal.Header closeButton className="border-0 pb-0 mt-3 mx-2">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
              <ReceiptText size={22} />
            </div>
            <span>Convert Quotation to Bill (Order)</span>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleConvertSubmit}>
          <Modal.Body className="px-4 pt-3">
            <div className="alert alert-info border-0 bg-info bg-opacity-10 d-flex justify-content-between align-items-center mb-4 py-2 px-3">
              <div>
                <small className="text-muted d-block">Source Quotation</small>
                <strong className="text-dark">{convertData.quotationTitle || 'Quotation'}</strong>
              </div>
              <Badge bg="primary" className="px-3 py-2 fs-6">
                Total: ₹{Number(convertData.totalAmount || 0).toLocaleString()}
              </Badge>
            </div>

            <Row className="g-3">
              {/* Client Name with Suggestions */}
              <Col md={6} className="position-relative">
                <Form.Label className="fw-semibold">Customer / Client Name <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={convertData.clientName}
                  isInvalid={!!convertErrors.clientName}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setConvertData(prev => ({
                      ...prev,
                      clientName: val ? val.replace(/(^\w|\s\w)/g, m => m.toUpperCase()) : '',
                      isClientOrder: false
                    }));
                    if (val.trim().length > 0) {
                      try {
                        const res = await api.get(`/clients/search?q=${val}`);
                        setClientSuggestions(res.data);
                        setShowSuggestions(res.data.length > 0);
                      } catch (err) {
                        console.error(err);
                      }
                    } else {
                      setShowSuggestions(false);
                    }
                  }}
                  onFocus={() => { if (clientSuggestions.length > 0) setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="bg-light"
                />
                <Form.Control.Feedback type="invalid">{convertErrors.clientName}</Form.Control.Feedback>

                {showSuggestions && (
                  <ul className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 1000, marginTop: '2px' }}>
                    {clientSuggestions.map(client => (
                      <li
                        key={client._id}
                        className="list-group-item list-group-item-action py-2"
                        style={{ cursor: 'pointer' }}
                        onMouseDown={() => {
                          setConvertData(prev => ({
                            ...prev,
                            clientName: client.clientName,
                            mobileNumber: client.mobileNumber,
                            isClientOrder: true
                          }));
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="fw-bold">{client.username}</div>
                        <small className="text-muted">{client.clientName} - {client.mobileNumber}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </Col>

              {/* Mobile Number */}
              <Col md={6}>
                <Form.Label className="fw-semibold">Mobile Number <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder="98765 43210"
                  value={convertData.mobileNumber}
                  isInvalid={!!convertErrors.mobileNumber}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                    const formattedValue = rawValue.length > 5 ? `${rawValue.slice(0, 5)} ${rawValue.slice(5)}` : rawValue;
                    setConvertData(prev => ({ ...prev, mobileNumber: formattedValue }));
                    if (convertErrors.mobileNumber) setConvertErrors(prev => ({ ...prev, mobileNumber: null }));
                  }}
                  className="bg-light"
                />
                <Form.Control.Feedback type="invalid">{convertErrors.mobileNumber}</Form.Control.Feedback>
              </Col>

              {/* Job Type */}
              <Col md={6}>
                <Form.Label className="fw-semibold">Job Type <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  required
                  value={convertData.cardType}
                  onChange={(e) => setConvertData(prev => ({ ...prev, cardType: e.target.value }))}
                  className="bg-light"
                >
                  <option value="">Select Job Type</option>
                  {(settings.jobTypes || ['Visiting Card', 'Invitation', 'Offset', 'Screen', 'Digital', 'Lamination']).map(job => (
                    <option key={job} value={job}>{job}</option>
                  ))}
                </Form.Select>
              </Col>

              {/* Assign Employee */}
              <Col md={6}>
                <Form.Label className="fw-semibold">Assign Employee <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  required
                  value={convertData.assignedEmployee}
                  onChange={(e) => setConvertData(prev => ({ ...prev, assignedEmployee: e.target.value }))}
                  className="bg-light"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </Form.Select>
              </Col>

              {/* Printing Method */}
              <Col md={6}>
                <Form.Label className="fw-semibold">Printing Method / Company</Form.Label>
                <Form.Select
                  value={convertData.printingCompany}
                  onChange={(e) => setConvertData(prev => ({ ...prev, printingCompany: e.target.value }))}
                  className="bg-light"
                >
                  <option value="None">None / Direct</option>
                  {(settings.printingCompanies || ['Elite', 'Impression', 'Zig Zag', 'Vignesh', 'Amutham Flex', 'Chandru Screen', 'Amirtham Binding', 'Saravana Offset', 'Others']).map(pc => (
                    <option key={pc} value={pc}>{pc}</option>
                  ))}
                </Form.Select>
              </Col>

              {/* Initial Status */}
              <Col md={6}>
                <Form.Label className="fw-semibold">Initial Order Status</Form.Label>
                <Form.Select
                  value={convertData.status}
                  onChange={(e) => setConvertData(prev => ({ ...prev, status: e.target.value }))}
                  className="bg-light"
                >
                  <option value="Pending">Pending</option>
                  <option value="Printing">Printing</option>
                  <option value="Cutting">Cutting</option>
                  <option value="Ready To Dispatch">Ready To Dispatch</option>
                  <option value="Delivered">Delivered</option>
                </Form.Select>
              </Col>

              {/* Items Section */}
              <Col xs={12} className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0">Order Items (Bill Lines)</h6>
                  <Button variant="outline-primary" size="sm" onClick={addConvertItem}>
                    <Plus size={15} className="me-1" /> Add Item
                  </Button>
                </div>

                {convertData.items.map((item, index) => (
                  <div key={index} className="border rounded-3 p-3 mb-2 bg-white position-relative shadow-sm">
                    {convertData.items.length > 1 && (
                      <Button
                        variant="link"
                        className="position-absolute text-danger p-0"
                        style={{ top: '10px', right: '10px' }}
                        onClick={() => removeConvertItem(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                    <Row className="g-2">
                      <Col md={6}>
                        <Form.Label className="small fw-semibold mb-1">Item Description / Name</Form.Label>
                        <Form.Control
                          type="text"
                          required
                          placeholder="e.g. Visiting Cards with Velvet Matte"
                          value={item.itemName}
                          isInvalid={!!convertErrors[`item-${index}-itemName`]}
                          onChange={(e) => handleConvertItemChange(index, 'itemName', e.target.value)}
                          className="bg-light form-control-sm"
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Label className="small fw-semibold mb-1">Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          min="1"
                          placeholder="1"
                          value={item.totalQty}
                          isInvalid={!!convertErrors[`item-${index}-totalQty`]}
                          onChange={(e) => handleConvertItemChange(index, 'totalQty', e.target.value)}
                          className="bg-light form-control-sm"
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Label className="small fw-semibold mb-1">Total Price (₹)</Form.Label>
                        <Form.Control
                          type="number"
                          required
                          min="0"
                          placeholder="0"
                          value={item.price}
                          onChange={(e) => handleConvertItemChange(index, 'price', e.target.value)}
                          className="bg-light form-control-sm"
                        />
                      </Col>
                    </Row>
                  </div>
                ))}
              </Col>

              {/* Total Amount */}
              <Col md={6} className="mt-3">
                <Form.Label className="fw-semibold">Total Order Amount (₹) <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  required
                  min="0"
                  value={convertData.totalAmount}
                  onChange={(e) => setConvertData(prev => ({ ...prev, totalAmount: e.target.value }))}
                  className="bg-light fw-bold text-success fs-5"
                />
              </Col>

              {/* Advance Amount Toggle */}
              <Col md={6} className="mt-3 pt-md-4">
                <Form.Check
                  type="switch"
                  id="convert-advance-switch"
                  label="Advance Payment Received"
                  checked={convertData.advanceReceived}
                  onChange={(e) => setConvertData(prev => ({ ...prev, advanceReceived: e.target.checked }))}
                  className="fw-semibold pt-2"
                />
              </Col>

              {/* Advance Payment Details */}
              {convertData.advanceReceived && (
                <>
                  <Col md={6}>
                    <Form.Label className="fw-semibold">Advance Amount (₹) <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="0"
                      required
                      value={convertData.advanceAmount}
                      isInvalid={!!convertErrors.advanceAmount}
                      onChange={(e) => setConvertData(prev => ({ ...prev, advanceAmount: e.target.value }))}
                      className="bg-light"
                    />
                    <Form.Control.Feedback type="invalid">{convertErrors.advanceAmount}</Form.Control.Feedback>
                  </Col>
                  <Col md={6}>
                    <Form.Label className="fw-semibold">Payment Method <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      required
                      value={convertData.paymentMethod}
                      isInvalid={!!convertErrors.paymentMethod}
                      onChange={(e) => setConvertData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="bg-light"
                    >
                      <option value="">Select Method</option>
                      <option value="GPay">GPay</option>
                      <option value="B-Gpay">B-Gpay</option>
                      <option value="NEFT">NEFT</option>
                      <option value="KVB">KVB</option>
                      <option value="Dtdc Wallet">Dtdc Wallet</option>
                      <option value="Cash">Cash</option>
                      <option value="Discount Amount">Discount Amount</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{convertErrors.paymentMethod}</Form.Control.Feedback>
                  </Col>
                </>
              )}

              {/* Remarks */}
              <Col xs={12}>
                <Form.Label className="fw-semibold">Order Remarks / Notes (Staff Only)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Internal notes for this order..."
                  value={convertData.remarks}
                  onChange={(e) => setConvertData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="bg-light"
                />
              </Col>

              {/* Checkbox: Mark Quotation as Done */}
              <Col xs={12}>
                <Form.Check
                  type="checkbox"
                  id="mark-quotation-done"
                  label="Mark Quotation as Selected (Done)"
                  checked={convertData.markAsSelected}
                  onChange={(e) => setConvertData(prev => ({ ...prev, markAsSelected: e.target.checked }))}
                  className="text-muted small"
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 px-4 pb-4">
            <Button variant="light" onClick={() => setShowConvertModal(false)} disabled={isConverting} className="fw-medium">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isConverting} className="fw-semibold px-4 d-flex align-items-center gap-2">
              <ReceiptText size={18} />
              {isConverting ? 'Creating Bill (Order)...' : 'Create Bill (Order)'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Creation/Edit Modal */}
      <Modal show={showModal} onHide={handleClose} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Edit Quotation' : 'Create New Quotation'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    name="date" 
                    value={formData.date} 
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleInputChange}
                    isInvalid={!!errors.title}
                    placeholder="e.g. Website Design Project"
                  />
                  <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Bank Details</Form.Label>
              <Form.Select 
                name="bankIndex" 
                value={formData.bankIndex} 
                onChange={handleInputChange}
              >
                {BANK_DETAILS.map((bank, index) => (
                  <option key={index} value={index}>
                    {bank.name} - {bank.bank} ({bank.accNo})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Delivery Time (Days) (Optional)</Form.Label>
              <Form.Control 
                type="text" 
                name="deliveryTime" 
                value={formData.deliveryTime} 
                onChange={handleInputChange}
                placeholder="e.g. 10"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>GST Percentage (%) (Optional)</Form.Label>
              <Form.Control 
                type="number" 
                name="gstPercentage" 
                value={formData.gstPercentage} 
                onChange={handleInputChange}
                min="0"
                max="100"
                placeholder="e.g. 18"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>To (Recipient Address)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                name="toAddress" 
                value={formData.toAddress} 
                onChange={handleInputChange}
                isInvalid={!!errors.toAddress}
                placeholder="Recipient Name&#10;Address Details"
              />
              <Form.Control.Feedback type="invalid">{errors.toAddress}</Form.Control.Feedback>
            </Form.Group>

            {user?.role === 'Admin' && (
              <Form.Group className="mb-4">
                <Form.Label>Admin Notes / Remarks (Internal Use Only)</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={2} 
                  name="adminNotes" 
                  value={formData.adminNotes} 
                  onChange={handleInputChange}
                  placeholder="Notes visible only to admins"
                />
              </Form.Group>
            )}

            <div className="d-flex justify-content-between align-items-center mb-3 border-top pt-3">
              <h6 className="fw-bold mb-0">Quotation Items</h6>
              <Button variant="outline-primary" size="sm" onClick={addItem}>
                <Plus size={16} /> Add Item
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <div key={item.id || item._id} className="p-3 bg-light rounded mb-3 border">
                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-medium">Item {index + 1}</span>
                  {formData.items.length > 1 && (
                    <Button variant="link" className="text-danger p-0" onClick={() => removeItem(item.id || item._id)}>
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
                
                <Form.Group className="mb-2">
                  <Form.Control 
                    as="textarea"
                    rows={2}
                    placeholder="Item Description" 
                    value={item.description}
                    isInvalid={!!errors[`item-${item.id || item._id}-description`]}
                    onChange={(e) => handleItemChange(item.id || item._id, 'description', e.target.value)}
                  />
                  <Form.Control.Feedback type="invalid">{errors[`item-${item.id || item._id}-description`]}</Form.Control.Feedback>
                </Form.Group>
                <Row>
                  <Col md={4} className="mb-2 mb-md-0">
                    <Form.Group>
                      <Form.Label className="small text-dark fw-medium mb-1">Price</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Price" 
                        value={item.totalQuantity}
                        isInvalid={!!errors[`item-${item.id || item._id}-totalQuantity`]}
                        onChange={(e) => handleItemChange(item.id || item._id, 'totalQuantity', e.target.value)}
                      />
                      <Form.Control.Feedback type="invalid">{errors[`item-${item.id || item._id}-totalQuantity`]}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4} className="mb-2 mb-md-0">
                    <Form.Group>
                      <Form.Label className="small text-dark fw-medium mb-1">Qty</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Qty" 
                        value={item.qtyPerItem}
                        isInvalid={!!errors[`item-${item.id || item._id}-qtyPerItem`]}
                        onChange={(e) => handleItemChange(item.id || item._id, 'qtyPerItem', e.target.value)}
                      />
                      <Form.Control.Feedback type="invalid">{errors[`item-${item.id || item._id}-qtyPerItem`]}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small text-dark fw-medium mb-1">Price (₹)</Form.Label>
                      <Form.Control 
                        type="number" 
                        placeholder="Price (₹)" 
                        value={item.price}
                        onChange={(e) => handleItemChange(item.id || item._id, 'price', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            ))}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Quotation'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Hidden Download Container */}
      {downloadQuotation && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div 
            ref={previewRef}
            style={{
              width: '794px',
              minHeight: '1123px',
              backgroundColor: 'white',
              padding: '40px 50px',
              fontFamily: '"Times New Roman", Times, serif',
              color: '#000',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
              <div style={{ position: 'absolute', left: 0, color: '#151965', fontStyle: 'italic', fontWeight: 'bold', fontFamily: '"Brush Script MT", cursive', fontSize: '16px', paddingTop: '10px' }}>
                Prop. Praveen kumar
              </div>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={sappLogo} alt="SAPP Creation Logo" style={{ maxWidth: '380px', maxHeight: '130px', objectFit: 'contain' }} />
                <div style={{ fontSize: '14px', color: '#151965', marginTop: '4px', maxWidth: '480px', lineHeight: '1.3', fontWeight: '500' }}>
                  Wedding Invitation, Multicolor Designing, Visiting Card, Id Cards, Non Woven Bags & Offset Printing, Notice, Bookwork, Flex, & Calender, .
                </div>
              </div>
              <div style={{ position: 'absolute', right: 0, color: '#151965', fontSize: '14px', fontWeight: 'bold', textAlign: 'right', fontFamily: 'Arial, sans-serif', paddingTop: '10px' }}>
                <div>Ph : 0431-4010547</div>
                <div>Cell : 88833 72047</div>
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>sappcreation.tpj@gmail.com</div>
              </div>
            </div>

            {/* Address line with red borders */}
            <div style={{ marginTop: '10px' }}>
              <div style={{ borderTop: '1px solid #c93329', borderBottom: '3px solid #c93329', padding: '5px 0', textAlign: 'center' }}>
                <span style={{ color: '#151965', fontWeight: 'bold', fontSize: '15px', fontStyle: 'italic' }}>
                  No.3/4, Shop No.03, 1st Floor, Alam Tower, Allimal St, Trichy - 8.
                </span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#c93329', marginTop: '2px' }}></div>
            </div>

            {/* GST and Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontWeight: 'bold', fontSize: '16px' }}>
              <div style={{ color: '#c93329' }}>GST No: 33CAPPP6674J1ZZ</div>
              <div style={{ color: '#151965' }}>Date: {new Date(downloadQuotation.date).toLocaleDateString('en-GB').replace(/\//g, '.')}</div>
            </div>

            {/* To Section */}
            <div style={{ color: '#151965', marginTop: '20px', fontSize: '15px', fontWeight: 'bold', lineHeight: '1.4' }}>
              <div>To</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{downloadQuotation.toAddress}</div>
            </div>

            {/* Items */}
            <div style={{ marginTop: '40px', flexGrow: 1, paddingLeft: '30px', paddingRight: '30px' }}>
              {/* Header Row */}
              <div style={{ display: 'flex', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', color: '#151965', borderBottom: '2px solid #151965', paddingBottom: '8px' }}>
                <div style={{ width: '8%', textAlign: 'right', paddingRight: '10px' }}>S.No</div>
                <div style={{ width: '38%' }}>Title</div>
                <div style={{ width: '22%', textAlign: 'center' }}>Price</div>
                <div style={{ width: '17%', textAlign: 'center' }}>Qty</div>
                <div style={{ width: '15%', textAlign: 'left' }}>Price</div>
              </div>

              {downloadQuotation.items.map((item, index) => (
                <div key={item._id || index} style={{ display: 'flex', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a' }}>
                  <div style={{ width: '8%', textAlign: 'right', paddingRight: '10px' }}>{index + 1}.</div>
                  <div style={{ width: '38%', whiteSpace: 'pre-wrap', paddingRight: '10px' }}>{item.description}</div>
                  <div style={{ width: '22%', textAlign: 'center' }}>{item.totalQuantity ? `₹${item.totalQuantity}` : '-'}</div>
                  <div style={{ width: '17%', textAlign: 'center' }}>{item.qtyPerItem ? `${item.qtyPerItem}` : '-'}</div>
                  <div style={{ width: '15%', textAlign: 'left' }}>- {item.price ? `${item.price}/-` : ''}</div>
                </div>
              ))}
              
              {/* Total Amount Row */}
              <div style={{ display: 'flex', marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #151965', fontSize: '18px', fontWeight: 'bold', color: '#151965' }}>
                <div style={{ width: '85%', textAlign: 'right', paddingRight: '20px' }}>
                  {downloadQuotation.gstPercentage > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'normal', marginBottom: '4px' }}>Subtotal:</div>
                      <div style={{ fontSize: '16px', fontWeight: 'normal', marginBottom: '4px' }}>GST ({downloadQuotation.gstPercentage}%):</div>
                      <div>Grand Total:</div>
                    </div>
                  ) : (
                    "Total Amount:"
                  )}
                </div>
                <div style={{ width: '15%', textAlign: 'left' }}>
                  {(() => {
                    const subtotal = downloadQuotation.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
                    const gstAmount = downloadQuotation.gstPercentage ? subtotal * (downloadQuotation.gstPercentage / 100) : 0;
                    const grandTotal = subtotal + gstAmount;
                    
                    if (downloadQuotation.gstPercentage > 0) {
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontSize: '16px', fontWeight: 'normal', marginBottom: '4px' }}>₹{subtotal}/-</div>
                          <div style={{ fontSize: '16px', fontWeight: 'normal', marginBottom: '4px' }}>₹{gstAmount}/-</div>
                          <div>₹{grandTotal}/-</div>
                        </div>
                      );
                    }
                    return `₹${downloadQuotation.totalAmount || grandTotal}/-`;
                  })()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', lineHeight: '1.4', color: '#1a1a1a' }}>
                  {(() => {
                    const selectedBank = BANK_DETAILS[downloadQuotation.bankIndex || 0];
                    return (
                      <>
                        <div>Name: {selectedBank.name}</div>
                        <div>{selectedBank.accLabel}: {selectedBank.accNo}</div>
                        <div>IFSC Code: {selectedBank.ifsc}</div>
                        <div>{selectedBank.bank}</div>
                      </>
                    );
                  })()}
                </div>
                <div style={{ color: '#151965', marginTop: '25px', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
                  <div style={{ fontWeight: 'bold' }}>Terms & Conditions:</div>
                  <div style={{ fontWeight: 'bold' }}>Payment Immediately</div>
                  {downloadQuotation.deliveryTime && (
                    <div style={{ fontWeight: 'bold' }}>After Confirmation of PO and Proof Delivery Time will be delivery({downloadQuotation.deliveryTime}) Days</div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', paddingRight: '10px' }}>
                <div style={{ color: '#151965', fontSize: '14px', fontFamily: 'Arial, sans-serif', marginBottom: '0px' }}>Your's Trully</div>
                <img src={signatureImg} alt="Signature" style={{ maxHeight: '60px', objectFit: 'contain', margin: '2px 0' }} />
                <div style={{ color: '#151965', fontWeight: '900', fontSize: '18px', fontFamily: 'Arial Black, Impact, sans-serif', marginTop: '0px' }}>Sapp Creation</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default Quotation;
