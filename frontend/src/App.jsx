import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManageEmployees from './pages/ManageEmployees';
import ManageOrders from './pages/ManageOrders';
import OrderDetails from './pages/OrderDetails';
import Settings from './pages/Settings';
const PrivateRoute = ({ children, role }) => {
  const { user, loading, logout } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" />;

  if (role && user.role !== role) {
    return (
      <div className="p-5 text-center">
        <h4>Unauthorized Access</h4>
        <p>You don't have permission to view this page.</p>
        <button className="btn btn-primary" onClick={() => { logout(); window.location.href = '/login'; }}>Logout</button>
      </div>
    );
  }

  return children;
};

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        
        <Route path="/" element={
          <Navigate to={user ? (user.role === 'Admin' ? '/admin/dashboard' : '/employee/orders') : '/login'} />
        } />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<PrivateRoute role="Admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/employees" element={<PrivateRoute role="Admin"><ManageEmployees /></PrivateRoute>} />
        <Route path="/admin/orders" element={<PrivateRoute role="Admin"><ManageOrders /></PrivateRoute>} />
        <Route path="/admin/settings" element={<PrivateRoute role="Admin"><Settings /></PrivateRoute>} />

        {/* Employee Routes */}
        <Route path="/employee/orders" element={<PrivateRoute role="Employee"><EmployeeDashboard /></PrivateRoute>} />
        <Route path="/employee/settings" element={<PrivateRoute role="Employee"><Settings /></PrivateRoute>} />
        
        {/* Shared Routes */}
        <Route path="/orders/:id" element={<PrivateRoute><OrderDetails /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
