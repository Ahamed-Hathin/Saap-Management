const fs = require('fs');
const path = require('path');

const fixDashboard = () => {
  const filePath = path.join(__dirname, '..', 'frontend/src/pages/AttendanceDashboard.jsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add Context
  content = content.replace(
    /import api from '\.\.\/services\/api';/,
    "import api from '../services/api';\nimport { AuthContext } from '../context/AuthContext';\nimport { useContext } from 'react';"
  );
  content = content.replace(
    /const AttendanceDashboard = \(\) => \{/,
    "const AttendanceDashboard = () => {\n  const { user } = useContext(AuthContext);"
  );

  // 2. Replace the ButtonGroup area entirely
  const oldButtonGroup = `<ButtonGroup className="ms-md-5 shadow-sm rounded-pill">
            <Button 
              variant={location.pathname === '/admin/my-attendance' ? 'primary' : 'light'} 
              className={\`px-4 rounded-start-pill \${location.pathname === '/admin/my-attendance' ? '' : 'text-muted'}\`}
              onClick={() => navigate('/admin/my-attendance')}
            >
              My Time Tracking
            </Button>
            <Button 
              variant={location.pathname === '/admin/attendance' ? 'primary' : 'light'} 
              className={\`px-4 rounded-end-pill \${location.pathname === '/admin/attendance' ? '' : 'text-muted'}\`}
              onClick={() => navigate('/admin/attendance')}
            >
              Manage Time Tracking
            </Button>
          </ButtonGroup>`;

  const newButtonGroup = `<div className="d-flex flex-wrap gap-2 mt-3 mt-md-0">
            <Button 
              variant={location.pathname === '/admin/my-attendance' ? 'primary' : 'light'} 
              className={\`px-4 rounded-pill shadow-sm \${location.pathname === '/admin/my-attendance' ? '' : 'text-muted'}\`}
              onClick={() => navigate('/admin/my-attendance')}
            >
              My Time Tracking
            </Button>
            <Button 
              variant={location.pathname === '/admin/attendance' ? 'primary' : 'light'} 
              className={\`px-4 rounded-pill shadow-sm \${location.pathname === '/admin/attendance' ? '' : 'text-muted'}\`}
              onClick={() => navigate('/admin/attendance')}
            >
              Manage Time Tracking
            </Button>
            {user?.role === 'Admin' && (
              <Button 
                variant={location.pathname === '/admin/attendance/overall' ? 'primary' : 'light'} 
                className={\`px-4 rounded-pill shadow-sm \${location.pathname === '/admin/attendance/overall' ? '' : 'text-muted'}\`}
                onClick={() => navigate('/admin/attendance/overall')}
              >
                Overall Monthly
              </Button>
            )}
          </div>`;

  if (content.includes('ButtonGroup className="ms-md-5 shadow-sm rounded-pill"')) {
    content = content.replace(oldButtonGroup, newButtonGroup);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed AttendanceDashboard');
};

fixDashboard();
