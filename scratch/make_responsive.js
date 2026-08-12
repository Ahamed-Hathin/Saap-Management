const fs = require('fs');
const path = require('path');

const makeResponsive = () => {
  const filePath = path.join(__dirname, '..', 'frontend/src/pages/AttendanceDashboard.jsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // Change ButtonGroup to div
  content = content.replace(/<ButtonGroup/g, '<div');
  content = content.replace(/<\/ButtonGroup>/g, '</div>');

  // Update the wrapper class to use flex-wrap and gap
  content = content.replace(
    /className="ms-md-5 shadow-sm rounded-pill"/,
    'className="d-flex flex-wrap gap-2 mt-3 mt-md-0"'
  );

  // Make all buttons pill-shaped individually instead of grouped pills
  content = content.replace(/rounded-start-pill/g, 'rounded-pill shadow-sm');
  content = content.replace(/className=\{\`px-4 \$\{user\?\.role !== 'Admin' \? 'rounded-end-pill' : ''\} \$\{location\.pathname === '\/admin\/attendance' \? '' : 'text-muted'\}\`\}/, 'className={`px-4 rounded-pill shadow-sm ${location.pathname === \'/admin/attendance\' ? \'\' : \'text-muted\'}`}');
  content = content.replace(/rounded-end-pill/g, 'rounded-pill shadow-sm');

  // In the top header container, also ensure it wraps well
  // The header is currently: <div className="d-flex flex-column flex-md-row align-items-md-center align-items-start flex-grow-1 gap-3">
  // That seems fine.

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Made AttendanceDashboard buttons responsive');
};

makeResponsive();
