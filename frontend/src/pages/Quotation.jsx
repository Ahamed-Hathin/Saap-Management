import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { Form, Button, Row, Col, Table, Modal } from 'react-bootstrap';
import { Plus, Trash2, FileText, Download, Edit, Trash, CheckCircle } from 'lucide-react';
import api from '../services/api';
import html2canvas from 'html2canvas';
import sappLogo from '../assets/Sapp Logo.jpg.jpeg';
import signatureImg from '../assets/Sign.png';
const Quotation = () => {
  const [quotations, setQuotations] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    toAddress: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    items: [
      { id: 1, description: '', qtyPerItem: '', totalQuantity: '', price: '' }
    ]
  });

  // Reference for the hidden print area
  const previewRef = useRef(null);
  const [downloadQuotation, setDownloadQuotation] = useState(null);

  useEffect(() => {
    fetchQuotations();
  }, []);

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
    setFormData({
      toAddress: '',
      title: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ id: Date.now(), description: '', qtyPerItem: '', totalQuantity: '', price: '' }]
    });
  };

  const handleShow = () => setShowModal(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id || item._id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'qtyPerItem' || field === 'totalQuantity') {
            const qty = Number(updatedItem.totalQuantity) || 0;
            const pricePerQty = Number(updatedItem.qtyPerItem) || 0;
            updatedItem.price = (qty * pricePerQty) || '';
          }
          return updatedItem;
        }
        return item;
      })
    }));
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
    try {
      const totalAmount = formData.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
      const payload = { ...formData, totalAmount };

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
    }
  };

  const handleEdit = (q) => {
    setFormData({
      toAddress: q.toAddress,
      title: q.title,
      date: new Date(q.date).toISOString().split('T')[0],
      items: q.items.map(i => ({ ...i, id: i._id || Date.now() }))
    });
    setEditingId(q._id);
    handleShow();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await api.delete(`/quotations/${id}`);
        fetchQuotations();
      } catch (err) {
        console.error('Error deleting quotation:', err);
        alert('Failed to delete quotation');
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

  const executeDownload = async (q) => {
    // Temporarily set the download quotation state to render it in the hidden ref
    setDownloadQuotation(q);
    
    // Give it a brief moment to render the DOM
    setTimeout(async () => {
      if (previewRef.current) {
        try {
          const canvas = await html2canvas(previewRef.current, {
            scale: 2,
            useCORS: true,
            logging: false
          });
          const image = canvas.toDataURL('image/png', 1.0);
          const link = document.createElement('a');
          link.download = `Quotation_${q.title || 'Draft'}.png`;
          link.href = image;
          link.click();
        } catch (error) {
          console.error("Error generating image:", error);
          alert("Failed to generate quotation image.");
        } finally {
          setDownloadQuotation(null);
        }
      }
    }, 100);
  };

  const filteredQuotations = quotations.filter(q => {
    if (filter === 'done') return q.isDone;
    if (filter === 'pending') return !q.isDone;
    return true;
  });

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0 fw-bold">Quotations</h2>
          <p className="text-muted mb-0">Manage and download your quotations</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex gap-2">
            <Button 
              variant={filter === 'all' ? "primary" : "outline-primary"} 
              size="sm" 
              onClick={() => setFilter('all')}
              className="px-3"
            >
              All
            </Button>
            <Button 
              variant={filter === 'done' ? "primary" : "outline-primary"} 
              size="sm" 
              onClick={() => setFilter('done')}
              className="px-3"
            >
              Selected
            </Button>
            <Button 
              variant={filter === 'pending' ? "primary" : "outline-primary"} 
              size="sm" 
              onClick={() => setFilter('pending')}
              className="px-3"
            >
              Not Selected
            </Button>
          </div>
          <div className="vr d-none d-md-block mx-1"></div>
          <Button variant="primary" onClick={handleShow} className="d-flex align-items-center">
            <FileText size={18} className="me-2" /> Create Quotation
          </Button>
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
              <div className="bg-white rounded shadow-sm border p-4 h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="fw-bold text-truncate mb-0" style={{ maxWidth: '70%' }} title={q.title}>{q.title || 'Untitled'}</h5>
                  <span className="badge bg-light text-dark border">
                    {new Date(q.date).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="mb-3 flex-grow-1">
                  <small className="text-muted d-block mb-1">To</small>
                  <p className="text-truncate mb-0" title={q.toAddress}>{q.toAddress || 'N/A'}</p>
                </div>
                
                <div className="mb-4">
                  <small className="text-muted d-block mb-1">Total Amount</small>
                  <h4 className="text-success fw-bold mb-0">₹{q.totalAmount?.toLocaleString() || 0}</h4>
                </div>
                
                <div className="d-flex justify-content-between border-top pt-3">
                  <div>
                    <Button 
                      variant={q.isDone ? "success" : "outline-success"} 
                      size="sm" 
                      onClick={() => handleToggleDone(q)} 
                      title={q.isDone ? "Mark as Pending" : "Mark as Done"}
                    >
                      <CheckCircle size={16} />
                    </Button>
                  </div>
                  <div className="d-flex gap-2">
                    <Button variant="outline-primary" size="sm" onClick={() => executeDownload(q)} title="Download">
                      <Download size={16} />
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => handleEdit(q)} title="Edit">
                      <Edit size={16} />
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(q._id)} title="Delete">
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

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
                    placeholder="e.g. Website Design Project"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label>To (Recipient Address)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                name="toAddress" 
                value={formData.toAddress} 
                onChange={handleInputChange}
                placeholder="Recipient Name&#10;Address Details"
              />
            </Form.Group>

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
                    onChange={(e) => handleItemChange(item.id || item._id, 'description', e.target.value)}
                  />
                </Form.Group>
                <Row>
                  <Col md={4} className="mb-2 mb-md-0">
                    <Form.Group>
                      <Form.Label className="small text-dark fw-medium mb-1">Price per quantity</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Price per quantity" 
                        value={item.qtyPerItem}
                        onChange={(e) => handleItemChange(item.id || item._id, 'qtyPerItem', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} className="mb-2 mb-md-0">
                    <Form.Group>
                      <Form.Label className="small text-dark fw-medium mb-1">Total Qty</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Total Qty" 
                        value={item.totalQuantity}
                        onChange={(e) => handleItemChange(item.id || item._id, 'totalQuantity', e.target.value)}
                      />
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
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Quotation
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Hidden Download Container */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ color: '#151965', fontStyle: 'italic', fontWeight: 'bold', fontFamily: '"Brush Script MT", cursive', fontSize: '16px', paddingTop: '10px' }}>
                Prop. Praveen kumar
              </div>
              <div style={{ textAlign: 'center' }}>
                <img src={sappLogo} alt="SAPP Creation Logo" style={{ maxWidth: '300px', maxHeight: '100px', objectFit: 'contain' }} />
                <div style={{ fontSize: '11px', color: '#151965', marginTop: '2px', maxWidth: '400px', lineHeight: '1.2' }}>
                  Wedding Invitation, Multicolor Designing, Visiting Card, Id Cards, Non Woven Bags & Offset Printing, Notice, Bookwork, Flex, & Calender, .
                </div>
              </div>
              <div style={{ color: '#151965', fontSize: '14px', fontWeight: 'bold', textAlign: 'right', fontFamily: 'Arial, sans-serif', paddingTop: '10px' }}>
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
                <div style={{ width: '8%', textAlign: 'right', paddingRight: '15px' }}>S.No</div>
                <div style={{ width: '57%' }}>Title</div>
                <div style={{ width: '15%', textAlign: 'center' }}>Quantity</div>
                <div style={{ width: '20%', textAlign: 'left' }}>Price</div>
              </div>

              {downloadQuotation.items.map((item, index) => (
                <div key={item._id || index} style={{ display: 'flex', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a' }}>
                  <div style={{ width: '8%', textAlign: 'right', paddingRight: '15px' }}>{index + 1}.</div>
                  <div style={{ width: '57%', whiteSpace: 'pre-wrap' }}>{item.description}</div>
                  <div style={{ width: '15%', textAlign: 'center' }}>{item.qtyPerItem || item.totalQuantity || '1'} Qty</div>
                  <div style={{ width: '20%', textAlign: 'left' }}>- {item.price ? `${item.price}/-` : ''}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', lineHeight: '1.4', color: '#1a1a1a' }}>
                  <div>Name: Thangamani V</div>
                  <div>Acc No.: 1266155000013220</div>
                  <div>IFSC Code: KVBL00012660</div>
                  <div>Karur Vysya Bank</div>
                </div>
                <div style={{ color: '#151965', marginTop: '25px', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
                  <div style={{ fontWeight: 'bold' }}>Terms & Conditions:</div>
                  <div style={{ fontWeight: 'bold' }}>Payment Immediately</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: '10px' }}>
                <div style={{ color: '#151965', fontSize: '14px', fontFamily: 'Arial, sans-serif' }}>Your's Trully</div>
                <img src={signatureImg} alt="Signature" style={{ maxHeight: '60px', objectFit: 'contain', margin: '5px 0' }} />
                <div style={{ color: '#151965', fontWeight: '900', fontSize: '18px', fontFamily: 'Arial Black, Impact, sans-serif' }}>Sapp Creation</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default Quotation;
