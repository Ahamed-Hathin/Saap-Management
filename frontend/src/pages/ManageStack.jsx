import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { Row, Col, Card, Button, Table, Modal, Form, Spinner } from 'react-bootstrap';
import { Package, Plus, Minus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';

const ManageStack = () => {
  const [stacks, setStacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    id: null,
    modelNumber: '',
    sizeA: '',
    sizeB: '',
    sizeC: '',
    totalStack: '',
    baseTotalStack: '',
    newStack: '',
    usedStack: ''
  });

  const fetchStacks = async () => {
    try {
      const { data } = await api.get('/stacks');
      setStacks(data);
    } catch (error) {
      console.error('Error fetching stacks:', error);
      Swal.fire('Error', 'Failed to load stock inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStacks();
  }, []);

  const handleShow = (stack = null) => {
    if (stack) {
      setFormData({
        id: stack._id,
        modelNumber: stack.modelNumber,
        sizeA: stack.sizeA,
        sizeB: stack.sizeB,
        sizeC: stack.sizeC,
        totalStack: stack.totalStack,
        baseTotalStack: stack.totalStack,
        newStack: '',
        usedStack: ''
      });
      setPreviewUrl(stack.image || null);
    } else {
      setFormData({
        id: null,
        modelNumber: '',
        sizeA: '',
        sizeB: '',
        sizeC: '',
        totalStack: '',
        baseTotalStack: '',
        newStack: '',
        usedStack: ''
      });
      setPreviewUrl(null);
    }
    setFile(null);
    setShowModal(true);
  };

  const handleStockMathChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    if (updatedData.baseTotalStack !== '') {
      const base = Number(updatedData.baseTotalStack) || 0;
      const add = Number(updatedData.newStack) || 0;
      const minus = Number(updatedData.usedStack) || 0;
      updatedData.totalStack = base + add - minus;
    }
    setFormData(updatedData);
  };

  const handleSizeChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let savedStack;
      
      const payload = {
        modelNumber: formData.modelNumber,
        sizeA: formData.sizeA !== '' ? Number(formData.sizeA) : 0,
        sizeB: formData.sizeB !== '' ? Number(formData.sizeB) : 0,
        sizeC: formData.sizeC !== '' ? Number(formData.sizeC) : 0,
        totalStack: formData.totalStack !== '' ? Number(formData.totalStack) : 0
      };

      if (formData.id) {
        const { data } = await api.put(`/stacks/${formData.id}`, payload);
        savedStack = data;
      } else {
        const { data } = await api.post('/stacks', payload);
        savedStack = data;
      }

      if (file) {
        try {
          const uploadData = new FormData();
          uploadData.append('image', file);
          await api.post(`/stacks/${savedStack._id}/upload`, uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          setShowModal(false);
          fetchStacks();
          Swal.fire('Warning', 'Stack details saved, but the image failed to upload (Network Timeout). You can edit the stack later to upload the image.', 'warning');
          return;
        }
      }

      setShowModal(false);
      fetchStacks();
      Swal.fire('Success', `Stack successfully ${formData.id ? 'updated' : 'added'}!`, 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Something went wrong', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/stacks/${id}`);
        fetchStacks();
        Swal.fire('Deleted!', 'Stack item has been deleted.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to delete stack', 'error');
      }
    }
  };

  const handleQuickStockAdjust = async (stack, type) => {
    const isAdding = type === 'add';
    const { value: quantity } = await Swal.fire({
      title: isAdding ? 'Add New Stack' : 'Use Stack',
      input: 'number',
      inputLabel: `Enter quantity to ${isAdding ? 'add to' : 'deduct from'} total stack`,
      inputPlaceholder: 'e.g. 10',
      showCancelButton: true,
      confirmButtonText: isAdding ? 'Add to Stack' : 'Deduct from Stack',
      confirmButtonColor: isAdding ? '#198754' : '#dc3545',
      inputValidator: (value) => {
        if (!value || value <= 0) {
          return 'Please enter a valid number greater than 0';
        }
      }
    });

    if (quantity) {
      try {
        const numQty = Number(quantity);
        const newTotal = isAdding ? stack.totalStack + numQty : stack.totalStack - numQty;
        
        const payload = {
          modelNumber: stack.modelNumber,
          sizeA: stack.sizeA,
          sizeB: stack.sizeB,
          sizeC: stack.sizeC,
          totalStack: newTotal
        };

        await api.put(`/stacks/${stack._id}`, payload);
        fetchStacks();
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: `Total stack has been ${isAdding ? 'increased' : 'decreased'} by ${numQty}.`,
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire('Error', 'Failed to update stock', 'error');
      }
    }
  };

  const viewImage = (imageUrl) => {
    if (!imageUrl) return;
    Swal.fire({
      imageUrl: imageUrl.startsWith('http') ? imageUrl : `${api.defaults.baseURL.replace('/api', '')}/${imageUrl.replace(/\\/g, '/')}`,
      imageAlt: 'Stack Image',
      showConfirmButton: false,
      showCloseButton: true,
      width: 'auto'
    });
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0 fw-bold text-dark d-flex align-items-center">
            <Package size={28} className="me-2 text-primary" />
            Manage Stack
          </h2>
          <p className="text-muted mb-0">Track and manage your inventory</p>
        </div>
        <Button variant="primary" onClick={() => handleShow()} className="d-flex align-items-center gap-2 fw-medium shadow-sm rounded-pill px-4">
          <Plus size={18} /> Add Stack
        </Button>
      </div>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : stacks.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <Package size={48} className="mb-3 text-light" />
              <h5>No items found in stack</h5>
              <p>Click "Add Stack" to get started.</p>
            </div>
          ) : (
            <Row xs={1} md={2} lg={3} xl={4} className="g-4 p-4">
              {stacks.map(stack => (
                <Col key={stack._id}>
                  <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden" style={{ transition: 'transform 0.2s' }}>
                    <div 
                      className="position-relative bg-light cursor-pointer" 
                      style={{ height: '200px', cursor: 'pointer' }}
                      onClick={() => viewImage(stack.image)}
                    >
                      {stack.image ? (
                        <div 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            backgroundImage: `url(${stack.image.startsWith('http') ? stack.image : `${api.defaults.baseURL.replace('/api', '')}/${stack.image.replace(/\\/g, '/')}`})`, 
                            backgroundSize: 'cover', 
                            backgroundPosition: 'center' 
                          }}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                          <ImageIcon size={48} opacity={0.5} />
                        </div>
                      )}
                      
                      <div className="position-absolute top-0 end-0 p-2 d-flex gap-2 bg-white bg-opacity-75 rounded-bottom-start shadow-sm">
                        <Button variant="light" size="sm" onClick={(e) => { e.stopPropagation(); handleShow(stack); }} className="text-primary rounded-circle" style={{ width: '32px', height: '32px', padding: 0 }}>
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="light" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(stack._id); }} className="text-danger rounded-circle" style={{ width: '32px', height: '32px', padding: 0 }}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    
                    <Card.Body className="d-flex flex-column p-4">
                      <h5 className="fw-bold text-dark mb-3">Model: {stack.modelNumber}</h5>
                      
                      <div className="mb-3 text-muted small bg-light rounded-3 p-2">
                        <div className="text-center fw-bold text-uppercase mb-2 text-dark opacity-75" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Sizes</div>
                        <div className="d-flex justify-content-between fw-medium">
                          <div className="text-center w-100 border-end border-light-subtle">
                            <div>A</div>
                            <div className="text-dark fs-6 mt-1">{stack.sizeA}</div>
                          </div>
                          <div className="text-center w-100 border-end border-light-subtle">
                            <div>B</div>
                            <div className="text-dark fs-6 mt-1">{stack.sizeB}</div>
                          </div>
                          <div className="text-center w-100">
                            <div>C</div>
                            <div className="text-dark fs-6 mt-1">{stack.sizeC}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-3 border-top d-flex flex-column gap-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-semibold text-muted text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Total Stack</span>
                          <span className="fw-bold fs-5 text-primary">{stack.totalStack}</span>
                        </div>
                        <div className="d-flex gap-2">
                          <Button 
                            variant="outline-success" 
                            size="sm" 
                            className="flex-grow-1 fw-semibold d-flex align-items-center justify-content-center gap-1"
                            onClick={() => handleQuickStockAdjust(stack, 'add')}
                          >
                            <Plus size={14} /> Add
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="flex-grow-1 fw-semibold d-flex align-items-center justify-content-center gap-1"
                            onClick={() => handleQuickStockAdjust(stack, 'use')}
                          >
                            <Minus size={14} /> Use
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold fs-4">{formData.id ? 'Edit Stack' : 'Add New Stack'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Model Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter model number"
                value={formData.modelNumber}
                onChange={(e) => setFormData({...formData, modelNumber: e.target.value})}
                className="px-3 py-2 fw-medium"
                style={{ borderRadius: '10px' }}
                required
              />
            </Form.Group>
            
            <Row className="mb-3 g-3">
              <Col sm={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Size A</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.sizeA}
                      onChange={(e) => handleSizeChange('sizeA', e.target.value)}
                      className="px-3 py-2 text-center fw-medium"
                      style={{ borderRadius: '10px' }}
                    />
                </Form.Group>
              </Col>
              <Col sm={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Size B</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.sizeB}
                      onChange={(e) => handleSizeChange('sizeB', e.target.value)}
                      className="px-3 py-2 text-center fw-medium"
                      style={{ borderRadius: '10px' }}
                    />
                </Form.Group>
              </Col>
              <Col sm={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Size C</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.sizeC}
                      onChange={(e) => handleSizeChange('sizeC', e.target.value)}
                      className="px-3 py-2 text-center fw-medium"
                      style={{ borderRadius: '10px' }}
                    />
                </Form.Group>
              </Col>
            </Row>

            {formData.id && (
              <Row className="mb-3 g-3">
                <Col sm={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-success">Add New Stack</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={formData.newStack}
                      onChange={(e) => handleStockMathChange('newStack', e.target.value)}
                      placeholder="+ Add quantity"
                      className="px-3 py-2 text-success fw-medium"
                      style={{ borderRadius: '10px' }}
                    />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-danger">Used Stack</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={formData.usedStack}
                      onChange={(e) => handleStockMathChange('usedStack', e.target.value)}
                      placeholder="- Deduct quantity"
                      className="px-3 py-2 text-danger fw-medium"
                      style={{ borderRadius: '10px' }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Total Stack</Form.Label>
              <Form.Control
                type="number"
                value={formData.totalStack}
                onChange={(e) => setFormData({...formData, totalStack: e.target.value, baseTotalStack: e.target.value})}
                placeholder="Enter total stack manually"
                className="px-3 py-2 fw-bold text-primary placeholder-opacity-50"
                style={{ borderRadius: '10px' }}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Product Image</Form.Label>
              
              <div 
                className="border-dashed rounded-3 p-4 text-center mb-2" 
                style={{ 
                  border: '2px dashed #cbd5e1', 
                  backgroundColor: '#f8fafc',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <div style={{ position: 'relative' }}>
                    <img src={previewUrl} alt="Preview" style={{ maxHeight: '150px', maxWidth: '100%', objectFit: 'contain' }} />
                    <div className="mt-2 text-primary fw-medium" style={{ fontSize: '0.85rem' }}>Click to change image</div>
                  </div>
                ) : (
                  <div>
                    <ImageIcon size={32} className="text-muted mb-2" />
                    <p className="mb-0 text-muted fw-medium">Click to upload image</p>
                    <p className="text-muted small mb-0 mt-1">JPEG, PNG up to 5MB</p>
                  </div>
                )}
              </div>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="light" onClick={() => setShowModal(false)} className="px-4 fw-medium rounded-pill">
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="px-4 fw-medium rounded-pill shadow-sm">
                {formData.id ? 'Save Changes' : 'Add Stack'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Layout>
  );
};

export default ManageStack;
