import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { Plus, Trash2, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';

const DEFAULT_STATUS_OPTIONS = [
  'Pending',
  'Ready to Dispatch',
  'Delivered',
  'Cancelled'
];

const CreateOrderModal = ({
  show,
  onHide,
  isAdmin = false,
  isClientOrderDefault = false,
  initialData = null,
  settings = { jobTypes: [], printingCompanies: [] },
  employees = [],
  user = null,
  onOrderCreated,
  sendWhatsAppInvoice,
  statusOptions = DEFAULT_STATUS_OPTIONS,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepErrors, setStepErrors] = useState({});
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

  const getInitialFormData = () => {
    const defaultJobType = isAdmin
      ? ''
      : (settings?.jobTypes?.length > 0 ? settings.jobTypes[0] : 'Visiting Card');
    const defaultPrinting = isAdmin
      ? ''
      : (settings?.printingCompanies?.length > 0 ? settings.printingCompanies[0] : 'Elite');
    const defaultPayment = isAdmin ? '' : 'GPay';

    return {
      clientName: initialData?.clientName || '',
      mobileNumber: initialData?.mobileNumber || '',
      cardType: initialData?.cardType || defaultJobType,
      advanceAmount: initialData?.advanceAmount || '',
      totalAmount: initialData?.totalAmount || '',
      assignedEmployee: initialData?.assignedEmployee || '',
      advanceReceived: initialData?.advanceReceived || false,
      paymentMethod: initialData?.paymentMethod || defaultPayment,
      printingCompany: initialData?.printingCompany || defaultPrinting,
      status: initialData?.status || 'Pending',
      isClientOrder: initialData?.isClientOrder !== undefined ? initialData.isClientOrder : isClientOrderDefault,
      remarks: initialData?.remarks || '',
      items: initialData?.items && initialData.items.length > 0
        ? initialData.items
        : [{ itemName: '', totalQty: '', price: '' }],
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);

  // Re-initialize state whenever modal opens or initialData changes
  useEffect(() => {
    if (show) {
      setFormData(getInitialFormData());
      setCurrentStep(1);
      setStepErrors({});
      setFile(null);
      setError('');
      setIsLoading(false);
      setClientSuggestions([]);
      setShowSuggestions(false);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [show, initialData]);

  // Debounced client search
  const handleClientNameChange = (e) => {
    const val = e.target.value;
    const formattedVal = val ? val.replace(/(^\w|\s\w)/g, m => m.toUpperCase()) : '';

    setFormData(prev => ({
      ...prev,
      clientName: formattedVal,
      ...(isAdmin && !isClientOrderDefault ? { isClientOrder: false } : {})
    }));

    if (stepErrors.clientName) {
      setStepErrors(prev => ({ ...prev, clientName: null }));
    }

    const isStaff2 = user && user.name && user.name.toLowerCase() === 'staff 2';
    if (isStaff2) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await api.get(`/clients/search?q=${encodeURIComponent(val.trim())}`);
          setClientSuggestions(res.data || []);
          setShowSuggestions((res.data || []).length > 0);
        } catch (err) {
          console.error('Error fetching client suggestions:', err);
        }
      }, 250);
    } else {
      setClientSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const validateStep1 = () => {
    const errs = {};
    if (!formData.clientName?.trim()) errs.clientName = 'Client Name is required';
    const rawPhone = (formData.mobileNumber || '').replace(/\D/g, '');
    if (!rawPhone || rawPhone.length !== 10) errs.mobileNumber = '10-digit mobile number required (e.g. 98765 43210)';
    if (!formData.cardType) errs.cardType = 'Please select a job type';
    if (isAdmin && !formData.assignedEmployee) errs.assignedEmployee = 'Please assign an employee';
    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!formData.items || formData.items.length === 0) {
      errs.items = 'At least one item is required';
    } else {
      formData.items.forEach((item, idx) => {
        if (!item.itemName?.trim()) errs[`item-${idx}-itemName`] = 'Item name is required';
        if (!item.totalQty || Number(item.totalQty) <= 0) errs[`item-${idx}-totalQty`] = 'Qty is required';
      });
    }
    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        const calculatedTotal = formData.items.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
        if (!formData.totalAmount || Number(formData.totalAmount) === 0) {
          setFormData(prev => ({ ...prev, totalAmount: calculatedTotal.toString() }));
        }
        setCurrentStep(3);
      }
    }
  };

  const handlePrevStep = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setStepErrors({});
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (currentStep < 3) {
      handleNextStep(e);
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        items: formData.items.map(item => ({
          itemName: item.itemName,
          totalQty: Number(item.totalQty) || 1,
          price: Number(item.price) || 0
        })),
        advanceAmount: formData.advanceAmount === '' || formData.advanceAmount === null || formData.advanceAmount === undefined ? 0 : Number(formData.advanceAmount),
        totalAmount: formData.totalAmount === '' || formData.totalAmount === null || formData.totalAmount === undefined ? 0 : Number(formData.totalAmount),
        paymentMethod: formData.paymentMethod === '' ? 'None' : formData.paymentMethod,
        printingCompany: formData.printingCompany === '' ? 'None' : formData.printingCompany,
        remarks: formData.remarks || '',
      };
      const { data: newOrder } = await api.post('/orders', payload);

      if (file) {
        const uploadData = new FormData();
        uploadData.append('image', file);
        await api.post(`/orders/${newOrder._id}/upload`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      onHide();
      if (onOrderCreated) {
        onOrderCreated(newOrder);
      }

      if (isAdmin && sendWhatsAppInvoice) {
        Swal.fire({
          title: 'Order Created Successfully!',
          text: `Would you like to send the invoice image to ${newOrder.clientName || 'the client'} via WhatsApp?`,
          icon: 'success',
          showCancelButton: true,
          confirmButtonColor: '#25D366',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'WhatsApp Invoice Image',
          cancelButtonText: 'Done'
        }).then((result) => {
          if (result.isConfirmed) {
            sendWhatsAppInvoice(newOrder);
          }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      backdrop="static"
      show={show}
      onHide={onHide}
      centered
      size="lg"
      contentClassName="border-0 rounded-4 shadow-lg"
    >
      <Modal.Header closeButton className="border-0 pb-0 mt-3 mx-2">
        <Modal.Title className="fw-bold">Create New Order</Modal.Title>
      </Modal.Header>
      <Form onSubmit={(e) => { e.preventDefault(); if (currentStep < 3) handleNextStep(e); else handleSubmit(e); }}>
        {/* Stepper Progress Bar */}
        <div className="px-4 pt-3 pb-2">
          <div className="position-relative d-flex justify-content-between align-items-center mb-3 px-4">
            <div 
              className="position-absolute top-50 start-0 translate-middle-y w-100" 
              style={{ height: '3px', backgroundColor: '#e2e8f0', zIndex: 1 }}
            />
            <div 
              className="position-absolute top-50 start-0 translate-middle-y" 
              style={{ 
                height: '3px', 
                backgroundColor: '#198754', 
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
                zIndex: 2,
                transition: 'width 0.3s ease'
              }}
            />
            
            {/* Step 1 Node */}
            <div 
              className="d-flex flex-column align-items-center position-relative" 
              style={{ zIndex: 3, cursor: currentStep > 1 ? 'pointer' : 'default' }}
              onClick={() => currentStep > 1 && setCurrentStep(1)}
              title={currentStep > 1 ? "Move to Step 1: Customer & Job" : "Step 1"}
            >
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm transition-all ${
                  currentStep > 1 
                    ? 'bg-success text-white' 
                    : currentStep === 1 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-muted border'
                }`}
                style={{ width: '36px', height: '36px', fontSize: '14px', border: currentStep === 1 ? '3px solid #bfdbfe' : 'none' }}
              >
                {currentStep > 1 ? <Check size={18} /> : '1'}
              </div>
              <span className={`small mt-1 fw-semibold ${currentStep === 1 ? 'text-primary' : currentStep > 1 ? 'text-success' : 'text-muted'}`}>
                Customer & Job
              </span>
            </div>

            {/* Step 2 Node */}
            <div 
              className="d-flex flex-column align-items-center position-relative" 
              style={{ zIndex: 3, cursor: currentStep === 3 ? 'pointer' : 'default' }}
              onClick={() => currentStep === 3 && setCurrentStep(2)}
              title={currentStep === 3 ? "Move to Step 2: Items & Design" : "Step 2"}
            >
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm transition-all ${
                  currentStep > 2 
                    ? 'bg-success text-white' 
                    : currentStep === 2 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-muted border'
                }`}
                style={{ width: '36px', height: '36px', fontSize: '14px', border: currentStep === 2 ? '3px solid #bfdbfe' : 'none' }}
              >
                {currentStep > 2 ? <Check size={18} /> : '2'}
              </div>
              <span className={`small mt-1 fw-semibold ${currentStep === 2 ? 'text-primary' : currentStep > 2 ? 'text-success' : 'text-muted'}`}>
                Items & Design
              </span>
            </div>

            {/* Step 3 Node */}
            <div 
              className="d-flex flex-column align-items-center position-relative" 
              style={{ zIndex: 3 }}
            >
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm transition-all ${
                  currentStep === 3 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-muted border'
                }`}
                style={{ width: '36px', height: '36px', fontSize: '14px', border: currentStep === 3 ? '3px solid #bfdbfe' : 'none' }}
              >
                3
              </div>
              <span className={`small mt-1 fw-semibold ${currentStep === 3 ? 'text-primary' : 'text-muted'}`}>
                Payment & Summary
              </span>
            </div>
          </div>
        </div>

        <Modal.Body className="px-4 pt-2">
          {error && <Alert variant="danger" className="border-0 bg-danger bg-opacity-10 text-danger">{error}</Alert>}

          {/* STEP 1: Customer & Job */}
          {currentStep === 1 && (
            <div className="row g-3">
              <div className="col-md-6 position-relative">
                <Form.Label className="fw-semibold">Client Name <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="text" 
                  required 
                  placeholder="e.g. John Doe"
                  value={formData.clientName} 
                  isInvalid={!!stepErrors.clientName}
                  onChange={handleClientNameChange} 
                  onFocus={() => { if (clientSuggestions.length > 0) setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="bg-light" 
                />
                <Form.Control.Feedback type="invalid">{stepErrors.clientName}</Form.Control.Feedback>

                {showSuggestions && (
                  <ul className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 1000, marginTop: '2px' }}>
                    {clientSuggestions.map(client => (
                      <li 
                        key={client._id} 
                        className="list-group-item list-group-item-action cursor-pointer py-2"
                        style={{ cursor: 'pointer' }}
                        onMouseDown={() => {
                          setFormData(prev => ({
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
              </div>

              <div className="col-md-6">
                <Form.Label className="fw-semibold">Mobile Number <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="text" 
                  required 
                  placeholder="98765 43210"
                  value={formData.mobileNumber} 
                  isInvalid={!!stepErrors.mobileNumber}
                  onChange={(e) => { 
                    const rawValue = e.target.value.replace(/\D/g, '').slice(0, 10); 
                    const formattedValue = rawValue.length > 5 ? `${rawValue.slice(0, 5)} ${rawValue.slice(5)}` : rawValue; 
                    setFormData(prev => ({ ...prev, mobileNumber: formattedValue })); 
                    if (stepErrors.mobileNumber) setStepErrors(prev => ({ ...prev, mobileNumber: null }));
                  }} 
                  className="bg-light" 
                />
                <Form.Control.Feedback type="invalid">{stepErrors.mobileNumber}</Form.Control.Feedback>
              </div>

              <div className={isAdmin ? "col-md-6" : "col-12"}>
                <Form.Label className="fw-semibold">Job Type <span className="text-danger">*</span></Form.Label>
                <Form.Select 
                  required 
                  value={formData.cardType} 
                  isInvalid={!!stepErrors.cardType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, cardType: val }));
                    if (stepErrors.cardType) setStepErrors(prev => ({ ...prev, cardType: null }));
                  }} 
                  className="bg-light"
                >
                  <option value="">Select Job Type</option>
                  {settings.jobTypes && settings.jobTypes.map(job => (
                    <option key={job} value={job}>{job}</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{stepErrors.cardType}</Form.Control.Feedback>
              </div>

              {isAdmin && (
                <div className="col-md-6">
                  <Form.Label className="fw-semibold">Assign Employee <span className="text-danger">*</span></Form.Label>
                  <Form.Select 
                    required 
                    value={formData.assignedEmployee} 
                    isInvalid={!!stepErrors.assignedEmployee}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, assignedEmployee: val }));
                      if (stepErrors.assignedEmployee) setStepErrors(prev => ({ ...prev, assignedEmployee: null }));
                    }} 
                    className="bg-light"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{stepErrors.assignedEmployee}</Form.Control.Feedback>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Items & Design */}
          {currentStep === 2 && (
            <div className="row g-3">
              <div className="col-12">
                <div className="mb-2">
                  <h6 className="fw-bold mb-0">Order Items (Line Items) <span className="text-danger">*</span></h6>
                </div>

                {stepErrors.items && (
                  <Alert variant="danger" className="py-2 small border-0 bg-danger bg-opacity-10 text-danger">{stepErrors.items}</Alert>
                )}

                {formData.items.map((item, index) => (
                  <div key={index} className="border rounded-3 p-3 mb-3 bg-white position-relative shadow-sm">
                    {formData.items.length > 1 && (
                      <Button 
                        variant="link" 
                        className="position-absolute text-danger p-0" 
                        style={{ top: '10px', right: '10px' }} 
                        onClick={() => {
                          const newItems = formData.items.filter((_, i) => i !== index);
                          const newTotal = newItems.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
                          setFormData(prev => ({ ...prev, items: newItems, totalAmount: newTotal.toString() }));
                        }}
                      >
                        <Trash2 size={18} />
                      </Button>
                    )}
                    <div className="row g-2">
                      <div className="col-12">
                        <Form.Label className="small fw-semibold mb-1">Item Name</Form.Label>
                        <Form.Control 
                          type="text" 
                          required 
                          placeholder="e.g. Visiting Cards with Matte Finish"
                          value={item.itemName} 
                          isInvalid={!!stepErrors[`item-${index}-itemName`]}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const newItems = [...prev.items];
                              newItems[index] = { ...newItems[index], itemName: val };
                              return { ...prev, items: newItems };
                            });
                          }} 
                          className="bg-light form-control-sm" 
                        />
                      </div>
                      <div className="col-md-6">
                        <Form.Label className="small fw-semibold mb-1">Quantity</Form.Label>
                        <Form.Control 
                          type="number" 
                          placeholder="1" 
                          required 
                          min="1"
                          value={item.totalQty} 
                          isInvalid={!!stepErrors[`item-${index}-totalQty`]}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const newItems = [...prev.items];
                              newItems[index] = { ...newItems[index], totalQty: val };
                              return { ...prev, items: newItems };
                            });
                          }} 
                          className="bg-light form-control-sm" 
                        />
                      </div>
                      <div className="col-md-6">
                        <Form.Label className="small fw-semibold mb-1">Price (₹)</Form.Label>
                        <Form.Control 
                          type="number" 
                          placeholder="0" 
                          required 
                          min="0"
                          value={item.price} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const newItems = [...prev.items];
                              newItems[index] = { ...newItems[index], price: val };
                              const newTotal = newItems.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
                              return { ...prev, items: newItems, totalAmount: newTotal.toString() };
                            });
                          }} 
                          className="bg-light form-control-sm" 
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="d-flex justify-content-end mb-2">
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={() => setFormData(prev => ({ ...prev, items: [...prev.items, { itemName: '', totalQty: '', price: '' }] }))}
                  >
                    <Plus size={16} className="me-1" /> Add Item
                  </Button>
                </div>
              </div>

              <div className="col-md-4">
                <Form.Label className="fw-semibold">Total Amount (₹) <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="number" 
                  placeholder="0" 
                  required 
                  min="0"
                  value={formData.totalAmount} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, totalAmount: val }));
                  }} 
                  className="bg-light fw-bold text-success fs-5" 
                />
              </div>

              <div className="col-md-4">
                <Form.Label className="fw-semibold">Printing Method / Vendor</Form.Label>
                <Form.Select 
                  value={formData.printingCompany} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, printingCompany: val }));
                  }} 
                  className="bg-light"
                >
                  <option value="">Select Printing Method</option>
                  {settings.printingCompanies && settings.printingCompanies.map(pc => (
                    <option key={pc} value={pc}>{pc}</option>
                  ))}
                </Form.Select>
              </div>

              <div className="col-md-4">
                <Form.Label className="fw-semibold">Design Image (Optional)</Form.Label>
                <Form.Control 
                  type="file" 
                  onChange={(e) => setFile(e.target.files[0])} 
                  accept="image/*" 
                  className="bg-white" 
                />
              </div>
            </div>
          )}

          {/* STEP 3: Payment & Summary */}
          {currentStep === 3 && (
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Label className="fw-semibold">Total Amount (₹) <span className="text-danger">*</span></Form.Label>
                <Form.Control 
                  type="number" 
                  placeholder="0" 
                  required 
                  value={formData.totalAmount} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, totalAmount: val }));
                  }} 
                  className="bg-light fw-bold text-success fs-5" 
                />
              </div>

              <div className="col-md-6 pt-md-4">
                <Form.Check 
                  type="switch" 
                  id="advance-switch" 
                  label="Advance Amount Received" 
                  checked={formData.advanceReceived} 
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => ({ ...prev, advanceReceived: checked }));
                  }} 
                  className="fw-semibold pt-2" 
                />
              </div>

              {formData.advanceReceived && (
                <>
                  <div className="col-md-6">
                    <Form.Label className="fw-semibold">Advance Amount (₹) <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="number" 
                      placeholder="0" 
                      required 
                      value={formData.advanceAmount} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, advanceAmount: val }));
                      }} 
                      className="bg-light" 
                    />
                  </div>
                  <div className="col-md-6">
                    <Form.Label className="fw-semibold">Payment Method <span className="text-danger">*</span></Form.Label>
                    <Form.Select 
                      required
                      value={formData.paymentMethod} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, paymentMethod: val }));
                      }} 
                      className="bg-light"
                    >
                      <option value="">Select Payment Method</option>
                      <option value="GPay">GPay</option>
                      <option value="B-Gpay">B-Gpay</option>
                      <option value="NEFT">NEFT</option>
                      <option value="KVB">KVB</option>
                      <option value="Dtdc Wallet">Dtdc Wallet</option>
                      <option value="Cash">Cash</option>
                      <option value="Discount Amount">Discount Amount</option>
                    </Form.Select>
                  </div>
                </>
              )}

              <div className="col-md-6">
                <Form.Label className="fw-semibold">Order Status</Form.Label>
                <Form.Select 
                  value={formData.status} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, status: val }));
                  }} 
                  className="bg-light"
                >
                  <option value="Pending">Pending</option>
                  {statusOptions.filter(opt => opt !== 'Pending').map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </Form.Select>
              </div>

              <div className="col-12">
                <Form.Label className="fw-semibold">Remarks (Notes - Staff Only)</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={2} 
                  placeholder="Internal notes not shown on invoice..." 
                  value={formData.remarks} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, remarks: val }));
                  }} 
                  className="bg-light" 
                />
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 px-4 pb-4 d-flex justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <Button variant="light" onClick={onHide} className="fw-medium text-secondary">
              Cancel
            </Button>
            {currentStep > 1 && (
              <Button 
                variant="outline-secondary" 
                type="button" 
                onClick={handlePrevStep} 
                className="fw-medium d-flex align-items-center gap-1 shadow-sm"
              >
                <ArrowLeft size={16} /> Previous Step
              </Button>
            )}
          </div>

          {currentStep < 3 ? (
            <Button 
              variant="primary" 
              type="button" 
              onClick={handleNextStep} 
              className="fw-medium px-4 d-flex align-items-center gap-1 shadow-sm"
            >
              Next Step <ArrowRight size={16} />
            </Button>
          ) : (
            <Button 
              variant="success" 
              type="submit" 
              className="fw-semibold px-4 d-flex align-items-center gap-1 shadow-sm" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Order'}
            </Button>
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default React.memo(CreateOrderModal);
