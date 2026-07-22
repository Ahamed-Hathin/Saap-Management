import React, { useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Navbar, Nav, Button, Modal } from 'react-bootstrap';
import { LayoutDashboard, Users, ShoppingCart, LogOut, Settings, ClipboardList, UserCheck, Receipt } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (user?.role === 'Employee') {
      const fetchEmployees = async () => {
        try {
          const res = await api.get('/users');
          const otherEmployees = res.data.filter(emp => emp._id !== user._id && emp.role !== 'Admin');
          setEmployees(otherEmployees);
        } catch (error) {
          console.error('Error fetching employees', error);
        }
      };
      fetchEmployees();
    }
  }, [user]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  return (
    <Container fluid className="p-0">
      <Row className="g-0">
        <Col md={2} className="sidebar p-4 d-none d-md-block">
          <h4 className="brand mb-5">SAPP Creation</h4>
          <Nav className="flex-column">
            {user?.role === 'Admin' ? (
              <>
                <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <LayoutDashboard className="me-3" size={20} /> Dashboard
                </NavLink>
                <NavLink to="/admin/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <ShoppingCart className="me-3" size={20} /> Orders
                </NavLink>
                <NavLink to="/admin/employees" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Users className="me-3" size={20} /> Employees
                </NavLink>
                <NavLink to="/admin/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <ClipboardList className="me-3" size={20} /> Tasks
                </NavLink>
                <NavLink to="/clients" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <UserCheck className="me-3" size={20} /> Clients
                </NavLink>
                <NavLink to="/admin/expenses" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Receipt className="me-3" size={20} /> Expenses
                </NavLink>
                <NavLink to="/admin/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Settings className="me-3" size={20} /> Settings
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/employee/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <ShoppingCart className="me-3" size={20} /> My Orders
                </NavLink>
                {employees.map(emp => (
                  <NavLink key={emp._id} to={`/employee/user/${emp._id}`} state={{ employeeName: emp.name }} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Users className="me-3" size={20} /> {emp.name}
                  </NavLink>
                ))}
                <NavLink to="/employee/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <ClipboardList className="me-3" size={20} /> Tasks
                </NavLink>
                {user?.name?.toLowerCase() !== 'staff 2' && (
                  <NavLink to="/clients" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <UserCheck className="me-3" size={20} /> Clients
                  </NavLink>
                )}
                <NavLink to="/employee/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Settings className="me-3" size={20} /> Settings
                </NavLink>
              </>
            )}
          </Nav>
        </Col>
        <Col md={10} className="d-flex flex-column vh-100">
          <Navbar className="glass-navbar px-4 py-3 d-md-none sticky-top d-flex justify-content-between align-items-center">
            <Navbar.Brand className="brand fw-bold m-0">SAPP Creation</Navbar.Brand>
            <div className="d-flex gap-3 align-items-center">
              {user?.role === 'Admin' ? (
                <>
                  <NavLink to="/admin/tasks" className={({ isActive }) => `text-decoration-none ${isActive ? 'text-primary' : 'text-muted'}`}>
                    <ClipboardList size={22} />
                  </NavLink>
                  <NavLink to="/admin/expenses" className={({ isActive }) => `text-decoration-none ${isActive ? 'text-primary' : 'text-muted'}`}>
                    <Receipt size={22} />
                  </NavLink>
                </>
              ) : (
                <NavLink to="/employee/tasks" className={({ isActive }) => `text-decoration-none ${isActive ? 'text-primary' : 'text-muted'}`}>
                  <ClipboardList size={22} />
                </NavLink>
              )}
            </div>
          </Navbar>
          <div className="p-3 p-md-5 flex-grow-1 overflow-auto fade-in pb-5" style={{ backgroundColor: 'var(--bg-color)', paddingBottom: '80px' }}>
            {children}
          </div>
          
          {/* Mobile Bottom Navigation */}
          <div className="d-md-none fixed-bottom bg-white border-top shadow-lg d-flex justify-content-around py-2" style={{ zIndex: 1050 }}>
            {user?.role === 'Admin' ? (
              <>
                <NavLink to="/admin/dashboard" className={({ isActive }) => `text-center text-decoration-none ${isActive ? 'text-primary' : 'text-muted'}`}>
                  <LayoutDashboard size={24} className="d-block mx-auto mb-1" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Home</span>
                </NavLink>
                <NavLink to="/admin/orders" className={({ isActive }) => `text-center text-decoration-none ${isActive ? 'text-primary' : 'text-muted'}`}>
                  <ShoppingCart size={24} className="d-block mx-auto mb-1" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Orders</span>
                </NavLink>
                <NavLink to="/clients" className={({ isActive }) => `text-center text-decoration-none ${isActive ? 'text-primary' : 'text-muted'}`}>
                  <UserCheck size={24} className="d-block mx-auto mb-1" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Clients</span>
                </NavLink>
                <NavLink to="/admin/settings" className={({ isActive }) => `text-center text-decoration-none ${isActive ? 'text-primary' : 'text-muted'}`}>
                  <Settings size={24} className="d-block mx-auto mb-1" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Settings</span>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/employee/orders" className={({ isActive }) => `text-center text-decoration-none ${isActive ? 'text-primary' : 'text-muted'}`}>
                  <ShoppingCart size={24} className="d-block mx-auto mb-1" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>My Orders</span>
                </NavLink>
                {user?.name?.toLowerCase() !== 'staff 2' && (
                  <NavLink to="/clients" className={({ isActive }) => `text-center text-decoration-none ${isActive ? 'text-primary' : 'text-muted'}`}>
                    <UserCheck size={24} className="d-block mx-auto mb-1" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Clients</span>
                  </NavLink>
                )}
                <NavLink to="/employee/settings" className={({ isActive }) => `text-center text-decoration-none ${isActive ? 'text-primary' : 'text-muted'}`}>
                  <Settings size={24} className="d-block mx-auto mb-1" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Settings</span>
                </NavLink>
              </>
            )}
          </div>
        </Col>
      </Row>

      {/* Styled Logout Confirmation Modal */}
      <Modal backdrop="static" show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered size="sm" contentClassName="border-0 rounded-4 shadow-lg">
        <Modal.Body className="p-4 text-center">
          <div className="mb-3 d-flex justify-content-center">
            <div className="bg-danger bg-opacity-10 text-danger p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
              <LogOut size={28} />
            </div>
          </div>
          <h5 className="fw-bold mb-2">Sign Out</h5>
          <p className="text-muted small mb-4">Are you sure you want to log out?</p>
          <div className="d-flex justify-content-center gap-2">
            <Button variant="light" size="sm" className="px-3 fw-medium w-50" onClick={() => setShowLogoutModal(false)}>Cancel</Button>
            <Button variant="danger" size="sm" className="px-3 fw-medium shadow-sm w-50" onClick={confirmLogout}>Log Out</Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Layout;
