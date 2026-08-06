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
    sizeA_cm: '',
    sizeA_stock: '',
    sizeB_cm: '',
    sizeB_stock: '',
    sizeC_cm: '',
    sizeC_stock: '',
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
        sizeA_cm: stack.sizes?.[0]?.name || '',
        sizeA_stock: stack.sizes?.[0]?.quantity || 0,
        sizeB_cm: stack.sizes?.[1]?.name || '',
        sizeB_stock: stack.sizes?.[1]?.quantity || 0,
        sizeC_cm: stack.sizes?.[2]?.name || '',
        sizeC_stock: stack.sizes?.[2]?.quantity || 0,
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
        sizeA_cm: '',
        sizeA_stock: '',
        sizeB_cm: '',
        sizeB_stock: '',
        sizeC_cm: '',
        sizeC_stock: '',
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
    const updatedData = { ...formData, [field]: value };
    const a = Number(updatedData.sizeA_stock) || 0;
    const b = Number(updatedData.sizeB_stock) || 0;
    const c = Number(updatedData.sizeC_stock) || 0;
    updatedData.totalStack = a + b + c;
    updatedData.baseTotalStack = a + b + c;
    setFormData(updatedData);
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
        sizes: [
          { name: formData.sizeA_cm || 'A', quantity: formData.sizeA_stock !== '' ? Number(formData.sizeA_stock) : 0 },
          { name: formData.sizeB_cm || 'B', quantity: formData.sizeB_stock !== '' ? Number(formData.sizeB_stock) : 0 },
          { name: formData.sizeC_cm || 'C', quantity: formData.sizeC_stock !== '' ? Number(formData.sizeC_stock) : 0 }
        ],
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

  const handleQuickStockAdjust = async (stack, index, type) => {
    const isAdding = type === 'add';
    const sizeName = stack.sizes?.[index]?.name || `Size ${index + 1}`;
    const { value: qty } = await Swal.fire({
      title: isAdding ? `Add ${sizeName}` : `Use ${sizeName}`,
      input: 'number',
      inputLabel: `Quantity to ${isAdding ? 'add' : 'deduct'}`,
      inputPlaceholder: 'e.g. 10',
      showCancelButton: true,
      confirmButtonText: isAdding ? 'Add' : 'Deduct',
      confirmButtonColor: isAdding ? '#198754' : '#dc3545',
      inputValidator: (value) => {
        if (!value || value <= 0) {
          return 'Please enter a valid quantity';
        }
      }
    });

    if (qty) {
      try {
        const numQty = Number(qty);

        // Ensure we always have 3 size elements to prevent out-of-bounds errors on older database entries
        const updatedSizes = [0, 1, 2].map(i => ({
          name: stack.sizes?.[i]?.name || ['A', 'B', 'C'][i],
          quantity: Number(stack.sizes?.[i]?.quantity) || 0
        }));

        const currentQty = updatedSizes[index].quantity;

        if (isAdding) {
          updatedSizes[index].quantity = currentQty + numQty;
        } else {
          updatedSizes[index].quantity = Math.max(0, currentQty - numQty);
        }

        const totalStack = updatedSizes.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

        const payload = {
          modelNumber: stack.modelNumber,
          sizes: updatedSizes,
          totalStack
        };

        await api.put(`/stacks/${stack._id}`, payload);
        fetchStacks();
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: `${sizeName} has been ${isAdding ? 'increased' : 'decreased'} by ${numQty}.`,
          timer: 1500,
          showConfirmButton: false
        });
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Failed to update stock', 'error');
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
      width: '600px',
      imageWidth: 500,
      imageHeight: 'auto'
    });
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0 fw-bold text-dark d-flex align-items-center">
            <Package size={28} className="me-2 text-primary" />
            Manage Stock
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
            <Row xs={1} md={2} lg={3} className="g-4 p-4">
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

                      <div className="mt-auto">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <span className="text-muted fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>INVENTORY</span>
                          <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 border border-primary border-opacity-25 shadow-sm">
                            {stack.totalStack} Total
                          </span>
                        </div>
                        <div className="row g-2">
                          {[0, 1, 2].map((idx) => {
                            const sizeName = stack.sizes?.[idx]?.name || ['A', 'B', 'C'][idx];
                            const quantity = stack.sizes?.[idx]?.quantity || 0;
                            return (
                              <div className="col-4" key={idx}>
                                <div className="bg-light rounded-3 p-2 text-center border border-light-subtle h-100 d-flex flex-column shadow-sm transition-all hover-shadow">
                                  <div className="text-muted fw-bold mb-1 text-truncate" style={{ fontSize: '0.75rem' }} title={sizeName}>
                                    {sizeName}
                                  </div>
                                  <div className="fs-5 fw-black text-dark mb-2 lh-1">{quantity}</div>
                                  <div className="d-flex justify-content-between align-items-center mt-auto bg-white rounded-pill border overflow-hidden">
                                    <button
                                      className="btn btn-sm btn-link text-danger p-1 text-decoration-none flex-grow-1"
                                      onClick={() => handleQuickStockAdjust(stack, idx, 'use')}
                                      style={{ transition: 'background-color 0.2s' }}
                                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ffeef0'}
                                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      <Minus size={14} strokeWidth={3} />
                                    </button>
                                    <div style={{ width: '1px', backgroundColor: '#e2e8f0', height: '100%' }}></div>
                                    <button
                                      className="btn btn-sm btn-link text-success p-1 text-decoration-none flex-grow-1"
                                      onClick={() => handleQuickStockAdjust(stack, idx, 'add')}
                                      style={{ transition: 'background-color 0.2s' }}
                                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e6ffec'}
                                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      <Plus size={14} strokeWidth={3} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
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
                onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                className="px-3 py-2 fw-medium"
                style={{ borderRadius: '10px' }}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Size A Details</Form.Label>
              <Row>
                <Col>
                  <Form.Control
                    type="text"
                    placeholder="Size (cm)"
                    value={formData.sizeA_cm}
                    onChange={(e) => handleSizeChange('sizeA_cm', e.target.value)}
                    className="px-3 py-2 fw-medium"
                    style={{ borderRadius: '10px' }}
                  />
                </Col>
                <Col>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="Stock"
                    value={formData.sizeA_stock}
                    onChange={(e) => handleSizeChange('sizeA_stock', e.target.value)}
                    className="px-3 py-2 fw-medium"
                    style={{ borderRadius: '10px' }}
                  />
                </Col>
              </Row>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Size B Details</Form.Label>
              <Row>
                <Col>
                  <Form.Control
                    type="text"
                    placeholder="Size (cm)"
                    value={formData.sizeB_cm}
                    onChange={(e) => handleSizeChange('sizeB_cm', e.target.value)}
                    className="px-3 py-2 fw-medium"
                    style={{ borderRadius: '10px' }}
                  />
                </Col>
                <Col>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="Stock"
                    value={formData.sizeB_stock}
                    onChange={(e) => handleSizeChange('sizeB_stock', e.target.value)}
                    className="px-3 py-2 fw-medium"
                    style={{ borderRadius: '10px' }}
                  />
                </Col>
              </Row>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Size C Details</Form.Label>
              <Row>
                <Col>
                  <Form.Control
                    type="text"
                    placeholder="Size (cm)"
                    value={formData.sizeC_cm}
                    onChange={(e) => handleSizeChange('sizeC_cm', e.target.value)}
                    className="px-3 py-2 fw-medium"
                    style={{ borderRadius: '10px' }}
                  />
                </Col>
                <Col>
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="Stock"
                    value={formData.sizeC_stock}
                    onChange={(e) => handleSizeChange('sizeC_stock', e.target.value)}
                    className="px-3 py-2 fw-medium"
                    style={{ borderRadius: '10px' }}
                  />
                </Col>
              </Row>
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
