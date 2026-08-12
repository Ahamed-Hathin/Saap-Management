const fs = require('fs');
const path = require('path');

const updateFilters = () => {
  const filePath = path.join(__dirname, '..', 'frontend/src/pages/OverallMonthlyAttendance.jsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace state declarations
  content = content.replace(
    /const \[month, setMonth\] = useState\(currentMonth\);\s*const \[year, setYear\] = useState\(currentYear\);/,
    'const [monthYear, setMonthYear] = useState(`${currentYear}-${currentMonth}`);'
  );

  // 2. Update the API call
  content = content.replace(
    /const res = await api\.get\(`\/attendance\/monthly-all\?month=\$\{month\}&year=\$\{year\}`\);/,
    `const [selectedYear, selectedMonth] = monthYear.split('-');
        const res = await api.get(\`/attendance/monthly-all?month=\${selectedMonth}&year=\${selectedYear}\`);`
  );

  // 3. Update the useEffect dependency array
  content = content.replace(
    /\[month, year, user, navigate\]/g,
    '[monthYear, user, navigate]'
  );

  // 4. Remove the 'months' array as it's no longer needed (optional, but cleaner)
  content = content.replace(/const months = \[[^\]]+\];/s, '');

  // 5. Replace the two Selects with one input type="month"
  const selectRegex = /<Form\.Select[\s\S]*?<\/Form\.Select>\s*<Form\.Select[\s\S]*?<\/Form\.Select>/;
  const newMonthInput = `<Form.Control 
            type="month"
            className="shadow-sm rounded-pill px-3 border-0 bg-white"
            value={monthYear} 
            onChange={(e) => setMonthYear(e.target.value)}
            style={{ width: '160px' }}
          />`;
  content = content.replace(selectRegex, newMonthInput);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated filters in OverallMonthlyAttendance.jsx');
};

updateFilters();
