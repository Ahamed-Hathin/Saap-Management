import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Table, Button, Form, Modal, Card } from 'react-bootstrap';
import api from '../services/api';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const ManageExpenses = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    balancePayments: [{ amount: '', method: 'Cash' }],
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [payFormData, setPayFormData] = useState({ amount: '', method: 'Cash' });
  const [showViewPaymentsModal, setShowViewPaymentsModal] = useState(false);
  const [viewPaymentsExpense, setViewPaymentsExpense] = useState(null);

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
    setFormData({ name: '', description: '', amount: '', balancePayments: [{ amount: '', method: 'Cash' }] });
    setShowModal(true);
  };

  const handleAddSplit = () => {
    setFormData({
      ...formData,
      balancePayments: [...formData.balancePayments, { amount: '', method: 'Cash' }]
    });
  };

  const handlePaymentChange = (index, field, value) => {
    const updatedPayments = [...formData.balancePayments];
    updatedPayments[index][field] = value;
    setFormData({ ...formData, balancePayments: updatedPayments });
  };

  const handleRemoveSplit = (index) => {
    const updatedPayments = formData.balancePayments.filter((_, i) => i !== index);
    setFormData({ ...formData, balancePayments: updatedPayments });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const validPayments = formData.balancePayments.filter(p => p.amount !== '' && parseFloat(p.amount) > 0);
      const dataToSubmit = { ...formData, balancePayments: validPayments };
      
      await api.post('/expenses', dataToSubmit);
      Swal.fire('Success', 'Expense added successfully', 'success');
      setShowModal(false);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Error saving expense', 'error');
    }
  };

  const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  const currentTotalPaid = formData.balancePayments.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const currentBalanceAmount = (parseFloat(formData.amount) || 0) - currentTotalPaid;

  const uniqueExpenseNames = [...new Set(expenses.map(e => e.name))];

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
                  <td className="py-3 px-4 fw-bold">
                    <span 
                      role="button" 
                      onClick={() => navigate(`/admin/expenses/history/${encodeURIComponent(expense.name)}`)}
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      className="text-primary"
                      title="View Expense History"
                    >
                      {expense.name}
                    </span>
                  </td>
                  <td className="py-3 px-4">{expense.description}</td>
                  <td className="py-3 px-4 fw-bold text-dark">₹{expense.amount.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 fw-bold text-success">
                    {paid > 0 ? (
                      <span 
                        role="button" 
                        className="" 
                        onClick={() => handleViewPayments(expense)}
                        style={{ cursor: 'pointer' }}
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
                      <Button variant="outline-success" size="sm" className="me-2" style={{ width: '85px' }} onClick={() => handleOpenPayModal(expense)}>
                        Pay
                      </Button>
                    ) : (
                      <span className="btn btn-success btn-sm me-2 fw-medium" style={{ width: '90px', cursor: 'default', pointerEvents: 'none' }}>Completed</span>
                    )}
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(expense._id)} style={{ width: '90px' }}>
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
            {expenses.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-5 text-muted">
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
            <Form.Group className="mb-3 position-relative">
              <Form.Label className="fw-medium text-secondary small">Expense Name</Form.Label>
              <Form.Control
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value ? e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase()) : '' });
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="bg-light border-0 py-2 px-3 rounded-3"
                placeholder="e.g. Office Supplies"
              />
              {showSuggestions && uniqueExpenseNames.filter(name => name.toLowerCase().includes(formData.name.toLowerCase())).length > 0 && (
                <div 
                  className="position-absolute w-100 bg-white border rounded-3 shadow-sm mt-1" 
                  style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}
                >
                  {uniqueExpenseNames
                    .filter(name => name.toLowerCase().includes(formData.name.toLowerCase()))
                    .map((name, index, arr) => (
                      <div
                        key={index}
                        className="px-3 py-2 text-dark"
                        style={{ 
                          cursor: 'pointer', 
                          borderBottom: index === arr.length - 1 ? 'none' : '1px solid #f0f0f0',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFormData({ ...formData, name });
                          setShowSuggestions(false);
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        {name}
                      </div>
                  ))}
                </div>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium text-secondary small">Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value ? e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase()) : '' })}
                className="bg-light border-0 py-2 px-3 rounded-3"
                placeholder="Detailed description of the expense"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium text-secondary small">Total Amount</Form.Label>
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
            
            <div className="mb-3">
              <Form.Label className="fw-bold text-dark small mb-2">Pay</Form.Label>
              {formData.balancePayments.map((payment, index) => (
                <div key={index} className="d-flex gap-2 mb-2 align-items-center">
                  <Form.Control
                    type="number"
                    min="0"
                    placeholder="Amount"
                    value={payment.amount}
                    onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                    className="bg-light border-0 py-2 px-3 rounded-3"
                    style={{ flex: 1 }}
                  />
                  <Form.Select
                    value={payment.method}
                    onChange={(e) => handlePaymentChange(index, 'method', e.target.value)}
                    className="bg-light border-0 py-2 px-3 rounded-3"
                    style={{ flex: 1 }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </Form.Select>
                  {index > 0 && (
                    <Button variant="outline-danger" className="px-2" onClick={() => handleRemoveSplit(index)}>
                      &times;
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline-primary" size="sm" onClick={handleAddSplit} className="mt-1">
                + Add Payment Split
              </Button>
            </div>
            
            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 mt-3">
              <span className="fw-medium text-secondary">Balance Remaining:</span>
              <span className={`fw-bold fs-5 ${currentBalanceAmount > 0 ? 'text-danger' : 'text-success'}`}>
                ₹{currentBalanceAmount.toLocaleString('en-IN')}
              </span>
            </div>
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

export default ManageExpenses;
