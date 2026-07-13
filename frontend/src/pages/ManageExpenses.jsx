import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Table, Button, Form, Modal, Card } from 'react-bootstrap';
import api from '../services/api';
import Swal from 'sweetalert2';

const ManageExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch expenses', 'error');
    }
  };

  const handleShow = () => {
    setFormData({ name: '', description: '', amount: '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/expenses/${id}`);
        fetchExpenses();
        Swal.fire('Deleted!', 'Expense has been deleted.', 'success');
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Failed to delete expense', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', formData);
      Swal.fire('Success', 'Expense added successfully', 'success');
      setShowModal(false);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Error saving expense', 'error');
    }
  };

  const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Manage Expenses</h2>
        <Button variant="primary" onClick={handleShow} className="px-4 py-2 rounded-3 fw-medium shadow-sm">
          + Add Expense
        </Button>
      </div>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <Card.Body className="bg-light d-flex justify-content-between align-items-center p-4">
          <h5 className="mb-0 text-muted fw-bold">Total Expenses</h5>
          <h3 className="mb-0 fw-bold text-danger">₹{totalAmount.toLocaleString('en-IN')}</h3>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Table responsive hover className="mb-0 align-middle">
          <thead className="bg-light">
            <tr>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Date</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Name</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Description</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Amount</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense._id}>
                <td className="py-3 px-4 text-secondary">{new Date(expense.date).toLocaleDateString()}</td>
                <td className="py-3 px-4 fw-bold">{expense.name}</td>
                <td className="py-3 px-4">{expense.description}</td>
                <td className="py-3 px-4 fw-bold text-danger">₹{expense.amount.toLocaleString('en-IN')}</td>
                <td className="py-3 px-4">
                  <Button variant="outline-danger" size="sm" onClick={() => handleDelete(expense._id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-5 text-muted">
                  No expenses found. Click "Add Expense" to record one.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold">Add Expense</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium text-secondary small">Expense Name</Form.Label>
              <Form.Control
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-light border-0 py-2 px-3 rounded-3"
                placeholder="e.g. Office Supplies"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium text-secondary small">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-light border-0 py-2 px-3 rounded-3"
                placeholder="Detailed description of the expense"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium text-secondary small">Amount</Form.Label>
              <Form.Control
                type="number"
                required
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="bg-light border-0 py-2 px-3 rounded-3"
                placeholder="0.00"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-3 fw-medium">
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="px-4 py-2 rounded-3 fw-medium shadow-sm">
              Save Expense
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ManageExpenses;
