const fs = require('fs');
const path = require('path');

const moveOverviewButton = () => {
  const filePath = path.join(__dirname, '..', 'frontend/src/pages/AttendanceDashboard.jsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove rounded-end-pill from Manage Time Tracking if admin
  content = content.replace(
    /className=\{\`px-4 rounded-end-pill \$\{location\.pathname === '\/admin\/attendance' \? '' : 'text-muted'\}\`\}/g,
    `className={\`px-4 \${user?.role !== 'Admin' ? 'rounded-end-pill' : ''} \${location.pathname === '/admin/attendance' ? '' : 'text-muted'}\`}`
  );

  // 2. Add Overview Monthly button in ButtonGroup for Admin
  const btnGroupRegex = /<Button \s*variant=\{location\.pathname === '\/admin\/attendance' \? 'primary' : 'light'\}[\s\S]*?Manage Time Tracking\s*<\/Button>/;
  const newBtn = `<Button 
              variant={location.pathname === '/admin/attendance' ? 'primary' : 'light'} 
              className={\`px-4 \${user?.role !== 'Admin' ? 'rounded-end-pill' : ''} \${location.pathname === '/admin/attendance' ? '' : 'text-muted'}\`}
              onClick={() => navigate('/admin/attendance')}
            >
              Manage Time Tracking
            </Button>
            {user?.role === 'Admin' && (
              <Button 
                variant={location.pathname === '/admin/attendance/overall' ? 'primary' : 'light'} 
                className={\`px-4 rounded-end-pill \${location.pathname === '/admin/attendance/overall' ? '' : 'text-muted'}\`}
                onClick={() => navigate('/admin/attendance/overall')}
              >
                Overall Monthly
              </Button>
            )}`;
  
  if (!content.includes('Overall Monthly\n              </Button>')) {
      content = content.replace(btnGroupRegex, newBtn);
  }

  // 3. Remove the Overview Card
  const overviewCardRegex = /\{user\?\.role === 'Admin' && \([\s\S]*?Overall Monthly<\/small>\s*<\/Card\.Body>\s*<\/Card>\s*<\/Col>\s*\)\}/;
  content = content.replace(overviewCardRegex, '');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Moved Overview button in AttendanceDashboard.jsx');
};

moveOverviewButton();
