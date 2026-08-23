const fs = require('fs');

const appPath = 'frontend/src/App.jsx';
let appContent = fs.readFileSync(appPath, 'utf8');

// 1. Update PrivateRoute in App.jsx
const oldPrivateRoute = `const PrivateRoute = ({ children, role, excludeUser }) => {
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

  if (excludeUser && user.name?.toLowerCase() === excludeUser.toLowerCase()) {
    return (
      <div className="p-5 text-center">
        <h4>Unauthorized Access</h4>
        <p>You don't have permission to view this page.</p>
        <button className="btn btn-primary" onClick={() => { logout(); window.location.href = '/login'; }}>Logout</button>
      </div>
    );
  }

  return children;
};`;

const newPrivateRoute = `const PrivateRoute = ({ children, role, excludeUser, requiredPage }) => {
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
  
  if (user.role === 'Admin') return children;

  if (requiredPage && (!user.accessiblePages || !user.accessiblePages.includes(requiredPage))) {
    return (
      <div className="p-5 text-center">
        <h4>Unauthorized Access</h4>
        <p>You don't have permission to view this page.</p>
        <button className="btn btn-primary" onClick={() => { logout(); window.location.href = '/login'; }}>Logout</button>
      </div>
    );
  }

  if (excludeUser && user.name?.toLowerCase() === excludeUser.toLowerCase()) {
    return (
      <div className="p-5 text-center">
        <h4>Unauthorized Access</h4>
        <p>You don't have permission to view this page.</p>
        <button className="btn btn-primary" onClick={() => { logout(); window.location.href = '/login'; }}>Logout</button>
      </div>
    );
  }

  return children;
};`;

if (appContent.includes('const PrivateRoute = ({ children, role, excludeUser }) => {')) {
  appContent = appContent.replace(oldPrivateRoute, newPrivateRoute);
}

// Update routes in App.jsx
appContent = appContent.replace(
  '<Route path="/employee/orders" element={<PrivateRoute role="Employee"><EmployeeDashboard /></PrivateRoute>} />',
  '<Route path="/employee/orders" element={<PrivateRoute role="Employee" requiredPage="Orders"><EmployeeDashboard /></PrivateRoute>} />'
);
appContent = appContent.replace(
  '<Route path="/employee/user/:id" element={<PrivateRoute role="Employee"><EmployeeDashboard /></PrivateRoute>} />',
  '<Route path="/employee/user/:id" element={<PrivateRoute role="Employee" requiredPage="Other Employees"><EmployeeDashboard /></PrivateRoute>} />'
);
appContent = appContent.replace(
  '<Route path="/employee/tasks" element={<PrivateRoute role="Employee"><Tasks /></PrivateRoute>} />',
  '<Route path="/employee/tasks" element={<PrivateRoute role="Employee" requiredPage="Tasks"><Tasks /></PrivateRoute>} />'
);
appContent = appContent.replace(
  '<Route path="/employee/settings" element={<PrivateRoute role="Employee"><Settings /></PrivateRoute>} />',
  '<Route path="/employee/settings" element={<PrivateRoute role="Employee" requiredPage="Settings"><Settings /></PrivateRoute>} />'
);
appContent = appContent.replace(
  '<Route path="/employee/attendance" element={<PrivateRoute role="Employee"><MyAttendance /></PrivateRoute>} />',
  '<Route path="/employee/attendance" element={<PrivateRoute role="Employee" requiredPage="Time Tracking"><MyAttendance /></PrivateRoute>} />'
);
appContent = appContent.replace(
  '<Route path="/clients" element={<PrivateRoute excludeUser="staff 2"><ManageClients /></PrivateRoute>} />',
  '<Route path="/clients" element={<PrivateRoute requiredPage="Clients"><ManageClients /></PrivateRoute>} />'
);
appContent = appContent.replace(
  '<Route path="/clients/:id" element={<PrivateRoute excludeUser="staff 2"><ClientDetails /></PrivateRoute>} />',
  '<Route path="/clients/:id" element={<PrivateRoute requiredPage="Clients"><ClientDetails /></PrivateRoute>} />'
);
appContent = appContent.replace(
  '<Route path="/client-orders" element={<PrivateRoute excludeUser="staff 2"><ClientOrders /></PrivateRoute>} />',
  '<Route path="/client-orders" element={<PrivateRoute requiredPage="Clients"><ClientOrders /></PrivateRoute>} />'
);
appContent = appContent.replace(
  '<Route path="/quotation" element={<PrivateRoute><Quotation /></PrivateRoute>} />',
  '<Route path="/quotation" element={<PrivateRoute requiredPage="Quotation"><Quotation /></PrivateRoute>} />'
);

fs.writeFileSync(appPath, appContent);
console.log('Updated App.jsx');

// 2. Update Layout.jsx
const layoutPath = 'frontend/src/components/Layout.jsx';
let layoutContent = fs.readFileSync(layoutPath, 'utf8');

// The renderNavLinks block for Employees starts at:
//       ) : (
//         <>
//           <NavLink to="/employee/orders"
const layoutEmployeeNavOld = `      ) : (
        <>
          <NavLink to="/employee/orders" className={({ isActive }) => \`nav-link \${isActive ? 'active' : ''}\`} onClick={() => setShowMobileMenu(false)}>
            <ShoppingCart className="me-3" size={20} /> My Orders
          </NavLink>
          {employees.map(emp => (
            <NavLink key={emp._id} to={\`/employee/user/\${emp._id}\`} state={{ employeeName: emp.name }} className={({ isActive }) => \`nav-link \${isActive ? 'active' : ''}\`} onClick={() => setShowMobileMenu(false)}>
              <Users className="me-3" size={20} /> {emp.name}
            </NavLink>
          ))}
          <NavLink to="/employee/tasks" className={({ isActive }) => \`nav-link \${isActive ? 'active' : ''}\`} onClick={() => setShowMobileMenu(false)}>
            <ClipboardList className="me-3" size={20} /> Tasks
          </NavLink>
          {user?.name?.toLowerCase() !== 'staff 2' && (
            <NavLink to="/clients" className={({ isActive }) => \`nav-link \${isActive ? 'active' : ''}\`} onClick={() => setShowMobileMenu(false)}>
              <UserCheck className="me-3" size={20} /> Clients
            </NavLink>
          )}
          <NavLink to="/quotation" className={({ isActive }) => \`nav-link \${isActive ? 'active' : ''}\`} onClick={() => setShowMobileMenu(false)}>
            <FileText className="me-3" size={20} /> Quotation
          </NavLink>
          <NavLink to="/employee/settings" className={({ isActive }) => \`nav-link \${isActive ? 'active' : ''}\`} onClick={() => setShowMobileMenu(false)}>
            <Settings className="me-3" size={20} /> Settings
          </NavLink>
          <NavLink to="/employee/attendance" className={({ isActive }) => \`nav-link d-none d-md-block \${isActive ? 'active' : ''}\`} onClick={() => setShowMobileMenu(false)}>
            <Clock className="me-3" size={20} /> My Time Tracking
          </NavLink>
        </>
      )}`;

const layoutEmployeeNavNew = `      ) : (
        <>
          {(!user.accessiblePages || user.accessiblePages.includes('Orders')) && (
            <NavLink to="/employee/orders" className={({ isActive }) => \`nav-link \${isActive ? 'active' : ''}\`} onClick={() => setShowMobileMenu(false)}>
              <ShoppingCart className="me-3" size={20} /> My Orders
            </NavLink>
          )}
          {(!user.accessiblePages || user.accessiblePages.includes('Other Employees')) && employees.map(emp => (
            <NavLink key={emp._id} to={\`/employee/user/\${emp._id}\`} state={{ employeeName: emp.name }} className={({ isActive }) => \`nav-link \${isActive ? 'active' : ''}\`} onClick={() => setShowMobileMenu(false)}>
              <Users className="me-3" size={20} /> {emp.name}
            </NavLink>
          ))}
          {(!user.accessiblePages || user.accessiblePages.includes('Tasks')) && (
            <NavLink to="/employee/tasks" className={({ isActive }) => \`nav-link \${isActive ? 'active' : ''}\`} onClick={() => setShowMobileMenu(false)}>
              <ClipboardList className="me-3" size={20} /> Tasks
            </NavLink>
          )}
          {(!user.accessiblePages || user.accessiblePages.includes('Clients')) && (
            <NavLink to="/clients" className={({ isActive }) => \`nav-link \${isActive ? 'active' : ''}\`} onClick={() => setShowMobileMenu(false)}>
              <UserCheck className="me-3" size={20} /> Clients
            </NavLink>
          )}
          {(!user.accessiblePages || user.accessiblePages.includes('Quotation')) && (
            <NavLink to="/quotation" className={({ isActive }) => \`nav-link \${isActive ? 'active' : ''}\`} onClick={() => setShowMobileMenu(false)}>
              <FileText className="me-3" size={20} /> Quotation
            </NavLink>
          )}
          {(!user.accessiblePages || user.accessiblePages.includes('Settings')) && (
            <NavLink to="/employee/settings" className={({ isActive }) => \`nav-link \${isActive ? 'active' : ''}\`} onClick={() => setShowMobileMenu(false)}>
              <Settings className="me-3" size={20} /> Settings
            </NavLink>
          )}
          {(!user.accessiblePages || user.accessiblePages.includes('Time Tracking')) && (
            <NavLink to="/employee/attendance" className={({ isActive }) => \`nav-link d-none d-md-block \${isActive ? 'active' : ''}\`} onClick={() => setShowMobileMenu(false)}>
              <Clock className="me-3" size={20} /> My Time Tracking
            </NavLink>
          )}
        </>
      )}`;

if (layoutContent.includes('user?.name?.toLowerCase() !== \'staff 2\'')) {
  layoutContent = layoutContent.replace(layoutEmployeeNavOld, layoutEmployeeNavNew);
}

const layoutMobileEmployeeNavOld = `            ) : (
              <>
                <NavLink to="/employee/orders" className={({ isActive }) => \`text-center text-decoration-none \${isActive ? 'text-primary' : 'text-muted'}\`}>
                  <ShoppingCart size={24} className="d-block mx-auto mb-1" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>My Orders</span>
                </NavLink>
                {user?.name?.toLowerCase() !== 'staff 2' && (
                  <NavLink to="/clients" className={({ isActive }) => \`text-center text-decoration-none \${isActive ? 'text-primary' : 'text-muted'}\`}>
                    <UserCheck size={24} className="d-block mx-auto mb-1" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Clients</span>
                  </NavLink>
                )}
                <NavLink to="/employee/settings" className={({ isActive }) => \`text-center text-decoration-none \${isActive ? 'text-primary' : 'text-muted'}\`}>
                  <Settings size={24} className="d-block mx-auto mb-1" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Settings</span>
                </NavLink>
              </>
            )}`;

const layoutMobileEmployeeNavNew = `            ) : (
              <>
                {(!user.accessiblePages || user.accessiblePages.includes('Orders')) && (
                  <NavLink to="/employee/orders" className={({ isActive }) => \`text-center text-decoration-none \${isActive ? 'text-primary' : 'text-muted'}\`}>
                    <ShoppingCart size={24} className="d-block mx-auto mb-1" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>My Orders</span>
                  </NavLink>
                )}
                {(!user.accessiblePages || user.accessiblePages.includes('Clients')) && (
                  <NavLink to="/clients" className={({ isActive }) => \`text-center text-decoration-none \${isActive ? 'text-primary' : 'text-muted'}\`}>
                    <UserCheck size={24} className="d-block mx-auto mb-1" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Clients</span>
                  </NavLink>
                )}
                {(!user.accessiblePages || user.accessiblePages.includes('Settings')) && (
                  <NavLink to="/employee/settings" className={({ isActive }) => \`text-center text-decoration-none \${isActive ? 'text-primary' : 'text-muted'}\`}>
                    <Settings size={24} className="d-block mx-auto mb-1" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Settings</span>
                  </NavLink>
                )}
              </>
            )}`;

if (layoutContent.includes('user?.name?.toLowerCase() !== \'staff 2\'')) {
  layoutContent = layoutContent.replace(layoutMobileEmployeeNavOld, layoutMobileEmployeeNavNew);
}

fs.writeFileSync(layoutPath, layoutContent);
console.log('Updated Layout.jsx');
