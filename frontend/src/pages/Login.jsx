import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await login(username, password);
      if (userData.role === 'Admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/orders');
      }
    } catch (err) {
      setError(err);
    }
  };

  return (
    <Container fluid className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)' }}>
      <Row className="w-100">
        <Col md={{ span: 6, offset: 3 }} lg={{ span: 4, offset: 4 }}>
          <Card className="dashboard-card border-0 rounded-4 overflow-hidden">
            <div style={{ height: '6px', background: 'linear-gradient(90deg, #4f46e5, #818cf8)' }}></div>
            <Card.Body className="p-5">
              <div className="text-center mb-5">
                <h3 className="fw-bold text-dark mb-2 tracking-tight">Welcome Back</h3>
                <p className="text-muted">Sign in to your Saap account</p>
              </div>
              {error && <Alert variant="danger" className="border-0 bg-danger bg-opacity-10 text-danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Enter your username"
                    className="bg-light"
                  />
                </Form.Group>
                <Form.Group className="mb-5">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="bg-light"
                  />
                </Form.Group>
                <Button variant="primary" type="submit" className="w-100 py-3 fw-bold fs-6">
                  Sign In
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
