import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Table, Button, Form, Modal, Card } from 'react-bootstrap';
import api from '../services/api';
import Swal from 'sweetalert2';

const ManageClients = () => {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    username: '',
    clientName: '',
    mobileNumber: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch clients', 'error');
    }
  };

  const handleShow = () => {
    setEditMode(false);
    setFormData({ _id: '', username: '', clientName: '', mobileNumber: '' });
    setShowModal(true);
  };

  const handleEdit = (client) => {
    setEditMode(true);
    setFormData(client);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await api.delete(`/clients/${id}`);
        fetchClients();
        Swal.fire('Deleted!', 'Client has been deleted.', 'success');
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Failed to delete client', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/clients/${formData._id}`, formData);
        Swal.fire('Success', 'Client updated successfully', 'success');
      } else {
        await api.post('/clients', formData);
        Swal.fire('Success', 'Client added successfully', 'success');
      }
      setShowModal(false);
      fetchClients();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Error saving client', 'error');
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Manage Permanent Clients</h2>
        <Button variant="primary" onClick={handleShow} className="px-4 py-2 rounded-3 fw-medium shadow-sm">
          + Add Client
        </Button>
      </div>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Table responsive hover className="mb-0 align-middle">
          <thead className="bg-light">
            <tr>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Username</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Client Name</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Mobile Number</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client._id}>
                <td className="py-3 px-4 fw-bold">
                  <Link to={`/clients/${client._id}`} className="text-decoration-none text-primary">
                    {client.username}
                  </Link>
                </td>
                <td className="py-3 px-4 fw-medium">{client.clientName}</td>
                <td className="py-3 px-4 text-secondary">{client.mobileNumber}</td>
                <td className="py-3 px-4">
                  <Link to={`/clients/${client._id}`} className="btn btn-outline-primary btn-sm me-2">
                    View Details
                  </Link>
                  <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => handleEdit(client)}>
                    Edit
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => handleDelete(client._id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-5 text-muted">
                  No permanent clients found. Click "Add Client" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold">{editMode ? 'Edit Client' : 'Add Permanent Client'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium text-secondary small">Username (Unique Shortcode)</Form.Label>
              <Form.Control
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                className="bg-light border-0 py-2 px-3 rounded-3"
                placeholder="e.g. john123"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium text-secondary small">Client Name</Form.Label>
              <Form.Control
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value ? e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase()) : '' })}
                className="bg-light border-0 py-2 px-3 rounded-3"
                placeholder="Full Name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium text-secondary small">Mobile Number</Form.Label>
              <Form.Control
                type="text"
                required
                minLength={11}
                maxLength={11}
                pattern="\d{5} \d{5}"
                title="Mobile number must be exactly 10 digits with a space after the first 5"
                value={formData.mobileNumber}
                onChange={(e) => { const rawValue = e.target.value.replace(/\D/g, '').slice(0, 10); const formattedValue = rawValue.length > 5 ? `${rawValue.slice(0, 5)} ${rawValue.slice(5)}` : rawValue; setFormData({ ...formData, mobileNumber: formattedValue }); }}
                className="bg-light border-0 py-2 px-3 rounded-3"
                placeholder="12345 67890"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-3 fw-medium">
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="px-4 py-2 rounded-3 fw-medium shadow-sm">
              {editMode ? 'Update Client' : 'Save Client'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ManageClients;
