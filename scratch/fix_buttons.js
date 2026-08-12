const fs = require('fs');
const path = require('path');

const fixButtons = () => {
  const filePath = path.join(__dirname, '..', 'frontend/src/components/AttendanceCard.jsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace Check In block
  content = content.replace(
    /\{\(\!attendance\?\.checkIn\) && \(\s*<Button \s*variant="primary" \s*className="px-4 py-2 rounded-pill d-flex align-items-center shadow-sm"\s*onClick=\{\(\) => handleAction\('checkin', 'Check In', 'Check In Successful'\)\}\s*>\s*<Play size=\{18\} className="me-2" \/> Check In\s*<\/Button>\s*\)\}/,
    `<Button 
              variant="primary" 
              className="px-4 py-2 rounded-pill d-flex align-items-center shadow-sm"
              onClick={() => handleAction('checkin', 'Check In', 'Check In Successful')}
              disabled={!!attendance?.checkIn}
            >
              <Play size={18} className="me-2" /> Check In
            </Button>`
  );

  // Replace Check Out block
  content = content.replace(
    /\{\(attendance\?\.checkIn && \(\!attendance\?\.lunchStart \|\| attendance\?\.lunchEnd\) && \!attendance\?\.checkOut\) && \(\s*<Button \s*variant="danger" \s*className="px-4 py-2 rounded-pill d-flex align-items-center shadow-sm ms-2"\s*onClick=\{\(\) => handleAction\('checkout', 'Check Out', 'Check Out Successful'\)\}\s*>\s*<Square size=\{18\} className="me-2" \/> Check Out\s*<\/Button>\s*\)\}/,
    `<Button 
              variant="danger" 
              className="px-4 py-2 rounded-pill d-flex align-items-center shadow-sm ms-2"
              onClick={() => handleAction('checkout', 'Check Out', 'Check Out Successful')}
              disabled={!attendance?.checkIn || !!attendance?.checkOut || (!!attendance?.lunchStart && !attendance?.lunchEnd) || attendance?.status === 'Paused'}
            >
              <Square size={18} className="me-2" /> Check Out
            </Button>`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed buttons in AttendanceCard.jsx');
};

fixButtons();
