const fs = require('fs');
const path = require('path');

const updateOverallMonthly = () => {
  const filePath = path.join(__dirname, '..', 'frontend/src/pages/OverallMonthlyAttendance.jsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add Search state
  if (!content.includes('const [searchTerm, setSearchTerm]')) {
    content = content.replace(
      'const [loading, setLoading] = useState(true);',
      'const [loading, setLoading] = useState(true);\n  const [searchTerm, setSearchTerm] = useState(\'\');'
    );
  }

  // 2. Add Search input in the UI
  const gap2Regex = /<div className="d-flex gap-2">/;
  if (content.match(gap2Regex) && !content.includes('placeholder="Search employee..."')) {
    const searchHtml = `<div className="d-flex gap-2 align-items-center">
          <div className="position-relative">
            <Search size={18} className="position-absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <Form.Control
              type="text"
              placeholder="Search employee..."
              className="shadow-sm rounded-pill border-0 ps-5 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '200px' }}
            />
          </div>
          <Form.Select`;
    content = content.replace(
      /<div className="d-flex gap-2">\s*<Form\.Select/,
      searchHtml
    );
  }

  // 3. Add filtering logic before rendering
  if (!content.includes('const filteredRecords = records.filter')) {
    content = content.replace(
      'return (',
      `const filteredRecords = records.filter(record => 
    record.employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (`
    );
  }

  // 4. Use filteredRecords instead of records in the map
  content = content.replace(/records\.length === 0/g, 'filteredRecords.length === 0');
  content = content.replace(/records\.map\(/g, 'filteredRecords.map(');

  // 5. Fix the route for "View Daily"
  content = content.replace(
    /onClick=\{\(\) => navigate\(\`\/admin\/attendance\/monthly\/\$\{record\.employee\._id\}\`\)\}/g,
    'onClick={() => navigate(`/admin/attendance/employee/${record.employee._id}/monthly`)}'
  );

  // Also replace Search import if we removed it or need it
  // Actually, Search is already imported from lucide-react

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated OverallMonthlyAttendance.jsx');
};

updateOverallMonthly();
