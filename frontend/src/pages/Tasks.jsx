import React, { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import { Card, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { Plus, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';

const Tasks = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', assignedTo: '', dueDate: '' });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
      if (user?.role === 'Admin') {
        const res = await api.get('/users');
        const emps = res.data.filter(emp => emp.role !== 'Admin');
        setEmployees(emps);
      }
    } catch (error) {
      console.error('Error fetching tasks', error);
      Swal.fire('Error', 'Failed to fetch tasks', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/tasks', formData);
      setShowModal(false);
      setFormData({ title: '', description: '', assignedTo: '', dueDate: '' });
      fetchData();
      Swal.fire('Success', 'Task created successfully', 'success');
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to create task', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      fetchData();
    } catch (error) {
      Swal.fire('Error', 'Failed to update task status', 'error');
    }
  };

  const handleDelete = async (taskId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/tasks/${taskId}`);
        fetchData();
        Swal.fire('Deleted!', 'Task has been deleted.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to delete task', 'error');
      }
    }
  };

  const renderTaskTable = (taskList) => (
    <div className="table-responsive">
      <Table className="table-custom mb-0" size="sm">
        <thead>
          <tr style={{ letterSpacing: '1px', textTransform: 'uppercase' }}>
            <th>Title</th>
            <th>Description</th>
            <th>Date</th>
            <th>Status</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {taskList.map(task => (
            <tr key={task._id}>
              <td className="fw-medium">{task.title}</td>
              <td>{task.description || '-'}</td>
              <td>{task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '-'}</td>
              <td>
                <Badge bg={task.status === 'completed' ? 'success' : 'warning'} className="px-3 py-2 rounded-pill fw-medium d-flex align-items-center" style={{ width: 'fit-content' }}>
                  {task.status === 'completed' ? <CheckCircle size={14} className="me-1" /> : <Clock size={14} className="me-1" />}
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </Badge>
              </td>
              <td className="text-end">
                <div className="d-flex flex-column align-items-end gap-1">
                  <Button 
                    variant={task.status === 'pending' ? 'outline-success' : 'outline-warning'} 
                    size="sm" 
                    onClick={() => handleStatusChange(task._id, task.status)}
                    className="text-nowrap"
                  >
                    Mark {task.status === 'pending' ? 'Complete' : 'Pending'}
                  </Button>
                  {user?.role === 'Admin' && (
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(task._id)} className="text-nowrap">
                      Delete
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
        <div>
          <h2 className="mb-1 fw-bold">{user?.role === 'Admin' ? 'All Tasks' : 'My Tasks'}</h2>
          <p className="text-muted mb-0">Manage and track tasks efficiently.</p>
        </div>
        {user?.role === 'Admin' && (
          <Button variant="primary" onClick={() => setShowModal(true)} className="d-flex align-items-center shadow-sm">
            <Plus size={18} className="me-2" /> Assign New Task
          </Button>
        )}
      </div>

      {user?.role === 'Admin' ? (
        <div className="row g-4">
          {employees.map(emp => {
            const empTasks = tasks.filter(t => t.assignedTo?._id === emp._id || t.assignedTo === emp._id);
            return (
              <div className="col-lg-6" key={emp._id}>
                <Card className="dashboard-card border-0 h-100">
                  <Card.Header className="bg-white border-0 pt-4 pb-0">
                    <h5 className="fw-bold mb-0 text-primary">{emp.name}'s Tasks</h5>
                  </Card.Header>
                  <Card.Body>
                    {empTasks.length === 0 ? (
                      <div className="p-4 text-center text-muted">
                        <p className="mb-0">No tasks assigned.</p>
                      </div>
                    ) : (
                      renderTaskTable(empTasks)
                    )}
                  </Card.Body>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="dashboard-card border-0 mb-4">
          <Card.Body className="p-0">
            {tasks.length === 0 ? (
              <div className="p-5 text-center text-muted">
                <h5 className="fw-medium mb-3">No tasks found</h5>
                <p className="mb-0">There are currently no tasks assigned.</p>
              </div>
            ) : (
              renderTaskTable(tasks)
            )}
          </Card.Body>
        </Card>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Assign New Task</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Task Title *</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                required 
                placeholder="Enter task title"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="Enter task details"
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label className="fw-medium">Assign To *</Form.Label>
                  <Form.Select 
                    value={formData.assignedTo} 
                    onChange={(e) => setFormData({...formData, assignedTo: e.target.value})} 
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label className="fw-medium">Due Date</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={formData.dueDate} 
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="d-flex justify-content-end mt-4">
              <Button variant="light" className="me-2 px-4" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" type="submit" className="px-4" disabled={loading}>
                {loading ? 'Assigning...' : 'Assign Task'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Layout>
  );
};

export default Tasks;
