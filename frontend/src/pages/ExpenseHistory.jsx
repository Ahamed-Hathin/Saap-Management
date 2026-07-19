import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Table, Button, Card, Modal, Form } from 'react-bootstrap';
import api from '../services/api';
import Swal from 'sweetalert2';
import { useParams, useNavigate } from 'react-router-dom';

const ExpenseHistory = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [payFormData, setPayFormData] = useState({ amount: '', method: 'Cash' });
  const [showViewPaymentsModal, setShowViewPaymentsModal] = useState(false);
  const [viewPaymentsExpense, setViewPaymentsExpense] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, [name]);

  const fetchExpenses = async () => {
    try {
      const res = await api.get(`/expenses?name=${encodeURIComponent(name)}`);
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch expenses history', 'error');
    }
  };

  const handleOpenPayModal = (expense) => {
    setCurrentExpense(expense);
    setPayFormData({ amount: '', method: 'Cash' });
    setShowPayModal(true);
  };

  const handleViewPayments = (expense) => {
    setViewPaymentsExpense(expense);
    setShowViewPaymentsModal(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedBalancePayments = [...(currentExpense.balancePayments || []), payFormData];
      await api.put(`/expenses/${currentExpense._id}`, {
        balancePayments: updatedBalancePayments
      });
      Swal.fire('Success', 'Payment added successfully', 'success');
      setShowPayModal(false);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to add payment', 'error');
    }
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

  const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button variant="outline-secondary" className="me-3" onClick={() => navigate(-1)}>
            &larr; Back
          </Button>
          <h2 className="fw-bold mb-0 d-inline-block align-middle">History: {name}</h2>
        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <Card.Body className="bg-light d-flex justify-content-between align-items-center p-4">
          <h5 className="mb-0 text-muted fw-bold">Total Spent on {name}</h5>
          <h3 className="mb-0 fw-bold text-danger">₹{totalAmount.toLocaleString('en-IN')}</h3>
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Table responsive hover className="mb-0 align-middle">
          <thead className="bg-light">
            <tr>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Date</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Description</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Total</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Paid</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Balance</th>
              <th className="py-3 px-4 text-muted font-monospace text-uppercase" style={{fontSize: '0.85rem'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => {
              const paid = expense.balancePayments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
              const balance = expense.amount - paid;
              return (
                <tr key={expense._id}>
                  <td className="py-3 px-4 text-secondary">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{expense.description || '-'}</td>
                  <td className="py-3 px-4 fw-bold text-dark">₹{expense.amount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 fw-bold text-success">
                    {paid > 0 ? (
                      <span 
                        role="button" 
                        onClick={() => handleViewPayments(expense)}
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        title="Click to view payment details"
                      >
                        ₹{paid.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span>₹0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 fw-bold text-danger">₹{balance.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4">
                    {balance > 0.01 ? (
                      <Button variant="outline-success" size="sm" className="me-2" onClick={() => handleOpenPayModal(expense)}>
                        Pay Balance
                      </Button>
                    ) : (
                      <span className="badge bg-success me-2">Completed</span>
                    )}
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(expense._id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
            {expenses.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted">
                  No expenses found for this category.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      <Modal show={showPayModal} onHide={() => setShowPayModal(false)} centered backdrop="static">
        <Form onSubmit={handlePaySubmit}>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold">Pay Balance</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium text-secondary small">Amount</Form.Label>
              <Form.Control
                type="number"
                required
                min="0"
                value={payFormData.amount}
                onChange={(e) => setPayFormData({ ...payFormData, amount: e.target.value })}
                className="bg-light border-0 py-2 px-3 rounded-3"
                placeholder="0.00"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium text-secondary small">Method</Form.Label>
              <Form.Select
                value={payFormData.method}
                onChange={(e) => setPayFormData({ ...payFormData, method: e.target.value })}
                className="bg-light border-0 py-2 px-3 rounded-3"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowPayModal(false)} className="px-4 py-2 rounded-3 fw-medium">
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="px-4 py-2 rounded-3 fw-medium shadow-sm">
              Save Payment
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showViewPaymentsModal} onHide={() => setShowViewPaymentsModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Payment Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewPaymentsExpense?.balancePayments && viewPaymentsExpense.balancePayments.length > 0 ? (
            <Table responsive hover size="sm" className="align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="py-2 px-3 text-muted font-monospace text-uppercase" style={{fontSize: '0.8rem'}}>Date</th>
                  <th className="py-2 px-3 text-muted font-monospace text-uppercase" style={{fontSize: '0.8rem'}}>Method</th>
                  <th className="py-2 px-3 text-muted font-monospace text-uppercase text-end" style={{fontSize: '0.8rem'}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {viewPaymentsExpense.balancePayments.map((payment, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 text-secondary">{new Date(payment.date || viewPaymentsExpense.date).toLocaleDateString()}</td>
                    <td className="py-2 px-3 fw-medium">{payment.method}</td>
                    <td className="py-2 px-3 fw-bold text-success text-end">₹{(parseFloat(payment.amount) || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted">No payments recorded.</div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowViewPaymentsModal(false)} className="px-4 py-2 rounded-3 fw-medium">
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};

export default ExpenseHistory;
